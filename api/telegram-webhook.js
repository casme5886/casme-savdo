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

const DEFAULT_WELCOME_RU =
  "👋 Здравствуйте и добро пожаловать в CASME!\n\nЧерез нас вы можете приобрести оригинальную корейскую косметику по выгодным ценам.\n\nОткройте магазин с помощью кнопки ниже и начните покупки! 🛍️";

const CHAT_PROMPT_UZ = "✍️ Savolingizni shu yerga yozing — administratorimiz tez orada javob beradi.";
const CHAT_PROMPT_RU = "✍️ Напишите ваш вопрос здесь — наш администратор ответит в ближайшее время.";

// Mini App (do'kon) manzili — pastdagi doimiy tugmalar shu yerga olib boradi.
const STORE_URL = "https://www.casme.uz";

/**
 * Botning pastki qismidagi DOIMIY tugmalar (ReplyKeyboard) — "Do'kon/Магазин"
 * va "Mening buyurtmalarim/Мои заказы" to'g'ridan-to'g'ri Mini App'ni ochadi
 * (web_app), "Til/Язык" va "Chat/Чат" esa oddiy matn tugmalari — bosilganda
 * ularning matni mijozdan kelgan xabar sifatida shu webhook'ga keladi (pastda
 * ushlanadi). Tugma matnlari mijoz tanlagan tilga (lang: "uz" | "ru") qarab
 * o'zgaradi. Bu klaviatura faqat xush kelibsiz va til tanlash xabarlariga
 * qo'shiladi — Telegram uni boshqa xabar bilan almashtirilmaguncha ekranda
 * saqlab turadi.
 */
function mainKeyboardMarkup(lang) {
  const isRu = lang === "ru";
  return {
    keyboard: [
      [{ text: isRu ? "🛍 Магазин" : "🛍 Do'kon", web_app: { url: STORE_URL } }],
      [{ text: isRu ? "🌐 Язык" : "🌐 Til" }, { text: isRu ? "💬 Чат" : "💬 Chat" }],
      [{ text: isRu ? "📦 Мои заказы" : "📦 Mening buyurtmalarim", web_app: { url: `${STORE_URL}/?view=orders` } }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };
}

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

/** settings/telegramWelcome hujjatidan xabar matnini (tilga mos) o'qiydi (bo'lmasa — standart matn). */
async function getWelcomeMessage(lang) {
  try {
    const data = await firestoreGet("settings/telegramWelcome");
    if (lang === "ru") {
      if (data?.messageRu) return data.messageRu;
    } else if (data?.message) {
      return data.message;
    }
  } catch (e) {
    console.error("Xush kelibsiz xabarini o'qishda xatolik:", e);
  }
  return lang === "ru" ? DEFAULT_WELCOME_RU : DEFAULT_WELCOME;
}

/**
 * Mijoz avval "Til" tugmasi orqali tanlagan tilini (telegramStarts/{chatId}
 * hujjatidagi "lang" maydoni) o'qiydi. Hech narsa tanlanmagan bo'lsa —
 * standart bo'yicha "uz" qaytaradi.
 */
async function getLang(chatId) {
  try {
    const data = await firestoreGet(`telegramStarts/${chatId}`);
    return data?.lang === "ru" ? "ru" : "uz";
  } catch (e) {
    console.error("Mijoz tilini aniqlashda xatolik:", e);
    return "uz";
  }
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

    // Inline tugma bosilganda (masalan "Til" tugmasidagi til tanlovi) —
    // bu oddiy xabar emas, alohida turdagi "callback_query" yangilanishi.
    if (update?.callback_query) {
      const cq = update.callback_query;
      const cbChatId = cq.message?.chat?.id;
      const data = cq.data || "";

      // Tugmadagi "yuklanmoqda" aylanishini to'xtatish uchun har doim javob berish shart.
      try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cq.id }),
        });
      } catch (e) {
        console.error("answerCallbackQuery xatoligi:", e);
      }

      if (cbChatId && (data === "lang_uz" || data === "lang_ru")) {
        const chosenLang = data === "lang_ru" ? "ru" : "uz";

        // Tanlovni telegramStarts/{chatId} hujjatiga saqlaymiz — shundan
        // keyingi BARCHA avtomatik xabarlar (xush kelibsiz, OTP, Chat
        // taklifi) shu tilda yuboriladi.
        try {
          await firestorePatch(`telegramStarts/${cbChatId}`, { lang: chosenLang });
        } catch (e) {
          console.error("Til tanlovini saqlashda xatolik:", e);
        }

        const reply = chosenLang === "uz" ? "✅ Til: O'zbek tili tanlandi." : "✅ Язык: выбран русский.";
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: cbChatId,
            text: reply,
            reply_markup: mainKeyboardMarkup(chosenLang),
          }),
        });
        await saveChatMessage(cbChatId, "out", reply, null, "bot");
      }

      return res.status(200).json({ ok: true });
    }

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
      const lang = await getLang(chatId);
      const otpText = lang === "ru"
        ? `🔐 Ваш код подтверждения: *${code}*\n\nНикому не сообщайте код. Код действителен 5 минут.`
        : `🔐 Tasdiqlash kodingiz: *${code}*\n\nKodni hech kimga bermang. Kod 5 daqiqa amal qiladi.`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: otpText,
          parse_mode: "Markdown",
        }),
      });
      await saveChatMessage(chatId, "out", otpText.replace(/\*/g, ""), null, "bot");
    } else if (text.trim() === "/start" && chatId) {
      // Oddiy "/start" (parametrsiz) — botga birinchi (yoki qayta) kirgan
      // mijozga "xush kelibsiz" xabarini, mijoz avval tanlagan tilda
      // (yoki standart o'zbek tilida) yuboramiz. parse_mode ATAYIN
      // qo'yilmagan — admin panelda kiritilgan matnda "<", ">", "&" kabi
      // belgilar bo'lsa ham xabar yuborilishida xatolik bo'lmasligi uchun.
      const lang = await getLang(chatId);
      const welcomeText = await getWelcomeMessage(lang);
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeText,
          reply_markup: mainKeyboardMarkup(lang),
        }),
      });
      await saveChatMessage(chatId, "out", welcomeText, null, "bot");
    } else if ((text.trim() === "🌐 Til" || text.trim() === "🌐 Язык") && chatId) {
      // Pastdagi doimiy "Til/Язык" tugmasi bosilganda — til tanlash uchun
      // inline tugmalar bilan javob beramiz.
      const reply = "Tilni tanlang / Выберите язык:";
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
          reply_markup: {
            inline_keyboard: [
              [{ text: "O'zbek 🇺🇿", callback_data: "lang_uz" }, { text: "Русский 🇷🇺", callback_data: "lang_ru" }],
            ],
          },
        }),
      });
      await saveChatMessage(chatId, "out", reply, null, "bot");
    } else if ((text.trim() === "💬 Chat" || text.trim() === "💬 Чат") && chatId) {
      // Pastdagi doimiy "Chat/Чат" tugmasi bosilganda — mijozni tanlagan
      // tilida yozishga undaydigan qisqa xabar. Mijoz shu yerdan keyin
      // yozgan HAR bir xabari admin panelning "Telegram" → "Chat"
      // bo'limida ko'rinadi.
      const lang = await getLang(chatId);
      const reply = lang === "ru" ? CHAT_PROMPT_RU : CHAT_PROMPT_UZ;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: reply }),
      });
      await saveChatMessage(chatId, "out", reply, null, "bot");
    }
  } catch (e) {
    console.error("Telegram webhook xatoligi:", e);
  }

  // Telegram'ga har doim 200 qaytarish shart (aks holda qayta-qayta urinaveradi)
  return res.status(200).json({ ok: true });
}
