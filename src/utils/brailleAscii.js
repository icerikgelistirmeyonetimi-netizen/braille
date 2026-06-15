// ─────────────────────────────────────────────────────────────────────────
// North American Braille ASCII (SimBraille) — TEK doğruluk kaynağı.
// BRF dosyaları bu 64-karakterlik tabloyla yazılır/okunur; embosser'lar ASCII
// baytını okuyup karşılık gelen noktaları kabartır.
// ÖNEMLİ: "0x20 + bit" gibi naive eşleme YANLIŞTIR (ör. nokta-1 = 'a' → 'A'
// olmalı, '!' değil). Tüm BRF dışa/içe aktarım yolları bu modülü kullanmalıdır.
// Kaynak: https://en.wikipedia.org/wiki/Braille_ASCII
// ─────────────────────────────────────────────────────────────────────────

export const BRAILLE_ASCII_HUCRELERI = {
  ' ': [], 'A': [1], 'B': [1, 2], 'C': [1, 4], 'D': [1, 4, 5], 'E': [1, 5],
  'F': [1, 2, 4], 'G': [1, 2, 4, 5], 'H': [1, 2, 5], 'I': [2, 4], 'J': [2, 4, 5],
  'K': [1, 3], 'L': [1, 2, 3], 'M': [1, 3, 4], 'N': [1, 3, 4, 5], 'O': [1, 3, 5],
  'P': [1, 2, 3, 4], 'Q': [1, 2, 3, 4, 5], 'R': [1, 2, 3, 5], 'S': [2, 3, 4],
  'T': [2, 3, 4, 5], 'U': [1, 3, 6], 'V': [1, 2, 3, 6], 'W': [2, 4, 5, 6],
  'X': [1, 3, 4, 6], 'Y': [1, 3, 4, 5, 6], 'Z': [1, 3, 5, 6],
  '1': [2], '2': [2, 3], '3': [2, 5], '4': [2, 5, 6], '5': [2, 6],
  '6': [2, 3, 5], '7': [2, 3, 5, 6], '8': [2, 3, 6], '9': [3, 5], '0': [3, 5, 6],
  '&': [1, 2, 3, 4, 6], '=': [1, 2, 3, 4, 5, 6], '(': [1, 2, 3, 5, 6],
  '!': [2, 3, 4, 6], ')': [2, 3, 4, 5, 6], '*': [1, 6], '<': [1, 2, 6],
  '%': [1, 4, 6], '?': [1, 4, 5, 6], ':': [1, 5, 6], '$': [1, 2, 4, 6],
  ']': [1, 2, 4, 5, 6], '\\': [1, 2, 5, 6], '[': [2, 4, 6],
  '/': [3, 4], '+': [3, 4, 6], '#': [3, 4, 5, 6], '>': [3, 4, 5], "'": [3],
  '-': [3, 6], '.': [4, 6], '^': [4, 5], '_': [4, 5, 6], '"': [5], ';': [5, 6],
  ',': [6], '@': [4],
};

// 6-bit desen indeksi (nokta1=bit0 … nokta6=bit5) → Braille ASCII karakteri
const NOKTA_BITI_KARAKTER = (() => {
  const arr = new Array(64).fill(' ');
  for (const [ch, dots] of Object.entries(BRAILLE_ASCII_HUCRELERI)) {
    let bits = 0;
    for (const d of dots) bits |= 1 << (d - 1);
    arr[bits] = ch;
  }
  return arr;
})();

/** Hücre noktalarını (1-6 dizisi) standart Braille ASCII karakterine çevirir. */
export function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of (noktalar || [])) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return NOKTA_BITI_KARAKTER[bits];
}

/** Braille ASCII karakterini nokta dizisine (1-6) çevirir; tanınmazsa null. */
export function brfNoktalaradon(ch) {
  if (ch == null) return null;
  const up = String(ch).toUpperCase(); // Braille ASCII büyük harf tablosudur
  const dots = BRAILLE_ASCII_HUCRELERI[up] ?? BRAILLE_ASCII_HUCRELERI[String(ch)];
  return dots ? [...dots] : null;
}

/**
 * Unicode braille metnini (⠿, U+2800) embosser-uyumlu Braille ASCII'ye çevirir.
 * Satır sonları/karakterler korunur; her braille hücresi standart ASCII karaktere
 * dönüşür. (Müzik BRF dışa aktarımı Unicode üretir → indirirken ASCII'ye çevrilir.)
 */
export function unicodeBrailleToBrfAscii(metin = '') {
  return Array.from(String(metin || ''))
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 0x2800 && code <= 0x28ff) {
        const bits = (code - 0x2800) & 0x3f; // yalnızca alt 6 nokta (BRF 6-nokta)
        return NOKTA_BITI_KARAKTER[bits];
      }
      return ch; // \n, \r, boşluk, diğer
    })
    .join('');
}

/**
 * Braille ASCII metnini Unicode braille'e (⠿, U+2800) çevirir — TERS yön.
 * Yüklenen .brf dosyaları embosser ASCII'siyle gelir; GÖSTERİM için (Ham BRF
 * görünümü) dots'a çevrilmeli, yoksa ASCII harfleri "bozuk" görünür. Zaten Unicode
 * braille olan karakterler + \n/\r korunur (Unicode .brf de güvenle geçer).
 */
export function brfAsciiToUnicodeBraille(metin = '') {
  return Array.from(String(metin || ''))
    .map((ch) => {
      if (ch === '\n' || ch === '\r') return ch;
      const code = ch.charCodeAt(0);
      if (code >= 0x2800 && code <= 0x28ff) return ch; // zaten Unicode braille
      const dots = brfNoktalaradon(ch);
      if (!dots) return ch; // Braille ASCII tablosunda yok → olduğu gibi
      let bits = 0;
      for (const d of dots) bits |= 1 << (d - 1);
      return String.fromCodePoint(0x2800 + bits);
    })
    .join('');
}
