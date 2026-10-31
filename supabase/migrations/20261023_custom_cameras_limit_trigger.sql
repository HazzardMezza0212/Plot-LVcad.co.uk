-- Fix: the insert policy counted rows in custom_cameras from inside a custom_cameras policy,
-- which Postgres rejects as infinite recursion, so every insert failed. Ownership and Pro stay
-- in the policy; the 200-camera limit moves to a trigger (errcode P0200, read by /api/me/cameras).
drop policy "Pro users add own cameras" on public.custom_cameras;

create policy "Pro users add own cameras" on public.custom_cameras
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.entitlements e where e.user_id = (select auth.uid()) and e.pro));

create function public.custom_cameras_limit() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (select count(*) from public.custom_cameras where user_id = new.user_id) >= 200 then
    raise exception 'custom camera limit reached' using errcode = 'P0200',
      hint = 'You can store up to 200 custom cameras.';
  end if;
  return new;
end $$;

create trigger custom_cameras_limit before insert on public.custom_cameras
  for each row execute function public.custom_cameras_limit();
