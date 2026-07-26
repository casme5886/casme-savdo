// ==========================================================
// FIREBASE SOZLAMALARI
// ==========================================================
// Bu yerga Firebase konsolidan olingan qiymatlarni joylashtiring.
// Qanday olish kerakligi README.md faylida bosqichma-bosqich
// yozilgan ("3-QADAM: Firebase konfiguratsiyasini olish").
//
// DIQQAT: bu qiymatlar "maxfiy parol" emas, veb-saytlarda odatda
// ochiq ko'rinadi — xavotir olmang, shunday bo'lishi kerak.
// ==========================================================

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAW8EbpfKrUPc3eI6zjQCWn2N8HU5g9CvM",
  authDomain: "casme-savdo.firebaseapp.com",
  projectId: "casme-savdo",
  storageBucket: "casme-savdo.firebasestorage.app",
  messagingSenderId: "333618332367",
  appId: "1:333618332367:web:0469ca47a9fc1d4f91edba",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
