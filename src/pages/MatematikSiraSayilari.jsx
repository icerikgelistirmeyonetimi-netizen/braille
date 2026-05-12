import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { RAKAM_GOSTERGESI, SIRA_SAYISI_RAKAM_NOKTALARI } from '../data/matematik.js';

/**
 * Tek basamaklı sıra yazımı: bir sayı işareti + indirgenmiş rakam.
 * @param {string} rakamTek
 * @returns {number[][]}
 */
function tekBasamakSiraSayisiHucreleri(rakamTek) {
  /** @type {number[][]} */
  const liste = [RAKAM_GOSTERGESI];
  const np = SIRA_SAYISI_RAKAM_NOKTALARI[rakamTek];
  if (np) liste.push(np);
  return liste;
}

const SIRA_RAKAMLAR = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Modül 6: sıra sayısı (MEB 1.2.6) — tek basamak 1–9. */
export default function MatematikSiraSayilari() {
  const ogeler = SIRA_RAKAMLAR.map((d) => {
    const hc = tekBasamakSiraSayisiHucreleri(d);
    const indNp = SIRA_SAYISI_RAKAM_NOKTALARI[d];
    return {
      ad: `${d}.`,
      ariaAd: `${d}. sırası`,
      noktalar: indNp,
      hucreler: hc,
      hucreBasliklari: ['sayı', `${d}`],
      hucreAriaEtiketleri: ['sayı işareti', `sıra ${d}`],
      hucreAdlari: ['sayı işareti', `indirgenmiş ${d}`],
      yonergeDetay: `Sayı işareti (${RAKAM_GOSTERGESI.join('-')}), ardı sıra rakamı ${d} (${(indNp || []).join('-')}).`,
    };
  });
  return (
    <DesenOgretici
      baslik="Matematik: Sıra sayıları"
      ogeler={ogeler}
      kategoriAdi="sıra"
      bolumAnahtari="mat-sira-sayilari"
      bittiMesaji="Tamam."
    />
  );
}
