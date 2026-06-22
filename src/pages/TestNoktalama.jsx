import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { NOKTALAMA_ISARETLERI, OZEL_ISARETLER } from '../data/braille.js';

// Modül 3 (Noktalama ve Özel İşaretler) Test/Sınav — ortak CokluTest bileşeni
// (klavye girişi + ses efekti + Perkins/mobil klavye). Bazı özel işaretlerin
// braille hücresi yoktur (bilgi kartları); CokluTest hucreler'i boş olanları eler.
const KAYNAKLAR = {
  noktalama: {
    etiket: 'Noktalama İşaretleri',
    kategori: 'noktalama işareti',
    veri: NOKTALAMA_ISARETLERI.map((n) => ({
      ad: n.sembol,
      ariaAd: `${n.ad} işareti`,
      ipucu: n.ad,
      hucreler: n.hucreler,
    })),
  },
  ozel: {
    etiket: 'Özel İşaretler',
    kategori: 'özel işaret',
    veri: OZEL_ISARETLER.map((o) => ({
      ad: o.sembol,
      ariaAd: o.ad,
      ipucu: o.ad,
      hucreler: o.hucreler,
    })),
  },
};

export default function TestNoktalama() {
  return <CokluTest baslik="Modül 3 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
