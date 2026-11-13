/* =========================================================
   Ogeysiisyada Telegram — /api/notify
   cron-job.org ayaa daqiiqad kasta furaya boggan.
   1) Wuxuu akhriyaa /api/live (FOMC, Kalshi) iyo /api/fed (CPI, NFP)
   2) Upstash (xusuusta) ayuu ka hubiyaa waxa horay loo diray
   3) Xog cusub -> fariin af-Soomaali ah ayuu kooxda u diraa
   Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, KV_REST_API_URL, KV_REST_API_TOKEN
   Ikhtiyaari: CRON_SECRET (haddii la dhigo: /api/notify?key=...)
   ========================================================= */
const SITE = "https://xogtacrypto.vercel.app";
const MONTHS = ["Janaayo", "Febraayo", "Maarso", "Abriil", "Maajo", "Juun", "Luulyo", "Ogosto", "Sebtember", "Oktoobar", "Nofembar", "Desember"];
const ODDS_STEP = 15; // isbeddel 15% ama ka badan ee fursadda kor u qaadista

function env(...names) { for (const n of names) if (process.env[n]) return process.env[n]; return ""; }
function monthName(ym) { const [y, m] = ym.split("-").map(Number); return MONTHS[m - 1] + " " + y; }
function range(t) { const f = (v) => Number(v).toFixed(2); return t.lo === t.hi ? f(t.lo) + "%" : f(t.lo) + "–" + f(t.hi) + "%"; }
function signK(n) { return (n >= 0 ? "+" : "−") + Math.abs(n).toLocaleString("en-US") + ",000"; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

// ---------- Upstash (xusuusta) ----------
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
// SET NX: kaliya hal mar ayuu guulaystaa -> fariin laba jeer lama diro
const claim = async (k) => (await kv(["SET", "xc:sent:" + k, Date.now(), "NX", "EX", 60 * 60 * 24 * 120])) === "OK";

// ---------- Telegram ----------
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

async function tg(method, body) {
  const r = await fetch("https://api.telegram.org/bot" + env("TELEGRAM_BOT_TOKEN") + "/" + method, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ chat_id: env("TELEGRAM_CHAT_ID"), parse_mode: "HTML" }, body))
  });
  const j = await r.json();
  if (!j.ok) throw new Error("Telegram: " + j.description);
  return j;
}
// Sawir + qoraal + badhamo. Haddii sawirku fashilmo -> sawirka bogga (og-image), kadibna qoraal oo kaliya.
async function sendPost(caption, img, buttons) {
  const reply_markup = { inline_keyboard: [buttons] };
  for (const photo of img === false ? [] : [img, SITE + "/og-image.png"].filter(Boolean)) {
    try { return await tg("sendPhoto", { photo, caption: caption.slice(0, 1024), reply_markup }); } catch (e) { /* sawirka xiga */ }
  }
  return tg("sendMessage", { text: caption, reply_markup, link_preview_options: { is_disabled: true } });
}

// ---------- Fariimaha ----------
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

// ---------- Wararka FED ----------
const NEWS_GAP_MIN = 1;
const NEWS_MIN_IMP = +(process.env.NEWS_MIN_IMPORTANCE || 7); // bot-ku wuxuu diraa kaliya wararka culus (7-10)          // ugu yaraan 5 daqiiqo u dhexeeya war kasta
const NEWS_MAX_AGE_H = 2;        // kaliya wararka 6-dii saac ee u dambeeyay
// ---------- Ilaha wararka (link toos ah) ----------
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
// Bing wuxuu link-ga dhabta ah ku qariyaa "url=" -> soo saar
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
    if (!f.cat && f.src && !FED_WORDS.test(n.title)) return; // ilaha guud: kaliya wararka FED
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


// ================= BLS (rasmi, degdeg) =================
// CPI iyo NFP waxay soo baxaan 8:30 New York (14:30 Berlin). BLS API wuu cusboonaadaa isla daqiiqadda.
// cron-job.org daqiiqad kasta ayuu bogga furaa -> daaqadda sii-deynta ayaa BLS la weydiiyaa.
// BLS_API_KEY (bilaash, ikhtiyaari): daqiiqad kasta 8:30-9:30; la'aanteed: 8:30-8:40 daqiiqad kasta + 8:45/9:00/9:15/9:30.
const BLS = { cpi: "CUUR0000SA0", core: "CUUR0000SA0L1E", cpiSa: "CUSR0000SA0", coreSa: "CUSR0000SA0L1E", pay: "CES0000000001", un: "LNS14000000" };
function nyNow() {
  const p = {}; new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
  return { wd: p.weekday, min: (+p.hour % 24) * 60 + +p.minute };
}
function blsWindow() {
  const t = nyNow(); if (t.wd === "Sat" || t.wd === "Sun") return false;
  if (env("BLS_API_KEY")) return t.min >= 510 && t.min <= 570;
  return (t.min >= 510 && t.min <= 520) || [525, 540, 555, 570].includes(t.min);
}
const ym = (y, m) => y + "-" + String(m).padStart(2, "0");
const shiftYm = (k, d) => { const [y, m] = k.split("-").map(Number); const t = new Date(Date.UTC(y, m - 1 + d, 1)); return ym(t.getUTCFullYear(), t.getUTCMonth() + 1); };
async function fetchBls() {
  const key = env("BLS_API_KEY"), y = new Date().getUTCFullYear();
  const body = { seriesid: Object.values(BLS), startyear: String(y - 2), endyear: String(y) };
  if (key) body.registrationkey = key;
  const r = await fetch("https://api.bls.gov/publicAPI/" + (key ? "v2" : "v1") + "/timeseries/data/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (j.status !== "REQUEST_SUCCEEDED") throw new Error("BLS: " + ((j.message || []).join(" ") || j.status));
  const M = {};
  j.Results.series.forEach((se) => { const m = new Map(); se.data.forEach((d) => { if (/^M(0[1-9]|1[0-2])$/.test(d.period) && d.value !== "-") m.set(ym(d.year, +d.period.slice(1)), +d.value); }); M[se.seriesID] = m; });
  const r1 = (v) => Math.round(v * 10) / 10;
  const yoy = (m, k) => (m.has(k) && m.has(shiftYm(k, -12)) ? r1((m.get(k) / m.get(shiftYm(k, -12)) - 1) * 100) : null);
  const mom = (m, k) => (m.has(k) && m.has(shiftYm(k, -1)) ? r1((m.get(k) / m.get(shiftYm(k, -1)) - 1) * 100) : null);
  const last = (m) => [...m.keys()].sort().pop();
  const out = { at: Date.now() };
  const c = M[BLS.cpi], ck = c && last(c);
  if (ck) {
    out.cpi = { month: ck, value: yoy(c, ck), prev: yoy(c, shiftYm(ck, -1)), mom: mom(M[BLS.cpiSa], ck), prevMom: mom(M[BLS.cpiSa], shiftYm(ck, -1)) };
    out.core = { month: ck, value: yoy(M[BLS.core], ck), prev: yoy(M[BLS.core], shiftYm(ck, -1)), mom: mom(M[BLS.coreSa], ck) };
  }
  const pay = M[BLS.pay], pk = pay && last(pay);
  if (pk) {
    const ch = (k) => (pay.has(k) && pay.has(shiftYm(k, -1)) ? Math.round(pay.get(k) - pay.get(shiftYm(k, -1))) : null);
    out.nfp = { month: pk, value: ch(pk), prev: ch(shiftYm(pk, -1)) };
    const u = M[BLS.un]; if (u && u.has(pk)) out.un = { month: pk, value: u.get(pk), prev: u.get(shiftYm(pk, -1)) ?? null };
  }
  return out;
}
const pp = (v) => (v == null ? "—" : (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v).toFixed(1) + "%");
function msgCpiBls(c, core) {
  const d = c.prev != null ? c.value - c.prev : 0;
  const dir = Math.abs(d) < 0.05 ? "➖ isma beddelin" : d > 0 ? "🔺 wuu kacay" : "🔻 wuu dhacay";
  const view = d > 0.05
    ? "Sicir-bararku wuu kordhay. Taasi waxay FED-ka ku riixaysaa inuu dulsaarka sare ku hayo ama kor u qaado → dollar-ku wuu xoogaysan karaa, crypto-ga iyo saamiyaduna cadaadis ayay la kulmi karaan."
    : d < -0.05
    ? "Sicir-bararku wuu yaraaday. Taasi waxay u fududaynaysaa FED-ka inuu dulsaarka dhimo → badanaa way u fiican tahay crypto-ga iyo saamiyada."
    : "Sicir-bararku wuu sii joogay. Suuqu wuxuu eegi doonaa aasaasiga (core) iyo hadalka FED-ka.";
  return "⚡ <b>HADDA LA DAABACAY · SICIR-BARARKA (CPI)</b>\n<b>" + monthName(c.month) + "</b>\n" + LINE + "\n\n" +
    "📊 Sannadle: <b>" + c.value.toFixed(1) + "%</b>" + (c.prev != null ? " (bishii hore " + c.prev.toFixed(1) + "%)" : "") + " · " + dir + "\n" +
    (c.mom != null ? "📅 Bishan kaliya: <b>" + pp(c.mom) + "</b>" + (c.prevMom != null ? " (hore " + pp(c.prevMom) + ")" : "") + "\n" : "") +
    (core && core.value != null ? "🔹 Aasaasiga (cunto iyo shidaal la'aan): <b>" + core.value.toFixed(1) + "%</b>" + (core.prev != null ? " (hore " + core.prev.toFixed(1) + "%)" : "") + (core.mom != null ? " · bishan " + pp(core.mom) : "") + "\n" : "") +
    "🎯 Hadafka FED: 2%\n\n💡 " + view + "\n\n" +
    '🏛 <b>Isha:</b> <a href="https://www.bls.gov/cpi/">BLS (rasmi)</a>\n' + LINE + "\n" +
    '📊 <a href="' + SITE + '">Xogta Crypto 24/7</a> · <a href="https://t.me/Xogtacrypto24_7">Telegram</a>';
}
function msgNfpBls(n, u) {
  const view = n.value >= 150
    ? "Suuq shaqo oo xoog leh → FED-ku wuxuu u janjeeri karaa dulsaar sare. Badanaa dollar-ka ayuu xoojiyaa, crypto-guna cadaadis ayuu la kulmi karaa."
    : n.value < 50 ? "Shaqo abuurku wuu gaabiyay → fursadda in FED-ku dulsaarka dhimo way kordhaysaa. Badanaa way u fiican tahay crypto-ga."
    : "Shaqo abuurku waa dhexdhexaad: cadaadis xoog leh oo dhinac ah ma jiro.";
  return "⚡ <b>HADDA LA DAABACAY · SHAQADA MAREYKANKA (NFP)</b>\n<b>" + monthName(n.month) + "</b>\n" + LINE + "\n\n" +
    "👷 Shaqooyin cusub: <b>" + signK(n.value) + "</b>" + (n.prev != null ? " (bishii hore " + signK(n.prev) + ")" : "") + "\n" +
    (u && u.value != null ? "📉 Shaqo la'aanta: <b>" + u.value.toFixed(1) + "%</b>" + (u.prev != null ? " (hore " + u.prev.toFixed(1) + "%)" : "") + "\n" : "") +
    "\n💡 " + view + "\n\n" +
    '🏛 <b>Isha:</b> <a href="https://www.bls.gov/ces/">BLS (rasmi)</a>\n' + LINE + "\n" +
    '📊 <a href="' + SITE + '">Xogta Crypto 24/7</a> · <a href="https://t.me/Xogtacrypto24_7">Telegram</a>';
}

// ---------- Turjumaadda ----------
// 1) AI (Claude) haddii ANTHROPIC_API_KEY uu Vercel ku jiro -> af-Soomaali dabiici ah
// 2) Haddii kale: turjumaad mashiin oo bilaash ah (MyMemory), oo la hubiyo
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
  let o = null, off = null;
  try { off = await kvf(["GET", "xc:gem:off"]); } catch (e) {}
  if (!off) {
    o = await geminiSomali(src);
    if (!o && /429|RESOURCE_EXHAUSTED/.test(AI_ERR.gemini || "")) { try { await kvf(["SET", "xc:gem:off", "1", "EX", 1800]); } catch (e) {} }
  } else AI_ERR.gemini = "xadka Gemini waa dhammaaday -> Google Translate (30 daqiiqo)";
  if (!o || !trOk(title, o.t)) o = await claudeSomali(src);
  if (o && !trOk(title, o.t)) { AI_ERR.check = "turjumaaddu ma gudbin hubinta: " + String(o.t).slice(0, 80); o = null; }
  if (!o) { const g = await gtSomali(title); if (g && trOk(title, g.t)) o = g; else if (g) AI_ERR.gtcheck = TR_WHY + " | " + String(g.t).slice(0, 80); }
  try {
    await kvf(o ? ["SET", key, JSON.stringify(o), "EX", 60 * 60 * 24 * 14] : ["SET", key, "-", "EX", 600]);
    if (o) await kvf(["SET", "xc:tr3:" + hash(title), o.t, "EX", 60 * 60 * 24 * 14]); // bogga wararka (news.js)
  } catch (e) {}
  return o;
}


// ================= X (Twitter) — akoonnada la doortay =================
// Wuxuu shaqeeyaa kaliya marka X_BEARER_TOKEN uu Vercel ku jiro (X API, developer.x.com).
// Kharashka yareynta: daqiiqad kasta HAL akoon ayaa la eegaa (wareeg) -> akoon kasta ~7 daqiiqo kasta.
// Tweet-yada waxaa lagu kaydiyaa KV (xc:xfeed) -> bot-ka iyo bogga wararka (news.js) labaduba way isticmaalaan.
const X_USERS = (process.env.X_ACCOUNTS || "BullTheoryio,Polymarket,TheStreet,Kalshi,WatcherGuru,randgroup,tokenterminal").split(",").map((x) => x.trim().replace(/^@/, "")).filter(Boolean);
async function pollX() {
  const tok = env("X_BEARER_TOKEN"); if (!tok) return [];
  const H = { headers: { Authorization: "Bearer " + tok } };
  let ids = null; try { ids = JSON.parse((await kv(["GET", "xc:xids"])) || "null"); } catch (e) {}
  if (!ids || Object.keys(ids).length !== X_USERS.length) {
    const j = await (await fetch("https://api.x.com/2/users/by?usernames=" + X_USERS.join(","), H)).json();
    ids = {}; (j.data || []).forEach((u) => { ids[u.username] = u.id; });
    await kv(["SET", "xc:xids", JSON.stringify(ids), "EX", 7 * 864e2 * 10]);
  }
  const names = Object.keys(ids); if (!names.length) return [];
  const turn = Number(await kv(["INCR", "xc:xturn"])) || 0, user = names[turn % names.length];
  const since = await kv(["GET", "xc:xsince:" + user]);
  const r = await fetch("https://api.x.com/2/users/" + ids[user] + "/tweets?max_results=5&exclude=retweets,replies&tweet.fields=created_at" + (since ? "&since_id=" + since : ""), H);
  const j = await r.json(); const tw = j.data || [];
  if (tw.length) await kv(["SET", "xc:xsince:" + user, tw[0].id]);
  let feed = []; try { feed = JSON.parse((await kv(["GET", "xc:xfeed"])) || "[]"); } catch (e) {}
  const add = tw.map((t) => ({ title: String(t.text).replace(/https?:\/\/t\.co\/\w+/g, "").replace(/@\w+/g, "").replace(/^\s*(JUST IN|BREAKING|NEW)\s*:\s*/i, "").replace(/\s+/g, " ").trim().slice(0, 280),
    link: "https://x.com/" + user + "/status/" + t.id, date: t.created_at, desc: "", source: "@" + user + " (X)", cat: "top", official: false })).filter((n) => n.title.length > 15);
  feed = add.concat(feed).filter((n) => Date.now() - Date.parse(n.date) < 48 * 3600e3).slice(0, 80);
  await kv(["SET", "xc:xfeed", JSON.stringify(feed), "EX", 3 * 864e2 * 100]);
  return feed;
}
async function loadNews() {
  const cut = Date.now() - NEWS_MAX_AGE_H * 3600e3;
  let xs = []; try { xs = await pollX(); } catch (e) { xs = []; }
  return xs.concat(await fetchNews()).filter((n) => Date.parse(n.date) > cut)
    .sort((a, b) => (b.official - a.official) || (Date.parse(b.date) - Date.parse(a.date))); // rasmiga + kan ugu cusub marka hore
}

const LINE = "━━━━━━━━━━━━━━";
const URGENT = /\b(rate (hike|cut)|hikes?|cuts?|surge|plunge|crash|war|attack|emergency|record|unexpected|more than expected|less than expected|hotter|cooler|tariffs?|default)\b/i;
async function msgNews(n) {
  const so = await translateNews(n.title, n.desc, kv);
  if (!so) return null; // Ingiriis lama diro -> mar kale ayaa la isku dayi doonaa
  if (!n.official && so.i < NEWS_MIN_IMP) return "skip";
  const CAT = { fed: "🏛 FED", macro: "📊 DHAQAALAHA", btc: "₿ CRYPTO", ai: "🤖 AI", stocks: "📈 SAHAMKA", privacy: "🔐 PRIVACY", world: "🌍 ADDUUNKA" };
  const tag = CAT[so.c] || CAT[n.cat] || "📰 WARKA";
  const head = n.official ? "🏛 <b>FEDERAL RESERVE · RASMI</b>" : (so.i >= 9 || URGENT.test(n.title) ? "⚡ <b>WAR DEGDEG AH · " : "<b>") + tag + "</b>";
  const id = hash(n.link), src = n.source || siteName(n.link);
  const page = SITE + "/wararka.html?id=" + id;
  const text = head + "\n\n" +
    "<b>" + esc(so.t) + "</b>\n" + (so.s ? "\n" + esc(so.s.slice(0, 600)) + "\n" : "") + "\n" +
    "🗞 " + esc(src) + "\n" +
    '📊 <a href="' + page + '">Xogta Crypto 24/7</a> · <a href="https://t.me/Xogtacrypto24_7">Telegram</a>';
  // Bogga web-ka (wararka.html?id=) wuxuu akhriyaa kaydkan
  const post = { id, title: n.title, title_so: so.t, sum_so: so.s || "", img: n.img || "", link: n.link, source: src, cat: so.c || n.cat || "", imp: so.i, date: new Date(Date.parse(n.date) || Date.now()).toISOString(), official: !!n.official };
  return { text, img: n.img, page, post, buttons: [{ text: "📖 Ku akhri web-ka", url: page }, { text: "🗞 Isha asalka", url: n.link }] };
}

// ================= Liquidations waaweyn (OKX — API bilaash ah oo server-ka ka shaqeeya) =================
const LIQ_MIN = +(process.env.LIQ_MIN_USD || 500000);     // amar kasta oo ka weyn -> war
const LIQ_WAVE = +(process.env.LIQ_WAVE_USD || 3000000);  // wadarta daqiiqad gudaheed -> war
const LIQ_GAP_MIN = 3;
const LIQ_COINS = ["BTC", "ETH", "SOL", "XRP", "DOGE", "BNB", "SUI", "HYPE", "ADA", "LINK", "AVAX", "LTC"];
const usd = (v) => v >= 1e9 ? "$" + (v / 1e9).toFixed(2) + "B" : v >= 1e6 ? "$" + (v / 1e6).toFixed(2) + "M" : "$" + Math.round(v / 1e3) + "K";
const px = (p) => "$" + (p >= 100 ? Math.round(p).toLocaleString("en-US") : p >= 1 ? p.toFixed(2) : p.toPrecision(4));
async function okxCt() {
  try { const c = await kv(["GET", "xc:okxct"]); if (c) return JSON.parse(c); } catch (e) {}
  const j = await (await fetch("https://www.okx.com/api/v5/public/instruments?instType=SWAP")).json();
  const m = {}; (j.data || []).forEach((x) => { m[x.instId] = [+x.ctVal, x.ctValCcy === "USD" ? 1 : 0]; });
  if (Object.keys(m).length) await kv(["SET", "xc:okxct", JSON.stringify(m), "EX", 86400]);
  return m;
}
async function pollLiq(out) {
  const ct = await okxCt();
  const lastTs = Number(await get("liq:ts")) || 0;
  const res = await Promise.all(LIQ_COINS.map((c) => fetch("https://www.okx.com/api/v5/public/liquidation-orders?instType=SWAP&state=filled&instFamily=" + c + "-USDT")
    .then((r) => r.json()).catch(() => null)));
  const rows = []; let maxTs = lastTs;
  res.forEach((j) => (j && j.data || []).forEach((g) => {
    const k = ct[g.instId]; if (!k) return;
    (g.details || []).forEach((d) => {
      const ts = +d.ts, p = +d.bkPx, sz = +d.sz; if (!ts || !p || !sz) return;
      if (ts > maxTs) maxTs = ts;
      if (ts <= lastTs) return;
      rows.push({ c: g.instId.split("-")[0], long: d.posSide ? d.posSide === "long" : d.side === "sell", p, v: k[1] ? sz * k[0] : sz * k[0] * p, ts });
    });
  }));
  if (maxTs > lastTs) await set("liq:ts", maxTs);
  if (!lastTs) { out.skipped.push("liq (bilow)"); return; }
  // Kuwa waaweyn waa la kaydiyaa ilaa la diro (10 daqiiqo)
  let pend = []; try { pend = JSON.parse((await get("liq:pend")) || "[]"); } catch (e) {}
  pend = pend.concat(rows.filter((r) => r.v >= LIQ_MIN)).filter((r) => Date.now() - r.ts < 10 * 60e3);
  const wave = rows.reduce((s, r) => s + r.v, 0), wl = rows.filter((r) => r.long).reduce((s, r) => s + r.v, 0);
  const big = pend.reduce((m, r) => Math.max(m, r.v), 0);
  const last = Number(await get("liq:last")) || 0;
  const ready = Date.now() - last >= LIQ_GAP_MIN * 60e3 || big >= LIQ_MIN * 4;
  out.liq = { orders: rows.length, total: Math.round(wave), pending: pend.length };
  if (!(pend.length || wave >= LIQ_WAVE) || !ready) { await set("liq:pend", JSON.stringify(pend)); return; }
  const top = pend.sort((a, b) => b.v - a.v).slice(0, 6);
  const text = "💥 <b>LIQUIDATIONS WAAWEYN</b>" + (big >= LIQ_MIN * 4 ? " ⚡" : "") + "\n\n" +
    top.map((r) => (r.long ? "🔴 " : "🟢 ") + "<b>" + r.c + " " + (r.long ? "LONG" : "SHORT") + "</b> la xiray · <b>" + usd(r.v) + "</b> @ " + px(r.p)).join("\n") +
    (wave >= 1e5 ? (top.length ? "\n\n" : "") + "📊 Daqiiqaddii u dambeysay: <b>" + usd(wave) + "</b> · 🔴 Long " + usd(wl) + " · 🟢 Short " + usd(wave - wl) : "") + "\n\n" +
    "<i>🔴 Long la xiray = qiimaha ayaa hoos u dhacay · 🟢 Short la xiray = kor u kacay · Isha: OKX</i>";
  try {
    await sendPost(text, false, [{ text: "💥 Liquidations live", url: SITE + "/lacagta.html#sec-liq" }]);
    await set("liq:last", Date.now()); await set("liq:pend", "[]");
    out.sent.push("liq: " + usd(big || wave));
  } catch (e) { await set("liq:pend", JSON.stringify(pend)); out.errors.push("liq: " + e.message); }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const out = { sent: [], skipped: [], errors: [] };
  try {
    const secret = env("CRON_SECRET");
    if (secret && (req.query || {}).key !== secret) return res.status(401).json({ error: "key" });
    if (!env("TELEGRAM_BOT_TOKEN") || !env("TELEGRAM_CHAT_ID")) return res.status(200).json({ error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID lama helin" });

    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const base = "https://" + host;
    const [live, fed] = await Promise.all([
      fetch(base + "/api/live").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(base + "/api/fed").then((r) => (r.ok ? r.json() : null)).catch(() => null)
    ]);

    // Markii ugu horraysay: xasuuso xogta hadda jirta, ha dirin (si xog duug ah loo dirin)
    const first = (await kv(["SET", "xc:init", Date.now(), "NX"])) === "OK";

    const jobs = [];
    // BLS (rasmi, degdeg) — marka hore
    if (blsWindow()) {
      try {
        const b = await fetchBls();
        let prev = null; try { prev = JSON.parse((await kv(["GET", "xc:bls"])) || "null"); } catch (e) {}
        await kv(["SET", "xc:bls", JSON.stringify(b), "EX", 60 * 60 * 24 * 40]);
        // Kaliya marka bil cusub hadda soo baxdo (xog duug ah lama diro)
        if (prev && b.cpi && b.cpi.value != null && (!prev.cpi || prev.cpi.month !== b.cpi.month)) jobs.push(["cpi:" + b.cpi.month, () => msgCpiBls(b.cpi, b.core)]);
        if (prev && b.nfp && b.nfp.value != null && (!prev.nfp || prev.nfp.month !== b.nfp.month)) jobs.push(["nfp:" + b.nfp.month, () => msgNfpBls(b.nfp, b.un)]);
        if (!prev) out.skipped.push("bls (bilow)");
        out.bls = { cpi: b.cpi && b.cpi.month, nfp: b.nfp && b.nfp.month };
      } catch (e) { out.errors.push(String(e.message || e)); }
    }
    if (live && live.fomc && live.fomc.action && Date.now() - Date.parse(live.fomc.date) < 3 * 864e5) {
      jobs.push(["fomc:" + live.fomc.date.slice(0, 10), () => msgFomc(live.fomc)]);
    }
    if (fed && fed.latest) {
      const L = fed.latest;
      if (L.cpi) jobs.push(["cpi:" + L.cpi.month, () => msgCpi(L.cpi, L.core)]);
      if (L.nfp) jobs.push(["nfp:" + L.nfp.month, () => msgNfp(L.nfp, L.un)]);
    }
    for (const [key, build] of jobs) {
      if (!(await claim(key))) { out.skipped.push(key); continue; }
      if (first) { out.skipped.push(key + " (bilow)"); continue; }
      try { await send(build()); out.sent.push(key); }
      catch (e) { await kv(["DEL", "xc:sent:" + key]); out.errors.push(key + ": " + e.message); }
    }

    // Filashada: kaliya marka fursadda kor u qaadistu 15% ama ka badan isbeddesho
    if (live && live.odds && live.odds.markets && live.odds.markets.length) {
      const o = live.odds;
      const hike = o.markets.filter((m) => m.kind === "hike").reduce((s, m) => s + m.p, 0);
      const lastEvent = await get("odds:event");
      const last = Number(await get("odds:hike"));
      if (lastEvent !== o.event || isNaN(last)) {
        await set("odds:event", o.event); await set("odds:hike", hike); out.skipped.push("odds (bilow)");
      } else if (Math.abs(hike - last) >= ODDS_STEP) {
        await set("odds:hike", hike);
        if (!first) { try { await send(msgOdds(o, hike, last)); out.sent.push("odds"); } catch (e) { await set("odds:hike", last); out.errors.push("odds: " + e.message); } }
      }
    }
    // Wararka: hal war mar kasta, ugu yaraan 5 daqiiqo u dhexeeya
    const news = await loadNews();
    const newsFirst = (await kv(["SET", "xc:news:init2", Date.now(), "NX"])) === "OK";
    if (newsFirst) {
      for (const n of news) await kv(["SET", "xc:sent:news:" + hash(n.link), 1, "EX", 60 * 60 * 72]);
      out.skipped.push("news x" + news.length + " (bilow)");
    } else {
      const last = Number(await get("news:last")) || 0;
      if (Date.now() - last >= NEWS_GAP_MIN * 60e3) {
        let tries = 0;
        for (const n of news) {
          const key = "xc:sent:news:" + hash(n.link);
          if (await kv(["GET", key])) continue;
          let text = null;
          try { text = await msgNews(n); } catch (e) { text = null; }
          if (!text) { out.skipped.push("news (turjumaad sug): " + n.title.slice(0, 50)); if (++tries >= 4) break; continue; }
          if (text === "skip") { await kv(["SET", key, "low", "EX", 60 * 60 * 72]); out.skipped.push("news (muhiim ma aha): " + n.title.slice(0, 50)); if (++tries >= 4) break; continue; }
          if ((await kv(["SET", key, Date.now(), "NX", "EX", 60 * 60 * 72])) !== "OK") continue;
          try {
            await kv(["SET", "xc:post:" + text.post.id, JSON.stringify(text.post), "EX", 60 * 60 * 24 * 60]);
            await sendPost(text.text, text.img, text.buttons); await set("news:last", Date.now()); out.sent.push("news: " + n.title.slice(0, 60));
          }
          catch (e) { await kv(["DEL", key]); out.errors.push("news: " + e.message); }
          break; // hal war oo kaliya daqiiqaddan
        }
      } else out.skipped.push("news (sug)");
    }

    // Liquidations waaweyn
    try { await pollLiq(out); } catch (e) { out.errors.push("liq: " + String(e.message || e)); }

    if (Object.keys(AI_ERR).length) out.ai = AI_ERR;
    return res.status(200).json(out);
  } catch (e) {
    out.errors.push(String(e.message || e));
    return res.status(200).json(out);
  }
};
module.exports._internal = { pickImg, parseTg, pollLiq, msgFomc, msgCpi, msgNfp, msgOdds, parseRss, msgNews, trOk, realLink, fetchBls, msgCpiBls, msgNfpBls, blsWindow, parseAi };
