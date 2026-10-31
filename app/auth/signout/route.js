import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";

export async function POST(request) {
  // Stops another site logging visitors out (cross-site form post).
  if (!isSameOrigin(request)) return new NextResponse("Not allowed.", { status: 403 });
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login?status=signedout", request.url), { status: 303 });
}
