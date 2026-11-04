// POST /api/stripe/portal: opens the Stripe Billing Portal for the signed-in user.
//
// deps:
//   isSameOrigin(request) - CSRF check
//   getUser()             - signed-in Supabase user or null
//   getStripeCustomerId(userId) - stripe_customer_id or null
//   getStripe()           - Stripe instance or null
//   siteUrl               - absolute site origin

const json = (body, status) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function handlePortal(request, deps) {
  if (!deps.isSameOrigin(request)) return json({ error: "Please use the site." }, 403);

  const user = await deps.getUser();
  if (!user) return json({ error: "Please log in." }, 401);

  const customerId = await deps.getStripeCustomerId(user.id);
  if (!customerId) return json({ error: "No billing account yet. Subscribe first." }, 404);

  const stripe = deps.getStripe();
  if (!stripe) return json({ error: "Billing isn't available right now." }, 503);

  let session;
  try {
    session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${deps.siteUrl}/account`,
    });
  } catch (err) {
    console.error("[portal] could not create session:", err?.type || "error");
    return json({ error: "Couldn't open billing. Please try again." }, 502);
  }

  return json({ url: session.url }, 200);
}
