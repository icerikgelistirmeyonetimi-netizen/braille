import { BRAILLE_CATEGORY_COLORS, normalizeBrailleColorStyle } from './brailleColors.js';
import { MUZIK_SUSLEMELER, MUZIK_DINAMIKLER, MUZIK_NUANS_ONCE, MUZIK_NUANS_SONRA } from '../../data/muzik.js';

function normalizeText(value) {
  return String(value || '').trim();
}

function lower(value) {
  return normalizeText(value).toLowerCase();
}

// Tüm nüans (oncesi/sonrasi) adları — ayrı kategorilerde gruplanır.
const NUANS_ONCE_ADLARI = new Set(
  (Array.isArray(MUZIK_NUANS_ONCE) ? MUZIK_NUANS_ONCE : []).map((o) => lower(o.ad)),
);
const NUANS_SONRA_ADLARI = new Set(
  (Array.isArray(MUZIK_NUANS_SONRA) ? MUZIK_NUANS_SONRA : []).map((o) => lower(o.ad)),
);

// Tüm süsleme adları — legend'da tek girdiyle gruplanır.
const SUSLEME_ADLARI = new Set(
  (Array.isArray(MUZIK_SUSLEMELER) ? MUZIK_SUSLEMELER : []).map((o) => lower(o.ad)),
);

// Bir anlamın süsleme olup olmadığını belirler (kaynak işareti veya ad eşleşmesi).
export function brailleSuslemeMi(anlam = {}) {
  const kaynak = lower(anlam.kaynak || anlam.source || anlam.type || '');
  const tip = lower(anlam.tip || anlam.category || '');
  if (kaynak === 'susleme' || tip === 'susleme') return true;
  const ad = lower(anlam.ad || anlam.name || '');
  const etiket = lower(anlam.etiket || anlam.label || '');
  return SUSLEME_ADLARI.has(ad) || SUSLEME_ADLARI.has(etiket);
}

// Tüm dinamik adları — legend'da tek "dinamik" girdisiyle gruplanır.
const DINAMIK_ADLARI = new Set(
  [...(Array.isArray(MUZIK_DINAMIKLER) ? MUZIK_DINAMIKLER : [])]
    .map((o) => lower(o.ad))
    .filter(Boolean),
);

// Bir anlamın dinamik/ifade işareti olup olmadığını belirler (ad/etiket eşleşmesi).
// "söz işareti" tek başına dinamik değildir ama dinamik hücre dizisinin parçasıdır;
// modifier kaynağıyla geldiğinde dinamik sayılır.
export function brailleDinamikMi(anlam = {}) {
  const kaynak = lower(anlam.kaynak || anlam.source || anlam.type || '');
  const tip = lower(anlam.tip || anlam.category || '');
  if (kaynak === 'dynamic' || tip === 'dynamic' || kaynak === 'dinamik' || tip === 'dinamik') return true;
  const ad = lower(anlam.ad || anlam.name || '');
  const etiket = lower(anlam.etiket || anlam.label || '');
  return DINAMIK_ADLARI.has(ad) || DINAMIK_ADLARI.has(etiket);
}

const SLUR_KAYNAKLARI = new Set([
  'slur',
  'single-slur-after',
  'double-slur-start',
  'slur-before-last',
]);

function isSlurMeaning(kaynak, tip, text) {
  return (
    SLUR_KAYNAKLARI.has(kaynak)
    || SLUR_KAYNAKLARI.has(tip)
    || text.includes('slur')
  );
}

export function normalizeBrailleMeaning(anlam = {}) {
  const kaynak = lower(anlam.kaynak || anlam.source || anlam.type || '');
  const tip = lower(anlam.tip || anlam.category || '');
  const baslik = normalizeText(anlam.baslik || anlam.title || '');
  const etiket = normalizeText(anlam.etiket || anlam.label || '');
  const ad = normalizeText(anlam.ad || anlam.name || '');

  return {
    ...anlam,
    kaynak,
    tip,
    baslik,
    etiket,
    ad,
    ogeId: anlam.ogeId || anlam.sourceId || anlam.itemId || null,
    sourceId: anlam.sourceId || anlam.ogeId || anlam.itemId || null,
    hoverId:
      anlam.hoverId ||
      anlam.ogeId ||
      anlam.sourceId ||
      anlam.itemId ||
      anlam.kaynakId ||
      anlam.bagId ||
      null,
    bagId: anlam.bagId || null,
  };
}

export function brailleHoverIdAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);

  return (
    a.hoverId ||
    a.ogeId ||
    a.sourceId ||
    a.itemId ||
    a.kaynakId ||
    a.bagId ||
    a.id ||
    null
  );
}

export function brailleKategoriAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  const kaynak = a.kaynak;
  const tip = a.tip;
  const text = `${kaynak} ${tip} ${a.baslik} ${a.etiket} ${a.ad}`.toLowerCase();

  // Süslemeler — TÜMÜ tek kategoride (legend tek renk/tek girdi). Nota/aksidental
  // gibi yanlış eşleşmeleri önlemek için en başta kontrol edilir
  // ("turn (notalar arası)" → nota değil; "bemollü trill" → aksidental değil).
  if (kaynak === 'susleme' || tip === 'susleme'
    || SUSLEME_ADLARI.has(lower(a.ad)) || SUSLEME_ADLARI.has(lower(a.etiket))) {
    return 'susleme';
  }

  // Dinamikler (p/f/mf/cresc/dim…) — TÜMÜ tek "dinamik" kategorisinde.
  // Süslemeden sonra, nota/aksidental kontrollerinden önce bakılır.
  if (kaynak === 'dynamic' || tip === 'dynamic' || kaynak === 'dinamik' || tip === 'dinamik'
    || DINAMIK_ADLARI.has(lower(a.ad)) || DINAMIK_ADLARI.has(lower(a.etiket))) {
    return 'dynamic';
  }

  if (isSlurMeaning(kaynak, tip, text)) {
    return 'slur';
  }

  if (kaynak === 'note' || kaynak === 'note-pitch' || tip === 'nota' || text.includes('nota')) {
    return 'nota';
  }

  if (kaynak === 'rest' || tip === 'sus' || text.includes('sus')) {
    return 'sus';
  }

  if (kaynak === 'octave' || tip === 'oktav' || text.includes('oktav')) {
    return 'oktav';
  }

  // Volta (1. ev / 2. ev) — kendi kategorileri (renk + lejant + açıklama)
  if (kaynak === 'volta1' || tip === 'volta1') return 'volta1';
  if (kaynak === 'volta2' || tip === 'volta2') return 'volta2';
  if (text.includes('volta') || text.includes('dolap')) {
    return /(^|[^0-9])2/.test(`${kaynak}${tip}`) ? 'volta2' : 'volta1';
  }

  // Tekrar başlangıcı / bitişi: barline'dan ayrı kategori
  if (kaynak === 'beginrepeat' || tip === 'beginrepeat') return 'beginrepeat';
  if (kaynak === 'endrepeat' || tip === 'endrepeat') return 'endrepeat';

  // Ölçü çizgileri
  if (
    kaynak === 'barline' || kaynak === 'finalbarline' || kaynak === 'sectionalbarline'
    || tip === 'barline' || tip === 'finalbarline' || tip === 'sectionalbarline'
  ) {
    return 'barline';
  }

  if (
    kaynak === 'accidental'
    || tip === 'accidental'
    || text.includes('diyez')
    || text.includes('bemol')
    || text.includes('naturel')
    || text.includes('bekar')
  ) {
    return 'accidental';
  }

  if (kaynak === 'time-signature-change' || tip === 'time-signature-change') {
    return 'time-signature-change';
  }

  if (kaynak === 'time-signature' || tip === 'time-signature' || text.includes('zaman')) {
    return 'time-signature';
  }

  if (kaynak === 'key-signature-change' || tip === 'key-signature-change') {
    return 'key-signature-change';
  }

  if (kaynak === 'key-signature' || tip === 'key-signature' || text.includes('donanım') || text.includes('donanim')) {
    return 'key-signature';
  }

  if (kaynak === 'clef' || kaynak === 'anahtar' || tip === 'anahtar' || text.includes('anahtar')) {
    return 'anahtar';
  }

  if (kaynak === 'bar-number' || tip === 'bar-number' || text.includes('ölçü numarası') || text.includes('olcu numarası')) {
    return 'bar-number';
  }

  // Geri-sayısal tekrar (⠼N) — bar-repeat'ten (⠶) AYRI kategori (ayrı legend girdisi/etiketi).
  if (kaynak === 'backward-repeat' || tip === 'backward-repeat' || text.includes('geri-sayısal')) {
    return 'backward-repeat';
  }

  if (kaynak === 'bar-repeat' || tip === 'bar-repeat' || text.includes('braille repeat') || text.includes('repeat') || text.includes('tekrar')) {
    return 'bar-repeat';
  }

  if (kaynak === 'tie' || tip === 'tie' || text.includes('tie') || text.includes('uzatma bağı') || text.includes('uzatma bagi')) {
    return 'tie';
  }

  if (kaynak === 'slur' || tip === 'slur' || text.includes('slur')) {
    return 'slur';
  }

  if (kaynak === 'bag' || tip === 'bag' || text.includes('bağ') || text.includes('bag')) {
    return 'bag';
  }

  if (kaynak === 'tuplet' || tip === 'tuplet' || text.includes('triplet') || text.includes('üçleme') || text.includes('ucleme')) {
    return 'tuplet';
  }

  if (kaynak === 'tempo' || tip === 'tempo' || text.includes('tempo')) {
    return 'tempo';
  }

  if (kaynak === 'title' || tip === 'title' || text.includes('başlık') || text.includes('baslik')) {
    return 'title';
  }

  if (kaynak === 'composer' || tip === 'composer' || text.includes('besteci')) {
    return 'composer';
  }

  if (kaynak === 'header-meta' || tip === 'header-meta') {
    return 'header-meta';
  }

  if (kaynak.includes('modifier') || tip.includes('modifier')) {
    const etiketLower = lower(a.etiket);
    if (NUANS_ONCE_ADLARI.has(etiketLower) || a.kategori === 'nuans' && kaynak.includes('oncesi')) {
      return 'nuans-once';
    }
    if (NUANS_SONRA_ADLARI.has(etiketLower) || a.kategori === 'nuans' && kaynak.includes('sonrasi')) {
      return 'nuans-sonra';
    }
    return kaynak || tip || 'modifier';
  }

  if (kaynak === 'dot' || tip === 'dot') return 'dot';

  if (kaynak === 'sign' || tip === 'isaret' || tip === 'işaret') {
    return 'sign';
  }

  return 'unknown';
}

export function brailleLejantEtiketiAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  const kategori = brailleKategoriAl(a);

  if (kategori === 'slur') {
    const noteName = /^(do|re|mi|fa|sol|la|si)\b/i;
    if (a.kaynak === 'double-slur-start') {
      return a.etiket && !noteName.test(a.etiket)
        ? a.etiket
        : 'çift slur başlangıcı';
    }
    if (a.kaynak === 'slur-before-last') {
      return a.etiket && !noteName.test(a.etiket)
        ? a.etiket
        : 'slur bitiş işareti';
    }
    if (a.kaynak === 'single-slur-after') {
      return a.etiket && !noteName.test(a.etiket)
        ? a.etiket
        : 'slur';
    }
    return a.etiket && !noteName.test(a.etiket)
      ? a.etiket
      : 'slur';
  }

  // ── Tek-girdi (kategorik) lejant'lar — etiket nüansları gizlenir ─────────
  // Nüanslar: her nüans (staccato, fermata…) için ayrı girdi açılmasın → tek grup
  if (kategori === 'nuans-once')  return 'nüans (önce)';
  if (kategori === 'nuans-sonra') return 'nüans (sonra)';
  // Süslemeler: her süsleme (trill, turn, mordent…) için ayrı girdi açılmasın
  // → tek "süsleme" girdisi (tek renk). Ayrıntı tıklayınca panelde gösterilir.
  if (kategori === 'susleme') return 'süsleme';
  // Dinamikler: her dinamik (p/f/mf/cresc…) için ayrı girdi açılmasın → tek "dinamik"
  if (kategori === 'dynamic') return 'dinamik';
  // Oktav: 4., 5. vb. ayırma → tek "Oktav işareti" girdisi
  if (kategori === 'oktav') return 'oktav işareti';
  // Aksidental: sharp/flat/natural ayırma → tek "Aksidental" girdisi
  if (kategori === 'accidental') return 'aksidental';
  // Ölçü çizgileri (barline / final / sectional)
  if (a.kaynak === 'finalbarline' || a.kaynak === 'finalBarline') return 'bitiş çizgisi';
  if (a.kaynak === 'sectionalbarline' || a.kaynak === 'sectionalBarline') return 'bölüm çizgisi';
  if (kategori === 'beginrepeat') return 'tekrar başlangıcı';
  if (kategori === 'endrepeat') return 'tekrar bitişi';
  if (kategori === 'volta1') return '1. ev (volta)';
  if (kategori === 'volta2') return '2. ev (volta)';
  if (kategori === 'dot') return 'noktalı uzatma';
  if (kategori === 'barline' || a.kaynak === 'barline') return 'ölçü çizgisi';
  // Bar repeat: her ölçü için ayrı girdi açılmasın → tek "braille tekrar".
  // Kompakt ⠶⠼N tekrarında türü/sayıyı da yaz ("braille tekrar ×8").
  if (kategori === 'bar-repeat') {
    const n = Number(a.tekrarSayisi);
    return n > 1 ? `Braille tekrar ×${n}` : 'Braille tekrar';
  }
  // Sayısal ölçü tekrarı (⠼N / ⠼N⠼M / ⠼<alt>N-M) — geri-sayısal VEYA bar-number; ikisi de N ölçülük tekrar.
  if (kategori === 'backward-repeat') {
    const n = Number(a.tekrarSayisi);
    return n > 0 ? `ölçü tekrarı (${n} ölçü)` : 'ölçü tekrarı';
  }
  // Bar number: her ölçü numarası için ayrı girdi açılmasın
  if (kategori === 'bar-number') return 'ölçü numarası';
  // Nota: pitch ayırma (do/re/mi…) yerine tek "Nota" girdisi olsun
  if (kategori === 'nota') return 'nota';
  // Sus: süre ayırma → tek "Sus" girdisi
  if (kategori === 'sus') return 'sus';
  // Tie/Slur/Bag → tek girdi
  if (kategori === 'tie') return 'uzatma bağı (tie)';
  if (kategori === 'bag') return 'bağ';
  // Nokta cell'i
  if (a.kaynak === 'dot') return 'noktalı uzatma';
  // Tuplet
  if (kategori === 'tuplet') return 'tuplet';

  if (a.etiket) return a.etiket;
  if (a.ad) return a.ad;
  if (a.baslik) return a.baslik;

  if (kategori === 'nota') return 'nota';
  if (kategori === 'sus') return 'sus';
  if (kategori === 'oktav') return 'oktav';
  if (kategori === 'accidental') return 'aksidental';
  if (kategori === 'time-signature') return 'zaman imzası';
  if (kategori === 'time-signature-change') return 'zaman değişimi';
  if (kategori === 'key-signature') return 'donanım';
  if (kategori === 'key-signature-change') return 'donanım değişimi';
  if (kategori === 'anahtar') return 'anahtar';
  if (kategori === 'bar-number') return 'ölçü numarası';
  if (kategori === 'bar-repeat') {
    const n = Number(a.tekrarSayisi);
    return n > 1 ? `Braille tekrar ×${n}` : 'Braille tekrar';
  }
  if (kategori === 'backward-repeat') {
    const n = Number(a.tekrarSayisi);
    return n > 0 ? `ölçü tekrarı (${n} ölçü)` : 'ölçü tekrarı';
  }
  if (kategori === 'tie') return 'tie';
  if (kategori === 'slur') {
    const noteName = /^(do|re|mi|fa|sol|la|si)\b/i;
    if (a.kaynak === 'double-slur-start') {
      return a.etiket && !noteName.test(a.etiket)
        ? a.etiket
        : 'çift slur başlangıcı';
    }
    if (a.kaynak === 'slur-before-last') {
      return a.etiket && !noteName.test(a.etiket)
        ? a.etiket
        : 'slur bitiş işareti';
    }
    if (a.kaynak === 'single-slur-after') {
      return a.etiket && !noteName.test(a.etiket)
        ? a.etiket
        : 'slur';
    }
    return a.etiket && !noteName.test(a.etiket)
      ? a.etiket
      : 'slur';
  }
  if (kategori === 'tuplet') return 'tuplet';
  if (kategori === 'tempo') return 'tempo';

  return 'işaret';
}

export function brailleLejantKeyAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  const kategori = brailleKategoriAl(a);
  const etiket = brailleLejantEtiketiAl(a);
  return `${kategori}:${etiket}`;
}

export function brailleRenkAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  const kategori = brailleKategoriAl(a);

  return normalizeBrailleColorStyle(
    BRAILLE_CATEGORY_COLORS[kategori] ||
    BRAILLE_CATEGORY_COLORS[a.kaynak] ||
    BRAILLE_CATEGORY_COLORS.unknown
  );
}

export function brailleColorForMeaning(anlam = {}) {
  return brailleRenkAl(anlam);
}

export function brailleAnlamOgeIdAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  return a.ogeId || a.sourceId || null;
}

export function brailleIsNoteMeaning(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);  const kategori = brailleKategoriAl(a);
  if (kategori === 'slur' || kategori === 'tie') return false;
  const text = `${a.tip} ${a.baslik} ${a.etiket} ${a.ad}`.toLowerCase();
  return /(do|re|mi|fa|sol|la|si)/.test(text) || text.includes('nota');
}

export function brailleNoteLabel(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  const text = `${a.etiket} ${a.baslik} ${a.ad}`.toLowerCase();

  if (text.includes('sol')) return 'sol';
  if (text.includes('fa')) return 'fa';
  if (text.includes('mi')) return 'mi';
  if (text.includes('re')) return 're';
  if (text.includes('do')) return 'do';
  if (text.includes('la')) return 'la';
  if (text.includes('si')) return 'si';
  return '';
}

export function brailleNotaEtiketiAl(anlam = {}) {
  return brailleNoteLabel(anlam);
}

export function brailleBagKisaEtiketiAl(anlam = {}) {
  const kategori = brailleKategoriAl(anlam);

  if (kategori === 'tie') return 'tie';
  if (kategori === 'slur') return 'slur';
  if (kategori === 'bag') return 'bağ';

  return '';
}

/**
 * Cell altına gösterilecek KISA etiket. Tek karakter ya da kısa kod.
 *   Oktav → oktav numarası ("5")
 *   Aksidental → sembol (♯ ♭ ♮ 𝄪 𝄫)
 *   Nokta → "·"
 *   Diğer → boş
 */
export function brailleKisaCellLabelAl(anlam = {}) {
  if (!anlam) return '';
  const a = normalizeBrailleMeaning(anlam);
  const kategori = brailleKategoriAl(a);
  const kaynak = String(a.kaynak || '').toLowerCase();
  const etiket = String(a.etiket || '').toLowerCase();

  // Oktav → numarayı çıkar
  if (kategori === 'oktav') {
    const m = /(\d)\s*\.\s*oktav/.exec(etiket);
    if (m) return m[1];
    const m2 = /(\d)/.exec(etiket);
    if (m2) return m2[1];
    return 'okt';
  }

  // Aksidental → sembol
  if (kategori === 'accidental') {
    if (/double.*sharp|cift.*diyez|iki.*diyez/.test(etiket)) return String.fromCodePoint(0x1D12A);
    if (/double.*flat|cift.*bemol|iki.*bemol/.test(etiket))  return String.fromCodePoint(0x1D12B);
    if (/sharp|diyez/.test(etiket))  return '♯';
    if (/flat|bemol/.test(etiket))   return '♭';
    if (/natural|naturel|bekar/.test(etiket)) return '♮';
    return '♯';
  }

  // Nokta (dotted)
  if (kaynak === 'dot' || /noktalı uzatma|noktal.{1,3}uzatma/.test(etiket)) {
    return '·';
  }

  // Dinamik → standart işaret ("p (piano)" → "p", "cresc. (crescendo)" → "cresc.")
  if (kategori === 'dynamic') {
    const ham = String(a.etiket || a.ad || '').trim();
    const oncesi = ham.split('(')[0].trim();
    return oncesi || ham;
  }

  return '';
}

export function getBrailleItemLabel(anlam = {}) {
  return brailleLejantEtiketiAl(anlam);
}

export function brailleTooltipAl(anlam = {}) {
  const a = normalizeBrailleMeaning(anlam);
  const kategori = brailleKategoriAl(a);
  const etiket = brailleLejantEtiketiAl(a);

  if (kategori === 'key-signature' || kategori === 'key-signature-change') {
    const m = /(\d+)\s*(diyezli|diyez|bemollü|bemollu|bemol)/i.exec(etiket || a.ad || a.baslik);
    if (m) {
      const sayi = parseInt(m[1], 10);
      const tur = /diyez/i.test(m[2]) ? 'diyez' : 'bemol';
      if (sayi >= 4) {
        return `${sayi} ${tur} donanım: sayı işareti + ${sayi} + ${tur}`;
      }
      return `${sayi} ${tur} donanım`;
    }
  }

  return etiket;
}
