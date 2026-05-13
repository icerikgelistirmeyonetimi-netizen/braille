import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { MUZIK_BOLUMLER } from '../data/muzik.js';

export default function MuzikBrailleSayfa() {
  const { slug } = useParams();
  const bolum = MUZIK_BOLUMLER.find((b) => b.slug === slug);
  if (!bolum) return <Navigate to="/muzik" replace />;
  return (
    <IsaretSayfasi
      baslik={bolum.pageBaslik}
      isaretler={bolum.veri}
      bolumAnahtari={bolum.ilerlemeAnahtari}
    />
  );
}
