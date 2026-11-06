/* =========================================================
   Qalabka guud ee xogta FED (bogga hore + Taariikhda FED)
   ========================================================= */
(function () {
  "use strict";

  const MONTHS = ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Lul", "Og", "Seb", "Okt", "Nof", "Dis"];
  const MONTHS_LONG = ["Janaayo", "Febraayo", "Maarso", "Abriil", "Maajo", "Juun", "Luulyo", "Ogosto", "Sebtember", "Oktoobar", "Nofembar", "Desember"];
  const DAYS = ["Axad", "Isniin", "Talaado", "Arbaco", "Khamiis", "Jimco", "Sabti"];

  function pad(n) { return String(n).padStart(2, "0"); }
  function num(v, d) { return Number(v).toFixed(d == null ? 2 : d); }

  // Dulsaarka: {lo:3.75, hi:4} -> "3.75–4.00%", {lo:5.25, hi:5.25} -> "5.25%"
  function fmtRange(t) {
    if (!t) return "—";
    return t.lo === t.hi ? num(t.lo) + "%" : num(t.lo) + "–" + num(t.hi) + "%";
  }
  function fmtChange(ev) {
    const sameType = (ev.from.lo === ev.from.hi) === (ev.to.lo === ev.to.hi);
    if (!sameType) return "";
    const c = (ev.to.lo + ev.to.hi) / 2 - (ev.from.lo + ev.from.hi) / 2;
    return (c > 0 ? "+" : "−") + num(Math.abs(c)) + "%";
  }
  function dateObj(iso) { return new Date(iso.length === 10 ? iso + "T12:00:00" : iso); }
  function fmtDate(iso) { const d = dateObj(iso); return d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function fmtDateTime(d) { return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " · " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function monthName(ym, long) { const [y, m] = ym.split("-").map(Number); return (long ? MONTHS_LONG : MONTHS)[m - 1] + " " + y; }

  // Dulsaarka FED ee taariikh go'an
  function targetAt(events, iso) {
    let t = null;
    for (const ev of events) {
      if (ev.date <= iso) t = ev.to; else break;
    }
    return t;
  }

  // Go'aanka shir FOMC: isbeddel dulsaar oo dhacay 0–3 maalmood kadib shirka
  function meetingOutcome(events, meeting) {
    const start = meeting.date;
    const endD = new Date(dateObj(start).getTime() + 3 * 864e5).toISOString().slice(0, 10);
    const ev = events.find(function (e) { return e.date >= start && e.date <= endD; });
    if (ev) return { action: ev.kind, event: ev, to: ev.to };
    return { action: "hold", to: targetAt(events, endD) };
  }

  const ACTION = {
    hike: { text: "▲ Kor u qaadis", cls: "hawk", short: "▲ Kor" },
    cut: { text: "▼ Dhimis", cls: "dove", short: "▼ Dhimis" },
    hold: { text: "● Hayn", cls: "dove", short: "● Hayn" }
  };

  // Soo qaad xogta /api/fed (Vercel). Haddii la waayo -> null (boggu wuxuu isticmaalaa xog kayd ah)
  let cache = null;
  function load() {
    if (cache) return cache;
    if (location.protocol === "file:") return (cache = Promise.resolve(null));
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 20000);
    cache = fetch("/api/fed", { signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return j && j.target && j.target.current ? j : null; })
      .catch(function () { return null; })
      .finally(function () { clearTimeout(timer); });
    return cache;
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }

  window.FedCore = {
    MONTHS, MONTHS_LONG, DAYS, pad, num, fmtRange, fmtChange, fmtDate, fmtDateTime, monthName,
    dateObj, targetAt, meetingOutcome, ACTION, load, esc
  };
})();
