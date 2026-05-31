function AccidentalGlyph({ accidental, x, y }) {
  // Standart Unicode müzik aksidental karakterleri (Bravura Text destekler):
  //   U+266F  ♯  Sharp
  //   U+266D  ♭  Flat
  //   U+266E  ♮  Natural
  //   U+1D12A 𝄪  Double sharp
  //   U+1D12B 𝄫  Double flat
  const map = {
    sharp: '♯',
    flat: '♭',
    natural: '♮',
    doubleSharp: String.fromCodePoint(0x1D12A),
    doubleFlat:  String.fromCodePoint(0x1D12B),
  };
  return (
    <text
      x={x}
      y={y + 5}
      textAnchor="middle"
      className="select-none fill-zinc-900 text-[22px] font-medium"
      style={{ fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif" }}
    >
      {map[accidental] || ''}
    </text>
  );
}

export default AccidentalGlyph;
