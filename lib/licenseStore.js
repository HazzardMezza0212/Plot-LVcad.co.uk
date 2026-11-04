import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "licenses.json");

// Dev/single-instance file store, gitignored. This is NOT safe for serverless
// or multi-instance hosting (e.g. Vercel) — each instance has its own
// filesystem, so writes from one won't be visible to another, and concurrent
// writes can clobber each other. Swap this for a real database (Postgres,
// Supabase, etc.) before taking real payments in production.

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

export function saveLicense(sessionId, record) {
  const all = readAll();
  all[sessionId] = record;
  writeAll(all);
}

export function getLicense(sessionId) {
  return readAll()[sessionId];
}
