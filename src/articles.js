// "Maqolalar" bo'limi: teri parvarishi bo'yicha qo'llanmalar (uz + ru).
// Sahifalar serverda tayyorlanadi (api/sitemap.js → /articles, /article/<slug>)
// va sitemap.xml'ga qo'shiladi. Yangi maqola qo'shish uchun ro'yxat oxiriga
// shu tuzilishdagi obyekt qo'shing va deploy qiling.
//
// blocks: ["h", "Sarlavha"] yoki ["p", "Matn"]
// category: maqola oxirida shu kategoriyadagi mahsulotlar ko'rsatiladi.

export const ARTICLES = [
  {
    slug: "quruq-teri-uchun-serum-tanlash",
    date: "2026-11-05",
    category: "Serum",
    uz: {
      title: "Quruq teri uchun serum qanday tanlanadi",
      desc: "Quruq teri uchun serum tanlash: gialuron kislotasi, seramidlar va panthenol. Qo'llash tartibi va keng tarqalgan xatolar.",
      blocks: [
        ["p", "Quruq teri tez tortishadi, qipiqlanadi va kun davomida namlik yetishmasligini sezdiradi. Serum shu muammoga yo'naltirilgan yengil, lekin konsentrlangan parvarish bosqichi. Quyida tanlash va qo'llash bo'yicha qisqa qo'llanma."],
        ["h", "Tarkibga qarang"],
        ["p", "Gialuron kislotasi (hyaluronic acid) teri yuzasida namlikni ushlab turishga yordam beradi. Panthenol (vitamin B5) va seramidlar teri to'sig'ini mustahkamlaydi. Niatsinamid terining tekis ko'rinishini qo'llab-quvvatlaydi. Spirt va kuchli xushbo'y moddalar ko'p bo'lgan formulalardan ehtiyot bo'ling, ular quruq teriga ortiqcha ta'sir qilishi mumkin."],
        ["h", "Qanday qo'llash kerak"],
        ["p", "Serumni yuzni yuvib, tonerdan keyin, krem oldidan surting. Gialuron kislotali serumni biroz nam teriga qo'llash yaxshi ishlaydi. Keyin namlantiruvchi krem bilan namlikni \"yoping\". Ertalab oxirida quyoshdan himoya kremi (SPF) kerak."],
        ["h", "Keng tarqalgan xatolar"],
        ["p", "Bir vaqtda juda ko'p faol vositani aralashtirish teriga zarar berishi mumkin. Yangi vositani birinchi marta ishlatishdan oldin quloq orqasida yoki bilak ichida kichik sinov o'tkazing. Teri qizarsa yoki achishsa, ishlatishni to'xtating."],
        ["p", "Teringiz sezgir yoki muammo uzoq davom etsa, dermatolog bilan maslahatlashing."],
      ],
    },
    ru: {
      title: "Как выбрать сыворотку для сухой кожи",
      desc: "Как выбрать сыворотку для сухой кожи: гиалуроновая кислота, керамиды и пантенол. Порядок нанесения и частые ошибки.",
      blocks: [
        ["p", "Сухая кожа быстро стягивается, шелушится и к середине дня сигнализирует о нехватке влаги. Сыворотка — лёгкий, но концентрированный этап ухода, направленный на эту проблему. Ниже — краткое руководство по выбору и применению."],
        ["h", "Смотрите на состав"],
        ["p", "Гиалуроновая кислота помогает удерживать влагу на поверхности кожи. Пантенол (витамин B5) и керамиды укрепляют защитный барьер. Ниацинамид поддерживает ровный вид кожи. Остерегайтесь формул с большим количеством спирта и сильных отдушек — они могут избыточно воздействовать на сухую кожу."],
        ["h", "Как наносить"],
        ["p", "Наносите сыворотку после умывания и тонера, перед кремом. Сыворотка с гиалуроновой кислотой лучше работает на слегка влажную кожу. Затем закрепите увлажнение кремом. Утром последним этапом нужен солнцезащитный крем (SPF)."],
        ["h", "Частые ошибки"],
        ["p", "Одновременное использование слишком многих активных средств может навредить коже. Перед первым применением нового средства сделайте небольшой тест за ухом или на внутренней стороне запястья. Если появилось покраснение или жжение, прекратите использование."],
        ["p", "Если кожа чувствительная или проблема не проходит, проконсультируйтесь с дерматологом."],
      ],
    },
  },
  {
    slug: "spf-qanday-tanlanadi",
    date: "2026-11-05",
    category: "SPF 50+",
    uz: {
      title: "Quyoshdan himoya kremi (SPF) qanday tanlanadi",
      desc: "SPF va PA nimani anglatadi, kimyoviy va mineral filtrlar farqi, qancha surtish va qachon yangilash kerak.",
      blocks: [
        ["p", "Quyoshdan himoya kremi (SPF) — kundalik parvarishning eng muhim bosqichlaridan biri. U terini ultrabinafsha nurlardan himoya qilishga yordam beradi, bu esa dog'lar va erta ajinlar xavfini kamaytirishga ko'maklashadi."],
        ["h", "SPF va PA nimani bildiradi"],
        ["p", "SPF asosan UVB nurlaridan himoya darajasini ko'rsatadi. PA belgisi (masalan, PA+++) UVA nurlaridan himoyani bildiradi. Koreys SPF vositalarida odatda ikkalasi ham ko'rsatiladi. Kundalik foydalanish uchun SPF 30–50 va PA+++ yoki PA++++ keng tarqalgan tanlov."],
        ["h", "Kimyoviy va mineral filtr"],
        ["p", "Kimyoviy filtrli kremlar yengil, tez singadi va oq iz qoldirmaydi. Mineral (fizik) filtrli kremlar (rux oksidi, titan dioksidi) sezgir teriga ko'pincha yoqadi, lekin biroz oqish iz qoldirishi mumkin. Tanlov teringiz turi va shaxsiy qulayligingizga bog'liq."],
        ["h", "Qancha va qachon surtish"],
        ["p", "Yuz uchun taxminan ikki barmoq uzunligidagi miqdor tavsiya etiladi. Ko'chada uzoq vaqt bo'lsangiz, har 2–3 soatda yangilab turing, ayniqsa terlagan yoki suvga tushgan bo'lsangiz. Bulutli kunda ham UV nurlari mavjud, shuning uchun SPF'ni yil bo'yi ishlating."],
        ["p", "Kechqurun SPF'ni yaxshilab olib tashlash uchun gidrofil moy yoki mitsellyar suv va keyin yuvish ko'pigidan foydalaning."],
      ],
    },
    ru: {
      title: "Как выбрать солнцезащитный крем (SPF)",
      desc: "Что означают SPF и PA, разница между химическими и минеральными фильтрами, сколько наносить и когда обновлять.",
      blocks: [
        ["p", "Солнцезащитный крем (SPF) — один из самых важных этапов ежедневного ухода. Он помогает защитить кожу от ультрафиолета, а это снижает риск пигментных пятен и раннего появления морщин."],
        ["h", "Что означают SPF и PA"],
        ["p", "SPF показывает уровень защиты в основном от UVB-лучей. Маркировка PA (например, PA+++) указывает на защиту от UVA-лучей. В корейских средствах обычно указаны оба показателя. Для ежедневного использования распространённый выбор — SPF 30–50 и PA+++ или PA++++."],
        ["h", "Химические и минеральные фильтры"],
        ["p", "Кремы с химическими фильтрами лёгкие, быстро впитываются и не оставляют белых следов. Кремы с минеральными (физическими) фильтрами (оксид цинка, диоксид титана) часто подходят чувствительной коже, но могут оставлять лёгкий белый оттенок. Выбор зависит от типа кожи и личного комфорта."],
        ["h", "Сколько и когда наносить"],
        ["p", "Для лица обычно рекомендуют количество, равное длине двух пальцев. Если вы долго на улице, обновляйте крем каждые 2–3 часа, особенно после потоотделения или купания. UV-лучи есть и в облачную погоду, поэтому используйте SPF круглый год."],
        ["p", "Вечером тщательно удаляйте SPF гидрофильным маслом или мицеллярной водой, а затем умывайтесь пенкой."],
      ],
    },
  },
  {
    slug: "koreys-teri-parvarishi-bosqichlari",
    date: "2026-11-05",
    category: "Essensiya",
    uz: {
      title: "Koreys teri parvarishi bosqichlari: qaysi tartibda?",
      desc: "Koreys parvarishining asosiy bosqichlari: tozalash, toner, essensiya, serum, krem va SPF. Yangi boshlovchilar uchun oddiy tartib.",
      blocks: [
        ["p", "Koreys teri parvarishi ko'p bosqichli tizim sifatida mashhur, lekin hammasini bajarish shart emas. Asosiysi — tartibni bilish va teringizga mosini tanlash."],
        ["h", "Kechki parvarish"],
        ["p", "1) Gidrofil moy yoki mitsellyar suv makiyaj va SPF'ni eritadi. 2) Yuvish ko'pigi yoki geli terini yumshoq tozalaydi. 3) Toner terini keyingi bosqichlarga tayyorlaydi va namlaydi. 4) Essensiya yengil namlik va tiklanish beradi. 5) Serum yoki ampula aniq muammoga (dog', quruqlik, g'ovaklar) yo'naltiriladi. 6) Krem namlikni yopadi. Haftada 1–2 marta niqob yoki yengil eksfoliatsiya qo'shish mumkin."],
        ["h", "Ertalabki parvarish"],
        ["p", "Ertalab odatda yengilroq tizim yetarli: yumshoq yuvish, toner, serum (masalan, vitamin C), krem va eng muhim bosqich — quyoshdan himoya kremi (SPF)."],
        ["h", "Yangi boshlovchilar uchun maslahat"],
        ["p", "Boshida to'rt bosqich yetarli: yuvish, toner, krem va SPF. Yangi vositani bittadan, 1–2 hafta oralatib qo'shing, shunda teringiz qaysi biriga qanday javob berishini bilasiz. Natija odatda bir necha hafta ichida seziladi, sabr qiling."],
      ],
    },
    ru: {
      title: "Этапы корейского ухода за кожей: в каком порядке?",
      desc: "Основные этапы корейского ухода: очищение, тонер, эссенция, сыворотка, крем и SPF. Простой порядок для новичков.",
      blocks: [
        ["p", "Корейский уход известен как многоэтапная система, но выполнять все этапы необязательно. Главное — знать порядок и выбирать подходящее для своей кожи."],
        ["h", "Вечерний уход"],
        ["p", "1) Гидрофильное масло или мицеллярная вода растворяют макияж и SPF. 2) Пенка или гель мягко очищают кожу. 3) Тонер готовит кожу к следующим этапам и увлажняет. 4) Эссенция даёт лёгкое увлажнение и восстановление. 5) Сыворотка или ампула направлены на конкретную проблему (пигментация, сухость, поры). 6) Крем закрепляет влагу. Раз-два в неделю можно добавить маску или мягкую эксфолиацию."],
        ["h", "Утренний уход"],
        ["p", "Утром обычно хватает более лёгкой схемы: мягкое умывание, тонер, сыворотка (например, с витамином C), крем и самый важный этап — солнцезащитный крем (SPF)."],
        ["h", "Совет для новичков"],
        ["p", "Сначала достаточно четырёх этапов: умывание, тонер, крем и SPF. Новые средства добавляйте по одному с интервалом 1–2 недели, чтобы понимать, как кожа реагирует на каждое. Результат обычно заметен через несколько недель, наберитесь терпения."],
      ],
    },
  },
  {
    slug: "akneli-teri-parvarishi",
    date: "2026-11-05",
    category: "Aknega qarshi konsentrat",
    uz: {
      title: "Akneli teri parvarishi: nimalarga e'tibor berish kerak",
      desc: "Akne va g'ovaklarga moyil teri uchun parvarish: yumshoq tozalash, salitsil kislotasi, niatsinamid va namlik.",
      blocks: [
        ["p", "Aknega moyil teri ko'pincha ortiqcha tozalash va kuchli vositalar bilan \"quritiladi\", natijada u yana ko'proq yog' ishlab chiqaradi. Muvozanatli yondashuv yaxshiroq ishlaydi."],
        ["h", "Yumshoq tozalash"],
        ["p", "Kuniga ikki marta pH-muvozanatli yuvish vositasidan foydalaning. Kechqurun SPF yoki makiyaj bo'lsa, avval gidrofil moy yoki mitsellyar suv ishlating. Terini qattiq ishqalamang."],
        ["h", "Faol moddalar"],
        ["p", "Salitsil kislotasi (BHA) g'ovaklarni tozalashga yordam beradi. Niatsinamid yog' ajralishi va qizarishlar ko'rinishini muvozanatlashga ko'maklashadi. Centella asiatica yallig'langan teriga yumshoq parvarish beradi. Faol moddalarni sekin, haftada 2–3 martadan boshlab kiriting."],
        ["h", "Namlikni unutmang"],
        ["p", "Yog'li va akneli teri ham namlikka muhtoj. Yengil, yog'siz (oil-free) gel yoki krem tanlang. Ertalab SPF majburiy, chunki ko'p faol moddalar terini quyoshga sezgirroq qilishi mumkin."],
        ["h", "Qilmaslik kerak"],
        ["p", "Pimplarni siqmang, bu izlar va yallig'lanish xavfini oshiradi. Bir vaqtda bir nechta kuchli vositani qo'llamang. Akne og'ir bo'lsa yoki uzoq davom etsa, dermatologga murojaat qiling."],
      ],
    },
    ru: {
      title: "Уход за кожей с акне: на что обратить внимание",
      desc: "Уход за кожей, склонной к акне и расширенным порам: мягкое очищение, салициловая кислота, ниацинамид и увлажнение.",
      blocks: [
        ["p", "Кожу, склонную к акне, часто «пересушивают» чрезмерным очищением и сильными средствами, из-за чего она вырабатывает ещё больше жира. Сбалансированный подход работает лучше."],
        ["h", "Мягкое очищение"],
        ["p", "Умывайтесь два раза в день средством со сбалансированным pH. Вечером, если был SPF или макияж, сначала используйте гидрофильное масло или мицеллярную воду. Не трите кожу."],
        ["h", "Активные компоненты"],
        ["p", "Салициловая кислота (BHA) помогает очищать поры. Ниацинамид помогает сбалансировать выработку себума и уменьшить видимость покраснений. Центелла азиатская мягко ухаживает за воспалённой кожей. Активные компоненты вводите постепенно, начиная с 2–3 раз в неделю."],
        ["h", "Не забывайте об увлажнении"],
        ["p", "Жирная кожа с акне тоже нуждается в увлажнении. Выбирайте лёгкий гель или крем без масел (oil-free). Утром SPF обязателен, так как многие активные компоненты повышают чувствительность кожи к солнцу."],
        ["h", "Чего делать не стоит"],
        ["p", "Не выдавливайте прыщи: это повышает риск следов и воспаления. Не используйте одновременно несколько сильных средств. Если акне тяжёлое или не проходит долго, обратитесь к дерматологу."],
      ],
    },
  },
  {
    slug: "sezgir-teri-uchun-parvarish",
    date: "2026-11-05",
    category: "Cream",
    uz: {
      title: "Sezgir teri uchun parvarish: oddiy qoidalar",
      desc: "Sezgir teri uchun parvarish: kam bosqich, xushbo'ysiz vositalar, centella va seramidlar, sinov o'tkazish.",
      blocks: [
        ["p", "Sezgir teri tez qizaradi, achishadi yoki tortishadi. Unga eng yaxshi ishlaydigan yondashuv — oddiylik: kam bosqich va yumshoq tarkib."],
        ["h", "Kam bosqich, yumshoq tarkib"],
        ["p", "Yuvish, namlantiruvchi va SPF — asosiy uch bosqich. Xushbo'y moddalar, ko'p spirt va kuchli kislotali vositalarni cheklang. Centella asiatica, panthenol va seramidli vositalar sezgir teriga ko'pincha mos keladi."],
        ["h", "Yangi vositani sinab ko'ring"],
        ["p", "Har bir yangi vositani yuzga surtishdan oldin bilak ichida yoki quloq orqasida 24 soat sinab ko'ring. Bir vaqtda bir nechta yangi vositani boshlamang, aks holda qaysi biri ta'sir qilganini bilolmaysiz."],
        ["h", "Haddan tashqari tozalamang"],
        ["p", "Issiq suv va qattiq ishqalash terini quritadi. Iliq suv va yumshoq yuvish vositasini tanlang. Peeling va kislotalarni kamdan-kam, teri tinch holatda bo'lganda ishlating."],
        ["p", "Doimiy qizarish, yallig'lanish yoki og'riq bo'lsa, dermatolog bilan maslahatlashing."],
      ],
    },
    ru: {
      title: "Уход за чувствительной кожей: простые правила",
      desc: "Уход за чувствительной кожей: минимум этапов, средства без отдушек, центелла и керамиды, тестирование.",
      blocks: [
        ["p", "Чувствительная кожа быстро краснеет, жжёт или стягивается. Лучше всего работает простота: минимум этапов и мягкий состав."],
        ["h", "Минимум этапов, мягкий состав"],
        ["p", "Умывание, увлажнение и SPF — три основных этапа. Ограничьте средства с отдушками, большим количеством спирта и сильными кислотами. Средства с центеллой азиатской, пантенолом и керамидами часто подходят чувствительной коже."],
        ["h", "Тестируйте новые средства"],
        ["p", "Перед нанесением нового средства на лицо проверьте его 24 часа на внутренней стороне запястья или за ухом. Не начинайте несколько новых средств одновременно, иначе вы не поймёте, какое из них вызвало реакцию."],
        ["h", "Не очищайте слишком агрессивно"],
        ["p", "Горячая вода и сильное трение сушат кожу. Выбирайте тёплую воду и мягкое средство для умывания. Пилинги и кислоты используйте редко и когда кожа спокойна."],
        ["p", "При постоянном покраснении, воспалении или боли проконсультируйтесь с дерматологом."],
      ],
    },
  },
  {
    slug: "original-koreys-kosmetikasini-tanlash",
    date: "2026-11-05",
    category: "Toner",
    uz: {
      title: "Original koreys kosmetikasini qanday tanlash va qayerdan sotib olish",
      desc: "Original koreys kosmetikasini tanlash bo'yicha maslahatlar: ishonchli sotuvchi, qadoq, yaroqlilik muddati va narx.",
      blocks: [
        ["p", "Koreys kosmetikasi mashhur bo'lgani sari, sifatsiz yoki noto'g'ri saqlangan mahsulotlar ham uchrab turadi. Quyidagi oddiy qoidalar xavfni kamaytiradi."],
        ["h", "Ishonchli sotuvchini tanlang"],
        ["p", "Rasmiy do'kon yoki ishonchli onlayn do'kondan xarid qiling. Sotuvchining aniq manzili, aloqa raqami, mijozlar sharhlari va qaytarish shartlari bo'lishi muhim. Mahsulot qayerdan olib kelingani haqida so'rang."],
        ["h", "Qadoqni tekshiring"],
        ["p", "Brend nomi, tarkib ro'yxati va yaroqlilik muddati aniq bosilgan bo'lishi kerak. Qadoq butun va muhrlangan bo'lsin. Partiya raqami (batch) va ishlab chiqarilgan sana mavjudligini tekshiring. Matn xatolari va xira bosma shubha uyg'otishi mumkin."],
        ["h", "Narxga e'tibor bering"],
        ["p", "Bozor narxidan keskin past narx ehtiyot bo'lish uchun sababdir. Chegirma bo'lishi mumkin, lekin juda katta farq bo'lsa, sotuvchidan tushuntirish so'rang."],
        ["h", "Saqlash"],
        ["p", "Kosmetikani quyosh nuri va issiqdan uzoqda, quruq joyda saqlang. Ochilgandan keyin qadoqdagi yaroqlilik belgisiga (PAO) amal qiling."],
      ],
    },
    ru: {
      title: "Как выбрать оригинальную корейскую косметику и где её купить",
      desc: "Советы по выбору оригинальной корейской косметики: надёжный продавец, упаковка, срок годности и цена.",
      blocks: [
        ["p", "По мере роста популярности корейской косметики встречаются и некачественные или неправильно хранившиеся товары. Простые правила снижают риск."],
        ["h", "Выбирайте надёжного продавца"],
        ["p", "Покупайте в официальном или проверенном интернет-магазине. Важно, чтобы у продавца были чёткий адрес, контактный номер, отзывы покупателей и условия возврата. Спрашивайте, откуда привезён товар."],
        ["h", "Проверяйте упаковку"],
        ["p", "Название бренда, состав и срок годности должны быть чётко напечатаны. Упаковка должна быть целой и запечатанной. Проверьте наличие номера партии (batch) и даты производства. Ошибки в тексте и размытая печать могут вызвать сомнения."],
        ["h", "Обращайте внимание на цену"],
        ["p", "Резко заниженная относительно рынка цена — повод насторожиться. Скидки возможны, но при очень большой разнице попросите у продавца объяснения."],
        ["h", "Хранение"],
        ["p", "Храните косметику вдали от солнца и тепла, в сухом месте. После вскрытия ориентируйтесь на значок срока использования (PAO) на упаковке."],
      ],
    },
  },
];

export const getArticle = (slug) => ARTICLES.find((a) => a.slug === slug) || null;
