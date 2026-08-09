import React, { useCallback, useEffect, useRef } from 'react';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import { nlDan } from '../utils/noktaYardimci.js';

const HUCRE_SIRASI = [1, 4, 2, 5, 3, 6];

// Karakter sayısına göre font küçültme sınıfı — uzun metinler karta sığsın
function etiketFontSinifi(metin) {
  if (typeof metin !== 'string') return '';
  if (metin.length > 22) return 'etiket-kucuk';
  if (metin.length > 14) return 'etiket-orta';
  return '';
}

// Etiket içindeki parantez içeriğini alt açıklama olarak ayır: "A (B)" → { ana:"A", alt:"B" }
function etiketiAyristir(etiket) {
  if (typeof etiket !== 'string') return { ana: etiket, alt: null };
  const m = etiket.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { ana: etiket, alt: null };
  return { ana: m[1].trim(), alt: m[2].trim() };
}

// Arapça birleşen diyakritikler tek başına gösterilince çok küçük görünür.
// Bunları ب (ba) üzerinde göster: َ → بَ
const ARAPC_DIAKRITIK = /^[ً-ٰٟ]+$/;
function okumaEtiketiHazirla(etiket) {
  if (typeof etiket === 'string' && ARAPC_DIAKRITIK.test(etiket.trim())) {
    return `◌${etiket.trim()}`;  // ◌ = U+25CC kesik çizgili daire
  }
  return etiket;
}

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

// Öğrenme modundaki yönerge gibi OKUNABİLİR nokta kompozisyonu: "2. ve 5. noktalardan oluşur"
// (kullanıcı: "okuma modunda kutu üzerine gelince öğrenme modundaki gibi yönerge okumalı").
// Ham "2, 5" yerine sıralı + "noktalardan oluşur" — çok hücrede "1. hücre …, 2. hücre …".
export const hucreYonergeMetni = (hucreler) => {
  const temiz = hucreleriNormalizeEt(hucreler);
  if (temiz.length === 0) return '';
  const cok = temiz.length > 1;
  const komp = temiz
    .map((h, i) => {
      if (!Array.isArray(h) || h.length === 0) return cok ? `${i + 1}. hücre boş` : '';
      const liste = nlDan(h); // "2. ve 5. noktalardan"
      return cok ? `${i + 1}. hücre ${liste}` : liste;
    })
    .filter(Boolean)
    .join(', ');
  return komp ? `${komp} oluşur` : '';
};

export function OkumaModuButonu({ onClick }) {
  return (
    <button
      type="button"
      className="btn okuma-modu-btn sayfa-ici"
      onClick={onClick}
      aria-label="Hızlı dolaşım moduna geç"
      title="Hızlı dolaşım modu"
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
  // Opsiyonel: kart için YALNIZ ekran okuyucu/TTS açıklaması (görsel etikete girmez).
  // Kısaltma derslerinde "A" kartı tek başına anlamsızdı (kullanıcı: "aynı kelimesi
  // kısaltması dedikten sonra A harfi ile yazılır, 1. noktadan oluşur demesi daha uygun
  // olurdu; gerekli detay seslendirilmeli"). getAltEtiket görsel alt yazıya da bastığından
  // uzun cümle oraya konamaz → ayrı kanal.
  getOkumaAciklama,
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
  // Okuma moduna girince odak İLK KART'a CokHucreOkuyucu'daki okumaModu effect'inden verilir
  // (parent stabil; child StrictMode mount/unmount'unda rAF odağı tutmuyordu).

  const okumaOgeSesiTemizle = useCallback(() => {
    if (okumaOgeSesiTimerRef.current) {
      clearTimeout(okumaOgeSesiTimerRef.current);
      okumaOgeSesiTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    konus(`${baslik} hızlı dolaşım modu. ${ogeler.length} öğe listelendi. Bir kutunun üzerine gelince adı ve Braille noktaları okunur.`);
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
          // srAtla: app TTS söyler ama _srBolge'ye YAZMAZ → NVDA zaten kart aria-label'ini
          // okur; çift okuma olmaz (odaklanan kart + _srBolge anti-paterni).
          konus(brailleMetni, { kesintiyle: true, srAtla: true });
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
    // Nokta bilgisi öğrenme modundaki gibi: "2. ve 5. noktalardan oluşur" (sıralı + okunabilir).
    const hucreler = typeof getHucreler === 'function' ? hucreleriNormalizeEt(getHucreler(oge)) : [];
    const noktaBilgisi = hucreYonergeMetni(hucreler);
    // altEtiket varsa ve etiket'ten farklıysa (ör. "1" → "1 rakamı", "," → "virgül")
    // yalnızca altEtiket kullan; aksi hâlde etiket kullan.
    const okumaAciklama = typeof getOkumaAciklama === 'function' ? getOkumaAciklama(oge) : '';
    const anaEtiket = okumaAciklama
      || ((altEtiket && altEtiket.trim() !== etiket.trim()) ? altEtiket : etiket);
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
      // srAtla: app TTS söyler ama _srBolge'ye YAZMAZ → NVDA kart aria-label'ini okur (çift değil).
      konus(metin, { kesintiyle: true, srAtla: true });
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
    getOkumaAciklama,
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
          <div className="okuma-modu-kicker">Hızlı dolaşım modu</div>
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
                aria-label={(() => {
                  const yon = hucreYonergeMetni(hucreler); // "2. ve 5. noktalardan oluşur"
                  const aciklama = typeof getOkumaAciklama === 'function' ? getOkumaAciklama(oge, index) : '';
                  const bas = aciklama || ariaEtiket;
                  return `${bas}${yon ? '. ' + yon : ''}. Öğrenme modunda açmak için etkinleştirin.`;
                })()}
              >
                {(() => {
                  const { ana, alt: parantezAlt } = etiketiAyristir(okumaEtiketiHazirla(etiket));
                  return (
                    <>
                      <span className={`okuma-modu-etiket${etiketFontSinifi(ana) ? ' ' + etiketFontSinifi(ana) : ''}`} dir={rtl ? 'rtl' : undefined} lang={rtl ? 'ar' : (seslendirmeDili !== 'tr' ? seslendirmeDili : undefined)}>{ana}</span>
                      {parantezAlt && <span className="okuma-modu-alt">{parantezAlt}</span>}
                    </>
                  );
                })()}
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