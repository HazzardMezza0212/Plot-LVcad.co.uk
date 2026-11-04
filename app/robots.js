import { CANONICAL_URL } from "@/lib/site";

// Preview deployments (Vercel previews) must not be indexed: they would show
// up in search as duplicates of the real site.
export default function robots() {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // "/cctv" alone would also block /cctv-cameras (robots rules match by
      // prefix), so block only the tool itself.
      disallow: ["/api/", "/auth/", "/account", "/cctv$", "/cctv/"],
    },
    sitemap: `${CANONICAL_URL}/sitemap.xml`,
  };
}
