# 2026-11 redesign — preview testing

Branch: `redesign-2026-11`. Nothing here is live until it is merged into `main`.

## What changed

- New design for the public pages: home `/`, camera library `/cctv-cameras` and
  each model page, `/getting-started`, `/legal` (privacy, terms, Pro terms,
  cookies, company details), 404. Older account and sign-in pages pick up the
  new colours and fonts through `globals.css` tokens.
- Pages removed and permanently redirected (`next.config.mjs`):
  `/cctv-field-of-view-calculator` → `/`, `/flame` → `/`,
  `/guides/how-to-calculate-cctv-field-of-view` → `/cctv-cameras#dori`,
  `/privacy` → `/legal#privacy`, `/terms` → `/legal#terms`.
- Canonical links, sitemap and robots now always use
  `https://www.plotlvcad.co.uk` (they were `http://localhost:3000` on the live
  site). Preview deployments tell search engines not to index them.
- Analytics (PostHog) only starts after the visitor accepts it in the consent
  banner. "Cookie settings" in every footer reopens it.
- FOV Pro: £19/month or £199/year through Stripe Checkout, two required consent
  boxes, Stripe's billing portal for cancel / change card / invoices, and a
  webhook that switches Pro on and off in `public.entitlements`. Deleting an
  account cancels any live Pro subscription first.
- Includes the `security-hardening` branch (entitlements route, custom
  cameras, Turnstile, 18+ check). The `founding-20` branch is not included;
  the new Pro checkout replaces it (no real Founding members existed).
- Fonts are self-hosted from npm (Geist, Geist Mono, Bricolage Grotesque).

No database changes are needed: every table and function used is already in
the Plot-LV Supabase project.

## Vercel settings for the Preview environment

Vercel → Project → Settings → Environment Variables, scope **Preview**:

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same as production (if not already set for Preview) |
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → secret key |
| `STRIPE_SECRET_KEY` | **test mode** key, `sk_test_…` |
| `STRIPE_PRICE_ID_PRO_MONTHLY` | test-mode price `price_…` for £19 / month |
| `STRIPE_PRICE_ID_PRO_YEARLY` | test-mode price `price_…` for £199 / year |
| `STRIPE_PRO_WEBHOOK_SECRET` | `whsec_…` from the test webhook below |
| `PRO_CHECKOUT_ENABLED` | `1` |

Redeploy the preview after changing variables. While anything is missing, the
account page lists the missing names (preview builds only).

## Stripe test mode setup (once)

1. Stripe dashboard → switch on **Test mode**.
2. Product catalogue → add product "FOV Pro" with two recurring prices:
   £19 monthly and £199 yearly. Copy both `price_…` IDs.
3. Developers → Webhooks → add endpoint
   `https://<your-preview-url>/api/stripe/webhook` with events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `customer.subscription.updated`, `customer.subscription.deleted`.
   Copy the signing secret.
4. Settings → Billing → Customer portal: allow cancelling, switching between
   the two prices, updating payment methods and viewing invoices.
5. Settings → Billing → Subscriptions and emails: turn on emails about
   upcoming renewals (the terms promise a reminder before yearly renewals).

**Vercel Deployment Protection** blocks Stripe from reaching a preview URL.
Either turn protection off for previews while testing, or add a "Protection
Bypass for Automation" secret and append `?x-vercel-protection-bypass=<secret>`
to the webhook URL.

## Test checklist

- [ ] Home: intro plays once per session; 3D stack; buttons; Monthly/Yearly toggle
- [ ] Consent banner: Reject / Manage / Accept; "Cookie settings" reopens it
- [ ] Camera library: search, brand filter, sort; a model page; lens switch; distance slider
- [ ] "Open the planner" and "Plan this camera" open `/cctv` as a guest
- [ ] Old URLs redirect (`/flame`, `/privacy`, `/terms`, `/cctv-field-of-view-calculator`)
- [ ] Sign up, log in, account page shows the FOV Pro panel
- [ ] Buy Pro (yearly) with card `4242 4242 4242 4242`; back on the account page Pro shows within seconds
- [ ] "Plan & billing" opens Stripe's portal; cancel; Pro stays until period end
- [ ] Delete a test account that has Pro: subscription is cancelled in Stripe
- [ ] Phone check: no sideways scrolling, menus usable

## Going live before Pro is ready

The site can replace the live one now with Pro shown as "coming soon":
leave `NEXT_PUBLIC_PRO_LIVE` and `PRO_CHECKOUT_ENABLED` unset in Production.
The Pro box then shows a "Tell me when it launches" form (saved to the
existing `pro_early_access` table) instead of a buy button, and checkout is
refused. On launch day: set the live Stripe settings and both switches to `1`
in Production, then redeploy.

For testing payments on a preview, set `NEXT_PUBLIC_PRO_LIVE=1` in the Preview
scope too, so the home page shows the buy buttons.

## Still to do before replacing the live site

- Fill in the `[BRACKETED]` values in `lib/legal.js` (company details, ICO number,
  VAT wording, reply time) and the refund / retention placeholders on `/legal`.
- The planner at `/cctv` is a separate build: it starts PostHog without asking,
  and does not yet read `?camera=<id>`. Both need a change in the FOV repo.
- Switch to live Stripe keys and prices, and a live webhook to
  `https://www.plotlvcad.co.uk/api/stripe/webhook`, for production only.
