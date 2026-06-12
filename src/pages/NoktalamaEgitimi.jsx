import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { NOKTALAMA } from '../data/braille.js';

export default function NoktalamaEgitimi() {
  const ogeler = NOKTALAMA.map((n) => ({
    yazi: n.isaret,
    ttsYazi: n.isim,
    hucreler: [n.noktalar],
  }));

  return (
    <CokHucreOkuyucu
      baslik="Noktalama İşaretleri"
      ogeler={ogeler}
      kategoriAdi="işareti"
      bolumAnahtari="noktalama"
      bittiMesaji="Tebrikler! Noktalama işaretlerini öğrendiniz."
    />
  );
}
