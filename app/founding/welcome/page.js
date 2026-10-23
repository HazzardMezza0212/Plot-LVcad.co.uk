import Link from "next/link";
import { redirect } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LaunchButton from "@/components/LaunchButton";
import { ManageBillingButton } from "@/components/founding/FoundingButtons";
import { createClient } from "@/lib/supabase/server";
import { FOUNDING_SEATS, getStripe, mySeat } from "@/lib/founding";

export const metadata = { title: "Welcome, Founding member | Plot-LV", robots: { index: false } };

// Shown after Stripe Checkout. It only reports what has happened: Pro is
// switched on by the webhook, never by this page. If the webhook hasn't landed
// yet, it says so and offers a refresh.
export default async function FoundingWelcome({ searchParams }) {
  const { session_id: sessionId } = await searchParams;
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) redirect("/login?next=/founding");

  let paid = false;
  const stripe = getStripe();
  if (sessionId && stripe && /^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      // Only trust a session that belongs to the signed-in user.
      paid = session.client_reference_id === user.id && session.payment_status === "paid";
    } catch {
      paid = false;
    }
  }
  const seat = await mySeat(supabase, user.id);
  const active = seat?.status === "active";

  return (
    <>
      <div className="grid-bg"></div>
      <SiteNav tag="FOV" links={[["Your account", "/account"]]} />
      <section className="cam-hero founding-hero">
        {active ? (
          <>
            <p className="mono pro-done-tag">● FOUNDING MEMBER · SEAT {seat.seat_no} OF {FOUNDING_SEATS}</p>
            <h1 className="display">Welcome aboard, and thank you.</h1>
            <p className="cam-lede">
              Your Founding membership is active. Your VAT receipt is on its way from Stripe. Pro features
              appear in FOV as they ship, and I&apos;ll email you each time something new lands. Reply to
              any of those emails to tell me what you need next.
            </p>
            <div className="cta-row">
              <LaunchButton />
              <ManageBillingButton />
            </div>
          </>
        ) : paid ? (
          <>
            <h1 className="display">Payment received. Finishing set-up…</h1>
            <p className="cam-lede">
              This usually takes a few seconds. Refresh the page in a moment. If it still says this after a
              few minutes, email plotlvcad@gmail.com and I&apos;ll sort it straight away.
            </p>
            <Link href={`/founding/welcome?session_id=${encodeURIComponent(sessionId)}`} className="btn-primary">Refresh</Link>
          </>
        ) : (
          <>
            <h1 className="display">We couldn&apos;t find a completed payment.</h1>
            <p className="cam-lede">
              If you&apos;ve just paid, give it a minute and check <Link href="/account">your account</Link>. Otherwise
              you can <Link href="/founding">take a Founding seat here</Link>.
            </p>
          </>
        )}
      </section>
      <SiteFooter />
    </>
  );
}
