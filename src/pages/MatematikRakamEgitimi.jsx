import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { MATEMATIK_RAKAMLAR, RAKAM_GOSTERGESI } from '../data/matematik.js';
import { nlDan as nl } from '../utils/noktaYardimci.js';

export default function MatematikRakamEgitimi() {
  const ogeler = MATEMATIK_RAKAMLAR.map((r) => ({
    yazi: r.rakam,
    ttsYazi: r.ad,
    hucreler: [RAKAM_GOSTERGESI, r.noktalar],
    hucreBasliklari: ['sayı', r.rakam],
    hucreAriaEtiketleri: ['sayı işareti', `${r.rakam} rakam hücresi`],
    hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
    yonergeDetay: `önce sayı işareti hücresindeki ${nl(RAKAM_GOSTERGESI)}; sonra rakam hücresindeki ${nl(r.noktalar)} oluşur.`,
  }));
  return (
    <CokHucreOkuyucu
      baslik="Matematik: Rakamlar"
      ogeler={ogeler}
      kategoriAdi="rakamı"
      bolumAnahtari="mat-rakamlar"
      bittiMesaji="Tebrikler! Tüm rakamların braille karşılıklarını öğrendiniz."
    />
  );
}
