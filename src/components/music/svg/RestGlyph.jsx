// Dinlenme (sus) işaretleri için
const glyphMap = {
  1: '𝄻',   // tam sus
  2: '𝄼',   // yarım sus
  4: '𝄽',   // dörtlük sus
  8: '𝄾',   // sekizlik sus
  16: '𝄿',
  32: '𝅀',
  64: '𝅁',
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
      {!isAuto && (
        <rect
          x={x - 20}
          y={72}
          width={40}
          height={48}
          rx={10}
          className="muzik-note-hover-rect"
        />
      )}
      <text
        x={x}
        y={102}
        textAnchor="middle"
        className="select-none fill-zinc-900 text-[26px]"
        style={{ fontFamily: 'serif' }}
      >
        {glyph}
      </text>
      {item.dotted && (
        <circle cx={x + 14} cy={96} r={2.1} className="fill-zinc-900" />
      )}
    </g>
  );
}

export default RestGlyph;
