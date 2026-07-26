// ==========================================================
// /api/telegram-order
//
// Bu — Vercel serverless funksiya (backend kod, brauzerga
// hech qachon yuborilmaydi). Frontend (src/App.jsx) buyurtma
// berilgandan keyin shu manzilga POST so'rov yuboradi, bu esa
// Telegram bot orqali sizga (admin) xabar jo'natadi.
//
// BOT TOKENI BU YERDA YOZILMAGAN — u Vercel muhit
// o'zgaruvchisi (Environment Variable) sifatida saqlanadi:
//   TELEGRAM_BOT_TOKEN      — @BotFather bergan token
//   TELEGRAM_ADMIN_CHAT_ID  — sizning (yoki admin guruhingiz) chat ID'si
//
// Bularni qanday olish va Vercel'ga qo'shish — README.md faylida
// "Telegram Mini App sozlash" bo'limida yozilgan.
// ==========================================================

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error("TELEGRAM_BOT_TOKEN yoki TELEGRAM_ADMIN_CHAT_ID sozlanmagan (Vercel Environment Variables)");
    return res.status(500).json({ ok: false, error: "Server sozlanmagan (env o'zgaruvchilar yo'q)" });
  }

  let order;
  try {
    order = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: "Noto'g'ri JSON" });
  }
  if (!order || typeof order !== "object") {
    return res.status(400).json({ ok: false, error: "Buyurtma ma'lumoti topilmadi" });
  }

  // Himoya qatlami: costPrice (tannarx) — frontend allaqachon buni yubormaydi,
  // lekin har ehtimolga qarshi, agar kelib qolsa ham, xabar matniga
  // hech qachon qo'shilmasligi uchun shu yerda ham tozalab tashlaymiz.
  if (Array.isArray(order.items)) {
    order.items = order.items.map(({ costPrice, ...rest }) => rest);
  }

  const text = buildMessage(order);

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram API xatosi:", tgData);
      return res.status(502).json({ ok: false, error: "Telegramga yuborilmadi", details: tgData.description });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Telegramga so'rov yuborishda xatolik:", e);
    return res.status(500).json({ ok: false, error: "Server xatosi" });
  }
}

function esc(value) {
  // Telegram HTML rejimida xavfli belgilarni tozalaydi (<, >, &).
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function paymentLabel(code) {
  return { cash: "Naqd", card: "Karta orqali" }[code] || esc(code) || "—";
}

function statusLabel(code) {
  return {
    new: "Yangi", ready: "Tayyor", on_way: "Yo'lda",
    delivered: "Yetkazib berildi", cancelled: "Bekor qilindi",
  }[code] || esc(code) || "Yangi";
}

function buildMessage(order) {
  const lines = [];
  lines.push("🛍️ <b>Yangi buyurtma!</b>");
  lines.push("");
  lines.push(`👤 <b>Mijoz:</b> ${esc(order.customer)}`);
  lines.push(`📞 <b>Telefon:</b> ${order.phone ? esc(order.phone) : "Kiritilmagan"}`);
  if (order.telegramUsername) {
    lines.push(`💬 <b>Telegram:</b> @${esc(order.telegramUsername)}`);
  } else if (order.telegramFirstName) {
    lines.push(`💬 <b>Telegram:</b> ${esc(order.telegramFirstName)}`);
  }
  lines.push(`💰 <b>Summa:</b> ${Number(order.amount || 0).toLocaleString("ru-RU")} UZS`);
  if (order.promoCode) {
    lines.push(`🏷️ <b>Promo kod:</b> ${esc(order.promoCode)} (-${Number(order.promoDiscount || 0).toLocaleString("ru-RU")} UZS)`);
  }
  lines.push(`💳 <b>To'lov:</b> ${paymentLabel(order.payment)}`);
  lines.push(`📌 <b>Holat:</b> ${statusLabel(order.status)}`);
  if (order.address) lines.push(`📍 <b>Manzil:</b> ${esc(order.address)}`);
  if (order.location?.lat && order.location?.lng) {
    lines.push(`🗺️ <a href="https://www.google.com/maps?q=${order.location.lat},${order.location.lng}">Xaritada ko'rish</a>`);
  }
  if (Array.isArray(order.items) && order.items.length) {
    lines.push("");
    lines.push("🧾 <b>Mahsulotlar:</b>");
    order.items.forEach((it) => {
      const subtotal = (Number(it.price) || 0) * (Number(it.qty) || 0);
      lines.push(`  • ${esc(it.productName)} — ${it.qty} × ${Number(it.price || 0).toLocaleString("ru-RU")} = ${subtotal.toLocaleString("ru-RU")} UZS`);
    });
  }
  lines.push("");
  lines.push(`📦 <b>Manba:</b> ${order.source === "telegram_mini_app" ? "Telegram Mini App" : "Veb-sayt"}`);
  if (order.orderId) lines.push(`🆔 <code>${esc(order.orderId)}</code>`);
  return lines.join("\n");
}
