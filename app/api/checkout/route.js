import Stripe from "stripe";

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  lifetime: process.env.STRIPE_PRICE_ID_LIFETIME,
};

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      {
        error:
          "Stripe isn't configured yet — copy .env.local.example to .env.local and fill in your Stripe keys.",
      },
      { status: 500 }
    );
  }

  const { plan, name, email } = await request.json();
  const priceId = PRICE_IDS[plan];

  if (!priceId) {
    return Response.json({ error: "Select a plan first." }, { status: 400 });
  }
  if (!email) {
    return Response.json({ error: "Email is required." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: plan === "monthly" ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { plan, name: name || "" },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/#pricing`,
  });

  return Response.json({ url: session.url });
}
