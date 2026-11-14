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
    const im = /message_photo_wrap[^>]*background-image:url\('([^']+)'\)/.exec(b);
    return text ? { title: text.slice(0, 280), link: "https://t.me/" + id, date: t[1], desc: "", img: im ? im[1] : "" } : null;
  }).filter(Boolean).slice(-15);
}
const FED_RSS = ["https://www.federalreserve.gov/feeds/press_monetary.xml", "https://www.federalreserve.gov/feeds/speeches.xml"];
const SKIP_FED = /enforcement action|termination of enforcement|discount rate|request for comment|applications|approval of|bank holding/i;

function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, "").trim();
}
function pickImg(raw) {
  const r = String(raw || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  const pats = [/<media:content[^>]*url="([^"]+)"/i, /<media:thumbnail[^>]*url="([^"]+)"/i, /<enclosure[^>]*url="([^"]+\.(?:jpe?g|png|webp)[^"]*)"/i,
    /<News:Image>\s*([^<\s]+)\s*<\/News:Image>/i, /<img[^>]+src="(https?:[^"]+)"/i];
  for (const p of pats) { const m = p.exec(r); if (m && /^https?:/i.test(m[1]) && !/\.(gif|svg)(\?|$)/i.test(m[1]) && !/pixel|tracking|feedburner|1x1/i.test(m[1])) return /bing\.com\/th/.test(m[1]) ? m[1] + "&w=800&h=450&c=14" : m[1]; }
  return "";
}
function parseRss(xml) {
  return (String(xml).match(/<item>[\s\S]*?<\/item>/g) || []).map((it) => {
    const tag = (t) => { const m = new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">").exec(it); return m ? decode(m[1]) : ""; };
    return { title: tag("title"), link: tag("link"), date: tag("pubDate"), source: tag("News:Source") || tag("source"), desc: tag("description").slice(0, 600), img: pickImg(it) };
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
    list.push({ title: n.title.replace(/ - [^-]{2,40}$/, ""), link, date: n.date, desc: n.desc, img: n.img || "", source: f.src || n.source || siteName(link), cat: f.cat || "fed", official: false });
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

const BAD_SO = /\b(xasan sheekh|khayre|farmaajo|somaliland|puntland|muqdisho|al-shabaab|xamar|dahabshiil|hormuud|world remit|xawaala)\b/i;
let TR_WHY = "";
function trOk(src, so) {
  if (!so) return false;
  const r = so.length / Math.max(1, src.length);
  TR_WHY = "";
  if (r < 0.4 || r > 2.6) { TR_WHY = "dherer " + r.toFixed(2); return false; }
  if (BAD_SO.test(so) && !BAD_SO.test(src) && !/somal/i.test(src)) { TR_WHY = "magac Soomaali"; return false; }
  // Ingiriis lama aqbalo: haddii erayada badankoodu la mid yihiin asalka
  const ws = (x) => String(x).toLowerCase().match(/[a-z]{3,}/g) || [], sw = new Set(ws(src)), ow = ws(so);
  if (ow.length > 2 && ow.filter((w) => sw.has(w)).length / ow.length > 0.6) { TR_WHY = "Ingiriis"; return false; }
  const sn = so.replace(/(\d),(\d)/g, "$1.$2");
  for (const n of (src.match(/\d+(?:\.\d+)?/g) || [])) if (sn.indexOf(n) === -1 && so.indexOf(n) === -1 && sn.indexOf(n.replace(".", ",")) === -1) { TR_WHY = "tiro " + n; return false; }
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
const AI_ERR = {};
// Kayd bilaash ah: Google Translate (cinwaan oo kaliya; muhiimadda waxaa go'aamiya erayada degdegga ah)
async function gtSomali(text) {
  try {
    const r = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=so&dt=t&q=" + encodeURIComponent(text.slice(0, 450)));
    const j = await r.json(); const so = (j && j[0] || []).map((x) => x[0]).join("").trim();
    if (!so) { AI_ERR.gt = "madhan"; return null; }
    return { t: so, s: "", i: /\b(rate (hike|cut)|war|attack|crash|plunge|surge|emergency|record|default|hack(ed|ers?)?|exploit|stole|tariffs?|recession|bankrupt|ETF|SEC|ban|all-time high|billion|Fed (raises|cuts|holds)|Powell|CPI|inflation|jobs report)\b/i.test(text) ? 8 : 6, c: "" };
  } catch (e) { AI_ERR.gt = String(e.message || e).slice(0, 100); return null; }
}
async function geminiSomali(text) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) { AI_ERR.gemini = "GEMINI_API_KEY Vercel kuma jiro"; return null; }
  for (const model of [process.env.GEMINI_MODEL, "gemini-3.8-flash", "gemini-flash-latest"].filter(Boolean)) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent", {
        method: "POST", headers: { "x-goog-api-key": key, "content-type": "application/json" },
        body: JSON.stringify({ systemInstruction: { parts: [{ text: AI_RULES }] }, contents: [{ role: "user", parts: [{ text }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 400, responseMimeType: "application/json" } })
      });
      const j = await r.json();
      if (!r.ok || j.error) { AI_ERR.gemini = model + ": " + r.status + " " + ((j.error && (j.error.status || "") + " " + (j.error.message || "")) || "").slice(0, 160); continue; }
      const parts = j && j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
      const o = parseAi(parts && parts.map((x) => x.text || "").join(""));
      if (o) return o;
      AI_ERR.gemini = model + ": jawaab madhan (" + ((j.candidates && j.candidates[0] && j.candidates[0].finishReason) || "?") + ")";
    } catch (e) { AI_ERR.gemini = model + ": " + String(e.message || e).slice(0, 120); }
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
  const src = "Headline: " + title + (desc ? "\nSummary: " + desc.slice(0, 600) : "");
  // Bogga wararka: Google Translate (bilaash, xad la'aan) -> Gemini waxaa loo dhaafaa bot-ka
  let o = null;
  if (o && !trOk(title, o.t)) { AI_ERR.check = "turjumaaddu ma gudbin hubinta: " + String(o.t).slice(0, 80); o = null; }
  if (!o) { const g = await gtSomali(title); if (g && trOk(title, g.t)) o = g; else if (g) AI_ERR.gtcheck = TR_WHY + " | " + String(g.t).slice(0, 80); }
  try {
    await kvf(o ? ["SET", key, JSON.stringify(o), "EX", 60 * 60 * 24 * 14] : ["SET", key, "-", "EX", 600]);
    if (o) await kvf(["SET", "xc:tr3:" + hash(title), o.t, "EX", 60 * 60 * 24 * 14]); // bogga wararka (news.js)
  } catch (e) {}
  return o;
}

module.exports = async function handler(req, res) {
  try {
    // Hal war (bogga wararka.html?id=) — bot-ka Telegram ayaa kaydiya
    const qid = String((req.query || {}).id || "").replace(/[^a-z0-9]/g, "").slice(0, 16);
    if (qid) {
      let it = null; try { it = JSON.parse((await kv(["GET", "xc:post:" + qid])) || "null"); } catch (e) {}
      res.setHeader("Cache-Control", it ? "s-maxage=600, stale-while-revalidate=3600" : "s-maxage=30");
      return res.status(it ? 200 : 404).json({ item: it });
    }
    // Tweet-yada X (notify.js ayaa KV ku kaydiya marka X_BEARER_TOKEN jiro)
    let xs = []; try { xs = JSON.parse((await kv(["GET", "xc:xfeed"])) || "[]"); } catch (e) {}
    // Portfolio-yada: iibka/iibinta (notify.js ayaa kaydiya)
    let pfn = []; try { pfn = ((await kv(["LRANGE", "xc:pfnews", 0, 9])) || []).map((x) => JSON.parse(x)).filter((x) => Date.now() - Date.parse(x.date) < 7 * 864e5); } catch (e) {}
    const items = xs.concat(await fetchNews()).sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, MAX);
    // Af-Soomaali: cinwaan + sharaxaad + muhiimad (isla kaydka bot-ka: xc:tr4)
    let budget = MAX_NEW_TR;
    await Promise.all(items.map(async (n) => {
      let o = null;
      const c = await kv(["GET", "xc:tr4:" + hash(n.title)]);
      if (c && c !== "-") { try { o = JSON.parse(c); } catch (e) {} }
      else if (!c && budget-- > 0) o = await translateNews(n.title, n.desc, kv);
      n.id = hash(n.link);
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
    res.status(200).json({ updated: new Date().toISOString(), items: rel.concat(pfn, items.map((n) => ({ ...n, date: new Date(n.date).toISOString() }))) });
  } catch (e) {
    res.setHeader("Cache-Control", "s-maxage=60");
    res.status(200).json({ updated: new Date().toISOString(), items: [], error: String(e.message || e) });
  }
};
