/* =========================================================
   /api/alts — Altcoins: boqolkiiba intee ka hooseeya celceliska 200 maalmood
   Isha: Binance (bilaash) — 100-ka altcoin ee ugu volume badan (USDT)
   Stablecoins, dahab iyo BTC/wrapped waa laga saaray.
   Cache: 6 saac (xisaab culus).
   ========================================================= */
const API = "https://data-api.binance.vision/api/v3";
const SKIP = new Set(["BTC", "WBTC", "BTCB", "USDC", "FDUSD", "TUSD", "USDP", "DAI", "BUSD", "USDE", "PYUSD", "USD1", "RLUSD", "BFUSD", "XUSD", "UST", "USTC", "EUR", "EURI", "AEUR", "EURC", "GBP", "TRY", "BRL", "PAXG", "XAUT", "WBETH", "BETH", "STETH", "WSTETH", "SUSD", "U"]);
const TOP = 100, SMA = 200;

async function getJSON(url, ms) {
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), ms || 12000);
  try { const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)" } }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); }
  finally { clearTimeout(timer); }
}

function pickCoins(tickers) {
  return tickers
    .filter((t) => /USDT$/.test(t.symbol))
    .map((t) => ({ s: t.symbol, base: t.symbol.slice(0, -4), qv: +t.quoteVolume || 0, cnt: +t.count || 0 }))
    .filter((t) => !SKIP.has(t.base) && !/(UP|DOWN|BULL|BEAR)$/.test(t.base) && t.cnt > 0)
    .sort((a, b) => b.qv - a.qv).slice(0, TOP);
}

// closes: [[taariikh, close]] → Map(taariikh → hoos u yahay?)
function belowMap(closes) {
  const out = new Map(); let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i][1]; if (i >= SMA) sum -= closes[i - SMA][1];
    if (i >= SMA - 1) out.set(closes[i][0], closes[i][1] < sum / SMA);
  }
  return out;
}

function aggregate(maps, minCoins) {
  const agg = new Map();
  maps.forEach((m) => m.forEach((below, d) => { const a = agg.get(d) || [0, 0]; a[1]++; if (below) a[0]++; agg.set(d, a); }));
  return [...agg.entries()].filter(([, a]) => a[1] >= minCoins).sort((p, q) => (p[0] < q[0] ? -1 : 1))
    .map(([d, a]) => [d, Math.round(a[0] / a[1] * 1000) / 10, a[1]]);
}

async function buildPayload() {
  const coins = pickCoins(await getJSON(API + "/ticker/24hr", 15000));
  if (coins.length < 30) throw new Error("coins yar");
  const maps = [], errors = [];
  for (let i = 0; i < coins.length; i += 20) {
    const part = await Promise.allSettled(coins.slice(i, i + 20).map((c) => getJSON(`${API}/klines?symbol=${c.s}&interval=1d&limit=1000`)));
    part.forEach((r, k) => {
      if (r.status !== "fulfilled" || !Array.isArray(r.value)) { errors.push(coins[i + k].s); return; }
      const cl = r.value.map((x) => [new Date(x[0]).toISOString().slice(0, 10), parseFloat(x[4])]).filter((x) => x[1] > 0);
      if (cl.length >= SMA) maps.push(belowMap(cl));
    });
  }
  const days = aggregate(maps, 30);
  if (days.length < 30) throw new Error("xog yar");
  return { updated: new Date().toISOString(), source: "Binance", coins: maps.length, days, errors };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const p = await buildPayload();
    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=172800");
    res.statusCode = 200; res.end(JSON.stringify(p));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store"); res.statusCode = 502;
    res.end(JSON.stringify({ error: "Binance lama gaari karo", detail: String(e && e.message) }));
  }
};
module.exports._internal = { pickCoins, belowMap, aggregate };
