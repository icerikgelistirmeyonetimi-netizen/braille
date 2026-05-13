import React, { useEffect, useRef } from 'react';
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
      className="okuma-modu-btn sayfa-ici"
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
  getAltEtiket,
  getHucreler,
  onSec,
  onKapat,
  rtl = false,
  seslendirmeDili = 'tr',
}) {
  const sonOkunanRef = useRef(null);

  useEffect(() => {
    konus(`${baslik} okuma modu. ${ogeler.length} öğe listelendi. Bir kutunun üzerine gelince adı ve Braille noktaları okunur.`);
    return () => konusmayiDurdur();
  }, [baslik, ogeler.length]);

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
        <button type="button" className="okuma-modu-kapat" onClick={onKapat} aria-label="Öğrenme moduna dön">
          Öğrenmeye Dön
        </button>
      </div>

      <div className="okuma-modu-grid" role="list" aria-label={`${baslik} öğeleri`}>
        {ogeler.map((oge, index) => {
          const hucreler = hucreleriNormalizeEt(getHucreler(oge, index));
          const etiket = getEtiket(oge, index);
          const altEtiket = getAltEtiket?.(oge, index);
          return (
            <button
              key={`${etiket}-${index}`}
              type="button"
              role="listitem"
              className="okuma-modu-kutu"
              onMouseEnter={() => okut(oge, index)}
              onFocus={() => okut(oge, index)}
              onMouseLeave={() => { sonOkunanRef.current = null; }}
              onClick={() => onSec(index)}
              aria-label={`${etiket}. Braille noktaları: ${hucreNoktaMetni(hucreler)}. Öğrenme modunda aç.`}
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
          );
        })}
      </div>
    </div>
  );
}