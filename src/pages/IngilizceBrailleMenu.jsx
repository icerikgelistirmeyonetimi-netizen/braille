import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { Ikon } from '../data/moduller.jsx';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';
import { indeksAl } from '../utils/ilerleme.js';

export default function IngilizceBrailleMenu() {
  const navigate = useNavigate();
  return (
    <div className="page">
      <PageHeader baslik="İngilizce Braille" />
      <div
        className="page-mid"
        style={{
          alignItems: 'stretch',
          justifyContent: 'flex-start',
          padding: '8px 12px',
        }}
      >
        <nav className="menu-grid" style={{ width: '100%' }} aria-label="İngilizce Braille dersleri">
          {INGILIZCE_BOLUMLER.map((b) => {
            const yol = `/ingilizce/${b.slug}`;
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
                <span className="menu-card-ikon" aria-hidden="true">{Ikon.modulYabanci}</span>
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
