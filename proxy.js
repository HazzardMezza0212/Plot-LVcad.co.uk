import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_KEY, isSupabaseConfigured } from "@/lib/supabase/config";
import { isProEntitled } from "@/lib/stripe/entitlement";
import { isProPath } from "@/lib/cctv-pro/gate";

// Runs before the routes in `config.matcher` (including the static CCTV tool
// in public/cctv). It refreshes the Supabase session cookie and:
//   - sends signed-out visitors from /cctv and /account to /login
//   - sends signed-in visitors from /login and /signup to /account
//   - serves the tool's Pro code (/cctv/assets/pro/*) to signed-in FOV Pro
//     accounts only, and answers 404 to everyone else
// In guest mode (no Supabase env vars yet) it lets everything else through, so
// the CCTV tool stays reachable while accounts are being set up, but still
// refuses the Pro code.
//
// The tool's free code is a public static file, as it is for any browser app.
// Its Pro code (DXF import, layer mapping, Pro calculations) is built into a
// separate folder so that only paying accounts ever download it.

export async function proxy(request) {
  // Defence in depth: any path that points at Pro code, however it is encoded, takes the Pro check.
  // The route handler (app/cctv/assets/pro/[file]) makes the same check, and the files are not in public/.
  const isProCode = isProPath(request.nextUrl.pathname);
  if (!isSupabaseConfigured) return isProCode ? notFound() : NextResponse.next();

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

  if (isProCode) {
    if (!signedIn) return notFound(response);
    // Row-level security lets a user read only their own entitlement row.
    const { data: ent, error } = await supabase
      .from("entitlements")
      .select("pro, status, grace_until")
      .eq("user_id", data.claims.sub)
      .maybeSingle();
    if (error || !isProEntitled(ent)) return notFound(response);
    // Per-account file: never let a shared cache keep it for the next visitor.
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

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

// Same answer whether the file is missing or the visitor isn't Pro, so the
// response says nothing about who has Pro. Like a redirect, it must carry any
// refreshed session cookies.
function notFound(from) {
  const res = new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  from?.cookies.getAll().forEach((c) => res.cookies.set(c));
  return res;
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
    "/cctv/assets/pro/:path*",
    "/account",
    "/account/:path*",
    "/login",
    "/signup",
  ],
};
