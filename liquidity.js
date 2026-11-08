/* =========================================================
   /api/liquidity — Lacagta FED ee suuqa (Net Liquidity) + S&P 500
   Isha: FRED (bilaash, key la'aan)
     WALCL      – xaashida hantida FED ($ malyan, Arbaco)
     WTREGEN    – TGA, akoonka Maaliyadda ($ malyan, celceliska toddobaadka)
     RRPONTSYD  – Reverse Repo ($ bilyan, maalinle)
     SP500      – S&P 500 (maalinle, 10 sano ee u dambeeya)
   Net Liquidity = WALCL − TGA − RRP  ($ tiriliyan)
   Cache: 1 saac.
   ========================================================= */
const FRED_CSV = "https://fred.stlouisfed.org/graph/fredgraph.csv";

async function fetchSeries(id, start) {
  const url = FRED_CSV + "?id=" + id + "&cosd=" + start;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto247/1.0)", "Accept": "text/csv" } });
      if (!r.ok) throw new Error(id + " HTTP " + r.status);
      const lines = (await r.text()).trim().split(/\r?\n/), out = [];
      if (lines.length < 2 || lines[0].indexOf(",") === -1) throw new Error(id + " CSV aan sax ahayn");
      for (let i = 1; i < lines.length; i++) {
        const [d, raw] = lines[i].split(","), v = parseFloat(raw);
        if (!isNaN(v) && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.push([d, v]);
      }
      if (!out.length) throw new Error(id + " xog ma jirto");
      return out;
    } catch (e) { lastErr = e; } finally { clearTimeout(timer); }
  }
  throw lastErr;
}

// Qiimaha ugu dambeeya ee taariikh la siiyay ama ka hor
function asOf(series) {
  let k = 0;
  return (d) => { while (k < series.length - 1 && series[k + 1][0] <= d) k++; return series[k] && series[k][0] <= d ? series[k][1] : null; };
}

function netLiquidity(walcl, tga, rrp) {
  const gT = asOf(tga), gR = asOf(rrp), out = [];
  walcl.forEach(([d, w]) => {
    const t = gT(d), r = gR(d);
    if (t == null || r == null) return;
    out.push([d, Math.round((w / 1e6 - t / 1e6 - r / 1e3) * 1000) / 1000, Math.round(w / 1e3), Math.round(t / 1e3), Math.round(r * 10) / 10]);
  });
  return out; // [taariikh, net $T, WALCL $B, TGA $B, RRP $B]
}

async function buildPayload() {
  const ids = [["WALCL", "2018-01-01"], ["WTREGEN", "2018-01-01"], ["RRPONTSYD", "2018-01-01"], ["SP500", "2017-01-01"]];
  const st = await Promise.allSettled(ids.map(([id, s]) => fetchSeries(id, s)));
  const S = {}, errors = [];
  st.forEach((r, i) => { if (r.status === "fulfilled") S[ids[i][0]] = r.value; else errors.push(ids[i][0] + ": " + (r.reason && r.reason.message)); });
  const net = S.WALCL && S.WTREGEN && S.RRPONTSYD ? netLiquidity(S.WALCL, S.WTREGEN, S.RRPONTSYD) : [];
  const last = (a) => (a && a.length ? a[a.length - 1][0] : null);
  return {
    updated: new Date().toISOString(),
    source: "FRED, Federal Reserve Bank of St. Louis",
    net, spx: (S.SP500 || []).map(([d, v]) => [d, Math.round(v * 100) / 100]),
    asOf: { net: last(net), walcl: last(S.WALCL), tga: last(S.WTREGEN), rrp: last(S.RRPONTSYD), spx: last(S.SP500) },
    errors
  };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  try {
    const p = await buildPayload(), ok = p.net.length || p.spx.length;
    res.setHeader("Cache-Control", ok ? "public, s-maxage=3600, stale-while-revalidate=86400" : "no-store");
    res.statusCode = ok ? 200 : 502;
    res.end(JSON.stringify(p));
  } catch (e) {
    res.setHeader("Cache-Control", "no-store"); res.statusCode = 502;
    res.end(JSON.stringify({ error: "FRED lama gaari karo", detail: String(e && e.message) }));
  }
};
module.exports._internal = { netLiquidity, asOf };
