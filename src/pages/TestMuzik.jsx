import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { NOTALAR, MUZIK_SEMBOLLERI } from '../data/muzik.js';

const KAYNAKLAR = {
  notalar: {
    etiket: 'Notalar (Dörtlük)',
    kategori: 'nota',
    veri: NOTALAR.map((n) => ({
      ad: n.ad.toUpperCase(),
      ariaAd: `${n.ad} notası`,
      ipucu: n.ad,
      hucreler: [n.noktalar]
    }))
  },
  semboller: {
    etiket: 'Müzik Sembolleri',
    kategori: 'müzik sembolü',
    veri: MUZIK_SEMBOLLERI
      .filter((s) => s.hucreler.some((h) => h.length > 0))
      .map((s) => ({
        ad: s.sembol,
        ariaAd: s.ad,
        ipucu: s.ad,
        hucreler: s.hucreler.filter((h) => h.length > 0)
      }))
  }
};

export default function TestMuzik() {
  return <CokluTest baslik="Modül 8 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
