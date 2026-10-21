import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { removeContact } from "@/lib/mailingList";

// Permanently delete the signed-in user's account (right to erasure).
// Removes them from the mailing list first, then deletes the account; the
// profile and consent log are deleted with it by the database.
export async function POST(request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "Not allowed." }, { status: 403 });
  }
  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return Response.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  const removed = await removeContact(user.email);
  if (!removed) {
    return Response.json(
      { error: "Couldn't remove you from the mailing list just now, so nothing was deleted. Please try again in a few minutes." },
      { status: 502 }
    );
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    return Response.json({ error: "Couldn't delete your account. Please try again or contact us." }, { status: 500 });
  }
  // The account is gone; clear the session cookies on this browser.
  await supabase.auth.signOut().catch(() => {});
  return Response.json({ deleted: true });
}
