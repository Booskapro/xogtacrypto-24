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
  const F1 = (v) => v.toFixed(1) + "%", F2 = (v) => v.toFixed(2) + "%", FT = (v) => "$" + v.toFixed(2) + "T", FU = (v) => "$" + Math.round(v).toLocaleString("en-US");
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
    if (sc.log) {
      tv = []; (sc.mx / sc.mn > 12 ? [1, 2, 5] : [1, 1.25, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8]).forEach((m) => { for (let e = 0; e < 8; e++) { const v = m * Math.pow(10, e); if (v >= sc.mn && v <= sc.mx) tv.push(v); } }); tv.sort((p, q) => p - q);
      if (tv.length > 6) { const keep = []; const st = (tv.length - 1) / 5; for (let k = 0; k < 6; k++) keep.push(tv[Math.round(k * st)]); tv = [...new Set(keep)]; }
    }
    else tv = niceTicks(sc.mn, sc.mx, 5);
    tv.forEach((v) => {
      const y = sc.y(v);
      if (!right) this.s += `<line x1="${b.gx0 || b.x0}" x2="${b.gx1 || b.x1}" y1="${y}" y2="${y}" stroke="${th.grid}" stroke-width="1" />`;
      const t = `<text x="${right ? (b.gx1 || b.x1) + 10 : (b.gx0 || b.x0) - 10}" y="${y + fs * 0.35}" fill="${th.mut}" font-size="${fs}" text-anchor="${right ? "start" : "end"}">${esc(fmt(v))}</text>`;
      if (right) (this.rlab = this.rlab || []).push([y, t]); else this.s += t;
    });
  };
  // Axis-ka hoose: sanadaha oo keliya (2022, 2023 …), sida website-yada xirfadda leh
  // Axis-ka hoose: sanado (muddo dheer) ama bilo (sanad gudihiis)
  Plot.prototype.xLabels = function (sc, labels) {
    const th = this.th, fs = this.fs, y = this.b.y1 + fs * 1.9;
    const parse = (l) => { const mm = String(l).match(/^(\S+)\s+'(\d{2})$/); return mm ? { m: mm[1], y: 2000 + +mm[2] } : null; };
    const P0 = labels.map(parse), yt = [], mt = [];
    for (let i = 1; i < P0.length; i++) { if (!P0[i] || !P0[i - 1]) continue; if (P0[i].y !== P0[i - 1].y) yt.push([i, String(P0[i].y)]); if (P0[i].m !== P0[i - 1].m) mt.push([i, P0[i].y !== P0[i - 1].y ? String(P0[i].y) : P0[i].m]); }
    let ticks = yt.length >= 2 ? yt : mt;
    if (ticks === mt) { const step = Math.max(1, Math.ceil(mt.length / 7)); ticks = mt.filter((t, k) => k % step === 0 || /^\d{4}$/.test(t[1])); }
    else { const step = Math.max(1, Math.ceil(yt.length / 10)); ticks = yt.filter((t, k) => k % step === 0); }
    ticks.forEach((t) => { const x = sc.x(t[0]); this.s += `<line x1="${x}" x2="${x}" y1="${this.b.y1}" y2="${this.b.y1 + 5}" stroke="${th.grid}" /><text x="${x}" y="${y}" fill="${th.mut}" font-size="${fs}" text-anchor="middle"${/^\d{4}$/.test(t[1]) ? ' font-weight="600"' : ""}>${esc(t[1])}</text>`; });
  };
  // Khad jilicsan (monotone cubic) — ma dhaafo qiimaha dhabta ah
  function smoothD(pts) {
    if (pts.length < 3) return pts.map((p, k) => (k ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const n = pts.length, dx = [], m = [], t = [];
    for (let k = 0; k < n - 1; k++) { dx[k] = pts[k + 1][0] - pts[k][0]; m[k] = (pts[k + 1][1] - pts[k][1]) / (dx[k] || 1); }
    t[0] = m[0]; t[n - 1] = m[n - 2];
    for (let k = 1; k < n - 1; k++) t[k] = m[k - 1] * m[k] <= 0 ? 0 : (m[k - 1] + m[k]) / 2;
    for (let k = 0; k < n - 1; k++) { if (m[k] === 0) { t[k] = 0; t[k + 1] = 0; continue; } const a = t[k] / m[k], b = t[k + 1] / m[k], h = a * a + b * b; if (h > 9) { const q = 3 / Math.sqrt(h); t[k] = q * a * m[k]; t[k + 1] = q * b * m[k]; } }
    let d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (let k = 0; k < n - 1; k++) { const h = dx[k] / 3; d += ` C${(pts[k][0] + h).toFixed(1)},${(pts[k][1] + t[k] * h).toFixed(1)} ${(pts[k + 1][0] - h).toFixed(1)},${(pts[k + 1][1] - t[k + 1] * h).toFixed(1)} ${pts[k + 1][0].toFixed(1)},${pts[k + 1][1].toFixed(1)}`; }
    return d;
  }
  function segments(sc, a) { const out = []; let cur = []; a.forEach((v, i) => { if (v == null) { if (cur.length) out.push(cur); cur = []; } else cur.push([sc.x(i), sc.y(v)]); }); if (cur.length) out.push(cur); return out; }
  let gid = 0;
  Plot.prototype.line = function (sc, a, col, w, dash) {
    if (this.hid && this.hid.has(col)) return;
    segments(sc, a).forEach((pts) => { this.s += `<path d="${smoothD(pts)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ""} />`; });
  };
  // Khad toos ah (maalinle, aan la jilcin) — sida Bitview / TradingView
  Plot.prototype.raw = function (sc, a, col, w) {
    if (this.hid && this.hid.has(col)) return;
    segments(sc, a).forEach((pts) => { this.s += `<path d="${pts.map((p, k) => (k ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linejoin="round" />`; });
  };
  // Midab hoose oo gradient ah (jilicsan)
  Plot.prototype.area = function (sc, a, col, base) {
    if (this.hid && this.hid.has(col)) return;
    const id = "xg" + (++gid), yb = sc.y(base == null ? sc.mn : base);
    this.s += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22" /><stop offset="1" stop-color="${col}" stop-opacity="0" /></linearGradient></defs>`;
    segments(sc, a).forEach((pts) => { this.s += `<path d="${smoothD(pts)} L${pts[pts.length - 1][0].toFixed(1)},${yb} L${pts[0][0].toFixed(1)},${yb} Z" fill="url(#${id})" />`; });
  };
  Plot.prototype.stepArea = function (sc, a, col) {
    if (this.hid && this.hid.has(col)) return;
    const id = "xg" + (++gid); let d = "", lx = 0;
    a.forEach((v, i) => { if (v == null) return; d += d ? ` H${sc.x(i).toFixed(1)} V${sc.y(v).toFixed(1)}` : `M${sc.x(i).toFixed(1)},${sc.y(sc.mn)} V${sc.y(v).toFixed(1)}`; lx = sc.x(i); });
    if (d) this.s += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".22" /><stop offset="1" stop-color="${col}" stop-opacity="0" /></linearGradient></defs><path d="${d} V${sc.y(sc.mn)} Z" fill="url(#${id})" />`;
  };
  Plot.prototype.step = function (sc, a, col, w) {
    if (this.hid && this.hid.has(col)) return;
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
      if (v == null || (this.hid && this.hid.has(v >= 0 ? pos : neg))) return;
      const y = sc.y(v);
      this.s += `<rect x="${(sc.x(i) - bw / 2).toFixed(1)}" y="${Math.min(y, y0).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, Math.abs(y - y0)).toFixed(1)}" rx="${Math.min(2, bw / 4)}" fill="${v >= 0 ? pos : neg}" />`;
    });
  };
  Plot.prototype.hline = function (sc, v, col, label) {
    const y = sc.y(v);
    this.s += `<line x1="${this.b.x0}" x2="${this.b.x1}" y1="${y}" y2="${y}" stroke="${col}" stroke-width="1.2" stroke-dasharray="4 5" opacity=".9" />`;
    if (label) this.tag(y, col, label, true);
  };
  // Calaamadda qiimaha (dhinaca midig, sida TradingView)
  Plot.prototype.tag = function (y, col, text, soft) { if (this.hid && this.hid.has(col)) return; (this.tags = this.tags || []).push({ y, col, text: String(text), soft }); };
  Plot.prototype.dot = function (sc, i, v, col, label) {
    if (this.hid && this.hid.has(col)) return;
    const x = sc.x(i), y = sc.y(v), fs = this.fs;
    this.s += `<circle cx="${x}" cy="${y}" r="${fs * 0.62}" fill="${col}" opacity=".18" /><circle cx="${x}" cy="${y}" r="${fs * 0.3}" fill="${col}" stroke="${this.th.bg}" stroke-width="1.6" />`;
    if (label) this.tag(y, col, label);
  };
  Plot.prototype.note = function () { /* qoraallada chart-ka dushiisa waa la saaray (nadiif) */ };
  Plot.prototype.finish = function () {
    const tg = (this.tags || []).slice().sort((a, b) => a.y - b.y), fs = this.fs, h = fs * 1.65, gap = 3, b = this.b;
    for (let k = 1; k < tg.length; k++) if (tg[k].y - tg[k - 1].y < h + gap) tg[k].y = tg[k - 1].y + h + gap;
    const over = tg.length ? tg[tg.length - 1].y + h / 2 - (b.y1 + h / 2) : 0;
    if (over > 0) tg.forEach((t) => { t.y -= over; });
    for (let k = tg.length - 2; k >= 0; k--) if (tg[k + 1].y - tg[k].y < h + gap) tg[k].y = tg[k + 1].y - h - gap;
    const x = (b.gx1 || b.x1) + 6;
    (this.rlab || []).forEach((r) => { if (!tg.some((t) => Math.abs(t.y - r[0]) < h)) this.s += r[1]; });
    tg.forEach((t) => {
      const w = t.text.length * fs * 0.62 + fs * 1.1, light = /^#(F5B700|FFFFFF|E8EEF4|84CC16)/i.test(t.col);
      const fg = t.soft ? t.col : light || t.col === this.th.ink ? this.th.bg : "#FFFFFF";
      this.s += t.soft
        ? `<rect x="${x}" y="${t.y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${this.th.bg}" stroke="${t.col}" stroke-width="1" />`
        : `<rect x="${x}" y="${t.y - h / 2}" width="${w}" height="${h}" rx="4" fill="${t.col}" />`;
      this.s += `<text x="${x + w / 2}" y="${t.y + fs * 0.36}" fill="${fg}" font-size="${fs * 0.95}" font-weight="700" text-anchor="middle">${esc(t.text)}</text>`;
    });
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
      id: "cpi-fed", cat: "infl", notePos: "tr", ranges: [[12, "1S", "1Y"], [24, "2S", "2Y"], [60, "5S", "5Y"], [120, "10S", "10Y"]], def: 2, need: "fed",
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
          legend: [[T("CPI (sanadle)", "CPI (y/y)"), C.pur], [T("Sicir-dulsaarka FED", "Fed funds rate"), "alt"]],
          source: "BLS, Federal Reserve, FRED", badge: T("Xogta: ", "Data: ") + ymLabel(lastM),
          note: { t: T("Fiiro gaar ah", "Key point"), lines },
          series: [{ name: "CPI", color: C.pur, type: "area", data: ms.map((m, i) => [m + "-01", cpi[i]]), fmt: F1, lines: [[2, C.grn, "2%"]] }, { name: "FED", color: "alt", type: "step", data: ms.map((m, i) => [m + "-01", ff[i]]), fmt: F2 }],
          labels: ms.map(ymShort), n,
          tip: (i) => [[ymLabel(ms[i])], [T("CPI", "CPI"), C.pur, cpi[i] + "%"], ["FED", "alt", ff[i] != null ? ff[i] + "%" : "—"]],
          draw(P, th) {
            const s = P.scale(n, 0, mx);
            P.yAxis(s, (v) => v + "%"); P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.area(s, cpi, C.pur);
            P.hline(s, 2, C.grn, "2%");
            P.step(s, ff, th.alt, P.fs > 14 ? 3 : 2);
            P.line(s, cpi, C.pur, P.fs > 14 ? 3.6 : 2.4);
            if (pk > 1 && pk < n - 3) P.note(s, pk, cpi[pk], `${cpi[pk]}% — ${T("ugu sarreeyay", "peak")} (${ymShort(ms[pk])})`);
            if (ffL != null) P.tag(s.y(ffL), th.alt, "FED " + ffL + "%");
            P.dot(s, n - 1, L, C.pur, L + "%");
          }
        };
      }
    },
    {
      id: "btc-50-200", cat: "crypto", notePos: "tl", ranges: [[52, "1S", "1Y"], [104, "2S", "2Y"], [260, "5S", "5Y"], [9999, T("Dhammaan", "All"), "All"]], def: 2, need: "btc", log: true,
      build(range) {
        let w = BTC.weeks.slice(-range).filter((r) => r[2] != null || BTC.weeks.length <= range), daily = false;
        if (BTC.daily && BTC.daily.length > 60 && range < 9999) {
          // Maalinle: qiimaha maalin kasta + celcelisyada toddobaadka (isku xidhan si toos ah)
          const wk = BTC.weeks, t = (d) => Date.parse(d + "T00:00:00Z"), cut = Date.now() - range * 7 * 864e5;
          let k = 0;
          const rows = BTC.daily.filter((d) => t(d[0]) >= cut).map((d) => {
            const td = t(d[0]); while (k < wk.length - 2 && t(wk[k + 1][0]) <= td) k++;
            const a = wk[k], b = wk[Math.min(k + 1, wk.length - 1)], f = b === a ? 0 : Math.max(0, Math.min(1, (td - t(a[0])) / (t(b[0]) - t(a[0]))));
            const lerp = (x, y) => (x == null || y == null ? x : Math.round(x + (y - x) * f));
            return [d[0], d[1], lerp(a[2], b[2]), lerp(a[3], b[3])];
          });
          if (rows.length > 30) { w = rows; daily = true; }
        }
        const n = w.length, cl = w.map((r) => r[1]), a50 = w.map((r) => r[2]), a200 = w.map((r) => r[3]);
        const L = cl[n - 1], m50 = a50[n - 1], m200 = a200[n - 1];
        const above = L >= m50, d50 = ((L / m50 - 1) * 100).toFixed(1), d200 = ((L / m200 - 1) * 100).toFixed(1);
        // toddobaadyo xiriir ah oo dhinac ka ah
        const WK = BTC.weeks; let run = 0; for (let i = WK.length - 1; i >= 0 && WK[i][2] != null && (WK[i][1] >= WK[i][2]) === above; i--) run++;
        const vals = cl.concat(a50, a200).filter((v) => v != null);
        const lo = Math.min(...vals) * 0.9, hi = Math.max(...vals) * 1.08;
        const yr = (iso) => (EN ? MO[+iso.slice(5, 7) - 1] + " '" : MO[+iso.slice(5, 7) - 1] + " '") + iso.slice(2, 4);
        return {
          kicker: "Crypto",
          title: above ? T("Bitcoin wuxuu ka sarreeyaa celceliska 50 toddobaad", "Bitcoin is above its 50-week average") : T("Bitcoin wuxuu ka hooseeyaa celceliska 50 toddobaad", "Bitcoin is below its 50-week average"),
          sub: daily ? T("BTC/USD maalinle (log) · celceliska 50 & 200 toddobaad", "BTC/USD daily (log) · 50- & 200-week averages") : T("BTC/USD xiritaanka toddobaadka (log) · celceliska 50 & 200 toddobaad", "BTC/USD weekly close (log) · 50- & 200-week averages"),
          legend: [[T("Qiimaha", "Price"), "alt"], [T("Celceliska 50T", "50-week avg"), C.org], [T("Celceliska 200T", "200-week avg"), C.grn]],
          source: BTC.source + ", Hyperliquid", badge: "Live", live: true,
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Qiimaha: ${fmtUSD(L)} · 50T: ${fmtUSD(m50)} (${d50 > 0 ? "+" : ""}${d50}%)`, `Price: ${fmtUSD(L)} · 50W: ${fmtUSD(m50)} (${d50 > 0 ? "+" : ""}${d50}%)`),
            T(`200T: ${fmtUSD(m200)} (${d200 > 0 ? "+" : ""}${d200}%) · ${run} toddobaad ${above ? "ka sarreeya" : "ka hooseeya"} 50T`, `200W: ${fmtUSD(m200)} (${d200 > 0 ? "+" : ""}${d200}%) · ${run} weeks ${above ? "above" : "below"} 50W`)
          ] },
          series: [{ name: T("Qiimaha", "Price"), color: "alt", type: "thin", data: w.map((r, i) => [r[0], cl[i]]), fmt: FU, log: true }, { name: T("50T", "50W"), color: C.org, type: "line", data: w.map((r, i) => [r[0], a50[i]]), fmt: FU }, { name: T("200T", "200W"), color: C.grn, type: "line", data: w.map((r, i) => [r[0], a200[i]]), fmt: FU }],
          labels: w.map((r) => yr(r[0])), n,
          tip: (i) => [[(daily ? "" : T("Toddobaadka ", "Week of ")) + dLabel(w[i][0])], ["BTC", "alt", fmtUSD(cl[i])], ["50T", C.org, a50[i] ? fmtUSD(a50[i]) : "—"], ["200T", C.grn, a200[i] ? fmtUSD(a200[i]) : "—"]],
          draw(P, th) {
            const s = P.scale(n, lo, hi, true);
            P.yAxis(s, (v) => (v >= 1000 ? "$" + v / 1000 + "k" : "$" + v)); P.xLabels(s, w.map((r) => yr(r[0])), P.fs > 14 ? 8 : 5);
            P.line(s, a200, C.grn, P.fs > 14 ? 2.2 : 1.5);
            P.line(s, a50, C.org, P.fs > 14 ? 2.2 : 1.5);
            P.raw(s, cl, th.alt, P.fs > 14 ? 1.8 : 1.2);
            P.dot(s, n - 1, L, th.alt, fmtUSD(L));
            P.tag(s.y(m50), C.org, fmtUSD(m50));
          }
        };
      }
    },
    {
      id: "shaqo", cat: "jobs", notePos: "tr", ranges: [[12, "1S", "1Y"], [24, "2S", "2Y"], [60, "5S", "5Y"]], def: 1, need: "fed",
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
          legend: [[T("NFP (shaqooyin cusub)", "Payrolls (NFP)"), C.blu], [T("Hoos u dhac", "Job losses"), C.red], [T("Shaqo la'aanta", "Unemployment"), "alt"]],
          source: "BLS, FRED", badge: T("Xogta: ", "Data: ") + ymLabel(ms[n - 1]),
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`${ymLabel(ms[n - 1])}: NFP ${sign(N)}K · shaqo la'aan ${U}% (bishii hore ${Up}%)`, `${ymLabel(ms[n - 1])}: NFP ${sign(N)}K · unemployment ${U}% (prev ${Up}%)`),
            neg ? T(`${neg} bilood oo shaqooyin la waayay muddadan.`, `${neg} months of job losses in this period.`) : T("Bil kasta shaqooyin ayaa la abuuray muddadan.", "Jobs were added every month in this period.")
          ] },
          series: [{ name: "NFP", color: C.blu, type: "hist", scale: "left", data: ms.map((m, i) => [m + "-01", nfp[i], nfp[i] < 0 ? C.red : C.blu]), fmt: (v) => sign(Math.round(v)) + "K" }, { name: T("Shaqo la'aan", "Unemployment"), color: "alt", type: "line", data: ms.map((m, i) => [m + "-01", un[i]]), fmt: F1 }],
          labels: ms.map(ymShort), n,
          tip: (i) => [[ymLabel(ms[i])], ["NFP", nfp[i] < 0 ? C.red : C.blu, sign(nfp[i]) + "K"], [T("Shaqo la'aan", "Unemployment"), C.yel, un[i] + "%"]],
          draw(P, th) {
            const pad = (P.b.x1 - P.b.x0) / n * 0.5; P.b = { x0: P.b.x0 + pad, x1: P.b.x1 - pad, y0: P.b.y0, y1: P.b.y1, gx0: P.b.x0, gx1: P.b.x1 };
            const s = P.scale(n, nmin - (nmax - nmin) * 0.08, nmax * 1.12);
            const r = P.scale(n, umin, umax);
            P.yAxis(s, (v) => (v > 0 ? "+" : "") + Math.round(v) + "K"); P.yAxis(r, (v) => v + "%", true);
            P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.bars(s, nfp, C.blu, C.red);
            P.line(r, un, th.alt, P.fs > 14 ? 3 : 2);
            P.dot(r, n - 1, U, th.alt, U + "%");
          }
        };
      }
    }
  ];


  // =========================================================
  // 7-da chart ee kale
  // =========================================================
  let MACRO = null, SENT = null;
  const monthKey = (iso) => iso.slice(0, 7);
  const lastPerMonth = (arr) => { const m = new Map(); arr.forEach(([d, v]) => m.set(monthKey(d), v)); return m; };
  const pctTxt = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%";
  function easingStart(ev) {               // dhimistii 1aad ee wareegga hadda (haddii FED-ku dhimayo)
    let k = ev.length - 1; if (k < 0 || ev[k].kind !== "cut") return null;
    while (k > 0 && ev[k - 1].kind === "cut") k--;
    return ev[k];
  }
  const fedCycle = () => { const ev = FED.target.events, last = ev[ev.length - 1]; let k = ev.length - 1, c = 0; while (k >= 0 && ev[k].kind === last.kind) { c++; k--; } return { kind: last.kind, count: c, first: ev[k + 1], last }; };
  const rangeTxt = (t) => (t.lo === t.hi ? t.hi.toFixed(2) + "%" : t.lo.toFixed(2) + "–" + t.hi.toFixed(2) + "%");

  const MORE = [
    {
      id: "fed-rate", cat: "fed", ranges: [[12, "1S", "1Y"], [60, "5S", "5Y"], [120, "10S", "10Y"], [300, "25S", "25Y"]], def: 1, need: "fed", notePos: "br",
      build(range) {
        const ms = Object.keys(FED.monthly).sort().slice(-range), ff = fedSeries(ms), n = ms.length;
        const cyc = fedCycle(), cur = FED.target.current, d0 = cyc.first.date;
        const cut = cyc.kind === "cut";
        let pk = 0; ff.forEach((v, i) => { if (v != null && v > (ff[pk] || 0)) pk = i; });
        const fi = ms.indexOf(d0.slice(0, 7));
        return {
          kicker: "FED",
          title: cyc.count === 1
                   ? (cut ? T(`FED-ku wuxuu dhimay sicirka ${ymLabel(d0.slice(0, 7))} — hadda ${rangeTxt(cur)}`, `The Fed cut in ${ymLabel(d0.slice(0, 7))} — now ${rangeTxt(cur)}`)
                          : T(`FED-ku wuxuu kordhiyay sicirka ${ymLabel(d0.slice(0, 7))} — hadda ${rangeTxt(cur)}`, `The Fed hiked in ${ymLabel(d0.slice(0, 7))} — now ${rangeTxt(cur)}`))
                   : cut ? T(`FED-ku wuxuu dhimay sicirka ${cyc.count} jeer tan iyo ${ymLabel(d0.slice(0, 7))}`, `The Fed has cut ${cyc.count} times since ${ymLabel(d0.slice(0, 7))}`)
                         : T(`FED-ku wuxuu kordhiyay sicirka ${cyc.count} jeer tan iyo ${ymLabel(d0.slice(0, 7))}`, `The Fed has hiked ${cyc.count} times since ${ymLabel(d0.slice(0, 7))}`),
          sub: T(`Sicir-dulsaarka FED (heerka sare) · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`, `Fed funds target (upper bound) · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`),
          legend: [[T("Hadafka FED", "Fed target"), C.blu], [T("Dhabta (EFFR)", "Effective (EFFR)"), "alt"]],
          source: "Federal Reserve, FRED", badge: T("Dhaqan galay: ", "Effective: ") + dLabel(cyc.last.date),
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Heerka hadda: ${rangeTxt(cur)}`, `Current range: ${rangeTxt(cur)}`),
            T(`Isbeddelkii u dambeeyay: ${cyc.last.change > 0 ? "+" : "−"}${Math.round(Math.abs(cyc.last.change) * 100)} dhibcood (bps), dhaqan galay ${dLabel(cyc.last.date)}`, `Last move: ${cyc.last.change > 0 ? "+" : "−"}${Math.round(Math.abs(cyc.last.change) * 100)} bps, effective ${dLabel(cyc.last.date)}`)
          ] },
          series: [{ name: T("Hadafka FED", "Fed target"), color: C.blu, type: "steparea", data: ms.map((m, i) => [m + "-01", ff[i]]), fmt: F2 }, { name: T("Dhabta (EFFR)", "Effective (EFFR)"), color: "alt", type: "line", data: ms.map((m) => [m + "-01", FED.monthly[m].ff !== undefined ? FED.monthly[m].ff : null]), fmt: F2 }],
          n, tip: (i) => [[ymLabel(ms[i])], ["FED", C.blu, ff[i] != null ? ff[i].toFixed(2) + "%" : "—"]],
          draw(P, th) {
            const mx = Math.max(6, Math.ceil(Math.max(...ff.filter((v) => v != null)) + 0.5)), s = P.scale(n, 0, mx);
            P.yAxis(s, (v) => v + "%"); P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            const ef = ms.map((m) => (FED.monthly[m].ff !== undefined ? FED.monthly[m].ff : null));
            P.stepArea(s, ff, C.blu); P.step(s, ff, C.blu, P.fs > 14 ? 3.2 : 2.2); P.line(s, ef, th.alt, P.fs > 14 ? 2.2 : 1.5);
            if (pk > 0 && pk < n - 6) P.note(s, pk, ff[pk], `${ff[pk].toFixed(2)}% — ${T("ugu sarreeyay", "peak")} (${ymShort(ms[pk])})`);
            if (fi > 0 && fi < n - 2 && fi !== pk) P.note(s, fi, ff[fi], cut ? T("Dhimistii 1aad", "First cut") : T("Kordhintii 1aad", "First hike"));
            P.dot(s, n - 1, ff[n - 1], C.blu, cur.hi.toFixed(2) + "%");
          }
        };
      }
    },
    {
      id: "fed-bs", cat: "fed", ranges: [[12, "1S", "1Y"], [60, "5S", "5Y"], [120, "10S", "10Y"]], def: 1, need: "macro", notePos: "bl",
      build(range) {
        const wm = lastPerMonth(MACRO.walcl), m2 = new Map(MACRO.m2);
        const ms = [...wm.keys()].sort().slice(-range), n = ms.length;
        const bs = ms.map((m) => wm.get(m)), mm = ms.map((m) => (m2.has(m) ? m2.get(m) : null));
        const B = bs[n - 1]; let pk = 0; bs.forEach((v, i) => { if (v > bs[pk]) pk = i; });
        const mI = mm.reduce((a, v, i) => (v != null ? i : a), 0), M = mm[mI];
        const m12 = m2.get((+ms[mI].slice(0, 4) - 1) + ms[mI].slice(4)), my = m12 ? (M / m12 - 1) * 100 : null;
        const drop = Math.round((bs[pk] - B) * 10) / 10;
        return {
          kicker: "FED",
          title: drop >= 0.3 ? T(`Xaashida FED waxay dhacday $${drop}T tan iyo ${ymLabel(ms[pk])}`, `Fed balance sheet down $${drop}T since ${ymLabel(ms[pk])}`) : T(`Xaashida hantida FED waa $${B}T`, `Fed balance sheet at $${B}T`),
          sub: T(`Xaashida hantida FED (WALCL) iyo lacagta M2 · $ tiriliyan · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`, `Fed balance sheet (WALCL) and M2 money supply · $ trillions · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`),
          legend: [[T("Xaashida FED", "Fed balance sheet"), C.blu], [T("M2 (dhinaca midig)", "M2 (right axis)"), "alt"]],
          source: "Federal Reserve, FRED", badge: T("Xogta: ", "Data: ") + dLabel(MACRO.asOf.walcl || ms[n - 1] + "-01"),
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Xaashida FED: $${B}T (ugu sarreeyay $${bs[pk]}T, ${ymShort(ms[pk])})`, `Balance sheet: $${B}T (peak $${bs[pk]}T, ${ymShort(ms[pk])})`),
            my != null ? T(`M2: $${M}T · ${pctTxt(my)} sanadle (${ymShort(ms[mI])})`, `M2: $${M}T · ${pctTxt(my)} y/y (${ymShort(ms[mI])})`) : ""
          ].filter(Boolean) },
          series: [{ name: T("Xaashida FED", "Fed balance sheet"), color: C.blu, type: "area", scale: "left", data: ms.map((m, i) => [m + "-01", bs[i]]), fmt: FT }, { name: "M2", color: "alt", type: "line", data: ms.map((m, i) => [m + "-01", mm[i]]), fmt: FT }],
          n, tip: (i) => [[ymLabel(ms[i])], ["FED", C.blu, "$" + bs[i] + "T"], ["M2", C.yel, mm[i] != null ? "$" + mm[i] + "T" : "—"]],
          draw(P, th) {
            const lo = Math.floor(Math.min(...bs) - 0.5), hi = Math.ceil(Math.max(...bs) + 0.5), s = P.scale(n, lo, hi);
            const mv = mm.filter((v) => v != null), r = P.scale(n, Math.floor(Math.min(...mv) - 0.5), Math.ceil(Math.max(...mv) + 0.5));
            P.yAxis(s, (v) => "$" + v + "T"); P.yAxis(r, (v) => "$" + v + "T", true); P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.area(s, bs, C.blu); P.line(s, bs, C.blu, P.fs > 14 ? 3.2 : 2.2); P.line(r, mm, th.alt, P.fs > 14 ? 2.6 : 1.8);
            const mI2 = mm.reduce((a, v, i) => (v != null ? i : a), 0); P.dot(r, mI2, mm[mI2], th.alt, "$" + mm[mI2] + "T");
            P.dot(s, n - 1, B, C.blu, "$" + B + "T", "below");
          }
        };
      }
    },
    {
      id: "core-pce", cat: "infl", ranges: [[12, "1S", "1Y"], [24, "2S", "2Y"], [60, "5S", "5Y"], [120, "10S", "10Y"]], def: 2, need: "fed+macro", notePos: "tr",
      build(range) {
        const pce = new Map(MACRO.pce), cpce = new Map(MACRO.corePce);
        const ms = Object.keys(FED.monthly).sort().filter((m) => FED.monthly[m].core !== undefined || pce.has(m)).slice(-range), n = ms.length;
        const cc = ms.map((m) => (FED.monthly[m].core !== undefined ? FED.monthly[m].core : null)), pp = ms.map((m) => (pce.has(m) ? pce.get(m) : null)), cp = ms.map((m) => (cpce.has(m) ? cpce.get(m) : null));
        const li = (a) => a.reduce((x, v, i) => (v != null ? i : x), -1);
        const iP = li(pp), iC = li(cc), iCP = li(cp);
        const P1 = pp[iP], CP = cp[iCP], CC = cc[iC];
        const both = P1 > 2 && CP > 2;
        return {
          kicker: T("Sicir-barar", "Inflation"),
          title: T(`PCE waa ${P1}%, Core PCE ${CP}% — ${both ? "weli way ka sarreeyaan 2%" : "waxay u dhow yihiin hadafka 2%"}`, `PCE at ${P1}%, core PCE ${CP}% — ${both ? "still above 2%" : "near the 2% target"}`),
          sub: T(`Core CPI, PCE iyo Core PCE (cabbirka FED) · sanadle · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`, `Core CPI, PCE and core PCE (the Fed's gauge) · y/y · ${ymLabel(ms[0])} – ${ymLabel(ms[n - 1])}`),
          legend: [["PCE", C.grn], ["Core PCE", "alt"], ["Core CPI", C.pur]],
          source: "BLS, BEA, FRED", badge: T("PCE: ", "PCE: ") + ymLabel(ms[iP]),
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            (iC >= 0 ? `Core CPI ${CC}% (${ymShort(ms[iC])}) · ` : "") + `PCE ${P1}% · Core PCE ${CP}% (${ymShort(ms[iP])})`,
            T("FED-ku wuxuu hadaf ka dhigtaa PCE 2%.", "The Fed targets 2% PCE inflation.")
          ] },
          series: [{ name: "Core CPI", color: C.pur, type: "line", data: ms.map((m, i) => [m + "-01", cc[i]]), fmt: F1 }, { name: "PCE", color: C.grn, type: "line", data: ms.map((m, i) => [m + "-01", pp[i]]), fmt: F1, lines: [[2, C.grn, "2%"]] }, { name: "Core PCE", color: "alt", type: "dash", data: ms.map((m, i) => [m + "-01", cp[i]]), fmt: F1 }],
          n, tip: (i) => [[ymLabel(ms[i])], ["Core CPI", C.pur, cc[i] != null ? cc[i] + "%" : "—"], ["PCE", C.grn, pp[i] != null ? pp[i] + "%" : "—"], ["Core PCE", C.org, cp[i] != null ? cp[i] + "%" : "—"]],
          draw(P, th) {
            const all = cc.concat(pp, cp).filter((v) => v != null), s = P.scale(n, Math.min(0, Math.floor(Math.min(...all))), Math.ceil(Math.max(...all) + 1));
            P.yAxis(s, (v) => v + "%"); P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.hline(s, 2, C.grn, "2%");
            P.area(s, pp, C.grn); P.line(s, pp, C.grn, P.fs > 14 ? 3.2 : 2.2); P.line(s, cp, th.alt, P.fs > 14 ? 2.4 : 1.6, "7 5"); P.line(s, cc, C.pur, P.fs > 14 ? 2.2 : 1.5);
            P.dot(s, iP, P1, C.grn, P1 + "%");
          }
        };
      }
    },
    {
      id: "bonds", cat: "mkt", ranges: [[13, "3B", "3M"], [52, "1S", "1Y"], [260, "5S", "5Y"], [520, "10S", "10Y"]], def: 2, need: "macro", notePos: "br",
      build(range) {
        const m2 = new Map(MACRO.y2), rows = MACRO.y10.filter(([d]) => m2.has(d)).slice(-range), n = rows.length;
        const a = rows.map((r) => r[1]), b = rows.map((r) => m2.get(r[0])), sp = a.map((v, i) => Math.round((v - b[i]) * 100) / 100);
        const A = a[n - 1], Bv = b[n - 1], S = sp[n - 1];
        // rogmashadii u dambeysay (2Y > 10Y)
        let e = n - 1; while (e >= 0 && sp[e] >= 0) e--; let st0 = e; while (st0 > 0 && sp[st0 - 1] < 0) st0--;
        const inv = e >= 0, weeksInv = inv ? e - st0 + 1 : 0, nowInv = S < 0;
        return {
          kicker: T("Suuqyada", "Markets"),
          title: nowInv ? T(`Curve-ku waa rogan yahay: 2Y ${Bv}% > 10Y ${A}%`, `The curve is inverted: 2Y ${Bv}% > 10Y ${A}%`)
                        : inv ? (weeksInv >= 9 ? T(`Curve-ku wuu rogmanaa ${Math.round(weeksInv / 4.35)} bilood — hadda waa caadi`, `The curve was inverted for ${Math.round(weeksInv / 4.35)} months — now normal`) : T(`Curve-ku wuu rogmanaa ${weeksInv} toddobaad — hadda waa caadi`, `The curve was inverted for ${weeksInv} weeks — now normal`))
                              : T(`Bond 10 sano ${A}% · 2 sano ${Bv}%`, `10-year ${A}% · 2-year ${Bv}%`),
          sub: T(`Bond-yada dowladda Mareykanka 10 sano iyo 2 sano · toddobaadle · meesha cas = 2Y > 10Y`, `US Treasury 10-year and 2-year yields · weekly · red = 2Y above 10Y`),
          legend: [[T("10 sano", "10-year"), C.blu], [T("2 sano", "2-year"), "alt"]].concat(sp.some((v) => v < 0) ? [[T("Rogmasho (inversion)", "Inversion"), C.red, "box"]] : []),
          source: "US Treasury, FRED", badge: T("Xogta: ", "Data: ") + dLabel(MACRO.asOf.y10 || rows[n - 1][0]),
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Farqiga 10Y − 2Y: ${S > 0 ? "+" : ""}${S.toFixed(2)} dhibcood`, `10Y − 2Y spread: ${S > 0 ? "+" : ""}${S.toFixed(2)} pts`),
            inv ? T(`Rogmashadii u dambeysay: ${dLabel(rows[st0][0])} – ${nowInv ? "hadda" : dLabel(rows[e][0])}`, `Last inversion: ${dLabel(rows[st0][0])} – ${nowInv ? "now" : dLabel(rows[e][0])}`) : T("Muddadan curve-ku ma rogmanin.", "No inversion in this period.")
          ] },
          series: [{ name: T("10 sano", "10-year"), color: C.blu, type: "area", data: rows.map((r, i) => [r[0], a[i]]), fmt: F2 }, { name: T("2 sano", "2-year"), color: "alt", type: "line", data: rows.map((r, i) => [r[0], b[i]]), fmt: F2 }],
          n, tip: (i) => [[T("Toddobaadka ", "Week of ") + dLabel(rows[i][0])], ["10Y", C.blu, a[i] + "%"], ["2Y", C.red, b[i] + "%"], ["10Y−2Y", "alt", (sp[i] > 0 ? "+" : "") + sp[i].toFixed(2)]],
          draw(P, th) {
            const all = a.concat(b), s = P.scale(n, Math.floor(Math.min(...all)), Math.ceil(Math.max(...all) + 0.5));
            P.yAxis(s, (v) => v + "%"); P.xLabels(s, rows.map((r) => ymShort(r[0])), P.fs > 14 ? 8 : 5);
            P.fillWhere(s, b, a, th.red, (x, y) => x > y);
            P.area(s, a, C.blu); P.line(s, a, C.blu, P.fs > 14 ? 3.2 : 2.2); P.line(s, b, th.alt, P.fs > 14 ? 2.4 : 1.6);
            P.dot(s, n - 1, A, C.blu, A + "%"); P.dot(s, n - 1, Bv, th.alt, Bv + "%");
          }
        };
      }
    },
    {
      id: "dollar-oil", cat: "mkt", ranges: [[13, "3B", "3M"], [52, "1S", "1Y"], [260, "5S", "5Y"], [520, "10S", "10Y"]], def: 2, need: "macro", notePos: "tr",
      build(range) {
        const om = new Map(MACRO.oil), rows = MACRO.dollar.filter(([d]) => om.has(d)).slice(-range).map((r) => [r[0], r[1], om.get(r[0])]);
        // Qiimaha saliidda ee hadda (live, Hyperliquid) — FRED/EIA waxay dib u dhacaan ~1 toddobaad
        const liveOil = MACRO.oilLive && rows.length && MACRO.oilLive.date > rows[rows.length - 1][0];
        if (liveOil) rows.push([MACRO.oilLive.date, null, MACRO.oilLive.px]);
        const n = rows.length, dx = rows.map((r) => r[1]), oil = rows.map((r) => r[2]);
        const iD = dx.reduce((a, v, i) => (v != null ? i : a), 0), D = dx[iD], O = oil[n - 1], y1 = Math.max(0, iD - 52), o1 = Math.max(0, n - 53);
        const dch = (D / dx[y1] - 1) * 100, och = (O / oil[o1] - 1) * 100;
        let pk = 0; oil.forEach((v, i) => { if (v > oil[pk]) pk = i; });
        return {
          kicker: T("Suuqyada", "Markets"),
          title: T(`Dollar-ku wuu ${dch >= 0 ? "xoogaystay" : "daciifay"} ${Math.abs(dch).toFixed(1)}% sanadkii — saliiddu waa $${Math.round(O)}`, `The dollar is ${dch >= 0 ? "up" : "down"} ${Math.abs(dch).toFixed(1)}% in a year — oil at $${Math.round(O)}`),
          sub: T("Dollar index (Broad, Federal Reserve) iyo saliidda WTI ($/barmiil, dhinaca midig) · toddobaadle", "Dollar index (Broad, Federal Reserve) and WTI crude ($/bbl, right axis) · weekly"),
          legend: [[T("Dollar index (Broad)", "Dollar index (Broad)"), "alt"], [T("Saliidda WTI", "WTI crude"), C.org]],
          source: "Federal Reserve, EIA, FRED" + (liveOil ? ", Hyperliquid" : ""), badge: liveOil ? T("Saliid: live", "Oil: live") : T("Xogta: ", "Data: ") + dLabel(MACRO.asOf.dollar || rows[n - 1][0]), live: !!liveOil,
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Dollar: ${D.toFixed(1)} (${pctTxt(dch)} sanadle) · Saliid: $${O.toFixed(1)} (${pctTxt(och)})`, `Dollar: ${D.toFixed(1)} (${pctTxt(dch)} y/y) · Oil: $${O.toFixed(1)} (${pctTxt(och)})`),
            T(`Saliidda ugu sarreysay muddadan: $${oil[pk].toFixed(0)} (${ymShort(rows[pk][0])})`, `Oil high in this period: $${oil[pk].toFixed(0)} (${ymShort(rows[pk][0])})`)
          ] },
          series: [{ name: "Dollar", color: "alt", type: "line", scale: "left", data: rows.map((r, i) => [r[0], dx[i]]), fmt: (v) => v.toFixed(1) }, { name: T("Saliid WTI", "WTI oil"), color: C.org, type: "area", data: rows.map((r, i) => [r[0], oil[i]]), fmt: (v) => "$" + v.toFixed(1) }],
          n, tip: (i) => [[(liveOil && i === n - 1 ? T("Hadda · ", "Now · ") : T("Toddobaadka ", "Week of ")) + dLabel(rows[i][0])], ["Dollar", "alt", dx[i] != null ? dx[i].toFixed(1) : "—"], [T("Saliid", "Oil"), C.org, "$" + oil[i].toFixed(1)]],
          draw(P, th) {
            const dv = dx.filter((v) => v != null), s = P.scale(n, Math.floor(Math.min(...dv) - 2), Math.ceil(Math.max(...dv) + 2)), r = P.scale(n, Math.max(0, Math.floor(Math.min(...oil) / 10) * 10 - 10), Math.ceil(Math.max(...oil) / 10) * 10 + 10);
            P.yAxis(s, (v) => v); P.yAxis(r, (v) => "$" + v, true); P.xLabels(s, rows.map((x) => ymShort(x[0])), P.fs > 14 ? 8 : 5);
            P.line(s, dx, th.alt, P.fs > 14 ? 3 : 2); P.area(r, oil, C.org); P.line(r, oil, C.org, P.fs > 14 ? 3 : 2);
            P.dot(s, iD, D, th.alt, D.toFixed(1)); P.dot(r, n - 1, O, C.org, "$" + Math.round(O));
          }
        };
      }
    },
    {
      id: "btc-fed", cat: "crypto", ranges: [[12, "1S", "1Y"], [60, "5S", "5Y"], [999, T("Dhammaan", "All"), "All"]], def: 1, need: "fed+btc", log: true, notePos: "br",
      build(range) {
        const bm = lastPerMonth(BTC.weeks.map((w) => [w[0], w[1]]));
        const ms = [...bm.keys()].sort().slice(-range), n = ms.length, btc = ms.map((m) => bm.get(m)), ff = fedSeries(ms);
        const es = easingStart(FED.target.events), ei = es ? ms.indexOf(es.date.slice(0, 7)) : -1;
        const L = btc[n - 1], since = ei >= 0 ? (L / btc[ei] - 1) * 100 : null;
        const lo = Math.min(...btc) * 0.9, hi = Math.max(...btc) * 1.08;
        return {
          kicker: "Crypto",
          title: since != null ? T(`Bitcoin ${pctTxt(since)} tan iyo markii FED-ku bilaabay dhimista (${ymShort(ms[ei])})`, `Bitcoin ${pctTxt(since)} since the Fed started cutting (${ymShort(ms[ei])})`) : T("Bitcoin iyo sicir-dulsaarka FED", "Bitcoin and the Fed funds rate"),
          sub: T("BTC/USD (log, bille) iyo sicir-dulsaarka FED (heerka sare, dhinaca midig)", "BTC/USD (log, monthly) and Fed funds target (upper, right axis)"),
          legend: [["Bitcoin", C.org], [T("Sicir-dulsaarka FED", "Fed funds rate"), "alt"]],
          source: BTC.source + ", Federal Reserve, FRED", badge: "Live", live: true,
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Bitcoin: ${fmtUSD(L)} · FED: ${ff[n - 1] != null ? ff[n - 1].toFixed(2) + "%" : "—"}`, `Bitcoin: ${fmtUSD(L)} · Fed: ${ff[n - 1] != null ? ff[n - 1].toFixed(2) + "%" : "—"}`),
            T("Isku xirnaanshuhu ma aha sabab — xogta ayaa la isbarbar dhigay.", "Correlation is not causation — data shown side by side.")
          ] },
          series: [{ name: "Bitcoin", color: C.org, type: "area", scale: "left", log: true, data: ms.map((m, i) => [m + "-01", btc[i]]), fmt: FU }, { name: "FED", color: "alt", type: "step", data: ms.map((m, i) => [m + "-01", ff[i]]), fmt: F2 }],
          n, tip: (i) => [[ymLabel(ms[i])], ["BTC", C.org, fmtUSD(btc[i])], ["FED", C.blu, ff[i] != null ? ff[i].toFixed(2) + "%" : "—"]],
          draw(P, th) {
            const s = P.scale(n, lo, hi, true), r = P.scale(n, 0, Math.max(6, Math.ceil(Math.max(...ff.filter((v) => v != null)) + 0.5)));
            P.yAxis(s, (v) => (v >= 1000 ? "$" + v / 1000 + "k" : "$" + v)); P.yAxis(r, (v) => v + "%", true); P.xLabels(s, ms.map(ymShort), P.fs > 14 ? 8 : 5);
            P.area(s, btc, C.org); P.line(s, btc, C.org, P.fs > 14 ? 3.2 : 2.2); P.step(r, ff, th.alt, P.fs > 14 ? 2.4 : 1.6);
            P.tag(r.y(ff[n - 1]), th.alt, ff[n - 1].toFixed(2) + "%");
            P.dot(s, n - 1, L, C.org, fmtUSD(L), "above");
          }
        };
      }
    },
    {
      id: "sentiment", cat: "crypto", ranges: [[30, "1B", "1M"], [90, "3B", "3M"], [365, "1S", "1Y"]], def: 2, need: "sent", notePos: "none",
      build(range) {
        const fAll = SENT.fng || [], d = SENT.dom, f = fAll.slice(-(range || 365)), n = f.length, v = n ? f[n - 1][1] : null;
        const Z = { xf: "#3B82F6", f: "#7DB6E8", n: "#8CC97A", g: "#F5A54A", xg: "#E5484D" };
        const zc = (x) => (x < 25 ? Z.xf : x < 45 ? Z.f : x <= 55 ? Z.n : x <= 75 ? Z.g : Z.xg);
        const cls = (x) => (x < 25 ? T("cabsi xad-dhaaf ah", "extreme fear") : x < 45 ? T("cabsi", "fear") : x <= 55 ? T("dhexdhexaad", "neutral") : x <= 75 ? T("hunguri", "greed") : T("hunguri xad-dhaaf ah", "extreme greed"));
        const ago = (k) => (fAll.length > k ? fAll[fAll.length - 1 - k][1] : "—");
        const bm = new Map((BTC && BTC.daily) || []), btc = f.map((x) => (bm.has(x[0]) ? bm.get(x[0]) : null));
        const hasBtc = btc.filter((x) => x != null).length > n * 0.5, lastB = btc.reduce((a, x) => (x != null ? x : a), null);
        const extremeDays = f.filter((x) => x[1] < 25).length;
        return {
          kicker: "Crypto",
          title: v != null ? T(`Fear & Greed: ${v} — suuqu wuxuu ku jiraa ${cls(v)}`, `Fear & Greed at ${v} — the market is in ${cls(v)}`) : T("Fear & Greed Index", "Fear & Greed Index"),
          sub: T("Bitcoin Fear & Greed Index (0–100, maalinle, dhinaca midig) iyo qiimaha BTC (log, bidix)", "Bitcoin Fear & Greed Index (0–100, daily, right axis) and BTC price (log, left axis)"),
          legend: (hasBtc ? [[T("Qiimaha BTC", "BTC price"), "alt"]] : []).concat([["Fear & Greed", C.pur], [T("Cabsi xad-dhaaf", "Extreme fear"), Z.xf, "box"], [T("Cabsi", "Fear"), Z.f, "box"], [T("Hunguri", "Greed"), Z.g, "box"], [T("Hunguri xad-dhaaf", "Extreme greed"), Z.xg, "box"]]),
          source: "alternative.me, Binance, CoinGecko", badge: "Live", live: true,
          note: { t: T("Fiiro gaar ah", "Key point"), lines: [
            T(`Shalay: ${ago(1)} · Toddobaad kahor: ${ago(7)} · Bil kahor: ${ago(30)}`, `Yesterday: ${ago(1)} · Last week: ${ago(7)} · Last month: ${ago(30)}`),
            T(`${extremeDays} maalmood oo cabsi xad-dhaaf ah muddadan.`, `${extremeDays} days of extreme fear in this period.`),
            d ? `BTC dominance ${d.btc}% · ETH ${d.eth}% · Stablecoins ${d.stable}%` : ""
          ].filter(Boolean) },
          n, labels: f.map((x) => ymShort(x[0])),
          tip: (i) => [[dLabel(f[i][0])], ["F&G", zc(f[i][1]), f[i][1] + " · " + cls(f[i][1])]].concat(hasBtc ? [["BTC", "alt", btc[i] ? fmtUSD(btc[i]) : "—"]] : []),
          series: n > 7 ? (hasBtc ? [{ name: T("BTC", "BTC"), color: "alt", type: "thin", scale: "left", log: true, data: f.map((x, i) => [x[0], btc[i]]), fmt: FU }] : []).concat([
            { name: "Fear & Greed", color: C.pur, type: "fng", data: f.map((x) => [x[0], x[1]]), fmt: (x) => String(Math.round(x)), lines: [[25, Z.xf, ""], [45, Z.n, ""], [55, Z.g, ""], [75, Z.xg, ""]] }
          ]) : null,
          draw(P, th) {
            const r = P.scale(n, 0, 100);
            if (hasBtc) {
              const bv = btc.filter((x) => x != null), s = P.scale(n, Math.min(...bv) * 0.85, Math.max(...bv) * 1.06, true);
              P.yAxis(s, (x) => (x >= 1000 ? "$" + Math.round(x / 1000) + "K" : "$" + x));
              P._btc = () => { P.raw(s, btc, th.alt, P.fs > 14 ? 2 : 1.4); if (lastB) { P.dot(s, n - 1, lastB, th.alt); P.tag(s.y(lastB), th.alt, fmtUSD(lastB)); } };
            }
            P.yAxis(r, (x) => x, true);
            P.xLabels(r, f.map((x) => ymShort(x[0])));
            // aagga cabsida xad-dhaafka ah
            P.s += `<rect x="${P.b.x0}" y="${r.y(25)}" width="${P.b.x1 - P.b.x0}" height="${r.y(0) - r.y(25)}" fill="${Z.xf}" opacity=".07" />`;
            P.s += `<text x="${P.b.x1 - 10}" y="${r.y(8)}" text-anchor="end" font-size="${P.fs * 1.25}" font-weight="700" fill="${th.ink}" opacity=".75">${esc(T("Cabsi xad-dhaaf ah", "Extreme fear"))}</text>`;
            // midabka u dhexeeya 50 iyo qiimaha (aag kasta midabkiisa)
            for (let i = 0; i < n - 1; i++) {
              const a = f[i][1], b = f[i + 1][1], col = zc((a + b) / 2);
              P.s += `<path d="M${r.x(i)},${r.y(50)} L${r.x(i)},${r.y(a)} L${r.x(i + 1)},${r.y(b)} L${r.x(i + 1)},${r.y(50)} Z" fill="${col}" opacity=".32" />`;
            }
            [[25, Z.xf], [45, Z.n], [55, Z.g], [75, Z.xg]].forEach((h) => { const y = r.y(h[0]); P.s += `<line x1="${P.b.x0}" x2="${P.b.x1}" y1="${y}" y2="${y}" stroke="${h[1]}" stroke-width="1.3" stroke-dasharray="5 5" />`; });
            P.raw(r, f.map((x) => x[1]), C.pur, P.fs > 14 ? 1.8 : 1.3);
            if (P._btc) P._btc();
            P.dot(r, n - 1, v, C.pur, String(v));
          }
        };
      }
    }
  ];

  // =========================================================
  // Render bogga
  // =========================================================
  const state = {};
  const RIGHTAX = { "shaqo": 1, "fed-bs": 1, "dollar-oil": 1, "btc-fed": 1 };
  function legendHTML(m) {
    return m.legend.map((l) => `<span><i class="${l[2] === "box" ? "bx" : ""}" style="background:${l[1] === "alt" ? "var(--text)" : l[1]}"></i>${esc(l[0])}</span>`).join("");
  }
  function cardShell(ch) {
    const el = document.createElement("article");
    el.className = "xcc"; el.id = ch.id; el.dataset.cat = ch.cat;
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
    state[ch.id] = { ch, el, range: ch.ranges.length ? ch.ranges[ch.def][0] : 0, model: null };
    const rg = el.querySelector(".xcc-rg");
    if (!ch.ranges.length) rg.style.visibility = "hidden";
    rg.innerHTML = ch.ranges.map((r, k) => `<button data-r="${r[0]}" class="${k === ch.def ? "on" : ""}">${esc(EN ? r[2] : r[1])}</button>`).join("");
    return el;
  }

  function renderCard(id) {
    const st = state[id], ch = st.ch, el = st.el;
    const have = { fed: !!FED, btc: !!BTC, macro: !!MACRO, sent: !!SENT };
    if (ch.need.split("+").some((k) => !have[k])) return;
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
    if (m.series && window.LightweightCharts) { lwRender(st, m); return; }
    const box = el.querySelector(".xcc-plot"), W = Math.max(280, Math.round(box.clientWidth)), mob = W < 560;
    const H = mob ? 260 : Math.round(Math.min(420, W * 0.46));
    const th = TH[theme()], fs = mob ? 10.5 : 12;
    const P = new Plot({ x0: mob ? 42 : 52, x1: W - (mob ? 66 : 80), y0: 16, y1: H - 28 }, th, fs);
    try { m.draw(P, th); P.finish(); } catch (e) { box.innerHTML = `<div class="xcc-load">${T("Xogta lama heli karo hadda.", "Data unavailable right now.")}</div>`; return; }
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(m.title)}">${P.s}<g class="xh"></g></svg><div class="xcc-tip" hidden></div>`;
    st.P = P; st.W = W; st.H = H;
  }

  // =========================================================
  // TradingView Lightweight Charts™ (bogga) — sida website-yada crypto
  // =========================================================
  function hexA(c, a) { const h = c.replace("#", ""); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; }
  const tParts = (t) => (typeof t === "string" ? { y: +t.slice(0, 4), m: +t.slice(5, 7), d: +t.slice(8, 10) } : typeof t === "object" ? { y: t.year, m: t.month, d: t.day } : (() => { const d = new Date(t * 1000); return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }; })());
  function lwRender(st, m) {
    const LW = window.LightweightCharts, el = st.el, box = el.querySelector(".xcc-plot"), th = TH[theme()];
    st.hidden = st.hidden || new Set();
    if (st.chart) { try { st.chart.remove(); } catch (e) { /* ignore */ } st.chart = null; }
    box.innerHTML = "";
    const W = Math.max(280, Math.round(box.clientWidth)), mob = W < 560, H = mob ? 300 : 400;
    const monthly = m.series[0].data.length > 1 && m.series[0].data.slice(0, 3).every((d) => d[0].slice(8) === "01");
    const hasLeft = m.series.some((x) => x.scale === "left"), hasRight = m.series.some((x) => (x.scale || "right") === "right");
    const chart = LW.createChart(box, {
      width: W, height: H,
      layout: { attributionLogo: false, background: { type: "solid", color: "transparent" }, textColor: th.mut, fontFamily: "Inter, -apple-system, sans-serif", fontSize: mob ? 10 : 11 },
      grid: { vertLines: { visible: false }, horzLines: { color: th.grid, style: 0 } },
      rightPriceScale: { visible: hasRight, borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      leftPriceScale: { visible: hasLeft, borderVisible: false, scaleMargins: { top: 0.12, bottom: 0.08 } },
      timeScale: { borderVisible: false, fixLeftEdge: true, fixRightEdge: true, lockVisibleTimeRangeOnResize: true, rightOffset: 2,
        tickMarkFormatter: (t, type) => { const p = tParts(t); return type === 0 ? String(p.y) : type === 1 ? MO[p.m - 1] + (p.m === 1 ? " " + p.y : "") : p.d + " " + MO[p.m - 1]; } },
      localization: { locale: EN ? "en-US" : "en-GB", timeFormatter: (t) => { const p = tParts(t); return monthly ? MO[p.m - 1] + " " + p.y : p.d + " " + MO[p.m - 1] + " " + p.y; } },
      crosshair: { mode: 0, vertLine: { color: th.mut, width: 1, style: 3, labelBackgroundColor: th.ink }, horzLine: { color: th.mut, width: 1, style: 3, labelBackgroundColor: th.ink } },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: { time: true, price: false }, axisDoubleClickReset: true }
    });
    const made = m.series.map((sp) => {
      const col = sp.color === "alt" ? th.alt : sp.color;
      const base = { priceScaleId: sp.scale || "right", lastValueVisible: true, priceLineVisible: false, visible: !st.hidden.has(sp.name),
        priceFormat: { type: "custom", formatter: sp.fmt, minMove: 0.01 }, crosshairMarkerRadius: 4, crosshairMarkerBorderColor: th.bg };
      let ser;
      if (sp.type === "hist") ser = chart.addHistogramSeries(Object.assign(base, { color: col }));
      else if (sp.type === "fng") ser = chart.addBaselineSeries(Object.assign(base, { baseValue: { type: "price", price: 50 }, lineWidth: 1.5, topLineColor: col, bottomLineColor: col, topFillColor1: "rgba(245,165,74,.45)", topFillColor2: "rgba(245,165,74,.05)", bottomFillColor1: "rgba(59,130,246,.05)", bottomFillColor2: "rgba(59,130,246,.45)", autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) }));
      else if (sp.type === "area" || sp.type === "steparea") ser = chart.addAreaSeries(Object.assign(base, { lineColor: col, topColor: hexA(col, 0.28), bottomColor: hexA(col, 0.01), lineWidth: 2, lineType: sp.type === "steparea" ? 1 : 0 }));
      else ser = chart.addLineSeries(Object.assign(base, { color: col, lineWidth: sp.type === "thin" ? 1.5 : 2, lineType: sp.type === "step" ? 1 : 0, lineStyle: sp.type === "dash" ? 2 : 0 }));
      ser.setData(sp.data.filter((d) => d[1] != null).map((d) => (d[2] ? { time: d[0], value: d[1], color: d[2] } : { time: d[0], value: d[1] })));
      (sp.lines || []).forEach((l) => ser.createPriceLine({ price: l[0], color: l[1], lineWidth: 1, lineStyle: 2, axisLabelVisible: sp.type !== "fng", title: "" }));
      if (sp.log) chart.priceScale(sp.scale || "right").applyOptions({ mode: 1 });
      const lastPt = sp.data.filter((d) => d[1] != null).slice(-1)[0];
      return { sp, ser, col, last: lastPt ? lastPt[1] : null };
    });
    chart.timeScale().fitContent();
    st.chart = chart; st.lw = made; st.P = null;
    // Legend: riix si aad u qariso / u muujiso khad kasta + qiimaha marka la mariyo
    const lg = el.querySelector(".xcc-lg");
    lg.innerHTML = (made.length > 1 ? `<span class="xcc-lgl">${T("Muuji:", "Show:")}</span>` : "") + made.map((x, k) => `<button class="xcc-li${made.length > 1 ? " tg" : ""}${st.hidden.has(x.sp.name) ? " off" : ""}" data-li="${k}" role="checkbox" aria-checked="${!st.hidden.has(x.sp.name)}" title="${esc(T("Riix si aad u qariso / u muujiso", "Click to hide / show"))}"><i style="background:${x.col}"></i>${esc(x.sp.name)}<em>${x.last != null ? esc(x.sp.fmt(x.last)) : "—"}</em></button>`).join("") + `<span class="xcc-ld"></span>`;
    const ld = lg.querySelector(".xcc-ld");
    chart.subscribeCrosshairMove((param) => {
      made.forEach((x, k) => {
        const d = param && param.seriesData ? param.seriesData.get(x.ser) : null;
        const v = d && d.value != null ? d.value : x.last;
        const em = lg.querySelector(`[data-li="${k}"] em`); if (em) em.textContent = v != null ? x.sp.fmt(v) : "—";
      });
      ld.textContent = param && param.time ? (() => { const p = tParts(param.time); return monthly ? MO[p.m - 1] + " " + p.y : p.d + " " + MO[p.m - 1] + " " + p.y; })() : "";
    });
  }
  grid.addEventListener("click", (e) => {
    const b = e.target.closest(".xcc-li"); if (!b) return;
    const st = state[b.closest(".xcc").id], x = st.lw && st.lw[+b.dataset.li]; if (!x) return;
    const on = st.hidden.has(x.sp.name);
    if (!on && st.lw.filter((y) => !st.hidden.has(y.sp.name)).length <= 1) return; // ugu yaraan hal khad
    if (on) st.hidden.delete(x.sp.name); else st.hidden.add(x.sp.name);
    x.ser.applyOptions({ visible: on }); b.classList.toggle("off", !on); b.setAttribute("aria-checked", on);
  });

  // Tooltip (mouse / farta)
  function onMove(e) {
    const box = e.target.closest(".xcc-plot"); if (!box) return;
    const el = box.closest(".xcc"), st = state[el.id]; if (!st || !st.model || !st.P || !st.model.tip) return;
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
    const dash = t.indexOf(" — ");
    if (dash > 10 && dash < t.length - 6) return [t.slice(0, dash), t.slice(dash + 1)];
    const words = t.split(" "), lines = [""];
    words.forEach((w) => { if ((lines[lines.length - 1] + " " + w).trim().length > max && lines.length < 2) lines.push(w); else lines[lines.length - 1] = (lines[lines.length - 1] + " " + w).trim(); });
    return lines;
  }
  async function exportSVG(id) {
    const st = state[id], m = st.model, th = TH[theme()], W = 1200, H = 675;
    const [fonts, logo] = await Promise.all([embedFonts(), logoURI || toDataURI("logo.svg").then((u) => (logoURI = u))]);
    const F = "Inter, 'Helvetica Neue', Arial, sans-serif", FD = "'Inter Tight', Inter, Arial, sans-serif";
    // Qaab ballaaran (sida CryptoQuant): cinwaan dhexda, legend dhexda, chart-ku wuxuu qaataa sawirka intiisa badan
    const tl = wrapTitle(m.title, 54), tfs = tl.length > 1 ? 27 : 31;
    let s = `<rect width="${W}" height="${H}" fill="${th.bg}" />`;
    tl.forEach((l, k) => { s += `<text x="${W / 2}" y="${54 + k * (tfs + 5)}" font-family="${FD}" font-size="${tfs}" font-weight="700" fill="${th.ink}" text-anchor="middle">${esc(l)}</text>`; });
    let y = 54 + (tl.length - 1) * (tfs + 5) + 36;
    const hidCols = st.lw ? new Set(st.lw.filter((x) => st.hidden.has(x.sp.name)).map((x) => x.col)) : new Set();
    const lg = m.legend.filter((l) => !(hidCols.has(l[1] === "alt" ? th.alt : l[1]) && l[2] !== "box"));
    const lw = lg.reduce((a, l) => a + 26 + l[0].length * 7.9 + 28, -28);
    let lx = (W - lw) / 2;
    lg.forEach((l) => {
      const col = l[1] === "alt" ? th.alt : l[1];
      s += l[2] === "box" ? `<rect x="${lx}" y="${y - 10}" width="16" height="11" rx="3" fill="${col}" opacity=".45" />` : `<rect x="${lx}" y="${y - 6}" width="18" height="3.5" rx="2" fill="${col}" />`;
      s += `<text x="${lx + 26}" y="${y}" font-family="${F}" font-size="14.5" fill="${th.ink}">${esc(l[0])}</text>`;
      lx += 26 + l[0].length * 7.9 + 28;
    });
    // badge (geeska sare)
    const bw = m.badge.length * 6.8 + 30;
    s += `<rect x="${W - 24 - bw}" y="18" width="${bw}" height="24" rx="12" fill="rgba(31,157,107,.12)" /><circle cx="${W - 24 - bw + 13}" cy="30" r="4" fill="#1F9D6B" /><text x="${W - 24 - 10}" y="34.5" font-family="${F}" font-size="12.5" font-weight="700" fill="#1F9D6B" text-anchor="end">${esc(m.badge)}</text>`;
    const box = { x0: 74, x1: W - 118, y0: y + 26, y1: H - 84 };
    const P = new Plot(box, th, 15);
    P.s += `<text x="${(box.x0 + box.x1) / 2}" y="${(box.y0 + box.y1) / 2 + 36}" text-anchor="middle" font-family="${FD}" font-weight="800" font-size="96" fill="${th.ink}" opacity="${theme() === "dark" ? 0.05 : 0.045}">Xogta Crypto</text>`;
    if (st.lw) { P.hid = new Set(st.lw.filter((x) => st.hidden.has(x.sp.name)).map((x) => x.col)); }
    m.draw(P, th); P.finish();
    s += `<g font-family="${F}">${P.s}</g>`;
    // footer
    s += `<text x="28" y="${H - 16}" font-family="${F}" font-size="12.5" fill="${th.mut}">© ${new Date().getFullYear()} Xogta Crypto 24/7</text>`;
    s += `<image href="${logo}" x="${W - 24 - 212}" y="${H - 38}" width="28" height="28" /><text x="${W - 24}" y="${H - 17}" font-family="${FD}" font-size="19" font-weight="800" fill="${th.ink}" text-anchor="end">Xogta Crypto 24/7</text>`;
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
  const BYID = {}; CHARTS.concat(MORE).forEach((c) => { BYID[c.id] = c; });
  ["fed-rate", "fed-bs", "cpi-fed", "core-pce", "shaqo", "bonds", "dollar-oil", "btc-50-200", "btc-fed", "sentiment"].forEach((id) => cardShell(BYID[id]));
  const renderAll = () => Object.keys(state).forEach(renderCard);
  async function loadFed() {
    try { const r = await fetch("/api/fed", { cache: "no-store" }); const j = await r.json(); if (j && j.monthly) { FED = j; renderAll(); } else throw 0; }
    catch (e) { if (!FED) failMsg("fed"); }
  }
  // Bitcoin: /api/btc, haddii kale si toos ah Binance + Hyperliquid (browser-ka)
  function smaArr(a, n) { const o = new Array(a.length).fill(null); let sum = 0; for (let i = 0; i < a.length; i++) { sum += a[i]; if (i >= n) sum -= a[i - n]; if (i >= n - 1) o[i] = Math.round(sum / n); } return o; }
  async function btcDirect() {
    const rows = await (await fetch("https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=1000")).json();
    if (!Array.isArray(rows) || rows.length < 210) throw 0;
    const weeks = rows.map((k) => [new Date(k[0]).toISOString().slice(0, 10), parseFloat(k[4])]);
    let live = null;
    try { const m = await (await fetch("https://api.hyperliquid.xyz/info", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "allMids" }) })).json(); live = parseFloat(m.BTC) || null; } catch (e) { /* ignore */ }
    if (live) weeks[weeks.length - 1][1] = live;
    const cl = weeks.map((w) => w[1]), a50 = smaArr(cl, 50), a200 = smaArr(cl, 200), from = weeks.findIndex((w) => w[0] >= "2019-01-01");
    return { source: "Binance", live, weeks: weeks.slice(from).map((w, i) => [w[0], Math.round(w[1]), a50[from + i], a200[from + i]]) };
  }
  async function loadBtc() {
    let j = null;
    try { const r = await fetch("/api/btc", { cache: "no-store" }); if (r.ok) j = await r.json(); } catch (e) { /* ignore */ }
    if (!j || !j.weeks) { try { j = await btcDirect(); } catch (e) { j = null; } }
    if (j && j.weeks) {
      try {
        const rows = await (await fetch("https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=1000")).json();
        if (Array.isArray(rows) && rows.length > 60) { j.daily = rows.map((k) => [new Date(k[0]).toISOString().slice(0, 10), Math.round(parseFloat(k[4]))]); if (j.live) j.daily[j.daily.length - 1][1] = Math.round(j.live); }
      } catch (e) { /* maalinle ma jiro — toddobaadle ayaa la isticmaalayaa */ }
      BTC = j; renderCard("btc-50-200"); renderCard("btc-fed"); if (SENT) renderCard("sentiment");
    } else if (!BTC) failMsg("btc");
  }

  function failMsg(need) { Object.values(state).filter((s) => s.ch.need.indexOf(need) !== -1 && !s.model).forEach((s) => { s.el.querySelector(".xcc-plot").innerHTML = `<div class="xcc-load">${T("Xogta lama heli karo hadda. Isku day mar kale.", "Data unavailable. Please try again.")}</div>`; }); }
  async function loadJSON(url, ok, need) { try { const r = await fetch(url, { cache: "no-store" }); const j = await r.json(); if (!ok(j)) throw 0; return j; } catch (e) { failMsg(need); return null; } }
  // Suuqyada (FRED): haddii /api/macro aanu jirin, kaararkaas waa la qarinayaa (bogga ma jabo)
  async function loadMacro() {
    let j = null;
    try { const r = await fetch("/api/macro", { cache: "no-store" }); if (r.ok) j = await r.json(); } catch (e) { /* ignore */ }
    const cards = Object.values(state).filter((s) => s.ch.need.indexOf("macro") !== -1);
    if (j && (j.walcl || j.y10)) {
      try { const mk = await (await fetch("/api/markets", { cache: "no-store" })).json(); const cl = mk && mk.data && mk.data["xyz:CL"]; if (cl && cl.px > 0) j.oilLive = { date: new Date().toISOString().slice(0, 10), px: Math.round(cl.px * 100) / 100 }; } catch (e) { /* FRED keliya */ }
      MACRO = j; cards.forEach((s) => s.el.classList.remove("xcc-off")); renderAll(); }
    else if (!MACRO) cards.forEach((s) => s.el.classList.add("xcc-off"));
  }
  async function sentDirect() {
    const out = { fng: null, dom: null };
    const [f, g] = await Promise.allSettled([fetch("https://api.alternative.me/fng/?limit=90&format=json").then((r) => r.json()), fetch("https://api.coingecko.com/api/v3/global").then((r) => r.json())]);
    if (f.status === "fulfilled" && f.value && Array.isArray(f.value.data)) out.fng = f.value.data.map((d) => [new Date(+d.timestamp * 1000).toISOString().slice(0, 10), +d.value, d.value_classification]).reverse();
    if (g.status === "fulfilled" && g.value && g.value.data) {
      const p = g.value.data.market_cap_percentage || {}, btc = p.btc || 0, eth = p.eth || 0, st = (p.usdt || 0) + (p.usdc || 0) + (p.dai || 0), r1 = (v) => Math.round(v * 10) / 10;
      out.dom = { btc: r1(btc), eth: r1(eth), stable: r1(st), other: r1(100 - btc - eth - st), mcap: g.value.data.total_market_cap ? g.value.data.total_market_cap.usd : null, mcapChange: g.value.data.market_cap_change_percentage_24h_usd };
    }
    if (!out.fng && !out.dom) throw 0;
    return out;
  }
  async function loadSent() {
    let j = null;
    try { const r = await fetch("/api/sentiment", { cache: "no-store" }); if (r.ok) j = await r.json(); } catch (e) { /* ignore */ }
    if (!j || !(j.fng || j.dom)) { try { j = await sentDirect(); } catch (e) { j = null; } }
    if (j && (!j.fng || j.fng.length < 300)) {
      try { const r = await (await fetch("https://api.alternative.me/fng/?limit=400&format=json")).json(); if (r && Array.isArray(r.data) && r.data.length > 300) j.fng = r.data.map((x) => [new Date(+x.timestamp * 1000).toISOString().slice(0, 10), +x.value, x.value_classification]).reverse(); } catch (e) { /* 90 maalmood ayaa la isticmaalayaa */ }
    }
    if (j) { SENT = j; renderCard("sentiment"); } else if (!SENT) failMsg("sent");
  }
  loadFed(); loadBtc(); loadMacro(); loadSent();
  setInterval(loadSent, 10 * 60 * 1000);   // Fear & Greed: 10 daqiiqo kasta
  setInterval(loadMacro, 60 * 60 * 1000);  // Suuqyada (FRED): saac kasta
  setInterval(loadBtc, 5 * 60 * 1000);     // Bitcoin: 5 daqiiqo kasta
  setInterval(loadFed, 30 * 60 * 1000);    // FED/BLS: 30 daqiiqo kasta
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(renderAll, 150); });
  new MutationObserver(renderAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  // Filter-ka kooxaha
  const fb = document.getElementById("xc-filter");
  if (fb) fb.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cat]"); if (!b) return;
    fb.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    Object.values(state).forEach((s) => { s.el.hidden = b.dataset.cat !== "all" && s.ch.cat !== b.dataset.cat; });
    renderAll();
  });
  // Link gaar ah: charts#btc-50-200
  if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView({ behavior: "smooth", block: "start" }); }, 600);

  window.XCCharts = { state, exportSVG, exportPNG }; // tijaabo
})();
