import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KELIME_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaBirHarfli() {
  const ogeler = KELIME_KISALTMALARI.map((k) => ({
    yazi: k.harf,
    ttsYazi: `${k.harf} harfi, ${k.kelime} kelimesi`,
    // Hızlı dolaşım kartı (yalnız ekran okuyucu/TTS): kart üzerinde tek harf görünür,
    // bu yüzden neyin kısaltması olduğu ve nasıl yazıldığı söylenir.
    okumaAciklama: `"${k.kelime}" kelimesinin kısaltması, ${k.harf} harfi ile yazılır`,
    okumaAltEtiket: k.kelime, // kartta harfin altında görünen açıklama

    hucreler: [k.noktalar],
    tamYonergeMetni: `${k.harf} harfi tek başına yazıldığında "${k.kelime}" kelimesi okunur.`,
    altMetin: `"${k.kelime}"`,
    altMetinAciklama: `${k.harf} harfi tek başına yazıldığında veya bir kelimenin başında ek alarak kullanıldığında "${k.kelime}" okunur.`,
  }));

  return (
    <CokHucreOkuyucu
      baslik="Bir Harfli Kısaltmalar"
      ogeler={ogeler}
      kategoriAdi="kısaltması"
      bolumAnahtari="kisaltma-bir-harfli"
      bittiMesaji="Tebrikler! Tüm bir harfli kısaltmaları öğrendiniz."
      noktalariSeslendir
    />
  );
}
