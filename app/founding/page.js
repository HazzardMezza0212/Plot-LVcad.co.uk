import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ProEarlyAccess from "@/components/ProEarlyAccess";
import { FoundingCheckoutButton, ManageBillingButton } from "@/components/founding/FoundingButtons";
import { createClient } from "@/lib/supabase/server";
import { FOUNDING_PRICE_LABEL, FOUNDING_SEATS, isFoundingOpen, mySeat, seatsLeft } from "@/lib/founding";

export const metadata = {
  title: "FOV Founding 20 | Plot-LV",
  description:
    "Twenty Founding seats for Plot-LV FOV Pro: £99 + VAT a year, price locked while you stay subscribed, every Pro feature as it ships.",
};

const NAV_LINKS = [
  ["FOV", "/cctv-field-of-view-calculator"],
  ["Camera library", "/cctv-cameras"],
  ["Terms", "/terms#founding"],
];

const BENEFITS = [
  "Every FOV Pro feature the day it ships, starting with DXF CAD import and walls from your CAD layers",
  "A coverage report to hand to your client, and pixel density and DORI per camera",
  "£99 + VAT a year, locked for as long as you stay subscribed",
  "A direct line to me, and a real say in what gets built next",
  "14-day money-back guarantee, and cancel any time from your account",
];

export default async function FoundingPage({ searchParams }) {
  const params = await searchParams;
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const [left, seat] = await Promise.all([
    isFoundingOpen ? seatsLeft() : null,
    user ? mySeat(supabase, user.id) : null,
  ]);
  const isMember = seat?.status === "active";
  const full = left === 0;

  return (
    <>
      <div className="grid-bg"></div>
      <SiteNav tag="FOV" links={NAV_LINKS} />

      <section className="cam-hero founding-hero">
        <p className="cam-crumbs mono">Plot-LV FOV · Founding 20</p>
        <h1 className="display">Become one of the first 20 FOV Pro members</h1>
        <p className="cam-lede">
          FOV stays free for image and PDF plans. Pro is for real jobs, and I&apos;m building it now with
          the people who&apos;ll use it. Founding members get it first, at a price that never goes up.
        </p>
        {params.cancelled && (
          <div className="acct-banner">No payment was taken. Your seat has been released.</div>
        )}
      </section>

      <section className="cam-body founding-body">
        <div className="founding-grid">
          <div className="founding-copy">
            <h2 className="display">What you get</h2>
            <ul className="pro-list">
              {BENEFITS.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <p className="founding-honest">
              To be clear: Pro is in early access. Features arrive in your account as they&apos;re
              finished, and the free version keeps working as it does today.
            </p>
          </div>

          <aside className="founding-card">
            <p className="mono founding-price-tag">Founding price</p>
            <p className="founding-price">
              £99 <span>+ VAT a year</span>
            </p>
            <p className="founding-sub">£118.80 including VAT. VAT invoice for every payment.</p>

            {isMember ? (
              <div className="founding-state">
                <p className="mono pro-done-tag">● FOUNDING MEMBER{seat.seat_no ? ` · SEAT ${seat.seat_no} OF ${FOUNDING_SEATS}` : ""}</p>
                <p>Thank you. Pro features will appear in FOV as they ship.</p>
                <ManageBillingButton />
                <Link href="/account" className="auth-link block">Go to your account →</Link>
              </div>
            ) : !isFoundingOpen ? (
              <div className="founding-state">
                <p>Founding seats open very soon. Join the list below and I&apos;ll email you first.</p>
                <a href="#pro" className="btn-primary">Join the early access list</a>
              </div>
            ) : full ? (
              <div className="founding-state">
                <p><strong>All 20 Founding seats are taken.</strong> Join the waitlist and I&apos;ll tell you if one frees up.</p>
                <a href="#pro" className="btn-primary">Join the waitlist</a>
              </div>
            ) : (
              <div className="founding-state">
                {left !== null && (
                  <p className="founding-left">
                    <strong>{left}</strong> of {FOUNDING_SEATS} seats left
                  </p>
                )}
                {user ? (
                  <FoundingCheckoutButton label={`Take a Founding seat · ${FOUNDING_PRICE_LABEL}`} />
                ) : (
                  <>
                    <p>Your seat is linked to your Plot-LV account, so Pro unlocks wherever you log in.</p>
                    <Link href="/signup" className="btn-primary">Create a free account</Link>
                    <Link href="/login?next=/founding" className="auth-link block">Already have one? Log in →</Link>
                  </>
                )}
                <p className="form-privacy">
                  Secure payment by Stripe. By subscribing you agree to the{" "}
                  <Link href="/terms#founding">Founding 20 terms</Link>.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>

      {!isMember && (isFoundingOpen ? full : true) && <ProEarlyAccess />}

      <SiteFooter />
    </>
  );
}
