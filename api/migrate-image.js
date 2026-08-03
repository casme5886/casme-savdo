// ==========================================================
// /api/migrate-image
//
// Bir martalik migratsiya uchun: bitta Firebase Storage rasm havolasini
// SERVERDA (Vercel funksiyasi ichida) yuklab oladi va Cloudflare R2'ga
// qayta yuklaydi, so'ng yangi (R2) ochiq havolani qaytaradi.
//
// NIMA UCHUN BU ALOHIDA ENDPOINT KERAK (frontend'da to'g'ridan-to'g'ri
// fetch() qilish o'rniga)?
// Brauzerdan Firebase Storage'ga fetch() qilinganda CORS xatosi chiqadi
// ("Failed to fetch") — chunki Firebase Storage bucket'ida standart
// bo'yicha boshqa domenlardan JS orqali o'qishga CORS ruxsati
// sozlanmagan (faqat <img> tegi orqali ko'rsatish ishlaydi, lekin fetch()
// ishlamaydi). CORS — faqat BRAUZER xavfsizlik cheklovi, SERVERDAN
// SERVERGA so'rovda bunday cheklov yo'q, shuning uchun shu ishni
// Vercel funksiyasi (server) ichida bajaramiz.
//
// KERAKLI ENVIRONMENT VARIABLE'LAR — api/upload-image.js bilan bir xil.
// ==========================================================

import { AwsClient } from "aws4fetch";

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

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false, error: "Noto'g'ri JSON" });
  }
  const sourceUrl = body?.sourceUrl;
  const path = body?.path;
  if (!sourceUrl || !path) {
    return res.status(400).json({ ok: false, error: "'sourceUrl' va 'path' kerak" });
  }
  // Xavfsizlik: faqat Firebase Storage manzillaridan yuklab olishga ruxsat
  // beramiz — bu endpoint boshqa (ixtiyoriy) URL'lardan fayl yuklab olib,
  // R2'ga yozadigan umumiy proksi sifatida suiiste'mol qilinmasligi uchun.
  if (!/^https:\/\/firebasestorage\.(googleapis\.com|app)\//.test(sourceUrl)) {
    return res.status(400).json({ ok: false, error: "Faqat Firebase Storage manzillari qabul qilinadi" });
  }

  const normalizedPath = String(path).replace(/^\/+/, "");

  try {
    const fileRes = await fetch(sourceUrl);
    if (!fileRes.ok) {
      return res.status(502).json({ ok: false, error: `Manba fayl yuklab olinmadi (HTTP ${fileRes.status})` });
    }
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

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
    console.error("Migratsiya so'rovida xatolik:", e);
    return res.status(500).json({ ok: false, error: "Server xatosi" });
  }
}
