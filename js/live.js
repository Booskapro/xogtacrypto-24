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
    if (ms < 60e3) return "hadda";
    if (ms < 3600e3) return Math.round(ms / 60e3) + " daqiiqo kahor";
    if (ms < 86400e3) return Math.round(ms / 3600e3) + " saac kahor";
    return F.fmtDate(iso.slice(0, 10));
  }
  function nyDate(iso) {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso)); }
    catch (e) { return iso.slice(0, 10); }
  }
  function signK(n) { return (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US") + ",000"; }

  const KIND = {
    hike: { word: "kor u qaado", past: "kor ayuu u qaaday", chip: "hawk", label: "FED Adag" },
    cut: { word: "dhimo", past: "wuu dhimay", chip: "dove", label: "FED Jilicsan" },
    hold: { word: "hayo", past: "wuu hayay", chip: "", label: "Isbeddel la'aan" }
  };

  // Kalshi: H25 = kor 0.25%, H26 = kor KA BADAN 0.25%, H0 = hayn
  function oddsText(m) {
    if (m.kind === "hold") return "Hayn";
    const more = m.bps % 25 !== 0;
    const base = ((more ? m.bps - 1 : m.bps) / 100).toFixed(2) + "%";
    if (m.kind === "hike") return more ? "Kor ka badan +" + base : "Kor +" + base;
    if (m.kind === "cut") return more ? "Dhimis ka badan −" + base : "Dhimis −" + base;
    return m.label;
  }

  // Jadwalka: dhacdada xigta ee magaceeda ku jiro qoraal
  function nextEvent(word) {
    const now = Date.now();
    const e = (window.FED_CAL.upcoming || []).find(function (x) { return x.name.indexOf(word) !== -1 && new Date(x.time).getTime() > now; });
    return e ? F.fmtDateTime(new Date(e.time)) : null;
  }
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
    const nmText = nm ? F.fmtDate(nm.date) : "shirka xiga";

    // 1) Go'aanka FED
    if (live && live.fomc) {
      const f = live.fomc, k = KIND[f.action];
      const body = [
        "Shirkii guddiga FED-ka (FOMC) ee " + F.fmtDate(nyDate(f.date)) + ", Federal Reserve wuxuu go'aansaday inuu dulsaarka " + k.word + ". Dulsaarka hadda waa " + F.fmtRange(f.range) + "."
      ];
      if (f.action === "hold") body.push("Taas macnaheedu waa in qiimaha amaahda (guryaha, gaadiidka iyo shirkadaha) uusan isbeddelin. FED-ku wuxuu sugayaa xog dheeraad ah oo ku saabsan qaalaynta iyo shaqada ka hor intaanu tallaabo cusub qaadin.");
      if (f.action === "hike") body.push("Amaahdu way qaalisay. Badanaa dollar-ku wuu xoogaystaa, crypto-ga iyo saamiyaduna cadaadis ayay la kulmaan, maxaa yeelay lacagtu way yaraatay oo way qaalisay.");
      if (f.action === "cut") body.push("Amaahdu way jabtay. Badanaa dollar-ku wuu daciifaa, crypto-ga iyo saamiyaduna way kacaan, maxaa yeelay lacag badan ayaa suuqa soo gasha.");
      body.push("Shirka xiga ee FED: " + nmText + ".");
      posts.push({ when: f.date, title: "FED-ku dulsaarka " + k.past + ": " + F.fmtRange(f.range), body: body,
        chip: f.action === "hold" ? null : { text: k.label, cls: k.chip }, sources: [{ name: "Bayaanka rasmiga ah (federalreserve.gov)", url: f.link }], priority: 3 });
    }

    // 2) Filashada suuqa
    if (live && live.odds && live.odds.markets.length) {
      const o = live.odds, top = o.markets[0];
      const close = o.close ? F.fmtDate(nyDate(o.close)) : nmText;
      const k = top.kind ? KIND[top.kind] : null;
      const body = [
        "Ganacsatada suuqa saadaasha (Kalshi) ayaa hadda filaya in FED-ku shirka " + close + " dulsaarka " + (k ? k.word : "go'aamiyo") + ". Fursadaha: " +
          o.markets.filter(function (m, i) { return i < 3 || m.p >= 2; }).map(function (m) { return oddsText(m) + " " + m.p.toFixed(0) + "%"; }).join(", ") + "."
      ];
      if (current && top.kind === "hike") body.push("Haddii ay sidaas noqoto, dulsaarku wuxuu ka kici doonaa " + F.fmtRange(current) + " ilaa " + F.fmtRange({ lo: current.lo + top.bps / 100, hi: current.hi + top.bps / 100 }) + ".");
      if (current && top.kind === "cut") body.push("Haddii ay sidaas noqoto, dulsaarku wuxuu ka dhici doonaa " + F.fmtRange(current) + " ilaa " + F.fmtRange({ lo: current.lo - top.bps / 100, hi: current.hi - top.bps / 100 }) + ".");
      if (top.kind === "hold") body.push("Haddii ay sidaas noqoto, dulsaarku wuxuu ku sii jiri doonaa " + F.fmtRange(current) + ".");
      const cpiNext = nextEvent("CPI");
      body.push("Fursadahan waxay isbeddelaan marka xog cusub soo baxdo" + (cpiNext ? ", gaar ahaan sicir-bararka (CPI) ee " + cpiNext : "") + ".");
      posts.push({ when: live.updated, title: "Suuqa: " + top.p.toFixed(0) + "% fursad ah in FED-ku dulsaarka " + (k ? k.word : "go'aamiyo") + " (" + close + ")", body: body,
        chip: k && top.kind !== "hold" ? { text: k.label, cls: k.chip } : null, market: true, sources: [{ name: "Kalshi", url: o.url }], priority: 2 });
    }

    if (fed && fed.latest) {
      const L = fed.latest;
      // 3) Sicir-bararka
      if (L.cpi) {
        const diff = L.cpi.prev != null ? L.cpi.value - L.cpi.prev : 0;
        const dir = Math.abs(diff) < 0.05 ? "wuu sii joogay heerkiisii" : diff > 0 ? "kor ayuu u kacay" : "hoos ayuu u dhacay";
        const body = [
          "Qiimaha alaabta iyo adeegyada Mareykanka wuxuu sannadkii kacay " + L.cpi.value.toFixed(1) + "% (" + F.monthName(L.cpi.month, true) + "). Sicir-bararku " + dir + (L.cpi.prev != null ? ", bishii hore wuxuu ahaa " + L.cpi.prev.toFixed(1) + "%" : "") + "."
        ];
        if (L.core && L.core.month === L.cpi.month) body.push("Haddii laga saaro cuntada iyo shidaalka, oo qiimahoodu si degdeg ah isu beddelo, sicir-bararka aasaasiga ahi waa " + L.core.value.toFixed(1) + "%.");
        body.push("Hadafka FED waa 2%. " + (L.cpi.value > 2.5 ? "Sicir-bararku wali wuu ka sarreeyaa hadafka, taasina waxay FED-ka ku riixaysaa inuu dulsaarka sare ku hayo ama kor u qaado." : "Sicir-bararku wuxuu ku dhow yahay hadafka, taasina waxay FED-ka u fududaynaysaa inuu dulsaarka dhimo."));
        const nx = nextEvent("CPI");
        if (nx) body.push("Xogta sicir-bararka ee xigta: " + nx + ".");
        posts.push({ when: null, label: F.monthName(L.cpi.month, true), title: "Sicir-bararka (CPI) " + F.monthName(L.cpi.month, true) + ": " + L.cpi.value.toFixed(1) + "%", body: body,
          chip: L.cpi.value > 3 ? { text: "Cadaadis kor u qaadis", cls: "hawk" } : null,
          sources: [fred("CPIAUCNS", "Sicir-bararka"), { name: "Xafiiska shaqada (BLS)", url: "https://www.bls.gov/cpi/" }], priority: 1 });
      }
      // 4) Shaqada
      if (L.nfp || L.un) {
        const month = (L.nfp || L.un).month;
        const body = [];
        if (L.nfp) body.push("Mareykanka waxaa " + F.monthName(month, true) + " lagu abuuray " + signK(L.nfp.value) + " shaqo cusub" + (L.nfp.prev != null ? ", halka bishii hore ay ahaayeen " + signK(L.nfp.prev) : "") + ".");
        if (L.un) body.push("Shaqo la'aantu waa " + L.un.value.toFixed(1) + "%" + (L.un.prev != null ? " (bishii hore " + L.un.prev.toFixed(1) + "%)" : "") + ".");
        if (L.nfp && L.nfp.value >= 100) body.push("Suuq shaqo oo xoog leh wuxuu muujinayaa in dhaqaaluhu xoog leeyahay. Taasi waxay FED-ka u fududaynaysaa inuu dulsaarka sare ku hayo ama kor u qaado, waxayna badanaa xoojisaa dollar-ka.");
        else if (L.nfp && L.nfp.value < 50) body.push("Shaqo abuurka oo gaabiyay wuxuu muujinayaa in dhaqaaluhu daciifayo. Taasi waxay FED-ka ku riixi kartaa inuu dulsaarka dhimo.");
        else body.push("Shaqo abuurku waa dhexdhexaad, mana jirto cadaadis xoog leh oo dhinac kasta ah.");
        const nx = nextEvent("NFP");
        if (nx) body.push("Xogta shaqada ee xigta: " + nx + ".");
        posts.push({ when: null, label: F.monthName(month, true),
          title: "Shaqada " + F.monthName(month, true) + ": " + (L.nfp ? signK(L.nfp.value) + " shaqo cusub" : "") + (L.nfp && L.un ? ", " : "") + (L.un ? "shaqo la'aan " + L.un.value.toFixed(1) + "%" : ""),
          body: body, chip: null, sources: [fred("PAYEMS", "Shaqooyinka"), fred("UNRATE", "Shaqo la'aanta")], priority: 1 });
      }
      // 5) Bonds-ka
      if (L.dgs10) {
        const body = [];
        const d = L.dgs10.prev != null ? L.dgs10.value - L.dgs10.prev : null;
        body.push("Faa'iidada bond-ka dowladda Mareykanka ee 10 sano waa " + L.dgs10.value.toFixed(2) + "%" + (d != null ? (Math.abs(d) < 0.005 ? ", isla heerkii maalintii hore." : ", oo " + (d > 0 ? "kor u kacday " : "hoos u dhacday ") + Math.abs(d).toFixed(2) + "% marka loo eego maalintii hore.") : "."));
        if (L.dgs2) body.push("Bond-ka 2 sano waa " + L.dgs2.value.toFixed(2) + "%. Bond-kan wuxuu si dhow ula socdaa waxa suuqu ka filayo FED-ka: marka uu kaco, suuqu wuxuu filayaa dulsaar sare.");
        body.push("Marka faa'iidada bonds-ku kacdo, lacagta maalgashadayaashu waxay u wareegtaa bonds-ka, badanaa waxayna cadaadis ku keentaa crypto-ga iyo dahabka.");
        posts.push({ when: null, label: F.fmtDate(L.dgs10.date), title: "Bonds-ka Mareykanka: 10 sano " + L.dgs10.value.toFixed(2) + "%" + (L.dgs2 ? ", 2 sano " + L.dgs2.value.toFixed(2) + "%" : ""),
          body: body, chip: null, sources: [fred("DGS10", "Bond 10 sano"), fred("DGS2", "Bond 2 sano")], priority: 0 });
      }
    }

    posts.sort(function (a, b) {
      const ta = a.when ? Date.parse(a.when) : 0, tb = b.when ? Date.parse(b.when) : 0;
      const fa = a.priority === 3 && Date.now() - ta < 10 * 864e5, fb = b.priority === 3 && Date.now() - tb < 10 * 864e5;
      if (fa !== fb) return fa ? -1 : 1;
      return b.priority - a.priority || tb - ta;
    });
    return posts;
  }

  function renderPosts(el, posts) {
    if (!el) return;
    if (!posts.length) { el.innerHTML = '<p class="muted">Xogta waa la soo qaadayaa…</p>'; return; }
    el.innerHTML = posts.map(function (p) {
      const time = p.when ? ago(p.when) : p.label || "";
      const body = (Array.isArray(p.body) ? p.body : [p.body]).map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");
      return '<article class="post">' +
        '<div class="post-time mono">' + esc(time) + "</div>" +
        '<div class="post-body"><div class="post-title">' + esc(p.title) + "</div>" + body +
        '<div class="post-meta">' +
          (p.chip ? '<span class="chip ' + p.chip.cls + '">' + esc(p.chip.text) + "</span>" : "") +
          (p.market ? '<span class="chip">Suuqa saadaasha</span>' : '<span class="chip ok">✓ Il rasmi ah</span>') +
          p.sources.map(function (s) { return '<a class="small" href="' + esc(s.url) + '" rel="noopener">' + esc(s.name) + "</a>"; }).join("") +
        "</div></div></article>";
    }).join("");
  }

  // ---------- Filashada ----------
  function renderOdds(live) {
    const box = $("odds");
    if (!box) return;
    if (!live || !live.odds) {
      box.innerHTML = '<p class="muted">Fursadaha suuqa lama heli karo hadda. Waxaan isku dayi doonnaa mar kale daqiiqad kadib.</p>';
      gauge(null);
      return;
    }
    const o = live.odds;
    const close = o.close ? F.fmtDate(nyDate(o.close)) : "";
    box.innerHTML = '<div class="small muted" style="margin-bottom:10px">Go\'aanka FED · ' + esc(close) + "</div>" +
      o.markets.filter(function (m, i) { return i < 3 || m.p >= 2; }).slice(0, 5).map(function (m) {
        const color = m.kind === "hike" ? "var(--hawk)" : m.kind === "cut" ? "var(--dove)" : "var(--muted)";
        return '<div class="odds-row"><div class="odds-head"><span>' + esc(oddsText(m)) + '</span><b style="color:' + color + '">' + m.p.toFixed(0) + "%</b></div>" +
          '<div class="bar"><div style="width:' + Math.max(1, m.p) + "%;background:" + color + '"></div></div></div>';
      }).join("") +
      '<p class="note">Isha: <a href="' + esc(o.url) + '" rel="noopener">Kalshi</a> (suuq saadaal oo sharci ah) · la cusbooneysiiyay ' + hhmm(new Date(live.updated)) + "</p>";
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
    const label = score > 0.2 ? "FED ADAG" : score < -0.2 ? "FED JILICSAN" : "DHEXDHEXAAD";
    const sub = score > 0.2 ? "Suuqu wuxuu filayaa in dulsaarka kor loo qaado" : score < -0.2 ? "Suuqu wuxuu filayaa in dulsaarka la dhimo" : "Suuqu wuxuu filayaa in dulsaarka la hayo";
    const color = score > 0.2 ? "var(--hawk)" : score < -0.2 ? "var(--dove)" : "var(--text)";
    el.innerHTML =
      '<svg width="240" height="130" viewBox="0 0 240 130" role="img" aria-label="Dareenka FED: ' + label + '">' +
      '<path d="M20 110 A100 100 0 0 1 70 23.4" fill="none" stroke="var(--dove)" stroke-width="18"></path>' +
      '<path d="M70 23.4 A100 100 0 0 1 170 23.4" fill="none" stroke="var(--line-2)" stroke-width="18"></path>' +
      '<path d="M170 23.4 A100 100 0 0 1 220 110" fill="none" stroke="var(--hawk)" stroke-width="18"></path>' +
      '<line x1="120" y1="110" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--text)" stroke-width="4" stroke-linecap="round"></line>' +
      '<circle cx="120" cy="110" r="8" fill="var(--text)"></circle></svg>' +
      '<div style="display:flex;justify-content:space-between;width:230px;font-size:.75rem;color:var(--muted);margin-top:-6px"><span>Dhimis</span><span>Hayn</span><span>Kor u qaadis</span></div>' +
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
    box.querySelector(".when").textContent = "Kii u dambeeyay · " + F.fmtDate(last.date);
    const what = box.querySelector(".what");
    what.textContent = F.ACTION[k].text;
    what.className = "what " + F.ACTION[k].cls;
    box.querySelector(".detail").textContent = F.fmtRange(live.fomc.range) + (last.vote ? " · cod " + last.vote : "") + " · bayaanka rasmiga ah";
    if ($("fed-range")) $("fed-range").textContent = F.fmtRange(live.fomc.range);
  }

  // ---------- Wararka Federal Reserve (sharraxaad af-Soomaali ah) ----------
  const CAT = { monetary: "Siyaasadda lacagta", press: "Ogeysiis", speech: "Hadal" };
  function somaliNews(n, live) {
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
    if (!live || !live.news || !live.news.length) { el.innerHTML = '<p class="muted">Wararka lama heli karo hadda. Waxaan isku dayi doonnaa mar kale daqiiqad kadib.</p>'; return; }
    const items = live.news.filter(function (n) { return newsFilter === "all" || n.cat === newsFilter; }).slice(0, 25);
    el.innerHTML = items.map(function (n) {
      const so = somaliNews(n, live);
      return '<article class="news-item">' +
        '<div class="post-meta"><span class="chip' + (n.cat === "monetary" ? " hawk" : "") + '">' + esc(CAT[n.cat] || n.cat) + "</span>" +
        '<span class="small muted">' + (n.date ? esc(ago(n.date)) : "") + "</span>" +
        '<span class="chip ok">✓ federalreserve.gov</span></div>' +
        '<h3 class="news-title">' + esc(so.title) + "</h3>" +
        '<p style="margin:0;color:var(--text-2)">' + esc(so.text) + "</p>" +
        '<p class="small muted" style="margin:0">Cinwaanka asalka ah (Ingiriis): <span lang="en">' + esc(n.title) + "</span></p>" +
        '<a class="small" href="' + esc(n.link) + '" rel="noopener">Akhri isha rasmiga ah →</a></article>';
    }).join("") || '<p class="muted">War qaybtan ah ma jiro hadda.</p>';
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
      if (st) st.textContent = live ? "La cusbooneysiiyay " + hhmm(new Date()) : "Xogta tooska ahi waxay shaqaysaa marka website-ka internet-ka la geliyo";
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
