import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { MATEMATIK_OLCULER } from '../data/matematik.js';

export default function MatematikOlcuEgitimi() {
  return <IsaretSayfasi baslik="Matematik: Ölçüler" isaretler={MATEMATIK_OLCULER} bolumAnahtari="mat-olculer" matematikHucreGorunumu />;
}