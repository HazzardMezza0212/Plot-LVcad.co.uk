// Cancels a second live subscription for a customer who already has one, and refunds its
// first payment. Called only from the webhook, when a duplicate is detected.
//
// Stripe calls carry idempotency keys derived from the subscription id, so a retried webhook
// cannot cancel or refund twice. "Already gone" and "already refunded" responses count as
// success, so a retry after a partial failure completes cleanly.
//
// Returns:
//   "cancelled-and-refunded"  - cancelled, and the first payment refunded
//   "cancelled-manual-refund" - cancelled, but the payment could not be refunded automatically
//                               (paid without a payment intent). Needs a human to refund it.

const RESOURCE_MISSING = "resource_missing";
const ALREADY_REFUNDED = "charge_already_refunded";

export async function cancelAndRefundDuplicate(stripe, subscriptionId) {
  const base = `fovpro-duplicate-${subscriptionId}`;

  try {
    await stripe.subscriptions.cancel(subscriptionId, {}, { idempotencyKey: `${base}-cancel` });
  } catch (err) {
    if (err?.code !== RESOURCE_MISSING) throw err;
  }

  const list = await stripe.invoices.list({ subscription: subscriptionId, limit: 1 });
  const invoice = list.data?.[0];
  if (!invoice || invoice.status !== "paid" || !(invoice.amount_paid > 0)) {
    return "cancelled-and-refunded";
  }

  const paymentIntent = idOf(invoice.payment_intent);
  if (!paymentIntent) {
    console.error("[stripe webhook] duplicate subscription paid without a payment intent; refund needed by hand");
    return "cancelled-manual-refund";
  }

  try {
    await stripe.refunds.create({ payment_intent: paymentIntent }, { idempotencyKey: `${base}-refund` });
  } catch (err) {
    if (err?.code !== ALREADY_REFUNDED) throw err;
  }
  return "cancelled-and-refunded";
}

function idOf(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.id === "string") return value.id;
  return null;
}
