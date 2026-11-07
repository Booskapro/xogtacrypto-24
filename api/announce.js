module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const page = (t, b) => res.status(200).send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui,sans-serif;background:#0B1220;color:#E8ECF2;padding:32px;max-width:640px;margin:auto;line-height:1.6"><h1 style="font-size:1.5rem">' + t + "</h1>" + b + "</body>");
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL, kt = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!token || !chat || !url || !kt) return page("❌ Dejin ayaa ka maqan", "<p>Vercel kuma jiraan TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID ama KV.</p>");
  const kv = (cmd) => fetch(url, { method: "POST", headers: { Authorization: "Bearer " + kt, "Content-Type": "application/json" }, body: JSON.stringify(cmd) }).then((r) => r.json()).then((j) => j.result);
  if ((await kv(["SET", "xc:announce:v1", Date.now(), "NX"])) !== "OK") return page("🔒 Horay ayaa loo diray", "<p>Fariinta hordhaca ah hal mar oo kaliya ayaa la diri karaa, horayna kooxda ayaa loogu diray.</p>");
  const text =
    "✅ <b>XOGTA CRYPTO 24/7 · OGEYSIISYADA TOOSKA AH</b>\n\n" +
    "Laga bilaabo maanta, kooxdan waxaa si toos ah ugu soo dhacaya, isla daqiiqadda ay soo baxaan:\n\n" +
    "🔴 <b>Go'aannada FED</b>: dulsaarka (kor, dhimis ama hayn)\n" +
    "📊 <b>Sicir-bararka (CPI)</b>\n" +
    "👷 <b>Xogta shaqada (NFP)</b> iyo shaqo la'aanta\n" +
    "📈 <b>Filashada suuqa</b>: marka ay si weyn isu beddesho\n" +
    "📰 <b>Wararka FED</b>: Reuters, CNBC, Bloomberg iyo Federal Reserve\n\n" +
    "Dhammaan waa af-Soomaali, waxayna leeyihiin isha rasmiga ah.\n\n" +
    "📅 <b>Xogta xigta:</b> CPI · Talaado 10 Nofembar · 14:30 (Yurub) / 16:30 (Muqdisho)\n\n" +
    "👉 xogtacrypto.vercel.app\n\n" +
    "<i>Xog iyo waxbarasho, talo maaliyadeed ma aha.</i>";
  const r = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: true }) }).then((x) => x.json());
  if (!r.ok) { await kv(["DEL", "xc:announce:v1"]); return page("❌ Lama dirin", "<p>" + String(r.description || "").replace(/</g, "&lt;") + "</p>"); }
  return page("✅ Waa la diray", "<p>Fariinta hordhaca ah kooxda Telegram ayaa loo diray. Eeg kooxda.</p>");
};
