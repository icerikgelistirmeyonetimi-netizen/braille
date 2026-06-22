import React, { useMemo } from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';
import { FRANSIZCA_BOLUMLER } from '../data/fransizcaBraille.js';

// Modül 9 (Yabancı Dil) Test/Sınav — her dilin KENDİ menüsü içinde ayrı test.
// Ortak CokluTest bileşeni (klavye girişi + ses efekti + Perkins/mobil klavye).
// Kategoriler = dilin ders bölümleri (alfabe, grup işaretleri, kısaltmalar …).

const BOLUMLER_MAP = { en: INGILIZCE_BOLUMLER, de: ALMANCA_BOLUMLER, fr: FRANSIZCA_BOLUMLER };
const DIL_AD = { en: 'İngilizce', de: 'Almanca', fr: 'Fransızca' };

const gecerliHucreler = (h) =>
  Array.isArray(h) && h.length > 0 && h.every((c) => Array.isArray(c) && c.length > 0 && c.every((n) => n >= 1 && n <= 6));

function kaynaklariKur(bolumler) {
  const kaynaklar = {};
  (bolumler || []).forEach((b) => {
    const veri = (b.veri || [])
      .filter((o) => gecerliHucreler(o.hucreler))
      .map((o) => ({
        ad: o.sembol || o.ad,
        ariaAd: o.ad,
        ipucu: o.aciklama || o.okumaOzeti || undefined,
        hucreler: o.hucreler,
      }));
    if (veri.length) {
      kaynaklar[b.slug] = { etiket: b.kisaBaslik || b.pageBaslik, kategori: 'işaret', veri };
    }
  });
  return kaynaklar;
}

export default function TestYabanci({ dil = 'en' }) {
  const bolumler = BOLUMLER_MAP[dil] || INGILIZCE_BOLUMLER;
  const kaynaklar = useMemo(() => kaynaklariKur(bolumler), [bolumler]);
  return <CokluTest baslik={`${DIL_AD[dil] || ''} Test / Sınav`} kaynaklar={kaynaklar} />;
}
