/* =========================================================
   Taariikhda FED — sannadaha → bilaha → faahfaahin
   Xogta: /api/fed (FRED) + jadwalka shirarka (data/fed.js)
   ========================================================= */
(function () {
  "use strict";
  const F = window.FedCore;
  const $ = function (id) { return document.getElementById(id); };
  const esc = F.esc;

  let API = null, EVENTS = [], MONTHLY = {}, MEETINGS = [];
  let selYear = null, selMonth = null, decade = "all";

  // ---------- Xisaabinta sannad kasta ----------
  function eventsIn(prefix) { return EVENTS.filter(function (e) { return e.dd.indexOf(prefix) === 0; }); }
  // Taariikhda la muujiyo: maalinta go'aanka (haddii shirku jadwalka ku jiro), haddii kale maalinta uu dhaqan galay
  function evDate(e) { return F.fmtDate(e.dd) + (!e.matched && e.dd >= "2009" ? " (dhaqan galka)" : ""); }
  function meetingsIn(prefix) { return MEETINGS.filter(function (m) { return m.date.indexOf(prefix) === 0; }); }

  function yearInfo(y) {
    const evs = eventsIn(String(y));
    const hikes = evs.filter(function (e) { return e.kind === "hike"; }).length;
    const cuts = evs.length - hikes;
    const months = [];
    for (let m = 1; m <= 12; m++) { const k = y + "-" + F.pad(m); if (MONTHLY[k]) months.push(k); }
    return { y: y, evs: evs, hikes: hikes, cuts: cuts, months: months, hasTarget: y >= 1983 || (y === 1982) };
  }

  function tileLabel(info) {
    if (info.y < 1982) {
      const ff = info.months.map(function (k) { return MONTHLY[k].ff; }).filter(function (v) { return v != null; });
      return ff.length ? "Dulsaar: " + ff[0].toFixed(1) + "% → " + ff[ff.length - 1].toFixed(1) + "%" : "—";
    }
    if (info.hikes && info.cuts) return "▲" + info.hikes + " ▼" + info.cuts;
    if (info.hikes) return "▲ " + info.hikes + " kor";
    if (info.cuts) return "▼ " + info.cuts + " dhimis";
    return "— isbeddel ma jirin";
  }
  function tileClass(info) {
    if (info.y < 1982) return "";
    if (info.hikes && info.cuts) return "mixed";
    if (info.hikes) return "hike";
    if (info.cuts) return "cut";
    return "";
  }

  // ---------- Sannadaha ----------
  function renderDecades(minY, maxY) {
    const list = [{ key: "all", label: "Dhammaan" }];
    for (let d = Math.floor(maxY / 10) * 10; d >= Math.floor(minY / 10) * 10; d -= 10) list.push({ key: String(d), label: d + "-yadii" });
    $("decades").innerHTML = list.map(function (d) {
      return '<button type="button" data-decade="' + d.key + '" aria-pressed="' + (d.key === decade) + '">' + d.label + "</button>";
    }).join("");
    $("decades").onclick = function (e) {
      const b = e.target.closest("button"); if (!b) return;
      decade = b.dataset.decade;
      renderDecades(minY, maxY);
      renderYears(minY, maxY);
    };
  }

  function renderYears(minY, maxY) {
    let html = "";
    for (let y = maxY; y >= minY; y--) {
      if (decade !== "all" && Math.floor(y / 10) * 10 !== Number(decade)) continue;
      const info = yearInfo(y);
      html += '<button type="button" class="year ' + tileClass(info) + '" data-year="' + y + '" aria-pressed="' + (y === selYear) + '">' +
        "<b>" + y + "</b><span>" + esc(tileLabel(info)) + "</span></button>";
    }
    $("years").innerHTML = html;
    $("years").onclick = function (e) {
      const b = e.target.closest("button"); if (!b) return;
      selectYear(Number(b.dataset.year), null, true);
    };
  }

  // ---------- Bil kasta ----------
  function monthState(y, m) {
    const ym = y + "-" + F.pad(m);
    const evs = eventsIn(ym);
    const mts = meetingsIn(ym);
    const now = Date.now();
    const row = MONTHLY[ym];
    if (evs.length) {
      const kind = evs.every(function (e) { return e.kind === "hike"; }) ? "hike" : evs.every(function (e) { return e.kind === "cut"; }) ? "cut" : "mixed";
      return { ym: ym, kind: kind, evs: evs, mts: mts, row: row };
    }
    const pastMeeting = mts.find(function (x) { return new Date(x.time).getTime() <= now; });
    if (pastMeeting) return { ym: ym, kind: "hold", evs: [], mts: mts, row: row };
    const futureMeeting = mts.find(function (x) { return new Date(x.time).getTime() > now; });
    if (futureMeeting) return { ym: ym, kind: "future", evs: [], mts: mts, row: row };
    if (row) return { ym: ym, kind: "none", evs: [], mts: mts, row: row };
    return { ym: ym, kind: "empty", evs: [], mts: mts, row: null };
  }

  function stateText(st) {
    if (st.kind === "hike" || st.kind === "cut" || st.kind === "mixed") {
      return st.evs.map(function (e) { const c = F.fmtChange(e); return (e.kind === "hike" ? "▲ Kor" : "▼ Dhimis") + (c ? " " + c : ""); }).join(" · ");
    }
    if (st.kind === "hold") return "● Hayn";
    if (st.kind === "future") return "Shir soo socda";
    if (st.kind === "none") return "Isbeddel ma jirin";
    return "Weli ma imaan";
  }

  function monthValue(y, m) {
    const endIso = y + "-" + F.pad(m) + "-31";
    if (y >= 1983 || (y === 1982 && m >= 10)) {
      const t = F.targetAt(EVENTS, endIso);
      if (t) return F.fmtRange(t);
    }
    const row = MONTHLY[y + "-" + F.pad(m)];
    return row && row.ff != null ? row.ff.toFixed(2) + "% (eff.)" : "";
  }

  function renderMonths(y) {
    let html = "";
    for (let m = 1; m <= 12; m++) {
      const st = monthState(y, m);
      const cls = st.kind === "hike" ? "hike" : st.kind === "cut" ? "cut" : st.kind === "empty" ? "empty" : "";
      let sub = "";
      if (st.evs.length) sub = st.evs.map(function (e) { return F.fmtDate(e.dd).replace(" " + y, ""); }).join(", ");
      else if (st.mts.length) sub = "Shir: " + F.fmtDate(st.mts[0].date).replace(" " + y, "");
      const color = st.kind === "hike" ? "var(--hawk)" : st.kind === "cut" ? "var(--dove)" : st.kind === "hold" ? "var(--dove)" : "var(--muted)";
      html += '<button type="button" class="month ' + cls + '" data-month="' + m + '" aria-pressed="' + (m === selMonth) + '"' + (st.kind === "empty" ? " disabled" : "") + ">" +
        "<b>" + F.MONTHS[m - 1] + "</b>" +
        (sub ? '<span class="m-sub">' + esc(sub) + "</span>" : "") +
        '<span class="chip" style="color:' + color + ';align-self:flex-start">' + esc(stateText(st)) + "</span>" +
        '<span class="m-val">' + esc(st.kind === "empty" ? "" : monthValue(y, m)) + "</span></button>";
    }
    $("yd-months").innerHTML = html;
    $("yd-months").onclick = function (e) {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      selectMonth(Number(b.dataset.month), true);
    };
  }

  // ---------- Soo koobid (qoraal diyaarsan, tirooyinku waa FRED) ----------
  function summary(y, m) {
    const st = monthState(y, m);
    const name = F.MONTHS_LONG[m - 1] + " " + y;
    const parts = [];
    if (st.evs.length) {
      st.evs.forEach(function (e) {
        const c = F.fmtChange(e);
        parts.push(evDate(e) + ": FED-ku dulsaarka " + (e.kind === "hike" ? "kor ayuu u qaaday" : "wuu dhimay") +
          (c ? " (" + c + ")" : "") + ", " + F.fmtRange(e.from) + " → " + F.fmtRange(e.to) + ".");
      });
    } else if (st.kind === "hold") {
      const mt = st.mts[0];
      parts.push(F.fmtDate(mt.date) + ": FED-ku wuxuu shir yeeshay, dulsaarkana wuu hayay (" + F.fmtRange(F.targetAt(EVENTS, mt.date)) + ")" + (mt.vote ? ", cod " + mt.vote : "") + ".");
    } else if (st.kind === "future") {
      parts.push("Shirka FOMC wuxuu dhici doonaa " + F.fmtDate(st.mts[0].date) + ". Go'aanka halkan ayuu si toos ah ugu soo bixi doonaa.");
    } else if (st.kind === "none") {
      parts.push("Dulsaarka FED isma beddelin bishan.");
    }
    const r = st.row || {};
    const facts = [];
    if (r.cpi != null) facts.push("sicir-bararka (CPI) sannadle: <b>" + r.cpi.toFixed(1) + "%</b>");
    if (r.un != null) facts.push("shaqo la'aanta: <b>" + r.un.toFixed(1) + "%</b>");
    if (r.nfp != null) facts.push("shaqooyinka: <b>" + (r.nfp >= 0 ? "+" : "−") + Math.abs(r.nfp).toLocaleString("en-US") + " kun</b>");
    if (r.ff != null) facts.push("dulsaarka dhabta ah (effective): <b>" + r.ff.toFixed(2) + "%</b>");
    let html = "<b>" + esc(name) + "</b>" + parts.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    if (facts.length) html += "<p>Xogta bishan: " + facts.join(" · ") + ".</p>";
    if (y < 1994) html += '<p class="small">Fiiro gaar ah: ka hor 1994, FED-ku go\'aannadiisa si rasmi ah uma shaacin jirin.</p>';
    if (!parts.length && !facts.length) html += "<p>Xogta bishan weli ma soo bixin.</p>";
    $("md-summary").innerHTML = html;
  }

  // ---------- Chart ----------
  function chart(y) {
    const W = 960, H = 300, L = 46, R = 16, T = 16, B = 34;
    const series = [
      { key: "ff", color: "var(--accent)" },
      { key: "cpi", color: "var(--hawk)" },
      { key: "un", color: "var(--up)" }
    ];
    const vals = [];
    for (let m = 1; m <= 12; m++) {
      const r = MONTHLY[y + "-" + F.pad(m)] || {};
      series.forEach(function (s) { if (r[s.key] != null) vals.push(r[s.key]); });
    }
    if (!vals.length) { $("yd-chart").innerHTML = '<p class="muted">Xog chart ma jirto.</p>'; return; }
    const min = Math.min(0, Math.floor(Math.min.apply(null, vals)));
    const max = Math.ceil(Math.max.apply(null, vals) + 0.5);
    const step = max - min > 12 ? 4 : max - min > 6 ? 2 : 1;
    const X = function (i) { return L + i * (W - L - R) / 11; };
    const Y = function (v) { return T + (max - v) * (H - T - B) / (max - min); };
    let svg = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Chart ' + y + ': dulsaarka FED, sicir-bararka iyo shaqo la\'aanta">';
    if (selMonth) svg += '<rect x="' + (X(selMonth - 1) - 26) + '" y="' + T + '" width="52" height="' + (H - T - B) + '" rx="6" fill="var(--accent)" opacity="0.10"></rect>';
    for (let v = Math.ceil(min / step) * step; v <= max; v += step) {
      svg += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="var(--line)"></line>' +
        '<text x="' + (L - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end" font-size="12" fill="var(--muted)" font-family="Inter">' + v + "%</text>";
    }
    for (let i = 0; i < 12; i++) svg += '<text x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="12" fill="var(--muted)" font-family="Inter">' + F.MONTHS[i] + "</text>";
    series.forEach(function (s) {
      let d = "", pen = false;
      for (let m = 1; m <= 12; m++) {
        const r = MONTHLY[y + "-" + F.pad(m)] || {};
        if (r[s.key] == null) { pen = false; continue; }
        d += (pen ? "L" : "M") + X(m - 1).toFixed(1) + " " + Y(r[s.key]).toFixed(1) + " ";
        pen = true;
      }
      if (d) svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"></path>';
    });
    // Calaamadaha go'aannada
    for (let m = 1; m <= 12; m++) {
      const evs = eventsIn(y + "-" + F.pad(m));
      const r = MONTHLY[y + "-" + F.pad(m)] || {};
      if (!evs.length || r.ff == null) continue;
      const up = evs[evs.length - 1].kind === "hike";
      const cx = X(m - 1), cy = Y(r.ff);
      svg += '<path d="' + (up ? "M" + (cx - 7) + " " + (cy - 8) + " L" + (cx + 7) + " " + (cy - 8) + " L" + cx + " " + (cy - 20) + " Z"
        : "M" + (cx - 7) + " " + (cy + 8) + " L" + (cx + 7) + " " + (cy + 8) + " L" + cx + " " + (cy + 20) + " Z") +
        '" fill="' + (up ? "var(--hawk)" : "var(--dove)") + '"></path>';
    }
    svg += "</svg>";
    $("yd-chart").innerHTML = svg;
  }

  // ---------- Shaxda ----------
  function table(y) {
    let html = "";
    for (let m = 1; m <= 12; m++) {
      const st = monthState(y, m);
      if (st.kind === "empty") continue;
      const r = st.row || {};
      const color = st.kind === "hike" ? "var(--hawk)" : st.kind === "cut" ? "var(--dove)" : "var(--text-2)";
      html += "<tr" + (m === selMonth ? ' style="background:var(--card-2)"' : "") + "><td><b>" + F.MONTHS[m - 1] + " " + y + "</b></td>" +
        '<td style="color:' + color + ';font-weight:600">' + esc(stateText(st)) + "</td>" +
        '<td class="r mono">' + (r.ff != null ? r.ff.toFixed(2) + "%" : "—") + "</td>" +
        '<td class="r mono">' + (r.cpi != null ? r.cpi.toFixed(1) + "%" : "—") + "</td>" +
        '<td class="r mono">' + (r.un != null ? r.un.toFixed(1) + "%" : "—") + "</td>" +
        '<td class="r mono">' + (r.nfp != null ? (r.nfp >= 0 ? "+" : "−") + Math.abs(r.nfp).toLocaleString("en-US") + "K" : "—") + "</td></tr>";
    }
    document.querySelector("#yd-table tbody").innerHTML = html;
  }

  // ---------- Doorashada ----------
  function stats(y) {
    const info = yearInfo(y);
    const prevIso = (y - 1) + "-12-31", endIso = y + "-12-31";
    let start = "—", end = "—";
    if (y >= 1983) {
      start = F.fmtRange(F.targetAt(EVENTS, prevIso));
      end = F.fmtRange(F.targetAt(EVENTS, endIso));
    } else {
      const ff = info.months.map(function (k) { return MONTHLY[k].ff; }).filter(function (v) { return v != null; });
      if (ff.length) { start = ff[0].toFixed(2) + "% (eff.)"; end = ff[ff.length - 1].toFixed(2) + "% (eff.)"; }
    }
    const items = [["Bilowgii sannadka", start], ["Dhammaadka" + (y === new Date().getFullYear() ? " (hadda)" : ""), end]];
    if (y >= 1982) { items.push(["Kor u qaadis", String(info.hikes)]); items.push(["Dhimis", String(info.cuts)]); }
    const mts = meetingsIn(String(y));
    if (mts.length) items.push(["Shirarka FOMC", String(mts.length)]);
    $("yd-stats").innerHTML = items.map(function (it) { return "<div><span>" + esc(it[0]) + "</span><b>" + esc(it[1]) + "</b></div>"; }).join("");
    const title = y >= 1982
      ? y + " · " + (info.hikes || info.cuts ? [info.hikes ? info.hikes + " kor u qaadis" : "", info.cuts ? info.cuts + " dhimis" : ""].filter(Boolean).join(", ") : "isbeddel ma jirin")
      : y + " · dulsaarka suuqa";
    $("yd-title").textContent = title;
  }

  function defaultMonth(y) {
    for (let m = 12; m >= 1; m--) { const st = monthState(y, m); if (st.evs.length) return m; }
    for (let m = 12; m >= 1; m--) { const st = monthState(y, m); if (st.kind !== "empty" && st.kind !== "future") return m; }
    return 1;
  }

  function setHash() {
    const h = "#" + selYear + (selMonth ? "-" + F.pad(selMonth) : "");
    try { history.replaceState(null, "", h); } catch (e) {}
  }

  function selectYear(y, m, scroll) {
    selYear = y;
    selMonth = m || defaultMonth(y);
    document.querySelectorAll(".year").forEach(function (b) { b.setAttribute("aria-pressed", String(Number(b.dataset.year) === y)); });
    stats(y);
    renderMonths(y);
    summary(y, selMonth);
    chart(y);
    table(y);
    setHash();
    if (scroll) $("year-detail").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectMonth(m) {
    selMonth = m;
    document.querySelectorAll(".month").forEach(function (b) { b.setAttribute("aria-pressed", String(Number(b.dataset.month) === m)); });
    summary(selYear, m);
    chart(selYear);
    table(selYear);
    setHash();
  }

  function fromHash(minY, maxY) {
    const m = /^#(\d{4})(?:-(\d{2}))?$/.exec(location.hash || "");
    if (!m) return null;
    const y = Number(m[1]);
    if (y < minY || y > maxY) return null;
    return { y: y, m: m[2] ? Math.min(12, Math.max(1, Number(m[2]))) : null };
  }

  // ---------- Bilow ----------
  document.addEventListener("DOMContentLoaded", function () {
    F.load().then(function (api) {
      $("loading").hidden = true;
      if (!api) { $("offline").hidden = false; return; }
      API = api;
      MONTHLY = api.monthly;
      MEETINGS = window.FED_CAL.meetings;
      EVENTS = api.target.events.map(function (e) {
        const eff = F.dateObj(e.date).getTime();
        const mt = MEETINGS.find(function (m) { const md = F.dateObj(m.date).getTime(); return md <= eff && eff - md <= 3 * 864e5; });
        return Object.assign({}, e, { dd: mt ? mt.date : e.date, matched: !!mt });
      });
      const keys = Object.keys(MONTHLY).sort();
      const minY = Math.max(1954, Number(keys[0].slice(0, 4)));
      const maxY = Math.max(Number(keys[keys.length - 1].slice(0, 4)), new Date().getFullYear());
      $("app").hidden = false;
      const t = new Date(api.updated);
      $("updated").textContent = "La soo qaaday: " + F.fmtDate(t.toISOString().slice(0, 10)) + " " + F.pad(t.getHours()) + ":" + F.pad(t.getMinutes()) + ".";
      const h = fromHash(minY, maxY);
      selYear = h ? h.y : maxY;
      // Taleefanka: marka hore muuji tobanaanka sannadka la doortay si liisku u gaabto
      if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) decade = String(Math.floor(selYear / 10) * 10);
      renderDecades(minY, maxY);
      renderYears(minY, maxY);
      selectYear(selYear, h ? h.m : null, false);
      window.addEventListener("hashchange", function () {
        const hh = fromHash(minY, maxY);
        if (hh && (hh.y !== selYear || hh.m !== selMonth)) selectYear(hh.y, hh.m, true);
      });
    });
  });
})();
