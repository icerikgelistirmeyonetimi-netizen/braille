/**
 * GraceNoteGlyph — Küçük süsleme notası (appoggiatura / acciaccatura)
 *
 * withSlash=false  → uzun appoggiatura  (sapsız çizgi yok)
 * withSlash=true   → kısa appoggiatura / acciaccatura (saptan geçen çizgi)
 *
 * Ana notanın soluna, biraz yukarısına yerleştirilir.
 * Standart engraving oranı: normal notanın ~%60'ı.
 */
function GraceNoteGlyph({ x, y, withSlash = false }) {
  // ── Boyutlar (normal notanın ~%60'ı) ───────────────────────────────────────
  const headRx  = 3.9;
  const headRy  = 2.7;
  const rotate  = -22;

  // ── Sap (yukarı yön) ───────────────────────────────────────────────────────
  const stemX  = x + 3.4;   // sap sağ kenarda
  const stemY1 = y - 1;     // sap alt ucu (kafa bitişi)
  const stemY2 = y - 28;    // sap üst ucu

  // ── Bayrak (8'lik nota gibi, tek bayrak) ────────────────────────────────────
  const flagStartX = stemX;
  const flagStartY = stemY2;

  // ── Küçük slur: grace → ana nota bağı ──────────────────────────────────────
  // x, y = grace nota konumu; slurEndX, slurEndY = ana notaya yakın nokta
  const slurEndX   = x + 16;  // ana nota merkezi yaklaşık 16 px sağda
  const slurEndY   = y + 4;

  return (
    <g pointerEvents="none" aria-hidden="true">
      {/* ── Nota kafası ──────────────────────────────────────────────────── */}
      <ellipse
        cx={x}
        cy={y}
        rx={headRx}
        ry={headRy}
        transform={`rotate(${rotate} ${x} ${y})`}
        fill="#1c1c1c"
        stroke="#1c1c1c"
        strokeWidth={0.4}
      />

      {/* ── Sap ──────────────────────────────────────────────────────────── */}
      <line
        x1={stemX} y1={stemY1}
        x2={stemX} y2={stemY2}
        stroke="#1c1c1c"
        strokeWidth={1.25}
        strokeLinecap="round"
      />

      {/* ── Bayrak (tek) ─────────────────────────────────────────────────── */}
      <path
        d={`M ${flagStartX} ${flagStartY}
            C ${flagStartX + 7} ${flagStartY + 2},
              ${flagStartX + 9} ${flagStartY + 7},
              ${flagStartX + 5} ${flagStartY + 12}`}
        fill="none"
        stroke="#1c1c1c"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* ── Acciaccatura çizgisi (kısa appoggiatura) ─────────────────────── */}
      {withSlash && (
        <line
          x1={stemX - 6}  y1={stemY2 + 5}
          x2={stemX + 5}  y2={stemY2 - 5}
          stroke="#1c1c1c"
          strokeWidth={1.2}
          strokeLinecap="round"
        />
      )}

      {/* ── Grace → ana nota küçük slur ──────────────────────────────────── */}
      <path
        d={`M ${x + 2} ${y + headRy + 2}
            Q ${x + 9} ${y + 8},
              ${slurEndX} ${slurEndY}`}
        fill="none"
        stroke="#1c1c1c"
        strokeWidth={0.9}
        strokeLinecap="round"
        opacity={0.65}
      />
    </g>
  );
}

export default GraceNoteGlyph;
