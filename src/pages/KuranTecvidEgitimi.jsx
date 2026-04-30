import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { KURAN_TECVID } from '../data/kuran.js';

export default function KuranTecvidEgitimi() {
  return <IsaretSayfasi baslik="Kur'an: Tecvid İşaretleri" isaretler={KURAN_TECVID} />;
}
