/* =========================================================
   LACAGTA — qaybaha xirfadeed (sida CoinGlass), xog bilaash ah oo LIVE ah
   A) Iibsi vs iibin suuq kasta   : Binance futures + spot (klines taker), OKX (rubik taker-volume-contract, USD)
   B) Coin kasta: long vs short    : Binance futures (taker 5m, whales, dadka)
   C) Ganacsiyada waaweyn (live)   : WebSocket — Binance aggTrade, OKX trades, Bybit publicTrade
   D) Dadka vs whales, suuq kasta  : Binance, OKX (rubik), Bybit (account-ratio)
   E) Chart 30 maalin              : Binance (xogta futures/data waxay haysaa 30 maalin oo kaliya)
   F) Volume                       : Binance futures (ticker 24h, klines 1h/1d, open interest)
   G) Su'aalaha (FAQ)
   Haddii suuq uusan jawaabin → "—" (wax lama sameeyo / lama malayn)
   ========================================================= */
(function () {
  "use strict";
  const L = window.XCLacagta, host = document.getElementById("lq2");
  if (!L || !host) return;
  const { CAM, fmt, esc, T, EN, pad, tx, box, bar, G, R, K } = L;
  const FAPI = "https://fapi.binance.com/fapi/v1/", FD = "https://fapi.binance.com/futures/data/", SPOT = "https://data-api.binance.vision/api/v3/";
  const OKX = "https://www.okx.com/api/v5/rubik/stat/", BYB = "https://api.bybit.com/v5/market/";
  const getj = async (u) => { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error(r.status + " " + u); return r.json(); };
  // OKX/Bybit: server-kaaga ayaa loo marayaa (CORS) → haddii uu fashilo, si toos ah ayaa la isku dayaa
  const viaPx = async (u) => { try { return await getj("/api/member?op=px&u=" + encodeURIComponent(u)); } catch (e) { return await getj(u); } };
  const okx = async (path) => { const j = await viaPx(OKX + path); if (!j || j.code !== "0" || !Array.isArray(j.data)) throw new Error("okx"); return j.data; };
  const hm = (d) => pad(d.getHours()) + ":" + pad(d.getMinutes());
  const pct = (v, d) => (v == null || !isFinite(v) ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(d == null ? 2 : d) + "%");
  const cls = (v) => (v == null ? "" : v >= 0 ? "up" : "down");
  const price = (p) => "$" + (p >= 1000 ? p.toLocaleString("en-US", { maximumFractionDigits: 1 }) : p >= 1 ? p.toFixed(p >= 10 ? 2 : 4) : p.toPrecision(4));
  const NAME = { BTC: "Bitcoin", ETH: "Ethereum", SOL: "Solana", XRP: "XRP", BNB: "BNB", DOGE: "Dogecoin", ADA: "Cardano", LINK: "Chainlink" };
  // calaamadda (bias) saamiga long/short
  const bias = (r) => r == null ? ["—", "n"] : r >= 1.5 ? [T("Long xoog leh", "Strong long"), "b"] : r >= 1.1 ? ["Long", "b"] : r <= 0.67 ? [T("Short xoog leh", "Strong short"), "s"] : r <= 0.91 ? ["Short", "s"] : [T("Dhexdhexaad", "Neutral"), "n"];
  const pill = (r) => { const [l, c] = bias(r); return `<span class="lq-pill ${c}">${esc(l)}</span>`; };
  const splitBar = (buyP, w) => `<div class="lq-sb"${w ? ` style="width:${w}"` : ""}><i style="width:${Math.max(4, buyP)}%"><b>${buyP.toFixed(1)}%</b></i><i style="width:${Math.max(4, 100 - buyP)}%"><b>${(100 - buyP).toFixed(1)}%</b></i></div>`;
  const tabs = (name, items, on) => `<div class="lq-mini" data-g="${name}">${items.map(([k, l]) => `<button data-v="${k}"${k === on ? ' class="on"' : ""}>${esc(l)}</button>`).join("")}</div>`;
  const H = (title, right, id) => `<div class="lq-h"${id ? ` id="${id}"` : ""}><h2>${title}</h2><span class="lq-hr">${right || ""}</span></div>`;

  // ---------- Qaabka ----------
  host.innerHTML =
    H(T("Iibsi vs iibin: suuq kasta", "Buy vs sell by exchange"), tabs("exc", [["BTC", "BTC"], ["ETH", "ETH"]], "BTC") + tabs("ext", [["1", T("1 saac", "1h")], ["4", T("4 saac", "4h")], ["24", T("24 saac", "24h")]], "4") + CAM("ex")) +
    `<div class="lq-card" id="lq-ex"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div>` +
    `<div class="lq-2">` +
      `<div>${H(T("Coin kasta: long vs short", "Each coin: long vs short"), `<span class="lq-live sm"><b class="pulse"></b>Live</span>` + CAM("lsc"))}<div class="lq-card lq-tw2" id="lq-lsc"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div></div>` +
      `<div>${H(T("Ganacsiyada waaweyn", "Large trades"), `<span class="lq-live sm"><b class="pulse"></b>Live</span>` + tabs("trc", [["ALL", T("Dhammaan", "All")], ["BTC", "BTC"], ["ETH", "ETH"], ["SOL", "SOL"]], "ALL"))}<div class="lq-card lq-tr" id="lq-tr"><div class="lq-load">${T("Waxaa la sugayaa ganacsi ≥ $100K…", "Waiting for trades ≥ $100K…")}</div></div></div>` +
    `</div>` +
    H(T("Dadka vs whales: suuq kasta", "Retail vs whales by exchange"), tabs("xlc", [["BTC", "BTC"], ["ETH", "ETH"]], "BTC") + CAM("lsx")) +
    `<div class="lq-3" id="lq-lsx"><div class="lq-card lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div>` +
    `<p class="lq-note">${T("Saamiga 2.0 = 2 long, 1 short. <b>Dadka</b> = akoonnada caadiga ah · <b>Whales</b> = ganacsatada ugu waaweyn. Talo iibsi ama iibin ma aha.", "Ratio 2.0 = 2 longs per short. <b>Retail</b> = regular accounts · <b>Whales</b> = biggest traders. Not a buy or sell signal.")}</p>` +
    H(T("Long/short iyo qiimaha", "Long/short vs price"), tabs("hc", [["BTC", "BTC"], ["ETH", "ETH"]], "BTC") + tabs("hm", [["acc", T("Dadka", "Retail")], ["top", "Whales"]], "acc") + `<span class="lq-dim">${T("30 maalin · 4 saac", "30 days · 4h")}</span>`) +
    `<div class="lq-card" id="lq-hist"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div>` +
    H(T("Volume-ka futures", "Futures volume"), `<span class="lq-dim">Binance · 24 ${T("saac", "h")}</span>` + CAM("vol")) +
    `<div class="lq-4" id="lq-vk"></div>` +
    `<div class="lq-card lq-tw2" id="lq-vt"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div>` +
    H(T("Heatmap-ka volume-ka", "Volume heatmap"), `<span class="lq-dim">${T("cagaar = kordhay · casaan = yaraaday", "green = up · red = down")}</span>`) +
    `<div class="lq-card lq-tw2" id="lq-vh"></div>`;

  const S = { exc: "BTC", ext: "4", xlc: "BTC", trc: "ALL", hc: "BTC", hm: "acc", ex: {}, lsc: null, lsx: {}, hist: {}, vol: null, trades: [], at: {} };
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".lq-mini button"); if (!b) return;
    const g = b.parentElement.dataset.g; S[g] = b.dataset.v;
    b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    if (g === "exc") loadEx(); if (g === "ext") renderEx(); if (g === "xlc") loadLsx(); if (g === "trc") renderTr();
    if (g === "hc" || g === "hm") loadHist();
  });

  // ================= A) Iibsi vs iibin: suuq kasta =================
  async function loadEx() {
    const c = S.exc, out = {};
    const jobs = [
      getj(`${FAPI}klines?symbol=${c}USDT&interval=1h&limit=24`).then((k) => { out.bf = k.map((x) => ({ b: +x[10], t: +x[7] })); }),
      getj(`${SPOT}klines?symbol=${c}USDT&interval=1h&limit=24`).then((k) => { out.bs = k.map((x) => ({ b: +x[10], t: +x[7] })); }),
      okx(`taker-volume-contract?instId=${c}-USDT-SWAP&period=1H&unit=2&limit=24`).then((d) => { out.ok = d.slice().reverse().map((x) => ({ b: +x[2], t: +x[1] + +x[2] })); })
    ];
    await Promise.allSettled(jobs);
    S.ex[c] = out; S.at.ex = new Date(); renderEx();
  }
  function exRows() {
    const d = S.ex[S.exc] || {}, n = +S.ext;
    const sum = (a) => a ? a.slice(-n).reduce((s, x) => ({ b: s.b + x.b, t: s.t + x.t }), { b: 0, t: 0 }) : null;
    const rows = [["Binance · futures", sum(d.bf)], ["OKX · futures", sum(d.ok)], ["Binance · spot", sum(d.bs)]];
    const ok = rows.filter((r) => r[1] && r[1].t > 0);
    const all = ok.reduce((s, r) => ({ b: s.b + r[1].b, t: s.t + r[1].t }), { b: 0, t: 0 });
    return [[T("Dhammaan", "All"), ok.length ? all : null, 1]].concat(rows);
  }
  function renderEx() {
    const el = document.getElementById("lq-ex"); if (!S.ex[S.exc]) return;
    el.innerHTML = `<div class="lq-exr lq-exh"><span>${T("Suuqa", "Exchange")}</span><span>${T("Iibsi", "Buy")} / ${T("Iibin", "Sell")}</span><span class="r">${T("Iibsi", "Buy")}</span><span class="r">${T("Iibin", "Sell")}</span></div>` +
      exRows().map(([n, v, top]) => `<div class="lq-exr${top ? " top" : ""}"><span>${esc(n)}</span>${v ? splitBar(v.b / v.t * 100) : `<span class="lq-dim">${T("Hadda lama heli karo", "Unavailable")}</span>`}<span class="r up">${v ? fmt(v.b) : "—"}</span><span class="r down">${v ? fmt(v.t - v.b) : "—"}</span></div>`).join("") +
      `<div class="lq-src">${S.exc} · ${T("waqtigii u dambeeyay", "last")} ${S.ext} ${T("saac", "h")} · ${T("La cusboonaysiiyay", "Updated")} ${hm(S.at.ex)}</div>`;
  }
  L.add("ex", { head: () => T(`Iibsi vs iibin · ${S.exc} · ${S.ext} saac`, `Buy vs sell · ${S.exc} · ${S.ext}h`), at: () => S.at.ex, src: "Binance, OKX", body: () => {
    let s = tx(56, 72, T(`Iibsi vs iibin: suuq kasta · ${S.exc} · ${S.ext} saac`, `Buy vs sell by exchange · ${S.exc} · ${S.ext}h`), 32, { d: 1, w: 800 }) + box(56, 105, 1088, 440);
    exRows().forEach(([n, v, top], i) => {
      const y = 175 + i * 100;
      s += tx(88, y, n, top ? 26 : 23, { w: top ? 800 : 600 });
      if (v) { s += bar(400, y - 18, 440, 22, v.b / v.t) + tx(410, y - 1, (v.b / v.t * 100).toFixed(1) + "%", 15, { w: 800, c: "#04121F" }) + tx(830, y - 1, (100 - v.b / v.t * 100).toFixed(1) + "%", 15, { w: 800, c: "#fff", a: "end" }); s += tx(990, y, fmt(v.b), 24, { d: 1, w: 800, c: G, a: "end" }) + tx(1112, y, fmt(v.t - v.b), 24, { d: 1, w: 800, c: R, a: "end" }); }
      else s += tx(400, y, "—", 22, { c: K.mut });
    });
    return s;
  } });

  // ================= B) Coin kasta: long vs short =================
  const LSC = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE", "ADA", "LINK"];
  let TICK = null, TICKAt = 0;
  async function tickers() { if (TICK && Date.now() - TICKAt < 60e3) return TICK; const a = await getj(FAPI + "ticker/24hr"); TICK = {}; a.forEach((x) => { TICK[x.symbol] = x; }); TICKAt = Date.now(); return TICK; }
  const last = (a) => (Array.isArray(a) && a.length ? a[a.length - 1] : null);
  async function loadLsc() {
    try {
      const tk = await tickers();
      const rows = await Promise.all(LSC.map(async (c) => {
        const s = c + "USDT";
        const [tb, top, acc] = await Promise.allSettled([getj(`${FD}takerlongshortRatio?symbol=${s}&period=5m&limit=1`), getj(`${FD}topLongShortPositionRatio?symbol=${s}&period=5m&limit=1`), getj(`${FD}globalLongShortAccountRatio?symbol=${s}&period=5m&limit=1`)]);
        const t = tk[s] || {}, b = tb.status === "fulfilled" ? last(tb.value) : null;
        return { c, p: +t.lastPrice, ch: +t.priceChangePercent, buy: b ? +b.buyVol / (+b.buyVol + +b.sellVol) * 100 : null,
          top: top.status === "fulfilled" && last(top.value) ? +last(top.value).longShortRatio : null, acc: acc.status === "fulfilled" && last(acc.value) ? +last(acc.value).longShortRatio : null };
      }));
      S.lsc = rows; S.at.lsc = new Date(); renderLsc();
    } catch (e) { if (!S.lsc) document.getElementById("lq-lsc").innerHTML = `<div class="lq-load">${T("Xogta hadda lama heli karo.", "Data unavailable.")}</div>`; }
  }
  function renderLsc() {
    document.getElementById("lq-lsc").innerHTML = `<table class="lq-tt"><thead><tr><th>Coin</th><th>${T("Qiimaha", "Price")}</th><th>${T("24s", "24h")}</th><th>${T("Iibsi / iibin", "Buy / sell")}</th><th>Whales</th><th class="r">${T("Dadka", "Retail")}</th></tr></thead><tbody>` +
      S.lsc.map((r) => `<tr><td><b>${r.c}</b></td><td class="lq-px" data-p="${r.c}">${isFinite(r.p) ? price(r.p) : "—"}</td><td class="${cls(r.ch)}" data-ch="${r.c}">${pct(r.ch)}</td><td>${r.buy != null ? splitBar(r.buy, "150px") : "—"}</td><td>${pill(r.top)} <span class="lq-dim">${r.top != null ? r.top.toFixed(2) : ""}</span></td><td class="r ${r.acc != null ? cls(r.acc - 1) : ""}">${r.acc != null ? r.acc.toFixed(2) : "—"}</td></tr>`).join("") +
      `</tbody></table><div class="lq-src">Binance futures · ${T("Qiimaha: live (ilbiriqsi kasta)", "Price: live (every second)")} · ${T("Long/short: 5 daqiiqo kasta", "Long/short: every 5 min")} · ${hm(S.at.lsc)}</div>`;
  }
  // Qiimaha live (WebSocket): isbeddel kasta wuu iftiimayaa
  function startPrices() {
    ws("wss://fstream.binance.com/stream?streams=" + LSC.map((c) => c.toLowerCase() + "usdt@miniTicker").join("/"), () => {}, (m) => {
      const x = m.data; if (!x || !S.lsc) return;
      const c = x.s.replace("USDT", ""), r = S.lsc.find((q) => q.c === c); if (!r) return;
      const p = +x.c, o = +x.o, ch = o ? (p / o - 1) * 100 : r.ch;
      const td = document.querySelector(`#lq-lsc [data-p="${c}"]`), tc = document.querySelector(`#lq-lsc [data-ch="${c}"]`);
      if (td && p !== r.p) { td.textContent = price(p); td.classList.remove("fu", "fd"); void td.offsetWidth; td.classList.add(p > r.p ? "fu" : "fd"); }
      if (tc) { tc.textContent = pct(ch); tc.className = cls(ch); }
      r.p = p; r.ch = ch;
    });
  }
  L.add("lsc", { head: () => T("Coin kasta: long vs short", "Each coin: long vs short"), at: () => S.at.lsc, src: "Binance futures", body: () => {
    let s = tx(56, 72, T("Coin kasta: long vs short · 5 daqiiqo", "Each coin: long vs short · 5 min"), 32, { d: 1, w: 800 }) + box(56, 100, 1088, 450);
    const cx = [88, 200, 380, 520, 900, 1112];
    [["COIN", 0], [T("QIIMAHA", "PRICE"), 1], [T("24S", "24H"), 2], [T("IIBSI / IIBIN", "BUY / SELL"), 3], ["WHALES", 4], [T("DADKA", "RETAIL"), 5]].forEach(([l, j]) => { s += tx(cx[j], 140, l, 15, { w: 700, c: K.mut, a: j === 5 ? "end" : null }); });
    (S.lsc || []).forEach((r, i) => {
      const y = 190 + i * 45;
      s += tx(cx[0], y, r.c, 21, { w: 800 }) + tx(cx[1], y, isFinite(r.p) ? price(r.p) : "—", 19) + tx(cx[2], y, pct(r.ch), 19, { c: r.ch >= 0 ? G : R });
      if (r.buy != null) s += bar(cx[3], y - 15, 330, 18, r.buy / 100) + tx(cx[3] + 8, y - 1, r.buy.toFixed(1) + "%", 13, { w: 800, c: "#04121F" });
      const [bl, bc] = bias(r.top); s += tx(cx[4], y, bl + (r.top != null ? " · " + r.top.toFixed(2) : ""), 18, { w: 700, c: bc === "b" ? G : bc === "s" ? R : K.mut, a: "end" });
      s += tx(cx[5], y, r.acc != null ? r.acc.toFixed(2) : "—", 20, { d: 1, w: 800, a: "end", c: r.acc >= 1 ? G : R });
    });
    return s;
  } });

  // ================= C) Ganacsiyada waaweyn (WebSocket) =================
  const MIN = 100000, BIG = 1000000, TRC = ["BTC", "ETH", "SOL"], CTVAL = { BTC: 0.01, ETH: 0.1, SOL: 1 };
  function addTrade(t) {
    if (t.v < MIN) return;
    S.trades.unshift(t); if (S.trades.length > 120) S.trades.length = 120;
    clearTimeout(addTrade.tm); addTrade.tm = setTimeout(renderTr, 150);
  }
  function renderTr() {
    const el = document.getElementById("lq-tr"), list = S.trades.filter((t) => S.trc === "ALL" || t.c === S.trc).slice(0, 14);
    if (!list.length) { el.innerHTML = `<div class="lq-load">${T("Waxaa la sugayaa ganacsi ≥ $100K…", "Waiting for trades ≥ $100K…")}</div>`; return; }
    el.innerHTML = `<div class="lq-trr lq-trh"><span>Coin · ${T("suuq", "exchange")}</span><span class="r">${T("Qiimaha", "Price")}</span><span class="r">${T("Lacagta", "Value")}</span><span class="r">${T("Waqti", "Time")}</span></div>` +
      list.map((t) => { const d = new Date(t.ts), nw = renderTr.seen && !renderTr.seen.has(t); return `<div class="lq-trr ${t.buy ? "b" : "s"}${t.v >= BIG ? " big" : ""}${nw ? " nw" : ""}"><span><b>${t.c}</b> · ${t.ex} <em>${t.buy ? T("iibsi", "buy") : T("iibin", "sell")}</em></span><span class="r">${price(t.p)}</span><span class="r"><b>${fmt(t.v)}</b></span><span class="r">${hm(d)}:${pad(d.getSeconds())}</span></div>`; }).join("") +
      (renderTr.seen = new Set(list), "") + `<div class="lq-src">≥ $100K · ${T("cagaar = iibsi, casaan = iibin", "green = buy, red = sell")} · Binance, OKX, Bybit</div>`;
  }
  function ws(url, onopen, onmsg) {
    let sock;
    const go = () => { try { sock = new WebSocket(url); } catch (e) { return; } sock.onopen = () => onopen(sock); sock.onmessage = (m) => { try { onmsg(JSON.parse(m.data), sock); } catch (e) { /* ignore */ } }; sock.onclose = () => setTimeout(go, 5000); };
    go();
  }
  async function seedTrades() {
    await Promise.allSettled(TRC.map(async (c) => {
      const a = await getj(`${FAPI}aggTrades?symbol=${c}USDT&limit=1000`);
      a.forEach((x) => { const v = +x.p * +x.q; if (v >= MIN) S.trades.push({ c, ex: "Binance", p: +x.p, v, buy: !x.m, ts: x.T }); });
    }));
    S.trades.sort((a, b) => b.ts - a.ts); renderTr();
  }
  function startTrades() {
    ws("wss://fstream.binance.com/stream?streams=" + TRC.map((c) => c.toLowerCase() + "usdt@aggTrade").join("/"), () => {}, (m) => {
      const x = m.data; if (!x) return; const c = x.s.replace("USDT", ""), p = +x.p;
      addTrade({ c, ex: "Binance", p, v: p * +x.q, buy: !x.m, ts: x.T });
    });
    ws("wss://ws.okx.com:8443/ws/v5/public", (s) => { s.send(JSON.stringify({ op: "subscribe", args: TRC.map((c) => ({ channel: "trades", instId: c + "-USDT-SWAP" })) })); setInterval(() => { try { s.send("ping"); } catch (e) { /* ignore */ } }, 25000); }, (m) => {
      if (!m.data || !m.arg) return; const c = m.arg.instId.split("-")[0];
      m.data.forEach((x) => { const p = +x.px; addTrade({ c, ex: "OKX", p, v: p * +x.sz * (CTVAL[c] || 1), buy: x.side === "buy", ts: +x.ts }); });
    });
    ws("wss://stream.bybit.com/v5/public/linear", (s) => { s.send(JSON.stringify({ op: "subscribe", args: TRC.map((c) => "publicTrade." + c + "USDT") })); setInterval(() => { try { s.send(JSON.stringify({ op: "ping" })); } catch (e) { /* ignore */ } }, 20000); }, (m) => {
      if (!m.data || !m.topic) return; const c = m.topic.split(".")[1].replace("USDT", "");
      m.data.forEach((x) => { const p = +x.p; addTrade({ c, ex: "Bybit", p, v: p * +x.v, buy: x.S === "Buy", ts: +x.T }); });
    });
  }

  // ================= D) Dadka vs whales: suuq kasta =================
  async function loadLsx() {
    const c = S.xlc, s = c + "USDT", id = c + "-USDT-SWAP", o = { bn: {}, ok: {}, by: {} };
    const r1 = (a) => (a && a.length ? +a[0][1] : null);
    await Promise.allSettled([
      getj(`${FD}globalLongShortAccountRatio?symbol=${s}&period=5m&limit=1`).then((a) => { o.bn.acc = +last(a).longShortRatio; }),
      getj(`${FD}topLongShortAccountRatio?symbol=${s}&period=5m&limit=1`).then((a) => { o.bn.tacc = +last(a).longShortRatio; }),
      getj(`${FD}topLongShortPositionRatio?symbol=${s}&period=5m&limit=1`).then((a) => { o.bn.tpos = +last(a).longShortRatio; }),
      okx(`contracts/long-short-account-ratio-contract?instId=${id}&period=5m&limit=1`).then((d) => { o.ok.acc = r1(d); }),
      okx(`contracts/long-short-account-ratio-contract-top-trader?instId=${id}&period=5m&limit=1`).then((d) => { o.ok.tacc = r1(d); }),
      okx(`contracts/long-short-position-ratio-contract-top-trader?instId=${id}&period=5m&limit=1`).then((d) => { o.ok.tpos = r1(d); }),
      viaPx(`${BYB}account-ratio?category=linear&symbol=${s}&period=5min&limit=1`).then((j) => { const x = j.result.list[0]; o.by.acc = +x.buyRatio / +x.sellRatio; })
    ]);
    S.lsx[c] = o; S.at.lsx = new Date(); renderLsx();
  }
  const XL = [["bn", "Binance"], ["ok", "OKX"], ["by", "Bybit"]], XR = [["acc", T("Dadka caadiga ah", "Retail")], ["tacc", T("Whales (akoon)", "Whales (accounts)")], ["tpos", T("Whales (lacag)", "Whales (positions)")]];
  function renderLsx() {
    const o = S.lsx[S.xlc]; if (!o) return;
    document.getElementById("lq-lsx").innerHTML = XL.map(([k, n]) => `<div class="lq-card lq-xc"><b>${n}</b>` + XR.map(([f, l]) => { const v = o[k][f]; return `<div class="lq-xr"><span>${l}</span><span>${v != null && isFinite(v) ? `<em class="${cls(v - 1)}">${v.toFixed(2)}</em> ${pill(v)}` : `<em class="lq-dim">—</em>`}</span></div>`; }).join("") + `</div>`).join("") +
      `<div class="lq-src" style="grid-column:1/-1">${S.xlc} · 5 ${T("daqiiqo", "min")} · ${T("La cusboonaysiiyay", "Updated")} ${hm(S.at.lsx)}${o.by.tacc == null ? " · " + T("Bybit: whales lama bixiyo", "Bybit: no whale data") : ""}</div>`;
  }
  L.add("lsx", { head: () => T(`Dadka vs whales · ${S.xlc}`, `Retail vs whales · ${S.xlc}`), at: () => S.at.lsx, src: "Binance, OKX, Bybit", body: () => {
    const o = S.lsx[S.xlc] || { bn: {}, ok: {}, by: {} };
    let s = tx(56, 72, T(`Dadka vs whales: suuq kasta · ${S.xlc}`, `Retail vs whales by exchange · ${S.xlc}`), 32, { d: 1, w: 800 });
    XL.forEach(([k, n], i) => {
      const x = 56 + i * 372; s += box(x, 105, 344, 440) + tx(x + 28, 160, n, 30, { w: 800 });
      XR.forEach(([f, l], j) => { const v = o[k][f], y = 250 + j * 105; s += tx(x + 28, y - 34, l, 19, { c: K.mut }); if (v != null && isFinite(v)) { const [bl, bc] = bias(v); s += tx(x + 28, y + 10, v.toFixed(2), 40, { d: 1, w: 800, c: v >= 1 ? G : R }) + tx(x + 316, y + 4, bl, 19, { w: 700, a: "end", c: bc === "b" ? G : bc === "s" ? R : K.mut }); } else s += tx(x + 28, y + 10, "—", 34, { c: K.mut }); });
    });
    return s;
  } });

  // ================= E) Chart 30 maalin =================
  async function loadHist() {
    const c = S.hc, key = c + S.hm, s = c + "USDT";
    const el = document.getElementById("lq-hist");
    if (!S.hist[key]) el.innerHTML = `<div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div>`;
    try {
      const ep = S.hm === "acc" ? "globalLongShortAccountRatio" : "topLongShortPositionRatio";
      const [rat, kl] = await Promise.all([getj(`${FD}${ep}?symbol=${s}&period=4h&limit=180`), getj(`${FAPI}klines?symbol=${s}&interval=4h&limit=180`)]);
      const px = new Map(kl.map((k) => [k[0], +k[4]]));
      S.hist[key] = rat.map((r) => ({ t: +r.timestamp, r: +r.longShortRatio, p: px.get(+r.timestamp) || null }));
      S.at.hist = new Date(); renderHist();
    } catch (e) { if (!S.hist[key]) el.innerHTML = `<div class="lq-load">${T("Xogta hadda lama heli karo.", "Data unavailable.")}</div>`; }
  }
  function renderHist() {
    const d = S.hist[S.hc + S.hm], el = document.getElementById("lq-hist"); if (!d || !d.length) return;
    const W = Math.max(320, el.clientWidth - 36), Hh = W < 600 ? 230 : 300, pl = 58, pr = 46, pt = 14, pb = 28, iw = W - pl - pr, ih = Hh - pt - pb;
    const rs = d.map((x) => x.r), ps = d.filter((x) => x.p).map((x) => x.p);
    const rmax = Math.max(1.2, ...rs) * 1.05, rmin = Math.min(0.8, ...rs) * 0.95, pmax = Math.max(...ps) * 1.01, pmin = Math.min(...ps) * 0.99;
    const x = (i) => pl + i / (d.length - 1) * iw, yr = (v) => pt + (1 - (v - rmin) / (rmax - rmin)) * ih, yp = (v) => pt + (1 - (v - pmin) / (pmax - pmin)) * ih, y1 = yr(1);
    const area = `M${pl},${y1} ` + d.map((p, i) => `L${x(i).toFixed(1)},${yr(p.r).toFixed(1)}`).join(" ") + ` L${pl + iw},${y1} Z`;
    let s = `<defs><clipPath id="lqa"><rect x="0" y="0" width="${W}" height="${y1}"/></clipPath><clipPath id="lqb"><rect x="0" y="${y1}" width="${W}" height="${Hh}"/></clipPath></defs>`;
    for (let k = 0; k <= 4; k++) { const v = rmin + (rmax - rmin) * k / 4, pv = pmin + (pmax - pmin) * k / 4, y = yr(v); s += `<line x1="${pl}" x2="${pl + iw}" y1="${y}" y2="${y}" class="lq-gl"/><text x="${W - 4}" y="${y + 4}" text-anchor="end" class="lq-ax">${v.toFixed(2)}</text><text x="${pl - 6}" y="${y + 4}" text-anchor="end" class="lq-ax">$${pv >= 1000 ? (pv / 1000).toFixed(1) + "K" : pv.toFixed(0)}</text>`; }
    s += `<path d="${area}" fill="#2BD67B" opacity=".55" clip-path="url(#lqa)"/><path d="${area}" fill="#F05A5F" opacity=".6" clip-path="url(#lqb)"/><line x1="${pl}" x2="${pl + iw}" y1="${y1}" y2="${y1}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
    s += `<polyline fill="none" stroke="var(--text)" stroke-width="1.8" points="${d.map((p, i) => p.p ? x(i).toFixed(1) + "," + yp(p.p).toFixed(1) : "").filter(Boolean).join(" ")}"/>`;
    const MO = L.MO, step = Math.ceil(d.length / (W < 600 ? 4 : 8));
    d.forEach((p, i) => { if (i % step === 0) { const t = new Date(p.t); s += `<text x="${x(i)}" y="${Hh - 6}" text-anchor="middle" class="lq-ax">${t.getDate()} ${MO[t.getMonth()]}</text>`; } });
    const lp = d[d.length - 1];
    el.innerHTML = `<div class="lq-hl"><span><i style="background:var(--text)"></i>${T("Qiimaha", "Price")} ${lp.p ? price(lp.p) : ""}</span><span><i style="background:#2BD67B"></i>${S.hm === "acc" ? T("Dadka", "Retail") : "Whales"} ${lp.r.toFixed(2)} · ${esc(bias(lp.r)[0])}</span></div>` +
      `<svg viewBox="0 0 ${W} ${Hh}" width="100%" height="${Hh}" class="lq-hsvg">${s}<line class="lq-cx" y1="${pt}" y2="${pt + ih}" stroke="var(--muted)" style="display:none"/></svg><div class="lq-tip" hidden></div>` +
      `<div class="lq-src">Binance futures · ${T("ka sarreeya 1 (cagaar) = long ayaa badan · ka hooseeya (casaan) = short", "above 1 (green) = more longs · below (red) = more shorts")} · ${T("Binance wuxuu bixiyaa 30 maalin oo kaliya", "Binance provides 30 days only")}</div>`;
    const svg = el.querySelector("svg"), tip = el.querySelector(".lq-tip"), cx = el.querySelector(".lq-cx");
    svg.addEventListener("mousemove", (e) => {
      const b = svg.getBoundingClientRect(), mx = (e.clientX - b.left) / b.width * W, i = Math.max(0, Math.min(d.length - 1, Math.round((mx - pl) / iw * (d.length - 1)))), p = d[i], t = new Date(p.t);
      cx.style.display = ""; cx.setAttribute("x1", x(i)); cx.setAttribute("x2", x(i));
      tip.hidden = false; tip.innerHTML = `<b>${t.getDate()} ${MO[t.getMonth()]} · ${hm(t)}</b><span>${T("Qiimaha", "Price")}: ${p.p ? price(p.p) : "—"}</span><span>Long/short: <em class="${cls(p.r - 1)}">${p.r.toFixed(2)}</em></span>`;
      const px = x(i) / W * b.width; tip.style.left = Math.min(b.width - 170, Math.max(0, px + (px > b.width / 2 ? -180 : 12))) + "px"; tip.style.top = "40px";
    });
    svg.addEventListener("mouseleave", () => { tip.hidden = true; cx.style.display = "none"; });
  }

  // ================= F) Volume =================
  const HMC = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE"];
  async function pool(items, n, fn) { const out = new Array(items.length); let i = 0; await Promise.all(new Array(n).fill(0).map(async () => { while (i < items.length) { const j = i++; try { out[j] = await fn(items[j]); } catch (e) { out[j] = null; } } })); return out; }
  async function loadVol() {
    try {
      TICKAt = 0; const tk = await tickers();
      const perps = Object.values(tk).filter((x) => /USDT$/.test(x.symbol) && +x.quoteVolume > 0 && +x.count > 0);
      const total = perps.reduce((s, x) => s + +x.quoteVolume, 0);
      const top = perps.sort((a, b) => +b.quoteVolume - +a.quoteVolume).slice(0, 20).map((x) => x.symbol);
      HMC.forEach((c) => { if (!top.includes(c + "USDT") && tk[c + "USDT"]) top.push(c + "USDT"); });
      const rows = await pool(top, 6, async (s) => {
        const [h, dd, oi] = await Promise.all([getj(`${FAPI}klines?symbol=${s}&interval=1h&limit=49`), getj(`${FAPI}klines?symbol=${s}&interval=1d&limit=61`), getj(`${FAPI}openInterest?symbol=${s}`).catch(() => null)]);
        const hv = h.slice(0, -1).map((k) => +k[7]), dv = dd.slice(0, -1).map((k) => +k[7]), sm = (a) => a.reduce((x, y) => x + y, 0);
        const win = (a, n) => [sm(a.slice(-n)), sm(a.slice(-2 * n, -n))], ch = ([a, b]) => (b > 0 ? (a / b - 1) * 100 : null);
        const t = tk[s], p = +t.lastPrice, w1 = win(hv, 1), w4 = win(hv, 4), w12 = win(hv, 12), w24 = win(hv, 24), w30 = win(dv, 30);
        return { s, c: s.replace(/USDT$/, ""), p, ch: +t.priceChangePercent, v24: +t.quoteVolume, v1: w1[0], v4: w4[0], v12: w12[0], v30: w30[0], c1: ch(w1), c4: ch(w4), c12: ch(w12), c24: ch(w24), c30: ch(w30), oi: oi ? +oi.openInterest * p : null };
      });
      let spot = null; try { spot = await getj(`${SPOT}ticker/24hr?symbol=BTCUSDT`); } catch (e) { /* ignore */ }
      S.vol = { total, rows: rows.filter(Boolean), spot: spot ? +spot.quoteVolume : null }; S.at.vol = new Date(); renderVol();
    } catch (e) { if (!S.vol) document.getElementById("lq-vt").innerHTML = `<div class="lq-load">${T("Xogta hadda lama heli karo.", "Data unavailable.")}</div>`; }
  }
  const heat = (v) => { if (v == null || !isFinite(v)) return ""; const a = Math.min(1, Math.abs(v) / 100) * 0.55 + 0.08; return `background:${v >= 0 ? `rgba(43,214,123,${a})` : `rgba(240,90,95,${a})`}`; };
  function renderVol() {
    const V = S.vol, by = (c) => V.rows.find((r) => r.c === c), btc = by("BTC"), eth = by("ETH");
    const card = (l, v, sub, chg) => `<div class="lq-card lq-vc"><span>${l}</span><b>${v != null ? fmt(v) : "—"}${chg != null ? ` <em class="${cls(chg)}">${pct(chg)}</em>` : ""}</b><small>${sub || ""}</small></div>`;
    document.getElementById("lq-vk").innerHTML =
      card(T("Futures · dhammaan coin-ka", "Futures · all coins"), V.total, "Binance USDT", null) +
      card("BTC futures", btc && btc.v24, btc ? (btc.v24 / V.total * 100).toFixed(1) + T("% futures-ka", "% of futures") : "", btc && btc.c24) +
      card("ETH futures", eth && eth.v24, eth ? (eth.v24 / V.total * 100).toFixed(1) + T("% futures-ka", "% of futures") : "", eth && eth.c24) +
      card("BTC spot", V.spot, "Binance", null);
    const top = V.rows.slice(0, 20);
    document.getElementById("lq-vt").innerHTML = `<table class="lq-tt lq-vtt"><thead><tr><th>#</th><th>Coin</th><th class="r">${T("Qiimaha", "Price")}</th><th class="r">${T("Qiimaha 24s", "Price 24h")}</th><th class="r">Volume ${T("24s", "24h")}</th><th class="r">Vol ${T("24s", "24h")} %</th><th class="r">Vol ${T("1s", "1h")} %</th><th class="r">Vol ${T("4s", "4h")} %</th><th class="r">Vol ${T("30m", "30d")} %</th><th class="r">OI</th><th class="r">OI / Vol</th></tr></thead><tbody>` +
      top.map((r, i) => `<tr><td class="lq-dim">${i + 1}</td><td><b>${esc(r.c)}</b></td><td class="r">${price(r.p)}</td><td class="r" style="${heat(r.ch * 5)}">${pct(r.ch)}</td><td class="r"><b>${fmt(r.v24)}</b></td><td class="r" style="${heat(r.c24)}">${pct(r.c24)}</td><td class="r" style="${heat(r.c1)}">${pct(r.c1)}</td><td class="r" style="${heat(r.c4)}">${pct(r.c4)}</td><td class="r" style="${heat(r.c30)}">${pct(r.c30)}</td><td class="r">${r.oi != null ? fmt(r.oi) : "—"}</td><td class="r">${r.oi != null ? (r.oi / r.v24).toFixed(2) : "—"}</td></tr>`).join("") +
      `</tbody></table><div class="lq-src">Binance futures (USDT) · ${T("Vol 1s/4s/24s % = marka la barbardhigo muddadii ka horraysay · 30m = 30 maalin", "Vol 1h/4h/24h % vs the previous period · 30d = 30 days")} · ${T("La cusboonaysiiyay", "Updated")} ${hm(S.at.vol)}</div>`;
    const cols = HMC.map(by).filter(Boolean);
    const u = (so, en) => T(so, en);
    const rowsH = [["Volume " + u("1s", "1h"), "v1", 0], ["Vol " + u("1s", "1h") + " %", "c1", 1], ["Volume " + u("4s", "4h"), "v4", 0], ["Vol " + u("4s", "4h") + " %", "c4", 1], ["Volume " + u("12s", "12h"), "v12", 0], ["Vol " + u("12s", "12h") + " %", "c12", 1], ["Volume " + u("24s", "24h"), "v24", 0], ["Vol " + u("24s", "24h") + " %", "c24", 1], ["Volume " + u("30m", "30d"), "v30", 0], ["Vol " + u("30m", "30d") + " %", "c30", 1]];
    document.getElementById("lq-vh").innerHTML = `<table class="lq-tt lq-vhm"><thead><tr><th></th>${cols.map((r) => `<th class="c">${esc(r.c)}</th>`).join("")}</tr></thead><tbody>` +
      rowsH.map(([l, f, isP]) => `<tr><td class="lq-dim">${l}</td>${cols.map((r) => isP ? `<td class="c" style="${heat(r[f])}">${pct(r[f])}</td>` : `<td class="c" style="${heat(r[f.replace("v", "c")])}"><b>${r[f] != null ? fmt(r[f]) : "—"}</b></td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  }
  L.add("vol", { head: () => T("Volume-ka futures", "Futures volume"), at: () => S.at.vol, src: "Binance futures", body: () => {
    const V = S.vol || { rows: [] }; let s = tx(56, 72, T("Volume-ka futures · 24 saac", "Futures volume · 24h"), 32, { d: 1, w: 800 }) + box(56, 100, 1088, 450);
    const cx = [88, 300, 520, 760, 1112];
    [["COIN", 0], [T("QIIMAHA", "PRICE"), 1], ["VOLUME 24S", 2], ["VOL 24S %", 3], ["OI", 4]].forEach(([l, j]) => { s += tx(cx[j], 140, l, 15, { w: 700, c: K.mut, a: j === 4 ? "end" : null }); });
    V.rows.slice(0, 8).forEach((r, i) => { const y = 190 + i * 45; s += tx(cx[0], y, r.c, 21, { w: 800 }) + tx(cx[1], y, price(r.p), 19) + tx(cx[2], y, fmt(r.v24), 21, { d: 1, w: 800 }) + tx(cx[3], y, pct(r.c24), 20, { w: 700, c: r.c24 >= 0 ? G : R }) + tx(cx[4], y, r.oi != null ? fmt(r.oi) : "—", 20, { a: "end" }); });
    return s;
  } });

  // ================= G) Su'aalaha =================
  const faq = document.getElementById("lq-faq");
  if (faq) {
    const Q = EN ? [
      ["What is volume?", "The total value traded. Price shows the direction; volume shows whether real money is behind the move."],
      ["Buy vs sell (taker)?", "A taker buy is someone buying immediately at the market price; a taker sell is someone selling immediately. More taker buying = buyers are more aggressive."],
      ["Rising price with rising volume?", "Usually a healthy move: more money supports the rise."],
      ["Rising price with falling volume?", "The move may be weak — fewer people are supporting it."],
      ["What is the long/short ratio?", "Longs bet on a rise, shorts on a fall. 2.0 means 2 longs for every short."],
      ["Retail vs whales?", "Retail counts ordinary accounts. Whales are the largest traders (top 20%). When they disagree, many traders follow the whales."],
      ["What is open interest (OI)?", "The total value of futures positions still open. Rising OI with rising price means new money is entering."],
      ["Large trades?", "Single trades of $100K or more. They show where big money is acting right now."],
      ["Is this financial advice?", "No. It is data to help you understand the market. Crypto is high risk."]
    ] : [
      ["Waa maxay volume?", "Wadarta lacagta lagu ganacsaday. Qiimuhu wuxuu sheegaa jihada; volume-ku wuxuu sheegaa haddii lacag dhab ah ay ka dambeyso dhaqdhaqaaqa."],
      ["Iibsi iyo iibin (taker) waa maxay?", "Iibsi taker = qof isla markiiba ku iibsada qiimaha suuqa. Iibin taker = qof isla markiiba iibiya. Iibsi badan = iibsadayaasha ayaa degdeg badan."],
      ["Qiimo kor u kacaya + volume kor u kacaya?", "Inta badan waa dhaqdhaqaaq caafimaad qaba: lacag badan ayaa taageeraysa kor u kaca."],
      ["Qiimo kor u kacaya + volume hoos u dhacaya?", "Kor u kacu wuu daciifi karaa: dad yar ayaa taageeraya."],
      ["Saamiga long/short waa maxay?", "Long = ku sharad kor u kac, short = ku sharad hoos u dhac. 2.0 = qof kasta oo short ah, 2 qof ayaa long ah."],
      ["Dadka iyo whales?", "Dadka = akoonnada caadiga ah. Whales = ganacsatada ugu waaweyn (20% ugu sarreeya). Marka ay is khilaafaan, dad badan ayaa raaca whales-ka."],
      ["Open interest (OI) waa maxay?", "Wadarta lacagta futures ee weli furan. OI kor u kacaya + qiimo kor u kacaya = lacag cusub ayaa soo galaysa."],
      ["Ganacsiyada waaweyn?", "Hal ganacsi oo $100K ama ka badan ah. Waxay muujinayaan meesha lacagta waaweyni hadda ka shaqaynayso."],
      ["Ma talo maaliyadeed baa?", "Maya. Waa xog kaa caawinaysa fahamka suuqa. Crypto waa khatar sare."]
    ];
    faq.innerHTML = H(T("Su'aalaha badanaa la isweydiiyo", "Frequently asked questions"), "") + `<div class="lq-faq">` + Q.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${i + 1}. ${esc(q)}</summary><p>${esc(a)}</p></details>`).join("") + `</div>`;
  }

  // ---------- Bilow + cusboonaysiin ----------
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(renderHist, 150); });
  loadEx(); loadLsc().then(startPrices); loadLsx(); loadHist(); loadVol(); seedTrades().then(startTrades);
  setInterval(loadEx, 60e3); setInterval(loadLsc, 5 * 60e3); setInterval(loadLsx, 5 * 60e3); setInterval(loadHist, 30 * 60e3); setInterval(loadVol, 5 * 60e3);
  window.XCLacagtaPro = { S, renderHist };
})();
