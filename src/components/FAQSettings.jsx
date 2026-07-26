import React, { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Save, HelpCircle, ArrowUp, ArrowDown, Eye, EyeOff } from "lucide-react";
import { setItem, updateItem, deleteItem } from "../storage.js";
import { Modal, Field, EmptyState, inputCls, uid } from "./ui.jsx";

const EMPTY_FORM = { question: "", answer: "", active: true };

const T_LOCAL = {
  uz: {
    title: "Savol-javob (FAQ)", add: "Savol qo'shish", edit: "Savolni tahrirlash",
    empty: "Hozircha savol yo'q", empty_hint: "Mijozlar tez-tez so'raydigan savollarni shu yerga qo'shing.",
    question: "Savol", answer: "Javob",
    active: "Faol", inactive: "Faol emas", save: "Saqlash", saving: "Saqlanmoqda...", cancel: "Bekor qilish",
    required: "Savol va javobni kiriting",
  },
  ru: {
    title: "Вопрос-ответ (FAQ)", add: "Добавить вопрос", edit: "Редактировать вопрос",
    empty: "Пока нет вопросов", empty_hint: "Добавьте сюда часто задаваемые вопросы клиентов.",
    question: "Вопрос", answer: "Ответ",
    active: "Активен", inactive: "Не активен", save: "Сохранить", saving: "Сохранение...", cancel: "Отмена",
    required: "Укажите вопрос и ответ",
  },
};

export default function FAQSettings({ lang, faqs }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = [...faqs].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const openAdd = () => { setEditingId(uid()); setForm(EMPTY_FORM); setError(""); setOpen(true); };
  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ question: item.question || "", answer: item.answer || "", active: item.active !== false });
    setError("");
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditingId(null); setForm(EMPTY_FORM); setError(""); };

  const submit = async () => {
    if (!form.question.trim() || !form.answer.trim()) { setError(t.required); return; }
    setSaving(true);
    const isNew = !faqs.some((x) => x.id === editingId);
    await setItem("faqs", editingId, {
      question: form.question.trim(),
      answer: form.answer.trim(),
      active: form.active,
      order: isNew ? faqs.length : (faqs.find((x) => x.id === editingId)?.order ?? 0),
    });
    setSaving(false);
    closeModal();
  };

  const remove = async (id) => { await deleteItem("faqs", id); };
  const toggleActive = async (item) => { await updateItem("faqs", item.id, { active: !(item.active !== false) }); };
  const move = async (item, direction) => {
    const idx = sorted.findIndex((x) => x.id === item.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      updateItem("faqs", item.id, { order: swapWith.order ?? 0 }),
      updateItem("faqs", swapWith.id, { order: item.order ?? 0 }),
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
          <EmptyState icon={HelpCircle} text={t.empty} />
          <p className="mx-auto max-w-sm text-xs text-slate-400">{t.empty_hint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item, i) => (
            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.question}</p>
                <p className="line-clamp-2 text-xs text-slate-500">{item.answer}</p>
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
        <Modal title={editingId && faqs.some((x) => x.id === editingId) ? t.edit : t.add} onClose={closeModal}>
          <Field label={t.question} error={error}>
            <input className={inputCls} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </Field>
          <Field label={t.answer}>
            <textarea className={`${inputCls} min-h-[100px] resize-y`} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
          </Field>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
            <span className="text-xs font-medium text-slate-600">{form.active ? t.active : t.inactive}</span>
            <button type="button" onClick={() => setForm({ ...form, active: !form.active })} className={`relative h-6 w-11 rounded-full transition ${form.active ? "bg-emerald-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
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
