import { test } from "node:test";
import assert from "node:assert/strict";
import { handleStripeEvent } from "../../lib/stripe/subscriptionSync.js";
import { NOW, NOW_SECONDS, USER, CUSTOMER, SUB, createFakeDb, event, subscription, checkoutSession, paymentFailedInvoice } from "./helpers.mjs";

const row = (db) => db.rows.get(USER);
const at = (secondsLater) => NOW_SECONDS + secondsLater;
const run = (db, evt) => handleStripeEvent(evt, { db, now: NOW });

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

// Second live subscription: logged only

test("a second live subscription is logged and does not change the entitlement", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  const res = await run(db, event("customer.subscription.created", subscription({ id: "sub_second", status: "active" }), "evt_dup_sub"));
  assert.equal(res.outcome, "duplicate-logged");
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(row(db).status, "active");
  assert.equal(db.writes.length, 0);
});

test("later events for the second subscription are logged too and change nothing", async () => {
  const db = createFakeDb([{ user_id: USER, status: "active", stripe_subscription_id: SUB, stripe_customer_id: CUSTOMER, pro: true }]);
  await run(db, event("customer.subscription.created", subscription({ id: "sub_second", status: "active" }), "evt_d1"));
  const res = await run(db, event("customer.subscription.updated", subscription({ id: "sub_second", status: "past_due" }), "evt_d2"));
  assert.equal(res.outcome, "duplicate-logged");
  assert.equal(row(db).stripe_subscription_id, SUB);
  assert.equal(row(db).status, "active");
  assert.equal(db.writes.length, 0);
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
