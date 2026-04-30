import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { MUZIK_DIZILERI } from '../data/muzik.js';

export default function MuzikDiziOkuma() {
  const ogeler = MUZIK_DIZILERI.map((m) => ({
    yazi: m.yazi,
    okunus: m.okunus,
    anlam: m.anlam,
    hucreler: m.hucreler
  }));
  return (
    <CokHucreOkuyucu
      baslik="Müzik: Dizi Okuma"
      ogeler={ogeler}
      bittiMesaji="Tebrikler! Tüm müzik dizilerini okudunuz."
    />
  );
}
