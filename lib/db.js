import { neon } from "@neondatabase/serverless";

// Lazy singleton so importing this module never throws at build time —
// only actual queries require DATABASE_URL (injected by the Neon/Vercel
// integration, or set in .env.local for local dev).
let _sql;

export function sql(strings, ...values) {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set — connect Neon in Vercel or fill .env.local");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql(strings, ...values);
}
