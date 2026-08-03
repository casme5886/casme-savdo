// ==========================================================
// /api/delete-image
//
// Cloudflare R2'dan bitta faylni o'chiradi (masalan admin mahsulotdan
// bitta rasmni olib tashlaganda). Fayl allaqachon yo'q bo'lsa ham
// xato qaytarmaydi — bu holat muhim emas (frontend, src/storage.js
// deleteStorageFile() ham xatoni jim yutadi).
//
// KERAKLI ENVIRONMENT VARIABLE'LAR — api/upload-image.js bilan bir xil
// (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME).
// ==========================================================

import { AwsClient } from "aws4fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error("R2 environment variable'lari to'liq sozlanmagan (Vercel Environment Variables)");
    return res.status(200).json({ ok: false, error: "Server sozlanmagan" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: "Noto'g'ri JSON" });
  }
  const path = body?.path;
  if (!path || typeof path !== "string") {
    return res.status(400).json({ ok: false, error: "'path' kerak" });
  }
  const normalizedPath = path.replace(/^\/+/, "");

  try {
    const client = new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
    const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${normalizedPath}`;
    const r2Res = await client.fetch(endpoint, { method: "DELETE" });
    // R2 o'chirishda ham, fayl topilmasa ham odatda muvaffaqiyatli (204)
    // qaytaradi — shunday bo'lsa ham, boshqa xato holatlarini faqat
    // ogohlantirish sifatida logga yozamiz (mijozga xato ko'rsatilmaydi).
    if (!r2Res.ok && r2Res.status !== 404) {
      const errText = await r2Res.text().catch(() => "");
      console.warn("R2'dan o'chirishda ogohlantirish:", r2Res.status, errText);
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("R2 o'chirish so'rovida xatolik:", e);
    return res.status(200).json({ ok: false, error: "Server xatosi" });
  }
}
