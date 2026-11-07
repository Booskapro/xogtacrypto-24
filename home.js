/* =========================================================
   Bogga hore: go'aannada FED + xogta crypto oo toos ah
   ========================================================= */
(function () {
  "use strict";

  // ---------- Qalab guud ----------
  const T = window.I18N.tx;
  const EN = window.I18N.lang === "en";
  function $(id) { return document.getElementById(id); }
  function pad(n) { return String(n).padStart(2, "0"); }
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
    if (meeting.vote) parts.push(T("cod ", "vote ") + meeting.vote);
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
    if (nextMeeting) items.push({ name: T("Go'aanka FED (FOMC)", "Fed decision (FOMC)") + (nextMeeting.sep ? T(" + saadaasha xubnaha", " + projections") : ""), time: nextMeeting.time, impact: T("Aad u sare", "Very high") });
    const up = items.filter(function (x) { return new Date(x.time).getTime() > now; })
      .sort(function (a, b) { return new Date(a.time) - new Date(b.time); }).slice(0, 4);
    $("upcoming").innerHTML = up.length ? up.map(function (x) {
      return '<div class="card-2" style="display:flex;justify-content:space-between;gap:12px;align-items:center">' +
        '<div><div style="font-weight:600">' + esc(EN && x.name_en ? x.name_en : x.name) + '</div><div class="small muted">' + F.fmtDateTime(new Date(x.time)) + "</div></div>" +
        '<span class="chip hawk">' + esc(EN && x.impact_en ? x.impact_en : x.impact) + "</span></div>";
    }).join("") : '<p class="muted">' + T("Jadwalka cusub waa la cusbooneysiinayaa.", "The new schedule is being updated.") + "</p>";
  }

  function renderNext() {
    const now = Date.now();
    const next = window.FED_CAL.meetings.find(function (m) { return new Date(m.time).getTime() > now; });
    if (!next) { $("next-label").textContent = T("Jadwalka waa la cusbooneysiinayaa", "Schedule being updated"); return; }
    const t = new Date(next.time);
    const d = F.dateObj(next.date);
    const startDay = new Date(d.getTime() - 864e5);
    $("next-label").textContent = (startDay.getMonth() === d.getMonth() ? startDay.getDate() + "–" + d.getDate() + " " + F.MONTHS[d.getMonth()] : F.fmtDate(startDay.toISOString().slice(0, 10)) + " – " + d.getDate() + " " + F.MONTHS[d.getMonth()]) + " " + d.getFullYear() + (next.sep ? T(" · saadaasha xubnaha", " · with projections") : "");
    $("next-time").textContent = T("Go'aanka: ", "Decision: ") + F.fmtDateTime(t) + T(" (saacaddaada)", " (your time)");
    startCountdown(t);
  }

  function renderFedLive(api) {
    const cal = window.FED_CAL;
    const now = Date.now();
    const past = cal.meetings.filter(function (m) { return new Date(m.time).getTime() <= now; });
    const ev = api.target.events;
    $("fed-range").textContent = F.fmtRange(api.target.current);
    if (past.length >= 2) {
      decisionBox("dec-prev", past[past.length - 2], F.meetingOutcome(ev, past[past.length - 2]), T("Kii hore", "Previous"));
      decisionBox("dec-last", past[past.length - 1], F.meetingOutcome(ev, past[past.length - 1]), T("Kii u dambeeyay", "Latest"));
    }
    const L = api.latest;
    const rows = [];
    function fred(id) { return "https://fred.stlouisfed.org/series/" + id; }
    function sign(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n).toLocaleString("en-US"); }
    if (L.cpi) rows.push(latestRow(T("Sicir-bararka (CPI) · ", "Inflation (CPI) · ") + F.monthName(L.cpi.month, true), L.cpi.value.toFixed(1) + "%", T("Sannadle · bishii hore: ", "Year-over-year · previous: ") + (L.cpi.prev != null ? L.cpi.prev.toFixed(1) + "%" : "—"), "FRED · BLS", fred("CPIAUCNS")));
    if (L.un) rows.push(latestRow(T("Shaqo la'aanta · ", "Unemployment · ") + F.monthName(L.un.month, true), L.un.value.toFixed(1) + "%", T("Bishii hore: ", "Previous: ") + (L.un.prev != null ? L.un.prev.toFixed(1) + "%" : "—"), "FRED · BLS", fred("UNRATE")));
    if (L.nfp) rows.push(latestRow(T("Shaqooyinka (NFP) · ", "Jobs (NFP) · ") + F.monthName(L.nfp.month, true), sign(L.nfp.value) + "K", T("Bishii hore: ", "Previous: ") + (L.nfp.prev != null ? sign(L.nfp.prev) + "K" : "—"), "FRED · BLS", fred("PAYEMS")));
    if (L.dgs10) rows.push(latestRow(T("Bond-ka 10 sano · ", "10-year bond · ") + F.fmtDate(L.dgs10.date), L.dgs10.value.toFixed(2) + "%", L.dgs10.prev != null ? T("Maalintii hore: ", "Previous day: ") + L.dgs10.prev.toFixed(2) + "%" : T("Dulsaarka bond-ka 10 sano", "10-year bond yield"), "FRED · Treasury", fred("DGS10")));
    if (L.dgs2) rows.push(latestRow(T("Bond-ka 2 sano · ", "2-year bond · ") + F.fmtDate(L.dgs2.date), L.dgs2.value.toFixed(2) + "%", L.dgs2.prev != null ? T("Maalintii hore: ", "Previous day: ") + L.dgs2.prev.toFixed(2) + "%" : T("Rajada dulsaarka FED", "Fed rate expectations"), "FRED · Treasury", fred("DGS2")));
    $("latest-data").innerHTML = rows.join("") || '<p class="muted">' + T("Xogta lama heli karo hadda.", "Data is not available right now.") + "</p>";
    const t = new Date(api.updated);
    $("fed-updated").textContent = T("Xogta FED-ka: toos ah · la soo qaaday ", "Fed data: live · fetched ") + F.pad(t.getHours()) + ":" + F.pad(t.getMinutes()) + T(" · Isha: ", " · Source: ") + "FRED (Federal Reserve Bank of St. Louis), BLS, Treasury";
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
    fill("dec-prev", fb.previous, T("Kii hore", "Previous"));
    fill("dec-last", fb.last, T("Kii u dambeeyay", "Latest"));
    $("latest-data").innerHTML = fb.latest.map(function (x) { return latestRow(EN && x.name_en ? x.name_en : x.name, x.value, EN && x.detail_en ? x.detail_en : x.detail, x.source, x.url); }).join("");
    $("fed-updated").textContent = T("Xog kayd ah oo la hubiyay ", "Backup data checked ") + F.fmtDate(fb.checked) + T(". Xogta tooska ahi waxay shaqaysaa marka website-ka internet-ka la geliyo.", ". Live data works once the website is online.");
  }

  function startCountdown(target) {
    const el = $("countdown");
    function tick() {
      let ms = target.getTime() - Date.now();
      if (ms <= 0) {
        el.innerHTML = '<span class="muted">' + T("Go'aanka waa la shaaciyay. Xogta waa la cusbooneysiinayaa…", "The decision is out. Data is updating…") + "</span>";
        setTimeout(function () { location.reload(); }, 15 * 60 * 1000);
        return;
      }
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      const s = Math.floor(ms / 1e3);
      el.innerHTML =
        "<div><b>" + d + "</b><span>" + T("maalmood", "days") + "</span></div>" +
        "<div><b>" + pad(h) + "</b><span>" + T("saacadood", "hours") + "</span></div>" +
        "<div><b>" + pad(m) + "</b><span>" + T("daqiiqo", "min") + "</span></div>" +
        "<div><b>" + pad(s) + "</b><span>" + T("ilbiriqsi", "sec") + "</span></div>";
      setTimeout(tick, 1000);
    }
    tick();
  }

  function renderFed() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) $("tz-note").textContent = T("Waqtiyada waxaa lagu muujiyaa saacaddaada: ", "Times are shown in your local time: ") + tz.split("/").pop().replace(/_/g, " ") + ".";
    } catch (e) {}
    renderNext();
    renderUpcoming();
    $("fed-updated").textContent = T("Xogta FED-ka waa la soo qaadayaa…", "Loading Fed data…");
    F.load().then(function (api) {
      if (api) renderFedLive(api); else renderFedFallback();
    });
  }

  // =========================================================
  // B. SUUQYADA (live, 24/7)
  //   Binance WebSocket  -> Bitcoin, Ethereum (ilbiriqsi kasta)
  //   Hyperliquid WS     -> dahab, lacag, shidaal, S&P 500, Nasdaq, Euro/Dollar
  //   /api/markets       -> sawirka koowaad + kayd haddii WS go'o
  //   /api/spark         -> chart 7 maalmood
  //   FRED (/api/fed)    -> bond-ka 10 sano (maalin kasta)
  // =========================================================
  const ROWS = [
    { key: "BTC", name: "Bitcoin", sub: "BTC", group: "Crypto", bin: "btcusdt", hl: "BTC", color: "#F7931A", dec: 2, cur: "$" },
    { key: "ETH", name: "Ethereum", sub: "ETH", group: "Crypto", bin: "ethusdt", hl: "ETH", color: "#A9A9FF", dec: 2, cur: "$" },
    { key: "GOLD", name: T("Dahab", "Gold"), sub: "1 ounce", group: "Biraha", hl: "xyz:GOLD", color: "#E6C35C", dec: 2, cur: "$" },
    { key: "SILVER", name: T("Lacag (silver)", "Silver"), sub: "1 ounce", group: "Biraha", hl: "xyz:SILVER", color: "#C3CDD7", dec: 2, cur: "$" },
    { key: "OIL", name: T("Shidaalka (WTI)", "Oil (WTI)"), sub: T("1 fuusto", "1 barrel"), group: "Tamarta", hl: "xyz:CL", color: "#9AA7B4", dec: 2, cur: "$" },
    { key: "SPX", name: "S&P 500", sub: T("500-ka shirkadood ee ugu waaweyn", "500 largest US companies"), group: "Saamiyada", hl: "xyz:SP500", color: "#8CC2FF", dec: 1, cur: "" },
    { key: "NDX", name: "Nasdaq 100", sub: T("shirkadaha teknoolajiyadda", "tech companies"), group: "Saamiyada", hl: "xyz:XYZ100", color: "#B48CFF", dec: 1, cur: "" },
    { key: "USD", name: "Dollar", sub: T("marka loo eego Euro", "against the Euro"), group: "Lacagta", hl: "xyz:EUR", invert: true, color: "#3DD68C", dec: 4, cur: "€" },
    { key: "US10Y", name: T("Bond-ka 10 sano", "10-year bond"), sub: T("dowladda Mareykanka · maalinle", "US Treasury · daily"), group: "Bonds", fred: true, color: "#F5A524", dec: 2, cur: "", pct: true }
  ];
  const HL_WS = "wss://api.hyperliquid.xyz/ws";
  const BIN_WS = ["wss://stream.binance.com:9443/stream?streams=", "wss://data-stream.binance.vision/stream?streams="];
  const CG = "https://api.coingecko.com/api/v3";
  const FNG_URL = "https://api.alternative.me/fng/?limit=1";

  const state = {};
  ROWS.forEach(function (r) { state[r.key] = {}; });
  const byHl = {}, byBin = {};
  ROWS.forEach(function (r) { if (r.hl) byHl[r.hl] = r; if (r.bin) byBin[r.bin.toUpperCase()] = r; });

  const pending = new Set();
  let rafQueued = false;
  let binLast = 0, hlLast = 0;

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
  function fmtVal(r, v) {
    if (v == null || isNaN(v)) return "—";
    const n = v.toLocaleString("en-US", { minimumFractionDigits: r.dec, maximumFractionDigits: r.dec });
    if (r.invert) return "1$ = " + r.cur + n;
    return r.pct ? n + "%" : r.cur + n;
  }

  // Qiimaha la muujiyo (Dollar: 1 USD = ? EUR, oo ah 1 / EURUSD)
  function setPx(r, px, prev) {
    const s = state[r.key];
    if (r.invert) { px = 1 / px; prev = prev ? 1 / prev : prev; }
    s.price = px;
    if (prev) { s.prev = prev; s.pct = (px / prev - 1) * 100; }
    queue(r.key);
  }

  // Suuqyada caadiga ah way xiran yihiin: Jimco 17:00 ilaa Axad 18:00 (waqtiga New York)
  function weekendClosed() {
    try {
      const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date());
      const wd = p.find(function (x) { return x.type === "weekday"; }).value;
      const h = Number(p.find(function (x) { return x.type === "hour"; }).value) % 24;
      return wd === "Sat" || (wd === "Fri" && h >= 17) || (wd === "Sun" && h < 18);
    } catch (e) { return false; }
  }

  function buildTable() {
    const closed = weekendClosed();
    $("coins-body").innerHTML = ROWS.map(function (r) {
      const src = r.bin ? "Binance" : r.fred ? "FRED" : "Hyperliquid";
      const note = !r.bin && !r.fred && closed ? '<span class="chip" title="' + T("Suuqa rasmiga ah wuu xiran yahay; qiimuhu wuxuu ka yimaadaa ganacsiga 24/7", "The official market is closed; price comes from 24/7 trading") + '">' + T("Fasax", "Closed") + "</span>" : "";
      return '<tr data-sym="' + r.key + '">' +
        '<td><div class="coin-cell"><span class="coin-icon" style="background:' + r.color + '">' + r.name.slice(0, 1) + "</span>" +
        '<div><div class="coin-name">' + esc(r.name) + " " + note + '</div><div class="coin-sym">' + esc(r.sub) + "</div></div></div></td>" +
        '<td class="r"><span class="price" data-f="price"><span class="skeleton"></span></span></td>' +
        '<td class="r"><span class="chg" data-f="pct">—</span></td>' +
        '<td class="r hide-xs" data-f="spark"><span class="skeleton" style="width:110px"></span></td>' +
        '<td class="r hide-sm small muted">' + src + "</td></tr>";
    }).join("");
  }

  function buildTicker() {
    const one = ROWS.map(function (r) {
      return '<span class="ticker-item" data-sym="' + r.key + '"><span class="sym">' + esc(r.name) + '</span> <span data-f="price">—</span> <span data-f="pct"></span></span>';
    }).join("");
    const t = $("ticker-track");
    if (t) t.innerHTML = one + one;
  }

  function queue(key) {
    pending.add(key);
    if (!rafQueued) { rafQueued = true; requestAnimationFrame(flush); }
  }
  function flush() {
    rafQueued = false;
    pending.forEach(render);
    pending.clear();
    $("clock").textContent = timeNow();
  }

  function render(key) {
    const r = ROWS.find(function (x) { return x.key === key; });
    const s = state[key];
    const row = document.querySelector('tr[data-sym="' + key + '"]');
    if (row) {
      const priceEl = row.querySelector('[data-f="price"]');
      const txt = fmtVal(r, s.price);
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
      if (r.pct && s.change != null) { pctEl.textContent = (s.change >= 0 ? "▲ +" : "▼ −") + Math.abs(s.change).toFixed(2) + "%"; pctEl.className = "chg " + cls(s.change); }
      else { pctEl.textContent = fmtPct(s.pct); pctEl.className = "chg " + cls(s.pct); }
      if (s.sparkDirty) { row.querySelector('[data-f="spark"]').innerHTML = sparkline(s.spark); s.sparkDirty = false; }
    }
    document.querySelectorAll('.ticker-item[data-sym="' + key + '"]').forEach(function (el) {
      el.querySelector('[data-f="price"]').textContent = fmtVal(r, s.price);
      const p = el.querySelector('[data-f="pct"]');
      p.textContent = r.pct ? "" : fmtPct(s.pct);
      p.className = cls(s.pct);
    });
    if (key === "BTC") {
      $("hero-btc").textContent = fmtVal(r, s.price);
      const c = $("hero-btc-chg");
      c.textContent = fmtPct(s.pct) + T(" · 24 saac", " · 24h");
      c.className = "kpi-sub " + cls(s.pct);
    }
  }

  function sparkline(points) {
    if (!points || points.length < 2) return '<span class="muted small">—</span>';
    const w = 120, h = 36;
    const min = Math.min.apply(null, points), max = Math.max.apply(null, points), range = max - min || 1;
    const d = points.map(function (v, i) {
      return (i ? "L" : "M") + ((i / (points.length - 1)) * w).toFixed(1) + " " + (h - 2 - ((v - min) / range) * (h - 4)).toFixed(1);
    }).join(" ");
    const color = points[points.length - 1] >= points[0] ? "var(--up)" : "var(--down)";
    return '<svg class="spark" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h +
      '" role="img" aria-label="7-day chart"><path d="' + d + '" fill="none" stroke="' + color +
      '" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  function setStatus(kind, text) {
    const el = $("status");
    if (!el) return;
    el.className = "status " + (kind || "");
    $("status-text").textContent = text;
  }
  function updateStatus() {
    const now = Date.now();
    const fresh = (binLast && now - binLast < 15000) || (hlLast && now - hlLast < 30000);
    setStatus(fresh ? "live" : "warn", fresh ? T("TOOS", "LIVE") : T("Xiriirinaya…", "Connecting…"));
  }
  setInterval(updateStatus, 5000);

  // ---------- Binance: Bitcoin & Ethereum ----------
  let bws = null, bIdx = 0, bFails = 0;
  function connectBinance() {
    const url = BIN_WS[bIdx % BIN_WS.length] + ROWS.filter(function (r) { return r.bin; }).map(function (r) { return r.bin + "@ticker"; }).join("/");
    try { bws = new WebSocket(url); } catch (e) { return retryBinance(); }
    bws.onopen = function () { bFails = 0; };
    bws.onmessage = function (ev) {
      let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      const d = msg && msg.data; if (!d || !d.s) return;
      const r = byBin[d.s]; if (!r) return;
      const s = state[r.key];
      s.price = parseFloat(d.c); s.pct = parseFloat(d.P); s.src = "bin";
      binLast = Date.now(); updateStatus();
      queue(r.key);
    };
    bws.onclose = retryBinance;
  }
  function retryBinance() { bFails++; bIdx++; setTimeout(connectBinance, Math.min(30000, 2000 * bFails)); }

  // ---------- Hyperliquid: dahab, lacag, shidaal, saamiyo, dollar ----------
  let hws = null, hFails = 0, pingTimer = null;
  function connectHL() {
    try { hws = new WebSocket(HL_WS); } catch (e) { return retryHL(); }
    hws.onopen = function () {
      hFails = 0;
      ROWS.filter(function (r) { return r.hl; }).forEach(function (r) {
        hws.send(JSON.stringify({ method: "subscribe", subscription: { type: "activeAssetCtx", coin: r.hl } }));
      });
      clearInterval(pingTimer);
      pingTimer = setInterval(function () { try { hws.send(JSON.stringify({ method: "ping" })); } catch (e) {} }, 45000);
    };
    hws.onmessage = function (ev) {
      let msg; try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (!msg || msg.channel !== "activeAssetCtx" || !msg.data) return;
      const r = byHl[msg.data.coin]; if (!r) return;
      const c = msg.data.ctx || {};
      const px = parseFloat(c.midPx || c.markPx), prev = parseFloat(c.prevDayPx);
      if (isNaN(px)) return;
      hlLast = Date.now(); updateStatus();
      // Bitcoin/Ethereum: Binance ayaa mudnaan leh; Hyperliquid waa kayd
      if (r.bin && binLast && Date.now() - binLast < 15000) return;
      setPx(r, px, isNaN(prev) ? null : prev);
    };
    hws.onclose = function () { clearInterval(pingTimer); retryHL(); };
  }
  function retryHL() { hFails++; setTimeout(connectHL, Math.min(30000, 2000 * hFails)); }

  // ---------- Server: sawirka koowaad, kayd, chart ----------
  function getJSON(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); });
  }
  function loadSnapshot() {
    if (location.protocol === "file:") return Promise.resolve();
    return getJSON("/api/markets").then(function (j) {
      Object.keys(j.data || {}).forEach(function (coin) {
        const r = byHl[coin]; if (!r) return;
        if (r.bin && binLast) return;
        if (!r.bin && hlLast && Date.now() - hlLast < 30000) return;
        const d = j.data[coin];
        setPx(r, d.px, d.prev);
      });
    }).catch(function () {});
  }
  function loadSpark() {
    if (location.protocol === "file:") return Promise.resolve();
    return getJSON("/api/spark").then(function (j) {
      Object.keys(j.data || {}).forEach(function (coin) {
        const r = byHl[coin]; if (!r) return;
        let pts = j.data[coin];
        if (r.invert) pts = pts.map(function (v) { return 1 / v; });
        state[r.key].spark = pts; state[r.key].sparkDirty = true; queue(r.key);
      });
    }).catch(function () {});
  }
  function loadBond() {
    F.load().then(function (api) {
      if (!api || !api.latest || !api.latest.dgs10) return;
      const d = api.latest.dgs10, s = state.US10Y;
      s.price = d.value;
      if (d.prev != null) { s.change = d.value - d.prev; s.pct = s.change; }
      queue("US10Y");
      const row = document.querySelector('tr[data-sym="US10Y"] [data-f="spark"]');
      if (row) row.innerHTML = '<span class="small muted">' + F.fmtDate(d.date) + "</span>";
    });
  }

  // ---------- Suuqa crypto guud + dareenka ----------
  function loadGlobal() {
    return getJSON(CG + "/global").then(function (res) {
      const g = res.data;
      $("g-mcap").textContent = fmtBig(g.total_market_cap.usd);
      const chg = g.market_cap_change_percentage_24h_usd;
      const el = $("g-mcap-chg");
      el.textContent = fmtPct(chg) + T(" · 24 saac", " · 24h");
      el.className = "kpi-sub " + cls(chg);
      $("g-btcdom").textContent = g.market_cap_percentage.btc.toFixed(1) + "%";
      $("g-ethdom").textContent = "Ethereum " + g.market_cap_percentage.eth.toFixed(1) + "%";
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
      $("fng-label").textContent = EN ? item.value_classification : FNG_SO[item.value_classification] || item.value_classification;
      const pin = $("fng-pin");
      pin.style.display = "block";
      pin.style.left = "calc(" + v + "% - 2px)";
    }).catch(function () {});
  }

  // ---------- Bilow ----------
  document.addEventListener("DOMContentLoaded", function () {
    if ($("dec-prev")) renderFed(); // naqshadda cusub: fed-hero.js
    buildTable();
    buildTicker();
    loadSnapshot();
    loadSpark();
    loadBond();
    connectBinance();
    connectHL();
    loadGlobal();
    loadFng();
    // Kayd: haddii WebSocket-ku go'o, server-ka ayaa la weydiinayaa 20-kii ilbiriqsi
    setInterval(function () { if (!hlLast || Date.now() - hlLast > 30000) loadSnapshot(); }, 20000);
    setInterval(loadSpark, 10 * 60000);
    setInterval(loadGlobal, 60000);
    setInterval(loadFng, 600000);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState !== "visible") return;
      loadSnapshot(); loadGlobal();
      if (!bws || bws.readyState > 1) connectBinance();
      if (!hws || hws.readyState > 1) connectHL();
    });
  });
})();
