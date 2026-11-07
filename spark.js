/* =========================================================
   /api/spark — chart-ka 7 maalmood (Hyperliquid candles, 4 saac)
   Cache: 10 daqiiqo.
   ========================================================= */
const HL = "https://api.hyperliquid.xyz/info";
const COINS = ["BTC", "ETH", "xyz:GOLD", "xyz:SILVER", "xyz:CL", "xyz:SP500", "xyz:XYZ100", "xyz:EUR"];

async function candles(coin) {
  const now = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(HL, {
      method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "candleSnapshot", req: { coin, interval: "4h", startTime: now - 7 * 864e5, endTime: now } })
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const rows = await r.json();
    return (rows || []).map((c) => parseFloat(c.c)).filter((v) => !isNaN(v));
  } finally { clearTimeout(timer); }
}

module.exports = async function handler(req, res) {
  const results = await Promise.allSettled(COINS.map(candles));
  const data = {}, errors = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value.length > 1) data[COINS[i]] = r.value;
    else errors.push(COINS[i]);
  });
  const ok = Object.keys(data).length > 0;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", ok ? "public, s-maxage=600, stale-while-revalidate=3600" : "no-store");
  res.statusCode = ok ? 200 : 502;
  res.end(JSON.stringify({ updated: new Date().toISOString(), data, errors }));
};
