import { test } from "node:test";
import assert from "node:assert/strict";
import { cancelAndRefundDuplicate } from "../../lib/stripe/duplicates.js";

// Fake Stripe for the three calls the helper makes. Each option can be set per test.
function fakeStripe({ cancelError = null, invoices = [], refundError = null } = {}) {
  const calls = { cancel: [], refunds: [], invoiceLists: [] };
  return {
    calls,
    subscriptions: {
      async cancel(id, params, options) {
        calls.cancel.push({ id, params, options });
        if (cancelError) throw cancelError;
        return { id, status: "canceled" };
      },
    },
    invoices: {
      async list(params) {
        calls.invoiceLists.push(params);
        return { data: invoices };
      },
    },
    refunds: {
      async create(params, options) {
        calls.refunds.push({ params, options });
        if (refundError) throw refundError;
        return { id: "re_1", status: "succeeded" };
      },
    },
  };
}

const paidInvoice = { id: "in_1", status: "paid", amount_paid: 1900, payment_intent: "pi_1" };
const SUB = "sub_dup";

test("cancels the duplicate and refunds its paid first payment", async () => {
  const stripe = fakeStripe({ invoices: [paidInvoice] });
  const result = await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(result, "cancelled-and-refunded");
  assert.equal(stripe.calls.cancel.length, 1);
  assert.equal(stripe.calls.cancel[0].id, SUB);
  assert.equal(stripe.calls.refunds.length, 1);
  assert.deepEqual(stripe.calls.refunds[0].params, { payment_intent: "pi_1" });
});

test("cancel and refund carry idempotency keys tied to the subscription", async () => {
  const stripe = fakeStripe({ invoices: [paidInvoice] });
  await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(stripe.calls.cancel[0].options.idempotencyKey, `fovpro-duplicate-${SUB}-cancel`);
  assert.equal(stripe.calls.refunds[0].options.idempotencyKey, `fovpro-duplicate-${SUB}-refund`);
});

test("looks up the most recent invoice for the subscription", async () => {
  const stripe = fakeStripe({ invoices: [paidInvoice] });
  await cancelAndRefundDuplicate(stripe, SUB);
  assert.deepEqual(stripe.calls.invoiceLists[0], { subscription: SUB, limit: 1 });
});

test("no refund when the subscription has no invoice yet", async () => {
  const stripe = fakeStripe({ invoices: [] });
  const result = await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(result, "cancelled-and-refunded");
  assert.equal(stripe.calls.refunds.length, 0);
});

test("no refund for a zero-amount invoice (for example a trial)", async () => {
  const stripe = fakeStripe({ invoices: [{ id: "in_0", status: "paid", amount_paid: 0, payment_intent: null }] });
  await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(stripe.calls.refunds.length, 0);
});

test("no refund for an invoice that was not paid", async () => {
  const stripe = fakeStripe({ invoices: [{ id: "in_open", status: "open", amount_paid: 0, payment_intent: "pi_x" }] });
  await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(stripe.calls.refunds.length, 0);
});

test("a paid invoice with no payment intent is cancelled and flagged for a manual refund", async () => {
  const stripe = fakeStripe({ invoices: [{ id: "in_2", status: "paid", amount_paid: 1900, payment_intent: null }] });
  const result = await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(result, "cancelled-manual-refund");
  assert.equal(stripe.calls.refunds.length, 0);
});

test("an already-cancelled subscription is treated as cancelled and still refunded", async () => {
  const stripe = fakeStripe({
    cancelError: Object.assign(new Error("No such subscription"), { code: "resource_missing" }),
    invoices: [paidInvoice],
  });
  const result = await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(result, "cancelled-and-refunded");
  assert.equal(stripe.calls.refunds.length, 1);
});

test("an already-refunded payment counts as done", async () => {
  const stripe = fakeStripe({
    invoices: [paidInvoice],
    refundError: Object.assign(new Error("already refunded"), { code: "charge_already_refunded" }),
  });
  const result = await cancelAndRefundDuplicate(stripe, SUB);
  assert.equal(result, "cancelled-and-refunded");
});

test("an unexpected cancel error is rethrown so the webhook retries", async () => {
  const stripe = fakeStripe({ cancelError: Object.assign(new Error("rate limited"), { code: "rate_limit" }), invoices: [paidInvoice] });
  await assert.rejects(cancelAndRefundDuplicate(stripe, SUB));
  assert.equal(stripe.calls.refunds.length, 0);
});

test("an unexpected refund error is rethrown so the webhook retries", async () => {
  const stripe = fakeStripe({ invoices: [paidInvoice], refundError: Object.assign(new Error("boom"), { code: "api_error" }) });
  await assert.rejects(cancelAndRefundDuplicate(stripe, SUB));
});
