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
    `<div id="sec-liq" class="lq-anchor"></div>` + H("Liquidations", `<span class="lq-dim">Binance · OKX · Bybit</span>`) +
    `<div class="lq-liq" id="lq-liq"></div>` +
    `<div id="sec-cf" class="lq-anchor"></div>` + H(T("Coin kasta: lacagta soo gashay iyo baxday", "Each coin: money in and out"), tabs("cfw", [["1", T("1 saac", "1h")], ["4", T("4 saac", "4h")], ["24", T("24 saac", "24h")]], "24") + CAM("cf")) +
    `<div class="lq-2" id="lq-cf"><div class="lq-card lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div>` +
    `<div id="sec-ls" class="lq-anchor"></div>` + H("Long / Short", tabs("lsv", [["coins", "Coins"], ["ex", T("Suuqyada", "Exchanges")], ["hist", T("Chart 30 maalin", "30-day chart")]], "coins") + `<span class="lsv-ctl" data-v="ex">${tabs("xlc", [["BTC", "BTC"], ["ETH", "ETH"]], "BTC")}</span><span class="lsv-ctl" data-v="hist" hidden>${tabs("hc", [["BTC", "BTC"], ["ETH", "ETH"]], "BTC")}${tabs("hm", [["acc", T("Dadka", "Retail")], ["top", "Whales"]], "acc")}</span>` + CAM("lsc")) +
    `<div class="lsv-p" data-v="coins"><div class="lq-card lq-tw2" id="lq-lsc"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div></div>` +
    `<div class="lsv-p" data-v="ex" hidden><div class="lq-3" id="lq-lsx"><div class="lq-card lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div></div>` +
    `<div class="lsv-p" data-v="hist" hidden><div class="lq-card" id="lq-hist"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div></div>` +
    `<p class="lq-note">${T("Saamiga 2.0 = 2 long, 1 short. <b>Dadka</b> = akoonnada caadiga ah · <b>Whales</b> = ganacsatada ugu waaweyn. Talo iibsi ama iibin ma aha.", "Ratio 2.0 = 2 longs per short. <b>Retail</b> = regular accounts · <b>Whales</b> = biggest traders. Not a buy or sell signal.")}</p>` +
    `<div id="sec-tr" class="lq-anchor"></div>` + H(T("Ganacsiyada waaweyn", "Large trades"), `<span class="lq-live sm"><b class="pulse"></b>Live</span>` + tabs("trc", [["ALL", T("Dhammaan", "All")], ["BTC", "BTC"], ["ETH", "ETH"], ["SOL", "SOL"]], "ALL")) +
    `<div class="lq-card lq-tr" id="lq-tr"><div class="lq-load">${T("Waxaa la sugayaa ganacsi ≥ $100K…", "Waiting for trades ≥ $100K…")}</div></div>` +
    `<div id="sec-vol" class="lq-anchor"></div>` + H("Volume", tabs("vm", [["fut", "Futures"], ["spot", "Spot"]], "fut") + `<span class="lq-dim">Binance · 24 ${T("saac", "h")} · ${T("crypto oo kaliya", "crypto only")}</span>` + CAM("vol")) +
    `<div class="lq-4" id="lq-vk"></div>` +
    `<div class="lq-card lq-tw2" id="lq-vt"><div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div></div>`;

  const S = { lsv: "coins", cfw: "24", cf: null, vm: "fut", cxp: "d1", exc: "BTC", ext: "4", xlc: "BTC", trc: "ALL", hc: "BTC", hm: "acc", ex: {}, lsc: null, lsx: {}, hist: {}, vol: null, trades: [], at: {} };
  host.addEventListener("click", (e) => {
    const b = e.target.closest(".lq-mini button"); if (!b) return;
    const g = b.parentElement.dataset.g; S[g] = b.dataset.v;
    b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    if (g === "lsv") { host.querySelectorAll(".lsv-p, .lsv-ctl").forEach((p) => { p.hidden = p.dataset.v !== S.lsv; }); if (S.lsv === "hist") renderHist(); }
    if (g === "cfw") renderCf(); if (g === "xlc") loadLsx(); if (g === "trc") renderTr();
    if (g === "hc" || g === "hm") loadHist();
    if (g === "vm") { if (S.vm === "spot" && !S.V.spot) loadVolSpot(); else renderVol(); }

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
  function flash(el, up) { if (!el) return; el.classList.remove("fu", "fd"); void el.offsetWidth; el.classList.add(up ? "fu" : "fd"); }
  function startPrices() {
    // Suuqa oo dhan, ilbiriqsi kasta (Binance futures !miniTicker@arr)
    ws("wss://fstream.binance.com/ws/!miniTicker@arr", () => {}, (arr) => {
      if (!Array.isArray(arr)) return;
      wsVol(S.V && S.V.fut, arr);
      arr.forEach((x) => {
        if (!/USDT$/.test(x.s)) return;
        const c = x.s.replace(/USDT$/, ""), p = +x.c, o = +x.o, ch = o ? (p / o - 1) * 100 : null, q = +x.q;
        const r1 = S.lsc && S.lsc.find((r) => r.c === c);
        if (r1) {
          if (p !== r1.p) { const td = document.querySelector(`#lq-lsc [data-p="${c}"]`); if (td) { td.textContent = price(p); flash(td, p > r1.p); } }
          const tc = document.querySelector(`#lq-lsc [data-ch="${c}"]`); if (tc && ch != null) { tc.textContent = pct(ch); tc.className = cls(ch); }
          r1.p = p; if (ch != null) r1.ch = ch;
        }
      });
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


  // ================= Liquidations (live): Binance + OKX + Bybit (WebSocket, bilaash) =================
  const LQ = { ev: [], t0: Date.now(), coin: "ALL", ex: "ALL", min: 0, side: "all", ct: {} };
  try { const c = JSON.parse(localStorage.getItem("xc-liq") || "null"); if (c && Array.isArray(c.ev)) { LQ.ev = c.ev.filter((e) => Date.now() - e.ts < 30 * 60e3); LQ.t0 = Math.max(c.t0 || Date.now(), Date.now() - 30 * 60e3); } } catch (e) { /* ignore */ }
  const LQC = ["BTC", "ETH", "SOL", "XRP", "DOGE", "BNB"];
  const lqBox = document.getElementById("lq-liq");
  // Kaydka 24 saac: daqiiqad kasta {l, s, n, ex:{Binance,OKX,Bybit}} + daqiiqadaha bogga la furay (coverage)
  const AG = { m: {}, seen: {}, big: null };
  try { const c = JSON.parse(localStorage.getItem("xc-liq24") || "null"); if (c && c.m) { Object.assign(AG, c); } } catch (e) { /* ignore */ }
  const minNow = () => Math.floor(Date.now() / 60e3);
  function agAdd(e) {
    const k = Math.floor(e.ts / 60e3), b = AG.m[k] || (AG.m[k] = { l: 0, s: 0, n: 0, ex: {} });
    if (e.long) b.l += e.v; else b.s += e.v; b.n++; b.ex[e.ex] = (b.ex[e.ex] || 0) + e.v;
    if (!AG.big || e.v > AG.big.v) AG.big = e;
  }
  function agSum(mins) {
    const t = minNow(), o = { l: 0, s: 0, n: 0, ex: {}, cov: 0 };
    for (let k = t - mins + 1; k <= t; k++) { const b = AG.m[k]; if (AG.seen[k]) o.cov++; if (!b) continue; o.l += b.l; o.s += b.s; o.n += b.n; Object.keys(b.ex).forEach((x) => { o.ex[x] = (o.ex[x] || 0) + b.ex[x]; }); }
    return o;
  }
  const covTxt = (c, mins) => (c >= mins - 1 ? "" : T("xog la ururiyay: ", "collected: ") + (c >= 60 ? Math.floor(c / 60) + T(" saac ", "h ") : "") + (c % 60) + T(" daqiiqo", "m") + T(" (bogga ayaa xirnaa inta kale)", " (page was closed the rest)"));
  const WIN = [[60, T("1 saac", "1h")], [240, T("4 saac", "4h")], [720, T("12 saac", "12h")], [1440, T("24 saac", "24h")]];
  lqBox.innerHTML = `<div class="lq-2">
    <div class="lq-card"><div class="lq-lqh"><b>${T("Liquidations live", "Live liquidations")}</b><span class="lq-live sm"><b class="pulse"></b>LIVE</span><em class="lq-lqnew" id="lqx-new"></em><button class="lq-lqp" type="button" id="lqx-snd" title="${T("Cod: liquidation ≥ $10K", "Sound: liquidation ≥ $10K")}">🔇</button><button class="lq-lqp" type="button" id="lqx-pause" title="${T("Jooji / sii wad", "Pause / resume")}">❚❚</button>${CAM("liq")}</div>
      <div class="lq-lqk"><div><span>${T("Xogta liquidation · 30 daqiiqo", "Liquidation data · 30m")}</span><b id="lqx-tot">$0</b><small id="lqx-n">0</small><small id="lqx-d" class="lq-lqd"></small></div><div class="lq-lqs"><span>Long <b class="up" id="lqx-l">$0</b></span><span>Short <b class="down" id="lqx-s">$0</b></span></div></div>
      <div class="lq-sb" id="lqx-bar"><i style="width:50%"><b>50%</b></i><i style="width:50%"><b>50%</b></i></div>
      <svg id="lqx-ch" class="lq-lqch" viewBox="0 0 600 140" preserveAspectRatio="none"></svg>
      <div class="lq-lqax"><span id="lqx-a0"></span><span id="lqx-a1"></span><span id="lqx-a2"></span></div>
      <div class="lq-lqleg"><span><i style="background:#2BD67B"></i>Long</span><span><i style="background:#F05A5F"></i>Short</span><span>${T("daqiiqad kasta · ilbiriqsi kasta ayuu cusboonaadaa", "per minute · updates every second")}</span></div>
      <div class="lq-src" id="lqx-big"></div></div>
    <div class="lq-card"><div class="lq-lqh"><b>${T("Wadarta liquidations", "Total liquidations")}</b>${CAM("liqt")}</div>
      <div class="lq-lqt">${WIN.map(([m, l]) => `<div class="lq-lqtb"><div class="lq-lqtt"><span>${l}</span><b id="lqt-${m}">$0</b></div><div class="lq-lqtr"><span>Long</span><b class="up" id="lqt-${m}-l">$0</b></div><div class="lq-lqtr"><span>Short</span><b class="down" id="lqt-${m}-s">$0</b></div><div class="lq-sb sm2" id="lqt-${m}-b"></div><small class="lq-dim" id="lqt-${m}-c"></small></div>`).join("")}</div>
      <div class="lq-lqbd"><div class="lq-lqtr"><span>${T("24 saac: Long", "24h: Long")} <b class="up" id="lqt-lp">—</b></span><span>Short <b class="down" id="lqt-sp">—</b></span></div><div class="lq-sb" id="lqt-24b"></div>
        <div class="lq-lqtr"><span>${T("Suuqa ugu badan", "Largest exchange share")}</span><b id="lqt-ex">—</b></div>
        <div class="lq-lqtr"><span>${T("Dalabka ugu weyn · 24s", "Largest order · 24h")}</span><b id="lqt-big">—</b></div></div></div></div>
    <div class="lq-card" style="margin-top:16px"><div class="lq-lqf">
      <div class="lq-mini" data-lq="coin">${[["ALL", T("Dhammaan", "All")]].concat(LQC.map((c) => [c, c])).map(([v, l]) => `<button data-v="${v}"${v === "ALL" ? ' class="on"' : ""}>${l}</button>`).join("")}</div>
      <div class="lq-mini" data-lq="ex">${[["ALL", T("Dhammaan", "All")], ["Binance", "Binance"], ["OKX", "OKX"], ["Bybit", "Bybit"]].map(([v, l]) => `<button data-v="${v}"${v === "ALL" ? ' class="on"' : ""}>${l}</button>`).join("")}</div>
      <div class="lq-mini" data-lq="min">${[["0", T("Dhammaan", "All")], ["10000", "≥$10K"], ["100000", "≥$100K"], ["1000000", "≥$1M"]].map(([v, l]) => `<button data-v="${v}"${v === "0" ? ' class="on"' : ""}>${l}</button>`).join("")}</div>
      <div class="lq-mini" data-lq="side">${[["all", T("Labada dhinac", "All sides")], ["long", "Long"], ["short", "Short"]].map(([v, l]) => `<button data-v="${v}"${v === "all" ? ' class="on"' : ""}>${l}</button>`).join("")}</div></div>
      <div class="lq-trr lq-trh"><span>Coin · ${T("suuq", "exchange")}</span><span class="r">${T("Qiimaha", "Price")}</span><span class="r">${T("Lacagta", "Amount")}</span><span class="r">${T("Waqti", "Time")}</span></div>
      <div id="lqx-list" class="lq-lql"></div></div>
    <p class="lq-note">${T("<b>Liquidation</b> = ganacsade si qasab ah looga xiray booskiisa sababtoo ah lacagtiisii way dhammaatay. Long liquidation badan = qiimuhu si degdeg ah ayuu u dhacay; short badan = si degdeg ah ayuu u kacay. Xogta Binance, OKX iyo Bybit ayaa toos loo ururiyaa inta bogga furan yahay (24 saac ayaa la kaydiyaa browser-kaaga); haddii bogga xirnaa, “xog la ururiyay” ayaa muujinaya inta la helay. Binance wuxuu bixiyaa ugu badnaan hal liquidation ilbiriqsi kasta coin kasta, sidaas darteed wadartu way ka yaraan kartaa suuqa oo dhan.", "<b>Liquidation</b> = a position force-closed because margin ran out. Many long liquidations = price dropped fast; many shorts = price spiked. Binance, OKX and Bybit data is collected live while the page is open (24h kept in your browser); “collected” shows how much was captured if the page was closed. Binance sends at most one liquidation per coin per second, so totals may be below the full market.")}</p>`;
  lqBox.addEventListener("click", (e) => {
    if (e.target.closest("#lqx-snd")) { LQ.snd = !LQ.snd; e.target.closest("#lqx-snd").textContent = LQ.snd ? "🔊" : "🔇"; if (LQ.snd) beep(true); return; }
    if (e.target.closest("#lqx-pause")) { LQ.pause = !LQ.pause; e.target.closest("#lqx-pause").textContent = LQ.pause ? "▶" : "❚❚"; return; }
    const b = e.target.closest(".lq-mini[data-lq] button"); if (!b) return;
    const g = b.parentElement.dataset.lq; LQ[g] = g === "min" ? +b.dataset.v : b.dataset.v;
    b.parentElement.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b)); renderLiq(true);
  });
  let lqDirty = false, lqHist = [];
  let AC = null, lastBeep = 0, newN = 0, newAt = 0;
  function beep(test, e) {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (!test && Date.now() - lastBeep < 250) return; lastBeep = Date.now();
      const o = AC.createOscillator(), g = AC.createGain(), big = e && e.v >= 1e6;
      o.frequency.value = test ? 660 : e.long ? (big ? 330 : 440) : (big ? 990 : 880); g.gain.value = 0.06;
      o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + (big ? 0.35 : 0.12));
    } catch (err) { /* ignore */ }
  }
  function addLiq(e) {
    if (!(e.v > 0) || !isFinite(e.v)) return; LQ.ev.unshift(e); agAdd(e); lqDirty = true;
    if (Date.now() - e.ts < 15e3) { newN++; newAt = Date.now(); }
    if (LQ.snd && e.v >= 1e4 && !LQ.pause) beep(false, e);
  }
  function lqFilt() { return LQ.ev.filter((e) => (LQ.coin === "ALL" || e.c === LQ.coin) && (LQ.ex === "ALL" || e.ex === LQ.ex) && e.v >= LQ.min && (LQ.side === "all" || (LQ.side === "long") === e.long)); }
  const sbar = (l, t) => { const lp = t ? l / t * 100 : 50; return `<i style="width:${Math.max(3, lp)}%"></i><i style="width:${Math.max(3, 100 - lp)}%"></i>`; };
  function renderTotals() {
    const $ = (id) => document.getElementById(id);
    WIN.forEach(([m]) => { const o = agSum(m), t = o.l + o.s; $("lqt-" + m).textContent = fmt(t); $("lqt-" + m + "-l").textContent = fmt(o.l); $("lqt-" + m + "-s").textContent = fmt(o.s); $("lqt-" + m + "-b").innerHTML = sbar(o.l, t); $("lqt-" + m + "-c").textContent = covTxt(o.cov, m); });
    const d = agSum(1440), t = d.l + d.s;
    $("lqt-lp").textContent = t ? (d.l / t * 100).toFixed(1) + "%" : "—"; $("lqt-sp").textContent = t ? (d.s / t * 100).toFixed(1) + "%" : "—";
    $("lqt-24b").innerHTML = `<i style="width:${t ? Math.max(3, d.l / t * 100) : 50}%"><b>${t ? (d.l / t * 100).toFixed(1) + "%" : ""}</b></i><i style="width:${t ? Math.max(3, d.s / t * 100) : 50}%"><b>${t ? (d.s / t * 100).toFixed(1) + "%" : ""}</b></i>`;
    const ex = Object.entries(d.ex).sort((a, b) => b[1] - a[1])[0]; $("lqt-ex").textContent = ex && t ? ex[0] + " · " + (ex[1] / t * 100).toFixed(1) + "%" : "—";
    const bg = AG.big && Date.now() - AG.big.ts < 864e5 ? AG.big : null; $("lqt-big").textContent = bg ? fmt(bg.v) + " · " + bg.c + " · " + bg.ex + " · " + (bg.long ? "Long" : "Short") + " · " + price(bg.p) : "—";
  }
  function renderLiq(force) {
    const now = Date.now(), cut = now - 30 * 60e3, t = minNow(); AG.seen[t] = 1;
    LQ.ev = LQ.ev.filter((e) => e.ts >= cut).slice(0, 5000);
    if (LQ.pause && !force) return; if (!document.getElementById("lqx-tot")) return;
    const nw = document.getElementById("lqx-new"); if (nw) { if (Date.now() - newAt > 4000) newN = 0; nw.textContent = newN ? "+" + newN + T(" cusub", " new") : ""; }
    renderTotals();
    const F = lqFilt(), L = F.filter((e) => e.long).reduce((a, e) => a + e.v, 0), Sx = F.filter((e) => !e.long).reduce((a, e) => a + e.v, 0), tot = L + Sx;
    lqHist.push([now, tot]); lqHist = lqHist.filter((h) => now - h[0] <= 70e3);
    const $ = (id) => document.getElementById(id);
    $("lqx-tot").textContent = fmt(tot); $("lqx-n").textContent = F.length.toLocaleString("en-US") + " " + T("dalab", "orders");
    const ago = lqHist.find((h) => now - h[0] >= 55e3), dl = ago ? tot - ago[1] : null;
    $("lqx-d").innerHTML = dl == null ? "" : `<span class="${dl >= 0 ? "up" : "down"}">${dl >= 0 ? "↑" : "↓"} ${fmt(Math.abs(dl))}</span> · ${T("marka la barbardhigo 1 daqiiqo kahor", "vs 1 min ago")}`;
    $("lqx-l").textContent = fmt(L); $("lqx-s").textContent = fmt(Sx);
    const lp = tot ? L / tot * 100 : 50; $("lqx-bar").innerHTML = `<i style="width:${Math.max(4, lp)}%"><b>${lp.toFixed(1)}%</b></i><i style="width:${Math.max(4, 100 - lp)}%"><b>${(100 - lp).toFixed(1)}%</b></i>`;
    const B = Array.from({ length: 30 }, () => [0, 0]);
    F.forEach((e) => { const i = 29 - (t - Math.floor(e.ts / 60e3)); if (i >= 0 && i < 30) B[i][e.long ? 0 : 1] += e.v; });
    const mx = Math.max(1, ...B.map((b) => b[0] + b[1])), w = 600 / 30;
    $("lqx-ch").innerHTML = [0.5, 1].map((f) => `<line x1="0" x2="600" y1="${136 - f * 128}" y2="${136 - f * 128}" stroke="var(--line)" stroke-dasharray="3 4"/>`).join("") +
      B.map((b, i) => { const hl = b[0] / mx * 128, hs = b[1] / mx * 128, cur = i === 29; return `<g${cur ? ' class="lq-lqcur"' : ""}><rect x="${i * w + 2}" y="${136 - hl}" width="${w - 4}" height="${hl}" fill="#2BD67B" rx="2"><title>${hm(new Date((t - 29 + i) * 60e3))} · Long ${fmt(b[0])}</title></rect><rect x="${i * w + 2}" y="${136 - hl - hs}" width="${w - 4}" height="${hs}" fill="#F05A5F" rx="2"><title>${hm(new Date((t - 29 + i) * 60e3))} · Short ${fmt(b[1])}</title></rect></g>`; }).join("") + `<line x1="0" x2="600" y1="136.5" y2="136.5" stroke="var(--line)"/>`;
    $("lqx-a0").textContent = hm(new Date((t - 29) * 60e3)); $("lqx-a1").textContent = hm(new Date((t - 15) * 60e3)); $("lqx-a2").textContent = hm(new Date(t * 60e3));
    const big = F.reduce((a, e) => (!a || e.v > a.v ? e : a), null);
    $("lqx-big").innerHTML = big ? `${T("Kan ugu weyn (30d)", "Largest (30m)")}: <b>${fmt(big.v)}</b> · ${esc(big.c)} · ${big.ex} · ${big.long ? "Long" : "Short"} · ${price(big.p)} · ${hm(new Date(big.ts))}` : T("Waxaa la sugayaa liquidation…", "Waiting for liquidations…");
    if (!force && !lqDirty) return; lqDirty = false;
    $("lqx-list").innerHTML = F.slice(0, 60).map((e) => { const d = new Date(e.ts); return `<div class="lq-trr ${e.long ? "b" : "s"}${e.v >= 1e6 ? " big" : ""}"><span><b>${esc(e.c)}</b> · ${e.ex} <em>${e.long ? "Long ↘" : "Short ↗"}</em></span><span class="r">${price(e.p)}</span><span class="r"><b>${fmt(e.v)}</b></span><span class="r">${hm(d)}:${pad(d.getSeconds())}</span></div>`; }).join("") || `<div class="lq-load">${T("Waxaa la sugayaa liquidation…", "Waiting for liquidations…")}</div>`;
  }
  setInterval(() => {
    renderLiq(false);
    const t = minNow(); Object.keys(AG.m).forEach((k) => { if (+k < t - 1440) delete AG.m[k]; }); Object.keys(AG.seen).forEach((k) => { if (+k < t - 1440) delete AG.seen[k]; });
    try { localStorage.setItem("xc-liq", JSON.stringify({ t0: LQ.t0, ev: LQ.ev.slice(0, 1500) })); localStorage.setItem("xc-liq24", JSON.stringify(AG)); } catch (e) { /* ignore */ }
  }, 1000);
  renderLiq(true);
  async function startLiq() {
    // Binance: dhammaan coin-ka (SELL = long la xiray)
    ws("wss://fstream.binance.com/ws/!forceOrder@arr", () => {}, (m) => {
      const o = m && m.o; if (!o || !/USDT$/.test(o.s)) return;
      const p = +o.ap || +o.p, q = +o.z || +o.q;
      addLiq({ c: o.s.replace(/USDT$/, ""), ex: "Binance", long: o.S === "SELL", p, v: p * q, ts: +o.T || Date.now() });
    });
    // OKX: ctVal (qiimaha qandaraaska) ayaa loo baahan yahay
    try { const j = await viaPx("https://www.okx.com/api/v5/public/instruments?instType=SWAP"); (j.data || []).forEach((x) => { LQ.ct[x.instId] = { v: +x.ctVal, usd: x.ctValCcy === "USD" }; }); } catch (e) { /* ignore */ }
    ws("wss://ws.okx.com:8443/ws/v5/public", (s) => { s.send(JSON.stringify({ op: "subscribe", args: [{ channel: "liquidation-orders", instType: "SWAP" }] })); setInterval(() => { try { s.send("ping"); } catch (e) { /* ignore */ } }, 25000); }, (m) => {
      if (!m || !Array.isArray(m.data)) return;
      m.data.forEach((g) => { const ct = LQ.ct[g.instId]; if (!ct) return; const c = g.instId.split("-")[0];
        (g.details || []).forEach((d) => { const p = +d.bkPx, sz = +d.sz; addLiq({ c, ex: "OKX", long: d.posSide ? d.posSide === "long" : d.side === "sell", p, v: ct.usd ? sz * ct.v : sz * ct.v * p, ts: +d.ts || Date.now() }); }); });
    });
    // Bybit: coin-ka waaweyn (Buy = long la xiray)
    const BY = ["BTC", "ETH", "SOL", "XRP", "DOGE", "BNB", "ADA", "SUI", "LINK", "AVAX", "HYPE", "LTC", "TRX", "PEPE", "WIF", "ENA", "TON", "DOT", "NEAR", "APT"];
    ws("wss://stream.bybit.com/v5/public/linear", (s) => {
      for (let i = 0; i < BY.length; i += 10) s.send(JSON.stringify({ op: "subscribe", args: BY.slice(i, i + 10).map((c) => "allLiquidation." + c + "USDT") }));
      setInterval(() => { try { s.send(JSON.stringify({ op: "ping" })); } catch (e) { /* ignore */ } }, 20000);
    }, (m) => {
      if (!m || !Array.isArray(m.data) || !/allLiquidation/.test(m.topic || "")) return;
      m.data.forEach((x) => { const p = +x.p; addLiq({ c: String(x.s).replace(/USDT$/, ""), ex: "Bybit", long: x.S === "Buy", p, v: p * +x.v, ts: +x.T || Date.now() }); });
    });
  }
  L.add("liqt", { head: () => T("Wadarta liquidations", "Total liquidations"), at: () => new Date(), src: "Binance, OKX, Bybit", body: () => {
    let s = tx(56, 72, T("Wadarta liquidations", "Total liquidations"), 32, { d: 1, w: 800 });
    WIN.forEach(([m, l], i) => { const o = agSum(m), t = o.l + o.s, x = 56 + (i % 2) * 552, y = 100 + Math.floor(i / 2) * 225;
      s += box(x, y, 536, 205) + tx(x + 28, y + 50, l, 22, { c: K.mut }) + tx(x + 508, y + 58, fmt(t), 44, { d: 1, w: 800, a: "end" }) + tx(x + 28, y + 105, "Long", 20, { c: K.mut }) + tx(x + 508, y + 105, fmt(o.l), 22, { d: 1, w: 800, a: "end", c: G }) + tx(x + 28, y + 145, "Short", 20, { c: K.mut }) + tx(x + 508, y + 145, fmt(o.s), 22, { d: 1, w: 800, a: "end", c: R }) + bar(x + 28, y + 168, 480, 10, t ? o.l / t : 0.5) + (covTxt(o.cov, m) ? tx(x + 28, y + 196, covTxt(o.cov, m), 14, { c: K.dim }) : ""); });
    return s;
  } });
  L.add("liq", { head: () => "Liquidations · 30 " + T("daqiiqo", "min"), at: () => new Date(), src: "Binance, OKX, Bybit", body: () => {
    const F = lqFilt(), Lg = F.filter((e) => e.long).reduce((a, e) => a + e.v, 0), Sh = F.filter((e) => !e.long).reduce((a, e) => a + e.v, 0), tot = Lg + Sh;
    let s = tx(56, 72, T("Liquidations · 30-kii daqiiqo ee u dambeeyay", "Liquidations · last 30 minutes"), 32, { d: 1, w: 800 }) + box(56, 100, 1088, 450);
    s += tx(88, 170, T("Wadarta", "Total"), 22, { c: K.mut }) + tx(88, 240, fmt(tot), 68, { d: 1, w: 800 }) + tx(88, 280, F.length.toLocaleString("en-US") + " " + T("dalab", "orders"), 20, { c: K.mut });
    s += tx(620, 170, "Long", 22, { c: G }) + tx(620, 230, fmt(Lg), 46, { d: 1, w: 800, c: G }) + tx(900, 170, "Short", 22, { c: R }) + tx(900, 230, fmt(Sh), 46, { d: 1, w: 800, c: R });
    s += bar(88, 320, 1024, 26, tot ? Lg / tot : 0.5);
    const big = F.reduce((a, e) => (!a || e.v > a.v ? e : a), null);
    if (big) s += tx(88, 420, T("Kan ugu weyn: ", "Largest: ") + fmt(big.v) + " · " + big.c + " · " + big.ex + " · " + (big.long ? "Long" : "Short"), 24, { w: 700 });
    return s;
  } });


  // ================= Coin kasta: lacagta (taker iibsi − iibin) · Binance futures =================
  async function loadCf() {
    try {
      TICKAt = 0; const [tk, cs] = await Promise.all([tickers(), cryptoPerps()]);
      const syms = Object.values(tk).filter((x) => /USDT$/.test(x.symbol) && (!cs || cs.has(x.symbol)) && isCrypto(x.symbol) && +x.quoteVolume > 0).sort((a, b) => +b.quoteVolume - +a.quoteVolume).slice(0, 40).map((x) => x.symbol);
      const rows = (await pool(syms, 6, async (sy) => {
        const k = (await getj(`${FAPI}klines?symbol=${sy}&interval=1h&limit=24`)).map((x) => ({ b: +x[10], t: +x[7] }));
        const w = (n) => { const a = k.slice(-n), b = a.reduce((u, x) => u + x.b, 0), t = a.reduce((u, x) => u + x.t, 0); return { net: 2 * b - t, buy: t ? b / t * 100 : 50, tot: t }; };
        return { c: sy.replace(/USDT$/, ""), ch: +tk[sy].priceChangePercent, p: +tk[sy].lastPrice, w: { 1: w(1), 4: w(4), 24: w(24) } };
      })).filter(Boolean);
      S.cf = rows; S.at.cf = new Date(); renderCf();
    } catch (e) { if (!S.cf) document.getElementById("lq-cf").innerHTML = `<div class="lq-card lq-load">${T("Xogta hadda lama heli karo.", "Data unavailable.")}</div>`; }
  }
  function cfLists() { const k = S.cfw, r = (S.cf || []).map((x) => Object.assign({ n: x.w[k].net, buy: x.w[k].buy }, x)); return { inn: r.filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 10), out: r.filter((x) => x.n < 0).sort((a, b) => a.n - b.n).slice(0, 10) }; }
  function renderCf() {
    if (!S.cf) return;
    const { inn, out } = cfLists(), mx = Math.max(1, ...inn.concat(out).map((x) => Math.abs(x.n))), lab = { 1: T("1 saac", "1h"), 4: T("4 saac", "4h"), 24: T("24 saac", "24h") }[S.cfw];
    const col = (list, up) => `<div class="lq-card"><div class="lq-cfh ${up ? "up" : "down"}">${up ? "⬆ " + T("Ugu badan soo gashay", "Biggest inflows") : "⬇ " + T("Ugu badan baxday", "Biggest outflows")} · ${lab}</div>` +
      (list.length ? list.map((x, i) => `<div class="lq-cfr" data-x="${esc(x.c + " · " + lab + ": " + (x.n >= 0 ? "+$" : "−$") + Math.round(Math.abs(x.n)).toLocaleString("en-US") + " · " + T("iibsi ", "buy ") + x.buy.toFixed(1) + "%")}"><span class="lq-dim">${i + 1}</span><b>${esc(x.c)}</b><span class="lq-cfb"><i style="width:${Math.max(3, Math.abs(x.n) / mx * 100)}%;background:${up ? "#2BD67B" : "#F05A5F"}"></i></span><strong class="${up ? "up" : "down"}">${fmt(x.n, true)}</strong><small class="${cls(x.ch)}">${pct(x.ch)}</small></div>`).join("") : `<div class="lq-load">—</div>`) + `</div>`;
    document.getElementById("lq-cf").innerHTML = col(inn, true) + col(out, false) + `<div class="lq-src" style="grid-column:1/-1">${T("Lacagta saafiga ah = iibsiga tooska ah − iibinta tooska ah (taker) · 40-ka coin ee ugu volume badan · Binance futures · % = qiimaha 24 saac", "Net flow = taker buys − taker sells · top 40 coins by volume · Binance futures · % = 24h price")} · ${hm(S.at.cf)}</div>`;
  }
  L.add("cf", { head: () => T("Coin kasta: lacagta soo gashay iyo baxday", "Each coin: money in and out"), at: () => S.at.cf, src: "Binance futures", body: () => {
    const { inn, out } = cfLists(), lab = { 1: T("1 saac", "1h"), 4: T("4 saac", "4h"), 24: T("24 saac", "24h") }[S.cfw], mx = Math.max(1, ...inn.concat(out).map((x) => Math.abs(x.n)));
    let s = tx(56, 72, T(`Coin kasta: lacagta · ${lab}`, `Money flow by coin · ${lab}`), 32, { d: 1, w: 800 });
    [[inn, true, 56], [out, false, 614]].forEach(([list, up, x]) => {
      s += box(x, 100, 530, 455) + tx(x + 28, 140, up ? "⬆ " + T("Ugu badan soo gashay", "Biggest inflows") : "⬇ " + T("Ugu badan baxday", "Biggest outflows"), 20, { w: 800, c: up ? G : R });
      list.slice(0, 8).forEach((r, i) => { const y = 188 + i * 45; s += tx(x + 28, y, (i + 1) + "  " + r.c, 20, { w: 800 }) + `<rect x="${x + 170}" y="${y - 14}" width="${Math.max(4, Math.abs(r.n) / mx * 200)}" height="14" rx="4" fill="${up ? G : R}" opacity=".85"/>` + tx(x + 502, y, fmt(r.n, true), 20, { d: 1, w: 800, a: "end", c: up ? G : R }); });
    });
    return s;
  } });

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

  // ================= F) Volume (futures / spot · crypto oo kaliya) =================
  const HMC = ["BTC", "ETH", "SOL", "XRP", "BNB", "DOGE"];
  const NOTCRYPTO = /^(XAU|XAG|XAUT|PAXG|XPT|XPD|CL|BZ|NG|SPX|NDX|DJI)$/;
  async function pool(items, n, fn) { const out = new Array(items.length); let i = 0; await Promise.all(new Array(n).fill(0).map(async () => { while (i < items.length) { const j = i++; try { out[j] = await fn(items[j]); } catch (e) { out[j] = null; } } })); return out; }
  let CRYPTO = null;
  async function cryptoPerps() {
    if (CRYPTO) return CRYPTO;
    try {
      const j = await getj(FAPI + "exchangeInfo");
      CRYPTO = new Set(j.symbols.filter((x) => {
        const ut = String(x.underlyingType || "COIN").toUpperCase(), sub = (x.underlyingSubType || []).join(",").toUpperCase();
        return x.contractType === "PERPETUAL" && x.quoteAsset === "USDT" && x.status === "TRADING" && ut === "COIN" && !/TRADFI|STOCK|EQUIT|COMMODIT|METAL|INDEX|FOREX/.test(sub) && !NOTCRYPTO.test(x.baseAsset);
      }).map((x) => x.symbol));
    } catch (e) { CRYPTO = null; }
    return CRYPTO;
  }
  const isCrypto = (sym) => { const c = sym.replace(/USDT$/, ""); if (NOTCRYPTO.test(c)) return false; const cg = window.XCCoinSet; return !cg || !cg.size || cg.has(c); };
  // ---- Kaydka live: suuqa oo dhan (futures / spot) — dib u kala horaynta ilbiriqsiyo kasta ----
  const TOPN = 100;
  S.V = { fut: null, spot: null };
  const curV = () => S.V[S.vm];
  const mkV = (mode) => ({ mode, uni: new Map(), det: new Map(), total: 0, at: null, q: [], busy: 0 });
  function needDet(M, syms, force) {
    syms.forEach((s) => { if (force || !M.det.has(s)) { if (!M.det.has(s)) M.det.set(s, null); if (!M.q.includes(s)) M.q.push(s); } });
    const base = M.mode === "fut" ? FAPI : SPOT;
    const run = async () => {
      if (M.busy >= 6 || !M.q.length) return; M.busy++;
      const s = M.q.shift();
      try {
        const [h, dd, oi] = await Promise.all([getj(`${base}klines?symbol=${s}&interval=1h&limit=49`), getj(`${base}klines?symbol=${s}&interval=1d&limit=61`), M.mode === "fut" ? getj(`${FAPI}openInterest?symbol=${s}`).catch(() => null) : null]);
        const hv = h.slice(0, -1).map((k) => +k[7]), dv = dd.slice(0, -1).map((k) => +k[7]), sm = (x) => x.reduce((u, v) => u + v, 0);
        const win = (x, n) => [sm(x.slice(-n)), sm(x.slice(-2 * n, -n))], ch = ([u, v]) => (v > 0 && u > 0 ? (u / v - 1) * 100 : null);
        const w1 = win(hv, 1), w4 = win(hv, 4), w12 = win(hv, 12), w24 = win(hv, 24), w30 = win(dv, 30);
        M.det.set(s, { v1: w1[0], v4: w4[0], v12: w12[0], v30: w30[0], c1: ch(w1), c4: ch(w4), c12: ch(w12), c24: ch(w24), c30: ch(w30), oiq: oi ? +oi.openInterest : null });
      } catch (e) { /* ignore */ }
      M.busy--; run();
    };
    for (let i = 0; i < 6; i++) run();
  }
  function rowOf(M, u) {
    const d = M.det.get(u.s) || {};
    const r = Object.assign({}, u, d); r.oi = d.oiq != null ? d.oiq * u.p : null; r.oiv = r.oi != null && u.v24 ? r.oi / u.v24 : null; return r;
  }
  function ordered(M) {
    const sk = S.vsort || "v24", sd = S.vdir || -1;
    const all = [...M.uni.values()].filter((u) => isCrypto(u.s)).map((u) => rowOf(M, u));
    all.sort((x, y) => sk === "c" ? sd * String(x.c).localeCompare(y.c) : sd * ((x[sk] == null ? -Infinity : x[sk]) - (y[sk] == null ? -Infinity : y[sk])) || y.v24 - x.v24);
    return all;
  }
  const topByVol = (M, n) => [...M.uni.values()].filter((u) => isCrypto(u.s)).sort((x, y) => y.v24 - x.v24).slice(0, n).map((u) => u.s);
  async function loadVol() {
    try {
      TICKAt = 0; const [tk, cs] = await Promise.all([tickers(), cryptoPerps()]);
      const M = S.V.fut || (S.V.fut = mkV("fut"));
      Object.values(tk).forEach((x) => {
        if (!/USDT$/.test(x.symbol) || !(+x.quoteVolume > 0) || !(+x.count > 0) || (cs && !cs.has(x.symbol))) return;
        const u = M.uni.get(x.symbol) || { s: x.symbol, c: x.symbol.replace(/USDT$/, "") };
        u.p = +x.lastPrice; u.ch = +x.priceChangePercent; u.v24 = +x.quoteVolume; M.uni.set(x.symbol, u);
      });
      M.total = [...M.uni.values()].filter((u) => isCrypto(u.s)).reduce((t, u) => t + u.v24, 0); M.at = new Date(); S.at.volF = M.at;
      needDet(M, topByVol(M, TOPN).concat(HMC.map((c) => c + "USDT")), true);
      if (S.vm === "fut") renderVol();
    } catch (e) { if (!S.V.fut && S.vm === "fut") document.getElementById("lq-vt").innerHTML = `<div class="lq-load">${T("Xogta hadda lama heli karo.", "Data unavailable.")}</div>`; }
  }
  const STABLE = /^(USDC|FDUSD|TUSD|BUSD|DAI|USDP|USDE|USDS|USD1|BFUSD|RLUSD|PYUSD|EUR|EURI|AEUR|TRY|BRL|GBP|ARS|ZAR|JPY|MXN|PLN|RON|UAH|CZK|COP|IDRT|BIDR|PAXG|XAUT|U)USDT$/, LEV = /(UP|DOWN|BULL|BEAR)USDT$/;
  async function loadVolSpot() {
    if (!S.V.spot) document.getElementById("lq-vt").innerHTML = `<div class="lq-load">${T("Xogta ayaa soo socota…", "Loading…")}</div>`;
    try {
      const a = await getj(SPOT + "ticker/24hr?type=MINI");
      const M = S.V.spot || (S.V.spot = mkV("spot"));
      a.forEach((x) => {
        if (!/USDT$/.test(x.symbol) || STABLE.test(x.symbol) || LEV.test(x.symbol) || !(+x.quoteVolume > 0)) return;
        const u = M.uni.get(x.symbol) || { s: x.symbol, c: x.symbol.replace(/USDT$/, "") }, p = +x.lastPrice, o = +x.openPrice;
        u.p = p; u.ch = o ? (p / o - 1) * 100 : null; u.v24 = +x.quoteVolume; M.uni.set(x.symbol, u);
      });
      M.total = [...M.uni.values()].filter((u) => isCrypto(u.s)).reduce((t, u) => t + u.v24, 0); M.at = new Date(); S.at.volS = M.at;
      needDet(M, topByVol(M, TOPN).concat(HMC.map((c) => c + "USDT")), true);
      if (S.vm === "spot") renderVol();
    } catch (e) { if (!S.V.spot && S.vm === "spot") document.getElementById("lq-vt").innerHTML = `<div class="lq-load">${T("Xogta hadda lama heli karo.", "Data unavailable.")}</div>`; }
  }
  // WebSocket → kaydka (DOM-ka waxaa cusboonaysiiya liveVol)
  function wsVol(M, arr) {
    if (!M) return;
    arr.forEach((x) => {
      if (!/USDT$/.test(x.s)) return;
      let u = M.uni.get(x.s);
      if (!u) { if (M.mode === "fut" && CRYPTO && !CRYPTO.has(x.s)) return; if (M.mode === "spot" && (STABLE.test(x.s) || LEV.test(x.s))) return; u = { s: x.s, c: x.s.replace(/USDT$/, ""), v24: 0 }; M.uni.set(x.s, u); }
      const p = +x.c, o = +x.o, q = +x.q;
      if (p) u.p = p; if (o && p) u.ch = (p / o - 1) * 100;
      if (q) { if (isCrypto(u.s)) M.total += q - (u.v24 || 0); u.v24 = q; }
    });
  }
  const heat = (v) => { if (v == null || !isFinite(v)) return ""; const a = Math.min(1, Math.abs(v) / 100) * 0.55 + 0.08; return `background:${v >= 0 ? `rgba(43,214,123,${a})` : `rgba(240,90,95,${a})`}`; };
  const tileBg = (v) => { if (v == null || !isFinite(v)) return "background:var(--card-2)"; const a = Math.min(1, Math.abs(v) / 60) * 0.7 + 0.14; return `background:${v >= 0 ? `rgba(43,214,123,${a})` : `rgba(240,90,95,${a})`}`; };
  const HMR = [["1s", "1h", "v1", "c1"], ["4s", "4h", "v4", "c4"], ["12s", "12h", "v12", "c12"], ["24s", "24h", "v24", "c24"], ["30 maalin", "30d", "v30", "c30"]];
  const ex$ = (v) => "$" + Math.round(v).toLocaleString("en-US"), exP = (v) => v == null ? "—" : (v > 0 ? "+" : "") + v.toFixed(4) + "%";
  const COLSV = () => [["c", "Coin", 0], ["p", T("Qiimaha", "Price"), 1], ["ch", T("Qiimaha 24s", "Price 24h"), 1], ["v24", "Volume " + T("24s", "24h"), 1], ["c24", "Vol " + T("24s", "24h") + " %", 1], ["c1", "Vol " + T("1s", "1h") + " %", 1], ["c4", "Vol " + T("4s", "4h") + " %", 1], ["c30", "Vol " + T("30m", "30d") + " %", 1]].concat(S.vm === "spot" ? [] : [["oi", "OI", 1], ["oiv", "OI / Vol", 1]]);
  const dash = `<span class="lq-dim">…</span>`;
  function rowCells(r, i) {
    const spot = S.vm === "spot", has = M0(r);
    const cell = (html, style, tip) => `<td class="r"${style ? ` style="${style}"` : ""} data-x="${esc(r.c + " · " + tip)}">${html}</td>`;
    return `<td class="lq-dim lq-rk">${i + 1}</td><td><b>${esc(r.c)}</b></td>` +
      `<td class="r lq-px" data-x="${esc(r.c + " · " + T("Qiimaha", "Price") + ": $" + r.p)}">${price(r.p)}</td>` +
      `<td class="r" style="${heat(r.ch * 5)}" data-x="${esc(r.c + " · 24s: " + exP(r.ch))}">${pct(r.ch)}</td>` +
      `<td class="r lq-px lq-v" data-x="${esc(r.c + " · Volume 24s: " + ex$(r.v24))}"><b>${fmt(r.v24)}</b></td>` +
      (has ? cell(pct(r.c24), heat(r.c24), "Vol 24s: " + exP(r.c24)) + cell(pct(r.c1), heat(r.c1), "Vol 1s: " + exP(r.c1) + " · " + ex$(r.v1)) + cell(pct(r.c4), heat(r.c4), "Vol 4s: " + exP(r.c4) + " · " + ex$(r.v4)) + cell(pct(r.c30), heat(r.c30), "Vol 30m: " + exP(r.c30) + " · " + ex$(r.v30))
        : `<td class="r">${dash}</td><td class="r">${dash}</td><td class="r">${dash}</td><td class="r">${dash}</td>`) +
      (spot ? "" : has ? cell(r.oi != null ? fmt(r.oi) : "—", "", "Open interest: " + (r.oi != null ? ex$(r.oi) : "—")) + cell(r.oiv != null ? r.oiv.toFixed(2) : "—", "", "OI / Vol: " + (r.oiv != null ? r.oiv.toFixed(4) : "—")) : `<td class="r">${dash}</td><td class="r">${dash}</td>`);
  }
  const M0 = (r) => r.c24 !== undefined || r.c1 !== undefined;
  function renderCards(M, list) {
    const spot = M.mode === "spot", btc = list.find((r) => r.c === "BTC"), eth = list.find((r) => r.c === "ETH");
    const card = (l, v, sub, chg) => `<div class="lq-card lq-vc"><span>${l}</span><b>${v != null ? fmt(v) : "—"}${chg != null ? ` <em class="${cls(chg)}">${pct(chg)}</em>` : ""}</b><small>${sub || ""}</small></div>`;
    const of = T(spot ? "% spot-ka" : "% futures-ka", spot ? "% of spot" : "% of futures");
    const other = S.V[spot ? "fut" : "spot"];
    document.getElementById("lq-vk").innerHTML =
      card(spot ? T("Spot · dhammaan coin-ka", "Spot · all coins") : T("Futures · dhammaan coin-ka", "Futures · all coins"), M.total, "Binance USDT · " + T("crypto oo kaliya", "crypto only"), null) +
      card(spot ? "BTC spot" : "BTC futures", btc && btc.v24, btc ? (btc.v24 / M.total * 100).toFixed(1) + of : "", btc && btc.c24) +
      card(spot ? "ETH spot" : "ETH futures", eth && eth.v24, eth ? (eth.v24 / M.total * 100).toFixed(1) + of : "", eth && eth.c24) +
      `<div class="lq-card lq-vc"><span>${spot ? T("Spot / futures", "Spot / futures") : T("Coin-ka la raacayo", "Coins tracked")}</span><b>${spot ? (other && other.total ? (M.total / other.total * 100).toFixed(1) + "%" : "—") : [...M.uni.values()].filter((u) => isCrypto(u.s)).length.toLocaleString("en-US")}</b><small>${spot ? T("spot marka la barbardhigo futures", "spot relative to futures") : "Binance futures · live"}</small></div>`;
  }
  function renderHeat(M, list) {
    const cols = HMC.map((c) => list.find((r) => r.c === c)).filter(Boolean);
    document.getElementById("lq-vh").innerHTML = `<div class="lq-hmg" style="grid-template-columns:96px repeat(${cols.length},minmax(0,1fr))"><div></div>${cols.map((r) => `<div class="lq-hmh">${esc(r.c)}</div>`).join("")}` +
      HMR.map(([so, en, vk, ck]) => `<div class="lq-hml">${T(so, en)}</div>` + cols.map((r) => `<div class="lq-hmt" style="${tileBg(r[ck])}" data-x="${esc(r.c + " · " + T(so, en) + ": $" + (r[vk] != null ? Math.round(r[vk]).toLocaleString("en-US") : "—") + " · " + (r[ck] == null ? "—" : (r[ck] > 0 ? "+" : "") + r[ck].toFixed(2) + "%"))}"><b>${r[vk] != null ? fmt(r[vk]) : "—"}</b><span>${pct(r[ck], 1)}</span></div>`).join("")).join("") +
      `</div><div class="lq-src">Binance ${M.mode === "spot" ? "spot" : "futures"} · ${T("% = marka la barbardhigo muddadii ka horraysay · Volume 24s: live", "% vs the previous period · 24h volume: live")}</div>`;
  }
  function renderVol() {
    const M = curV(); if (!M) return;
    const sk = COLSV().some((c) => c[0] === S.vsort) ? S.vsort : "v24", sd = S.vdir || -1; S.vsort = sk;
    document.getElementById("lq-vt").innerHTML = `<div class="lq-vscroll"><table class="lq-tt lq-vtt"><thead><tr><th>#</th>${COLSV().map(([k, l, r]) => `<th class="${r ? "r " : ""}lq-sort${k === sk ? " on" : ""}" data-k="${k}">${esc(l)}${k === sk ? (sd < 0 ? " ▼" : " ▲") : ""}</th>`).join("")}</tr></thead><tbody></tbody></table></div>` +
      `<div class="lq-src">Binance ${M.mode === "spot" ? "spot" : "futures"} (USDT) · <b>Top ${TOPN}</b> · ${T("live: qiimaha iyo volume-ka ilbiriqsi kasta, kala horaynta 2 ilbiriqsi kasta — coin-ka hoos u dhaca wuu baxaa, kan kor u kacaa wuu soo galaa", "live: price & volume every second, re-ranked every 2 seconds — coins drop out and enter as the market moves")} · ${T("crypto oo kaliya", "crypto only")} · ${T("riix cinwaanka si aad u kala soocdo", "click a header to sort")}</div>`;
    liveVol(true);
  }
  function liveVol(first) {
    const M = curV(); if (!M) return;
    const tb = document.querySelector("#lq-vt tbody"); if (!tb) return;
    const list = ordered(M), top = list.slice(0, TOPN);
    needDet(M, top.map((r) => r.s));
    const old = new Map(); tb.querySelectorAll("tr").forEach((tr) => old.set(tr.dataset.s, tr));
    const pos = new Map(); if (!first) old.forEach((tr, k) => pos.set(k, tr.getBoundingClientRect().top));
    const keep = new Set(top.map((r) => r.s));
    old.forEach((tr, k) => { if (!keep.has(k)) tr.remove(); });
    const frag = [];
    top.forEach((r, i) => {
      let tr = old.get(r.s), isNew = false;
      if (!tr) { tr = document.createElement("tr"); tr.dataset.s = r.s; isNew = !first; }
      const sig = [i, r.p, r.ch && r.ch.toFixed(2), r.v24, r.c1, r.c4, r.c24, r.c30, r.oi].join("|");
      if (tr._sig !== sig) {
        const pp = tr._p, pv = tr._v; tr.innerHTML = rowCells(r, i); tr._sig = sig; tr._p = r.p; tr._v = r.v24;
        if (pp != null && r.p !== pp) flash(tr.querySelector(".lq-px"), r.p > pp);
        if (pv != null && r.v24 !== pv) flash(tr.querySelector(".lq-v"), r.v24 > pv);
      }
      if (isNew) tr._new = true;
      frag.push(tr);
    });
    frag.forEach((tr) => tb.appendChild(tr));
    if (!first && tb.animate) frag.forEach((tr) => {
      if (tr._new) { tr._new = false; tr.animate([{ opacity: 0, background: "rgba(43,214,123,.35)" }, { opacity: 1, background: "transparent" }], { duration: 900, easing: "ease-out" }); return; }
      const y0 = pos.get(tr.dataset.s); if (y0 == null) return;
      const dy = y0 - tr.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) tr.animate([{ transform: `translateY(${dy}px)`, background: dy > 0 ? "rgba(43,214,123,.18)" : "rgba(240,90,95,.18)" }, { transform: "none", background: "transparent" }], { duration: 650, easing: "cubic-bezier(.2,.7,.2,1)" });
    });
    renderCards(M, list);
  }
  // Kaliya marka qaybtu muuqato (ma culaysiiyo taleefanka)
  let volVis = true;
  if ("IntersectionObserver" in window) new IntersectionObserver((es) => { volVis = es.some((e) => e.isIntersecting); }).observe(document.getElementById("lq-vt"));
  setInterval(() => { if (volVis && !document.hidden && curV()) liveVol(false); }, 2000);
  L.add("vh", { head: () => T("Heatmap-ka volume-ka", "Volume heatmap"), at: () => S.vm === "spot" ? S.at.volS : S.at.volF, src: "Binance", body: () => {
    const M = curV(), list = M ? ordered(M) : [], cols = HMC.map((c) => list.find((r) => r.c === c)).filter(Boolean);
    let s = tx(56, 72, T(`Heatmap-ka volume-ka · ${S.vm === "spot" ? "spot" : "futures"}`, `Volume heatmap · ${S.vm === "spot" ? "spot" : "futures"}`), 32, { d: 1, w: 800 });
    const x0 = 196, cw = (1144 - x0) / Math.max(1, cols.length), rh = 84;
    cols.forEach((r, j) => { s += tx(x0 + j * cw + cw / 2, 128, r.c, 18, { w: 800, c: K.mut, a: "middle" }); });
    HMR.forEach(([so, en, vk, ck], i) => {
      const y = 145 + i * rh; s += tx(56, y + 50, T(so, en), 19, { c: K.mut });
      cols.forEach((r, j) => { const v = r[ck], a = v == null ? 0 : Math.min(1, Math.abs(v) / 60) * 0.7 + 0.14, fill = v == null ? K.card : v >= 0 ? `rgba(43,214,123,${a})` : `rgba(240,90,95,${a})`;
        s += `<rect x="${x0 + j * cw + 4}" y="${y + 4}" width="${cw - 8}" height="${rh - 8}" rx="12" fill="${fill}"/>` + tx(x0 + j * cw + cw / 2, y + 40, r[vk] != null ? fmt(r[vk]) : "—", 21, { d: 1, w: 800, a: "middle" }) + tx(x0 + j * cw + cw / 2, y + 64, pct(v, 1), 15, { a: "middle" }); });
    });
    return s;
  } });
  L.add("vol", { head: () => "Volume " + (S.vm === "spot" ? "spot" : "futures"), at: () => S.vm === "spot" ? S.at.volS : S.at.volF, src: "Binance", body: () => {
    const M = curV(), V = { rows: M ? ordered(M) : [] }; let s = tx(56, 72, T(`Volume ${S.vm === "spot" ? "spot" : "futures"} · 24 saac`, `${S.vm === "spot" ? "Spot" : "Futures"} volume · 24h`), 32, { d: 1, w: 800 }) + box(56, 100, 1088, 450);
    const cx = [88, 300, 520, 760, 1112];
    [["COIN", 0], [T("QIIMAHA", "PRICE"), 1], [T("VOLUME 24S", "VOLUME 24H"), 2], [T("VOL 24S %", "VOL 24H %"), 3], [S.vm === "spot" ? T("QIIMAHA 24S", "PRICE 24H") : "OI", 4]].forEach(([l, j]) => { s += tx(cx[j], 140, l, 15, { w: 700, c: K.mut, a: j === 4 ? "end" : null }); });
    V.rows.slice().sort((a, b) => b.v24 - a.v24).slice(0, 8).forEach((r, i) => { const y = 190 + i * 45; s += tx(cx[0], y, r.c, 21, { w: 800 }) + tx(cx[1], y, price(r.p), 19) + tx(cx[2], y, fmt(r.v24), 21, { d: 1, w: 800 }) + tx(cx[3], y, pct(r.c24), 20, { w: 700, c: r.c24 >= 0 ? G : R }) + tx(cx[4], y, S.vm === "spot" ? pct(r.ch) : r.oi != null ? fmt(r.oi) : "—", 20, { a: "end", c: S.vm === "spot" ? (r.ch >= 0 ? G : R) : K.ink }); });
    return s;
  } });

  // ================= Exchange-yada: lacagta soo gashay / baxday (DefiLlama, server-ka) =================
  async function loadCex() {
    try {
      const j = await getj("/api/member?op=cex");
      if (!j || !Array.isArray(j.ex) || !j.ex.length) throw new Error("cex");
      S.cex = j; S.at.cex = j.at ? new Date(j.at) : new Date(); renderCex();
    } catch (e) { if (!S.cex) document.getElementById("lq-cex").innerHTML = `<div class="lq-load">${T("Xogta exchange-yada hadda lama heli karo. Saacad kasta ayaa mar kale la isku dayayaa.", "Exchange flow data is unavailable right now. Retrying hourly.")}</div>`; }
  }
  function renderCex() {
    if (!S.cex) return;
    const k = S.cxp, rows = S.cex.ex.slice().sort((a, b) => b.assets - a.assets), mx = Math.max(1, ...rows.map((r) => Math.abs(r[k] || 0)));
    const lab = { d1: T("24 saac", "24h"), d7: T("7 maalin", "7d"), d30: T("30 maalin", "30d") }, ex$ = (v) => (v >= 0 ? "+$" : "−$") + Math.round(Math.abs(v)).toLocaleString("en-US");
    const c = (r, f) => { const v = r[f]; return v == null ? `<td class="r lq-dim">—</td>` : `<td class="r ${cls(v)}${f === k ? " lq-cxk" : ""}" style="${f === k ? heat(v / mx * 90) : ""}" data-x="${esc(r.name + " · " + lab[f] + ": " + ex$(v))}">${f === k ? `<b>${fmt(v, true)}</b><i class="lq-cxb" style="width:${Math.max(3, Math.abs(v) / mx * 90)}px;background:${v >= 0 ? G : R}"></i>` : fmt(v, true)}</td>`; };
    document.getElementById("lq-cex").innerHTML = `<table class="lq-tt"><thead><tr><th>Exchange</th><th class="r">${T("Hantida (kaydka)", "Assets")}</th><th class="r">${lab.d1}</th><th class="r">${lab.d7}</th><th class="r">${lab.d30}</th></tr></thead><tbody>` +
      rows.map((r) => `<tr><td><b>${esc(r.name)}</b></td><td class="r" data-x="${esc(r.name + " · " + T("Hantida", "Assets") + ": $" + Math.round(r.assets).toLocaleString("en-US"))}">${fmt(r.assets)}</td>${c(r, "d1")}${c(r, "d7")}${c(r, "d30")}</tr>`).join("") +
      `</tbody></table><div class="lq-src">${T("Cagaar = lacag ayaa soo gashay exchange-ka (deposit) · Casaan = lacag ayaa baxday (withdraw) · qiimaha isbeddelka lama tiriyo", "Green = deposits into the exchange · Red = withdrawals · price changes are excluded")} · ${T("Isha", "Source")}: DefiLlama (${T("wallet-yada exchange-ka", "exchange wallets")}) · ${T("saacad kasta", "hourly")} · ${hm(S.at.cex)}</div>`;
  }
  L.add("cex", { head: () => T("Exchange-yada: lacagta soo gashay iyo tan baxday", "Exchanges: money in and out"), at: () => S.at.cex, src: "DefiLlama", body: () => {
    const rows = ((S.cex && S.cex.ex) || []).slice().sort((a, b) => b.assets - a.assets).slice(0, 8), k = S.cxp, mx = Math.max(1, ...rows.map((r) => Math.abs(r[k] || 0)));
    const lab = { d1: T("24 saac", "24h"), d7: T("7 maalin", "7d"), d30: T("30 maalin", "30d") };
    let s = tx(56, 72, T(`Exchange-yada · soo gashay / baxday · ${lab[k]}`, `Exchanges · in / out · ${lab[k]}`), 32, { d: 1, w: 800 }) + box(56, 100, 1088, 450);
    rows.forEach((r, i) => { const y = 160 + i * 50, v = r[k] || 0, w = Math.abs(v) / mx * 380; s += tx(88, y, r.name, 22, { w: 800 }) + tx(420, y, fmt(r.assets), 19, { c: K.mut, a: "end" }) + `<rect x="${v >= 0 ? 700 : 700 - w}" y="${y - 18}" width="${Math.max(3, w)}" height="22" rx="6" fill="${v >= 0 ? G : R}" opacity=".85"/>` + `<line x1="700" x2="700" y1="${y - 24}" y2="${y + 8}" stroke="${K.line}"/>` + tx(1112, y, fmt(v, true), 22, { d: 1, w: 800, a: "end", c: v >= 0 ? G : R }); });
    return s;
  } });

  document.getElementById("lq-vt").addEventListener("click", (e) => {
    const th = e.target.closest("th[data-k]"); if (!th) return;
    const k = th.dataset.k; S.vdir = S.vsort === k ? -(S.vdir || -1) : -1; S.vsort = k; renderVol();
  });
  // Tooltip: tirada saxda ah marka la dul maro
  const TIP = document.createElement("div"); TIP.className = "lq-xtip"; TIP.hidden = true; document.body.appendChild(TIP);
  host.addEventListener("mousemove", (e) => {
    const c = e.target.closest && e.target.closest("[data-x]"); if (!c) { TIP.hidden = true; return; }
    TIP.textContent = c.dataset.x; TIP.hidden = false;
    const w = TIP.offsetWidth; TIP.style.left = Math.min(innerWidth - w - 8, e.clientX + 14) + "px"; TIP.style.top = (e.clientY - 38) + "px";
  });
  host.addEventListener("mouseleave", () => { TIP.hidden = true; });

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
  loadCf(); loadLsc().then(startPrices); loadLsx(); loadHist(); loadVol(); seedTrades().then(startTrades); startSpot(); startLiq();
  setInterval(() => { if (S.vm === "spot") loadVolSpot(); }, 5 * 60e3); setInterval(loadCf, 2 * 60e3);
  setInterval(loadLsc, 5 * 60e3); setInterval(loadLsx, 5 * 60e3); setInterval(loadHist, 30 * 60e3); setInterval(loadVol, 5 * 60e3);
  // Spot: suuqa oo dhan ilbiriqsi kasta → liiska volume-ka (spot) + liiska coins (lacagta-coins.js)
  function startSpot() {
    ws("wss://data-stream.binance.vision/ws/!miniTicker@arr", () => {}, (arr) => {
      if (!Array.isArray(arr)) return;
      document.dispatchEvent(new CustomEvent("xc-spot", { detail: arr }));
      wsVol(S.V.spot, arr);
    });
  }
  // Marka liiska CoinGecko yimaado: hubi in volume-ku yahay crypto oo kaliya
  document.addEventListener("xc-coins", () => { if (curV()) renderVol(); });
  window.XCLacagtaPro = { S, renderHist };
})();
