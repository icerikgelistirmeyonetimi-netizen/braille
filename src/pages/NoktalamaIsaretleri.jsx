import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { NOKTALAMA_ISARETLERI } from '../data/braille.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = NOKTALAMA_ISARETLERI.map((s) => isarettenOgeye(s));

export default function NoktalamaIsaretleri() {
  return (
    <CokHucreOkuyucu
      baslik="Noktalama İşaretleri"
      ogeler={OGELER}
      kategoriAdi="işareti"
      bolumAnahtari="noktalama-isaretleri"
      bittiMesaji="Tebrikler! Tüm noktalama işaretlerini öğrendiniz."
    />
  );
}
