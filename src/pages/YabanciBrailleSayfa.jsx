import React, { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';
import { FRANSIZCA_BOLUMLER } from '../data/fransizcaBraille.js';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';
import { isarettenOgeye } from '../utils/isaretCevir.js';

const DIL = {
  de: { bolumler: ALMANCA_BOLUMLER, menuYolu: '/almanca' },
  fr: { bolumler: FRANSIZCA_BOLUMLER, menuYolu: '/fransizca' },
  en: { bolumler: INGILIZCE_BOLUMLER, menuYolu: '/ingilizce' },
};

export default function YabanciBrailleSayfa({ dil }) {
  const { slug } = useParams();
  const { bolumler, menuYolu } = DIL[dil];
  const bolum = bolumler.find((b) => b.slug === slug);
  const ogeler = useMemo(
    () => (bolum?.veri || []).map((s) => isarettenOgeye(s, { ekBilgi: true, okumaOzeti: true })),
    [bolum]
  );
  if (!bolum) return <Navigate to={menuYolu} replace />;
  return (
    <CokHucreOkuyucu
      baslik={bolum.pageBaslik}
      ogeler={ogeler}
      kategoriAdi="işareti"
      bolumAnahtari={bolum.ilerlemeAnahtari}
      seslendirmeDili={dil}
      bittiMesaji="Tebrikler! Tüm öğeleri tamamladınız."
    />
  );
}
