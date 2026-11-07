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
const BAD_SO = /xasan|sheekh|khayre|farmaajo|madaxweyne|ra'iisul|somaliland|puntland|muqdisho|al-shabaab|xamar/i;
function trOk(src, so) {
  if (!so) return false;
  const r = so.length / Math.max(1, src.length);
  if (r < 0.5 || r > 2.2) return false;
  if (BAD_SO.test(so) && !BAD_SO.test(src) && !/somal/i.test(src)) return false;
  const nums = (src.match(/\d+/g) || []);
  for (const n of nums) if (so.indexOf(n) === -1) return false;
  return true;
}
async function mtSomali(text) {
  try {
    const r = await fetch("https://api.mymemory.translated.net/get?mt=1&langpair=en|so&q=" + encodeURIComponent(text.slice(0, 450)));
    const j = await r.json();
    const m = ((j && j.matches) || []).find((x) => /^MT/i.test(String(x["created-by"] || "")));
    const so = m ? decode(m.translation) : null;
    return trOk(text, so) ? so : null;
  } catch (e) { return null; }
}
async function translate(text) {
  const key = "xc:tr2:" + hash(text);
  const cached = await kv(["GET", key]);
  if (cached) return { so: cached === "-" ? null : cached };
  const so = await mtSomali(text);
  await kv(["SET", key, so || "-", "EX", 60 * 60 * 24 * 14]);
  return { so };
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
      const cached = await kv(["GET", "xc:tr2:" + hash(n.title)]);
      if (cached) { n.title_so = cached === "-" ? null : cached; continue; }
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
