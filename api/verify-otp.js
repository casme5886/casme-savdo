// ==========================================================
// /api/verify-otp
//
// /api/send-otp bilan bir xil formula orqali kodni qayta
// hisoblab, foydalanuvchi kiritgan kod bilan solishtiradi.
// Vaqt oynasi chegarasida (masalan kod 4:59da yuborilib, 5:01da
// tekshirilsa) muammo bo'lmasligi uchun OLDINGI oynani ham
// tekshiramiz.
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
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const OTP_SECRET = process.env.OTP_SECRET;
  if (!OTP_SECRET) {
    console.error("OTP_SECRET sozlanmagan (Vercel Environment Variables)");
    return res.status(500).json({ ok: false, error: "Server sozlanmagan (OTP_SECRET yo'q)" });
  }

  const { phone, code } = req.body ?? {};
  if (!phone || !code) {
    return res.status(400).json({ ok: false, error: "phone va code majburiy" });
  }
  const digits = phone.replace(/\D/g, "");

  const valid =
    code === computeCode(digits, OTP_SECRET, 0) || code === computeCode(digits, OTP_SECRET, 1);

  return res.status(200).json({ ok: valid });
}
