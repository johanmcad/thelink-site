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
  var hasIntro = hasPrice && Number(intro.amount) > 0 && Number(intro.amount) < Number(list.amount);
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
        els[i].insertAdjacentHTML("afterend", '<p class="intro">' + (intro.label || "Introductory price") + "</p>");
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

  // ---- the shipping calculator (order page)
  // Reads the country and quantity fields, looks the country up in
  // config.js SHIPPING.zones and writes price × quantity + shipping = total
  // into #f-sum. A country in no zone gets words, not a number. The total
  // also rides along in the hidden "total" field so the order email carries
  // exactly what the customer saw.
  var money = fmt;
  var ship = cfg.SHIPPING || {};
  var zones = ship.zones || [];
  function zoneFor(code) {
    for (var z = 0; z < zones.length; z++) {
      var c = zones[z].countries || [];
      for (var k = 0; k < c.length; k++) if (c[k] === code) return zones[z];
    }
    return null;
  }
  var sumEl = document.getElementById("f-sum");
  var totalEl = document.getElementById("f-total");
  var countryEl = document.getElementById("f-country");
  var qtyEl = document.getElementById("f-qty");
  var lastTotal = "";
  function totalText() { return lastTotal; }
  function paint() {
    if (!sumEl || !hasPrice) return;
    var code = countryEl ? countryEl.value : "";
    var qty = Math.max(1, Math.min(5, parseInt(qtyEl && qtyEl.value, 10) || 1));
    var goods = price.amount * qty;
    var rows = '<div class="r"><span>Link × ' + qty + '</span><span>' + money(goods) + '</span></div>';
    var zone = code ? zoneFor(code) : null;
    var shipTxt;
    if (zone && typeof zone.first === "number") {
      var cost = zone.first + Math.max(0, qty - 1) * (typeof zone.extra === "number" ? zone.extra : zone.first);
      shipTxt = cost === 0 ? "Free" : money(cost);
      rows += '<div class="r"><span>Shipping' + (ship.from ? " from " + ship.from : "") + '</span><span>' + shipTxt + '</span></div>';
      rows += '<div class="r t"><span>Total</span><span>' + money(goods + cost) + '</span></div>';
      lastTotal = money(goods + cost) + " incl. " + (cost === 0 ? "free shipping" : money(cost) + " shipping") + (zone.name ? " (" + zone.name + ")" : "");
    } else {
      rows += '<div class="r"><span>Shipping' + (ship.from ? " from " + ship.from : "") + '</span><span>' + (code ? "confirmed by email" : "choose a country") + '</span></div>';
      rows += '<div class="r t"><span>Total</span><span>' + money(goods) + ' + shipping</span></div>';
      lastTotal = money(goods) + " + shipping (not calculated)";
    }
    rows += '<div class="n">' + (zone && zone.note ? zone.note : "Any import duties or taxes in your country are not included.") + '</div>';
    sumEl.innerHTML = rows;
    sumEl.className = "sum show";
    if (totalEl) totalEl.value = lastTotal;
  }
  if (sumEl) {
    if (countryEl) countryEl.addEventListener("change", paint);
    if (qtyEl) { qtyEl.addEventListener("input", paint); qtyEl.addEventListener("change", paint); }
    paint();
  }

  // ---- hosted checkout: one link from config.js, shown only when it exists
  // With a Stripe Payment Link in config.js, "Pay by card" is the main
  // button and the form becomes "order by email instead". The customer's
  // email and quantity are handed to Stripe's page (prefilled_email is a
  // documented Payment Link parameter; quantity is adjustable there).
  var checkout = String(cfg.CHECKOUT_URL || "").trim();
  var payEls = document.querySelectorAll("[data-checkout]");
  for (var c = 0; c < payEls.length; c++) {
    if (checkout) {
      payEls[c].href = checkout;
      payEls[c].hidden = false;
      payEls[c].addEventListener("click", function () {
        var em = document.getElementById("f-email");
        var v = em && em.value && em.validity.valid ? em.value.trim() : "";
        this.href = checkout + (checkout.indexOf("?") < 0 ? "?" : "&") +
          "locale=auto" + (v ? "&prefilled_email=" + encodeURIComponent(v) : "");
      });
    } else payEls[c].hidden = true;
  }
  if (checkout) document.documentElement.classList.add("has-checkout");

  // ---- forms (order, test volunteer): one relay, one fallback
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
      if (hasPrice && form.id === "order") lines.push("total shown: " + (totalText() || priceText + " + shipping"));
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
