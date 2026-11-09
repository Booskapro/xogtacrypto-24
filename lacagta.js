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

  // ---------- Qaabka bogga ----------
  root.innerHTML = `
    <div class="lq-bar">
      <div class="lq-tabs" role="tablist">${TF.map((t) => `<button role="tab" data-tf="${t.k}"${t.k === st.tf ? ' class="on" aria-selected="true"' : ""}>${esc(t.lab)}</button>`).join("")}</div>
      <span class="lq-live"><b class="pulse"></b><span id="lq-at">Live</span></span>
    </div>
    <div class="lq-big">
      <div class="lq-io in"><div><span class="lq-io-l">⬆ ${T("Iibsi (lacag soo gashay)", "Buying (money in)")} · <em class="lq-tfl"></em></span><b id="lq-in">—</b><small id="lq-in-p"></small></div><svg class="lq-ring" viewBox="0 0 120 120" id="lq-in-r"></svg></div>
      <div class="lq-io out"><div><span class="lq-io-l">⬇ ${T("Iibin (lacag baxday)", "Selling (money out)")} · <em class="lq-tfl"></em></span><b id="lq-out">—</b><small id="lq-out-p"></small></div><svg class="lq-ring" viewBox="0 0 120 120" id="lq-out-r"></svg></div>
    </div>
    <div class="lq-sum" id="lq-sum">${T("Xogta ayaa soo socota…", "Loading data…")}</div>

    <div class="lq-h"><h2>${T("Coin kasta", "Each coin")}</h2><span><em class="lq-tfl"></em> · ${T("cagaar = soo gashay, casaan = baxday", "green = in, red = out")}</span></div>
    <div class="lq-coins" id="lq-coins"></div>

    <div class="lq-h"><h2>${T("Dhammaan waqtiyada hal mar", "All timeframes at once")}</h2><span>${T("Lacagta saafiga ah (soo gashay − baxday)", "Net money (in − out)")}</span></div>
    <div class="lq-tw"><table class="lq-t"><thead><tr><th>Coin</th>${TF.map((t) => `<th data-tf="${t.k}">${esc(t.th)}</th>`).join("")}</tr></thead><tbody id="lq-tb"></tbody></table></div>

    <div class="lq-h"><h2>${T("Long iyo Short (futures)", "Long vs Short (futures)")}</h2><span>${T("Binance futures · 5 daqiiqo kasta · saamiga > 1 = long ayaa badan", "Binance futures · every 5 min · ratio > 1 = more longs")}</span></div>
    <div class="lq-ls" id="lq-ls"></div>
    <div class="lq-exp"><b>${T("Sida loo akhriyo", "How to read it")}</b>
      <span>${T("<b>Long</b> = qof ku sharad ah in qiimuhu kor u kaco. <b>Short</b> = qof ku sharad ah in uu hoos u dhaco.", "<b>Long</b> = betting the price goes up. <b>Short</b> = betting it goes down.")}</span>
      <span>${T("Saamiga 2.0 = qof kasta oo short ah, 2 qof ayaa long ah. <b>Dadka caadiga ah</b> waa tirada akoonnada; <b>whales</b> waa lacagta ganacsatada ugu waaweyn.", "Ratio 2.0 = for every short there are 2 longs. <b>Regular traders</b> counts accounts; <b>whales</b> weighs the money of the biggest traders.")}</span>
      <span>${T("Marka dadka badankiisu dhinac isku raacaan, suuqu mararka qaar wuu ka soo horjeedaa — ha u qaadan talo iibsi ama iibin.", "When the crowd leans hard one way, the market sometimes moves the other way — this is not a buy or sell signal.")}</span></div>

    <div class="lq-h"><h2>${T("Goorma ayay lacagtu soo gashaa? (7 maalin)", "When does money flow in? (7 days)")}</h2><span>Heatmap</span></div>`;

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
    root.querySelector("#lq-in-p").textContent = bp.toFixed(1) + T("% ganacsiga oo dhan", "% of all trading");
    root.querySelector("#lq-out-p").textContent = (100 - bp).toFixed(1) + T("% ganacsiga oo dhan", "% of all trading");
    root.querySelector("#lq-in-r").innerHTML = ring(bp, "#2BD67B");
    root.querySelector("#lq-out-r").innerHTML = ring(100 - bp, "#F05A5F");
    const share = A.tot ? Math.abs(A.net) / A.tot : 0;
    const how = share < 0.01 ? T("aad u yar", "only slightly") : share < 0.04 ? T("wax yar", "somewhat") : T("si cad", "clearly");
    const sumEl = root.querySelector("#lq-sum"); sumEl.className = "lq-sum " + cls(A.net);
    sumEl.innerHTML = `${esc(tf.long)}: <b class="${cls(A.net)}">${fmt(A.net, true)} ${A.net >= 0 ? T("ayaa soo gashay", "flowed in") : T("ayaa baxday", "flowed out")}</b> → ` +
      esc(A.net >= 0 ? T(`iibsadayaasha ayaa ${how} ka xoog badan iibiyayaasha.`, `buyers are ${how} stronger than sellers.`) : T(`iibiyayaasha ayaa ${how} ka xoog badan iibsadayaasha.`, `sellers are ${how} stronger than buyers.`));

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
    if (!st.ls) { box.innerHTML = `<div class="lq-lsc lq-na">${st.lsErr ? T("Xogta futures hadda lama heli karo (Binance). Waxaan isku dayi doonnaa 5 daqiiqo kadib.", "Futures data is unavailable right now (Binance). We'll retry in 5 minutes.") : T("Xogta ayaa soo socota…", "Loading data…")}</div>`; return; }
    const row = (l, v, txt) => `<div class="lq-r"><span>${l}</span><b class="${v == null ? "" : v >= 1 ? "up" : "down"}">${txt}</b></div>`;
    box.innerHTML = [["BTCUSDT", "Bitcoin"], ["ETHUSDT", "Ethereum"]].map(([s, n]) => {
      const d = st.ls[s]; if (!d) return "";
      const lead = d.acc >= 1;
      return `<div class="lq-lsc"><div class="lq-lsh"><b>Long / Short · ${n}</b><span class="lq-tag ${lead ? "up" : "down"}">${lead ? T("Long ayaa badan", "More longs") : T("Short ayaa badan", "More shorts")}</span></div>
        ${row(T("Dadka caadiga ah (accounts)", "Regular traders (accounts)"), d.acc, d.acc.toFixed(2))}
        ${row(T("Whales (positions)", "Whales (positions)"), d.top, d.top.toFixed(2))}
        <div class="lq-r"><span>Long %</span><b>${Math.round(d.long * 100)}%</b></div>
        <div class="lq-split sm"><i style="width:${d.long * 100}%"></i><i style="width:${100 - d.long * 100}%"></i></div></div>`;
    }).join("") + (st.lsAt ? `<div class="lq-src">${T("Isha: Binance futures · la cusboonaysiiyay ", "Source: Binance futures · updated ")}${pad(st.lsAt.getHours())}:${pad(st.lsAt.getMinutes())}</div>` : "");
  }

  root.querySelector(".lq-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-tf]"); if (!b) return;
    st.tf = b.dataset.tf; try { localStorage.setItem("xc-lq-tf", st.tf); } catch (err) { /* ignore */ }
    root.querySelectorAll(".lq-tabs button").forEach((x) => { const on = x === b; x.classList.toggle("on", on); x.setAttribute("aria-selected", on ? "true" : "false"); });
    render();
  });
  root.querySelector(".lq-t thead").addEventListener("click", (e) => { const h = e.target.closest("th[data-tf]"); if (h) root.querySelector(`.lq-tabs button[data-tf="${h.dataset.tf}"]`).click(); });

  async function tick() {
    try { await loadSpot(); render(); }
    catch (e) { if (!st.at) root.querySelector("#lq-sum").textContent = T("Xogta lama heli karo hadda. Isku day mar kale.", "Data unavailable. Please try again."); }
  }
  renderLS();
  tick(); loadLS();
  setInterval(tick, 60 * 1000);        // spot: daqiiqad kasta
  setInterval(loadLS, 5 * 60 * 1000);  // futures: 5 daqiiqo kasta
  window.XCLacagta = { state: st, agg };
})();
