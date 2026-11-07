/* =========================================================
   Chart-yada FED-ka (kaararka) — xogta dhabta ah ee /api/fed (FRED)
   Dulsaarka FED · CPI · Shaqo la'aanta · NFP · Bond 10 & 2 sano
   + xogta soo socota oo leh countdown (fed-data.js)
   ========================================================= */
(function () {
  "use strict";
  const root = document.getElementById("fed-tiles");
  if (!root || !window.FedCore) return;
  const F = window.FedCore, T = F.T, esc = F.esc;
  const COL = { teal: "#2FD9A6", amber: "#F5B23C", blue: "#6FB2FF" };
  let uid = 0;

  // ---------- SVG ----------
  function smoothPath(xy) {
    let d = "M" + xy[0][0].toFixed(1) + " " + xy[0][1].toFixed(1);
    for (let i = 1; i < xy.length; i++) {
      const x0 = xy[i - 1][0], y0 = xy[i - 1][1], x1 = xy[i][0], y1 = xy[i][1], cx = (x0 + x1) / 2;
      d += " C" + cx.toFixed(1) + " " + y0.toFixed(1) + " " + cx.toFixed(1) + " " + y1.toFixed(1) + " " + x1.toFixed(1) + " " + y1.toFixed(1);
    }
    return d;
  }
  function lineChart(vals, col, opt) {
    opt = opt || {};
    if (!vals || vals.length < 2) return "";
    const W = 400, H = 180, id = "fc" + (++uid);
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    if (opt.target != null) { lo = Math.min(lo, opt.target); hi = Math.max(hi, opt.target); }
    const r = hi - lo || 1; lo -= r * 0.12; hi += r * 0.15;
    const y = function (v) { return H - ((v - lo) / (hi - lo)) * H; };
    const xy = vals.map(function (v, i) { return [(i / (vals.length - 1)) * W, y(v)]; });
    let d;
    if (opt.step) {
      d = "M" + xy[0][0].toFixed(1) + " " + xy[0][1].toFixed(1);
      for (let i = 1; i < xy.length; i++) d += " L" + xy[i][0].toFixed(1) + " " + xy[i - 1][1].toFixed(1) + " L" + xy[i][0].toFixed(1) + " " + xy[i][1].toFixed(1);
    } else d = smoothPath(xy);
    const tgt = opt.target != null
      ? '<line x1="0" x2="' + W + '" y1="' + y(opt.target).toFixed(1) + '" y2="' + y(opt.target).toFixed(1) + '" stroke="' + COL.teal + '" stroke-width="1.2" stroke-dasharray="6 5" opacity=".7" vector-effect="non-scaling-stroke"/>'
      : "";
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true"><defs>' +
      '<linearGradient id="a' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient>' +
      "</defs>" + tgt +
      '<path d="' + d + " L" + W + " " + H + " L0 " + H + ' Z" fill="url(#a' + id + ')"/>' +
      '<path class="glow" d="' + d + '" fill="none" stroke="' + col + '" stroke-width="7" opacity=".22" vector-effect="non-scaling-stroke"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2.4" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  }
  function barChart(vals, col) {
    if (!vals || !vals.length) return "";
    const W = 400, H = 150, n = vals.length, bw = (W / n) * 0.56;
    const lo = Math.min(0, Math.min.apply(null, vals)), hi = Math.max(1, Math.max.apply(null, vals)) * 1.08;
    const y = function (v) { return H - ((v - lo) / (hi - lo)) * H; }, z = y(0);
    return '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' + vals.map(function (v, i) {
      const x = (i * W) / n + (W / n - bw) / 2, yy = y(v);
      return '<rect x="' + x.toFixed(1) + '" y="' + Math.min(yy, z).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(1.5, Math.abs(z - yy)).toFixed(1) +
        '" rx="3" fill="' + (v >= 0 ? col : "#FF7A6B") + '" opacity="' + (i === n - 1 ? 1 : 0.55) + '"/>';
    }).join("") + "</svg>";
  }

  // ---------- Kaarka ----------
  function chg(dir, text) {
    const cls = dir > 0 ? "up" : dir < 0 ? "down" : "flat";
    const ar = dir > 0 ? "▲" : dir < 0 ? "▼" : "●";
    return '<span class="ft-chg ' + cls + '">' + ar + " " + esc(text) + "</span>";
  }
  function tile(o) {
    return '<a class="ft ' + o.size + '" data-g="' + o.group + '" href="' + o.href + '">' +
      '<div class="ft-top"><div class="ft-name"><span class="ft-ic" aria-hidden="true">' + o.icon + "</span>" + esc(o.name) + "</div>" +
      '<span class="ft-badge' + (o.gold ? " gold" : "") + '">' + esc(o.badge) + "</span></div>" +
      '<div class="ft-val"><span class="mono">' + esc(o.value) + "</span>" + o.change + "</div>" +
      '<div class="ft-sub">' + esc(o.sub) + "</div>" +
      '<div class="ft-chart">' + o.chart + "</div></a>";
  }
  const sign = function (v, d) { return Math.abs(v) < 1e-9 ? T("Isku mid", "Unchanged") : (v > 0 ? "+" : "−") + Math.abs(v).toFixed(d); };
  const kfmt = function (v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v)) + "K"; };
  function fmtDay(iso) { const d = F.dateObj(iso); return d.getDate() + " " + F.MONTHS[d.getMonth()]; }

  function lastN(monthly, field, n) {
    return Object.keys(monthly).sort().filter(function (k) { return monthly[k][field] !== undefined; }).slice(-n)
      .map(function (k) { return [k, monthly[k][field]]; });
  }

  function render(data) {
    const tiles = [];
    const ev = data.target.events, cur = data.target.current;

    // 1. Dulsaarka FED (2022 → maanta), xadka sare bil kasta
    const rate = [], now = new Date();
    for (let y = 2022; y <= now.getFullYear(); y++) {
      for (let m = 1; m <= 12; m++) {
        if (y === now.getFullYear() && m > now.getMonth() + 1) break;
        const iso = y + "-" + F.pad(m) + "-28", t = F.targetAt(ev, iso);
        if (t) rate.push(t.hi);
      }
    }
    if (cur) rate.push(cur.hi);
    const past = window.FED_CAL.meetings.filter(function (m) { return new Date(m.time).getTime() < Date.now(); });
    const lastM = past[past.length - 1];
    let rChg = "", rDir = 0;
    if (lastM) {
      const out = F.meetingOutcome(ev, lastM);
      rDir = out.action === "hike" ? 1 : out.action === "cut" ? -1 : 0;
      rChg = out.action === "hold" ? T("Hayn", "Hold") : (out.action === "hike" ? T("Kor ", "Hike ") : T("Dhimis ", "Cut ")) + (out.event ? F.fmtChange(out.event) : "");
    }
    tiles.push({ size: "big", group: "rate", href: "taariikhda.html", icon: "🏛", name: T("Dulsaarka FED", "Fed rate"), badge: "FOMC", gold: true,
      value: F.fmtRange(cur), change: lastM ? chg(rDir, rChg) : "",
      sub: (lastM ? F.fmtDate(lastM.date) + " · " : "") + T("2022 → maanta", "2022 → today"), chart: lineChart(rate, COL.teal, { step: true }) });

    // 2. CPI
    const L = data.latest || {};
    const cpi = lastN(data.monthly, "cpi", 24);
    if (L.cpi) tiles.push({ size: "big", group: "cpi", href: "fahanka-fed.html", icon: "🛒", name: T("Sicir-bararka (CPI)", "Inflation (CPI)"), badge: F.monthName(L.cpi.month),
      value: L.cpi.value.toFixed(1) + "%", change: L.cpi.prev != null ? chg(Math.sign(L.cpi.value - L.cpi.prev), sign(L.cpi.value - L.cpi.prev, 1)) : "",
      sub: (L.cpi.prev != null ? T("Hore: ", "Prev: ") + L.cpi.prev.toFixed(1) + "% · " : "") + T("Hadafka Fed: 2% (- - -)", "Fed target: 2% (- - -)"),
      chart: lineChart(cpi.map(function (r) { return r[1]; }), COL.amber, { target: 2 }) });

    // 3. Shaqo la'aanta
    const un = lastN(data.monthly, "un", 24);
    if (L.un) tiles.push({ size: "big", group: "jobs", href: "fahanka-fed.html", icon: "👷", name: T("Shaqo la'aanta", "Unemployment"), badge: F.monthName(L.un.month),
      value: L.un.value.toFixed(1) + "%", change: L.un.prev != null ? chg(Math.sign(L.un.value - L.un.prev), sign(L.un.value - L.un.prev, 1)) : "",
      sub: (L.un.prev != null ? T("Hore: ", "Prev: ") + L.un.prev.toFixed(1) + "% · " : "") + T("24 bilood", "24 months"),
      chart: lineChart(un.map(function (r) { return r[1]; }), COL.blue) });

    // 4. NFP
    const nfp = lastN(data.monthly, "nfp", 12);
    if (L.nfp) tiles.push({ size: "mid", group: "jobs", href: "fahanka-fed.html", icon: "💼", name: T("Shaqooyinka (NFP)", "Payrolls (NFP)"), badge: F.monthName(L.nfp.month),
      value: kfmt(L.nfp.value), change: L.nfp.prev != null ? chg(Math.sign(L.nfp.value - L.nfp.prev), T("vs ", "vs ") + kfmt(L.nfp.prev)) : "",
      sub: T("12 bilood", "12 months"), chart: barChart(nfp.map(function (r) { return r[1]; }), COL.teal) });

    // 5–6. Bonds
    const S = data.series || {};
    [["dgs10", T("Bond 10 sano", "10-year bond"), "📜"], ["dgs2", T("Bond 2 sano", "2-year bond"), "📄"]].forEach(function (b) {
      const l = L[b[0]];
      if (!l) return;
      const ser = (S[b[0]] || []).map(function (r) { return r[1]; });
      tiles.push({ size: "mid", group: "bonds", href: "index.html#crypto", icon: b[2], name: b[1], badge: fmtDay(l.date),
        value: l.value.toFixed(2) + "%", change: l.prev != null ? chg(Math.sign(l.value - l.prev), sign(l.value - l.prev, 2)) : "",
        sub: ser.length > 1 ? T("3 bilood", "3 months") : T("Maalin kasta", "Daily"), chart: lineChart(ser, COL.teal) });
    });

    root.innerHTML = '<div class="ft-grid big-row">' + tiles.filter(function (t) { return t.size === "big"; }).map(tile).join("") + "</div>" +
      '<div class="ft-grid mid-row">' + tiles.filter(function (t) { return t.size === "mid"; }).map(tile).join("") + "</div>" +
      '';
    renderNext();
    applyFilter(current);
  }

  // ---------- Xogta soo socota (countdown) ----------
  function renderNext() {
    const box = document.getElementById("ft-next");
    if (!box || !window.FED_CAL) return;
    const now = Date.now(), cal = window.FED_CAL;
    const items = cal.upcoming.map(function (x) { return { name: F.EN && x.name_en ? x.name_en : x.name, time: x.time }; });
    cal.meetings.forEach(function (m) { items.push({ name: "FOMC", time: m.time }); });
    const up = items.filter(function (x) { return new Date(x.time).getTime() > now; })
      .sort(function (a, b) { return new Date(a.time) - new Date(b.time); }).slice(0, 4);
    box.innerHTML = up.map(function (x) {
      const d = new Date(x.time), ms = d.getTime() - now, days = Math.floor(ms / 864e5), hrs = Math.floor((ms % 864e5) / 36e5);
      const left = days >= 1 ? days + T(" maalmood", days === 1 ? " day" : " days") : hrs + T(" saacadood", " hours");
      return '<div class="ftn"><div class="ftn-n">' + esc(x.name) + '</div><div class="ftn-d">' + esc(F.fmtDateTime(d)) + '</div><div class="ftn-c">⏱ ' + esc(left) + "</div></div>";
    }).join("") + '<a class="ftn more" href="#upcoming">' + T("Jadwalka<br>oo dhan →", "Full<br>schedule →") + "</a>";
  }

  // ---------- Tabs ----------
  let current = "all";
  function applyFilter(g) {
    current = g;
    root.querySelectorAll(".ft").forEach(function (el) { el.hidden = g !== "all" && el.dataset.g !== g; });
    root.querySelectorAll(".ft-grid").forEach(function (gr) { gr.hidden = !gr.querySelector(".ft:not([hidden])"); });
    document.querySelectorAll("#fed-tabs button").forEach(function (b) { b.classList.toggle("on", b.dataset.g === g); });
  }
  document.querySelectorAll("#fed-tabs button").forEach(function (b) { b.addEventListener("click", function () { applyFilter(b.dataset.g); }); });

  F.load().then(function (data) {
    if (data && data.monthly) render(data);
    else root.innerHTML = '<p class="muted">' + T("Xogta FRED lama heli karo hadda. Mar kale ayaa la isku dayi doonaa.", "FRED data is unavailable right now. Retrying shortly.") + "</p>";
  });
  setInterval(renderNext, 60000);
})();
