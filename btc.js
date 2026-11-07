/* =========================================================
   /api/btc — Bitcoin: xiritaanka toddobaadka + celceliska 50 & 200 toddobaad
   ---------------------------------------------------------
   Isha 1aad: Binance (BTC/USDT, toddobaadle, 2017 → maanta), bilaash, key la'aan
   Isha 2aad (haddii Binance dhaco): Coinbase (BTC-USD, maalinle → toddobaadle)
   Qiimaha hadda: Hyperliquid (live)
   Cache: 5 daqiiqo.
   ========================================================= */

const BINANCE = "https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1w&limit=1000";
const COINBASE = "https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400";
const HL = "https://api.hyperliquid.xyz/info";
const UA = { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)" };

async function getJson(url, opt, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || 10000);
  try {
    const r = await fetch(url, Object.assign({ signal: ctrl.signal, headers: UA }, opt || {}));
    if (!r.ok) throw new Error("HTTP " + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}

// Binance: [openTime, open, high, low, close, ...] — toddobaadku wuxuu furmaa Isniinta 00:00 UTC
async function fromBinance() {
  const rows = await getJson(BINANCE);
  if (!Array.isArray(rows) || rows.length < 210) throw new Error("Binance: xog yar");
  return rows.map((k) => [new Date(k[0]).toISOString().slice(0, 10), parseFloat(k[4])]);
}

// Coinbase: 300 maalmood codsi kasta → toddobaadyo (Isniin → Axad)
async function fromCoinbase() {
  const day = 864e5, out = new Map();
  let end = Date.now();
  for (let i = 0; i < 12; i++) {
    const start = end - 299 * day;
    const url = COINBASE + "&start=" + new Date(start).toISOString() + "&end=" + new Date(end).toISOString();
    const rows = await getJson(url);
    if (!Array.isArray(rows) || !rows.length) break;
    rows.forEach((c) => out.set(c[0] * 1000, c[4])); // [time, low, high, open, close, vol]
    end = start - day;
  }
  const days = [...out.entries()].sort((a, b) => a[0] - b[0]);
  const weeks = new Map();
  days.forEach(([t, close]) => {
    const d = new Date(t), dow = (d.getUTCDay() + 6) % 7; // Isniin = 0
    const monday = new Date(t - dow * day).toISOString().slice(0, 10);
    weeks.set(monday, close); // xiritaanka ugu dambeeya ee toddobaadka
  });
  const w = [...weeks.entries()];
  if (w.length < 210) throw new Error("Coinbase: xog yar");
  return w;
}

async function livePrice() {
  try {
    const r = await getJson(HL, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, UA), body: JSON.stringify({ type: "allMids" }) }, 5000);
    const v = parseFloat(r && r.BTC);
    return isNaN(v) ? null : v;
  } catch (e) { return null; }
}

function sma(arr, n) {
  const out = new Array(arr.length).fill(null);
  let sum = 0;
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
    if (i >= n) sum -= arr[i - n];
    if (i >= n - 1) out[i] = Math.round(sum / n);
  }
  return out;
}

async function buildPayload() {
  let weeks, source;
  try { weeks = await fromBinance(); source = "Binance"; }
  catch (e) { weeks = await fromCoinbase(); source = "Coinbase"; }

  const live = await livePrice();
  // Toddobaadka socda: xiritaankiisa ku-meel-gaarka ah = qiimaha hadda
  if (live) weeks[weeks.length - 1][1] = live;

  const closes = weeks.map((w) => w[1]);
  const s50 = sma(closes, 50), s200 = sma(closes, 200);
  const from = weeks.findIndex((w) => w[0] >= "2019-01-01");
  return {
    updated: new Date().toISOString(),
    source,
    live,
    weeks: weeks.slice(from).map((w, i) => [w[0], Math.round(w[1]), s50[from + i], s200[from + i]])
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const payload = await buildPayload();
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    res.statusCode = 200;
    res.end(JSON.stringify(payload));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Xogta Bitcoin lama heli karo", detail: String(e && e.message) }));
  }
};

module.exports._internal = { sma, buildPayload };
