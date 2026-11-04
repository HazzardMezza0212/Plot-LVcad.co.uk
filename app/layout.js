import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import { Analytics } from "@vercel/analytics/next";
import ConsentBanner from "@/components/site/ConsentBanner";
import { CANONICAL_URL } from "@/lib/site";
import "./globals.css";
import "./site.css";

// Fonts are self-hosted from npm packages (no request to Google at runtime):
// Geist for text, Geist Mono for labels, Bricolage Grotesque for headings.

export const metadata = {
  metadataBase: new URL(CANONICAL_URL),
  title: {
    default: "Plot-LV FOV — free CCTV field of view calculator & layout planner",
    template: "%s | Plot-LV",
  },
  description:
    "Plan CCTV cameras on your own floor plan. See each camera's field of view, pixel density and DORI levels, clipped by walls. Free in your browser; FOV Pro adds DXF import and client reports.",
  openGraph: {
    siteName: "Plot-LV",
    type: "website",
    locale: "en_GB",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport = {
  themeColor: "#F4F5F7",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-GB" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        {children}
        <ConsentBanner />
        <Analytics />
      </body>
    </html>
  );
}
