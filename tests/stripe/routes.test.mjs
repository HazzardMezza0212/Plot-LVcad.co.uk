import { test } from "node:test";
import assert from "node:assert/strict";
import { handleCheckout } from "../../lib/stripe/checkout.js";
import { handlePortal } from "../../lib/stripe/portal.js";
import { USER, CUSTOMER } from "./helpers.mjs";

const SITE = "https://www.plotlvcad.co.uk";

// A stand-in Stripe client that records what it was asked to create. `liveCustomerStatuses`
// lists the subscription statuses Stripe reports for the customer (default: none).
function fakeStripe({ liveCustomerStatuses = [] } = {}) {
  const calls = { checkout: [], portal: [], lists: [] };
  return {
    calls,
    checkout: {
      sessions: {
        async create(params) {
          calls.checkout.push(params);
          return { url: "https://checkout.stripe.test/session_123" };
        },
      },
    },
    subscriptions: {
      async list(params) {
        calls.lists.push(params);
        const found = liveCustomerStatuses.includes(params.status);
        return { data: found ? [{ id: "sub_live", status: params.status }] : [] };
      },
    },
    billingPortal: {
      sessions: {
        async create(params) {
          calls.portal.push(params);
          return { url: "https://billing.stripe.test/portal_123" };
        },
      },
    },
  };
}

// Guard stand-in: returns the parsed body, like guardPublicPost does with captcha off.
const passGuard = async (request) => ({ body: await request.json() });

function checkoutDeps(overrides = {}) {
  const stripe = overrides.stripe ?? fakeStripe();
  return {
    enabled: true,
    getUser: async () => ({ id: USER, email: "buyer@example.co.uk" }),
    guard: passGuard,
    getStripe: () => stripe,
    getSubscriptionState: async () => null,
    priceIds: { monthly: "price_monthly_test", annual: "price_annual_test" },
    siteUrl: SITE,
    ...overrides,
    stripe,
  };
}

const post = (body) => new Request(`${SITE}/api/checkout`, { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });

test("checkout returns 503 and creates nothing when disabled", async () => {
  const deps = checkoutDeps({ enabled: false });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 503);
  assert.equal(deps.stripe.calls.checkout.length, 0);
});

test("checkout returns 401 when logged out", async () => {
  const deps = checkoutDeps({ getUser: async () => null });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 401);
  assert.equal(deps.stripe.calls.checkout.length, 0);
});

test("checkout returns 400 for an unknown plan", async () => {
  for (const plan of ["lifetime", "Monthly", "", "weekly"]) {
    const deps = checkoutDeps();
    const res = await handleCheckout(post({ plan }), deps);
    assert.equal(res.status, 400, `plan ${JSON.stringify(plan)}`);
    assert.equal(deps.stripe.calls.checkout.length, 0);
  }
});

test("checkout returns 400 when plan is missing or not a string", async () => {
  for (const body of [{}, { plan: 1 }, { plan: ["monthly"] }]) {
    const res = await handleCheckout(post(body), checkoutDeps());
    assert.equal(res.status, 400);
  }
});

test("checkout passes through a guard rejection", async () => {
  const guard = async () => ({ response: Response.json({ error: "Too many attempts." }, { status: 429 }) });
  const res = await handleCheckout(post({ plan: "monthly" }), checkoutDeps({ guard }));
  assert.equal(res.status, 429);
});

test("checkout for a new customer uses customer_email and the subscription parameters", async () => {
  const deps = checkoutDeps();
  const res = await handleCheckout(post({ plan: "annual" }), deps);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { url: "https://checkout.stripe.test/session_123" });

  const [p] = deps.stripe.calls.checkout;
  assert.equal(p.mode, "subscription");
  assert.deepEqual(p.line_items, [{ price: "price_annual_test", quantity: 1 }]);
  assert.equal(p.client_reference_id, USER);
  assert.equal(p.customer_email, "buyer@example.co.uk");
  assert.equal(p.customer, undefined);
  assert.equal(p.allow_promotion_codes, true);
  assert.deepEqual(p.consent_collection, { terms_of_service: "required" });
  assert.equal(p.custom_fields.length, 1);
  assert.equal(p.custom_fields[0].key, "company_or_trading_name");
  assert.equal(p.custom_fields[0].label.custom, "Company or trading name");
  assert.equal(p.custom_fields[0].optional, false);
  assert.equal(p.success_url, `${SITE}/account?upgraded=1`);
  assert.equal(p.cancel_url, `${SITE}/account`);
  assert.equal(p.subscription_data.metadata.user_id, USER);
});

test("checkout for a returning customer with only a cancelled subscription reuses the customer", async () => {
  const deps = checkoutDeps({
    getSubscriptionState: async () => ({ status: "canceled", stripe_customer_id: CUSTOMER }),
  });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 200);
  const [p] = deps.stripe.calls.checkout;
  assert.equal(p.customer, CUSTOMER);
  assert.equal(p.customer_email, undefined);
  assert.equal(p.line_items[0].price, "price_monthly_test");
});

test("checkout ignores client-supplied name and email", async () => {
  const deps = checkoutDeps();
  await handleCheckout(post({ plan: "monthly", email: "attacker@example.com", name: "x" }), deps);
  assert.equal(deps.stripe.calls.checkout[0].customer_email, "buyer@example.co.uk");
});

test("checkout returns 502 when Stripe refuses, without leaking the error", async () => {
  const stripe = fakeStripe();
  stripe.checkout.sessions.create = async () => {
    throw Object.assign(new Error("terms of service url not set"), { type: "StripeInvalidRequestError" });
  };
  const res = await handleCheckout(post({ plan: "monthly" }), checkoutDeps({ stripe }));
  assert.equal(res.status, 502);
  assert.deepEqual(await res.json(), { error: "Couldn't start checkout. Please try again." });
});

test("checkout returns 503 when the price for the plan is not configured", async () => {
  const res = await handleCheckout(post({ plan: "annual" }), checkoutDeps({ priceIds: { monthly: "price_m" } }));
  assert.equal(res.status, 503);
});

// One subscription per customer

test("checkout returns 409 when the entitlement row shows an active subscription", async () => {
  for (const status of ["active", "trialing", "past_due"]) {
    const deps = checkoutDeps({
      getSubscriptionState: async () => ({ status, stripe_customer_id: CUSTOMER }),
    });
    const res = await handleCheckout(post({ plan: "annual" }), deps);
    assert.equal(res.status, 409, status);
    assert.equal(deps.stripe.calls.checkout.length, 0);
  }
});

test("checkout returns 409 when Stripe shows a live subscription the row has not caught up with", async () => {
  const deps = checkoutDeps({
    stripe: fakeStripe({ liveCustomerStatuses: ["trialing"] }),
    getSubscriptionState: async () => ({ status: null, stripe_customer_id: CUSTOMER }),
  });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 409);
  assert.equal(deps.stripe.calls.checkout.length, 0);
  assert.ok(deps.stripe.calls.lists.every((l) => l.customer === CUSTOMER));
});

test("checkout is allowed when the only subscriptions are ended", async () => {
  const deps = checkoutDeps({
    stripe: fakeStripe({ liveCustomerStatuses: [] }),
    getSubscriptionState: async () => ({ status: "canceled", stripe_customer_id: CUSTOMER }),
  });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 200);
  assert.equal(deps.stripe.calls.checkout.length, 1);
});

test("the Stripe check is skipped for a brand-new customer with no subscriptions", async () => {
  const deps = checkoutDeps({ getSubscriptionState: async () => null });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 200);
  assert.equal(deps.stripe.calls.lists.length, 0);
});

test("a Stripe lookup failure returns 502 and creates nothing", async () => {
  const stripe = fakeStripe();
  stripe.subscriptions.list = async () => {
    throw Object.assign(new Error("network"), { type: "StripeConnectionError" });
  };
  const deps = checkoutDeps({
    stripe,
    getSubscriptionState: async () => ({ status: "canceled", stripe_customer_id: CUSTOMER }),
  });
  const res = await handleCheckout(post({ plan: "monthly" }), deps);
  assert.equal(res.status, 502);
  assert.equal(deps.stripe.calls.checkout.length, 0);
});

// Portal

const portalRequest = (origin = SITE) =>
  ({ headers: new Headers({ origin, host: "www.plotlvcad.co.uk" }) });

function portalDeps(overrides = {}) {
  const stripe = overrides.stripe ?? fakeStripe();
  return {
    isSameOrigin: (req) => req.headers.get("origin") === SITE,
    getUser: async () => ({ id: USER }),
    getStripeCustomerId: async () => CUSTOMER,
    getStripe: () => stripe,
    siteUrl: SITE,
    ...overrides,
    stripe,
  };
}

test("portal returns 401 when logged out", async () => {
  const res = await handlePortal(portalRequest(), portalDeps({ getUser: async () => null }));
  assert.equal(res.status, 401);
});

test("portal returns 404 when the user has no Stripe customer", async () => {
  const deps = portalDeps({ getStripeCustomerId: async () => null });
  const res = await handlePortal(portalRequest(), deps);
  assert.equal(res.status, 404);
  assert.equal(deps.stripe.calls.portal.length, 0);
});

test("portal returns 403 for a cross-site request", async () => {
  const res = await handlePortal(portalRequest("https://evil.example"), portalDeps());
  assert.equal(res.status, 403);
});

test("portal opens a billing session with return_url /account and returns its URL", async () => {
  const deps = portalDeps();
  const res = await handlePortal(portalRequest(), deps);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { url: "https://billing.stripe.test/portal_123" });
  assert.deepEqual(deps.stripe.calls.portal, [{ customer: CUSTOMER, return_url: `${SITE}/account` }]);
});
