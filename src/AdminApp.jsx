// ==========================================================
// ADMIN PANEL — bu fayl faqat /admin manzili ochilganda, lazy()
// orqali tarmoqdan yuklab olinadi (src/App.jsx'ga qarang). Oddiy
// mijozlar (do'kon sahifasiga kiruvchilar) bu faylni UMUMAN
// yuklab olishmaydi — shu tufayli sayt ular uchun tezroq ochiladi.
//
// Bu fayl avval src/App.jsx ichida edi (bitta katta faylning bir
// qismi sifatida); shu sababli T (tarjimalar) va COL (Firestore
// kolleksiya nomlari) kabi umumiy narsalarni App.jsx'dan import
// qiladi — App.jsx ularni "export const" sifatida beradi.
// ==========================================================

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  LayoutGrid, ClipboardList, Users, Package, Plus, Trash2, Pencil, X,
  TrendingUp, TrendingDown, Search, Globe, CheckCircle2, Clock,
  ChevronDown, Save, AlertCircle, Loader2, ShoppingCart, ShoppingBag,
  LogIn, LogOut, Lock, Image as ImageIcon, Eye,
  MessageSquareQuote, HelpCircle, Settings as SettingsIcon, Bell, Download, Phone, Send, Copy, Tag,
  ArrowUp, ArrowDown, EyeOff, MapPin,
  Filter, CheckSquare, Square, MinusSquare,
  AlertTriangle, UserCheck, UserX, UserPlus, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { auth } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
  subscribeCollection, addItem, setItem, updateItem, deleteItem, uploadImage, adjustCustomerBonus,
} from "./storage.js";
import { T, COL } from "./App.jsx";
import {
  uid, fmtMoney, todayISO, inputCls, Modal, Field, EmptyState, StatusBadge,
  pname, discountPct, Toggle,
} from "./components/ui.jsx";
import { collectionTitle } from "./components/CategoryShowcase.jsx";
import BannerSettings from "./components/BannerSettings.jsx";
import ProductForm from "./components/ProductForm.jsx";
import TestimonialsSettings from "./components/TestimonialsSettings.jsx";
import FAQSettings from "./components/FAQSettings.jsx";
import StoreSettings from "./components/StoreSettings.jsx";
import MarketingPage from "./components/MarketingPage.jsx";
import TelegramSettings from "./components/TelegramSettings.jsx";

/**
 * Buyurtma HOLATI o'zgarganda (admin panelidan) — agar buyurtma Telegram
 * orqali berilgan bo'lsa (order.telegramUserId mavjud bo'lsa) — MIJOZNING
 * o'ziga xolat yangilanishi haqida xabar yuboradi (mahsulotlar, summa bilan).
 * Xato bo'lsa ham jim o'tkazib yuboriladi — buyurtma holati allaqachon
 * saqlangan, mijozga bu bildirishnoma faqat qo'shimcha qulaylik.
 */
async function notifyCustomerOrderStatus(order, status) {
  if (!order?.telegramUserId) return;
  try {
    const res = await fetch("/api/telegram-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        telegramUserId: order.telegramUserId,
        status,
        orderId: order.id,
        items: order.items || [],
        amount: order.amount,
        deliveryPrice: order.deliveryPrice,
      }),
    });
    if (!res.ok) {
      console.warn("Mijozga buyurtma holati xabari yuborilmadi (server javobi):", res.status);
    }
  } catch (e) {
    console.warn("Mijozga buyurtma holati xabari yuborilmadi (tarmoq xatosi):", e);
  }
}

/* ---------------------------------------------------------------
   DASHBOARD PAGE
--------------------------------------------------------------- */
function DashboardPage({ lang, orders, customers, products, setPage }) {
  const t = T[lang];
  const [period, setPeriod] = useState("week"); // "today" | "week" | "month"
  const [lowStockOpen, setLowStockOpen] = useState(false);

  const periodDays = period === "today" ? 1 : period === "week" ? 7 : 30;

  const inRange = (dateStr, startDaysAgo, endDaysAgo) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return diffDays >= endDaysAgo && diffDays < startDaysAgo;
  };

  const currentOrders = useMemo(
    () => orders.filter(o => o.status !== "cancelled" && inRange(o.date, periodDays, 0)),
    [orders, periodDays]
  );
  const previousOrders = useMemo(
    () => orders.filter(o => o.status !== "cancelled" && inRange(o.date, periodDays * 2, periodDays)),
    [orders, periodDays]
  );

  const sumAmount = (list) => list.reduce((s, o) => s + Number(o.amount || 0), 0);
  const sumCost = (list) => list.reduce((sum, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return sum + items.reduce((s, it) => s + (Number(it.costPrice) || 0) * (Number(it.qty) || 0), 0);
  }, 0);
  const sumDelivery = (list) => list.reduce((s, o) => s + (Number(o.deliveryPrice) || 0), 0);

  const revenue = sumAmount(currentOrders);
  const costTotal = sumCost(currentOrders);
  const deliveryTotal = sumDelivery(currentOrders);
  const profit = revenue - costTotal - deliveryTotal;

  const prevRevenue = sumAmount(previousOrders);
  const revenueChangePct = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const counts = useMemo(() => ({
    new: currentOrders.filter(o => o.status === "new").length,
    ready: currentOrders.filter(o => o.status === "ready").length,
    on_way: currentOrders.filter(o => o.status === "on_way").length,
    delivered: currentOrders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled" && inRange(o.date, periodDays, 0)).length,
  }), [currentOrders, orders, periodDays]);

  const chartDays = period === "month" ? 30 : 7;
  const chartData = useMemo(() => {
    const days = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRevenue = orders
        .filter(o => o.date === key && o.status !== "cancelled")
        .reduce((s, o) => s + Number(o.amount || 0), 0);
      days.push({ date: key.slice(5), revenue: dayRevenue });
    }
    return days;
  }, [orders, chartDays]);

  const recent = [...orders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const topCustomers = [...customers].sort((a, b) => (b.spent || 0) - (a.spent || 0)).slice(0, 5);

  // Eng ko'p sotilgan mahsulotlar — joriy davrdagi buyurtmalar items snapshotidan hisoblanadi.
  // Rasm uchun avval JORIY mahsulot ma'lumotidan olamiz (products), chunki buyurtma
  // ichidagi eski "imageUrl" — R2'ga o'tishdan oldingi Firebase Storage havolasi bo'lishi
  // mumkin va endi ishlamaydi (fayllar o'chirilgan); faqat mahsulot butunlay o'chirilgan
  // bo'lsa, eski buyurtma snapshotidagi havolaga qaytamiz.
  const topProducts = useMemo(() => {
    const map = new Map();
    currentOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const key = it.productId || it.productName;
        const prev = map.get(key) || { productId: it.productId, productName: it.productName, imageUrl: it.imageUrl, qty: 0, revenue: 0 };
        prev.qty += Number(it.qty) || 0;
        prev.revenue += (Number(it.qty) || 0) * (Number(it.price) || 0);
        map.set(key, prev);
      });
    });
    return Array.from(map.values())
      .map(p => {
        const live = products.find(pr => pr.id === p.productId);
        const liveThumb = live ? ((live.imageUrls && live.imageUrls[0]) || live.imageUrl || "") : "";
        return { ...p, imageUrl: liveThumb || p.imageUrl };
      })
      .sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [currentOrders, products]);

  // Kam qolgan mahsulotlar — faqat "soni bilan" turidagi, 5 tadan kam (lekin 0 emas) qoldiq.
  const lowStock = useMemo(
    () => (products || []).filter(p => (p.stockType || "limited") === "limited" && p.stock > 0 && p.stock <= 5),
    [products]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Davr tanlash */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-xl bg-white p-1 shadow-sm">
          {[
            { key: "today", label: t.dashboard.periodToday },
            { key: "week", label: t.dashboard.periodWeek },
            { key: "month", label: t.dashboard.periodMonth },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                period === opt.key ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kam qolgan mahsulotlar ogohlantirishi — standart holatda yopiq, faqat sarlavha ko'rinadi */}
      {lowStock.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50">
          <button
            type="button"
            onClick={() => setLowStockOpen(v => !v)}
            className="flex w-full items-center gap-3 p-4 text-left"
          >
            <AlertCircle className="shrink-0 text-amber-500" size={18} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-amber-800">{t.dashboard.lowStock} ({lowStock.length})</p>
              {!lowStockOpen && <p className="text-xs text-amber-700">{t.dashboard.lowStockNote}</p>}
            </div>
            <ChevronDown size={16} className={`shrink-0 text-amber-500 transition-transform ${lowStockOpen ? "rotate-180" : ""}`} />
          </button>
          {lowStockOpen && (
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              {lowStock.map(p => (
                <span key={p.id} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700">
                  {pname(p, lang)} — {p.stock} {t.common.ta}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-t-4 border-emerald-500 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400">{t.dashboard.revenue}</span>
            <TrendingUp className="text-emerald-500" size={18} />
          </div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{fmtMoney(revenue)}</span>
            <span className="text-sm font-normal text-slate-400">{t.common.uzs}</span>
          </div>
          {revenueChangePct !== null && (
            <p className={`mb-2 flex items-center gap-1 text-xs font-medium ${revenueChangePct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {revenueChangePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {revenueChangePct >= 0 ? "+" : ""}{revenueChangePct}% {t.dashboard.vsLastPeriod}
            </p>
          )}
          <div className="space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between"><span>{t.dashboard.cost}</span><span className="font-medium text-slate-700">{fmtMoney(costTotal)} {t.common.uzs}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.delivery}</span><span className="font-medium text-slate-700">{fmtMoney(deliveryTotal)} {t.common.uzs}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.profit}</span><span className={`font-medium ${profit < 0 ? "text-rose-600" : "text-slate-700"}`}>{fmtMoney(profit)} {t.common.uzs}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border-t-4 border-amber-400 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400">{t.dashboard.orders}</span>
            <ClipboardList className="text-amber-500" size={18} />
          </div>
          <div className="mb-3 text-2xl font-bold text-slate-800">{currentOrders.length + counts.cancelled} <span className="text-sm font-normal text-slate-400">{t.common.ta}</span></div>
          <div className="space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between"><span>{t.dashboard.new}</span><span className="font-medium text-slate-700">{counts.new}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.ready}</span><span className="font-medium text-slate-700">{counts.ready}</span></div>
            <div className="flex justify-between"><span>{t.orders.st.on_way}</span><span className="font-medium text-slate-700">{counts.on_way}</span></div>
            <div className="flex justify-between"><span>{t.orders.st.delivered}</span><span className="font-medium text-slate-700">{counts.delivered}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.cancelled}</span><span className="font-medium text-slate-700">{counts.cancelled}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border-t-4 border-blue-400 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400">{t.dashboard.customers}</span>
            <Users className="text-blue-500" size={18} />
          </div>
          <div className="mb-3 text-2xl font-bold text-slate-800">{customers.length} <span className="text-sm font-normal text-slate-400">{t.common.ta}</span></div>
          <div className="space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between"><span>{t.dashboard.newCustomers}</span><span className="font-medium text-slate-700">{customers.length}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.returning}</span><span className="font-medium text-slate-700">{customers.filter(c => (c.orders || 0) > 1).length}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.avgOrder}</span><span className="font-medium text-slate-700">{currentOrders.length ? fmtMoney(Math.round(revenue / currentOrders.length)) : 0} {t.common.uzs}</span></div>
          </div>
        </div>
      </div>

      {/* Tezkor harakatlar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.quickActions}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPage("products")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Package size={15} className="text-emerald-600" /> {t.dashboard.qaProduct}
          </button>
          <button onClick={() => setPage("banner")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <ImageIcon size={15} className="text-emerald-600" /> {t.dashboard.qaBanner}
          </button>
          <button onClick={() => setPage("orders")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <ClipboardList size={15} className="text-emerald-600" /> {t.dashboard.qaOrders}
          </button>
          <button onClick={() => setPage("testimonials")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <MessageSquareQuote size={15} className="text-emerald-600" /> {t.dashboard.qaTestimonial}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.chartTitle}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => [`${fmtMoney(v)} ${t.common.uzs}`, t.dashboard.revenueLabel]} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.recentOrders}</h3>
          {recent.length === 0 ? (
            <EmptyState icon={ClipboardList} text={t.dashboard.noOrders} />
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{o.customer}</p>
                    <p className="text-xs text-slate-400">{o.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">{fmtMoney(o.amount)} {t.common.uzs}</span>
                    <StatusBadge status={o.status} labels={t.orders.st} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.topProducts}</h3>
          {topProducts.length === 0 ? (
            <EmptyState icon={Package} text={t.dashboard.noTopProducts} />
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.productId || i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">{i + 1}</span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                    {p.imageUrl ? <img loading="lazy" src={p.imageUrl} alt="" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} /> : <Package size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{p.productName}</p>
                    <p className="text-xs text-slate-400">{p.qty} {t.dashboard.soldUnits}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{fmtMoney(p.revenue)} {t.common.uzs}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.topCustomers}</h3>
          {topCustomers.length === 0 ? (
            <EmptyState icon={Users} text={t.dashboard.noCustomers} />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {topCustomers.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 p-3">
                  <p className="truncate text-sm font-medium text-slate-700">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.orders || 0} {t.common.ta}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">{fmtMoney(c.spent)} {t.common.uzs}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ORDERS PAGE
--------------------------------------------------------------- */
/** Yangi buyurtma kelganda ovozli signal (fayl kerak emas — brauzerning o'z audio API'si orqali). */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn("Ovozli signal ishlamadi:", e);
  }
}

/** Joriy ro'yxatni CSV (Excel'da ochiladigan) faylga aylantirib yuklab beradi. */
function exportOrdersToCSV(list, t) {
  const headers = [t.orders.customer, t.orders.phone, t.orders.amount, t.orders.payment, t.orders.address, t.orders.status, t.orders.date];
  const rows = list.map(o => [
    o.customer || "", o.phone || "", o.amount || 0,
    t.orders.paymentLabels[o.payment] || o.payment || "",
    (o.address || "").replace(/\n/g, " "),
    t.orders.st[o.status] || o.status, o.date || "",
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `buyurtmalar-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Buyurtma ichidagi mahsulot uchun rasm manzilini aniqlaydi. Avval JORIY
 * mahsulot ma'lumotidan (products) olishga harakat qiladi — chunki
 * buyurtma yozilgan paytdagi "imageUrl" R2'ga o'tishdan oldingi Firebase
 * Storage havolasi bo'lishi mumkin va endi ishlamaydi (fayllar o'chirilgan).
 * Mahsulot topilmasa (masalan o'chirilgan bo'lsa), eski buyurtma
 * snapshotidagi havolaga qaytadi.
 */
function resolveOrderItemThumb(it, products) {
  const live = (products || []).find(p => p.id === it.productId);
  const liveThumb = live ? ((live.imageUrls && live.imageUrls[0]) || live.imageUrl || "") : "";
  return liveThumb || it.imageUrl || "";
}

function OrdersPage({ lang, orders, setOrders, customers, products }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [form, setForm] = useState({ customer: "", amount: "", status: "new" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("ready");
  const [newOrderToast, setNewOrderToast] = useState(null);

  const tabs = [
    { key: "all", label: t.orders.tabAll },
    { key: "new", label: t.orders.st.new },
    { key: "ready", label: t.orders.st.ready },
    { key: "on_way", label: t.orders.st.on_way },
    { key: "delivered", label: t.orders.st.delivered },
    { key: "cancelled", label: t.orders.st.cancelled },
  ];

  const filtered = orders
    .filter(o => activeTab === "all" || o.status === activeTab)
    .filter(o => (o.customer + " " + (o.phone || "")).toLowerCase().includes(search.toLowerCase()))
    .filter(o => !dateFrom || o.date >= dateFrom)
    .filter(o => !dateTo || o.date <= dateTo);

  // Yangi buyurtma kelganda — ovozli + vizual bildirishnoma.
  // Sahifa birinchi ochilganda (prevIdsRef hali bo'sh) hech narsa signal bermaydi,
  // faqat KEYINGI o'zgarishlarda haqiqiy yangi buyurtma kelsa ishga tushadi.
  const prevIdsRef = useRef(null);
  useEffect(() => {
    const currentIds = new Set(orders.map(o => o.id));
    if (prevIdsRef.current) {
      const arrived = orders.filter(o => o.status === "new" && !prevIdsRef.current.has(o.id));
      if (arrived.length > 0) {
        playNotificationSound();
        setNewOrderToast(arrived[0]);
        setTimeout(() => setNewOrderToast(null), 6000);
      }
    }
    prevIdsRef.current = currentIds;
  }, [orders]);

  const submit = async () => {
    if (!form.customer.trim() || !form.amount) { setError(t.common.required); return; }
    setSaving(true);
    await addItem(COL.orders, { customer: form.customer.trim(), amount: Number(form.amount), status: form.status, date: todayISO() });
    setSaving(false);
    setOpen(false);
    setForm({ customer: "", amount: "", status: "new" });
    setError("");
  };

  const remove = async (id) => {
    await deleteItem(COL.orders, id);
  };

  // Buyurtma holati "Yetkazib berildi"ga o'zgartirilganda — mijozga
  // buyurtma summasining 1%i miqdorida bonus ball yoziladi (faqat bir marta,
  // qayta-qayta "yetkazib berildi" qilib qo'yilsa ham ikki marta yozilmaydi).
  const changeStatus = async (id, status) => {
    await updateItem(COL.orders, id, { status });
    const order = orders.find(o => o.id === id);
    if (status === "delivered") {
      if (order && !order.bonusCredited) {
        const customer = customers.find(c =>
          (order.telegramUserId && c.telegramUserId === order.telegramUserId) ||
          (order.phone && c.phone === order.phone)
        );
        if (customer) {
          const bonusEarned = Math.round((Number(order.amount) || 0) * 0.01);
          await adjustCustomerBonus(customer.id, bonusEarned);
        }
        await updateItem(COL.orders, id, { bonusCredited: true });
      }
    }
    if (order) notifyCustomerOrderStatus(order, status);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id))));
  };
  const applyBulkStatus = async () => {
    await Promise.all(Array.from(selectedIds).map(id => changeStatus(id, bulkStatus)));
    setSelectedIds(new Set());
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Yangi buyurtma bildirishnomasi */}
      {newOrderToast && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <span className="flex h-8 w-8 shrink-0 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-white">
            <Bell size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">{t.orders.newOrderToast}</p>
            <p className="truncate text-xs text-emerald-700">{newOrderToast.customer} — {fmtMoney(newOrderToast.amount)} {t.common.uzs}</p>
          </div>
          <button onClick={() => setNewOrderToast(null)} className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"><X size={15} /></button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{t.orders.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.orders.searchPh}
              className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </div>
          <button onClick={() => exportOrdersToCSV(filtered, t)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Download size={16} /> {t.orders.export}
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus size={16} /> {t.orders.add}
          </button>
        </div>
      </div>

      {/* Sana oralig'i bo'yicha filtr */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium text-slate-500">{t.orders.dateFilter}:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500" />
        <span className="text-xs text-slate-400">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-medium text-rose-500 hover:underline">{t.orders.clearDates}</button>
        )}
      </div>

      {/* Status tablari */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
        {tabs.map(tab => {
          const count = tab.key === "all" ? orders.length : orders.filter(o => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.key ? "bg-emerald-600 text-white" : "bg-gray-50 text-slate-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 text-[10px] ${activeTab === tab.key ? "bg-white/20" : "bg-white text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ommaviy amal paneli — bir nechta buyurtma tanlanganda ko'rinadi */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white">
          <span className="font-medium">{selectedIds.size} {t.orders.selected}</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="rounded-lg border border-white/20 bg-slate-700 px-2 py-1.5 text-xs text-white outline-none">
            <option value="new">{t.orders.st.new}</option>
            <option value="ready">{t.orders.st.ready}</option>
            <option value="on_way">{t.orders.st.on_way}</option>
            <option value="delivered">{t.orders.st.delivered}</option>
            <option value="cancelled">{t.orders.st.cancelled}</option>
          </select>
          <button onClick={applyBulkStatus} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500">{t.orders.applyBulk}</button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-white/70 hover:text-white">{t.orders.clearSelection}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} text={t.orders.empty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-400">
                <th className="w-8 pb-2">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="pb-2 font-medium">{t.orders.customer}</th>
                <th className="pb-2 font-medium">{t.orders.phone}</th>
                <th className="pb-2 font-medium">{t.orders.items}</th>
                <th className="pb-2 font-medium">{t.orders.amount}</th>
                <th className="pb-2 font-medium">{t.orders.payment}</th>
                <th className="pb-2 font-medium">{t.orders.address}</th>
                <th className="pb-2 font-medium">{t.orders.status}</th>
                <th className="pb-2 font-medium">{t.orders.date}</th>
                <th className="pb-2 font-medium text-right">{t.orders.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} className="rounded" />
                  </td>
                  <td className="py-2.5 font-medium text-slate-700">{o.customer}</td>
                  <td className="py-2.5 text-slate-600">{o.phone || "—"}</td>
                  <td className="py-2.5 text-slate-600">
                    {Array.isArray(o.items) && o.items.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                          {resolveOrderItemThumb(o.items[0], products) ? (
                            <img loading="lazy" src={resolveOrderItemThumb(o.items[0], products)} alt="" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                          ) : (
                            <Package size={14} />
                          )}
                        </div>
                        <span className="max-w-[140px] truncate text-xs">
                          {o.items[0].productName}{o.items[0].qty > 1 ? ` ×${o.items[0].qty}` : ""}
                          {o.items.length > 1 && <span className="text-slate-400"> +{o.items.length - 1}</span>}
                        </span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="py-2.5 text-slate-600">{fmtMoney(o.amount)} {t.common.uzs}</td>
                  <td className="py-2.5 text-slate-600">
                    {o.payment ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {t.orders.paymentLabels[o.payment] || o.payment}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="max-w-[160px] truncate py-2.5 text-slate-500" title={o.address || ""}>
                    {o.address ? (
                      <span className="inline-flex items-center gap-1">
                        {o.location && <MapPin size={12} className="shrink-0 text-emerald-500" />}
                        <span className="truncate">{o.address}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2.5">
                    <select value={o.status} onChange={e => changeStatus(o.id, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-xs outline-none">
                      <option value="new">{t.orders.st.new}</option>
                      <option value="ready">{t.orders.st.ready}</option>
                      <option value="on_way">{t.orders.st.on_way}</option>
                      <option value="delivered">{t.orders.st.delivered}</option>
                      <option value="cancelled">{t.orders.st.cancelled}</option>
                    </select>
                  </td>
                  <td className="py-2.5 text-slate-500">{o.date}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedOrder(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => remove(o.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title={t.orders.add} onClose={() => setOpen(false)}>
          <Field label={t.orders.customer} error={error && !form.customer ? error : ""}>
            <select className={inputCls} value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
              <option value="">—</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={t.orders.amount} error={error && !form.amount ? error : ""}>
            <input type="number" className={inputCls} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label={t.orders.status}>
            <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="new">{t.orders.st.new}</option>
              <option value="ready">{t.orders.st.ready}</option>
              <option value="on_way">{t.orders.st.on_way}</option>
              <option value="delivered">{t.orders.st.delivered}</option>
              <option value="cancelled">{t.orders.st.cancelled}</option>
            </select>
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </Modal>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) || selectedOrder}
          t={t}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onChangeStatus={changeStatus}
        />
      )}
    </div>
  );
}

/** Admin panelda buyurtma bosilganda ochiladigan to'liq detail oynasi. */
function OrderDetailModal({ order, t, products, onClose, onChangeStatus }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const [deliveryPrice, setDeliveryPrice] = useState(String(order.deliveryPrice ?? ""));
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [note, setNote] = useState(order.note || "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const saveDeliveryPrice = async () => {
    setSavingDelivery(true);
    await updateItem(COL.orders, order.id, { deliveryPrice: Number(deliveryPrice) || 0 });
    setSavingDelivery(false);
  };

  const saveNote = async () => {
    setSavingNote(true);
    await updateItem(COL.orders, order.id, { note: note.trim() });
    setSavingNote(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{t.orders.detailTitle} #{order.id.slice(-6).toUpperCase()}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {/* Mijoz ma'lumotlari */}
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{t.orders.customer}</p>
              <p className="font-medium text-slate-700">{order.customer || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.orders.phone}</p>
              <p className="font-medium text-slate-700">{order.phone || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400">{t.orders.address}</p>
              <p className="font-medium text-slate-700">{order.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.orders.payment}</p>
              <p className="font-medium text-slate-700">{t.orders.paymentLabels[order.payment] || order.payment || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-400">{t.orders.status}</p>
              <select
                value={order.status}
                onChange={(e) => onChangeStatus(order.id, e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none"
              >
                <option value="new">{t.orders.st.new}</option>
                <option value="ready">{t.orders.st.ready}</option>
                <option value="on_way">{t.orders.st.on_way}</option>
                <option value="delivered">{t.orders.st.delivered}</option>
                <option value="cancelled">{t.orders.st.cancelled}</option>
              </select>
            </div>
          </div>

          {/* Mijoz bilan bog'lanish */}
          {(order.phone || order.telegramUsername) && (
            <div className="mb-4 flex gap-2">
              {order.phone && (
                <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Phone size={14} /> {t.orders.call}
                </a>
              )}
              {order.telegramUsername && (
                <a href={`https://t.me/${order.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Send size={14} /> {t.orders.messageTelegram}
                </a>
              )}
            </div>
          )}

          {/* Yetkazib berish narxi */}
          <div className="mb-4 rounded-xl border border-gray-100 p-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.orders.deliveryPrice}</p>
            <div className="flex gap-2">
              <input
                type="number"
                className={inputCls}
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(e.target.value)}
                placeholder={t.orders.deliveryPriceHint}
              />
              <button
                onClick={saveDeliveryPrice}
                disabled={savingDelivery}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingDelivery ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {t.orders.saveDelivery}
              </button>
            </div>
          </div>

          {/* Admin eslatmasi */}
          <div className="mb-4 rounded-xl border border-gray-100 p-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.orders.note}</p>
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.orders.noteHint}
            />
            <div className="mt-1.5 flex items-center gap-2">
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {t.orders.saveDelivery}
              </button>
              {noteSaved && <span className="text-xs text-emerald-600">{t.common.saved || "✓"}</span>}
            </div>
          </div>

          {/* Mahsulotlar ro'yxati */}
          <p className="mb-2 text-sm font-semibold text-slate-700">{t.orders.items}</p>
          {items.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400">—</p>
          ) : (
            <div className="mb-4 space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                    {resolveOrderItemThumb(it, products) ? (
                      <img loading="lazy" src={resolveOrderItemThumb(it, products)} alt={it.productName} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <Package size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{it.productName}</p>
                    <p className="text-xs text-slate-400">{it.qty} × {fmtMoney(it.price)} {t.common.uzs}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{fmtMoney(it.qty * it.price)} {t.common.uzs}</p>
                </div>
              ))}
            </div>
          )}

          {/* Jami summa */}
          {order.promoCode && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs">
              <span className="font-medium text-rose-600">🏷️ {order.promoCode}</span>
              <span className="text-rose-600">-{fmtMoney(order.promoDiscount || 0)} {t.common.uzs}</span>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <span className="text-sm font-medium text-slate-600">{t.orders.total}</span>
            <span className="text-base font-bold text-slate-800">{fmtMoney(order.amount)} {t.common.uzs}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
/** Mijoz darajasini xarid summasi/soni asosida avtomatik aniqlaydi. */
function customerTier(c) {
  const spent = Number(c.spent) || 0;
  const ordersCount = Number(c.orders) || 0;
  if (spent >= 1000000) return "vip";
  if (ordersCount >= 2 || spent >= 300000) return "active";
  return "new";
}

function TierBadge({ tier, t }) {
  const map = {
    vip: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    new: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const labels = { vip: t.customers.tierVip, active: t.customers.tierActive, new: t.customers.tierNew };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[tier]}`}>
      {labels[tier]}
    </span>
  );
}

/** Joriy mijozlar ro'yxatini CSV faylga aylantirib yuklab beradi. */
function exportCustomersToCSV(list, t) {
  const headers = [t.customers.name, t.customers.phone, t.customers.orders, t.customers.spent, t.customers.date];
  const rows = list.map(c => [c.name || "", c.phone || "", c.orders || 0, c.spent || 0, c.date || ""]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mijozlar-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CustomersPage({ lang, customers, setCustomers, orders, products }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = qo'shish
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [form, setForm] = useState({ name: "", phone: "", bonusPoints: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filtered = useMemo(() => {
    let list = customers.filter(c => (c.name + c.phone).toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "spent") list = [...list].sort((a, b) => (b.spent || 0) - (a.spent || 0));
    else if (sortBy === "orders") list = [...list].sort((a, b) => (b.orders || 0) - (a.orders || 0));
    else if (sortBy === "name") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || "")); // eng yangi birinchi
    return list;
  }, [customers, search, sortBy]);

  // Umumiy statistika: jami/faol/passiv/yangi mijozlar soni.
  // "Faol" — so'nggi 30 kun ichida (bekor qilinmagan) buyurtma bergan mijoz;
  // "Passiv" — qolgan hammasi (hech qachon buyurtma bermagan yoki uzoq vaqtdan
  // beri bermagan); "Yangi" — so'nggi 7 kun ichida ro'yxatdan o'tgan mijoz.
  const ACTIVE_WINDOW_DAYS = 30;
  const NEW_WINDOW_DAYS = 7;
  const customerStats = useMemo(() => {
    const activeCutoff = new Date();
    activeCutoff.setDate(activeCutoff.getDate() - ACTIVE_WINDOW_DAYS);
    const activeCutoffISO = activeCutoff.toISOString().slice(0, 10);
    const newCutoff = new Date();
    newCutoff.setDate(newCutoff.getDate() - NEW_WINDOW_DAYS);
    const newCutoffISO = newCutoff.toISOString().slice(0, 10);

    let active = 0;
    let fresh = 0;
    customers.forEach((c) => {
      const hasRecentOrder = orders.some((o) =>
        o.status !== "cancelled" &&
        (o.date || "") >= activeCutoffISO &&
        ((c.phone && o.phone === c.phone) || (c.telegramUserId && o.telegramUserId === c.telegramUserId))
      );
      if (hasRecentOrder) active++;
      if ((c.date || "") >= newCutoffISO) fresh++;
    });
    return { total: customers.length, active, passive: customers.length - active, fresh };
  }, [customers, orders]);

  const openAdd = () => { setEditingId(null); setForm({ name: "", phone: "", bonusPoints: "" }); setError(""); setOpen(true); };
  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name || "", phone: c.phone || "", bonusPoints: String(c.bonusPoints || 0) });
    setError("");
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setError(t.common.required); return; }
    setSaving(true);
    const data = { name: form.name.trim(), phone: form.phone.trim(), bonusPoints: Number(form.bonusPoints) || 0 };
    if (editingId) {
      await updateItem(COL.customers, editingId, data);
    } else {
      await addItem(COL.customers, { ...data, orders: 0, spent: 0, date: todayISO() });
    }
    setSaving(false);
    setOpen(false);
    setEditingId(null);
    setForm({ name: "", phone: "", bonusPoints: "" });
    setError("");
  };

  const remove = async (id) => {
    await deleteItem(COL.customers, id);
  };

  // Mijoz tarixidagi biror buyurtma bosilganda to'liq detail oyna ochiladi.
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Xuddi "Buyurtmalar" bo'limidagidek — holat "Yetkazib berildi"ga
  // o'zgartirilsa, mijozga buyurtma summasining 1%i bonus sifatida yoziladi.
  const changeOrderStatus = async (id, status) => {
    await updateItem(COL.orders, id, { status });
    const order = orders.find(o => o.id === id);
    if (status === "delivered") {
      if (order && !order.bonusCredited) {
        const customer = customers.find(c =>
          (order.telegramUserId && c.telegramUserId === order.telegramUserId) ||
          (order.phone && c.phone === order.phone)
        );
        if (customer) {
          const bonusEarned = Math.round((Number(order.amount) || 0) * 0.01);
          await adjustCustomerBonus(customer.id, bonusEarned);
        }
        await updateItem(COL.orders, id, { bonusCredited: true });
      }
    }
    if (order) notifyCustomerOrderStatus(order, status);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t.customers.statTotal, value: customerStats.total, icon: Users, color: "text-slate-700 bg-slate-50" },
          { label: t.customers.statActive, hint: t.customers.statActiveHint, value: customerStats.active, icon: UserCheck, color: "text-emerald-700 bg-emerald-50" },
          { label: t.customers.statPassive, hint: t.customers.statPassiveHint, value: customerStats.passive, icon: UserX, color: "text-slate-500 bg-slate-50" },
          { label: t.customers.statNew, hint: t.customers.statNewHint, value: customerStats.fresh, icon: UserPlus, color: "text-blue-700 bg-blue-50" },
        ].map(({ label, hint, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl bg-white p-3.5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full ${color}`}>
                <Icon size={15} />
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            {hint && <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{t.customers.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.customers.searchPh}
              className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-emerald-500">
            <option value="date">{t.customers.sortDate}</option>
            <option value="spent">{t.customers.sortSpent}</option>
            <option value="orders">{t.customers.sortOrders}</option>
            <option value="name">{t.customers.sortName}</option>
          </select>
          <button onClick={() => exportCustomersToCSV(filtered, t)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Download size={16} /> {t.orders.export}
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus size={16} /> {t.customers.add}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} text={t.customers.empty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">{t.customers.name}</th>
                <th className="pb-2 font-medium">{t.customers.tier}</th>
                <th className="pb-2 font-medium">{t.customers.phone}</th>
                <th className="pb-2 font-medium">{t.customers.email}</th>
                <th className="pb-2 font-medium">{t.customers.orders}</th>
                <th className="pb-2 font-medium">{t.customers.spent}</th>
                <th className="pb-2 font-medium">{t.customers.date}</th>
                <th className="pb-2 font-medium text-right">{t.customers.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2.5"><TierBadge tier={customerTier(c)} t={t} /></td>
                  <td className="py-2.5 text-slate-600">{c.phone}</td>
                  <td className="py-2.5 text-slate-600">{c.email || "—"}</td>
                  <td className="py-2.5 text-slate-600">{c.orders || 0}</td>
                  <td className="py-2.5 text-slate-600">{fmtMoney(c.spent)} {t.common.uzs}</td>
                  <td className="py-2.5 text-slate-500">{c.date}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title={editingId ? t.customers.edit : t.customers.add} onClose={() => setOpen(false)}>
          <Field label={t.customers.name} error={error && !form.name ? error : ""}>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t.customers.phone} error={error && !form.phone ? error : ""}>
            <input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" />
          </Field>
          <Field label={t.customers.bonusPoints}>
            <input type="number" min="0" className={inputCls} value={form.bonusPoints} onChange={e => setForm({ ...form, bonusPoints: e.target.value })} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </Modal>
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={customers.find(c => c.id === selectedCustomer.id) || selectedCustomer}
          orders={orders}
          products={products}
          t={t}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => { setSelectedCustomer(null); openEdit(selectedCustomer); }}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) || selectedOrder}
          t={t}
          products={products}
          onClose={() => setSelectedOrder(null)}
          onChangeStatus={changeOrderStatus}
        />
      )}
      </div>
    </div>
  );
}

/** Mijoz bosilganda ochiladigan detail oyna — buyurtmalar tarixi va bonus ballar bilan. */
function CustomerDetailModal({ customer, orders, products, t, onClose, onEdit, onSelectOrder }) {
  const [pointsInput, setPointsInput] = useState("");
  const [savingPoints, setSavingPoints] = useState(false);

  const customerOrders = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      const matches = (customer.phone && o.phone === customer.phone) || (customer.telegramUserId && o.telegramUserId === customer.telegramUserId);
      if (matches) map.set(o.id, o);
    });
    return Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [orders, customer]);

  const adjustPoints = async (delta) => {
    const amount = delta === 0 ? Number(pointsInput) || 0 : delta;
    if (amount === 0) return;
    setSavingPoints(true);
    // Manfiy tomonga (ayirishda) balansdan ko'proq ayirib, minusga tushib
    // ketmasligi uchun cheklaymiz; increment() ATOMIK bo'lgani uchun
    // boshqa joyda bir vaqtda bo'layotgan o'zgarish bilan to'qnashmaydi.
    const safeAmount = amount < 0 ? -Math.min(-amount, Number(customer.bonusPoints) || 0) : amount;
    await adjustCustomerBonus(customer.id, safeAmount);
    setSavingPoints(false);
    setPointsInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{customer.name}</h3>
            <TierBadge tier={customerTier(customer)} t={t} />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={16} /></button>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {/* Asosiy ma'lumot */}
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{t.customers.phone}</p>
              <p className="font-medium text-slate-700">{customer.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.email}</p>
              <p className="truncate font-medium text-slate-700">{customer.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.orders}</p>
              <p className="font-medium text-slate-700">{customer.orders || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.spent}</p>
              <p className="font-medium text-slate-700">{fmtMoney(customer.spent)} {t.common.uzs}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.date}</p>
              <p className="font-medium text-slate-700">{customer.date || "—"}</p>
            </div>
          </div>

          {/* Bog'lanish */}
          {(customer.phone || customer.telegramUsername) && (
            <div className="mb-4 flex gap-2">
              {customer.phone && (
                <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Phone size={14} /> {t.orders.call}
                </a>
              )}
              {customer.telegramUsername && (
                <a href={`https://t.me/${customer.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Send size={14} /> {t.orders.messageTelegram}
                </a>
              )}
            </div>
          )}

          {/* Manzillar */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-slate-700">{t.customers.addresses}</p>
            {Array.isArray(customer.addresses) && customer.addresses.length > 0 ? (
              <div className="space-y-1.5">
                {customer.addresses.map((addr) => (
                  <div key={addr.id} className="flex items-start gap-2 rounded-xl border border-gray-100 p-2.5 text-xs text-slate-600">
                    <MapPin size={14} className="mt-0.5 shrink-0 text-rose-400" />
                    <span className="min-w-0 flex-1 break-words">{addr.text}</span>
                    {addr.lat != null && addr.lng != null && (
                      <a
                        href={`https://www.google.com/maps?q=${addr.lat},${addr.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 whitespace-nowrap text-emerald-600 hover:underline"
                      >
                        {t.customers.onMap}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">{t.customers.noAddresses}</p>
            )}
          </div>

          {/* Bonus ballar */}
          <div className="mb-4 rounded-xl border border-gray-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">{t.customers.bonusPoints}</p>
              <p className="text-lg font-bold text-amber-500">{customer.bonusPoints || 0}</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className={inputCls}
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder={t.customers.pointsHint}
              />
              <button onClick={() => adjustPoints(0)} disabled={savingPoints || !pointsInput} className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                <Plus size={13} /> {t.customers.addPoints}
              </button>
            </div>
          </div>

          {/* Buyurtmalar tarixi — bosilganda to'liq detail (suratlar bilan) ochiladi */}
          <p className="mb-2 text-sm font-semibold text-slate-700">{t.customers.orderHistory}</p>
          {customerOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} text={t.dashboard.noOrders} />
          ) : (
            <div className="space-y-2">
              {customerOrders.map(o => {
                const items = Array.isArray(o.items) ? o.items : [];
                return (
                  <button
                    key={o.id}
                    onClick={() => onSelectOrder(o)}
                    className="w-full rounded-xl border border-gray-100 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{o.date}</span>
                      <StatusBadge status={o.status} labels={t.orders.st} />
                    </div>
                    {items.length > 0 && (
                      <div className="mb-2 flex -space-x-2">
                        {items.slice(0, 5).map((it, i) => (
                          <div key={i} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-gray-50 text-slate-300 shadow-sm">
                            {resolveOrderItemThumb(it, products) ? (
                              <img loading="lazy" src={resolveOrderItemThumb(it, products)} alt={it.productName} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <Package size={14} />
                            )}
                          </div>
                        ))}
                        {items.length > 5 && (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-semibold text-slate-500 shadow-sm">
                            +{items.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="truncate text-xs text-slate-500">
                        {items.map(it => `${it.productName} ×${it.qty}`).join(", ") || "—"}
                      </p>
                      <p className="shrink-0 pl-2 text-sm font-semibold text-slate-800">{fmtMoney(o.amount)} {t.common.uzs}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PRODUCTS PAGE
--------------------------------------------------------------- */
/** Joriy mahsulot ro'yxatini CSV faylga aylantirib yuklab beradi. */
function exportProductsToCSV(list, t, lang) {
  const headers = [t.products.name, t.products.brand, t.products.category, t.products.price, t.products.oldPrice, t.products.stock];
  const rows = list.map(p => [pname(p, lang) || "", p.brand || "", p.category || "", p.price || 0, p.oldPrice || 0, p.stockType === "unlimited" ? t.products.unlimited : p.stockType === "out" ? 0 : (p.stock ?? 0)]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mahsulotlar-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Kategoriya yoki brendlarni boshqarish oynasi (ikkisi uchun ham bir xil
 * komponent ishlatiladi). Nomi o'zgartirilsa yoki o'chirilsa, shu
 * kategoriya/brendga tegishli barcha mahsulotlar ham avtomatik yangilanadi.
 */
function TaxonomyModal({ title, items, collectionName, productField, products, onClose, t }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const countFor = (name) => products.filter(p => p[productField] === name).length;

  const startEdit = (item) => { setEditingId(item.id); setEditValue(item.name); };
  const cancelEdit = () => { setEditingId(null); setEditValue(""); };

  const saveEdit = async (item) => {
    const newName = editValue.trim();
    if (!newName || newName === item.name) { cancelEdit(); return; }
    setBusy(true);
    await updateItem(collectionName, item.id, { name: newName });
    const affected = products.filter(p => p[productField] === item.name);
    await Promise.all(affected.map(p => updateItem(COL.products, p.id, { [productField]: newName })));
    setBusy(false);
    cancelEdit();
  };

  const remove = async (item) => {
    setBusy(true);
    await deleteItem(collectionName, item.id);
    const affected = products.filter(p => p[productField] === item.name);
    await Promise.all(affected.map(p => updateItem(COL.products, p.id, { [productField]: "" })));
    setBusy(false);
  };

  const addNew = async () => {
    const name = newValue.trim();
    if (!name) return;
    const exists = items.some(i => i.name.toLowerCase() === name.toLowerCase());
    if (exists) { setNewValue(""); return; }
    setBusy(true);
    await addItem(collectionName, { name });
    setBusy(false);
    setNewValue("");
  };

  const uploadItemImage = async (item, file) => {
    if (!file) return;
    setUploadingId(item.id);
    try {
      const url = await uploadImage(`${collectionName}/${item.id}/image`, file);
      await updateItem(collectionName, item.id, { imageUrl: url });
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploadingId(null);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="mb-3 flex gap-2">
        <input
          className={inputCls}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addNew(); }}
          placeholder={t.products.newItemPh}
        />
        <button onClick={addNew} disabled={busy || !newValue.trim()} className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          <Plus size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Tag} text={t.products.noItems} />
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
              <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300 hover:bg-gray-100">
                {uploadingId === item.id ? (
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                ) : item.imageUrl ? (
                  <img loading="lazy" src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={14} />
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingId === item.id}
                  onChange={(e) => uploadItemImage(item, e.target.files?.[0])} />
              </label>
              {editingId === item.id ? (
                <>
                  <input
                    autoFocus
                    className={inputCls}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item); if (e.key === "Escape") cancelEdit(); }}
                  />
                  <button onClick={() => saveEdit(item)} disabled={busy} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"><Save size={15} /></button>
                  <button onClick={cancelEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm text-slate-700">
                    {item.name} <span className="text-xs text-slate-400">({countFor(item.name)} {t.common.ta})</span>
                  </span>
                  <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={15} /></button>
                  <button onClick={() => remove(item)} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/**
 * "O'zingizga mos uslubni toping" bo'limi uchun to'plamlarni (kolleksiyalarni)
 * boshqarish oynasi. Har bir to'plam: sarlavha, o'zingiz yuklagan rasm, va
 * unga biriktirilgan mahsulotlar ro'yxati — mijoz bosganda faqat o'sha
 * mahsulotlar ko'rinadi.
 */
function CollectionsModal({ lang, collections, products, categories, brands, onClose, t }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = yangi

  const sorted = [...collections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const remove = async (item) => { await deleteItem(COL.collections, item.id); };
  const toggleActive = async (item) => { await updateItem(COL.collections, item.id, { active: !(item.active !== false) }); };
  const move = async (item, direction) => {
    const idx = sorted.findIndex((x) => x.id === item.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      updateItem(COL.collections, item.id, { order: swapWith.order ?? 0 }),
      updateItem(COL.collections, swapWith.id, { order: item.order ?? 0 }),
    ]);
  };

  return (
    <>
      <Modal title={t.products.collectionsBtn} onClose={onClose}>
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => { setEditingItem(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={14} /> {t.products.collectionAdd}
          </button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={LayoutGrid} text={t.products.collectionEmpty} />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {sorted.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                  {item.imageUrl ? <img loading="lazy" src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{collectionTitle(item, lang) || "—"}</p>
                  <p className="text-xs text-slate-400">{(item.productIds || []).length} {t.common.ta} · {item.displayStyle === "banner" ? t.products.collectionStyleBanner : item.displayStyle === "heroBanner" ? t.products.collectionStyleHero : item.displayStyle === "cardBottom" ? t.products.collectionStyleCardBottom : t.products.collectionStyleCard}</p>
                </div>
                <button onClick={() => move(item, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button onClick={() => move(item, 1)} disabled={i === sorted.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30"><ArrowDown size={14} /></button>
                <button onClick={() => toggleActive(item)} className={`rounded-lg p-1.5 ${item.active !== false ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-gray-50"}`}>
                  {item.active !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => { setEditingItem(item); setFormOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={14} /></button>
                <button onClick={() => remove(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {formOpen && (
        <CollectionFormModal
          lang={lang}
          item={editingItem}
          collections={collections}
          products={products}
          categories={categories}
          brands={brands}
          onClose={() => setFormOpen(false)}
          t={t}
        />
      )}
    </>
  );
}

function CollectionFormModal({ lang, item, collections, products, categories, brands, onClose, t }) {
  const isNew = !item;
  const [titleUz, setTitleUz] = useState(item?.titleUz || item?.title || "");
  const [titleRu, setTitleRu] = useState(item?.titleRu || "");
  const [descriptionUz, setDescriptionUz] = useState(item?.descriptionUz || item?.description || "");
  const [descriptionRu, setDescriptionRu] = useState(item?.descriptionRu || "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [productIds, setProductIds] = useState(item?.productIds || []);
  const [active, setActive] = useState(item?.active !== false);
  const [displayStyle, setDisplayStyle] = useState(item?.displayStyle || "banner");
  const [discountPercent, setDiscountPercent] = useState(item?.discountPercent || 0);
  const [showTotalCalc, setShowTotalCalc] = useState(item ? item.showTotalCalc !== false : false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productBrandFilter, setProductBrandFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const id = item?.id || uid();

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(`collections/${id}/image`, file);
      setImageUrl(url);
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploading(false);
  };

  const toggleProduct = (pid) => {
    setProductIds((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
  };

  const filteredProducts = products
    .filter((p) => pname(p, lang).toLowerCase().includes(productSearch.toLowerCase()))
    .filter((p) => !productCategoryFilter || p.category === productCategoryFilter)
    .filter((p) => !productBrandFilter || p.brand === productBrandFilter);

  /** Ro'yxatdagi (qidiruv/filtr natijasidagi) barcha mahsulotlarni bir bosishda belgilash/olib tashlash. */
  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((fid) => productIds.includes(fid));
    setProductIds((prev) => (
      allSelected
        ? prev.filter((pid) => !filteredIds.includes(pid))
        : Array.from(new Set([...prev, ...filteredIds]))
    ));
  };

  const submit = async () => {
    if (!titleUz.trim() && !titleRu.trim()) { setError(t.common.required); return; }
    setSaving(true);
    await setItem(COL.collections, id, {
      titleUz: titleUz.trim(),
      titleRu: titleRu.trim(),
      descriptionUz: descriptionUz.trim(),
      descriptionRu: descriptionRu.trim(),
      imageUrl,
      productIds,
      active,
      displayStyle,
      discountPercent: Math.max(0, Math.min(90, Number(discountPercent) || 0)),
      showTotalCalc,
      order: isNew ? collections.length : (item.order ?? 0),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={isNew ? t.products.collectionAdd : t.products.collectionEdit} onClose={onClose}>
      <Field label={t.products.collectionTitleUz} error={error}>
        <input className={inputCls} value={titleUz} onChange={(e) => setTitleUz(e.target.value)} placeholder={t.products.collectionTitlePh} />
      </Field>
      <Field label={t.products.collectionTitleRu}>
        <input className={inputCls} value={titleRu} onChange={(e) => setTitleRu(e.target.value)} placeholder={t.products.collectionTitleRuPh} />
      </Field>

      <Field label={t.products.collectionDescriptionUz}>
        <textarea
          className={`${inputCls} min-h-[60px] resize-y`}
          value={descriptionUz}
          onChange={(e) => setDescriptionUz(e.target.value)}
          placeholder={t.products.collectionDescriptionPh}
        />
      </Field>
      <Field label={t.products.collectionDescriptionRu}>
        <textarea
          className={`${inputCls} min-h-[60px] resize-y`}
          value={descriptionRu}
          onChange={(e) => setDescriptionRu(e.target.value)}
          placeholder={t.products.collectionDescriptionRuPh}
        />
      </Field>

      <Field label={t.products.collectionImage}>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-slate-300">
            {imageUrl ? <img loading="lazy" src={imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} />}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
            {uploading ? t.common.saving : t.products.collectionUpload}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0])} />
          </label>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">
          {t.products.collectionImageSizeLabel} {displayStyle === "heroBanner" ? "750×1200" : "950×400"}
        </p>
      </Field>

      <Field label={t.products.collectionStyle}>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDisplayStyle("banner")}
            className={`rounded-lg border px-2.5 py-2.5 text-xs font-medium ${displayStyle === "banner" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}
          >
            {t.products.collectionStyleBanner}
            <span className="mt-1 block text-[10px] font-normal text-slate-400">{t.products.collectionStyleBannerHint}</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayStyle("heroBanner")}
            className={`rounded-lg border px-2.5 py-2.5 text-xs font-medium ${displayStyle === "heroBanner" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}
          >
            {t.products.collectionStyleHero}
            <span className="mt-1 block text-[10px] font-normal text-slate-400">{t.products.collectionStyleHeroHint}</span>
          </button>
        </div>
      </Field>

      {displayStyle === "banner" && (
        <Field label={t.products.collectionDiscount}>
          <input
            type="number"
            min={0}
            max={90}
            className={inputCls}
            value={discountPercent || ""}
            onChange={(e) => setDiscountPercent(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="0"
          />
          <p className="mt-1 text-[11px] text-slate-400">{t.products.collectionDiscountHint}</p>
        </Field>
      )}

      <div className="mb-3 rounded-lg border border-gray-100 p-3">
        <p className="mb-1 text-xs font-medium text-slate-600">{t.products.collectionProducts}</p>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">{productIds.length} {t.common.ta} {t.products.collectionSelected}</p>
          {filteredProducts.length > 0 && (() => {
            const filteredIds = filteredProducts.map((p) => p.id);
            const selectedInView = filteredIds.filter((fid) => productIds.includes(fid)).length;
            const allSelected = selectedInView === filteredIds.length;
            const someSelected = selectedInView > 0 && !allSelected;
            const Icon = allSelected ? CheckSquare : someSelected ? MinusSquare : Square;
            return (
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-emerald-600"
              >
                <Icon size={14} /> {allSelected ? t.products.deselectAll : t.products.selectAll}
              </button>
            );
          })()}
        </div>
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} pl-8 text-xs`}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder={t.products.searchPh}
          />
        </div>
        <div className="mb-2 grid grid-cols-2 gap-2">
          <select
            className={`${inputCls} text-xs`}
            value={productCategoryFilter}
            onChange={(e) => setProductCategoryFilter(e.target.value)}
          >
            <option value="">{t.store.allCategories}</option>
            {(categories || []).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select
            className={`${inputCls} text-xs`}
            value={productBrandFilter}
            onChange={(e) => setProductBrandFilter(e.target.value)}
          >
            <option value="">{t.store.allBrands}</option>
            {(brands || []).map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {filteredProducts.map((p) => {
            const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
            const checked = productIds.includes(p.id);
            return (
              <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-xs ${checked ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} className="rounded" />
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 text-slate-300">
                  {thumb ? <img loading="lazy" src={thumb} alt="" className="h-full w-full object-cover" /> : <Package size={12} />}
                </div>
                <span className="flex-1 truncate">{pname(p, lang)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <div>
          <span className="block text-xs font-medium text-slate-600">{t.products.showTotalCalc}</span>
          <span className="block text-[10px] text-slate-400">{t.products.showTotalCalcHint}</span>
        </div>
        <Toggle checked={showTotalCalc} onChange={setShowTotalCalc} />
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span className="text-xs font-medium text-slate-600">{active ? t.products.active : t.products.inactive}</span>
        <Toggle checked={active} onChange={setActive} />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
        <button onClick={submit} disabled={saving || uploading} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.common.saving : t.common.save}
        </button>
      </div>
    </Modal>
  );
}

/** Ko'p tanlashli filtr dropdown (kategoriya/brend uchun) — tashqariga bosilganda o'zi yopiladi. */
function FilterDropdown({ label, items, selected, onToggle, onClear, clearLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);
  const count = selected.size;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${count > 0 ? "border-emerald-400 bg-emerald-50 text-emerald-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
      >
        {count > 0 ? `${label} (${count})` : label}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 z-20 mt-1.5 max-h-72 w-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {count > 0 && (
            <button type="button" onClick={onClear} className="mb-1 flex w-full items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50">
              <X size={12} /> {clearLabel}
            </button>
          )}
          {items.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-slate-400">—</p>
          ) : items.map(it => (
            <label key={it.name} className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm hover:bg-slate-50">
              <input type="checkbox" checked={selected.has(it.name)} onChange={() => onToggle(it.name)} className="rounded" />
              <span className="flex-1 truncate text-slate-700">{it.name}</span>
              <span className="text-xs text-slate-400">{it.count}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsPage({ lang, products, categories, brands, collections }) {
  const t = T[lang];
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = qo'shish
  const [search, setSearch] = useState("");
  const [activeCategories, setActiveCategories] = useState(() => new Set());
  const [activeBrands, setActiveBrands] = useState(() => new Set());
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [quickEdit, setQuickEdit] = useState(null); // { id, field }
  const [quickEditValue, setQuickEditValue] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  /** Mahsulot "mavjud"mi — cheksiz yoki sonli-va-qoldiq bor bo'lsa mavjud, aks holda tugagan. */
  const isInStock = (p) => p.stockType === "unlimited" || (p.stockType !== "out" && (p.stock || 0) > 0);

  /** Qoldiq "kam" hisoblanadimi — faqat sonli (limited) turdagi, mavjud, lekin 5 tadan kam qolgan mahsulotlar. */
  const LOW_STOCK_THRESHOLD = 5;
  const isLowStock = (p) => (p.stockType || "limited") === "limited" && (p.stock || 0) > 0 && (p.stock || 0) <= LOW_STOCK_THRESHOLD;
  const lowStockCount = useMemo(() => products.filter(isLowStock).length, [products]);

  /** Kategoriya/brend ro'yxatlari alifbo bo'yicha tartiblangan (chiplar ketma-ketligi barqaror bo'lishi uchun). */
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => (a.name || "").localeCompare(b.name || "", "uz")), [categories]);
  const sortedBrands = useMemo(() => [...brands].sort((a, b) => (a.name || "").localeCompare(b.name || "", "uz")), [brands]);

  const filtered = useMemo(() => {
    let list = products
      .filter(p => pname(p, lang).toLowerCase().includes(search.toLowerCase()))
      .filter(p => activeCategories.size === 0 || activeCategories.has(p.category))
      .filter(p => activeBrands.size === 0 || activeBrands.has(p.brand))
      .filter(p => {
        if (stockFilter === "all") return true;
        if (stockFilter === "in") return isInStock(p);
        if (stockFilter === "low") return isLowStock(p);
        return !isInStock(p);
      });
    if (sortBy === "priceAsc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "priceDesc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "stock") list = [...list].sort((a, b) => (a.stock ?? 99999) - (b.stock ?? 99999));
    else if (sortBy === "rating") list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else list = [...list].sort((a, b) => pname(a, lang).localeCompare(pname(b, lang)));
    return list;
  }, [products, search, activeCategories, activeBrands, stockFilter, sortBy, lang]);

  /** Filtr/qidiruv o'zgarganda birinchi sahifaga qaytamiz. */
  useEffect(() => { setPage(1); }, [search, activeCategories, activeBrands, stockFilter, sortBy, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const paginated = useMemo(() => filtered.slice((pageSafe - 1) * pageSize, pageSafe * pageSize), [filtered, pageSafe, pageSize]);
  /** Sahifalash tugmalari uchun raqamlar ro'yxati — ko'p bo'lsa "…" bilan qisqartiriladi. */
  const pageNumbers = useMemo(() => {
    const nums = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) nums.push(i); return nums; }
    nums.push(1);
    if (pageSafe > 3) nums.push("…");
    for (let i = Math.max(2, pageSafe - 1); i <= Math.min(totalPages - 1, pageSafe + 1); i++) nums.push(i);
    if (pageSafe < totalPages - 2) nums.push("…");
    nums.push(totalPages);
    return nums;
  }, [pageSafe, totalPages]);

  /** Statistika kartochkalari uchun — haqiqiy hisoblangan sonlar (soxta % o'zgarish ko'rsatilmaydi). */
  const activeProductsCount = useMemo(() => products.filter(p => p.active !== false).length, [products]);
  const totalSoldCount = useMemo(() => products.reduce((sum, p) => sum + (p.sold || 0), 0), [products]);

  /** Eski (singular) imageUrl bilan yaratilgan mahsulotlar bilan orqaga moslik. */
  const productThumb = (p) => (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";

  const openAdd = () => { setEditingProduct(null); setFormOpen(true); };
  const openEdit = (p) => { setEditingProduct(p); setFormOpen(true); };

  /** Yangi kategoriya kiritilgan bo'lsa, "categories" kolleksiyasiga qo'shib qo'yamiz. */
  const ensureCategorySaved = async (categoryName) => {
    const name = categoryName.trim();
    if (!name) return;
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (!exists) await addItem(COL.categories, { name });
  };

  /** Yangi brend kiritilgan bo'lsa, "brands" kolleksiyasiga qo'shib qo'yamiz. */
  const ensureBrandSaved = async (brandName) => {
    const name = brandName.trim();
    if (!name) return;
    const exists = brands.some(b => b.name.toLowerCase() === name.toLowerCase());
    if (!exists) await addItem(COL.brands, { name });
  };

  const remove = async (id) => {
    await deleteItem(COL.products, id);
  };

  /** Mahsulotni do'konda ko'rsatish/yashirish — o'chirmasdan vaqtincha faol/nofaol qilish. */
  const toggleActive = async (p) => {
    await updateItem(COL.products, p.id, { active: p.active === false ? true : false });
  };

  /** Mahsulotni nusxalaydi — bir xil ma'lumot, yangi ID, nomiga "(nusxa)" qo'shiladi. */
  const duplicate = async (p) => {
    const newId = uid();
    const { id, ...rest } = p;
    await setItem(COL.products, newId, {
      ...rest,
      nameUz: rest.nameUz ? `${rest.nameUz} (nusxa)` : rest.nameUz,
      nameRu: rest.nameRu ? `${rest.nameRu} (копия)` : rest.nameRu,
      name: rest.name ? `${rest.name} (nusxa)` : rest.name,
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id))));
  };
  const bulkDelete = async () => {
    await Promise.all(Array.from(selectedIds).map(id => deleteItem(COL.products, id)));
    setSelectedIds(new Set());
  };
  const applyBulkCategory = async () => {
    if (!bulkCategory) return;
    await Promise.all(Array.from(selectedIds).map(id => updateItem(COL.products, id, { category: bulkCategory })));
    await ensureCategorySaved(bulkCategory);
    setSelectedIds(new Set());
    setBulkCategory("");
  };

  const startQuickEdit = (p, field) => {
    setQuickEdit({ id: p.id, field });
    setQuickEditValue(field === "price" ? String(p.price ?? "") : String(p.stock ?? ""));
  };
  const saveQuickEdit = async () => {
    if (!quickEdit) return;
    const value = Number(quickEditValue) || 0;
    await updateItem(COL.products, quickEdit.id, { [quickEdit.field]: value });
    setQuickEdit(null);
  };

  const activeFilterCount = activeCategories.size + activeBrands.size + (stockFilter !== "all" ? 1 : 0) + (search.trim() ? 1 : 0);
  const clearAllFilters = () => { setActiveCategories(new Set()); setActiveBrands(new Set()); setStockFilter("all"); setSearch(""); };

  /** Kategoriya chipini bosish — har doim ko'p tanlashga qo'shadi/olib tashlaydi. */
  const toggleCategoryFilter = (name) => {
    setActiveCategories(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };
  const toggleBrandFilter = (name) => {
    setActiveBrands(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const categoryItems = sortedCategories.map(c => ({ name: c.name, count: products.filter(p => p.category === c.name).length }));
  const brandItems = sortedBrands.map(b => ({ name: b.name, count: products.filter(p => p.brand === b.name).length }));

  return (
    <div className="flex flex-col gap-5">
      {/* Statistika kartochkalari — haqiqiy sonlar, taxminiy foiz o'zgarish ko'rsatilmaydi */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Package size={19} /></div>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight text-slate-800">{products.length}</p>
            <p className="truncate text-xs text-slate-400">{lang === "uz" ? "Jami mahsulotlar" : "Всего товаров"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle2 size={19} /></div>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight text-slate-800">{activeProductsCount}</p>
            <p className="truncate text-xs text-slate-400">{t.products.activeCol}</p>
          </div>
        </div>
        <button
          onClick={() => setStockFilter(v => v === "low" ? "all" : "low")}
          className={`flex items-center gap-3 rounded-2xl border p-4 text-left shadow-sm transition ${stockFilter === "low" ? "border-amber-300 bg-amber-50" : "border-slate-100 bg-white hover:border-amber-200"}`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle size={19} /></div>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight text-slate-800">{lowStockCount}</p>
            <p className="truncate text-xs text-slate-400">{t.products.stockStatusLow}</p>
          </div>
        </button>
        <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><ShoppingBag size={19} /></div>
          <div className="min-w-0">
            <p className="text-xl font-bold leading-tight text-slate-800">{totalSoldCount}</p>
            <p className="truncate text-xs text-slate-400">{t.products.sold}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold leading-tight text-slate-800">{t.products.title}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{filtered.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportProductsToCSV(filtered, t, lang)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
              <Download size={16} /> {t.orders.export}
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700">
              <Plus size={16} /> {t.products.add}
            </button>
          </div>
        </div>

        {/* Qidiruv + filtr dropdownlari — kategoriya/brend ko'p tanlashni qo'llab-quvvatlaydi */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.products.searchPh}
              className="w-56 rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-emerald-400 focus:bg-white" />
          </div>
          <FilterDropdown label={t.products.category} items={categoryItems} selected={activeCategories} onToggle={toggleCategoryFilter} onClear={() => setActiveCategories(new Set())} clearLabel={t.products.clearFilters} />
          <FilterDropdown label={t.products.brand} items={brandItems} selected={activeBrands} onToggle={toggleBrandFilter} onClear={() => setActiveBrands(new Set())} clearLabel={t.products.clearFilters} />
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-600 outline-none transition focus:border-emerald-400">
            <option value="all">{t.products.stockStatusAll}</option>
            <option value="in">{t.products.stockStatusIn}</option>
            <option value="low">{t.products.stockStatusLow} ({lowStockCount})</option>
            <option value="out">{t.products.stockStatusOut}</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 outline-none transition focus:border-emerald-400">
            <option value="name">{t.products.sortName}</option>
            <option value="priceAsc">{t.products.sortPriceAsc}</option>
            <option value="priceDesc">{t.products.sortPriceDesc}</option>
            <option value="stock">{t.products.sortStock}</option>
            <option value="rating">{t.products.sortRating}</option>
          </select>
          <button onClick={() => setCategoryModalOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <Tag size={16} /> {t.products.categoriesBtn}
          </button>
          <button onClick={() => setBrandModalOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
            <Tag size={16} /> {t.products.brandsBtn}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="flex items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium text-rose-600 hover:underline">
              <X size={13} /> {t.products.clearFilters}
            </button>
          )}
        </div>

      {/* Ommaviy amal paneli */}
      {selectedIds.size > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-sm">
          <span className="font-medium">{selectedIds.size} {t.orders.selected}</span>
          <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="rounded-lg border border-white/20 bg-slate-700 px-2 py-1.5 text-xs text-white outline-none">
            <option value="">{t.products.category}...</option>
            {sortedCategories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={applyBulkCategory} disabled={!bulkCategory} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50">{t.orders.applyBulk}</button>
          <button onClick={bulkDelete} className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium hover:bg-rose-500">
            <Trash2 size={13} /> {t.common.delete}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-white/70 hover:text-white">{t.orders.clearSelection}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text={t.products.empty} />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-400">
                <th className="w-8 py-2.5 pl-3">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="py-2.5 font-medium">{t.products.name}</th>
                <th className="py-2.5 font-medium">{t.products.brand}</th>
                <th className="py-2.5 font-medium">{t.products.category}</th>
                <th className="py-2.5 font-medium">{t.products.price}</th>
                <th className="py-2.5 font-medium">{t.products.stock}</th>
                <th className="py-2.5 font-medium">{t.products.sold}</th>
                <th className="py-2.5 font-medium">{t.products.activeCol}</th>
                <th className="py-2.5 pr-3 text-right font-medium">{t.products.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map(p => (
                <tr key={p.id} className={`transition hover:bg-slate-50/70 ${p.active === false ? "opacity-50" : ""}`}>
                  <td className="py-2.5 pl-3">
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                  </td>
                  <td className="py-2.5 font-medium text-slate-700">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 text-slate-300 ring-1 ring-slate-100">
                        {productThumb(p) ? (
                          <img loading="lazy" src={productThumb(p)} alt={pname(p, lang)} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                        ) : (
                          <Package size={14} />
                        )}
                      </div>
                      <span className="truncate">{pname(p, lang)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-600">{p.brand || "—"}</td>
                  <td className="py-2.5 text-slate-600">{p.category || "—"}</td>

                  {/* Narx — tezkor tahrirlash: bosilganda inputga aylanadi */}
                  <td className="py-2.5 text-slate-600">
                    {quickEdit && quickEdit.id === p.id && quickEdit.field === "price" ? (
                      <input
                        type="number"
                        autoFocus
                        value={quickEditValue}
                        onChange={e => setQuickEditValue(e.target.value)}
                        onBlur={saveQuickEdit}
                        onKeyDown={e => { if (e.key === "Enter") saveQuickEdit(); if (e.key === "Escape") setQuickEdit(null); }}
                        className="w-24 rounded-lg border border-emerald-400 px-2 py-1 text-xs outline-none"
                      />
                    ) : (
                      <button onClick={() => startQuickEdit(p, "price")} className="rounded-lg px-1.5 py-1 transition hover:bg-slate-100" title={t.products.quickEditHint}>
                        {p.oldPrice > p.price && <span className="mr-1.5 text-xs text-slate-400 line-through">{fmtMoney(p.oldPrice)}</span>}
                        {fmtMoney(p.price)} {t.common.uzs}
                        {p.oldPrice > p.price && (
                          <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                            -{discountPct(p.price, p.oldPrice)}%
                          </span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Qoldiq — tezkor tahrirlash */}
                  <td className="py-2.5 text-slate-600">
                    {p.stockType === "unlimited" ? (
                      t.products.unlimited
                    ) : p.stockType === "out" ? (
                      <span className="text-rose-500">{t.products.outOfStock}</span>
                    ) : quickEdit && quickEdit.id === p.id && quickEdit.field === "stock" ? (
                      <input
                        type="number"
                        autoFocus
                        value={quickEditValue}
                        onChange={e => setQuickEditValue(e.target.value)}
                        onBlur={saveQuickEdit}
                        onKeyDown={e => { if (e.key === "Enter") saveQuickEdit(); if (e.key === "Escape") setQuickEdit(null); }}
                        className="w-20 rounded-lg border border-emerald-400 px-2 py-1 text-xs outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => startQuickEdit(p, "stock")}
                        className={`rounded-lg px-1.5 py-1 transition hover:bg-slate-100 ${isLowStock(p) ? "font-semibold text-amber-600" : ""}`}
                        title={t.products.quickEditHint}
                      >
                        {isLowStock(p) && <AlertTriangle size={12} className="mr-1 inline" />}
                        {p.stock ?? 0} {t.common.ta}
                      </button>
                    )}
                  </td>

                  {/* Necha marta sotilgani — har bir buyurtmada avtomatik +qty qo'shiladi */}
                  <td className="py-2.5 text-slate-500">{p.sold || 0}</td>

                  {/* Faol/nofaol — o'chirmasdan do'kondan yashirish */}
                  <td className="py-2.5">
                    <Toggle checked={p.active !== false} onChange={() => toggleActive(p)} />
                  </td>

                  <td className="py-2.5 pr-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => duplicate(p)} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600" title={t.products.duplicate}>
                        <Copy size={15} />
                      </button>
                      <button onClick={() => openEdit(p)} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(p.id)} className="rounded-xl p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sahifalash */}
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{lang === "uz" ? `Jami ${filtered.length} ta mahsulot` : `Всего ${filtered.length} товаров`}</span>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none">
              <option value={25}>25 / {lang === "uz" ? "sahifada" : "стр."}</option>
              <option value={50}>50 / {lang === "uz" ? "sahifada" : "стр."}</option>
              <option value={100}>100 / {lang === "uz" ? "sahifada" : "стр."}</option>
            </select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={pageSafe === 1} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">‹</button>
              {pageNumbers.map((n, i) => n === "…" ? (
                <span key={`dots-${i}`} className="px-1.5 text-xs text-slate-400">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition ${n === pageSafe ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={pageSafe === totalPages} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40">›</button>
            </div>
          )}
        </div>
      )}
      </div>

      {formOpen && (
        <ProductForm
          lang={lang}
          product={editingProduct}
          products={products}
          categories={categories}
          brands={brands}
          onClose={() => setFormOpen(false)}
          onEnsureCategory={ensureCategorySaved}
          onEnsureBrand={ensureBrandSaved}
        />
      )}

      {categoryModalOpen && (
        <TaxonomyModal
          title={t.products.categoriesBtn}
          items={categories}
          collectionName={COL.categories}
          productField="category"
          products={products}
          onClose={() => setCategoryModalOpen(false)}
          t={t}
        />
      )}

      {brandModalOpen && (
        <TaxonomyModal
          title={t.products.brandsBtn}
          items={brands}
          collectionName={COL.brands}
          productField="brand"
          products={products}
          onClose={() => setBrandModalOpen(false)}
          t={t}
        />
      )}

    </div>
  );
}

/* ---------------------------------------------------------------
   PLACEHOLDER PAGE
--------------------------------------------------------------- */
function SoonPage({ lang, label }) {
  const t = T[lang];
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <AlertCircle className="mx-auto mb-3 text-slate-300" size={36} />
      <h2 className="mb-1 text-base font-semibold text-slate-700">{label}</h2>
      <p className="text-sm text-slate-400">{t.soon}</p>
    </div>
  );
}

/* ---------------------------------------------------------------
   ADMIN LOGIN
--------------------------------------------------------------- */
function AdminLogin({ lang }) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(t.login.wrong);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[600px] w-full items-center justify-center bg-gray-50 p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Lock size={20} />
          </div>
          <h2 className="text-base font-semibold text-slate-800">{t.login.title}</h2>
        </div>
        <Field label={t.login.email}>
          <input type="email" required className={inputCls} value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label={t.login.password} error={error}>
          <input type="password" required className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} {loading ? t.login.loading : t.login.submit}
        </button>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------
   ADMIN APP SHELL — sidebar, sahifa marshrutlash, login qo'riqlash
--------------------------------------------------------------- */
export default function AdminApp({ lang, setLang, products, categories, brands, collections, banners, testimonials, faqs, storeSettings }) {
  const [page, setPage] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out
  // "Kolleksiyalar" — mahsulotlar sahifasidan Banner sahifasiga ko'chirilgan.
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);

  // Chap menyuni yig'ish/kengaytirish — ekranda ko'proq joy qolishi uchun.
  // Tanlov brauzerda saqlanadi, shuning uchun sahifa qayta ochilganda ham
  // avvalgi holat (yig'ilgan/kengaytirilgan) saqlanib qoladi.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adminSidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("adminSidebarCollapsed", next ? "1" : "0");
      } catch {
        // localStorage yo'q bo'lsa ham (masalan xavfsiz rejim) — jim o'tib ketamiz
      }
      return next;
    });
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  // Buyurtmalar va mijozlar — FAQAT admin tizimga kirgandan keyin yuklanadi.
  useEffect(() => {
    if (!user) return;
    const unsubOrders = subscribeCollection(COL.orders, (list) => setOrders(list));
    const unsubCustomers = subscribeCollection(COL.customers, (list) => setCustomers(list));
    return () => { unsubOrders(); unsubCustomers(); };
  }, [user]);

  const t = T[lang];
  const nav = [
    { key: "dashboard", label: t.menu.dashboard, icon: LayoutGrid },
    { key: "orders", label: t.menu.orders, icon: ClipboardList, badge: orders.filter(o => o.status === "new").length },
    { key: "customers", label: t.menu.customers, icon: Users },
    { key: "products", label: t.menu.products, icon: Package },
    { key: "banner", label: t.menu.banner, icon: ImageIcon },
    { key: "testimonials", label: t.menu.testimonials, icon: MessageSquareQuote },
    { key: "faqs", label: t.menu.faqs, icon: HelpCircle },
    { key: "marketing", label: t.menu.marketing, icon: TrendingUp },
    { key: "telegram", label: t.menu.telegram, icon: Send },
    { key: "settings", label: t.menu.settings, icon: SettingsIcon },
  ];

  // Firebase login holati tekshirilayotgan bo'lsa yoki kirilmagan bo'lsa.
  if (user === undefined) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }
  if (!user) {
    return <AdminLogin lang={lang} />;
  }

  return (
    <div className="flex h-full min-h-[600px] w-full bg-gray-50 text-slate-800" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* SIDEBAR */}
      <aside className={`relative hidden flex-col border-r border-gray-100 bg-white transition-all duration-200 sm:flex ${sidebarCollapsed ? "w-[68px]" : "w-60"}`}>
        <div className={`flex items-center gap-2 py-5 ${sidebarCollapsed ? "justify-center px-2" : "px-5"}`}>
          {storeSettings?.logoUrl ? (
            <img loading="lazy" src={storeSettings.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShoppingCart size={17} />
            </div>
          )}
          {!sidebarCollapsed && <span className="truncate text-base font-bold text-slate-800">{storeSettings?.storeName || t.appName}</span>}
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 pb-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-slate-500">{t.workspace}: CASME</div>
          </div>
        )}

        <nav className={`flex-1 space-y-1 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {nav.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`relative flex w-full items-center rounded-xl py-2.5 text-sm font-medium transition ${
                  sidebarCollapsed ? "justify-center px-2" : "justify-between px-3"
                } ${active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-gray-50"}`}
              >
                <span className={`flex items-center ${sidebarCollapsed ? "" : "gap-2.5"}`}>
                  <Icon size={17} />
                  {!sidebarCollapsed && item.label}
                </span>
                {!!item.badge && (
                  <span
                    className={`rounded-full bg-emerald-600 text-[10px] text-white ${
                      sidebarCollapsed ? "absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center" : "px-1.5 py-0.5"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className={`space-y-2 p-4 ${sidebarCollapsed ? "px-2" : ""}`}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={sidebarCollapsed ? t.login.viewStore : undefined}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50"
          >
            <ShoppingBag size={13} /> {!sidebarCollapsed && t.login.viewStore}
          </a>
          {/* Yig'ish/kengaytirish tugmasi — ikkala holatda ham ko'rinadi, chunki yig'ilgandan keyin qayta ochish shu tugma orqali bo'ladi */}
          <button
            onClick={toggleSidebar}
            title={sidebarCollapsed ? t.sidebarExpand : t.sidebarCollapse}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
            {!sidebarCollapsed && t.sidebarCollapse}
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
          <h1 className="text-sm font-semibold text-slate-700">{nav.find(n => n.key === page)?.label}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-50"
            >
              <Globe size={14} /> {lang === "uz" ? "O'zbek" : "Русский"}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-50"
            >
              <LogOut size={14} /> {t.login.logout}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {page === "dashboard" && <DashboardPage lang={lang} orders={orders} customers={customers} products={products} setPage={setPage} />}
          {page === "orders" && <OrdersPage lang={lang} orders={orders} setOrders={setOrders} customers={customers} products={products} />}
          {page === "customers" && <CustomersPage lang={lang} customers={customers} setCustomers={setCustomers} orders={orders} products={products} />}
          {page === "products" && <ProductsPage lang={lang} products={products} categories={categories} brands={brands} collections={collections} />}
          {page === "banner" && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setCollectionsModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50"
                >
                  <LayoutGrid size={16} /> {t.products.collectionsBtn}
                </button>
              </div>
              <BannerSettings lang={lang} banners={banners} products={products} categories={categories} brands={brands} />
              {collectionsModalOpen && (
                <CollectionsModal
                  lang={lang}
                  collections={collections}
                  products={products}
                  categories={categories}
                  brands={brands}
                  onClose={() => setCollectionsModalOpen(false)}
                  t={t}
                />
              )}
            </div>
          )}
          {page === "testimonials" && <TestimonialsSettings lang={lang} testimonials={testimonials} products={products} />}
          {page === "faqs" && <FAQSettings lang={lang} faqs={faqs} />}
          {page === "marketing" && <MarketingPage lang={lang} banners={banners} products={products} orders={orders} customers={customers} />}
          {page === "telegram" && <TelegramSettings lang={lang} />}
          {page === "settings" && <StoreSettings lang={lang} settings={storeSettings} />}
        </main>
      </div>
    </div>
  );
}
