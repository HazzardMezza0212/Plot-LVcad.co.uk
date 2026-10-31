import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import OpenPlanner from "@/components/site/OpenPlanner";
import ProPricing from "@/components/site/ProPricing";
import CameraDome from "@/components/site/CameraDome";
import { CANONICAL_URL } from "@/lib/site";
import { MODELS } from "@/lib/fov/cameraPages";

export const metadata = {
  title: { absolute: "Plot-LV FOV — free CCTV field of view calculator & layout planner" },
  description:
    "Plan CCTV cameras on your own floor plan. See each camera's field of view, pixel density (px/m) and DORI levels, clipped by walls and checked room by room. Free in your browser, no sign-up.",
  alternates: { canonical: "/" },
};

const BRANDS = [...new Set(MODELS.map((m) => m.brand))];

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Plot-LV FOV",
  applicationCategory: "DesignApplication",
  operatingSystem: "Web browser",
  url: CANONICAL_URL,
  description:
    "CCTV field of view calculator and layout planner: field of view, pixel density and DORI levels on your own floor plan, clipped by walls.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "GBP" },
    { "@type": "Offer", name: "FOV Pro monthly", price: "19", priceCurrency: "GBP" },
    { "@type": "Offer", name: "FOV Pro yearly", price: "199", priceCurrency: "GBP" },
  ],
};

const FAQ = [
  ["Is it really free?", "Yes. No card, no account. Open the planner and start. The free version stays when you upgrade or if you cancel Pro."],
  ["Do my drawings get uploaded?", "No. Plans open and process in your browser, on your device. Projects save as a file on your computer."],
  ["I work in DWG.", "DWG import is coming soon. For now, save it as DXF from your CAD software and open it in Pro. Image and PDF plans work in Free."],
  ["Can I cancel Pro?", "Yes, any time from your account page, in two clicks. You keep Pro until the end of the period you've paid for."],
  ["Who signs off the design?", "You do. FOV does the calculation and the paperwork; the designer stays responsible for the design."],
];

function Plus() {
  return (
    <span className="pl" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1v12M1 7h12" stroke="#0F1A2E" strokeWidth="2" /></svg>
    </span>
  );
}

export default function Home() {
  return (
    <div className="v2">
      {/* Intro: plays once per browser session. The inline script runs before
          paint, so returning visitors never see it flash. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "try{if(sessionStorage.getItem('plv_intro')){document.documentElement.dataset.intro='seen'}else{sessionStorage.setItem('plv_intro','1')}}catch(e){}",
        }}
      />
      <div className="boot" aria-hidden="true">
        <div className="radar"><div className="w" /><img src="/site/plv-icon.png" alt="" /></div>
        <div className="bootlines mono"><span>Calibrating scale…</span><span>Placing cameras…</span><span>Checking coverage ✓</span></div>
        <div className="bar"><i /></div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />

      <div className="wrap">
        <Header />
        <section className="hero">
          <span className="pill"><b>FREE</b>CCTV coverage planner · runs in your browser</span>
          <h1 className="big disp">See every <em className="hl">blind spot</em> before you drill.</h1>
          <p className="lede">
            Drop in a floor plan, place real camera models and watch coverage, pixel density and DORI levels
            update — clipped by every wall.
          </p>
          <div className="ctas">
            <OpenPlanner accent large arrow />
            <a className="btn btn-g lg" href="#pricing">See Pro</a>
          </div>
          <p className="micro">No sign-up. By opening the planner you agree to the <a href="/legal#terms">terms of use</a>.</p>

          <div className="stage" aria-label="Exploded view of a Plot-LV FOV project: the drawing, the cameras and walls, and the ground heatmap">
            <div className="cone" style={{ left: "calc(50% + 330px)", top: 70 }} />
            <CameraDome style={{ left: "calc(50% + 280px)", top: 92 }} />
            <div className="stack">
              <div className="lyr"><img src="/site/plan.webp" alt="The example office floor plan that opens with Plot-LV FOV" /></div>
              <div className="lyr l2"><img src="/site/coverage.webp" alt="Cameras placed on the plan with field of view clipped by walls" /></div>
              <div className="lyr l3"><img src="/site/heatmap.webp" alt="Ground heatmap showing where the working level is met" /></div>
            </div>
            <div className="call" style={{ left: "calc(50% - 470px)", top: 150 }}>
              <span className="tx"><small className="mono">LAYER 03</small>Ground heatmap</span><span className="ln" /><span className="dot" />
            </div>
            <div className="call" style={{ left: "calc(50% - 500px)", top: 330, animationDelay: "3.6s" }}>
              <span className="tx"><small className="mono">LAYER 02</small>Walls clip the view</span><span className="ln" /><span className="dot" />
            </div>
            <div className="call" style={{ left: "calc(50% + 230px)", top: 520, animationDelay: "3.8s" }}>
              <span className="dot" /><span className="ln" /><span className="tx"><small className="mono">LAYER 01</small>Your drawing, to scale</span>
            </div>
          </div>
        </section>
      </div>

      <div className="mq" aria-label="Camera brands in the library">
        <div className="tr disp">
          {[0, 1].map((n) => (
            <span key={n} style={{ display: "inline-flex", gap: 56 }} aria-hidden={n === 1}>
              {BRANDS.map((b) => <span key={b}>{b}</span>)}
              <span style={{ color: "var(--blue)" }}>{BRANDS.length} manufacturers in the library</span>
            </span>
          ))}
        </div>
      </div>

      <div className="wrap" id="features">
        <section className="feat">
          <div className="txt">
            <span className="kicker">01 — Field of view</span>
            <h2 className="h disp">Walls don&apos;t lie. Neither does this.</h2>
            <p>Every camera draws its coverage from the published field of view. With Pro, walls, doors and obstacles cut it off, so blind spots show up on the plan, not on site.</p>
            <span className="chip free">✓ Free: field of view</span> <span className="chip pro">◆ Pro: walls block the view</span>
          </div>
          <div className="shot"><div className="blob" style={{ background: "#DCE2FF" }} /><div className="fr"><img src="/site/coverage.webp" alt="Office floor plan with six cameras and their coverage clipped by walls" loading="lazy" /></div></div>
        </section>

        <section className="feat flip">
          <div className="txt">
            <span className="kicker">02 — Camera POV</span>
            <h2 className="h disp">Stand where the camera stands.</h2>
            <p>Right-click any camera and see the floor from its position, coloured by whether it meets your working level. Spot the gap before the client does.</p>
            <span className="chip free">✓ Free</span>
          </div>
          <div className="shot"><div className="blob" style={{ background: "#FFE3D6" }} /><div className="fr"><img src="/site/pov.webp" alt="Camera view window showing the floor from the camera's position, coloured by coverage" loading="lazy" /></div></div>
        </section>

        <section className="feat">
          <div className="txt">
            <span className="kicker">03 — The numbers</span>
            <h2 className="h disp">Every camera, fully specified.</h2>
            <p>Focal length, mounting height, rotation and target distance — and the pixel density you get at that distance, checked against your working level. Lens data comes from the manufacturer&apos;s datasheet.</p>
            <span className="chip pro">◆ Pro</span>
          </div>
          <div className="shot"><div className="blob" style={{ background: "#DDF3E7" }} /><div className="fr" style={{ maxWidth: 520, marginLeft: "auto" }}><img src="/site/settings.webp" alt="Camera settings dialog showing model, focal length, mounting height and density at target of 69 px/m" loading="lazy" /></div></div>
        </section>

        <section className="feat flip">
          <div className="txt">
            <span className="kicker">04 — The workspace</span>
            <h2 className="h disp">Walls, doors, rooms, cameras. One screen.</h2>
            <p>Draw walls, rooms, obstacles and doors over your plan, give each room a security layer, and pick from the camera library. Everything runs in your browser.</p>
            <span className="chip free">✓ Free</span>
          </div>
          <div className="shot"><div className="blob" style={{ background: "#FFE3D6" }} /><div className="fr"><img src="/site/workspace.webp" alt="The full Plot-LV FOV workspace with toolbar, floor plan, cameras and the security layers panel" loading="lazy" /></div></div>
        </section>
      </div>

      <div className="wrap">
        <section className="stats">
          <p className="disp">
            From <span className="k">25 px/m</span> to tell someone&apos;s there, to <span className="k k2">250 px/m</span> to
            identify a stranger — FOV draws the line on your plan, to <span className="k">EN 62676-4</span>.
          </p>
        </section>

        <section className="price" id="pricing">
          <div className="ph-head">
            <span className="kicker">Pricing</span>
            <h2 className="h disp" style={{ marginBottom: 0 }}>Free to plan. Pro to hand over.</h2>
          </div>
          <ProPricing />
        </section>

        <section className="faq" aria-label="Questions">
          {FAQ.map(([q, a], i) => (
            <details key={q} open={i === 0}>
              <summary>{q}<Plus /></summary>
              <p>{a}</p>
            </details>
          ))}
        </section>

        <section className="final">
          <h2 className="disp">Place your<br />first camera.</h2>
          <OpenPlanner accent large arrow />
        </section>

        <Footer />
      </div>
    </div>
  );
}
