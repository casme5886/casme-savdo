import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Loader2 } from "lucide-react";

// Toshkent markazi — hali joylashuv tanlanmagan holatdagi standart nuqta.
const DEFAULT_CENTER = [41.311081, 69.240562];

/**
 * Xarita orqali manzil (lat/lng) tanlash — Google Maps uslubidagi "markazda
 * qotib turadigan belgi" patterni: belgi doim ekranning aynan markazida
 * turadi, xarita esa uning OSTIDA suriladi. Qaysi nuqta markazda bo'lsa —
 * o'sha nuqta tanlangan hisoblanadi va `onChange({ lat, lng })` chaqiriladi.
 * O'ng-pastki burchakda "mening joylashuvim" tugmasi bor — bosilganda GPS
 * orqali xarita avtomatik o'sha joyga olib boradi (belgi ham shu bilan
 * o'sha nuqtaga "ko'chadi", chunki u markazda qotib turibdi).
 *
 * Ishlatilishi:
 *   <MapPicker value={location} onChange={setLocation} />
 */
export default function MapPicker({ value, onChange, height = 220 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [locating, setLocating] = useState(false);

  // Xaritani bir marta yaratamiz.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center = value ? [value.lat, value.lng] : DEFAULT_CENTER;
    const map = L.map(containerRef.current, { attributionControl: false }).setView(center, value ? 15 : 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const emitCenter = () => {
      const c = map.getCenter();
      onChangeRef.current({ lat: c.lat, lng: c.lng });
    };
    map.on("moveend", emitCenter);
    // Boshlang'ich markazni ham darhol tanlangan qiymat sifatida yuboramiz.
    emitCenter();

    // Modal/oyna ichida ochilganda o'lcham darhol to'g'ri hisoblanmasligi
    // mumkin — bir oz kutib qayta hisoblaymiz.
    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.off("moveend", emitCenter);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tashqaridan (masalan formadagi alohida "Joylashuvni aniqlash" tugmasi
  // orqali) value o'zgarsa — xaritani ham shu nuqtaga markazlaymiz.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !value) return;
    const current = map.getCenter();
    if (Math.abs(current.lat - value.lat) > 1e-6 || Math.abs(current.lng - value.lng) > 1e-6) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 15));
    }
  }, [value?.lat, value?.lng]);

  const locateMe = () => {
    if (!navigator.geolocation || !mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current.setView([pos.coords.latitude, pos.coords.longitude], 16);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="relative" style={{ height, width: "100%" }}>
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%", borderRadius: 12, overflow: "hidden" }}
        className="border border-gray-200"
      />

      {/* Markazda qotib turadigan belgi — xarita ostida suriladi, belgi joyidan qimirlamaydi */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500]" style={{ transform: "translate(-50%, -100%)" }}>
        <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="12" cy="27" rx="5" ry="2" fill="black" opacity="0.18" />
          <path d="M12 0C6.75 0 2.5 4.25 2.5 9.5c0 7.15 9.5 17.5 9.5 17.5s9.5-10.35 9.5-17.5C21.5 4.25 17.25 0 12 0z" fill="#2563EB" />
          <circle cx="12" cy="9.5" r="3.6" fill="white" />
        </svg>
      </div>

      {/* O'ng-pastki burchakdagi "mening joylashuvim" tugmasi */}
      <button
        type="button"
        onClick={locateMe}
        disabled={locating}
        aria-label="Joylashuvimni aniqlash"
        className="absolute bottom-3 right-3 z-[500] flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-600 shadow-md transition hover:bg-gray-50 disabled:opacity-60"
      >
        {locating ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={17} />}
      </button>
    </div>
  );
}
