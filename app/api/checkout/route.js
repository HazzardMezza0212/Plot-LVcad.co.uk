import Stripe from "stripe";
import { guardPublicPost } from "@/lib/publicForm";
import { isSameOrigin } from "@/lib/requestGuard";
import { handleCheckout } from "@/lib/stripe/checkout";
import { currentUser, subscriptionStateFor } from "@/lib/stripe/session";

// Pre-launch mode: keep this false in lockstep with PRO_LAUNCHED in lib/launch.js, so
// checkout can't be triggered even via a direct API call while the site is only open for
// interest registration. Flip both together on launch day. Both plans are subscriptions;
// there is no lifetime plan.
const CHECKOUT_ENABLED = false;

const deps = {
  enabled: CHECKOUT_ENABLED,
  priceIds: {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
    annual: process.env.STRIPE_PRICE_ID_ANNUAL,
  },
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  getStripe: () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null),
  getUser: currentUser,
  getSubscriptionState: subscriptionStateFor,
  guard: (request) =>
    guardPublicPost(request, { name: "checkout", limit: 10, windowMs: 60 * 60 * 1000, captcha: false }),
};

export function POST(request) {
  return handleCheckout(request, deps);
}
