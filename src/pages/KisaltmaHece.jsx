import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { HECE_KISALTMALARI } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Hece Kısaltmaları.
// Her hece tek bir braille hücresi ile gösterilir.
const SON_KULLANILAMAZ = ['ba', 'be', 'bu', 'ka', 'ha', 'ki'];

export default function KisaltmaHece() {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= HECE_KISALTMALARI.length;

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! Hece kısaltmalarını tamamladınız.');
      return;
    }
    const k = HECE_KISALTMALARI[indeks];
    const metin = `"${k.hece}" hecesi.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="Hece Kısaltmaları" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Tüm hece kısaltmalarını öğrendiniz.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = HECE_KISALTMALARI[indeks];
  const sondaKullanilamaz = SON_KULLANILAMAZ.includes(k.hece);

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Hece Kısaltmaları" />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {HECE_KISALTMALARI.length}
        </div>
      </div>

      <div className="page-mid">
        <BrailleCell
          aktifNoktalar={k.noktalar}
          baslik={k.hece}
          baslikAriaLabel={`${k.hece} hecesi`}
        />
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.hece}”
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 560 }}>
          Bu sembol “{k.hece}” hecesini ifade eder. Noktalar:{' '}
          {k.noktalar.join(', ')}.
          {sondaKullanilamaz && (
            <>
              <br />
              <b>Kural:</b> “{k.hece}” hecesi kelimenin sonunda kullanılamaz.
            </>
          )}
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${k.hece} hecesi.`, { kesintiyle: true })}
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
            basariBildir('Sıradaki hece.');
            setTimeout(() => setIndeks((i) => i + 1), 600);
          }}
        >
          Anladım →
        </button>
      </div>
    </div>
  );
}
