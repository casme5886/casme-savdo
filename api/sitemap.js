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
import { builtinSeoDescription } from "../src/seoDescriptions.js";
import { ARTICLES, getArticle } from "../src/articles.js";

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

/** Sayt ichidagi yengil (keshlanadigan) rasm manzili — R2 rasmlari uchun /product-image proksisi. */
function thumbSrc(url, w = 480) {
  return typeof url === "string" && url.startsWith(ALLOWED_IMAGE_HOST)
    ? `${SITE_URL}/product-image?src=${encodeURIComponent(url)}&raw=1&w=${w}`
    : url || "";
}
const productImages = (p) => (Array.isArray(p.imageUrls) && p.imageUrls.length ? p.imageUrls : p.imageUrl ? [p.imageUrl] : []);

function escapeXml(s) {
  return String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
}

async function sendSitemap(res) {
  let productIds = [];
  const brandSet = new Set();
  const categorySet = new Set();
  const imgByProduct = new Map(); // id -> [rasm,...]
  const imgByBrand = new Map();
  const imgByCategory = new Map();
  const pushImg = (map, key, imgs) => {
    const arr = map.get(key) || [];
    for (const u of imgs) if (arr.length < 4 && !arr.includes(u)) arr.push(u);
    map.set(key, arr);
  };
  try {
    const products = await fetchActiveProductsFull();
    productIds = products.map((p) => p.id);
    for (const p of products) {
      const imgs = productImages(p).slice(0, 3).map((u) => thumbSrc(u, 800));
      imgByProduct.set(p.id, imgs);
      if (p.brand && String(p.brand).trim()) { brandSet.add(String(p.brand).trim()); if (imgs[0]) pushImg(imgByBrand, String(p.brand).trim(), [imgs[0]]); }
      if (p.category && String(p.category).trim()) { categorySet.add(String(p.category).trim()); if (imgs[0]) pushImg(imgByCategory, String(p.category).trim(), [imgs[0]]); }
    }
  } catch (e) {
    // Firestore vaqtincha javob bermasa ham — hech bo'lmasa bosh sahifasi
    // bilan bo'sh bo'lmagan, to'g'ri XML qaytaramiz (butunlay xato o'rniga).
    console.error("sitemap: mahsulotlarni o'qishda xatolik:", e);
  }

  // Faol banner va to'plam (kolleksiya) sahifalari
  const bannerKeys = [];
  try {
    const [bs, cs] = await Promise.all([
      fsQuery({ from: [{ collectionId: "banners" }], limit: 100 }),
      fsQuery({ from: [{ collectionId: "collections" }], limit: 100 }),
    ]);
    bs.forEach((b) => { if (b.active !== false && Array.isArray(b.linkedProductIds) && b.linkedProductIds.length) bannerKeys.push(`banner-${b.id}`); });
    cs.forEach((c) => { if (c.active !== false && Array.isArray(c.productIds) && c.productIds.length) bannerKeys.push(c.id); });
  } catch (e) {
    console.error("sitemap: banner/kolleksiyalarni o'qishda xatolik:", e);
  }

  const urls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/articles`, changefreq: "weekly", priority: "0.7" },
    ...ARTICLES.map((a) => ({ loc: `${SITE_URL}/article/${a.slug}`, changefreq: "monthly", priority: "0.6" })),
    ...bannerKeys.map((k) => ({ loc: `${SITE_URL}/banner/${encodeURIComponent(k)}`, changefreq: "weekly", priority: "0.7" })),
    { loc: `${SITE_URL}/categories`, changefreq: "weekly", priority: "0.9" },
    { loc: `${SITE_URL}/discounts`, changefreq: "daily", priority: "0.9" },
    { loc: `${SITE_URL}/hits`, changefreq: "daily", priority: "0.9" },
    ...[...categorySet].map((n) => ({
      loc: `${SITE_URL}/category/${encodeURIComponent(n)}`,
      changefreq: "weekly",
      priority: "0.8",
      images: imgByCategory.get(n) || [],
    })),
    ...[...brandSet].map((n) => ({
      loc: `${SITE_URL}/brand/${encodeURIComponent(n)}`,
      changefreq: "weekly",
      priority: "0.8",
      images: imgByBrand.get(n) || [],
    })),
    ...productIds.map((id) => ({
      loc: `${SITE_URL}/product/${id}`,
      changefreq: "weekly",
      priority: "0.8",
      images: imgByProduct.get(id) || [],
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
    urls
      .map(
        (u) =>
          `  <url>\n` +
          `    <loc>${escapeXml(u.loc)}</loc>\n` +
          `    <changefreq>${u.changefreq}</changefreq>\n` +
          `    <priority>${u.priority}</priority>\n` +
          (u.images || []).map((img) => `    <image:image><image:loc>${escapeXml(img)}</image:loc></image:image>\n`).join("") +
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
    res.setHeader("Cache-Control", "public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400");
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

async function sendMerchantFeed(req, res) {
  // ?lang=ru — ruscha feed (/merchant-feed-ru.xml): ruscha nom/tavsif va ?lang=ru havola.
  // Ruscha nomi kiritilmagan mahsulotlar bu feed'ga KIRMAYDI (til aralashib ketmasligi uchun).
  const ru = (req.query && req.query.lang) === "ru";
  let products = [];
  try {
    products = await fetchActiveProductsFull();
  } catch (e) {
    console.error("merchant-feed: mahsulotlarni o'qishda xatolik:", e);
    // Xato bo'lsa BO'SH feed'ni keshlab qo'ymaymiz (aks holda Google 1 soat
    // davomida mahsulotsiz feed oladi) — 503 qaytaramiz, Google keyinroq qayta uriniadi.
    res.setHeader("Cache-Control", "no-store");
    return res.status(503).send("Mahsulotlar vaqtincha o'qilmadi, keyinroq urinib ko'ring");
  }

  const items = products
    .map((p) => {
      const name = ru ? (p.nameRu || "") : (p.nameUz || p.name || "");
      if (!name) return "";
      const desc = ru ? (p.descriptionRu || name) : (p.descriptionUz || p.description || name);
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
        `    <g:link>${escapeXml(`${SITE_URL}/product/${p.id}${ru ? "?lang=ru" : ""}`)}</g:link>\n` +
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
    `  <title>${ru ? "CASME — фид товаров (RU)" : "CASME — mahsulotlar feed'i"}</title>\n` +
    `  <link>${SITE_URL}/</link>\n` +
    `  <description>CASME do'konidagi barcha faol mahsulotlar (Google Merchant Center uchun)</description>\n` +
    items +
    `</channel>\n` +
    `</rss>\n`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  // Mahsulot bo'lmasa — keshlamaymiz (vaqtinchalik bo'sh holat 1 soatga qotib qolmasligi uchun)
  res.setHeader("Cache-Control", items ? "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" : "no-store");
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
  // "raw=1" — fon oqartirilmaydi (Merchant Center uchun emas), faqat admin
  // panelning Excel eksporti kabi ichki ehtiyojlar uchun kichik (thumbnail)
  // o'lchamdagi JPEG qaytaradi — tez yuklanishi va fayl hajmi katta
  // bo'lib ketmasligi uchun.
  const raw = (req.query && req.query.raw) === "1";
  // "w" — thumbnail kengligi (120–800), standart 200 (Excel eksporti uchun).
  const rawSize = Math.min(1920, Math.max(120, parseInt((req.query && req.query.w) || "200", 10) || 200));
  try {
    const upstream = await fetch(src);
    if (!upstream.ok) throw new Error(`Rasm yuklanmadi: ${upstream.status}`);
    const inputBuffer = Buffer.from(await upstream.arrayBuffer());
    const outBuffer = raw
      ? await sharp(inputBuffer).rotate().flatten({ background: "#ffffff" }).resize({ width: rawSize, height: rawSize, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
      : await whitenBlackBackground(inputBuffer);
    res.setHeader("Content-Type", "image/jpeg");
    // 30 kun CDN'da keshlanadi — har mahsulot rasmi faqat BIR MARTA
    // qayta ishlanadi, keyingi so'rovlar Vercel CDN keshidan darhol qaytadi.
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400");
    return res.status(200).send(outBuffer);
  } catch (e) {
    console.error("product-image xatosi:", e);
    // Xato bo'lsa ham mijoz/Google rasmsiz qolib ketmasligi uchun — asl
    // rasmga vaqtincha yo'naltiramiz (qora fon bilan, lekin ko'rinadi).
    return res.redirect(302, src);
  }
}

// ==========================================================
// Serverda tayyorlangan sahifa (SSR-lite): /product/:id, /brand/:name,
// /category/:name, /discounts, /hits, /categories
//
// Sayt SPA bo'lgani uchun Google avval bo'sh sahifa ko'radi. Bu yerda
// deploy qilingan index.html olinadi va ichiga shu sahifaga xos title,
// description, canonical, Open Graph, JSON-LD hamda crawler uchun oddiy
// HTML (sarlavha + mahsulot havolalari) qo'shiladi. React yuklangach
// #root ichini o'zi almashtiradi. Har qanday xatoda — oddiy index.html.
// ==========================================================

const escHtml = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ldJson = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
const pickName = (p, ru) => (ru ? p.nameRu || p.nameUz || p.name : p.nameUz || p.nameRu || p.name) || "";
const pickDesc = (p, ru) => (ru ? p.descriptionRu || p.descriptionUz || p.description : p.descriptionUz || p.descriptionRu || p.description) || "";
const firstImage = (p) => (Array.isArray(p.imageUrls) && p.imageUrls[0]) || p.imageUrl || "";
const soldOut = (p) => {
  const st = p.stockType || "limited";
  return st === "out" || (st === "limited" && (p.stock || 0) <= 0);
};

async function fsQuery(structuredQuery) {
  const r = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery }),
  });
  if (!r.ok) throw new Error(`runQuery ${r.status}`);
  const rows = await r.json();
  return (Array.isArray(rows) ? rows : [])
    .filter((x) => x.document)
    .map((x) => ({ id: x.document.name.split("/").pop(), ...decodeFields(x.document.fields || {}) }));
}

async function fetchProductsWhere(field, value, limit = 60) {
  const rows = await fsQuery({
    from: [{ collectionId: "products" }],
    where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } },
    limit,
  });
  return rows.filter((p) => p.active !== false);
}

function replaceMeta(html, attr, key, value) {
  const re = new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`);
  const tag = `<meta ${attr}="${key}" content="${escHtml(value)}" />`;
  return re.test(html) ? html.replace(re, () => tag) : html.replace("</head>", () => `${tag}\n</head>`);
}

function buildPageHtml(baseHtml, page, ru) {
  const self = `${SITE_URL}${page.path}`;
  const selfHref = ru ? `${self}?lang=ru` : self;
  let html = baseHtml;
  html = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escHtml(page.title)}</title>`);
  html = replaceMeta(html, "name", "description", page.desc);
  html = replaceMeta(html, "property", "og:title", page.title);
  html = replaceMeta(html, "property", "og:description", page.desc);
  html = replaceMeta(html, "property", "og:url", selfHref);
  html = replaceMeta(html, "property", "og:type", page.ogType || "website");
  html = replaceMeta(html, "name", "twitter:title", page.title);
  html = replaceMeta(html, "name", "twitter:description", page.desc);
  if (page.image) {
    html = replaceMeta(html, "property", "og:image", page.image);
    html = replaceMeta(html, "name", "twitter:image", page.image);
  }
  html = html.replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, () => `<link rel="canonical" href="${escHtml(selfHref)}" />`);
  html = html.replace(/<link rel="alternate" hreflang="uz-UZ" href="[^"]*"\s*\/?>/, () => `<link rel="alternate" hreflang="uz-UZ" href="${escHtml(self)}" />`);
  html = html.replace(/<link rel="alternate" hreflang="ru-UZ" href="[^"]*"\s*\/?>/, () => `<link rel="alternate" hreflang="ru-UZ" href="${escHtml(self)}?lang=ru" />`);
  html = html.replace(/<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/, () => `<link rel="alternate" hreflang="x-default" href="${escHtml(self)}" />`);
  // data-ssr-product: brauzerdagi JS shu mahsulot uchun ikkinchi marta (dublikat) sxema qo'shmasligi uchun belgi
  const ssrAttr = page.productId ? ` data-ssr-product="${escHtml(page.productId)}"` : "";
  const ld = (page.jsonLd || []).map((o) => `<script type="application/ld+json"${ssrAttr}>${ldJson(o)}</script>`).join("\n");
  if (ld) html = html.replace("</head>", () => `${ld}\n</head>`);
  // Crawler uchun oddiy kontent — React yuklangach #root to'liq almashtiriladi.
  const body = `<main data-prerender style="font-family:system-ui,sans-serif;padding:16px;max-width:720px;margin:0 auto">${page.bodyHtml || ""}</main>`;
  html = html.replace('<div id="root"></div>', () => `<div id="root">${body}</div>`);
  return html;
}

const productLinks = (list, ru) =>
  list.length
    ? `<ul style="list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px">${list
        .map((p) => {
          const nm = pickName(p, ru);
          const img = thumbSrc(firstImage(p), 480);
          return `<li><a href="${SITE_URL}/product/${escHtml(p.id)}" style="color:inherit;text-decoration:none;display:block">${img ? `<img src="${escHtml(img)}" alt="${escHtml(nm)}" width="160" height="160" loading="lazy" style="width:100%;height:auto;aspect-ratio:1/1;object-fit:contain" />` : ""}<span style="display:block;font-size:13px">${escHtml(nm)}</span></a>${p.price ? `<span style="font-size:12px;color:#64748b">${escHtml(Number(p.price).toLocaleString("ru-RU"))} UZS</span>` : ""}</li>`;
        })
        .join("")}</ul>`
    : "";

const itemListLd = (list, ru) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  itemListElement: list.slice(0, 40).map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `${SITE_URL}/product/${p.id}`,
    name: pickName(p, ru),
    ...(firstImage(p) ? { image: thumbSrc(firstImage(p), 800) } : {}),
  })),
});

const crumbLd = (ru, name, url) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: ru ? "Главная" : "Bosh sahifa", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name, item: url },
  ],
});

async function buildPageData(type, key, ru) {
  if (type === "product") {
    const r = await fetch(`${FIRESTORE_BASE}/products/${encodeURIComponent(key)}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`product ${r.status}`); // vaqtinchalik xato — 404 deb hisoblamaymiz
    const doc = await r.json();
    const p = { id: key, ...decodeFields(doc.fields || {}) };
    if (p.active === false) return null;
    const name = pickName(p, ru);
    if (!name) return null;
    const desc = (pickDesc(p, ru) || "").replace(/\s+/g, " ").slice(0, 160) || (ru ? `${name} — оригинальная продукция в CASME.` : `${name} — CASME'da original mahsulotlar.`);
    const image = firstImage(p);
    const url = `${SITE_URL}/product/${key}${ru ? "?lang=ru" : ""}`;
    // Ichki bog'lanish: shu brendning boshqa mahsulotlari
    let related = [];
    try {
      if (p.brand) related = (await fetchProductsWhere("brand", p.brand, 10)).filter((x) => x.id !== key).slice(0, 8);
    } catch { /* havolasiz ham ishlayveradi */ }
    const crumbs = [
      { "@type": "ListItem", position: 1, name: ru ? "Главная" : "Bosh sahifa", item: `${SITE_URL}/` },
      ...(p.brand ? [{ "@type": "ListItem", position: 2, name: p.brand, item: `${SITE_URL}/brand/${encodeURIComponent(p.brand)}` }] : []),
    ];
    crumbs.push({ "@type": "ListItem", position: crumbs.length + 1, name, item: url });
    return {
      path: `/product/${key}`,
      productId: key,
      title: `${name} — CASME`,
      desc,
      image,
      ogType: "product",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name,
          description: pickDesc(p, ru) || name,
          ...(image ? { image: [image] } : {}),
          ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
          sku: key,
          offers: {
            "@type": "Offer",
            url,
            priceCurrency: "UZS",
            price: String(Number(p.price) || 0),
            availability: soldOut(p) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
          },
        },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: crumbs },
      ],
      bodyHtml:
        `<p><a href="${SITE_URL}/">CASME</a>${p.brand ? ` › <a href="${SITE_URL}/brand/${encodeURIComponent(p.brand)}">${escHtml(p.brand)}</a>` : ""}${p.category ? ` › <a href="${SITE_URL}/category/${encodeURIComponent(p.category)}">${escHtml(p.category)}</a>` : ""}</p>` +
        `<h1>${escHtml(name)}</h1>` +
        `<p>${escHtml(Number(p.price || 0).toLocaleString("ru-RU"))} UZS</p>` +
        (pickDesc(p, ru) ? `<p>${escHtml(pickDesc(p, ru))}</p>` : "") +
        (related.length ? `<h2>${ru ? "Другие товары бренда" : "Shu brendning boshqa mahsulotlari"}</h2>${productLinks(related, ru)}` : ""),
    };
  }

  if (type === "brand" || type === "category") {
    const isBrand = type === "brand";
    const name = key;
    const list = await fetchProductsWhere(isBrand ? "brand" : "category", name);
    if (!list.length) return null;
    // Admin kiritgan tavsif ustun, bo'lmasa — ichki ro'yxatdan
    let own = "";
    try {
      const docs = await fsQuery({
        from: [{ collectionId: isBrand ? "brands" : "categories" }],
        where: { fieldFilter: { field: { fieldPath: "name" }, op: "EQUAL", value: { stringValue: name } } },
        limit: 1,
      });
      if (docs[0]) own = ((ru ? docs[0].descriptionRu : docs[0].description) || docs[0].description || docs[0].descriptionRu || "").trim();
    } catch { /* ichki tavsifga o'tamiz */ }
    const bdesc = own || builtinSeoDescription(type, name, ru ? "ru" : "uz");
    const title = ru
      ? `${name} — ${isBrand ? "оригинальная корейская косметика" : "корейская косметика"} | CASME`
      : `${name} — ${isBrand ? "original koreys kosmetikasi" : "koreys kosmetikasi"} | CASME`;
    const desc = bdesc
      ? bdesc.replace(/\s+/g, " ").slice(0, 160)
      : ru
      ? `${isBrand ? "Все товары бренда" : "Все товары категории"} ${name} в интернет-магазине CASME. Оригинальная продукция, доставка по Ташкенту и Узбекистану.`
      : `${name} ${isBrand ? "brendining" : "kategoriyasidagi"} barcha mahsulotlari CASME onlayn do'konida. Original mahsulotlar, Toshkent va O'zbekiston bo'ylab yetkazib berish.`;
    const path = `/${type}/${encodeURIComponent(name)}`;
    return {
      path,
      title,
      desc,
      image: thumbSrc(firstImage(list[0]), 800),
      jsonLd: [
        { "@context": "https://schema.org", "@type": "CollectionPage", name, description: desc, url: `${SITE_URL}${path}`, ...(firstImage(list[0]) ? { primaryImageOfPage: { "@type": "ImageObject", url: thumbSrc(firstImage(list[0]), 800) } } : {}) },
        itemListLd(list, ru),
        crumbLd(ru, name, `${SITE_URL}${path}`),
      ],
      bodyHtml: `<h1>${escHtml(name)}</h1>${bdesc ? `<p>${escHtml(bdesc)}</p>` : ""}${productLinks(list, ru)}`,
    };
  }

  if (type === "banner") {
    // key = "banner-<bannerId>" (bosh banner) yoki kolleksiya id'si ("keng banner")
    let title = "", sub = "", image = "", ids = [];
    if (key.startsWith("banner-")) {
      const r = await fetch(`${FIRESTORE_BASE}/banners/${encodeURIComponent(key.slice(7))}`);
      if (!r.ok) return null;
      const b = decodeFields((await r.json()).fields || {});
      if (b.active === false) return null;
      title = b.title || "";
      sub = b.subtitle || "";
      image = b.mobileImage || b.desktopImage || "";
      ids = Array.isArray(b.linkedProductIds) ? b.linkedProductIds : [];
    } else {
      const r = await fetch(`${FIRESTORE_BASE}/collections/${encodeURIComponent(key)}`);
      if (!r.ok) return null;
      const c = decodeFields((await r.json()).fields || {});
      title = (ru ? c.titleRu || c.titleUz : c.titleUz || c.titleRu) || c.title || "";
      sub = (ru ? c.descriptionRu || c.descriptionUz : c.descriptionUz || c.descriptionRu) || c.description || "";
      image = c.imageUrl || "";
      ids = Array.isArray(c.productIds) ? c.productIds : [];
    }
    if (!title || !ids.length) return null;
    const idSet = new Set(ids);
    const all = await fsQuery({ from: [{ collectionId: "products" }], limit: 1000 });
    const list = all.filter((p) => p.active !== false && idSet.has(p.id));
    if (!list.length) return null;
    const path = `/banner/${encodeURIComponent(key)}`;
    const desc = (sub || (ru ? `${title} — специальное предложение CASME.` : `${title} — CASME'dan maxsus taklif.`)).replace(/\s+/g, " ").slice(0, 160);
    return {
      path,
      title: `${title} | CASME`,
      desc,
      image: image || firstImage(list[0]),
      jsonLd: [
        { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description: desc, url: `${SITE_URL}${path}` },
        itemListLd(list, ru),
        crumbLd(ru, title, `${SITE_URL}${path}`),
      ],
      bodyHtml: `<h1>${escHtml(title)}</h1>${sub ? `<p>${escHtml(sub)}</p>` : ""}${productLinks(list, ru)}`,
    };
  }

  if (type === "discounts" || type === "hits") {
    const all = await fsQuery({ from: [{ collectionId: "products" }], limit: 1000 });
    const act = all.filter((p) => p.active !== false);
    const list = type === "discounts"
      ? act.filter((p) => Number(p.oldPrice) > Number(p.price))
      : act.filter((p) => p.tag === "bestseller");
    const T = {
      discounts: {
        uz: ["Chegirmalar va aksiyalar — koreys kosmetikasi | CASME", "CASME'da original koreys kosmetikasiga mega chegirmalar va aksiyalar."],
        ru: ["Скидки и акции на корейскую косметику | CASME", "Мега скидки на оригинальную корейскую косметику в CASME."],
      },
      hits: {
        uz: ["Eng ko'p sotilgan mahsulotlar — koreys kosmetikasi | CASME", "CASME'dagi eng ommabop koreys kosmetikasi mahsulotlari."],
        ru: ["Хиты продаж — корейская косметика | CASME", "Самые популярные товары корейской косметики в CASME."],
      },
    }[type][ru ? "ru" : "uz"];
    const path = `/${type}`;
    return {
      path,
      title: T[0],
      desc: T[1],
      image: list[0] ? firstImage(list[0]) : "",
      jsonLd: [itemListLd(list, ru), crumbLd(ru, T[0].split(" | ")[0], `${SITE_URL}${path}`)],
      bodyHtml: `<h1>${escHtml(T[0].split(" | ")[0])}</h1><p>${escHtml(T[1])}</p>${productLinks(list.slice(0, 60), ru)}`,
    };
  }

  if (type === "categories") {
    const act = (await fsQuery({ from: [{ collectionId: "products" }], limit: 1000 })).filter((p) => p.active !== false);
    const cats = [...new Set(act.map((p) => (p.category || "").trim()).filter(Boolean))];
    const brs = [...new Set(act.map((p) => (p.brand || "").trim()).filter(Boolean))];
    const title = ru ? "Категории корейской косметики | CASME" : "Koreys kosmetikasi kategoriyalari | CASME";
    const desc = ru ? "Все категории корейской косметики и ухода за кожей в CASME." : "CASME'dagi barcha koreys kosmetikasi va teri parvarishi kategoriyalari.";
    const links = (arr, kind) => `<ul>${arr.map((n) => `<li><a href="${SITE_URL}/${kind}/${encodeURIComponent(n)}">${escHtml(n)}</a></li>`).join("")}</ul>`;
    return {
      path: "/categories",
      title,
      desc,
      image: "",
      jsonLd: [crumbLd(ru, ru ? "Категории" : "Kategoriyalar", `${SITE_URL}/categories`)],
      bodyHtml: `<h1>${escHtml(title.split(" | ")[0])}</h1><p>${escHtml(desc)}</p>${links(cats, "category")}<h2>${ru ? "Бренды" : "Brendlar"}</h2>${links(brs, "brand")}`,
    };
  }
  return null;
}


// ==========================================================
// Maqolalar: /articles va /article/<slug> — alohida (SPA'siz) to'liq HTML.
// Matnlar src/articles.js'da. Maqola oxirida tegishli kategoriya mahsulotlari.
// ==========================================================
const ART_CSS = `*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1e293b;background:#fff;line-height:1.7}
a{color:#e11d48;text-decoration:none}a:hover{text-decoration:underline}
header{border-bottom:1px solid #f1f5f9;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:820px;margin:0 auto}
.logo{font-weight:800;letter-spacing:.12em;color:#1f1f1f;font-size:20px}
nav a{margin-left:14px;font-size:14px;color:#475569}
main{max-width:820px;margin:0 auto;padding:24px 20px 48px}
h1{font-size:28px;line-height:1.25;margin:0 0 8px}h2{font-size:20px;margin:28px 0 6px}
p{margin:0 0 14px;font-size:16px}.meta{color:#94a3b8;font-size:13px;margin-bottom:18px}
ul.list{list-style:none;padding:0;margin:20px 0;display:grid;gap:12px}
ul.list li{border:1px solid #f1f5f9;border-radius:14px;padding:14px 16px}
ul.list a.t{font-weight:600;font-size:17px;color:#1e293b}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin:12px 0 24px}
.card{border:1px solid #f1f5f9;border-radius:14px;padding:10px;font-size:13px;color:#1e293b;display:block}
.card img{width:100%;aspect-ratio:1/1;object-fit:contain;background:#f8fafc;border-radius:10px}
.card b{display:block;margin-top:6px;font-weight:600}.card span{color:#64748b}
.cta{display:inline-block;background:#e11d48;color:#fff;border-radius:999px;padding:10px 20px;font-weight:600;margin:6px 0 0}.cta:hover{text-decoration:none;background:#be123c}
footer{border-top:1px solid #f1f5f9;padding:20px;text-align:center;font-size:13px;color:#94a3b8}`;

function articleShell({ title, desc, path, ru, jsonLd, inner }) {
  const self = `${SITE_URL}${path}`;
  const selfHref = ru ? `${self}?lang=ru` : self;
  const other = ru ? self : `${self}?lang=ru`;
  const ld = (jsonLd || []).map((o) => `<script type="application/ld+json">${ldJson(o)}</script>`).join("\n");
  return `<!doctype html>
<html lang="${ru ? "ru" : "uz"}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(title)}</title>
<meta name="description" content="${escHtml(desc)}" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${escHtml(selfHref)}" />
<link rel="alternate" hreflang="uz-UZ" href="${escHtml(self)}" />
<link rel="alternate" hreflang="ru-UZ" href="${escHtml(self)}?lang=ru" />
<link rel="alternate" hreflang="x-default" href="${escHtml(self)}" />
<link rel="icon" href="/favicon.ico" />
<meta property="og:site_name" content="CASME" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escHtml(title)}" />
<meta property="og:description" content="${escHtml(desc)}" />
<meta property="og:url" content="${escHtml(selfHref)}" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escHtml(title)}" />
<meta name="twitter:description" content="${escHtml(desc)}" />
${ld}
<style>${ART_CSS}</style>
</head>
<body>
<header>
<a class="logo" href="/">CASME</a>
<nav><a href="/">${ru ? "Магазин" : "Do'kon"}</a><a href="/articles${ru ? "?lang=ru" : ""}">${ru ? "Статьи" : "Maqolalar"}</a><a href="${escHtml(other)}">${ru ? "O'zbekcha" : "Русский"}</a></nav>
</header>
<main>
${inner}
</main>
<footer>© CASME — ${ru ? "оригинальная корейская косметика" : "original koreys kosmetikasi"}</footer>
</body>
</html>`;
}

async function sendArticlePage(req, res, type, key, ru) {
  const q = ru ? "?lang=ru" : "";
  const L = ru ? "ru" : "uz";
  let html;
  if (type === "articles") {
    const title = ru ? "Статьи об уходе за кожей | CASME" : "Teri parvarishi maqolalari | CASME";
    const desc = ru ? "Полезные статьи об уходе за кожей и корейской косметике: как выбрать сыворотку, SPF и построить уход." : "Teri parvarishi va koreys kosmetikasi bo'yicha foydali maqolalar: serum, SPF tanlash va parvarish tartibi.";
    html = articleShell({
      title, desc, path: "/articles", ru,
      jsonLd: [
        { "@context": "https://schema.org", "@type": "CollectionPage", name: title.split(" | ")[0], description: desc, url: `${SITE_URL}/articles` },
        crumbLd(ru, ru ? "Статьи" : "Maqolalar", `${SITE_URL}/articles`),
      ],
      inner:
        `<h1>${escHtml(title.split(" | ")[0])}</h1><p>${escHtml(desc)}</p><ul class="list">` +
        ARTICLES.map((a) => `<li><a class="t" href="/article/${a.slug}${q}">${escHtml(a[L].title)}</a><p style="margin:6px 0 0;font-size:14px;color:#64748b">${escHtml(a[L].desc)}</p></li>`).join("") +
        `</ul>`,
    });
  } else {
    const a = getArticle(key);
    if (!a) return false;
    const c = a[L];
    let products = [];
    try {
      products = a.category ? (await fetchProductsWhere("category", a.category, 12)).filter((p) => !soldOut(p)).slice(0, 6) : [];
    } catch { /* mahsulotsiz ham ishlayveradi */ }
    const path = `/article/${a.slug}`;
    const body = c.blocks.map(([t, text]) => (t === "h" ? `<h2>${escHtml(text)}</h2>` : `<p>${escHtml(text)}</p>`)).join("");
    const prodHtml = products.length
      ? `<h2>${ru ? "Подходящие товары" : "Mos mahsulotlar"}</h2><div class="grid">` +
        products.map((p) => {
          const img = firstImage(p);
          const src = img.startsWith(ALLOWED_IMAGE_HOST) ? `/product-image?src=${encodeURIComponent(img)}&raw=1&w=300` : img;
          return `<a class="card" href="/product/${escHtml(p.id)}${q}">${src ? `<img loading="lazy" src="${escHtml(src)}" alt="${escHtml(pickName(p, ru))}" />` : ""}<b>${escHtml(pickName(p, ru))}</b><span>${escHtml(Number(p.price || 0).toLocaleString("ru-RU"))} UZS</span></a>`;
        }).join("") + `</div>`
      : "";
    html = articleShell({
      title: `${c.title} | CASME`, desc: c.desc, path, ru,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: c.title,
          description: c.desc,
          datePublished: a.date,
          dateModified: a.date,
          inLanguage: ru ? "ru-UZ" : "uz-UZ",
          mainEntityOfPage: `${SITE_URL}${path}`,
          author: { "@type": "Organization", name: "CASME", url: `${SITE_URL}/` },
          publisher: { "@type": "Organization", name: "CASME", url: `${SITE_URL}/` },
        },
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: ru ? "Главная" : "Bosh sahifa", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: ru ? "Статьи" : "Maqolalar", item: `${SITE_URL}/articles` },
            { "@type": "ListItem", position: 3, name: c.title, item: `${SITE_URL}${path}` },
          ],
        },
      ],
      inner:
        `<p class="meta"><a href="/articles${q}">${ru ? "← Все статьи" : "← Barcha maqolalar"}</a> · ${escHtml(a.date)}</p><h1>${escHtml(c.title)}</h1>${body}${prodHtml}` +
        `<p><a class="cta" href="/">${ru ? "Перейти в магазин CASME" : "CASME do'koniga o'tish"}</a></p>`,
    });
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(html);
  return true;
}

async function fetchBaseHtml() {
  const r = await fetch(`${SITE_URL}/index.html`);
  if (!r.ok) throw new Error(`index.html ${r.status}`);
  const html = await r.text();
  if (!html.includes('<div id="root"></div>')) throw new Error("index.html shabloni topilmadi");
  return html;
}

async function sendPage(req, res) {
  const type = String((req.query && req.query.type) || "");
  const key = String((req.query && req.query.key) || "");
  const ru = (req.query && req.query.lang) === "ru";
  if (type === "articles" || type === "article") {
    try {
      if (await sendArticlePage(req, res, type, key, ru)) return;
    } catch (e) {
      console.error("article xatosi:", e);
    }
    return res.redirect(302, "/articles");
  }
  let base = null;
  try {
    base = await fetchBaseHtml();
    const page = type === "discounts" || type === "hits" || type === "categories" ? await buildPageData(type, "", ru) : key ? await buildPageData(type, key, ru) : null;
    const out = page ? buildPageHtml(base, page, ru) : base;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", page ? "public, max-age=0, s-maxage=600, stale-while-revalidate=86400" : "public, max-age=0, s-maxage=60");
    // Topilmagan (yoki o'chirilgan/yashirilgan) mahsulot — 404: Google bunday sahifani
    // indeksdan chiqaradi. Mijoz esa baribir sayt ichida (SPA) ko'radi. Brend/kategoriya
    // nomlarida maxsus belgi bo'lishi mumkin, shuning uchun ularga 404 BERILMAYDI.
    const status = !page && type === "product" && key ? 404 : 200;
    return res.status(status).send(out);
  } catch (e) {
    console.error("page xatosi:", e);
    if (base) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).send(base);
    }
    return res.redirect(302, "/");
  }
}

export default async function handler(req, res) {
  const kind = (req.query && req.query.kind) || "";
  if (kind === "page") return sendPage(req, res);
  if (kind === "robots") return sendRobots(res);
  if (kind === "favicon") return sendFavicon(res);
  if (kind === "merchant") return sendMerchantFeed(req, res);
  if (kind === "product-image") return sendProductImage(req, res);
  if (kind === "icon") return sendAppIcon(req, res);
  return sendSitemap(res);
}

export const config = { maxDuration: 30 };
