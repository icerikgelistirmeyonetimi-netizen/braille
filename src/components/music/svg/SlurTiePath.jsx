// Slur ve tie çizimleri için ince-kalın-ince, uçları sivri, nota gravürüne yakın slur/tie çizimi.
// Stroke değil, çok ince kapalı filled path kullanır.
// Böylece uçlar sivri olur; çizgi düz stroke gibi görünmez.

const MIDDLE_LINE_Y = 88;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function safePoint(point, fallback = { x: 0, y: MIDDLE_LINE_Y }) {
  if (!point) return fallback;

  return {
    x: Number.isFinite(point.x) ? point.x : fallback.x,
    y: Number.isFinite(point.y) ? point.y : fallback.y,
  };
}

function getDirectionFromNotes(start, end) {
  const avgY = (start.y + end.y) / 2;
  return avgY > MIDDLE_LINE_Y ? 'below' : 'above';
}

function getBaseY(start, end, direction, type) {
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  const distance = type === 'tie' ? 7 : 12;

  return direction === 'above'
    ? minY - distance
    : maxY + distance;
}

function slurKalipParametreleriAl({
  x1,
  x2,
  direction,
  type,
}) {
  const absDx = Math.abs(x2 - x1);
  const isTie = type === 'tie';

  let archHeight = isTie
    ? Math.max(4, Math.min(18, absDx * 0.06))
    : Math.max(10, Math.min(26, absDx * 0.18));

  let bodyThickness = isTie
    ? Math.max(3.2, Math.min(5.6, absDx * 0.03))
    : Math.max(3.4, Math.min(6.4, absDx * 0.034));

  let tipThickness = Math.max(0.9, Math.min(1.6, bodyThickness * 0.28));

  if (absDx < 36) {
    bodyThickness = Math.min(bodyThickness, 4.6);
    archHeight = Math.min(archHeight, 14);
    tipThickness = Math.max(tipThickness, 1.0);
  }

  if (absDx > 140) {
    bodyThickness = Math.min(bodyThickness, 6.2);
    tipThickness = Math.max(tipThickness, 1.1);
  }

  return {
    archHeight,
    bodyThickness,
    tipThickness,
  };
}

function slurClosedPathD({
  start,
  end,
  direction,
  type = 'slur',
}) {
  const s = safePoint(start);
  const e = safePoint(end, { x: s.x + 40, y: s.y });
  const resolvedDirection = direction || getDirectionFromNotes(s, e);
  const sign = resolvedDirection === 'below' ? 1 : -1;

  const inset = type === 'tie'
    ? Math.max(4, Math.min(10, Math.abs(e.x - s.x) * 0.08))
    : Math.max(5, Math.min(12, Math.abs(e.x - s.x) * 0.1));

  let x1 = s.x + inset;
  let x2 = e.x - inset;

  if (x2 <= x1) {
    x1 = Math.min(s.x, e.x);
    x2 = Math.max(s.x, e.x);
  }

  const { archHeight, bodyThickness, tipThickness } = slurKalipParametreleriAl({
    x1,
    x2,
    direction: resolvedDirection,
    type,
  });

  const baseY = getBaseY(s, e, resolvedDirection, type);
  const dx = x2 - x1;
  const absDx = Math.abs(dx);

  let endpointInsetX = clamp(absDx * 0.04, 2.5, 6);
  if (absDx < 36) endpointInsetX = Math.max(endpointInsetX, 4);

  const outerStart = { x: x1, y: baseY };
  const outerEnd = { x: x2, y: baseY };
  const innerStart = { x: x2 - endpointInsetX, y: baseY + sign * tipThickness };
  const innerEnd = { x: x1 + endpointInsetX, y: baseY + sign * tipThickness };

  const c1x = x1 + dx * 0.28;
  const c2x = x1 + dx * 0.72;
  const outerPeakY = baseY + sign * archHeight;

  const innerC1x = x1 + dx * 0.32;
  const innerC2x = x1 + dx * 0.68;
  const innerArchHeight = Math.max(archHeight - bodyThickness * 0.85, tipThickness * 1.2);
  const innerCurveY = baseY + sign * innerArchHeight;

  const outerTipControlStart = x2 - endpointInsetX * 0.35;
  const outerTipControlMid = x2 - endpointInsetX * 0.7;
  const outerTipControlEnd = x1 + endpointInsetX * 0.35;
  const outerTipControlStartLeft = x1 + endpointInsetX * 0.7;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `C ${c1x} ${outerPeakY}, ${c2x} ${outerPeakY}, ${outerEnd.x} ${outerEnd.y}`,
    `C ${outerTipControlStart} ${outerStart.y}, ${outerTipControlMid} ${outerStart.y + sign * tipThickness}, ${innerStart.x} ${innerStart.y}`,
    `C ${innerC2x} ${innerCurveY}, ${innerC1x} ${innerCurveY}, ${innerEnd.x} ${innerEnd.y}`,
    `C ${outerTipControlStartLeft} ${innerEnd.y}, ${outerTipControlEnd} ${outerEnd.y}, ${outerStart.x} ${outerStart.y}`,
    'Z',
  ].join(' ');
}

export function getSlurTieShapePath({
  start,
  end,
  direction,
  type = 'slur',
}) {
  return slurClosedPathD({
    start,
    end,
    direction,
    type,
  });
}

function SlurTiePath({
  start,
  end,
  type = 'slur',
  direction,
  className,
  active = false,
  selected = false,
}) {
  const d = getSlurTieShapePath({
    start,
    end,
    direction,
    type,
  });

  // Hover/select renkleri notalarla / voltalarla / aksidentallerle aynı mavi tema
  const activeColor = selected ? '#2563eb' : active ? '#3b82f6' : 'currentColor';
  const activeOpacity = selected ? 1 : active ? 0.92 : 0.75;

  return (
    <path
      d={d}
      fill={activeColor}
      fillOpacity={activeOpacity}
      stroke="none"
      shapeRendering="geometricPrecision"
      className={className || (type === 'tie' ? 'muzik-tie-shape-thin' : 'muzik-slur-shape-thin')}
    />
  );
}

export default SlurTiePath;
