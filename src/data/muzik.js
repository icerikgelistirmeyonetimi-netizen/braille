// =============================================================================
// MEB Türk Braille Yazı Kılavuzu – Müzik Braille (Notalar) verileri.
// -----------------------------------------------------------------------------
// Müzik braillesinde her nota, hem ses adını (do, re, mi…) hem de süresini
// (dörtlük, sekizlik, vb.) tek hücrede gösterir. Aynı 7 hücre, kullanılan
// "süre göstergesi"ne göre 4 farklı süreyi (tam, yarım, dörtlük, sekizlik)
// ifade eder. Aşağıda dörtlük süredeki nota karşılıkları verilmiştir.
// =============================================================================

// Dörtlük notalar (1/4)
export const NOTALAR = [
  { ad: 'do',  okunus: 'do',  noktalar: [1, 4, 5] },     // d
  { ad: 're',  okunus: 're',  noktalar: [1, 5] },        // e
  { ad: 'mi',  okunus: 'mi',  noktalar: [1, 2, 4] },     // f
  { ad: 'fa',  okunus: 'fa',  noktalar: [1, 2, 4, 5] },  // g
  { ad: 'sol', okunus: 'sol', noktalar: [1, 2, 5] },     // h
  { ad: 'la',  okunus: 'la',  noktalar: [2, 4] },        // i
  { ad: 'si',  okunus: 'si',  noktalar: [2, 4, 5] }      // j
];

// Süre göstergeleri (notaya eklenen 3 ve/veya 6 noktası süreyi belirler)
export const SURE_GOSTERGELERI = [
  {
    ad: 'tam nota',     sembol: '𝅝',
    aciklama: 'Tam notada hücreye 3-6 noktaları eklenir. Örn. tam Do: 1-3-4-5-6.',
    noktalarEk: [3, 6]
  },
  {
    ad: 'yarım nota',   sembol: '𝅗𝅥',
    aciklama: 'Yarım notada yalnız 6 noktası eklenir. Örn. yarım Do: 1-4-5-6.',
    noktalarEk: [6]
  },
  {
    ad: 'dörtlük nota', sembol: '♩',
    aciklama: 'Dörtlük nota süresi temel hücredir; ek nokta yoktur. Örn. dörtlük Do: 1-4-5.',
    noktalarEk: []
  },
  {
    ad: 'sekizlik nota', sembol: '♪',
    aciklama: 'Sekizlik notada yalnız 3 noktası eklenir. Örn. sekizlik Do: 1-3-4-5.',
    noktalarEk: [3]
  }
];

// Müzik özel sembolleri
export const MUZIK_SEMBOLLERI = [
  {
    ad: 'sol anahtarı', sembol: '𝄞',
    aciklama: 'Sol anahtarı: 3-4-5 ve 3-4 ve 1-2-3.',
    hucreler: [[3, 4, 5], [3, 4], [1, 2, 3]]
  },
  {
    ad: 'fa anahtarı',  sembol: '𝄢',
    aciklama: 'Fa anahtarı: 3-4-5 ve 3-4 ve 1-2-3-4-5-6.',
    hucreler: [[3, 4, 5], [3, 4], [1, 2, 3, 4, 5, 6]]
  },
  {
    ad: 'diyez',        sembol: '♯',
    aciklama: 'Diyez işareti. Hücre: 1-4-6.',
    hucreler: [[1, 4, 6]]
  },
  {
    ad: 'bemol',        sembol: '♭',
    aciklama: 'Bemol işareti. Hücre: 1-2-6.',
    hucreler: [[1, 2, 6]]
  },
  {
    ad: 'bekar',        sembol: '♮',
    aciklama: 'Bekar (naturel) işareti. Hücre: 1-6.',
    hucreler: [[1, 6]]
  },
  {
    ad: 'dörtlük es',   sembol: '𝄽',
    aciklama: 'Dörtlük süs (es). Hücre: 1-2-3-6.',
    hucreler: [[1, 2, 3, 6]]
  },
  {
    ad: 'ölçü çizgisi', sembol: '|',
    aciklama: 'Ölçü çizgisi: ölçüler arasında boşluk hücresi kullanılır.',
    hucreler: [[]]
  }
];

// Oktav işaretleri (notaların hangi oktavda olduğunu belirtir)
export const OKTAV_ISARETLERI = [
  { ad: '1. oktav',  noktalar: [4, 4] },  // Bazı kılavuzlarda 4 noktası tek başına
  { ad: '2. oktav',  noktalar: [4, 5] },
  { ad: '3. oktav',  noktalar: [4, 5, 6] },
  { ad: '4. oktav (orta)', noktalar: [5] },
  { ad: '5. oktav',  noktalar: [4, 6] },
  { ad: '6. oktav',  noktalar: [5, 6] },
  { ad: '7. oktav',  noktalar: [6] }
];

// Örnek müzik dizileri (notaların ardışık dörtlük süresi)
export const MUZIK_DIZILERI = [
  {
    yazi: 'Do – Re – Mi – Fa – Sol – La – Si',
    okunus: 'çıkıcı majör dizi',
    anlam: 'Do majör dizinin yedi notası (dörtlük).',
    hucreler: [
      [1, 4, 5], [1, 5], [1, 2, 4], [1, 2, 4, 5],
      [1, 2, 5], [2, 4], [2, 4, 5]
    ]
  },
  {
    yazi: 'Do Mi Sol',
    okunus: 'do majör akoru (kırık)',
    anlam: 'Do majör 3’lü akorun ardışık çalınışı.',
    hucreler: [
      [1, 4, 5], [1, 2, 4], [1, 2, 5]
    ]
  },
  {
    yazi: 'Mi Re Do',
    okunus: 'inici üçlü',
    anlam: 'Mi-Re-Do dizisi.',
    hucreler: [
      [1, 2, 4], [1, 5], [1, 4, 5]
    ]
  }
];
