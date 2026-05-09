import React, { useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
} from '../utils/brailleCevir.js';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
} from '../data/braille.js';

// ─── BRF → nokta dizisi ────────────────────────────────────────────────────
function brfNoktalaradon(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0x20 || code > 0x5f) return null;
  const bits = code - 0x20;
  const noktalar = [];
  for (let i = 0; i < 6; i++) {
    if (bits & (1 << i)) noktalar.push(i + 1);
  }
  return noktalar;
}

// ─── Ters arama tabloları ──────────────────────────────────────────────────
const _KISALTMA_TEK = new Map(
  KELIME_KISALTMALARI.map((k) => [
    [...k.noktalar].sort((a, b) => a - b).join(','),
    k.kelime,
  ])
);
const _KISALTMA_IKI = (() => {
  const m = new Map();
  for (const k of IKI_HARFLI_KISALTMALAR) {
    const key =
      [...k.sol].sort((a, b) => a - b).join(',') +
      '|' +
      [...k.sag].sort((a, b) => a - b).join(',');
    m.set(key, k.kelime);
  }
  return m;
})();
const _HECE_TERS = new Map(
  HECE_KISALTMALARI.map((h) => [
    [...h.noktalar].sort((a, b) => a - b).join(','),
    h.hece,
  ])
);

// ─── BRF → Metin dönüşümü ─────────────────────────────────────────────────
function _brfMetinedon(icerik, kisaltmali) {
  const satirlar = icerik.split(/[\r\n\f]+/);
  let metin = '';
  let sayiModu = false;
  let buyukHarfBekle = false;

  if (kisaltmali) {
    for (const satir of satirlar) {
      if (!satir.trim()) { metin += '\n'; continue; }
      const hucreleri = [];
      for (const ch of satir) {
        const n = brfNoktalaradon(ch);
        if (n !== null) hucreleri.push(n);
      }
      let blok = [];
      const cikis = [];
      const bloklariIsle = (b) => {
        if (b.length === 0) return;
        if (b.length === 2) {
          const a =
            [...b[0]].sort((a, b) => a - b).join(',') +
            '|' +
            [...b[1]].sort((a, b) => a - b).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(_KISALTMA_IKI.get(a)); return; }
        }
        if (b.length === 1) {
          const a = [...b[0]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_TEK.has(a)) { cikis.push(_KISALTMA_TEK.get(a)); return; }
        }
        let ci = 0;
        let sM = false, bH = false;
        while (ci < b.length) {
          const noktalar = b[ci];
          if (noktalar.length === 0) { cikis.push(' '); sM = false; bH = false; ci++; continue; }
          if (sayiIsaretiMi(noktalar)) { sM = true; ci++; continue; }
          if (buyukHarfIsaretiMi(noktalar)) { bH = true; ci++; continue; }
          if (sM) {
            const r = hucreyiRakamayap(noktalar);
            if (r) { cikis.push(r); ci++; continue; }
            sM = false;
          }
          const hA = [...noktalar].sort((a, b) => a - b).join(',');
          if (!sM && _HECE_TERS.has(hA)) {
            cikis.push(_HECE_TERS.get(hA));
          } else {
            const h = hucreyiKarakteryap(noktalar);
            if (h) cikis.push(bH ? h.toLocaleUpperCase('tr') : h.toLocaleLowerCase('tr'));
          }
          bH = false; ci++;
        }
      };
      for (const n of hucreleri) {
        if (n.length === 0) { bloklariIsle(blok); blok = []; cikis.push(' '); }
        else blok.push(n);
      }
      bloklariIsle(blok);
      metin += cikis.join('') + '\n';
    }
    return metin.trim();
  }

  for (const satir of satirlar) {
    if (!satir.trim()) { metin += '\n'; continue; }
    for (const ch of satir) {
      const noktalar = brfNoktalaradon(ch);
      if (noktalar === null) continue;
      if (noktalar.length === 0) {
        metin += ' '; sayiModu = false; buyukHarfBekle = false; continue;
      }
      if (sayiIsaretiMi(noktalar)) { sayiModu = true; continue; }
      if (buyukHarfIsaretiMi(noktalar)) { buyukHarfBekle = true; continue; }
      if (sayiModu) {
        const rakam = hucreyiRakamayap(noktalar);
        if (rakam) { metin += rakam; continue; }
        sayiModu = false;
      }
      const harf = hucreyiKarakteryap(noktalar);
      if (harf) metin += buyukHarfBekle ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
      buyukHarfBekle = false;
    }
    metin += '\n';
  }
  return metin.trim();
}

function brfMetinedon(icerik) { return _brfMetinedon(icerik, false); }
function brfMetinedonKisaltmali(icerik) { return _brfMetinedon(icerik, true); }

// ─── Bileşen ──────────────────────────────────────────────────────────────
export default function BrfOku() {
  const dosyaRef = useRef(null);
  const [okunanMetin, setOkunanMetin] = useState('');
  const [dosyaIcerik, setDosyaIcerik] = useState('');
  const [dosyaAdi, setDosyaAdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [kisaltmaAktif, setKisaltmaAktif] = useState(false);
  const [konusuyor, setKonusuyor] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const temizle = () => {
    setOkunanMetin(''); setDosyaIcerik(''); setDosyaAdi('');
    setHata(''); setYukleniyor(false);
    if (konusuyor) { konusmayiDurdur(); setKonusuyor(false); }
  };

  const kisaltmaToggle = () => {
    setKisaltmaAktif((v) => {
      const yeni = !v;
      if (dosyaIcerik) {
        setOkunanMetin(yeni ? brfMetinedonKisaltmali(dosyaIcerik) : brfMetinedon(dosyaIcerik));
      }
      return yeni;
    });
  };

  const processBrfFile = (dosya) => {
    if (!dosya) return;
    if (!dosya.name.toLowerCase().endsWith('.brf')) {
      setHata('Lütfen .brf uzantılı bir dosya seçin.');
      return;
    }
    setHata('');
    setDosyaAdi(dosya.name);
    setYukleniyor(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const icerik = ev.target.result;
      setDosyaIcerik(icerik);
      const normal = brfMetinedon(icerik);
      const kisaltmali = brfMetinedonKisaltmali(icerik);
      const kisaltmaVar = normal !== kisaltmali;
      setKisaltmaAktif(kisaltmaVar);
      setOkunanMetin(kisaltmaVar ? kisaltmali : normal);
      setYukleniyor(false);
    };
    reader.onerror = () => { setHata('Dosya okunurken hata oluştu.'); setYukleniyor(false); };
    reader.readAsText(dosya, 'latin1');
  };

  const sesToggle = () => {
    if (konusuyor) { konusmayiDurdur(); setKonusuyor(false); return; }
    if (!okunanMetin.trim()) return;
    setKonusuyor(true);
    konus(okunanMetin, { kesintiyle: true, onSon: () => setKonusuyor(false) });
  };

  return (
    <div className="page yazma-page araclar-page">

      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="BRF → Metin" />
      </div>

      <div className="yazma-bolum yazma-bolum-orta">
        <input
          ref={dosyaRef}
          type="file"
          accept=".brf"
          onChange={(e) => { processBrfFile(e.target.files?.[0]); e.target.value = ''; }}
          style={{ display: 'none' }}
          aria-label="BRF dosyası seç"
        />

        {/* Drop zone */}
        {!okunanMetin && !yukleniyor && (
          <div
            className={'belge-drop-zone' + (dragOver ? ' drag-over' : '')}
            onClick={() => dosyaRef.current?.click()}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); processBrfFile(e.dataTransfer.files?.[0]); }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            role="button"
            tabIndex={0}
            aria-label="BRF dosyası seç"
            onKeyDown={(e) => e.key === 'Enter' && dosyaRef.current?.click()}
          >
            <div className="belge-drop-ikon">
              <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.5"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M36 4H16a4 4 0 0 0-4 4v48a4 4 0 0 0 4 4h32a4 4 0 0 0 4-4V20Z"/>
                <path d="M36 4v16h16"/>
                <circle cx="22" cy="36" r="3" fill="currentColor" stroke="none"/>
                <circle cx="22" cy="46" r="3" fill="currentColor" stroke="none"/>
                <circle cx="32" cy="31" r="3" fill="currentColor" stroke="none"/>
                <circle cx="32" cy="41" r="3" fill="currentColor" stroke="none"/>
                <circle cx="42" cy="36" r="3" fill="currentColor" stroke="none"/>
                <circle cx="42" cy="46" r="3" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <p className="belge-drop-baslik">BRF dosyası seçin</p>
            <p className="belge-drop-alt">veya dosyayı buraya sürükleyin</p>
            <div className="belge-format-badges">
              <span className="belge-format-badge">.brf</span>
            </div>
            {hata && <p className="belge-drop-hata" role="alert">{hata}</p>}
          </div>
        )}

        {/* Yükleniyor */}
        {yukleniyor && (
          <div className="belge-yukleniyor">
            <span className="belge-yukleniyor-spinner" aria-hidden="true" />
            <span>Okunuyor…</span>
          </div>
        )}

        {/* Dosya yüklendi */}
        {!yukleniyor && okunanMetin && (
          <>
            <div className="belge-dosya-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="belge-dosya-adi">{dosyaAdi}</span>
              <span className="belge-dosya-karakter">{okunanMetin.length.toLocaleString('tr')} karakter</span>
              <button
                type="button"
                className="belge-dosya-kaldir"
                onClick={temizle}
                aria-label="Dosyayı kaldır"
                title="Kaldır"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                     strokeLinecap="round" width="14" height="14" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="araclar-alan-sarici">
              <textarea
                className="yazma-metin araclar-metin araclar-okunan araclar-textarea"
                value={okunanMetin}
                onChange={(e) => setOkunanMetin(e.target.value)}
                aria-label="BRF dosyasından okunan metin (düzenlenebilir)"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button
                type="button"
                className={'araclar-seslendir-btn' + (konusuyor ? ' aktif' : '')}
                onClick={sesToggle}
                disabled={!okunanMetin.trim()}
                aria-label={konusuyor ? 'Durdur' : 'Metni Seslendir'}
                title={konusuyor ? 'Durdur' : 'Metni Seslendir'}
              >
                {konusuyor
                  ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Alt aksiyonlar */}
      {okunanMetin && (
        <div className="yazma-bolum yazma-bolum-alt">
          <div className="controls">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(okunanMetin).catch(() => {})}
              aria-label="Panoya Kopyala"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span className="btn-yazi">Panoya Kopyala</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([okunanMetin], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (dosyaAdi.replace(/\.brf$/i, '') || 'metin') + '.txt';
                a.click();
                URL.revokeObjectURL(url);
              }}
              aria-label="TXT olarak indir"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <path d="M12 3v13M7 11l5 5 5-5"/>
                <path d="M5 20h14"/>
              </svg>
              <span className="btn-yazi">TXT İndir</span>
            </button>
            <button
              type="button"
              className={'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}
              onClick={kisaltmaToggle}
              aria-pressed={kisaltmaAktif}
              aria-label={'Kısaltma ' + (kisaltmaAktif ? 'Aktif' : 'Kapalı')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
              </svg>
              <span className="btn-yazi">Kısaltma {kisaltmaAktif ? 'Aktif' : 'Kapalı'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
