import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { MATEMATIK_IFADELER } from '../data/matematik.js';

export default function MatematikIfadeOkuma() {
  const ogeler = MATEMATIK_IFADELER.map((m) => ({
    yazi: m.yazi,
    okunus: m.okunus,
    anlam: m.aciklama,
    hucreler: m.hucreler
  }));
  return (
    <CokHucreOkuyucu
      baslik="Matematik: İfade Okuma"
      ogeler={ogeler}
      bittiMesaji="Tebrikler! Tüm matematik ifadelerini okudunuz."
      bolumAnahtari="matematik-ifade"
    />
  );
}
