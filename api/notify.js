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
async function send(text) {
  const token = env("TELEGRAM_BOT_TOKEN"), chat = env("TELEGRAM_CHAT_ID");
  const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true })
  });
  const j = await r.json();
  if (!j.ok) throw new Error("Telegram: " + j.description);
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
    return res.status(200).json(out);
  } catch (e) {
    out.errors.push(String(e.message || e));
    return res.status(200).json(out);
  }
};
module.exports._internal = { msgFomc, msgCpi, msgNfp, msgOdds };
