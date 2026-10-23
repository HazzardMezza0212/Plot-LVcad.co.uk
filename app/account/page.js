import Link from "next/link";
import { redirect } from "next/navigation";
import LaunchButton from "@/components/LaunchButton";
import Greeting from "@/components/account/Greeting";
import EmailPreferences from "@/components/account/EmailPreferences";
import DataControls from "@/components/account/DataControls";
import { createClient } from "@/lib/supabase/server";
import { loadProfile } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ManageBillingButton } from "@/components/founding/FoundingButtons";
import { FOUNDING_SEATS, isFoundingOpen, mySeat } from "@/lib/founding";

export const metadata = { title: "Your account | Plot-LV" };

export default async function AccountPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (isSupabaseConfigured && !user) redirect("/login?next=/account");
  const [profile, seat] = user
    ? await Promise.all([loadProfile(supabase, user), mySeat(supabase, user.id)])
    : [null, null];
  const isFounder = seat?.status === "active";

  const meta = user?.user_metadata || {};
  const fullName = meta.full_name || "";
  const firstName = fullName.split(" ")[0];
  const initials = (fullName || user?.email || "G")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      <div className="grid-bg"></div>
      <header className="acct-nav">
        <Link href="/" className="logo">
          PLOT-LV <span className="tag">ACCOUNT</span>
        </Link>
        {user ? (
          <div className="acct-user">
            <span className="avatar" aria-hidden="true">{initials}</span>
            <span className="acct-who">
              <strong>{fullName || "Your account"}</strong>
              <span className="mono">{user.email}</span>
            </span>
            <form action="/auth/signout" method="post">
              <button type="submit" className="btn-ghost small">Sign out</button>
            </form>
          </div>
        ) : (
          <span className="status-pill closed">Guest</span>
        )}
      </header>

      <main className="acct">
        {params.welcome && (
          <div className="acct-banner success">
            <span className="tick-badge" aria-hidden="true">✓</span>
            Your account is ready. Launch FOV below to get started.
          </div>
        )}
        {params.password && (
          <div className="acct-banner success">
            <span className="tick-badge" aria-hidden="true">✓</span>
            Password updated.
          </div>
        )}
        {!user && (
          <div className="acct-banner">
            Accounts are being switched on. You can use the FOV preview as a guest in the meantime.
          </div>
        )}

        <div className="acct-head">
          <Greeting name={firstName} />
          <p className="acct-sub">Your Plot-LV workspace</p>
        </div>

        <div className="acct-grid">
          <section className="acct-card fov-card">
            <div className="pp-head">
              <span className="pp-code mono">PLOT-LV-FOV</span>
              <span className="status-pill open">
                <span className="dot"></span> Free preview
              </span>
            </div>
            <h2 className="display">FOV</h2>
            <p className="pp-sub">CCTV coverage design</p>
            <p className="pp-desc">
              Load a floor plan, set the scale, draw walls and doors, then place
              cameras and check what each one covers.
            </p>
            <LaunchButton />
            <div className="fov-tips">
              <span className="mono tips-label">Before you start</span>
              <ul>
                <li>Have your floor plan as an image (PNG or JPG)</li>
                <li>Know one real-world length on it, to set the scale</li>
                <li>Projects save as files on your computer</li>
              </ul>
            </div>
          </section>

          <div className="acct-side">
            {user && (
              <section className="acct-card">
                <h3 className="card-title mono">Account</h3>
                <dl className="acct-details">
                  <div><dt>Name</dt><dd>{fullName || "—"}</dd></div>
                  <div><dt>Email</dt><dd>{user.email}</dd></div>
                  {meta.company && <div><dt>Company</dt><dd>{meta.company}</dd></div>}
                  {memberSince && <div><dt>Member since</dt><dd>{memberSince}</dd></div>}
                  <div><dt>Plan</dt><dd>{isFounder ? `FOV Pro · Founding member (seat ${seat.seat_no} of ${FOUNDING_SEATS})` : "FOV preview (free)"}</dd></div>
                </dl>
                <Link href="/account/password" className="auth-link">Change password →</Link>
              </section>
            )}

            {user && (isFounder || seat?.status === "cancelled" || isFoundingOpen) && (
              <section className="acct-card founding-acct">
                <h3 className="card-title mono">Founding 20</h3>
                {isFounder ? (
                  <>
                    <p className="pp-desc">
                      You&apos;re Founding member {seat.seat_no} of {FOUNDING_SEATS}. Pro features appear in FOV as they ship,
                      and your £99 + VAT a year is locked while you stay subscribed.
                    </p>
                    <ManageBillingButton />
                  </>
                ) : seat?.status === "cancelled" ? (
                  <>
                    <p className="pp-desc">Your Founding membership has ended. Invoices from your time as a member are still available.</p>
                    <ManageBillingButton />
                  </>
                ) : (
                  <>
                    <p className="pp-desc">
                      Twenty seats for FOV Pro at £99 + VAT a year, locked for as long as you stay subscribed.
                    </p>
                    <Link href="/founding" className="btn-primary small">See the Founding offer →</Link>
                  </>
                )}
              </section>
            )}

            {user && (
              <section className="acct-card">
                <h3 className="card-title mono">Email</h3>
                {profile ? (
                  <EmailPreferences
                    initialOptIn={profile.marketing_opt_in}
                    updatedAt={profile.marketing_updated_at}
                  />
                ) : (
                  <p className="pp-desc">Email preferences are being set up. Check back shortly.</p>
                )}
              </section>
            )}

            {user && (
              <section className="acct-card">
                <h3 className="card-title mono">Your data</h3>
                <p className="pp-desc">
                  Download everything we hold about you, or delete your account.
                  See the <Link href="/privacy" className="inline-a">privacy notice</Link>.
                </p>
                <DataControls />
              </section>
            )}

            <section className="acct-card muted-card">
              <div className="pp-head">
                <span className="pp-code mono">PLOT-LV-FLAME</span>
                <span className="status-pill closed">Not available</span>
              </div>
              <h3 className="display flame-title">Flame</h3>
              <p className="pp-desc">
                Fire alarm layout and compliance. Not on sale at the moment.
              </p>
              {user && profile?.marketing_opt_in ? (
                <p className="notify-done mono">● You&apos;ll hear when Flame opens (product updates are on)</p>
              ) : user ? (
                <p className="pp-desc small-note">Turn on product updates above to hear when it opens.</p>
              ) : (
                <Link href="/#updates" className="btn-secondary small">Get updates</Link>
              )}
              <Link href="/flame" className="auth-link block">How Flame works →</Link>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
