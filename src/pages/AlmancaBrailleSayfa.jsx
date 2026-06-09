import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';

function isarettenOgeye(s) {
  const hucreler = s.hucreler || [];
  return {
    ad: s.ad,
    altMetin: s.sembol && s.sembol !== '—' ? s.sembol : undefined,
    hucreler,
    noktalar: hucreler[0] || [],
    yonergeDetay: s.aciklama || s.okumaOzeti || undefined,
    ekBilgi: (s.aciklama || s.okumaOzeti || s.kurallar?.length || s.ornekler?.length)
      ? { aciklama: s.aciklama || s.okumaOzeti, kurallar: s.kurallar, ornekler: s.ornekler }
      : undefined,
  };
}

export default function AlmancaBrailleSayfa() {
  const { slug } = useParams();
  const bolum = ALMANCA_BOLUMLER.find((b) => b.slug === slug);
  const ogeler = useMemo(() => (bolum?.veri || []).map(isarettenOgeye), [bolum]);
  if (!bolum) return <Navigate to="/almanca" replace />;
  return (
    <DesenOgretici
      baslik={bolum.pageBaslik}
      ogeler={ogeler}
      kategoriAdi="işareti"
      bolumAnahtari={bolum.ilerlemeAnahtari}
      seslendirmeDili="de"
      bittiMesaji="Tebrikler! Tüm öğeleri tamamladınız."
    />
  );
}
