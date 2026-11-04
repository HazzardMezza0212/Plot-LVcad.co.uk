// POST /api/checkout: starts a Stripe Checkout session for a subscription.
// It grants nothing. Pro is only switched on by the webhook.
//
// deps:
//   enabled        - CHECKOUT_ENABLED (false until launch)
//   getUser()      - signed-in Supabase user or null
//   guard(request) - same-origin, rate limit and JSON body check; { response } or { body }
//   getStripe()    - Stripe instance, or null when STRIPE_SECRET_KEY is missing
//   getSubscriptionState(userId) - { status, stripe_customer_id } from the entitlement row, or null
//   priceIds       - { monthly, annual }
//   siteUrl        - absolute site origin
//
// One subscription per customer: checkout is refused while the account has a subscription
// in use, whether the database row or Stripe itself shows it.

import { isInUse } from "./entitlement.js";

const PLANS = ["monthly", "annual"];
const IN_USE_STATUSES = ["active", "trialing", "past_due"];
const ALREADY = "You already have a FOV Pro subscription. Manage it from your account.";
const json = (body, status) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function handleCheckout(request, deps) {
  if (!deps.enabled) {
    return json({ error: "Checkout isn't open yet — register your interest instead." }, 503);
  }

  const user = await deps.getUser();
  if (!user) return json({ error: "Please log in to subscribe." }, 401);

  const guard = await deps.guard(request);
  if (guard.response) return guard.response;

  const plan = guard.body?.plan;
  if (typeof plan !== "string" || !PLANS.includes(plan)) {
    return json({ error: "Select a plan first." }, 400);
  }

  const price = deps.priceIds?.[plan];
  const stripe = deps.getStripe();
  if (!price || !stripe) {
    return json({ error: "Checkout isn't available right now. Please try again later." }, 503);
  }

  const state = await deps.getSubscriptionState(user.id);
  if (state && isInUse(state.status)) return json({ error: ALREADY }, 409);

  const customerId = state?.stripe_customer_id ?? null;
  if (customerId) {
    let live;
    try {
      live = await anyLiveSubscription(stripe, customerId);
    } catch (err) {
      console.error("[checkout] could not check existing subscriptions:", err?.type || "error");
      return json({ error: "Couldn't start checkout. Please try again." }, 502);
    }
    if (live) return json({ error: ALREADY }, 409);
  }

  const who = customerId
    ? { customer: customerId }
    : user.email
      ? { customer_email: user.email }
      : {};

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: user.id,
      ...who,
      allow_promotion_codes: true,
      consent_collection: { terms_of_service: "required" },
      custom_fields: [
        {
          key: "company_or_trading_name",
          label: { type: "custom", custom: "Company or trading name" },
          type: "text",
          optional: false,
        },
      ],
      // Copied onto the subscription so subscription events can find the user even if
      // they arrive before checkout.session.completed.
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${deps.siteUrl}/account?upgraded=1`,
      cancel_url: `${deps.siteUrl}/account`,
    });
  } catch (err) {
    console.error("[checkout] could not create session:", err?.type || "error");
    return json({ error: "Couldn't start checkout. Please try again." }, 502);
  }

  return json({ url: session.url }, 200);
}

// Asks Stripe directly, so a subscription that the database has not caught up with yet
// (for example, one started moments ago in another tab) still blocks a second purchase.
async function anyLiveSubscription(stripe, customerId) {
  for (const status of IN_USE_STATUSES) {
    const list = await stripe.subscriptions.list({ customer: customerId, status, limit: 1 });
    if (list.data.length > 0) return true;
  }
  return false;
}
