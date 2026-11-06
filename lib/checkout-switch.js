// The pause switch for new FOV Pro purchases: the public.site_settings row 'pro_checkout', whose
// value is {"open": true} or {"open": false}. Only an explicit open:true opens checkout. Anything
// else (missing row, read error, malformed value) counts as paused. Kept free of imports so tests can run it.
export function checkoutSettingOpen(row) {
  return row?.value?.open === true;
}

// What a read of the switch row means. `result` is the { data, error } from the database.
export function checkoutOpenFromRead(result) {
  if (!result || result.error) return false;
  return checkoutSettingOpen(result.data);
}
