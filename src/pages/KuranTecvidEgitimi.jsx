import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KURAN_TECVID } from '../data/kuran.js';

// hucreler: [[1,2],[3,4]] → geçer; hucreler: [1,2,3] (flat) → [[1,2,3]] olarak normalleştirir
function normalizeHucreler(h) {
  const arr = h.hucreler ?? h.noktalar;
  if (!arr || arr.length === 0) return [];
  return Array.isArray(arr[0]) ? arr : [arr];
}

const OGELER = KURAN_TECVID.map((t) => ({
  yazi: t.ad,
  altMetin: t.sembol || undefined,
  hucreler: normalizeHucreler(t),
  yonergeDetay: t.aciklama || undefined,
}));

export default function KuranTecvidEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Kur'an-ı Kerim: Durak İşaretleri"
      ogeler={OGELER}
      kategoriAdi="işareti"
      bolumAnahtari="kuran-tecvid"
      bittiMesaji="Tebrikler! Kur'an-ı Kerim durak işaretlerini tamamladınız."
    />
  );
}
