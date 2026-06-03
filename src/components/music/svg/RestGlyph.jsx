// Dinlenme (sus) işaretleri — Unicode müzik sembolleri (U+1D13x). Uygulamadaki
// font alt-kümesi SMuFL sus gliflerini (E4Ex) içermediğinden bunlar fallback
// font (Cambria Math / Noto Music) ile çizilir.
//   U+1D13B 𝄻 tam · U+1D13C 𝄼 yarım · U+1D13D 𝄽 dörtlük · U+1D13E 𝄾 sekizlik
//   U+1D13F 𝄿 16 · U+1D140 𝅀 32 · U+1D141 𝅁 64
const glyphMap = {
  1:  String.fromCodePoint(0x1D13B),
  2:  String.fromCodePoint(0x1D13C),
  4:  String.fromCodePoint(0x1D13D),
  8:  String.fromCodePoint(0x1D13E),
  16: String.fromCodePoint(0x1D13F),
  32: String.fromCodePoint(0x1D140),
  64: String.fromCodePoint(0x1D141),
};

// Porte çizgileri: 64,76,88,100,112 (orta=88, aralık=12). Alphabetic baseline.
// Değerler, glifin GERÇEK ink konumu (canvas piksel ölçümü) kullanılarak her
// sus tipinin standart porte konumuna oturması için hesaplandı:
//   • tam: blok 4. çizgiden (76) asılı  → baseline 78 (ink ≈ 77-81)
//   • yarım: blok orta çizgiye (88) oturur → baseline 85 (ink ≈ 84-88)
//   • dörtlük: orta çizgide dikey ortalı  → baseline 89 (ink ≈ 78-99)
//   • sekizlik ve kısa suslar: gövde 3. boşlukta, üst-orta
const REST_Y = {
  1:  78,  // tam
  2:  85,  // yarım
  4:  89,  // dörtlük
  8:  84,  // sekizlik
  16: 82,
  32: 81,
  64: 80,
};

// Porte çizgileri y = [64, 76, 88, 100, 112] (orta çizgi = 88, aralık = 12).
// Sus glifinin dikey konumu tipine göre değişir (dominantBaseline:central → y
// glifin görsel merkezidir):
//   • Tam sus (1): 4. çizginin (y=76) altına asılır.
function RestGlyph({ item, x, onClick, autoRest }) {
  const real = item.realValue;
  const glyph = glyphMap[real] || String.fromCodePoint(0x1D13D);
  const y = REST_Y[real] ?? 94;
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
        className="select-none fill-zinc-900 text-[36px]"
        style={{ fontFamily: "'Bravura Text', 'Cambria Math', 'Noto Music', serif" }}
      >
        {glyph}
      </text>
      {item.dotted && (
        <circle cx={x + 16} cy={y - 12} r={2.4} className="fill-zinc-900" />
      )}
    </g>
  );
}

export default RestGlyph;
