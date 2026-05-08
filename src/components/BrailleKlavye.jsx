import React, { useEffect, useRef, useState, useCallback } from 'react';
import { titret } from '../utils/ses.js';
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  buyukHarfIsaretiMi,
  sayiIsaretiMi
} from '../utils/brailleCevir.js';

// Nokta numarası -> standart Perkins klavye tuşu
const NOKTA_TUS = { 1: 'F', 2: 'D', 3: 'S', 4: 'J', 5: 'K', 6: 'L' };

/**
 * Perkins tarzı 6 noktalı Braille klavyesi.
 *
 * Mobil: Her noktaya parmakla aynı anda dokunulur, parmaklar kalkınca
 *        basılı olan noktaların kombinasyonu hücre olarak gönderilir.
 * Masaüstü: Standart Perkins düzeni
 *        F D S = nokta 1, 2, 3   (sol el)
 *        J K L = nokta 4, 5, 6   (sağ el)
 *        Space     = boşluk
 *        Backspace = sil
 *        Enter     = onay (yönergeli mod)
 *
 * Props:
 *  - onHucre(noktalarArr)  : kullanıcı bir hücre kombinasyonunu commit etti
 *  - onBosluk()
 *  - onSil()
 *  - onEnter()
 *  - vurguNoktalar : eğitim modunda öne çıkarılacak noktalar (opsiyonel)
 *  - klavyeAcik    : false yapılırsa global klavye dinleyicisi devre dışı
 */
export default function BrailleKlavye({
  onHucre,
  onBosluk,
  onSil,
  onEnter,
  vurguNoktalar = [],
  klavyeAcik = true,
  klavyeIpucu = false,
  tabletModu = false,
  siralikTiklama = false
}) {
  // O an basılı tutulan noktalar (henüz commit edilmemiş)
  const [basili, setBasili] = useState(new Set());
  // En son commit edilen kombinasyon (kısa süre vurgulamak için)
  const [sonHucre, setSonHucre] = useState([]);
  // Sıralı fare tıklaması: seçili noktalar
  const [tiklilar, setTiklilar] = useState(new Set());
  const tiklilarRef = useRef(new Set());
  const debounceRef = useRef(null);
  // Telefon yatayda döndüğünde otomatik tablet yerleşimi
  // (popup klavye tam olarak bu medya sorgusuyla açılır)
  const MQ_LANDSCAPE = '(orientation: landscape) and (max-height: 600px)';
  const [mobileYatay, setMobileYatay] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia(MQ_LANDSCAPE).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(MQ_LANDSCAPE);
    const handler = (e) => setMobileYatay(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const tiklaToggle = (n) => {
    setTiklilar((s) => {
      const y = new Set(s);
      if (y.has(n)) y.delete(n); else y.add(n);
      tiklilarRef.current = y;
      return y;
    });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const current = tiklilarRef.current;
      if (current.size > 0) {
        tiklilarRef.current = new Set();
        setTiklilar(new Set());
        commitHucre(current);
      }
    }, 600);
  };

  // Mobil dokunmada aktif parmak (touch identifier) sayısı
  const aktifParmaklar = useRef(new Set());
  // Hangi noktaya hangi parmak basıyor (parmak kaldırılınca o noktayı bırak)
  const parmakNokta = useRef(new Map());
  // Klavyede halen basılı olan tuşlar
  const aktifTuslar = useRef(new Set());

  // F D S J K L -> nokta numarası
  const TUS_NOKTA = {
    KeyF: 1, KeyD: 2, KeyS: 3,
    KeyJ: 4, KeyK: 5, KeyL: 6
  };
  const commitHucre = useCallback((noktaSeti) => {
    const nokta = [...noktaSeti].sort((a, b) => a - b);
    if (nokta.length === 0) return;
    setSonHucre(nokta);
    setBasili(new Set());
    titret(40);
    if (onHucre) onHucre(nokta);
    // Vurgu kısa süre sonra sönsün
    setTimeout(() => setSonHucre((s) => (s === nokta ? [] : s)), 350);
  }, [onHucre]);

  // ---------- Klavye olayları ----------
  useEffect(() => {
    if (!klavyeAcik) return;

    const aktifNoktalar = new Set();

    const keydown = (e) => {
      // Form alanı içinde değilse yakala
      if (e.repeat) return;
      const hedef = e.target;
      if (hedef && (hedef.tagName === 'INPUT' || hedef.tagName === 'TEXTAREA' || hedef.isContentEditable)) {
        return;
      }
      if (e.code in TUS_NOKTA) {
        e.preventDefault();
        const n = TUS_NOKTA[e.code];
        aktifNoktalar.add(n);
        aktifTuslar.current.add(e.code);
        setBasili(new Set(aktifNoktalar));
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (onBosluk) onBosluk();
        titret(20);
        return;
      }
      if (e.code === 'Backspace') {
        e.preventDefault();
        if (onSil) onSil();
        titret(20);
        return;
      }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') {
        e.preventDefault();
        if (onEnter) onEnter();
        return;
      }
    };

    const keyup = (e) => {
      if (e.code in TUS_NOKTA) {
        e.preventDefault();
        aktifTuslar.current.delete(e.code);
        if (aktifTuslar.current.size === 0 && aktifNoktalar.size > 0) {
          const kopya = new Set(aktifNoktalar);
          aktifNoktalar.clear();
          commitHucre(kopya);
        }
      }
    };

    // Pencere odağı kaybolursa basılı tuşları sıfırla
    const blur = () => {
      aktifNoktalar.clear();
      aktifTuslar.current.clear();
      setBasili(new Set());
    };

    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', blur);
    };
  }, [klavyeAcik, commitHucre, onBosluk, onSil, onEnter]);

  // ---------- Dokunma olayları ----------
  const noktayaDokunBaslat = (n, parmakId) => {
    parmakNokta.current.set(parmakId, n);
    setBasili((s) => {
      const y = new Set(s);
      y.add(n);
      return y;
    });
  };

  const onTouchStart = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      aktifParmaklar.current.add(t.identifier);
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const noktaEl = el && el.closest('[data-klavye-nokta]');
      if (noktaEl) {
        const n = Number(noktaEl.getAttribute('data-klavye-nokta'));
        if (n) noktayaDokunBaslat(n, t.identifier);
      }
    }
    titret(15);
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const noktaEl = el && el.closest('[data-klavye-nokta]');
      if (noktaEl) {
        const n = Number(noktaEl.getAttribute('data-klavye-nokta'));
        if (n && parmakNokta.current.get(t.identifier) !== n) {
          parmakNokta.current.set(t.identifier, n);
          setBasili((s) => {
            const y = new Set(s);
            y.add(n);
            return y;
          });
        }
      }
    }
  };

  const onTouchEnd = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      aktifParmaklar.current.delete(t.identifier);
      parmakNokta.current.delete(t.identifier);
    }
    if (aktifParmaklar.current.size === 0) {
      // Tüm parmaklar kalktı: kombinasyonu commit et
      setBasili((s) => {
        if (s.size > 0) commitHucre(s);
        return new Set();
      });
    }
  };

  // ---------- Render ----------
  // Perkins yerleşimi: ortada nokta yok, soldan sağa: 3 2 1 | 4 5 6
  // Üç sırada (üst orta alt) iki sütun
  const sutunlar = [
    { isim: 'Sol el',  noktalar: [3, 2, 1] }, // baş parmak yukarıda olacak şekilde
    { isim: 'Sağ el',  noktalar: [4, 5, 6] }
  ];
  // Daha kullanışlı: tek tek 6 büyük tuş, ikili sütunlu, üç satır
  // Satır sıralaması: üst -> 1, 4 ; orta -> 2, 5 ; alt -> 3, 6
  // Tablet modunda sütunlar yatay çevrilir: sol el 4-5-6, sağ el 1-2-3
  // (tableti düz tutup üstten yazınca eller fiziksel olarak ters tarafa denk gelir)
  // Tablet modunda ya da telefon yatayda: sol el 4-5-6, sağ el 1-2-3
  const satirlar = (tabletModu || mobileYatay)
    ? [[4, 1], [5, 2], [6, 3]]
    : [[1, 4], [2, 5], [3, 6]];

  const noktaSinif = (n) => {
    const c = ['klv-nokta'];
    if (basili.has(n)) c.push('basili');
    if (sonHucre.includes(n)) c.push('flash');
    if (vurguNoktalar.includes(n)) c.push('vurgu');
    if (siralikTiklama && tiklilar.has(n)) c.push('tikli');
    return c.join(' ');
  };

  return (
    <div
      className="braille-klavye"
      role="group"
      aria-label="Perkins braille klavyesi, altı nokta"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div className={'klv-grid' + (klavyeIpucu ? ' klv-grid-tus' : '')}>
        {satirlar.map((cift, satirIdx) => (
          <React.Fragment key={satirIdx}>
            {cift.map((n) => {
              const tusEtiket = NOKTA_TUS[n];
              return (
              <button
                key={n}
                type="button"
                className={noktaSinif(n)}
                data-klavye-nokta={n}
                aria-label={`${n} numaralı nokta${klavyeIpucu ? `, klavye ${tusEtiket} tuşu` : ''}`}
                aria-pressed={basili.has(n) || (siralikTiklama && tiklilar.has(n))}
                onContextMenu={(e) => e.preventDefault()}
                onClick={siralikTiklama ? () => tiklaToggle(n) : undefined}
                tabIndex={-1}
              >
                {klavyeIpucu ? (
                  <>
                    <span className="klv-nokta-tus" aria-hidden="true">{tusEtiket}</span>
                    <span className="klv-nokta-no klv-nokta-no-rozet" aria-hidden="true">{n}</span>
                  </>
                ) : (
                  <span className="klv-nokta-no" aria-hidden="true">{n}</span>
                )}
              </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="klv-aksiyonlar">
        <button type="button" className="klv-aksiyon" onClick={onSil} aria-label="Sil (Backspace)">
          <span aria-hidden="true">⌫ Sil</span>
          {klavyeIpucu && <span className="klv-aksiyon-tus" aria-hidden="true">Backspace</span>}
        </button>
        <button type="button" className="klv-aksiyon klv-bosluk" onClick={onBosluk} aria-label="Boşluk (Space)">
          <span aria-hidden="true">␣ Boşluk</span>
          {klavyeIpucu && <span className="klv-aksiyon-tus" aria-hidden="true">Space</span>}
        </button>
        {onEnter && (
          <button type="button" className="klv-aksiyon" onClick={onEnter} aria-label="Onayla (Enter)">
            <span aria-hidden="true">⏎ Onay</span>
            {klavyeIpucu && <span className="klv-aksiyon-tus" aria-hidden="true">Enter</span>}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Hücreyi karaktere çevirirken sayı/büyük harf modunu da takip eden
 * küçük yardımcı state makinesi. Sayfaların kullanması için.
 */
export function yeniYazmaDurumu() {
  return { sayiModu: false, buyukSiradaki: false };
}

/**
 * @param {{sayiModu:boolean, buyukSiradaki:boolean}} durum  (mutate edilir)
 * @param {number[]} noktalar
 * @returns {{ tip:'karakter'|'isaret'|'bilinmeyen', deger:string|null, anons:string }}
 */
export function hucreyiIsle(durum, noktalar) {
  if (sayiIsaretiMi(noktalar)) {
    durum.sayiModu = true;
    durum.buyukSiradaki = false;
    return { tip: 'isaret', deger: null, anons: 'sayı işareti' };
  }
  if (buyukHarfIsaretiMi(noktalar)) {
    durum.buyukSiradaki = true;
    durum.sayiModu = false;
    return { tip: 'isaret', deger: null, anons: 'büyük harf işareti' };
  }
  if (durum.sayiModu) {
    const r = hucreyiRakamayap(noktalar);
    if (r) return { tip: 'karakter', deger: r, anons: r };
    durum.sayiModu = false;
  }
  const k = hucreyiKarakteryap(noktalar);
  if (k === null) return { tip: 'bilinmeyen', deger: null, anons: 'tanınmayan hücre' };
  let cikti = k;
  if (durum.buyukSiradaki && k !== ' ') {
    cikti = k.toLocaleUpperCase('tr');
    durum.buyukSiradaki = false;
  } else if (k !== ' ') {
    cikti = k.toLocaleLowerCase('tr');
  }
  return { tip: 'karakter', deger: cikti, anons: cikti === ' ' ? 'boşluk' : cikti };
}
