import React, { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, MessageSquareQuote, ArrowUp, ArrowDown, Eye, EyeOff, Star } from "lucide-react";
import { setItem, updateItem, deleteItem } from "../storage.js";
import { Modal, Field, EmptyState, inputCls, uid, Toggle } from "./ui.jsx";

const EMPTY_FORM = { name: "", text: "", rating: "5", active: true };

const T_LOCAL = {
  uz: {
    title: "Mijoz sharhlari", add: "Sharh qo'shish", edit: "Sharhni tahrirlash",
    empty: "Hozircha sharh yo'q", empty_hint: "Mijozlaringizdan olgan haqiqiy fikr-mulohazalarni shu yerga qo'shing.",
    name: "Mijoz ismi", text: "Sharh matni", rating: "Baho (1-5)",
    active: "Faol", inactive: "Faol emas", save: "Saqlash", saving: "Saqlanmoqda...", cancel: "Bekor qilish",
    required: "Ism va sharh matnini kiriting",
  },
  ru: {
    title: "Отзывы клиентов", add: "Добавить отзыв", edit: "Редактировать отзыв",
    empty: "Пока нет отзывов", empty_hint: "Добавьте сюда реальные отзывы от ваших клиентов.",
    name: "Имя клиента", text: "Текст отзыва", rating: "Оценка (1-5)",
    active: "Активен", inactive: "Не активен", save: "Сохранить", saving: "Сохранение...", cancel: "Отмена",
    required: "Укажите имя и текст отзыва",
  },
};

export default function TestimonialsSettings({ lang, testimonials }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = [...testimonials].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const openAdd = () => { setEditingId(uid()); setForm(EMPTY_FORM); setError(""); setOpen(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name || "", text: item.text || "", rating: String(item.rating || 5), active: item.active !== false });
    setError("");
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditingId(null); setForm(EMPTY_FORM); setError(""); };

  const submit = async () => {
    if (!form.name.trim() || !form.text.trim()) { setError(t.required); return; }
    setSaving(true);
    const isNew = !testimonials.some((x) => x.id === editingId);
    await setItem("testimonials", editingId, {
      name: form.name.trim(),
      text: form.text.trim(),
      rating: Math.min(5, Math.max(1, Number(form.rating) || 5)),
      active: form.active,
      order: isNew ? testimonials.length : (testimonials.find((x) => x.id === editingId)?.order ?? 0),
    });
    setSaving(false);
    closeModal();
  };

  const remove = async (id) => { await deleteItem("testimonials", id); };
  const toggleActive = async (item) => { await updateItem("testimonials", item.id, { active: !(item.active !== false) }); };
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

      {sorted.length === 0 ? (
        <div className="py-10 text-center">
          <EmptyState icon={MessageSquareQuote} text={t.empty} />
          <p className="mx-auto max-w-sm text-xs text-slate-400">{t.empty_hint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <span className="flex items-center gap-0.5 text-xs text-amber-500">
                    <Star size={11} className="fill-amber-400" /> {item.rating}
                  </span>
                </div>
                <p className="line-clamp-2 text-xs text-slate-500">{item.text}</p>
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
