// Checks the body of a FOV Pro checkout request. Both boxes are required: the business-use box
// and the terms box. Kept free of imports so tests can run it.
import { isPlanKey } from "./plans.js";

export const BUSINESS_USE_ERROR = "Please confirm you're buying for business use.";

export function validateProCheckoutBody(body) {
  if (!body || typeof body !== "object") return { error: "Bad request." };
  if (!isPlanKey(body.plan)) return { error: "Choose monthly or yearly." };
  if (body.businessUse !== true) return { error: BUSINESS_USE_ERROR };
  if (body.agreeTerms !== true) return { error: "Please agree to the terms to continue." };
  return { plan: body.plan };
}
