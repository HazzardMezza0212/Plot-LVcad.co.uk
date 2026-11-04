// Shared fakes for the Stripe tests. No network and no real database.

export const NOW = new Date("2026-11-10T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
export const daysFromNow = (d) => new Date(NOW.getTime() + d * DAY).toISOString();

// In-memory stand-in for lib/stripe/store.js. Counts every write so tests can assert
// that a repeated event causes none.
export function createFakeDb(seedRows = []) {
  const rows = new Map(seedRows.map((r) => [r.user_id, { pro: false, source: "manual", status: null, stripe_customer_id: null, stripe_subscription_id: null, current_period_end: null, grace_until: null, last_event_created: null, ...r }]));
  const events = new Map();
  const writes = [];
  const find = (pred) => {
    for (const r of rows.values()) if (pred(r)) return { ...r };
    return null;
  };
  return {
    rows,
    events,
    writes,
    async getEntitlement(userId) {
      const r = rows.get(userId);
      return r ? { ...r } : null;
    },
    async findBySubscription(id) {
      return find((r) => r.stripe_subscription_id === id);
    },
    async findByCustomer(id) {
      return find((r) => r.stripe_customer_id === id);
    },
    async saveEntitlement(row) {
      writes.push({ ...row });
      rows.set(row.user_id, { ...rows.get(row.user_id), ...row });
    },
    async hasEvent(id) {
      return events.has(id);
    },
    async recordEvent(id, type) {
      events.set(id, type);
    },
  };
}

let counter = 0;
// `created` is Stripe's event time in seconds. Defaults to NOW, so events built without it
// share one timestamp and never count as stale.
export const NOW_SECONDS = Math.floor(NOW.getTime() / 1000);
export function event(type, object, id, created = NOW_SECONDS) {
  counter += 1;
  return { id: id ?? `evt_test_${counter}`, object: "event", type, created, data: { object } };
}

export const USER = "11111111-1111-4111-8111-111111111111";
export const CUSTOMER = "cus_test_1";
export const SUB = "sub_test_1";

export function subscription({ id = SUB, status = "active", userId = USER, customer = CUSTOMER, periodEndSeconds = 1767000000, periodOnItems = false } = {}) {
  const period = periodOnItems ? undefined : periodEndSeconds;
  return {
    id,
    object: "subscription",
    customer,
    status,
    metadata: userId ? { user_id: userId } : {},
    ...(period !== undefined ? { current_period_end: period } : {}),
    items: { object: "list", data: [{ current_period_end: periodEndSeconds }] },
  };
}

export function checkoutSession({ userId = USER, customer = CUSTOMER, subscriptionId = SUB } = {}) {
  return { id: "cs_test_1", object: "checkout.session", client_reference_id: userId, customer, subscription: subscriptionId, mode: "subscription", payment_status: "paid" };
}

export function paymentFailedInvoice({ subscriptionId = SUB, customer = CUSTOMER } = {}) {
  return { id: "in_test_1", object: "invoice", customer, subscription: subscriptionId };
}
