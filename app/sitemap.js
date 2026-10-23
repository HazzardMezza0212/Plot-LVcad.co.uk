import { MODELS } from "@/lib/fov/cameraPages";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap() {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/cctv-field-of-view-calculator`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/flame`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/cctv-cameras`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...MODELS.map((m) => ({
      url: `${siteUrl}/cctv-cameras/${m.slug}`,
      changeFrequency: "monthly",
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/guides/how-to-calculate-cctv-field-of-view`,
      lastModified: new Date("2026-10-23"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
