import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { OZEL_ISARETLER } from '../data/braille.js';

export default function OzelIsaretler() {
  return <IsaretSayfasi baslik="Diğer Özel İşaretler" isaretler={OZEL_ISARETLER} bolumAnahtari="ozel-isaretler" />;
}
