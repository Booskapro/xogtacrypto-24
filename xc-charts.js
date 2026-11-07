/* =========================================================
   Charts — Xogta Crypto 24/7
   ---------------------------------------------------------
   Chart kasta: xog dhab ah oo live ah (/api/fed, /api/btc),
   cinwaan iyo "Fiiro gaar ah" oo si toos ah looga xisaabiyo xogta,
   iyo menu (kamarad): soo deji sawir, koobi garee sawir/link, X.
   Sawirka la soo dejiyo: 1200×675 (2×), midabka + luqadda bogga.
   ========================================================= */
(function () {
  "use strict";
  const grid = document.getElementById("xc-grid");
  if (!grid) return;

  const EN = window.I18N && window.I18N.lang === "en";
  const T = (so, en) => (EN ? en : so);
  const MO = EN ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
               : ["Jan", "Feb", "Mar", "Abr", "May", "Jun", "Lul", "Og", "Seb", "Okt", "Nof", "Dis"];
  const C = { pur: "#7C4DFF", blu: "#4C9AFF", grn: "#1F9D6B", red: "#E5484D", org: "#F97316", yel: "#F5B700" };
  const TH = {
    light: { bg: "#FFFFFF", ink: "#0B1220", mut: "#6B7689", grid: "#ECEFF4", box: "#F6F8FB", alt: "#0B1220", red: "rgba(229,72,77,.13)" },
    dark:  { bg: "#0F151D", ink: "#E8EEF4", mut: "#8A97A8", grid: "#1C2733", box: "#0B1017", alt: "#E8EEF4", red: "rgba(229,72,77,.20)" }
  };
  const theme = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtUSD = (v) => "$" + Math.round(v).toLocaleString("en-US");
  const ymLabel = (ym) => MO[+ym.slice(5, 7) - 1] + " " + ym.slice(0, 4);
  const ymShort = (ym) => MO[+ym.slice(5, 7) - 1] + " '" + ym.slice(2, 4);
  const dLabel = (iso) => +iso.slice(8, 10) + " " + MO[+iso.slice(5, 7) - 1] + " " + iso.slice(0, 4);
  const sign = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);

  // ---------- Icons (khad) ----------
  const I = {
    cam: '<svg viewBox="0 0 24 24"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    dl: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="fill"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>'
  };

  // =========================================================
  // Plot — SVG engine (isku mid bogga iyo sawirka)
  // =========================================================
  function Plot(box, th, fs) { this.b = box; this.th = th; this.fs = fs; this.s = ""; }
  Plot.prototype.scale = function (n, mn, mx, log) {
    const b = this.b, f = log ? Math.log10 : (v) => v, a = f(mn), z = f(mx);
    return { n, mn, mx, log, x: (i) => b.x0 + (n < 2 ? 0 : i * (b.x1 - b.x0) / (n - 1)), y: (v) => b.y1 - (f(v) - a) * (b.y1 - b.y0) / (z - a) };
  };
  function niceTicks(mn, mx, cnt) {
    const r = mx - mn, raw = r / cnt, p = Math.pow(10, Math.floor(Math.log10(raw)));
    const st = [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) || p * 10;
    const out = [];
    for (let v = Math.ceil(mn / st) * st; v <= mx + 1e-9; v += st) out.push(+v.toFixed(6));
    return out;
  }
  Plot.prototype.yAxis = function (sc, fmt, right) {
    const b = this.b, th = this.th, fs = this.fs;
    let tv;
    if (sc.log) { tv = []; [1, 2, 5].forEach((m) => { for (let e = 0; e < 8; e++) { const v = m * Math.pow(10, e); if (v >= sc.mn && v <= sc.mx) tv.push(v); } }); tv.sort((p, q) => p - q); }
    else tv = niceTicks(sc.mn, sc.mx, 5);
    tv.forEach((v) => {
      const y = sc.y(v);
      if (!right) this.s += `<line x1="${b.gx0 || b.x0}" x2="${b.gx1 || b.x1}" y1="${y}" y2="${y}" stroke="${th.grid}" stroke-width="1" />`;
      this.s += `<text x="${right ? (b.gx1 || b.x1) + 10 : (b.gx0 || b.x0) - 10}" y="${y + fs * 0.35}" fill="${th.mut}" font-size="${fs}" text-anchor="${right ? "start" : "end"}">${esc(fmt(v))}</text>`;
    });
  };
  Plot.prototype.xLabels = function (sc, labels, maxN) {
    const n = labels.length, step = Math.max(1, Math.ceil(n / maxN));
    const th = this.th, fs = this.fs, y = this.b.y1 + fs * 1.8;
    for (let i = 0; i < n; i += step) this.s += `<text x="${sc.x(i)}" y="${y}" fill="${th.mut}" font-size="${fs}" text-anchor="middle">${esc(labels[i])}</text>`;
  };
  Plot.prototype.line = function (sc, a, col, w, dash) {
    let d = "", pen = false;
    a.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? " L" : " M") + sc.x(i).toFixed(1) + "," + sc.y(v).toFixed(1); pen = true; });
    if (d) this.s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""} />`;
  };
  Plot.prototype.step = function (sc, a, col, w) {
    let d = "";
    a.forEach((v, i) => { if (v == null) return; d += d ? ` H${sc.x(i).toFixed(1)} V${sc.y(v).toFixed(1)}` : `M${sc.x(i).toFixed(1)},${sc.y(v).toFixed(1)}`; });
    if (d) this.s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" />`;
  };
  Plot.prototype.fillWhere = function (sc, a, b, col, cond) {
    for (let i = 0; i < a.length - 1; i++) {
      if (a[i] == null || b[i] == null || a[i + 1] == null || b[i + 1] == null) continue;
      if (!cond(a[i], b[i]) && !cond(a[i + 1], b[i + 1])) continue;
      this.s += `<path d="M${sc.x(i)},${sc.y(a[i])} L${sc.x(i + 1)},${sc.y(a[i + 1])} L${sc.x(i + 1)},${sc.y(b[i + 1])} L${sc.x(i)},${sc.y(b[i])} Z" fill="${col}" />`;
    }
  };
  Plot.prototype.bars = function (sc, a, pos, neg) {
    const bw = Math.max(1.5, (this.b.x1 - this.b.x0) / a.length * 0.66), y0 = sc.y(0);
    a.forEach((v, i) => {
      if (v == null) return;
      const y = sc.y(v);
      this.s += `<rect x="${(sc.x(i) - bw / 2).toFixed(1)}" y="${Math.min(y, y0).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Math.abs(y - y0)).toFixed(1)}" rx="${Math.min(2, bw / 4)}" fill="${v >= 0 ? pos : neg}" />`;
    });
  };
  Plot.prototype.hline = function (sc, v, col, label) {
    const y = sc.y(v), fs = this.fs;
    this.s += `<line x1="${this.b.x0}" x2="${this.b.x1}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="1.6" stroke-dasharray="6 6" />`;
    if (label) this.s += `<text x="${this.b.x0 + 6}" y="${y - fs * 0.6}" fill="${col}" font-size="${fs}" font-weight="600">${esc(label)}</text>`;
  };
  Plot.prototype.dot = function (sc, i, v, col, label, side) {
    const x = sc.x(i), y = sc.y(v), fs = this.fs;
    this.s += `<circle cx="${x}" cy="${y}" r="${fs * 0.75}" fill="${col}" opacity=".22" /><circle cx="${x}" cy="${y}" r="${fs * 0.36}" fill="${col}" stroke="${this.th.bg}" stroke-width="2" />`;
    if (label) {
      const anc = side === "below" ? "end" : "end", dy = side === "below" ? fs * 2.1 : -fs * 1.1;
      this.s += `<text x="${x - fs * 0.6}" y="${y + dy}" fill="${col}" font-size="${fs * 1.45}" font-weight="800" text-anchor="${anc}">${esc(label)}</text>`;
    }
  };
  Plot.prototype.note = function (sc, i, v, txt) {
    const x = sc.x(i), y = sc.y(v), fs = this.fs, right = i < sc.n * 0.6;
    this.s += `<circle cx="${x}" cy="${y}" r="${fs * 0.32}" fill="${this.th.ink}" /><text x="${x + (right ? fs * 0.7 : -fs * 0.7)}" y="${y - fs * 0.7}" fill="${this.th.ink}" font-size="${fs * 1.05}" font-weight="700" text-anchor="${right ? "start" : "end"}">${esc(txt)}</text>`;
  };

  // =========================================================
  // Xogta
  // =========================================================
  let FED = null, BTC = null;
  function fedTargetAt(events, iso) { let t = null; for (const e of events) { if (e.date <= iso) t = e.to; else break; } return t; }
  function fedSeries(months) {
    const ev = FED.target.events;
    return months.map((m) => { const t = fedTargetAt(ev, m + "-31"); return t ? t.hi : null; });
  }
  function monthsWith(field) { return Object.keys(FED.monthly).sort().filter((k) => FED.monthly[k][field] !== undefined); }
  const lastFedMove = () => { const ev = FED.target.events; return ev[ev.length - 1]; };

  // =========================================================
  // Chart-yada (model kasta: cinwaan, xog, sawir)
  // =========================================================
  const CHARTS = [
    {
      id: "cpi-fed", ranges: [[24, "2S", "2Y"], [60, "5S", "5Y"], [120, "10S", "10Y"]], def: 1, need: "fed",
      build(range) {
        const all = monthsWith("cpi"), ms = all.slice(-range);
        const cpi = ms.map((m) => FED.monthly[m].cpi), ff = fedSeries(ms);
        const n = ms.length, L = cpi[n - 1], P = cpi[n - 2], lastM = ms[n - 1];
        // kor/hoos xiriir ah
        let run = 0; const dir = Math.sign(L - P);
        for (let i = n - 1; i > 0 && dir !== 0 && Math.sign(cpi[i] - cpi[i - 1]) === dir; i--) run++;
        let pk = 0; cpi.forEach((v, i) => { if (v > cpi[pk]) pk = i; });
        const mv = lastFedMove(), recent = (Date.now() - new Date(mv.date)) / 864e5 < 400;
        const fedTxt = !recent ? T("FED-na wuu joojiyay", "the Fed is on hold") : mv.kind === "cut" ? T("FED-na wuu dhimayaa", "the Fed keeps cutting") : T("FED-na wuu kordhinayaa", "the Fed keeps hiking");
        const head = dir > 0 ? T(`CPI wuxuu kor u kacay ${L}%`, `CPI rose to ${L}%`) : dir < 0 ? T(`CPI wuxuu hoos u dhacay ${L}%`, `CPI fell to ${L}%`) : T(`CPI wuxuu ku sugan yahay ${L}%`, `CPI holds at ${L}%`);
        const gap = Math.round((L - 2) * 10) / 10;
        const lines = [];
        if (run >= 2) lines.push(dir > 0 ? T(`CPI wuxuu kor u kacay ${run} bilood oo xiriir ah.`, `CPI has risen ${run} months in a row.`) : T(`CPI wuxuu hoos u dhacay ${run} bilood oo xiriir ah.`, `CPI has fallen ${run} months in a row.`));
        lines.push(gap > 0 ? T(`${gap} dhibcood ayuu ka sarreeyaa hadafka 2%.`, `${gap} pts above the 2% target.`) : T(`Wuxuu ka hooseeyaa ama la mid yahay hadafka 2%.`, `At or below the 2% target.`));
        const ffL = ff[n - 1];
        const mx = Math.max(6, Math.ceil(Math.max(...cpi, ...ff.filter((v) => v != null)) + 1));
        return {
          kicker: T("Sicir-barar", "Inflation"),
          title: head + " — " + fedTxt,
          sub: T(`CPI sanadle iyo sicir-dulsaarka FED (heerka sare) · bille · ${ymLabel(ms[0])} – ${ymLabel(lastM)}`, `CPI y/y and Fed funds target (upper) · monthly · ${ymLabel(ms[0])} – ${ymLabel(lastM)}`),
          legend: [[T("CPI (sanadle)", "CPI (y/y)"), C.pur], [T("Sicir-dulsaarka FED", "Fed funds rate"), "alt"], [T("Ka sarreeya hadafka 2%", "Above 2% target"), C.red, "box"]],
          source: "BLS, Federal Reserve, FRED", badge: T("Xogta: ", "Data: ") + ymLabel(lastM),
          note: { t: T("Fiiro gaar ah", "Key point"), lines },
          labels: ms.map(ymShort), n,
          tip: (i) => [[ymLabel(ms[i])], [T("CPI", "CPI"), C.pur, cpi[i] + "%"], ["FED", "alt", ff[i] != null ? ff[i] + "%" : "—"]],
          draw(P, th) {
            const s = P.scale(n, 0, mx);
            P.yAxis(s, (v) => v + "%"); P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.fillWhere(s, cpi, cpi.map(() => 2), th.red, (a, b) => a > b);
            P.hline(s, 2, C.grn, T("Hadafka 2%", "2% target"));
            P.step(s, ff, th.alt, P.fs > 14 ? 3 : 2);
            P.line(s, cpi, C.pur, P.fs > 14 ? 4.5 : 3);
            if (pk > 1 && pk < n - 3) P.note(s, pk, cpi[pk], `${cpi[pk]}% — ${T("ugu sarreeyay", "peak")} (${ymShort(ms[pk])})`);
            if (ffL != null) P.s += `<text x="${s.x(n - 1)}" y="${s.y(ffL) + (ffL > L ? -P.fs * 0.8 : P.fs * 1.6)}" fill="${th.ink}" font-size="${P.fs}" font-weight="700" text-anchor="end">FED ${ffL}%</text>`;
            P.dot(s, n - 1, L, C.red, L + "%", ffL != null && ffL > L ? "below" : "above");
          }
        };
      }
    },
    {
      id: "btc-50-200", ranges: [[104, "2S", "2Y"], [260, "5S", "5Y"], [9999, T("Dhammaan", "All"), "All"]], def: 1, need: "btc", log: true,
      build(range) {
        const w = BTC.weeks.slice(-range).filter((r) => r[2] != null || BTC.weeks.length <= range);
        const n = w.length, cl = w.map((r) => r[1]), a50 = w.map((r) => r[2]), a200 = w.map((r) => r[3]);
        const L = cl[n - 1], m50 = a50[n - 1], m200 = a200[n - 1];
        const above = L >= m50, d50 = ((L / m50 - 1) * 100).toFixed(1), d200 = ((L / m200 - 1) * 100).toFixed(1);
        // toddobaadyo xiriir ah oo dhinac ka ah
        let run = 0; for (let i = n - 1; i >= 0 && a50[i] != null && (cl[i] >= a50[i]) === above; i--) run++;
        const vals = cl.concat(a50, a200).filter((v) => v != null);
        const lo = Math.pow(10, Math.floor(Math.log10(Math.min(...vals)) * 4) / 4), hi = Math.pow(10, Math.ceil(Math.log10(Math.max(...vals)) * 4) / 4);
        const yr = (iso) => (EN ? MO[+iso.slice(5, 7) - 1] + " '" : MO[+iso.slice(5, 7) - 1] + " '") + iso.slice(2, 4);
        return {
          kicker: "Crypto",
          title: above ? T("Bitcoin wuxuu ka sarreeyaa celceliska 50 toddobaad", "Bitcoin is above its 50-week average") : T("Bitcoin wuxuu ka hooseeyaa celceliska 50 toddobaad", "Bitcoin is below its 50-week average"),
          sub: T("BTC/USD xiritaanka toddobaadka (log) · celceliska 50 & 200 toddobaad", "BTC/USD weekly close (log) · 50- & 200-week averages"),
          legend: [["BTC/USD", "alt"], [T("Celceliska 50T", "50-week avg"), C.pur], [T("Celceliska 200T", "200-week avg"), C.grn], [T("Ka hooseeya 50T", "Below 50W"), C.red, "box"]],
          source: BTC.source + ", Hyperliquid", badge: "Live", live: true,
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Qiimaha: ${fmtUSD(L)} · 50T: ${fmtUSD(m50)} (${d50 > 0 ? "+" : ""}${d50}%)`, `Price: ${fmtUSD(L)} · 50W: ${fmtUSD(m50)} (${d50 > 0 ? "+" : ""}${d50}%)`),
            T(`200T: ${fmtUSD(m200)} (${d200 > 0 ? "+" : ""}${d200}%) · ${run} toddobaad ${above ? "ka sarreeya" : "ka hooseeya"} 50T`, `200W: ${fmtUSD(m200)} (${d200 > 0 ? "+" : ""}${d200}%) · ${run} weeks ${above ? "above" : "below"} 50W`)
          ] },
          labels: w.map((r) => yr(r[0])), n,
          tip: (i) => [[T("Toddobaadka ", "Week of ") + dLabel(w[i][0])], ["BTC", "alt", fmtUSD(cl[i])], ["50T", C.pur, a50[i] ? fmtUSD(a50[i]) : "—"], ["200T", C.grn, a200[i] ? fmtUSD(a200[i]) : "—"]],
          draw(P, th) {
            const s = P.scale(n, lo, hi, true);
            P.yAxis(s, (v) => (v >= 1000 ? "$" + v / 1000 + "k" : "$" + v)); P.xLabels(s, w.map((r) => yr(r[0])), P.fs > 14 ? 8 : 5);
            P.fillWhere(s, cl, a50, th.red, (a, b) => a < b);
            P.line(s, a200, C.grn, P.fs > 14 ? 3.5 : 2.4);
            P.line(s, a50, C.pur, P.fs > 14 ? 3.5 : 2.4);
            P.line(s, cl, th.alt, P.fs > 14 ? 2.6 : 1.8);
            P.dot(s, n - 1, L, C.org, fmtUSD(L), "above");
          }
        };
      }
    },
    {
      id: "shaqo", ranges: [[24, "2S", "2Y"], [60, "5S", "5Y"]], def: 0, need: "fed",
      build(range) {
        const all = monthsWith("nfp").filter((m) => FED.monthly[m].un !== undefined), ms = all.slice(-range);
        const nfp = ms.map((m) => FED.monthly[m].nfp), un = ms.map((m) => FED.monthly[m].un);
        const n = ms.length, U = un[n - 1], Up = un[n - 2], N = nfp[n - 1];
        const avg3 = Math.round((nfp[n - 1] + nfp[n - 2] + nfp[n - 3]) / 3);
        const nmin = Math.min(0, ...nfp), nmax = Math.max(...nfp);
        const umin = Math.floor(Math.min(...un) - 0.5), umax = Math.ceil(Math.max(...un) + 0.5);
        const neg = nfp.filter((v) => v < 0).length;
        return {
          kicker: T("Shaqo", "Jobs"),
          title: T(`Shaqo la'aantu waa ${U}% — NFP celcelis 3 bilood: ${sign(avg3)}K`, `Unemployment at ${U}% — 3-month avg payrolls: ${sign(avg3)}K`),
          sub: T(`Shaqooyinka cusub (NFP, kun · bar-yo) iyo shaqo la'aanta (% · khad, dhinaca midig) · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`, `Nonfarm payrolls (K · bars) and unemployment rate (% · line, right) · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`),
          legend: [[T("NFP (shaqooyin cusub)", "Payrolls (NFP)"), C.blu], [T("Hoos u dhac", "Job losses"), C.red], [T("Shaqo la'aanta", "Unemployment"), C.yel]],
          source: "BLS, FRED", badge: T("Xogta: ", "Data: ") + ymLabel(ms[n - 1]),
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`${ymLabel(ms[n - 1])}: NFP ${sign(N)}K · shaqo la'aan ${U}% (bishii hore ${Up}%)`, `${ymLabel(ms[n - 1])}: NFP ${sign(N)}K · unemployment ${U}% (prev ${Up}%)`),
            neg ? T(`${neg} bilood oo shaqooyin la waayay muddadan.`, `${neg} months of job losses in this period.`) : T("Bil kasta shaqooyin ayaa la abuuray muddadan.", "Jobs were added every month in this period.")
          ] },
          labels: ms.map(ymShort), n,
          tip: (i) => [[ymLabel(ms[i])], ["NFP", nfp[i] < 0 ? C.red : C.blu, sign(nfp[i]) + "K"], [T("Shaqo la'aan", "Unemployment"), C.yel, un[i] + "%"]],
          draw(P, th) {
            const pad = (P.b.x1 - P.b.x0) / n * 0.5; P.b = { x0: P.b.x0 + pad, x1: P.b.x1 - pad, y0: P.b.y0, y1: P.b.y1, gx0: P.b.x0, gx1: P.b.x1 };
            const s = P.scale(n, nmin - (nmax - nmin) * 0.08, nmax * 1.12);
            const r = P.scale(n, umin, umax);
            P.yAxis(s, (v) => (v > 0 ? "+" : "") + Math.round(v) + "K"); P.yAxis(r, (v) => v + "%", true);
            P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.bars(s, nfp, C.blu, C.red);
            P.line(r, un, C.yel, P.fs > 14 ? 4 : 2.6);
            P.dot(r, n - 1, U, C.yel, U + "%", "above");
          }
        };
      }
    }
  ];

  // =========================================================
  // Render bogga
  // =========================================================
  const state = {};
  function legendHTML(m) {
    return m.legend.map((l) => `<span><i class="${l[2] === "box" ? "bx" : ""}" style="background:${l[1] === "alt" ? "var(--text)" : l[1]}"></i>${esc(l[0])}</span>`).join("");
  }
  function cardShell(ch) {
    const el = document.createElement("article");
    el.className = "xcc"; el.id = ch.id;
    el.innerHTML = `<div class="xcc-top"><div class="xcc-k"></div><div class="xcc-act">
        <span class="xcc-badge"></span>
        <button class="xcc-ib" data-act="menu" aria-label="${T("Sawir", "Image")}" aria-haspopup="true">${I.cam}</button>
        <button class="xcc-ib" data-act="full" aria-label="${T("Ballaari", "Expand")}">${I.full}</button>
        <div class="xcc-menu" role="menu" hidden>
          <button data-act="dl">${I.dl}${T("Soo deji sawirka", "Download image")}</button>
          <button data-act="copy">${I.copy}${T("Koobi garee sawirka", "Copy image")}</button>
          <button data-act="link">${I.link}${T("Koobi garee link-ga", "Copy link")}</button>
          <hr><button data-act="x">${I.x}${T("Ku wadaag X", "Share on X")}</button>
        </div></div></div>
      <h2 class="xcc-t"></h2><p class="xcc-s"></p><div class="xcc-lg"></div>
      <div class="xcc-plot"><div class="xcc-load">${T("Xogta ayaa soo socota…", "Loading data…")}</div></div>
      <div class="xcc-bot"><div class="xcc-rg"></div><div class="xcc-src"></div></div>
      <div class="xcc-note"></div>`;
    grid.appendChild(el);
    state[ch.id] = { ch, el, range: ch.ranges[ch.def][0], model: null };
    const rg = el.querySelector(".xcc-rg");
    rg.innerHTML = ch.ranges.map((r, k) => `<button data-r="${r[0]}" class="${k === ch.def ? "on" : ""}">${esc(EN ? r[2] : r[1])}</button>`).join("");
    return el;
  }

  function renderCard(id) {
    const st = state[id], ch = st.ch, el = st.el;
    if ((ch.need === "fed" && !FED) || (ch.need === "btc" && !BTC)) return;
    let m;
    try { m = ch.build(st.range); } catch (e) { el.querySelector(".xcc-plot").innerHTML = `<div class="xcc-load">${T("Xogta lama heli karo hadda.", "Data unavailable right now.")}</div>`; return; }
    st.model = m;
    el.querySelector(".xcc-k").textContent = m.kicker;
    el.querySelector(".xcc-t").textContent = m.title;
    el.querySelector(".xcc-s").textContent = m.sub;
    el.querySelector(".xcc-lg").innerHTML = legendHTML(m);
    el.querySelector(".xcc-src").textContent = T("Isha: ", "Source: ") + m.source;
    el.querySelector(".xcc-badge").innerHTML = (m.live ? '<b class="pulse"></b>' : "<b></b>") + esc(m.badge);
    el.querySelector(".xcc-note").innerHTML = `<b>${esc(m.note.t)}</b>${m.note.lines.map((l) => `<span>${esc(l)}</span>`).join("")}`;
    const box = el.querySelector(".xcc-plot"), W = Math.max(280, Math.round(box.clientWidth)), mob = W < 560;
    const H = mob ? 260 : Math.round(Math.min(420, W * 0.46));
    const th = TH[theme()], fs = mob ? 10.5 : 12;
    const P = new Plot({ x0: mob ? 44 : 54, x1: W - (ch.id === "shaqo" ? (mob ? 38 : 48) : 12), y0: 14, y1: H - 28 }, th, fs);
    m.draw(P, th);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(m.title)}">${P.s}<g class="xh"></g></svg><div class="xcc-tip" hidden></div>`;
    st.P = P; st.W = W; st.H = H;
  }

  // Tooltip (mouse / farta)
  function onMove(e) {
    const box = e.target.closest(".xcc-plot"); if (!box) return;
    const el = box.closest(".xcc"), st = state[el.id]; if (!st || !st.model || !st.P) return;
    const svg = box.querySelector("svg"), r = svg.getBoundingClientRect();
    const pt = e.touches ? e.touches[0] : e, x = (pt.clientX - r.left) * (st.W / r.width);
    const b = st.P.b, n = st.model.n, i = Math.max(0, Math.min(n - 1, Math.round((x - b.x0) / (b.x1 - b.x0) * (n - 1))));
    const xi = b.x0 + (n < 2 ? 0 : i * (b.x1 - b.x0) / (n - 1)), th = TH[theme()];
    svg.querySelector(".xh").innerHTML = `<line x1="${xi}" x2="${xi}" y1="${b.y0}" y2="${b.y1}" stroke="${th.mut}" stroke-width="1" stroke-dasharray="3 3" />`;
    const rows = st.model.tip(i), tip = box.querySelector(".xcc-tip");
    tip.innerHTML = `<b>${esc(rows[0][0])}</b>` + rows.slice(1).map((rw) => `<span><i style="background:${rw[1] === "alt" ? "var(--text)" : rw[1]}"></i>${esc(rw[0])}<em>${esc(rw[2])}</em></span>`).join("");
    tip.hidden = false;
    const px = xi / st.W * r.width;
    tip.style.left = Math.min(r.width - tip.offsetWidth - 4, Math.max(4, px + (px > r.width / 2 ? -tip.offsetWidth - 12 : 12))) + "px";
  }
  function onLeave(e) {
    const box = e.target.closest && e.target.closest(".xcc-plot"); if (!box) return;
    const t = box.querySelector(".xcc-tip"); if (t) t.hidden = true;
    const h = box.querySelector(".xh"); if (h) h.innerHTML = "";
  }

  // =========================================================
  // Sawirka (export) — 1200×675, SVG → PNG
  // =========================================================
  let fontCSS = null, logoURI = null;
  async function toDataURI(url) {
    const b = await (await fetch(url)).blob();
    return await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(b); });
  }
  async function embedFonts() {
    if (fontCSS !== null) return fontCSS;
    try {
      const css = await (await fetch("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Inter+Tight:wght@700;800&display=swap")).text();
      const blocks = css.split("@font-face").slice(1).filter((b) => /U\+0000-00FF/.test(b));
      const out = await Promise.all(blocks.map(async (b) => {
        const fam = (b.match(/font-family:\s*'([^']+)'/) || [])[1], wt = (b.match(/font-weight:\s*(\d+)/) || [])[1], url = (b.match(/url\(([^)]+)\)/) || [])[1];
        if (!fam || !url) return "";
        return `@font-face{font-family:'${fam}';font-weight:${wt};src:url(${await toDataURI(url)}) format('woff2');}`;
      }));
      fontCSS = out.join("");
    } catch (e) { fontCSS = ""; }
    return fontCSS;
  }
  function wrapTitle(t, max) {
    if (t.length <= max) return [t];
    const words = t.split(" "), lines = [""];
    words.forEach((w) => { if ((lines[lines.length - 1] + " " + w).trim().length > max && lines.length < 2) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); });
    return lines;
  }
  async function exportSVG(id) {
    const st = state[id], m = st.model, th = TH[theme()], W = 1200, H = 675;
    const [fonts, logo] = await Promise.all([embedFonts(), logoURI || toDataURI("logo.svg").then((u) => (logoURI = u))]);
    const F = "Inter, 'Helvetica Neue', Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
    const tl = wrapTitle(m.title, 58), tfs = tl.length > 1 ? 30 : 34;
    let s = `<rect width="${W}" height="${H}" fill="${th.bg}" />`;
    s += `<text x="44" y="56" font-family="${F}" font-size="14" font-weight="700" letter-spacing="2.6" fill="#4C9AFF">${esc(m.kicker.toUpperCase())}</text>`;
    tl.forEach((l, k) => { s += `<text x="44" y="${98 + k * (tfs + 6)}" font-family="${FD}" font-size="${tfs}" font-weight="700" fill="${th.ink}">${esc(l)}</text>`; });
    let y = 98 + (tl.length - 1) * (tfs + 6) + 30;
    s += `<text x="44" y="${y}" font-family="${F}" font-size="16" fill="${th.mut}">${esc(m.sub)}</text>`;
    y += 32; let lx = 44;
    m.legend.forEach((l) => {
      const col = l[1] === "alt" ? th.alt : l[1];
      s += l[2] === "box" ? `<rect x="${lx}" y="${y - 11}" width="18" height="12" rx="3" fill="${col}" opacity=".45" />` : `<rect x="${lx}" y="${y - 7}" width="22" height="4" rx="2" fill="${col}" />`;
      s += `<text x="${lx + 30}" y="${y}" font-family="${F}" font-size="15" fill="${th.ink}">${esc(l[0])}</text>`;
      lx += 30 + l[0].length * 8.2 + 30;
    });
    // badge
    s += `<rect x="${W - 44 - (m.badge.length * 8 + 34)}" y="36" width="${m.badge.length * 8 + 34}" height="28" rx="14" fill="rgba(31,157,107,.12)" /><circle cx="${W - 44 - (m.badge.length * 8 + 34) + 16}" cy="50" r="4.5" fill="#1F9D6B" /><text x="${W - 44 - 12}" y="55" font-family="${F}" font-size="13.5" font-weight="700" fill="#1F9D6B" text-anchor="end">${esc(m.badge)}</text>`;
    const box = { x0: 86, x1: W - (st.ch.id === "shaqo" ? 84 : 60), y0: y + 34, y1: H - 96 };
    const P = new Plot(box, th, 15);
    P.s += `<text x="${(box.x0 + box.x1) / 2}" y="${(box.y0 + box.y1) / 2 + 36}" text-anchor="middle" font-family="${FD}" font-weight="800" font-size="96" fill="${th.ink}" opacity="${theme() === "dark" ? 0.05 : 0.045}">Xogta Crypto</text>`;
    m.draw(P, th);
    s += `<g font-family="${F}">${P.s}</g>`;
    // Fiiro gaar ah
    if (m.note) {
      const nw = Math.max(...m.note.lines.map((l) => l.length)) * 7.6 + 36, nh = 44 + m.note.lines.length * 23;
      const nx = st.ch.id === "btc-50-200" ? box.x0 + 16 : box.x1 - nw - 16, ny = box.y0 + 4;
      s += `<rect x="${nx}" y="${ny}" width="${nw}" height="${nh}" rx="12" fill="${th.box}" stroke="${th.grid}" stroke-width="1.5" opacity=".96" />`;
      s += `<text x="${nx + 16}" y="${ny + 28}" font-family="${F}" font-size="15.5" font-weight="700" fill="${th.ink}">${esc(m.note.t)}</text>`;
      m.note.lines.forEach((l, k) => { s += `<text x="${nx + 16}" y="${ny + 52 + k * 23}" font-family="${F}" font-size="14.5" fill="${th.mut}">${esc(l)}</text>`; });
    }
    // footer
    const host = location.host || "xogtacrypto.vercel.app";
    s += `<text x="44" y="${H - 34}" font-family="${F}" font-size="14.5" fill="${th.mut}">© ${new Date().getFullYear()} Xogta Crypto 24/7 · ${esc(T("Isha", "Source"))}: ${esc(m.source)} · ${esc(host)}</text>`;
    s += `<image href="${logo}" x="${W - 44 - 290}" y="${H - 62}" width="38" height="38" /><text x="${W - 44}" y="${H - 34}" font-family="${FD}" font-size="25" font-weight="800" fill="${th.ink}" text-anchor="end">Xogta Crypto 24/7</text>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><style>${fonts}</style>${s}</svg>`;
  }
  async function exportPNG(id) {
    const svg = await exportSVG(id);
    const img = new Image();
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    await img.decode();
    const cv = document.createElement("canvas"); cv.width = 2400; cv.height = 1350;
    const cx = cv.getContext("2d"); cx.drawImage(img, 0, 0, 2400, 1350);
    return await new Promise((ok) => cv.toBlob(ok, "image/png"));
  }
  const fileName = (id) => `xogta-crypto-${id}-${new Date().toISOString().slice(0, 10)}.png`;
  const chartURL = (id) => location.origin + location.pathname.replace(/\.html$/, "") + "#" + id;
  function shareText(id) { const m = state[id].model; return m.title + "\n\n" + chartURL(id) + "\n" + (window.SITE && window.SITE.x_handle ? window.SITE.x_handle : ""); }

  let toastT;
  function toast(msg) {
    let t = document.getElementById("xc-toast");
    if (!t) { t = document.createElement("div"); t.id = "xc-toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2600);
  }
  const isTouch = () => matchMedia("(pointer: coarse)").matches;

  async function act(kind, id, btn) {
    const st = state[id]; if (!st || !st.model) return;
    closeMenus();
    try {
      if (kind === "link") { await navigator.clipboard.writeText(chartURL(id)); toast(T("Link-ga waa la koobiyeeyay", "Link copied")); return; }
      if (kind === "copy") {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": exportPNG(id) })]);
        toast(T("Sawirka waa la koobiyeeyay", "Image copied")); return;
      }
      if (kind === "dl" || kind === "x") {
        btn && btn.classList.add("busy");
        const blob = await exportPNG(id), file = new File([blob], fileName(id), { type: "image/png" });
        btn && btn.classList.remove("busy");
        // Taleefanka: share sheet (Kaydi sawirka / X / Telegram)
        if (isTouch() && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(kind === "x" ? { files: [file], text: shareText(id) } : { files: [file] });
          return;
        }
        if (kind === "dl") {
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fileName(id);
          document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
          toast(T("Sawirka waa la soo dejiyay", "Image downloaded")); return;
        }
        // Kombiyuutarka: sawirka koobi garee, kadib fur X
        try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); toast(T("Sawirka waa la koobiyeeyay — X-ka ku dheji (Ctrl+V)", "Image copied — paste it into X (Ctrl+V)")); } catch (e) { /* ignore */ }
        window.open("https://x.com/intent/post?text=" + encodeURIComponent(shareText(id)), "_blank", "noopener");
      }
    } catch (e) {
      btn && btn.classList.remove("busy");
      if (e && e.name === "AbortError") return;
      toast(T("Waan ka xumahay, isku day mar kale", "Sorry, please try again"));
    }
  }

  function closeMenus() { grid.querySelectorAll(".xcc-menu").forEach((m) => { m.hidden = true; }); grid.querySelectorAll('[data-act="menu"]').forEach((b) => b.classList.remove("on")); }

  grid.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const el = b.closest(".xcc"), id = el && el.id;
    if (b.dataset.r) { state[id].range = +b.dataset.r; el.querySelectorAll(".xcc-rg button").forEach((x) => x.classList.toggle("on", x === b)); renderCard(id); return; }
    const a = b.dataset.act;
    if (a === "menu") { const m = el.querySelector(".xcc-menu"), open = m.hidden; closeMenus(); m.hidden = !open; b.classList.toggle("on", open); return; }
    if (a === "full") { const on = !el.classList.contains("full"); el.classList.toggle("full", on); document.body.classList.toggle("xc-noscroll", on); b.innerHTML = on ? I.close : I.full; renderCard(id); return; }
    if (a) act(a, id, b);
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".xcc-act")) closeMenus(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeMenus(); const f = grid.querySelector(".xcc.full"); if (f) f.querySelector('[data-act="full"]').click(); } });
  grid.addEventListener("mousemove", onMove); grid.addEventListener("touchmove", onMove, { passive: true }); grid.addEventListener("touchstart", onMove, { passive: true });
  grid.addEventListener("mouseleave", onLeave, true); grid.addEventListener("touchend", onLeave, true);
  grid.addEventListener("mouseout", (e) => { if (e.target.closest && e.target.closest(".xcc-plot") && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(".xcc-plot"))) onLeave(e); });

  // =========================================================
  // Bilow + cusboonaysiin
  // =========================================================
  CHARTS.forEach(cardShell);
  const renderAll = () => Object.keys(state).forEach(renderCard);
  async function loadFed() {
    try { const r = await fetch("/api/fed", { cache: "no-store" }); const j = await r.json(); if (j && j.monthly) { FED = j; renderAll(); } else throw 0; }
    catch (e) { if (!FED) Object.values(state).filter((s) => s.ch.need === "fed").forEach((s) => { s.el.querySelector(".xcc-plot").innerHTML = `<div class="xcc-load">${T("Xogta lama heli karo hadda. Isku day mar kale.", "Data unavailable. Please try again.")}</div>`; }); }
  }
  async function loadBtc() {
    try { const r = await fetch("/api/btc", { cache: "no-store" }); const j = await r.json(); if (j && j.weeks) { BTC = j; renderCard("btc-50-200"); } else throw 0; }
    catch (e) { if (!BTC) state["btc-50-200"].el.querySelector(".xcc-plot").innerHTML = `<div class="xcc-load">${T("Xogta lama heli karo hadda. Isku day mar kale.", "Data unavailable. Please try again.")}</div>`; }
  }
  loadFed(); loadBtc();
  setInterval(loadBtc, 5 * 60 * 1000);     // Bitcoin: 5 daqiiqo kasta
  setInterval(loadFed, 30 * 60 * 1000);    // FED/BLS: 30 daqiiqo kasta
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(renderAll, 150); });
  new MutationObserver(renderAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // Link gaar ah: charts#btc-50-200
  if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 600);

  window.XCCharts = { state, exportSVG, exportPNG }; // tijaabo
})();
