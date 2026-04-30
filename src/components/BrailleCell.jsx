import React, { useRef } from 'react';
import { konus, titret } from '../utils/ses.js';

/**
 * Braille hücresi bileşeni.
 *
 * Numaralandırma:
 *   1 • • 4
 *   2 • • 5
 *   3 • • 6
 *
 * Props:
 *  - aktifNoktalar: number[]  -> dolu (kabarık) noktalar
 *  - hedefNoktalar: number[]  -> beklenen / vurgulanan noktalar
 *  - dogruNoktalar: number[]  -> doğru cevaplanmış noktalar (yeşil)
 *  - yanlisNoktalar: number[] -> yanlış basılan noktalar (kırmızı)
 *  - tiklanabilir: boolean
 *  - onNoktaTikla: (noktaNo: number) => void
 *  - baslik: string  (büyük gösterilecek harf/sembol; ekran okuyucudan gizlenir)
 *  - baslikAriaLabel: string
 */
export default function BrailleCell({
  aktifNoktalar = [],
  hedefNoktalar = [],
  dogruNoktalar = [],
  yanlisNoktalar = [],
  tiklanabilir = false,
  // Pasif (okuma) hücrelerde de parmakla noktanın üzerine gelince
  // numarayı seslendirip titreşim verir. Cevap girilmez.
  kesfedilebilir = true,
  onNoktaTikla,
  baslik,
  baslikAriaLabel
}) {
  const noktaSira = [1, 4, 2, 5, 3, 6]; // grid sırası: satır satır
  const sonOkunan = useRef(null);
  // Hücreyle herhangi bir parmak/fare etkileşimi (keşif veya tıklama)
  const etkilesimli = tiklanabilir || kesfedilebilir;

  const noktaDurumu = (n) => {
    const siniflar = ['dot'];
    if (aktifNoktalar.includes(n)) siniflar.push('on');
    if (dogruNoktalar.includes(n)) siniflar.push('correct');
    if (yanlisNoktalar.includes(n)) siniflar.push('wrong');
    if (hedefNoktalar.includes(n) && !aktifNoktalar.includes(n) && !dogruNoktalar.includes(n)) {
      siniflar.push('target');
    }
    return siniflar.join(' ');
  };

  const ariaLabel = (n) => {
    const durum = aktifNoktalar.includes(n) || dogruNoktalar.includes(n) ? 'dolu' : 'boş';
    return `${n} numaralı nokta, ${durum}`;
  };

  // Üzerine gelindiğinde / parmak gezdirildiğinde numarayı seslendir + kısa titreşim
  const noktaUzerinde = (n) => {
    if (!etkilesimli) return;
    if (sonOkunan.current === n) return;
    sonOkunan.current = n;
    titret(25); // parmak yeni noktaya girdi
    konus(String(n), { kesintiyle: true });
  };

  const noktayiBirak = () => {
    sonOkunan.current = null;
  };

  // Dokunmatikte parmak hareket ettikçe altındaki noktayı bul
  const dokunusHareket = (e) => {
    if (!etkilesimli) return;
    const t = e.touches && e.touches[0];
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    if (!el) return;
    const noktaEl = el.closest('[data-nokta]');
    if (!noktaEl) {
      sonOkunan.current = null;
      return;
    }
    const n = Number(noktaEl.getAttribute('data-nokta'));
    if (n) noktaUzerinde(n);
  };

  // Dokunma bittiğinde parmağın bulunduğu noktayı tıkla
  const dokunusBitti = (e) => {
    if (!etkilesimli) return;
    sonOkunan.current = null;
    if (!tiklanabilir) return;
    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;
    const el = document.elementFromPoint(t.clientX, t.clientY);
    const noktaEl = el && el.closest('[data-nokta]');
    if (!noktaEl) return;
    const n = Number(noktaEl.getAttribute('data-nokta'));
    if (n && onNoktaTikla) {
      e.preventDefault(); // sentetik click'i engelle (çift tetiklemeyi önler)
      onNoktaTikla(n);
    }
  };

  return (
    <div className="cell-wrapper">
      <div
        className="cell-title"
        aria-label={baslik ? (baslikAriaLabel || baslik) : undefined}
        aria-hidden={baslik ? undefined : true}
        style={baslik ? undefined : { display: 'none' }}
      >
        {baslik || '\u00A0'}
      </div>
      <div
        className="cell"
        role="group"
        aria-label="Braille hücresi, altı nokta"
        onTouchStart={dokunusHareket}
        onTouchMove={dokunusHareket}
        onTouchEnd={dokunusBitti}
        onMouseLeave={noktayiBirak}
      >
        {noktaSira.map((n) => {
          const Etiket = tiklanabilir ? 'button' : 'div';
          return (
            <Etiket
              key={n}
              className={noktaDurumu(n)}
              aria-label={ariaLabel(n)}
              data-nokta={n}
              {...(tiklanabilir
                ? {
                    type: 'button',
                    onClick: () => onNoktaTikla && onNoktaTikla(n),
                    onMouseEnter: () => noktaUzerinde(n),
                    onFocus: () => noktaUzerinde(n)
                  }
                : kesfedilebilir
                  ? {
                      'aria-hidden': false,
                      onMouseEnter: () => noktaUzerinde(n)
                    }
                  : { 'aria-hidden': false })}
            >
              {n}
            </Etiket>
          );
        })}
      </div>
    </div>
  );
}
