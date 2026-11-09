/* =========================================================
   /api/member — xubnaha (Telegram) + bogga maamulka (admin)
   Waxaa loo maraa /api/macro?k=member (xadka Vercel ee 12 file)

   op=bot    → magaca bot-ka (Login with Telegram)
   op=login  → POST { user } : hubi saxiixa Telegram + in uu ku jiro kooxda
   op=check  → POST { t }    : hubi token-ka (7 maalmood kasta dib ayaa loo hubiyaa kooxda)
   op=hit    → POST { p, s } : tiri booqasho (p = bogga, s = "view" | "gate")
   op=list   → POST { t }    : admin oo kaliya (maamulayaasha kooxda Telegram)

   Env (horay ayay Vercel ugu jiraan): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID,
   KV_REST_API_URL, KV_REST_API_TOKEN
   Xogta la kaydiyo: ID, magaca, @username, sawirka Telegram, taariikhaha. Wax kale maya.
   ========================================================= */
const crypto = require("crypto");
const env = (...n) => { for (const k of n) if (process.env[k]) return process.env[k]; return ""; };
const TOKEN = env("TELEGRAM_BOT_TOKEN"), CHAT = env("TELEGRAM_CHAT_ID");
const KVU = env("KV_REST_API_URL", "UPSTASH_REDIS_REST_URL", "STORAGE_REST_API_URL"), KVT = env("KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN", "STORAGE_REST_API_TOKEN");
const RECHECK = 7 * 864e5, LIFE = 60 * 864e5;
const PAGES = ["charts", "kalandarka", "lacagta"];

async function kv(cmd) {
  if (!KVU || !KVT) return null;
  try { const r = await fetch(KVU, { method: "POST", headers: { Authorization: "Bearer " + KVT, "Content-Type": "application/json" }, body: JSON.stringify(cmd) }); return (await r.json()).result; } catch (e) { return null; }
}
// Hal mar oo badan (Upstash pipeline) — commands: [[...], [...]] → [result, ...]
async function kvp(cmds) {
  if (!KVU || !KVT || !cmds.length) return cmds.map(() => null);
  try { const r = await fetch(KVU.replace(/\/$/, "") + "/pipeline", { method: "POST", headers: { Authorization: "Bearer " + KVT, "Content-Type": "application/json" }, body: JSON.stringify(cmds) }); const j = await r.json(); return Array.isArray(j) ? j.map((x) => (x ? x.result : null)) : cmds.map(() => null); } catch (e) { return cmds.map(() => null); }
}
const KEEP = 6 * 366 * 86400; // xogta booqashada: 6 sano
const hobj = (a) => { const o = {}; if (Array.isArray(a)) for (let i = 0; i < a.length; i += 2) o[a[i]] = +a[i + 1] || 0; return o; };
const tg = (m, b) => fetch("https://api.telegram.org/bot" + TOKEN + "/" + m, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b || {}) }).then((r) => r.json());
const day = (t) => new Date(t || Date.now()).toISOString().slice(0, 10);

// Saxiixa Telegram Login (https://core.telegram.org/widgets/login#checking-authorization)
function validLogin(u) {
  if (!u || !u.hash || !u.id || !u.auth_date) return false;
  const dcs = Object.keys(u).filter((k) => k !== "hash" && u[k] != null).sort().map((k) => k + "=" + u[k]).join("\n");
  const secret = crypto.createHash("sha256").update(TOKEN).digest();
  const h = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
  const a = Buffer.from(h), b = Buffer.from(String(u.hash));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  return Date.now() / 1000 - Number(u.auth_date) < 86400;
}
// Token-ka bogga (la saxiixay, lama been abuuri karo)
const KEY = () => crypto.createHash("sha256").update("xc-gate:" + TOKEN).digest();
const b64 = (s) => Buffer.from(s).toString("base64url");
function sign(o) { const p = b64(JSON.stringify(o)); return p + "." + crypto.createHmac("sha256", KEY()).update(p).digest("base64url"); }
function read(t) {
  if (!t || typeof t !== "string" || t.indexOf(".") < 0) return null;
  const [p, s] = t.split(".");
  const want = crypto.createHmac("sha256", KEY()).update(p).digest("base64url");
  if (s.length !== want.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(want))) return null;
  try { const o = JSON.parse(Buffer.from(p, "base64url").toString()); return o.exp > Date.now() ? o : null; } catch (e) { return null; }
}
async function status(id) {
  const r = await tg("getChatMember", { chat_id: CHAT, user_id: id });
  if (!r.ok) return { member: false, admin: false, err: r.description };
  const s = r.result.status;
  return { member: ["creator", "administrator", "member"].includes(s) || (s === "restricted" && r.result.is_member), admin: s === "creator" || s === "administrator" };
}
function issue(id, st) { const now = Date.now(); return sign({ id, adm: st.admin ? 1 : 0, chk: now, exp: now + LIFE }); }

async function saveUser(u, st) {
  const old = await kv(["HGET", "xc:members", String(u.id)]);
  let rec = {}; try { rec = JSON.parse(old || "{}"); } catch (e) { rec = {}; }
  const now = Date.now();
  rec = Object.assign(rec, { id: u.id, name: [u.first_name, u.last_name].filter(Boolean).join(" "), username: u.username || rec.username || "", photo: u.photo_url || rec.photo || "", member: st.member, admin: st.admin, last: now });
  if (!rec.first) { rec.first = now; await kv(["HINCRBY", "xc:joins", day(), 1]); }
  if (st.member && !rec.joined) rec.joined = now;
  rec.logins = (rec.logins || 0) + 1;
  await kv(["HSET", "xc:members", String(u.id), JSON.stringify(rec)]);
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const send = (code, o) => { res.statusCode = code; res.end(JSON.stringify(o)); };
  if (!TOKEN || !CHAT) return send(500, { error: "TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID ma jiraan" });
  const op = String((req.query && req.query.op) || ""), body = (req.body && typeof req.body === "object") ? req.body : (() => { try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; } })();
  try {
    if (op === "px") {
      // Proxy: OKX iyo Bybit (browser-ka si toos ah uma oggola) — liis go'an oo kaliya
      const u = String((req.query && req.query.u) || "");
      const OK = ["https://www.okx.com/api/v5/rubik/stat/", "https://api.bybit.com/v5/market/account-ratio?"];
      if (!OK.some((a) => u.startsWith(a)) || u.length > 400) return send(400, { error: "url" });
      try {
        const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 (XogtaCrypto)", Accept: "application/json" } });
        const txt = await r.text();
        res.setHeader("Cache-Control", "public, s-maxage=55, stale-while-revalidate=120");
        res.statusCode = r.status; return res.end(txt);
      } catch (e) { return send(502, { error: "upstream" }); }
    }
    if (op === "bot") {
      let u = await kv(["GET", "xc:botname"]);
      if (!u) { const me = await tg("getMe"); u = me.ok ? me.result.username : ""; if (u) await kv(["SET", "xc:botname", u, "EX", 86400]); }
      res.setHeader("Cache-Control", "public, s-maxage=3600");
      return send(200, { bot: u });
    }
    if (op === "login") {
      const u = body.user;
      if (!validLogin(u)) return send(401, { error: "Saxiixa Telegram ma saxna" });
      const st = await status(u.id);
      await saveUser(u, st);
      return send(200, { member: st.member, admin: st.admin, t: st.member || st.admin ? issue(u.id, st) : null, name: u.first_name || "", err: st.err || "" });
    }
    if (op === "check") {
      const o = read(body.t); if (!o) return send(200, { member: false });
      if (Date.now() - o.chk < RECHECK) return send(200, { member: true, admin: !!o.adm, t: body.t });
      const st = await status(o.id);
      const old = await kv(["HGET", "xc:members", String(o.id)]);
      if (old) { try { const r = JSON.parse(old); r.member = st.member; r.admin = st.admin; r.last = Date.now(); await kv(["HSET", "xc:members", String(o.id), JSON.stringify(r)]); } catch (e) { /* ignore */ } }
      return send(200, { member: st.member, admin: st.admin, t: st.member || st.admin ? issue(o.id, st) : null });
    }
    if (op === "track") {
      // Booqasho kasta (bog kasta) — dal, booqde gaar ah (HyperLogLog), bogga
      const ua = String(req.headers["user-agent"] || "");
      if (!ua || /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|vercel/i.test(ua)) return send(200, { ok: 0 });
      const cc = String(req.headers["x-vercel-ip-country"] || "XX").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2) || "XX";
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
      const vid = String(body.v || "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 32) || crypto.createHash("sha256").update(ip + ua).digest("hex").slice(0, 16);
      const pg = String(body.p || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 24) || "other";
      const d = day(), m = d.slice(0, 7), y = d.slice(0, 4);
      const r = await kvp([["PFADD", "xc:u:d:" + d, vid], ["PFADD", "xc:u:m:" + m, vid], ["PFADD", "xc:u:y:" + y, vid], ["PFADD", "xc:u:all", vid],
        ["HINCRBY", "xc:d:" + d, "v", 1], ["HINCRBY", "xc:d:" + d, "p:" + pg, 1], ["HINCRBY", "xc:m:" + m, "v", 1],
        ["EXPIRE", "xc:d:" + d, KEEP], ["EXPIRE", "xc:u:d:" + d, KEEP], ["EXPIRE", "xc:m:" + m, KEEP], ["EXPIRE", "xc:u:m:" + m, KEEP]]);
      const more = [];
      if (r[0] === 1) more.push(["HINCRBY", "xc:d:" + d, "c:" + cc, 1]);
      if (r[1] === 1) more.push(["HINCRBY", "xc:m:" + m, "c:" + cc, 1]);
      if (r[3] === 1) more.push(["HINCRBY", "xc:d:" + d, "new", 1], ["HINCRBY", "xc:m:" + m, "new", 1]);
      if (more.length) await kvp(more);
      return send(200, { ok: 1 });
    }
    if (op === "stats") {
      const o = read(body.t);
      if (!o || !(o.pw && o.adm)) return send(401, { error: "Login" });
      const now = Date.now(), D = [], M = [], Y = [];
      for (let k = 89; k >= 0; k--) D.push(day(now - k * 864e5));
      const t0 = new Date(); for (let k = 59; k >= 0; k--) { const x = new Date(Date.UTC(t0.getUTCFullYear(), t0.getUTCMonth() - k, 1)); M.push(x.toISOString().slice(0, 7)); }
      for (let k = 4; k >= 0; k--) Y.push(String(t0.getUTCFullYear() - k));
      const dk = (a) => a.map((d) => "xc:u:d:" + d);
      const cmds = [].concat(
        D.map((d) => ["HGETALL", "xc:d:" + d]), D.map((d) => ["PFCOUNT", "xc:u:d:" + d]),
        M.map((m) => ["HGETALL", "xc:m:" + m]), M.map((m) => ["PFCOUNT", "xc:u:m:" + m]),
        Y.map((y) => ["PFCOUNT", "xc:u:y:" + y]),
        [["PFCOUNT", "xc:u:all"], ["PFCOUNT"].concat(dk(D.slice(-7))), ["PFCOUNT"].concat(dk(D.slice(-14, -7))), ["PFCOUNT"].concat(dk(D.slice(-30))), ["PFCOUNT"].concat(dk(D.slice(-60, -30)))]);
      const r = await kvp(cmds); let i = 0;
      const dh = D.map(() => hobj(r[i++])), du = D.map(() => +r[i++] || 0), mh = M.map(() => hobj(r[i++])), mu = M.map(() => +r[i++] || 0), yu = Y.map(() => +r[i++] || 0);
      const [all, wau, wau0, mau, mau0] = [r[i++], r[i++], r[i++], r[i++], r[i++]].map((x) => +x || 0);
      const cnt = await tg("getChatMemberCount", { chat_id: CHAT }).catch(() => ({}));
      return send(200, { kv: !!KVU, days: D.map((d, j) => ({ d, u: du[j], h: dh[j] })), months: M.map((m, j) => ({ m, u: mu[j], h: mh[j] })), years: Y.map((y, j) => ({ y, u: yu[j], v: M.filter((m) => m.startsWith(y)).reduce((a, m) => a + (mh[M.indexOf(m)].v || 0), 0) })), all, wau, wau0, mau, mau0, group: cnt && cnt.ok ? cnt.result : null });
    }
    if (op === "hit") {
      const p = PAGES.includes(body.p) ? body.p : null, s = body.s === "gate" ? "gate" : body.s === "member" ? "member" : "view";
      if (p) { await kv(["HINCRBY", "xc:hits:" + day(), p + ":" + s, 1]); await kv(["EXPIRE", "xc:hits:" + day(), 120 * 86400]); }
      const o = read(body.t);
      if (o) { const old = await kv(["HGET", "xc:members", String(o.id)]); if (old) { try { const r = JSON.parse(old); r.last = Date.now(); r.views = (r.views || 0) + 1; await kv(["HSET", "xc:members", String(o.id), JSON.stringify(r)]); } catch (e) { /* ignore */ } } }
      return send(200, { ok: true });
    }
    if (op === "admin") {
      // Password-ka maamulka: Vercel → Environment Variables → ADMIN_PASSWORD (Secret)
      const PW = env("ADMIN_PASSWORD").trim();
      if (!PW) return send(500, { error: "ADMIN_PASSWORD Vercel kuma jiro → Settings → Environment Variables ku dar, kadib Redeploy." });
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x", k = "xc:admtry:" + ip + ":" + new Date().toISOString().slice(0, 13);
      const n = await kv(["INCR", k]); await kv(["EXPIRE", k, 3600]);
      if (n != null && n > 20) return send(429, { error: "Isku day badan (20 jeer). Sug 1 saac." });
      const a1 = crypto.createHash("sha256").update(String(body.pw || "").trim()).digest(), a2 = crypto.createHash("sha256").update(PW).digest();
      if (!crypto.timingSafeEqual(a1, a2)) return send(401, { error: "Password-ku waa khalad" });
      const now = Date.now();
      return send(200, { t: sign({ id: 0, adm: 1, pw: 1, chk: now, exp: now + 30 * 864e5 }) });
    }
    if (op === "list") {
      const o = read(body.t);
      if (!o) return send(401, { error: "Login" });
      if (!(o.pw && o.adm)) { const st = await status(o.id); if (!st.admin) return send(403, { error: "Admin oo kaliya" }); }
      if (!KVU) return send(200, { members: [], days: [], kv: false });
      const raw = (await kv(["HGETALL", "xc:members"])) || [];
      const members = []; for (let i = 0; i < raw.length; i += 2) { try { members.push(JSON.parse(raw[i + 1])); } catch (e) { /* ignore */ } }
      members.sort((a, b) => (b.last || 0) - (a.last || 0));
      const days = [];
      for (let k = 13; k >= 0; k--) {
        const d = day(Date.now() - k * 864e5), h = (await kv(["HGETALL", "xc:hits:" + d])) || [], j = await kv(["HGET", "xc:joins", d]);
        const o2 = { d, joins: +j || 0 }; for (let i = 0; i < h.length; i += 2) o2[h[i]] = +h[i + 1];
        days.push(o2);
      }
      const cnt = await tg("getChatMemberCount", { chat_id: CHAT });
      // Hubinta bot-ka: ma arki karaa kooxda? ma admin baa?
      let bot = { ok: false, msg: "" };
      try {
        const me = await tg("getMe"), ch = await tg("getChat", { chat_id: CHAT });
        const bm = me.ok ? await tg("getChatMember", { chat_id: CHAT, user_id: me.result.id }) : { ok: false, description: me.description };
        bot = { ok: !!(ch.ok && bm.ok && ["administrator", "creator", "member"].includes(bm.result.status)), name: me.ok ? me.result.username : "", chat: ch.ok ? (ch.result.title || "") : "", type: ch.ok ? ch.result.type : "", status: bm.ok ? bm.result.status : "", msg: !ch.ok ? (ch.description || "") : !bm.ok ? (bm.description || "") : "" };
        if (bot.type === "channel" && bot.status !== "administrator") bot.ok = false;
      } catch (e) { bot.msg = String(e.message || e); }
      return send(200, { kv: true, members, days, group: cnt.ok ? cnt.result : null, bot });
    }
    return send(400, { error: "op?" });
  } catch (e) {
    return send(500, { error: String(e && e.message) });
  }
};
module.exports._internal = { validLogin, sign, read };
