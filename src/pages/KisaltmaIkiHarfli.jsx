import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { IKI_HARFLI_KISALTMALAR } from '../data/braille.js';

export default function KisaltmaIkiHarfli() {
  const ogeler = IKI_HARFLI_KISALTMALAR.map((k) => {
    const chars = [...k.harf.toLocaleUpperCase('tr')];
    const h0 = chars[0];
    const h1 = chars[1];
    const harfBuyuk = chars.join('');
    return {
      ad: harfBuyuk,
      ariaAd: `${harfBuyuk} kısaltması, ${k.kelime} kelimesi`,
      hucreler: [k.sol, k.sag],
      hucreBasliklari: [h0, h1],
      hucreAriaEtiketleri: [`${h0} harfi`, `${h1} harfi`],
      hucreAdlari: [`${h0} harfi hücresi`, `${h1} harfi hücresi`],
      tamYonergeMetni: `${harfBuyuk} kısaltması, "${k.kelime}" kelimesini ifade eder.`,
      altMetin: `"${k.kelime}"`,
      altMetinAciklama: `${harfBuyuk} harfleri yan yana yazıldığında "${k.kelime}" kelimesini ifade eder. Bu kısaltma yalnız başına veya kelimenin başında ek alarak kullanılır.`,
    };
  });

  return (
    <DesenOgretici
      baslik="İki Harfli Kısaltmalar"
      ogeler={ogeler}
      kategoriAdi="kısaltması"
      bolumAnahtari="kisaltma-iki-harfli"
      bittiMesaji="Tebrikler! Tüm iki harfli kısaltmaları öğrendiniz."
      noktalariSeslendir
    />
  );
}
