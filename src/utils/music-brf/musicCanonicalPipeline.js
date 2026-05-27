import { muzikSkorunuBrailleyeCevir } from '../music/musicBrfEngine.js';
import { brfMuzikOku } from './brfMusicReader.js';
import { brailleMetniOlustur } from './brailleText.js';

function hucreKey(hucre = []) {
  return Array.isArray(hucre) && hucre.length
    ? hucre.slice().sort((a, b) => a - b).join('-')
    : '';
}

function metaKaynak(meta = {}) {
  return String(meta?.kaynak || meta?.tip || '').toLowerCase();
}

function canonicalBeginRepeatMetaMi(meta = {}) {
  const kaynak = metaKaynak(meta);
  const etiket = String(meta?.etiket || meta?.gorunum || '').toLocaleLowerCase('tr');
  const gorunum = String(meta?.gorunum || '');

  return (
    kaynak === 'beginrepeat' ||
    kaynak === 'begin-repeat' ||
    kaynak === 'startrepeat' ||
    gorunum === '𝄆' ||
    etiket.includes('başlangıç tekrar') ||
    etiket.includes('baslangic tekrar') ||
    etiket.includes('begin repeat') ||
    etiket.includes('start repeat')
  );
}

function canonicalEndRepeatMetaMi(meta = {}) {
  const kaynak = metaKaynak(meta);
  const etiket = String(meta?.etiket || meta?.gorunum || '').toLocaleLowerCase('tr');
  const gorunum = String(meta?.gorunum || '');

  return (
    kaynak === 'endrepeat' ||
    kaynak === 'end-repeat' ||
    kaynak === 'repeatend' ||
    gorunum === '𝄇' ||
    etiket.includes('bitiş tekrar') ||
    etiket.includes('bitis tekrar') ||
    etiket.includes('end repeat')
  );
}

function canonicalNormalBarlineMetaMi(meta = {}, hucre = []) {
  const kaynak = metaKaynak(meta);
  const etiket = String(meta?.etiket || meta?.gorunum || '').toLocaleLowerCase('tr');

  if (canonicalBeginRepeatMetaMi(meta)) return false;
  if (canonicalEndRepeatMetaMi(meta)) return true;

  if (
    kaynak === 'barline' ||
    kaynak === 'finalbarline' ||
    kaynak === 'sectionalbarline'
  ) {
    return true;
  }

  if (hucreKey(hucre) === '' && /ölçü|olcu|barline|measure/.test(etiket)) {
    return true;
  }

  return false;
}

function canonicalIcerikMetaMi(meta = {}) {
  const kaynak = metaKaynak(meta);

  if (!meta) return false;

  if (
    kaynak === 'note' ||
    kaynak === 'note-pitch' ||
    kaynak === 'rest' ||
    kaynak === 'dot' ||
    kaynak === 'octave' ||
    kaynak === 'accidental' ||
    kaynak === 'beginrepeat' ||
    kaynak === 'endrepeat' ||
    kaynak === 'tie' ||
    kaynak === 'slur' ||
    kaynak.includes('modifier')
  ) {
    return true;
  }

  return false;
}

function canonicalRepeatParcasiMi(meta = {}) {
  return (
    meta?.repeatParcasi === true ||
    metaKaynak(meta) === 'beginrepeat' ||
    metaKaynak(meta) === 'endrepeat'
  );
}

function canonicalAyniRepeatOgesiMi(a = {}, b = {}) {
  if (!a || !b) return false;

  const aId = a.ogeId || a.sourceId || a.itemId || null;
  const bId = b.ogeId || b.sourceId || b.itemId || null;

  if (aId && bId && aId === bId) return true;

  return (
    canonicalRepeatParcasiMi(a) &&
    canonicalRepeatParcasiMi(b) &&
    metaKaynak(a) === metaKaynak(b)
  );
}

function canonicalRepeatBlokSonIndexAl(metaList = [], startIndex = 0) {
  const startMeta = metaList[startIndex] || {};

  if (!canonicalRepeatParcasiMi(startMeta)) {
    return startIndex;
  }

  if (startMeta.repeatSonHucre === true) {
    return startIndex;
  }

  let son = startIndex;

  for (let i = startIndex + 1; i < metaList.length; i += 1) {
    const currentMeta = metaList[i] || {};

    if (!canonicalAyniRepeatOgesiMi(startMeta, currentMeta)) {
      break;
    }

    son = i;

    if (currentMeta.repeatSonHucre === true) {
      break;
    }
  }

  return son;
}

function canonicalRepeatBlokTipiAl(meta = {}) {
  if (canonicalBeginRepeatMetaMi(meta)) return 'beginRepeat';
  if (canonicalEndRepeatMetaMi(meta)) return 'endRepeat';
  return '';
}

function canonicalOlcuGruplariOlustur(hucreler = [], metaList = []) {
  const olculer = [];
  let aktif = [];
  let aktifIcerikVar = false;

  const kapat = () => {
    if (aktif.length) {
      olculer.push(aktif);
      aktif = [];
      aktifIcerikVar = false;
    }
  };

  for (let i = 0; i < hucreler.length; i += 1) {
    const hucre = hucreler[i];
    const meta = metaList[i] || {};

    const repeatTipi = canonicalRepeatBlokTipiAl(meta);

    if (repeatTipi) {
      const sonIdx = canonicalRepeatBlokSonIndexAl(metaList, i);
      const blok = [];

      for (let j = i; j <= sonIdx; j += 1) {
        blok.push({
          hucre: hucreler[j],
          meta: metaList[j] || {},
          index: j,
        });
      }

      if (repeatTipi === 'beginRepeat') {
        if (aktif.length && aktifIcerikVar) {
          kapat();
        }

        aktif.push(...blok);
        aktifIcerikVar = true;
        i = sonIdx;
        continue;
      }

      if (repeatTipi === 'endRepeat') {
        aktif.push(...blok);
        aktifIcerikVar = true;
        i = sonIdx;
        kapat();
        continue;
      }
    }

    aktif.push({ hucre, meta, index: i });

    if (canonicalIcerikMetaMi(meta)) {
      aktifIcerikVar = true;
    }

    if (canonicalEndRepeatMetaMi(meta)) {
      kapat();
      continue;
    }

    if (canonicalNormalBarlineMetaMi(meta, hucre) && aktifIcerikVar) {
      kapat();
    }
  }

  kapat();

  return olculer;
}

function canonicalOlculeriMetneCevir(olculer = []) {
  return olculer
    .map((olcu) => brailleMetniOlustur(olcu.map((item) => item.hucre)))
    .filter(Boolean)
    .join('⠀');
}

export function scoreToCanonicalBrf({
  ogeler = [],
  baglar = [],
  header = {},
  tupletler = [],
  options = {},
} = {}) {
  const useBrailleGrouping = Boolean(options?.useBrailleGrouping);
  const strictDurationCells = options?.strictDurationCells !== false && !useBrailleGrouping;

  const brfData = muzikSkorunuBrailleyeCevir(
    ogeler,
    baglar,
    header,
    tupletler,
    {
      ...options,
      canonicalMode: true,
      useBrailleGrouping,
      strictDurationCells,
    },
  );

  const bodyMeasures = canonicalOlcuGruplariOlustur(
    brfData.hucreler || [],
    brfData.hucreMeta || [],
  );

  const bodyText = canonicalOlculeriMetneCevir(bodyMeasures);

  const headerLines = Array.isArray(brfData.headerSatirlari)
    ? brfData.headerSatirlari
        .map((satir) => brailleMetniOlustur(satir.hucreler || []))
        .filter(Boolean)
    : [];

  const brfText = [
    ...headerLines,
    bodyText,
  ].filter(Boolean).join('\n');

  return {
    brfText,
    bodyText,
    bodyMeasures,
    headerLines,
    brfData,
  };
}

export function scoreToReaderResult({
  ogeler = [],
  baglar = [],
  header = {},
  tupletler = [],
  options = {},
} = {}) {
  const canonical = scoreToCanonicalBrf({
    ogeler,
    baglar,
    header,
    tupletler,
    options,
  });

  const readerResult = brfMuzikOku(canonical.brfText, {
    ...options,
    source: 'editor-canonical-brf',
  });

  return {
    ...readerResult,
    canonicalBrfText: canonical.brfText,
    canonicalBodyText: canonical.bodyText,
    canonicalHeaderLines: canonical.headerLines,
    canonicalBrfData: canonical.brfData,
  };
}
