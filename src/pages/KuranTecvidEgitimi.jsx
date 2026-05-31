import React from 'react';
import CokHucreOkuyucu from '../components/CokHucreOkuyucu.jsx';
import { KURAN_TECVID } from '../data/kuran.js';

// Tecvid işaretleri çoğunlukla bir veya iki braille hücresinden oluşur.
// Diğer Kur'an-ı Kerim sayfalarıyla tutarlı olması için çok hücreli okuyucu
// tasarımını kullanır (her hücre ayrı ayrı gösterilir, noktalar tek tek işlenir).
const TECVID_OGELERI = KURAN_TECVID.map((t) => ({
  yazi: t.ad,
  okunus: '',
  anlam: t.aciklama || '',
  hucreler: t.hucreler,
  sembol: t.sembol,
}));

export default function KuranTecvidEgitimi() {
  return (
    <CokHucreOkuyucu
      baslik="Kur'an-ı Kerim: Tecvid İşaretleri"
      ogeler={TECVID_OGELERI}
      bittiMesaji="Tebrikler! Kur'an-ı Kerim tecvid işaretlerini tamamladınız."
      bolumAnahtari="kuran-tecvid"
    />
  );
}
