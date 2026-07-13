import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Flame — what it does, how it works, how validation works | Plot-LV",
  description:
    "A full tour of Plot-LV Flame: import a floor plan, draw the building, place real catalogue devices, and run 17 automated BS 5839-1:2025 checks — wall-aware coverage, audibility, escape routing, zoning — then export a sign-off-ready report. 100% offline.",
};

/* ------------------------------------------------------------------ */
/* SHOWCASE — edit this list to change what's featured.                */
/*                                                                     */
/* To feature a YouTube video, add an entry like:                      */
/*   { type: "youtube", id: "dQw4w9WgXcQ", title: "Flame in 90 seconds" } */
/* (the id is the part after watch?v= in the YouTube URL) and it       */
/* renders as an embedded player in the same grid. `wide: true` makes  */
/* an item span the full row.                                          */
/* ------------------------------------------------------------------ */
const SHOWCASE = [
  {
    type: "youtube",
    id: "Jqr_Qvutdk4",
    wide: true,
    label: "WATCH IT WORK",
    title: "Plot-LV Flame walkthrough",
    caption:
      "See Flame in action — from importing a floor plan to a validated, exported report.",
  },
  {
    type: "image",
    src: "/flame/app-full-ui.png",
    w: 1894,
    h: 997,
    wide: true,
    label: "THE WORKSPACE",
    caption:
      "The full workspace: device catalogue on the left, your plan in the middle, layers and the live validation report on the right.",
    alt: "Plot-LV Flame full application window showing a traced floor plan, device catalogue, layer toggles and a live validation report",
  },
  {
    type: "image",
    src: "/flame/validation-report.png",
    w: 1388,
    h: 692,
    label: "LIVE VALIDATION",
    caption:
      "Every room gets a line-by-line verdict — check, required, measured, PASS or FAIL — updating as you place devices.",
    alt: "Close-up of wall-aware detector coverage shading and a per-room validation report with PASS and FAIL rows",
  },
  {
    type: "image",
    src: "/flame/coverage-placement.png",
    w: 655,
    h: 759,
    label: "COVERAGE YOU CAN SEE",
    caption:
      "Detector coverage drawn on the plan itself — walls block it, doorways pass it, gaps show up in red before they cost you a site visit.",
    alt: "Floor plan with smoke detector coverage areas, manual call points and rooms shaded by compliance state",
  },
  {
    type: "image",
    src: "/flame/escape-routes.png",
    w: 1041,
    h: 771,
    label: "ESCAPE ROUTING",
    caption:
      "Routed escape paths from every room to its nearest exit — real walking routes around walls, not straight lines through them.",
    alt: "Floor plan overlaid with computed escape routes, fire zones and compliant room ticks",
  },
];

/* The 17 automated checks, as the engine runs them. */
const CHECKS = [
  {
    name: "Required devices present",
    sev: "FAIL",
    desc: "Does the room have the minimum count of each device type its BS 5839 category demands — smoke, heat, MCP, sounder, VAD? The most basic “did you put the right kit in” check.",
  },
  {
    name: "Room has at least one device",
    sev: "FAIL",
    desc: "Catches the classic slip: a room given a category, then left with nothing in it.",
  },
  {
    name: "Detection coverage",
    sev: "FAIL",
    desc: "The wall-aware raycast model, sampled on a ~1 m grid, against the category's required coverage (e.g. ≥95% for L1). Turns “there are detectors in the room” into “the whole room is actually covered” — and reports the uncovered m² when it isn't.",
  },
  {
    name: "Detector spacing",
    sev: "FAIL",
    desc: "Worst-case gap between same-type detectors against the standard's maximum spacing. Thresholds come from the standards library, not hard-coded.",
  },
  {
    name: "Detector distance from wall",
    sev: "FAIL",
    desc: "Flags detectors inside the “dead air” zone where wall meets ceiling, using per-type minimum clearances from the standard.",
  },
  {
    name: "VAD (visual alarm) coverage",
    sev: "FAIL",
    desc: "Rooms that require a visual alarm are checked for actual strobe reach, not just the presence of a beacon — only devices with an EN 54-23 coverage code count. Spatial reach is modelled; photometric compliance stays with you.",
  },
  {
    name: "Sound coverage",
    sev: "FAIL",
    desc: "The quietest point in the room against the minimum SPL (default 65 dB(A)), using inverse-square projection from every sounder. A sizing sanity-check, not an acoustic simulation — and the page says so.",
  },
  {
    name: "MCP reach at the door",
    sev: "FAIL",
    desc: "Every door in a room that needs manual call points has an MCP within the standard's door distance — because people raise the alarm on the way out.",
  },
  {
    name: "Maximum travel distance to an MCP",
    sev: "FAIL",
    desc: "Genuine walking distance to the nearest call point — routed around walls, through doors — against the limit (default 45 m, tightened to 25 m for rooms flagged mobility-impaired).",
  },
  {
    name: "Exit route reachable",
    sev: "FAIL",
    desc: "A* pathfinding from every room to its nearest fire exit. A room with no route to an exit is a life-safety defect, and it's flagged on the canvas too.",
  },
  {
    name: "Fire-zone device & area limits",
    sev: "FAIL",
    desc: "Each detection zone against the standard's maximum floor area and device count — zones exist so a fire can be located fast.",
  },
  {
    name: "Zone plan present",
    sev: "FAIL",
    desc: "BS 5839-1:2025 makes the zone plan a requirement in its own right: a multi-room system with zero zones fails, and the report withholds its zone-plan page until one is drawn.",
  },
  {
    name: "Zone search distance",
    sev: "WARN",
    desc: "Walkable distance to search a zone end-to-end against a recommended maximum (default 60 m), measured centre-to-farthest-room.",
  },
  {
    name: "Ceiling height limits",
    sev: "WARN",
    desc: "Point smoke above 10.5 m or point heat above 9 m draws a warning — beam or aspirating detection should be considered. A warning, not a fail: the designer makes the call.",
  },
  {
    name: "Sleeping-risk detection type",
    sev: "WARN",
    desc: "A room flagged “occupants sleeping” that relies on heat-only detection is warned — heat responds too late for escape while asleep.",
  },
  {
    name: "Orphaned device",
    sev: "WARN",
    desc: "A device floating outside every defined room protects nothing and isn't counted anywhere — usually a drawing slip.",
  },
  {
    name: "Heat-appropriate room type",
    sev: "INFO",
    desc: "Kitchens, plant and boiler rooms relying on optical smoke only get an advisory — steam and fumes cause false alarms. Informational, never a failure: it's a judgement call.",
  },
];

/* What the automated checks deliberately leave to the competent person. */
const YOUR_CALL = [
  ["Category selection & risk assessment", "You choose the category; Flame checks the layout against it, but doesn't judge whether it's right for the risk."],
  ["Cause & effect / control matrix", "Not modelled."],
  ["Power supply, standby battery & cabling", "EN 54-4 capacity and volt-drop calculations are not modelled."],
  ["EN 54-23 photometric VAD compliance", "Spatial reach is checked; the illumination volume is not."],
  ["Acoustics across partitions", "Sound is free-field inverse-square only — wall attenuation isn't modelled."],
  ["Beams, skylights, ventilation, stratification", "Ceiling-height warnings only; obstruction geometry isn't modelled."],
];

const STEPS = [
  {
    n: "01",
    title: "Import & scale",
    desc: "Load a floor plan — PNG, JPG, BMP or a page from a PDF — as a locked backdrop. Measure one known distance on the plan and the whole drawing snaps to real-world units: metres, feet, whatever you work in.",
  },
  {
    n: "02",
    title: "Draw the building",
    desc: "Trace walls over the backdrop with line, rectangle and polygon tools — snapping keeps you square. Then hit Detect Rooms and Flame finds every enclosed space for you to accept or reject, ready for categories and fire zones.",
  },
  {
    n: "03",
    title: "Place the devices",
    desc: "Drop detectors, sounders, call points and VADs from a catalogue of ~33 real devices — Apollo, Hochiki, Notifier, C-TEC, Eaton, KAC, Federal Signal — each carrying its EN 54 data. Compliant placement pulses green; a violation glows the room red, instantly. Stuck on a gap? “Suggest placement” proposes compliant positions as ghost markers you accept one by one.",
  },
  {
    n: "04",
    title: "Validate & export",
    desc: "Seventeen automated checks run across every room and the whole building, and a line-by-line table shows check / required / measured / status. Export a PDF report with an executive summary, per-room pages, zone plan, documented variations, a device schedule (plus CSV) and a designer sign-off block — under your logo.",
  },
];

const SPECS = [
  ["Standard", "BS 5839-1:2025 by default. Rules read their thresholds from a JSON standards library — the 2017 edition (superseded) and an NFPA 72 preset ship too, and new codes are a data edit, not a rewrite."],
  ["Clause citations", "Topic-based against the 2025 standard, with clause numbers deliberately marked TBC rather than guessed — the 2017 renumbering means we won't assert sub-clauses we can't verify. Confirm against your copy before quoting."],
  ["Privacy", "100% offline. No cloud, no account, no upload — nothing is transmitted anywhere. NDA-safe by construction."],
  ["Platform", "Windows, one standalone .exe. No AutoCAD, no Revit, no host CAD package."],
  ["Project safety", "Versioned save format, autosave every 2 minutes with crash recovery, 200-step undo/redo."],
  ["Getting started", "A one-click demo project with a deliberate failure to find and fix, plus first-run coach marks."],
];

function ShowcaseItem({ item }) {
  return (
    <figure className={`shot${item.wide ? " wide" : ""}`}>
      <div className="shot-frame">
        <div className="frame-label">
          <span>{item.label}</span>
          <span className="status">● LIVE BUILD</span>
        </div>
        {item.type === "youtube" ? (
          <div className="video-embed">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${item.id}`}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <Image
            src={item.src}
            width={item.w}
            height={item.h}
            alt={item.alt}
            className="shot-img"
            sizes="(max-width: 900px) 100vw, 1180px"
          />
        )}
      </div>
      <figcaption>{item.caption}</figcaption>
    </figure>
  );
}

export default function FlamePage() {
  return (
    <>
      <div className="grid-bg"></div>

      <nav>
        <Link href="/" className="logo">
          PLOT-LV <span className="tag">FLAME</span>
        </Link>
        <div className="nav-links">
          <a href="#showcase">Showcase</a>
          <a href="#how">How it works</a>
          <a href="#validation">Validation</a>
          <Link href="/#pricing">Pricing</Link>
          <Link href="/#contact">Contact</Link>
        </div>
        <Link href="/#beta" className="nav-cta">
          Register interest
        </Link>
      </nav>

      <section className="hero flame-hero">
        <div>
          <div className="eyebrow">Plot-LV / Flame — Product tour</div>
          <h1>
            Know exactly
            <br />
            what you&apos;re <em>buying</em>.
          </h1>
          <p className="sub">
            Flame is a desktop tool for designing and validating fire detection
            &amp; alarm layouts to BS&nbsp;5839-1:2025. Import a floor plan,
            trace the building, drop real catalogue devices — and watch 17
            automated checks score coverage, audibility, call-point reach,
            zoning and escape routes as you work. Then export a report a
            competent person can put their name to.
          </p>
          <div className="cta-row">
            <Link href="/#beta" className="btn-primary">
              Register for the beta
            </Link>
            <Link href="/#pricing" className="btn-secondary">
              See pricing →
            </Link>
          </div>
          <div className="meta-row">
            <span>
              <span className="dot"></span> 17 automated checks
            </span>
            <span>100% offline</span>
            <span>Windows</span>
          </div>
        </div>
        <div className="schematic-wrap">
          <div className="schematic-frame">
            <div className="frame-label">
              <span>VALIDATION REPORT · LIVE</span>
              <span className="status">● PASS / FAIL PER ROOM</span>
            </div>
            <Image
              src="/flame/validation-report.png"
              width={1388}
              height={692}
              alt="Plot-LV Flame validation report beside a floor plan with wall-aware detector coverage"
              className="shot-img"
              priority
              sizes="(max-width: 900px) 100vw, 560px"
            />
          </div>
        </div>
      </section>

      <section id="showcase" className="showcase">
        <div className="range-head">
          <h2 className="display">See it working</h2>
          <p>
            Real screenshots from the current build — this is the tool you get,
            not a mock-up.
          </p>
        </div>
        <div className="shot-grid">
          {SHOWCASE.map((item) => (
            <ShowcaseItem key={item.src || item.id} item={item} />
          ))}
        </div>
      </section>

      <section id="how" className="howworks">
        <div className="range-head">
          <h2 className="display">How it works</h2>
          <p>
            Four steps from a flat floor plan to a validated, documented
            design.
          </p>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="lean-num">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
        <p className="honest-note mono">
          One thing Flame doesn&apos;t do: read walls out of the image for you.
          The backdrop is a visual reference you trace over — auto-vectorising a
          raster plan is on the roadmap, not in the box.
        </p>
      </section>

      <section className="coverage-model">
        <div className="cm-grid">
          <div>
            <div className="eyebrow">The coverage model</div>
            <h2 className="display cm-title">
              Not a circle on paper.
            </h2>
            <p className="cm-text">
              Most spacing checks pretend a detector covers a perfect circle.
              Walls disagree. Flame casts <strong>96 rays</strong> from every
              detector; each ray stops at the first wall it hits and passes
              through doorways. The result is the detector&apos;s true,
              wall-clipped field of view — a detector on the far side of a
              partition gets no credit for the next room.
            </p>
            <p className="cm-text">
              The room is then sampled on a ~1&nbsp;metre grid, and coverage is
              the fraction of points inside at least one detector&apos;s field
              of view — compared against your category&apos;s requirement, with
              any uncovered floor area reported in m².
            </p>
            <p className="cm-text muted-text">
              What it is: a rigorous line-of-sight and range model — the right
              first-order answer for spacing and layout. What it isn&apos;t: a
              smoke-transport simulation. Ceiling-height effects get their own
              warning rule; stratification and beam obstructions stay with the
              designer.
            </p>
          </div>
          <div className="schematic-frame cm-diagram">
            <div className="frame-label">
              <span>RAYCAST FOV · 96 RAYS</span>
              <span className="status">● WALL-AWARE</span>
            </div>
            <svg
              className="diagram"
              viewBox="0 0 420 300"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="Diagram of a detector's raycast field of view clipped by a partition wall"
            >
              <rect className="room-fill" x="20" y="20" width="380" height="260" />
              <path className="wall" d="M20,20 L400,20 L400,280 L20,280 Z" />
              <path className="wall-thin" d="M240,20 L240,130" />
              <path className="wall-thin" d="M240,175 L240,280" />
              <path className="door-swing" d="M240,130 A45,45 0 0 1 285,175" />
              <line className="door-leaf" x1="240" y1="130" x2="285" y2="175" />

              {/* rays reaching freely in the left room */}
              <path className="ray" d="M130,150 L36,52" />
              <path className="ray" d="M130,150 L130,32" />
              <path className="ray" d="M130,150 L226,44" />
              <path className="ray" d="M130,150 L28,150" />
              <path className="ray" d="M130,150 L36,252" />
              <path className="ray" d="M130,150 L130,268" />
              <path className="ray" d="M130,150 L224,258" />
              {/* rays stopped by the partition */}
              <path className="ray blocked" d="M130,150 L238,96" />
              <path className="ray blocked" d="M130,150 L238,204" />
              {/* ray passing through the doorway */}
              <path className="ray through" d="M130,150 L340,158" />

              <circle className="node-fill" cx="130" cy="150" r="11" />
              <circle className="node-ring" cx="130" cy="150" r="11" />
              <circle className="node-ring" cx="130" cy="150" r="5" />
              <text x="96" y="135">SMOKE 01.1</text>

              <circle className="uncovered" cx="330" cy="70" r="4" />
              <circle className="uncovered" cx="360" cy="100" r="4" />
              <circle className="uncovered" cx="330" cy="240" r="4" />
              <text className="uncov-label" x="296" y="52">UNCOVERED</text>

              <text className="room-label" x="60" y="42">ZONE 01</text>
              <text className="room-label" x="330" y="272">ZONE 02</text>
            </svg>
          </div>
        </div>
      </section>

      <section id="validation" className="validation">
        <div className="range-head">
          <h2 className="display">The 17 checks, in full</h2>
          <p>
            No black box. Here is every rule the engine runs, what it measures,
            and how pass or fail is decided — the same detail we&apos;d want
            before trusting a tool ourselves.
          </p>
        </div>

        <div className="principle">
          <p>
            <strong className="mono">THE CORE PRINCIPLE —</strong> Flame is a
            design accelerator and error-catcher, not an automated approving
            authority. BS&nbsp;5839-1 requires a named, competent person to own
            the design; Flame&apos;s job is to make that person faster and
            catch what a manual pass would miss. That&apos;s why every exported
            report carries a designer sign-off block, never an
            &quot;APPROVED&quot; stamp.
          </p>
        </div>

        <div className="check-list">
          {CHECKS.map((c) => (
            <div className="check-row" key={c.name}>
              <div className="check-head">
                <span className="check-name">{c.name}</span>
                <span className={`sev-badge sev-${c.sev.toLowerCase()}`}>
                  {c.sev}
                </span>
              </div>
              <p className="check-desc">{c.desc}</p>
            </div>
          ))}
        </div>

        <p className="honest-note mono">
          A green room means every applicable check above passes — geometry,
          counts, spacing, coverage, audibility, call-point reach, zoning and
          escape routing all hold together. It is a meaningful bar. It is not a
          signed-off BS&nbsp;5839 design — that signature is yours.
        </p>
      </section>

      <section className="yourcall">
        <div className="range-head">
          <h2 className="display">What stays with you</h2>
          <p>
            We&apos;d rather tell you the limits before you buy than have you
            discover them after. These remain the competent person&apos;s
            responsibility — and the report says so.
          </p>
        </div>
        <div className="yc-grid">
          {YOUR_CALL.map(([title, desc]) => (
            <div className="yc-item" key={title}>
              <div className="yc-title">{title}</div>
              <div className="yc-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="specs">
        <div className="range-head">
          <h2 className="display">The fine print, up front</h2>
        </div>
        <div className="spec-grid">
          {SPECS.map(([k, v]) => (
            <div className="spec-row" key={k}>
              <div className="spec-key mono">{k}</div>
              <div className="spec-val">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="flame-cta">
        <div className="fc-inner">
          <h2 className="display">Ready to stop checking spacing by hand?</h2>
          <p>
            Flame is opening as a limited beta first — register and you&apos;ll
            hear the moment it&apos;s ready. Lifetime and monthly licences at
            launch.
          </p>
          <div className="cta-row fc-center">
            <Link href="/#beta" className="btn-primary">
              Register for the beta
            </Link>
            <Link href="/#pricing" className="btn-secondary">
              See pricing →
            </Link>
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
