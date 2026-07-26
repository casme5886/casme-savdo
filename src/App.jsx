import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  LayoutGrid, ClipboardList, Users, Package, Plus, Trash2, Pencil, X,
  TrendingUp, TrendingDown, Search, Globe, Wallet, CheckCircle2, XCircle, Clock,
  ChevronDown, Save, AlertCircle, Loader2, ShoppingCart, ShoppingBag,
  Minus, ArrowLeft, PartyPopper, Heart, UserRound, Truck, MapPin,
  LogIn, LogOut, Lock, Image as ImageIcon, Eye, Star, RotateCcw, ShieldCheck, Headphones,
  MessageSquareQuote, HelpCircle, Settings as SettingsIcon, Bell, Download, Phone, Send, Copy, Tag,
  ArrowUp, ArrowDown, EyeOff, ChevronLeft, ChevronRight, MessageCircle, Home
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { initTelegram, isInTelegram, getTelegramUser, hapticFeedback, getWebApp } from "./telegram.js";
import Banner, { MidPromoBanner } from "./components/Banner.jsx";
import BannerSettings from "./components/BannerSettings.jsx";
import ProductDetail from "./components/ProductDetail.jsx";
import ProductForm from "./components/ProductForm.jsx";
import { CategoryIconRow, BrandIconRow, CategoryShowcase, CollectionShowcase, WideCollectionShowcase, collectionTitle, collectionDescription } from "./components/CategoryShowcase.jsx";
import StoreFooter from "./components/StoreFooter.jsx";
import Testimonials from "./components/Testimonials.jsx";
import FAQSection from "./components/FAQSection.jsx";
import InstagramGallery from "./components/InstagramGallery.jsx";
import TestimonialsSettings from "./components/TestimonialsSettings.jsx";
import FAQSettings from "./components/FAQSettings.jsx";
import StoreSettings from "./components/StoreSettings.jsx";
import MarketingPage from "./components/MarketingPage.jsx";

/* ---------------------------------------------------------------
   I18N
--------------------------------------------------------------- */
const T = {
  uz: {
    appName: "Savdo Panel",
    workspace: "Do'kon",
    menu: {
      dashboard: "Boshqaruv paneli",
      orders: "Buyurtmalar",
      customers: "Mijozlar",
      products: "Mahsulotlar",
      banner: "Banner",
      testimonials: "Sharhlar", faqs: "Savol-javob",
      marketing: "Marketing",
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
      title: "Mijozlar", add: "Mijoz qo'shish", edit: "Mijozni tahrirlash", name: "Ism", phone: "Telefon",
      orders: "Buyurtmalar", spent: "Jami xarid", date: "Qo'shilgan sana",
      actions: "Amallar", empty: "Mijoz topilmadi", searchPh: "Ism yoki telefon bo'yicha qidirish...",
      tier: "Daraja", tierVip: "VIP", tierActive: "Faol", tierNew: "Yangi",
      sortDate: "Yangi qo'shilgan", sortSpent: "Ko'p xarid qilgan", sortOrders: "Ko'p buyurtma bergan", sortName: "Ism (A-Z)",
      bonusPoints: "Bonus ballar", pointsHint: "Masalan: 50", addPoints: "Qo'shish",
      orderHistory: "Buyurtmalar tarixi",
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
      newItemPh: "Yangisini kiriting...", noItems: "Hozircha yo'q",
      collectionsBtn: "Kolleksiyalar", collectionAdd: "To'plam qo'shish", collectionEdit: "To'plamni tahrirlash",
      collectionEmpty: "Hozircha to'plam yo'q — \"O'zingizga mos uslubni toping\" bo'limida bularni ko'rsatasiz",
      collectionTitleUz: "Sarlavha (o'zbekcha)", collectionTitleRu: "Sarlavha (ruscha)", collectionTitlePh: "Masalan: Dog'li yuz uchun to'plam",
      collectionTitleRuPh: "Masalan: Набор для проблемной кожи",
      collectionDescriptionUz: "Tavsif — o'zbekcha (ixtiyoriy)", collectionDescriptionRu: "Tavsif — ruscha (ixtiyoriy)",
      collectionDescriptionPh: "Bu to'plam haqida qisqacha yozing...", collectionDescriptionRuPh: "Kratkoye opisaniye na russkom...",
      collectionImage: "Rasm", collectionUpload: "Rasm tanlang",
      collectionStyle: "Ko'rinish turi",
      collectionStyleCard: "Kvadrat kartochka", collectionStyleCardHint: "\"O'zingizga mos uslubni toping\" bo'limida",
      collectionStyleCardBottom: "Kvadrat (pastda)", collectionStyleCardBottomHint: "Kategoriya bo'limidan keyin, Brendlardan oldin",
      collectionStyleBanner: "Keng banner", collectionStyleBannerHint: "\"Mashhur\" ostida, keng suratlar qatorida",
      collectionProducts: "Mahsulotlar", collectionSelected: "tanlandi",
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
      allProductsTag: "To'liq katalog", allProductsTitle: "Barcha mahsulotlar",
      brandsCount: "ta brend", productsCount: "ta mahsulot",
      discountsTag: "Chegirmalar", discountsTitle: "Chegirmaga tushgan mahsulotlar",
      navHome: "Bosh sahifa", navShop: "Do'kon", navCategories: "Kategoriyalar",
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
      promoPh: "Promo kod", promoApply: "Qo'llash", promoApplied: "qo'llandi", promoRemove: "Olib tashlash",
      promoInvalid: "Bunday promo kod topilmadi yoki faol emas",
      promoExpired: "Bu promo kodning muddati tugagan",
      promoLimitReached: "Bu promo kodning ishlatish limiti tugagan",
      promoMinOrder: "Bu kod uchun buyurtma kamida {amount} UZS bo'lishi kerak",
      yourName: "Ismingiz", yourPhone: "Telefon raqamingiz", placeOrder: "Buyurtmani tasdiqlash",
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
        phone: "Telefon raqam", notLinked: "Telegram orqali kirilmagan",
        myOrders: "Buyurtmalarim", noOrders: "Hozircha buyurtma yo'q",
        loading: "Yuklanmoqda...",
        addPhone: "Telefon raqamni qo'shish",
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
    appName: "Панель продаж",
    workspace: "Магазин",
    menu: {
      dashboard: "Панель управления",
      orders: "Заказы",
      customers: "Клиенты",
      products: "Товары",
      banner: "Баннер",
      testimonials: "Отзывы", faqs: "Вопрос-ответ",
      marketing: "Маркетинг",
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
      title: "Клиенты", add: "Добавить клиента", edit: "Редактировать клиента", name: "Имя", phone: "Телефон",
      orders: "Заказы", spent: "Всего покупок", date: "Дата добавления",
      actions: "Действия", empty: "Клиенты не найдены", searchPh: "Поиск по имени или телефону...",
      tier: "Уровень", tierVip: "VIP", tierActive: "Активный", tierNew: "Новый",
      sortDate: "Недавно добавленные", sortSpent: "Больше покупок", sortOrders: "Больше заказов", sortName: "Имя (А-Я)",
      bonusPoints: "Бонусные баллы", pointsHint: "Например: 50", addPoints: "Добавить",
      orderHistory: "История заказов",
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
      newItemPh: "Введите новое...", noItems: "Пока пусто",
      collectionsBtn: "Коллекции", collectionAdd: "Добавить коллекцию", collectionEdit: "Редактировать коллекцию",
      collectionEmpty: "Пока нет коллекций — они будут показаны в разделе \"Найдите свой стиль\"",
      collectionTitleUz: "Заголовок (узбекский)", collectionTitleRu: "Заголовок (русский)", collectionTitlePh: "Например: Набор для проблемной кожи",
      collectionTitleRuPh: "Например: Набор для проблемной кожи",
      collectionDescriptionUz: "Описание — узбекский (опционально)", collectionDescriptionRu: "Описание — русский (опционально)",
      collectionDescriptionPh: "Кратко опишите этот набор...", collectionDescriptionRuPh: "Кратко опишите этот набор...",
      collectionImage: "Изображение", collectionUpload: "Выберите изображение",
      collectionStyle: "Стиль отображения",
      collectionStyleCard: "Квадратная карточка", collectionStyleCardHint: "В разделе \"Найдите свой стиль\"",
      collectionStyleCardBottom: "Квадратная (внизу)", collectionStyleCardBottomHint: "После раздела Категории, перед Брендами",
      collectionStyleBanner: "Широкий баннер", collectionStyleBannerHint: "Под \"Популярное\", в ряду широких изображений",
      collectionProducts: "Товары", collectionSelected: "выбрано",
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
      allProductsTag: "Полный каталог", allProductsTitle: "Все товары",
      brandsCount: "брендов", productsCount: "товаров",
      discountsTag: "Скидки", discountsTitle: "Товары со скидкой",
      navHome: "Главная", navShop: "Магазин", navCategories: "Категории",
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
      promoPh: "Промокод", promoApply: "Применить", promoApplied: "применён", promoRemove: "Убрать",
      promoInvalid: "Такой промокод не найден или не активен",
      promoExpired: "Срок действия этого промокода истёк",
      promoLimitReached: "Лимит использования этого промокода исчерпан",
      promoMinOrder: "Для этого кода заказ должен быть минимум {amount} UZS",
      yourName: "Ваше имя", yourPhone: "Ваш номер телефона", placeOrder: "Подтвердить заказ",
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
        phone: "Номер телефона", notLinked: "Вход через Telegram не выполнен",
        myOrders: "Мои заказы", noOrders: "Пока нет заказов",
        loading: "Загрузка...",
        addPhone: "Добавить номер телефона",
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
  subscribeCollection, addItem, setItem, updateItem, deleteItem,
  findCustomerByPhone, findCustomerByTelegramId, isCollectionEmpty, placeOrderBatch, getCustomersCount,
  findPromoCode, incrementPromoCodeUsage,
  findOrdersByTelegramId, findOrdersByPhone, uploadImage,
} from "./storage.js";
import { auth } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
const COL = { orders: "orders", customers: "customers", products: "products", categories: "categories", brands: "brands", banners: "banners", testimonials: "testimonials", faqs: "faqs", collections: "collections" };

import {
  uid, fmtMoney, todayISO, inputCls, Modal, Field, EmptyState, StatusBadge,
  pname, pdesc, discountPct, formatUzPhone, isValidUzPhone, PhoneInput,
  useCarouselRow,
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
function ProfileOrderCard({ order, t }) {
  const fmt = (n) => (Number(n) || 0).toLocaleString("ru-RU");
  return (
    <div className="rounded-xl border border-gray-100 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {t.store.profile.order} #{order.id.slice(-6).toUpperCase()}
        </span>
        <StatusBadge status={order.status} labels={t.orders.st} />
      </div>
      <p className="mb-1 text-xs text-slate-400">{order.date}</p>
      {Array.isArray(order.items) && order.items.length > 0 && (
        <p className="mb-1.5 text-xs text-slate-600">
          {t.store.profile.items}: {order.items.map((it) => `${it.productName} × ${it.qty}`).join(", ")}
        </p>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800">{fmt(order.amount)} {t.common.uzs}</span>
        <span className="text-xs text-slate-500">{t.orders.paymentLabels[order.payment] || order.payment || "—"}</span>
      </div>
      {order.address && <p className="mt-1 truncate text-xs text-slate-400">📍 {order.address}</p>}
    </div>
  );
}

/* ---------------------------------------------------------------
   DASHBOARD PAGE
--------------------------------------------------------------- */
function DashboardPage({ lang, orders, customers, products, setPage }) {
  const t = T[lang];
  const [period, setPeriod] = useState("week"); // "today" | "week" | "month"

  const periodDays = period === "today" ? 1 : period === "week" ? 7 : 30;

  const inRange = (dateStr, startDaysAgo, endDaysAgo) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    return diffDays >= endDaysAgo && diffDays < startDaysAgo;
  };

  const currentOrders = useMemo(
    () => orders.filter(o => o.status !== "cancelled" && inRange(o.date, periodDays, 0)),
    [orders, periodDays]
  );
  const previousOrders = useMemo(
    () => orders.filter(o => o.status !== "cancelled" && inRange(o.date, periodDays * 2, periodDays)),
    [orders, periodDays]
  );

  const sumAmount = (list) => list.reduce((s, o) => s + Number(o.amount || 0), 0);
  const sumCost = (list) => list.reduce((sum, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return sum + items.reduce((s, it) => s + (Number(it.costPrice) || 0) * (Number(it.qty) || 0), 0);
  }, 0);
  const sumDelivery = (list) => list.reduce((s, o) => s + (Number(o.deliveryPrice) || 0), 0);

  const revenue = sumAmount(currentOrders);
  const costTotal = sumCost(currentOrders);
  const deliveryTotal = sumDelivery(currentOrders);
  const profit = revenue - costTotal - deliveryTotal;

  const prevRevenue = sumAmount(previousOrders);
  const revenueChangePct = prevRevenue > 0 ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100) : null;

  const counts = useMemo(() => ({
    new: currentOrders.filter(o => o.status === "new").length,
    ready: currentOrders.filter(o => o.status === "ready").length,
    on_way: currentOrders.filter(o => o.status === "on_way").length,
    delivered: currentOrders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled" && inRange(o.date, periodDays, 0)).length,
  }), [currentOrders, orders, periodDays]);

  const chartDays = period === "month" ? 30 : 7;
  const chartData = useMemo(() => {
    const days = [];
    for (let i = chartDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayRevenue = orders
        .filter(o => o.date === key && o.status !== "cancelled")
        .reduce((s, o) => s + Number(o.amount || 0), 0);
      days.push({ date: key.slice(5), revenue: dayRevenue });
    }
    return days;
  }, [orders, chartDays]);

  const recent = [...orders].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
  const topCustomers = [...customers].sort((a, b) => (b.spent || 0) - (a.spent || 0)).slice(0, 5);

  // Eng ko'p sotilgan mahsulotlar — joriy davrdagi buyurtmalar items snapshotidan hisoblanadi.
  const topProducts = useMemo(() => {
    const map = new Map();
    currentOrders.forEach(o => {
      (o.items || []).forEach(it => {
        const key = it.productId || it.productName;
        const prev = map.get(key) || { productId: it.productId, productName: it.productName, imageUrl: it.imageUrl, qty: 0, revenue: 0 };
        prev.qty += Number(it.qty) || 0;
        prev.revenue += (Number(it.qty) || 0) * (Number(it.price) || 0);
        map.set(key, prev);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [currentOrders]);

  // Kam qolgan mahsulotlar — faqat "soni bilan" turidagi, 5 tadan kam (lekin 0 emas) qoldiq.
  const lowStock = useMemo(
    () => (products || []).filter(p => (p.stockType || "limited") === "limited" && p.stock > 0 && p.stock <= 5),
    [products]
  );

  return (
    <div className="flex flex-col gap-5">
      {/* Davr tanlash */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 rounded-xl bg-white p-1 shadow-sm">
          {[
            { key: "today", label: t.dashboard.periodToday },
            { key: "week", label: t.dashboard.periodWeek },
            { key: "month", label: t.dashboard.periodMonth },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setPeriod(opt.key)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                period === opt.key ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kam qolgan mahsulotlar ogohlantirishi */}
      {lowStock.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-500" size={18} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-800">{t.dashboard.lowStock}</p>
            <p className="mb-2 text-xs text-amber-700">{t.dashboard.lowStockNote}</p>
            <div className="flex flex-wrap gap-2">
              {lowStock.map(p => (
                <span key={p.id} className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-amber-700">
                  {pname(p, lang)} — {p.stock} {t.common.ta}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border-t-4 border-emerald-500 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400">{t.dashboard.revenue}</span>
            <TrendingUp className="text-emerald-500" size={18} />
          </div>
          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{fmtMoney(revenue)}</span>
            <span className="text-sm font-normal text-slate-400">{t.common.uzs}</span>
          </div>
          {revenueChangePct !== null && (
            <p className={`mb-2 flex items-center gap-1 text-xs font-medium ${revenueChangePct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {revenueChangePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {revenueChangePct >= 0 ? "+" : ""}{revenueChangePct}% {t.dashboard.vsLastPeriod}
            </p>
          )}
          <div className="space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between"><span>{t.dashboard.cost}</span><span className="font-medium text-slate-700">{fmtMoney(costTotal)} {t.common.uzs}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.delivery}</span><span className="font-medium text-slate-700">{fmtMoney(deliveryTotal)} {t.common.uzs}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.profit}</span><span className={`font-medium ${profit < 0 ? "text-rose-600" : "text-slate-700"}`}>{fmtMoney(profit)} {t.common.uzs}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border-t-4 border-amber-400 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400">{t.dashboard.orders}</span>
            <ClipboardList className="text-amber-500" size={18} />
          </div>
          <div className="mb-3 text-2xl font-bold text-slate-800">{currentOrders.length + counts.cancelled} <span className="text-sm font-normal text-slate-400">{t.common.ta}</span></div>
          <div className="space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between"><span>{t.dashboard.new}</span><span className="font-medium text-slate-700">{counts.new}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.ready}</span><span className="font-medium text-slate-700">{counts.ready}</span></div>
            <div className="flex justify-between"><span>{t.orders.st.on_way}</span><span className="font-medium text-slate-700">{counts.on_way}</span></div>
            <div className="flex justify-between"><span>{t.orders.st.delivered}</span><span className="font-medium text-slate-700">{counts.delivered}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.cancelled}</span><span className="font-medium text-slate-700">{counts.cancelled}</span></div>
          </div>
        </div>

        <div className="rounded-2xl border-t-4 border-blue-400 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-slate-400">{t.dashboard.customers}</span>
            <Users className="text-blue-500" size={18} />
          </div>
          <div className="mb-3 text-2xl font-bold text-slate-800">{customers.length} <span className="text-sm font-normal text-slate-400">{t.common.ta}</span></div>
          <div className="space-y-1.5 text-sm text-slate-500">
            <div className="flex justify-between"><span>{t.dashboard.newCustomers}</span><span className="font-medium text-slate-700">{customers.length}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.returning}</span><span className="font-medium text-slate-700">{customers.filter(c => (c.orders || 0) > 1).length}</span></div>
            <div className="flex justify-between"><span>{t.dashboard.avgOrder}</span><span className="font-medium text-slate-700">{currentOrders.length ? fmtMoney(Math.round(revenue / currentOrders.length)) : 0} {t.common.uzs}</span></div>
          </div>
        </div>
      </div>

      {/* Tezkor harakatlar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.quickActions}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPage("products")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Package size={15} className="text-emerald-600" /> {t.dashboard.qaProduct}
          </button>
          <button onClick={() => setPage("banner")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <ImageIcon size={15} className="text-emerald-600" /> {t.dashboard.qaBanner}
          </button>
          <button onClick={() => setPage("orders")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <ClipboardList size={15} className="text-emerald-600" /> {t.dashboard.qaOrders}
          </button>
          <button onClick={() => setPage("testimonials")} className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <MessageSquareQuote size={15} className="text-emerald-600" /> {t.dashboard.qaTestimonial}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.chartTitle}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={40} />
                <Tooltip formatter={(v) => [`${fmtMoney(v)} ${t.common.uzs}`, t.dashboard.revenueLabel]} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.recentOrders}</h3>
          {recent.length === 0 ? (
            <EmptyState icon={ClipboardList} text={t.dashboard.noOrders} />
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{o.customer}</p>
                    <p className="text-xs text-slate-400">{o.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">{fmtMoney(o.amount)} {t.common.uzs}</span>
                    <StatusBadge status={o.status} labels={t.orders.st} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.topProducts}</h3>
          {topProducts.length === 0 ? (
            <EmptyState icon={Package} text={t.dashboard.noTopProducts} />
          ) : (
            <div className="space-y-2">
              {topProducts.map((p, i) => (
                <div key={p.productId || i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-600">{i + 1}</span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                    {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <Package size={14} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{p.productName}</p>
                    <p className="text-xs text-slate-400">{p.qty} {t.dashboard.soldUnits}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{fmtMoney(p.revenue)} {t.common.uzs}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">{t.dashboard.topCustomers}</h3>
          {topCustomers.length === 0 ? (
            <EmptyState icon={Users} text={t.dashboard.noCustomers} />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {topCustomers.map((c) => (
                <div key={c.id} className="rounded-xl border border-gray-100 p-3">
                  <p className="truncate text-sm font-medium text-slate-700">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.orders || 0} {t.common.ta}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-600">{fmtMoney(c.spent)} {t.common.uzs}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ORDERS PAGE
--------------------------------------------------------------- */
/** Yangi buyurtma kelganda ovozli signal (fayl kerak emas — brauzerning o'z audio API'si orqali). */
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn("Ovozli signal ishlamadi:", e);
  }
}

/** Joriy ro'yxatni CSV (Excel'da ochiladigan) faylga aylantirib yuklab beradi. */
function exportOrdersToCSV(list, t) {
  const headers = [t.orders.customer, t.orders.phone, t.orders.amount, t.orders.payment, t.orders.address, t.orders.status, t.orders.date];
  const rows = list.map(o => [
    o.customer || "", o.phone || "", o.amount || 0,
    t.orders.paymentLabels[o.payment] || o.payment || "",
    (o.address || "").replace(/\n/g, " "),
    t.orders.st[o.status] || o.status, o.date || "",
  ]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `buyurtmalar-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function OrdersPage({ lang, orders, setOrders, customers }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [form, setForm] = useState({ customer: "", amount: "", status: "new" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState("ready");
  const [newOrderToast, setNewOrderToast] = useState(null);

  const tabs = [
    { key: "all", label: t.orders.tabAll },
    { key: "new", label: t.orders.st.new },
    { key: "ready", label: t.orders.st.ready },
    { key: "on_way", label: t.orders.st.on_way },
    { key: "delivered", label: t.orders.st.delivered },
    { key: "cancelled", label: t.orders.st.cancelled },
  ];

  const filtered = orders
    .filter(o => activeTab === "all" || o.status === activeTab)
    .filter(o => (o.customer + " " + (o.phone || "")).toLowerCase().includes(search.toLowerCase()))
    .filter(o => !dateFrom || o.date >= dateFrom)
    .filter(o => !dateTo || o.date <= dateTo);

  // Yangi buyurtma kelganda — ovozli + vizual bildirishnoma.
  // Sahifa birinchi ochilganda (prevIdsRef hali bo'sh) hech narsa signal bermaydi,
  // faqat KEYINGI o'zgarishlarda haqiqiy yangi buyurtma kelsa ishga tushadi.
  const prevIdsRef = useRef(null);
  useEffect(() => {
    const currentIds = new Set(orders.map(o => o.id));
    if (prevIdsRef.current) {
      const arrived = orders.filter(o => o.status === "new" && !prevIdsRef.current.has(o.id));
      if (arrived.length > 0) {
        playNotificationSound();
        setNewOrderToast(arrived[0]);
        setTimeout(() => setNewOrderToast(null), 6000);
      }
    }
    prevIdsRef.current = currentIds;
  }, [orders]);

  const submit = async () => {
    if (!form.customer.trim() || !form.amount) { setError(t.common.required); return; }
    setSaving(true);
    await addItem(COL.orders, { customer: form.customer.trim(), amount: Number(form.amount), status: form.status, date: todayISO() });
    setSaving(false);
    setOpen(false);
    setForm({ customer: "", amount: "", status: "new" });
    setError("");
  };

  const remove = async (id) => {
    await deleteItem(COL.orders, id);
  };

  const changeStatus = async (id, status) => {
    await updateItem(COL.orders, id, { status });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.size === filtered.length ? new Set() : new Set(filtered.map(o => o.id))));
  };
  const applyBulkStatus = async () => {
    await Promise.all(Array.from(selectedIds).map(id => updateItem(COL.orders, id, { status: bulkStatus })));
    setSelectedIds(new Set());
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      {/* Yangi buyurtma bildirishnomasi */}
      {newOrderToast && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <span className="flex h-8 w-8 shrink-0 animate-pulse items-center justify-center rounded-full bg-emerald-500 text-white">
            <Bell size={15} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-emerald-800">{t.orders.newOrderToast}</p>
            <p className="truncate text-xs text-emerald-700">{newOrderToast.customer} — {fmtMoney(newOrderToast.amount)} {t.common.uzs}</p>
          </div>
          <button onClick={() => setNewOrderToast(null)} className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"><X size={15} /></button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{t.orders.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.orders.searchPh}
              className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </div>
          <button onClick={() => exportOrdersToCSV(filtered, t)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Download size={16} /> {t.orders.export}
          </button>
          <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus size={16} /> {t.orders.add}
          </button>
        </div>
      </div>

      {/* Sana oralig'i bo'yicha filtr */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-xs font-medium text-slate-500">{t.orders.dateFilter}:</span>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500" />
        <span className="text-xs text-slate-400">—</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-emerald-500" />
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-medium text-rose-500 hover:underline">{t.orders.clearDates}</button>
        )}
      </div>

      {/* Status tablari */}
      <div className="mb-4 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
        {tabs.map(tab => {
          const count = tab.key === "all" ? orders.length : orders.filter(o => o.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                activeTab === tab.key ? "bg-emerald-600 text-white" : "bg-gray-50 text-slate-500 hover:bg-gray-100"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 text-[10px] ${activeTab === tab.key ? "bg-white/20" : "bg-white text-slate-400"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Ommaviy amal paneli — bir nechta buyurtma tanlanganda ko'rinadi */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white">
          <span className="font-medium">{selectedIds.size} {t.orders.selected}</span>
          <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} className="rounded-lg border border-white/20 bg-slate-700 px-2 py-1.5 text-xs text-white outline-none">
            <option value="new">{t.orders.st.new}</option>
            <option value="ready">{t.orders.st.ready}</option>
            <option value="on_way">{t.orders.st.on_way}</option>
            <option value="delivered">{t.orders.st.delivered}</option>
            <option value="cancelled">{t.orders.st.cancelled}</option>
          </select>
          <button onClick={applyBulkStatus} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500">{t.orders.applyBulk}</button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-white/70 hover:text-white">{t.orders.clearSelection}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} text={t.orders.empty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-400">
                <th className="w-8 pb-2">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="pb-2 font-medium">{t.orders.customer}</th>
                <th className="pb-2 font-medium">{t.orders.phone}</th>
                <th className="pb-2 font-medium">{t.orders.items}</th>
                <th className="pb-2 font-medium">{t.orders.amount}</th>
                <th className="pb-2 font-medium">{t.orders.payment}</th>
                <th className="pb-2 font-medium">{t.orders.address}</th>
                <th className="pb-2 font-medium">{t.orders.status}</th>
                <th className="pb-2 font-medium">{t.orders.date}</th>
                <th className="pb-2 font-medium text-right">{t.orders.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSelect(o.id)} className="rounded" />
                  </td>
                  <td className="py-2.5 font-medium text-slate-700">{o.customer}</td>
                  <td className="py-2.5 text-slate-600">{o.phone || "—"}</td>
                  <td className="py-2.5 text-slate-600">
                    {Array.isArray(o.items) && o.items.length > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                          {o.items[0].imageUrl ? (
                            <img src={o.items[0].imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package size={14} />
                          )}
                        </div>
                        <span className="max-w-[140px] truncate text-xs">
                          {o.items[0].productName}{o.items[0].qty > 1 ? ` ×${o.items[0].qty}` : ""}
                          {o.items.length > 1 && <span className="text-slate-400"> +{o.items.length - 1}</span>}
                        </span>
                      </div>
                    ) : "—"}
                  </td>
                  <td className="py-2.5 text-slate-600">{fmtMoney(o.amount)} {t.common.uzs}</td>
                  <td className="py-2.5 text-slate-600">
                    {o.payment ? (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {t.orders.paymentLabels[o.payment] || o.payment}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="max-w-[160px] truncate py-2.5 text-slate-500" title={o.address || ""}>
                    {o.address ? (
                      <span className="inline-flex items-center gap-1">
                        {o.location && <MapPin size={12} className="shrink-0 text-emerald-500" />}
                        <span className="truncate">{o.address}</span>
                      </span>
                    ) : "—"}
                  </td>
                  <td className="py-2.5">
                    <select value={o.status} onChange={e => changeStatus(o.id, e.target.value)}
                      className="rounded-lg border border-gray-200 bg-transparent px-2 py-1 text-xs outline-none">
                      <option value="new">{t.orders.st.new}</option>
                      <option value="ready">{t.orders.st.ready}</option>
                      <option value="on_way">{t.orders.st.on_way}</option>
                      <option value="delivered">{t.orders.st.delivered}</option>
                      <option value="cancelled">{t.orders.st.cancelled}</option>
                    </select>
                  </td>
                  <td className="py-2.5 text-slate-500">{o.date}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedOrder(o)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Eye size={15} />
                      </button>
                      <button onClick={() => remove(o.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title={t.orders.add} onClose={() => setOpen(false)}>
          <Field label={t.orders.customer} error={error && !form.customer ? error : ""}>
            <select className={inputCls} value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })}>
              <option value="">—</option>
              {customers.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label={t.orders.amount} error={error && !form.amount ? error : ""}>
            <input type="number" className={inputCls} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
          </Field>
          <Field label={t.orders.status}>
            <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="new">{t.orders.st.new}</option>
              <option value="ready">{t.orders.st.ready}</option>
              <option value="on_way">{t.orders.st.on_way}</option>
              <option value="delivered">{t.orders.st.delivered}</option>
              <option value="cancelled">{t.orders.st.cancelled}</option>
            </select>
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </Modal>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={orders.find(o => o.id === selectedOrder.id) || selectedOrder}
          t={t}
          onClose={() => setSelectedOrder(null)}
          onChangeStatus={changeStatus}
        />
      )}
    </div>
  );
}

/** Admin panelda buyurtma bosilganda ochiladigan to'liq detail oynasi. */
function OrderDetailModal({ order, t, onClose, onChangeStatus }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const [deliveryPrice, setDeliveryPrice] = useState(String(order.deliveryPrice ?? ""));
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [note, setNote] = useState(order.note || "");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const saveDeliveryPrice = async () => {
    setSavingDelivery(true);
    await updateItem(COL.orders, order.id, { deliveryPrice: Number(deliveryPrice) || 0 });
    setSavingDelivery(false);
  };

  const saveNote = async () => {
    setSavingNote(true);
    await updateItem(COL.orders, order.id, { note: note.trim() });
    setSavingNote(false);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-semibold text-slate-800">{t.orders.detailTitle} #{order.id.slice(-6).toUpperCase()}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {/* Mijoz ma'lumotlari */}
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{t.orders.customer}</p>
              <p className="font-medium text-slate-700">{order.customer || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.orders.phone}</p>
              <p className="font-medium text-slate-700">{order.phone || "—"}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-slate-400">{t.orders.address}</p>
              <p className="font-medium text-slate-700">{order.address || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.orders.payment}</p>
              <p className="font-medium text-slate-700">{t.orders.paymentLabels[order.payment] || order.payment || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-400">{t.orders.status}</p>
              <select
                value={order.status}
                onChange={(e) => onChangeStatus(order.id, e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none"
              >
                <option value="new">{t.orders.st.new}</option>
                <option value="ready">{t.orders.st.ready}</option>
                <option value="on_way">{t.orders.st.on_way}</option>
                <option value="delivered">{t.orders.st.delivered}</option>
                <option value="cancelled">{t.orders.st.cancelled}</option>
              </select>
            </div>
          </div>

          {/* Mijoz bilan bog'lanish */}
          {(order.phone || order.telegramUsername) && (
            <div className="mb-4 flex gap-2">
              {order.phone && (
                <a href={`tel:${order.phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Phone size={14} /> {t.orders.call}
                </a>
              )}
              {order.telegramUsername && (
                <a href={`https://t.me/${order.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Send size={14} /> {t.orders.messageTelegram}
                </a>
              )}
            </div>
          )}

          {/* Yetkazib berish narxi */}
          <div className="mb-4 rounded-xl border border-gray-100 p-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.orders.deliveryPrice}</p>
            <div className="flex gap-2">
              <input
                type="number"
                className={inputCls}
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(e.target.value)}
                placeholder={t.orders.deliveryPriceHint}
              />
              <button
                onClick={saveDeliveryPrice}
                disabled={savingDelivery}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingDelivery ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {t.orders.saveDelivery}
              </button>
            </div>
          </div>

          {/* Admin eslatmasi */}
          <div className="mb-4 rounded-xl border border-gray-100 p-3">
            <p className="mb-1.5 text-xs font-medium text-slate-600">{t.orders.note}</p>
            <textarea
              className={`${inputCls} min-h-[60px] resize-y`}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.orders.noteHint}
            />
            <div className="mt-1.5 flex items-center gap-2">
              <button
                onClick={saveNote}
                disabled={savingNote}
                className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingNote ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {t.orders.saveDelivery}
              </button>
              {noteSaved && <span className="text-xs text-emerald-600">{t.common.saved || "✓"}</span>}
            </div>
          </div>

          {/* Mahsulotlar ro'yxati */}
          <p className="mb-2 text-sm font-semibold text-slate-700">{t.orders.items}</p>
          {items.length === 0 ? (
            <p className="mb-4 text-sm text-slate-400">—</p>
          ) : (
            <div className="mb-4 space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                    {it.imageUrl ? (
                      <img src={it.imageUrl} alt={it.productName} className="h-full w-full object-cover" />
                    ) : (
                      <Package size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-700">{it.productName}</p>
                    <p className="text-xs text-slate-400">{it.qty} × {fmtMoney(it.price)} {t.common.uzs}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{fmtMoney(it.qty * it.price)} {t.common.uzs}</p>
                </div>
              ))}
            </div>
          )}

          {/* Jami summa */}
          {order.promoCode && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs">
              <span className="font-medium text-rose-600">🏷️ {order.promoCode}</span>
              <span className="text-rose-600">-{fmtMoney(order.promoDiscount || 0)} {t.common.uzs}</span>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
            <span className="text-sm font-medium text-slate-600">{t.orders.total}</span>
            <span className="text-base font-bold text-slate-800">{fmtMoney(order.amount)} {t.common.uzs}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
/** Mijoz darajasini xarid summasi/soni asosida avtomatik aniqlaydi. */
function customerTier(c) {
  const spent = Number(c.spent) || 0;
  const ordersCount = Number(c.orders) || 0;
  if (spent >= 1000000) return "vip";
  if (ordersCount >= 2 || spent >= 300000) return "active";
  return "new";
}

function TierBadge({ tier, t }) {
  const map = {
    vip: "bg-amber-50 text-amber-700 border-amber-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    new: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const labels = { vip: t.customers.tierVip, active: t.customers.tierActive, new: t.customers.tierNew };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${map[tier]}`}>
      {labels[tier]}
    </span>
  );
}

/** Joriy mijozlar ro'yxatini CSV faylga aylantirib yuklab beradi. */
function exportCustomersToCSV(list, t) {
  const headers = [t.customers.name, t.customers.phone, t.customers.orders, t.customers.spent, t.customers.date];
  const rows = list.map(c => [c.name || "", c.phone || "", c.orders || 0, c.spent || 0, c.date || ""]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mijozlar-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function CustomersPage({ lang, customers, setCustomers, orders }) {
  const t = T[lang];
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = qo'shish
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [form, setForm] = useState({ name: "", phone: "", bonusPoints: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filtered = useMemo(() => {
    let list = customers.filter(c => (c.name + c.phone).toLowerCase().includes(search.toLowerCase()));
    if (sortBy === "spent") list = [...list].sort((a, b) => (b.spent || 0) - (a.spent || 0));
    else if (sortBy === "orders") list = [...list].sort((a, b) => (b.orders || 0) - (a.orders || 0));
    else if (sortBy === "name") list = [...list].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else list = [...list].sort((a, b) => (b.date || "").localeCompare(a.date || "")); // eng yangi birinchi
    return list;
  }, [customers, search, sortBy]);

  const openAdd = () => { setEditingId(null); setForm({ name: "", phone: "", bonusPoints: "" }); setError(""); setOpen(true); };
  const openEdit = (c) => {
    setEditingId(c.id);
    setForm({ name: c.name || "", phone: c.phone || "", bonusPoints: String(c.bonusPoints || 0) });
    setError("");
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) { setError(t.common.required); return; }
    setSaving(true);
    const data = { name: form.name.trim(), phone: form.phone.trim(), bonusPoints: Number(form.bonusPoints) || 0 };
    if (editingId) {
      await updateItem(COL.customers, editingId, data);
    } else {
      await addItem(COL.customers, { ...data, orders: 0, spent: 0, date: todayISO() });
    }
    setSaving(false);
    setOpen(false);
    setEditingId(null);
    setForm({ name: "", phone: "", bonusPoints: "" });
    setError("");
  };

  const remove = async (id) => {
    await deleteItem(COL.customers, id);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{t.customers.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.customers.searchPh}
              className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-emerald-500">
            <option value="date">{t.customers.sortDate}</option>
            <option value="spent">{t.customers.sortSpent}</option>
            <option value="orders">{t.customers.sortOrders}</option>
            <option value="name">{t.customers.sortName}</option>
          </select>
          <button onClick={() => exportCustomersToCSV(filtered, t)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Download size={16} /> {t.orders.export}
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus size={16} /> {t.customers.add}
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} text={t.customers.empty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-400">
                <th className="pb-2 font-medium">{t.customers.name}</th>
                <th className="pb-2 font-medium">{t.customers.tier}</th>
                <th className="pb-2 font-medium">{t.customers.phone}</th>
                <th className="pb-2 font-medium">{t.customers.orders}</th>
                <th className="pb-2 font-medium">{t.customers.spent}</th>
                <th className="pb-2 font-medium">{t.customers.date}</th>
                <th className="pb-2 font-medium text-right">{t.customers.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelectedCustomer(c)} className="cursor-pointer border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 font-medium text-slate-700">{c.name}</td>
                  <td className="py-2.5"><TierBadge tier={customerTier(c)} t={t} /></td>
                  <td className="py-2.5 text-slate-600">{c.phone}</td>
                  <td className="py-2.5 text-slate-600">{c.orders || 0}</td>
                  <td className="py-2.5 text-slate-600">{fmtMoney(c.spent)} {t.common.uzs}</td>
                  <td className="py-2.5 text-slate-500">{c.date}</td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(c.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <Modal title={editingId ? t.customers.edit : t.customers.add} onClose={() => setOpen(false)}>
          <Field label={t.customers.name} error={error && !form.name ? error : ""}>
            <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label={t.customers.phone} error={error && !form.phone ? error : ""}>
            <input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" />
          </Field>
          <Field label={t.customers.bonusPoints}>
            <input type="number" min="0" className={inputCls} value={form.bonusPoints} onChange={e => setForm({ ...form, bonusPoints: e.target.value })} />
          </Field>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setOpen(false)} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
            <button onClick={submit} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </Modal>
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={customers.find(c => c.id === selectedCustomer.id) || selectedCustomer}
          orders={orders}
          t={t}
          onClose={() => setSelectedCustomer(null)}
          onEdit={() => { setSelectedCustomer(null); openEdit(selectedCustomer); }}
        />
      )}
    </div>
  );
}

/** Mijoz bosilganda ochiladigan detail oyna — buyurtmalar tarixi va bonus ballar bilan. */
function CustomerDetailModal({ customer, orders, t, onClose, onEdit }) {
  const [pointsInput, setPointsInput] = useState("");
  const [savingPoints, setSavingPoints] = useState(false);

  const customerOrders = useMemo(() => {
    const map = new Map();
    orders.forEach(o => {
      const matches = (customer.phone && o.phone === customer.phone) || (customer.telegramUserId && o.telegramUserId === customer.telegramUserId);
      if (matches) map.set(o.id, o);
    });
    return Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [orders, customer]);

  const adjustPoints = async (delta) => {
    const amount = delta === 0 ? Number(pointsInput) || 0 : delta;
    if (amount === 0) return;
    setSavingPoints(true);
    await updateItem(COL.customers, customer.id, { bonusPoints: Math.max(0, (Number(customer.bonusPoints) || 0) + amount) });
    setSavingPoints(false);
    setPointsInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800">{customer.name}</h3>
            <TierBadge tier={customerTier(customer)} t={t} />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={16} /></button>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-600"><X size={18} /></button>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {/* Asosiy ma'lumot */}
          <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-gray-100 p-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">{t.customers.phone}</p>
              <p className="font-medium text-slate-700">{customer.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.orders}</p>
              <p className="font-medium text-slate-700">{customer.orders || 0}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.spent}</p>
              <p className="font-medium text-slate-700">{fmtMoney(customer.spent)} {t.common.uzs}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">{t.customers.date}</p>
              <p className="font-medium text-slate-700">{customer.date || "—"}</p>
            </div>
          </div>

          {/* Bog'lanish */}
          {(customer.phone || customer.telegramUsername) && (
            <div className="mb-4 flex gap-2">
              {customer.phone && (
                <a href={`tel:${customer.phone.replace(/[^\d+]/g, "")}`} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Phone size={14} /> {t.orders.call}
                </a>
              )}
              {customer.telegramUsername && (
                <a href={`https://t.me/${customer.telegramUsername}`} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
                  <Send size={14} /> {t.orders.messageTelegram}
                </a>
              )}
            </div>
          )}

          {/* Bonus ballar */}
          <div className="mb-4 rounded-xl border border-gray-100 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-600">{t.customers.bonusPoints}</p>
              <p className="text-lg font-bold text-amber-500">{customer.bonusPoints || 0}</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className={inputCls}
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                placeholder={t.customers.pointsHint}
              />
              <button onClick={() => adjustPoints(0)} disabled={savingPoints || !pointsInput} className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
                <Plus size={13} /> {t.customers.addPoints}
              </button>
            </div>
          </div>

          {/* Buyurtmalar tarixi */}
          <p className="mb-2 text-sm font-semibold text-slate-700">{t.customers.orderHistory}</p>
          {customerOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} text={t.dashboard.noOrders} />
          ) : (
            <div className="space-y-2">
              {customerOrders.map(o => (
                <div key={o.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{o.date}</span>
                    <StatusBadge status={o.status} labels={t.orders.st} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{fmtMoney(o.amount)} {t.common.uzs}</p>
                  {Array.isArray(o.items) && o.items.length > 0 && (
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {o.items.map(it => `${it.productName} ×${it.qty}`).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PRODUCTS PAGE
--------------------------------------------------------------- */
/** Joriy mahsulot ro'yxatini CSV faylga aylantirib yuklab beradi. */
function exportProductsToCSV(list, t, lang) {
  const headers = [t.products.name, t.products.brand, t.products.category, t.products.price, t.products.oldPrice, t.products.stock];
  const rows = list.map(p => [pname(p, lang) || "", p.brand || "", p.category || "", p.price || 0, p.oldPrice || 0, p.stockType === "unlimited" ? t.products.unlimited : p.stockType === "out" ? 0 : (p.stock ?? 0)]);
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mahsulotlar-${todayISO()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Kategoriya yoki brendlarni boshqarish oynasi (ikkisi uchun ham bir xil
 * komponent ishlatiladi). Nomi o'zgartirilsa yoki o'chirilsa, shu
 * kategoriya/brendga tegishli barcha mahsulotlar ham avtomatik yangilanadi.
 */
function TaxonomyModal({ title, items, collectionName, productField, products, onClose, t }) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [newValue, setNewValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const countFor = (name) => products.filter(p => p[productField] === name).length;

  const startEdit = (item) => { setEditingId(item.id); setEditValue(item.name); };
  const cancelEdit = () => { setEditingId(null); setEditValue(""); };

  const saveEdit = async (item) => {
    const newName = editValue.trim();
    if (!newName || newName === item.name) { cancelEdit(); return; }
    setBusy(true);
    await updateItem(collectionName, item.id, { name: newName });
    const affected = products.filter(p => p[productField] === item.name);
    await Promise.all(affected.map(p => updateItem(COL.products, p.id, { [productField]: newName })));
    setBusy(false);
    cancelEdit();
  };

  const remove = async (item) => {
    setBusy(true);
    await deleteItem(collectionName, item.id);
    const affected = products.filter(p => p[productField] === item.name);
    await Promise.all(affected.map(p => updateItem(COL.products, p.id, { [productField]: "" })));
    setBusy(false);
  };

  const addNew = async () => {
    const name = newValue.trim();
    if (!name) return;
    const exists = items.some(i => i.name.toLowerCase() === name.toLowerCase());
    if (exists) { setNewValue(""); return; }
    setBusy(true);
    await addItem(collectionName, { name });
    setBusy(false);
    setNewValue("");
  };

  const uploadItemImage = async (item, file) => {
    if (!file) return;
    setUploadingId(item.id);
    try {
      const url = await uploadImage(`${collectionName}/${item.id}/image`, file);
      await updateItem(collectionName, item.id, { imageUrl: url });
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploadingId(null);
  };

  return (
    <Modal title={title} onClose={onClose}>
      <div className="mb-3 flex gap-2">
        <input
          className={inputCls}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addNew(); }}
          placeholder={t.products.newItemPh}
        />
        <button onClick={addNew} disabled={busy || !newValue.trim()} className="flex shrink-0 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          <Plus size={14} />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Tag} text={t.products.noItems} />
      ) : (
        <div className="max-h-80 space-y-1.5 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
              <label className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300 hover:bg-gray-100">
                {uploadingId === item.id ? (
                  <Loader2 size={14} className="animate-spin text-emerald-600" />
                ) : item.imageUrl ? (
                  <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={14} />
                )}
                <input type="file" accept="image/*" className="hidden" disabled={uploadingId === item.id}
                  onChange={(e) => uploadItemImage(item, e.target.files?.[0])} />
              </label>
              {editingId === item.id ? (
                <>
                  <input
                    autoFocus
                    className={inputCls}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(item); if (e.key === "Escape") cancelEdit(); }}
                  />
                  <button onClick={() => saveEdit(item)} disabled={busy} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"><Save size={15} /></button>
                  <button onClick={cancelEdit} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-100"><X size={15} /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm text-slate-700">
                    {item.name} <span className="text-xs text-slate-400">({countFor(item.name)} {t.common.ta})</span>
                  </span>
                  <button onClick={() => startEdit(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={15} /></button>
                  <button onClick={() => remove(item)} disabled={busy} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/**
 * "O'zingizga mos uslubni toping" bo'limi uchun to'plamlarni (kolleksiyalarni)
 * boshqarish oynasi. Har bir to'plam: sarlavha, o'zingiz yuklagan rasm, va
 * unga biriktirilgan mahsulotlar ro'yxati — mijoz bosganda faqat o'sha
 * mahsulotlar ko'rinadi.
 */
function CollectionsModal({ lang, collections, products, onClose, t }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // null = yangi

  const sorted = [...collections].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const remove = async (item) => { await deleteItem(COL.collections, item.id); };
  const toggleActive = async (item) => { await updateItem(COL.collections, item.id, { active: !(item.active !== false) }); };
  const move = async (item, direction) => {
    const idx = sorted.findIndex((x) => x.id === item.id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      updateItem(COL.collections, item.id, { order: swapWith.order ?? 0 }),
      updateItem(COL.collections, swapWith.id, { order: item.order ?? 0 }),
    ]);
  };

  return (
    <>
      <Modal title={t.products.collectionsBtn} onClose={onClose}>
        <div className="mb-3 flex justify-end">
          <button
            onClick={() => { setEditingItem(null); setFormOpen(true); }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={14} /> {t.products.collectionAdd}
          </button>
        </div>

        {sorted.length === 0 ? (
          <EmptyState icon={LayoutGrid} text={t.products.collectionEmpty} />
        ) : (
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {sorted.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-gray-100 p-2">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                  {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{collectionTitle(item, lang) || "—"}</p>
                  <p className="text-xs text-slate-400">{(item.productIds || []).length} {t.common.ta} · {item.displayStyle === "banner" ? t.products.collectionStyleBanner : item.displayStyle === "cardBottom" ? t.products.collectionStyleCardBottom : t.products.collectionStyleCard}</p>
                </div>
                <button onClick={() => move(item, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30"><ArrowUp size={14} /></button>
                <button onClick={() => move(item, 1)} disabled={i === sorted.length - 1} className="rounded-lg p-1.5 text-slate-400 hover:bg-gray-50 disabled:opacity-30"><ArrowDown size={14} /></button>
                <button onClick={() => toggleActive(item)} className={`rounded-lg p-1.5 ${item.active !== false ? "text-emerald-600 hover:bg-emerald-50" : "text-slate-400 hover:bg-gray-50"}`}>
                  {item.active !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => { setEditingItem(item); setFormOpen(true); }} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600"><Pencil size={14} /></button>
                <button onClick={() => remove(item)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {formOpen && (
        <CollectionFormModal
          lang={lang}
          item={editingItem}
          collections={collections}
          products={products}
          onClose={() => setFormOpen(false)}
          t={t}
        />
      )}
    </>
  );
}

function CollectionFormModal({ lang, item, collections, products, onClose, t }) {
  const isNew = !item;
  const [titleUz, setTitleUz] = useState(item?.titleUz || item?.title || "");
  const [titleRu, setTitleRu] = useState(item?.titleRu || "");
  const [descriptionUz, setDescriptionUz] = useState(item?.descriptionUz || item?.description || "");
  const [descriptionRu, setDescriptionRu] = useState(item?.descriptionRu || "");
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || "");
  const [productIds, setProductIds] = useState(item?.productIds || []);
  const [active, setActive] = useState(item?.active !== false);
  const [displayStyle, setDisplayStyle] = useState(item?.displayStyle || "card");
  const [productSearch, setProductSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const id = item?.id || uid();

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(`collections/${id}/image`, file);
      setImageUrl(url);
    } catch (e) {
      console.error("Rasm yuklashda xatolik:", e);
    }
    setUploading(false);
  };

  const toggleProduct = (pid) => {
    setProductIds((prev) => (prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]));
  };

  const filteredProducts = products.filter((p) => pname(p, lang).toLowerCase().includes(productSearch.toLowerCase()));

  const submit = async () => {
    if (!titleUz.trim() && !titleRu.trim()) { setError(t.common.required); return; }
    setSaving(true);
    await setItem(COL.collections, id, {
      titleUz: titleUz.trim(),
      titleRu: titleRu.trim(),
      descriptionUz: descriptionUz.trim(),
      descriptionRu: descriptionRu.trim(),
      imageUrl,
      productIds,
      active,
      displayStyle,
      order: isNew ? collections.length : (item.order ?? 0),
    });
    setSaving(false);
    onClose();
  };

  return (
    <Modal title={isNew ? t.products.collectionAdd : t.products.collectionEdit} onClose={onClose}>
      <Field label={t.products.collectionTitleUz} error={error}>
        <input className={inputCls} value={titleUz} onChange={(e) => setTitleUz(e.target.value)} placeholder={t.products.collectionTitlePh} />
      </Field>
      <Field label={t.products.collectionTitleRu}>
        <input className={inputCls} value={titleRu} onChange={(e) => setTitleRu(e.target.value)} placeholder={t.products.collectionTitleRuPh} />
      </Field>

      <Field label={t.products.collectionDescriptionUz}>
        <textarea
          className={`${inputCls} min-h-[60px] resize-y`}
          value={descriptionUz}
          onChange={(e) => setDescriptionUz(e.target.value)}
          placeholder={t.products.collectionDescriptionPh}
        />
      </Field>
      <Field label={t.products.collectionDescriptionRu}>
        <textarea
          className={`${inputCls} min-h-[60px] resize-y`}
          value={descriptionRu}
          onChange={(e) => setDescriptionRu(e.target.value)}
          placeholder={t.products.collectionDescriptionRuPh}
        />
      </Field>

      <Field label={t.products.collectionImage}>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-slate-300">
            {imageUrl ? <img src={imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon size={20} />}
          </div>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50">
            {uploading ? <Loader2 size={14} className="animate-spin" /> : null}
            {uploading ? t.common.saving : t.products.collectionUpload}
            <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => handleUpload(e.target.files?.[0])} />
          </label>
        </div>
      </Field>

      <Field label={t.products.collectionStyle}>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setDisplayStyle("card")}
            className={`rounded-lg border px-2.5 py-2.5 text-xs font-medium ${displayStyle === "card" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}
          >
            {t.products.collectionStyleCard}
            <span className="mt-1 block text-[10px] font-normal text-slate-400">{t.products.collectionStyleCardHint}</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayStyle("cardBottom")}
            className={`rounded-lg border px-2.5 py-2.5 text-xs font-medium ${displayStyle === "cardBottom" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}
          >
            {t.products.collectionStyleCardBottom}
            <span className="mt-1 block text-[10px] font-normal text-slate-400">{t.products.collectionStyleCardBottomHint}</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayStyle("banner")}
            className={`rounded-lg border px-2.5 py-2.5 text-xs font-medium ${displayStyle === "banner" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"}`}
          >
            {t.products.collectionStyleBanner}
            <span className="mt-1 block text-[10px] font-normal text-slate-400">{t.products.collectionStyleBannerHint}</span>
          </button>
        </div>
      </Field>

      <div className="mb-3 rounded-lg border border-gray-100 p-3">
        <p className="mb-1 text-xs font-medium text-slate-600">{t.products.collectionProducts}</p>
        <p className="mb-2 text-[11px] text-slate-400">{productIds.length} {t.common.ta} {t.products.collectionSelected}</p>
        <div className="relative mb-2">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputCls} pl-8 text-xs`}
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder={t.products.searchPh}
          />
        </div>
        <div className="max-h-48 space-y-1 overflow-y-auto">
          {filteredProducts.map((p) => {
            const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
            const checked = productIds.includes(p.id);
            return (
              <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg p-1.5 text-xs ${checked ? "bg-emerald-50" : "hover:bg-gray-50"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggleProduct(p.id)} className="rounded" />
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-gray-100 text-slate-300">
                  {thumb ? <img src={thumb} alt="" className="h-full w-full object-cover" /> : <Package size={12} />}
                </div>
                <span className="flex-1 truncate">{pname(p, lang)}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
        <span className="text-xs font-medium text-slate-600">{active ? t.products.active : t.products.inactive}</span>
        <button type="button" onClick={() => setActive(!active)} className={`relative h-6 w-11 rounded-full transition ${active ? "bg-emerald-600" : "bg-gray-300"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${active ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
        <button onClick={submit} disabled={saving || uploading} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} {saving ? t.common.saving : t.common.save}
        </button>
      </div>
    </Modal>
  );
}

function ProductsPage({ lang, products, categories, brands, collections }) {
  const t = T[lang];
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null = qo'shish
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkCategory, setBulkCategory] = useState("");
  const [quickEdit, setQuickEdit] = useState(null); // { id, field }
  const [quickEditValue, setQuickEditValue] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = products
      .filter(p => pname(p, lang).toLowerCase().includes(search.toLowerCase()))
      .filter(p => activeCategory === "all" || p.category === activeCategory);
    if (sortBy === "priceAsc") list = [...list].sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "priceDesc") list = [...list].sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "stock") list = [...list].sort((a, b) => (a.stock ?? 99999) - (b.stock ?? 99999));
    else if (sortBy === "rating") list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else list = [...list].sort((a, b) => pname(a, lang).localeCompare(pname(b, lang)));
    return list;
  }, [products, search, activeCategory, sortBy, lang]);

  /** Eski (singular) imageUrl bilan yaratilgan mahsulotlar bilan orqaga moslik. */
  const productThumb = (p) => (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";

  const openAdd = () => { setEditingProduct(null); setFormOpen(true); };
  const openEdit = (p) => { setEditingProduct(p); setFormOpen(true); };

  /** Yangi kategoriya kiritilgan bo'lsa, "categories" kolleksiyasiga qo'shib qo'yamiz. */
  const ensureCategorySaved = async (categoryName) => {
    const name = categoryName.trim();
    if (!name) return;
    const exists = categories.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (!exists) await addItem(COL.categories, { name });
  };

  /** Yangi brend kiritilgan bo'lsa, "brands" kolleksiyasiga qo'shib qo'yamiz. */
  const ensureBrandSaved = async (brandName) => {
    const name = brandName.trim();
    if (!name) return;
    const exists = brands.some(b => b.name.toLowerCase() === name.toLowerCase());
    if (!exists) await addItem(COL.brands, { name });
  };

  const remove = async (id) => {
    await deleteItem(COL.products, id);
  };

  /** Mahsulotni nusxalaydi — bir xil ma'lumot, yangi ID, nomiga "(nusxa)" qo'shiladi. */
  const duplicate = async (p) => {
    const newId = uid();
    const { id, ...rest } = p;
    await setItem(COL.products, newId, {
      ...rest,
      nameUz: rest.nameUz ? `${rest.nameUz} (nusxa)` : rest.nameUz,
      nameRu: rest.nameRu ? `${rest.nameRu} (копия)` : rest.nameRu,
      name: rest.name ? `${rest.name} (nusxa)` : rest.name,
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds(prev => (prev.size === filtered.length ? new Set() : new Set(filtered.map(p => p.id))));
  };
  const bulkDelete = async () => {
    await Promise.all(Array.from(selectedIds).map(id => deleteItem(COL.products, id)));
    setSelectedIds(new Set());
  };
  const applyBulkCategory = async () => {
    if (!bulkCategory) return;
    await Promise.all(Array.from(selectedIds).map(id => updateItem(COL.products, id, { category: bulkCategory })));
    await ensureCategorySaved(bulkCategory);
    setSelectedIds(new Set());
    setBulkCategory("");
  };

  const startQuickEdit = (p, field) => {
    setQuickEdit({ id: p.id, field });
    setQuickEditValue(field === "price" ? String(p.price ?? "") : String(p.stock ?? ""));
  };
  const saveQuickEdit = async () => {
    if (!quickEdit) return;
    const value = Number(quickEditValue) || 0;
    await updateItem(COL.products, quickEdit.id, { [quickEdit.field]: value });
    setQuickEdit(null);
  };

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800">{t.products.title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.products.searchPh}
              className="w-56 rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-lg border border-gray-200 px-2.5 py-2 text-sm text-slate-600 outline-none focus:border-emerald-500">
            <option value="name">{t.products.sortName}</option>
            <option value="priceAsc">{t.products.sortPriceAsc}</option>
            <option value="priceDesc">{t.products.sortPriceDesc}</option>
            <option value="stock">{t.products.sortStock}</option>
            <option value="rating">{t.products.sortRating}</option>
          </select>
          <button onClick={() => setCategoryModalOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Tag size={16} /> {t.products.categoriesBtn}
          </button>
          <button onClick={() => setBrandModalOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Tag size={16} /> {t.products.brandsBtn}
          </button>
          <button onClick={() => setCollectionsModalOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <LayoutGrid size={16} /> {t.products.collectionsBtn}
          </button>
          <button onClick={() => exportProductsToCSV(filtered, t, lang)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-medium text-slate-600 hover:bg-gray-50">
            <Download size={16} /> {t.orders.export}
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            <Plus size={16} /> {t.products.add}
          </button>
        </div>
      </div>

      {/* Kategoriya tablari */}
      {categories.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
          <button
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === "all" ? "bg-emerald-600 text-white" : "bg-gray-50 text-slate-500 hover:bg-gray-100"}`}
          >
            {t.orders.tabAll} <span className={`ml-1 rounded-full px-1.5 text-[10px] ${activeCategory === "all" ? "bg-white/20" : "bg-white text-slate-400"}`}>{products.length}</span>
          </button>
          {categories.map(c => {
            const count = products.filter(p => p.category === c.name).length;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.name)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${activeCategory === c.name ? "bg-emerald-600 text-white" : "bg-gray-50 text-slate-500 hover:bg-gray-100"}`}
              >
                {c.name} <span className={`ml-1 rounded-full px-1.5 text-[10px] ${activeCategory === c.name ? "bg-white/20" : "bg-white text-slate-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Ommaviy amal paneli */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-800 px-4 py-2.5 text-sm text-white">
          <span className="font-medium">{selectedIds.size} {t.orders.selected}</span>
          <select value={bulkCategory} onChange={e => setBulkCategory(e.target.value)} className="rounded-lg border border-white/20 bg-slate-700 px-2 py-1.5 text-xs text-white outline-none">
            <option value="">{t.products.category}...</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <button onClick={applyBulkCategory} disabled={!bulkCategory} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50">{t.orders.applyBulk}</button>
          <button onClick={bulkDelete} className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium hover:bg-rose-500">
            <Trash2 size={13} /> {t.common.delete}
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-white/70 hover:text-white">{t.orders.clearSelection}</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} text={t.products.empty} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-slate-400">
                <th className="w-8 pb-2">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </th>
                <th className="pb-2 font-medium">{t.products.name}</th>
                <th className="pb-2 font-medium">{t.products.brand}</th>
                <th className="pb-2 font-medium">{t.products.category}</th>
                <th className="pb-2 font-medium">{t.products.price}</th>
                <th className="pb-2 font-medium">{t.products.stock}</th>
                <th className="pb-2 font-medium text-right">{t.products.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-2.5">
                    <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded" />
                  </td>
                  <td className="py-2.5 font-medium text-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50 text-slate-300">
                        {productThumb(p) ? (
                          <img src={productThumb(p)} alt={pname(p, lang)} className="h-full w-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                        ) : (
                          <Package size={14} />
                        )}
                      </div>
                      <span className="truncate">{pname(p, lang)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-slate-600">{p.brand || "—"}</td>
                  <td className="py-2.5 text-slate-600">{p.category || "—"}</td>

                  {/* Narx — tezkor tahrirlash: bosilganda inputga aylanadi */}
                  <td className="py-2.5 text-slate-600">
                    {quickEdit && quickEdit.id === p.id && quickEdit.field === "price" ? (
                      <input
                        type="number"
                        autoFocus
                        value={quickEditValue}
                        onChange={e => setQuickEditValue(e.target.value)}
                        onBlur={saveQuickEdit}
                        onKeyDown={e => { if (e.key === "Enter") saveQuickEdit(); if (e.key === "Escape") setQuickEdit(null); }}
                        className="w-24 rounded-lg border border-emerald-400 px-2 py-1 text-xs outline-none"
                      />
                    ) : (
                      <button onClick={() => startQuickEdit(p, "price")} className="rounded px-1 hover:bg-gray-100" title={t.products.quickEditHint}>
                        {p.oldPrice > p.price && <span className="mr-1.5 text-xs text-slate-400 line-through">{fmtMoney(p.oldPrice)}</span>}
                        {fmtMoney(p.price)} {t.common.uzs}
                        {p.oldPrice > p.price && (
                          <span className="ml-1.5 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
                            -{discountPct(p.price, p.oldPrice)}%
                          </span>
                        )}
                      </button>
                    )}
                  </td>

                  {/* Qoldiq — tezkor tahrirlash */}
                  <td className="py-2.5 text-slate-600">
                    {p.stockType === "unlimited" ? (
                      t.products.unlimited
                    ) : p.stockType === "out" ? (
                      <span className="text-rose-500">{t.products.outOfStock}</span>
                    ) : quickEdit && quickEdit.id === p.id && quickEdit.field === "stock" ? (
                      <input
                        type="number"
                        autoFocus
                        value={quickEditValue}
                        onChange={e => setQuickEditValue(e.target.value)}
                        onBlur={saveQuickEdit}
                        onKeyDown={e => { if (e.key === "Enter") saveQuickEdit(); if (e.key === "Escape") setQuickEdit(null); }}
                        className="w-20 rounded-lg border border-emerald-400 px-2 py-1 text-xs outline-none"
                      />
                    ) : (
                      <button onClick={() => startQuickEdit(p, "stock")} className="rounded px-1 hover:bg-gray-100" title={t.products.quickEditHint}>
                        {p.stock ?? 0} {t.common.ta}
                      </button>
                    )}
                  </td>

                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => duplicate(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" title={t.products.duplicate}>
                        <Copy size={15} />
                      </button>
                      <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => remove(p.id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen && (
        <ProductForm
          lang={lang}
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => setFormOpen(false)}
          onEnsureCategory={ensureCategorySaved}
          onEnsureBrand={ensureBrandSaved}
        />
      )}

      {categoryModalOpen && (
        <TaxonomyModal
          title={t.products.categoriesBtn}
          items={categories}
          collectionName={COL.categories}
          productField="category"
          products={products}
          onClose={() => setCategoryModalOpen(false)}
          t={t}
        />
      )}

      {brandModalOpen && (
        <TaxonomyModal
          title={t.products.brandsBtn}
          items={brands}
          collectionName={COL.brands}
          productField="brand"
          products={products}
          onClose={() => setBrandModalOpen(false)}
          t={t}
        />
      )}

      {collectionsModalOpen && (
        <CollectionsModal
          lang={lang}
          collections={collections}
          products={products}
          onClose={() => setCollectionsModalOpen(false)}
          t={t}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   PLACEHOLDER PAGE
--------------------------------------------------------------- */
function SoonPage({ lang, label }) {
  const t = T[lang];
  return (
    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
      <AlertCircle className="mx-auto mb-3 text-slate-300" size={36} />
      <h2 className="mb-1 text-base font-semibold text-slate-700">{label}</h2>
      <p className="text-sm text-slate-400">{t.soon}</p>
    </div>
  );
}

/* ---------------------------------------------------------------
   ADMIN LOGIN
--------------------------------------------------------------- */
function AdminLogin({ lang }) {
  const t = T[lang];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      setError(t.login.wrong);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[600px] w-full items-center justify-center bg-gray-50 p-6" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Lock size={20} />
          </div>
          <h2 className="text-base font-semibold text-slate-800">{t.login.title}</h2>
        </div>
        <Field label={t.login.email}>
          <input type="email" required className={inputCls} value={email} onChange={e => setEmail(e.target.value)} />
        </Field>
        <Field label={t.login.password} error={error}>
          <input type="password" required className={inputCls} value={password} onChange={e => setPassword(e.target.value)} />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />} {loading ? t.login.loading : t.login.submit}
        </button>
      </form>
    </div>
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
  const [wishlist, setWishlist] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [myOrdersLoading, setMyOrdersLoading] = useState(false);
  // Telefon raqamini brauzerda saqlaymiz (localStorage) — shu orqali
  // Telegram tashqarisidagi mijoz ham keyingi safar "Buyurtmalarim"ni ko'radi.
  const [myPhone, setMyPhone] = useState(() => {
    try { return localStorage.getItem("savdo_my_phone") || ""; } catch { return ""; }
  });
  const [phoneInput, setPhoneInput] = useState(myPhone);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [customersCount, setCustomersCount] = useState(null);
  useEffect(() => {
    getCustomersCount().then(setCustomersCount);
  }, []);
  const avgRating = useMemo(() => {
    const rated = products.filter(p => Number(p.rating) > 0);
    if (!rated.length) return 0;
    return rated.reduce((s, p) => s + Number(p.rating), 0) / rated.length;
  }, [products]);
  const [cart, setCart] = useState({}); // productId -> qty
  // Har bir mahsulot qaysi kolleksiya orqali savatga tushgani (savatda
  // guruhlab, kolleksiya nomi bilan ko'rsatish uchun). productId -> kolleksiya nomi.
  const [cartCollectionTags, setCartCollectionTags] = useState({});
  const [expandedCartGroups, setExpandedCartGroups] = useState(new Set());
  const popularRowRef = useRef(null);
  const scrollPopularPrev = () => popularRowRef.current?.scrollBy({ left: -320, behavior: "smooth" });
  const scrollPopularNext = () => popularRowRef.current?.scrollBy({ left: 320, behavior: "smooth" });
  const { viewportRef: discountViewportRef, scrollPrev: scrollDiscountPrev, scrollNext: scrollDiscountNext } = useCarouselRow();
  const { viewportRef: catalogViewportRef, scrollPrev: scrollCatalogPrev, scrollNext: scrollCatalogNext } = useCarouselRow();
  const { viewportRef: brandViewportRef, scrollPrev: scrollBrandPrev, scrollNext: scrollBrandNext } = useCarouselRow();
  const [cartOpen, setCartOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("home");
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [otpStep, setOtpStep] = useState("phone"); // "phone" | "code"
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", payment: "cash", address: "" });
  const [location, setLocation] = useState(null); // {lat, lng}
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);

  // Telegram ichida ochilgan bo'lsa — ismni avtomatik to'ldiramiz
  // (foydalanuvchi kerak bo'lsa o'zi qayta o'zgartira oladi).
  useEffect(() => {
    if (tgUser) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      setForm(f => (f.name ? f : { ...f, name: fullName }));
    }
  }, [tgUser]);

  // Saqlangan telefon raqami bo'lsa, checkout formadagi telefonni ham avtomatik to'ldiramiz.
  useEffect(() => {
    if (myPhone) setForm(f => (f.phone ? f : { ...f, phone: myPhone }));
  }, [myPhone]);

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
  }, [storeSettings?.seoTitle, storeSettings?.seoDescription, storeSettings?.seoKeywords, storeSettings?.storeName]);

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

  /** Profil tugmasi bosilganda — telefon hali bog'lanmagan bo'lsa (va Telegram
   *  ichida bo'lmasa) avval "Kirish/ro'yxatdan o'tish" ekranini ko'rsatamiz. */
  const openProfile = () => {
    if (!inTelegram && !myPhone) {
      setOtpStep("phone");
      setOtpCode("");
      setOtpError("");
      setPhoneLoginOpen(true);
    } else setProfileOpen(true);
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
      setProfileOpen(true);
      setOtpStep("phone");
      setOtpCode("");
    } catch {
      setOtpError(t.store.profile.otpWrong);
    }
    setOtpSending(false);
  };

  const categoryNames = useMemo(() => {
    return [t.store.allCategories, ...categories.map(c => c.name)];
  }, [categories, lang]);

  const filtered = activeCollection
    ? products.filter(p => (activeCollection.productIds || []).includes(p.id))
    : products.filter(p =>
        pname(p, lang).toLowerCase().includes(search.toLowerCase()) &&
        (activeCategory === t.store.allCategories || p.category === activeCategory) &&
        (activeBrand === t.store.allBrands || p.brand === activeBrand)
      );
  const brandFiltered = products.filter(p => activeBrand === t.store.allBrands || p.brand === activeBrand);

  const toggleWishlist = (id) => {
    setWishlist(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const wishlistItems = products.filter(p => wishlist.has(p.id));

  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find(p => p.id === id), qty }))
    .filter(i => i.product && i.qty > 0);
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cartItems.reduce((s, i) => s + i.product.price * i.qty, 0);

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
      } else if (found.minOrder > 0 && cartTotal < found.minOrder) {
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

  const addToCart = (p) => {
    if (p.stockType === "out") return;
    setCart(prev => {
      const current = prev[p.id] || 0;
      if (p.stockType === "limited" && current >= (p.stock || 0)) return prev;
      hapticFeedback("impact", "light");
      return { ...prev, [p.id]: current + 1 };
    });
  };

  /**
   * Kolleksiyadagi barcha mahsulotlarni bir bosishda savatga qo'shadi
   * (har biridan 1 donadan, qoldiq mavjud bo'lsa) va ularni shu
   * kolleksiya nomi bilan "belgilaydi" — shuning uchun savatda alohida
   * mahsulot nomlari o'rniga kolleksiya nomi bilan guruhlanib ko'rinadi.
   */
  const addAllCollectionToCart = (collection, collectionProducts) => {
    let addedAny = false;
    const newTags = {};
    collectionProducts.forEach(p => {
      if ((p.stockType || "limited") === "out") return;
      addToCart(p);
      newTags[p.id] = collectionTitle(collection, lang);
      addedAny = true;
    });
    if (addedAny) {
      setCartCollectionTags(prev => ({ ...prev, ...newTags }));
      hapticFeedback("notification", "success");
      setCartOpen(true);
    }
  };

  const addLinkedProductsToCart = (linkedProducts) => {
    let addedAny = false;
    linkedProducts.forEach(p => {
      if ((p.stockType || "limited") === "out") return;
      addToCart(p);
      addedAny = true;
    });
    if (addedAny) {
      hapticFeedback("notification", "success");
      setCartOpen(true);
    }
  };
  const changeQty = (id, delta) => {
    setCart(prev => {
      const next = Math.max(0, (prev[id] || 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  // Telegram ichida bo'lsak, checkout oynasi ochilganda Telegramning
  // o'z (pastki, katta) tugmasini "Buyurtmani tasdiqlash" uchun ishlatamiz.
  useEffect(() => {
    const tg = getWebApp();
    if (!tg || !tg.MainButton) return;

    if (checkoutOpen && !done) {
      tg.MainButton.setText(t.store.placeOrder);
      tg.MainButton.show();
      const handler = () => submitOrder();
      tg.MainButton.onClick(handler);
      return () => {
        tg.MainButton.offClick(handler);
        tg.MainButton.hide();
      };
    } else {
      tg.MainButton.hide();
    }
  }, [checkoutOpen, done, form, location, cartTotal]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocError(t.store.locationError);
      return;
    }
    setLocating(true);
    setLocError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setLocError(t.store.locationError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submitOrder = async () => {
    if (!form.name.trim() || !form.address.trim() || cartItems.length === 0) {
      setError(t.common.required);
      return;
    }
    if (!isValidUzPhone(form.phone)) {
      setError(t.store.phoneInvalid);
      return;
    }
    setPlacing(true);

    const phone = form.phone.trim();
    const existing = await findCustomerByPhone(phone);

    const orderData = {
      customer: form.name.trim(),
      phone,
      amount: cartTotalAfterDiscount,
      status: "new",
      date: todayISO(),
      payment: form.payment,
      address: form.address.trim(),
      location: location || null,
      promoCode: appliedPromo?.code || null,
      promoDiscount: promoDiscount || 0,
      items: cartItems.map(i => ({
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
        cartItems,
        existingCustomer: existing,
        customerName: form.name.trim(),
        customerPhone: phone,
        customerAddress: form.address.trim(),
        cartTotal: cartTotalAfterDiscount,
        orderData,
      });

      if (appliedPromo) {
        incrementPromoCodeUsage(appliedPromo.id);
      }

      hapticFeedback("notification", "success");
      setPlacing(false);
      setDone(true);
      setCart({});
      setCartCollectionTags({});

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

  const resetAll = () => {
    setDone(false);
    setCheckoutOpen(false);
    setCartOpen(false);
    setForm({ name: "", phone: "", payment: "cash", address: "" });
    setLocation(null);
    setLocError("");
    setError("");
    removePromoCode();
  };

  return (
    <div
      className="min-h-[600px] w-full bg-white"
      style={{ fontFamily: "Inter, system-ui, sans-serif", backgroundColor: "var(--tg-secondary-bg-color, #FFF7F8)" }}
    >
      {/* Store header */}
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            {storeSettings?.logoUrl ? (
              <img src={storeSettings.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-xl object-cover" />
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
              { label: t.store.navCategories, id: "categories-section" },
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
            <button onClick={() => setCartOpen(true)} className="relative flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-stone-600 hover:bg-rose-50">
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

      {/* Hero banner — admin panelning "Banner" bo'limidan boshqariladi */}
      <div className="relative px-4 pt-6 min-[769px]:px-6">
        <Banner banners={banners} inTelegram={inTelegram} t={t} products={products} onAddLinkedProducts={addLinkedProductsToCart} />
        {/* Suzuvchi chat tugmasi — keyinchalik AI agent shu yerga ulanadi */}
        <button
          onClick={() => setAiChatOpen(true)}
          aria-label="Chat"
          className="absolute right-7 top-9 flex h-10 w-10 items-center justify-center rounded-full bg-white text-stone-700 shadow-lg transition hover:scale-105 min-[769px]:right-9 min-[769px]:top-9"
        >
          <MessageCircle size={19} />
        </button>
      </div>

      {/* Mobil qidiruv — banner ostida (mobil ilovalardagi kabi) */}
      <div className="relative px-4 pt-4 md:hidden">
        <Search size={15} className="absolute left-7 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t.store.searchPh}
          className="w-full rounded-full border border-rose-100 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-stone-400" />
      </div>


      {/* Statistika banneri — real ma'lumotlar (mijozlar soni, o'rtacha reyting) */}
      {!search && (customersCount > 0 || avgRating > 0) && (
        <div className="px-4 pt-16 min-[769px]:px-6">
          <div className="flex flex-col items-center justify-between gap-6 rounded-2xl bg-rose-50 px-8 py-8 sm:flex-row sm:px-12">
            <div>
              <p style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-xl font-semibold text-stone-900 sm:text-2xl">{t.store.bestSellers}</p>
              <p className="mt-1 max-w-sm text-sm text-stone-500">{t.store.subtitle}</p>
            </div>
            <div className="flex gap-8 sm:gap-12">
              {customersCount > 0 && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-rose-500 sm:text-3xl">{customersCount >= 1000 ? `${Math.floor(customersCount / 1000)}K+` : `${customersCount}+`}</p>
                  <p className="text-xs text-stone-500">{t.store.happyCustomers}</p>
                </div>
              )}
              {avgRating > 0 && (
                <div className="text-center">
                  <p className="flex items-center justify-center gap-1 text-2xl font-bold text-rose-500 sm:text-3xl">
                    {avgRating.toFixed(1)} <Star size={18} className="fill-rose-500 text-rose-500" />
                  </p>
                  <p className="text-xs text-stone-500">{t.store.avgRating}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chegirmadagi mahsulotlar — narxi kamaytirilgan mahsulotlar, bitta gorizontal qatorda */}
      {!search && !activeCollection && products.some(p => p.oldPrice > p.price) && (
        <div className="px-4 pt-16 min-[769px]:px-6">
          <div className="rounded-none p-4 min-[769px]:mx-0 min-[769px]:rounded-[24px] min-[769px]:p-[40px_32px]" style={{ background: "linear-gradient(180deg, #2A2525 0%, #1E1B1B 100%)" }}>
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F6D365]">{t.store.discountsTag}</p>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl font-semibold text-[#F6D365] sm:text-3xl">{t.store.discountsTitle}</h2>
          </div>
          <div className="relative">
            <div ref={discountViewportRef} className="embla-viewport">
            <div className="embla-container gap-3 min-[769px]:gap-4">
              {products.filter(p => p.oldPrice > p.price).map(p => {
              const inCart = cart[p.id] || 0;
              const stockType = p.stockType || "limited";
              const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
              const hasDiscount = p.oldPrice > p.price;
              const pct = discountPct(p.price, p.oldPrice);
              const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
              const name = pname(p, lang);
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group flex w-[calc((100vw-48px)/2.8)] shrink-0 cursor-pointer flex-col rounded-2xl bg-white p-2 min-[769px]:p-3 transition hover:-translate-y-0.5 min-[481px]:w-[calc((100vw-48px)/3.2)] min-[769px]:w-48 min-[769px]:max-w-none"
                  style={{ boxShadow: "0 12px 35px rgba(0,0,0,.18)" }}
                >
                  <div className={`relative mb-3 aspect-square overflow-hidden rounded-xl text-stone-300 ${p.tint || "bg-rose-50"}`}>
                    {thumb ? (
                      <img src={thumb} alt={name} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110" draggable={false} onDragStart={(e) => e.preventDefault()} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Package size={32} strokeWidth={1.3} /></div>
                    )}
                    {hasDiscount && (
                      <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">-{pct}%</span>
                    )}
                  </div>
                  {p.brand && <p className="text-[11px] font-medium uppercase tracking-wide text-rose-400">{p.brand}</p>}
                  <p className="mb-1 line-clamp-2 text-xs font-medium text-stone-800 min-[769px]:text-sm">{name}</p>
                  <div className="mb-2 flex items-center gap-2">
                    {hasDiscount && <span className="text-xs text-stone-400 line-through">{fmtMoney(p.oldPrice)}</span>}
                    <span className="text-xs font-semibold text-stone-900 min-[769px]:text-sm">{fmtMoney(p.price)} <span className="text-xs font-normal text-stone-400">{t.common.uzs}</span></span>
                  </div>
                  <button
                    disabled={soldOut}
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-[#D4AF37] min-h-[38px] px-2 py-2 text-xs font-medium min-[769px]:min-h-[44px] min-[769px]:px-3 min-[769px]:py-2.5 min-[769px]:text-sm text-[#1A1A1A] transition hover:bg-[#C49F2F] disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-stone-400"
                  >
                    <Plus size={15} /> {t.store.addToCart}{inCart > 0 ? ` (${inCart})` : ""}
                  </button>
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
          </div>
        </div>
      )}

      {/* "Find Your Perfect Style" — admin o'zi yaratgan to'plamlar (agar bo'lsa), aks holda kategoriya kartalari */}
      {!search && !activeCollection && (
        <div id="categories-section" className="px-4 pt-16 min-[769px]:px-6">
          <div className="rounded-none bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8">
          {collections.some((c) => c.active !== false && c.imageUrl && c.displayStyle !== "banner") ? (
            <CollectionShowcase collections={collections} onSelect={setActiveCollection} t={t} lang={lang} />
          ) : (
            <CategoryShowcase categories={categories} products={products} onSelect={setActiveCategory} t={t} />
          )}
          </div>
        </div>
      )}

      {/* Brend doira ikonkalari + shu brendga tegishli mahsulotlar — nozik oltin gradient fon bilan */}
      {brands && brands.length > 0 && (
        <div
          className="relative mt-16 overflow-hidden rounded-none p-4 min-[769px]:mx-6 min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8"
          style={{ background: "linear-gradient(180deg, #F8D34F, #E6BE38)" }}
        >
          {/* Xira oltin dekor — yuqori o'ng burchakda */}
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full"
            style={{ background: "#D4AF37", opacity: 0.05 }}
          />
          <div className="relative rounded-2xl bg-white/70 p-4 shadow-sm sm:p-5">
            <BrandIconRow brands={brands} products={products} activeBrand={activeBrand} onSelect={setActiveBrand} t={t} bare theme="gold" />
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
          <div className="relative">
            <div ref={brandViewportRef} className="embla-viewport">
            <div className="embla-container gap-3 min-[769px]:gap-4">
            {brandFiltered.map(p => {
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
                  className="group flex w-[calc((100vw-48px)/2.8)] shrink-0 cursor-pointer flex-col rounded-[20px] border border-gray-50 bg-white p-2 min-[769px]:p-3 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg min-[481px]:w-[calc((100vw-48px)/3.2)] min-[769px]:w-48 min-[769px]:max-w-none"
                >
                  {/* aspect-square — karta kengligi qanday bo'lishidan qat'i nazar rasm nisbati
                      har doim 1:1 (kvadrat) bo'lib qoladi, shu tufayli hech qachon cho'zilib/torayib ko'rinmaydi */}
                  <div className={`relative mb-3 aspect-square overflow-hidden rounded-2xl text-stone-300 ${p.tint || "bg-rose-50"}`}>
                    {thumb ? (
                      <img
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
                              <img src={brandInfo.imageUrl} alt="" className="h-full w-full object-cover" />
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
                  <button
                    disabled={soldOut}
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-stone-900 min-h-[38px] px-2 py-2 text-xs font-medium min-[769px]:min-h-[44px] min-[769px]:px-3 min-[769px]:py-2.5 min-[769px]:text-sm text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-stone-400"
                  >
                    <Plus size={15} /> {t.store.addToCart}{inCart > 0 ? ` (${inCart})` : ""}
                  </button>
                </div>
              );
            })}
            </div>
            </div>
            <button
              onClick={scrollBrandPrev}
              aria-label="Oldingi"
              className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollBrandNext}
              aria-label="Keyingi"
              className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        </div>
      )}


      {/* Mashhur mahsulotlar — admin "Top" deb belgilagan mahsulotlar, bitta gorizontal qatorda */}
      {!search && !activeCollection && products.some(p => p.tag === "bestseller") && (
        <div className="px-4 pt-16 min-[769px]:px-6">
          <div className="rounded-none bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-[769px]:rounded-[24px] min-[769px]:p-[32px]">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl font-semibold text-stone-900 sm:text-3xl">🔥 {t.store.popular}</h2>
              <p className="mt-1 text-xs text-stone-400 sm:text-sm">{t.store.bestSellersSubtitle}</p>
            </div>
            <button
              onClick={() => document.getElementById("shop-section")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="shrink-0 text-sm font-medium text-rose-500 hover:text-rose-600"
            >
              {t.store.viewAll} →
            </button>
          </div>
          <div className="relative">
            <div
              ref={popularRowRef}
              className="grid grid-flow-col grid-rows-2 gap-3 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden min-[769px]:flex min-[769px]:grid-rows-1 min-[769px]:gap-4"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {products.filter(p => p.tag === "bestseller").map((p, idx) => {
              const inCart = cart[p.id] || 0;
              const stockType = p.stockType || "limited";
              const soldOut = stockType === "out" || (stockType === "limited" && (p.stock || 0) <= 0);
              const hasDiscount = p.oldPrice > p.price;
              const pct = discountPct(p.price, p.oldPrice);
              const thumb = (p.imageUrls && p.imageUrls[0]) || p.imageUrl || "";
              const name = pname(p, lang);
              const rankBadge = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group flex w-[calc((100vw-48px)/2.8)] shrink-0 cursor-pointer flex-col rounded-2xl bg-white p-2 min-[769px]:p-3 transition hover:-translate-y-0.5 hover:shadow-lg min-[481px]:w-[calc((100vw-48px)/3.2)] min-[769px]:w-48 min-[769px]:max-w-none"
                >
                  <div className={`relative mb-3 aspect-square overflow-hidden rounded-xl text-stone-300 ${p.tint || "bg-rose-50"}`}>
                    {thumb ? (
                      <img src={thumb} alt={name} className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110" draggable={false} onDragStart={(e) => e.preventDefault()} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center"><Package size={32} strokeWidth={1.3} /></div>
                    )}
                    {hasDiscount && (
                      <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">-{pct}%</span>
                    )}
                    <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">{t.store.tagBestseller}</span>
                    {rankBadge && (
                      <span className="absolute bottom-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-base shadow-sm">{rankBadge}</span>
                    )}
                  </div>
                  {p.brand && <p className="text-[11px] font-medium uppercase tracking-wide text-rose-400">{p.brand}</p>}
                  <p className="mb-1 line-clamp-2 text-xs font-medium text-stone-800 min-[769px]:text-sm">{name}</p>
                  <div className="mb-2 flex items-center gap-2">
                    {hasDiscount && <span className="text-xs text-stone-400 line-through">{fmtMoney(p.oldPrice)}</span>}
                    <span className="text-xs font-semibold text-stone-900 min-[769px]:text-sm">{fmtMoney(p.price)} <span className="text-xs font-normal text-stone-400">{t.common.uzs}</span></span>
                  </div>
                  <button
                    disabled={soldOut}
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-stone-900 min-h-[38px] px-2 py-2 text-xs font-medium min-[769px]:min-h-[44px] min-[769px]:px-3 min-[769px]:py-2.5 min-[769px]:text-sm text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-stone-400"
                  >
                    <Plus size={15} /> {t.store.addToCart}{inCart > 0 ? ` (${inCart})` : ""}
                  </button>
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

      {/* Keng banner uslubidagi to'plamlar — Mashhur bo'limidan pastda */}
      {!search && !activeCollection && collections.some(c => c.displayStyle === "banner" && c.active !== false && c.imageUrl) && (
        <div className="px-4 pt-16 min-[769px]:px-6">
          <WideCollectionShowcase collections={collections} onSelect={setActiveCollection} t={t} lang={lang} />
        </div>
      )}

      {/* Kategoriya + Barcha mahsulotlar — BITTA yaxlit oq karta (ajratilgan bo'lim emas) */}
      <div
        id="shop-section"
        className="relative mt-16 overflow-hidden rounded-none p-4 shadow-sm min-[769px]:mx-6 min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8"
        style={{
          background: "linear-gradient(180deg, #5A2335, #7A2950)",
          animation: "categoryFadeUp 0.4s ease-out",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at top left, rgba(255,255,255,.08), transparent 45%)" }}
        />
        <div className="relative">
        <CategoryIconRow categories={categories} products={products} activeCategory={activeCategory} onSelect={setActiveCategory} t={t} bare theme="magenta" />

        {activeCollection && (
          <div className="mb-4 mt-12 rounded-2xl bg-rose-50 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-lg font-semibold text-stone-900 sm:text-xl">{collectionTitle(activeCollection, lang)}</p>
                {collectionDescription(activeCollection, lang) && (
                  <p className="mt-1 text-sm text-stone-500">{collectionDescription(activeCollection, lang)}</p>
                )}
              </div>
              <button onClick={() => setActiveCollection(null)} className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100">
                <X size={13} /> {t.store.allCategories}
              </button>
            </div>
            {filtered.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-rose-100 pt-3">
                <p className="text-sm text-stone-600">
                  {t.store.collectionTotal}: <span className="text-base font-semibold text-stone-900">{fmtMoney(filtered.reduce((s, p) => s + (Number(p.price) || 0), 0))} {t.common.uzs}</span>
                  <span className="ml-1 text-xs text-stone-400">({filtered.length} {t.common.ta})</span>
                </p>
                <button
                  onClick={() => addAllCollectionToCart(activeCollection, filtered)}
                  className="flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
                >
                  <ShoppingCart size={15} /> {t.store.collectionAddAll}
                </button>
              </div>
            )}
          </div>
        )}
        {!activeCollection && (
          <div className="mb-10 mt-12">
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl font-semibold text-white sm:text-3xl">
              {activeCategory === t.store.allCategories ? t.store.allProductsTitle : activeCategory}
            </h2>
          </div>
        )}
        {filtered.length === 0 ? (
          <EmptyState icon={Package} text={t.store.noProducts} />
        ) : (
          <div className="relative">
            <div ref={catalogViewportRef} className="embla-viewport">
            <div className="embla-container gap-3 min-[769px]:gap-4">
            {filtered.map(p => {
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
                  className="group flex w-[calc((100vw-48px)/2.8)] shrink-0 cursor-pointer flex-col rounded-[20px] border border-gray-50 bg-white p-2 min-[769px]:p-3 transition-all duration-200 ease-out hover:-translate-y-2 hover:scale-[1.03] min-[481px]:w-[calc((100vw-48px)/3.2)] min-[769px]:w-48 min-[769px]:max-w-none"
                  style={{ boxShadow: "0 20px 50px rgba(0,0,0,.12)" }}
                >
                  {/* aspect-square — karta kengligi qanday bo'lishidan qat'i nazar rasm nisbati
                      har doim 1:1 (kvadrat) bo'lib qoladi, shu tufayli hech qachon cho'zilib/torayib ko'rinmaydi */}
                  <div className={`relative mb-3 aspect-square overflow-hidden rounded-2xl text-stone-300 ${p.tint || "bg-rose-50"}`}>
                    {thumb ? (
                      <img
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
                              <img src={brandInfo.imageUrl} alt="" className="h-full w-full object-cover" />
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
                          ✨ {t.store.tagNew}
                        </span>
                      )}
                      {p.tag === "bestseller" && (
                        <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                          🔥 {t.store.tagBestseller}
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
                  <button
                    disabled={soldOut}
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="mt-auto flex items-center justify-center gap-1.5 rounded-full bg-stone-900 min-h-[38px] px-2 py-2 text-xs font-medium min-[769px]:min-h-[44px] min-[769px]:px-3 min-[769px]:py-2.5 min-[769px]:text-sm text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-rose-100 disabled:text-stone-400"
                  >
                    <Plus size={15} /> {t.store.addToCart}{inCart > 0 ? ` (${inCart})` : ""}
                  </button>
                </div>
              );
            })}
            </div>
            </div>
            <button
              onClick={scrollCatalogPrev}
              aria-label="Oldingi"
              className="absolute left-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollCatalogNext}
              aria-label="Keyingi"
              className="absolute right-1 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-700 shadow-md hover:bg-rose-50 sm:flex"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Yana bir kolleksiya bo'limi — Kategoriya bo'limidan keyin, Brendlardan oldin */}
      {!search && !activeCollection && collections.some(c => c.displayStyle === "cardBottom" && c.active !== false && c.imageUrl) && (
        <div className="px-4 pt-16 min-[769px]:px-6">
          <div className="rounded-none bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8">
            <CollectionShowcase collections={collections} onSelect={setActiveCollection} t={t} lang={lang} variant="bottom" />
          </div>
        </div>
      )}

      {/* Ishonch belgilari (yetkazib berish / qaytarish / to'lov) */}
      <div className="mt-16 grid grid-cols-2 gap-4 rounded-none bg-white p-4 min-[769px]:mx-6 min-[769px]:rounded-2xl min-[769px]:p-6 sm:grid-cols-4">
        {[
          { icon: Truck, text: storeSettings?.trustFeature1 || t.store.featShipping, href: null },
          { icon: RotateCcw, text: storeSettings?.trustFeature2 || t.store.featReturns, href: null },
          { icon: ShieldCheck, text: storeSettings?.trustFeature3 || t.store.featSecure, href: null },
          { icon: Headphones, text: storeSettings?.trustFeature4 || t.store.featSupport, href: storeSettings?.trustFeature4Link || null },
        ].map(({ icon: Icon, text, href }, i) => {
          const content = (
            <>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-stone-600">
                <Icon size={16} />
              </span>
              <span className="text-xs font-medium text-stone-600">{text}</span>
            </>
          );
          return href ? (
            <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-75">
              {content}
            </a>
          ) : (
            <div key={i} className="flex items-center gap-2.5">
              {content}
            </div>
          );
        })}
      </div>

      {/* Sharhlardan oldingi reklama banneri — admin panelda 4-banner qo'shilsa ko'rinadi */}
      <div className="px-4 pt-16 min-[769px]:px-6">
        <MidPromoBanner banners={banners} inTelegram={inTelegram} t={t} products={products} onAddLinkedProducts={addLinkedProductsToCart} />
      </div>

      {/* Mijoz sharhlari */}
      <div className="px-4 pt-16 min-[769px]:px-6">
        <div className="rounded-none p-4 min-[769px]:rounded-[24px] min-[769px]:p-6 min-[769px]:sm:p-8" style={{ background: "#FAF3E8" }}>
          <Testimonials testimonials={testimonials} t={t} />
        </div>
      </div>

      {/* Instagram uslubidagi galereya (mahsulot rasmlaridan) */}
      <div className="px-4 pt-16 min-[769px]:px-6">
        <InstagramGallery products={products} settings={storeSettings} t={t} />
      </div>

      {/* Savol-javob */}
      <div className="px-4 pt-16 pb-16 min-[769px]:px-6">
        <FAQSection faqs={faqs} t={t} />
      </div>

      <StoreFooter lang={lang} storeName={storeSettings?.storeName || t.appName} settings={storeSettings} />

      {/* Wishlist drawer */}
      {wishlistOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={() => setWishlistOpen(false)}>
          <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">{t.store.wishlist}</h3>
              <button onClick={() => setWishlistOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {wishlistItems.length === 0 ? (
                <EmptyState icon={Heart} text={t.store.wishlistEmpty} />
              ) : (
                <div className="space-y-3">
                  {wishlistItems.map(p => (
                    <div key={p.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">{pname(p, lang)}</p>
                        <p className="text-xs text-slate-400">{fmtMoney(p.price)} {t.common.uzs}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => addToCart(p)} disabled={p.stock <= 0} className="rounded-lg bg-emerald-600 p-1.5 text-white hover:bg-emerald-700 disabled:bg-gray-200">
                          <Plus size={14} />
                        </button>
                        <button onClick={() => toggleWishlist(p.id)} className="rounded-lg border border-gray-200 p-1.5 text-slate-400 hover:bg-gray-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Telefon bilan kirish/ro'yxatdan o'tish ekrani — Profil bosilganda, hali telefon bog'lanmagan bo'lsa */}
      {phoneLoginOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-white">
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
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={() => setProfileOpen(false)}>
          <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">{t.store.profile.title}</h3>
              <button onClick={() => setProfileOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Profil ma'lumotlari */}
              <div className="mb-5 rounded-xl border border-gray-100 p-3">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <UserRound size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {tgUser ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") : (form.name || "—")}
                    </p>
                    <p className="text-xs text-slate-400">
                      {tgUser?.username ? `@${tgUser.username}` : t.store.profile.notLinked}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-xs text-slate-500">
                  <span>{t.store.profile.phone}</span>
                  <span className="font-medium text-slate-700">{myPhone || "—"}</span>
                </div>
              </div>

              {/* Telefon raqamni qo'shish/yangilash */}
              <div className="mb-5">
                <h4 className="mb-1 text-sm font-semibold text-slate-700">{t.store.profile.addPhone}</h4>
                <p className="mb-2 text-xs text-slate-400">{t.store.profile.addPhoneNote}</p>
                <div className="flex gap-2">
                  <PhoneInput value={phoneInput} onChange={setPhoneInput} />
                  <button
                    onClick={saveMyPhone}
                    disabled={savingPhone || !isValidUzPhone(phoneInput)}
                    className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingPhone ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {t.store.profile.savePhone}
                  </button>
                </div>
                {phoneSaved && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                    <CheckCircle2 size={13} /> {t.store.profile.phoneSaved}
                  </p>
                )}
              </div>

              {/* Buyurtmalarim — avval Telegram ID, bo'lmasa saqlangan telefon bo'yicha */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">{t.store.profile.myOrders}</h4>
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
                      .map((o) => <ProfileOrderCard key={o.id} order={o} t={t} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/40" onClick={() => setCartOpen(false)}>
          <div className="flex h-full w-full max-w-sm flex-col bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-800">{t.store.cart}</h3>
              <button onClick={() => setCartOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 ? (
                <EmptyState icon={ShoppingCart} text={t.store.cartEmpty} />
              ) : (
                <div className="space-y-3">
                  {cartGroups.map(({ tag, items }) => {
                    const groupQty = items.reduce((s, i) => s + i.qty, 0);
                    const groupSubtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
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
                            {items.map(({ product, qty }) => (
                              <div key={product.id} className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-xs font-medium text-stone-600">{pname(product, lang)}</p>
                                  <p className="text-[11px] text-stone-400">{fmtMoney(product.price)} {t.common.uzs}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => changeQty(product.id, -1)} className="rounded-lg border border-gray-200 bg-white p-1 text-slate-500 hover:bg-gray-50"><Minus size={12} /></button>
                                  <span className="w-4 text-center text-xs font-medium">{qty}</span>
                                  <button onClick={() => changeQty(product.id, 1)} disabled={product.stockType === "limited" && qty >= product.stock} className="rounded-lg border border-gray-200 bg-white p-1 text-slate-500 hover:bg-gray-50 disabled:opacity-40"><Plus size={12} /></button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {cartSingles.map(({ product, qty }) => (
                    <div key={product.id} className="flex items-center justify-between gap-2 rounded-xl border border-gray-100 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-700">{pname(product, lang)}</p>
                        <p className="text-xs text-slate-400">{fmtMoney(product.price)} {t.common.uzs}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => changeQty(product.id, -1)} className="rounded-lg border border-gray-200 p-1 text-slate-500 hover:bg-gray-50"><Minus size={13} /></button>
                        <span className="w-5 text-center text-sm font-medium">{qty}</span>
                        <button onClick={() => changeQty(product.id, 1)} disabled={product.stockType === "limited" && qty >= product.stock} className="rounded-lg border border-gray-200 p-1 text-slate-500 hover:bg-gray-50 disabled:opacity-40"><Plus size={13} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-gray-100 px-5 py-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{t.store.total}</span>
                  <span className="text-base font-bold text-slate-800">{fmtMoney(cartTotal)} {t.common.uzs}</span>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}
                  className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  {t.store.checkout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <Modal title={done ? t.store.success : t.store.checkout} onClose={resetAll}>
          {done ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              <PartyPopper className="text-emerald-500" size={32} />
              <p className="text-sm font-medium text-slate-700">{t.store.success}</p>
              <p className="text-xs text-slate-400">{t.store.successNote}</p>
              <button onClick={resetAll} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
                {t.store.newOrder}
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 rounded-xl bg-gray-50 p-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>{t.store.subtotal}</span>
                  <span>{fmtMoney(cartTotal)} {t.common.uzs}</span>
                </div>
                {appliedPromo && (
                  <div className="mt-1 flex justify-between text-rose-600">
                    <span>{t.store.promoApplied} ({appliedPromo.code})</span>
                    <span>-{fmtMoney(promoDiscount)} {t.common.uzs}</span>
                  </div>
                )}
                <div className="mt-1.5 flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-slate-700">
                  <span>{t.store.total}</span>
                  <span>{fmtMoney(cartTotalAfterDiscount)} {t.common.uzs}</span>
                </div>
              </div>

              {/* Promo kod */}
              <div className="mb-3">
                {appliedPromo ? (
                  <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={14} /> {appliedPromo.code} {t.store.promoApplied}
                    </span>
                    <button onClick={removePromoCode} className="text-xs font-medium text-emerald-700 hover:underline">{t.store.promoRemove}</button>
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

              <Field label={t.store.yourName} error={error && !form.name ? error : ""}>
                <input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label={t.store.yourPhone} error={error && !isValidUzPhone(form.phone) ? error : ""}>
                <PhoneInput value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </Field>

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
                        form.payment === opt.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-slate-500 hover:bg-gray-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label={t.store.address} error={error && !form.address ? error : ""}>
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
                  onClick={requestLocation}
                  disabled={locating}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-gray-50 disabled:opacity-60"
                >
                  {locating ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                  {locating ? t.store.locating : t.store.locateMe}
                </button>
                {location && (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
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
                {locError && <p className="mt-1 text-xs text-rose-600">{locError}</p>}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button onClick={resetAll} className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-500 hover:bg-gray-100">{t.common.cancel}</button>
                <button onClick={submitOrder} disabled={placing} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
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
          { key: "categories", icon: LayoutGrid, onClick: () => document.getElementById("categories-section")?.scrollIntoView({ behavior: "smooth" }) },
          { key: "cart", icon: ShoppingCart, onClick: () => setCartOpen(true), badge: cartCount },
          { key: "wishlist", icon: Heart, onClick: () => setWishlistOpen(true), badge: wishlistItems.length },
          { key: "profile", icon: UserRound, onClick: openProfile },
        ].map(({ key, icon: Icon, onClick, badge }) => (
          <button
            key={key}
            onClick={() => { setActiveNavTab(key); onClick(); }}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full transition ${
              activeNavTab === key ? "bg-rose-500 text-white" : "text-stone-500 hover:bg-rose-50"
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

      {/* AI Chat — hozircha bo'sh joy egallovchi, keyinchalik AI agent shu yerga ulanadi */}
      {aiChatOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/40 md:items-center" onClick={() => setAiChatOpen(false)}>
          <div className="flex h-[70vh] w-full max-w-sm flex-col rounded-t-2xl bg-white shadow-xl md:h-[520px] md:rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <p className="flex items-center gap-2 font-semibold text-stone-800"><MessageCircle size={18} /> Chat</p>
              <button onClick={() => setAiChatOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-stone-400">
              Tez orada bu yerda AI yordamchi javob beradi
            </div>
          </div>
        </div>
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
  const [page, setPage] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [collections, setCollections] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [user, setUser] = useState(undefined); // undefined = checking, null = logged out

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

  // Do'kon sozlamalari (bitta hujjat — settings/store)
  useEffect(() => {
    const unsub = subscribeCollection("settings", (list) => {
      const store = list.find((x) => x.id === "store");
      setStoreSettings(store || null);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (route !== "admin") return;
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, [route]);

  // Buyurtmalar va mijozlar — FAQAT admin tizimga kirgandan keyin yuklanadi.
  // Shu tufayli mijozlar do'koni sahifasi hech qachon boshqa mijozlarning
  // buyurtma/ma'lumotlarini brauzerga yuklamaydi.
  useEffect(() => {
    if (route !== "admin" || !user) return;
    const unsubOrders = subscribeCollection(COL.orders, (list) => setOrders(list));
    const unsubCustomers = subscribeCollection(COL.customers, (list) => setCustomers(list));
    return () => { unsubOrders(); unsubCustomers(); };
  }, [route, user]);

  const loading = !productsLoaded;

  const t = T[lang];
  const nav = [
    { key: "dashboard", label: t.menu.dashboard, icon: LayoutGrid },
    { key: "orders", label: t.menu.orders, icon: ClipboardList, badge: orders.filter(o => o.status === "new").length },
    { key: "customers", label: t.menu.customers, icon: Users },
    { key: "products", label: t.menu.products, icon: Package },
    { key: "banner", label: t.menu.banner, icon: ImageIcon },
    { key: "testimonials", label: t.menu.testimonials, icon: MessageSquareQuote },
    { key: "faqs", label: t.menu.faqs, icon: HelpCircle },
    { key: "marketing", label: t.menu.marketing, icon: TrendingUp },
    { key: "settings", label: t.menu.settings, icon: SettingsIcon },
  ];

  if (loading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }

  // Public storefront — the only thing customers ever see at the root domain.
  if (route === "store") {
    return (
      <StorefrontPage
        lang={lang} setLang={setLang} products={products} categories={categories} banners={banners}
        brands={brands} collections={collections} testimonials={testimonials} faqs={faqs} storeSettings={storeSettings}
        tgUser={tgUser} inTelegram={inTelegram}
      />
    );
  }

  // /admin — requires Firebase login before showing anything sensitive.
  if (user === undefined) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-emerald-500" size={28} />
      </div>
    );
  }
  if (!user) {
    return <AdminLogin lang={lang} />;
  }

  return (
    <div className="flex h-full min-h-[600px] w-full bg-gray-50 text-slate-800" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* SIDEBAR */}
      <aside className="hidden w-60 flex-col border-r border-gray-100 bg-white sm:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          {storeSettings?.logoUrl ? (
            <img src={storeSettings.logoUrl} alt="" className="h-8 w-8 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <ShoppingCart size={17} />
            </div>
          )}
          <span className="text-base font-bold text-slate-800">{storeSettings?.storeName || t.appName}</span>
        </div>
        <div className="px-4 pb-3">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-slate-500">{t.workspace}: CASME</div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(item => {
            const Icon = item.icon;
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2.5"><Icon size={17} /> {item.label}</span>
                {!!item.badge && <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] text-white">{item.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="space-y-2 p-4">
          <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-medium text-slate-500 hover:bg-gray-50">
            <ShoppingBag size={13} /> {t.login.viewStore}
          </a>
          <div className="rounded-xl bg-slate-800 px-3 py-2.5 text-center text-xs font-semibold text-white">BASIC</div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-3.5">
          <h1 className="text-sm font-semibold text-slate-700">{nav.find(n => n.key === page)?.label}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === "uz" ? "ru" : "uz")}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-50"
            >
              <Globe size={14} /> {lang === "uz" ? "O'zbek" : "Русский"}
            </button>
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-gray-50"
            >
              <LogOut size={14} /> {t.login.logout}
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {page === "dashboard" && <DashboardPage lang={lang} orders={orders} customers={customers} products={products} setPage={setPage} />}
          {page === "orders" && <OrdersPage lang={lang} orders={orders} setOrders={setOrders} customers={customers} />}
          {page === "customers" && <CustomersPage lang={lang} customers={customers} setCustomers={setCustomers} orders={orders} />}
          {page === "products" && <ProductsPage lang={lang} products={products} categories={categories} brands={brands} collections={collections} />}
          {page === "banner" && <BannerSettings lang={lang} banners={banners} products={products} />}
          {page === "testimonials" && <TestimonialsSettings lang={lang} testimonials={testimonials} />}
          {page === "faqs" && <FAQSettings lang={lang} faqs={faqs} />}
          {page === "marketing" && <MarketingPage lang={lang} banners={banners} products={products} orders={orders} customers={customers} />}
          {page === "settings" && <StoreSettings lang={lang} settings={storeSettings} />}
        </main>
      </div>
    </div>
  );
}
