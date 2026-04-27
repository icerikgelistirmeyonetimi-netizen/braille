import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { KISALTMALAR } from '../data/braille.js';
import { konus, basariBildir } from '../utils/ses.js';

// Kısaltmalar bölümü: Her kısaltmayı ekranda göster, sesli olarak açılımını oku.
// Kullanıcı "Anladım" dediğinde bir sonrakine geçer.
export default function KisaltmaEgitimi() {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= KISALTMALAR.length;

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! Kısaltmalar bölümünü tamamladınız.');
      return;
    }
    const k = KISALTMALAR[indeks];
    const metin = `${k.kisaltma} kısaltması, ${k.acilim} anlamına gelir.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="Kısaltmalar" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Kısaltmalar bölümünü tamamladınız.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = KISALTMALAR[indeks];

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Kısaltmalar" />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {KISALTMALAR.length}
        </div>
      </div>

      <div className="page-mid">
        <BrailleCell
          aktifNoktalar={[1, 2, 3, 4, 5, 6]}
          baslik={k.kisaltma}
          baslikAriaLabel={`${k.kisaltma}, ${k.acilim}`}
        />
        <div role="status" aria-live="polite" style={{ textAlign: 'center', color: 'var(--muted)', margin: 0 }}>
          {k.acilim}
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${k.kisaltma}, ${k.acilim}.`)}
        >
          Tekrar Dinle
        </button>
        <button
          type="button"
          onClick={() => {
            basariBildir('Anladım. Sıradaki kısaltma.');
            setTimeout(() => setIndeks((i) => i + 1), 800);
          }}
        >
          Anladım →
        </button>
      </div>
    </div>
  );
}
