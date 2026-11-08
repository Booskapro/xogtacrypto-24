/* =========================================================
   LACAGTA SOCOTA — Heatmap (7 maalin × 24 saac) · LIVE
   Isha: Binance spot (bilaash) — klines 1 saac:
     lacagta lagu iibsaday (taker buy, USDT) − lacagta lagu iibiyay (taker sell, USDT)
   Saacadda hadda socota waa live: daqiiqad kasta ayaa dib loo soo qaadaa.
   Waqtiga: saacadda qofka (browser-ka).
   ========================================================= */
(function () {
  "use strict";
  const grid = document.getElementById("xc-grid");
  if (!grid) return;
  const EN = window.I18N && window.I18N.lang === "en";
  const T = (so, en) => (EN ? en : so);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const API = "https://data-api.binance.vision/api/v3/klines";
  const SETS = {
    btc: { name: "Bitcoin", short: "BTC", syms: ["BTCUSDT"] },
    eth: { name: "Ethereum", short: "ETH", syms: ["ETHUSDT"] },
    alt: { name: T("Altcoins (top 10)", "Altcoins (top 10)"), short: "Altcoins", syms: ["SOLUSDT", "XRPUSDT", "BNBUSDT", "DOGEUSDT", "ADAUSDT", "TRXUSDT", "LINKUSDT", "AVAXUSDT", "SUIUSDT", "LTCUSDT"] }
  };
  const DAYS = EN ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : ["Axd", "Isn", "Tal", "Arb", "Kha", "Jim", "Sab"];
  const MO = EN ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] : ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Lul", "Og", "Seb", "Okt", "Nof", "Dis"];
  const G = "#2BD67B", R = "#F05A5F";
  const pad = (n) => String(n).padStart(2, "0");
  const fmtM = (v) => { const a = Math.abs(v), s = v > 0 ? "+" : v < 0 ? "−" : ""; return s + "$" + (a >= 1e9 ? (a / 1e9).toFixed(2) + "B" : a >= 1e6 ? (a / 1e6).toFixed(a >= 1e8 ? 0 : 1) + "M" : Math.round(a / 1e3) + "K"); };
  const dayKey = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  const TZ = (() => { try { return (Intl.DateTimeFormat().resolvedOptions().timeZone || "").split("/").pop().replace(/_/g, " "); } catch (e) { return ""; } })();
  const st = { set: "btc", week: 0, data: {}, at: null, model: null };
  const WEEKS = [T("Toddobaadkan", "This week"), T("Toddobaadkii hore", "Last week"), T("2 toddobaad kahor", "2 weeks ago"), T("3 toddobaad kahor", "3 weeks ago")];

  // ---------- Kaarka ----------
  const I = {
    cam: '<svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="fill"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  };
  const el = document.createElement("article");
  el.className = "xcc fh"; el.id = "lacagta"; el.dataset.cat = "crypto";
  el.innerHTML = `<div class="xcc-top"><div class="xcc-k">${T("Crypto · Lacagta socota", "Crypto · Money flow")}</div><div class="xcc-act">
      <span class="xcc-badge"><b class="pulse"></b>Live</span>
      <button class="xcc-ib" data-act="menu" aria-label="${T("Sawir", "Image")}" aria-haspopup="true">${I.cam}</button>
      <div class="xcc-menu" role="menu" hidden>
        <button data-act="dl">${I.dl}${T("Soo deji sawirka", "Download image")}</button>
        <button data-act="copy">${I.copy}${T("Koobi garee sawirka", "Copy image")}</button>
        <button data-act="link">${I.link}${T("Koobi garee link-ga", "Copy link")}</button>
        <hr><button data-act="x">${I.x}${T("Ku wadaag X", "Share on X")}</button>
      </div></div></div>
    <div class="fh-hd"><div><h2 class="xcc-t" id="fh-title">${T("Goorma ayay lacagtu soo gashaa?", "When does money flow in?")}</h2>
      <p class="xcc-s">${T("Sanduuq kasta = 1 saac · cagaar = lacag soo gashay (iibsi), casaan = lacag baxday (iibin) · waqtiga: saacaddaada", "Each box = 1 hour · green = money in (buying), red = money out (selling) · your local time")}${TZ ? " (" + esc(TZ) + ")" : ""}</p></div>
      <div class="fh-big"><b id="fh-total">—</b><span id="fh-range">${T("7-dii maalmood ee u dambeeyay", "last 7 days")}</span></div></div>
    <div class="fh-bar"><div class="fh-tabs" role="tablist">${Object.keys(SETS).map((k) => `<button data-set="${k}" class="${k === "btc" ? "on" : ""}">${esc(SETS[k].name)}</button>`).join("")}</div>
      <div class="fh-nav fh-wk"><button data-d="1" aria-label="${T("Toddobaadkii hore", "Previous week")}">‹</button><span id="fh-wl">${esc(WEEKS[0])}</span><button data-d="-1" aria-label="${T("Toddobaadka xiga", "Next week")}" disabled>›</button></div></div>
    <div class="fh-plot"><div class="xcc-load">${T("Xogta ayaa soo socota…", "Loading data…")}</div></div>
    <div class="fh-leg"><span>${T("Iibin xoog leh", "Strong selling")}</span><i></i><span>${T("Iibsi xoog leh", "Strong buying")}</span></div>
    <div class="fh-kp" id="fh-kp"></div>
    <div class="xcc-bot"><div class="xcc-src">${T("Isha: Binance (spot, USDT) · Xogta Crypto ayaa xisaabisay", "Source: Binance (spot, USDT) · computed by Xogta Crypto")}</div><div class="xcc-src" id="fh-upd"></div></div>
    <div class="xcc-note" id="fh-note"></div>`;
  const after = document.getElementById("btc-50-200");
  if (after && after.nextSibling) grid.insertBefore(el, after.nextSibling); else grid.appendChild(el);

  // ---------- Xogta ----------
  async function klines(sym) {
    const r = await fetch(`${API}?symbol=${sym}&interval=1h&limit=720`, { cache: "no-store" });
    if (!r.ok) throw new Error(sym);
    return (await r.json()).map((k) => { const qv = +k[7], tb = +k[10]; return { t: k[0], close: +k[4], buy: tb, sell: qv - tb, net: 2 * tb - qv }; });
  }
  async function load(set) {
    const res = await Promise.allSettled(SETS[set].syms.map(klines));
    const ok = res.filter((r) => r.status === "fulfilled").map((r) => r.value);
    if (!ok.length) throw new Error("no data");
    const m = new Map();
    ok.forEach((rows) => rows.forEach((x) => { const a = m.get(x.t) || { t: x.t, buy: 0, sell: 0, net: 0, close: null }; a.buy += x.buy; a.sell += x.sell; a.net += x.net; if (ok.length === 1) a.close = x.close; m.set(x.t, a); }));
    return [...m.values()].sort((a, b) => a.t - b.t);
  }

  function model(rows, w) {
    w = w || 0;
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = []; for (let k = 6; k >= 0; k--) { const d = new Date(today); d.setDate(d.getDate() - k - 7 * w); days.push(d); }
    const idx = new Map(days.map((d, j) => [dayKey(d), j]));
    const cells = days.map(() => new Array(24).fill(null));
    rows.forEach((x) => { const d = new Date(x.t), j = idx.get(dayKey(d)); if (j != null) cells[j][d.getHours()] = x; });
    const flat = cells.flat().filter(Boolean);
    const abs = flat.map((c) => Math.abs(c.net)).sort((a, b) => a - b);
    const scale = abs.length ? abs[Math.floor(abs.length * 0.9)] || abs[abs.length - 1] || 1 : 1;
    const total = flat.reduce((s, c) => s + c.net, 0);
    const last24 = rows.slice(-24).reduce((s, c) => s + c.net, 0);
    const todayNet = cells[6].filter(Boolean).reduce((s, c) => s + c.net, 0);
    const cur = rows[rows.length - 1];
    const col = new Array(24).fill(0); flat.forEach((c) => { col[new Date(c.t).getHours()] += c.net; });
    let hb = 0, hs = 0; col.forEach((v, h) => { if (v > col[hb]) hb = h; if (v < col[hs]) hs = h; });
    const buyAll = flat.reduce((s, c) => s + c.buy, 0), sellAll = flat.reduce((s, c) => s + c.sell, 0);
    const dayNet = cells.map((r) => r.filter(Boolean).reduce((a, c) => a + c.net, 0));
    let db = 0, ds = 0; dayNet.forEach((v, j) => { if (v > dayNet[db]) db = j; if (v < dayNet[ds]) ds = j; });
    return { w, dayNet, db, ds, days, cells, scale, total, last24, todayNet, cur, hb, hs, col, buyPct: buyAll + sellAll ? Math.round(buyAll / (buyAll + sellAll) * 100) : 50 };
  }
  const cellCol = (v, scale, alpha) => { const a = Math.min(1, Math.abs(v) / scale); return v >= 0 ? `rgba(43,214,123,${(0.1 + a * 0.88) * (alpha || 1)})` : `rgba(240,90,95,${(0.1 + a * 0.88) * (alpha || 1)})`; };

  // ---------- Bogga ----------
  function render() {
    const m = st.model, S = SETS[st.set]; if (!m) return;
    const box = el.querySelector(".fh-plot"), W = Math.max(300, box.clientWidth), mob = W < 560;
    const lw = mob ? 46 : 62, rw = mob ? 46 : 74, cw = (W - lw - rw) / 24, chh = mob ? 24 : 32, gap = 2, ph = mob ? 26 : 34, H = 7 * chh + ph + 34;
    const fs = (v) => { const a = Math.abs(v), sg = v > 0 ? "+" : v < 0 ? "−" : ""; return sg + (a >= 1e9 ? (a / 1e9).toFixed(1) + "B" : a >= 1e6 ? Math.round(a / 1e6) + "M" : Math.round(a / 1e3) + "K"); };
    let s = "";
    m.days.forEach((d, j) => {
      s += `<text x="0" y="${j * chh + chh / 2 + 4}" class="fh-dl">${esc(j === 6 && !m.w ? T("Maanta", "Today") : DAYS[d.getDay()])}</text>`;
      if (!mob) s += `<text x="0" y="${j * chh + chh / 2 + 16}" class="fh-dd">${d.getDate()} ${MO[d.getMonth()]}</text>`;
      for (let h = 0; h < 24; h++) {
        const c = m.cells[j][h], x = lw + h * cw, y = j * chh;
        if (!c) { s += `<rect x="${x}" y="${y}" width="${cw - gap}" height="${chh - gap}" rx="4" class="fh-empty"/>`; continue; }
        const live = c === m.cur;
        s += `<rect x="${x}" y="${y}" width="${cw - gap}" height="${chh - gap}" rx="3" fill="${cellCol(c.net, m.scale)}" data-j="${j}" data-h="${h}"${live ? ' class="fh-live"' : ""}/>`;
      }
      const dv = m.dayNet[j]; if (m.cells[j].some(Boolean)) s += `<text x="${W}" y="${j * chh + chh / 2 + 4}" class="fh-dv ${dv >= 0 ? "up" : "down"}" text-anchor="end">${fs(dv)}</text>`;
    });
    // safka hoose: wadarta saacad kasta (toddobaadka)
    const py = 7 * chh + 6, pm = py + ph / 2, cmax = Math.max(1, ...m.col.map(Math.abs));
    s += `<line x1="${lw}" x2="${lw + 24 * cw - gap}" y1="${pm}" y2="${pm}" class="fh-ax"/>${mob ? "" : `<text x="0" y="${pm + 4}" class="fh-dd">${esc(T("Saacadaha", "By hour"))}</text>`}`;
    m.col.forEach((v, h) => { const hh = Math.max(1.5, Math.abs(v) / cmax * (ph / 2 - 2)); s += `<rect x="${lw + h * cw + cw * 0.18}" y="${v >= 0 ? pm - hh : pm}" width="${cw * 0.64 - gap}" height="${hh}" rx="1.5" fill="${v >= 0 ? G : R}" opacity=".85"/>`; });
    [0, 3, 6, 9, 12, 15, 18, 21, 23].forEach((h) => { if (mob && h % 6) return; s += `<text x="${h === 23 ? lw + 24 * cw - gap : lw + h * cw + (cw - gap) / 2}" y="${H - 4}" class="fh-hl" text-anchor="${h === 23 ? "end" : "middle"}">${pad(h)}:00</text>`; });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(T("Lacagta socota", "Money flow"))}">${s}</svg><div class="xcc-tip" hidden></div>`;
    const tot = el.querySelector("#fh-total"); tot.textContent = fmtM(m.total); tot.className = m.total >= 0 ? "up" : "down";
    const rng = m.days[0].getDate() + " " + MO[m.days[0].getMonth()] + " – " + m.days[6].getDate() + " " + MO[m.days[6].getMonth()];
    el.querySelector("#fh-range").textContent = m.w ? rng : T("7-dii maalmood ee u dambeeyay", "last 7 days");
    const wk = m.w ? WEEKS[m.w].toLowerCase() : T("toddobaadkan", "this week");
    el.querySelector("#fh-title").textContent = m.total >= 0
      ? T(`Lacag ayaa ${S.short} soo gashay ${wk}`, `Money flowed into ${S.short} — ${wk}`)
      : T(`Lacag ayaa ${S.short} ka baxday ${wk}`, `Money flowed out of ${S.short} — ${wk}`);
    const kp = (l, v) => `<div><span>${l}</span><b class="${v >= 0 ? "up" : "down"}">${fmtM(v)}</b></div>`;
    const dn = (j) => DAYS[m.days[j].getDay()] + " " + m.days[j].getDate() + " " + MO[m.days[j].getMonth()];
    const bs = `<div><span>${T("Iibsi / iibin", "Buy / sell")}</span><b>${m.buyPct}% / ${100 - m.buyPct}%</b></div>`;
    el.querySelector("#fh-kp").innerHTML = m.w
      ? kp(T("Wadarta toddobaadka", "Week total"), m.total) + kp(T("Maalinta ugu iibsi badan · ", "Top buying day · ") + dn(m.db), m.dayNet[m.db]) + kp(T("Maalinta ugu iibin badan · ", "Top selling day · ") + dn(m.ds), m.dayNet[m.ds]) + bs
      : kp(T("Saacadda hadda", "This hour"), m.cur ? m.cur.net : 0) + kp(T("Maanta", "Today"), m.todayNet) + kp(T("24 saac", "24 hours"), m.last24) + bs;
    const hr = (h) => pad(h) + ":00–" + pad((h + 1) % 24) + ":00";
    const l1 = m.total >= 0 ? T(`${m.w ? rng : "7-dii maalmood ee u dambeeyay"} iibsadayaasha ${S.short} ayaa xoog badnaa: lacag saafi ah oo ${fmtM(m.total)} ah ayaa soo gashay.`, `${m.w ? rng : "Over the last 7 days"}: ${S.short} buyers were stronger, ${fmtM(m.total)} net inflow.`)
      : T(`${m.w ? rng : "7-dii maalmood ee u dambeeyay"} iibiyayaasha ${S.short} ayaa xoog badnaa: lacag saafi ah oo ${fmtM(m.total)} ah ayaa baxday.`, `${m.w ? rng : "Over the last 7 days"}: ${S.short} sellers were stronger, ${fmtM(m.total)} net outflow.`);
    const l2 = m.w ? T(`Maalinta ugu iibsiga badnayd: ${dn(m.db)} (${fmtM(m.dayNet[m.db])}) · ugu iibinta badnayd: ${dn(m.ds)} (${fmtM(m.dayNet[m.ds])}).`, `Top buying day: ${dn(m.db)} (${fmtM(m.dayNet[m.db])}) · top selling day: ${dn(m.ds)} (${fmtM(m.dayNet[m.ds])}).`)
      : m.last24 >= 0 ? T(`24-kii saac ee u dambeeyay: ${fmtM(m.last24)} → iibsi ayaa hadda badan.`, `Last 24 hours: ${fmtM(m.last24)} → buyers lead now.`) : T(`24-kii saac ee u dambeeyay: ${fmtM(m.last24)} → iibin ayaa hadda badan.`, `Last 24 hours: ${fmtM(m.last24)} → sellers lead now.`);
    el.querySelector("#fh-note").innerHTML = `<b>${T("Maxay ka dhigan tahay?", "What does it mean?")}</b><span>${esc(l1)}</span><span>${esc(l2)}</span>` +
      `<span>${esc(T(`Saacadda iibsigu ugu badan yahay: ${hr(m.hb)} · iibintu: ${hr(m.hs)} (saacaddaada).`, `Strongest buying hour: ${hr(m.hb)} · selling: ${hr(m.hs)} (your time).`))}</span>`;
    el.querySelector("#fh-upd").textContent = st.at ? T("La cusboonaysiiyay ", "Updated ") + pad(st.at.getHours()) + ":" + pad(st.at.getMinutes()) : "";
  }
  async function refresh(set) {
    set = set || st.set;
    try {
      const rows = await load(set); st.data[set] = rows;
      if (set === st.set) { st.at = new Date(); st.model = model(rows, st.week); render(); }
    } catch (e) {
      if (!st.model) el.querySelector(".fh-plot").innerHTML = `<div class="xcc-load">${T("Xogta lama heli karo hadda. Isku day mar kale.", "Data unavailable. Please try again.")}</div>`;
    }
  }
  el.querySelector(".fh-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-set]"); if (!b) return;
    st.set = b.dataset.set; el.querySelectorAll(".fh-tabs button").forEach((x) => x.classList.toggle("on", x === b));
    if (st.data[st.set]) { st.model = model(st.data[st.set], st.week); render(); }
    else el.querySelector(".fh-plot").innerHTML = `<div class="xcc-load">${T("Xogta ayaa soo socota…", "Loading data…")}</div>`;
    refresh(st.set);
  });
  el.querySelector(".fh-wk").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]"); if (!b) return;
    e.stopPropagation(); st.week = Math.max(0, Math.min(3, st.week + +b.dataset.d));
    el.querySelector("#fh-wl").textContent = WEEKS[st.week];
    el.querySelector('.fh-wk [data-d="1"]').disabled = st.week === 3; el.querySelector('.fh-wk [data-d="-1"]').disabled = st.week === 0;
    if (st.data[st.set]) { st.model = model(st.data[st.set], st.week); render(); }
  });
  // Tooltip
  el.querySelector(".fh-plot").addEventListener("mousemove", (e) => {
    const r = e.target.closest && e.target.closest("rect[data-j]"), tip = el.querySelector(".xcc-tip"); if (!tip) return;
    if (!r || !st.model) { tip.hidden = true; return; }
    const c = st.model.cells[+r.dataset.j][+r.dataset.h], d = new Date(c.t), box = el.querySelector(".fh-plot").getBoundingClientRect();
    tip.innerHTML = `<b>${esc(DAYS[d.getDay()] + " " + d.getDate() + " " + MO[d.getMonth()] + " · " + pad(d.getHours()) + ":00")}${c === st.model.cur ? " · " + T("hadda", "now") : ""}</b>` +
      `<span><i style="background:${c.net >= 0 ? G : R}"></i>${T("Saafi", "Net")}<em>${fmtM(c.net)}</em></span><span><i style="background:${G}"></i>${T("Iibsi", "Buy")}<em>${fmtM(c.buy).replace("+", "")}</em></span><span><i style="background:${R}"></i>${T("Iibin", "Sell")}<em>${fmtM(c.sell).replace("+", "")}</em></span>` +
      (c.close ? `<span><i style="background:var(--text)"></i>${T("Qiimaha", "Price")}<em>$${Math.round(c.close).toLocaleString("en-US")}</em></span>` : "");
    tip.hidden = false;
    const x = e.clientX - box.left; tip.style.left = Math.min(box.width - tip.offsetWidth - 4, Math.max(4, x + (x > box.width / 2 ? -tip.offsetWidth - 14 : 14))) + "px";
    tip.style.top = Math.max(4, e.clientY - box.top - 20) + "px";
  });
  el.querySelector(".fh-plot").addEventListener("mouseleave", () => { const t = el.querySelector(".xcc-tip"); if (t) t.hidden = true; });

  // ---------- Sawirka (1200×675) ----------
  const W0 = 1200, H0 = 675, FB = "Inter, Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
  const K = { bg: "#0B1220", ink: "#FFFFFF", mut: "#A9B6C4", dim: "#6E7D8F", line: "rgba(255,255,255,.09)" };
  const tx = (x, y, t, size, o) => { o = o || {}; return `<text x="${x}" y="${y}" font-family="${o.d ? FD : FB}" font-size="${size}" font-weight="${o.w || 400}" fill="${o.c || K.ink}"${o.a ? ` text-anchor="${o.a}"` : ""}>${esc(t)}</text>`; };
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
  async function exportSVG() {
    const m = st.model, S = SETS[st.set];
    const [fc, logo] = await Promise.all([fonts(), LOGO || dataURI("logo.svg").then((u) => (LOGO = u))]);
    let s = `<rect width="${W0}" height="${H0}" fill="${K.bg}"/>`;
    s += tx(56, 62, el.querySelector("#fh-title").textContent, 30, { d: 1, w: 800 });
    s += tx(56, 92, T(`${S.name} · Binance spot · sanduuq kasta = 1 saac · waqtiga: ${TZ || "maxalli"}`, `${S.name} · Binance spot · each box = 1 hour · time: ${TZ || "local"}`), 15, { c: K.mut });
    s += tx(W0 - 56, 70, fmtM(m.total), 46, { d: 1, w: 800, c: m.total >= 0 ? G : R, a: "end" }) + tx(W0 - 56, 94, el.querySelector("#fh-range").textContent, 14, { c: K.mut, a: "end" });
    const x0 = 140, cw = (W0 - 56 - x0) / 24, ch = 52, y0 = 130;
    m.days.forEach((d, j) => {
      s += tx(56, y0 + j * ch + 24, j === 6 && !m.w ? T("Maanta", "Today") : DAYS[d.getDay()], 15, { w: 700 }) + tx(56, y0 + j * ch + 42, d.getDate() + " " + MO[d.getMonth()], 12, { c: K.dim });
      for (let h = 0; h < 24; h++) { const c = m.cells[j][h]; s += `<rect x="${(x0 + h * cw).toFixed(1)}" y="${y0 + j * ch}" width="${(cw - 4).toFixed(1)}" height="${ch - 5}" rx="6" fill="${c ? cellCol(c.net, m.scale) : "rgba(255,255,255,.03)"}"${c && c === m.cur ? ' stroke="#fff" stroke-width="2.5"' : ""}/>`; }
    });
    [0, 3, 6, 9, 12, 15, 18, 21].forEach((h) => { s += tx(x0 + h * cw + (cw - 4) / 2, y0 + 7 * ch + 18, pad(h) + ":00", 12, { c: K.dim, a: "middle" }); });
    const ly = y0 + 7 * ch + 46; s += tx(x0, ly + 10, T("Iibin xoog leh", "Strong selling"), 12.5, { c: K.mut });
    for (let k = 0; k < 9; k++) s += `<rect x="${x0 + 110 + k * 26}" y="${ly}" width="23" height="12" rx="3" fill="${cellCol((k - 4) / 4, 1)}"/>`;
    s += tx(x0 + 110 + 9 * 26 + 10, ly + 10, T("Iibsi xoog leh", "Strong buying"), 12.5, { c: K.mut });
    s += tx(W0 - 56, ly + 10, (m.w ? "" : T("24 saac: ", "24h: ") + fmtM(m.last24) + "  ·  ") + T("Iibsi ", "Buy ") + m.buyPct + "%", 14, { w: 700, c: m.last24 >= 0 ? G : R, a: "end" });
    s += `<line x1="56" x2="${W0 - 56}" y1="${H0 - 58}" y2="${H0 - 58}" stroke="${K.line}"/>` + tx(56, H0 - 24, "© " + new Date().getFullYear() + " Xogta Crypto 24/7", 13, { c: K.dim });
    s += `<image href="${logo}" x="${W0 - 56 - 214}" y="${H0 - 46}" width="28" height="28"/>` + tx(W0 - 56, H0 - 25, "Xogta Crypto 24/7", 19, { d: 1, w: 800, a: "end" });
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}"><style>${fc}</style>${s}</svg>`;
  }
  async function exportPNG() {
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(await exportSVG()); await img.decode();
    const cv = document.createElement("canvas"); cv.width = W0 * 2; cv.height = H0 * 2; cv.getContext("2d").drawImage(img, 0, 0, W0 * 2, H0 * 2);
    return await new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  const url = () => location.origin + location.pathname.replace(/\.html$/, "") + "#lacagta";
  const fileName = () => `xogta-crypto-lacagta-${SETS[st.set].short.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.png`;
  let tT;
  const toast = (msg) => { let t = document.getElementById("xc-toast"); if (!t) { t = document.createElement("div"); t.id = "xc-toast"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("on"); clearTimeout(tT); tT = setTimeout(() => t.classList.remove("on"), 2600); };
  const menu = el.querySelector(".xcc-menu"), mb = el.querySelector('[data-act="menu"]');
  const close = () => { menu.hidden = true; mb.classList.remove("on"); };
  el.querySelector(".xcc-act").addEventListener("click", async (e) => {
    const b = e.target.closest("button"); if (!b) return;
    e.stopPropagation(); // xc-charts (grid) ha u qaban — haddii kale menu-gu wuu xirmayaa
    const a = b.dataset.act;
    if (a === "menu") { const o = menu.hidden; menu.hidden = !o; mb.classList.toggle("on", o); return; }
    close(); if (!st.model) return;
    try {
      if (a === "link") { await navigator.clipboard.writeText(url()); toast(T("Link-ga waa la koobiyeeyay", "Link copied")); return; }
      if (a === "copy") { await navigator.clipboard.write([new ClipboardItem({ "image/png": exportPNG() })]); toast(T("Sawirka waa la koobiyeeyay", "Image copied")); return; }
      const blob = await exportPNG(), file = new File([blob], fileName(), { type: "image/png" }), text = el.querySelector("#fh-title").textContent + "\n\n" + url() + (window.SITE && window.SITE.x_handle ? "\n" + window.SITE.x_handle : "");
      if (matchMedia("(pointer: coarse)").matches && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share(a === "x" ? { files: [file], text } : { files: [file] }); return; }
      if (a === "dl") { const l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = fileName(); document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 1500); toast(T("Sawirka waa la soo dejiyay", "Image downloaded")); return; }
      try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast(T("Sawirka waa la koobiyeeyay — X-ka ku dheji (Ctrl+V)", "Image copied — paste it into X (Ctrl+V)")); } catch (err) { /* ignore */ }
      window.open("https://x.com/intent/post?text=" + encodeURIComponent(text), "_blank", "noopener");
    } catch (err) { if (!err || err.name !== "AbortError") toast(T("Waan ka xumahay, isku day mar kale", "Sorry, please try again")); }
  });
  document.addEventListener("click", (e) => { if (!el.querySelector(".xcc-act").contains(e.target)) close(); });

  // Filter-ka kooxaha (xc-charts) + cabbirka
  const fb = document.getElementById("xc-filter");
  if (fb) fb.addEventListener("click", (e) => { const b = e.target.closest("button[data-cat]"); if (!b) return; el.hidden = b.dataset.cat !== "all" && b.dataset.cat !== "crypto"; if (!el.hidden) render(); });
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(render, 150); });

  refresh("btc");
  setInterval(() => refresh(st.set), 60 * 1000); // live: daqiiqad kasta
  window.XCFlow = { state: st, exportSVG, exportPNG, refresh };
})();
