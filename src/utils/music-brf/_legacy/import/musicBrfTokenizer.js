import { cellKey } from './musicBrailleCellUtils.js';

import {
  MUSIC_BRAILLE_SYMBOLS,
  buildMultiCellSymbols,
  buildSingleCellSymbolMap,
  symbolCellsMatch,
  UPPER_NUMBER_BY_KEY,
  LOWER_NUMBER_BY_KEY,
  OCTAVE_BY_CELL_KEY,
} from './musicBrailleSymbolRegistry.js';

import {
  buildNoteCellCandidateMap,
  buildRestCellCandidateMap,
} from './musicBrailleNoteRegistry.js';

const SYMBOL_SINGLE_MAP = buildSingleCellSymbolMap(MUSIC_BRAILLE_SYMBOLS);
const SYMBOL_MULTI = buildMultiCellSymbols(MUSIC_BRAILLE_SYMBOLS);

const NOTE_CELL_CANDIDATE_MAP = buildNoteCellCandidateMap();
const REST_CELL_CANDIDATE_MAP = buildRestCellCandidateMap();

const NUMBER_SIGN_KEY = cellKey([3, 4, 5, 6]);
const DOT_KEY = cellKey([3]);

function parseMultiCellSymbol(cells, index) {
  for (const symbol of SYMBOL_MULTI) {
    if (symbolCellsMatch(cells, index, symbol)) {
      return {
        token: {
          type: symbol.tokenType,
          symbolId: symbol.id,
          category: symbol.category,
          label: symbol.label,
          value: symbol.value,
          ad: symbol.value,
          cells: cells.slice(index, index + symbol.cells.length),
        },
        nextIndex: index + symbol.cells.length,
      };
    }
  }

  return null;
}

function parseNumericTimeSignature(cells, index) {
  if (cellKey(cells[index]) !== NUMBER_SIGN_KEY) return null;

  const upper = UPPER_NUMBER_BY_KEY[cellKey(cells[index + 1])];
  const lower = LOWER_NUMBER_BY_KEY[cellKey(cells[index + 2])];

  if (!upper || !lower) return null;

  return {
    token: {
      type: 'timeSignature',
      ad: `${upper}/${lower}`,
      cells: cells.slice(index, index + 3),
    },
    nextIndex: index + 3,
  };
}

function parseKeySignature(cells, index) {
  const sharpKey = cellKey([1, 4, 6]);
  const flatKey = cellKey([1, 2, 6]);
  const numberSignKey = cellKey([3, 4, 5, 6]);

  if (cellKey(cells[index]) === numberSignKey) {
    const digit = UPPER_NUMBER_BY_KEY[cellKey(cells[index + 1])];
    const accidentalKey = cellKey(cells[index + 2]);

    const count = parseInt(digit, 10);
    const isSharp = accidentalKey === sharpKey;
    const isFlat = accidentalKey === flatKey;

    if (Number.isFinite(count) && count >= 4 && count <= 7 && (isSharp || isFlat)) {
      const accidentalCell = isSharp ? [1, 4, 6] : [1, 2, 6];
      const accidentalName = isSharp ? 'diyezli' : 'bemollu';
      const accidentalSymbol = isSharp ? '♯' : '♭';

      return {
        token: {
          type: 'keySignature',
          ad: `${count} ${accidentalName} donanim`,
          gorunum: accidentalSymbol.repeat(count),
          hucreler: [
            [3, 4, 5, 6],
            [...cells[index + 1]],
            accidentalCell,
          ],
          cells: cells.slice(index, index + 3),
          count,
          accidental: isSharp ? 'sharp' : 'flat',
          compactNumeric: true,
        },
        nextIndex: index + 3,
      };
    }
  }

  let i = index;
  let sharpCount = 0;
  let flatCount = 0;

  while (cellKey(cells[i]) === sharpKey) {
    sharpCount += 1;
    i += 1;
  }

  while (cellKey(cells[i]) === flatKey) {
    flatCount += 1;
    i += 1;
  }

  if (sharpCount > 0 && sharpCount <= 3) {
    return {
      token: {
        type: 'keySignature',
        ad: `${sharpCount} diyezli donanim`,
        gorunum: '♯'.repeat(sharpCount),
        hucreler: Array.from({ length: sharpCount }, () => [1, 4, 6]),
        cells: cells.slice(index, i),
        count: sharpCount,
        accidental: 'sharp',
        compactNumeric: false,
      },
      nextIndex: i,
    };
  }

  if (flatCount > 0 && flatCount <= 3) {
    return {
      token: {
        type: 'keySignature',
        ad: `${flatCount} bemollu donanim`,
        gorunum: '♭'.repeat(flatCount),
        hucreler: Array.from({ length: flatCount }, () => [1, 2, 6]),
        cells: cells.slice(index, i),
        count: flatCount,
        accidental: 'flat',
        compactNumeric: false,
      },
      nextIndex: i,
    };
  }

  return null;
}

function parseOctave(cells, index) {
  const octave = OCTAVE_BY_CELL_KEY[cellKey(cells[index])];

  if (!octave) return null;

  return {
    token: {
      type: 'octave',
      octave,
      cells: [cells[index]],
    },
    nextIndex: index + 1,
  };
}

function parseSingleCellSymbol(cells, index) {
  const symbol = SYMBOL_SINGLE_MAP.get(cellKey(cells[index]));

  if (!symbol) return null;

  return {
    token: {
      type: symbol.tokenType,
      symbolId: symbol.id,
      category: symbol.category,
      label: symbol.label,
      value: symbol.value,
      cells: [cells[index]],
    },
    nextIndex: index + 1,
  };
}

function parseNote(cells, index, context) {
  const candidates = NOTE_CELL_CANDIDATE_MAP[cellKey(cells[index])];

  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  let nextIndex = index + 1;
  let dotted = false;

  if (cellKey(cells[nextIndex]) === DOT_KEY) {
    dotted = true;
    nextIndex += 1;
  }

  return {
    token: {
      type: 'noteCandidate',
      candidates: candidates.map((candidate) => ({
        ...candidate,
        oktav: context.currentOctave || 4,
        accidental: context.pendingAccidental || null,
        dotted,
      })),
      cellKey: cellKey(cells[index]),
      cells: cells.slice(index, nextIndex),
    },
    nextIndex,
  };
}

function parseRest(cells, index) {
  const candidates = REST_CELL_CANDIDATE_MAP[cellKey(cells[index])];

  if (!Array.isArray(candidates) || candidates.length === 0) return null;

  let nextIndex = index + 1;
  let dotted = false;

  if (cellKey(cells[nextIndex]) === DOT_KEY) {
    dotted = true;
    nextIndex += 1;
  }

  return {
    token: {
      type: 'restCandidate',
      candidates: candidates.map((candidate) => ({
        ...candidate,
        dotted,
      })),
      cellKey: cellKey(cells[index]),
      cells: cells.slice(index, nextIndex),
    },
    nextIndex,
  };
}

export function tokenizeBrfCells(cells = []) {
  const tokens = [];
  const warnings = [];

  const context = {
    currentOctave: 4,
    pendingAccidental: null,
  };

  let i = 0;

  while (i < cells.length) {
    if (cellKey(cells[i]) === '') {
      tokens.push({
        type: 'layoutSpace',
        cells: [cells[i]],
      });

      i += 1;
      continue;
    }

    const multi = parseMultiCellSymbol(cells, i);
    if (multi) {
      tokens.push(multi.token);
      i = multi.nextIndex;
      continue;
    }

    const numericTime = parseNumericTimeSignature(cells, i);
    if (numericTime) {
      tokens.push(numericTime.token);
      i = numericTime.nextIndex;
      continue;
    }

    const keySignature = parseKeySignature(cells, i);
    if (keySignature) {
      tokens.push(keySignature.token);
      i = keySignature.nextIndex;
      continue;
    }

    const octave = parseOctave(cells, i);
    if (octave) {
      context.currentOctave = octave.token.octave;
      tokens.push(octave.token);
      i = octave.nextIndex;
      continue;
    }

    const accidental = parseSingleCellSymbol(cells, i);
    if (accidental && accidental.token.type === 'accidental') {
      context.pendingAccidental = accidental.token.value;
      tokens.push(accidental.token);
      i = accidental.nextIndex;
      continue;
    }

    const note = parseNote(cells, i, context);
    if (note) {
      tokens.push(note.token);
      context.pendingAccidental = null;
      i = note.nextIndex;
      continue;
    }

    const rest = parseRest(cells, i);
    if (rest) {
      tokens.push(rest.token);
      i = rest.nextIndex;
      continue;
    }

    const symbol = parseSingleCellSymbol(cells, i);

    if (symbol) {
      tokens.push(symbol.token);
      i = symbol.nextIndex;
      continue;
    }

    const unknown = {
      type: 'unknown',
      cell: cells[i],
      key: cellKey(cells[i]),
      cells: [cells[i]],
    };

    tokens.push(unknown);
    warnings.push({
      type: 'brf-tokenizer-unknown-cell',
      message: `Cozumlenemeyen Braille hucresi: ${unknown.key}`,
      token: unknown,
    });

    i += 1;
  }

  return {
    tokens,
    warnings,
  };
}
