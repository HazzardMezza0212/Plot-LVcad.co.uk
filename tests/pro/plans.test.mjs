import { test } from "node:test";
import assert from "node:assert/strict";
import { PRO_PLANS, FOUNDING, YEARLY_SAVING, isPlanKey } from "../../lib/plans.js";
import { foundingSeatsLeft } from "../../lib/founding.js";

test("yearly is £190 and monthly is £19", () => {
  assert.equal(PRO_PLANS.yearly.amount, 190);
  assert.equal(PRO_PLANS.yearly.label, "£190");
  assert.equal(PRO_PLANS.monthly.amount, 19);
});

test("yearly saving against twelve monthly payments is £38", () => {
  assert.equal(YEARLY_SAVING, 38);
});

test("founding offer is £99 for the first year, for 20 places", () => {
  assert.equal(FOUNDING.firstYear, 99);
  assert.equal(FOUNDING.places, 20);
});

test("only monthly and yearly are valid plan keys", () => {
  assert.equal(isPlanKey("monthly"), true);
  assert.equal(isPlanKey("yearly"), true);
  assert.equal(isPlanKey("annual"), false);
  assert.equal(isPlanKey("lifetime"), false);
});

test("seats left come from the coupon's redemptions", () => {
  assert.equal(foundingSeatsLeft({ max_redemptions: 20, times_redeemed: 0 }), 20);
  assert.equal(foundingSeatsLeft({ max_redemptions: 20, times_redeemed: 19 }), 1);
  assert.equal(foundingSeatsLeft({ max_redemptions: 20, times_redeemed: 20 }), 0);
  assert.equal(foundingSeatsLeft({ max_redemptions: 20, times_redeemed: 25 }), 0);
});

test("no coupon, or an uncapped coupon, means no seats", () => {
  assert.equal(foundingSeatsLeft(null), 0);
  assert.equal(foundingSeatsLeft({ times_redeemed: 0 }), 0);
});
