import { NextResponse } from "next/server";

// plotlvcad.co.uk/try: the short link used in outreach emails. Same as
// "Continue as guest" (sets the guest cookie so /cctv lets this browser in),
// then opens the tool with ?via=try so analytics can count these visits
// (the tool's page view records the full address). The tool ignores the query.
const GUEST_COOKIE = "plv_guest";

export function GET(request) {
  const response = NextResponse.redirect(new URL("/cctv?via=try", request.url), { status: 303 });
  response.cookies.set(GUEST_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
