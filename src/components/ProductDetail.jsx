import React, { useState, useMemo } from "react";
import { X, ChevronLeft, ChevronRight, Package, Plus, Loader2 } from "lucide-react";
import { pname, pdesc, discountPct, useSwipeDownToClose } from "./ui.jsx";

/**
 * Mahsulot detail oynasi — mijoz mahsulot kartasini bosganda ochiladi.
 * Rasmlar galereyasi (chap/o'ng strelka + nuqtalar), to'liq ma'lumot,
 * va savatga qo'shish tugmasi. Telegram Mini App/telefonda to'liq
 * ekranga yaqin (pastdan chiqadigan varaq) ko'rinishda ochiladi.
 */
export default function ProductDetail({ product, cartQty, onClose, onAddToCart, t, fmtMoney, lang }) {
  const images = useMemo(() => {
    if (product.imageUrls && product.imageUrls.length) return product.imageUrls;
    if (product.imageUrl) return [product.imageUrl];
    return [];
  }, [product]);

  const [imgIndex, setImgIndex] = useState(0);

  // Pastdan tortib yopish (swipe-down-to-close) — faqat tutqich/sarlavha qismidan boshlanadi,
  // shunda rasm galereyasi va matn skrolliga xalaqit bermaydi.
  const { dragHandleProps, sheetStyle } = useSwipeDownToClose(onClose);

  const stockType = product.stockType || "limited";
  const soldOut = stockType === "out" || (stockType === "limited" && (product.stock || 0) <= 0);
  const hasDiscount = product.oldPrice > product.price;
  const pct = discountPct(product.price, product.oldPrice);
  const name = pname(product, lang);
  const description = pdesc(product, lang);

  let stockLabel;
  if (stockType === "unlimited") stockLabel = t.store.available;
  else if (soldOut) stockLabel = t.store.outOfStock;
  else stockLabel = `${product.stock} ${t.store.inStock}`;

  const goPrev = () => setImgIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setImgIndex((i) => (i + 1) % images.length);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tutqich + yopish tugmasi — shu qismdan pastga tortib yopish mumkin */}
        <div className="cursor-grab touch-none pt-2.5 active:cursor-grabbing" {...dragHandleProps}>
          <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
          <div className="flex items-center justify-end px-4 pt-1.5">
            <button onClick={onClose} className="rounded-full bg-gray-100 p-1.5 text-slate-500 hover:bg-gray-200">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 pb-5">
          {/* Rasmlar galereyasi — aspect-square: karta va detail bir xil nisbatda, cho'zilib ko'rinmaydi */}
          <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-xl bg-gray-50 text-slate-300">
            {images.length > 0 ? (
              <img loading="lazy" src={images[imgIndex]} alt={name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package size={48} strokeWidth={1.3} />
              </div>
            )}
            <div className="absolute left-2 top-2 flex flex-col gap-1">
              {hasDiscount && (
                <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                  -{pct}%
                </span>
              )}
              {product.tag === "new" && (
                <span className="rounded-full bg-stone-900 px-2 py-0.5 text-xs font-semibold text-white">{t.store.tagNew}</span>
              )}
              {product.tag === "bestseller" && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">{t.store.tagBestseller}</span>
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm hover:bg-white"
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm hover:bg-white"
                >
                  <ChevronRight size={17} />
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === imgIndex ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Kichik rasm ro'yxati (thumbnail) — faqat 2+ rasm bo'lsa */}
          {images.length > 1 && (
            <div className="mb-4 flex gap-2 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImgIndex(i)}
                  className={`aspect-square h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 ${i === imgIndex ? "border-emerald-600" : "border-transparent"}`}
                >
                  <img loading="lazy" src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Ma'lumot */}
          {product.brand && <p className="text-[11px] font-medium uppercase tracking-wide text-rose-400">{product.brand}</p>}
          <p className="text-xs font-medium text-emerald-600">{product.category || "—"}</p>
          <h2 className="mb-2 text-lg font-bold text-slate-800">{name}</h2>

          <div className="mb-2 flex items-center gap-2">
            {hasDiscount && <span className="text-sm text-slate-400 line-through">{fmtMoney(product.oldPrice)}</span>}
            <span className="text-xl font-bold text-slate-800">{fmtMoney(product.price)} <span className="text-sm font-normal text-slate-400">{t.common.uzs}</span></span>
            {hasDiscount && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">-{pct}%</span>
            )}
          </div>

          <p className={`mb-4 text-sm ${soldOut ? "text-rose-500" : "text-slate-500"}`}>{stockLabel}</p>

          {description && (
            <div className="mb-5">
              <p className="mb-1 text-sm font-semibold text-slate-700">{t.store.descriptionTitle}</p>
              <p className="whitespace-pre-line text-sm text-slate-600">{description}</p>
            </div>
          )}

          <button
            disabled={soldOut}
            onClick={() => onAddToCart(product)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Plus size={16} /> {t.store.addToCart}{cartQty > 0 ? ` (${cartQty})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
