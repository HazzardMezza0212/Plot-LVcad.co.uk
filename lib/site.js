// Site addresses.
//
// CANONICAL_URL is the real public address. Canonical links, the sitemap,
// robots.txt and social previews always point here, whatever deployment is
// serving the page. (Previously these used NEXT_PUBLIC_SITE_URL with a
// localhost fallback, which put "http://localhost:3000" in every canonical
// tag on the live site.)
//
// For links that must come back to the deployment the visitor is actually on
// (Stripe success/cancel pages on a preview build, for example), use
// originOf(request) in route handlers instead.

export const CANONICAL_URL = "https://www.plotlvcad.co.uk";

export const SUPPORT_EMAIL = "plotlvcad@gmail.com";

/** The origin of the deployment handling this request, e.g. https://site-git-redesign.vercel.app */
export function originOf(request) {
  return new URL(request.url).origin;
}
