// The Link website — launch settings. THE ONLY FILE TO EDIT AT LAUNCH.
//
// FORMSPREE_ID: the form id from formspree.io (the part after /f/ in the
//   endpoint, e.g. "xkgwabcd"). While it is empty the order form falls back
//   to opening the visitor's email app with the details filled in.
// PRICE: the Link's list price. amount 0 = not announced yet; every page then
//   shows "Price announced at launch" and no price is published in structured
//   data.
// INTRO: an introductory price. amount > 0 and below PRICE = the pages show it
//   with the list price struck through and INTRO.label beside it, and the
//   calculator and structured data use it. amount 0 = no offer, list price only.
//   The Stripe Payment Link must carry the same price as the pages.
//   units / sold: the offer is for the first `units` boxes; the pages count
//   down ("38 of the first 50 left") from `sold`, which Johan updates by hand
//   after each sale — it is a real number or nothing (units 0 = no counter).
//   When sold >= units the offer is over and the pages show the list price;
//   change the Stripe Payment Link to the list price at the same time.
// SHIPPING: included: true = the pages say shipping is in the price (Johan
//   2026-10-23). The Stripe Payment Link must agree (no shipping rates there).
// CHECKOUT_URL: the Stripe Payment Link the order page's ORDER button opens.
//   Empty = the button falls back to an email to CONTACT. The link carries
//   the price, quantity, cable choice and shipping address; the site shows
//   nothing it does not.
// CONTACT: where the fallback email goes and what the pages print.
window.SITE = {
  FORMSPREE_ID: "",
  PRICE: { amount: 299, currency: "USD" },
  INTRO: { amount: 249, label: "Introductory price", units: 50, sold: 12 },
  SHIPPING: { included: true, from: "Sweden" },
  CHECKOUT_URL: "https://buy.stripe.com/7sYdR80so2Q193AfCu2sM00",
  CONTACT: "info@playandtrack.com",
};
