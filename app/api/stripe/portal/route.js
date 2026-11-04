import Stripe from "stripe";
import { isSameOrigin } from "@/lib/requestGuard";
import { handlePortal } from "@/lib/stripe/portal";
import { currentUser, stripeCustomerIdFor } from "@/lib/stripe/session";

// Opens the Stripe Billing Portal for the signed-in user's own subscription.
export async function POST(request) {
  return handlePortal(request, {
    isSameOrigin,
    getUser: currentUser,
    getStripeCustomerId: stripeCustomerIdFor,
    getStripe: () => (process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null),
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  });
}
