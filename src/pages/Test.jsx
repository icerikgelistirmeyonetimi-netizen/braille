import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { HARFLER, RAKAMLAR, NOKTALAMA } from '../data/braille.js';

// Modül 1 (Braille Öğrenme) Test/Sınav — ortak CokluTest bileşeni
// (klavye girişi + ses efekti + Perkins/mobil klavye). Tek hücreli öğeler.
const KAYNAKLAR = {
  harfler: {
    etiket: 'Harfler',
    kategori: 'harf',
    veri: HARFLER.map((h) => ({ ad: h.harf, ariaAd: `${h.harf}`, hucreler: [h.noktalar] })),
  },
  rakamlar: {
    etiket: 'Rakamlar',
    kategori: 'rakam',
    veri: RAKAMLAR.map((r) => ({ ad: r.rakam, ariaAd: `${r.rakam}`, hucreler: [r.noktalar] })),
  },
  noktalama: {
    etiket: 'Noktalama',
    kategori: 'işaret',
    veri: NOKTALAMA.map((n) => ({ ad: n.isaret, ariaAd: n.isim, hucreler: [n.noktalar] })),
  },
};

export default function Test() {
  return <CokluTest baslik="Modül 1 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
