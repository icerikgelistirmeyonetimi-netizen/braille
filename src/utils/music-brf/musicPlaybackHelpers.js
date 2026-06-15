import { SURE_GOSTERGELERI } from '../../data/muzik.js';
import {
  muzikNotaArizaDegeriAl,
  muzikArizaOffsetAl,
  keySignatureAccidentalsAl,
  muzikNotaMidiAl,
} from './musicPianoAudioHelpers.js';
import { notaGraceMi } from './musicMeasureHelpers.js';

// ─── Süsleme yardımcıları ────────────────────────────────────────────────────

/**
 * MIDI numarasından Türkçe nota adı + oktav + arıza döndürür.
 * Yarım tonlar daima diyez (♯) olarak temsil edilir.
 * accidental alanı her zaman açık yazılır (key sig müdahalesini önlemek için).
 */
const MIDI_SINIFLAR = [
  { ad: 'do',  ariza: 'natural' },  //  0 = C
  { ad: 'do',  ariza: 'sharp'   },  //  1 = C♯
  { ad: 're',  ariza: 'natural' },  //  2 = D
  { ad: 're',  ariza: 'sharp'   },  //  3 = D♯
  { ad: 'mi',  ariza: 'natural' },  //  4 = E
  { ad: 'fa',  ariza: 'natural' },  //  5 = F
  { ad: 'fa',  ariza: 'sharp'   },  //  6 = F♯
  { ad: 'sol', ariza: 'natural' },  //  7 = G
  { ad: 'sol', ariza: 'sharp'   },  //  8 = G♯
  { ad: 'la',  ariza: 'natural' },  //  9 = A
  { ad: 'la',  ariza: 'sharp'   },  // 10 = A♯
  { ad: 'si',  ariza: 'natural' },  // 11 = B
];

function midiToNota(midi) {
  const cls  = MIDI_SINIFLAR[((midi % 12) + 12) % 12];
  const oktav = Math.floor(midi / 12) - 1;
  return { notaAd: cls.ad, oktav, accidental: cls.ariza };
}

/**
 * Diyatonik üst komşu (mi→fa = +1, si→do = +1, diğerleri = +2).
 * Kromatik notalar (diyezli) için +1 yarım ton kullanılır.
 */
const DOGAL_SINIFLAR = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
const DIYATONIK_YUKARI = [2, 2, 1, 2, 2, 2, 1]; // C→D, D→E, E→F …

function diatonikUstMidi(baseMidi) {
  const pc  = ((baseMidi % 12) + 12) % 12;
  const idx = DOGAL_SINIFLAR.indexOf(pc);
  return idx >= 0 ? baseMidi + DIYATONIK_YUKARI[idx] : baseMidi + 1;
}

function diatonikAltMidi(baseMidi) {
  const pc  = ((baseMidi % 12) + 12) % 12;
  const idx = DOGAL_SINIFLAR.indexOf(pc);
  if (idx < 0) return baseMidi - 1;
  const prevIdx = (idx - 1 + 7) % 7;
  return baseMidi - DIYATONIK_YUKARI[prevIdx];
}

/**
 * Bir nota playback event'ini süslemeye göre birden fazla kısa event'e böler.
 * Sonuç: yeni event dizisi (orijinal event dahil edilmeyebilir).
 */
function ornamentEventleriGenislet(baseEvent, velocity) {
  const oge = baseEvent.oge;
  const oncesiMods = Array.isArray(oge?.modifiers?.oncesi) ? oge.modifiers.oncesi : [];
  if (oncesiMods.length === 0) return [baseEvent];

  // İlk süsleme modifier'ı al (birden fazla varsa birincisi).
  // Adlar Türkçeleştirildi (apejetür, tril, mordan, grupeto, glisando);
  // eski adlar (appoggiatura, trill, mordent, turn, glissando) da desteklenir.
  const ornMod = oncesiMods.find((m) => {
    const ad = String(m?.kayit?.ad || '').toLowerCase();
    return (
      /appoggiatura|acciaccatura|apejetür|tril|mord(ent|an)|turn|grupeto|glis+ando/.test(ad)
    );
  });
  if (!ornMod) return [baseEvent];

  const ad = String(ornMod.kayit?.ad || '').toLowerCase();
  const ctx = baseEvent.playbackPitchContext || {};
  const baseMidi = muzikNotaMidiAl(oge, ctx);
  if (!Number.isFinite(baseMidi)) return [baseEvent];

  const ustMidi = diatonikUstMidi(baseMidi);
  const altMidi = diatonikAltMidi(baseMidi);
  const total   = baseEvent.durationBeats;
  const baseId  = oge.id;

  // Sanal nota nesnesi oluşturucu (MIDI'dan, boş context ile çalar)
  // id = baseId korunur → score highlight orijinal notada kalmaya devam eder
  // Süsleme notaları ana notadan biraz daha yumuşak çalınır (doğal hissiyat)
  const ornamentVelocity = Math.min(0.97, velocity * 0.88);
  const sanal = (midi, durationBeats, _idx) => ({
    id: baseId,
    tip: 'nota',
    oge: { ...oge, ...midiToNota(midi), id: baseId, _ornamentVirtual: true },
    ogeler: [{ ...oge, ...midiToNota(midi) }],
    durationBeats,
    play: true,
    tied: false,
    playbackPitchContext: {},   // açık arıza var, context gerekmez
    velocity: ornamentVelocity,
    _ornamentExpanded: true,
  });

  // Ana nota event'inin süresini kısaltan kopyası — normal sustain (cutOff yok)
  const anaKopya = (durationBeats) => ({ ...baseEvent, durationBeats });

  // ── İMPORT GRACE MODELİ ───────────────────────────────────────────────────
  // Nota ZATEN ayrı bir grace (apejetür) notasıysa, KENDİ perdesinden (baseMidi) KISA çalınır.
  // "note-above" (ustMidi) ornament mantığı UYGULANMAZ — o, grace'i ana notanın bir üstündeki
  // perde sanardı; oysa apejetür notasının perdesi KENDİSİDİR ve ana nota AYRI (sonraki) öğedir.
  // Grace kendi süresinin bir kısmı kadar çalar (uzun ~%55, kısa ~%35) → doğal süsleme hissi.
  if (notaGraceMi(oge)) {
    const graceKisaltma = /uzun/.test(ad) ? 0.55 : 0.35;
    return [{ ...baseEvent, durationBeats: Math.max(0.06, total * graceKisaltma), velocity: ornamentVelocity }];
  }

  // ── ÇOKLU apejetür (grace zinciri) — bir notadan önce birden çok grace
  // müzikal olarak geçerlidir (çift apejetür / slide). Her kısa grace ≈ %12,
  // uzun grace ≈ %30; toplam ana notanın %60'ını aşarsa orantılı kısaltılır.
  const graceRe = /apejetür|appoggiatura|acciaccatura/;
  const graceMods = oncesiMods.filter((m) => graceRe.test(String(m?.kayit?.ad || '').toLowerCase()));
  if (graceMods.length >= 2) {
    let durs = graceMods.map((m) => (
      /uzun/.test(String(m?.kayit?.ad || '').toLowerCase()) ? total * 0.30 : total * 0.12
    ));
    const toplam = durs.reduce((a, b) => a + b, 0);
    const maksToplam = total * 0.6;
    if (toplam > maksToplam) durs = durs.map((d) => (d * maksToplam) / toplam);
    const events = durs.map((d, i) => sanal(ustMidi, d, i));
    events.push({ ...anaKopya(total - durs.reduce((a, b) => a + b, 0)), velocity });
    return events;
  }

  // ── Kısa apejetür (appoggiatura) / acciaccatura ───────────────────────────
  if (/kısa appoggiatura|acciaccatura|kısa apejetür/.test(ad)) {
    const grace = total * 0.12;
    return [sanal(ustMidi, grace, 0), anaKopya(total - grace)];
  }

  // ── Uzun apejetür (appoggiatura) ──────────────────────────────────────────
  if (/uzun appoggiatura|uzun apejetür/.test(ad)) {
    const half = total * 0.5;
    return [sanal(ustMidi, half, 0), anaKopya(half)];
  }

  // ── Tril (trill) — '^tril' hem 'tril' hem 'trill' ile eşleşir ─────────────
  if (/^tril|bemollü tril|diyezli tril/.test(ad)) {
    // Her çift (ana + üst) için süre: ~16'lık çiftler, max 8 çift (yoğunluk sınırı)
    const ciftSayisi = Math.min(8, Math.max(2, Math.round(total * 4)));
    const birimSure  = total / (ciftSayisi * 2);
    // Trill: ana notadan başla, üst notalara git, son nota ana nota
    const events = [];
    for (let i = 0; i < ciftSayisi; i++) {
      // İlk nota biraz daha kuvvetli (trill başlangıcı)
      const v = i === 0 ? Math.min(0.97, ornamentVelocity * 1.08) : ornamentVelocity;
      events.push({ ...sanal(baseMidi, birimSure, i * 2), velocity: v });
      events.push(sanal(ustMidi, birimSure, i * 2 + 1));
    }
    return events;
  }

  // ── Üst mordan/mordent (asıl → üst → asıl) ──────────────────────────────
  if (/üst mord(ent|an)/.test(ad)) {
    // short: notanın %16-20'si, ama maksimum 0.15 beat (kısa tutulması için)
    const short = Math.min(total * 0.20, 0.15);
    return [
      sanal(baseMidi, short, 0),
      sanal(ustMidi,  short, 1),
      { ...anaKopya(total - short * 2), velocity },  // ana nota tam velocity
    ];
  }

  // ── Alt mordan/mordent (asıl → alt → asıl) ──────────────────────────────
  if (/alt mord(ent|an)/.test(ad)) {
    const short = Math.min(total * 0.20, 0.15);
    return [
      sanal(baseMidi, short, 0),
      sanal(altMidi,  short, 1),
      { ...anaKopya(total - short * 2), velocity },
    ];
  }

  // ── Ters grupeto/turn: alt → asıl → üst → asıl ──────────────────────────
  if (/ters (turn|grupeto)/.test(ad)) {
    const q = total / 4;
    return [
      sanal(altMidi,  q, 0),
      sanal(baseMidi, q, 1),
      sanal(ustMidi,  q, 2),
      anaKopya(q),
    ];
  }

  // ── Grupeto/turn: üst → asıl → alt → asıl ───────────────────────────────
  if (/turn|grupeto/.test(ad)) {
    const q = total / 4;
    return [
      sanal(ustMidi,  q, 0),
      sanal(baseMidi, q, 1),
      sanal(altMidi,  q, 2),
      anaKopya(q),
    ];
  }

  return [baseEvent];
}

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

    // ── Volta 1. ev ───────────────────────────────────────────────────────────
    // 2. geçişteyiz (içindeki endRepeat zaten atlandı) → bu bölümü atla
    if (oge.tip === 'volta1') {
      const endKey = voltaBolumEndRepeatKeyAl(visible, i);
      if (endKey && repeatedEndIds.has(endKey)) {
        i = volta1AtlamaIndeksiAl(visible, i);
        continue;
      }
      // 1. geçiş: volta1 marker'ını işaret etme, notalar çalınsın
      i += 1;
      continue;
    }

    // ── Volta 2. ev ───────────────────────────────────────────────────────────
    // Marker'ı atla, sonrasındaki notalar normal çalınsın
    if (oge.tip === 'volta2') {
      i += 1;
      continue;
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

/**
 * volta1 ile başlayan bölümü atlayıp volta2'nin başlangıcına (veya volta2'den
 * sonraki ilk nota/sus indeksine) döner.
 * Çağrı: i konumundaki öge volta1'dir ve 2. geçişteyiz.
 */
function volta1AtlamaIndeksiAl(visible, currentIdx) {
  // volta2'yi bul
  for (let j = currentIdx + 1; j < visible.length; j += 1) {
    if (visible[j]?.tip === 'volta2') return j;
  }
  // volta2 yoksa: volta1 içindeki endRepeat'in hemen sonrasına atla
  for (let j = currentIdx + 1; j < visible.length; j += 1) {
    if (playbackBarlineTipiAl(visible[j]) === 'end-repeat') return j + 1;
  }
  return currentIdx + 1;
}

/**
 * Mevcut konumdan önce gelen (ve henüz atlanmamış) en yakın endRepeat'in
 * anahtar değerini döndürür.  volta1 bölümünün endRepeat'ini bulmak için kullanılır.
 */
function voltaBolumEndRepeatKeyAl(visible, voltaIdx) {
  for (let j = voltaIdx + 1; j < visible.length; j += 1) {
    if (playbackBarlineTipiAl(visible[j]) === 'end-repeat') {
      return visible[j].id || `end-repeat-${j}`;
    }
    // Başka bir volta ya da final'e gelince dur
    if (visible[j]?.tip === 'volta2' || playbackBarlineTipiAl(visible[j]) === 'final') break;
  }
  return null;
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

    // ── Volta 1. ev ───────────────────────────────────────────────────────────
    if (oge.tip === 'volta1') {
      const endKey = voltaBolumEndRepeatKeyAl(visible, i);
      if (endKey && repeatedEndIds.has(endKey)) {
        i = volta1AtlamaIndeksiAl(visible, i);
        continue;
      }
      i += 1;
      continue;
    }

    // ── Volta 2. ev ───────────────────────────────────────────────────────────
    if (oge.tip === 'volta2') {
      i += 1;
      continue;
    }

    if (muzikPlaybackOgeMi(oge)) {
      result.push(oge);
    }
    i += 1;
  }

  return result;
}

// ─── Dinamik ses seviyeleri (standartlara dayalı) ───────────────────────────
// 1) MIDI standart dinamik velocity değerleri (notation yazılımlarında de-facto
//    standart; Wikipedia "Dynamics (music)", MuseScore/Finale): ppp=16 … fff=127.
// 2) Velocity → genlik eşlemesi: Dannenberg (CMU, ICMC 2006, "The Interpretation
//    of MIDI Velocity") gerçek sentezleyicileri ölçmüş; ilişki LOGARİTMİK DEĞİL,
//    KARE yasasıdır: a = (m·v + b)² (velocity, RMS genliğin kareköküyle lineer).
//    velocity doğrudan HTML audio.volume (lineer genlik) olarak uygulandığından
//    bu eğri gerçekçi ve algısal olarak doğru dinamik kademeleri verir.
// 3) Tek serbest parametre = dinamik aralık (vel 1→127, dB). Ölçülen gerçek
//    sentezleyiciler 11–25 dB (donanım) … 44–89 dB (yazılım). Solo eğitim
//    çalmasında p belirgin biçimde yumuşak ama jarjlamayan dengeli aralık → 14 dB.
const DINAMIK_MIDI_VELOCITY = {
  ppp: 16, pp: 32, p: 48, mp: 64, mf: 80, f: 96, ff: 112, fff: 127,
};
const DINAMIK_DB_ARALIK = 14;
const _dinR = Math.pow(10, DINAMIK_DB_ARALIK / 20);
const _dinB = 127 / (126 * Math.sqrt(_dinR)) - 1 / 126;
const _dinM = (1 - _dinB) / 127;
// Dannenberg kare yasası: vel → 0..1 lineer genlik (a(127)=1.0).
function dinamikGainHesapla(velocity) {
  const a = Math.pow(_dinM * velocity + _dinB, 2);
  return Math.max(0.02, Math.min(1, a));
}
const DINAMIK_VELOCITY = Object.fromEntries(
  Object.entries(DINAMIK_MIDI_VELOCITY).map(([ad, vel]) => [ad, Math.round(dinamikGainHesapla(vel) * 1000) / 1000]),
);
// Sforzando / fz: ani güçlü vuruş — ff ile fff arası (vel ~118).
DINAMIK_VELOCITY.sf = Math.round(dinamikGainHesapla(118) * 1000) / 1000;
DINAMIK_VELOCITY.sfz = DINAMIK_VELOCITY.sf;
DINAMIK_VELOCITY.fz = DINAMIK_VELOCITY.sf;

/**
 * Dinamik sembolden 0-1 arası ses seviyesi döndürür.
 * Tanınmayan semboller için null (= varsayılan korunur).
 */
export function muzikDinamikVelocityAl(sembol = '') {
  const s = String(sembol || '').toLowerCase().replace(/[.\s]/g, '');
  return DINAMIK_VELOCITY[s] ?? null;
}

/** Sembolden cresc/decresc modu algılar: 'cresc' | 'decresc' | null
 * Veri Türkçe (kreşendo/dekreşendo/diminiendo) + sembol (cr/decr/dim) — İngilizce terimler de tutulur.
 * DECRESC ÖNCE kontrol edilir: "dekreşendo" string'i "kreşendo" içerir → cresc-önce yanlış yakalardı. */
function dinamikGradyanModuAl(sembol = '', ad = '') {
  const s = String(sembol || '').toLocaleLowerCase('tr');
  const a = String(ad || '').toLocaleLowerCase('tr');
  const text = s + ' ' + a;
  if (/decresc|decrescendo|dekreşendo|dekresendo|diminiendo|diminuendo|\bdim\b|\bdecr\b/.test(text)) return 'decresc';
  if (/cresc|crescendo|kreşendo|kresendo|\bcr\b/.test(text)) return 'cresc';
  return null;
}

/**
 * Notanın modifiers.oncesi dizisini tarar; ilk sabit dinamiği ve/veya
 * cresc/decresc modunu döndürür.
 */
function notaDinamikBilgisiAl(oge) {
  const mods = Array.isArray(oge?.modifiers?.oncesi) ? oge.modifiers.oncesi : [];
  let velocity = null;
  let gradyan = null;
  let sfNote = false; // sforzando: anlık vuruş → sonraki notada eski seviyeye dön
  for (const mod of mods) {
    const sembol = String(mod?.kayit?.sembol || '');
    const ad = String(mod?.kayit?.ad || '');
    if (velocity === null) {
      velocity = muzikDinamikVelocityAl(sembol || ad.split(' ')[0]);
    }
    if (gradyan === null) {
      gradyan = dinamikGradyanModuAl(sembol, ad);
    }
    // sf/sfz/fz tespiti: anlık ani vurgu
    if (!sfNote) {
      const s = (sembol || ad).toLowerCase().replace(/\s|\(.*\)/g, '');
      sfNote = /^sf[z]?$|^fz$/.test(s);
    }
  }
  return { velocity, gradyan, sfNote };
}

// ─── Nüans / Artikülasyon ────────────────────────────────────────────────────

/**
 * Nota öncesi (oncesi) ve sonrası (sonrasi) modifier'larından artikülasyon bilgisi çıkarır.
 */
function notaArticulationBilgisiAl(oge) {
  const oncesi  = Array.isArray(oge?.modifiers?.oncesi)  ? oge.modifiers.oncesi  : [];
  const sonrasi = Array.isArray(oge?.modifiers?.sonrasi) ? oge.modifiers.sonrasi : [];

  const art = {
    staccato:      false,
    staccatissimo: false,
    mezzoStaccato: false,
    tenuto:        false,
    accent:        false,
    staccatoAccent:false,
    martellato:    false,
    swell:         false,
    fermata:       false,
    breath:        false,
    caesura:       false,
  };

  // Adlar muzik.js'te Türkçeleştirildi (Stakato, Simo, mezzo-stakato, tonuto,
  // aksent, İfadeli/ters aksent, Şişirme, sezür); eski adlar da desteklenir.
  for (const mod of oncesi) {
    const ad = String(mod?.kayit?.ad || '').toLocaleLowerCase('tr');
    if (/staccatissimo|^simo$/.test(ad))               { art.staccatissimo = true; }
    else if (/mezzo.sta[ck]{1,2}ato/.test(ad))         { art.mezzoStaccato = true; }
    else if (/staccato accent|stakato aksent/.test(ad)) { art.staccatoAccent = true; art.accent = true; }
    else if (/^sta[ck]{1,2}ato$/.test(ad))             { art.staccato = true; }
    else if (/tenuto|tonuto/.test(ad))                 { art.tenuto = true; }
    else if (/martellato/.test(ad))                    { art.martellato = true; art.accent = true; }
    else if (/expressive accent|reversed accent|ifadeli aksent|ters aksent/.test(ad)) { art.accent = true; }
    else if (/^accent$|^aksent$/.test(ad))             { art.accent = true; }
    else if (/swell|şişirme/.test(ad))                 { art.swell = true; }
  }

  for (const mod of sonrasi) {
    const ad = String(mod?.kayit?.ad || '').toLocaleLowerCase('tr');
    if (/fermata/.test(ad))       { art.fermata = true; }
    else if (/nefes işareti/.test(ad)) { art.breath = true; }
    else if (/caesura|sezür/.test(ad))  { art.caesura = true; }
  }

  return art;
}

/**
 * baseEvent'e artikülasyon parametrelerini uygular; ek gap event'leri döndürür.
 * durationBeats: nota'nın mevcut ritim süresi (tie zinciri dahil).
 */
function articulationUygula(baseEvent, art, durationBeats) {
  if (!art) return;

  // ── Velocity çarpanı ────────────────────────────────────────────────────────
  let mult = 1.0;
  if (art.martellato)          mult = 1.45;
  else if (art.staccatoAccent) mult = 1.35;
  else if (art.accent)         mult = 1.30;
  else if (art.swell)          mult = 1.15;
  else if (art.tenuto)         mult = 1.05;

  if (mult !== 1.0) {
    baseEvent.velocity = Math.min(0.97, Number(baseEvent.velocity) * mult);
  }

  // ── Fermata: ritim slotunu uzat ─────────────────────────────────────────────
  if (art.fermata) {
    baseEvent.durationBeats = durationBeats * 1.75;
    // Fermata sonrası hafif bir sessizlik (nefes boşluğu) — küçük gap eklenmez
    // çünkü piyano doğal olarak sönümlenir; scheduler bekleme süresi yeterli.
  }

  // ── CutOff (staccato türleri) ────────────────────────────────────────────────
  let cutFraction = null;
  if (art.staccatissimo)       cutFraction = 0.12;  // çok kısa — ama min audible korunur
  else if (art.staccatoAccent) cutFraction = 0.28;
  else if (art.martellato)     cutFraction = 0.28;
  else if (art.staccato)       cutFraction = 0.32;
  else if (art.mezzoStaccato)  cutFraction = 0.55;

  if (cutFraction !== null) {
    // Staccato notaları biraz daha sert çalınır (attack compensation)
    const attackBoost = art.staccatissimo ? 1.12 : 1.06;
    baseEvent.velocity = Math.min(0.97, Number(baseEvent.velocity) * attackBoost);
    baseEvent._articulationCutOff      = true;
    baseEvent._articulationCutFraction = cutFraction;
  }
}

export function muzikPlaybackEventListesiOlustur({ ogeler = [], baglar = [], muzikHeader = {}, tupletler = [] }) {
  const repeatExpanded = muzikPlaybackSequenceOlustur(ogeler);
  const ogeMap = new Map((ogeler || []).map((o) => [o.id, o]));

  // Tuplet: noteId → çarpan (inTimeOf / played)
  // Örnek: üçleme 3:2 → her nota * (2/3)
  const tupletCarpanHaritasi = new Map();
  (tupletler || []).forEach((tuplet) => {
    const played = Number(tuplet?.ratio?.played);
    const inTimeOf = Number(tuplet?.ratio?.inTimeOf);
    if (!Number.isFinite(played) || played <= 0 || !Number.isFinite(inTimeOf) || inTimeOf <= 0) return;
    const carpan = inTimeOf / played;
    (tuplet.notaIdler || []).forEach((id) => {
      if (id) tupletCarpanHaritasi.set(id, carpan);
    });
  });
  const tieNextMap = playbackTieSonrakiHaritasiOlustur(baglar, ogeMap);

  const result = [];
  const consumed = new Set();

  let keySignatureAccidentals = keySignatureAccidentalsAl(muzikHeader.keySignature);
  const measureAccidentals = new Map();
  // mf = 0.75 → hook varsayılanıyla aynı, fark hissedilmez
  let currentVelocity = 0.75;
  // Geçerli cresc/decresc modu (null = yok)
  let gradyanMod = null;  // 'cresc' | 'decresc' | null
  // sf geri yükleme: sf notasından ÖNCE seviyeyi sakla, sonraki notada geri ver
  let preSfVelocity = null;
  // Daha yumuşak crescendo/decrescendo: 0.04 → mf'den ff'ye ~5 nota
  const CRESC_ADIM   = 0.04;
  const DECRESC_ADIM = 0.04;

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

    // Aksidental kalıcılığı HER ölçü çizgisinde sıfırlanır — tekrar çubukları (begin/end repeat)
    // da ölçü sınırıdır. (Eskiden begin/endRepeat eksikti → aksidental ölçü taşıyordu = bug.)
    if (oge.tip === 'barline' || oge.tip === 'sectionalBarline' || oge.tip === 'finalBarline'
        || oge.tip === 'beginRepeat' || oge.tip === 'endRepeat') {
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
        velocity: currentVelocity,
      });
      continue;
    }

    if (oge.tip !== 'nota') {
      continue;
    }

    // sf sonrası: bir önceki notada sf varsa bu notada eski seviyeye dön
    if (preSfVelocity !== null) {
      currentVelocity = preSfVelocity;
      preSfVelocity = null;
    }

    // Dinamik işle: sabit seviye ve/veya cresc/decresc modu
    const { velocity: notaVelocity, gradyan: notaGradyan, sfNote } = notaDinamikBilgisiAl(oge);
    if (notaVelocity !== null) {
      if (sfNote) {
        // sforzando: anlık yüksek vuruş → sonraki notada eski seviyeye dön
        preSfVelocity = currentVelocity;
      }
      currentVelocity = notaVelocity;
      gradyanMod = null;
    }
    if (notaGradyan !== null) {
      gradyanMod = notaGradyan;
    }
    // Gradyan modu aktifse bu notada adım at (sabit dinamik bu notada yoksa)
    if (notaVelocity === null && gradyanMod !== null) {
      if (gradyanMod === 'cresc') {
        currentVelocity = Math.min(0.97, currentVelocity + CRESC_ADIM);
      } else if (gradyanMod === 'decresc') {
        currentVelocity = Math.max(0.22, currentVelocity - DECRESC_ADIM);
      }
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
    // Tuplet çarpanı: bu nota tuplet grubundaysa süreye uygula
    const tupletCarpan = tupletCarpanHaritasi.get(oge.id) ?? 1;
    let durationBeats = muzikSureBeatAl(oge) * tupletCarpan;
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

      const nextCarpan = tupletCarpanHaritasi.get(next.id) ?? 1;
      group.push(next);
      durationBeats += muzikSureBeatAl(next) * nextCarpan;
      consumed.add(`${foundIndex}:${next.id}`);
      current = next;
      nextIndex = foundIndex;
    }

    const baseEvent = {
      id: oge.id,
      tip: 'nota',
      oge,
      ogeler: group,
      durationBeats,
      play: true,
      tied: group.length > 1,
      playbackPitchContext: pitchContext,
      velocity: currentVelocity,
    };

    // Artikülasyon: velocity, fermata, cutOff
    const art = notaArticulationBilgisiAl(oge);
    articulationUygula(baseEvent, art, durationBeats);

    // Süsleme varsa event'i genişlet; yoksa orijinali ekle
    const genisletilmis = ornamentEventleriGenislet(baseEvent, currentVelocity);
    for (const ev of genisletilmis) {
      result.push(ev);
    }

    // Nefes işareti / caesura → nota sonrası kısa gap
    if (art.caesura) {
      result.push({ tip: 'gap', durationBeats: 0.5, id: `gap-caesura-${oge.id}`, play: false });
    } else if (art.breath) {
      result.push({ tip: 'gap', durationBeats: 0.2, id: `gap-breath-${oge.id}`, play: false });
    }
  }

  return result;
}
