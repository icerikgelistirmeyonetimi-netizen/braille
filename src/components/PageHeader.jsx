import React from 'react';
import { useNavigate } from 'react-router-dom';
import GorunumGecisi from './GorunumGecisi.jsx';
import KarisikYazmaButonu from './KarisikYazmaButonu.jsx';
import FullscreenButonu from './FullscreenButonu.jsx';
import { Ikon } from '../data/moduller.jsx';

export default function PageHeader({ baslik }) {
  const navigate = useNavigate();
  // Tarayıcı geçmişi varsa bir önceki sayfaya, yoksa ana menüye yönlendir.
  const geriDon = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };
  return (
    <header className="header-bar">
      <button
        type="button"
        className="btn back-btn"
        onClick={geriDon}
        aria-label="Önceki sayfaya dön"
        title="Önceki sayfaya dön"
      >
        <span aria-hidden="true" className="back-ikon">
          <svg viewBox="0 0 24 24" focusable="false" fill="none"
               stroke="currentColor" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </span>
      </button>
      {/* ⚠ BAŞLIK HİYERARŞİSİ (kullanıcı: "braille öğreniyorum h1, noktalama işaretleri h2,
          nokta h3 olması daha makbul olur"): h1 = uygulama adı (DesktopShell banner'ı),
          h2 = sayfa başlığı (burası), h3 = o anki öğe (CokHucreOkuyucu `yazi`).
          ⚠ DesktopShell banner'ı `.ds-header { display: none }` ile <900px'de GİZLİ →
          mobilde sayfada h1 KALMAZDI. Bu sr-only h1 boşluğu doldurur; ≥900px'de CSS ile
          gizlenir (bkz. .sayfa-uygulama-basligi) → her genişlikte TAM BİR h1 olur. */}
      <h1 className="sayfa-uygulama-basligi">Braille Öğreniyorum</h1>
      <h2
        className="banner-baslik"
        style={{
          margin: 0,
          fontSize: 'clamp(0.95em, 4.2vw, 1.5em)',
          flex: 1,
          minWidth: 0,
          textAlign: 'center'
        }}
        title={baslik}
      >
        {baslik}
      </h2>
      <div className="header-aksiyon">
        {/* Braille arama — mobilde shell banner gizli olduğundan arama buraya da gelir;
            masaüstünde banner'da zaten var → CSS ile (.ds-wrapper .header-bar .arama-btn) gizlenir. */}
        <button
          type="button"
          className="btn arama-btn"
          onClick={() => navigate('/arama')}
          aria-label="Braille arama — nokta numarasına göre sembol ara"
          title="Braille arama"
        >
          <span aria-hidden="true" className="arama-ikon">{Ikon.arama}</span>
        </button>
        <KarisikYazmaButonu />
        <FullscreenButonu />
        <GorunumGecisi />
      </div>
    </header>
  );
}
