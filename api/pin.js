module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const page = (t, b) => res.status(200).send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;background:#0B1220;color:#E8ECF2;padding:32px;max-width:640px;margin:auto;line-height:1.6"><h1 style="font-size:1.5rem">' + t + "</h1>" + b + "</body>");
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, kt = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!token || !chat || !url || !kt) return page("❌ Dejin ayaa ka maqan", "<p>Vercel kuma jiraan TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID ama KV.</p>");
  const kv = (cmd) => fetch(url, { method: "POST", headers: { Authorization: "Bearer " + kt, "Content-Type": "application/json" }, body: JSON.stringify(cmd) }).then((r) => r.json()).then((j) => j.result);
  const tg = (m, body) => fetch("https://api.telegram.org/bot" + token + "/" + m, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((x) => x.json());
  const esc = (s) => String(s || "").replace(/</g, "&lt;");

  if ((await kv(["SET", "xc:pin:v1", Date.now(), "NX"])) !== "OK")
    return page("🔒 Horay ayaa loo diray", "<p>Fariinta badhanka leh horay ayaa kooxda loogu diray oo loo pin-gareeyay.</p>");

  const text =
    "📊 <b>XOGTA CRYPTO 24/7</b>\n\n" +
    "Fed, crypto & suuqyada — af-Soomaali, 24/7.\n\n" +
    "👇 Riix badhanka si aad u furto website-ka:";
  const r = await tg("sendMessage", {
    chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [
      [{ text: "🌐 Fur Website-ka", url: "https://xogtacrypto.vercel.app" }],
      [{ text: "🐦 Na raac X", url: "https://x.com/Xogtacrypto24" }]
    ] }
  });
  if (!r.ok) { await kv(["DEL", "xc:pin:v1"]); return page("❌ Lama dirin", "<p>" + esc(r.description) + "</p>"); }

  const p = await tg("pinChatMessage", { chat_id: chat, message_id: r.result.message_id, disable_notification: false });
  if (!p.ok) return page("⚠️ Waa la diray, laakiin lama pin-gareyn", "<p>Bot-ka u oggolow <b>Pin messages</b> (Manage → Administrators → bot-ka), ama gacanta ku pin-gareey fariinta.</p><p style='opacity:.6'>" + esc(p.description) + "</p>");
  return page("✅ Waa la diray oo la pin-gareeyay", "<p>Eeg kooxda Telegram: fariinta badhanka buluugga ah ayaa kor ku dheggan.</p>");
};
