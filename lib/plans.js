// FOV Pro plans as shown on the site. The amounts charged come from the
// Stripe prices (STRIPE_PRICE_ID_PRO_MONTHLY / _YEARLY); keep these labels
// in line with them.
export const PRO_PLANS = {
  monthly: { key: "monthly", label: "£19", amount: 19, per: "month", note: "Billed monthly.", interval: "month" },
  yearly: { key: "yearly", label: "£190", amount: 190, per: "year", note: "Billed yearly, about £15.83 a month.", interval: "year" },
};

// Founding members pay this for their first year on the yearly plan, then the normal yearly price.
// The discount is a Stripe coupon (STRIPE_FOUNDING_COUPON_ID) limited to FOUNDING_PLACES redemptions.
export const FOUNDING = { firstYear: 99, places: 20 };

// What a year of monthly billing costs more than the yearly plan, for the "Save £x" badge.
export const YEARLY_SAVING = PRO_PLANS.monthly.amount * 12 - PRO_PLANS.yearly.amount;

export const isPlanKey = (k) => k === "monthly" || k === "yearly";

// Launch switch for the public pages. Until NEXT_PUBLIC_PRO_LIVE is "1", the
// site shows FOV Pro as "coming soon" with a notify-me form instead of a buy
// button. (Checkout itself is separately switched by PRO_CHECKOUT_ENABLED, so
// a preview can test paying from the account page before launch.)
// NEXT_PUBLIC_ values are fixed at build time: redeploy after changing it.
export const PRO_LIVE = process.env.NEXT_PUBLIC_PRO_LIVE === "1";
