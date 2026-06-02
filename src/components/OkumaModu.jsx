import React, { useCallback, useEffect, useRef } from 'react';
import { konus, konusmayiDurdur } from '../utils/ses.js';

const HUCRE_SIRASI = [1, 4, 2, 5, 3, 6];

export const hucreleriNormalizeEt = (hucreler) => {
  if (!Array.isArray(hucreler)) return [];
  if (hucreler.length === 0) return [];
  return Array.isArray(hucreler[0]) ? hucreler : [hucreler];
};

export const hucreNoktaMetni = (hucreler) => {
  const temizHucreler = hucreleriNormalizeEt(hucreler);
  if (temizHucreler.length === 0) return 'nokta yok';
  return temizHucreler
    .map((hucre, index) => {
      const noktaMetni = hucre.length > 0 ? hucre.join(', ') : 'boş';
      return temizHucreler.length > 1 ? `${index + 1}. hücre ${noktaMetni}` : noktaMetni;
    })
    .join('; ');
};

export function OkumaModuButonu({ onClick }) {
  return (
    <button
      type="button"
      className="btn okuma-modu-btn sayfa-ici"
      onClick={onClick}
      aria-label="Okuma moduna geç"
      title="Okuma modu"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
        <path d="M4 5h7a4 4 0 0 1 4 4v10H8a4 4 0 0 0-4 4V5z" />
        <path d="M15 9a4 4 0 0 1 4-4h1v14h-5" />
        <path d="M8 9h3M8 13h3" />
      </svg>
    </button>
  );
}


export default function OkumaModuListesi({
  baslik,
  ogeler,
  getEtiket,
  getTtsEtiket, // opsiyonel: TTS için ayrı etiket (gösterim farklıysa)
  getAltEtiket,
  getHucreler,
  onSec,
  onKapat,
  rtl = false,
  seslendirmeDili = 'tr',
  ogeSesiCal,
  ogeSesiGecikmeMs = 1200,
  okumaModuOgeSesiGecikmeMs = 900,
  okumaModuOgeSesiAktif = false,
  okumaModundaSadeceOgeSesi = false,
}) {
  const sonOkunanRef = useRef(null);
  const sonOkumaOgesiRef = useRef({ oge: null, time: 0 });
  const okumaOgeSesiTimerRef = useRef(null);
  const aktifIstekRef = useRef(0); // her yeni öğe isteğinde artar; eski ses-bitti callback'lerini geçersiz kılar

  const okumaOgeSesiTemizle = useCallback(() => {
    if (okumaOgeSesiTimerRef.current) {
      clearTimeout(okumaOgeSesiTimerRef.current);
      okumaOgeSesiTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    konus(`${baslik} okuma modu. ${ogeler.length} öğe listelendi. Bir kutunun üzerine gelince adı ve Braille noktaları okunur.`);
    return () => {
      okumaOgeSesiTemizle();
      konusmayiDurdur();
    };
  }, [baslik, ogeler.length, okumaOgeSesiTemizle]);

  const okumaOgesiniSeslendirVeCal = useCallback((oge) => {
    if (!oge) return;

    const now = Date.now();
    if (sonOkumaOgesiRef.current.oge === oge && now - sonOkumaOgesiRef.current.time < 250) {
      return;
    }
    sonOkumaOgesiRef.current = { oge, time: now };

    okumaOgeSesiTemizle();

    const sesCalabilir = okumaModuOgeSesiAktif && typeof ogeSesiCal === 'function';

    if (okumaModundaSadeceOgeSesi) {
      konusmayiDurdur();
      okumaOgeSesiTemizle();

      // Sıra: ÖNCE ses kaydı (harfin sesi, ör. "elif"), BİTİNCE tarayıcı
      // seslendirmesi yalnızca Braille noktalarını okur (harf adını okumaz).
      const hucreler = typeof getHucreler === 'function'
        ? hucreleriNormalizeEt(getHucreler(oge))
        : [];
      const brailleMetni = hucreler.length
        ? `Braille noktaları: ${hucreNoktaMetni(hucreler)}.`
        : '';

      const seslendirmeKapali =
        window.localStorage.getItem('seslendirmeKapali') === 'true' ||
        window.localStorage.getItem('sesKapali') === 'true' ||
        window.localStorage.getItem('konusmaKapali') === 'true';

      const istekId = (aktifIstekRef.current += 1);
      let brailleOkundu = false;
      const brailleOku = () => {
        if (brailleOkundu) return;
        if (istekId !== aktifIstekRef.current) return; // başka öğeye geçildi → iptal
        brailleOkundu = true;
        if (okumaOgeSesiTimerRef.current) {
          clearTimeout(okumaOgeSesiTimerRef.current);
          okumaOgeSesiTimerRef.current = null;
        }
        if (brailleMetni && !seslendirmeKapali) {
          konus(brailleMetni, { kesintiyle: true });
        }
      };

      if (sesCalabilir) {
        // Ses kaydını çal; bitince Braille noktalarını oku.
        ogeSesiCal(oge, { onEnded: brailleOku });
        // Güvenlik: 'ended' gelmezse (ör. çalınamazsa) en geç 6 sn sonra oku.
        okumaOgeSesiTimerRef.current = window.setTimeout(brailleOku, 6000);
      } else {
        // Ses kaydı yoksa doğrudan Braille noktalarını oku.
        brailleOku();
      }

      return;
    }

    const ttsGetEtiket = getTtsEtiket || getEtiket;
    const etiket = typeof ttsGetEtiket === 'function' ? ttsGetEtiket(oge) : oge.ad;
    const altEtiket = typeof getAltEtiket === 'function' ? getAltEtiket(oge) : '';
    // Nokta bilgisini "X noktalarından oluşur" biçiminde ekle
    const hucreler = typeof getHucreler === 'function' ? hucreleriNormalizeEt(getHucreler(oge)) : [];
    let noktaBilgisi = '';
    if (hucreler.length === 1 && hucreler[0].length > 0) {
      noktaBilgisi = `${hucreler[0].join(', ')} noktalarından oluşur`;
    } else if (hucreler.length > 1) {
      noktaBilgisi = hucreler
        .map((h, i) => `${i + 1}. hücre ${h.join(', ')}`)
        .join(', ');
      noktaBilgisi += ' noktalarından oluşur';
    }
    // altEtiket varsa ve etiket'ten farklıysa (ör. "1" → "1 rakamı", "," → "virgül")
    // yalnızca altEtiket kullan; aksi hâlde etiket kullan.
    const anaEtiket = (altEtiket && altEtiket.trim() !== etiket.trim()) ? altEtiket : etiket;
    const metin = [anaEtiket, noktaBilgisi].filter(Boolean).join('. ');

    const seslendirmeKapali =
      window.localStorage.getItem('seslendirmeKapali') === 'true' ||
      window.localStorage.getItem('sesKapali') === 'true' ||
      window.localStorage.getItem('konusmaKapali') === 'true';

    if (seslendirmeKapali) {
      if (sesCalabilir) {
        ogeSesiCal(oge);
      }
      return;
    }

    if (metin) {
      konus(metin, { kesintiyle: true });
    }

    console.log('OKUMA MODU SES', {
      ad: oge?.ad,
      sesCalabilir,
      okumaModuOgeSesiAktif,
      ogeSesiCalTipi: typeof ogeSesiCal,
    });

    if (sesCalabilir) {
      const gecikmeMs = Number.isFinite(Number(okumaModuOgeSesiGecikmeMs))
        ? Number(okumaModuOgeSesiGecikmeMs)
        : Number(ogeSesiGecikmeMs) || 900;

      okumaOgeSesiTimerRef.current = window.setTimeout(() => {
        ogeSesiCal(oge);
        okumaOgeSesiTimerRef.current = null;
      }, gecikmeMs);
    }
  }, [
    getEtiket,
    getAltEtiket,
    getHucreler,
    ogeSesiCal,
    ogeSesiGecikmeMs,
    okumaModuOgeSesiGecikmeMs,
    okumaModuOgeSesiAktif,
    okumaModundaSadeceOgeSesi,
    okumaOgeSesiTemizle,
  ]);

  const okut = (oge, index) => {
    const etiket = getEtiket(oge, index);
    const altEtiket = getAltEtiket?.(oge, index);
    const hucreler = hucreleriNormalizeEt(getHucreler(oge, index));
    const anahtar = `${index}:${etiket}:${hucreNoktaMetni(hucreler)}`;
    if (sonOkunanRef.current === anahtar) return;
    sonOkunanRef.current = anahtar;
    const adMetni = altEtiket && altEtiket !== etiket ? `${etiket}. ${altEtiket}` : etiket;
    const brailleAciklama = `Braille noktaları: ${hucreNoktaMetni(hucreler)}.`;
    if (seslendirmeDili === 'en' || seslendirmeDili === 'de' || seslendirmeDili === 'fr') {
      konus(adMetni, {
        dil: seslendirmeDili,
        kesintiyle: true,
        onSon: () => konus(brailleAciklama, { dil: 'tr', kesintiyle: false }),
      });
    } else {
      konus(`${adMetni}. ${brailleAciklama}`, { kesintiyle: true });
    }
  };

  return (
    <div className={`okuma-modu-panel${rtl ? ' rtl' : ''}`}>
      <div className="okuma-modu-ust">
        <div>
          <div className="okuma-modu-kicker">Okuma modu</div>
          <div className="okuma-modu-baslik">{baslik}</div>
        </div>
        <button type="button" className="btn okuma-modu-kapat" onClick={() => {
          okumaOgeSesiTemizle();
          konusmayiDurdur();
          onKapat?.();
        }} aria-label="Öğrenme moduna dön">
          Öğrenmeye Dön
        </button>
      </div>

      <div className="okuma-modu-grid" role="list" aria-label={`${baslik} öğeleri`}>
        {ogeler.map((oge, index) => {
          const hucreler = hucreleriNormalizeEt(getHucreler(oge, index));
          const etiket = getEtiket(oge, index);
          const altEtiket = getAltEtiket?.(oge, index);
          const ariaEtiket = (altEtiket && altEtiket.trim() !== etiket.trim()) ? altEtiket : etiket;
          return (
            <div key={`${etiket}-${index}`} role="listitem" className="okuma-modu-kutu-sarmal">
              <button
                type="button"
                className="btn okuma-modu-kutu"
                onPointerEnter={() => okumaOgesiniSeslendirVeCal(oge)}
                onFocus={() => okumaOgesiniSeslendirVeCal(oge)}
                onPointerLeave={() => {
                  sonOkunanRef.current = null;
                  aktifIstekRef.current += 1; // bekleyen "ses bitince Braille oku" callback'ini iptal et
                  okumaOgeSesiTemizle();
                }}
                onBlur={() => {
                  sonOkunanRef.current = null;
                  aktifIstekRef.current += 1;
                  okumaOgeSesiTemizle();
                }}
                onClick={() => onSec(index)}
                aria-label={`${ariaEtiket}. Braille noktaları: ${hucreNoktaMetni(hucreler)}. Öğrenme modunda aç.`}
              >
                <span className="okuma-modu-etiket" dir={rtl ? 'rtl' : undefined} lang={rtl ? 'ar' : undefined}>{etiket}</span>
                {altEtiket && altEtiket !== etiket && <span className="okuma-modu-alt">{altEtiket}</span>}
                <span className="okuma-modu-mini-hucreler" aria-hidden="true">
                  {hucreler.slice(0, 4).map((hucre, hucreIndex) => (
                    <span key={hucreIndex} className="okuma-modu-mini-hucre">
                      {HUCRE_SIRASI.map((nokta) => (
                        <span key={nokta} className={`okuma-modu-mini-nokta ${hucre.includes(nokta) ? 'on' : ''}`} />
                      ))}
                    </span>
                  ))}
                  {hucreler.length > 4 && <span className="okuma-modu-mini-arti">+{hucreler.length - 4}</span>}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}