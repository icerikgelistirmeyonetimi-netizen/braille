import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { NOTALAR } from '../data/muzik.js';

export default function MuzikNotaEgitimi() {
  const ogeler = NOTALAR.map((n) => ({
    ad: n.ad.toUpperCase(),
    ariaAd: `${n.ad} notası`,
    noktalar: n.noktalar,
    aciklama: `${n.ad.charAt(0).toUpperCase() + n.ad.slice(1)} notasının temel hücresi: ${n.noktalar.join('-')}. UEB Music’te bu hücre sekizliği (quaver) temsil eder; süre için 3 ve/veya 6 noktası eklenir.`
  }));
  return (
    <DesenOgretici
      baslik="Müzik: Notalar (Do – Si)"
      ogeler={ogeler}
      kategoriAdi="nota"
      bolumAnahtari="muzik-notalar"
      bittiMesaji="Tebrikler! Yedi temel notayı (Do–Si) öğrendiniz."
    />
  );
}
