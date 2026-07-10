import { sql } from "@/lib/db";

// All queries use the Neon driver's tagged templates — parameterised, so
// user-supplied values can never be interpreted as SQL.

export async function insertLicense({ key, email, plan, session, customer, subscription }) {
  // stripe_session is UNIQUE: if Stripe retries the webhook we insert nothing
  // and return null, so the caller can skip sending a duplicate email.
  const rows = await sql`
    INSERT INTO licenses (key, email, plan, stripe_session, stripe_customer, stripe_subscription)
    VALUES (${key}, ${email}, ${plan}, ${session}, ${customer}, ${subscription})
    ON CONFLICT (stripe_session) DO NOTHING
    RETURNING key`;
  return rows[0]?.key ?? null;
}

export async function getLicenseBySession(sessionId) {
  const rows = await sql`SELECT * FROM licenses WHERE stripe_session = ${sessionId}`;
  return rows[0];
}

export async function getLicenseByKey(key) {
  const rows = await sql`SELECT * FROM licenses WHERE key = ${key}`;
  return rows[0];
}

export async function setStatusBySubscription(subscriptionId, status) {
  await sql`UPDATE licenses SET status = ${status} WHERE stripe_subscription = ${subscriptionId}`;
}

export async function setStatusByCustomer(customerId, status) {
  await sql`UPDATE licenses SET status = ${status} WHERE stripe_customer = ${customerId}`;
}

export async function updateSubCheck(key, subStatus) {
  await sql`UPDATE licenses SET sub_status = ${subStatus}, sub_checked_at = now() WHERE key = ${key}`;
}

export async function getActivation(key, machineHash) {
  const rows = await sql`
    SELECT * FROM activations WHERE license_key = ${key} AND machine_hash = ${machineHash}`;
  return rows[0];
}

export async function touchActivation(key, machineHash) {
  await sql`
    INSERT INTO activations (license_key, machine_hash)
    VALUES (${key}, ${machineHash})
    ON CONFLICT (license_key, machine_hash) DO UPDATE SET last_seen = now()`;
}

// "Live" = seen in the last 30 days. Machines idle longer fall off the seat
// count automatically, so replacing a laptop needs no support ticket.
export async function countLiveActivations(key, excludeMachineHash) {
  const rows = await sql`
    SELECT count(*)::int AS n FROM activations
    WHERE license_key = ${key}
      AND machine_hash <> ${excludeMachineHash}
      AND last_seen > now() - interval '30 days'`;
  return rows[0].n;
}
