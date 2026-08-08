import React, { useState, useEffect, useMemo, useCallback, useRef, lazy, Suspense } from "react";
import {
  LayoutGrid, ClipboardList, Package, Plus, Trash2, Pencil, X,
  Search, Globe, Wallet, CheckCircle2, Clock,
  ChevronDown, Save, Loader2, ShoppingCart, ShoppingBag,
  Minus, ArrowLeft, PartyPopper, Heart, UserRound, Truck, MapPin,
  LogOut, Star, RotateCcw, ShieldCheck, Headphones,
  Settings as SettingsIcon, Tag,
  ChevronLeft, ChevronRight, MessageCircle, Home,
  SlidersHorizontal, Filter, Check, ArrowRight,
} from "lucide-react";
import { initTelegram, isInTelegram, getTelegramUser, hapticFeedback, getWebApp } from "./telegram.js";
import Banner from "./components/Banner.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import { CategoryIconRow, BrandIconRow, CategoryShowcase, CategoryQuickRow, CollectionShowcase, WideCollectionShowcase, collectionTitle, collectionDescription, itemThumb } from "./components/CategoryShowcase.jsx";
import StoreFooter from "./components/StoreFooter.jsx";
import Testimonials from "./components/Testimonials.jsx";
import MapPicker from "./components/MapPicker.jsx";

// MUHIM (tezlik uchun kod ajratish/code-splitting): admin panelining BARCHA
// kodi (buyurtmalar, mijozlar, mahsulotlar boshqaruvi, statistika grafigi,
// Telegram/Marketing/Sozlamalar sahifalari va h.k.) endi src/AdminApp.jsx
// faylida va faqat "lazy()" orqali, KERAK BO'LGANDA (/admin ochilganda)
// tarmoqdan yuklanadi — mijozlar bu kodni umuman yuklab olmaydi.
const AdminApp = lazy(() => import("./AdminApp.jsx"));

/* ---------------------------------------------------------------
   I18N
--------------------------------------------------------------- */
export const T = {
  uz: {
    appName: "CASME",
    workspace: "Do'kon",
    sidebarCollapse: "Menyuni yig'ish", sidebarExpand: "Menyuni kengaytirish",
    menu: {
      dashboard: "Boshqaruv paneli",
      orders: "Buyurtmalar",
      customers: "Mijozlar",
      products: "Mahsulotlar",
      banner: "Banner",
      testimonials: "Sharhlar", faqs: "Savol-javob",
      marketing: "Marketing",
      telegram: "Telegram",
      settings: "Sozlamalar",
    },
    soon: "Bu bo'lim tez orada qo'shiladi",
    dashboard: {
      revenue: "DAROMADLAR", orders: "BUYURTMALAR", customers: "JAMI MIJOZLAR",
      cost: "Sotuvlar tannarxi", delivery: "Yetkazib berish summasi", profit: "Foyda",
      new: "Yangi", ready: "Tayyor", cancelled: "Bekor qilindi",
      newCustomers: "Yangi mijozlar", returning: "Qaytgan mijozlar", avgOrder: "O'rtacha buyurtma",
      chartTitle: "Daromadlar statistikasi", revenueLabel: "Daromad",
      recentOrders: "So'nggi buyurtmalar", noOrders: "Hozircha buyurtma yo'q",
      topCustomers: "Top mijozlar", noCustomers: "Hozircha mijozlar yo'q",
      periodToday: "Bugun", periodWeek: "Hafta", periodMonth: "Oy",
      vsLastPeriod: "o'tgan davrga nisbatan",
      topProducts: "Eng ko'p sotilgan mahsulotlar", noTopProducts: "Hozircha sotuv yo'q", soldUnits: "dona sotildi",
      lowStock: "Kam qolgan mahsulotlar", lowStockNote: "Bu mahsulotlarning qoldig'i tugab qolmoqda — vaqtida to'ldiring.",
      quickActions: "Tezkor harakatlar", qaProduct: "Mahsulot qo'shish", qaBanner: "Banner qo'shish",
      qaOrders: "Buyurtmalarni ko'rish", qaTestimonial: "Sharh qo'shish",
    },
    orders: {
      title: "Buyurtmalar", add: "Buyurtma qo'shish", customer: "Mijoz", amount: "Summa",
      status: "Holat", date: "Sana", actions: "Amallar", empty: "Buyurtma topilmadi",
      searchPh: "Mijoz nomi bo'yicha qidirish...",
      st: { new: "Yangi", ready: "Tayyor", on_way: "Yo'lda", delivered: "Yetkazib berildi", cancelled: "Bekor qilindi" },
      payment: "To'lov", address: "Manzil", phone: "Telefon",
      paymentLabels: { cash: "Naqd", card: "Karta" },
      items: "Mahsulotlar", detailTitle: "Buyurtma", total: "Jami summa",
      tabAll: "Barchasi", deliveryPrice: "Yetkazib berish narxi", deliveryPriceHint: "Masalan: 20000",
      saveDelivery: "Saqlash",
      export: "Eksport", dateFilter: "Sana", clearDates: "Tozalash",
      selected: "ta tanlandi", applyBulk: "Qo'llash", clearSelection: "Bekor qilish",
      newOrderToast: "🎉 Yangi buyurtma keldi!",
      call: "Qo'ng'iroq", messageTelegram: "Telegram",
      note: "Admin eslatmasi", noteHint: "Faqat sizga ko'rinadigan ichki eslatma...",
    },
    customers: {
      title: "Mijozlar", add: "Mijoz qo'shish", edit: "Mijozni tahrirlash", name: "Ism", phone: "Telefon", email: "Email",
      orders: "Buyurtmalar", spent: "Jami xarid", date: "Qo'shilgan sana",
      actions: "Amallar", empty: "Mijoz topilmadi", searchPh: "Ism yoki telefon bo'yicha qidirish...",
      tier: "Daraja", tierVip: "VIP", tierActive: "Faol", tierNew: "Yangi",
      sortDate: "Yangi qo'shilgan", sortSpent: "Ko'p xarid qilgan", sortOrders: "Ko'p buyurtma bergan", sortName: "Ism (A-Z)",
      bonusPoints: "Bonus ballar", pointsHint: "Masalan: 50", addPoints: "Qo'shish",
      orderHistory: "Buyurtmalar tarixi", addresses: "Manzillar", noAddresses: "Saqlangan manzil yo'q", onMap: "Xaritada",
      statTotal: "Jami mijozlar", statActive: "Faol mijozlar", statActiveHint: "So'nggi 30 kunda buyurtma bergan",
      statPassive: "Passiv mijozlar", statPassiveHint: "So'nggi 30 kunda buyurtma bermagan",
      statNew: "Yangi mijozlar", statNewHint: "So'nggi 7 kunda qo'shilgan",
    },
    products: {
      title: "Mahsulotlar", add: "Mahsulot qo'shish", edit: "Mahsulotni tahrirlash",
      name: "Nomi", price: "Narxi",
      oldPrice: "Asl narx (ixtiyoriy)", oldPriceHint: "Chegirmadan oldingi narx",
      stock: "Qoldiq", category: "Kategoriya", brand: "Brend", actions: "Amallar", empty: "Mahsulot topilmadi",
      searchPh: "Mahsulot nomi bo'yicha qidirish...",
      categoryPh: "Mavjuddan tanlang yoki yangisini yozing",
      imageUrl: "Mahsulot rasmi (URL, ixtiyoriy)",
      stockType: "Qoldiq turi", limited: "Soni bilan", unlimited: "Cheksiz", outOfStock: "Qolmagan",
      description: "Tavsif", descriptionPh: "Mahsulot haqida qisqacha ma'lumot...",
      images: "Rasmlar", mainImage: "Asosiy",
      sortName: "Nomi bo'yicha", sortPriceAsc: "Narx: arzondan", sortPriceDesc: "Narx: qimmatdan",
      sortStock: "Qoldiq bo'yicha", sortRating: "Reyting bo'yicha",
      duplicate: "Nusxalash", quickEditHint: "Tez o'zgartirish uchun bosing",
      categoriesBtn: "Kategoriyalar", brandsBtn: "Brendlar",
      filterBtn: "Filtr", clearFilters: "Filtrlarni tozalash",
      selectAll: "Barchasini belgilash", deselectAll: "Barchasini olib tashlash",
      stockStatusAll: "Qoldiq: barchasi", stockStatusIn: "Mavjud", stockStatusOut: "Qolmagan", stockStatusLow: "Kam qolgan",
      activeCol: "Faol", activeOn: "Faol", activeOff: "Nofaol",
      sold: "Sotildi", lowStockBanner: "ta mahsulot kam qolmoqda (5 tadan kam)",
      newItemPh: "Yangisini kiriting...", noItems: "Hozircha yo'q",
      collectionsBtn: "Kolleksiyalar", collectionAdd: "To'plam qo'shish", collectionEdit: "To'plamni tahrirlash",
      collectionEmpty: "Hozircha to'plam yo'q — \"O'zingizga mos uslubni toping\" bo'limida bularni ko'rsatasiz",
      collectionTitleUz: "Sarlavha (o'zbekcha)", collectionTitleRu: "Sarlavha (ruscha)", collectionTitlePh: "Masalan: Dog'li yuz uchun to'plam",
      collectionTitleRuPh: "Masalan: Набор для проблемной кожи",
      collectionDescriptionUz: "Tavsif — o'zbekcha (ixtiyoriy)", collectionDescriptionRu: "Tavsif — ruscha (ixtiyoriy)",
      collectionDescriptionPh: "Bu to'plam haqida qisqacha yozing...", collectionDescriptionRuPh: "Kratkoye opisaniye na russkom...",
      collectionImage: "Rasm", collectionUpload: "Rasm tanlang", collectionImageSizeLabel: "Tavsiya etilgan o'lcham:",
      collectionStyle: "Ko'rinish turi",
      collectionStyleCard: "Kvadrat kartochka", collectionStyleCardHint: "\"O'zingizga mos uslubni toping\" bo'limida",
      collectionStyleCardBottom: "Kvadrat (pastda)", collectionStyleCardBottomHint: "Kategoriya bo'limidan keyin, Brendlardan oldin",
      collectionStyleBanner: "Keng banner", collectionStyleBannerHint: "\"Mashhur\" ostida, keng suratlar qatorida (950x400)",
      collectionStyleHero: "Katta surat + mahsulotlar", collectionStyleHeroHint: "Portret surat (750x1200), pastida mahsulotlar qatori",
      collectionProducts: "Mahsulotlar", collectionSelected: "tanlandi",
      collectionDiscount: "Chegirma (%)", collectionDiscountHint: "Faqat shu banner orqali kirilganda amal qiladi — mahsulotning o'zidagi narxi o'zgarmaydi",
      showTotalCalc: "Jami narx hisoblash", showTotalCalcHint: "Yoqilsa — ichkarida \"Jami narx\" va \"Barchasini savatga qo'shish\" ko'rinadi",
      active: "Faol", inactive: "Faol emas",
    },
    store: {
      title: "Bizning do'kon", subtitle: "Mahsulotni tanlang va buyurtma bering",
      addToCart: "Savatga qo'shish", outOfStock: "Qoldiq yo'q", inStock: "dona qoldi", available: "Mavjud",
      descriptionTitle: "Tavsif",
      shopByCategory: "Kategoriya bo'yicha", findYourStyle: "O'zingizga mos uslubni toping", exploreNow: "Ko'rish",
      moreCollectionsTag: "Yana tanlovlar", moreCollectionsTitle: "Sizga yoqishi mumkin",
      collectionTotal: "Jami narx", collectionAddAll: "Barchasini savatga qo'shish",
      bestSellers: "Eng ko'p sotilganlar",
      bestSellersSubtitle: "So'nggi 30 kun ichida eng ko'p xarid qilingan mahsulotlar",
      hitProducts: "Xit mahsulotlar",
      allProductsTag: "To'liq katalog", allProductsTitle: "Barcha mahsulotlar",
      brandsCount: "ta brend", productsCount: "ta mahsulot",
      discountsTag: "Chegirmalar", discountsTitle: "Chegirmaga tushgan mahsulotlar", megaDiscountTitle: "Mega Chegirma",
      bonusLabel: "Bonus",
      navHome: "Bosh sahifa", navShop: "Do'kon", navCategories: "Kategoriyalar", brandsTitle: "Brendlar",
      searchHistory: "Qidiruv tarixi", clearHistory: "Tozalash", categoriesLabel: "Toifalar",
      filtersTitle: "Filtrlar", sortTitle: "Saralash", priceLabel: "Narx", applyBtn: "Tasdiqlash", comingSoon: "Tez orada qo'shiladi",
      minPriceLabel: "Minimal narx", maxPriceLabel: "Maksimal narx",
      happyCustomers: "Xursand mijozlar", avgRating: "O'rtacha reyting",
      newCustomerOffer: "yangi mijozlar uchun",
      featShipping: "Bepul yetkazib berish", featReturns: "Oson qaytarish", featSecure: "Xavfsiz to'lov", featSupport: "24/7 qo'llab-quvvatlash",
      testimonialsTag: "Mijozlar fikri", testimonialsTitle: "Bizga ishonishadi",
      faqTag: "Savollaringiz bormi", faqTitle: "Tez-tez so'raladigan savollar",
      faqAll: "Barchasi", faqSearchPh: "Savollarni izlash...", faqNoResults: "Hech narsa topilmadi",
      instagramTag: "Ijtimoiy tarmoq", instagramTitle: "Instagramda kuzating", instagramFollow: "Obuna bo'lish",
      tagNew: "Yangi", tagBestseller: "Top",
      cart: "Savat", cartEmpty: "Savat bo'sh", total: "Jami", checkout: "Buyurtma berish",
      subtotal: "Mahsulotlar summasi",
      cartDeleteSelected: "Tanlanganlarni o'chirish", cartSelectAll: "Barchasini tanlash",
      cartPerItem: "/ mahsulot", cartItemsLabel: "ta mahsulot",
      cartDeliveryNote: "Buyurtmani rasmiylashtirish sahifasida yetkazib berishning usullari va vaqtini tanlashingiz mumkin",
      cartCheckoutBtn: "Rasmiylashtirishga o'tish", cartRecommended: "Sizga qiziq bo'lishi mumkin",
      promoPh: "Promo kod", promoApply: "Qo'llash", promoApplied: "qo'llandi", promoRemove: "Olib tashlash",
      bonusAvailable: "Mavjud bonus", bonusUsePh: "Miqdorni kiriting", bonusMaxBtn: "Barchasi", bonusUsed: "Bonusdan foydalanildi",
      mapPick: "Xaritadan belgilash", mapPickNote: "Manzilni aniqroq ko'rsatish uchun xaritada nuqta belgilang",
      promoInvalid: "Bunday promo kod topilmadi yoki faol emas",
      promoExpired: "Bu promo kodning muddati tugagan",
      promoLimitReached: "Bu promo kodning ishlatish limiti tugagan",
      promoMinOrder: "Bu kod uchun buyurtma kamida {amount} UZS bo'lishi kerak",
      yourName: "Ismingiz", yourPhone: "Telefon raqamingiz", placeOrder: "Buyurtmani tasdiqlash",
      addPhone2: "Yana bir telefon raqam qo'shish", phone2Label: "Qo'shimcha telefon raqami", removePhone2: "Olib tashlash",
      phoneInvalid: "Telefon raqamini to'liq kiriting",
      payment: "To'lov usuli", cash: "Naqd pul (yetkazib berganda)",
      card: "Karta orqali to'lov / kartaga o'tkazma", address: "Yetkazib berish manzili", addressPh: "Shahar, tuman, ko'cha, uy...",
      locateMe: "Joylashuvimni aniqlash", locating: "Aniqlanmoqda...", locationSet: "Joylashuv aniqlandi",
      viewOnGmaps: "Google Xaritada ko'rish", viewOnYmaps: "Yandex Xaritada ko'rish",
      locationError: "Joylashuvni aniqlab bo'lmadi, manzilni qo'lda yozing",
      placing: "Yuborilmoqda...", success: "Buyurtmangiz qabul qilindi!",
      successNote: "Tez orada siz bilan bog'lanamiz", newOrder: "Yangi buyurtma berish",
      searchPh: "Mahsulot izlash...", noProducts: "Hozircha mahsulot yo'q",
      qty: "soni", remove: "O'chirish",
      bannerTag: "Chegirma", bannerTitle: "Barcha mahsulotlarga chegirma",
      bannerSubtitle: "Uzoq muddatli mavsumiy aksiya davom etmoqda",
      bannerShipping: "belgilangan summadan yuqori xaridga yetkazib berish tekin",
      allCategories: "Barchasi", allBrands: "Barchasi", popular: "Eng ko'p sotilgan mahsulotlar", off: "chegirma",
      wishlist: "Sevimlilar", wishlistEmpty: "Sevimlilar bo'sh", login: "Kirish",
      viewAll: "Barchasini ko'rish", profileBtn: "Profil",
      profile: {
        title: "Mening profilim", name: "Ism", username: "Telegram username",
        language: "Til",
        phone: "Telefon raqam", notLinked: "Telegram orqali kirilmagan",
        myOrders: "Buyurtmalarim", noOrders: "Hozircha buyurtma yo'q",
        loading: "Yuklanmoqda...",
        addPhone: "Telefon raqamni qo'shish",
        personalData: "Shaxsiy ma'lumotlar",
        addresses: "Yetkazib berish manzillari",
        settings: "Sozlamalar",
        deliveryAddress: "Manzilingiz", deliveryAddressNote: "Buyurtma berishda avtomatik taklif qilinadi.",
        addressPh: "Shahar, tuman, ko'cha, uy...",
        saveAddress: "Saqlash", addressSaved: "Manzil saqlandi", addAddress: "Yangi manzil qo'shish", editAddress: "Manzilni tahrirlash",
        addPhoneNote: "Telefon raqamingizni saqlab qo'ysangiz, \"Buyurtmalarim\" bo'limida shu raqamga tegishli buyurtmalarni ham ko'rasiz.",
        searchPh: "Telefon raqamingiz", savePhone: "Saqlash", phoneSaved: "Telefon raqami saqlandi",
        order: "Buyurtma",
        items: "Mahsulotlar",
        loginTitle: "Kirish yoki ro'yxatdan o'tish",
        loginSubtitle: "Telefon raqamingizni kiriting",
        termsText: "Bosish orqali siz oferta shartlarini qabul qilasiz va shaxsiy ma'lumotlarni qayta ishlashga rozilik bildirasiz",
        confirmPhone: "Telegram orqali kod olish",
        otpSendError: "Bot username sozlanmagan",
        otpTitle: "Tasdiqlash kodi",
        otpSubtitle: "Kod Telegram botimizga yuborildi. Botni ochib, kodni ko'ring:",
        otpResend: "Telegramni qayta ochish",
        otpConfirm: "Tasdiqlash",
        otpWrong: "Kod noto'g'ri yoki muddati tugagan",
        yourName: "Ismingiz", namePlaceholder: "Qabul qiluvchi nomini kiriting",
        emailLabel: "Elektron pochta", emailPlaceholder: "Email manzilingizni kiriting",
        emailRequired: "Iltimos, elektron pochtani kiriting",
        applyLabel: "Qo'llash",
      },
      review: {
        btn: "Sharh qoldirish", pending: "Tasdiqlanishi kutilmoqda", done: "Sharh yuborilgan",
        title: "Sharh qoldirish", rating: "Bahoingiz", text: "Fikringiz",
        textPh: "Mahsulot haqida fikringizni yozing...",
        photo: "Surat qo'shish (ixtiyoriy)", uploadBtn: "Rasm tanlang", uploading: "Yuklanmoqda...",
        submit: "Yuborish", submitting: "Yuborilmoqda...",
        success: "Rahmat! Sharhingiz yuborildi, tasdiqlangandan so'ng saytda ko'rinadi.",
        required: "Iltimos fikringizni yozing",
      },
    },
    switcher: { admin: "Boshqaruv paneli", store: "Mijozlar do'koni", previewNote: "Namuna: haqiqiy loyihada bular alohida manzillar bo'ladi" },
    login: {
      title: "Admin panelga kirish", email: "Elektron pochta", password: "Parol",
      submit: "Kirish", loading: "Tekshirilmoqda...", wrong: "Email yoki parol xato",
      logout: "Chiqish", viewStore: "Do'kon sahifasini ko'rish",
    },
    common: {
      save: "Saqlash", cancel: "Bekor qilish", delete: "O'chirish", edit: "Tahrirlash",
      close: "Yopish", required: "Bu maydon majburiy", uzs: "UZS", ta: "ta",
      confirmDelete: "Rostdan ham o'chirmoqchimisiz?", saving: "Saqlanmoqda...",
      sharedNote: "Bu ma'lumotlar barcha foydalanuvchilarga umumiy ko'rinadi",
    },
  },
  ru: {
    appName: "CASME",
    workspace: "Магазин",
    sidebarCollapse: "Свернуть меню", sidebarExpand: "Развернуть меню",
    menu: {
      dashboard: "Панель управления",
      orders: "Заказы",
      customers: "Клиенты",
      products: "Товары",
      banner: "Баннер",
      testimonials: "Отзывы", faqs: "Вопрос-ответ",
      marketing: "Маркетинг",
      telegram: "Telegram",
      settings: "Настройки",
    },
    soon: "Этот раздел скоро появится",
    dashboard: {
      revenue: "ДОХОДЫ", orders: "ЗАКАЗЫ", customers: "ВСЕГО КЛИЕНТОВ",
      cost: "Себестоимость продаж", delivery: "Сумма доставки", profit: "Прибыль",
      new: "Новые", ready: "Готово", cancelled: "Отменено",
      newCustomers: "Новые клиенты", returning: "Вернувшиеся", avgOrder: "Средний заказ",
      chartTitle: "Статистика доходов", revenueLabel: "Доход",
      recentOrders: "Последние заказы", noOrders: "Пока нет заказов",
      topCustomers: "Топ клиенты", noCustomers: "Пока нет клиентов",
      periodToday: "Сегодня", periodWeek: "Неделя", periodMonth: "Месяц",
      vsLastPeriod: "по сравнению с прошлым периодом",
      topProducts: "Самые продаваемые товары", noTopProducts: "Пока нет продаж", soldUnits: "шт. продано",
      lowStock: "Заканчивающиеся товары", lowStockNote: "У этих товаров остаток на исходе — пополните вовремя.",
      quickActions: "Быстрые действия", qaProduct: "Добавить товар", qaBanner: "Добавить баннер",
      qaOrders: "Смотреть заказы", qaTestimonial: "Добавить отзыв",
    },
    orders: {
      title: "Заказы", add: "Добавить заказ", customer: "Клиент", amount: "Сумма",
      status: "Статус", date: "Дата", actions: "Действия", empty: "Заказы не найдены",
      searchPh: "Поиск по имени клиента...",
      st: { new: "Новый", ready: "Готово", on_way: "В пути", delivered: "Доставлено", cancelled: "Отменено" },
      payment: "Оплата", address: "Адрес", phone: "Телефон",
      paymentLabels: { cash: "Наличные", card: "Карта" },
      items: "Товары", detailTitle: "Заказ", total: "Итоговая сумма",
      tabAll: "Все", deliveryPrice: "Стоимость доставки", deliveryPriceHint: "Например: 20000",
      saveDelivery: "Сохранить",
      export: "Экспорт", dateFilter: "Дата", clearDates: "Очистить",
      selected: "выбрано", applyBulk: "Применить", clearSelection: "Отмена",
      newOrderToast: "🎉 Новый заказ!",
      call: "Позвонить", messageTelegram: "Telegram",
      note: "Заметка администратора", noteHint: "Внутренняя заметка, видна только вам...",
    },
    customers: {
      title: "Клиенты", add: "Добавить клиента", edit: "Редактировать клиента", name: "Имя", phone: "Телефон", email: "Email",
      orders: "Заказы", spent: "Всего покупок", date: "Дата добавления",
      actions: "Действия", empty: "Клиенты не найдены", searchPh: "Поиск по имени или телефону...",
      tier: "Уровень", tierVip: "VIP", tierActive: "Активный", tierNew: "Новый",
      sortDate: "Недавно добавленные", sortSpent: "Больше покупок", sortOrders: "Больше заказов", sortName: "Имя (А-Я)",
      bonusPoints: "Бонусные баллы", pointsHint: "Например: 50", addPoints: "Добавить",
      orderHistory: "История заказов", addresses: "Адреса", noAddresses: "Нет сохранённых адресов", onMap: "На карте",
      statTotal: "Всего клиентов", statActive: "Активные клиенты", statActiveHint: "Заказывали за последние 30 дней",
      statPassive: "Пассивные клиенты", statPassiveHint: "Не заказывали 30 дней",
      statNew: "Новые клиенты", statNewHint: "Присоединились за последние 7 дней",
    },
    products: {
      title: "Товары", add: "Добавить товар", edit: "Редактировать товар",
      name: "Название", price: "Цена",
      oldPrice: "Старая цена (опционально)", oldPriceHint: "Цена до скидки",
      stock: "Остаток", category: "Категория", brand: "Бренд", actions: "Действия", empty: "Товары не найдены",
      searchPh: "Поиск по названию товара...",
      categoryPh: "Выберите или введите новую",
      imageUrl: "Изображение товара (URL, опционально)",
      stockType: "Тип остатка", limited: "С количеством", unlimited: "Неограничено", outOfStock: "Нет в наличии",
      description: "Описание", descriptionPh: "Краткая информация о товаре...",
      images: "Изображения", mainImage: "Главное",
      sortName: "По названию", sortPriceAsc: "Цена: сначала дешевле", sortPriceDesc: "Цена: сначала дороже",
      sortStock: "По остатку", sortRating: "По рейтингу",
      duplicate: "Дублировать", quickEditHint: "Нажмите для быстрого изменения",
      categoriesBtn: "Категории", brandsBtn: "Бренды",
      filterBtn: "Фильтр", clearFilters: "Очистить фильтры",
      selectAll: "Выбрать всё", deselectAll: "Снять всё",
      stockStatusAll: "Остаток: все", stockStatusIn: "В наличии", stockStatusOut: "Нет в наличии", stockStatusLow: "Заканчивается",
      activeCol: "Активен", activeOn: "Активен", activeOff: "Неактивен",
      sold: "Продано", lowStockBanner: "товар(ов) заканчивается (меньше 5 шт.)",
      newItemPh: "Введите новое...", noItems: "Пока пусто",
      collectionsBtn: "Коллекции", collectionAdd: "Добавить коллекцию", collectionEdit: "Редактировать коллекцию",
      collectionEmpty: "Пока нет коллекций — они будут показаны в разделе \"Найдите свой стиль\"",
      collectionTitleUz: "Заголовок (узбекский)", collectionTitleRu: "Заголовок (русский)", collectionTitlePh: "Например: Набор для проблемной кожи",
      collectionTitleRuPh: "Например: Набор для проблемной кожи",
      collectionDescriptionUz: "Описание — узбекский (опционально)", collectionDescriptionRu: "Описание — русский (опционально)",
      collectionDescriptionPh: "Кратко опишите этот набор...", collectionDescriptionRuPh: "Кратко опишите этот набор...",
      collectionImage: "Изображение", collectionUpload: "Выберите изображение", collectionImageSizeLabel: "Рекомендуемый размер:",
      collectionStyle: "Стиль отображения",
      collectionStyleCard: "Квадратная карточка", collectionStyleCardHint: "В разделе \"Найдите свой стиль\"",
      collectionStyleCardBottom: "Квадратная (внизу)", collectionStyleCardBottomHint: "После раздела Категории, перед Брендами",
      collectionStyleBanner: "Широкий баннер", collectionStyleBannerHint: "Под \"Популярное\", в ряду широких изображений (950x400)",
      collectionStyleHero: "Большое фото + товары", collectionStyleHeroHint: "Портретное фото (750x1200), товары внизу",
      collectionProducts: "Товары", collectionSelected: "выбрано",
      collectionDiscount: "Скидка (%)", collectionDiscountHint: "Действует только при входе через этот баннер — цена самого товара не меняется",
      showTotalCalc: "Подсчёт итоговой цены", showTotalCalcHint: "Если включено — внутри показывается \"Итоговая цена\" и \"Добавить всё в корзину\"",
      active: "Активен", inactive: "Не активен",
    },
    store: {
      title: "Наш магазин", subtitle: "Выберите товар и сделайте заказ",
      addToCart: "В корзину", outOfStock: "Нет в наличии", inStock: "шт. осталось", available: "В наличии",
      descriptionTitle: "Описание",
      shopByCategory: "По категориям", findYourStyle: "Найдите свой стиль", exploreNow: "Смотреть",
      moreCollectionsTag: "Ещё варианты", moreCollectionsTitle: "Вам может понравиться",
      collectionTotal: "Итоговая цена", collectionAddAll: "Добавить всё в корзину",
      bestSellers: "Хиты продаж",
      bestSellersSubtitle: "Самые покупаемые товары за последние 30 дней",
      hitProducts: "Хит-товары",
      allProductsTag: "Полный каталог", allProductsTitle: "Все товары",
      brandsCount: "брендов", productsCount: "товаров",
      discountsTag: "Скидки", discountsTitle: "Товары со скидкой", megaDiscountTitle: "Мега Скидка",
      bonusLabel: "Бонус",
      navHome: "Главная", navShop: "Магазин", navCategories: "Категории", brandsTitle: "Бренды",
      searchHistory: "История поиска", clearHistory: "Очистить", categoriesLabel: "Категории",
      filtersTitle: "Фильтры", sortTitle: "Сортировка", priceLabel: "Цена", applyBtn: "Применить", comingSoon: "Скоро появится",
      minPriceLabel: "Минимальная цена", maxPriceLabel: "Максимальная цена",
      happyCustomers: "Довольных клиентов", avgRating: "Средний рейтинг",
      newCustomerOffer: "для новых клиентов",
      featShipping: "Бесплатная доставка", featReturns: "Лёгкий возврат", featSecure: "Безопасная оплата", featSupport: "Поддержка 24/7",
      testimonialsTag: "Отзывы клиентов", testimonialsTitle: "Нам доверяют",
      faqTag: "Есть вопросы?", faqTitle: "Часто задаваемые вопросы",
      faqAll: "Все", faqSearchPh: "Поиск вопросов...", faqNoResults: "Ничего не найдено",
      instagramTag: "Соцсети", instagramTitle: "Мы в Instagram", instagramFollow: "Подписаться",
      tagNew: "Новинка", tagBestseller: "Топ",
      cart: "Корзина", cartEmpty: "Корзина пуста", total: "Итого", checkout: "Оформить заказ",
      subtotal: "Сумма товаров",
      cartDeleteSelected: "Удалить выбранные", cartSelectAll: "Выбрать все",
      cartPerItem: "/ товар", cartItemsLabel: "товар(ов)",
      cartDeliveryNote: "Способ и время доставки можно выбрать на странице оформления заказа",
      cartCheckoutBtn: "Оформить заказ", cartRecommended: "Вам может понравиться",
      promoPh: "Промокод", promoApply: "Применить", promoApplied: "применён", promoRemove: "Убрать",
      bonusAvailable: "Доступный бонус", bonusUsePh: "Введите сумму", bonusMaxBtn: "Всё", bonusUsed: "Бонус использован",
      mapPick: "Отметить на карте", mapPickNote: "Отметьте точку на карте для более точного адреса",
      promoInvalid: "Такой промокод не найден или не активен",
      promoExpired: "Срок действия этого промокода истёк",
      promoLimitReached: "Лимит использования этого промокода исчерпан",
      promoMinOrder: "Для этого кода заказ должен быть минимум {amount} UZS",
      yourName: "Ваше имя", yourPhone: "Ваш номер телефона", placeOrder: "Подтвердить заказ",
      addPhone2: "Добавить ещё один номер телефона", phone2Label: "Дополнительный номер телефона", removePhone2: "Убрать",
      phoneInvalid: "Введите номер телефона полностью",
      payment: "Способ оплаты", cash: "Наличные (при получении)",
      card: "Оплата картой / перевод на карту", address: "Адрес доставки", addressPh: "Город, район, улица, дом...",
      locateMe: "Определить моё местоположение", locating: "Определение...", locationSet: "Местоположение определено",
      viewOnGmaps: "Посмотреть на Google Картах", viewOnYmaps: "Посмотреть на Яндекс Картах",
      locationError: "Не удалось определить местоположение, введите адрес вручную",
      placing: "Отправка...", success: "Ваш заказ принят!",
      successNote: "Мы скоро с вами свяжемся", newOrder: "Сделать новый заказ",
      searchPh: "Поиск товара...", noProducts: "Пока нет товаров",
      qty: "кол-во", remove: "Удалить",
      bannerTag: "Скидка", bannerTitle: "Скидки на все товары",
      bannerSubtitle: "Продолжается сезонная акция",
      bannerShipping: "бесплатная доставка при заказе от указанной суммы",
      allCategories: "Все", allBrands: "Все", popular: "Самые продаваемые товары", off: "скидка",
      wishlist: "Избранное", wishlistEmpty: "Список избранного пуст", login: "Войти",
      viewAll: "Смотреть все", profileBtn: "Профиль",
      profile: {
        title: "Мой профиль", name: "Имя", username: "Telegram username",
        language: "Язык",
        phone: "Номер телефона", notLinked: "Вход через Telegram не выполнен",
        myOrders: "Мои заказы", noOrders: "Пока нет заказов",
        loading: "Загрузка...",
        addPhone: "Добавить номер телефона",
        personalData: "Личные данные",
        addresses: "Адреса доставки",
        settings: "Настройки",
        deliveryAddress: "Ваш адрес", deliveryAddressNote: "Будет предложен автоматически при оформлении заказа.",
        addressPh: "Город, район, улица, дом...",
        saveAddress: "Сохранить", addressSaved: "Адрес сохранён", addAddress: "Добавить новый адрес", editAddress: "Редактировать адрес",
        addPhoneNote: "Если сохраните номер телефона, в разделе \"Мои заказы\" вы увидите и заказы, связанные с этим номером.",
        searchPh: "Ваш номер телефона", savePhone: "Сохранить", phoneSaved: "Номер телефона сохранён",
        order: "Заказ",
        items: "Товары",
        loginTitle: "Войти или зарегистрироваться",
        loginSubtitle: "Введите номер телефона",
        termsText: "Нажимая, вы принимаете условия оферты и соглашаетесь с обработкой персональных данных",
        confirmPhone: "Получить код в Telegram",
        otpSendError: "Имя бота не настроено",
        otpTitle: "Код подтверждения",
        otpSubtitle: "Код отправлен в наш Telegram-бот. Откройте бота и посмотрите код:",
        otpResend: "Открыть Telegram снова",
        otpConfirm: "Подтвердить",
        otpWrong: "Неверный код или истёк срок",
        yourName: "Ваше имя", namePlaceholder: "Введите имя получателя",
        emailLabel: "Электронная почта", emailPlaceholder: "Введите ваш email",
        emailRequired: "Пожалуйста, введите электронную почту",
        applyLabel: "Применить",
      },
      review: {
        btn: "Оставить отзыв", pending: "Ожидает подтверждения", done: "Отзыв отправлен",
        title: "Оставить отзыв", rating: "Ваша оценка", text: "Ваш отзыв",
        textPh: "Напишите ваше мнение о товаре...",
        photo: "Добавить фото (опционально)", uploadBtn: "Выбрать фото", uploading: "Загрузка...",
        submit: "Отправить", submitting: "Отправка...",
        success: "Спасибо! Ваш отзыв отправлен и появится на сайте после проверки.",
        required: "Пожалуйста, напишите отзыв",
      },
    },
    switcher: { admin: "Панель управления", store: "Магазин для клиентов", previewNote: "Демо: в реальном проекте это разные адреса" },
    login: {
      title: "Вход в панель управления", email: "Электронная почта", password: "Пароль",
      submit: "Войти", loading: "Проверка...", wrong: "Неверный email или пароль",
      logout: "Выйти", viewStore: "Посмотреть страницу магазина",
    },
    common: {
      save: "Сохранить", cancel: "Отмена", delete: "Удалить", edit: "Изменить",
      close: "Закрыть", required: "Обязательное поле", uzs: "UZS", ta: "шт",
      confirmDelete: "Вы уверены, что хотите удалить?", saving: "Сохранение...",
      sharedNote: "Эти данные видны всем пользователям",
    },
  },
};

/* ---------------------------------------------------------------
   STORAGE (Firebase Firestore orqali — barcha mijoz va admin
   bir xil ma'lumotni ko'radi)
--------------------------------------------------------------- */
import {
  subscribeCollection, subscribeDoc, addItem, setItem, updateItem, deleteItem,
  findCustomerByPhone, findCustomerByTelegramId, isCollectionEmpty, placeOrderBatch, getCustomersCount, getOrdersCount,
  findPromoCode, incrementPromoCodeUsage,
  findOrdersByTelegramId, findOrdersByPhone, uploadImage, adjustCustomerBonus,
} from "./storage.js";
// MUHIM: T (tarjimalar) va COL (Firestore kolleksiya nomlari) — do'kon
// (StorefrontPage) VA admin panel (AdminApp.jsx, alohida faylda, lazy
// yuklanadi) ikkalasiga ham kerak, shuning uchun shu yerda EXPORT qilinadi.
export const COL = { orders: "orders", customers: "customers", products: "products", categories: "categories", brands: "brands", banners: "banners", testimonials: "testimonials", faqs: "faqs", collections: "collections", billzSync: "billzSync" };

/**
 * Kategoriya sahifasidagi "Filtrlar" oynasi bo'limlari. Faqat `functional: true`
 * belgilangan bo'limlar (hozircha — brend) haqiqiy ma'lumot bilan ishlaydi;
 * qolganlari mahsulot ma'lumotlar bazasida hali mos maydon yo'qligi sababli
 * ro'yxatda ko'rinadi, lekin ochilganda bo'sh — kelajakda shu maydon
 * (masalan "teri turi") mahsulot shakliga qo'shilsa, shu yerda avtomatik
 * ishlaydigan qilib tuzilgan.
 */
const FILTER_DIMENSIONS = [
  { key: "brand", uz: "Brend", ru: "Бренд", functional: true },
  { key: "category", uz: "Kategoriya", ru: "Категория", functional: true },
  { key: "country", uz: "Ishlab chiqarilgan mamlakat", ru: "Страна производства", functional: true },
  { key: "skinType", uz: "Teri turi", ru: "Тип кожи", functional: true },
  { key: "purpose", uz: "Maqsad", ru: "Назначение" },
  { key: "hairType", uz: "Soch turi", ru: "Тип волос" },
  { key: "useArea", uz: "Qo'llash sohasi", ru: "Область применения", functional: true },
  { key: "finish", uz: "Finish", ru: "Финиш" },
  { key: "beautyIngredient", uz: "Go'zallik ingredienti", ru: "Бьюти-ингредиент" },
  { key: "dailyUse", uz: "Kundalik foydalanish uchun", ru: "Для ежедневного применения", functional: true },
  { key: "waterResistant", uz: "Suvga chidamlilik", ru: "Водостойкость" },
  { key: "releaseForm", uz: "Chiqarilish shakli", ru: "Форма выпуска" },
  { key: "compositionFeature", uz: "Tarkib xususiyati", ru: "Особенность состава", functional: true },
  { key: "forWhom", uz: "Kimlar uchun", ru: "Для кого", functional: true },
  { key: "hypoallergenic", uz: "Gipoallergen", ru: "Гипоаллергенно", functional: true },
  { key: "fragranceGroup", uz: "Hid guruhi", ru: "Группа аромата" },
];

/** Mahsulot shaklidagi "qo'shimcha xususiyat" maydonlari — endi haqiqiy ma'lumot bilan filtrlaydi. */
const EXTRA_FILTER_KEYS = ["country", "skinType", "useArea", "compositionFeature", "hypoallergenic", "forWhom", "dailyUse"];

/** Kategoriya sahifasidagi "Saralash" oynasi variantlari. */
const SORT_OPTIONS = [
  { key: "popular", uz: "Eng ommabop mahsulotlar", ru: "Самые популярные товары" },
  { key: "nameAsc", uz: "Nomlanishi bo'yicha (A-Z)", ru: "По названию (А-Я)" },
  { key: "nameDesc", uz: "Nomlanishi bo'yicha (Z-A)", ru: "По названию (Я-А)" },
  { key: "priceAsc", uz: "Narxi bo'yicha (Arzon-Qimmat)", ru: "По цене (Дешевле-Дороже)" },
  { key: "priceDesc", uz: "Narxi bo'yicha (Qimmat-arzon)", ru: "По цене (Дороже-Дешевле)" },
  { key: "newest", uz: "Oxirgi (Eng yangi - Eng eski)", ru: "Сначала новые" },
  { key: "oldest", uz: "Oxirgi (Eng eskisi - Eng yangisi)", ru: "Сначала старые" },
  { key: "rating", uz: "Reyting bo'yicha", ru: "По рейтингу" },
];

import {
  uid, fmtMoney, todayISO, inputCls, Modal, Field, EmptyState, StatusBadge,
  pname, pdesc, discountPct, formatUzPhone, isValidUzPhone, PhoneInput,
  useCarouselRow, Toggle, sortSoldOutLast, useSwipeDownToClose, isSoldOut,
} from "./components/ui.jsx";

/**
 * Bizning /api/telegram-order serverless funksiyamizga so'rov yuboradi.
 * Bot tokeni bu yerda YO'Q — u faqat serverda (Vercel muhit o'zgaruvchisi
 * sifatida) turadi. Bu funksiya xato qaytarsa ham buyurtma Firestore'da
 * saqlangan bo'ladi, shuning uchun xatoni faqat konsolga chiqaramiz.
 */
async function notifyTelegramBot(payload) {
  try {
    const res = await fetch("/api/telegram-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn("Telegram botga xabar yuborilmadi (server javobi):", res.status);
    }
  } catch (e) {
    console.warn("Telegram botga xabar yuborilmadi (tarmoq xatosi):", e);
  }
}

/* ---------------------------------------------------------------
   SMALL UI PRIMITIVES (App.jsx'ga xos, umumiy bo'lmaganlari)
--------------------------------------------------------------- */

/** "Mening profilim" panelida bitta buyurtmani ko'rsatadigan karta. */
function ProfileOrderCard({ order, t, reviewedKeys, onReview }) {
  const fmt = (n) => (Number(n) || 0).toLocaleString("ru-RU");
  const canReview = order.status === "delivered";
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {t.store.profile.order} #{order.id.slice(-6).toUpperCase()}
        </span>
        <StatusBadge status={order.status} labels={t.orders.st} />
      </div>
      <p className="mb-2 text-xs text-slate-400">{order.date}</p>
      {Array.isArray(order.items) && order.items.length > 0 && (
        <div className="mb-2 space-y-1.5">
          {order.items.map((it, idx) => {
            const key = `${order.id}__${it.productId}`;
            const reviewState = reviewedKeys ? reviewedKeys.get(key) : null; // "pending" | "approved" | undefined
            return (
              <div key={idx} className="flex items-center gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-rose-50 text-stone-300">
                  {it.imageUrl ? (
                    <img loading="lazy" src={it.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Package size={16} />
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-xs text-slate-600">
                  {it.productName} × {it.qty}
                </p>
                {canReview && it.productId && (
                  reviewState ? (
                    <span className="shrink-0 whitespace-nowrap text-[11px] text-stone-400">
                      {reviewState === "pending" ? t.store.profile.review.pending : t.store.profile.review.done}
                    </span>
                  ) : (
                    <button
                      onClick={() => onReview && onReview(order, it)}
                      className="shrink-0 whitespace-nowrap rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-100"
                    >
                      {t.store.profile.review.btn}
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">{fmt(order.amount)} {t.common.uzs}</span>
        <span className="text-xs text-slate-500">{t.orders.paymentLabels[order.payment] || order.payment || "—"}</span>
      </div>
      {order.address && <p className="mt-1 truncate text-xs text-slate-400">📍 {order.address}</p>}
    </div>
  );
}

/**
 * Mijoz xarid qilgan mahsulotga sharh (baho + matn + surat, ixtiyoriy) qoldirish
 * oynasi. Yuborilgan sharh darhol saytda ko'rinmaydi — "active: false,
 * status: pending" bilan saqlanadi, admin "Mijoz sharhlari" bo'limida
 * tasdiqlaguncha (active: true) yashirin turadi.
 */
function ReviewFormModal({ order, item, lang, myName, myPhone, testimonialsCount, onClose }) {
  const t = T[lang];
  const rt = t.store.profile.review;
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(`testimonials/${uid()}/photo`, file);
      setImageUrl(url);
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!text.trim()) { setError(rt.required); return; }
    setSaving(true);
    await addItem(COL.testimonials, {
      name: myName || "Mijoz",
      phone: myPhone || "",
      text: text.trim(),
      rating,
      imageUrl,
      productId: item.productId,
      orderId: order.id,
      source: "customer",
      status: "pending",
      active: false,
      order: testimonialsCount || 0,
    });
    setSaving(false);
    setDone(true);
  };

  return (
    <Modal title={rt.title} onClose={onClose}>
      {done ? (
        <div className="py-6 text-center">
          <PartyPopper className="mx-auto mb-3 text-rose-500" size={32} />
          <p className="text-sm text-stone-600">{rt.success}</p>
          <button onClick={onClose} className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
            {t.common.close}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-gray-50 p-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-stone-300">
              {item.imageUrl ? <img loading="lazy" src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={16} />}
            </div>
            <p className="min-w-0 flex-1 truncate text-xs font-medium text-stone-600">{item.productName}</p>
          </div>

          <Field label={rt.rating}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5">
                  <Star size={24} className={n <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"} />
                </button>
              ))}
            </div>
          </Field>

          <Field label={rt.text} error={error}>
            <textarea
              className={`${inputCls} min-h-[90px] resize-y`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={rt.textPh}
            />
          </Field>

          <Field label={rt.photo}>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                  <img loading="lazy" src={imageUrl} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
                {uploading ? rt.uploading : rt.uploadBtn}
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0])} />
              </label>
            </div>
          </Field>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
            <button onClick={submit} disabled={saving || uploading} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null} {saving ? rt.submitting : rt.submit}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}


/**
 * Mahsulot kartochkasidagi "savatga qo'shish" boshqaruvi. Hali savatga
 * qo'shilmagan bo'lsa — oddiy tugma (matn/ikonka `emptyContent` orqali
 * beriladi). Savatda 1+ dona bo'lsa — to'liq kenglikdagi konturli
 * "− son +" steperga aylanadi (barcha kartochkalarda bir xil ko'rinish).
 */
function AddToCartControl({ qty, soldOut, onIncrease, onDecrease, emptyContent, emptyClassName, theme = "light", size = "md" }) {
  const th = theme === "dark"
    ? { border: "border-white/50", text: "text-white", hover: "hover:bg-white/15" }
    : { border: "border-stone-300", text: "text-stone-900", hover: "hover:bg-stone-100" };
  const h = size === "sm" ? "h-9" : "h-10 min-[769px]:h-11";
  const btnSize = size === "sm" ? "h-7 w-7" : "h-8 w-8 min-[769px]:h-9 min-[769px]:w-9";
  if (qty > 0) {
    return (
      <div className={`mt-auto flex ${h} items-center justify-between rounded-full border ${th.border} pl-1 pr-1`}>
        <button
          onClick={onDecrease}
          className={`flex ${btnSize} shrink-0 items-center justify-center rounded-full ${th.text} transition ${th.hover}`}
        >
          <Minus size={size === "sm" ? 13 : 15} />
        </button>
        <span className={`text-sm font-semibold ${th.text}`}>{qty}</span>
        <button
          onClick={onIncrease}
          disabled={soldOut}
          className={`flex ${btnSize} shrink-0 items-center justify-center rounded-full ${th.text} transition ${th.hover} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          <Plus size={size === "sm" ? 13 : 15} />
        </button>
      </div>
    );
  }
  return (
    <button disabled={soldOut} onClick={onIncrease} className={emptyClassName}>
      {emptyContent}
    </button>
  );
}

/* ---------------------------------------------------------------
   CUSTOMER-FACING STOREFRONT
--------------------------------------------------------------- */
function StorefrontPage({ lang, setLang, products, categories, banners, brands, collections, testimonials, faqs, storeSettings, tgUser, inTelegram }) {
  const t = T[lang];
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(t.store.allCategories);
  const [activeBrand, setActiveBrand] = useState(t.store.allBrands);
  const [activeCollection, setActiveCollection] = useState(null);
  // Bannerga biriktirilgan mahsulotlar — banner bosilganda alohida
  // to'liq sahifada (Mega Chegirma sahifasiga o'xshash) ko'rsatiladi.
  const [bannerPageOpen, setBannerPageOpen] = useState(false);
  const [bannerCollection, setBannerCollection] = useState(null);
  // Sevimlilar — brauzerda (localStorage) saqlanadi, mijoz telefoni/Telegram
  // orqali tanilgan bo'lsa Firestore'dagi mijoz yozuviga ham sinxronlanadi
  // (pastdagi "Savat/Sevimlilarni saqlash" effektiga qarang).
  const [wishlist, setWishlist] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("savdo_my_wishlist") || "[]")); } catch { return new Set(); }
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  // "Mega Chegirma" — chegirmadagi barcha mahsulotlar to'liq sahifasi
  const [discountsPageOpen, setDiscountsPageOpen] = useState(false);
  const [discountsSearch, setDiscountsSearch] = useState("");
  const [discountsSort, setDiscountsSort] = useState("default"); // "default" | "priceAsc" | "priceDesc"
  const [discountsFilterOpen, setDiscountsFilterOpen] = useState(false);
  const [discountsCategory, setDiscountsCategory] = useState(null);
  // Kategoriyalar + brendlar to'liq sahifasi (pastki panelning kategoriya tugmasidan ochiladi)
  const [categoriesPageOpen, setCategoriesPageOpen] = useState(false);
  const [categoriesPageTab, setCategoriesPageTab] = useState("categories"); // "categories" | "brands"
  // Qidiruv sahifasi — mobil qidiruv inputiga bosilganda ochiladi, natijalar shu sahifaning o'zida ko'rinadi
  const [searchPageOpen, setSearchPageOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savdo_search_history") || "[]"); } catch { return []; }
  });
  const addSearchHistory = (term) => {
    const val = term.trim();
    if (!val) return;
    setSearchHistory(prev => {
      const next = [val, ...prev.filter(h => h.toLowerCase() !== val.toLowerCase())].slice(0, 8);
      try { localStorage.setItem("savdo_search_history", JSON.stringify(next)); } catch {}
      return next;
    });
  };
  const clearSearchHistory = () => {
    setSearchHistory([]);
    try { localStorage.removeItem("savdo_search_history"); } catch {}
  };
  const pickSearchTerm = (term) => {
    setSearch(term);
    addSearchHistory(term);
  };
  const searchPageLower = search.trim().toLowerCase();
  const searchPageResults = useMemo(() => {
    if (!searchPageLower) return [];
    return sortSoldOutLast(products.filter((p) =>
      pname(p, lang).toLowerCase().includes(searchPageLower) ||
      (p.category || "").toLowerCase().includes(searchPageLower) ||
      (p.brand || "").toLowerCase().includes(searchPageLower)
    ));
  }, [products, searchPageLower, lang]);

  // Kategoriya sahifasi — banner ostidagi "Kategoriyalar" qatoridan bosilganda ochiladi
  // (xuddi shu sahifa "brand" rejimida — "Barcha mahsulotlar" bo'limidagi
  // "Barchasini ko'rish" tugmasi orqali — bitta brendning barcha mahsulotlarini ko'rsatish uchun ham ishlatiladi)
  const [categoryPageOpen, setCategoryPageOpen] = useState(false);
  const [categoryPageMode, setCategoryPageMode] = useState("category"); // "category" | "brand" | "hits"
  const [categoryPageName, setCategoryPageName] = useState(null);
  const [categoryPageSearch, setCategoryPageSearch] = useState("");
  const [categoryPageSort, setCategoryPageSort] = useState("popular");
  const [sortModalOpen, setSortModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  // "UZS Narx" bo'limi filtr oynasi ochilganda darhol (avtomatik) ochiq turishi uchun
  // boshlang'ich qiymat "price" qilib qo'yilgan (boshqa bo'limlar hali yopiq).
  const [filterExpanded, setFilterExpanded] = useState("price");
  // Qo'llanilgan (tasdiqlangan) filtrlar
  const [appliedPriceMin, setAppliedPriceMin] = useState("");
  const [appliedPriceMax, setAppliedPriceMax] = useState("");
  const [appliedBrandFilter, setAppliedBrandFilter] = useState([]);
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState([]);
  // Qo'shimcha xususiyat filtrlari (mamlakat, teri turi va h.k.) — { [key]: string[] }
  const [appliedExtraFilters, setAppliedExtraFilters] = useState({});
  // Filtr oynasidagi qoralama (Tasdiqlash bosilmaguncha kuchga kirmaydi)
  const [draftPriceMin, setDraftPriceMin] = useState("");
  const [draftPriceMax, setDraftPriceMax] = useState("");
  const [draftBrandFilter, setDraftBrandFilter] = useState([]);
  const [draftCategoryFilter, setDraftCategoryFilter] = useState([]);
  const [draftExtraFilters, setDraftExtraFilters] = useState({});

  const openCategoryPage = (name) => {
    setCategoryPageMode("category");
    setCategoryPageName(name);
    setCategoryPageSearch("");
    setCategoryPageSort("popular");
    setAppliedPriceMin(""); setAppliedPriceMax(""); setAppliedBrandFilter([]); setAppliedCategoryFilter([]); setAppliedExtraFilters({});
    setCategoryPageOpen(true);
  };

  const openBrandPage = (name) => {
    setCategoryPageMode("brand");
    setCategoryPageName(name);
    setCategoryPageSearch("");
    setCategoryPageSort("popular");
    setAppliedPriceMin(""); setAppliedPriceMax(""); setAppliedBrandFilter([]); setAppliedCategoryFilter([]); setAppliedExtraFilters({});
    setCategoryPageOpen(true);
  };

  /** "Xit mahsulotlar" (admin "Top" deb belgilagan) — "Barchasini ko'rish" tugmasi shu sahifani ochadi. */
  const openHitsPage = () => {
    setCategoryPageMode("hits");
    setCategoryPageName(t.store.hitProducts);
    setCategoryPageSearch("");
    setCategoryPageSort("popular");
    setAppliedPriceMin(""); setAppliedPriceMax(""); setAppliedBrandFilter([]); setAppliedCategoryFilter([]); setAppliedExtraFilters({});
    setCategoryPageOpen(true);
  };

  const categoryPageObj = useMemo(
    () => categories.find(c => c.name === categoryPageName) || null,
    [categories, categoryPageName]
  );
  const categoryPageHeroImg = categoryPageMode === "brand"
    ? (brands.find(b => b.name === categoryPageName)?.imageUrl || null)
    : categoryPageMode === "hits"
    ? null
    : (categoryPageObj ? itemThumb(categoryPageObj, products, "category") : null);
  const categoryPageProducts = useMemo(() => {
    // "Barchasi" (Hammasi/allBrands yoki allCategories) — bu haqiqiy brend/kategoriya
    // nomi emas, balki "filtrlamasdan hammasini ko'rsat" degan maxsus belgi.
    // Shuni literal qiymat sifatida solishtirsak — hech qanday mahsulot mos kelmay,
    // sahifa bo'sh chiqib qolardi (aynan shu xatolik "Barchasi" sahifasida yuz bergan edi).
    if (categoryPageMode === "hits") {
      return products.filter(p => p.tag === "bestseller");
    }
    if (categoryPageMode === "brand") {
      return categoryPageName === t.store.allBrands ? products : products.filter(p => p.brand === categoryPageName);
    }
    return categoryPageName === t.store.allCategories ? products : products.filter(p => p.category === categoryPageName);
  }, [products, categoryPageName, categoryPageMode, t]);
  const categoryPagePriceBounds = useMemo(() => {
    const vals = categoryPageProducts.map(p => Number(p.price) || 0);
    return { min: vals.length ? Math.min(...vals) : 0, max: vals.length ? Math.max(...vals) : 0 };
  }, [categoryPageProducts]);
  const categoryPageBrands = useMemo(
    () => Array.from(new Set(categoryPageProducts.map(p => p.brand).filter(Boolean))),
    [categoryPageProducts]
  );
  const categoryPageCategories = useMemo(
    () => Array.from(new Set(categoryPageProducts.map(p => p.category).filter(Boolean))),
    [categoryPageProducts]
  );
  // Har bir qo'shimcha xususiyat (mamlakat, teri turi va h.k.) uchun shu sahifadagi
  // mahsulotlarda uchraydigan noyob qiymatlar ro'yxati — checkbox variantlari sifatida.
  const categoryPageExtraOptions = useMemo(() => {
    const map = {};
    for (const key of EXTRA_FILTER_KEYS) {
      map[key] = Array.from(new Set(categoryPageProducts.map(p => p[key]).filter(Boolean)));
    }
    return map;
  }, [categoryPageProducts]);
  const categoryPageResults = useMemo(() => {
    const q = categoryPageSearch.trim().toLowerCase();
    let list = categoryPageProducts.filter(p => {
      const nameMatch = !q || pname(p, lang).toLowerCase().includes(q) || (p.brand || "").toLowerCase().includes(q);
      const minOk = !appliedPriceMin || (Number(p.price) || 0) >= Number(appliedPriceMin);
      const maxOk = !appliedPriceMax || (Number(p.price) || 0) <= Number(appliedPriceMax);
      const brandOk = appliedBrandFilter.length === 0 || appliedBrandFilter.includes(p.brand);
      const categoryOk = appliedCategoryFilter.length === 0 || appliedCategoryFilter.includes(p.category);
      const extraOk = EXTRA_FILTER_KEYS.every((key) => {
        const selected = appliedExtraFilters[key];
        return !selected || selected.length === 0 || selected.includes(p[key]);
      });
      return nameMatch && minOk && maxOk && brandOk && categoryOk && extraOk;
    });
    list = [...list];
    if (categoryPageSort === "nameAsc") list.sort((a, b) => pname(a, lang).localeCompare(pname(b, lang)));
    else if (categoryPageSort === "nameDesc") list.sort((a, b) => pname(b, lang).localeCompare(pname(a, lang)));
    else if (categoryPageSort === "priceAsc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (categoryPageSort === "priceDesc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (categoryPageSort === "newest") list.reverse();
    else if (categoryPageSort === "rating") list.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    // "popular" va "oldest" — asl tartibda qoladi
    // Qoldiq tugagan mahsulotlar — tanlangan saralashdan qat'i nazar ro'yxat oxiriga tushadi.
    return sortSoldOutLast(list);
  }, [categoryPageProducts, categoryPageSearch, categoryPageSort, appliedPriceMin, appliedPriceMax, appliedBrandFilter, appliedCategoryFilter, appliedExtraFilters, lang]);

  const openFilterModal = () => {
    setDraftPriceMin(appliedPriceMin); setDraftPriceMax(appliedPriceMax); setDraftBrandFilter(appliedBrandFilter); setDraftCategoryFilter(appliedCategoryFilter);
    setDraftExtraFilters(appliedExtraFilters);
    setFilterExpanded("price");
    setFilterModalOpen(true);
  };
  const applyFilters = () => {
    setAppliedPriceMin(draftPriceMin); setAppliedPriceMax(draftPriceMax); setAppliedBrandFilter(draftBrandFilter); setAppliedCategoryFilter(draftCategoryFilter);
    setAppliedExtraFilters(draftExtraFilters);
    setFilterModalOpen(false);
  };
  const toggleDraftBrand = (name) => {
    setDraftBrandFilter(prev => prev.includes(name) ? prev.filter(b => b !== name) : [...prev, name]);
  };
  const toggleDraftCategory = (name) => {
    setDraftCategoryFilter(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };
  const toggleDraftExtra = (key, value) => {
    setDraftExtraFilters(prev => {
      const cur = prev[key] || [];
      const next = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  };
  const activeFilterCount = (appliedPriceMin ? 1 : 0) + (appliedPriceMax ? 1 : 0) + appliedBrandFilter.length + appliedCategoryFilter.length +
    Object.values(appliedExtraFilters).reduce((s, arr) => s + (arr ? arr.length : 0), 0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileView, setProfileView] = useState("menu"); // "menu" | "personal" | "orders" | "addresses"
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);

  // Telegram botidagi "📦 Mening buyurtmalarim" tugmasi (?view=orders bilan
  // ochiladi) bosilganda ilova to'g'ridan-to'g'ri profil/buyurtmalar
  // bo'limini ochib yuborishi uchun — sahifa birinchi ochilganda bir marta
  // URL manzilidagi "view" parametrini tekshiradi.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get("view");
      if (view === "orders") {
        setProfileOpen(true);
        setProfileView("orders");
      } else if (view === "profile") {
        setProfileOpen(true);
      }
    } catch {
      // URL o'qilmasa ham (masalan eski brauzer) — oddiy ochilishga xalaqit bermaydi
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // SEO: to'g'ridan-to'g'ri /product/<id> manziliga o'tilganda (masalan
  // Google qidiruvidan yoki ulashilgan havoladan) — o'sha mahsulotni
  // avtomatik ochib beradi. Faqat BIR MARTA ishlaydi (openedFromUrlRef);
  // "products" ro'yxati Firestore'dan asinxron kelgani uchun bir nechta
  // marta qayta tekshiradi, mahsulot topilgach to'xtaydi.
  const openedFromUrlRef = useRef(false);
  useEffect(() => {
    if (openedFromUrlRef.current) return;
    const m = window.location.pathname.match(/^\/product\/([^/]+)\/?$/);
    if (!m) { openedFromUrlRef.current = true; return; }
    const found = products.find((p) => p.id === m[1]);
    if (found) {
      openedFromUrlRef.current = true;
      setSelectedProduct(found);
    }
  }, [products]);
  // SEO: mahsulot ochilganda/yopilganda sahifa sarlavhasi (<title>),
  // qidiruv tavsifi (<meta name="description">) va canonical havolasini
  // shu mahsulotga moslab yangilaydi — yopilganda esa asl (bosh sahifa)
  // qiymatlariga qaytaradi. Bu Google'ga har bir mahsulot sahifasi uchun
  // to'g'ri sarlavha/tavsif ko'rsatish imkonini beradi.
  useEffect(() => {
    const canonicalHref = selectedProduct
      ? `https://casme.uz/product/${selectedProduct.id}`
      : "https://casme.uz/";
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", canonicalHref);

    let descTag = document.querySelector('meta[name="description"]');
    if (!descTag) {
      descTag = document.createElement("meta");
      descTag.setAttribute("name", "description");
      document.head.appendChild(descTag);
    }

    if (selectedProduct) {
      const name = pname(selectedProduct, lang);
      document.title = `${name} — CASME`;
      const desc = (pdesc(selectedProduct, lang) || "").slice(0, 160) || `${name} — CASME'da original mahsulotlar.`;
      descTag.setAttribute("content", desc);
    } else {
      document.title = "CASME";
      descTag.setAttribute("content", "Original Koreya kosmetikasi qulay narxlarda.");
    }
  }, [selectedProduct, lang]);
  // Xarid qilingan mahsulotga sharh qoldirish oynasi — { order, item } yoki null.
  const [reviewModal, setReviewModal] = useState(null);
  // Har bir (buyurtma + mahsulot) juftligi uchun mijoz allaqachon sharh qoldirganmi va u qanday holatda ekanini bilish uchun.
  const reviewedKeys = useMemo(() => {
    const map = new Map();
    (testimonials || []).forEach((x) => {
      if (x.orderId && x.productId) map.set(`${x.orderId}__${x.productId}`, x.status === "pending" ? "pending" : "approved");
    });
    return map;
  }, [testimonials]);
  // Telefon raqamini brauzerda saqlaymiz (localStorage) — shu orqali
  // Telegram tashqarisidagi mijoz ham keyingi safar "Buyurtmalarim"ni ko'radi.
  const [myPhone, setMyPhone] = useState(() => {
    try { return localStorage.getItem("savdo_my_phone") || ""; } catch { return ""; }
  });
  const [phoneInput, setPhoneInput] = useState(myPhone);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  // Yetkazib berish manzillari — bir nechta manzil, har biriga xohlasa
  // joylashuv (lat/lng) ham biriktirilishi mumkin. Brauzerda va (telefon
  // bog'langan bo'lsa) mijoz yozuvida (Firestore) saqlanadi.
  const [myAddresses, setMyAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savdo_my_addresses") || "[]"); } catch { return []; }
  });
  const [addressFormOpen, setAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // null = yangi qo'shish, aks holda tahrirlash
  const [newAddressText, setNewAddressText] = useState("");
  const [newAddressLocation, setNewAddressLocation] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [showAddressMap, setShowAddressMap] = useState(false);
  const [showCheckoutMap, setShowCheckoutMap] = useState(false);
  // "Shaxsiy ma'lumotlar" bo'limidagi ism va email — xuddi telefon/manzil
  // kabi brauzerda va (agar telefon bog'langan bo'lsa) mijoz yozuvida saqlanadi.
  const [myName, setMyName] = useState(() => {
    try { return localStorage.getItem("savdo_my_name") || ""; } catch { return ""; }
  });
  const [myEmail, setMyEmail] = useState(() => {
    try { return localStorage.getItem("savdo_my_email") || ""; } catch { return ""; }
  });
  const [editField, setEditField] = useState(null); // null | "name" | "email"
  const [editInput, setEditInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const openEditModal = (field) => {
    setEditField(field);
    setEditInput(field === "name" ? myName : myEmail);
  };
  const saveEditField = async () => {
    const value = editInput.trim();
    if (!value) return;
    setSavingEdit(true);
    try {
      if (editField === "name") {
        try { localStorage.setItem("savdo_my_name", value); } catch {}
        setMyName(value);
        setForm(f => ({ ...f, name: value }));
      } else if (editField === "email") {
        try { localStorage.setItem("savdo_my_email", value); } catch {}
        setMyEmail(value);
      }
      if (myPhone) {
        const existing = await findCustomerByPhone(myPhone);
        if (existing) {
          await updateItem(COL.customers, existing.id, editField === "name" ? { name: value } : { email: value });
        }
      }
      setEditField(null);
    } catch (e) {
      console.error("Ma'lumotni saqlashda xatolik:", e);
    }
    setSavingEdit(false);
  };
  // Footer'dagi "Bizga ishongan mijozlar" / "Bajarilgan buyurtmalar" — boshlang'ich
  // (marketing) son + Firestore'dagi haqiqiy o'sish. Shu tufayli har yangi
  // ro'yxatdan o'tgan mijoz va har yangi buyurtma bilan raqam tabiiy o'sib boradi.
  const CUSTOMERS_BASE = 3125;
  const ORDERS_BASE = 8752;
  const [customersCount, setCustomersCount] = useState(CUSTOMERS_BASE);
  const [ordersCount, setOrdersCount] = useState(ORDERS_BASE);
  useEffect(() => {
    getCustomersCount().then((n) => setCustomersCount(CUSTOMERS_BASE + (n || 0)));
    getOrdersCount().then((n) => setOrdersCount(ORDERS_BASE + (n || 0)));
  }, []);
  // Mijozning bonus balansi (banner ustida ko'rsatish uchun) — Telegram
  // ID yoki saqlangan telefon raqami bo'yicha Firestore'dan olinadi.
  const [myBonus, setMyBonus] = useState(0);
  // Ro'yxatdan o'tgan (telefon tasdiqlangan yoki Telegram orqali tanilgan)
  // mijozning Firestore'dagi yozuv ID'si — savat/sevimlilarni o'sha yozuvga
  // saqlash uchun ishlatiladi (pastdagi sinxronlash effektiga qarang).
  const [myCustomerId, setMyCustomerId] = useState(null);
  // Bir vaqtda ikki marta mijoz yozuvi yaratib yubormaslik uchun himoya
  // (effekt bir necha marta ishga tushishi mumkin, masalan profil ochilib-yopilganda).
  const creatingTgCustomerRef = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        let customer = null;
        if (tgUser?.id) customer = await findCustomerByTelegramId(tgUser.id);
        if (!customer && myPhone) customer = await findCustomerByPhone(myPhone);

        // Telegram orqali kirgan, lekin Firestore'da hali hech qanday yozuvi
        // bo'lmagan (birinchi marta kirgan) mijozga BIR MARTALIK "xush kelibsiz"
        // bonusini (20 000 so'm) DARHOL beramiz — buyurtma berishini yoki
        // telefon qo'shishini kutib o'tirmaymiz, chunki Telegram identifikatsiyasi
        // (haqiqiy foydalanuvchi ekanini) o'zi yetarli tasdiq hisoblanadi.
        if (!customer && tgUser?.id && !creatingTgCustomerRef.current) {
          creatingTgCustomerRef.current = true;
          try {
            const docRef = await addItem(COL.customers, {
              name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
              phone: "",
              telegramUserId: tgUser.id,
              telegramFirstName: tgUser.first_name || "",
              telegramUsername: tgUser.username || "",
              address: "", orders: 0, spent: 0, date: todayISO(),
              bonusPoints: 20000, // Telegram orqali ro'yxatdan o'tgan mijozga bir martalik xush kelibsiz bonusi
            });
            customer = { id: docRef.id, bonusPoints: 20000 };
          } catch (e) {
            console.error("Telegram mijozini avtomatik yaratishda xatolik:", e);
          }
        }

        if (!cancelled) {
          setMyBonus(customer ? Number(customer.bonusPoints) || 0 : 0);
          setMyCustomerId(customer?.id || null);
          if (customer?.name && !myName) { setMyName(customer.name); try { localStorage.setItem("savdo_my_name", customer.name); } catch {} }
          if (customer?.email && !myEmail) { setMyEmail(customer.email); try { localStorage.setItem("savdo_my_email", customer.email); } catch {} }
          if (Array.isArray(customer?.addresses) && customer.addresses.length > 0 && myAddresses.length === 0) {
            setMyAddresses(customer.addresses);
            try { localStorage.setItem("savdo_my_addresses", JSON.stringify(customer.addresses)); } catch {}
          }
          // Mijozning Firestore'da saqlangan savati/sevimlilari bor va
          // shu qurilmada hali mahalliy nusxasi bo'sh bo'lsa — o'shani tortib olamiz
          // (masalan boshqa qurilmadan yoki brauzer tozalangandan keyin kirganda).
          if (Array.isArray(customer?.wishlist) && customer.wishlist.length > 0 && wishlist.size === 0) {
            setWishlist(new Set(customer.wishlist));
            try { localStorage.setItem("savdo_my_wishlist", JSON.stringify(customer.wishlist)); } catch {}
          }
          if (customer?.cart && typeof customer.cart === "object" && Object.keys(customer.cart).length > 0 && Object.keys(cart).length === 0) {
            setCart(customer.cart);
            try { localStorage.setItem("savdo_my_cart", JSON.stringify(customer.cart)); } catch {}
          }
        }
      } catch {
        if (!cancelled) setMyBonus(0);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [tgUser, myPhone, phoneSaved, profileOpen]);
  const avgRating = useMemo(() => {
    const rated = products.filter(p => Number(p.rating) > 0);
    if (!rated.length) return 0;
    return rated.reduce((s, p) => s + Number(p.rating), 0) / rated.length;
  }, [products]);
  // Savat — brauzerda (localStorage) saqlanadi, mijoz telefoni/Telegram
  // orqali tanilgan bo'lsa Firestore'dagi mijoz yozuviga ham sinxronlanadi
  // (pastdagi "Savat/Sevimlilarni saqlash" effektiga qarang). Shu tufayli
  // mijoz sahifani yopib qaytib kirsa yoki boshqa qurilmadan kirsa ham,
  // o'zi olib tashlamagan mahsulotlar savatda/sevimlilarda qolaveradi.
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savdo_my_cart") || "{}"); } catch { return {}; }
  }); // productId -> qty

  // Savat/Sevimlilarni saqlash — har bir o'zgarishda darhol brauzerda
  // (localStorage) saqlanadi, mijoz telefoni/Telegram orqali tanilgan bo'lsa
  // (myCustomerId mavjud) — Firestore'dagi mijoz yozuviga ham (biroz kechikib,
  // ortiqcha yozuvlarning oldini olish uchun) yoziladi. Shu tufayli mijoz
  // mahsulotni o'zi olib tashlamaguncha savat/sevimlilarda saqlanib qoladi.
  useEffect(() => {
    try { localStorage.setItem("savdo_my_cart", JSON.stringify(cart)); } catch {}
    if (!myCustomerId) return;
    const timer = setTimeout(() => {
      updateItem(COL.customers, myCustomerId, { cart }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [cart, myCustomerId]);

  useEffect(() => {
    const wishlistArr = Array.from(wishlist);
    try { localStorage.setItem("savdo_my_wishlist", JSON.stringify(wishlistArr)); } catch {}
    if (!myCustomerId) return;
    const timer = setTimeout(() => {
      updateItem(COL.customers, myCustomerId, { wishlist: wishlistArr }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [wishlist, myCustomerId]);
  // Har bir mahsulot qaysi kolleksiya orqali savatga tushgani (savatda
  // guruhlab, kolleksiya nomi bilan ko'rsatish uchun). productId -> kolleksiya nomi.
  const [cartCollectionTags, setCartCollectionTags] = useState({});
  // Faqat "Keng banner" orqali kirib qo'shilgan mahsulotlarga tegishli
  // chegirma foizi. productId -> foiz. Mahsulotning o'zidagi narxi
  // (product.price) o'zgarmaydi — chegirma faqat shu savat elementining
  // yakuniy summasiga (cartTotal) qo'llanadi, boshqa joyda (mahsulot
  // sahifasi, boshqa bo'limlar) ko'rinmaydi.
  const [cartItemDiscounts, setCartItemDiscounts] = useState({});
  const [expandedCartGroups, setExpandedCartGroups] = useState(new Set());
  const popularRowRef = useRef(null);
  const scrollPopularPrev = () => popularRowRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollPopularNext = () => popularRowRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  const { viewportRef: discountViewportRef, scrollPrev: scrollDiscountPrev, scrollNext: scrollDiscountNext } = useCarouselRow();
  const { viewportRef: catalogViewportRef, scrollPrev: scrollCatalogPrev, scrollNext: scrollCatalogNext } = useCarouselRow();
  const { viewportRef: brandViewportRef, scrollPrev: scrollBrandPrev, scrollNext: scrollBrandNext } = useCarouselRow();
  const [cartOpen, setCartOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("home");
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otpStep, setOtpStep] = useState("phone"); // "phone" | "code"
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");
  // Telefon OTP ekrani QAYERDAN ochilganini eslab qoladi: "profile" (Profil
  // tugmasi bosilganda) yoki "checkout" (Rasmiylashtirish bosilganda) —
  // tasdiqlash muvaffaqiyatli o'tgach, mos ekranga (profil yoki to'g'ridan
  // to'g'ri checkout) o'tkazish uchun kerak.
  const [loginIntent, setLoginIntent] = useState("profile");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", phone2: "", payment: "cash", address: "" });
  const [showPhone2, setShowPhone2] = useState(false);
  const [location, setLocation] = useState(null); // {lat, lng}
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  // ---------------------------------------------------------------
  // "Ortga qaytish" navigatsiyasi — mahsulot kartochkasi, savat,
  // profil, qidiruv, kategoriya/brend/xit/chegirma sahifalari va h.k.
  // ochilganda brauzer tarixiga bittadan qatlam qo'shiladi. Mijoz
  // qaysi joydan (bo'limdan) ochgan bo'lsa, "orqaga" bosilganda
  // (brauzer/telefon orqaga tugmasi, Telegramning BackButton'i yoki
  // shu oynadagi X/pastga tortish) faqat o'sha bitta qatlam yopiladi —
  // butun sahifa boshiga (asosiy sahifaga) chiqib ketmaydi.
  // ---------------------------------------------------------------
  const navStackRef = useRef([]); // ochiq qatlamlar tartibda (eng oxirgisi — eng tepadagisi)
  const navPrevRef = useRef({});
  const popGuardRef = useRef(0); // o'zimiz history.back() chaqirganda kelgan popstate'larni e'tiborsiz qoldirish uchun

  const navLayers = useMemo(() => ({
    selectedProduct: { open: !!selectedProduct, close: () => setSelectedProduct(null) },
    checkoutOpen: { open: checkoutOpen, close: () => setCheckoutOpen(false) },
    cartOpen: { open: cartOpen, close: () => setCartOpen(false) },
    wishlistOpen: { open: wishlistOpen, close: () => setWishlistOpen(false) },
    profileOpen: { open: profileOpen, close: () => setProfileOpen(false) },
    bannerPageOpen: { open: bannerPageOpen, close: () => { setBannerPageOpen(false); setBannerCollection(null); } },
    categoryPageOpen: { open: categoryPageOpen, close: () => setCategoryPageOpen(false) },
    discountsPageOpen: { open: discountsPageOpen, close: () => setDiscountsPageOpen(false) },
    categoriesPageOpen: { open: categoriesPageOpen, close: () => setCategoriesPageOpen(false) },
    searchPageOpen: { open: searchPageOpen, close: () => setSearchPageOpen(false) },
  }), [selectedProduct, checkoutOpen, cartOpen, wishlistOpen, profileOpen, bannerPageOpen, categoryPageOpen, discountsPageOpen, categoriesPageOpen, searchPageOpen]);

  // Har bir qatlam ochilganda/yopilganda brauzer tarixini shunga moslab yangilaydi.
  useEffect(() => {
    if (popGuardRef.current > 0) {
      // Bu o'zgarish popstate (orqaga tugmasi) tufayli sodir bo'ldi — tarixga qayta ta'sir qilmaymiz.
      popGuardRef.current -= 1;
      navPrevRef.current = Object.fromEntries(Object.entries(navLayers).map(([k, v]) => [k, v.open]));
      return;
    }
    for (const key of Object.keys(navLayers)) {
      const isOpen = navLayers[key].open;
      const wasOpen = !!navPrevRef.current[key];
      if (isOpen && !wasOpen) {
        navStackRef.current.push(key);
        // "selectedProduct" qatlami uchun — brauzer manzilini haqiqiy,
        // to'g'ridan-to'g'ri ochiladigan mahsulot URL'iga o'zgartiramiz
        // (SEO va ulashish uchun). Boshqa qatlamlar (savat, checkout va h.k.)
        // manzilni o'zgartirmaydi — ular alohida indekslanadigan sahifa emas.
        if (key === "selectedProduct" && selectedProduct) {
          window.history.pushState({ navLayer: key }, "", `/product/${selectedProduct.id}`);
        } else {
          window.history.pushState({ navLayer: key }, "");
        }
      } else if (!isOpen && wasOpen) {
        const idx = navStackRef.current.lastIndexOf(key);
        if (idx !== -1) {
          navStackRef.current.splice(idx, 1);
          popGuardRef.current += 1;
          window.history.back();
        }
      }
    }
    navPrevRef.current = Object.fromEntries(Object.entries(navLayers).map(([k, v]) => [k, v.open]));
  }, [navLayers]);

  // Brauzer/telefonning "orqaga" gesti yoki tugmasi bosilganda — faqat eng tepadagi qatlamni yopadi.
  useEffect(() => {
    const onPopState = () => {
      if (popGuardRef.current > 0) {
        popGuardRef.current -= 1;
        return;
      }
      const topKey = navStackRef.current[navStackRef.current.length - 1];
      if (!topKey) return; // ochiq qatlam yo'q — brauzerning odatiy xatti-harakati davom etadi
      navStackRef.current.pop();
      popGuardRef.current += 1;
      navLayers[topKey]?.close();
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [navLayers]);

  // Telegram Mini App ichida bo'lsak — Telegramning o'z BackButton'ini ham
  // shu qatlamlar bilan bog'laymiz (aks holda tizim "orqaga"si to'g'ridan-to'g'ri
  // Mini App'ni yopib yuboradi). Tugma bosilganda faqat tegishli qatlamni
  // yopamiz — tarixni yangilash ishi yuqoridagi asosiy effekt zimmasida
  // (xuddi oddiy X tugmasi bosilgandagidek), shu bilan ikki marta orqaga
  // ketib qolish xavfi bo'lmaydi.
  useEffect(() => {
    const tg = getWebApp();
    // BackButton Telegram SDK'sining 6.1+ versiyasida bor. Brauzerda (Telegram
    // tashqarisida) ochilganda SDK "6.0" deb ko'rsatadi va bu metodlar
    // chaqirilsa konsolga keraksiz ogohlantirish chiqadi — shuning uchun
    // avval versiyani tekshiramiz.
    if (!tg || !tg.BackButton || !tg.isVersionAtLeast?.("6.1")) return;
    const hasLayer = navStackRef.current.length > 0;
    if (hasLayer) tg.BackButton.show(); else tg.BackButton.hide();
    const handler = () => {
      const topKey = navStackRef.current[navStackRef.current.length - 1];
      navLayers[topKey]?.close();
    };
    tg.BackButton.onClick(handler);
    return () => { try { tg.BackButton.offClick(handler); } catch {} };
  }, [navLayers]);

  // Savat / Sevimlilar / Profil — mahsulot kartochkasi kabi pastdan chiqadigan
  // varaq ko'rinishida ochiladi, tutqichdan pastga tortib ham yopish mumkin.
  const wishlistSwipe = useSwipeDownToClose(() => setWishlistOpen(false));
  const cartSwipe = useSwipeDownToClose(() => setCartOpen(false));
  const profileSwipe = useSwipeDownToClose(() => setProfileOpen(false));

  // Eslatma: avval shu yerda "varaq ochiq turganda orqadagi sahifa scroll
  // bo'lmasin" degan maqsadda body/html'ga overflow:hidden qo'yilgan edi.
  // Lekin bu ba'zi telefonlarda sahifani scroll qilingan joydan tepaga
  // "sakratib" yuborar ekan (varaq orqasida har doim bosh sahifaning boshi
  // ko'rinib qolar edi, foydalanuvchi qayerda turgan bo'lsa ham). Bu ancha
  // jiddiy va ko'zga tashlanadigan nosozlik bo'lgani uchun scroll qulfini
  // butunlay olib tashladik — endi varaq orqasida FOYDALANUVCHI QAYERDA
  // TURGAN BO'LSA O'SHA JOY ko'rinadi (bu muhimroq).

  // Ism avtomatik to'ldiriladi — Telegram ichida bo'lsa Telegramdagi ism,
  // aks holda profilda saqlangan ism (myName) ishlatiladi. Foydalanuvchi
  // kerak bo'lsa o'zi qayta o'zgartira oladi.
  useEffect(() => {
    const fullName = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : myName;
    if (fullName) setForm(f => (f.name ? f : { ...f, name: fullName }));
  }, [tgUser, myName]);

  // Saqlangan telefon raqami bo'lsa, checkout formadagi telefonni ham avtomatik to'ldiramiz.
  useEffect(() => {
    if (myPhone) setForm(f => (f.phone ? f : { ...f, phone: myPhone }));
  }, [myPhone]);

  // Saqlangan manzillar bo'lsa, checkout formadagi manzilni birinchi
  // saqlangan manzil bilan avtomatik to'ldiramiz (mijoz xohlasa o'zi tanlaydi).
  useEffect(() => {
    if (myAddresses.length > 0) {
      setForm(f => (f.address ? f : { ...f, address: myAddresses[0].text }));
      if (myAddresses[0].lat != null && myAddresses[0].lng != null) {
        setLocation(prev => prev || { lat: myAddresses[0].lat, lng: myAddresses[0].lng });
      }
    }
  }, [myAddresses]);

  // SEO — sayt sarlavhasi va qisqa tavsifini Sozlamalarda kiritilgan
  // qiymatlar bilan yangilaymiz (Google va boshqa qidiruv tizimlari uchun).
  useEffect(() => {
    if (storeSettings?.seoTitle) {
      document.title = storeSettings.seoTitle;
    } else if (storeSettings?.storeName) {
      document.title = storeSettings.storeName;
    }
    if (storeSettings?.seoDescription) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", storeSettings.seoDescription);
    }
    if (storeSettings?.seoKeywords) {
      let meta = document.querySelector('meta[name="keywords"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "keywords");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", storeSettings.seoKeywords);
    }
    // Brauzer tab'idagi ikonka (favicon) — standart "globus" o'rniga
    // Sozlamalarda yuklangan do'kon logotipini qo'yamiz.
    if (storeSettings?.logoUrl) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "icon");
        document.head.appendChild(link);
      }
      link.setAttribute("href", storeSettings.logoUrl);
    }
  }, [storeSettings?.seoTitle, storeSettings?.seoDescription, storeSettings?.seoKeywords, storeSettings?.storeName, storeSettings?.logoUrl]);

  // Facebook (Meta) Pixel — Sozlamalarda kiritilgan Pixel ID bo'lsa,
  // rasmiy Facebook skriptini (fbevents.js) bir marta yuklab, initsializatsiya
  // qilamiz. Shundan keyin pastdagi trackPixel() orqali ViewContent/AddToCart/
  // InitiateCheckout/Purchase voqealarini yuboramiz — reklamalar shu orqali
  // haqiqiy xaridlarni ko'radi va ularga optimallashadi.
  useEffect(() => {
    const pixelId = storeSettings?.fbPixelId;
    if (!pixelId) return;
    if (!window._fbPixelInitedIds) window._fbPixelInitedIds = new Set();
    if (window._fbPixelInitedIds.has(pixelId)) return;

    if (!window.fbq) {
      /* eslint-disable */
      (function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = true; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      /* eslint-enable */
    }
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    window._fbPixelInitedIds.add(pixelId);
  }, [storeSettings?.fbPixelId]);

  /** Facebook Pixel voqeasini yuboradi (Pixel sozlanmagan bo'lsa — jim o'tib ketadi). */
  const trackPixel = (eventName, params) => {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq("track", eventName, params);
    }
  };

  // Facebook Pixel: mijoz mahsulot sahifasini (kartochkasini) ochganda —
  // "ViewContent" voqeasini yuboramiz.
  useEffect(() => {
    if (!selectedProduct) return;
    trackPixel("ViewContent", {
      content_name: pname(selectedProduct, lang),
      content_ids: [selectedProduct.id],
      content_type: "product",
      value: Number(selectedProduct.price) || 0,
      currency: "UZS",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct]);

  // Profil oynasi ochilganda — "Buyurtmalarim"ni yuklaymiz:
  // avval Telegram ID bo'yicha, u bo'lmasa (Telegram tashqarisida
  // ochilgan bo'lsa) — saqlangan telefon raqami bo'yicha.
  useEffect(() => {
    if (!profileOpen) return;
    setMyOrdersLoading(true);
    const run = async () => {
      try {
        let list = [];
        if (tgUser?.id) {
          list = await findOrdersByTelegramId(tgUser.id);
        } else if (myPhone) {
          list = await findOrdersByPhone(myPhone);
        }
        setMyOrders(list);
      } catch (e) {
        console.error("Buyurtmalarni yuklashda xatolik:", e);
        setMyOrders([]);
      }
      setMyOrdersLoading(false);
    };
    run();
  }, [profileOpen, tgUser, myPhone]);

  /**
   * Profildagi "Telefon raqamni qo'shish" tugmasi. Telefonni Firestore
   * `customers` kolleksiyasida saqlaydi:
   *  - Agar shu raqam bilan mijoz allaqachon mavjud bo'lsa (masalan
   *    avval buyurtma bergan) — Telegramdan kelgan bo'lsa, shu mijoz
   *    yozuviga Telegram identifikatsiyasini ham bog'laymiz.
   *  - Aks holda, yangi mijoz yozuvi yaratamiz.
   */
  const saveMyPhone = async () => {
    if (!isValidUzPhone(phoneInput)) return;
    const phone = phoneInput;
    setSavingPhone(true);
    try {
      const existing = await findCustomerByPhone(phone);
      if (existing) {
        if (tgUser) {
          await updateItem(COL.customers, existing.id, {
            telegramUserId: tgUser.id,
            telegramFirstName: tgUser.first_name || "",
            telegramUsername: tgUser.username || "",
          });
        }
      } else {
        await addItem(COL.customers, {
          phone,
          name: tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : "",
          telegramUserId: tgUser?.id || null,
          telegramFirstName: tgUser?.first_name || null,
          telegramUsername: tgUser?.username || null,
          address: "", orders: 0, spent: 0, date: todayISO(),
          bonusPoints: 20000, // Yangi mijozga xush kelibsiz bonusi
        });
      }
      try { localStorage.setItem("savdo_my_phone", phone); } catch {}
      setMyPhone(phone);
      setPhoneSaved(true);
      setTimeout(() => setPhoneSaved(false), 2500);
    } catch (e) {
      console.error("Telefonni saqlashda xatolik:", e);
    }
    setSavingPhone(false);
  };


  /** Manzil qo'shish formasini ochadi — parametr berilsa (mavjud manzil)
   *  tahrirlash rejimida, aks holda yangi manzil qo'shish rejimida ochiladi. */
  const openAddressForm = (addr) => {
    if (addr) {
      setEditingAddressId(addr.id);
      setNewAddressText(addr.text || "");
      setNewAddressLocation(addr.lat != null && addr.lng != null ? { lat: addr.lat, lng: addr.lng } : null);
    } else {
      setEditingAddressId(null);
      setNewAddressText("");
      setNewAddressLocation(null);
    }
    setShowAddressMap(false);
    setAddressFormOpen(true);
  };

  const closeAddressForm = () => {
    setAddressFormOpen(false);
    setEditingAddressId(null);
    setNewAddressText("");
    setNewAddressLocation(null);
    setShowAddressMap(false);
  };

  /** Yangi manzilni ro'yxatga qo'shadi yoki (tahrirlash rejimida bo'lsa)
   *  mavjud manzilni yangilaydi — telefon bilan bog'liq mijoz yozuviga
   *  (Firestore) va localStorage'ga saqlaydi. Bir nechta manzil saqlanishi
   *  mumkin, buyurtma berishda mijoz shulardan birini tanlaydi. */
  const saveMyAddress = async () => {
    if (!newAddressText.trim()) return;
    setSavingAddress(true);
    try {
      const addrData = {
        text: newAddressText.trim(),
        lat: newAddressLocation?.lat ?? null,
        lng: newAddressLocation?.lng ?? null,
      };
      const nextAddresses = editingAddressId
        ? myAddresses.map(a => (a.id === editingAddressId ? { ...a, ...addrData } : a))
        : [...myAddresses, { id: uid(), ...addrData }];
      if (myPhone) {
        const existing = await findCustomerByPhone(myPhone);
        if (existing) {
          await updateItem(COL.customers, existing.id, { addresses: nextAddresses, address: addrData.text });
        }
      }
      try { localStorage.setItem("savdo_my_addresses", JSON.stringify(nextAddresses)); } catch {}
      setMyAddresses(nextAddresses);
      closeAddressForm();
    } catch (e) {
      console.error("Manzilni saqlashda xatolik:", e);
    }
    setSavingAddress(false);
  };

  /** Saqlangan manzillar ro'yxatidan birini o'chiradi. */
  const deleteMyAddress = async (id) => {
    const nextAddresses = myAddresses.filter(a => a.id !== id);
    try {
      if (myPhone) {
        const existing = await findCustomerByPhone(myPhone);
        if (existing) await updateItem(COL.customers, existing.id, { addresses: nextAddresses });
      }
      try { localStorage.setItem("savdo_my_addresses", JSON.stringify(nextAddresses)); } catch {}
      setMyAddresses(nextAddresses);
    } catch (e) {
      console.error("Manzilni o'chirishda xatolik:", e);
    }
  };

  /** Checkout formasida saqlangan manzillardan birini tanlash — matn va
   *  (mavjud bo'lsa) joylashuvni formaga va location state'ga o'tkazadi.
   *  Agar allaqachon tanlangan manzil qayta bosilsa — tanlov bekor qilinadi. */
  const pickAddressForOrder = (addr) => {
    if (form.address === addr.text) {
      setForm(f => ({ ...f, address: "" }));
      setLocation(null);
      return;
    }
    setForm(f => ({ ...f, address: addr.text }));
    if (addr.lat != null && addr.lng != null) {
      setLocation({ lat: addr.lat, lng: addr.lng });
    } else {
      setLocation(null);
    }
  };

  /** Profil tugmasi bosilganda — telefon hali bog'lanmagan bo'lsa (va Telegram
   *  ichida bo'lmasa) avval "Kirish/ro'yxatdan o'tish" ekranini ko'rsatamiz. */
  const openProfile = () => {
    if (!inTelegram && !myPhone) {
      setLoginIntent("profile");
      setOtpStep("phone");
      setOtpCode("");
      setOtpError("");
      setPhoneLoginOpen(true);
    } else {
      setProfileView("menu");
      setProfileOpen(true);
    }
  };

  /** Savatdagi "Rasmiylashtirish" tugmasi bosilganda chaqiriladi. Mijoz
   *  hali ro'yxatdan o'tmagan bo'lsa (Telegram ichida emas va telefon
   *  tasdiqlanmagan) — avval telefon OTP ekranini ko'rsatamiz, tasdiqlangach
   *  o'zi avtomatik checkout'ga o'tadi (pastdagi verifyOtpAndLogin'ga qarang).
   *  Aks holda checkout to'g'ridan-to'g'ri ochiladi. */
  const startCheckout = () => {
    if (!inTelegram && !myPhone) {
      setLoginIntent("checkout");
      setOtpStep("phone");
      setOtpCode("");
      setOtpError("");
      setCartOpen(false);
      setPhoneLoginOpen(true);
      return;
    }
    setCartOpen(false);
    setCheckoutOpen(true);
    trackPixel("InitiateCheckout", {
      content_ids: selectedCartItemsList.map((i) => i.product.id),
      content_type: "product",
      num_items: selectedCartCount,
      value: selectedCartTotal,
      currency: "UZS",
    });
  };

  const logoutProfile = () => {
    try { localStorage.removeItem("savdo_my_phone"); } catch {}
    setMyPhone("");
    setPhoneInput("");
    setMyOrders([]);
    setProfileOpen(false);
    setProfileView("menu");
  };

  const confirmPhoneLogin = () => {
    if (!isValidUzPhone(phoneInput) || !termsAccepted) return;
    setOtpError("");
    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      setOtpError(t.store.profile.otpSendError);
      return;
    }
    const digits = phoneInput.replace(/\D/g, "");
    window.open(`https://t.me/${botUsername}?start=otp_${digits}`, "_blank");
    setOtpStep("code");
  };

  const verifyOtpAndLogin = async () => {
    if (otpCode.length !== 6) return;
    setOtpError("");
    setOtpSending(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput, code: otpCode }),
      });
      const data = await res.json();
      if (!data.ok) {
        setOtpError(t.store.profile.otpWrong);
        setOtpSending(false);
        return;
      }
      await saveMyPhone();
      setPhoneLoginOpen(false);
      setOtpStep("phone");
      setOtpCode("");
      // Ro'yxatdan o'tish "Rasmiylashtirish" tugmasidan boshlangan bo'lsa —
      // profil menyusi o'rniga to'g'ridan-to'g'ri checkout'ni ochamiz,
      // mijoz qayta "Rasmiylashtirish"ni bosishiga hojat qolmaydi.
      if (loginIntent === "checkout") {
        setCheckoutOpen(true);
        trackPixel("InitiateCheckout", {
          content_ids: selectedCartItemsList.map((i) => i.product.id),
          content_type: "product",
          num_items: selectedCartCount,
          value: selectedCartTotal,
          currency: "UZS",
        });
      } else {
        setProfileView("menu");
        setProfileOpen(true);
      }
    } catch {
      setOtpError(t.store.profile.otpWrong);
    }
    setOtpSending(false);
  };

  const categoryNames = useMemo(() => {
    return [t.store.allCategories, ...categories.map(c => c.name)];
  }, [categories, lang]);

  // Qidiruv — mahsulot nomi bo'yicha YOKI kategoriya nomi bo'yicha mos keladi
  // (masalan "krem" yozilsa shu nomdagi mahsulotlar, "parfyumeriya" yozilsa
  // shu kategoriyaga tegishli barcha mahsulotlar ko'rinadi).
  const searchLower = search.trim().toLowerCase();
  const matchesSearch = (p) => {
    if (!searchLower) return true;
    if (pname(p, lang).toLowerCase().includes(searchLower)) return true;
    if ((p.category || "").toLowerCase().includes(searchLower)) return true;
    if ((p.brand || "").toLowerCase().includes(searchLower)) return true;
    return false;
  };
  // Qoldiq tugagan mahsulotlar ro'yxat oxiriga tushadi (avtomatik, qoldiq
  // qaytishi bilan o'z avvalgi o'rniga qaytadi) — sortSoldOutLast() shu ishni qiladi.
  const filtered = sortSoldOutLast(
    activeCollection
      ? products.filter(p => (activeCollection.productIds || []).includes(p.id))
      : products.filter(p =>
          matchesSearch(p) &&
          (activeCategory === t.store.allCategories || p.category === activeCategory) &&
          (activeBrand === t.store.allBrands || p.brand === activeBrand)
        )
  );
  const brandFiltered = sortSoldOutLast(products.filter(p => activeBrand === t.store.allBrands || p.brand === activeBrand));

  // "Mega Chegirma" sahifasi uchun — admin tomonidan Marketing sahifasida
  // maxsus BELGILANGAN mahsulotlar (narxida haqiqiy chegirma bo'lishi shart
  // emas — bu alohida, qo'lda tanlanadigan reklama ro'yxati).
  const discountedProducts = useMemo(() => products.filter(p => p.megaDiscountActive === true), [products]);
  const discountCategories = useMemo(() => {
    const names = new Set(discountedProducts.map(p => p.category).filter(Boolean));
    return categories.filter(c => names.has(c.name));
  }, [discountedProducts, categories]);
  const discountsFiltered = useMemo(() => {
    let list = discountedProducts.filter(p =>
      pname(p, lang).toLowerCase().includes(discountsSearch.toLowerCase()) &&
      (!discountsCategory || p.category === discountsCategory)
    );
    if (discountsSort === "priceAsc") list = [...list].sort((a, b) => a.price - b.price);
    if (discountsSort === "priceDesc") list = [...list].sort((a, b) => b.price - a.price);
    return sortSoldOutLast(list);
  }, [discountedProducts, discountsSearch, discountsCategory, discountsSort, lang]);

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const wishlistItems = products.filter(p => wishlist.has(p.id));

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => {
      const product = products.find(p => p.id === id);
      const discPct = product ? (cartItemDiscounts[id] || 0) : 0;
      const unitPrice = product ? (discPct > 0 ? Math.max(0, Math.round(product.price * (1 - discPct / 100))) : product.price) : 0;
      return { product, qty, unitPrice, discPct };
    })
    .filter(i => i.product && i.qty > 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  // Savatdagi mahsulotlarni belgilash (checkbox) — "Tanlanganlarni o'chirish"
  // tugmasi shu belgilangan mahsulotlarni bir zumda savatdan olib tashlaydi.
  // Yangi qo'shilgan mahsulot avtomatik belgilangan holda keladi.
  const [selectedCartIds, setSelectedCartIds] = useState(new Set());
  const cartIdsKey = cartItems.map((i) => i.product.id).sort().join(",");
  useEffect(() => {
    const validIds = new Set(cartItems.map((i) => i.product.id));
    setSelectedCartIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      validIds.forEach((id) => { if (!prev.has(id)) next.add(id); });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartIdsKey]);
  const toggleCartItemSelected = (id) => {
    setSelectedCartIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const allCartSelected = cartItems.length > 0 && cartItems.every((i) => selectedCartIds.has(i.product.id));
  const toggleSelectAllCart = () => {
    setSelectedCartIds(allCartSelected ? new Set() : new Set(cartItems.map((i) => i.product.id)));
  };
  const deleteSelectedCartItems = () => {
    const toRemove = cartItems.filter((i) => selectedCartIds.has(i.product.id));
    if (toRemove.length === 0) return;
    removeCartGroup(toRemove);
  };
  // Savat ochilganda pastida ko'rsatiladigan "Sizga qiziq bo'lishi mumkin" —
  // savatda hali yo'q, faol mahsulotlardan, iloji bo'lsa savatdagilar bilan
  // bir xil kategoriyadan tanlanadi.
  const cartRecommendedProducts = useMemo(() => {
    const inCartIds = new Set(cartItems.map((i) => i.product.id));
    const cartCategories = new Set(cartItems.map((i) => i.product.category).filter(Boolean));
    const pool = (products || []).filter((p) => !inCartIds.has(p.id) && p.active !== false && !isSoldOut(p));
    const sameCategory = pool.filter((p) => cartCategories.has(p.category));
    const rest = pool.filter((p) => !cartCategories.has(p.category));
    return [...sameCategory, ...rest].slice(0, 8);
  }, [products, cartIdsKey]);

  // Savat elementlarini kolleksiya bo'yicha guruhlaymiz — shu kolleksiya
  // orqali qo'shilgan mahsulotlar savatda alohida emas, kolleksiya nomi
  // bilan bitta qator sifatida ko'rinadi.
  const cartGroups = [];
  const cartSingles = [];
  {
    const seenTags = new Set();
    cartItems.forEach(entry => {
      const tag = cartCollectionTags[entry.product.id];
      if (tag) {
        if (!seenTags.has(tag)) {
          seenTags.add(tag);
          cartGroups.push({ tag, items: cartItems.filter(x => cartCollectionTags[x.product.id] === tag) });
        }
      } else {
        cartSingles.push(entry);
      }
    });
  }
  const toggleCartGroupExpand = (tag) => {
    setExpandedCartGroups(prev => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };
  const removeCartGroup = (items) => {
    setCart(prev => {
      const next = { ...prev };
      items.forEach(({ product }) => { delete next[product.id]; });
      return next;
    });
    setCartCollectionTags(prev => {
      const next = { ...prev };
      items.forEach(({ product }) => { delete next[product.id]; });
      return next;
    });
    setCartItemDiscounts(prev => {
      const next = { ...prev };
      items.forEach(({ product }) => { delete next[product.id]; });
      return next;
    });
  };

  // Promo kod
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null); // { id, code, discountType, discountValue }
  const [promoError, setPromoError] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  const promoDiscount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.discountType === "percent") {
      return Math.round(cartTotal * (appliedPromo.discountValue / 100));
    }
    return Math.min(appliedPromo.discountValue, cartTotal);
  }, [appliedPromo, cartTotal]);

  const cartTotalAfterDiscount = Math.max(0, cartTotal - promoDiscount);

  // Savat oynasida "Jami" — FAQAT belgilangan (checkbox bosilgan)
  // mahsulotlar bo'yicha hisoblanadi, belgilanmaganlar summaga kirmaydi.
  const selectedCartItemsList = cartItems.filter((i) => selectedCartIds.has(i.product.id));
  const selectedCartCount = selectedCartItemsList.length;
  const selectedCartTotal = selectedCartItemsList.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const selectedPromoDiscount = !appliedPromo
    ? 0
    : appliedPromo.discountType === "percent"
    ? Math.round(selectedCartTotal * (appliedPromo.discountValue / 100))
    : Math.min(appliedPromo.discountValue, selectedCartTotal);
  const selectedCartTotalAfterDiscount = Math.max(0, selectedCartTotal - selectedPromoDiscount);

  // Bonusdan foydalanish — mijoz o'z bonus balansidan xohlagan miqdorini
  // (buyurtma summasidan oshmagan holda) buyurtmaga qo'llashi mumkin.
  // Buyurtma FAQAT savatda BELGILANGAN mahsulotlar bo'yicha rasmiylashtiriladi,
  // shuning uchun bonus va yakuniy summa ham selectedCartTotal asosida hisoblanadi.
  const [bonusToUse, setBonusToUse] = useState("");
  const maxBonusUsable = Math.max(0, Math.min(myBonus, selectedCartTotalAfterDiscount));
  const bonusApplied = Math.min(Number(bonusToUse) || 0, maxBonusUsable);
  const cartTotalAfterBonus = Math.max(0, selectedCartTotalAfterDiscount - bonusApplied);
  const setBonusToUseClamped = (v) => {
    const num = Number(v.replace(/[^\d]/g, "")) || 0;
    setBonusToUse(String(Math.min(num, maxBonusUsable)));
  };
  const useMaxBonus = () => setBonusToUse(String(maxBonusUsable));

  const applyPromoCode = async () => {
    setPromoError("");
    const code = promoInput.trim();
    if (!code) return;
    setCheckingPromo(true);
    try {
      const found = await findPromoCode(code);
      if (!found || found.active === false) {
        setPromoError(t.store.promoInvalid);
      } else if (found.expiresAt && todayISO() > found.expiresAt) {
        setPromoError(t.store.promoExpired);
      } else if (found.usageLimit > 0 && (found.usedCount || 0) >= found.usageLimit) {
        setPromoError(t.store.promoLimitReached);
      } else if (found.minOrder > 0 && selectedCartTotal < found.minOrder) {
        setPromoError(t.store.promoMinOrder.replace("{amount}", fmtMoney(found.minOrder)));
      } else {
        setAppliedPromo(found);
      }
    } catch (e) {
      console.error("Promo kodni tekshirishda xatolik:", e);
      setPromoError(t.store.promoInvalid);
    }
    setCheckingPromo(false);
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  /**
   * `discountPercent` — ixtiyoriy. Faqat "Keng banner" sahifasidan
   * qo'shilayotgan mahsulotlar uchun beriladi: shunda shu mahsulot
   * savatdagi yakuniy summada shu foizda arzonlashadi, lekin
   * mahsulotning o'z narxi (boshqa joylarda ko'rinadigani) o'zgarmaydi.
   */
  const addToCart = (p, discountPercent) => {
    if (p.stockType === "out") return;
    setCart(prev => {
      const current = prev[p.id] || 0;
      if (p.stockType === "limited" && current >= (p.stock || 0)) return prev;
      hapticFeedback("impact", "light");
      return { ...prev, [p.id]: current + 1 };
    });
    if (discountPercent > 0) {
      setCartItemDiscounts(prev => ({ ...prev, [p.id]: discountPercent }));
    }
    trackPixel("AddToCart", {
      content_name: pname(p, lang),
      content_ids: [p.id],
      content_type: "product",
      value: Number(p.price) || 0,
      currency: "UZS",
    });
  };

  /**
   * Kolleksiyadagi barcha mahsulotlarni bir bosishda savatga qo'shadi
   * (har biridan 1 donadan, qoldiq mavjud bo'lsa) va ularni shu
   * kolleksiya nomi bilan "belgilaydi" — shuning uchun savatda alohida
   * mahsulot nomlari o'rniga kolleksiya nomi bilan guruhlanib ko'rinadi.
   */
  const addAllCollectionToCart = (collection, collectionProducts, discountPercent) => {
    let addedAny = false;
    const newTags = {};
    collectionProducts.forEach(p => {
      if ((p.stockType || "limited") === "out") return;
      addToCart(p, discountPercent);
      newTags[p.id] = collectionTitle(collection, lang);
      addedAny = true;
    });
    if (addedAny) {
      setCartCollectionTags(prev => ({ ...prev, ...newTags }));
      hapticFeedback("notification", "success");
      setCartOpen(true);
    }
  };

  /**
   * Banner (yoki uning tugmasi/tayli) bosilganda — savatga avtomatik
   * qo'shmasdan, biriktirilgan mahsulotlarni alohida to'liq sahifada
   * ("psevdo-to'plam" sifatida) ochadi. Shu sahifada mijoz mahsulotlarni
   * ko'rib, xohlasa "Barchasini savatga qo'shish" tugmasi bilan bir
   * bosishda hammasini qo'shadi, yoki har birini alohida tanlaydi.
   */
  const viewLinkedProducts = (banner, linkedIds) => {
    if (!linkedIds || linkedIds.length === 0) return;
    setBannerCollection({
      id: `banner-${banner.id}`,
      title: banner.title || "",
      titleUz: banner.title || "",
      titleRu: banner.title || "",
      badge: banner.badge || "",
      subtitle: banner.subtitle || "",
      mobileImage: banner.mobileImage || banner.desktopImage || "",
      desktopImage: banner.desktopImage || banner.mobileImage || "",
      productIds: linkedIds,
      hideBulkActions: banner.showTotalCalc === false,
    });
    setBannerPageOpen(true);
    hapticFeedback("selection");
  };

  /**
   * "Keng banner" bo'limidagi kolleksiyalar (WideCollectionShowcase) —
   * bosilganda ham xuddi bosh banner kabi, biriktirilgan mahsulotlar
   * alohida to'liq sahifada ko'rsatiladi (o'sha bannerPageOpen sahifasi
   * qayta ishlatiladi).
   */
  const viewWideBannerProducts = (c) => {
    if (!c || !(c.productIds || []).length) return;
    setBannerCollection({
      id: c.id,
      titleUz: c.titleUz,
      titleRu: c.titleRu,
      title: c.title,
      badge: "",
      subtitle: collectionDescription(c, lang),
      mobileImage: c.imageUrl,
      desktopImage: c.imageUrl,
      productIds: c.productIds || [],
      discountPercent: Number(c.discountPercent) || 0,
      // Admin "Jami narx hisoblash" tugmasi orqali har bir banner/to'plam
      // uchun alohida yoqib-o'chirish mumkin.
      hideBulkActions: c.showTotalCalc === false,
    });
    setBannerPageOpen(true);
    hapticFeedback("selection");
  };

  const bannerPageProducts = useMemo(
    () => (bannerCollection ? sortSoldOutLast(products.filter(p => (bannerCollection.productIds || []).includes(p.id))) : []),
    [products, bannerCollection]
  );
  // Shu banner sahifasiga xos chegirma (agar admin belgilagan bo'lsa) —
  // faqat shu sahifada ko'rinadi va shu yerdan qo'shilgan mahsulotlarga
  // qo'llanadi.
  const bannerDiscPct = bannerCollection?.discountPercent || 0;
  const bannerPageTotal = bannerPageProducts.reduce((s, p) => {
    const base = Number(p.price) || 0;
    const unit = bannerDiscPct > 0 ? Math.max(0, Math.round(base * (1 - bannerDiscPct / 100))) : base;
    return s + unit;
  }, 0);
  const changeQty = (id, delta) => {
    setCart(prev => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  // Telegram ichida bo'lsak, checkout oynasi ochilganda Telegramning
  // o'z (pastki, katta) tugmasini "Buyurtmani tasdiqlash" uchun ishlatamiz.
  //
  // MUHIM (xato tuzatildi): bu effekt avval [checkoutOpen, done, form,
  // location, cartTotalAfterBonus]'ga bog'liq edi — "form" esa mijoz
  // ismi/telefon/manzil kiritayotganda HAR BIR HARFDA o'zgaradi. Shu sabab
  // effekt forma to'ldirilayotganda o'nlab marta qayta ishga tushib,
  // Telegramning tugmasini har safar uzib-ulab turardi (offClick + qayta
  // onClick). Telegram WebApp SDK'sida bu tez-tez uzib-ulash ba'zan eski
  // handler'ni to'liq o'chira olmay, YANGI submitOrder() chaqiruvi eskisi
  // USTIGA qo'shilib qolishiga olib kelgan — natijada bitta bosishda
  // buyurtma IKKI MARTA yuborilgan.
  //
  // Yechim: effekt endi FAQAT checkoutOpen/done o'zgarganda qayta ulanadi
  // (forma to'ldirilayotganda tegilmaydi). Tugma bosilganda esa doim ENG
  // OXIRGI submitOrder'ni chaqiradigan ref orqali ishlaydi — shu sabab
  // eski (stale) forma qiymatlari bilan yuborilib qolish xavfi ham yo'q.
  const submitOrderRef = useRef(() => {});
  useEffect(() => {
    const tg = getWebApp();
    if (!tg || !tg.MainButton) return;

    if (checkoutOpen && !done) {
      tg.MainButton.setText(t.store.placeOrder);
      tg.MainButton.show();
      const handler = () => submitOrderRef.current();
      tg.MainButton.onClick(handler);
      return () => {
        tg.MainButton.offClick(handler);
        tg.MainButton.hide();
      };
    } else {
      tg.MainButton.hide();
    }
  }, [checkoutOpen, done]);

  const submitOrder = async () => {
    // Himoya qatlami: Telegramning o'z tugmasi React'ning "disabled" holatiga
    // bog'liq emas, shuning uchun bu yerda ham qayta-qayta yuborilishning
    // oldini olamiz (masalan tez-tez bosilsa yoki ikkita tugma bir vaqtda
    // ishga tushsa ham).
    if (placing) return;
    if (!form.name.trim() || !form.address.trim() || selectedCartItemsList.length === 0) {
      setError(t.common.required);
      return;
    }
    if (!isValidUzPhone(form.phone)) {
      setError(t.store.phoneInvalid);
      return;
    }
    setPlacing(true);

    const phone = form.phone.trim();
    // MUHIM: agar mijoz ALLAQACHON ro'yxatdan o'tgan bo'lsa (Telegram
    // orqali yoki OTP bilan — myCustomerId shu holatda to'ladi), o'sha
    // yozuvni ustuvor olamiz. Aks holda checkout formasidagi telefon
    // raqami bo'yicha qidiramiz. Bu ikkita muammoning oldini oladi:
    // 1) ro'yxatdan o'tgan mijoz checkout'da boshqa/bo'sh telefon kiritsa
    //    ham uning UCHUN IKKINCHI (dublikat) mijoz yozuvi yaratilmaydi;
    // 2) shu sabab unga qayta "xush kelibsiz" bonusi berilib qolmaydi —
    //    bonus faqat haqiqiy ro'yxatdan o'tishda beriladi.
    const existing = myCustomerId ? { id: myCustomerId } : await findCustomerByPhone(phone);

    const orderData = {
      customer: form.name.trim(),
      phone,
      phone2: form.phone2?.trim() || null,
      amount: cartTotalAfterBonus,
      status: "new",
      date: todayISO(),
      payment: form.payment,
      address: form.address.trim(),
      location: location || null,
      promoCode: appliedPromo?.code || null,
      promoDiscount: selectedPromoDiscount || 0,
      bonusUsed: bonusApplied || 0,
      items: selectedCartItemsList.map(i => ({
        productId: i.product.id,
        productName: pname(i.product, lang),
        price: i.product.price,
        costPrice: Number(i.product.costPrice) || 0,
        qty: i.qty,
        imageUrl: (i.product.imageUrls && i.product.imageUrls[0]) || i.product.imageUrl || null,
      })),
      // Telegram Mini App ichidan kelgan bo'lsa, shu maydonlar to'ladi;
      // oddiy brauzerdan kelsa — hammasi null/bo'sh qoladi.
      telegramUserId: tgUser?.id || null,
      telegramUsername: tgUser?.username || null,
      telegramFirstName: tgUser?.first_name || null,
      source: inTelegram ? "telegram_mini_app" : "web",
    };

    try {
      const orderId = await placeOrderBatch({
        cartItems: selectedCartItemsList,
        existingCustomer: existing,
        customerName: form.name.trim(),
        customerPhone: phone,
        customerAddress: form.address.trim(),
        cartTotal: cartTotalAfterBonus,
        orderData,
      });

      // Facebook Pixel: buyurtma MUVAFFAQIYATLI joylandi — "Purchase"
      // voqeasi shu yerda, bazaga yozilgandan KEYIN yuboriladi (xato
      // bo'lsa pastdagi catch blokiga tushadi va bu yerga yetib kelmaydi).
      trackPixel("Purchase", {
        content_ids: selectedCartItemsList.map((i) => i.product.id),
        content_type: "product",
        num_items: selectedCartItemsList.length,
        value: cartTotalAfterBonus,
        currency: "UZS",
        order_id: orderId,
      });

      if (appliedPromo) {
        incrementPromoCodeUsage(appliedPromo.id);
      }

      // Ishlatilgan bonusni mijoz balansidan ayiramiz.
      // MUHIM: "existing" (telefon raqami bo'yicha topilgan mijoz) va
      // "myBonus" (ekranda ko'rsatilgan, myCustomerId'ga tegishli bonus)
      // har doim BIR XIL mijoz yozuvi bo'lavermaydi — masalan Telegram
      // orqali kirgan mijoz checkout'da boshqa/yangi telefon kiritsa,
      // "existing" boshqa (yoki umuman topilmagan) yozuvga ishora qiladi.
      // Shu sabab avvalgi kodda ayirish ko'pincha umuman ishlamas edi.
      // Endi ENG ISHONCHLI manba — myCustomerId (bonus aynan shu yozuvdan
      // ko'rsatilgan) — ustuvor olinadi, va Firestore'ning ATOMIK
      // increment()'idan foydalaniladi (adjustCustomerBonus), shunda bir
      // necha buyurtma ketma-ket berilsa ham bonus noto'g'ri (masalan
      // qayta-qayta) ayirilib qolmaydi.
      const bonusTargetId = myCustomerId || existing?.id || null;
      if (bonusApplied > 0 && bonusTargetId) {
        try {
          await adjustCustomerBonus(bonusTargetId, -bonusApplied);
          setMyBonus(b => Math.max(0, b - bonusApplied));
        } catch (e) {
          console.error("Bonusni ayirishda xatolik:", e);
        }
      }
      setBonusToUse("");

      hapticFeedback("notification", "success");
      setPlacing(false);
      setDone(true);
      // Faqat BUYURTMA QILINGAN (belgilangan) mahsulotlarni savatdan olib
      // tashlaymiz — belgilanmagan qolgan mahsulotlar savatda saqlanib qoladi.
      const orderedIds = new Set(selectedCartItemsList.map(i => i.product.id));
      setCart(prev => {
        const next = { ...prev };
        orderedIds.forEach(id => { delete next[id]; });
        return next;
      });
      setCartCollectionTags(prev => {
        const next = { ...prev };
        orderedIds.forEach(id => { delete next[id]; });
        return next;
      });
      setCartItemDiscounts(prev => {
        const next = { ...prev };
        orderedIds.forEach(id => { delete next[id]; });
        return next;
      });
      setSelectedCartIds(new Set());

      // Firestore'ga yozib bo'lgandan KEYIN — botga xabar yuborishga urinamiz.
      // Bu qadam ixtiyoriy: agar tarmoq bilan muammo bo'lsa ham, buyurtma
      // allaqachon bazada saqlangan, mijozga xato ko'rsatmaymiz.
      // MUHIM: costPrice (tannarx) hech qachon Telegramga yuborilmaydi —
      // shuning uchun items'dan shu maydonni olib tashlab yuboramiz.
      notifyTelegramBot({
        ...orderData,
        orderId,
        items: orderData.items.map(({ costPrice, ...rest }) => rest),
      });
    } catch (e) {
      console.error("Buyurtma yuborishda xatolik:", e);
      setError(t.common.required);
      setPlacing(false);
    }
  };

  // submitOrderRef'ni har renderda ENG OXIRGI submitOrder bilan yangilab
  // turamiz — shunda yuqoridagi Telegram MainButton effekti kamroq
  // qayta ulanadi (faqat checkoutOpen/done o'zgarganda), lekin tugma
  // bosilganda baribir har doim eng so'nggi forma qiymatlari bilan ishlaydi.
  useEffect(() => {
    submitOrderRef.current = submitOrder;
  });

  const resetAll = () => {
    setDone(false);
    setCheckoutOpen(false);
    setCartOpen(false);
    // Ism/telefonni butunlay bo'shatib qo'ymaymiz — mijoz keyingi safar
    // buyurtma berganda ular yana avtomatik to'ldirilgan holda tursin.
    const fullName = tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : myName;
    setForm({ name: fullName || "", phone: myPhone || "", payment: "cash", address: "", phone2: "" });
    setLocation(null);
    setError("");
    removePromoCode();
    setBonusToUse("");
    setShowCheckoutMap(false);
    setShowPhone2(false);
  };

  return (
    <div
      className="min-h-[600px] w-full bg-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "var(--tg-secondary-bg-color, #FFFFFF)" }}
    >
      {/* Store header */}
      <header className="sticky top-0 z-20 hidden border-b border-gray-100 bg-white/95 px-6 py-3 backdrop-blur md:block">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {storeSettings?.logoUrl ? (
              <img loading="lazy" src={storeSettings.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
                <ShoppingBag size={18} />
              </div>
            )}
            <p style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-base font-semibold tracking-tight text-stone-900">{storeSettings?.storeName || t.appName}</p>
          </div>

          {/* Nav havolalari — bo'limlarga scroll qiladi (alohida sahifalar emas, bitta sahifali sayt) */}
          <nav className="hidden items-center gap-6 lg:flex">
            {[
              { label: t.store.navHome, id: null },
              { label: t.store.navShop, id: "shop-section" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  if (item.id) document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
                  else window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="text-sm font-medium text-stone-600 hover:text-rose-600"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="relative hidden flex-1 md:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.store.searchPh}
              className="w-full rounded-full border border-rose-100 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-stone-400" />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-stone-600 hover:bg-rose-50"
            >
              <Globe size={19} />
              <span className="hidden sm:inline">{lang === "uz" ? "O'zbek" : "Русский"}</span>
            </button>
            <button onClick={() => setWishlistOpen(true)} className="relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-stone-600 hover:bg-rose-50">
              <Heart size={19} />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
                  {wishlistItems.length}
                </span>
              )}
              <span className="hidden sm:inline">{t.store.wishlist}</span>
            </button>
            <button onClick={() => setCartOpen(true)} className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium transition ${cartCount > 0 ? "bg-rose-50 text-rose-600" : "text-stone-600 hover:bg-rose-50"}`}>
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
              <span className="hidden sm:inline">{t.store.cart}</span>
            </button>
            <button onClick={openProfile} className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-stone-600 hover:bg-rose-50">
              <UserRound size={19} />
              <span className="hidden sm:inline">{tgUser?.first_name || t.store.profileBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero banner — admin panelning "Banner" bo'limidan boshqariladi. Mobilda header yashirin bo'lgani uchun banner tepaga taqab qo'yiladi, yon tomonlarda gap saqlanadi. */}
      <div className="relative px-0 pt-0 md:pt-6 min-[769px]:px-6">
        <Banner banners={banners} inTelegram={inTelegram} t={t} onViewLinkedProducts={viewLinkedProducts} />
        {/* Mijozning bonus balansi — banner ustida, yuqori o'ng burchakda */}
        <div className="absolute right-7 top-9 flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-lg min-[769px]:right-9 min-[769px]:top-9">
          <Wallet size={13} />
          {fmtMoney(myBonus)} {t.common.uzs}
        </div>
        {/* Suzuvchi chat tugmasi — bonus belgisi ostida, Telegram chatga yo'naltiradi */}
        <a
          href="https://t.me/casmeuz"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat"
          className="absolute right-7 top-[74px] flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-lg transition hover:scale-105 min-[769px]:right-9 min-[769px]:top-[74px]"
        >
          <MessageCircle size={19} />
        </a>
      </div>

      {/* Mobil qidiruv — banner ostida (mobil ilovalardagi kabi). Bosilganda alohida qidiruv sahifasi ochiladi.
          Eslatma: pt-4 (yuqori bo'shliq) atayin ALOHIDA tashqi qatlamga qo'yilgan — agar u
          "relative" (ikonka joylashtiriladigan) qatlamning o'zida bo'lsa, ikonkaning "top-1/2"
          markazi paddingni ham hisobga olib noto'g'ri (haqiqiy inputdan yuqoriroq) hisoblanadi. */}
      <div className="px-[5px] pt-4 md:hidden">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            readOnly
            onFocus={() => setSearchPageOpen(true)}
            onClick={() => setSearchPageOpen(true)}
            placeholder={t.store.searchPh}
            className="w-full cursor-pointer rounded-full border-2 border-rose-200 bg-white py-2.5 pl-11 pr-3 text-sm shadow-sm outline-none focus:border-stone-400"
          />
        </div>
      </div>

      {/* Kategoriyalar qatori — banner ostida, admin panelda cheksiz kategoriya qo'shiladi/tahrirlanadi */}
      {!search && !activeCollection && (
        <div className="px-[5px] pt-8 min-[769px]:px-6">
          <CategoryQuickRow categories={categories} products={products} onSelect={openCategoryPage} t={t} />
        </div>
      )}

      {/* Mega Chegirmalar — admin tomonidan Marketing sahifasida belgilangan mahsulotlar, bitta gorizontal qatorda */}
      {!search && !activeCollection && discountedProducts.length > 0 && (
        <div className="px-0 pt-10 min-[769px]:px-6">
          <div className="rounded-[28px] px-0 pb-7 pt-[6px] min-[769px]:p-[36px] min-[769px]:pb-8" style={{ background: "#B03060" }}>
          <div className="relative">
            <div ref={discountViewportRef} className="embla-viewport">
            <div className="embla-container gap-0 pl-3 min-[769px]:gap-2 min-[769px]:pl-0">
              {sortSoldOutLast(discountedProducts).map(p => {
              const inCart = cart[p.id] || 0;
              const stockType = p.stockType || "limited";
              const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
              const hasDiscount = p.oldPrice > p.price;
              const pct = discountPct(p.price, p.oldPrice);
              const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
              const name = pname(p, lang);
              const liked = wishlist.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group flex w-[116px] shrink-0 cursor-pointer flex-col px-0.5 py-2 min-[769px]:p-2.5 transition hover:-translate-y-0.5 min-[769px]:w-[220px]"
                >
                  <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl border border-white/25 bg-white/10 backdrop-blur-md text-white/40">
                    {thumb ? (
                      <img loading="lazy" src={thumb} alt={name} className="h-full w-full object-contain p-1 transition-transform duration-300 ease-out group-hover:scale-105" draggable={false} onDragStart={(e) => e.preventDefault()} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Package size={32} strokeWidth={1.3} /></div>
                    )}
                    {hasDiscount && (
                      <span className="absolute left-0 top-0 rounded-full bg-[#E01876] px-2 py-0.5 text-[10px] font-bold text-white">-{pct}%</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                      className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/70 text-white transition hover:bg-white/15"
                    >
                      <Heart size={12} fill={liked ? "#fff" : "none"} />
                    </button>
                    {inCart > 0 ? (
                      <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-md">
                        <button
                          onClick={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-stone-600 hover:bg-gray-100"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[14px] text-center text-xs font-semibold text-stone-800">{inCart}</span>
                        <button
                          disabled={soldOut}
                          onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-stone-600 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={soldOut}
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#E01876] shadow-md transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-400"
                      >
                        <Plus size={13} />
                      </button>
                    )}
                  </div>
                  <p className="mb-1.5 line-clamp-2 min-h-[2.2em] text-xs font-medium text-white min-[769px]:text-sm">{name}</p>
                  <span className="text-xs font-semibold text-white min-[769px]:text-sm">{fmtMoney(p.price)} <span className="text-[10px] font-normal text-white/70">{t.common.uzs}</span></span>
                  {hasDiscount && <span className="text-[11px] text-white/60 line-through">{fmtMoney(p.oldPrice)}</span>}
                </div>
              );
            })}
            </div>
            </div>
            <button
              onClick={scrollDiscountPrev}
              aria-label="Oldingi"
              className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollDiscountNext}
              aria-label="Keyingi"
              className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            onClick={() => setDiscountsPageOpen(true)}
            className="mx-5 mt-5 w-[calc(100%-40px)] rounded-full bg-white py-3.5 text-sm font-semibold text-[#E01876] shadow-sm transition hover:bg-rose-50 min-[769px]:mx-0 min-[769px]:mt-6 min-[769px]:w-full"
          >
            {t.store.viewAll} {t.store.megaDiscountTitle}
          </button>
          </div>
        </div>
      )}

      {/* Eng ko'p sotilganlar — admin "Top" deb belgilagan mahsulotlar, Chegirmalar bo'limidan pastda, bitta gorizontal qatorda (mobilda ham) */}
      {!search && !activeCollection && products.some(p => p.tag === "bestseller") && (
        <div className="px-0 pt-6 min-[769px]:px-6">
          <div className="rounded-none bg-white px-0 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-[769px]:rounded-[24px] min-[769px]:p-[32px]">
          <div className="mb-4 flex items-center justify-between gap-2 px-3">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#FF4D4F" }} className="text-lg font-semibold sm:text-xl">🔥 {t.store.hitProducts}</h2>
            <button
              onClick={openHitsPage}
              className="shrink-0 whitespace-nowrap rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-gray-50"
            >
              {t.store.viewAll}
            </button>
          </div>
          <div className="relative">
            <div
              ref={popularRowRef}
              className="flex gap-3 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden min-[769px]:gap-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {sortSoldOutLast(products.filter(p => p.tag === "bestseller")).map((p) => {
              const inCart = cart[p.id] || 0;
              const stockType = p.stockType || "limited";
              const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
              const hasDiscount = p.oldPrice > p.price;
              const pct = discountPct(p.price, p.oldPrice);
              const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
              const name = pname(p, lang);
              const liked = wishlist.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group flex w-[88px] shrink-0 cursor-pointer flex-col rounded-2xl bg-white p-1.5 transition hover:-translate-y-0.5 min-[769px]:w-36 min-[769px]:max-w-none"
                >
                  <div className={`relative mb-2 aspect-square overflow-hidden rounded-xl text-stone-300 ${p.tint || "bg-gray-50"}`}>
                    {thumb ? (
                      <img loading="lazy" src={thumb} alt={name} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105" draggable={false} onDragStart={(e) => e.preventDefault()} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Package size={24} strokeWidth={1.3} /></div>
                    )}
                    {hasDiscount && (
                      <span className="absolute left-1 top-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">-{pct}%</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:text-rose-500"
                    >
                      <Heart size={11} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                    </button>
                    {inCart > 0 ? (
                      <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-md">
                        <button
                          onClick={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-stone-600 hover:bg-gray-100"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="min-w-[14px] text-center text-xs font-semibold text-stone-800">{inCart}</span>
                        <button
                          disabled={soldOut}
                          onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-stone-600 hover:bg-gray-100 disabled:opacity-40"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={soldOut}
                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                        className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-white shadow-md transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>
                  <p className="mb-0.5 line-clamp-2 min-h-[2em] text-[11px] font-medium text-stone-800">{name}</p>
                  <div className="flex items-center gap-1.5">
                    {hasDiscount && <span className="text-[10px] text-stone-400 line-through">{fmtMoney(p.oldPrice)}</span>}
                    <span className="text-xs font-semibold text-stone-900">{fmtMoney(p.price)} <span className="text-[10px] font-normal text-stone-400">{t.common.uzs}</span></span>
                  </div>
                </div>
              );
            })}
            </div>
            <button
              onClick={scrollPopularPrev}
              aria-label="Oldingi"
              className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 min-[769px]:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollPopularNext}
              aria-label="Keyingi"
              className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 min-[769px]:flex"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Keng banner uslubidagi to'plamlar — Eng ko'p sotilganlar bo'limidan pastda */}
      {!search && !activeCollection && collections.some(c => c.displayStyle === "banner" && c.active !== false && c.imageUrl) && (
        <div className="px-[5px] pt-[12px] min-[769px]:px-6">
          <WideCollectionShowcase collections={collections} onSelect={viewWideBannerProducts} t={t} lang={lang} />
        </div>
      )}

      {/* Katta (portret, 750x1200) surat + pastida mahsulotlar qatori — admin "Katta surat + mahsulotlar" turida qo'shgan to'plamlar */}
      {!search && !activeCollection && collections.some(c => c.displayStyle === "heroBanner" && c.active !== false && c.imageUrl) && (
        <div className="px-[14px] pt-[40px] min-[769px]:px-6">
          <div className="space-y-8">
            {collections.filter(c => c.displayStyle === "heroBanner" && c.active !== false && c.imageUrl).map(c => {
              const heroProducts = sortSoldOutLast(products.filter(p => (c.productIds || []).includes(p.id)));
              return (
                <div key={c.id}>
                  <div className="relative overflow-hidden rounded-[28px] bg-stone-100" style={{ aspectRatio: "750 / 1200" }}>
                    <img
                      loading="lazy"
                      src={c.imageUrl}
                      alt={collectionTitle(c, lang)}
                      className="absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                    />
                    {heroProducts.length > 0 && (
                      <div className="absolute inset-x-0 bottom-0">
                        {/* Mahsulotlar va tugma — to'g'ridan-to'g'ri banner surati ustida, orqa foni doim ko'rinib turadi */}
                        <div
                          className="pb-5 pt-24"
                          style={{ background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.4) 45%, rgba(0,0,0,0.6))" }}
                        >
                        <div className="flex gap-3 overflow-x-auto pl-4 pr-0 pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                          {heroProducts.map(p => {
                            const inCart = cart[p.id] || 0;
                            const stockType = p.stockType || "limited";
                            const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
                            const hasDiscount = p.oldPrice > p.price;
                            const pct = discountPct(p.price, p.oldPrice);
                            const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                            const name = pname(p, lang);
                            const liked = wishlist.has(p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => setSelectedProduct(p)}
                                className="group flex w-[120px] shrink-0 cursor-pointer flex-col transition hover:-translate-y-0.5"
                              >
                                <div className="relative mb-1.5 aspect-square overflow-hidden rounded-xl border border-white/25 bg-white/10 backdrop-blur-md text-white/40">
                                  {thumb ? (
                                    <img loading="lazy" src={thumb} alt={name} className="relative h-full w-full object-contain p-1.5 transition-transform duration-300 ease-out group-hover:scale-105" draggable={false} onDragStart={(e) => e.preventDefault()} />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center"><Package size={22} strokeWidth={1.3} /></div>
                                  )}
                                  {hasDiscount && (
                                    <span className="absolute left-0 top-0 rounded-full bg-[#E01876] px-2 py-0.5 text-[10px] font-bold text-white">-{pct}%</span>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                                    className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full border border-white/70 text-white transition hover:bg-white/15"
                                  >
                                    <Heart size={12} fill={liked ? "#fff" : "none"} />
                                  </button>
                                  {inCart > 0 ? (
                                    <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-white px-1 py-1 shadow-md">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                                        className="flex h-6 w-6 items-center justify-center rounded-full text-stone-600 hover:bg-gray-100"
                                      >
                                        <Minus size={12} />
                                      </button>
                                      <span className="min-w-[14px] text-center text-xs font-semibold text-stone-800">{inCart}</span>
                                      <button
                                        disabled={soldOut}
                                        onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                        className="flex h-6 w-6 items-center justify-center rounded-full text-stone-600 hover:bg-gray-100 disabled:opacity-40"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      disabled={soldOut}
                                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                      className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#E01876] shadow-md transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-400"
                                    >
                                      <Plus size={13} />
                                    </button>
                                  )}
                                </div>
                                <div className="pl-1.5">
                                  <p className="mb-1.5 line-clamp-2 min-h-[2.2em] text-xs font-medium text-white">{name}</p>
                                  <span className="text-xs font-semibold text-white">{fmtMoney(p.price)} <span className="text-[10px] font-normal text-white/70">{t.common.uzs}</span></span>
                                  {hasDiscount && <span className="text-[11px] text-white/60 line-through">{fmtMoney(p.oldPrice)}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => viewWideBannerProducts(c)}
                          className="mx-4 mt-5 w-[calc(100%-32px)] rounded-full bg-white/85 py-3 text-center text-sm font-semibold text-rose-600 backdrop-blur-sm transition hover:bg-white"
                        >
                          {t.store.viewAll} {t.products.collectionProducts}
                        </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brend doira ikonkalari + shu brendga tegishli mahsulotlar — nozik oltin gradient fon bilan */}
      {!search && brands && brands.length > 0 && (
        <div
          className="relative mt-8 overflow-hidden rounded-none p-4 min-[769px]:mx-6 min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8"
          style={{ background: "linear-gradient(180deg, #F8D34F, #E6BE38)" }}
        >
          {/* Xira oltin dekor — yuqori o'ng burchakda */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full"
            style={{ background: "#D4AF37", opacity: 0.05 }}
          />
          <div className="relative rounded-2xl bg-white/70 p-4 shadow-sm sm:p-5">
            <BrandIconRow brands={brands} products={products} activeBrand={activeBrand} onSelect={(name) => setActiveBrand(name)} t={t} bare theme="gold" />
          </div>
          <div className="relative mb-4 mt-8">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", color: "#111827" }} className="text-2xl font-semibold sm:text-3xl">
              {activeBrand === t.store.allBrands ? t.store.allProductsTitle : activeBrand}
            </h2>
            <p className="mt-1 text-sm text-[#6B5D2E]">
              {brands.length} {t.store.brandsCount} • {products.length} {t.store.productsCount}
            </p>
          </div>
        {brandFiltered.length === 0 ? (
          <EmptyState icon={Package} text={t.store.noProducts} />
        ) : (
          <div className="grid grid-cols-2 gap-3 min-[769px]:gap-4">
            {brandFiltered.slice(0, 8).map(p => {
              const inCart = cart[p.id] || 0;
              const stockType = p.stockType || "limited"; // eski mahsulotlar uchun orqaga moslik
              const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
              const hasDiscount = p.oldPrice > p.price;
              const pct = discountPct(p.price, p.oldPrice);
              const liked = wishlist.has(p.id);
              const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
              const name = pname(p, lang);
              const brandInfo = p.brand ? brands.find(b => b.name === p.brand) : null;
              let stockLabel;
              if (stockType === "unlimited") stockLabel = t.store.available;
              else if (soldOut) stockLabel = t.store.outOfStock;
              else stockLabel = `${p.stock} ${t.store.inStock}`;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group flex w-full cursor-pointer flex-col rounded-[20px] border border-gray-50 bg-white p-2 min-[769px]:p-3 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* aspect-square — karta kengligi qanday bo'lishidan qat'i nazar rasm nisbati
                      har doim 1:1 (kvadrat) bo'lib qoladi, shu tufayli hech qachon cho'zilib/torayib ko'rinmaydi */}
                  <div className={`relative mb-3 aspect-square overflow-hidden rounded-2xl text-stone-300 ${p.tint || "bg-white"}`}>
                    {thumb ? (
                      <img
                        loading="lazy"
                        src={thumb}
                        alt={name}
                        className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                        onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                      />
                    ) : null}
                    <div className={`${thumb ? "hidden" : "flex"} absolute inset-0 items-center justify-center`}>
                      <Package size={36} strokeWidth={1.3} />
                    </div>
                    <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                      {p.brand && (
                        <span className="flex items-center gap-1 rounded-full bg-white/95 py-0.5 pl-0.5 pr-2 shadow-sm">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-50 text-stone-300">
                            {brandInfo?.imageUrl ? (
                              <img loading="lazy" src={brandInfo.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Tag size={8} />
                            )}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">{p.brand}</span>
                        </span>
                      )}
                      {hasDiscount && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                          -{pct}%
                        </span>
                      )}
                      {p.tag === "new" && (
                        <span className="rounded-full bg-stone-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {t.store.tagNew}
                        </span>
                      )}
                      {p.tag === "bestseller" && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                          {t.store.tagBestseller}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:text-rose-500"
                    >
                      <Heart size={15} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                    </button>
                  </div>
                  <p className="mb-1 line-clamp-2 min-h-[2.5em] text-xs font-medium text-stone-800 min-[769px]:text-sm">{name}</p>
                  <div className="mb-1 flex min-h-[1.25rem] items-center gap-1 text-xs text-stone-500">
                    {p.rating > 0 && (
                      <>
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="font-medium text-stone-700">{Number(p.rating).toFixed(1)}</span>
                        {p.reviewCount > 0 && <span className="text-stone-400">({p.reviewCount})</span>}
                      </>
                    )}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    {hasDiscount && <span className="text-xs text-stone-400 line-through">{fmtMoney(p.oldPrice)}</span>}
                    <span className="text-xs font-semibold text-stone-900 min-[769px]:text-sm">{fmtMoney(p.price)} <span className="text-xs font-normal text-stone-400">{t.common.uzs}</span></span>
                  </div>
                  <p className={`mb-3 text-xs ${soldOut ? "text-rose-500" : "text-stone-400"}`}>
                    {stockLabel}
                  </p>
                  <AddToCartControl
                    qty={inCart}
                    soldOut={soldOut}
                    onIncrease={(e) => { e.stopPropagation(); addToCart(p); }}
                    onDecrease={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                    emptyContent={<><Plus size={15} /> {t.store.addToCart}</>}
                    emptyClassName="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-stone-900 min-h-[38px] px-2 py-2 text-xs font-medium min-[769px]:min-h-[44px] min-[769px]:px-3 min-[769px]:py-2.5 min-[769px]:text-sm text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-stone-400"
                  />
                </div>
              );
            })}
          </div>
        )}
        {brandFiltered.length > 8 && (
          <button
            onClick={() => openBrandPage(activeBrand)}
            className="mt-4 w-full rounded-full bg-stone-900 py-3 text-center text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            {t.store.viewAll} {t.products.collectionProducts}
          </button>
        )}
        </div>
      )}

      {/* Mijoz sharhlari */}
      <div className="mt-8 px-[5px] min-[769px]:px-6">
        <div className="rounded-none p-4 min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8" style={{ background: "#FAF3E8" }}>
          <Testimonials testimonials={testimonials} products={products} lang={lang} t={t} onProductClick={setSelectedProduct} />
        </div>
      </div>

      {/* Ishonch belgilari (yetkazib berish / qaytarish / to'lov) — zamonaviy kartochkalar */}
      <div className="mt-8 grid grid-cols-2 gap-3 px-[5px] min-[769px]:px-6 sm:grid-cols-4">
        {[
          { icon: Truck, text: storeSettings?.trustFeature1 || t.store.featShipping, href: null },
          { icon: Headphones, text: storeSettings?.trustFeature4 || t.store.featSupport, href: storeSettings?.trustFeature4Link || null },
          { icon: ShieldCheck, text: storeSettings?.trustFeature3 || t.store.featSecure, href: null },
          { icon: RotateCcw, text: storeSettings?.trustFeature2 || t.store.featReturns, href: null },
        ].map(({ icon: Icon, text, href }, i) => {
          const content = (
            <>
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, #FDA4AF, #E01876)" }}
              >
                <Icon size={18} />
              </span>
              <span className="text-xs font-medium leading-snug text-stone-700">{text}</span>
            </>
          );
          const cls = "flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,0,0,0.08)]";
          return href ? (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
              {content}
            </a>
          ) : (
            <div key={i} className={cls}>
              {content}
            </div>
          );
        })}
      </div>

      <StoreFooter
        lang={lang}
        storeName={storeSettings?.storeName || t.appName}
        settings={storeSettings}
        customersCount={customersCount}
        ordersCount={ordersCount}
        onShopAll={() => openBrandPage(t.store.allBrands)}
        onCategories={() => setCategoriesPageOpen(true)}
      />

      {/* "Mega Chegirma" — chegirmadagi barcha mahsulotlar to'liq sahifasi (Chegirmalar bo'limidagi "Barchasini ko'rish" tugmasidan ochiladi) */}
      {discountsPageOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-[5px] pb-28 pt-5 min-[769px]:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl font-bold text-stone-900 sm:text-3xl">{t.store.megaDiscountTitle}</h1>
              <button onClick={() => setDiscountsPageOpen(false)} className="rounded-full p-2 text-stone-400 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  id="discounts-page-search"
                  value={discountsSearch}
                  onChange={(e) => setDiscountsSearch(e.target.value)}
                  placeholder={t.store.searchPh}
                  className="w-full rounded-full bg-gray-100 py-3 pl-11 pr-4 text-sm outline-none focus:bg-gray-50"
                />
              </div>
              <button
                onClick={() => setDiscountsSort((s) => (s === "default" ? "priceAsc" : s === "priceAsc" ? "priceDesc" : "default"))}
                aria-label="Saralash"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${discountsSort !== "default" ? "border-rose-500 bg-rose-50 text-rose-500" : "border-gray-200 text-stone-500 hover:bg-gray-50"}`}
              >
                <SlidersHorizontal size={17} />
              </button>
              <button
                onClick={() => setDiscountsFilterOpen((v) => !v)}
                aria-label="Filtr"
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition ${discountsCategory ? "border-rose-500 bg-rose-50 text-rose-500" : "border-gray-200 text-stone-500 hover:bg-gray-50"}`}
              >
                <Filter size={17} />
              </button>
            </div>

            {discountsFilterOpen && discountCategories.length > 0 && (
              <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                <button
                  onClick={() => setDiscountsCategory(null)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${!discountsCategory ? "bg-stone-900 text-white" : "bg-gray-100 text-stone-500 hover:bg-gray-200"}`}
                >
                  {t.store.allCategories}
                </button>
                {discountCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setDiscountsCategory(c.name)}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${discountsCategory === c.name ? "bg-stone-900 text-white" : "bg-gray-100 text-stone-500 hover:bg-gray-200"}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}

            {discountsFiltered.length === 0 ? (
              <EmptyState icon={Package} text={t.store.noProducts} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {discountsFiltered.map((p) => {
                  const inCart = cart[p.id] || 0;
                  const stockType = p.stockType || "limited";
                  const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
                  const pct = discountPct(p.price, p.oldPrice);
                  const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                  const name = pname(p, lang);
                  const liked = wishlist.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="relative flex cursor-pointer flex-col rounded-2xl bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5"
                    >
                      <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-white text-stone-300">
                        {thumb ? (
                          <img loading="lazy" src={thumb} alt={name} className="h-full w-full object-contain p-2" draggable={false} onDragStart={(e) => e.preventDefault()} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Package size={28} strokeWidth={1.3} /></div>
                        )}
                        <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">-{pct}%</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:text-rose-500"
                        >
                          <Heart size={13} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                        </button>
                      </div>
                      <p className="mb-1 line-clamp-2 min-h-[2.2em] text-xs font-medium text-stone-800 sm:text-sm">{name}</p>
                      <p className="text-xs font-semibold text-stone-900 sm:text-sm">{fmtMoney(p.price)} <span className="text-[10px] font-normal text-stone-400">{t.common.uzs}</span></p>
                      <p className="mb-2 text-[11px] text-stone-400 line-through">{fmtMoney(p.oldPrice)}</p>
                      <AddToCartControl
                        qty={inCart}
                        soldOut={soldOut}
                        size="sm"
                        onIncrease={(e) => { e.stopPropagation(); addToCart(p); }}
                        onDecrease={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                        emptyContent={<Plus size={15} />}
                        emptyClassName="mt-auto flex h-9 items-center justify-center rounded-full border border-stone-300 text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suzuvchi orqaga qaytish + navigatsiya paneli */}
          <div className="fixed inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setDiscountsPageOpen(false)}
              aria-label="Orqaga"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
              <button onClick={() => { setDiscountsPageOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Home size={20} />
              </button>
              <button onClick={() => document.getElementById("discounts-page-search")?.focus()} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Search size={20} />
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{wishlistItems.length}</span>
                )}
              </button>
              <button onClick={() => setCartOpen(true)} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${cartCount > 0 ? "bg-rose-50 text-rose-500" : "text-stone-500 hover:bg-rose-50"}`}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{cartCount}</span>
                )}
              </button>
              <button onClick={openProfile} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <UserRound size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bannerga biriktirilgan mahsulotlar — alohida to'liq sahifa, banner bosilganda ochiladi */}
      {bannerPageOpen && bannerCollection && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-[5px] pb-28 pt-5 min-[769px]:px-6">
            {/* Banner surati — zamonaviy hero ko'rinishida, tepasida yopish tugmasi */}
            <div className="relative mb-4 overflow-hidden rounded-[28px]" style={{ aspectRatio: "800 / 520" }}>
              {(bannerCollection.mobileImage || bannerCollection.desktopImage) ? (
                <img
                  src={bannerCollection.mobileImage || bannerCollection.desktopImage}
                  alt={collectionTitle(bannerCollection, lang)}
                  className="h-full w-full object-cover"
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-rose-100 text-stone-400">
                  <Package size={32} strokeWidth={1.3} />
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                onClick={() => { setBannerPageOpen(false); setBannerCollection(null); }}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white"
              >
                <X size={18} />
              </button>
              <div className="absolute inset-x-0 bottom-0 px-5 pb-5 pt-10 sm:px-7">
                {bannerCollection.badge && (
                  <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white backdrop-blur-sm">{bannerCollection.badge}</span>
                )}
                <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                  {collectionTitle(bannerCollection, lang)}
                </h1>
                {bannerCollection.subtitle && <p className="mt-1 max-w-sm text-sm text-white/85">{bannerCollection.subtitle}</p>}
              </div>
            </div>

            {!bannerCollection.hideBulkActions && bannerPageProducts.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-rose-50 px-4 py-3.5 sm:px-5">
                <p className="text-sm text-stone-600">
                  {t.store.collectionTotal}: <span className="text-base font-semibold text-stone-900">{fmtMoney(bannerPageTotal)} {t.common.uzs}</span>
                  <span className="ml-1 text-xs text-stone-400">({bannerPageProducts.length} {t.common.ta})</span>
                </p>
                <button
                  onClick={() => addAllCollectionToCart(bannerCollection, bannerPageProducts, bannerDiscPct)}
                  className="flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
                >
                  <ShoppingCart size={15} /> {t.store.collectionAddAll}
                </button>
              </div>
            )}

            {bannerPageProducts.length === 0 ? (
              <EmptyState icon={Package} text={t.store.noProducts} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {bannerPageProducts.map((p) => {
                  const inCart = cart[p.id] || 0;
                  const stockType = p.stockType || "limited";
                  const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
                  const basePrice = Number(p.price) || 0;
                  const finalPrice = bannerDiscPct > 0 ? Math.max(0, Math.round(basePrice * (1 - bannerDiscPct / 100))) : basePrice;
                  const hasDiscount = bannerDiscPct > 0 || p.oldPrice > p.price;
                  const pct = bannerDiscPct > 0 ? bannerDiscPct : discountPct(p.price, p.oldPrice);
                  const crossedPrice = bannerDiscPct > 0 ? basePrice : p.oldPrice;
                  const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                  const name = pname(p, lang);
                  const liked = wishlist.has(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p)}
                      className="relative flex cursor-pointer flex-col rounded-2xl bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5"
                    >
                      <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-white text-stone-300">
                        {thumb ? (
                          <img loading="lazy" src={thumb} alt={name} className="h-full w-full object-contain p-2" draggable={false} onDragStart={(e) => e.preventDefault()} />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Package size={28} strokeWidth={1.3} /></div>
                        )}
                        {hasDiscount && (
                          <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">-{pct}%</span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                          className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:text-rose-500"
                        >
                          <Heart size={13} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                        </button>
                      </div>
                      <p className="mb-1 line-clamp-2 min-h-[2.2em] text-xs font-medium text-stone-800 sm:text-sm">{name}</p>
                      <p className="text-xs font-semibold text-stone-900 sm:text-sm">{fmtMoney(finalPrice)} <span className="text-[10px] font-normal text-stone-400">{t.common.uzs}</span></p>
                      {hasDiscount && <p className="mb-2 text-[11px] text-stone-400 line-through">{fmtMoney(crossedPrice)}</p>}
                      <AddToCartControl
                        qty={inCart}
                        soldOut={soldOut}
                        size="sm"
                        onIncrease={(e) => { e.stopPropagation(); addToCart(p, bannerDiscPct); }}
                        onDecrease={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                        emptyContent={<Plus size={15} />}
                        emptyClassName="mt-auto flex h-9 items-center justify-center rounded-full border border-stone-300 text-stone-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suzuvchi orqaga qaytish + navigatsiya paneli */}
          <div className="fixed inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
            <button
              onClick={() => { setBannerPageOpen(false); setBannerCollection(null); }}
              aria-label="Orqaga"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
              <button onClick={() => { setBannerPageOpen(false); setBannerCollection(null); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Home size={20} />
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{wishlistItems.length}</span>
                )}
              </button>
              <button onClick={() => setCartOpen(true)} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${cartCount > 0 ? "bg-rose-50 text-rose-500" : "text-stone-500 hover:bg-rose-50"}`}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{cartCount}</span>
                )}
              </button>
              <button onClick={openProfile} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <UserRound size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategoriyalar + brendlar to'liq sahifasi — pastki panelning kategoriya (grid) tugmasidan ochiladi */}
      {categoriesPageOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-[5px] pb-28 pt-5 min-[769px]:px-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl font-bold text-stone-900 sm:text-3xl">{t.store.navCategories}</h1>
              <button onClick={() => setCategoriesPageOpen(false)} className="rounded-full p-2 text-stone-400 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="mb-5 flex gap-2 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setCategoriesPageTab("categories")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${categoriesPageTab === "categories" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
              >
                {t.store.navCategories}
              </button>
              <button
                onClick={() => setCategoriesPageTab("brands")}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${categoriesPageTab === "brands" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
              >
                {t.store.brandsTitle}
              </button>
            </div>

            {categoriesPageTab === "categories" ? (
              categories.length === 0 ? (
                <EmptyState icon={LayoutGrid} text={t.store.noProducts} />
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {categories.map((c) => {
                    const thumb = itemThumb(c, products, "category");
                    return (
                      <button
                        key={c.id}
                        onClick={() => openCategoryPage(c.name)}
                        className="flex flex-col items-center gap-2"
                      >
                        <span
                          className="flex h-20 w-20 items-center justify-center rounded-2xl p-[3px] transition-transform duration-200 hover:-translate-y-0.5 sm:h-24 sm:w-24"
                          style={{
                            background: "linear-gradient(145deg, #ffffff, #d6d6d6)",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.9)",
                          }}
                        >
                          <span
                            className="flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-rose-50"
                            style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.12), inset 0 -1px 2px rgba(255,255,255,0.8)" }}
                          >
                            {thumb ? (
                              <img loading="lazy" src={thumb} alt={c.name} className="h-full w-full object-cover" />
                            ) : (
                              <Package size={26} className="text-stone-400" />
                            )}
                          </span>
                        </span>
                        <span className="max-w-[92px] truncate text-center text-xs font-medium text-stone-700 sm:text-sm">{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              )
            ) : brands.length === 0 ? (
              <EmptyState icon={Tag} text={t.store.noProducts} />
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {brands.map((b) => {
                  const thumb = itemThumb(b, products, "brand");
                  return (
                    <button
                      key={b.id}
                      onClick={() => openBrandPage(b.name)}
                      className="flex flex-col items-center gap-2"
                    >
                      <span
                        className="flex h-20 w-20 items-center justify-center rounded-full p-[3px] transition-transform duration-200 hover:-translate-y-0.5 sm:h-24 sm:w-24"
                        style={{
                          background: "linear-gradient(145deg, #ffffff, #d6d6d6)",
                          boxShadow: "0 8px 16px rgba(0,0,0,0.14), 0 2px 4px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.9)",
                        }}
                      >
                        <span
                          className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white"
                          style={{ boxShadow: "inset 0 2px 4px rgba(0,0,0,0.12), inset 0 -1px 2px rgba(255,255,255,0.8)" }}
                        >
                          {thumb ? (
                            <img loading="lazy" src={thumb} alt={b.name} className="h-full w-full object-cover" />
                          ) : (
                            <Tag size={26} className="text-stone-400" />
                          )}
                        </span>
                      </span>
                      <span className="max-w-[92px] truncate text-center text-sm font-bold text-stone-800 sm:text-base">{b.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Suzuvchi orqaga qaytish + navigatsiya paneli */}
          <div className="fixed inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setCategoriesPageOpen(false)}
              aria-label="Orqaga"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
              <button onClick={() => { setCategoriesPageOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Home size={20} />
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{wishlistItems.length}</span>
                )}
              </button>
              <button onClick={() => setCartOpen(true)} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${cartCount > 0 ? "bg-rose-50 text-rose-500" : "text-stone-500 hover:bg-rose-50"}`}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{cartCount}</span>
                )}
              </button>
              <button onClick={openProfile} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <UserRound size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Qidiruv sahifasi — mobil qidiruv inputiga bosilganda ochiladi. Yozilgan zahoti natijalar shu sahifaning o'zida (mahsulot kartochkalari bilan) ko'rinadi. */}
      {searchPageOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-4 pb-28 pt-5 min-[769px]:px-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) addSearchHistory(search); }}
                  placeholder={t.store.searchPh}
                  className="w-full rounded-full bg-gray-100 py-3 pl-11 pr-9 text-sm outline-none focus:bg-gray-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Tozalash"
                    className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-stone-300 text-white hover:bg-stone-400"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSearchPageOpen(false); setSearch(""); }}
                className="shrink-0 text-sm font-semibold text-stone-700 hover:text-rose-500"
              >
                {t.common.cancel}
              </button>
            </div>

            {searchPageLower ? (
              searchPageResults.length === 0 ? (
                <EmptyState icon={Package} text={t.store.noProducts} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {searchPageResults.map((p) => {
                    const inCart = cart[p.id] || 0;
                    const stockType = p.stockType || "limited";
                    const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
                    const hasDiscount = p.oldPrice > p.price;
                    const pct = discountPct(p.price, p.oldPrice);
                    const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                    const name = pname(p, lang);
                    const liked = wishlist.has(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="relative flex cursor-pointer flex-col rounded-2xl bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5"
                      >
                        <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-white text-stone-300">
                          {thumb ? (
                            <img loading="lazy" src={thumb} alt={name} className="h-full w-full object-contain p-2" draggable={false} onDragStart={(e) => e.preventDefault()} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><Package size={28} strokeWidth={1.3} /></div>
                          )}
                          {hasDiscount && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">-{pct}%</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:text-rose-500"
                          >
                            <Heart size={13} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                          </button>
                        </div>
                        {p.brand && <p className="text-[10px] font-medium uppercase tracking-wide text-rose-500">{p.brand}</p>}
                        <p className="mb-1 line-clamp-2 min-h-[2.2em] text-xs font-medium text-stone-800 sm:text-sm">{name}</p>
                        <p className="text-xs font-semibold text-stone-900 sm:text-sm">{fmtMoney(p.price)} <span className="text-[10px] font-normal text-stone-400">{t.common.uzs}</span></p>
                        {hasDiscount && <p className="mb-2 text-[11px] text-stone-400 line-through">{fmtMoney(p.oldPrice)}</p>}
                        <AddToCartControl
                          qty={inCart}
                          soldOut={soldOut}
                          size="sm"
                          onIncrease={(e) => { e.stopPropagation(); addToCart(p); }}
                          onDecrease={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                          emptyContent={<Plus size={15} />}
                          emptyClassName="mt-auto flex h-9 items-center justify-center rounded-full border border-stone-200 text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <>
                {searchHistory.length > 0 && (
                  <div className="mb-6">
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-semibold text-stone-800">{t.store.searchHistory}</h2>
                      <button onClick={clearSearchHistory} className="text-xs font-medium text-stone-400 hover:text-rose-500">{t.store.clearHistory}</button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((h, i) => (
                        <button
                          key={i}
                          onClick={() => pickSearchTerm(h)}
                          className="flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50"
                        >
                          <Clock size={13} className="text-stone-400" /> {h}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {categories.length > 0 && (
                  <div>
                    <h2 className="mb-3 text-sm font-semibold text-stone-800">{t.store.categoriesLabel}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map((c) => {
                        const thumb = itemThumb(c, products, "category");
                        return (
                          <button
                            key={c.id}
                            onClick={() => pickSearchTerm(c.name)}
                            className="flex items-center gap-3 rounded-xl border border-stone-200 p-2 text-left transition hover:bg-stone-50"
                          >
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100">
                              {thumb ? (
                                <img loading="lazy" src={thumb} alt={c.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package size={18} className="text-stone-400" />
                              )}
                            </span>
                            <span className="truncate text-sm font-medium text-rose-600">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Suzuvchi navigatsiya paneli */}
          <div className="fixed inset-x-0 bottom-4 z-10 flex items-center justify-center">
            <div className="flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
              <button onClick={() => { setSearchPageOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Home size={20} />
              </button>
              <button className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-white">
                <Search size={20} />
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{wishlistItems.length}</span>
                )}
              </button>
              <button onClick={() => setCartOpen(true)} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${cartCount > 0 ? "bg-rose-50 text-rose-500" : "text-stone-500 hover:bg-rose-50"}`}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{cartCount}</span>
                )}
              </button>
              <button onClick={openProfile} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <UserRound size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kategoriya sahifasi — banner ostidagi "Kategoriyalar" qatoridan bosilganda ochiladi: tepada rasmli banner + nomi, qidiruv, saralash va filtr */}
      {categoryPageOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto pb-28">
            <div className="relative h-40 w-full overflow-hidden rounded-b-[28px] bg-rose-100 sm:h-52">
              {categoryPageHeroImg ? (
                <img loading="lazy" src={categoryPageHeroImg} alt={categoryPageName || ""} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center"><Package size={40} className="text-rose-300" /></div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <button
                onClick={() => setCategoryPageOpen(false)}
                className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-sm hover:bg-white"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="absolute bottom-4 left-5 right-5 text-2xl font-bold text-white sm:text-3xl">
                {categoryPageName}
              </h1>
            </div>

            <div className="px-4 pt-4 min-[769px]:px-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    value={categoryPageSearch}
                    onChange={(e) => setCategoryPageSearch(e.target.value)}
                    placeholder={t.store.searchPh}
                    className="w-full rounded-full bg-gray-100 py-3 pl-10 pr-4 text-sm outline-none focus:bg-gray-50"
                  />
                </div>
                <button onClick={() => setSortModalOpen(true)} aria-label={t.store.sortTitle} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-stone-600 hover:bg-gray-50">
                  <SlidersHorizontal size={17} />
                </button>
                <button onClick={openFilterModal} aria-label={t.store.filtersTitle} className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-stone-600 hover:bg-gray-50">
                  <Filter size={17} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-semibold text-white">{activeFilterCount}</span>
                  )}
                </button>
              </div>

              {categoryPageResults.length === 0 ? (
                <EmptyState icon={Package} text={t.store.noProducts} />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {categoryPageResults.map((p) => {
                    const inCart = cart[p.id] || 0;
                    const stockType = p.stockType || "limited";
                    const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
                    const hasDiscount = p.oldPrice > p.price;
                    const pct = discountPct(p.price, p.oldPrice);
                    const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                    const name = pname(p, lang);
                    const liked = wishlist.has(p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className="relative flex cursor-pointer flex-col rounded-2xl bg-white p-2.5 shadow-sm transition hover:-translate-y-0.5"
                      >
                        <div className="relative mb-2.5 aspect-square overflow-hidden rounded-xl bg-white text-stone-300">
                          {thumb ? (
                            <img loading="lazy" src={thumb} alt={name} className="h-full w-full object-contain p-2" draggable={false} onDragStart={(e) => e.preventDefault()} />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><Package size={28} strokeWidth={1.3} /></div>
                          )}
                          {hasDiscount && (
                            <span className="absolute left-1.5 top-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600">-{pct}%</span>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm transition hover:text-rose-500"
                          >
                            <Heart size={13} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                          </button>
                        </div>
                        {p.brand && <p className="text-[10px] font-medium uppercase tracking-wide text-rose-500">{p.brand}</p>}
                        <p className="mb-1 line-clamp-2 min-h-[2.2em] text-xs font-medium text-stone-800 sm:text-sm">{name}</p>
                        <p className="text-xs font-semibold text-stone-900 sm:text-sm">{fmtMoney(p.price)} <span className="text-[10px] font-normal text-stone-400">{t.common.uzs}</span></p>
                        {hasDiscount && <p className="mb-2 text-[11px] text-stone-400 line-through">{fmtMoney(p.oldPrice)}</p>}
                        <AddToCartControl
                          qty={inCart}
                          soldOut={soldOut}
                          size="sm"
                          onIncrease={(e) => { e.stopPropagation(); addToCart(p); }}
                          onDecrease={(e) => { e.stopPropagation(); changeQty(p.id, -1); }}
                          emptyContent={<Plus size={15} />}
                          emptyClassName="mt-auto flex h-9 items-center justify-center rounded-full border border-stone-200 text-stone-800 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Suzuvchi orqaga qaytish + navigatsiya paneli */}
          <div className="fixed inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
            <button
              onClick={() => setCategoryPageOpen(false)}
              aria-label="Orqaga"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg transition hover:bg-rose-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
              <button onClick={() => { setCategoryPageOpen(false); setCategoriesPageOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Home size={20} />
              </button>
              <button onClick={() => setWishlistOpen(true)} className="relative flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <Heart size={20} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{wishlistItems.length}</span>
                )}
              </button>
              <button onClick={() => setCartOpen(true)} className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${cartCount > 0 ? "bg-rose-50 text-rose-500" : "text-stone-500 hover:bg-rose-50"}`}>
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{cartCount}</span>
                )}
              </button>
              <button onClick={openProfile} className="flex h-11 w-11 items-center justify-center rounded-full text-stone-500 hover:bg-rose-50">
                <UserRound size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saralash oynasi */}
      {sortModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40" onClick={() => setSortModalOpen(false)}>
          <div className="max-h-[75vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-white p-5 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-900">{t.store.sortTitle}</h3>
              <button onClick={() => setSortModalOpen(false)} className="rounded-full p-1.5 text-stone-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="space-y-1">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => { setCategoryPageSort(opt.key); setSortModalOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-gray-50"
                >
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${categoryPageSort === opt.key ? "border-rose-500" : "border-stone-300"}`}>
                    {categoryPageSort === opt.key && <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />}
                  </span>
                  <span className="text-sm text-stone-700">{lang === "ru" ? opt.ru : opt.uz}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtrlar oynasi — Narx va Brend to'liq ishlaydi, qolgan mezonlar hozircha ma'lumot bazasida yo'q */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40" onClick={() => setFilterModalOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-[28px] bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-semibold text-stone-900">{t.store.filtersTitle}</h3>
              <button onClick={() => setFilterModalOpen(false)} className="rounded-full p-1.5 text-stone-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <div className="border-b border-gray-100">
                <button
                  onClick={() => setFilterExpanded(filterExpanded === "price" ? null : "price")}
                  className="flex w-full items-center justify-between py-3 text-sm font-semibold text-stone-800"
                >
                  {t.common.uzs} {t.store.priceLabel}
                  <ChevronDown size={16} className={`text-stone-400 transition-transform ${filterExpanded === "price" ? "rotate-180" : ""}`} />
                </button>
                {filterExpanded === "price" && (
                  <div className="flex items-start gap-2 pb-4">
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] text-stone-400">{t.store.minPriceLabel}</label>
                      <input
                        type="number"
                        value={draftPriceMin}
                        onChange={(e) => setDraftPriceMin(e.target.value)}
                        placeholder={String(categoryPagePriceBounds.min)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-300"
                      />
                    </div>
                    <span className="mt-6 text-stone-300">—</span>
                    <div className="w-full">
                      <label className="mb-1 block text-[11px] text-stone-400">{t.store.maxPriceLabel}</label>
                      <input
                        type="number"
                        value={draftPriceMax}
                        onChange={(e) => setDraftPriceMax(e.target.value)}
                        placeholder={String(categoryPagePriceBounds.max)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-rose-300"
                      />
                    </div>
                  </div>
                )}
              </div>

              {FILTER_DIMENSIONS.map((dim) => (
                <div key={dim.key} className="border-b border-gray-100">
                  <button
                    onClick={() => setFilterExpanded(filterExpanded === dim.key ? null : dim.key)}
                    className="flex w-full items-center justify-between py-3 text-sm font-medium text-stone-700"
                  >
                    {lang === "ru" ? dim.ru : dim.uz}
                    <ChevronDown size={16} className={`text-stone-400 transition-transform ${filterExpanded === dim.key ? "rotate-180" : ""}`} />
                  </button>
                  {filterExpanded === dim.key && (
                    <div className="pb-3">
                      {dim.functional && dim.key === "brand" ? (
                        categoryPageBrands.length === 0 ? (
                          <p className="text-xs text-stone-400">{t.store.comingSoon}</p>
                        ) : (
                          <div className="space-y-2">
                            {categoryPageBrands.map((b) => (
                              <label key={b} className="flex items-center gap-2.5 text-sm text-stone-700">
                                <input
                                  type="checkbox"
                                  checked={draftBrandFilter.includes(b)}
                                  onChange={() => toggleDraftBrand(b)}
                                  className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                                />
                                {b}
                              </label>
                            ))}
                          </div>
                        )
                      ) : dim.functional && dim.key === "category" ? (
                        categoryPageCategories.length === 0 ? (
                          <p className="text-xs text-stone-400">{t.store.comingSoon}</p>
                        ) : (
                          <div className="space-y-2">
                            {categoryPageCategories.map((c) => (
                              <label key={c} className="flex items-center gap-2.5 text-sm text-stone-700">
                                <input
                                  type="checkbox"
                                  checked={draftCategoryFilter.includes(c)}
                                  onChange={() => toggleDraftCategory(c)}
                                  className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                                />
                                {c}
                              </label>
                            ))}
                          </div>
                        )
                      ) : dim.functional && EXTRA_FILTER_KEYS.includes(dim.key) ? (
                        (categoryPageExtraOptions[dim.key] || []).length === 0 ? (
                          <p className="text-xs text-stone-400">{t.store.comingSoon}</p>
                        ) : (
                          <div className="space-y-2">
                            {categoryPageExtraOptions[dim.key].map((v) => (
                              <label key={v} className="flex items-center gap-2.5 text-sm text-stone-700">
                                <input
                                  type="checkbox"
                                  checked={(draftExtraFilters[dim.key] || []).includes(v)}
                                  onChange={() => toggleDraftExtra(dim.key, v)}
                                  className="h-4 w-4 rounded border-gray-300 text-rose-500 focus:ring-rose-400"
                                />
                                {v}
                              </label>
                            ))}
                          </div>
                        )
                      ) : (
                        <p className="text-xs text-stone-400">{t.store.comingSoon}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 border-t border-gray-100 px-5 py-4">
              <button onClick={() => setFilterModalOpen(false)} className="flex-1 rounded-full bg-gray-100 py-3 text-sm font-semibold text-stone-700 hover:bg-gray-200">
                {t.common.cancel}
              </button>
              <button onClick={applyFilters} className="flex-1 rounded-full bg-[#C4106A] py-3 text-sm font-semibold text-white hover:bg-[#a80d59]">
                {t.store.applyBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist drawer — mahsulot kartochkasi kabi pastdan chiqadigan varaq */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={() => setWishlistOpen(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            style={wishlistSwipe.sheetStyle}
            onClick={e => e.stopPropagation()}
          >
            <div className="cursor-grab touch-none active:cursor-grabbing" {...wishlistSwipe.dragHandleProps}>
              <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800">{t.store.wishlist}</h3>
                <button onClick={() => setWishlistOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {wishlistItems.length === 0 ? (
                <EmptyState icon={Heart} text={t.store.wishlistEmpty} />
              ) : (
                <div className="space-y-3">
                  {wishlistItems.map(p => {
                    const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                    return (
                      <div key={p.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 p-2.5 shadow-sm transition hover:shadow-md">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50 text-slate-300">
                          {thumb ? (
                            <img loading="lazy" src={thumb} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center"><Package size={20} /></div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          {p.brand && <p className="text-[10px] font-medium uppercase tracking-wide text-rose-400">{p.brand}</p>}
                          <p className="truncate text-sm font-medium text-slate-700">{pname(p, lang)}</p>
                          <p className="text-sm font-semibold text-slate-800">{fmtMoney(p.price)} <span className="text-xs font-normal text-slate-400">{t.common.uzs}</span></p>
                        </div>
                        <div className="flex shrink-0 flex-col items-center gap-1.5">
                          <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:bg-gray-200">
                            <Plus size={14} />
                          </button>
                          <button onClick={() => toggleWishlist(p.id)} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-300 hover:bg-gray-50 hover:text-rose-500">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Mijoz qaysi bo'limda ekanini bilib turishi va boshqa bo'limga tez o'tishi uchun — asosiy pastki navigatsiyaning o'zi */}
            <div className="flex items-center justify-center gap-1 border-t border-gray-100 px-5 py-3">
              {[
                { key: "home", icon: Home, onClick: () => { setWishlistOpen(false); setActiveNavTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
                { key: "wishlist", icon: Heart, onClick: () => {}, badge: wishlistItems.length },
                { key: "cart", icon: ShoppingCart, onClick: () => { setWishlistOpen(false); setActiveNavTab("cart"); setCartOpen(true); }, badge: cartCount },
                { key: "profile", icon: UserRound, onClick: () => { setWishlistOpen(false); setActiveNavTab("profile"); openProfile(); } },
              ].map(({ key, icon: Icon, onClick, badge }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${key === "wishlist" ? "bg-rose-500 text-white" : "text-stone-500 hover:bg-rose-50"}`}
                >
                  <Icon size={20} />
                  {!!badge && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Telefon bilan kirish/ro'yxatdan o'tish ekrani — Profil bosilganda, hali telefon bog'lanmagan bo'lsa */}
      {phoneLoginOpen && (
        <div className="fixed inset-0 z-[55] flex flex-col bg-white">
          {otpStep === "phone" ? (
            <>
              <div className="flex flex-1 flex-col justify-end px-6 pb-8">
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-3xl font-semibold leading-tight text-stone-900">
                  {t.store.profile.loginTitle}
                </h2>
                <p className="mb-3 mt-4 text-sm text-stone-500">{t.store.profile.loginSubtitle}</p>
                <PhoneInput
                  value={phoneInput}
                  onChange={setPhoneInput}
                  autoFocus
                  className="w-full rounded-2xl border-none bg-gray-100 px-4 py-4 text-base text-stone-800 outline-none focus:ring-2 focus:ring-rose-200"
                />
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-xs text-stone-500">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300"
                  />
                  <span>{t.store.profile.termsText}</span>
                </label>
                {otpError && <p className="mt-3 text-xs text-rose-600">{otpError}</p>}
              </div>
              <div className="flex items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+20px)]">
                <button
                  onClick={() => setPhoneLoginOpen(false)}
                  aria-label="Orqaga"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gray-200 text-stone-600"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={confirmPhoneLogin}
                  disabled={!isValidUzPhone(phoneInput) || !termsAccepted}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 py-4 text-base font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
                >
                  {t.store.profile.confirmPhone}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-1 flex-col justify-end px-6 pb-8">
                <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-3xl font-semibold leading-tight text-stone-900">
                  {t.store.profile.otpTitle}
                </h2>
                <p className="mb-3 mt-4 text-sm text-stone-500">{t.store.profile.otpSubtitle}</p>
                <input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoFocus
                  placeholder="000000"
                  className="w-full rounded-2xl border-none bg-gray-100 px-4 py-4 text-center text-2xl tracking-[0.5em] text-stone-800 outline-none focus:ring-2 focus:ring-rose-200"
                />
                {otpError && <p className="mt-3 text-xs text-rose-600">{otpError}</p>}
                <button
                  onClick={confirmPhoneLogin}
                  disabled={otpSending}
                  className="mt-4 text-left text-xs font-medium text-rose-600 disabled:opacity-40"
                >
                  {t.store.profile.otpResend}
                </button>
              </div>
              <div className="flex items-center gap-3 px-6 pb-[calc(env(safe-area-inset-bottom)+20px)]">
                <button
                  onClick={() => setOtpStep("phone")}
                  aria-label="Orqaga"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gray-200 text-stone-600"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={verifyOtpAndLogin}
                  disabled={otpCode.length !== 6 || otpSending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 py-4 text-base font-semibold text-white transition hover:bg-rose-700 disabled:opacity-40"
                >
                  {otpSending ? <Loader2 size={18} className="animate-spin" /> : null}
                  {t.store.profile.otpConfirm}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {profileOpen && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={() => setProfileOpen(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            style={profileSwipe.sheetStyle}
            onClick={e => e.stopPropagation()}
          >
            <div className="cursor-grab touch-none active:cursor-grabbing" {...profileSwipe.dragHandleProps}>
              <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
              <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
                {profileView !== "menu" && (
                  <button onClick={() => setProfileView("menu")} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100">
                    <ArrowLeft size={18} />
                  </button>
                )}
                <h3 className="flex-1 text-base font-semibold text-slate-800">
                  {profileView === "menu" && t.store.profile.title}
                  {profileView === "personal" && t.store.profile.personalData}
                  {profileView === "orders" && t.store.profile.myOrders}
                  {profileView === "addresses" && t.store.profile.addresses}
                  {profileView === "settings" && t.store.profile.settings}
                </h3>
                <button onClick={() => setProfileOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* ===== ASOSIY MENYU ===== */}
              {profileView === "menu" && (
                <>
                  <div className="mb-5 flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                      <UserRound size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : (myName || myPhone || "—")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {tgUser?.username ? `@${tgUser.username}` : (myPhone || t.store.profile.notLinked)}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-rose-700">
                      <Wallet size={16} /> {t.store.bonusLabel}
                    </span>
                    <span className="text-sm font-bold text-rose-600">{fmtMoney(myBonus)} {t.common.uzs}</span>
                  </div>

                  <div className="space-y-1">
                    {[
                      { key: "personal", icon: UserRound, label: t.store.profile.personalData },
                      { key: "orders", icon: ClipboardList, label: t.store.profile.myOrders },
                      { key: "addresses", icon: MapPin, label: t.store.profile.addresses },
                      { key: "settings", icon: SettingsIcon, label: t.store.profile.settings },
                    ].map(({ key, icon: Icon, label }) => (
                      <button
                        key={key}
                        onClick={() => setProfileView(key)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-gray-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                          <Icon size={17} />
                        </span>
                        <span className="flex-1 text-sm font-medium text-slate-700">{label}</span>
                        <ChevronRight size={16} className="text-slate-300" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ===== SHAXSIY MA'LUMOTLAR ===== */}
              {profileView === "personal" && (
                <>
                  <h4 className="mb-1 text-sm font-semibold text-slate-700">{t.store.profile.yourName}</h4>
                  <button
                    onClick={() => openEditModal("name")}
                    className="mb-4 block w-full rounded-xl bg-gray-100 px-4 py-3 text-left text-sm text-slate-700 hover:bg-gray-200"
                  >
                    {myName || (tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : "") || <span className="text-slate-400">...</span>}
                  </button>

                  {!myEmail && (
                    <p className="mb-2 text-xs font-medium text-rose-600">{t.store.profile.emailRequired}</p>
                  )}
                  <button
                    onClick={() => openEditModal("email")}
                    className="mb-4 block w-full rounded-xl bg-gray-100 px-4 py-3 text-left text-sm text-slate-700 hover:bg-gray-200"
                  >
                    {myEmail || <span className="text-slate-400">&nbsp;</span>}
                  </button>

                  <h4 className="mb-1 text-sm font-semibold text-slate-700">{t.store.profile.phone}</h4>
                  {myPhone ? (
                    <div className="block w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-amber-700">
                      {myPhone}
                    </div>
                  ) : (
                    <div>
                      <p className="mb-2 text-xs text-slate-400">{t.store.profile.addPhoneNote}</p>
                      <div className="flex gap-2">
                        <PhoneInput value={phoneInput} onChange={setPhoneInput} />
                        <button
                          onClick={saveMyPhone}
                          disabled={savingPhone || !isValidUzPhone(phoneInput)}
                          className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {savingPhone ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          {t.store.profile.savePhone}
                        </button>
                      </div>
                      {phoneSaved && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-rose-600">
                          <CheckCircle2 size={13} /> {t.store.profile.phoneSaved}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Ism / Email tahrirlash oynasi — bosilganda pastdan chiqadi */}
              {editField && (
                <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 sm:items-center" onClick={() => setEditField(null)}>
                  <div className="w-full max-w-sm rounded-t-[28px] bg-white p-5 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {editField === "name" ? t.store.profile.yourName : t.store.profile.emailLabel}
                      </h3>
                      <button onClick={() => setEditField(null)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100">
                        <X size={18} />
                      </button>
                    </div>
                    <input
                      autoFocus
                      type={editField === "email" ? "email" : "text"}
                      value={editInput}
                      onChange={(e) => setEditInput(e.target.value)}
                      placeholder={editField === "name" ? t.store.profile.namePlaceholder : t.store.profile.emailPlaceholder}
                      className="mb-4 w-full rounded-xl bg-gray-100 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                    />
                    <button
                      onClick={saveEditField}
                      disabled={savingEdit || !editInput.trim()}
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-rose-600 py-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                    >
                      {savingEdit && <Loader2 size={14} className="animate-spin" />}
                      {t.store.profile.applyLabel}
                    </button>
                  </div>
                </div>
              )}

              {/* ===== BUYURTMALARIM ===== */}
              {profileView === "orders" && (
                <div>
                  {myOrdersLoading ? (
                    <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
                      <Loader2 size={15} className="animate-spin" /> {t.store.profile.loading}
                    </div>
                  ) : myOrders.length === 0 ? (
                    <EmptyState icon={ClipboardList} text={t.store.profile.noOrders} />
                  ) : (
                    <div className="space-y-2">
                      {myOrders
                        .slice()
                        .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
                        .map((o) => (
                          <ProfileOrderCard
                            key={o.id}
                            order={o}
                            t={t}
                            reviewedKeys={reviewedKeys}
                            onReview={(order, item) => setReviewModal({ order, item })}
                          />
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* ===== YETKAZIB BERISH MANZILLARI ===== */}
              {profileView === "addresses" && (
                <div>
                  <p className="mb-3 text-xs text-slate-400">{t.store.profile.deliveryAddressNote}</p>

                  {myAddresses.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {myAddresses.map((addr) => (
                        <div key={addr.id} className="flex items-start gap-2 rounded-xl border border-gray-100 p-3 text-xs text-slate-600">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-rose-400" />
                          <div className="min-w-0 flex-1">
                            <p className="break-words">{addr.text}</p>
                            {addr.lat != null && addr.lng != null && (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-600">
                                <CheckCircle2 size={11} /> {t.store.locationSet}
                              </p>
                            )}
                          </div>
                          <button onClick={() => openAddressForm(addr)} className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => deleteMyAddress(addr.id)} className="shrink-0 rounded-lg p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {addressFormOpen ? (
                    <div className="rounded-xl border border-gray-100 p-3">
                      <h4 className="mb-1 text-sm font-semibold text-slate-700">
                        {editingAddressId ? t.store.profile.editAddress : t.store.profile.deliveryAddress}
                      </h4>
                      <textarea
                        value={newAddressText}
                        onChange={(e) => setNewAddressText(e.target.value)}
                        placeholder={t.store.profile.addressPh}
                        rows={3}
                        autoFocus
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAddressMap(v => !v)}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50"
                      >
                        <MapPin size={14} /> {t.store.mapPick}
                      </button>
                      {showAddressMap && (
                        <div className="mt-2">
                          <p className="mb-1.5 text-[11px] text-slate-400">{t.store.mapPickNote}</p>
                          <MapPicker value={newAddressLocation} onChange={setNewAddressLocation} />
                          <button
                            type="button"
                            onClick={() => setShowAddressMap(false)}
                            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                          >
                            <CheckCircle2 size={14} /> {t.store.applyBtn}
                          </button>
                        </div>
                      )}
                      {newAddressLocation && (
                        <p className="mt-2 flex items-center gap-1 text-xs text-rose-600">
                          <CheckCircle2 size={13} /> {t.store.locationSet}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={closeAddressForm}
                          className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100"
                        >
                          {t.common.cancel}
                        </button>
                        <button
                          onClick={saveMyAddress}
                          disabled={savingAddress || !newAddressText.trim()}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          {savingAddress ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          {t.store.profile.saveAddress}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openAddressForm(null)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <Plus size={15} /> {t.store.profile.addAddress}
                    </button>
                  )}
                </div>
              )}

              {/* ===== SOZLAMALAR ===== */}
              {profileView === "settings" && (
                <div className="space-y-1">
                  <button
                    onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-500">
                      <Globe size={17} />
                    </span>
                    <span className="flex-1 text-sm font-medium text-slate-700">{t.store.profile.language}</span>
                    <span className="text-xs font-medium text-slate-400">{lang === "uz" ? "O'zbek" : "Русский"}</span>
                  </button>

                  {!!myPhone && (
                    <button
                      onClick={logoutProfile}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-200 py-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut size={16} /> {t.store.logout}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mijoz qaysi bo'limda ekanini bilib turishi va boshqa bo'limga tez o'tishi uchun — asosiy pastki navigatsiyaning o'zi */}
            <div className="flex items-center justify-center gap-1 border-t border-gray-100 px-5 py-3">
              {[
                { key: "home", icon: Home, onClick: () => { setProfileOpen(false); setActiveNavTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
                { key: "wishlist", icon: Heart, onClick: () => { setProfileOpen(false); setActiveNavTab("wishlist"); setWishlistOpen(true); }, badge: wishlistItems.length },
                { key: "cart", icon: ShoppingCart, onClick: () => { setProfileOpen(false); setActiveNavTab("cart"); setCartOpen(true); }, badge: cartCount },
                { key: "profile", icon: UserRound, onClick: () => {} },
              ].map(({ key, icon: Icon, onClick, badge }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${key === "profile" ? "bg-rose-500 text-white" : "text-stone-500 hover:bg-rose-50"}`}
                >
                  <Icon size={20} />
                  {!!badge && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4" onClick={() => setCartOpen(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-sm flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
            style={cartSwipe.sheetStyle}
            onClick={e => e.stopPropagation()}
          >
            <div className="cursor-grab touch-none active:cursor-grabbing" {...cartSwipe.dragHandleProps}>
              <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" />
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h3 className="text-base font-semibold text-slate-800">{t.store.cart}</h3>
                <button onClick={() => setCartOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2.5 text-xs">
                <button
                  onClick={deleteSelectedCartItems}
                  disabled={selectedCartIds.size === 0}
                  className="flex items-center gap-1 font-medium text-slate-500 hover:text-rose-600 disabled:opacity-40"
                >
                  <X size={13} /> {t.store.cartDeleteSelected} ({selectedCartIds.size})
                </button>
                <label className="flex items-center gap-2 font-medium text-slate-500">
                  {t.store.cartSelectAll}
                  <Toggle checked={allCartSelected} onChange={toggleSelectAllCart} />
                </label>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <EmptyState icon={ShoppingCart} text={t.store.cartEmpty} />
              ) : (
                <div className="space-y-3">
                  {cartGroups.map(({ tag, items }) => {
                    const groupQty = items.reduce((s, i) => s + i.qty, 0);
                    const groupSubtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
                    const expanded = expandedCartGroups.has(tag);
                    return (
                      <div key={tag} className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <button onClick={() => toggleCartGroupExpand(tag)} className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-semibold text-stone-900">{tag}</p>
                            <p className="text-xs text-stone-500">{items.length} {t.common.ta}</p>
                          </button>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm font-semibold text-stone-800">{fmtMoney(groupSubtotal)} {t.common.uzs}</span>
                            <button onClick={() => removeCartGroup(items)} className="rounded-lg p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {expanded && (
                          <div className="mt-2 space-y-2 border-t border-rose-200 pt-2">
                            {items.map(({ product, qty, unitPrice, discPct }) => {
                              const thumb = (product.imageUrls && product.imageUrls[0]) || product.imageUrl || "";
                              return (
                                <div key={product.id} className="flex items-center gap-2.5 rounded-xl bg-white p-1.5">
                                  <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                                    {thumb ? (
                                      <img loading="lazy" src={thumb} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className="flex h-full w-full items-center justify-center"><Package size={14} /></div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium text-stone-600">{pname(product, lang)}</p>
                                    <p className="text-[11px] text-stone-400">
                                      {fmtMoney(unitPrice)} {t.common.uzs}
                                      {discPct > 0 && <span className="ml-1 line-through text-stone-300">{fmtMoney(product.price)}</span>}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white p-0.5">
                                    <button onClick={() => changeQty(product.id, -1)} className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-gray-100"><Minus size={11} /></button>
                                    <span className="w-4 text-center text-xs font-medium">{qty}</span>
                                    <button onClick={() => changeQty(product.id, 1)} disabled={product.stockType === "limited" && qty >= product.stock} className="flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-gray-100 disabled:opacity-40"><Plus size={11} /></button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {cartSingles.map(({ product, qty, unitPrice, discPct }) => {
                    const thumb = (product.imageUrls && product.imageUrls[0]) || product.imageUrl || "";
                    const checked = selectedCartIds.has(product.id);
                    return (
                      <div key={product.id} className="rounded-2xl border border-gray-100 p-2.5 shadow-sm transition hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-50 text-slate-300">
                            {thumb ? (
                              <img loading="lazy" src={thumb} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center"><Package size={20} /></div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                {product.brand && <p className="text-[10px] font-medium uppercase tracking-wide text-rose-400">{product.brand}</p>}
                                <p className="line-clamp-2 text-sm font-medium text-slate-700">{pname(product, lang)}</p>
                              </div>
                              <button
                                onClick={() => toggleCartItemSelected(product.id)}
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${checked ? "border-rose-600 bg-rose-600 text-white" : "border-gray-300 bg-white text-transparent"}`}
                              >
                                <Check size={13} strokeWidth={3} />
                              </button>
                            </div>

                            {discPct > 0 && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs">
                                <span className="text-slate-300 line-through">{fmtMoney(product.price)} {t.common.uzs}</span>
                                <span className="font-semibold text-emerald-600">-{discPct}%</span>
                              </p>
                            )}

                            <div className="mt-1.5 flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {fmtMoney(unitPrice)} {t.common.uzs} <span className="text-xs font-normal text-slate-400">{t.store.cartPerItem}</span>
                              </p>
                              <div className="flex shrink-0 items-center gap-1 rounded-full border border-gray-200 bg-white p-1">
                                <button onClick={() => changeQty(product.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-gray-100"><Minus size={12} /></button>
                                <span className="w-5 text-center text-xs font-semibold">{qty}</span>
                                <button onClick={() => changeQty(product.id, 1)} disabled={product.stockType === "limited" && qty >= product.stock} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-gray-100 disabled:opacity-30"><Plus size={12} /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {cartItems.length > 0 && (
                <>
                  {/* Promo kod */}
                  <div className="mt-4">
                    {appliedPromo ? (
                      <div className="flex items-center justify-between rounded-full bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-700">
                        <span className="flex items-center gap-1.5"><CheckCircle2 size={14} /> {appliedPromo.code} {t.store.promoApplied}</span>
                        <button onClick={removePromoCode} className="text-emerald-600 underline hover:text-emerald-800">{t.store.promoRemove}</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder={t.store.promoPh}
                          className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:bg-white"
                        />
                        <button
                          onClick={applyPromoCode}
                          disabled={checkingPromo || !promoInput.trim()}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                        >
                          {checkingPromo ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        </button>
                      </div>
                    )}
                    {promoError && <p className="mt-1.5 px-1 text-xs text-rose-500">{promoError}</p>}
                  </div>

                  {/* Xulosa — FAQAT belgilangan (checkbox bosilgan) mahsulotlar bo'yicha */}
                  <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-4 text-sm">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{selectedCartCount} {t.store.cartItemsLabel}</span>
                      <span>{fmtMoney(selectedCartTotal)} {t.common.uzs}</span>
                    </div>
                    {appliedPromo && selectedPromoDiscount > 0 && (
                      <div className="flex items-center justify-between text-rose-600">
                        <span>{t.store.promoApplied} ({appliedPromo.code})</span>
                        <span>-{fmtMoney(selectedPromoDiscount)} {t.common.uzs}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 text-base font-bold text-slate-800">
                      <span>{t.store.total}</span>
                      <span>{fmtMoney(selectedCartTotalAfterDiscount)} {t.common.uzs}</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">{t.store.cartDeliveryNote}</p>

                  {/* Sizga qiziq bo'lishi mumkin */}
                  {cartRecommendedProducts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="mb-3 text-sm font-semibold text-slate-800">{t.store.cartRecommended}</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
                        {cartRecommendedProducts.map((p) => {
                          const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
                          const liked = wishlist.has(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => setSelectedProduct(p)}
                              className="w-32 shrink-0 cursor-pointer rounded-2xl border border-gray-100 p-2 transition hover:shadow-md"
                            >
                              <div className="relative mb-2 aspect-square overflow-hidden rounded-xl bg-gray-50 text-slate-300">
                                {thumb ? (
                                  <img loading="lazy" src={thumb} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center"><Package size={20} /></div>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-stone-400 shadow-sm hover:text-rose-500"
                                >
                                  <Heart size={12} fill={liked ? "#f43f5e" : "none"} className={liked ? "text-rose-500" : ""} />
                                </button>
                              </div>
                              <p className="line-clamp-2 text-xs font-medium text-slate-700">{pname(p, lang)}</p>
                              <p className="mt-1 text-xs font-semibold text-slate-800">{fmtMoney(p.price)} {t.common.uzs}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-gray-100 px-5 py-3">
                <button
                  onClick={startCheckout}
                  disabled={selectedCartCount === 0}
                  className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  {t.store.cartCheckoutBtn}
                </button>
              </div>
            )}

            {/* Mijoz qaysi bo'limda ekanini bilib turishi va boshqa bo'limga tez o'tishi uchun — asosiy pastki navigatsiyaning o'zi */}
            <div className="flex items-center justify-center gap-1 border-t border-gray-100 px-5 py-3">
              {[
                { key: "home", icon: Home, onClick: () => { setCartOpen(false); setActiveNavTab("home"); window.scrollTo({ top: 0, behavior: "smooth" }); } },
                { key: "wishlist", icon: Heart, onClick: () => { setCartOpen(false); setActiveNavTab("wishlist"); setWishlistOpen(true); }, badge: wishlistItems.length },
                { key: "cart", icon: ShoppingCart, onClick: () => {}, badge: cartCount },
                { key: "profile", icon: UserRound, onClick: () => { setCartOpen(false); setActiveNavTab("profile"); openProfile(); } },
              ].map(({ key, icon: Icon, onClick, badge }) => (
                <button
                  key={key}
                  onClick={onClick}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${key === "cart" ? "bg-rose-500 text-white" : "text-stone-500 hover:bg-rose-50"}`}
                >
                  <Icon size={20} />
                  {!!badge && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">{badge}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <Modal
          title={done ? t.store.success : t.store.checkout}
          onClose={resetAll}
          onBack={!done ? () => { setCheckoutOpen(false); setCartOpen(true); } : undefined}
        >
          {done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <PartyPopper className="text-rose-500" size={32} />
              <p className="text-sm font-medium text-slate-700">{t.store.success}</p>
              <p className="text-xs text-slate-400">{t.store.successNote}</p>
              <button onClick={resetAll} className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
                {t.store.newOrder}
              </button>
            </div>
          ) : (
            <>
              {/* Buyurtma qilinayotgan mahsulotlar ro'yxati (surat + nom) */}
              <div className="mb-3 space-y-2">
                {selectedCartItemsList.map(({ product, qty, unitPrice }) => {
                  const thumb = (product.imageUrls && product.imageUrls[0]) || product.imageUrl || "";
                  return (
                    <div key={product.id} className="flex items-center gap-2.5">
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                        {thumb ? (
                          <img loading="lazy" src={thumb} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><Package size={14} /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">{pname(product, lang)}</p>
                        <p className="text-[11px] text-slate-400">{qty} × {fmtMoney(unitPrice)} {t.common.uzs}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mb-3 rounded-xl bg-gray-50 p-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>{t.store.subtotal}</span>
                  <span>{fmtMoney(selectedCartTotal)} {t.common.uzs}</span>
                </div>
                {appliedPromo && selectedPromoDiscount > 0 && (
                  <div className="mt-1 flex justify-between text-rose-600">
                    <span>{t.store.promoApplied} ({appliedPromo.code})</span>
                    <span>-{fmtMoney(selectedPromoDiscount)} {t.common.uzs}</span>
                  </div>
                )}
                {bonusApplied > 0 && (
                  <div className="mt-1 flex justify-between text-rose-600">
                    <span>{t.store.bonusUsed}</span>
                    <span>-{fmtMoney(bonusApplied)} {t.common.uzs}</span>
                  </div>
                )}
                <div className="mt-1.5 flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-slate-700">
                  <span>{t.store.total}</span>
                  <span>{fmtMoney(cartTotalAfterBonus)} {t.common.uzs}</span>
                </div>
              </div>

              {/* Promo kod */}
              <div className="mb-3">
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
                      <CheckCircle2 size={14} /> {appliedPromo.code} {t.store.promoApplied}
                    </span>
                    <button onClick={removePromoCode} className="text-xs font-medium text-rose-700 hover:underline">{t.store.promoRemove}</button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        className={inputCls}
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value); setPromoError(""); }}
                        placeholder={t.store.promoPh}
                      />
                      <button
                        onClick={applyPromoCode}
                        disabled={checkingPromo || !promoInput.trim()}
                        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {checkingPromo ? <Loader2 size={13} className="animate-spin" /> : null} {t.store.promoApply}
                      </button>
                    </div>
                    {promoError && <p className="mt-1 text-xs text-rose-500">{promoError}</p>}
                  </div>
                )}
              </div>

              {/* Bonusdan foydalanish */}
              {maxBonusUsable > 0 && (
                <div className="mb-3 rounded-lg border border-rose-100 bg-rose-50/50 p-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 font-medium text-rose-700"><Wallet size={13} /> {t.store.bonusAvailable}</span>
                    <span className="font-semibold text-rose-600">{fmtMoney(myBonus)} {t.common.uzs}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      inputMode="numeric"
                      className={inputCls}
                      value={bonusToUse}
                      onChange={(e) => setBonusToUseClamped(e.target.value)}
                      placeholder={t.store.bonusUsePh}
                    />
                    <button
                      type="button"
                      onClick={useMaxBonus}
                      className="shrink-0 whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50"
                    >
                      {t.store.bonusMaxBtn}
                    </button>
                  </div>
                </div>
              )}

              <Field label={t.store.yourName} error={error && !form.name ? error : ""}>
                <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label={t.store.yourPhone} error={error && !isValidUzPhone(form.phone) ? error : ""}>
                <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </Field>

              {showPhone2 ? (
                <Field label={t.store.phone2Label}>
                  <div className="flex gap-2">
                    <PhoneInput value={form.phone2} onChange={(v) => setForm({ ...form, phone2: v })} />
                    <button
                      type="button"
                      onClick={() => { setShowPhone2(false); setForm(f => ({ ...f, phone2: "" })); }}
                      className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50"
                    >
                      {t.store.removePhone2}
                    </button>
                  </div>
                </Field>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPhone2(true)}
                  className="mb-3 flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:underline"
                >
                  <Plus size={13} /> {t.store.addPhone2}
                </button>
              )}

              <Field label={t.store.payment}>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "cash", label: t.store.cash },
                    { key: "card", label: t.store.card },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm({ ...form, payment: opt.key })}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        form.payment === opt.key ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={t.store.address} error={error && !form.address ? error : ""}>
                {myAddresses.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {myAddresses.map((addr) => {
                      const active = form.address === addr.text;
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => pickAddressForOrder(addr)}
                          className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition ${
                            active ? "border-rose-600 bg-rose-50 text-rose-700" : "border-gray-200 text-slate-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${active ? "bg-rose-600 text-white" : "bg-gray-100 text-slate-400"}`}>
                            <MapPin size={14} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">{addr.text}</span>
                          {active && <CheckCircle2 size={16} className="shrink-0 text-rose-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <textarea
                  className={`${inputCls} min-h-[64px] resize-none`}
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder={t.store.addressPh}
                />
              </Field>

              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowCheckoutMap(v => !v)}
                  className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50"
                >
                  <MapPin size={14} /> {t.store.mapPick}
                </button>
                {showCheckoutMap && (
                  <div className="mt-2">
                    <p className="mb-1.5 text-[11px] text-slate-400">{t.store.mapPickNote}</p>
                    <MapPicker value={location} onChange={setLocation} />
                    <button
                      type="button"
                      onClick={() => setShowCheckoutMap(false)}
                      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-600 py-2 text-xs font-semibold text-white hover:bg-rose-700"
                    >
                      <CheckCircle2 size={14} /> {t.store.applyBtn}
                    </button>
                  </div>
                )}
                {location && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    <span className="flex items-center gap-1"><CheckCircle2 size={13} /> {t.store.locationSet}</span>
                    <span className="flex gap-2">
                      <a href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer" className="underline">
                        Google
                      </a>
                      <a href={`https://yandex.com/maps/?pt=${location.lng},${location.lat}&z=16&l=map`} target="_blank" rel="noopener noreferrer" className="underline">
                        Yandex
                      </a>
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={resetAll} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
                <button onClick={submitOrder} disabled={placing} className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60">
                  {placing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} {placing ? t.store.placing : t.store.placeOrder}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {selectedProduct && (
        <ProductDetail
          product={products.find(p => p.id === selectedProduct.id) || selectedProduct}
          cartQty={cart[selectedProduct.id] || 0}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
          t={t}
          fmtMoney={fmtMoney}
          lang={lang}
        />
      )}

      {/* Pastki navigatsiya paneli — suzuvchi (floating) pill, faqat ikonkalar, mobilda */}
      <nav className="fixed inset-x-0 bottom-4 z-30 mx-auto flex w-fit items-center gap-1 rounded-full bg-white px-2 py-2 shadow-[0_8px_28px_rgba(0,0,0,0.16)] md:hidden">
        {[
          { key: "home", icon: Home, onClick: () => { setActiveCategory(t.store.allCategories); setActiveCollection(null); window.scrollTo({ top: 0, behavior: "smooth" }); } },
          { key: "categories", icon: LayoutGrid, onClick: () => setCategoriesPageOpen(true) },
          { key: "cart", icon: ShoppingCart, onClick: () => setCartOpen(true), badge: cartCount },
          { key: "wishlist", icon: Heart, onClick: () => setWishlistOpen(true), badge: wishlistItems.length },
          { key: "profile", icon: UserRound, onClick: openProfile },
        ].map(({ key, icon: Icon, onClick, badge }) => (
          <button
            key={key}
            onClick={() => { setActiveNavTab(key); onClick(); }}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
              activeNavTab === key
                ? "bg-rose-500 text-white"
                : key === "cart" && cartCount > 0
                ? "bg-rose-50 text-rose-500"
                : "text-stone-500 hover:bg-rose-50"
            }`}
          >
            <Icon size={20} />
            {!!badge && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-900 text-[9px] font-semibold text-white">
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      {/* Pastki panel ostida kontent yashirinib qolmasligi uchun bo'shliq */}
      <div className="h-20 md:hidden" />

      {/* Xarid qilingan mahsulotga sharh qoldirish oynasi */}
      {reviewModal && (
        <ReviewFormModal
          order={reviewModal.order}
          item={reviewModal.item}
          lang={lang}
          myName={myName}
          myPhone={myPhone}
          testimonialsCount={testimonials.length}
          onClose={() => setReviewModal(null)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   APP SHELL
--------------------------------------------------------------- */
export default function App() {
  const [lang, setLang] = useState("uz");
  const route = typeof window !== "undefined" && window.location.pathname.startsWith("/admin") ? "admin" : "store";
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [productsLoaded, setProductsLoaded] = useState(false);

  // Telegram Mini App — faqat bir marta, komponent yuklanganda ishga tushadi.
  const [tgUser, setTgUser] = useState(null);
  const [inTelegram, setInTelegram] = useState(false);
  useEffect(() => {
    initTelegram();
    setInTelegram(isInTelegram());
    setTgUser(getTelegramUser());
  }, []);

  // Mahsulotlar — hammaga kerak (do'konda ko'rsatish + admin boshqarishi uchun)
  useEffect(() => {
    const unsub = subscribeCollection(COL.products, (list) => {
      setProducts(list);
      setProductsLoaded(true);
    });
    return unsub;
  }, []);

  // Kategoriyalar — hammaga kerak (do'kondagi chip'lar + admin formadagi tanlov uchun)
  useEffect(() => {
    const unsub = subscribeCollection(COL.categories, setCategories);
    return unsub;
  }, []);

  // Brendlar — admin formadagi tanlov uchun
  useEffect(() => {
    const unsub = subscribeCollection(COL.brands, setBrands);
    return unsub;
  }, []);

  // Kolleksiyalar — "O'zingizga mos uslubni toping" bo'limi uchun
  useEffect(() => {
    const unsub = subscribeCollection(COL.collections, setCollections);
    return unsub;
  }, []);

  // Bannerlar — hammaga kerak (do'kon sliderining o'zi + admin boshqaruvi uchun)
  useEffect(() => {
    const unsub = subscribeCollection(COL.banners, setBanners);
    return unsub;
  }, []);

  // Mijoz sharhlari
  useEffect(() => {
    const unsub = subscribeCollection(COL.testimonials, setTestimonials);
    return unsub;
  }, []);

  // Savol-javob
  useEffect(() => {
    const unsub = subscribeCollection(COL.faqs, setFaqs);
    return unsub;
  }, []);

  // Do'kon sozlamalari (bitta hujjat — settings/store). MUHIM: butun
  // "settings" kolleksiyasiga emas, FAQAT shu bitta hujjatga obuna
  // bo'linadi — aks holda boshqa sozlama (masalan Telegram xush kelibsiz
  // xabari) saqlanganda ham qayta ishga tushib, "Sozlamalar" sahifasida
  // hali saqlanmagan o'zgarishlarni (masalan endigina yuklangan logotipni)
  // formadan yo'qotib yuborardi.
  useEffect(() => {
    const unsub = subscribeDoc("settings", "store", (store) => {
      setStoreSettings(store || null);
    });
    return unsub;
  }, []);

  const loading = !productsLoaded;

  if (loading) {
    // Do'kon (mijozlar) tomoni uchun — yalang'och spinner o'rniga CASME
    // brend yozuvi bilan chiroyliroq "yuklanmoqda" ekrani. Admin panel
    // uchun esa neytral spinner qoladi (brendlash shart emas).
    if (route === "store") {
      return (
        <div className="flex h-full min-h-screen flex-col items-center justify-center gap-4 bg-white">
          <p
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-4xl font-bold tracking-wide text-stone-900"
          >
            CASME
          </p>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-rose-500"
                style={{ animation: "casmeDotBounce 1s ease-in-out infinite", animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-rose-500" size={28} />
      </div>
    );
  }

  // Public storefront — the only thing customers ever see at the root domain.
  if (route === "store") {
    return (
      <StorefrontPage
        lang={lang} setLang={setLang} products={products.filter(p => p.active !== false)} categories={categories} banners={banners}
        brands={brands} collections={collections} testimonials={testimonials} faqs={faqs} storeSettings={storeSettings}
        tgUser={tgUser} inTelegram={inTelegram}
      />
    );
  }

  // /admin — MUHIM (tezlik uchun kod ajratish/code-splitting): butun admin
  // panel (buyurtmalar, mijozlar, mahsulotlar jadvali, statistika grafiklari
  // va h.k.) endi ALOHIDA faylda (src/AdminApp.jsx) va faqat SHU YERGA
  // kelinganda (ya'ni /admin manzili ochilganda) tarmoqdan yuklab olinadi.
  // Bu tufayli oddiy mijoz (do'kon sahifasiga kirganda) admin panelning
  // og'ir kodini (jumladan grafik chizish kutubxonasini) UMUMAN yuklab
  // olmaydi — sayt ancha tezroq ochiladi.
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-[500px] items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-emerald-500" size={28} />
        </div>
      }
    >
      <AdminApp
        lang={lang} setLang={setLang}
        products={products} categories={categories} brands={brands} collections={collections}
        banners={banners} testimonials={testimonials} faqs={faqs} storeSettings={storeSettings}
      />
    </Suspense>
  );
}
