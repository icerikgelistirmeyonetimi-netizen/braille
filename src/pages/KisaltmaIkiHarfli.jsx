import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { IKI_HARFLI_KISALTMALAR } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – İki Harfli Kısaltmalar.
// İki ayrı braille hücresi yan yana gösterilir; alttaki etiket
// ifade ettiği kelimeyi yazar.
export default function KisaltmaIkiHarfli() {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= IKI_HARFLI_KISALTMALAR.length;

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! İki harfli kısaltmaları tamamladınız.');
      return;
    }
    const k = IKI_HARFLI_KISALTMALAR[indeks];
    const metin = `${k.harf.toLocaleUpperCase('tr')} kısaltması, "${k.kelime}" kelimesini ifade eder.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="İki Harfli Kısaltmalar" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Tüm iki harfli kısaltmaları öğrendiniz.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = IKI_HARFLI_KISALTMALAR[indeks];
  const harfBuyuk = k.harf.toLocaleUpperCase('tr');

  return (
    <div className="page">
      <div>
        <PageHeader baslik="İki Harfli Kısaltmalar" />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {IKI_HARFLI_KISALTMALAR.length}
        </div>
      </div>

      <div className="page-mid">
        <div style={{ display: 'flex', gap: 'var(--cell-gap)', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
          <BrailleCell
            aktifNoktalar={k.sol}
            baslik={harfBuyuk[0]}
            baslikAriaLabel={`${harfBuyuk[0]} harfi`}
          />
          <BrailleCell
            aktifNoktalar={k.sag}
            baslik={harfBuyuk[1]}
            baslikAriaLabel={`${harfBuyuk[1]} harfi`}
          />
        </div>
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700 }}>
          “{k.kelime}”
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 560 }}>
          {harfBuyuk} harfleri yan yana yazıldığında “{k.kelime}” kelimesini ifade eder.
          Bu kısaltma yalnız başına veya kelimenin başında ek alarak kullanılır.
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${harfBuyuk} kısaltması, ${k.kelime} kelimesi.`, { kesintiyle: true })}
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
