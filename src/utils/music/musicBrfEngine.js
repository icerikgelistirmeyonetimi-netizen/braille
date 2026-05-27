// Modül 8 — BRF üretici motoru
// Bütün diğer engine'leri orchestrate eder.
import { muzikAccidentalHucreleri } from './musicKeySignatureEngine.js';
import { muzikOktavGerekliMi, muzikOktavHucresi } from './musicOctaveEngine.js';
import { muzikGruplariTespit, muzikNotaSadePitchHucresi } from './musicGroupingEngine.js';
import { muzikOlcuyeBol, muzikLayoutSatirlari } from './musicMeasureEngine.js';
import {
  muzikAutoBarRepeatHaritasi,
  muzikRepeatAdaylariniBul,
  muzikBarNumberHucreleri,
} from './musicRepeatEngine.js';
import { muzikHeaderSatirlariUret } from './musicHeaderEngine.js';
import { MUZIK_BAGLAR } from '../../data/muzik.js';

// Modül 8 Bölüm 4A — Bir notadan ÖNCE gelen işaretlerin kesin sırası (1-10)
export function muzikModifierOncesiSira(kayit) {
  const ad = String(kayit.ad || '').toLowerCase();
  const tip = String(kayit.gorselTip || '');
  if (/forward|ileri.*tekrar/.test(ad)) return 1;
  if (/volta|\bev\b|dolap/.test(ad)) return 2;
  if (tip === 'bag' && /(açılış|aç\b|köşeli.*aç|opening)/.test(ad)) return 3;
  if (tip === 'dinamik' || tip === 'hairpin') return 4;
  if (tip === 'tuplet' || /üçleme|leme|tuplet/.test(ad)) return 5;
  if (tip === 'susleme') return 7;
  if (tip === 'nuans') return 8;
  if (tip === 'degistirici' || tip === 'donanim') return 9;
  if (tip === 'oktav') return 10;
  return 6;
}

// Modül 8 Bölüm 4B — Bir notadan SONRA gelen işaretlerin kesin sırası
export function muzikModifierSonrasiSira(kayit) {
  const ad = String(kayit.ad || '').toLowerCase();
  const tip = String(kayit.gorselTip || '');
  if (/fermata/.test(ad)) return 2;
  if (tip === 'bag' && /(kapanış|kapa\b|köşeli.*kapa|closing)/.test(ad)) return 4;
  if (tip === 'bag' && /(tie|^bağ\b)/.test(ad)) return 5;
  if (tip === 'bag') return 3;
  if (tip === 'hairpin' && /(bitir|terminator|son)/.test(ad)) return 6;
  if (/nefes|kesme|caesura|break|breath/.test(ad)) return 7;
  if (/backward|geri/.test(ad)) return 8;
  return 9;
}

export function muzikSkorunuBrailleyeCevir(ogeler, baglar = [], header = null, tupletler = [], options = {}) {
  const includeBarNumbers = options?.includeBarNumbers === true
    || header?.includeBarNumbers === true
    || header?.formatting?.includeBarNumbers === true
    || header?.layout?.includeBarNumbers === true;

  const useBrailleGrouping = Boolean(options?.useBrailleGrouping);
  const strictDurationCells = options?.strictDurationCells !== false;

  if (options?.debug) {
    console.log('BRF EXPORT MODE', {
      useBrailleGrouping,
      strictDurationCells,
      grupPitchOnlyAktifMi: useBrailleGrouping && !strictDurationCells,
    });
  }

  function brfImportArtikOgesiMi(oge) {
    const tip = String(oge?.tip || '').toLowerCase();
    const ad = String(oge?.ad || '').toLowerCase();
    const kaynakType = String(oge?.kaynakToken?.type || '').toLowerCase();

    return (
      kaynakType === 'unknown'
      || kaynakType === 'layoutmarker'
      || kaynakType === 'layoutspace'
      || kaynakType === 'measureseparator'
      || (
        tip === 'isaret'
        && (
          ad.includes('çözümlenemeyen')
          || ad.includes('layout')
          || ad.includes('yardımcı')
        )
      )
    );
  }

  function brfMetaKaynakAl(oge, grupPitchOnly = false) {
    if (!oge) return 'sign';

    if (oge.tip === 'nota') {
      return grupPitchOnly ? 'note-pitch' : 'note';
    }

    if (oge.tip === 'sus') {
      return 'rest';
    }

    const tip = String(oge.tip || oge.type || oge.kind || '').toLowerCase();
    const ad = String(oge.ad || oge.gorunum || oge.label || '').toLocaleLowerCase('tr');
    const gorunum = String(oge.gorunum || '');

    if (
      tip === 'beginrepeat' ||
      tip === 'begin-repeat' ||
      tip === 'startrepeat' ||
      gorunum === '𝄆' ||
      ad.includes('başlangıç tekrar') ||
      ad.includes('baslangic tekrar') ||
      ad.includes('begin repeat') ||
      ad.includes('start repeat')
    ) {
      return 'beginRepeat';
    }

    if (
      tip === 'endrepeat' ||
      tip === 'end-repeat' ||
      tip === 'repeatend' ||
      gorunum === '𝄇' ||
      ad.includes('bitiş tekrar') ||
      ad.includes('bitis tekrar') ||
      ad.includes('end repeat')
    ) {
      return 'endRepeat';
    }

    if (
      tip === 'finalbarline' ||
      tip === 'final-barline' ||
      gorunum === '𝄂' ||
      ad.includes('bitiş çizgisi') ||
      ad.includes('final')
    ) {
      return 'finalBarline';
    }

    if (
      tip === 'sectionalbarline' ||
      tip === 'sectional-barline' ||
      ad.includes('bölüm') ||
      ad.includes('sectional')
    ) {
      return 'sectionalBarline';
    }

    if (tip === 'barline') {
      return 'barline';
    }

    return 'sign';
  }

  const tupletNotaIdMap = new Map();
  for (const t of (tupletler || [])) {
    (t.notaIdler || []).forEach((id, i) => {
      tupletNotaIdMap.set(id, { tuplet: t, ilkMi: i === 0 });
    });
  }

  const hucreler = [];
  const esleme = [];
  const hucreMeta = [];
  const kaynakParcalar = [];
  let kaynakIndeksi = 0;
  const metaEkle = (info) => { hucreMeta.push(info); };

  // Audit Aşama 2 — Header satırları (title / composer / tempo+key+time)
  // Kompakt döndürülür; gerçek 40-hücre ortalama UI tarafında veya kağıt
  // çıktısında muzikHeaderSatirOrtali ile yapılır. Body grid'e dahil edilmez.
  const headerSatirlari = header ? muzikHeaderSatirlariUret(header) : [];
  if (headerSatirlari.length) {
    kaynakParcalar.push(`[header:${headerSatirlari.map((s) => s.kaynak).join('/')}]`);
    kaynakIndeksi += 1;
  }

    const notaIdSirasi = (ogeler || [])
      .filter((oge) => oge?.tip === 'nota')
      .map((oge) => oge.id);

    const bagNotaIdleriAl = (bag) => {
      const basId = bag?.basId || bag?.notaIdler?.[0];
      const sonId = bag?.sonId || bag?.notaIdler?.[bag?.notaIdler?.length - 1];

      if (!basId || !sonId) {
        return Array.isArray(bag?.notaIdler) ? bag.notaIdler.filter(Boolean) : [];
      }

      const basIdx = notaIdSirasi.indexOf(basId);
      const sonIdx = notaIdSirasi.indexOf(sonId);

      if (basIdx < 0 || sonIdx < 0) {
        return Array.isArray(bag?.notaIdler) ? bag.notaIdler.filter(Boolean) : [basId, sonId];
      }

      const min = Math.min(basIdx, sonIdx);
      const max = Math.max(basIdx, sonIdx);

      return notaIdSirasi.slice(min, max + 1);
    };

  const modHucrelerEkle = (modListesi, ogeId, yon) => {
    for (const mod of modListesi || []) {
      const kayit = mod.kayit;
      if (!kayit || !Array.isArray(kayit.hucreler)) continue;
      const etiket = kayit.gorunum || kayit.ad || '·';
      if (kaynakParcalar.length) kaynakIndeksi += 1;
      kaynakParcalar.push(etiket);
      for (const hucre of kayit.hucreler) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId, kaynak: `modifier-${yon}`, etiket: kayit.ad });
      }
      kaynakIndeksi += etiket.length;
    }
  };

  const bagTieMi = (bag) => {
    const tip = String(bag?.tip || bag?.kayit?.tip || bag?.kayit?.id || '').toLowerCase();
    const ad = String(bag?.kayit?.ad || bag?.ad || '').toLowerCase();
    return tip === 'tie' || /tie|uzatma/.test(ad);
  };

  const bagSlurMi = (bag) => {
    const tip = String(bag?.tip || bag?.kayit?.tip || bag?.kayit?.id || '').toLowerCase();
    const ad = String(bag?.kayit?.ad || bag?.ad || '').toLowerCase();
    return tip === 'slur' || /slur|legato|ifade bağı|ifade bagi/.test(ad);
  };

  const bagBaslangiclariAl = (notaId, muzikBaglar = []) => (
    muzikBaglar.filter((bag) => bag.basId === notaId || bag.notaIdler?.[0] === notaId)
  );

  const bagBitisleriAl = (notaId, muzikBaglar = []) => (
    muzikBaglar.filter((bag) => bag.sonId === notaId || bag.notaIdler?.[bag.notaIdler.length - 1] === notaId)
  );

  const bagModeAl = (bag) => (
    bag?.mode
    || bag?.kayit?.mode
    || 'single'
  );

  const slurModeOtomatikAl = (bag, ids = []) => {
    const explicitMode =
      bag?.mode
      || bag?.kayit?.mode
      || bag?.slurMode;

    if (explicitMode === 'single' || explicitMode === 'double-for-long') {
      if (explicitMode === 'double-for-long' && Array.isArray(ids) && ids.length < 4) {
        return 'single';
      }
      return explicitMode;
    }

    if (Array.isArray(ids) && ids.length >= 4) {
      return 'double-for-long';
    }

    return 'single';
  };

  const bagKayitBul = (regex) => (
    (MUZIK_BAGLAR || []).find((k) => regex.test(String(k?.ad || ''))) || null
  );

  const bagHucrePaketleriAl = (bag) => {
    const mode = String(bagModeAl(bag) || 'single').toLowerCase();

    const kayitHucreleri = Array.isArray(bag?.kayit?.hucreler)
      ? bag.kayit.hucreler
      : (Array.isArray(bag?.hucreler) ? bag.hucreler : null);

    if (bagTieMi(bag)) {
      return {
        startHucreleri: kayitHucreleri,
        endHucreleri: null,
      };
    }

    if (mode === 'bracket') {
      const acKayit = bagKayitBul(/köşeli\s*slur\s*\(aç\)|bracket\s*slur\s*\(aç\)|bracket\s*slur\s*start/i);
      const kapaKayit = bagKayitBul(/köşeli\s*slur\s*\(kapa\)|bracket\s*slur\s*\(kapa\)|bracket\s*slur\s*end/i);

      return {
        startHucreleri: Array.isArray(acKayit?.hucreler) ? acKayit.hucreler : kayitHucreleri,
        endHucreleri: Array.isArray(kapaKayit?.hucreler) ? kapaKayit.hucreler : null,
      };
    }

    if (mode === 'double') {
      const doubleKayit = bagKayitBul(/çift\s*slur|double\s*slur/i);
      return {
        startHucreleri: Array.isArray(doubleKayit?.hucreler) ? doubleKayit.hucreler : kayitHucreleri,
        endHucreleri: null,
      };
    }

    // TODO: Single slur bitiş hücresi PDF'ye göre doğrulanacak.
    const singleKayit = bagKayitBul(/slur\s*\(legato\)|single\s*slur/i);
    return {
      startHucreleri: Array.isArray(singleKayit?.hucreler) ? singleKayit.hucreler : kayitHucreleri,
      endHucreleri: null,
    };
  };

  const bagHucreleriAl = (bag) => {
    const hucrePaketi = bagHucrePaketleriAl(bag);
    return hucrePaketi.startHucreleri;
  };

  const bagKaynakBilgisiAl = (bag, rol = 'start') => {
    if (bagTieMi(bag)) {
      return {
        kaynak: 'tie',
        etiket: 'Tie / uzatma bağı',
        rol: 'tie',
      };
    }

    const mode = String(bagModeAl(bag) || 'single').toLowerCase();

    if (mode === 'double') {
      return rol === 'end'
        ? { kaynak: 'double-slur-end', etiket: 'Double slur bitiş', rol: 'double-slur-end' }
        : { kaynak: 'double-slur-start', etiket: 'Double slur başlangıç', rol: 'double-slur-start' };
    }

    if (mode === 'bracket') {
      return rol === 'end'
        ? { kaynak: 'bracket-slur-end', etiket: 'Bracket slur bitiş', rol: 'bracket-slur-end' }
        : { kaynak: 'bracket-slur-start', etiket: 'Bracket slur başlangıç', rol: 'bracket-slur-start' };
    }

    return { kaynak: 'slur', etiket: 'Slur / legato bağı', rol: 'slur' };
  };

  const bagHucreleriniYaz = ({ ogeId, hucreListesi, kaynakBilgisi }) => {
    if (!Array.isArray(hucreListesi) || !hucreListesi.length) return;

    const etiket = kaynakBilgisi?.etiket || 'Bağ işareti';
    kaynakIndeksi += 1;
    kaynakParcalar.push(etiket);

    for (const hucre of hucreListesi) {
      hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
      esleme.push(kaynakIndeksi);
      metaEkle({
        ogeId,
        kaynak: kaynakBilgisi?.kaynak || 'bag',
        etiket,
        rol: kaynakBilgisi?.rol || 'bag',
      });
    }

    kaynakIndeksi += etiket.length;
  };

  const olculer = muzikOlcuyeBol(ogeler, header, tupletNotaIdMap);
  const brfLayoutSatirlari = muzikLayoutSatirlari(olculer, 40, 4);

  const ogeIndexToBrailleLine = new Map();
  brfLayoutSatirlari.forEach((satir, satirIdx) => {
    (satir.measures || []).forEach((measure) => {
      (measure.indices || []).forEach((ogeIndex) => {
        ogeIndexToBrailleLine.set(ogeIndex, satirIdx);
      });
    });
  });

  const gruplamaHaritasi = muzikGruplariTespit(
    ogeler,
    header,
    tupletNotaIdMap,
    {
      itemToBrailleLineIndex: (index) => ogeIndexToBrailleLine.get(index) ?? 0,
    },
  );
  const autoRepeatHaritasi = muzikAutoBarRepeatHaritasi(olculer, baglar);

  const notaSonrasiBagHaritasi = new Map();
  const notaOncesiBagHaritasi = new Map();

  const notaSonrasinaBagEkle = (notaId, bagInfo) => {
    if (!notaId) return;

    const mevcut = notaSonrasiBagHaritasi.get(notaId) || [];
    mevcut.push(bagInfo);
    notaSonrasiBagHaritasi.set(notaId, mevcut);
  };

  const notaOncesineBagEkle = (notaId, bagInfo) => {
    if (!notaId) return;

    const mevcut = notaOncesiBagHaritasi.get(notaId) || [];
    mevcut.push(bagInfo);
    notaOncesiBagHaritasi.set(notaId, mevcut);
  };

  for (const bag of (baglar || [])) {
    const ids = bagNotaIdleriAl(bag);
    if (ids.length < 2) continue;

    const mode = String(bagModeAl(bag) || 'single').toLowerCase();
    const hucrePaketi = bagHucrePaketleriAl(bag);
    const hucrelerBag = hucrePaketi.startHucreleri;

    if (!Array.isArray(hucrelerBag) || hucrelerBag.length === 0) {
      continue;
    }

    if (bagTieMi(bag)) {
      ids.slice(0, -1).forEach((notaId) => {
        notaSonrasinaBagEkle(notaId, {
          bag,
          kaynak: 'tie',
          etiket: 'Tie / uzatma bağı',
          rol: 'tie',
          hucreler: hucrelerBag,
        });
      });

      continue;
    }

    if (bagSlurMi(bag)) {
      const ids = bagNotaIdleriAl(bag);
      if (ids.length < 2) continue;

      const mode = slurModeOtomatikAl(bag, ids);
      const singleSlurCells = [[1, 4]];
      const doubleSlurCells = [[1, 4], [1, 4]];
      const longSlur = mode === 'double-for-long' && ids.length >= 4;

      if (longSlur) {
        notaSonrasinaBagEkle(ids[0], {
          bag,
          kaynak: 'double-slur-start',
          etiket: 'Double slur başlangıç',
          rol: 'double-slur-start',
          hucreler: doubleSlurCells,
        });

        notaOncesineBagEkle(ids[ids.length - 1], {
          bag,
          kaynak: 'slur-before-last',
          etiket: 'Slur bitiş işareti / son notadan önce',
          rol: 'slur-before-last',
          hucreler: singleSlurCells,
        });
      } else {
        ids.slice(0, -1).forEach((notaId) => {
          notaSonrasinaBagEkle(notaId, {
            bag,
            kaynak: 'slur',
            etiket: 'Single slur / dots 1-4',
            rol: 'single-slur-after',
            hucreler: singleSlurCells,
          });
        });
      }

      continue;
    }
  }

  const notaSonrasiBagHucreleriEkle = (notaId) => {
    const bagListesi = notaSonrasiBagHaritasi.get(notaId) || [];

    for (const bagInfo of bagListesi) {
      if (!Array.isArray(bagInfo.hucreler)) continue;

      if (kaynakParcalar.length) kaynakIndeksi += 1;
      const bagKaynak = bagInfo.kaynak === 'tie' ? 'tie' : bagInfo.kaynak;
      kaynakParcalar.push(bagKaynak);

      for (const hucre of bagInfo.hucreler) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({
          ogeId: notaId,
          kaynak: bagInfo.kaynak,
          etiket: bagInfo.etiket,
          rol: bagInfo.rol,
          bagId: bagInfo.bag?.id,
        });
      }

      kaynakIndeksi += bagKaynak.length;
    }
  };

  const notaOncesiBagHucreleriEkle = (notaId) => {
    const bagListesi = notaOncesiBagHaritasi.get(notaId) || [];

    for (const bagInfo of bagListesi) {
      if (!Array.isArray(bagInfo.hucreler)) continue;

      if (kaynakParcalar.length) kaynakIndeksi += 1;
      const bagKaynak = bagInfo.kaynak === 'tie' ? 'tie' : bagInfo.kaynak;
      kaynakParcalar.push(bagKaynak);

      for (const hucre of bagInfo.hucreler) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({
          ogeId: notaId,
          kaynak: bagInfo.kaynak,
          etiket: bagInfo.etiket,
          rol: bagInfo.rol,
          bagId: bagInfo.bag?.id,
        });
      }

      kaynakIndeksi += bagKaynak.length;
    }
  };

  const ogeOlcuIndeksi = new Map();
  for (let oi = 0; oi < olculer.length; oi++) {
    for (const idx of olculer[oi].indices) ogeOlcuIndeksi.set(idx, oi);
  }
  const atlananIndeksler = new Set();
  for (const [oi] of autoRepeatHaritasi) {
    for (const idx of (olculer[oi]?.indices || [])) atlananIndeksler.add(idx);
  }

  let sonNota = null;
  let yeniBrailleSatiriBayragi = false;
  let timeKeyDegisimiBayragi = false;
  let sectionalBarlineBayragi = false;
  let yazilanOlculer = new Set();

  for (let idx = 0; idx < ogeler.length; idx++) {
    const oge = ogeler[idx];
    const olcuIdx = ogeOlcuIndeksi.get(idx);

    if (olcuIdx !== undefined && olculer[olcuIdx].indices[0] === idx && !yazilanOlculer.has(olcuIdx)) {
      yazilanOlculer.add(olcuIdx);
      const olcu = olculer[olcuIdx];
      const yeniSatir = !!olcu.startsNewBrailleLine;
      if (yeniSatir && !autoRepeatHaritasi.get(olcuIdx)) {
        yeniBrailleSatiriBayragi = true;
        if (includeBarNumbers) {
          const barNo = header?.pickupMeasure ? olcuIdx : olcuIdx + 1;
          const barNoHucreleri = muzikBarNumberHucreleri(barNo);
          if (barNoHucreleri.length) {
            if (kaynakParcalar.length) kaynakIndeksi += 1;
            kaynakParcalar.push(`#${barNo}`);
            for (const h of barNoHucreleri) {
              hucreler.push([...h]);
              esleme.push(kaynakIndeksi);
              metaEkle({ ogeId: null, kaynak: 'bar-number', etiket: `${barNo}. ölçü numarası (satır başı)` });
            }
            kaynakIndeksi += String(barNo).length;
          }
        }
      }
      if (autoRepeatHaritasi.get(olcuIdx)) {
        if (kaynakParcalar.length) kaynakIndeksi += 1;
        kaynakParcalar.push('𝄎');
        hucreler.push([2, 3, 5, 6]);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: null, kaynak: 'bar-repeat', etiket: `Ölçü ${olcuIdx + 1}: bar repeat (önceki ölçüyle aynı)` });
        kaynakIndeksi += 1;
        timeKeyDegisimiBayragi = true;
      }
    }
    if (atlananIndeksler.has(idx)) continue;
    if (brfImportArtikOgesiMi(oge)) continue;

    if (oge.tip === 'timeSignatureChange') {
      const etiket = oge.gorunum || oge.ad || 'zaman değişimi';
      if (kaynakParcalar.length) kaynakIndeksi += 1;
      kaynakParcalar.push(etiket);

      const ogeHucreleri = Array.isArray(oge.hucreler) && oge.hucreler.length ? oge.hucreler : [];
      for (const hucre of ogeHucreleri) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({
          ogeId: oge.id,
          kaynak: 'time-signature-change',
          etiket: `Zaman değişimi: ${etiket}`,
        });
      }
      timeKeyDegisimiBayragi = true;
      kaynakIndeksi += etiket.length;
      continue;
    }

    if (oge.tip === 'keySignatureChange') {
      if (kaynakParcalar.length) kaynakIndeksi += 1;

      const etiket = oge.gorunum || oge.ad || 'donanım değişimi';
      kaynakParcalar.push(etiket);

      const ogeHucreleri = Array.isArray(oge.hucreler) && oge.hucreler.length
        ? oge.hucreler
        : [];

      for (const hucre of ogeHucreleri) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({
          ogeId: oge.id,
          kaynak: 'key-signature-change',
          etiket: `Donanım değişimi: ${etiket}`,
        });
      }

      // PDF kuralı: donanım/zaman değişiminden sonraki ilk nota oktav alır.
      timeKeyDegisimiBayragi = true;

      kaynakIndeksi += etiket.length;
      continue;
    }

    if (oge.tip === 'nota') {
      const oncesiSirali = (Array.isArray(oge.modifiers?.oncesi) ? oge.modifiers.oncesi : [])
        .slice()
        .sort((a, b) => muzikModifierOncesiSira(a.kayit) - muzikModifierOncesiSira(b.kayit));
      modHucrelerEkle(oncesiSirali, oge.id, 'oncesi');
      notaOncesiBagHucreleriEkle(oge.id);
    }

    const etiket = oge.gorunum || oge.ad || '♪';
    if (kaynakParcalar.length) kaynakIndeksi += 1;
    kaynakParcalar.push(etiket);
    const grupBilgisi = oge.tip === 'nota' ? gruplamaHaritasi.get(idx) : null;

    if (oge.tip === 'nota') {
      const tupletInfo = tupletNotaIdMap.get(oge.id);
      if (tupletInfo && tupletInfo.ilkMi && tupletInfo.tuplet.kayit?.hucreler) {
        for (const h of tupletInfo.tuplet.kayit.hucreler) {
          hucreler.push([...h]);
          esleme.push(kaynakIndeksi);
          metaEkle({ ogeId: oge.id, kaynak: 'tuplet', etiket: tupletInfo.tuplet.kayit.ad });
        }
      }
      const accHucreleri = muzikAccidentalHucreleri(oge.accidental);
      for (const h of accHucreleri) {
        hucreler.push([...h]);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: oge.id, kaynak: 'accidental', etiket: `aksidental: ${oge.accidental}` });
      }
      const ilkNotaMi = !sonNota;
      const ctx = {
        ilkNota: ilkNotaMi,
        yeniBrailleSatiri: yeniBrailleSatiriBayragi,
        timeKeyDegisimiSonrasi: timeKeyDegisimiBayragi,
        sectionalDoubleBarlineSonrasi: sectionalBarlineBayragi,
      };
      if (muzikOktavGerekliMi(sonNota, oge, ctx)) {
        const oktHucre = muzikOktavHucresi(oge.oktav);
        hucreler.push([...oktHucre]);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: oge.id, kaynak: 'octave', etiket: `${oge.oktav}. oktav işareti` });
      }
      yeniBrailleSatiriBayragi = false;
      timeKeyDegisimiBayragi = false;
      sectionalBarlineBayragi = false;
      sonNota = oge;
    }

    const grupPitchOnly =
      useBrailleGrouping &&
      !strictDurationCells &&
      grupBilgisi &&
      grupBilgisi.konum > 0;
    const ogeHucreleri = grupPitchOnly
      ? [muzikNotaSadePitchHucresi(oge.notaAd)]
      : (Array.isArray(oge.hucreler) && oge.hucreler.length ? oge.hucreler : [[]]);
    const kaynak = brfMetaKaynakAl(oge, grupPitchOnly);
    const ogeHucreSayisi = Array.isArray(ogeHucreleri) ? ogeHucreleri.length : 0;

    for (let hucreIdx = 0; hucreIdx < ogeHucreleri.length; hucreIdx += 1) {
      const hucre = ogeHucreleri[hucreIdx];
      hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
      esleme.push(kaynakIndeksi);
      metaEkle({
        ogeId: oge.id,
        ogeTip: oge.tip,
        kaynak,
        tip: oge.tip,
        etiket,
        gorunum: oge.gorunum || '',
        hucreSira: hucreIdx,
        hucreSayisi: ogeHucreSayisi,
        repeatParcasi: kaynak === 'beginRepeat' || kaynak === 'endRepeat',
        repeatIlkHucre: (kaynak === 'beginRepeat' || kaynak === 'endRepeat') && hucreIdx === 0,
        repeatSonHucre: (kaynak === 'beginRepeat' || kaynak === 'endRepeat') && hucreIdx === ogeHucreSayisi - 1,
      });
    }

    if (oge.tip === 'nota' && oge.dotted) {
      hucreler.push([3]);
      esleme.push(kaynakIndeksi);
      metaEkle({
        ogeId: oge.id,
        ogeTip: oge.tip,
        kaynak: 'dot',
        etiket: 'noktalı uzatma (1,5×)',
        dottedFor: oge.id,
      });
    }

    if (oge.tip === 'nota') {
      notaSonrasiBagHucreleriEkle(oge.id);
    }

    if (oge.tip !== 'nota' && oge.tip !== 'sus') {
      const t = oge.tip;
      const adLower = String(oge.ad || '').toLowerCase();
      if (t === 'sectionalBarline' || /sectional|bölüm sonu/.test(adLower)) {
        sectionalBarlineBayragi = true;
      }
      if (t === 'beginRepeat' || t === 'endRepeat' || t === 'volta1' || t === 'volta2'
          || t === 'brailleRepeat' || t === 'finalBarline'
          || t === 'wordExpression'
          || oge.requiresNextNoteOctave
          || /(zaman imzas|time sig|donanım|key sig|key signature)/.test(adLower)) {
        timeKeyDegisimiBayragi = true;
      }
    }

    kaynakIndeksi += etiket.length;

    if (oge.tip === 'nota') {
      const sonrasiSirali = (Array.isArray(oge.modifiers?.sonrasi) ? oge.modifiers.sonrasi : [])
        .slice()
        .sort((a, b) => muzikModifierSonrasiSira(a.kayit) - muzikModifierSonrasiSira(b.kayit));
      modHucrelerEkle(sonrasiSirali, oge.id, 'sonrasi');
    }

  }

  const repeatOnerileri = muzikRepeatAdaylariniBul(olculer, baglar, autoRepeatHaritasi);
  const olcuUyarilari = olculer.flatMap((m) => (m.warnings || []));
  return {
    hucreler,
    esleme,
    kaynak: kaynakParcalar.join(' '),
    hucreMeta,
    repeatOnerileri,
    olcuUyarilari,
    headerSatirlari,
  };
}

// Modül 8 — Hücre indexinden anlam çıkar (popup/seslendirme için)
export function muzikHucreAnlamiKayittan(ogeler, hucreIndeksi, hucreMeta = null) {
  if (Array.isArray(hucreMeta) && hucreMeta[hucreIndeksi]) {
    const meta = hucreMeta[hucreIndeksi];
    const oge = ogeler.find((o) => o.id === meta.ogeId);
    const ogeAd = oge ? (oge.gorunum || oge.ad || '') : '';
    const baslikMap = {
      'modifier-oncesi': `Modifier (önce): ${meta.etiket}`,
      'modifier-sonrasi': `Modifier (sonra): ${meta.etiket}`,
      accidental: meta.etiket,
      octave: meta.etiket,
      note: ogeAd,
      'note-pitch': `Gruplanmış nota (pitch-only): ${ogeAd}`,
      dot: meta.etiket,
      bag: `Bağ/slur: ${meta.etiket}`,
      tie: `Tie: ${meta.etiket}`,
      slur: `Slur: ${meta.etiket}`,
      slur: 'Slur / legato bağı',
      'slur-start': 'Slur başlangıç',
      'slur-end': 'Slur bitiş',
      'double-slur-start': 'Double slur başlangıç',
      'double-slur-end': 'Double slur bitiş',
      'bracket-slur-start': 'Bracket slur başlangıç',
      'bracket-slur-end': 'Bracket slur bitiş',
      rest: `Sus: ${ogeAd}`,
      sign: ogeAd,
      'bar-number': meta.etiket,
      'bar-repeat': meta.etiket,
      tuplet: `Tuplet: ${meta.etiket}`,
      // Header kaynakları (Modül 8 Bölüm 1)
      title: `Başlık: ${meta.etiket}`,
      composer: `Besteci: ${meta.etiket}`,
      tempo: `Tempo: ${meta.etiket}`,
      'key-signature': `Donanım: ${meta.etiket}`,
      'time-signature': `Zaman imzası: ${meta.etiket}`,
      'time-signature-change': `Zaman değişimi: ${meta.etiket}`,
      'key-signature-change': `Donanım değişimi: ${meta.etiket}`,
      'header-meta': 'Tempo + Donanım + Zaman imzası',
      header: 'Header',
      spacer: 'Boşluk (ortalama)',
    };
    return {
      tip: meta.kaynak === 'note' || meta.kaynak === 'note-pitch' ? 'muzik' : 'isaret',
      baslik: baslikMap[meta.kaynak] || `Müzik: ${ogeAd}`,
      detay: oge?.aciklama || '',
      noktaStr: '',
      etiket: (meta.kaynak === 'note' || meta.kaynak === 'note-pitch') ? ogeAd : (meta.etiket || ogeAd),
      kaynak: meta.kaynak,
    };
  }
  let cursor = 0;
  for (const oge of ogeler) {
    const ogeHucreleri = Array.isArray(oge.hucreler) && oge.hucreler.length ? oge.hucreler : [[]];
    if (hucreIndeksi >= cursor && hucreIndeksi < cursor + ogeHucreleri.length) {
      const hucre = ogeHucreleri[hucreIndeksi - cursor] || [];
      return {
        tip: oge.tip === 'nota' ? 'muzik' : 'isaret',
        baslik: `Müzik: ${oge.ad}`,
        detay: oge.aciklama || (oge.kurallar || []).join(' '),
        noktaStr: hucre.length ? hucre.join(' · ') : 'boş hücre',
        etiket: oge.gorunum || oge.ad || '♪',
      };
    }
    cursor += ogeHucreleri.length;
  }
  return null;
}
