// Brend va kategoriya sahifalari uchun ichki SEO tavsiflar (admin tavsif kiritmagan bo'lsa ishlatiladi).
// Admin paneldagi "SEO tavsif" maydoni doim ustun turadi.

const norm = (s) => String(s || "").trim().toLowerCase().replace(/[’`ʻ‘]/g, "'");

// [o'zbekcha ta'rif, ruscha ta'rif]
const BRANDS = {
  "medicube": ["dermatologik yondashuvga asoslangan koreys brendi: teri parvarishi vositalari va uy sharoitidagi go'zallik qurilmalari", "корейский бренд с дерматологическим подходом: уход за кожей и домашние бьюти-устройства"],
  "skin1004": ["Madagaskar sentellasi (Centella Asiatica) asosidagi, sezgir teriga mos yumshoq koreys parvarishi", "корейский уход на основе мадагаскарской центеллы, мягкий для чувствительной кожи"],
  "numbuzin": ["raqamli nomlar bilan mashhur zamonaviy koreys brendi: serum, toner va kremlar", "современный корейский бренд с нумерованными продуктами: сыворотки, тонеры и кремы"],
  "cosrx": ["salyangoz mutsini (snail mucin) essensiyasi va akneega qarshi vositalari bilan mashhur koreys brendi", "корейский бренд, известный эссенцией с муцином улитки и средствами против акне"],
  "anua": ["Heartleaf (saururus) ekstrakti asosidagi tinchlantiruvchi toner, serum va kremlar bilan mashhur koreys brendi", "корейский бренд, известный успокаивающими тонерами, сыворотками и кремами с экстрактом хауттюйнии"],
  "lagom": ["teri namligini saqlashga yo'naltirilgan oddiy va samarali koreys parvarish vositalari", "простой и эффективный корейский уход, направленный на увлажнение кожи"],
  "some by mi": ["AHA, BHA, PHA kislotalari va muammoli teriga mo'ljallangan «Miracle» seriyasi bilan mashhur koreys brendi", "корейский бренд, известный кислотами AHA, BHA, PHA и серией Miracle для проблемной кожи"],
  "charlotte tilbury": ["mashhur britaniyalik premium makiyaj va teri parvarishi brendi", "известный британский бренд премиальной декоративной косметики и ухода за кожей"],
  "celimax": ["tabiiy ingredientlarga (masalan, noni) asoslangan koreys teri parvarishi brendi", "корейский бренд ухода за кожей на основе натуральных ингредиентов, таких как нони"],
  "d'alba": ["oq trufel (white truffle) seriyasi va mist-serumi bilan mashhur koreys brendi", "корейский бренд, известный серией с белым трюфелем и мист-сывороткой"],
  "the ordinary": ["sodda formulalar va yuqori konsentratsiyali faol ingredientlar (niatsinamid, kislotalar, retinol) bilan tanilgan brend", "бренд с простыми формулами и высокой концентрацией активных ингредиентов (ниацинамид, кислоты, ретинол)"],
  "isntree": ["gialuron kislotasi va shuvoq (mugwort) asosidagi yumshoq koreys parvarishi", "мягкий корейский уход на основе гиалуроновой кислоты и полыни"],
  "i'm from": ["guruch, shuvoq va boshqa tabiiy ingredientlar asosidagi koreys parvarish vositalari", "корейский уход на основе риса, полыни и других натуральных ингредиентов"],
  "beauty of joseon": ["an'anaviy koreys (hanbang) retseptlari: guruch, jenshen, quyoshdan himoya kremlari va serumlar", "традиционные корейские (ханбан) рецепты: рис, женьшень, солнцезащитные кремы и сыворотки"],
  "dr.althea": ["dermatologik yondashuvdagi koreys teri parvarishi brendi", "корейский бренд ухода за кожей с дерматологическим подходом"],
  "vt cosmetics": ["Reedle Shot va Cica seriyalari bilan mashhur zamonaviy koreys brendi", "современный корейский бренд, известный сериями Reedle Shot и Cica"],
  "axis-y": ["dog'larga qarshi va teri tonini tekislovchi serumlari bilan mashhur koreys brendi", "корейский бренд, известный сыворотками против пигментации и для выравнивания тона кожи"],
  "torriden": ["Dive-In seriyasidagi gialuron kislotali chuqur namlantiruvchi vositalar bilan mashhur koreys brendi", "корейский бренд, известный глубоко увлажняющими средствами с гиалуроновой кислотой серии Dive-In"],
  "attenir": ["yapon tozalovchi va teri parvarishi vositalari brendi", "японский бренд средств для очищения и ухода за кожей"],
  "centelian24": ["Madeca kremi va sentella (Centella) asosidagi tiklovchi vositalar bilan mashhur koreys brendi", "корейский бренд, известный кремом Madeca и восстанавливающими средствами с центеллой"],
  "bioderma": ["Sensibio mitsellyar suvi va sezgir teri uchun dermatologik vositalari bilan mashhur fransuz brendi", "французский бренд, известный мицеллярной водой Sensibio и дерматологическими средствами для чувствительной кожи"],
  "dr.reju-all": ["koreys teri parvarishi va tiklovchi kosmetika brendi", "корейский бренд ухода за кожей и восстанавливающей косметики"],
  "skin&lab": ["muammoli va sezgir teriga mo'ljallangan koreys dermokosmetikasi", "корейская дермокосметика для проблемной и чувствительной кожи"],
  "rejuran": ["teri tiklanishiga yo'naltirilgan Rejuran (polinukleotid) texnologiyasi bilan tanilgan koreys brendi", "корейский бренд, известный технологией Rejuran (полинуклеотиды) для восстановления кожи"],
  "ma:nyo": ["Pure Cleansing Oil gidrofil moyi va bifida seriyasi bilan mashhur koreys brendi", "корейский бренд, известный гидрофильным маслом Pure Cleansing Oil и серией с бифидой"],
  "goodal": ["yashil mandarin (green tangerine) vitamin C seriyasi bilan mashhur koreys brendi", "корейский бренд, известный серией с витамином C из зелёного мандарина"],
  "the face shop": ["keng assortimentli mashhur koreys makiyaj va teri parvarishi brendi", "популярный корейский бренд макияжа и ухода за кожей с широким ассортиментом"],
  "jmsolution": ["asal, ipak va boshqa ingredientli niqoblar bilan mashhur koreys brendi", "корейский бренд, известный масками с мёдом, шёлком и другими ингредиентами"],
  "raund lab": ["qayin sharbati (birch juice) va qarag'ay seriyasi bilan mashhur koreys brendi", "корейский бренд, известный сериями с берёзовым соком и сосной"],
  "arencia": ["tabiiy tarkibli koreys teri parvarishi brendi", "корейский бренд ухода за кожей с натуральным составом"],
  "lalarecipe": ["koreys teri parvarishi va tozalash vositalari brendi", "корейский бренд ухода за кожей и средств для очищения"],
  "derx": ["teri parvarishi vositalari brendi", "бренд средств для ухода за кожей"],
  "by wishtrend": ["vitamin C va mandel kislotasi seriyalari bilan mashhur koreys brendi", "корейский бренд, известный сериями с витамином C и миндальной кислотой"],
  "dj carboxy therapy": ["karboksiterapiya (CO2) niqoblari bilan tanilgan teri parvarishi brendi", "бренд ухода за кожей, известный масками для карбокситерапии (CO2)"],
  "medi-peel": ["peptidli (Peptide 9) vositalar bilan mashhur koreys brendi", "корейский бренд, известный средствами с пептидами (Peptide 9)"],
  "biodance": ["kollagenli bio-gel niqoblari bilan mashhur koreys brendi", "корейский бренд, известный био-гелевыми масками с коллагеном"],
};

// [o'zbekcha, ruscha]
const CATEGORIES = {
  "serum": ["Serum — terining muayyan muammolariga (dog', quruqlik, ajinlar) yo'naltirilgan konsentrlangan parvarish vositasi", "Сыворотки — концентрированные средства для решения конкретных проблем кожи (пигментация, сухость, морщины)"],
  "mist": ["Mist — yuzni tez namlantiruvchi va yangilovchi sepma vosita", "Мисты — спрей для быстрого увлажнения и освежения лица"],
  "cream": ["Kremlar — kundalik namlantirish va himoya uchun yuz va tana kremlari", "Кремы — ежедневное увлажнение и защита кожи лица и тела"],
  "toner": ["Tonerlar — yuvingandan keyin terini tayyorlovchi va namlantiruvchi vosita", "Тонеры — подготавливают и увлажняют кожу после умывания"],
  "maska": ["Yuz niqoblari — intensiv namlantirish, tozalash va tiklash uchun", "Маски для лица — интенсивное увлажнение, очищение и восстановление"],
  "penka": ["Yuvinish ko'piklari — yumshoq tozalash uchun yuz yuvish vositalari", "Пенки для умывания — мягкое очищение кожи лица"],
  "pudra": ["Pudralar — makiyajni mustahkamlovchi va yuzga mat ko'rinish beruvchi vosita", "Пудры — фиксируют макияж и дают матовый финиш"],
  "ko'z krem": ["Ko'z atrofi kremlari — ko'z atrofidagi nozik teri uchun maxsus parvarish", "Кремы для глаз — специальный уход за нежной кожей вокруг глаз"],
  "gidrofil moy": ["Gidrofil moylar — makiyaj va sebumni yumshoq eritib tozalovchi vosita", "Гидрофильные масла — мягко растворяют макияж и себум"],
  "spf 50+": ["SPF 50+ quyoshdan himoya vositalari — kundalik UV himoya uchun", "Солнцезащитные средства SPF 50+ — ежедневная защита от УФ-лучей"],
  "haylayter": ["Haylayterlar — yuzga yorqinlik beruvchi makiyaj vositasi", "Хайлайтеры — придают лицу сияние"],
  "rumyana": ["Rumyana — yuzga tabiiy qizillik beruvchi makiyaj vositasi", "Румяна — придают лицу естественный румянец"],
  "lotion": ["Loson — yengil teksturali namlantiruvchi parvarish vositasi", "Лосьоны — увлажняющий уход с лёгкой текстурой"],
  "essensiya": ["Essensiyalar — terini chuqur namlantiruvchi va tiklovchi koreys parvarish bosqichi", "Эссенции — этап корейского ухода для глубокого увлажнения и восстановления кожи"],
  "stick": ["Stick vositalar — qulay surtiladigan parvarish va makiyaj mahsulotlari", "Стики — удобные в нанесении средства для ухода и макияжа"],
  "tana uchun eksfoliant": ["Tana eksfoliantlari — tana terisini yumshoq tozalovchi va silliqlovchi vositalar", "Эксфолианты для тела — мягко очищают и разглаживают кожу тела"],
  "mitsellyar suv": ["Mitsellyar suv — makiyajni yumshoq olib tashlovchi va terini tozalovchi vosita", "Мицеллярная вода — мягко снимает макияж и очищает кожу"],
  "kontur": ["Kontur vositalari — yuz shaklini ta'kidlovchi makiyaj mahsulotlari", "Средства для контуринга — подчёркивают форму лица"],
  "lablar uchun serum": ["Lablar uchun serum — lab terisini namlantiruvchi va parvarishlovchi vosita", "Сыворотки для губ — увлажняют и ухаживают за кожей губ"],
  "to'plam": ["Parvarish to'plamlari — bir nechta vositadan iborat tayyor setlar", "Наборы по уходу — готовые комплекты из нескольких средств"],
  "booster": ["Booster — parvarish samarasini kuchaytiruvchi konsentrat", "Бустеры — концентраты, усиливающие эффект ухода"],
  "stick maska": ["Stick niqoblar — qulay surtiladigan yuz niqoblari", "Маски-стики — удобные в нанесении маски для лица"],
  "ampoule": ["Ampulalar — yuqori konsentratsiyali faol moddali parvarish", "Ампулы — уход с высокой концентрацией активных веществ"],
  "makiyaj bazasi": ["Makiyaj bazasi — makiyajni tekis yotqizuvchi va mustahkamlovchi asos", "База под макияж — выравнивает кожу и повышает стойкость макияжа"],
  "pad": ["Padlar — toner va faol moddalar shimdirilgan qulay yuz padlari", "Пэды — удобные диски с тонером и активными веществами"],
  "enzyme": ["Enzim upalari — terini yumshoq eksfoliatsiya qiluvchi tozalash vositasi", "Энзимная пудра — мягкий эксфолиирующий очиститель для кожи"],
  "kiprik va qosh uchun serum": ["Kiprik va qosh uchun serum — kiprik va qoshlarni parvarishlovchi vosita", "Сыворотки для ресниц и бровей — уход за ресницами и бровями"],
  "aparat": ["Go'zallik aparatlari — uy sharoitida teri parvarishi uchun qurilmalar", "Бьюти-аппараты — устройства для домашнего ухода за кожей"],
  "makiyaj": ["Dekorativ kosmetika — yuz, ko'z va lablar uchun makiyaj vositalari", "Декоративная косметика — макияж для лица, глаз и губ"],
  "aknega qarshi konsentrat": ["Aknega qarshi konsentrat — dog' va yallig'lanishlarga nuqtali parvarish", "Концентрат против акне — точечный уход при воспалениях и высыпаниях"],
  "kosmetik sumka": ["Kosmetik sumkalar — go'zallik vositalarini saqlash va olib yurish uchun", "Косметички — для хранения и переноски средств по уходу"],
  "lab qalami": ["Lab qalami — lab konturini aniq chizuvchi makiyaj vositasi", "Карандаш для губ — чётко очерчивает контур губ"],
};

/** Brend/kategoriya uchun ichki SEO tavsifni qaytaradi (topilmasa bo'sh satr). */
export function builtinSeoDescription(mode, name, lang) {
  if (!name) return "";
  const key = norm(name);
  const ru = lang === "ru";
  if (mode === "brand") {
    const e = BRANDS[key];
    if (!e) return "";
    return ru
      ? `${name} — ${e[1]}. Оригинальная продукция ${name} в интернет-магазине CASME с доставкой по Ташкенту и Узбекистану.`
      : `${name} — ${e[0]}. CASME onlayn do'konida original ${name} mahsulotlarini xarid qiling, Toshkent va O'zbekiston bo'ylab yetkazib beramiz.`;
  }
  if (mode === "category") {
    const e = CATEGORIES[key];
    if (!e) return "";
    return ru
      ? `${e[1]}. Оригинальная корейская косметика в CASME с доставкой по Ташкенту и Узбекистану.`
      : `${e[0]}. CASME'da original koreys kosmetikasi, Toshkent va O'zbekiston bo'ylab yetkazib berish.`;
  }
  return "";
}
