import { BRAVURA_FONT, REST_CP, REST_STAFF_Y, glyphChar } from '../../../utils/music-brf/bravuraMetrics.js';

// Sus (rest) — standalone Bravura SMuFL glyph'i (nota kafası/bayrakla aynı standart).
//   whole E4E3, half E4E4, quarter E4E5, 8th E4E6, 16th E4E7, 32nd E4E8, 64th E4E9.
// SMuFL origin porte referansındadır; baseline = REST_STAFF_Y (whole 4. çizgiden asılır
// = 76; diğerleri orta çizgi = 88). Dikey squash .muzik-rest-glyph CSS'iyle açılır.
const FONT_SIZE = 40;

function RestGlyph({ item, x, onClick, autoRest }) {
  const real = item.realValue;
  const cp = REST_CP[real] || REST_CP[4];
  const y = REST_STAFF_Y[real] ?? 88;
  const isAuto = Boolean(item.autoRest || item.otomatik || autoRest);

  return (
    <g
      className={isAuto ? 'opacity-60' : 'cursor-pointer'}
      onClick={isAuto ? undefined : onClick}
      pointerEvents={isAuto ? 'none' : undefined}
    >
      <text
        x={x}
        y={y}
        textAnchor="middle"
        className="muzik-rest-glyph select-none fill-zinc-900"
        style={{
          fontFamily: BRAVURA_FONT,
          fontSize: `${FONT_SIZE}px`,
        }}
      >
        {glyphChar(cp)}
      </text>
      {item.dotted && (
        <circle cx={x + 13} cy={y - 6} r={2.4} className="fill-zinc-900" />
      )}
    </g>
  );
}

export default RestGlyph;
