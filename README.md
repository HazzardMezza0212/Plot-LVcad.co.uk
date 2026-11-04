This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stripe (FOV Pro)

Checkout is off until launch (`CHECKOUT_ENABLED` in `app/api/checkout/route.js`). Keep it `false` in lockstep with `lib/launch.js` and the landing page. Use test-mode keys (`sk_test_…`, `price_…` from test mode) in development.

Routes:

- `POST /api/checkout`: starts a subscription Checkout session (`plan` = `monthly` | `annual`). It grants no access.
- `POST /api/stripe/webhook`: verifies the signature on the raw body, then writes `public.entitlements`. Access is granted only here.
- `POST /api/stripe/portal`: opens the Billing Portal for the signed-in user.

Forward webhooks to your local server with the Stripe CLI (it prints a `whsec_…` signing secret; put that in `.env.local` as `STRIPE_WEBHOOK_SECRET`):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Send test events. Events from `stripe trigger` carry no Plot-LV user, so the webhook acknowledges them and writes nothing. To test real entitlement changes, complete a test checkout (or replay a real event with `stripe events resend <evt_id>`):

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_failed
```

Run the unit tests (no network, no Stripe account needed):

```bash
npm test
```

Migration: `supabase/migrations/20261104_stripe_subscriptions.sql` adds the Stripe columns to `entitlements`. Apply it to the Plot-LV project before the webhook goes live.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
