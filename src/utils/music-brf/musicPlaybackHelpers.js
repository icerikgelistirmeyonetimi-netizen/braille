import { SURE_GOSTERGELERI } from '../../data/muzik.js';
import {
  muzikNotaArizaDegeriAl,
  muzikArizaOffsetAl,
  keySignatureAccidentalsAl,
} from './musicPianoAudioHelpers.js';

export function muzikTempoBpmAl(header = {}) {
  const bpmValue = header?.bpm ?? header?.tempoBpm ?? null;
  const raw = bpmValue != null
    ? String(bpmValue)
    : String(
      header?.tempo ||
      header?.metronom ||
      header?.tempoText ||
      ''
    );

  const match = raw.match(/(\d{2,3})/);
  const bpm = match ? Number(match[1]) : Number(bpmValue);

  if (Number.isFinite(bpm) && bpm >= 30 && bpm <= 240) {
    return bpm;
  }

  return 120;
}

export function muzikSureBeatAl(oge) {
  const index = Number(oge?.sureIndeksi ?? oge?.sureIndex ?? 0);
  const sure = SURE_GOSTERGELERI[index] || SURE_GOSTERGELERI[2];
  const realValue = Number(sure?.realValue || 4);
  const baseBeats = realValue > 0 ? 4 / realValue : 1;

  const dotCount = Number(
    oge?.noktaSayisi ??
    oge?.noktaliSayisi ??
    oge?.noktalıSayisi ??
    oge?.dotCount ??
    oge?.dots ??
    oge?.durationDots ??
    oge?.noktaAdedi ??
    oge?.nokta ??
    0
  );

  const hasSingleDot = Boolean(
    oge?.nokta ||
    oge?.dotted ||
    oge?.dot ||
    oge?.noktalı ||
    oge?.noktali ||
    oge?.noktalıNota ||
    oge?.noktaliNota ||
    oge?.sureNoktasi ||
    oge?.sureNokta ||
    dotCount === 1
  );

  const hasDoubleDot = Boolean(
    oge?.doubleDotted ||
    oge?.ikiNokta ||
    oge?.ciftNokta ||
    oge?.çiftNokta ||
    dotCount >= 2
  );

  let beats = baseBeats;

  if (hasDoubleDot) {
    beats *= 1.75;
  } else if (hasSingleDot) {
    beats *= 1.5;
  }

  // TODO: Tuplet / üçleme desteği eklenirse burada duration oranını ayarla.
  return beats;
}

export function muzikOgePlaybackMsAl(oge, bpm = 120) {
  const beats = muzikSureBeatAl(oge);
  return beats * (60000 / bpm);
}

export function playbackEventDurationMsAl(event, bpm = 120) {
  const safeBpm = Number.isFinite(Number(bpm)) && Number(bpm) > 0 ? Number(bpm) : 120;

  if (Number.isFinite(Number(event?.durationMs))) {
    return Math.max(20, Number(event.durationMs));
  }

  if (Number.isFinite(Number(event?.durationBeats))) {
    return Math.max(20, Number(event.durationBeats) * (60000 / safeBpm));
  }

  const oge = event?.oge || event;
  return Math.max(20, muzikOgePlaybackMsAl(oge, safeBpm));
}

export function muzikPlaybackOgeMi(oge) {
  return oge && (oge.tip === 'nota' || oge.tip === 'sus');
}

export function playbackBarlineTipiAl(oge) {
  const tip = String(oge?.tip || oge?.type || '').toLowerCase();
  const ad = String(oge?.ad || oge?.kayit?.ad || oge?.barlineType || '').toLowerCase();
  const kaynak = String(oge?.kaynak || '').toLowerCase();
  const text = `${tip} ${ad} ${kaynak}`;

  if (
    tip === 'beginrepeat' ||
    tip === 'begin-repeat' ||
    text.includes('beginrepeat') ||
    text.includes('başlangıç tekrar') ||
    text.includes('baslangic tekrar') ||
    text.includes('başlangıç röpriz') ||
    text.includes('baslangic ropriz') ||
    text.includes('|:')
  ) {
    return 'begin-repeat';
  }

  if (
    tip === 'endrepeat' ||
    tip === 'end-repeat' ||
    text.includes('endrepeat') ||
    text.includes('bitiş tekrar') ||
    text.includes('bitis tekrar') ||
    text.includes('bitiş röpriz') ||
    text.includes('bitis ropriz') ||
    text.includes(':|')
  ) {
    return 'end-repeat';
  }

  if (
    tip === 'finalbarline' ||
    tip === 'final-barline' ||
    text.includes('final') ||
    text.includes('bitiş çizgisi') ||
    text.includes('bitis cizgisi')
  ) {
    return 'final';
  }

  return 'normal';
}

export function playbackBagTieMi(bag) {
  const tip = String(bag?.tip || bag?.kayit?.tip || '').toLowerCase();
  const ad = String(bag?.ad || bag?.kayit?.ad || '').toLowerCase();

  return (
    tip === 'tie' ||
    ad.includes('tie') ||
    ad.includes('uzatma')
  );
}

export function playbackNotaPerdeKeyAl(oge) {
  if (!oge || oge.tip !== 'nota') return null;

  const notaAd = String(oge.notaAd || oge.ad || '').toLocaleLowerCase('tr').trim();
  const oktav = Number.isFinite(Number(oge.oktav)) ? Number(oge.oktav) : 4;
  const accidental = String(oge.accidental || oge.ariza || oge.degisiklik || oge.degisim || oge.değiştirici || oge.alteration || oge.alter || '').toLocaleLowerCase('tr').trim();

  return `${notaAd}:${accidental}:${oktav}`;
}

function normalizeNotaAd(ad) {
  return String(ad || '').toLocaleLowerCase('tr').trim();
}

function noteKey(notaAd, oktav) {
  return `${notaAd}:${oktav}`;
}

export function muzikPlaybackSequenceOlustur(ogeler = []) {
  const visible = (ogeler || []).filter((oge) => !oge?.hidden && !oge?.gizli);
  const result = [];
  const repeatedEndIds = new Set();

  let i = 0;
  let repeatStartIndex = 0;
  let guard = 0;
  const maxSteps = visible.length * 8 + 100;

  while (i < visible.length && guard < maxSteps) {
    guard += 1;
    const oge = visible[i];
    const barlineTipi = playbackBarlineTipiAl(oge);

    if (barlineTipi === 'begin-repeat') {
      repeatStartIndex = i + 1;
      i += 1;
      continue;
    }

    if (barlineTipi === 'end-repeat') {
      const repeatKey = oge.id || `end-repeat-${i}`;
      if (!repeatedEndIds.has(repeatKey)) {
        repeatedEndIds.add(repeatKey);
        i = repeatStartIndex;
        continue;
      }
      i += 1;
      continue;
    }

    if (barlineTipi === 'final') {
      result.push(oge);
      break;
    }

    if (
      oge.tip === 'nota' ||
      oge.tip === 'sus' ||
      oge.tip === 'barline' ||
      oge.tip === 'sectionalBarline' ||
      oge.tip === 'finalBarline' ||
      oge.tip === 'keySignatureChange' ||
      oge.tip === 'timeSignatureChange'
    ) {
      result.push(oge);
    }

    i += 1;
  }

  return result;
}

export function playbackTieSonrakiHaritasiOlustur(baglar = [], ogeMap = new Map()) {
  const map = new Map();

  (baglar || []).forEach((bag) => {
    if (!playbackBagTieMi(bag)) return;

    const ids = Array.isArray(bag.notaIdler) && bag.notaIdler.length >= 2
      ? bag.notaIdler
      : [bag.basId, bag.sonId].filter(Boolean);

    for (let i = 0; i < ids.length - 1; i += 1) {
      const a = ogeMap.get(ids[i]);
      const b = ogeMap.get(ids[i + 1]);

      if (!a || !b) continue;
      if (a.tip !== 'nota' || b.tip !== 'nota') continue;

      const samePitch = playbackNotaPerdeKeyAl(a) === playbackNotaPerdeKeyAl(b);
      if (!samePitch) continue;

      map.set(a.id, b.id);
    }
  });

  return map;
}

function sonrakiPlaybackIndexAl(items, startIndex) {
  for (let j = startIndex; j < items.length; j += 1) {
    if (muzikPlaybackOgeMi(items[j])) return j;
  }
  return startIndex;
}

export function muzikPlaybackListesiOlustur(ogeler = []) {
  const visible = (ogeler || []).filter((oge) => !oge?.hidden && !oge?.gizli);
  const result = [];
  const repeatedEndIds = new Set();

  let i = 0;
  let repeatStartIndex = 0;
  let guard = 0;
  const maxSteps = visible.length * 8 + 100;

  while (i < visible.length && guard < maxSteps) {
    guard += 1;
    const oge = visible[i];
    const barlineTipi = playbackBarlineTipiAl(oge);

    if (barlineTipi === 'begin-repeat') {
      repeatStartIndex = sonrakiPlaybackIndexAl(visible, i + 1);
      i += 1;
      continue;
    }

    if (barlineTipi === 'end-repeat') {
      const repeatKey = oge.id || `end-repeat-${i}`;
      if (!repeatedEndIds.has(repeatKey)) {
        repeatedEndIds.add(repeatKey);
        i = repeatStartIndex;
        continue;
      }
      i += 1;
      continue;
    }

    if (barlineTipi === 'final') {
      break;
    }

    if (muzikPlaybackOgeMi(oge)) {
      result.push(oge);
    }
    i += 1;
  }

  return result;
}

export function muzikPlaybackEventListesiOlustur({ ogeler = [], baglar = [], muzikHeader = {} }) {
  const repeatExpanded = muzikPlaybackSequenceOlustur(ogeler);
  const ogeMap = new Map((ogeler || []).map((o) => [o.id, o]));
  const tieNextMap = playbackTieSonrakiHaritasiOlustur(baglar, ogeMap);

  const result = [];
  const consumed = new Set();

  let keySignatureAccidentals = keySignatureAccidentalsAl(muzikHeader.keySignature);
  const measureAccidentals = new Map();

  for (let i = 0; i < repeatExpanded.length; i += 1) {
    const oge = repeatExpanded[i];
    if (!oge) continue;
    const consumedKey = `${i}:${oge.id}`;
    if (consumed.has(consumedKey)) continue;

    if (oge.tip === 'keySignatureChange') {
      keySignatureAccidentals = keySignatureAccidentalsAl(oge.keySignature || oge);
      measureAccidentals.clear();
      continue;
    }

    if (oge.tip === 'timeSignatureChange') {
      measureAccidentals.clear();
      continue;
    }

    if (oge.tip === 'barline' || oge.tip === 'sectionalBarline' || oge.tip === 'finalBarline') {
      measureAccidentals.clear();
      continue;
    }

    if (oge.tip === 'sus') {
      result.push({
        id: oge.id,
        tip: 'sus',
        oge,
        ogeler: [oge],
        durationBeats: muzikSureBeatAl(oge),
        play: false,
      });
      continue;
    }

    if (oge.tip !== 'nota') {
      continue;
    }

    const notaAd = normalizeNotaAd(oge.notaAd || oge.ad || '');
    const oktav = Number.isFinite(Number(oge.oktav)) ? Number(oge.oktav) : 4;
    const noteKeyString = noteKey(notaAd, oktav);

    const explicitAccidentalRaw = muzikNotaArizaDegeriAl(oge);
    const explicitOffset = muzikArizaOffsetAl(explicitAccidentalRaw);
    if (explicitOffset !== null) {
      measureAccidentals.set(noteKeyString, explicitOffset);
    }

    const pitchContext = {
      keySignatureAccidentals: { ...keySignatureAccidentals },
      measureAccidentals: new Map(measureAccidentals),
    };

    const group = [oge];
    let durationBeats = muzikSureBeatAl(oge);
    let current = oge;
    let nextIndex = i;

    while (true) {
      const nextId = tieNextMap.get(current.id);
      if (!nextId) break;

      const foundIndex = repeatExpanded.findIndex((candidate, idx) => (
        idx > nextIndex && candidate?.id === nextId
      ));
      if (foundIndex < 0) break;

      const next = repeatExpanded[foundIndex];
      if (!next || next.tip !== 'nota') break;
      if (consumed.has(`${foundIndex}:${next.id}`)) break;

      group.push(next);
      durationBeats += muzikSureBeatAl(next);
      consumed.add(`${foundIndex}:${next.id}`);
      current = next;
      nextIndex = foundIndex;
    }

    result.push({
      id: oge.id,
      tip: 'nota',
      oge,
      ogeler: group,
      durationBeats,
      play: true,
      tied: group.length > 1,
      playbackPitchContext: pitchContext,
    });
  }

  return result;
}
