import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { decideProFile } from "@/lib/cctv-pro/gate";

// FOV Pro code. The files live in private/cctv-pro (never in the static folder, which would serve
// them to anyone), so this handler is the only way to get them. It checks the session
// and the entitlement on every request, the same way proxy.js does. Every refusal is the same 404.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "private", "cctv-pro");

// The allowlist is read once from the folder and kept. A failed read is not cached, so it is retried.
let allowlistPromise = null;
function allowlist() {
  allowlistPromise ??= readdir(DIR)
    .then((names) => new Set(names.filter((n) => /\.(js|mjs)$/.test(n))))
    .catch((err) => {
      allowlistPromise = null;
      throw err;
    });
  return allowlistPromise;
}

const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

export async function GET(_request, { params }) {
  const { file } = await params;

  const supabase = await createClient(); // null in guest mode
  if (!supabase) return notFound();
  const { data: { claims } = {} } = await supabase.auth.getClaims();
  const sub = claims?.sub ?? null;

  let entitlement = null;
  if (sub) {
    const { data, error } = await supabase
      .from("entitlements")
      .select("pro, status, grace_until")
      .eq("user_id", sub)
      .maybeSingle();
    if (!error) entitlement = data;
  }

  let names;
  try {
    names = await allowlist();
  } catch {
    return notFound();
  }

  const decision = decideProFile({ fileName: file, allowlist: names, claims: sub ? { sub } : null, entitlement });
  if (!decision.serve) return notFound();

  let bytes;
  try {
    bytes = await readFile(path.join(DIR, decision.fileName));
  } catch {
    return notFound();
  }
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "text/javascript; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
