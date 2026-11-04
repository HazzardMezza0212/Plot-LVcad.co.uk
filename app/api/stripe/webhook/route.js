import Stripe from "stripe";
import { processStripeWebhook } from "@/lib/stripe/webhook";
import { createStripeStore } from "@/lib/stripe/store";

// Stripe signs the raw bytes, so read the body as text and never parse it first.
// Configure this URL in the Stripe dashboard for the FOV Pro events only.
export async function POST(request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "Stripe webhook isn't configured yet." }, { status: 500 });
  }

  const rawBody = await request.text();
  return processStripeWebhook(rawBody, request.headers.get("stripe-signature"), {
    stripe: new Stripe(key),
    secret,
    db: createStripeStore(),
    now: () => new Date(),
  });
}
