import { BRAVURA_FONT, ACCIDENTAL_CP, glyphChar } from '../../../utils/music-brf/bravuraMetrics.js';

// Aksidental — standalone Bravura SMuFL glyph'i (sharp E262, flat E260, natural E261…).
// SMuFL origin nota perdesinin çizgisinde → baseline = y (perde). Dikey squash
// .muzik-accidental-glyph CSS'iyle (transform-origin:center) açılır.
//
// FONT_SIZE 35: SMuFL-native (48) yerine biraz küçük → sharp ~2.3 staff space
// (nota kafasının ~2.3 katı; yayınlanmış skor oranı). textAnchor="end": gelen x
// glyph'in SAĞ kenarıdır → notaya olan boşluk glyph boyutundan bağımsız sabit kalır.
const FONT_SIZE = 35;

function AccidentalGlyph({ accidental, x, y }) {
  const cp = ACCIDENTAL_CP[accidental];
  if (cp == null) return null;
  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      className="muzik-accidental-glyph select-none fill-zinc-900"
      style={{
        fontFamily: BRAVURA_FONT,
        fontSize: `${FONT_SIZE}px`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {glyphChar(cp)}
    </text>
  );
}

export default AccidentalGlyph;
