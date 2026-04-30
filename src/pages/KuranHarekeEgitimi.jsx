import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { KURAN_HAREKELERI } from '../data/kuran.js';

export default function KuranHarekeEgitimi() {
  const ogeler = KURAN_HAREKELERI.map((h) => ({
    ad: h.isaret,
    ariaAd: `${h.ad} harekesi`,
    noktalar: h.noktalar,
    aciklama: h.aciklama
  }));

  return (
    <DesenOgretici
      baslik="Kur'an: Hareke Eğitimi"
      ogeler={ogeler}
      kategoriAdi="harekesi"
      bolumAnahtari="kuran-harekeler"
      bittiMesaji="Tebrikler! Kur'an braillesindeki harekeleri öğrendiniz."
    />
  );
}
