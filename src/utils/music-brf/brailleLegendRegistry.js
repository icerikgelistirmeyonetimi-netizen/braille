import { BRAILLE_CATEGORY_COLORS, normalizeBrailleColorStyle } from './brailleColors.js';

function normalizeText(value) {
  return String(value || '').trim();
}

function lower(value) {
  return normalizeText(value).toLowerCase();
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
    return kaynak || tip || 'modifier';
  }

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
  if (kategori === 'bar-repeat') return 'braille tekrar';
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
