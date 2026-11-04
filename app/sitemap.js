import { MODELS } from "@/lib/fov/cameraPages";
import { CANONICAL_URL } from "@/lib/site";

export default function sitemap() {
  const now = new Date();
  return [
    { url: CANONICAL_URL, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${CANONICAL_URL}/cctv-cameras`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...MODELS.map((m) => ({ url: `${CANONICAL_URL}/cctv-cameras/${m.slug}`, changeFrequency: "monthly", priority: 0.7 })),
    { url: `${CANONICAL_URL}/getting-started`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${CANONICAL_URL}/legal`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
