// Ders (içerik) akışı: bir dersin bitiş ekranındaki "Sonraki içerik" butonu için,
// mevcut sayfanın AYNI modüldeki bir sonraki dersini bulur.
//
// Modüller (1-7) MODULLER.ogeler içindeki `yol` sırasını kullanır (test sayfası dahil,
// son adım olarak). Müzik (Modül 8) ve Yabancı Dil (Modül 9) menü tabanlı olduğundan
// gerçek ders rotaları alt verilerden (BOLUMLER) türetilir.

import { MODULLER } from '../data/moduller.jsx';
import { MUZIK_BOLUMLER } from '../data/muzik.js';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';
import { FRANSIZCA_BOLUMLER } from '../data/fransizcaBraille.js';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';

// Modül 8 (Müzik): grup menüleri yerine gerçek ders rotaları (/muzik/:slug) + dizi + test.
const muzikDersleri = [
  ...MUZIK_BOLUMLER.map((b) => ({ yol: `/muzik/${b.slug}`, baslik: b.kisaBaslik })),
  { yol: '/muzik-diziler', baslik: 'Dizi Okuma' },
  { yol: '/test-muzik', baslik: 'Test / Sınav' },
];

// Modül 9 (Yabancı Dil): üç dil ardışık zincirlenir (İngilizce → Almanca → Fransızca).
const dilDersleri = [
  ...INGILIZCE_BOLUMLER.map((b) => ({ yol: `/ingilizce/${b.slug}`, baslik: `İngilizce · ${b.kisaBaslik}` })),
  ...ALMANCA_BOLUMLER.map((b) => ({ yol: `/almanca/${b.slug}`, baslik: `Almanca · ${b.kisaBaslik}` })),
  ...FRANSIZCA_BOLUMLER.map((b) => ({ yol: `/fransizca/${b.slug}`, baslik: `Fransızca · ${b.kisaBaslik}` })),
];

function modulDersAkisi(modul) {
  if (modul.id === 'modul8') return muzikDersleri;
  if (modul.id === 'modul9-yabanci') return dilDersleri;
  // Modül 1-7: menüdeki sıra (son adım = Test / Sınav).
  return (modul.ogeler || []).map((o) => ({ yol: o.yol, baslik: o.baslik }));
}

// Verilen pathname'in AYNI modüldeki bir sonraki içeriği. Son ders ise null.
export function sonrakiDers(pathname) {
  if (!pathname) return null;
  for (const modul of MODULLER) {
    const dersler = modulDersAkisi(modul);
    const idx = dersler.findIndex((d) => d.yol === pathname);
    if (idx === -1) continue;
    return dersler[idx + 1] || null;
  }
  return null;
}
