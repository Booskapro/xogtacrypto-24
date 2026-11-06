/* =========================================================
   Bogga hore: go'aannada FED + xogta crypto oo toos ah
   ========================================================= */
(function () {
  "use strict";

  // ---------- Qalab guud ----------
  const MONTHS = ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Lul", "Og", "Seb", "Okt", "Nof", "Dis"];
  const DAYS = ["Axad", "Isniin", "Talaado", "Arbaco", "Khamiis", "Jimco", "Sabti"];
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, "0"); }
  function fmtDate(d) { return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function fmtDateTime(d) { return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " · " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // =========================================================
  // A. FED — xogta tooska ah (/api/fed ← FRED) + jadwalka (data/fed.js)
  // =========================================================
  const F = window.FedCore;

  function decisionBox(id, meeting, outcome, labelPrefix) {
    const box = $(id);
    const a = F.ACTION[outcome.action];
    box.querySelector(".when").textContent = labelPrefix + " · " + F.fmtDate(meeting.date);
    const what = box.querySelector(".what");
    const chg = outcome.event ? F.fmtChange(outcome.event) : "";
    what.textContent = a.text + (chg ? " " + chg : "");
    what.className = "what " + a.cls;
    const parts = [];
    if (outcome.event) parts.push(F.fmtRange(outcome.event.from) + " → " + F.fmtRange(outcome.event.to));
    else parts.push(F.fmtRange(outcome.to));
    if (meeting.vote) parts.push("cod " + meeting.vote);
    box.querySelector(".detail").textContent = parts.join(" · ");
  }

  function latestRow(name, value, detail, source, url) {
    return '<div class="card-2" style="display:flex;justify-content:space-between;gap:12px;align-items:center">' +
      '<div><div style="font-weight:600">' + esc(name) + '</div><div class="small muted">' + esc(detail) + "</div></div>" +
      '<div style="text-align:right"><div class="kpi-value" style="font-size:1.4rem">' + esc(value) + "</div>" +
      '<a class="small" href="' + esc(url) + '" rel="noopener">' + esc(source) + "</a></div></div>";
  }

  function renderUpcoming() {
    const now = Date.now();
    const cal = window.FED_CAL;
    const items = cal.upcoming.slice();
    const nextMeeting = cal.meetings.find(function (m) { return new Date(m.time).getTime() > now; });
    if (nextMeeting) items.push({ name: "Go'aanka FOMC" + (nextMeeting.sep ? " + Dot Plot" : ""), time: nextMeeting.time, impact: "Aad u sare" });
    const up = items.filter(function (x) { return new Date(x.time).getTime() > now; })
      .sort(function (a, b) { return new Date(a.time) - new Date(b.time); }).slice(0, 4);
    $("upcoming").innerHTML = up.length ? up.map(function (x) {
      return '<div class="card-2" style="display:flex;justify-content:space-between;gap:12px;align-items:center">' +
        '<div><div style="font-weight:600">' + esc(x.name) + '</div><div class="small muted">' + F.fmtDateTime(new Date(x.time)) + "</div></div>" +
        '<span class="chip hawk">' + esc(x.impact) + "</span></div>";
    }).join("") : '<p class="muted">Jadwalka cusub waa la cusbooneysiinayaa.</p>';
  }

  function renderNext() {
    const now = Date.now();
    const next = window.FED_CAL.meetings.find(function (m) { return new Date(m.time).getTime() > now; });
    if (!next) { $("next-label").textContent = "Jadwalka waa la cusbooneysiinayaa"; return; }
    const t = new Date(next.time);
    const d = F.dateObj(next.date);
    const startDay = new Date(d.getTime() - 864e5);
    $("next-label").textContent = (startDay.getMonth() === d.getMonth() ? startDay.getDate() + "–" + d.getDate() + " " + F.MONTHS[d.getMonth()] : F.fmtDate(startDay.toISOString().slice(0, 10)) + " – " + d.getDate() + " " + F.MONTHS[d.getMonth()]) + " " + d.getFullYear() + (next.sep ? " · Dot Plot" : "");
    $("next-time").textContent = "Go'aanka: " + F.fmtDateTime(t) + " (saacaddaada)";
    startCountdown(t);
  }

  function renderFedLive(api) {
    const cal = window.FED_CAL;
    const now = Date.now();
    const past = cal.meetings.filter(function (m) { return new Date(m.time).getTime() <= now; });
    const ev = api.target.events;
    $("fed-range").textContent = F.fmtRange(api.target.current);
    if (past.length >= 2) {
      decisionBox("dec-prev", past[past.length - 2], F.meetingOutcome(ev, past[past.length - 2]), "Kii hore");
      decisionBox("dec-last", past[past.length - 1], F.meetingOutcome(ev, past[past.length - 1]), "Kii u dambeeyay");
    }
    const L = api.latest;
    const rows = [];
    function fred(id) { return "https://fred.stlouisfed.org/series/" + id; }
    function sign(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toLocaleString("en-US"); }
    if (L.cpi) rows.push(latestRow("Sicir-bararka (CPI) · " + F.monthName(L.cpi.month, true), L.cpi.value.toFixed(1) + "%", "Sannadle · bishii hore: " + (L.cpi.prev != null ? L.cpi.prev.toFixed(1) + "%" : "—"), "FRED · BLS", fred("CPIAUCNS")));
    if (L.un) rows.push(latestRow("Shaqo la'aanta · " + F.monthName(L.un.month, true), L.un.value.toFixed(1) + "%", "Bishii hore: " + (L.un.prev != null ? L.un.prev.toFixed(1) + "%" : "—"), "FRED · BLS", fred("UNRATE")));
    if (L.nfp) rows.push(latestRow("Shaqooyinka (NFP) · " + F.monthName(L.nfp.month, true), sign(L.nfp.value) + "K", "Bishii hore: " + (L.nfp.prev != null ? sign(L.nfp.prev) + "K" : "—"), "FRED · BLS", fred("PAYEMS")));
    if (L.dgs10) rows.push(latestRow("US 10Y Bond · " + F.fmtDate(L.dgs10.date), L.dgs10.value.toFixed(2) + "%", L.dgs10.prev != null ? "Maalintii hore: " + L.dgs10.prev.toFixed(2) + "%" : "Dulsaarka bond-ka 10 sano", "FRED · Treasury", fred("DGS10")));
    if (L.dgs2) rows.push(latestRow("US 2Y Bond · " + F.fmtDate(L.dgs2.date), L.dgs2.value.toFixed(2) + "%", L.dgs2.prev != null ? "Maalintii hore: " + L.dgs2.prev.toFixed(2) + "%" : "Rajada dulsaarka FED", "FRED · Treasury", fred("DGS2")));
    $("latest-data").innerHTML = rows.join("") || '<p class="muted">Xogta lama heli karo hadda.</p>';
    const t = new Date(api.updated);
    $("fed-updated").textContent = "Xogta FED-ka: toos ah · la soo qaaday " + F.pad(t.getHours()) + ":" + F.pad(t.getMinutes()) + " · Isha: FRED (Federal Reserve Bank of St. Louis), BLS, Treasury";
  }

  function renderFedFallback() {
    const fb = window.FED_CAL.fallback;
    $("fed-range").textContent = fb.current_range;
    function fill(id, dec, label) {
      const box = $(id), a = F.ACTION[dec.action];
      box.querySelector(".when").textContent = label + " · " + F.fmtDate(dec.date);
      const what = box.querySelector(".what");
      what.textContent = a.text + (dec.change ? " " + dec.change : "");
      what.className = "what " + a.cls;
      box.querySelector(".detail").textContent = dec.from ? dec.from + " → " + dec.to : dec.to;
    }
    fill("dec-prev", fb.previous, "Kii hore");
    fill("dec-last", fb.last, "Kii u dambeeyay");
    $("latest-data").innerHTML = fb.latest.map(function (x) { return latestRow(x.name, x.value, x.detail, x.source, x.url); }).join("");
    $("fed-updated").textContent = "Xog kayd ah oo la hubiyay " + F.fmtDate(fb.checked) + ". Xogta tooska ahi waxay shaqaysaa marka website-ka internet-ka la geliyo.";
  }

  function startCountdown(target) {
    const el = $("countdown");
    function tick() {
      let ms = target.getTime() - Date.now();
      if (ms <= 0) {
        el.innerHTML = '<span class="muted">Go\'aanka waa la shaaciyay. Xogta waa la cusbooneysiinayaa…</span>';
        setTimeout(function () { location.reload(); }, 15 * 60 * 1000);
        return;
      }
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      const s = Math.floor(ms / 1e3);
      el.innerHTML =
        "<div><b>" + d + "</b><span>maalmood</span></div>" +
        "<div><b>" + pad(h) + "</b><span>saacadood</span></div>" +
        "<div><b>" + pad(m) + "</b><span>daqiiqo</span></div>" +
        "<div><b>" + pad(s) + "</b><span>ilbiriqsi</span></div>";
      setTimeout(tick, 1000);
    }
    tick();
  }

  function renderFed() {
    renderNext();
    renderUpcoming();
    $("fed-updated").textContent = "Xogta FED-ka waa la soo qaadayaa…";
    F.load().then(function (api) {
      if (api) renderFedLive(api); else renderFedFallback();
    });
  }

  // =========================================================
  // B. CRYPTO (live)
  //   Binance WebSocket -> qiimaha ilbiriqsi kasta
  //   CoinGecko -> market cap, suuqa guud, chart 7 maalmood
  //   Haddii Binance la xiro, CoinGecko ayaa la isticmaalaa (20s)
  // =========================================================
  const COINS = [
    { sym: "BTC",  name: "Bitcoin",      bin: "btcusdt",  cg: "bitcoin",     color: "#F7931A" },
    { sym: "ETH",  name: "Ethereum",     bin: "ethusdt",  cg: "ethereum",    color: "#A9A9FF" },
    { sym: "BNB",  name: "BNB",          bin: "bnbusdt",  cg: "binancecoin", color: "#F3BA2F" },
    { sym: "SOL",  name: "Solana",       bin: "solusdt",  cg: "solana",      color: "#14F195" },
    { sym: "XRP",  name: "XRP",          bin: "xrpusdt",  cg: "ripple",      color: "#C3CDD7" },
    { sym: "DOGE", name: "Dogecoin",     bin: "dogeusdt", cg: "dogecoin",    color: "#D9BE5A" },
    { sym: "ADA",  name: "Cardano",      bin: "adausdt",  cg: "cardano",     color: "#7FA6F5" },
    { sym: "LINK", name: "Chainlink",    bin: "linkusdt", cg: "chainlink",   color: "#8AA4F7" },
    { sym: "PAXG", name: "Dahab (PAXG)", bin: "paxgusdt", cg: "pax-gold",    color: "#E6C35C" }
  ];
  const WS_URLS = [
    "wss://stream.binance.com:9443/stream?streams=",
    "wss://data-stream.binance.vision/stream?streams="
  ];
  const CG = "https://api.coingecko.com/api/v3";
  const FNG_URL = "https://api.alternative.me/fng/?limit=1";

  const state = {};
  const bySym = {};
  COINS.forEach(function (c) { state[c.sym] = {}; bySym[c.bin.toUpperCase()] = c; });

  let ws = null, wsIndex = 0, wsFails = 0, lastMsg = 0;
  let fallbackTimer = null, usingFallback = false;
  const pending = new Set();
  let rafQueued = false;

  function fmtPrice(p) {
    if (p == null || isNaN(p)) return "—";
    let d = 2;
    if (p < 1) d = 4;
    if (p < 0.01) d = 6;
    return "$" + p.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function fmtBig(n) {
    if (n == null || isNaN(n)) return "—";
    if (n >= 1e12) return "$" + (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function fmtPct(p) {
    if (p == null || isNaN(p)) return "—";
    return (p >= 0 ? "▲ " : "▼ ") + Math.abs(p).toFixed(2) + "%";
  }
  function cls(p) { return p == null || isNaN(p) ? "" : (p >= 0 ? "up" : "down"); }
  function timeNow() { const d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()); }

  function buildTable() {
    $("coins-body").innerHTML = COINS.map(function (c, i) {
      return '<tr data-sym="' + c.sym + '">' +
        '<td class="rank hide-xs">' + (i + 1) + "</td>" +
        '<td><div class="coin-cell"><span class="coin-icon" style="background:' + c.color + '">' + c.sym.slice(0, 1) + "</span>" +
        '<div><div class="coin-name">' + c.name + '</div><div class="coin-sym">' + c.sym + "</div></div></div></td>" +
        '<td class="r"><span class="price" data-f="price"><span class="skeleton"></span></span></td>' +
        '<td class="r"><span class="chg" data-f="pct">—</span></td>' +
        '<td class="r hide-sm mono small" data-f="hl">—</td>' +
        '<td class="r hide-sm" data-f="vol">—</td>' +
        '<td class="r hide-sm" data-f="mcap">—</td>' +
        '<td class="r hide-xs" data-f="spark"><span class="skeleton" style="width:110px"></span></td></tr>';
    }).join("");
  }

  function buildTicker() {
    const one = COINS.map(function (c) {
      return '<span class="ticker-item" data-sym="' + c.sym + '"><span class="sym">' + c.sym +
        '</span><span data-f="price">—</span> <span data-f="pct"></span></span>';
    }).join("");
    const t = $("ticker-track");
    if (t) t.innerHTML = one + one;
  }

  function queue(sym) {
    pending.add(sym);
    if (!rafQueued) { rafQueued = true; requestAnimationFrame(flush); }
  }
  function flush() {
    rafQueued = false;
    pending.forEach(render);
    pending.clear();
    $("clock").textContent = timeNow();
  }

  function render(sym) {
    const s = state[sym];
    const row = document.querySelector('tr[data-sym="' + sym + '"]');
    if (row) {
      const priceEl = row.querySelector('[data-f="price"]');
      const txt = fmtPrice(s.price);
      if (priceEl.textContent !== txt) {
        if (s.prevShown != null && s.price != null && s.price !== s.prevShown) {
          const dir = s.price > s.prevShown ? "flash-up" : "flash-down";
          priceEl.classList.remove("flash-up", "flash-down");
          void priceEl.offsetWidth;
          priceEl.classList.add(dir);
          setTimeout(function () { priceEl.classList.remove(dir); }, 350);
        }
        priceEl.textContent = txt;
        s.prevShown = s.price;
      }
      const pctEl = row.querySelector('[data-f="pct"]');
      pctEl.textContent = fmtPct(s.pct);
      pctEl.className = "chg " + cls(s.pct);
      row.querySelector('[data-f="hl"]').textContent = s.high != null ? fmtPrice(s.high) + " / " + fmtPrice(s.low) : "—";
      row.querySelector('[data-f="vol"]').textContent = fmtBig(s.vol);
      row.querySelector('[data-f="mcap"]').textContent = fmtBig(s.mcap);
      if (s.sparkDirty) { row.querySelector('[data-f="spark"]').innerHTML = sparkline(s.spark); s.sparkDirty = false; }
    }
    document.querySelectorAll('.ticker-item[data-sym="' + sym + '"]').forEach(function (el) {
      el.querySelector('[data-f="price"]').textContent = fmtPrice(s.price);
      const p = el.querySelector('[data-f="pct"]');
      p.textContent = fmtPct(s.pct);
      p.className = cls(s.pct);
    });
    if (sym === "BTC") {
      $("hero-btc").textContent = fmtPrice(s.price);
      const c = $("hero-btc-chg");
      c.textContent = fmtPct(s.pct) + " · 24 saac";
      c.className = "kpi-sub " + cls(s.pct);
    }
  }

  function sparkline(points) {
    if (!points || points.length < 2) return '<span class="muted small">—</span>';
    const w = 120, h = 36, step = Math.max(1, Math.floor(points.length / 60));
    const pts = points.filter(function (_, i) { return i % step === 0; });
    const min = Math.min.apply(null, pts), max = Math.max.apply(null, pts), range = max - min || 1;
    const d = pts.map(function (v, i) {
      return (i ? "L" : "M") + ((i / (pts.length - 1)) * w).toFixed(1) + " " + (h - 2 - ((v - min) / range) * (h - 4)).toFixed(1);
    }).join(" ");
    const color = pts[pts.length - 1] >= pts[0] ? "var(--up)" : "var(--down)";
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h +
      '" role="img" aria-label="Chart-ka 7 maalmood"><path d="' + d + '" fill="none" stroke="' + color +
      '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  function setStatus(kind, text) {
    const el = $("status");
    if (!el) return;
    el.className = "status " + (kind || "");
    $("status-text").textContent = text;
  }
  function showNote(text) {
    const n = $("data-note");
    if (!text) { n.hidden = true; return; }
    n.textContent = text; n.hidden = false;
  }

  function connectWS() {
    if (ws) { try { ws.onclose = null; ws.close(); } catch (e) {} }
    const url = WS_URLS[wsIndex % WS_URLS.length] + COINS.map(function (c) { return c.bin + "@ticker"; }).join("/");
    if (!usingFallback) setStatus("warn", "Xiriirinaya…");
    try { ws = new WebSocket(url); } catch (e) { onWsFail(); return; }
    ws.onopen = function () { wsFails = 0; lastMsg = Date.now(); };
    ws.onmessage = function (ev) {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      const d = msg && msg.data;
      if (!d || !d.s) return;
      const coin = bySym[d.s];
      if (!coin) return;
      const s = state[coin.sym];
      s.price = parseFloat(d.c); s.pct = parseFloat(d.P);
      s.high = parseFloat(d.h); s.low = parseFloat(d.l); s.vol = parseFloat(d.q);
      lastMsg = Date.now();
      if (usingFallback) stopFallback();
      setStatus("live", "LIVE");
      queue(coin.sym);
    };
    ws.onclose = function () { onWsFail(); };
  }
  function onWsFail() {
    wsFails++; wsIndex++;
    if (wsFails >= 2 && !usingFallback) startFallback();
    setTimeout(connectWS, Math.min(30000, 2000 * wsFails));
  }
  setInterval(function () {
    if (ws && ws.readyState === 1 && lastMsg && Date.now() - lastMsg > 15000) {
      setStatus("warn", "Dib u xiriirinaya…");
      try { ws.close(); } catch (e) {}
    }
  }, 5000);

  function getJSON(url) {
    return fetch(url, { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  function loadMarkets(alsoPrices) {
    const ids = COINS.map(function (c) { return c.cg; }).join(",");
    return getJSON(CG + "/coins/markets?vs_currency=usd&ids=" + ids + "&sparkline=true&price_change_percentage=24h")
      .then(function (list) {
        list.forEach(function (m) {
          const coin = COINS.find(function (c) { return c.cg === m.id; });
          if (!coin) return;
          const s = state[coin.sym];
          s.mcap = m.market_cap;
          if (m.sparkline_in_7d && m.sparkline_in_7d.price) { s.spark = m.sparkline_in_7d.price; s.sparkDirty = true; }
          if (alsoPrices || s.price == null) {
            s.price = m.current_price; s.pct = m.price_change_percentage_24h;
            s.high = m.high_24h; s.low = m.low_24h; s.vol = m.total_volume;
          }
          queue(coin.sym);
        });
      })
      .catch(function () { if (usingFallback) showNote("Xogta lama heli karo hadda. Waxaan isku dayi doonnaa mar kale."); });
  }

  function startFallback() {
    usingFallback = true;
    setStatus("warn", "Xog toos ah · 20s");
    showNote("Xiriirka Binance lama heli karo meeshaada. Qiimayaashu waxay ka imanayaan CoinGecko, waxaana la cusbooneysiiyaa 20-kii ilbiriqsi.");
    loadMarkets(true);
    fallbackTimer = setInterval(function () { loadMarkets(true); }, 20000);
  }
  function stopFallback() { usingFallback = false; clearInterval(fallbackTimer); showNote(""); }

  function loadGlobal() {
    return getJSON(CG + "/global").then(function (res) {
      const g = res.data;
      $("g-mcap").textContent = fmtBig(g.total_market_cap.usd);
      const chg = g.market_cap_change_percentage_24h_usd;
      const el = $("g-mcap-chg");
      el.textContent = fmtPct(chg) + " · 24 saac";
      el.className = "kpi-sub " + cls(chg);
      $("g-btcdom").textContent = g.market_cap_percentage.btc.toFixed(1) + "%";
      $("g-ethdom").textContent = "ETH " + g.market_cap_percentage.eth.toFixed(1) + "%";
    }).catch(function () {});
  }

  const FNG_SO = { "Extreme Fear": "Cabsi aad u daran", "Fear": "Cabsi", "Neutral": "Dhexdhexaad", "Greed": "Hunguri", "Extreme Greed": "Hunguri aad u daran" };
  function loadFng() {
    return getJSON(FNG_URL).then(function (res) {
      const item = res.data && res.data[0];
      if (!item) return;
      const v = parseInt(item.value, 10);
      const el = $("fng-value");
      el.textContent = v;
      el.className = "kpi-value " + (v < 45 ? "down" : v > 55 ? "up" : "");
      $("fng-label").textContent = FNG_SO[item.value_classification] || item.value_classification;
      const pin = $("fng-pin");
      pin.style.display = "block";
      pin.style.left = "calc(" + v + "% - 2px)";
    }).catch(function () {});
  }

  // ---------- Bilow ----------
  document.addEventListener("DOMContentLoaded", function () {
    renderFed();
    buildTable();
    buildTicker();
    connectWS();
    loadMarkets(false);
    loadGlobal();
    loadFng();
    setInterval(function () { if (!usingFallback) loadMarkets(false); }, 60000);
    setInterval(loadGlobal, 60000);
    setInterval(loadFng, 600000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible") return;
      loadGlobal();
      loadMarkets(usingFallback);
      if (!ws || ws.readyState > 1) connectWS();
    });
  });
})();
