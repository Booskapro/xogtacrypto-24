/* =========================================================
   /api/live — xogta degdegga ah (daqiiqad kasta)
   ---------------------------------------------------------
   1) Federal Reserve RSS  -> bayaannada, wararka iyo hadallada
   2) Bayaanka FOMC        -> go'aanka dulsaarka, isla daqiiqadda la daabaco
   3) Kalshi               -> fursadaha go'aanka FED ee xiga (suuqa saadaasha)
   Dhammaan bilaash, key la'aan. Cache: 60 ilbiriqsi.
   ========================================================= */

const UA = "Mozilla/5.0 (compatible; XogtaCrypto247/1.0; +https://xogtacrypto.vercel.app)";

const FEEDS = [
  { url: "https://www.federalreserve.gov/feeds/press_monetary.xml", cat: "monetary" },
  { url: "https://www.federalreserve.gov/feeds/press_all.xml", cat: "press" },
  { url: "https://www.federalreserve.gov/feeds/speeches.xml", cat: "speech" }
];
const KALSHI = "https://api.elections.kalshi.com/trade-api/v2/events?series_ticker=KXFEDDECISION&status=open&with_nested_markets=true&limit=10";

async function get(url, accept, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms || 10000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA, "Accept": accept || "*/*" } });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + url);
    return await r.text();
  } finally {
    clearTimeout(timer);
  }
}

// ---------- RSS ----------
function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}
function tag(block, name) {
  const m = new RegExp("<" + name + "[^>]*>([\\s\\S]*?)</" + name + ">", "i").exec(block);
  return m ? decode(m[1]) : "";
}
function parseRss(xml, cat) {
  const items = [];
  const re = /<item[\s>][\s\S]*?<\/item>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const b = m[0];
    const title = tag(b, "title");
    const link = tag(b, "link") || tag(b, "guid");
    const pub = tag(b, "pubDate");
    const d = pub ? new Date(pub) : null;
    if (!title || !link) continue;
    items.push({ title, link, date: d && !isNaN(d) ? d.toISOString() : null, cat, desc: tag(b, "description").slice(0, 300) });
  }
  return items;
}

// ---------- Bayaanka FOMC: "3-3/4 to 4 percent" -> {lo:3.75, hi:4} ----------
function frac(s) {
  s = s.trim();
  let m = /^(\d+)-(\d+)\/(\d+)$/.exec(s);
  if (m) return Number(m[1]) + Number(m[2]) / Number(m[3]);
  m = /^(\d+)\/(\d+)$/.exec(s);
  if (m) return Number(m[1]) / Number(m[2]);
  m = /^(\d+(?:\.\d+)?)$/.exec(s);
  if (m) return Number(m[1]);
  return NaN;
}
function parseStatement(html) {
  const text = decode(html);
  const re = /(raise|increase|lower|reduce|cut|maintain)[^.]{0,120}?target range for the federal funds rate(?: by [\d\/\-\.]+ percentage points?)? (?:at|to) ([\d\/\-\.]+) to ([\d\/\-\.]+) percent/i;
  const m = re.exec(text);
  if (!m) return null;
  const lo = frac(m[2]), hi = frac(m[3]);
  if (isNaN(lo) || isNaN(hi)) return null;
  const verb = m[1].toLowerCase();
  const action = verb === "maintain" ? "hold" : (verb === "raise" || verb === "increase") ? "hike" : "cut";
  return { action, range: { lo, hi } };
}

// ---------- Kalshi ----------
function prob(m) {
  const d = (k) => (m[k + "_dollars"] != null ? parseFloat(m[k + "_dollars"]) : m[k] != null ? Number(m[k]) / 100 : NaN);
  const bid = d("yes_bid"), ask = d("yes_ask"), last = d("last_price");
  if (!isNaN(bid) && !isNaN(ask) && ask > 0 && ask - bid <= 0.1) return (bid + ask) / 2;
  if (!isNaN(last) && last > 0) return last;
  if (!isNaN(bid) && !isNaN(ask) && ask > 0) return (bid + ask) / 2;
  return NaN;
}
function kindFromTicker(t) {
  const m = /-([HC])(\d+)$/.exec(t || "");
  if (!m) return null;
  const bps = Number(m[2]);
  if (bps === 0) return { kind: "hold", bps: 0 };
  return { kind: m[1] === "H" ? "hike" : "cut", bps };
}
function parseKalshi(json) {
  const events = (json.events || []).filter((e) => (e.markets || []).length);
  if (!events.length) return null;
  const closeOf = (e) => {
    const ts = (e.markets || []).map((m) => Date.parse(m.close_time || m.expiration_time || "")).filter((x) => !isNaN(x));
    return ts.length ? Math.min(...ts) : Infinity;
  };
  const now = Date.now();
  events.sort((a, b) => closeOf(a) - closeOf(b));
  const ev = events.find((e) => closeOf(e) > now) || events[0];
  const markets = ev.markets.map((m) => {
    const k = kindFromTicker(m.ticker);
    return { ticker: m.ticker, label: m.yes_sub_title || m.subtitle || m.title || m.ticker, kind: k ? k.kind : null, bps: k ? k.bps : null, p: prob(m) };
  }).filter((m) => !isNaN(m.p));
  if (!markets.length) return null;
  const sum = markets.reduce((s, m) => s + m.p, 0) || 1;
  markets.forEach((m) => { m.p = Math.round((m.p / sum) * 1000) / 10; }); // isku dar = 100%
  markets.sort((a, b) => b.p - a.p);
  return { event: ev.event_ticker, title: ev.title || "", close: isFinite(closeOf(ev)) ? new Date(closeOf(ev)).toISOString() : null, markets, url: "https://kalshi.com/markets/kxfeddecision" };
}

async function build() {
  const errors = [];
  const feedJobs = FEEDS.map((f) => get(f.url, "application/rss+xml, application/xml, text/xml").then((x) => parseRss(x, f.cat)));
  const kalshiJob = get(KALSHI, "application/json", 8000).then((t) => parseKalshi(JSON.parse(t)));
  const [r1, r2, r3, rk] = await Promise.allSettled([...feedJobs, kalshiJob]);

  let news = [];
  [r1, r2, r3].forEach((r, i) => {
    if (r.status === "fulfilled") news = news.concat(r.value);
    else errors.push("feed " + FEEDS[i].cat + ": " + (r.reason && r.reason.message));
  });
  // Ka saar kuwa labo jeer soo galay (monetary ayaa ka horreeya press)
  const seen = new Set();
  news = news.filter((n) => (seen.has(n.link) ? false : (seen.add(n.link), true)));
  news.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  // Bayaanka FOMC ee ugu dambeeyay (45 maalmood gudahood)
  let fomc = null;
  const stmt = news.find((n) => /FOMC statement/i.test(n.title) && n.date && Date.now() - Date.parse(n.date) < 45 * 864e5);
  if (stmt) {
    try {
      const parsed = parseStatement(await get(stmt.link, "text/html", 10000));
      if (parsed) fomc = Object.assign({ date: stmt.date, link: stmt.link, title: stmt.title }, parsed);
    } catch (e) { errors.push("statement: " + e.message); }
  }

  let odds = null;
  if (rk.status === "fulfilled") odds = rk.value; else errors.push("kalshi: " + (rk.reason && rk.reason.message));

  return { updated: new Date().toISOString(), news: news.slice(0, 40), fomc, odds, errors };
}

module.exports = async function handler(req, res) {
  try {
    const data = await build();
    const ok = data.news.length || data.odds;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", ok ? "public, s-maxage=60, stale-while-revalidate=600" : "no-store");
    res.statusCode = ok ? 200 : 502;
    res.end(JSON.stringify(data));
  } catch (e) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = 502;
    res.end(JSON.stringify({ error: "Xogta live lama heli karo", detail: String(e && e.message) }));
  }
};
module.exports._internal = { parseRss, parseStatement, parseKalshi, frac };
