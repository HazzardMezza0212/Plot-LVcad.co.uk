import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Owner-only list of account sign-ups and FOV Pro early access. Access is
// checked in the database (admin_overview() only answers for users in
// public.site_admins); everyone else gets a 404.

export const metadata = { title: "Sign-ups | Plot-LV", robots: { index: false } };
export const dynamic = "force-dynamic";

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London" }) : "–";
const daysAgo = (iso, days) => iso && Date.now() - new Date(iso).getTime() < days * 864e5;

export default async function SignupsPage() {
  const supabase = await createClient();
  if (!supabase) notFound();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) redirect("/login?next=/account/signups");
  const { data, error } = await supabase.rpc("admin_overview");
  if (error || !data) notFound();

  const accounts = data.accounts || [];
  const early = data.early_access || [];

  return (
    <main className="admin">
      <header className="admin-head">
        <Link href="/account" className="mono admin-back">← Account</Link>
        <h1 className="display">Sign-ups</h1>
        <p>Live from Supabase. Only you can see this page.</p>
      </header>

      <section className="admin-stats">
        <div><strong>{accounts.length}</strong><span>accounts</span></div>
        <div><strong>{accounts.filter((a) => daysAgo(a.created_at, 7)).length}</strong><span>new accounts, last 7 days</span></div>
        <div><strong>{early.length}</strong><span>Pro early access</span></div>
        <div><strong>{early.filter((e) => daysAgo(e.created_at, 7)).length}</strong><span>new early access, last 7 days</span></div>
      </section>

      <h2 className="display">FOV Pro early access</h2>
      {early.length === 0 ? <p className="admin-empty">No one yet. The form is on the home page and the Pro button in FOV.</p> : (
        <div className="admin-table">
          <table>
            <thead><tr><th>When</th><th>Name</th><th>Email</th><th>Role</th><th>What would make it worth paying for</th><th>From</th><th>Updates</th></tr></thead>
            <tbody>
              {early.map((e) => (
                <tr key={e.email}>
                  <td className="mono">{fmt(e.created_at)}</td><td>{e.name || "–"}</td>
                  <td><a href={`mailto:${e.email}`}>{e.email}</a></td><td>{e.role || "–"}</td>
                  <td className="admin-wants">{e.wants || "–"}</td><td>{e.source || "–"}</td><td>{e.updates_opt_in ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="display">Accounts</h2>
      <div className="admin-table">
        <table>
          <thead><tr><th>Signed up</th><th>Name</th><th>Email</th><th>Company</th><th>Last log-in</th><th>Updates</th></tr></thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.email}>
                <td className="mono">{fmt(a.created_at)}</td><td>{a.name || "–"}</td>
                <td><a href={`mailto:${a.email}`}>{a.email}</a></td><td>{a.company || "–"}</td>
                <td className="mono">{fmt(a.last_sign_in_at)}</td><td>{a.marketing_opt_in ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
