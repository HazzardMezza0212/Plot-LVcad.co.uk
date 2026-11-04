// The one rule for FOV Pro access. Every reader (the /cctv/assets/pro gate in proxy.js,
// the account page, the cameras API, the entitlements hint) and the webhook's cached
// `pro` column go through isProEntitled(), so they can never disagree.
//
// Stripe-managed rows (status is set): Pro is on when the subscription is active or
// trialing, or when it is past_due and still inside the grace window. Anything else
// (canceled, unpaid, incomplete, paused, past_due after the window) is off.
//
// Rows with no Stripe status (manual grants from the SQL editor, or a checkout that
// has not yet reported a subscription) keep whatever `pro` says.
//
// Kept free of imports so it runs in the proxy, route handlers and tests alike.

export const GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const LIVE_STATUSES = new Set(["active", "trialing"]);

export function graceUntilFrom(now) {
  return new Date(now.getTime() + GRACE_DAYS * DAY_MS);
}

export function isProEntitled(row, now = new Date()) {
  if (!row) return false;
  if (row.status == null) return row.pro === true;
  if (LIVE_STATUSES.has(row.status)) return true;
  if (row.status === "past_due") {
    if (!row.grace_until) return false;
    const until = new Date(row.grace_until).getTime();
    return Number.isFinite(until) && until > now.getTime();
  }
  return false;
}

// True for subscription states that count as "in use" when deciding whether a
// second subscription on the same account may take over the entitlement.
export function isInUse(status) {
  return LIVE_STATUSES.has(status) || status === "past_due";
}

// The entitlement fields for one Pro subscription. `sub` is a Stripe subscription read fresh
// from the API; `current` is the existing row ({ status, grace_until }) or null. A subscription
// that has just entered past_due starts a grace window. A repeat past_due keeps the window it
// already has, so Stripe's retries never extend it.
export function stripeEntitlementState(sub, current, now = new Date()) {
  const status = sub.status ?? null;
  let grace_until = null;
  if (status === "past_due") {
    const keep = current?.status === "past_due" && current.grace_until;
    grace_until = keep ? current.grace_until : graceUntilFrom(now).toISOString();
  }
  return {
    status,
    current_period_end: periodEndIso(sub),
    grace_until,
    pro: isProEntitled({ status, grace_until }, now),
  };
}

// Stripe API versions from 2025 onward put current_period_end on the subscription items.
function periodEndIso(sub) {
  const seconds = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}
