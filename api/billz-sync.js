// ==========================================================
// /api/billz-sync
//
// Billz SRM tizimidagi ombor qoldiqlarini saytdagi mahsulotlar bilan
// SINXRONLAYDI — FAQAT bir yo'nalishda: Billz → sayt, va FAQAT
// qoldiqni KAMAYTIRISH tomonga (bu cheklov Firestore xavfsizlik
// qoidasida — firestore.rules — allaqachon bor: anonim (login qilmagan)
// yozuv "stock" maydonini faqat kamaytirishi mumkin, oshira olmaydi).
//
// Nima uchun shunday: mijoz saytda buyurtma bersa, bu SRM'dagi
// qoldiqqa ta'sir qilmasligi kerak (faqat SRM'ning o'zi — ombordan
// haqiqiy chiqarilganda — qoldiqni kamaytirishi kerak). Shu bilan
// birga, agar SRM'da ombor to'ldirilsa (qoldiq oshsa), bu hozircha
// saytga ko'rinmaydi — buni xohlasangiz keyin alohida ochib beriladi.
//
// QANDAY ISHLAYDI:
// 1. Billz'ga "secret_token" bilan kirib, vaqtinchalik "access_token" olamiz.
// 2. Billz'dan BARCHA mahsulotlarni (barcode/sku va ombor qoldig'i bilan) o'qiymiz.
// 3. Saytdagi BARCHA mahsulotlarni o'qiymiz (Firestore'dan, "barcode" maydoni bilan).
// 4. Har bir Billz mahsulotini "barcode" (yoki "sku") orqali saytdagi
//    mahsulotga bog'laymiz — mahsulotning O'ZI (nomi, narxi, rasmi)
//    HECH QACHON o'zgartirilmaydi, FAQAT "stock" (qoldiq) maydoni.
// 5. Faqat kamaygan hollarda saytdagi qoldiqni yangilaymiz.
//
// Bu manzil ochiq internetga chiqadi, shuning uchun "x-sync-secret"
// sarlavhasi (header) orqali himoyalangan — faqat shu maxfiy kalitni
// biladigan chaqiruvchi (bizning GitHub Actions vazifamiz) ishlata oladi.
//
// KERAKLI ENVIRONMENT VARIABLES (Vercel'da qo'shiladi):
//   BILLZ_SECRET_TOKEN — Billz admin panelidan olingan API kaliti
//   SYNC_SECRET         — o'zingiz o'ylab topgan tasodifiy maxfiy so'z
//                          (GitHub repo'dagi "Secrets"ga ham xuddi shuni qo'shasiz)
// ==========================================================

const FIREBASE_PROJECT_ID = "casme-savdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

const BILLZ_HOST = "https://api-admin.billz.ai";
const BILLZ_AUTH_PATH = "/v1/auth/login";
const BILLZ_PRODUCTS_PATH = "/v2/products";
const BILLZ_PAGE_LIMIT = 200;

// ---------- Firestore REST yordamchi funksiyalari (firebase paketisiz — boshqa /api fayllar bilan bir xil uslub) ----------

function decodeValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(decodeValue);
  if (val.mapValue !== undefined) return decodeFields(val.mapValue.fields || {});
  return null;
}

function decodeFields(fields) {
  const out = {};
  for (const [key, val] of Object.entries(fields || {})) out[key] = decodeValue(val);
  return out;
}

function encodeFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") fields[key] = { stringValue: val };
    else if (typeof val === "number") fields[key] = Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    else if (typeof val === "boolean") fields[key] = { booleanValue: val };
    else fields[key] = { nullValue: null };
  }
  return fields;
}

/** Saytdagi "products" kolleksiyasidan BARCHA hujjatlarni o'qiydi (id, barcode, stock, stockType bilan). */
async function fetchAllSiteProducts() {
  const body = {
    structuredQuery: {
      from: [{ collectionId: "products" }],
      limit: 5000,
    },
  };
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firestore runQuery xatosi: ${res.status} ${errText}`);
  }
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r.document)
    .map((r) => ({ id: r.document.name.split("/").pop(), ...decodeFields(r.document.fields || {}) }));
}

/** Faqat "stock" maydonini yangilaydi — boshqa hech narsaga tegmaydi. */
async function patchStock(productId, newStock) {
  const fields = encodeFields({ stock: newStock });
  const res = await fetch(`${FIRESTORE_BASE}/products/${productId}?updateMask.fieldPaths=stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Firestore PATCH xatosi (${productId}): ${res.status} ${errText}`);
  }
}

// ---------- Billz API yordamchi funksiyalari ----------

async function billzLogin(secretToken) {
  const res = await fetch(`${BILLZ_HOST}${BILLZ_AUTH_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_token: secretToken }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.code !== 200 || !json.data?.access_token) {
    throw new Error(`Billz login muvaffaqiyatsiz: ${res.status} ${JSON.stringify(json)}`);
  }
  return json.data.access_token;
}

/** Billz'dagi BARCHA mahsulotlarni sahifalab (pagination) yig'ib chiqadi. */
async function fetchAllBillzProducts(accessToken) {
  const all = [];
  let page = 1;
  while (true) {
    const url = new URL(`${BILLZ_HOST}${BILLZ_PRODUCTS_PATH}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(BILLZ_PAGE_LIMIT));
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Billz mahsulotlar so'rovi xatosi: ${res.status} ${errText}`);
    }
    const json = await res.json();
    const products = Array.isArray(json.products) ? json.products : [];
    all.push(...products);
    if (products.length < BILLZ_PAGE_LIMIT || all.length >= (json.count || 0)) break;
    page += 1;
    if (page > 200) break; // xavfsizlik cheklovi — cheksiz aylanishning oldini olish
  }
  return all;
}

/** Bir mahsulotning barcha do'kon/omborlaridagi qoldig'ini yig'indisini hisoblaydi. */
function totalStock(billzProduct) {
  const values = Array.isArray(billzProduct.shop_measurement_values) ? billzProduct.shop_measurement_values : [];
  const sum = values.reduce((s, v) => s + (Number(v.active_measurement_value) || 0), 0);
  return Math.max(0, Math.floor(sum));
}

// ---------- Asosiy handler ----------

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Faqat POST so'rovlar qabul qilinadi" });
  }

  const SYNC_SECRET = process.env.SYNC_SECRET;
  const BILLZ_SECRET_TOKEN = process.env.BILLZ_SECRET_TOKEN;
  if (!SYNC_SECRET || !BILLZ_SECRET_TOKEN) {
    console.error("SYNC_SECRET yoki BILLZ_SECRET_TOKEN sozlanmagan (Vercel Environment Variables)");
    return res.status(200).json({ ok: false, error: "Server sozlanmagan" });
  }
  if (req.headers["x-sync-secret"] !== SYNC_SECRET) {
    return res.status(401).json({ ok: false, error: "Ruxsat yo'q" });
  }

  const startedAt = Date.now();
  try {
    const accessToken = await billzLogin(BILLZ_SECRET_TOKEN);
    const [billzProducts, siteProducts] = await Promise.all([
      fetchAllBillzProducts(accessToken),
      fetchAllSiteProducts(),
    ]);

    // Shtrix-kod/SKU bo'yicha tezkor qidirish uchun xarita.
    const siteByCode = new Map();
    for (const sp of siteProducts) {
      const code = (sp.barcode || "").trim();
      if (code) siteByCode.set(code, sp);
    }

    let matched = 0;
    let updated = 0;
    let skippedUnlimited = 0;
    let skippedNoChange = 0;
    const errors = [];

    for (const bp of billzProducts) {
      const code = (bp.barcode || "").trim() || (bp.sku || "").trim();
      if (!code) continue;
      const sp = siteByCode.get(code) || (bp.sku ? siteByCode.get((bp.sku || "").trim()) : null);
      if (!sp) continue;
      matched += 1;

      const stockType = sp.stockType || "limited";
      if (stockType !== "limited") { skippedUnlimited += 1; continue; }

      const currentStock = Number(sp.stock) || 0;
      const billzStock = totalStock(bp);
      const newStock = Math.min(currentStock, billzStock);

      if (newStock >= currentStock) { skippedNoChange += 1; continue; }

      try {
        await patchStock(sp.id, newStock);
        updated += 1;
      } catch (e) {
        errors.push(`${sp.id}: ${e.message}`);
      }
    }

    return res.status(200).json({
      ok: true,
      billzProductsFetched: billzProducts.length,
      siteProductsFetched: siteProducts.length,
      matched,
      updated,
      skippedUnlimited,
      skippedNoChange,
      errors: errors.slice(0, 20),
      tookMs: Date.now() - startedAt,
    });
  } catch (e) {
    console.error("Billz sinxronlash xatosi:", e);
    return res.status(200).json({ ok: false, error: e.message, tookMs: Date.now() - startedAt });
  }
}

export const config = { maxDuration: 60 };
