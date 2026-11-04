import posthog from "posthog-js";

// Usage analytics (PostHog, EU cloud). Only started once the visitor has
// said yes in the consent banner (see components/site/ConsentBanner.js).
//
// Even when on, it is cookieless: `persistence: 'memory'` keeps the visitor
// ID in memory only, so nothing is written to cookies or local storage.
//
// Production only, so local `npm run dev` sessions don't add noise.

export const CONSENT_KEY = "plv_consent";
const IGNORE_FLAG = "plv_ignore_me";

/** The visitor's saved choice: { analytics: boolean, at: string } or null. */
export function readConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ analytics: Boolean(analytics), at: new Date().toISOString(), v: 1 }));
  } catch {
    // Private mode etc. The banner will simply ask again next time.
  }
}

// "Ignore my visits": open any page with ?me=1 once on a device and analytics
// stays off there (?me=0 turns it back on). The FOV tool at /cctv reads the same flag.
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

export function startAnalytics() {
  if (process.env.NODE_ENV !== "production" || isIgnoredDevice()) return;
  try {
    if (posthog.__loaded) {
      posthog.opt_in_capturing();
      return;
    }
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

export function stopAnalytics() {
  try {
    if (posthog.__loaded) posthog.opt_out_capturing();
  } catch {
    // ignore
  }
}
