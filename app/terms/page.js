import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { OPERATOR_NAME, TRADING_NAME, PRIVACY_EMAIL, LAST_UPDATED, TERMS_VERSION } from "@/lib/legal";

export const metadata = {
  title: "Terms of use | Plot-LV",
  description: "The terms for using the Plot-LV website, accounts and the free FOV preview.",
};

function Contact() {
  return PRIVACY_EMAIL ? (
    <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
  ) : (
    <Link href="/#contact">the contact form on our website</Link>
  );
}

export default function TermsPage() {
  return (
    <>
      <SiteNav links={[["Products", "/#products"], ["Privacy", "/privacy"], ["Contact", "/#contact"]]} />
      <main className="legal">
        <h1 className="display">Terms of use</h1>
        <p className="legal-meta">Last updated {LAST_UPDATED} · version {TERMS_VERSION}</p>

        <div className="legal-summary">
          <h2>The short version</h2>
          <ul>
            <li>FOV is a free preview of a design aid. It doesn&apos;t replace professional judgement.</li>
            <li>Founding 20 members pay £99 + VAT a year for FOV Pro, can cancel renewal at any time, and payments are not refunded except where the law requires (see section 3A).</li>
            <li>Its results are estimates, and its camera data hasn&apos;t been verified yet. Check anything important yourself.</li>
            <li>The service is provided as it is, and may change or stop during the preview.</li>
            <li>Your plans and projects stay on your device and remain yours.</li>
          </ul>
        </div>

        <h2>1. About these terms</h2>
        <p>
          These terms apply when you use the Plot-LV website, create an account
          or use the FOV preview. The service is run by {OPERATOR_NAME}
          {OPERATOR_NAME !== TRADING_NAME ? ` (“${TRADING_NAME}”)` : ""} (“we”,
          “us”). By creating an account you agree to these terms. Our{" "}
          <Link href="/privacy">privacy notice</Link> explains how we handle
          personal data.
        </p>

        <h2>2. Your account</h2>
        <ul>
          <li>Give accurate details, and keep your password private.</li>
          <li>Accounts are for one person. Don&apos;t share yours.</li>
          <li>You&apos;re responsible for activity on your account. Tell us promptly if you think someone else has used it.</li>
          <li>You can delete your account at any time from your account page.</li>
        </ul>

        <h2>3. The FOV preview</h2>
        <p>
          FOV is provided free of charge while it is in preview. We may add,
          change or remove features, limit access, or end the preview at any
          time. We aim to keep it available but can&apos;t promise it will
          always be available, uninterrupted or error-free. If we start
          charging, we&apos;ll tell you first. Nothing will be charged without
          your agreement.
        </p>

        <h2 id="founding">3A. Founding 20 membership (paid)</h2>
        <p>
          Founding 20 is a paid FOV Pro membership limited to 20 people. If
          you take a Founding seat:
        </p>
        <ul>
          <li><strong>Price.</strong> £99 a year plus VAT (£118.80 including VAT at 20%), charged yearly in advance by card through Stripe. We send a VAT invoice for each payment.</li>
          <li><strong>Price lock.</strong> Your price will not go up for as long as your membership continues without a break. If you cancel and rejoin later, the price at that time applies.</li>
          <li><strong>What you get.</strong> FOV Pro is in early access. You get each Pro feature on your account as it is released, starting with DXF (CAD) drawing import. The free features stay available. We can&apos;t promise release dates, and features may change as we build them with members&apos; feedback.</li>
          <li><strong>Renewal.</strong> Your membership renews automatically each year. We&apos;ll email you before each renewal.</li>
          <li><strong>Cancelling.</strong> You can cancel at any time from your account page (“Manage billing &amp; invoices”). Pro then stays on until the end of the year you&apos;ve paid for, and you won&apos;t be charged again.</li>
          <li><strong>Refunds.</strong> Payments are not refundable, except where we stop offering FOV Pro (below) or where the law requires a refund. Cancelling stops the next renewal; it does not refund the current year.</li>
          <li><strong>If you buy as a consumer.</strong> Pro starts as soon as you pay. At checkout you ask us to start straight away and agree that you lose your 14-day right to cancel once it has started. Your other legal rights as a consumer are not affected.</li>
          <li><strong>If we stop.</strong> If we stop offering FOV Pro, we&apos;ll give you at least 30 days&apos; notice and refund the unused part of your current year.</li>
          <li><strong>Accounts.</strong> Your seat belongs to your Plot-LV account and can&apos;t be transferred. Deleting your account cancels your membership.</li>
        </ul>
        <p>
          For paid members, the limit on our liability in section 8 is the
          amount you paid us in the 12 months before the claim (or £100 if
          that is more).
        </p>

        <h2>4. Using FOV&apos;s results</h2>
        <p>
          FOV is a design aid. Its coverage, field-of-view, pixel-density and
          DORI figures are estimates based on simplified geometry and on camera
          data that is marked as unverified while we check it against
          manufacturer datasheets. They can differ from real-world performance.
        </p>
        <p>You are responsible for:</p>
        <ul>
          <li>checking results against manufacturer data, site surveys and on-site testing;</li>
          <li>making sure designs meet the relevant standards, your client&apos;s requirements and the law, including data protection law that applies to CCTV systems;</li>
          <li>professional decisions made using FOV, which should not rely on FOV alone.</li>
        </ul>

        <h2>5. Your content</h2>
        <p>
          Floor plans and projects you use with FOV are processed in your own
          browser and are not uploaded to us. They remain yours. You are
          responsible for having the right to use any plans you open, and for
          keeping your own copies of saved project files.
        </p>

        <h2>6. Fair use</h2>
        <p>Please don&apos;t:</p>
        <ul>
          <li>try to get around sign-in, security or usage limits;</li>
          <li>interfere with or overload the service, or use automated tools to access it in bulk;</li>
          <li>copy, resell or rebrand the service or its camera library;</li>
          <li>use the service for anything unlawful.</li>
        </ul>
        <p>We may suspend or close accounts that break these terms.</p>

        <h2>7. Our rights</h2>
        <p>
          The Plot-LV software, website, branding and content belong to us or
          our licensors. While these terms apply, we give you a personal,
          non-transferable right to use FOV for your own work, including
          commercial projects.
        </p>

        <h2>8. Liability</h2>
        <p>
          Nothing in these terms limits or excludes liability for death or
          personal injury caused by negligence, for fraud or fraudulent
          misrepresentation, or for anything else that cannot be limited or
          excluded under the law of England and Wales.
        </p>
        <p>Subject to that:</p>
        <ul>
          <li>the preview is provided “as is” and “as available”, without warranties of any kind, to the extent the law allows;</li>
          <li>we are not liable for indirect or consequential loss, loss of profit, revenue, business, contracts, goodwill or data, or for loss arising from relying on FOV&apos;s results without checking them as set out in section 4;</li>
          <li>because the preview is free, our total liability to you for all claims connected with it is limited to £100.</li>
        </ul>
        <p>
          If you use FOV as a consumer rather than for business, you have legal
          rights that these terms do not affect.
        </p>

        <h2>9. Ending your use</h2>
        <p>
          You can stop using FOV and delete your account at any time. We may
          end your access if you break these terms, or when the preview ends.
          If we end the preview, we&apos;ll give account holders reasonable
          notice by email where we can.
        </p>

        <h2>10. Changes to these terms</h2>
        <p>
          We may update these terms. We&apos;ll change the date and version
          above, and tell account holders by email before significant changes
          take effect. If you keep using the service after that, the new terms
          apply.
        </p>

        <h2>11. Law</h2>
        <p>
          These terms are governed by the law of England and Wales. The courts
          of England and Wales have jurisdiction, but if you are a consumer
          living in Scotland or Northern Ireland you may also bring
          proceedings there.
        </p>

        <h2>12. Contact</h2>
        <p>Questions about these terms? Contact us through <Contact />.</p>
      </main>
      <SiteFooter />
    </>
  );
}
