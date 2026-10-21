import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/config";

// Landing point for links in Supabase emails (sign-up confirmation and
// password reset). Handles both link styles:
//   ?code=…                 PKCE flow (default for @supabase/ssr)
//   ?token_hash=…&type=…    if the email template is customised to use it
export async function GET(request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  const supabase = await createClient();
  if (!supabase) return NextResponse.redirect(new URL("/", url));

  let error = null;
  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }));
  } else {
    error = new Error("missing token");
  }

  if (error) {
    // Supabase has usually confirmed the email already; the session just
    // couldn't be created here (e.g. link opened in another browser).
    return NextResponse.redirect(new URL("/login?error=link", url));
  }
  return NextResponse.redirect(new URL(next, url));
}
