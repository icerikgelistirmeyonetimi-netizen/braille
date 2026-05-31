// BeamLine.jsx
// Baskı notasına yakın beam şeridi.
// Referans görseldeki gibi ana beam kalın, alt beamler hafif daha ince.

function getBeamThickness(beamLevel) {
  if (beamLevel >= 4) return 2.95;
  if (beamLevel === 3) return 3.05;
  if (beamLevel === 2) return 3.2;
  return 3.35;
}

function BeamLine({ x1, y1, x2, y2, beamLevel = 1 }) {
  const height = getBeamThickness(beamLevel);

  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  const startX = x1;
  const startY = y1;
  const endX = x2;
  const endY = y2;

  const nx = (-dy / length) * (height / 2);
  const ny = (dx / length) * (height / 2);

  const points = [
    `${startX + nx},${startY + ny}`,
    `${endX + nx},${endY + ny}`,
    `${endX - nx},${endY - ny}`,
    `${startX - nx},${startY - ny}`,
  ].join(' ');

  return (
    <polygon
      points={points}
      className="fill-zinc-900"
      shapeRendering="geometricPrecision"
    />
  );
}

export default BeamLine;