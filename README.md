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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Stripe (FOV Pro)

FOV Pro checkout is off until launch. It stays off unless `PRO_CHECKOUT_ENABLED=1` is set, and on the production site it also needs `NEXT_PUBLIC_PRO_LIVE=1`. Use test-mode keys (`sk_test_…` and test-mode price IDs) for previews.

Routes:

- `POST /api/pro/checkout`: starts a subscription Checkout session (`plan` = `monthly` | `yearly`). It grants nothing.
- `POST /api/stripe/webhook`: verifies the signature on the raw body and is the only place Pro is switched on or off. It reads each subscription fresh from Stripe. Events from the other mode (test vs live) are ignored.
- `POST /api/pro/portal`: opens the Billing Portal for the signed-in user.

Pro after a failed payment: a `past_due` subscription keeps Pro for 7 days from the first update that reports it, then Pro switches off. Retries don't extend the window. The rule is in `lib/stripe/entitlement.js` and is tested by `npm test`.

Forward webhooks to your local server with the Stripe CLI. It prints a `whsec_…` signing secret, which goes in `.env.local`:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Subscribe the endpoint to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated` and `customer.subscription.deleted`. Events from `stripe trigger` carry no Plot-LV user, so the webhook acknowledges them and writes nothing. To test real changes, complete a test checkout, or replay an event with `stripe events resend <evt_id>`.

Run the unit tests, which need no network or Stripe account:

```bash
npm test
```

Migration `supabase/migrations/20261104_stripe_subscriptions.sql` adds the `status`, `current_period_end` and `grace_until` columns to `entitlements`. Apply it before the grace rule goes live.
