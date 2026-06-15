import { cellKey } from './musicBrailleCellUtils.js';

import {
  MUZIK_OKTAV_HUCRELERI,
} from '../../music/musicConstants.js';

/**
 * DIKKAT:
 * Buradaki hucreler mevcut projenin data/muzik.js, musicConstants.js ve PDF kurallariyla
 * dogrulanarak genisletilmelidir.
 *
 * Registry mantigi:
 * - import parser bu sembolleri BRF'ten token uretmek icin kullanir.
 * - legend/etiket tarafi da ayni label bilgisinden yararlanabilir.
 * - yeni ozellik eklemek icin cogunlukla bu listeye kayit eklemek yeterlidir.
 */

export const MUSIC_BRAILLE_SYMBOLS = [
  {
    id: 'treble-clef',
    category: 'clef',
    tokenType: 'clef',
    label: 'Sol anahtari',
    value: 'treble',
    cells: [[3, 4, 5], [3, 4], [1, 2, 3], [5]],
  },

  // Sayi / zaman imzasi
  {
    id: 'number-sign',
    category: 'number',
    tokenType: 'numberSign',
    label: 'Sayi isareti',
    cells: [[3, 4, 5, 6]],
  },
  {
    id: 'line-start-bar-number-marker',
    category: 'layout',
    tokenType: 'layoutMarker',
    label: 'Satir basi olcu numarasi isareti',
    cells: [[2]],
  },
  {
    id: 'layout-marker-23',
    category: 'layout',
    tokenType: 'layoutMarker',
    label: 'Layout isareti',
    cells: [[2, 3]],
  },
  {
    id: 'layout-marker-25',
    category: 'layout',
    tokenType: 'layoutMarker',
    label: 'Layout isareti',
    cells: [[2, 5]],
  },

  // Common / cut common
  {
    id: 'common-time',
    category: 'time-signature',
    tokenType: 'timeSignature',
    label: 'Common time',
    value: 'common',
    cells: [[4, 6], [1, 4]],
  },
  {
    id: 'cut-common-time',
    category: 'time-signature',
    tokenType: 'timeSignature',
    label: 'Cut common',
    value: 'cut common',
    cells: [[4, 5, 6], [1, 4]],
  },

  // Donanim / aksidental
  {
    id: 'sharp',
    category: 'accidental',
    tokenType: 'accidental',
    label: 'Diyez',
    value: 'sharp',
    cells: [[1, 4, 6]],
  },
  {
    id: 'flat',
    category: 'accidental',
    tokenType: 'accidental',
    label: 'Bemol',
    value: 'flat',
    cells: [[1, 2, 6]],
  },
  {
    id: 'natural',
    category: 'accidental',
    tokenType: 'accidental',
    label: 'Naturel',
    value: 'natural',
    cells: [[1, 6]],
  },

  // Baglar
  {
    id: 'tie',
    category: 'bag',
    tokenType: 'tieMarker',
    label: 'Tie / uzatma bagi',
    cells: [[4], [1, 4]],
  },
  {
    id: 'single-slur',
    category: 'bag',
    tokenType: 'slurMarker',
    label: 'Slur / legato bagi',
    // TODO: PDF ve mevcut data/muzik.js ile dogrula.
    cells: [[1, 4]],
  },

  // Tekrar / ozel olcu cizgileri
  {
    id: 'begin-repeat',
    category: 'barline',
    tokenType: 'beginRepeat',
    label: 'Tekrar baslangici',
    cells: [[1, 2, 6], [2, 3, 5, 6]],
  },
  {
    id: 'end-repeat',
    category: 'barline',
    tokenType: 'endRepeat',
    label: 'Tekrar sonu',
    // PDF "End Repeat (double bar preceded by dots)" = dots 1 2 6, dots 2 3.
    cells: [[1, 2, 6], [2, 3]],
  },
  {
    id: 'sectional-barline',
    category: 'barline',
    tokenType: 'sectionalBarline',
    label: 'Bolum sonu cizgisi',
    cells: [[1, 2, 6], [1, 3], [3]],
  },
  {
    id: 'final-barline',
    category: 'barline',
    tokenType: 'finalBarline',
    label: 'Bitis cizgisi',
    cells: [[1, 2, 6], [1, 3]],
  },

  // Nokta
  {
    id: 'dot',
    category: 'duration',
    tokenType: 'dot',
    label: 'Noktali uzatma',
    cells: [[3]],
  },
];

export const UPPER_NUMBER_CELLS = {
  1: [1],
  2: [1, 2],
  3: [1, 4],
  4: [1, 4, 5],
  5: [1, 5],
  6: [1, 2, 4],
  7: [1, 2, 4, 5],
  8: [1, 2, 5],
  9: [2, 4],
  0: [2, 4, 5],
};

export const LOWER_NUMBER_CELLS = {
  1: [2],
  2: [2, 3],
  3: [2, 5],
  4: [2, 5, 6],
  5: [2, 6],
  6: [2, 3, 5],
  7: [2, 3, 5, 6],
  8: [2, 3, 6],
  9: [3, 5],
  0: [3, 5, 6],
};

export const UPPER_NUMBER_BY_KEY = Object.fromEntries(
  Object.entries(UPPER_NUMBER_CELLS).map(([digit, dots]) => [cellKey(dots), digit]),
);

export const LOWER_NUMBER_BY_KEY = Object.fromEntries(
  Object.entries(LOWER_NUMBER_CELLS).map(([digit, dots]) => [cellKey(dots), digit]),
);

export const OCTAVE_BY_CELL_KEY = Object.fromEntries(
  MUZIK_OKTAV_HUCRELERI.map((hucre, index) => [
    cellKey(hucre),
    index + 1,
  ]),
);

export function buildSingleCellSymbolMap(symbols = MUSIC_BRAILLE_SYMBOLS) {
  const map = new Map();

  symbols.forEach((symbol) => {
    if (!Array.isArray(symbol.cells) || symbol.cells.length !== 1) return;

    map.set(cellKey(symbol.cells[0]), symbol);
  });

  return map;
}

export function buildMultiCellSymbols(symbols = MUSIC_BRAILLE_SYMBOLS) {
  return symbols
    .filter((symbol) => Array.isArray(symbol.cells) && symbol.cells.length > 1)
    .sort((a, b) => b.cells.length - a.cells.length);
}

export function symbolCellsMatch(cells, index, symbol) {
  if (!Array.isArray(symbol?.cells) || !symbol.cells.length) return false;

  for (let offset = 0; offset < symbol.cells.length; offset += 1) {
    if (cellKey(cells[index + offset]) !== cellKey(symbol.cells[offset])) {
      return false;
    }
  }

  return true;
}
