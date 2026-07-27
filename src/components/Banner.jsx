import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import { incrementBannerClicks } from "../storage.js";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/** Banner uchun rasm tekislashini (yuqori/markaz/past) CSS qiymatiga aylantiradi. */
function positionFor(banner, useMobileImage) {
  const val = useMobileImage ? banner.mobileImagePosition : banner.desktopImagePosition;
  return val || "center";
}

/** Sarlavhaning oxirgi so'zini pushti rangda ajratib ko'rsatadi (masalan "Natural Glow"). */
function HighlightedTitle({ text, className }) {
  const words = (text || "").trim().split(" ");
  if (words.length <= 1) return <h1 style={SERIF} className={className}>{text}</h1>;
  const last = words.pop();
  return (
    <h1 style={SERIF} className={className}>
      {words.join(" ")} <span className="text-rose-400">{last}</span>
    </h1>
  );
}

/** Banner bugungi sanada ko'rsatilishi kerakmi — boshlanish/tugash sanasi bilan tekshiradi. */
export function isBannerLive(b) {
  if (!b.active) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (b.startDate && today < b.startDate) return false;
  if (b.endDate && today > b.endDate) return false;
  return true;
}

/**
 * Banner (yoki uning tugmasi) bosilganda ishga tushadi:
 *  - bosishlar sonini +1 qiladi (statistika)
 *  - agar bannerga mahsulotlar biriktirilgan bo'lsa — savatga
 *    qo'shmasdan, o'sha mahsulotlarni RO'YXAT sifatida ko'rsatadi
 *    (katalog bo'limiga o'tkazadi, filtrlab)
 *  - aks holda, oddiy havola sifatida ishlaydi (buttonLink'ga o'tadi)
 */
function useBannerClick(banner, onViewLinkedProducts) {
  return (e) => {
    if (!banner) return;
    incrementBannerClicks(banner.id);
    const linkedIds = banner.linkedProductIds || [];
    if (linkedIds.length > 0 && onViewLinkedProducts) {
      e.preventDefault();
      onViewLinkedProducts(banner, linkedIds);
    }
  };
}

/** Nuqta indikatorlari — rasm ustida, pastki qismida (yarim shaffof qora fon bilan har doim o'qiladigan). */
function DotIndicators({ active, index, onSelect }) {
  if (active.length <= 1) return null;
  return (
    <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center sm:bottom-4">
      <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
        {active.map((_, i) => (
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); onSelect(i); }}
            aria-label={`Banner ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Bitta banner slaydining tarkibi — rasm + (bo'lsa) matn ustidagi qatlam. */
function BannerSlide({ banner, useMobileImage, onViewLinkedProducts }) {
  const handleClick = useBannerClick(banner, onViewLinkedProducts);
  const imageUrl = useMobileImage ? banner.mobileImage : banner.desktopImage;
  const hasTextContent = !!(banner.badge || banner.title || banner.subtitle || banner.buttonText);
  const clickable = (banner.linkedProductIds || []).length > 0;

  return (
    <div
      className={`relative h-full w-full shrink-0 grow-0 basis-full ${clickable ? "cursor-pointer" : ""}`}
      onClick={clickable ? handleClick : undefined}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={banner.title || ""}
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: positionFor(banner, useMobileImage) }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-rose-100 text-stone-400">
          <span className="text-sm">{banner.title || ""}</span>
        </div>
      )}

      {hasTextContent && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-9 pt-16 sm:px-9 sm:pb-11">
            {banner.badge && (
              <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm">{banner.badge}</span>
            )}
            {banner.title && (
              <HighlightedTitle text={banner.title} className="max-w-md text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl" />
            )}
            {banner.subtitle && <p className="mt-2 max-w-sm text-sm text-white/85 sm:text-base">{banner.subtitle}</p>}
            {banner.buttonText && (
              <a
                href={banner.buttonLink || "#"}
                onClick={handleClick}
                className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800"
              >
                {banner.buttonText} <ChevronRight size={15} />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Do'kon bosh sahifasidagi banner — to'liq kенг rasm, matn (badge,
 * serif sarlavha, subtitle, qora tugma) rasm PASTIDA, yumshoq qora
 * gradient fon ustida chap tomonga tekislangan holda joylashadi.
 * Burchaklar katta radius bilan dumaloqlangan. DESKTOP rasm
 * konteyneri 1920:600 nisbatiga yaqin (16:5) saqlanadi, mobil esa
 * 800:1150 (bo'yiga cho'zilgan) — shu tufayli rasmlar deyarli
 * kesilmay ko'rinadi. Bir nechta faol banner bo'lsa, Embla Carousel
 * orqali (barmoq/sichqoncha bilan qo'lda surish imkoniyati bilan)
 * ular orasida o'tiladi, 5 soniyada avtomatik ham almashib turadi,
 * rasm ustida pastda nuqta indikatorlari ko'rinadi.
 */
export default function Banner({ banners, inTelegram, t, onViewLinkedProducts }) {
  const active = useMemo(
    () => (banners || []).filter(isBannerLive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [banners]
  );

  const [index, setIndex] = useState(0);
  const [isNarrow, setIsNarrow] = useState(true);

  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Qo'lda (barmoq/sichqoncha bilan) surish imkoniyati — Embla Carousel orqali.
  const [viewportRef, emblaApi] = useEmblaCarousel(
    { loop: active.length > 1, align: "start" },
    [WheelGesturesPlugin({ forceWheelAxis: "x" })]
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  // Avtomatik almashish — 5 soniyada bir marta, faqat 2+ banner bo'lsa.
  useEffect(() => {
    if (!emblaApi || active.length <= 1) return;
    const timer = setInterval(() => emblaApi.scrollNext(), 5000);
    return () => clearInterval(timer);
  }, [emblaApi, active.length]);

  const useMobileImage = inTelegram || isNarrow;
  const goPrev = () => emblaApi && emblaApi.scrollPrev();
  const goNext = () => emblaApi && emblaApi.scrollNext();
  const goTo = (i) => emblaApi && emblaApi.scrollTo(i);

  if (active.length === 0) {
    return <DefaultHero t={t} />;
  }

  return (
    <div>
      <div
        className="relative w-full overflow-hidden rounded-t-none rounded-b-[28px] min-[769px]:rounded-t-[28px]"
        style={{ aspectRatio: useMobileImage ? "800 / 1150" : "1920 / 600" }}
      >
        <div ref={viewportRef} className="embla-viewport h-full">
          <div className="embla-container h-full">
            {active.map((banner) => (
              <BannerSlide key={banner.id} banner={banner} useMobileImage={useMobileImage} onViewLinkedProducts={onViewLinkedProducts} />
            ))}
          </div>
        </div>

        <DotIndicators active={active} index={index} onSelect={goTo} />

        {active.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }} aria-label="Oldingi" className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white lg:flex">
              <ChevronLeft size={18} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goNext(); }} aria-label="Keyingi" className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white lg:flex">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Sharhlar bo'limidan oldin ko'rsatiladigan alohida reklama banneri.
 * Admin panelda 4-bannerni (order bo'yicha 4-o'rinda, faol holatda)
 * qo'shsa, shu yerda avtomatik ko'rinadi.
 */
export function MidPromoBanner({ banners, inTelegram, t, onViewLinkedProducts }) {
  const active = useMemo(
    () => (banners || []).filter(isBannerLive).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [banners]
  );
  const [isNarrow, setIsNarrow] = useState(true);
  useEffect(() => {
    const check = () => setIsNarrow(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const banner = active[3];
  const handleClick = useBannerClick(banner, onViewLinkedProducts);
  if (!banner) return null;

  const useMobileImage = inTelegram || isNarrow;
  const img = useMobileImage ? banner.mobileImage : banner.desktopImage;
  const clickable = (banner.linkedProductIds || []).length > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] bg-rose-50 ${clickable ? "cursor-pointer" : ""}`}
      style={{ aspectRatio: useMobileImage ? "1080 / 720" : "21 / 7" }}
      onClick={clickable ? handleClick : undefined}
    >
      {img && <img src={img} alt={banner.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: positionFor(banner, useMobileImage) }} className="absolute inset-0" />}
      <div className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center ${img ? "bg-black/35 text-white" : "text-stone-900"}`}>
        {banner.badge && <span className="mb-2 text-xs font-medium uppercase tracking-[0.2em] opacity-90">{banner.badge}</span>}
        {banner.title && <HighlightedTitle text={banner.title} className="max-w-lg text-2xl font-semibold leading-tight sm:text-3xl" />}
        {banner.subtitle && <p className="mt-2 max-w-md text-sm opacity-90">{banner.subtitle}</p>}
        {banner.buttonText && (
          <a
            href={banner.buttonLink || "#"}
            onClick={handleClick}
            className={`mt-4 inline-flex w-fit items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium ${img ? "bg-white text-stone-900 hover:bg-rose-50" : "bg-stone-900 text-white hover:bg-stone-800"}`}
          >
            {banner.buttonText} <ChevronRight size={15} />
          </a>
        )}
      </div>
    </div>
  );
}

function PromoTile({ tile, useMobileImage, onViewLinkedProducts }) {
  const img = useMobileImage ? tile.mobileImage : tile.desktopImage;
  const handleClick = useBannerClick(tile, onViewLinkedProducts);
  const clickable = (tile.linkedProductIds || []).length > 0;
  return (
    <div
      className={`relative flex min-h-[180px] items-center overflow-hidden rounded-2xl bg-rose-50 ${clickable ? "cursor-pointer" : ""}`}
      onClick={clickable ? handleClick : undefined}
    >
      {img && (
        <img src={img} alt={tile.title || ""} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: positionFor(tile, useMobileImage) }} />
      )}
      <div className={`relative z-10 flex h-full w-full flex-col justify-center px-6 py-6 ${img ? "bg-gradient-to-r from-black/55 via-black/10 to-transparent text-white" : "text-stone-900"}`}>
        {tile.badge && <span className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.2em] opacity-80">{tile.badge}</span>}
        {tile.title && <h3 style={SERIF} className="max-w-[220px] text-xl font-semibold leading-snug sm:text-2xl">{tile.title}</h3>}
        {tile.buttonText && (
          <a
            href={tile.buttonLink || "#"}
            onClick={handleClick}
            className={`mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium ${
              img ? "bg-white text-stone-900 hover:bg-rose-50" : "bg-stone-900 text-white hover:bg-stone-800"
            }`}
          >
            {tile.buttonText} <ChevronRight size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

function FeatureRow({ t }) {
  const items = [
    { icon: Truck, text: t.store.featShipping },
    { icon: RotateCcw, text: t.store.featReturns },
    { icon: ShieldCheck, text: t.store.featSecure },
  ];
  return (
    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-rose-100 pt-5">
      {items.map(({ icon: Icon, text }, i) => (
        <div key={i} className="flex items-center gap-2 text-xs text-stone-500">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <Icon size={13} />
          </span>
          {text}
        </div>
      ))}
    </div>
  );
}

/** Hech qanday banner sozlanmaganda ko'rinadigan standart hero. */
function DefaultHero({ t }) {
  return (
    <div className="overflow-hidden rounded-[28px] bg-rose-50">
      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 sm:py-14">
          <span className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-rose-500">{t.store.bannerTag}</span>
          <HighlightedTitle text={t.store.bannerTitle} className="max-w-md text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl lg:text-5xl" />
          <p className="mt-3 max-w-sm text-sm text-stone-500 sm:text-base">{t.store.bannerSubtitle}</p>
          <FeatureRow t={t} />
        </div>
        <div className="flex w-full items-center justify-center bg-rose-100 lg:w-[55%]" style={{ aspectRatio: "1920 / 600" }}>
          <span className="px-6 text-center text-sm text-stone-400">{t.store.bannerShipping}</span>
        </div>
      </div>
    </div>
  );
}
