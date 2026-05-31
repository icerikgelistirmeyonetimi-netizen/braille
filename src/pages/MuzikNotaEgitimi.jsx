import React, { useCallback, useEffect } from 'react';
import DesenOgretici from '../components/DesenOgretici.jsx';
import { NOTALAR } from '../data/muzik.js';
import { usePianoNotePreview } from '../hooks/music-brf/usePianoNotePreview.js';
import { muzikNotaPiyanoSesUrlAl } from '../utils/music-brf/musicPianoAudioHelpers.js';

export default function MuzikNotaEgitimi() {
  const { playNote, preloadUrls } = usePianoNotePreview({
    enabled: true,
    volume: 0.7,
    extension: 'mp3',
  });

  const ogeler = NOTALAR.map((n) => ({
    ad: `${n.ad.charAt(0).toUpperCase()}${n.ad.slice(1)}`,
    ariaAd: `${n.ad} notası`,
    notaAd: n.ad,
    noktalar: n.noktalar,
    aciklama: `${n.ad.charAt(0).toUpperCase() + n.ad.slice(1)} notasının temel hücresi: ${n.noktalar.join('-')}. UEB Music’te bu hücre sekizliği (quaver) temsil eder; süre için 3 ve/veya 6 noktası eklenir.`,
  }));

  useEffect(() => {
    const urls = NOTALAR.map((n) => muzikNotaPiyanoSesUrlAl({
      tip: 'nota',
      notaAd: n.ad,
      oktav: 4,
      sureIndeksi: 1,
    }, { extension: 'mp3' }))
      .filter(Boolean);

    preloadUrls?.(urls);
  }, [preloadUrls]);

  const notaSesiCal = useCallback((oge) => {
    console.log('NOTA SESI CAL', oge);

    if (!oge?.notaAd) return;

    playNote({
      tip: 'nota',
      notaAd: oge.notaAd,
      oktav: 4,
      sureIndeksi: 1,
    });
  }, [playNote]);

  return (
    <DesenOgretici
      baslik="Müzik: Notalar (Do – Si)"
      ogeler={ogeler}
      kategoriAdi="nota"
      bolumAnahtari="muzik-notalar"
      bittiMesaji="Tebrikler! Yedi temel notayı (Do–Si) öğrendiniz."
      ogeSesiCal={notaSesiCal}
      ogeSesiGecikmeMs={3000}
      ustSesKontrolleriGoster
      ustSesButonEtiketi="Nota Sesi"
      ustSesButonAriaLabel="Nota sesini çal"
      otomatikOgeSesi
    />
  );
}
