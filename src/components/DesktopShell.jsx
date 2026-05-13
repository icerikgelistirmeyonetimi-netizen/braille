import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MODULLER, Ikon } from '../data/moduller.jsx';
import GorunumGecisi from './GorunumGecisi.jsx';
import KarisikYazmaButonu from './KarisikYazmaButonu.jsx';
import FullscreenButonu from './FullscreenButonu.jsx';
import { ayarlariAl, ayarlariDinle } from '../utils/ayarlar.js';

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
  const sidebarRef = useRef(null);
  const scrollDragRef = useRef(null);
  const [scrollGosterge, setScrollGosterge] = useState({ gorunur: false, top: 10, height: 48 });
  const [gizliModuller, setGizliModuller] = useState(
    () => ayarlariAl().gizliModuller || []
  );
  const aktifModul = getAktifModul(location.pathname);
  const ayarlardaMi = location.pathname === '/ayarlar';
  const gorunurModuller = MODULLER.filter((m) => !gizliModuller.includes(m.id));

  useEffect(() => {
    const cikis = ayarlariDinle((a) => setGizliModuller(a.gizliModuller || []));
    return cikis;
  }, []);

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return undefined;

    const guncelle = () => {
      const { scrollTop, scrollHeight, clientHeight } = sidebar;
      const gorunur = scrollHeight > clientHeight + 2;
      if (!gorunur) {
        setScrollGosterge((onceki) => onceki.gorunur ? { ...onceki, gorunur: false } : onceki);
        return;
      }
      const rayBosluk = 20;
      const rayYukseklik = Math.max(1, clientHeight - rayBosluk);
      const oran = clientHeight / scrollHeight;
      const height = Math.min(96, Math.max(42, rayYukseklik * oran));
      const maxTop = rayBosluk / 2 + rayYukseklik - height;
      const top = rayBosluk / 2 + (scrollTop / (scrollHeight - clientHeight)) * (maxTop - rayBosluk / 2);
      setScrollGosterge({ gorunur: true, top, height });
    };

    guncelle();
    sidebar.addEventListener('scroll', guncelle, { passive: true });
    window.addEventListener('resize', guncelle);

    return () => {
      sidebar.removeEventListener('scroll', guncelle);
      window.removeEventListener('resize', guncelle);
    };
  }, [location.pathname, gorunurModuller.length]);

  const scrollSurukleBaslat = (event) => {
    const sidebar = sidebarRef.current;
    if (!sidebar) return;
    event.preventDefault();
    event.stopPropagation();
    scrollDragRef.current = {
      pointerId: event.pointerId,
      baslangicY: event.clientY,
      baslangicScrollTop: sidebar.scrollTop
    };
    try { event.currentTarget.setPointerCapture?.(event.pointerId); } catch { /* ignore */ }
  };

  const scrollSurukle = (event) => {
    const sidebar = sidebarRef.current;
    const drag = scrollDragRef.current;
    if (!sidebar || !drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();

    const scrollAlani = Math.max(1, sidebar.scrollHeight - sidebar.clientHeight);
    const rayYukseklik = Math.max(1, sidebar.clientHeight - 20);
    const tutamakHareketAlani = Math.max(1, rayYukseklik - scrollGosterge.height);
    const sonraki = drag.baslangicScrollTop + ((event.clientY - drag.baslangicY) * scrollAlani / tutamakHareketAlani);
    sidebar.scrollTop = Math.max(0, Math.min(scrollAlani, sonraki));
  };

  const scrollSurukleBitir = (event) => {
    if (scrollDragRef.current?.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    scrollDragRef.current = null;
    try { event.currentTarget.releasePointerCapture?.(event.pointerId); } catch { /* ignore */ }
  };

  // Ana sayfada shell yok — AnaMenu kendi layout'unu yönetir
  if (location.pathname === '/') return <>{children}</>;

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
      <div className="ds-sidebar-shell">
        <aside ref={sidebarRef} className="ds-sidebar" aria-label="Modüller">
          <div className="modul-yan-baslik" aria-hidden="true">Modüller</div>
          {gorunurModuller.map((m) => (
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
                <span className="modul-sekme-baslik">
                  <span className="modul-sekme-baslik-desk">{m.baslik}</span>
                  <span className="modul-sekme-baslik-mobil">{m.mobilEtiket ?? m.baslik}</span>
                </span>
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
        {scrollGosterge.gorunur && (
          <span
            className="ds-sidebar-scrollbar"
            aria-hidden="true"
            style={{ top: scrollGosterge.top, height: scrollGosterge.height }}
            onPointerDown={scrollSurukleBaslat}
            onPointerMove={scrollSurukle}
            onPointerUp={scrollSurukleBitir}
            onPointerCancel={scrollSurukleBitir}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
          />
        )}
      </div>

      {/* ── Sayfa içeriği ── */}
      <div className="ds-content">
        {children}
      </div>

    </div>
  );
}
