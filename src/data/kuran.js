// =============================================================================
// MEB Kur'an-ı Kerim Braille Yazı Kılavuzu — Modül 5 verileri.
// -----------------------------------------------------------------------------
// Burada yer alan harf, hareke ve tecvid işaretlerinin braille nokta karşılıkları
// "Birleştirilmiş Arap Braille (Unified Arabic Braille / UAB)" kodu ve MEB
// Kur'an-ı Kerim Braille kılavuzu esas alınarak hazırlanmıştır. Tecvid
// işaretlerinin bazıları kılavuz baskılarına göre değişebilir; uygulama
// içindeki değerler kılavuzla karşılaştırılarak doğrulanmalıdır.
// =============================================================================

// ----------------------------------------------------------------------------
// 28 Arap harfi + sık kullanılan ek harfler (hemze, te marbuta, elif maksure)
// ----------------------------------------------------------------------------
export const KURAN_HARFLERI = [
  { harf: 'ا', ad: 'elif',         okunus: 'a',    noktalar: [1] },
  { harf: 'ب', ad: 'ba',           okunus: 'be',   noktalar: [1, 2] },
  { harf: 'ت', ad: 'te',           okunus: 'te',   noktalar: [2, 3, 4, 5] },
  { harf: 'ث', ad: 'se',           okunus: 'se',   noktalar: [1, 4, 5, 6] },
  { harf: 'ج', ad: 'cim',          okunus: 'cim',  noktalar: [2, 4, 5] },
  { harf: 'ح', ad: 'ha',           okunus: 'ha',   noktalar: [1, 5, 6] },
  { harf: 'خ', ad: 'hı',           okunus: 'hı',   noktalar: [1, 3, 4, 6] },
  { harf: 'د', ad: 'dal',          okunus: 'dal',  noktalar: [1, 4, 5] },
  { harf: 'ذ', ad: 'zel',          okunus: 'zel',  noktalar: [2, 3, 4, 6] },
  { harf: 'ر', ad: 'ra',           okunus: 'ra',   noktalar: [1, 2, 3, 5] },
  { harf: 'ز', ad: 'ze',           okunus: 'ze',   noktalar: [1, 3, 5, 6] },
  { harf: 'س', ad: 'sin',          okunus: 'sin',  noktalar: [2, 3, 4] },
  { harf: 'ش', ad: 'şın',          okunus: 'şın',  noktalar: [1, 4, 6] },
  { harf: 'ص', ad: 'sad',          okunus: 'sad',  noktalar: [1, 2, 3, 4, 6] },
  { harf: 'ض', ad: 'dad',          okunus: 'dad',  noktalar: [1, 2, 4, 5] },
  { harf: 'ط', ad: 'tı',           okunus: 'tı',   noktalar: [2, 3, 4, 5, 6] },
  { harf: 'ظ', ad: 'zı',           okunus: 'zı',   noktalar: [1, 2, 3, 4, 5, 6] },
  { harf: 'ع', ad: 'ayn',          okunus: 'ayn',  noktalar: [1, 2, 3, 5, 6] },
  { harf: 'غ', ad: 'gayn',         okunus: 'gayn', noktalar: [1, 2, 6] },
  { harf: 'ف', ad: 'fe',           okunus: 'fe',   noktalar: [1, 2, 4] },
  { harf: 'ق', ad: 'kaf',          okunus: 'kaf',  noktalar: [1, 2, 3, 4, 5] },
  { harf: 'ك', ad: 'kef',          okunus: 'kef',  noktalar: [1, 3] },
  { harf: 'ل', ad: 'lam',          okunus: 'lam',  noktalar: [1, 2, 3] },
  { harf: 'م', ad: 'mim',          okunus: 'mim',  noktalar: [1, 3, 4] },
  { harf: 'ن', ad: 'nun',          okunus: 'nun',  noktalar: [1, 3, 4, 5] },
  { harf: 'ه', ad: 'he',           okunus: 'he',   noktalar: [1, 2, 5] },
  { harf: 'و', ad: 'vav',          okunus: 'vav',  noktalar: [2, 4, 5, 6] },
  { harf: 'ي', ad: 'ye',           okunus: 'ye',   noktalar: [2, 4] },
  // Ek/özel harfler
  { harf: 'ء', ad: 'hemze',        okunus: 'hemze',     noktalar: [3] },
  { harf: 'ة', ad: 'te marbuta',   okunus: 'te marbuta', noktalar: [1, 6] },
  { harf: 'ى', ad: 'elif maksure', okunus: 'elif maksure', noktalar: [3, 4, 6] }
];

// ----------------------------------------------------------------------------
// Harekeler — Kur'an braillesi'nde harekeler ilgili harften SONRA ayrı bir
// braille hücresi olarak yazılır. Aşağıdaki nokta karşılıkları MEB Kur'an
// Braille kılavuzunda kullanılan UAB değerleridir.
// ----------------------------------------------------------------------------
export const KURAN_HAREKELERI = [
  {
    isaret: 'َ', ad: 'fetha', okunus: 'üstün',
    noktalar: [3, 5],
    aciklama: 'Harfin üstüne konur, harfi e/a sesiyle okutur. Braillede harften sonra yazılır.'
  },
  {
    isaret: 'ِ', ad: 'kesra', okunus: 'esre',
    noktalar: [2, 6],
    aciklama: 'Harfin altına konur, harfi i sesiyle okutur. Braillede harften sonra yazılır.'
  },
  {
    isaret: 'ُ', ad: 'damme', okunus: 'ötre',
    noktalar: [1, 3, 6],
    aciklama: 'Harfin üstüne konur, harfi u/ü sesiyle okutur. Braillede harften sonra yazılır.'
  },
  {
    isaret: 'ْ', ad: 'sükûn', okunus: 'cezim',
    noktalar: [4],
    aciklama: 'Harfin üstüne konur, harfin sessiz okunduğunu gösterir. Cezimli harf hece sonu olur.'
  },
  {
    isaret: 'ّ', ad: 'şedde', okunus: 'şedde',
    noktalar: [6],
    aciklama: 'Harfin üstüne konur, harfin iki defa (vurgulu) okunduğunu gösterir.'
  },
  {
    isaret: 'ً', ad: 'fethatan', okunus: 'iki üstün',
    noktalar: [2, 3, 5, 6],
    aciklama: 'Tenvinli fetha. "an / en" sesi verir; kelime sonunda kullanılır.'
  },
  {
    isaret: 'ٍ', ad: 'kesratan', okunus: 'iki esre',
    noktalar: [2, 3, 5],
    aciklama: 'Tenvinli kesra. "in" sesi verir; kelime sonunda kullanılır.'
  },
  {
    isaret: 'ٌ', ad: 'dammetan', okunus: 'iki ötre',
    noktalar: [1, 2, 5, 6],
    aciklama: 'Tenvinli damme. "un / ün" sesi verir; kelime sonunda kullanılır.'
  }
];

// ----------------------------------------------------------------------------
// Tecvid işaretleri — Kur'an braillesi'nde sık kullanılan temel işaretler.
// Her biri bir veya iki braille hücresinden oluşur. Daha ayrıntılı tecvid
// işaretleri (tilavet secdeleri, durak işaretleri vs.) MEB kılavuzundan
// eklenebilir.
// ----------------------------------------------------------------------------
export const KURAN_TECVID = [
  {
    ad: 'Med (Uzatma) İşareti',
    sembol: 'ٓ',
    hucreler: [[2, 5]],
    aciklama: 'Üstündeki harfin uzatılarak okunmasını gösterir. Tabii medde göre ses 2-5 elif miktarı uzatılır.'
  },
  {
    ad: 'Vasl (Birleştirme) İşareti',
    sembol: 'ٱ',
    hucreler: [[3, 4]],
    aciklama: 'Kelime başındaki elifin geçişle okunmadığını, önceki kelimeye birleşerek okunduğunu gösterir.'
  },
  {
    ad: 'Vakf-ı Lâzım (Mim)',
    sembol: 'مـ',
    hucreler: [[5], [1, 3, 4]],
    aciklama: 'Mutlaka durulması gereken yer. Geçilmesi caiz değildir.'
  },
  {
    ad: 'Vakf-ı Câiz (Cim)',
    sembol: 'جـ',
    hucreler: [[5], [2, 4, 5]],
    aciklama: 'Hem durulması hem geçilmesi caiz olan yer.'
  },
  {
    ad: 'Vakf-ı Mücevvez (Z)',
    sembol: 'زـ',
    hucreler: [[5], [1, 3, 5, 6]],
    aciklama: 'Durulması da geçilmesi de caiz; geçilmesi daha güzel olan yer.'
  },
  {
    ad: 'Vakf-ı Murahhas (Sad)',
    sembol: 'صـ',
    hucreler: [[5], [1, 2, 3, 4, 6]],
    aciklama: 'Mana tamam olmadığı için durulmaması, geçilmesi tercih edilen yer.'
  },
  {
    ad: 'Vakf-ı Mu‘ânaka (Üç Nokta)',
    sembol: '∴ ∴',
    hucreler: [[2, 5, 6], [2, 5, 6]],
    aciklama: 'İki taraftan birinde durulur, diğerinde durulmaz. Her iki noktada birden durulmaz.'
  }
];

// ----------------------------------------------------------------------------
// Hece okuma örnekleri — bir harf + bir hareke iki ayrı braille hücresinde.
// Kur'an braillesi öğretiminde "harekeyi tanıma" ve "hece çözümleme" için.
// ----------------------------------------------------------------------------
export const KURAN_HECELERI = [
  // BA hecesi serisi
  { yazi: 'بَ', okunus: 'be', harf: 'ب', hareke: 'fetha', hucreler: [[1, 2], [3, 5]] },
  { yazi: 'بِ', okunus: 'bi', harf: 'ب', hareke: 'kesra', hucreler: [[1, 2], [2, 6]] },
  { yazi: 'بُ', okunus: 'bu', harf: 'ب', hareke: 'damme', hucreler: [[1, 2], [1, 3, 6]] },
  // TE hecesi serisi
  { yazi: 'تَ', okunus: 'te', harf: 'ت', hareke: 'fetha', hucreler: [[2, 3, 4, 5], [3, 5]] },
  { yazi: 'تِ', okunus: 'ti', harf: 'ت', hareke: 'kesra', hucreler: [[2, 3, 4, 5], [2, 6]] },
  { yazi: 'تُ', okunus: 'tü', harf: 'ت', hareke: 'damme', hucreler: [[2, 3, 4, 5], [1, 3, 6]] },
  // SİN hecesi serisi
  { yazi: 'سَ', okunus: 'se', harf: 'س', hareke: 'fetha', hucreler: [[2, 3, 4], [3, 5]] },
  { yazi: 'سِ', okunus: 'si', harf: 'س', hareke: 'kesra', hucreler: [[2, 3, 4], [2, 6]] },
  { yazi: 'سُ', okunus: 'sü', harf: 'س', hareke: 'damme', hucreler: [[2, 3, 4], [1, 3, 6]] },
  // MİM hecesi serisi
  { yazi: 'مَ', okunus: 'me', harf: 'م', hareke: 'fetha', hucreler: [[1, 3, 4], [3, 5]] },
  { yazi: 'مِ', okunus: 'mi', harf: 'م', hareke: 'kesra', hucreler: [[1, 3, 4], [2, 6]] },
  { yazi: 'مُ', okunus: 'mü', harf: 'م', hareke: 'damme', hucreler: [[1, 3, 4], [1, 3, 6]] },
  // NUN hecesi serisi
  { yazi: 'نَ', okunus: 'ne', harf: 'ن', hareke: 'fetha', hucreler: [[1, 3, 4, 5], [3, 5]] },
  { yazi: 'نِ', okunus: 'ni', harf: 'ن', hareke: 'kesra', hucreler: [[1, 3, 4, 5], [2, 6]] },
  { yazi: 'نُ', okunus: 'nü', harf: 'ن', hareke: 'damme', hucreler: [[1, 3, 4, 5], [1, 3, 6]] }
];

// ----------------------------------------------------------------------------
// Kelime okuma örnekleri — birden çok harf + harekeyle yazılmış kısa kelimeler.
// Her kelime, sırayla yazıldığı gibi braille hücreleri dizisidir.
//
// Hücreler `k(yazi, okunus, anlam, kod)` yardımcısıyla "token" formatından
// üretilir. Token formatı:
//   - Arap harfi karakterleri (ا ب ت ...) = harf hücresi
//   - 'a' = fetha, 'i' = kesra, 'u' = damme,
//     'A' = fethatan, 'I' = kesratan, 'U' = dammetan,
//     '0' = sükûn (cezim), '~' = şedde,
//     'M' = med (uzatma) işareti.
// Her token tek bir braille hücresine karşılık gelir; tokenlar boşlukla ayrılır.
// ----------------------------------------------------------------------------
const KELIME_TOKEN = {
  // Arap harfleri (KURAN_HARFLERI ile aynı noktalar)
  'ا': [1],
  'ب': [1, 2],
  'ت': [2, 3, 4, 5],
  'ث': [1, 4, 5, 6],
  'ج': [2, 4, 5],
  'ح': [1, 5, 6],
  'خ': [1, 3, 4, 6],
  'د': [1, 4, 5],
  'ذ': [2, 3, 4, 6],
  'ر': [1, 2, 3, 5],
  'ز': [1, 3, 5, 6],
  'س': [2, 3, 4],
  'ش': [1, 4, 6],
  'ص': [1, 2, 3, 4, 6],
  'ض': [1, 2, 4, 5],
  'ط': [2, 3, 4, 5, 6],
  'ظ': [1, 2, 3, 4, 5, 6],
  'ع': [1, 2, 3, 5, 6],
  'غ': [1, 2, 6],
  'ف': [1, 2, 4],
  'ق': [1, 2, 3, 4, 5],
  'ك': [1, 3],
  'ل': [1, 2, 3],
  'م': [1, 3, 4],
  'ن': [1, 3, 4, 5],
  'ه': [1, 2, 5],
  'و': [2, 4, 5, 6],
  'ي': [2, 4],
  'ء': [3],
  'ة': [1, 6],
  'ى': [3, 4, 6],
  // Harekeler ve özel işaretler
  a: [3, 5],
  i: [2, 6],
  u: [1, 3, 6],
  A: [2, 3, 5, 6],
  I: [2, 3, 5],
  U: [1, 2, 5, 6],
  '0': [4],
  '~': [6],
  M: [2, 5]
};

export const KURAN_KELIME_TOKEN = KELIME_TOKEN;

export function kuranKelime(yazi, okunus, anlam, kod) {
  return k(yazi, okunus, anlam, kod);
}

function k(yazi, okunus, anlam, kod) {
  const hucreler = kod.trim().split(/\s+/).map((tok) => {
    const v = KELIME_TOKEN[tok];
    if (!v) {
      // Geliştirme aşamasında uyarı ver, ama uygulama çökmesin
      console.warn('[KURAN_KELIMELERI] Bilinmeyen token:', tok, 'kelime:', yazi);
      return [];
    }
    return v;
  });
  return { yazi, okunus, anlam, hucreler };
}

export const KURAN_KELIMELERI = [
  // ===========================================================================
  // Besmele ve sık geçen genel kelimeler
  // ===========================================================================
  k('بِسْمِ',     'bismi',  '“adıyla”',           'ب i س 0 م i'),
  k('اللّٰهِ',     'Allâhi', '“Allah’ın”',         'ا ل ل ~ ه i'),
  k('رَبِّ',      'rabbi',  '“Rabbi”',            'ر a ب ~ i'),
  k('الرَّحْمٰنِ', 'er-Rahmân', '“Rahmân”',        'ا ل ر ~ a ح 0 م a ن i'),
  k('الرَّحِيمِ',  'er-Rahîm',  '“Rahîm”',         'ا ل ر ~ a ح i M م i'),
  k('قُلْ',       'kul',    '“De ki”',            'ق u ل 0'),
  k('هُوَ',       'hüve',   '“O”',                'ه u و a'),
  k('لَا',        'lâ',     '“yok / değil”',      'ل a ا'),
  k('مَنْ',       'men',    '“kim”',              'م a ن 0'),
  k('فِي',       'fî',     '“içinde”',            'ف i ي'),
  k('مِنْ',       'min',    '“-den / -dan”',       'م i ن 0'),
  k('إِلَى',      'ilâ',    '“-e doğru”',          'ا i ل a ى'),
  k('عَلَى',      'alâ',    '“üzerine”',           'ع a ل a ى'),
  k('وَ',        've',     '“ve”',                'و a'),
  k('أَوْ',       'ev',     '“veya”',              'ا a و 0'),
  k('إِنَّ',      'inne',   '“muhakkak ki”',       'ا i ن ~ a'),
  k('أَنْتَ',     'ente',   '“sen”',               'ا a ن 0 ت a'),
  k('نَحْنُ',     'nahnü',  '“biz”',               'ن a ح 0 ن u'),
  k('ذٰلِكَ',     'zâlike', '“şu / bu”',           'ذ a ل i ك a'),
  k('هٰذَا',      'hâzâ',   '“bu”',                'ه a ذ a ا'),

  // ===========================================================================
  // Fâtiha Sûresi (1) — 7 ayet
  // ===========================================================================
  k('الْحَمْدُ',  'el-hamdü', '“Hamd / övgü”',     'ا ل 0 ح a م 0 د u'),
  k('لِلّٰهِ',     'lillâhi',  '“Allah’a aittir”',  'ل i ل ~ ه i'),
  k('رَبِّ',      'rabbi',   '“Rabbi”',            'ر a ب ~ i'),
  k('الْعَالَمِينَ', 'el-âlemîn', '“âlemlerin”',   'ا ل 0 ع a ا ل a م i M ن a'),
  k('مَالِكِ',    'mâliki',  '“sahibi / Mâliki”',   'م a ا ل i ك i'),
  k('يَوْمِ',     'yevmi',   '“gün”',              'ي a و 0 م i'),
  k('الدِّينِ',   'ed-dîni', '“din / hesap”',      'ا ل د ~ i M ن i'),
  k('إِيَّاكَ',   'iyyâke',  '“yalnız sana”',      'ا i ي ~ a ا ك a'),
  k('نَعْبُدُ',   'na‘büdü', '“ibadet ederiz”',    'ن a ع 0 ب u د u'),
  k('نَسْتَعِينُ', 'nesta‘în', '“yardım dileriz”', 'ن a س 0 ت a ع i M ن u'),
  k('اهْدِنَا',   'ihdinâ',  '“bizi hidayete erdir”', 'ا 0 ه 0 د i ن a ا'),
  k('الصِّرَاطَ', 'es-sırâta', '“yol”',            'ا ل ص ~ i ر a ا ط a'),
  k('الْمُسْتَقِيمَ', 'el-müstakîm', '“dosdoğru”', 'ا ل 0 م u س 0 ت a ق i M م a'),
  k('صِرَاطَ',    'sırâta',  '“yolu”',             'ص i ر a ا ط a'),
  k('الَّذِينَ',  'ellezîne', '“o kimseler ki”',   'ا ل ~ a ذ i M ن a'),
  k('أَنْعَمْتَ', 'en‘amte',  '“nimet verdin”',    'ا a ن 0 ع a م 0 ت a'),
  k('عَلَيْهِمْ', 'aleyhim',  '“onlara”',          'ع a ل a ي 0 ه i م 0'),
  k('غَيْرِ',     'ğayri',   '“-in dışında”',      'غ a ي 0 ر i'),
  k('الْمَغْضُوبِ', 'el-mağdûbi', '“gazaba uğramışlar”', 'ا ل 0 م a غ 0 ض u M ب i'),
  k('وَلَا',      'velâ',    '“ve değil”',         'و a ل a ا'),
  k('الضَّالِّينَ', 'ed-dâllîn', '“sapkınlar”',    'ا ل ض ~ a ا ل ~ i M ن a'),

  // ===========================================================================
  // İhlâs Sûresi (112) — 4 ayet
  // ===========================================================================
  k('أَحَدٌ',     'ehad',    '“tek / bir”',        'ا a ح a د U'),
  k('الصَّمَدُ',  'es-Samed', '“Samed (hiçbir şeye muhtaç olmayan)”', 'ا ل ص ~ a م a د u'),
  k('لَمْ',       'lem',     '“-medi / -madı”',    'ل a م 0'),
  k('يَلِدْ',     'yelid',   '“doğurmadı”',        'ي a ل i د 0'),
  k('يُولَدْ',    'yûled',   '“doğurulmadı”',      'ي u M ل a د 0'),
  k('يَكُنْ',     'yekün',   '“olmadı”',           'ي a ك u ن 0'),
  k('لَهُ',       'lehû',    '“onun için”',         'ل a ه u'),
  k('كُفُوًا',    'küfüven', '“denk / eş”',        'ك u ف u و A ا'),

  // ===========================================================================
  // Felak Sûresi (113) — 5 ayet
  // ===========================================================================
  k('أَعُوذُ',    'eûzü',    '“sığınırım”',        'ا a ع u M ذ u'),
  k('بِرَبِّ',    'bi-rabbi', '“Rabbine”',         'ب i ر a ب ~ i'),
  k('الْفَلَقِ',  'el-felak', '“sabahın / şafağın”', 'ا ل 0 ف a ل a ق i'),
  k('شَرِّ',      'şerri',   '“kötülüğünden”',     'ش a ر ~ i'),
  k('مَا',        'mâ',      '“şey”',              'م a ا'),
  k('خَلَقَ',     'halaka',  '“yarattı”',          'خ a ل a ق a'),
  k('غَاسِقٍ',    'ğâsikın', '“karanlık çöktüğünde”', 'غ a ا س i ق I'),
  k('إِذَا',      'izâ',     '“-dığı zaman”',      'ا i ذ a ا'),
  k('وَقَبَ',     'vekabe',  '“çöktüğünde”',       'و a ق a ب a'),
  k('النَّفَّاثَاتِ', 'en-neffâsâti', '“üfleyenler”', 'ا ل ن ~ a ف ~ a ا ث a ا ت i'),
  k('الْعُقَدِ',  'el-ukad', '“düğümler”',         'ا ل 0 ع u ق a د i'),
  k('حَاسِدٍ',    'hâsidin', '“hasetçinin”',       'ح a ا س i د I'),
  k('حَسَدَ',     'hasede',  '“haset etti”',       'ح a س a د a'),

  // ===========================================================================
  // Nâs Sûresi (114) — 6 ayet
  // ===========================================================================
  k('النَّاسِ',   'en-nâsi', '“insanların”',        'ا ل ن ~ a ا س i'),
  k('مَلِكِ',     'meliki',  '“hükümdarı”',         'م a ل i ك i'),
  k('إِلٰهِ',     'ilâhi',   '“ilahı”',             'ا i ل a ه i'),
  k('الْوَسْوَاسِ', 'el-vesvâs', '“vesveseci”',     'ا ل 0 و a س 0 و a ا س i'),
  k('الْخَنَّاسِ', 'el-hannâs', '“sinsi”',          'ا ل 0 خ a ن ~ a ا س i'),
  k('يُوَسْوِسُ', 'yüvesvisü', '“vesvese verir”',   'ي u و a س 0 و i س u'),
  k('صُدُورِ',    'sudûri',  '“göğüslerinde”',      'ص u د u M ر i'),
  k('الْجِنَّةِ', 'el-cinneti', '“cinler”',         'ا ل 0 ج i ن ~ a ة i'),

  // ===========================================================================
  // Kevser Sûresi (108) — 3 ayet
  // ===========================================================================
  k('إِنَّا',     'innâ',    '“muhakkak ki biz”',  'ا i ن ~ a ا'),
  k('أَعْطَيْنَاكَ', 'a‘taynâke', '“sana verdik”',  'ا a ع 0 ط a ي 0 ن a ا ك a'),
  k('الْكَوْثَرَ', 'el-Kevser', '“Kevser”',         'ا ل 0 ك a و 0 ث a ر a'),
  k('فَصَلِّ',    'fesalli', '“öyleyse namaz kıl”',  'ف a ص a ل ~ i'),
  k('وَانْحَرْ',  've-nhar', '“ve kurban kes”',     'و a ا 0 ن 0 ح a ر 0'),
  k('شَانِئَكَ',  'şâni’eke', '“sana kin tutan”',   'ش a ا ن i ء a ك a'),
  k('الْأَبْتَرُ', 'el-ebter', '“soyu kesik”',       'ا ل 0 ا a ب 0 ت a ر u'),

  // ===========================================================================
  // Asr Sûresi (103) — 3 ayet
  // ===========================================================================
  k('وَالْعَصْرِ', 've-l-asri', '“asra yemin olsun”', 'و a ا ل 0 ع a ص 0 ر i'),
  k('الْإِنْسَانَ', 'el-insâne', '“insan”',          'ا ل 0 ا i ن 0 س a ا ن a'),
  k('لَفِي',     'lefî',    '“gerçekten içindedir”', 'ل a ف i M'),
  k('خُسْرٍ',    'husrin',  '“ziyan / hüsran”',    'خ u س 0 ر I'),
  k('إِلَّا',     'illâ',    '“ancak”',             'ا i ل ~ a ا'),
  k('آمَنُوا',   'âmenû',   '“iman ettiler”',      'ا M م a ن u M ا'),
  k('عَمِلُوا',  'amilû',   '“iş işlediler”',      'ع a م i ل u M ا'),
  k('الصَّالِحَاتِ', 'es-sâlihât', '“salih ameller”', 'ا ل ص ~ a ا ل i ح a ا ت i'),
  k('تَوَاصَوْا', 'tevâsav', '“tavsiyeleştiler”',  'ت a و a ا ص a و 0 ا'),
  k('بِالْحَقِّ', 'bi-l-hakkı', '“hak ile”',        'ب i ا ل 0 ح a ق ~ i'),
  k('بِالصَّبْرِ', 'bi-s-sabri', '“sabır ile”',     'ب i ا ل ص ~ a ب 0 ر i'),

  // ===========================================================================
  // Nasr Sûresi (110) — 3 ayet
  // ===========================================================================
  k('جَاءَ',     'câe',     '“geldi”',             'ج a ا ء a'),
  k('نَصْرُ',    'nasru',   '“yardım”',             'ن a ص 0 ر u'),
  k('الْفَتْحُ', 'el-fethu', '“fetih”',             'ا ل 0 ف a ت 0 ح u'),
  k('رَأَيْتَ',  'reeyte',  '“gördün”',             'ر a ا a ي 0 ت a'),
  k('يَدْخُلُونَ', 'yedhulûne', '“giriyorlar”',     'ي a د 0 خ u ل u M ن a'),
  k('دِينِ',     'dîni',    '“dinine”',             'د i M ن i'),
  k('أَفْوَاجًا', 'efvâcen', '“bölük bölük”',      'ا a ف 0 و a ا ج A ا'),
  k('فَسَبِّحْ', 'fesebbih', '“tesbih et”',         'ف a س a ب ~ i ح 0'),
  k('بِحَمْدِ',  'bi-hamdi', '“hamd ile”',          'ب i ح a م 0 د i'),
  k('رَبِّكَ',   'rabbike', '“Rabbinin”',           'ر a ب ~ i ك a'),
  k('وَاسْتَغْفِرْهُ', 've-stağfirh', '“ve O’ndan af dile”', 'و a ا 0 س 0 ت a غ 0 ف i ر 0 ه u'),
  k('كَانَ',     'kâne',    '“oldu / idi”',         'ك a ا ن a'),
  k('تَوَّابًا', 'tevvâben', '“tevbeleri kabul edici”', 'ت a و ~ a ا ب A ا'),

  // ===========================================================================
  // Kâfirûn Sûresi (109) — 6 ayet
  // ===========================================================================
  k('يَا',       'yâ',      '“ey”',                'ي a ا'),
  k('أَيُّهَا',  'eyyühâ',  '“ey siz”',             'ا a ي ~ u ه a ا'),
  k('الْكَافِرُونَ', 'el-kâfirûn', '“kâfirler”',    'ا ل 0 ك a ا ف i ر u M ن a'),
  k('أَعْبُدُ',  'a‘büdü',  '“ibadet ederim”',      'ا a ع 0 ب u د u'),
  k('تَعْبُدُونَ', 'ta‘büdûne', '“ibadet edersiniz”', 'ت a ع 0 ب u د u M ن a'),
  k('عَابِدُونَ', 'âbidûne', '“ibadet edicilersiniz”', 'ع a ا ب i د u M ن a'),
  k('عَابِدٌ',   'âbidün',  '“ibadet edici”',       'ع a ا ب i د U'),
  k('عَبَدْتُمْ', 'abedtüm', '“ibadet ettiniz”',    'ع a ب a د 0 ت u م 0'),
  k('لَكُمْ',    'leküm',   '“sizin için”',         'ل a ك u م 0'),
  k('دِينُكُمْ', 'dîneküm', '“sizin dininiz”',      'د i M ن u ك u م 0'),
  k('وَلِيَ',    'veliye',  '“ve benim için”',      'و a ل i ي a'),
  k('دِينِ',     'dîni',    '“benim dinim”',        'د i M ن i'),

  // ===========================================================================
  // Fil Sûresi (105) — 5 ayet
  // ===========================================================================
  k('أَلَمْ',     'elem',    '“görmedin mi?”',     'ا a ل a م 0'),
  k('تَرَ',      'tera',    '“görmedin mi”',       'ت a ر a'),
  k('كَيْفَ',    'keyfe',   '“nasıl”',              'ك a ي 0 ف a'),
  k('فَعَلَ',    'feale',   '“yaptı”',              'ف a ع a ل a'),
  k('رَبُّكَ',   'rabbüke', '“Rabbin”',             'ر a ب ~ u ك a'),
  k('بِأَصْحَابِ', 'bi-eshâbi', '“sahiplerine”',    'ب i ا a ص 0 ح a ا ب i'),
  k('الْفِيلِ',  'el-fîli', '“fil”',                'ا ل 0 ف i M ل i'),
  k('يَجْعَلْ',  'yec‘al',  '“kılmadı mı?”',        'ي a ج 0 ع a ل 0'),
  k('كَيْدَهُمْ', 'keydehüm', '“tuzaklarını”',     'ك a ي 0 د a ه u م 0'),
  k('تَضْلِيلٍ', 'tadlîlin', '“boşa çıkarma”',     'ت a ض 0 ل i M ل I'),
  k('أَرْسَلَ',  'ersele',  '“gönderdi”',           'ا a ر 0 س a ل a'),
  k('طَيْرًا',   'tayren',  '“kuşlar”',             'ط a ي 0 ر A ا'),
  k('أَبَابِيلَ', 'ebâbîl', '“sürü sürü”',         'ا a ب a ا ب i M ل a'),
  k('تَرْمِيهِمْ', 'termîhim', '“onlara atıyordu”', 'ت a ر 0 م i M ه i م 0'),
  k('بِحِجَارَةٍ', 'bi-hicâretin', '“taşlarla”',    'ب i ح i ج a ا ر a ة I'),
  k('سِجِّيلٍ',  'siccîlin', '“pişirilmiş çamur”', 'س i ج ~ i M ل I'),
  k('فَجَعَلَهُمْ', 'fece‘alehüm', '“onları kıldı”', 'ف a ج a ع a ل a ه u م 0'),
  k('كَعَصْفٍ',  'ke-asfin', '“ekin yaprağı gibi”', 'ك a ع a ص 0 ف I'),
  k('مَأْكُولٍ', 'me’kûlin', '“yenilmiş”',         'م a ا 0 ك u M ل I'),

  // ===========================================================================
  // Kureyş Sûresi (106) — 4 ayet
  // ===========================================================================
  k('لِإِيلَافِ', 'li-îlâfi', '“ülfet etmesi için”', 'ل i ا i M ل a ا ف i'),
  k('قُرَيْشٍ',  'Kureyşin', '“Kureyş’in”',        'ق u ر a ي 0 ش I'),
  k('إِيلَافِهِمْ', 'îlâfihim', '“onların ülfeti”', 'ا i M ل a ا ف i ه i م 0'),
  k('رِحْلَةَ',  'rıhlete', '“yolculuk”',          'ر i ح 0 ل a ة a'),
  k('الشِّتَاءِ', 'eş-şitâi', '“kışın”',           'ا ل ش ~ i ت a ا ء i'),
  k('وَالصَّيْفِ', 've-s-sayfi', '“ve yazın”',     'و a ا ل ص ~ a ي 0 ف i'),
  k('فَلْيَعْبُدُوا', 'felya‘büdû', '“öyleyse ibadet etsinler”', 'ف a ل 0 ي a ع 0 ب u د u M ا'),
  k('رَبَّ',     'rabbe',   '“Rabbi”',              'ر a ب ~ a'),
  k('الْبَيْتِ', 'el-beyti', '“ev / Ka‘be”',        'ا ل 0 ب a ي 0 ت i'),
  k('أَطْعَمَهُمْ', 'at‘amehüm', '“onları doyurdu”', 'ا a ط 0 ع a م a ه u م 0'),
  k('جُوعٍ',     'cû‘in',   '“açlık”',              'ج u M ع I'),
  k('وَآمَنَهُمْ', 've-âmenehüm', '“ve onları emin kıldı”', 'و a ا M م a ن a ه u م 0'),
  k('خَوْفٍ',    'havfin',  '“korku”',              'خ a و 0 ف I')
];

