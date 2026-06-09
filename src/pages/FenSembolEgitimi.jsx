import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { FEN_SEMBOLLER } from '../data/fen.js';

function isarettenOgeye(s) {
  const hucreler = s.hucreler || [];
  return {
    ad: s.ad,
    altMetin: s.sembol && s.sembol !== '—' ? s.sembol : undefined,
    hucreler,
    noktalar: hucreler[0] || [],
    yonergeDetay: s.aciklama || undefined,
    ekBilgi: (s.aciklama || s.kurallar?.length || s.ornekler?.length)
      ? { aciklama: s.aciklama, kurallar: s.kurallar, ornekler: s.ornekler }
      : undefined,
  };
}

const OGELER = FEN_SEMBOLLER.map(isarettenOgeye);

export default function FenSembolEgitimi() {
  return (
    <DesenOgretici
      baslik="Fen: Birim ve Semboller"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="fen-semboller"
      bittiMesaji="Tebrikler! Tüm fen sembollerini öğrendiniz."
    />
  );
}
