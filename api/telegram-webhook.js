// ==========================================================
// /api/telegram-webhook
//
// Telegram bot ORQALI tasdiqlash kodini yetkazish uchun, "/start" bosgan
// mijozlarni qayd etish va ularga "xush kelibsiz" xabarini yuborish uchun.
//
// QANDAY ISHLAYDI (OTP):
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
// QANDAY ISHLAYDI ("/start" va xush kelibsiz xabari):
// Oddiy "/start" (otp_ parametrisiz) kelsa — Firestore'dagi
// settings/telegramWelcome hujjatidan xabar matnini o'qib, mijozga
// yuboramiz, va telegramStarts/{chatId} hujjatiga yozib qo'yamiz (admin
// panelning "Telegram" sahifasidagi "kimlar start bosgan" ro'yxati uchun).
//
// MUHIM: Firestore bilan ishlash uchun "firebase" paketi IMPORT QILINMAYDI —
// buning o'rniga to'g'ridan-to'g'ri Firestore REST API'ga oddiy fetch()
// so'rovlari yuboriladi. Sabab: Vercel'ning serverless funksiya muhitida
// "firebase/firestore" paketini import qilish ba'zan qurilish (build)
// vaqtida muammo keltirib chiqarishi mumkin va BUTUN funksiyani (shu
// jumladan OTP yuborishni ham) ishlamay qo'yishi mumkin edi. Oddiy
// fetch() esa hech qanday qo'shimcha paketga bog'liq emas — eng ishonchli yo'l.
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
const FIREBASE_PROJECT_ID = "casme-savdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const DEFAULT_WELCOME =
  "👋 Assalomu alaykum va CASME'ga xush kelibsiz!\n\nBiz orqali original Koreya kosmetikasini qulay narxlarda xarid qilishingiz mumkin.\n\nQuyidagi tugma orqali do'konni oching va xaridni boshlang! 🛍️";

// ---------- Firestore REST yordamchi funksiyalari (firebase paketisiz) ----------

/** Firestore'ning "typed value" formatidagi maydonlarni oddiy JS obyektiga aylantiradi. */
function decodeFields(fields) {
  const out = {};
  for (const [key, val] of Object.entries(fields || {})) {
    if (val.stringValue !== undefined) out[key] = val.stringValue;
    else if (val.integerValue !== undefined) out[key] = parseInt(val.integerValue, 10);
    else if (val.doubleValue !== undefined) out[key] = val.doubleValue;
    else if (val.booleanValue !== undefined) out[key] = val.booleanValue;
    else out[key] = null;
  }
  return out;
}

/** Oddiy JS obyektni Firestore'ning "typed value" formatiga aylantiradi. */
function encodeFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") fields[key] = { stringValue: val };
    else if (typeof val === "number") fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === "boolean") fields[key] = { booleanValue: val };
    else fields[key] = { nullValue: null };
  }
  return fields;
}

/** Yangi hujjat qo'shadi (avtomatik ID bilan) — kolleksiya manziliga POST qilinadi. */
async function firestoreAdd(collectionPath, data) {
  const fields = encodeFields(data);
  const res = await fetch(`${FIRESTORE_BASE}/${collectionPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firestore POST xatosi (${collectionPath}): ${res.status} ${errText}`);
  }
}

/** Bitta hujjatni o'qiydi. Mavjud bo'lmasa — null qaytaradi. */
async function firestoreGet(path) {
  const res = await fetch(`${FIRESTORE_BASE}/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore GET xatosi (${path}): ${res.status}`);
  const data = await res.json();
  return decodeFields(data.fields || {});
}

/** Berilgan maydonlarni hujjatga yozadi/yangilaydi (mavjud bo'lmasa — yaratadi). */
async function firestorePatch(path, data) {
  const fields = encodeFields(data);
  const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const res = await fetch(`${FIRESTORE_BASE}/${path}?${mask}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firestore PATCH xatosi (${path}): ${res.status} ${errText}`);
  }
}

/** settings/telegramWelcome hujjatidan xabar matnini o'qiydi (bo'lmasa — standart matn). */
async function getWelcomeMessage() {
  try {
    const data = await firestoreGet("settings/telegramWelcome");
    if (data?.message) return data.message;
  } catch (e) {
    console.error("Xush kelibsiz xabarini o'qishda xatolik:", e);
  }
  return DEFAULT_WELCOME;
}

/**
 * Har bir "/start" bosilganda shu Telegram foydalanuvchisi haqida
 * telegramStarts/{telegramUserId} hujjatini yozadi/yangilaydi — admin
 * panelning "Telegram" sahifasida "kimlar start bosgan" ro'yxati uchun.
 */
async function recordStart(chatId, from) {
  try {
    const path = `telegramStarts/${chatId}`;
    const existing = await firestoreGet(path);
    const now = new Date().toISOString();
    const data = {
      telegramUserId: chatId,
      firstName: from?.first_name || "",
      lastName: from?.last_name || "",
      username: from?.username || "",
      lastStartAt: now,
      startCount: (Number(existing?.startCount) || 0) + 1,
    };
    if (!existing) data.firstStartAt = now;
    await firestorePatch(path, data);
  } catch (e) {
    console.error("Start yozuvini saqlashda xatolik:", e);
  }
}

/**
 * Har bir xabarni (kiruvchi yoki chiquvchi) admin panelning "Telegram"
 * sahifasi → "Chat" bo'limida ko'rsatish uchun saqlaydi. Xato bo'lsa ham
 * (masalan tarmoq muammosi) butun webhook ishlashiga xalaqit bermaydi —
 * shuning uchun o'z ichida try/catch bilan o'ralgan.
 */
async function saveChatMessage(chatId, direction, text, from, sender) {
  try {
    await firestoreAdd("telegramChatMessages", {
      chatId: Number(chatId),
      direction, // "in" — mijozdan, "out" — botdan/admindan
      text: text || "",
      sender: sender || (direction === "in" ? "customer" : "bot"),
      firstName: from?.first_name || "",
      lastName: from?.last_name || "",
      username: from?.username || "",
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error("Chat xabarini saqlashda xatolik:", e);
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
    // Bu qadam ixtiyoriy (xato bo'lsa ham pastdagi OTP/xush kelibsiz
    // yuborilishiga xalaqit bermaydi — shuning uchun alohida try/catch ichida).
    if (text.trim().startsWith("/start") && chatId) {
      try {
        await recordStart(chatId, message.from);
      } catch (e) {
        console.error("recordStart xatoligi:", e);
      }
    }

    // Mijozdan kelgan HAR bir xabarni ("Chat" bo'limida ko'rish uchun)
    // qayd etamiz — /start, oddiy matn, hammasi.
    if (text && chatId) {
      await saveChatMessage(chatId, "in", text, message.from);
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
      await saveChatMessage(chatId, "out", `🔐 Tasdiqlash kodingiz: ${code}`, null, "bot");
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
      await saveChatMessage(chatId, "out", welcomeText, null, "bot");
    }
  } catch (e) {
    console.error("Telegram webhook xatoligi:", e);
  }

  // Telegram'ga har doim 200 qaytarish shart (aks holda qayta-qayta urinaveradi)
  return res.status(200).json({ ok: true });
}
