import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KURAN_HECELERI, KURAN_KELIMELERI } from '../data/kuran.js';

// Kur'an braillesinde harf + hareke ardı ardına ayrı hücreler olarak yazılır.
// Bu sayfa, tek hücre adımlama modunda (mobilde de net okunan) her kelimenin
// braille hücrelerini sırayla gösterir.
const KAYNAKLAR = {
  hece: {
    etiket: 'Hece Okuma',
    bittiMesaji: 'Tebrikler! Tüm heceleri okudunuz.',
    veri: KURAN_HECELERI.map((h) => ({
      yazi: h.yazi,
      okunus: h.okunus,
      hucreler: h.hucreler
    }))
  },
  kelime: {
    etiket: 'Kelime Okuma',
    bittiMesaji: 'Tebrikler! Tüm kelimeleri okudunuz.',
    veri: KURAN_KELIMELERI.map((k) => ({
      yazi: k.yazi,
      okunus: k.okunus,
      anlam: k.anlam,
      hucreler: k.hucreler
    }))
  }
};

export default function KuranKelimeOkuma({ kaynakAnahtari = 'hece', baslik }) {
  const kaynak = KAYNAKLAR[kaynakAnahtari] || KAYNAKLAR.hece;
  return (
    <CokHucreOkuyucu
      baslik={baslik || kaynak.etiket}
      ogeler={kaynak.veri}
      bittiMesaji={kaynak.bittiMesaji}
      rtl
      bolumAnahtari={`kuran-kelime-${kaynakAnahtari}`}
    />
  );
}
