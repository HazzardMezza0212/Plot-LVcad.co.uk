const REPORT_ONLY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://eu-assets.i.posthog.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://eu.i.posthog.com https://eu-assets.i.posthog.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: lets phones/tablets on the same Wi-Fi load the dev server via
  // the machine's LAN address (Next.js blocks cross-origin dev assets by
  // default). The wildcard covers the router handing out a different IP each
  // day. Ignored entirely in production builds.
  allowedDevOrigins: ["192.168.1.*"],

  // Basic security headers on every response.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          // Full policy in report-only mode first: check the browser console on the
          // home page, /login and /cctv for "Content-Security-Policy-Report-Only"
          // warnings, add anything legitimate that is listed, then rename this key
          // to "Content-Security-Policy" (merging with the enforced one above).
          { key: "Content-Security-Policy-Report-Only", value: REPORT_ONLY_CSP },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },

  // Temporary: serve the Plot-LV CCTV preview (static Vite build in
  // public/cctv) at /cctv. Remove this and public/cctv to take it down.
  async rewrites() {
    return [
      { source: "/cctv", destination: "/cctv/index.html" },
      { source: "/cctv/", destination: "/cctv/index.html" },
    ];
  },
};

export default nextConfig;
