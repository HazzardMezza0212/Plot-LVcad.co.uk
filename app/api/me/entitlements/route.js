import { createClient } from "@/lib/supabase/server";

// "Does the signed-in visitor have FOV Pro?" Read by the FOV tool at /cctv on load.
// Uses the session cookie; guests, signed-out visitors and any error all answer
// { pro: false }. Only a UI hint for the tool: Pro status itself is the row in
// public.entitlements, which users can read (own row) but never write.

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
    if (!user) return Response.json({ pro: false }, { headers: NO_STORE });

    const { data, error } = await supabase
      .from("entitlements")
      .select("pro")
      .eq("user_id", user.id)
      .maybeSingle();
    return Response.json({ pro: !error && data?.pro === true }, { headers: NO_STORE });
  } catch {
    return Response.json({ pro: false }, { headers: NO_STORE });
  }
}
