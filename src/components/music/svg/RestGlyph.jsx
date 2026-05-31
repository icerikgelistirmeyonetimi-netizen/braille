// Dinlenme (sus) işaretleri için — Unicode müzik karakterleri (Bravura Text destekler)
//   U+1D13B 𝄻 whole rest
//   U+1D13C 𝄼 half rest
//   U+1D13D 𝄽 quarter rest
//   U+1D13E 𝄾 eighth rest
//   U+1D13F 𝄿 16th rest
//   U+1D140 𝅀 32nd rest
//   U+1D141 𝅁 64th rest
const glyphMap = {
  1:  String.fromCodePoint(0x1D13B),
  2:  String.fromCodePoint(0x1D13C),
  4:  String.fromCodePoint(0x1D13D),
  8:  String.fromCodePoint(0x1D13E),
  16: String.fromCodePoint(0x1D13F),
  32: String.fromCodePoint(0x1D140),
  64: String.fromCodePoint(0x1D141),
};

function RestGlyph({ item, x, onClick, autoRest }) {
  const real = item.realValue;
  const glyph = glyphMap[real] || '𝄽';
  const isAuto = Boolean(item.autoRest || item.otomatik || autoRest);

  return (
    <g
      className={isAuto ? 'opacity-60' : 'cursor-pointer'}
      onClick={isAuto ? undefined : onClick}
      pointerEvents={isAuto ? 'none' : undefined}
    >
      <text
        x={x}
        y={104}
        textAnchor="middle"
        className="select-none fill-zinc-900 text-[36px]"
        style={{ fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif" }}
      >
        {glyph}
      </text>
      {item.dotted && (
        <circle cx={x + 16} cy={96} r={2.4} className="fill-zinc-900" />
      )}
    </g>
  );
}

export default RestGlyph;
