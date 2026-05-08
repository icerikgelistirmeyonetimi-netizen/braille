import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MODULLER, Ikon } from '../data/moduller.jsx';
import GorunumGecisi from './GorunumGecisi.jsx';
import KarisikYazmaButonu from './KarisikYazmaButonu.jsx';
import FullscreenButonu from './FullscreenButonu.jsx';

function getAktifModul(pathname) {
  for (const m of MODULLER) {
    for (const o of m.ogeler) {
      if (pathname === o.yol || pathname.startsWith(o.yol + '/')) return m.id;
    }
  }
  return null;
}

export default function DesktopShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Ana sayfada shell yok — AnaMenu kendi layout'unu yönetir
  if (location.pathname === '/') return <>{children}</>;

  const aktifModul = getAktifModul(location.pathname);
  const ayarlardaMi = location.pathname === '/ayarlar';

  return (
    <div className="ds-wrapper">

      {/* ── Banner: tam genişlik ── */}
      <header className="ds-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span className="logo" aria-hidden="true">
            <svg viewBox="0 0 64 64" focusable="false">
              <rect x="4" y="4" width="56" height="56" rx="14"
                    fill="currentColor" opacity="0.12" />
              <circle cx="22" cy="18" r="5" fill="currentColor" />
              <circle cx="42" cy="18" r="5" fill="currentColor" />
              <circle cx="22" cy="32" r="5" fill="currentColor" />
              <circle cx="42" cy="32" r="5" fill="currentColor" opacity="0.35" />
              <circle cx="22" cy="46" r="5" fill="currentColor" opacity="0.35" />
              <circle cx="42" cy="46" r="5" fill="currentColor" />
            </svg>
          </span>
          <h1 className="banner-baslik" style={{ margin: 0, fontSize: '1.5em', whiteSpace: 'nowrap' }}>
            Braille Eğitim
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <KarisikYazmaButonu />
          <FullscreenButonu />
          <GorunumGecisi />
        </div>
      </header>

      {/* ── Sol sidebar ── */}
      <aside className="ds-sidebar" aria-label="Modüller">
        <div className="modul-yan-baslik" aria-hidden="true">Modüller</div>
        {MODULLER.map((m) => (
          <button
            key={m.id}
            type="button"
            className={'modul-sekme' + (m.id === aktifModul ? ' aktif' : '')}
            onClick={() => {
              try { sessionStorage.setItem('aktifModul', m.id); } catch { /* ignore */ }
              navigate('/');
            }}
            aria-pressed={m.id === aktifModul}
            aria-label={`${m.baslik}: ${m.altBaslik}`}
          >
            <span className="modul-sekme-ikon" aria-hidden="true">{m.ikon}</span>
            <span className="modul-sekme-yazi">
              <span className="modul-sekme-baslik">{m.baslik}</span>
              <span className="modul-sekme-alt">{m.altBaslik}</span>
            </span>
          </button>
        ))}
        <button
          type="button"
          className={'modul-sekme modul-ayarlar' + (ayarlardaMi ? ' aktif' : '')}
          onClick={() => navigate('/ayarlar')}
          aria-label="Ayarlar"
        >
          <span className="modul-sekme-ikon" aria-hidden="true">{Ikon.ayarlar}</span>
          <span className="modul-sekme-yazi">
            <span className="modul-sekme-baslik">Ayarlar</span>
          </span>
        </button>
      </aside>

      {/* ── Sayfa içeriği ── */}
      <div className="ds-content">
        {children}
      </div>

    </div>
  );
}
