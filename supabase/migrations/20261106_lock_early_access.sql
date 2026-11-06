-- Only the server may add people to the FOV Pro early-access list.
--
-- join_pro_early_access is SECURITY DEFINER and was executable by anon and authenticated, so
-- anyone could call /rest/v1/rpc/join_pro_early_access directly, skipping the site's CAPTCHA and
-- rate limit, and add other people's emails as "opted in to updates".
-- From pro-checkout onwards, app/api/early-access calls it with the service role instead.
--
-- APPLY WHEN pro-checkout GOES LIVE (same deploy). The live site before that (main) still calls
-- it with the anon key, and the live FOV tool posts to that route, so applying earlier would
-- break the early-access form on the live site.

revoke execute on function public.join_pro_early_access(text, text, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.join_pro_early_access(text, text, text, text, boolean, text)
  to service_role;
