import {
  BRAILLE_HUCRE_TEMA,
  BRAILLE_MINI_BOYUTLAR,
} from './musicConstants.js';

export function brailleOlcuSikilikSeviyesiAl(olcu) {
  const hucreSayisi = Array.isArray(olcu?.hucreler) ? olcu.hucreler.length : 0;
  const genislik = Math.max(28, Number(olcu?.width) || 0);
  const icGenislik = Math.max(20, genislik - 8);

  if (hucreSayisi <= 0) return 0;

  if (hucreSayisi * BRAILLE_MINI_BOYUTLAR[0].cellW <= icGenislik) {
    return 0;
  }

  if (hucreSayisi * BRAILLE_MINI_BOYUTLAR[1].cellW <= icGenislik * 2) {
    return 1;
  }

  return 2;
}

export function brailleOlcuKutuYukseklikAl(olcu) {
  const hucreSayisi = Array.isArray(olcu?.hucreler) ? olcu.hucreler.length : 0;
  const sikilik = brailleOlcuSikilikSeviyesiAl(olcu);
  const cfg = BRAILLE_MINI_BOYUTLAR[sikilik] || BRAILLE_MINI_BOYUTLAR[0];

  const genislik = Math.max(28, Number(olcu?.width) || 0);
  const icGenislik = Math.max(20, genislik - 8);
  const tekSatirKapasite = Math.max(1, Math.floor(icGenislik / cfg.cellW));
  const satirSayisi = Math.min(2, Math.max(1, Math.ceil(hucreSayisi / tekSatirKapasite)));

  return satirSayisi > 1 ? 64 : 43;
}

export function brailleOlcuYerlesimHesapla(olcu, availablePx = 0) {
  const hucreSayisi = Math.max(1, Array.isArray(olcu?.hucreler) ? olcu.hucreler.length : 0);
  const tabanGenislik = Math.max(36, Number(olcu?.width) || 0);
  const kullanilabilirGenislik = Math.max(tabanGenislik, availablePx || tabanGenislik);

  const secenekler = [
    { tema: 'normal', satir: 1 },
    { tema: 'compact', satir: 1 },
    { tema: 'tight', satir: 1 },
    { tema: 'compact', satir: 2 },
    { tema: 'tight', satir: 2 },
  ];

  for (const secenek of secenekler) {
    const cfg = BRAILLE_HUCRE_TEMA[secenek.tema];
    const icGen = Math.max(cfg.cellW, kullanilabilirGenislik - 8);
    const satirBasiKapasite = Math.max(1, Math.floor(icGen / cfg.cellW));

    if (satirBasiKapasite * secenek.satir >= hucreSayisi) {
      const gercekSatirSayisi = Math.max(1, Math.ceil(hucreSayisi / satirBasiKapasite));
      const satirBasiGerekli = Math.ceil(hucreSayisi / gercekSatirSayisi);
      const gerekenIcGen = satirBasiGerekli * cfg.cellW;

      return {
        cfg,
        satirSayisi: gercekSatirSayisi,
        boxWidth: Math.max(
          tabanGenislik,
          Math.min(kullanilabilirGenislik, gerekenIcGen + 8),
        ),
        boxHeight: gercekSatirSayisi > 1 ? 76 : 50,
      };
    }
  }

  const cfg = BRAILLE_HUCRE_TEMA.tight;
  const icGen = Math.max(cfg.cellW, kullanilabilirGenislik - 8);
  const satirBasiKapasite = Math.max(1, Math.floor(icGen / cfg.cellW));
  const satirSayisi = 2;
  const satirBasiGerekli = Math.ceil(hucreSayisi / satirSayisi);

  return {
    cfg,
    satirSayisi,
    boxWidth: Math.max(
      tabanGenislik,
      Math.min(kullanilabilirGenislik, satirBasiGerekli * cfg.cellW + 8),
    ),
    boxHeight: 76,
  };
}
