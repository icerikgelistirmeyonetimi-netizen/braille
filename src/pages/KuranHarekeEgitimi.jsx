import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KURAN_HAREKELERI } from '../data/kuran.js';

export default function KuranHarekeEgitimi() {
  const ogeler = KURAN_HAREKELERI.map((h) => ({
    yazi: h.isaret,
    ttsYazi: `${h.ad} harekesi`,
    hucreler: [h.noktalar],
    aciklama: h.aciklama,
  }));

  return (
    <CokHucreOkuyucu
      baslik="Kur'an-ı Kerim: Hareke Eğitimi"
      ogeler={ogeler}
      kategoriAdi="harekesi"
      bolumAnahtari="kuran-harekeler"
      bittiMesaji="Tebrikler! Kur'an-ı Kerim braille harekelerini öğrendiniz."
      rtl
    />
  );
}
