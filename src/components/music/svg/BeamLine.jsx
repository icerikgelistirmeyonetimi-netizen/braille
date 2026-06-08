// BeamLine.jsx
// Baskı notasına yakın beam şeridi.
// Referans görseldeki gibi ana beam kalın, alt beamler hafif daha ince.

// SMuFL engravingDefaults.beamThickness = 0.5 staff space (×12 = 6) — tüm beam'ler
// tek tip kalınlıkta (standart). Aralık getBeamGap'te beamSpacing'e göre açıldı.
function getBeamThickness() {
  return 6;
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