import { test } from "node:test";
import assert from "node:assert/strict";
import Stripe from "stripe";
import { processStripeWebhook } from "../../lib/stripe/webhook.js";
import { handleStripeEvent } from "../../lib/stripe/subscriptionSync.js";
import {
  NOW, USER, CUSTOMER, SUB, createFakeDb, event, subscription, checkoutSession, paymentFailedInvoice, daysFromNow,
} from "./helpers.mjs";

const SECRET = "whsec_unit_test_secret";
const stripe = new Stripe("sk_test_unit_placeholder");
const now = () => NOW;

// Builds a signed delivery exactly as Stripe would send it.
function signed(evt) {
  const payload = JSON.stringify(evt);
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: SECRET });
  return { payload, header };
}

async function deliver(db, evt) {
  const { payload, header } = signed(evt);
  return processStripeWebhook(payload, header, { stripe, secret: SECRET, db, now });
}

const row = (db) => db.rows.get(USER);

test("bad signature is rejected with 400 and nothing is written", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const evt = event("customer.subscription.created", subscription());
  const res = await processStripeWebhook(JSON.stringify(evt), "t=1,v1=deadbeef", { stripe, secret: SECRET, db, now });
  assert.equal(res.status, 400);
  assert.equal(db.writes.length, 0);
  assert.equal(db.events.size, 0);
});

test("tampered body with a valid-looking header is rejected", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const original = event("customer.subscription.created", subscription());
  const { header } = signed(original);
  const tampered = JSON.stringify({ ...original, type: "customer.subscription.deleted" });
  const res = await processStripeWebhook(tampered, header, { stripe, secret: SECRET, db, now });
  assert.equal(res.status, 400);
  assert.equal(db.writes.length, 0);
});

test("missing signature header is rejected with 400", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const res = await processStripeWebhook("{}", null, { stripe, secret: SECRET, db, now });
  assert.equal(res.status, 400);
});

test("checkout.session.completed saves the customer and subscription ids, not Pro", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const res = await deliver(db, event("checkout.session.completed", checkoutSession()));
  assert.equal(res.status, 200);
  assert.equal(row(db).stripe_customer_id, CUSTOMER);
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(row(db).pro, false, "no status yet, so the webhook must not grant Pro");
  assert.equal(row(db).source, "stripe");
});

test("subscription created (active) grants Pro and stores the period end", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const res = await deliver(db, event("customer.subscription.created", subscription({ status: "active" })));
  assert.equal(res.status, 200);
  assert.equal(row(db).status, "active");
  assert.equal(row(db).pro, true);
  assert.equal(row(db).current_period_end, new Date(1767000000 * 1000).toISOString());
});

test("period end is read from subscription items on newer API versions", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.created", subscription({ periodOnItems: true, periodEndSeconds: 1768000000 })));
  assert.equal(row(db).current_period_end, new Date(1768000000 * 1000).toISOString());
});

test("subscription updated to trialing keeps Pro on", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.created", subscription({ status: "active" })));
  await deliver(db, event("customer.subscription.updated", subscription({ status: "trialing" })));
  assert.equal(row(db).status, "trialing");
  assert.equal(row(db).pro, true);
});

test("subscription updated to canceled removes Pro", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.created", subscription({ status: "active" })));
  await deliver(db, event("customer.subscription.updated", subscription({ status: "canceled" })));
  assert.equal(row(db).status, "canceled");
  assert.equal(row(db).pro, false);
});

test("subscription deleted removes Pro and clears grace", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.created", subscription({ status: "active" })));
  await deliver(db, event("invoice.payment_failed", paymentFailedInvoice()));
  await deliver(db, event("customer.subscription.deleted", subscription({ status: "canceled" })));
  assert.equal(row(db).status, "canceled");
  assert.equal(row(db).grace_until, null);
  assert.equal(row(db).pro, false);
});

test("payment failed puts the subscription in past_due with a seven-day grace", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.created", subscription({ status: "active" })));
  const res = await deliver(db, event("invoice.payment_failed", paymentFailedInvoice()));
  assert.equal(res.status, 200);
  assert.equal(row(db).status, "past_due");
  assert.equal(row(db).grace_until, daysFromNow(7));
  assert.equal(row(db).pro, true, "still inside the grace window");
});

test("payment failed reads the subscription from invoice.parent on newer API versions", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER }]);
  const invoice = { id: "in_2", customer: CUSTOMER, parent: { type: "subscription_details", subscription_details: { subscription: SUB } } };
  await deliver(db, event("invoice.payment_failed", invoice));
  assert.equal(row(db).status, "past_due");
});

test("a later failed payment does not extend the grace window", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.created", subscription({ status: "active" })));
  await deliver(db, event("invoice.payment_failed", paymentFailedInvoice()));
  const firstGrace = row(db).grace_until;
  const laterNow = () => new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000);
  const { payload, header } = signed(event("invoice.payment_failed", paymentFailedInvoice()));
  await processStripeWebhook(payload, header, { stripe, secret: SECRET, db, now: laterNow });
  assert.equal(row(db).grace_until, firstGrace);
});

test("payment failed after the subscription was canceled does not revive it", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.deleted", subscription({ status: "canceled" })));
  await deliver(db, event("invoice.payment_failed", paymentFailedInvoice()));
  assert.equal(row(db).status, "canceled");
  assert.equal(row(db).pro, false);
});

test("an old subscription's deletion cannot revoke a live replacement", async () => {
  const OLD = "sub_old";
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  await deliver(db, event("customer.subscription.deleted", subscription({ id: OLD, status: "canceled" })));
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(row(db).status, "active");
  assert.equal(row(db).pro, true);
});

test("an event with no matching user is acknowledged and ignored", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const res = await deliver(db, event("customer.subscription.created", subscription({ userId: null, customer: "cus_unknown", id: "sub_unknown" })));
  assert.equal(res.status, 200);
  assert.equal(db.writes.length, 0);
});

test("a subscription event can find the user by customer when metadata is missing", async () => {
  const db = createFakeDb([{ user_id: USER, stripe_customer_id: CUSTOMER }]);
  await deliver(db, event("customer.subscription.created", subscription({ userId: null, status: "active" })));
  assert.equal(row(db).status, "active");
  assert.equal(row(db).pro, true);
});

test("the same event delivered twice causes no second write and no error", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const evt = event("customer.subscription.created", subscription({ status: "active" }), "evt_repeat_1");
  const first = await deliver(db, evt);
  const writesAfterFirst = db.writes.length;
  const second = await deliver(db, evt);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(db.writes.length, writesAfterFirst);
  assert.equal(db.events.size, 1);
});

test("a different event id carrying the same state changes nothing", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await deliver(db, event("customer.subscription.updated", subscription({ status: "active" })));
  const writesAfterFirst = db.writes.length;
  await deliver(db, event("customer.subscription.updated", subscription({ status: "active" })));
  assert.equal(db.writes.length, writesAfterFirst);
});

test("handler failure returns 500 so Stripe retries, and the event is not recorded", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  db.saveEntitlement = async () => {
    throw Object.assign(new Error("db down"), { code: "XX000" });
  };
  const evt = event("customer.subscription.created", subscription({ status: "active" }), "evt_retry_1");
  const res = await deliver(db, evt);
  assert.equal(res.status, 500);
  assert.equal(db.events.has("evt_retry_1"), false);
});

test("duplicate detection survives a direct call to the handler", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const evt = event("checkout.session.completed", checkoutSession());
  const a = await handleStripeEvent(evt, { db, now: NOW });
  const b = await handleStripeEvent(evt, { db, now: NOW });
  assert.equal(a.outcome, "updated");
  assert.equal(b.outcome, "duplicate");
});

test("unhandled event types are acknowledged with 200", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  const res = await deliver(db, event("customer.created", { id: CUSTOMER, object: "customer" }));
  assert.equal(res.status, 200);
  assert.equal(db.writes.length, 0);
});
