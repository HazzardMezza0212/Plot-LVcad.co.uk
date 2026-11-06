import { test } from "node:test";
import assert from "node:assert/strict";
import { validateProCheckoutBody, BUSINESS_USE_ERROR } from "../../lib/checkout-request.js";

const ok = { plan: "monthly", businessUse: true, agreeTerms: true };

test("both boxes ticked and a known plan is accepted", () => {
  assert.deepEqual(validateProCheckoutBody(ok), { plan: "monthly" });
  assert.deepEqual(validateProCheckoutBody({ ...ok, plan: "yearly" }), { plan: "yearly" });
});

test("the business-use box is required", () => {
  const res = validateProCheckoutBody({ plan: "monthly", agreeTerms: true });
  assert.equal(res.error, "Please confirm you're buying for business use.");
  assert.equal(res.error, BUSINESS_USE_ERROR);
});

test("the business-use box must be exactly true", () => {
  for (const businessUse of [false, "true", 1, null]) {
    assert.equal(validateProCheckoutBody({ ...ok, businessUse }).error, BUSINESS_USE_ERROR, String(businessUse));
  }
});

test("the terms box is still required", () => {
  assert.equal(validateProCheckoutBody({ ...ok, agreeTerms: false }).error, "Please agree to the terms to continue.");
});

test("the old consumer box name no longer counts", () => {
  assert.equal(validateProCheckoutBody({ plan: "monthly", startNow: true, agreeTerms: true }).error, BUSINESS_USE_ERROR);
});

test("unknown plan or no body is rejected", () => {
  assert.equal(validateProCheckoutBody({ ...ok, plan: "annual" }).error, "Choose monthly or yearly.");
  assert.equal(validateProCheckoutBody(null).error, "Bad request.");
  assert.equal(validateProCheckoutBody("monthly").error, "Bad request.");
});
