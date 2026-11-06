// Links that take a signed-out visitor from the pricing card to the FOV Pro upgrade panel on
// /account, keeping the plan they picked. Pure, so tests can run it.
import { isPlanKey } from "./plans.js";

const planOf = (plan) => (isPlanKey(plan) ? plan : "yearly");

/** Where the upgrade panel lives, with the chosen plan preselected. */
export function upgradePath(plan) {
  return `/account?upgrade=${planOf(plan)}#upgrade`;
}

/** New visitors: sign up first. The confirmation email brings them back to the upgrade panel. */
export function signupHref(plan) {
  return `/signup?plan=${planOf(plan)}`;
}

/** Existing accounts: log in, then straight to the upgrade panel. */
export function loginHref(plan) {
  return `/login?next=${encodeURIComponent(upgradePath(plan))}`;
}

/** Where the sign-up confirmation link should land: the upgrade panel if a plan was picked. */
export function signupNextPath(plan) {
  return isPlanKey(plan) ? `/account?welcome=1&upgrade=${plan}#upgrade` : "/account?welcome=1";
}
