import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { MATEMATIK_RAKAMLAR, RAKAM_GOSTERGESI } from '../data/matematik.js';

function nl(nArr) {
  if (!nArr || nArr.length === 0) return '';
  if (nArr.length === 1) return `${nArr[0]}. noktadan`;
  if (nArr.length === 2) return `${nArr[0]}. ve ${nArr[1]}. noktalardan`;
  const bas = nArr.slice(0, -1).map((n) => `${n}.`).join(', ');
  return `${bas} ve ${nArr[nArr.length - 1]}. noktalardan`;
}

// Rakam göstergesi (3-4-5-6) ardından gelen harf hücresi rakam olur.
export default function MatematikRakamEgitimi() {
  const ogeler = MATEMATIK_RAKAMLAR.map((r) => ({
    ad: r.rakam,
    ariaAd: r.ad,
    noktalar: r.noktalar,
    hucreler: [RAKAM_GOSTERGESI, r.noktalar],
    hucreBasliklari: ['sayı', r.rakam],
    hucreAriaEtiketleri: ['sayı işareti', `${r.rakam} rakam hücresi`],
    hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
    yonergeDetay: `önce sayı işareti hücresindeki ${nl(RAKAM_GOSTERGESI)}; sonra rakam hücresindeki ${nl(r.noktalar)} oluşur.`
  }));
  return (
    <DesenOgretici
      baslik="Matematik: Rakamlar"
      ogeler={ogeler}
      kategoriAdi="rakamı"
      bolumAnahtari="mat-rakamlar"
      bittiMesaji="Tebrikler! Tüm rakamların braille karşılıklarını öğrendiniz."
    />
  );
}
