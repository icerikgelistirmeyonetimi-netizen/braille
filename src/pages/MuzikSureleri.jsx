import React, { useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { SURE_GOSTERGELERI, NOTALAR } from '../data/muzik.js';
import { konus, konusmayiDurdur } from '../utils/ses.js';

// Bilgi sayfası: Süre göstergelerinin "Do" notası üzerinden örneklenmesi.
export default function MuzikSureleri() {
  useEffect(() => {
    konus('Müzik notalarında süre, hücreye eklenen 3 ve 6 noktaları ile belirlenir.');
    return () => konusmayiDurdur();
  }, []);

  const doNotasi = NOTALAR[0]; // do = 1-4-5

  return (
    <div className="page" style={{ overflowY: 'auto' }}>
      <PageHeader baslik="Müzik: Nota Süreleri" />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="instruction" style={{ margin: 0 }}>
          Nota süresi, temel hücreye 3 ve/veya 6 noktası eklenerek değiştirilir.
          Aşağıda <strong>Do</strong> notası dört farklı süre ile gösterilmiştir.
        </div>
        {SURE_GOSTERGELERI.map((s) => {
          const noktalar = [...new Set([...doNotasi.noktalar, ...s.noktalarEk])].sort();
          return (
            <div key={s.ad} style={{
              border: '1px solid var(--border, #ccc)', borderRadius: 12, padding: 12,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
              <BrailleCell aktifNoktalar={noktalar} baslikAriaLabel={`${s.ad}: Do`} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1em' }}>
                  {s.ad} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({s.sembol})</span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.95em' }}>
                  Do notası: {noktalar.join('-')}.
                </div>
                <div style={{ fontSize: '0.9em' }}>{s.aciklama}</div>
                <button
                  type="button"
                  style={{ marginTop: 6 }}
                  onClick={() => konus(`${s.ad}, ${s.aciklama} Do notası: ${noktalar.join(', ')}.`,
                                       { kesintiyle: true })}
                >
                  Dinle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
