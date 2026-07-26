# Savdo Panel — o'z saytingiz

Bu papkada sizning kasmetika do'koningiz uchun to'liq sayt kodi bor: mijozlar uchun
onlayn do'kon (mahsulotlar, savat, buyurtma berish) va sizning admin panelingiz
(buyurtmalar, mijozlar, mahsulotlar, statistika).

Quyida **birinchi marta sayt yasayotgan odam** uchun, boshidan oxirigacha,
hech narsani tashlab ketmasdan yo'riqnoma yozilgan. Har bir qadamni ketma-ket
bajaring, shoshilmang.

Jami vaqt: taxminan 40–60 daqiqa.

---

## NIMA KERAK BO'LADI

- Kompyuter (Windows yoki Mac)
- Internet
- Google hisobingiz (Gmail) — Firebase uchun
- Elektron pochtangiz — Vercel (hosting) uchun

---

## 1-QADAM: Node.js o'rnatish

Node.js — bu kompyuteringizda saytni "ishga tushirish" uchun kerak bo'lgan dastur.

1. Brauzerda oching: **https://nodejs.org**
2. Katta yashil tugma bosing — **"LTS"** yozilgan versiyani yuklab oling
3. Yuklab olingan faylni ishga tushiring, "Next" tugmalarini bosib o'rnating (hammasi standart holicha qoldirilsa bo'ladi)
4. O'rnatib bo'lgach, kompyuteringizni **qayta yoqing** (restart)

**Tekshirish:** Kompyuterda "Terminal" (Mac) yoki "Command Prompt" / "PowerShell" (Windows) dasturini oching va yozing:
```
node -v
```
Agar `v18` yoki undan katta raqam chiqsa — hammasi joyida.

---

## 2-QADAM: Firebase loyiha yaratish

Firebase — Google'ning bepul xizmati, u sizning barcha buyurtmalar, mijozlar va
mahsulotlar ma'lumotini saqlaydi (bulutda, ya'ni internetda).

1. Oching: **https://console.firebase.google.com**
2. Gmail hisobingiz bilan kiring
3. **"Create a project"** (Loyiha yaratish) tugmasini bosing
4. Loyiha nomini kiriting, masalan: `casme-store` → **Continue**
5. Google Analytics so'ralsa — o'chirib qo'yishingiz mumkin (kerak emas) → **Create project**
6. Bir necha soniya kutib turing, loyiha tayyor bo'lgach **Continue** bosing

### Firestore ma'lumotlar bazasini yoqish

7. Chap tomondagi menyudan **Build → Firestore Database** ni tanlang
8. **"Create database"** tugmasini bosing
9. Location (joylashuv) so'ralsa — istalgan yaqin variantni tanlang (masalan `eur3` yoki `asia-south1`) → **Next**
10. **"Start in test mode"** ni tanlang → **Create**

### Xavfsizlik qoidalarini joylashtirish

11. Firestore Database ichida yuqorida **"Rules"** bo'limiga o'ting
12. U yerdagi matnni butunlay o'chirib, shu papkadagi **`firestore.rules`** faylining ichidagi matnni nusxalab joylashtiring
13. **"Publish"** tugmasini bosing

### Admin uchun login/parol yaratish (MUHIM — xavfsizlik uchun)

14. Chap menyudan **Build → Authentication** ga o'ting
15. **"Get started"** tugmasini bosing
16. Ro'yxatdan **"Email/Password"** ni tanlang, uni yoqing (toggle) → **Save**
17. **"Users"** bo'limiga o'ting → **"Add user"**
18. O'zingizning elektron pochtangizni va kuchli parol o'ylab kiriting → **Add user**

Shu email va parol bilan siz **`/admin`** manzilidan kirasiz (masalan
`casme.uz/admin`). Bu login ma'lumotlarini hech kimga bermang — shu orqali
sizning barcha buyurtma va mijozlaringizga kirish mumkin.

### Veb-sayt uchun konfiguratsiya (kalitlar) olish

19. Chap yuqoridagi ⚙️ (sozlamalar) belgisini bosing → **Project settings**
20. Pastga tushing, **"Your apps"** bo'limida `</>` (Web) belgisini bosing
21. Nickname kiriting (masalan `savdo-sayt`) → **Register app**
22. Ekranda `firebaseConfig = {...}` degan kod ko'rinadi — **shu qismini butunlay nusxalab oling** (Ctrl+C / Cmd+C)

---

## 3-QADAM: Konfiguratsiyani loyihaga joylashtirish

1. Shu papkada `src/firebase.js` faylini biror matn muharriri bilan oching (masalan **Notepad**, **TextEdit**, yoki **VS Code** agar bo'lsa)
2. Fayl ichidagi `firebaseConfig = { ... }` qismini butunlay o'chirib, 2-qadamda nusxalab olgan kodingizni shu joyga joylashtiring
3. Faylni saqlang (Ctrl+S / Cmd+S)

---

## 4-QADAM: Loyihani kompyuterda ishga tushirish

1. Terminal / Command Prompt oching
2. Shu loyiha papkasiga o'ting. Masalan, agar papka Desktop'da bo'lsa:
   ```
   cd Desktop/savdo-sayt
   ```
3. Kerakli kutubxonalarni o'rnatish uchun yozing:
   ```
   npm install
   ```
   (Bir necha daqiqa kutish kerak bo'lishi mumkin)
4. Saytni mahalliy ishga tushirish:
   ```
   npm run dev
   ```
5. Terminalda `http://localhost:5173` degan manzil chiqadi — shu manzilni brauzerga nusxalab, ochib ko'ring. Bu — **mijozlar do'koni** (hech qanday parol so'ramaydi).
6. Admin panelni ko'rish uchun manzilning oxiriga `/admin` qo'shing:
   ```
   http://localhost:5173/admin
   ```
   Shu yerda 2-qadamning 17–18-bandlarida yaratgan email va parolingiz bilan kirasiz.

**Agar do'kon sahifasi ochilib mahsulotlar ko'rinsa, va `/admin` sahifasida login so'rab, kirgandan keyin "Boshqaruv paneli" ko'rinsa — hammasi to'g'ri sozlangan!**

Agar buyurtma bersangiz va admin panelida ko'rinmasa — 2-qadamdagi Firebase
sozlamalarini qaytadan tekshiring (ayniqsa Rules va konfiguratsiya kalitlari).

Tekshirib bo'lgach, terminalda `Ctrl + C` bosib to'xtatib qo'yishingiz mumkin.

---

## 5-QADAM: Saytni internetga chiqarish (hosting)

Bu qadamda saytingiz **haqiqiy internet manzilga** ega bo'ladi, uni istalgan odam
istalgan telefon/kompyuterdan ocha oladi. Biz **Vercel** (bepul) xizmatidan
foydalanamiz.

1. Terminalda, hali shu papka ichida turib, yozing:
   ```
   npx vercel
   ```
2. Birinchi marta ishlatganda savol beradi — **"Continue with Email"** ni tanlang, elektron pochtangizni kiriting, pochtangizga kelgan havolani bosib tasdiqlang
3. Terminalga qaytib, savollarga shunday javob bering (ko'pchiligida shunchaki **Enter** bossangiz bo'ladi, standart javob to'g'ri):
   - "Set up and deploy?" → **Y** (Enter)
   - "Which scope?" → o'zingizning hisobingiz (Enter)
   - "Link to existing project?" → **N** (Enter)
   - "What's your project's name?" → xohlagan nom yozing yoki Enter
   - "In which directory is your code located?" → Enter (standart `./`)
   - Qolganlarida ham Enter bosing (standart sozlamalar to'g'ri)
4. Bir necha soniyadan so'ng sizga bir necha internet manzil beriladi. Eng muhimi
   — **"Production"** deb yozilgan qatordagi manzil (masalan
   `https://savdo-sayt.vercel.app`)

**Tabriklaymiz — sayt endi internetda ishlaydi!** Shu manzilni mijozlaringizga
yuborishingiz mumkin.

> Eslatma: keyinchalik saytga o'zgartirish kiritib, yana joylashtirmoqchi bo'lsangiz, xuddi shu papkada yana `npx vercel --prod` deb yozasiz.

---

## 6-QADAM: `casme.uz` domeningizni ulash

Sizda allaqachon `casme.uz` domeni bor ekan — yaxshi, buni to'g'ridan-to'g'ri saytga ulaymiz.

1. **https://vercel.com** ga kirib, hisobingizga kiring
2. Loyihangizni tanlang (masalan `casme-savdo`) → **Settings → Domains**
3. Yozuv maydoniga `casme.uz` deb kiriting → **Add**
4. Vercel sizga **aniq qanday DNS yozuv qo'shishni** ko'rsatadi. Odatda ikkitasi kerak bo'ladi:
   - **A record**: `@` → `76.76.21.21` (yoki Vercel ko'rsatgan IP)
   - **CNAME record**: `www` → `cname.vercel-dns.com`

   Vercel sahifasida yozilgan **aniq qiymatlarni** ishlatishingiz shart, yuqoridagilar odatiy misol.

5. Endi domeningizni sotib olgan joyga o'ting (masalan Uzinfocom, REG.UZ, Beget va h.k. — qaysi joydan olgan bo'lsangiz), **"DNS boshqaruvi"** yoki **"DNS Management"** bo'limini toping
6. Vercel ko'rsatgan A va CNAME yozuvlarini shu yerga qo'shing (odatda "Add record" tugmasi bo'ladi)
7. Saqlang. DNS o'zgarishi **10 daqiqadan 24 soatgacha** vaqt olishi mumkin (odatda tezroq)
8. Vercel dashboardga qaytib turing — domen yashil belgi bilan **"Valid"** deb ko'rsatilganda, hammasi tayyor

Shundan so'ng:
- `casme.uz` — mijozlar do'koni (hech qanday parol so'ramaydi)
- `casme.uz/admin` — sizning boshqaruv panelingiz (login/parol so'raydi)

Eski `casme-savdo.vercel.app` manzili ham ishlab turadi (ikkalasi bir xil saytga olib boradi).

---

## MUHIM: bazaning tuzilishi o'zgardi

Agar avval saytni sinab ko'rgan bo'lsangiz (masalan "sardor" nomli test buyurtma) —
bu yangilanishdan keyin **eski ma'lumotlar endi ko'rinmaydi**, chunki ma'lumotlar
saqlash usuli tubdan yaxshilandi (har bir buyurtma endi alohida yozuv, avvalgidek
"hammasi bir joyda" emas — bu xavfsizlik va to'g'ri ishlashi uchun zarur edi).

Agar Firebase konsolida **Firestore Database → Data** bo'limiga kirsangiz, eski
`orders`, `customers`, `products` deb nomlangan **yakka hujjatlarni ko'rasiz** —
ularni o'chirib tashlashingiz mumkin (ular endi ishlatilmaydi). Yangi tizim
avtomatik ravishda yangi, to'g'ri tuzilgan yozuvlar yaratadi.

**Mahsulotlaringizni admin panel orqali qaytadan kiritishingiz kerak bo'ladi**
(bir marta, keyin doim saqlanib qoladi).

---

## 7-QADAM: Telegram Mini App qilib sozlash

Endi saytingiz Telegram ichida "Mini App" sifatida ham ishlaydi — mijoz botni
ochib, ichida to'g'ridan-to'g'ri xarid qila oladi, ismi avtomatik to'ladi, va
har bir yangi buyurtma haqida sizga Telegramga xabar keladi.

### 7.1 — Bot yaratish

1. Telegramda **@BotFather** ni toping, `/start` yozing
2. `/newbot` buyrug'ini yuboring
3. Bot uchun nom kiriting (masalan `Casme Do'kon`)
4. Bot uchun username kiriting — oxiri `bot` bilan tugashi shart (masalan `casme_shop_bot`)
5. BotFather sizga **token** beradi (masalan `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`) — **buni nusxalab, xavfsiz joyga saqlang** (hech kimga bermang, GitHub'ga yuklamang)

### 7.2 — Mini App URL'ini sozlash

1. Yana **@BotFather** ga qaytib, `/mybots` yozing
2. Yaratgan botingizni tanlang
3. **Bot Settings → Menu Button → Configure menu button**
4. URL sifatida saytingizni kiriting: `https://casme.uz` (yoki `https://casme-savdo.vercel.app`)
5. Tugma nomini kiriting, masalan: `Do'konni ochish`

Endi botingizga kirsangiz, pastda "Do'konni ochish" tugmasi chiqadi — bosilganda sayt Telegram ichida Mini App sifatida ochiladi.

### 7.3 — Admin chat ID'ni topish

Buyurtma xabarlari qayerga kelishini belgilaymiz (sizning shaxsiy chatingiz yoki bir guruh bo'lishi mumkin):

**Eng oson usul — shaxsiy chat uchun:**
1. Telegramda **@userinfobot** ni toping
2. `/start` yozing — u sizga chat ID'ingizni ko'rsatadi (raqam, masalan `123456789`)

**Guruh uchun (agar buyurtmalar guruhga kelishini xohlasangiz):**
1. Yaratgan botingizni guruhga administrator sifatida qo'shing
2. Guruhga istalgan xabar yozing
3. Brauzerda oching: `https://api.telegram.org/bot<TOKEN>/getUpdates` (o'z tokeningizni qo'yib)
4. Javobda `"chat":{"id": -100...}` ko'rinishida chat ID'ni topasiz (guruh ID'lari odatda minus bilan boshlanadi)

### 7.4 — Vercel'ga muhit o'zgaruvchilarini (Environment Variables) qo'shish

**MUHIM: Bot tokenini hech qachon kodga yozmang!** U faqat shu yerda, Vercel serverida saqlanadi.

1. **https://vercel.com** → loyihangiz → **Settings → Environment Variables**
2. Qo'shing:
   - Nomi: `TELEGRAM_BOT_TOKEN` — Qiymati: 7.1-qadamda olgan tokeningiz
   - Nomi: `TELEGRAM_ADMIN_CHAT_ID` — Qiymati: 7.3-qadamda topgan chat ID
3. Har birini qo'shgandan so'ng **Save**
4. Qayta joylashtiring (muhit o'zgaruvchilar faqat YANGI joylashtirishda ishga tushadi):
   ```
   npx vercel --prod
   ```

### 7.5 — Sinab ko'rish

1. Botingizga Telegramda kiring, "Do'konni ochish" tugmasini bosing
2. Mahsulot tanlang, savatga qo'shing, buyurtma bering — ismingiz avtomatik to'lganini ko'rasiz
3. Buyurtma tasdiqlangach, sizning (yoki guruhingizning) Telegramiga yangi buyurtma haqida xabar kelishi kerak

**Agar xabar kelmasa** — pastdagi "Muammo bo'lsa" bo'limidagi Telegram bilan bog'liq qatorlarni ko'ring.

---

## 8-QADAM: Mijoz profili ("Buyurtmalarim") — MUHIM, Rules qayta joylashtirilishi kerak

Endi header'dagi 👤 tugmasi bosilganda mijoz o'z profilini va buyurtmalar tarixini
ko'radi (Telegram ID bo'yicha avtomatik, yoki telefon raqami bo'yicha qidirib).

**Buning ishlashi uchun `firestore.rules` fayli YANGILANDI — Firebase konsolida
qayta joylashtirishingiz SHART** (2-qadam, 11–13-bandlaridagi kabi): Firestore
Database → Rules → yangi matnni joylashtiring → Publish.

**Ochig'ini aytay — bu bir xavfsizlik murosasi bilan keldi:** "Buyurtmalarim"
ishlashi uchun buyurtmalarni endi hamma o'qiy oladi (avvalgi versiyada faqat
siz — admin — o'qiy olardingiz). Sababi: mijoz haqiqiy login qilmagan
(Telegram ID shunchaki brauzerdan yuborilgan ma'lumot), shuning uchun
"faqat o'zining buyurtmalarini ko'rsin" degan qoidani ISHONCHLI yoza olmaymiz.
Amalda oddiy mijoz ilova orqali faqat o'z buyurtmalarini ko'radi, lekin
texnik jihatdan bilimdon odam bazaga to'g'ridan-to'g'ri murojaat qilib, boshqa
mijozlarning buyurtmalarini ham ko'rishi mumkin. Buyurtma STATUSINI
o'zgartirish/o'chirish hali ham faqat sizga (admin) tegishli.

To'liq yopish (haqiqiy Telegram identifikatsiyasini serverda tekshirish orqali)
— keyingi, murakkabroq bosqich. Xohlasangiz shuni ham qilib beraman.

---

## 9-QADAM: Mahsulot boshqaruvi yangilandi — Rules yana qayta joylashtiring

Admin panelning **Mahsulotlar** bo'limi endi ancha kuchli:

- **Rasm** — mahsulot qo'shishda/tahrirlashda rasm havolasini (URL) kiritasiz, do'konda shu rasm ko'rinadi (rasm bo'lmasa — avvalgidek ikonka turadi)
- **Kategoriya** — endi Firestore'da saqlanadi; yozishda avval kiritilgan kategoriyalar tavsiya sifatida chiqadi, yangisini yozsangiz avtomatik saqlanib, keyingi safar ro'yxatda ko'rinadi
- **Qoldiq turi** — "Soni bilan" (aniq son), "Cheksiz" (doim mavjud), "Qolmagan" (savatga qo'shib bo'lmaydi) — do'konda shunga qarab "Mavjud" / "N dona qoldi" / "Qoldiq yo'q" ko'rsatiladi
- **Tahrirlash** — har bir mahsulot yonidagi ✏️ tugmasi bosilganda hammasini o'zgartirish mumkin

**Yangi `categories` kolleksiyasi qo'shildi — shuning uchun `firestore.rules` yana yangilandi.** Firebase konsolida Firestore Database → Rules → yangi matnni joylashtiring → Publish (aks holda kategoriya tavsiyalari ishlamaydi, konsolda "permission denied" xatosi chiqadi).

**Buyurtma tarixi endi ishonchli:** har bir buyurtmada mahsulotning o'shanda qanday bo'lgani (nomi, narxi, rasmi) saqlanadi — keyin mahsulot narxini o'zgartirsangiz ham, eski buyurtmalarda eski narx ko'rsatiladi.

---

## 10-QADAM: Banner bo'limi — Firebase Storage yoqilishi kerak

Admin panelga yangi **📢 Banner** bo'limi qo'shildi — bu yerda siz saytning
bosh sahifasidagi katta bannerni (rasm + matnlar) boshqarasiz. Bir nechta
banner yaratsangiz, ular avtomatik **5 soniyada almashib** turadi (slider).

Har bir banner uchun: desktop rasm (1920×600), mobil rasm (1080×720), badge,
sarlavha, ikkinchi matn, pastdagi matn, minimal buyurtma summasi, tugma matni
va havolasi, va faol/nofaol holati. Tartibini ↑↓ tugmalari bilan
o'zgartirasiz. Agar birorta ham banner qo'shmasangiz — saytda avvalgi
standart (yashil) banner ko'rinishda qoladi.

**Rasmlar Firebase Storage'da saqlanadi — buni yoqishingiz kerak:**

1. Firebase konsoli → chap menyudan **Build → Storage**
2. **"Get started"** tugmasini bosing
3. Joylashuvni tanlang (Firestore uchun tanlagan bilan bir xil bo'lsa yaxshi) → **Done**
4. **Rules** bo'limiga o'ting, matnni butunlay o'chirib, shu papkadagi **`storage.rules`** faylining ichidagi matnni joylashtiring → **Publish**

Shu bilan tayyor — endi admin panelda banner qo'shib, rasm yuklay olasiz.

**Eslatma:** rasm URL manzili emas, to'g'ridan-to'g'ri **fayl yuklash** (komputerdan tanlash) orqali ishlaydi — Firebase Storage'ga avtomatik yuklanadi va havolasi Firestore'da saqlanadi. Yangi rasm yuklasangiz, eskisi avtomatik almashadi.

---

## 11-QADAM: Uzum Market uslubidagi yangilanishlar

- **Banner slider** — endi chap/o'ng strelka tugmalari bor, va admin panelda **maksimal 10 ta** banner qo'sha oladi (11-chisi uchun tugma o'chadi)
- **Mahsulot rasmlari** — endi URL yozish o'rniga **kompyuterdan fayl tanlab yuklash**, har bir mahsulotga **10 tagacha rasm**. Birinchi rasm "Asosiy" deb belgilanadi va do'kon kartasida ko'rinadi
- **Mahsulot tavsifi** — admin formada yangi maydon, do'konda mahsulot detailida ko'rinadi
- **Mahsulot detail oynasi** — mijoz kartani bosganda rasmlar galereyasi (strelka + kichik rasmlar), narx, chegirma, qoldiq holati, tavsif va savatga qo'shish tugmasi bilan ochiladi. Telegram Mini App/telefonda pastdan chiqadigan varaq (bottom sheet) ko'rinishida
- **Buyurtma snapshoti** — endi `productId` ham saqlanadi (avvalgi `productName`/`price`/`qty`/`imageUrl`ga qo'shimcha)

**Yangi Firebase sozlash talab qilinmaydi** — Storage va Rules avvalgi qadamlarda (10-QADAM) allaqachon sozlangan, ular mahsulot rasmlarini ham qoplaydi (`/products/**` yo'li allaqachon qoidalarda bor edi).

**Eski mahsulotlar bilan moslik:** agar avval bitta `imageUrl` (matn) bilan qo'shilgan mahsulotlaringiz bo'lsa, ular hamon to'g'ri ko'rinadi — tizim avtomatik ravishda eski formatni ham tushunadi.

---

## 12-QADAM: Mahsulot qo'shish formasi (Uzum Market uslubi)

- **Rasm nisbati tuzatildi** — kartadagi rasm konteyneri endi doim **kvadrat** (1:1). Sababi: avval balandlik qattiq piksel (`h-32`) edi, kengligi esa ekran o'lchamiga qarab o'zgarardi — shu nomutanosiblik "cho'zilgan" ko'rinishga sabab bo'lgan. Endi kengligi qanday bo'lishidan qat'i nazar, balandlik ham shunga mos keladi — rasm hech qachon buzilmaydi
- **Mahsulot qo'shish/tahrirlash** — endi katta, alohida forma (kichik oyna emas): 10 tagacha rasm, o'zbek/rus tilida nom va tavsif, kategoriya, narx, eski narx (chegirma foizi **avtomatik** hisoblanadi va formada ko'rsatiladi), qoldiq turi/soni
- **Ikki tilli mahsulot nomi/tavsifi** — endi butun sayt bo'yicha (karta, detail oyna, savat, sevimlilar, buyurtma) mahsulot nomi va tavsifi **tanlangan tilga mos** chiqadi. Agar faqat bitta tilda kiritilgan bo'lsa — o'sha til ko'rsatiladi (bo'sh chiqmaydi)
- **Eski mahsulotlar** (bitta `name`/`description` bilan qo'shilganlar) — hamon to'liq ishlaydi, tizim ularni avtomatik tanib oladi

**Firebase tomonidan hech narsa o'zgartirilmadi** — Storage, Firestore Rules avvalgidek qoladi, chunki ular allaqachon barcha kerakli yo'llarni (`/products/**`) qamrab olgan edi.

---

## 13-QADAM: Uch muammo tuzatildi

1. **Banner cho'zilishi** — endi konteyner CSS `aspect-ratio` bilan qattiq belgilangan: desktop rasm uchun **1920:600**, mobil rasm uchun **1080:720**. Rasm shu nisbat ichida `object-fit: cover` bilan to'ldiriladi — ekran qanday o'lchamda bo'lishidan qat'i nazar, rasm hech qachon cho'zilib/deformatsiyalanib ko'rinmaydi (mos qismi ko'rinadi, ortig'i kesiladi)
2. **Do'kon tili** — endi mijozlarga ko'rinadigan do'kon headerida ham 🌐 til tugmasi bor (O'zbek/Русский). Bosilganda **butun do'kon matnlari** (banner, kategoriyalar, mahsulotlar, savat, checkout) o'zgaradi. Bu — admin paneldagi til tugmasidan **mustaqil**: ular alohida sahifalar (`/` va `/admin`), bir-biriga ta'sir qilmaydi
3. **Profil** — "Boshqa raqam bilan qidirish" qidiruv oynasi olib tashlandi. O'rniga:
   - Telegram Mini App ichida ochilganda, foydalanuvchi **avtomatik aniqlanadi** (ismi, username, ID)
   - Profilda **"Telefon raqamni qo'shish"** maydoni bor — kiritilgan raqam **Firestore `customers` kolleksiyasida saqlanadi** (agar shu raqam bilan mijoz allaqachon mavjud bo'lsa, unga Telegram ma'lumotlari bog'lanadi; bo'lmasa — yangi mijoz yozuvi yaratiladi)
   - **"Buyurtmalarim"** — avval Telegram ID bo'yicha qidiradi; Telegram ID bo'lmasa (oddiy brauzerda ochilgan bo'lsa), oldin saqlangan telefon raqami bo'yicha qidiradi (raqam brauzerda eslab qolinadi — qayta yozish shart emas)
   - Buyurtma berilganda `phone` maydoni buyurtmaga ham saqlanadi (bu allaqachon ishlayotgan edi, o'zgarmadi)

**`firestore.rules` yana yangilandi — qayta joylashtirishingiz SHART** (aks holda telefon saqlash "permission denied" xatosi beradi): Firebase konsoli → Firestore Database → Rules → yangi matnni joylashtiring → Publish. Sabab: mijozlar endi o'z profiliga telefon raqami va Telegram ma'lumotlarini o'zi (login qilmasdan) yoza olishi kerak — bu maydonlar ruxsat etilganlar ro'yxatiga qo'shildi.

**Bilib qo'ying — kichik cheklov:** agar bir kishi avval **veb saytdan** (Telegram tashqarisida) telefon raqami bilan buyurtma bergan bo'lsa, keyin **Telegram orqali** kirib profilida xuddi shu telefon raqamini saqlasa — ikkisi bog'lanadi va bitta profilga birlashadi. Lekin agar u hech qachon "Telefon raqamni qo'shish"ni bosmasa, ikki alohida (bog'lanmagan) mijoz yozuvi qolishi mumkin. Bu — kichik amaliy trade-off, to'liq yechim uchun haqiqiy login tizimi kerak bo'lardi.

`src/telegram.js` va `api/telegram-order.js`ga o'zgartirish kiritilmadi — ular sinovdan o'tdi, o'zgartirish shart emas edi.

---

## 14-QADAM: Buyurtmalar va checkout tuzatildi

1. **Admin → Buyurtmalar** — endi jadvalda **"Mahsulotlar"** ustuni bor (birinchi mahsulot rasmi + nomi + soni, qolganlari "+N" bilan). Har bir qatorda 👁 tugmasini bosib, **to'liq detail oyna** ochiladi: mijoz ismi, telefon, manzil, to'lov usuli, holat, barcha mahsulotlar (rasm, nomi, soni, narxi, subtotal) va jami summa
2. **To'lov usullari** — Click va Payme olib tashlandi, endi faqat **2 ta**: "Naqd pul (yetkazib berganda)" va "Karta orqali to'lov / kartaga o'tkazma"
3. **Telefon raqam** — checkout va profilda endi maxsus input: doim **"+998 ("** bilan boshlanadi, foydalanuvchi faqat qolgan 9 ta raqamni kiritadi, avtomatik **"+998 (97) 949 44 99"** ko'rinishiga formatlanadi. Shu formatda Firestore'da saqlanadi, admin panelda va Telegram xabarida ham shu ko'rinishda chiqadi. To'liq (9 ta raqam) kiritilmasa, buyurtma yuborilmaydi

**Bilib qo'ying:** telefon formatlash — oddiy, kutubxonasiz yozilgan input. Raqamni oxiridan kiritsangiz/o'chirsangiz muammosiz ishlaydi; qatorning **o'rtasida** tahrirlashga urinsangiz, kursor oxiriga sakrab ketishi mumkin (bu — formatlangan telefon inputlarning odatiy kichik cheklovi, alohida kutubxonasiz).

Eski (avvalgi formatdagi) buyurtma/mijoz telefon raqamlari **o'zgartirilmadi** — ular eski ko'rinishda qolaveradi, faqat YANGI buyurtmalar yangi formatda saqlanadi.

---

## 15-QADAM: Tannarx, foyda hisob-kitobi va buyurtma statuslari

1. **Tannarx (costPrice)** — mahsulot formasida yangi maydon, faqat admin ko'radi (🔒 belgisi bilan). Mijozlar do'konida, mahsulot detailida, savatda, hech qayerda ko'rinmaydi
2. **Buyurtma snapshotida ham tannarx saqlanadi** — har bir buyurtma satrida `costPrice` bor, lekin bu **faqat ichki hisob-kitob uchun**, mijozga hech qachon ko'rsatilmaydi va **Telegram xabariga hech qachon yuborilmaydi** (ikki bosqichda tozalanadi: frontend yubormaydi, server ham qo'shimcha tekshiradi — sinab ko'rdim, ishlaydi)
3. **Boshqaruv paneli** — endi haqiqiy hisoblaydi: Daromad, Tannarx (mahsulotlar `costPrice × soni` yig'indisi), Yetkazib berish summasi, va **Sof foyda** = Daromad − Tannarx − Yetkazib berish (agar manfiy bo'lsa, qizil rangda ko'rsatiladi)
4. **Yetkazib berish narxi** — har bir buyurtma detailida (👁 tugmasi orqali) kiritish/tahrirlash maydoni bor, Firestore'da `order.deliveryPrice` sifatida saqlanadi va dashboard hisobida ishlatiladi
5. **Buyurtma statuslari** — endi 5 ta: Yangi, Tayyor, **Yo'lda**, **Yetkazib berildi**, Bekor qilindi
6. **Status tablari** — Buyurtmalar bo'limida yuqorida tablar (har birida son bilan): Barchasi / Yangi / Tayyor / Yo'lda / Yetkazib berildi / Bekor qilindi — bosilganda faqat shu statusdagi buyurtmalar ko'rinadi
7. Status o'zgartirish — jadvaldagi select orqali ham, detail oynasidagi select orqali ham ishlaydi, ikkalasi ham Firestore'ga saqlanadi
8. **Telegram xabarida** endi holat (📌) va to'lov usuli to'g'ri chiqadi, tannarx esa hech qachon chiqmaydi

**Firestore/Storage qoidalariga o'zgartirish kiritilmadi** — tekshirdim, ular allaqachon "faqat admin yozadi" qoidasini `costPrice`, `deliveryPrice` va status uchun ham to'liq qamrab olgan edi.

**Bilib qo'ying:** admin buyurtma statusini o'zgartirganda (masalan "Yo'lda"ga), bu haqda Telegramga **yangi xabar yuborilmaydi** — Telegram xabari faqat buyurtma birinchi marta yaratilganda yuboriladi. Agar har bir status o'zgarishida ham Telegramga xabar borishini xohlasangiz, buni ham qo'shib bera olaman.

---

## 16-QADAM: Do'kon dizayni yangilandi ("Lunora" uslubida)

Faqat **mijozlar do'koni** (`casme.uz`) qayta dizayn qilindi — krem/qora ranglar, serif sarlavhalar (Playfair Display shrifti), yangi bo'limlar bilan. **Admin panel** (`/admin`) o'zgarishsiz qoldi (funksional, yashil rangda).

**Yangi bo'limlar:**
- **Split-hero banner** — matn chapda (sarlavha, tugma), rasm o'ngda. Agar 2- yoki 3-banner ham qo'shsangiz, ular pastda ikkita kichik "promo" karta sifatida qo'shimcha chiqadi
- **Kategoriya doira ikonkalari** — har bir kategoriyaning birinchi mahsulot rasmi avtomatik ishlatiladi (alohida kategoriya rasmi yuklash shart emas)
- **"O'zingizga mos uslubni toping"** — kategoriya kartalari (4 tagacha), xuddi shu tarzda mahsulot rasmidan foydalanadi
- **Mahsulot reytingi** — admin formada endi ⭐ reyting va sharhlar soni (ixtiyoriy) kiritish mumkin, do'konda ko'rinadi
- **Ishonch belgilari** — Bepul yetkazib berish / Oson qaytarish / Xavfsiz to'lov / 24/7 qo'llab-quvvatlash (statik matn)
- **Footer** — brend, havolalar, va **funksional obuna** (email Firestore'ning yangi `newsletter` kolleksiyasiga saqlanadi)

**`firestore.rules` yangilandi** (`newsletter` kolleksiyasi uchun) — Firebase konsolida qayta joylashtirishingiz kerak, aks holda obuna bo'lish ishlamaydi.

**Bilib qo'ying:**
- Kategoriya va promo-karta rasmlari **mahsulot rasmlaridan** avtomatik olinadi — agar bironta kategoriyada hali mahsulot bo'lmasa, o'sha joyda ikonka chiqadi
- Obunachilar ro'yxatini ko'rish uchun alohida admin sahifasi hali yo'q — hozircha Firebase konsoli (Firestore Database → `newsletter`) orqali ko'rasiz. Xohlasangiz, buni ham admin panelga qo'shib beraman
- "Savdo Panel" nomini hali o'zgartirmadik (suhbatimizda bu savol ochiq qolgan edi) — agar hozir xohlasangiz, aytib qo'ying

---

## 17-QADAM: Rang palitrasi pushti (kosmetika) uslubiga o'tkazildi

Avvalgi krem/qora dizayn endi **pushti/rose** ranglarga moslashtirildi ("Glowora" namunasiga o'xshab):
- Fon, kategoriya kartalari, promo tayllar — pushti (`rose-50`/`rose-100`)
- Sarlavhaning **oxirgi so'zi** avtomatik pushti rangda ajratiladi (masalan "Reveal Your **Glow**")
- Banner rasmi ustida **doira chegirma nishoni** (agar banner "badge" maydoni to'ldirilgan bo'lsa)
- Headerga **nav havolalari** qo'shildi (Bosh sahifa / Do'kon / Kategoriyalar — bosilganda tegishli bo'limga silliq scroll qiladi)
- **Statistika banneri** — bu **haqiqiy ma'lumotlar**: mijozlar soni (Firestore'dan xavfsiz "faqat son" so'rovi bilan — mijozlarning ismi/teleofoni o'qilmaydi) va mahsulotlaringizdagi reytinglar o'rtachasi. Agar hali reyting kiritilmagan yoki mijoz bo'lmasa, bu bo'lim ko'rinmaydi (soxta raqam ko'rsatilmaydi)
- Tugmalar (Savatga qo'shish, Buyurtma berish) qora rangda qoldi — bu ham asl dizaynga mos

**Admin panelga bu safar ham tegilmadi** — faqat do'kon (`/`) qismi o'zgardi.

**Bilib qo'ying:**
- "Watch Video" tugmasi kabi elementlarni qo'shmadim — bizda video tizimi yo'q, soxta/ishlamaydigan tugma qo'shish o'rniga uni umuman qo'ymadim
- Skrinshotdagi "Natural Ingredients / Dermatologist Tested / Cruelty Free" kabi mahsulot da'volarini **qasddan qo'shmadim** — bular haqiqatga mos kelmasa, mijozlarni chalg'itishi mumkin. O'rniga umumiy va haqiqiy xizmatlarni (yetkazib berish, qaytarish, xavfsiz to'lov) ko'rsatdim. Agar mahsulotlaringiz haqiqatan ham shu xususiyatlarga ega bo'lsa, ayting — shu matnlarni joylashtirib beraman

---

## 18-QADAM: Yangi admin bo'limlari va do'kon elementlari

Admin panelga **3 ta yangi bo'lim** qo'shildi:
- **📢 Sharhlar** — mijozlaringizdan olgan haqiqiy fikr-mulohazalarni qo'shasiz (ism, matn, baho). Do'konda chiroyli kartochkalar shaklida chiqadi
- **❓ Savol-javob** — tez-tez so'raladigan savollarni qo'shasiz, do'konda "akkordeon" (bosilganda ochiladigan) ko'rinishda chiqadi
- **⚙️ Sozlamalar** — **nihoyat ishlaydigan sahifa!** Bu yerda do'kon nomini (masalan "Savdo Panel" o'rniga o'zingiznikini) va Instagram akkountingizni kiritasiz — bular sayt headerida, footerida va Instagram bo'limida avtomatik ko'rinadi

**Do'kon sahifasiga qo'shilganlar:**
- Mahsulot kartasida **sichqoncha tegganda** rasm biroz kattalashadi va karta biroz "ko'tariladi"
- Mahsulotga admin **"Yangi"** yoki **"Top"** nishonini qo'yishi mumkin (mahsulot formasida)
- **Statistika, sharhlar, FAQ** — hammasi **haqiqiy ma'lumotlar asosida**: agar hali sharh/savol qo'shmagan bo'lsangiz, o'sha bo'lim shunchaki ko'rinmaydi (bo'sh joy yoki soxta narsa chiqmaydi)
- **Instagram galereyasi** — bu **haqiqiy Instagram lentasi emas** (buning uchun alohida, murakkabroq ulanish kerak bo'ladi), balki sizning mahsulot rasmlaringizdan tuzilgan chiroyli to'r. Agar Sozlamalarda Instagram akkountingizni kiritsangiz, "Obuna bo'lish" havolasi ham chiqadi

**Nima qo'shilmadi (va nega):**
- "Watch Video" tugmasi — bizda video tizimi yo'q, ishlamaydigan tugma qo'yish o'rniga umuman qo'ymadim
- "Natural Ingredients / Dermatologist Tested" kabi mahsulot da'volari — bularni tekshira olmaganim uchun o'zim to'qib yozmadim. Agar mahsulotlaringiz haqiqatan shunday xususiyatlarga ega bo'lsa, ayting — qo'shib beraman

**`firestore.rules` yana yangilandi** (`testimonials`, `faqs`, `settings` kolleksiyalari uchun) — Firebase konsolida qayta joylashtirishingiz kerak.

---

## Muammo bo'lsa

- **"npm: command not found"** → Node.js to'g'ri o'rnatilmagan, 1-qadamni qaytaring va kompyuterni qayta yoqing
- **Sayt ochiladi, lekin mahsulotlar ko'rinmaydi / buyurtma saqlanmaydi** → `src/firebase.js` dagi konfiguratsiyani va Firebase Rules (2-qadam, 11–13-bandlar) ni qaytadan tekshiring
- **"Permission denied" xatosi Firestore'da** → Rules to'g'ri joylashtirilmagan, 2-qadamning 11–13-bandlarini qaytaring
- **`/admin` sahifasida login qabul qilmayapti ("Email yoki parol xato")** → 2-qadamning 14–18-bandlarida Authentication yoqilganini va foydalanuvchi to'g'ri qo'shilganini tekshiring; parolni to'g'ri kiritayotganingizga ishonch hosil qiling
- **`casme.uz/admin` ochilmayapti, "404" chiqadi** → `vercel.json` fayli loyihada borligini tekshiring, so'ng `npx vercel --prod` deb qayta joylashtiring
- **Domen "Invalid Configuration" deb ko'rsatadi** → DNS yozuvlar hali tarqalmagan (bir necha soat kutib ko'ring) yoki yozuv noto'g'ri kiritilgan, Vercel ko'rsatgan qiymatlarni qayta solishtiring
- **Telegramga buyurtma xabari kelmayapti** → Vercel'da `TELEGRAM_BOT_TOKEN` va `TELEGRAM_ADMIN_CHAT_ID` to'g'ri qo'shilganini tekshiring, so'ng albatta `npx vercel --prod` bilan QAYTA joylashtiring (env o'zgaruvchi qo'shilgandan keyin eski deploy avtomatik yangilanmaydi)
- **Mini App ichida ism avtomatik to'lmayapti** → botni Telegram ilovasi ichidan (brauzerdan emas) ochganingizga ishonch hosil qiling; oddiy brauzerda ochsangiz bu ishlamaydi (bu — kutilgan holat)
- **`/api/telegram-order` "404" qaytaradi** → `api/telegram-order.js` fayli loyiha papkasining eng tepasida (`src/` ichida emas, undan tashqarida) turganini tekshiring
- **Kategoriya tavsiyalari chiqmayapti / saqlanmayapti** → yangi `firestore.rules` (9-qadam) Firebase konsolida qayta joylashtirilganini tekshiring
- **Mahsulot rasmi ko'rinmayapti** → URL manzili to'g'ridan-to'g'ri rasm faylига (`.jpg`, `.png`, `.webp` bilan tugaydigan) ishora qilishi kerak, oddiy sahifa havolasi emas; URL ochilganda faqat rasm ko'rinishi kerak
- **Banner rasmi yuklanmayapti ("permission denied" yoki boshqa xato)** → Firebase Storage yoqilganini va `storage.rules` (10-qadam) joylashtirilganini tekshiring; shuningdek login qilganingizga ishonch hosil qiling (rasm yuklash faqat admin uchun)
- **Banner qo'shdim, lekin saytda ko'rinmayapti** → bannerning "Faol" (yashil ko'z belgisi) holatda ekanini tekshiring — nofaol bannerlar saytda ko'rinmaydi

---
- **Kategoriya tavsiyalari chiqmayapti / saqlanmayapti** → yangi `firestore.rules` (9-qadam) Firebase konsolida qayta joylashtirilganini tekshiring
- **Mahsulot rasmi ko'rinmayapti** → URL manzili to'g'ridan-to'g'ri rasm faylига (`.jpg`, `.png`, `.webp` bilan tugaydigan) ishora qilishi kerak, oddiy sahifa havolasi emas; URL ochilganda faqat rasm ko'rinishi kerak

---

## Keyingi bosqichlar (biznes o'sganda)

- **Click / Payme to'lov tizimini ulash** — bu uchun click.uz yoki payme.uz saytida
  biznes sifatida ro'yxatdan o'tib, merchant hisob va API kalit olishingiz kerak,
  so'ng dasturchi shu kalitlar bilan haqiqiy to'lovni ulaydi
- **Ma'lumotlar bazasini chuqurroq himoyalash** — `firestore.rules` fayli endi
  yangilangan: **buyurtmalar ro'yxatini faqat siz (login qilgan admin) o'qiy
  olasiz**, mijoz faqat yangi buyurtma yozishi mumkin, boshqa hech kimning
  buyurtmasini ko'ra olmaydi. Mahsulot narxini ham faqat admin o'zgartira oladi.
  Qolgan kichik kamchilik: mijozlar ro'yxati (ism/telefon/summasi) hali ham
  texnik jihatdan o'qish uchun ochiq (checkout "eski mijozmi" tekshiruvi shuni
  talab qiladi) — buni ham butunlay yopish uchun Cloud Function kerak bo'ladi,
  xohlasangiz shuni ham keyingi bosqichda qilib beraman
- **Rasm qo'shish** — hozir mahsulotlarda rasm o'rniga ikonka turadi; buni
  haqiqiy mahsulot rasmlari bilan almashtirish mumkin (Firebase Storage orqali)
