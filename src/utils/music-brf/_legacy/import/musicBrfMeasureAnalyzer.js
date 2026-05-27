import { OCTAVE_BY_CELL_KEY } from './musicBrailleSymbolRegistry.js';

import {
  buildNoteCellCandidateMap,
  buildRestCellCandidateMap,
} from './musicBrailleNoteRegistry.js';

const NOTE_CANDIDATES = buildNoteCellCandidateMap();
const REST_CANDIDATES = buildRestCellCandidateMap();

const TREBLE_CLEF_PATTERN = ['345', '34', '123', '5'];
const AUGMENTATION_DOT_KEY = '3';

const ACCIDENTAL_BY_KEY = {
  '146': 'sharp',
  '126': 'flat',
  '16': 'natural',
};

const NOTA_DIATONIC_INDEX = {
  do: 0,
  re: 1,
  mi: 2,
  fa: 3,
  sol: 4,
  la: 5,
  si: 6,
};

function isOctaveKey(key) {
  return Boolean(OCTAVE_BY_CELL_KEY[key]);
}

function isLayoutKey(key) {
  return [
    '',
    '0',
    '2',
    '23',
    '25',
  ].includes(String(key || ''));
}

function isMeasureSeparatorKey(key) {
  return [
    '23',
    '25',
  ].includes(String(key || ''));
}

function isSlurKey(key) {
  return String(key || '') === '14';
}

function isTieStart(tokens, index) {
  return (
    String(tokens[index]?.key || '') === '4' &&
    String(tokens[index + 1]?.key || '') === '14'
  );
}

function isSingleSlurKey(key) {
  return String(key || '') === '14';
}

function isClefPartKey(key) {
  return [
    '345',
    '34',
    '123',
    '5',
  ].includes(String(key || ''));
}

function isClefStart(tokens, index) {
  return TREBLE_CLEF_PATTERN.every((key, offset) => (
    tokens[index + offset]?.key === key
  ));
}

function nextRealToken(tokens, index) {
  for (let i = index + 1; i < tokens.length; i += 1) {
    const key = tokens[i]?.key;
    if (!key || isLayoutKey(key)) continue;
    return tokens[i];
  }

  return null;
}

function isLikelyOctaveMarker(tokens, index) {
  const token = tokens[index];
  const key = token?.key;

  if (!isOctaveKey(key)) return false;

  const next = nextRealToken(tokens, index);

  return Boolean(NOTE_CANDIDATES[next?.key]);
}

function diatonicPosition(notaAd, octave) {
  const index = NOTA_DIATONIC_INDEX[String(notaAd || '').toLocaleLowerCase('tr')];
  if (!Number.isFinite(index)) return null;
  return Number(octave || 4) * 7 + index;
}

function noteInterval(prevNote, notaAd, octave) {
  const prevPosition = diatonicPosition(prevNote?.notaAd, prevNote?.oktav);
  const currentPosition = diatonicPosition(notaAd, octave);
  if (!Number.isFinite(prevPosition) || !Number.isFinite(currentPosition)) return null;
  return Math.abs(currentPosition - prevPosition) + 1;
}

function inferOctaveForCandidate(context, currentOctave, pendingOctave, notaAd) {
  if (pendingOctave != null && Number.isFinite(Number(pendingOctave))) {
    return Number(pendingOctave);
  }

  const prevNote = context.lastNote;
  const fallbackOctave = Number.isFinite(Number(currentOctave)) ? Number(currentOctave) : 4;

  if (!prevNote || !prevNote.notaAd) {
    return fallbackOctave;
  }

  const candidates = [];
  for (let octave = 1; octave <= 7; octave += 1) {
    const interval = noteInterval(prevNote, notaAd, octave);
    if (!Number.isFinite(interval)) continue;

    const validWithoutOctaveSign = (
      interval <= 3 ||
      (interval <= 5 && octave === Number(prevNote.oktav || fallbackOctave))
    );

    if (!validWithoutOctaveSign) continue;

    candidates.push({ octave, interval, distance: Math.abs(octave - fallbackOctave) });
  }

  if (!candidates.length) return fallbackOctave;

  return candidates
    .sort((a, b) => a.interval - b.interval || a.distance - b.distance)[0]
    .octave;
}

function analyzeMeasure(measure, context) {
  const analyzed = {
    ...measure,
    symbols: [],
    noteCandidates: [],
    restCandidates: [],
    slurMarkers: [],
    tieMarkers: [],
    unknown: [],
  };

  let currentOctave = context.currentOctave || 4;
  let pendingAccidental = null;
  let pendingOctave = null;

  const tokens = measure.tokens || [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    const key = token?.key;

    if (token?.type === 'barlineMarker') {
      analyzed.symbols.push({
        type: 'barline',
        value: token.barlineType,
        label: token.label,
        token,
      });
      continue;
    }

    if (!key) continue;

    if (isLayoutKey(key)) {
      analyzed.symbols.push({
        type: 'layout',
        token,
      });
      continue;
    }

    if (isMeasureSeparatorKey(key)) {
      analyzed.symbols.push({
        type: 'measureSeparator',
        token,
      });
      continue;
    }

    if (isClefStart(tokens, i)) {
      analyzed.symbols.push({
        type: 'clefPart',
        token,
      });
      i += TREBLE_CLEF_PATTERN.length - 1;
      continue;
    }

    if (isClefPartKey(key)) {
      analyzed.symbols.push({
        type: 'clefPart',
        token,
      });
      continue;
    }

    if (isLikelyOctaveMarker(tokens, i)) {
      currentOctave = OCTAVE_BY_CELL_KEY[key];
      pendingOctave = currentOctave;
      analyzed.symbols.push({
        type: 'octave',
        octave: currentOctave,
        token,
      });
      continue;
    }

    if (ACCIDENTAL_BY_KEY[key]) {
      pendingAccidental = ACCIDENTAL_BY_KEY[key];
      analyzed.symbols.push({
        type: 'accidental',
        value: pendingAccidental,
        token,
      });
      continue;
    }

    if (isTieStart(tokens, i)) {
      analyzed.tieMarkers.push({
        type: 'tieMarker',
        token,
        cells: [tokens[i].cell, tokens[i + 1]?.cell],
        afterCandidateIndex: analyzed.noteCandidates.length - 1,
      });
      i += 1;
      continue;
    }

    if (isSingleSlurKey(key)) {
      analyzed.slurMarkers.push({
        type: 'slurMarker',
        token,
        afterCandidateIndex: analyzed.noteCandidates.length - 1,
      });
      continue;
    }

    const restCandidates = REST_CANDIDATES[key];

    if (Array.isArray(restCandidates) && restCandidates.length) {
      let dotted = false;
      const nextToken = tokens[i + 1];

      if (nextToken?.key === AUGMENTATION_DOT_KEY) {
        dotted = true;
        i += 1;
      }

      analyzed.restCandidates.push({
        type: 'restCandidate',
        token,
        key,
        dotted,
        dotToken: dotted ? nextToken : null,
        candidates: restCandidates.map((candidate) => ({
          ...candidate,
          dotted,
        })),
      });
      continue;
    }

    const noteCandidates = NOTE_CANDIDATES[key];

    if (Array.isArray(noteCandidates) && noteCandidates.length) {
      let dotted = false;
      const nextToken = tokens[i + 1];

      if (nextToken?.key === AUGMENTATION_DOT_KEY) {
        dotted = true;
        i += 1;
      }

      const inferredOctave = inferOctaveForCandidate(
        context,
        currentOctave,
        pendingOctave,
        noteCandidates[0]?.notaAd,
      );

      analyzed.noteCandidates.push({
        type: 'noteCandidate',
        token,
        key,
        dotted,
        dotToken: dotted ? nextToken : null,
        candidates: noteCandidates.map((candidate) => ({
          ...candidate,
          oktav: inferredOctave,
          accidental: pendingAccidental,
          dotted,
        })),
      });

      currentOctave = inferredOctave;
      context.lastNote = {
        notaAd: noteCandidates[0]?.notaAd,
        oktav: inferredOctave,
      };
      pendingOctave = null;
      pendingAccidental = null;
      continue;
    }

    if (key === AUGMENTATION_DOT_KEY) {
      analyzed.symbols.push({
        type: 'augmentationDot',
        token,
        key,
        warning: 'Bağlanamayan noktalı nota işareti',
      });
      continue;
    }

    analyzed.unknown.push({
      type: 'unknown',
      token,
      key,
    });
  }

  context.currentOctave = currentOctave;

  return analyzed;
}

export function analyzeBrfMeasures({ ir, header }) {
  const warnings = [];

  const context = {
    currentOctave: 4,
  };

  const lines = (ir.lines || []).map((line) => {
    if (line.type !== 'music-line') return line;

    return {
      ...line,
      measures: (line.measures || []).map((measure) => (
        analyzeMeasure(measure, context)
      )),
    };
  });

  return {
    ir: {
      ...ir,
      header,
      lines,
    },
    warnings,
  };
}
