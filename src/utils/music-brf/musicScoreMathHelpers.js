import { MUZIK_PITCH_Y } from '../../utils/music/index.js';
import {
  SVG_STAFF_LEFT_X,
  SVG_STAFF_RIGHT_X,
  MUZIK_CLEF_VISUAL_Y_OFFSETS,
  MUZIK_CLEF_MIDDLE_C_Y,
} from './musicConstants.js';

const SVG_DIATONIC_STEP = 6;
const SVG_MIDDLE_C_Y = 124;

const NOTA_DIATONIC_INDEX = {
  do: 0,
  re: 1,
  mi: 2,
  fa: 3,
  sol: 4,
  la: 5,
  si: 6,
};

export const clampSvg = (value, min, max) => Math.max(min, Math.min(max, value));

export const muzikAnahtarTipiAl = (anahtar) => {
  const ad = String(anahtar?.ad || '').toLowerCase();

  if (/fa|bass/i.test(ad)) return 'bass';
  if (/tenor/i.test(ad)) return 'tenor';
  if (/do|alto/i.test(ad)) return 'alto';
  if (/sol|treble/i.test(ad)) return 'treble';

  return 'default';
};

export const anahtarYOffsetAl = (anahtar) => {
  const tip = muzikAnahtarTipiAl(anahtar);
  return MUZIK_CLEF_VISUAL_Y_OFFSETS[tip] ?? MUZIK_CLEF_VISUAL_Y_OFFSETS.default ?? 0;
};

export const varsayilanOktavAnahtaraGoreAl = (anahtar) => {
  const tip = muzikAnahtarTipiAl(anahtar);
  if (tip === 'bass') return 3;
  return 4;
};

export const notaYHesapla = (oge, anahtar = null) => {
  if (!oge || oge.tip !== 'nota') return 100;

  const notaAd = String(oge.notaAd || '').toLowerCase();
  const notaIndex = NOTA_DIATONIC_INDEX[notaAd];

  if (!Number.isFinite(notaIndex)) {
    return MUZIK_PITCH_Y?.[oge.notaAd] || 100;
  }

  const oktavDegeri = Number(oge.oktav);
  const oktav = Number.isFinite(oktavDegeri) && oktavDegeri >= 1 && oktavDegeri <= 7
    ? oktavDegeri
    : 4;
  const toplamDiatonikAdim = (oktav - 4) * 7 + notaIndex;
  const tip = muzikAnahtarTipiAl(anahtar);
  const middleCY = MUZIK_CLEF_MIDDLE_C_Y[tip] ?? MUZIK_CLEF_MIDDLE_C_Y.default ?? SVG_MIDDLE_C_Y;

  return middleCY - toplamDiatonikAdim * SVG_DIATONIC_STEP;
};

export const notaGorselYHesapla = (oge, anahtar = null) => notaYHesapla(oge, anahtar);

export const notaGorselYClampEdildiMi = () => false;

export const bagYonunuHesapla = (basOge, sonOge, anahtar = null) => {
  const basY = basOge?.tip === 'nota' ? notaYHesapla(basOge, anahtar) : 88;
  const sonY = sonOge?.tip === 'nota' ? notaYHesapla(sonOge, anahtar) : 88;
  const ortalamaY = (basY + sonY) / 2;

  if (ortalamaY > 88) return 'below';
  return 'above';
};

export const bagCizimNoktalari = (
  basOge,
  sonOge,
  basYer,
  sonYer,
  satirIdx,
  ogeXHesapla,
  anahtar = null,
  options = {},
) => {
  const yFn = options.visualClamp ? notaGorselYHesapla : notaYHesapla;
  const basY = basOge?.tip === 'nota' ? yFn(basOge, anahtar) : 88;
  const sonY = sonOge?.tip === 'nota' ? yFn(sonOge, anahtar) : 88;

  const start = {
    x: basYer.satirIdx === satirIdx ? ogeXHesapla(basOge.id) : SVG_STAFF_LEFT_X,
    y: basYer.satirIdx === satirIdx ? basY : sonY,
  };

  const end = {
    x: sonYer.satirIdx === satirIdx ? ogeXHesapla(sonOge.id) : SVG_STAFF_RIGHT_X,
    y: sonYer.satirIdx === satirIdx ? sonY : basY,
  };

  return {
    start: {
      ...start,
      x: clampSvg(start.x, SVG_STAFF_LEFT_X, SVG_STAFF_RIGHT_X),
    },
    end: {
      ...end,
      x: clampSvg(end.x, SVG_STAFF_LEFT_X, SVG_STAFF_RIGHT_X),
    },
  };
};
