import React, { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, Send } from "lucide-react";
import { subscribeCollection, setItem } from "../storage.js";
import { Field } from "./ui.jsx";

const T_LOCAL = {
  uz: {
    title: "Telegram bot",
    welcomeTitle: "Xush kelibsiz xabari",
    welcomeHint: "Mijoz botga birinchi marta kirib \"/start\" bosganda avtomatik yuboriladigan xabar matni.",
    welcomeLabel: "Xabar matni",
    welcomePh: "Masalan: Assalomu alaykum va CASME'ga xush kelibsiz! ...",
    save: "Saqlash", saving: "Saqlanmoqda...", saved: "Saqlandi",
  },
  ru: {
    title: "Telegram-бот",
    welcomeTitle: "Приветственное сообщение",
    welcomeHint: "Текст, который автоматически отправляется, когда клиент впервые открывает бота и нажимает \"/start\".",
    welcomeLabel: "Текст сообщения",
    welcomePh: "Например: Здравствуйте, добро пожаловать в CASME! ...",
    save: "Сохранить", saving: "Сохранение...", saved: "Сохранено",
  },
};

const DEFAULT_WELCOME =
  "👋 Assalomu alaykum va CASME'ga xush kelibsiz!\n\nBiz orqali original Koreya kosmetikasini qulay narxlarda xarid qilishingiz mumkin.\n\nQuyidagi tugma orqali do'konni oching va xaridni boshlang! 🛍️";

export default function TelegramSettings({ lang }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [message, setMessage] = useState(DEFAULT_WELCOME);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = subscribeCollection("settings", (list) => {
      const doc = list.find((x) => x.id === "telegramWelcome");
      if (doc?.message && !loaded) setMessage(doc.message);
      setLoaded(true);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setSaving(true);
    await setItem("settings", "telegramWelcome", { message: message.trim() || DEFAULT_WELCOME });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <Send size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t.welcomeTitle}</h3>
            <p className="text-xs text-slate-400">{t.welcomeHint}</p>
          </div>
        </div>

        <div className="mt-3">
          <Field label={t.welcomeLabel}>
            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t.welcomePh}
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            />
          </Field>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-1 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
          {saving ? t.saving : saved ? t.saved : t.save}
        </button>
      </div>
    </div>
  );
}
