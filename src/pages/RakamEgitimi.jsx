import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { RAKAMLAR } from '../data/braille.js';

export default function RakamEgitimi() {
  const ogeler = RAKAMLAR.map((r) => ({
    ad: r.rakam,
    ariaAd: `${r.rakam} `,
    noktalar: r.noktalar,
    aciklama:
      'Not: Braille metinde rakamdan önce 3, 4, 5, 6 numaralı noktalardan oluşan sayı işareti yazılır.'
  }));

  return (
    <DesenOgretici
      baslik="Rakam Eğitimi"
      ogeler={ogeler}
      kategoriAdi="rakamı"
      bolumAnahtari="rakamlar"
      bittiMesaji="Tebrikler! Tüm rakamları öğrendiniz."
    />
  );
}
