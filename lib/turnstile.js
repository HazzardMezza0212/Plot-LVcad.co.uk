import "server-only";

// Cloudflare Turnstile (free CAPTCHA) server-side check.
// Set TURNSTILE_SECRET_KEY (and NEXT_PUBLIC_TURNSTILE_SITE_KEY) in Vercel to
// switch it on. Until the secret is set this accepts everything, so the forms
// keep working while the keys are being set up.
export const isTurnstileEnforced = Boolean(process.env.TURNSTILE_SECRET_KEY);

export async function verifyTurnstile(token, ip) {
  if (!isTurnstileEnforced) return true;
  if (typeof token !== "string" || token.length < 10 || token.length > 4096) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, ...(ip && ip !== "unknown" ? { remoteip: ip } : {}) }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data?.success === true;
  } catch {
    return false;
  }
}
