import crypto from "crypto";

// Signs licence tokens with Ed25519. The private key exists only in env vars
// (Vercel / .env.local); the matching public key is embedded in the Flame exe,
// which verifies tokens OFFLINE — that's why weekly checks don't need a
// network call on every launch.
export function signLicenseToken(payload) {
  if (!process.env.LICENSE_SIGNING_KEY) {
    throw new Error("LICENSE_SIGNING_KEY is not set");
  }
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(process.env.LICENSE_SIGNING_KEY, "base64"),
    format: "der",
    type: "pkcs8",
  });
  const data = Buffer.from(JSON.stringify(payload), "utf8");
  const sig = crypto.sign(null, data, privateKey);
  return `${data.toString("base64url")}.${sig.toString("base64url")}`;
}
