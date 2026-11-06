import Link from "next/link";
import { redirect } from "next/navigation";
import LaunchButton from "@/components/LaunchButton";
import Greeting from "@/components/account/Greeting";
import EmailPreferences from "@/components/account/EmailPreferences";
import DataControls from "@/components/account/DataControls";
import { createClient } from "@/lib/supabase/server";
import { loadProfile } from "@/lib/account";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import ProPanel from "@/components/account/ProPanel";
import { getStripe, findCustomer, currentSubscription, isProOpen, isProCheckoutOpenNow, missingProSettings, foundingSeatsLeftNow } from "@/lib/pro";
import { VAT_NOTE } from "@/lib/legal";
import { isProEntitled } from "@/lib/stripe/entitlement";

// The user's live Pro subscription, for the plan line and renewal date.
// Read from Stripe; any error just hides the details.
async function loadSubscription(userId) {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const customer = await findCustomer(stripe, userId);
    const sub = await currentSubscription(stripe, customer?.id);
    if (!sub) return null;
    const item = sub.items?.data?.[0];
    const end = sub.current_period_end || item?.current_period_end;
    const price = item?.price;
    return {
      plan: price?.recurring?.interval || null,
      periodEnd: end ? new Date(end * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null,
      amount: price?.unit_amount ? `£${(price.unit_amount / 100).toFixed(price.unit_amount % 100 ? 2 : 0)}` : null,
      cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end || sub.cancel_at),
    };
  } catch {
    return null;
  }
}

export const metadata = { title: "Your account" };

export default async function AccountPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (isSupabaseConfigured && !user) redirect("/login?next=/account");
  const profile = user ? await loadProfile(supabase, user) : null;
  // FOV Pro: the user's own row in public.entitlements (readable by them, writable by nobody).
  const { data: entitlement } = user
    ? await supabase.from("entitlements").select("pro, status, grace_until").eq("user_id", user.id).maybeSingle()
    : { data: null };
  const pro = isProEntitled(entitlement);
  const sub = user && pro ? await loadSubscription(user.id) : null;
  // Founding places still open (0 when the offer isn't set up or checkout is closed).
  const foundingLeft = user && !pro && isProOpen ? await foundingSeatsLeftNow(getStripe()) : 0;
  // Pause switch for new purchases, read live. Existing subscribers aren't affected by it.
  const paused = Boolean(user) && !pro && isProOpen && !(await isProCheckoutOpenNow());

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
        {params.pro === "welcome" && (
          <div className="acct-banner success">
            <span className="tick-badge" aria-hidden="true">✓</span>
            Payment received. FOV Pro switches on within a few seconds; refresh if this page still says Free.
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
                <span className="dot"></span> {pro ? "Pro" : "Free preview"}
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
                  <div><dt>Plan</dt><dd>{pro ? "FOV Pro" : "FOV preview (free)"}</dd></div>
                </dl>
                <Link href="/account/password" className="auth-link">Change password →</Link>
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
                  See the <Link href="/legal#privacy" className="inline-a">privacy notice</Link>.
                </p>
                <DataControls />
              </section>
            )}

            {user && (
              <section className="acct-card" id="upgrade">
                <h3 className="card-title mono">{pro ? "You have FOV Pro" : "Upgrade to FOV Pro"}</h3>
                <ProPanel
                  pro={pro}
                  open={isProOpen}
                  paused={paused}
                  initialPlan={params.upgrade}
                  sub={sub}
                  missing={missingProSettings()}
                  vatNote={VAT_NOTE}
                  foundingLeft={foundingLeft}
                />
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
