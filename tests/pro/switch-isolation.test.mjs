import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// The pause switch must never affect existing subscribers. These checks read the source of the
// paths that handle existing subscriptions and assert that none of them reads the switch.
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const SWITCH = /pro_checkout|isProCheckoutOpenNow|checkoutOpenFromRead|checkoutSettingOpen/;

test("the Stripe webhook does not read the pause switch", () => {
  assert.equal(SWITCH.test(read("app/api/stripe/webhook/route.js")), false);
});

test("the billing portal does not read the pause switch", () => {
  assert.equal(SWITCH.test(read("app/api/pro/portal/route.js")), false);
});

test("the Pro entitlement rule does not read the pause switch", () => {
  assert.equal(SWITCH.test(read("lib/stripe/entitlement.js")), false);
});

test("the switch is read only by checkout and the account page", () => {
  assert.equal(SWITCH.test(read("app/api/pro/checkout/route.js")), true);
  assert.equal(SWITCH.test(read("app/account/page.js")), true);
});
