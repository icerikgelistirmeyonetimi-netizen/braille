import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { YUNAN_HARFLERI, YUNAN_GOSTERGESI } from '../data/fen.js';

export default function FenYunanHarfler() {
  const ogeler = YUNAN_HARFLERI.map((h) => ({
    yazi: h.harf,
    ttsYazi: `${h.ad} harfi`,
    hucreler: [h.noktalar],
    aciklama: `Yunan göstergesi (${YUNAN_GOSTERGESI.join('-')}) sonrası ${h.ad}: ${h.noktalar.join('-')}.`,
  }));
  return (
    <CokHucreOkuyucu
      baslik="Fen: Yunan Harfleri"
      ogeler={ogeler}
      kategoriAdi="Yunan harfi"
      bolumAnahtari="fen-yunan"
      bittiMesaji="Tebrikler! Fen Bilimleri'nde sık kullanılan Yunan harflerini öğrendiniz."
    />
  );
}
