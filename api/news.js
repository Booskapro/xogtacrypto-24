const GNEWS = "https://news.google.com/rss/search?q=" + encodeURIComponent('"Federal Reserve" OR "the Fed" OR FOMC OR Warsh when:2d') + "&hl=en-US&gl=US&ceid=US:en";
const FED = ["https://www.federalreserve.gov/feeds/press_monetary.xml", "https://www.federalreserve.gov/feeds/speeches.xml"];
const MAX = 40, MAX_NEW_TR = 12;

function env(...n) { for (const k of n) if (process.env[k]) return process.env[k]; return ""; }
function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, "").trim();
}
function parseRss(xml) {
  return (String(xml).match(/<item>[\s\S]*?<\/item>/g) || []).map((it) => {
    const tag = (t) => { const m = new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">").exec(it); return m ? decode(m[1]) : ""; };
    return { title: tag("title"), link: tag("link"), date: tag("pubDate"), source: tag("source") };
  });
}
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }

async function kv(cmd) {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"), token = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  try {
    const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
    return (await r.json()).result;
  } catch (e) { return null; }
}
async function translate(text) {
  const key = "xc:tr:" + hash(text);
  const cached = await kv(["GET", key]);
  if (cached) return { so: cached, fresh: false };
  try {
    const r = await fetch("https://api.mymemory.translated.net/get?langpair=en|so&q=" + encodeURIComponent(text.slice(0, 450)));
    const j = await r.json();
    const t = j && j.responseData && j.responseData.translatedText;
    if (t && !/MYMEMORY WARNING|QUERY LENGTH|INVALID/i.test(t)) {
      const so = decode(t);
      await kv(["SET", key, so, "EX", 60 * 60 * 24 * 14]);
      return { so, fresh: true };
    }
  } catch (e) {}
  return { so: null, fresh: true };
}

async function load() {
  const list = [];
  const ua = { headers: { "User-Agent": "Mozilla/5.0 (XogtaCrypto)" } };
  const [g, ...fed] = await Promise.all([GNEWS, ...FED].map((u) => fetch(u, ua).then((r) => r.text()).catch(() => "")));
  parseRss(g).forEach((n) => {
    const src = n.source || (n.title.match(/ - ([^-]+)$/) || [])[1] || "";
    list.push({ title: n.title.replace(/ - [^-]+$/, ""), link: n.link, date: n.date, source: src.trim(), official: false });
  });
  fed.forEach((x) => parseRss(x).forEach((n) => list.push({ title: n.title, link: n.link, date: n.date, source: "Federal Reserve", official: true })));
  const seen = new Set();
  return list.filter((n) => n.title && n.link && !isNaN(Date.parse(n.date)) && !seen.has(n.title) && seen.add(n.title))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, MAX);
}

module.exports = async function handler(req, res) {
  try {
    const items = await load();
    let budget = MAX_NEW_TR;
    for (const n of items) {
      const cached = await kv(["GET", "xc:tr:" + hash(n.title)]);
      if (cached) { n.title_so = cached; continue; }
      if (budget-- <= 0) continue;
      n.title_so = (await translate(n.title)).so;
    }
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ updated: new Date().toISOString(), items: items.map((n) => ({ ...n, date: new Date(n.date).toISOString() })) });
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({ updated: new Date().toISOString(), items: [], error: String(e.message || e) });
  }
};
