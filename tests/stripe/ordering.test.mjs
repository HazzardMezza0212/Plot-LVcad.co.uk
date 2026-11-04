import { test } from "node:test";
import assert from "node:assert/strict";
import { handleStripeEvent } from "../../lib/stripe/subscriptionSync.js";
import { NOW, NOW_SECONDS, USER, CUSTOMER, SUB, createFakeDb, event, subscription, checkoutSession, paymentFailedInvoice } from "./helpers.mjs";

const row = (db) => db.rows.get(USER);
const at = (secondsLater) => NOW_SECONDS + secondsLater;
const run = (db, evt) => handleStripeEvent(evt, { db, now: NOW });

// Records which duplicate subscriptions were cancelled and refunded.
function fakeBilling() {
  const calls = [];
  return {
    calls,
    async cancelAndRefund(subscriptionId) {
      calls.push(subscriptionId);
      return "cancelled-and-refunded";
    },
  };
}

// Ordering guard: last_event_created

test("an older event delivered late cannot overwrite a newer state", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await run(db, event("customer.subscription.updated", subscription({ status: "active" }), "evt_new", at(100)));
  const writes = db.writes.length;

  const late = await run(db, event("invoice.payment_failed", paymentFailedInvoice(), "evt_old", at(50)));
  assert.equal(late.outcome, "stale");
  assert.equal(row(db).status, "active");
  assert.equal(row(db).pro, true);
  assert.equal(db.writes.length, writes);
});

test("a newer event with the same state still advances the ordering marker", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await run(db, event("customer.subscription.updated", subscription({ status: "active" }), "evt_a", at(10)));
  const writes = db.writes.length;
  const same = await run(db, event("customer.subscription.updated", subscription({ status: "active" }), "evt_b", at(20)));
  assert.equal(same.outcome, "updated");
  assert.equal(db.writes.length, writes + 1);
  assert.equal(row(db).last_event_created, new Date((at(20)) * 1000).toISOString());

  // An event between the two, carrying a different state, is now stale.
  const between = await run(db, event("invoice.payment_failed", paymentFailedInvoice(), "evt_mid", at(15)));
  assert.equal(between.outcome, "stale");
  assert.equal(row(db).status, "active");
});

test("events arriving in order apply normally", async () => {
  const db = createFakeDb([{ user_id: USER }]);
  await run(db, event("customer.subscription.created", subscription({ status: "active" }), "evt_1", at(1)));
  await run(db, event("invoice.payment_failed", paymentFailedInvoice(), "evt_2", at(2)));
  assert.equal(row(db).status, "past_due");
  assert.equal(row(db).pro, true);
  await run(db, event("customer.subscription.deleted", subscription({ status: "canceled" }), "evt_3", at(3)));
  assert.equal(row(db).status, "canceled");
  assert.equal(row(db).pro, false);
});

test("a stale checkout event does not roll the row back", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true, last_event_created: new Date(at(100) * 1000).toISOString() }]);
  const late = await run(db, event("checkout.session.completed", checkoutSession({ customer: "cus_other" }), "evt_co", at(50)));
  assert.equal(late.outcome, "stale");
  assert.equal(row(db).stripe_customer_id, CUSTOMER);
});

test("rows with no ordering marker (manual grants) accept any event", async () => {
  const db = createFakeDb([{ user_id: USER, pro: true, source: "manual" }]);
  const res = await run(db, event("customer.subscription.created", subscription({ status: "active" }), "evt_first", at(-500)));
  assert.equal(res.outcome, "updated");
  assert.equal(row(db).status, "active");
});

// Duplicate subscriptions

test("a second live subscription is cancelled and refunded, and does not take over the entitlement", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  const billing = fakeBilling();
  const res = await handleStripeEvent(event("customer.subscription.created", subscription({ id: "sub_second", status: "active" }), "evt_dup_sub"), { db, now: NOW, billing });
  assert.equal(res.outcome, "cancelled-and-refunded");
  assert.deepEqual(billing.calls, ["sub_second"]);
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(row(db).status, "active");
  assert.equal(db.writes.length, 0);
});

test("without a billing client a second live subscription is left alone", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  const res = await run(db, event("customer.subscription.created", subscription({ id: "sub_second", status: "active" }), "evt_dup_nobilling"));
  assert.equal(res.outcome, "ignored");
  assert.equal(row(db).stripe_subscription_id, SUB);
});

test("if cancelling the duplicate fails, the event is not recorded so Stripe retries it", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  const billing = { async cancelAndRefund() { throw new Error("stripe down"); } };
  const evt = event("customer.subscription.created", subscription({ id: "sub_second", status: "active" }), "evt_dup_fail");
  await assert.rejects(handleStripeEvent(evt, { db, now: NOW, billing }));
  assert.equal(db.events.has("evt_dup_fail"), false);
});

test("a cancelled duplicate's own deletion event does not touch the entitlement", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  const billing = fakeBilling();
  await handleStripeEvent(event("customer.subscription.created", subscription({ id: "sub_second", status: "active" }), "evt_d1"), { db, now: NOW, billing });
  const writes = db.writes.length;
  const res = await handleStripeEvent(event("customer.subscription.deleted", subscription({ id: "sub_second", status: "canceled" }), "evt_d2"), { db, now: NOW, billing });
  assert.equal(res.outcome, "ignored");
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(db.writes.length, writes);
});

test("checkout completing for a second subscription does not repoint the entitlement", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  await run(db, event("checkout.session.completed", checkoutSession({ subscriptionId: "sub_second" }), "evt_dup_co"));
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(row(db).status, "active");
});

test("a replacement is accepted once the old subscription is no longer in use", async () => {
  const db = createFakeDb([{ user_id: USER, status: "canceled", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: false }]);
  const res = await run(db, event("customer.subscription.created", subscription({ id: "sub_new", status: "active" }), "evt_new_sub"));
  assert.equal(res.outcome, "updated");
  assert.equal(row(db).stripe_subscription_id, "sub_new");
  assert.equal(row(db).pro, true);
});
