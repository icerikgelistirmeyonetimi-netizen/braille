// =============================================================================
// MEB Türk Braille Yazı Kılavuzu – Fen Bilimleri Braille verileri.
// -----------------------------------------------------------------------------
// Fen Bilimleri'nde sıkça kullanılan kimya/fizik sembolleri, ölçü birimleri
// ve Yunan harfleri burada toplanmıştır. Kimyasal formüllerde büyük harfler
// için "büyük harf göstergesi" (⠨ = 4-6) ve sayısal alt simgeler için
// "alt simge göstergesi" (⠰ = 5-6 veya kılavuza göre değişebilir) kullanılır.
// =============================================================================

// Büyük harf göstergesi: 4-6
export const BUYUK_HARF_GOSTERGESI = [4, 6];
// Alt simge göstergesi (kimya formülleri için): 5-6
export const ALT_SIMGE_GOSTERGESI = [5, 6];

// Yunan harfleri (fizikte sık kullanılır). Yunan göstergesi (4-5-6) +
// karşılık gelen Latin harfi.
export const YUNAN_HARFLERI = [
  { harf: 'α', ad: 'alfa',   okunus: 'alfa',   noktalar: [1] },           // a
  { harf: 'β', ad: 'beta',   okunus: 'beta',   noktalar: [1, 2] },        // b
  { harf: 'γ', ad: 'gamma',  okunus: 'gama',   noktalar: [1, 2, 4, 5] },  // g
  { harf: 'δ', ad: 'delta',  okunus: 'delta',  noktalar: [1, 4, 5] },     // d
  { harf: 'θ', ad: 'theta',  okunus: 'teta',   noktalar: [1, 4, 5, 6] },  // þ/th
  { harf: 'λ', ad: 'lambda', okunus: 'lamda',  noktalar: [1, 2, 3] },     // l
  { harf: 'μ', ad: 'mü',     okunus: 'mü',     noktalar: [1, 3, 4] },     // m
  { harf: 'π', ad: 'pi',     okunus: 'pi',     noktalar: [1, 2, 3, 4] },  // p
  { harf: 'σ', ad: 'sigma',  okunus: 'sigma',  noktalar: [2, 3, 4] },     // s
  { harf: 'φ', ad: 'fi',     okunus: 'fi',     noktalar: [1, 2, 4] },     // f
  { harf: 'ω', ad: 'omega',  okunus: 'omega',  noktalar: [2, 4, 5, 6] }   // w
];
// Yunan göstergesi her zaman bu harflerin başına eklenir:
export const YUNAN_GOSTERGESI = [4, 5, 6];

// Fen/fizik birim ve sembolleri
export const FEN_SEMBOLLER = [
  { ad: 'derece (sıcaklık)', sembol: '°',
    aciklama: 'Sıcaklık derecesi. İki hücre: 4-5 ve 2-4-5.',
    hucreler: [[4, 5], [2, 4, 5]] },
  { ad: 'artı (yük)',         sembol: '+',
    aciklama: 'Pozitif yük / iyon. Hücre: 2-3-5.',
    hucreler: [[2, 3, 5]] },
  { ad: 'eksi (yük)',         sembol: '−',
    aciklama: 'Negatif yük / iyon. Hücre: 3-6.',
    hucreler: [[3, 6]] },
  { ad: 'ok (tepkime)',       sembol: '→',
    aciklama: 'Tepkime ya da yön oku. İki hücre: 2-5 ve 1-3-5.',
    hucreler: [[2, 5], [1, 3, 5]] },
  { ad: 'çift yön ok',        sembol: '⇌',
    aciklama: 'Tersinir tepkime. İki hücre: 4-6 ve 1-3-5.',
    hucreler: [[4, 6], [1, 3, 5]] },
  { ad: 'eşittir',            sembol: '=',
    aciklama: 'Eşitlik. İki hücre: 2-3-5-6 ve 2-3-5-6.',
    hucreler: [[2, 3, 5, 6], [2, 3, 5, 6]] },
  { ad: 'çarpı',              sembol: '×',
    aciklama: 'Çarpma. Hücre: 2-3-6.',
    hucreler: [[2, 3, 6]] },
  { ad: 'bölü',               sembol: '÷',
    aciklama: 'Bölme / hız (m/s) gibi. Hücre: 2-5-6.',
    hucreler: [[2, 5, 6]] }
];

// Kimyasal element örnekleri (büyük harf gösterge + harf(ler) + alt simge gösterge + rakam)
export const KIMYASAL_FORMULLER = [
  {
    yazi: 'H₂O',
    okunus: 'su, hidrojen iki o',
    anlam: 'Su molekülü.',
    hucreler: [
      [4, 6], [1, 2, 5],            // ⠨H
      [5, 6], [3, 4, 5, 6], [1, 2], // alt simge ⠰⠼2
      [4, 6], [1, 3, 5]             // ⠨O
    ]
  },
  {
    yazi: 'CO₂',
    okunus: 'karbondioksit',
    anlam: 'Karbon dioksit gazı.',
    hucreler: [
      [4, 6], [1, 4],               // ⠨C
      [4, 6], [1, 3, 5],            // ⠨O
      [5, 6], [3, 4, 5, 6], [1, 2]  // ⠰⠼2
    ]
  },
  {
    yazi: 'NaCl',
    okunus: 'sodyum klorür (yemek tuzu)',
    anlam: 'Sodyum klorür (tuz).',
    hucreler: [
      [4, 6], [1, 3, 4, 5],         // ⠨N
      [1],                          // a
      [4, 6], [1, 4],               // ⠨C
      [1, 2, 3]                     // l
    ]
  },
  {
    yazi: 'O₂',
    okunus: 'oksijen gazı',
    anlam: 'Oksijen molekülü.',
    hucreler: [
      [4, 6], [1, 3, 5],            // ⠨O
      [5, 6], [3, 4, 5, 6], [1, 2]  // ⠰⠼2
    ]
  },
  {
    yazi: 'H₂SO₄',
    okunus: 'sülfürik asit',
    anlam: 'Sülfürik asit (zaç yağı).',
    hucreler: [
      [4, 6], [1, 2, 5],
      [5, 6], [3, 4, 5, 6], [1, 2],
      [4, 6], [2, 3, 4],            // ⠨S
      [4, 6], [1, 3, 5],
      [5, 6], [3, 4, 5, 6], [1, 4, 5] // ⠰⠼4
    ]
  }
];

// Kısa fizik formülleri (örnek)
export const FIZIK_FORMULLERI = [
  {
    yazi: 'F = m · a',
    okunus: 'kuvvet eşittir kütle çarpı ivme',
    anlam: 'Newton’un 2. yasası.',
    hucreler: [
      [4, 6], [1, 2, 4],            // ⠨F
      [2, 3, 5, 6], [2, 3, 5, 6],   // =
      [1, 3, 4],                    // m
      [2, 3, 6],                    // ×
      [1]                           // a
    ]
  },
  {
    yazi: 'v = s / t',
    okunus: 'hız eşittir yol bölü zaman',
    anlam: 'Sabit hız bağıntısı.',
    hucreler: [
      [1, 2, 3, 6],                 // v
      [2, 3, 5, 6], [2, 3, 5, 6],
      [2, 3, 4],                    // s
      [3, 4],                       // /
      [2, 3, 4, 5]                  // t
    ]
  }
];
