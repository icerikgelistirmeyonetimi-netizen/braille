import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import MuzikNotaEgitimi from './MuzikNotaEgitimi.jsx';
import { MUZIK_BOLUMLER } from '../data/muzik.js';

export default function MuzikBrailleSayfa() {
  const { slug } = useParams();
  const bolum = MUZIK_BOLUMLER.find((b) => b.slug === slug);
  if (!bolum) return <Navigate to="/muzik" replace />;

  if (slug === 'notalar') {
    return <MuzikNotaEgitimi />;
  }

  if (slug === 'sureler') {
    const ogeler = (bolum.veri || []).map((s) => ({
      yazi: s.ad,
      okunus: s.sembol || '',
      anlam: s.aciklama || '',
      hucreler: s.hucreler || [],
    }));
    return (
      <CokHucreOkuyucu
        baslik={bolum.pageBaslik}
        ogeler={ogeler}
        bittiMesaji="Tebrikler! Nota sürelerini tamamladınız."
        bolumAnahtari={bolum.ilerlemeAnahtari}
      />
    );
  }

  return (
    <IsaretSayfasi
      baslik={bolum.pageBaslik}
      isaretler={bolum.veri}
      bolumAnahtari={bolum.ilerlemeAnahtari}
    />
  );
}
