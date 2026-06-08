import {
  BRAVURA_FONT,
  NOTEHEAD_CP,
  NOTEHEAD_CENTER_X,
  glyphChar,
} from '../../../utils/music-brf/bravuraMetrics.js';

// Nota kafası — standalone Bravura SMuFL glyph'i + resmi metadata konumu.
//
// Standalone Bravura'da noteheadBlack/Half merkezi TAM baseline'dadır (bbox ±0.5),
// yani dikey ofset gerekmez (Bravura Text'in metin-kaydırması yoktu). Konum/boyut
// bravura_metadata.json'dan türetilir (bkz. bravuraMetrics.js).
//
// FONT_SIZE = 40 (SABİT — kullanıcı isteği: nota ASLA büyütülmeyecek).
// UPS = F/4; sap bağlantısı 0.59·UPS ≈ 5.9 (Stem/Flag'in 5.8'i ile uyumlu).
const FONT_SIZE = 40;
const UPS = FONT_SIZE / 4;                  // units per staff space
const CENTER_DX = NOTEHEAD_CENTER_X * UPS;   // yatay merkezleme
// Standalone Bravura ink merkezi baseline'ın 0.0042em ÜSTÜNDE (canvas ölçümü);
// baseline'ı bu kadar AŞAĞI alıp ink merkezini tam çizgiye/boşluk-ortasına oturt.
const CENTER_DY = 0.0042 * FONT_SIZE;

function NoteHead({ x, y, hollow = false, scaleY = 1 }) {
  const glyph = glyphChar(hollow ? NOTEHEAD_CP.half : NOTEHEAD_CP.black);

  // Yatay: glyph origin solda (bbox x:0..1.18); bbox merkezini x'e getir.
  // Dikey: ink merkezi (baseline+CENTER_DY) tam y'ye gelir.
  // Karşı-ölçek: ink merkezi (y) etrafında dikeyde aç → squash giderilir, konum sabit.
  const transform = `translate(0 ${y}) scale(1 ${scaleY}) translate(0 ${-y})`;

  return (
    <text
      x={x - CENTER_DX}
      y={y + CENTER_DY}
      textAnchor="start"
      transform={transform}
      className="fill-zinc-900 select-none"
      style={{
        fontFamily: BRAVURA_FONT,
        fontSize: `${FONT_SIZE}px`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {glyph}
    </text>
  );
}

export default NoteHead;
