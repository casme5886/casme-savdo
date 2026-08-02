import React, { useState } from "react";
import { X, Plus, Loader2, Save, Package, Lock } from "lucide-react";
import { setItem, deleteItem, uploadImage, deleteStorageFile, addItem } from "../storage.js";
import { Field, inputCls, uid, fmtMoney, discountPct } from "./ui.jsx";

const MAX_IMAGES = 10;

const EMPTY_FORM = {
  nameUz: "", nameRu: "", descriptionUz: "", descriptionRu: "",
  brand: "", category: "", price: "", oldPrice: "", costPrice: "", rating: "", reviewCount: "", tag: "none", stockType: "limited", stock: "",
  imageUrls: [],
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
    images: "Mahsulot rasmlari", imagesHint: "Birinchi rasm — asosiy rasm bo'ladi, u mahsulot kartasida ko'rinadi.",
    addImage: "Rasm qo'shish", mainBadge: "Asosiy", uploading: "Yuklanmoqda...",
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
    discount: "chegirma",
    stockType: "Qoldiq turi", limited: "Soni bilan", unlimited: "Cheksiz", outOfStock: "Qolmagan",
    stock: "Qoldiq soni",
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
    images: "Изображения товара", imagesHint: "Первое изображение — главное, оно показывается на карточке товара.",
    addImage: "Добавить фото", mainBadge: "Главное", uploading: "Загрузка...",
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
    discount: "скидка",
    stockType: "Тип остатка", limited: "С количеством", unlimited: "Неограничено", outOfStock: "Нет в наличии",
    stock: "Количество",
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
        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">{isEdit ? t.editTitle : t.addTitle}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {/* ---------- Rasmlar ---------- */}
          <div className="mb-6">
            <p className="mb-1 text-sm font-semibold text-slate-700">{t.images} ({form.imageUrls.length}/{MAX_IMAGES})</p>
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
                  {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={22} />}
                  <span className="px-1 text-center text-[11px] font-medium leading-tight">{uploading ? t.uploading : t.addImage}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => { handleImageUpload(e.target.files?.[0]); e.target.value = ""; }} />
                </label>
              )}
            </div>
            {form.imageUrls.length === 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Package size={14} /> <span>Rasm qo'shilmasa, kartada ikonka ko'rinadi</span>
              </div>
            )}
          </div>

          {/* ---------- Nomi (uz/ru) ---------- */}
          <div className="mb-1 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label={t.nameUz} error={error && !form.nameUz && !form.nameRu ? error : ""}>
              <input className={inputCls} value={form.nameUz} onChange={(e) => setForm({ ...form, nameUz: e.target.value })} />
            </Field>
            <Field label={t.nameRu}>
              <input className={inputCls} value={form.nameRu} onChange={(e) => setForm({ ...form, nameRu: e.target.value })} />
            </Field>
          </div>

          {/* ---------- Tavsif (uz/ru) — katta textarea ---------- */}
          <Field label={t.descUz}>
            <textarea
              className={`${inputCls} min-h-[110px] resize-y`}
              value={form.descriptionUz}
              onChange={(e) => setForm({ ...form, descriptionUz: e.target.value })}
              placeholder={t.descPh}
            />
          </Field>
          <Field label={t.descRu}>
            <textarea
              className={`${inputCls} min-h-[110px] resize-y`}
              value={form.descriptionRu}
              onChange={(e) => setForm({ ...form, descriptionRu: e.target.value })}
              placeholder={t.descPh}
            />
          </Field>

          {/* ---------- Brend ---------- */}
          <Field label={t.brand}>
            <input
              className={inputCls}
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              list="product-form-brands"
              placeholder={t.brandPh}
            />
            <datalist id="product-form-brands">
              {[...(brands || [])]
                .sort((a, b) => (a.name || "").localeCompare(b.name || "", "uz"))
                .map((b) => <option key={b.id} value={b.name} />)}
            </datalist>
          </Field>

          {/* ---------- Kategoriya ---------- */}
          <Field label={t.category}>
            <input
              className={inputCls}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              list="product-form-categories"
              placeholder={t.categoryPh}
            />
            <datalist id="product-form-categories">
              {[...(categories || [])]
                .sort((a, b) => (a.name || "").localeCompare(b.name || "", "uz"))
                .map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </Field>

          {/* ---------- Narx / eski narx / chegirma ---------- */}
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

          <Field label={t.costPrice}>
            <input type="number" className={inputCls} value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} placeholder={t.costPriceHint} />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
              <Lock size={11} /> {t.costPriceHint}
            </p>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.rating}>
              <input type="number" step="0.1" min="0" max="5" className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} placeholder={t.ratingHint} />
            </Field>
            <Field label={t.reviewCount}>
              <input type="number" min="0" className={inputCls} value={form.reviewCount} onChange={(e) => setForm({ ...form, reviewCount: e.target.value })} placeholder={t.reviewCountHint} />
            </Field>
          </div>

          <Field label={t.tag}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "none", label: t.tagNone },
                { key: "new", label: t.tagNew },
                { key: "bestseller", label: t.tagBestseller },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm({ ...form, tag: opt.key })}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    form.tag === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {/* ---------- Qoldiq turi ---------- */}
          <Field label={t.stockType}>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "limited", label: t.limited },
                { key: "unlimited", label: t.unlimited },
                { key: "out", label: t.outOfStock },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm({ ...form, stockType: opt.key })}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                    form.stockType === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          {form.stockType === "limited" && (
            <Field label={t.stock} error={error && form.stock === "" ? error : ""}>
              <input type="number" className={inputCls} value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </Field>
          )}

          {/* ---------- Qo'shimcha xususiyatlar (do'kondagi "Filtrlar" oynasi uchun) ---------- */}
          <div className="mt-2 border-t border-gray-100 pt-4">
            <p className="mb-1 text-sm font-semibold text-slate-700">{t.filterFieldsTitle}</p>
            <p className="mb-3 text-xs text-slate-400">{t.filterFieldsHint}</p>
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

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.cancel}</button>
          <button
            onClick={submit}
            disabled={saving || uploading}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
