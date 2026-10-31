import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import OpenPlanner from "@/components/site/OpenPlanner";
import { SUPPORT_EMAIL } from "@/lib/site";
import { SUPPORT_REPLY_TIME } from "@/lib/legal";

export const metadata = {
  title: "Getting started with Plot-LV FOV",
  description:
    "Your first CCTV layout in five minutes: open a floor plan, set the scale, draw walls and doors, place cameras, check coverage and pixel density, then save and export.",
  alternates: { canonical: "/getting-started" },
};

const K = ({ children }) => <span className="kbd">{children}</span>;

const GUIDES = [
  {
    id: "open",
    title: "Open your plan",
    h: "Open your floor plan",
    l: "FOV opens with an example office so you can try it straight away. When you're ready, swap in your own drawing.",
    steps: [
      <>Click <b>Use my own plan</b> in the banner at the top, or the open-file button in the toolbar.</>,
      <>Choose a <b>PDF, PNG or JPG</b>. For a PDF, pick the page you want.</>,
      <>The plan appears as a backdrop. It&apos;s opened in your browser and never uploaded.</>,
    ],
    tip: <><b>DWG?</b> Save it as DXF from your CAD software. DXF opens in FOV Pro; PDF and image plans work in Free.</>,
  },
  {
    id: "scale",
    title: "Set the scale",
    h: "Set the scale",
    l: "Every distance, field of view and pixel density depends on this, so do it first.",
    steps: [
      <>Pick <b>Set scale</b> <K>K</K> from the toolbar.</>,
      <>Click both ends of a dimension you know, ideally a long one such as a wall or a dimension line.</>,
      <>Enter its real length. The green scale badge at the top confirms the plan is to scale.</>,
    ],
    tip: <>Use the longest known dimension you can find. A small error on a short one gets magnified across the whole plan.</>,
  },
  {
    id: "walls",
    title: "Walls, doors, rooms",
    h: "Draw walls, doors and rooms",
    l: "Walls and obstacles block a camera's view by height, so trace the ones that matter.",
    steps: [
      <><b>Wall</b> <K>W</K>: trace along the walls on your plan. New walls use the default height in the right-hand panel (internal 2.7 m or external 3 m).</>,
      <><b>Door</b> <K>D</K>: place doors so the view passes through doorways.</>,
      <><b>Obstacle</b> <K>O</K>: add shelving, pillars or partitions, then set the height in the inspector.</>,
      <><b>Room</b> <K>E</K>: close a room and give it a security layer to get a pass or fail per room.</>,
    ],
  },
  {
    id: "cameras",
    title: "Place cameras",
    h: "Place and tune cameras",
    l: "Choose a model, drop it in, then set how it's mounted.",
    steps: [
      <>Pick <b>Camera</b> <K>C</K>, choose a manufacturer and model in the bar above the plan, then click to place it. Near a wall, it clips to the wall.</>,
      <>Drag to move. Hold <K>R</K> and scroll to rotate. <K>Ctrl</K>-drag to duplicate.</>,
      <>Double-click a camera to set focal length, mounting height, rotation and target distance. It shows the pixel density you&apos;ll get at that distance.</>,
    ],
    tip: <>Leave Horizontal FOV blank to use the library&apos;s datasheet figure, or enter your lens&apos;s value to override it.</>,
  },
  {
    id: "coverage",
    title: "Check coverage",
    h: "Check the coverage",
    l: "See where each camera is good enough for the job, not just where it points.",
    steps: [
      <>Set a <b>Target level</b> in the right-hand panel: Detect 25, Observe 62, Recognise 125 or Identify 250 px/m.</>,
      <>Turn on <b>Ground heatmap</b> to colour the floor by whether that level is met.</>,
      <>Right-click a camera and choose <b>View POV</b> to see the floor from the camera&apos;s position.</>,
      <>Under <b>Security layers</b>, adjust the px/m for each layer to match your client&apos;s brief.</>,
    ],
    tip: <>The levels are working reference values from EN 62676-4. Check them, and the camera data, against the client&apos;s brief and the manufacturer&apos;s datasheet before you rely on them.</>,
  },
  {
    id: "export",
    title: "Save and export",
    h: "Save and export",
    l: "Projects live on your computer, not on our servers.",
    steps: [
      <>Use the <b>save</b> button in the toolbar to download the project as a file. Open it again later with the open button.</>,
      <>Use <b>export</b> to save the plan as a PNG to send or drop into a report.</>,
      <>With FOV Pro, export a PDF coverage report under your logo.</>,
    ],
    tip: <>Save as you go. Nothing is stored online, so closing the tab without saving loses unsaved changes.</>,
  },
];

const KEYS = [
  ["V", "Select"], ["H", "Pan"], ["K", "Set scale"], ["W", "Wall"], ["E", "Room"], ["O", "Obstacle"],
  ["D", "Door"], ["C", "Camera"], ["R", "+ scroll · Rotate"], ["Ctrl", "+ drag · Duplicate"],
  ["Shift", "+ click · Multi-select"], ["2×", "click · Edit camera"],
];

export default function GettingStarted() {
  return (
    <div className="v2">
      <div className="wrap">
        <Header />
        <h1 className="pageh disp" style={{ marginTop: 40 }}>Your first layout<br />in <em className="hl">five minutes</em>.</h1>
        <p className="lede-l" style={{ marginBottom: 30 }}>
          Six short steps, from opening a plan to exporting the layout. Open the planner in another tab and follow along.
        </p>
        <OpenPlanner arrow />

        <div className="hero-shot">
          <div className="fr">
            <img src="/site/workspace.webp" alt="The Plot-LV FOV workspace: tools on the left, the floor plan with cameras in the middle, and the security layers panel on the right" />
          </div>
        </div>

        <div className="lay">
          <nav className="toc" aria-label="Steps">
            {GUIDES.map((g, i) => (
              <a key={g.id} href={`#${g.id}`}><span className="num">{i + 1}</span>{g.title}</a>
            ))}
          </nav>
          <div className="docbody">
            {GUIDES.map((g, i) => (
              <article className="sec" id={g.id} key={g.id}>
                <span className="kicker">Step {i + 1} of {GUIDES.length}</span>
                <h2 className="disp">{g.h}</h2>
                <p className="l">{g.l}</p>
                <ol className="steps">{g.steps.map((s, n) => <li key={n}><span>{s}</span></li>)}</ol>
                {g.tip && <div className="tip">{g.tip}</div>}
              </article>
            ))}
          </div>
        </div>

        <section className="keys">
          <span className="mono" style={{ fontSize: 13, color: "#AFC0FF" }}>KEYBOARD SHORTCUTS</span>
          <h2 className="disp">Work faster.</h2>
          <div className="kgrid">
            {KEYS.map(([k, t]) => <div className="key" key={k + t}><K>{k}</K>{t}</div>)}
          </div>
        </section>

        <section className="support" id="support">
          <div>
            <span className="kicker">Support</span>
            <h2 className="disp">Stuck? Ask a real person.</h2>
            <p style={{ margin: 0, color: "var(--mute)", fontSize: 17, lineHeight: 1.55 }}>
              Email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--blue)" }}>{SUPPORT_EMAIL}</a>. We aim to reply within {SUPPORT_REPLY_TIME}.
              {" "}Looking for a camera&apos;s numbers? Try the <Link href="/cctv-cameras" style={{ color: "var(--blue)" }}>camera library</Link>.
            </p>
          </div>
          <a className="btn btn-p" href={`mailto:${SUPPORT_EMAIL}`}><span className="in" />Email support</a>
        </section>

        <Footer />
      </div>
    </div>
  );
}
