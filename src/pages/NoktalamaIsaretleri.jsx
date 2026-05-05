import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { NOKTALAMA_ISARETLERI } from '../data/braille.js';

export default function NoktalamaIsaretleri() {
  return <IsaretSayfasi baslik="Noktalama İşaretleri" isaretler={NOKTALAMA_ISARETLERI} bolumAnahtari="noktalama-isaretleri" />;
}
