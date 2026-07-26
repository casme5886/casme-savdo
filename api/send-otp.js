// ==========================================================
// /api/send-otp
//
// Telefon raqamga SMS orqali 6 xonali tasdiqlash kodi yuboradi.
//
// KOD QANDAY ISHLAYDI (bazasiz, stateless):
// Kod telefon raqam + joriy vaqt oynasi (5 daqiqa) asosida
// HMAC orqali hisoblanadi (maxfiy kalit — OTP_SECRET). Shu
// tufayli kodni saqlash uchun alohida bazaga hojat yo'q —
// /api/verify-otp xuddi shu formulani qayta hisoblab tekshiradi.
//
// KERAKLI ENVIRONMENT VARIABLES (Vercel → Settings → Environment Variables):
//   OTP_SECRET        — istalgan uzun tasodifiy matn (masalan 32+ belgi)
//   ESKIZ_EMAIL       — Eskiz.uz hisobingiz email (ixtiyoriy — bo'lmasa, kod
//                        SMS o'rniga faqat server logiga yoziladi — TEST REJIMI)
//   ESKIZ_PASSWORD    — Eskiz.uz hisobingiz paroli
// ==========================================================

import crypto from "node:crypto";

const OTP_WINDOW_MINUTES = 5;

function computeCode(phone, secret, windowOffset = 0) {
  const timeWindow = Math.floor(Date.now() / (OTP_WINDOW_MINUTES * 60 * 1000)) - windowOffset;
  const hmac = crypto.createHmac("sha256", secret).update(`${phone}:${timeWindow}`).digest("hex");
  const num = parseInt(hmac.slice(0, 8), 16) % 1000000;
  return num.toString().padStart(6, "0");
}

let eskizTokenCache = { token: null, expiresAt: 0 };

async function getEskizToken(email, password) {
  if (eskizTokenCache.token && Date.now() < eskizTokenCache.expiresAt) {
    return eskizTokenCache.token;
  }
  const res = await fetch("https://notify.eskiz.uz/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data?.data?.token) throw new Error("Eskiz token olinmadi: " + JSON.stringify(data));
  eskizTokenCache = { token: data.data.token, expiresAt: Date.now() + 25 * 24 * 60 * 60 * 1000 };
  return eskizTokenCache.token;
}

async function sendSms(phone, text) {
  const email = process.env.ESKIZ_EMAIL;
  const password = process.env.ESKIZ_PASSWORD;

  if (!email || !password) {
    // TEST REJIMI — Eskiz hisobi hali sozlanmagan. Kodni serverning
    // o'z logiga chiqaramiz, shunda funksionallikni SMS'siz ham sinab
    // ko'rish mumkin. Vercel'da bu Deployment → Logs bo'limida ko'rinadi.
    console.log(`[OTP TEST REJIMI] ${phone} uchun kod: "${text}"`);
    return { mode: "test" };
  }

  const token = await getEskizToken(email, password);
  const digits = phone.replace(/\D/g, ""); // Eskiz "998901234567" formatini kutadi
  const res = await fetch("https://notify.eskiz.uz/api/message/sms/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ mobile_phone: digits, message: text, from: "4546" }),
  });
  const data = await res.json();
  if (data?.status !== "waiting" && data?.status !== "success") {
    throw new Error("Eskiz SMS yuborishda xatolik: " + JSON.stringify(data));
  }
  return { mode: "sms" };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const OTP_SECRET = process.env.OTP_SECRET;
  if (!OTP_SECRET) {
    console.error("OTP_SECRET sozlanmagan (Vercel Environment Variables)");
    return res.status(500).json({ ok: false, error: "Server sozlanmagan (OTP_SECRET yo'q)" });
  }

  const { phone } = req.body ?? {};
  if (!phone || typeof phone !== "string") {
    return res.status(400).json({ ok: false, error: "phone majburiy" });
  }
  const digits = phone.replace(/\D/g, "");

  const code = computeCode(digits, OTP_SECRET);

  try {
    const result = await sendSms(phone, `CASME tasdiqlash kodi: ${code}. Kodni hech kimga bermang.`);
    return res.status(200).json({ ok: true, mode: result.mode });
  } catch (e) {
    console.error("SMS yuborishda xatolik:", e);
    return res.status(500).json({ ok: false, error: "SMS yuborilmadi" });
  }
}
