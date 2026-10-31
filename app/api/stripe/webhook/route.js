import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe, LIVEMODE, isActiveStatus, currentSubscription } from "@/lib/pro";

// Stripe webhook for FOV Pro. This is the only place Pro is switched on or
// off for paying customers.
//
// In Stripe → Developers → Webhooks, add an endpoint for
//   <site>/api/stripe/webhook
// with these events, and put its signing secret in STRIPE_PRO_WEBHOOK_SECRET:
//   checkout.session.completed, checkout.session.async_payment_succeeded,
//   customer.subscription.updated, customer.subscription.deleted
//
// Every handler is safe to run twice (Stripe retries); any error returns 500
// so Stripe tries again later. Events from the other mode (test vs live) are
// ignored, so a test purchase can never give Pro on the live site.

export async function POST(request) {
  const secret = process.env.STRIPE_PRO_WEBHOOK_SECRET;
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
      if (session.metadata?.kind !== "pro") return;
      if (session.payment_status !== "paid") return; // wait for async_payment_succeeded
      const userId = session.metadata.user_id || session.client_reference_id;
      await setPro(admin, userId, true);
      await notify(
        `New FOV Pro subscriber (${session.metadata.plan})`,
        `${session.customer_details?.name || "Someone"} (${session.customer_details?.email || "no email"}) just bought FOV Pro ${session.metadata.plan}.${LIVEMODE ? "" : "\n\n(Test mode)"}`
      );
      return;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      // Read the subscription fresh rather than trusting the event, so events
      // arriving out of order can't leave Pro in the wrong state.
      const sub = await stripe.subscriptions.retrieve(event.data.object.id);
      if (sub.metadata?.kind !== "pro") return;
      const userId = sub.metadata.user_id;
      if (isActiveStatus(sub.status)) {
        await setPro(admin, userId, true);
      } else {
        // Only switch off if the customer has no other live Pro subscription.
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        const other = await currentSubscription(stripe, customerId);
        if (!other) await setPro(admin, userId, false);
      }
      return;
    }
    default:
      return;
  }
}

// Pro granted by Stripe is recorded with source 'stripe'. Switching off only
// touches Stripe-granted Pro, so Pro given by hand is left alone.
async function setPro(admin, userId, on) {
  if (!userId) throw new Error("No user id on the Stripe object");
  if (on) {
    const { error } = await admin
      .from("entitlements")
      .upsert({ user_id: userId, pro: true, source: "stripe", updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await admin
      .from("entitlements")
      .update({ pro: false, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("source", "stripe");
    if (error) throw new Error(error.message);
  }
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
