import React, { useState } from "react";
import { Instagram, Send, Loader2, CheckCircle2, Phone, MapPin, Clock, Music2 } from "lucide-react";
import { addItem } from "../storage.js";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_SHORT = {
  uz: { mon: "Dush", tue: "Sesh", wed: "Chor", thu: "Pay", fri: "Juma", sat: "Shan", sun: "Yak" },
  ru: { mon: "Пн", tue: "Вт", wed: "Ср", thu: "Чт", fri: "Пт", sat: "Сб", sun: "Вс" },
};

/** Kunma-kun ish vaqti obyektini qisqa, o'qish oson matnga aylantiradi (masalan "Dush-Juma 09:00-18:00, Shan 10:00-16:00"). */
function formatWorkingHours(workingHours, lang) {
  if (!workingHours || typeof workingHours !== "object") return "";
  const labels = DAY_SHORT[lang] || DAY_SHORT.uz;
  const groups = [];
  let current = null;
  DAY_ORDER.forEach((key) => {
    const day = workingHours[key];
    if (!day || !day.open) { current = null; return; }
    const sig = `${day.from}-${day.to}`;
    if (current && current.sig === sig) {
      current.days.push(key);
    } else {
      current = { sig, from: day.from, to: day.to, days: [key] };
      groups.push(current);
    }
  });
  if (groups.length === 0) return "";
  return groups
    .map((g) => {
      const dayLabel = g.days.length > 1 ? `${labels[g.days[0]]}-${labels[g.days[g.days.length - 1]]}` : labels[g.days[0]];
      return `${dayLabel} ${g.from}-${g.to}`;
    })
    .join(", ");
}

const T_LOCAL = {
  uz: {
    tagline: "Har lahza uchun tanlangan uslub. Siz uchun, siz bilan.",
    shop: "Do'kon", shopAll: "Barcha mahsulotlar", shopCategories: "Kategoriyalar",
    care: "Mijozlarga g'amxo'rlik", contact: "Biz bilan bog'lanish", delivery: "Yetkazib berish",
    about: "Biz haqimizda", follow: "Ijtimoiy tarmoqlar",
    subscribeTitle: "Yangiliklardan xabardor bo'ling",
    subscribeNote: "Chegirmalar va yangi mahsulotlar haqida birinchi bo'lib biling",
    emailPh: "Email manzilingiz", subscribe: "Obuna bo'lish", subscribing: "Yuborilmoqda...",
    subscribed: "Rahmat! Obuna bo'ldingiz", invalidEmail: "Email manzilini to'g'ri kiriting",
    rights: "Barcha huquqlar himoyalangan.",
  },
  ru: {
    tagline: "Стиль, подобранный для каждого момента. Для вас и с вами.",
    shop: "Магазин", shopAll: "Все товары", shopCategories: "Категории",
    care: "Забота о клиентах", contact: "Связаться с нами", delivery: "Доставка",
    about: "О нас", follow: "Мы в соцсетях",
    subscribeTitle: "Будьте в курсе новостей",
    subscribeNote: "Узнавайте первыми о скидках и новых товарах",
    emailPh: "Ваш email", subscribe: "Подписаться", subscribing: "Отправка...",
    subscribed: "Спасибо! Вы подписались", invalidEmail: "Введите корректный email",
    rights: "Все права защищены.",
  },
};

export default function StoreFooter({ lang, storeName, settings }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | saving | done | error

  const subscribe = async () => {
    const value = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(value)) {
      setStatus("error");
      return;
    }
    setStatus("saving");
    try {
      await addItem("newsletter", { email: value, date: new Date().toISOString().slice(0, 10) });
      setStatus("done");
      setEmail("");
    } catch (e) {
      console.error("Obunani saqlashda xatolik:", e);
      setStatus("error");
    }
  };

  return (
    <footer className="mt-12 bg-stone-900 text-stone-300">
      {/* Obuna bo'lish paneli */}
      <div className="border-b border-white/10 px-6 py-8 sm:px-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
          <h3 style={SERIF} className="text-xl font-semibold text-white sm:text-2xl">{t.subscribeTitle}</h3>
          <p className="text-sm text-stone-400">{t.subscribeNote}</p>
          <div className="mt-2 flex w-full max-w-sm gap-2">
            <input
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (status !== "idle") setStatus("idle"); }}
              placeholder={t.emailPh}
              className="w-full rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-stone-500 outline-none focus:border-white/40"
            />
            <button
              onClick={subscribe}
              disabled={status === "saving"}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-stone-900 hover:bg-rose-50 disabled:opacity-60"
            >
              {status === "saving" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {status === "saving" ? t.subscribing : t.subscribe}
            </button>
          </div>
          {status === "done" && (
            <p className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 size={13} /> {t.subscribed}</p>
          )}
          {status === "error" && <p className="text-xs text-rose-400">{t.invalidEmail}</p>}
        </div>
      </div>

      {/* Havolalar */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-10 sm:grid-cols-4 sm:px-10">
        <div className="col-span-2 sm:col-span-1">
          <p style={SERIF} className="text-lg font-semibold text-white">{storeName}</p>
          <p className="mt-2 text-sm text-stone-400">{t.tagline}</p>
          {(settings?.instagramLink || settings?.telegramLink || settings?.tiktokLink) && (
            <div className="mt-4 flex gap-3">
              {settings?.instagramLink && (
                <a href={settings.instagramLink} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white">
                  <Instagram size={15} />
                </a>
              )}
              {settings?.telegramLink && (
                <a href={settings.telegramLink} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white">
                  <Send size={15} />
                </a>
              )}
              {settings?.tiktokLink && (
                <a href={settings.tiktokLink} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-stone-300 hover:bg-white/20 hover:text-white">
                  <Music2 size={15} />
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">{t.shop}</p>
          <ul className="space-y-2 text-sm text-stone-400">
            <li>{t.shopAll}</li>
            <li>{t.shopCategories}</li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">{t.contact}</p>
          <ul className="space-y-2 text-sm text-stone-400">
            {settings?.contactPhone && (
              <li className="flex items-center gap-1.5"><Phone size={13} className="shrink-0 text-stone-500" /> {settings.contactPhone}</li>
            )}
            {settings?.contactAddress && (
              <li className="flex items-center gap-1.5"><MapPin size={13} className="shrink-0 text-stone-500" /> {settings.contactAddress}</li>
            )}
            {formatWorkingHours(settings?.workingHours, lang) && (
              <li className="flex items-center gap-1.5"><Clock size={13} className="shrink-0 text-stone-500" /> {formatWorkingHours(settings.workingHours, lang)}</li>
            )}
            {!settings?.contactPhone && !settings?.contactAddress && !formatWorkingHours(settings?.workingHours, lang) && (
              <>
                <li>{t.contact}</li>
                <li>{t.delivery}</li>
              </>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-500">{t.about}</p>
          <ul className="space-y-2 text-sm text-stone-400">
            <li>{storeName}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-stone-500 sm:px-10">
        © {new Date().getFullYear()} {storeName}. {t.rights}
      </div>
    </footer>
  );
}
