import { muzikHucreAnlamiKayittan } from '../../utils/music/index.js';
import {
  SVG_STAFF_LEFT_X,
  SVG_STAFF_RIGHT_X,
} from './musicConstants.js';
import {
  muzikAnahtarTipiAl,
  anahtarYOffsetAl,
  varsayilanOktavAnahtaraGoreAl,
  notaYHesapla,
  notaGorselYHesapla,
  notaGorselYClampEdildiMi,
  bagYonunuHesapla,
  bagCizimNoktalari,
  clampSvg,
} from './musicScoreMathHelpers.js';

export const STAFF_TOP_Y = 64;
export const STAFF_BOTTOM_Y = 112;

export function finalBarlineCizimOlculeri(x) {
  return {
    thinX: x - 4,
    thickX: x + 2,
    topY: STAFF_TOP_Y,
    bottomY: STAFF_BOTTOM_Y,
    thinWidth: 1.2,
    thickWidth: 3.5,
  };
}

export const anahtarYAl = (anahtar) => {
  const ad = String(anahtar?.ad || '').toLowerCase();

  if (/fa|bass/i.test(ad)) return 105;
  if (/do|alto|tenor/i.test(ad)) return 102;

  return 108;
};

export const anahtarFontClassAl = (anahtar) => {
  const ad = String(anahtar?.ad || '').toLowerCase();

  if (/fa|bass/i.test(ad)) return 'muzik-clef muzik-clef-bass';
  if (/do|alto|tenor/i.test(ad)) return 'muzik-clef muzik-clef-alto';

  return 'muzik-clef muzik-clef-treble';
};

export {
  muzikAnahtarTipiAl,
  anahtarYOffsetAl,
  varsayilanOktavAnahtaraGoreAl,
  notaYHesapla,
  notaGorselYHesapla,
  notaGorselYClampEdildiMi,
  bagYonunuHesapla,
  bagCizimNoktalari,
  clampSvg,
} from './musicScoreMathHelpers.js';

export const anlamMetniOlustur = (olcuItems, hucreler, hucreMeta) => {
  const anlamlar = (hucreler || []).map((_, i) => (
    muzikHucreAnlamiKayittan(
      olcuItems,
      i,
      hucreMeta,
    )
    || { tip: 'isaret', baslik: 'Müzik hücresi', etiket: '', noktaStr: '' }
  ));

  const parcalar = anlamlar
    .map((anlam) => anlam?.etiket || anlam?.baslik || '')
    .map((t) => String(t).trim())
    .filter(Boolean);

  const tekil = [];

  parcalar.forEach((p) => {
    if (!tekil.includes(p)) {
      tekil.push(p);
    }
  });

  return tekil.slice(0, 4).join(' · ');
};

export const bagTipiTieMi = (bag) => {
  const bagTipi = bag?.tip || bag?.kayit?.tip || bag?.kayit?.id || 'slur';
  if (bagTipi === 'tie') return true;
  const ad = String(bag?.kayit?.ad || '').toLowerCase();
  return /^(tie|bağ)\b/i.test(ad) || /uzatma/.test(ad);
};

export const bagHitRectHesapla = (start, end, direction) => {
  const minX = Math.min(start.x, end.x) - 10;
  const width = Math.abs(end.x - start.x) + 20;

  const minY = direction === 'above'
    ? Math.min(start.y, end.y) - 36
    : Math.max(start.y, end.y) + 2;

  return {
    x: minX,
    y: minY,
    width,
    height: 34,
  };
};

const LEDGER_STEP = 12;

export const ledgerCizgileri = (x, y, anahtar = null, options = {}) => {
  let lines = [];
  const maxLines = Number.isFinite(options.maxLines) ? options.maxLines : 12;

  if (y > STAFF_BOTTOM_Y + 0.1) {
    for (let ly = STAFF_BOTTOM_Y + LEDGER_STEP; ly <= y + 0.1; ly += LEDGER_STEP) {
      lines.push(ly);
    }
  }

  if (y < STAFF_TOP_Y - 0.1) {
    for (let ly = STAFF_TOP_Y - LEDGER_STEP; ly >= y - 0.1; ly -= LEDGER_STEP) {
      lines.push(ly);
    }
  }

  if (lines.length > maxLines) {
    if (y < STAFF_TOP_Y) {
      lines = lines.slice(-maxLines);
    } else {
      lines = lines.slice(0, maxLines);
    }
  }

  return lines.map((ly) => (
    <line
      key={`ledger-${x}-${ly}`}
      x1={x - 12}
      x2={x + 12}
      y1={ly}
      y2={ly}
      className="muzik-ledger"
      strokeWidth={1}
      strokeLinecap="round"
    />
  ));
};
