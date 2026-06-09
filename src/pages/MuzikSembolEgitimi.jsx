import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { MUZIK_SEMBOLLERI } from '../data/muzik.js';

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

const OGELER = MUZIK_SEMBOLLERI.map(isarettenOgeye);

export default function MuzikSembolEgitimi() {
  return (
    <DesenOgretici
      baslik="Müzik: Anahtar ve Semboller"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="muzik-semboller"
      bittiMesaji="Tebrikler! Tüm müzik sembollerini öğrendiniz."
    />
  );
}
