// Fails if FOV Pro code is anywhere under public/. Pro code lives in private/cctv-pro and is served
// only by app/cctv/assets/pro/[file] after an entitlement check. Run by npm test and before next build.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";

const root = process.cwd();
const publicDir = join(root, "public");
const privateDir = join(root, "private", "cctv-pro");

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const hash = (file) => createHash("sha256").update(readFileSync(file)).digest("hex");
const problems = [];

const proDir = join(publicDir, "cctv", "assets", "pro");
const leftover = walk(proDir);
if (leftover.length) {
  problems.push(`${relative(root, proDir)} exists with ${leftover.length} file(s). Pro code must not be under public/.`);
}

const privateByHash = new Map(walk(privateDir).map((f) => [hash(f), f]));
for (const f of walk(publicDir)) {
  const match = privateByHash.get(hash(f));
  if (match) {
    problems.push(`${relative(root, f)} is byte-identical to Pro file ${relative(root, match)}.`);
  }
}

if (problems.length) {
  console.error("check-pro-private: FAILED");
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log("check-pro-private: ok, no FOV Pro code under public/");
