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

// "Ignore my visits": open any page with ?me=1 once on a device and analytics
// stays off there (?me=0 turns it back on). Stored as a flag in that browser's
// local storage; the FOV tool at /cctv reads the same flag.
const IGNORE_FLAG = "plv_ignore_me";
function isIgnoredDevice() {
  try {
    const me = new URLSearchParams(window.location.search).get("me");
    if (me === "1") localStorage.setItem(IGNORE_FLAG, "1");
    if (me === "0") localStorage.removeItem(IGNORE_FLAG);
    return localStorage.getItem(IGNORE_FLAG) === "1";
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV === "production" && !isIgnoredDevice()) {
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
