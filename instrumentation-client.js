// Usage analytics (PostHog, EU cloud). Next.js runs this file in the browser
// before the site becomes interactive.
//
// Cookieless: `persistence: 'memory'` keeps the visitor ID in memory only, so
// nothing is written to cookies or local storage and no consent banner is
// needed. A reload or later visit counts as a new visitor.
//
// Production only, so local `npm run dev` sessions don't add noise. The FOV
// tool at /cctv is a separate static build with its own copy of this setup.
import posthog from "posthog-js";

if (process.env.NODE_ENV === "production") {
  try {
    posthog.init("phc_CMT42C68PBN3mGzXp7tw9RaZ9LuAwqWUwKqZNRwRcz7g", {
      api_host: "https://eu.i.posthog.com",
      defaults: "2025-05-24", // page views on client-side navigation too
      persistence: "memory",
      person_profiles: "identified_only",
      session_recording: { maskAllInputs: true },
    });
  } catch {
    // Analytics must never break the site.
  }
}
