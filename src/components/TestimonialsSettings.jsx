import React, { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, MessageSquareQuote, ArrowUp, ArrowDown, Eye, EyeOff, Star, Package, ImageOff, Check, X, Clock } from "lucide-react";
import { setItem, updateItem, deleteItem, uploadImage } from "../storage.js";
import { Modal, Field, EmptyState, inputCls, uid, Toggle, pname } from "./ui.jsx";

const EMPTY_FORM = { name: "", text: "", rating: "5", active: true, productId: "", imageUrl: "" };

const T_LOCAL = {
  uz: {
    title: "Mijoz sharhlari", add: "Sharh qo'shish", edit: "Sharhni tahrirlash",
    empty: "Hozircha sharh yo'q", empty_hint: "Mijozlaringizdan olgan haqiqiy fikr-mulohazalarni shu yerga qo'shing.",
    name: "Mijoz ismi", text: "Sharh matni", rating: "Baho (1-5)",
    linkProduct: "Mahsulotga biriktirish (ixtiyoriy)", linkProductNone: "Biriktirilmagan",
    image: "Sharh surati (ixtiyoriy)", uploadBtn: "Rasm tanlang", uploading: "Yuklanmoqda...", removeImage: "Rasmni olib tashlash",
    active: "Faol", inactive: "Faol emas", save: "Saqlash", saving: "Saqlanmoqda...", cancel: "Bekor qilish",
    required: "Ism va sharh matnini kiriting",
    pendingTitle: "Tasdiqlanishi kutilayotgan sharhlar", pendingHint: "Mijozlar xarid qilgan mahsulotlarga qoldirgan sharhlar — tasdiqlangandan so'ng saytda ko'rinadi.",
    customerBadge: "Mijoz yubordi", approve: "Tasdiqlash", reject: "Rad etish",
  },
  ru: {
    title: "Отзывы клиентов", add: "Добавить отзыв", edit: "Редактировать отзыв",
    empty: "Пока нет отзывов", empty_hint: "Добавьте сюда реальные отзывы от ваших клиентов.",
    name: "Имя клиента", text: "Текст отзыва", rating: "Оценка (1-5)",
    linkProduct: "Привязать к товару (опционально)", linkProductNone: "Не привязано",
    image: "Фото отзыва (опционально)", uploadBtn: "Выбрать фото", uploading: "Загрузка...", removeImage: "Удалить фото",
    active: "Активен", inactive: "Не активен", save: "Сохранить", saving: "Сохранение...", cancel: "Отмена",
    required: "Укажите имя и текст отзыва",
    pendingTitle: "Отзывы, ожидающие подтверждения", pendingHint: "Отзывы клиентов о купленных товарах — появятся на сайте после подтверждения.",
    customerBadge: "От клиента", approve: "Подтвердить", reject: "Отклонить",
  },
};

export default function TestimonialsSettings({ lang, testimonials, products }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pending = testimonials.filter((x) => x.status === "pending");
  const sorted = testimonials.filter((x) => x.status !== "pending").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const openAdd = () => { setEditingId(uid()); setForm(EMPTY_FORM); setError(""); setOpen(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name || "", text: item.text || "", rating: String(item.rating || 5), active: item.active !== false, productId: item.productId || "", imageUrl: item.imageUrl || "" });
    setError("");
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditingId(null); setForm(EMPTY_FORM); setError(""); };

  const handleUpload = async (file) => {
    if (!file || !editingId) return;
    setUploading(true);
    try {
      const url = await uploadImage(`testimonials/${editingId}/photo`, file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.text.trim()) { setError(t.required); return; }
    setSaving(true);
    const isNew = !testimonials.some((x) => x.id === editingId);
    await setItem("testimonials", editingId, {
      name: form.name.trim(),
      text: form.text.trim(),
      rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
      active: form.active,
      productId: form.productId || null,
      imageUrl: form.imageUrl || "",
      order: isNew ? testimonials.length : (testimonials.find((x) => x.id === editingId)?.order ?? 0),
    });
    setSaving(false);
    closeModal();
  };

  const remove = async (id) => { await deleteItem("testimonials", id); };
  const toggleActive = async (item) => { await updateItem("testimonials", item.id, { active: !(item.active !== false) }); };
  const approve = async (item) => { await updateItem("testimonials", item.id, { active: true, status: "approved", order: testimonials.length }); };
  const reject = async (item) => { await deleteItem("testimonials", item.id); };
  const move = async (item, direction) => {
    const idx = sorted.findIndex((x) => x.id === item.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      updateItem("testimonials", item.id, { order: swapWith.order ?? 0 }),
      updateItem("testimonials", swapWith.id, { order: item.order ?? 0 }),
    ]);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{t.title}</h2>
        <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus size={16} /> {t.add}
        </button>
      </div>

      {pending.length > 0 && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <Clock size={15} /> {t.pendingTitle} <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">{pending.length}</span>
          </p>
          <p className="mb-3 text-xs text-amber-700/80">{t.pendingHint}</p>
          <div className="space-y-2">
            {pending.map((item) => {
              const p = (products || []).find((x) => x.id === item.productId);
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-white p-3">
                  {item.imageUrl && (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                      <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <span className="flex items-center gap-0.5 text-xs text-amber-500">
                        <Star size={11} className="fill-amber-400" /> {item.rating}
                      </span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{t.customerBadge}</span>
                    </div>
                    <p className="text-xs text-slate-600">{item.text}</p>
                    {p && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600">
                        <Package size={10} /> {pname(p, lang)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => approve(item)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                      <Check size={13} /> {t.approve}
                    </button>
                    <button onClick={() => reject(item)} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-gray-50">
                      <X size={13} /> {t.reject}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="py-10 text-center">
          <EmptyState icon={MessageSquareQuote} text={t.empty} />
          <p className="mx-auto max-w-sm text-xs text-slate-400">{t.empty_hint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
              {item.imageUrl && (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star size={11} className="fill-amber-400" /> {item.rating}
                  </span>
                  {item.source === "customer" && (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{t.customerBadge}</span>
                  )}
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{item.text}</p>
                {item.productId && (() => {
                  const p = (products || []).find((x) => x.id === item.productId);
                  return p ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-600">
                      <Package size={10} /> {pname(p, lang)}
                    </span>
                  ) : null;
                })()}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => move(item, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30"><ArrowUp size={15} /></button>
                <button onClick={() => move(item, 1)} disabled={i === sorted.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30"><ArrowDown size={15} /></button>
                <button onClick={() => toggleActive(item)} className={`rounded-lg p-1.5 ${item.active !== false ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-gray-50"}`}>
                  {item.active !== false ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={15} /></button>
                <button onClick={() => remove(item.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title={editingId && testimonials.some((x) => x.id === editingId) ? t.edit : t.add} onClose={closeModal}>
          <Field label={t.name} error={error}>
            <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t.text}>
            <textarea className={`${inputCls} min-h-[90px] resize-y`} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </Field>
          <Field label={t.rating}>
            <input type="number" min="1" max="5" className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
          </Field>
          <Field label={t.linkProduct}>
            <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">{t.linkProductNone}</option>
              {(products || []).map((p) => (
                <option key={p.id} value={p.id}>{pname(p, lang)}</option>
              ))}
            </select>
          </Field>
          <Field label={t.image}>
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-slate-300">
                {form.imageUrl ? <img src={form.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageOff size={20} />}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
                  {uploading ? t.uploading : t.uploadBtn}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0])} />
                </label>
                {form.imageUrl && (
                  <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: "" }))} className="text-left text-[11px] text-rose-500 hover:underline">
                    {t.removeImage}
                  </button>
                )}
              </div>
            </div>
          </Field>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-xs font-medium text-slate-600">{form.active ? t.active : t.inactive}</span>
            <Toggle checked={form.active} onChange={(v) => setForm({ ...form, active: v })} />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={closeModal} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.cancel}</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.saving : t.save}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
