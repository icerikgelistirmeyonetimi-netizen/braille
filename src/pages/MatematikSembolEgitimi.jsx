import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { MATEMATIK_SEMBOLLER } from '../data/matematik.js';

function isarettenOgeye(s) {
  const hucreler = s.hucreler || [];
  return {
    ad: s.ad,
    altMetin: s.sembol && s.sembol !== '—' ? s.sembol : undefined,
    hucreler,
    noktalar: hucreler[0] || [],
    hucreBasliklari: s.hucreBasliklari || undefined,
    yonergeDetay: s.aciklama || undefined,
    ekBilgi: (s.aciklama || s.kurallar?.length || s.ornekler?.length)
      ? { aciklama: s.aciklama, kurallar: s.kurallar, ornekler: s.ornekler }
      : undefined,
  };
}

const OGELER = MATEMATIK_SEMBOLLER.map(isarettenOgeye);

export default function MatematikSembolEgitimi() {
  return (
    <DesenOgretici
      baslik="Matematik: Semboller"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="mat-semboller"
      bittiMesaji="Tebrikler! Tüm matematik sembollerini öğrendiniz."
    />
  );
}
