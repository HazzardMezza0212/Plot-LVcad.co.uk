-- Applied 27 Oct 2026 (security review).
-- 1. Tables the browser must never touch directly: no API grants at all.
revoke all on table public.pro_early_access from anon, authenticated;
revoke all on table public.site_admins from anon, authenticated;
revoke all on table public.stripe_events from anon, authenticated;
revoke insert, update, delete, truncate on table public.entitlements from anon, authenticated;
revoke insert, update, delete, truncate on table public.founding_members from anon, authenticated;
revoke insert, update, delete, truncate on table public.profiles from anon, authenticated;
revoke insert, update, delete, truncate on table public.marketing_consent_events from anon, authenticated;

-- 2. Trigger function doesn't need to be callable through the API.
revoke execute on function public.custom_cameras_limit() from public, anon, authenticated;

-- 3. join_pro_early_access is callable via /rest/v1/rpc, so it validates its own input.
create or replace function public.join_pro_early_access(
  p_email text, p_name text, p_role text, p_wants text, p_updates_opt_in boolean, p_source text
) returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
begin
  if length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid email' using errcode = '22023';
  end if;
  if p_source is not null and trim(p_source) not in ('landing', 'tool', 'account') then
    raise exception 'invalid source' using errcode = '22023';
  end if;
  if p_role is not null and trim(p_role) <> ''
     and trim(p_role) not in ('Installer', 'Consultant / designer', 'Integrator', 'End user / facilities', 'Other') then
    raise exception 'invalid role' using errcode = '22023';
  end if;

  insert into public.pro_early_access (email, name, role, wants, updates_opt_in, source, user_id)
  values (
    v_email,
    left(nullif(trim(p_name), ''), 120),
    nullif(trim(p_role), ''),
    left(nullif(trim(p_wants), ''), 1000),
    coalesce(p_updates_opt_in, false),
    nullif(trim(p_source), ''),
    auth.uid()
  )
  on conflict (email) do update set
    name = coalesce(public.pro_early_access.name, excluded.name),
    role = coalesce(public.pro_early_access.role, excluded.role),
    wants = coalesce(public.pro_early_access.wants, excluded.wants),
    source = coalesce(public.pro_early_access.source, excluded.source),
    user_id = coalesce(public.pro_early_access.user_id, excluded.user_id),
    updated_at = now();
end;
$function$;

-- 4. Explicit deny-all policies document intent.
create policy "No direct access" on public.pro_early_access for all to anon, authenticated using (false) with check (false);
create policy "No direct access" on public.site_admins for all to anon, authenticated using (false) with check (false);
create policy "No direct access" on public.stripe_events for all to anon, authenticated using (false) with check (false);
