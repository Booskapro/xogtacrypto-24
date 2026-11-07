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
    DGS10: fetchSeries("DGS10", isoDaysAgo(30)),
    DGS2: fetchSeries("DGS2", isoDaysAgo(30))
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
    latest: {
      cpi: latestOf("cpi"),
      core: latestOf("core"),
      un: latestOf("un"),
      nfp: latestOf("nfp"),
      ff: latestOf("ff"),
      dgs10: lastTwo(S.DGS10),
      dgs2: lastTwo(S.DGS2)
    },
    errors
  };
}

module.exports = async function handler(req, res) {
  try {
    const payload = await buildPayload();
    const ok = payload.target.current && Object.keys(payload.monthly).length > 0;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    // Cache 15 daqiiqo; haddii FRED dhaco, xogtii hore ayaa la isticmaalaa ilaa 1 maalin
    res.setHeader("Cache-Control", ok ? "public, s-maxage=900, stale-while-revalidate=86400" : "no-store");
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
