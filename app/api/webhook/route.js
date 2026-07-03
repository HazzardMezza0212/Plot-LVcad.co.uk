import Stripe from "stripe";
import { generateLicenseKey } from "@/lib/licenseKey";
import { saveLicense } from "@/lib/licenseStore";

// Stripe needs the raw request body to verify the signature, so this route
// must not run through any middleware/parser that consumes it first.
export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json(
      { error: "Stripe webhook isn't configured yet." },
      { status: 500 }
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return Response.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const key = generateLicenseKey();
    saveLicense(session.id, {
      key,
      email: session.customer_email,
      plan: session.metadata?.plan,
      createdAt: new Date().toISOString(),
    });
    // TODO: email the key too — don't rely solely on the customer staying on
    // the success page to see it. Wire up Resend/Postmark/etc here.
  }

  return Response.json({ received: true });
}
