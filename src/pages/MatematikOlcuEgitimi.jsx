import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { MATEMATIK_OLCULER } from '../data/matematik.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = MATEMATIK_OLCULER.map((s) => isarettenOgeye(s, { ekBilgi: true }));

export default function MatematikOlcuEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Matematik: Ölçüler"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="mat-olculer"
      bittiMesaji="Tebrikler! Tüm ölçü sembollerini öğrendiniz."
    />
  );
}
