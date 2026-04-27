import React, { useEffect, useState } from 'react';
import { konus, konusmayiDurdur } from '../utils/ses.js';

const ANAHTAR = 'braille-tur-tamam-v1';

const ADIMLAR = [
  {
    baslik: 'Hoş geldiniz',
    metin:
      'Braille Eğitim uygulamasına hoş geldiniz. Bu kısa rehber size uygulamayı tanıtacaktır.'
  },
  {
    baslik: 'Sesli Yönergeler',
    metin:
      'Her ekranda size ne yapmanız gerektiğini sesli olarak söyleyeceğiz. Ayrıca ekran okuyucunuzla da uyumludur.'
  },
  {
    baslik: 'Braille Hücresi',
    metin:
      'Braille hücresi altı noktadan oluşur. Sol sütunda yukarıdan aşağı 1, 2, 3 numaralı noktalar; sağ sütunda yukarıdan aşağı 4, 5, 6 numaralı noktalar bulunur.'
  },
  {
    baslik: 'Eğitim Bölümleri',
    metin:
      'Hücreyi tanı, harf, rakam ve noktalama bölümleri vardır. Her bölüm size adım adım rehberlik eder.'
  },
  {
    baslik: 'Test ve Ayarlar',
    metin:
      'Öğrendiklerinizi test bölümünde sınayabilirsiniz. Ayarlar bölümünden ses, hız, yazı boyutu ve temayı değiştirebilirsiniz.'
  },
  {
    baslik: 'Hazırsınız',
    metin:
      'Tanıtım tamamlandı. İyi öğrenmeler dileriz. Bu rehbere ana menüden tekrar ulaşabilirsiniz.'
  }
];

export default function TanitimTuru({ zorunlu = true, onKapat }) {
  const tamamMi = () => {
    try { return localStorage.getItem(ANAHTAR) === '1'; } catch { return false; }
  };

  const [acik, setAcik] = useState(zorunlu ? !tamamMi() : true);
  const [adim, setAdim] = useState(0);

  useEffect(() => {
    if (!acik) return;
    const a = ADIMLAR[adim];
    konus(`${a.baslik}. ${a.metin}`);
    return () => konusmayiDurdur();
  }, [acik, adim]);

  if (!acik) return null;

  const a = ADIMLAR[adim];
  const sonAdim = adim === ADIMLAR.length - 1;

  const kapat = () => {
    try { localStorage.setItem(ANAHTAR, '1'); } catch {}
    konusmayiDurdur();
    setAcik(false);
    onKapat && onKapat();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tur-baslik"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        zIndex: 1000
      }}
    >
      <div
        style={{
          background: 'var(--panel)',
          color: 'var(--fg)',
          border: '3px solid var(--accent)',
          borderRadius: 16,
          padding: 24,
          maxWidth: 560,
          width: '100%'
        }}
      >
        <h2 id="tur-baslik" style={{ marginTop: 0, color: 'var(--accent)' }}>
          {a.baslik}
        </h2>
        <p style={{ fontSize: '1.1em', lineHeight: 1.6 }}>{a.metin}</p>

        <div className="progress" aria-hidden="true">
          {adim + 1} / {ADIMLAR.length}
        </div>

        <div className="controls" style={{ justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={kapat}
            style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'var(--accent)' }}
            aria-label="Tanıtımı atla ve kapat"
          >
            Atla
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {adim > 0 && (
              <button type="button" onClick={() => setAdim((i) => i - 1)}>
                ← Geri
              </button>
            )}
            {!sonAdim && (
              <button type="button" onClick={() => setAdim((i) => i + 1)}>
                İleri →
              </button>
            )}
            {sonAdim && (
              <button type="button" onClick={kapat}>
                Bitir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function turuSifirla() {
  try { localStorage.removeItem(ANAHTAR); } catch {}
}
