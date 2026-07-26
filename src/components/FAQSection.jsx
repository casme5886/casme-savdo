import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const SERIF = { fontFamily: "'Playfair Display', Georgia, serif" };

export default function FAQSection({ faqs, t }) {
  const active = (faqs || []).filter((x) => x.active).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const [openId, setOpenId] = useState(null);
  if (active.length === 0) return null;

  return (
    <div>
      <div className="mb-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">{t.store.faqTag}</p>
        <h2 style={SERIF} className="text-2xl font-semibold text-stone-900 sm:text-3xl">{t.store.faqTitle}</h2>
      </div>
      <div className="mx-auto max-w-2xl space-y-2">
        {active.map((item) => {
          const isOpen = openId === item.id;
          return (
            <div key={item.id} className="overflow-hidden rounded-xl bg-rose-50">
              <button
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              >
                <span className="text-sm font-medium text-stone-800">{item.question}</span>
                <ChevronDown size={16} className={`shrink-0 text-rose-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <p className="px-4 pb-4 text-sm text-stone-500">{item.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
