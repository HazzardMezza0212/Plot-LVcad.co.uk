// Verifies a Stripe webhook delivery and applies it. The route passes in the raw body
// text (never parsed JSON), because the signature is computed over the exact bytes.
//
//   stripe  - a Stripe SDK instance (used for constructEvent only)
//   secret  - STRIPE_WEBHOOK_SECRET
//   db      - see subscriptionSync.js
//   now     - () => Date
//
// Returns a Response. 400 for a missing or bad signature. 500 when applying the event
// failed, so Stripe retries it. 200 for everything handled or deliberately ignored.
// Logs only the event type and error codes, never payloads or keys.

import { handleStripeEvent } from "./subscriptionSync.js";

const json = (body, status) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function processStripeWebhook(rawBody, signature, { stripe, secret, db, now = () => new Date() }) {
  if (!signature) return json({ error: "Invalid signature." }, 400);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature check failed:", err?.type || "error");
    return json({ error: "Invalid signature." }, 400);
  }

  try {
    await handleStripeEvent(event, { db, now: now() });
    return json({ received: true }, 200);
  } catch (err) {
    console.error("[stripe webhook] could not apply event:", event.type, err?.code || "error");
    return json({ error: "Could not process event." }, 500);
  }
}
