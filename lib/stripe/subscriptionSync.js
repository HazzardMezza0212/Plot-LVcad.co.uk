// Applies one verified Stripe event to public.entitlements.
//
// Idempotency works on three levels:
//   1. stripe_events records every event id that was handled. A redelivered event
//      is recognised and skipped before anything is written.
//   2. Ordering: each row stores last_event_created, the Stripe event time it was last
//      written from. An event older than that is stale and is ignored, so a late
//      delivery cannot overwrite newer state.
//   3. Every write is keyed on the user and the Stripe object it describes, and is
//      skipped when the stored values (including the ordering marker) already match.
//
// `db` is a small interface (see lib/stripe/store.js for the Supabase version):
//   getEntitlement(userId)        -> row | null
//   findBySubscription(subId)     -> row | null
//   findByCustomer(customerId)    -> row | null
//   saveEntitlement(row)          -> void   (upsert on user_id)
//   hasEvent(eventId)             -> boolean
//   recordEvent(eventId, type)    -> void

import { graceUntilFrom, isInUse, isProEntitled } from "./entitlement.js";

const TERMINAL = new Set(["canceled", "unpaid", "incomplete_expired"]);

// `billing` (optional) cancels and refunds a duplicate subscription: { cancelAndRefund(subId) }.
// Without it a duplicate is left alone, and the caller is told so.
export async function handleStripeEvent(event, { db, now = new Date(), billing = null }) {
  if (await db.hasEvent(event.id)) return { outcome: "duplicate" };
  const ctx = { db, now, eventAt: eventTime(event), billing };
  const outcome = await apply(event, ctx);
  await db.recordEvent(event.id, event.type);
  return { outcome };
}

function eventTime(event) {
  return Number.isFinite(event.created) ? new Date(event.created * 1000) : null;
}

async function apply(event, ctx) {
  const object = event.data?.object ?? {};
  switch (event.type) {
    case "checkout.session.completed":
      return onCheckoutCompleted(object, ctx);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return onSubscription(object, ctx);
    case "invoice.payment_failed":
      return onPaymentFailed(object, ctx);
    default:
      return "ignored";
  }
}

async function onCheckoutCompleted(session, ctx) {
  const userId = session.client_reference_id;
  if (!userId) return "ignored";
  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);
  if (!customerId && !subscriptionId) return "ignored";

  const current = await ctx.db.getEntitlement(userId);
  const patch = {};
  if (customerId) patch.stripe_customer_id = customerId;
  if (subscriptionId) {
    // Repointing at a second subscription while another is in use would hide the first
    // from the entitlement, so only record the customer in that case.
    const recorded = current?.stripe_subscription_id;
    const blocked = recorded && recorded !== subscriptionId && isInUse(current.status);
    if (blocked) {
      console.warn("[stripe webhook] checkout completed for a second subscription; entitlement unchanged");
    } else {
      patch.stripe_subscription_id = subscriptionId;
    }
  }
  if (Object.keys(patch).length === 0) return "ignored";
  return save(ctx, userId, current, patch);
}

async function onSubscription(sub, ctx) {
  const customerId = idOf(sub.customer);
  const userId = sub.metadata?.user_id || (await resolveUser(sub.id, customerId, ctx.db));
  if (!userId) return "ignored";

  const current = await ctx.db.getEntitlement(userId);
  const recorded = current?.stripe_subscription_id ?? null;
  const isCurrent = !recorded || recorded === sub.id;

  // A subscription other than the recorded one may only take over when the recorded
  // one is not in use, and only if this one is itself in use. Otherwise a cancelled
  // old subscription could revoke, or a second live one could replace, the entitlement.
  if (!isCurrent) {
    if (isInUse(current.status)) {
      // A second live subscription for a customer who already has one: cancel it and refund.
      if (!isInUse(sub.status)) return "ignored";
      return cancelDuplicate(ctx, sub);
    }
    if (!isInUse(sub.status)) return "ignored";
  }

  const patch = {
    stripe_customer_id: customerId ?? current?.stripe_customer_id ?? null,
    stripe_subscription_id: sub.id,
    status: sub.status,
    current_period_end: periodEndIso(sub),
    grace_until: sub.status === "past_due" ? graceFor(current, sub.id, ctx.now) : null,
  };
  return save(ctx, userId, current, patch);
}

// The recorded subscription keeps the entitlement. The duplicate is cancelled and its first
// payment refunded. Its own cancellation events are then ignored, because they are not the
// recorded subscription and are no longer live.
async function cancelDuplicate({ billing }, sub) {
  if (!billing) {
    console.warn("[stripe webhook] duplicate live subscription; no billing client, left as is");
    return "ignored";
  }
  const result = await billing.cancelAndRefund(sub.id);
  console.warn("[stripe webhook] duplicate live subscription handled:", result);
  return result;
}

async function onPaymentFailed(invoice, ctx) {
  const subscriptionId =
    idOf(invoice.subscription) ?? idOf(invoice.parent?.subscription_details?.subscription);
  if (!subscriptionId) return "ignored";

  const row = await ctx.db.findBySubscription(subscriptionId);
  if (!row) return "ignored";
  // Never revive a subscription Stripe has already ended.
  if (TERMINAL.has(row.status)) return "ignored";

  const patch = {
    status: "past_due",
    grace_until: graceFor(row, subscriptionId, ctx.now),
  };
  return save(ctx, row.user_id, row, patch);
}

// Grace starts at the first failed payment and is not extended by later failures or
// retries. Only a fresh failure after recovery starts a new window.
function graceFor(current, subscriptionId, now) {
  const sameSub = current?.stripe_subscription_id === subscriptionId;
  if (sameSub && current?.status === "past_due" && current.grace_until) return current.grace_until;
  return graceUntilFrom(now).toISOString();
}

async function resolveUser(subscriptionId, customerId, db) {
  const bySub = await db.findBySubscription(subscriptionId);
  if (bySub) return bySub.user_id;
  if (customerId) {
    const byCustomer = await db.findByCustomer(customerId);
    if (byCustomer) return byCustomer.user_id;
  }
  return null;
}

// Merges the patch onto the current row, recomputes `pro`, and writes only when something
// changed. Returns "stale" (older than the row), "unchanged", or "updated".
async function save({ db, now, eventAt }, userId, current, patch) {
  if (eventAt && current?.last_event_created && eventAt < new Date(current.last_event_created)) {
    return "stale";
  }

  const merged = {
    pro: current?.pro === true,
    source: "stripe",
    status: current?.status ?? null,
    stripe_customer_id: current?.stripe_customer_id ?? null,
    stripe_subscription_id: current?.stripe_subscription_id ?? null,
    current_period_end: current?.current_period_end ?? null,
    grace_until: current?.grace_until ?? null,
    ...patch,
  };
  // Advance the ordering marker even when the state is unchanged, so an older event
  // carrying different state cannot slip in behind a newer one.
  merged.last_event_created = eventAt ? eventAt.toISOString() : (current?.last_event_created ?? null);
  merged.pro = isProEntitled(merged, now);

  const unchanged =
    current &&
    current.pro === merged.pro &&
    current.source === merged.source &&
    current.status === merged.status &&
    current.stripe_customer_id === merged.stripe_customer_id &&
    current.stripe_subscription_id === merged.stripe_subscription_id &&
    sameTime(current.current_period_end, merged.current_period_end) &&
    sameTime(current.grace_until, merged.grace_until) &&
    sameTime(current.last_event_created, merged.last_event_created);
  if (unchanged) return "unchanged";

  await db.saveEntitlement({
    user_id: userId,
    ...merged,
    updated_at: now.toISOString(),
  });
  return "updated";
}

function sameTime(a, b) {
  if (a == null || b == null) return a == null && b == null;
  return new Date(a).getTime() === new Date(b).getTime();
}

// Stripe API versions from 2025 onward put current_period_end on the subscription
// items rather than the subscription itself, so read either place.
function periodEndIso(sub) {
  const seconds = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

function idOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.id === "string") return value.id;
  return null;
}
