-- Site settings the app reads at request time, so they can change without a redeploy.
-- NOT YET APPLIED to production. Review, then apply on the Plot-LV project.
--
-- 'pro_checkout' is the pause switch for new FOV Pro purchases: {"open": true} opens checkout,
-- {"open": false} pauses it. Existing subscribers are not affected: the webhook, the billing
-- portal and Pro access never read this row.
--
-- RLS is on with no policies, and the API roles have no grants. Only the service role (the app's
-- server code) can read or write this table.

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
revoke all on table public.site_settings from anon, authenticated;

insert into public.site_settings (key, value)
values ('pro_checkout', '{"open": true}')
on conflict (key) do nothing;
