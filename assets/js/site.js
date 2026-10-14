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
  var price = cfg.PRICE || {};
  var hasPrice = Number(price.amount) > 0;
  var priceText = "";
  if (hasPrice) {
    try {
      priceText = new Intl.NumberFormat("en-US", {
        style: "currency", currency: price.currency || "USD", maximumFractionDigits: 0,
      }).format(price.amount);
    } catch (e) {
      priceText = price.amount + " " + (price.currency || "USD");
    }
    var els = document.querySelectorAll("[data-price]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = priceText;
      els[i].insertAdjacentHTML("beforeend", "<small>" + (price.currency || "USD") + "</small>");
    }
    // Structured data carries an Offer only once there is a real price: a
    // placeholder of 0 would be a false claim to a search engine.
    var ld = document.getElementById("ld-product");
    if (ld) {
      try {
        var d = JSON.parse(ld.textContent);
        d.offers = {
          "@type": "Offer",
          availability: "https://schema.org/PreOrder",
          price: String(price.amount),
          priceCurrency: price.currency || "USD",
          url: "https://thelinkremote.com/preorder.html",
        };
        ld.textContent = JSON.stringify(d);
      } catch (e) { /* leave the static document alone */ }
    }
  }

  // ---- forms (pre-order, test volunteer): one relay, one fallback
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
      if (hasPrice && form.id === "preorder") lines.push("price shown: " + priceText);
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
