// ==========================================================
// Umumiy (qayta ishlatiladigan) kichik UI qismlari.
// App.jsx va src/components/ ichidagi barcha komponentlar
// shu fayldan foydalanadi — shuning uchun bu yerga hech qanday
// App.jsx-ga xos narsa (masalan tarjima lug'ati) qo'yilmaydi.
// ==========================================================
import React, { useCallback, useState, useRef } from "react";
import { X, Clock, CheckCircle2, XCircle, Truck, PackageCheck, ArrowLeft } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";

export const uid = () => Math.random().toString(36).slice(2, 10);
export const fmtMoney = (n) => (Number(n) || 0).toLocaleString("ru-RU");
export const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Mahsulot nomini joriy tilga (lang: "uz" | "ru") mos qaytaradi.
 * Agar shu tilda kiritilmagan bo'lsa — boshqa tildagisini, u ham
 * bo'lmasa — eski (bitta `name` maydoni bilan qo'shilgan) mahsulotlar
 * uchun `p.name`ni qaytaradi. Shu tufayli eski mahsulotlar ham
 * to'g'ri ishlayveradi.
 */
export function pname(p, lang) {
  if (!p) return "";
  if (lang === "ru") return p.nameRu || p.nameUz || p.name || "";
  return p.nameUz || p.nameRu || p.name || "";
}

/** pname() bilan bir xil mantiq, faqat tavsif uchun. */
export function pdesc(p, lang) {
  if (!p) return "";
  if (lang === "ru") return p.descriptionRu || p.descriptionUz || p.description || "";
  return p.descriptionUz || p.descriptionRu || p.description || "";
}

/** Chegirma foizini hisoblaydi (masalan 320000 va 410000 dan -22 qaytaradi). */
export function discountPct(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(100 - (price / oldPrice) * 100);
}

/** Mahsulot qoldiq holatiga ko'ra "qolmagan" (sotuvda yo'q) ekanini aniqlaydi. */
export function isSoldOut(p) {
  const stockType = p?.stockType || "limited";
  return stockType === "out" || (stockType === "limited" && (p?.stock || 0) <= 0);
}

/**
 * Mahsulotlar ro'yxatini shunday saralaydiki — "qolmagan" (sotuvda yo'q)
 * mahsulotlar ro'yxat oxiriga tushadi, qolganlarining o'zaro tartibi
 * (mavjud saralash/filtr natijasi) o'zgarmaydi. Mahsulot qayta qoldiqqa
 * kelgan zahoti (yoki "cheksiz" qilib belgilansa) — keyingi renderda
 * avtomatik o'z avvalgi o'rniga qaytadi, chunki bu funksiya har safar
 * joriy holatga qarab qayta hisoblanadi.
 */
export function sortSoldOutLast(list) {
  const inStock = [];
  const soldOut = [];
  for (const p of list) (isSoldOut(p) ? soldOut : inStock).push(p);
  return [...inStock, ...soldOut];
}

/**
 * Pastdan chiqadigan varaq (bottom sheet) oynalarni tutqichdan pastga tortib
 * yopish imkonini beradi (mahsulot kartochkasi, savat, sevimlilar, profil
 * kabi oynalarda ishlatiladi). `onClose` — tortish `threshold`dan oshganda
 * chaqiriladigan funksiya. Qaytaradi: { dragHandleProps, sheetStyle } —
 * dragHandleProps tutqich qatoriga, sheetStyle esa varaqning o'ziga beriladi.
 */
export function useSwipeDownToClose(onClose, threshold = 90) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartY = useRef(0);

  const handleDragStart = (clientY) => {
    dragStartY.current = clientY;
    setDragging(true);
  };
  const handleDragMove = (clientY) => {
    if (!dragging) return;
    const delta = clientY - dragStartY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleDragEnd = () => {
    setDragging(false);
    if (dragY > threshold) onClose();
    else setDragY(0);
  };

  const dragHandleProps = {
    onTouchStart: (e) => handleDragStart(e.touches[0].clientY),
    onTouchMove: (e) => handleDragMove(e.touches[0].clientY),
    onTouchEnd: handleDragEnd,
    onMouseDown: (e) => handleDragStart(e.clientY),
    onMouseMove: (e) => { if (dragging) handleDragMove(e.clientY); },
    onMouseUp: handleDragEnd,
    onMouseLeave: () => { if (dragging) handleDragEnd(); },
  };

  const sheetStyle = { transform: `translateY(${dragY}px)`, transition: dragging ? "none" : "transform 0.25s ease" };

  return { dragHandleProps, sheetStyle, dragging };
}

/**
 * O'zbekiston telefon raqamini "+998 (97) 949 44 99" ko'rinishiga
 * formatlaydi. `raw` — foydalanuvchi kiritayotgan har qanday matn
 * (raqamlar, bo'sh joy, qavs va h.k. — barchasi tozalanadi).
 * Doim "+998 (" bilan boshlanadi, foydalanuvchi faqat qolgan
 * 9 ta raqamni kiritadi.
 */
export function formatUzPhone(raw) {
  const digits = String(raw || "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
  let result = "+998 (" + digits.slice(0, 2);
  if (digits.length >= 2) result += ")";
  if (digits.length > 2) result += " " + digits.slice(2, 5);
  if (digits.length > 5) result += " " + digits.slice(5, 7);
  if (digits.length > 7) result += " " + digits.slice(7, 9);
  return result;
}

/** Formatlangan qatordan faqat mahalliy 9 ta raqamni ajratib oladi. */
export function uzPhoneDigits(formatted) {
  return String(formatted || "").replace(/\D/g, "").replace(/^998/, "").slice(0, 9);
}

/** Telefon raqami to'liq (9 ta raqam) kiritilganmi — shuni tekshiradi. */
export function isValidUzPhone(formatted) {
  return uzPhoneDigits(formatted).length === 9;
}

/**
 * "+998 (__) ___ __ __" ko'rinishida avtomatik formatlanadigan
 * telefon input. `value`/`onChange` — odatiy controlled input kabi
 * ishlaydi, faqat qiymat doim to'liq formatlangan qatorda bo'ladi.
 */
export function PhoneInput({ value, onChange, className, autoFocus }) {
  return (
    <input
      type="tel"
      inputMode="numeric"
      autoFocus={autoFocus}
      value={value || "+998 ("}
      onChange={(e) => onChange(formatUzPhone(e.target.value))}
      onFocus={(e) => {
        if (!value) onChange("+998 (");
        // Kursorni oxiriga qo'yamiz — shu joydan yozishni davom ettirish qulay bo'lsin.
        requestAnimationFrame(() => {
          const len = e.target.value.length;
          e.target.setSelectionRange(len, len);
        });
      }}
      placeholder="+998 (__) ___ __ __"
      className={className || inputCls}
    />
  );
}

export const inputCls =
  "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export function Modal({ title, onClose, onBack, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          {onBack && (
            <button onClick={onBack} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600">
              <ArrowLeft size={18} />
            </button>
          )}
          <h3 className="flex-1 text-base font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, children }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

/**
 * Butun admin panelda ishlatiladigan yagona ON/OFF svich (toggle).
 * Ilgari bu tugma har bir sahifada alohida-alohida (bir xil ko'rinishda,
 * lekin ba'zilarida `shrink-0` yo'q holda) qayta yozilgan edi — shu sababli
 * `flex justify-between` qatorlarida (yonida uzun matn bo'lganda) tugma
 * torayib qolib, dumaloq belgi (thumb) chegaradan tashqariga chiqib
 * ketishi mumkin edi. Ildizidagi sabab: `w-11` ustiga `shrink-0` yo'qligi
 * (flexbox tugmani siqib qo'ygan) va belgining boshlang'ich `left`
 * qiymati aniq ko'rsatilmaganligi edi. Shu componentda ikkalasi ham
 * qat'iy belgilangan — track va thumb o'lchamlari, joylashuvi barcha
 * holatlarda bir xil va simmetrik bo'ladi:
 *   OFF: thumb chapdan 2px, ON: thumb o'ngdan 2px (track kengligi 44px,
 *   thumb 20px, translate-x-5 = 20px — matematik jihatdan aniq mos keladi).
 *
 * Ishlatilishi:
 *   <Toggle checked={active} onChange={setActive} />
 */
export function Toggle({ checked, onChange, disabled = false, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-emerald-600" : "bg-gray-300"} ${className}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export function EmptyState({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-400">
      <Icon size={32} strokeWidth={1.5} />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function StatusBadge({ status, labels }) {
  const map = {
    new: "bg-blue-50 text-blue-700 border-blue-200",
    ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
    on_way: "bg-amber-50 text-amber-700 border-amber-200",
    delivered: "bg-teal-50 text-teal-700 border-teal-200",
    cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const icon = { new: Clock, ready: CheckCircle2, on_way: Truck, delivered: PackageCheck, cancelled: XCircle }[status];
  const Icon = icon || Clock;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${map[status] || map.new}`}>
      <Icon size={13} /> {labels[status] || status}
    </span>
  );
}


/**
 * Gorizontal suriladigan qatorlar (Chegirmalar, Mashhur, Kategoriya,
 * Brend, Kolleksiyalar) uchun professional carousel — Embla Carousel
 * kutubxonasi asosida (GPU-tezlashtirilgan `transform: translate3d`,
 * 60+ FPS, tabiiy "snap", sichqoncha bilan sudrash, sichqoncha g'ildiragi
 * bilan surish, mobil qurilmada barmoq bilan tabiiy (momentum bilan)
 * surish — bularning barchasi kutubxonaning o'zida tayyor).
 *
 * Ishlatilishi:
 *   const { viewportRef, scrollPrev, scrollNext } = useCarouselRow();
 *   <div ref={viewportRef} className="overflow-hidden">
 *     <div className="flex gap-3">...kartochkalar...</div>
 *   </div>
 *   <button onClick={scrollPrev}>‹</button>
 */
export function useCarouselRow(options = {}) {
  const [viewportRef, emblaApi] = useEmblaCarousel(
    { align: "start", containScroll: "trimSnaps", loop: false, dragFree: true, skipSnaps: false, ...options },
    [WheelGesturesPlugin({ forceWheelAxis: "x" })]
  );

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return { viewportRef, emblaApi, scrollPrev, scrollNext };
}
