import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Supabase implementation of the `db` interface used by subscriptionSync.js.
// Uses the service role, so it is called only from the webhook route.

const COLUMNS =
  "user_id, pro, source, status, stripe_customer_id, stripe_subscription_id, current_period_end, grace_until, last_event_created";

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export function createStripeStore() {
  const admin = createAdminClient();
  const entitlements = () => admin.from("entitlements");

  return {
    async getEntitlement(userId) {
      return unwrap(await entitlements().select(COLUMNS).eq("user_id", userId).maybeSingle());
    },
    async findBySubscription(subscriptionId) {
      return unwrap(await entitlements().select(COLUMNS).eq("stripe_subscription_id", subscriptionId).maybeSingle());
    },
    async findByCustomer(customerId) {
      return unwrap(await entitlements().select(COLUMNS).eq("stripe_customer_id", customerId).maybeSingle());
    },
    async saveEntitlement(row) {
      unwrap(await entitlements().upsert(row, { onConflict: "user_id" }));
    },
    async hasEvent(eventId) {
      return unwrap(await admin.from("stripe_events").select("id").eq("id", eventId).maybeSingle()) != null;
    },
    async recordEvent(eventId, type) {
      unwrap(await admin.from("stripe_events").upsert({ id: eventId, type }, { onConflict: "id", ignoreDuplicates: true }));
    },
  };
}
