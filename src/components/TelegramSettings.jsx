import React, { useState, useEffect, useMemo } from "react";
import { Save, Loader2, CheckCircle2, Send, Users, Search } from "lucide-react";
import { subscribeCollection, setItem } from "../storage.js";
import { Field, EmptyState } from "./ui.jsx";

const T_LOCAL = {
  uz: {
    title: "Telegram bot",
    welcomeTitle: "Xush kelibsiz xabari",
    welcomeHint: "Mijoz botga birinchi marta kirib \"/start\" bosganda avtomatik yuboriladigan xabar matni.",
    welcomeLabel: "Xabar matni",
    welcomePh: "Masalan: Assalomu alaykum va CASME'ga xush kelibsiz! ...",
    save: "Saqlash", saving: "Saqlanmoqda...", saved: "Saqlandi",

    startsTitle: "Botni ishga tushirganlar",
    startsHint: "Botga \"/start\" bosgan barcha foydalanuvchilar ro'yxati.",
    startsSearchPh: "Ism yoki username bo'yicha izlash...",
    startsEmpty: "Hozircha hech kim start bosmagan",
    colName: "Ism", colUsername: "Username", colFirst: "Birinchi marta", colLast: "Oxirgi marta", colCount: "Necha marta",
    startsCountSuffix: "kishi",
  },
  ru: {
    title: "Telegram-бот",
    welcomeTitle: "Приветственное сообщение",
    welcomeHint: "Текст, который автоматически отправляется, когда клиент впервые открывает бота и нажимает \"/start\".",
    welcomeLabel: "Текст сообщения",
    welcomePh: "Например: Здравствуйте, добро пожаловать в CASME! ...",
    save: "Сохранить", saving: "Сохранение...", saved: "Сохранено",

    startsTitle: "Запустившие бота",
    startsHint: "Список всех пользователей, нажавших \"/start\".",
    startsSearchPh: "Поиск по имени или username...",
    startsEmpty: "Пока никто не нажал start",
    colName: "Имя", colUsername: "Username", colFirst: "Первый раз", colLast: "Последний раз", colCount: "Сколько раз",
    startsCountSuffix: "человек",
  },
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

const DEFAULT_WELCOME =
  "👋 Assalomu alaykum va CASME'ga xush kelibsiz!\n\nBiz orqali original Koreya kosmetikasini qulay narxlarda xarid qilishingiz mumkin.\n\nQuyidagi tugma orqali do'konni oching va xaridni boshlang! 🛍️";

export default function TelegramSettings({ lang }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [message, setMessage] = useState(DEFAULT_WELCOME);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [starts, setStarts] = useState([]);
  const [startsSearch, setStartsSearch] = useState("");

  useEffect(() => {
    const unsub = subscribeCollection("settings", (list) => {
      const doc = list.find((x) => x.id === "telegramWelcome");
      if (doc?.message && !loaded) setMessage(doc.message);
      setLoaded(true);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = subscribeCollection("telegramStarts", setStarts);
    return unsub;
  }, []);

  const save = async () => {
    setSaving(true);
    await setItem("settings", "telegramWelcome", { message: message.trim() || DEFAULT_WELCOME });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const filteredStarts = useMemo(() => {
    const q = startsSearch.trim().toLowerCase();
    const list = [...starts].sort((a, b) => (b.lastStartAt || "").localeCompare(a.lastStartAt || ""));
    if (!q) return list;
    return list.filter((s) =>
      `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase().includes(q) ||
      (s.username || "").toLowerCase().includes(q)
    );
  }, [starts, startsSearch]);

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

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <Users size={17} />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {t.startsTitle} {starts.length > 0 && <span className="text-slate-400">({starts.length} {t.startsCountSuffix})</span>}
              </h3>
              <p className="text-xs text-slate-400">{t.startsHint}</p>
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={startsSearch}
              onChange={(e) => setStartsSearch(e.target.value)}
              placeholder={t.startsSearchPh}
              className="w-56 rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {filteredStarts.length === 0 ? (
          <EmptyState icon={Users} text={t.startsEmpty} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">{t.colName}</th>
                  <th className="py-2 pr-3">{t.colUsername}</th>
                  <th className="py-2 pr-3">{t.colFirst}</th>
                  <th className="py-2 pr-3">{t.colLast}</th>
                  <th className="py-2 pr-3 text-right">{t.colCount}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStarts.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-3 font-medium text-slate-700">
                      {[s.firstName, s.lastName].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="py-2 pr-3 text-slate-500">
                      {s.username ? (
                        <a href={`https://t.me/${s.username}`} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                          @{s.username}
                        </a>
                      ) : "—"}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-500">{fmtDate(s.firstStartAt)}</td>
                    <td className="py-2 pr-3 text-xs text-slate-500">{fmtDate(s.lastStartAt)}</td>
                    <td className="py-2 pr-3 text-right text-slate-600">{s.startCount || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
