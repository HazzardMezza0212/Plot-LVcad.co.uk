import Link from "next/link";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import {
  OPERATOR_NAME, OPERATOR_LABEL, TRADING_NAME, BUSINESS_ADDRESS, VAT_NUMBER, ICO_NUMBER, PRIVACY_EMAIL,
  SUPPORT_REPLY_TIME, LAST_UPDATED, TERMS_VERSION, PRIVACY_VERSION, VAT_NOTE,
} from "@/lib/legal";
import { PRO_PLANS, PRO_LIVE } from "@/lib/plans";

export const metadata = {
  title: "Privacy, terms and cookies",
  description: "How Plot-LV handles your data, the terms for using Plot-LV FOV and FOV Pro, the cookies we set, and who runs the site.",
  alternates: { canonical: "/legal" },
};

const Mail = () => <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>;

export default function LegalPage() {
  return (
    <div className="v2">
      <div className="wrap">
        <Header />
        <h1 className="pageh disp" style={{ marginTop: 40 }}>The small print,<br />in plain English.</h1>
        <p className="lede-l">
          How we handle your data, the terms for using Plot-LV FOV and FOV Pro, and the cookies we set. Last updated {LAST_UPDATED}.
        </p>

        <div className="lay">
          <nav className="toc" aria-label="On this page">
            <a href="#privacy">Privacy notice</a>
            <a href="#terms">Terms of use</a>
            <a href="#pro">FOV Pro subscriptions</a>
            <a href="#cookies">Cookies</a>
            <a href="#company">Business details</a>
            <Link href="/getting-started#support">Support</Link>
          </nav>

          <div className="docbody">
            {/* ------------------------------------------------ PRIVACY */}
            <section className="sec" id="privacy">
              <span className="kicker">Privacy notice · version {PRIVACY_VERSION}</span>
              <h2 className="disp">Your data.</h2>
              <div className="callout">
                <b>The short version</b>
                <p>
                  Your floor plans are opened and processed in your browser and never uploaded to us. We hold only what we need
                  to run your account and your Pro subscription. We don&apos;t sell your data, and analytics only run if you say yes.
                </p>
              </div>

              <h3>Who we are</h3>
              <p>
                This website and the Plot-LV tools are run by {OPERATOR_LABEL} (&ldquo;we&rdquo;, &ldquo;us&rdquo;), the controller of
                the personal data described here.
                {ICO_NUMBER ? <> We are registered with the Information Commissioner&apos;s Office, registration no. {ICO_NUMBER}.</> : null}{" "}
                For any privacy question or request, email <Mail />.
              </p>

              <h3>What we collect and why</h3>
              <div className="tw"><table className="t">
                <thead><tr><th scope="col">When</th><th scope="col">What</th><th scope="col">Why · lawful basis</th></tr></thead>
                <tbody>
                  <tr><td>You create an account</td><td>Name, email, company (optional), password (stored only as a secure hash by our sign-in provider), confirmation you&apos;re 18 or over, and which terms you accepted</td><td>To run your account · contract</td></tr>
                  <tr><td>You buy FOV Pro</td><td>Your plan, subscription status, invoices and billing address, and the consent choices you made at checkout. Card details are taken and held by Stripe, never by us</td><td>To provide Pro and keep tax records · contract; legal obligation</td></tr>
                  <tr><td>You opt in to updates</td><td>Your email and name on our mailing list, and a record of your choice</td><td>Product update emails · consent (withdraw any time)</td></tr>
                  <tr><td>You join early access or message us</td><td>Your email, and anything you choose to tell us</td><td>To reply or contact you about what you asked · legitimate interests</td></tr>
                  <tr><td>You say yes to analytics</td><td>Anonymous usage events and session recordings (pages, clicks, tools opened). Text typed into forms is masked</td><td>To improve the site and FOV · consent</td></tr>
                  <tr><td>You visit the website</td><td>Anonymous, aggregated page-view counts (no cookies), and short-lived technical logs such as IP addresses</td><td>To run and secure the service · legitimate interests</td></tr>
                  <tr><td>You submit a form</td><td>A bot check by Cloudflare Turnstile</td><td>To stop spam and abuse · legitimate interests</td></tr>
                </tbody>
              </table></div>
              <p><b>Your plans and projects are not collected.</b> FOV runs in your web browser. Floor plans you open and projects you save stay on your computer.</p>

              <h3>Who processes it for us</h3>
              <ul>
                <li><b>Supabase</b> — accounts, sign-in and the account database (EU, Ireland)</li>
                <li><b>Stripe</b> — payments, subscriptions and invoices</li>
                <li><b>Vercel</b> — website hosting and anonymous page-view counts (US)</li>
                <li><b>PostHog</b> — analytics and session recordings, only with your consent (EU, Germany)</li>
                <li><b>Resend</b> — sending emails and holding our mailing list (US)</li>
                <li><b>Cloudflare</b> — Turnstile bot checks on forms</li>
              </ul>
              <p>
                Where a provider processes data outside the UK, the transfer is protected by safeguards recognised under UK law,
                such as the UK International Data Transfer Addendum or the UK–US data bridge where the provider is certified.
                We never sell your personal data or share it for advertising.
              </p>

              <h3>How long we keep it</h3>
              <ul>
                <li>Account data and consent records: while your account exists. Deleting your account removes them from our live systems straight away; provider backups roll over on their normal schedule.</li>
                <li>Billing records: 6 years, as HMRC requires, even if you delete your account.</li>
                <li>Mailing list: until you unsubscribe; after that only your address, marked unsubscribed, so we never email you by mistake.</li>
                <li>Messages you send us: up to two years.</li>
                <li>Analytics events and session recordings: up to 12 months. Technical logs: days to weeks, held by our hosting providers.</li>
              </ul>

              <h3>Your rights</h3>
              <p>
                You can ask to access, correct, delete or export your data, restrict or object to how we use it, and withdraw
                consent at any time. Most of this you can do yourself on your <Link href="/account">account page</Link>:
                email preferences, downloading your data, and deleting your account. For anything else email <Mail />; we&apos;ll
                reply within one month. If you&apos;re unhappy with how we handle your data, please tell us first. You can also
                complain to the ICO at <a href="https://ico.org.uk/make-a-complaint/">ico.org.uk</a> or on 0303 123 1113.
              </p>

              <h3>Security and children</h3>
              <p>
                Connections are encrypted, passwords are hashed by our sign-in provider, and each account can read only its own
                records. Plot-LV is a professional tool and isn&apos;t intended for anyone under 18.
              </p>
            </section>

            {/* ------------------------------------------------ TERMS */}
            <section className="sec" id="terms">
              <span className="kicker">Terms of use · version {TERMS_VERSION}</span>
              <h2 className="disp">Using Plot-LV FOV.</h2>
              <div className="callout">
                <b>You are the designer</b>
                <p>
                  FOV is a design aid. It does the calculation and the paperwork; it does not approve designs. You stay responsible
                  for every design you produce with it, and for checking camera data, coverage and pixel density against
                  manufacturers&apos; datasheets, the site and your client&apos;s requirements before you rely on them.
                </p>
              </div>

              <h3>1. About these terms</h3>
              <p>
                These terms apply when you use this website, the free FOV planner or FOV Pro. The service is run by{" "}
                {OPERATOR_LABEL}. By opening the planner, creating an account or buying Pro, you agree to them.
              </p>
              <h3>2. Your account</h3>
              <p>
                Give accurate details and keep your password private. Accounts, and Pro subscriptions, are for one person; contact
                us for multi-seat pricing. You can delete your account at any time from your account page.
              </p>
              <h3>3. The free planner</h3>
              <p>
                The free version is provided at no charge. We may add, change or remove features. We aim to keep it available but
                can&apos;t promise it will always be uninterrupted or error-free.
              </p>
              <h3>4. Using FOV&apos;s results</h3>
              <p>
                Coverage, field of view, pixel density and DORI figures are estimates based on simplified geometry and published
                camera data, some of which has not yet been checked against the manufacturer&apos;s datasheet (each camera page
                says which). They don&apos;t account for lens distortion, lighting, compression or sensor noise, and can differ from
                real-world performance. Check results against manufacturer data, site surveys and on-site testing, and make sure
                designs meet the relevant standards, your client&apos;s requirements and the law, including data protection law
                that applies to CCTV.
              </p>
              <h3>5. Your content</h3>
              <p>
                Plans and projects are processed in your browser and are not uploaded to us. They remain yours. You&apos;re
                responsible for having the right to use any plans you open, and for keeping your own copies of saved projects.
              </p>
              <h3>6. Fair use</h3>
              <p>
                Don&apos;t try to get around sign-in, security, payment or usage limits; interfere with or overload the service;
                copy, resell or rebrand the service or its camera library; or use it for anything unlawful. We may suspend or
                close accounts that break these terms.
              </p>
              <h3>7. Our rights</h3>
              <p>
                The software, website, branding and camera library belong to us or our licensors. While these terms apply, you may
                use FOV for your own work, including commercial projects.
              </p>
              <h3>8. Liability</h3>
              <p>
                Nothing here limits liability for death or personal injury caused by negligence, for fraud, or for anything else
                that can&apos;t be limited under the law of England and Wales. Subject to that, the service is provided &ldquo;as
                is&rdquo;; we&apos;re not liable for indirect or consequential loss, loss of profit, business or data, or for loss
                from relying on FOV&apos;s results without checking them as set out in section 4. Our total liability is limited to
                the greater of £100 and what you paid us in the 12 months before the claim. If you are a consumer, you have legal
                rights these terms don&apos;t affect.
              </p>
              <h3>9. Changes and law</h3>
              <p>
                We may update these terms. We&apos;ll change the version above and tell account holders by email before significant
                changes take effect. These terms are governed by the law of England and Wales, whose courts have jurisdiction; if
                you are a consumer in Scotland or Northern Ireland you may also bring proceedings there.
              </p>
            </section>

            {/* ------------------------------------------------ PRO */}
            <section className="sec" id="pro">
              <span className="kicker">FOV Pro subscriptions</span>
              <h2 className="disp">Paying for Pro.</h2>
              {!PRO_LIVE && <p className="l">FOV Pro isn&apos;t on sale yet. These terms will apply once it launches.</p>}
              <ul>
                <li>FOV Pro costs {PRO_PLANS.monthly.label} a month or {PRO_PLANS.yearly.label} a year. {VAT_NOTE}. The price you pay is shown before you confirm.</li>
                <li>Payment is taken by Stripe. Pro switches on as soon as payment is confirmed.</li>
                <li>Your subscription renews automatically at the end of each month or year until you cancel. Before each yearly renewal we&apos;ll email you the date and amount.</li>
                <li>Cancel any time from <b>Plan &amp; billing</b> on your account page. You keep Pro until the end of the period you&apos;ve paid for, and no further payments are taken.</li>
                <li>
                  <b>If you buy as a consumer</b> you have 14 days to cancel. At checkout you ask for Pro to start straight away;
                  if you then cancel within the 14 days, we refund what you paid minus the value of the days you&apos;ve used.
                </li>
                <li>
                  <b>Refunds.</b> Monthly payments aren&apos;t refunded for a part-used month. If a yearly plan renews and you
                  didn&apos;t mean it to, tell us within 14 days of the renewal payment and we&apos;ll refund it in full.
                  Otherwise we don&apos;t refund part-used years, but cancelling stops the next renewal. If Pro doesn&apos;t work as
                  described and we can&apos;t fix it, we&apos;ll refund the unused part of what you paid. None of this affects your
                  legal rights.
                </li>
                <li>We&apos;ll give you at least 30 days&apos; notice of a price change, and you can cancel before it applies.</li>
                <li>If a payment fails, Stripe will retry it. If it still can&apos;t be taken, your account moves back to the free version.</li>
              </ul>
            </section>

            {/* ------------------------------------------------ COOKIES */}
            <section className="sec" id="cookies">
              <span className="kicker">Cookies and similar storage · PECR</span>
              <h2 className="disp">Cookies.</h2>
              <p>
                We only use what&apos;s needed to run the site unless you say yes to analytics. You can change your choice at any
                time with <b>Cookie settings</b> in the footer of every page.
              </p>
              <div className="tw"><table className="t">
                <thead><tr><th scope="col">Name</th><th scope="col">Type</th><th scope="col">Purpose</th><th scope="col">Lasts</th></tr></thead>
                <tbody>
                  <tr><td className="mono">sb-…-auth-token</td><td>Essential cookie</td><td>Keeps you signed in (Supabase)</td><td>Until you sign out or the session expires</td></tr>
                  <tr><td className="mono">plv_guest</td><td>Essential cookie</td><td>Remembers you opened the planner without an account</td><td>30 days</td></tr>
                  <tr><td className="mono">plv_consent</td><td>Essential, browser storage</td><td>Remembers your analytics choice</td><td>Until you clear it</td></tr>
                  <tr><td className="mono">PostHog</td><td>Analytics</td><td>Only runs if you accept. Kept in memory for the visit only, so it doesn&apos;t set cookies or storage</td><td>The visit</td></tr>
                </tbody>
              </table></div>
              <p>
                Stripe sets its own essential cookies on its checkout page to prevent fraud; see{" "}
                <a href="https://stripe.com/gb/legal/cookies-policy">Stripe&apos;s cookie policy</a>. The planner keeps some
                settings in your browser&apos;s own storage, which never leaves your device.
              </p>
            </section>

            {/* ------------------------------------------------ COMPANY */}
            <section className="sec" id="company">
              <span className="kicker">Business details</span>
              <h2 className="disp">Who runs Plot-LV.</h2>
              <p>
                {OPERATOR_NAME ? <>{TRADING_NAME} is run by {OPERATOR_NAME}, a sole trader in England.<br /></> : <>{TRADING_NAME}, England.<br /></>}
                {BUSINESS_ADDRESS ? <>Business address: {BUSINESS_ADDRESS}<br /></> : null}
                {VAT_NUMBER ? <>VAT number: {VAT_NUMBER}<br /></> : null}
                {ICO_NUMBER ? <>ICO registration: {ICO_NUMBER}<br /></> : null}
                Email: <Mail /> — we aim to reply within {SUPPORT_REPLY_TIME}.
              </p>
            </section>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
