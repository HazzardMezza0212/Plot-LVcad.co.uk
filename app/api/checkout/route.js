import Stripe from "stripe";
import { guardPublicPost, clip, EMAIL } from "@/lib/publicForm";

const PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  lifetime: process.env.STRIPE_PRICE_ID_LIFETIME,
};

// Pre-launch mode: keep this false in lockstep with CHECKOUT_ENABLED in
// app/page.js, so checkout can't be triggered even via a direct API call
// while the site is only open for interest registration. Flip both to true
// together when ready to accept real payments.
const CHECKOUT_ENABLED = false;

export async function POST(request) {
  if (!CHECKOUT_ENABLED) {
    return Response.json(
      { error: "Checkout isn't open yet — register your interest instead." },
      { status: 403 }
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json(
      {
        error: "Checkout isn't available right now. Please try again later.",
      },
      { status: 503 }
    );
  }

  const guard = await guardPublicPost(request, { name: "checkout", limit: 10, windowMs: 60 * 60 * 1000, captcha: false });
  if (guard.response) return guard.response;
  const plan = clip(guard.body.plan, 20);
  const name = clip(guard.body.name, 120);
  const email = clip(guard.body.email, 254).toLowerCase();
  const priceId = Object.hasOwn(PRICE_IDS, plan) ? PRICE_IDS[plan] : undefined;

  if (!priceId) {
    return Response.json({ error: "Select a plan first." }, { status: 400 });
  }
  if (!EMAIL.test(email)) {
    return Response.json({ error: "A valid email is required." }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  let session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: plan === "monthly" ? "subscription" : "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: { plan, name: name || "" },
    success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/#pricing`,
    });
  } catch (err) {
    console.error("[checkout] could not create session:", err?.type || "error");
    return Response.json({ error: "Couldn't start checkout. Please try again." }, { status: 502 });
  }

  return Response.json({ url: session.url });
}
