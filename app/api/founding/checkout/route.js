import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin } from "@/lib/requestGuard";
import { getStripe, isFoundingOpen, LIVEMODE, PRICE_ID, siteUrl, useAutomaticTax } from "@/lib/founding";
import { TERMS_VERSION } from "@/lib/legal";

// Start a Founding 20 checkout for the signed-in user.
//
// Safety:
// - Only signed-in users with a confirmed email can start one, and the
//   payment is tied to their user id, so Pro unlocks on the right account.
// - The browser sends nothing about price or plan: the price comes from
//   STRIPE_PRICE_ID_FOUNDING on the server.
// - A seat is held for 35 minutes (the Stripe page expires after 31), and the
//   database refuses to hold more than 20.
// - Nothing is granted here. Pro is switched on only by the Stripe webhook
//   once payment is confirmed.

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body, status = 200) => Response.json(body, { status, headers: NO_STORE });

export async function POST(request) {
  if (!isSameOrigin(request)) return json({ error: "Please use the button on plotlvcad.co.uk." }, 403);
  if (!isFoundingOpen) return json({ error: "Founding 20 isn't open yet." }, 403);

  const supabase = await createClient();
  const { data: { user } = {} } = supabase ? await supabase.auth.getUser() : {};
  if (!user) return json({ error: "Please log in first.", login: true }, 401);
  if (!user.email_confirmed_at) {
    return json({ error: "Please confirm your email address first (check your inbox), then try again." }, 403);
  }

  const admin = createAdminClient();
  const stripe = getStripe();

  const { data: seatId, error: reserveError } = await admin.rpc("founding_reserve", {
    p_user: user.id,
    p_livemode: LIVEMODE,
  });
  if (reserveError) {
    if (reserveError.message?.includes("FOUNDING_FULL")) {
      return json({ error: "All 20 Founding seats are taken. Join the waitlist instead.", full: true }, 409);
    }
    if (reserveError.message?.includes("FOUNDING_ALREADY_MEMBER")) {
      return json({ error: "You're already a Founding member.", member: true }, 409);
    }
    console.error("[founding] reserve failed", reserveError.message);
    return json({ error: "Couldn't start checkout just now. Please try again." }, 500);
  }

  // A returning member who cancelled before: reuse their Stripe customer so
  // their invoices stay in one place.
  const { data: previous } = await admin
    .from("founding_members")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .eq("livemode", LIVEMODE)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  const metadata = { kind: "founding", seat_id: String(seatId), user_id: user.id, terms_version: TERMS_VERSION };
  const base = siteUrl();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      client_reference_id: user.id,
      ...(previous?.stripe_customer_id
        ? { customer: previous.stripe_customer_id, customer_update: { address: "auto", name: "auto" } }
        : { customer_email: user.email }),
      metadata,
      subscription_data: { metadata },
      ...(useAutomaticTax ? { automatic_tax: { enabled: true } } : {}),
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      allow_promotion_codes: false,
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      custom_text: {
        submit: {
          message: `Your seat is held for 30 minutes. By subscribing you agree to the Founding 20 terms at ${base}/terms#founding, ask for Pro to start straight away, and understand payments are non-refundable. Cancel renewal any time from your account.`,
        },
      },
      success_url: `${base}/founding/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/founding?cancelled=1`,
    });

    await admin.rpc("founding_attach_checkout", { p_id: seatId, p_session: session.id });
    return json({ url: session.url });
  } catch (err) {
    console.error("[founding] Stripe checkout failed", err?.message);
    // Give the seat straight back rather than holding it for 35 minutes.
    await admin.from("founding_members").update({ status: "expired" }).eq("id", seatId).eq("status", "reserved");
    return json({ error: "Couldn't open the payment page just now. Please try again." }, 502);
  }
}
