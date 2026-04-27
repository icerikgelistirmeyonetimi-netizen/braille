import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { NOKTALAMA } from '../data/braille.js';

export default function NoktalamaEgitimi() {
  const ogeler = NOKTALAMA.map((n) => ({
    ad: n.isaret,
    ariaAd: n.isim,
    noktalar: n.noktalar
  }));

  return (
    <DesenOgretici
      baslik="Noktalama İşaretleri"
      ogeler={ogeler}
      kategoriAdi="işareti"
      bolumAnahtari="noktalama"
      bittiMesaji="Tebrikler! Noktalama işaretlerini öğrendiniz."
    />
  );
}
