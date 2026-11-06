/* =========================================================
   Header, footer iyo beddelka midabka (theme) — bog kasta
   ========================================================= */
(function () {
  "use strict";

  const NAV = [
    { href: "index.html",       key: "maanta",     label: "Maanta",         en: "Today" },
    { href: "wararka.html",     key: "wararka",    label: "Wararka",        en: "News" },
    { href: "fahanka-fed.html", key: "fahanka",    label: "Fahanka FED",    en: "Learn the Fed" },
    { href: "taariikhda.html",  key: "taariikhda", label: "Taariikhda FED", en: "Fed History" },
    { href: "ku-saabsan.html",  key: "ku-saabsan", label: "Ku saabsan",     en: "About" }
  ];

  const ACCENTS = [
    { name: "Buluug", value: "#4C9AFF", ink: "#1D4ED8" },
    { name: "Cagaar", value: "#3DD68C", ink: "#047857" },
    { name: "Oranji", value: "#F5A524", ink: "#B45309" },
    { name: "Guduud", value: "#B48CFF", ink: "#6D28D9" },
    { name: "Casaan", value: "#FF7A6B", ink: "#B91C1C" }
  ];

  // ---------- Kaydinta doorashada qofka (browser-kiisa kaliya) ----------
  function load(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  // ---------- Luqadda (Soomaali / English) ----------
  const LANG = load("xc-lang", "so") === "en" ? "en" : "so";
  window.I18N = {
    lang: LANG,
    tx: function (so, en) { return LANG === "en" ? en : so; }
  };
  document.documentElement.setAttribute("lang", LANG);
  document.documentElement.setAttribute("data-lang", LANG);

  function applyTheme() {
    const root = document.documentElement;
    const mode = load("xc-mode", "dark");
    const resolved = mode === "auto"
      ? (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
      : mode;
    root.setAttribute("data-theme", resolved);
    const accent = load("xc-accent", "#4C9AFF");
    const found = ACCENTS.find(function (a) { return a.value === accent; }) || ACCENTS[0];
    root.style.setProperty("--accent", found.value);
    // Iftiinka, qoraalka midabka leh wuxuu u baahan yahay midab ka madow si loo akhriyo
    root.style.setProperty("--accent-ink", resolved === "light" ? found.ink : found.value);
    const sizes = { s: 0.93, m: 1, l: 1.1 };
    root.style.setProperty("--font-scale", sizes[load("xc-size", "m")] || 1);
  }
  applyTheme();

  const icon = {
    logo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="15 7 21 7 21 13"/></svg>',
    palette: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r="1.5"/><circle cx="17.5" cy="10.5" r="1.5"/><circle cx="8.5" cy="7.5" r="1.5"/><circle cx="6.5" cy="12.5" r="1.5"/><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 10c0-4.4-4.5-8-10-8z"/></svg>'
  };

  function buildHeader(active, showStatus) {
    const links = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (n.key === active ? ' aria-current="page"' : "") + ">" + (LANG === "en" ? n.en : n.label) + "</a>";
    }).join("");
    return (
      '<div class="wrap header-row" style="position:relative">' +
        '<a href="index.html" class="brand" aria-label="' + window.SITE.name + '">' +
          '<span class="brand-mark">' + icon.logo + '</span>' +
          '<span class="brand-name">Xogta Crypto <span class="accent">24/7</span></span>' +
        "</a>" +
        '<nav class="main-nav" aria-label="Menu-ga">' + links + "</nav>" +
        '<div class="header-tools">' +
          (showStatus ? '<div class="status" id="status" role="status" aria-live="polite"><span class="dot"></span><span id="status-text">' + (LANG === "en" ? "Connecting…" : "Xiriirinaya…") + "</span></div>" : "") +
          '<div class="lang-switch" role="group" aria-label="Luqadda / Language">' +
            '<button type="button" data-lang-set="so" aria-pressed="' + (LANG === "so") + '">SO</button>' +
            '<button type="button" data-lang-set="en" aria-pressed="' + (LANG === "en") + '">EN</button>' +
          "</div>" +
          '<button type="button" class="icon-btn" id="theme-btn" aria-label="' + (LANG === "en" ? "Change website colours" : "Beddel midabka website-ka") + '" aria-expanded="false" aria-controls="theme-panel">' + icon.palette + "</button>" +
        "</div>" +
        buildPanel() +
      "</div>" +
      (showStatus ? '<div class="ticker" aria-label="Qiimaha tooska ah"><div class="ticker-track" id="ticker-track"></div></div>' : "")
    );
  }

  function buildPanel() {
    const sw = ACCENTS.map(function (a) {
      return '<button type="button" class="swatch" data-accent="' + a.value + '" aria-label="' + a.name + '" style="background:' + a.value + '"></button>';
    }).join("");
    const T = window.I18N.tx;
    return (
      '<div class="theme-panel" id="theme-panel" hidden>' +
        "<h2>" + T("Midabka website-ka", "Website colours") + "</h2>" +
        '<div><div class="label">' + T("Midabka muhiimka ah", "Accent colour") + '</div><div class="swatches">' + sw + "</div></div>" +
        '<div><div class="label">' + T("Asalka", "Background") + '</div><div class="seg">' +
          '<button type="button" data-mode="dark">' + T("Mugdi", "Dark") + "</button>" +
          '<button type="button" data-mode="light">' + T("Iftiin", "Light") + "</button>" +
          '<button type="button" data-mode="auto">Auto</button>' +
        "</div></div>" +
        '<div><div class="label">' + T("Cabbirka qoraalka", "Text size") + '</div><div class="seg">' +
          '<button type="button" data-size="s" style="font-size:.8rem">' + T("A yar", "Small") + "</button>" +
          '<button type="button" data-size="m">A</button>' +
          '<button type="button" data-size="l" style="font-size:1.05rem">' + T("A weyn", "Large") + "</button>" +
        "</div></div>" +
      "</div>"
    );
  }

  function syncPanel() {
    const accent = load("xc-accent", "#4C9AFF");
    const mode = load("xc-mode", "dark");
    const size = load("xc-size", "m");
    document.querySelectorAll("[data-accent]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.accent === accent)); });
    document.querySelectorAll("[data-mode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); });
    document.querySelectorAll("[data-size]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.size === size)); });
  }

  function wirePanel() {
    const btn = document.getElementById("theme-btn");
    const panel = document.getElementById("theme-panel");
    if (!btn || !panel) return;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    panel.addEventListener("click", function (e) {
      e.stopPropagation();
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.accent) save("xc-accent", t.dataset.accent);
      if (t.dataset.mode) save("xc-mode", t.dataset.mode);
      if (t.dataset.size) save("xc-size", t.dataset.size);
      applyTheme();
      syncPanel();
    });
    document.addEventListener("click", function () {
      if (!panel.hidden) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
    syncPanel();
  }

  function buildFooter() {
    const s = window.SITE;
    const socialNames = { x: "X / Twitter", telegram: "Telegram", youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook", instagram: "Instagram" };
    const socials = Object.keys(socialNames).filter(function (k) { return s.social[k]; }).map(function (k) {
      return '<a href="' + s.social[k] + '" rel="noopener">' + socialNames[k] + "</a>";
    }).join("");
    const T = window.I18N.tx;
    return (
      '<div class="wrap">' +
        '<div class="footer-grid">' +
          '<div><div class="brand-name">Xogta Crypto <span class="accent">24/7</span></div>' +
            '<p class="muted small">' + T("Xogta FED-ka, crypto iyo suuqyada caalamka oo af-Soomaali ah. Aasaasaha: ", "Fed data, crypto and global markets in Somali and English. Founder: ") + s.founder.name + ".</p></div>" +
          "<div><b>" + T("Xogta", "Data") + '</b><a href="index.html">' + T("Maanta", "Today") + '</a><a href="wararka.html">' + T("Wararka", "News") + '</a><a href="taariikhda.html">' + T("Taariikhda FED", "Fed History") + "</a></div>" +
          "<div><b>" + T("Waxbarasho", "Learn") + '</b><a href="fahanka-fed.html">' + T("Fahanka FED", "Learn the Fed") + "</a></div>" +
          "<div><b>" + T("Shirkadda", "Company") + '</b><a href="ku-saabsan.html">' + T("Ku saabsan", "About") + "</a>" + socials +
            (s.email ? '<span class="small muted" style="display:block;padding:4px 0">' + s.email + "</span>" : "") + "</div>" +
        "</div>" +
        '<div class="footer-bottom"><span>' + T("Tani ma aha talo maaliyadeed. Crypto waa khatar sare; go\'aankaaga adiga ayaa mas\'uul ka ah.", "This is not financial advice. Crypto is high risk; you are responsible for your own decisions.") + "</span>" +
          "<span>© " + new Date().getFullYear() + " " + s.name + "</span></div>" +
      "</div>"
    );
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (LANG === "en") {
      const t = document.querySelector('meta[name="title-en"]');
      if (t) document.title = t.content;
      // Qoraalka bogga: <el data-en="English">Soomaali</el>
      document.querySelectorAll("[data-en]").forEach(function (el) { el.innerHTML = el.getAttribute("data-en"); });
      document.querySelectorAll("[data-en-label]").forEach(function (el) { el.setAttribute("aria-label", el.getAttribute("data-en-label")); });
    }
    const header = document.querySelector("[data-header]");
    if (header) {
      header.className = "site-header";
      header.innerHTML = buildHeader(header.dataset.header, header.hasAttribute("data-live"));
      wirePanel();
      header.querySelectorAll("[data-lang-set]").forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.dataset.langSet === LANG) return;
          save("xc-lang", b.dataset.langSet);
          location.reload();
        });
      });
    }
    const footer = document.querySelector("[data-footer]");
    if (footer) {
      footer.className = "site-footer";
      footer.innerHTML = buildFooter();
    }
  });

  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    if (mq.addEventListener) mq.addEventListener("change", function () { if (load("xc-mode", "dark") === "auto") applyTheme(); });
  }
})();
