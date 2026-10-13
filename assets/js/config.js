// The Link website — launch settings. THE ONLY FILE TO EDIT AT LAUNCH.
//
// FORMSPREE_ID: the form id from formspree.io (the part after /f/ in the
//   endpoint, e.g. "xkgwabcd"). While it is empty the pre-order form falls
//   back to opening the visitor's email app with the details filled in.
// PRICE: the Link's price. amount 0 = not announced yet; every page then shows
//   "Price announced at launch" and no price is published in structured data.
// CONTACT: where the fallback email goes and what the pages print.
window.SITE = {
  FORMSPREE_ID: "",
  PRICE: { amount: 0, currency: "USD" },
  CONTACT: "info@playandtrack.com",
};
