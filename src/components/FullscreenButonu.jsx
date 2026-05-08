import React, { useEffect, useState } from 'react';

export default function FullscreenButonu() {
  const [durum, setDurum] = useState(() =>
    !!(document.fullscreenElement || document.webkitFullscreenElement)
  );

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
    if (durum) {
      const fn = document.exitFullscreen || document.webkitExitFullscreen;
      if (fn) fn.call(document).catch(() => {});
    } else {
      const el = document.documentElement;
      const fn = el.requestFullscreen || el.webkitRequestFullscreen;
      if (fn) fn.call(el).catch(() => {});
    }
  };

  return (
    <button
      type="button"
      className="gorunum-btn fs-btn"
      onClick={tikla}
      aria-label={durum ? 'Tam ekrandan çık' : 'Tam ekran'}
      title={durum ? 'Tam ekrandan çık' : 'Tam ekran'}
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
  );
}
