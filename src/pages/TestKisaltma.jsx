import React from 'react';
import CokluTest from '../components/CokluTest.jsx';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
} from '../data/braille.js';

// Modül 2 (Kısaltma Sistemi) Test/Sınav — ortak CokluTest bileşeni
// (klavye girişi + ses efekti + Perkins/mobil klavye). Çok hücreli kısaltmalar
// hücre hücre yazılır (kelime kökü: [5] kök işareti + sağ hücre).
const KAYNAKLAR = {
  'bir-harfli': {
    etiket: 'Bir Harfli Kısaltmalar',
    kategori: 'kısaltma',
    veri: KELIME_KISALTMALARI.map((k) => ({
      ad: k.harf,
      ariaAd: `${k.harf} harfi, ${k.kelime} kelimesi`,
      ipucu: `“${k.kelime}” kelimesi`,
      hucreler: [k.noktalar],
    })),
  },
  'iki-harfli': {
    etiket: 'İki Harfli Kısaltmalar',
    kategori: 'kısaltma',
    veri: IKI_HARFLI_KISALTMALAR.map((k) => {
      const buyuk = k.harf.toLocaleUpperCase('tr');
      return {
        ad: buyuk,
        ariaAd: `${buyuk} kısaltması, ${k.kelime} kelimesi`,
        ipucu: `“${k.kelime}” kelimesi`,
        hucreler: [k.sol, k.sag],
      };
    }),
  },
  'hece': {
    etiket: 'Hece Kısaltmaları',
    kategori: 'hece',
    veri: HECE_KISALTMALARI.map((h) => ({
      ad: h.hece,
      ariaAd: `${h.hece} hecesi`,
      ipucu: `“${h.hece}” hecesi`,
      hucreler: [h.noktalar],
    })),
  },
  'kelime-koku': {
    etiket: 'Kelime Kökü Kısaltmaları',
    kategori: 'kelime kökü kısaltması',
    veri: KELIME_KOKU_KISALTMALARI.map((k) => ({
      ad: k.etiket,
      ariaAd: `${k.etiket} kısaltması, ${k.kelime} kelime kökü`,
      ipucu: `“${k.kelime}” kelime kökü`,
      hucreler: [[5], k.sag],
    })),
  },
  'kelime-parcasi': {
    etiket: 'Kelime Parçası Kısaltmaları',
    kategori: 'kelime parçası kısaltması',
    veri: KELIME_PARCASI_KISALTMALARI.map((k) => ({
      ad: k.etiket,
      ariaAd: `${k.etiket} kısaltması, ${k.ekler} ekleri`,
      ipucu: `“${k.ekler}” ekleri`,
      hucreler: [k.sol, k.sag],
    })),
  },
};

export default function TestKisaltma() {
  return <CokluTest baslik="Modül 2 Test / Sınav" kaynaklar={KAYNAKLAR} />;
}
