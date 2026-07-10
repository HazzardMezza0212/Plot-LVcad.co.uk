// One-off schema setup. Run with:
//   node --env-file=.env.local scripts/init-db.mjs
// Safe to re-run (IF NOT EXISTS everywhere).
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set. Run: node --env-file=.env.local scripts/init-db.mjs");
  process.exit(1);
}
const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS licenses (
  key                 TEXT PRIMARY KEY,
  email               TEXT NOT NULL,
  plan                TEXT NOT NULL,
  stripe_session      TEXT UNIQUE,
  stripe_customer     TEXT,
  stripe_subscription TEXT,
  status              TEXT NOT NULL DEFAULT 'active',
  sub_status          TEXT,
  sub_checked_at      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS activations (
  license_key  TEXT REFERENCES licenses(key),
  machine_hash TEXT NOT NULL,
  first_seen   TIMESTAMPTZ DEFAULT now(),
  last_seen    TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (license_key, machine_hash)
)`;

console.log("Schema ready.");
