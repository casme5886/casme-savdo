import React, { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Truck, RotateCcw, ShieldCheck } from "lucide-react";
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
      {words.join(" ")} <span className="text-rose-500">{last}</span>
    </h1>
  );
}

/** Banner bugungi sanada ko'rsatilishi kerakmi — boshlanish/tugash sanasi bilan tekshiradi. */
function isBannerLive(b) {
  if (!b.active) return false;
  const today = new Date().toISOString().slice(0, 10);
  if (b.startDate && today < b.startDate) return false;
  if (b.endDate && today > b.endDate) return false;
  return true;
}

/**
 * Banner (yoki uning tugmasi) bosilganda ishga tushadi:
 *  - bosishlar sonini +1 qiladi (statistika)
 *  - agar bannerga mahsulotlar biriktirilgan bo'lsa — o'shalarni
 *    AVTOMATIK savatga qo'shadi va savatni ochadi
 *  - aks holda, oddiy havola sifatida ishlaydi (buttonLink'ga o'tadi)
 */
function useBannerClick(banner, products, onAddLinkedProducts) {
  return (e) => {
    if (!banner) return;
    incrementBannerClicks(banner.id);
    const linkedIds = banner.linkedProductIds || [];
    if (linkedIds.length > 0 && onAddLinkedProducts) {
      e.preventDefault();
      const linked = linkedIds.map((id) => (products || []).find((p) => p.id === id)).filter(Boolean);
      onAddLinkedProducts(linked);
    }
  };
}

/**
 * Do'kon bosh sahifasidagi banner — "split hero": chapda matn
 * (badge, serif sarlavha, subtitle, tugma), o'ngda rasm + doira
 * chegirma nishoni. DESKTOP rasm konteyneri 1920:600 nisbatiga
 * yaqin (16:5) saqlanadi — shu tufayli to'g'ri o'lchamdagi
 * rasmlar deyarli kesilmay ko'rinadi. Bir nechta faol banner
 * bo'lsa, katta banner ular orasida 5 soniyada avtomatik almashadi.
 */
export default function Banner({ banners, inTelegram, t, products, onAddLinkedProducts }) {
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

  useEffect(() => {
    if (active.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % active.length), 5000);
    return () => clearInterval(timer);
  }, [active.length]);

  useEffect(() => {
    if (index >= active.length) setIndex(0);
  }, [active.length, index]);

  const useMobileImage = inTelegram || isNarrow;
  const goPrev = () => setIndex((i) => (i - 1 + active.length) % active.length);
  const goNext = () => setIndex((i) => (i + 1) % active.length);

  const promoTiles = active.slice(1, 3);
  const banner = active[index];
  const handleClick = useBannerClick(banner, products, onAddLinkedProducts);

  if (active.length === 0) {
    return <DefaultHero t={t} />;
  }

  const imageUrl = useMobileImage ? banner.mobileImage : banner.desktopImage;
  const hasTextContent = !!(banner.badge || banner.title || banner.subtitle || banner.buttonText);
  const clickable = (banner.linkedProductIds || []).length > 0;

  if (!hasTextContent && imageUrl) {
    return (
      <div>
        <div
          className={`relative w-full overflow-hidden rounded-2xl ${clickable ? "cursor-pointer" : ""}`}
          style={{ aspectRatio: useMobileImage ? "1080 / 720" : "1920 / 600" }}
          onClick={clickable ? handleClick : undefined}
        >
          <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: positionFor(banner, useMobileImage) }} />
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
        {active.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5">
            {active.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Banner ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-rose-500" : "w-1.5 bg-rose-200"}`}
              />
            ))}
          </div>
        )}
        {promoTiles.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {promoTiles.map((tile) => (
              <PromoTile key={tile.id} tile={tile} useMobileImage={useMobileImage} products={products} onAddLinkedProducts={onAddLinkedProducts} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-rose-50">
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {/* Matn */}
          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10 sm:py-12">
            {banner.badge && (
              <span className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-rose-500">{banner.badge}</span>
            )}
            {banner.title && (
              <HighlightedTitle text={banner.title} className="max-w-md text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl lg:text-5xl" />
            )}
            {banner.subtitle && <p className="mt-3 max-w-sm text-sm text-stone-500 sm:text-base">{banner.subtitle}</p>}
            {banner.buttonText && (
              <a
                href={banner.buttonLink || "#"}
                onClick={handleClick}
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
              >
                {banner.buttonText} <ChevronRight size={15} />
              </a>
            )}
            <FeatureRow t={t} />
          </div>

          {/* Rasm — keng (1920:600 ga yaqin) nisbatda, shuning uchun to'g'ri o'lchamdagi rasm deyarli kesilmaydi */}
          <div
            className={`relative w-full lg:w-[55%] ${clickable ? "cursor-pointer" : ""}`}
            style={{ aspectRatio: useMobileImage ? "1080 / 720" : "1920 / 600" }}
            onClick={clickable ? handleClick : undefined}
          >
            {imageUrl ? (
              <img src={imageUrl} alt={banner.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: positionFor(banner, useMobileImage) }} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-rose-100 text-stone-400">
                <span className="text-sm">{banner.title || ""}</span>
              </div>
            )}

            {/* Chegirma doira nishoni — faqat badge bo'lsa ko'rinadi */}
            {banner.badge && (
              <div className="absolute right-4 top-4 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white text-center shadow-md sm:right-6 sm:top-6 sm:h-24 sm:w-24">
                <span className="text-base font-bold text-rose-500 sm:text-lg">{banner.badge}</span>
                {banner.buttonText && <span className="text-[9px] leading-tight text-stone-400">{t.store.newCustomerOffer}</span>}
              </div>
            )}
          </div>
        </div>

        {active.length > 1 && (
          <>
            <button onClick={goPrev} aria-label="Oldingi" className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white lg:flex">
              <ChevronLeft size={18} />
            </button>
            <button onClick={goNext} aria-label="Keyingi" className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white lg:flex">
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>

      {active.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {active.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Banner ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-rose-500" : "w-1.5 bg-rose-200"}`}
            />
          ))}
        </div>
      )}

      {/* Promo tayllar — 2- va 3-bannerlar bo'lsa, qo'shimcha kichik kartalar sifatida */}
      {promoTiles.length > 0 && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {promoTiles.map((tile) => (
            <PromoTile key={tile.id} tile={tile} useMobileImage={useMobileImage} products={products} onAddLinkedProducts={onAddLinkedProducts} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Sharhlar bo'limidan oldin ko'rsatiladigan alohida reklama banneri.
 * Admin panelda 4-bannerni (order bo'yicha 4-o'rinda, faol holatda)
 * qo'shsa, shu yerda avtomatik ko'rinadi.
 */
export function MidPromoBanner({ banners, inTelegram, t, products, onAddLinkedProducts }) {
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
  const handleClick = useBannerClick(banner, products, onAddLinkedProducts);
  if (!banner) return null;

  const useMobileImage = inTelegram || isNarrow;
  const img = useMobileImage ? banner.mobileImage : banner.desktopImage;
  const clickable = (banner.linkedProductIds || []).length > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-rose-50 ${clickable ? "cursor-pointer" : ""}`}
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

function PromoTile({ tile, useMobileImage, products, onAddLinkedProducts }) {
  const img = useMobileImage ? tile.mobileImage : tile.desktopImage;
  const handleClick = useBannerClick(tile, products, onAddLinkedProducts);
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
    <div className="overflow-hidden rounded-2xl bg-rose-50">
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
