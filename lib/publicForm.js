import { isSameOrigin } from "@/lib/requestGuard";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { verifyTurnstile } from "@/lib/turnstile";

// Shared front door for public POST routes (contact, interest, early access, checkout).
// Runs the cheap checks first: same-origin (CSRF), rate limit, body size and
// JSON shape, then the CAPTCHA. Returns { response } to send straight back, or { body }.
//
//   const guard = await guardPublicPost(request, { name: "contact", limit: 5, windowMs: 3600_000 });
//   if (guard.response) return guard.response;
//
// Options: captcha (default true) can be false, or a function (body) => boolean.

const err = (message, status, extra) => ({
  response: Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store", ...extra } }),
});

export async function guardPublicPost(request, { name, limit, windowMs, captcha = true, maxBytes = 20000 }) {
  if (!isSameOrigin(request)) return err("Please use the form on plotlvcad.co.uk.", 403);

  const wait = rateLimit(request, name, { limit, windowMs });
  if (wait) return err("Too many attempts. Please try again later.", 429, { "Retry-After": String(wait) });

  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) return err("That request was too large.", 413);

  let body;
  try {
    const text = await request.text();
    if (text.length > maxBytes) return err("That request was too large.", 413);
    body = JSON.parse(text);
  } catch {
    return err("Something went wrong. Please try again.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return err("Something went wrong. Please try again.", 400);

  const needsCaptcha = typeof captcha === "function" ? captcha(body) : captcha;
  if (needsCaptcha && !(await verifyTurnstile(body.turnstileToken, clientIp(request)))) {
    return err("Please complete the check and try again.", 400);
  }
  return { body };
}

// Trim and cap a text field; anything that isn't a string becomes "".
export const clip = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");
export const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
