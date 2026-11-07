/* =========================================================
   /api/macro — xogta suuqyada iyo FED (FRED, bilaash, key la'aan)
   ---------------------------------------------------------
     WALCL     – xaashida hantida FED ($ malyan, toddobaadle)
     M2SL      – lacagta M2 ($ bilyan, bille)
     PCEPI     – PCE (qiimaha, bille) → sanadle %
     PCEPILFE  – Core PCE (bille) → sanadle %
     DGS10/DGS2 – bonds 10 & 2 sano (maalinle → toddobaadle)
     DTWEXBGS  – dollar index (Broad, Federal Reserve, maalinle → toddobaadle)
     DCOILWTICO – saliidda WTI ($/barmiil, maalinle → toddobaadle)
   Cache: 1 saac.
   ========================================================= */
const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";
const START = "2014-01-01";

async function fetchSeries(id, start) {
  const url = FRED_CSV + "?id=" + id + "&cosd=" + (start || START);
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)", "Accept": "text/csv" } });
      if (!r.ok) throw new Error(id + " HTTP " + r.status);
      return parseCsv(await r.text(), id);
    } catch (e) { lastErr = e; } finally { clearTimeout(timer); }
  }
  throw lastErr;
}

function parseCsv(text, id) {
  const lines = text.trim().split(/\r?\n/), out = [];
  if (lines.length < 2 || lines[0].indexOf(",") === -1) throw new Error(id + " CSV aan sax ahayn");
  for (let i = 1; i < lines.length; i++) {
    const [date, raw] = lines[i].split(",");
    const v = parseFloat(raw);
    if (!isNaN(v) && /^\d{4}-\d{2}-\d{2}$/.test(date)) out.push([date, v]);
  }
  if (!out.length) throw new Error(id + " xog ma jirto");
  return out;
}

const r2 = (v) => Math.round(v * 100) / 100;
const r1 = (v) => Math.round(v * 10) / 10;

// Maalinle → toddobaadle (qiimaha ugu dambeeya ee toddobaad kasta, Isniin = bilowga)
function weekly(series) {
  const m = new Map();
  (series || []).forEach(([d, v]) => {
    const t = Date.parse(d + "T00:00:00Z"), dow = (new Date(t).getUTCDay() + 6) % 7;
    m.set(new Date(t - dow * 864e5).toISOString().slice(0, 10), v);
  });
  return [...m.entries()];
}
// Bille → sanadle %
function yoy(series) {
  const m = new Map(series.map(([d, v]) => [d.slice(0, 7), v])), out = [];
  for (const [d, v] of series) {
    const [y, mo] = d.slice(0, 7).split("-");
    const p = m.get((+y - 1) + "-" + mo);
    if (p) out.push([d.slice(0, 7), r1((v / p - 1) * 100)]);
  }
  return out;
}

async function buildPayload() {
  const ids = ["WALCL", "M2SL", "PCEPI", "PCEPILFE", "DGS10", "DGS2", "DTWEXBGS", "DCOILWTICO"];
  const settled = await Promise.allSettled(ids.map((id) => fetchSeries(id, id.startsWith("PCE") ? "2013-01-01" : START)));
  const S = {}, errors = [];
  settled.forEach((r, i) => { if (r.status === "fulfilled") S[ids[i]] = r.value; else errors.push(ids[i] + ": " + (r.reason && r.reason.message)); });
  const last = (a) => (a && a.length ? a[a.length - 1][0] : null);
  return {
    updated: new Date().toISOString(),
    source: "FRED, Federal Reserve Bank of St. Louis",
    walcl: (S.WALCL || []).map(([d, v]) => [d, r2(v / 1e6)]),          // $ tiriliyan
    m2: (S.M2SL || []).map(([d, v]) => [d.slice(0, 7), r2(v / 1e3)]),  // $ tiriliyan
    pce: S.PCEPI ? yoy(S.PCEPI) : [],
    corePce: S.PCEPILFE ? yoy(S.PCEPILFE) : [],
    y10: weekly(S.DGS10), y2: weekly(S.DGS2),
    dollar: weekly(S.DTWEXBGS).map(([d, v]) => [d, r2(v)]),
    oil: weekly(S.DCOILWTICO).map(([d, v]) => [d, r2(v)]),
    asOf: { walcl: last(S.WALCL), m2: last(S.M2SL), pce: last(S.PCEPI), y10: last(S.DGS10), dollar: last(S.DTWEXBGS), oil: last(S.DCOILWTICO) },
    errors
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const p = await buildPayload();
    const ok = p.walcl.length || p.y10.length;
    res.setHeader("Cache-Control", ok ? "public, s-maxage=3600, stale-while-revalidate=86400" : "no-store");
    res.statusCode = ok ? 200 : 502;
    res.end(JSON.stringify(p));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "FRED lama gaari karo", detail: String(e && e.message) }));
  }
};
module.exports._internal = { parseCsv, weekly, yoy, buildPayload };
