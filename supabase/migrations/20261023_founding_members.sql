-- FOV Founding 20: up to 20 paid seats, £99 + VAT a year, price locked while subscribed.
--
-- How a seat moves:
--   reserved  -> a signed-in user started checkout; held for 35 minutes
--                (the Stripe Checkout page itself expires after 30)
--   active    -> Stripe's webhook confirmed payment; the user gets Pro
--   cancelled -> the subscription ended; Pro is switched off (seat stays used)
--   expired   -> checkout was abandoned; the seat goes back into the pool
--
-- Test-mode and live-mode seats are counted separately (livemode), so test
-- purchases never use up real seats.
--
-- Only the server can change anything: every write function is executable by
-- service_role alone (used by /api/founding/* and the Stripe webhook). Signed-in
-- users can read their own row; anyone can ask how many seats are left.

create table public.founding_members (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users (id) on delete set null,
  livemode boolean not null,
  status text not null check (status in ('reserved', 'active', 'cancelled', 'expired')),
  seat_no int,
  reserved_until timestamptz,
  checkout_session_id text unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  paid_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founding_seat_no_range check (seat_no is null or seat_no between 1 and 20)
);

-- One seat number per mode, and one live (reserved/active) seat per user per mode.
create unique index founding_members_seat_no_key on public.founding_members (livemode, seat_no) where seat_no is not null;
create unique index founding_members_one_open_seat on public.founding_members (user_id, livemode)
  where status in ('reserved', 'active');

alter table public.founding_members enable row level security;
revoke all on public.founding_members from anon, authenticated;
grant select on public.founding_members to authenticated;
create policy "Read own founding seat" on public.founding_members
  for select to authenticated using ((select auth.uid()) = user_id);

-- Stripe events already handled, so a retried webhook is recognised.
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;
revoke all on public.stripe_events from anon, authenticated;

-- Seats left (anyone may ask; returns a number only).
create function public.founding_seats_left(p_livemode boolean)
returns int language sql stable security definer set search_path = '' as $$
  select greatest(0, 20 - count(*))::int
  from public.founding_members
  where livemode = p_livemode
    and (status = 'active' or (status = 'reserved' and reserved_until > now()));
$$;
revoke execute on function public.founding_seats_left(boolean) from public;
grant execute on function public.founding_seats_left(boolean) to anon, authenticated, service_role;

-- Hold a seat for a user who is about to pay. Returns the seat row id.
-- Errors: FOUNDING_FULL, FOUNDING_ALREADY_MEMBER.
create function public.founding_reserve(p_user uuid, p_livemode boolean)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  v_id bigint;
  v_taken int;
begin
  -- One reservation at a time across the whole table, so two people can't
  -- both take the last seat.
  perform pg_advisory_xact_lock(hashtext('founding_members'));

  update public.founding_members
     set status = 'expired', updated_at = now()
   where status = 'reserved' and reserved_until <= now();

  if exists (select 1 from public.founding_members
              where user_id = p_user and livemode = p_livemode and status = 'active') then
    raise exception 'FOUNDING_ALREADY_MEMBER';
  end if;

  -- Same user starting checkout again: extend their existing hold.
  update public.founding_members
     set reserved_until = now() + interval '35 minutes', updated_at = now()
   where user_id = p_user and livemode = p_livemode and status = 'reserved'
  returning id into v_id;
  if v_id is not null then
    return v_id;
  end if;

  select count(*) into v_taken from public.founding_members
   where livemode = p_livemode and status in ('active', 'reserved');
  if v_taken >= 20 then
    raise exception 'FOUNDING_FULL';
  end if;

  insert into public.founding_members (user_id, livemode, status, reserved_until)
  values (p_user, p_livemode, 'reserved', now() + interval '35 minutes')
  returning id into v_id;
  return v_id;
end;
$$;

-- Remember which Stripe Checkout page belongs to a reservation.
create function public.founding_attach_checkout(p_id bigint, p_session text)
returns void language sql security definer set search_path = '' as $$
  update public.founding_members
     set checkout_session_id = p_session, updated_at = now()
   where id = p_id and status = 'reserved';
$$;

-- Webhook: payment confirmed. Activates the seat, numbers it and turns Pro on.
-- Safe to call more than once for the same payment.
create function public.founding_activate(
  p_id bigint, p_user uuid, p_customer text, p_subscription text
) returns int language plpgsql security definer set search_path = '' as $$
declare
  v_row public.founding_members;
  v_seat int;
begin
  perform pg_advisory_xact_lock(hashtext('founding_members'));
  select * into v_row from public.founding_members where id = p_id for update;
  if v_row.id is null or v_row.user_id is distinct from p_user then
    raise exception 'FOUNDING_SEAT_MISMATCH';
  end if;

  if v_row.status = 'active' then
    return v_row.seat_no; -- already done (retried webhook)
  end if;

  select coalesce(max(seat_no), 0) + 1 into v_seat
    from public.founding_members where livemode = v_row.livemode and seat_no is not null;
  if v_seat > 20 then
    -- Should not happen (reservations cap at 20), but never hand out a 21st seat.
    raise exception 'FOUNDING_OVERSOLD';
  end if;

  update public.founding_members
     set status = 'active', seat_no = v_seat, reserved_until = null,
         stripe_customer_id = p_customer, stripe_subscription_id = p_subscription,
         paid_at = now(), updated_at = now()
   where id = p_id;

  insert into public.entitlements (user_id, pro, source, updated_at)
  values (p_user, true, 'stripe', now())
  on conflict (user_id) do update set pro = true, source = 'stripe', updated_at = now();

  return v_seat;
end;
$$;

-- Webhook: keep Pro in line with the subscription. p_active = Stripe status is
-- active, trialing or past_due. Only Stripe-granted Pro is ever switched off,
-- so Pro given by hand is left alone.
create function public.founding_sync_subscription(p_subscription text, p_active boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_row public.founding_members;
begin
  select * into v_row from public.founding_members where stripe_subscription_id = p_subscription for update;
  if v_row.id is null then
    return;
  end if;

  if p_active then
    update public.founding_members
       set status = 'active', cancelled_at = null, updated_at = now()
     where id = v_row.id and status = 'cancelled';
    if v_row.user_id is not null then
      insert into public.entitlements (user_id, pro, source, updated_at)
      values (v_row.user_id, true, 'stripe', now())
      on conflict (user_id) do update set pro = true, source = 'stripe', updated_at = now();
    end if;
  else
    update public.founding_members
       set status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()), updated_at = now()
     where id = v_row.id;
    if v_row.user_id is not null then
      update public.entitlements
         set pro = false, updated_at = now()
       where user_id = v_row.user_id and source = 'stripe';
    end if;
  end if;
end;
$$;

-- Webhook: checkout abandoned. Frees the seat straight away.
create function public.founding_release(p_session text)
returns void language sql security definer set search_path = '' as $$
  update public.founding_members
     set status = 'expired', updated_at = now()
   where checkout_session_id = p_session and status = 'reserved';
$$;

-- Webhook: record an event id. Returns false if it was already recorded.
create function public.stripe_event_seen(p_id text, p_type text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  insert into public.stripe_events (id, type) values (p_id, p_type);
  return false;
exception when unique_violation then
  return true;
end;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.founding_reserve(uuid, boolean)',
    'public.founding_attach_checkout(bigint, text)',
    'public.founding_activate(bigint, uuid, text, text)',
    'public.founding_sync_subscription(text, boolean)',
    'public.founding_release(text)',
    'public.stripe_event_seen(text, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
