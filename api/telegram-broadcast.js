// ==========================================================
// /api/telegram-broadcast
//
// Bu — Vercel serverless funksiya. Admin panelning Marketing
// bo'limidan "Xabar yuborish" tugmasi bosilganda shu manzilga
// so'rov ketadi, u esa Telegram bot orqali BIR NECHTA mijozga
// (Mini App orqali kirgan, ya'ni telegramUserId'si bor
// mijozlarga) xabar yuboradi.
//
// MUHIM: bu — SMS emas, Telegram xabari. Faqat Telegram bot
// bilan avval o'zaro aloqa qilgan (botni bloklamagan) mijozlarga
// yetib boradi.
//
// Kerakli Vercel muhit o'zgaruvchilari:
//   TELEGRAM_BOT_TOKEN  — @BotFather bergan token (buyurtma
//                          xabarlari uchun allaqachon sozlangan)
//   BROADCAST_SECRET    — o'zingiz o'ylab topgan har qanday
//                          maxfiy so'z (masalan "casme-2026-xyz")
//                          — bu, boshqa odam shu manzilga
//                          to'g'ridan-to'g'ri so'rov yuborib,
//                          mijozlarga spam xabar jo'nata olmasligi
//                          uchun kerak. Frontend shu so'zni admin
//                          panelidan yuboradi.
// ==========================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const SECRET = process.env.BROADCAST_SECRET;

  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN sozlanmagan (Vercel Environment Variables)");
    return res.status(500).json({ ok: false, error: "Server sozlanmagan (bot tokeni yo'q)" });
  }

  const { secret, message, chatIds } = req.body || {};

  if (SECRET && secret !== SECRET) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q (noto'g'ri kalit)" });
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ ok: false, error: "Xabar matni bo'sh" });
  }
  if (!Array.isArray(chatIds) || chatIds.length === 0) {
    return res.status(400).json({ ok: false, error: "Yuboriladigan mijozlar ro'yxati bo'sh" });
  }

  let sent = 0;
  let failed = 0;

  // Telegram'ning tezlik cheklovlariga (rate limit) tegmaslik uchun,
  // xabarlarni BIR-BIR, orada kichik pauza bilan yuboramiz (ommaviy
  // yuborishda hammasi baravariga ketsa, Telegram vaqtincha bloklashi
  // mumkin).
  for (const chatId of chatIds) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      });
      const data = await r.json();
      if (data.ok) sent++;
      else failed++;
    } catch (e) {
      failed++;
    }
    // ~20 xabar/soniya — Telegram limitidan xavfsiz pastda.
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  return res.status(200).json({ ok: true, sent, failed, total: chatIds.length });
}
