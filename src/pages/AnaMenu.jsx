import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import { indeksAl } from '../utils/ilerleme.js';
import TanitimTuru, { turuSifirla } from '../components/TanitimTuru.jsx';
import GorunumGecisi from '../components/GorunumGecisi.jsx';
import { Ikon, MODULLER } from '../data/moduller.jsx';

export default function AnaMenu() {
  const navigate = useNavigate();
  const [turAcik, setTurAcik] = useState(false);
  const [aktifModul, setAktifModul] = useState(() => {
    try { return sessionStorage.getItem('aktifModul') || 'modul1'; }
    catch { return 'modul1'; }
  });

  useEffect(() => {
    const ANAHTAR = 'braille-hosgeldin-okundu';
    let metin;
    try {
      if (localStorage.getItem(ANAHTAR)) {
        metin = 'Ana menü. Lütfen bir bölüm seçin.';
      } else {
        metin = 'Braille Eğitim uygulamasına hoş geldiniz. Lütfen bir bölüm seçin.';
        localStorage.setItem(ANAHTAR, '1');
      }
    } catch {
      metin = 'Ana menü. Lütfen bir bölüm seçin.';
    }
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => {
      window.removeEventListener('yonergeTekrar', tekrar);
      // Başka sayfaya geçildiğinde menü yönergesi sıraya kalmasın.
      konusmayiDurdur();
    };
  }, []);

  const modul = MODULLER.find((m) => m.id === aktifModul) || MODULLER[0];

  const modulSec = (id) => {
    setAktifModul(id);
    try { sessionStorage.setItem('aktifModul', id); } catch { /* ignore */ }
    const m = MODULLER.find((x) => x.id === id);
    if (m) konus(`${m.baslik}, ${m.altBaslik}`, { kesintiyle: true });
  };

  return (
    <div className="page anasayfa">
      {turAcik && (
        <TanitimTuru zorunlu={false} onKapat={() => setTurAcik(false)} />
      )}
      {!turAcik && <TanitimTuru />}

      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}
      >
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
        <GorunumGecisi />
      </header>

      <div className="modul-layout">
        <aside className="modul-yan" aria-label="Modüller">
          <div className="modul-yan-baslik" aria-hidden="true">Modüller</div>
          {MODULLER.map((m) => (
            <button
              key={m.id}
              type="button"
              className={'modul-sekme' + (m.id === aktifModul ? ' aktif' : '')}
              onClick={() => modulSec(m.id)}
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
            className="modul-sekme modul-ayarlar"
            onClick={() => navigate('/ayarlar')}
            aria-label="Ayarlar"
          >
            <span className="modul-sekme-ikon" aria-hidden="true">{Ikon.ayarlar}</span>
            <span className="modul-sekme-yazi">
              <span className="modul-sekme-baslik">Ayarlar</span>
            </span>
          </button>
        </aside>

        <section className="modul-icerik" aria-label={`${modul.baslik} bölümleri`}>
          <h2 className="modul-icerik-baslik">{modul.baslik} — {modul.altBaslik}</h2>
          <nav className="menu-grid" aria-label={modul.baslik}>
            {modul.ogeler.map((m) => {
              const ilerleme = m.anahtar ? indeksAl(m.anahtar) : 0;
              const tamamlandi = m.toplam && ilerleme >= m.toplam;
              return (
                <button
                  key={m.yol}
                  type="button"
                  className="menu-card"
                  onClick={() => navigate(m.yol)}
                  aria-label={m.baslik + (tamamlandi ? ', tamamlandı' : m.toplam ? `, ${ilerleme} / ${m.toplam}` : '')}
                >
                  <span className="menu-card-ikon" aria-hidden="true">{m.ikon}</span>
                  <span className="menu-card-yazi">{m.baslik}</span>
                  {tamamlandi && (
                    <span className="menu-card-ilerleme tamamlandi" aria-hidden="true">✓ Tamamlandı</span>
                  )}
                  {!tamamlandi && m.toplam && (
                    <span className="menu-card-ilerleme devam" aria-hidden="true">{ilerleme} / {m.toplam}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </section>
      </div>

    </div>
  );
}
