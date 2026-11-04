-- FOV Pro: Stripe subscription state on the entitlement row.
-- NOT YET APPLIED to production. Review, then apply on the Plot-LV project.
--
-- Adds the three columns the Stripe webhook writes so the past_due grace window can end
-- without waiting for another event. The `pro` boolean stays, and the webhook keeps it in
-- step with the grace rule (lib/stripe/entitlement.js). Readers use the rule, so a lapsed
-- grace period stops access even if no new event arrives.
--
-- Access stays as it was: users can read their own row (existing SELECT policy) and can
-- write nothing. Only the service role (the webhook) writes Stripe fields. No policy or
-- grant is added here.

alter table public.entitlements
  add column if not exists status             text,
  add column if not exists current_period_end timestamptz,
  add column if not exists grace_until        timestamptz;
