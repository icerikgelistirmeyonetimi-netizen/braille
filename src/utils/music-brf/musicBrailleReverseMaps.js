import {
  buildNoteCellCandidateMap,
  buildRestCellCandidateMap,
} from './import/musicBrailleNoteRegistry.js';
import {
  UPPER_NUMBER_BY_KEY,
  LOWER_NUMBER_BY_KEY,
  OCTAVE_BY_CELL_KEY,
} from './import/musicBrailleSymbolRegistry.js';

function keyToDash(key = '') {
  return String(key)
    .split('')
    .filter((ch) => /[1-8]/.test(ch))
    .join('-');
}

export function musicBrailleReverseMapsOlustur() {
  const noteByCellKey = new Map();
  const restByCellKey = new Map();
  const accidentalByCellKey = new Map();
  const octaveByCellKey = new Map();
  const barlineByCellKey = new Map();
  const slurTieByCellKey = new Map();

  const noteCandidates = buildNoteCellCandidateMap();
  Object.entries(noteCandidates).forEach(([cellKey, candidates]) => {
    const dashKey = keyToDash(cellKey);
    if (!dashKey || !Array.isArray(candidates) || candidates.length === 0) return;
    noteByCellKey.set(dashKey, candidates);
  });

  const restCandidates = buildRestCellCandidateMap();
  Object.entries(restCandidates).forEach(([cellKey, candidates]) => {
    const dashKey = keyToDash(cellKey);
    if (!dashKey || !Array.isArray(candidates) || candidates.length === 0) return;
    restByCellKey.set(dashKey, candidates);
  });

  accidentalByCellKey.set('1-4-6', { accidental: 'sharp', label: 'diyez' });
  accidentalByCellKey.set('1-2-6', { accidental: 'flat', label: 'bemol' });
  accidentalByCellKey.set('1-6', { accidental: 'natural', label: 'natürel' });

  Object.entries(OCTAVE_BY_CELL_KEY).forEach(([cellKey, octave]) => {
    const dashKey = keyToDash(cellKey);
    if (!dashKey) return;
    octaveByCellKey.set(dashKey, Number(octave));
  });

  barlineByCellKey.set('1-2-6-1-3-3', { tip: 'sectionalBarline', label: 'bölüm sonu çizgisi' });
  barlineByCellKey.set('1-2-6-1-3', { tip: 'finalBarline', label: 'bitiş çizgisi' });
  barlineByCellKey.set('1-2-6-2-3-5-6', { tip: 'beginRepeat', label: 'başlangıç tekrarı' });
  barlineByCellKey.set('1-2-6-2-3', { tip: 'endRepeat', label: 'bitiş tekrarı' });
  slurTieByCellKey.set('1-4', { tip: 'slur', label: 'slur' });
  slurTieByCellKey.set('4', { tip: 'tieLead', label: 'tie başlangıcı' });

  return {
    noteByCellKey,
    restByCellKey,
    accidentalByCellKey,
    octaveByCellKey,
    barlineByCellKey,
    slurTieByCellKey,
    numberMaps: {
      upper: UPPER_NUMBER_BY_KEY,
      lower: LOWER_NUMBER_BY_KEY,
    },
  };
}
