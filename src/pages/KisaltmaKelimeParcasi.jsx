import React, { useEffect, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { KELIME_PARCASI_KISALTMALARI } from '../data/braille.js';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Kelime Parçası Kısaltmaları (s.262).
// Sembol iki braille hücresinden oluşur:
//   - Ön ek: 4-5 noktaları VEYA 5-6 noktaları
//   - Sembol harfi veya hece kısaltması sembolü
export default function KisaltmaKelimeParcasi() {
  const [indeks, setIndeks] = useState(0);
  const bitti = indeks >= KELIME_PARCASI_KISALTMALARI.length;

  useEffect(() => {
    if (bitti) {
      konus('Tebrikler! Kelime parçası kısaltmalarını tamamladınız.');
      return;
    }
    const k = KELIME_PARCASI_KISALTMALARI[indeks];
    const metin = `${k.etiket} sembolü, "${k.ekler}" eklerini ifade eder.`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik="Kelime Parçası Kısaltmaları" />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Tüm kelime parçası kısaltmalarını öğrendiniz.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = KELIME_PARCASI_KISALTMALARI[indeks];
  const onekEtiket = k.sol.join(',');
  const sagEtiket = k.etiket.split('+')[1];

  return (
    <div className="page">
      <div>
        <PageHeader baslik="Kelime Parçası Kısaltmaları" />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {KELIME_PARCASI_KISALTMALARI.length}
        </div>
      </div>

      <div className="page-mid">
        <div style={{ display: 'flex', gap: 'var(--cell-gap)', alignItems: 'flex-end', flexWrap: 'wrap', justifyContent: 'center' }}>
          <BrailleCell
            aktifNoktalar={k.sol}
            baslik={onekEtiket}
            baslikAriaLabel={`${onekEtiket} noktaları, ön ek`}
          />
          <BrailleCell
            aktifNoktalar={k.sag}
            baslik={sagEtiket}
            baslikAriaLabel={`${sagEtiket} sembolü`}
          />
        </div>
        <div role="status" aria-live="polite"
             style={{ textAlign: 'center', fontSize: '1.2em', color: 'var(--accent)', fontWeight: 700, maxWidth: 600 }}>
          {k.ekler}
        </div>
        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 580 }}>
          Önce {onekEtiket} noktaları, sonra “{sagEtiket}” sembolü yazılır.
          Bu kısaltma kelimenin kökünde, gövdesinde veya ek olarak kullanılır;
          kelimenin başında ya da yalnız başına kullanılamaz.
        </div>
      </div>

      <div className="controls">
        <button type="button" onClick={() => konus(`${k.etiket}, ${k.ekler}.`, { kesintiyle: true })}>
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
