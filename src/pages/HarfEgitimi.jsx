import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { HARFLER } from '../data/braille.js';

export default function HarfEgitimi() {
  const ogeler = HARFLER.map((h) => ({
    ad: h.harf,
    ariaAd: `${h.harf} `,
    noktalar: h.noktalar
  }));

  return (
    <DesenOgretici
      baslik="Harf Eğitimi"
      ogeler={ogeler}
      kategoriAdi="harfi"
      bolumAnahtari="harfler"
      bittiMesaji="Tebrikler! Türkçe alfabenin tamamını öğrendiniz."
    />
  );
}
