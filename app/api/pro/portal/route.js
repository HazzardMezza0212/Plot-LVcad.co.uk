import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { getStripe, findCustomer } from "@/lib/pro";
import { originOf } from "@/lib/site";

// Opens Stripe's billing page for the signed-in user: cancel, change plan,
// update card, invoices. The customer is found from the user's own id, never
// from anything the browser sends.
export async function POST(request) {
  if (!isSameOrigin(request)) return Response.json({ error: "Not allowed." }, { status: 403 });

  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });

  const stripe = getStripe();
  try {
    const customer = await findCustomer(stripe, user.id);
    if (!customer) return Response.json({ error: "No FOV Pro billing found on this account." }, { status: 404 });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${originOf(request)}/account#pro`,
    });
    return Response.json({ url: portal.url }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[pro] portal failed", err?.message);
    return Response.json({ error: "Couldn't open billing just now. Please try again." }, { status: 502 });
  }
}
