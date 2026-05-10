import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { RAKAMLAR } from '../data/braille.js';

const SAYI_ISARETI = [3, 4, 5, 6];

export default function RakamEgitimi() {
  const ogeler = RAKAMLAR.map((r) => ({
    ad: r.rakam,
    ariaAd: `${r.rakam} `,
    noktalar: r.noktalar,
    hucreler: [SAYI_ISARETI, r.noktalar],
    hucreBasliklari: ['sayı', r.rakam],
    hucreAriaEtiketleri: ['sayı işareti', `${r.rakam} rakam hücresi`],
    hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
    yonergeDetay: `önce sayı işareti hücresindeki 3, 4, 5, 6; sonra rakam hücresindeki ${r.noktalar.join(', ')} numaralı noktalardan oluşur.`,
    aciklama:
      'Braille metinde rakam, sayı işareti ve ardından gelen rakam hücresiyle yazılır.'
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
