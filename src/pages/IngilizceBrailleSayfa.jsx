import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';

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

export default function IngilizceBrailleSayfa() {
  const { slug } = useParams();
  const bolum = INGILIZCE_BOLUMLER.find((b) => b.slug === slug);
  const ogeler = useMemo(() => (bolum?.veri || []).map(isarettenOgeye), [bolum]);
  if (!bolum) return <Navigate to="/ingilizce" replace />;
  return (
    <DesenOgretici
      baslik={bolum.pageBaslik}
      ogeler={ogeler}
      kategoriAdi="işareti"
      bolumAnahtari={bolum.ilerlemeAnahtari}
      seslendirmeDili="en"
      bittiMesaji="Tebrikler! Tüm öğeleri tamamladınız."
    />
  );
}
