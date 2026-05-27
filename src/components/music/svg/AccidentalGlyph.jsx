function AccidentalGlyph({ accidental, x, y }) {
  const map = {
    sharp: '♯',
    flat: '♭',
    natural: '♮',
    doubleSharp: '𝄪',
    doubleFlat: '𝄫',
  };
  return (
    <text
      x={x}
      y={y + 5}
      textAnchor="middle"
      className="select-none fill-zinc-900 text-[22px] font-medium"
      style={{ fontFamily: 'serif' }}
    >
      {map[accidental] || ''}
    </text>
  );
}

export default AccidentalGlyph;
