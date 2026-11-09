/* =========================================================
   Header, footer iyo beddelka midabka (theme) — bog kasta
   ========================================================= */
(function () {
  "use strict";

  const NAV = [
    { href: "index.html",       key: "maanta",     label: "Maanta",         en: "Today" },
    { href: "wararka.html",     key: "wararka",    label: "Wararka",        en: "News" },
    { href: "kalandarka.html",  key: "kalandarka", label: "Kalandarka",     en: "Calendar" },
    { href: "charts.html",      key: "charts",     label: "Charts",         en: "Charts" },
    { href: "lacagta.html",     key: "lacagta",    label: "Lacagta",        en: "Money Flow", nu: 1, sub: [
      ["#sec-flow", "Lacagta soo gashay / baxday", "Money in / out"], ["#sec-ls", "Long / Short", "Long / Short"], ["#sec-tr", "Ganacsiyada waaweyn", "Large trades"],
      ["#sec-vol", "Volume (futures / spot)", "Volume (futures / spot)"], ["#sec-cex", "Exchange-yada: soo galay / baxay", "Exchange inflows / outflows"], ["#sec-heat", "Heatmap", "Heatmap"], ["#lq-side", "Coins (1,000)", "Coins (1,000)"], ["#lq-faq", "Su'aalo", "FAQ"]] },
    { href: "taariikhda.html",  key: "taariikhda", label: "Taariikhda FED", en: "Fed History" },
    { href: "fahanka-fed.html", key: "fahanka",    label: "Fahanka FED",    en: "Learn the Fed" },
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
    logo: '<svg width="40" height="40" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#0B1220"/><mask id="xm-h" maskUnits="userSpaceOnUse" x="0" y="0" width="64" height="64"><rect width="64" height="64" fill="#fff"/><polygon points="14.00,51.00 26.00,51.00 33.20,39.60 21.20,39.60" fill="#000" stroke="#000" stroke-width="3.4" stroke-linejoin="miter"/><polygon points="22.40,37.70 34.40,37.70 41.60,26.30 29.60,26.30" fill="#000" stroke="#000" stroke-width="3.4" stroke-linejoin="miter"/><polygon points="30.80,24.40 42.80,24.40 50.00,13.00 38.00,13.00" fill="#000" stroke="#000" stroke-width="3.4" stroke-linejoin="miter"/></mask><polygon points="14,13 26,13 50,51 38,51" fill="#5C79B8" mask="url(#xm-h)"/><polygon points="14.00,51.00 26.00,51.00 33.20,39.60 21.20,39.60" fill="#2F6BFF"/><polygon points="22.40,37.70 34.40,37.70 41.60,26.30 29.60,26.30" fill="#3FB8FF"/><polygon points="30.80,24.40 42.80,24.40 50.00,13.00 38.00,13.00" fill="#22E39A"/></svg>',
    gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    sun: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    screen: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    chev: '<svg class="chev-ic" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  // ---------- Menu-ga "Ku saabsan" (mega menu) ----------
  function buildAbout() {
    const T = window.I18N.tx, s = window.SITE;
    function item(href, title, sub) {
      return '<a class="mm-item" href="' + href + '"><span class="mm-t">' + title + '</span><span class="mm-s">' + sub + "</span></a>";
    }
    const names = { x: "X / Twitter", telegram: "Telegram", youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook", instagram: "Instagram" };
    const soc = Object.keys(names).filter(function (k) { return s.social[k]; });
    const follow = soc.length
      ? soc.map(function (k) { return item(s.social[k] + '" rel="noopener', names[k] + (k === "x" && s.x_handle ? " · " + s.x_handle : ""), T("Ka raac ", "Follow on ") + names[k]); }).join("")
      : item("ku-saabsan.html", "Telegram", T("Dhawaan", "Coming soon"));
    return (
      '<div class="mega" id="mega-about" hidden>' +
        '<div class="wrap mega-inner">' +
          '<a class="mega-head" href="ku-saabsan.html"><span>' + T("Ku saabsan Xogta Crypto 24/7", "About Xogta Crypto 24/7") + '</span><span class="mega-arrow">' + icon.arrow + "</span></a>" +
          '<div class="mega-cols">' +
            '<div><div class="mm-label">' + T("GUUD MAR", "OVERVIEW") + "</div>" +
              item("ku-saabsan.html#hadaf", T("Hadafkayaga", "Our mission"), T("Xogta suuqa oo dhan, hal meel", "All market data, in one place")) +
              item("ku-saabsan.html#aasaasaha", T("Aasaasayaasha", "Founders"), T("Kooxda ka dambeysa Xogta Crypto 24/7", "The team behind Xogta Crypto 24/7")) +
            "</div>" +
            '<div><div class="mm-label">' + T("WAXBARASHO", "LEARN") + "</div>" +
              item("fahanka-fed.html", T("Fahanka FED", "Learn the Fed"), T("8 cashar oo bilaash ah", "8 free lessons")) +
              item("taariikhda.html", T("Taariikhda FED", "Fed history"), T("Sannad kasta tan iyo 1954", "Every year since 1954")) +
            "</div>" +
            '<div class="mm-follow"><div class="mm-label">' + T("NA RAAC", "FOLLOW US") + "</div>" + follow + "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function buildHeader(active, showStatus) {
    const T = window.I18N.tx;
    const links = NAV.map(function (n) {
      const label = LANG === "en" ? n.en : n.label;
      if (n.key === "ku-saabsan") {
        return '<button type="button" class="nav-drop" id="about-btn" aria-expanded="false" aria-controls="mega-about"' + (n.key === active ? ' aria-current="page"' : "") + ">" + label + icon.chev + "</button>";
      }
      const a = '<a href="' + n.href + '"' + (n.key === active ? ' aria-current="page"' : "") + ">" + label + (n.nu ? ' <span class="nbadge">' + (LANG === "en" ? "NEW" : "CUSUB") + "</span>" : "") + (n.sub ? icon.chev : "") + "</a>";
      if (!n.sub) return a;
      return '<span class="nav-dd">' + a + '<span class="nav-ddm" role="menu">' + n.sub.map(function (x) { return '<a role="menuitem" href="' + n.href + x[0] + '">' + (LANG === "en" ? x[2] : x[1]) + "</a>"; }).join("") + "</span></span>";
    }).join("");
    return (
      '<div class="wrap header-row" style="position:relative">' +
        '<a href="index.html" class="brand" aria-label="' + window.SITE.name + '">' +
          '<span class="brand-logo">' + icon.logo + '</span>' +
          '<span class="brand-wm"><span>XOGTA</span><em>CRYPTO 24/7</em></span>' +
        "</a>" +
        '<nav class="main-nav" aria-label="Menu">' + links + "</nav>" +
        '<div class="header-tools">' +
          (showStatus ? '<div class="status" id="status" role="status" aria-live="polite"><span class="dot"></span><span id="status-text">' + T("Xiriirinaya…", "Connecting…") + "</span></div>" : "") +
          '<button type="button" class="icon-btn lang-btn" data-lang-set="' + (LANG === "en" ? "so" : "en") + '" aria-label="' + T("Switch to English", "U beddel af-Soomaali") + '">' + (LANG === "en" ? "SO" : "EN") + "</button>" +
          '<button type="button" class="icon-btn" id="theme-btn" aria-label="' + T("Dejinta", "Settings") + '" aria-expanded="false" aria-controls="theme-panel">' + icon.gear + "</button>" +
          '<button type="button" class="icon-btn menu-btn" id="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="drawer">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>' +
        "</div>" +
        buildPanel() +
      "</div>" +
      buildAbout() +
      (showStatus ? '<div class="ticker" aria-label="Live"><div class="ticker-track" id="ticker-track"></div></div>' : "")
    );
  }

  // ---------- Dejinta (menu yar) ----------
  function buildPanel() {
    const T = window.I18N.tx;
    const sw = ACCENTS.map(function (a) {
      return '<button type="button" class="dot-sw" data-accent="' + a.value + '" aria-label="' + a.name + '" style="background:' + a.value + '"></button>';
    }).join("");
    function row(label, ctrl) { return '<div class="set-row"><span>' + label + "</span>" + ctrl + "</div>"; }
    return (
      '<div class="theme-panel" id="theme-panel" role="dialog" aria-label="' + T("Dejinta", "Settings") + '" hidden>' +
        row(T("Luqadda", "Language"), '<div class="pill-seg"><button type="button" data-lang-set="so" aria-pressed="' + (LANG === "so") + '">SO</button><button type="button" data-lang-set="en" aria-pressed="' + (LANG === "en") + '">EN</button></div>') +
        row(T("Muuqaalka", "Theme"), '<div class="pill-seg">' +
          '<button type="button" data-mode="light" aria-label="' + T("Iftiin", "Light") + '">' + icon.sun + "</button>" +
          '<button type="button" data-mode="dark" aria-label="' + T("Mugdi", "Dark") + '">' + icon.moon + "</button>" +
          '<button type="button" data-mode="auto" aria-label="' + T("Sida qalabkaaga", "System") + '">' + icon.screen + "</button></div>") +
        row(T("Midabka", "Colour"), '<div class="dots">' + sw + "</div>") +
        row(T("Qoraalka", "Text size"), '<div class="pill-seg">' +
          '<button type="button" data-size="s" aria-label="' + T("Yar", "Small") + '" style="font-size:.75rem">A</button>' +
          '<button type="button" data-size="m" aria-label="' + T("Caadi", "Normal") + '">A</button>' +
          '<button type="button" data-size="l" aria-label="' + T("Weyn", "Large") + '" style="font-size:1.1rem">A</button></div>') +
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

  function popup(btn, panel, others) {
    function close() { if (!panel.hidden) { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); } }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      others.forEach(function (f) { f(); });
      panel.hidden = !panel.hidden;
      btn.setAttribute("aria-expanded", String(!panel.hidden));
    });
    panel.addEventListener("click", function (e) { e.stopPropagation(); });
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { close(); btn.focus(); } });
    return close;
  }

  function wirePanel() {
    const btn = document.getElementById("theme-btn");
    const panel = document.getElementById("theme-panel");
    const ab = document.getElementById("about-btn");
    const mega = document.getElementById("mega-about");
    if (!btn || !panel) return;
    const closers = [];
    const closeSet = popup(btn, panel, closers);
    if (ab && mega) {
      const closeMega = popup(ab, mega, [closeSet]);
      closers.push(closeMega);
      mega.addEventListener("click", function (e) { if (e.target.closest("a")) closeMega(); });
    }
    panel.addEventListener("click", function (e) {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.accent) save("xc-accent", t.dataset.accent);
      if (t.dataset.mode) save("xc-mode", t.dataset.mode);
      if (t.dataset.size) save("xc-size", t.dataset.size);
      applyTheme();
      syncPanel();
    });
    syncPanel();
  }

  // ---------- Menu-ga taleefanka (☰ -> dhinaca midig) ----------
  function buildDrawer(active) {
    const T = window.I18N.tx, s = window.SITE;
    const big = NAV.map(function (n) {
      return '<a class="dr-big" href="' + n.href + '"' + (n.key === active ? ' aria-current="page"' : "") + ">" + (LANG === "en" ? n.en : n.label) + (n.nu ? ' <span class="nbadge">' + (LANG === "en" ? "NEW" : "CUSUB") + "</span>" : "") + "</a>" +
        (n.sub ? '<div class="dr-sub">' + n.sub.map(function (x) { return '<a href="' + n.href + x[0] + '">' + (LANG === "en" ? x[2] : x[1]) + "</a>"; }).join("") + "</div>" : "");
    }).join("");
    function sec(title, links) {
      return '<div class="dr-label">' + title + "</div>" + links.map(function (l) {
        return '<a class="dr-link" href="' + l[0] + '"' + (/^https?:/.test(l[0]) ? ' target="_blank" rel="noopener"' : "") + ">" + l[1] + "</a>";
      }).join("");
    }
    const follow = [];
    if (s.social.telegram) follow.push([s.social.telegram, "Telegram · " + T("kooxda", "group")]);
    if (s.social.x) follow.push([s.social.x, "X · " + (s.x_handle || "")]);
    return (
      '<div class="drawer-bg" id="drawer-bg" hidden></div>' +
      '<aside class="drawer" id="drawer" aria-label="Menu" hidden>' +
        '<button type="button" class="icon-btn dr-close" id="drawer-close" aria-label="' + T("Xir", "Close") + '">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<nav class="dr-main">' + big + "</nav>" +
        '<div class="dr-sep"></div>' +
        sec(T("XOGTA", "DATA"), [["index.html#fed", T("Go'aannada FED", "Fed decisions")], ["index.html#crypto", T("Suuqyada 24/7", "Markets 24/7")], ["wararka.html", T("Filashada & wararka", "Expectations & news")]]) +
        sec(T("WAXBARASHO", "LEARN"), [["fahanka-fed.html", T("Koorsada FED · 8 cashar", "Fed course · 8 lessons")], ["taariikhda.html", T("Taariikhda tan iyo 1954", "History since 1954")]]) +
        (follow.length ? sec(T("NALA SOCO", "FOLLOW US"), follow) : "") +
        '<div class="dr-label">' + T("DEJINTA", "SETTINGS") + "</div>" +
        '<div class="dr-set"><span>' + T("Luqadda", "Language") + '</span><div class="pill-seg">' +
          '<button type="button" data-lang-set="so" aria-pressed="' + (LANG === "so") + '">SO</button>' +
          '<button type="button" data-lang-set="en" aria-pressed="' + (LANG === "en") + '">EN</button></div></div>' +
        '<div class="dr-set"><span>' + T("Muuqaalka", "Theme") + '</span><div class="pill-seg">' +
          '<button type="button" data-dmode="light" aria-label="Light">' + icon.sun + "</button>" +
          '<button type="button" data-dmode="dark" aria-label="Dark">' + icon.moon + "</button>" +
          '<button type="button" data-dmode="auto" aria-label="Auto">' + icon.screen + "</button></div></div>" +
        '<p class="dr-foot">© ' + new Date().getFullYear() + " " + s.name + "</p>" +
      "</aside>"
    );
  }
  function wireDrawer() {
    const d = document.getElementById("drawer"), bg = document.getElementById("drawer-bg"), btn = document.getElementById("menu-btn");
    if (!d || !btn) return;
    function sync() {
      const m = load("xc-mode", "dark");
      d.querySelectorAll("[data-dmode]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.dmode === m)); });
    }
    function open() { d.hidden = false; bg.hidden = false; requestAnimationFrame(function () { d.classList.add("open"); bg.classList.add("open"); }); btn.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; sync(); }
    function close() { d.classList.remove("open"); bg.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; setTimeout(function () { d.hidden = true; bg.hidden = true; }, 220); }
    btn.addEventListener("click", open);
    bg.addEventListener("click", close);
    document.getElementById("drawer-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !d.hidden) close(); });
    d.addEventListener("click", function (e) {
      const a = e.target.closest("a"); if (a) { close(); return; }
      const m = e.target.closest("[data-dmode]"); if (m) { save("xc-mode", m.dataset.dmode); applyTheme(); sync(); return; }
      const l = e.target.closest("[data-lang-set]"); if (l && l.dataset.langSet !== LANG) { save("xc-lang", l.dataset.langSet); location.reload(); }
    });
  }

  function buildFooter() {
    const s = window.SITE;
    const T = window.I18N.tx;
    const ico = {
      x: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/>',
      telegram: '<path d="M21.5 4.5 2.9 11.7c-1 .4-1 1.2-.2 1.5l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.3-.5-1.9-1.4-1.5zM9.6 14.4l8.4-7.6-6.9 8.6-.3 3.2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>',
      tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46M14 3c.4 2.6 2.2 4.4 5 4.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      facebook: '<path d="M14 8h2.5V4.5H14c-2.5 0-4 1.6-4 4V11H7.5v3.5H10V21h3.5v-6.5H16l.5-3.5h-3V8.8c0-.5.2-.8.5-.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
      instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/>'
    };
    const names = { x: "X", telegram: "Telegram", youtube: "YouTube", tiktok: "TikTok", facebook: "Facebook", instagram: "Instagram" };
    const socials = Object.keys(ico).filter(function (k) { return s.social[k]; }).map(function (k) {
      return '<a class="fs-ic" href="' + s.social[k] + '" target="_blank" rel="noopener" aria-label="' + names[k] + '" title="' + names[k] + '"><svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">' + ico[k] + "</svg></a>";
    }).join("");
    const col = function (title, links) {
      return '<div class="fcol"><b>' + title + "</b>" + links.map(function (l) {
        return '<a href="' + l[0] + '"' + (/^https?:/.test(l[0]) ? ' target="_blank" rel="noopener"' : "") + ">" + l[1] + (l[2] ? ' <span class="fbadge">' + l[2] + "</span>" : "") + "</a>";
      }).join("") + "</div>";
    };
    const logo = icon.logo.replace(/xm-h/g, "xm-f").replace('width="40" height="40"', 'width="48" height="48"');
    return (
      '<div class="wrap">' +
        '<div class="ff-grid">' +
          '<div class="ff-brand">' +
            '<a class="ff-logo" href="index.html">' + logo + '<span class="ff-wm"><b>XOGTA</b><span>CRYPTO 24/7</span></span></a>' +
            '<p class="ff-tag">' + T("Fed, crypto & suuqyada — af-Soomaali.", "Fed, crypto & markets — in Somali.") + "</p>" +
            '<div class="ff-social">' + socials + "</div>" +
          "</div>" +
          '<div class="ff-cols">' +
            col(T("Xogta", "Data"), [["index.html", T("Maanta", "Today")], ["kalandarka.html", T("Kalandarka", "Calendar")], ["charts.html", T("Charts", "Charts")], ["lacagta.html", T("Lacagta", "Money Flow"), T("cusub", "new")], ["wararka.html", T("Wararka", "News")], ["taariikhda.html", T("Taariikhda FED", "Fed history")]]) +
            col(T("Waxbarasho", "Learn"), [["fahanka-fed.html", T("Fahanka FED", "Learn the Fed")], ["taariikhda.html", T("Go'aannadii hore", "Past decisions")]]) +
            col(T("Bulshada", "Community"), [[s.social.telegram || "#", T("Kooxda Telegram", "Telegram group")], [s.social.x || "#", s.x_handle || "X"], [s.founder.x || "#", s.founder.handle || s.founder.name]]) +
            col(T("Ku saabsan", "About"), [["ku-saabsan.html", T("Ku saabsan", "About us")], ["ku-saabsan.html#aasaasaha", T("Aasaasayaasha", "Founders")]]) +
          "</div>" +
        "</div>" +
        '<div class="ff-bottom"><span>© ' + new Date().getFullYear() + " " + s.name + ". " + T("Xuquuqda oo dhan way dhowran tahay.", "All rights reserved.") + "</span>" +
          '<span class="ff-disc">' + T("Tani ma aha talo maaliyadeed. Crypto waa khatar sare; go\'aankaaga adiga ayaa mas\'uul ka ah.", "This is not financial advice. Crypto is high risk; you are responsible for your own decisions.") + "</span></div>" +
      "</div>" +
      '<button type="button" class="to-top" aria-label="' + T("Kor u noqo", "Back to top") + '" onclick="window.scrollTo({top:0,behavior:\'smooth\'})"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>'
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
      document.body.insertAdjacentHTML("beforeend", buildDrawer(header.dataset.header));
      wireDrawer();
      wirePanel();
      header.querySelectorAll("[data-lang-set]").forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
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
    // Tirada booqashada (dal + booqde gaar ah) — magac iyo lambar lama kaydiyo
    try {
      const pg = (header && header.dataset.header) || (location.pathname.replace(/^\/|\.html$/g, "") || "maanta");
      if (pg !== "admin" && !/^(localhost|127\.)/.test(location.hostname)) {
        let vid = load("xc-vid", "");
        if (!vid) { vid = Math.random().toString(36).slice(2) + Date.now().toString(36); save("xc-vid", vid); }
        fetch("/api/member?op=track", { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ p: pg, v: vid }) }).catch(function () {});
      }
    } catch (e) { /* ignore */ }
  });

  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    if (mq.addEventListener) mq.addEventListener("change", function () { if (load("xc-mode", "dark") === "auto") applyTheme(); });
  }
})();

/* =========================================================
   KAARKA KU BIIR (X + Telegram) — gees ayuu ka soo baxaa marka qofku akhriyo
   - 35 ilbiriqsi kadib (ama marka uu bogga kala badh dhaafo + 15 ilbiriqsi)
   - Qofku wuu xiri karaa (×) → 3 maalin kadib ayuu mar kale soo baxaa
   - Haddii labada tallaabo horay loo sameeyay (xc-xf + xc-tg) → mar dambe ma soo baxo
   ========================================================= */
(function () {
  "use strict";
  const g = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const s = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
  document.addEventListener("DOMContentLoaded", function () {
    const hdr = document.querySelector("[data-header]");
    if (hdr && hdr.dataset.header === "admin") return;
    if (g("xc-xf") === "1" && g("xc-tg") === "1") return;
    if (Date.now() - (+g("xc-join-x") || 0) < 864e5) return; // maalintii hal mar
    const S = window.SITE || {}, soc = S.social || {};
    const XURL = soc.x || "https://x.com/Xogtacrypto24", TGURL = soc.telegram || "https://t.me/Xogtacrypto24_7";
    const XH = (S.x_handle || "@Xogtacrypto24").replace(/^@?/, "@");
    const EN = g("xc-lang") === "en", T = (so, en) => (EN ? en : so);
    const t0 = Date.now();
    let shown = false;
    function show() {
      if (shown || document.getElementById("xg") || document.getElementById("xj")) return;
      shown = true; s("xc-join-x", String(Date.now()));
      const xd = g("xc-xf") === "1", td = g("xc-tg") === "1";
      const OK = '<svg viewBox="0 0 24 24" width="15" height="15"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      const XI = '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
      const TI = '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21.9 4.3 18.6 19.8c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.2-8.3c.4-.4-.1-.6-.6-.2L6 13.4 1.1 11.9c-1.1-.3-1.1-1.1.2-1.6L20.5 2.9c.9-.3 1.7.2 1.4 1.4z"/></svg>';
      const el = document.createElement("div");
      el.id = "xj"; el.className = "xj"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", T("Ku biir bulshada", "Join the community"));
      el.innerHTML = '<button class="xj-x" type="button" aria-label="' + T("Xir", "Close") + '">×</button>' +
        '<b class="xj-t">' + T("Ku biir bulshada", "Join the community") + '</b>' +
        '<div class="xj-b"><a class="xj-l xj-xb' + (xd ? " ok" : "") + '" href="' + XURL + '" target="_blank" rel="noopener">' + (xd ? OK + " " + T("Mahadsanid!", "Thank you!") : XI + " Follow X") + '</a>' +
        '<a class="xj-l xj-tb' + (td ? " ok" : "") + '" href="' + TGURL + '" target="_blank" rel="noopener">' + (td ? OK + " " + T("Mahadsanid!", "Thank you!") : TI + " " + T("Ku biir Telegram", "Join Telegram")) + '</a></div>';
      document.body.appendChild(el);
      requestAnimationFrame(() => el.classList.add("on"));
      const close = () => { el.classList.remove("on"); setTimeout(() => el.remove(), 300); };
      el.querySelector(".xj-x").addEventListener("click", close);
      const mark = (sel, key, txt) => el.querySelector(sel).addEventListener("click", () => setTimeout(() => {
        s(key, "1"); const a = el.querySelector(sel); a.classList.add("ok"); a.innerHTML = OK + " " + txt;
        if (g("xc-xf") === "1" && g("xc-tg") === "1") setTimeout(() => { el.classList.remove("on"); setTimeout(() => el.remove(), 300); }, 1500);
      }, 1200));
      mark(".xj-xb", "xc-xf", T("Mahadsanid!", "Thank you!"));
      mark(".xj-tb", "xc-tg", T("Mahadsanid!", "Thank you!"));
    }
    setTimeout(show, 35000);
    window.addEventListener("scroll", function onS() {
      const h = document.documentElement, p = (h.scrollTop + innerHeight) / Math.max(1, h.scrollHeight);
      if (p > 0.5 && Date.now() - t0 > 15000) { window.removeEventListener("scroll", onS); show(); }
    }, { passive: true });
    window.XCJoin = { show };
  });
})();
