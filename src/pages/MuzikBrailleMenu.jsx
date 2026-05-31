import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { Ikon } from '../data/moduller.jsx';
import { MUZIK_BOLUMLER } from '../data/muzik.js';
import { indeksAl } from '../utils/ilerleme.js';

export default function MuzikBrailleMenu() {
  const navigate = useNavigate();
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
        <nav className="menu-grid" style={{ width: '100%' }} aria-label="Müzik Braille dersleri">
          {/* Müzik → BRF Yazım Editörü (ayrı sayfa) */}
          <button
            type="button"
            className="menu-card"
            onClick={() => navigate('/muzik-brf-yazim')}
            aria-label="Müzik → BRF Yazım Editörü"
            style={{ borderColor: 'var(--accent, #2563eb)' }}
          >
            <span className="menu-card-ikon" aria-hidden="true">📝</span>
            <span className="menu-card-yazi">Müzik → BRF Yazım Editörü</span>
            <span className="menu-card-ilerleme devam" aria-hidden="true">Skor + Braille (iki sekme)</span>
          </button>
          {MUZIK_BOLUMLER.map((b) => {
            const yol = `/muzik/${b.slug}`;
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
                  b.pageBaslik +
                  (tamamlandi ? ', tamamlandı' : `, ${ilerleme} / ${toplam}`)
                }
              >
                <span className="menu-card-ikon" aria-hidden="true">{Ikon.nota}</span>
                <span className="menu-card-yazi">{b.pageBaslik}</span>
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
        </nav>
      </div>
    </div>
  );
}
