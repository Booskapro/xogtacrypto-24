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

async function send(text, preview) {
  const token = env("TELEGRAM_BOT_TOKEN"), chat = env("TELEGRAM_CHAT_ID");
  const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: !preview })
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
const GNEWS = "https://news.google.com/rss/search?q=" + encodeURIComponent('"Federal Reserve" OR "the Fed" OR FOMC OR Warsh when:1d') + "&hl=en-US&gl=US&ceid=US:en";
const SKIP_FED = /enforcement action|termination of enforcement|discount rate|request for comment|applications|approval of|bank holding/i;

function decode(s) {
  return String(s || "").replace(/<!\[CDATA\[|\]\]>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/<[^>]+>/g, "").trim();
}
function parseRss(xml) {
  const out = [];
  const items = String(xml).match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const it of items) {
    const tag = (t) => { const m = new RegExp("<" + t + "[^>]*>([\\s\\S]*?)</" + t + ">").exec(it); return m ? decode(m[1]) : ""; };
    out.push({ title: tag("title"), link: tag("link"), date: tag("pubDate"), source: tag("source") });
  }
  return out;
}
function hash(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); }

async function toSomali(text) {
  const key = "xc:tr:" + hash(text);
  try { const c = await kv(["GET", key]); if (c) return c; } catch (e) {}
  try {
    const r = await fetch("https://api.mymemory.translated.net/get?langpair=en|so&q=" + encodeURIComponent(text.slice(0, 450)));
    const j = await r.json();
    const t = j && j.responseData && j.responseData.translatedText;
    if (t && !/MYMEMORY WARNING|QUERY LENGTH|INVALID/i.test(t)) { const so = decode(t); try { await kv(["SET", key, so, "EX", 60 * 60 * 24 * 14]); } catch (e) {} return so; }
  } catch (e) {}
  return null;
}

async function loadNews(live) {
  const list = [];
  try {
    const xml = await fetch(GNEWS, { headers: { "User-Agent": "Mozilla/5.0 (XogtaCrypto)" } }).then((r) => r.text());
    parseRss(xml).forEach((n) => {
      const src = n.source || (n.title.match(/ - ([^-]+)$/) || [])[1] || "";
      list.push({ title: n.title.replace(/ - [^-]+$/, ""), link: n.link, date: n.date, source: src.trim() });
    });
  } catch (e) {}
  ((live && live.news) || []).forEach((n) => {
    if (SKIP_FED.test(n.title)) return;
    list.push({ title: n.title, link: n.link, date: n.date, source: "Federal Reserve", official: true });
  });
  const cut = Date.now() - NEWS_MAX_AGE_H * 3600e3;
  return list.filter((n) => n.title && n.link && Date.parse(n.date) > cut)
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
}

async function msgNews(n) {
  const so = await toSomali(n.title);
  return (n.official ? "🏛 <b>FEDERAL RESERVE · RASMI</b>" : "📰 <b>WAR · FED</b>") + "\n\n" +
    "<b>" + esc(so || n.title) + "</b>\n" +
    "\n🗞 " + esc(n.source || "War") + "\n" +
    '🔗 <a href="' + esc(n.link) + '">Akhri warka oo dhan</a>';
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

    const first = (await kv(["SET", "xc:init", Date.now(), "NX"])) === "OK";

    const jobs = [];
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

    const news = await loadNews(live);
    const newsFirst = (await kv(["SET", "xc:news:init", Date.now(), "NX"])) === "OK";
    if (newsFirst) {
      for (const n of news) await kv(["SET", "xc:sent:news:" + hash(n.link), 1, "EX", 60 * 60 * 72]);
      out.skipped.push("news x" + news.length + " (bilow)");
    } else {
      const last = Number(await get("news:last")) || 0;
      if (Date.now() - last >= NEWS_GAP_MIN * 60e3) {
        for (const n of news) {
          const key = "xc:sent:news:" + hash(n.link);
          const ok = (await kv(["SET", key, Date.now(), "NX", "EX", 60 * 60 * 72])) === "OK";
          if (!ok) continue;
          try { await send(await msgNews(n), true); await set("news:last", Date.now()); out.sent.push("news: " + n.title.slice(0, 60)); }
          catch (e) { await kv(["DEL", key]); out.errors.push("news: " + e.message); }
          break;
        }
      } else out.skipped.push("news (sug)");
    }

    return res.status(200).json(out);
  } catch (e) {
    out.errors.push(String(e.message || e));
    return res.status(200).json(out);
  }
};
