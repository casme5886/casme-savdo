// ==========================================================
// /api/telegram-send-message
//
// Admin panelidagi "Telegram" sahifasi → "Chat" bo'limidan mijozga
// TO'G'RIDAN-TO'G'RI xabar yuborish uchun. Xabar Telegram orqali
// yuboriladi VA telegramChatMessages kolleksiyasiga "out"/"admin"
// yozuvi sifatida saqlanadi — shunda admin panelning chat oynasida
// darhol ko'rinadi (Firestore real-vaqtli obuna orqali).
//
// MUHIM: bu fayl ham (telegram-webhook.js kabi) "firebase" paketini
// IMPORT QILMAYDI — Firestore'ga oddiy fetch() orqali, to'g'ridan-to'g'ri
// REST API chaqiruvi bilan yoziladi (Vercel serverless muhitida "firebase"
// paketi bilan bog'liq muammolarning oldini olish uchun).
//
// KERAKLI ENVIRONMENT VARIABLE:
//   TELEGRAM_BOT_TOKEN — allaqachon bor (boshqa /api fayllar bilan bir xil)
// ==========================================================

const FIREBASE_PROJECT_ID = "casme-savdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN sozlanmagan (Vercel Environment Variables)");
    return res.status(200).json({ ok: false, error: "Server sozlanmagan" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: "Noto'g'ri JSON" });
  }

  const { chatId, text } = body || {};
  const trimmed = (text || "").trim();
  if (!chatId || !trimmed) {
    return res.status(400).json({ ok: false, error: "chatId yoki text yuborilmagan" });
  }

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: trimmed }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram API xatosi:", tgData);
      return res.status(200).json({ ok: false, error: tgData.description });
    }

    try {
      await firestoreAdd("telegramChatMessages", {
        chatId: Number(chatId),
        direction: "out",
        text: trimmed,
        sender: "admin",
        firstName: "",
        lastName: "",
        username: "",
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Chat xabarini saqlashda xatolik:", e);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Mijozga xabar yuborishda xatolik:", e);
    return res.status(200).json({ ok: false, error: "Server xatosi" });
  }
}
