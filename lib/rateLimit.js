// Best-effort rate limiter, per server instance (in memory). It slows down a
// single noisy client; it does not stop a distributed attack, because each
// serverless instance keeps its own counts. Pair it with a Vercel Firewall
// rate-limit rule (Project -> Firewall) for hard limits.
//
// Returns 0 when the request is allowed, otherwise the seconds to wait.

const buckets = new Map();

export function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (forwarded ? forwarded.split(",")[0].trim() : "") || request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(request, name, { limit, windowMs }) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
  }
  const key = `${name}:${clientIp(request)}`;
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset <= now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count > limit ? Math.max(1, Math.ceil((bucket.reset - now) / 1000)) : 0;
}
