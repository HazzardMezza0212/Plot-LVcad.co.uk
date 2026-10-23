import Image from "next/image";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LaunchButton from "@/components/LaunchButton";
import ProEarlyAccess from "@/components/ProEarlyAccess";

// FOV landing page: the page we want Google to rank for CCTV field of view /
// pixel density / DORI searches. The tool itself stays at /cctv (blocked in
// robots.txt). Keep every claim here true for the live free version.

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PATH = "/cctv-field-of-view-calculator";

export const metadata = {
  title: "Free CCTV Field of View Calculator & Layout Planner | Plot-LV FOV",
  description:
    "Plan CCTV camera positions on your own floor plan. See each camera's field of view, pixel density (px/m) and DORI ranges, with walls and doors blocking the view. Free, runs in your browser, no sign-up.",
  alternates: { canonical: `${siteUrl}${PATH}` },
  openGraph: {
    title: "Free CCTV Field of View Calculator & Layout Planner",
    description:
      "Drop in a floor plan, place cameras and see exactly what each one covers: field of view, pixels per metre and DORI ranges. Free, in your browser.",
    url: `${siteUrl}${PATH}`,
    siteName: "Plot-LV",
    type: "website",
  },
};

const NAV_LINKS = [
  ["How it works", "#how"],
  ["PPM & DORI", "#dori"],
  ["Pro", "#pro"],
  ["FAQ", "#faq"],
  ["All products", "/#products"],
];

const FEATURES = [
  ["Field of view on your plan", "Each camera draws its real coverage wedge, from the model's published horizontal field of view."],
  ["Pixel density (px/m)", "See where a camera is good enough to detect, observe, recognise or identify a person."],
  ["Walls block the view", "Walls, doors and obstacles cut the coverage by height, so blind spots show up."],
  ["Security layers", "Give each room a target level and get a pass or fail coverage check per room."],
  ["Camera point of view", "Preview roughly what a camera will see from where you've put it."],
  ["Save and export", "Save the project as a file to pick up later, and export the plan as a PNG."],
];

// EN 62676-4 pixel density levels. These match the levels the tool uses.
const DORI = [
  ["Detect", "25", "You can tell a person is there."],
  ["Observe", "62", "You can see what they're doing and what they're wearing."],
  ["Recognise", "125", "Someone who knows the person can say who it is."],
  ["Identify", "250", "Enough detail to identify a stranger beyond reasonable doubt."],
];

const FAQ = [
  [
    "Is it really free?",
    "Yes. The free version is open now with no card and no account needed: choose \"Open the planner\" and you go straight in. A paid Pro version with CAD import and client reports is coming; the free version stays.",
  ],
  [
    "Do my floor plans get uploaded anywhere?",
    "No. Plans are opened and processed in your browser, on your device. Your project is saved as a file on your computer when you choose to save it.",
  ],
  [
    "What file types can I open?",
    "PDF, PNG and JPG floor plans in the free version. CAD drawings (DXF) open with FOV Pro. Using DWG? Save it as DXF from your CAD software.",
  ],
  [
    "How many pixels per metre do I need to identify a face?",
    "EN 62676-4 sets 250 px/m for identification and 125 px/m for recognition. FOV shows where each camera reaches those levels on your plan, so you can see how far out a camera stays useful.",
  ],
  [
    "Which cameras are in the library?",
    "40 models from 14 manufacturers, including Axis, Hikvision, Hanwha Vision, Avigilon, Bosch and Dahua, using each model's published field of view. Data is marked unverified until it has been checked against the manufacturer's datasheet, so check critical figures before you commit.",
  ],
  [
    "Does it work on a phone?",
    "It opens on a phone, but placing cameras and drawing walls is much easier on a laptop or desktop with a mouse.",
  ],
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Plot-LV FOV",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web browser",
    url: `${siteUrl}${PATH}`,
    description:
      "Free browser tool for laying out CCTV cameras on a floor plan and checking field of view, pixel density and DORI coverage.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  },
];

function OpenPlanner({ label = "Open the planner — no sign-up" }) {
  return <LaunchButton href="/guest" label={label} />;
}

export default function FovLandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid-bg"></div>
      <SiteNav tag="FOV" links={NAV_LINKS} />

      <section className="hero hero-centered fovl-hero">
        <div className="hero-inner">
          <div className="eyebrow">Plot-LV FOV · free CCTV planning tool</div>
          <h1 className="fovl-h1">
            Free CCTV <em>field of view</em>{" "}calculator &amp; layout planner
          </h1>
          <p className="sub">
            Drop in a floor plan, place cameras and see exactly what each one
            covers: field of view, pixels per metre and DORI ranges, with walls
            and doors blocking the view.
          </p>
          <div className="cta-row">
            <OpenPlanner />
            <Link href="/signup" className="btn-secondary">
              Create free account
            </Link>
          </div>
          <div className="meta-row">
            <span>
              <span className="dot"></span> Free, open now
            </span>
            <span>Runs in your browser</span>
            <span>Plans stay on your device</span>
          </div>
        </div>
        <figure className="fovl-shot">
          <Image
            src="/fov/planner-example.webp"
            alt="Plot-LV FOV showing an office floor plan with six CCTV cameras and their green coverage areas"
            width={1400}
            height={850}
            priority
            sizes="(max-width: 1100px) 100vw, 1100px"
          />
          <figcaption className="mono">The example office that opens with the planner. Drag a camera and the coverage updates.</figcaption>
        </figure>
      </section>

      <section className="fovl-features">
        <div className="range-head">
          <h2 className="display">What it works out for you</h2>
          <p>The checks you&apos;d otherwise do with a lens calculator, a ruler and a lot of guesswork.</p>
        </div>
        <div className="fovl-grid">
          {FEATURES.map(([title, desc]) => (
            <div className="fovl-card" key={title}>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="getstarted" id="how">
        <div className="range-head">
          <h2 className="display">How it works</h2>
          <p>A first layout takes a few minutes.</p>
        </div>
        <ol className="steps-row">
          <li>
            <span className="step-num mono">01</span>
            <h4>Open your floor plan</h4>
            <p>A PDF, PNG or JPG. No plan to hand? Start from the example office.</p>
          </li>
          <li>
            <span className="step-num mono">02</span>
            <h4>Set the scale and walls</h4>
            <p>Click both ends of a dimension you know, then trace the walls and doors that matter.</p>
          </li>
          <li>
            <span className="step-num mono">03</span>
            <h4>Place cameras, check coverage</h4>
            <p>Pick models from the library, drag them into place and see coverage and pixel density update live.</p>
          </li>
        </ol>
        <div className="cta-row fc-center">
          <OpenPlanner label="Try it now — free" />
        </div>
      </section>

      <section className="fovl-explain" id="dori">
        <div className="fovl-explain-inner">
          <div className="fovl-explain-copy">
            <div className="ptag mono">Pixel density &amp; DORI, in plain English</div>
            <h2 className="display">How much detail will this camera actually give me?</h2>
            <p>
              A camera&apos;s <strong>field of view</strong> is how wide it sees.
              The further from the camera, the wider the scene, so its pixels are
              spread more thinly. <strong>Pixel density</strong> measures that: the
              number of horizontal pixels covering one metre of the scene (px/m).
            </p>
            <p>
              A 1920-pixel camera looking at a scene 7.7&nbsp;m wide gives about
              250&nbsp;px/m, enough to identify someone. The same camera at a point
              where the scene is 31&nbsp;m wide gives about 62&nbsp;px/m: you can
              see what&apos;s happening, but not who it is.
            </p>
            <p>
              <strong>DORI</strong>{" "}names those levels. The figures below are from
              EN&nbsp;62676-4, the European standard for CCTV application. Pick the
              level you need in FOV and it shows where each camera meets it, so
              you can see where a camera stops being useful for the job.
            </p>
          </div>
          <table className="fovl-dori">
            <caption className="mono">DORI levels (EN 62676-4)</caption>
            <thead>
              <tr>
                <th scope="col">Level</th>
                <th scope="col">px/m</th>
                <th scope="col">What you get</th>
              </tr>
            </thead>
            <tbody>
              {DORI.map(([level, ppm, what]) => (
                <tr key={level}>
                  <th scope="row">{level}</th>
                  <td className="mono">{ppm}</td>
                  <td>{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ProEarlyAccess />

      <section className="fovl-faq" id="faq">
        <div className="range-head">
          <h2 className="display">Questions</h2>
        </div>
        <div className="fovl-faq-list">
          {FAQ.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="fovl-final">
        <h2 className="display">Plan your next CCTV layout in your browser</h2>
        <p>Free, no card, no sign-up. Your plans never leave your device.</p>
        <div className="cta-row fc-center">
          <OpenPlanner />
        </div>
        <p className="fovl-family">
          Also from Plot-LV: <Link href="/flame">Flame</Link>, fire alarm layouts against BS&nbsp;5839-1 (not on sale yet).
        </p>
      </section>

      <SiteFooter />
    </>
  );
}
