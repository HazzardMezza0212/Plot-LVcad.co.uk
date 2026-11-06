// Founding member offer: seats left, from the Stripe coupon's redemption count. Pure, so it can be
// tested without Stripe. A coupon with no redemption cap, or a missing coupon, means no seats
// (fail closed), so an uncapped coupon can never sell founding prices past the 20 places.
export function foundingSeatsLeft(coupon) {
  if (!coupon || typeof coupon.max_redemptions !== "number") return 0;
  const used = typeof coupon.times_redeemed === "number" ? coupon.times_redeemed : 0;
  return Math.max(0, coupon.max_redemptions - used);
}
