import "server-only";
import Stripe from "stripe";
import { isAdminConfigured } from "@/lib/supabase/admin";

// FOV Pro subscriptions: settings shared by checkout, billing portal and the
// Stripe webhook.
//
// Environment variables (Vercel → Settings → Environment Variables):
//   PRO_CHECKOUT_ENABLED = 1          switch: without it nobody can buy
//   STRIPE_SECRET_KEY                 sk_test_… for previews, sk_live_… for production
//   STRIPE_PRICE_ID_PRO_MONTHLY       price_… of the £19/month price (same mode as the key)
//   STRIPE_PRICE_ID_PRO_YEARLY        price_… of the £199/year price (same mode as the key)
//   STRIPE_PRO_WEBHOOK_SECRET         whsec_… of the /api/stripe/webhook endpoint
//   SUPABASE_SECRET_KEY               sb_secret_… (server only), so the webhook can switch Pro on
//   STRIPE_AUTOMATIC_TAX = 1          optional: charge UK VAT with Stripe Tax
//
// The older Founding 20 names are accepted too, so a Vercel project already
// set up for that preview works without renaming anything:
//   FOUNDING_CHECKOUT_ENABLED      instead of PRO_CHECKOUT_ENABLED
//   STRIPE_FOUNDING_WEBHOOK_SECRET instead of STRIPE_PRO_WEBHOOK_SECRET
//
// No extra database tables: Pro status lives in public.entitlements (as
// before), and each Stripe customer carries metadata.user_id so we can find
// it again for the billing portal.

const SECRET = process.env.STRIPE_SECRET_KEY || "";

export const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || "",
  yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY || "",
};

const CHECKOUT_SWITCH = process.env.PRO_CHECKOUT_ENABLED || process.env.FOUNDING_CHECKOUT_ENABLED || "";
export const WEBHOOK_SECRET = process.env.STRIPE_PRO_WEBHOOK_SECRET || process.env.STRIPE_FOUNDING_WEBHOOK_SECRET || "";

export const LIVEMODE = /^(sk|rk)_live_/.test(SECRET);
export const useAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "1";

export const isProConfigured = Boolean(SECRET && PRICE_IDS.monthly && PRICE_IDS.yearly && isAdminConfigured);
// On the live site checkout also needs the public launch switch, so an old
// Founding setting left on in Production can't open payments early.
const LAUNCHED = process.env.NEXT_PUBLIC_PRO_LIVE === "1" || process.env.VERCEL_ENV !== "production";
export const isProOpen = CHECKOUT_SWITCH === "1" && isProConfigured && LAUNCHED;

/** Preview builds only: names (never values) of missing settings. Always [] in production. */
export function missingProSettings() {
  if (process.env.VERCEL_ENV === "production") return [];
  return [
    ["PRO_CHECKOUT_ENABLED or FOUNDING_CHECKOUT_ENABLED (must be exactly 1)", CHECKOUT_SWITCH === "1"],
    ["STRIPE_SECRET_KEY", Boolean(SECRET)],
    ["STRIPE_PRICE_ID_PRO_MONTHLY", Boolean(PRICE_IDS.monthly)],
    ["STRIPE_PRICE_ID_PRO_YEARLY", Boolean(PRICE_IDS.yearly)],
    ["SUPABASE_SECRET_KEY", isAdminConfigured],
    ["STRIPE_PRO_WEBHOOK_SECRET (or STRIPE_FOUNDING_WEBHOOK_SECRET)", Boolean(WEBHOOK_SECRET)],
  ]
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
}

let stripe = null;
export function getStripe() {
  if (!SECRET) return null;
  if (!stripe) stripe = new Stripe(SECRET);
  return stripe;
}

const ACTIVE = new Set(["active", "trialing", "past_due"]);
export const isActiveStatus = (s) => ACTIVE.has(s);

/** The Stripe customer that belongs to this Plot-LV user, or null. */
export async function findCustomer(stripeClient, userId) {
  if (!stripeClient || !userId) return null;
  const res = await stripeClient.customers.search({ query: `metadata['user_id']:'${userId.replace(/'/g, "")}'`, limit: 1 });
  return res.data[0] || null;
}

/** The user's current Pro subscription (active, trialing or past due), or null. */
export async function currentSubscription(stripeClient, customerId) {
  if (!stripeClient || !customerId) return null;
  const subs = await stripeClient.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
  return subs.data.find((s) => s.metadata?.kind === "pro" && isActiveStatus(s.status)) || null;
}
