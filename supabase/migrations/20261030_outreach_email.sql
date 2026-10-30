-- Outreach emails sent through Resend from harry@plotlvcad.co.uk.
--
-- Why: the Gmail connector rewrote every link through google.com/url (which
-- shows a "Redirect Notice" warning) and stripped images. Sending from the
-- database via pg_net -> Resend keeps links and the header graphic intact.
--
-- Only the service role / postgres (the daily outreach task through the
-- Supabase connector) can call these functions. The email wording lives here,
-- so a caller can only fill in the recipient, company name and one-line hook;
-- it can't send arbitrary content.
--
-- Setup (Harry, once): verify plotlvcad.co.uk in Resend, then in the SQL editor
--   select vault.create_secret('re_...your Resend API key...', 'resend_api_key');

create extension if not exists pg_net with schema extensions;

create table if not exists public.outreach_emails (
  id bigserial primary key,
  to_email text not null,
  to_domain text not null,
  company text not null,
  kind text not null check (kind in ('first', 'followup', 'test')),
  subject text not null,
  message_id text not null unique,
  parent_id bigint references public.outreach_emails (id),
  send_request bigint,
  http_status int,
  resend_id text,
  error text,
  check_request bigint,
  last_event text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists outreach_emails_domain on public.outreach_emails (to_domain);

-- Addresses/domains never to email again (opt-outs, bounces).
create table if not exists public.outreach_suppressed (
  value text primary key,          -- an email address or a bare domain
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.outreach_emails enable row level security;
alter table public.outreach_suppressed enable row level security;
revoke all on public.outreach_emails, public.outreach_suppressed from anon, authenticated;

create or replace function public.outreach_esc(t text)
returns text language sql immutable set search_path = '' as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;

-- Send one outreach email. p_kind: 'first' (new prospect), 'followup' (one
-- nudge, at least 6 days after the first), or 'test' (to Harry only).
-- Returns {ok, id, message} — the HTTP result arrives a few seconds later;
-- call outreach_sync() to collect it.
create or replace function public.send_outreach_email(
  p_to text, p_company text, p_hook text default null, p_kind text default 'first'
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_to text := lower(trim(coalesce(p_to, '')));
  v_domain text;
  v_name text := left(trim(coalesce(p_company, '')), 80);
  v_hook text := left(trim(coalesce(p_hook, '')), 200);
  v_parent public.outreach_emails;
  v_subject text;
  v_html text;
  v_text text;
  v_msgid text := '<outreach-' || gen_random_uuid() || '@plotlvcad.co.uk>';
  v_headers jsonb;
  v_key text;
  v_req bigint;
  v_id bigint;
  v_local timestamp := now() at time zone 'Europe/London';
  n int;
begin
  if v_to !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_to) > 254 then
    return jsonb_build_object('ok', false, 'message', 'invalid email address');
  end if;
  v_domain := split_part(v_to, '@', 2);
  if v_name = '' then
    return jsonb_build_object('ok', false, 'message', 'company name required');
  end if;
  if p_kind not in ('first', 'followup', 'test') then
    return jsonb_build_object('ok', false, 'message', 'kind must be first, followup or test');
  end if;
  if p_kind = 'test' and v_to not in ('harry@reikan.co.uk', 'harry@plotlvcad.co.uk', 'plotlvcad@gmail.com') then
    return jsonb_build_object('ok', false, 'message', 'test emails only go to Harry');
  end if;

  if p_kind <> 'test' then
    if extract(isodow from v_local) > 5 then
      return jsonb_build_object('ok', false, 'message', 'outreach only sends Monday to Friday');
    end if;
    if exists (select 1 from public.outreach_suppressed where value in (v_to, v_domain)) then
      return jsonb_build_object('ok', false, 'message', 'address or domain has opted out or bounced');
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext('outreach_emails'));

  if p_kind = 'first' then
    if exists (select 1 from public.outreach_emails where to_domain = v_domain and kind <> 'test') then
      return jsonb_build_object('ok', false, 'message', 'this domain has already been emailed');
    end if;
    select count(*) into n from public.outreach_emails
     where kind = 'first' and (created_at at time zone 'Europe/London')::date = v_local::date;
    if n >= 10 then
      return jsonb_build_object('ok', false, 'message', 'daily limit of 10 new emails reached');
    end if;
    if v_hook = '' then
      return jsonb_build_object('ok', false, 'message', 'hook required for a first email');
    end if;
  elsif p_kind = 'followup' then
    select * into v_parent from public.outreach_emails
     where to_email = v_to and kind = 'first' order by id limit 1;
    if v_parent.id is null then
      return jsonb_build_object('ok', false, 'message', 'no first email to follow up');
    end if;
    if exists (select 1 from public.outreach_emails where parent_id = v_parent.id and kind = 'followup') then
      return jsonb_build_object('ok', false, 'message', 'already followed up');
    end if;
    if v_parent.created_at > now() - interval '6 days' then
      return jsonb_build_object('ok', false, 'message', 'too soon to follow up (wait 7 days)');
    end if;
    select count(*) into n from public.outreach_emails
     where kind = 'followup' and (created_at at time zone 'Europe/London')::date = v_local::date;
    if n >= 5 then
      return jsonb_build_object('ok', false, 'message', 'daily limit of 5 follow-ups reached');
    end if;
  end if;

  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is null then
    return jsonb_build_object('ok', false, 'message', 'Resend API key not set up yet (vault secret resend_api_key)');
  end if;

  if p_kind = 'followup' then
    v_subject := 'Re: ' || v_parent.subject;
    v_html := public.outreach_followup_html();
    v_text := public.outreach_followup_text();
    v_headers := jsonb_build_object(
      'Message-ID', v_msgid,
      'In-Reply-To', v_parent.message_id,
      'References', v_parent.message_id);
  else
    v_subject := 'Harry from Plot-LV – free camera layout tool for ' || v_name;
    v_html := replace(replace(public.outreach_first_html(), '{{NAME}}', public.outreach_esc(v_name)),
                      '{{HOOK}}', public.outreach_esc(coalesce(nullif(v_hook, ''), 'CCTV installers in the UK')));
    v_text := replace(replace(public.outreach_first_text(), '{{NAME}}', v_name),
                      '{{HOOK}}', coalesce(nullif(v_hook, ''), 'CCTV installers in the UK'));
    v_headers := jsonb_build_object('Message-ID', v_msgid);
  end if;
  v_headers := v_headers || jsonb_build_object(
    'List-Unsubscribe', '<mailto:harry@plotlvcad.co.uk?subject=unsubscribe>');

  insert into public.outreach_emails (to_email, to_domain, company, kind, subject, message_id, parent_id)
  values (v_to, v_domain, v_name, p_kind, v_subject, v_msgid, v_parent.id)
  returning id into v_id;

  select net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', 'Harry at Plot-LV <harry@plotlvcad.co.uk>',
      'to', jsonb_build_array(v_to),
      'reply_to', 'harry@plotlvcad.co.uk',
      'subject', v_subject,
      'html', v_html,
      'text', v_text,
      'headers', v_headers),
    timeout_milliseconds := 15000
  ) into v_req;

  update public.outreach_emails set send_request = v_req where id = v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'subject', v_subject,
                            'message', 'queued; run outreach_sync() in a few seconds to confirm');
end;
$$;

-- Collect send results and delivery status from Resend.
-- Call it after sending (wait ~5 s) and at the start of each run. It also asks
-- Resend for the latest event (delivered / bounced / complained) of anything
-- sent in the last 10 days; bounced and complained addresses are suppressed.
create or replace function public.outreach_sync()
returns table (id bigint, to_email text, company text, kind text, http_status int, last_event text, error text, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  r record;
  v_key text;
  v_req bigint;
begin
  -- 1. send results
  for r in
    select e.id, resp.status_code, resp.content, resp.error_msg
      from public.outreach_emails e
      join net._http_response resp on resp.id = e.send_request
     where e.http_status is null
  loop
    update public.outreach_emails o
       set http_status = coalesce(r.status_code, 0),
           resend_id = case when r.status_code between 200 and 299 then (r.content::jsonb ->> 'id') end,
           error = case when r.status_code between 200 and 299 then null
                        else left(coalesce(r.error_msg, r.content, 'unknown error'), 500) end,
           last_event = case when r.status_code between 200 and 299 then 'sent' else 'failed' end,
           updated_at = now()
     where o.id = r.id;
  end loop;

  -- 2. results of earlier status checks
  for r in
    select e.id, e.to_email, resp.status_code, resp.content
      from public.outreach_emails e
      join net._http_response resp on resp.id = e.check_request
     where resp.status_code between 200 and 299
  loop
    update public.outreach_emails o
       set last_event = coalesce(r.content::jsonb ->> 'last_event', o.last_event),
           check_request = null, updated_at = now()
     where o.id = r.id;
    if (r.content::jsonb ->> 'last_event') in ('bounced', 'complained') then
      insert into public.outreach_suppressed (value, reason)
      values (r.to_email, r.content::jsonb ->> 'last_event')
      on conflict (value) do nothing;
    end if;
  end loop;

  -- 3. ask for fresh status on recent sends
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  if v_key is not null then
    for r in
      select e.id, e.resend_id from public.outreach_emails e
       where e.resend_id is not null
         and e.created_at > now() - interval '10 days'
         and coalesce(e.last_event, 'sent') not in ('bounced', 'complained', 'failed')
    loop
      select net.http_get(
        url := 'https://api.resend.com/emails/' || r.resend_id,
        headers := jsonb_build_object('Authorization', 'Bearer ' || v_key),
        timeout_milliseconds := 10000) into v_req;
      update public.outreach_emails set check_request = v_req where outreach_emails.id = r.id;
    end loop;
  end if;

  return query
    select e.id, e.to_email, e.company, e.kind, e.http_status, e.last_event, e.error, e.created_at
      from public.outreach_emails e
     where e.created_at > now() - interval '14 days'
     order by e.id desc;
end;
$$;

-- Record an opt-out (reply "no thanks", "unsubscribe" etc). Pass the address.
create or replace function public.outreach_suppress(p_value text, p_reason text default 'opted out')
returns void language sql security definer set search_path = '' as $$
  insert into public.outreach_suppressed (value, reason)
  values (lower(trim(p_value)), left(coalesce(p_reason, 'opted out'), 100))
  on conflict (value) do nothing;
$$;

create or replace function public.outreach_first_html()
returns text language sql immutable set search_path = '' as $html$
select $t$<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#EEF1F5">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EEF1F5">
<tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1F2937">
<tr><td style="padding:0">
<a href="https://www.plotlvcad.co.uk/guest?utm_source=outreach&amp;utm_medium=email&amp;utm_content=header"><img src="https://www.plotlvcad.co.uk/email/fov-email-hero.gif" width="600" height="320" alt="Plot-LV FOV: cameras on a floor plan showing what each one covers" style="display:block;width:100%;max-width:600px;height:auto;border:0"></a>
</td></tr>
<tr><td style="padding:26px 30px 6px 30px;font-size:15px;line-height:1.6">
<p style="margin:0 0 14px 0">Hi {{NAME}} team,</p>
<p style="margin:0 0 14px 0">I'm Harry, an engineer in the UK. I came across {{NAME}} while looking at {{HOOK}}, and thought this might save you some time.</p>
<p style="margin:0 0 6px 0">I've built <b>Plot-LV FOV</b>, a free browser tool for planning CCTV on a floor plan:</p>
</td></tr>
<tr><td style="padding:4px 30px 8px 30px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.45;color:#1F2937">
<tr><td width="34" valign="top" style="padding:7px 0"><div style="width:24px;height:24px;border-radius:12px;background:#E8472C;color:#FFFFFF;font-weight:bold;font-size:13px;line-height:24px;text-align:center">1</div></td><td style="padding:7px 0"><b>Drop in a plan</b> &mdash; PDF or image, set the scale in two clicks</td></tr>
<tr><td width="34" valign="top" style="padding:7px 0"><div style="width:24px;height:24px;border-radius:12px;background:#E8472C;color:#FFFFFF;font-weight:bold;font-size:13px;line-height:24px;text-align:center">2</div></td><td style="padding:7px 0"><b>Place cameras</b> &mdash; real models from Axis, Hikvision, Hanwha and more</td></tr>
<tr><td width="34" valign="top" style="padding:7px 0"><div style="width:24px;height:24px;border-radius:12px;background:#E8472C;color:#FFFFFF;font-weight:bold;font-size:13px;line-height:24px;text-align:center">3</div></td><td style="padding:7px 0"><b>See the coverage</b> &mdash; px/m for identify, recognise, observe and detect, with walls and doors blocking the view</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:16px 30px 6px 30px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#E8472C" style="border-radius:8px;background:#E8472C">
<a href="https://www.plotlvcad.co.uk/guest?utm_source=outreach&amp;utm_medium=email&amp;utm_content=button" style="display:inline-block;padding:14px 30px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px">Try it free &rarr;</a>
</td></tr></table>
<p style="margin:10px 0 0 0;font-size:12px;color:#6B7280">No sign-up &middot; runs in your browser &middot; plans never leave your computer</p>
</td></tr>
<tr><td style="padding:18px 30px 6px 30px;font-size:15px;line-height:1.6">
<p style="margin:0 0 14px 0">It opens with a worked example, so you can drag a camera about and see the coverage change in a few seconds. I'm building the next version with installers, so even a one-line reply on what's missing would really help.</p>
<p style="margin:0">Thanks,<br><b>Harry.M</b><br><span style="color:#6B7280;font-size:13px">Plot-LV &middot; <a href="https://www.plotlvcad.co.uk/cctv-field-of-view-calculator?utm_source=outreach&amp;utm_medium=email" style="color:#6B7280">plotlvcad.co.uk</a> &middot; <a href="mailto:harry@plotlvcad.co.uk" style="color:#6B7280">harry@plotlvcad.co.uk</a></span></p>
</td></tr>
<tr><td style="padding:18px 30px 22px 30px;border-top:1px solid #EEF1F5;font-size:11px;color:#9CA3AF;line-height:1.5">
You're getting this because {{NAME}} lists this address for business enquiries. If it isn't relevant, just reply &ldquo;no thanks&rdquo; and I won't contact you again.
</td></tr>
</table>
</td></tr></table>
</body></html>$t$;
$html$;

create or replace function public.outreach_first_text()
returns text language sql immutable set search_path = '' as $f$
select $t$Hi {{NAME}} team,

I'm Harry, an engineer in the UK. I came across {{NAME}} while looking at {{HOOK}}, and thought this might save you some time.

I've built Plot-LV FOV, a free browser tool for planning CCTV on a floor plan:
1. Drop in a plan: PDF or image, set the scale in two clicks
2. Place cameras: real models from Axis, Hikvision, Hanwha and more
3. See the coverage: px/m for identify, recognise, observe and detect, with walls and doors blocking the view

Try it free (no sign-up, runs in your browser):
https://www.plotlvcad.co.uk/guest

It opens with a worked example, so you can drag a camera about and see the coverage change in a few seconds. I'm building the next version with installers, so even a one-line reply on what's missing would really help.

Thanks,
Harry.M
Plot-LV · plotlvcad.co.uk · harry@plotlvcad.co.uk

You're getting this because {{NAME}} lists this address for business enquiries. If it isn't relevant, just reply "no thanks" and I won't contact you again.$t$;
$f$;

create or replace function public.outreach_followup_html()
returns text language sql immutable set search_path = '' as $f$
select $t$<!doctype html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1F2937;max-width:560px">
<p>Hi again,</p>
<p>Just bumping this in case it got buried. The CCTV planner is free and takes about a minute to try, no sign-up:</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="#E8472C" style="border-radius:8px;background:#E8472C">
<a href="https://www.plotlvcad.co.uk/guest?utm_source=outreach&amp;utm_medium=email&amp;utm_content=followup" style="display:inline-block;padding:12px 26px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#FFFFFF;text-decoration:none;border-radius:8px">Open the CCTV planner &rarr;</a>
</td></tr></table>
<p>If it's not for you, no problem at all, just reply "no thanks" and I won't email again.</p>
<p>Thanks,<br><b>Harry.M</b><br><span style="color:#6B7280;font-size:13px">Plot-LV &middot; plotlvcad.co.uk</span></p>
</div></body></html>$t$;
$f$;

create or replace function public.outreach_followup_text()
returns text language sql immutable set search_path = '' as $f$
select $t$Hi again,

Just bumping this in case it got buried. The CCTV planner is free and takes about a minute to try, no sign-up:
https://www.plotlvcad.co.uk/guest

If it's not for you, no problem at all, just reply "no thanks" and I won't email again.

Thanks,
Harry.M
Plot-LV · plotlvcad.co.uk$t$;
$f$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.send_outreach_email(text, text, text, text)',
    'public.outreach_sync()',
    'public.outreach_suppress(text, text)',
    'public.outreach_first_html()', 'public.outreach_first_text()',
    'public.outreach_followup_html()', 'public.outreach_followup_text()',
    'public.outreach_esc(text)'
  ] loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
