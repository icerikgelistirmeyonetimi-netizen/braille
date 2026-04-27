import React from 'react';
import { useNavigate } from 'react-router-dom';
import GorunumGecisi from './GorunumGecisi.jsx';

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
        className="back-btn"
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
      <h1 className="banner-baslik" style={{ margin: 0, fontSize: '1.5em', flex: 1, textAlign: 'center' }}>{baslik}</h1>
      <GorunumGecisi />
    </header>
  );
}
