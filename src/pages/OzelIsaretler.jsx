import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { OZEL_ISARETLER } from '../data/braille.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = OZEL_ISARETLER.map((s) => isarettenOgeye(s));

export default function OzelIsaretler() {
  return (
    <CokHucreOkuyucu
      baslik="Diğer Özel İşaretler"
      ogeler={OGELER}
      kategoriAdi="işareti"
      bolumAnahtari="ozel-isaretler"
      bittiMesaji="Tebrikler! Tüm özel işaretleri öğrendiniz."
    />
  );
}
