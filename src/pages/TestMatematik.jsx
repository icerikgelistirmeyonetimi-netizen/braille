import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import {
  MATEMATIK_RAKAMLAR,
  MATEMATIK_SEMBOLLER,
  MATEMATIK_OLCULER,
  GEOMETRI_SEMBOLLERI
} from '../data/matematik.js';

const KAYNAKLAR = {
  rakamlar: {
    etiket: 'Rakamlar',
    kategori: 'rakam',
    veri: MATEMATIK_RAKAMLAR.map((r) => ({
      ad: r.rakam,
      ariaAd: `${r.ad} rakamı`,
      ipucu: `${r.ad} (${r.rakam})`,
      hucreler: r.hucreler
    }))
  },
  semboller: {
    etiket: 'İşlem Sembolleri',
    kategori: 'sembol',
    veri: MATEMATIK_SEMBOLLER.map((s) => ({
      ad: s.sembol,
      ariaAd: s.ad,
      ipucu: s.ad,
      hucreler: s.hucreler
    }))
  },
  olculer: {
    etiket: 'Ölçüler',
    kategori: 'ölçü',
    veri: MATEMATIK_OLCULER.map((s) => ({
      ad: s.sembol,
      ariaAd: s.ad,
      ipucu: s.ad,
      hucreler: s.hucreler
    }))
  },
  geometri: {
    etiket: 'Geometri',
    kategori: 'geometri sembolü',
    veri: GEOMETRI_SEMBOLLERI.map((s) => ({
      ad: s.sembol,
      ariaAd: s.ad,
      ipucu: s.ad,
      hucreler: s.hucreler
    }))
  }
};

export default function TestMatematik() {
  return <CokluTest baslik="Modül 6 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
