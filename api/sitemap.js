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

import sharp from "sharp";

const FIREBASE_PROJECT_ID = "casme-savdo";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const SITE_URL = "https://www.casme.uz";
// Mahsulot rasmlari faqat shu manzildan (R2) ruxsat etiladi — boshqa
// domendagi ixtiyoriy rasmni "proksi" qilib bo'lmasligi uchun (xavfsizlik).
const ALLOWED_IMAGE_HOST = "https://pub-6a37909dbe8741249b8e364db72918b6.r2.dev/";

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

/** "products" kolleksiyasidan Google Merchant Center feed'i uchun kerakli
 *  BARCHA maydonlarni o'qiydi (yuqoridagi fetchActiveProductIds'dan farqli —
 *  bu yerda nom/narx/rasm/brend/shtrix-kod kabi to'liq ma'lumot kerak). */
async function fetchActiveProductsFull() {
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
    .filter((p) => p.active !== false);
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

// Google qidiruv natijalarida saytning ikonkasi (favicon) ko'rinishi uchun
// u SAYT BILAN BIR XIL DOMENDA bo'lishi shart (Google'ning rasmiy talabi) —
// logotipimiz esa boshqa domenda (Cloudflare R2, pub-...r2.dev) turadi,
// shuning uchun to'g'ridan-to'g'ri R2 manzilini <link rel="icon"> qilib
// qo'ysak ham Google buni "begona domen" deb rad etib, o'rniga standart
// globus belgisini ko'rsatadi. Shu funksiya R2'dagi logotipni www.casme.uz
// domeni ORQALI (proksi qilib) uzatadi — brauzer va Google uchun xuddi
// saytning o'zidan kelayotgandek ko'rinadi.
async function sendFavicon(res) {
  const LOGO_URL = "https://pub-6a37909dbe8741249b8e364db72918b6.r2.dev/settings/logo";
  try {
    const upstream = await fetch(LOGO_URL);
    if (!upstream.ok) throw new Error(`Logotip yuklanmadi: ${upstream.status}`);
    const buf = Buffer.from(await upstream.arrayBuffer());
    const contentType = upstream.headers.get("content-type") || "image/png";
    res.setHeader("Content-Type", contentType);
    // Bir soat brauzerda, bir kun CDN'da keshlanadi — har so'rovda R2'ga
    // qayta murojaat qilinmaydi.
    res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).send(buf);
  } catch (e) {
    console.error("favicon proksi xatosi:", e);
    return res.status(404).end();
  }
}

// ==========================================================
// PWA (mobil ilova) ikonkalari — "/icon-192.png", "/icon-512.png",
// "/icon-maskable-512.png", "/apple-touch-icon-180.png"
//
// manifest.webmanifest va index.html shu manzillarga ishora qiladi.
// Do'kon logotipi (R2'da) odatda kvadrat bo'lmasligi mumkin — shu
// funksiya uni SO'RALGAN o'lchamdagi, to'liq kvadrat, oq fonli PNG'ga
// aylantirib qaytaradi (telefon ekranida to'g'ri ko'rinishi uchun).
// "maskable" so'ralsa — logotipni kichikroq (xavfsiz zonada) joylaydi,
// chunki Android ba'zan ikonkani doira/boshqa shaklga "kesib" ko'rsatadi.
// ==========================================================
async function sendAppIcon(req, res) {
  const LOGO_URL = "https://pub-6a37909dbe8741249b8e364db72918b6.r2.dev/settings/logo";
  const size = Math.max(32, Math.min(1024, parseInt((req.query && req.query.size) || "512", 10) || 512));
  const maskable = (req.query && req.query.maskable) === "1";
  try {
    const upstream = await fetch(LOGO_URL);
    if (!upstream.ok) throw new Error(`Logotip yuklanmadi: ${upstream.status}`);
    const inputBuffer = Buffer.from(await upstream.arrayBuffer());
    // Maskable ikonkalarda logotip kanvasning ~70%ini egallaydi (xavfsiz
    // zona) — oddiy ikonkalarda esa deyarli to'liq kanvasni egallaydi.
    const logoSize = Math.round(size * (maskable ? 0.7 : 0.92));
    const resizedLogo = await sharp(inputBuffer)
      .resize({ width: logoSize, height: logoSize, fit: "contain", background: "#ffffff" })
      .toBuffer();
    const outBuffer = await sharp({
      create: { width: size, height: size, channels: 4, background: "#ffffff" },
    })
      .composite([{ input: resizedLogo, gravity: "center" }])
      .png()
      .toBuffer();
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400");
    return res.status(200).send(outBuffer);
  } catch (e) {
    console.error("PWA ikonka yaratishda xatolik:", e);
    return res.status(404).end();
  }
}

// ==========================================================
// Google Merchant Center MAHSULOT FEED'I ("/merchant-feed.xml")
//
// Google'ning rasmiy "Google Shopping" XML feed formatida (RSS 2.0 +
// "g:" nomlar maydoni) — Merchant Center'da "Data sources" → "Add data
// source" → "Scheduled fetch" bo'limiga shu manzilni qo'shsangiz, Google
// har kuni avtomatik o'qib turadi (qo'lda qayta yuklash shart emas).
//
// Faqat FAOL (active !== false) mahsulotlar kiritiladi. Narx, qoldiq
// holati (mavjud/tugagan) va boshqa hammasi to'g'ridan-to'g'ri saytdagi
// haqiqiy ma'lumotdan olinadi — alohida qo'lda kiritish shart emas.
// ==========================================================
function productAvailability(p) {
  if (p.stockType === "unlimited") return "in_stock";
  if (p.stockType === "out") return "out_of_stock";
  return (Number(p.stock) || 0) > 0 ? "in_stock" : "out_of_stock";
}

function isLikelyGtin(code) {
  return typeof code === "string" && /^\d{8}(\d{4}|\d{5}|\d{6})?$/.test(code.trim());
}

async function sendMerchantFeed(res) {
  let products = [];
  try {
    products = await fetchActiveProductsFull();
  } catch (e) {
    console.error("merchant-feed: mahsulotlarni o'qishda xatolik:", e);
  }

  const items = products
    .map((p) => {
      const name = p.nameUz || p.name || "";
      if (!name) return "";
      const desc = p.descriptionUz || p.description || name;
      const rawImages = Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls : (p.imageUrl ? [p.imageUrl] : []);
      if (!rawImages.length) return ""; // Google rasmsiz mahsulotni rad etadi
      // Rasmlar qora fonli bo'lgani uchun — Merchant Center'ga to'g'ridan-
      // to'g'ri R2 manzilini emas, /product-image proksisini yuboramiz —
      // u fonni oq qilib qaytaradi. Sayt (do'kon sahifasi) esa asl (qora
      // fonli) rasmni ko'rsatishda davom etadi — bu yerga tegilmagan.
      const images = rawImages.map((u) => `${SITE_URL}/product-image?src=${encodeURIComponent(u)}`);
      const price = Number(p.price) || 0;
      const barcode = (p.barcode || "").trim();
      const gtin = isLikelyGtin(barcode) ? barcode : "";

      return (
        `  <item>\n` +
        `    <g:id>${escapeXml(p.id)}</g:id>\n` +
        `    <g:title>${escapeXml(name.slice(0, 150))}</g:title>\n` +
        `    <g:description>${escapeXml(desc.slice(0, 5000))}</g:description>\n` +
        `    <g:link>${escapeXml(`${SITE_URL}/product/${p.id}`)}</g:link>\n` +
        `    <g:image_link>${escapeXml(images[0])}</g:image_link>\n` +
        images.slice(1, 10).map((img) => `    <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>\n`).join("") +
        `    <g:availability>${productAvailability(p)}</g:availability>\n` +
        `    <g:price>${price.toFixed(2)} UZS</g:price>\n` +
        `    <g:condition>new</g:condition>\n` +
        (p.brand ? `    <g:brand>${escapeXml(p.brand)}</g:brand>\n` : "") +
        (gtin ? `    <g:gtin>${escapeXml(gtin)}</g:gtin>\n` : `    <g:identifier_exists>no</g:identifier_exists>\n`) +
        `    <g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics</g:google_product_category>\n` +
        (p.category ? `    <g:product_type>${escapeXml(p.category)}</g:product_type>\n` : "") +
        `  </item>\n`
      );
    })
    .join("");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `<channel>\n` +
    `  <title>CASME — mahsulotlar feed'i</title>\n` +
    `  <link>${SITE_URL}/</link>\n` +
    `  <description>CASME do'konidagi barcha faol mahsulotlar (Google Merchant Center uchun)</description>\n` +
    items +
    `</channel>\n` +
    `</rss>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  return res.status(200).send(xml);
}

// ==========================================================
// /product-image?src=<R2 rasm manzili> — MAHSULOT RASMINING QORA FONINI
// OQ (#FFFFFF) GA ALMASHTIRIB QAYTARADI. Faqat Google Merchant Center
// feed'i uchun ishlatiladi ("merchant-feed.xml") — saytdagi asl rasmlar
// (do'kon sahifasi, admin panel) BUTUNLAY TEGILMAYDI, o'zgarmaydi.
//
// Usul: to'liq AI fon o'chirish EMAS (bu og'ir, Vercel serverless
// funksiyaga sig'maydi) — balki rasmning CHETIDAN (burchaklaridan)
// boshlab, bir-biriga ULANGAN deyarli-qora piksellarni "suv toshqini"
// (flood fill) usulida topib, ularni oq bilan almashtiramiz. Mahsulotning
// o'zidagi qora qismlar (masalan qora qopqoq) FONGA ULANMAGANI uchun
// tegilmay qoladi — faqat rasmning chetidan boshlanadigan, yaxlit qora
// FON tegadi.
// ==========================================================
const BLACK_THRESHOLD = 55; // shundan past R/G/B — "deyarli qora" deb hisoblanadi
const MAX_PROCESS_DIM = 1400; // tezlik uchun — juda katta rasmlar shu o'lchamgacha kichraytiriladi

async function whitenBlackBackground(inputBuffer) {
  const img = sharp(inputBuffer).rotate(); // EXIF orientatsiyasini to'g'rilaydi
  const meta = await img.metadata();
  const resized = (meta.width || 0) > MAX_PROCESS_DIM || (meta.height || 0) > MAX_PROCESS_DIM
    ? img.resize({ width: MAX_PROCESS_DIM, height: MAX_PROCESS_DIM, fit: "inside" })
    : img;

  const { data, info } = await resized.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info; // channels = 4 (RGBA)
  const isBlack = (idx) => data[idx] < BLACK_THRESHOLD && data[idx + 1] < BLACK_THRESHOLD && data[idx + 2] < BLACK_THRESHOLD;
  const visited = new Uint8Array(width * height);
  const stack = [];

  // Boshlang'ich nuqtalar — rasmning TO'RT CHETIDAGI barcha piksellar
  // (faqat qora bo'lsagina navbatga qo'shiladi).
  for (let x = 0; x < width; x++) {
    stack.push(x, 0);
    stack.push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    stack.push(0, y);
    stack.push(width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    if (x < 0 || y < 0 || x >= width || y >= height) continue;
    const pos = y * width + x;
    if (visited[pos]) continue;
    const idx = pos * channels;
    if (!isBlack(idx)) continue;
    visited[pos] = 1;
    data[idx] = 255; data[idx + 1] = 255; data[idx + 2] = 255;
    stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
  }

  return sharp(data, { raw: { width, height, channels } }).jpeg({ quality: 90, background: "#ffffff" }).flatten({ background: "#ffffff" }).toBuffer();
}

async function sendProductImage(req, res) {
  const src = (req.query && req.query.src) || "";
  if (!src.startsWith(ALLOWED_IMAGE_HOST)) {
    return res.status(400).send("Noto'g'ri rasm manzili");
  }
  try {
    const upstream = await fetch(src);
    if (!upstream.ok) throw new Error(`Rasm yuklanmadi: ${upstream.status}`);
    const inputBuffer = Buffer.from(await upstream.arrayBuffer());
    const outBuffer = await whitenBlackBackground(inputBuffer);
    res.setHeader("Content-Type", "image/jpeg");
    // 30 kun CDN'da keshlanadi — har mahsulot rasmi faqat BIR MARTA
    // qayta ishlanadi, keyingi so'rovlar Vercel CDN keshidan darhol qaytadi.
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400");
    return res.status(200).send(outBuffer);
  } catch (e) {
    console.error("product-image (fon oqartirish) xatosi:", e);
    // Xato bo'lsa ham mijoz/Google rasmsiz qolib ketmasligi uchun — asl
    // rasmga vaqtincha yo'naltiramiz (qora fon bilan, lekin ko'rinadi).
    return res.redirect(302, src);
  }
}

export default async function handler(req, res) {
  const kind = (req.query && req.query.kind) || "";
  if (kind === "robots") return sendRobots(res);
  if (kind === "favicon") return sendFavicon(res);
  if (kind === "merchant") return sendMerchantFeed(res);
  if (kind === "product-image") return sendProductImage(req, res);
  if (kind === "icon") return sendAppIcon(req, res);
  return sendSitemap(res);
}

export const config = { maxDuration: 30 };
