import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { MATEMATIK_RAKAMLAR, RAKAM_GOSTERGESI } from '../data/matematik.js';

// Rakam göstergesi (3-4-5-6) ardından gelen harf hücresi rakam olur.
// Bu sayfa rakam başına TEK hücre gösterir; gerçek yazıda önce rakam
// göstergesi yer aldığını DesenOgretici altındaki açıklamada belirtir.
export default function MatematikRakamEgitimi() {
  const ogeler = MATEMATIK_RAKAMLAR.map((r) => ({
    ad: r.rakam,
    ariaAd: `${r.ad} rakamı`,
    noktalar: r.noktalar,
    aciklama: `Rakam göstergesi (${RAKAM_GOSTERGESI.join('-')}) sonrası ${r.ad}: ${r.noktalar.join('-')}.`
  }));
  return (
    <DesenOgretici
      baslik="Matematik: Rakamlar"
      ogeler={ogeler}
      kategoriAdi="rakam"
      bolumAnahtari="mat-rakamlar"
      bittiMesaji="Tebrikler! Tüm rakamların braille karşılıklarını öğrendiniz."
    />
  );
}
