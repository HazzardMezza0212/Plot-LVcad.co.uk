// Blocks cross-site requests to account actions (CSRF). Browsers always send
// an Origin header on POST; it must match this site.
export function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
