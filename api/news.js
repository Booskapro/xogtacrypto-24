/* Wararka FED — /api/news  (link toos ah + cinwaan af-Soomaali) */
const MAX = 40, MAX_NEW_TR = 12;
function env(...n) { for (const k of n) if (process.env[k]) return process.env[k]; return ""; }
async function kv(cmd) {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"), token = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  try {
    const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
    return (await r.json()).result;
  } catch (e) { return null; }
}
const FED_WORDS = /\b(Fed|FOMC|Federal Reserve|Warsh|rate (hike|cut)s?|interest rates?|Treasury yields?)\b/i;
const FEEDS = [
  { url: "https://www.bing.com/news/search?q=%22Federal+Reserve%22+OR+FOMC+OR+Warsh+OR+%22Fed+rate%22&format=rss&setlang=en-US&cc=US", src: null },
  { url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", src: "CNBC" },
  { url: "https://www.fxstreet.com/rss/news", src: "FXStreet" },
  { url: "https://www.investing.com/rss/news_95.rss", src: "Investing.com" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", src: "CoinDesk" }
];
const FED_RSS = ["https://www.federalreserve.gov/feeds/press_monetary.xml", "https://www.federalreserve.gov/feeds/speeches.xml"];
const SKIP_FED = /enforcement action|termination of enforcement|discount rate|request for comment|applications|approval of|bank holding/i;

function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, "").trim();
}
function parseRss(xml) {
  return (String(xml).match(/<item>[\s\S]*?<\/item>/g) || []).map((it) => {
    const tag = (t) => { const m = new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">").exec(it); return m ? decode(m[1]) : ""; };
    return { title: tag("title"), link: tag("link"), date: tag("pubDate"), source: tag("News:Source") || tag("source") };
  });
}
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }
function realLink(l) {
  try { const u = new URL(l); const r = u.searchParams.get("url"); if (r && /^https?:/i.test(r)) return r; } catch (e) {}
  return l;
}
function siteName(l) { try { return new URL(l).hostname.replace(/^www\./, ""); } catch (e) { return ""; } }

async function fetchNews() {
  const ua = { headers: { "User-Agent": "Mozilla/5.0 (compatible; XogtaCrypto/1.0; +https://xogtacrypto.vercel.app)" } };
  const get = (u) => fetch(u, ua).then((r) => (r.ok ? r.text() : "")).catch(() => "");
  const texts = await Promise.all(FEEDS.map((f) => get(f.url)).concat(FED_RSS.map(get)));
  const list = [];
  FEEDS.forEach((f, i) => parseRss(texts[i]).forEach((n) => {
    const link = realLink(n.link);
    if (/news\.google\.com/.test(link)) return;
    if (f.src && !FED_WORDS.test(n.title)) return;
    list.push({ title: n.title.replace(/ - [^-]{2,40}$/, ""), link, date: n.date, source: f.src || n.source || siteName(link), official: false });
  }));
  texts.slice(FEEDS.length).forEach((x) => parseRss(x).forEach((n) => {
    if (SKIP_FED.test(n.title)) return;
    list.push({ title: n.title, link: n.link, date: n.date, source: "Federal Reserve", official: true });
  }));
  const seen = new Set();
  return list.filter((n) => {
    if (!n.title || !n.link || isNaN(Date.parse(n.date))) return false;
    const k = n.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (seen.has(k)) return false; seen.add(k); return true;
  });
}

const BAD_SO = /xasan|sheekh|khayre|farmaajo|madaxweyne|ra'iisul|somaliland|puntland|muqdisho|al-shabaab|xamar|dahabshiil|hormuud|amal|world remit|xawaala/i;
function trOk(src, so) {
  if (!so) return false;
  const r = so.length / Math.max(1, src.length);
  if (r < 0.5 || r > 2.4) return false;
  if (BAD_SO.test(so) && !BAD_SO.test(src) && !/somal/i.test(src)) return false;
  for (const n of (src.match(/\d+/g) || [])) if (so.indexOf(n) === -1) return false;
  return true;
}
const AI_RULES = "You translate financial news headlines into clear, natural Somali for traders. Rules: keep it short like a headline; keep names, tickers, numbers and % unchanged; write 'FED' for the Federal Reserve/the Fed; use common Somali terms (dulsaar = interest rate, sicir-barar = inflation, suuqa saamiyada = stock market, dahab = gold, lacag/silver = silver, shidaal = oil). Never mention Somali companies, people or places unless they are in the headline. Output ONLY the Somali headline, nothing else.";
function cleanAi(t) { return t ? String(t).trim().split("\n")[0].replace(/^["“*]+|["”*]+$/g, "").trim() : null; }
async function geminiSomali(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  try {
    const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
      method: "POST",
      headers: { "x-goog-api-key": key, "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: AI_RULES }] },
        contents: [{ role: "user", parts: [{ text: text }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
      })
    });
    const j = await r.json();
    const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
    const so = cleanAi(parts && parts.map((x) => x.text || "").join(""));
    return trOk(text, so) ? so : null;
  } catch (e) { return null; }
}
async function aiSomali(text) {
  if (process.env.GEMINI_API_KEY) { const g = await geminiSomali(text); if (g) return g; }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 200,
        system: AI_RULES,
        messages: [{ role: "user", content: text }]
      })
    });
    const j = await r.json();
    const so = cleanAi(j && j.content && j.content[0] && j.content[0].text);
    return trOk(text, so) ? so : null;
  } catch (e) { return null; }
}
async function translateSo(text, kvf) {
  const ai = !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
  const key = (ai ? "xc:tr3:" : "xc:tr2:") + hash(text);
  try { const c = await kvf(["GET", key]); if (c) return c === "-" ? null : c; } catch (e) {}
  if (!ai) return null;
  const so = await aiSomali(text);
  try { await kvf(["SET", key, so || "-", "EX", 60 * 60 * 24 * 14]); } catch (e) {}
  return so;
}

module.exports = async function handler(req, res) {
  try {
    const items = (await fetchNews()).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, MAX);
    const ai = !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
    let budget = MAX_NEW_TR;
    for (const n of items) {
      const c = await kv(["GET", (ai ? "xc:tr3:" : "xc:tr2:") + hash(n.title)]);
      if (c) { n.title_so = c === "-" ? null : c; continue; }
      if (budget-- <= 0) continue;
      n.title_so = await translateSo(n.title, kv);
    }
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json({ updated: new Date().toISOString(), items: items.map((n) => ({ ...n, date: new Date(n.date).toISOString() })) });
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({ updated: new Date().toISOString(), items: [], error: String(e.message || e) });
  }
};
