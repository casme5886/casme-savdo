import React, { useMemo, useEffect, useRef, useState } from "react";
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
export function itemThumb(item, products, field) {
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

/**
 * Banner ostidagi qisqa "Kategoriyalar" qatori — har bir kategoriya
 * yumshoq gradient fonli dumaloq burchakli karta, ustida rasm, tagida
 * nomi. Kategoriyalar soni cheklanmagan — qator gorizontal suriladi
 * (mobil va desktopda scroll bilan). Admin panelda "Kategoriyalar"
 * oynasidan nomi va rasmi istalgancha o'zgartiriladi/qo'shiladi.
 */
const QUICK_GRADIENTS = [
  "from-rose-200 via-rose-50 to-white",
  "from-fuchsia-200 via-fuchsia-50 to-white",
  "from-sky-200 via-sky-50 to-white",
  "from-violet-200 via-violet-50 to-white",
  "from-amber-200 via-amber-50 to-white",
  "from-emerald-200 via-emerald-50 to-white",
];

export function CategoryQuickRow({ categories, products, onSelect, t }) {
  const withThumbs = useMemo(
    () => (categories || []).map((c) => ({ ...c, thumb: itemThumb(c, products, "category") })),
    [categories, products]
  );
  if (withThumbs.length === 0) return null;

  return (
    <div>
      <h2 style={SERIF} className="mb-4 text-xl font-semibold text-rose-600 sm:text-2xl">{t.store.navCategories}</h2>
      <div className="flex overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", msOverflowStyle: "none", gap: "0px" }}>
        {withThumbs.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.name)}
            className="flex w-[100px] shrink-0 flex-col items-center gap-2 sm:w-[116px]"
          >
            <span
              className={`relative flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-[26%] transition-transform duration-200 hover:-translate-y-0.5 sm:h-28 sm:w-28 ${c.thumb ? "" : `bg-gradient-to-br ${QUICK_GRADIENTS[i % QUICK_GRADIENTS.length]}`}`}
              style={{ boxShadow: "0 10px 20px -4px rgba(0,0,0,0.28), 0 3px 6px rgba(0,0,0,0.16), inset 0 1px 1px rgba(255,255,255,0.5)" }}
            >
              {c.thumb ? (
                <img src={c.thumb} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <Package size={28} className="text-stone-400" />
              )}
              {/* Yaltiroq 3D "shisha" ta'siri — yuqori chap burchakda yorug'lik aksi */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 28%, rgba(255,255,255,0) 55%, rgba(0,0,0,0.08) 100%)" }}
              />
            </span>
            <span className="max-w-[100px] truncate text-center text-xs font-medium text-stone-700 sm:text-sm">{c.name}</span>
          </button>
        ))}
      </div>
    </div>
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
function CollectionCard({ c, lang, t, onSelect, aspectRatio, widthClass = "", showTitle = true }) {
  const title = collectionTitle(c, lang);
  return (
    <button onClick={() => onSelect(c)} className={`group flex shrink-0 flex-col text-left ${widthClass}`}>
      <div className="overflow-hidden rounded-2xl bg-rose-50" style={{ aspectRatio }}>
        <img src={c.imageUrl} alt={title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" draggable={false} onDragStart={(e) => e.preventDefault()} />
      </div>
      {showTitle && title && <p className="mt-3 w-full line-clamp-2 text-center text-sm font-medium text-stone-800">{title}</p>}
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
  const active = (collections || []).filter((c) => c.active !== false && c.imageUrl && c.displayStyle === "banner");

  // ILDIZ SABAB (avvalgi versiyada): biz o'zimiz banner ro'yxatini qo'lda
  // ("loopSlides") bir necha marta takrorlab, USHBU takrorlangan ro'yxat
  // ustiga YANA Embla'ning o'z ichki `loop: true` klonlash mexanizmini
  // qo'shgan edik. Ya'ni ikkita mustaqil "aylanish/klonlash" tizimi bir
  // vaqtda ishlagan — bittasi bizniki (React darajasida, statik massiv),
  // ikkinchisi Embla'niki (DOM darajasida, dinamik klonlar). Bu ikkalasi
  // doim bir-biriga mos kelishini kafolatlab bo'lmaydi: masalan oxirgi
  // "qo'lda takrorlangan" elementga atayin `margin` berilmagan edi (chunki
  // u ro'yxatning "oxiri" deb hisoblangan), lekin `loop: true` bilan aslida
  // undan keyin ham Embla o'zining klonini joylashtiradi — natijada aynan
  // o'sha chegarada doimiy bo'shliqsiz "chok" hosil bo'lgan, va Embla har
  // safar oyna o'lchami o'zgarganda yoki qayta ishga tushganda klonlarni
  // qayta hisoblaganida bu nomuvofiqlik turlicha namoyon bo'lgan (goh
  // ko'rinib, goh ko'rinmay, "bir necha marta aylangandan keyin" degan
  // taassurot qoldirgan).
  //
  // TUZATISH: endi Embla'ning O'ZIGA ishonamiz — u har qanday miqdordagi
  // slaydni (hatto atigi 2 tasini ham) o'zi yetarlicha klonlab, uzluksiz
  // aylanishni ta'minlay oladi. Bizning tomondan qo'shimcha "qo'lda
  // takrorlash" YO'Q — shu bilan ikkita tizim orasidagi nomuvofiqlik
  // manbai butunlay yo'qoladi. Bo'shliq (margin) esa HAR BIR asl slaydga
  // bir xilda, SHARTSIZ qo'llanadi (oxirgisiga ham) — chunki `loop: true`
  // rejimida haqiqiy "oxirgi element" tushunchasi yo'q (u doim keyingi
  // klonga ulanadi), shuning uchun margin universal va doimiy bo'ladi.
  const hasMultiple = active.length > 1;

  // `dragFree: false` — surilgandan so'ng albatta bitta banner to'liq
  // ko'rinadigan holatga "yopishib" (snap) qoladi. `containScroll: false` —
  // Embla hujjatlariga ko'ra `loop: true` bilan birga `containScroll`
  // ishlatilmasligi kerak (ikkalasi mos kelmaydi, nomuvofiqlik keltirib
  // chiqarishi mumkin), shuning uchun aniq o'chirib qo'yamiz.
  const { viewportRef, emblaApi, scrollPrev, scrollNext } = useCarouselRow({
    align: "center",
    loop: hasMultiple,
    dragFree: false,
    containScroll: false,
  });

  // Ekranda ko'rinib-ko'rinmasligini kuzatish (IntersectionObserver) — bo'lim
  // ekrandan chiqib ketganda avtomatik almashinuvni to'xtatib, batareya/CPU
  // behuda ishlatilishining oldini olamiz. Boshlang'ich qiymat `true` —
  // shu bilan birinchi render paytida (Observer hali ulanmagan bo'lsa ham)
  // karusel darhol ishlay boshlaydi.
  const wrapperRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 } // kamida chorak qismi ko'rinsa — "ko'rinyapti" deb hisoblanadi
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // `isVisible` o'zgarganda (ekranga kirdi/chiqdi) effekt qayta ishga tushadi:
    // React avval ESKI intervalni tozalaydi (cleanup), keyin YANGISINI o'rnatadi —
    // shu tufayli hech qachon bir nechta interval bir vaqtda ishlamaydi.
    // Karuselning joriy holati (qaysi slaydda turgani) `emblaApi` ichida saqlanadi
    // va bu yerda hech qachon qayta tiklanmaydi (scrollTo(0) chaqirilmaydi) —
    // shuning uchun ko'rinishga qaytganda xuddi shu slayddan davom etadi.
    if (!emblaApi || !hasMultiple || !isVisible) return;
    const timer = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => clearInterval(timer);
  }, [emblaApi, hasMultiple, isVisible]);

  if (active.length === 0) return null;

  return (
    <div className="relative" ref={wrapperRef}>
      <div ref={viewportRef} className="embla-viewport">
      {/* Diqqat: slaydlar orasidagi bo'shliq uchun flex `gap` EMAS, balki
          har bir kartaning o'ng tomonidagi `margin` ishlatiladi — ba'zi
          eski WebView'larda flex `gap` tan olinmasligi mumkin, va `loop:
          true` bilan birga `gap` ishlatish Embla hujjatlarida tavsiya
          etilmaydi. Margin HAR BIR slaydga (oxirgisiga ham) bir xilda
          qo'llanadi — chunki cheksiz aylanishda "oxirgi" element yo'q. */}
      <div className="embla-container">
        {active.map((c) => (
          <CollectionCard
            key={c.id}
            c={c}
            lang={lang}
            t={t}
            onSelect={onSelect}
            aspectRatio="950 / 400"
            widthClass="w-[78vw] max-w-[340px] sm:w-[560px] sm:max-w-none mr-3 sm:mr-4"
            showTitle={false}
          />
        ))}
      </div>
      </div>
      {hasMultiple && (
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
