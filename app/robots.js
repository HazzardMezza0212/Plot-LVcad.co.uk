const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // "/cctv" alone would also block /cctv-field-of-view-calculator and
      // /cctv-cameras (robots rules match by prefix), so block only the tool.
      disallow: ["/api/", "/auth/", "/account", "/cctv$", "/cctv/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
