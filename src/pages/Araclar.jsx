import React, { useRef, useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import { metniBrailleyeCevir } from '../utils/brailleCevir.js';
import { metniBrailleyeCevirKisaltmali } from '../utils/brailleCevir.js';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
} from '../data/braille.js';
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
} from '../utils/brailleCevir.js';

// ─── BRF kodlama / çözme ───────────────────────────────────────────────────
// BRF (Braille Ready Format) standardı:
//   Karakter = 0x20 + nokta bitleri
//   bit0=nokta1  bit1=nokta2  bit2=nokta3
//   bit3=nokta4  bit4=nokta5  bit5=nokta6
const SATIRDA_HUCRE = 40;
const SAYFADA_SATIR = 25;

function noktalariBRF(noktalar) {
  let bits = 0;
  for (const d of noktalar) {
    if (d >= 1 && d <= 6) bits |= 1 << (d - 1);
  }
  return String.fromCharCode(0x20 + bits);
}

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

function metniBRFe(metin, cevirFn = metniBrailleyeCevir) {
  const { hucreler } = cevirFn(metin, {
    buyukHarfIsareti: true,
    sayiIsareti: true,
  });
  const satirlar = [];
  let satir = '';
  for (const hucre of hucreler) {
    satir += noktalariBRF(hucre);
    if (satir.length >= SATIRDA_HUCRE) {
      satirlar.push(satir);
      satir = '';
    }
  }
  if (satir.length) satirlar.push(satir);
  // Sayfa başlığı / form feed ekleme; basit BRF: her SAYFADA_SATIR satırda 0x0C
  const chunks = [];
  for (let i = 0; i < satirlar.length; i += SAYFADA_SATIR) {
    chunks.push(satirlar.slice(i, i + SAYFADA_SATIR).join('\r\n'));
  }
  return chunks.join('\r\n\f\r\n');
}

function brfMetinedon(icerik) {
  return _brfMetinedon(icerik, false);
}

function brfMetinedonKisaltmali(icerik) {
  return _brfMetinedon(icerik, true);
}

// Ters arama tabloları (kısaltmalı mod için)
const _KISALTMA_TEK = new Map(
  KELIME_KISALTMALARI.map((k) => [
    [...k.noktalar].sort((a,b)=>a-b).join(','),
    k.kelime
  ])
);
const _KISALTMA_IKI = (() => {
  const m = new Map();
  for (const k of IKI_HARFLI_KISALTMALAR) {
    const anahtar = [...k.sol].sort((a,b)=>a-b).join(',') + '|' + [...k.sag].sort((a,b)=>a-b).join(',');
    m.set(anahtar, k.kelime);
  }
  return m;
})();
const _HECE_TERS = new Map(
  HECE_KISALTMALARI.map((h) => [
    [...h.noktalar].sort((a,b)=>a-b).join(','),
    h.hece
  ])
);

function _brfMetinedon(icerik, kisaltmali) {
  // Satır ve sayfa ayraçlarını çıkar; sadece BRF karakterlerini işle
  const satirlar = icerik.split(/[\r\n\f]+/);
  let metin = '';
  let sayiModu = false;
  let buyukHarfBekle = false;

  // Kısaltmalı modda: tüm hücreleri önce parse et, kelime bloğlarına böl
  if (kisaltmali) {
    for (const satir of satirlar) {
      if (!satir.trim()) { metin += '\n'; continue; }
      // Satırdaki hücreleri al
      const hucreleri = [];
      for (const ch of satir) {
        const n = brfNoktalaradon(ch);
        if (n !== null) hucreleri.push(n);
      }
      // Kelime bloklarına böl (boş hücre = boşluk)
      let blok = [];
      const cikis = [];
      const bloklariIsle = (b) => {
        if (b.length === 0) return;
        // 1) 2 hücre: iki harfli kısaltma?
        if (b.length === 2) {
          const a = [...b[0]].sort((a,b)=>a-b).join(',') + '|' + [...b[1]].sort((a,b)=>a-b).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(_KISALTMA_IKI.get(a)); return; }
        }
        // 2) 1 hücre (sayı ve büyharf işareti değil): tek harfli kısaltma?
        if (b.length === 1) {
          const a = [...b[0]].sort((x,y)=>x-y).join(',');
          if (_KISALTMA_TEK.has(a)) { cikis.push(_KISALTMA_TEK.get(a)); return; }
        }
        // 3) Hece kısaltması bilinçli harf-harf çeviri
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
          // Hece kısaltması?
          const hA = [...noktalar].sort((a,b)=>a-b).join(',');
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
        if (n.length === 0) {
          bloklariIsle(blok); blok = [];
          cikis.push(' ');
        } else {
          blok.push(n);
        }
      }
      bloklariIsle(blok);
      metin += cikis.join('') + '\n';
    }
    return metin.trim();
  }

  // Normal mod (kısaltmasız)
  for (const satir of satirlar) {
    if (!satir.trim()) { metin += '\n'; continue; }
    for (const ch of satir) {
      const noktalar = brfNoktalaradon(ch);
      if (noktalar === null) continue;
      if (noktalar.length === 0) {
        metin += ' ';
        sayiModu = false;
        buyukHarfBekle = false;
        continue;
      }
      if (sayiIsaretiMi(noktalar)) { sayiModu = true; continue; }
      if (buyukHarfIsaretiMi(noktalar)) { buyukHarfBekle = true; continue; }

      if (sayiModu) {
        const rakam = hucreyiRakamayap(noktalar);
        if (rakam) { metin += rakam; continue; }
        sayiModu = false; // sayı bloğu bitti
      }

      const harf = hucreyiKarakteryap(noktalar);
      if (harf) {
        metin += buyukHarfBekle ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
      }
      buyukHarfBekle = false;
    }
    metin += '\n';
  }
  return metin.trim();
}

export default function Araclar() {
  const [aktifSekme, setAktifSekme] = useState('donustur');
  const [perkinsAktif, setPerkinsAktif] = useState(true);
  const [kisaltmaAktif, setKisaltmaAktif] = useState(false);
  const [konusuyor, setKonusuyor] = useState(false); // hangi alan konuşuyor: false | 'metin' | 'nokta' | 'oku'

  // ── Metin → BRF ──
  const [girisMetni, setGirisMetni] = useState('');
  const durumRef = useRef(yeniYazmaDurumu());
  const textareaRef = useRef(null);

  // Klavyeden gelen hücre → metne ekle (imlecin bulunduğu yere)
  const onHucre = (noktalar) => {
    const r = hucreyiIsle(durumRef.current, noktalar);
    if (r.tip !== 'bilinmeyen' && r.deger !== null) {
      insertAtCursor(r.deger);
    }
  };
  const onBosluk = () => insertAtCursor(' ');
  const onSil = () => {
    const ta = textareaRef.current;
    if (!ta) { setGirisMetni((m) => m.slice(0, -1)); return; }
    const { selectionStart: s, selectionEnd: e } = ta;
    if (s === e && s > 0) {
      const v = girisMetni;
      setGirisMetni(v.slice(0, s - 1) + v.slice(e));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s - 1; });
    } else if (s !== e) {
      const v = girisMetni;
      setGirisMetni(v.slice(0, s) + v.slice(e));
      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s; });
    }
  };

  // İmlecin bulunduğu konuma karakter ekle
  const insertAtCursor = (ch) => {
    const ta = textareaRef.current;
    if (!ta) { setGirisMetni((m) => m + ch); return; }
    const { selectionStart: s, selectionEnd: e } = ta;
    const v = girisMetni;
    const yeni = v.slice(0, s) + ch + v.slice(e);
    setGirisMetni(yeni);
    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + ch.length; });
  };

  // İndir: dönüştür + kaydet
  const cevirFn = kisaltmaAktif ? metniBrailleyeCevirKisaltmali : metniBrailleyeCevir;
  const brfIndir = () => {
    if (!girisMetni.trim()) return;
    const brf = metniBRFe(girisMetni, cevirFn);
    const blob = new Blob([brf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cikti.brf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const temizle = () => {
    setGirisMetni('');
    durumRef.current = yeniYazmaDurumu();
  };

  const sesToggle = (alan, metinFn) => {
    if (konusuyor === alan) {
      konusmayiDurdur();
      setKonusuyor(false);
      return;
    }
    const metin = metinFn();
    if (!metin || !metin.trim()) return;
    setKonusuyor(alan);
    konus(metin, { kesintiyle: true, onSon: () => setKonusuyor(false) });
  };

  const metniSeslendir = () =>
    sesToggle('metin', () => girisMetni);

  // Braille nokta numaralarını sesli oku: "m: 1 3 4, e: 1 5, ..."
  const noktalarıSeslendir = () =>
    sesToggle('nokta', () => {
      if (!girisMetni.trim()) return '';
      const { hucreler, esleme } = cevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
      const parcalar = [];
      for (let i = 0; i < hucreler.length; i++) {
        const n = hucreler[i];
        const kaynak = esleme[i];
        if (n.length === 0) { parcalar.push('boşluk'); continue; }
        const noktaMetni = n.join(' ');
        const harfMetni = kaynak >= 0 ? girisMetni[kaynak] : '';
        parcalar.push(harfMetni ? `${harfMetni}: ${noktaMetni}` : noktaMetni);
      }
      return parcalar.join(', ');
    });

  const okuSeslendir = () =>
    sesToggle('oku', () => okunanMetin);

  // ── BRF → Metin ──
  const dosyaRef = useRef(null);
  const [okunanMetin, setOkunanMetin] = useState('');
  const [dosyaIcerik, setDosyaIcerik] = useState('');
  const [dosyaAdi, setDosyaAdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');

  const [okuKisaltmaAktif, setOkuKisaltmaAktif] = useState(false);

  const okuKisaltmaToggle = () => {
    setOkuKisaltmaAktif((v) => {
      const yeni = !v;
      if (dosyaIcerik) {
        const donustur = yeni ? brfMetinedonKisaltmali : brfMetinedon;
        setOkunanMetin(donustur(dosyaIcerik));
      }
      return yeni;
    });
  };

  const dosyaSec = (e) => {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    if (!dosya.name.toLowerCase().endsWith('.brf')) {
      setHata('Lütfen .brf uzantılı bir dosya seçin.');
      setOkunanMetin('');
      setDosyaAdi('');
      return;
    }
    setHata('');
    setDosyaAdi(dosya.name);
    setYukleniyor(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const icerik = ev.target.result;
      setDosyaIcerik(icerik);
      const donustur = okuKisaltmaAktif ? brfMetinedonKisaltmali : brfMetinedon;
      setOkunanMetin(donustur(icerik));
      setYukleniyor(false);
    };
    reader.onerror = () => {
      setHata('Dosya okunurken bir hata oluştu.');
      setYukleniyor(false);
    };
    reader.readAsText(dosya, 'latin1');
  };

  const sekmeSec = (s) => {
    setAktifSekme(s);
    durumRef.current = yeniYazmaDurumu();
  };

  return (
    <div className="page yazma-page araclar-page">

      {/* ── Üst: başlık + sekmeler ── */}
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Araçlar" />
        <div className="araclar-sekmeler">
          <button
            type="button"
            className={'araclar-sekme' + (aktifSekme === 'donustur' ? ' aktif' : '')}
            aria-pressed={aktifSekme === 'donustur'}
            onClick={() => sekmeSec('donustur')}
          >
            ✍ Metni BRF'e Dönüştür
          </button>
          <button
            type="button"
            className={'araclar-sekme' + (aktifSekme === 'oku' ? ' aktif' : '')}
            aria-pressed={aktifSekme === 'oku'}
            onClick={() => sekmeSec('oku')}
          >
            📂 BRF Dosyası Oku
          </button>
        </div>
      </div>

      {/* ── Orta: içerik + klavye ── */}
      <div className="yazma-bolum yazma-bolum-orta">

        {aktifSekme === 'donustur' && (
          <>
            <div className="araclar-alan-sarici">
              <textarea
                ref={textareaRef}
                className="yazma-metin araclar-metin araclar-textarea"
                value={girisMetni}
                onChange={(e) => setGirisMetni(e.target.value)}
                placeholder="Metin girin…"
                aria-label="Dönüştürülecek metin"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
              />
              <button
                type="button"
                className={'araclar-seslendir-btn' + (konusuyor === 'metin' ? ' aktif' : '')}
                onClick={metniSeslendir}
                disabled={!girisMetni.trim()}
                aria-label={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                title={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
              >
                {konusuyor === 'metin'
                  ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                }
              </button>
            </div>

            {/* Noktalı braille görünümü */}
            {girisMetni && (() => {
              const { hucreler } = cevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
              return (
                <div className="araclar-nokta-sarici">
                  <div className="araclar-nokta-gorunus" aria-label="Braille nokta görünümü" aria-hidden="true">
                    {hucreler.map((noktalar, i) => (
                      <BrailleCell key={i} aktifNoktalar={noktalar} tiklanabilir={false} kesfedilebilir={false} />
                    ))}
                  </div>
                  <button
                    type="button"
                    className={'araclar-seslendir-btn araclar-seslendir-nokta' + (konusuyor === 'nokta' ? ' aktif' : '')}
                    onClick={noktalarıSeslendir}
                    aria-label={konusuyor === 'nokta' ? 'Durdur' : 'Braille Noktaları Oku'}
                    title={konusuyor === 'nokta' ? 'Durdur' : 'Braille Noktaları Oku'}
                  >
                    {konusuyor === 'nokta'
                      ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    }
                  </button>
                </div>
              );
            })()}
          </>
        )}

        {aktifSekme === 'oku' && (
          <>
            <div className="araclar-dosya-alan">
              <input
                ref={dosyaRef}
                type="file"
                accept=".brf"
                onChange={dosyaSec}
                style={{ display: 'none' }}
                id="brf-dosya-giris"
              />
              <button
                type="button"
                className="araclar-yukle-btn"
                onClick={() => dosyaRef.current?.click()}
              >
                <span aria-hidden="true">📂</span> BRF Dosyası Seç…
              </button>
              {dosyaAdi && (
                <span className="araclar-dosya-adi">{dosyaAdi}</span>
              )}
            </div>

            {hata && <div role="alert" className="araclar-hata">{hata}</div>}
            {yukleniyor && <div className="araclar-yukleniyor">Okunuyor…</div>}

            {!yukleniyor && (okunanMetin !== '') && (
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
                  className={'araclar-seslendir-btn' + (konusuyor === 'oku' ? ' aktif' : '')}
                  onClick={okuSeslendir}
                  disabled={!okunanMetin.trim()}
                  aria-label={konusuyor === 'oku' ? 'Durdur' : 'Metni Seslendir'}
                  title={konusuyor === 'oku' ? 'Durdur' : 'Metni Seslendir'}
                >
                  {konusuyor === 'oku'
                    ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                  }
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Alt: aksiyonlar ── */}
      <div className="yazma-bolum yazma-bolum-alt">
        {aktifSekme === 'donustur' && (
          <div className="controls">
            <button type="button" disabled={!girisMetni.trim()} onClick={brfIndir} aria-label="BRF İndir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>
              <span className="btn-yazi">BRF İndir</span>
            </button>
            <button type="button" onClick={temizle} disabled={!girisMetni} aria-label="Temizle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              <span className="btn-yazi">Temizle</span>
            </button>
            <button
              type="button"
              className={'araclar-perkins-btn' + (perkinsAktif ? ' aktif' : '')}
              onClick={() => setPerkinsAktif((v) => !v)}
              aria-pressed={perkinsAktif}
              aria-label={'Perkins klavye ' + (perkinsAktif ? 'Aktif' : 'Kapalı')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 17h8"/></svg>
              <span className="btn-yazi">Perkins {perkinsAktif ? 'Aktif' : 'Kapalı'}</span>
            </button>
            <button
              type="button"
              className={'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}
              onClick={() => setKisaltmaAktif((v) => !v)}
              aria-pressed={kisaltmaAktif}
              aria-label={'Kısaltma ' + (kisaltmaAktif ? 'Aktif' : 'Kapalı')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              <span className="btn-yazi">Kısaltma {kisaltmaAktif ? 'Aktif' : 'Kapalı'}</span>
            </button>
          </div>
        )}
        {aktifSekme === 'oku' && okunanMetin && (
          <div className="controls">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(okunanMetin).catch(() => {})}
              aria-label="Panoya Kopyala"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              <span className="btn-yazi">Panoya Kopyala</span>
            </button>
            <button
              type="button"
              className={'araclar-perkins-btn' + (okuKisaltmaAktif ? ' aktif' : '')}
              onClick={() => okuKisaltmaToggle()}
              aria-pressed={okuKisaltmaAktif}
              aria-label={'Kısaltma ' + (okuKisaltmaAktif ? 'Aktif' : 'Kapalı')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
              <span className="btn-yazi">Kısaltma {okuKisaltmaAktif ? 'Aktif' : 'Kapalı'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Perkins klavye olay dinleyicisi (görünmez, sadece tuş yakalama) ── */}
      {aktifSekme === 'donustur' && perkinsAktif && (
        <div style={{ display: 'none' }} aria-hidden="true">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={brfIndir}
            perkinsModu
          />
        </div>
      )}
    </div>
  );
}
