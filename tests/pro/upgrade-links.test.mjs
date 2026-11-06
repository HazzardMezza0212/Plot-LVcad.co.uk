import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { upgradePath, signupHref, loginHref, signupNextPath } from "../../lib/upgradeLinks.js";

test("upgrade links keep the chosen plan and fall back to yearly", () => {
  assert.equal(upgradePath("monthly"), "/account?upgrade=monthly#upgrade");
  assert.equal(upgradePath("lifetime"), "/account?upgrade=yearly#upgrade");
  assert.equal(signupHref("monthly"), "/signup?plan=monthly");
  assert.equal(signupHref(undefined), "/signup?plan=yearly");
  assert.equal(loginHref("yearly"), "/login?next=%2Faccount%3Fupgrade%3Dyearly%23upgrade");
});

test("sign-up confirmation lands on the upgrade panel only when a plan was picked", () => {
  assert.equal(signupNextPath("yearly"), "/account?welcome=1&upgrade=yearly#upgrade");
  assert.equal(signupNextPath(null), "/account?welcome=1");
  assert.equal(signupNextPath("https://evil.example"), "/account?welcome=1");
});

test("after launch, signed-out visitors get the sign-up button, not the notify form", () => {
  const src = readFileSync(new URL("../../components/site/ProPricing.js", import.meta.url), "utf8");
  // signed in -> account link; signed out + live -> signup; signed out + not live -> notify form
  assert.match(src, /signedIn \? \([\s\S]*\) : PRO_LIVE \? \([\s\S]*signupHref\(plan\)[\s\S]*\) : \(\s*<ProNotify \/>/);
});

test("early access is saved with the server key and always needs the CAPTCHA", () => {
  const src = readFileSync(new URL("../../app/api/early-access/route.js", import.meta.url), "utf8");
  assert.match(src, /createAdminClient\(\)/);
  assert.doesNotMatch(src, /lib\/supabase\/server/);
  assert.match(src, /captcha: true/);
  const sql = readFileSync(new URL("../../supabase/migrations/20261106_lock_early_access.sql", import.meta.url), "utf8");
  assert.match(sql, /revoke execute on function public\.join_pro_early_access[\s\S]*from public, anon, authenticated/);
});
