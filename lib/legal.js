// Legal details shown on /legal (privacy, terms, cookies, company details),
// in every footer, and recorded at sign-up and checkout.
//
// FILL IN the [BRACKETED] values before the site replaces the live one.
// Plot-LV is run by a sole trader (no limited company yet). A sole trader
// trading under a business name must show their own name and a UK address
// where documents can be served (Companies Act 2006, Part 41), and the
// E-Commerce Regulations 2002 also need a geographic address and an email.
// The address can be a business/service address rather than your home.
// When you form a company, change OPERATOR_NAME / ADDRESS and add the
// company number and registered office to COMPANY_LINE.
//
// If you change the wording of the terms or privacy notice materially, bump
// its version so new sign-ups and purchases record which version they accepted.

export const TRADING_NAME = "Plot-LV";

export const OPERATOR_NAME = "[YOUR FULL NAME]";
export const BUSINESS_ADDRESS = "[BUSINESS ADDRESS]";
export const VAT_NUMBER = ""; // e.g. "GB123456789" — leave empty if not VAT registered
export const ICO_NUMBER = "[ICO REGISTRATION NUMBER]"; // register and pay the data protection fee at ico.org.uk/fee
export const SUPPORT_REPLY_TIME = "48 hours";

// A public address for privacy requests and support.
export const PRIVACY_EMAIL = "plotlvcad@gmail.com";

export const TERMS_VERSION = "2026-11-01";
export const PRIVACY_VERSION = "2026-11-01";
export const LAST_UPDATED = "1 November 2026";

export const COMPANY_LINE = `${TRADING_NAME} is run by ${OPERATOR_NAME}, a sole trader in England, trading as ${TRADING_NAME}. Business address: ${BUSINESS_ADDRESS}.${VAT_NUMBER ? ` VAT no. ${VAT_NUMBER}.` : ""} Contact: ${PRIVACY_EMAIL}.`;

// Must match public.marketing_wording_v1() in the database.
export const MARKETING_WORDING =
  "Email me Plot-LV product updates and launch news. I can unsubscribe at any time.";

// How prices are shown to buyers.
export const VAT_NOTE = "Prices include any VAT";
