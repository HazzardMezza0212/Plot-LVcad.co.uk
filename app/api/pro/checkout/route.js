import { createClient } from "@/lib/supabase/server";
import { isSameOrigin } from "@/lib/requestGuard";
import { getStripe, isProOpen, PRICE_IDS, useAutomaticTax, findCustomer, currentSubscription, FOUNDING_COUPON_ID, foundingSeatsLeftNow } from "@/lib/pro";
import { isPlanKey } from "@/lib/plans";
import { TERMS_VERSION } from "@/lib/legal";
import { originOf } from "@/lib/site";

// Start a FOV Pro checkout for the signed-in user.
//
// - Only signed-in users with a confirmed email can start one, and the
//   payment is tied to their user id, so Pro unlocks on the right account.
// - The browser only chooses "monthly" or "yearly"; the price comes from the
//   server's environment variables.
// - Both consent boxes (start now / agree to terms incl. auto-renewal) must
//   be ticked. What they agreed to, and when, is stored on the Stripe
//   checkout and subscription as evidence.
// - Nothing is granted here. Pro is switched on only by the Stripe webhook
//   once payment is confirmed.

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body, status = 200) => Response.json(body, { status, headers: NO_STORE });

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Please use the button on plotlvcad.co.uk." }, 403);
  if (!isProOpen) return json({ error: "FOV Pro checkout isn't open yet." }, 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  const { plan, startNow, agreeTerms } = body || {};
  if (!isPlanKey(plan)) return json({ error: "Choose monthly or yearly." }, 400);
  if (startNow !== true || agreeTerms !== true) {
    return json({ error: "Please tick both boxes to continue." }, 400);
  }

  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return json({ error: "Please log in first.", login: true }, 401);
  if (!user.email_confirmed_at) {
    return json({ error: "Please confirm your email address first (check your inbox), then try again." }, 403);
  }

  const stripe = getStripe();
  try {
    let customer = await findCustomer(stripe, user.id);
    if (customer && (await currentSubscription(stripe, customer.id))) {
      return json({ error: "You already have FOV Pro. Manage it from Plan & billing.", member: true }, 409);
    }
    if (!customer) {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || undefined,
        metadata: { user_id: user.id },
      });
    }

    const consentAt = new Date().toISOString();
    const metadata = {
      kind: "pro",
      plan,
      user_id: user.id,
      terms_version: TERMS_VERSION,
      consent_start_now: "yes",
      consent_terms_and_renewal: "yes",
      consent_at: consentAt,
    };
    const base = originOf(request);
    // Founding offer: yearly only, while places remain. Stripe doesn't allow a discount and
    // promotion codes on the same session, so a founding purchase can't stack another code.
    const founding = plan === "yearly" && (await foundingSeatsLeftNow(stripe)) > 0;
    if (founding) metadata.founding = "yes";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      customer_update: { address: "auto", name: "auto" },
      client_reference_id: user.id,
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      metadata,
      subscription_data: { metadata },
      ...(useAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      ...(founding ? { discounts: [{ coupon: FOUNDING_COUPON_ID }] } : { allow_promotion_codes: true }),
      custom_text: {
        submit: {
          message: `Renews every ${plan === "yearly" ? "year" : "month"} until you cancel. Cancel any time from your Plot-LV account. Terms: ${base}/legal#pro`,
        },
      },
      success_url: `${base}/account?pro=welcome#upgrade`,
      cancel_url: `${base}/account?upgrade=${plan}#upgrade`,
    });
    return json({ url: session.url });
  } catch (err) {
    console.error("[pro] checkout failed", err?.message);
    return json({ error: "Couldn't open the payment page just now. Please try again." }, 502);
  }
}
