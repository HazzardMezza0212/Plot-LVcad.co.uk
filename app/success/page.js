import Stripe from "stripe";
import { getLicense } from "@/lib/licenseStore";

// The webhook issues the key asynchronously — usually near-instant, but give
// it a moment before giving up rather than racing it.
async function waitForLicense(sessionId) {
  let license = getLicense(sessionId);
  for (let i = 0; i < 6 && !license; i++) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    license = getLicense(sessionId);
  }
  return license;
}

export default async function SuccessPage({ searchParams }) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="statusPage">
        <p>No checkout session found. If you just paid, check your email for your licence key.</p>
      </main>
    );
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return (
      <main className="statusPage">
        <p>Stripe isn&apos;t configured yet on this deployment.</p>
      </main>
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return (
      <main className="statusPage">
        <p>Payment not confirmed yet. Refresh in a few seconds.</p>
      </main>
    );
  }

  const license = await waitForLicense(sessionId);

  if (!license) {
    return (
      <main className="statusPage">
        <p>Payment received — your licence key is being issued. Refresh this page in a moment.</p>
      </main>
    );
  }

  return (
    <main className="statusPage">
      <h1 className="display">Payment received</h1>
      <div className="key-box">
        <span className="mono">{license.key}</span>
      </div>
      <p className="key-note">
        Save this key somewhere safe — you&apos;ll need it the first time you open Flame.
      </p>
      <a href="/downloads/plot-lv-flame-v1.0-setup.exe" download className="btn-primary">
        Download Flame v1.0
      </a>
    </main>
  );
}
