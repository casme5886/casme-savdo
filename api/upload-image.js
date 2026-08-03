// ==========================================================
// /api/upload-image
//
// Rasmlarni Cloudflare R2'ga yuklaydigan Vercel serverless funksiya.
// Frontend (src/storage.js, uploadImage()) rasmni (allaqachon
// brauzerda siqilgan/kichraytirilgan holda) shu manzilga XOM (raw)
// binary sifatida POST qiladi, biz uni R2'ga saqlaymiz va ochiq
// (public) havolasini qaytaramiz.
//
// NIMA UCHUN R2 (Firebase Storage o'rniga)?
// Firebase Storage'ning bepul darajasi juda kichik (1 GB saqlash,
// 10 GB/oy yuklab olish trafigi) va undan oshsa har GB yuklab olish
// uchun alohida to'lov olinadi. Cloudflare R2'da esa yuklab olish
// (egress) TRAFIGI BUTUNLAY BEPUL — faqat saqlash uchun (10 GB'gacha
// bepul) to'lov bo'ladi. Savdo saytida rasm ko'p ko'riladigan
// (yuklab olinadigan) bo'lgani uchun bu ancha arzon yechim.
//
// R2 — Amazon S3 bilan bir xil (S3-compatible) API'ga ega, shuning
// uchun uni imzolash (signing) uchun yengil "aws4fetch" kutubxonasidan
// foydalanamiz (og'ir "@aws-sdk/client-s3" o'rniga — bu loyihada
// avvalroq og'ir SDK'larni Vercel funksiyalarida import qilishda
// muammo chiqqani sababli, iloji boricha yengil/soddaroq yo'l
// tanlangan).
//
// KERAKLI ENVIRONMENT VARIABLE'LAR (Vercel → Settings → Environment
// Variables'ga qo'shiladi, KODGA HECH QACHON YOZILMAYDI):
//   R2_ACCOUNT_ID        — Cloudflare Dashboard → R2 sahifasida ko'rsatiladi
//   R2_ACCESS_KEY_ID      — "Manage R2 API tokens" orqali yaratilgan token
//   R2_SECRET_ACCESS_KEY  — shu tokenning maxfiy kaliti
//   R2_BUCKET_NAME        — yaratilgan bucket nomi (masalan "casme-images")
//   R2_PUBLIC_URL         — bucket'ning ochiq (public) manzili, oxirida
//                           "/" BO'LMASIN (masalan
//                           "https://pub-xxxxxxxx.r2.dev" yoki
//                           "https://img.casme.uz")
// ==========================================================

import { AwsClient } from "aws4fetch";

// Vercel'ga bu funksiya uchun JSON parserni O'CHIRISHNI aytamiz —
// chunki bu yerga XOM (raw) rasm binary'si keladi, JSON emas.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
    console.error("R2 environment variable'lari to'liq sozlanmagan (Vercel Environment Variables)");
    return res.status(500).json({ ok: false, error: "Server sozlanmagan (R2 o'zgaruvchilari yo'q)" });
  }

  // "path" — masalan "products/abc123/image-0.jpg" (Firebase Storage'da
  // ishlatilgan naqadga o'xshash, shu bilan bir xil "papka/id/nom" tuzilishi
  // frontend kodida deyarli o'zgarishsiz qoladi).
  const path = req.query.path;
  if (!path || typeof path !== "string") {
    return res.status(400).json({ ok: false, error: "'path' parametri kerak" });
  }

  let buffer;
  try {
    buffer = await readRawBody(req);
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Fayl o'qishda xatolik" });
  }
  if (!buffer || buffer.length === 0) {
    return res.status(400).json({ ok: false, error: "Bo'sh fayl" });
  }

  const contentType = req.headers["content-type"] || "application/octet-stream";
  const normalizedPath = path.replace(/^\/+/, ""); // boshidagi "/" larni olib tashlaymiz

  try {
    const client = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });

    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${normalizedPath}`;
    const r2Res = await client.fetch(endpoint, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: buffer,
    });

    if (!r2Res.ok) {
      const errText = await r2Res.text().catch(() => "");
      console.error("R2'ga yuklashda xatolik:", r2Res.status, errText);
      return res.status(502).json({ ok: false, error: "R2'ga yuklab bo'lmadi" });
    }

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/+$/, "")}/${normalizedPath}`;
    return res.status(200).json({ ok: true, url: publicUrl });
  } catch (e) {
    console.error("R2 so'rovida xatolik:", e);
    return res.status(500).json({ ok: false, error: "Server xatosi" });
  }
}
