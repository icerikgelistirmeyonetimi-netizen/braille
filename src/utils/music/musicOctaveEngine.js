// Modül 8 Bölüm 3 — Octave Signs
// Otomatik oktav işareti kuralları: aralık + bağlam bazlı karar
import { MUZIK_NOTA_DIYATONIK_SIRA, MUZIK_OKTAV_HUCRELERI } from './musicConstants.js';

export function muzikDiatonikAralik(prev, cur) {
  const a = MUZIK_NOTA_DIYATONIK_SIRA[prev.notaAd] ?? 0;
  const b = MUZIK_NOTA_DIYATONIK_SIRA[cur.notaAd] ?? 0;
  const absA = (prev.oktav ?? 4) * 7 + a;
  const absB = (cur.oktav ?? 4) * 7 + b;
  return Math.abs(absB - absA) + 1;
}

// Modül 8 Bölüm 3: oktav işareti gerekli mi?
//  ilkNota / yeniSatır / time-key sonrası / sectional sonrası → her zaman
//  2-3 aralık → asla
//  4-5 aralık → yalnız oktav değiştiyse
//  6+ aralık → her zaman
export function muzikOktavGerekliMi(prevNota, curNota, ctx = {}) {
  if (!curNota || curNota.tip !== 'nota') return false;
  if (ctx.ilkNota) return true;
  if (ctx.yeniBrailleSatiri) return true;
  if (ctx.timeKeyDegisimiSonrasi) return true;
  if (ctx.sectionalDoubleBarlineSonrasi) return true;
  if (!prevNota) return true;
  const aralik = muzikDiatonikAralik(prevNota, curNota);
  const oktavDegisti = (prevNota.oktav ?? 4) !== (curNota.oktav ?? 4);
  if (aralik <= 3) return false;
  if (aralik <= 5) return oktavDegisti;
  return true;
}

export function muzikOktavHucresi(oktav) {
  return MUZIK_OKTAV_HUCRELERI[(oktav || 4) - 1] || MUZIK_OKTAV_HUCRELERI[3];
}
