import React, { useMemo } from "react";
import { ChevronRight, ChevronLeft, Tag, Package } from "lucide-react";
import { useCarouselRow } from "./ui.jsx";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * Kolleksiya sarlavhasini tanlangan tilda qaytaradi. Admin ikkala tilni
 * ham to'ldirmagan bo'lsa yoki eski (bitta "title" maydonli) kolleksiya
 * bo'lsa — mavjud bo'lgan variantga qaytadi (bo'sh chiqib qolmasligi
 * uchun), lekin HECH QACHON avtomatik matn to'qib chiqarmaydi.
 */
export function collectionTitle(c, lang) {
  if (lang === "ru") return c.titleRu || c.titleUz || c.title || "";
  return c.titleUz || c.titleRu || c.title || "";
}

/** Kolleksiya tavsifini tanlangan tilda qaytaradi (xuddi sarlavha kabi). */
export function collectionDescription(c, lang) {
  if (lang === "ru") return c.descriptionRu || c.descriptionUz || c.description || "";
  return c.descriptionUz || c.descriptionRu || c.description || "";
}

/**
 * Har bir kategoriya/brend uchun vakillik qiluvchi rasmni topadi.
 * Ustuvorlik: 1) admin panelda shu kategoriya/brendga yuklangan rasm
 * (item.imageUrl), 2) bo'lmasa — shu kategoriya/brenddagi birinchi
 * mahsulotning rasmi (avtomatik), 3) ikkalasi ham bo'lmasa — ikonka.
 */
function itemThumb(item, products, field) {
  if (item.imageUrl) return item.imageUrl;
  const p = products.find((prod) => prod[field] === item.name && ((prod.imageUrls && prod.imageUrls[0]) || prod.imageUrl));
  return p ? (p.imageUrls && p.imageUrls[0]) || p.imageUrl : null;
}

/** Doira ikonkalar qatori — kategoriya YOKI brend uchun ishlatiladi (bir xil ko'rinish). */
function IconRow({ items, products, field, activeValue, onSelect, allLabel, bare, theme = "default" }) {
  if (items.length === 0) return null;

  // Har bir "mavzu" (theme) uchun rang sozlamalari — orqa fon rangiga qarab
  // matn/chegara kontrasti yetarli bo'lishi uchun.
  const themes = {
    default: {
      label: "text-stone-600",
      circleBg: "bg-rose-50",
      circleBorder: "border-transparent",
      activeBorder: "border-rose-500",
      allActiveBg: "bg-rose-500 text-white",
      allInactiveBg: "bg-rose-50 text-stone-500",
    },
    magenta: {
      label: "font-semibold text-white",
      circleBg: "bg-white",
      circleBorder: "border-transparent",
      activeBorder: "border-[3px] border-[#D4AF37]",
      allActiveBg: "bg-white border-[3px] border-[#D4AF37] text-[#5A2335]",
      allInactiveBg: "bg-white/90 text-[#5A2335]",
    },
    gold: {
      label: "font-semibold",
      labelStyle: { color: "#111827" },
      circleBg: "bg-white",
      circleBorder: "border-white",
      activeBorder: "border-[3px] border-[#D4AF37]",
      allActiveBg: "bg-white border-[3px] border-[#D4AF37] text-[#111827]",
      allInactiveBg: "bg-white text-[#111827] border border-white",
      circleSize: "72px",
      circleHover: "hover:-translate-y-1.5 hover:scale-[1.06]",
      circleShadow: "0 6px 16px rgba(0,0,0,0.08)",
    },
  };
  const th = themes[theme] || themes.default;
  const size = th.circleSize || "70px";
  const hoverFx = th.circleHover || "hover:scale-110";

  const inner = (
    <div className="flex gap-5 overflow-x-auto pb-1">
      <button onClick={() => onSelect(allLabel)} className="flex shrink-0 flex-col items-center gap-2">
          <span
            className={`flex items-center justify-center rounded-full text-xs font-semibold shadow-sm transition-transform duration-200 ${hoverFx} ${
              activeValue === allLabel ? th.allActiveBg : th.allInactiveBg
            }`}
            style={{ height: size, width: size, boxShadow: th.circleShadow }}
          >
            {allLabel.slice(0, 2)}
          </span>
          <span className={`text-xs ${th.label}`} style={th.labelStyle}>{allLabel}</span>
        </button>
        {items.map((item) => {
          const thumb = itemThumb(item, products, field);
          const active = activeValue === item.name;
          return (
            <button key={item.id} onClick={() => onSelect(item.name)} className="flex shrink-0 flex-col items-center gap-2">
              <span
                className={`flex items-center justify-center overflow-hidden rounded-full border-2 shadow-sm transition-transform duration-200 ${hoverFx} hover:border-[#D4AF37] ${active ? th.activeBorder : th.circleBorder} ${th.circleBg}`}
                style={{ height: size, width: size, boxShadow: th.circleShadow }}
              >
                {thumb ? (
                  <img src={thumb} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <Tag size={20} className="text-stone-400" />
                )}
              </span>
              <span className={`max-w-[70px] truncate text-xs ${th.label}`} style={th.labelStyle}>{item.name}</span>
            </button>
          );
        })}
    </div>
  );
  if (bare) return inner;
  return <div className="rounded-2xl bg-white p-4 shadow-sm">{inner}</div>;
}

/** Kategoriya doira ikonkalari qatori. */
export function CategoryIconRow({ categories, products, activeCategory, onSelect, t, bare, theme }) {
  return (
    <IconRow
      items={categories}
      products={products}
      field="category"
      activeValue={activeCategory}
      onSelect={onSelect}
      allLabel={t.store.allCategories}
      bare={bare}
      theme={theme}
    />
  );
}

/** Brend doira ikonkalari qatori. */
export function BrandIconRow({ brands, products, activeBrand, onSelect, t, bare, theme }) {
  return (
    <IconRow
      items={brands}
      products={products}
      field="brand"
      activeValue={activeBrand}
      onSelect={onSelect}
      allLabel={t.store.allBrands}
      bare={bare}
      theme={theme}
    />
  );
}

/** "Find Your Perfect Style" — kategoriya rasmli kartalar tarmog'i. */
export function CategoryShowcase({ categories, products, onSelect, t }) {
  const withThumbs = useMemo(
    () => categories.map((c) => ({ ...c, thumb: itemThumb(c, products, "category") })).slice(0, 4),
    [categories, products]
  );
  if (withThumbs.length === 0) return null;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{t.store.shopByCategory}</p>
          <h2 style={SERIF} className="text-2xl font-semibold text-stone-900 sm:text-3xl">{t.store.findYourStyle}</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {withThumbs.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.name)}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-rose-50 text-left"
          >
            {c.thumb ? (
              <img src={c.thumb} alt={c.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package size={32} className="text-stone-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <span className="flex items-center gap-1 text-xs opacity-90">
                {t.store.exploreNow} <ChevronRight size={12} />
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Admin o'zi yaratgan "to'plamlar" (kolleksiyalar) — o'z rasmi va sarlavhasi bilan, bosilganda faqat shu mahsulotlar ko'rsatiladi. */
/**
 * Bitta kolleksiya kartochkasi — sarlavha/tavsif rasm USTIDA emas,
 * rasmning TEPASIDA (matn → rasm → "Ko'rish" tugmasi tartibida).
 * Standard va Keng banner turlari FAQAT rasm nisbati (aspectRatio)
 * bilan farqlanadi — matn joylashuvi, shrift, bo'shliqlar bir xil.
 */
function CollectionCard({ c, lang, t, onSelect, aspectRatio, widthClass = "" }) {
  const title = collectionTitle(c, lang);
  return (
    <button onClick={() => onSelect(c)} className={`group flex shrink-0 flex-col text-left ${widthClass}`}>
      <div className="overflow-hidden rounded-2xl bg-rose-50" style={{ aspectRatio }}>
        <img src={c.imageUrl} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" draggable={false} onDragStart={(e) => e.preventDefault()} />
      </div>
      {title && <p className="mt-3 w-full line-clamp-2 text-center text-sm font-medium text-stone-800">{title}</p>}
    </button>
  );
}

export function CollectionShowcase({ collections, onSelect, t, lang, variant = "top" }) {
  const { viewportRef, scrollPrev, scrollNext } = useCarouselRow();

  const active = (collections || []).filter((c) => {
    if (c.active === false || !c.imageUrl) return false;
    if (variant === "bottom") return c.displayStyle === "cardBottom";
    return c.displayStyle === "card" || !c.displayStyle;
  });
  if (active.length === 0) return null;

  const tagText = variant === "bottom" ? t.store.moreCollectionsTag : t.store.shopByCategory;
  const titleText = variant === "bottom" ? t.store.moreCollectionsTitle : t.store.findYourStyle;

  return (
    <div>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{tagText}</p>
          <h2 style={SERIF} className="text-2xl font-semibold text-stone-900 sm:text-3xl">{titleText}</h2>
        </div>
      </div>
      <div className="relative">
        <div ref={viewportRef} className="embla-viewport">
        <div className="embla-container gap-3 sm:gap-4">
          {active.map((c) => (
            <CollectionCard key={c.id} c={c} lang={lang} t={t} onSelect={onSelect} aspectRatio="3 / 4" widthClass="w-[68vw] max-w-[240px] sm:w-56 sm:max-w-none lg:w-72" />
          ))}
        </div>
        </div>
        {active.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              aria-label="Oldingi"
              className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollNext}
              aria-label="Keyingi"
              className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Keng, gorizontal suriladigan banner uslubidagi to'plamlar qatori
 * (masalan reklama-banner ko'rinishidagi kolleksiyalar). Admin
 * "Keng banner" ko'rinishini tanlagan to'plamlar shu yerda,
 * "Mashhur" bo'limidan pastda ko'rinadi. Matn joylashuvi Standard
 * kartochka bilan bir xil — faqat rasm kengroq (2:1) bo'ladi.
 */
export function WideCollectionShowcase({ collections, onSelect, t, lang }) {
  const { viewportRef, scrollPrev, scrollNext } = useCarouselRow();

  const active = (collections || []).filter((c) => c.active !== false && c.imageUrl && c.displayStyle === "banner");
  if (active.length === 0) return null;

  return (
    <div className="relative">
      <div ref={viewportRef} className="embla-viewport">
      <div className="embla-container gap-3 sm:gap-4">
        {active.map((c) => (
          <CollectionCard key={c.id} c={c} lang={lang} t={t} onSelect={onSelect} aspectRatio="2 / 1" widthClass="w-[78vw] max-w-[340px] sm:w-[560px] sm:max-w-none" />
        ))}
      </div>
      </div>
      {active.length > 1 && (
        <>
          <button
            onClick={scrollPrev}
            aria-label="Oldingi"
            className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={scrollNext}
            aria-label="Keyingi"
            className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}
    </div>
  );
}
