import posthog from "posthog-js";

// Send a PostHog event. Does nothing until instrumentation-client.js has set
// PostHog up (production only), and never throws.
//
// Pass { beforeLeaving: true } when the page is about to navigate away, so the
// browser still delivers the event after the page unloads.
export function track(event, props, { beforeLeaving = false } = {}) {
  try {
    if (!posthog.__loaded) return;
    posthog.capture(event, props, beforeLeaving ? { transport: "sendBeacon" } : undefined);
  } catch {
    // Analytics must never break the site.
  }
}
