import React from 'react';

export default function MuzikTimeSignatureGlyph({
  value,
  x,
  yTop = 84,
  yBottom = 108,
  ySymbol = 101,
  className = 'muzik-time-sig',
}) {
  const ts = String(value || '').toLowerCase().trim();

  if (!ts) return null;

  if (ts === 'common' || ts === 'c') {
    return (
      <g className={className}>
        <rect
          x={x - 18}
          y={66}
          width={36}
          height={56}
          rx={8}
          className="muzik-note-hover-rect"
        />
        <text
          x={x}
          y={ySymbol}
          textAnchor="middle"
          className="muzik-time-sig-glyph"
        >
          C
        </text>
      </g>
    );
  }

  if (ts === 'cut common' || ts === 'cut c' || ts === '𝄵') {
    return (
      <g className={className}>
        <rect
          x={x - 18}
          y={66}
          width={36}
          height={56}
          rx={8}
          className="muzik-note-hover-rect"
        />
        <text
          x={x}
          y={ySymbol}
          textAnchor="middle"
          className="muzik-time-sig-glyph"
        >
          𝄵
        </text>
      </g>
    );
  }

  const parts = String(value || '').split('/');

  if (parts.length !== 2) return null;

  return (
    <g className={className}>
      <rect
        x={x - 18}
        y={66}
        width={36}
        height={56}
        rx={8}
        className="muzik-note-hover-rect"
      />
      <text
        x={x}
        y={yTop}
        textAnchor="middle"
        className="muzik-time-sig-num"
      >
        {parts[0]}
      </text>
      <text
        x={x}
        y={yBottom}
        textAnchor="middle"
        className="muzik-time-sig-num"
      >
        {parts[1]}
      </text>
    </g>
  );
}
