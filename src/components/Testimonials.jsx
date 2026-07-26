import React from "react";
import { Star, Quote } from "lucide-react";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

export default function Testimonials({ testimonials, t }) {
  const active = (testimonials || []).filter((x) => x.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (active.length === 0) return null;

  return (
    <div>
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{t.store.testimonialsTag}</p>
        <h2 style={SERIF} className="text-2xl font-semibold text-stone-900 sm:text-3xl">{t.store.testimonialsTitle}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active.map((item) => (
          <div key={item.id} className="rounded-2xl bg-rose-50 p-5">
            <Quote size={20} className="mb-2 text-rose-300" />
            <div className="mb-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={13} className={i < (item.rating || 5) ? "fill-amber-400 text-amber-400" : "text-stone-300"} />
              ))}
            </div>
            <p className="mb-3 text-sm text-stone-600">{item.text}</p>
            <p className="text-sm font-semibold text-stone-900">{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
