import Stripe from "stripe";
import { getLicenseBySession } from "@/lib/licenseDb";

// The webhook writes the licence to Postgres moments after payment — poll
// briefly rather than racing it.
async function waitForLicense(sessionId) {
  let license = await getLicenseBySession(sessionId);
  for (let i = 0; i < 6 && !license; i++) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    license = await getLicenseBySession(sessionId);
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

  if (!process.env.STRIPE_SECRET_KEY || !process.env.DATABASE_URL) {
    return (
      <main className="statusPage">
        <p>This deployment isn&apos;t fully configured yet (Stripe/database missing).</p>
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
        We&apos;ve also emailed it to {license.email}. Your licence covers 2 machines.
      </p>
      <a href="/downloads/plot-lv-flame-v1.0-setup.exe" download className="btn-primary">
        Download Flame v1.0
      </a>
    </main>
  );
}
