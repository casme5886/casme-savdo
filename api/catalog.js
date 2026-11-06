// ==========================================================
// /api/catalog — do'kon ma'lumotlari (mahsulot, kategoriya, brend va h.k.)
// ==========================================================
// Nega kerak: avval HAR mijoz sayt ochganda Firestore'dan ~330 ta hujjat
// o'qirdi va kunlik bepul limit (50 000 o'qish) tez tugardi. Endi hamma
// mijozlar bitta keshlanadigan javobni oladi: Vercel CDN javobni 15 daqiqa
// saqlaydi (s-maxage=900), eskirgach fonda yangilaydi. Natijada Firestore'ga
// kuniga ko'pi bilan ~96 ta so'rov (≈32 000 o'qish) ketadi. 10 daqiqaga
// tushirilsa ~47 000 bo'ladi — bepul limit (50 000) ga juda yaqin.
// Buyurtma paytida qoldiq baribir Firestore'dan yangidan tekshiriladi.

const FIREBASE_PROJECT_ID = "casme-savdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const COLLECTIONS = ["products", "categories", "brands", "collections", "banners", "testimonials", "faqs"];

function decodeValue(val) {
  if (!val) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.timestampValue !== undefined) return val.timestampValue;
  if (val.nullValue !== undefined) return null;
  if (val.arrayValue !== undefined) return (val.arrayValue.values || []).map(decodeValue);
  if (val.mapValue !== undefined) return decodeFields(val.mapValue.fields || {});
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = decodeValue(v);
  return out;
}

async function fetchCollection(name) {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: name }], limit: 5000 } }),
  });
  if (!res.ok) throw new Error(`${name}: ${res.status}`);
  const rows = await res.json();
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r.document)
    .map((r) => ({ id: r.document.name.split("/").pop(), ...decodeFields(r.document.fields || {}) }));
}

export default async function handler(req, res) {
  try {
    const lists = await Promise.all(COLLECTIONS.map(fetchCollection));
    const data = {};
    COLLECTIONS.forEach((n, i) => { data[n] = lists[i]; });
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=900, stale-while-revalidate=120");
    res.status(200).json(data);
  } catch (e) {
    // Xato bo'lsa keshlanmasin — mijoz zaxira yo'lga (to'g'ridan-to'g'ri Firestore) o'tadi.
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ error: String((e && e.message) || e) });
  }
}
