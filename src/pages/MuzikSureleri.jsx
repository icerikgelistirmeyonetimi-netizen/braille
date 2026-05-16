import React, { useEffect } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { SURE_GOSTERGELERI, NOTALAR } from '../data/muzik.js';
import { konus, konusmayiDurdur } from '../utils/ses.js';

// Bilgi sayfası: Süre göstergelerinin her nota üzerinden örneklenmesi.
export default function MuzikSureleri() {
  useEffect(() => {
    konus('Müzik notalarında süre, hücreye eklenen 3 ve 6 noktaları ile belirlenir.');
    return () => konusmayiDurdur();
  }, []);

  return (
    <div className="page" style={{ overflowY: 'auto' }}>
      <PageHeader baslik="Müzik: Nota Süreleri" />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="instruction" style={{ margin: 0 }}>
          Nota süresi, temel hücreye 3 ve/veya 6 noktası eklenerek değiştirilir.
          Aşağıda her nota için tüm süre değerleri gösterilmiştir. Önce süre kuralı verilmiş, ardından ilgili notalar listelenmiştir.
        </div>
        {SURE_GOSTERGELERI.map((s) => {
          return (
            <div key={s.ad} style={{
              border: '1px solid var(--border, #ccc)', borderRadius: 12, padding: 12,
              display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: '1px dashed var(--border)', paddingBottom: 12 }}>
                {s.noktalarEk.length > 0 && <BrailleCell aktifNoktalar={s.noktalarEk} baslikAriaLabel={`${s.ad} kuralı`} />}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontWeight: 800, fontSize: '1.1em' }}>
                    {s.ad} Süre Kuralı <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({s.sembol})</span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.95em' }}>
                    {s.noktalarEk.length > 0 ? `Eklenecek noktalar: ${s.noktalarEk.join('-')}` : 'Temel hücre (nokta eklenmez)'}
                  </div>
                  <div style={{ fontSize: '0.9em' }}>{s.aciklama}</div>
                  <button
                    type="button"
                    style={{ marginTop: 6 }}
                    onClick={() => konus(`${s.ad} kuralı, ${s.aciklama}`, { kesintiyle: true })}
                  >
                    Dinle
                  </button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                {NOTALAR.map(nota => {
                  const noktalar = [...new Set([...nota.noktalar, ...s.noktalarEk])].sort((a, b) => a - b);
                  return (
                    <div key={nota.ad} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-card)', padding: 8, borderRadius: 8 }}>
                       <BrailleCell aktifNoktalar={noktalar} baslikAriaLabel={`${s.ad}: ${nota.ad}`} baslik={nota.ad} />
                       <div style={{ marginTop: 4, fontWeight: 'bold' }}>{nota.ad}</div>
                       <div style={{ fontSize: '0.8em', color: 'var(--muted)' }}>{noktalar.join('-')}</div>
                       <button
                         type="button"
                         style={{ marginTop: 4, padding: '4px 8px', fontSize: '0.8em' }}
                         onClick={() => konus(`${s.ad} ${nota.ad}: ${noktalar.join(', ')}.`, { kesintiyle: true })}
                       >Dinle</button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
