-- Plot-LV: Pro entitlements. One row per user who has (or had) Pro.
-- No row means not Pro. Users can read their own row and can never write.
-- Applied to the Plot-LV project on 2026-10-22.
create table public.entitlements (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  pro        boolean not null default false,
  source     text not null default 'manual' check (source in ('manual', 'stripe')),
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;
revoke all on public.entitlements from anon, authenticated;
grant select on public.entitlements to authenticated;

create policy "Read own entitlement" on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

-- Deliberately no insert/update/delete policy and no write grants.
-- Writes happen only from the SQL editor or the service role (Stripe webhook later).
--
-- Grant Pro by hand:
--   insert into public.entitlements (user_id, pro)
--   select id, true from auth.users where email = 'someone@example.com'
--   on conflict (user_id) do update set pro = true, updated_at = now();
