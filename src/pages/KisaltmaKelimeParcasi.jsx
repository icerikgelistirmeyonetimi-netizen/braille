import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { KELIME_PARCASI_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaKelimeParcasi() {
  const ogeler = KELIME_PARCASI_KISALTMALARI.map((k) => {
    const sagEtiket = k.etiket.split('+')[1];
    const onekEtiket = k.sol.join(',');
    return {
      ad: k.etiket,
      ariaAd: `${k.etiket} sembolü, ${k.ekler} ekleri`,
      hucreler: [k.sol, k.sag],
      hucreBasliklari: [onekEtiket, sagEtiket],
      hucreAriaEtiketleri: [`${onekEtiket} noktaları, ön ek`, `${sagEtiket} sembolü`],
      hucreAdlari: ['ön ek hücresi', 'sembol hücresi'],
      tamYonergeMetni: `${k.etiket} sembolü, "${k.ekler}" eklerini ifade eder.`,
    };
  });

  return (
    <DesenOgretici
      baslik="Kelime Parçası Kısaltmaları"
      ogeler={ogeler}
      kategoriAdi="sembolü"
      bolumAnahtari="kisaltma-kelime-parcasi"
      bittiMesaji="Tebrikler! Tüm kelime parçası kısaltmalarını öğrendiniz."
    />
  );
}
