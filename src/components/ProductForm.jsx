import React, { useState } from "react";
import { X, Plus, Loader2, Save, Package, Lock, ArrowLeft, UploadCloud, ChevronDown } from "lucide-react";
import { setItem, deleteItem, uploadImage, deleteStorageFile, addItem } from "../storage.js";
import { Field, inputCls, uid, fmtMoney, discountPct } from "./ui.jsx";

const MAX_IMAGES = 10;

const EMPTY_FORM = {
  nameUz: "", nameRu: "", descriptionUz: "", descriptionRu: "",
  brand: "", category: "", price: "", oldPrice: "", costPrice: "", rating: "", reviewCount: "", tag: "none", stockType: "limited", stock: "",
  imageUrls: [], active: true,
  country: "", skinType: "", useArea: "", compositionFeature: "", hypoallergenic: "", forWhom: "", dailyUse: "",
};

/** Filtrlash uchun qo'shimcha xususiyatlar — do'kondagi "Filtrlar" oynasida shu maydonlar bo'yicha tanlash imkoni bo'ladi. */
const EXTRA_FIELDS = [
  { key: "country" },
  { key: "skinType" },
  { key: "useArea" },
  { key: "compositionFeature" },
  { key: "hypoallergenic" },
  { key: "forWhom" },
  { key: "dailyUse" },
];

const T_LOCAL = {
  uz: {
    addTitle: "Yangi mahsulot", editTitle: "Mahsulotni tahrirlash",
    addSubtitle: "Yangi mahsulot qo'shing va do'koningizga joylang.",
    editSubtitle: "Mahsulot ma'lumotlarini yangilang.",
    section1: "Asosiy ma'lumotlar", section2: "Narx va miqdor", section3: "Qo'shimcha ma'lumotlar",
    images: "Mahsulot rasmlari", imagesHint: "Birinchi rasm — asosiy rasm bo'ladi, u mahsulot kartasida ko'rinadi.",
    addImage: "Rasm qo'shish", imageFormats: "JPG, PNG, WEBP", mainBadge: "Asosiy", uploading: "Yuklanmoqda...",
    nameUz: "Tovar nomi (o'zbek)", nameRu: "Tovar nomi (rus)",
    descUz: "Tovar tavsifi (o'zbek)", descRu: "Tovar tavsifi (rus)",
    descPh: "Tovaringiz, uning xususiyatlari va afzalliklari haqida aytib bering",
    category: "Kategoriya", categoryPh: "Mavjuddan tanlang yoki yangisini yozing",
    brand: "Brend (ixtiyoriy)", brandPh: "Mavjuddan tanlang yoki yangisini yozing",
    price: "Narx", oldPrice: "Eski narx / chegirmadan oldingi narx", oldPriceHint: "Ixtiyoriy — kiritilsa chegirma foizi avtomatik hisoblanadi",
    costPrice: "Tannarx (faqat sizga ko'rinadi)", costPriceHint: "Mahsulotning sizga tushgan narxi — mijozlarga hech qachon ko'rsatilmaydi",
    rating: "Reyting (ixtiyoriy)", ratingHint: "Masalan: 4.8 (0 dan 5 gacha)",
    reviewCount: "Sharhlar soni (ixtiyoriy)", reviewCountHint: "Masalan: 124",
    tag: "Nishon (ixtiyoriy)", tagNone: "Yo'q", tagNew: "Yangi", tagBestseller: "Top / Ko'p sotilgan",
    discount: "chegirma", discountBadge: "Chegirma", autoHint: "avtomatik",
    stockType: "Qoldiq turi", limited: "Soni bilan", unlimited: "Cheksiz", outOfStock: "Qolmagan",
    stock: "Qoldiq soni (dona)",
    statusTitle: "Holat va ko'rinish", statusLabel: "Holat", badgeLabel: "Nishon",
    active: "Faol", inactive: "Nofaol",
    cancel: "Bekor qilish", save: "Saqlash", saving: "Saqlanmoqda...",
    required: "Kamida bitta tilda nom kiriting", uzs: "UZS",
    filterFieldsTitle: "Qo'shimcha xususiyatlar (filtrlash uchun)",
    filterFieldsHint: "Bu maydonlar do'kondagi \"Filtrlar\" oynasida mijozlarga tanlov sifatida chiqadi. Bo'sh qoldirsangiz, o'sha filtr bo'limi mijozga ko'rinmaydi.",
    country: "Ishlab chiqarilgan mamlakat", countryPh: "Masalan: Janubiy Koreya",
    skinType: "Teri turi", skinTypePh: "Masalan: Yog'li teri",
    useArea: "Qo'llash sohasi", useAreaPh: "Masalan: Yuz",
    compositionFeature: "Tarkib xususiyati", compositionFeaturePh: "Masalan: Spirtsiz",
    hypoallergenic: "Gipoallergen", hypoallergenicPh: "Masalan: Ha",
    forWhom: "Kimlar uchun", forWhomPh: "Masalan: Ayollar uchun",
    dailyUse: "Kundalik foydalanish uchun", dailyUsePh: "Masalan: Ha",
  },
  ru: {
    addTitle: "Новый товар", editTitle: "Редактировать товар",
    addSubtitle: "Добавьте новый товар в ваш магазин.",
    editSubtitle: "Обновите информацию о товаре.",
    section1: "Основная информация", section2: "Цена и количество", section3: "Дополнительная информация",
    images: "Изображения товара", imagesHint: "Первое изображение — главное, оно показывается на карточке товара.",
    addImage: "Добавить фото", imageFormats: "JPG, PNG, WEBP", mainBadge: "Главное", uploading: "Загрузка...",
    nameUz: "Название (узбекский)", nameRu: "Название (русский)",
    descUz: "Описание (узбекский)", descRu: "Описание (русский)",
    descPh: "Расскажите о товаре, его характеристиках и преимуществах",
    category: "Категория", categoryPh: "Выберите или введите новую",
    brand: "Бренд (опционально)", brandPh: "Выберите или введите новый",
    price: "Цена", oldPrice: "Старая цена / до скидки", oldPriceHint: "Опционально — если указана, скидка считается автоматически",
    costPrice: "Себестоимость (видно только вам)", costPriceHint: "Ваша закупочная цена — покупателям никогда не показывается",
    rating: "Рейтинг (опционально)", ratingHint: "Например: 4.8 (от 0 до 5)",
    reviewCount: "Количество отзывов (опционально)", reviewCountHint: "Например: 124",
    tag: "Значок (опционально)", tagNone: "Нет", tagNew: "Новинка", tagBestseller: "Топ / Хит продаж",
    discount: "скидка", discountBadge: "Скидка", autoHint: "автоматически",
    stockType: "Тип остатка", limited: "С количеством", unlimited: "Неограничено", outOfStock: "Нет в наличии",
    stock: "Количество (шт.)",
    statusTitle: "Статус и видимость", statusLabel: "Статус", badgeLabel: "Значок",
    active: "Активен", inactive: "Неактивен",
    cancel: "Отмена", save: "Сохранить", saving: "Сохранение...",
    required: "Укажите название хотя бы на одном языке", uzs: "UZS",
    filterFieldsTitle: "Дополнительные характеристики (для фильтров)",
    filterFieldsHint: "Эти поля появятся как варианты выбора в окне \"Фильтры\" в магазине. Если оставить пустым, этот раздел фильтра не будет виден покупателю.",
    country: "Страна производства", countryPh: "Например: Южная Корея",
    skinType: "Тип кожи", skinTypePh: "Например: Жирная кожа",
    useArea: "Область применения", useAreaPh: "Например: Лицо",
    compositionFeature: "Особенность состава", compositionFeaturePh: "Например: Без спирта",
    hypoallergenic: "Гипоаллергенно", hypoallergenicPh: "Например: Да",
    forWhom: "Для кого", forWhomPh: "Например: Для женщин",
    dailyUse: "Для ежедневного применения", dailyUsePh: "Например: Да",
  },
};

/** Chap ustundagi bo'lim sarlavhasi — raqamli doira + nom (yangi dizaynga mos). */
function SectionHeader({ n, title }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">{n}</span>
      <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
    </div>
  );
}

/**
 * Mahsulot qo'shish/tahrirlash — Uzum Marketdagi kabi katta, alohida
 * forma (kichik popup emas). `product` — tahrirlash uchun mavjud
 * mahsulot (yoki yangi qo'shishda `null`).
 */
export default function ProductForm({ lang, product, products, categories, brands, onClose, onEnsureCategory, onEnsureBrand }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const isEdit = !!product;
  // ID'ni oldindan aniqlaymiz — rasmlarni Storage'ga shu ID papkasiga yuklaymiz
  // (yangi mahsulotda ham, hali Firestore hujjati yaratilmagan bo'lsa ham ishlaydi).
  const [productId] = useState(() => (product ? product.id : uid()));

  const [form, setForm] = useState(() => {
    if (!product) return EMPTY_FORM;
    return {
      nameUz: product.nameUz || product.name || "",
      nameRu: product.nameRu || "",
      descriptionUz: product.descriptionUz || product.description || "",
      descriptionRu: product.descriptionRu || "",
      category: product.category || "",
      brand: product.brand || "",
      price: String(product.price ?? ""),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      costPrice: product.costPrice ? String(product.costPrice) : "",
      rating: product.rating ? String(product.rating) : "",
      reviewCount: product.reviewCount ? String(product.reviewCount) : "",
      tag: product.tag || "none",
      stockType: product.stockType || "limited",
      stock: String(product.stock ?? ""),
      imageUrls: product.imageUrls && product.imageUrls.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []),
      active: product.active !== false,
      country: product.country || "", skinType: product.skinType || "", useArea: product.useArea || "",
      compositionFeature: product.compositionFeature || "", hypoallergenic: product.hypoallergenic || "",
      forWhom: product.forWhom || "", dailyUse: product.dailyUse || "",
    };
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Har bir qo'shimcha maydon uchun boshqa mahsulotlarda oldin kiritilgan
  // qiymatlar — datalist orqali tez tanlash va bir xil yozilishini ta'minlash uchun.
  const extraFieldOptions = (key) =>
    Array.from(new Set((products || []).map((p) => p[key]).filter(Boolean)));

  const pct = discountPct(Number(form.price) || 0, Number(form.oldPrice) || 0);
  const isOut = form.stockType === "out" || (form.stockType === "limited" && form.stock !== "" && Number(form.stock) <= 0);

  const handleImageUpload = async (file) => {
    if (!file || form.imageUrls.length >= MAX_IMAGES) return;
    setUploading(true);
    try {
      const url = await uploadImage(`products/${productId}/${uid()}`, file);
      setForm((f) => ({ ...f, imageUrls: [...f.imageUrls, url] }));
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setForm((f) => ({ ...f, imageUrls: f.imageUrls.filter((_, i) => i !== index) }));
  };

  const submit = async () => {
    if (!form.nameUz.trim() && !form.nameRu.trim()) { setError(t.required); return; }
    if (!form.price) { setError(t.required); return; }
    if (form.stockType === "limited" && form.stock === "") { setError(t.required); return; }
    setSaving(true);

    const categoryName = form.category.trim();
    if (categoryName && onEnsureCategory) await onEnsureCategory(categoryName);
    const brandName = form.brand.trim();
    if (brandName && onEnsureBrand) await onEnsureBrand(brandName);

    const data = {
      nameUz: form.nameUz.trim(),
      nameRu: form.nameRu.trim(),
      // `name` — eski (bir tilli) joylarda ishlatilishi mumkin bo'lgan orqaga moslik maydoni.
      name: form.nameUz.trim() || form.nameRu.trim(),
      descriptionUz: form.descriptionUz.trim(),
      descriptionRu: form.descriptionRu.trim(),
      brand: brandName,
      category: categoryName,
      price: Number(form.price),
      oldPrice: Number(form.oldPrice) || 0,
      costPrice: Number(form.costPrice) || 0,
      rating: Number(form.rating) || 0,
      reviewCount: Number(form.reviewCount) || 0,
      tag: form.tag,
      stockType: form.stockType,
      stock: form.stockType === "limited" ? Number(form.stock) || 0 : 0,
      imageUrls: form.imageUrls,
      active: form.active,
      country: form.country.trim(), skinType: form.skinType.trim(), useArea: form.useArea.trim(),
      compositionFeature: form.compositionFeature.trim(), hypoallergenic: form.hypoallergenic.trim(),
      forWhom: form.forWhom.trim(), dailyUse: form.dailyUse.trim(),
    };

    await setItem("products", productId, data);

    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---------- Sarlavha — orqaga tugmasi, nom, va Saqlash/Bekor qilish yuqorida ---------- */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-gray-100 hover:text-slate-600">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-semibold leading-tight text-slate-800">{isEdit ? t.editTitle : t.addTitle}</h2>
              <p className="text-xs text-slate-400">{isEdit ? t.editSubtitle : t.addSubtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">{t.cancel}</button>
            <button
              onClick={submit}
              disabled={saving || uploading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-3 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-600">{error}</div>
        )}

        <div className="grid flex-1 grid-cols-1 gap-5 overflow-y-auto px-5 py-4 lg:grid-cols-3">
          {/* ================= CHAP USTUN — asosiy forma ================= */}
          <div className="space-y-5 lg:col-span-2">

            {/* ---------- 1. Asosiy ma'lumotlar ---------- */}
            <div className="rounded-2xl border border-slate-100 p-4">
              <SectionHeader n={1} title={t.section1} />

              {/* Rasmlar */}
              <div className="mb-5">
                <p className="mb-1 text-sm font-medium text-slate-700">{t.images} ({form.imageUrls.length}/{MAX_IMAGES})</p>
                <p className="mb-3 text-xs text-slate-400">{t.imagesHint}</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {form.imageUrls.map((url, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-50">
                      <img loading="lazy" src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      >
                        <X size={13} />
                      </button>
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 py-1 text-center text-[10px] font-medium text-white">
                          {t.mainBadge}
                        </span>
                      )}
                    </div>
                  ))}
                  {form.imageUrls.length < MAX_IMAGES && (
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-300 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-600">
                      {uploading ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                      <span className="px-1 text-center text-[11px] font-medium leading-tight">{uploading ? t.uploading : t.addImage}</span>
                      {!uploading && <span className="px-1 text-center text-[9px] leading-tight text-slate-300">{t.imageFormats}</span>}
                      <input type="file" accept="image/*" className="hidden" disabled={uploading}
                        onChange={(e) => { handleImageUpload(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              </div>

              {/* Nomi (uz/ru) */}
              <div className="mb-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.nameUz} error={error && !form.nameUz && !form.nameRu ? error : ""}>
                  <input className={inputCls} value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
                </Field>
                <Field label={t.nameRu}>
                  <input className={inputCls} value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
                </Field>
              </div>

              {/* Tavsif (uz/ru) — katta textarea */}
              <Field label={t.descUz}>
                <textarea
                  className={`${inputCls} min-h-[100px] resize-y`}
                  value={form.descriptionUz}
                  onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
                  placeholder={t.descPh}
                />
              </Field>
              <Field label={t.descRu}>
                <textarea
                  className={`${inputCls} min-h-[100px] resize-y`}
                  value={form.descriptionRu}
                  onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
                  placeholder={t.descPh}
                />
              </Field>

              {/* Brend / Kategoriya — yon-yonma, avtomatik to'ldirish (datalist) bilan */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.brand}>
                  <div className="relative">
                    <input
                      className={`${inputCls} pr-8`}
                      value={form.brand}
                      onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      list="product-form-brands"
                      placeholder={t.brandPh}
                    />
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                  <datalist id="product-form-brands">
                    {[...(brands || [])]
                      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "uz"))
                      .map((b) => <option key={b.id} value={b.name} />)}
                  </datalist>
                </Field>

                <Field label={t.category}>
                  <div className="relative">
                    <input
                      className={`${inputCls} pr-8`}
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      list="product-form-categories"
                      placeholder={t.categoryPh}
                    />
                    <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
                  </div>
                  <datalist id="product-form-categories">
                    {[...(categories || [])]
                      .sort((a, b) => (a.name || "").localeCompare(b.name || "", "uz"))
                      .map((c) => <option key={c.id} value={c.name} />)}
                  </datalist>
                </Field>
              </div>
            </div>

            {/* ---------- 2. Narx va miqdor ---------- */}
            <div className="rounded-2xl border border-slate-100 p-4">
              <SectionHeader n={2} title={t.section2} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.price} error={error && !form.price ? error : ""}>
                  <input type="number" className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </Field>
                <Field label={t.oldPrice}>
                  <input type="number" className={inputCls} value={form.oldPrice} onChange={(e) => setForm({ ...form, oldPrice: e.target.value })} placeholder={t.oldPriceHint} />
                </Field>
              </div>
              {pct > 0 && (
                <div className="mb-3 -mt-1 flex items-center gap-2 text-xs">
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-600">-{pct}% {t.discount}</span>
                  <span className="text-slate-400">
                    {fmtMoney(form.oldPrice)} → {fmtMoney(form.price)} {t.uzs}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label={t.costPrice}>
                  <input type="number" className={inputCls} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder={t.costPriceHint} />
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock size={11} /> {t.costPriceHint}
                  </p>
                </Field>
                {form.stockType === "limited" ? (
                  <Field label={t.stock} error={error && form.stock === "" ? error : ""}>
                    <input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  </Field>
                ) : <div />}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t.rating}>
                  <input type="number" step="0.1" min="0" max="5" className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder={t.ratingHint} />
                </Field>
                <Field label={t.reviewCount}>
                  <input type="number" min="0" className={inputCls} value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} placeholder={t.reviewCountHint} />
                </Field>
              </div>
            </div>

            {/* ---------- 3. Qo'shimcha ma'lumotlar (filtrlash uchun) ---------- */}
            <div className="rounded-2xl border border-slate-100 p-4">
              <SectionHeader n={3} title={t.section3} />
              <p className="mb-3 -mt-2 text-xs text-slate-400">{t.filterFieldsHint}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {EXTRA_FIELDS.map(({ key }) => (
                  <Field key={key} label={t[key]}>
                    <input
                      className={inputCls}
                      value={form[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      list={`product-form-${key}`}
                      placeholder={t[`${key}Ph`]}
                    />
                    <datalist id={`product-form-${key}`}>
                      {extraFieldOptions(key).map((v) => <option key={v} value={v} />)}
                    </datalist>
                  </Field>
                ))}
              </div>
            </div>
          </div>

          {/* ================= O'NG USTUN — holat, nishon, qoldiq turi ================= */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
              <p className="mb-4 text-sm font-semibold text-slate-800">{t.statusTitle}</p>

              {/* Holat — do'konda ko'rinadimi (mavjud "active" maydoniga bog'langan) */}
              <p className="mb-1.5 text-xs font-medium text-slate-500">{t.statusLabel}</p>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: true })}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${form.active ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {t.active}
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: false })}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${!form.active ? "border-slate-500 bg-slate-100 text-slate-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                >
                  {t.inactive}
                </button>
              </div>

              {/* Nishon — Yangi/Top qo'lda tanlanadi; Chegirma/Qolmagan narx va qoldiqdan avtomatik hisoblanadi */}
              <p className="mb-1.5 text-xs font-medium text-slate-500">{t.badgeLabel}</p>
              <div className="mb-4 space-y-1.5">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <input type="checkbox" checked={form.tag === "new"} onChange={() => setForm({ ...form, tag: form.tag === "new" ? "none" : "new" })} className="rounded" />
                  {t.tagNew}
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <input type="checkbox" checked={form.tag === "bestseller"} onChange={() => setForm({ ...form, tag: form.tag === "bestseller" ? "none" : "bestseller" })} className="rounded" />
                  {t.tagBestseller}
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-sm text-slate-400" title={t.autoHint}>
                  <input type="checkbox" checked={pct > 0} disabled className="rounded" />
                  {t.discountBadge} <span className="text-[10px]">({t.autoHint})</span>
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-sm text-slate-400" title={t.autoHint}>
                  <input type="checkbox" checked={isOut} disabled className="rounded" />
                  {t.outOfStock} <span className="text-[10px]">({t.autoHint})</span>
                </label>
              </div>

              {/* Qoldiq turi */}
              <p className="mb-1.5 text-xs font-medium text-slate-500">{t.stockType}</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: "limited", label: t.limited },
                  { key: "unlimited", label: t.unlimited },
                  { key: "out", label: t.outOfStock },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm({ ...form, stockType: opt.key })}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition ${
                      form.stockType === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
