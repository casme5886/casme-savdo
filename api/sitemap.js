// ==========================================================
// /api/sitemap  — vercel.json orqali IKKALA manzilga ham xizmat qiladi:
//   /sitemap.xml           → shu funksiya, XML sitemap qaytaradi
//   /robots.txt?kind=robots → shu funksiya, robots.txt matnini qaytaradi
//
// MUHIM: ikkalasi ATAYLAB bitta faylga birlashtirilgan — Vercel Hobby
// tarifida bitta loyihada ko'pi bilan 12 ta serverless funksiya bo'lishi
// mumkin, sizda allaqachon shu chegaraga yaqin fayllar bor edi, shuning
// uchun alohida "robots.js" fayli qo'shish deploy'ni bloklab qo'ygan edi.
//
// Google/Yandex va boshqa qidiruv tizimlari uchun saytning barcha
// INDEKSLANISHI kerak bo'lgan (public) sahifalari ro'yxatini XML
// ko'rinishida qaytaradi:
//   - Bosh sahifa (https://casme.uz/)
//   - Har bir FAOL (active !== false) mahsulotning haqiqiy sahifasi
//     (https://casme.uz/product/<id>) — bu manzillar src/App.jsx
//     ichida to'g'ridan-to'g'ri ochilganda ham (Google ularni sitemap
//     orqali "kashf qilganda" ham) aynan o'sha mahsulotni ko'rsatadi.
//
// Admin, login, savat, checkout va h.k. shaxsiy sahifalar BU YERGA
// UMUMAN QO'SHILMAYDI — ular hech qachon alohida indekslanadigan URL
// ham emas (SPA ichida ochiladi), shuning uchun tashlab ketiladi.
//
// Firestore'ga firebase paketisiz, REST API orqali (boshqa /api
// fayllar bilan bir xil uslubda) murojaat qilinadi.
// ==========================================================

const FIREBASE_PROJECT_ID = "casme-savdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const SITE_URL = "https://casme.uz";

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

/** "products" kolleksiyasidan faqat kerakli (id, active) maydonlarni o'qiydi. */
async function fetchActiveProductIds() {
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
    .map((r) => ({ id: r.document.name.split("/").pop(), ...decodeFields(r.document.fields || {}) }))
    .filter((p) => p.active !== false)
    .map((p) => p.id);
}

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

async function sendSitemap(res) {
  let productIds = [];
  try {
    productIds = await fetchActiveProductIds();
  } catch (e) {
    // Firestore vaqtincha javob bermasa ham — hech bo'lmasa bosh sahifasi
    // bilan bo'sh bo'lmagan, to'g'ri XML qaytaramiz (butunlay xato o'rniga).
    console.error("sitemap: mahsulotlarni o'qishda xatolik:", e);
  }

  const urls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    ...productIds.map((id) => ({
      loc: `${SITE_URL}/product/${id}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${escapeXml(u.loc)}</loc>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          `  </url>\n`
      )
      .join("") +
    `</urlset>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // Bir soat CDN keshida turadi — har crawl so'rovida Firestore'ga
  // murojaat qilmaslik uchun (kesh muddati tugagach fon rejimida yangilanadi).
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}

function sendRobots(res) {
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    "",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400");
  return res.status(200).send(body);
}

export default async function handler(req, res) {
  const kind = (req.query && req.query.kind) || "";
  if (kind === "robots") return sendRobots(res);
  return sendSitemap(res);
}
