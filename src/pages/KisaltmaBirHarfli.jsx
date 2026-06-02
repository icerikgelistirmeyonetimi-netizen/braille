import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { KELIME_KISALTMALARI } from '../data/braille.js';

export default function KisaltmaBirHarfli() {
  const ogeler = KELIME_KISALTMALARI.map((k) => ({
    ad: k.harf,
    ariaAd: `${k.harf} harfi, ${k.kelime} kelimesi`,
    noktalar: k.noktalar,
    tamYonergeMetni: `${k.harf} harfi tek başına yazıldığında "${k.kelime}" kelimesi okunur.`,
    altMetin: `"${k.kelime}"`,
    altMetinAciklama: `${k.harf} harfi tek başına yazıldığında veya bir kelimenin başında ek alarak kullanıldığında "${k.kelime}" okunur.`,
  }));

  return (
    <DesenOgretici
      baslik="Bir Harfli Kısaltmalar"
      ogeler={ogeler}
      kategoriAdi="kısaltması"
      bolumAnahtari="kisaltma-bir-harfli"
      bittiMesaji="Tebrikler! Tüm bir harfli kısaltmaları öğrendiniz."
    />
  );
}
