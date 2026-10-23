import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, LIVEMODE } from "@/lib/founding";

// Stripe webhook for Founding 20. This is the only place Pro is switched on
// or off for paying members.
//
// In Stripe → Developers → Webhooks, add an endpoint for
//   https://www.plotlvcad.co.uk/api/stripe/webhook
// with these events, and put its signing secret in STRIPE_FOUNDING_WEBHOOK_SECRET:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   checkout.session.expired, customer.subscription.updated,
//   customer.subscription.deleted
//
// Every handler is safe to run twice (Stripe retries), and any error returns
// 500 so Stripe tries again later. Events from the other mode (test vs live)
// are ignored.

const ACTIVE = new Set(["active", "trialing", "past_due"]);

export async function POST(request) {
  const secret = process.env.STRIPE_FOUNDING_WEBHOOK_SECRET;
  const stripe = getStripe();
  const admin = createAdminClient();
  if (!secret || !stripe || !admin) {
    return Response.json({ error: "Webhook isn't configured." }, { status: 500 });
  }

  let event;
  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, request.headers.get("stripe-signature"), secret);
  } catch {
    return Response.json({ error: "Bad signature." }, { status: 400 });
  }

  if (event.livemode !== LIVEMODE) return Response.json({ ignored: "other mode" });

  const { data: seen } = await admin.from("stripe_events").select("id").eq("id", event.id).maybeSingle();
  if (seen) return Response.json({ received: true, duplicate: true });

  try {
    await handle(event, stripe, admin);
  } catch (err) {
    console.error(`[stripe] ${event.type} ${event.id} failed:`, err?.message);
    return Response.json({ error: "Handler failed." }, { status: 500 });
  }

  await admin.rpc("stripe_event_seen", { p_id: event.id, p_type: event.type });
  return Response.json({ received: true });
}

async function handle(event, stripe, admin) {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      if (session.metadata?.kind !== "founding") return;
      if (session.payment_status !== "paid") return; // wait for async_payment_succeeded
      await activate(session, admin);
      return;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      if (session.metadata?.kind !== "founding") return;
      const { error } = await admin.rpc("founding_release", { p_session: session.id });
      if (error) throw new Error(error.message);
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // Read the subscription fresh rather than trusting the event, so events
      // arriving out of order can't leave Pro in the wrong state.
      const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
      if (subscription.metadata?.kind !== "founding") return;
      const { error } = await admin.rpc("founding_sync_subscription", {
        p_subscription: subscription.id,
        p_active: ACTIVE.has(subscription.status),
      });
      if (error) throw new Error(error.message);
      return;
    }
    default:
      return;
  }
}

async function activate(session, admin) {
  const seatId = Number(session.metadata.seat_id);
  const userId = session.client_reference_id;
  const { data: seatNo, error } = await admin.rpc("founding_activate", {
    p_id: seatId,
    p_user: userId,
    p_customer: typeof session.customer === "string" ? session.customer : session.customer?.id,
    p_subscription: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
  });

  if (error) {
    if (error.message.includes("FOUNDING_OVERSOLD") || error.message.includes("FOUNDING_SEAT_MISMATCH")) {
      // Someone has paid but can't be given a seat automatically. Don't make
      // Stripe retry forever: tell Harry so he can sort it out (or refund).
      console.error("[stripe] founding payment needs attention", session.id, error.message);
      await notify(
        "Founding 20: payment needs attention",
        `A Founding 20 payment couldn't be matched to a seat (${error.message}).\n\nCheckout session: ${session.id}\nCustomer email: ${session.customer_details?.email || "unknown"}\n\nCheck it in Stripe and grant Pro by hand or refund.`
      );
      return;
    }
    throw new Error(error.message);
  }

  await notify(
    `New Founding 20 member: seat ${seatNo} of 20`,
    `${session.customer_details?.name || "Someone"} (${session.customer_details?.email || "no email"}) just took Founding seat ${seatNo}.${LIVEMODE ? "" : "\n\n(Test mode)"}`
  );
}

// Best-effort email to Harry; never blocks the webhook.
async function notify(subject, text) {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!to || !process.env.RESEND_API_KEY) return;
  try {
    await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.NOTIFY_FROM_EMAIL || "Plot-LV <onboarding@resend.dev>",
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("[stripe] notify failed", err?.message);
  }
}
