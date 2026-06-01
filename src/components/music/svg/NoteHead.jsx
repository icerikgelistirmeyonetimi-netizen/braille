// SMuFL müzik nota kafası karakterleri — Bravura Text fontundan
// U+E0A4 noteheadBlack  (dolu, dörtlük ve altı)
// U+E0A3 noteheadHalf   (hollow oval, yarım ve tam)
// Font-size 48px: SMuFL 1em = 4 porte aralığı, aralık=12px → 48px=12px/aralık
const BRAVURA = "'Bravura Text', 'Cambria Math', 'Noto Music', serif";
const NOTE_HEAD_FONT_SIZE = 48;
const GLYPH_BLACK = String.fromCodePoint(0xE0A4); // SMuFL noteheadBlack
const GLYPH_VOID  = String.fromCodePoint(0xE0A3); // SMuFL noteheadHalf

function NoteHead({ x, y, hollow = false }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="central"
      className="select-none fill-zinc-900"
      style={{
        fontFamily: BRAVURA,
        fontSize: `${NOTE_HEAD_FONT_SIZE}px`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {hollow ? GLYPH_VOID : GLYPH_BLACK}
    </text>
  );
}

export default NoteHead;
