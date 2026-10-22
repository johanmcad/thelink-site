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
// SHIPPING: the shipping calculator on the order page. Each zone lists ISO
//   country codes (the values of the country select in order.html; "XX" is
//   "Other"), the cost of the first unit and of each further unit, in PRICE's
//   currency. A country in no zone, or an empty list, shows "shipping
//   confirmed by email" instead of a number — never a guess.
// CHECKOUT_URL: a hosted checkout (e.g. a Stripe Payment Link). While it is
//   empty the order form is the order channel and the confirmation email
//   carries the payment details. Once set, the order page offers "Pay now"
//   beside the form.
// CONTACT: where the fallback email goes and what the pages print.
window.SITE = {
  FORMSPREE_ID: "",
  PRICE: { amount: 299, currency: "USD" },
  INTRO: { amount: 249, label: "Introductory price" },
  SHIPPING: {
    from: "Sweden",
    zones: [
      // { name: "Sweden",        countries: ["SE"],                                   first: 0,  extra: 0 },
      // { name: "Nordics",       countries: ["NO", "DK", "FI", "IS"],                 first: 0,  extra: 0 },
      // { name: "Europe",        countries: ["GB", "IE", "DE", "AT", "CH", "FR", "BE", "NL", "LU", "IT", "ES", "PT", "PL", "CZ"], first: 0, extra: 0 },
      // { name: "North America", countries: ["US", "CA"],                             first: 0,  extra: 0 },
      // { name: "Rest of world", countries: ["AU", "NZ", "JP", "KR", "SG", "HK", "AE", "XX"], first: 0, extra: 0 },
    ],
  },
  CHECKOUT_URL: "",
  CONTACT: "info@playandtrack.com",
};
