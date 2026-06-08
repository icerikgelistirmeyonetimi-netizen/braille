import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mevcutSayfaIcinKaynakAnahtar } from '../utils/karisikYazmaKaynaklari.js';
import { konus } from '../utils/ses.js';

/**
 * Mevcut sayfa için tanımlı bir karışık yazma kaynağı varsa görünür;
 * tıklayınca /yazma-karisik/<kaynak> sayfasına yönlendirir ve karışık
 * yazma etkinliğini başlatır.
 *
 * İki görünüm:
 *  - Varsayılan: sayfa başlığında, "az görenler için" butonunun yanında
 *    gösterilen ikon buton.
 *  - hayalet: sayfanın en altında, "ana sayfaya dön" hayalet butonundan
 *    hemen önce gösterilen, normalde görünmeyen ama ekran okuyucu/klavye
 *    ile erişilebilen tam genişlikte buton.
 */
export default function KarisikYazmaButonu({ hayalet = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const kaynak = mevcutSayfaIcinKaynakAnahtar(pathname);

  if (!kaynak) return null;

  // Yazma sayfasının kendisindeysek butonu gizle
  if (pathname.startsWith('/yazma-karisik')) return null;

  const tikla = () => {
    konus('Karışık yazma etkinliği başlıyor.', { kesintiyle: true });
    navigate('/yazma-karisik/' + kaynak);
  };

  // Sayfa sonu (hayalet) görünümü: "ana sayfaya dön" butonuyla aynı desen.
  if (hayalet) {
    return (
      <button
        type="button"
        className="hayalet-btn"
        onClick={tikla}
        aria-label="Bu derste karışık yazma etkinliği başlat"
        title="Bu derste karışık yazma etkinliği başlat"
      >
        Bu derste karışık yazma etkinliği başlat
      </button>
    );
  }

  return (
    <button
      type="button"
      className="btn gorunum-btn karisik-yazma-btn"
      onClick={tikla}
      aria-label="Bu derste karışık yazma etkinliği başlat"
      title="Karışık yazma etkinliği"
    >
      <span aria-hidden="true" className="gorunum-ikon">
        {/* Kalem + soru işareti / karışık */}
        <svg viewBox="0 0 24 24" focusable="false" fill="none"
             stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21l3-1 11-11-2-2L4 18l-1 3z" />
          <path d="M14 6l4 4" />
          <circle cx="19" cy="5" r="2" fill="currentColor" stroke="none" />
        </svg>
      </span>
    </button>
  );
}
