import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { syncContact } from "@/lib/mailingList";

// Turn marketing emails on or off for the signed-in user. The database
// records the change in the consent log; Resend is then updated to match.
export async function POST(request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body?.optIn !== "boolean") {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const { error } = await supabase.rpc("set_marketing_consent", {
    p_granted: body.optIn,
    p_source: "account",
  });
  if (error) {
    return Response.json({ error: "Couldn't save your choice. Please try again." }, { status: 500 });
  }

  const synced = await syncContact({
    email: user.email,
    fullName: user.user_metadata?.full_name,
    optIn: body.optIn,
  });
  if (synced) await supabase.rpc("mark_resend_synced");
  // If Resend was unreachable, resend_synced_at stays empty and the account
  // page retries the sync next time it loads.

  return Response.json({ optIn: body.optIn, updatedAt: new Date().toISOString() });
}
