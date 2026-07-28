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
//
// YANGI: oddiy "/start" (otp_ parametrisiz) yuborilganda — botga birinchi
// marta kirgan mijozga "xush kelibsiz" xabari yuboriladi. Bu xabar matni
// Firestore'dagi settings/telegramWelcome hujjatidan o'qiladi — admin panelda
// "Telegram" sahifasida tahrirlanadi (src/components/TelegramSettings.jsx).
// ==========================================================

import crypto from "node:crypto";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, increment } from "firebase/firestore/lite";

const OTP_WINDOW_MINUTES = 5;

// Do'kon konfiguratsiyasi ochiq (client) qiymat — src/firebase.js dagi bilan
// bir xil. Bu serverless funksiya src/firebase.js'ni to'g'ridan-to'g'ri import
// qilmaydi, chunki o'sha fayl getAuth()'ni ham ishga tushiradi — bu yerda
// Firestore'dan FAQAT bitta hujjatni o'qish kifoya, shuning uchun alohida,
// eng yengil ("lite") mijoz ishlatiladi.
const firebaseConfig = {
  apiKey: "AIzaSyAW8EbpfKrUPc3eI6zjQCWn2N8HU5g9CvM",
  authDomain: "casme-savdo.firebaseapp.com",
  projectId: "casme-savdo",
  storageBucket: "casme-savdo.firebasestorage.app",
  messagingSenderId: "333618332367",
  appId: "1:333618332367:web:0469ca47a9fc1d4f91edba",
};

function getDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

const DEFAULT_WELCOME =
  "👋 Assalomu alaykum va CASME'ga xush kelibsiz!\n\nBiz orqali original Koreya kosmetikasini qulay narxlarda xarid qilishingiz mumkin.\n\nQuyidagi tugma orqali do'konni oching va xaridni boshlang! 🛍️";

/** settings/telegramWelcome hujjatidan xabar matnini o'qiydi (bo'lmasa — standart matn). */
async function getWelcomeMessage() {
  try {
    const db = getDb();
    const snap = await getDoc(doc(db, "settings", "telegramWelcome"));
    if (snap.exists() && snap.data()?.message) return snap.data().message;
  } catch (e) {
    console.error("Xush kelibsiz xabarini o'qishda xatolik:", e);
  }
  return DEFAULT_WELCOME;
}

/**
 * Har bir "/start" bosilganda shu Telegram foydalanuvchisi haqida
 * telegramStarts/{telegramUserId} hujjatini yozadi/yangilaydi — admin
 * panelning "Telegram" sahifasida "kimlar start bosgan" ro'yxati uchun.
 * Birinchi marta bo'lsa firstStartAt, har safar lastStartAt va startCount
 * yangilanadi.
 */
async function recordStart(chatId, from) {
  try {
    const db = getDb();
    const ref = doc(db, "telegramStarts", String(chatId));
    const existing = await getDoc(ref);
    const data = {
      telegramUserId: chatId,
      firstName: from?.first_name || "",
      lastName: from?.last_name || "",
      username: from?.username || "",
      lastStartAt: new Date().toISOString(),
      startCount: increment(1),
    };
    if (!existing.exists()) {
      data.firstStartAt = new Date().toISOString();
    }
    await setDoc(ref, data, { merge: true });
  } catch (e) {
    console.error("Start yozuvini saqlashda xatolik:", e);
  }
}

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

    // Har qanday "/start" (parametrli yoki oddiy) — kim bosganini qayd etamiz.
    if (text.trim().startsWith("/start") && chatId) {
      await recordStart(chatId, message.from);
    }

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
    } else if (text.trim() === "/start" && chatId) {
      // Oddiy "/start" (parametrsiz) — botga birinchi (yoki qayta) kirgan
      // mijozga "xush kelibsiz" xabarini yuboramiz. parse_mode ATAYIN
      // qo'yilmagan — admin panelda kiritilgan matnda "<", ">", "&" kabi
      // belgilar bo'lsa ham xabar yuborilishida xatolik bo'lmasligi uchun.
      const welcomeText = await getWelcomeMessage();
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeText,
        }),
      });
    }
  } catch (e) {
    console.error("Telegram webhook xatoligi:", e);
  }

  // Telegram'ga har doim 200 qaytarish shart (aks holda qayta-qayta urinaveradi)
  return res.status(200).json({ ok: true });
}
