import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { KELIME_KOKU_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaKelimeKoku() {
  const ogeler = KELIME_KOKU_KISALTMALARI.map((k) => ({
    ad: k.etiket,
    ariaAd: `${k.etiket} sembolü, ${k.kelime} kelime kökü`,
    hucreler: [[5], k.sag],
    hucreBasliklari: ['5', k.etiket.replace(/^5\+?/, '')],
    hucreAriaEtiketleri: ['5. nokta, kök işareti', `${k.etiket} sembolü`],
    hucreAdlari: ['kök işareti hücresi', 'sembol hücresi'],
    tamYonergeMetni: `${k.etiket} sembolü, "${k.kelime}" kelime kökünü ifade eder.`,
  }));

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
