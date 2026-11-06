import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { isProPath, isSafeProFileName, decideProFile } from "../../lib/cctv-pro/gate.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ALLOW = new Set(["proKit-CV3viYEN.js", "heat.worker-dfBH4Ro6.js", "dxfWorker-puwsHDCW.js"]);
const FILE = "proKit-CV3viYEN.js";
const CLAIMS = { sub: "11111111-1111-4111-8111-111111111111" };
const NOW = new Date("2026-11-10T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const PRO = { pro: true, status: null, grace_until: null };
const FREE = { pro: false, status: null, grace_until: null };
const REFUSED = { serve: false };

// Encoded paths: every one must be recognised as Pro code.
test("encoded paths to Pro code are all recognised", () => {
  for (const p of [
    "/%63ctv/assets/pro/proKit-CV3viYEN.js",
    "/cctv/assets/%70ro/proKit-CV3viYEN.js",
    "/cctv/assets/pr%6F/proKit-CV3viYEN.js",
    "/cctv/assets/pro%2FproKit-CV3viYEN.js",
    "/cctv/assets/pro/proKit-CV3viYEN.js",
    "/CCTV/ASSETS/PRO/proKit-CV3viYEN.js",
    "/cctv/assets/%2570ro/proKit-CV3viYEN.js", // double encoded
  ]) {
    assert.equal(isProPath(p), true, p);
  }
});

test("a path that will not decode is treated as Pro (refused)", () => {
  assert.equal(isProPath("/cctv/assets/%E0%A4%A/x.js"), true);
});

test("free and unrelated paths are not Pro code", () => {
  for (const p of ["/cctv/assets/index-CLi8veof.js", "/cctv/index.html", "/cctv/assets/pdf-DKzXiTeL.js", "/account"]) {
    assert.equal(isProPath(p), false, p);
  }
});

test("file names: only plain .js/.mjs names pass the shape check", () => {
  assert.equal(isSafeProFileName("proKit-CV3viYEN.js"), true);
  assert.equal(isSafeProFileName("heat.worker-dfBH4Ro6.mjs"), true);
  for (const bad of ["../x.js", "%2e%2e.js", "a/b.js", "..js", ".js", "x.js%00", "x.js?q=1", "x.css", "x y.js", "", null, undefined]) {
    assert.equal(isSafeProFileName(bad), false, JSON.stringify(bad));
  }
});

test("signed out gets the refusal", () => {
  assert.deepEqual(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: null, entitlement: PRO, now: NOW }), REFUSED);
});

test("signed in, free account gets the refusal", () => {
  assert.deepEqual(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: CLAIMS, entitlement: FREE, now: NOW }), REFUSED);
  assert.deepEqual(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: CLAIMS, entitlement: null, now: NOW }), REFUSED);
});

test("signed in Pro account gets the file", () => {
  assert.deepEqual(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: CLAIMS, entitlement: PRO, now: NOW }), { serve: true, fileName: FILE });
});

test("a lapsed subscription gets the refusal, and one inside its grace window gets the file", () => {
  const lapsed = { pro: true, status: "past_due", grace_until: new Date(NOW.getTime() - DAY).toISOString() };
  const inGrace = { pro: true, status: "past_due", grace_until: new Date(NOW.getTime() + DAY).toISOString() };
  const canceled = { pro: true, status: "canceled", grace_until: null };
  assert.deepEqual(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: CLAIMS, entitlement: lapsed, now: NOW }), REFUSED);
  assert.deepEqual(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: CLAIMS, entitlement: canceled, now: NOW }), REFUSED);
  assert.equal(decideProFile({ fileName: FILE, allowlist: ALLOW, claims: CLAIMS, entitlement: inGrace, now: NOW }).serve, true);
});

test("an unknown file, even for Pro, gets the refusal", () => {
  assert.deepEqual(decideProFile({ fileName: "secret.js", allowlist: ALLOW, claims: CLAIMS, entitlement: PRO, now: NOW }), REFUSED);
});

test("a traversal or encoded name gets the refusal, even for Pro", () => {
  for (const f of ["../package.json", "%2e%2e/x.js", "..%2fproKit-CV3viYEN.js", "proKit-CV3viYEN.js/../x.js"]) {
    assert.deepEqual(decideProFile({ fileName: f, allowlist: ALLOW, claims: CLAIMS, entitlement: PRO, now: NOW }), REFUSED, f);
  }
});

test("every refusal is the same object, so callers can't tell them apart", () => {
  const cases = [
    { fileName: FILE, claims: null, entitlement: PRO },
    { fileName: FILE, claims: CLAIMS, entitlement: FREE },
    { fileName: "nope.js", claims: CLAIMS, entitlement: PRO },
    { fileName: "../x.js", claims: CLAIMS, entitlement: PRO },
  ];
  for (const c of cases) assert.deepEqual(decideProFile({ allowlist: ALLOW, now: NOW, ...c }), REFUSED);
});

// Route configuration: the file must be read at request time from private/, and traced into the function.

test("the route is Node, always dynamic, and reads only from private/cctv-pro", () => {
  const src = readFileSync(join(ROOT, "app/cctv/assets/pro/[file]/route.js"), "utf8");
  assert.match(src, /export const runtime = "nodejs"/);
  assert.match(src, /export const dynamic = "force-dynamic"/);
  assert.match(src, /private", "cctv-pro"/);
  assert.doesNotMatch(src, /public/);
});

test("the Pro folder is traced into the route's function", () => {
  const cfg = readFileSync(join(ROOT, "next.config.mjs"), "utf8");
  assert.ok(cfg.includes("outputFileTracingIncludes"), "tracing option");
  assert.ok(cfg.includes(String.raw`/cctv/assets/pro/\\[file\\]`), "route key");
  assert.ok(cfg.includes("./private/cctv-pro/**/*"), "traced folder");
});

test("the proxy uses the same decoded-path check", () => {
  const src = readFileSync(join(ROOT, "proxy.js"), "utf8");
  assert.match(src, /isProPath\(request\.nextUrl\.pathname\)/);
});
