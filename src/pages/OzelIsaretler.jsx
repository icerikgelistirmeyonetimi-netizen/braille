import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { OZEL_ISARETLER } from '../data/braille.js';

function isarettenOgeye(s) {
  const hucreler = s.hucreler || [];
  return {
    ad: s.ad,
    altMetin: s.sembol && s.sembol !== '—' ? s.sembol : undefined,
    hucreler,
    noktalar: hucreler[0] || [],
    yonergeDetay: s.aciklama || undefined,
  };
}

const OGELER = OZEL_ISARETLER.map(isarettenOgeye);

export default function OzelIsaretler() {
  return (
    <DesenOgretici
      baslik="Diğer Özel İşaretler"
      ogeler={OGELER}
      kategoriAdi="işareti"
      bolumAnahtari="ozel-isaretler"
      bittiMesaji="Tebrikler! Tüm özel işaretleri öğrendiniz."
    />
  );
}
