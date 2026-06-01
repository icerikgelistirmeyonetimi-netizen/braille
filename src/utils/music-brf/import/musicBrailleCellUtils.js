import { brfNoktalaradon } from '../../brailleAscii.js';

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

// ASCII BRF → Unicode braille: standart North American Braille ASCII tablosunu
// kullanır (utils/brailleAscii.js — tek doğruluk kaynağı). Eski naive
// "0x2800 + (code - 0x20)" eşlemesi rakam/noktalama için yanlıştı ve düzeltilen
// dışa aktarımla tutarsızdı.
export function asciiBrfToUnicodeBraille(text = '') {
  return Array.from(String(text || ''))
    .map((ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
      const dots = brfNoktalaradon(ch);
      if (dots) return cellToUnicodeBraille(dots);
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
