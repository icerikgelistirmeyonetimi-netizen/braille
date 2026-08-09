import React, { useCallback, useEffect, useRef, useState } from 'react';
import { konus, konusmayiDurdur } from '../utils/ses.js';

// ⚠ Sürüm v2: tur içeriği güncellendi (kullanıcı: "ayarlar bölümündeki tanıtım turunu da
// güncelleyelim, güncel değil"). Eski metin kaldırılan özelliklerden söz ediyordu
// (tarayıcı seslendirmesi, konuşma hızı ayarı) ve yalnız Modül 1 bölümlerini anlatıyordu.
// Anahtar v1 → v2: içerik esaslı değiştiği için tur bir kez daha gösterilir.
const ANAHTAR = 'braille-tur-tamam-v2';

const ADIMLAR = [
  {
    baslik: 'Hoş geldiniz',
    metin:
      'Braille Öğreniyorum uygulamasına hoş geldiniz. Bu kısa rehber uygulamayı tanıtır. '
      + 'İstediğiniz an Atla düğmesiyle çıkabilir, Ayarlar sayfasından tekrar açabilirsiniz.'
  },
  {
    baslik: 'Ekran okuyucu ile uyum',
    metin:
      'Uygulamanın tüm içeriğini ekran okuyucunuz okur. Yönergeler, hücrelerin anlamı ve '
      + 'her dokunuşun sonucu sesli olarak bildirilir; doğru nokta, hücre geçişi ve hata '
      + 'için ayrı ses efektleri duyulur.'
  },
  {
    baslik: 'Braille hücresi',
    metin:
      'Braille hücresi altı noktadan oluşur. Sol sütunda yukarıdan aşağı 1, 2 ve 3; sağ '
      + 'sütunda yukarıdan aşağı 4, 5 ve 6 numaralı noktalar bulunur. Hücre içinde Alt tuşu '
      + 'ile yön oklarını kullanarak noktalar arasında gezinebilirsiniz.'
  },
  {
    baslik: 'Ders akışı',
    metin:
      'Bir derse girdiğinizde önce yönerge okunur. Sonra Sekme tuşu sizi hücrenin birinci '
      + 'noktasına götürür ve istenen noktalara sırayla basarsınız. Öğe tamamlanınca '
      + 'kendiliğinden bir sonrakine geçilir.'
  },
  {
    baslik: 'Hızlı dolaşım modu',
    metin:
      'Ders sayfalarındaki Hızlı dolaşım modu düğmesi, o dersteki tüm öğeleri kart listesi '
      + 'hâlinde gösterir. Bir kartın üzerine geldiğinizde öğenin anlamı ve noktaları okunur; '
      + 'etkinleştirdiğinizde o öğe öğrenme modunda açılır.'
  },
  {
    baslik: 'Yazma',
    metin:
      'Yazma bölümlerinde ekrandaki altı tuşu kullanabilir ya da klavyeden F, D, S ile 1, 2, 3 '
      + 've J, K, L ile 4, 5, 6 noktalarına basabilirsiniz. Tuşlara aynı anda basıp birlikte '
      + 'bırakınca hücre yazılır. Boşluk tuşu boşluk bırakır, geri silme tuşu siler.'
  },
  {
    baslik: 'Modüller ve araçlar',
    metin:
      'On modül vardır: harfler, kısaltmalar, noktalama, yazma, Kur’an-ı Kerim, matematik, '
      + 'fen, müzik, yabancı diller ve BRF dönüştürücü. Braille arama sayfasından nokta '
      + 'numarasına veya kelimeye göre tüm sembolleri arayabilirsiniz.'
  },
  {
    baslik: 'Ayarlar ve kılavuz',
    metin:
      'Ayarlar sayfasından ses efektlerini, titreşimi, yazı boyutunu ve görünümü '
      + 'değiştirebilir, ana menüde görünecek modülleri seçebilirsiniz. Kılavuz sekmesinde '
      + 'kısaltma tabloları ve tüm klavye kısayolları yer alır.'
  },
  {
    baslik: 'Hazırsınız',
    metin:
      'Tanıtım tamamlandı. İyi öğrenmeler dileriz. Bu rehbere Ayarlar sayfasındaki '
      + 'tanıtım turu düğmesinden tekrar ulaşabilirsiniz.'
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
    // Odağı turu açan öğeye geri ver; yoksa (ilk açılış otomatik tur) ekran
    // okuyucu body'de kaybolmasın diye ilk anlamlı odaklanabilir öğeye taşı.
    // Not: <main id="main"> display:contents olduğu için odak alamaz; bunun
    // yerine sayfadaki ilk buton/bağlantı hedeflenir.
    const geri = oncekiOdakRef.current;
    let hedef = null;
    if (geri && geri !== document.body && geri.isConnected && typeof geri.focus === 'function') {
      hedef = geri;
    } else if (typeof document !== 'undefined') {
      hedef = document.querySelector('.app a[href], .app button, .app [tabindex]:not([tabindex="-1"])');
    }
    if (hedef) {
      window.setTimeout(() => { try { hedef.focus(); } catch { /* yoksay */ } }, 0);
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
