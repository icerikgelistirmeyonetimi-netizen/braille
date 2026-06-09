import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { MATEMATIK_OLCULER } from '../data/matematik.js';

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

const OGELER = MATEMATIK_OLCULER.map(isarettenOgeye);

export default function MatematikOlcuEgitimi() {
  return (
    <DesenOgretici
      baslik="Matematik: Ölçüler"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="mat-olculer"
      bittiMesaji="Tebrikler! Tüm ölçü sembollerini öğrendiniz."
    />
  );
}
