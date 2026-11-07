/* Wecce — maquette v2 : comportements communs (sans dépendance). */
(function () {
  "use strict";

  /* ---------- Icônes (tracés au style Lucide, licence ISC) ---------- */
  var P = {
    search: '<circle cx="11" cy="11" r="7.5"/><path d="m20.5 20.5-4.2-4.2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    verified: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    "arrow-left": '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "chevron-right": '<path d="m9 18 6-6-6-6"/>',
    store: '<path d="M2 10 4 4h16l2 6"/><path d="M4 10v10h16V10"/><path d="M2 10h20"/><path d="M10 20v-5h4v5"/>',
    points: '<circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.2h3.3a1.9 1.9 0 0 1 0 3.8H9.5V9.2zM9.5 13v3.6"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    phone: '<rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/>',
    laptop: '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
    tablet: '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M12 18h.01"/>',
    audio: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    piece: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2M15 20v2M2 15h2M2 9h2M20 15h2M20 9h2M9 2v2M9 20v2"/>',
    battery: '<rect width="16" height="10" x="2" y="7" rx="2"/><path d="M22 11v2M6 11v2"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>',
    "x-circle": '<circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6"/>',
    "check-circle": '<circle cx="12" cy="12" r="9"/><path d="m9 12 2 2 4-4"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 8h4M18 16h4"/>',
    user: '<circle cx="12" cy="8" r="4.5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12M3.3 7 12 12l8.7-5"/>',
    scale: '<path d="M12 3v18M7 21h10"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/>',
    clipboard: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>',
    pen: '<path d="M12 20h9"/><path d="M16.38 3.62a1 1 0 0 1 3 3L7.37 18.64a2 2 0 0 1-.86.51l-2.87.84a.5.5 0 0 1-.62-.62l.84-2.87a2 2 0 0 1 .51-.86z"/>',
    image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    down: '<path d="M16 17h6v-6"/><path d="m22 17-8.5-8.5-5 5L2 7"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    private: '<path d="M10.73 5.08A10.74 10.74 0 0 1 21.94 11.65a1 1 0 0 1 0 .7 10.75 10.75 0 0 1-1.44 2.49"/><path d="M14.08 14.16a3 3 0 0 1-4.24-4.24"/><path d="M17.48 17.5A10.75 10.75 0 0 1 2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 4.45-5.14"/><path d="m2 2 20 20"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    pause: '<circle cx="12" cy="12" r="9"/><path d="M10 15V9M14 15V9"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    cash: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><path d="M14 2v4a2 2 0 0 0 2 2h4M16 13H8M16 17H8M10 9H8"/>',
    upload: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    "log-in": '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="m10 17 5-5-5-5M15 12H3"/>',
    "user-plus": '<circle cx="9" cy="8" r="4.5"/><path d="M16 21a7 7 0 0 0-14 0M19 8v6M22 11h-6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/>'
  };
  function icon(name, cls) {
    return '<svg class="i' + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (P[name] || "") + "</svg>";
  }
  function paintIcons(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach(function (el) {
      el.outerHTML = icon(el.getAttribute("data-icon"), el.className);
    });
  }

  /* ---------- Nombres à la française ---------- */
  var nf = new Intl.NumberFormat("fr-FR");
  function fmt(n) { return nf.format(Math.round(n)); }
  window.wecceFmt = fmt;

  /* ---------- Vie : mouvements Material 3 ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Onde au clic, partie du point touché
  function setupRipple() {
    document.addEventListener("pointerdown", function (e) {
      var el = e.target.closest(".btn, .chip, .seg button, .slot, .day");
      if (!el || el.disabled || reduceMotion) return;
      var r = el.getBoundingClientRect();
      var size = Math.max(r.width, r.height) * 2.4;
      var s = document.createElement("span");
      s.className = "ripple";
      s.style.width = s.style.height = size + "px";
      s.style.left = (e.clientX - r.left - size / 2) + "px";
      s.style.top = (e.clientY - r.top - size / 2) + "px";
      el.appendChild(s);
      setTimeout(function () { s.remove(); }, 700);
    });
  }

  // Cascade : chaque enfant reçoit son rang
  function stagger(root) {
    Array.prototype.forEach.call(root.children, function (c, i) { c.style.setProperty("--i", Math.min(i, 14)); });
  }
  function setupStagger() { document.querySelectorAll("[data-stagger]").forEach(stagger); }

  // Les nombres défilent jusqu'à leur valeur
  function countUp(el) {
    if (reduceMotion || !el) return;
    var txt = el.dataset.final || el.textContent;
    el.dataset.final = txt;
    var m = txt.match(/\d[\d\s  ]*\d|\d/);
    if (!m) return;
    var target = Number(m[0].replace(/\D/g, ""));
    var pre = txt.slice(0, m.index), post = txt.slice(m.index + m[0].length);
    var t0 = null, dur = 1200;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), ease = 1 - Math.pow(1 - p, 4);
      el.textContent = p < 1 ? pre + fmt(target * ease) + post : txt;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function setupCountUp() { document.querySelectorAll("[data-countup]").forEach(function (el) { if (!el.closest("[hidden]")) countUp(el); }); }

  // Éclats de célébration
  function burst(x, y) {
    if (reduceMotion) return;
    var colors = ["#e1ac10", "#24338f", "#f0c235", "#1c1a14"];
    for (var i = 0; i < 22; i++) {
      var d = document.createElement("span");
      d.className = "burst";
      d.style.left = x + "px"; d.style.top = y + "px";
      d.style.background = colors[i % colors.length];
      document.body.appendChild(d);
      var a = Math.random() * Math.PI * 2, dist = 70 + Math.random() * 110;
      var anim = d.animate([
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: "translate(calc(-50% + " + Math.cos(a) * dist + "px), calc(-50% + " + (Math.sin(a) * dist - 30) + "px)) scale(.3)", opacity: 0 }
      ], { duration: 750 + Math.random() * 350, easing: "cubic-bezier(.05, .7, .1, 1)", fill: "forwards" });
      anim.onfinish = (function (n) { return function () { n.remove(); }; })(d);
    }
  }
  window.wecceBurst = burst;

  // Les sections se posent en entrant à l'écran (elles restent lisibles avant)
  function setupReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length || reduceMotion || !("IntersectionObserver" in window)) return;
    els.forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in"); });
    document.documentElement.classList.add("js");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        en.target.querySelectorAll("[data-countup]").forEach(countUp);
        if (en.target.matches("[data-countup]")) countUp(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { if (!el.classList.contains("in")) io.observe(el); });
  }
  function burstFrom(el) { if (!el) return; var r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }

  /* ---------- Notifications ---------- */
  function toast(msg) {
    var host = document.querySelector(".toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "toasts"; host.setAttribute("role", "status"); host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    var t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = icon("check-circle") + "<span></span>";
    t.querySelector("span").textContent = msg;
    host.appendChild(t);
    requestAnimationFrame(function () { requestAnimationFrame(function () { t.classList.add("in"); }); });
    setTimeout(function () { t.classList.remove("in"); setTimeout(function () { t.remove(); }, 260); }, 3400);
  }
  window.wecceToast = toast;

  /* ---------- Actions génériques : notification, confirmation sur place, changement de statut ---------- */
  function applyAfter(item, spec) {
    if (!item || !spec) return;
    var p = spec.split("|");
    var badge = item.querySelector("[data-status]");
    if (badge) { badge.className = "badge badge--" + (p[1] || "line"); badge.textContent = p[0]; }
    item.querySelectorAll("[data-actions]").forEach(function (a) { a.hidden = true; });
    item.classList.add("is-updated");
  }
  function setupActions() {
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-toast]");
      if (t && !t.disabled) toast(t.dataset.toast);
      var c = e.target.closest("[data-confirm]");
      if (c) {
        e.preventDefault();
        var box = document.getElementById(c.dataset.confirm);
        if (box) { box.hidden = false; var y = box.querySelector("[data-confirm-yes]"); if (y) y.focus(); }
      }
      var no = e.target.closest("[data-confirm-no]");
      if (no) { var b = no.closest(".confirm"); if (b) b.hidden = true; }
      var yes = e.target.closest("[data-confirm-yes]");
      if (yes) { var bx = yes.closest(".confirm"); if (bx) bx.hidden = true; applyAfter(yes.closest("[data-item]"), yes.dataset.after); }
      var after = e.target.closest("[data-after]:not([data-confirm-yes])");
      if (after && !after.disabled) { applyAfter(after.closest("[data-item]"), after.dataset.after); after.remove(); }
    });
  }

  /* ---------- Filtres de listes (stock, journal, mouvements) ---------- */
  function setupFilters() {
    document.querySelectorAll("[data-filter-group]").forEach(function (g) {
      var target = document.querySelector('[data-filter-target="' + g.dataset.filterGroup + '"]');
      if (!target) return;
      g.addEventListener("wecce:pick", function (e) {
        var v = e.detail, shown = 0;
        target.querySelectorAll("[data-kind]").forEach(function (r) {
          var ok = v === "tout" || r.dataset.kind.split(" ").indexOf(v) !== -1;
          r.hidden = !ok; if (ok) shown++;
        });
        var empty = target.querySelector("[data-filter-empty]");
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- Boutons qui exigent un motif ---------- */
  function setupRequires() {
    document.querySelectorAll("[data-requires]").forEach(function (b) {
      var f = document.querySelector(b.dataset.requires);
      if (!f) return;
      var hint = b.parentElement.querySelector("[data-requires-hint]");
      function upd() { var ok = f.value.trim().length >= 5; b.disabled = !ok; if (hint) hint.hidden = ok; }
      f.addEventListener("input", upd); upd();
    });
  }

  /* ---------- Interrupteurs reliés à un état ---------- */
  function setupStateToggles() {
    document.querySelectorAll("[data-state-toggle]").forEach(function (inp) {
      var p = inp.dataset.stateToggle.split(":");
      inp.addEventListener("change", function () {
        window.wecceState(inp.checked ? p[0] : p[1]);
        toast(inp.checked ? "Dépôts suspendus. Le motif s'affiche aux étudiants." : "Dépôts rouverts.");
      });
      document.addEventListener("wecce:state", function (e) { inp.checked = e.detail === p[0]; });
    });
  }

  /* ---------- Dépôt : catégorie, photos, créneaux, récapitulatif ---------- */
  function setupDeposit() {
    var root = document.querySelector("[data-stepper]");
    if (!root) return;
    var cats = root.querySelector("[data-cat-switch]");
    if (cats) cats.addEventListener("wecce:pick", function (e) {
      var piece = e.detail === "piece";
      root.querySelectorAll("[data-for='piece']").forEach(function (el) { el.hidden = !piece; });
      root.querySelectorAll("[data-for='appareil']").forEach(function (el) { el.hidden = piece; });
    });
    root.querySelectorAll(".photo-slot input[type=file]").forEach(function (inp) {
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        var r = new FileReader();
        r.onload = function () {
          var slot = inp.closest(".photo-slot");
          var img = slot.querySelector("img") || document.createElement("img");
          img.src = r.result; img.alt = "Photo ajoutée";
          if (!img.parentNode) slot.insertBefore(img, slot.firstChild);
          slot.classList.add("photo-slot--filled");
          toast("Photo ajoutée.");
        };
        r.readAsDataURL(f);
      });
    });
    var days = root.querySelector("[data-days]"), slots = root.querySelector("[data-slots]");
    if (days && slots) days.addEventListener("wecce:pick", function (e) {
      var taken = String(e.detail || "").split(",").filter(Boolean).map(Number);
      slots.querySelectorAll(".slot").forEach(function (s, i) { s.disabled = taken.indexOf(i) !== -1; s.setAttribute("aria-pressed", "false"); });
      var first = slots.querySelector(".slot:not([disabled])");
      if (first) first.setAttribute("aria-pressed", "true");
    });
    var sw = root.querySelector("#souhait");
    if (sw) sw.addEventListener("input", function () { var d = sw.value.replace(/\D/g, "").slice(0, 7); sw.value = d ? fmt(Number(d)) : ""; });
    root.addEventListener("wecce:step", function (e) {
      if (e.detail !== 4) return;
      function set(k, v) { root.querySelectorAll('[data-recap="' + k + '"]').forEach(function (n) { n.textContent = v; }); }
      var modele = root.querySelector("#modele").value.trim() || "Appareil";
      var stock = root.querySelector("#stockage").value.trim();
      set("appareil", modele + (stock ? " · " + stock : ""));
      var age = root.querySelector("[data-age] [aria-pressed=true]");
      var etat = root.querySelector("input[name=etat]:checked:not([disabled])");
      var etatVisible = Array.prototype.filter.call(root.querySelectorAll("input[name=etat]:checked"), function (x) { return !x.closest("[hidden]"); })[0];
      set("etat", (age ? age.textContent.trim() : "") + (etatVisible ? " · " + etatVisible.closest("label").querySelector("strong").textContent.toLowerCase() : ""));
      var n = root.querySelectorAll(".photo-slot--filled").length;
      set("photos", n === 0 ? "aucune pour l'instant" : String(n));
      set("souhait", sw && sw.value ? sw.value + " pts" : "non indiqué");
      var day = root.querySelector("[data-days] [aria-pressed=true] strong");
      var slot = root.querySelector("[data-slots] [aria-pressed=true]");
      set("rdv", (day ? day.textContent + " novembre" : "") + (slot ? ", " + slot.textContent : ""));
    });
    var fin = root.querySelector("[data-finish]");
    if (fin) fin.addEventListener("click", function (e) {
      e.preventDefault();
      var rdv = root.querySelector('[data-recap="rdv"]');
      toast("Rendez-vous confirmé : " + (rdv ? rdv.textContent : "") + ".");
      setTimeout(function () { location.href = fin.getAttribute("href"); }, 1500);
    });
  }

  /* ---------- Curseur du pouvoir d'achat ---------- */
  function setupSim() {
    var s = document.querySelector("[data-sim]");
    if (!s) return;
    var solde = Number(s.dataset.solde), prix = Number(s.dataset.prix);
    var r = s.querySelector("input[type=range]");
    function out(n, v) { s.querySelectorAll('[data-sim-out="' + n + '"]').forEach(function (el) { el.textContent = v; }); }
    function upd() {
      var m = Number(r.value), k = Math.pow(0.95, m);
      var so = Math.round(solde * k), pr = Math.round(prix * k);
      out("mois", m === 0 ? "0 mois, aujourd'hui" : m === 1 ? "1 mois" : m + " mois");
      out("solde", fmt(so) + " pts"); out("prix", fmt(pr) + " pts"); out("reste", fmt(so - pr) + " pts");
      r.style.setProperty("--fill", (m / Number(r.max) * 100) + "%");
    }
    r.addEventListener("input", upd); upd();
  }

  /* ---------- Infobulles des graphiques ---------- */
  function setupTips() {
    var hits = document.querySelectorAll(".hit[data-tip]");
    if (!hits.length) return;
    var tip = document.createElement("div");
    tip.className = "tip"; tip.hidden = true;
    document.body.appendChild(tip);
    function show(el) {
      tip.textContent = el.dataset.tip; tip.hidden = false;
      var r = el.getBoundingClientRect(), tw = tip.offsetWidth;
      var x = Math.min(window.innerWidth - tw - 8, Math.max(8, r.left + r.width / 2 - tw / 2));
      tip.style.left = (x + window.scrollX) + "px";
      tip.style.top = (r.top + window.scrollY - tip.offsetHeight - 10) + "px";
      el.classList.add("is-on");
    }
    function hide(el) { tip.hidden = true; el.classList.remove("is-on"); }
    hits.forEach(function (el) {
      el.setAttribute("tabindex", "0");
      el.setAttribute("aria-label", el.dataset.tip);
      ["mouseenter", "focus"].forEach(function (ev) { el.addEventListener(ev, function () { show(el); }); });
      ["mouseleave", "blur"].forEach(function (ev) { el.addEventListener(ev, function () { hide(el); }); });
    });
  }

  /* ---------- Sélecteur d'états (outil de maquette) ---------- */
  function setupStates() {
    var spec = document.body.getAttribute("data-states");
    var host = document.querySelector(".mq__states");
    if (!spec || !host) return;
    var states = spec.split("|").map(function (s) { var p = s.split(":"); return { key: p[0], label: p[1] }; });
    var label = document.createElement("span");
    label.className = "mq__states-label";
    label.textContent = "États :";
    host.appendChild(label);
    states.forEach(function (st, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mq__state";
      b.textContent = st.label;
      b.setAttribute("aria-pressed", i === 0 ? "true" : "false");
      b.addEventListener("click", function () { applyState(st.key); });
      b.dataset.key = st.key;
      host.appendChild(b);
    });
    var start = (location.hash || "").replace("#", "");
    applyState(states.some(function (s) { return s.key === start; }) ? start : states[0].key);
    window.addEventListener("hashchange", function () {
      var k = (location.hash || "").replace("#", "");
      if (states.some(function (s) { return s.key === k; })) applyState(k);
    });
  }
  function applyState(key) {
    document.body.setAttribute("data-state", key);
    document.querySelectorAll(".mq__state").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.key === key ? "true" : "false"); });
    document.querySelectorAll("[data-when]").forEach(function (el) {
      el.hidden = el.getAttribute("data-when").split(" ").indexOf(key) === -1;
    });
    document.querySelectorAll("[data-unless]").forEach(function (el) {
      el.hidden = el.getAttribute("data-unless").split(" ").indexOf(key) !== -1;
    });
    document.dispatchEvent(new CustomEvent("wecce:state", { detail: key }));
  }
  window.wecceState = applyState;

  /* ---------- Groupes à sélection unique (puces, segments) ---------- */
  function setupGroups() {
    document.querySelectorAll("[data-single]").forEach(function (group) {
      group.addEventListener("click", function (e) {
        var b = e.target.closest("button");
        if (!b || !group.contains(b)) return;
        group.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        group.dispatchEvent(new CustomEvent("wecce:pick", { detail: b.dataset.value, bubbles: true }));
      });
    });
  }

  /* ---------- Marché : filtres, solde, tri, recherche ---------- */
  function setupMarket() {
    var grid = document.querySelector("[data-market]");
    if (!grid) return;
    var solde = Number(grid.getAttribute("data-solde"));
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".card"));
    var cat = "tout", onlySolde = false, sort = "recent", q = "";
    var count = document.querySelector("[data-count]");
    var empty = document.querySelector("[data-empty]");
    var catGroup = document.querySelector("[data-cats]");
    var soldeBtn = document.querySelector("[data-only-solde]");
    var sortSel = document.querySelector("[data-sort]");
    var search = document.querySelector(".search input");

    function render() {
      var shown = cards.filter(function (c) {
        var okCat = cat === "tout" || c.dataset.cat === cat;
        var okSolde = !onlySolde || Number(c.dataset.price) <= solde;
        var okQ = !q || c.dataset.name.toLowerCase().indexOf(q) !== -1;
        return okCat && okSolde && okQ;
      });
      var ordered = shown.slice().sort(function (a, b) {
        if (sort === "prix-asc") return a.dataset.price - b.dataset.price;
        if (sort === "prix-desc") return b.dataset.price - a.dataset.price;
        return Number(a.dataset.order) - Number(b.dataset.order);
      });
      cards.forEach(function (c) { c.hidden = shown.indexOf(c) === -1; });
      ordered.forEach(function (c, i) { c.style.setProperty("--i", Math.min(i, 14)); grid.appendChild(c); });
      if (count) count.textContent = shown.length + (shown.length > 1 ? " objets" : " objet");
      if (empty) empty.hidden = shown.length !== 0;
      grid.hidden = shown.length === 0;
    }
    if (catGroup) catGroup.addEventListener("wecce:pick", function (e) { cat = e.detail; render(); });
    if (soldeBtn) soldeBtn.addEventListener("click", function () {
      onlySolde = !onlySolde; soldeBtn.setAttribute("aria-pressed", String(onlySolde)); render();
    });
    if (sortSel) sortSel.addEventListener("change", function () { sort = sortSel.value; render(); });
    if (search) search.addEventListener("input", function () { q = search.value.trim().toLowerCase(); render(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && search && !/input|textarea|select/i.test(document.activeElement.tagName)) { e.preventDefault(); search.focus(); }
    });
    document.querySelectorAll("[data-reset-filters]").forEach(function (b) {
      b.addEventListener("click", function () {
        cat = "tout"; onlySolde = false; q = "";
        if (search) search.value = "";
        if (soldeBtn) soldeBtn.setAttribute("aria-pressed", "false");
        if (catGroup) catGroup.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.value === "tout" ? "true" : "false"); });
        render();
      });
    });
    document.addEventListener("wecce:state", function (e) {
      if (e.detail === "vide") {
        q = "lecteur dvd"; if (search) search.value = "lecteur DVD"; render();
      } else if (q === "lecteur dvd") {
        q = ""; if (search) search.value = ""; render();
      }
    });
    render();
  }

  /* ---------- Étapes (dépôt) ---------- */
  function setupSteps() {
    var root = document.querySelector("[data-stepper]");
    if (!root) return;
    var panels = root.querySelectorAll("[data-step]");
    var items = document.querySelectorAll(".steps li");
    var cur = 1;
    function go(n) {
      cur = Math.max(1, Math.min(panels.length, n));
      panels.forEach(function (p) { p.hidden = Number(p.dataset.step) !== cur; });
      items.forEach(function (li, i) {
        li.classList.toggle("done", i + 1 < cur);
        if (i + 1 === cur) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
      });
      root.dispatchEvent(new CustomEvent("wecce:step", { detail: cur }));
      var top = root.getBoundingClientRect().top + window.scrollY - 120;
      if (window.scrollY > top) window.scrollTo({ top: top });
    }
    root.addEventListener("click", function (e) {
      if (e.target.closest("[data-next]")) { e.preventDefault(); go(cur + 1); }
      if (e.target.closest("[data-prev]")) { e.preventDefault(); go(cur - 1); }
      var g = e.target.closest("[data-goto]");
      if (g) { e.preventDefault(); go(Number(g.dataset.goto)); }
    });
    items.forEach(function (li, i) { li.addEventListener("click", function () { go(i + 1); }); li.style.cursor = "pointer"; });
    go(1);
  }

  /* ---------- Expertise : deux prix, écarts, message ---------- */
  function setupExpertise() {
    var form = document.querySelector("[data-expertise]");
    if (!form) return;
    var souhait = Number(form.dataset.souhait);
    var rep = form.querySelector("#reprise");
    var aff = form.querySelector("#affichage");
    function val(el) { return Number(String(el.value).replace(/\s| /g, "")) || 0; }
    function update() {
      var r = val(rep), a = val(aff);
      var bad = a > 0 && r > 0 && a < r;
      aff.setAttribute("aria-invalid", bad ? "true" : "false");
      form.querySelectorAll("[data-out]").forEach(function (o) {
        var k = o.dataset.out;
        if (k === "reprise") o.textContent = fmt(r);
        if (k === "affichage") o.textContent = fmt(a);
        if (k === "ecart") o.textContent = fmt(Math.max(0, a - r));
        if (k === "ecart-pct") o.textContent = a > 0 ? fmt(Math.max(0, (a - r) / a * 100)) + " %" : "–";
        if (k === "bonus") o.textContent = fmt(r * 0.2);
        if (k === "credit") o.textContent = fmt(r * 1.2);
        if (k === "diff-souhait") o.textContent = fmt(Math.abs(souhait - r));
      });
      var gap = souhait - r;
      form.querySelectorAll("[data-gap]").forEach(function (el) {
        var w = el.dataset.gap;
        el.hidden = !((w === "below" && gap > 0) || (w === "above" && gap <= 0));
      });
      form.querySelectorAll("[data-invalid]").forEach(function (el) { el.hidden = !bad; });
      var off = bad || r <= 0 || a <= 0;
      form.querySelectorAll("[data-needs-valid]").forEach(function (b) {
        if (b.tagName === "A") {
          b.setAttribute("aria-disabled", off ? "true" : "false");
          if (off) b.setAttribute("tabindex", "-1"); else b.removeAttribute("tabindex");
        } else { b.disabled = off; }
      });
    }
    [rep, aff].forEach(function (el) { el.addEventListener("input", update); });
    form.addEventListener("click", function (e) {
      var a = e.target.closest("a[aria-disabled='true']");
      if (a) e.preventDefault();
    });
    document.addEventListener("wecce:state", function (e) {
      if (e.detail === "pieces") { rep.value = fmt(18000); aff.value = fmt(24000); }
      if (e.detail === "defaut") { rep.value = fmt(72000); aff.value = fmt(96000); }
      update();
    });
    update();
  }

  /* ---------- Ajustement de points ---------- */
  function setupAdjust() {
    var f = document.querySelector("[data-adjust]");
    if (!f) return;
    var solde = Number(f.dataset.solde);
    var sign = 1;
    var amount = f.querySelector("#montant");
    var motif = f.querySelector("#motif");
    var group = f.querySelector("[data-sign]");
    function update() {
      var m = Number(amount.value) || 0;
      var next = solde + sign * m;
      f.querySelectorAll("[data-out='nouveau']").forEach(function (o) { o.textContent = fmt(Math.max(0, next)); });
      f.querySelectorAll("[data-out='delta']").forEach(function (o) { o.textContent = (sign > 0 ? "+ " : "− ") + fmt(m); });
      var neg = next < 0;
      f.querySelectorAll("[data-neg]").forEach(function (el) { el.hidden = !neg; });
      var ok = m > 0 && !neg && motif.value.trim().length >= 10;
      f.querySelectorAll("[data-submit]").forEach(function (b) { b.disabled = !ok; });
    }
    group.addEventListener("wecce:pick", function (e) { sign = e.detail === "debit" ? -1 : 1; update(); });
    amount.addEventListener("input", update);
    motif.addEventListener("input", update);
    update();
  }

  /* ---------- Signature ---------- */
  function setupSignature() {
    var c = document.querySelector("[data-signature]");
    if (!c) return;
    var ctx = c.getContext("2d");
    var drawing = false, drawn = false;
    var check = document.querySelector("#lu");
    var btn = document.querySelector("[data-sign]");
    function size() {
      var r = c.getBoundingClientRect();
      var dpr = window.devicePixelRatio || 1;
      c.width = r.width * dpr; c.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--ink") || "#2b2622";
    }
    function pos(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    c.addEventListener("pointerdown", function (e) { drawing = true; c.setPointerCapture(e.pointerId); var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    c.addEventListener("pointermove", function (e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); drawn = true; refresh(); });
    c.addEventListener("pointerup", function () { drawing = false; });
    document.querySelectorAll("[data-clear-signature]").forEach(function (b) {
      b.addEventListener("click", function () { ctx.clearRect(0, 0, c.width, c.height); drawn = false; refresh(); });
    });
    function refresh() { if (btn) btn.disabled = !(drawn && check && check.checked); }
    if (check) check.addEventListener("change", refresh);
    if (btn) btn.addEventListener("click", function () {
      burstFrom(btn);
      setTimeout(function () {
        window.wecceState("signe");
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        document.querySelectorAll("[data-when~='signe'] [data-countup]").forEach(countUp);
        toast("Signé. Vos points sont crédités.");
      }, 380);
    });
    size(); refresh();
    window.addEventListener("resize", size);
  }

  /* ---------- Paiement du complément ---------- */
  function setupPay() {
    var f = document.querySelector("[data-pay]");
    if (!f) return;
    var btn = f.querySelector("[data-pay-btn]");
    var label = f.querySelector("[data-pay-label]");
    f.addEventListener("change", function () {
      var m = f.querySelector("input[name=moyen]:checked");
      if (!m) return;
      label.textContent = m.value === "especes" ? "Réserver et payer en boutique" : "Payer " + f.dataset.complement + " F avec " + m.dataset.name;
    });
    var timer = null;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var m = f.querySelector("input[name=moyen]:checked");
      window.scrollTo({ top: 0 });
      if (m && m.value === "especes") {
        window.wecceState("confirme");
        toast("C'est réservé. Vous paierez en espèces au retrait.");
        return;
      }
      window.wecceState("attente");
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (document.body.getAttribute("data-state") !== "attente") return;
        window.wecceState("confirme");
        toast("Paiement confirmé. L'objet vous est réservé.");
        burstFrom(document.querySelector("[data-when='confirme'] .notice"));
      }, 3200);
    });
  }

  /* ---------- Connexion et inscription ---------- */
  function setupAuth() {
    // Compte créé : petite fête
    document.addEventListener("wecce:state", function (e) {
      if (e.detail === "cree") setTimeout(function () { burstFrom(document.querySelector("[data-when='cree'] .welcome__mark")); }, 250);
    });
    // Afficher ou masquer le mot de passe
    document.querySelectorAll(".pw button").forEach(function (b) {
      var inp = b.parentElement.querySelector("input");
      b.addEventListener("click", function () {
        var show = inp.type === "password";
        inp.type = show ? "text" : "password";
        b.textContent = show ? "Masquer" : "Afficher";
        b.setAttribute("aria-pressed", show ? "true" : "false");
      });
    });
    // Champs obligatoires : erreur sous le champ, jamais d'envoi réel
    function check(form) {
      var first = null;
      form.querySelectorAll("[required]").forEach(function (inp) {
        var bad = inp.type === "checkbox" ? !inp.checked : inp.value.trim() === "";
        if (inp.minLength > 0 && inp.value.length < inp.minLength) bad = true;
        var err = form.querySelector("[data-err-for='" + inp.id + "']");
        inp.setAttribute("aria-invalid", bad ? "true" : "false");
        if (err) err.hidden = !bad;
        if (bad && !first) first = inp;
      });
      if (first) first.focus();
      return !first;
    }
    document.querySelectorAll("form[data-auth]").forEach(function (form) {
      form.querySelectorAll("[required]").forEach(function (inp) {
        inp.addEventListener("input", function () {
          if (inp.getAttribute("aria-invalid") !== "true") return;
          var ok = inp.type === "checkbox" ? inp.checked : inp.value.trim() !== "" && inp.value.length >= (inp.minLength > 0 ? inp.minLength : 0);
          if (ok) { inp.setAttribute("aria-invalid", "false"); var err = form.querySelector("[data-err-for='" + inp.id + "']"); if (err) err.hidden = true; }
        });
      });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!check(form)) return;
        var mode = form.dataset.auth;
        if (mode === "login") {
          // Le compte décide de l'espace ; « erreur » simule un mot de passe refusé
          var id = (form.querySelector("#identifiant").value || "").toLowerCase();
          var pw = form.querySelector("#mdp").value;
          if (pw === "erreur") { window.wecceState("erreur"); return; }
          var to = id.indexOf("admin") !== -1 ? "admin/pilotage.html" : id.indexOf("lbc") !== -1 ? "partenaire/rendez-vous.html" : "etudiant/solde.html";
          var btn = form.querySelector("button[type=submit]");
          btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>Connexion…';
          setTimeout(function () { location.href = to; }, 700);
        } else if (mode === "signup") {
          window.wecceState("cree"); window.scrollTo({ top: 0 });
        } else if (mode === "reset") {
          window.wecceState("envoye"); window.scrollTo({ top: 0 });
        }
      });
    });
  }

  /* ---------- Formulaires : jamais d'envoi réel ---------- */
  function setupForms() {
    document.querySelectorAll("form").forEach(function (f) { f.addEventListener("submit", function (e) { e.preventDefault(); }); });
    document.querySelectorAll("[data-go-state]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); window.wecceState(b.dataset.goState); window.scrollTo({ top: 0 }); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    paintIcons();
    setupRipple();
    setupStagger();
    setupReveal();
    setupGroups();
    setupActions();
    setupFilters();
    setupRequires();
    setupMarket();
    setupDeposit();
    setupSteps();
    setupExpertise();
    setupAdjust();
    setupSignature();
    setupPay();
    setupSim();
    setupTips();
    setupForms();
    setupAuth();
    setupStateToggles();
    setupStates();
    setupCountUp();
  });
})();
