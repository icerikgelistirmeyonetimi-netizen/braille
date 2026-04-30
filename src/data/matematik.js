// =============================================================================
// MEB Türk Braille Yazı Kılavuzu (2014) – Matematik Braille verileri.
// -----------------------------------------------------------------------------
// Türk Braille'de rakamlar, harf hücreleriyle aynı noktalar kullanılarak
// "rakam göstergesi" (⠼ = 3-4-5-6) önüne konularak yazılır:
//   1 → ⠼⠁ (3-4-5-6) (1)
//   2 → ⠼⠃ (3-4-5-6) (1-2)
//   …
// Bir matematik sembolü ardından gelen harf, harf göstergesi (⠰ = 5-6) ile
// belirtilir. Aşağıdaki nokta karşılıkları MEB matematik braille kuralları
// esas alınmıştır.
// =============================================================================

// Rakam göstergesi: 3-4-5-6
export const RAKAM_GOSTERGESI = [3, 4, 5, 6];

// 0-9 rakamları (rakam göstergesinden sonra gelen harf hücreleri)
export const MATEMATIK_RAKAMLAR = [
  { ad: 'sıfır',  rakam: '0', noktalar: [3, 4, 5] },     // j
  { ad: 'bir',    rakam: '1', noktalar: [1] },           // a
  { ad: 'iki',    rakam: '2', noktalar: [1, 2] },        // b
  { ad: 'üç',     rakam: '3', noktalar: [1, 4] },        // c
  { ad: 'dört',   rakam: '4', noktalar: [1, 4, 5] },     // d
  { ad: 'beş',    rakam: '5', noktalar: [1, 5] },        // e
  { ad: 'altı',   rakam: '6', noktalar: [1, 2, 4] },     // f
  { ad: 'yedi',   rakam: '7', noktalar: [1, 2, 4, 5] },  // g
  { ad: 'sekiz',  rakam: '8', noktalar: [1, 2, 5] },     // h
  { ad: 'dokuz',  rakam: '9', noktalar: [2, 4] }         // i
];

// Temel matematik işlem ve karşılaştırma sembolleri
export const MATEMATIK_SEMBOLLER = [
  {
    ad: 'artı',         sembol: '+',
    aciklama: 'Toplama işareti. Hücre noktaları: 2-3-5.',
    hucreler: [[2, 3, 5]]
  },
  {
    ad: 'eksi',         sembol: '−',
    aciklama: 'Çıkarma işareti. Hücre noktaları: 3-6.',
    hucreler: [[3, 6]]
  },
  {
    ad: 'çarpı',        sembol: '×',
    aciklama: 'Çarpma işareti. Hücre noktaları: 2-3-6.',
    hucreler: [[2, 3, 6]]
  },
  {
    ad: 'bölü',         sembol: '÷',
    aciklama: 'Bölme işareti. Hücre noktaları: 2-5-6.',
    hucreler: [[2, 5, 6]]
  },
  {
    ad: 'eşittir',      sembol: '=',
    aciklama: 'Eşitlik işareti. İki hücre: 2-3-5-6 ve 2-3-5-6.',
    hucreler: [[2, 3, 5, 6], [2, 3, 5, 6]]
  },
  {
    ad: 'küçüktür',     sembol: '<',
    aciklama: 'Küçüktür işareti. Hücre noktaları: 5-6 ve 1-2.',
    hucreler: [[5, 6], [1, 2]]
  },
  {
    ad: 'büyüktür',     sembol: '>',
    aciklama: 'Büyüktür işareti. Hücre noktaları: 4-5 ve 2-3.',
    hucreler: [[4, 5], [2, 3]]
  },
  {
    ad: 'virgül (ondalık)', sembol: ',',
    aciklama: 'Ondalık ayırıcı virgül. Hücre noktaları: 2.',
    hucreler: [[2]]
  },
  {
    ad: 'sol parantez', sembol: '(',
    aciklama: 'Sol parantez. Hücre noktaları: 1-2-3-5-6.',
    hucreler: [[1, 2, 3, 5, 6]]
  },
  {
    ad: 'sağ parantez', sembol: ')',
    aciklama: 'Sağ parantez. Hücre noktaları: 2-3-4-5-6.',
    hucreler: [[2, 3, 4, 5, 6]]
  },
  {
    ad: 'kesir çizgisi', sembol: '/',
    aciklama: 'Kesir çizgisi (pay/payda). Hücre noktaları: 3-4.',
    hucreler: [[3, 4]]
  },
  {
    ad: 'yüzde',        sembol: '%',
    aciklama: 'Yüzde işareti. İki hücre: 4-6 ve 3-5-6.',
    hucreler: [[4, 6], [3, 5, 6]]
  },
  {
    ad: 'üs (kuvvet)',  sembol: '^',
    aciklama: 'Üst simge / kuvvet göstergesi. Hücre: 4.',
    hucreler: [[4]]
  },
  {
    ad: 'alt simge',    sembol: '_',
    aciklama: 'Alt simge göstergesi. Hücre: 5-6.',
    hucreler: [[5, 6]]
  },
  {
    ad: 'karekök',      sembol: '√',
    aciklama: 'Karekök işareti. İki hücre: 3-4-5 ve 1-4-6.',
    hucreler: [[3, 4, 5], [1, 4, 6]]
  }
];

// Geometri ve ölçü sembolleri
export const GEOMETRI_SEMBOLLERI = [
  { ad: 'derece', sembol: '°',
    aciklama: 'Açı/sıcaklık derecesi. İki hücre: 4-5 ve 2-4-5.',
    hucreler: [[4, 5], [2, 4, 5]] },
  { ad: 'açı',    sembol: '∠',
    aciklama: 'Açı sembolü. İki hücre: 4-6 ve 2-4-6.',
    hucreler: [[4, 6], [2, 4, 6]] },
  { ad: 'üçgen',  sembol: '△',
    aciklama: 'Üçgen sembolü. İki hücre: 4-6 ve 1-4-5.',
    hucreler: [[4, 6], [1, 4, 5]] },
  { ad: 'kare',   sembol: '□',
    aciklama: 'Kare sembolü. İki hücre: 4-6 ve 1-2-3-4.',
    hucreler: [[4, 6], [1, 2, 3, 4]] },
  { ad: 'daire',  sembol: '○',
    aciklama: 'Daire sembolü. İki hücre: 4-6 ve 1-3-5.',
    hucreler: [[4, 6], [1, 3, 5]] },
  { ad: 'paralel', sembol: '∥',
    aciklama: 'Paralel doğrular. İki hücre: 4-5-6 ve 1-2-3.',
    hucreler: [[4, 5, 6], [1, 2, 3]] },
  { ad: 'dik (perpendiküler)', sembol: '⟂',
    aciklama: 'Dik doğrular. İki hücre: 4-5-6 ve 1-5-6.',
    hucreler: [[4, 5, 6], [1, 5, 6]] }
];

// Örnek matematik ifadeleri (rakam göstergesi + rakamlar + sembol)
export const MATEMATIK_IFADELER = [
  {
    yazi: '2 + 3 = 5',
    okunus: 'iki artı üç eşittir beş',
    aciklama: 'Rakam göstergesi her sayı grubunun başına gelir.',
    hucreler: [
      [3, 4, 5, 6], [1, 2],          // ⠼2
      [2, 3, 5],                     // +
      [3, 4, 5, 6], [1, 4],          // ⠼3
      [2, 3, 5, 6], [2, 3, 5, 6],    // =
      [3, 4, 5, 6], [1, 5]           // ⠼5
    ]
  },
  {
    yazi: '10 − 4 = 6',
    okunus: 'on eksi dört eşittir altı',
    aciklama: 'Çok basamaklı sayıda rakam göstergesi yalnız bir kez yazılır.',
    hucreler: [
      [3, 4, 5, 6], [1], [3, 4, 5],  // ⠼10
      [3, 6],                        // −
      [3, 4, 5, 6], [1, 4, 5],       // ⠼4
      [2, 3, 5, 6], [2, 3, 5, 6],    // =
      [3, 4, 5, 6], [1, 2, 4]        // ⠼6
    ]
  },
  {
    yazi: '1/2',
    okunus: 'bir bölü iki (kesir)',
    aciklama: 'Kesir: pay, kesir çizgisi (3-4), payda.',
    hucreler: [
      [3, 4, 5, 6], [1],             // ⠼1
      [3, 4],                        // /
      [3, 4, 5, 6], [1, 2]           // ⠼2
    ]
  },
  {
    yazi: '7 > 3',
    okunus: 'yedi büyüktür üç',
    aciklama: 'Büyüktür iki hücreden oluşur: 4-5 ve 2-3.',
    hucreler: [
      [3, 4, 5, 6], [1, 2, 4, 5],
      [4, 5], [2, 3],
      [3, 4, 5, 6], [1, 4]
    ]
  },
  {
    yazi: '50%',
    okunus: 'yüzde elli',
    aciklama: 'Yüzde işareti sayıdan sonra: 4-6 ve 3-5-6.',
    hucreler: [
      [3, 4, 5, 6], [1, 5], [3, 4, 5],   // ⠼50
      [4, 6], [3, 5, 6]                   // %
    ]
  }
];
