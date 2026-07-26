// ==========================================================
// /api/telegram-webhook
//
// Telegram bot ORQALI tasdiqlash kodini yetkazish uchun.
//
// QANDAY ISHLAYDI:
// 1. Mijoz saytda telefon raqamini kiritadi.
// 2. Sayt "https://t.me/<BOT_USERNAME>?start=otp_<telefon>" havolasini
//    ochadi — bu Telegram'ni ochib, botga "/start otp_<telefon>"
//    buyrug'ini yuboradi.
// 3. Telegram shu yangilanishni O'ZI, avtomatik ravishda, shu yerga
//    (webhook manziliga) POST qilib yuboradi.
// 4. Biz "otp_<telefon>" dan telefon raqamni ajratib olamiz, xuddi
//    /api/send-otp dagi bir xil formula bilan kodni hisoblaymiz va
//    o'sha CHATga (mijozning o'ziga) SMS o'rniga Telegram xabari
//    sifatida yuboramiz.
//
// BIR MARTALIK SOZLASH (webhook'ni Telegram'ga tanishtirish):
// Quyidagi manzilni brauzerda oching (BOT_TOKEN va domeningizni almashtirib):
//
//   https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<domeningiz>.vercel.app/api/telegram-webhook
//
// Muvaffaqiyatli bo'lsa {"ok":true,"result":true,...} qaytadi.
//
// KERAKLI ENVIRONMENT VARIABLES:
//   TELEGRAM_BOT_TOKEN  — allaqachon bor (telegram-order.js bilan bir xil)
//   OTP_SECRET          — allaqachon bor (send-otp.js bilan bir xil)
// ==========================================================

import crypto from "node:crypto";

const OTP_WINDOW_MINUTES = 5;

function computeCode(phone, secret, windowOffset = 0) {
  const timeWindow = Math.floor(Date.now() / (OTP_WINDOW_MINUTES * 60 * 1000)) - windowOffset;
  const hmac = crypto.createHmac("sha256", secret).update(`${phone}:${timeWindow}`).digest("hex");
  const num = parseInt(hmac.slice(0, 8), 16) % 1000000;
  return num.toString().padStart(6, "0");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true }); // Telegram GET bilan tekshirmaydi, shunchaki 200 qaytaramiz
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const OTP_SECRET = process.env.OTP_SECRET;
  if (!BOT_TOKEN || !OTP_SECRET) {
    console.error("TELEGRAM_BOT_TOKEN yoki OTP_SECRET sozlanmagan");
    return res.status(200).json({ ok: true }); // Telegram'ga baribir 200 qaytarish kerak
  }

  try {
    const update = req.body;
    const message = update?.message;
    const text = message?.text || "";
    const chatId = message?.chat?.id;

    // "/start otp_+998901234567" yoki "/start otp_998901234567" formatini kutamiz
    const match = text.match(/^\/start\s+otp_(.+)$/);
    if (match && chatId) {
      const phone = decodeURIComponent(match[1]);
      const code = computeCode(phone, OTP_SECRET);

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🔐 Tasdiqlash kodingiz: *${code}*\n\nKodni hech kimga bermang. Kod 5 daqiqa amal qiladi.`,
          parse_mode: "Markdown",
        }),
      });
    }
  } catch (e) {
    console.error("Telegram webhook xatoligi:", e);
  }

  // Telegram'ga har doim 200 qaytarish shart (aks holda qayta-qayta urinaveradi)
  return res.status(200).json({ ok: true });
}
