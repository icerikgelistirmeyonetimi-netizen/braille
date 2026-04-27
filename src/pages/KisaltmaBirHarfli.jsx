import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { KELIME_KISALTMALARI } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Bir Harfli Kısaltmalar.
// Her kart braille hücresi + harf + temsil ettiği kelimeyi gösterir.
export default function KisaltmaBirHarfli() {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= KELIME_KISALTMALARI.length;

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! Bir harfli kısaltmaları tamamladınız.');
      return;
    }
    const k = KELIME_KISALTMALARI[indeks];
    const metin = `${k.harf} harfi tek başına yazıldığında "${k.kelime}" kelimesi okunur.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="Bir Harfli Kısaltmalar" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Tüm bir harfli kısaltmaları öğrendiniz.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = KELIME_KISALTMALARI[indeks];

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Bir Harfli Kısaltmalar" />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {KELIME_KISALTMALARI.length}
        </div>
      </div>

      <div className="page-mid">
        <BrailleCell
          aktifNoktalar={k.noktalar}
          baslik={k.harf}
          baslikAriaLabel={`${k.harf} harfi, ${k.kelime} kelimesi`}
        />
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.kelime}”
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 520 }}>
          {k.harf} harfi tek başına yazıldığında veya bir kelimenin başında ek alarak
          kullanıldığında “{k.kelime}” okunur.
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${k.harf} harfi, ${k.kelime} kelimesi.`, { kesintiyle: true })}
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
