import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import LaunchButton from "@/components/LaunchButton";

// Guide article. Worked examples use the AXIS Q1728-LE entries in the FOV
// library (lib/fov/cameras.json: 3840 px, 108° wide / 42° tele, datasheet).

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const PATH = "/guides/how-to-calculate-cctv-field-of-view";
const PUBLISHED = "2026-10-23";

export const metadata = {
  title: "How to calculate CCTV field of view, scene width and pixel density | Plot-LV",
  description:
    "The formulas for a CCTV camera's horizontal field of view, scene width at distance and pixels per metre, with worked examples and how far a camera can identify or recognise someone.",
  alternates: { canonical: `${siteUrl}${PATH}` },
  openGraph: { type: "article", url: `${siteUrl}${PATH}`, siteName: "Plot-LV" },
};

const NAV_LINKS = [
  ["FOV planner", "/cctv-field-of-view-calculator"],
  ["Camera library", "/cctv-cameras"],
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How to calculate CCTV field of view, scene width and pixel density",
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  author: { "@type": "Organization", name: "Plot-LV" },
  publisher: { "@type": "Organization", name: "Plot-LV" },
  mainEntityOfPage: `${siteUrl}${PATH}`,
};

export default function Guide() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="grid-bg"></div>
      <SiteNav tag="GUIDE" links={NAV_LINKS} />

      <article className="guide">
        <p className="cam-crumbs mono">Guides · CCTV design</p>
        <h1 className="display">How to calculate CCTV field of view, scene width and pixel density</h1>
        <p className="guide-meta mono">Published 23 October 2026</p>

        <p>
          Three numbers decide whether a CCTV camera does the job: how wide it sees (field of view), how wide
          the scene is at a given distance (scene width), and how many pixels land on each metre of that
          scene (pixel density, in px/m). Here are the formulas, with worked examples.
        </p>

        <h2>The short version</h2>
        <div className="formula">
          Field of view = 2 × arctan(sensor width ÷ (2 × focal length))
          <br />
          Scene width = 2 × distance × tan(field of view ÷ 2)
          <br />
          Pixel density = horizontal pixels ÷ scene width
        </div>

        <h2>1. Find the horizontal field of view</h2>
        <p>
          <strong>Use the datasheet figure if there is one.</strong>{" "}Most manufacturers publish the horizontal
          field of view (HFOV) in degrees, often as a range for a varifocal lens. That figure already allows
          for the real sensor size and the lens, so it&apos;s the most reliable number to use.
        </p>
        <p>If you only have the focal length and sensor width, calculate it:</p>
        <div className="formula">HFOV = 2 × arctan(sensor width ÷ (2 × focal length))</div>
        <p>
          For example, a 4 mm lens on a sensor 6.4 mm wide gives 2 × arctan(6.4 ÷ 8) ≈ <strong>77°</strong>.
        </p>
        <p>
          Be careful with sensor sizes like &quot;1/2.8-inch&quot;. They are a naming convention, not a
          measurement, so look up the actual width in millimetres. Wide-angle lenses also tend to differ from
          the calculated figure because of distortion, which is another reason to prefer the published HFOV.
        </p>

        <h2>2. Work out the scene width at your distance</h2>
        <div className="formula">Scene width = 2 × distance × tan(HFOV ÷ 2)</div>
        <p>
          Take the <Link href="/cctv-cameras/axis-q1728-le">AXIS Q1728-LE</Link>{" "}at its widest setting: a
          published HFOV of 108°. At 10 m the scene is 2 × 10 × tan(54°) ≈ <strong>27.5 m</strong>{" "}wide.
        </p>

        <h2>3. Turn that into pixels per metre</h2>
        <div className="formula">Pixel density (px/m) = horizontal pixels ÷ scene width</div>
        <p>
          The Q1728-LE is 3840 pixels wide, so at 10 m that&apos;s 3840 ÷ 27.5 ≈ <strong>140 px/m</strong>.
        </p>
        <p>Compare the answer with the EN 62676-4 DORI levels to see what the camera is good for at that distance:</p>
        <table className="fovl-dori">
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">px/m</th>
              <th scope="col">What you get</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row">Detect</th><td className="mono">25</td><td>A person is there</td></tr>
            <tr><th scope="row">Observe</th><td className="mono">62</td><td>What they&apos;re doing and wearing</td></tr>
            <tr><th scope="row">Recognise</th><td className="mono">125</td><td>Someone who knows them can say who it is</td></tr>
            <tr><th scope="row">Identify</th><td className="mono">250</td><td>A stranger can be identified</td></tr>
          </tbody>
        </table>
        <p>
          At 140 px/m, the wide setting at 10 m is enough to <strong>recognise</strong>{" "}someone, but not to
          identify them.
        </p>

        <h2>4. How far can it identify someone?</h2>
        <p>Turn the formula round to find the distance at which a camera still meets a level:</p>
        <div className="formula">Distance = horizontal pixels ÷ (2 × px/m needed × tan(HFOV ÷ 2))</div>
        <p>For the Q1728-LE at 108°, identification (250 px/m) holds out to about:</p>
        <div className="formula">3840 ÷ (2 × 250 × tan(54°)) ≈ 5.6 m</div>
        <p>
          Zoom the same camera in to its 42° tele setting and the identification distance grows to about
          <strong> 20 m</strong>, but the scene at 10 m shrinks to about 7.7 m wide. That trade-off, coverage
          against detail, is the whole game in CCTV layout.
        </p>

        <h2>What the formulas leave out</h2>
        <ul>
          <li>
            <strong>Mounting height and tilt.</strong>{" "}A camera 3 m up looking at someone 8 m away is really
            about 8.5 m from them, and tilting the camera changes the shape of what it covers on the ground.
          </li>
          <li>
            <strong>The edges of the picture.</strong>{" "}Pixel density is highest along the centre of the view
            and drops towards the sides.
          </li>
          <li>
            <strong>Walls, doors and obstacles.</strong>{" "}The maths assumes a clear view, which most rooms
            don&apos;t give you.
          </li>
          <li>
            <strong>Light and compression.</strong>{" "}Low light, glare and heavy compression all reduce the
            detail you actually get.
          </li>
        </ul>

        <div className="guide-cta">
          <h2>Skip the calculator</h2>
          <p>
            Plot-LV FOV does these sums for every camera on your own floor plan, allowing for mounting height,
            tilt and walls, and shows where each one meets the DORI level you need. It&apos;s free and runs in
            your browser.
          </p>
          <div className="cta-row">
            <LaunchButton href="/guest" label="Open the planner — no sign-up" />
          </div>
        </div>

        <p style={{ marginTop: 28 }}>
          Looking for a specific camera? The <Link href="/cctv-cameras">camera library</Link>{" "}has field of view
          and DORI distances worked out for each model.
        </p>
      </article>

      <SiteFooter />
    </>
  );
}
