import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { KELIME_KOKU_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaKelimeKoku() {
  const ogeler = KELIME_KOKU_KISALTMALARI.map((k) => {
    const sagSembol = k.etiket.includes('+')
      ? `"${k.etiket.split('+')[1]}" hece sembolü`
      : `"${k.etiket.slice(1)}" harfi`;
    return {
      ad: k.etiket,
      ariaAd: `${k.etiket} sembolü, ${k.kelime} kelime kökü`,
      hucreler: [[5], k.sag],
      hucreBasliklari: ['5', k.etiket.replace(/^5\+?/, '')],
      hucreAriaEtiketleri: ['5. nokta, kök işareti', `${k.etiket} sembolü`],
      hucreAdlari: ['kök işareti hücresi', 'sembol hücresi'],
      tamYonergeMetni: `${k.etiket} sembolü, "${k.kelime}" kelime kökünü ifade eder.`,
      altMetin: `"${k.kelime}"`,
      altMetinAciklama: `Önce 5. nokta (kök işareti), sonra ${sagSembol} yazılır. Bu kısaltma "${k.kelime}" kelime kökünü ifade eder. Yalnız başına ya da sonuna ek alarak kelimenin başında kullanılır.`,
    };
  });

  return (
    <DesenOgretici
      baslik="Kelime Kökü Kısaltmaları"
      ogeler={ogeler}
      kategoriAdi="sembolü"
      bolumAnahtari="kisaltma-kelime-koku"
      bittiMesaji="Tebrikler! Tüm kelime kökü kısaltmalarını öğrendiniz."
    />
  );
}
