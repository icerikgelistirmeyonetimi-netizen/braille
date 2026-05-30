// Müzik BRF editörü — Braille anlam, ölçü ve lejant yardımcıları
import {
  normalizeBrailleMeaning,
  brailleKategoriAl,
  brailleLejantEtiketiAl,
  brailleLejantKeyAl,
  brailleRenkAl,
  brailleColorForMeaning,
  brailleAnlamOgeIdAl,
  brailleIsNoteMeaning,
  brailleNoteLabel,
  brailleNotaEtiketiAl,
  brailleBagKisaEtiketiAl,
  brailleKisaCellLabelAl,
  getBrailleItemLabel,
  brailleTooltipAl,
  brailleHoverIdAl,
} from './brailleLegendRegistry.js';
import {
  brailleAnlamMetni,
  brailleAnlamMetniAl,
  brailleMetinBirlesikAl,
  brailleSafeText,
  brailleTemizMetin,
} from './brailleText.js';

export {
  normalizeBrailleMeaning,
  brailleKategoriAl,
  brailleLejantEtiketiAl,
  brailleLejantKeyAl,
  brailleRenkAl,
  brailleColorForMeaning,
  brailleAnlamOgeIdAl,
  brailleIsNoteMeaning,
  brailleNoteLabel,
  brailleNotaEtiketiAl,
  brailleBagKisaEtiketiAl,
  brailleKisaCellLabelAl,
  getBrailleItemLabel,
  brailleTooltipAl,
  brailleHoverIdAl,
};

export function brailleAnlamBagIdAl(anlam) {
  if (!anlam) return null;

  if (anlam.bagId) return anlam.bagId;
  if (anlam.meta?.bagId) return anlam.meta.bagId;
  if (anlam.raw?.bagId) return anlam.raw.bagId;
  if (anlam.original?.bagId) return anlam.original.bagId;
  if (anlam.kaynakMeta?.bagId) return anlam.kaynakMeta.bagId;
  if (anlam.hucreMeta?.bagId) return anlam.hucreMeta.bagId;
  if (anlam.item?.bagId) return anlam.item.bagId;

  const metaList =
    (Array.isArray(anlam.metas) && anlam.metas) ||
    (Array.isArray(anlam.metaList) && anlam.metaList) ||
    (Array.isArray(anlam.metaItems) && anlam.metaItems) ||
    (Array.isArray(anlam.hucreMetaları) && anlam.hucreMetaları) ||
    [];

  const found = metaList.find((m) => m?.bagId);
  if (found?.bagId) return found.bagId;

  return null;
}

function isRestMeta(meta) {
  if (!meta) return false;

  const tip = brailleTemizMetin(meta?.tip).toLocaleLowerCase('tr');
  const type = brailleTemizMetin(meta?.type).toLocaleLowerCase('tr');
  const source = brailleTemizMetin(meta?.source || meta?.kaynak).toLocaleLowerCase('tr');
  const kategori = brailleTemizMetin(meta?.kategori).toLocaleLowerCase('tr');
  const kind = brailleTemizMetin(meta?.kind).toLocaleLowerCase('tr');
  const metin = brailleMetinBirlesikAl(meta);

  return (
    type === 'rest' ||
    tip === 'sus' ||
    source === 'rest' ||
    kategori === 'sus' ||
    kind === 'rest' ||
    metin.includes(' sus') ||
    metin.includes('rest')
  );
}

function getDurationTextFromMeta(meta) {
  if (!meta) return '';

  const sureAd = brailleTemizMetin(meta?.sureAd);
  if (sureAd) {
    const sureAdLower = String(sureAd).toLowerCase();

    if (sureAdLower.includes('16')) return '16';
    if (sureAdLower.includes('32')) return '32';
    if (sureAdLower.includes('64')) return '64';

    return sureAd;
  }

  const ad = brailleTemizMetin(meta?.ad).toLocaleLowerCase('tr');
  if (ad.includes('birlik')) return 'birlik';
  if (ad.includes('ikilik') || ad.includes('yarım') || ad.includes('yarim')) return 'ikilik';
  if (ad.includes('dörtlük') || ad.includes('dortluk')) return 'dörtlük';
  if (ad.includes('sekizlik')) return 'sekizlik';
  if (ad.includes('16')) return '16';
  if (ad.includes('32')) return '32';
  if (ad.includes('64')) return '64';

  const realValue = Number(meta?.realValue);

  if (realValue === 1) return 'birlik';
  if (realValue === 2) return 'ikilik';
  if (realValue === 4) return 'dörtlük';
  if (realValue === 8) return 'sekizlik';
  if (realValue === 16) return '16';
  if (realValue === 32) return '32';
  if (realValue === 64) return '64';

  return '';
}

function getLegendGroupKey(meta) {
  if (isRestMeta(meta)) {
    return 'legend-rest';
  }

  if (brailleKategoriAl(meta) === 'oktav') {
    return 'legend-octave';
  }

  const kategori = brailleKategoriAl(meta);
  const etiket = brailleLejantEtiketiAl(meta);

  return `${kategori}:${etiket}`;
}

export function brailleIsBarlineMeaning(anlam) {
  if (brailleAnlamBeginRepeatMi(anlam)) {
    return false;
  }

  if (brailleAnlamEndRepeatMi(anlam)) {
    return true;
  }

  const text = [
    brailleSafeText(anlam?.tip),
    brailleSafeText(anlam?.baslik),
    brailleSafeText(anlam?.etiket),
  ]
    .join(' ')
    .toLowerCase();

  const direct = brailleAnlamMetniAl(anlam);

  return (
    direct === '|'
    || direct === '||'
    || direct === ':|'
    || direct === '|:'
    || text.includes('ölçü')
    || text.includes('olcu')
    || text.includes('barline')
    || text.includes('measure')
    || text.includes('çift çizgi')
    || text.includes('bitiş çizgisi')
    || text.includes('son çizgi')
  );
}

// FALLBACK ONLY:
// Ana skor/BRF akışı canonicalBrfText → brfMuzikOku reader sonucunu kullanır.
// Bu fonksiyon yalnızca eski ölçü bazlı Braille satır üretimi için fallback olarak kalır.
export function brailleMeasureGroups(hucreler, anlamlar) {
  const olculer = [];
  let aktif = [];

  const aktifIcerikVarMi = () => aktif.some((item) => {
    const anlam = item?.anlam;
    if (!anlam) return false;

    if (brailleAnlamBeginRepeatMi(anlam)) return false;

    return brailleAnlamOlcuIciIcerikMi(anlam);
  });

  const aktifKapat = () => {
    if (aktif.length > 0) {
      olculer.push(aktif);
      aktif = [];
    }
  };

  for (let i = 0; i < (hucreler || []).length; i += 1) {
    const hucre = hucreler[i];
    const anlam = anlamlar?.[i];

    const isBeginRepeat = brailleAnlamBeginRepeatMi(anlam);
    const isEndRepeat = brailleAnlamEndRepeatMi(anlam);

    if (isBeginRepeat) {
      if (aktif.length > 0 && aktifIcerikVarMi()) {
        aktifKapat();
      }

      const sonIdx = repeatIsaretininSonHucreIndexiAl(anlamlar, i);
      for (let j = i; j <= sonIdx; j += 1) {
        aktif.push({
          index: j,
          hucre: hucreler[j],
          anlam: anlamlar?.[j],
        });
      }

      i = sonIdx;
      continue;
    }

    if (isEndRepeat) {
      const sonIdx = repeatIsaretininSonHucreIndexiAl(anlamlar, i);
      for (let j = i; j <= sonIdx; j += 1) {
        aktif.push({
          index: j,
          hucre: hucreler[j],
          anlam: anlamlar?.[j],
        });
      }

      i = sonIdx;
      aktifKapat();
      continue;
    }

    aktif.push({
      index: i,
      hucre,
      anlam,
    });

    if (brailleIsBarlineMeaning(anlam)) {
      aktifKapat();
    }
  }

  aktifKapat();

  return olculer;
}

// FALLBACK ONLY:
// Ana skor/BRF akışı canonicalBrfText → brfMuzikOku reader sonucunu kullanır.
// Bu fonksiyon yalnızca eski ölçü bazlı Braille satır üretimi için fallback olarak kalır.
export function brailleRowsFromMeasures(hucreler, anlamlar, measuresPerRow = 6) {
  const olculer = brailleMeasureGroups(hucreler, anlamlar);
  const rows = [];

  for (let i = 0; i < olculer.length; i += measuresPerRow) {
    rows.push(olculer.slice(i, i + measuresPerRow));
  }

  return rows;
}

export function brailleLegendFromRowMeasures(rowMeasures) {
  const map = new Map();

  rowMeasures.forEach((olcu) => {
    olcu.forEach((item) => {
      if (brailleIsNoteMeaning(item.anlam)) return;

      const key = brailleLejantKeyAl(item.anlam);
      const label = brailleLejantEtiketiAl(item.anlam);
      if (!label) return;

      if (!map.has(key)) {
        map.set(key, {
          key,
          label,
          color: brailleRenkAl(item.anlam),
        });
      }
    });
  });

  return Array.from(map.values());
}

export function brailleAnlamNotaAdiAl(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);

  const eslesme = metin.match(/(^|[^a-zçğıöşü])(do|re|mi|fa|sol|la|si)([^a-zçğıöşü]|$)/u);

  return eslesme ? eslesme[2] : '';
}

export function brailleAnlamNotaMi(anlam) {
  // Sadece KESİN nota cell'leri "nota" sayılır → legend'den çıkarılır.
  // Aksidental, nokta, oktav, slur, tie, bag gibi modifier cell'leri ASLA
  // nota değildir; bunlar legend'de görünmeli.
  const tip = brailleTemizMetin(anlam?.tip).toLocaleLowerCase('tr');
  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');

  // Sadece bu üç durumda nota say
  return tip === 'nota' || kaynak === 'note' || kaynak === 'note-pitch';
}

export function brailleAnlamTekrarMi(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);

  return (
    metin.includes('tekrar') ||
    metin.includes('röpriz') ||
    metin.includes('repeat') ||
    metin.includes('volta') ||
    metin.includes('dolap')
  );
}

export function brailleAnlamBeginRepeatMi(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);
  const dogrudan = brailleAnlamMetni(anlam);
  const tip = brailleTemizMetin(anlam?.tip).toLocaleLowerCase('tr');
  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');
  const etiket = brailleTemizMetin(anlam?.etiket).toLocaleLowerCase('tr');
  const baslik = brailleTemizMetin(anlam?.baslik).toLocaleLowerCase('tr');
  const gorunumRaw = brailleTemizMetin(anlam?.gorunum);
  const etiketRaw = brailleTemizMetin(anlam?.etiket);
  const baslikRaw = brailleTemizMetin(anlam?.baslik);

  return (
    tip === 'beginrepeat' ||
    tip === 'begin-repeat' ||
    tip === 'startrepeat' ||
    kaynak === 'beginrepeat' ||
    kaynak === 'begin-repeat' ||
    kaynak === 'startrepeat' ||
    dogrudan === '|:' ||
    dogrudan === '𝄆' ||
    gorunumRaw === '𝄆' ||
    etiketRaw === '𝄆' ||
    baslikRaw === '𝄆' ||
    metin.includes('başlangıç tekrar') ||
    metin.includes('baslangic tekrar') ||
    metin.includes('başlangıç tekrarı') ||
    metin.includes('baslangic tekrari') ||
    metin.includes('begin repeat') ||
    metin.includes('start repeat') ||
    etiket.includes('başlangıç') ||
    etiket.includes('baslangic') ||
    baslik.includes('başlangıç') ||
    baslik.includes('baslangic')
  );
}

export function brailleAnlamEndRepeatMi(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);
  const dogrudan = brailleAnlamMetni(anlam);
  const tip = brailleTemizMetin(anlam?.tip).toLocaleLowerCase('tr');
  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');
  const etiket = brailleTemizMetin(anlam?.etiket).toLocaleLowerCase('tr');
  const baslik = brailleTemizMetin(anlam?.baslik).toLocaleLowerCase('tr');
  const gorunumRaw = brailleTemizMetin(anlam?.gorunum);
  const etiketRaw = brailleTemizMetin(anlam?.etiket);
  const baslikRaw = brailleTemizMetin(anlam?.baslik);

  return (
    tip === 'endrepeat' ||
    tip === 'end-repeat' ||
    tip === 'repeatend' ||
    kaynak === 'endrepeat' ||
    kaynak === 'end-repeat' ||
    kaynak === 'repeatend' ||
    dogrudan === ':|' ||
    dogrudan === '𝄇' ||
    gorunumRaw === '𝄇' ||
    etiketRaw === '𝄇' ||
    baslikRaw === '𝄇' ||
    metin.includes('bitiş tekrar') ||
    metin.includes('bitis tekrar') ||
    metin.includes('bitiş tekrarı') ||
    metin.includes('bitis tekrari') ||
    metin.includes('end repeat') ||
    etiket.includes('bitiş') ||
    etiket.includes('bitis') ||
    baslik.includes('bitiş') ||
    baslik.includes('bitis')
  );
}

function brailleRepeatIlkHucreMi(anlam) {
  if (!anlam) return false;

  if (anlam.repeatParcasi && Number.isFinite(Number(anlam.hucreSira))) {
    return Number(anlam.hucreSira) === 0;
  }

  if (anlam.repeatIlkHucre === true) return true;

  return false;
}

function brailleRepeatSonHucreMi(anlam) {
  if (!anlam) return false;

  if (anlam.repeatParcasi && Number.isFinite(Number(anlam.hucreSira)) && Number.isFinite(Number(anlam.hucreSayisi))) {
    return Number(anlam.hucreSira) === Number(anlam.hucreSayisi) - 1;
  }

  if (anlam.repeatSonHucre === true) return true;

  return false;
}

function ayniRepeatOgesiMi(a, b) {
  if (!a || !b) return false;

  const aId = a.ogeId || a.sourceId || a.itemId || null;
  const bId = b.ogeId || b.sourceId || b.itemId || null;

  if (aId && bId && aId === bId) return true;

  return (
    a.repeatParcasi &&
    b.repeatParcasi &&
    a.kaynak === b.kaynak
  );
}

function repeatIsaretininSonHucreIndexiAl(anlamlar = [], startIndex = 0) {
  const start = anlamlar[startIndex];

  if (!start) return startIndex;

  let last = startIndex;

  for (let i = startIndex + 1; i < anlamlar.length; i += 1) {
    const current = anlamlar[i];

    if (!ayniRepeatOgesiMi(start, current)) {
      break;
    }

    last = i;
  }

  return last;
}

export function brailleAnlamInlineDegisimMi(anlam) {
  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');
  const tip = brailleTemizMetin(anlam?.tip).toLocaleLowerCase('tr');
  const metin = brailleMetinBirlesikAl(anlam);

  return (
    kaynak === 'key-signature-change' ||
    kaynak === 'time-signature-change' ||
    tip === 'keysignaturechange' ||
    tip === 'timesignaturechange' ||
    metin.includes('donanım değişimi') ||
    metin.includes('donanim değişimi') ||
    metin.includes('key signature change') ||
    metin.includes('zaman değişimi') ||
    metin.includes('time signature change')
  );
}

export function brailleAnlamTekBasinaOlcuMu(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);

  return (
    metin.includes('bar repeat') ||
    metin.includes('measure repeat') ||
    metin.includes('ölçü tekrar') ||
    metin.includes('olcu tekrar') ||
    metin.includes('önceki ölçüyle aynı') ||
    metin.includes('onceki olcuyle ayni') ||
    metin.includes('same as previous measure')
  );
}

export function brailleAnlamOlcuNumarasiMi(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);

  return (
    metin.includes('ölçü numarası') ||
    metin.includes('olcu numarası') ||
    metin.includes('measure number') ||
    metin.includes('satır başı') ||
    metin.includes('satir basi')
  );
}

export const brailleHucreBosMu = (hucre) => (
  Array.isArray(hucre) && hucre.length === 0
);

export function brailleAnlamAnahtarMi(anlam) {
  const metin = brailleMetinBirlesikAl(anlam);

  return (
    metin.includes('anahtar') ||
    metin.includes('clef') ||
    metin.includes('𝄞') ||
    metin.includes('𝄢') ||
    metin.includes('𝄡') ||
    metin.includes('sol anahtarı') ||
    metin.includes('sol anahtari') ||
    metin.includes('fa anahtarı') ||
    metin.includes('fa anahtari') ||
    metin.includes('do anahtarı') ||
    metin.includes('do anahtari')
  );
}

export function brailleAnlamHeaderBilgisiMi(anlam) {
  if (brailleAnlamInlineDegisimMi(anlam)) {
    return false;
  }

  const metin = brailleMetinBirlesikAl(anlam);

  return (
    brailleAnlamAnahtarMi(anlam) ||
    metin.includes('donanım') ||
    metin.includes('donanim') ||
    metin.includes('key signature') ||
    metin.includes('zaman imzası') ||
    metin.includes('zaman imzasi') ||
    metin.includes('time signature') ||
    metin.includes('tempo') ||
    metin.includes('başlık') ||
    metin.includes('baslik') ||
    metin.includes('besteci') ||
    metin.includes('composer') ||
    metin.includes('header')
  );
}

export function brailleAnlamOlcuIciGecerliMi(anlam) {
  if (!anlam) return true;

  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');
  if ([
    'tie',
    'slur',
    'slur-start',
    'slur-end',
    'double-slur-start',
    'double-slur-end',
    'bracket-slur-start',
    'bracket-slur-end',
  ].includes(kaynak)) {
    return true;
  }

  if (brailleAnlamInlineDegisimMi(anlam)) {
    return true;
  }

  if (brailleAnlamHeaderBilgisiMi(anlam)) return false;
  if (brailleAnlamAnahtarMi(anlam)) return false;
  return true;
}

// Nota sekmesindeki ölçü altı braille gösteriminde yalnızca normal ölçü
// ayıracı gizlenir. Tekrar/röpriz, final, sectional ve volta gibi BRF'te
// gerçek hücre üreten özel işaretler görünür kalmalıdır.
export function brailleAnlamOlcuCizgisiMi(anlam, hucre = null) {
  const metin = brailleMetinBirlesikAl(anlam);
  const etiket = brailleTemizMetin(anlam?.etiket);
  const baslik = brailleTemizMetin(anlam?.baslik);

  if (brailleAnlamTekrarMi(anlam)) {
    return false;
  }

  if (
    metin.includes('ölçü numarası') ||
    metin.includes('olcu numarası') ||
    metin.includes('satır başı') ||
    metin.includes('satir basi') ||
    metin.includes('zaman') ||
    metin.includes('pay') ||
    metin.includes('payda')
  ) {
    return false;
  }

  // Normal barline BRF'te boş hücre/ölçü boşluğu gibi gelir. Bunu ölçü
  // kutusunun sınırı temsil ettiği için gizliyoruz.
  if (brailleHucreBosMu(hucre)) {
    return (
      etiket === '|' ||
      baslik === '|' ||
      metin.includes('normal ölçü') ||
      metin.includes('normal olcu') ||
      metin.includes('ölçü çizgisi') ||
      metin.includes('olcu çizgisi') ||
      metin.includes('olcu cizgisi') ||
      metin.includes('barline') ||
      metin.includes('measure')
    );
  }

  // Hücre boş değilse BRF'te yazılması gereken anlamlı bir işarettir.
  // Özellikle repeat/final/sectional gibi hücreleri burada silmiyoruz.
  return false;
}

export function brailleAnlamOlcuSiniriMi(anlam, hucre = null) {
  const metin = brailleMetinBirlesikAl(anlam);
  const etiket = brailleTemizMetin(anlam?.etiket);
  const baslik = brailleTemizMetin(anlam?.baslik);
  const dogrudan = brailleAnlamMetni(anlam);

  if (brailleAnlamBeginRepeatMi(anlam)) {
    return false;
  }

  if (brailleAnlamEndRepeatMi(anlam)) {
    return true;
  }

  if (
    metin.includes('ölçü numarası') ||
    metin.includes('olcu numarası') ||
    metin.includes('satır başı') ||
    metin.includes('satir basi') ||
    metin.includes('zaman') ||
    metin.includes('pay') ||
    metin.includes('payda')
  ) {
    return false;
  }

  return (
    etiket === '|' ||
    baslik === '|' ||
    dogrudan === '|' ||
    dogrudan === '||' ||
    dogrudan === ':|' ||
    dogrudan === '|:' ||
    brailleAnlamEndRepeatMi(anlam) ||
    metin.includes('bitiş çizgisi') ||
    metin.includes('son çizgi') ||
    metin.includes('bölüm sonu') ||
    metin.includes('sectional') ||
    metin.includes('final') ||
    metin.includes('normal ölçü') ||
    metin.includes('normal olcu') ||
    metin.includes('ölçü çizgisi') ||
    metin.includes('olcu çizgisi') ||
    metin.includes('olcu cizgisi') ||
    metin.includes('barline') ||
    metin.includes('measure') ||
    brailleHucreBosMu(hucre)
  );
}

export function brailleAnlamOlcuIciIcerikMi(anlam) {
  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');
  if ([
    'tie',
    'slur',
    'slur-start',
    'slur-end',
    'double-slur-start',
    'double-slur-end',
    'bracket-slur-start',
    'bracket-slur-end',
  ].includes(kaynak)) return true;

  const kategori = brailleKategoriAl(anlam);
  const metin = brailleMetinBirlesikAl(anlam);

  if (brailleAnlamInlineDegisimMi(anlam)) return true;
  if (brailleAnlamTekrarMi(anlam)) return true;

  if (
    kategori === 'nota' ||
    kategori === 'sus' ||
    kategori === 'bag' ||
    kategori === 'artikulasyon' ||
    kategori === 'donanim' ||
    kategori === 'zaman-imzasi'
  ) {
    return true;
  }

  if (metin.includes('dinamik') || metin.includes('nüans') || metin.includes('ornament')) return true;

  return false;
}

export function brailleHucreleriBol(olcu) {
  const normalHucreler = [];
  const olcuCizgisiHucreleri = [];

  (olcu.hucreler || []).forEach((hucre, i) => {
    const anlam = olcu.anlamlar?.[i];

    const item = {
      hucre,
      anlam,
      index: i,
    };

    if (brailleAnlamOlcuCizgisiMi(anlam, hucre)) {
      olcuCizgisiHucreleri.push(item);
    } else {
      normalHucreler.push(item);
    }
  });

  return {
    normalHucreler,
    olcuCizgisiHucreleri,
  };
}

export function brailleLejantOgesiEkle(map, anlam, hucre = null) {
  if (!anlam) return;
  if (brailleAnlamNotaMi(anlam)) return;

  const etiket = brailleLejantEtiketiAl(anlam);
  if (!etiket) return;

  const kategori = brailleKategoriAl(anlam);
  const etiketKucuk = etiket.toLocaleLowerCase('tr');
  if (kategori === 'nota' && /^(do|re|mi|fa|sol|la|si)\b/u.test(etiketKucuk)) return;

  const key = brailleLejantKeyAl(anlam);

  if (!map.has(key)) {
    map.set(key, {
      key,
      kategori,
      etiket,
      stil: brailleRenkAl(anlam),
    });
  }
}

export function brailleLejantlariOlustur(items = []) {
  const map = new Map();

  (items || []).forEach((item) => {
    brailleLejantOgesiEkle(map, item?.anlam, item?.hucre);
  });

  return Array.from(map.values());
}

export function brailleLejantListeleriniBirlestir(...listeler) {
  const map = new Map();

  listeler.flat().filter(Boolean).forEach((item) => {
    if (!map.has(item.key)) {
      map.set(item.key, item);
    }
  });

  return Array.from(map.values());
}

export function brailleOlcuBasindakiHeaderlariKirp(hucreler, anlamlar) {
  const temizHucreler = [];
  const temizAnlamlar = [];

  let icerikBasladi = false;

  for (let i = 0; i < (hucreler || []).length; i += 1) {
    const anlam = anlamlar?.[i];

    if (!icerikBasladi) {
      if (!brailleAnlamOlcuIciGecerliMi(anlam)) {
        continue;
      }
      icerikBasladi = true;
    }

    temizHucreler.push(hucreler[i]);
    temizAnlamlar.push(anlam);
  }

  return {
    hucreler: temizHucreler,
    anlamlar: temizAnlamlar,
  };
}

// Başlangıç bilgisi (anahtar + varsa tempo/donanım/zaman) yeşil kutuda
// gösterilir. Bu yüzden ilk ölçü kutusunun içinde tekrar görünmemelidir;
// ilk beyaz ölçü kutusu yalnızca 1. ölçünün gerçek hücrelerini taşır.
export function brailleIlkOlcudenBaslangicBilgileriniCikar(hucreler, anlamlar) {
  const temizHucreler = [];
  const temizAnlamlar = [];

  (hucreler || []).forEach((hucre, i) => {
    const anlam = anlamlar?.[i];

    if (
      brailleAnlamAnahtarMi(anlam) ||
      brailleAnlamHeaderBilgisiMi(anlam) ||
      brailleAnlamOlcuNumarasiMi(anlam)
    ) {
      return;
    }

    temizHucreler.push(hucre);
    temizAnlamlar.push(anlam);
  });

  return {
    hucreler: temizHucreler,
    anlamlar: temizAnlamlar,
  };
}

export function brailleGlobalOlcuHedefIndexAl(globalOlcu) {
  for (const item of (globalOlcu || [])) {
    const metin = brailleMetinBirlesikAl(item?.anlam);

    if (!brailleAnlamTekBasinaOlcuMu(item?.anlam)) {
      continue;
    }

    const eslesme = metin.match(/(?:ölçü|olcu|measure)\s*(\d+)\s*:/iu);
    if (eslesme) {
      const no = parseInt(eslesme[1], 10);
      if (Number.isFinite(no) && no > 0) {
        return no - 1;
      }
    }
  }

  return null;
}

export function brailleGlobalOlcuAtamalariniHazirla(globalOlculer) {
  const explicitMap = new Map();
  const siraliOlculer = [];

  (globalOlculer || []).forEach((globalOlcu) => {
    const hedefIndex = brailleGlobalOlcuHedefIndexAl(globalOlcu);

    if (Number.isFinite(hedefIndex)) {
      explicitMap.set(hedefIndex, globalOlcu);
    } else {
      siraliOlculer.push(globalOlcu);
    }
  });

  return { explicitMap, siraliOlculer };
}
