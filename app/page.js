"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LaunchButton from "@/components/LaunchButton";
import ProEarlyAccess from "@/components/ProEarlyAccess";

// Flame is not on sale. Pricing and checkout were removed from this page
// (see git history before this commit to restore them); app/api/checkout
// is unchanged and still unused.

const NAV_LINKS = [
  ["Products", "#products"],
  ["FOV", "#fov"],
  ["Pro", "#pro"],
  ["Flame", "/flame"],
  ["Contact", "#contact"],
];

const FOV_FEATURES = [
  "Coverage wedges, pixel density and DORI ranges per camera",
  "Walls, doors and obstacles block the view by height",
  "Security layers with a pass/fail coverage check per room",
  "Camera point-of-view preview",
  "Save projects as files, export the plan as PNG",
];

const FLAME_FEATURES = [
  "Fire alarm layouts against BS 5839-1:2025",
  "17 automated checks as you draw",
  "Coverage, audibility, call-point reach, zoning, escape routes",
  "Report a competent person can sign off",
  "Windows desktop app, works fully offline",
];

// "Continue as guest": opens FOV without an account (see app/guest/route.js).
function GuestOption({ compact = false }) {
  return (
    <div className={`guest-option${compact ? " compact" : ""}`}>
      <LaunchButton href="/guest" label="Continue as guest →" className="guest-link" icon={false} />
      <span className="guest-terms">
        No account needed. By continuing you agree to the{" "}
        <Link href="/terms">terms of use</Link>.
      </span>
    </div>
  );
}

// Celebration burst shown when someone registers for Flame updates.
function makeBurst() {
  const colors = ["#E8472C", "#23804D", "#0E1A28", "#8FA1B5"];
  return Array.from({ length: 46 }, (_, i) => ({
    id: i,
    x: `${Math.round((Math.random() - 0.5) * 380)}px`,
    y: `${Math.round((Math.random() - 0.72) * 340)}px`,
    r: `${Math.round((Math.random() - 0.5) * 720)}deg`,
    d: `${(Math.random() * 0.15).toFixed(2)}s`,
    c: colors[i % 4],
  }));
}

export default function Home() {
  const [contactSent, setContactSent] = useState(false);
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [interestError, setInterestError] = useState("");
  const [burst, setBurst] = useState(null);

  // Until React hydrates, form buttons would fall back to a native browser
  // submit that silently drops the submission. Keep them disabled until the
  // handlers are attached.
  const [ready, setReady] = useState(false);
  const [deleted, setDeleted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
    setDeleted(new URLSearchParams(window.location.search).get("deleted") === "1");
  }, []);

  async function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        message: formData.get("message"),
        company: formData.get("extra_info"),
      }),
    });
    setContactSent(true);
  }

  async function handleInterestSubmit(e) {
    e.preventDefault();
    setInterestSubmitting(true);
    setInterestError("");

    const formData = new FormData(e.target);
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          company: formData.get("extra_info"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setBurst(makeBurst());
      setInterestSent(true);
    } catch (err) {
      setInterestError(err.message);
    } finally {
      setInterestSubmitting(false);
    }
  }

  return (
    <>
      <div className="grid-bg"></div>

      <SiteNav links={NAV_LINKS} />
      {deleted && (
        <div className="home-notice" role="status">
          Your account and its data have been deleted, and you&apos;ve been removed from our mailing list.
        </div>
      )}

      <section className="hero hero-centered">
        <div className="hero-inner">
          <div className="eyebrow">Plot-LV — design tools for building services</div>
          <h1>
            Lay it out.
            <br />
            Check the <em>coverage</em>.
            <br />
            Hand it over.
          </h1>
          <p className="sub">
            Plot-LV makes focused design tools for building services engineers.
            FOV, for CCTV layouts, is free to try in your browser today. Flame,
            for fire alarm layouts, is in closed development.
          </p>
          <div className="cta-row">
            <Link href="/signup" className="btn-primary">
              Try FOV free — create an account
            </Link>
            <Link href="/login" className="btn-secondary">
              Log in →
            </Link>
          </div>
          <GuestOption />
          <div className="meta-row">
            <span>
              <span className="dot"></span> FOV preview open now
            </span>
            <span>Runs in your browser</span>
            <span>Plans stay on your device</span>
          </div>
        </div>
      </section>

      <section className="leanstrip">
        <div className="lean-inner">
          <div className="lean-item">
            <div className="lean-num">01</div>
            <div className="lean-label">One job each</div>
            <div className="lean-desc">Each tool covers one discipline and does it properly, rather than one bloated package.</div>
          </div>
          <div className="lean-item">
            <div className="lean-num">02</div>
            <div className="lean-label">Your drawings stay yours</div>
            <div className="lean-desc">Plans are processed on your device. FOV runs in your browser; Flame runs on your PC.</div>
          </div>
          <div className="lean-item">
            <div className="lean-num">03</div>
            <div className="lean-label">No host CAD</div>
            <div className="lean-desc">Not plugins. No AutoCAD, Revit or other CAD package needed.</div>
          </div>
          <div className="lean-item">
            <div className="lean-num">04</div>
            <div className="lean-label">Clear about limits</div>
            <div className="lean-desc">Preview data is labelled unverified until it has been checked against datasheets.</div>
          </div>
        </div>
      </section>

      <section id="products" className="products">
        <div className="range-head">
          <h2 className="display">The Plot-LV range</h2>
          <p>Two tools today, one open to try. More disciplines to follow.</p>
        </div>

        <div className="product-pair">
          <article className="product-panel is-open" id="fov">
            <div className="pp-head">
              <span className="pp-code mono">PLOT-LV-FOV</span>
              <span className="status-pill open">
                <span className="dot"></span> Free preview · open now
              </span>
            </div>
            <h3>FOV</h3>
            <p className="pp-sub">CCTV coverage design</p>
            <p className="pp-desc">
              Load a floor plan, set the scale, draw walls and doors, then place
              cameras and see exactly what each one covers.
            </p>
            <ul className="pp-list">
              {FOV_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="pp-actions">
              <Link href="/signup" className="btn-primary">
                Create free account
              </Link>
              <Link href="/login" className="btn-secondary">
                Log in
              </Link>
            </div>
            <GuestOption compact />
            <a href="#pro" className="pro-link">FOV Pro is coming: join early access →</a>
            <p className="pp-note mono">
              Preview: camera data is marked unverified while it is checked
              against manufacturer datasheets.
            </p>
          </article>

          <article className="product-panel is-closed" id="flame">
            <div className="pp-head">
              <span className="pp-code mono">PLOT-LV-FLAME</span>
              <span className="status-pill closed">Not available to buy</span>
            </div>
            <h3>Flame</h3>
            <p className="pp-sub">Fire alarm layout &amp; compliance</p>
            <p className="pp-desc">
              Trace the building, place catalogue devices and watch every room
              checked against the standard as you work.
            </p>
            <ul className="pp-list">
              {FLAME_FEATURES.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <div className="pp-actions">
              <Link href="/flame" className="btn-secondary">
                See how it works →
              </Link>
              <a href="#updates" className="btn-ghost">
                Get updates
              </a>
            </div>
            <p className="pp-note mono">
              Flame isn&apos;t on sale at the moment. Register below to hear when
              it opens.
            </p>
          </article>
        </div>

        <div className="next-up">
          <span className="mono next-tag">Next up</span>
          <span>
            <strong>Lux</strong> — lighting layout and illuminance checks.
            In development.
          </span>
        </div>
      </section>

      <ProEarlyAccess />

      <section className="getstarted" id="start">
        <div className="range-head">
          <h2 className="display">Start with FOV in three steps</h2>
          <p>Free while it&apos;s in preview. No card needed.</p>
        </div>
        <ol className="steps-row">
          <li>
            <span className="step-num mono">01</span>
            <h4>Create your account</h4>
            <p>Your name, work email and a password. Takes under a minute.</p>
          </li>
          <li>
            <span className="step-num mono">02</span>
            <h4>Open your workspace</h4>
            <p>Your account page is where you launch FOV and manage your details.</p>
          </li>
          <li>
            <span className="step-num mono">03</span>
            <h4>Lay out your cameras</h4>
            <p>Load a plan, set the scale, place cameras and check the coverage.</p>
          </li>
        </ol>
        <div className="cta-row fc-center">
          <Link href="/signup" className="btn-primary">
            Create free account
          </Link>
        </div>
      </section>

      <section
        className={`beta-banner${interestSent ? " registered" : ""}`}
        id="updates"
      >
        <div className="beta-inner">
          <div className="beta-copy">
            <div className="ptag mono">Flame · not on sale yet</div>
            <h3>Get told when Flame opens</h3>
            <p>
              Leave your email and we&apos;ll let you know when Flame is
              available. One email, no spam.
            </p>
          </div>
          <form className="beta-form" onSubmit={handleInterestSubmit}>
            <input
              type="text"
              name="extra_info"
              tabIndex={-1}
              autoComplete="off"
              className="hp-field"
              aria-hidden="true"
            />
            <input
              type="email"
              name="email"
              placeholder="you@company.com"
              aria-label="Email address"
              required
              disabled={interestSent}
            />
            <button
              className="submit-btn"
              type="submit"
              disabled={!ready || interestSubmitting || interestSent}
            >
              {interestSent
                ? "You're on the list ✓"
                : interestSubmitting
                ? "Adding you…"
                : "Notify me"}
            </button>
            {burst && (
              <span className="confetti" aria-hidden="true">
                {burst.map((p) => (
                  <i
                    key={p.id}
                    style={{
                      "--x": p.x,
                      "--y": p.y,
                      "--r": p.r,
                      animationDelay: p.d,
                      background: p.c,
                    }}
                  />
                ))}
              </span>
            )}
            {interestSent ? (
              <p className="beta-registered mono">
                ● REGISTERED — we&apos;ll email you when Flame opens
              </p>
            ) : (
              <p className="form-privacy">
                We&apos;ll only email you about Plot-LV, and you can unsubscribe
                at any time. <Link href="/privacy">Privacy notice</Link>
              </p>
            )}
          </form>
        </div>
        {interestError && <p className="error-msg beta-error">{interestError}</p>}
      </section>

      <section id="contact" className="contact-section">
        <div className="panel contact-panel">
          <div className="ptitle display">Talk to us</div>
          <div className="pdesc">
            We&apos;re building these alongside the people who&apos;ll use them.
            Feedback, feature requests and questions are all welcome, as are
            multi-seat and custom-standard enquiries.
          </div>
          <form onSubmit={handleContactSubmit}>
            <input
              type="text"
              name="extra_info"
              tabIndex={-1}
              autoComplete="off"
              className="hp-field"
              aria-hidden="true"
            />
            <div className="field">
              <label htmlFor="contact-email">Email</label>
              <input id="contact-email" type="email" name="email" required />
            </div>
            <div className="field">
              <label htmlFor="contact-message">Message</label>
              <textarea id="contact-message" name="message" required></textarea>
            </div>
            <button className="submit-btn" type="submit" disabled={!ready}>
              {contactSent ? "Message sent ✓" : "Send message"}
            </button>
            <p className="form-privacy">
              We&apos;ll use your email only to reply to you.{" "}
              <Link href="/privacy">Privacy notice</Link>
            </p>
          </form>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
