import { NextResponse } from "next/server";

// "Continue as guest": remembers the choice with a small cookie so the
// login gate on /cctv lets this browser through, then opens the tool.
// Nothing about the guest is stored on our side.
const GUEST_COOKIE = "plv_guest";

export function GET(request) {
  const response = NextResponse.redirect(new URL("/cctv", request.url), { status: 303 });
  response.cookies.set(GUEST_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
