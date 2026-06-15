import { SURE_GOSTERGELERI } from '../../data/muzik.js';

export const BRAILLE_BLANK = '⠀';

// Zaman imzası deseni → "N/M" eşlemesi. Üst-rakam (numerator) + alt-rakam (denominator) hücre
// tablolarından ÜRETİLİR (editör muzikTimeSignatureHucreleri ile aynı standart konvansiyon).
// Eski hardcoded harita eksik+hataliydi (6/8 denominator lower-6 yazılmıştı; 9/8, 12/8, 2/2 vb. yoktu).
const _TS_UPPER = { 1: '1', 2: '12', 3: '14', 4: '145', 5: '15', 6: '124', 7: '1245', 8: '125', 9: '24', 0: '245' };
const _TS_LOWER = { 1: '2', 2: '23', 3: '25', 4: '256', 5: '26', 6: '235', 7: '2356', 8: '236', 9: '35', 0: '356' };
function _tsKey(num, den) {
  const numKeys = String(num).split('').map((d) => _TS_UPPER[d]).join('|');
  const denKeys = String(den).split('').map((d) => _TS_LOWER[d]).join('|');
  return `3456|${numKeys}|${denKeys}`;
}
export const TIME_SIGNATURE_PATTERNS = (() => {
  const map = {};
  for (let num = 1; num <= 16; num += 1) {
    for (const den of [1, 2, 4, 8, 16, 32]) {
      map[_tsKey(num, den)] = `${num}/${den}`;
    }
  }
  // Common time ⠨⠉ ([4,6][1,4]) = 4/4, cut time ⠸⠉ ([4,5,6][1,4]) = 2/2. Sayı işaretsizdir.
  map['46|14'] = 'common';
  map['456|14'] = 'cut common';
  return map;
})();

export const BRAILLE_LETTERS_TR = {
  '1': 'a',
  '12': 'b',
  '14': 'c',
  '145': 'd',
  '15': 'e',
  '124': 'f',
  '1245': 'g',
  '125': 'h',
  '24': 'i',
  '245': 'j',
  '13': 'k',
  '123': 'l',
  '134': 'm',
  '1345': 'n',
  '135': 'o',
  '1234': 'p',
  '12345': 'q',
  '1235': 'r',
  '234': 's',
  '2345': 't',
  '136': 'u',
  '1236': 'v',
  '2456': 'w',
  '1346': 'x',
  '13456': 'y',
  '1356': 'z',
  // Türkçe harfler (MEB Türkçe Braille alfabesi)
  '16': 'ç',
  '126': 'ğ',
  '35': 'ı',
  '246': 'ö',
  '146': 'ş',
  '1256': 'ü',
};

export function dotsToKey(dots = []) {
  return (Array.isArray(dots) ? dots : [])
    .slice()
    .sort((a, b) => a - b)
    .join('');
}

export function dotsToDashKey(dots = []) {
  return (Array.isArray(dots) ? dots : [])
    .slice()
    .sort((a, b) => a - b)
    .join('-');
}

export function brailleCharToDots(char) {
  if (!char || char === ' ' || char === BRAILLE_BLANK) return [];
  const code = char.charCodeAt(0);
  if (code < 0x2800 || code > 0x28ff) return [];

  const value = code - 0x2800;
  const dots = [];
  for (let i = 0; i < 8; i += 1) {
    if (value & (1 << i)) dots.push(i + 1);
  }
  return dots;
}

export function sureAdiAl(index) {
  const sure = SURE_GOSTERGELERI[index];
  return sure?.ad || sure?.label || '';
}
