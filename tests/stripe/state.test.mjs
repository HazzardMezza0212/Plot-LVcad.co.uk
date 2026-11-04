import { test } from "node:test";
import assert from "node:assert/strict";
import { stripeEntitlementState } from "../../lib/stripe/entitlement.js";
import { NOW, daysFromNow } from "./helpers.mjs";

const sub = (status, extra = {}) => ({ id: "sub_1", status, ...extra });

test("active subscription grants Pro with no grace window", () => {
  const s = stripeEntitlementState(sub("active", { current_period_end: 1767000000 }), null, NOW);
  assert.equal(s.pro, true);
  assert.equal(s.status, "active");
  assert.equal(s.grace_until, null);
  assert.equal(s.current_period_end, new Date(1767000000 * 1000).toISOString());
});

test("trialing grants Pro", () => {
  assert.equal(stripeEntitlementState(sub("trialing"), null, NOW).pro, true);
});

test("first past_due starts a seven-day grace window and keeps Pro on", () => {
  const s = stripeEntitlementState(sub("past_due"), { status: "active", grace_until: null }, NOW);
  assert.equal(s.pro, true);
  assert.equal(s.grace_until, daysFromNow(7));
});

test("a repeat past_due keeps the existing window, so retries cannot extend it", () => {
  const existing = daysFromNow(2);
  const s = stripeEntitlementState(sub("past_due"), { status: "past_due", grace_until: existing }, NOW);
  assert.equal(s.grace_until, existing);
  assert.equal(s.pro, true);
});

test("past_due after its window has ended is not Pro", () => {
  const s = stripeEntitlementState(sub("past_due"), { status: "past_due", grace_until: daysFromNow(-1) }, NOW);
  assert.equal(s.pro, false);
});

test("a new past_due after recovery starts a fresh window, not the old expired one", () => {
  const s = stripeEntitlementState(sub("past_due"), { status: "active", grace_until: daysFromNow(-30) }, NOW);
  assert.equal(s.grace_until, daysFromNow(7));
});

test("canceled, unpaid and incomplete subscriptions are not Pro and carry no window", () => {
  for (const status of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused"]) {
    const s = stripeEntitlementState(sub(status), { status: "past_due", grace_until: daysFromNow(3) }, NOW);
    assert.equal(s.pro, false, status);
    assert.equal(s.grace_until, null, status);
  }
});

test("period end is read from subscription items when the subscription lacks it", () => {
  const s = stripeEntitlementState(sub("active", { items: { data: [{ current_period_end: 1768000000 }] } }), null, NOW);
  assert.equal(s.current_period_end, new Date(1768000000 * 1000).toISOString());
});
