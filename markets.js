/* =========================================================
   /api/markets — qiimaha suuqyada (Hyperliquid, bilaash, key la'aan)
   Dahab, lacag, shidaal, S&P 500, Nasdaq 100, Euro/Dollar (+ BTC, ETH)
   Suuqyadani waa "perpetual" oo raaca qiimaha dhabta ah, 24/7.
   Cache: 15 ilbiriqsi. Boggu wuxuu kale oo si toos ah ugu xiran
   yahay Hyperliquid (WebSocket), sidaas darteed qiimuhu waa live.
   ========================================================= */
const HL = "https://api.hyperliquid.xyz/info";
const WANT = {
  xyz: ["xyz:GOLD", "xyz:SILVER", "xyz:CL", "xyz:SP500", "xyz:XYZ100", "xyz:EUR"],
  main: ["BTC", "ETH"]
};

async function post(body, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || 8000);
  try {
    const r = await fetch(HL, { method: "POST", signal: ctrl.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

function pick(resp, names) {
  const out = {};
  if (!Array.isArray(resp) || resp.length < 2) return out;
  const uni = (resp[0] && resp[0].universe) || [];
  const ctxs = resp[1] || [];
  uni.forEach((u, i) => {
    if (names.indexOf(u.name) === -1 || !ctxs[i]) return;
    const c = ctxs[i];
    const px = parseFloat(c.midPx || c.markPx), prev = parseFloat(c.prevDayPx);
    if (isNaN(px)) return;
    out[u.name] = { px, prev: isNaN(prev) ? null : prev, vol: parseFloat(c.dayNtlVlm) || null, oracle: parseFloat(c.oraclePx) || null };
  });
  return out;
}

module.exports = async function handler(req, res) {
  const errors = [];
  const [a, b] = await Promise.allSettled([
    post({ type: "metaAndAssetCtxs", dex: "xyz" }),
    post({ type: "metaAndAssetCtxs" })
  ]);
  const data = {};
  if (a.status === "fulfilled") Object.assign(data, pick(a.value, WANT.xyz)); else errors.push("xyz: " + a.reason.message);
  if (b.status === "fulfilled") Object.assign(data, pick(b.value, WANT.main)); else errors.push("main: " + b.reason.message);
  const ok = Object.keys(data).length > 0;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", ok ? "public, s-maxage=15, stale-while-revalidate=120" : "no-store");
  res.statusCode = ok ? 200 : 502;
  res.end(JSON.stringify({ updated: new Date().toISOString(), source: "Hyperliquid", data, errors }));
};
module.exports._internal = { pick };
