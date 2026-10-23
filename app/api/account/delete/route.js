import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { removeContact } from "@/lib/mailingList";
import { getStripe } from "@/lib/founding";

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

  // A paying Founding member must not keep being billed after deleting their
  // account: cancel their subscription first, and stop if that fails.
  const { data: paidSeats } = await supabase
    .from("founding_members")
    .select("stripe_subscription_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .not("stripe_subscription_id", "is", null);
  if (paidSeats?.length) {
    const stripe = getStripe();
    try {
      if (!stripe) throw new Error("Stripe not configured");
      for (const seat of paidSeats) await stripe.subscriptions.cancel(seat.stripe_subscription_id);
    } catch (err) {
      console.error("[account] cancel subscription before delete failed", err?.message);
      return Response.json(
        { error: "Couldn't cancel your Founding membership, so nothing was deleted. Please try again or contact us." },
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
