// Modül 8 Bölüm 5 — Ölçü modeli, otomatik barline, BRF layout
import { MUZIK_SATIR_KAPASITESI } from './musicConstants.js';
import {
  muzikOge16Suresi,
  muzikOlcuAyraciMi,
  muzikBeginRepeatMi,
  muzikEndRepeatMi,
  muzikTimeSigExpected16,
} from './musicDuration.js';

// Bir öğe listesini bar ayraçlarına göre ölçülere böl.
// Her ölçüye expectedDuration16, totalDuration16, warnings ekle.
export function muzikOlcuyeBol(ogeler, header = null, tupletNotaIdMap = null) {
  const expectedDur = header && header.timeSignature
    ? (header.timeSignature.expectedDuration16 ?? null)
    : null;
  const olculer = [];
  const sureTopla = (items) => items.reduce((s, o) => s + muzikOge16Suresi(o, tupletNotaIdMap), 0);
  let aktif = {
    no: 1,
    baslangic: 0,
    items: [],
    indices: [],
    isPickup: Boolean(header?.pickupMeasure),
  };
  for (let i = 0; i < ogeler.length; i++) {
    const oge = ogeler[i];

    if (muzikBeginRepeatMi(oge)) {
      if (aktif.items.length === 0) {
        aktif.items.push(oge);
        aktif.indices.push(i);
        continue;
      }

      aktif.son = i - 1;
      aktif.totalDuration16 = sureTopla(aktif.items);
      aktif.expectedDuration16 = expectedDur;
      aktif.warnings = muzikOlcuUyari(aktif);
      olculer.push(aktif);

      aktif = {
        no: olculer.length + 1,
        baslangic: i,
        items: [oge],
        indices: [i],
        isPickup: false,
      };
      continue;
    }

    if (muzikEndRepeatMi(oge)) {
      aktif.items.push(oge);
      aktif.indices.push(i);

      aktif.son = i;
      aktif.totalDuration16 = sureTopla(aktif.items);
      aktif.expectedDuration16 = expectedDur;
      aktif.warnings = muzikOlcuUyari(aktif);
      olculer.push(aktif);

      aktif = {
        no: olculer.length + 1,
        baslangic: i + 1,
        items: [],
        indices: [],
        isPickup: false,
      };
      continue;
    }

    if (muzikOlcuAyraciMi(oge)) {
      // Volta marker'ları (1. ev / 2. ev) kendi başlarına ayrı bir "phantom
      // ölçü" oluşturmasın — sonraki gerçek ölçünün PREFIX'i olsunlar.
      // Bu sayede braille hücreleri (⠼⠁ / ⠼⠃) doğru ölçünün başında çıkar,
      // ayrıca görsel layout'taki volta-prefix yaklaşımıyla tutarlı kalır.
      if (oge?.tip === 'volta1' || oge?.tip === 'volta2') {
        aktif.items.push(oge);
        aktif.indices.push(i);
        continue;
      }

      aktif.items.push(oge);
      aktif.indices.push(i);

      aktif.son = i;
      aktif.totalDuration16 = sureTopla(aktif.items);
      aktif.expectedDuration16 = expectedDur;
      aktif.warnings = muzikOlcuUyari(aktif);
      olculer.push(aktif);

      aktif = {
        no: olculer.length + 1,
        baslangic: i + 1,
        items: [],
        indices: [],
        isPickup: false,
      };
      continue;
    }

    aktif.items.push(oge);
    aktif.indices.push(i);
  }
  if (aktif.items.length || olculer.length === 0) {
    aktif.son = ogeler.length - 1;
    aktif.totalDuration16 = sureTopla(aktif.items);
    aktif.expectedDuration16 = expectedDur;
    aktif.warnings = muzikOlcuUyari(aktif);
    olculer.push(aktif);
  }
  return olculer;
}

// Modül 8 Bölüm 4 — Time signature'a göre ölçü süre uyarıları
export function muzikOlcuUyari(measure) {
  const warnings = [];
  if (!measure.expectedDuration16) return warnings;
  if (measure.totalDuration16 > measure.expectedDuration16) {
    warnings.push(`Ölçü ${measure.no} fazla süre içeriyor (${measure.totalDuration16}/${measure.expectedDuration16} 16'lık).`);
  } else if (measure.totalDuration16 > 0 && measure.totalDuration16 < measure.expectedDuration16 && !measure.isPickup) {
    warnings.push(`Ölçü ${measure.no} eksik süre içeriyor (${measure.totalDuration16}/${measure.expectedDuration16} 16'lık).`);
  }
  return warnings;
}

// Otomatik ölçü çizgisi: zaman imzasındaki kapasiteye ulaşan ölçüye boş hücre ekle
export function muzikSonAyracIndeksi(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (muzikOlcuAyraciMi(list[i])) return i;
  }
  return -1;
}

export function muzikOtomatikOlcuCizgisiMi(oge) {
  return oge && oge.tip === 'barline' && oge.kind === 'normal' && oge.auto === true;
}

export function muzikManuelOlcuKapatirMi(oge) {
  if (!oge || oge.auto === true) return false;
  if (muzikBeginRepeatMi(oge)) return false;
  if (muzikEndRepeatMi(oge)) return true;

  if (oge.tip === 'barline' && (oge.kind === 'manual' || oge.auto === false)) {
    return true;
  }

  const tip = String(oge.tip || oge.type || oge.kind || '').toLowerCase();
  if (['finalbarline', 'sectionalbarline', 'barlinefinal', 'barlinesectional', 'volta1', 'volta2', 'volta'].includes(tip)) {
    return true;
  }
  const ad = String(oge.ad || oge.gorunum || '').toLowerCase();
  return /final|bitiş|sectional|çift|double|repeat|tekrar|volta|dolap/.test(ad);
}

export function muzikCreateAutoBarline() {
  return {
    id: `auto-bar-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    tip: 'barline',
    kind: 'normal',
    auto: true,
    ad: 'Otomatik ölçü çizgisi',
    gorunum: '|',
    hucreler: [[]],
    aciklama: 'Otomatik ölçü çizgisi (zaman imzasına göre)',
  };
}

export function muzikRebuildAutoBarlines(items, header, tupletNotaIdMap = null) {
  let aktifExpected = header?.timeSignature?.expectedDuration16;
  const result = [];
  const warnings = [];

  const temizItems = items.filter((oge) => !muzikOtomatikOlcuCizgisiMi(oge));
  let currentMeasureValue = 0;

  for (let idx = 0; idx < temizItems.length; idx += 1) {
    const oge = temizItems[idx];
    const nextOge = temizItems[idx + 1];

    if (oge?.tip === 'timeSignatureChange') {
      result.push(oge);

      if (oge.timeSignature?.expectedDuration16) {
        aktifExpected = oge.timeSignature.expectedDuration16;
      }

      currentMeasureValue = 0;
      continue;
    }

    if (oge?.tip === 'keySignatureChange') {
      result.push(oge);
      continue;
    }

    if (muzikBeginRepeatMi(oge)) {
      if (currentMeasureValue > 0) {
        currentMeasureValue = 0;
      }

      result.push(oge);
      continue;
    }

    if (muzikEndRepeatMi(oge)) {
      result.push(oge);
      currentMeasureValue = 0;
      continue;
    }

    if (muzikManuelOlcuKapatirMi(oge)) {
      result.push(oge);
      currentMeasureValue = 0;
      continue;
    }

    result.push(oge);

    const value = muzikOge16Suresi(oge, tupletNotaIdMap);

    if (!aktifExpected || value <= 0) {
      continue;
    }

    currentMeasureValue += value;

    if (Math.abs(currentMeasureValue - aktifExpected) < 0.0001) {
      const nextIsManual = muzikManuelOlcuKapatirMi(nextOge);

      if (!nextIsManual) {
        result.push(muzikCreateAutoBarline());
      }

      currentMeasureValue = 0;
      continue;
    }

    if (currentMeasureValue > aktifExpected) {
      warnings.push({
        type: 'measure-overflow',
        message: `Ölçü süresi aşıldı. Beklenen: ${aktifExpected}, mevcut: ${currentMeasureValue}`,
        itemId: oge.id,
      });
    }
  }

  if (aktifExpected && currentMeasureValue > 0 && currentMeasureValue < aktifExpected) {
    warnings.push({
      type: 'measure-incomplete',
      message: `Son ölçü eksik. Beklenen: ${aktifExpected}, mevcut: ${currentMeasureValue}`,
    });
  }

  return { items: result, warnings };
}

export function muzikOtomatikOlcuCizgisiEkle(list, header, tupletNotaIdMap = null) {
  return muzikRebuildAutoBarlines(list, header, tupletNotaIdMap).items;
}

// Modül 8 Bölüm 4 — BRF Layout: ölçü uzunluğu tahmin et
export function muzikMeasureBRFTahminiUzunluk(measure) {
  let toplam = 0;
  for (const o of measure.items || []) {
    if (o.tip === 'nota') {
      toplam += 1;
      if (o.accidental) toplam += (o.accidental === 'doubleSharp' || o.accidental === 'doubleFlat' ? 2 : 1);
      toplam += 1;
      if (o.dotted) toplam += 1;
      const oncesi = o.modifiers?.oncesi?.length || 0;
      const sonrasi = o.modifiers?.sonrasi?.length || 0;
      toplam += (oncesi + sonrasi) * 1.4;
    } else if (o.tip === 'sus') {
      toplam += 1 + (o.dotted ? 1 : 0);
    } else {
      const h = Array.isArray(o.hucreler) ? o.hucreler.length : 1;
      toplam += Math.max(1, h);
    }
  }
  return Math.ceil(toplam) + 1;
}

export function muzikLayoutSatirlari(olculer, satirdaHucre = 40, barNumberPad = 4) {
  if (!Array.isArray(olculer) || !olculer.length) return [];
  const usableWidth = Math.max(8, satirdaHucre - barNumberPad);
  const satirlar = [];
  let aktif = { measures: [], len: 0 };
  for (const m of olculer) {
    const len = muzikMeasureBRFTahminiUzunluk(m);
    if (aktif.measures.length > 0 && aktif.len + len > usableWidth) {
      satirlar.push(aktif);
      aktif = { measures: [m], len };
    } else {
      aktif.measures.push(m);
      aktif.len += len;
    }
  }
  if (aktif.measures.length) satirlar.push(aktif);
  for (const s of satirlar) {
    if (s.measures[0]) s.measures[0].startsNewBrailleLine = true;
  }
  return satirlar;
}
