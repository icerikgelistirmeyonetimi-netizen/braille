import React, { useEffect, useState } from 'react';
import { IOS_TAM_EKRAN_IPUCU, tamEkranApiDestekleniyorMu } from '../utils/tamEkran.js';

export default function FullscreenButonu() {
  const [destek, setDestek] = useState(() => tamEkranApiDestekleniyorMu());
  const [uyari, setUyari] = useState('');
  const [durum, setDurum] = useState(() =>
    !!(document.fullscreenElement || document.webkitFullscreenElement)
  );

  useEffect(() => {
    setDestek(tamEkranApiDestekleniyorMu());
  }, []);

  useEffect(() => {
    if (!uyari) return undefined;
    const t = window.setTimeout(() => setUyari(''), 6000);
    return () => window.clearTimeout(t);
  }, [uyari]);

  useEffect(() => {
    const guncelle = () =>
      setDurum(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', guncelle);
    document.addEventListener('webkitfullscreenchange', guncelle);
    return () => {
      document.removeEventListener('fullscreenchange', guncelle);
      document.removeEventListener('webkitfullscreenchange', guncelle);
    };
  }, []);

  const tikla = () => {
    if (!destek) {
      setUyari(IOS_TAM_EKRAN_IPUCU);
      return;
    }
    if (durum) {
      const fn = document.exitFullscreen || document.webkitExitFullscreen;
      if (fn) fn.call(document).catch(() => {});
    } else {
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) fn.call(el).catch(() => {});
    }
  };

  const etiketDisa = durum ? 'Tam ekrandan çık' : 'Tam ekran';
  const uzunAciklama = !destek ? IOS_TAM_EKRAN_IPUCU : (durum ? 'Tam ekrandan çık' : 'Tam ekran');

  return (
    <>
    <button
      type="button"
      className={`gorunum-btn fs-btn${!destek ? ' fs-btn--sinirli' : ''}`}
      onClick={tikla}
      aria-label={etiketDisa}
      aria-describedby={!destek ? 'fs-ios-aciklama' : undefined}
      title={uzunAciklama}
    >
      <span aria-hidden="true" className="gorunum-ikon">
        {durum ? (
          // Küçült ikonu
          <svg viewBox="0 0 24 24" focusable="false" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3" />
            <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
            <path d="M3 16h3a2 2 0 0 1 2 2v3" />
            <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
          </svg>
        ) : (
          // Büyüt ikonu
          <svg viewBox="0 0 24 24" focusable="false" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8V3h5" />
            <path d="M21 8V3h-5" />
            <path d="M3 16v5h5" />
            <path d="M21 16v5h-5" />
          </svg>
        )}
      </span>
    </button>
    {!destek && (
      <span id="fs-ios-aciklama" className="sr-only">{IOS_TAM_EKRAN_IPUCU}</span>
    )}
    {uyari && (
      <div className="toast toast-fs-aciklama" role="status" aria-live="polite">{uyari}</div>
    )}
    </>
  );
}
