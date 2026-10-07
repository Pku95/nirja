/* Naria Travels & Tours — site scripts (no dependencies) */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var params = new URLSearchParams(window.location.search);

  /* Footer year */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Mobile menu */
  var menuBtn = $("#menu-btn");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      var menu = $("#mobile-menu");
      var open = menu.classList.toggle("hidden") === false;
      $("#icon-menu").classList.toggle("hidden", open);
      $("#icon-close").classList.toggle("hidden", !open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }


  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Carousels (cards on every page) */
  function initCarousel(root) {
    var track = $(".carousel-track", root), prev = $(".carousel-prev", root),
        next = $(".carousel-next", root), dotsBox = $(".carousel-dots", root);
    var gap = parseInt(root.getAttribute("data-gap"), 10) || 24;
    var cfg = {
      m: parseInt(root.getAttribute("data-mobile"), 10) || 1,
      t: parseInt(root.getAttribute("data-tablet"), 10) || 2,
      d: parseInt(root.getAttribute("data-desktop"), 10) || 3
    };
    var interval = parseInt(root.getAttribute("data-autoplay"), 10) || 0;
    var idx = 0, per = cfg.d, timer = null, paused = false;

    function total() {
      return $$(".carousel-item", track).filter(function (i) { return !i.classList.contains("hidden"); }).length;
    }
    function calc() {
      var w = window.innerWidth;
      per = w < 640 ? cfg.m : (w < 1024 ? cfg.t : cfg.d);
    }
    function render() {
      var max = Math.max(0, total() - per);
      if (idx > max) idx = max;
      var sw = "calc((100% - " + (gap * (per - 1)) + "px) / " + per + ")";
      track.style.gap = gap + "px";
      $$(".carousel-item", track).forEach(function (i) { i.style.width = sw; });
      track.style.transform = "translateX(calc(-" + idx + " * (" + sw + " + " + gap + "px)))";
      prev.classList.toggle("invisible", idx === 0);
      next.classList.toggle("invisible", idx >= max);
      dotsBox.innerHTML = "";
      if (max > 0) {
        for (var n = 0; n <= max; n++) {
          (function (n) {
            var b = document.createElement("button");
            b.type = "button";
            b.setAttribute("aria-label", "Go to slide " + (n + 1));
            b.className = "h-2.5 rounded-full transition-all duration-300 " +
              (n === idx ? "w-8 bg-emerald-600" : "w-2.5 bg-slate-300 hover:bg-slate-400");
            b.addEventListener("click", function () { idx = n; render(); start(); });
            dotsBox.appendChild(b);
          })(n);
        }
      }
    }
    function start() {
      if (timer) clearInterval(timer);
      timer = null;
      if (!interval || reduceMotion) return;
      timer = setInterval(function () {
        if (paused) return;
        var max = Math.max(0, total() - per);
        if (max === 0) return;
        idx = idx >= max ? 0 : idx + 1;
        render();
      }, interval);
    }
    prev.addEventListener("click", function () { idx = Math.max(0, idx - 1); render(); start(); });
    next.addEventListener("click", function () { idx = Math.min(Math.max(0, total() - per), idx + 1); render(); start(); });
    root.addEventListener("mouseenter", function () { paused = true; });
    root.addEventListener("mouseleave", function () { paused = false; });
    var x0 = null;
    root.addEventListener("touchstart", function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", function (ev) {
      if (x0 === null) return;
      var dx = ev.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) < 50) return;
      var max = Math.max(0, total() - per);
      idx = dx < 0 ? Math.min(max, idx + 1) : Math.max(0, idx - 1);
      render(); start();
    }, { passive: true });
    window.addEventListener("resize", function () { calc(); render(); });
    root.carouselRefresh = function (reset) { if (reset) idx = 0; calc(); render(); start(); };
    calc(); render(); start();
  }
  $$(".carousel").forEach(initCarousel);
  function setHidden(el, hide) { (el.closest(".carousel-item") || el).classList.toggle("hidden", hide); }
  function refreshCarousels() {
    $$(".carousel").forEach(function (c) { if (c.carouselRefresh) c.carouselRefresh(true); });
  }

  /* Hero slideshow (home page) */
  var hero = $("#hero");
  if (hero) {
    var slides = $$(".hero-slide", hero), dots = $$(".hero-dot", hero);
    var hTitle = $("#hero-title"), hSub = $("#hero-subtitle");
    var cur = 0, hTimer = null;
    var replay = function (el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
    var showSlide = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (sl, i) {
        sl.style.opacity = i === cur ? 1 : 0;
        sl.style.transform = i === cur ? "scale(1)" : "scale(1.08)";
      });
      dots.forEach(function (d, i) {
        var on = i === cur;
        "w-8 bg-white".split(" ").forEach(function (c) { d.classList.toggle(c, on); });
        "w-2.5 bg-white/50 hover:bg-white/80".split(" ").forEach(function (c) { d.classList.toggle(c, !on); });
      });
      hTitle.textContent = slides[cur].getAttribute("data-title");
      hSub.textContent = slides[cur].getAttribute("data-subtitle");
      replay(hTitle, "animate-fade-in-up");
      replay(hSub, "animate-fade-in-up-delay");
    };
    var startHero = function () {
      if (hTimer) clearInterval(hTimer);
      if (!reduceMotion) hTimer = setInterval(function () { showSlide(cur + 1); }, 5000);
    };
    $("#hero-prev").addEventListener("click", function () { showSlide(cur - 1); startHero(); });
    $("#hero-next").addEventListener("click", function () { showSlide(cur + 1); startHero(); });
    dots.forEach(function (d, i) { d.addEventListener("click", function () { showSlide(i); startHero(); }); });
    startHero();
  }

  /* Hero search tabs (home page) */
  var tabs = $$(".hero-tab");
  if (tabs.length) {
    var activeCls = "bg-emerald-600 text-white shadow-lg shadow-emerald-200".split(" ");
    var idleCls = "bg-slate-100 text-slate-700 hover:bg-slate-200".split(" ");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) {
          var on = t === tab;
          activeCls.forEach(function (c) { t.classList.toggle(c, on); });
          idleCls.forEach(function (c) { t.classList.toggle(c, !on); });
        });
        $$(".hero-panel").forEach(function (p) {
          p.classList.toggle("hidden", p.getAttribute("data-panel") !== tab.getAttribute("data-tab"));
        });
        $("#hero-search-btn").setAttribute("href", tab.getAttribute("data-href"));
      });
    });
  }

  /* Filter-tab styling helper (tours / hajj) */
  function styleTabs(current, activeStr, idleStr) {
    $$(".type-tab").forEach(function (t) {
      var on = (t.getAttribute("data-type-tab") || "") === current;
      activeStr.split(" ").forEach(function (c) { t.classList.toggle(c, on); });
      idleStr.split(" ").forEach(function (c) { t.classList.toggle(c, !on); });
    });
  }

  /* Tours page: type filter + search */
  var tourGrid = $("#tour-grid");
  if (tourGrid) {
    var tType = params.get("type") || "";
    var tSearch = $("#tour-search");
    var runTours = function () {
      var q = (tSearch.value || "").trim().toLowerCase(), n = 0;
      $$(".tour-card", tourGrid).forEach(function (c) {
        var ok = (!tType || c.getAttribute("data-type") === tType) &&
                 (!q || c.getAttribute("data-search").indexOf(q) !== -1);
        setHidden(c, !ok);
        if (ok) n++;
      });
      refreshCarousels();
      $("#tour-count").textContent = n;
      $("#tour-empty").classList.toggle("hidden", n !== 0);
    };
    styleTabs(tType, "bg-emerald-600 text-white", "bg-white text-slate-700 hover:bg-slate-100");
    tSearch.addEventListener("input", runTours);
    $$(".dest-link").forEach(function (a) {
      a.addEventListener("click", function (ev) {
        ev.preventDefault();
        tSearch.value = a.getAttribute("data-q");
        tType = "";
        styleTabs("", "bg-emerald-600 text-white", "bg-white text-slate-700 hover:bg-slate-100");
        runTours();
        tourGrid.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
    runTours();
  }

  /* Hajj & Umrah page: type filter */
  var pkgGrid = $("#pkg-grid");
  if (pkgGrid) {
    var pType = params.get("type") || "";
    styleTabs(pType, "bg-emerald-600 text-white shadow-lg shadow-emerald-200",
      "bg-white text-slate-700 border border-slate-200 hover:border-emerald-300");
    $$(".pkg-card", pkgGrid).forEach(function (c) {
      setHidden(c, !!pType && c.getAttribute("data-type") !== pType);
    });
    refreshCarousels();
  }

  /* Hotels page: live filters */
  var hotelGrid = $("#hotel-grid");
  if (hotelGrid) {
    var runHotels = function () {
      var q = ($("#hotel-search").value || "").trim().toLowerCase();
      var min = parseFloat($("#price-min").value), max = parseFloat($("#price-max").value);
      var stars = $$(".star-filter:checked").map(function (i) { return parseInt(i.value, 10); });
      var ams = $$(".amenity-filter:checked").map(function (i) { return i.value; });
      var n = 0;
      $$(".hotel-card", hotelGrid).forEach(function (c) {
        var price = parseFloat(c.getAttribute("data-price"));
        var rating = Math.round(parseFloat(c.getAttribute("data-rating")));
        var am = c.getAttribute("data-amenities");
        var ok = (!q || c.getAttribute("data-search").indexOf(q) !== -1) &&
                 (isNaN(min) || price >= min) && (isNaN(max) || price <= max) &&
                 (!stars.length || stars.indexOf(rating) !== -1) &&
                 ams.every(function (a) { return am.indexOf(a) !== -1; });
        setHidden(c, !ok);
        if (ok) n++;
      });
      refreshCarousels();
      $("#hotel-count").textContent = n;
      $("#hotel-empty").classList.toggle("hidden", n !== 0);
    };
    ["#hotel-search", "#price-min", "#price-max"].forEach(function (s) { $(s).addEventListener("input", runHotels); });
    $$(".star-filter, .amenity-filter").forEach(function (i) { i.addEventListener("change", runHotels); });
    $("#hotel-search-btn").addEventListener("click", runHotels);
  }

  /* Chat widget */
  var chatOpen = $("#chat-open");
  if (chatOpen) {
    var panel = $("#chat-panel"), list = $("#chat-messages"), input = $("#chat-input");
    var addMsg = function (from, text) {
      var row = document.createElement("div");
      row.className = "flex " + (from === "user" ? "justify-end" : "justify-start");
      var bubble = document.createElement("div");
      bubble.className = "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm " + (from === "user"
        ? "bg-emerald-600 text-white rounded-br-sm"
        : "bg-white text-slate-700 rounded-bl-sm shadow-sm border border-slate-100");
      bubble.textContent = text;
      row.appendChild(bubble);
      list.appendChild(row);
      list.scrollTop = list.scrollHeight;
    };
    addMsg("agent", "Hello! 👋 Welcome to Naria Travels & Tours. How can we help you today?");
    var setOpen = function (open) {
      panel.classList.toggle("hidden", !open);
      chatOpen.classList.toggle("hidden", open);
      if (open) input.focus();
    };
    chatOpen.addEventListener("click", function () { setOpen(true); });
    $("#chat-close").addEventListener("click", function () { setOpen(false); });
    $("#chat-form").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMsg("user", text);
      input.value = "";
      setTimeout(function () {
        addMsg("agent", "Thanks for your message! One of our travel experts will get back to you shortly. For immediate assistance, please call +880 1972-944676.");
      }, 1000);
    });
  }

  /* POST JSON to the PHP mailer */
  function send(payload) {
    return fetch("contact.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) {
      return r.json().catch(function () { return { success: false }; }).then(function (j) { j.ok = r.ok; return j; });
    });
  }

  /* Contact form */
  var form = $("#contact-form");
  if (form) {
    var errBox = $("#contact-error"), btn = $("#contact-submit"), lbl = $("#contact-submit-label");
    var showErr = function (m) { errBox.textContent = m; errBox.classList.remove("hidden"); };
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      errBox.classList.add("hidden");
      var d = {};
      new FormData(form).forEach(function (v, k) { d[k] = String(v).trim(); });
      if (!d.name || !d.email || !d.message) { showErr("Please fill in your name, email and message."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) { showErr("Please enter a valid email address."); return; }
      btn.disabled = true; lbl.textContent = "Sending...";
      send(d).then(function (res) {
        if (res.ok && res.success) {
          form.classList.add("hidden");
          $("#contact-success").classList.remove("hidden");
          form.reset();
        } else {
          showErr(res.error || "Sorry, we couldn't send your message. Please call +880 1972-944676 or email info@nariatravels.com.");
        }
      }).catch(function () {
        showErr("Sorry, we couldn't send your message. Please call +880 1972-944676 or email info@nariatravels.com.");
      }).then(function () { btn.disabled = false; lbl.textContent = "Send Message"; });
    });
    $("#contact-again").addEventListener("click", function () {
      $("#contact-success").classList.add("hidden");
      form.classList.remove("hidden");
    });
  }

  /* Newsletter (footer) */
  var nl = $("#newsletter-form");
  if (nl) {
    nl.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var email = nl.elements.email.value.trim(), label = $("#newsletter-label");
      if (!email) return;
      label.textContent = "Sending...";
      send({ name: "Newsletter subscriber", email: email, serviceType: "newsletter", message: "Please subscribe this email to travel deals and updates." })
        .then(function (res) {
          label.textContent = res.ok && res.success ? "Subscribed!" : "Try again";
          if (res.ok && res.success) nl.reset();
        })
        .catch(function () { label.textContent = "Try again"; });
      setTimeout(function () { label.textContent = "Subscribe"; }, 3500);
    });
  }
})();
