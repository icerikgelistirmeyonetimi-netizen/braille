export const BRAILLE_BASE = 0x2800;

export function normalizeDots(dots = []) {
  return [...(dots || [])]
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 8)
    .sort((a, b) => a - b);
}

export function cellKey(cell = []) {
  return normalizeDots(cell).join('');
}

export function cellsEqual(a, b) {
  return cellKey(a) === cellKey(b);
}

export function unicodeBrailleCharToCell(ch) {
  if (!ch) return null;

  const code = ch.charCodeAt(0);

  if (code < BRAILLE_BASE || code > 0x28ff) {
    return null;
  }

  const value = code - BRAILLE_BASE;
  const dots = [];

  for (let i = 0; i < 8; i += 1) {
    if (value & (1 << i)) {
      dots.push(i + 1);
    }
  }

  return dots;
}

export function cellToUnicodeBraille(cell = []) {
  let bit = 0;

  normalizeDots(cell).forEach((dot) => {
    bit |= 1 << (dot - 1);
  });

  return String.fromCharCode(BRAILLE_BASE + bit);
}

export function unicodeBrailleToCells(text = '') {
  return Array.from(String(text || ''))
    .map(unicodeBrailleCharToCell)
    .filter((cell) => Array.isArray(cell));
}

/**
 * Yaygin ASCII BRF standardi:
 * ASCII 0x20-0x5F arasi Braille pattern offset olarak yorumlanir.
 */
const ASCII_BRAILLE_LETTERS = {
  a: [1],
  b: [1, 2],
  c: [1, 4],
  d: [1, 4, 5],
  e: [1, 5],
  f: [1, 2, 4],
  g: [1, 2, 4, 5],
  h: [1, 2, 5],
  i: [2, 4],
  j: [2, 4, 5],
  k: [1, 3],
  l: [1, 2, 3],
  m: [1, 3, 4],
  n: [1, 3, 4, 5],
  o: [1, 3, 5],
  p: [1, 2, 3, 4],
  q: [1, 2, 3, 4, 5],
  r: [1, 2, 3, 5],
  s: [2, 3, 4],
  t: [2, 3, 4, 5],
  u: [1, 3, 6],
  v: [1, 2, 3, 6],
  w: [2, 4, 5, 6],
  x: [1, 3, 4, 6],
  y: [1, 3, 4, 5, 6],
  z: [1, 3, 5, 6],
};

const ASCII_BRF_EXPLICIT = {
  '#': [3, 4, 5, 6],
  ',': [2, 3, 5],
};

export function asciiBrfToUnicodeBraille(text = '') {
  return Array.from(String(text || ''))
    .map((ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;

      const explicit = ASCII_BRF_EXPLICIT[ch];
      if (explicit) {
        return cellToUnicodeBraille(explicit);
      }

      const mapped = ASCII_BRAILLE_LETTERS[ch.toLowerCase()];
      if (mapped) {
        return cellToUnicodeBraille(mapped);
      }

      const code = ch.charCodeAt(0);
      if (code >= 0x20 && code <= 0x5f) {
        return String.fromCharCode(BRAILLE_BASE + (code - 0x20));
      }

      return ch;
    })
    .join('');
}

export function brfTextToCells(text = '') {
  const raw = String(text || '');

  const hasUnicodeBraille = Array.from(raw).some((ch) => {
    const code = ch.charCodeAt(0);
    return code >= BRAILLE_BASE && code <= 0x28ff;
  });

  const unicodeText = hasUnicodeBraille
    ? raw
    : asciiBrfToUnicodeBraille(raw);

  return unicodeBrailleToCells(unicodeText);
}

export function cellsToDebugText(cells = []) {
  return (cells || []).map((cell) => `[${normalizeDots(cell).join(',')}]`).join(' ');
}
