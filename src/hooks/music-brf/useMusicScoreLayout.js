import { useMemo } from 'react';
import {
  SVG_KEY_ACCIDENTAL_GAP,
  SVG_AFTER_HEADER_GAP,
  SVG_AUTO_REST_ITEM_GAP,
  SVG_AUTO_REST_MEASURE_WIDTH,
  SVG_DENSE_BEAM_COUNT,
  SVG_DENSE_ITEM_GAP,
  SVG_DENSE_MEASURE_MAX_WIDTH,
  SVG_DENSE_VISIBLE_COUNT,
  SVG_MEASURE_GAP,
  SVG_MEASURE_LEFT_PAD,
  SVG_MEASURE_MAX_WIDTH,
  SVG_MEASURE_MIN_WIDTH,
  SVG_MEASURE_RIGHT_PAD,
  SVG_NOTE_START_X,
  SVG_ROW_RIGHT_PAD,
  SVG_SAG_SINIR_X,
  SVG_SINGLE_ITEM_GAP,
  SVG_NORMAL_ITEM_GAP,
  SVG_STAFF_LEFT_X,
  SVG_STAFF_RIGHT_X,
  SVG_TIME_SIGNATURE_GAP,
  SVG_KEY_SIGNATURE_X,
} from '../../utils/music-brf/musicConstants.js';

const SCORE_LAYOUT_MIN_ITEM_GAP = 32;
const SCORE_LAYOUT_MIN_DENSE_ITEM_GAP = 22;
const SCORE_LAYOUT_MAX_ITEM_GAP = 76;
const SCORE_LAYOUT_ROW_FILL_THRESHOLD = 0.72;
const SCORE_LAYOUT_MEASURE_DISTRIBUTION_POWER = 1;

import {
  skorSatirSagXHesapla,
  SCORE_ROW_RIGHT_INSET,
} from '../../utils/music-brf/musicVisualLayoutHelpers.js';

import {
  timeSignatureToplam64Al,
  sureBilgisiAl,
  ogeSure64Al,
  keySignatureSayisiAl,
  olcuCizgisiMi,
  normalOlcuCizgisiMi,
  zamanImzasindanVurus64Al,
} from '../../utils/music-brf/musicMeasureHelpers.js';
import {
  gorselBeamGruplariOlusturOlcuBazli,
} from '../../utils/music-brf/musicVisualBeamHelpers.js';

export function useMusicScoreLayout({
  muzikOgeleriOlcuTamamlanmis,
  muzikHeader,
  sureGostergeleri,
}) {
  const svgCizilecekOgeler = useMemo(() => (
    // brailleShorthand: BRF kısaltma işaretçisi — SVG'de doğrudan çizilmez
    muzikOgeleriOlcuTamamlanmis.filter((oge) => oge.tip !== 'anahtar' && oge.tip !== 'brailleShorthand')
  ), [muzikOgeleriOlcuTamamlanmis]);

  const zamanImzasindanVurusBirim16Al = () => {
    const ts = String(muzikHeader.timeSignature?.ad || '').toLowerCase();

    if (ts === 'common' || ts === 'cut common') {
      return 4;
    }

    const m = /^(\d+)\s*\/\s*(\d+)$/.exec(ts);
    if (!m) return 4;

    const ust = parseInt(m[1], 10);
    const alt = parseInt(m[2], 10);

    if (alt === 8 && ust > 3 && ust % 3 === 0) {
      return 6;
    }

    if (alt === 4) return 4;
    if (alt === 8) return 2;

    return 4;
  };

  const sureBirim16Al = (oge) => {
    const sure = sureBilgisiAl(oge, sureGostergeleri);
    if (!sure || !Number.isFinite(sure.realValue)) return 0;
    return 16 / sure.realValue;
  };

  const kucukNotaMi = (oge) => {
    if (!oge || oge.tip !== 'nota') return false;

    const sure = sureBilgisiAl(oge, sureGostergeleri);
    return Number.isFinite(sure?.realValue) && sure.realValue >= 16;
  };

  const beamGrubuMinimumSayiAl = (grupIndexleri) => {
    const grupOgeleri = (grupIndexleri || [])
      .map((idx) => svgCizilecekOgeler[idx])
      .filter(Boolean);

    // 16'lık, 32'lik, 64'lük gibi küçük notalarda PDF/Braille kuralına göre
    // grup en az 3 öğeden oluşmalı.
    if (grupOgeleri.some(kucukNotaMi)) {
      return 3;
    }

    // Sekizlik görsel kirişte 2 nota hâlâ kabul edilebilir.
    return 2;
  };

  const svgBeamGruplari = useMemo(() => {
    const measures = olcuTokenlariOlustur();
    const groups = [];

    const measureGroups = gorselBeamGruplariOlusturOlcuBazli({
      olculer: measures,
      timeSignature: muzikHeader.timeSignature,
    });

    measureGroups.forEach((indices) => {
      if (indices.length >= 2) {
        groups.push({
          id: `beam-${groups.length}`,
          indices,
          startIdx: indices[0],
          endIdx: indices[indices.length - 1],
        });
      }
    });

    return groups;
  }, [svgCizilecekOgeler, muzikHeader.timeSignature, sureGostergeleri]);

  const svgBeamGrupHaritasi = useMemo(() => {
    const map = new Map();

    svgBeamGruplari.forEach((grup) => {
      grup.indices.forEach((idx, konum) => {
        map.set(idx, {
          grup,
          konum,
          boy: grup.indices.length,
        });
      });
    });

    return map;
  }, [svgBeamGruplari]);

  const ilkSatirHeaderBilgisi = useMemo(() => {
    const keySayisi = keySignatureSayisiAl(muzikHeader.keySignature);

    const keyWidth = keySayisi > 0
      ? keySayisi * SVG_KEY_ACCIDENTAL_GAP + 8
      : 0;

    const timeWidth = muzikHeader.timeSignature ? 28 : 0;
    const keyStartX = SVG_KEY_SIGNATURE_X;
    const keyEndX = keySayisi > 0
      ? keyStartX + keyWidth
      : keyStartX;
    const timeStartX = muzikHeader.timeSignature
      ? keyEndX + SVG_TIME_SIGNATURE_GAP
      : keyEndX;
    const timeEndX = muzikHeader.timeSignature
      ? timeStartX + timeWidth
      : keyEndX;
    const headerVarMi = keySayisi > 0 || Boolean(muzikHeader.timeSignature);
    const noteStartX = headerVarMi
      ? timeEndX + SVG_AFTER_HEADER_GAP
      : SVG_NOTE_START_X;

    return {
      keySayisi,
      keyWidth,
      keyStartX,
      keyEndX,
      timeStartX,
      timeEndX,
      noteStartX,
    };
  }, [muzikHeader.keySignature, muzikHeader.timeSignature]);

  const clampSvg = (value, min, max) => Math.max(min, Math.min(max, value));

  const satirBaslangicXHesapla = (satirIdx) => {
    if (satirIdx === 0) {
      return ilkSatirHeaderBilgisi.noteStartX;
    }
    return SVG_NOTE_START_X;
  };

  const satirKullanilabilirGenislikHesapla = (satirIdx) => (
    SVG_SAG_SINIR_X - satirBaslangicXHesapla(satirIdx) - SVG_ROW_RIGHT_PAD
  );

  const ogeSuresi64Al = (oge) => {
    const sure64 = ogeSure64Al(oge, sureGostergeleri);
    return Number.isFinite(sure64) && sure64 > 0 ? sure64 : 0;
  };

  function olcuTokenlariOlustur() {
    const measures = [];
    let currentItems = [];
    let measureIndex = 0;

    const pushMeasure = () => {
      if (currentItems.length === 0) return;

      const items = currentItems.map((entry) => entry.oge);
      const visibleItems = items.filter((oge) => !normalOlcuCizgisiMi(oge));
      if (visibleItems.length === 0) {
        currentItems = [];
        return;
      }

      const sadeceOtomatikSuslardanMi =
        visibleItems.length > 0 &&
        visibleItems.every((oge) => oge.autoRest || oge.otomatik);

      const kullaniciOgesiVar =
        visibleItems.some((oge) => !(oge.autoRest || oge.otomatik));

      measures.push({
        id: `measure-${measureIndex}`,
        index: measureIndex,
        items,
        itemIndices: currentItems.map((entry) => entry.idx),
        sadeceOtomatikSuslardanMi,
        kullaniciOgesiVar,
        startBarlineType: currentItems[0]?.oge?.tip === 'beginRepeat' ? 'beginRepeat' : undefined,
      });

      measureIndex += 1;
      currentItems = [];
    };

    svgCizilecekOgeler.forEach((oge, idx) => {
      if (oge?.tip === 'beginRepeat') {
        pushMeasure();
        currentItems.push({ oge, idx });
        return;
      }

      // Volta marker'ları (1. ev / 2. ev) sadece metadata'dır — kendi başlarına
      // bir ölçü oluşturmasınlar. Sonraki gerçek ölçüye baş eklenti olarak
      // dahil olurlar. Bu sayede bracket sadece üstte çizilir, layout'ta
      // yer kaplamaz, başka ölçüleri ileri itmez.
      if (oge?.tip === 'volta1' || oge?.tip === 'volta2') {
        currentItems.push({ oge, idx });
        return;
      }

      currentItems.push({ oge, idx });
      if (olcuCizgisiMi(oge)) {
        pushMeasure();
      }
    });

    pushMeasure();
    return measures;
  }

  const olcuGorunurOgeleriAl = (measure) => (
    (measure?.items || []).filter((oge) => (
      !normalOlcuCizgisiMi(oge) &&
      oge?.tip !== 'volta1' &&
      oge?.tip !== 'volta2'
    ))
  );

  const olcuVisibleItemsAl = (measure) => {
    const visibleItems = olcuGorunurOgeleriAl(measure);
    if (visibleItems[0]?.tip === 'beginRepeat') {
      return visibleItems.slice(1);
    }
    return visibleItems;
  };

  const olcuMinimumItemGapAl = (measure) => {
    const visibleItems = olcuVisibleItemsAl(measure);
    const visibleCount = visibleItems.length;
    const longestBeam = olcuEnUzunBeamSayisiAl(measure);

    if (visibleCount <= 1) return 0;
    if (visibleCount >= SVG_DENSE_VISIBLE_COUNT || longestBeam >= SVG_DENSE_BEAM_COUNT) {
      return SCORE_LAYOUT_MIN_DENSE_ITEM_GAP;
    }
    return SCORE_LAYOUT_MIN_ITEM_GAP;
  };

  const olcuMinimumGenislikAl = (measure) => {
    const visibleItems = olcuVisibleItemsAl(measure);
    const visibleCount = visibleItems.length;

    if (visibleCount <= 0) {
      return SVG_MEASURE_MIN_WIDTH;
    }

    if (visibleCount === 1) {
      return Math.max(64, SVG_MEASURE_MIN_WIDTH);
    }

    const minGap = olcuMinimumItemGapAl(measure);

    return (
      SVG_MEASURE_LEFT_PAD +
      SVG_MEASURE_RIGHT_PAD +
      Math.max(0, visibleCount - 1) * minGap +
      28
    );
  };

  const olcuSureToplami64Al = (measure) => (
    olcuVisibleItemsAl(measure).reduce((sum, oge) => sum + ogeSuresi64Al(oge), 0)
  );

  const olcuMantiksalSure64Al = (measure) => {
    const hedefOlcu64 = timeSignatureToplam64Al(muzikHeader);
    const toplam64 = olcuSureToplami64Al(measure);
    return hedefOlcu64 || toplam64 || 1;
  };

  const olcuEnUzunBeamSayisiAl = (measure) => {
    const itemIds = new Set();

    olcuVisibleItemsAl(measure).forEach((oge) => {
      [
        oge?.id,
        oge?.editorId,
        oge?.sourceId,
        oge?.kaynakOgeId,
        oge?.ogeId,
        oge?.kaynakReaderItem?.id,
        oge?.kaynakReaderItem?.ogeId,
        oge?.kaynakReaderItem?.sourceId,
        oge?.kaynakReaderItem?.editorId,
      ].filter(Boolean).forEach((id) => itemIds.add(id));
    });
    let maxCount = 0;

    svgBeamGruplari.forEach((grup) => {
      const count = (grup.indices || []).filter((idx) => {
        const oge = svgCizilecekOgeler[idx];
        return oge && itemIds.has(oge.id);
      }).length;

      maxCount = Math.max(maxCount, count);
    });

    return maxCount;
  };

  const olcuYerlesimBilgisiHesapla = (measure, satirIdx) => {
    const rowAvailable = satirKullanilabilirGenislikHesapla(satirIdx);
    const visibleItems = olcuVisibleItemsAl(measure);
    const visibleCount = visibleItems.length;
    const logical64 = olcuMantiksalSure64Al(measure);
    const longestBeam = olcuEnUzunBeamSayisiAl(measure);

    const sadeceOtomatikSuslardanMi =
      measure?.sadeceOtomatikSuslardanMi ||
      (
        visibleItems.length > 0 &&
        visibleItems.every((oge) => oge.autoRest || oge.otomatik)
      );

    const kullaniciOgesiVar =
      measure?.kullaniciOgesiVar ||
      visibleItems.some((oge) => !(oge.autoRest || oge.otomatik));

    if (sadeceOtomatikSuslardanMi) {
      const width = Math.max(
        SVG_AUTO_REST_MEASURE_WIDTH,
        Math.max(0, visibleCount - 1) * SVG_AUTO_REST_ITEM_GAP +
          SVG_MEASURE_LEFT_PAD +
          SVG_MEASURE_RIGHT_PAD +
          14,
      );

      return {
        visibleCount,
        longestBeam,
        logical64,
        dense: false,
        sadeceOtomatikSuslardanMi: true,
        kullaniciOgesiVar: false,
        measureWidth: Math.min(width, 96),
        itemGap: SVG_AUTO_REST_ITEM_GAP,
      };
    }

    const dense =
      visibleCount >= SVG_DENSE_VISIBLE_COUNT ||
      longestBeam >= SVG_DENSE_BEAM_COUNT;

    const minGap = dense
      ? SCORE_LAYOUT_MIN_DENSE_ITEM_GAP
      : SCORE_LAYOUT_MIN_ITEM_GAP;

    const itemGap = Math.min(
      SCORE_LAYOUT_MAX_ITEM_GAP,
      visibleCount <= 1
        ? SVG_SINGLE_ITEM_GAP
        : Math.max(
            minGap,
            dense ? SVG_DENSE_ITEM_GAP : SVG_NORMAL_ITEM_GAP,
          ),
    );

    if (visibleCount <= 1) {
      return {
        visibleCount,
        longestBeam,
        logical64,
        dense: false,
        sadeceOtomatikSuslardanMi: false,
        kullaniciOgesiVar,
        measureWidth: 72,
        itemGap,
      };
    }

    const byItems =
      Math.max(0, visibleCount - 1) * itemGap +
      SVG_MEASURE_LEFT_PAD +
      SVG_MEASURE_RIGHT_PAD +
      34;

    const byBeam =
      longestBeam > 1
        ? Math.max(0, longestBeam - 1) * itemGap +
          SVG_MEASURE_LEFT_PAD +
          SVG_MEASURE_RIGHT_PAD +
          38
        : 0;

    const byDuration = Math.min(logical64 * 0.75 + 34, dense ? 150 : 130);

    const readabilityBonus =
      visibleCount >= 12 ? 34 :
      visibleCount >= 8 ? 26 :
      visibleCount >= 5 ? 18 :
      visibleCount >= 3 ? 12 : 0;

    let measureWidth = Math.max(
      SVG_MEASURE_MIN_WIDTH,
      byItems + readabilityBonus,
      byBeam,
      byDuration,
    );

    const minReadableWidth = olcuMinimumGenislikAl(measure);

    if (dense) {
      const maxWidth = Math.min(SVG_DENSE_MEASURE_MAX_WIDTH, rowAvailable);
      measureWidth = Math.min(
        Math.max(measureWidth, 330, minReadableWidth),
        maxWidth,
      );
    } else {
      measureWidth = Math.max(measureWidth, minReadableWidth);
      measureWidth = Math.min(measureWidth, SVG_MEASURE_MAX_WIDTH);
      measureWidth = Math.min(measureWidth, Math.max(rowAvailable, minReadableWidth));
    }

    return {
      visibleCount,
      longestBeam,
      logical64,
      dense,
      sadeceOtomatikSuslardanMi: false,
      kullaniciOgesiVar,
      measureWidth,
      itemGap,
      minReadableWidth,
    };
  };

  const olcuSatirlariniOlustur = () => {
    const measures = olcuTokenlariOlustur();
    const rows = [];

    let currentRow = [];
    let currentRowWidth = 0;
    let currentRowIndex = 0;

    const rowWidthAl = (row) => {
      if (!row.length) return 0;
      return row.reduce((sum, m) => sum + m.layoutWidth, 0) +
        Math.max(0, row.length - 1) * SVG_MEASURE_GAP;
    };

    const pushRow = () => {
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentRowWidth = 0;
      currentRowIndex = rows.length;
    };

    measures.forEach((measure) => {
      const rowAvailable = satirKullanilabilirGenislikHesapla(currentRowIndex);
      const info = olcuYerlesimBilgisiHesapla(measure, currentRowIndex);
      const minReadableWidth = info.minReadableWidth ?? olcuMinimumGenislikAl(measure);
      const tooDenseForRow = minReadableWidth > rowAvailable;
      const measureLayoutWidth = tooDenseForRow
        ? rowAvailable
        : Math.min(Math.max(info.measureWidth, minReadableWidth), rowAvailable);

      const measureWithLayout = {
        ...measure,
        layoutInfo: {
          ...info,
          minReadableWidth,
          tooDenseForRow,
        },
        layoutWidth: measureLayoutWidth,
      };

      if (tooDenseForRow) {
        if (currentRow.length > 0) {
          pushRow();
        }
        currentRow.push(measureWithLayout);
        pushRow();
        return;
      }

      const gap = currentRow.length > 0 ? SVG_MEASURE_GAP : 0;

      if (
        currentRow.length > 0 &&
        currentRowWidth + gap + measureLayoutWidth > rowAvailable
      ) {
        pushRow();
      }

      const rowGap = currentRow.length > 0 ? SVG_MEASURE_GAP : 0;
      currentRow.push(measureWithLayout);
      currentRowWidth += rowGap + measureLayoutWidth;
    });

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    for (let i = 0; i < rows.length - 1; i += 1) {
      while (rows[i + 1] && rows[i + 1].length > 0) {
        const current = rows[i];
        const next = rows[i + 1];
        const candidate = next[0];
        if (!candidate) break;
        if (candidate.layoutInfo?.dense && candidate.layoutInfo?.measureWidth > 320) {
          break;
        }

        const rowAvailable = satirKullanilabilirGenislikHesapla(i);
        const currentWidth = rowWidthAl(current);
        const needed =
          currentWidth +
          (current.length > 0 ? SVG_MEASURE_GAP : 0) +
          candidate.layoutWidth;

        if (needed <= rowAvailable) {
          current.push(candidate);
          next.shift();
          if (next.length === 0) {
            rows.splice(i + 1, 1);
          }
        } else {
          break;
        }
      }
    }

    return rows.map((row, idx) => satirOlculeriniGenislet(row, idx));
  };

  function satirOlculeriniGenislet(row, satirIdx) {
    if (!Array.isArray(row) || row.length === 0) return row;

    const rowAvailable = satirKullanilabilirGenislikHesapla(satirIdx);
    const gapsTotal = Math.max(0, row.length - 1) * SVG_MEASURE_GAP;
    const currentMeasuresWidth = row.reduce((sum, m) => sum + (m.layoutWidth || 0), 0);
    const currentTotal = currentMeasuresWidth + gapsTotal;
    const free = rowAvailable - currentTotal;

    if (free <= 1) return row;

    const expandable = row.filter((m) => !m.layoutInfo?.sadeceOtomatikSuslardanMi);
    if (!expandable.length) return row;

    const rowFillRatio = currentTotal / Math.max(1, rowAvailable);
    const shouldDistribute = rowFillRatio >= SCORE_LAYOUT_ROW_FILL_THRESHOLD || row.length >= 2;
    if (!shouldDistribute) return row;

    const totalWeight = expandable.reduce((sum, m) => {
      const visibleCount = olcuGorunurOgeleriAl(m).length;
      const duration = m.layoutInfo?.logical64 || 1;
      return sum + Math.max(1, Math.pow(visibleCount + duration / 16, SCORE_LAYOUT_MEASURE_DISTRIBUTION_POWER));
    }, 0);

    return row.map((m) => {
      if (!expandable.includes(m)) return m;
      const visibleCount = olcuGorunurOgeleriAl(m).length;
      const duration = m.layoutInfo?.logical64 || 1;
      const weight = Math.max(1, Math.pow(visibleCount + duration / 16, SCORE_LAYOUT_MEASURE_DISTRIBUTION_POWER));
      const extra = free * (weight / totalWeight);
      return {
        ...m,
        layoutInfo: {
          ...m.layoutInfo,
          distributedExtraWidth: extra,
        },
        layoutWidth: (m.layoutWidth || 0) + extra,
      };
    });
  }


  const xleriDuzelt = ({
    rawPositions,
    innerStartX,
    innerEndX,
    itemGap,
    sadeceOtomatikSuslardanMi,
  }) => {
    if (!rawPositions.length) return [];

    const count = rawPositions.length;
    const leftPad =
      sadeceOtomatikSuslardanMi ? 0 :
      count <= 1 ? 0 :
      count <= 3 ? 6 : 8;
    const rightPad =
      sadeceOtomatikSuslardanMi ? 0 :
      count <= 1 ? 0 :
      count <= 3 ? 8 : 10;

    const safeStart = innerStartX + leftPad;
    const safeEnd = innerEndX - rightPad;
    const available = Math.max(0, safeEnd - safeStart);
    const minNeeded = Math.max(0, count - 1) * itemGap;

    if (count === 1) {
      return [
        {
          ...rawPositions[0],
          x: Math.min(
            safeEnd,
            safeStart + (sadeceOtomatikSuslardanMi ? 8 : 14),
          ),
        },
      ];
    }

    if (available <= minNeeded) {
      return rawPositions.map((p, index) => ({
        ...p,
        x: safeStart + index / (count - 1) * available,
      }));
    }

    const adjusted = rawPositions.map((p) => ({
      ...p,
      x: clampSvg(p.x, safeStart, safeEnd),
    }));

    adjusted[0].x = Math.max(
      safeStart,
      Math.min(adjusted[0].x, safeEnd - minNeeded),
    );

    for (let i = 1; i < adjusted.length; i += 1) {
      adjusted[i].x = Math.max(adjusted[i].x, adjusted[i - 1].x + itemGap);
    }

    let overflow = adjusted[adjusted.length - 1].x - safeEnd;
    if (overflow > 0) {
      adjusted.forEach((item) => {
        item.x -= overflow;
      });
    }

    if (adjusted[0].x < safeStart) {
      const shift = safeStart - adjusted[0].x;
      adjusted.forEach((item) => {
        item.x += shift;
      });
    }

    const freeRatio = Math.min(1, (available - minNeeded) / Math.max(1, available));
    const blend =
      sadeceOtomatikSuslardanMi ? 0.08 :
      freeRatio > 0.55 ? 0.82 :
      freeRatio > 0.35 ? 0.68 :
      freeRatio > 0.18 ? 0.52 :
      count >= 8 ? 0.46 :
      count >= 5 ? 0.38 :
      count >= 3 ? 0.26 : 0.18;

    const blended = adjusted.map((p, index) => {
      const t = index / (count - 1);
      const evenX = safeStart + t * available;
      return {
        ...p,
        x: p.x * (1 - blend) + evenX * blend,
      };
    });

    blended[0].x = Math.max(safeStart, Math.min(blended[0].x, safeEnd - minNeeded));
    for (let i = 1; i < blended.length; i += 1) {
      blended[i].x = Math.max(blended[i].x, blended[i - 1].x + itemGap);
    }

    overflow = blended[blended.length - 1].x - safeEnd;
    if (overflow > 0) {
      blended.forEach((item) => {
        item.x -= overflow;
      });
    }

    if (blended[blended.length - 1].x > safeEnd + 0.1) {
      return rawPositions.map((p, index) => ({
        ...p,
        x: safeStart + index / (count - 1) * available,
      }));
    }

    return blended;
  };

  const svgOlcuLayout = useMemo(() => {
    const measureRows = olcuSatirlariniOlustur();
    const rows = [];
    const measureLayoutRows = [];
    const positions = new Map();

    measureRows.forEach((measureRow, satirIdx) => {
      const rowItems = [];
      const rowMeasureLayouts = [];
      let currentX = satirBaslangicXHesapla(satirIdx);

      measureRow.forEach((measure, measureIdxInRow) => {
        if (measureIdxInRow > 0) {
          currentX += SVG_MEASURE_GAP;
        }

        const measureStartX = currentX;
        const rowRightX = skorSatirSagXHesapla({
          staffRightX: SVG_SAG_SINIR_X,
          rightInset: SCORE_ROW_RIGHT_INSET,
        });
        let measureEndX = Math.min(
          rowRightX,
          measureStartX + measure.layoutWidth,
        );

        const satirSonOlcuMu = measureIdxInRow === measureRow.length - 1;
        if (satirSonOlcuMu && measure.layoutInfo?.distributedExtraWidth > 0) {
          measureEndX = rowRightX;
        }

        if (satirSonOlcuMu && measureEndX < rowRightX && measure.layoutWidth > 0) {
          const rowUsed = measureStartX + measure.layoutWidth;
          if (rowUsed <= rowRightX + 1) {
            measureEndX = rowRightX;
          }
        }

        if (measureEndX <= measureStartX + 24) {
          return;
        }

        const innerStartX = measureStartX + SVG_MEASURE_LEFT_PAD;
        const innerEndX = measureEndX - SVG_MEASURE_RIGHT_PAD;
        const innerWidth = Math.max(12, innerEndX - innerStartX);

        const visibleItems = olcuVisibleItemsAl(measure);
        const measureBeginsWithBeginRepeat = measure.startBarlineType === 'beginRepeat';
        const logical64 = measure.layoutInfo.logical64;
        const itemGap = measure.layoutInfo.itemGap;
        const sadeceOtomatikSuslardanMi = measure.layoutInfo.sadeceOtomatikSuslardanMi;

        let elapsed64 = 0;
        const rawPositions = [];

        visibleItems.forEach((oge) => {
          const duration64 = ogeSuresi64Al(oge);
          if (duration64 > 0) {
            const center64 = elapsed64 + duration64 / 2;
            const ratio = clampSvg(center64 / logical64, 0, 1);
            rawPositions.push({
              id: oge.id,
              x: innerStartX + ratio * innerWidth,
            });
            elapsed64 += duration64;
          } else {
            rawPositions.push({
              id: oge.id,
              x: rawPositions.length
                ? rawPositions[rawPositions.length - 1].x + itemGap
                : innerStartX,
            });
          }
        });

        const fixedPositions = xleriDuzelt({
          rawPositions,
          innerStartX,
          innerEndX,
          itemGap,
          sadeceOtomatikSuslardanMi,
        });

        const fixedMap = new Map(fixedPositions.map((p) => [p.id, p.x]));

        measure.items.forEach((oge) => {
          let x;
          const isVoltaMarker = oge.tip === 'volta1' || oge.tip === 'volta2';
          if (oge.tip === 'beginRepeat' && measureBeginsWithBeginRepeat && measure.items[0] === oge) {
            x = measureStartX;
          } else if (isVoltaMarker) {
            // Volta marker'ı görsel olarak yer kaplamaz — bracket başlangıcı için
            // measureStartX referans nokta olarak kaydedilir.
            x = measureStartX;
          } else if (olcuCizgisiMi(oge)) {
            x = measureEndX;
          } else {
            x = fixedMap.get(oge.id);
            if (!Number.isFinite(x)) {
              x = innerStartX;
            }
          }

          x = clampSvg(x, SVG_STAFF_LEFT_X, SVG_STAFF_RIGHT_X);
          rowItems.push(oge);

          positions.set(oge.id, {
            satirIdx,
            satirIciIdx: rowItems.length - 1,
            x,
            measureIndex: measure.index,
            measureStartX,
            measureEndX,
          });
        });

        rowMeasureLayouts.push({
          id: measure.id,
          index: measure.index,
          measureIndex: measure.index,
          satirIdx,
          measureIdxInRow,
          items: measure.items,
          itemIds: (measure.items || []).flatMap((oge) => [
            oge?.id,
            oge?.editorId,
            oge?.sourceId,
            oge?.kaynakOgeId,
            oge?.ogeId,
            oge?.kaynakReaderItem?.id,
            oge?.kaynakReaderItem?.ogeId,
            oge?.kaynakReaderItem?.sourceId,
            oge?.kaynakReaderItem?.editorId,
          ]).filter(Boolean),
          measureStartX,
          measureEndX,
          startX: measureStartX,
          endX: measureEndX,
          innerStartX,
          innerEndX,
          width: Math.max(24, measureEndX - measureStartX),
        });

        currentX = measureEndX;
      });

      if (rowItems.length > 0) {
        rows.push(rowItems);
        measureLayoutRows.push(rowMeasureLayouts);
      }
    });

    return {
      rows: rows.length ? rows : [[]],
      measureRows: measureLayoutRows,
      positions,
    };
  }, [
    muzikHeader.keySignature,
    muzikHeader.timeSignature,
    ilkSatirHeaderBilgisi,
    svgBeamGruplari,
    svgCizilecekOgeler,
  ]);

  const muzikSatirlar = svgOlcuLayout.rows;
  const muzikSatirOlculeri = svgOlcuLayout.measureRows || [];
  const svgYerlesimHaritasi = svgOlcuLayout.positions;

  const svgGlobalIndexBul = (ogeId) => (
    svgCizilecekOgeler.findIndex((oge) => oge.id === ogeId)
  );

  const ogeXHesapla = (ogeId) => {
    const loc = svgYerlesimHaritasi.get(ogeId);
    return Number.isFinite(loc?.x) ? loc.x : SVG_NOTE_START_X;
  };

  const satirIcindeBeamliMi = (ogeId) => {
    const globalIdx = svgGlobalIndexBul(ogeId);
    if (globalIdx < 0) return false;

    const info = svgBeamGrupHaritasi.get(globalIdx);
    if (!info) return false;

    const grup = info.grup;
    if (!grup || !Array.isArray(grup.indices) || grup.indices.length < 2) return false;

    const basOge = svgCizilecekOgeler[grup.startIdx];
    const bitOge = svgCizilecekOgeler[grup.endIdx];
    const kendisi = svgCizilecekOgeler[globalIdx];

    if (!basOge || !bitOge || !kendisi) return false;

    const locBas = svgYerlesimHaritasi.get(basOge.id);
    const locBit = svgYerlesimHaritasi.get(bitOge.id);
    const locMe = svgYerlesimHaritasi.get(kendisi.id);

    if (!locBas || !locBit || !locMe) return false;
    if (locBas.satirIdx !== locMe.satirIdx) return false;
    if (locBit.satirIdx !== locMe.satirIdx) return false;

    return true;
  };

  return {
    svgCizilecekOgeler,
    svgBeamGruplari,
    svgBeamGrupHaritasi,
    muzikSatirlar,
    muzikSatirOlculeri,
    svgYerlesimHaritasi,
    svgGlobalIndexBul,
    ogeXHesapla,
    satirIcindeBeamliMi,
    ilkSatirHeaderBilgisi,
  };
}
