import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { OPERATOR_NAME, TRADING_NAME, PRIVACY_EMAIL, LAST_UPDATED, PRIVACY_VERSION } from "@/lib/legal";

export const metadata = {
  title: "Privacy notice | Plot-LV",
  description: "What personal data Plot-LV collects, why, who processes it, how long it is kept and your rights.",
};

function Contact() {
  return PRIVACY_EMAIL ? (
    <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>
  ) : (
    <Link href="/#contact">the contact form on our website</Link>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <SiteNav links={[["Products", "/#products"], ["Terms", "/terms"], ["Contact", "/#contact"]]} />
      <main className="legal">
        <h1 className="display">Privacy notice</h1>
        <p className="legal-meta">Last updated {LAST_UPDATED} · version {PRIVACY_VERSION}</p>

        <div className="legal-summary">
          <h2>The short version</h2>
          <ul>
            <li>We collect only what we need to run your account: your name, email and (optionally) company.</li>
            <li>Your floor plans and FOV projects stay on your device. We never receive them.</li>
            <li>We only send marketing emails if you tick the box to say yes, and you can switch them off at any time.</li>
            <li>We don&apos;t sell your data, and we don&apos;t use tracking or advertising cookies.</li>
            <li>You can download or delete your data yourself from your account page.</li>
          </ul>
        </div>

        <h2>1. Who we are</h2>
        <p>
          This website and the Plot-LV tools are run by {OPERATOR_NAME}
          {OPERATOR_NAME !== TRADING_NAME ? ` (“${TRADING_NAME}”)` : ""}, referred to
          here as “we” or “us”. We are the controller of the personal data
          described in this notice, which means we decide how and why it is used.
        </p>
        <p>
          For any privacy question or request, contact us through <Contact />.
        </p>

        <h2>2. What we collect</h2>
        <table>
          <thead>
            <tr><th>When</th><th>What</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>You create an account</td>
              <td>Name, email address, company (optional) and password. Your password is stored only as a secure hash by our authentication provider; we can never see it.</td>
            </tr>
            <tr>
              <td>You use your account</td>
              <td>When you signed up and last signed in, which version of our terms you accepted, and your email-preference choices with the date and wording of each.</td>
            </tr>
            <tr>
              <td>You opt in to updates, or ask to hear about Flame</td>
              <td>Your email address and name on our mailing list.</td>
            </tr>
            <tr>
              <td>You send us a message</td>
              <td>Your email address and your message.</td>
            </tr>
            <tr>
              <td>You visit the website</td>
              <td>Anonymous, aggregated page-view statistics (no cookies, no individual profile), and anonymous usage events and session recordings showing how the site and FOV are used, such as pages visited, clicks and which tools are opened. Text you type into forms is masked and never recorded. Our hosting providers also keep short-lived technical logs, such as IP addresses, to run and secure the service.</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Your plans and projects are not collected.</strong> FOV runs in
          your web browser. Floor plans you open and projects you save stay on
          your computer and are never uploaded to us. FOV keeps some settings,
          such as custom presets, in your browser&apos;s own storage.
        </p>

        <h2>3. Why we use it, and our lawful basis</h2>
        <table>
          <thead>
            <tr><th>Purpose</th><th>Lawful basis (UK GDPR)</th></tr>
          </thead>
          <tbody>
            <tr><td>Creating and running your account, letting you sign in and use FOV</td><td>Contract: we need it to provide the service you asked for.</td></tr>
            <tr><td>Account and security emails, such as email confirmation, password resets and important changes to the service or these terms</td><td>Contract, and our legitimate interest in keeping accounts secure.</td></tr>
            <tr><td>Product updates and launch news by email</td><td>Your consent. We only send these if you ticked the box or asked to hear about Flame. You can withdraw consent at any time.</td></tr>
            <tr><td>Replying to messages you send us</td><td>Legitimate interests: answering your enquiry.</td></tr>
            <tr><td>Keeping the service secure, preventing abuse and keeping records of consent</td><td>Legitimate interests, and our legal obligations.</td></tr>
            <tr><td>Anonymous usage statistics and session recordings to improve the website and FOV</td><td>Legitimate interests. No personal profile is built.</td></tr>
          </tbody>
        </table>

        <h2>4. Who processes it for us</h2>
        <p>We use a small number of trusted service providers, who process data only on our instructions:</p>
        <ul>
          <li><strong>Supabase</strong>: account sign-in and the account database. Account data is stored in the European Union (Ireland).</li>
          <li><strong>Vercel</strong>: website hosting and anonymous page-view statistics (United States).</li>
          <li><strong>PostHog</strong>: anonymous usage analytics and session recordings, without cookies. Data is stored in the European Union (Germany).</li>
          <li><strong>Resend</strong>: sending emails and holding our mailing list (United States).</li>
        </ul>
        <p>
          Where a provider processes data outside the UK, the transfer is
          protected by safeguards recognised under UK law, such as the UK
          International Data Transfer Addendum to the EU standard contractual
          clauses, or the UK–US data bridge where the provider is certified.
        </p>
        <p>We never sell your personal data or share it for advertising.</p>

        <h2>5. How long we keep it</h2>
        <ul>
          <li><strong>Account data and consent records</strong>: for as long as your account exists. When you delete your account, they are deleted immediately from our live systems; provider backups are overwritten on their normal schedule.</li>
          <li><strong>Mailing list</strong>: until you unsubscribe. After that we keep only your email address marked as unsubscribed, so we never email you again by mistake. If you delete your account, we remove you from the list entirely.</li>
          <li><strong>Messages you send us</strong>: up to two years, then deleted.</li>
          <li><strong>Technical logs</strong>: kept by our hosting providers for a short period, usually days to weeks.</li>
        </ul>

        <h2>6. Your rights</h2>
        <p>Under UK data protection law you have the right to:</p>
        <ul>
          <li>access the personal data we hold about you;</li>
          <li>have inaccurate data corrected;</li>
          <li>have your data deleted;</li>
          <li>restrict or object to how we use it;</li>
          <li>receive your data in a portable format;</li>
          <li>withdraw consent to marketing at any time, without affecting anything sent before.</li>
        </ul>
        <p>
          You can do most of this yourself on your{" "}
          <Link href="/account">account page</Link>: switch product-update
          emails on or off, download your data, or delete your account. Every
          marketing email also has an unsubscribe link. For anything else,
          contact us through <Contact />. We&apos;ll respond within one month.
        </p>
        <p>
          If you&apos;re unhappy with how we handle your data, please tell us
          first. You also have the right to complain to the Information
          Commissioner&apos;s Office (ICO) at{" "}
          <a href="https://ico.org.uk/make-a-complaint/" target="_blank" rel="noopener noreferrer">ico.org.uk</a>{" "}
          or on 0303 123 1113.
        </p>

        <h2>7. Cookies and similar storage</h2>
        <p>
          We use only the cookies needed to keep you signed in (named{" "}
          <code>sb-…-auth-token</code>), plus one (<code>plv_guest</code>) that
          remembers if you chose to continue as a guest. They are strictly
          necessary for the service, so they don&apos;t need your consent. We don&apos;t use
          advertising or tracking cookies, and our usage statistics don&apos;t
          use cookies or local storage. FOV stores some settings in your browser&apos;s local
          storage, which never leaves your device.
        </p>

        <h2>8. Security</h2>
        <p>
          Connections to the site are encrypted. Passwords are hashed by our
          authentication provider. Database access is restricted so each
          account can read only its own records, and changes are made only
          through controlled functions.
        </p>

        <h2>9. Children</h2>
        <p>Plot-LV is a professional tool and isn&apos;t intended for anyone under 18.</p>

        <h2>10. Changes to this notice</h2>
        <p>
          If we change this notice, we&apos;ll update the date and version
          above. If a change materially affects how we use your data,
          we&apos;ll tell account holders by email before it takes effect.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
