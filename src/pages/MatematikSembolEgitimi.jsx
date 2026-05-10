import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { MATEMATIK_SEMBOLLER } from '../data/matematik.js';

export default function MatematikSembolEgitimi() {
  return <IsaretSayfasi baslik="Matematik: Semboller" isaretler={MATEMATIK_SEMBOLLER} bolumAnahtari="mat-semboller" matematikHucreGorunumu />;
}
