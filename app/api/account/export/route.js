import { createClient } from "@/lib/supabase/server";

// "Download my data": everything held about the signed-in user, as JSON
// (right of access / data portability).
export async function GET() {
  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return Response.json({ error: "Please log in again." }, { status: 401 });

  const [{ data: profile }, { data: consentHistory }, { data: founding }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("marketing_consent_events")
      .select("granted, source, wording, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("founding_members")
      .select("status, seat_no, livemode, paid_at, cancelled_at, created_at")
      .eq("user_id", user.id)
      .in("status", ["active", "cancelled"]),
  ]);

  const meta = user.user_metadata || {};
  const exportData = {
    exported_at: new Date().toISOString(),
    note: "All personal data Plot-LV holds in your account. Floor plans and FOV projects are never uploaded, so they are not included.",
    account: {
      id: user.id,
      email: user.email,
      full_name: meta.full_name || null,
      company: meta.company || null,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at || null,
      last_sign_in_at: user.last_sign_in_at || null,
    },
    preferences: profile
      ? {
          product_update_emails: profile.marketing_opt_in,
          changed_at: profile.marketing_updated_at,
          terms_version_accepted: profile.terms_version,
          terms_accepted_at: profile.terms_accepted_at,
          privacy_notice_version: profile.privacy_version,
        }
      : null,
    consent_history: consentHistory || [],
    // Payment details (card, address, invoices) are held by Stripe, not by us.
    founding_membership: founding || [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="plot-lv-my-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
