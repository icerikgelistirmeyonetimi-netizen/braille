import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mevcutSayfaIcinKaynakAnahtar } from '../utils/karisikYazmaKaynaklari.js';
import { konus } from '../utils/ses.js';

/**
 * Sayfa başlığında, "az görenler için" butonunun yanında gösterilir.
 * Mevcut sayfa için tanımlı bir kaynak varsa görünür; tıklayınca
 * /yazma-karisik/<kaynak> sayfasına yönlendirir ve karışık yazma
 * etkinliğini başlatır.
 */
export default function KarisikYazmaButonu() {
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

  return (
    <button
      type="button"
      className="gorunum-btn karisik-yazma-btn"
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
