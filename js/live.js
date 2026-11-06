/* =========================================================
   AI Agent (qoraal diyaarsan) + Filashada + Wararka
   - /api/live : Fed RSS, bayaanka FOMC, Kalshi (60s)
   - /api/fed  : FRED (CPI, NFP, shaqo la'aan, bonds)
   Agent-ku tiro ma sameeyo: dhammaan tirooyinku waxay ka
   yimaadaan ilaha rasmiga ah; kaliya qoraalka ayuu diyaariyaa.
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
    // Taariikhda New York (shirarka FOMC waxay ku qoran yihiin waqtiga New York)
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso)); }
    catch (e) { return iso.slice(0, 10); }
  }

  const KIND = {
    hike: { word: "kor u qaado", past: "kor ayuu u qaaday", chip: "hawk", label: "Adag (Hawkish)" },
    cut: { word: "dhimo", past: "wuu dhimay", chip: "dove", label: "Jilicsan (Dovish)" },
    hold: { word: "hayo", past: "wuu hayay", chip: "", label: "Dhexdhexaad" }
  };

  function oddsText(m) {
    if (m.kind === "hold") return "Hayn";
    if (m.kind === "hike") return "Kor +" + (m.bps / 100).toFixed(2) + "%";
    if (m.kind === "cut") return "Dhimis −" + (m.bps / 100).toFixed(2) + "%";
    return m.label;
  }

  // ---------- Qoraallada AI Agent ----------
  function buildPosts(fed, live) {
    const posts = [];
    const fred = function (id) { return { name: "FRED · " + id, url: "https://fred.stlouisfed.org/series/" + id }; };

    if (live && live.fomc) {
      const k = KIND[live.fomc.action];
      posts.push({
        when: live.fomc.date, title: "Go'aanka FOMC: FED-ku dulsaarka " + k.past + " — " + F.fmtRange(live.fomc.range),
        body: "Bayaanka rasmiga ah ee Federal Reserve ayaa la daabacay. Dulsaarka hadda waa " + F.fmtRange(live.fomc.range) + ".",
        chip: { text: k.label, cls: k.chip }, sources: [{ name: "federalreserve.gov", url: live.fomc.link }], priority: 3
      });
    }

    if (live && live.odds && live.odds.markets.length) {
      const top = live.odds.markets[0];
      const close = live.odds.close ? F.fmtDate(nyDate(live.odds.close)) : "shirka xiga";
      const k = top.kind ? KIND[top.kind] : null;
      posts.push({
        when: live.updated, title: "Suuqa saadaasha: " + top.p.toFixed(0) + "% fursad ah in FED-ku dulsaarka " + (k ? k.word : "go'aamiyo") + " (" + close + ")",
        body: live.odds.markets.slice(0, 3).map(function (m) { return oddsText(m) + " " + m.p.toFixed(0) + "%"; }).join(" · ") + ". Fursadahan waxay isbeddelaan daqiiqad kasta.",
        chip: k ? { text: k.label, cls: k.chip } : null, market: true, sources: [{ name: "Kalshi", url: live.odds.url }], priority: 2
      });
    }

    if (fed && fed.latest) {
      const L = fed.latest;
      if (L.cpi) {
        const diff = L.cpi.prev != null ? L.cpi.value - L.cpi.prev : 0;
        const dir = Math.abs(diff) < 0.05 ? "isma beddelin" : diff > 0 ? "kor ayuu u kacay" : "hoos ayuu u dhacay";
        posts.push({
          when: null, label: F.monthName(L.cpi.month, true),
          title: "Sicir-bararka (CPI) " + F.monthName(L.cpi.month, true) + ": " + L.cpi.value.toFixed(1) + "% sannadle",
          body: "Sicir-bararku " + dir + (L.cpi.prev != null ? " marka loo eego bishii hore (" + L.cpi.prev.toFixed(1) + "%)" : "") + ". Hadafka FED waa 2%" +
            (L.cpi.value > 2.5 ? ", sidaas darteed sicir-bararku wali waa ka sarreeyaa hadafka." : "."),
          chip: L.cpi.value > 3 ? { text: "Cadaadis Adag", cls: "hawk" } : null,
          sources: [fred("CPIAUCNS"), { name: "BLS", url: "https://www.bls.gov/cpi/" }], priority: 1
        });
      }
      if (L.nfp || L.un) {
        const parts = [];
        if (L.nfp) parts.push("shaqooyin " + (L.nfp.value >= 0 ? "+" : "−") + Math.abs(L.nfp.value) + "K");
        if (L.un) parts.push("shaqo la'aan " + L.un.value.toFixed(1) + "%");
        const month = (L.nfp || L.un).month;
        let body = "";
        if (L.nfp && L.nfp.prev != null) body += "Bishii hore shaqooyinku waxay ahaayeen " + (L.nfp.prev >= 0 ? "+" : "−") + Math.abs(L.nfp.prev) + "K. ";
        if (L.un && L.un.prev != null) body += "Shaqo la'aanta bishii hore: " + L.un.prev.toFixed(1) + "%. ";
        if (L.nfp && L.nfp.value >= 100) body += "Suuq shaqo oo xoog leh wuxuu FED-ka u fududeeyaa inuu dulsaarka sare ku hayo.";
        else if (L.nfp && L.nfp.value < 50) body += "Shaqo abuurka oo gaabiyay wuxuu FED-ka ku riixi karaa inuu dulsaarka dhimo.";
        posts.push({
          when: null, label: F.monthName(month, true),
          title: "Shaqada " + F.monthName(month, true) + ": " + parts.join(", "),
          body: body, chip: null, sources: [fred("PAYEMS"), fred("UNRATE")], priority: 1
        });
      }
      if (L.dgs10) {
        const d = L.dgs10.prev != null ? L.dgs10.value - L.dgs10.prev : null;
        posts.push({
          when: null, label: F.fmtDate(L.dgs10.date),
          title: "Bonds: 10Y " + L.dgs10.value.toFixed(2) + "%" + (L.dgs2 ? ", 2Y " + L.dgs2.value.toFixed(2) + "%" : ""),
          body: d != null ? "10Y wuxuu " + (Math.abs(d) < 0.005 ? "ahaa isku mid" : (d > 0 ? "kacay +" : "dhacay −") + Math.abs(d).toFixed(2) + "%") + " marka loo eego maalintii hore. 2Y wuxuu si dhow ula socdaa rajada dulsaarka FED." : "2Y wuxuu si dhow ula socdaa rajada dulsaarka FED.",
          chip: null, sources: [fred("DGS10"), fred("DGS2")], priority: 0
        });
      }
    }

    posts.sort(function (a, b) {
      const ta = a.when ? Date.parse(a.when) : 0, tb = b.when ? Date.parse(b.when) : 0;
      // Go'aanka FOMC ee 10-ka maalmood u dambeeyay ayaa had iyo jeer ugu horreeya
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
      return '<article class="post">' +
        '<div class="post-time mono">' + esc(time) + "</div>" +
        '<div class="post-body"><div class="post-title">' + esc(p.title) + "</div>" +
        '<p>' + esc(p.body) + "</p>" +
        '<div class="post-meta">' +
          (p.chip ? '<span class="chip ' + p.chip.cls + '">' + esc(p.chip.text) + "</span>" : "") +
          (p.market ? '<span class="chip">Suuq saadaal</span>' : '<span class="chip ok">✓ Il rasmi ah</span>') +
          p.sources.map(function (s) { return '<a class="small" href="' + esc(s.url) + '" rel="noopener">' + esc(s.name) + "</a>"; }).join("") +
        "</div></div></article>";
    }).join("");
  }

  // ---------- Filashada: cabbirka + fursadaha ----------
  function renderOdds(live) {
    const box = $("odds");
    if (!box) return;
    if (!live || !live.odds) {
      box.innerHTML = '<p class="muted">Fursadaha suuqa saadaasha lama heli karo hadda. Waxaan isku dayi doonnaa mar kale daqiiqad kadib.</p>';
      gauge(null);
      return;
    }
    const o = live.odds;
    const close = o.close ? F.fmtDate(nyDate(o.close)) : "";
    box.innerHTML = '<div class="small muted" style="margin-bottom:10px">Go\'aanka FED · ' + esc(close) + "</div>" +
      o.markets.slice(0, 5).map(function (m) {
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
    // score: -1 (Jilicsan) … +1 (Adag) -> xagal 180° … 0°
    const ang = Math.PI * (1 - (score + 1) / 2);
    const x = 120 + 80 * Math.cos(ang), y = 110 - 80 * Math.sin(ang);
    const label = score > 0.2 ? "ADAG" : score < -0.2 ? "JILICSAN" : "DHEXE";
    const sub = score > 0.2 ? "(Hawkish) · kor u qaadis ayaa la filayaa" : score < -0.2 ? "(Dovish) · dhimis ayaa la filayaa" : "Suuqu wuxuu filayaa hayn";
    const color = score > 0.2 ? "var(--hawk)" : score < -0.2 ? "var(--dove)" : "var(--text)";
    el.innerHTML =
      '<svg width="240" height="130" viewBox="0 0 240 130" role="img" aria-label="Dareenka FED: ' + label + '">' +
      '<path d="M20 110 A100 100 0 0 1 70 23.4" fill="none" stroke="var(--dove)" stroke-width="18"></path>' +
      '<path d="M70 23.4 A100 100 0 0 1 170 23.4" fill="none" stroke="var(--line-2)" stroke-width="18"></path>' +
      '<path d="M170 23.4 A100 100 0 0 1 220 110" fill="none" stroke="var(--hawk)" stroke-width="18"></path>' +
      '<line x1="120" y1="110" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="var(--text)" stroke-width="4" stroke-linecap="round"></line>' +
      '<circle cx="120" cy="110" r="8" fill="var(--text)"></circle></svg>' +
      '<div style="font-family:\'Space Grotesk\',sans-serif;font-size:1.6rem;font-weight:700;color:' + color + '">' + label + "</div>" +
      '<div class="small muted" style="text-align:center">' + esc(sub) + "</div>" +
      '<div class="small muted">Ku salaysan fursadaha suuqa saadaasha</div>';
  }

  // ---------- Go'aanka FOMC oo isla markiiba la muujiyo (FRED wuxuu qaataa 1 maalin) ----------
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

  // ---------- Wararka ----------
  const CAT = { monetary: "Siyaasadda lacagta", press: "Bayaan", speech: "Hadal" };
  let newsFilter = "all";
  function renderNews(live) {
    const el = $("news-list");
    if (!el) return;
    if (!live || !live.news || !live.news.length) { el.innerHTML = '<p class="muted">Wararka lama heli karo hadda. Waxaan isku dayi doonnaa mar kale daqiiqad kadib.</p>'; return; }
    const items = live.news.filter(function (n) { return newsFilter === "all" || n.cat === newsFilter; }).slice(0, 25);
    el.innerHTML = items.map(function (n) {
      return '<article class="news-item">' +
        '<div class="post-meta"><span class="chip' + (n.cat === "monetary" ? " hawk" : "") + '">' + esc(CAT[n.cat] || n.cat) + "</span>" +
        '<span class="small muted">' + (n.date ? esc(ago(n.date)) : "") + "</span>" +
        '<span class="chip ok">✓ federalreserve.gov</span></div>' +
        '<h3 class="news-title" lang="en">' + esc(n.title) + "</h3>" +
        (n.desc ? '<p class="small muted" lang="en">' + esc(n.desc) + "</p>" : "") +
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

  // ---------- Isku xir oo si joogto ah u cusbooneysii ----------
  function refresh(forceLive, forceFed) {
    return Promise.all([loadLive(forceLive), F.load(forceFed)]).then(function (r) {
      const live = r[0], fed = r[1];
      renderPosts($("agent-feed"), buildPosts(fed, live));
      renderOdds(live);
      applyFomc(live);
      renderNews(live);
      const st = $("agent-updated");
      if (st) st.textContent = live ? "La cusbooneysiiyay " + hhmm(new Date()) : "Xogta live waxay shaqaysaa marka website-ka internet-ka la geliyo";
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("agent-feed") && !$("odds") && !$("news-list")) return;
    wireNewsFilter();
    refresh(false, false);
    setInterval(function () { refresh(true, false); }, 60 * 1000);       // live: daqiiqad kasta
    setInterval(function () { refresh(false, true); }, 10 * 60 * 1000);  // FRED: 10-kii daqiiqo
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refresh(true, false); });
  });

  window.LiveData = { loadLive: loadLive, buildPosts: buildPosts };
})();
