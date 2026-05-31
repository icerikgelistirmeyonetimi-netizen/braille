import React from 'react';

// Tek bir rakamı SMuFL müzik fontu zaman imzası glifine çevirir
// (U+E080–U+E089 = timeSig0–timeSig9).
function smuflRakam(ch) {
  if (ch >= '0' && ch <= '9') {
    return String.fromCodePoint(0xE080 + (ch.charCodeAt(0) - 48));
  }
  return ch;
}

// SMuFL zaman imzası glifleri sıfır ilerleme genişliğine (advance) sahip
// olduğundan, bir text içine birden çok rakam konunca üst üste binerler.
// Bu yüzden her rakam ayrı <text> olarak, sabit aralıkla ve grup ortalı
// biçimde yerleştirilir.
const RAKAM_ARALIGI = 17; // user unit — komşu rakam merkezleri arası

function ZamanRakamSatiri({ metin, x, y }) {
  const s = String(metin || '');
  const n = s.length;
  if (n === 0) return null;
  return s.split('').map((ch, i) => (
    <text
      key={i}
      x={x + (i - (n - 1) / 2) * RAKAM_ARALIGI}
      y={y}
      textAnchor="middle"
      className="muzik-time-sig-digit"
    >
      {smuflRakam(ch)}
    </text>
  ));
}

export default function MuzikTimeSignatureGlyph({
  value,
  x,
  yTop = 76,
  yBottom = 100,
  ySymbol = 101,
  className = 'muzik-time-sig',
  hoverRectClass = 'muzik-note-hover-rect',
}) {
  const ts = String(value || '').toLowerCase().trim();

  if (!ts) return null;

  // Hover çerçevesi yalnızca bir sınıf verildiğinde çizilir. Boş bırakılırsa
  // (örn. header zaman imzası kendi standart çerçevesini kullanır) hiç render
  // edilmez — aksi halde sınıfsız <rect> SVG varsayılanıyla siyah dolgulu olur.
  const hoverRect = hoverRectClass ? (
    <rect x={x - 18} y={66} width={36} height={56} rx={8} className={hoverRectClass} />
  ) : null;

  if (ts === 'common' || ts === 'c') {
    return (
      <g className={className}>
        {hoverRect}
        <text
          x={x}
          y={ySymbol}
          textAnchor="middle"
          className="muzik-time-sig-glyph"
        >
          {String.fromCodePoint(0x1D134)}
        </text>
      </g>
    );
  }

  if (ts === 'cut common' || ts === 'cut c' || ts === String.fromCodePoint(0x1D135)) {
    return (
      <g className={className}>
        {hoverRect}
        <text
          x={x}
          y={ySymbol}
          textAnchor="middle"
          className="muzik-time-sig-glyph"
        >
          {String.fromCodePoint(0x1D135)}
        </text>
      </g>
    );
  }

  const parts = String(value || '').split('/');

  if (parts.length !== 2) return null;

  return (
    <g className={className}>
      {hoverRect}
      <ZamanRakamSatiri metin={parts[0]} x={x} y={yTop} />
      <ZamanRakamSatiri metin={parts[1]} x={x} y={yBottom} />
    </g>
  );
}
