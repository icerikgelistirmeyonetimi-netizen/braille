import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import KullanimKilavuzu from './KullanimKilavuzu.jsx';

// F1 ile her sayfadan açılan "Kısaltmalar ve Kullanım Kılavuzu" penceresi
// (kullanıcı: "F1 tuşu ile müzik sayfası hariç bu yardım açılsın").
//
// ⚠ MÜZİK EDİTÖRÜ HARİÇ: /muzik-brf-yazim sayfasında F1 zaten müzik editörünün KENDİ
// kısayol penceresini açar (components/music/MuzikScoreSvg.jsx ~787). Orada bu pencereyi
// açmak iki yardım penceresini üst üste bindirirdi → o rotada dinleyici hiç kurulmaz.
const MUZIK_EDITOR_YOLLARI = ['/muzik-brf-yazim'];

export default function KilavuzPenceresi() {
  const { pathname } = useLocation();
  const [acik, setAcik] = useState(false);
  const panelRef = useRef(null);
  const oncekiOdakRef = useRef(null);
  const muzikEditoru = MUZIK_EDITOR_YOLLARI.some((y) => pathname.startsWith(y));

  const kapat = useCallback(() => {
    setAcik(false);
    const geri = oncekiOdakRef.current;
    if (geri && geri.isConnected && typeof geri.focus === 'function') {
      window.setTimeout(() => { try { geri.focus(); } catch { /* yoksay */ } }, 0);
    }
  }, []);

  // F1: aç/kapat. Müzik editöründe hiç dinlenmez (kendi F1 yardımı var).
  useEffect(() => {
    if (muzikEditoru) return undefined;
    const onKey = (e) => {
      if (e.key !== 'F1' || e.ctrlKey || e.altKey || e.shiftKey) return;
      e.preventDefault();
      setAcik((v) => !v);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [muzikEditoru]);

  // Rota değişince kapansın (arkada açık kalmasın).
  useEffect(() => { setAcik(false); }, [pathname]);

  // Açılışta odağı panele al; Esc kapatır, Tab pencerede döner (odak tuzağı).
  useEffect(() => {
    if (!acik) return undefined;
    oncekiOdakRef.current = document.activeElement;
    const t = window.setTimeout(() => { try { panelRef.current?.focus(); } catch { /* yoksay */ } }, 40);
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); kapat(); return; }
      if (e.key !== 'Tab') return;
      const kap = panelRef.current;
      if (!kap) return;
      const odaklananlar = Array.from(
        kap.querySelectorAll('button, [href], input, select, textarea, summary, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => !el.disabled && el.offsetParent !== null);
      if (!odaklananlar.length) return;
      const ilk = odaklananlar[0];
      const son = odaklananlar[odaklananlar.length - 1];
      if (e.shiftKey && document.activeElement === ilk) { e.preventDefault(); son.focus(); }
      else if (!e.shiftKey && document.activeElement === son) { e.preventDefault(); ilk.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { window.clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [acik, kapat]);

  if (!acik) return null;

  const kartStil = {
    background: 'var(--panel)', border: '1px solid var(--panel-border, #e8eaf0)',
    borderRadius: 12, padding: 16, marginBottom: 12,
    display: 'flex', flexDirection: 'column', gap: 8,
  };
  const kartBaslikStil = {
    display: 'flex', alignItems: 'center', gap: 8,
    fontWeight: 700, fontSize: '1.02em', color: 'var(--accent, #5465ff)',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, zIndex: 1200,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) kapat(); }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="kilavuz-pencere-baslik"
        tabIndex={-1}
        style={{
          background: 'var(--bg, var(--panel))', color: 'var(--fg)',
          border: '3px solid var(--accent)', borderRadius: 16,
          padding: 20, maxWidth: 760, width: '100%', maxHeight: '90vh',
          overflowY: 'auto', outline: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          {/* ⚠ F1 penceresi YALNIZ kısayolları gösterir (kullanıcı: "kullanım kılavuzuna
              kısaltmalar başlığını neden ekledim, kısayol tuşları sadece olacaktı").
              Kısaltma tabloları Ayarlar → Kılavuz sekmesinde. */}
          <h2 id="kilavuz-pencere-baslik" style={{ margin: 0, color: 'var(--accent)' }}>
            Kullanım Kılavuzu
          </h2>
          <button className="btn" type="button" onClick={kapat} aria-label="Kılavuzu kapat">
            Kapat
          </button>
        </div>
        <p style={{ fontSize: '0.88em', color: 'var(--muted)', margin: '6px 0 12px' }}>
          Bu pencereyi F1 tuşuyla açıp kapatabilirsiniz. Escape tuşu da kapatır.
          Aynı kısayollar ve ek olarak kısaltma tabloları Ayarlar sayfasının Kılavuz
          sekmesinde bulunur.
        </p>
        <KullanimKilavuzu kartStil={kartStil} kartBaslikStil={kartBaslikStil} />
      </div>
    </div>
  );
}
