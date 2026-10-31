import { NextResponse } from "next/server";

// "Open the planner" / "Continue as guest": remembers the choice with a small
// cookie so the login gate on /cctv lets this browser through, then opens the
// tool. Nothing about the guest is stored on our side.
//
// ?camera=<slug> is passed on to the tool (from "Plan this camera" on the
// camera pages) so it can start with that model selected. Only library-style
// slugs are passed through.
const GUEST_COOKIE = "plv_guest";

export function GET(request) {
  const camera = new URL(request.url).searchParams.get("camera");
  const target = new URL("/cctv", request.url);
  if (camera && /^[a-z0-9-]{1,80}$/.test(camera)) target.searchParams.set("camera", camera);

  const response = NextResponse.redirect(target, { status: 303 });
  response.cookies.set(GUEST_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
