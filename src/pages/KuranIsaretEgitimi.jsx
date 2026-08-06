import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import {
  CEZM_SEDDE, MED_HARFLERI, MUKADDER_MEDLER, ELIF_ZAID, HEMZELER,
  TENVINLER, TA_I_MERBUTA, DIGER_UZATMA, HEMZE_VASL,
} from '../data/kuran.js';

// noktalar: [1,2] → hucreler: [[1,2]]
// noktalar: [[1],[2,3]] → hucreler: [[1],[2,3]]
// hucreler: [2,5,6] (hatalı flat) → [[2,5,6]]
function normalizeHucreler(h) {
  const arr = h.hucreler ?? h.noktalar;
  if (!arr || arr.length === 0) return [];
  return Array.isArray(arr[0]) ? arr : [arr];
}

function veriToOge(h) {
  return {
    yazi: h.isaret || h.ad,
    ttsYazi: h.ad,
    hucreler: normalizeHucreler(h),
    yonergeDetay: h.aciklama || undefined,
  };
}

const BOLUMLER = {
  'cezm-sedde':       { baslik: 'Cezim ve Şedde',           kategoriAdi: 'işareti', bolumAnahtari: 'kuran-cezm-sedde',      veri: CEZM_SEDDE },
  'tenvinler':        { baslik: 'Tenvinler',                 kategoriAdi: 'tenvini', bolumAnahtari: 'kuran-tenvinler',        veri: TENVINLER },
  'ta-i-merbuta':     { baslik: "Ta-i Merbûta",             kategoriAdi: 'işareti', bolumAnahtari: 'kuran-ta-i-merbuta',    veri: TA_I_MERBUTA },
  'med-harfleri':     { baslik: 'Med (Uzatma) Harfleri',    kategoriAdi: 'harfi',   bolumAnahtari: 'kuran-med-harfleri',    veri: MED_HARFLERI },
  'mukadder-medler':  { baslik: 'Mukadder Medler',           kategoriAdi: 'işareti', bolumAnahtari: 'kuran-mukadder-medler', veri: MUKADDER_MEDLER },
  'elif-zaid':        { baslik: 'Elif-i Zaid',               kategoriAdi: 'işareti', bolumAnahtari: 'kuran-elif-zaid',       veri: ELIF_ZAID },
  'diger-uzatma':     { baslik: 'Diğer Uzatma İşaretleri',  kategoriAdi: 'işareti', bolumAnahtari: 'kuran-diger-uzatma',   veri: DIGER_UZATMA },
  'hemzeler':         { baslik: 'Hemzeler',                  kategoriAdi: 'hemzesi', bolumAnahtari: 'kuran-hemzeler',        veri: HEMZELER },
  'hemze-vasl':       { baslik: 'Hemze-i Vasl ve Kat',      kategoriAdi: 'işareti', bolumAnahtari: 'kuran-hemze-vasl',     veri: HEMZE_VASL },
};

export default function KuranIsaretEgitimi() {
  const { slug } = useParams();
  const bolum = BOLUMLER[slug];
  const ogeler = useMemo(() => (bolum?.veri || []).map(veriToOge), [bolum]);
  if (!bolum) return <Navigate to="/kuran-harfler" replace />;
  return (
    <CokHucreOkuyucu
      // ⚠ key ŞART: tüm alt dersler aynı route'ta (/kuran-isaretler/:slug) — slug değişince
      // remount olmazsa indeks state'i önceki dersin "bitti" değerinde kalır (kullanıcı:
      // "sonraki içerik butonu sonraki içeriğin son kartına götürüyor").
      key={slug}
      baslik={`Kur'an-ı Kerim: ${bolum.baslik}`}
      ogeler={ogeler}
      kategoriAdi={bolum.kategoriAdi}
      bolumAnahtari={bolum.bolumAnahtari}
      bittiMesaji={`Tebrikler! ${bolum.baslik} bölümünü tamamladınız.`}
      rtl
    />
  );
}
