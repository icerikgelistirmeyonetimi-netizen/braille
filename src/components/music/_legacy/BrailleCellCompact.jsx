import React from 'react';
import { BRAILLE_DOT_COORDS_COMPACT } from '../../utils/music-brf/musicConstants.js';
import { brailleAnlamMetniAl } from '../../utils/music-brf/brailleText.js';
import {
  brailleBagKisaEtiketiAl,
  brailleIsNoteMeaning,
  brailleNoteLabel,
  brailleColorForMeaning,
  brailleTooltipAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import {
  BRAILLE_ACTIVE_GREEN,
  BRAILLE_ACTIVE_GREEN_BG,
  BRAILLE_ACTIVE_GREEN_BG_STRONG,
  brailleHexToRgba,
} from '../../utils/music-brf/brailleColors.js';

const BrailleCellCompact = React.memo(function BrailleCellCompact({
  dots = [],
  anlam,
  hoverAktif = false,
  seciliAktif = false,
  onEnter,
  onLeave,
  onClick,
  index = 0,
}) {
  const noteLike = brailleIsNoteMeaning(anlam);
  const noteLabel = noteLike ? brailleNoteLabel(anlam) : '';
  const bagLabel = !noteLike ? brailleBagKisaEtiketiAl(anlam) : '';
  const color = brailleColorForMeaning(anlam);
  const backgroundColor = brailleHexToRgba(color.fill, noteLike ? 0.08 : 0.12);

  const aktif = hoverAktif || seciliAktif;
  const aktifArkaPlan = seciliAktif ? BRAILLE_ACTIVE_GREEN_BG_STRONG : BRAILLE_ACTIVE_GREEN_BG;
  const pasifNoktaRengi = '#d1d5db';
  const label = noteLike ? noteLabel : bagLabel;

  return (
    <div
      style={{
        width: 54,
        minHeight: 68,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 4,
        boxSizing: 'border-box',
        marginLeft: index > 0 ? -1 : 0,
        cursor: onClick ? 'pointer' : 'default',
        outline: 'none',
        boxShadow: 'none',
        transform: aktif ? 'translateY(-1px)' : 'none',
      }}
      title={brailleTooltipAl(anlam)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      <div
        style={{
          width: 54,
          minHeight: 54,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
          borderRadius: 0,
          backgroundColor: aktif ? aktifArkaPlan : backgroundColor,
          border: `1px solid ${brailleHexToRgba(color.fill, 0.22)}`,
        }}
      >
        <svg
          width="28"
          height="40"
          viewBox="0 0 28 40"
          aria-hidden="true"
          style={{
            display: 'block',
            overflow: 'visible',
            flex: '0 0 auto',
          }}
        >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((dotNo) => {
          const [cx, cy] = BRAILLE_DOT_COORDS_COMPACT[dotNo];
          const aktifDot = Array.isArray(dots) && dots.includes(dotNo);
          const noktaRengi = aktifDot ? (aktif ? BRAILLE_ACTIVE_GREEN : color.fill) : pasifNoktaRengi;

          return (
            <circle
              key={dotNo}
              cx={cx}
              cy={cy}
              r={aktifDot ? 2.7 : 2.2}
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
            lineHeight: 1.1,
            color: '#334155',
            textAlign: 'center',
            whiteSpace: 'nowrap',
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

export default BrailleCellCompact;
