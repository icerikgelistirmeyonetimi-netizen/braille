export const SCORE_STAFF_TOP_Y = 64;
export const SCORE_STAFF_BOTTOM_Y = 112;

export const BARLINE_STYLE = {
  normal: {
    thinWidth: 1.2,
  },
  final: {
    thinWidth: 1.2,
    thickWidth: 4.2,
    gap: 5,
  },
  sectional: {
    thinWidth: 1.2,
    gap: 5,
  },
  repeat: {
    thinWidth: 1.2,
    thickWidth: 4.2,
    gap: 5,
    dotRadius: 1.8,
    dotXGap: 7,
  },
};

export function skorBarlineTipiAl(oge = {}) {
  const tip = String(oge.tip || oge.type || oge.kind || '').toLowerCase();
  const ad = String(oge.ad || oge.gorunum || oge.label || '').toLowerCase();
  const gorunum = String(oge.gorunum || '');

  if (
    tip === 'endrepeat' ||
    tip === 'end-repeat' ||
    tip === 'repeatend' ||
    gorunum === '𝄇' ||
    ad.includes('tekrar sonu') ||
    ad.includes('tekrar bitiş') ||
    ad.includes('tekrar bitis') ||
    ad.includes('bitiş tekrarı') ||
    ad.includes('bitis tekrari') ||
    ad.includes('bitiş röpriz') ||
    ad.includes('bitis ropriz') ||
    ad.includes('end repeat')
  ) {
    return 'endRepeat';
  }

  if (
    tip === 'finalbarline' ||
    tip === 'barlinefinal' ||
    tip === 'final' ||
    gorunum === '𝄂' ||
    ad.includes('final') ||
    ad.includes('son çizgi') ||
    ad.includes('son cizgi') ||
    ad.includes('bitiş çizg') ||  // "bitiş çizgisi" (final eki olmadan da) = eserin sonu
    ad.includes('bitis cizg')
  ) {
    return 'final';
  }

  if (
    tip === 'sectionalbarline' ||
    tip === 'barlinesectional' ||
    tip === 'sectional' ||
    ad.includes('sectional') ||
    ad.includes('bölüm') ||
    ad.includes('bolum') ||
    ad.includes('çift çizgi') ||
    ad.includes('cift cizgi')
  ) {
    return 'sectional';
  }

  if (
    tip === 'beginrepeat' ||
    tip === 'begin-repeat' ||
    tip === 'startrepeat' ||
    gorunum === '𝄆' ||
    ad.includes('başlangıç röpriz') ||
    ad.includes('baslangic ropriz') ||
    ad.includes('begin repeat') ||
    ad.includes('start repeat')
  ) {
    return 'beginRepeat';
  }

  if (
    tip === 'volta1' ||
    ad.includes('1. ev') ||
    ad.includes('1.ev') ||
    ad.includes('volta 1') ||
    ad.includes('volta1')
  ) {
    return 'volta1';
  }

  if (
    tip === 'volta2' ||
    ad.includes('2. ev') ||
    ad.includes('2.ev') ||
    ad.includes('volta 2') ||
    ad.includes('volta2')
  ) {
    return 'volta2';
  }

  return 'normal';
}

export function skorFinalBarlineSatirSonuMu({
  itemIndex,
  rowItems = [],
}) {
  if (!Array.isArray(rowItems) || itemIndex == null) return false;

  for (let i = itemIndex + 1; i < rowItems.length; i += 1) {
    const oge = rowItems[i];
    if (!oge) continue;
    if (oge.hidden || oge.gizli) continue;
    return false;
  }

  return true;
}

export function skorBarlineXAl({
  normalX,
  rowRightX,
  barlineType,
  isRowEnd,
}) {
  if (
    barlineType === 'final' &&
    isRowEnd &&
    Number.isFinite(rowRightX)
  ) {
    return rowRightX;
  }

  return normalX;
}

export function skorBarlineParcalariAl({
  x,
  type = 'normal',
  topY = SCORE_STAFF_TOP_Y,
  bottomY = SCORE_STAFF_BOTTOM_Y,
}) {
  const parts = [];

  if (type === 'final') {
    const s = BARLINE_STYLE.final;
    const thickX = x;
    const thinX = x - s.gap;

    parts.push({
      kind: 'line',
      role: 'final-thin',
      x: thinX,
      y1: topY,
      y2: bottomY,
      width: s.thinWidth,
    });
    parts.push({
      kind: 'line',
      role: 'final-thick',
      x: thickX,
      y1: topY,
      y2: bottomY,
      width: s.thickWidth,
    });
    return parts;
  }

  if (type === 'sectional') {
    const s = BARLINE_STYLE.sectional;
    parts.push({
      kind: 'line',
      role: 'sectional-left',
      x: x - s.gap / 2,
      y1: topY,
      y2: bottomY,
      width: s.thinWidth,
    });
    parts.push({
      kind: 'line',
      role: 'sectional-right',
      x: x + s.gap / 2,
      y1: topY,
      y2: bottomY,
      width: s.thinWidth,
    });
    return parts;
  }

  if (type === 'beginRepeat') {
    const s = BARLINE_STYLE.repeat;
    const thickX = x - s.gap / 2;
    const thinX = x + s.gap / 2;
    const dotX = thinX + s.dotXGap;

    parts.push({
      kind: 'line',
      role: 'begin-repeat-thick',
      x: thickX,
      y1: topY,
      y2: bottomY,
      width: s.thickWidth,
    });
    parts.push({
      kind: 'line',
      role: 'begin-repeat-thin',
      x: thinX,
      y1: topY,
      y2: bottomY,
      width: s.thinWidth,
    });
    parts.push({
      kind: 'dot',
      role: 'begin-repeat-dot-top',
      x: dotX,
      y: 82,
      r: s.dotRadius,
    });
    parts.push({
      kind: 'dot',
      role: 'begin-repeat-dot-bottom',
      x: dotX,
      y: 94,
      r: s.dotRadius,
    });
    return parts;
  }

  if (type === 'endRepeat') {
    const s = BARLINE_STYLE.repeat;
    const thinX = x - s.gap / 2;
    const thickX = x + s.gap / 2;
    const dotX = thinX - s.dotXGap;

    parts.push({
      kind: 'dot',
      role: 'end-repeat-dot-top',
      x: dotX,
      y: 82,
      r: s.dotRadius,
    });
    parts.push({
      kind: 'dot',
      role: 'end-repeat-dot-bottom',
      x: dotX,
      y: 94,
      r: s.dotRadius,
    });
    parts.push({
      kind: 'line',
      role: 'end-repeat-thin',
      x: thinX,
      y1: topY,
      y2: bottomY,
      width: s.thinWidth,
    });
    parts.push({
      kind: 'line',
      role: 'end-repeat-thick',
      x: thickX,
      y1: topY,
      y2: bottomY,
      width: s.thickWidth,
    });
    return parts;
  }

  // volta1 / volta2 — görsel olarak çizgi YOK; bracket ayrıca çizilir
  // (eskiden ince bir vertical çizgi vardı; bracket'le birlikte kafa karıştırıcıydı
  //  ve volta marker'ın kendi 64px ölçüsünde yer kapladığında stray line oluşturuyordu)
  if (type === 'volta1' || type === 'volta2') {
    return parts;
  }

  parts.push({
    kind: 'line',
    role: 'normal',
    x,
    y1: topY,
    y2: bottomY,
    width: BARLINE_STYLE.normal.thinWidth,
  });

  return parts;
}
