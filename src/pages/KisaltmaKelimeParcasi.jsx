import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KELIME_PARCASI_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaKelimeParcasi() {
  const ogeler = KELIME_PARCASI_KISALTMALARI.map((k) => {
    const sagEtiket = k.etiket.split('+')[1];
    const onekEtiket = k.sol.join(',');
    return {
      yazi: k.etiket,
      ttsYazi: `${k.etiket} sembolü, ${k.ekler} ekleri`,
      // Hızlı dolaşım kartı (yalnız ekran okuyucu/TTS) — kartta sembol görünür.
      // ⚠ Nokta listesi "4,5" biçiminde YAZILMAZ (ekran okuyucu "kırk beş" okur) → "4 ve 5".
      okumaAciklama: `"${k.ekler}" eklerinin kısaltması, önce ${k.sol.join(' ve ')}. noktalar, sonra "${sagEtiket}" sembolü ile yazılır`,
      okumaAltEtiket: k.ekler, // kartta sembolün altında görünen ekler

      hucreler: [k.sol, k.sag],
      hucreBasliklari: [onekEtiket, sagEtiket],
      hucreAriaEtiketleri: [`${onekEtiket} noktaları, ön ek`, `${sagEtiket} sembolü`],
      hucreAdlari: ['ön ek hücresi', 'sembol hücresi'],
      tamYonergeMetni: `${k.etiket} sembolü, "${k.ekler}" eklerini ifade eder.`,
      altMetin: k.ekler,
      altMetinAciklama: `Önce ${onekEtiket} noktaları, sonra "${sagEtiket}" sembolü yazılır. Bu kısaltma kelimenin kökünde, gövdesinde veya ek olarak kullanılır; kelimenin başında ya da yalnız başına kullanılamaz.`,
    };
  });

  return (
    <CokHucreOkuyucu
      baslik="Kelime Parçası Kısaltmaları"
      ogeler={ogeler}
      kategoriAdi="sembolü"
      bolumAnahtari="kisaltma-kelime-parcasi"
      bittiMesaji="Tebrikler! Tüm kelime parçası kısaltmalarını öğrendiniz."
      noktalariSeslendir
    />
  );
}
