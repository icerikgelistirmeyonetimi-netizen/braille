export function distributeRowExtraWidth({
  measures = [],
  rowAvailable = 0,
  measureGap = 0,
}) {
  const cleanMeasures = Array.isArray(measures) ? measures : [];

  if (!cleanMeasures.length) return [];

  const gapsTotal = Math.max(0, cleanMeasures.length - 1) * measureGap;
  const currentMeasuresWidth = cleanMeasures.reduce(
    (sum, m) => sum + (Number(m.layoutWidth) || 0),
    0,
  );

  const currentTotal = currentMeasuresWidth + gapsTotal;
  const free = rowAvailable - currentTotal;

  if (free <= 0) {
    return cleanMeasures.map((m) => ({ ...m }));
  }

  const expandable = cleanMeasures.filter((m) => m.expandable !== false);

  if (!expandable.length) {
    return cleanMeasures.map((m) => ({ ...m }));
  }

  const totalWeight = expandable.reduce(
    (sum, m) => sum + Math.max(1, Number(m.weight) || 1),
    0,
  );

  return cleanMeasures.map((m) => {
    if (m.expandable === false) return { ...m };

    const weight = Math.max(1, Number(m.weight) || 1);
    const extra = free * (weight / totalWeight);

    return {
      ...m,
      distributedExtraWidth: extra,
      layoutWidth: (Number(m.layoutWidth) || 0) + extra,
    };
  });
}

export function enforceMinimumGapPositions({
  positions = [],
  safeStart = 0,
  safeEnd = 0,
  minGap = 32,
}) {
  const clean = (Array.isArray(positions) ? positions : [])
    .map((p, index) => ({
      ...p,
      x: Number.isFinite(Number(p.x)) ? Number(p.x) : safeStart,
      index,
    }));

  if (!clean.length) {
    return {
      positions: [],
      compressed: false,
    };
  }

  if (clean.length === 1) {
    return {
      positions: [
        {
          ...clean[0],
          x: Math.max(safeStart, Math.min(safeEnd, clean[0].x)),
        },
      ],
      compressed: false,
    };
  }

  const available = Math.max(0, safeEnd - safeStart);
  const minNeeded = Math.max(0, clean.length - 1) * minGap;

  if (available < minNeeded) {
    return {
      compressed: true,
      positions: clean.map((p, index) => ({
        ...p,
        x: safeStart + (index / (clean.length - 1)) * available,
      })),
    };
  }

  const sorted = clean
    .slice()
    .sort((a, b) => a.x - b.x);

  sorted[0].x = Math.max(
    safeStart,
    Math.min(sorted[0].x, safeEnd - minNeeded),
  );

  for (let i = 1; i < sorted.length; i += 1) {
    sorted[i].x = Math.max(sorted[i].x, sorted[i - 1].x + minGap);
  }

  let overflow = sorted[sorted.length - 1].x - safeEnd;

  if (overflow > 0) {
    sorted.forEach((item) => {
      item.x -= overflow;
    });
  }

  if (sorted[0].x < safeStart) {
    const shift = safeStart - sorted[0].x;
    sorted.forEach((item) => {
      item.x += shift;
    });
  }

  if (sorted[sorted.length - 1].x > safeEnd + 0.001) {
    return {
      compressed: true,
      positions: clean.map((position, index) => ({
        ...position,
        x: safeStart + (index / (clean.length - 1)) * available,
      })),
    };
  }

  const byOriginalIndex = new Map(sorted.map((item) => [item.index, item]));

  return {
    compressed: false,
    positions: clean.map((item) => byOriginalIndex.get(item.index)),
  };
}

export const SCORE_ROW_RIGHT_INSET = 0;

export function skorSatirSagXHesapla({
  staffRightX = 0,
  rightInset = 0,
}) {
  return staffRightX - rightInset;
}

export function computeRowRightAlignedMeasureEnd({
  measureStartX = 0,
  layoutWidth = 0,
  rowRightX = 0,
  isLastMeasureInRow = false,
}) {
  if (isLastMeasureInRow) {
    return rowRightX;
  }

  return Math.min(rowRightX, measureStartX + layoutWidth);
}

export function computeReadableMeasureWidth({
  visibleCount = 0,
  minGap = 32,
  leftPad = 14,
  rightPad = 14,
  extra = 28,
  minWidth = 54,
}) {
  if (visibleCount <= 0) return minWidth;

  if (visibleCount === 1) {
    return Math.max(minWidth, leftPad + rightPad + extra);
  }

  return Math.max(
    minWidth,
    leftPad + rightPad + Math.max(0, visibleCount - 1) * minGap + extra,
  );
}
