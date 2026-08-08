import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    // PWA (mobil ilova) — saytni "Bosh ekranga qo'shish" orqali
    // o'rnatiladigan ilovaga aylantiradi.
    //
    // MUHIM (xavfsizlik/to'g'rilik uchun):
    // - registerType: "autoUpdate" — har yangi deploy'dan keyin foydalanuvchi
    //   eski (keshlangan) versiyada "qolib ketmasligi" uchun, servis worker
    //   avtomatik yangilanadi va sahifa keyingi ochilishda yangi kodni oladi.
    // - runtimeCaching FAQAT statik narsalarga (shriftlar, mahsulot rasmlari)
    //   tegishli — Firestore (narx/qoldiq) so'rovlari UMUMAN keshlanmaydi,
    //   shuning uchun offline'dan keyin internet qaytganda har doim ENG
    //   YANGI narx/qoldiq ko'rsatiladi, eskisi emas.
    // - navigateFallbackDenylist — bizning /api, /sitemap.xml, /robots.txt,
    //   /merchant-feed.xml, /product-image, /icon-*.png, /favicon.ico kabi
    //   maxsus manzillarimiz servis worker'ning "offline fallback"
    //   mexanizmiga tushib qolmasligi uchun (ular index.html emas).
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [],
      manifest: {
        id: "/",
        name: "CASME — Original Koreys Kosmetikasi",
        short_name: "CASME",
        description: "CASME — original Koreya kosmetikalari va teri parvarishi mahsulotlari.",
        lang: "uz",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#FFFFFF",
        background_color: "#FFFFFF",
        categories: ["shopping", "beauty"],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
          /^\/merchant-feed\.xml$/,
          /^\/product-image/,
          /^\/icon-/,
          /^\/favicon\.ico$/,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/pub-6a37909dbe8741249b8e364db72918b6\.r2\.dev\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "casme-product-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
        ],
      },
    }),
  ],
});
