import React, { useState } from 'react';

export default function SesIzinEkrani({
  baslik = 'Sesli etkinlik',
  aciklama = 'Bu etkinlikte ses kayıtları kullanılacak. Seslerin doğru çalışması için önce sesi başlatmanız gerekir.',
  butonMetni = 'Sesi Başlat ve Etkinliğe Geç',
  ilkSesUrl,
  onIzinVerildi,
}) {
  const [hata, setHata] = useState('');

  const sesiBaslat = async () => {
    setHata('');

    try {
      if (ilkSesUrl) {
        const audio = new Audio(ilkSesUrl);
        audio.preload = 'auto';
        audio.volume = 0.95;

        const result = audio.play();

        if (result && typeof result.then === 'function') {
          await result;
        }
      }

      onIzinVerildi?.({ ilkSesCalindi: true });
    } catch (err) {
      console.warn('Ses izni alınamadı:', err);
      setHata('Ses başlatılamadı. Lütfen tarayıcıda ses iznine izin verip tekrar deneyin.');
    }
  };

  return (
    <div className="page">
      <div className="page-mid" style={{ gap: 16, textAlign: 'center', padding: 20 }}>
        <div
          style={{
            maxWidth: 520,
            border: '1px solid var(--border, #ddd)',
            borderRadius: 16,
            padding: 20,
            background: 'var(--card, #fff)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 8 }} aria-hidden="true">
            🔊
          </div>

          <h1 style={{ margin: '0 0 10px', fontSize: '1.35rem' }}>
            {baslik}
          </h1>

          <p style={{ margin: '0 0 16px', color: 'var(--muted)', lineHeight: 1.5 }}>
            {aciklama}
          </p>

          <button
            type="button"
            onClick={sesiBaslat}
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            {butonMetni}
          </button>

          {hata && (
            <div
              role="alert"
              style={{
                marginTop: 12,
                color: '#b00020',
                fontWeight: 700,
              }}
            >
              {hata}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
