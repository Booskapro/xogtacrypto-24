/* =========================================================
   Warbixinta tooska ah + Filashada + Wararka
   - /api/live : Fed RSS, bayaanka FOMC, Kalshi (60s)
   - /api/fed  : FRED (CPI, shaqada, bonds)
   Tirooyinka oo dhan waxay ka yimaadaan ilaha rasmiga ah;
   qoraalka af-Soomaaliga ah ayaa si toos ah loo diyaariyaa.
   ========================================================= */
(function () {
  "use strict";
  const F = window.FedCore;
  const esc = F.esc;
  const $ = function (id) { return document.getElementById(id); };
  const T = window.I18N.tx;
  const EN = window.I18N.lang === "en";

  let liveCache = null;
  function loadLive(force) {
    if (liveCache && !force) return liveCache;
    if (location.protocol === "file:") return (liveCache = Promise.resolve(null));
    liveCache = fetch("/api/live", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
    return liveCache;
  }

  function hhmm(d) { return F.pad(d.getHours()) + ":" + F.pad(d.getMinutes()); }
  function ago(iso) {
    const ms = Date.now() - Date.parse(iso);
    if (ms < 60e3) return T("hadda", "just now");
    if (ms < 3600e3) return Math.round(ms / 60e3) + T(" daqiiqo kahor", " min ago");
    if (ms < 86400e3) return Math.round(ms / 3600e3) + T(" saac kahor", "h ago");
    return F.fmtDate(iso.slice(0, 10));
  }
  function nyDate(iso) {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso)); }
    catch (e) { return iso.slice(0, 10); }
  }
  function signK(n) { return (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US") + ",000"; }

  const KIND = {
    hike: { word: T("kor u qaado", "raise"), past: T("kor ayuu u qaaday", "raised"), chip: "hawk", label: T("FED Adag", "Hawkish Fed"), en: "a rate hike" },
    cut: { word: T("dhimo", "cut"), past: T("wuu dhimay", "cut"), chip: "dove", label: T("FED Jilicsan", "Dovish Fed"), en: "a rate cut" },
    hold: { word: T("hayo", "hold"), past: T("wuu hayay", "held"), chip: "", label: T("Isbeddel la'aan", "No change"), en: "no change" }
  };

  // Kalshi: H25 = kor 0.25%, H26 = kor KA BADAN 0.25%, H0 = hayn
  function oddsText(m) {
    if (m.kind === "hold") return T("Hayn", "Hold");
    const more = m.bps % 25 !== 0;
    const base = ((more ? m.bps - 1 : m.bps) / 100).toFixed(2) + "%";
    if (m.kind === "hike") return more ? T("Kor ka badan +", "Hike more than +") + base : T("Kor +", "Hike +") + base;
    if (m.kind === "cut") return more ? T("Dhimis ka badan −", "Cut more than −") + base : T("Dhimis −", "Cut −") + base;
    return m.label;
  }

  // Jadwalka: dhacdada xigta ee magaceeda ku jiro qoraal
  function nextEvent(word) {
    const now = Date.now();
    const e = (window.FED_CAL.upcoming || []).find(function (x) { return x.name.indexOf(word) !== -1 && new Date(x.time).getTime() > now; });
    return e ? F.fmtDateTime(new Date(e.time)) : null;
  }
  // CUSUB: xogta la soo daayay 24-kii saac ee la soo dhaafay
  const NEW_MS = 24 * 3600e3;
  function releasedAt(word, period) {
    const now = Date.now();
    const e = (window.FED_CAL.upcoming || []).filter(function (x) {
      return x.name.indexOf(word) !== -1 && x.period === period && new Date(x.time).getTime() <= now;
    }).pop();
    return e ? e.time : null;
  }
  function isNew(iso) { return !!iso && Date.now() - Date.parse(iso) < NEW_MS && Date.now() >= Date.parse(iso); }

  function nextMeeting() {
    const now = Date.now();
    const m = window.FED_CAL.meetings.find(function (x) { return new Date(x.time).getTime() > now; });
    return m || null;
  }

  // ---------- Warbixinta tooska ah ----------
  function buildPosts(fed, live) {
    const posts = [];
    const fred = function (id, label) { return { name: label + " (FRED)", url: "https://fred.stlouisfed.org/series/" + id }; };
    const current = (live && live.fomc && live.fomc.range) || (fed && fed.target && fed.target.current) || null;
    const nm = nextMeeting();
    const nmText = nm ? F.fmtDate(nm.date) : T("shirka xiga", "the next meeting");

    // 1) Go'aanka FED
    if (live && live.fomc) {
      const f = live.fomc, k = KIND[f.action];
      const body = [
        T("Shirkii guddiga FED-ka (FOMC) ee " + F.fmtDate(nyDate(f.date)) + ", Federal Reserve wuxuu go'aansaday inuu dulsaarka " + k.word + ". Dulsaarka hadda waa " + F.fmtRange(f.range) + ".",
          "At the FOMC meeting on " + F.fmtDate(nyDate(f.date)) + ", the Federal Reserve decided to " + k.word + " interest rates. The rate is now " + F.fmtRange(f.range) + ".")
      ];
      if (f.action === "hold") body.push(T("Taas macnaheedu waa in qiimaha amaahda (guryaha, gaadiidka iyo shirkadaha) uusan isbeddelin. FED-ku wuxuu sugayaa xog dheeraad ah oo ku saabsan qaalaynta iyo shaqada ka hor intaanu tallaabo cusub qaadin.",
        "This means borrowing costs (homes, cars and businesses) stay the same. The Fed is waiting for more data on inflation and jobs before its next move."));
      if (f.action === "hike") body.push(T("Amaahdu way qaalisay. Badanaa dollar-ku wuu xoogaystaa, crypto-ga iyo saamiyaduna cadaadis ayay la kulmaan, maxaa yeelay lacagtu way yaraatay oo way qaalisay.",
        "Borrowing is now more expensive. The dollar usually strengthens, while crypto and stocks come under pressure, because money becomes scarcer and costlier."));
      if (f.action === "cut") body.push(T("Amaahdu way jabtay. Badanaa dollar-ku wuu daciifaa, crypto-ga iyo saamiyaduna way kacaan, maxaa yeelay lacag badan ayaa suuqa soo gasha.",
        "Borrowing is now cheaper. The dollar usually weakens, while crypto and stocks tend to rise, because more money flows into markets."));
      body.push(T("Shirka xiga ee FED: ", "Next Fed meeting: ") + nmText + ".");
      posts.push({ when: f.date, title: T("FED-ku dulsaarka " + k.past + ": ", "The Fed " + k.past + " rates: ") + F.fmtRange(f.range), body: body,
        chip: f.action === "hold" ? null : { text: k.label, cls: k.chip }, sources: [{ name: T("Bayaanka rasmiga ah (federalreserve.gov)", "Official statement (federalreserve.gov)"), url: f.link }], priority: 3, fresh: isNew(f.date) });
    }

    // 2) Filashada suuqa
    if (live && live.odds && live.odds.markets.length) {
      const o = live.odds, top = o.markets[0];
      const close = o.close ? F.fmtDate(nyDate(o.close)) : nmText;
      const k = top.kind ? KIND[top.kind] : null;
      const list = o.markets.filter(function (m, i) { return i < 3 || m.p >= 2; }).map(function (m) { return oddsText(m) + " " + m.p.toFixed(0) + "%"; }).join(", ");
      const body = [
        T("Ganacsatada suuqa saadaasha (Kalshi) ayaa hadda filaya in FED-ku shirka " + close + " dulsaarka " + (k ? k.word : "go'aamiyo") + ". Fursadaha: " + list + ".",
          "Traders on the prediction market Kalshi currently expect " + (k ? k.en : "a decision") + " at the Fed meeting on " + close + ". Odds: " + list + ".")
      ];
      if (current && top.kind === "hike") body.push(T("Haddii ay sidaas noqoto, dulsaarku wuxuu ka kici doonaa ", "If that happens, the rate would rise from ") + F.fmtRange(current) + T(" ilaa ", " to ") + F.fmtRange({ lo: current.lo + top.bps / 100, hi: current.hi + top.bps / 100 }) + ".");
      if (current && top.kind === "cut") body.push(T("Haddii ay sidaas noqoto, dulsaarku wuxuu ka dhici doonaa ", "If that happens, the rate would fall from ") + F.fmtRange(current) + T(" ilaa ", " to ") + F.fmtRange({ lo: current.lo - top.bps / 100, hi: current.hi - top.bps / 100 }) + ".");
      if (top.kind === "hold") body.push(T("Haddii ay sidaas noqoto, dulsaarku wuxuu ku sii jiri doonaa ", "If that happens, the rate would stay at ") + F.fmtRange(current) + ".");
      const cpiNext = nextEvent("CPI");
      body.push(T("Fursadahan waxay isbeddelaan marka xog cusub soo baxdo", "These odds change as new data is released") + (cpiNext ? T(", gaar ahaan sicir-bararka (CPI) ee ", ", especially the inflation (CPI) report on ") + cpiNext : "") + ".");
      posts.push({ when: live.updated, title: T("Suuqa: " + top.p.toFixed(0) + "% fursad ah in FED-ku dulsaarka " + (k ? k.word : "go'aamiyo") + " (" + close + ")", "Market: " + top.p.toFixed(0) + "% chance of " + (k ? k.en : "a decision") + " (" + close + ")"), body: body,
        chip: k && top.kind !== "hold" ? { text: k.label, cls: k.chip } : null, market: true, sources: [{ name: "Kalshi", url: o.url }], priority: 2 });
    }

    if (fed && fed.latest) {
      const L = fed.latest;
      // 3) Sicir-bararka
      if (L.cpi) {
        const diff = L.cpi.prev != null ? L.cpi.value - L.cpi.prev : 0;
        const dir = Math.abs(diff) < 0.05 ? T("wuu sii joogay heerkiisii", "was unchanged") : diff > 0 ? T("kor ayuu u kacay", "rose") : T("hoos ayuu u dhacay", "fell");
        const mo = F.monthName(L.cpi.month, true);
        const body = [
          T("Qiimaha alaabta iyo adeegyada Mareykanka wuxuu sannadkii kacay " + L.cpi.value.toFixed(1) + "% (" + mo + "). Sicir-bararku " + dir + (L.cpi.prev != null ? ", bishii hore wuxuu ahaa " + L.cpi.prev.toFixed(1) + "%" : "") + ".",
            "US prices for goods and services rose " + L.cpi.value.toFixed(1) + "% over the past year (" + mo + "). Inflation " + dir + (L.cpi.prev != null ? "; the previous month was " + L.cpi.prev.toFixed(1) + "%" : "") + ".")
        ];
        if (L.core && L.core.month === L.cpi.month) body.push(T("Haddii laga saaro cuntada iyo shidaalka, oo qiimahoodu si degdeg ah isu beddelo, sicir-bararka aasaasiga ahi waa ", "Excluding food and energy, whose prices swing quickly, core inflation is ") + L.core.value.toFixed(1) + "%.");
        body.push(T("Hadafka FED waa 2%. ", "The Fed's target is 2%. ") + (L.cpi.value > 2.5 ? T("Sicir-bararku wali wuu ka sarreeyaa hadafka, taasina waxay FED-ka ku riixaysaa inuu dulsaarka sare ku hayo ama kor u qaado.", "Inflation is still above target, which pushes the Fed to keep rates high or raise them.") : T("Sicir-bararku wuxuu ku dhow yahay hadafka, taasina waxay FED-ka u fududaynaysaa inuu dulsaarka dhimo.", "Inflation is close to target, which makes it easier for the Fed to cut rates.")));
        const nx = nextEvent("CPI");
        if (nx) body.push(T("Xogta sicir-bararka ee xigta: ", "Next inflation report: ") + nx + ".");
        const relC = releasedAt("CPI", L.cpi.month);
        posts.push({ when: relC, fresh: isNew(relC), label: mo, title: T("Sicir-bararka (CPI) ", "Inflation (CPI) ") + mo + ": " + L.cpi.value.toFixed(1) + "%", body: body,
          chip: L.cpi.value > 3 ? { text: T("Cadaadis kor u qaadis", "Pressure to hike"), cls: "hawk" } : null,
          sources: [fred("CPIAUCNS", T("Sicir-bararka", "Inflation")), { name: T("Xafiiska shaqada (BLS)", "Bureau of Labor Statistics (BLS)"), url: "https://www.bls.gov/cpi/" }], priority: 1 });
      }
      // 4) Shaqada
      if (L.nfp || L.un) {
        const month = (L.nfp || L.un).month;
        const body = [];
        const mo = F.monthName(month, true);
        if (L.nfp) body.push(T("Mareykanka waxaa " + mo + " lagu abuuray " + signK(L.nfp.value) + " shaqo cusub" + (L.nfp.prev != null ? ", halka bishii hore ay ahaayeen " + signK(L.nfp.prev) : "") + ".",
          "The US added " + signK(L.nfp.value) + " jobs in " + mo + (L.nfp.prev != null ? ", compared with " + signK(L.nfp.prev) + " the month before" : "") + "."));
        if (L.un) body.push(T("Shaqo la'aantu waa ", "Unemployment is ") + L.un.value.toFixed(1) + "%" + (L.un.prev != null ? T(" (bishii hore ", " (previous month ") + L.un.prev.toFixed(1) + "%)" : "") + ".");
        if (L.nfp && L.nfp.value >= 100) body.push(T("Suuq shaqo oo xoog leh wuxuu muujinayaa in dhaqaaluhu xoog leeyahay. Taasi waxay FED-ka u fududaynaysaa inuu dulsaarka sare ku hayo ama kor u qaado, waxayna badanaa xoojisaa dollar-ka.", "A strong job market shows a strong economy. That makes it easier for the Fed to keep rates high or raise them, and it usually strengthens the dollar."));
        else if (L.nfp && L.nfp.value < 50) body.push(T("Shaqo abuurka oo gaabiyay wuxuu muujinayaa in dhaqaaluhu daciifayo. Taasi waxay FED-ka ku riixi kartaa inuu dulsaarka dhimo.", "Slow hiring signals a weakening economy. That could push the Fed to cut rates."));
        else body.push(T("Shaqo abuurku waa dhexdhexaad, mana jirto cadaadis xoog leh oo dhinac kasta ah.", "Hiring is moderate, with no strong pressure in either direction."));
        const nx = nextEvent("NFP");
        if (nx) body.push(T("Xogta shaqada ee xigta: ", "Next jobs report: ") + nx + ".");
        const relN = releasedAt("NFP", month);
        posts.push({ when: relN, fresh: isNew(relN), label: mo,
          title: T("Shaqada ", "Jobs ") + mo + ": " + (L.nfp ? signK(L.nfp.value) + T(" shaqo cusub", " new jobs") : "") + (L.nfp && L.un ? ", " : "") + (L.un ? T("shaqo la'aan ", "unemployment ") + L.un.value.toFixed(1) + "%" : ""),
          body: body, chip: null, sources: [fred("PAYEMS", T("Shaqooyinka", "Payrolls")), fred("UNRATE", T("Shaqo la'aanta", "Unemployment"))], priority: 1 });
      }
      // 5) Bonds-ka
      if (L.dgs10) {
        const body = [];
        const d = L.dgs10.prev != null ? L.dgs10.value - L.dgs10.prev : null;
        body.push(T("Faa'iidada bond-ka dowladda Mareykanka ee 10 sano waa ", "The US 10-year Treasury yield is ") + L.dgs10.value.toFixed(2) + "%" + (d != null ? (Math.abs(d) < 0.005 ? T(", isla heerkii maalintii hore.", ", unchanged from the previous day.") : T(", oo " + (d > 0 ? "kor u kacday " : "hoos u dhacday ") + Math.abs(d).toFixed(2) + "% marka loo eego maalintii hore.", ", " + (d > 0 ? "up " : "down ") + Math.abs(d).toFixed(2) + "% from the previous day.")) : "."));
        if (L.dgs2) body.push(T("Bond-ka 2 sano waa ", "The 2-year yield is ") + L.dgs2.value.toFixed(2) + T("%. Bond-kan wuxuu si dhow ula socdaa waxa suuqu ka filayo FED-ka: marka uu kaco, suuqu wuxuu filayaa dulsaar sare.", "%. It closely tracks what the market expects from the Fed: when it rises, the market expects higher rates."));
        body.push(T("Marka faa'iidada bonds-ku kacdo, lacagta maalgashadayaashu waxay u wareegtaa bonds-ka, badanaa waxayna cadaadis ku keentaa crypto-ga iyo dahabka.", "When bond yields rise, investor money moves into bonds, which usually puts pressure on crypto and gold."));
        posts.push({ when: null, label: F.fmtDate(L.dgs10.date), title: T("Bonds-ka Mareykanka: 10 sano ", "US bonds: 10-year ") + L.dgs10.value.toFixed(2) + "%" + (L.dgs2 ? T(", 2 sano ", ", 2-year ") + L.dgs2.value.toFixed(2) + "%" : ""),
          body: body, chip: null, sources: [fred("DGS10", T("Bond 10 sano", "10-year bond")), fred("DGS2", T("Bond 2 sano", "2-year bond"))], priority: 0 });
      }
    }

    posts.sort(function (a, b) {
      const ta = a.when ? Date.parse(a.when) : 0, tb = b.when ? Date.parse(b.when) : 0;
      if (!!a.fresh !== !!b.fresh) return a.fresh ? -1 : 1;
      if (a.fresh && b.fresh) return tb - ta;
      const fa = a.priority === 3 && Date.now() - ta < 10 * 864e5, fb = b.priority === 3 && Date.now() - tb < 10 * 864e5;
      if (fa !== fb) return fa ? -1 : 1;
      return b.priority - a.priority || tb - ta;
    });
    return posts;
  }

  function renderPosts(el, posts) {
    if (!el) return;
    if (!posts.length) { el.innerHTML = '<p class="muted">' + T("Xogta waa la soo qaadayaa…", "Loading data…") + "</p>"; return; }
    el.innerHTML = posts.map(function (p) {
      const time = p.when && (p.fresh || p.market || p.priority === 3) ? ago(p.when) : p.label || (p.when ? ago(p.when) : "");
      const body = (Array.isArray(p.body) ? p.body : [p.body]).map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");
      return '<article class="post' + (p.fresh ? " is-new" : "") + '">' +
        '<div class="post-time mono">' + esc(time) + "</div>" +
        '<div class="post-body"><div class="post-title">' + (p.fresh ? '<span class="new-badge">' + T("CUSUB", "NEW") + "</span>" : "") + esc(p.title) + "</div>" + body +
        '<div class="post-meta">' +
          (p.chip ? '<span class="chip ' + p.chip.cls + '">' + esc(p.chip.text) + "</span>" : "") +
          (p.market ? '<span class="chip">' + T("Suuqa saadaasha", "Prediction market") + "</span>" : '<span class="chip ok">✓ ' + T("Il rasmi ah", "Official source") + "</span>") +
          p.sources.map(function (s) { return '<a class="small" href="' + esc(s.url) + '" rel="noopener">' + esc(s.name) + "</a>"; }).join("") +
        "</div></div></article>";
    }).join("");
  }

  // ---------- Filashada ----------
  function renderOdds(live) {
    const box = $("odds");
    if (!box) return;
    if (!live || !live.odds) {
      box.innerHTML = '<p class="muted">' + T("Fursadaha suuqa lama heli karo hadda. Waxaan isku dayi doonnaa mar kale daqiiqad kadib.", "Market odds are not available right now. We will try again in a minute.") + "</p>";
      gauge(null);
      return;
    }
    const o = live.odds;
    const close = o.close ? F.fmtDate(nyDate(o.close)) : "";
    box.innerHTML = '<div class="small muted" style="margin-bottom:10px">' + T("Go'aanka FED", "Fed decision") + " · " + esc(close) + "</div>" +
      o.markets.filter(function (m, i) { return i < 3 || m.p >= 2; }).slice(0, 5).map(function (m) {
        const color = m.kind === "hike" ? "var(--hawk)" : m.kind === "cut" ? "var(--dove)" : "var(--muted)";
        return '<div class="odds-row"><div class="odds-head"><span>' + esc(oddsText(m)) + '</span><b style="color:' + color + '">' + m.p.toFixed(0) + "%</b></div>" +
          '<div class="bar"><div style="width:' + Math.max(1, m.p) + "%;background:" + color + '"></div></div></div>';
      }).join("") +
      '<p class="note">' + T("Isha", "Source") + ': <a href="' + esc(o.url) + '" rel="noopener">Kalshi</a> ' + T("(suuq saadaal oo sharci ah) · la cusbooneysiiyay ", "(regulated prediction market) · updated ") + hhmm(new Date(live.updated)) + "</p>";
    const hike = o.markets.filter(function (m) { return m.kind === "hike"; }).reduce(function (s, m) { return s + m.p; }, 0);
    const cut = o.markets.filter(function (m) { return m.kind === "cut"; }).reduce(function (s, m) { return s + m.p; }, 0);
    gauge((hike - cut) / 100);
  }

  function gauge(score) {
    const el = $("gauge");
    if (!el) return;
    if (score == null) { el.innerHTML = ""; return; }
    const ang = Math.PI * (1 - (score + 1) / 2);
    const x = 120 + 80 * Math.cos(ang), y = 110 - 80 * Math.sin(ang);
    const label = score > 0.2 ? T("FED ADAG", "HAWKISH") : score < -0.2 ? T("FED JILICSAN", "DOVISH") : T("DHEXDHEXAAD", "NEUTRAL");
    const sub = score > 0.2 ? T("Suuqu wuxuu filayaa in dulsaarka kor loo qaado", "The market expects a rate hike") : score < -0.2 ? T("Suuqu wuxuu filayaa in dulsaarka la dhimo", "The market expects a rate cut") : T("Suuqu wuxuu filayaa in dulsaarka la hayo", "The market expects rates to hold");
    const color = score > 0.2 ? "var(--hawk)" : score < -0.2 ? "var(--dove)" : "var(--text)";
    el.innerHTML =
      '<svg width="240" height="130" viewBox="0 0 240 130" role="img" aria-label="Fed: ' + label + '">' +
      '<path d="M20 110 A100 100 0 0 1 70 23.4" fill="none" stroke="var(--dove)" stroke-width="18"></path>' +
      '<path d="M70 23.4 A100 100 0 0 1 170 23.4" fill="none" stroke="var(--line-2)" stroke-width="18"></path>' +
      '<path d="M170 23.4 A100 100 0 0 1 220 110" fill="none" stroke="var(--hawk)" stroke-width="18"></path>' +
      '<line x1="120" y1="110" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--text)" stroke-width="4" stroke-linecap="round"></line>' +
      '<circle cx="120" cy="110" r="8" fill="var(--text)"></circle></svg>' +
      '<div style="display:flex;justify-content:space-between;width:230px;font-size:.75rem;color:var(--muted);margin-top:-6px"><span>' + T("Dhimis", "Cut") + "</span><span>" + T("Hayn", "Hold") + "</span><span>" + T("Kor u qaadis", "Hike") + "</span></div>" +
      '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:1.5rem;font-weight:700;color:' + color + '">' + label + "</div>" +
      '<div class="small muted" style="text-align:center">' + esc(sub) + "</div>";
  }

  // ---------- Go'aanka FOMC oo isla markiiba la muujiyo ----------
  function applyFomc(live) {
    if (!live || !live.fomc || !$("dec-last")) return;
    const fomcDay = nyDate(live.fomc.date);
    const past = window.FED_CAL.meetings.filter(function (m) { return new Date(m.time).getTime() <= Date.now(); });
    const last = past[past.length - 1];
    if (!last || last.date !== fomcDay) return;
    const box = $("dec-last"), k = live.fomc.action;
    box.querySelector(".when").textContent = T("Kii u dambeeyay · ", "Latest · ") + F.fmtDate(last.date);
    const what = box.querySelector(".what");
    what.textContent = F.ACTION[k].text;
    what.className = "what " + F.ACTION[k].cls;
    box.querySelector(".detail").textContent = F.fmtRange(live.fomc.range) + (last.vote ? T(" · cod ", " · vote ") + last.vote : "") + T(" · bayaanka rasmiga ah", " · official statement");
    if ($("fed-range")) $("fed-range").textContent = F.fmtRange(live.fomc.range);
  }

  // ---------- Wararka Federal Reserve (sharraxaad af-Soomaali ah) ----------
  const CAT = { monetary: T("Siyaasadda lacagta", "Monetary policy"), press: T("Ogeysiis", "Press release"), speech: T("Hadal", "Speech") };
  function englishNews(n) {
    const t = n.title;
    let text = "Full details are in the official source.";
    if (/FOMC statement/i.test(t)) text = "The Fed's rate-setting committee (FOMC) published its official statement explaining the economy and the reason for its decision.";
    else if (/Minutes of the Federal Open Market Committee/i.test(t)) text = "The minutes show what Fed members discussed: their concerns and where they think rates are heading. Traders look here for signals about future decisions.";
    else if (/^Speech by/i.test(t)) text = "Speeches by Fed officials often hint at the direction of rates. Hawkish remarks can lift the dollar; dovish remarks can help crypto and stocks.";
    else if (/^Testimony by/i.test(t)) text = "A Fed official spoke before the US Congress. Markets watch these remarks closely.";
    else if (/enforcement action/i.test(t)) text = "This is a bank supervision decision and has no direct effect on interest rates or markets.";
    else if (/discount rate/i.test(t)) text = "These minutes show the regional Reserve Banks' requests on the rate the Fed charges banks for emergency loans.";
    else if (/Beige Book/i.test(t)) text = "This report summarises what businesses and banks say about the economy in each of the 12 Fed districts. The Fed uses it before its meetings.";
    return { title: t, text: text };
  }
  function somaliNews(n, live) {
    if (EN) return englishNews(n);
    const t = n.title;
    let m;
    if (/FOMC statement/i.test(t)) {
      const f = live && live.fomc && live.fomc.link === n.link ? live.fomc : null;
      return { title: "Bayaanka FOMC: " + (f ? "FED-ku dulsaarka " + KIND[f.action].past + ", " + F.fmtRange(f.range) : "go'aanka dulsaarka FED"),
        text: "Guddiga FED-ka (FOMC) ayaa daabacay bayaankiisa rasmiga ah ee go'aanka dulsaarka. Bayaanku wuxuu sharxayaa xaaladda dhaqaalaha iyo sababta go'aanka." };
    }
    if ((m = /Minutes of the Federal Open Market Committee,?\s*(.*)/i.exec(t))) {
      return { title: "Qoraalka faahfaahsan ee shirka FOMC (" + m[1] + ")", text: "Qoraalkan wuxuu muujinayaa doodii xubnaha FED-ka ee shirka: waxa ay ka walaacsan yihiin iyo halka ay u malaynayaan in dulsaarku u socdo. Ganacsatadu waxay ka raadiyaan calaamadaha go'aannada soo socda." };
    }
    if ((m = /^Speech by (Chair|Vice Chair for Supervision|Vice Chair|Governor) ([^,]+?) on (.+)$/i.exec(t))) {
      const role = { "chair": "Guddoomiyaha FED", "vice chair": "Guddoomiye-ku-xigeenka FED", "vice chair for supervision": "Guddoomiye-ku-xigeenka (kormeerka)", "governor": "Xubinta golaha FED" }[m[1].toLowerCase()] || m[1];
      return { title: role + " " + m[2] + " ayaa khudbad ka jeediyay: " + m[3], text: "Hadallada xubnaha FED-ka waxay inta badan tilmaamaan jihada dulsaarka. Hadal adag wuxuu xoojin karaa dollar-ka, hadal jilicsanna wuxuu caawin karaa crypto-ga iyo saamiyada." };
    }
    if (/^Testimony by/i.test(t)) return { title: "Markhaati laga hor dhigay Koongareeska: " + t.replace(/^Testimony by /i, ""), text: "Xubin FED ah ayaa ka hor hadashay Koongareeska Mareykanka. Erayadan waxaa si dhow u daawada suuqyada." };
    if (/enforcement action/i.test(t)) return { title: "FED-ku wuxuu tallaabo sharci ah ka qaaday bangi ama shirkad maaliyadeed", text: "Tani waa go'aan kormeer bangiyeed, saamayn toos ahna kuma laha dulsaarka ama suuqyada." };
    if (/discount rate/i.test(t)) return { title: "Qoraalka dulsaarka amaahda degdegga ah ee bangiyada (discount rate)", text: "Qoraalkan wuxuu muujinayaa codsiyadii bangiyada gobollada ee ku saabsanaa dulsaarka ay FED-ku bangiyada ugu amaahiso." };
    if (/Beige Book/i.test(t)) return { title: "Warbixinta Beige Book: xaaladda dhaqaalaha 12-ka gobol ee FED", text: "Warbixintan waxay soo koobaysaa waxa ganacsatada iyo bangiyadu ka sheegeen dhaqaalaha gobol kasta. FED-ku wuxuu isticmaalaa kahor shirarkiisa." };
    if (/announces|issues|releases|request for comment|proposal|final rule/i.test(t)) return { title: "Ogeysiis cusub oo ka soo baxay Federal Reserve", text: "Federal Reserve ayaa daabacday ogeysiis cusub. Faahfaahinta buuxda waxay ku jirtaa isha rasmiga ah." };
    return { title: "War cusub oo ka yimid Federal Reserve", text: "Faahfaahinta buuxda waxay ku jirtaa isha rasmiga ah." };
  }

  let newsFilter = "all";
  function renderNews(live) {
    const el = $("news-list");
    if (!el) return;
    if (!live || !live.news || !live.news.length) { el.innerHTML = '<p class="muted">' + T("Wararka lama heli karo hadda. Waxaan isku dayi doonnaa mar kale daqiiqad kadib.", "News is not available right now. We will try again in a minute.") + "</p>"; return; }
    const items = live.news.filter(function (n) { return newsFilter === "all" || n.cat === newsFilter; }).slice(0, 25);
    el.innerHTML = items.map(function (n) {
      const so = somaliNews(n, live);
      return '<article class="news-item">' +
        '<div class="post-meta"><span class="chip' + (n.cat === "monetary" ? " hawk" : "") + '">' + esc(CAT[n.cat] || n.cat) + "</span>" +
        '<span class="small muted">' + (n.date ? esc(ago(n.date)) : "") + "</span>" +
        '<span class="chip ok">✓ federalreserve.gov</span></div>' +
        '<h3 class="news-title">' + esc(so.title) + "</h3>" +
        '<p style="margin:0;color:var(--text-2)">' + esc(so.text) + "</p>" +
        (EN ? "" : '<p class="small muted" style="margin:0">Cinwaanka asalka ah (Ingiriis): <span lang="en">' + esc(n.title) + "</span></p>") +
        '<a class="small" href="' + esc(n.link) + '" rel="noopener">' + T("Akhri isha rasmiga ah →", "Read the official source →") + "</a></article>";
    }).join("") || '<p class="muted">' + T("War qaybtan ah ma jiro hadda.", "No news in this category right now.") + "</p>";
  }
  function wireNewsFilter() {
    const el = $("news-filter");
    if (!el) return;
    el.onclick = function (e) {
      const b = e.target.closest("button"); if (!b) return;
      newsFilter = b.dataset.cat;
      el.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      loadLive().then(renderNews);
    };
  }

  // ---------- Si joogto ah u cusbooneysii ----------
  function refresh(forceLive, forceFed) {
    return Promise.all([loadLive(forceLive), F.load(forceFed)]).then(function (r) {
      const live = r[0], fed = r[1];
      renderPosts($("agent-feed"), buildPosts(fed, live));
      renderOdds(live);
      applyFomc(live);
      renderNews(live);
      const st = $("agent-updated");
      if (st) st.textContent = live ? T("La cusbooneysiiyay ", "Updated ") + hhmm(new Date()) : T("Xogta tooska ahi waxay shaqaysaa marka website-ka internet-ka la geliyo", "Live data works once the website is online");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("agent-feed") && !$("odds") && !$("news-list")) return;
    wireNewsFilter();
    refresh(false, false);
    setInterval(function () { refresh(true, false); }, 60 * 1000);
    setInterval(function () { refresh(false, true); }, 10 * 60 * 1000);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refresh(true, false); });
  });

  window.LiveData = { loadLive: loadLive, buildPosts: buildPosts };
})();
