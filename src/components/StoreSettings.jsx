import React, { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, ImageOff, Download, Search as SeoIcon, Megaphone, Trash2 } from "lucide-react";
import { setItem, updateItem, uploadImage, getAllDocs, listAllFirebaseFiles, deleteFirebaseFile } from "../storage.js";
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

    imageMigration: "Rasmlarni Cloudflare R2'ga ko'chirish",
    imageMigrationHint: "Avval Firebase Storage'ga yuklangan barcha rasmlarni (mahsulot, banner, logotip va h.k.) Cloudflare R2'ga ko'chiradi — bir martalik jarayon. Yangi yuklanadigan rasmlar allaqachon avtomatik R2'ga tushadi.",
    imageMigrationBtn: "Ko'chirishni boshlash", imageMigrationRunning: "Ko'chirilmoqda...",
    imageMigrationWarn: "Jarayon davomida shu sahifani yopmang yoki qayta yuklamang.",

    cleanupTitle: "Firebase Storage'dagi eski rasmlarni o'chirish",
    cleanupHint: "R2'ga ko'chirilgan rasmlarning Firebase'dagi eski nusxalarini butunlay o'chirib tashlaydi (joy bo'shatish uchun). FAQAT R2'ga muvaffaqiyatli ko'chirilgandan KEYIN bosing — bu amalni ORQAGA QAYTARIB BO'LMAYDI.",
    cleanupBtn: "Eski rasmlarni o'chirish", cleanupRunning: "O'chirilmoqda...",
    cleanupConfirm: "DIQQAT: Firebase Storage'dagi BARCHA eski rasm fayllari butunlay o'chiriladi va bu amalni orqaga qaytarib bo'lmaydi. Rasmlar R2'ga muvaffaqiyatli ko'chirilganiga va sayt to'g'ri ishlayotganiga ishonchingiz komilmi?",

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

    imageMigration: "Перенос изображений в Cloudflare R2",
    imageMigrationHint: "Переносит все ранее загруженные в Firebase Storage изображения (товары, баннеры, логотип и т.д.) в Cloudflare R2 — одноразовый процесс. Новые загрузки уже автоматически идут в R2.",
    imageMigrationBtn: "Начать перенос", imageMigrationRunning: "Перенос идёт...",
    imageMigrationWarn: "Не закрывайте и не перезагружайте эту страницу во время процесса.",

    cleanupTitle: "Удалить старые изображения из Firebase Storage",
    cleanupHint: "Полностью удаляет старые копии изображений в Firebase (те, что уже перенесены в R2) — для освобождения места. Нажимайте ТОЛЬКО ПОСЛЕ успешного переноса в R2 — это действие НЕЛЬЗЯ ОТМЕНИТЬ.",
    cleanupBtn: "Удалить старые изображения", cleanupRunning: "Удаление...",
    cleanupConfirm: "ВНИМАНИЕ: ВСЕ старые файлы изображений в Firebase Storage будут удалены безвозвратно. Вы уверены, что изображения успешно перенесены в R2 и сайт работает корректно?",

    save: "Сохранить", saving: "Сохранение...", saved: "Сохранено",
  },
};

/**
 * Rasm ko'chirish uchun: qaysi kolleksiya/maydonda Firebase Storage
 * havolalari bo'lishi mumkinligi ro'yxati. `pathFor` — R2'da saqlash
 * uchun yo'l (aynan LIVE yuklash funksiyalari ishlatadigan naqadga mos —
 * shunda kelajakda o'sha rasm qayta yuklansa, xuddi shu manzilni
 * ustidan yozadi).
 */
const IMAGE_MIGRATION_TARGETS = [
  { collection: "products", field: "imageUrls", isArray: true, pathFor: (doc, idx) => `products/${doc.id}/migrated-${idx}` },
  { collection: "banners", field: "desktopImage", pathFor: (doc) => `banners/${doc.id}/banner-desktop` },
  { collection: "banners", field: "mobileImage", pathFor: (doc) => `banners/${doc.id}/banner-mobile` },
  { collection: "testimonials", field: "imageUrl", pathFor: (doc) => `testimonials/${doc.id}/photo` },
  { collection: "categories", field: "imageUrl", pathFor: (doc) => `categories/${doc.id}/image` },
  { collection: "brands", field: "imageUrl", pathFor: (doc) => `brands/${doc.id}/image` },
  { collection: "collections", field: "imageUrl", pathFor: (doc) => `collections/${doc.id}/image` },
  { collection: "settings", field: "logoUrl", onlyId: "store", pathFor: () => `settings/logo` },
];

function isFirebaseImageUrl(url) {
  return typeof url === "string" && /firebasestorage\.(googleapis\.com|app)/.test(url);
}

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
  const [migrating, setMigrating] = useState(false);
  const [migrationLog, setMigrationLog] = useState([]);
  const [migrationProgress, setMigrationProgress] = useState({ done: 0, total: 0 });
  const [cleaning, setCleaning] = useState(false);
  const [cleanupLog, setCleanupLog] = useState([]);
  const [cleanupProgress, setCleanupProgress] = useState({ done: 0, total: 0 });

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

  /**
   * Bir martalik migratsiya: avval Firebase Storage'ga yuklangan barcha
   * rasmlarni Cloudflare R2'ga ko'chiradi va Firestore'dagi havolalarni
   * yangilaydi. Admin panelida (login qilingan holatda) ishga tushiriladi
   * — shu sabab Firestore xavfsizlik qoidalarida talab qilingan
   * "request.auth != null" shartini qoniqtiradi (oddiy mijoz brauzeridan
   * bu funksiya chaqirilmaydi).
   *
   * Qayta ishga tushirish XAVFSIZ: faqat hali ham "firebasestorage..."
   * havolasiga ega maydonlarni topadi — allaqachon R2'ga ko'chirilganlar
   * (yangi havola boshqa domenda) qayta tegilmaydi.
   */
  const migrateImagesToR2 = async () => {
    setMigrating(true);
    setMigrationLog([]);
    setMigrationProgress({ done: 0, total: 0 });
    const logLine = (msg) => setMigrationLog((prev) => [...prev.slice(-59), msg]);
    try {
      // 1) Barcha tegishli hujjatlarni o'qiymiz va ko'chirilishi kerak
      // bo'lgan har bir rasmni "vazifa" sifatida ro'yxatga tushiramiz.
      const docsCache = {}; // "collection/docId" -> original hujjat
      const tasks = [];
      for (const target of IMAGE_MIGRATION_TARGETS) {
        const docs = await getAllDocs(target.collection);
        for (const doc of docs) {
          if (target.onlyId && doc.id !== target.onlyId) continue;
          docsCache[`${target.collection}/${doc.id}`] = doc;
          const value = doc[target.field];
          if (target.isArray) {
            if (!Array.isArray(value)) continue;
            value.forEach((url, idx) => {
              if (isFirebaseImageUrl(url)) {
                tasks.push({ collection: target.collection, docId: doc.id, field: target.field, isArray: true, index: idx, url, path: target.pathFor(doc, idx) });
              }
            });
          } else if (isFirebaseImageUrl(value)) {
            tasks.push({ collection: target.collection, docId: doc.id, field: target.field, isArray: false, url: value, path: target.pathFor(doc) });
          }
        }
      }

      setMigrationProgress({ done: 0, total: tasks.length });
      if (!tasks.length) {
        logLine("Ko'chirish kerak bo'lgan rasm topilmadi — barchasi allaqachon R2'da.");
        setMigrating(false);
        return;
      }
      logLine(`${tasks.length} ta rasm topildi, ko'chirish boshlandi...`);

      // 2) Har bir rasmni (bir nechtasini parallel) yuklab olib, R2'ga
      // qayta yuklaymiz. Natijalarni darhol bazaga yozmaymiz — avval
      // hammasini yig'ib olamiz (pastda, har hujjat uchun BITTA yozuv
      // qilish uchun; bir hujjatda bir nechta rasm bo'lishi mumkin).
      const newValues = {}; // "collection/docId/field[/index]" -> yangi R2 URL
      let doneCount = 0;
      const CONCURRENCY = 4;
      let cursor = 0;
      const worker = async () => {
        while (cursor < tasks.length) {
          const task = tasks[cursor++];
          try {
            // MUHIM: rasmni brauzerda emas, SERVERDA (api/migrate-image)
            // yuklab olamiz — chunki Firebase Storage'dan brauzer orqali
            // to'g'ridan-to'g'ri fetch() qilish CORS xatosiga ("Failed to
            // fetch") uchraydi (Firebase bucket'ida boshqa domenlar uchun
            // CORS sozlanmagan). Serverdan-serverga so'rovda bu cheklov yo'q.
            const res = await fetch("/api/migrate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sourceUrl: task.url, path: task.path }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
            const key = task.isArray ? `${task.collection}/${task.docId}/${task.field}/${task.index}` : `${task.collection}/${task.docId}/${task.field}`;
            newValues[key] = data.url;
          } catch (e) {
            logLine(`Xato (${task.collection}/${task.docId}, ${task.field}): ${e?.message || e}`);
          }
          doneCount++;
          setMigrationProgress({ done: doneCount, total: tasks.length });
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));

      // 3) Endi har bir tegishli hujjatga (faqat BIR marta) yozamiz.
      const touchedDocKeys = new Set(tasks.map((t) => `${t.collection}/${t.docId}`));
      let updatedCount = 0;
      for (const key of touchedDocKeys) {
        const [collection, docId] = key.split("/");
        const original = docsCache[key];
        if (!original) continue;
        const relevantTargets = IMAGE_MIGRATION_TARGETS.filter(
          (t) => t.collection === collection && (!t.onlyId || t.onlyId === docId)
        );
        const updatePayload = {};
        for (const t of relevantTargets) {
          if (t.isArray) {
            const originalArr = original[t.field];
            if (!Array.isArray(originalArr)) continue;
            const newArr = originalArr.map((url, idx) => newValues[`${collection}/${docId}/${t.field}/${idx}`] || url);
            if (newArr.some((v, idx) => v !== originalArr[idx])) updatePayload[t.field] = newArr;
          } else {
            const nv = newValues[`${collection}/${docId}/${t.field}`];
            if (nv) updatePayload[t.field] = nv;
          }
        }
        if (Object.keys(updatePayload).length > 0) {
          try {
            await updateItem(collection, docId, updatePayload);
            updatedCount++;
          } catch (e) {
            logLine(`Bazaga yozishda xato (${key}): ${e?.message || e}`);
          }
        }
      }
      logLine(`Tugadi. ${updatedCount} ta hujjat yangilandi (${tasks.length} ta rasmdan).`);
    } catch (e) {
      logLine(`Umumiy xato: ${e?.message || e}`);
    }
    setMigrating(false);
  };

  /**
   * BITTA MARTALIK TOZALASH: R2'ga muvaffaqiyatli ko'chirilgandan keyin,
   * Firebase Storage'dagi eski (endi ishlatilmayotgan) rasm fayllarini
   * butunlay o'chiradi — joy bo'shatish uchun. QAYTARIB BO'LMAYDIGAN amal,
   * shuning uchun oldin window.confirm() bilan tasdiqlanadi.
   */
  const cleanupFirebaseImages = async () => {
    if (!window.confirm(t.cleanupConfirm)) return;
    setCleaning(true);
    setCleanupLog([]);
    setCleanupProgress({ done: 0, total: 0 });
    const logLine = (msg) => setCleanupLog((prev) => [...prev.slice(-59), msg]);
    try {
      logLine("Fayllar ro'yxati olinmoqda...");
      // MUHIM: bucket ILDIZINI ("") ro'yxatlashning o'zi (listAll) uchun
      // storage.rules'da alohida ruxsat yo'q (faqat /banners/**, /products/**
      // kabi ICHKI papkalar uchun bor) — shu sabab ildizdan boshlab
      // ro'yxatlash bo'sh natija qaytarishi mumkin. O'rniga xuddi
      // storage.rules'dagi har bir papkani ALOHIDA-ALOHIDA ro'yxatlaymiz.
      const KNOWN_FOLDERS = ["banners", "products", "settings", "categories", "brands", "collections", "testimonials"];
      let paths = [];
      for (const folder of KNOWN_FOLDERS) {
        try {
          const folderPaths = await listAllFirebaseFiles(folder);
          logLine(`"${folder}/" papkasida ${folderPaths.length} ta fayl topildi.`);
          paths = paths.concat(folderPaths);
        } catch (e) {
          logLine(`"${folder}/" papkasini o'qishda xato: ${e?.message || e}`);
        }
      }
      setCleanupProgress({ done: 0, total: paths.length });
      if (!paths.length) {
        logLine("Firebase Storage'da hech qanday fayl topilmadi — tozalash shart emas.");
        setCleaning(false);
        return;
      }
      logLine(`${paths.length} ta fayl topildi, o'chirish boshlandi...`);

      let doneCount = 0;
      let deletedCount = 0;
      const CONCURRENCY = 6;
      let cursor = 0;
      const worker = async () => {
        while (cursor < paths.length) {
          const path = paths[cursor++];
          try {
            await deleteFirebaseFile(path);
            deletedCount++;
          } catch (e) {
            logLine(`Xato (${path}): ${e?.message || e}`);
          }
          doneCount++;
          setCleanupProgress({ done: doneCount, total: paths.length });
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      logLine(`Tugadi. ${deletedCount} / ${paths.length} ta fayl o'chirildi.`);
    } catch (e) {
      logLine(`Umumiy xato: ${e?.message || e}`);
    }
    setCleaning(false);
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

      {/* Rasmlarni Cloudflare R2'ga ko'chirish — bir martalik migratsiya */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">{t.imageMigration}</h3>
        <p className="mb-3 text-xs text-slate-400">{t.imageMigrationHint}</p>
        <button
          onClick={migrateImagesToR2}
          disabled={migrating}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50 disabled:opacity-60"
        >
          {migrating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {migrating ? t.imageMigrationRunning : t.imageMigrationBtn}
        </button>
        {migrating && (
          <p className="mt-2 text-[11px] font-medium text-amber-600">{t.imageMigrationWarn}</p>
        )}
        {migrationProgress.total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${Math.round((migrationProgress.done / migrationProgress.total) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{migrationProgress.done} / {migrationProgress.total}</p>
          </div>
        )}
        {migrationLog.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-2 text-[11px] font-mono text-slate-500">
            {migrationLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </div>

      {/* Firebase Storage'dagi eski rasmlarni o'chirish — qaytarib bo'lmaydigan tozalash */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-1 text-sm font-semibold text-rose-600">{t.cleanupTitle}</h3>
        <p className="mb-3 text-xs text-slate-400">{t.cleanupHint}</p>
        <button
          onClick={cleanupFirebaseImages}
          disabled={cleaning}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3.5 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60"
        >
          {cleaning ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
          {cleaning ? t.cleanupRunning : t.cleanupBtn}
        </button>
        {cleanupProgress.total > 0 && (
          <div className="mt-3">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-rose-500 transition-all"
                style={{ width: `${Math.round((cleanupProgress.done / cleanupProgress.total) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{cleanupProgress.done} / {cleanupProgress.total}</p>
          </div>
        )}
        {cleanupLog.length > 0 && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-2 text-[11px] font-mono text-slate-500">
            {cleanupLog.map((line, i) => <div key={i}>{line}</div>)}
          </div>
        )}
      </div>
    </div>
  );
}
