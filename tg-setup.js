/* =========================================================
   Tijaabada Telegram (hal mar oo kaliya)
   Fur: /api/tg-setup
   - Wuxuu helaa kooxda bot-ka lagu daray (getUpdates)
   - Wuxuu kooxda u diraa fariin tijaabo ah
   - Wuxuu ku tusaa aqoonsiga (ID) kooxda
   Marka TELEGRAM_CHAT_ID Vercel la geliyo, boggani wuu is-xiraa.
   ========================================================= */
module.exports = async (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const page = (title, body) => res.status(200).send(
    '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<body style="font-family:system-ui,sans-serif;background:#0B1220;color:#E8ECF2;padding:32px;line-height:1.6;max-width:640px;margin:auto">' +
    "<h1 style=\"font-size:1.5rem\">" + title + "</h1>" + body + "</body>");

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return page("❌ Token lama helin", "<p>Vercel kuma jiro <b>TELEGRAM_BOT_TOKEN</b>, ama website-ka dib looma dhisin (redeploy) kadib markii la geliyay.</p>");
  if (process.env.TELEGRAM_CHAT_ID) return page("🔒 Boggan waa xiran yahay", "<p>Telegram horay ayaa loo dejiyay. Bot-ku wuu shaqaynayaa.</p>");

  const api = (m, body) => fetch("https://api.telegram.org/bot" + token + "/" + m, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {})
  }).then((r) => r.json());

  try {
    const me = await api("getMe");
    if (!me.ok) return page("❌ Token-ku waa khaldan yahay", "<p>Telegram ma aqbalin token-ka. Hubi in si sax ah loo koobiyeeyay (meel bannaan la'aan).</p>");
    const up = await api("getUpdates", { allowed_updates: ["message", "my_chat_member"] });
    const chats = {};
    (up.result || []).forEach((u) => {
      const c = (u.message && u.message.chat) || (u.my_chat_member && u.my_chat_member.chat);
      if (c && (c.type === "group" || c.type === "supergroup" || c.type === "channel")) chats[c.id] = c;
    });
    const list = Object.values(chats);
    if (!list.length) {
      return page("⏳ Kooxda weli lama helin",
        "<p>Bot-ka <b>@" + me.result.username + "</b> wuu shaqeeyaa, laakiin kooxda weli ma arkin.</p>" +
        "<p>Kooxda gudaheeda qor: <code>/start@" + me.result.username + "</code>, kadib boggan dib u fur (refresh).</p>");
    }
    let html = "<p>Bot-ka <b>@" + me.result.username + "</b> wuu shaqeeyaa. Kooxaha la helay:</p>";
    for (const c of list) {
      const r = await api("sendMessage", {
        chat_id: c.id, parse_mode: "HTML",
        text: "✅ <b>Bot-ka Xogta Crypto 24/7 wuu shaqeeyaa.</b>\nOgeysiisyada FED-ka iyo suuqyada halkan ayay ku soo dhacayaan.\n👉 xogtacrypto.vercel.app"
      });
      html += '<div style="background:#121A2B;border:1px solid #243049;border-radius:12px;padding:16px;margin:12px 0">' +
        "<b>" + String(c.title || "").replace(/</g, "&lt;") + "</b><br>" +
        "ID: <code style=\"font-size:1.2rem;color:#22E39A\">" + c.id + "</code><br>" +
        (r.ok ? "✅ Fariin tijaabo ah ayaa loo diray kooxda." : "❌ Fariinta lama dirin: " + String(r.description || "").replace(/</g, "&lt;") + " (bot-ka ka dhig Admin)") +
        "</div>";
    }
    html += "<p><b>Tallaabada xigta:</b> koobiyee ID-ga cagaaran, kadibna Vercel ku geli magaca <code>TELEGRAM_CHAT_ID</code>.</p>";
    return page("✅ Telegram wuu shaqeeyaa", html);
  } catch (e) {
    return page("❌ Khalad", "<p>" + String(e.message || e).replace(/</g, "&lt;") + "</p>");
  }
};
