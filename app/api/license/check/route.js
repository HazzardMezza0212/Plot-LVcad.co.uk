import Stripe from "stripe";
import {
  getLicenseByKey,
  getActivation,
  touchActivation,
  countLiveActivations,
  updateSubCheck,
} from "@/lib/licenseDb";
import { signLicenseToken } from "@/lib/signToken";

// One endpoint for both first activation and the weekly re-check.
// The Flame client POSTs { key, machine_hash, app_version } and gets back a
// signed token valid TOKEN_DAYS. Failures return a reason code + a message
// safe to show the user directly.

const TOKEN_DAYS = 7;
const SEAT_LIMIT = 2;
const KEY_RE = /^FLAME-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$/;
const HASH_RE = /^[0-9a-f]{64}$/;

// Best-effort in-memory rate limit. Serverless instances don't share memory,
// so this is a speed bump, not a wall — swap for Upstash Ratelimit if abuse
// ever shows up in the logs. The 10^22 key space does the heavy lifting.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip) ?? { n: 0, reset: now + 3600_000 };
  if (now > rec.reset) { rec.n = 0; rec.reset = now + 3600_000; }
  rec.n += 1;
  hits.set(ip, rec);
  return rec.n > 30;
}

function deny(reason, message, status = 403) {
  return Response.json({ ok: false, reason, message }, { status });
}

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  if (rateLimited(ip)) {
    return deny("rate_limited", "Too many attempts — try again in an hour.", 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return deny("bad_request", "Malformed request.", 400);
  }
  const { key, machine_hash: machineHash } = body ?? {};
  if (typeof key !== "string" || !KEY_RE.test(key.trim().toUpperCase())) {
    return deny("invalid_key", "Licence key not recognised — check for typos.");
  }
  if (typeof machineHash !== "string" || !HASH_RE.test(machineHash)) {
    return deny("bad_request", "Malformed request.", 400);
  }
  const normKey = key.trim().toUpperCase();

  const license = await getLicenseByKey(normKey);
  if (!license) {
    return deny("invalid_key", "Licence key not recognised — check for typos.");
  }
  if (license.status === "revoked") {
    return deny("revoked", "This licence has been revoked (refunded order). Contact support if that's wrong.");
  }
  if (license.status === "lapsed") {
    return deny("lapsed", "Your subscription has ended. Restart it at the Plot-LV site to keep using Flame.");
  }

  // Monthly plans: confirm the Stripe subscription is still alive, at most
  // once per 24h (cached in sub_checked_at). If Stripe itself is down we fall
  // back to the cached verdict — availability beats strictness here.
  if (license.plan === "monthly" && license.stripe_subscription) {
    const ageMs = license.sub_checked_at
      ? Date.now() - new Date(license.sub_checked_at).getTime()
      : Infinity;
    if (ageMs > 24 * 3600_000) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const sub = await stripe.subscriptions.retrieve(license.stripe_subscription);
        await updateSubCheck(normKey, sub.status);
        if (!["active", "trialing", "past_due"].includes(sub.status)) {
          return deny("lapsed", "Your subscription has ended. Restart it at the Plot-LV site to keep using Flame.");
        }
      } catch (err) {
        console.error("[license] Stripe sub check failed, using cached status", err.message);
        if (license.sub_status && !["active", "trialing", "past_due"].includes(license.sub_status)) {
          return deny("lapsed", "Your subscription has ended. Restart it at the Plot-LV site to keep using Flame.");
        }
      }
    } else if (license.sub_status && !["active", "trialing", "past_due"].includes(license.sub_status)) {
      return deny("lapsed", "Your subscription has ended. Restart it at the Plot-LV site to keep using Flame.");
    }
  }

  // Seat enforcement — the part that actually stops key sharing. A machine
  // already registered just refreshes; a new machine only gets in if fewer
  // than SEAT_LIMIT others were seen in the last 30 days.
  const existing = await getActivation(normKey, machineHash);
  if (!existing) {
    const others = await countLiveActivations(normKey, machineHash);
    if (others >= SEAT_LIMIT) {
      return deny(
        "seat_limit",
        `This licence is already in use on ${SEAT_LIMIT} machines. It covers ${SEAT_LIMIT} installs (e.g. office PC + laptop); a machine unused for 30 days frees its slot automatically. Contact support to move it sooner.`
      );
    }
  }
  await touchActivation(normKey, machineHash);

  const iat = Math.floor(Date.now() / 1000);
  const payload = {
    key: normKey,
    machine: machineHash,
    plan: license.plan,
    iat,
    exp: iat + TOKEN_DAYS * 86400,
  };
  return Response.json({ ok: true, token: signLicenseToken(payload), exp: payload.exp, plan: license.plan });
}
