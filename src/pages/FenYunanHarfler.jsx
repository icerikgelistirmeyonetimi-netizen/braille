import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { YUNAN_HARFLERI, YUNAN_GOSTERGESI } from '../data/fen.js';

export default function FenYunanHarfler() {
  const ogeler = YUNAN_HARFLERI.map((h) => ({
    ad: h.harf,
    ariaAd: `${h.ad} harfi`,
    noktalar: h.noktalar,
    aciklama: `Yunan göstergesi (${YUNAN_GOSTERGESI.join('-')}) sonrası ${h.ad}: ${h.noktalar.join('-')}.`
  }));
  return (
    <DesenOgretici
      baslik="Fen: Yunan Harfleri"
      ogeler={ogeler}
      kategoriAdi="Yunan harfi"
      bolumAnahtari="fen-yunan"
      bittiMesaji="Tebrikler! Fen Bilimleri'nde sık kullanılan Yunan harflerini öğrendiniz."
    />
  );
}
