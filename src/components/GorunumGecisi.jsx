import React, { useEffect, useState } from 'react';
import { ayarlariAl, ayarGuncelle, ayarlariDinle } from '../utils/ayarlar.js';
import { konus } from '../utils/ses.js';

/**
 * Sağ üstte gösterilen "az görenler için" görünüm geçiş butonu.
 * - Varsayılan tema "normal".
 * - Tıklayınca "lowVision" (yüksek kontrast, büyük öğeler) temasına geçer.
 */
export default function GorunumGecisi() {
  const [tema, setTema] = useState(() => ayarlariAl().tema);

  useEffect(() => {
    return ayarlariDinle((a) => setTema(a.tema));
  }, []);

  const azGorenAktif = tema === 'lowVision';

  const tikla = () => {
    const yeni = azGorenAktif ? 'normal' : 'lowVision';
    ayarGuncelle({ tema: yeni });
    konus(
      yeni === 'lowVision'
        ? 'Az görenler için yüksek kontrast görünüm açıldı.'
        : 'Normal görünüm açıldı.',
      { kesintiyle: true }
    );
  };

  return (
    <button
      type="button"
      className="gorunum-btn"
      onClick={tikla}
      aria-pressed={azGorenAktif}
      aria-label={
        azGorenAktif
          ? 'Normal görünüme geç'
          : 'Az görenler için yüksek kontrast görünüme geç'
      }
      title={azGorenAktif ? 'Normal görünüm' : 'Az görenler için görünüm'}
    >
      <span aria-hidden="true" className="gorunum-ikon">
        {azGorenAktif ? (
          // Göz ikonu (normal görünüme dön)
          <svg viewBox="0 0 24 24" focusable="false" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          // Gözlük ikonu (az görenler için)
          <svg viewBox="0 0 24 24" focusable="false" fill="none"
               stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="15" r="4" />
            <circle cx="18" cy="15" r="4" />
            <path d="M10 15h4" />
            <path d="M6 11l3-6h2" />
            <path d="M18 11l-3-6h-2" />
          </svg>
        )}
      </span>
    </button>
  );
}
