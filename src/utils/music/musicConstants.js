// Müzik motor sabitleri — Araclar.jsx'ten taşındı (utils/music split)
// PDF kaynak: Braille Music Notation Introductory Training Program (Modül 8)

// 7 perde için SVG y koordinatı (porte = y 64..112; orta çizgi y=88 = si)
export const MUZIK_PITCH_Y = {
  do: 124, re: 118, mi: 112, fa: 106, sol: 100, la: 94, si: 88,
};

// Diatonik sıra (kendi dahil aralık sayımı için)
export const MUZIK_NOTA_DIYATONIK_SIRA = {
  do: 0, re: 1, mi: 2, fa: 3, sol: 4, la: 5, si: 6,
};

// Modül 8 Bölüm 3 — 7 oktav işareti için hücre noktaları
export const MUZIK_OKTAV_HUCRELERI = [
  [4],        // 1. oktav
  [4, 5],     // 2. oktav
  [4, 5, 6],  // 3. oktav
  [5],        // 4. oktav (orta do)
  [4, 6],     // 5. oktav
  [5, 6],     // 6. oktav
  [6],        // 7. oktav
];

// Aksidental → hücre dizileri
export const MUZIK_ACCIDENTAL_HUCRELERI = {
  sharp:       [[1, 4, 6]],
  flat:        [[1, 2, 6]],
  natural:     [[1, 6]],
  doubleSharp: [[1, 4, 6], [1, 4, 6]],
  doubleFlat:  [[1, 2, 6], [1, 2, 6]],
};

// Modül 8 Bölüm 4 — Donanım standart sırası
export const MUZIK_DIYEZ_SIRASI = ['fa', 'do', 'sol', 're', 'la', 'mi', 'si'];
export const MUZIK_BEMOL_SIRASI = ['si', 'mi', 'la', 're', 'sol', 'do', 'fa'];

// Üst-rakam (Antoine sırası, North-American Braille music)
export const MUZIK_UST_RAKAM = {
  '0': [2, 4, 5], '1': [1], '2': [1, 2], '3': [1, 4], '4': [1, 4, 5],
  '5': [1, 5], '6': [1, 2, 4], '7': [1, 2, 4, 5], '8': [1, 2, 5], '9': [2, 4],
};

// Alt-rakam (bar number için, sayı işareti olmadan)
export const MUZIK_ALT_RAKAM = {
  '0': [3, 5, 6], '1': [2], '2': [2, 3], '3': [2, 5], '4': [2, 5, 6],
  '5': [2, 6], '6': [2, 3, 5], '7': [2, 3, 5, 6], '8': [2, 3, 6], '9': [3, 5],
};

// Modül 8 Bölüm 6 — Kontraksiyonsuz harf hücreleri (Grade 1)
export const MUZIK_HARF_NOKTALARI = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5],
  h: [1, 2, 5], i: [2, 4], j: [2, 4, 5], k: [1, 3], l: [1, 2, 3], m: [1, 3, 4],
  n: [1, 3, 4, 5], o: [1, 3, 5], p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5],
  s: [2, 3, 4], t: [2, 3, 4, 5], u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6],
  x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
};

// Görsel skor satırı kapasitesi (SVG için; BRF satırı ayrı)
export const MUZIK_SATIR_KAPASITESI = 8;
export const MUZIK_SATIR_YUKSEKLIK = 132;

// Modül 8 Bölüm 4 — Kategori uygulama tipleri (UI palette davranışı için)
export const MUZIK_KATEGORI_TIPI = {
  'notalar':          'standalone',
  'anahtarlar':       'prepend',
  'sus':              'standalone',
  'oktav':            'before-note',
  'zaman-imzasi':     'header',
  'degistirici':      'before-note',
  'donanim':          'header',
  'olcu-cizgileri':   'standalone',
  'bag-slur':         'two-notes',
  'dinamikler':       'before-note',
  'hairpin':          'before-note',
  'nuans-once':       'before-note',
  'nuans-sonra':      'after-note',
  'suslemeler':       'before-note',
  'duzensiz-gruplar': 'before-note',
  'tekrar':           'standalone',
};

// Kategori ikonları (toolbar müzik notasyonu glifleri)
export const MUZIK_KATEGORI_IKON = {
  notalar:           { sembol: '♪',   etiket: 'Notalar' },
  anahtarlar:        { sembol: '𝄞',   etiket: 'Anahtarlar' },
  sus:               { sembol: '𝄽',   etiket: 'Sus (sessizlik)' },
  oktav:             { sembol: '8va', etiket: 'Oktav işaretleri', italic: true },
  'zaman-imzasi':    { sembol: '4/4', etiket: 'Zaman imzası' },
  degistirici:       { sembol: '♯',   etiket: 'Değiştiriciler' },
  donanim:           { sembol: '♭♭',  etiket: 'Donanım' },
  'olcu-cizgileri':  { sembol: '𝄁',   etiket: 'Ölçü çizgileri' },
  'bag-slur':        { sembol: '⌒',   etiket: 'Bağ / slur' },
  dinamikler:        { sembol: 'f',   etiket: 'Dinamikler', italic: true },
  hairpin:           { sembol: '<',   etiket: 'Hairpin' },
  'nuans-once':      { sembol: '>',   etiket: 'Nüans (nota öncesi)' },
  'nuans-sonra':     { sembol: '𝄐',   etiket: 'Nüans (nota sonrası)' },
  suslemeler:        { sembol: 'tr',  etiket: 'Süslemeler', italic: true },
  'duzensiz-gruplar':{ sembol: '³',   etiket: 'Düzensiz gruplar' },
  tekrar:            { sembol: '𝄎',   etiket: 'Tekrar' },
};

// Türkçe solfej nota isimleri (UI için)
export const MUZIK_NOTA_IKON = {
  do: 'do', re: 're', mi: 'mi', fa: 'fa', sol: 'sol', la: 'la', si: 'si',
};
