import React, { useMemo } from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { NOKTALAMA_ISARETLERI } from '../data/braille.js';

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

const OGELER = NOKTALAMA_ISARETLERI.map(isarettenOgeye);

export default function NoktalamaIsaretleri() {
  return (
    <DesenOgretici
      baslik="Noktalama İşaretleri"
      ogeler={OGELER}
      kategoriAdi="işareti"
      bolumAnahtari="noktalama-isaretleri"
      bittiMesaji="Tebrikler! Tüm noktalama işaretlerini öğrendiniz."
    />
  );
}
