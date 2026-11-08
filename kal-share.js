/* =========================================================
   KALANDARKA — SAWIR + X SHARE
   1) "Xogta xigta" (countdown) — had iyo jeer xogta xigta ee ●●●
   2) "7-da maalmood ee soo socda" — jadwalka toddobaadka
   Sawirku waa 1200×675 (X/Twitter), PNG 2×, logo + © Xogta Crypto 24/7
   ========================================================= */
(function () {
  "use strict";
  if (!window.FedCore || !window.FED_CAL) return;
  const F = window.FedCore, T = F.T;
  const host = document.getElementById("kh-act") || document.getElementById("fh-act");
  if (!host) return;
  // Bogga Kalandarka: xogta kalandar.js · Bogga hore: halkan ayaa laga dhisayaa (fed-data.js)
  const K = window.XCKal || (function () {
    const CAL = window.FED_CAL, KIND = { infl: T("Sicir-barar", "Inflation"), jobs: T("Shaqo", "Jobs"), growth: T("Koboc", "Growth"), fed: "FED" };
    let API = null; F.load().then(function (a) { API = a; });
    function events() {
      const items = CAL.upcoming.map(function (x) { return { name: F.EN && x.name_en ? x.name_en : x.name, time: x.time, kind: x.kind || "infl", lvl: x.lvl || 2, src: x.src || "", url: x.url || "", fomc: false, code: x.code || "", period: x.period || "" }; });
      CAL.meetings.forEach(function (m) { items.push({ name: T("Go'aanka FED (FOMC)", "Fed decision (FOMC)") + (m.sep ? T(" + saadaasha", " + projections") : ""), time: m.time, kind: "fed", lvl: 3, src: "Federal Reserve", url: "", fomc: true }); });
      return items.sort(function (a, b) { return new Date(a.time) - new Date(b.time); });
    }
    function shiftM(ym, d) { let y = +ym.slice(0, 4), m = +ym.slice(5, 7) + d; while (m < 1) { m += 12; y--; } while (m > 12) { m -= 12; y++; } return y + "-" + F.pad(m); }
    return { events: events, KIND: KIND, KCOL: { infl: "#F2A93B", jobs: "#5B9DFF", growth: "#1FBF86", fed: "#D97706" }, api: function () { return API; }, shiftM: shiftM };
  })();

  const I = {
    cam: '<svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    cal: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="fill"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  };
  host.innerHTML =
    '<button class="kh-ib" type="button" data-k="menu" aria-haspopup="true" aria-label="' + T("Sawir", "Image") + '">' + I.cam + "<span>" + T("Sawir", "Image") + "</span></button>" +
    '<div class="xcc-menu kh-menu" role="menu" hidden>' +
    '<div class="kh-mh">' + T("Xogta xigta (countdown)", "Next release (countdown)") + "</div>" +
    '<button type="button" data-k="dl" data-v="next">' + I.dl + T("Soo deji sawirka", "Download image") + "</button>" +
    '<button type="button" data-k="copy" data-v="next">' + I.copy + T("Koobi garee sawirka", "Copy image") + "</button>" +
    '<button type="button" data-k="x" data-v="next">' + I.x + T("Ku wadaag X", "Share on X") + "</button>" +
    "<hr>" +
    '<div class="kh-mh">' + T("7-da maalmood ee soo socda", "Next 7 days") + "</div>" +
    '<button type="button" data-k="dl" data-v="week">' + I.cal + T("Soo deji jadwalka", "Download schedule") + "</button>" +
    '<button type="button" data-k="x" data-v="week">' + I.x + T("Jadwalka ku wadaag X", "Share schedule on X") + "</button>" +
    "</div>";

  // ---------- Waqtiga (ET / UTC / Muqdisho / adiga) ----------
  function zoned(t, tz) {
    const p = {};
    new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short" })
      .formatToParts(t).forEach(function (x) { p[x.type] = x.value; });
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
    return { y: +p.year, mo: +p.month - 1, d: +p.day, hm: F.pad(+p.hour % 24) + ":" + p.minute, wd: wd };
  }
  const userTZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } })();
  function cityOf(tz) { return tz.split("/").pop().replace(/_/g, " "); }
  function timeChips(t) {
    const out = [[zoned(t, "America/New_York").hm, "ET · " + T("Washington", "Washington")], [zoned(t, "UTC").hm, "UTC"], [zoned(t, "Africa/Mogadishu").hm, T("Muqdisho", "Mogadishu")]];
    const skip = ["UTC", "Etc/UTC", "America/New_York", "Africa/Mogadishu", "Africa/Nairobi", "Africa/Addis_Ababa", "Africa/Djibouti"];
    if (skip.indexOf(userTZ) === -1 && zoned(t, userTZ).hm !== out[1][0]) out.push([zoned(t, userTZ).hm, cityOf(userTZ)]);
    return out;
  }
  function longDate(t) { const z = zoned(t, "America/New_York"); return F.DAYS[z.wd] + " " + z.d + " " + (F.MONTHS_LONG || F.MONTHS)[z.mo] + " " + z.y; }

  // ---------- Xogta ----------
  function nextBig() { return K.events().find(function (x) { return x.lvl >= 3 && new Date(x.time).getTime() > Date.now(); }); }
  function prevReading(x) {
    const A = K.api(); if (!A || !A.monthly || !x.period) return null;
    const p = A.monthly[K.shiftM(x.period, -1)]; if (!p) return null;
    if (x.code === "cpi" && p.cpi != null) return { v: p.cpi.toFixed(1) + "%", l: T("CPI sanadle · bishii hore", "CPI y/y · prior month") };
    if (x.code === "nfp" && p.nfp != null) return { v: (p.nfp > 0 ? "+" : p.nfp < 0 ? "−" : "") + Math.abs(Math.round(p.nfp)) + "K", l: T("Shaqooyin · bishii hore", "Jobs · prior month") + (p.un != null ? " · " + T("shaqo la'aan ", "unemployment ") + p.un.toFixed(1) + "%" : "") };
    return null;
  }
  function why(x) {
    if (x.fomc) return [T("FED waxay go'aamisaa dulsaarka.", "The Fed sets interest rates."), T("Kordhin → dollar xoog, cadaadis BTC iyo saamiyada.", "Hike → stronger dollar, pressure on BTC and stocks."), T("Dhimis → lacag jaban, taageero suuqyada.", "Cut → cheaper money, support for markets.")];
    if (x.code === "cpi" || x.code === "ppi" || x.kind === "infl") return [T("Waxay cabbirtaa sicir-bararka Mareykanka.", "Measures US inflation."), T("Ka sarreeya filashada → FED kordhin → BTC hoos.", "Above forecast → Fed hike risk → BTC down."), T("Ka hooseeya → FED dabacsan → BTC kor.", "Below forecast → softer Fed → BTC up.")];
    if (x.code === "nfp" || x.kind === "jobs") return [T("Shaqooyinka cusub iyo shaqo la'aanta.", "New jobs and the unemployment rate."), T("Shaqo xoog leh → FED adag → cadaadis BTC.", "Strong jobs → tougher Fed → pressure on BTC."), T("Shaqo daciif ah → dhimis la filayo → BTC kor.", "Weak jobs → cut hopes → BTC up.")];
    return [T("Waxay muujisaa koboca dhaqaalaha.", "Shows how fast the economy grows."), T("Koboc xoog leh → FED adag.", "Strong growth → tougher Fed."), T("Koboc daciif ah → FED dabacsan.", "Weak growth → softer Fed.")];
  }

  // ---------- SVG qalab ----------
  const W = 1200, H = 675;
  const FB = "Inter, 'Helvetica Neue', Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
  const C = { bg: "#0B1220", card: "rgba(255,255,255,.055)", line: "rgba(255,255,255,.10)", ink: "#FFFFFF", mut: "#A9B6C4", dim: "#6E7D8F", blue: "#7CC8FF", green: "#22E39A" };
  const e = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  const tx = function (x, y, s, size, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-family="' + (o.d ? FD : FB) + '" font-size="' + size + '" font-weight="' + (o.w || 400) + '" fill="' + (o.c || C.ink) + '"' + (o.a ? ' text-anchor="' + o.a + '"' : "") + (o.ls ? ' letter-spacing="' + o.ls + '"' : "") + ">" + e(s) + "</text>";
  };
  const tw = function (s, size, bold) { return String(s).length * size * (bold ? 0.6 : 0.54); };
  function wrap(s, max) {
    const words = String(s).split(" "), lines = [""];
    words.forEach(function (w) { if ((lines[lines.length - 1] + " " + w).trim().length > max && lines[lines.length - 1]) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); });
    return lines;
  }
  function frame(inner, src) {
    let s = '<defs><radialGradient id="g1" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#3FB8FF" stop-opacity=".22"/><stop offset="1" stop-color="#3FB8FF" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="g2" cx="0%" cy="100%" r="60%"><stop offset="0" stop-color="#22E39A" stop-opacity=".10"/><stop offset="1" stop-color="#22E39A" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="' + C.bg + '"/><rect width="' + W + '" height="' + H + '" fill="url(#g1)"/><rect width="' + W + '" height="' + H + '" fill="url(#g2)"/>' +
      '<text x="' + W / 2 + '" y="' + (H / 2 + 40) + '" text-anchor="middle" font-family="' + FD + '" font-weight="800" font-size="120" fill="#fff" opacity=".035">Xogta Crypto</text>';
    s += inner;
    s += '<line x1="56" x2="' + (W - 56) + '" y1="' + (H - 58) + '" y2="' + (H - 58) + '" stroke="' + C.line + '"/>';
    s += tx(56, H - 24, "© " + new Date().getFullYear() + " Xogta Crypto 24/7", 13, { c: C.dim });
    if (src) s += tx(W / 2, H - 24, src, 13, { c: C.dim, a: "middle" });
    s += '<image href="' + LOGO + '" x="' + (W - 56 - 214) + '" y="' + (H - 46) + '" width="28" height="28"/>' + tx(W - 56, H - 25, "Xogta Crypto 24/7", 19, { d: 1, w: 800, a: "end" });
    return s;
  }
  function pill(x, y, label, col, dark) {
    const w = tw(label, 13, 1) + 26;
    return { w: w, s: '<rect x="' + x + '" y="' + (y - 18) + '" width="' + w + '" height="26" rx="13" fill="' + col + '"/>' + tx(x + w / 2, y, label.toUpperCase(), 13, { w: 800, c: dark ? "#0B1220" : "#fff", a: "middle", ls: ".6" }) };
  }

  // ---------- Sawirka 1: xogta xigta ----------
  function svgNext(x) {
    const t = new Date(x.time);
    let s = "";
    s += '<circle cx="62" cy="58" r="5" fill="' + C.green + '"/>' + tx(76, 63, T("XOGTA XIGTA EE AAD U MUHIIMKA AH", "NEXT HIGH-IMPACT RELEASE"), 15, { w: 700, c: C.mut, ls: "2" });
    const pk = pill(0, 0, K.KIND[x.kind] || "", K.KCOL[x.kind] || "#888", true);
    s += pill(W - 56 - pk.w, 64, K.KIND[x.kind] || "", K.KCOL[x.kind] || "#888", true).s;
    // cinwaanka
    const lines = wrap(x.name, 34), fs = lines.length > 1 ? 46 : 56;
    lines.slice(0, 2).forEach(function (l, i) { s += tx(56, 138 + i * (fs + 6), l, fs, { d: 1, w: 800 }); });
    let y = 138 + (Math.min(lines.length, 2) - 1) * (fs + 6) + 46;
    s += tx(56, y, longDate(t), 24, { w: 600, c: C.mut });
    // saacadaha
    y += 26; let cx = 56;
    timeChips(t).forEach(function (c, i) {
      const w = Math.max(tw(c[0], 22, 1), 60) + tw(c[1], 14) + 40;
      s += '<rect x="' + cx + '" y="' + y + '" width="' + w + '" height="44" rx="12" fill="' + (i === 0 ? "rgba(124,200,255,.14)" : C.card) + '" stroke="' + (i === 0 ? "rgba(124,200,255,.35)" : C.line) + '"/>';
      s += tx(cx + 16, y + 30, c[0], 22, { w: 800, d: 1, c: i === 0 ? C.blue : C.ink }) + tx(cx + 16 + tw(c[0], 22, 1) + 10, y + 29, c[1], 14, { c: C.mut });
      cx += w + 10;
    });
    // countdown
    let ms = Math.max(0, t.getTime() - Date.now());
    const d = Math.floor(ms / 864e5); ms -= d * 864e5;
    const h = Math.floor(ms / 36e5); ms -= h * 36e5;
    const m = Math.floor(ms / 6e4);
    const parts = [[d, T("maalmood", d === 1 ? "day" : "days")], [F.pad(h), T("saacadood", "hours")], [F.pad(m), T("daqiiqo", "minutes")]];
    const by = y + 92, bw = 190, bh = 150;
    s += tx(56, by - 12, T("WAQTIGA HARAY", "TIME LEFT"), 13, { w: 700, c: C.dim, ls: "2" });
    parts.forEach(function (p, i) {
      const bx = 56 + i * (bw + 14);
      s += '<rect x="' + bx + '" y="' + by + '" width="' + bw + '" height="' + bh + '" rx="18" fill="' + C.card + '" stroke="' + C.line + '"/>';
      s += tx(bx + bw / 2, by + 88, String(p[0]), 72, { d: 1, w: 800, a: "middle" }) + tx(bx + bw / 2, by + 124, p[1], 17, { c: C.mut, a: "middle" });
    });
    const now = zoned(new Date(), "UTC");
    s += tx(56, by + bh + 30, T("Sawirka la sameeyay: ", "Snapshot: ") + now.d + " " + F.MONTHS[now.mo] + " " + now.y + " · " + now.hm + " UTC", 13, { c: C.dim });
    // dhinaca midig: saameynta
    const px = 700, py = by - 26, pw = W - 56 - px, ph = H - 84 - py;
    s += '<rect x="' + px + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="20" fill="' + C.card + '" stroke="' + C.line + '"/>';
    let ry = py + 40;
    s += tx(px + 26, ry, T("SAAMEYNTA SUUQA", "MARKET IMPACT"), 13, { w: 700, c: C.dim, ls: "2" });
    for (let i = 0; i < 3; i++) s += '<circle cx="' + (px + pw - 70 + i * 18) + '" cy="' + (ry - 5) + '" r="6" fill="' + (i < x.lvl ? "#F2A93B" : "rgba(255,255,255,.15)") + '"/>';
    ry += 34;
    why(x).forEach(function (l, i) {
      wrap(l, 40).forEach(function (w2) { s += tx(px + 26, ry, w2, i === 0 ? 18 : 17, { w: i === 0 ? 700 : 400, c: i === 0 ? C.ink : C.mut }); ry += 26; });
      ry += 8;
    });
    const pr = prevReading(x);
    if (pr) {
      ry = py + ph - 74;
      s += '<line x1="' + (px + 26) + '" x2="' + (px + pw - 26) + '" y1="' + (ry - 26) + '" y2="' + (ry - 26) + '" stroke="' + C.line + '"/>';
      s += tx(px + 26, ry, pr.l.toUpperCase(), 12, { w: 700, c: C.dim, ls: "1.5" });
      s += tx(px + 26, ry + 44, pr.v, 38, { d: 1, w: 800 });
    }
    return frame(s, x.src ? T("Isha: ", "Source: ") + x.src + T(" (taariikhda rasmiga ah)", " (official schedule)") : "");
  }

  // ---------- Sawirka 2: 7-da maalmood ----------
  function weekList() {
    const now = Date.now();
    let days = 7, ev = [];
    while (days <= 21) {
      ev = K.events().filter(function (x) { const t = new Date(x.time).getTime(); return t > now && t <= now + days * 864e5; });
      if (ev.length >= 5) break; days += 7;
    }
    if (ev.length > 8) { const big = ev.filter(function (x) { return x.lvl >= 2; }); ev = (big.length >= 3 ? big : ev).slice(0, 8); }
    return { ev: ev, days: days };
  }
  function svgWeek() {
    const wl = weekList(), ev = wl.ev;
    let s = "";
    s += '<circle cx="62" cy="58" r="5" fill="' + C.green + '"/>' + tx(76, 63, T("KALANDARKA DHAQAALAHA MAREYKANKA", "US ECONOMIC CALENDAR"), 15, { w: 700, c: C.mut, ls: "2" });
    s += tx(56, 124, wl.days === 7 ? T("7-da maalmood ee soo socda", "The next 7 days") : T(wl.days + "-ka maalmood ee soo socda", "The next " + wl.days + " days"), 46, { d: 1, w: 800 });
    s += tx(W - 56, 124, T("Waqtiga: ET · Muqdisho", "Times: ET · Mogadishu"), 16, { c: C.mut, a: "end" });
    const top = 168, rh = Math.min(66, Math.floor((H - 80 - top) / Math.max(ev.length, 1)));
    if (!ev.length) s += tx(56, top + 60, T("Xog muhiim ah lama qorsheyn", "No releases scheduled"), 24, { c: C.mut });
    ev.forEach(function (x, i) {
      const y = top + i * rh, t = new Date(x.time), z = zoned(t, "America/New_York"), zm = zoned(t, "Africa/Mogadishu");
      s += '<rect x="56" y="' + y + '" width="' + (W - 112) + '" height="' + (rh - 8) + '" rx="12" fill="' + (x.lvl >= 3 ? "rgba(255,255,255,.075)" : C.card) + '" stroke="' + C.line + '"/>';
      const my = y + (rh - 8) / 2 + 6;
      s += '<rect x="56" y="' + y + '" width="5" height="' + (rh - 8) + '" rx="2.5" fill="' + (K.KCOL[x.kind] || "#888") + '"/>';
      s += tx(78, my, F.DAYS[z.wd].slice(0, 3) + " " + z.d + " " + F.MONTHS[z.mo], 17, { w: 700 });
      s += tx(212, my, z.hm + " ET", 17, { w: 700, c: C.blue }) + tx(300, my, zm.hm + " " + T("Muq", "Mog"), 15, { c: C.mut });
      let nm = x.name; if (nm.length > 52) nm = nm.slice(0, 51) + "…";
      s += tx(400, my, nm, 18, { w: x.lvl >= 3 ? 700 : 500 });
      for (let k = 0; k < 3; k++) s += '<circle cx="' + (W - 112 + k * 16) + '" cy="' + (my - 5) + '" r="5" fill="' + (k < x.lvl ? "#F2A93B" : "rgba(255,255,255,.15)") + '"/>';
    });
    return frame(s, T("Isha: BLS · BEA · Census · Federal Reserve · ISM", "Sources: BLS · BEA · Census · Federal Reserve · ISM"));
  }

  // ---------- SVG → PNG ----------
  let LOGO = "", FONTS = null;
  async function dataURI(url) {
    const b = await (await fetch(url)).blob();
    return await new Promise(function (ok) { const fr = new FileReader(); fr.onload = function () { ok(fr.result); }; fr.readAsDataURL(b); });
  }
  async function fonts() {
    if (FONTS !== null) return FONTS;
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@700;800&display=swap")).text();
      const blocks = css.split("@font-face").slice(1).filter(function (b) { return /U\+0000-00FF/.test(b); });
      const out = await Promise.all(blocks.map(async function (b) {
        const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1], wt = (b.match(/font-weight:\s*(\d+)/) || [])[1], url = (b.match(/url\(([^)]+)\)/) || [])[1];
        if (!fam || !url) return "";
        return "@font-face{font-family:'" + fam + "';font-weight:" + wt + ";src:url(" + (await dataURI(url)) + ") format('woff2');}";
      }));
      FONTS = out.join("");
    } catch (err) { FONTS = ""; }
    return FONTS;
  }
  async function makeSVG(kind) {
    const r = await Promise.all([fonts(), LOGO ? LOGO : dataURI("logo.svg").then(function (u) { LOGO = u; return u; })]);
    const x = nextBig();
    const body = kind === "week" || !x ? svgWeek() : svgNext(x);
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '"><style>' + r[0] + "</style>" + body + "</svg>";
  }
  async function makePNG(kind) {
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(await makeSVG(kind));
    await img.decode();
    const cv = document.createElement("canvas"); cv.width = W * 2; cv.height = H * 2;
    cv.getContext("2d").drawImage(img, 0, 0, W * 2, H * 2);
    return await new Promise(function (ok) { cv.toBlob(ok, "image/png"); });
  }

  // ---------- Ficillada ----------
  const pageURL = location.origin + location.pathname.replace(/\.html$/, "");
  function fileName(kind) {
    const x = nextBig();
    const tag = kind === "week" ? "jadwalka-7-maalmood" : (x && x.code ? x.code : x && x.fomc ? "fomc" : "xogta-xigta");
    return "xogta-crypto-" + tag + "-" + new Date().toISOString().slice(0, 10) + ".png";
  }
  function shareText(kind) {
    const h = window.SITE && window.SITE.x_handle ? " " + window.SITE.x_handle : "";
    const x = nextBig();
    if (kind === "week" || !x) return T("Kalandarka dhaqaalaha Mareykanka · 7-da maalmood ee soo socda", "US economic calendar · the next 7 days") + "\n\n" + pageURL + h;
    const t = new Date(x.time), z = zoned(t, "America/New_York"), zm = zoned(t, "Africa/Mogadishu");
    return T("Xogta xigta: ", "Next up: ") + x.name + "\n" + F.DAYS[z.wd] + " " + z.d + " " + F.MONTHS[z.mo] + " · " + z.hm + " ET · " + zm.hm + T(" Muqdisho", " Mogadishu") + "\n\n" + pageURL + h;
  }
  let tT;
  function toast(msg) {
    let t = document.getElementById("xc-toast");
    if (!t) { t = document.createElement("div"); t.id = "xc-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(function () { t.classList.remove("on"); }, 2600);
  }
  const menu = host.querySelector(".kh-menu"), mb = host.querySelector('[data-k="menu"]');
  function close() { menu.hidden = true; mb.classList.remove("on"); }
  async function act(k, v, btn) {
    close();
    try {
      if (k === "copy") { await navigator.clipboard.write([new ClipboardItem({ "image/png": makePNG(v) })]); toast(T("Sawirka waa la koobiyeeyay", "Image copied")); return; }
      btn.classList.add("busy");
      const blob = await makePNG(v), file = new File([blob], fileName(v), { type: "image/png" });
      btn.classList.remove("busy");
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share(k === "x" ? { files: [file], text: shareText(v) } : { files: [file] }); return;
      }
      if (k === "dl") {
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(v);
        document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        toast(T("Sawirka waa la soo dejiyay", "Image downloaded")); return;
      }
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast(T("Sawirka waa la koobiyeeyay — X-ka ku dheji (Ctrl+V)", "Image copied — paste it into X (Ctrl+V)")); } catch (err) { /* ignore */ }
      window.open("https://x.com/intent/post?text=" + encodeURIComponent(shareText(v)), "_blank", "noopener");
    } catch (err) {
      btn.classList.remove("busy");
      if (err && err.name === "AbortError") return;
      toast(T("Waan ka xumahay, isku day mar kale", "Sorry, please try again"));
    }
  }
  host.addEventListener("click", function (ev) {
    const b = ev.target.closest("button"); if (!b) return;
    if (b.dataset.k === "menu") { const open = menu.hidden; menu.hidden = !open; b.classList.toggle("on", open); return; }
    act(b.dataset.k, b.dataset.v, b);
  });
  document.addEventListener("click", function (ev) { if (!host.contains(ev.target)) close(); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") close(); });

  window.XCKalShare = { svg: makeSVG, png: makePNG };
})();
