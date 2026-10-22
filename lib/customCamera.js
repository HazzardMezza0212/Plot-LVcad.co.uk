// Shape check for a custom camera sent by the FOV tool. The tool validates every rule (see FOV
// src/cameraLibrary.ts) before sending and again when loading; this only makes sure what is
// stored is the right type and size, and contains nothing else. Returns { spec } or { error }.

const FORM_FACTORS = ["dome", "bullet", "turret", "fisheye"];

const text = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const inRange = (v, min, max) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

export function cleanCameraSpec(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Missing camera details." };

  const name = text(input.name, 160);
  const brand = text(input.brand, 80);
  const model = text(input.model, 80);
  if (!name || !brand || !model) return { error: "Name, manufacturer and model are required." };
  if (!Number.isInteger(input.horizontalPixels) || !inRange(input.horizontalPixels, 320, 16384)) return { error: "Horizontal resolution is not valid." };
  if (!inRange(input.sensorWidthMm, 1, 50)) return { error: "Sensor width is not valid." };
  if (!inRange(input.focalMinMm, 0.5, 2000) || !inRange(input.focalMaxMm, 0.5, 2000) || input.focalMinMm > input.focalMaxMm) {
    return { error: "Focal length is not valid." };
  }

  const spec = {
    name, brand, model,
    horizontalPixels: input.horizontalPixels,
    sensorWidthMm: input.sensorWidthMm,
    focalMinMm: input.focalMinMm,
    focalMaxMm: input.focalMaxMm,
  };
  if (FORM_FACTORS.includes(input.formFactor)) spec.formFactor = input.formFactor;
  if (Number.isInteger(input.verticalPixels) && inRange(input.verticalPixels, 240, 16384)) spec.verticalPixels = input.verticalPixels;
  const sensorFormat = text(input.sensorFormat, 20);
  if (sensorFormat) spec.sensorFormat = sensorFormat;
  for (const k of ["hfovAtMinDeg", "hfovAtMaxDeg", "vfovAtMinDeg", "vfovAtMaxDeg"]) {
    if (inRange(input[k], 1, 179.9)) spec[k] = input[k];
  }
  if (inRange(input.irRangeM, 1, 500)) spec.irRangeM = input.irRangeM;
  const url = text(input.datasheetUrl, 500);
  if (/^https?:\/\/\S+$/i.test(url)) spec.datasheetUrl = url;
  const notes = text(input.notes, 500);
  if (notes) spec.notes = notes;
  return { spec };
}
