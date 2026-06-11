import {
  BRAILLE_LETTERS_TR,
  TIME_SIGNATURE_PATTERNS,
  dotsToDashKey,
  dotsToKey,
  brailleCharToDots,
  sureAdiAl,
} from './brfMusicReaderConstants.js';
import { asciiBrfToUnicodeBraille } from './import/musicBrailleCellUtils.js';
import { SURE_GOSTERGELERI } from '../../data/muzik.js';
import { MUZIK_ALT_RAKAM } from '../music/musicConstants.js';
import { musicBrailleReverseMapsOlustur } from './musicBrailleReverseMaps.js';

const REVERSE_MAPS = musicBrailleReverseMapsOlustur();

// Alt-hücre (lower-cell) rakamları: ölçü numarası vb. için kullanılır.
// dash anahtarı → rakam karakteri eşlemesi (ör. '2-3' → '2').
const LOWER_DIGIT_BY_DASH = new Map(
  Object.entries(MUZIK_ALT_RAKAM || {}).map(([digit, dots]) => [
    (Array.isArray(dots) ? dots : []).slice().sort((a, b) => a - b).join('-'),
    digit,
  ]),
);

const NOTA_DIATONIC_INDEX = {
  do: 0,
  re: 1,
  mi: 2,
  fa: 3,
  sol: 4,
  la: 5,
  si: 6,
};

function nowId(prefix, n) {
  return `${prefix}-${Date.now()}-${n}`;
}

let MODIFIER_ID_SAYACI = 0;
function yeniModifierId() {
  MODIFIER_ID_SAYACI += 1;
  return `mod-imp-${MODIFIER_ID_SAYACI}`;
}

// tokens[i] konumundan başlayarak, en uzun süsleme/nüans/dinamik
// hücre dizisini eşleştirir. Bulursa { entry, length } döndürür.
function matchModifierSequence(tokens, i) {
  const map = REVERSE_MAPS.modifierByCellKey;
  if (!map || map.size === 0) return null;
  const maxLen = Math.min(REVERSE_MAPS.modifierMaxLen || 1, tokens.length - i);

  for (let len = maxLen; len >= 1; len -= 1) {
    const parcalar = [];
    let gecerli = true;
    for (let k = 0; k < len; k += 1) {
      const t = tokens[i + k];
      if (!t || t.type !== 'braille') { gecerli = false; break; }
      parcalar.push(dotsToDashKey(t.dots));
    }
    if (!gecerli) continue;
    const seqKey = parcalar.join('|');
    const entry = map.get(seqKey);
    if (entry) return { entry, length: len };
  }

  return null;
}

// Notaya bağlanacak bir modifier kaydını ilgili notaya (oncesi → bekleyen,
// sonrasi → son nota) iliştirir.
function attachModifierToNote(noteItem, yon, kayit) {
  if (!noteItem) return;
  if (!noteItem.modifiers || typeof noteItem.modifiers !== 'object') {
    noteItem.modifiers = { oncesi: [], sonrasi: [] };
  }
  const yer = yon === 'sonrasi' ? 'sonrasi' : 'oncesi';
  const mevcut = Array.isArray(noteItem.modifiers[yer]) ? noteItem.modifiers[yer] : [];
  noteItem.modifiers[yer] = [...mevcut, { id: yeniModifierId(), kayit }];
}

// Bekleyen "oncesi" modifierleri yeni oluşan notaya yükler.
function flushPendingModifiers(context, noteItem) {
  const bekleyen = Array.isArray(context.pendingModifiers) ? context.pendingModifiers : [];
  if (bekleyen.length === 0) return;
  for (const m of bekleyen) {
    attachModifierToNote(noteItem, 'oncesi', m.kayit);
  }
  context.pendingModifiers = [];
}

export function normalizeBrfText(brfText = '') {
  const raw = String(brfText || '').replace(/\r\n?/g, '\n');

  const hasUnicodeBraille = Array.from(raw).some((ch) => {
    const code = ch.charCodeAt(0);
    return code >= 0x2800 && code <= 0x28ff;
  });

  return hasUnicodeBraille ? raw : asciiBrfToUnicodeBraille(raw);
}

export function createReaderContext(options = {}) {
  return {
    header: {
      title: '',
      timeSignature: null,
      keySignature: null,
      tempo: '',
    },
    currentOctave: 4,
    pendingOctave: null,
    pendingAccidental: null,
    pendingModifiers: [],
    pendingTie: null,
    pendingTieFromId: null,
    activeMeasure: 1,
    items: [],
    cells: [],
    warnings: [],
    expectedMeasure16: null,
    measureProgress16: 0,
    lastSeparatorCreatedBarline: false,
    lineIndex: 0,
    cellIndex: 0,
    options,
    seq: 0,
    baglar: [],
    lastNote: null,
    noteSequence: [],
    slurMarkers: [],
  };
}

export function setReaderTimeSignature(context, value) {
  if (!value) return;
  context.header.timeSignature = {
    ad: value,
    gorunum: value,
  };
  context.expectedMeasure16 = timeSignatureExpected16(value);
  context.measureProgress16 = 0;
  context.activeMeasure = 1;
}

function timeSignatureExpected16(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'common' || raw === 'c' || raw === 'cut common') return 16;
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(raw);
  if (!m) return null;
  const top = Number(m[1]);
  const bottom = Number(m[2]);
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= 0) return null;
  return top * (16 / bottom);
}

function duration16(candidate) {
  const realValue = Number(candidate?.realValue || 0);
  if (!realValue) return 0;

  let value = 16 / realValue;

  const dotCount = Number(candidate?.dotCount || 0);
  if (dotCount > 0) {
    value *= 2 - Math.pow(2, -dotCount);
    return value;
  }

  if (candidate?.dotted) {
    value *= 1.5;
  }

  return value;
}

function sureByRealValue(realValue) {
  return SURE_GOSTERGELERI.find((sure) => Number(sure.realValue) === Number(realValue)) || null;
}

function sureIndexByRealValue(realValue) {
  const idx = SURE_GOSTERGELERI.findIndex((sure) => Number(sure.realValue) === Number(realValue));
  return idx >= 0 ? idx : 0;
}

function isPitchOnlyCell(cell) {
  const dots = Array.isArray(cell?.dots) ? cell.dots : [];
  return !dots.includes(3) && !dots.includes(6);
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

function inferOctaveForNote(context, notaAd) {
  if (context.pendingOctave != null && Number.isFinite(Number(context.pendingOctave))) {
    return Number(context.pendingOctave);
  }

  const prevNote = context.lastNote;
  const currentOctave = Number.isFinite(Number(context.currentOctave))
    ? Number(context.currentOctave)
    : 4;

  if (!prevNote || !prevNote.notaAd) {
    return currentOctave;
  }

  const candidates = [];
  for (let octave = 1; octave <= 7; octave += 1) {
    const interval = noteInterval(prevNote, notaAd, octave);
    if (!Number.isFinite(interval)) continue;

    const validWithoutOctaveSign = (
      interval <= 3 ||
      (interval <= 5 && octave === Number(prevNote.oktav || currentOctave))
    );

    if (!validWithoutOctaveSign) continue;

    candidates.push({ octave, interval, distance: Math.abs(octave - currentOctave) });
  }

  if (!candidates.length) return currentOctave;

  return candidates
    .sort((a, b) => a.interval - b.interval || a.distance - b.distance)[0]
    .octave;
}

function applyMeasurePosition(context, item, value16) {
  const expected = Number(context.expectedMeasure16 || 0);
  const duration = Number(value16 || 0);

  item.measureNo = context.activeMeasure;

  if (duration > 0) {
    const nextProgress = Number(context.measureProgress16 || 0) + duration;

    if (expected > 0 && nextProgress > expected + 0.0001) {
      context.warnings.push({
        type: 'measure-overflow',
        measureNo: context.activeMeasure,
        message: `${context.activeMeasure}. ölçü hedef süreyi aştı: ${nextProgress}/${expected}`,
        itemId: item.id,
      });
    }

    context.measureProgress16 = nextProgress;
  }

  return item;
}

function oncekiNotaVeyaSusItemAl(context) {
  const items = Array.isArray(context.items) ? context.items : [];
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    if (item?.tip === 'nota' || item?.tip === 'sus') {
      return item;
    }
  }
  return null;
}

function augmentationDotFactor(dotCount = 1) {
  if (!Number.isFinite(Number(dotCount)) || dotCount <= 0) return 1;
  return 2 - Math.pow(2, -dotCount);
}

function applyAugmentationDotToPreviousItem(cell, context) {
  const target = oncekiNotaVeyaSusItemAl(context);
  if (!target) {
    const warning = 'Nokta işareti önceki nota/sus olmadan geldi.';
    context.warnings.push({
      type: 'augmentation-dot-no-source',
      lineIndex: cell.lineIndex,
      cellIndex: cell.cellIndex,
      message: warning,
    });
    return pushDebug(context, cell, {
      category: 'augmentation-dot',
      meaning: 'noktalı işareti; uygulama kaynağı bulunamadı',
      effect: 'uyarı üretildi',
      warning,
      itemId: null,
    });
  }

  const baseDuration16 = Number(target.realValue)
    ? 16 / Number(target.realValue)
    : Number(target.duration16 || target.sure16 || 0);
  if (!baseDuration16) {
    const warning = 'Noktalı işareti uygulanabilecek önceki öğe bulundu ancak süre hesaplanamadı.';
    context.warnings.push({
      type: 'augmentation-dot-invalid-target',
      lineIndex: cell.lineIndex,
      cellIndex: cell.cellIndex,
      message: warning,
    });
    return pushDebug(context, cell, {
      category: 'augmentation-dot',
      meaning: 'noktalı işareti; süre bulunamadı',
      effect: 'uyarı üretildi',
      warning,
      itemId: target.id,
    });
  }

  const previousDotCount = Number(target.dotCount || 0);
  const nextDotCount = previousDotCount + 1;
  const newDuration16 = baseDuration16 * augmentationDotFactor(nextDotCount);
  const oldDuration16 = Number(target.duration16 || target.sure16 || 0);
  const addedDuration = newDuration16 - oldDuration16;

  target.dotted = true;
  target.dotCount = nextDotCount;
  target.duration16 = newDuration16;
  if (Number.isFinite(addedDuration) && Math.abs(addedDuration) > 0.000001) {
    context.measureProgress16 += addedDuration;
  }

  return pushDebug(context, cell, {
    category: 'augmentation-dot',
    meaning: 'noktalı işareti',
    effect: `önceki ${target.tip} öğesine uygulandı`,
    itemId: target.id,
  });
}

function remainingMinDuration16(tokens, fromIndex, context) {
  const NOTE_KEYS = REVERSE_MAPS.noteByCellKey;
  const REST_KEYS = REVERSE_MAPS.restByCellKey;
  let min16 = 0;
  let i = fromIndex;

  while (i < tokens.length) {
    const cell = tokens[i];
    if (!cell) { i++; continue; }

    // Boşluk hücresi = ölçü ayracı → bu ölçü burada biter, dur
    if (cell.type === 'space' || !cell.dots || !cell.dots.length) break;

    if (cell.type !== 'braille') { i++; continue; }

    const rawKey = dotsToKey(cell.dots || []);
    const dashKey = dotsToDashKey(cell.dots || []);

    if (rawKey === '23' || rawKey === '25') break;

    if (rawKey === '126') {
      const next = tokens[i + 1];
      const nextKey = next ? dotsToKey(next.dots || []) : '';
      if (nextKey === '23' || nextKey === '13' || nextKey === '2356') break;
    }
    if (rawKey === '2356') break;

    if (
      REVERSE_MAPS.octaveByCellKey.has(dashKey) ||
      REVERSE_MAPS.accidentalByCellKey.has(dashKey) ||
      rawKey === '3' ||
      rawKey === '4' ||
      rawKey === '14' ||
      rawKey === '126'
    ) {
      i++;
      continue;
    }

    const noteCandidates = NOTE_KEYS.get(dashKey);
    const restCandidates = REST_KEYS.get(dashKey);

    if (Array.isArray(noteCandidates) && noteCandidates.length > 0) {
      const nextCell = tokens[i + 1];
      const hasAugDot = nextCell && dotsToKey(nextCell.dots || []) === '3';
      const dotFactor = hasAugDot ? 1.5 : 1.0;
      const minRv = Math.max(...noteCandidates.map((c) => Number(c.realValue)));
      min16 += (16 / minRv) * dotFactor;
    } else if (Array.isArray(restCandidates) && restCandidates.length > 0) {
      const minRv = Math.max(...restCandidates.map((c) => Number(c.realValue)));
      min16 += 16 / minRv;
    }

    i++;
  }

  return min16;
}

function candidateScore(candidate, context, lookaheadDotted = false) {
  const expected = Number(context.expectedMeasure16 || 0);
  const remaining = expected > 0 ? expected - Number(context.measureProgress16 || 0) : 0;
  const dur = duration16({ ...candidate, dotted: lookaheadDotted });

  let score = 0;
  if (remaining > 0 && dur <= remaining + 0.0001) score += 100;
  if (remaining > 0 && Math.abs(dur - remaining) < 0.0001) score += 120;
  if (candidate.realValue === 8) score += 30;
  if (candidate.realValue === 16) score += 28;
  if (candidate.realValue === 4) score += 18;
  if (candidate.realValue === 2) score += 8;
  if (candidate.realValue === 1) score += 4;
  if (remaining > 0 && dur > remaining + 0.0001) score -= 200;
  return score;
}

function selectCandidate(candidates = [], context, groupState, cell, lookaheadDotted = false, lookaheadMinRemaining = 0) {
  const clean = (candidates || []).filter((c) => c && c.realValue);
  if (!clean.length) return null;

  const applyLookaheadDot = (candidate) => ({
    ...candidate,
    dotted: Boolean(candidate?.dotted || lookaheadDotted),
    dotCount: lookaheadDotted
      ? Math.max(1, Number(candidate?.dotCount || 0))
      : Number(candidate?.dotCount || 0),
  });

  const dots = Array.isArray(cell?.dots) ? cell.dots : [];
  const has3 = dots.includes(3);
  const has6 = dots.includes(6);
  const expected = Number(context.expectedMeasure16 || 0);
  const useMeasureContext = expected > 0;

  const chooseByScore = (realValues, preferredOrder = []) => {
    const options = clean.filter((candidate) => realValues.includes(Number(candidate.realValue)));
    if (!options.length) return null;
    if (options.length === 1) return options[0];

    let best = options[0];
    let bestScore = candidateScore(best, context, lookaheadDotted);

    for (let i = 1; i < options.length; i += 1) {
      const candidate = options[i];
      const score = candidateScore(candidate, context, lookaheadDotted);
      if (score > bestScore) {
        best = candidate;
        bestScore = score;
      } else if (score === bestScore) {
        const currentValue = Number(candidate.realValue);
        const bestValue = Number(best.realValue);
        const currentPreferred = preferredOrder.indexOf(currentValue);
        const bestPreferred = preferredOrder.indexOf(bestValue);
        if (currentPreferred >= 0 && (bestPreferred < 0 || currentPreferred < bestPreferred)) {
          best = candidate;
          bestScore = score;
        }
      }
    }

    return best;
  };

  if (!has3 && !has6) {
    const preferred = clean.find((candidate) => Number(candidate.realValue) === 8);
    if (preferred) return applyLookaheadDot(preferred);
    return applyLookaheadDot(clean[0]);
  }

  if (!useMeasureContext) {
    const fallback = has3 && has6 ? 16 : has3 ? 2 : 4;
    const preferred = clean.find((candidate) => Number(candidate.realValue) === fallback);
    if (preferred) return applyLookaheadDot(preferred);
    return applyLookaheadDot(clean[0]);
  }

  // Genel skor geri dönüş: nota-spesifik aday filtresi başarısız olduğunda
  // (örn. sus hücreleri farklı gerçek değerlere sahip olduğunda) tüm adayları
  // candidateScore ile karşılaştır.
  const scoreAllCandidates = () => {
    const allRv = clean.map((c) => Number(c.realValue));
    return chooseByScore(allRv, []);
  };

  if (!has3 && has6) {
    const selected = chooseByScore([4, 64], [4, 64]) || clean.find((candidate) => Number(candidate.realValue) === 4) || scoreAllCandidates() || clean[0];
    return applyLookaheadDot(selected);
  }

  if (has3 && !has6) {
    const selected = chooseByScore([2, 32], [2, 32]) || clean.find((candidate) => Number(candidate.realValue) === 2) || scoreAllCandidates() || clean[0];
    return applyLookaheadDot(selected);
  }

  if (has3 && has6) {
    const selected = chooseByScore([1, 16], [16, 1]) || clean.find((candidate) => Number(candidate.realValue) === 1) || scoreAllCandidates() || clean[0];
    return applyLookaheadDot(selected);
  }

  return applyLookaheadDot(clean[0]);
}

function musicalCandidateCount(tokens = [], startIndex = 0) {
  let count = 0;
  for (let i = startIndex; i < tokens.length; i += 1) {
    const key = dotsToDashKey(tokens[i]?.dots || []);
    if (REVERSE_MAPS.noteByCellKey.has(key) || REVERSE_MAPS.restByCellKey.has(key)) count += 1;
  }
  return count;
}

function clefLengthAt(tokens = [], index = 0) {
  const keys = tokens.slice(index, index + 4).map((token) => dotsToKey(token?.dots || []));
  if (keys[0] === '345' && keys[1] === '34' && keys[2] === '123' && keys[3] === '5') return 4;
  if (keys[0] === '345' && keys[1] === '34' && keys[2] === '123') return 3;
  return 0;
}

function pushSpecialItem(context, item) {
  context.items.push(item);
  return item;
}

function bagMatchSamePitch(a, b) {
  if (!a || !b) return false;
  return (
    String(a.notaAd || '').toLocaleLowerCase('tr') === String(b.notaAd || '').toLocaleLowerCase('tr') &&
    Number(a.oktav) === Number(b.oktav) &&
    String(a.accidental || '').toLocaleLowerCase() === String(b.accidental || '').toLocaleLowerCase()
  );
}

function bagId(context, prefix) {
  return nowId(`brf-${prefix}`, context.baglar.length);
}

function closePendingTieBag(context, noteItem) {
  if (!context.pendingTieFromId) return;
  const fromId = context.pendingTieFromId;
  context.pendingTieFromId = null;

  const fromNote = context.items.find((item) => item.id === fromId);
  const samePitch = bagMatchSamePitch(fromNote, noteItem);
  const bag = {
    id: bagId(context, 'tie'),
    tip: 'tie',
    mode: 'single',
    basId: fromId,
    sonId: noteItem.id,
    notaIdler: [fromId, noteItem.id],
    kayit: {
      tip: 'tie',
      ad: 'Tie / uzatma bağı',
      importKaynak: 'brf-reader',
    },
    importKaynak: 'brf-reader',
  };

  context.baglar.push(bag);
  if (!samePitch) {
    context.warnings.push({
      type: 'tie-different-pitch',
      message: 'Tie farklı sese bağlandı; notalar aynı perde olmalıdır.',
    });
  }
}

export function closePendingSlurBag(context) {
  if (context.openLongSlurStartId) {
    return;
  }

  if (!context.pendingSlurOpen || !Array.isArray(context.pendingSlurNotaIds) || context.pendingSlurNotaIds.length < 2) {
    context.pendingSlurOpen = false;
    context.pendingSlurNotaIds = [];
    context.pendingSlurMode = null;
    context.pendingSlurNextNote = false;
    return;
  }

  const ids = [...new Set(context.pendingSlurNotaIds.filter(Boolean))];
  if (ids.length < 2) {
    context.pendingSlurOpen = false;
    context.pendingSlurNotaIds = [];
    context.pendingSlurMode = null;
    context.pendingSlurNextNote = false;
    return;
  }

  const bag = {
    id: bagId(context, 'slur'),
    tip: 'slur',
    mode: context.pendingSlurMode || 'single',
    basId: ids[0],
    sonId: ids[ids.length - 1],
    notaIdler: ids,
    kayit: {
      tip: 'slur',
      ad: 'Slur / legato bağı',
      importKaynak: 'brf-reader',
    },
    importKaynak: 'brf-reader',
  };

  context.baglar.push(bag);
  context.pendingSlurOpen = false;
  context.pendingSlurNotaIds = [];
  context.pendingSlurMode = null;
  context.pendingSlurNextNote = false;
}

function sonrakiSlurIsaretiVarMi(tokens = [], startIndex = 0) {
  for (let i = startIndex + 1; i < tokens.length; i += 1) {
    const key = dotsToKey(tokens[i]?.dots || []);
    if (key === '14') return true;
    if (key === '126' || key === '23' || key === '25') {
      continue;
    }
  }
  return false;
}

function sonrakiSlurIsaretiVarMiGlobal(context, cell) {
  const tokens = Array.isArray(context.currentLineBrailleTokens)
    ? context.currentLineBrailleTokens
    : [];
  const startIndex = Number(cell?.bodyTokenIndex);

  if (!Number.isFinite(startIndex)) return false;

  for (let i = startIndex + 1; i < tokens.length; i += 1) {
    const key = dotsToKey(tokens[i]?.dots || []);
    if (key === '14') return true;
    if (key === '126') {
      continue;
    }
  }
  return false;
}

function createSlurBag(context, { basId, sonId, notaIdler = [], mode = 'single' }) {
  if (!basId || !sonId) return null;

  const bag = {
    id: bagId(context, 'slur'),
    tip: 'slur',
    mode,
    basId,
    sonId,
    notaIdler: [...new Set([...(Array.isArray(notaIdler) ? notaIdler : []), basId, sonId].filter(Boolean))],
    kayit: {
      tip: 'slur',
      ad: 'Slur / legato bağı',
      importKaynak: 'brf-reader',
    },
    importKaynak: 'brf-reader',
  };

  context.baglar.push(bag);
  return bag;
}

export function finalizeSlurMarkers(context) {
  const markers = Array.isArray(context.slurMarkers)
    ? [...context.slurMarkers]
    : [];

  const noteIds = Array.isArray(context.noteSequence)
    ? [...context.noteSequence]
    : [];

  // Reader içinde daha önce üretilmiş bütün slur bag'lerini temizle.
  // Tie bag'leri korunur.
  context.baglar = (Array.isArray(context.baglar) ? context.baglar : [])
    .filter((bag) => bag?.tip !== 'slur');

  if (!markers.length || !noteIds.length) {
    return;
  }

  markers.sort((a, b) => {
    if (Number(a.lineIndex) !== Number(b.lineIndex)) {
      return Number(a.lineIndex) - Number(b.lineIndex);
    }

    if (Number(a.cellIndex) !== Number(b.cellIndex)) {
      return Number(a.cellIndex) - Number(b.cellIndex);
    }

    return Number(a.markerIndex || 0) - Number(b.markerIndex || 0);
  });

  const validMarkers = markers.filter((marker) => (
    marker?.afterNoteId &&
    Number.isFinite(Number(marker.afterNoteGlobalIndex)) &&
    Number(marker.afterNoteGlobalIndex) >= 0
  ));

  if (!validMarkers.length) {
    context.warnings.push({
      type: 'slur-missing-source',
      message: 'Slur markerı bulundu ancak öncesinde bağlanacak nota yok.',
    });
    return;
  }

  const slurBagOlustur = ({ mode, basId, sonId, notaIdler }) => {
    const temizNotaIdler = [...new Set((notaIdler || []).filter(Boolean))];

    if (!basId || !sonId || temizNotaIdler.length < 2) {
      return null;
    }

    const bag = {
      id: bagId(context, 'slur'),
      tip: 'slur',
      mode,
      basId,
      sonId,
      notaIdler: temizNotaIdler,
      kayit: {
        tip: 'slur',
        ad: 'Slur / legato bağı',
        importKaynak: 'brf-reader',
      },
      importKaynak: 'brf-reader',
    };

    context.baglar.push(bag);
    return bag;
  };

  /*
    ÖNEMLİ KURAL

    Bir satırda / pasajda 2 veya daha fazla slur marker varsa:
    - ilk marker = uzun slur başlangıcı
    - son marker = kapanıştan önceki işaret
    - son marker'dan sonra gelen ilk nota = slurun son notası

    Bu nedenle markerları ikili ikili eşleştirmiyoruz.
    Bu örnek için bütün markerları tek uzun slur kabul ediyoruz.
  */
  if (validMarkers.length >= 2) {
    const firstMarker = validMarkers[0];
    const lastMarker = validMarkers[validMarkers.length - 1];

    const startIndex = Number(firstMarker.afterNoteGlobalIndex);
    const endMarkerIndex = Number(lastMarker.afterNoteGlobalIndex);
    const endIndex = endMarkerIndex + 1;

    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || endIndex <= startIndex) {
      context.warnings.push({
        type: 'slur-invalid-range',
        message: 'Uzun slur başlangıç ve bitiş aralığı çözümlenemedi.',
      });
      return;
    }

    const endId = noteIds[endIndex];

    if (!endId) {
      context.warnings.push({
        type: 'slur-missing-end',
        message: 'Uzun slur kapanış markerından sonra son nota bulunamadı.',
      });
      return;
    }

    const notaIdler = noteIds
      .slice(startIndex, endIndex + 1)
      .filter(Boolean);

    slurBagOlustur({
      mode: 'long-single',
      basId: notaIdler[0],
      sonId: notaIdler[notaIdler.length - 1],
      notaIdler,
    });

    return;
  }

  /*
    Tek marker varsa kısa slur:
    marker öncesindeki nota -> marker sonrasındaki ilk nota
  */
  const marker = validMarkers[0];
  const startIndex = Number(marker.afterNoteGlobalIndex);
  const endId = noteIds[startIndex + 1];

  if (!endId) {
    context.warnings.push({
      type: 'slur-missing-end',
      message: 'Kısa slur için sonraki nota bulunamadı.',
    });
    return;
  }

  slurBagOlustur({
    mode: 'single',
    basId: marker.afterNoteId,
    sonId: endId,
    notaIdler: [marker.afterNoteId, endId],
  });
}

function closeLongSlurBag(context, noteItem) {
  if (!context.openLongSlurStartId || !noteItem?.id) return;

  const ids = [...new Set([...(context.openLongSlurNotaIds || []), noteItem.id].filter(Boolean))];
  if (ids.length >= 2) {
    const bag = {
      id: bagId(context, 'slur'),
      tip: 'slur',
      mode: 'long-single',
      basId: ids[0],
      sonId: ids[ids.length - 1],
      notaIdler: ids,
      kayit: {
        tip: 'slur',
        ad: 'Slur / legato bağı',
        importKaynak: 'brf-reader',
      },
      importKaynak: 'brf-reader',
    };
    context.baglar.push(bag);
  }

  context.openLongSlurStartId = null;
  context.openLongSlurNotaIds = [];
  context.longSlurAwaitingLastNote = false;
  context.slurMode = null;
}

function maybeCloseSlurBeforeNewNote(context) {
  if (context.openLongSlurStartId) return;
  if (!context.pendingSlurOpen || context.pendingSlurNextNote) return;
  closePendingSlurBag(context);
}

function addPendingSlurMarker(context) {
  const lastNoteId = context.lastNote?.id || null;
  if (!lastNoteId) {
    context.warnings.push({
      type: 'slur-missing-source',
      message: 'Slur notadan önce geldi; bağlanacak nota bulunamadı.',
    });
    return;
  }

  if (!context.pendingSlurOpen) {
    context.pendingSlurOpen = true;
    context.pendingSlurNotaIds = [lastNoteId];
    context.pendingSlurMode = 'single';
  } else if (!context.pendingSlurNotaIds.includes(lastNoteId)) {
    context.pendingSlurNotaIds.push(lastNoteId);
  }

  context.pendingSlurNextNote = true;
}

const BARLINE_TIPLERI = new Set([
  'barline',
  'finalBarline',
  'sectionalBarline',
  'beginRepeat',
  'endRepeat',
]);

const OLCU_SONU_BARLINE_TIPLERI = new Set([
  'barline',
  'finalBarline',
  'sectionalBarline',
  'endRepeat',
]);

function barlineTipiMi(item) {
  return BARLINE_TIPLERI.has(item?.tip);
}

function olcuSonuBarlineMi(item) {
  return OLCU_SONU_BARLINE_TIPLERI.has(item?.tip);
}

function barlineSonrasiDurumuSifirla(context, ilerle = true) { // changed
  if (ilerle) context.activeMeasure += 1; // changed
  context.measureProgress16 = 0; // changed
  context.pendingOctave = null; // changed
  context.pendingAccidental = null; // changed
  context.lastSeparatorCreatedBarline = true; // changed
}

function separatorBarlineOlustur(cell, context) {
  const previous = context.items[context.items.length - 1];
  if (!previous || barlineTipiMi(previous) || context.lastSeparatorCreatedBarline) {
    return null;
  }

  const bar = pushSpecialItem(context, {
    id: nowId('bar', context.items.length),
    tip: 'barline',
    ad: 'boş hücre ölçü çizgisi',
    char: cell?.char || '⠀',
    measureNo: context.activeMeasure,
    fromBlankCell: true,
  });

  barlineSonrasiDurumuSifirla(context);

  return bar;
}

function readNoteCell(cell, context, groupState, candidates) {
  const selected = selectCandidate(
    candidates,
    context,
    groupState,
    cell,
    groupState.lookaheadDotted || false,
    groupState.lookaheadMinRemaining || 0,
  );
  if (!selected) return null;

  const selectedDuration16 = duration16(selected);

  const noteItem = applyMeasurePosition(context, {
    id: nowId('note', context.items.length),
    tip: 'nota',
    notaAd: selected.notaAd,
    sureIndeksi: selected.sureIndeksi,
    sureAd: selected.sureAd || sureAdiAl(selected.sureIndeksi),
    oktav: inferOctaveForNote(context, selected.notaAd),
    accidental: context.pendingAccidental || null,
    char: cell.char,
    groupedPitchOnly: Boolean(selected.groupedPitchOnly),
    duration16: selectedDuration16,
    realValue: selected.realValue,
    dotted: Boolean(selected.dotted || Number(selected.dotCount || 0) > 0),
    dotCount: Number(selected.dotCount || 0),
  }, selectedDuration16);

  flushPendingModifiers(context, noteItem);

  const noteGlobalIndex = context.noteSequence.length;
  noteItem.noteGlobalIndex = noteGlobalIndex;
  context.noteSequence.push(noteItem.id);
  context.items.push(noteItem);
  closePendingTieBag(context, noteItem);

  context.currentOctave = noteItem.oktav;
  context.lastNote = noteItem;
  context.pendingOctave = null;
  context.pendingAccidental = null;
  // Grup içinde gerçek içerik (nota) yazıldı; bir önceki barline marker'ı
  // (örn. grup başındaki ⠣⠶ başlangıç tekrarı) lastSeparatorCreatedBarline'ı
  // true bırakmış olabilir. İçerik geldiyse grubun sonundaki boşluk kapanış
  // ölçü çizgisini oluşturabilmeli; bayrağı sıfırla.
  context.lastSeparatorCreatedBarline = false;

  return pushDebug(context, cell, {
    category: 'note',
    meaning: `${noteItem.notaAd} ${noteItem.sureAd}`,
    effect: `${noteItem.measureNo}. ölçü, ${noteItem.oktav}. oktav${noteItem.accidental ? `, ${noteItem.accidental}` : ''}`,
    itemId: noteItem.id,
  });
}

function readRestCell(cell, context, candidates, groupState = null) {
  const selected = selectCandidate(candidates, context, groupState, cell);
  if (!selected) return null;
  const selectedDuration16 = duration16(selected);

  const restItem = applyMeasurePosition(context, {
    id: nowId('rest', context.items.length),
    tip: 'sus',
    sureIndeksi: selected.sureIndeksi,
    sureAd: selected.sureAd || sureAdiAl(selected.sureIndeksi),
    char: cell.char,
    duration16: selectedDuration16,
    realValue: selected.realValue,
    dotted: Boolean(selected.dotted || Number(selected.dotCount || 0) > 0),
    dotCount: Number(selected.dotCount || 0),
  }, selectedDuration16);

  context.items.push(restItem);
  context.pendingOctave = null;
  context.pendingAccidental = null;
  context.lastSeparatorCreatedBarline = false;

  return pushDebug(context, cell, {
    category: 'rest',
    meaning: `${restItem.sureAd} sus`,
    effect: `${restItem.measureNo}. ölçü`,
    itemId: restItem.id,
  });
}

export function readMusicBrailleGroup(group = [], context) {
  const tokens = (group || []).filter((cell) => cell?.type === 'braille');
  const groupState = {
    lookaheadDotted: false,
    lookaheadMinRemaining: 0,
  };
  const consumedAugmentationDotCells = new Set();

  context.lastSeparatorCreatedBarline = false; // changed

  for (let i = 0; i < tokens.length; i += 1) {
    const cell = tokens[i];
    const rawKey = dotsToKey(cell.dots);
    const dashKey = dotsToDashKey(cell.dots);

    const clefLen = clefLengthAt(tokens, i);
    if (clefLen) {
      for (let c = 0; c < clefLen; c += 1) {
        pushDebug(context, tokens[i + c], {
          category: 'clef',
          meaning: 'anahtar/prefix hücresi',
          effect: 'müzik başlangıç bilgisi olarak atlandı',
        });
      }
      i += clefLen - 1;
      continue;
    }

    // Volta (1./2. ev): sayı göstergesi ⠼ (3-4-5-6) + rakam (2 → 1. ev, 2-3 → 2. ev).
    // Export'ta ardından dot-3 ayraç hücresi gelebilir; onu da tüketiriz.
    if (dashKey === '3-4-5-6') {
      const next1 = tokens[i + 1] ? dotsToDashKey(tokens[i + 1].dots) : '';
      const voltaTip = next1 === '2' ? 'volta1' : (next1 === '2-3' ? 'volta2' : null);
      if (voltaTip) {
        const voltaAd = voltaTip === 'volta1' ? '1. ev (volta)' : '2. ev (volta)';
        const item = pushSpecialItem(context, {
          id: nowId(voltaTip, context.items.length),
          tip: voltaTip,
          ad: voltaAd,
          gorunum: voltaTip === 'volta1' ? '1.' : '2.',
          hucreler: voltaTip === 'volta1' ? [[3, 4, 5, 6], [2]] : [[3, 4, 5, 6], [2, 3]],
          measureNo: context.activeMeasure,
        });
        pushDebug(context, cell, { category: voltaTip, meaning: `${voltaAd} sayı göstergesi`, effect: 'çok hücreli işaret', itemId: item.id });
        pushDebug(context, tokens[i + 1], { category: voltaTip, meaning: voltaAd, effect: 'çok hücreli işaret tamamlandı', itemId: item.id });
        let tuketilen = 1;
        // İsteğe bağlı dot-3 volta ayracı
        const next2 = tokens[i + 2] ? dotsToDashKey(tokens[i + 2].dots) : '';
        if (next2 === '3') {
          consumedAugmentationDotCells.add(tokens[i + 2]);
          pushDebug(context, tokens[i + 2], { category: voltaTip, meaning: 'volta ayracı (dot 3)', effect: 'volta sayısından sonra ayraç', itemId: item.id });
          tuketilen = 2;
        }
        i += tuketilen;
        continue;
      }
    }

    // Alt-hücre rakamları (ölçü numarası) ve braille tekrar işareti.
    // NOT: Bu blok süsleme eşleştiricisinden ÖNCE çalışmalı; çünkü bazı
    // tek hücreli süslemeler (trill ⠖=2-3-5, turn ⠲=2-5-6) alt-rakamlarla
    // (6, 4) AYNI hücreyi paylaşır. Ölçü başı/sonundaki rakam dizileri
    // ölçü numarasıdır; süsleme yalnızca grup ORTASINDA (nota komşuluğunda)
    // değerlendirilir.
    if (LOWER_DIGIT_BY_DASH.has(dashKey)) {
      let j = i;
      while (
        j < tokens.length &&
        tokens[j]?.type === 'braille' &&
        LOWER_DIGIT_BY_DASH.has(dotsToDashKey(tokens[j].dots))
      ) {
        j += 1;
      }
      const runLen = j - i;
      const grupBasi = i === 0;
      const grupSonu = j >= tokens.length;
      const tumGrup = grupBasi && grupSonu;

      // Tek hücreli ⠶ (2-3-5-6) tüm grubu kaplıyorsa: braille tekrar işareti
      // (önceki ölçüyü aynen tekrarla).
      if (tumGrup && runLen === 1 && dashKey === '2-3-5-6') {
        const item = pushSpecialItem(context, {
          id: nowId('braille-repeat', context.items.length),
          tip: 'brailleRepeat',
          ad: 'braille repeat işareti',
          gorunum: '𝄎',
          hucreler: [[2, 3, 5, 6]],
          measureNo: context.activeMeasure,
        });
        pushDebug(context, cell, {
          category: 'repeat',
          meaning: 'braille repeat işareti',
          effect: 'önceki ölçüyü aynen tekrarlar',
          itemId: item.id,
        });
        continue;
      }

      // Grup başı veya grup sonundaki rakam dizisi → ölçü numarası (atlanır).
      if (grupBasi || grupSonu) {
        const digits = [];
        for (let k = i; k < j; k += 1) {
          digits.push(LOWER_DIGIT_BY_DASH.get(dotsToDashKey(tokens[k].dots)));
        }
        const barNo = digits.join('');
        for (let k = i; k < j; k += 1) {
          pushDebug(context, tokens[k], {
            category: 'bar-number',
            meaning: `${barNo}. ölçü numarası`,
            effect: 'ölçü numarası / kılavuz (müzik içeriği değil; atlandı)',
          });
        }
        i = j - 1;
        continue;
      }
      // Aksi halde grup ortasında — süsleme/nüans eşleştiricisine bırak.
    }

    // Süsleme / nüans / dinamik gibi notaya bağlı çok-hücreli
    // işaretler. En uzun eşleşme önceliklidir; tek hücreli süslemeler
    // (trill 2-3-5, turn 2-5-6 vb.) nota/aksidental ile çakışmaz.
    const modMatch = matchModifierSequence(tokens, i);
    if (modMatch) {
      const { entry, length } = modMatch;
      if (entry.yon === 'sonrasi') {
        if (context.lastNote) {
          attachModifierToNote(context.lastNote, 'sonrasi', entry.kayit);
        } else {
          context.warnings.push({
            type: 'modifier-no-source',
            lineIndex: cell.lineIndex,
            cellIndex: cell.cellIndex,
            message: `${entry.ad} işareti bir notadan sonra gelmelidir.`,
          });
        }
      } else {
        context.pendingModifiers = [
          ...(Array.isArray(context.pendingModifiers) ? context.pendingModifiers : []),
          { ad: entry.ad, kategori: entry.kategori, kayit: entry.kayit },
        ];
      }

      for (let c = 0; c < length; c += 1) {
        pushDebug(context, tokens[i + c], {
          category: entry.kategori === 'susleme' ? 'susleme' : entry.kategori,
          meaning: entry.ad,
          effect: c === 0
            ? `${entry.kategori} işareti (${entry.yon === 'sonrasi' ? 'nota sonrası' : 'nota öncesi'})${length > 1 ? ' — çok hücreli' : ''}`
            : 'çok hücreli işaret sürdü',
          itemId: entry.yon === 'sonrasi' ? (context.lastNote?.id || null) : null,
        });
      }

      i += length - 1;
      continue;
    }

    // 1-2-6 çok-hücreli işaret önceliği
    if (rawKey === '126') {
      const next1 = tokens[i + 1] ? dotsToKey(tokens[i + 1].dots) : '';
      const next2 = tokens[i + 2] ? dotsToKey(tokens[i + 2].dots) : '';

      if (next1 === '23') {
        const item = pushSpecialItem(context, {
          id: nowId('end-repeat', context.items.length),
          tip: 'endRepeat',
          ad: 'bitiş tekrarı',
          char: `${cell.char}${tokens[i + 1].char}`,
          measureNo: context.activeMeasure,
        });
        pushDebug(context, cell, { category: 'repeat', meaning: 'bitiş tekrarı başlangıç hücresi', effect: 'çok hücreli işaret', itemId: item.id });
        pushDebug(context, tokens[i + 1], { category: 'repeat', meaning: 'bitiş tekrarı', effect: 'çok hücreli işaret tamamlandı', itemId: item.id });
        barlineSonrasiDurumuSifirla(context);
        i += 1;
        continue;
      }

      if (next1 === '13' && next2 === '3') {
        const item = pushSpecialItem(context, {
          id: nowId('sectional', context.items.length),
          tip: 'sectionalBarline',
          ad: 'bölüm sonu çizgisi',
          char: `${cell.char}${tokens[i + 1].char}${tokens[i + 2].char}`,
          measureNo: context.activeMeasure,
        });
        pushDebug(context, cell, { category: 'barline', meaning: 'bölüm sonu çizgisi başlangıç hücresi', effect: 'çok hücreli işaret', itemId: item.id });
        pushDebug(context, tokens[i + 1], { category: 'barline', meaning: 'bölüm sonu çizgisi', effect: 'çok hücreli işaret sürdü', itemId: item.id });
        pushDebug(context, tokens[i + 2], { category: 'barline', meaning: 'bölüm sonu çizgisi', effect: 'çok hücreli işaret tamamlandı', itemId: item.id });
        barlineSonrasiDurumuSifirla(context);
        i += 2;
        continue;
      }

      if (next1 === '2356') {
        const item = pushSpecialItem(context, {
          id: nowId('begin-repeat', context.items.length),
          tip: 'beginRepeat',
          ad: 'başlangıç tekrarı',
          char: `${cell.char}${tokens[i + 1].char}`,
          measureNo: context.activeMeasure,
        });
        pushDebug(context, cell, { category: 'repeat', meaning: 'başlangıç tekrarı başlangıç hücresi', effect: 'çok hücreli işaret', itemId: item.id });
        pushDebug(context, tokens[i + 1], { category: 'repeat', meaning: 'başlangıç tekrarı', effect: 'çok hücreli işaret tamamlandı', itemId: item.id });
        // beginRepeat bir ölçü-başı işaretidir; öncesindeki boşluk zaten ölçüyü
        // ilerletmiş olur. Tekrar ilerletirsek fazladan boş ölçü oluşur.
        barlineSonrasiDurumuSifirla(context, false);
        i += 1;
        continue;
      }

      if (next1 === '13') {
        const item = pushSpecialItem(context, {
          id: nowId('final', context.items.length),
          tip: 'finalBarline',
          ad: 'bitiş çizgisi',
          char: `${cell.char}${tokens[i + 1].char}`,
          measureNo: context.activeMeasure,
        });
        pushDebug(context, cell, { category: 'barline', meaning: 'bitiş çizgisi başlangıç hücresi', effect: 'çok hücreli işaret', itemId: item.id });
        pushDebug(context, tokens[i + 1], { category: 'barline', meaning: 'bitiş çizgisi', effect: 'çok hücreli işaret tamamlandı', itemId: item.id });
        barlineSonrasiDurumuSifirla(context);
        i += 1;
        continue;
      }
    }

    if (rawKey === '3') {
      if (consumedAugmentationDotCells.has(cell)) {
        pushDebug(context, cell, {
          category: 'augmentation-dot',
          meaning: 'noktalı işareti',
          effect: 'lookahead ile önceki nota/sus adayına zaten uygulandı; tekrar uygulanmadı',
          itemId: context.lastNote?.id || null,
        });
        continue;
      }

      applyAugmentationDotToPreviousItem(cell, context);
      continue;
    }

    if (rawKey === '4') {
      context.pendingTie = true;
      context.pendingTieFromId = context.lastNote?.id || null;
      if (!context.pendingTieFromId) {
        context.warnings.push({
          type: 'tie-no-source',
          message: 'Tie işareti bir notadan sonra gelmelidir.',
        });
      }
      pushDebug(context, cell, {
        category: 'tie',
        meaning: 'tie ön işareti',
        effect: 'sonraki bağ hücresiyle eşleşecek',
        itemId: context.pendingTieFromId,
      });
      continue;
    }

    if (REVERSE_MAPS.octaveByCellKey.has(dashKey)) {
      const octave = REVERSE_MAPS.octaveByCellKey.get(dashKey);
      context.pendingOctave = octave;
      pushDebug(context, cell, {
        category: 'octave',
        meaning: `${octave}. oktav işareti`,
        effect: 'sonraki notaya uygulanacak',
      });
      continue;
    }

    if (REVERSE_MAPS.accidentalByCellKey.has(dashKey)) {
      const acc = REVERSE_MAPS.accidentalByCellKey.get(dashKey);
      context.pendingAccidental = acc.accidental;
      pushDebug(context, cell, {
        category: 'accidental',
        meaning: acc.label,
        effect: 'sonraki notaya uygulanacak',
      });
      continue;
    }

    if (rawKey === '14' && context.pendingTie) {
      context.pendingTie = null;

      pushDebug(context, cell, {
        category: 'tie',
        meaning: 'tie',
        effect: 'tie bağ işareti tamamlandı; sonraki nota bekleniyor',
        itemId: context.pendingTieFromId || null,
      });

      continue;
    }

    if (rawKey === '14') {
      const marker = {
        id: nowId('slur-marker', context.slurMarkers.length),
        markerIndex: context.slurMarkers.length,
        lineIndex: cell.lineIndex,
        cellIndex: cell.cellIndex,
        char: cell.char,
        afterNoteId: context.lastNote?.id || null,
        afterNoteGlobalIndex: Number.isFinite(context.lastNote?.noteGlobalIndex)
          ? context.lastNote.noteGlobalIndex
          : null,
        measureNo: context.activeMeasure,
      };

      context.slurMarkers.push(marker);

      pushDebug(context, cell, {
        category: 'slur',
        meaning: 'slur marker',
        effect: `marker kaydedildi; afterNoteId=${marker.afterNoteId || '-'}; afterNoteGlobalIndex=${Number.isFinite(marker.afterNoteGlobalIndex) ? marker.afterNoteGlobalIndex : '-'}`,
        itemId: marker.id,
      });

      continue;
    }

    const noteCandidates = REVERSE_MAPS.noteByCellKey.get(dashKey);
    if (Array.isArray(noteCandidates) && noteCandidates.length > 0) {
      const nextToken = tokens[i + 1];
      const lookaheadDotted = nextToken ? dotsToKey(nextToken.dots || []) === '3' : false;
      const lookaheadMinRemaining = 0;
      if (lookaheadDotted && nextToken) {
        consumedAugmentationDotCells.add(nextToken);
      }

      groupState.lookaheadDotted = lookaheadDotted;
      groupState.lookaheadMinRemaining = lookaheadMinRemaining;
      readNoteCell(cell, context, groupState, noteCandidates);
      groupState.lookaheadDotted = false;
      groupState.lookaheadMinRemaining = 0;
      continue;
    }

    const restCandidates = REVERSE_MAPS.restByCellKey.get(dashKey);
    if (Array.isArray(restCandidates) && restCandidates.length > 0) {
      readRestCell(cell, context, restCandidates, groupState);
      continue;
    }

    if (rawKey === '23' || rawKey === '25') {
      const bar = pushSpecialItem(context, {
        id: nowId('bar', context.items.length),
        tip: 'barline',
        ad: 'ölçü çizgisi',
        char: cell.char,
        measureNo: context.activeMeasure,
      });
      barlineSonrasiDurumuSifirla(context);
      pushDebug(context, cell, {
        category: 'barline',
        meaning: 'ölçü çizgisi',
        effect: `${context.activeMeasure}. ölçüye geçildi`,
        itemId: bar.id,
      });
      continue;
    }

    if (rawKey === '2356') {
      const warning = '⠶ tek başına başlangıç tekrarı değildir. Başlangıç tekrarı ⠣⠶ olmalıdır.';
      context.warnings.push({
        type: 'invalid-begin-repeat-order',
        lineIndex: cell.lineIndex,
        cellIndex: cell.cellIndex,
        message: warning,
      });

      pushDebug(context, cell, {
        category: 'repeat-warning',
        meaning: 'geçersiz / eksik tekrar başlangıcı',
        effect: 'başlangıç tekrarı olarak okunmadı',
        warning,
      });

      continue;
    }

    const fallbackLetter = BRAILLE_LETTERS_TR[rawKey];
    if (fallbackLetter) {
      pushDebug(context, cell, {
        category: 'literary',
        meaning: fallbackLetter,
        effect: 'edebi braille / müzik bağlamında atlandı',
      });
      continue;
    }

    const warning = `Bilinmeyen hücre: ${cell.char} (${dashKey || rawKey || 'boş'})`;
    context.warnings.push({
      type: 'unknown-cell',
      lineIndex: cell.lineIndex,
      cellIndex: cell.cellIndex,
      message: warning,
    });

    const unknown = pushSpecialItem(context, {
      id: nowId('unknown', context.items.length),
      tip: 'unknown',
      char: cell.char,
      dots: cell.dots,
      measureNo: context.activeMeasure,
    });

    pushDebug(context, cell, {
      category: 'unknown',
      meaning: 'bilinmeyen',
      effect: 'uyarı üretildi',
      warning,
      itemId: unknown.id,
    });
  }
}

export function tokenizeBrailleLine(line = '', lineIndex = 0) {
  const tokens = [];
  const chars = Array.from(String(line || ''));

  chars.forEach((char, idx) => {
    if (char === ' ' || char === '⠀') {
      tokens.push({
        char,
        dots: [],
        lineIndex,
        cellIndex: idx,
        type: 'space',
      });
      return;
    }

    tokens.push({
      char,
      dots: brailleCharToDots(char),
      lineIndex,
      cellIndex: idx,
      type: 'braille',
    });
  });

  return tokens;
}

export function detectHeaderLineType(tokens = []) {
  const braille = (tokens || []).filter((t) => t.type === 'braille');
  if (braille.length === 0) return { type: 'empty' };

  const keyPattern = braille.map((t) => dotsToKey(t.dots)).join('|');
  const matchedTimeSignature = TIME_SIGNATURE_PATTERNS[keyPattern] || null;

  if (matchedTimeSignature) {
    return { type: 'time-signature', value: matchedTimeSignature };
  }

  // Karma satır: "allegro. 4/4" gibi başlık + boşluk + zaman imzası aynı satırda.
  // Boşluktan sonraki kısmı zaman imzası olarak kontrol et.
  const spaceIdx = tokens.findIndex((t) => t.type === 'space');
  if (spaceIdx > 0) {
    const suffix = tokens.slice(spaceIdx + 1).filter((t) => t.type === 'braille');
    if (suffix.length > 0) {
      const suffixPattern = suffix.map((t) => dotsToKey(t.dots)).join('|');
      const suffixTs = TIME_SIGNATURE_PATTERNS[suffixPattern] || null;
      if (suffixTs) {
        const prefix = tokens.slice(0, spaceIdx).filter((t) => t.type === 'braille');
        const text = prefix.map((t) => BRAILLE_LETTERS_TR[dotsToKey(t.dots)] || '').join('').trim();
        return { type: 'title+time-signature', value: text, timeSignature: suffixTs };
      }
    }
  }

  // Büyük harf işareti [6] de "metin hücresi" sayılır (oranı düşürmesin).
  const harfVeyaIsaret = (t) => {
    const k = dotsToKey(t.dots);
    return Boolean(BRAILLE_LETTERS_TR[k]) || k === '6';
  };
  const letterCount = braille.filter(harfVeyaIsaret).length;
  // Kısa başlık/besteci (örn. "cc" = 2 hücre) de tanınsın: tüm hücreler harfse
  // bu satır metindir (müzik satırları octave/sayı işaretiyle başlar, harf değil).
  // Uzun satırlarda %70 harf oranı yeterli (araya gelebilecek aksan vb. için).
  const tumHarf = braille.length >= 1 && letterCount === braille.length;
  const cogunlukHarf = braille.length >= 3 && letterCount >= Math.ceil(braille.length * 0.7);
  if (tumHarf || cogunlukHarf) {
    // Boşlukları koru; büyük harf işaretinden ([6]) sonraki harfi büyüt.
    let text = '';
    let buyukBekliyor = false;
    for (const t of tokens) {
      if (t.type === 'space') { text += ' '; buyukBekliyor = false; continue; }
      const k = dotsToKey(t.dots);
      if (k === '6') { buyukBekliyor = true; continue; }
      const harf = BRAILLE_LETTERS_TR[k] || '';
      if (harf) {
        text += buyukBekliyor ? harf.toLocaleUpperCase('tr') : harf;
      }
      buyukBekliyor = false;
    }
    text = text.replace(/\s+/g, ' ').trim();
    return { type: 'title', value: text };
  }

  return { type: 'music' };
}

function pushDebug(context, cell, patch = {}) {
  const out = {
    seq: context.seq + 1,
    lineIndex: cell.lineIndex,
    cellIndex: cell.cellIndex,
    char: cell.char,
    dots: cell.dots,
    dotsText: cell.dots.length ? cell.dots.join('-') : 'boşluk',
    type: cell.type,
    category: patch.category || 'unknown',
    meaning: patch.meaning || '',
    effect: patch.effect || '',
    warning: patch.warning || '',
    itemId: patch.itemId || null,
  };
  context.seq += 1;
  context.cells.push(out);
  return out;
}

export function readMusicBrailleCell(cell, context) {
  if (!cell || cell.type === 'space') {
    const bar = separatorBarlineOlustur(cell || {}, context);
    return pushDebug(context, cell, {
      category: bar ? 'barline' : 'separator',
      meaning: bar ? 'boş hücre ölçü çizgisi' : 'ayraç',
      effect: bar ? `${context.activeMeasure}. ölçüye geçildi` : 'tekrarlı/baş boşluk',
      itemId: bar?.id || null,
    });
  }

  const dashKey = dotsToDashKey(cell.dots);
  const rawKey = dotsToKey(cell.dots);

  if (REVERSE_MAPS.octaveByCellKey.has(dashKey)) {
    const octave = REVERSE_MAPS.octaveByCellKey.get(dashKey);
    context.pendingOctave = octave;
    return pushDebug(context, cell, {
      category: 'octave',
      meaning: `${octave}. oktav işareti`,
      effect: 'sonraki notaya uygulanacak',
    });
  }

  if (REVERSE_MAPS.accidentalByCellKey.has(dashKey)) {
    const acc = REVERSE_MAPS.accidentalByCellKey.get(dashKey);
    context.pendingAccidental = acc.accidental;
    return pushDebug(context, cell, {
      category: 'accidental',
      meaning: acc.label,
      effect: 'sonraki notaya uygulanacak',
    });
  }

  if (rawKey === '4') {
    context.pendingTie = true;
    context.pendingTieFromId = context.lastNote?.id || null;
    if (!context.pendingTieFromId) {
      context.warnings.push({
        type: 'tie-no-source',
        message: 'Tie işareti bir notadan sonra gelmelidir.',
      });
    }
    return pushDebug(context, cell, {
      category: 'tie',
      meaning: 'tie ön işareti',
      effect: 'sonraki bağ hücresiyle eşleşecek',
      itemId: context.pendingTieFromId,
    });
  }

  if (rawKey === '14' && context.pendingTie) {
    context.pendingTie = null;

    return pushDebug(context, cell, {
      category: 'tie',
      meaning: 'tie',
      effect: 'tie bağ işareti tamamlandı; sonraki nota bekleniyor',
      itemId: context.pendingTieFromId || null,
    });
  }

  if (rawKey === '3') {
    return applyAugmentationDotToPreviousItem(cell, context);
  }

  if (rawKey === '14') {
    const marker = {
      id: nowId('slur-marker', context.slurMarkers.length),
      markerIndex: context.slurMarkers.length,
      lineIndex: cell.lineIndex,
      cellIndex: cell.cellIndex,
      char: cell.char,
      afterNoteId: context.lastNote?.id || null,
      afterNoteGlobalIndex: Number.isFinite(context.lastNote?.noteGlobalIndex)
        ? context.lastNote.noteGlobalIndex
        : null,
      measureNo: context.activeMeasure,
    };

    context.slurMarkers.push(marker);

    return pushDebug(context, cell, {
      category: 'slur',
      meaning: 'slur marker',
      effect: `marker kaydedildi; afterNoteId=${marker.afterNoteId || '-'}; afterNoteGlobalIndex=${Number.isFinite(marker.afterNoteGlobalIndex) ? marker.afterNoteGlobalIndex : '-'}`,
      itemId: marker.id,
    });
  }

  const noteCandidates = REVERSE_MAPS.noteByCellKey.get(dashKey);
  if (Array.isArray(noteCandidates) && noteCandidates.length > 0) {
    const selected = noteCandidates[0];
    const noteGlobalIndex = context.noteSequence.length;
    const noteItem = {
      id: nowId('note', context.items.length),
      tip: 'nota',
      notaAd: selected.notaAd,
      sureIndeksi: selected.sureIndeksi,
      sureAd: selected.sureAd || sureAdiAl(selected.sureIndeksi),
      oktav: inferOctaveForNote(context, selected.notaAd),
      accidental: context.pendingAccidental || null,
      char: cell.char,
      noteGlobalIndex,
    };

    context.noteSequence.push(noteItem.id);
    context.items.push(noteItem);
    context.currentOctave = noteItem.oktav;
    context.lastNote = noteItem;
    context.pendingOctave = null;
    context.pendingAccidental = null;

    return pushDebug(context, cell, {
      category: 'note',
      meaning: `${noteItem.notaAd} ${noteItem.sureAd}`,
      effect: `${noteItem.oktav}. oktav${noteItem.accidental ? `, ${noteItem.accidental}` : ''}`,
      itemId: noteItem.id,
    });
  }

  const restCandidates = REVERSE_MAPS.restByCellKey.get(dashKey);
  if (Array.isArray(restCandidates) && restCandidates.length > 0) {
    const selected = restCandidates[0];
    const restItem = {
      id: nowId('rest', context.items.length),
      tip: 'sus',
      sureIndeksi: selected.sureIndeksi,
      sureAd: selected.sureAd || sureAdiAl(selected.sureIndeksi),
      char: cell.char,
    };

    context.items.push(restItem);
    context.pendingOctave = null;
    context.pendingAccidental = null;

    return pushDebug(context, cell, {
      category: 'rest',
      meaning: `${restItem.sureAd} sus`,
      effect: 'sus öğesi eklendi',
      itemId: restItem.id,
    });
  }

  if (rawKey === '23' || rawKey === '25') {
    const bar = {
      id: nowId('bar', context.items.length),
      tip: 'barline',
      ad: 'ölçü çizgisi',
      char: cell.char,
    };
    context.items.push(bar);
    barlineSonrasiDurumuSifirla(context);

    return pushDebug(context, cell, {
      category: 'barline',
      meaning: 'ölçü çizgisi',
      effect: `${context.activeMeasure}. ölçüye geçildi`,
      itemId: bar.id,
    });
  }

  const fallbackLetter = BRAILLE_LETTERS_TR[rawKey];
  if (fallbackLetter) {
    return pushDebug(context, cell, {
      category: 'literary',
      meaning: fallbackLetter,
      effect: 'edebi braille',
    });
  }

  const warning = `Bilinmeyen hücre: ${cell.char} (${dashKey || rawKey || 'boş'})`;
  context.warnings.push({
    type: 'unknown-cell',
    lineIndex: cell.lineIndex,
    cellIndex: cell.cellIndex,
    message: warning,
  });

  context.items.push({
    id: nowId('unknown', context.items.length),
    tip: 'unknown',
    char: cell.char,
    dots: cell.dots,
  });

  return pushDebug(context, cell, {
    category: 'unknown',
    meaning: 'bilinmeyen',
    effect: 'uyarı üretildi',
    warning,
  });
}

export function handleLineEnd(context) {
  context.lineIndex += 1;
  context.cellIndex = 0;
}

export function buildMeasures(items = []) {
  if ((items || []).some((item) => barlineTipiMi(item))) {
    const measures = [];
    let active = [];

    const pushActive = () => {
      if (active.length > 0) {
        measures.push({ no: measures.length + 1, items: active });
        active = [];
      }
    };

    (items || []).forEach((item) => {
      if (item.tip === 'tie' || item.tip === 'slur') return;

      if (item.tip === 'beginRepeat') {
        const oncekiIcerigiKapatir = active.length > 0;
        active.push(item);
        if (oncekiIcerigiKapatir) pushActive();
        return;
      }

      active.push(item);

      if (olcuSonuBarlineMi(item)) {
        pushActive();
        return;
      }
    });

    pushActive();

    return measures.map((measure) => ({
      ...measure,
      total16: measure.items.reduce((sum, item) => sum + Number(item.duration16 || 0), 0),
    }));
  }

  if ((items || []).some((item) => Number.isFinite(Number(item?.measureNo)))) {
    const grouped = new Map();
    (items || []).forEach((item) => {
      if (item.tip === 'tie' || item.tip === 'slur') return;
      const no = Number(item.measureNo || 1);
      if (!grouped.has(no)) grouped.set(no, []);
      if (item.tip !== 'barline') grouped.get(no).push(item);
    });

    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([no, measureItems]) => ({
        no,
        items: measureItems,
        total16: measureItems.reduce((sum, item) => sum + Number(item.duration16 || 0), 0),
      }));
  }

  const measures = [];
  let active = [];

  (items || []).forEach((item) => {
    if (item.tip === 'barline' || item.tip === 'finalBarline') {
      measures.push({ items: active });
      active = [];
      if (item.tip === 'finalBarline') {
        measures.push({ items: [item] });
      }
      return;
    }

    if (item.tip === 'tie' || item.tip === 'slur') return;
    active.push(item);
  });

  if (active.length > 0) {
    measures.push({ items: active });
  }

  return measures;
}
