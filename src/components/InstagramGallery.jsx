import React, { useMemo } from "react";
import { Instagram } from "lucide-react";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

/**
 * "Instagram" uslubidagi rasm tarmog'i — bu HAQIQIY Instagram
 * lentasi emas (bunday integratsiya alohida sozlash talab qiladi),
 * balki sizning mahsulot rasmlaringizdan tuzilgan chiroyli
 * kartochkalar to'ri. Agar Sozlamalarda Instagram akkountingizni
 * kiritgan bo'lsangiz, pastda "Obuna bo'lish" havolasi chiqadi.
 */
export default function InstagramGallery({ products, settings, t }) {
  const images = useMemo(() => {
    const list = [];
    for (const p of products || []) {
      const imgs = p.imageUrls && p.imageUrls.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []);
      for (const url of imgs) {
        list.push(url);
        if (list.length >= 6) return list;
      }
    }
    return list;
  }, [products]);

  if (images.length < 4) return null;

  const link = settings?.instagramLink || (settings?.instagramHandle ? `https://instagram.com/${settings.instagramHandle}` : null);

  return (
    <div>
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{t.store.instagramTag}</p>
        <h2 style={SERIF} className="text-2xl font-semibold text-stone-900 sm:text-3xl">
          {settings?.instagramHandle ? `@${settings.instagramHandle}` : t.store.instagramTitle}
        </h2>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
        {images.map((url, i) => (
          <a
            key={i}
            href={link || undefined}
            target={link ? "_blank" : undefined}
            rel={link ? "noopener noreferrer" : undefined}
            className="group relative aspect-square overflow-hidden rounded-xl bg-rose-50"
          >
            <img loading="lazy" src={url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-110" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100">
              <Instagram size={20} />
            </div>
          </a>
        ))}
      </div>
      {link && (
        <div className="mt-4 text-center">
          <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-500 hover:text-rose-600">
            <Instagram size={15} /> {t.store.instagramFollow}
          </a>
        </div>
      )}
    </div>
  );
}
