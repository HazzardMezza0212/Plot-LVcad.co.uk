import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from "@/lib/supabase/config";

// Runs before the routes in `config.matcher` (including the static CCTV tool
// in public/cctv). It refreshes the Supabase session cookie and:
//   - sends signed-out visitors from /cctv and /account to /login
//   - sends signed-in visitors from /login and /signup to /account
// In guest mode (no Supabase env vars yet) it does nothing, so the CCTV tool
// stays reachable while accounts are being set up.
//
// Note: this gates the tool's entry page, not its code. The JS bundle is a
// public static file, as it is for any browser app.

export async function proxy(request) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // getClaims() validates the session JWT (and refreshes it if needed).
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const isProtected = pathname === "/cctv" || pathname.startsWith("/cctv/") || pathname === "/account" || pathname.startsWith("/account/");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // Guests (who chose "Continue as guest") may open the tool, not the account area.
  const isTool = pathname === "/cctv" || pathname.startsWith("/cctv/");
  const isGuest = request.cookies.get("plv_guest")?.value === "1";

  if (isProtected && !signedIn && !(isTool && isGuest)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return redirectKeepingCookies(url, response);
  }

  if (isAuthPage && signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return redirectKeepingCookies(url, response);
  }

  return response;
}

// A redirect must carry any refreshed session cookies, or the browser loses them.
function redirectKeepingCookies(url, from) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: [
    "/cctv",
    "/cctv/index.html",
    "/account",
    "/account/:path*",
    "/login",
    "/signup",
  ],
};
