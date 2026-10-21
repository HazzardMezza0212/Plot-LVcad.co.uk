import "server-only";
import { getContactStatus, syncContact } from "./mailingList";

// Loads the signed-in user's profile and brings the mailing list in line:
//  - opted in but not yet pushed to Resend (e.g. just signed up) -> subscribe
//  - opted in here but unsubscribed via an email link -> record the opt-out
// Returns null if the profile tables haven't been created yet.
export async function loadProfile(supabase, user) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("marketing_opt_in, marketing_updated_at, resend_synced_at, terms_version, terms_accepted_at")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !profile) return null;

  if (profile.marketing_opt_in) {
    if (!profile.resend_synced_at) {
      const ok = await syncContact({
        email: user.email,
        fullName: user.user_metadata?.full_name,
        optIn: true,
      });
      if (ok) await supabase.rpc("mark_resend_synced");
    } else {
      const status = await getContactStatus(user.email);
      if (status?.exists && status.unsubscribed) {
        const { error: rpcError } = await supabase.rpc("set_marketing_consent", {
          p_granted: false,
          p_source: "email_unsubscribe",
        });
        if (!rpcError) {
          await supabase.rpc("mark_resend_synced");
          profile.marketing_opt_in = false;
          profile.marketing_updated_at = new Date().toISOString();
        }
      }
    }
  }
  return profile;
}
