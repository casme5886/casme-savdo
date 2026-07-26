// ==========================================================
// Telegram Mini App bilan ishlash uchun yordamchi funksiyalar.
// Bu fayl window.Telegram.WebApp (index.html dagi SDK skript
// orqali keladi) bilan ishlaydi. Agar sayt oddiy brauzerda
// (Telegram tashqarisida) ochilsa, barcha funksiyalar xavfsiz
// ravishda "hech narsa qilmaydi" (undefined qaytaradi).
// ==========================================================

/** Telegram WebApp obyektini qaytaradi, agar mavjud bo'lmasa — null. */
export function getWebApp() {
  if (typeof window !== "undefined" && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Sayt Telegram Mini App ichida ochilganmi yoki oddiy brauzerdami — shuni aniqlaydi.
 * `initData` faqat Telegram ichida ochilganda to'ldiriladi (brauzerda bo'sh bo'ladi).
 */
export function isInTelegram() {
  const tg = getWebApp();
  return !!(tg && tg.initData && tg.initData.length > 0);
}

/** Telegramdan kelgan foydalanuvchi ma'lumotini qaytaradi: { id, first_name, last_name, username, ... } yoki null. */
export function getTelegramUser() {
  const tg = getWebApp();
  if (!tg || !tg.initDataUnsafe || !tg.initDataUnsafe.user) return null;
  return tg.initDataUnsafe.user;
}

/**
 * Telegramning rang sxemasini (dark/light, tugma rangi va h.k.) saytga
 * CSS o'zgaruvchilari va body fon rangi orqali qo'llaydi.
 */
export function applyTelegramTheme(tg) {
  if (!tg) return;
  const p = tg.themeParams || {};
  const root = document.documentElement;

  const map = {
    "--tg-bg-color": p.bg_color,
    "--tg-text-color": p.text_color,
    "--tg-hint-color": p.hint_color,
    "--tg-link-color": p.link_color,
    "--tg-button-color": p.button_color,
    "--tg-button-text-color": p.button_text_color,
    "--tg-secondary-bg-color": p.secondary_bg_color,
  };
  Object.entries(map).forEach(([key, value]) => {
    if (value) root.style.setProperty(key, value);
  });

  if (p.bg_color) {
    document.body.style.backgroundColor = p.bg_color;
  }
  try {
    tg.setBackgroundColor?.(p.bg_color || "#ffffff");
    tg.setHeaderColor?.(p.bg_color || "#ffffff");
  } catch {
    // Eski Telegram versiyalarida bu metodlar bo'lmasligi mumkin — e'tiborsiz qoldiramiz.
  }
}

/**
 * Mini App'ni ishga tushirish: chaqirilishi shart bo'lgan tg.ready()/tg.expand(),
 * va mavzu ranglarini qo'llash. App.jsx ichida faqat BIR MARTA chaqiriladi.
 */
export function initTelegram() {
  const tg = getWebApp();
  if (!tg) return null;
  tg.ready();
  tg.expand();
  applyTelegramTheme(tg);
  tg.onEvent?.("themeChanged", () => applyTelegramTheme(tg));
  return tg;
}

/**
 * Haptik (tebranish) signal. Turlari:
 *  - impact:       "light" | "medium" | "heavy" | "rigid" | "soft"
 *  - notification: "error" | "success" | "warning"
 *  - selection:    (parametrsiz)
 */
export function hapticFeedback(type = "impact", style = "medium") {
  const tg = getWebApp();
  if (!tg || !tg.HapticFeedback) return;
  try {
    if (type === "impact") tg.HapticFeedback.impactOccurred(style);
    else if (type === "notification") tg.HapticFeedback.notificationOccurred(style);
    else if (type === "selection") tg.HapticFeedback.selectionChanged();
  } catch (e) {
    console.warn("Haptic feedback ishlamadi:", e);
  }
}
