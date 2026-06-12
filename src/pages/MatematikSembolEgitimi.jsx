import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { MATEMATIK_SEMBOLLER } from '../data/matematik.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = MATEMATIK_SEMBOLLER.map((s) => isarettenOgeye(s, { ekBilgi: true }));

export default function MatematikSembolEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Matematik: Semboller"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="mat-semboller"
      bittiMesaji="Tebrikler! Tüm matematik sembollerini öğrendiniz."
    />
  );
}
