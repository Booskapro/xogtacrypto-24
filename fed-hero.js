/* =========================================================
   FED-KA MAANTA — naqshadda cusub (bannar + kaararka + timeline)
   Xogta: /api/fed (FRED) + fed-data.js (jadwalka FOMC, BLS)
   Haddii /api/fed la waayo: FED_CAL.fallback ayaa la isticmaalaa.
   ========================================================= */
(function () {
  "use strict";
  const box = document.getElementById("fed-hero");
  if (!box || !window.FedCore || !window.FED_CAL) return;
  const F = window.FedCore, T = F.T, esc = F.esc, CAL = window.FED_CAL;
  const $ = function (id) { return document.getElementById(id); };
  const COL = { cut: "#5B9DFF", hold: "#7C8A99", hike: "#F2A93B" };
  const SYM = { cut: "▼", hold: "●", hike: "▲" };
  const now = function () { return Date.now(); };

  const pastMeetings = function () { return CAL.meetings.filter(function (m) { return new Date(m.time).getTime() <= now(); }); };
  const nextMeeting = function () { return CAL.meetings.find(function (m) { return new Date(m.time).getTime() > now(); }); };
  const shortDate = function (iso, withYear) {
    const d = F.dateObj(iso);
    return d.getDate() + " " + F.MONTHS[d.getMonth()] + (withYear ? " " + String(d.getFullYear()).slice(2) : "");
  };
  const statementUrl = function (iso) { return "https://www.federalreserve.gov/newsevents/pressreleases/monetary" + iso.replace(/-/g, "") + "a.htm"; };

  // ---------- 1. Bannarka: dulsaarka + 10-kii go'aan + countdown ----------
  function renderHero(api) {
    const past = pastMeetings(), last = past[past.length - 1], next = nextMeeting();
    let range, lastAct = "hold", decisions = [];
    if (api) {
      const ev = api.target.events;
      range = F.fmtRange(api.target.current);
      if (last) lastAct = F.meetingOutcome(ev, last).action;
      decisions = past.slice(-10).map(function (m) {
        const o = F.meetingOutcome(ev, m);
        return { date: m.date, act: o.action, hi: o.to ? o.to.hi : null };
      });
    } else {
      const fb = CAL.fallback;
      range = fb.current_range;
      lastAct = fb.last.action;
    }
    $("fh-rate").textContent = range;
    const a = F.ACTION[lastAct];
    $("fh-last").innerHTML = T("Go'aankii u dambeeyay: ", "Latest decision: ") + '<b class="fh-act ' + lastAct + '">' + esc(a.text) + "</b>" +
      (last ? "<br>" + esc(F.fmtDate(last.date)) + (last.vote ? T(" · cod ", " · vote ") + esc(last.vote) : "") : "");
    if (last) { const s = $("fh-statement"); s.href = statementUrl(last.date); s.hidden = false; }

    // tiirarka go'aannada
    const rib = $("fh-ribbon");
    if (decisions.length) {
      const his = decisions.map(function (d) { return d.hi; }).filter(function (v) { return v != null; });
      const lo = Math.min.apply(null, his) - 0.5, hi = Math.max.apply(null, his);
      rib.innerHTML = decisions.map(function (d) {
        const h = d.hi == null ? 0.2 : 0.22 + ((d.hi - lo) / (hi - lo || 1)) * 0.78;
        return '<div class="rb" title="' + esc(F.fmtDate(d.date) + " · " + F.ACTION[d.act].text + (d.hi != null ? " · " + d.hi.toFixed(2) + "%" : "")) + '">' +
          '<div class="rb-bar" style="height:calc(var(--rbh) * ' + h.toFixed(3) + ");background:" + COL[d.act] + '"></div>' +
          '<b style="color:' + COL[d.act] + '">' + SYM[d.act] + "</b><span>" + esc(shortDate(d.date, F.dateObj(d.date).getFullYear() !== new Date().getFullYear())) + "</span></div>";
      }).join("") + (next ? '<div class="rb nx"><div class="rb-bar q" style="height:calc(var(--rbh) * .6)"></div><b>?</b><span>' + esc(shortDate(next.date)) + "</span></div>" : "");
      $("fh-ribwrap").hidden = false;
    } else $("fh-ribwrap").hidden = true;

    // countdown goobaabin
    if (next) {
      const t = new Date(next.time);
      $("fh-next").textContent = F.fmtDateTime(t);
      $("fh-sep").hidden = !next.sep;
      startRing(last ? new Date(last.time) : null, t);
    }
  }

  let ringTimer = null;
  function startRing(from, to) {
    const R = 54, C = 2 * Math.PI * R;
    const arc = $("fh-arc"), days = $("fh-days"), hms = $("fh-hms");
    arc.setAttribute("stroke-dasharray", "0 " + C);
    function tick() {
      let ms = to.getTime() - now();
      if (ms <= 0) {
        days.textContent = "0"; hms.textContent = T("Go'aanka waa la shaaciyay", "Decision is out");
        clearInterval(ringTimer); setTimeout(function () { location.reload(); }, 15 * 60 * 1000); return;
      }
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      const s = Math.floor(ms / 1e3);
      days.textContent = d;
      hms.textContent = F.pad(h) + ":" + F.pad(m) + ":" + F.pad(s);
      if (from) {
        const p = Math.min(1, Math.max(0.02, (now() - from.getTime()) / (to.getTime() - from.getTime())));
        arc.setAttribute("stroke-dasharray", (C * p).toFixed(1) + " " + C.toFixed(1));
      }
    }
    tick(); clearInterval(ringTimer); ringTimer = setInterval(tick, 1000);
  }

  // ---------- 2. Kaararka xogta ----------
  function spark(vals, col) {
    if (!vals || vals.length < 2) return "";
    const W = 200, H = 46, lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), r = hi - lo || 1;
    const pts = vals.map(function (v, i) { return [(i / (vals.length - 1)) * W, H - 5 - ((v - lo) / r) * (H - 10)]; });
    const d = "M" + pts.map(function (p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" L");
    return '<svg class="k-sp" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="' + d + " L" + W + " " + H + " L0 " + H + 'Z" fill="' + col + '" opacity=".12"/>' +
      '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  }
  function kcard(o) {
    const dir = o.diff == null || Math.abs(o.diff) < 1e-9 ? "flat" : o.diff > 0 ? "up" : "down";
    const chg = o.diff == null ? "" : '<em class="' + dir + '">' + (dir === "up" ? "▲ " : dir === "down" ? "▼ " : "● ") + esc(o.diffText) + "</em>";
    return '<div class="k"><div class="k-t">' + esc(o.name) + '</div><div class="k-v"><span class="fnum">' + esc(o.value) + "</span>" + chg + "</div>" +
      '<div class="k-p">' + esc(o.sub) + ' · <a href="' + o.url + '" target="_blank" rel="noopener">' + esc(o.src) + "</a></div>" + spark(o.series, o.col) + "</div>";
  }
  function renderCards(api) {
    const out = [];
    const fred = function (id) { return "https://fred.stlouisfed.org/series/" + id; };
    const abs = function (v, d) { return Math.abs(v) < 1e-9 ? T("Isku mid", "Unchanged") : Math.abs(v).toFixed(d); };
    const k = function (v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(Math.round(v)) + "K"; };
    if (api) {
      const L = api.latest, M = api.monthly, S = api.series || {};
      const last = function (f, n) { return Object.keys(M).sort().filter(function (x) { return M[x][f] !== undefined; }).slice(-n).map(function (x) { return M[x][f]; }); };
      if (L.cpi) out.push({ name: T("Sicir-bararka (CPI)", "Inflation (CPI)"), value: L.cpi.value.toFixed(1) + "%", diff: L.cpi.prev != null ? L.cpi.value - L.cpi.prev : null, diffText: L.cpi.prev != null ? abs(L.cpi.value - L.cpi.prev, 1) : "",
        sub: T("Hore: ", "Prev: ") + (L.cpi.prev != null ? L.cpi.prev.toFixed(1) + "%" : "—") + " · " + F.monthName(L.cpi.month), src: "BLS", url: fred("CPIAUCNS"), series: last("cpi", 12), col: "#F2A93B" });
      if (L.un) out.push({ name: T("Shaqo la'aanta", "Unemployment"), value: L.un.value.toFixed(1) + "%", diff: L.un.prev != null ? L.un.value - L.un.prev : null, diffText: L.un.prev != null ? abs(L.un.value - L.un.prev, 1) : "",
        sub: T("Hore: ", "Prev: ") + (L.un.prev != null ? L.un.prev.toFixed(1) + "%" : "—") + " · " + F.monthName(L.un.month), src: "BLS", url: fred("UNRATE"), series: last("un", 12), col: "#5B9DFF" });
      if (L.nfp) out.push({ name: T("Shaqooyinka (NFP)", "Payrolls (NFP)"), value: k(L.nfp.value), diff: L.nfp.prev != null ? L.nfp.value - L.nfp.prev : null, diffText: L.nfp.prev != null ? Math.abs(Math.round(L.nfp.value - L.nfp.prev)) + "K" : "",
        sub: T("Hore: ", "Prev: ") + (L.nfp.prev != null ? k(L.nfp.prev) : "—") + " · " + F.monthName(L.nfp.month), src: "BLS", url: fred("PAYEMS"), series: last("nfp", 12), col: "#1FBF86" });
      [["dgs10", T("Bond 10 sano", "10-year bond"), "DGS10"], ["dgs2", T("Bond 2 sano", "2-year bond"), "DGS2"]].forEach(function (b) {
        const l = L[b[0]]; if (!l) return;
        out.push({ name: b[1], value: l.value.toFixed(2) + "%", diff: l.prev != null ? l.value - l.prev : null, diffText: l.prev != null ? abs(l.value - l.prev, 2) : "",
          sub: T("Hore: ", "Prev: ") + (l.prev != null ? l.prev.toFixed(2) + "%" : "—") + " · " + shortDate(l.date), src: "Treasury", url: fred(b[2]),
          series: (S[b[0]] || []).map(function (r) { return r[1]; }), col: "#1FBF86" });
      });
    } else {
      CAL.fallback.latest.forEach(function (x) {
        out.push({ name: F.EN && x.name_en ? x.name_en : x.name, value: x.value, diff: null, sub: F.EN && x.detail_en ? x.detail_en : x.detail, src: x.source, url: x.url, series: null });
      });
    }
    $("fh-cards").innerHTML = out.map(kcard).join("") || '<p class="muted">' + T("Xogta lama heli karo hadda.", "Data is not available right now.") + "</p>";
    const t = api ? new Date(api.updated) : null;
    $("fed-updated").textContent = api
      ? T("Xogta FED-ka: toos ah · la soo qaaday ", "Fed data: live · fetched ") + F.pad(t.getHours()) + ":" + F.pad(t.getMinutes()) + T(" · Isha: ", " · Source: ") + "FRED (Federal Reserve Bank of St. Louis), BLS, U.S. Treasury"
      : T("Xog kayd ah oo la hubiyay ", "Backup data checked ") + F.fmtDate(CAL.fallback.checked);
  }

  // ---------- 3. Timeline: xogta soo socota ----------
  function renderTimeline() {
    const items = CAL.upcoming.map(function (x) { return { name: F.EN && x.name_en ? x.name_en : x.name, time: x.time, fomc: false }; });
    CAL.meetings.forEach(function (m) { items.push({ name: T("Go'aanka FED (FOMC)", "Fed decision (FOMC)") + (m.sep ? T(" + saadaasha", " + projections") : ""), time: m.time, fomc: true }); });
    const up = items.filter(function (x) { return new Date(x.time).getTime() > now(); })
      .sort(function (a, b) { return new Date(a.time) - new Date(b.time); }).slice(0, 5);
    const tl = $("fh-timeline");
    if (!up.length) { tl.innerHTML = '<p class="muted">' + T("Jadwalka cusub waa la cusbooneysiinayaa.", "The new schedule is being updated.") + "</p>"; return; }
    tl.innerHTML = '<div class="tl-line"></div><span class="tl-now">' + T("MAANTA", "TODAY") + "</span>" + up.map(function (x, i) {
      const d = new Date(x.time), ms = d.getTime() - now(), days = Math.floor(ms / 864e5), hrs = Math.floor(ms / 36e5);
      const left = days >= 1 ? days + T(" maalmood", days === 1 ? " day" : " days") : hrs + T(" saacadood", " hours");
      const pos = up.length === 1 ? 50 : 8 + (i / (up.length - 1)) * 86;
      const cls = "tl-ev " + (i % 2 ? "t-dn" : "t-up") + (x.fomc ? " fomc" : "");
      return '<div class="' + cls + '" style="--x:' + pos.toFixed(2) + '%"><i></i><div class="tl-c">' +
        '<b class="tl-d">' + esc(d.getDate() + " " + F.MONTHS[d.getMonth()]) + "</b>" +
        '<span class="tl-n">' + esc(x.name) + "</span>" +
        '<em class="tl-m">' + esc(F.DAYS[d.getDay()] + " " + F.pad(d.getHours()) + ":" + F.pad(d.getMinutes())) + " · <strong>" + esc(left) + "</strong></em></div></div>";
    }).join("");
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) $("fh-tz").textContent = T("Saacaddaada: ", "Your time: ") + tz.split("/").pop().replace(/_/g, " ");
    } catch (e) {}
  }

  renderTimeline();
  setInterval(renderTimeline, 60000);
  renderHero(null);
  F.load().then(function (api) { renderHero(api); renderCards(api); });
})();
