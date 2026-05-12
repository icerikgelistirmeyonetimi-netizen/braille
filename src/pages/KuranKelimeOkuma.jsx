import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KURAN_HECELERI, KURAN_KELIMELERI, KURAN_KELIMELERI_TEMEL } from '../data/kuran.js';

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
  'kelime-temel': {
    etiket: 'Kelime Okuma — Bölüm 1',
    bittiMesaji: 'Tebrikler! Temel kelime okuma bölümünü tamamladınız.',
    veri: KURAN_KELIMELERI_TEMEL.map((kw) => ({
      yazi: kw.yazi,
      okunus: kw.okunus,
      anlam: kw.anlam,
      hucreler: kw.hucreler
    }))
  },
  kelime: {
    etiket: 'Kelime Okuma — Bölüm 2',
    bittiMesaji: 'Tebrikler! Geniş kelime okuma listesini tamamladınız.',
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
