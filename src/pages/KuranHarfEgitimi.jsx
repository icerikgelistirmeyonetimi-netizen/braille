import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { KURAN_HARFLERI } from '../data/kuran.js';

export default function KuranHarfEgitimi() {
  const ogeler = KURAN_HARFLERI.map((h) => ({
    ad: h.harf,
    ariaAd: `${h.ad} harfi`,
    noktalar: h.noktalar,
    aciklama: `Okunuşu: ${h.okunus}.`
  }));

  return (
    <DesenOgretici
      baslik="Kur'an: Harf Eğitimi"
      ogeler={ogeler}
      kategoriAdi="Arap harfi"
      bolumAnahtari="kuran-harfler"
      bittiMesaji="Tebrikler! Kur'an braillesi harflerini tamamladınız."
      rtl
    />
  );
}
