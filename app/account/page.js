import Link from "next/link";
import { redirect } from "next/navigation";
import LaunchButton from "@/components/LaunchButton";
import Greeting from "@/components/account/Greeting";
import FlameNotify from "@/components/account/FlameNotify";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = { title: "Your account | Plot-LV" };

export default async function AccountPage({ searchParams }) {
  const params = await searchParams;
  const user = isSupabaseConfigured ? await getUser() : null;
  if (isSupabaseConfigured && !user) redirect("/login?next=/account");

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
                  <div><dt>Plan</dt><dd>FOV preview (free)</dd></div>
                </dl>
                <Link href="/account/password" className="auth-link">Change password →</Link>
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
              {user ? (
                <FlameNotify email={user.email} name={fullName} />
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
