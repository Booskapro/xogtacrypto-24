/* =========================================================
   /api/sentiment — Fear & Greed iyo saamiga suuqa crypto (dominance)
   ---------------------------------------------------------
   Fear & Greed: alternative.me (bilaash, key la'aan) — 90 maalmood
   Dominance + market cap: CoinGecko /global (bilaash, key la'aan)
   Cache: 10 daqiiqo.
   ========================================================= */
const FNG = "https://api.alternative.me/fng/?limit=90&format=json";
const CG = "https://api.coingecko.com/api/v3/global";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)", "Accept": "application/json" };

async function getJson(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: UA });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

async function buildPayload() {
  const [f, g] = await Promise.allSettled([getJson(FNG), getJson(CG)]);
  const out = { updated: new Date().toISOString(), fng: null, dom: null, errors: [] };
  if (f.status === "fulfilled" && f.value && Array.isArray(f.value.data)) {
    // alternative.me: kan ugu cusub ayaa ugu horreeya
    out.fng = f.value.data.map((d) => [new Date(+d.timestamp * 1000).toISOString().slice(0, 10), +d.value, d.value_classification]).reverse();
  } else out.errors.push("fng: " + (f.reason && f.reason.message));
  if (g.status === "fulfilled" && g.value && g.value.data) {
    const pct = g.value.data.market_cap_percentage || {};
    const btc = pct.btc || 0, eth = pct.eth || 0, stable = (pct.usdt || 0) + (pct.usdc || 0) + (pct.dai || 0);
    out.dom = {
      btc: Math.round(btc * 10) / 10, eth: Math.round(eth * 10) / 10, stable: Math.round(stable * 10) / 10,
      other: Math.round((100 - btc - eth - stable) * 10) / 10,
      mcap: g.value.data.total_market_cap ? g.value.data.total_market_cap.usd : null,
      mcapChange: g.value.data.market_cap_change_percentage_24h_usd
    };
  } else out.errors.push("coingecko: " + (g.reason && g.reason.message));
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const p = await buildPayload();
    const ok = p.fng || p.dom;
    res.setHeader("Cache-Control", ok ? "public, s-maxage=600, stale-while-revalidate=3600" : "no-store");
    res.statusCode = ok ? 200 : 502;
    res.end(JSON.stringify(p));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Xogta lama heli karo", detail: String(e && e.message) }));
  }
};
module.exports._internal = { buildPayload };
