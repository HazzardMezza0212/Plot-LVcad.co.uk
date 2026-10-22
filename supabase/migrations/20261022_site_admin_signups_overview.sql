-- Owner-only overview of account sign-ups and Pro early access, for the
-- /account/signups page. Only users listed in site_admins can call it.
create table public.site_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.site_admins enable row level security;
-- No policies: managed in the Supabase dashboard only.

insert into public.site_admins (user_id)
select id from auth.users where email in ('harry@reikan.co.uk', 'plotlvcad@gmail.com');

create function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (select 1 from public.site_admins a where a.user_id = auth.uid()) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'accounts', (
      select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at desc), '[]'::jsonb) from (
        select u.email, u.raw_user_meta_data ->> 'full_name' as name, u.raw_user_meta_data ->> 'company' as company,
               u.created_at, u.last_sign_in_at, coalesce(p.marketing_opt_in, false) as marketing_opt_in
        from auth.users u left join public.profiles p on p.user_id = u.id
      ) r),
    'early_access', (
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc), '[]'::jsonb) from (
        select email, name, role, wants, updates_opt_in, source, created_at from public.pro_early_access
      ) e)
  );
end;
$$;

revoke execute on function public.admin_overview() from public, anon;
grant execute on function public.admin_overview() to authenticated;
