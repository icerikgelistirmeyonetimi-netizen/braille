import React, { useRef, useState, useEffect } from 'react';
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
  NOKTALAMA,
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

const _NOKTA_TERS = new Map(
  NOKTALAMA.map((n) => [
    [...n.noktalar].sort((a,b)=>a-b).join(','),
    n
  ])
);

/**
 * Tıklanan braille hücresinin anlamını döndürür.
 * Bağlam takibi (sayı modu / büyük harf bekleme) için idx öncesindeki
 * hücreler taranır.
 */
function hucreAnlami(hucreler, idx, kisaltmaAktif) {
  const dotKey = (pts) => [...pts].sort((a, b) => a - b).join(',');

  // Durum takibi
  let sayiModu = false;
  let buyukHarfBekle = false;
  for (let i = 0; i < idx; i++) {
    const h = hucreler[i];
    if (h.length === 0) { sayiModu = false; buyukHarfBekle = false; continue; }
    if (sayiIsaretiMi(h)) { sayiModu = true; buyukHarfBekle = false; continue; }
    if (buyukHarfIsaretiMi(h)) { buyukHarfBekle = true; continue; }
    if (sayiModu) { if (hucreyiRakamayap(h)) continue; sayiModu = false; }
    buyukHarfBekle = false;
  }

  const noktalar = hucreler[idx];
  const noktaStr = noktalar.length === 0 ? '—' : noktalar.join(' · ');
  const k = dotKey(noktalar);

  if (noktalar.length === 0) {
    return { tip: 'bosluk', baslik: 'Boşluk', detay: 'Kelimeler arasındaki boşluk.', noktaStr };
  }
  if (buyukHarfIsaretiMi(noktalar)) {
    return { tip: 'isaret', baslik: 'Büyük Harf İşareti', detay: 'Nokta 4 · 6. Sonraki harf büyük okunur.', noktaStr };
  }
  if (sayiIsaretiMi(noktalar)) {
    return { tip: 'isaret', baslik: 'Sayı İşareti', detay: 'Nokta 3 · 4 · 5 · 6. Sonraki hücreler rakam olarak okunur.', noktaStr };
  }
  if (sayiModu) {
    const r = hucreyiRakamayap(noktalar);
    if (r) return { tip: 'rakam', baslik: `Rakam: ${r}`, detay: 'Sayı modunda kullanılır.', noktaStr };
    // sayiModu sona erdi; fall through to normal lookup
  }

  if (kisaltmaAktif) {
    // Kelime sınırları: boşluk ([] hücre) veya dizi başı/sonu
    const prevIsSpace = idx === 0 || hucreler[idx - 1].length === 0;
    const nextIsSpace = idx >= hucreler.length - 1 || hucreler[idx + 1].length === 0;
    // Büyük harf işareti öncesinde de sınır sayılır
    const prevIsBuyuk = idx > 0 && buyukHarfIsaretiMi(hucreler[idx - 1]);
    const prevBosBuyuk = prevIsSpace || prevIsBuyuk;

    // Kök işareti [5]
    if (noktalar.length === 1 && noktalar[0] === 5) {
      return { tip: 'isaret', baslik: 'Kök İşareti (nokta 5)', detay: 'Sonraki hücreyle birlikte kelime kökü kısaltması oluşturur.', noktaStr };
    }
    // Kelime parçası işareti [4,5] veya [5,6]
    if (k === '4,5') return { tip: 'isaret', baslik: 'Kelime Parçası İşareti (4 · 5)', detay: 'Sonraki hücreyle birlikte ek kısaltması oluşturur.', noktaStr };
    if (k === '5,6') return { tip: 'isaret', baslik: 'Kelime Parçası İşareti (5 · 6)', detay: 'Sonraki hücreyle birlikte ek kısaltması oluşturur.', noktaStr };

    // İki harfli kısaltma: yalnızca tam kelime (her iki yanı da boşluk)
    // — bu hücre ikinci mi?
    if (idx > 0 && prevBosBuyuk === false) {
      const prevK = dotKey(hucreler[idx - 1]);
      const prevPrevIsSpace = idx < 2 || hucreler[idx - 2].length === 0 || buyukHarfIsaretiMi(hucreler[idx - 2]);
      if (prevPrevIsSpace && nextIsSpace) {
        const ikiKey = prevK + '|' + k;
        const iki = IKI_HARFLI_KISALTMALAR.find((m) => dotKey(m.sol) + '|' + dotKey(m.sag) === ikiKey);
        if (iki) return { tip: 'kisaltma', baslik: `İki Harfli Kısaltma: "${iki.kelime}"`, detay: `"${iki.harf}" → "${iki.kelime}" (bu hücre ikinci)`, noktaStr };
      }
    }
    // — bu hücre birinci mi?
    if (idx + 1 < hucreler.length && nextIsSpace === false) {
      const nextK = dotKey(hucreler[idx + 1]);
      const nextNextIsSpace = idx + 2 >= hucreler.length || hucreler[idx + 2].length === 0;
      if (prevBosBuyuk && nextNextIsSpace) {
        const ikiKey = k + '|' + nextK;
        const iki = IKI_HARFLI_KISALTMALAR.find((m) => dotKey(m.sol) + '|' + dotKey(m.sag) === ikiKey);
        if (iki) return { tip: 'kisaltma', baslik: `İki Harfli Kısaltma: "${iki.kelime}"`, detay: `"${iki.harf}" → "${iki.kelime}" (bu hücre birinci)`, noktaStr };
      }
    }

    // Hece kısaltması: kelime içinde de geçerli, ama noktalama/harf olarak zaten tanınıyorsa o öncelikli
    // Önce hece olup olmadığına bak, ama sadece hece kısaltması tablolarında eşleşen desenlerde
    const hece = _HECE_TERS.get(k);
    if (hece) return { tip: 'kisaltma', baslik: `Hece Kısaltması: "${hece}"`, detay: `Tek hücreyle "${hece}" hecesini temsil eder.`, noktaStr };

    // Kelime kısaltması (tek harfli): YALNIZCA tam kelimeyse (iki yanı boşluk)
    if (prevBosBuyuk && nextIsSpace) {
      const kelime = _KISALTMA_TEK.get(k);
      if (kelime) {
        const harf = KELIME_KISALTMALARI.find((m) => dotKey(m.noktalar) === k)?.harf || '';
        return { tip: 'kisaltma', baslik: `Kelime Kısaltması: "${kelime}"`, detay: `"${harf}" harfi tek başına → "${kelime}" kelimesi`, noktaStr };
      }
    }
  }

  // Noktalama?
  const np = _NOKTA_TERS.get(k);
  if (np) return { tip: 'noktalama', baslik: `Noktalama: ${np.isim} (${np.isaret})`, detay: `Nokta ${noktaStr}`, noktaStr };

  // Harf?
  const harf = hucreyiKarakteryap(noktalar);
  if (harf && harf !== ' ') {
    const goster = buyukHarfBekle ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
    return { tip: 'harf', baslik: `Harf: ${goster.toLocaleUpperCase('tr')}`, detay: `Nokta ${noktaStr} → "${goster.toLocaleUpperCase('tr')}" harfi`, noktaStr };
  }

  return { tip: 'bilinmiyor', baslik: 'Bilinmiyor', detay: `Nokta ${noktaStr} için anlam bulunamadı.`, noktaStr };
}

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
  const [perkinsAktif, setPerkinsAktif] = useState(true);
  const [kisaltmaAktif, setKisaltmaAktif] = useState(false);
  const [konusuyor, setKonusuyor] = useState(false); // 'metin' | 'nokta' | false
  const [seciliHucre, setSeciliHucre] = useState(null); // { index, anlam }

  // Escape ile popup kapat
  useEffect(() => {
    if (!seciliHucre) return;
    const kapat = (e) => { if (e.key === 'Escape') setSeciliHucre(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [seciliHucre]);

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

  const processBrfFile = (dosya) => {
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
      // Kısaltma otomatik tespiti: iki mod fark üretiyorsa kısaltma kullanılmış
      const normal = brfMetinedon(icerik);
      const kisaltmali = brfMetinedonKisaltmali(icerik);
      const kisaltmaVar = normal !== kisaltmali;
      setOkuKisaltmaAktif(kisaltmaVar);
      setOkunanMetin(kisaltmaVar ? kisaltmali : normal);
      setYukleniyor(false);
    };
    reader.onerror = () => {
      setHata('Dosya okunurken bir hata oluştu.');
      setYukleniyor(false);
    };
    reader.readAsText(dosya, 'latin1');
  };

  const dosyaSec = (e) => {
    processBrfFile(e.target.files?.[0]);
    e.target.value = '';
  };

  return (
    <div className="page yazma-page araclar-page">

      {/* ── Üst: başlık ── */}
      <div className="yazma-bolum yazma-bolum-ust">
        <PageHeader baslik="Metin → BRF" />
      </div>

      {/* ── Orta: içerik + klavye ── */}
      <div className="yazma-bolum yazma-bolum-orta">

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
                      <div
                        key={i}
                        className={'braille-info-wrap' + (seciliHucre?.index === i ? ' secili' : '')}
                        role="button"
                        tabIndex={0}
                        title="Tıkla: anlam göster"
                        onClick={() => {
                          const anlam = hucreAnlami(hucreler, i, kisaltmaAktif);
                          setSeciliHucre(seciliHucre?.index === i ? null : { index: i, anlam });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const anlam = hucreAnlami(hucreler, i, kisaltmaAktif);
                            setSeciliHucre(seciliHucre?.index === i ? null : { index: i, anlam });
                          }
                        }}
                      >
                        <BrailleCell aktifNoktalar={noktalar} tiklanabilir={false} kesfedilebilir={false} />
                      </div>
                    ))}
                  </div>

                  {seciliHucre && (
                    <div className="braille-hucre-popup" role="dialog" aria-label="Hücre anlamı">
                      <div className="bhp-header">
                        <span className="bhp-baslik-kucuk">Hücre {seciliHucre.index + 1}</span>
                        <button
                          type="button"
                          className="bhp-kapat"
                          onClick={() => setSeciliHucre(null)}
                          aria-label="Kapat"
                        >✕</button>
                      </div>
                      <div className="bhp-noktalar">Nokta: {seciliHucre.anlam.noktaStr}</div>
                      <div className={'bhp-anlam bhp-tip-' + seciliHucre.anlam.tip}>
                        {seciliHucre.anlam.baslik}
                      </div>
                      {seciliHucre.anlam.detay && (
                        <div className="bhp-detay">{seciliHucre.anlam.detay}</div>
                      )}
                    </div>
                  )}

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
      </div>

      {/* ── Alt: aksiyonlar ── */}
      <div className="yazma-bolum yazma-bolum-alt">
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
      </div>

      {/* ── Perkins klavye olay dinleyicisi (görünmez, sadece tuş yakalama) ── */}
      {perkinsAktif && (
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
