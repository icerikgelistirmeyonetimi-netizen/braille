import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { FRANSIZCA_BOLUMLER } from '../data/fransizcaBraille.js';

export default function FransizcaBrailleSayfa() {
  const { slug } = useParams();
  const bolum = FRANSIZCA_BOLUMLER.find((b) => b.slug === slug);
  if (!bolum) return <Navigate to="/fransizca" replace />;
  return (
    <IsaretSayfasi
      baslik={bolum.pageBaslik}
      isaretler={bolum.veri}
      bolumAnahtari={bolum.ilerlemeAnahtari}
      seslendirmeDili="fr"
    />
  );
}
