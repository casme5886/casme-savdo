import React from "react";
import { Instagram, Send, Phone, MapPin, Clock, Music2, Users, PackageCheck } from "lucide-react";

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
    follow: "Ijtimoiy tarmoqlar",
    statsCustomers: "Bizga ishongan mijozlar", statsOrders: "Bajarilgan buyurtmalar",
    rights: "Barcha huquqlar himoyalangan.",
  },
  ru: {
    tagline: "Стиль, подобранный для каждого момента. Для вас и с вами.",
    shop: "Магазин", shopAll: "Все товары", shopCategories: "Категории",
    care: "Забота о клиентах", contact: "Связаться с нами", delivery: "Доставка",
    follow: "Мы в соцсетях",
    statsCustomers: "Клиентов доверяют нам", statsOrders: "Выполненных заказов",
    rights: "Все права защищены.",
  },
};

/** Sonni "1 240+" ko'rinishida chiroyli formatlaydi; hali yuklanmagan bo'lsa (null) — placeholder qaytaradi. */
function fmtStat(n) {
  if (n === null || n === undefined) return "—";
  return `${(Number(n) || 0).toLocaleString("ru-RU")}+`;
}

export default function StoreFooter({ lang, storeName, settings, customersCount, ordersCount, onShopAll, onCategories }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;

  return (
    <footer className="mt-6 bg-stone-900 text-stone-300">
      {/* Ishonch statistikasi — ro'yxatdan o'tgan mijozlar va bajarilgan buyurtmalar soni */}
      <div className="border-b border-white/10 px-6 py-8 sm:px-10" style={{ background: "linear-gradient(135deg, rgba(224,24,118,0.18), rgba(28,25,23,0) 60%)" }}>
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:gap-4 sm:p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white sm:h-12 sm:w-12"
              style={{ background: "linear-gradient(135deg, #FDA4AF, #E01876)" }}
            >
              <Users size={20} />
            </span>
            <div className="min-w-0">
              <p style={SERIF} className="text-xl font-bold text-white sm:text-2xl">{fmtStat(customersCount)}</p>
              <p className="text-[11px] leading-tight text-stone-400 sm:text-xs">{t.statsCustomers}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 sm:gap-4 sm:p-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white sm:h-12 sm:w-12"
              style={{ background: "linear-gradient(135deg, #FDA4AF, #E01876)" }}
            >
              <PackageCheck size={20} />
            </span>
            <div className="min-w-0">
              <p style={SERIF} className="text-xl font-bold text-white sm:text-2xl">{fmtStat(ordersCount)}</p>
              <p className="text-[11px] leading-tight text-stone-400 sm:text-xs">{t.statsOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Havolalar */}
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-6 py-12 sm:grid-cols-3 sm:px-10">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #FDA4AF, #E01876)" }}
            >
              {(storeName || "?").trim().charAt(0).toUpperCase()}
            </span>
            <p style={SERIF} className="text-lg font-semibold text-white">{storeName}</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-stone-400">{t.tagline}</p>
          {(settings?.instagramLink || settings?.telegramLink || settings?.tiktokLink) && (
            <div className="mt-4 flex gap-2.5">
              {settings?.instagramLink && (
                <a
                  href={settings.instagramLink} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 shadow-sm transition hover:-translate-y-0.5 hover:text-white"
                  style={{ background: "linear-gradient(135deg, rgba(253,164,175,0.25), rgba(224,24,118,0.25))" }}
                >
                  <Instagram size={15} />
                </a>
              )}
              {settings?.telegramLink && (
                <a
                  href={settings.telegramLink} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 shadow-sm transition hover:-translate-y-0.5 hover:text-white"
                  style={{ background: "linear-gradient(135deg, rgba(253,164,175,0.25), rgba(224,24,118,0.25))" }}
                >
                  <Send size={15} />
                </a>
              )}
              {settings?.tiktokLink && (
                <a
                  href={settings.tiktokLink} target="_blank" rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 shadow-sm transition hover:-translate-y-0.5 hover:text-white"
                  style={{ background: "linear-gradient(135deg, rgba(253,164,175,0.25), rgba(224,24,118,0.25))" }}
                >
                  <Music2 size={15} />
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          <p className="mb-3.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <span className="h-3 w-0.5 rounded-full" style={{ background: "#E01876" }} /> {t.shop}
          </p>
          <ul className="space-y-2.5 text-sm text-stone-400">
            <li><button onClick={onShopAll} className="transition hover:text-white">{t.shopAll}</button></li>
            <li><button onClick={onCategories} className="transition hover:text-white">{t.shopCategories}</button></li>
          </ul>
        </div>
        <div>
          <p className="mb-3.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <span className="h-3 w-0.5 rounded-full" style={{ background: "#E01876" }} /> {t.contact}
          </p>
          <ul className="space-y-2.5 text-sm text-stone-400">
            {settings?.contactPhone && (
              <li className="flex items-center gap-1.5"><Phone size={13} className="shrink-0 text-rose-400" /> {settings.contactPhone}</li>
            )}
            {settings?.contactAddress && (
              <li className="flex items-center gap-1.5"><MapPin size={13} className="shrink-0 text-rose-400" /> {settings.contactAddress}</li>
            )}
            {formatWorkingHours(settings?.workingHours, lang) && (
              <li className="flex items-center gap-1.5"><Clock size={13} className="shrink-0 text-rose-400" /> {formatWorkingHours(settings.workingHours, lang)}</li>
            )}
            {!settings?.contactPhone && !settings?.contactAddress && !formatWorkingHours(settings?.workingHours, lang) && (
              <>
                <li>{t.contact}</li>
                <li>{t.delivery}</li>
              </>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-stone-500 sm:px-10">
        © {new Date().getFullYear()} {storeName}. {t.rights}
      </div>
    </footer>
  );
}
