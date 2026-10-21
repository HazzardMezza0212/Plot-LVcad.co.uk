-- Plot-LV: account profiles, marketing-consent log and account self-service.
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to inspect: it only creates new tables/functions/trigger in "public"
-- and one trigger on auth.users. It does not change or remove existing data.

-- One row per account: current email-preference state and terms acceptance.
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  marketing_opt_in boolean not null default false,
  marketing_updated_at timestamptz,
  terms_version text,
  terms_accepted_at timestamptz,
  privacy_version text,
  resend_synced_at timestamptz,
  created_at timestamptz not null default now()
);

-- Append-only log of every email-preference decision (evidence of consent).
create table public.marketing_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted boolean not null,
  source text not null check (source in ('signup', 'account', 'email_unsubscribe')),
  wording text not null,
  created_at timestamptz not null default now()
);
create index marketing_consent_events_user_idx
  on public.marketing_consent_events (user_id, created_at desc);

-- Lock down: users may only READ their own rows. All writes go through the
-- security-definer functions below.
alter table public.profiles enable row level security;
alter table public.marketing_consent_events enable row level security;
revoke all on public.profiles from anon, authenticated;
revoke all on public.marketing_consent_events from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.marketing_consent_events to authenticated;

create policy "Read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Read own consent history" on public.marketing_consent_events
  for select to authenticated using ((select auth.uid()) = user_id);

-- The exact wording shown next to the tick box (version v1).
create function public.marketing_wording_v1()
returns text language sql immutable set search_path = '' as $$
  select 'v1: Email me Plot-LV product updates and launch news. I can unsubscribe at any time.'::text
$$;

-- On sign-up: create the profile and record the opt-in choice. Anything other
-- than an explicit "true" is recorded as NOT opted in.
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  opted boolean := coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', '') = 'true';
  terms text := nullif(left(new.raw_user_meta_data ->> 'terms_version', 20), '');
  privacy text := nullif(left(new.raw_user_meta_data ->> 'privacy_version', 20), '');
begin
  insert into public.profiles
    (user_id, marketing_opt_in, marketing_updated_at, terms_version, terms_accepted_at, privacy_version)
  values
    (new.id, opted, now(), terms, case when terms is not null then now() end, privacy);
  insert into public.marketing_consent_events (user_id, granted, source, wording)
  values (new.id, opted, 'signup', public.marketing_wording_v1());
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Change your own email preference (from the account page, or when an
-- unsubscribe made through an email link is detected).
create function public.set_marketing_consent(p_granted boolean, p_source text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_granted is null then raise exception 'choice required'; end if;
  if p_source not in ('account', 'email_unsubscribe') then raise exception 'invalid source'; end if;

  insert into public.profiles (user_id) values (uid) on conflict (user_id) do nothing;
  update public.profiles
     set marketing_opt_in = p_granted, marketing_updated_at = now(), resend_synced_at = null
   where user_id = uid;
  insert into public.marketing_consent_events (user_id, granted, source, wording)
  values (uid, p_granted, p_source, public.marketing_wording_v1());
end;
$$;

-- Record that the mailing-list provider now matches this account's choice.
create function public.mark_resend_synced()
returns void language sql security definer set search_path = '' as $$
  update public.profiles set resend_synced_at = now() where user_id = auth.uid();
$$;

-- Permanently delete your own account. Profile and consent log go with it
-- (on delete cascade).
create function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = uid;
end;
$$;

-- Only signed-in users may call the account functions; nobody may call the
-- trigger or wording helpers directly over the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.marketing_wording_v1() from public, anon, authenticated;
revoke execute on function public.set_marketing_consent(boolean, text) from public, anon;
revoke execute on function public.mark_resend_synced() from public, anon;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.set_marketing_consent(boolean, text) to authenticated;
grant execute on function public.mark_resend_synced() to authenticated;
grant execute on function public.delete_my_account() to authenticated;

-- Accounts created before this migration: create their profile from what
-- they chose at sign-up (stored on the account). Anyone without an explicit
-- opt-in is recorded as opted OUT.
insert into public.profiles
  (user_id, marketing_opt_in, marketing_updated_at, terms_version, terms_accepted_at, privacy_version)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'marketing_opt_in', '') = 'true',
  u.created_at,
  nullif(left(u.raw_user_meta_data ->> 'terms_version', 20), ''),
  case when nullif(u.raw_user_meta_data ->> 'terms_version', '') is not null then u.created_at end,
  nullif(left(u.raw_user_meta_data ->> 'privacy_version', 20), '')
from auth.users u
on conflict (user_id) do nothing;

insert into public.marketing_consent_events (user_id, granted, source, wording, created_at)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'marketing_opt_in', '') = 'true',
  'signup',
  public.marketing_wording_v1(),
  u.created_at
from auth.users u
where u.raw_user_meta_data ? 'marketing_opt_in';
