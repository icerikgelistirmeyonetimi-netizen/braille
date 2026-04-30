import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { NOTALAR } from '../data/muzik.js';

export default function MuzikNotaEgitimi() {
  const ogeler = NOTALAR.map((n) => ({
    ad: n.ad.toUpperCase(),
    ariaAd: `${n.ad} notası`,
    noktalar: n.noktalar,
    aciklama: `Dörtlük ${n.ad} notasının braille hücresi: ${n.noktalar.join('-')}.`
  }));
  return (
    <DesenOgretici
      baslik="Müzik: Notalar (Dörtlük)"
      ogeler={ogeler}
      kategoriAdi="nota"
      bolumAnahtari="muzik-notalar"
      bittiMesaji="Tebrikler! Yedi temel notayı (Do-Si) öğrendiniz."
    />
  );
}
