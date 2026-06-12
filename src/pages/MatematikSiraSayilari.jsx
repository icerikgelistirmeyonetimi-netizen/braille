import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { RAKAM_GOSTERGESI, SIRA_SAYISI_RAKAM_NOKTALARI } from '../data/matematik.js';
import { nlDan as nl } from '../utils/noktaYardimci.js';

const SIRALI_AD = {
  '1': 'birinci', '2': 'ikinci', '3': 'üçüncü', '4': 'dördüncü', '5': 'beşinci',
  '6': 'altıncı', '7': 'yedinci', '8': 'sekizinci', '9': 'dokuzuncu',
};

const SIRA_RAKAMLAR = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const INTRO = 'Sıra sayıları, sayı hücreleri bir alta kaydırılarak oluşturulur. Haydi başlayalım!';

export default function MatematikSiraSayilari() {
  const ogeler = SIRA_RAKAMLAR.map((d, i) => {
    const indNp = SIRA_SAYISI_RAKAM_NOKTALARI[d] || [];
    const adSirali = `${SIRALI_AD[d]} sıra sayısı`;
    const detay = `2 hücreden oluşur. 1. hücre ${nl(RAKAM_GOSTERGESI)}, 2. hücre ${nl(indNp)} oluşur.`;
    return {
      yazi: `${d}.`,
      ttsYazi: adSirali,
      hucreler: [RAKAM_GOSTERGESI, indNp],
      hucreBasliklari: ['sayı', `${d}`],
      hucreAriaEtiketleri: ['sayı işareti', `${d} rakam hücresi`],
      hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
      ...(i === 0
        ? { tamYonergeMetni: `${INTRO} ${adSirali}, ${detay} Lütfen bu noktalara sırayla dokunun.` }
        : { yonergeDetay: detay }),
    };
  });
  return (
    <CokHucreOkuyucu
      baslik="Matematik: Sıra sayıları"
      ogeler={ogeler}
      kategoriAdi="sıra sayısı"
      bolumAnahtari="mat-sira-sayilari"
      bittiMesaji="Tebrikler! Tüm sıra sayılarını öğrendiniz."
    />
  );
}
