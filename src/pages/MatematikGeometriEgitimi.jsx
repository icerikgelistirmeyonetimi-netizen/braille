import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { GEOMETRI_SEMBOLLERI } from '../data/matematik.js';

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

const OGELER = GEOMETRI_SEMBOLLERI.map(isarettenOgeye);

export default function MatematikGeometriEgitimi() {
  return (
    <DesenOgretici
      baslik="Matematik: Geometri"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="mat-geometri"
      bittiMesaji="Tebrikler! Tüm geometri sembollerini öğrendiniz."
    />
  );
}
