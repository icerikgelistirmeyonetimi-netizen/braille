import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';

export default function IngilizceBrailleSayfa() {
  const { slug } = useParams();
  const bolum = INGILIZCE_BOLUMLER.find((b) => b.slug === slug);
  if (!bolum) return <Navigate to="/ingilizce" replace />;
  return (
    <IsaretSayfasi
      baslik={bolum.pageBaslik}
      isaretler={bolum.veri}
      bolumAnahtari={bolum.ilerlemeAnahtari}
      seslendirmeDili="en"
    />
  );
}
