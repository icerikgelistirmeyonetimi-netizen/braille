import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';

export default function AlmancaBrailleSayfa() {
  const { slug } = useParams();
  const bolum = ALMANCA_BOLUMLER.find((b) => b.slug === slug);
  if (!bolum) return <Navigate to="/almanca" replace />;
  return (
    <IsaretSayfasi
      baslik={bolum.pageBaslik}
      isaretler={bolum.veri}
      bolumAnahtari={bolum.ilerlemeAnahtari}
      seslendirmeDili="de"
    />
  );
}
