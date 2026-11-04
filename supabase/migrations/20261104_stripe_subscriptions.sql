-- FOV Pro: Stripe subscription state on the entitlement row.
-- NOT YET APPLIED to production. Review, then apply on the Plot-LV project.
--
-- Adds the columns the Stripe webhook writes. The existing `pro` boolean stays, and the
-- webhook keeps it in step with the grace rule (lib/stripe/entitlement.js). Readers use the
-- rule, so a lapsed grace period stops access even if no new event arrives.
--
-- last_event_created is the Stripe event time the row was last written from. The webhook
-- ignores any event older than it, so a late delivery cannot overwrite newer state.
--
-- Access stays as it was: users can read their own row (existing SELECT policy) and can
-- write nothing. Only the service role (the webhook) writes Stripe fields. No policy or
-- grant is added here.

alter table public.entitlements
  add column if not exists stripe_customer_id     text,
  add column if not exists stripe_subscription_id text,
  add column if not exists status                 text,
  add column if not exists current_period_end     timestamptz,
  add column if not exists grace_until            timestamptz,
  add column if not exists last_event_created     timestamptz;

create index if not exists entitlements_stripe_customer_id_idx
  on public.entitlements (stripe_customer_id);

create index if not exists entitlements_stripe_subscription_id_idx
  on public.entitlements (stripe_subscription_id);
