// Data and maths for the public camera pages (/cctv-cameras).
//
// cameras.json is a copy of the FOV tool's library (Plot-LV FOV repo,
// src/data/cameras.json). Copy it across again whenever the library changes,
// so these pages and the tool always show the same numbers.
//
// The field of view follows the tool (src/optics.ts): the published
// horizontal field of view when the library has one, otherwise one
// calculated from sensor width and focal length, labelled as calculated.
import cameras from "./cameras.json";

export const DORI = [
  { level: "Detect", ppm: 25 },
  { level: "Observe", ppm: 62 },
  { level: "Recognise", ppm: 125 },
  { level: "Identify", ppm: 250 },
];

export const SCENE_DISTANCES = [5, 10, 20, 30];

const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;
const validFov = (v) => typeof v === "number" && v > 0 && v < 180;

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** "AXIS Q1728-LE, wide lens (5.9 mm)" -> { model: "AXIS Q1728-LE", lens: "wide lens (5.9 mm)" } */
function splitName(name) {
  const i = name.indexOf(", ");
  return i < 0 ? { model: name, lens: "" } : { model: name.slice(0, i), lens: name.slice(i + 2) };
}

function variant(c) {
  const published = validFov(c.hfovDeg);
  const hfov = published ? c.hfovDeg : toDeg(2 * Math.atan(c.sensorWidthMm / (2 * c.focalLengthMm)));
  const tanHalf = Math.tan(toRad(hfov) / 2);
  const { lens } = splitName(c.name);
  return {
    id: c.id,
    name: c.name,
    lens: lens || `${c.focalLengthMm} mm lens`,
    focalLengthMm: c.focalLengthMm,
    horizontalPixels: c.horizontalPixels,
    sensorFormat: c.sensorFormat,
    hfovDeg: hfov,
    fovSource: published ? "datasheet" : "calculated",
    verified: Boolean(c.verified),
    source: c.hfovSource || c.source || null,
    notes: c.notes || "",
    // Distance along the centre of the view at which each DORI level is still met.
    dori: DORI.map((d) => ({ ...d, metres: c.horizontalPixels / (d.ppm * 2 * tanHalf) })),
    // Scene width and pixel density at set distances.
    scene: SCENE_DISTANCES.map((m) => {
      const width = 2 * m * tanHalf;
      return { metres: m, width, ppm: c.horizontalPixels / width };
    }),
  };
}

function buildModels() {
  const byModel = new Map();
  for (const c of cameras) {
    const { model } = splitName(c.name);
    const slug = slugify(model);
    if (!byModel.has(slug)) byModel.set(slug, { slug, model, brand: c.brand, variants: [] });
    byModel.get(slug).variants.push(variant(c));
  }
  return [...byModel.values()].sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
}

export const MODELS = buildModels();

export const getModel = (slug) => MODELS.find((m) => m.slug === slug) || null;

export function modelsByBrand() {
  const out = new Map();
  for (const m of MODELS) {
    if (!out.has(m.brand)) out.set(m.brand, []);
    out.get(m.brand).push(m);
  }
  return [...out.entries()];
}

/** Round sensibly for display: 0.1 m under 10 m, whole metres above. */
export function fmtMetres(m) {
  return m < 10 ? m.toFixed(1) : String(Math.round(m));
}

export const fmtDeg = (d) => (Number.isInteger(d) ? String(d) : d.toFixed(1)) + "°";
