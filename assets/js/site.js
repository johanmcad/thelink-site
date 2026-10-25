/* The Link website — the little JS there is.
   Three jobs: the phone menu, the price (one constant in config.js, shown
   wherever [data-price] appears), and the pre-order form, which posts to
   Formspree when an id is configured and otherwise opens the visitor's email
   app with the fields filled in. Everything on the pages works with this file
   missing; nothing here is load-bearing for reading the site. */
(function () {
  "use strict";
  var cfg = window.SITE || {};
  var contact = cfg.CONTACT || "info@playandtrack.com";

  // ---- menu
  var top = document.getElementById("top");
  var menu = document.getElementById("menu");
  if (top && menu) {
    menu.addEventListener("click", function () {
      var open = top.classList.toggle("open");
      menu.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && top.classList.contains("open")) {
        top.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
        menu.focus();
      }
    });
  }

  // ---- price
  // PRICE is the list price; INTRO, when set below it, is what the customer
  // pays today and the pages show both: the intro price, the list price
  // struck through, and the offer's label. price.amount below is always the
  // amount CHARGED, which the calculator and the structured data use.
  var list = cfg.PRICE || {};
  var intro = cfg.INTRO || {};
  var cur = list.currency || "USD";
  var fmt = function (n) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n);
    } catch (e) { return n + " " + cur; }
  };
  var hasPrice = Number(list.amount) > 0;
  var units = Number(intro.units) || 0;
  var left = units > 0 ? Math.max(0, units - (Number(intro.sold) || 0)) : -1;
  // An offer for the first N units ends by itself when they are gone.
  var hasIntro = hasPrice && Number(intro.amount) > 0 && Number(intro.amount) < Number(list.amount) && left !== 0;
  var price = { amount: hasIntro ? Number(intro.amount) : Number(list.amount), currency: cur };
  var priceText = "";
  if (hasPrice) {
    priceText = fmt(price.amount);
    var els = document.querySelectorAll("[data-price]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = priceText;
      els[i].insertAdjacentHTML("beforeend", "<small>" + cur + "</small>");
      if (hasIntro) {
        els[i].insertAdjacentHTML("beforeend", ' <s class="was" aria-label="list price ' + fmt(list.amount) + '">' + fmt(list.amount) + "</s>");
        var label = intro.label || "Introductory price";
        if (left > 0) label += " for the first " + units + " units";
        els[i].insertAdjacentHTML("afterend", '<p class="intro">' + label + "</p>" +
          (left > 0 ? '<p class="left"><b>' + left + '</b> left. Get yours now.</p>' : ""));
      }
    }
    // Structured data carries an Offer only once there is a real price: a
    // placeholder of 0 would be a false claim to a search engine.
    var ld = document.getElementById("ld-product");
    if (ld) {
      try {
        var d = JSON.parse(ld.textContent);
        d.offers = {
          "@type": "Offer",
          availability: "https://schema.org/InStock",
          price: String(price.amount),
          priceCurrency: price.currency || "USD",
          url: "https://linkhifi.com/order.html",
        };
        ld.textContent = JSON.stringify(d);
      } catch (e) { /* leave the static document alone */ }
    }
  }

  // ---- the order button (order page): a Stripe Payment Link from config.js.
  // With no link configured it stays the mailto in the HTML, so an order can
  // still be placed by email. The customer's quantity is adjustable on the
  // Stripe page. ?paid=1 is the return address after a successful payment.
  var checkout = String(cfg.CHECKOUT_URL || "").trim();
  var payEls = document.querySelectorAll("[data-checkout]");
  for (var c = 0; c < payEls.length; c++) {
    if (checkout) payEls[c].href = checkout + (checkout.indexOf("?") < 0 ? "?" : "&") + "locale=auto";
  }
  if (checkout) document.documentElement.classList.add("has-checkout");
  var paid = document.getElementById("paid");
  if (paid && /[?&]paid=1\b/.test(location.search)) {
    paid.classList.add("show");
    paid.focus();
  }

  // ---- forms (test volunteer on the compatibility page): one relay, one fallback
  // A form carries data-relay plus the ids of its message box, success plate
  // and send button, and data-subject for the email. With a Formspree id it
  // posts there; without one it opens the visitor's email app, fields filled in.
  var id = String(cfg.FORMSPREE_ID || "").trim();
  var forms = document.querySelectorAll("form[data-relay]");
  for (var f = 0; f < forms.length; f++) wire(forms[f]);

  function wire(form) {
    var box = document.getElementById(form.getAttribute("data-msg"));
    var done = document.getElementById(form.getAttribute("data-done"));
    var send = document.getElementById(form.getAttribute("data-send"));
    var subject = form.getAttribute("data-subject") || "Link";

    function say(text, isErr) {
      box.textContent = text;
      box.className = "msg show" + (isErr ? " err" : "");
    }
    function mailtoHref() {
      var fd = new FormData(form);
      var lines = [];
      fd.forEach(function (v, k) {
        if (k.charAt(0) === "_") return;
        if (String(v).trim()) lines.push(k + ": " + v);
      });
      return "mailto:" + contact + "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(lines.join("\n"));
    }

    if (id) {
      form.action = "https://formspree.io/f/" + id;
    } else {
      form.action = "mailto:" + contact + "?subject=" + encodeURIComponent(subject);
      form.enctype = "text/plain";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var hp = form.elements._gotcha;
      if (hp && hp.value) return;           // a bot filled the hidden field

      if (!id) {
        window.location.href = mailtoHref();
        say("Your email app should open with the details filled in. If it does not, write to " + contact + ".");
        return;
      }

      send.disabled = true;
      say("Sending…");
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      }).then(function (r) {
        if (!r.ok) throw new Error("status " + r.status);
        form.hidden = true;
        box.className = "msg";
        done.classList.add("show");
        done.focus();
      }).catch(function () {
        say("That did not go through. Email us instead: " + contact, true);
      }).then(function () {
        send.disabled = false;
      });
    });
  }
})();
