/* =========================================================
   /api/fed — xogta FED-ka oo laga soo qaado FRED (bilaash, key la'aan)
   ---------------------------------------------------------
   Vercel ayaa faylkan u shaqaysiiya sidii server yar.
   Xogta waxaa la kaydiyaa (cache) 15 daqiiqo, si website-ku u
   dhakhso badnaado oo FRED aan culays la saarin.

   Taxanaha (series) FRED ee la isticmaalo:
     DFEDTAR   – dulsaarka FED (hal tiro)          1982 → 2008
     DFEDTARL  – dulsaarka FED (xadka hoose)        2008 → maanta
     DFEDTARU  – dulsaarka FED (xadka sare)         2008 → maanta
     FEDFUNDS  – dulsaarka dhabta ah (bishii)       1954 → maanta
     CPIAUCNS  – qiimaha macaamiisha (CPI)          1913 → maanta
     UNRATE    – shaqo la'aanta                     1948 → maanta
     PAYEMS    – shaqooyinka (NFP)                  1939 → maanta
     DGS10/DGS2 – dulsaarka bonds-ka 10 iyo 2 sano
   ========================================================= */

const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

function isoDaysAgo(days) {
  const d = new Date(Date.now() - days * 864e5);
  return d.toISOString().slice(0, 10);
}

async function fetchSeries(id, start) {
  const url = FRED_CSV + "?id=" + id + (start ? "&cosd=" + start : "");
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)", "Accept": "text/csv" }
      });
      if (!r.ok) throw new Error(id + " HTTP " + r.status);
      return parseCsv(await r.text(), id);
    } catch (e) {
      lastErr = e;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}

// "observation_date,DFF\n2024-01-01,5.33\n2024-01-02,." -> [["2024-01-01", 5.33], ...]
function parseCsv(text, id) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2 || lines[0].indexOf(",") === -1) throw new Error(id + " CSV aan sax ahayn");
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, raw] = lines[i].split(",");
    if (!date || raw === undefined) continue;
    const v = parseFloat(raw);
    if (!isNaN(v) && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.push([date, v]);
  }
  if (!out.length) throw new Error(id + " xog ma jirto");
  return out;
}

const r2 = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;

// Isbeddellada dulsaarka FED (kor u qaadis / dhimis)
function buildEvents(single, lower, upper) {
  const events = [];
  let prev = null; // { lo, hi }
  function push(date, cur) {
    if (prev) {
      const pm = (prev.lo + prev.hi) / 2, cm = (cur.lo + cur.hi) / 2;
      if (Math.abs(pm - cm) > 1e-9) {
        events.push({ date, from: prev, to: cur, change: r2(cm - pm), kind: cm > pm ? "hike" : "cut" });
      }
    }
    prev = cur;
  }
  (single || []).forEach(([d, v]) => push(d, { lo: v, hi: v }));
  if (lower && upper) {
    const up = new Map(upper);
    lower.forEach(([d, lo]) => { if (up.has(d)) push(d, { lo, hi: up.get(d) }); });
  }
  return { events, current: prev };
}

function toMonthMap(series) {
  const m = new Map();
  (series || []).forEach(([d, v]) => m.set(d.slice(0, 7), v));
  return m;
}

function shiftMonth(ym, delta) {
  let [y, m] = ym.split("-").map(Number);
  m += delta;
  while (m < 1) { m += 12; y--; }
  while (m > 12) { m -= 12; y++; }
  return y + "-" + String(m).padStart(2, "0");
}

function lastTwo(series) {
  if (!series || !series.length) return null;
  const a = series[series.length - 1], b = series[series.length - 2];
  return { date: a[0], value: a[1], prevDate: b ? b[0] : null, prev: b ? b[1] : null };
}

async function buildPayload() {
  const jobs = {
    DFEDTAR: fetchSeries("DFEDTAR"),
    DFEDTARL: fetchSeries("DFEDTARL"),
    DFEDTARU: fetchSeries("DFEDTARU"),
    FEDFUNDS: fetchSeries("FEDFUNDS"),
    CPIAUCNS: fetchSeries("CPIAUCNS", "1953-01-01"),
    CPILFENS: fetchSeries("CPILFENS", "1956-01-01"),
    UNRATE: fetchSeries("UNRATE"),
    PAYEMS: fetchSeries("PAYEMS", "1953-12-01"),
    PPIFIS: fetchSeries("PPIFIS", isoDaysAgo(800)),
    RSAFS: fetchSeries("RSAFS", isoDaysAgo(800)),
    PCEPI: fetchSeries("PCEPI", isoDaysAgo(800)),
    PCEPILFE: fetchSeries("PCEPILFE", isoDaysAgo(800)),
    JTSJOL: fetchSeries("JTSJOL", isoDaysAgo(800)),
    ICSA: fetchSeries("ICSA", isoDaysAgo(200)),
    GDPQ: fetchSeries("A191RL1Q225SBEA", isoDaysAgo(1200)),
    DGS10: fetchSeries("DGS10", isoDaysAgo(120)),
    DGS2: fetchSeries("DGS2", isoDaysAgo(120))
  };
  const names = Object.keys(jobs);
  const settled = await Promise.allSettled(names.map((n) => jobs[n]));
  const S = {}, errors = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") S[names[i]] = r.value;
    else errors.push(names[i] + ": " + (r.reason && r.reason.message));
  });

  // 1) Dulsaarka FED: isbeddellada iyo heerka hadda
  const target = buildEvents(S.DFEDTAR, S.DFEDTARL, S.DFEDTARU);

  // 2) Xogta bil kasta (1954 → maanta)
  const ff = toMonthMap(S.FEDFUNDS);
  const cpi = toMonthMap(S.CPIAUCNS);
  const core = toMonthMap(S.CPILFENS);
  const un = toMonthMap(S.UNRATE);
  const pay = toMonthMap(S.PAYEMS);
  const monthly = {};
  const keys = new Set([...ff.keys(), ...un.keys(), ...pay.keys(), ...cpi.keys()]);
  [...keys].filter((k) => k >= "1954-01").sort().forEach((k) => {
    const row = {};
    if (ff.has(k)) row.ff = r2(ff.get(k));
    const prevYear = cpi.get(shiftMonth(k, -12));
    if (cpi.has(k) && prevYear) row.cpi = r1((cpi.get(k) / prevYear - 1) * 100);
    const corePrev = core.get(shiftMonth(k, -12));
    if (core.has(k) && corePrev) row.core = r1((core.get(k) / corePrev - 1) * 100);
    if (un.has(k)) row.un = un.get(k);
    const prevPay = pay.get(shiftMonth(k, -1));
    if (pay.has(k) && prevPay !== undefined) row.nfp = Math.round(pay.get(k) - prevPay); // kun (thousands)
    if (Object.keys(row).length) monthly[k] = row;
  });
  // Xogta kale ee kalandarka (FRED): PPI, iibka tafaariiqda, PCE, JOLTS
  const extra = { ppi: toMonthMap(S.PPIFIS), retail: toMonthMap(S.RSAFS), pce: toMonthMap(S.PCEPI), cpce: toMonthMap(S.PCEPILFE), jolts: toMonthMap(S.JTSJOL) };
  const mm = (m, k) => (m.has(k) && m.has(shiftMonth(k, -1)) ? r1((m.get(k) / m.get(shiftMonth(k, -1)) - 1) * 100) : undefined);
  const yy = (m, k) => (m.has(k) && m.has(shiftMonth(k, -12)) ? r1((m.get(k) / m.get(shiftMonth(k, -12)) - 1) * 100) : undefined);
  new Set([...extra.ppi.keys(), ...extra.retail.keys(), ...extra.pce.keys(), ...extra.jolts.keys()]).forEach((k) => {
    const row = monthly[k] || (monthly[k] = {});
    const v = { ppi: mm(extra.ppi, k), ppiY: yy(extra.ppi, k), retail: mm(extra.retail, k), pce: yy(extra.pce, k), pceM: mm(extra.pce, k), corePce: yy(extra.cpce, k), jolts: extra.jolts.has(k) ? extra.jolts.get(k) : undefined };
    Object.keys(v).forEach((f) => { if (v[f] !== undefined) row[f] = v[f]; });
  });
  const weekly = { claims: (S.ICSA || []).slice(-30) };
  const quarterly = { gdp: (S.GDPQ || []).slice(-12) };

  // 3) Xogtii u dambeysay
  const monthsDesc = Object.keys(monthly).sort().reverse();
  function latestOf(field) {
    const found = monthsDesc.filter((k) => monthly[k][field] !== undefined);
    if (!found.length) return null;
    return { month: found[0], value: monthly[found[0]][field], prevMonth: found[1] || null, prev: found[1] ? monthly[found[1]][field] : null };
  }

  return {
    updated: new Date().toISOString(),
    source: "FRED, Federal Reserve Bank of St. Louis",
    target: { current: target.current, events: target.events },
    monthly,
    weekly,
    quarterly,
    latest: {
      cpi: latestOf("cpi"),
      core: latestOf("core"),
      un: latestOf("un"),
      nfp: latestOf("nfp"),
      ff: latestOf("ff"),
      dgs10: lastTwo(S.DGS10),
      dgs2: lastTwo(S.DGS2)
    },
    // Chart-ka bonds-ka: ~3 bilood oo maalin kasta ah
    series: { dgs10: (S.DGS10 || []).slice(-66), dgs2: (S.DGS2 || []).slice(-66) },
    errors
  };
}

// BLS (notify.js ayaa KV ku kaydiya daqiiqadda la daabaco) -> FRED ka hor
async function blsOverlay(payload) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || !payload || !payload.latest) return false;
  try {
    const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(["GET", "xc:bls"]) });
    const b = JSON.parse((await r.json()).result || "null"); if (!b) return false;
    const L = payload.latest, put = (k, v) => { if (v && v.value != null && (!L[k] || !L[k].month || v.month > L[k].month)) { L[k] = { month: v.month, value: v.value, prevMonth: shiftMonth(v.month, -1), prev: v.prev, src: "BLS" }; return true; } return false; };
    const M = payload.monthly || {};
    [["cpi", b.cpi], ["core", b.core], ["nfp", b.nfp], ["un", b.un]].forEach(([f, v]) => { if (v && v.value != null) { (M[v.month] = M[v.month] || {})[f] = v.value; if (v.prev != null) { const pm = shiftMonth(v.month, -1); (M[pm] = M[pm] || {}); if (M[pm][f] == null) M[pm][f] = v.prev; } } });
    if (b.cpi && b.cpi.mom != null && M[b.cpi.month]) M[b.cpi.month].cpiM = b.cpi.mom;
    return [put("cpi", b.cpi), put("core", b.core), put("nfp", b.nfp), put("un", b.un)].some(Boolean);
  } catch (e) { return false; }
}
function nearRelease() {
  const p = {}; new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
  const m = (+p.hour % 24) * 60 + +p.minute; return p.weekday !== "Sat" && p.weekday !== "Sun" && m >= 505 && m <= 660;
}
module.exports = async function handler(req, res) {
  try {
    const payload = await buildPayload();
    await blsOverlay(payload);
    const ok = payload.target.current && Object.keys(payload.monthly).length > 0;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Cache 15 daqiiqo; haddii FRED dhaco, xogtii hore ayaa la isticmaalaa ilaa 1 maalin
    res.setHeader("Cache-Control", ok ? (nearRelease() ? "public, s-maxage=30, stale-while-revalidate=60" : "public, s-maxage=900, stale-while-revalidate=86400") : "no-store");
    res.statusCode = ok ? 200 : 502;
    res.end(JSON.stringify(payload));
  } catch (e) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "FRED lama gaari karo", detail: String(e && e.message) }));
  }
};

// Tijaabada gudaha
module.exports._internal = { parseCsv, buildEvents, buildPayload, shiftMonth };
