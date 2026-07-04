"use client";

import { useState } from "react";

const PLAN_LABELS = {
  monthly: "Monthly — £19.99/mo",
  lifetime: "Lifetime — £299 once",
};
const PLAN_BUTTON_TEXT = {
  monthly: "Pay £19.99 & get licence key",
  lifetime: "Pay £299 & get licence key",
};

// Pre-launch mode: purchasing/checkout is switched off site-wide so people
// can only learn about Flame and register interest — nobody can enter
// payment/contact details or buy yet. Flip to true (and re-enable
// app/api/checkout/route.js) when ready to open sales.
const CHECKOUT_ENABLED = false;

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [interestError, setInterestError] = useState("");

  async function handleCheckoutSubmit(e) {
    e.preventDefault();
    if (!selectedPlan) return;

    setSubmitting(true);
    setErrorMsg("");

    const formData = new FormData(e.target);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          name: formData.get("name"),
          email: formData.get("email"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      window.location.href = data.url;
    } catch (err) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  }

  async function handleContactSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        message: formData.get("message"),
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
        body: JSON.stringify({ email: formData.get("email") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
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

      <nav>
        <div className="logo">PLOT-LV</div>
        <div className="nav-links">
          <a href="#range">Range</a>
          <a href="#beta">Beta</a>
          <a href="#pricing">Pricing</a>
          <a
            href="#signup"
            className={CHECKOUT_ENABLED ? "" : "locked"}
            onClick={(e) => { if (!CHECKOUT_ENABLED) e.preventDefault(); }}
          >
            Sign up
          </a>
          <a href="#contact">Contact</a>
        </div>
        <a
          href="#pricing"
          className={`nav-cta${CHECKOUT_ENABLED ? "" : " locked"}`}
          onClick={(e) => { if (!CHECKOUT_ENABLED) e.preventDefault(); }}
        >
          Buy v1.0
        </a>
      </nav>

      <section className="hero">
        <div>
          <div className="eyebrow">Plot-LV / Flame — Fire Alarm Compliance</div>
          <h1>
            Draw the layout.
            <br />
            Check the <em>standard</em>.
            <br />
            Ship it compliant.
          </h1>
          <p className="sub">
            You draw your 2D fire alarm layout by hand — devices, zones, escape
            routes — and Plot-LV-Flame checks device spacing and zoning
            against preset local standards. It takes the guesswork out of compliance and prints a
            clear, configurable report to suit your own sign-off process.
            Runs entirely on your machine — your drawings never leave your
            computer. One standalone .exe, no plugins, no subscriptions you
            didn&apos;t ask for.
          </p>
          <div className="cta-row">
            <a
              href="#pricing"
              className={`btn-primary${CHECKOUT_ENABLED ? "" : " locked"}`}
              onClick={(e) => { if (!CHECKOUT_ENABLED) e.preventDefault(); }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
              </svg>
              Buy Flame v1.0
            </a>
            <a href="#signup" className="btn-secondary">
              Already purchased? →
            </a>
          </div>
          <div className="meta-row">
            <span>
              <span className="dot"></span> Runs 100% locally — no cloud upload
            </span>
            <span>Windows</span>
          </div>
          <p className="cta-note">
            A licence key is issued on purchase and required on first launch —{" "}
            <a href="#pricing">see pricing →</a>
          </p>
        </div>

        <div className="schematic-wrap">
          <div className="schematic-frame">
            <div className="frame-label">
              <span>DWG-FLAME-014 · GROUND FLOOR</span>
              <span className="status">● COMPLIANT</span>
            </div>
            <svg className="diagram" viewBox="0 0 420 340" xmlns="http://www.w3.org/2000/svg">
              <line className="dim" x1="30" y1="22" x2="390" y2="22" />
              <line className="dim" x1="30" y1="16" x2="30" y2="28" />
              <line className="dim" x1="390" y1="16" x2="390" y2="28" />
              <text x="185" y="16">18.60 m</text>

              <rect className="room-fill" x="30" y="40" width="180" height="260" />
              <rect className="room-fill" x="210" y="40" width="180" height="260" />

              <path className="wall" d="M30,40 L390,40 L390,300 L215,300" />
              <path className="wall" d="M145,300 L30,300 L30,40" />

              <path className="wall-thin" d="M210,40 L210,150" />
              <path className="wall-thin" d="M210,192 L210,300" />
              <path className="door-swing" d="M210,150 A42,42 0 0 1 252,192" />
              <line className="door-leaf" x1="210" y1="150" x2="252" y2="192" />

              <line className="door-leaf" x1="145" y1="300" x2="145" y2="265" />
              <path className="door-swing" d="M145,265 A35,35 0 0 1 180,300" />

              <text className="room-label" x="140" y="55">ZONE 01</text>
              <text className="room-label" x="330" y="55">ZONE 02</text>

              <path className="escape" d="M105,120 L105,255 L175,255 L175,300" markerEnd="url(#arrowGreen)" />
              <path className="escape delay1" d="M300,110 L300,170 L210,170 L175,170 L175,300" markerEnd="url(#arrowGreen)" />
              <text className="escape-label" x="120" y="325">FIRE EXIT</text>

              <circle className="node-fill" cx="54" cy="62" r="13" />
              <circle className="node-ring" cx="54" cy="62" r="13" />
              <text x="30" y="90">PANEL</text>

              <path className="wire" d="M67,62 L105,62 L105,120" />
              <path className="wire delay1" d="M54,75 L54,270 L120,270" />
              <path className="wire delay2" d="M210,60 L300,60 L300,110" />
              <path className="wire delay3" d="M300,60 L360,60 L360,225" />

              <circle className="node-fill" cx="105" cy="120" r="11" />
              <circle className="node-ring" cx="105" cy="120" r="11" />
              <circle className="node-ring" cx="105" cy="120" r="5" />
              <text x="70" y="105">SMOKE 01.1</text>

              <rect className="node-fill" x="108" y="259" width="20" height="20" rx="3" />
              <rect className="node-ring" x="108" y="259" width="20" height="20" rx="3" />
              <text x="70" y="298">CALL PT</text>

              <circle className="node-fill" cx="300" cy="110" r="11" />
              <circle className="node-ring" cx="300" cy="110" r="11" />
              <circle className="node-ring" cx="300" cy="110" r="5" />
              <text x="265" y="96">SMOKE 02.1</text>

              <circle className="node-fill" cx="360" cy="225" r="11" />
              <circle className="accent" cx="360" cy="225" r="4" />
              <circle className="node-ring" cx="360" cy="225" r="11" />
              <text x="335" y="210">SOUNDER</text>

              <defs>
                <marker id="arrowGreen" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" fill="var(--green)" />
                </marker>
              </defs>

              <circle className="pulse-dot" cx="105" cy="120" r="2.5" />
              <circle className="pulse-dot" cx="300" cy="110" r="2.5" />
              <circle className="pulse-dot" cx="360" cy="225" r="2.5" />
              <circle className="pulse-dot" cx="118" cy="269" r="2.5" />
            </svg>
            <div className="legend">
              <span><span className="lg-dot"></span> Smoke detector</span>
              <span><span className="lg-sq"></span> Call point</span>
              <span><span className="lg-dot" style={{ borderColor: "var(--red)" }}></span> Sounder</span>
              <span><span className="lg-line"></span> Escape route</span>
            </div>
          </div>
        </div>
      </section>

      <section className="leanstrip">
        <div className="lean-inner">
          <div className="lean-item">
            <div className="lean-num">01</div>
            <div className="lean-label">Local &amp; secure</div>
            <div className="lean-desc">Everything runs on your machine. Your drawings and site layouts never leave your computer.</div>
          </div>
          <div className="lean-item">
            <div className="lean-num">02</div>
            <div className="lean-label">Standalone</div>
            <div className="lean-desc">Not a plugin. No AutoCAD, no Revit, no host CAD package required.</div>
          </div>
          <div className="lean-item">
            <div className="lean-num">03</div>
            <div className="lean-label">Lean install</div>
            <div className="lean-desc">One installer. Nothing else to download, license, or configure.</div>
          </div>
          <div className="lean-item">
            <div className="lean-num">04</div>
            <div className="lean-label">Direct &amp; reliable</div>
            <div className="lean-desc">Draw, check, export — the same engine every time, with or without a connection.</div>
          </div>
        </div>
      </section>

      <section id="range">
        <div className="range-head">
          <h2 className="display">The Plot-LV range</h2>
          <p>One CAD engine, one set of compliance rules per discipline. Flame is on its way, with Security and Lux following shortly after.</p>
        </div>
        <div className="range-grid">
          <div className="product-card active">
            <div className="grain"></div>
            <div className="code">PLOT-LV-FLAME <span>v1.0</span></div>
            <h3>Flame</h3>
            <p className="desc">Fire alarm system layout and compliance checking. Device spacing and zoning against preset local standards, with a configurable report at the end.</p>
            <a
              href="#pricing"
              className={`pc-cta${CHECKOUT_ENABLED ? "" : " locked"}`}
              onClick={(e) => { if (!CHECKOUT_ENABLED) e.preventDefault(); }}
            >
              Buy now →
            </a>
          </div>
          <div className="product-card disabled">
            <div className="code">PLOT-LV-FOV <span className="future-tag">(future)</span></div>
            <h3>FOV</h3>
            <p className="desc">CCTV field-of-view and coverage modelling for security system layouts — camera placement, blind spots, lens specs.</p>
            <span className="pc-cta">In development</span>
          </div>
          <div className="product-card disabled">
            <div className="code">PLOT-LV-LUX <span className="future-tag">(future)</span></div>
            <h3>Lux</h3>
            <p className="desc">Lighting layout and illuminance compliance — lux level checks, emergency lighting spacing, and fitting schedules.</p>
            <span className="pc-cta">In development</span>
          </div>
        </div>
      </section>

      <section className="beta-banner" id="beta">
        <div className="beta-inner">
          <div className="beta-copy">
            <div className="ptag">Coming soon</div>
            <h3>Flame beta — register your interest</h3>
            <p>
              We&apos;re opening a limited beta before general release. Leave
              your email and we&apos;ll let you know the moment it&apos;s
              ready.
            </p>
          </div>
          <form className="beta-form" onSubmit={handleInterestSubmit}>
            <input
              type="email"
              name="email"
              placeholder="you@company.com"
              required
              disabled={interestSent}
            />
            <button
              className="submit-btn"
              type="submit"
              disabled={interestSubmitting || interestSent}
            >
              {interestSent
                ? "You're on the list ✓"
                : interestSubmitting
                ? "Adding you…"
                : "Register interest"}
            </button>
          </form>
        </div>
        {interestError && <p className="error-msg beta-error">{interestError}</p>}
      </section>

      <section className="pricing" id="pricing">
        <div className="range-head">
          <h2 className="display">Pricing</h2>
          <p>One licence, every standard update for a year. No subscription lock-in.</p>
        </div>
        <div className={`price-grid${CHECKOUT_ENABLED ? "" : " preview-mode"}`}>
          <div className="price-card">
            <div className="ptag">Monthly</div>
            <div className="pnum">£19.99 <span>/ month</span></div>
            <ul>
              <li>Preset local standards</li>
              <li>DWG / DXF import & export</li>
              <li>Unlimited projects</li>
              <li>Standards updates included</li>
              <li>Cancel anytime</li>
            </ul>
            <a
              href="#signup"
              className={`price-btn${CHECKOUT_ENABLED ? "" : " locked"}`}
              onClick={(e) => {
                if (!CHECKOUT_ENABLED) { e.preventDefault(); return; }
                setSelectedPlan("monthly");
              }}
            >
              Start monthly
            </a>
          </div>
          <div className="price-card highlight">
            <div className="ptag">Lifetime — Best value</div>
            <div className="pnum">£299 <span>/ once</span></div>
            <ul>
              <li>Everything in Monthly</li>
              <li>One payment, yours forever</li>
              <li>All future Flame updates</li>
              <li>Priority email support</li>
              <li>Pays for itself in 16 months</li>
            </ul>
            <a
              href="#signup"
              className={`price-btn${CHECKOUT_ENABLED ? "" : " locked"}`}
              onClick={(e) => {
                if (!CHECKOUT_ENABLED) { e.preventDefault(); return; }
                setSelectedPlan("lifetime");
              }}
            >
              Buy lifetime
            </a>
          </div>
        </div>
        <p className="price-foot">
          {CHECKOUT_ENABLED
            ? "Secure checkout via Stripe · licence key issued immediately on payment"
            : "Preview pricing — checkout opens at public launch. Register your interest above to be notified."}
        </p>
      </section>

      <section id="signup-contact">
        <div className="split">
          <div className="panel" id="signup">
            <div className="ptitle display">Checkout</div>
            <div className="pdesc">
              {CHECKOUT_ENABLED
                ? "Choose a plan above, then pay securely with Stripe — your Flame licence key is issued the moment payment goes through."
                : "Checkout isn't open yet. Register your interest above and we'll email you the moment Flame beta purchases go live."}
            </div>
            {CHECKOUT_ENABLED ? (
              <>
                <div className={`plan-badge mono${selectedPlan ? "" : " unset"}`}>
                  {selectedPlan ? PLAN_LABELS[selectedPlan] : "No plan selected — pick one above ↑"}
                </div>
                <form onSubmit={handleCheckoutSubmit}>
                  <div className="field">
                    <label>Full name</label>
                    <input type="text" name="name" required />
                  </div>
                  <div className="field">
                    <label>Work email</label>
                    <input type="email" name="email" required />
                  </div>
                  <button className="submit-btn" type="submit" disabled={!selectedPlan || submitting}>
                    {submitting
                      ? "Redirecting to secure checkout…"
                      : selectedPlan
                      ? PLAN_BUTTON_TEXT[selectedPlan]
                      : "Select a plan to continue"}
                  </button>
                  {errorMsg && <p className="error-msg">{errorMsg}</p>}
                </form>
              </>
            ) : (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="field">
                  <label>Full name</label>
                  <input type="text" placeholder="Coming soon" disabled />
                </div>
                <div className="field">
                  <label>Work email</label>
                  <input type="email" placeholder="Coming soon" disabled />
                </div>
                <button className="submit-btn locked" type="submit" disabled>
                  Coming soon
                </button>
              </form>
            )}
          </div>
          <div className="panel" id="contact">
            <div className="ptitle display">Talk to us</div>
            <div className="pdesc">We're building this alongside people who'll actually use it — feedback, feature recommendations, and questions are all welcome. Multi-seat licensing and custom standards enquiries too.</div>
            <form onSubmit={handleContactSubmit}>
              <div className="field">
                <label>Email</label>
                <input type="email" name="email" required />
              </div>
              <div className="field">
                <label>Message</label>
                <textarea name="message" required></textarea>
              </div>
              <button className="submit-btn" type="submit">
                {contactSent ? "Message sent ✓" : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <footer>
        <span>PLOT-LV © 2026 · Compliance CAD tools</span>
        <span>FLAME · FOV (future) · LUX (future)</span>
      </footer>
    </>
  );
}
