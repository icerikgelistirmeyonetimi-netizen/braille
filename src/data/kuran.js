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
// ----------------------------------------------------------------------------
export const KURAN_KELIMELERI = [
  {
    yazi: 'بِسْمِ',
    okunus: 'bismi',
    anlam: '“adıyla”',
    hucreler: [
      [1, 2],     // ب
      [2, 6],     // kesra
      [2, 3, 4], // س
      [4],        // sükûn
      [1, 3, 4], // م
      [2, 6]      // kesra
    ]
  },
  {
    yazi: 'اللّٰهِ',
    okunus: 'Allâhi',
    anlam: '“Allah’ın”',
    hucreler: [
      [1],        // ا
      [1, 2, 3], // ل
      [1, 2, 3], // ل
      [6],        // şedde
      [1, 2, 5], // ه (Kur'an yazımında “Allah”ın özel imlası basitleştirildi)
      [2, 6]      // kesra
    ]
  },
  {
    yazi: 'رَبِّ',
    okunus: 'rabbi',
    anlam: '“Rabbi”',
    hucreler: [
      [1, 2, 3, 5], // ر
      [3, 5],          // fetha
      [1, 2],          // ب
      [6],             // şedde
      [2, 6]           // kesra
    ]
  },
  {
    yazi: 'قُلْ',
    okunus: 'kul',
    anlam: '“Söyle, de ki”',
    hucreler: [
      [1, 2, 3, 4, 5], // ق
      [1, 3, 6],          // damme
      [1, 2, 3],          // ل
      [4]                 // sükûn
    ]
  },
  {
    yazi: 'هُوَ',
    okunus: 'hüve',
    anlam: '“O”',
    hucreler: [
      [1, 2, 5],        // ه
      [1, 3, 6],        // damme
      [2, 4, 5, 6],    // و
      [3, 5]            // fetha
    ]
  },
  {
    yazi: 'لَا',
    okunus: 'lâ',
    anlam: '“yok / değil”',
    hucreler: [
      [1, 2, 3],   // ل
      [3, 5],      // fetha
      [1]          // ا
    ]
  },
  {
    yazi: 'مَنْ',
    okunus: 'men',
    anlam: '“kim”',
    hucreler: [
      [1, 3, 4],   // م
      [3, 5],      // fetha
      [1, 3, 4, 5], // ن
      [4]          // sükûn
    ]
  },
  {
    yazi: 'فِي',
    okunus: 'fî',
    anlam: '“içinde”',
    hucreler: [
      [1, 2, 4],   // ف
      [2, 6],      // kesra
      [2, 4]       // ي
    ]
  }
];
