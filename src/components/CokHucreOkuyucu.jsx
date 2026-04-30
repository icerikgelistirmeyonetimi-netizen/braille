import React, { useEffect, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// Genel amaçlı çok hücreli sıralı okuma bileşeni.
// ogeler: [{ yazi, okunus, anlam, hucreler: number[][] }]
export default function CokHucreOkuyucu({ baslik, ogeler, bittiMesaji = 'Tebrikler! Tamamladınız.' }) {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= ogeler.length;

  useEffect(() => {
    if (bitti) {
      konus(bittiMesaji);
      return;
    }
    const k = ogeler[indeks];
    const metin = `${k.yazi}, okunuşu: ${k.okunus}. ${k.anlam || ''} ` +
                  `${k.hucreler.length} braille hücresinden oluşur.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti, ogeler, bittiMesaji]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            {bittiMesaji}
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = ogeler[indeks];

  return (
    <div className="page">
      <div>
        <PageHeader baslik={baslik} />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {ogeler.length}
        </div>
      </div>

      <div className="page-mid">
        <div style={{ textAlign: 'center', fontSize: '1.8em', fontWeight: 700, color: 'var(--accent)' }}>
          {k.yazi}
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--cell-gap)',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {k.hucreler.map((noktalar, i) => (
            <BrailleCell
              key={i}
              aktifNoktalar={noktalar}
              baslikAriaLabel={`${i + 1}. hücre`}
            />
          ))}
        </div>
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.2em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.okunus}”
        </div>
        {k.anlam && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 560, margin: '0 auto' }}>
            {k.anlam}
          </div>
        )}
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${k.yazi}, okunuşu ${k.okunus}. ${k.anlam || ''}`, { kesintiyle: true })}
        >
          Tekrar Dinle
        </button>
        <button
          type="button"
          disabled={indeks === 0}
          onClick={() => setIndeks((i) => Math.max(0, i - 1))}
        >
          ← Önceki
        </button>
        <button
          type="button"
          onClick={() => {
            basariBildir('Sıradaki.');
            setTimeout(() => setIndeks((i) => i + 1), 600);
          }}
        >
          Anladım →
        </button>
      </div>
    </div>
  );
}
