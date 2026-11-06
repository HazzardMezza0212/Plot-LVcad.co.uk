import { test } from "node:test";
import assert from "node:assert/strict";
import { checkoutSettingOpen, checkoutOpenFromRead } from "../../lib/checkout-switch.js";

const row = (value) => ({ data: { value }, error: null });

test("only an explicit open:true opens checkout", () => {
  assert.equal(checkoutOpenFromRead(row({ open: true })), true);
});

test("open:false pauses checkout", () => {
  assert.equal(checkoutOpenFromRead(row({ open: false })), false);
});

test("fails closed: missing row, read error, malformed or truthy-but-not-true values", () => {
  assert.equal(checkoutOpenFromRead({ data: null, error: null }), false, "missing row");
  assert.equal(checkoutOpenFromRead({ data: null, error: { message: "db down" } }), false, "read error");
  assert.equal(checkoutOpenFromRead({ data: { value: { open: "true" } }, error: null }), false, "string true");
  assert.equal(checkoutOpenFromRead({ data: { value: { open: 1 } }, error: null }), false, "number 1");
  assert.equal(checkoutOpenFromRead({ data: { value: null }, error: null }), false, "null value");
  assert.equal(checkoutOpenFromRead({ data: { value: {} }, error: null }), false, "no open key");
  assert.equal(checkoutOpenFromRead(undefined), false, "no result");
});

test("checkoutSettingOpen alone also needs open === true", () => {
  assert.equal(checkoutSettingOpen({ value: { open: true } }), true);
  assert.equal(checkoutSettingOpen({ value: { open: false } }), false);
  assert.equal(checkoutSettingOpen(null), false);
});
