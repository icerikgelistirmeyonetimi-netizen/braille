import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { MATEMATIK_RAKAMLAR, RAKAM_GOSTERGESI } from '../data/matematik.js';

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
    yonergeDetay: `önce sayı işareti hücresindeki ${RAKAM_GOSTERGESI.join(', ')}; sonra rakam hücresindeki ${r.noktalar.join(', ')} numaralı noktalardan oluşur.`,
    aciklama:
      "Matematik Braille'de rakam, sayı işareti ve ardından gelen rakam hücresiyle yazılır."
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
