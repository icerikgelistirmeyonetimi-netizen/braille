import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { HARFLER } from '../data/braille.js';

export default function HarfEgitimi() {
  const ogeler = HARFLER.map((h) => ({
    yazi: h.harf,
    ttsYazi: `${h.harf} harfi`,
    hucreler: [h.noktalar],
  }));

  return (
    <CokHucreOkuyucu
      baslik="Harf Eğitimi"
      ogeler={ogeler}
      kategoriAdi="harfi"
      bolumAnahtari="harfler"
      bittiMesaji="Tebrikler! Türkçe alfabenin tamamını öğrendiniz."
    />
  );
}
