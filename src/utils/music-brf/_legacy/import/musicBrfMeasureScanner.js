import {
  buildNoteCellCandidateMap,
  buildRestCellCandidateMap,
} from './musicBrailleNoteRegistry.js';

const CLEF_PATTERN = ['345', '34', '123', '5'];

const NOTE_CANDIDATES = buildNoteCellCandidateMap();
const REST_CANDIDATES = buildRestCellCandidateMap();

const BARLINE_PATTERNS = [
  {
    type: 'sectionalBarline',
    label: 'Bolum sonu cizgisi',
    keys: ['126', '13', '3'],
  },
  {
    type: 'finalBarline',
    label: 'Bitis cizgisi',
    keys: ['126', '13'],
  },
  {
    type: 'beginRepeat',
    label: 'Tekrar baslangici',
    keys: ['126', '2356'],
  },
  {
    type: 'beginRepeat',
    label: 'Tekrar baslangici',
    keys: ['2356', '126'],
  },
  {
    type: 'endRepeat',
    label: 'Tekrar sonu',
    keys: ['126', '23'],
  },
];

function isSpaceToken(token) {
  return !token || token.type === 'space' || token.key === '';
}

function isLayoutMarker(token) {
  return ['2'].includes(token?.key);
}

function isMeasureSeparatorToken(token) {
  return (
    token?.key === '23' ||
    token?.key === '25'
  );
}

function barlinePatternAt(tokens = [], index = 0) {
  return BARLINE_PATTERNS.find((pattern) => (
    pattern.keys.every((key, offset) => tokens[index + offset]?.key === key)
  )) || null;
}

function buildBarlineMarkerToken(tokens = [], index = 0, pattern) {
  const parts = tokens.slice(index, index + pattern.keys.length);
  const first = parts[0] || {};

  return {
    type: 'barlineMarker',
    key: `barline:${pattern.type}`,
    barlineType: pattern.type,
    label: pattern.label,
    tokens: parts,
    cells: parts.map((token) => token.cell),
    cell: first.cell,
    lineIndex: first.lineIndex,
    cellIndex: first.cellIndex,
  };
}

function isClefStart(tokens, index) {
  return CLEF_PATTERN.every((key, offset) => tokens[index + offset]?.key === key);
}

function stripLinePrefix(tokens = []) {
  const result = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (isSpaceToken(token) || isLayoutMarker(token)) {
      i += 1;
      continue;
    }

    if (isClefStart(tokens, i)) {
      i += CLEF_PATTERN.length;
      continue;
    }

    // Prefixte number sign ile gelen zaman imzasini muzik akisina sokma.
    if (
      token.key === '3456'
      && tokens[i + 1]?.type === 'cell'
      && tokens[i + 2]?.type === 'cell'
    ) {
      i += 3;
      continue;
    }

    break;
  }

  for (; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (isLayoutMarker(token)) continue;
    result.push(token);
  }

  return result;
}

function splitByMeasureSeparators(tokens = []) {
  const groups = [];
  let current = [];
  let spaceCount = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (isSpaceToken(token)) {
      spaceCount += 1;

      if (spaceCount >= 2 && current.length) {
        groups.push(current);
        current = [];
      }

      continue;
    }

    const barlinePattern = barlinePatternAt(tokens, index);
    if (barlinePattern) {
      if (current.length) {
        groups.push(current);
        current = [];
      }

      groups.push([buildBarlineMarkerToken(tokens, index, barlinePattern)]);
      spaceCount = 0;
      index += barlinePattern.keys.length - 1;
      continue;
    }

    if (isMeasureSeparatorToken(token)) {
      if (current.length) {
        groups.push(current);
        current = [];
      }
      spaceCount = 0;
      continue;
    }

    spaceCount = 0;
    current.push(token);
  }

  if (current.length) {
    groups.push(current);
  }

  return groups;
}

function groupHasPossibleMusic(group = []) {
  return group.some((token) => {
    const key = token?.key;

    if (token?.type === 'barlineMarker') return true;
    if (!key) return false;
    if (isLayoutMarker(token)) return false;
    if (isMeasureSeparatorToken(token)) return false;

    return Boolean(
      NOTE_CANDIDATES?.[key] ||
      REST_CANDIDATES?.[key] ||
      key === '14' ||
      key === '46'
    );
  });
}

function buildMeasureFromGroup(group = [], measureIndex = 0, lineIndex = 0, header = null) {
  const startCellIndex = group[0]?.cellIndex ?? 0;
  const endCellIndex = group[group.length - 1]?.cellIndex ?? startCellIndex;

  return {
    index: measureIndex,
    lineIndex,
    startCellIndex,
    endCellIndex,
    timeSignature: header?.timeSignature?.ad || header?.timeSignature?.gorunum || '4/4',
    keySignature: header?.keySignature || null,
    tokens: group,
    symbols: [],
    notes: [],
    rests: [],
    ties: [],
    slurs: [],
    warnings: [],
  };
}

export function scanBrfMeasures({ lines = [], header, firstMusicLineIndex = -1 }) {
  const warnings = [];

  const ir = {
    header,
    lines: [],
    warnings,
  };

  lines.forEach((line) => {
    const isMusic = firstMusicLineIndex < 0 || line.index >= firstMusicLineIndex;

    if (!isMusic) {
      ir.lines.push({
        index: line.index,
        type: 'header-line',
        text: line.text,
        cells: line.cells,
        tokens: line.rawTokens,
      });
      return;
    }

    const strippedTokens = stripLinePrefix(line.rawTokens || []);
    const measureGroups = splitByMeasureSeparators(strippedTokens)
      .filter(groupHasPossibleMusic);

    ir.lines.push({
      index: line.index,
      type: 'music-line',
      text: line.text,
      cells: line.cells,
      tokens: strippedTokens,
      measures: measureGroups.map((group, measureIndex) => (
        buildMeasureFromGroup(group, measureIndex, line.index, header)
      )),
    });
  });

  return {
    ir,
    warnings,
  };
}
