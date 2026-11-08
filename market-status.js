/* =========================================================
   XAALADDA SUUQA (bogga hore) — live
   1) Filashada FED  — Kalshi (/api/live, 60 ilbiriqsi)
   2) Fear & Greed   — alternative.me (/api/sentiment, 10 daqiiqo)
   3) Altcoin Season — Binance, Xogta Crypto ayaa xisaabisay (/api/alts, 10 daqiiqo)
   + sawir (1200×675 PNG) oo la soo dejiyo / X lagu wadaago
   ========================================================= */
(function () {
  "use strict";
  const root = document.getElementById("ms");
  if (!root || !window.FedCore) return;
  const F = window.FedCore, T = F.T;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const S = { odds: null, oddsAt: null, fng: null, season: null };

  // ---------- Qalabka gauge-ka (SVG) ----------
  const arc = (cx, cy, r, a0, a1) => { // xaglaha: 180 = bidix, 0 = midig
    const p = (a) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  };
  const pt = (cx, cy, r, a) => [cx + r * Math.cos(a * Math.PI / 180), cy - r * Math.sin(a * Math.PI / 180)];
  const C = { dove: "#8EC5FF", hawk: "#F5A623", hold: "#A9B6C4" };
  const FZ = [[0, 25, "#E5484D"], [25, 47, "#F97316"], [47, 55, "#F5C518"], [55, 76, "#84CC16"], [76, 100, "#22C55E"]];
  const fngCol = (v) => (FZ.find((z) => v >= z[0] && v < z[1]) || FZ[4])[2];
  const FNGTXT = { "Extreme Fear": T("Cabsi xad-dhaaf ah", "Extreme fear"), "Fear": T("Cabsi", "Fear"), "Neutral": T("Dhexdhexaad", "Neutral"), "Greed": T("Hunguri", "Greed"), "Extreme Greed": T("Hunguri xad-dhaaf ah", "Extreme greed") };
  const fngWord = (v, cls) => FNGTXT[cls] || (v < 25 ? FNGTXT["Extreme Fear"] : v < 47 ? FNGTXT.Fear : v < 55 ? FNGTXT.Neutral : v < 76 ? FNGTXT.Greed : FNGTXT["Extreme Greed"]);

  function fedGauge(score, track, ink, mut) {
    const a = 180 * (1 - (score + 1) / 2), [x, y] = pt(110, 112, 72, a);
    return `<path d="${arc(110, 112, 90, 180, 122)}" stroke="${C.dove}" stroke-width="14" fill="none" stroke-linecap="round"/>` +
      `<path d="${arc(110, 112, 90, 118, 62)}" stroke="${track}" stroke-width="14" fill="none"/>` +
      `<path d="${arc(110, 112, 90, 58, 0)}" stroke="${C.hawk}" stroke-width="14" fill="none" stroke-linecap="round"/>` +
      `<line x1="110" y1="112" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><circle cx="110" cy="112" r="8" fill="${ink}"/>` +
      `<text x="20" y="136" fill="${mut}" font-size="11" font-family="Inter, Arial, sans-serif" text-anchor="middle">${esc(T("Dhimis", "Cut"))}</text><text x="110" y="136" fill="${mut}" font-size="11" font-family="Inter, Arial, sans-serif" text-anchor="middle">${esc(T("Hayn", "Hold"))}</text><text x="200" y="136" fill="${mut}" font-size="11" font-family="Inter, Arial, sans-serif" text-anchor="middle">${esc(T("Kordhin", "Hike"))}</text>`;
  }
  function fngGauge(v, bg, st) {
    let s = "";
    FZ.forEach((z, k) => { s += `<path d="${arc(110, 112, 90, 180 - z[0] * 1.8 - (k ? 2 : 0), 180 - z[1] * 1.8 + (k < 4 ? 2 : 0))}" stroke="${z[2]}" stroke-width="14" fill="none"${k === 0 || k === 4 ? ' stroke-linecap="round"' : ""}/>`; });
    const [x, y] = pt(110, 112, 90, 180 - v * 1.8);
    return s + `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="${bg}" stroke="${st || "#fff"}" stroke-width="3"/>`;
  }

  // ---------- Xogta ----------
  function fedModel() {
    const o = S.odds; if (!o || !o.markets || !o.markets.length) return null;
    const sum = (k) => o.markets.filter((m) => m.kind === k).reduce((a, m) => a + m.p, 0);
    const score = (sum("hike") - sum("cut")) / 100;
    const lab = score > 0.2 ? { t: "HAWKISH", s: T("kordhin la filayo", "hike expected"), c: C.hawk } : score < -0.2 ? { t: "DOVISH", s: T("dhimis la filayo", "cut expected"), c: C.dove } : { t: T("DHEXDHEXAAD", "NEUTRAL"), s: T("hayn la filayo", "hold expected"), c: C.hold };
    const name = (m) => {
      if (m.kind === "hold") return T("Hayn", "Hold");
      const more = m.bps % 25 !== 0, b = ((more ? m.bps - 1 : m.bps) / 100).toFixed(2) + "%";
      if (m.kind === "hike") return (more ? T("Kordhin ka badan +", "Hike more than +") : T("Kordhin +", "Hike +")) + b;
      if (m.kind === "cut") return (more ? T("Dhimis ka badan −", "Cut more than −") : T("Dhimis −", "Cut −")) + b;
      return m.label;
    };
    const col = (m) => (m.kind === "hike" ? C.hawk : m.kind === "cut" ? C.dove : C.hold);
    let when = "";
    if (o.close) { const d = new Date(o.close); const p = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(d); when = F.fmtDate(p); }
    return { score, lab, rows: o.markets.slice(0, 2).map((m) => ({ n: name(m), p: Math.round(m.p), c: col(m) })), when, url: o.url };
  }
  function fngModel() {
    const f = S.fng; if (!f || !f.length) return null;
    const L = f[f.length - 1], ago = (k) => (f.length > k ? f[f.length - 1 - k][1] : "—");
    return { v: L[1], word: fngWord(L[1], L[2]), col: fngCol(L[1]), y: ago(1), w: ago(7), m: ago(30) };
  }
  function seasonModel() {
    const h = S.season; if (!h || !h.length) return null;
    const L = h[h.length - 1], v = L[1], ago = (k) => (h.length > k ? h[h.length - 1 - k][1] : "—");
    const word = v >= 75 ? T("Altcoin Season", "Altcoin Season") : v <= 25 ? T("Bitcoin Season", "Bitcoin Season") : v < 50 ? T("Bitcoin season-ka u dhow", "Leaning Bitcoin season") : T("Altcoin season-ka u dhow", "Leaning altcoin season");
    return { v, n: L[2], word, w: ago(7), m: ago(30), q: ago(90) };
  }

  // ---------- Bogga ----------
  const load = (id) => `<div class="ms-load">${T("Xogta waa la soo qaadayaa…", "Loading…")}</div>`;
  function render() {
    const fed = fedModel(), fg = fngModel(), se = seasonModel();
    $("ms-fed").innerHTML = fed ? `<svg class="ms-g" viewBox="0 0 220 142">${fedGauge(fed.score, "var(--line-2)", "var(--text)", "var(--muted)")}</svg>
      <span class="ms-pill" style="background:${fed.lab.c}22;color:${fed.lab.c}">${esc(fed.lab.t)} · ${esc(fed.lab.s)}</span>
      ${fed.rows.map((r) => `<div class="ms-r"><span>${esc(r.n)}</span><b style="color:${r.c}">${r.p}%</b></div><div class="ms-bar"><i style="width:${Math.max(1, r.p)}%;background:${r.c}"></i></div>`).join("")}` : load();
    $("ms-fed-when").textContent = fed && fed.when ? fed.when + T(" · go'aanka xiga", " · next decision") : "";
    $("ms-fng").innerHTML = fg ? `<svg class="ms-g" viewBox="0 0 220 142">${fngGauge(fg.v, "var(--card)", "var(--text)")}</svg>
      <div class="ms-big">${fg.v}</div><span class="ms-pill" style="background:${fg.col};color:#0B1220">${esc(fg.word)}</span>
      <div class="ms-three"><span>${T("Shalay", "Yesterday")} <b>${fg.y}</b></span><span>${T("Toddobaad", "Week")} <b>${fg.w}</b></span><span>${T("Bil", "Month")} <b>${fg.m}</b></span></div>` : load();
    $("ms-alt").innerHTML = se ? `<div class="ms-as"><span class="ms-asn">${se.v}</span><span class="ms-asl">/ 100 · ${esc(se.word)}</span></div>
      <div class="ms-track"><span class="ms-knob" style="left:${se.v}%"></span></div>
      <div class="ms-tl"><span>Bitcoin Season</span><span>Altcoin Season</span></div>
      <p class="ms-txt">${esc(T(`${se.v}% altcoin-ka (${se.n}) ayaa BTC ka badiyay 90-kii maalmood ee u dambeeyay.`, `${se.v}% of altcoins (${se.n}) beat BTC over the last 90 days.`))}</p>
      <div class="ms-three"><span>${T("Toddobaad", "Week")} <b>${se.w}</b></span><span>${T("Bil", "Month")} <b>${se.m}</b></span><span>${T("3 bilood", "3 months")} <b>${se.q}</b></span></div>` : load();
  }

  // ---------- Soo qaadista (live) ----------
  async function getJ(url) { try { const r = await fetch(url, { cache: "no-store" }); return r.ok ? await r.json() : null; } catch (e) { return null; } }
  async function loadOdds() { const j = await getJ("/api/live"); if (j && j.odds) { S.odds = j.odds; S.oddsAt = j.updated; render(); } }
  async function loadFng() {
    let j = await getJ("/api/sentiment"), f = j && j.fng;
    if (!f) { const d = await getJ("https://api.alternative.me/fng/?limit=40&format=json"); if (d && d.data) f = d.data.map((x) => [new Date(+x.timestamp * 1000).toISOString().slice(0, 10), +x.value, x.value_classification]).reverse(); }
    if (f) { S.fng = f; render(); }
  }
  async function loadSeason() { const j = await getJ("/api/alts"); if (j && j.season && j.season.length) { S.season = j.season; render(); } }
  render();
  loadOdds(); loadFng(); loadSeason();
  setInterval(loadOdds, 60 * 1000);
  setInterval(loadFng, 10 * 60 * 1000);
  setInterval(loadSeason, 10 * 60 * 1000);

  // =========================================================
  // Sawirka (1200×675) — 3-da kaar, logo + ©
  // =========================================================
  const W = 1200, H = 675, FB = "Inter, Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
  const K = { bg: "#0B1220", card: "#111A27", line: "rgba(255,255,255,.09)", ink: "#FFFFFF", mut: "#A9B6C4", dim: "#6E7D8F" };
  const tx = (x, y, s, size, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.d ? FD : FB}" font-size="${size}" font-weight="${o.w || 400}" fill="${o.c || K.ink}"${o.a ? ` text-anchor="${o.a}"` : ""}${o.ls ? ` letter-spacing="${o.ls}"` : ""}>${esc(s)}</text>`; };
  let LOGO = "", FONTS = null;
  async function dataURI(url) { const b = await (await fetch(url)).blob(); return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); }); }
  async function fonts() {
    if (FONTS !== null) return FONTS;
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Inter+Tight:wght@700;800&display=swap")).text();
      const out = await Promise.all(css.split("@font-face").slice(1).filter((b) => /U\+0000-00FF/.test(b)).map(async (b) => {
        const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1], wt = (b.match(/font-weight:\s*(\d+)/) || [])[1], url = (b.match(/url\(([^)]+)\)/) || [])[1];
        return fam && url ? `@font-face{font-family:'${fam}';font-weight:${wt};src:url(${await dataURI(url)}) format('woff2');}` : "";
      }));
      FONTS = out.join("");
    } catch (e) { FONTS = ""; }
    return FONTS;
  }
  async function svg() {
    const [fc, logo] = await Promise.all([fonts(), LOGO || dataURI("logo.svg").then((u) => (LOGO = u))]);
    const fed = fedModel(), fg = fngModel(), se = seasonModel(), now = new Date();
    let s = `<defs><radialGradient id="g1" cx="85%" cy="0%" r="70%"><stop offset="0" stop-color="#3FB8FF" stop-opacity=".2"/><stop offset="1" stop-color="#3FB8FF" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="${K.bg}"/><rect width="${W}" height="${H}" fill="url(#g1)"/>`;
    s += `<circle cx="62" cy="58" r="5" fill="#22E39A"/>` + tx(76, 63, T("XAALADDA SUUQA · HADDA", "MARKET STATUS · NOW"), 15, { w: 700, c: K.mut, ls: "2" });
    s += tx(56, 118, T("Suuqu maxuu filayaa, maxuuse dareemayaa?", "What does the market expect and feel?"), 40, { d: 1, w: 800 });
    const stamp = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(now) + " UTC";
    s += tx(W - 56, 63, stamp, 14, { c: K.mut, a: "end" });
    const cw = 349, ch = 430, y0 = 150;
    [0, 1, 2].forEach((i) => { s += `<rect x="${56 + i * (cw + 18)}" y="${y0}" width="${cw}" height="${ch}" rx="22" fill="${K.card}" stroke="${K.line}"/>`; });
    const head = (i, t, sub) => { const x = 56 + i * (cw + 18); return tx(x + 24, y0 + 40, t, 20, { w: 700 }) + tx(x + 24, y0 + 64, sub, 13, { c: K.dim }); };
    const gauge = (i, inner) => { const x = 56 + i * (cw + 18) + (cw - 286) / 2; return `<g transform="translate(${x} ${y0 + 84}) scale(1.3)">${inner}</g>`; };
    const pill = (cx, y, t, bg, fgc) => { const w = t.length * 8.6 + 30; return `<rect x="${cx - w / 2}" y="${y - 22}" width="${w}" height="32" rx="16" fill="${bg}"/>` + tx(cx, y, t, 15, { w: 800, c: fgc, a: "middle" }); };
    // 1) FED
    { const x = 56, cx = x + cw / 2; s += head(0, T("Filashada FED", "Fed expectations"), fed && fed.when ? fed.when + T(" · go'aanka xiga", " · next decision") : "Kalshi");
      if (fed) {
        s += gauge(0, fedGauge(fed.score, "#2A3441", "#E8EEF4", K.mut)) + pill(cx, y0 + 286, fed.lab.t + " · " + fed.lab.s, fed.lab.c + "33", fed.lab.c);
        fed.rows.forEach((r, k) => { const yy = y0 + 328 + k * 42; s += tx(x + 24, yy, r.n, 15) + tx(x + cw - 24, yy, r.p + "%", 16, { w: 800, c: r.c, a: "end" }) + `<rect x="${x + 24}" y="${yy + 10}" width="${cw - 48}" height="7" rx="3.5" fill="#1C2733"/><rect x="${x + 24}" y="${yy + 10}" width="${(cw - 48) * Math.max(1, r.p) / 100}" height="7" rx="3.5" fill="${r.c}"/>`; });
        s += tx(x + 24, y0 + ch - 20, T("Isha: Kalshi", "Source: Kalshi"), 12.5, { c: K.dim });
      } }
    // 2) F&G
    { const x = 56 + cw + 18, cx = x + cw / 2; s += head(1, "Fear & Greed", T("Bitcoin · maanta", "Bitcoin · today"));
      if (fg) {
        s += gauge(1, fngGauge(fg.v, K.card)) + tx(cx, y0 + 250, String(fg.v), 54, { d: 1, w: 800, a: "middle" }) + pill(cx, y0 + 296, fg.word, fg.col, "#0B1220");
        [[T("Shalay", "Yesterday"), fg.y], [T("Toddobaad", "Week"), fg.w], [T("Bil", "Month"), fg.m]].forEach((p, k) => { const xx = x + 24 + k * ((cw - 48) / 2); s += tx(xx, y0 + 352, p[0], 13, { c: K.mut, a: k === 0 ? "start" : k === 1 ? "middle" : "end" }) + tx(xx, y0 + 380, String(p[1]), 20, { w: 800, a: k === 0 ? "start" : k === 1 ? "middle" : "end" }); });
        s += tx(x + 24, y0 + ch - 20, T("Isha: alternative.me", "Source: alternative.me"), 12.5, { c: K.dim });
      } }
    // 3) Altcoin season
    { const x = 56 + 2 * (cw + 18); s += head(2, "Altcoin Season", T("90 maalmood · Binance", "90 days · Binance"));
      if (se) {
        s += tx(x + 24, y0 + 168, String(se.v), 84, { d: 1, w: 800 }) + tx(x + 24 + String(se.v).length * 50 + 10, y0 + 168, "/ 100", 20, { c: K.mut });
        s += tx(x + 24, y0 + 204, se.word, 18, { w: 700, c: se.v >= 50 ? "#8EA2FF" : "#F5A623" });
        const tw = cw - 48, ty = y0 + 236, seg = ["#F59E0B", "#FBD38D", "#A5B4FC", "#3B5BFF"];
        seg.forEach((c, k) => { s += `<rect x="${x + 24 + k * tw / 4}" y="${ty}" width="${tw / 4 + (k < 3 ? 1 : 0)}" height="14" fill="${c}"${k === 0 || k === 3 ? "" : ""}/>`; });
        s += `<circle cx="${x + 24 + tw * se.v / 100}" cy="${ty + 7}" r="12" fill="${K.bg}" stroke="#fff" stroke-width="3.5"/>`;
        s += tx(x + 24, ty + 42, "Bitcoin Season", 12.5, { c: K.mut }) + tx(x + cw - 24, ty + 42, "Altcoin Season", 12.5, { c: K.mut, a: "end" });
        [[T("Toddobaad", "Week"), se.w], [T("Bil", "Month"), se.m], [T("3 bilood", "3 months"), se.q]].forEach((p, k) => { const xx = x + 24 + k * ((cw - 48) / 2); s += tx(xx, y0 + 352, p[0], 13, { c: K.mut, a: k === 0 ? "start" : k === 1 ? "middle" : "end" }) + tx(xx, y0 + 380, String(p[1]), 20, { w: 800, a: k === 0 ? "start" : k === 1 ? "middle" : "end" }); });
        s += tx(x + 24, y0 + ch - 20, T("Isha: Binance · Xogta Crypto", "Source: Binance · Xogta Crypto"), 12.5, { c: K.dim });
      } }
    s += `<line x1="56" x2="${W - 56}" y1="${H - 58}" y2="${H - 58}" stroke="${K.line}"/>` + tx(56, H - 24, "© " + now.getFullYear() + " Xogta Crypto 24/7", 13, { c: K.dim });
    s += `<image href="${logo}" x="${W - 56 - 214}" y="${H - 46}" width="28" height="28"/>` + tx(W - 56, H - 25, "Xogta Crypto 24/7", 19, { d: 1, w: 800, a: "end" });
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>${fc}</style>${s}</svg>`;
  }
  async function png() {
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(await svg()); await img.decode();
    const cv = document.createElement("canvas"); cv.width = W * 2; cv.height = H * 2; cv.getContext("2d").drawImage(img, 0, 0, W * 2, H * 2);
    return await new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  const fileName = () => "xogta-crypto-xaaladda-suuqa-" + new Date().toISOString().slice(0, 10) + ".png";
  function shareText() {
    const fed = fedModel(), fg = fngModel(), se = seasonModel(), h = window.SITE && window.SITE.x_handle ? " " + window.SITE.x_handle : "";
    const l = [T("Xaaladda suuqa · hadda", "Market status · now")];
    if (fed) l.push(T("FED: ", "Fed: ") + fed.lab.t + " (" + fed.rows[0].n + " " + fed.rows[0].p + "%)");
    if (fg) l.push("Fear & Greed: " + fg.v + " (" + fg.word + ")");
    if (se) l.push("Altcoin Season: " + se.v + "/100");
    return l.join("\n") + "\n\n" + location.origin + "/" + h;
  }
  let tT;
  function toast(m) { let t = $("xc-toast"); if (!t) { t = document.createElement("div"); t.id = "xc-toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 2600); }
  const act = $("ms-act"), menu = act.querySelector(".xcc-menu"), mb = act.querySelector('[data-k="menu"]');
  const close = () => { menu.hidden = true; mb.classList.remove("on"); };
  act.addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = b.dataset.k;
    if (k === "menu") { const o = menu.hidden; menu.hidden = !o; mb.classList.toggle("on", o); return; }
    close();
    try {
      if (k === "copy") { await navigator.clipboard.write([new ClipboardItem({ "image/png": png() })]); toast(T("Sawirka waa la koobiyeeyay", "Image copied")); return; }
      b.classList.add("busy"); const blob = await png(), file = new File([blob], fileName(), { type: "image/png" }); b.classList.remove("busy");
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share(k === "x" ? { files: [file], text: shareText() } : { files: [file] }); return; }
      if (k === "dl") { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(); document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); toast(T("Sawirka waa la soo dejiyay", "Image downloaded")); return; }
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast(T("Sawirka waa la koobiyeeyay — X-ka ku dheji (Ctrl+V)", "Image copied — paste it into X (Ctrl+V)")); } catch (err) { /* ignore */ }
      window.open("https://x.com/intent/post?text=" + encodeURIComponent(shareText()), "_blank", "noopener");
    } catch (err) { b.classList.remove("busy"); if (!err || err.name !== "AbortError") toast(T("Waan ka xumahay, isku day mar kale", "Sorry, please try again")); }
  });
  document.addEventListener("click", (e) => { if (!act.contains(e.target)) close(); });
  window.XCMarket = { svg, png, state: S };
})();
