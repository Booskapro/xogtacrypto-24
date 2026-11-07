/* Ogeysiisyada Telegram — /api/notify */
const SITE = "https://xogtacrypto.vercel.app";
const MONTHS = ["Janaayo", "Febraayo", "Maarso", "Abriil", "Maajo", "Juun", "Luulyo", "Ogosto", "Sebtember", "Oktoobar", "Nofembar", "Desember"];
const ODDS_STEP = 15;

function env(...names) { for (const n of names) if (process.env[n]) return process.env[n]; return ""; }
function monthName(ym) { const [y, m] = ym.split("-").map(Number); return MONTHS[m - 1] + " " + y; }
function range(t) { const f = (v) => Number(v).toFixed(2); return t.lo === t.hi ? f(t.lo) + "%" : f(t.lo) + "–" + f(t.hi) + "%"; }
function signK(n) { return (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US") + ",000"; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

async function kv(cmd) {
  const url = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "STORAGE_REST_API_URL");
  const token = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "STORAGE_REST_API_TOKEN");
  if (!url || !token) throw new Error("Upstash lama helin (KV_REST_API_URL / KV_REST_API_TOKEN)");
  const r = await fetch(url, { method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error("Upstash: " + j.error);
  return j.result;
}
const get = (k) => kv(["GET", "xc:" + k]);
const set = (k, v) => kv(["SET", "xc:" + k, String(v)]);
const claim = async (k) => (await kv(["SET", "xc:sent:" + k, Date.now(), "NX", "EX", 60 * 60 * 24 * 120])) === "OK";

async function send(text, previewUrl) {
  const token = env("TELEGRAM_BOT_TOKEN"), chat = env("TELEGRAM_CHAT_ID");
  const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.assign({ chat_id: chat, text, parse_mode: "HTML" },
      previewUrl ? { link_preview_options: { url: previewUrl, prefer_large_media: true } } : { link_preview_options: { is_disabled: true } }))
  });
  const j = await r.json();
  if (!j.ok) throw new Error("Telegram: " + j.description);
}

function msgFomc(f) {
  const word = { hike: "KOR U QAADAY", cut: "DHIMAY", hold: "HAYAY (isma beddelin)" }[f.action];
  const icon = { hike: "🔺", cut: "🔻", hold: "⏸" }[f.action];
  const why = {
    hike: "Amaahdu way qaalisay. Badanaa dollar-ku wuu xoogaystaa, crypto-ga iyo saamiyaduna cadaadis ayay la kulmaan.",
    cut: "Amaahdu way jabtay. Badanaa dollar-ku wuu daciifaa, crypto-ga iyo saamiyaduna way kacaan.",
    hold: "Qiimaha amaahdu isma beddelin. FED-ku wuxuu sugayaa xog dheeraad ah oo ku saabsan sicir-bararka iyo shaqada."
  }[f.action];
  return "🔴 <b>CUSUB · GO'AANKA FED</b>\n\n" + icon + " FED-ku dulsaarka wuu <b>" + word + "</b>\n" +
    "Dulsaarka hadda: <b>" + range(f.range) + "</b>\n\n" + why + "\n\n" +
    '📄 <a href="' + esc(f.link) + '">Bayaanka rasmiga ah</a>\n👉 ' + SITE;
}
function msgCpi(c, core) {
  const d = c.prev != null ? c.value - c.prev : 0;
  const dir = Math.abs(d) < 0.05 ? "wuu sii joogay" : d > 0 ? "🔺 wuu kacay" : "🔻 wuu dhacay";
  const view = c.value > 2.5
    ? "Sicir-bararku wali wuu ka sarreeyaa hadafka FED (2%). Taasi waxay FED-ka ku riixaysaa inuu dulsaarka sare ku hayo ama kor u qaado."
    : "Sicir-bararku wuxuu ku dhow yahay hadafka FED (2%). Taasi waxay u fududaynaysaa in dulsaarka la dhimo.";
  return "🔴 <b>CUSUB · SICIR-BARARKA (CPI) " + monthName(c.month).toUpperCase() + "</b>\n\n" +
    "📊 Sannadle: <b>" + c.value.toFixed(1) + "%</b>" + (c.prev != null ? " (bishii hore " + c.prev.toFixed(1) + "%)" : "") + " · " + dir + "\n" +
    (core && core.month === c.month ? "🔹 Aasaasiga (cunto iyo shidaal la'aan): <b>" + core.value.toFixed(1) + "%</b>\n" : "") +
    "\n" + view + "\n\n👉 " + SITE;
}
function msgNfp(n, u) {
  const view = n.value >= 100
    ? "Suuq shaqo oo xoog leh: FED-ku wuxuu u janjeeri karaa inuu dulsaarka sare ku hayo ama kor u qaado. Badanaa dollar-ka ayuu xoojiyaa."
    : n.value < 50 ? "Shaqo abuurku wuu gaabiyay: taasi waxay FED-ka ku riixi kartaa inuu dulsaarka dhimo."
    : "Shaqo abuurku waa dhexdhexaad: cadaadis xoog leh oo dhinac ah ma jiro.";
  return "🔴 <b>CUSUB · SHAQADA (NFP) " + monthName(n.month).toUpperCase() + "</b>\n\n" +
    "👷 Shaqooyin cusub: <b>" + signK(n.value) + "</b>" + (n.prev != null ? " (bishii hore " + signK(n.prev) + ")" : "") + "\n" +
    (u && u.month === n.month ? "📉 Shaqo la'aanta: <b>" + u.value.toFixed(1) + "%</b>" + (u.prev != null ? " (bishii hore " + u.prev.toFixed(1) + "%)" : "") + "\n" : "") +
    "\n" + view + "\n\n👉 " + SITE;
}
function oddsLabel(m) {
  if (m.kind === "hold") return "Hayn";
  const more = m.bps % 25 !== 0, base = ((more ? m.bps - 1 : m.bps) / 100).toFixed(2) + "%";
  return m.kind === "hike" ? (more ? "Kor ka badan +" : "Kor +") + base : (more ? "Dhimis ka badan −" : "Dhimis −") + base;
}
function msgOdds(o, hike, prev) {
  const d = new Date(o.close);
  const when = d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
  const list = o.markets.filter((m, i) => i < 3 || m.p >= 2).map((m) => "• " + oddsLabel(m) + ": <b>" + m.p.toFixed(0) + "%</b>").join("\n");
  return "📊 <b>FILASHADA SUUQA WAY ISBEDDESHAY</b>\n\n" +
    "Fursadda in FED-ku dulsaarka kor u qaado (" + when + "): <b>" + prev.toFixed(0) + "% → " + hike.toFixed(0) + "%</b>\n\n" + list +
    '\n\nIsha: <a href="' + esc(o.url) + '">Kalshi</a>\n👉 ' + SITE;
}

const NEWS_GAP_MIN = 5;
const NEWS_MAX_AGE_H = 6;
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
  const key = (ai ? "xc:tr3:" : "xc:tr2:") +
