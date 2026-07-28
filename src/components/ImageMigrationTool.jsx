// ==========================================================
// VAQTINCHALIK VOSITA — faqat BIR MARTA ishlatish uchun.
// Storage'da hozir turgan (yangi siqish tizimidan OLDIN yuklangan) katta
// rasmlarni topib, ularni kichraytirib/siqib, XUDDI O'SHA manzilga qayta
// saqlaydi. Manzil (URL) o'zgarmagani uchun Firestore'dagi hech qanday
// hujjatni (mahsulot, banner va h.k.) qo'lda tuzatish shart emas.
//
// Ishlatib bo'lgach bu fayl va uni chaqiruvchi qator (StoreSettings.jsx
// ichida) butunlay o'chiriladi — bu doimiy funksiya emas.
// ==========================================================
import React, { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { app } from "../firebase.js";
import { getStorage, ref, listAll, getMetadata, getBytes, uploadBytes } from "firebase/storage";

const T_LOCAL = {
  uz: {
    title: "Eski rasmlarni siqish (bir martalik)",
    hint: "Bu vosita Storage'dagi BARCHA rasmlarni tekshiradi va og'ir (700 KB dan katta) rasmlarni avtomatik kichraytirib qayta saqlaydi. Rasm manzili o'zgarmaydi — hech narsani qo'lda tuzatish shart emas. Bir necha daqiqa davom etishi mumkin, sahifani yopmang.",
    start: "Siqishni boshlash", running: "Siqilmoqda",
    doneMsg: "Tugadi!", processed: "ta rasm tekshirildi", compressed: "tasi siqildi", saved: "tejaldi", errors: "ta xatolik yuz berdi",
  },
  ru: {
    title: "Сжатие старых изображений (разово)",
    hint: "Проверит ВСЕ изображения в Storage и сожмёт тяжёлые (больше 700 КБ). Ссылка не меняется — ничего исправлять вручную не нужно. Может занять несколько минут, не закрывайте страницу.",
    start: "Начать сжатие", running: "Идёт сжатие",
    doneMsg: "Готово!", processed: "изображений проверено", compressed: "сжато", saved: "сэкономлено", errors: "ошибок",
  },
};

const MAX_DIMENSION = 1600;
const QUALITY = 0.85;
const MIN_SIZE_TO_COMPRESS = 700 * 1024;
const CONCURRENCY = 3;

async function listAllRecursive(storageRef) {
  const result = await listAll(storageRef);
  let items = [...result.items];
  for (const prefix of result.prefixes) {
    items = items.concat(await listAllRecursive(prefix));
  }
  return items;
}

function compressBlob(blob, contentType) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("canvas context yo'q")); return; }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const keepPng = contentType === "image/png";
      canvas.toBlob(
        (out) => (out ? resolve({ blob: out, contentType: keepPng ? "image/png" : "image/jpeg" }) : reject(new Error("siqib bo'lmadi"))),
        keepPng ? "image/png" : "image/jpeg",
        QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("rasm ochilmadi")); };
    img.src = url;
  });
}

export default function ImageMigrationTool({ lang }) {
  const t = T_LOCAL[lang] || T_LOCAL.uz;
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);

  const run = async () => {
    setRunning(true);
    setResult(null);
    const storage = getStorage(app);
    const allFiles = await listAllRecursive(ref(storage));
    setProgress({ done: 0, total: allFiles.length });

    let compressedCount = 0;
    let savedBytes = 0;
    const errors = [];
    let doneCount = 0;
    const bump = () => { doneCount++; setProgress({ done: doneCount, total: allFiles.length }); };

    const queue = [...allFiles];
    const worker = async () => {
      while (queue.length > 0) {
        const fileRef = queue.shift();
        if (!fileRef) break;
        try {
          const meta = await getMetadata(fileRef);
          const contentType = meta.contentType || "";
          const isCompressible = contentType.startsWith("image/") && contentType !== "image/svg+xml" && contentType !== "image/gif";
          if (!isCompressible || (meta.size || 0) < MIN_SIZE_TO_COMPRESS) {
            bump();
            continue;
          }
          const bytes = await getBytes(fileRef);
          const blob = new Blob([bytes], { type: contentType });
          const { blob: newBlob, contentType: newContentType } = await compressBlob(blob, contentType);
          if (newBlob.size < meta.size) {
            // customMetadata (shu jumladan firebaseStorageDownloadTokens) ATAYIN
            // saqlab qolinadi — shu tufayli mavjud rasm havolasi (URL) ishlashda
            // davom etadi, hech qanday Firestore hujjatini yangilash shart emas.
            await uploadBytes(fileRef, newBlob, {
              contentType: newContentType,
              customMetadata: meta.customMetadata || {},
            });
            compressedCount++;
            savedBytes += meta.size - newBlob.size;
          }
        } catch (e) {
          errors.push(`${fileRef.fullPath}: ${e?.message || e}`);
        }
        bump();
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    setResult({ processed: allFiles.length, compressed: compressedCount, savedBytes, errors });
    setRunning(false);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm border border-amber-200">
      <h3 className="mb-1 text-sm font-semibold text-slate-800">{t.title}</h3>
      <p className="mb-3 text-xs text-slate-400">{t.hint}</p>
      <button
        onClick={run}
        disabled={running}
        className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {running && <Loader2 size={15} className="animate-spin" />}
        {running ? `${t.running} (${progress.done}/${progress.total})` : t.start}
      </button>
      {result && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{t.doneMsg}</p>
            <p>
              {result.processed} {t.processed}, {result.compressed} {t.compressed}, ~
              {(result.savedBytes / (1024 * 1024)).toFixed(1)} MB {t.saved}.
            </p>
            {result.errors.length > 0 && (
              <p className="mt-1 text-amber-700">{result.errors.length} {t.errors}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
