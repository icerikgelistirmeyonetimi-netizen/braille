import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const panelRef = useRef(null);
  const oncekiOdakRef = useRef(null);

  const kapat = useCallback(() => {
    try { localStorage.setItem(ANAHTAR, '1'); } catch { /* yoksay */ }
    konusmayiDurdur();
    setAcik(false);
    // Odağı turu açan öğeye geri ver (ekran okuyucu kaybolmasın).
    const geri = oncekiOdakRef.current;
    if (geri && typeof geri.focus === 'function') {
      window.setTimeout(() => { try { geri.focus(); } catch { /* yoksay */ } }, 0);
    }
    onKapat && onKapat();
  }, [onKapat]);

  // Açılışta önceki odağı hatırla.
  useEffect(() => {
    if (!acik) return;
    oncekiOdakRef.current = document.activeElement;
  }, [acik]);

  // Her adımda: sesli oku + ekran okuyucu odağını panele taşı (başlık+açıklama duyurulur).
  useEffect(() => {
    if (!acik) return undefined;
    const a = ADIMLAR[adim];
    konus(`${a.baslik}. ${a.metin}`);
    const t = window.setTimeout(() => {
      try { panelRef.current?.focus(); } catch { /* yoksay */ }
    }, 60);
    return () => { window.clearTimeout(t); konusmayiDurdur(); };
  }, [acik, adim]);

  // Esc ile kapat + odak tuzağı (Tab diyalog içinde dönsün).
  useEffect(() => {
    if (!acik) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); kapat(); return; }
      if (e.key !== 'Tab') return;
      const kapsayici = panelRef.current;
      if (!kapsayici) return;
      const odaklananlar = Array.from(
        kapsayici.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!odaklananlar.length) return;
      const ilk = odaklananlar[0];
      const son = odaklananlar[odaklananlar.length - 1];
      if (e.shiftKey && document.activeElement === ilk) {
        e.preventDefault(); son.focus();
      } else if (!e.shiftKey && document.activeElement === son) {
        e.preventDefault(); ilk.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [acik, adim, kapat]);

  if (!acik) return null;

  const a = ADIMLAR[adim];
  const sonAdim = adim === ADIMLAR.length - 1;

  return (
    <div
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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tur-baslik"
        aria-describedby="tur-metin"
        tabIndex={-1}
        style={{
          background: 'var(--panel)',
          color: 'var(--fg)',
          border: '3px solid var(--accent)',
          borderRadius: 16,
          padding: 24,
          maxWidth: 560,
          width: '100%',
          outline: 'none'
        }}
      >
        <h2 id="tur-baslik" style={{ marginTop: 0, color: 'var(--accent)' }}>
          {a.baslik}
        </h2>
        <p id="tur-metin" style={{ fontSize: '1.1em', lineHeight: 1.6 }}>{a.metin}</p>

        <div className="progress" aria-hidden="true">
          {adim + 1} / {ADIMLAR.length}
        </div>

        <div className="controls" style={{ justifyContent: 'space-between' }}>
          <button
className="btn"             type="button"
            onClick={kapat}
            style={{ background: 'transparent', color: 'var(--accent)', borderColor: 'var(--accent)' }}
            aria-label="Tanıtımı atla ve kapat"
          >
            Atla
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {adim > 0 && (
              <button className="btn" type="button" onClick={() => setAdim((i) => i - 1)}>
                ← Geri
              </button>
            )}
            {!sonAdim && (
              <button className="btn" type="button" onClick={() => setAdim((i) => i + 1)}>
                İleri →
              </button>
            )}
            {sonAdim && (
              <button className="btn" type="button" onClick={kapat}>
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
