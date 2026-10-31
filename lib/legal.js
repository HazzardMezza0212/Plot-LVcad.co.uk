// Legal details shown on /legal (privacy, terms, cookies, company details),
// in every footer, and recorded at sign-up and checkout.
//
// FILL IN the [BRACKETED] values before the site replaces the live one.
// UK law (Companies Act 2006, E-Commerce Regulations 2002) requires a company
// website to show its registered name, number, registered office and an email
// address. If you trade as a sole trader instead, set OPERATOR_NAME to
// "Your Name, trading as Plot-LV" and clear COMPANY_NUMBER / REGISTERED_OFFICE.
//
// If you change the wording of the terms or privacy notice materially, bump
// its version so new sign-ups and purchases record which version they accepted.

export const TRADING_NAME = "Plot-LV";

export const OPERATOR_NAME = "[COMPANY NAME] Ltd";
export const COMPANY_NUMBER = "[NUMBER]";
export const REGISTERED_OFFICE = "[REGISTERED ADDRESS]";
export const VAT_NUMBER = ""; // e.g. "GB123456789" — leave empty if not VAT registered
export const ICO_NUMBER = "[ICO REGISTRATION NUMBER]";
export const SUPPORT_REPLY_TIME = "[REPLY TIME, e.g. one working day]";

// A public address for privacy requests and support.
export const PRIVACY_EMAIL = "plotlvcad@gmail.com";

export const TERMS_VERSION = "2026-11-01";
export const PRIVACY_VERSION = "2026-11-01";
export const LAST_UPDATED = "1 November 2026";

export const COMPANY_LINE = `${TRADING_NAME} is a trading name of ${OPERATOR_NAME}, registered in England and Wales, company no. ${COMPANY_NUMBER}. Registered office: ${REGISTERED_OFFICE}.${VAT_NUMBER ? ` VAT no. ${VAT_NUMBER}.` : ""} Contact: ${PRIVACY_EMAIL}.`;

// Must match public.marketing_wording_v1() in the database.
export const MARKETING_WORDING =
  "Email me Plot-LV product updates and launch news. I can unsubscribe at any time.";

// How prices are shown. Business buyers are fine with "+ VAT"; if you sell to
// consumers, UK law expects the VAT-inclusive price. Pick one before launch.
export const VAT_NOTE = "[Prices include VAT / Prices exclude VAT]";
