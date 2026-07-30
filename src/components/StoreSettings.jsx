import React, { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, ImageOff, Download, Search as SeoIcon, Megaphone } from "lucide-react";
import { setItem, uploadImage, getAllDocs } from "../storage.js";
import { Field, inputCls } from "./ui.jsx";

const T_LOCAL = {
  uz: {
    title: "Do'kon sozlamalari",
    logo: "Do'kon logotipi", logoHint: "Kvadrat rasm tavsiya etiladi (masalan 200×200)", uploadHint: "Rasm tanlang", uploading: "Yuklanmoqda...",
    general: "Umumiy",
    storeName: "Do'kon nomi", storeNameHint: "Sayt headerida va footerida shu nom ko'rinadi",

    social: "Ijtimoiy tarmoqlar",
    instagram: "Instagram", instagramHandleHint: "Masalan: casme.uz (@ belgisisiz)",
    instagramLink: "Instagram havolasi", instagramLinkHint: "https://instagram.com/casme.uz",
    telegramLink: "Telegram havolasi", tiktokLink: "TikTok havolasi",

    contact: "Aloqa ma'lumotlari",
    contactPhone: "Telefon raqam", contactAddress: "Manzil",
    workingHours: "Ish vaqti", workingHoursHint: "Har bir kun uchun ochiq/yopiqligini va soatini belgilang",
    workDay: "Ish kuni", dayOff: "Dam olish kuni", from: "dan", to: "gacha",

    seo: "SEO sozlamalari", seoHint: "Bu ma'lumotlar Google va boshqa qidiruv tizimlarida qanday ko'rinishini belgilaydi.",
    seoTitle: "Sayt sarlavhasi (title)", seoTitleHint: "Brauzer tab'ida va Google natijalarida chiqadi",
    seoDescription: "Qisqa tavsif (description)", seoDescriptionHint: "Google natijalarida sarlavha ostida chiqadigan matn",
    seoKeywords: "Kalit so'zlar (ixtiyoriy)", seoKeywordsHint: "Vergul bilan ajrating",

    marketing: "Marketing", marketingHint: "Facebook/Instagram reklamalaringiz saytdagi xaridlarni to'g'ri hisoblashi va ularga optimallashishi uchun.",
    fbPixelId: "Facebook Pixel ID", fbPixelIdHint: "Facebook Events Manager'dan olinadi (faqat raqamlar, masalan: 1234567890123456). Bo'sh qoldirsangiz — pixel ishlamaydi.",

    backup: "Zaxira nusxa", backupHint: "Barcha ma'lumotlaringizni (mahsulotlar, buyurtmalar, mijozlar va h.k.) bitta faylga yuklab oling.",
    trustTitle: "Ishonch belgilari", trustHint: "Do'kon sahifasining pastida chiqadigan 4 ta qisqa matn. Bo'sh qoldirsangiz — standart matn ko'rinadi.",
    trustFeature1: "1-matn", trustFeature1Ph: "Masalan: Bepul yetkazib berish",
    trustFeature2: "2-matn", trustFeature2Ph: "Masalan: Oson qaytarish",
    trustFeature3: "3-matn", trustFeature3Ph: "Masalan: Xavfsiz to'lov",
    trustFeature4: "4-matn", trustFeature4Ph: "Masalan: 24/7 qo'llab-quvvatlash",
    trustFeature4Link: "4-matn havolasi", trustFeature4Hint: "Mijoz shu matnga bosganda o'sha havolaga o'tadi (masalan qo'llab-quvvatlash Telegram akkounti).",
    backupBtn: "Zaxira nusxani yuklab olish", backingUp: "Tayyorlanmoqda...",

    save: "Saqlash", saving: "Saqlanmoqda...", saved: "Saqlandi",
  },
  ru: {
    title: "Настройки магазина",
    logo: "Логотип магазина", logoHint: "Рекомендуется квадратное изображение (например 200×200)", uploadHint: "Выберите изображение", uploading: "Загрузка...",
    general: "Общее",
    storeName: "Название магазина", storeNameHint: "Отображается в шапке и футере сайта",

    social: "Социальные сети",
    instagram: "Instagram", instagramHandleHint: "Например: casme.uz (без @)",
    instagramLink: "Ссылка на Instagram", instagramLinkHint: "https://instagram.com/casme.uz",
    telegramLink: "Ссылка на Telegram", tiktokLink: "Ссылка на TikTok",

    contact: "Контактная информация",
    contactPhone: "Номер телефона", contactAddress: "Адрес",
    workingHours: "Часы работы", workingHoursHint: "Отметьте для каждого дня, открыт ли магазин, и укажите время",
    workDay: "Рабочий день", dayOff: "Выходной", from: "с", to: "до",

    seo: "SEO настройки", seoHint: "Эти данные определяют, как сайт отображается в Google и других поисковиках.",
    seoTitle: "Заголовок сайта (title)", seoTitleHint: "Отображается во вкладке браузера и в результатах Google",
    seoDescription: "Краткое описание (description)", seoDescriptionHint: "Текст под заголовком в результатах Google",
    seoKeywords: "Ключевые слова (опционально)", seoKeywordsHint: "Разделяйте запятой",

    marketing: "Маркетинг", marketingHint: "Чтобы реклама в Facebook/Instagram правильно считала покупки на сайте и оптимизировалась под них.",
    fbPixelId: "Facebook Pixel ID", fbPixelIdHint: "Берётся из Facebook Events Manager (только цифры, например: 1234567890123456). Если оставить пустым — pixel не будет работать.",

    backup: "Резервная копия", backupHint: "Скачайте все ваши данные (товары, заказы, клиенты и т.д.) в одном файле.",
    trustTitle: "Значки доверия", trustHint: "4 коротких текста внизу страницы магазина. Если оставить пустым — покажется стандартный текст.",
    trustFeature1: "Текст 1", trustFeature1Ph: "Например: Бесплатная доставка",
    trustFeature2: "Текст 2", trustFeature2Ph: "Например: Лёгкий возврат",
    trustFeature3: "Текст 3", trustFeature3Ph: "Например: Безопасная оплата",
    trustFeature4: "Текст 4", trustFeature4Ph: "Например: Поддержка 24/7",
    trustFeature4Link: "Ссылка для текста 4", trustFeature4Hint: "При нажатии на этот текст откроется указанная ссылка (например, Telegram поддержки).",
    backupBtn: "Скачать резервную копию", backingUp: "Подготовка...",

    save: "Сохранить", saving: "Сохранение...", saved: "Сохранено",
  },
};

const BACKUP_COLLECTIONS = ["products", "categories", "brands", "customers", "orders", "banners", "testimonials", "faqs", "promoCodes", "newsletter", "settings"];

const DAYS = [
  { key: "mon", uz: "Dushanba", ru: "Понедельник" },
  { key: "tue", uz: "Seshanba", ru: "Вторник" },
  { key: "wed", uz: "Chorshanba", ru: "Среда" },
  { key: "thu", uz: "Payshanba", ru: "Четверг" },
  { key: "fri", uz: "Juma", ru: "Пятница" },
  { key: "sat", uz: "Shanba", ru: "Суббота" },
  { key: "sun", uz: "Yakshanba", ru: "Воскресенье" },
];
const DEFAULT_DAY = { open: false, from: "09:00", to: "18:00" };
const defaultWorkingHours = () => Object.fromEntries(DAYS.map((d) => [d.key, { ...DEFAULT_DAY }]));

const emptyForm = (settings) => ({
  storeName: settings?.storeName || "",
  logoUrl: settings?.logoUrl || "",
  instagramHandle: settings?.instagramHandle || "",
  instagramLink: settings?.instagramLink || "",
  telegramLink: settings?.telegramLink || "",
  tiktokLink: settings?.tiktokLink || "",
  contactPhone: settings?.contactPhone || "",
  contactAddress: settings?.contactAddress || "",
  workingHours: settings?.workingHours && typeof settings.workingHours === "object" ? { ...defaultWorkingHours(), ...settings.workingHours } : defaultWorkingHours(),
  seoTitle: settings?.seoTitle || "",
  seoDescription: settings?.seoDescription || "",
  seoKeywords: settings?.seoKeywords || "",
  fbPixelId: settings?.fbPixelId || "",
  trustFeature1: settings?.trustFeature1 || "",
  trustFeature2: settings?.trustFeature2 || "",
  trustFeature3: settings?.trustFeature3 || "",
  trustFeature4: settings?.trustFeature4 || "",
  trustFeature4Link: settings?.trustFeature4Link || "",
});

export default function StoreSettings({ lang, settings }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [form, setForm] = useState(emptyForm(settings));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  // Firestore'dan kelgan qiymatlar yuklangach formani yangilaymiz.
  useEffect(() => {
    setForm(emptyForm(settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  const save = async () => {
    setSaving(true);
    await setItem("settings", "store", {
      storeName: form.storeName.trim(),
      logoUrl: form.logoUrl,
      instagramHandle: form.instagramHandle.trim().replace(/^@/, ""),
      instagramLink: form.instagramLink.trim(),
      telegramLink: form.telegramLink.trim(),
      tiktokLink: form.tiktokLink.trim(),
      contactPhone: form.contactPhone.trim(),
      contactAddress: form.contactAddress.trim(),
      workingHours: form.workingHours,
      seoTitle: form.seoTitle.trim(),
      seoDescription: form.seoDescription.trim(),
      seoKeywords: form.seoKeywords.trim(),
      fbPixelId: form.fbPixelId.trim(),
      trustFeature1: form.trustFeature1.trim(),
      trustFeature2: form.trustFeature2.trim(),
      trustFeature3: form.trustFeature3.trim(),
      trustFeature4: form.trustFeature4.trim(),
      trustFeature4Link: form.trustFeature4Link.trim(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImage("settings/logo", file);
      setForm((f) => ({ ...f, logoUrl: url }));
    } catch (e) {
      console.error("Logotip yuklashda xatolik:", e);
    }
    setUploadingLogo(false);
  };

  const downloadBackup = async () => {
    setBackingUp(true);
    try {
      const data = {};
      for (const name of BACKUP_COLLECTIONS) {
        data[name] = await getAllDocs(name);
      }
      data._exportedAt = new Date().toISOString();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zaxira-nusxa-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Zaxira nusxa olishda xatolik:", e);
    }
    setBackingUp(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">{t.title}</h2>

        {/* Umumiy: logotip + do'kon nomi */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.general}</p>
        <Field label={t.logo}>
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-slate-300">
              {form.logoUrl ? <img loading="lazy" src={form.logoUrl} alt="" className="h-full w-full object-cover" /> : <ImageOff size={22} />}
            </div>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
              {uploadingLogo ? <Loader2 size={14} className="animate-spin" /> : null}
              {uploadingLogo ? t.uploading : t.uploadHint}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={(e) => handleLogoUpload(e.target.files?.[0])} />
            </label>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{t.logoHint}</p>
        </Field>

        <Field label={t.storeName}>
          <input className={inputCls} value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} placeholder={t.storeNameHint} />
          <p className="mt-1 text-[11px] text-slate-400">{t.storeNameHint}</p>
        </Field>

        {/* Ijtimoiy tarmoqlar */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.social}</p>
        <Field label={t.instagram}>
          <input className={inputCls} value={form.instagramHandle} onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })} placeholder={t.instagramHandleHint} />
        </Field>
        <Field label={t.instagramLink}>
          <input className={inputCls} value={form.instagramLink} onChange={(e) => setForm({ ...form, instagramLink: e.target.value })} placeholder={t.instagramLinkHint} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t.telegramLink}>
            <input className={inputCls} value={form.telegramLink} onChange={(e) => setForm({ ...form, telegramLink: e.target.value })} placeholder="https://t.me/..." />
          </Field>
          <Field label={t.tiktokLink}>
            <input className={inputCls} value={form.tiktokLink} onChange={(e) => setForm({ ...form, tiktokLink: e.target.value })} placeholder="https://tiktok.com/@..." />
          </Field>
        </div>

        {/* Aloqa ma'lumotlari */}
        <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.contact}</p>
        <Field label={t.contactPhone}>
          <input className={inputCls} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+998 (90) 123 45 67" />
        </Field>
        <Field label={t.contactAddress}>
          <input className={inputCls} value={form.contactAddress} onChange={(e) => setForm({ ...form, contactAddress: e.target.value })} />
        </Field>

        {/* Ish vaqti — har bir kun uchun belgilash */}
        <Field label={t.workingHours}>
          <p className="mb-2 text-[11px] text-slate-400">{t.workingHoursHint}</p>
          <div className="space-y-1.5">
            {DAYS.map((day) => {
              const dayState = form.workingHours[day.key] || DEFAULT_DAY;
              return (
                <div key={day.key} className="rounded-lg border border-gray-100 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, workingHours: { ...form.workingHours, [day.key]: { ...dayState, open: !dayState.open } } })}
                        aria-pressed={dayState.open}
                        style={{
                          width: "36px",
                          height: "20px",
                          padding: "2px",
                          boxSizing: "border-box",
                          borderRadius: "9999px",
                          display: "flex",
                          alignItems: "center",
                          border: "none",
                          cursor: "pointer",
                          flexShrink: 0,
                          backgroundColor: dayState.open ? "#059669" : "#d1d5db",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <span
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "9999px",
                            backgroundColor: "#ffffff",
                            transform: dayState.open ? "translateX(16px)" : "translateX(0)",
                            transition: "transform 0.2s ease",
                            willChange: "transform",
                          }}
                        />
                      </button>
                      <span className="text-xs font-medium text-slate-600">{day[lang] || day.uz}</span>
                    </div>
                    {!dayState.open && <span className="text-xs text-slate-400">{t.dayOff}</span>}
                  </div>
                  {dayState.open && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[46px] text-xs text-slate-500">
                      <span>{t.from}</span>
                      <input
                        type="time"
                        value={dayState.from}
                        onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, [day.key]: { ...dayState, from: e.target.value } } })}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none"
                      />
                      <span>{t.to}</span>
                      <input
                        type="time"
                        value={dayState.to}
                        onChange={(e) => setForm({ ...form, workingHours: { ...form.workingHours, [day.key]: { ...dayState, to: e.target.value } } })}
                        className="rounded-lg border border-gray-200 px-2 py-1 text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Field>

        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 size={13} /> {t.saved}</span>
          )}
        </div>
      </div>

      {/* SEO */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600"><SeoIcon size={15} /></span>
          <h3 className="text-sm font-semibold text-slate-800">{t.seo}</h3>
        </div>
        <p className="mb-3 text-xs text-slate-400">{t.seoHint}</p>
        <Field label={t.seoTitle}>
          <input className={inputCls} value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
          <p className="mt-1 text-[11px] text-slate-400">{t.seoTitleHint}</p>
        </Field>
        <Field label={t.seoDescription}>
          <textarea className={`${inputCls} min-h-[70px] resize-y`} value={form.seoDescription} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} />
          <p className="mt-1 text-[11px] text-slate-400">{t.seoDescriptionHint}</p>
        </Field>
        <Field label={t.seoKeywords}>
          <input className={inputCls} value={form.seoKeywords} onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })} placeholder={t.seoKeywordsHint} />
        </Field>
        <button onClick={save} disabled={saving} className="mt-1 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
        </button>
      </div>

      {/* Marketing (Facebook Pixel) */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Megaphone size={15} /></span>
          <h3 className="text-sm font-semibold text-slate-800">{t.marketing}</h3>
        </div>
        <p className="mb-3 text-xs text-slate-400">{t.marketingHint}</p>
        <Field label={t.fbPixelId}>
          <input className={inputCls} value={form.fbPixelId} onChange={(e) => setForm({ ...form, fbPixelId: e.target.value })} placeholder="1234567890123456" />
          <p className="mt-1 text-[11px] text-slate-400">{t.fbPixelIdHint}</p>
        </Field>
        <button onClick={save} disabled={saving} className="mt-1 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
        </button>
      </div>

      {/* Ishonch belgilari */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">{t.trustTitle}</h3>
        <p className="mb-3 text-xs text-slate-400">{t.trustHint}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label={t.trustFeature1}>
            <input className={inputCls} value={form.trustFeature1} onChange={(e) => setForm({ ...form, trustFeature1: e.target.value })} placeholder={t.trustFeature1Ph} />
          </Field>
          <Field label={t.trustFeature2}>
            <input className={inputCls} value={form.trustFeature2} onChange={(e) => setForm({ ...form, trustFeature2: e.target.value })} placeholder={t.trustFeature2Ph} />
          </Field>
          <Field label={t.trustFeature3}>
            <input className={inputCls} value={form.trustFeature3} onChange={(e) => setForm({ ...form, trustFeature3: e.target.value })} placeholder={t.trustFeature3Ph} />
          </Field>
          <Field label={t.trustFeature4}>
            <input className={inputCls} value={form.trustFeature4} onChange={(e) => setForm({ ...form, trustFeature4: e.target.value })} placeholder={t.trustFeature4Ph} />
          </Field>
          <Field label={t.trustFeature4Link}>
            <input className={inputCls} value={form.trustFeature4Link} onChange={(e) => setForm({ ...form, trustFeature4Link: e.target.value })} placeholder="https://t.me/..." />
            <p className="mt-1 text-[11px] text-slate-400">{t.trustFeature4Hint}</p>
          </Field>
        </div>
        <button onClick={save} disabled={saving} className="mt-1 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
        </button>
      </div>

      {/* Zaxira nusxa */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">{t.backup}</h3>
        <p className="mb-3 text-xs text-slate-400">{t.backupHint}</p>
        <button onClick={downloadBackup} disabled={backingUp} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 disabled:opacity-60">
          {backingUp ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} {backingUp ? t.backingUp : t.backupBtn}
        </button>
      </div>
    </div>
  );
}
