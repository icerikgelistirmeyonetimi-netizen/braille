import {
  buildNoteCellCandidateMap,
  buildRestCellCandidateMap,
} from './import/musicBrailleNoteRegistry.js';
import {
  UPPER_NUMBER_BY_KEY,
  LOWER_NUMBER_BY_KEY,
  OCTAVE_BY_CELL_KEY,
} from './import/musicBrailleSymbolRegistry.js';
import {
  MUZIK_SUSLEMELER,
  MUZIK_NUANS_ONCE,
  MUZIK_NUANS_SONRA,
  MUZIK_DINAMIKLER,
  MUZIK_OLCU_CIZGILERI,
  MUZIK_BAGLAR,
  MUZIK_DUZENSIZ_GRUPLAR,
} from '../../data/muzik.js';

function keyToDash(key = '') {
  return String(key)
    .split('')
    .filter((ch) => /[1-8]/.test(ch))
    .join('-');
}

// Bir hücreyi (dot dizisi) "1-2-6" biçimli dash anahtarına çevirir.
function hucreToDash(hucre) {
  return (Array.isArray(hucre) ? hucre : [])
    .map((d) => String(d))
    .filter((d) => /^[1-8]$/.test(d))
    .join('-');
}

// Süsleme / nüans / dinamik gibi notaya bağlı çok-hücreli
// "modifier" işaretlerini, hücre dizisi → kayıt eşlemesi olarak kurar.
// Export motoru bu işaretleri kayit.hucreler hücreleriyle yazdığı için,
// import sırasında aynı hücre dizilerini tanıyıp modifier olarak geri
// yükleyebilmemiz gerekir.
function buildModifierSequences() {
  const byKey = new Map();
  let maxLen = 1;

  const ekle = (rec, yon, kategori) => {
    if (!rec || !Array.isArray(rec.hucreler) || rec.hucreler.length === 0) return;
    const keys = rec.hucreler.map(hucreToDash);
    if (keys.some((k) => !k)) return; // boş hücreli kayıtları atla
    const seqKey = keys.join('|');
    if (byKey.has(seqKey)) return; // ilk eşleşmeyi koru
    maxLen = Math.max(maxLen, keys.length);
    byKey.set(seqKey, {
      seqKey,
      keys,
      length: keys.length,
      ad: rec.ad,
      gorunum: rec.gorunum || rec.sembol || rec.ad,
      yon,
      kategori,
      // Editör süslemeleri/nüansları kategori alanıyla saklıyor; round-trip için koru.
      // gorselTip alanı muzikModifierOncesiSira/SonrasiSira tarafından sıralama için kullanılır.
      kayit: kategori === 'susleme' ? { ...rec, kategori: 'susleme', gorselTip: 'susleme' }
           : kategori === 'nuans'   ? { ...rec, kategori: 'nuans',   gorselTip: 'nuans'   }
           : kategori === 'dinamik' ? { ...rec, kategori: 'dinamik', gorselTip: 'dinamik' }
           : rec,
    });
  };

  (MUZIK_SUSLEMELER || []).forEach((r) => ekle(r, 'oncesi', 'susleme'));
  (MUZIK_NUANS_ONCE || []).forEach((r) => ekle(r, 'oncesi', 'nuans'));
  (MUZIK_NUANS_SONRA || []).forEach((r) => ekle(r, 'sonrasi', 'nuans'));
  (MUZIK_DINAMIKLER || []).forEach((r) => ekle(r, 'oncesi', 'dinamik'));

  return { byKey, maxLen };
}

// Yapısal çok-hücreli işaretler: voltalar (1./2. dolap), cümle (bracket) bağı, düzensiz
// gruplar (tuplet). Reader bunları KENDİ mantığıyla çözer (bu harita reader'da kullanılmaz);
// Perkins yazım panelinin chord girişinde "bilinmeyen" çıkmasın diye tanınmaları gerekir.
// Anahtar barlineByCellKey ile aynı biçimde: hücre dash'leri '-' ile birleştirilir.
function buildYapiSequences() {
  const byKey = new Map();
  let maxLen = 1;
  const ekle = (rec, tip) => {
    if (!rec || !Array.isArray(rec.hucreler) || rec.hucreler.length === 0) return;
    const dash = rec.hucreler.map(hucreToDash);
    if (dash.some((d) => !d)) return; // boş hücreli (ör. ölçü ayracı) atla
    const key = dash.join('-');
    if (byKey.has(key)) return;
    maxLen = Math.max(maxLen, rec.hucreler.length);
    byKey.set(key, { tip, label: rec.ad, gorunum: rec.gorunum || rec.sembol || rec.ad, kayit: rec });
  };
  (MUZIK_OLCU_CIZGILERI || []).forEach((r) => { if (/dolap/i.test(r.ad || '')) ekle(r, /1/.test(r.ad) ? 'volta1' : 'volta2'); });
  (MUZIK_BAGLAR || []).forEach((r) => { if (/cümle bağı/i.test(r.ad || '')) ekle(r, 'bracketSlur'); });
  (MUZIK_DUZENSIZ_GRUPLAR || []).forEach((r) => ekle(r, 'tuplet'));
  return { byKey, maxLen };
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

  // Etiketler muzik.js (MUZIK_DEGISTIRICI / MUZIK_OLCU_CIZGILERI / MUZIK_BAGLAR) ile aynı terminolojide.
  accidentalByCellKey.set('1-4-6', { accidental: 'sharp', label: 'diyez' });
  accidentalByCellKey.set('1-2-6', { accidental: 'flat', label: 'bemol' });
  accidentalByCellKey.set('1-6', { accidental: 'natural', label: 'naturel' });

  Object.entries(OCTAVE_BY_CELL_KEY).forEach(([cellKey, octave]) => {
    const dashKey = keyToDash(cellKey);
    if (!dashKey) return;
    octaveByCellKey.set(dashKey, Number(octave));
  });

  barlineByCellKey.set('1-2-6-1-3-3', { tip: 'sectionalBarline', label: 'bölüm sonu çift çubuk' });
  barlineByCellKey.set('1-2-6-1-3', { tip: 'finalBarline', label: 'bitiş çizgisi' });
  barlineByCellKey.set('1-2-6-2-3-5-6', { tip: 'beginRepeat', label: 'ileriye doğru tekrar' });
  barlineByCellKey.set('1-2-6-2-3', { tip: 'endRepeat', label: 'geriye doğru tekrar' });
  slurTieByCellKey.set('1-4', { tip: 'slur', label: 'hece bağı' });
  slurTieByCellKey.set('4', { tip: 'tieLead', label: 'uzatma bağı' });

  const { byKey: modifierByCellKey, maxLen: modifierMaxLen } = buildModifierSequences();
  const { byKey: yapiByCellKey, maxLen: yapiMaxLen } = buildYapiSequences();

  return {
    noteByCellKey,
    restByCellKey,
    accidentalByCellKey,
    octaveByCellKey,
    barlineByCellKey,
    slurTieByCellKey,
    modifierByCellKey,
    modifierMaxLen,
    yapiByCellKey,
    yapiMaxLen,
    numberMaps: {
      upper: UPPER_NUMBER_BY_KEY,
      lower: LOWER_NUMBER_BY_KEY,
    },
  };
}
