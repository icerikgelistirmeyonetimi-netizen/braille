import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { KELIME_KOKU_KISALTMALARI } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Kelime Kökü Kısaltmaları (s.259).
// Sembol iki braille hücresinden oluşur:
//   - 5. nokta (kök işareti)
//   - alfabe harfi veya hece kısaltması sembolü
export default function KisaltmaKelimeKoku() {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= KELIME_KOKU_KISALTMALARI.length;

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! Kelime kökü kısaltmalarını tamamladınız.');
      return;
    }
    const k = KELIME_KOKU_KISALTMALARI[indeks];
    const metin = `${k.etiket} sembolü, "${k.kelime}" kelime kökünü ifade eder.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="Kelime Kökü Kısaltmaları" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Tüm kelime kökü kısaltmalarını öğrendiniz.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = KELIME_KOKU_KISALTMALARI[indeks];

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Kelime Kökü Kısaltmaları" />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {KELIME_KOKU_KISALTMALARI.length}
        </div>
      </div>

      <div className="page-mid">
        <div style={{ display: 'flex', gap: 'var(--cell-gap)', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
          <BrailleCell
            aktifNoktalar={[5]}
            baslik="5"
            baslikAriaLabel="Beşinci nokta, kök işareti"
          />
          <BrailleCell
            aktifNoktalar={k.sag}
            baslik={k.etiket.replace(/^5\+?/, '')}
            baslikAriaLabel={`${k.etiket} sembolü`}
          />
        </div>
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.kelime}”
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 580 }}>
          Önce 5. nokta (kök işareti), sonra {k.etiket.includes('+')
            ? `“${k.etiket.split('+')[1]}” hece sembolü`
            : `“${k.etiket.slice(1)}” harfi`} yazılır. Bu kısaltma “{k.kelime}” kelime kökünü ifade eder.
          Yalnız başına ya da sonuna ek alarak kelimenin başında kullanılır.
        </div>
      </div>

      <div className="controls">
        <button type="button" onClick={() => konus(`${k.etiket}, ${k.kelime}.`, { kesintiyle: true })}>
          Tekrar Dinle
        </button>
        <button type="button" disabled={indeks === 0} onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
          ← Önceki
        </button>
        <button
          type="button"
          onClick={() => {
            basariBildir('Sıradaki kısaltma.');
            setTimeout(() => setIndeks((i) => i + 1), 600);
          }}
        >
          Anladım →
        </button>
      </div>
    </div>
  );
}
