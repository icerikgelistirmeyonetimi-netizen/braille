import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { GEOMETRI_SEMBOLLERI } from '../data/matematik.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = GEOMETRI_SEMBOLLERI.map((s) => isarettenOgeye(s, { ekBilgi: true }));

export default function MatematikGeometriEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Matematik: Geometri"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="mat-geometri"
      bittiMesaji="Tebrikler! Tüm geometri sembollerini öğrendiniz."
    />
  );
}
