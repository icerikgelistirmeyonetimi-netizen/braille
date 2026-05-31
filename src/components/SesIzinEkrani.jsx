import React, { useState, useEffect, useRef } from 'react';
import { konus, konusmayiDurdur } from '../utils/ses.js';

/**
 * Ses izni için ERİŞİLEBİLİR modal popup.
 * - role="dialog" + aria-modal: ekran okuyucular kalıcı diyalog olarak tanır.
 * - Açılışta odak doğrudan onay düğmesine taşınır (tüm cihazlarda).
 * - Focus trap: Tab odağı diyalog içinde tutar.
 * - Kapanınca odak, açılıştan önceki öğeye geri verilir.
 * - Uygulamanın sesli yönerge (konus) deseniyle ayrıca seslendirilir.
 * Zorunlu bir izin olduğundan ESC / dışarı tıklama ile kapanmaz.
 */
export default function SesIzinEkrani({
  baslik = 'Sesli etkinlik',
  aciklama = 'Bu etkinlikte ses kayıtları kullanılacak. Seslerin doğru çalışması için önce sesi başlatmanız gerekir.',
  butonMetni = 'Sesi Başlat ve Etkinliğe Geç',
  ilkSesUrl,
  onIzinVerildi,
  // true → ilk ses DUYULMADAN (volume 0) yalnızca kilidi açar (ör. harf adı "elif"
  // izole söylenmesin). false (varsayılan) → ilk kayıt duyulur çalar (ör. hece/kelime
  // sesi önce duyulsun, ardından ekran yönergesi okunsun).
  sessizBaslat = false,
}) {
  const [hata, setHata] = useState('');
  const butonRef = useRef(null);
  const dialogRef = useRef(null);
  const oncekiOdakRef = useRef(null);

  useEffect(() => {
    // Açılıştan önceki odağı sakla (kapanınca geri vermek için).
    oncekiOdakRef.current = (typeof document !== 'undefined' && document.activeElement) || null;

    // Odağı doğrudan onay düğmesine taşı.
    const t = window.setTimeout(() => {
      butonRef.current?.focus();
    }, 60);

    // Uygulamanın sesli yönerge deseni: diyaloğu seslendir.
    konus(`${baslik}. ${aciklama} Devam etmek için ${butonMetni} düğmesine basın.`, { kesintiyle: true });

    return () => {
      window.clearTimeout(t);
      // Odağı önceki öğeye geri ver.
      const onceki = oncekiOdakRef.current;
      if (onceki && typeof onceki.focus === 'function') {
        try { onceki.focus(); } catch { /* ignore */ }
      }
    };
  }, []); // yalnızca mount/unmount

  const sesiBaslat = async () => {
    setHata('');
    // Buton erken tıklanırsa açılış yönergesi (TTS) hâlâ konuşuyor olabilir; durdur.
    konusmayiDurdur();

    try {
      // Kullanıcı hareketi (tıklama) içinde kısa bir oynatma tarayıcı autoplay
      // kilidini açar. sessizBaslat ise volume 0 (duyulmaz), değilse normal ses.
      if (ilkSesUrl) {
        const audio = new Audio(ilkSesUrl);
        audio.preload = 'auto';
        audio.volume = sessizBaslat ? 0 : 0.95;

        const result = audio.play();
        if (result && typeof result.then === 'function') {
          await result.catch(() => { /* başarısızsa yut */ });
        }
        if (sessizBaslat) {
          // Sessiz kilit: çalmayı hemen durdur (yalnızca kilit amaçlı).
          try { audio.pause(); audio.currentTime = 0; } catch { /* ignore */ }
        }
      }

      // ilkSesCalindi: true → ders ilk öğenin sesini TEKRAR çalmaz.
      // - sessizBaslat=true (harfler): başlatta ses duyulmadı → ders ekran
      //   yönergesini okur (izole "elif" yok).
      // - sessizBaslat=false (hece/kelime): kayıt başlatta DUYULDU → ders yalnız
      //   yönergeyi okur. Net sıra: kayıt → tarayıcı seslendirmesi.
      onIzinVerildi?.({ ilkSesCalindi: true });
    } catch (err) {
      console.warn('Ses izni alınamadı:', err);
      setHata('Ses başlatılamadı. Lütfen tarayıcıda ses iznine izin verip tekrar deneyin.');
      konus('Ses başlatılamadı. Lütfen tekrar deneyin.', { kesintiyle: true });
    }
  };

  // Focus trap: tek odaklanabilir öğe (onay düğmesi) olduğundan Tab'ı orada tut.
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      butonRef.current?.focus();
    }
  };

  return (
    <div
      className="ses-izin-overlay"
      role="presentation"
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(0, 0, 0, 0.55)',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ses-izin-baslik"
        aria-describedby="ses-izin-aciklama"
        style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          overflowY: 'auto',
          textAlign: 'center',
          border: '2px solid var(--panel-border, #e2e8f0)',
          borderRadius: 16,
          padding: 24,
          background: 'var(--panel, #ffffff)',
          color: 'var(--fg, #1a1f2b)',
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.35)',
        }}
      >
        <div style={{ fontSize: '2.4rem', marginBottom: 10 }} aria-hidden="true">🔊</div>

        <h2 id="ses-izin-baslik" style={{ margin: '0 0 10px', fontSize: '1.35rem', color: 'var(--fg)' }}>
          {baslik}
        </h2>

        <p
          id="ses-izin-aciklama"
          style={{ margin: '0 0 18px', color: 'var(--muted, #5a6477)', lineHeight: 1.5 }}
        >
          {aciklama}
        </p>

        <button
className="btn"           ref={butonRef}
          type="button"
          onClick={sesiBaslat}
          style={{
            width: '100%',
            minHeight: 52,
            padding: '14px 18px',
            borderRadius: 12,
            border: '2px solid var(--accent, #1d4ed8)',
            background: 'var(--accent, #1d4ed8)',
            color: 'var(--accent-fg, #ffffff)',
            fontWeight: 800,
            fontSize: '1.05rem',
            cursor: 'pointer',
          }}
        >
          {butonMetni}
        </button>

        {hata && (
          <div
            role="alert"
            style={{ marginTop: 14, color: '#ff6b6b', fontWeight: 700 }}
          >
            {hata}
          </div>
        )}
      </div>
    </div>
  );
}
