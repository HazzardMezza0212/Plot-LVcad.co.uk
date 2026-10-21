// Supabase settings come from environment variables (set them in Vercel →
// Project → Settings → Environment Variables). Until both are present the
// site runs in "guest mode": sign-up/login pages explain that accounts are
// being switched on, and the CCTV tool stays open to everyone.
//
// Supabase now calls the public key the "publishable" key (sb_publishable_…);
// older projects call it the "anon" key. Either variable name works.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Only allow redirects back into this site (never to another domain).
export function safeNextPath(next, fallback = "/account") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}
