/* Wararka FED — /api/news  (link toos ah + cinwaan af-Soomaali) */
const MAX = 60, MAX_NEW_TR = 15;
function env(...n) { for (const k of n) if (process.env[k]) return process.env[k]; return ""; }
async function kv(cmd) {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"), token = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) return null;
  try {
    const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
    return (await r.json()).result;
  } catch (e) { return null; }
}
const FED_WORDS = /\b(Fed|FOMC|Federal Reserve|Warsh|Powell|rate (hike|cut)s?|interest rates?|Treasury yields?|CPI|inflation|consumer prices|payrolls|jobs report|unemployment|PCE|GDP|tariffs?|recession)\b/i;
const BING = (q) => "https://www.bing.com/news/search?q=" + encodeURIComponent(q) + "&format=rss&setlang=en-US&cc=US";
const FEEDS = [
  { url: BING('"Federal Reserve" OR FOMC OR Warsh OR "Fed rate"'), src: null },
  { url: "https://www.cnbc.com/id/20910258/device/rss/rss.html", src: "CNBC" },
  { url: "https://www.fxstreet.com/rss/news", src: "FXStreet" },
  { url: "https://www.investing.com/rss/news_95.rss", src: "Investing.com" },
  { url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", src: "CNBC", cat: "top" },
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", src: "CoinDesk", cat: "btc" },
  { url: "https://cointelegraph.com/rss", src: "Cointelegraph", cat: "btc" },
  { url: BING("bitcoin OR ethereum OR crypto ETF OR stablecoin"), src: null, cat: "btc" },
  { url: BING('"artificial intelligence" OR OpenAI OR Nvidia OR "AI chips" OR Anthropic'), src: null, cat: "ai" },
  { url: BING('"stock market" OR "S&P 500" OR Nasdaq OR "Wall Street"'), src: null, cat: "stocks" },
  { url: BING('"data privacy" OR "data breach" OR surveillance OR encryption OR cyberattack'), src: null, cat: "privacy" },
  // Akoonnada X ee la doortay (ilahooda bilaashka ah)
  { url: "https://t.me/s/WatcherGuru", src: "Watcher Guru", cat: "top", tg: "WatcherGuru" },
  { url: "https://www.thestreet.com/.rss/full/", src: "TheStreet", cat: "stocks" },
  { url: "https://www.rand.org/blog.xml", src: "RAND", cat: "world" },
  { url: "https://tokenterminal.substack.com/feed", src: "Token Terminal", cat: "btc" }
];
// Telegram channel-ka dadweynaha (t.me/s/…): fariimaha u dambeeyay
function parseTg(html, ch) {
  return String(html).split('data-post="').slice(1).map((b) => {
    const id = b.slice(0, b.indexOf('"'));
    const m = /tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/.exec(b), t = /<time[^>]*datetime="([^"]+)"/.exec(b);
    if (!m || !t) return null;
    const text = decode(m[1].replace(/<br\s*\/?>/g, " ")).replace(/@\w+/g, "").replace(/^\s*(JUST IN|BREAKING|NEW)\s*:\s*/i, "").replace(/\s+/g, " ").trim();
    return text ? { title: text.slice(0, 280), link: "https://t.me/" + id, date: t[1], desc: "" } : null;
  }).filter(Boolean).slice(-15);
}
const FED_RSS = ["https://www.federalreserve.gov/feeds/press_monetary.xml", "https://www.federalreserve.gov/feeds/speeches.xml"];
const SKIP_FED = /enforcement action|termination of enforcement|discount rate|request for comment|applications|approval of|bank holding/i;

function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, "").trim();
}
function parseRss(xml) {
  return (String(xml).match(/<item>[\s\S]*?<\/item>/g) || []).map((it) => {
    const tag = (t) => { const m = new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">").exec(it); return m ? decode(m[1]) : ""; };
    return { title: tag("title"), link: tag("link"), date: tag("pubDate"), source: tag("News:Source") || tag("source"), desc: tag("description").slice(0, 600) };
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
  FEEDS.forEach((f, i) => (f.tg ? parseTg(texts[i], f.tg) : parseRss(texts[i])).forEach((n) => {
    const link = realLink(n.link);
    if (/news\.google\.com/.test(link)) return;
    if (!f.cat && f.src && !FED_WORDS.test(n.title)) return;
    list.push({ title: n.title.replace(/ - [^-]{2,40}$/, ""), link, date: n.date, desc: n.desc, source: f.src || n.source || siteName(link), cat: f.cat || "fed", official: false });
  }));
  texts.slice(FEEDS.length).forEach((x) => parseRss(x).forEach((n) => {
    if (SKIP_FED.test(n.title)) return;
    list.push({ title: n.title, link: n.link, date: n.date, desc: n.desc, source: "Federal Reserve", cat: "fed", official: true });
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
  // Ingiriis lama aqbalo: haddii erayada badankoodu la mid yihiin asalka
  const ws = (x) => String(x).toLowerCase().match(/[a-z]{3,}/g) || [], sw = new Set(ws(src)), ow = ws(so);
  if (ow.length && ow.filter((w) => sw.has(w)).length / ow.length > 0.5) return false;
  const sn = so.replace(/(\d),(\d)/g, "$1.$2");
  for (const n of (src.match(/\d+(?:\.\d+)?/g) || [])) if (sn.indexOf(n) === -1 && so.indexOf(n) === -1) return false;
  return true;
}
const AI_RULES = "You are a Somali financial journalist. Translate the news into clear, natural Somali for crypto and market traders. Return ONLY JSON: {\"t\":\"<Somali headline>\",\"s\":\"<1-2 short Somali sentences: what happened and why it matters for the Fed, the dollar, stocks or crypto>\",\"i\":<importance 1-10 for global markets: 9-10 = Fed decision, CPI/jobs surprise, war or major attack, crash/surge, huge hack; 7-8 = important Fed speech, big company/AI/crypto news that moves markets; 1-6 = routine, opinion, small company or analysis>,\"c\":\"<one of: fed, macro, btc, ai, stocks, privacy, world>\"}. Rules: keep names, tickers, numbers and % exactly as in the source; write 'FED' for the Federal Reserve; use common Somali terms (dulsaar = interest rate, sicir-barar = inflation, suuqa saamiyada = stock market, dahab = gold, shidaal = oil, shaqo la'aan = unemployment). Do not invent facts that are not in the source. Never mention Somali companies, people or places unless they are in the source.";
function parseAi(raw) {
  if (!raw) return null;
  const m = String(raw).match(/\{[\s\S]*\}/);
  try { const j = JSON.parse(m ? m[0] : raw); if (j && j.t) return { t: String(j.t).trim(), s: j.s ? String(j.s).trim() : "", i: Math.max(1, Math.min(10, +j.i || 5)), c: String(j.c || "").toLowerCase() }; } catch (e) {}
  const line = String(raw).trim().split("\n")[0].replace(/^["“*]+|["”*]+$/g, "").trim();
  return line ? { t: line, s: "", i: 5, c: "" } : null;
}
async function geminiSomali(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  for (const model of [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash"].filter(Boolean)) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST", headers: { "x-goog-api-key": key, "content-type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: AI_RULES }] }, contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400, responseMimeType: "application/json" } })
      });
      const j = await r.json();
      const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
      const o = parseAi(parts && parts.map((x) => x.text || "").join(""));
      if (o) return o;
    } catch (e) { /* model kale isku day */ }
  }
  return null;
}
async function claudeSomali(text) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5", max_tokens: 400, system: AI_RULES, messages: [{ role: "user", content: text }] })
    });
    const j = await r.json();
    return parseAi(j && j.content && j.content[0] && j.content[0].text);
  } catch (e) { return null; }
}
// Natiijo: { t: cinwaan Soomaali, s: sharaxaad } ama null. Khalad -> 10 daqiiqo kadib mar kale.
async function translateNews(title, desc, kvf) {
  const key = "xc:tr4:" + hash(title);
  try { const c = await kvf(["GET", key]); if (c) return c === "-" ? null : JSON.parse(c); } catch (e) {}
  if (!process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) return null;
  const src = "Headline: " + title + (desc ? "\nSummary: " + desc.slice(0, 600) : "");
  let o = await geminiSomali(src);
  if (!o || !trOk(title, o.t)) o = await claudeSomali(src);
  if (o && !trOk(title, o.t)) o = null;
  try {
    await kvf(o ? ["SET", key, JSON.stringify(o), "EX", 60 * 60 * 24 * 14] : ["SET", key, "-", "EX", 600]);
    if (o) await kvf(["SET", "xc:tr3:" + hash(title), o.t, "EX", 60 * 60 * 24 * 14]); // bogga wararka (news.js)
  } catch (e) {}
  return o;
}

module.exports = async function handler(req, res) {
  try {
    const items = (await fetchNews()).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, MAX);
    // Af-Soomaali: cinwaan + sharaxaad + muhiimad (isla kaydka bot-ka: xc:tr4)
    let budget = MAX_NEW_TR;
    await Promise.all(items.map(async (n) => {
      let o = null;
      const c = await kv(["GET", "xc:tr4:" + hash(n.title)]);
      if (c && c !== "-") { try { o = JSON.parse(c); } catch (e) {} }
      else if (!c && budget-- > 0) o = await translateNews(n.title, n.desc, kv);
      if (o) { n.title_so = o.t; n.sum_so = o.s || ""; n.imp = o.i || 5; if (o.c) n.cat = o.c; }
      delete n.desc;
    }));
    // Xogta rasmiga ah ee BLS (CPI / NFP) ee hadda la daabacay -> sare
    const rel = [];
    try {
      const b = JSON.parse((await kv(["GET", "xc:bls"])) || "null");
      const MO = ["Janaayo", "Febraayo", "Maarso", "Abriil", "Maajo", "Juun", "Luulyo", "Ogosto", "Sebtember", "Oktoobar", "Nofembar", "Desember"], EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const mn = (k, a) => a[+k.slice(5) - 1] + " " + k.slice(0, 4);
      if (b && Date.now() - b.at < 3 * 864e5) {
        if (b.cpi && b.cpi.value != null) rel.push({ official: false, source: "BLS · rasmi", link: "https://www.bls.gov/cpi/", date: new Date(b.at).toISOString(),
          title: "CPI " + mn(b.cpi.month, EN) + ": " + b.cpi.value.toFixed(1) + "% y/y" + (b.cpi.mom != null ? ", " + (b.cpi.mom >= 0 ? "+" : "") + b.cpi.mom.toFixed(1) + "% m/m" : "") + (b.cpi.prev != null ? " (prev " + b.cpi.prev.toFixed(1) + "%)" : ""),
          title_so: "Sicir-bararka (CPI) " + mn(b.cpi.month, MO) + ": " + b.cpi.value.toFixed(1) + "% sannadle" + (b.cpi.mom != null ? ", " + (b.cpi.mom >= 0 ? "+" : "") + b.cpi.mom.toFixed(1) + "% bishan" : "") + (b.cpi.prev != null ? " (hore " + b.cpi.prev.toFixed(1) + "%)" : "") });
        if (b.nfp && b.nfp.value != null) rel.push({ official: false, source: "BLS · rasmi", link: "https://www.bls.gov/ces/", date: new Date(b.at).toISOString(),
          title: "Jobs " + mn(b.nfp.month, EN) + ": " + (b.nfp.value >= 0 ? "+" : "") + b.nfp.value + "K" + (b.un ? ", unemployment " + b.un.value.toFixed(1) + "%" : ""),
          title_so: "Shaqada (NFP) " + mn(b.nfp.month, MO) + ": " + (b.nfp.value >= 0 ? "+" : "") + b.nfp.value + ",000 shaqo" + (b.un ? ", shaqo la'aan " + b.un.value.toFixed(1) + "%" : "") });
      }
    } catch (e) { /* ignore */ }
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json({ updated: new Date().toISOString(), items: rel.concat(items.map((n) => ({ ...n, date: new Date(n.date).toISOString() }))) });
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({ updated: new Date().toISOString(), items: [], error: String(e.message || e) });
  }
};
