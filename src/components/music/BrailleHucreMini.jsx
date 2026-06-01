import React from 'react';
import { BRAILLE_HUCRE_TEMA } from '../../utils/music-brf/musicConstants.js';
import {
  brailleAnlamOgeIdAl,
  brailleBagKisaEtiketiAl,
  brailleKategoriAl,
  brailleKisaCellLabelAl,
  getBrailleItemLabel,
  brailleNotaEtiketiAl,
  brailleRenkAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import { brailleAnlamMetni } from '../../utils/music-brf/brailleText.js';
import {
  BRAILLE_NOTA_STILI,
  BRAILLE_ACTIVE_GREEN,
  BRAILLE_ACTIVE_GREEN_BG,
  BRAILLE_ACTIVE_GREEN_BG_STRONG,
  brailleHexToRgba,
} from '../../utils/music-brf/brailleColors.js';

const BrailleHucreMini = React.memo(function BrailleHucreMini({
  noktalar = [],
  anlam,
  renkStil,
  yerlesim,
  hoverAktif = false,
  seciliAktif = false,
  onEnter,
  onLeave,
  onClick,
  index = 0,
  etiketGizle = false,
}) {
  const kategori = brailleKategoriAl(anlam);
  const notaMi = kategori === 'nota';
  const bagMi = kategori === 'bag';
  const susMu = kategori === 'sus';
  const oktavMi = kategori === 'oktav';
  const accidentalMi = kategori === 'accidental';
  const dotMu = (anlam?.kaynak === 'dot');
  const dinamikMi = kategori === 'dynamic';
  const notaEtiketi = notaMi ? brailleNotaEtiketiAl(anlam) : '';
  const bagEtiketi = bagMi ? brailleBagKisaEtiketiAl(anlam) : '';
  const susEtiketi = susMu ? getBrailleItemLabel(anlam) : '';
  // Oktav, aksidental, nokta ve dinamik için KISA etiket (5 / ♯ / · / p / f vb.)
  const kisaEtiketi = (oktavMi || accidentalMi || dotMu || dinamikMi)
    ? brailleKisaCellLabelAl(anlam)
    : '';
  const stil = notaMi ? BRAILLE_NOTA_STILI : (renkStil || brailleRenkAl(anlam));
  const cfg = yerlesim?.cfg || BRAILLE_HUCRE_TEMA.normal;
  const zeminRengi = brailleHexToRgba(stil.fill, notaMi ? 0.08 : 0.12);
  const aktifArkaPlan = seciliAktif ? BRAILLE_ACTIVE_GREEN_BG_STRONG : BRAILLE_ACTIVE_GREEN_BG;
  const pasifNoktaRengi = '#d1d5db';

  const coords = {
    1: [cfg.col1, cfg.rows[0]],
    2: [cfg.col1, cfg.rows[1]],
    3: [cfg.col1, cfg.rows[2]],
    4: [cfg.col2, cfg.rows[0]],
    5: [cfg.col2, cfg.rows[1]],
    6: [cfg.col2, cfg.rows[2]],
  };

  const aktif = hoverAktif || seciliAktif;
  const label = etiketGizle
    ? ''
    : (notaMi
      ? notaEtiketi
      : (bagMi
        ? bagEtiketi
        : (susMu
          ? susEtiketi
          : kisaEtiketi)));

  // Mavi hover/select tema (notalarla / volta ile aynı stil)
  const hoverMavi   = 'rgba(59,130,246,0.10)';
  const seciliMavi  = 'rgba(59,130,246,0.18)';
  const hoverStroke = '#3b82f6';

  return (
    <div
      title={(susMu || oktavMi) ? getBrailleItemLabel(anlam) : brailleAnlamMetni(anlam)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        width: cfg.cellW,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        boxSizing: 'border-box',
        marginLeft: index > 0 ? 2 : 0,
        // onClick yoksa sarmalayıcı span'in (pointer) imlecini devral.
        cursor: onClick ? 'pointer' : 'inherit',
        outline: 'none',
        boxShadow: 'none',
        transition: 'filter 120ms ease',
        filter: aktif ? 'drop-shadow(0 1px 3px rgba(59,130,246,0.25))' : 'none',
      }}
    >
      <div
        style={{
          width: cfg.cellW,
          minHeight: yerlesim?.satirSayisi > 1 ? 34 : 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          borderRadius: 6,
          backgroundColor: seciliAktif ? seciliMavi
            : hoverAktif ? hoverMavi
            : zeminRengi,
          boxShadow: aktif ? 'inset 0 0 0 1px rgba(255,255,255,0.4)' : 'none',
          border: `${seciliAktif ? 1.6 : hoverAktif ? 1.4 : 1}px ${hoverAktif && !seciliAktif ? 'dashed' : 'solid'} ${
            hoverAktif || seciliAktif ? hoverStroke : brailleHexToRgba(stil.fill, 0.28)
          }`,
          transition: 'background-color 120ms ease, border-color 120ms ease',
        }}
      >
        <svg
          width={cfg.svgW}
          height={cfg.svgH}
          viewBox={`0 0 ${cfg.svgW} ${cfg.svgH}`}
          aria-hidden="true"
          style={{
            display: 'block',
            overflow: 'visible',
            flex: '0 0 auto',
          }}
        >
        {[1, 2, 3, 4, 5, 6].map((dotNo) => {
          const [cx, cy] = coords[dotNo];
          const aktifDot = Array.isArray(noktalar) && noktalar.includes(dotNo);

          const noktaRengi = aktifDot
            ? (aktif ? BRAILLE_ACTIVE_GREEN : stil.fill)
            : pasifNoktaRengi;

          return (
            <circle
              key={dotNo}
              cx={cx}
              cy={cy}
              r={aktifDot ? cfg.activeR : cfg.passiveR}
              fill={noktaRengi}
              stroke="none"
            />
          );
        })}
      </svg>
      </div>

      {label ? (
        <div
          style={{
            marginTop: 2,
            fontSize: 11,
            lineHeight: 1,
            color: '#334155',
            textAlign: 'center',
            whiteSpace: 'nowrap',
            maxWidth: cfg.cellW,
            overflow: 'hidden',
            textOverflow: 'clip',
            userSelect: 'none',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
});

export default BrailleHucreMini;
