import React, { useState, useEffect, useMemo, useRef } from "react";
import { Save, Loader2, CheckCircle2, Send, Users, Search, MessageCircle } from "lucide-react";
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

    chatTitle: "Chat",
    chatHint: "Mijozlar botga yozgan xabarlar — bu yerdan ularga to'g'ridan-to'g'ri javob yozishingiz mumkin.",
    chatSearchPh: "Ism yoki username bo'yicha izlash...",
    chatListEmpty: "Hozircha suhbat yo'q",
    chatSelectHint: "Suhbatni ko'rish uchun chapdan mijozni tanlang",
    chatNoMessages: "Hali xabar yo'q",
    chatNoMessagesShort: "Xabar yo'q",
    chatInputPh: "Xabar yozing...",
    chatBotLabel: "Bot",
    chatAdminLabel: "Siz",
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

    chatTitle: "Чат",
    chatHint: "Сообщения, которые клиенты написали боту — отсюда можно отвечать им напрямую.",
    chatSearchPh: "Поиск по имени или username...",
    chatListEmpty: "Пока нет переписок",
    chatSelectHint: "Выберите клиента слева, чтобы увидеть переписку",
    chatNoMessages: "Пока нет сообщений",
    chatNoMessagesShort: "Нет сообщений",
    chatInputPh: "Напишите сообщение...",
    chatBotLabel: "Бот",
    chatAdminLabel: "Вы",
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

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
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

  const [messages, setMessages] = useState([]);
  const [chatSearch, setChatSearch] = useState("");
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef(null);

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

  useEffect(() => {
    const unsub = subscribeCollection("telegramChatMessages", setMessages);
    return unsub;
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChatId, messages]);

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

  // "Botni ishga tushirganlar" ro'yxatini (kontaktlar manbai) va xabarlarni
  // birlashtirib, har bir mijoz uchun oxirgi xabar va vaqtini hisoblaymiz.
  const chatList = useMemo(() => {
    const byChat = new Map();
    starts.forEach((s) => {
      byChat.set(String(s.id), {
        chatId: s.id,
        firstName: s.firstName, lastName: s.lastName, username: s.username,
        lastMessage: "", lastMessageAt: s.lastStartAt || "", lastDirection: null,
      });
    });
    messages.forEach((m) => {
      const key = String(m.chatId);
      let entry = byChat.get(key);
      if (!entry) {
        entry = { chatId: m.chatId, firstName: m.firstName, lastName: m.lastName, username: m.username, lastMessage: "", lastMessageAt: "", lastDirection: null };
        byChat.set(key, entry);
      }
      if ((m.createdAt || "") > (entry.lastMessageAt || "")) {
        entry.lastMessage = m.text || "";
        entry.lastMessageAt = m.createdAt || entry.lastMessageAt;
        entry.lastDirection = m.direction;
      }
    });
    return [...byChat.values()].sort((a, b) => (b.lastMessageAt || "").localeCompare(a.lastMessageAt || ""));
  }, [starts, messages]);

  const filteredChatList = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    if (!q) return chatList;
    return chatList.filter((c) =>
      `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase().includes(q) ||
      (c.username || "").toLowerCase().includes(q)
    );
  }, [chatList, chatSearch]);

  const selectedChat = useMemo(
    () => chatList.find((c) => String(c.chatId) === String(selectedChatId)) || null,
    [chatList, selectedChatId]
  );

  const threadMessages = useMemo(() => {
    if (!selectedChatId) return [];
    return messages
      .filter((m) => String(m.chatId) === String(selectedChatId))
      .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  }, [messages, selectedChatId]);

  const sendReply = async () => {
    const text = replyText.trim();
    if (!text || !selectedChatId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/telegram-send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: selectedChatId, text }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.ok) {
        setReplyText("");
      } else {
        console.error("Xabar yuborilmadi:", data.error);
      }
    } catch (e) {
      console.error("Xabar yuborishda tarmoq xatosi:", e);
    }
    setSending(false);
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

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <MessageCircle size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t.chatTitle}</h3>
            <p className="text-xs text-slate-400">{t.chatHint}</p>
          </div>
        </div>

        <div className="flex overflow-hidden rounded-xl border border-gray-100">
          {/* Kontaktlar ro'yxati */}
          <div className="flex w-64 shrink-0 flex-col border-r border-gray-100">
            <div className="p-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder={t.chatSearchPh}
                  className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 420 }}>
              {filteredChatList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">{t.chatListEmpty}</div>
              ) : (
                filteredChatList.map((c) => (
                  <button
                    key={c.chatId}
                    onClick={() => setSelectedChatId(c.chatId)}
                    className={`block w-full border-b border-gray-50 px-3 py-2.5 text-left last:border-0 hover:bg-slate-50 ${
                      String(selectedChatId) === String(c.chatId) ? "bg-emerald-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-slate-700">
                        {[c.firstName, c.lastName].filter(Boolean).join(" ") || (c.username ? `@${c.username}` : c.chatId)}
                      </span>
                      {c.lastMessageAt && <span className="shrink-0 text-[10px] text-slate-400">{fmtTime(c.lastMessageAt)}</span>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {c.lastMessage || t.chatNoMessagesShort}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Suhbat oynasi */}
          <div className="flex flex-1 flex-col">
            {!selectedChat ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-400">
                {t.chatSelectHint}
              </div>
            ) : (
              <>
                <div className="border-b border-gray-100 px-3 py-2">
                  <p className="text-sm font-medium text-slate-700">
                    {[selectedChat.firstName, selectedChat.lastName].filter(Boolean).join(" ") || selectedChat.chatId}
                  </p>
                  {selectedChat.username && (
                    <a
                      href={`https://t.me/${selectedChat.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-600 hover:underline"
                    >
                      @{selectedChat.username}
                    </a>
                  )}
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto p-3" style={{ maxHeight: 360, minHeight: 240 }}>
                  {threadMessages.length === 0 ? (
                    <div className="pt-8 text-center text-xs text-slate-400">{t.chatNoMessages}</div>
                  ) : (
                    threadMessages.map((m) => (
                      <div key={m.id} className={`flex ${m.direction === "in" ? "justify-start" : "justify-end"}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                            m.direction === "in" ? "bg-slate-100 text-slate-700" : "bg-emerald-600 text-white"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.text}</p>
                          <p className={`mt-1 text-[10px] ${m.direction === "in" ? "text-slate-400" : "text-emerald-100"}`}>
                            {m.direction === "out" && (m.sender === "admin" ? `${t.chatAdminLabel} · ` : `${t.chatBotLabel} · `)}
                            {fmtDate(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={threadEndRef} />
                </div>

                <div className="flex items-center gap-2 border-t border-gray-100 p-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder={t.chatInputPh}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
