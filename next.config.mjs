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
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ],
      },
      {
        source: "/api/account/:path*",
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
