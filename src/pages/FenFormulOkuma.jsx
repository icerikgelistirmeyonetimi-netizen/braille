import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KIMYASAL_FORMULLER, FIZIK_FORMULLERI } from '../data/fen.js';

export default function FenFormulOkuma({ tur = 'kimya' }) {
  const veri = tur === 'fizik' ? FIZIK_FORMULLERI : KIMYASAL_FORMULLER;
  const baslik = tur === 'fizik' ? 'Fen: Fizik Formülleri' : 'Fen: Kimyasal Formüller';
  const ogeler = veri.map((m) => ({
    yazi: m.yazi,
    okunus: m.okunus,
    anlam: m.anlam,
    hucreler: m.hucreler
  }));
  return (
    <CokHucreOkuyucu
      baslik={baslik}
      ogeler={ogeler}
      bittiMesaji="Tebrikler! Tüm formülleri okudunuz."
      bolumAnahtari={tur === 'fizik' ? 'fen-fizik-formuller' : 'fen-kimya-formuller'}
    />
  );
}
