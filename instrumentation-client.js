// Runs in the browser before the site becomes interactive.
// Analytics only starts if the visitor has already accepted it in the
// consent banner on an earlier visit. A first-time visitor is asked first
// (components/site/ConsentBanner.js starts it if they say yes).
import { readConsent, startAnalytics } from "@/lib/posthog";

if (readConsent()?.analytics === true) startAnalytics();
