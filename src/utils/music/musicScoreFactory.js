// Skor öğesi factory: nota ve sus oluşturma — Modül 8 Bölüm 1/2
import { SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI } from '../../data/muzik.js';
import { muzikNotaNoktalari, muzikSureKisaAdi } from './musicDuration.js';

export function muzikNotaSkorOgesi(id, notaAd, sureIndeksi, ek = {}) {
  const sure = MUZIK_SURE_GOSTERGELERI[sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
  const noktalar = muzikNotaNoktalari(notaAd, sureIndeksi);
  return {
    id,
    tip: 'nota',
    type: 'note',
    notaAd,
    sureIndeksi,
    oktav: ek.oktav ?? 4,
    accidental: ek.accidental ?? null,
    dotted: ek.dotted ?? false,
    modifiers: ek.modifiers || { oncesi: [], sonrasi: [] },
    ad: `${notaAd} · ${muzikSureKisaAdi(sure)}`,
    gorunum: `${notaAd}${sure.sembol}`,
    hucreler: [noktalar],
    aciklama: `${notaAd} notasının ${sure.ad} değeri. Noktalar: ${noktalar.join('-')}.`,
  };
}

// Modül 8 Bölüm 2 — Sus (rest) skor öğesi: sureIndeksi + realValue + dotted
export function muzikSusSkorOgesi(id, sureIndeksi, ek = {}) {
  const sure = MUZIK_SURE_GOSTERGELERI[sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
  const sureAd = muzikSureKisaAdi(sure);
  // PDF eşleştirme: tam sus=1-3-4, yarım=1-3-6, dörtlük=1-2-3-6, sekizlik=1-3-4-6
  const SUS_HUCRELERI = {
    1: [1, 3, 4],
    16: [1, 3, 4],

    2: [1, 3, 6],
    32: [1, 3, 6],

    4: [1, 2, 3, 6],
    64: [1, 2, 3, 6],

    8: [1, 3, 4, 6],
    128: [1, 3, 4, 6],
  };
  const realValue = sure.realValue;
  const baseHucre = SUS_HUCRELERI[realValue] || [1, 3, 4];
  const hucreler = ek.dotted ? [baseHucre, [3]] : [baseHucre];
  return {
    id,
    tip: 'sus',
    type: 'rest',
    label: `${sureAd} sus${ek.dotted ? ' (noktalı)' : ''}`,
    sureAd,
    sureIndeksi,
    realValue,
    dotted: ek.dotted ?? false,
    ad: `${sureAd} sus${ek.dotted ? ' (noktalı)' : ''}`,
    gorunum: `${sure.sembol}𝄽`,
    hucreler,
    aciklama: `${sure.ad} sus${ek.dotted ? ' (noktalı, 1.5×)' : ''}. Hücre: ${baseHucre.join('-')}.`,
  };
}
