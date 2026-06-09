import React from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { RAKAM_GOSTERGESI, SIRA_SAYISI_RAKAM_NOKTALARI } from '../data/matematik.js';

// noktaListesi yerel: "3. noktasından" / "3. ve 4. noktalarından" / "3., 4. ve 5. noktalarından"
function nl(nArr) {
  if (!nArr || nArr.length === 0) return '';
  if (nArr.length === 1) return `${nArr[0]}. noktadan`;
  if (nArr.length === 2) return `${nArr[0]}. ve ${nArr[1]}. noktalardan`;
  const bas = nArr.slice(0, -1).map((n) => `${n}.`).join(', ');
  return `${bas} ve ${nArr[nArr.length - 1]}. noktalardan`;
}

const SIRALI_AD = {
  '1': 'birinci', '2': 'ikinci', '3': 'üçüncü', '4': 'dördüncü', '5': 'beşinci',
  '6': 'altıncı', '7': 'yedinci', '8': 'sekizinci', '9': 'dokuzuncu',
};

const SIRA_RAKAMLAR = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const INTRO = 'Sıra sayıları, sayı hücreleri bir alta kaydırılarak oluşturulur. Haydi başlayalım!';

/** Modül 6: sıra sayısı (MEB 1.2.6) — tek basamak 1–9. */
export default function MatematikSiraSayilari() {
  const ogeler = SIRA_RAKAMLAR.map((d, i) => {
    const indNp = SIRA_SAYISI_RAKAM_NOKTALARI[d] || [];
    const adSiralı = `${SIRALI_AD[d]} sıra sayısı`;
    const detay = `2 hücreden oluşur. 1. hücre ${nl(RAKAM_GOSTERGESI)}, 2. hücre ${nl(indNp)} oluşur.`;
    return {
      ad: `${d}.`,
      ariaAd: adSiralı,
      noktalar: indNp,
      hucreler: [RAKAM_GOSTERGESI, indNp],
      hucreBasliklari: ['sayı', `${d}`],
      hucreAriaEtiketleri: ['sayı işareti', `${d} rakam hücresi`],
      hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
      ...(i === 0
        ? { tamYonergeMetni: `${INTRO} ${adSiralı}, ${detay} Lütfen bu noktalara sırayla dokunun.` }
        : { yonergeDetay: detay }),
    };
  });
  return (
    <DesenOgretici
      baslik="Matematik: Sıra sayıları"
      ogeler={ogeler}
      kategoriAdi="sıra sayısı"
      bolumAnahtari="mat-sira-sayilari"
      bittiMesaji="Tebrikler! Tüm sıra sayılarını öğrendiniz."
    />
  );
}
