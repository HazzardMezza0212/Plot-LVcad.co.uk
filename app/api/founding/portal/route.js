import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { getStripe, mySeat, siteUrl } from "@/lib/founding";

// Opens Stripe's billing page for the signed-in member: card details,
// invoices (with VAT) and cancelling. The customer id is read from the
// member's own seat row, never from the browser.
export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Not allowed." }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });

  const seat = await mySeat(supabase, user.id);
  const stripe = getStripe();
  if (!seat?.stripe_customer_id || !stripe) {
    return Response.json({ error: "No Founding membership found on this account." }, { status: 404 });
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: seat.stripe_customer_id,
      return_url: `${siteUrl()}/account`,
    });
    return Response.json({ url: portal.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[founding] portal failed", err?.message);
    return Response.json({ error: "Couldn't open billing just now. Please try again." }, { status: 502 });
  }
}
