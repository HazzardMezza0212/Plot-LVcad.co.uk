/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev-only: lets phones/tablets on the same Wi-Fi load the dev server via
  // the machine's LAN address (Next.js blocks cross-origin dev assets by
  // default). The wildcard covers the router handing out a different IP each
  // day. Ignored entirely in production builds.
  allowedDevOrigins: ["192.168.1.*"],
};

export default nextConfig;
