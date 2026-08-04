import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { HARFLER, RAKAMLAR } from '../data/braille.js';

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
  // Noktalama kategorisi YOK: Modül 1'in noktalama dersi kaldırıldı (konu Modül 3'te,
  // `TestNoktalama` ile kendi testinde ölçülüyor) — öğretilmeyen öğe sorulmasın.
};

export default function Test() {
  return <CokluTest baslik="Modül 1 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
