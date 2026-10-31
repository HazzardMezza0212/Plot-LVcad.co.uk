-- Plot-LV: custom cameras entered by Pro users in the FOV tool. Applied 2026-10-22.
-- spec holds the camera's fields (see FOV src/cameraLibrary.ts); the site route checks its
-- shape, the tool validates it fully when loading.
create table public.custom_cameras (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  spec       jsonb not null check (jsonb_typeof(spec) = 'object' and pg_column_size(spec) < 4096),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index custom_cameras_user_idx on public.custom_cameras (user_id);

alter table public.custom_cameras enable row level security;
revoke all on public.custom_cameras from anon, authenticated;
grant select, insert, update, delete on public.custom_cameras to authenticated;

create policy "Read own cameras" on public.custom_cameras
  for select to authenticated using ((select auth.uid()) = user_id);

-- Writing needs Pro, checked in the database, and is capped at 200 cameras each.
create policy "Pro users add own cameras" on public.custom_cameras
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.entitlements e where e.user_id = (select auth.uid()) and e.pro)
    and (select count(*) from public.custom_cameras c where c.user_id = (select auth.uid())) < 200);

create policy "Pro users edit own cameras" on public.custom_cameras
  for update to authenticated
  using ((select auth.uid()) = user_id
         and exists (select 1 from public.entitlements e where e.user_id = (select auth.uid()) and e.pro))
  with check ((select auth.uid()) = user_id);

-- Deleting stays allowed if Pro lapses.
create policy "Delete own cameras" on public.custom_cameras
  for delete to authenticated using ((select auth.uid()) = user_id);
