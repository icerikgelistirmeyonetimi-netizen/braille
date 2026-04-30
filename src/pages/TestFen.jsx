import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { YUNAN_HARFLERI, FEN_SEMBOLLER } from '../data/fen.js';

const KAYNAKLAR = {
  yunan: {
    etiket: 'Yunan Harfleri',
    kategori: 'Yunan harfi',
    veri: YUNAN_HARFLERI.map((h) => ({
      ad: h.harf,
      ariaAd: `${h.ad} harfi`,
      ipucu: `${h.ad} (${h.okunus})`,
      hucreler: [h.noktalar]
    }))
  },
  semboller: {
    etiket: 'Birim ve Semboller',
    kategori: 'sembol',
    veri: FEN_SEMBOLLER.map((s) => ({
      ad: s.sembol,
      ariaAd: s.ad,
      ipucu: s.ad,
      hucreler: s.hucreler
    }))
  }
};

export default function TestFen() {
  return <CokluTest baslik="Modül 7 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
