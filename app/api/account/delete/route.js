import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { removeContact } from "@/lib/mailingList";
import { getStripe, findCustomer, isActiveStatus } from "@/lib/pro";

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

  // A paying Pro customer must not keep being billed after deleting their
  // account: cancel any live Pro subscription first, and stop if that fails.
  const stripe = getStripe();
  if (stripe) {
    try {
      const customer = await findCustomer(stripe, user.id);
      if (customer) {
        const subs = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 20 });
        for (const sub of subs.data) {
          if (sub.metadata?.kind === "pro" && isActiveStatus(sub.status)) await stripe.subscriptions.cancel(sub.id);
        }
      }
    } catch (err) {
      console.error("[account] cancel subscription before delete failed", err?.message);
      return Response.json(
        { error: "Couldn't cancel your FOV Pro subscription, so nothing was deleted. Please try again or contact us." },
        { status: 502 }
      );
    }
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
