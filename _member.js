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
    if (op === "hit") {
      const p = PAGES.includes(body.p) ? body.p : null, s = body.s === "gate" ? "gate" : body.s === "member" ? "member" : "view";
      if (p) { await kv(["HINCRBY", "xc:hits:" + day(), p + ":" + s, 1]); await kv(["EXPIRE", "xc:hits:" + day(), 120 * 86400]); }
      const o = read(body.t);
      if (o) { const old = await kv(["HGET", "xc:members", String(o.id)]); if (old) { try { const r = JSON.parse(old); r.last = Date.now(); r.views = (r.views || 0) + 1; await kv(["HSET", "xc:members", String(o.id), JSON.stringify(r)]); } catch (e) { /* ignore */ } } }
      return send(200, { ok: true });
    }
    if (op === "admin") {
      // Password-ka maamulka: Vercel → Environment Variables → ADMIN_PASSWORD (Secret)
      const PW = env("ADMIN_PASSWORD");
      if (!PW) return send(500, { error: "ADMIN_PASSWORD Vercel kuma jiro → Settings → Environment Variables ku dar, kadib Redeploy." });
      const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "x", k = "xc:admtry:" + ip + ":" + new Date().toISOString().slice(0, 13);
      const n = await kv(["INCR", k]); await kv(["EXPIRE", k, 3600]);
      if (n != null && n > 8) return send(429, { error: "Isku day badan. Sug 1 saac." });
      const a1 = crypto.createHash("sha256").update(String(body.pw || "")).digest(), a2 = crypto.createHash("sha256").update(PW).digest();
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
