import { test } from "node:test";
import assert from "node:assert/strict";
import { isProEntitled, graceUntilFrom, GRACE_DAYS } from "../../lib/stripe/entitlement.js";
import { NOW, daysFromNow } from "./helpers.mjs";

test("grace-period rule", async (t) => {
  const cases = [
    ["active is Pro", { status: "active" }, true],
    ["trialing is Pro", { status: "trialing" }, true],
    ["past_due inside the grace window is Pro", { status: "past_due", grace_until: daysFromNow(3) }, true],
    ["past_due after the grace window is not Pro", { status: "past_due", grace_until: daysFromNow(-1) }, false],
    ["past_due with no grace date is not Pro", { status: "past_due", grace_until: null }, false],
    ["past_due with an unreadable grace date is not Pro", { status: "past_due", grace_until: "not a date" }, false],
    ["canceled is not Pro", { status: "canceled" }, false],
    ["unpaid is not Pro", { status: "unpaid" }, false],
    ["incomplete is not Pro", { status: "incomplete" }, false],
    ["paused is not Pro", { status: "paused" }, false],
    ["a canceled row with a future grace date is not Pro", { status: "canceled", grace_until: daysFromNow(3) }, false],
    ["no row is not Pro", null, false],
    ["manual grant (no Stripe status) with pro=true is Pro", { status: null, pro: true }, true],
    ["no Stripe status and pro=false is not Pro", { status: null, pro: false }, false],
  ];
  for (const [name, row, expected] of cases) {
    await t.test(name, () => {
      assert.equal(isProEntitled(row, NOW), expected);
    });
  }
});

test("grace is seven days from the given time", () => {
  assert.equal(GRACE_DAYS, 7);
  assert.equal(graceUntilFrom(NOW).toISOString(), daysFromNow(7));
});
