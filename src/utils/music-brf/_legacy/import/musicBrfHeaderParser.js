import { cellKey, cellsEqual } from './musicBrailleCellUtils.js';

import {
  UPPER_NUMBER_BY_KEY,
  LOWER_NUMBER_BY_KEY,
} from './musicBrailleSymbolRegistry.js';

import {
  buildNoteCellCandidateMap,
  buildRestCellCandidateMap,
} from './musicBrailleNoteRegistry.js';

const NUMBER_SIGN = [3, 4, 5, 6];
const CLEF_PATTERN = ['345', '34', '123', '5'];
const NOTE_CANDIDATES = buildNoteCellCandidateMap();
const REST_CANDIDATES = buildRestCellCandidateMap();

const BRAILLE_LETTERS_TR = {
  1: 'a',
  12: 'b',
  14: 'c',
  145: 'd',
  15: 'e',
  124: 'f',
  1245: 'g',
  125: 'h',
  24: 'i',
  245: 'j',
  13: 'k',
  123: 'l',
  134: 'm',
  1345: 'n',
  135: 'o',
  1234: 'p',
  12345: 'q',
  1235: 'r',
  234: 's',
  2345: 't',
  136: 'u',
  1236: 'v',
  2456: 'w',
  1346: 'x',
  13456: 'y',
  1356: 'z',
};

function parseTimeSignatureAt(cells, index) {
  if (!cellsEqual(cells[index], NUMBER_SIGN)) return null;

  const upper = UPPER_NUMBER_BY_KEY[cellKey(cells[index + 1])];
  const lower = LOWER_NUMBER_BY_KEY[cellKey(cells[index + 2])];

  if (!upper || !lower) return null;

  return {
    value: `${upper}/${lower}`,
    start: index,
    end: index + 2,
  };
}

function findTimeSignature(line) {
  for (let i = 0; i < (line?.cells || []).length; i += 1) {
    const found = parseTimeSignatureAt(line.cells, i);
    if (found) return found;
  }

  return null;
}

function hasTrebleClef(line) {
  const keys = (line.rawTokens || []).map((t) => t.key);

  for (let i = 0; i <= keys.length - CLEF_PATTERN.length; i += 1) {
    const match = CLEF_PATTERN.every((key, offset) => (
      keys[i + offset] === key
    ));

    if (match) return true;
  }

  return false;
}

function brailleLineToPlainText(line) {
  return (line.rawTokens || [])
    .map((token) => {
      if (!token.key) return ' ';
      return BRAILLE_LETTERS_TR[token.key] || '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function isMostlyTextLine(line) {
  const nonSpaceTokens = (line.rawTokens || []).filter((t) => t.key);
  if (!nonSpaceTokens.length) return false;

  const letterCount = nonSpaceTokens.filter((t) => BRAILLE_LETTERS_TR[t.key]).length;

  return letterCount >= Math.max(2, Math.ceil(nonSpaceTokens.length * 0.7));
}

function classifyBrfLine(line) {
  const timeSignature = findTimeSignature(line);

  if (timeSignature) {
    return {
      type: 'time-signature-line',
      timeSignature: {
        ad: timeSignature.value,
        start: timeSignature.start,
        end: timeSignature.end,
      },
    };
  }

  if (hasTrebleClef(line)) {
    return {
      type: 'music-line',
    };
  }

  const tokens = line.rawTokens || [];
  if (isMostlyTextLine(line) && !hasMusicControlMarkers(tokens)) {
    return {
      type: 'text-line',
      text: brailleLineToPlainText(line),
    };
  }

  if (hasMusicControlMarkers(tokens) || includesMusicalCells(tokens)) {
    return {
      type: 'music-line',
    };
  }

  return {
    type: 'unknown-line',
  };
}

function hasMusicControlMarkers(tokens = []) {
  const markerKeys = new Set([
    '345',
    '3456',
    '146',
    '126',
    '16',
    '4',
    '45',
    '46',
    '56',
    '6',
    '23',
    '25',
  ]);

  return (tokens || []).some((token) => markerKeys.has(token?.key));
}

function includesMusicalCells(tokens = []) {
  return tokens.some((t) => NOTE_CANDIDATES[t.key] || REST_CANDIDATES[t.key]);
}

export function parseBrfHeader(lines = []) {
  const warnings = [];

  const header = {
    title: '',
    composer: '',
    lyricist: '',
    tempo: '',
    keySignature: null,
    timeSignature: null,
    clef: 'treble',
  };

  const classifiedLines = lines.map((line) => ({
    ...line,
    classification: classifyBrfLine(line),
  }));

  let firstMusicLineIndex = -1;

  for (const line of classifiedLines) {
    const cls = line.classification;

    if (cls.type === 'text-line' && !header.title) {
      header.title = cls.text;
      continue;
    }

    if (cls.type === 'time-signature-line' && !header.timeSignature) {
      header.timeSignature = {
        ad: cls.timeSignature.ad,
        gorunum: cls.timeSignature.ad,
      };
      continue;
    }

    if (cls.type === 'music-line') {
      firstMusicLineIndex = line.index;
      break;
    }
  }

  if (!header.timeSignature) {
    header.timeSignature = {
      ad: '4/4',
      gorunum: '4/4',
    };

    warnings.push({
      type: 'brf-header-time-default',
      message: 'BRF icinde zaman imzasi bulunamadi; 4/4 varsayildi.',
    });
  }

  return {
    header,
    classifiedLines,
    firstMusicLineIndex,
    warnings,
  };
}
