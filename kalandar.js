/* =========================================================
   KALANDARKA DHAQAALAHA — bog gooni ah
   Xogta: fed-data.js (taariikhaha rasmiga ah: BLS, BEA, Census, Fed, ISM)
   ========================================================= */
(function () {
  "use strict";
  if (!window.FedCore || !window.FED_CAL) return;
  const F = window.FedCore, T = F.T, esc = F.esc, CAL = window.FED_CAL;
  const $ = function (id) { return document.getElementById(id); };
  const now = function () { return Date.now(); };
  const KIND = { infl: T("Sicir-barar", "Inflation"), jobs: T("Shaqo", "Jobs"), growth: T("Koboc", "Growth"), fed: "FED" };
  const KCOL = { infl: "#F2A93B", jobs: "#5B9DFF", growth: "#1FBF86", fed: "#D97706" };

  function allEvents() {
    const items = CAL.upcoming.map(function (x) {
      return { name: F.EN && x.name_en ? x.name_en : x.name, time: x.time, kind: x.kind || "infl", lvl: x.lvl || 2, src: x.src || "", url: x.url || "", fomc: false };
    });
    CAL.meetings.forEach(function (m) {
      items.push({ name: T("Go'aanka FED (FOMC)", "Fed decision (FOMC)") + (m.sep ? T(" + saadaasha", " + projections") : ""), time: m.time, kind: "fed", lvl: 3,
        src: "Federal Reserve", url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm", fomc: true });
    });
    return items.sort(function (a, b) { return new Date(a.time) - new Date(b.time); });
  }
  function leftText(ms) {
    const days = Math.floor(ms / 864e5), hrs = Math.floor(ms / 36e5), mins = Math.max(1, Math.floor(ms / 6e4));
    if (days >= 1) return days + T(" maalmood", days === 1 ? " day" : " days");
    if (hrs >= 1) return hrs + T(" saacadood", " h");
    return mins + T(" daqiiqo", " min");
  }
  function dayKey(d) { return d.getFullYear() + "-" + F.pad(d.getMonth() + 1) + "-" + F.pad(d.getDate()); }
  function weekEnd() { const d = new Date(); d.setHours(23, 59, 59, 0); d.setDate(d.getDate() + 6); return d.getTime(); }

  // ---------- 1. Bannarka: xogta xigta ee aad u muhiimka ah ----------
  let heroTimer = null;
  function renderHero() {
    const nx = allEvents().find(function (x) { return x.lvl >= 3 && new Date(x.time).getTime() > now(); });
    if (!nx) return;
    const t = new Date(nx.time);
    $("kh-name").textContent = nx.name;
    $("kh-when").textContent = F.fmtDateTime(t);
    $("kh-kind").textContent = KIND[nx.kind];
    $("kh-kind").style.background = KCOL[nx.kind];
    const src = $("kh-src");
    if (nx.url) { src.href = nx.url; src.textContent = T("Isha: ", "Source: ") + nx.src + " ↗"; src.hidden = false; }
    clearInterval(heroTimer);
    function tick() {
      let ms = t.getTime() - now();
      if (ms <= 0) { clearInterval(heroTimer); renderAll(); return; }
      const d = Math.floor(ms / 864e5); ms -= d * 864e5;
      const h = Math.floor(ms / 36e5); ms -= h * 36e5;
      const m = Math.floor(ms / 6e4); ms -= m * 6e4;
      const s = Math.floor(ms / 1e3);
      $("kh-cd").innerHTML = [[d, T("maalmood", "days")], [F.pad(h), T("saacadood", "hours")], [F.pad(m), T("daqiiqo", "min")], [F.pad(s), T("ilbiriqsi", "sec")]]
        .map(function (p) { return '<div><b class="fnum">' + p[0] + "</b><span>" + p[1] + "</span></div>"; }).join("");
    }
    tick(); heroTimer = setInterval(tick, 1000);
  }

  // ---------- 2. Tirooyinka + toddobaadka ----------
  function renderStats() {
    const ev = allEvents().filter(function (x) { return new Date(x.time).getTime() > now(); });
    const wk = ev.filter(function (x) { return new Date(x.time).getTime() <= weekEnd(); });
    const mo = ev.filter(function (x) { return new Date(x.time).getTime() <= now() + 31 * 864e5; });
    const fomc = ev.find(function (x) { return x.fomc; });
    $("ks-week").textContent = wk.length;
    $("ks-top").textContent = mo.filter(function (x) { return x.lvl >= 3; }).length;
    $("ks-month").textContent = mo.length;
    if (fomc) { const d = new Date(fomc.time); $("ks-fomc").textContent = d.getDate() + " " + F.MONTHS[d.getMonth()]; }
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) $("ks-tz").textContent = tz.split("/").pop().replace(/_/g, " ");
    } catch (e) {}

    renderWeek();
  }

  // 7 maalmood (fallaadhaha ‹ › ayaa toddobaad toddobaad u dhaqaajiya)
  let kwOff = 0; // maalmo laga bilaabo maanta (0, 7, 14 …)
  const KW_MIN = -28;
  function kwMax() {
    const last = allEvents().reduce(function (m, x) { return Math.max(m, new Date(x.time).getTime()); }, now());
    return Math.max(0, Math.floor((last - now()) / 864e5 / 7) * 7);
  }
  function renderWeek() {
    const strip = $("k-week");
    const all = allEvents();
    const start = new Date(); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() + kwOff);
    const end = new Date(start); end.setDate(end.getDate() + 6);
    const todayK = dayKey(new Date());
    let html = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = dayKey(d), isToday = k === todayK, past = d.getTime() < new Date().setHours(0, 0, 0, 0);
      const items = all.filter(function (x) { return dayKey(new Date(x.time)) === k; });
      const top = items.reduce(function (m, x) { return Math.max(m, x.lvl); }, 0);
      html += '<button type="button" class="kw-day' + (isToday ? " today" : "") + (past ? " past" : "") + (items.length ? "" : " empty") + (top >= 3 ? " hot" : "") + (st.day === k ? " on" : "") + '" data-day="' + k + '">' +
        "<span>" + (isToday ? T("Maanta", "Today") : esc(F.DAYS[d.getDay()])) + '</span><b class="fnum">' + d.getDate() + '</b><em class="kw-mo">' + esc(F.MONTHS[d.getMonth()]) + "</em>" +
        '<em class="kw-dots">' + items.slice(0, 5).map(function (x) { return '<i style="background:' + KCOL[x.kind] + '"></i>'; }).join("") + "</em>" +
        "<small>" + (items.length ? items.length + T(" xog", items.length === 1 ? " release" : " releases") : T("Xog ma jirto", "No data")) + "</small></button>";
    }
    strip.innerHTML = html;
    const same = start.getMonth() === end.getMonth();
    const range = start.getDate() + (same ? "" : " " + F.MONTHS[start.getMonth()]) + " – " + end.getDate() + " " + F.MONTHS[end.getMonth()] + " " + end.getFullYear();
    $("kw-title").textContent = kwOff === 0 ? T("7-da maalmood ee soo socda", "Next 7 days") + " · " + range : range;
    $("kw-prev").disabled = kwOff <= KW_MIN;
    $("kw-next").disabled = kwOff >= kwMax();
    $("kw-today").hidden = kwOff === 0;
    strip.querySelectorAll(".kw-day").forEach(function (b) {
      b.addEventListener("click", function () {
        st.day = st.day === b.dataset.day ? null : b.dataset.day;
        strip.querySelectorAll(".kw-day").forEach(function (o) { o.classList.toggle("on", o.dataset.day === st.day); });
        renderCalendar();
        if (st.day) $("cal-anchor").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }
  function moveWeek(delta) {
    kwOff = delta === 0 ? 0 : Math.min(kwMax(), Math.max(KW_MIN, kwOff + delta));
    const strip = $("k-week");
    strip.classList.remove("slide-l", "slide-r"); void strip.offsetWidth;
    strip.classList.add(delta < 0 ? "slide-r" : "slide-l");
    renderWeek();
  }
  $("kw-prev").addEventListener("click", function () { moveWeek(-7); });
  $("kw-next").addEventListener("click", function () { moveWeek(7); });
  $("kw-today").addEventListener("click", function () { moveWeek(0); });
  // telefoonka: farta ku jiid bidix/midig
  (function swipe() {
    const el = $("k-week"); let x0 = null;
    el.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", function (e) {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 70 && el.scrollWidth <= el.clientWidth + 4) moveWeek(dx < 0 ? 7 : -7);
    }, { passive: true });
  })();

  // ---------- 3. Kalandarka + shaandhaynta dhinaca ----------
  const st = { q: "", when: "month", day: null, lvl: { 1: true, 2: true, 3: true }, kind: { infl: true, jobs: true, growth: true, fed: true } };
  function horizon() {
    if (st.when === "all" || st.day) return Infinity;
    if (st.when === "week") return weekEnd();
    return now() + 31 * 864e5;
  }
  function renderCalendar() {
    const box = $("fh-cal");
    const t0 = new Date(); t0.setHours(0, 0, 0, 0);
    const H = horizon(), q = st.q.trim().toLowerCase();
    const inRange = allEvents().filter(function (x) {
      const t = new Date(x.time).getTime();
      if (st.day) return dayKey(new Date(x.time)) === st.day;
      return t >= t0.getTime() && t <= H;
    });
    const matchQ = function (x) { return !q || (x.name + " " + x.src).toLowerCase().indexOf(q) !== -1; };
    [1, 2, 3].forEach(function (l) { $("cnt-l" + l).textContent = inRange.filter(function (x) { return x.lvl === l && st.kind[x.kind] && matchQ(x); }).length; });
    Object.keys(st.kind).forEach(function (k) { $("cnt-" + k).textContent = inRange.filter(function (x) { return x.kind === k && st.lvl[x.lvl] && matchQ(x); }).length; });
    const ev = inRange.filter(function (x) { return st.lvl[x.lvl] && st.kind[x.kind] && matchQ(x); });
    const today = dayKey(new Date()), tmr = dayKey(new Date(now() + 864e5));
    let html = "", cur = "";
    ev.forEach(function (x) {
      const d = new Date(x.time), k = dayKey(d), ms = d.getTime() - now();
      if (k !== cur) {
        cur = k;
        const lbl = k === today ? T("Maanta", "Today") : k === tmr ? T("Berri", "Tomorrow") : "";
        html += '<div class="cal-day"><b>' + esc(F.DAYS[d.getDay()] + " " + d.getDate() + " " + F.MONTHS[d.getMonth()] + " " + d.getFullYear()) + "</b>" + (lbl ? '<span class="cal-tag">' + lbl + "</span>" : "") + "</div>";
      }
      const dots = '<span class="cal-dots">' + [1, 2, 3].map(function (n) { return "<i" + (n <= x.lvl ? ' class="on"' : "") + "></i>"; }).join("") + "</span>";
      html += '<div class="cal-row lvl' + x.lvl + " k-" + x.kind + '">' +
        '<span class="cal-time fnum">' + F.pad(d.getHours()) + ":" + F.pad(d.getMinutes()) + "</span>" +
        '<span class="cal-name"><b>' + esc(x.name) + "</b><em>" + esc(KIND[x.kind] || "") + (x.src ? " · " + (x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.src) + "</a>" : esc(x.src)) : "") + "</em></span>" +
        dots + '<span class="cal-left">' + (ms > 0 ? esc(leftText(ms)) : '<span class="muted">' + T("Waa soo baxday", "Released") + "</span>") + "</span></div>";
    });
    box.innerHTML = html || '<div class="cal-empty"><b>' + T("Wax xog ah lama helin", "No releases found") + "</b><span>" + T("Beddel shaandhaynta ama riix “Dib u celi”.", "Change the filters or press “Reset”.") + "</span></div>";
    let range;
    if (st.day) { const d = new Date(st.day + "T12:00:00"); range = F.DAYS[d.getDay()] + " " + d.getDate() + " " + F.MONTHS[d.getMonth()]; }
    else range = st.when === "week" ? T("7-da maalmood ee soo socda", "next 7 days") : st.when === "month" ? T("30-ka maalmood ee soo socda", "next 30 days") : T("jadwalka oo dhan", "full schedule");
    $("cal-sum").innerHTML = "<b>" + ev.length + "</b>" + esc(T(" xog", ev.length === 1 ? " release" : " releases")) + " · " + esc(range) +
      (st.day ? ' <button type="button" class="cal-clear" id="cal-clearday">' + T("× Ka saar maalinta", "× Clear day") + "</button>" : "");
    const cd = $("cal-clearday");
    if (cd) cd.addEventListener("click", function () { st.day = null; document.querySelectorAll(".kw-day").forEach(function (o) { o.classList.remove("on"); }); renderCalendar(); });
    const off = (st.q ? 1 : 0) + (st.when !== "month" ? 1 : 0) + (st.day ? 1 : 0) + [1, 2, 3].filter(function (l) { return !st.lvl[l]; }).length + Object.keys(st.kind).filter(function (k) { return !st.kind[k]; }).length;
    $("cal-fcount").textContent = off ? off : "";
  }
  (function wire() {
    const side = $("cal-side"), q = $("cal-q");
    if (F.EN && q.dataset.enPh) q.placeholder = q.dataset.enPh;
    q.addEventListener("input", function () { st.q = q.value; renderCalendar(); });
    side.querySelectorAll("#cal-when button").forEach(function (b) {
      b.addEventListener("click", function () {
        st.when = b.dataset.w; st.day = null;
        document.querySelectorAll(".kw-day").forEach(function (o) { o.classList.remove("on"); });
        side.querySelectorAll("#cal-when button").forEach(function (o) { o.classList.toggle("on", o === b); });
        renderCalendar();
      });
    });
    side.querySelectorAll("input[data-lvl]").forEach(function (c) { c.addEventListener("change", function () { st.lvl[c.dataset.lvl] = c.checked; renderCalendar(); }); });
    side.querySelectorAll("input[data-kind]").forEach(function (c) { c.addEventListener("change", function () { st.kind[c.dataset.kind] = c.checked; renderCalendar(); }); });
    $("cal-reset").addEventListener("click", function () {
      st.q = ""; q.value = ""; st.when = "month"; st.day = null;
      document.querySelectorAll(".kw-day").forEach(function (o) { o.classList.remove("on"); });
      side.querySelectorAll("#cal-when button").forEach(function (o) { o.classList.toggle("on", o.dataset.w === "month"); });
      side.querySelectorAll("input[type=checkbox]").forEach(function (c) { c.checked = true; });
      st.lvl = { 1: true, 2: true, 3: true }; st.kind = { infl: true, jobs: true, growth: true, fed: true };
      renderCalendar();
    });
    const tg = $("cal-ftoggle");
    tg.addEventListener("click", function () { const open = side.classList.toggle("open"); tg.setAttribute("aria-expanded", open ? "true" : "false"); });
    // link toos ah: kalandarka.html#infl, #jobs, #growth, #fed, #top
    const h = (location.hash || "").slice(1);
    if (KIND[h]) { Object.keys(st.kind).forEach(function (k) { st.kind[k] = k === h; }); side.querySelectorAll("input[data-kind]").forEach(function (c) { c.checked = c.dataset.kind === h; }); }
    if (h === "top") { st.lvl = { 1: false, 2: false, 3: true }; side.querySelectorAll("input[data-lvl]").forEach(function (c) { c.checked = c.dataset.lvl === "3"; }); }
  })();

  function renderAll() { renderHero(); renderStats(); renderCalendar(); }
  renderAll();
  setInterval(function () { renderStats(); renderCalendar(); }, 60000);
})();
