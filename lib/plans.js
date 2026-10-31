// FOV Pro plans as shown on the site. The amounts charged come from the
// Stripe prices (STRIPE_PRICE_ID_PRO_MONTHLY / _YEARLY); keep these labels
// in line with them.
export const PRO_PLANS = {
  monthly: { key: "monthly", label: "£19", amount: 19, per: "month", note: "Billed monthly.", interval: "month" },
  yearly: { key: "yearly", label: "£199", amount: 199, per: "year", note: "Billed yearly — about £16.58 a month.", interval: "year" },
};

export const isPlanKey = (k) => k === "monthly" || k === "yearly";
