import {
  BRAILLE_LETTERS_TR,
  TIME_SIGNATURE_PATTERNS,
  dotsToDashKey,
  dotsToKey,
  brailleCharToDots,
  sureAdiAl,
} from './brfMusicReaderConstants.js';
import { asciiBrfToUnicodeBraille } from './import/musicBrailleCellUtils.js';
import { SURE_GOSTERGELERI, MUZIK_DUZENSIZ_GRUPLAR } from '../../data/muzik.js';
import { MUZIK_ALT_RAKAM } from '../music/musicConstants.js';
import { musicBrailleReverseMapsOlustur } from './musicBrailleReverseMaps.js';
import { gorselVurusIndexAl } from './musicVisualBeamHelpers.js';

const REVERSE_MAPS = musicBrailleReverseMapsOlustur();

// Alt-hücre (lower-cell) rakamları: ölçü numarası vb. için kullanılır.
// dash anahtarı → rakam karakteri eşlemesi (ör. '2-3' → '2').
const LOWER_DIGIT_BY_DASH = new Map(
  Object.entries(MUZIK_ALT_RAKAM || {}).map(([digit, dots]) => [
    (Array.isArray(dots) ? dots : []).slice().sort((a, b) => a - b).join('-'),
    digit,
  ]),
);

// Üst-hücre (upper-cell) rakamları: ⠼ sonrası tekrar sayısı / geriye-sayısal tekrar için.
const UPPER_DIGIT_BY_DASH = new Map([
  ['1', '1'], ['1-2', '2'], ['1-4', '3'], ['1-4-5', '4'], ['1-5', '5'],
  ['1-2-4', '6'], ['1-2-4-5', '7'], ['1-2-5', '8'], ['2-4', '9'], ['2-4-5', '0'],
]);

// Alt-hücre rakamıyla ÇAKIŞAN tek hücreli süslemeler. Tril ⠖ (2-3-5) alt-rakam
// "6", turn ⠲ (2-5-6) alt-rakam "4" hücresiyle aynıdır. muzik.js'ten türetilir
// (yeni süsleme eklenince elle güncelleme gerekmez): tek hücreli süsleme
// kaydının hücresi bir alt-rakamla aynıysa çakışan kabul edilir. Ölçü başında
// böyle bir hücre ardından NOTA grubu (oktav/aksidental/nota) geliyorsa, bu bir
// ölçü numarası değil süslemedir → bkz. bar-number bloğu.
const CAKISAN_TEK_SUSLEME = new Set(
  [...LOWER_DIGIT_BY_DASH.keys()].filter((dash) => {
    const m = REVERSE_MAPS.modifierByCellKey?.get(dash);
    // Süsleme (tril/turn) VE nüans (staccato ⠦=2-3-6=alt-rakam-8) tek hücreli kayıtları çakışır.
    return m && m.length === 1 && (m.kategori === 'susleme' || m.kategori === 'nuans');
  }),
);

// Tuplet (düzensiz grup) işaret tablosu: cell-dizisi anahtarı → { count, ad, hucreler }.
// count = grubun nota sayısı (üçleme=3, ikileme=2, dörtleme=4 …); ratio adaptörde hesaplanır.
function tupletNotaSayisi(ad = '') {
  const a = String(ad).toLocaleLowerCase('tr');
  if (/ikileme|duplet/.test(a)) return 2;
  if (/dörtleme|dortleme|quadruplet/.test(a)) return 4;
  if (/beşleme|besleme|quintuplet/.test(a)) return 5;
  if (/altılama|altilama|sextuplet/.test(a)) return 6;
  if (/yedileme|septuplet/.test(a)) return 7;
  return 3; // üçleme / triplet (varsayılan)
}

// Tuplet "N notayı M notanın zamanında çal" → inTimeOf=M (sıkıştırma payesi). Editör tupletOranTahmin
// ile birebir: üçleme 3:2, ikileme 2:3, dörtleme 4:6, beşleme 5:4, altılama 6:4, yedileme 7:4.
// Ölçü-süresi (measureProgress) hesabı için kullanılır: tuplet footprint = liderNotaSüresi × inTimeOf.
function tupletInTimeOf(ad = '') {
  const a = String(ad).toLocaleLowerCase('tr');
  if (/ikileme|duplet/.test(a)) return 3;
  if (/dörtleme|dortleme|quadruplet/.test(a)) return 6;
  if (/beşleme|besleme|quintuplet/.test(a)) return 4;
  if (/altılama|altilama|sextuplet/.test(a)) return 4;
  if (/yedileme|septuplet/.test(a)) return 4;
  return 2; // üçleme / triplet
}
const TUPLET_SIGN_MAP = new Map();
(MUZIK_DUZENSIZ_GRUPLAR || []).forEach((r) => {
  if (!Array.isArray(r.hucreler) || r.hucreler.length === 0) return;
  const seqKey = r.hucreler.map((h) => [...h].sort((a, b) => a - b).join('-')).join('|');
  if (!TUPLET_SIGN_MAP.has(seqKey)) {
    TUPLET_SIGN_MAP.set(seqKey, { count: tupletNotaSayisi(r.ad), ad: r.ad, hucreler: r.hucreler });
  }
});
const TUPLET_MAX_LEN = Math.max(1, ...[...TUPLET_SIGN_MAP.values()].map((t) => t.hucreler.length));

// tokens[idx] bir nota grubunun başlangıcı mı? (oktav işareti / aksidental / nota)
function notaGrubuBaslangici(tokens, idx) {
  const t = tokens[idx];
  if (!t || t.type !== 'braille') return false;
  const dk = dotsToDashKey(t.dots);
  return REVERSE_MAPS.octaveByCellKey?.has(dk)
    || REVERSE_MAPS.accidentalByCellKey?.has(dk)
    || REVERSE_MAPS.noteByCellKey?.has(dk);
}

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

// Aktif tuplet nesnesi kur (tek/çok-hücre işaretten VE doubled pasajdan auto-arm için ortak).
function yeniTupletNesnesi(context, def) {
  return {
    id: nowId('tuplet', context.items.length),
    ad: def.ad,
    hucreler: def.hucreler,
    count: def.count,                  // grup nota sayısı (orijinal; kalan azalır)
    kalan: def.count,
    notaIdler: [],
    inTimeOf: tupletInTimeOf(def.ad), // sıkıştırma payesi (sextuplet 6:4 → 4)
    faceSum16: 0,                      // tuplet notalarının face-value süre toplamı (footprint düzeltmesi)
    leaderDur16: null,                 // ilk (lider) notanın süresi
  };
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
  // Aksak metre gruplama auto-çözümü: dışarıdan zorlanan desen (brfMuzikOku çoklu-deneme)
  // varsa timeSignature'a ekle → gorselVurusIndexAl vuruş sınırlarını ona göre kurar.
  const zorla = context.options?.forceGruplamaDeseni;
  if (Array.isArray(zorla) && zorla.length) {
    context.header.timeSignature.gruplamaDeseni = [...zorla];
  }
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

    // Tuplet İÇİNDEYKEN measureProgress face-value ile birikir (sıkıştırma düzeltmesi grup BİTİNCE
    // uygulanır) → geçici olarak ölçüyü aşar = YANLIŞ uyarı. Tuplet aktifken taşma uyarısı verme.
    if (expected > 0 && nextProgress > expected + 0.0001 && !context.aktifTuplet) {
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

function candidateScore(candidate, context, lookaheadDotted = false, lookaheadMinRemaining = 0) {
  const expected = Number(context.expectedMeasure16 || 0);
  const remaining = expected > 0 ? expected - Number(context.measureProgress16 || 0) : 0;
  const dur = duration16({ ...candidate, dotted: lookaheadDotted });

  // Çok-notalı tuplet grubunun İÇİNDEKİ bir nota (kalan>1) tek başına ölçünün TAMAMINI dolduramaz;
  // bu yüzden "tam doldurma" (+120) bonusu bastırılır. Aksi halde 4/4'te bir sekstüplet'in ilk 16'lık
  // notası, birlik (dur=16) okuması ölçüyü tam doldurduğu için yanlışlıkla birlik seçilirdi.
  // AYNI MANTIK lookahead ile: bu adaydan SONRA ölçüde başka nota/sus varsa (lookaheadMinRemaining>0)
  // ve aday ölçüyü doldurup onlara yer bırakmıyorsa (kalan - dur < sonrakilerin min süresi) tam-doldurma
  // yanıltıcıdır → bastırılır (örn. 4/4 başında 16'lık grup öncesi birlik-sus, birlik sanılmasın).
  const tupletIcinde = context.aktifTuplet && Number(context.aktifTuplet.kalan) > 1;
  const sonrakilereYerYok = lookaheadMinRemaining > 0.0001 && remaining > 0
    && (remaining - dur) < lookaheadMinRemaining - 0.0001;

  let score = 0;
  if (remaining > 0 && dur <= remaining + 0.0001) score += 100;
  if (!tupletIcinde && !sonrakilereYerYok && remaining > 0 && Math.abs(dur - remaining) < 0.0001) score += 120;
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
    let bestScore = candidateScore(best, context, lookaheadDotted, lookaheadMinRemaining);

    for (let i = 1; i < options.length; i += 1) {
      const candidate = options[i];
      const score = candidateScore(candidate, context, lookaheadDotted, lookaheadMinRemaining);
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
    // Ölçü bağlamı yoksa çift-anlamlı süre, BÜYÜK (birincil) değere çözülür:
    //   dot3+6 → birlik(1)  [16'lık değil],  dot3 → ikilik(2),  dot6 → dörtlük(4).
    // (Eskiden dot3+6 yanlışlıkla 16'lık=16 seçiyordu; diğer iki çift büyük değeri seçerken tutarsızdı.)
    const fallback = has3 && has6 ? 1 : has3 ? 2 : 4;
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
    Slur markerlarını ZİNCİRLERE grupla. Her ⠉ markerı kendi notasını SONRAKİ notaya bağlar; ardışık
    notalardaki markerlar (afterNoteGlobalIndex art arda VEYA çift-slur işaretinde aynı) sürekli TEK bir
    slur'dür. Arada marker'sız nota (boşluk) yeni slur başlatır. (Eskiden TÜM markerlar tek deve-slur'e
    katlanıyordu → 16 ayrı slur içeren parça braille'de yalnız 3 hücre/⠉⠉…⠉ olarak görünüyordu = bug.)
  */
  const slurZinciriKapat = (chain) => {
    if (!chain.length) return;
    const startIndex = Number(chain[0].afterNoteGlobalIndex);
    const endIndex = Number(chain[chain.length - 1].afterNoteGlobalIndex) + 1;
    if (!Number.isFinite(startIndex) || !Number.isFinite(endIndex) || endIndex <= startIndex) return;
    const notaIdler = noteIds.slice(startIndex, endIndex + 1).filter(Boolean);
    if (notaIdler.length < 2) return;
    // mode 'single': export'ta her nota çiftine ⠉ yazılır (girişle birebir round-trip). Çok-notalı
    // sürekli slur de ardışık ⠉ ile yazılır — standartta geçerli (tekli slur tekrarı).
    slurBagOlustur({
      mode: 'single',
      basId: notaIdler[0],
      sonId: notaIdler[notaIdler.length - 1],
      notaIdler,
    });
  };

  let zincir = [validMarkers[0]];
  for (let k = 1; k < validMarkers.length; k += 1) {
    const oncekiIdx = Number(zincir[zincir.length - 1].afterNoteGlobalIndex);
    const simdikiIdx = Number(validMarkers[k].afterNoteGlobalIndex);
    if (simdikiIdx === oncekiIdx || simdikiIdx === oncekiIdx + 1) {
      zincir.push(validMarkers[k]); // ardışık nota veya aynı nota (çift slur) → zincir sürer
    } else {
      slurZinciriKapat(zincir);
      zincir = [validMarkers[k]];
    }
  }
  slurZinciriKapat(zincir);
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
  context.grupDeger16 = null; // nota gruplama bağlamı ölçü sınırında biter
  context.grupSureIndeksi = null;
  context.oncekiNotaYazilanRv = 0; // 16'lık-dizi (lider tespiti) ölçü sınırında sıfırlanır
  context.oncekiNotaVurusIndex = null; // vuruş takibi ölçü sınırında sıfırlanır
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
  // DOUBLED tuplet pasajı aktifse ve aktif bir tuplet yoksa, bu nota yeni bir tuplet grubu başlatır
  // (pasaj boyunca her N nota otomatik tuplet'tir; tek işaret pasajı bitirene kadar).
  if (context.doublingTuplet && !context.aktifTuplet) {
    context.aktifTuplet = yeniTupletNesnesi(context, context.doublingTuplet);
  }
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

  // ÇARPMA (apejetür/appoggiatura) = SÜSLEME notası: yazılı süresiyle gösterilir ama ölçü süresine
  // SIFIR katkı yapar (komşu notadan zaman "çalar"). Bekleyen modifier'larda apejetür varsa bu nota
  // bir grace note'tur → measureProgress'i ilerletme; aksi halde gerçek notalar ölçüyü taşırır ve
  // çift-anlamlı süreleri yanlış çözülür (örn. Gigue 6/8'de dörtlük → 64'lük). Mordan/tril/grupeto
  // bir notanın ÜSTÜNDEKİ süslemedir (grace DEĞİL) → tam süre sayılır.
  const graceNota = (Array.isArray(context.pendingModifiers) ? context.pendingModifiers : [])
    .some((m) => /apejetür|apojyatür|appogg/i.test(String(m?.ad || '')));

  // NOTA GRUPLAMA (Bölüm — Lesson 4): küçük-değerli notalar (16'lık ve kısası) gruplanırken İLK nota
  // gerçek değeriyle, kalanı 8'LİK HÜCRE olarak yazılır ama hepsi liderin MÜZİKAL değerindedir.
  // reader.sureIndeksi 8'lik KALIR (reading-qa = braille yüzü), ama grup devamına `grupSureIndeksi`
  // (liderin gerçek süre indeksi) etiketlenir → editör adaptörü skor modelinde bunu kullanır ki ÇİZİM
  // (16'lık çift-kiriş), ÇALMA ve EXPORT doğru olsun. measureProgress (çift-anlam) lider değerini sayar.
  // Grup, 8'lik-OLMAYAN nota/sus/barline'da biter.
  let measureValue16 = graceNota ? 0 : selectedDuration16;
  let grupSureIndeksi = null;
  if (!graceNota) {
    const rv = Number(selected.realValue);
    // GRUPLAMA DEĞİŞKENDİR — vuruş (beat) yapısına bağlı: gruplama yalnızca BİR VURUŞ içinde geçerlidir
    // (her vuruş yeni lider/grup başlatır). Bu yüzden grup, NOTA YENİ VURUŞA geçtiğinde biter — yoksa
    // bir vuruşun 16'lık grubu, sonraki vuruşun GERÇEK 8'liklerine taşıp onları da 16'lık sanardı
    // (örn. Gruplama Örnek 2 ölçü3 beat3 mi/si 8'likleri). Vuruş deseni zaman imzasından gelir
    // (gorselVurusIndexAl: 4/4→[4,4,4,4], 6/8→[6,6], 3/8→[6] …). measureProgress16 = bu notadan ÖNCEKİ konum.
    // VURUŞ DEĞİŞTİ mi? Gruplama vuruş-içidir → grup VE 16'lık-dizi bağlamı (lider tespiti) yeni vuruşta
    // sıfırlanır. Aksi halde bir vuruşun son 16'lığı, sonraki vuruşun grup-liderinin "önceki 16'lık"ı
    // sanılır (örn. Gruplama Örnek 2 ölçü1 beat1 son 16'lık → beat2 C lideri reddedilirdi).
    // TUPLET İÇİNDE vuruş-resetini ATLA: tuplet TEK bir beam grubudur (gruplama=tuplet'in kendisi) ve
    // measureProgress16 tuplet boyunca SIKIŞTIRILMAMIŞ değerle ilerler → vuruş sınırını grup ortasında
    // geçip devam notalarını yanlışlıkla kırardı (örn. sekstüplet'in 5.-6. notası 8'lik sanılırdı).
    const vurusIndex = gorselVurusIndexAl(context.measureProgress16, context.header?.timeSignature);
    if (!context.aktifTuplet && context.oncekiNotaVurusIndex != null && vurusIndex !== context.oncekiNotaVurusIndex) {
      context.grupDeger16 = null;
      context.grupSureIndeksi = null;
      context.oncekiNotaYazilanRv = 0;
    }
    if (rv >= 16) {
      // Bu 16'lık GRUP LİDERİ mi yoksa GRUPLANMAMIŞ bireysel 16'lık mı? Gruplanmış grup = lider(tam-hücre)
      // + 8'lik-hücre devamlar; gruplanmamış = ardışık TAM 16'lık-hücreler (örn. 6/8'de 16'lıklardan sonra
      // 8'lik gelince gruplama İPTAL → tam-hücre). Lider KOŞULU: (a) sonraki hücre 8'lik-nota (groupState)
      // VE (b) AYNI VURUŞTA önceki YAZILAN nota 16'lık-değil. Aksi halde lider değil → grupDeger16 kurulmaz
      // → sonraki gerçek 8'likler 16'lık sanılmaz (süre korunur, imza değişse de).
      const oncekiYazilanRv = Number(context.oncekiNotaYazilanRv || 0);
      const liderMi = Boolean(groupState?.sonrakiSekizlikNota) && oncekiYazilanRv < 16;
      if (liderMi) {
        context.grupDeger16 = selectedDuration16;               // küçük-değerli grup lideri
        context.grupSureIndeksi = selected.sureIndeksi;         // liderin gerçek süre indeksi
      } else {
        context.grupDeger16 = null;                             // gruplanmamış bireysel 16'lık
        context.grupSureIndeksi = null;
      }
    } else if (rv === 8 && context.grupDeger16 != null) {
      measureValue16 = context.grupDeger16;                     // grup devamı: ölçü süresinde lider değeri
      grupSureIndeksi = context.grupSureIndeksi;                // çizim/çalma için liderin değeri
    } else {
      context.grupDeger16 = null;                               // 8'lik-olmayan (dörtlük+) → grup bitti
      context.grupSureIndeksi = null;
    }
    context.oncekiNotaYazilanRv = rv;                           // bu notanın YAZILAN değeri (devam=8)
    context.oncekiNotaVurusIndex = vurusIndex;                  // bu notanın vuruşu (sonraki için)
  }

  // EFEKTİF ölçü süresi (ölçü-toplamı/uyarı için): grace=0, gruplama lider değeri, tuplet sıkıştırması
  // (× inTimeOf/count). measureProgress (çift-anlam çözümü) measureValue16+footprint düzeltmesiyle ayrı
  // yürür; bu measureDur16 yalnızca buildMeasures total16'yı tuplet-farkında yapar (örn. Weber 4 üçleme
  // = 8/8, face-value 20/8 yanlış uyarısı yerine). Uniform tuplet'te sum(measureDur16)=footprint.
  let measureDur16 = measureValue16;
  if (context.aktifTuplet && Number(context.aktifTuplet.count) > 0) {
    measureDur16 = measureValue16 * (Number(context.aktifTuplet.inTimeOf || 1) / Number(context.aktifTuplet.count));
  }

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
    measureDur16,
    grupSureIndeksi,
    realValue: selected.realValue,
    dotted: Boolean(selected.dotted || Number(selected.dotCount || 0) > 0),
    dotCount: Number(selected.dotCount || 0),
    graceNota,
  }, measureValue16);

  flushPendingModifiers(context, noteItem);

  const noteGlobalIndex = context.noteSequence.length;
  noteItem.noteGlobalIndex = noteGlobalIndex;
  context.noteSequence.push(noteItem.id);
  context.items.push(noteItem);
  // Aktif tuplet grubundaysa notayı etiketle; grup dolunca context.tupletler'e finalize et.
  if (context.aktifTuplet && context.aktifTuplet.kalan > 0) {
    noteItem.tupletId = context.aktifTuplet.id;
    noteItem.tupletAd = context.aktifTuplet.ad;
    context.aktifTuplet.notaIdler.push(noteItem.id);
    // measureProgress düzeltmesi için: lider notanın süresi + face-value toplamı izlenir.
    if (context.aktifTuplet.leaderDur16 == null) context.aktifTuplet.leaderDur16 = selectedDuration16;
    context.aktifTuplet.faceSum16 += selectedDuration16;
    context.aktifTuplet.kalan -= 1;
    if (context.aktifTuplet.kalan === 0) {
      // Tuplet TAMAMLANDI: measureProgress face-value ile artırıldı (örn. sekstüplet 1+5×2=11), ama
      // gerçek footprint = liderNotaSüresi × inTimeOf (sekstüplet 16'lık → 1×4=4). Farkı düzelt ki
      // tuplet'TEN SONRAKİ çift-anlamlı notalar (örn. son birlik) measure-fill ile doğru çözülsün.
      const footprint16 = Number(context.aktifTuplet.leaderDur16 || 0) * Number(context.aktifTuplet.inTimeOf || 1);
      const fark = footprint16 - Number(context.aktifTuplet.faceSum16 || 0);
      if (Number.isFinite(fark) && Math.abs(fark) > 0.000001) {
        context.measureProgress16 = Math.max(0, Number(context.measureProgress16 || 0) + fark);
      }
      if (!Array.isArray(context.tupletler)) context.tupletler = [];
      context.tupletler.push({
        id: context.aktifTuplet.id,
        ad: context.aktifTuplet.ad,
        hucreler: context.aktifTuplet.hucreler,
        notaIdler: [...context.aktifTuplet.notaIdler],
      });
      context.aktifTuplet = null;
      // Tuplet bir beam-grubu SINIRIDIR → nota gruplama bağlamını bitir. Aksi halde tuplet'ten SONRAKİ
      // 8'lik (örn. Weber bar6 üçleme-sonrası A quaver) yanlışlıkla grup-devamı (lider değeri) sayılır.
      // Vuruş takibini de sıfırla (measureProgress düzeltildi → sonraki nota taze vuruş bağlamında başlar).
      context.grupDeger16 = null;
      context.grupSureIndeksi = null;
      context.oncekiNotaYazilanRv = 0;
      context.oncekiNotaVurusIndex = null;
    }
  }
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
  const selected = selectCandidate(
    candidates, context, groupState, cell,
    Boolean(groupState?.lookaheadDotted),
    Number(groupState?.lookaheadMinRemaining || 0),
  );
  if (!selected) return null;
  context.grupDeger16 = null; // sus, nota gruplamasını bitirir
  context.grupSureIndeksi = null;
  context.oncekiNotaYazilanRv = 0; // sus, 16'lık-dizisini kırar (lider tespiti)
  const selectedDuration16 = duration16(selected);

  let restMeasureDur16 = selectedDuration16;
  if (context.aktifTuplet && Number(context.aktifTuplet.count) > 0) {
    restMeasureDur16 = selectedDuration16 * (Number(context.aktifTuplet.inTimeOf || 1) / Number(context.aktifTuplet.count));
  }

  const restItem = applyMeasurePosition(context, {
    id: nowId('rest', context.items.length),
    tip: 'sus',
    sureIndeksi: selected.sureIndeksi,
    sureAd: selected.sureAd || sureAdiAl(selected.sureIndeksi),
    char: cell.char,
    duration16: selectedDuration16,
    measureDur16: restMeasureDur16,
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
  // Satır başı bağlamı: yalnızca satırın İLK grubu için geçerli; burada tüket.
  const satirBasi = !!context?.satirBasiBekliyor;
  if (context) context.satirBasiBekliyor = false;

  // Satır başı ölçü numarası (Lesson 5, PDF s.40): satırın İLK grubu TÜMÜYLE üst-rakam
  // (a–j) ise bu bir ölçü numarasıdır — müzik DEĞİL (müzik satırının ilk notası oktav
  // işaretiyle başlar, üst-rakamla değil). Atla; ardından gelen ayraç boşluğu da barline
  // DEĞİLDİR (numarayı müzikten ayıran boşluk). Bar 1=⠁, bar 16=⠁⠋ gibi.
  if (satirBasi && tokens.length && tokens.every((t) => UPPER_DIGIT_BY_DASH.has(dotsToDashKey(t.dots)))) {
    const no = tokens.map((t) => UPPER_DIGIT_BY_DASH.get(dotsToDashKey(t.dots))).join('');
    // Satır başı ölçü numarası = YENİ ölçünün başı → önceki ölçüyü KAPAT. handleLineEnd
    // satır sonunu yalnız nota/sus ise kapatıyor; önceki satır ⠶ (bar-repeat) / özel işaretle
    // bittiyse kapatmıyordu → sarılmış numaralı dosyada iki ölçü birleşiyordu. Buradaki
    // separatorBarlineOlustur idempotent (zaten kapalıysa/ilk ölçüyse null döner) → güvenli;
    // yalnız satır-başı numaralı (sarılmış) dosyaları etkiler.
    separatorBarlineOlustur({ char: '⠀', dots: [], type: 'space' }, context);
    tokens.forEach((t) => pushDebug(context, t, {
      category: 'bar-number',
      meaning: `${no}. ölçü numarası`,
      effect: 'satır başı ölçü numarası (müzik içeriği değil; atlandı)',
    }));
    context.barNoSonrasiBoslukAtla = true;
    return;
  }

  const groupState = {
    lookaheadDotted: false,
    lookaheadMinRemaining: 0,
  };
  const consumedAugmentationDotCells = new Set();

  context.lastSeparatorCreatedBarline = false; // changed

  // Eser-İÇİ DONANIM (anahtar) DEĞİŞİMİ: yalın aksidental dizisi (⠣⠣⠣ = 3 bemol) veya ⠼+rakam+işaret
  // (n≥4). §14 gereği çevresine boşluk konur → kendi grubunu oluşturur. Grubun TAMAMI donanımsa anahtar
  // değişimidir; ardından nota gelirse (örn. ⠣⠫) bunlar nota aksidentalleridir (tuketilen<grup uzunluğu).
  // Yakalanmazsa ⠣⠣⠣'nin son bemolü sonraki notaya pending accidental olarak sızar (mi2 → mi2 bemol).
  if (tokens.length) {
    const ks = keySignatureOnEkiCozumle(tokens);
    if (ks && ks.tuketilen === tokens.length) {
      const item = pushSpecialItem(context, {
        id: nowId('key-signature-change', context.items.length),
        tip: 'keySignatureChange',
        ad: ks.keySignature.ad,
        gorunum: ks.keySignature.gorunum,
        hucreler: ks.keySignature.hucreler,
        keySignature: ks.keySignature,
        measureNo: context.activeMeasure,
      });
      setReaderKeySignature(context, ks.keySignature);
      context.zamanDegisimiSonrasiBoslukAtla = true; // §14: sonraki boşluk barline değil (formatlama)
      tokens.forEach((t) => pushDebug(context, t, {
        category: 'key-signature',
        meaning: `eser içi donanım değişimi (${ks.keySignature.ad})`,
        effect: 'çok hücreli işaret',
        itemId: item.id,
      }));
      return;
    }
  }

  // Çok-sözcüklü İFADE metni (örn. "a tempo" = ⠜⠁⠀⠞⠑⠍⠏⠕⠜): söz işareti ⠜ (3-4-5) ile açılır ve
  // ikinci bir ⠜ ile kapanır; içindeki boşluk (⠀) metnin parçasıdır, ölçü çizgisi DEĞİL. Bu yüzden
  // ifade BİRDEN ÇOK gruba yayılabilir (boşluk grupları böler) → context.ifadeIcinde ile sürdürülür.
  // İfade grubu = YALNIZCA söz işareti + harf içerir (nota/oktav/aksidental YOK). Bilinen dinamikler
  // (⠜+harf+NOTA aynı grupta) ya da nüans/hairpin (matchModifierSequence ile tanınır) buraya DÜŞMEZ.
  // Tek-sözcüklü ayraçsız ifade (örn. "dolce" notaya bitişik, kapanış ⠜'süz) modellenmez — bilinen sınırlama.
  const WORD_SIGN_KEY = '345';
  const grupSadeceIfade = tokens.length > 0
    && dotsToKey(tokens[0].dots) === WORD_SIGN_KEY
    && !matchModifierSequence(tokens, 0)
    && tokens.every((t) => {
      const k = dotsToKey(t.dots);
      return k === WORD_SIGN_KEY || !!BRAILLE_LETTERS_TR[k];
    });
  if (context.ifadeIcinde || grupSadeceIfade) {
    const sonKey = dotsToKey(tokens[tokens.length - 1]?.dots || []);
    const kapanis = context.ifadeIcinde ? (sonKey === WORD_SIGN_KEY) : (sonKey === WORD_SIGN_KEY && tokens.length >= 2);
    tokens.forEach((t) => pushDebug(context, t, {
      category: 'expression',
      meaning: 'çok-sözcüklü ifade metni',
      effect: 'ifade metni — atlandı (metin modellenmez)',
    }));
    context.ifadeIcinde = !kapanis;
    // İfade içi/sonu boşluk barline değildir (§14): sonraki boşluğu atla.
    context.zamanDegisimiSonrasiBoslukAtla = true;
    return;
  }

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

    // DOUBLED tuplet (örn. ⠆⠆ = doubled triplet): aynı tek-hücre tuplet işareti İKİ KEZ ardışık → bir
    // PASAJ boyunca HER grup o tuplet'tir; pasaj tek işaretle (son grubu işaret eder) biter. PDF Lesson 8
    // (Weber bars 1-3). Yakalanmazsa ilk ⠆ alt-rakam-2/barline sanılıp SAHTE boş ölçü oluşur (kullanıcı:
    // "weber … ilk ölçü neden boş"). doublingTuplet aktifken readNoteCell her grup için otomatik armalar.
    {
      const k0 = dotsToDashKey(tokens[i].dots);
      const def0 = TUPLET_SIGN_MAP.get(k0);
      if (def0 && LOWER_DIGIT_BY_DASH.has(k0)) {
        const k1 = i + 1 < tokens.length ? dotsToDashKey(tokens[i + 1].dots) : '';
        if (k0 === k1) {
          context.doublingTuplet = { count: def0.count, ad: def0.ad, hucreler: def0.hucreler };
          pushDebug(context, tokens[i], { category: 'tuplet', meaning: `${def0.ad} (doubled başlangıç)`, effect: 'pasaj boyunca her grup tuplet' });
          pushDebug(context, tokens[i + 1], { category: 'tuplet', meaning: `${def0.ad} (doubled)`, effect: 'çift işaret' });
          i += 1;
          continue;
        }
        if (context.doublingTuplet && !context.aktifTuplet && notaGrubuBaslangici(tokens, i + 1)) {
          // doubling aktif + tek işaret + ardından nota → pasajın SON grubu; doubling biter, son tuplet armanır.
          context.aktifTuplet = yeniTupletNesnesi(context, context.doublingTuplet);
          context.doublingTuplet = null;
          pushDebug(context, tokens[i], { category: 'tuplet', meaning: `${def0.ad} (doubled bitiş)`, effect: 'pasajın son grubu' });
          continue;
        }
      }
    }

    // Tuplet (üçleme/düzensiz grup) işareti: tek-hücre ⠆(2-3) veya çok-hücre ⠸…⠄. Ardından N nota
    // (üçleme=3, ikileme=2 …) tuplet grubudur. Tek-hücre ⠆ alt-rakam-2 ile çakışır → ardından nota
    // grubu varsa tuplet say (trill/turn presedanı; kanonik formda satır-içi ölçü-no yoktur).
    {
      let tupletEslesme = null;
      for (let len = Math.min(TUPLET_MAX_LEN, tokens.length - i); len >= 1; len -= 1) {
        const seqKey = tokens.slice(i, i + len).map((t) => dotsToDashKey(t.dots)).join('|');
        const tdef = TUPLET_SIGN_MAP.get(seqKey);
        if (tdef) {
          if (len === 1 && LOWER_DIGIT_BY_DASH.has(seqKey) && !notaGrubuBaslangici(tokens, i + len)) continue;
          tupletEslesme = { tdef, len };
          break;
        }
      }
      if (tupletEslesme) {
        const { tdef, len } = tupletEslesme;
        context.aktifTuplet = yeniTupletNesnesi(context, { count: tdef.count, ad: tdef.ad, hucreler: tdef.hucreler });
        for (let c = 0; c < len; c += 1) {
          pushDebug(context, tokens[i + c], { category: 'tuplet', meaning: `${tdef.ad} işareti`, effect: `sonraki ${tdef.count} nota tuplet grubu` });
        }
        i += len - 1;
        continue;
      }
    }

    // Volta (1./2. ev): sayı göstergesi ⠼ (3-4-5-6) + rakam (2 → 1. ev, 2-3 → 2. ev).
    // Export'ta ardından dot-3 ayraç hücresi gelebilir; onu da tüketiriz.
    if (dashKey === '3-4-5-6') {
      const next1 = tokens[i + 1] ? dotsToDashKey(tokens[i + 1].dots) : '';
      const next2 = tokens[i + 2] ? dotsToDashKey(tokens[i + 2].dots) : '';
      // ⠤ (3-6) hyphen takip ediyorsa bu volta DEĞİL ölçü-no ARALIĞIDIR (⠼⠂⠤⠖ = 1-6) → repeat-instruction'a bırak.
      const voltaTip = next2 === '3-6' ? null
        : next1 === '2' ? 'volta1' : (next1 === '2-3' ? 'volta2' : null);
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

      // Eser-İÇİ zaman imzası DEĞİŞİMİ: ⠼ + üst-rakam(lar) + alt-rakam (örn. ⠼⠉⠲ = 3/4).
      // (Volta ⠼+alt-rakam'dan farklı; burada üst-rakam numerator var.) Export §14 gereği
      // çevresine boşluk koyar; SONRAKİ boşluk barline DEĞİLdir → atlama bayrağı kurulur.
      let tsDegisimiBulundu = false;
      for (const len of [4, 3]) {
        if (i + len > tokens.length) continue;
        const pattern = tokens.slice(i, i + len).map((t) => dotsToKey(t.dots)).join('|');
        const tsVal = TIME_SIGNATURE_PATTERNS[pattern];
        if (tsVal) {
          const item = pushSpecialItem(context, {
            id: nowId('time-signature-change', context.items.length),
            tip: 'timeSignatureChange',
            ad: tsVal,
            gorunum: tsVal,
            hucreler: tokens.slice(i, i + len).map((t) => [...t.dots]),
            measureNo: context.activeMeasure,
          });
          // Yeni ölçü süresi beklentisini güncelle (dual-meaning çözümü için); activeMeasure SIFIRLANMAZ.
          context.expectedMeasure16 = timeSignatureExpected16(tsVal);
          context.measureProgress16 = 0;
          context.zamanDegisimiSonrasiBoslukAtla = true;
          for (let k = i; k < i + len; k += 1) {
            pushDebug(context, tokens[k], { category: 'time-signature', meaning: `eser içi zaman değişimi (${tsVal})`, effect: 'çok hücreli işaret', itemId: item.id });
          }
          i += len - 1;
          tsDegisimiBulundu = true;
          break;
        }
      }
      if (tsDegisimiBulundu) continue;

      // Lesson 10 TEKRAR-CİHAZI sayıları: ⠼ + üst/alt rakam(lar), opsiyonel ⠼/⠤ ile devam.
      //   ⠼N      (bar-repeat sayısı ⠶⠼N, geriye-sayısal tekrar ⠼N⠼M)
      //   ⠼<alt>⠤<alt>  (ölçü-no aralığı tekrarı, örn. ⠼⠂⠤⠖ = 1-6)
      // Müzik DEĞİL — navigasyon/yönerge. 'repeatInstruction' item'ı olarak çöz (unknown üretme).
      {
        let p = i + 1;
        let ilkRakamUst = null;       // true=üst-rakam (geri-sayısal), false=alt-rakam (mutlak ölçü no)
        let ayraciTipi = null;        // 'hyphen' (⠤ aralık) | 'numara' (⠼ ikinci sayı) | null
        const sayilar = [];
        const rakamOku = () => {
          let s = '';
          while (p < tokens.length) {
            const dk = dotsToDashKey(tokens[p].dots);
            let d = UPPER_DIGIT_BY_DASH.get(dk);
            let ust = true;
            if (d == null) { d = LOWER_DIGIT_BY_DASH.get(dk); ust = false; }
            if (d == null) break;
            if (ilkRakamUst === null) ilkRakamUst = ust;
            s += d; p += 1;
          }
          return s;
        };
        sayilar.push(rakamOku());
        while (p < tokens.length) {
          const dk = dotsToDashKey(tokens[p].dots);
          if (dk === '3-6') { ayraciTipi = 'hyphen'; p += 1; sayilar.push(rakamOku()); }
          else if (dk === '3-4-5-6') { ayraciTipi = 'numara'; p += 1; sayilar.push(rakamOku()); }
          else break;
        }
        const gecerli = sayilar.filter((s) => /\d/.test(s)).map((s) => parseInt(s, 10));
        if (gecerli.length) {
          // İKİ braille sayısal tekrar cihazı (PDF s.95-98):
          // (1) GERİ-SAYISAL (ÜST-rakam): `⠼N⠼M` = "N ölçü geri say, M ölçü çal"; tek `⠼N` = N geri/N çal
          //     (ara müzik yoksa; Soon `⠼5`/`⠼2`). Jingle Bells `⠼8⠼6` = 8 geri, 6 çal (bars 9-14=1-6).
          // (2) BAR-NUMBER (ALT-rakam): `⠼<n>` / `⠼<n>⠤<m>` = MUTLAK ölçü no(ları) (Let Me Call `⠼1-6`).
          // İkisi de editör adaptöründe GENİŞLETİLİR (skor tam olur); engine orijinal hücreleri yazar.
          const sep = ayraciTipi === 'hyphen' ? '-' : ayraciTipi === 'numara' ? '/' : '';
          const metin = sayilar.join(sep);
          let repeatTuru; let geriSayisi = null; let calinanOlcu = null;
          let mutlakBaslangic = null; let mutlakBitis = null;
          if (ilkRakamUst === true) {
            repeatTuru = 'backward-numeral';
            geriSayisi = gecerli[0];
            calinanOlcu = gecerli.length > 1 ? gecerli[1] : gecerli[0];
          } else {
            repeatTuru = 'bar-number';
            mutlakBaslangic = gecerli[0];
            mutlakBitis = gecerli.length > 1 ? gecerli[1] : gecerli[0];
            calinanOlcu = Math.max(1, mutlakBitis - mutlakBaslangic + 1);
          }
          const item = pushSpecialItem(context, {
            id: nowId('repeat-instruction', context.items.length),
            tip: 'repeatInstruction',
            repeatTuru,
            geriSayisi,
            calinanOlcu,
            mutlakBaslangic,
            mutlakBitis,
            geriOlcuSayisi: repeatTuru === 'backward-numeral' ? geriSayisi : null, // geriye dönük uyum
            ad: `tekrar yönergesi (${metin})`,
            gorunum: metin,
            hucreler: tokens.slice(i, p).map((t) => [...t.dots]),
            measureNo: context.activeMeasure,
          });
          for (let k = i; k < p; k += 1) {
            pushDebug(context, tokens[k], { category: 'repeat', meaning: `tekrar yönergesi (${metin})`, effect: 'Lesson 10 tekrar cihazı', itemId: item.id });
          }
          i = p - 1;
          continue;
        }
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
      // Satır başı ölçü numarası (Lesson 5): satırın ilk hücresindeki alt-rakam
      // dizisi, ardından nota gelse de ölçü numarasıdır (süsleme/grace DEĞİL).
      // İndirilen numaralı .brf geri okunduğunda hayalet süsleme oluşmaz.
      const satirBasiNumara = satirBasi && grupBasi;

      // Braille ÖLÇÜ-TEKRARI ⠶ (2-3-5-6): önceki ölçüyü aynen tekrarlar. Grup BAŞINDA (kendi ölçüsü) ise
      // bar-repeat'tir. Ardından ⠼N gelirse N KOPYA (örn. ⠶⠼⠓ = önceki ölçünün 8 kopyası, bars 2-9 = bar1).
      // (⠶ ayrıca lower-7 rakamıyla çakışır; grup-başı i===0 + sonraki ⠼N bar-repeat'i ayırır.) Eskiden
      // yalnız TEK ⠶ (tumGrup) tanınıyordu → ⠶⠼N'de ⠶ ayrılıp ⠼N 'repeatInstruction' oluyordu (n okunmuyordu).
      if (grupBasi && runLen === 1 && dashKey === '2-3-5-6') {
        let p = i + 1;
        let sayi = 1;
        if (p < tokens.length && dotsToKey(tokens[p].dots) === '3456') { // ⠼ sayı işareti
          p += 1;
          let s = '';
          while (p < tokens.length) {
            const d = UPPER_DIGIT_BY_DASH.get(dotsToDashKey(tokens[p].dots));
            if (d == null) break;
            s += d; p += 1;
          }
          if (s) sayi = Math.max(1, parseInt(s, 10) || 1);
        }
        const item = pushSpecialItem(context, {
          id: nowId('braille-repeat', context.items.length),
          tip: 'brailleRepeat',
          ad: sayi > 1 ? `braille ölçü tekrarı ×${sayi}` : 'braille ölçü tekrarı',
          gorunum: '𝄎',
          hucreler: tokens.slice(i, p).map((t) => [...t.dots]),
          tekrarSayisi: sayi,
          measureNo: context.activeMeasure,
        });
        for (let k = i; k < p; k += 1) {
          pushDebug(context, tokens[k], {
            category: 'repeat',
            meaning: sayi > 1 ? `braille ölçü tekrarı ×${sayi}` : 'braille ölçü tekrarı',
            effect: 'önceki ölçüyü tekrarlar',
            itemId: item.id,
          });
        }
        i = p - 1;
        continue;
      }

      // Tek hücreli süsleme (tril/turn) ölçü başında alt-rakamla çakışır:
      // ardından bir nota grubu geliyorsa bu ölçü numarası DEĞİL süslemedir →
      // bar-number'ı atla, aşağıdaki süsleme eşleştiricisine bırak.
      const cakisanSusleme =
        !satirBasiNumara &&
        runLen === 1 &&
        CAKISAN_TEK_SUSLEME.has(dashKey) &&
        notaGrubuBaslangici(tokens, j);

      // ÇOK-HÜCRELİ modifier başlangıcı mı? (örn. ters grupeto ⠲⠇ = '2-5-6|1-2-3' — ilk hücre
      // ⠲ lower-rakam-4 ile çakışır.) Bu konumdan başlayan hücreler bilinen bir çok-hücreli
      // süsleme/nüans dizisiyse ölçü numarası DEĞİL → atlama. (Modifier dizilerinin lower-rakam
      // olmayan hücreleri olduğundan çok-haneli ölçü numarasıyla karışmaz.)
      const cokHucreModifier = satirBasiNumara ? false : (() => {
        const maxLen = REVERSE_MAPS.modifierMaxLen || 1;
        for (let len = Math.min(maxLen, tokens.length - i); len >= 2; len -= 1) {
          const seqKey = tokens.slice(i, i + len).map((t) => dotsToDashKey(t.dots)).join('|');
          if (REVERSE_MAPS.modifierByCellKey?.has(seqKey)) return true;
        }
        return false;
      })();

      // Grup başı veya grup sonundaki rakam dizisi → ölçü numarası (atlanır).
      if ((grupBasi || grupSonu) && !cakisanSusleme && !cokHucreModifier) {
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

    // Tek-sözcüklü İFADE metni notaya BİTİŞİK (örn. "dolce" = ⠜⠙⠕⠇⠉⠑ + ⠨ + nota). ÇAKIŞMA: kreşendo/
    // dekreşendo HAIRPIN'i de ⠜+harf'tir (decrescHair=⠜⠙, crescHair=⠜⠉); AYRICA braille nota hücreleri
    // harf hücresidir (⠑ = hem 'e' hem RE notası). Bu yüzden "⠜'den sonra harf var mı" yetmez — gerçek
    // bir NOTA OLMAYAN saf-metin harfi (örn. ⠕=o, ⠇=l, ⠞=t) aranır: hairpin ⠜⠉ bir notaya (⠑) bağlanır,
    // ifade "dolce" ise saf-metin harfleri içerir. Bilinen dinamik (cresc/decresc/dim/rit — period'lu)
    // tüm diziyi kapsadığında KORUNUR. (Çok-sözcüklü ⠜…⠜ saf-ifade grupları grup başında ele alınır.)
    if (dashKey === '3-4-5') {
      let runEnd = i + 1;
      while (runEnd < tokens.length && BRAILLE_LETTERS_TR[dotsToKey(tokens[runEnd].dots)]) runEnd += 1;
      let safMetinVar = false;
      for (let t = i + 1; t < runEnd; t += 1) {
        const dk = dotsToDashKey(tokens[t].dots);
        const muzikAnlami = REVERSE_MAPS.noteByCellKey.has(dk) || REVERSE_MAPS.restByCellKey.has(dk)
          || REVERSE_MAPS.octaveByCellKey.has(dk) || REVERSE_MAPS.accidentalByCellKey.has(dk)
          || dk === '1-4' || dk === '4'; // slur / tie-öncesi & 1.oktav
        if (!muzikAnlami) { safMetinVar = true; break; }
      }
      const mm = matchModifierSequence(tokens, i);
      const bilinenKapsiyor = mm && (i + mm.length) >= runEnd; // dinamik tüm harf dizisini (±period) kapsar mı
      if (safMetinVar && !bilinenKapsiyor) {
        let j = runEnd;
        if (j < tokens.length && dotsToKey(tokens[j].dots) === '345') j += 1; // kapanış söz işareti
        for (let c = i; c < j; c += 1) {
          pushDebug(context, tokens[c], {
            category: 'expression',
            meaning: 'ifade metni',
            effect: 'tek-sözcüklü ifade — atlandı (metin modellenmez)',
          });
        }
        i = j - 1;
        continue;
      }
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

    // ⠈ (dot 4) ÇİFT ANLAMLI: uzatma bağı (tie) ön işareti ⠈⠉ ([4]+[1-4]) VEYA 1. oktav işareti.
    // Yalnızca SONRAKİ hücre ⠉ ([1-4]) ise tie ön işaretidir; aksi halde 1. oktav işaretidir
    // (aşağıdaki octaveByCellKey çözümüne bırakılır). [1-4] bir nota değildir; nota gelirse oktavdır.
    if (rawKey === '4' && (tokens[i + 1] ? dotsToKey(tokens[i + 1].dots) : '') === '14') {
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

    // Cümle bağı (köşeli/bracket slur) — İKİ HÜCRELİ, tek-hücreli oktav çözümünden ÖNCE ele alınmalı:
    //   başlangıç ⠰⠃ = '56'+'12'  (ilk hücre ⠰ tek başına 6. oktav işaretidir)
    //   bitiş    ⠘⠆ = '45'+'23'  (ilk hücre ⠘ tek başına 2. oktav işaretidir)
    // Tek-hücreli çözümden önce yakalanmazsa ⠰/⠘ oktav işareti sanılır → sonraki notanın oktavı bozulur
    // (örn. fa3 → fa6), ikinci hücre ⠃ harf, ⠆ ise sahte ölçü çizgisi olarak okunurdu. (muzik.js MUZIK_BAGLAR)
    {
      const next1 = tokens[i + 1] ? dotsToKey(tokens[i + 1].dots) : '';
      const braketBag = (rawKey === '56' && next1 === '12') ? { tip: 'cumleBagiBaslangici', ad: 'cümle bağı başlangıcı' }
                      : (rawKey === '45' && next1 === '23') ? { tip: 'cumleBagiBitisi', ad: 'cümle bağı bitişi' }
                      : null;
      if (braketBag) {
        const marker = {
          id: nowId(braketBag.tip, context.slurMarkers.length),
          tip: braketBag.tip,
          markerIndex: context.slurMarkers.length,
          lineIndex: cell.lineIndex,
          cellIndex: cell.cellIndex,
          char: `${cell.char}${tokens[i + 1].char}`,
          afterNoteId: context.lastNote?.id || null,
          afterNoteGlobalIndex: Number.isFinite(context.lastNote?.noteGlobalIndex)
            ? context.lastNote.noteGlobalIndex
            : null,
          measureNo: context.activeMeasure,
        };
        context.slurMarkers.push(marker);
        pushDebug(context, cell, { category: 'slur', meaning: `${braketBag.ad} (başlangıç hücresi)`, effect: 'çok hücreli cümle bağı', itemId: marker.id });
        pushDebug(context, tokens[i + 1], { category: 'slur', meaning: braketBag.ad, effect: 'çok hücreli cümle bağı tamamlandı', itemId: marker.id });
        i += 1;
        continue;
      }
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
      // Bu notadan SONRA ölçüde kalan notaların min toplam süresi → çift-anlamlı süreyi çözerken
      // aday onlara yer bırakmalı (tam-doldurma bastırması). Noktalı ise sonrakiler i+2'den başlar.
      const lookaheadMinRemaining = remainingMinDuration16(tokens, i + (lookaheadDotted ? 2 : 1), context);
      if (lookaheadDotted && nextToken) {
        consumedAugmentationDotCells.add(nextToken);
      }
      // GRUPLAMA LİDER tespiti için: bir grup EN AZ 3 nota olmalı (lider + ≥2 devam; export kuralı
      // sayi<3 → gruplamaz). Devamlar 8'LİK-HÜCRE notasıdır (taban hücre, dot 3 ve 6 YOK). Bu yüzden lider
      // KOŞULU: sonraki İKİ NOTA da 8'lik-hücre. Tek 8'lik (örn. F4-16 + E4 = 2 nota) gruplanmamıştır →
      // E4 gerçek 8'lik kalmalı. Devamlar oktav/aksidental işareti TAŞIYABİLİR → bu işaretleri atlayıp
      // sonraki NOTA hücrelerini bul (yoksa Beethoven Op.24'teki naturel-işaretli devam grubu kırılır).
      const sekizlikNotaHucresiMi = (t) => Boolean(t
        && REVERSE_MAPS.noteByCellKey.has(dotsToDashKey(t.dots || []))
        && !(t.dots || []).includes(3) && !(t.dots || []).includes(6));
      let sonraki8lik = 0;
      for (let j = i + 1; j < tokens.length && sonraki8lik < 2; j += 1) {
        const dk = dotsToDashKey(tokens[j].dots || []);
        if (REVERSE_MAPS.octaveByCellKey.has(dk) || REVERSE_MAPS.accidentalByCellKey.has(dk)) continue; // işaret → atla
        if (sekizlikNotaHucresiMi(tokens[j])) { sonraki8lik += 1; continue; }
        break; // 8'lik-olmayan (tam-16'lık/sus/barline/dörtlük) → dur
      }
      const sonrakiSekizlikNota = sonraki8lik >= 2;

      groupState.lookaheadDotted = lookaheadDotted;
      groupState.lookaheadMinRemaining = lookaheadMinRemaining;
      groupState.sonrakiSekizlikNota = sonrakiSekizlikNota;
      readNoteCell(cell, context, groupState, noteCandidates);
      groupState.lookaheadDotted = false;
      groupState.lookaheadMinRemaining = 0;
      groupState.sonrakiSekizlikNota = false;
      continue;
    }

    const restCandidates = REVERSE_MAPS.restByCellKey.get(dashKey);
    if (Array.isArray(restCandidates) && restCandidates.length > 0) {
      const restNext = tokens[i + 1];
      const restDotted = restNext ? dotsToKey(restNext.dots || []) === '3' : false;
      groupState.lookaheadMinRemaining = remainingMinDuration16(tokens, i + (restDotted ? 2 : 1), context);
      readRestCell(cell, context, restCandidates, groupState);
      groupState.lookaheadMinRemaining = 0;
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

    // Söz/ifade işareti ⠜ (3-4-5) tek başına kaldı (çok-sözcüklü ifade, örn. "a tempo" =
    // ⠜⠁⠀⠞⠑⠍⠏⠕⠜ açılış/kapanış söz işaretleri). Bilinen dinamikler yukarıda maximal-munch ile
    // çözülür; kalan söz işareti ifade işaretidir → atla (unknown üretme). (Çok-sözcüklü ifade
    // metni tam modellenmez — bilinen sınırlama.)
    if (dashKey === '3-4-5') {
      pushDebug(context, cell, {
        category: 'expression',
        meaning: 'söz/ifade işareti',
        effect: 'çok-sözcüklü ifade işareti — atlandı (metin modellenmez)',
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

// ── Donanım (key signature) çözümleme ────────────────────────────────────────
// Standart: 1-3 diyez/bemol → işaret tekrar (⠩/⠣ × N); 4-7 → ⠼N + işaret.
const KS_SHARP_KEY = '146'; // ⠩
const KS_FLAT_KEY = '126';  // ⠣
const KS_NUM_KEY = '3456';  // ⠼
const KS_DIGIT_DEGER = { 145: 4, 15: 5, 124: 6, 1245: 7 };
const KS_DIGIT_HUCRE = { 4: [1, 4, 5], 5: [1, 5], 6: [1, 2, 4], 7: [1, 2, 4, 5] };

// braille cell dizisinin BAŞINDAN bir donanım peel eder. → { keySignature, tuketilen } | null
function keySignatureOnEkiCozumle(braille) {
  if (!braille.length) return null;
  const keys = braille.map((t) => dotsToKey(t.dots));
  const accCellAl = (tur) => (tur === 'diyez' ? [1, 4, 6] : [1, 2, 6]);
  const ksYap = (tur, sayi, hucreler) => ({
    keySignature: { ad: `${sayi} ${tur === 'diyez' ? 'diyezli' : 'bemollü'}`, gorunum: `${sayi} ${tur === 'diyez' ? 'diyezli' : 'bemollü'}`, hucreler },
  });

  // 1-3: tekrarlı diyez/bemol
  if (keys[0] === KS_SHARP_KEY || keys[0] === KS_FLAT_KEY) {
    const tur = keys[0] === KS_SHARP_KEY ? 'diyez' : 'bemol';
    let n = 0;
    while (n < keys.length && n < 3 && keys[n] === keys[0]) n += 1;
    const hucreler = Array.from({ length: n }, () => [...accCellAl(tur)]);
    return { ...ksYap(tur, n, hucreler), tuketilen: n };
  }
  // 4-7: ⠼ + rakam + işaret
  if (keys[0] === KS_NUM_KEY && keys.length >= 3) {
    const sayi = KS_DIGIT_DEGER[keys[1]];
    const tur = keys[2] === KS_SHARP_KEY ? 'diyez' : keys[2] === KS_FLAT_KEY ? 'bemol' : null;
    if (sayi >= 4 && sayi <= 7 && tur) {
      const hucreler = [[3, 4, 5, 6], [...KS_DIGIT_HUCRE[sayi]], [...accCellAl(tur)]];
      return { ...ksYap(tur, sayi, hucreler), tuketilen: 3 };
    }
  }
  return null;
}

export function setReaderKeySignature(context, keySignature) {
  if (!keySignature) return;
  context.header.keySignature = keySignature;
}

export function detectHeaderLineType(tokens = []) {
  const braille = (tokens || []).filter((t) => t.type === 'braille');
  if (braille.length === 0) return { type: 'empty' };

  const keyPattern = braille.map((t) => dotsToKey(t.dots)).join('|');
  const matchedTimeSignature = TIME_SIGNATURE_PATTERNS[keyPattern] || null;

  if (matchedTimeSignature) {
    return { type: 'time-signature', value: matchedTimeSignature };
  }

  // Donanım (key signature): satır başı diyez/bemol dizisi. Tek başına (⠣) veya
  // zaman imzasıyla aynı satırda (⠣ ⠼⠙⠲ / ⠣⠼⠙⠲). Donanımdan sonra zaman imzası
  // veya satır sonu gelmeli; nota gelirse bu bir gövde accidental'ıdır (donanım değil).
  const ks = keySignatureOnEkiCozumle(braille);
  if (ks && ks.tuketilen > 0) {
    const kalan = braille.slice(ks.tuketilen);
    if (kalan.length === 0) {
      return { type: 'key-signature', keySignature: ks.keySignature };
    }
    const kalanPattern = kalan.map((t) => dotsToKey(t.dots)).join('|');
    if (TIME_SIGNATURE_PATTERNS[kalanPattern]) {
      return { type: 'key+time-signature', keySignature: ks.keySignature, timeSignature: TIME_SIGNATURE_PATTERNS[kalanPattern] };
    }
    // kalan zaman imzası değil → donanım değil, gövde olabilir; aşağı düş.
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
        // Önek bir donanım mı? (⠣ ⠼⠙⠲ — boşluklu)
        const onekKs = keySignatureOnEkiCozumle(prefix);
        if (onekKs && onekKs.tuketilen === prefix.length) {
          return { type: 'key+time-signature', keySignature: onekKs.keySignature, timeSignature: suffixTs };
        }
        const text = prefix.map((t) => BRAILLE_LETTERS_TR[dotsToKey(t.dots)] || '').join('').trim();
        return { type: 'title+time-signature', value: text, timeSignature: suffixTs };
      }
    }
  }

  // Müzik gövde satırı DAİMA bir oktav işaretiyle başlar (ilk nota kuralı). Oktav işaretleri
  // ([4]/[4-5]/[4-5-6]/[5]/[4-6]/[5-6] = oktav 1-6) metin/başlık öneki DEĞİLDİR → harf-oranına
  // bakmadan müzik say. Aksi halde harf gibi görünen nota dizileri (⠐⠋⠋⠛⠓ = "ffgh") başlık
  // sanılır ve header'sız/zaman-imzasız export edilen skor yüklenince TÜM notalar kaybolur.
  // ([6]=⠠ büyük harf işaretiyle, 7. oktav nadir olduğundan, çakışmamak için dışarıda.)
  // dotsToKey ayraçsızdır: [4,5]→"45". Oktav işareti anahtarları: oktav 1-6.
  // Müzik göstergesi: satır bir oktav işareti İÇERİYORSA (ilk hücre olmasa da) müzik gövdesidir.
  // Oktav işaretleri ([4]/[45]/[456]/[5]/[46]/[56]) metin harfi/öneki DEĞİLDİR → başlık metni
  // bunları içermez (güvenli). Rest'le (⠧="v") veya ifade-sözcüğüyle başlayan gövdeleri de yakalar
  // (örn. ⠧⠐… veya ⠜dolce…⠨…). Ayrıca ilk hücre söz-işareti ⠜(3-4-5) ise (dinamik/ifade) → müzik.
  const OKTAV_ISARET_ANAHTARLARI = new Set(['4', '45', '456', '5', '46', '56']);
  if (braille.some((t) => OKTAV_ISARET_ANAHTARLARI.has(dotsToKey(t.dots)))) {
    return { type: 'music' };
  }
  if (braille.length > 0 && dotsToKey(braille[0].dots) === '345') {
    return { type: 'music' };
  }

  // Büyük harf işareti [6] de "metin hücresi" sayılır (oranı düşürmesin).
  // Başlık/besteci/tempo metin işaretleri: sayı işareti (3-4-5-6), nokta/virgül/tire/kesme.
  // Bunlar da "metin" sayılır → rakam/noktalamalı başlık (Op. 93, KV 386, Lovin') doğru sınıflanır.
  const TEXT_ISARET = new Set(['3456', '256', '2', '36', '3']);
  const DIGIT_BY_KEY = { 1: '1', 12: '2', 14: '3', 145: '4', 15: '5', 124: '6', 1245: '7', 125: '8', 24: '9', 245: '0' };
  const harfVeyaIsaret = (t) => {
    const k = dotsToKey(t.dots);
    return Boolean(BRAILLE_LETTERS_TR[k]) || k === '6' || TEXT_ISARET.has(k);
  };
  const letterCount = braille.filter(harfVeyaIsaret).length;
  // Kısa başlık/besteci (örn. "cc" = 2 hücre) de tanınsın: tüm hücreler harfse
  // bu satır metindir (müzik satırları octave/sayı işaretiyle başlar, harf değil).
  // Uzun satırlarda %70 harf oranı yeterli (araya gelebilecek aksan vb. için).
  const tumHarf = braille.length >= 1 && letterCount === braille.length;
  const cogunlukHarf = braille.length >= 3 && letterCount >= Math.ceil(braille.length * 0.7);
  if (tumHarf || cogunlukHarf) {
    // Boşlukları koru; büyük harf işaretinden ([6]) sonraki harfi büyüt; sayı işaretinden
    // ([3-4-5-6]) sonraki a–j hücrelerini rakama çevir (sayı modu boşluk/noktalamada kapanır).
    let text = '';
    let buyukBekliyor = false;
    let sayiModu = false;
    for (const t of tokens) {
      if (t.type === 'space') { text += ' '; buyukBekliyor = false; sayiModu = false; continue; }
      const k = dotsToKey(t.dots);
      if (k === '3456') { sayiModu = true; continue; }
      if (k === '6') { buyukBekliyor = true; continue; }
      if (k === '256') { text += '.'; sayiModu = false; buyukBekliyor = false; continue; }
      if (k === '2') { text += ','; sayiModu = false; buyukBekliyor = false; continue; }
      if (k === '36') { text += '-'; sayiModu = false; buyukBekliyor = false; continue; }
      if (k === '3') { text += "'"; sayiModu = false; buyukBekliyor = false; continue; }
      if (sayiModu && DIGIT_BY_KEY[k]) { text += DIGIT_BY_KEY[k]; continue; }
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

  // Bu fonksiyonun tek çağrısı (brfMusicReader.js) yalnızca cell.type === 'space'
  // iken yapılır; yukarıdaki erken-return daima çalışır. Space olmayan yol asla
  // çalışmaz — canlı nota/işaret çözümü readMusicBrailleGroup içindedir. Savunma
  // amacıyla null döndürülür.
  return null;
}

export function handleLineEnd(context) {
  // Braille müzikte bir ölçü satır sonunu AŞMAZ — satır sonu DAİMA ölçü sınırıdır. Satır notayla/sus'la
  // (açık ölçü) bitmişse, sonraki satırın notaları AYNI ölçüye katılıp ölçüyü İKİYE KATLARDI (örn. Little
  // Brown Jug 32/16). Açık ölçüyü BARLINE öğesiyle kapat — buildMeasures barline-item'larıyla böldüğü için
  // yalnız activeMeasure ilerletmek yetmiyordu (measureNo doğru olsa da ölçüler birleşik kalıyordu).
  const sonItem = context.items[context.items.length - 1];
  if (sonItem && !barlineTipiMi(sonItem) && (sonItem.tip === 'nota' || sonItem.tip === 'sus')) {
    separatorBarlineOlustur({ char: '⠀', dots: [], type: 'space' }, context);
  }
  context.lineIndex += 1;
  context.cellIndex = 0;
  // Zaman değişimi satır sonundaysa (sonraki boşluk yok) bayrak sonraki satıra taşınmasın.
  context.zamanDegisimiSonrasiBoslukAtla = false;
}

// Bir öğenin ölçü-süresine EFEKTİF katkısı: measureDur16 (grace=0/gruplama/tuplet-sıkıştırma uygulanmış)
// varsa onu, yoksa face-value duration16'yı kullan. Tuplet ölçülerinde face-value yanlış uyarı verir.
function olcuKatkisi16(item) {
  return Number.isFinite(Number(item?.measureDur16))
    ? Number(item.measureDur16)
    : Number(item?.duration16 || 0);
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
      total16: measure.items.reduce((sum, item) => sum + olcuKatkisi16(item), 0),
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
        total16: measureItems.reduce((sum, item) => sum + olcuKatkisi16(item), 0),
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
