// ==========================================================
// /api/robots  (vercel.json orqali ochiq internetga /robots.txt
// manzilida chiqadi — pastdagi vercel.json rewrite qoidasiga qarang)
//
// Qidiruv tizimlari (Googlebot va h.k.) do'kon sahifalarini erkin
// crawl qilishiga ruxsat beradi, admin panelni esa yashiradi va
// sitemap manzilini ko'rsatadi.
// ==========================================================

const SITE_URL = "https://casme.uz";

export default async function handler(req, res) {
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
