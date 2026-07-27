import React, { useEffect, useRef, useState } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useCarouselRow, pname, fmtMoney } from "./ui.jsx";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/** Ismning bosh harfidan doiraviy avatar rangini barqaror (har doim bir xil) tanlaydi. */
const AVATAR_PALETTE = [
  "linear-gradient(135deg, #FDA4AF, #E01876)",
  "linear-gradient(135deg, #FCD34D, #F59E0B)",
  "linear-gradient(135deg, #93C5FD, #2563EB)",
  "linear-gradient(135deg, #6EE7B7, #059669)",
  "linear-gradient(135deg, #C4B5FD, #7C3AED)",
];
const avatarStyle = (name) => {
  const idx = (name || "").charCodeAt(0) % AVATAR_PALETTE.length || 0;
  return AVATAR_PALETTE[Math.abs(idx)];
};

export default function Testimonials({ testimonials, products, lang, t, onProductClick }) {
  const active = (testimonials || []).filter((x) => x.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const hasMultiple = active.length > 1;
  const { viewportRef, emblaApi, scrollPrev, scrollNext } = useCarouselRow({
    align: "start",
    loop: hasMultiple,
    dragFree: false,
    containScroll: false,
  });

  // Ekranda ko'rinib-ko'rinmasligini kuzatish (Keng banner bo'limidagi kabi) —
  // faqat ekranda ko'rinib turganda avtomatik almashadi.
  const wrapperRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!emblaApi || !hasMultiple || !isVisible) return;
    const timer = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => clearInterval(timer);
  }, [emblaApi, hasMultiple, isVisible]);

  if (active.length === 0) return null;

  return (
    <div>
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{t.store.testimonialsTag}</p>
        <h2 style={SERIF} className="text-2xl font-semibold text-stone-900 sm:text-3xl">{t.store.testimonialsTitle}</h2>
      </div>

      <div className="relative" ref={wrapperRef}>
        <div ref={viewportRef} className="embla-viewport">
          <div className="embla-container">
            {active.map((item) => {
              const product = (products || []).find((p) => p.id === item.productId);
              const thumb = product ? (product.imageUrls && product.imageUrls[0]) || product.imageUrl || "" : "";
              return (
                <div
                  key={item.id}
                  className="mr-3 flex w-[82vw] max-w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(0,0,0,0.06)] ring-1 ring-stone-100 sm:mr-4 sm:w-[340px]"
                >
                  {item.imageUrl && (
                    <div className="h-40 w-full shrink-0 overflow-hidden bg-stone-100">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" draggable={false} onDragStart={(e) => e.preventDefault()} />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                  <Quote size={26} className="mb-1 text-rose-200" fill="currentColor" strokeWidth={0} />
                  <div className="mb-2 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < (item.rating || 5) ? "fill-amber-400 text-amber-400" : "text-stone-200"} />
                    ))}
                  </div>
                  <p className="mb-4 flex-1 text-base leading-relaxed text-stone-600">{item.text}</p>

                  {/* Biriktirilgan mahsulot — bosilganda mahsulot kartochkasi ochiladi */}
                  {product && (
                    <button
                      onClick={() => onProductClick && onProductClick(product)}
                      className="mb-4 flex items-center gap-2 rounded-2xl bg-rose-50/70 p-2 text-left transition hover:bg-rose-50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-stone-300">
                        {thumb ? <img src={thumb} alt="" className="h-full w-full object-contain p-1" /> : <Package size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-stone-700">{pname(product, lang)}</p>
                        <p className="text-[11px] text-rose-500">{fmtMoney(product.price)} {t.common.uzs}</p>
                      </div>
                    </button>
                  )}

                  <div className="mt-auto flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                      style={{ background: avatarStyle(item.name) }}
                    >
                      {(item.name || "?").trim().charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm font-semibold text-stone-900">{item.name}</p>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {active.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              aria-label="Oldingi"
              className="absolute -left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Keyingi"
              className="absolute -right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
