/* =========================================================
   LACAGTA SOCOTA — bogga /lacagta · LIVE
   1) Spot (Binance, bilaash): klines 5 daqiiqo × 288 (24 saac) coin kasta
        iibsi  = taker buy (USDT)      → lacag soo gashay
        iibin  = volume − taker buy    → lacag baxday
        saafi  = iibsi − iibin
      Waqtiyada: 15 daq = 3 shumac · 30 daq = 6 · 1 saac = 12 · 4 saac = 48 · 24 saac = 288
      Daqiiqad kasta ayaa dib loo soo qaadaa.
   2) Futures (Binance USDⓈ-M): saamiga long/short (5 daqiiqo kasta)
        globalLongShortAccountRatio  → dadka caadiga ah (accounts)
        topLongShortPositionRatio    → whales (top traders, positions)
   Heatmap-ka (7 maalin × 24 saac) waa flow-heatmap.js (#xc-grid)
   ========================================================= */
(function () {
  "use strict";
  const root = document.getElementById("lq");
  if (!root) return;
  const EN = (function () { try { return localStorage.getItem("xc-lang") === "en"; } catch (e) { return false; } })();
  const T = (so, en) => (EN ? en : so);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const pad = (n) => String(n).padStart(2, "0");
  const SPOT = "https://data-api.binance.vision/api/v3/klines";
  const FUT = "https://fapi.binance.com/futures/data/";
  const SETS = [
    { k: "btc", name: "Bitcoin", syms: ["BTCUSDT"] },
    { k: "eth", name: "Ethereum", syms: ["ETHUSDT"] },
    { k: "alt", name: T("Altcoins (top 10)", "Altcoins (top 10)"), short: "Altcoins", syms: ["SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "ADAUSDT", "TRXUSDT", "LINKUSDT", "AVAXUSDT", "SUIUSDT", "LTCUSDT"] }
  ];
  const TF = [
    { k: "15m", n: 3, lab: T("15 daqiiqo", "15 min"), th: T("15 daq", "15 min"), long: T("15-kii daqiiqo ee u dambeeyay", "Last 15 minutes") },
    { k: "30m", n: 6, lab: T("30 daqiiqo", "30 min"), th: T("30 daq", "30 min"), long: T("30-kii daqiiqo ee u dambeeyay", "Last 30 minutes") },
    { k: "1h", n: 12, lab: T("1 saac", "1 hour"), th: T("1 saac", "1 hour"), long: T("Saacaddii u dambaysay", "Last hour") },
    { k: "4h", n: 48, lab: T("4 saac", "4 hours"), th: T("4 saac", "4 hours"), long: T("4-tii saac ee u dambeeyay", "Last 4 hours") },
    { k: "24h", n: 288, lab: T("24 saac", "24 hours"), th: T("24 saac", "24 hours"), long: T("24-kii saac ee u dambeeyay", "Last 24 hours") }
  ];
  const st = { tf: (function () { try { return localStorage.getItem("xc-lq-tf") || "4h"; } catch (e) { return "4h"; } })(), rows: {}, at: null, ls: null, lsAt: null, lsErr: false };
  if (!TF.some((t) => t.k === st.tf)) st.tf = "4h";

  const fmt = (v, sign) => { const a = Math.abs(v), s = sign ? (v > 0 ? "+" : v < 0 ? "−" : "") : ""; return s + "$" + (a >= 1e9 ? (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : a >= 1e7 ? 0 : 1) + "M" : a >= 1e3 ? Math.round(a / 1e3) + "K" : Math.round(a)); };
  const cls = (v) => (v >= 0 ? "up" : "down");

  const IC = {
    cam: '<svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="fill"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  };
  const CAM = (k) => `<span class="xcc-act" data-shot="${k}"><button class="xcc-ib" data-a="menu" aria-haspopup="true" aria-label="${T("Sawir", "Image")}">${IC.cam}</button>
    <div class="xcc-menu" role="menu" hidden>
      <button data-a="dl">${IC.dl}${T("Soo deji sawirka", "Download image")}</button>
      <button data-a="copy">${IC.copy}${T("Koobi garee sawirka", "Copy image")}</button>
      <button data-a="link">${IC.link}${T("Koobi garee link-ga", "Copy link")}</button>
      <hr><button data-a="x">${IC.x}${T("Ku wadaag X", "Share on X")}</button>
    </div></span>`;
  // ---------- Qaabka bogga ----------
  root.innerHTML = `
    <div class="lq-bar">
      <div class="lq-tabs" role="tablist">${TF.map((t) => `<button role="tab" data-tf="${t.k}"${t.k === st.tf ? ' class="on" aria-selected="true"' : ""}>${esc(t.lab)}</button>`).join("")}</div>
      <span class="lq-hr"><span class="lq-live"><b class="pulse"></b><span id="lq-at">Live</span></span>${CAM("io")}</span>
    </div>
    <div class="lq-big">
      <div class="lq-io in"><div><span class="lq-io-l">⬆ ${T("Soo gashay", "Money in")} · <em class="lq-tfl"></em></span><b id="lq-in">—</b><small id="lq-in-p"></small></div><svg class="lq-ring" viewBox="0 0 120 120" id="lq-in-r"></svg></div>
      <div class="lq-io out"><div><span class="lq-io-l">⬇ ${T("Baxday", "Money out")} · <em class="lq-tfl"></em></span><b id="lq-out">—</b><small id="lq-out-p"></small></div><svg class="lq-ring" viewBox="0 0 120 120" id="lq-out-r"></svg></div>
    </div>
    <div class="lq-sum" id="lq-sum">${T("Xogta ayaa soo socota…", "Loading data…")}</div>

    <div class="lq-h"><h2>${T("Coin kasta", "Each coin")}</h2><span class="lq-hr"><em class="lq-tfl"></em>${CAM("coins")}</span></div>
    <div class="lq-coins" id="lq-coins"></div>

    <div class="lq-h"><h2>${T("Dhammaan waqtiyada", "All timeframes")}</h2><span class="lq-hr">${T("Saafi: soo gashay − baxday", "Net: in − out")}${CAM("table")}</span></div>
    <div class="lq-tw"><table class="lq-t"><thead><tr><th>Coin</th>${TF.map((t) => `<th data-tf="${t.k}">${esc(t.th)}</th>`).join("")}</tr></thead><tbody id="lq-tb"></tbody></table></div>

    <div class="lq-h"><h2>${T("Long iyo Short", "Long vs Short")}</h2><span class="lq-hr">${T("5 daqiiqo kasta", "Every 5 min")}${CAM("ls")}</span></div>
    <div class="lq-ls" id="lq-ls"></div>
    <div class="lq-exp"><b>${T("Fahan", "Read it")}</b>
      <span>${T("<b>Long</b> = kor u kac · <b>Short</b> = hoos u dhac · 2.0 = 2 long, 1 short.", "<b>Long</b> = up · <b>Short</b> = down · 2.0 = 2 longs per short.")}</span>
      <span>${T("Talo iibsi ama iibin ma aha.", "Not a buy or sell signal.")}</span></div>

    <div class="lq-h"><h2>${T("Goorma ayay lacagtu soo gashaa?", "When does money flow in?")}</h2><span>${T("7 maalin", "7 days")}</span></div>`;

  // ---------- Xogta spot ----------
  async function kl(sym) {
    const r = await fetch(`${SPOT}?symbol=${sym}&interval=5m&limit=288`, { cache: "no-store" });
    if (!r.ok) throw new Error(sym);
    return (await r.json()).map((k) => ({ t: k[0], q: +k[7], b: +k[10] }));
  }
  async function loadSpot() {
    const all = SETS.flatMap((s) => s.syms);
    const res = await Promise.allSettled(all.map(kl));
    const by = {}; let ok = 0;
    res.forEach((r, i) => { if (r.status === "fulfilled") { by[all[i]] = r.value; ok++; } });
    if (!ok) throw new Error("spot");
    SETS.forEach((s) => { const have = s.syms.filter((x) => by[x]); if (have.length) st.rows[s.k] = { list: have.map((x) => by[x]), n: have.length }; });
    st.at = new Date();
  }
  // wadarta n shumac ee u dambeeyay
  function agg(k, n) {
    const r = st.rows[k]; if (!r) return null;
    let b = 0, q = 0;
    r.list.forEach((rows) => { rows.slice(-n).forEach((c) => { b += c.b; q += c.q; }); });
    return { buy: b, sell: q - b, net: 2 * b - q, tot: q };
  }

  // ---------- Long / Short ----------
  async function fj(path) { const r = await fetch(FUT + path, { cache: "no-store" }); if (!r.ok) throw new Error(path); const j = await r.json(); if (!Array.isArray(j) || !j.length) throw new Error("empty"); return j[j.length - 1]; }
  async function loadLS() {
    try {
      const out = {};
      await Promise.all(["BTCUSDT", "ETHUSDT"].map(async (s) => {
        const [acc, top] = await Promise.all([fj(`globalLongShortAccountRatio?symbol=${s}&period=5m&limit=1`), fj(`topLongShortPositionRatio?symbol=${s}&period=5m&limit=1`)]);
        out[s] = { acc: +acc.longShortRatio, long: +acc.longAccount, top: +top.longShortRatio, t: +acc.timestamp };
      }));
      st.ls = out; st.lsAt = new Date(); st.lsErr = false;
    } catch (e) { st.lsErr = true; }
    renderLS();
  }

  // ---------- Muuqaalka ----------
  function ring(pct, col) {
    const r = 50, c = 2 * Math.PI * r, d = Math.max(0, Math.min(100, pct)) / 100 * c;
    return `<circle cx="60" cy="60" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/>` +
      `<circle cx="60" cy="60" r="${r}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${d.toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/>` +
      `<text x="60" y="68" text-anchor="middle" font-size="24" font-weight="800" fill="currentColor">${Math.round(pct)}%</text>`;
  }
  function render() {
    const tf = TF.find((t) => t.k === st.tf);
    root.querySelectorAll(".lq-tfl").forEach((e) => (e.textContent = tf.lab));
    const parts = SETS.map((s) => agg(s.k, tf.n)).filter(Boolean);
    if (!parts.length) return;
    const A = parts.reduce((a, p) => ({ buy: a.buy + p.buy, sell: a.sell + p.sell, net: a.net + p.net, tot: a.tot + p.tot }), { buy: 0, sell: 0, net: 0, tot: 0 });
    const bp = A.tot ? A.buy / A.tot * 100 : 50;
    root.querySelector("#lq-in").textContent = fmt(A.buy);
    root.querySelector("#lq-out").textContent = fmt(A.sell);
    root.querySelector("#lq-in-p").textContent = T("Iibsi", "Buys");
    root.querySelector("#lq-out-p").textContent = T("Iibin", "Sells");
    root.querySelector("#lq-in-r").innerHTML = ring(bp, "#2BD67B");
    root.querySelector("#lq-out-r").innerHTML = ring(100 - bp, "#F05A5F");
    const sumEl = root.querySelector("#lq-sum"); sumEl.className = "lq-sum " + cls(A.net);
    sumEl.innerHTML = `${esc(tf.lab)}: <b class="${cls(A.net)}">${fmt(A.net, true)} ${A.net >= 0 ? T("soo gashay", "in") : T("baxday", "out")}</b> → ` +
      esc(A.net >= 0 ? T("iibsadayaasha ayaa xoog badan.", "buyers lead.") : T("iibiyayaasha ayaa xoog badan.", "sellers lead."));

    root.querySelector("#lq-coins").innerHTML = SETS.map((s) => {
      const p = agg(s.k, tf.n); if (!p) return "";
      const b = p.tot ? Math.round(p.buy / p.tot * 100) : 50;
      return `<div class="lq-coin"><div class="lq-ch"><b>${esc(s.name)}</b><strong class="${cls(p.net)}">${fmt(p.net, true)}</strong></div>
        <div class="lq-split"><i style="width:${b}%"></i><i style="width:${100 - b}%"></i></div>
        <div class="lq-cl"><span>${T("iibsi", "buy")} ${b}%</span><span>${T("iibin", "sell")} ${100 - b}%</span></div>
        <div class="lq-cv"><span>${fmt(p.buy)}</span><span>${fmt(p.sell)}</span></div></div>`;
    }).join("");

    root.querySelector("#lq-tb").innerHTML = SETS.map((s) => `<tr><th>${esc(s.short || s.name)}</th>${TF.map((t) => { const p = agg(s.k, t.n); return `<td data-tf="${t.k}"${t.k === st.tf ? ' class="on"' : ""}>${p ? `<span class="${cls(p.net)}">${fmt(p.net, true)}</span>` : "—"}</td>`; }).join("")}</tr>`).join("");
    root.querySelectorAll(".lq-t th[data-tf]").forEach((h) => h.classList.toggle("on", h.dataset.tf === st.tf));
    if (st.at) root.querySelector("#lq-at").textContent = "Live · " + pad(st.at.getHours()) + ":" + pad(st.at.getMinutes());
  }
  function renderLS() {
    const box = root.querySelector("#lq-ls");
    if (!st.ls) { box.innerHTML = `<div class="lq-lsc lq-na">${st.lsErr ? T("Xogtan hadda lama heli karo. 5 daqiiqo kadib ayaa mar kale la isku dayayaa.", "Unavailable right now. Retrying in 5 minutes.") : T("Xogta ayaa soo socota…", "Loading data…")}</div>`; return; }
    const row = (l, v, txt) => `<div class="lq-r"><span>${l}</span><b class="${v == null ? "" : v >= 1 ? "up" : "down"}">${txt}</b></div>`;
    box.innerHTML = [["BTCUSDT", "Bitcoin"], ["ETHUSDT", "Ethereum"]].map(([s, n]) => {
      const d = st.ls[s]; if (!d) return "";
      const lead = d.acc >= 1;
      return `<div class="lq-lsc"><div class="lq-lsh"><b>Long / Short · ${n}</b><span class="lq-tag ${lead ? "up" : "down"}">${lead ? T("Long ayaa badan", "More longs") : T("Short ayaa badan", "More shorts")}</span></div>
        ${row(T("Dadka caadiga ah (accounts)", "Regular traders (accounts)"), d.acc, d.acc.toFixed(2))}
        ${row(T("Whales (positions)", "Whales (positions)"), d.top, d.top.toFixed(2))}
        <div class="lq-r"><span>Long %</span><b>${Math.round(d.long * 100)}%</b></div>
        <div class="lq-split sm"><i style="width:${d.long * 100}%"></i><i style="width:${100 - d.long * 100}%"></i></div></div>`;
    }).join("") + (st.lsAt ? `<div class="lq-src">${T("La cusboonaysiiyay ", "Updated ")}${pad(st.lsAt.getHours())}:${pad(st.lsAt.getMinutes())}</div>` : "");
  }

  root.querySelector(".lq-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tf]"); if (!b) return;
    st.tf = b.dataset.tf; try { localStorage.setItem("xc-lq-tf", st.tf); } catch (err) { /* ignore */ }
    root.querySelectorAll(".lq-tabs button").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
    render();
  });
  root.querySelector(".lq-t thead").addEventListener("click", (e) => { const h = e.target.closest("th[data-tf]"); if (h) root.querySelector(`.lq-tabs button[data-tf="${h.dataset.tf}"]`).click(); });


  // ---------- Sawirka qayb kasta (1200×675 PNG) ----------
  const W0 = 1200, H0 = 675, FB = "Inter, Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
  const G = "#2BD67B", R = "#F05A5F", K = { bg: "#0B1220", card: "#121A2B", ink: "#FFFFFF", mut: "#A9B6C4", dim: "#6E7D8F", line: "rgba(255,255,255,.09)" };
  const MO = EN ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Lul", "Og", "Seb", "Okt", "Nof", "Dis"];
  const tx = (x, y, t, size, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.d ? FD : FB}" font-size="${size}" font-weight="${o.w || 400}" fill="${o.c || K.ink}"${o.a ? ` text-anchor="${o.a}"` : ""}>${esc(t)}</text>`; };
  const box = (x, y, w, h, fill, stroke) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${fill || K.card}"${stroke ? ` stroke="${stroke}"` : ""}/>`;
  const bar = (x, y, w, h, p) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${R}"/><rect x="${x}" y="${y}" width="${Math.max(h, w * p)}" height="${h}" rx="${h / 2}" fill="${G}"/>`;
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
  function body(kind) {
    const tf = TF.find((t) => t.k === st.tf);
    let s = "";
    if (kind === "io") {
      const parts = SETS.map((x) => agg(x.k, tf.n)).filter(Boolean);
      const A = parts.reduce((a, p) => ({ buy: a.buy + p.buy, sell: a.sell + p.sell, net: a.net + p.net, tot: a.tot + p.tot }), { buy: 0, sell: 0, net: 0, tot: 0 });
      const bp = A.tot ? A.buy / A.tot * 100 : 50;
      s += tx(56, 72, T(`Lacagta crypto · ${tf.lab}`, `Crypto money flow · ${tf.lab}`), 34, { d: 1, w: 800 });
      s += box(56, 110, 530, 250, "rgba(43,214,123,.12)", "rgba(43,214,123,.45)") + box(614, 110, 530, 250, "rgba(240,90,95,.12)", "rgba(240,90,95,.45)");
      s += tx(88, 160, "⬆ " + T("Soo gashay", "Money in"), 22, { w: 700, c: G }) + tx(88, 250, fmt(A.buy), 76, { d: 1, w: 800 }) + tx(88, 310, Math.round(bp) + "% " + T("iibsi", "buys"), 22, { c: K.mut });
      s += tx(646, 160, "⬇ " + T("Baxday", "Money out"), 22, { w: 700, c: R }) + tx(646, 250, fmt(A.sell), 76, { d: 1, w: 800 }) + tx(646, 310, Math.round(100 - bp) + "% " + T("iibin", "sells"), 22, { c: K.mut });
      s += box(56, 390, 1088, 150) + tx(88, 448, T("Saafi", "Net"), 22, { c: K.mut }) + tx(88, 510, fmt(A.net, true), 58, { d: 1, w: 800, c: A.net >= 0 ? G : R });
      s += tx(1112, 485, A.net >= 0 ? T("Iibsadayaasha ayaa xoog badan", "Buyers lead") : T("Iibiyayaasha ayaa xoog badan", "Sellers lead"), 26, { w: 700, a: "end", c: A.net >= 0 ? G : R });
    } else if (kind === "coins") {
      s += tx(56, 72, T(`Coin kasta · ${tf.lab}`, `Each coin · ${tf.lab}`), 34, { d: 1, w: 800 });
      SETS.forEach((x, i) => {
        const p = agg(x.k, tf.n); if (!p) return;
        const y = 110 + i * 145, b = p.tot ? p.buy / p.tot : 0.5;
        s += box(56, y, 1088, 125) + tx(88, y + 52, x.name, 28, { w: 700 }) + tx(1112, y + 56, fmt(p.net, true), 44, { d: 1, w: 800, a: "end", c: p.net >= 0 ? G : R });
        s += bar(88, y + 76, 1024, 14, b) + tx(88, y + 114, T("iibsi ", "buy ") + Math.round(b * 100) + "% · " + fmt(p.buy), 18, { c: K.mut }) + tx(1112, y + 114, T("iibin ", "sell ") + Math.round((1 - b) * 100) + "% · " + fmt(p.sell), 18, { c: K.mut, a: "end" });
      });
    } else if (kind === "table") {
      s += tx(56, 72, T("Lacagta saafiga ah · dhammaan waqtiyada", "Net money flow · all timeframes"), 34, { d: 1, w: 800 });
      s += box(56, 105, 1088, 430);
      const cx = [88, 330, 488, 646, 804, 962];
      TF.forEach((t, j) => { s += tx(cx[j + 1], 160, t.th.toUpperCase(), 18, { w: 700, c: t.k === st.tf ? K.ink : K.mut }); });
      s += tx(cx[0], 160, "COIN", 18, { w: 700, c: K.mut });
      SETS.forEach((x, i) => {
        const y = 250 + i * 105;
        s += `<line x1="76" x2="1124" y1="${y - 60}" y2="${y - 60}" stroke="${K.line}"/>` + tx(cx[0], y, x.short || x.name, 26, { w: 700 });
        TF.forEach((t, j) => { const p = agg(x.k, t.n); if (p) s += tx(cx[j + 1], y, fmt(p.net, true), 28, { d: 1, w: 800, c: p.net >= 0 ? G : R }); });
      });
    } else if (kind === "ls") {
      s += tx(56, 72, T("Long iyo Short · futures", "Long vs Short · futures"), 34, { d: 1, w: 800 });
      [["BTCUSDT", "Bitcoin", 56], ["ETHUSDT", "Ethereum", 614]].forEach(([k, n, x]) => {
        const d = st.ls && st.ls[k]; s += box(x, 110, 530, 430);
        if (!d) { s += tx(x + 32, 170, n, 30, { w: 700 }) + tx(x + 32, 230, "—", 30, { c: K.mut }); return; }
        const lead = d.acc >= 1;
        s += tx(x + 32, 168, n, 32, { w: 700 }) + tx(x + 498, 168, lead ? T("Long ayaa badan", "More longs") : T("Short ayaa badan", "More shorts"), 20, { w: 700, a: "end", c: lead ? G : R });
        s += tx(x + 32, 250, T("Dadka caadiga ah", "Regular traders"), 22, { c: K.mut }) + tx(x + 498, 252, d.acc.toFixed(2), 40, { d: 1, w: 800, a: "end", c: d.acc >= 1 ? G : R });
        s += tx(x + 32, 330, "Whales", 22, { c: K.mut }) + tx(x + 498, 332, d.top.toFixed(2), 40, { d: 1, w: 800, a: "end", c: d.top >= 1 ? G : R });
        s += tx(x + 32, 410, "Long %", 22, { c: K.mut }) + tx(x + 498, 412, Math.round(d.long * 100) + "%", 40, { d: 1, w: 800, a: "end" });
        s += bar(x + 32, 460, 466, 16, d.long) + tx(x + 32, 510, "Long", 18, { c: G }) + tx(x + 498, 510, "Short", 18, { c: R, a: "end" });
      });
    }
    return s;
  }
  async function shotSVG(kind) {
    const [fc, logo] = await Promise.all([fonts(), LOGO || dataURI("logo.svg").then((u) => (LOGO = u)).catch(() => "")]);
    const at = kind === "ls" ? st.lsAt : st.at, d = at || new Date();
    const when = d.getDate() + " " + MO[d.getMonth()] + " " + d.getFullYear() + " · " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    let s = `<rect width="${W0}" height="${H0}" fill="${K.bg}"/>` + body(kind);
    s += `<line x1="56" x2="${W0 - 56}" y1="${H0 - 64}" y2="${H0 - 64}" stroke="${K.line}"/>` + tx(56, H0 - 28, when + " · " + T("Isha: Binance", "Source: Binance"), 16, { c: K.dim });
    if (logo) s += `<image href="${logo}" x="${W0 - 56 - 214}" y="${H0 - 50}" width="28" height="28"/>`;
    s += tx(W0 - 56, H0 - 29, "Xogta Crypto 24/7", 19, { d: 1, w: 800, a: "end" });
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}"><style>${fc}</style>${s}</svg>`;
  }
  async function shotPNG(kind) {
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(await shotSVG(kind)); await img.decode();
    const cv = document.createElement("canvas"); cv.width = W0 * 2; cv.height = H0 * 2; cv.getContext("2d").drawImage(img, 0, 0, W0 * 2, H0 * 2);
    return await new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  let tT;
  const toast = (m) => { let t = document.getElementById("xc-toast"); if (!t) { t = document.createElement("div"); t.id = "xc-toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 2600); };
  const closeAll = () => root.querySelectorAll(".xcc-act").forEach((w) => { w.querySelector(".xcc-menu").hidden = true; w.querySelector(".xcc-ib").classList.remove("on"); });
  const HEAD = { io: () => T("Lacagta crypto", "Crypto money flow"), coins: () => T("Coin kasta", "Each coin"), table: () => T("Lacagta saafiga ah", "Net money flow"), ls: () => T("Long iyo Short", "Long vs Short") };
  root.addEventListener("click", async (e) => {
    const b = e.target.closest(".xcc-act button"); if (!b) return;
    const w = b.closest(".xcc-act"), k = w.dataset.shot, a = b.dataset.a;
    e.stopPropagation();
    if (a === "menu") { const m = w.querySelector(".xcc-menu"), o = m.hidden; closeAll(); m.hidden = !o; b.classList.toggle("on", o); return; }
    closeAll(); if (!st.at) return;
    const url = location.origin + "/lacagta";
    const tf = TF.find((t) => t.k === st.tf), text = HEAD[k]() + (k === "ls" ? "" : " · " + tf.lab) + "\n\n" + url + (window.SITE && window.SITE.x_handle ? "\n" + window.SITE.x_handle : "");
    const name = `xogta-crypto-lacagta-${k}-${st.tf}-${new Date().toISOString().slice(0, 10)}.png`;
    try {
      if (a === "link") { await navigator.clipboard.writeText(url); toast(T("Link-ga waa la koobiyeeyay", "Link copied")); return; }
      if (a === "copy") { await navigator.clipboard.write([new ClipboardItem({ "image/png": shotPNG(k) })]); toast(T("Sawirka waa la koobiyeeyay", "Image copied")); return; }
      const blob = await shotPNG(k), file = new File([blob], name, { type: "image/png" });
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share(a === "x" ? { files: [file], text } : { files: [file] }); return; }
      if (a === "dl") { const l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = name; document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 1500); toast(T("Sawirka waa la soo dejiyay", "Image downloaded")); return; }
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast(T("Sawirka waa la koobiyeeyay — X-ka ku dheji (Ctrl+V)", "Image copied — paste it into X (Ctrl+V)")); } catch (err) { /* ignore */ }
      window.open("https://x.com/intent/post?text=" + encodeURIComponent(text), "_blank", "noopener");
    } catch (err) { if (!err || err.name !== "AbortError") toast(T("Waan ka xumahay, isku day mar kale", "Sorry, please try again")); }
  });
  document.addEventListener("click", (e) => { if (!e.target.closest || !e.target.closest("#lq .xcc-act")) closeAll(); });

  async function tick() {
    try { await loadSpot(); render(); }
    catch (e) { if (!st.at) root.querySelector("#lq-sum").textContent = T("Xogta lama heli karo hadda. Isku day mar kale.", "Data unavailable. Please try again."); }
  }
  renderLS();
  tick(); loadLS();
  setInterval(tick, 60 * 1000);        // spot: daqiiqad kasta
  setInterval(loadLS, 5 * 60 * 1000);  // futures: 5 daqiiqo kasta
  window.XCLacagta = { state: st, agg, shotSVG, shotPNG };
})();
