-- FOV Pro early access list.
--
-- Visitors (signed in or not) can join through join_pro_early_access(), which
-- the /api/early-access route calls. Nobody can read the table through the
-- public API: RLS is on with no policies, so only the Supabase dashboard (or
-- the service role) sees the rows. Joining again with the same email updates
-- the entry (filling blanks only) instead of adding a duplicate.

create table public.pro_early_access (
  id bigint generated always as identity primary key,
  email text not null unique, -- stored lower-case
  name text,
  role text,
  wants text,
  updates_opt_in boolean not null default false,
  source text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pro_early_access_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  constraint pro_early_access_lengths check (
    coalesce(length(name), 0) <= 120 and coalesce(length(role), 0) <= 60 and
    coalesce(length(wants), 0) <= 1000 and coalesce(length(source), 0) <= 40
  )
);

alter table public.pro_early_access enable row level security;
-- No policies on purpose: the list is private.

create function public.join_pro_early_access(
  p_email text, p_name text, p_role text, p_wants text, p_updates_opt_in boolean, p_source text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.pro_early_access (email, name, role, wants, updates_opt_in, source, user_id)
  values (
    lower(trim(p_email)), nullif(trim(p_name), ''), nullif(trim(p_role), ''),
    nullif(trim(p_wants), ''), coalesce(p_updates_opt_in, false), nullif(trim(p_source), ''), auth.uid()
  )
  -- A repeat signup only fills in blanks, so nobody can overwrite another
  -- person's answers by reusing their email address.
  on conflict (email) do update set
    name = coalesce(public.pro_early_access.name, excluded.name),
    role = coalesce(public.pro_early_access.role, excluded.role),
    wants = coalesce(public.pro_early_access.wants, excluded.wants),
    source = coalesce(public.pro_early_access.source, excluded.source),
    user_id = coalesce(public.pro_early_access.user_id, excluded.user_id),
    updated_at = now();
end;
$$;

revoke execute on function public.join_pro_early_access(text, text, text, text, boolean, text) from public;
grant execute on function public.join_pro_early_access(text, text, text, text, boolean, text) to anon, authenticated;
