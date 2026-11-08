/* =========================================================
   /api/stables — wadarta stablecoin-nada (market cap, maalinle)
   Isha: DefiLlama (bilaash, key la'aan) — stablecoins.llama.fi
   Cache: 1 saac.
   ========================================================= */
const URL_ALL = "https://stablecoins.llama.fi/stablecoincharts/all";

function parse(rows) {
  const out = [];
  (rows || []).forEach((r) => {
    const t = +r.date, usd = r.totalCirculatingUSD || {};
    const sum = Object.values(usd).reduce((a, v) => a + (+v || 0), 0);
    if (t > 0 && sum > 0) out.push([new Date(t * 1000).toISOString().slice(0, 10), Math.round(sum / 1e7) / 100]); // $ bilyan
  });
  return out.filter((r) => r[0] >= "2019-01-01");
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(URL_ALL, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)", "Accept": "application/json" } });
    if (!r.ok) throw new Error("DefiLlama HTTP " + r.status);
    const days = parse(await r.json());
    if (days.length < 100) throw new Error("xog yar");
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.statusCode = 200;
    res.end(JSON.stringify({ updated: new Date().toISOString(), source: "DefiLlama", days }));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store"); res.statusCode = 502;
    res.end(JSON.stringify({ error: "DefiLlama lama gaari karo", detail: String(e && e.message) }));
  } finally { clearTimeout(timer); }
};
module.exports._internal = { parse };
