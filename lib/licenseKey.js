import { randomInt } from "crypto";

// Excludes 0/O and 1/I/L to avoid keys that are ambiguous when read aloud or typed.
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateLicenseKey() {
  const groups = [];
  for (let g = 0; g < 3; g++) {
    let group = "";
    for (let i = 0; i < 5; i++) {
      group += CHARSET[randomInt(CHARSET.length)];
    }
    groups.push(group);
  }
  return `FLAME-${groups.join("-")}`;
}
