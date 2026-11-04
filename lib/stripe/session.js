import "server-only";
import { createClient } from "@/lib/supabase/server";

// Session-scoped helpers for the checkout and portal routes. They use the user's own
// Supabase session, so row-level security limits them to that user's entitlement row.

export async function currentUser() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function subscriptionStateFor(userId) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("entitlements")
    .select("status, stripe_customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function stripeCustomerIdFor(userId) {
  const state = await subscriptionStateFor(userId);
  return state?.stripe_customer_id ?? null;
}
