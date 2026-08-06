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
      // ⚠ Basılı karşılığı OLMAYAN biçim işaretlerinde (büyük harf/italik/şiir…) `sembol`
      // YOKTUR → kart adı olarak İŞARET ADI gösterilir; yoksa kutu boş kalırdı.
      // ('—' de "sembol yok" nöbetçisidir; isarettenOgeye ile aynı kural.)
      ad: (o.sembol && o.sembol !== '—') ? o.sembol : o.ad,
      ariaAd: o.ad,
      ipucu: o.ad,
      hucreler: o.hucreler,
    })),
  },
};

export default function TestNoktalama() {
  return <CokluTest baslik="Modül 3 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
