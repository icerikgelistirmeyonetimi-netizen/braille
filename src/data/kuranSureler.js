// =============================================================================
// Kısa sureler — kelime kelime, ayet bilgisiyle birlikte braille hücreleri.
// Her kelime, KURAN_KELIMELERI ile aynı tokenleştirme (kuranKelime) ile yazılır.
// Tecvid (med, şedde, sükûn, tenvin) gerektiği yerde token olarak içerilir.
// =============================================================================
import { kuranKelime as k } from './kuran.js';

// Yardımcı: bir ayetteki tüm kelimeleri "Sure adı, Ayet n. — okunuş" anlamıyla
// bayrakla. Böylece CokHucreOkuyucu okuma sırasında ayet bilgisini gösterir.
function ayet(no, kelimeler) {
  return kelimeler.map((kw) => ({
    ...kw,
    anlam: `${no}. ayet${kw.anlam ? ' — ' + kw.anlam : ''}`
  }));
}

// Besmele (Fâtiha hariç tüm surelerin başında okunur)
const BESMELE = [
  k('بِسْمِ',    'bismi',    '“adıyla”',    'ب i س 0 م i'),
  k('اللّٰهِ',    'Allâhi',   '“Allah’ın”',  'ا ل ل ~ ه i'),
  k('الرَّحْمٰنِ', 'er-Rahmâni', '“Rahmân”',  'ا ل ر ~ a ح 0 م a ن i'),
  k('الرَّحِيمِ',  'er-Rahîm',   '“Rahîm”',    'ا ل ر ~ a ح i M م i')
];

// =============================================================================
// SURELER
// =============================================================================
export const KURAN_SURELERI = [
  // ---------------------------------------------------------------------------
  // 1) Fâtiha — 7 ayet
  // ---------------------------------------------------------------------------
  {
    no: 1,
    ad: 'Fâtiha',
    adAr: 'الفاتحة',
    ayetSayisi: 7,
    aciklama: 'Kur’an-ı Kerim’in açılış sûresi. Namazda her rekâtta okunur.',
    kelimeler: [
      ...ayet(1, [
        k('بِسْمِ',     'bismi',     '“adıyla”',          'ب i س 0 م i'),
        k('اللّٰهِ',     'Allâhi',    '“Allah’ın”',        'ا ل ل ~ ه i'),
        k('الرَّحْمٰنِ', 'er-Rahmâni','“Rahmân”',           'ا ل ر ~ a ح 0 م a ن i'),
        k('الرَّحِيمِ',  'er-Rahîm',  '“Rahîm”',            'ا ل ر ~ a ح i M م i')
      ]),
      ...ayet(2, [
        k('الْحَمْدُ',     'el-hamdü',     '“hamd / övgü”',         'ا ل 0 ح a م 0 د u'),
        k('لِلّٰهِ',         'lillâhi',      '“Allah’a aittir”',      'ل i ل ~ ه i'),
        k('رَبِّ',          'rabbi',        '“Rabbi”',                'ر a ب ~ i'),
        k('الْعَالَمِينَ',   'el-âlemîne',  '“âlemlerin”',            'ا ل 0 ع a ا ل a م i M ن a')
      ]),
      ...ayet(3, [
        k('الرَّحْمٰنِ',   'er-Rahmâni',   '“Rahmân”',  'ا ل ر ~ a ح 0 م a ن i'),
        k('الرَّحِيمِ',    'er-Rahîm',     '“Rahîm”',    'ا ل ر ~ a ح i M م i')
      ]),
      ...ayet(4, [
        k('مَالِكِ',     'mâliki',     '“sahibi”',         'م a ا ل i ك i'),
        k('يَوْمِ',      'yevmi',      '“günün”',           'ي a و 0 م i'),
        k('الدِّينِ',    'ed-dîn',     '“din / hesap”',     'ا ل د ~ i M ن i')
      ]),
      ...ayet(5, [
        k('إِيَّاكَ',     'iyyâke',     '“yalnız sana”',     'ا i ي ~ a ا ك a'),
        k('نَعْبُدُ',     'na‘büdü',    '“ibadet ederiz”',   'ن a ع 0 ب u د u'),
        k('وَإِيَّاكَ',   've-iyyâke',  '“ve yalnız senden”', 'و a ا i ي ~ a ا ك a'),
        k('نَسْتَعِينُ', 'nesta‘în',   '“yardım dileriz”',   'ن a س 0 ت a ع i M ن u')
      ]),
      ...ayet(6, [
        k('اهْدِنَا',     'ihdinâ',     '“bizi hidayete erdir”', 'ا 0 ه 0 د i ن a ا'),
        k('الصِّرَاطَ',   'es-sırâta',  '“yola”',                'ا ل ص ~ i ر a ا ط a'),
        k('الْمُسْتَقِيمَ','el-müstakîme','“dosdoğru”',           'ا ل 0 م u س 0 ت a ق i M م a')
      ]),
      ...ayet(7, [
        k('صِرَاطَ',     'sırâta',     '“yolu”',               'ص i ر a ا ط a'),
        k('الَّذِينَ',    'ellezîne',   '“o kimseler ki”',      'ا ل ~ a ذ i M ن a'),
        k('أَنْعَمْتَ',   'en‘amte',    '“nimet verdin”',       'ا a ن 0 ع a م 0 ت a'),
        k('عَلَيْهِمْ',   'aleyhim',    '“onlara”',             'ع a ل a ي 0 ه i م 0'),
        k('غَيْرِ',       'ğayri',      '“-in dışında”',       'غ a ي 0 ر i'),
        k('الْمَغْضُوبِ','el-mağdûbi','“gazaba uğramışların”','ا ل 0 م a غ 0 ض u M ب i'),
        k('عَلَيْهِمْ',   'aleyhim',    '“onlara”',             'ع a ل a ي 0 ه i م 0'),
        k('وَلَا',         'velâ',       '“ve değil”',          'و a ل a ا'),
        k('الضَّالِّينَ', 'ed-dâllîn', '“sapkınların”',        'ا ل ض ~ a ا ل ~ i M ن a')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 112) İhlâs — 4 ayet
  // ---------------------------------------------------------------------------
  {
    no: 112,
    ad: 'İhlâs',
    adAr: 'الإخلاص',
    ayetSayisi: 4,
    aciklama: 'Allah’ın birliğini ve eşi-benzeri olmadığını anlatır.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('قُلْ',     'kul',     '“De ki”',          'ق u ل 0'),
        k('هُوَ',     'hüve',    '“O”',              'ه u و a'),
        k('اللّٰهُ',   'Allâhü',  '“Allah”',          'ا ل ل ~ ه u'),
        k('أَحَدٌ',   'ehad',    '“tek / birdir”',  'ا a ح a د U')
      ]),
      ...ayet(2, [
        k('اللّٰهُ',     'Allâhü',     '“Allah”',     'ا ل ل ~ ه u'),
        k('الصَّمَدُ',  'es-Samedü',  '“Samed”',     'ا ل ص ~ a م a د u')
      ]),
      ...ayet(3, [
        k('لَمْ',      'lem',     '“-medi”',        'ل a م 0'),
        k('يَلِدْ',    'yelid',   '“doğurmadı”',    'ي a ل i د 0'),
        k('وَلَمْ',    'velem',   '“ve -medi”',     'و a ل a م 0'),
        k('يُولَدْ',   'yûled',   '“doğurulmadı”',  'ي u M ل a د 0')
      ]),
      ...ayet(4, [
        k('وَلَمْ',     'velem',    '“ve -medi”',          'و a ل a م 0'),
        k('يَكُنْ',     'yekün',    '“olmadı”',            'ي a ك u ن 0'),
        k('لَهُ',       'lehû',     '“onun için”',          'ل a ه u'),
        k('كُفُوًا',    'küfüven',  '“denk / eş”',         'ك u ف u و A ا'),
        k('أَحَدٌ',     'ehad',     '“hiçbir şey”',         'ا a ح a د U')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 113) Felak — 5 ayet
  // ---------------------------------------------------------------------------
  {
    no: 113,
    ad: 'Felak',
    adAr: 'الفلق',
    ayetSayisi: 5,
    aciklama: 'Karanlığın ve kötülüğün şerrinden Allah’a sığınma sûresi.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('قُلْ',     'kul',     '“De ki”',                'ق u ل 0'),
        k('أَعُوذُ',   'eûzü',   '“sığınırım”',            'ا a ع u M ذ u'),
        k('بِرَبِّ',   'bi-rabbi','“Rabbine”',              'ب i ر a ب ~ i'),
        k('الْفَلَقِ', 'el-felak','“sabahın / şafağın”',   'ا ل 0 ف a ل a ق i')
      ]),
      ...ayet(2, [
        k('مِنْ',      'min',      '“-den”',                  'م i ن 0'),
        k('شَرِّ',     'şerri',    '“kötülüğünden”',          'ش a ر ~ i'),
        k('مَا',       'mâ',       '“şey”',                   'م a ا'),
        k('خَلَقَ',    'halaka',   '“yarattı”',               'خ a ل a ق a')
      ]),
      ...ayet(3, [
        k('وَمِنْ',    'vemin',    '“ve -den”',               'و a م i ن 0'),
        k('شَرِّ',     'şerri',    '“kötülüğünden”',          'ش a ر ~ i'),
        k('غَاسِقٍ',   'ğâsikın',  '“karanlık çöktüğünde”',   'غ a ا س i ق I'),
        k('إِذَا',     'izâ',      '“-dığı zaman”',           'ا i ذ a ا'),
        k('وَقَبَ',    'vekabe',   '“çöktüğünde”',            'و a ق a ب a')
      ]),
      ...ayet(4, [
        k('وَمِنْ',         'vemin',         '“ve -den”',                 'و a م i ن 0'),
        k('شَرِّ',          'şerri',         '“kötülüğünden”',            'ش a ر ~ i'),
        k('النَّفَّاثَاتِ', 'en-neffâsâti', '“üfleyenlerin”',            'ا ل ن ~ a ف ~ a ا ث a ا ت i'),
        k('فِي',            'fî',            '“içinde”',                  'ف i ي'),
        k('الْعُقَدِ',      'el-ukad',       '“düğümlerin”',              'ا ل 0 ع u ق a د i')
      ]),
      ...ayet(5, [
        k('وَمِنْ',     'vemin',     '“ve -den”',                'و a م i ن 0'),
        k('شَرِّ',      'şerri',     '“kötülüğünden”',           'ش a ر ~ i'),
        k('حَاسِدٍ',    'hâsidin',   '“hasetçinin”',             'ح a ا س i د I'),
        k('إِذَا',      'izâ',       '“-dığı zaman”',            'ا i ذ a ا'),
        k('حَسَدَ',     'hasede',    '“haset etti”',             'ح a س a د a')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 114) Nâs — 6 ayet
  // ---------------------------------------------------------------------------
  {
    no: 114,
    ad: 'Nâs',
    adAr: 'الناس',
    ayetSayisi: 6,
    aciklama: 'İnsanların Rabbine, Melikine, ilahına sığınma sûresi.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('قُلْ',     'kul',     '“De ki”',         'ق u ل 0'),
        k('أَعُوذُ',   'eûzü',   '“sığınırım”',     'ا a ع u M ذ u'),
        k('بِرَبِّ',   'bi-rabbi','“Rabbine”',       'ب i ر a ب ~ i'),
        k('النَّاسِ',  'en-nâsi','“insanların”',    'ا ل ن ~ a ا س i')
      ]),
      ...ayet(2, [
        k('مَلِكِ',    'meliki',    '“hükümdarına”',  'م a ل i ك i'),
        k('النَّاسِ',  'en-nâsi',   '“insanların”',   'ا ل ن ~ a ا س i')
      ]),
      ...ayet(3, [
        k('إِلٰهِ',     'ilâhi',     '“ilahına”',      'ا i ل a ه i'),
        k('النَّاسِ',  'en-nâsi',   '“insanların”',   'ا ل ن ~ a ا س i')
      ]),
      ...ayet(4, [
        k('مِنْ',          'min',          '“-den”',                'م i ن 0'),
        k('شَرِّ',         'şerri',        '“kötülüğünden”',        'ش a ر ~ i'),
        k('الْوَسْوَاسِ', 'el-vesvâsi',  '“vesveseci”',           'ا ل 0 و a س 0 و a ا س i'),
        k('الْخَنَّاسِ',  'el-hannâsi',  '“sinsi”',                'ا ل 0 خ a ن ~ a ا س i')
      ]),
      ...ayet(5, [
        k('الَّذِي',       'ellezî',       '“o ki”',                 'ا ل ~ a ذ i M'),
        k('يُوَسْوِسُ',   'yüvesvisü',   '“vesvese verir”',        'ي u و a س 0 و i س u'),
        k('فِي',           'fî',           '“içinde”',               'ف i ي'),
        k('صُدُورِ',       'sudûri',      '“göğüslerinde”',         'ص u د u M ر i'),
        k('النَّاسِ',     'en-nâsi',     '“insanların”',           'ا ل ن ~ a ا س i')
      ]),
      ...ayet(6, [
        k('مِنَ',          'mine',         '“-den”',                 'م i ن a'),
        k('الْجِنَّةِ',   'el-cinneti',  '“cinler”',               'ا ل 0 ج i ن ~ a ة i'),
        k('وَالنَّاسِ',   've-n-nâsi',   '“ve insanlar”',          'و a ا ل ن ~ a ا س i')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 108) Kevser — 3 ayet
  // ---------------------------------------------------------------------------
  {
    no: 108,
    ad: 'Kevser',
    adAr: 'الكوثر',
    ayetSayisi: 3,
    aciklama: 'Peygamber Efendimize Kevser’in verildiğinin müjdesi.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('إِنَّا',         'innâ',         '“muhakkak ki biz”',  'ا i ن ~ a ا'),
        k('أَعْطَيْنَاكَ',  'a‘taynâke',  '“sana verdik”',      'ا a ع 0 ط a ي 0 ن a ا ك a'),
        k('الْكَوْثَرَ',    'el-Kevsera',  '“Kevser’i”',          'ا ل 0 ك a و 0 ث a ر a')
      ]),
      ...ayet(2, [
        k('فَصَلِّ',        'fesalli',     '“öyleyse namaz kıl”', 'ف a ص a ل ~ i'),
        k('لِرَبِّكَ',      'li-rabbike',  '“Rabbin için”',       'ل i ر a ب ~ i ك a'),
        k('وَانْحَرْ',     've-nhar',     '“ve kurban kes”',     'و a ا 0 ن 0 ح a ر 0')
      ]),
      ...ayet(3, [
        k('إِنَّ',         'inne',        '“muhakkak ki”',       'ا i ن ~ a'),
        k('شَانِئَكَ',    'şâni’eke',   '“sana kin tutan”',    'ش a ا ن i ء a ك a'),
        k('هُوَ',          'hüve',        '“o”',                  'ه u و a'),
        k('الْأَبْتَرُ',   'el-ebter',   '“soyu kesik olandır”','ا ل 0 ا a ب 0 ت a ر u')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 103) Asr — 3 ayet
  // ---------------------------------------------------------------------------
  {
    no: 103,
    ad: 'Asr',
    adAr: 'العصر',
    ayetSayisi: 3,
    aciklama: 'Zamana yemin ile insanın ziyanda olduğunu bildirir.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('وَالْعَصْرِ', 've-l-asri', '“asra yemin olsun”', 'و a ا ل 0 ع a ص 0 ر i')
      ]),
      ...ayet(2, [
        k('إِنَّ',         'inne',         '“muhakkak ki”',     'ا i ن ~ a'),
        k('الْإِنْسَانَ', 'el-insâne',   '“insan”',           'ا ل 0 ا i ن 0 س a ا ن a'),
        k('لَفِي',        'lefî',         '“gerçekten içindedir”', 'ل a ف i M'),
        k('خُسْرٍ',       'husrin',       '“ziyan”',           'خ u س 0 ر I')
      ]),
      ...ayet(3, [
        k('إِلَّا',           'illâ',          '“ancak”',            'ا i ل ~ a ا'),
        k('الَّذِينَ',        'ellezîne',     '“o kimseler ki”',    'ا ل ~ a ذ i M ن a'),
        k('آمَنُوا',          'âmenû',        '“iman ettiler”',     'ا M م a ن u M ا'),
        k('وَعَمِلُوا',       've-amilû',     '“ve iş işlediler”',   'و a ع a م i ل u M ا'),
        k('الصَّالِحَاتِ',   'es-sâlihâti', '“salih ameller”',     'ا ل ص ~ a ا ل i ح a ا ت i'),
        k('وَتَوَاصَوْا',    've-tevâsav',  '“ve tavsiyeleştiler”', 'و a ت a و a ا ص a و 0 ا'),
        k('بِالْحَقِّ',       'bi-l-hakkı',  '“hak ile”',           'ب i ا ل 0 ح a ق ~ i'),
        k('وَتَوَاصَوْا',    've-tevâsav',  '“ve tavsiyeleştiler”', 'و a ت a و a ا ص a و 0 ا'),
        k('بِالصَّبْرِ',     'bi-s-sabri',  '“sabır ile”',         'ب i ا ل ص ~ a ب 0 ر i')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 110) Nasr — 3 ayet
  // ---------------------------------------------------------------------------
  {
    no: 110,
    ad: 'Nasr',
    adAr: 'النصر',
    ayetSayisi: 3,
    aciklama: 'Allah’ın yardımı ve fethin müjdesi.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('إِذَا',     'izâ',     '“-dığı zaman”',     'ا i ذ a ا'),
        k('جَاءَ',     'câe',     '“geldi”',            'ج a ا ء a'),
        k('نَصْرُ',    'nasru',   '“yardımı”',          'ن a ص 0 ر u'),
        k('اللّٰهِ',    'Allâhi',  '“Allah’ın”',        'ا ل ل ~ ه i'),
        k('وَالْفَتْحُ', 've-l-fethu', '“ve fetih”',     'و a ا ل 0 ف a ت 0 ح u')
      ]),
      ...ayet(2, [
        k('وَرَأَيْتَ',     've-reeyte',     '“ve gördüğünde”',  'و a ر a ا a ي 0 ت a'),
        k('النَّاسَ',       'en-nâse',       '“insanları”',     'ا ل ن ~ a ا س a'),
        k('يَدْخُلُونَ',    'yedhulûne',    '“girerlerken”',    'ي a د 0 خ u ل u M ن a'),
        k('فِي',            'fî',            '“-e”',             'ف i ي'),
        k('دِينِ',          'dîni',         '“dinine”',         'د i M ن i'),
        k('اللّٰهِ',         'Allâhi',       '“Allah’ın”',      'ا ل ل ~ ه i'),
        k('أَفْوَاجًا',     'efvâcen',      '“bölük bölük”',    'ا a ف 0 و a ا ج A ا')
      ]),
      ...ayet(3, [
        k('فَسَبِّحْ',           'fesebbih',          '“tesbih et”',           'ف a س a ب ~ i ح 0'),
        k('بِحَمْدِ',           'bi-hamdi',          '“hamd ile”',            'ب i ح a م 0 د i'),
        k('رَبِّكَ',            'rabbike',           '“Rabbinin”',            'ر a ب ~ i ك a'),
        k('وَاسْتَغْفِرْهُ',    've-stağfirhü',     '“ve O’ndan af dile”',   'و a ا 0 س 0 ت a غ 0 ف i ر 0 ه u'),
        k('إِنَّهُ',            'innehû',            '“muhakkak ki O”',        'ا i ن ~ a ه u'),
        k('كَانَ',              'kâne',              '“idi”',                 'ك a ا ن a'),
        k('تَوَّابًا',          'tevvâben',          '“tevbeleri kabul edici”','ت a و ~ a ا ب A ا')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 109) Kâfirûn — 6 ayet
  // ---------------------------------------------------------------------------
  {
    no: 109,
    ad: 'Kâfirûn',
    adAr: 'الكافرون',
    ayetSayisi: 6,
    aciklama: 'Tevhid ve dinin korunması üzerine inkârcılara cevap.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('قُلْ',         'kul',           '“De ki”',         'ق u ل 0'),
        k('يَا',          'yâ',            '“ey”',            'ي a ا'),
        k('أَيُّهَا',     'eyyühâ',        '“ey siz”',        'ا a ي ~ u ه a ا'),
        k('الْكَافِرُونَ', 'el-kâfirûne', '“kâfirler”',      'ا ل 0 ك a ا ف i ر u M ن a')
      ]),
      ...ayet(2, [
        k('لَا',           'lâ',           '“-mam”',          'ل a ا'),
        k('أَعْبُدُ',     'a‘büdü',       '“ibadet ederim”', 'ا a ع 0 ب u د u'),
        k('مَا',           'mâ',           '“şeye”',          'م a ا'),
        k('تَعْبُدُونَ',   'ta‘büdûne',  '“ibadet ettiğiniz”', 'ت a ع 0 ب u د u M ن a')
      ]),
      ...ayet(3, [
        k('وَلَا',          'velâ',          '“ve -mazsınız”', 'و a ل a ا'),
        k('أَنْتُمْ',       'entüm',         '“sizler”',       'ا a ن 0 ت u م 0'),
        k('عَابِدُونَ',    'âbidûne',      '“ibadet ediciler”','ع a ا ب i د u M ن a'),
        k('مَا',            'mâ',            '“şeye”',         'م a ا'),
        k('أَعْبُدُ',      'a‘büdü',        '“ibadet ettiğim”','ا a ع 0 ب u د u')
      ]),
      ...ayet(4, [
        k('وَلَا',         'velâ',         '“ve -mam”',         'و a ل a ا'),
        k('أَنَا',         'enâ',          '“ben”',             'ا a ن a ا'),
        k('عَابِدٌ',      'âbidün',       '“ibadet edici”',    'ع a ا ب i د U'),
        k('مَا',           'mâ',           '“şeye”',            'م a ا'),
        k('عَبَدْتُمْ',    'abedtüm',     '“ibadet ettiğiniz”','ع a ب a د 0 ت u م 0')
      ]),
      ...ayet(5, [
        k('وَلَا',          'velâ',          '“ve -mazsınız”', 'و a ل a ا'),
        k('أَنْتُمْ',       'entüm',         '“sizler”',       'ا a ن 0 ت u م 0'),
        k('عَابِدُونَ',    'âbidûne',      '“ibadet ediciler”','ع a ا ب i د u M ن a'),
        k('مَا',            'mâ',            '“şeye”',         'م a ا'),
        k('أَعْبُدُ',      'a‘büdü',        '“ibadet ettiğim”','ا a ع 0 ب u د u')
      ]),
      ...ayet(6, [
        k('لَكُمْ',     'leküm',     '“sizin için”',   'ل a ك u م 0'),
        k('دِينُكُمْ', 'dîneküm',   '“sizin dininiz”', 'د i M ن u ك u م 0'),
        k('وَلِيَ',    'veliye',    '“ve benim için”', 'و a ل i ي a'),
        k('دِينِ',     'dîni',      '“benim dinim”',   'د i M ن i')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 105) Fil — 5 ayet
  // ---------------------------------------------------------------------------
  {
    no: 105,
    ad: 'Fil',
    adAr: 'الفيل',
    ayetSayisi: 5,
    aciklama: 'Ka‘be’yi yıkmaya gelen Ebrehe ordusunun helak edilişi.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('أَلَمْ',       'elem',       '“görmedin mi?”',     'ا a ل a م 0'),
        k('تَرَ',         'tera',       '“gördüğünü”',         'ت a ر a'),
        k('كَيْفَ',       'keyfe',      '“nasıl”',             'ك a ي 0 ف a'),
        k('فَعَلَ',       'feale',      '“yaptığını”',         'ف a ع a ل a'),
        k('رَبُّكَ',      'rabbüke',    '“Rabbinin”',          'ر a ب ~ u ك a'),
        k('بِأَصْحَابِ',  'bi-eshâbi','“sahiplerine”',         'ب i ا a ص 0 ح a ا ب i'),
        k('الْفِيلِ',    'el-fîli',    '“fil”',                'ا ل 0 ف i M ل i')
      ]),
      ...ayet(2, [
        k('أَلَمْ',         'elem',         '“-medi mi?”',          'ا a ل a م 0'),
        k('يَجْعَلْ',       'yec‘al',      '“kıldı”',              'ي a ج 0 ع a ل 0'),
        k('كَيْدَهُمْ',     'keydehüm',    '“tuzaklarını”',        'ك a ي 0 د a ه u م 0'),
        k('فِي',            'fî',           '“içinde”',             'ف i ي'),
        k('تَضْلِيلٍ',     'tadlîlin',    '“boşa çıkarma”',        'ت a ض 0 ل i M ل I')
      ]),
      ...ayet(3, [
        k('وَأَرْسَلَ',     've-ersele',    '“ve gönderdi”',       'و a ا a ر 0 س a ل a'),
        k('عَلَيْهِمْ',     'aleyhim',     '“onların üzerine”',   'ع a ل a ي 0 ه i م 0'),
        k('طَيْرًا',        'tayren',      '“kuşlar”',            'ط a ي 0 ر A ا'),
        k('أَبَابِيلَ',    'ebâbîle',    '“sürü sürü”',          'ا a ب a ا ب i M ل a')
      ]),
      ...ayet(4, [
        k('تَرْمِيهِمْ',    'termîhim',    '“onları atıyordu”',  'ت a ر 0 م i M ه i م 0'),
        k('بِحِجَارَةٍ',   'bi-hicâretin', '“taşlarla”',         'ب i ح i ج a ا ر a ة I'),
        k('مِنْ',            'min',          '“-den”',             'م i ن 0'),
        k('سِجِّيلٍ',      'siccîlin',    '“pişirilmiş çamur”',  'س i ج ~ i M ل I')
      ]),
      ...ayet(5, [
        k('فَجَعَلَهُمْ',  'fece‘alehüm','“onları kıldı”',          'ف a ج a ع a ل a ه u م 0'),
        k('كَعَصْفٍ',     'ke-asfin',   '“ekin yaprağı gibi”',     'ك a ع a ص 0 ف I'),
        k('مَأْكُولٍ',    'me’kûlin',  '“yenilmiş”',               'م a ا 0 ك u M ل I')
      ])
    ]
  },

  // ---------------------------------------------------------------------------
  // 106) Kureyş — 4 ayet
  // ---------------------------------------------------------------------------
  {
    no: 106,
    ad: 'Kureyş',
    adAr: 'قريش',
    ayetSayisi: 4,
    aciklama: 'Kureyş’e verilen güvenlik ve rızık nimetlerinin hatırlatılması.',
    kelimeler: [
      ...ayet(0, BESMELE),
      ...ayet(1, [
        k('لِإِيلَافِ',   'li-îlâfi',   '“ülfet etmesi için”', 'ل i ا i M ل a ا ف i'),
        k('قُرَيْشٍ',     'Kureyşin',   '“Kureyş’in”',         'ق u ر a ي 0 ش I')
      ]),
      ...ayet(2, [
        k('إِيلَافِهِمْ',   'îlâfihim',   '“onların ülfeti”',  'ا i M ل a ا ف i ه i م 0'),
        k('رِحْلَةَ',      'rıhlete',    '“yolculuğu”',        'ر i ح 0 ل a ة a'),
        k('الشِّتَاءِ',   'eş-şitâi',  '“kışın”',              'ا ل ش ~ i ت a ا ء i'),
        k('وَالصَّيْفِ',  've-s-sayfi','“ve yazın”',           'و a ا ل ص ~ a ي 0 ف i')
      ]),
      ...ayet(3, [
        k('فَلْيَعْبُدُوا', 'felya‘büdû', '“öyleyse ibadet etsinler”', 'ف a ل 0 ي a ع 0 ب u د u M ا'),
        k('رَبَّ',         'rabbe',      '“Rabbi”',                   'ر a ب ~ a'),
        k('هَٰذَا',        'hâzâ',       '“bu”',                       'ه a ذ a ا'),
        k('الْبَيْتِ',     'el-beyti',   '“ev / Ka‘be”',              'ا ل 0 ب a ي 0 ت i')
      ]),
      ...ayet(4, [
        k('الَّذِي',         'ellezî',         '“o ki”',                'ا ل ~ a ذ i M'),
        k('أَطْعَمَهُمْ',   'at‘amehüm',     '“onları doyurdu”',       'ا a ط 0 ع a م a ه u م 0'),
        k('مِنْ',            'min',            '“-den”',                'م i ن 0'),
        k('جُوعٍ',          'cû‘in',         '“açlık”',                'ج u M ع I'),
        k('وَآمَنَهُمْ',    've-âmenehüm',  '“ve onları emin kıldı”', 'و a ا M م a ن a ه u م 0'),
        k('مِنْ',            'min',            '“-den”',                'م i ن 0'),
        k('خَوْفٍ',         'havfin',        '“korku”',                'خ a و 0 ف I')
      ])
    ]
  }
];
