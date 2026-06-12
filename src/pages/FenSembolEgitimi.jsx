import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { FEN_SEMBOLLER } from '../data/fen.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const OGELER = FEN_SEMBOLLER.map((s) => isarettenOgeye(s, { ekBilgi: true }));

export default function FenSembolEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Fen: Birim ve Semboller"
      ogeler={OGELER}
      kategoriAdi="sembolü"
      bolumAnahtari="fen-semboller"
      bittiMesaji="Tebrikler! Tüm fen sembollerini öğrendiniz."
    />
  );
}
