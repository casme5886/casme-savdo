// ==========================================================
// Haqiqiy Firestore kolleksiyalari bilan ishlash.
// Har bir buyurtma / mijoz / mahsulot — o'zining alohida
// hujjati (document). Bu quyidagilarni beradi:
//  - request.auth asosidagi xavfsizlik qoidalari to'g'ri ishlaydi
//  - Real vaqtda yangilanish (onSnapshot)
//  - Bir vaqtda bo'lgan buyurtmalar bir-birini o'chirmaydi
// ==========================================================

import { app, db } from "./firebase.js";
import {
  collection, doc, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, getDocs, increment, writeBatch, serverTimestamp, getCountFromServer,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

// Firebase Storage — banner va mahsulot rasmlarini saqlash uchun.
// `app` allaqachon src/firebase.js ichida sozlangan, biz uni faqat
// qayta ishlatamiz — firebase.js faylining o'ziga hech narsa
// qo'shilmagan/o'zgartirilmagan.
const storage = getStorage(app);

/** Kolleksiyaga real-vaqtli obuna bo'lish. callback har o'zgarishda ishga tushadi. */
export function subscribeCollection(name, callback) {
  const ref = collection(db, name);
  return onSnapshot(
    ref,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.error(`Firestore obuna xatosi (${name}):`, err)
  );
}

export async function addItem(name, data) {
  return addDoc(collection(db, name), data);
}

/**
 * addItem'dan farqi: hujjat ID'sini SIZ beradi (Firestore o'zi
 * tasodifiy ID o'ylab topmaydi). Agar shu ID bilan hujjat allaqachon
 * mavjud bo'lsa — ustidan yoziladi (yangilanadi), aks holda yangi
 * hujjat yaratiladi. Banner/mahsulot rasmlarini Storage'ga shu ID
 * ostida joylashtirish uchun ID'ni oldindan bilishimiz kerak —
 * shuning uchun bu funksiya kerak bo'ladi.
 */
export async function setItem(name, id, data) {
  return setDoc(doc(db, name, id), data);
}

export async function updateItem(name, id, data) {
  return updateDoc(doc(db, name, id), data);
}

export async function deleteItem(name, id) {
  return deleteDoc(doc(db, name, id));
}

/**
 * Telefon kamerasidan yuklangan rasmlar odatda juda katta (3-8 MB, 3000-4000px)
 * bo'ladi — saytda esa ular ancha kichik joyda (masalan 300-600px) ko'rsatiladi.
 * Shu sabab ular sekin internetda "asta-sekin ochilib" ko'rinadi. Bu funksiya
 * yuklashdan OLDIN rasmni brauzerning o'zida (canvas orqali) eng katta tomoni
 * 1600px'gacha kichraytiradi va sifatini ~85%'da saqlagan holda siqadi — bu
 * ko'zga sezilarli darajada emas, lekin fayl hajmini bir necha barobar
 * kamaytiradi. Kichik yoki allaqachon yengil (700 KB dan kam) fayllarga
 * tegilmaydi, shaffoflik (PNG) saqlanadi.
 */
function compressImageFile(file, { maxDimension = 1600, quality = 0.85 } = {}) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") {
      resolve(file);
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width <= maxDimension && height <= maxDimension && file.size < 700 * 1024) {
        resolve(file);
        return;
      }
      const scale = Math.min(1, maxDimension / Math.max(width, height));
      const targetW = Math.max(1, Math.round(width * scale));
      const targetH = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, targetW, targetH);
      const keepPng = file.type === "image/png";
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const baseName = (file.name || "image").replace(/\.[^.]+$/, "");
          const newFile = new File([blob], `${baseName}.${keepPng ? "png" : "jpg"}`, {
            type: keepPng ? "image/png" : "image/jpeg",
          });
          resolve(newFile.size < file.size ? newFile : file);
        },
        keepPng ? "image/png" : "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/**
 * Rasmni Firebase Storage'ga yuklaydi va ochiq (public) havolasini
 * qaytaradi. `path` bir xil bo'lsa — eski rasm AVTOMATIK almashadi
 * (Storage shu manzildagi faylni ustidan yozadi). Yuklashdan oldin rasm
 * avtomatik siqiladi/kichraytiriladi (yuqoridagi compressImageFile'ga qarang).
 * Masalan: uploadImage(`banners/abc123/banner-desktop`, file)
 *          uploadImage(`products/abc123/image-0`, file)
 */
export async function uploadImage(path, file) {
  const optimized = await compressImageFile(file);
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, optimized);
  return getDownloadURL(storageRef);
}

/**
 * Storage'dagi bitta faylni o'chiradi (masalan, admin mahsulotdan
 * bitta rasmni olib tashlaganda). Fayl allaqachon yo'q bo'lsa ham
 * xato tashlamaydi (jim o'tib ketadi) — bu holat muhim emas.
 */
export async function deleteStorageFile(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch (e) {
    console.warn(`Storage faylini o'chirishda ogohlantirish (${path}):`, e?.code || e);
  }
}

export async function findCustomerByPhone(phone) {
  const q = query(collection(db, "customers"), where("phone", "==", phone));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * "Mening profilim" bo'limi uchun: shu Telegram foydalanuvchi ID'siga
 * bog'langan mijoz yozuvini (agar mavjud bo'lsa) qaytaradi.
 */
export async function findCustomerByTelegramId(telegramUserId) {
  const q = query(collection(db, "customers"), where("telegramUserId", "==", telegramUserId));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function isCollectionEmpty(name) {
  const snap = await getDocs(collection(db, name));
  return snap.empty;
}

/** Kolleksiyadagi barcha hujjatlarni bir martalik o'qiydi (zaxira nusxa uchun). */
export async function getAllDocs(name) {
  const snap = await getDocs(collection(db, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Banner bosilganda chaqiriladi — statistikaga +1 qo'shadi. */
export async function incrementBannerClicks(id) {
  try {
    await updateDoc(doc(db, "banners", id), { clicks: increment(1) });
  } catch (e) {
    console.warn("Banner bosilishini hisoblashda xatolik:", e);
  }
}

/** Promo kod muvaffaqiyatli ishlatilganda chaqiriladi — usedCount'ni +1 qiladi. */
export async function incrementPromoCodeUsage(id) {
  try {
    await updateDoc(doc(db, "promoCodes", id), { usedCount: increment(1) });
  } catch (e) {
    console.warn("Promo kod hisobini yangilashda xatolik:", e);
  }
}

/** Mijoz FAQ savolini ochganda chaqiriladi — ko'rishlar sonini +1 qiladi. */
export async function incrementFaqViews(id) {
  try {
    await updateDoc(doc(db, "faqs", id), { views: increment(1) });
  } catch (e) {
    console.warn("FAQ ko'rishlarini hisoblashda xatolik:", e);
  }
}

/** Berilgan kodni promoCodes kolleksiyasidan qidiradi (katta-kichik harflarga sezgir emas). */
export async function findPromoCode(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const snap = await getDocs(collection(db, "promoCodes"));
  const found = snap.docs.find((d) => (d.data().code || "").toUpperCase() === normalized);
  return found ? { id: found.id, ...found.data() } : null;
}

/**
 * Faqat SONNI qaytaradi (masalan "10K+ mijoz" statistikasi uchun) —
 * mijozlarning ism/telefon kabi ma'lumotlarini o'qimaydi, shuning
 * uchun bu do'kon sahifasida (mijozlar tomonida) xavfsiz ishlatiladi.
 */
export async function getCustomersCount() {
  try {
    const snap = await getCountFromServer(collection(db, "customers"));
    return snap.data().count;
  } catch (e) {
    console.warn("Mijozlar sonini olishda xatolik:", e);
    return 0;
  }
}

/**
 * Faqat SONNI qaytaradi — bekor qilinganlardan tashqari barcha
 * buyurtmalar soni ("1200+ buyurtma bajarildi" kabi statistika uchun).
 * Hech qanday buyurtma tafsilotini (mijoz, manzil, mahsulot) o'qimaydi,
 * shuning uchun do'kon sahifasida (mijozlar tomonida) xavfsiz ishlatiladi.
 */
export async function getOrdersCount() {
  try {
    const snap = await getCountFromServer(collection(db, "orders"));
    return snap.data().count;
  } catch (e) {
    console.warn("Buyurtmalar sonini olishda xatolik:", e);
    return 0;
  }
}

/**
 * "Mening profilim" bo'limi uchun: shu Telegram foydalanuvchisi
 * (telegramUserId) nomiga yozilgan barcha buyurtmalarni qaytaradi.
 */
export async function findOrdersByTelegramId(telegramUserId) {
  const q = query(collection(db, "orders"), where("telegramUserId", "==", telegramUserId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * "Mening profilim" bo'limi uchun: Telegram orqali kirmagan (yoki
 * boshqa raqamdan buyurtma bergan) mijozlar telefon raqami orqali
 * o'z buyurtmalarini qidirishi mumkin.
 */
export async function findOrdersByPhone(phone) {
  const q = query(collection(db, "orders"), where("phone", "==", phone));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Checkout uchun: bir nechta hujjatni BIR PAYTDA (batch) yozadi —
 * mahsulot qoldiqlarini kamaytiradi, mijozni yaratadi/yangilaydi,
 * yangi buyurtmani qo'shadi. `increment()` ishlatilgani uchun
 * ikkita mijoz bir vaqtda buyurtma bersa ham, sonlar noto'g'ri
 * hisoblanmaydi. `createdAt` — Firestore serverining o'zi qo'ygan
 * aniq vaqt belgisi (mijoz telefonining vaqti emas).
 */
export async function placeOrderBatch({ cartItems, existingCustomer, customerName, customerPhone, customerAddress, cartTotal, orderData }) {
  const batch = writeBatch(db);

  cartItems.forEach(({ product, qty }) => {
    if ((product.stockType || "limited") === "limited") {
      batch.update(doc(db, "products", product.id), { stock: increment(-qty) });
    }
  });

  // Telegram orqali kelgan bo'lsa, mijoz yozuviga ham shu ma'lumotlarni
  // yozamiz — shunda "Buyurtmalarim" bo'limi va admin panel buni ko'ra oladi.
  const telegramFields = orderData.telegramUserId
    ? {
        telegramUserId: orderData.telegramUserId,
        telegramFirstName: orderData.telegramFirstName || "",
        telegramUsername: orderData.telegramUsername || "",
      }
    : {};

  if (existingCustomer) {
    batch.update(doc(db, "customers", existingCustomer.id), {
      orders: increment(1),
      spent: increment(cartTotal),
      address: customerAddress,
      ...telegramFields,
    });
  } else {
    const newCustomerRef = doc(collection(db, "customers"));
    batch.set(newCustomerRef, {
      name: customerName, phone: customerPhone, address: customerAddress,
      orders: 1, spent: cartTotal, date: orderData.date,
      bonusPoints: 20000, // Yangi mijozga xush kelibsiz bonusi
      ...telegramFields,
    });
  }

  const newOrderRef = doc(collection(db, "orders"));
  batch.set(newOrderRef, { ...orderData, createdAt: serverTimestamp() });

  await batch.commit();
  return newOrderRef.id;
}
