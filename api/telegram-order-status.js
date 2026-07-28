// ==========================================================
// /api/telegram-order-status
//
// Admin panelida buyurtma HOLATI o'zgartirilganda (Yangi → Tayyor →
// Yo'lda → Yetkazib berildi / Bekor qilindi), agar buyurtma Telegram
// orqali berilgan bo'lsa (telegramUserId mavjud bo'lsa), MIJOZNING
// o'ziga shu manzil orqali avtomatik xabar yuboriladi — mahsulotlar
// ro'yxati, soni, narxi va jami summasi bilan birga.
//
// Frontend (src/App.jsx, OrdersPage/CustomersPage) buyurtma holati
// muvaffaqiyatli o'zgartirilgandan KEYIN shu manzilga POST so'rov
// yuboradi. Bu qadam ixtiyoriy — xato bo'lsa ham buyurtmaning o'zi
// allaqachon saqlangan, mijozga hech narsa buzilmaydi.
//
// KERAKLI ENVIRONMENT VARIABLE:
//   TELEGRAM_BOT_TOKEN — allaqachon bor (boshqa /api fayllar bilan bir xil)
// ==========================================================

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

  const { telegramUserId, status, orderId, items, amount, deliveryPrice } = body || {};
  if (!telegramUserId || !status) {
    return res.status(400).json({ ok: false, error: "telegramUserId yoki status yuborilmagan" });
  }

  const text = buildStatusMessage({ status, orderId, items, amount, deliveryPrice });

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramUserId,
        text,
        parse_mode: "HTML",
      }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      console.error("Telegram API xatosi:", tgData);
      return res.status(200).json({ ok: false, error: tgData.description });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Mijozga buyurtma holati xabarini yuborishda xatolik:", e);
    return res.status(200).json({ ok: false, error: "Server xatosi" });
  }
}

function esc(value) {
  // Telegram HTML rejimida xavfli belgilarni tozalaydi (<, >, &).
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function money(n) {
  return (Number(n) || 0).toLocaleString("ru-RU");
}

const STATUS_INFO = {
  new: { emoji: "🆕", title: "Buyurtmangiz qabul qilindi!" },
  ready: { emoji: "📦", title: "Buyurtmangiz tayyorlandi!" },
  on_way: { emoji: "🚚", title: "Buyurtmangiz yo'lda!" },
  delivered: { emoji: "✅", title: "Buyurtmangiz yetkazib berildi!" },
  cancelled: { emoji: "❌", title: "Buyurtmangiz bekor qilindi" },
};

function buildStatusMessage({ status, orderId, items, amount, deliveryPrice }) {
  const info = STATUS_INFO[status] || { emoji: "ℹ️", title: "Buyurtma holati yangilandi" };
  const lines = [];

  lines.push(`${info.emoji} <b>${esc(info.title)}</b>`);
  lines.push("");

  if (Array.isArray(items) && items.length > 0) {
    lines.push("🧾 <b>Mahsulotlar:</b>");
    items.forEach((it) => {
      const subtotal = (Number(it.price) || 0) * (Number(it.qty) || 0);
      lines.push(`• ${esc(it.productName)} — ${it.qty} × ${money(it.price)} = ${money(subtotal)} so'm`);
    });
    lines.push("");
  }

  if (Number(deliveryPrice) > 0) {
    lines.push(`🚴 <b>Yetkazib berish:</b> ${money(deliveryPrice)} so'm`);
  }
  lines.push(`💰 <b>Jami summa:</b> ${money(amount)} so'm`);

  if (orderId) {
    lines.push("");
    lines.push(`🆔 <code>${esc(orderId)}</code>`);
  }

  if (status === "on_way") {
    lines.push("");
    lines.push("Kuryerimiz tez orada sizga yetib boradi. 🙌");
  } else if (status === "delivered") {
    lines.push("");
    lines.push("Xaridingiz uchun rahmat! Fikr-mulohazangiz biz uchun muhim. 💚");
  } else if (status === "cancelled") {
    lines.push("");
    lines.push("Savollaringiz bo'lsa, biz bilan bog'laning.");
  }

  return lines.join("\n");
}
