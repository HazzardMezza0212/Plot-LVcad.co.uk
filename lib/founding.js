import "server-only";
import Stripe from "stripe";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

// FOV Founding 20: settings shared by the checkout, webhook, portal and pages.
//
// Environment variables (Vercel → Settings → Environment Variables):
//   FOUNDING_CHECKOUT_ENABLED = 1          switch: without it nobody can buy
//   STRIPE_SECRET_KEY                      sk_test_… while testing, sk_live_… for real
//   STRIPE_PRICE_ID_FOUNDING               price_… of the £99/year price (same mode as the key)
//   STRIPE_FOUNDING_WEBHOOK_SECRET         whsec_… of the /api/stripe/webhook endpoint
//   STRIPE_AUTOMATIC_TAX = 1               charge UK VAT with Stripe Tax (needs Tax set up in Stripe)
//   SUPABASE_SECRET_KEY                    sb_secret_… (server only)

export const FOUNDING_SEATS = 20;
export const FOUNDING_PRICE_LABEL = "£99 + VAT a year";

const SECRET = process.env.STRIPE_SECRET_KEY || "";
export const PRICE_ID = process.env.STRIPE_PRICE_ID_FOUNDING || "";

// Test-mode keys sell test seats; live keys sell real ones. Counted separately.
export const LIVEMODE = /^(sk|rk)_live_/.test(SECRET);

export const isFoundingConfigured = Boolean(SECRET && PRICE_ID && isAdminConfigured);
export const isFoundingOpen = process.env.FOUNDING_CHECKOUT_ENABLED === "1" && isFoundingConfigured;
// Preview builds only: which settings are missing, by name (never values), so
// a half-configured preview says why checkout is off. Always [] in production.
export function missingFoundingSettings() {
  if (process.env.VERCEL_ENV === "production") return [];
  const checks = [
    ["FOUNDING_CHECKOUT_ENABLED (must be exactly 1)", process.env.FOUNDING_CHECKOUT_ENABLED === "1"],
    ["STRIPE_SECRET_KEY", Boolean(SECRET)],
    ["STRIPE_PRICE_ID_FOUNDING", Boolean(PRICE_ID)],
    ["SUPABASE_SECRET_KEY", isAdminConfigured],
    ["NEXT_PUBLIC_SUPABASE_URL", Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL)],
    ["STRIPE_FOUNDING_WEBHOOK_SECRET", Boolean(process.env.STRIPE_FOUNDING_WEBHOOK_SECRET)],
  ];
  return checks.filter(([, ok]) => !ok).map(([name]) => name);
}

export const useAutomaticTax = process.env.STRIPE_AUTOMATIC_TAX === "1";

let stripe = null;
export function getStripe() {
  if (!SECRET) return null;
  if (!stripe) stripe = new Stripe(SECRET);
  return stripe;
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}

/** Seats left in the current mode, or null if it can't be read. */
export async function seatsLeft(supabase) {
  const client = supabase || createAdminClient();
  if (!client) return null;
  const { data, error } = await client.rpc("founding_seats_left", { p_livemode: LIVEMODE });
  return error ? null : data;
}

/** The signed-in user's own seat in the current mode (active first), or null. */
export async function mySeat(supabase, userId) {
  if (!supabase || !userId) return null;
  const { data } = await supabase
    .from("founding_members")
    .select("status, seat_no, paid_at, cancelled_at, stripe_customer_id")
    .eq("user_id", userId)
    .eq("livemode", LIVEMODE)
    .in("status", ["active", "cancelled"])
    .order("paid_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}
