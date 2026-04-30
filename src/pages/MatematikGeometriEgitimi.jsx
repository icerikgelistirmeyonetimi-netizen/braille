import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { GEOMETRI_SEMBOLLERI } from '../data/matematik.js';

export default function MatematikGeometriEgitimi() {
  return <IsaretSayfasi baslik="Matematik: Geometri" isaretler={GEOMETRI_SEMBOLLERI} />;
}
