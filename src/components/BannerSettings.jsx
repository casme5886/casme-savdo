import React, { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, Loader2, Save, ImageOff, ArrowUp, ArrowDown, Eye, EyeOff,
  AlertTriangle, MousePointerClick, Search, Package, ChevronRight,
} from "lucide-react";
import { setItem, updateItem, deleteItem, uploadImage } from "../storage.js";
import { Modal, Field, EmptyState, inputCls, uid, fmtMoney, pname } from "./ui.jsx";

const EMPTY_FORM = {
  badge: "", title: "", subtitle: "", bottomText: "", minOrder: "",
  buttonText: "", buttonLink: "", desktopImage: "", mobileImage: "", active: true,
  startDate: "", endDate: "", linkedProductIds: [],
  desktopImagePosition: "center", mobileImagePosition: "center",
};

const TEMPLATES = [
  { key: "sale", uz: { badge: "Chegirma", title: "Barcha mahsulotlarga chegirma", subtitle: "Cheklangan vaqt taklifi", buttonText: "Xarid qilish" }, ru: { badge: "Скидка", title: "Скидки на все товары", subtitle: "Ограниченное предложение", buttonText: "Купить" } },
  { key: "new", uz: { badge: "Yangi", title: "Yangi kolleksiya keldi", subtitle: "Birinchi bo'lib ko'ring", buttonText: "Ko'rish" }, ru: { badge: "Новинка", title: "Новая коллекция уже здесь", subtitle: "Посмотрите первыми", buttonText: "Смотреть" } },
  { key: "delivery", uz: { badge: "Bepul", title: "Bepul yetkazib berish", subtitle: "Belgilangan summadan yuqori xaridga", buttonText: "Xarid qilish" }, ru: { badge: "Бесплатно", title: "Бесплатная доставка", subtitle: "При заказе от указанной суммы", buttonText: "Купить" } },
];

const T_LOCAL = {
  uz: {
    title: "Banner", add: "Banner qo'shish", edit: "Bannerni tahrirlash", empty: "Hozircha banner yo'q",
    empty_hint: "Banner qo'shmasangiz, saytda standart (yashil) banner ko'rinadi.",
    badge: "Kichik badge (masalan: Chegirma)", bannerTitle: "Asosiy sarlavha", subtitle: "Ikkinchi matn",
    bottomText: "Pastdagi matn", minOrder: "Minimal buyurtma summasi (ixtiyoriy)",
    buttonText: "Tugma matni (ixtiyoriy)", buttonLink: "Tugma havolasi (ixtiyoriy)",
    desktop: "Desktop banner (tavsiya: 1920×600)", mobile: "Mobil banner (tavsiya: 1080×720)",
    uploadHint: "Rasm tanlang", uploading: "Yuklanmoqda...", noImage: "Rasm yo'q",
    active: "Faol", inactive: "Faol emas", save: "Saqlash", saving: "Saqlanmoqda...", cancel: "Bekor qilish",
    required: "Kamida sarlavha yoki rasm kiriting",
    limitReached: "Bittadan ortiq banner qo'sha olmaysiz — maksimal 10 ta",
    ratioWarning: "Diqqat: bu rasmning o'lchami tavsiya etilganidan farq qiladi",
    ratioWarningHint: "Pastdagi \"Rasmni tekislash\" tugmalari orqali qaysi qismi ko'rinishini tanlashingiz mumkin.",
    templates: "Tayyor shablon", preview: "Ko'rinishni ko'rish", hidePreview: "Yashirish",
    schedule: "Ko'rsatish muddati (ixtiyoriy)", startDate: "Boshlanish sanasi", endDate: "Tugash sanasi",
    scheduleHint: "Bo'sh qoldirsangiz — muddatsiz ko'rsatiladi",
    clicks: "bosildi",
    linkProducts: "Mahsulot biriktirish (ixtiyoriy)",
    linkProductsHint: "Biriktirilgan mahsulotlar banner bosilganda avtomatik savatga qo'shiladi",
    searchProducts: "Mahsulot izlash...", selectedCount: "ta tanlandi",
    imagePosition: "Rasmni tekislash", posTop: "Yuqori", posCenter: "Markaz", posBottom: "Past",
    imagePositionHint: "Rasm to'liq sig'may qolsa, qaysi qismi ko'rinishini tanlang",
  },
  ru: {
    title: "Баннер", add: "Добавить баннер", edit: "Редактировать баннер", empty: "Пока нет баннеров",
    empty_hint: "Если не добавите баннер, на сайте будет стандартный (зелёный) баннер.",
    badge: "Значок (например: Скидка)", bannerTitle: "Основной заголовок", subtitle: "Второй текст",
    bottomText: "Нижний текст", minOrder: "Минимальная сумма заказа (опционально)",
    buttonText: "Текст кнопки (опционально)", buttonLink: "Ссылка кнопки (опционально)",
    desktop: "Десктоп баннер (рекомендуется: 1920×600)", mobile: "Мобильный баннер (рекомендуется: 1080×720)",
    uploadHint: "Выберите изображение", uploading: "Загрузка...", noImage: "Нет изображения",
    active: "Активен", inactive: "Не активен", save: "Сохранить", saving: "Сохранение...", cancel: "Отмена",
    required: "Укажите хотя бы заголовок или изображение",
    limitReached: "Больше баннеров добавить нельзя — максимум 10",
    ratioWarning: "Внимание: размер этого изображения отличается от рекомендуемого",
    ratioWarningHint: "С помощью кнопок \"Выравнивание изображения\" ниже вы можете выбрать, какая часть будет видна.",
    templates: "Готовый шаблон", preview: "Посмотреть", hidePreview: "Скрыть",
    schedule: "Срок показа (опционально)", startDate: "Дата начала", endDate: "Дата окончания",
    scheduleHint: "Если оставить пустым — показывается бессрочно",
    clicks: "кликов",
    linkProducts: "Привязать товары (опционально)",
    linkProductsHint: "Привязанные товары автоматически добавятся в корзину при клике на баннер",
    searchProducts: "Поиск товара...", selectedCount: "выбрано",
    imagePosition: "Выравнивание изображения", posTop: "Верх", posCenter: "Центр", posBottom: "Низ",
    imagePositionHint: "Если изображение не помещается полностью, выберите какая часть будет видна",
  },
};

/** Rasmning haqiqiy o'lchamini tekshirib, tavsiya etilgan nisbatga mos-emasligini aniqlaydi. */
function checkImageRatio(url, targetRatio) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      const diff = Math.abs(ratio - targetRatio) / targetRatio;
      resolve({ mismatch: diff > 0.05, width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => resolve({ mismatch: false, width: 0, height: 0 });
    img.src = url;
  });
}

export default function BannerSettings({ lang, banners, products }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [desktopWarning, setDesktopWarning] = useState(null);
  const [mobileWarning, setMobileWarning] = useState(null);
  const [productSearch, setProductSearch] = useState("");

  const sorted = [...banners].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const openAdd = () => {
    if (banners.length >= 10) return;
    setEditingId(uid());
    setForm(EMPTY_FORM);
    setError("");
    setDesktopWarning(null);
    setMobileWarning(null);
    setOpen(true);
  };

  const openEdit = (b) => {
    setEditingId(b.id);
    setForm({
      badge: b.badge || "", title: b.title || "", subtitle: b.subtitle || "",
      bottomText: b.bottomText || "", minOrder: b.minOrder ? String(b.minOrder) : "",
      buttonText: b.buttonText || "", buttonLink: b.buttonLink || "",
      desktopImage: b.desktopImage || "", mobileImage: b.mobileImage || "",
      active: b.active !== false,
      startDate: b.startDate || "", endDate: b.endDate || "",
      linkedProductIds: b.linkedProductIds || [],
      desktopImagePosition: b.desktopImagePosition || "center",
      mobileImagePosition: b.mobileImagePosition || "center",
    });
    setError("");
    setDesktopWarning(null);
    setMobileWarning(null);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError("");
    setProductSearch("");
  };

  const applyTemplate = (tpl) => {
    const content = tpl[lang] || tpl.uz;
    setForm((f) => ({ ...f, ...content }));
  };

  const handleUpload = async (kind, file) => {
    if (!file || !editingId) return;
    const setUploading = kind === "desktop" ? setUploadingDesktop : setUploadingMobile;
    const setWarning = kind === "desktop" ? setDesktopWarning : setMobileWarning;
    setUploading(true);
    setWarning(null);
    try {
      const url = await uploadImage(`banners/${editingId}/banner-${kind}`, file);
      setForm((f) => ({ ...f, [kind === "desktop" ? "desktopImage" : "mobileImage"]: url }));
      const targetRatio = kind === "desktop" ? 1920 / 600 : 1080 / 720;
      const result = await checkImageRatio(url, targetRatio);
      setWarning(result.mismatch ? { width: result.width, height: result.height } : null);
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.title.trim() && !form.desktopImage && !form.mobileImage) {
      setError(t.required);
      return;
    }
    setSaving(true);

    const isNew = !banners.some((b) => b.id === editingId);
    const data = {
      badge: form.badge.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      bottomText: form.bottomText.trim(),
      minOrder: Number(form.minOrder) || 0,
      buttonText: form.buttonText.trim(),
      buttonLink: form.buttonLink.trim(),
      desktopImage: form.desktopImage,
      mobileImage: form.mobileImage,
      active: form.active,
      startDate: form.startDate || "",
      endDate: form.endDate || "",
      linkedProductIds: form.linkedProductIds,
      desktopImagePosition: form.desktopImagePosition,
      mobileImagePosition: form.mobileImagePosition,
      order: isNew ? banners.length : (banners.find((b) => b.id === editingId)?.order ?? 0),
      clicks: isNew ? 0 : (banners.find((b) => b.id === editingId)?.clicks ?? 0),
    };

    await setItem("banners", editingId, data);
    setSaving(false);
    closeModal();
  };

  const remove = async (id) => {
    await deleteItem("banners", id);
  };

  const toggleActive = async (b) => {
    await updateItem("banners", b.id, { active: !(b.active !== false) });
  };

  const move = async (b, direction) => {
    const idx = sorted.findIndex((x) => x.id === b.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      updateItem("banners", b.id, { order: swapWith.order ?? 0 }),
      updateItem("banners", swapWith.id, { order: b.order ?? 0 }),
    ]);
  };

  const toggleLinkedProduct = (productId) => {
    setForm((f) => {
      const has = f.linkedProductIds.includes(productId);
      return { ...f, linkedProductIds: has ? f.linkedProductIds.filter((id) => id !== productId) : [...f.linkedProductIds, productId] };
    });
  };

  const filteredProducts = useMemo(
    () => (products || []).filter((p) => pname(p, lang).toLowerCase().includes(productSearch.toLowerCase())),
    [products, productSearch, lang]
  );

  const MAX_BANNERS = 10;
  const limitReached = banners.length >= MAX_BANNERS;

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">{t.title}</h2>
          <p className="text-xs text-slate-400">{banners.length} / {MAX_BANNERS}</p>
        </div>
        <button
          onClick={openAdd}
          disabled={limitReached}
          title={limitReached ? t.limitReached : undefined}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          <Plus size={16} /> {t.add}
        </button>
      </div>
      {limitReached && <p className="mb-3 text-xs text-amber-600">{t.limitReached}</p>}

      {sorted.length === 0 ? (
        <div className="py-10 text-center">
          <EmptyState icon={ImageOff} text={t.empty} />
          <p className="mx-auto max-w-sm text-xs text-slate-400">{t.empty_hint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((b, i) => (
            <div key={b.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <div className="flex h-14 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                {b.desktopImage || b.mobileImage ? (
                  <img src={b.desktopImage || b.mobileImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageOff size={20} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{b.title || "—"}</p>
                <p className="truncate text-xs text-slate-400">{b.subtitle || b.badge || "—"}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1"><MousePointerClick size={11} /> {b.clicks || 0} {t.clicks}</span>
                  {(b.startDate || b.endDate) && (
                    <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-600">{b.startDate || "…"} → {b.endDate || "…"}</span>
                  )}
                  {b.linkedProductIds?.length > 0 && (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-600">{b.linkedProductIds.length} {t.selectedCount}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => move(b, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30">
                  <ArrowUp size={15} />
                </button>
                <button onClick={() => move(b, 1)} disabled={i === sorted.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30">
                  <ArrowDown size={15} />
                </button>
                <button onClick={() => toggleActive(b)} className={`rounded-lg p-1.5 ${b.active !== false ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-gray-50"}`}>
                  {b.active !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                  <Pencil size={15} />
                </button>
                <button onClick={() => remove(b.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title={editingId && banners.some((b) => b.id === editingId) ? t.edit : t.add} onClose={closeModal}>
          {/* Tayyor shablonlar */}
          <div className="mb-4">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.templates}</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-gray-50"
                >
                  {(tpl[lang] || tpl.uz).badge}
                </button>
              ))}
            </div>
          </div>

          <Field label={t.badge}>
            <input className={inputCls} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
          </Field>
          <Field label={t.bannerTitle} error={error}>
            <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label={t.subtitle}>
            <input className={inputCls} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </Field>
          <Field label={t.bottomText}>
            <input className={inputCls} value={form.bottomText} onChange={(e) => setForm({ ...form, bottomText: e.target.value })} />
          </Field>
          <Field label={t.minOrder}>
            <input type="number" className={inputCls} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
          </Field>

          <div className="mb-3 grid grid-cols-2 gap-2">
            <Field label={t.buttonText}>
              <input className={inputCls} value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} />
            </Field>
            <Field label={t.buttonLink}>
              <input className={inputCls} value={form.buttonLink} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} placeholder="https://..." />
            </Field>
          </div>

          {/* Desktop banner */}
          <Field label={t.desktop}>
            <div className="mb-2 w-full overflow-hidden rounded-lg bg-gray-50" style={{ aspectRatio: "1920 / 600" }}>
              {form.desktopImage ? (
                <img src={form.desktopImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: form.desktopImagePosition }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs text-slate-400">{t.noImage}</span>
                </div>
              )}
            </div>
            {desktopWarning && (
              <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{t.ratioWarning} ({desktopWarning.width}×{desktopWarning.height}). {t.ratioWarningHint}</span>
              </p>
            )}
            {form.desktopImage && (
              <div className="mb-2">
                <p className="mb-1 text-[11px] text-slate-400">{t.imagePositionHint}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: "top", label: t.posTop },
                    { key: "center", label: t.posCenter },
                    { key: "bottom", label: t.posBottom },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm({ ...form, desktopImagePosition: opt.key })}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                        form.desktopImagePosition === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
              {uploadingDesktop ? <Loader2 size={14} className="animate-spin" /> : null}
              {uploadingDesktop ? t.uploading : t.uploadHint}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingDesktop}
                onChange={(e) => handleUpload("desktop", e.target.files?.[0])} />
            </label>
          </Field>

          {/* Mobile banner */}
          <Field label={t.mobile}>
            <div className="mb-2 w-full max-w-[220px] overflow-hidden rounded-lg bg-gray-50" style={{ aspectRatio: "1080 / 720" }}>
              {form.mobileImage ? (
                <img src={form.mobileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: form.mobileImagePosition }} />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-xs text-slate-400">{t.noImage}</span>
                </div>
              )}
            </div>
            {mobileWarning && (
              <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{t.ratioWarning} ({mobileWarning.width}×{mobileWarning.height})</span>
              </p>
            )}
            {form.mobileImage && (
              <div className="mb-2">
                <p className="mb-1 text-[11px] text-slate-400">{t.imagePositionHint}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: "top", label: t.posTop },
                    { key: "center", label: t.posCenter },
                    { key: "bottom", label: t.posBottom },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm({ ...form, mobileImagePosition: opt.key })}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                        form.mobileImagePosition === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
              {uploadingMobile ? <Loader2 size={14} className="animate-spin" /> : null}
              {uploadingMobile ? t.uploading : t.uploadHint}
              <input type="file" accept="image/*" className="hidden" disabled={uploadingMobile}
                onChange={(e) => handleUpload("mobile", e.target.files?.[0])} />
            </label>
          </Field>

          {/* Ko'rsatish muddati */}
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.schedule}</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder={t.startDate} />
              <input type="date" className={inputCls} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} placeholder={t.endDate} />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{t.scheduleHint}</p>
          </div>

          {/* Mahsulot biriktirish */}
          <div className="mb-3 rounded-lg border border-gray-100 p-3">
            <p className="mb-1 text-xs font-medium text-slate-600">{t.linkProducts}</p>
            <p className="mb-2 text-[11px] text-slate-400">{t.linkProductsHint}</p>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className={`${inputCls} pl-8 text-xs`}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={t.searchProducts}
              />
            </div>
            {form.linkedProductIds.length > 0 && (
              <p className="mb-2 text-[11px] font-medium text-emerald-600">{form.linkedProductIds.length} {t.selectedCount}</p>
            )}
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {filteredProducts.map((p) => {
                const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                const checked = form.linkedProductIds.includes(p.id);
                return (
                  <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-xs ${checked ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggleLinkedProduct(p.id)} className="rounded" />
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 text-slate-300">
                      {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Package size={12} />}
                    </div>
                    <span className="flex-1 truncate">{pname(p, lang)}</span>
                    <span className="shrink-0 text-slate-400">{fmtMoney(p.price)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-xs font-medium text-slate-600">{form.active ? t.active : t.inactive}</span>
            <button
              type="button"
              onClick={() => setForm({ ...form, active: !form.active })}
              className={`relative h-6 w-11 rounded-full transition ${form.active ? "bg-emerald-600" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={closeModal} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.cancel}</button>
            <button onClick={submit} disabled={saving || uploadingDesktop || uploadingMobile} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
