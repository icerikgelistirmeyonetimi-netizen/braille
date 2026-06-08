import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { RAKAMLAR } from '../data/braille.js';

const SAYI_ISARETI = [3, 4, 5, 6];

function nl(nArr) {
  if (!nArr || nArr.length === 0) return '';
  if (nArr.length === 1) return `${nArr[0]}. noktadan`;
  if (nArr.length === 2) return `${nArr[0]}. ve ${nArr[1]}. noktalardan`;
  const bas = nArr.slice(0, -1).map((n) => `${n}.`).join(', ');
  return `${bas} ve ${nArr[nArr.length - 1]}. noktalardan`;
}

export default function RakamEgitimi() {
  const ogeler = RAKAMLAR.map((r) => ({
    ad: r.rakam,
    ariaAd: `${r.rakam} rakamı`,
    noktalar: r.noktalar,
    hucreler: [SAYI_ISARETI, r.noktalar],
    hucreBasliklari: ['sayı', r.rakam],
    hucreAriaEtiketleri: ['sayı işareti', `${r.rakam} rakam hücresi`],
    hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
    yonergeDetay: `önce sayı işareti hücresindeki ${nl(SAYI_ISARETI)}; sonra rakam hücresindeki ${nl(r.noktalar)} oluşur.`
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
