import React, { useEffect, useMemo, useRef, useState } from 'react';
import { konus } from '../utils/ses.js';

/**
 * Yönergeli yazma sayfaları için HIZLI ERİŞİM paneli (kullanıcı: "yönergeli yazmaya
 * ileri geri butonu ve hızlı erişim modu eklenebilmeli").
 *
 * Ders sayfalarındaki "hızlı dolaşım modu"nun yazma karşılığı: tüm kelimeler/cümleler
 * kart listesi olarak gösterilir, biri etkinleştirilince o öğeye ATLANIR. Liste uzun
 * olduğundan (468 kelime) bir SÜZME kutusu vardır; süzme yalnız görüntüyü daraltır,
 * kartın etiketi öğenin GERÇEK sırasını söyler ("12. kelime: kalem").
 *
 * Erişilebilirlik: panel `role="dialog"` + `aria-modal`; açılışta odak süzme kutusuna
 * gelir, Esc kapatır, Tab panel içinde döner. Kart adı sıra + metin içerir.
 */
export default function HizliErisimPaneli({
  baslik = 'Hızlı erişim',
  ogeTuru = 'kelime',        // "kelime" | "cümle" — etiketlerde kullanılır
  ogeler = [],
  aktifIndeks = 0,
  onSec,
  onKapat,
}) {
  const [sorgu, setSorgu] = useState('');
  const panelRef = useRef(null);
  const girdiRef = useRef(null);

  const suzulmus = useMemo(() => {
    const q = sorgu.trim().toLocaleLowerCase('tr');
    return ogeler
      .map((metin, indeks) => ({ metin, indeks }))
      .filter(({ metin }) => !q || String(metin).toLocaleLowerCase('tr').includes(q));
  }, [ogeler, sorgu]);

  // Odağı süzme kutusuna ver — rAF-RETRY ile: liste (468 kart) mount olurken tek karelik
  // odak düşebiliyor (ölçüldü: odak gövdede kalıyordu), odak oturana kadar birkaç kare dene.
  useEffect(() => {
    let rafId = 0;
    let deneme = 0;
    const odakla = () => {
      const el = girdiRef.current;
      if (el) el.focus();
      if ((!el || document.activeElement !== el) && deneme < 8) {
        deneme += 1;
        rafId = window.requestAnimationFrame(odakla);
      }
    };
    rafId = window.requestAnimationFrame(odakla);
    konus(`${baslik}. ${ogeler.length} ${ogeTuru}. Aramak için yazabilir, listeden seçebilirsiniz.`, { kesintiyle: true });
    return () => window.cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc kapatır; Tab panel içinde döner (odak tuzağı).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onKapat?.(); return; }
      if (e.key !== 'Tab') return;
      const kap = panelRef.current;
      if (!kap) return;
      const odaklananlar = [...kap.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && el.offsetParent !== null);
      if (!odaklananlar.length) return;
      const ilk = odaklananlar[0];
      const son = odaklananlar[odaklananlar.length - 1];
      if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onKapat]);

  return (
    <div className="hizli-erisim-katman">
      <div
        ref={panelRef}
        className="hizli-erisim-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${baslik}: ${ogeler.length} ${ogeTuru}`}
      >
        <div className="hizli-erisim-ust">
          <h2 className="hizli-erisim-baslik">{baslik}</h2>
          <button type="button" className="btn" onClick={onKapat} aria-label="Hızlı erişimi kapat">
            Kapat
          </button>
        </div>
        <label className="hizli-erisim-arama">
          <span className="sr-only">{`${ogeTuru} ara`}</span>
          <input
            ref={girdiRef}
            type="text"
            value={sorgu}
            onChange={(e) => setSorgu(e.target.value)}
            placeholder={`${ogeTuru === 'cümle' ? 'Cümle' : 'Kelime'} ara…`}
            aria-label={`${ogeTuru === 'cümle' ? 'Cümle' : 'Kelime'} ara`}
          />
        </label>
        <div className="hizli-erisim-ozet" role="status" aria-live="polite">
          {suzulmus.length} / {ogeler.length} {ogeTuru}
        </div>
        <ul className="hizli-erisim-liste">
          {suzulmus.map(({ metin, indeks }) => (
            <li key={indeks}>
              <button
                type="button"
                className={`btn hizli-erisim-kart${indeks === aktifIndeks ? ' aktif' : ''}`}
                onClick={() => onSec?.(indeks)}
                aria-label={`${indeks + 1}. ${ogeTuru}: ${metin}${indeks === aktifIndeks ? ', şu anki' : ''}`}
                aria-current={indeks === aktifIndeks ? 'true' : undefined}
              >
                <span className="hizli-erisim-no" aria-hidden="true">{indeks + 1}</span>
                <span className="hizli-erisim-metin" aria-hidden="true">{metin}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
