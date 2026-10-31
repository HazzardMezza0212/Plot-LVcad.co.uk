import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Supabase with the secret (service-role) key. Bypasses row-level security, so
// it is only ever used in server code that has already decided the caller is
// allowed: the Founding 20 checkout (after checking the signed-in user) and the
// Stripe webhook (after checking Stripe's signature). Never import this from a
// client component; the "server-only" import above makes that a build error.
//
// Set SUPABASE_SECRET_KEY in Vercel (Supabase → Project Settings → API Keys →
// secret key, sb_secret_…). The older SUPABASE_SERVICE_ROLE_KEY name works too.
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isAdminConfigured = Boolean(SUPABASE_URL && SECRET_KEY);

export function createAdminClient() {
  if (!isAdminConfigured) return null;
  return createClient(SUPABASE_URL, SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
