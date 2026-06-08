import {
  BRAVURA_FONT,
  FLAG_UP_CP,
  FLAG_DOWN_CP,
  FLAG_UP_ANCHOR,
  FLAG_DOWN_ANCHOR,
  glyphChar,
  flagIndex,
} from '../../../utils/music-brf/bravuraMetrics.js';

// Nota bayrağı — standalone Bravura SMuFL glyph'i + resmi anchor konumu.
//
// Her süre için AYRI glyph (flag8thUp E240, flag16thUp E242, … tüm çengeller tek
// glyph içinde) — eski istifleme/flip yöntemi yok. Glyph, sapın ucuna kendi
// stemUpNW / stemDownSW anchor'ı ile hassas oturur (bravura_metadata.json).
//
// ROLLBACK: USE_FONT_FLAGS = false → eski bezier path (FlagSvg).
const USE_FONT_FLAGS = true;

const FONT_SIZE = 40;          // nota kafası ile aynı UPS (1 staff space = 10)
const UPS = FONT_SIZE / 4;
const STEM_LENGTH = 42;
const STEM_HALF_W = 5.8;       // Stem.jsx ile uyumlu sap-x ofseti

function FlagFont({ x, y, direction, flagCount, stemLength, glyphScaleY = 1 }) {
  const length   = stemLength ?? STEM_LENGTH;
  const idx      = flagIndex(flagCount);
  const up       = direction === 'up';
  const stemX    = up ? x + STEM_HALF_W : x - STEM_HALF_W;
  const stemTipY = up ? y - length : y + length;

  const cp     = (up ? FLAG_UP_CP : FLAG_DOWN_CP)[idx];
  const anchor = (up ? FLAG_UP_ANCHOR : FLAG_DOWN_ANCHOR)[idx]; // [ax, ay] staff space

  // Glyph origin'i, anchor noktası sap ucuna (stemX, stemTipY) gelecek şekilde yerleştir.
  //   svgX(anchor) = gx + ax·UPS = stemX  → gx = stemX - ax·UPS
  //   svgY(anchor) = gy - ay·UPS = stemTipY → gy = stemTipY + ay·UPS   (y ters)
  const gx = stemX - anchor[0] * UPS;
  const gy = stemTipY + anchor[1] * UPS;

  // Karşı-ölçek: sap ucu (anchor=stemTipY) etrafında dikeyde aç → squash giderilir,
  // bağlantı sabit kalır.
  const transform = `translate(0 ${stemTipY}) scale(1 ${glyphScaleY}) translate(0 ${-stemTipY})`;

  return (
    <g transform={transform}>
      <text
        x={gx}
        y={gy}
        textAnchor="start"
        className="fill-zinc-900 select-none"
        style={{
          fontFamily: BRAVURA_FONT,
          fontSize: `${FONT_SIZE}px`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {glyphChar(cp)}
      </text>
    </g>
  );
}

// ── Eski SVG bezier path (yedek) ──────────────────────────────────────────
function FlagSvg({ x, y, direction, flagCount, stemLength }) {
  const length = stemLength ?? STEM_LENGTH;
  const gap = 6;
  const up = direction === 'up';
  const stemX = up ? x + 5.8 : x - 5.8;
  const tipY = up ? y - length : y + length;
  return (
    <>
      {Array.from({ length: Math.max(1, flagCount) }).map((_, i) => {
        const off = up ? i * gap : -i * gap;
        const flagY = up ? tipY + off : tipY + off;
        return up ? (
          <path
            key={i}
            d={`M ${stemX} ${flagY} C ${stemX + 10} ${flagY + 3}, ${stemX + 14} ${flagY + 10}, ${stemX + 7} ${flagY + 17}`}
            className="fill-none stroke-zinc-900"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            key={i}
            d={`M ${stemX} ${flagY} C ${stemX - 10} ${flagY - 3}, ${stemX - 14} ${flagY - 10}, ${stemX - 7} ${flagY - 17}`}
            className="fill-none stroke-zinc-900"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
    </>
  );
}

function Flag(props) {
  return USE_FONT_FLAGS ? <FlagFont {...props} /> : <FlagSvg {...props} />;
}

export default Flag;
