import React, { useCallback } from 'react';
import CokluTest from '../components/CokluTest.jsx';
import { NOTALAR, MUZIK_SEMBOLLERI } from '../data/muzik.js';
import { usePianoNotePreview } from '../hooks/music-brf/usePianoNotePreview.js';

// Modül 8 (Müzik) Test/Sınav — ortak CokluTest bileşeni. Nota kategorisinde piyano
// SES KAYDI işitsel ipucu olarak çalar; sembol kategorisinde ses yoktur.
const KAYNAKLAR = {
  notalar: {
    etiket: 'Notalar (Dörtlük)',
    kategori: 'nota',
    veri: NOTALAR.map((n) => ({
      ad: n.ad.toUpperCase(),
      ariaAd: `${n.ad} notası`,
      ipucu: n.ad,
      hucreler: [n.noktalar],
      notaAd: n.ad,
    })),
  },
  semboller: {
    etiket: 'Müzik Sembolleri',
    kategori: 'müzik sembolü',
    veri: MUZIK_SEMBOLLERI
      .filter((s) => s.hucreler.some((h) => h.length > 0))
      .map((s) => ({
        ad: s.sembol,
        ariaAd: s.ad,
        ipucu: s.ad,
        hucreler: s.hucreler.filter((h) => h.length > 0),
      })),
  },
};

export default function TestMuzik() {
  const { playNote } = usePianoNotePreview({ enabled: true, volume: 0.7, extension: 'mp3' });

  const notaSesiCal = useCallback((oge, opts = {}) => {
    if (!oge?.notaAd) { if (typeof opts.onEnded === 'function') opts.onEnded(); return; }
    playNote({ tip: 'nota', notaAd: oge.notaAd, oktav: 4, sureIndeksi: 1 });
    // Piyano ateşle-unut; çağıranı (yönerge) bekletmemek için onEnded hemen çağrılır.
    if (typeof opts.onEnded === 'function') opts.onEnded();
  }, [playNote]);

  const notaSesiVarMi = (oge) => !!oge?.notaAd;

  return (
    <CokluTest
      baslik="Modül 8 Test / Sınav"
      kaynaklar={KAYNAKLAR}
      ogeSesiCal={notaSesiCal}
      ogeSesiVarMi={notaSesiVarMi}
      sesPrompt
      sesButonEtiketi="Nota Sesi"
    />
  );
}
