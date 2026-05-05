import React from 'react';
import IsaretSayfasi from '../components/IsaretSayfasi.jsx';
import { FEN_SEMBOLLER } from '../data/fen.js';

export default function FenSembolEgitimi() {
  return <IsaretSayfasi baslik="Fen: Birim ve Semboller" isaretler={FEN_SEMBOLLER} bolumAnahtari="fen-semboller" />;
}
