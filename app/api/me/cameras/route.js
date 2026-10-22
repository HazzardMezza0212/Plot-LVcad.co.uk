import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { cleanCameraSpec } from "@/lib/customCamera";

// A Pro user's custom cameras for the FOV tool at /cctv, kept per account in
// public.custom_cameras. Row-level security does the real enforcement (own rows only; adding
// or editing needs Pro; 200 cameras at most). This route adds readable errors and a shape check.
//   GET            -> { cameras: [{ id, spec }] }
//   POST { spec }  -> { id }
//   DELETE ?id=…   -> { ok: true }

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body, status = 200) => Response.json(body, { status, headers: NO_STORE });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function session() {
  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await session();
  if (!user) return json({ error: "Please log in.", cameras: [] }, 401);
  const { data, error } = await supabase
    .from("custom_cameras")
    .select("id, spec")
    .order("created_at", { ascending: true });
  if (error) return json({ error: "Could not load your cameras.", cameras: [] }, 500);
  return json({ cameras: data });
}

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Please use the tool on plotlvcad.co.uk." }, 403);
  const { supabase, user } = await session();
  if (!user) return json({ error: "Please log in." }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Something went wrong. Please try again." }, 400); }
  const { spec, error } = cleanCameraSpec(body?.spec);
  if (error) return json({ error }, 400);

  const { data: ent } = await supabase.from("entitlements").select("pro").eq("user_id", user.id).maybeSingle();
  if (ent?.pro !== true) return json({ error: "Custom cameras are a Pro feature." }, 403);

  const { data, error: dbError } = await supabase.from("custom_cameras").insert({ spec }).select("id").single();
  if (dbError) return json({ error: "Could not save the camera. You can store up to 200 custom cameras." }, 400);
  return json({ id: data.id }, 201);
}

export async function DELETE(request) {
  if (!isSameOrigin(request)) return json({ error: "Please use the tool on plotlvcad.co.uk." }, 403);
  const { supabase, user } = await session();
  if (!user) return json({ error: "Please log in." }, 401);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return json({ error: "Unknown camera." }, 400);
  const { error } = await supabase.from("custom_cameras").delete().eq("id", id).eq("user_id", user.id);
  if (error) return json({ error: "Could not delete the camera." }, 500);
  return json({ ok: true });
}
