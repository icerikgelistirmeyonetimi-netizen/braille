import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { MUZIK_SEMBOLLERI } from '../data/muzik.js';

export default function MuzikSembolEgitimi() {
  return <IsaretSayfasi baslik="Müzik: Anahtar ve Semboller" isaretler={MUZIK_SEMBOLLERI} />;
}
