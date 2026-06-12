import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { MUZIK_SEMBOLLERI } from '../data/muzik.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = MUZIK_SEMBOLLERI.map((s) => isarettenOgeye(s, { ekBilgi: true }));

export default function MuzikSembolEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Müzik: Anahtar ve Semboller"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="muzik-semboller"
      bittiMesaji="Tebrikler! Tüm müzik sembollerini öğrendiniz."
    />
  );
}
