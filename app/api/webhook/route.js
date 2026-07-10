import Stripe from "stripe";
import { Resend } from "resend";
import { generateLicenseKey } from "@/lib/licenseKey";
import { insertLicense, setStatusBySubscription, setStatusByCustomer } from "@/lib/licenseDb";

// Stripe needs the raw request body to verify the signature, so this route
// must not run through any middleware/parser that consumes it first.

async function emailLicenseKey({ email, key, plan }) {
  if (!process.env.RESEND_API_KEY) {
    console.log("[webhook] RESEND_API_KEY not set — key not emailed", { email });
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { error } = await resend.emails.send({
    // Until the domain is verified in Resend, onboarding@resend.dev can only
    // deliver to the account owner's own address — verify the domain and set
    // RESEND_FROM before launch.
    from: process.env.RESEND_FROM || "Plot-LV <onboarding@resend.dev>",
    to: email,
    subject: "Your Plot-LV Flame licence key",
    text: [
      "Thanks for buying Plot-LV Flame" + (plan === "monthly" ? " (monthly plan)" : " (lifetime licence)") + ".",
      "",
      "Your licence key:",
      "",
      `    ${key}`,
      "",
      "Download Flame: " + siteUrl + "/#download",
      "",
      "Enter the key the first time you open Flame. Your licence covers 2",
      "machines (e.g. office PC + laptop). Flame verifies the key online about",
      "once a week — only the key and an anonymous machine identifier are sent,",
      "never your drawings or project data.",
      "",
      "Keep this email safe. Questions? Just reply.",
    ].join("\n"),
  });
  if (error) console.error("[webhook] failed to email licence key", error);
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Stripe webhook isn't configured yet." }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return Response.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email;
      const key = generateLicenseKey();
      // stripe_session is UNIQUE — on a Stripe retry this returns null and we
      // skip the email rather than sending a second key.
      const inserted = await insertLicense({
        key,
        email,
        plan: session.metadata?.plan || (session.mode === "subscription" ? "monthly" : "lifetime"),
        session: session.id,
        customer: session.customer,
        subscription: session.subscription,
      });
      if (inserted) {
        await emailLicenseKey({ email, key, plan: session.metadata?.plan });
      }
      break;
    }
    case "customer.subscription.deleted": {
      await setStatusBySubscription(event.data.object.id, "lapsed");
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      if (charge.customer) await setStatusByCustomer(charge.customer, "revoked");
      break;
    }
  }

  return Response.json({ received: true });
}
