import React, { useState, useEffect, useMemo } from "react";
import {
  Mail, Tag, Percent, Plus, Trash2, Pencil, Save, Loader2, X,
  Download, MousePointerClick, Zap, AlertTriangle, CheckCircle2,
  Trophy, Send, CalendarDays, Search, Package, Flame, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  subscribeCollection, updateItem, deleteItem, setItem,
} from "../storage.js";
import { Modal, Field, EmptyState, inputCls, uid, fmtMoney, pname, discountPct, Toggle } from "./ui.jsx";

const T_LOCAL = {
  uz: {
    title: "Marketing",
    statsClicks: "Banner bosishlari (jami)", statsSubscribers: "Obunachilar", statsCodes: "Faol promo kodlar",
    saleTitle: "Ommaviy chegirma", saleOff: "Hozircha faol emas", saleOn: "Faol",
    saleDesc: "Barcha mahsulotlarga bir vaqtning o'zida chegirma qo'llang (masalan flesh-sale uchun).",
    salePercentLabel: "Chegirma foizi", saleActivate: "Barcha mahsulotlarga qo'llash", saleDeactivate: "Chegirmani bekor qilish",
    saleConfirm: "mahsulotga qo'llanadi", saleActivating: "Qo'llanmoqda...", saleDeactivating: "Bekor qilinmoqda...",
    saleActiveNote: "ta mahsulotga", saleWarning: "Diqqat: bu barcha mahsulotlar narxini o'zgartiradi. Individual chegirmasi bo'lgan mahsulotlarning oldingi chegirmasi vaqtincha almashtiriladi.",

    codesTitle: "Promo kodlar", addCode: "Kod qo'shish", editCode: "Kodni tahrirlash",
    codeField: "Kod", codePh: "Masalan: SALE20", codeType: "Turi", typePercent: "Foizda (%)", typeFixed: "Aniq summada (so'm)",
    codeValue: "Qiymati", minOrder: "Minimal buyurtma summasi (ixtiyoriy)", expiresAt: "Amal qilish muddati (ixtiyoriy)",
    usageLimit: "Ishlatish limiti (ixtiyoriy)", usageLimitHint: "Bo'sh qoldirsangiz — cheksiz",
    usedCount: "ishlatilgan", noCodes: "Hozircha promo kod yo'q",
    active: "Faol", inactive: "Faol emas",

    subsTitle: "Email obunachilar", noSubs: "Hozircha obunachi yo'q", export: "Eksport",
    subDate: "Sana",

    save: "Saqlash", saving: "Saqlanmoqda...", cancel: "Bekor qilish", required: "Kod va qiymatni kiriting",

    discTitle: "Mega Chegirmalar", discSearchPh: "Mahsulot izlash...",
    discNone: "Chegirma yo'q", discOn: "Yoqish", discOff: "Bekor qilish", discPercentPh: "%",
    discEmpty: "Mahsulot topilmadi",
    discFilterBtn: "Filtr", discClearFilters: "Filtrlarni tozalash", discTabAll: "Barchasi", discOnlyDiscounted: "Faqat chegirmadagilar",

    hitTitle: "Xit mahsulotlar", hitHint: "Belgilangan mahsulotlar saytdagi \"Xit mahsulotlar\" bo'limida (bosh sahifada) ko'rinadi.",
    hitSearchPh: "Mahsulot izlash...", hitSelectedCount: "ta belgilandi", hitEmpty: "Mahsulot topilmadi",
    hitFilterBtn: "Filtr", hitClearFilters: "Filtrlarni tozalash", hitTabAll: "Barchasi", hitOnlySelected: "Faqat belgilanganlar",

    topTitle: "Eng samarali kampaniyalar",
    topCodes: "Eng foydali promo kodlar", topBanners: "Eng ko'p bosilgan bannerlar",
    topNoData: "Hali ma'lumot yo'q", topRevenue: "daromad keltirdi", topClicks: "marta bosildi",

    chartTitle: "Promo kodlar ishlatilishi", chartNoData: "Hali hech qanday promo kod ishlatilmagan",

    broadcastTitle: "Telegram orqali xabar yuborish",
    broadcastDesc: "Telegram Mini App orqali kirgan mijozlarga xabar yuboradi (SMS emas — bizda hozircha SMS xizmati ulanmagan).",
    broadcastRecipients: "ta mijozga yetadi", broadcastPh: "Xabar matnini yozing...",
    broadcastSend: "Yuborish", broadcastSending: "Yuborilmoqda...",
    broadcastSuccess: "Yuborildi", broadcastFailed: "muvaffaqiyatsiz", broadcastNoRecipients: "Hozircha Telegram orqali kirgan mijoz yo'q",
    broadcastError: "Xatolik yuz berdi — server sozlamalarini tekshiring",

    timelineTitle: "Rejalashtirilgan kampaniyalar",
    timelineEmpty: "Hozircha rejalashtirilgan (sanasi belgilangan) kampaniya yo'q",
    timelineBannerStart: "banner boshlanadi", timelineBannerEnd: "banner tugaydi", timelineCodeExpires: "promo kod tugaydi",
  },
  ru: {
    title: "Маркетинг",
    statsClicks: "Клики по баннерам (всего)", statsSubscribers: "Подписчики", statsCodes: "Активные промокоды",
    saleTitle: "Массовая скидка", saleOff: "Пока не активна", saleOn: "Активна",
    saleDesc: "Примените скидку сразу на все товары (например, для флеш-распродажи).",
    salePercentLabel: "Процент скидки", saleActivate: "Применить ко всем товарам", saleDeactivate: "Отменить скидку",
    saleConfirm: "товарам будет применено", saleActivating: "Применяется...", saleDeactivating: "Отменяется...",
    saleActiveNote: "товаров", saleWarning: "Внимание: это изменит цены всех товаров. Прежняя индивидуальная скидка временно заменится.",

    codesTitle: "Промокоды", addCode: "Добавить код", editCode: "Редактировать код",
    codeField: "Код", codePh: "Например: SALE20", codeType: "Тип", typePercent: "В процентах (%)", typeFixed: "Фиксированная сумма (сум)",
    codeValue: "Значение", minOrder: "Минимальная сумма заказа (опционально)", expiresAt: "Срок действия (опционально)",
    usageLimit: "Лимит использования (опционально)", usageLimitHint: "Оставьте пустым — без ограничений",
    usedCount: "использовано", noCodes: "Пока нет промокодов",
    active: "Активен", inactive: "Не активен",

    subsTitle: "Email подписчики", noSubs: "Пока нет подписчиков", export: "Экспорт",
    subDate: "Дата",

    save: "Сохранить", saving: "Сохранение...", cancel: "Отмена", required: "Укажите код и значение",

    discTitle: "Мега скидки", discSearchPh: "Поиск товара...",
    discNone: "Нет скидки", discOn: "Включить", discOff: "Отменить", discPercentPh: "%",
    discEmpty: "Товар не найден",
    discFilterBtn: "Фильтр", discClearFilters: "Сбросить фильтры", discTabAll: "Все", discOnlyDiscounted: "Только со скидкой",

    hitTitle: "Хит-товары", hitHint: "Отмеченные товары появятся в разделе \"Хит-товары\" на главной странице сайта.",
    hitSearchPh: "Поиск товара...", hitSelectedCount: "отмечено", hitEmpty: "Товар не найден",
    hitFilterBtn: "Фильтр", hitClearFilters: "Сбросить фильтры", hitTabAll: "Все", hitOnlySelected: "Только отмеченные",

    topTitle: "Самые эффективные кампании",
    topCodes: "Самые выгодные промокоды", topBanners: "Самые кликабельные баннеры",
    topNoData: "Пока нет данных", topRevenue: "дохода", topClicks: "кликов",

    chartTitle: "Использование промокодов", chartNoData: "Пока ни один промокод не использован",

    broadcastTitle: "Рассылка через Telegram",
    broadcastDesc: "Отправляет сообщение клиентам, входившим через Telegram Mini App (это не SMS — SMS-сервис пока не подключён).",
    broadcastRecipients: "клиентам дойдёт", broadcastPh: "Напишите текст сообщения...",
    broadcastSend: "Отправить", broadcastSending: "Отправка...",
    broadcastSuccess: "Отправлено", broadcastFailed: "не удалось", broadcastNoRecipients: "Пока нет клиентов, входивших через Telegram",
    broadcastError: "Произошла ошибка — проверьте настройки сервера",

    timelineTitle: "Запланированные кампании",
    timelineEmpty: "Пока нет запланированных (с указанной датой) кампаний",
    timelineBannerStart: "начало баннера", timelineBannerEnd: "конец баннера", timelineCodeExpires: "истекает промокод",
  },
};

const EMPTY_CODE = { code: "", discountType: "percent", discountValue: "", minOrder: "", expiresAt: "", usageLimit: "", active: true };

function exportSubscribersToCSV(subs) {
  const headers = ["Email", "Sana"];
  const rows = subs.map((s) => [s.email || "", s.date || ""]);
  const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `obunachilar-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function MarketingPage({ lang, banners, products, orders, customers }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;

  const [promoCodes, setPromoCodes] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [saleSettings, setSaleSettings] = useState(null);

  useEffect(() => {
    const unsub = subscribeCollection("promoCodes", setPromoCodes);
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = subscribeCollection("newsletter", setSubscribers);
    return unsub;
  }, []);
  useEffect(() => {
    const unsub = subscribeCollection("settings", (list) => {
      setSaleSettings(list.find((x) => x.id === "storewideSale") || null);
    });
    return unsub;
  }, []);

  const totalClicks = useMemo(() => (banners || []).reduce((s, b) => s + (b.clicks || 0), 0), [banners]);
  const activeCodesCount = useMemo(() => promoCodes.filter((c) => c.active !== false).length, [promoCodes]);

  return (
    <div className="flex flex-col gap-5">
      {/* Statistika */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={MousePointerClick} color="emerald" label={t.statsClicks} value={totalClicks} />
        <StatCard icon={Mail} color="blue" label={t.statsSubscribers} value={subscribers.length} />
        <StatCard icon={Tag} color="amber" label={t.statsCodes} value={activeCodesCount} />
      </div>

      <StorewideSale lang={lang} t={t} products={products} saleSettings={saleSettings} />
      <HitProductsSection lang={lang} t={t} products={products} />
      <ProductDiscounts lang={lang} t={t} products={products} />
      <TopCampaigns t={t} promoCodes={promoCodes} banners={banners} orders={orders} />
      <PromoCodeChart t={t} promoCodes={promoCodes} />
      <TelegramBroadcast t={t} customers={customers} />
      <MarketingTimeline t={t} banners={banners} promoCodes={promoCodes} />
      <PromoCodesSection lang={lang} t={t} promoCodes={promoCodes} />
      <SubscribersSection t={t} subscribers={subscribers} />
    </div>
  );
}

function StatCard({ icon: Icon, color, label, value }) {
  const colorMap = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${colorMap[color]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

/** Ommaviy chegirma — barcha mahsulotlarga bir vaqtda foiz chegirma qo'llash/bekor qilish. */
function StorewideSale({ lang, t, products, saleSettings }) {
  const [percent, setPercent] = useState("20");
  const [busy, setBusy] = useState(false);
  const isActive = saleSettings?.active === true;
  const affectedCount = saleSettings?.affectedProductIds?.length || 0;

  const activate = async () => {
    const pct = Number(percent);
    if (!pct || pct <= 0 || pct >= 100) return;
    setBusy(true);
    const affectedIds = [];
    for (const p of products) {
      if (p.storewideSaleApplied) { affectedIds.push(p.id); continue; }
      const original = Number(p.price) || 0;
      const newPrice = Math.round(original * (1 - pct / 100));
      await updateItem("products", p.id, {
        originalPriceBeforeSale: original,
        price: newPrice,
        oldPrice: original,
        storewideSaleApplied: true,
      });
      affectedIds.push(p.id);
    }
    await setItem("settings", "storewideSale", { active: true, percent: pct, affectedProductIds: affectedIds });
    setBusy(false);
  };

  const deactivate = async () => {
    setBusy(true);
    const ids = saleSettings?.affectedProductIds || [];
    for (const id of ids) {
      const p = products.find((x) => x.id === id);
      if (!p || !p.storewideSaleApplied) continue;
      await updateItem("products", id, {
        price: p.originalPriceBeforeSale ?? p.price,
        oldPrice: 0,
        storewideSaleApplied: false,
        originalPriceBeforeSale: 0,
      });
    }
    await setItem("settings", "storewideSale", { active: false, percent: 0, affectedProductIds: [] });
    setBusy(false);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <Zap size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{t.saleTitle}</h3>
            <p className="text-xs text-slate-400">{t.saleDesc}</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-slate-500"}`}>
          {isActive ? <CheckCircle2 size={12} /> : null} {isActive ? t.saleOn : t.saleOff}
        </span>
      </div>

      {isActive ? (
        <div>
          <p className="mb-3 text-sm text-slate-600">
            <span className="font-semibold text-rose-600">-{saleSettings.percent}%</span> — {affectedCount} {t.saleActiveNote}
          </p>
          <button onClick={deactivate} disabled={busy} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
            {busy ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} {busy ? t.saleDeactivating : t.saleDeactivate}
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {t.saleWarning}
          </p>
          <div className="flex flex-wrap items-end gap-2">
            <Field label={t.salePercentLabel}>
              <div className="relative w-28">
                <input type="number" min="1" max="99" className={inputCls} value={percent} onChange={(e) => setPercent(e.target.value)} />
                <Percent size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </Field>
            <button onClick={activate} disabled={busy} className="mb-3 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />} {busy ? t.saleActivating : t.saleActivate}
            </button>
          </div>
          <p className="text-xs text-slate-400">{products.length} {t.saleConfirm} (-{percent || 0}%)</p>
        </div>
      )}
    </div>
  );
}

/** Har bir mahsulotga alohida chegirma yoqish/bekor qilish — mavjud price/oldPrice maydonlaridan foydalanadi. */
function ProductDiscounts({ lang, t, products }) {
  const [search, setSearch] = useState("");
  const [pctInputs, setPctInputs] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.category).filter(Boolean))).sort(),
    [products]
  );
  const brands = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  );

  // Mahsulot yaratishda ("Narx" + "Eski narx / chegirmadan oldingi narx"
  // maydonlari) to'g'ridan-to'g'ri kiritilgan chegirma — bu "oddiy" chegirma
  // hisoblanadi va Mega Chegirmalar bo'limida BOSHQARILMAYDI (ro'yxatda
  // ko'rinmaydi). Faqat shu bo'lim orqali (pastdagi % + Yoqish tugmasi bilan)
  // yoqilgan chegirmalar `megaDiscountActive: true` belgisiga ega bo'ladi va
  // shu ro'yxatda boshqariladi.
  const filtered = useMemo(
    () => (products || [])
      .filter((p) => pname(p, lang).toLowerCase().includes(search.toLowerCase()))
      .filter((p) => catFilter === "all" || p.category === catFilter)
      .filter((p) => brandFilter === "all" || p.brand === brandFilter)
      .filter((p) => !onlyDiscounted || p.oldPrice > p.price)
      .filter((p) => !(p.oldPrice > p.price && !p.megaDiscountActive)),
    [products, search, lang, catFilter, brandFilter, onlyDiscounted]
  );
  const activeFilterCount = (catFilter !== "all" ? 1 : 0) + (brandFilter !== "all" ? 1 : 0) + (onlyDiscounted ? 1 : 0);
  const clearAllFilters = () => { setCatFilter("all"); setBrandFilter("all"); setOnlyDiscounted(false); };

  const enable = async (p) => {
    const pct = Number(pctInputs[p.id]);
    if (!pct || pct <= 0 || pct >= 100) return;
    setBusyId(p.id);
    const original = Number(p.price) || 0;
    const newPrice = Math.round(original * (1 - pct / 100));
    await updateItem("products", p.id, { oldPrice: original, price: newPrice, megaDiscountActive: true });
    setBusyId(null);
    setPctInputs((prev) => ({ ...prev, [p.id]: "" }));
  };

  const disable = async (p) => {
    setBusyId(p.id);
    await updateItem("products", p.id, { price: p.oldPrice, oldPrice: 0, megaDiscountActive: false });
    setBusyId(null);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">{t.discTitle}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.discSearchPh}
              className="w-52 rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500" />
          </div>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${filterOpen || activeFilterCount > 0 ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-200 text-slate-600 hover:bg-gray-50"}`}
          >
            <Filter size={13} /> {t.discFilterBtn}
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-semibold text-white">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="mb-3 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline">
              <X size={13} /> {t.discClearFilters}
            </button>
          )}

          <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <input type="checkbox" checked={onlyDiscounted} onChange={(e) => setOnlyDiscounted(e.target.checked)} className="h-3.5 w-3.5 accent-rose-600" />
            {t.discOnlyDiscounted}
          </label>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-200 pt-2.5">
              <button
                onClick={() => setCatFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${catFilter === "all" ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
              >
                {t.discTabAll}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${catFilter === c ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {brands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-200 pt-2.5">
              <button
                onClick={() => setBrandFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${brandFilter === "all" ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
              >
                {t.discTabAll}
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setBrandFilter(b)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${brandFilter === b ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text={t.discEmpty} />
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {filtered.map((p) => {
            const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
            const hasDiscount = p.oldPrice > p.price;
            const pct = hasDiscount ? discountPct(p.price, p.oldPrice) : 0;
            const busy = busyId === p.id;
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 p-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                  {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Package size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{pname(p, lang)}</p>
                  <p className="text-[11px] text-slate-400">
                    {hasDiscount ? (
                      <>
                        <span className="text-rose-500 line-through">{fmtMoney(p.oldPrice)}</span> {fmtMoney(p.price)} UZS
                      </>
                    ) : (
                      `${fmtMoney(p.price)} UZS`
                    )}
                  </p>
                </div>
                {hasDiscount ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-600">-{pct}%</span>
                    <button
                      onClick={() => disable(p)}
                      disabled={busy}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : t.discOff}
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="99"
                      placeholder="%"
                      value={pctInputs[p.id] || ""}
                      onChange={(e) => setPctInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-14 rounded-lg border border-gray-200 px-2 py-1 text-[11px] outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={() => enable(p)}
                      disabled={busy || !pctInputs[p.id]}
                      className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : t.discOn}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * "Xit mahsulotlar" — bosh sahifadagi 🔥 bo'limida ko'rinadigan mahsulotlarni
 * bitta ro'yxatdan (qidiruv bilan) belgilash/olib tashlash. Ichki mexanizm —
 * mahsulotning bitta `tag` maydoni ("bestseller" bo'lsa хит hisoblanadi),
 * shu bilan mahsulot tahrirlash oynasidagi teg tanlovi bilan bir xil ma'lumot.
 */
function HitProductsSection({ lang, t, products }) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [catFilter, setCatFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [onlySelected, setOnlySelected] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.category).filter(Boolean))).sort(),
    [products]
  );
  const brands = useMemo(
    () => Array.from(new Set((products || []).map((p) => p.brand).filter(Boolean))).sort(),
    [products]
  );

  const filtered = useMemo(
    () => (products || [])
      .filter((p) => pname(p, lang).toLowerCase().includes(search.toLowerCase()))
      .filter((p) => catFilter === "all" || p.category === catFilter)
      .filter((p) => brandFilter === "all" || p.brand === brandFilter)
      .filter((p) => !onlySelected || p.tag === "bestseller"),
    [products, search, lang, catFilter, brandFilter, onlySelected]
  );
  const selectedCount = useMemo(() => (products || []).filter((p) => p.tag === "bestseller").length, [products]);
  const activeFilterCount = (catFilter !== "all" ? 1 : 0) + (brandFilter !== "all" ? 1 : 0) + (onlySelected ? 1 : 0);
  const clearAllFilters = () => { setCatFilter("all"); setBrandFilter("all"); setOnlySelected(false); };

  const toggleHit = async (p) => {
    setBusyId(p.id);
    await updateItem("products", p.id, { tag: p.tag === "bestseller" ? "none" : "bestseller" });
    setBusyId(null);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <Flame size={17} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{t.hitTitle}</h3>
          <p className="text-xs text-slate-400">{t.hitHint}</p>
        </div>
      </div>

      <div className="my-3 flex flex-wrap items-center justify-between gap-2">
        {selectedCount > 0 ? (
          <p className="text-xs font-medium text-rose-600">{selectedCount} {t.hitSelectedCount}</p>
        ) : <span />}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.hitSearchPh}
              className="w-52 rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500" />
          </div>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`relative flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition ${filterOpen || activeFilterCount > 0 ? "border-rose-400 bg-rose-50 text-rose-600" : "border-gray-200 text-slate-600 hover:bg-gray-50"}`}
          >
            <Filter size={13} /> {t.hitFilterBtn}
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-semibold text-white">{activeFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {filterOpen && (
        <div className="mb-3 space-y-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs font-medium text-rose-600 hover:underline">
              <X size={13} /> {t.hitClearFilters}
            </button>
          )}

          <label className="flex w-fit cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
            <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} className="h-3.5 w-3.5 accent-rose-600" />
            {t.hitOnlySelected}
          </label>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-200 pt-2.5">
              <button
                onClick={() => setCatFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${catFilter === "all" ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
              >
                {t.hitTabAll}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCatFilter(c)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${catFilter === c ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {brands.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-gray-200 pt-2.5">
              <button
                onClick={() => setBrandFilter("all")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${brandFilter === "all" ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
              >
                {t.hitTabAll}
              </button>
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setBrandFilter(b)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${brandFilter === b ? "bg-rose-600 text-white" : "bg-white text-slate-500 hover:bg-gray-100"}`}
                >
                  {b}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text={t.hitEmpty} />
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {filtered.map((p) => {
            const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
            const isHit = p.tag === "bestseller";
            const busy = busyId === p.id;
            return (
              <div key={p.id} className={`flex items-center gap-2 rounded-lg border p-2 ${isHit ? "border-rose-200 bg-rose-50/50" : "border-gray-100"}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                  {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Package size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{pname(p, lang)}</p>
                  <p className="text-[11px] text-slate-400">{fmtMoney(p.price)} UZS</p>
                </div>
                <Toggle checked={isHit} onChange={() => !busy && toggleHit(p)} disabled={busy} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Promo kodlar (daromad bo'yicha) va bannerlar (bosishlar bo'yicha) reytingi. */
function TopCampaigns({ t, promoCodes, banners, orders }) {
  const codeRevenue = useMemo(() => {
    const map = new Map();
    (orders || []).forEach((o) => {
      if (!o.promoCode || o.status === "cancelled") return;
      map.set(o.promoCode, (map.get(o.promoCode) || 0) + (Number(o.amount) || 0));
    });
    return Array.from(map.entries())
      .map(([code, revenue]) => ({ code, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const topBanners = useMemo(
    () => [...(banners || [])].filter((b) => (b.clicks || 0) > 0).sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5),
    [banners]
  );

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600">
          <Trophy size={17} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{t.topTitle}</h3>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.topCodes}</p>
          {codeRevenue.length === 0 ? (
            <p className="text-xs text-slate-400">{t.topNoData}</p>
          ) : (
            <div className="space-y-1.5">
              {codeRevenue.map((c, i) => (
                <div key={c.code} className="flex items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-semibold text-amber-600">{i + 1}</span>
                  <span className="flex-1 truncate font-mono text-xs font-semibold text-slate-700">{c.code}</span>
                  <span className="shrink-0 text-xs text-slate-500">{fmtMoney(c.revenue)} UZS {t.topRevenue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t.topBanners}</p>
          {topBanners.length === 0 ? (
            <p className="text-xs text-slate-400">{t.topNoData}</p>
          ) : (
            <div className="space-y-1.5">
              {topBanners.map((b, i) => (
                <div key={b.id} className="flex items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-50 text-[10px] font-semibold text-amber-600">{i + 1}</span>
                  <span className="flex-1 truncate text-xs font-medium text-slate-700">{b.title || "—"}</span>
                  <span className="shrink-0 text-xs text-slate-500">{b.clicks} {t.topClicks}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Promo kodlar ishlatilishini ustunli diagrammada solishtiradi. */
function PromoCodeChart({ t, promoCodes }) {
  const data = useMemo(
    () => (promoCodes || [])
      .filter((c) => (c.usedCount || 0) > 0)
      .map((c) => ({ code: c.code, used: c.usedCount || 0 }))
      .sort((a, b) => b.used - a.used),
    [promoCodes]
  );

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{t.chartTitle}</h3>
      {data.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-400">{t.chartNoData}</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="code" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="used" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

/** Telegram Mini App orqali kirgan mijozlarga ommaviy xabar yuborish (SMS o'rniga — SMS operatori ulanmagan). */
function TelegramBroadcast({ t, customers }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const recipients = useMemo(
    () => (customers || []).filter((c) => c.telegramUserId).map((c) => c.telegramUserId),
    [customers]
  );

  const send = async () => {
    if (!message.trim() || recipients.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/telegram-broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim(), chatIds: recipients }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ sent: data.sent, failed: data.failed, total: data.total });
        setMessage("");
      } else {
        setResult("error");
      }
    } catch (e) {
      console.error("Broadcast xatosi:", e);
      setResult("error");
    }
    setSending(false);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Send size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{t.broadcastTitle}</h3>
      </div>
      <p className="mb-3 text-xs text-slate-400">{t.broadcastDesc}</p>

      {recipients.length === 0 ? (
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-slate-400">{t.broadcastNoRecipients}</p>
      ) : (
        <>
          <p className="mb-2 text-xs font-medium text-emerald-600">{recipients.length} {t.broadcastRecipients}</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.broadcastPh}
            className={`${inputCls} mb-2 min-h-[80px] resize-y`}
          />
          <button
            onClick={send}
            disabled={sending || !message.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} {sending ? t.broadcastSending : t.broadcastSend}
          </button>
          {result === "error" && <p className="mt-2 text-xs text-rose-500">{t.broadcastError}</p>}
          {result && result !== "error" && (
            <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 size={13} /> {t.broadcastSuccess}: {result.sent}/{result.total}
              {result.failed > 0 && ` (${result.failed} ${t.broadcastFailed})`}
            </p>
          )}
        </>
      )}
    </div>
  );
}

/** Sanasi belgilangan bannerlar (boshlanish/tugash) va promo kod muddatlarini xronologik tartibda ko'rsatadi. */
function MarketingTimeline({ t, banners, promoCodes }) {
  const events = useMemo(() => {
    const list = [];
    (banners || []).forEach((b) => {
      if (b.startDate) list.push({ date: b.startDate, label: `${b.title || b.badge || "Banner"} — ${t.timelineBannerStart}` });
      if (b.endDate) list.push({ date: b.endDate, label: `${b.title || b.badge || "Banner"} — ${t.timelineBannerEnd}` });
    });
    (promoCodes || []).forEach((c) => {
      if (c.expiresAt) list.push({ date: c.expiresAt, label: `${c.code} — ${t.timelineCodeExpires}` });
    });
    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [banners, promoCodes, t]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-purple-600">
          <CalendarDays size={16} />
        </span>
        <h3 className="text-sm font-semibold text-slate-800">{t.timelineTitle}</h3>
      </div>
      {events.length === 0 ? (
        <p className="text-xs text-slate-400">{t.timelineEmpty}</p>
      ) : (
        <div className="space-y-1.5">
          {events.map((e, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-xs">
              <span className="shrink-0 rounded-full bg-purple-50 px-2 py-0.5 font-medium text-purple-600">{e.date}</span>
              <span className="text-slate-600">{e.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PromoCodesSection({ lang, t, promoCodes }) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_CODE);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditingId(uid()); setForm(EMPTY_CODE); setError(""); setOpen(true); };
  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({
      code: c.code || "", discountType: c.discountType || "percent", discountValue: String(c.discountValue ?? ""),
      minOrder: c.minOrder ? String(c.minOrder) : "", expiresAt: c.expiresAt || "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "", active: c.active !== false,
    });
    setError("");
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setEditingId(null); setForm(EMPTY_CODE); setError(""); };

  const submit = async () => {
    if (!form.code.trim() || !form.discountValue) { setError(t.required); return; }
    setSaving(true);
    const isNew = !promoCodes.some((c) => c.id === editingId);
    await setItem("promoCodes", editingId, {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      minOrder: Number(form.minOrder) || 0,
      expiresAt: form.expiresAt || "",
      usageLimit: Number(form.usageLimit) || 0,
      usedCount: isNew ? 0 : (promoCodes.find((c) => c.id === editingId)?.usedCount ?? 0),
      active: form.active,
    });
    setSaving(false);
    closeModal();
  };

  const remove = async (id) => { await deleteItem("promoCodes", id); };
  const toggleActive = async (c) => { await updateItem("promoCodes", c.id, { active: !(c.active !== false) }); };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{t.codesTitle}</h3>
        <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          <Plus size={16} /> {t.addCode}
        </button>
      </div>

      {promoCodes.length === 0 ? (
        <EmptyState icon={Tag} text={t.noCodes} />
      ) : (
        <div className="space-y-2">
          {promoCodes.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
              <span className="rounded-lg bg-slate-800 px-2.5 py-1.5 font-mono text-sm font-semibold text-white">{c.code}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700">
                  {c.discountType === "percent" ? `-${c.discountValue}%` : `-${fmtMoney(c.discountValue)} UZS`}
                </p>
                <p className="text-xs text-slate-400">
                  {c.usedCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ""} {t.usedCount}
                  {c.expiresAt && ` · ${c.expiresAt}`}
                </p>
              </div>
              <button onClick={() => toggleActive(c)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.active !== false ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-slate-400"}`}>
                {c.active !== false ? t.active : t.inactive}
              </button>
              <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={15} /></button>
              <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal title={editingId && promoCodes.some((c) => c.id === editingId) ? t.editCode : t.addCode} onClose={closeModal}>
          <Field label={t.codeField} error={error}>
            <input className={`${inputCls} font-mono uppercase`} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder={t.codePh} />
          </Field>
          <Field label={t.codeType}>
            <div className="grid grid-cols-2 gap-2">
              {[{ key: "percent", label: t.typePercent }, { key: "fixed", label: t.typeFixed }].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm({ ...form, discountType: opt.key })}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium ${form.discountType === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={t.codeValue}>
            <input type="number" className={inputCls} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t.minOrder}>
              <input type="number" className={inputCls} value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: e.target.value })} />
            </Field>
            <Field label={t.expiresAt}>
              <input type="date" className={inputCls} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </Field>
          </div>
          <Field label={t.usageLimit}>
            <input type="number" className={inputCls} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder={t.usageLimitHint} />
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

function SubscribersSection({ t, subscribers }) {
  const sorted = [...subscribers].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{t.subsTitle}</h3>
        {subscribers.length > 0 && (
          <button onClick={() => exportSubscribersToCSV(sorted)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-50">
            <Download size={14} /> {t.export}
          </button>
        )}
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={Mail} text={t.noSubs} />
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <tbody>
              {sorted.map((s) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-2 text-slate-700">{s.email}</td>
                  <td className="py-2 text-right text-xs text-slate-400">{s.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
