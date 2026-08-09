import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KELIME_KOKU_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaKelimeKoku() {
  const ogeler = KELIME_KOKU_KISALTMALARI.map((k) => {
    const sagSembol = k.etiket.includes('+')
      ? `"${k.etiket.split('+')[1]}" hece sembolü`
      : `"${k.etiket.slice(1)}" harfi`;
    return {
      yazi: k.etiket,
      ttsYazi: `${k.etiket} sembolü, ${k.kelime} kelime kökü`,
      // Hızlı dolaşım kartı (yalnız ekran okuyucu/TTS) — kartta "5+ba" gibi sembol görünür.
      okumaAciklama: `"${k.kelime}" kelime kökü kısaltması, önce 5. nokta kök işareti, sonra ${sagSembol} yazılır`,
      okumaAltEtiket: k.kelime, // kartta sembolün altında görünen açıklama

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
    <CokHucreOkuyucu
      baslik="Kelime Kökü Kısaltmaları"
      ogeler={ogeler}
      kategoriAdi="sembolü"
      bolumAnahtari="kisaltma-kelime-koku"
      bittiMesaji="Tebrikler! Tüm kelime kökü kısaltmalarını öğrendiniz."
      noktalariSeslendir
    />
  );
}
