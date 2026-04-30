import React, { useEffect, useState } from 'react';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import { konus, basariBildir, konusmayiDurdur } from '../utils/ses.js';

// MEB Türkçe Braille Yazı Kılavuzu (2014) – Noktalama ve özel işaret sayfası.
// Listedeki her madde için: hücre(ler), açıklama, kullanım kuralları ve örnekleri sıralı olarak gösterir.
export default function IsaretSayfasi({ baslik, isaretler }) {
  const [indeks, setIndeks] = useState(0);
  const [detayAcik, setDetayAcik] = useState(false);
  const bitti = indeks >= isaretler.length;

  useEffect(() => {
    if (bitti) {
      konus(`Tebrikler! ${baslik} bölümünü tamamladınız.`);
      return;
    }
    const k = isaretler[indeks];
    const metin = `${k.ad}. ${k.aciklama}`;
    konus(metin);
    const tekrar = () => konus(metin, { kesintiyle: true });
    window.addEventListener('yonergeTekrar', tekrar);
    return () => window.removeEventListener('yonergeTekrar', tekrar);
  }, [indeks, bitti, baslik, isaretler]);

  // Yeni işarete geçince detay popup'ını kapat
  useEffect(() => { setDetayAcik(false); }, [indeks]);

  useEffect(() => () => konusmayiDurdur(), []);

  if (bitti) {
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          <div className="instruction success" role="status" aria-live="polite" style={{ margin: 0 }}>
            Tebrikler! Tüm işaretleri öğrendiniz.
          </div>
        </div>
        <div className="controls">
          <button type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>
        </div>
      </div>
    );
  }

  const k = isaretler[indeks];
  const noktaMetni = k.hucreler.length > 0
    ? k.hucreler.map((h) => h.join('-')).join('  /  ')
    : 'Bu konu bir kuraldır, hücre sembolü yoktur.';

  return (
    <div className="page">
      <div>
        <PageHeader baslik={baslik} />
        <div className="progress" aria-hidden="true">
          İlerleme: {indeks + 1} / {isaretler.length}
        </div>
      </div>

      <div
        className="isaret-icerik"
        style={{
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px 4px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}
      >
        <div style={{ textAlign: 'center', fontSize: '1.5em', fontWeight: 700, color: 'var(--accent)' }}>
          {k.ad}
          {k.sembol && k.sembol !== '—' && (
            <span style={{ marginLeft: '0.5em', color: 'var(--muted)', fontSize: '0.7em' }}>
              ({k.sembol})
            </span>
          )}
        </div>

        {k.hucreler.length > 0 && (
          <div
            className="cell-row fit"
            style={{ '--hucre-sayisi': k.hucreler.length }}
          >
            {k.hucreler.map((noktalar, i) => (
              <BrailleCell
                key={i}
                aktifNoktalar={noktalar}
                baslikAriaLabel={`${k.ad} sembolü ${i + 1}. hücre`}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em' }}>
          <strong>Noktalar:</strong> {noktaMetni}
        </div>
      </div>

      <div className="controls">
        <button
          type="button"
          onClick={() => konus(`${k.ad}. ${k.aciklama} ${k.kurallar?.[0] || ''}`, { kesintiyle: true })}
        >
          Tekrar Dinle
        </button>
        <button type="button" onClick={() => setDetayAcik(true)}>
          Detay
        </button>
        <button type="button" disabled={indeks === 0} onClick={() => setIndeks((i) => Math.max(0, i - 1))}>
          ← Önceki
        </button>
        <button
          type="button"
          onClick={() => {
            basariBildir('Sıradaki işaret.');
            setTimeout(() => setIndeks((i) => i + 1), 400);
          }}
        >
          Anladım →
        </button>
      </div>

      {detayAcik && (
        <div
          className="detay-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${k.ad} detayları`}
          onClick={(e) => { if (e.target === e.currentTarget) setDetayAcik(false); }}
        >
          <div className="detay-popup">
            <div className="detay-baslik">
              <h2 style={{ margin: 0, color: 'var(--accent)' }}>
                {k.ad}
                {k.sembol && k.sembol !== '—' && (
                  <span style={{ marginLeft: '0.5em', color: 'var(--muted)', fontSize: '0.7em' }}>
                    ({k.sembol})
                  </span>
                )}
              </h2>
              <button
                type="button"
                className="detay-kapat"
                onClick={() => setDetayAcik(false)}
                aria-label="Detayı kapat"
              >
                ✕
              </button>
            </div>
            <div className="detay-icerik">
              <p style={{ margin: '0 0 0.8em 0' }}>{k.aciklama}</p>
              {k.kurallar?.length > 0 && (
                <>
                  <strong>Kullanıldığı yerler:</strong>
                  <ul style={{ margin: '0.3em 0 0.8em 1.2em', padding: 0 }}>
                    {k.kurallar.map((kr, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{kr}</li>)}
                  </ul>
                </>
              )}
              {k.ornekler?.length > 0 && (
                <>
                  <strong>Örnek:</strong>
                  <ul style={{ margin: '0.3em 0 0 1.2em', padding: 0 }}>
                    {k.ornekler.map((o, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{o}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
