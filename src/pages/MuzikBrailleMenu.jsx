import React from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { Ikon } from '../data/moduller.jsx';
import { MUZIK_BOLUM_GRUPLARI } from '../data/muzik.js';
import { indeksAl } from '../utils/ilerleme.js';

const muzikMenuBasligi = (baslik = '') => baslik.replace(/^Müzik\s*[·:]\s*/u, '');

export default function MuzikBrailleMenu() {
  const navigate = useNavigate();
  const { grupId } = useParams();
  const grup = grupId ? MUZIK_BOLUM_GRUPLARI.find((g) => g.id === grupId) : null;

  if (grupId && !grup) {
    return <Navigate to="/muzik" replace />;
  }

  return (
    <div className="page">
      <PageHeader baslik="Müzik Braille (UEB)" />
      <div
        className="page-mid"
        style={{
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          padding: '8px 12px',
        }}
      >
        <nav
          className={grup ? 'menu-grid muzik-grup-menu' : 'menu-grid'}
          style={{ width: '100%' }}
          aria-label="Müzik Braille dersleri"
        >
          {!grup && MUZIK_BOLUM_GRUPLARI.map((g) => (
            <button
              key={g.id}
              type="button"
              className="menu-card"
              onClick={() => navigate(`/muzik/grup/${g.id}`)}
              aria-label={`${g.baslik}, ${g.bolumler.length} konu`}
            >
              <span className="menu-card-ikon" aria-hidden="true">
                {g.id === 'temel' ? Ikon.nota : Ikon.muzikDizi}
              </span>
              <span className="menu-card-yazi">{g.baslik}</span>
              <span className="menu-card-ilerleme devam" aria-hidden="true">
                {g.bolumler.length} konu
              </span>
            </button>
          ))}

          {grup && (
            <>
              <h3 className="menu-bolum-baslik">{grup.baslik}</h3>
              {grup.bolumler.map((b) => {
                const yol = `/muzik/${b.slug}`;
                const kartBaslik = muzikMenuBasligi(b.pageBaslik);
                const ilerleme = indeksAl(b.ilerlemeAnahtari);
                const toplam = b.veri.length;
                const tamamlandi = ilerleme >= toplam;
                return (
                  <button
                    key={yol}
                    type="button"
                    className="menu-card"
                    onClick={() => navigate(yol)}
                    aria-label={
                      kartBaslik +
                      (tamamlandi ? ', tamamlandı' : `, ${ilerleme} / ${toplam}`)
                    }
                  >
                    <span className="menu-card-ikon" aria-hidden="true">{Ikon.nota}</span>
                    <span className="menu-card-yazi">{kartBaslik}</span>
                    {tamamlandi && (
                      <span className="menu-card-ilerleme tamamlandi" aria-hidden="true">
                        ✓ Tamamlandı
                      </span>
                    )}
                    {!tamamlandi && (
                      <span className="menu-card-ilerleme devam" aria-hidden="true">
                        {ilerleme} / {toplam}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
