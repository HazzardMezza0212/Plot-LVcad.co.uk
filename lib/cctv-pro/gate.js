// Who may download FOV Pro code. Pure: no Next or Supabase imports, so tests can run it.
// The route handler (app/cctv/assets/pro/[file]) and proxy.js both use these checks.
import { isProEntitled } from "../stripe/entitlement.js";

const SAFE_FILE = /^[A-Za-z0-9._-]+\.(js|mjs)$/;

// Every refusal gives this same answer, so a caller can't tell signed-out, free, unknown file or
// bad name apart.
const REFUSED = Object.freeze({ serve: false });

/** A file name we are willing to look up at all. Only a shape check: the allowlist decides. */
export function isSafeProFileName(name) {
  return typeof name === "string" && SAFE_FILE.test(name) && !name.includes("..");
}

/**
 * True if a request path points at FOV Pro code, however it is encoded (%63ctv, %70ro, pr%6F, pro%2F),
 * upper or lower case. Decodes until stable, so double encodings are caught too. A path that won't
 * decode is treated as Pro, so it is refused.
 */
export function isProPath(pathname) {
  let decoded = String(pathname);
  try {
    for (let i = 0; i < 3; i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    return true;
  }
  return decoded.toLowerCase().includes("/assets/pro");
}

/**
 * The decision for one request. `allowlist` is a Set of file names read from private/cctv-pro.
 * `claims` is the verified session (sub = user id), `entitlement` the user's own row, or null.
 */
export function decideProFile({ fileName, allowlist, claims, entitlement, now = new Date() }) {
  if (!isSafeProFileName(fileName)) return REFUSED;
  if (!allowlist || !allowlist.has(fileName)) return REFUSED;
  if (!claims?.sub) return REFUSED;
  if (!isProEntitled(entitlement, now)) return REFUSED;
  return { serve: true, fileName };
}
