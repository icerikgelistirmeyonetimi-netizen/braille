import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { RAKAMLAR } from '../data/braille.js';
import { nlDan as nl } from '../utils/noktaYardimci.js';

const SAYI_ISARETI = [3, 4, 5, 6];

const INTRO = 'Sayı yazımı için sayı işareti öne eklenmelidir.';

export default function RakamEgitimi() {
  const ogeler = RAKAMLAR.map((r, i) => {
    const detay = `önce sayı işareti hücresindeki ${nl(SAYI_ISARETI)}; sonra rakam hücresindeki ${nl(r.noktalar)} oluşur.`;
    return {
      yazi: r.rakam,
      ttsYazi: `${r.rakam} rakamı`,
      hucreler: [SAYI_ISARETI, r.noktalar],
      hucreBasliklari: ['sayı', r.rakam],
      hucreAriaEtiketleri: ['sayı işareti', `${r.rakam} rakam hücresi`],
      hucreAdlari: ['sayı işareti hücresi', 'rakam hücresi'],
      ...(i === 0
        ? { tamYonergeMetni: `${INTRO} ${r.rakam} rakamı, ${detay} Lütfen bu noktalara sırayla dokunun.` }
        : { yonergeDetay: detay }),
    };
  });

  return (
    <CokHucreOkuyucu
      baslik="Rakam Eğitimi"
      ogeler={ogeler}
      kategoriAdi="rakamı"
      bolumAnahtari="rakamlar"
      bittiMesaji="Tebrikler! Tüm rakamları öğrendiniz."
    />
  );
}
