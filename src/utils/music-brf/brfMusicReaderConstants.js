import { SURE_GOSTERGELERI } from '../../data/muzik.js';

export const BRAILLE_BLANK = '⠀';

export const TIME_SIGNATURE_PATTERNS = {
  '3456|12|256': '2/4',
  '3456|14|256': '3/4',
  '3456|145|256': '4/4',
  '3456|124|235': '6/8',
  '3456|245|235': '10/8',
};

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
