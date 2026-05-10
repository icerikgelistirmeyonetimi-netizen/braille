import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { toJpeg } from 'html-to-image';
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
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA,
} from '../data/braille.js';
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
  ikiHarfliKisaltmaPrefixEslesmesi,
  ikiHarfliKisaltmaOkunusunuYumusat,
  kelimeKokuOkunusunuYorIcinDuzelt,
} from '../utils/brailleCevir.js';

// ─── BRF kodlama / çözme ───────────────────────────────────────────────────
// BRF (Braille Ready Format) standardı:
//   Karakter = 0x20 + nokta bitleri
//   bit0=nokta1  bit1=nokta2  bit2=nokta3
//   bit3=nokta4  bit4=nokta5  bit5=nokta6
const SATIRDA_HUCRE = 40;
const SAYFADA_SATIR = 25;
const BRAILLE_SAYFA_BOYUTU = 200; // hücre/sayfa

// Hücre anlamından kısa etiket türet (genişlet modunda hücre altında gösterilir)
function kisaEtiket(anlam) {
  if (!anlam || anlam.tip === 'bosluk') return '';
  if (anlam.tip === 'isaret') {
    if (anlam.baslik.includes('Tümü Büyük')) return '⇧⇧';
    if (anlam.baslik.includes('Büyük Harf')) return '⇧';
    if (anlam.baslik.includes('Sayı')) return '#';
    if (anlam.baslik.includes('Ayırma')) return '3';
    if (anlam.baslik.includes('Kök') || anlam.baslik.includes('Parça')) return '*';
    return '*';
  }
  if (anlam.etiket === '') return '';
  if (anlam.etiket) return anlam.etiket;
  if (anlam.tip === 'harf' && anlam.harf) return anlam.harf;
  if (anlam.tip === 'harf') {
    const hm = anlam.baslik.match(/Harf:\s*(.+)/);
    if (hm) return hm[1].trim();
  }
  const tm = anlam.baslik.match(/[\u201C\u201D"]([^\u201C\u201D"]+)[\u201C\u201D"]/);
  if (tm) return tm[1];
  if (anlam.tip === 'noktalama') {
    if (anlam.isaret) return anlam.isaret;
    const pm = anlam.baslik.match(/\(([^)]+)\)/);
    if (pm) return pm[1];
  }
  if (anlam.tip === 'rakam') {
    const rm = anlam.baslik.match(/Rakam:\s*(.+)/);
    if (rm) return rm[1].trim();
  }
  return anlam.baslik;
}


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

// Tek başına kalan tek harfli "kelimeleri" tırnak içine al ki
// kısaltmalı modda bir harfli kısaltma sanılmasın (örn. a → “a”).
// Sadece kısaltmalı modda çağrılmalı.
export function tekHarfTirnakla(metin) {
  if (!metin) return metin;
  // Sağ sınır yalnız boşluk veya satır sonu olmalı; nokta/virgül gelirse (örn. "A.")
  // dokunma — başlık/kısaltma yazımını bozmamak için.
  return metin.replace(/(^|[\s\(\[\{])(\p{L})(?=$|\s)/gu, '$1“$2”');
}

// Textarea onChange yardımcısı: kullanıcı boşluk/noktalama girdiğinde,
// kısaltmalı modda tek başına kalan harfleri tırnaklayarak günceller.
// İmleç konumunu eklenen karakter sayısı kadar kaydırır.
export function metinTirnakliGuncelle(yeni, eski, ta, kisaltmaAktif, setMetin) {
  if (!kisaltmaAktif || yeni.length <= eski.length) {
    setMetin(yeni);
    return;
  }
  const cursor = ta ? ta.selectionStart : yeni.length;
  const sonChar = yeni[cursor - 1] || '';
  // Sadece tetikleyici karakter girildiğinde dönüştür
  // Sadece boşluk/satır sonu girildiğinde çalış — nokta/virgül gibi işaretler güvenli
  // varsayılmamalı (örn. "A." başlık yazımı).
  if (!/\s/.test(sonChar)) {
    setMetin(yeni);
    return;
  }
  const oncesi = yeni.slice(0, cursor);
  const sonrasi = yeni.slice(cursor);
  const oncesiYeni = tekHarfTirnakla(oncesi);
  if (oncesiYeni === oncesi) {
    setMetin(yeni);
    return;
  }
  const eklenen = oncesiYeni.length - oncesi.length;
  setMetin(oncesiYeni + sonrasi);
  if (ta) {
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = cursor + eklenen;
    });
  }
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

// Kelime kökü kısaltmaları: sag hücre key → { kelime, etiket }
const _KOK_SAG_MAP = new Map(
  KELIME_KOKU_KISALTMALARI.map((k) => [
    [...k.sag].sort((a,b)=>a-b).join(','),
    k
  ])
);

// Kelime parçası kısaltmaları: sol+sag key → { sol, sag, ekler, etiket }
const _PARCA_MAP = new Map(
  KELIME_PARCASI_KISALTMALARI.map((p) => [
    [...p.sol].sort((a,b)=>a-b).join(',') + '|' + [...p.sag].sort((a,b)=>a-b).join(','),
    p
  ])
);

// Ünlü uyumuna göre doğru ek varyantını seç ("madan, meden" gibi virgüllü listeden)
const _ARKA_UNLU = new Set(['a', 'ı', 'o', 'u']);
const _ON_UNLU   = new Set(['e', 'i', 'ö', 'ü']);
const _DUZ_UNLU  = new Set(['a', 'e', 'ı', 'i']);
const _YUV_UNLU  = new Set(['o', 'ö', 'u', 'ü']);
const _TUM_UNLU  = new Set([..._ARKA_UNLU, ..._ON_UNLU]);
function _unluUyumuSec(ekler, oncekiMetin) {
  const variants = ekler.split(',').map((s) => s.trim());
  if (variants.length <= 1) return variants[0] || '';
  const oncekiKucuk = (oncekiMetin || '').toLocaleLowerCase('tr');
  if (oncekiKucuk.endsWith('bu') && variants.includes('gün')) return 'gün';
  let sonUnlu = null;
  for (let k = oncekiMetin.length - 1; k >= 0; k--) {
    if (_TUM_UNLU.has(oncekiMetin[k])) { sonUnlu = oncekiMetin[k]; break; }
  }
  if (!sonUnlu) return variants[0];
  const arkaVar = _ARKA_UNLU.has(sonUnlu);
  const yuvVar  = _YUV_UNLU.has(sonUnlu);
  // Önce hem ön/arka hem düz/yuvarlak uyan varyant
  for (const v of variants) {
    const ilkUnlu = [...v].find((c) => _TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    const ilkArka = _ARKA_UNLU.has(ilkUnlu);
    const ilkYuv  = _YUV_UNLU.has(ilkUnlu);
    if (ilkArka === arkaVar && ilkYuv === yuvVar) return v;
  }
  // Yedek: sadece ön/arka uyan varyant
  for (const v of variants) {
    const ilkUnlu = [...v].find((c) => _TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    if (_ARKA_UNLU.has(ilkUnlu) === arkaVar) return v;
  }
  return variants[0];
}

/**
 * Tıklanan braille hücresinin anlamını döndürür.
 * Bağlam takibi (sayı modu / büyük harf bekleme) için idx öncesindeki
 * hücreler taranır.
 */
export function hucreAnlami(hucreler, idx, kisaltmaAktif, opts) {
  const dotKey = (pts) => [...pts].sort((a, b) => a - b).join(',');
  // İsteğe bağlı: kaynak metin ve hücre-kaynak eşleme. Verildiğinde kısaltma
  // tespitini gerçek kaynak kelimeyle doğrular; örn. iki harfli kısaltma prefix'i
  // sıradan iki harfle karışmasın.
  const _kaynak = opts && typeof opts.kaynak === 'string' ? opts.kaynak : null;
  const _esleme = opts && Array.isArray(opts.esleme) ? opts.esleme : null;
  const _kaynakKelime = (cellIdx) => {
    if (!_kaynak || !_esleme) return null; // bilinmiyor → eski davranış
    const ki = _esleme[cellIdx];
    if (typeof ki !== 'number' || ki < 0 || ki >= _kaynak.length) return null;
    const isHarf = (c) => /\p{L}/u.test(c);
    if (!isHarf(_kaynak[ki])) return null;
    let s = ki; while (s > 0 && isHarf(_kaynak[s - 1])) s--;
    let e = ki; while (e + 1 < _kaynak.length && isHarf(_kaynak[e + 1])) e++;
    return _kaynak.slice(s, e + 1).toLocaleLowerCase('tr');
  };
  const _kaynakKelimeBaslar = (cellIdx, kelime) => {
    const kaynakKelime = _kaynakKelime(cellIdx);
    if (kaynakKelime === null) return true;
    const hedef = kelime.toLocaleLowerCase('tr');
    return kaynakKelime === hedef || ikiHarfliKisaltmaPrefixEslesmesi(kaynakKelime, hedef) !== null;
  };

  // Durum takibi
  let sayiModu = false;
  let buyukHarfBekle = false;
  let tumKelimeBuyuk = false;
  for (let i = 0; i < idx; i++) {
    const h = hucreler[i];
    if (h.length === 0) { sayiModu = false; buyukHarfBekle = false; tumKelimeBuyuk = false; continue; }
    if (sayiIsaretiMi(h)) {
      // Sadece kelime başında + ardından rakam gelirse sayı modu aç.
      const onceki = i > 0 ? hucreler[i - 1] : null;
      const wordStart = !onceki || onceki.length === 0 || buyukHarfIsaretiMi(onceki);
      const sonraki = i + 1 < hucreler.length ? hucreler[i + 1] : null;
      if (wordStart && sonraki && hucreyiRakamayap(sonraki)) {
        sayiModu = true; buyukHarfBekle = false; tumKelimeBuyuk = false; continue;
      }
      // mid-word [3,4,5,6] → "ki" hecesi, sayı modu açma
    }
    if (buyukHarfIsaretiMi(h)) {
      if (buyukHarfBekle) { tumKelimeBuyuk = true; buyukHarfBekle = false; }
      else { buyukHarfBekle = true; }
      continue;
    }
    if (sayiModu) { if (hucreyiRakamayap(h)) continue; sayiModu = false; }
    buyukHarfBekle = false;
  }

  const noktalar = hucreler[idx];
  const noktaStr = noktalar.length === 0 ? '—' : noktalar.join(' · ');
  const k = dotKey(noktalar);

  // Parantez açma/kapama ayrımı: [2,3,5,6] hücreleri belgede sırayla
  // ilk gelen "(", ikincisi ")" olarak yorumlanır (toggle).
  const parenAcmaMi = () => {
    let cnt = 0;
    for (let i = 0; i < idx; i++) {
      if (dotKey(hucreler[i]) === '2,3,5,6') cnt++;
    }
    return cnt % 2 === 0;
  };
  const parenSwap = (np) => {
    if (!np || (np.isaret !== '(' && np.isaret !== ')')) return np;
    return parenAcmaMi()
      ? { ...np, isaret: '(', isim: 'parantez açma' }
      : { ...np, isaret: ')', isim: 'parantez kapama' };
  };

  if (noktalar.length === 0) {
    return { tip: 'bosluk', baslik: 'Boşluk', detay: 'Kelimeler arasındaki boşluk.', noktaStr };
  }
  if (buyukHarfIsaretiMi(noktalar)) {
    // Yan yana iki [6] ise "tümü büyük"
    const onceki = idx > 0 ? hucreler[idx - 1] : null;
    const sonraki = idx + 1 < hucreler.length ? hucreler[idx + 1] : null;
    if (onceki && buyukHarfIsaretiMi(onceki)) {
      return { tip: 'isaret', baslik: 'Tümü Büyük İşareti', detay: 'Önceki [6] ile birlikte: bu kelimedeki tüm harfler büyük okunur.', noktaStr };
    }
    if (sonraki && buyukHarfIsaretiMi(sonraki)) {
      return { tip: 'isaret', baslik: 'Tümü Büyük İşareti', detay: 'Sonraki [6] ile birlikte: kelimedeki tüm harfler büyük okunur.', noktaStr };
    }
    return { tip: 'isaret', baslik: 'Büyük Harf İşareti', detay: 'Nokta 6. Sonraki harf büyük okunur.', noktaStr };
  }
  // Sayı işareti yalnızca kelime başında (önceki hücre boşluk/yok) VE
  // ardından bir rakam (a-j) hücresi geliyorsa geçerlidir. Aksi halde
  // [3,4,5,6] hücresi "ki" hecesi olarak yorumlanır.
  if (sayiIsaretiMi(noktalar)) {
    const prevBosluk = idx === 0 || hucreler[idx - 1].length === 0
      || buyukHarfIsaretiMi(hucreler[idx - 1]);
    const sonraki = idx + 1 < hucreler.length ? hucreler[idx + 1] : null;
    const sonrakiRakam = sonraki && hucreyiRakamayap(sonraki);
    if (prevBosluk && sonrakiRakam) {
      return { tip: 'isaret', baslik: 'Sayı İşareti', detay: 'Nokta 3 · 4 · 5 · 6. Sonraki hücreler rakam olarak okunur.', noktaStr };
    }
    // değilse: hece "ki" olarak fall-through
  }
  if (sayiModu) {
    const r = hucreyiRakamayap(noktalar);
    if (r) return { tip: 'rakam', baslik: `Rakam: ${r}`, detay: 'Sayı modunda kullanılır.', noktaStr };
    // sayiModu sona erdi; fall through to normal lookup
  }

  if (kisaltmaAktif) {
    // Kelime sınırları: boşluk ([] hücre), dizi başı/sonu veya noktalama hücresi.
    // Noktalama hücresi de kelime sınırı sayılır ki "aynı." gibi kısaltma+noktalama
    // dizilişlerinde kısaltma yine tanınsın.
    // Bazı noktalamalar hece desenleriyle çakışır (örn. "." = "ka" deseni). Bu durumda
    // bağlama bak: ardından boşluk/satır sonu veya başka bir noktalama deseni geliyorsa
    // kelime sonu kabul edip noktalama say.
    const _tekHarfAyirmaIsaretiMi = (cellIdx) => {
      if (cellIdx <= 0 || cellIdx + 1 >= hucreler.length) return false;
      if (dotKey(hucreler[cellIdx]) !== '3') return false;
      const prevK = dotKey(hucreler[cellIdx - 1]);
      if (!_KISALTMA_TEK.has(prevK)) return false;
      const next = hucreler[cellIdx + 1];
      if (!next || next.length === 0) return false;
      const prevPrev = cellIdx >= 2 ? hucreler[cellIdx - 2] : null;
      return cellIdx < 2 || !prevPrev || prevPrev.length === 0 || buyukHarfIsaretiMi(prevPrev);
    };
    const _isNoktalamaHucre = (h, i) => {
      if (!h || h.length === 0) return false;
      const kk = dotKey(h);
      if (!_NOKTA_TERS.has(kk)) return false;
      if (kk === '3' && _tekHarfAyirmaIsaretiMi(i)) return false;
      if (!_HECE_TERS.has(kk)) return true;
      const next = i + 1 < hucreler.length ? hucreler[i + 1] : null;
      if (!next || next.length === 0) return true;
      const nk = dotKey(next);
      return _NOKTA_TERS.has(nk);
    };
    const prevIsSpace = idx === 0 || hucreler[idx - 1].length === 0
      || _isNoktalamaHucre(hucreler[idx - 1], idx - 1);
    const nextIsSpace = idx >= hucreler.length - 1 || hucreler[idx + 1].length === 0
      || _isNoktalamaHucre(hucreler[idx + 1], idx + 1);
    // Büyük harf işareti öncesinde de sınır sayılır
    const prevIsBuyuk = idx > 0 && buyukHarfIsaretiMi(hucreler[idx - 1]);
    const prevBosBuyuk = prevIsSpace || prevIsBuyuk;

    // Kelime başında [6][6] (tümü büyük) ya da tek [6] (ilk harf büyük) bul
    // → Bu kısaltma için kasa belirle
    let kelBas = idx;
    while (kelBas > 0 && hucreler[kelBas - 1].length > 0) kelBas--;
    let tumBuyuk = false, ilkBuyuk = false;
    if (kelBas + 1 < hucreler.length &&
        buyukHarfIsaretiMi(hucreler[kelBas]) &&
        buyukHarfIsaretiMi(hucreler[kelBas + 1])) {
      tumBuyuk = true;
    } else if (kelBas < hucreler.length && buyukHarfIsaretiMi(hucreler[kelBas])) {
      // Sadece bu kısaltma kelimenin/hecenin tam ilkiyse büyük yaz
      ilkBuyuk = (idx === kelBas + 1);
    }
    const kasala = (s) => {
      if (!s) return s;
      if (tumBuyuk) return s.toLocaleUpperCase('tr');
      if (ilkBuyuk) return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1).toLocaleLowerCase('tr');
      return s.toLocaleLowerCase('tr');
    };

    // Kök işareti [5]
    if (k === '5') {
      return { tip: 'isaret', baslik: 'Kelime Kökü İşareti', detay: 'Nokta 5. Sonraki hücreyle birlikte kelime kökü kısaltması oluşturur.', noktaStr };
    }
    // Bu hücre bir kök kısaltmasının sag hücresi mi? (önceki hücre [5])
    if (idx > 0 && dotKey(hucreler[idx - 1]) === '5') {
      const kok = _KOK_SAG_MAP.get(k);
      if (kok) {
        const kel = kasala(kok.kelime);
        return { tip: 'kisaltma', baslik: `Kelime Kökü: "${kel}"`, detay: `Nokta 5 + bu hücre → "${kel}" kök kısaltması`, noktaStr, etiket: kel };
      }
    }
    // Kelime parçası işareti [4,5] veya [5,6]
    if (k === '4,5' || k === '5,6') {
      return { tip: 'isaret', baslik: 'Kelime Parçası İşareti', detay: `Nokta ${k.replace(',', ' · ')}. Sonraki hücreyle birlikte ek kısaltması oluşturur.`, noktaStr };
    }

    // Tek harfli kısaltma + ek ayırma işareti: [3]
    // [3] aynı zamanda kesme işareti olduğundan yalnızca bağlam uygunsa bu adla göster.
    if (k === '3' && idx > 0 && idx + 1 < hucreler.length) {
      const prev = hucreler[idx - 1];
      const next = hucreler[idx + 1];
      const prevK = dotKey(prev);
      const prevPrev = idx >= 2 ? hucreler[idx - 2] : null;
      const prevBoundary = idx < 2 || !prevPrev || prevPrev.length === 0 || buyukHarfIsaretiMi(prevPrev);
      const kaynakIdx = _esleme ? _esleme[idx] : -1;
      const kaynakAyiriciOlabilir = !_kaynak || typeof kaynakIdx !== 'number' || kaynakIdx < 0 || /\p{L}/u.test(_kaynak[kaynakIdx] || '');
      if (_KISALTMA_TEK.has(prevK) && prevBoundary && next && next.length > 0 && kaynakAyiriciOlabilir) {
        return { tip: 'isaret', baslik: 'Tek Harfli Kısaltma Ayırma İşareti', detay: 'Nokta 3. Tek harfli kısaltmadan sonra gelen ek/devamdan önce kullanılır.', noktaStr };
      }
    }

    // Tek harfli kısaltma kelime başında ek/devam alıyorsa ilk hücrenin
    // altında harfi değil, kısaltmanın açılımını göster (örn. can+sız, göre+ce).
    if (prevBosBuyuk && idx + 1 < hucreler.length && dotKey(hucreler[idx + 1]) === '3') {
      const kayit = KELIME_KISALTMALARI.find((m) => dotKey(m.noktalar) === k);
      if (kayit) {
        const kaynakKelime = _kaynakKelime(idx);
        const hedef = kayit.kelime.toLocaleLowerCase('tr');
        if (kaynakKelime === null || kaynakKelime === hedef || kaynakKelime.startsWith(hedef)) {
          const kel = kasala(kayit.kelime);
          return { tip: 'kisaltma', baslik: `Bir Harfli Kısaltma: "${kel}"`, detay: `"${kayit.harf}" harfi kelime başında "${kel}" kısaltmasını gösterir; ardından gelen nokta 3 ek/devam ayırıcısıdır.`, noktaStr, etiket: kel };
        }
      }
    }

    // Bu hücre bir parça kısaltmasının sag hücresi mi? (önceki hücre [4,5] veya [5,6])
    if (idx > 0) {
      const prevK = dotKey(hucreler[idx - 1]);
      if (prevK === '4,5' || prevK === '5,6') {
        const parca = _PARCA_MAP.get(prevK + '|' + k);
        if (parca) {
          const ek = kasala(parca.ekler);
          return { tip: 'kisaltma', baslik: `Kelime Parçası: "${ek}"`, detay: `[${prevK.replace(',', '·')}] + bu hücre → "${ek}" eki`, noktaStr, etiket: ek };
        }
      }
    }

    // İki harfli kısaltma: tam kelime veya kelime başında ek/devam almış prefix.
    // — bu hücre ikinci mi?
    if (idx > 0 && prevBosBuyuk === false) {
      const prevK = dotKey(hucreler[idx - 1]);
      const prevPrevIsSpace = idx < 2 || hucreler[idx - 2].length === 0 || buyukHarfIsaretiMi(hucreler[idx - 2]) || _isNoktalamaHucre(hucreler[idx - 2], idx - 2);
      if (prevPrevIsSpace) {
        const ikiKey = prevK + '|' + k;
        const iki = IKI_HARFLI_KISALTMALAR.find((m) => dotKey(m.sol) + '|' + dotKey(m.sag) === ikiKey);
        if (iki && _kaynakKelimeBaslar(idx, iki.kelime)) {
          const kel = kasala(iki.kelime);
          return { tip: 'kisaltma', baslik: `İki Harfli Kısaltma: "${kel}"`, detay: `"${iki.harf}" → "${kel}" (bu hücre ikinci)`, noktaStr, etiket: '' };
        }
      }
    }
    // — bu hücre birinci mi?
    if (idx + 1 < hucreler.length && nextIsSpace === false) {
      const nextK = dotKey(hucreler[idx + 1]);
      if (prevBosBuyuk) {
        const ikiKey = k + '|' + nextK;
        const iki = IKI_HARFLI_KISALTMALAR.find((m) => dotKey(m.sol) + '|' + dotKey(m.sag) === ikiKey);
        if (iki && _kaynakKelimeBaslar(idx, iki.kelime)) {
          const kel = kasala(iki.kelime);
          return { tip: 'kisaltma', baslik: `İki Harfli Kısaltma: "${kel}"`, detay: `"${iki.harf}" → "${kel}" (bu hücre birinci)`, noktaStr, etiket: kel };
        }
      }
    }

    // Hece kısaltması: kelime içinde de geçerli, ama noktalama/harf olarak zaten tanınıyorsa o öncelikli
    // Önce noktalama-hece çakışmasını pozisyona göre çöz:
    //  - Kelime başı + [2,3,6] → tırnak açma
    //  - Kelime sonu + çakışan desen → noktalama (encoder zaten HECE_SON_YASAK ile bunları hece olarak yazmaz)
    //  - [2,6] (?/ve) çakışması: kelime sonu + sonraki blok büyük harfle başlıyorsa "?", değilse "ve"
    const np = _NOKTA_TERS.get(k);
    const hece = _HECE_TERS.get(k);
    if (np) {
      const ilkHucre = prevIsSpace; // kelime başı
      const sonHucre = nextIsSpace; // kelime sonu
      // Bu hücreden sonra (boşluğa kadar) sadece noktalama hücreleri mi var?
      let kalanHepsiNoktalama = true;
      let kk = idx + 1;
      while (kk < hucreler.length && hucreler[kk].length > 0) {
        const kkA = dotKey(hucreler[kk]);
        if (!_NOKTA_TERS.has(kkA)) { kalanHepsiNoktalama = false; break; }
        kk++;
      }
      let noktalamaKullan = false;
      if (ilkHucre && k === '2,3,6') noktalamaKullan = true;
      else if (sonHucre || kalanHepsiNoktalama) {
        if (k === '2,6' && sonHucre) {
          let j = idx + 1;
          while (j < hucreler.length && hucreler[j].length === 0) j++;
          // Satır/metin sonu: sonraki blok yok → soru işareti
          noktalamaKullan = j >= hucreler.length || buyukHarfIsaretiMi(hucreler[j]);
        } else {
          noktalamaKullan = true;
        }
      }
      if (noktalamaKullan) {
        const np2 = parenSwap(np);
        return { tip: 'noktalama', baslik: `Noktalama: ${np2.isim} (${np2.isaret})`, detay: `Nokta ${noktaStr}`, noktaStr, isaret: np2.isaret };
      }
    }
    if (hece) {
      const h = kasala(hece);
      return { tip: 'kisaltma', baslik: `Hece Kısaltması: "${h}"`, detay: `Tek hücreyle "${h}" hecesini temsil eder.`, noktaStr, etiket: h };
    }

    // Kelime kısaltması (tek harfli): YALNIZCA tam kelimeyse (iki yanı boşluk)
    if (prevBosBuyuk && nextIsSpace) {
      const kelime = _KISALTMA_TEK.get(k);
      if (kelime) {
        const kaynakKelime = _kaynakKelime(idx);
        if (kaynakKelime === null || kaynakKelime === kelime.toLocaleLowerCase('tr')) {
          const harf = KELIME_KISALTMALARI.find((m) => dotKey(m.noktalar) === k)?.harf || '';
          const kel = kasala(kelime);
          return { tip: 'kisaltma', baslik: `Bir Harfli Kısaltma: "${kel}"`, detay: `"${harf}" harfi tek başına → "${kel}" kelimesi`, noktaStr, etiket: kel };
        }
      }
    }
  }

  // Noktalama?
  const np = _NOKTA_TERS.get(k);
  if (np) {
    const np2 = parenSwap(np);
    return { tip: 'noktalama', baslik: `Noktalama: ${np2.isim} (${np2.isaret})`, detay: `Nokta ${noktaStr}`, noktaStr, isaret: np2.isaret };
  }

  // Harf?
  const harf = hucreyiKarakteryap(noktalar);
  if (harf && harf !== ' ') {
    const goster = (buyukHarfBekle || tumKelimeBuyuk) ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
    return { tip: 'harf', baslik: `Harf: ${goster}`, detay: `Nokta ${noktaStr} → "${goster}" harfi`, noktaStr, harf: goster };
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
    // Sayfa ayraçlarını (\f) paragraf sınırı olarak kullan; satır sonları (\r\n) sadece görsel kaydırma → birleştir
    const sayfalar = icerik.split(/\f/);
    const sayfaCiktilari = [];
    for (const sayfa of sayfalar) {
      // Satırları birleştir (kelime ortasında bölünmüş olabilir → aralarına boşluk koyma)
      const duzMetin = sayfa.replace(/[\r\n]+/g, '');
      if (!duzMetin.trim()) continue;
      const hucreleri = [];
      for (const ch of duzMetin) {
        const n = brfNoktalaradon(ch);
        if (n !== null) hucreleri.push(n);
      }
      // Kelime bloklarına böl (boş hücre = boşluk)
      const cikis = [];
      const tumBloklar = [];
      let blok = [];
      for (const n of hucreleri) {
        if (n.length === 0) { tumBloklar.push(blok); blok = []; }
        else blok.push(n);
      }
      if (blok.length) tumBloklar.push(blok);

      const bloklariIsle = (bRaw, sonrakiIlkHucre) => {
        if (bRaw.length === 0) return;
        // Blok başındaki büyük harf işaretlerini ayır:
        //  [6][6] → tümü büyük (TÜM_BUYUK)
        //  [6]    → ilk harf büyük (ILK_BUYUK)
        let bashCase = 'normal';
        let b = bRaw;
        if (b.length >= 2 && buyukHarfIsaretiMi(b[0]) && buyukHarfIsaretiMi(b[1])) {
          bashCase = 'tumu'; b = b.slice(2);
        } else if (b.length >= 1 && buyukHarfIsaretiMi(b[0])) {
          bashCase = 'ilk'; b = b.slice(1);
        }
        if (b.length === 0) return;

        // Sonucu kasaya çevir
        const kasala = (s) => {
          if (!s) return s;
          if (bashCase === 'tumu') return s.toLocaleUpperCase('tr');
          if (bashCase === 'ilk') return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
          return s;
        };

        // 1) 2 hücre: iki harfli kısaltma? (kök/parça işareti değilse)
        const ilkKey = [...b[0]].sort((x,y)=>x-y).join(',');
        if (b.length === 2 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const a = ilkKey + '|' + [...b[1]].sort((a,b)=>a-b).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(kasala(_KISALTMA_IKI.get(a))); return; }
        }
        // 2) 1 hücre (sayı ve büyharf işareti değil): tek harfli kısaltma?
        if (b.length === 1) {
          const a = ilkKey;
          if (_KISALTMA_TEK.has(a)) { cikis.push(kasala(_KISALTMA_TEK.get(a))); return; }
        }
        // 3) Hece kısaltması bilinçli harf-harf çeviri — sonucu buffer'a yaz, en sonda kasala
        const buf = [];
        let ci = 0;
        let sM = false, bH = false, bHTumu = false;
        let ikiHarfPrefixIndex = -1;
        let kokPrefixIndex = -1;
        // Blok-başı kasası kelimenin tamamına uygulanacağı için iç çevirim küçük yapılır;
        // ama metin içi [6] (orta-blok) yine de aktif olmalı.
        if (bashCase === 'tumu') bHTumu = true;
        else if (bashCase === 'ilk') bH = true;
        // İki harfli kısaltma + ek/devam: kısaltma başta genişletilir,
        // kalan hücreler normal ek/devam olarak okunur.
        if (b.length >= 3 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const ikiKey = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(ikiKey)) {
            let ikiKelime = _KISALTMA_IKI.get(ikiKey);
            if (bHTumu) ikiKelime = ikiKelime.toLocaleUpperCase('tr');
            else if (bH) ikiKelime = ikiKelime.charAt(0).toLocaleUpperCase('tr') + ikiKelime.slice(1).toLocaleLowerCase('tr');
            buf.push(ikiKelime);
            ikiHarfPrefixIndex = buf.length - 1;
            bH = false;
            ci = 2;
          }
        }
        // Tek harfli kısaltma + [3] ayırma işareti + ek/devam.
        if (b.length >= 3 && _KISALTMA_TEK.has(ilkKey)) {
          const ikinciKey = [...b[1]].sort((x, y) => x - y).join(',');
          if (ikinciKey === '3') {
            let tek = _KISALTMA_TEK.get(ilkKey);
            if (bHTumu) tek = tek.toLocaleUpperCase('tr');
            else if (bH) tek = tek.charAt(0).toLocaleUpperCase('tr') + tek.slice(1).toLocaleLowerCase('tr');
            buf.push(tek);
            bH = false;
            ci = 2;
          }
        }
        const harfYaz = (h) => {
          if (!h) return;
          if (bHTumu) buf.push(h.toLocaleUpperCase('tr'));
          else if (bH) {
            // bH = sadece ilk karakter büyük; hece çok karakterli olabilir
            buf.push(h.charAt(0).toLocaleUpperCase('tr') + h.slice(1).toLocaleLowerCase('tr'));
            bH = false;
          }
          else buf.push(h.toLocaleLowerCase('tr'));
        };
        // Kök işareti başta: [5] + sag hücresi
        if (b.length >= 2 && ilkKey === '5') {
          const sagKey = [...b[1]].sort((x, y) => x - y).join(',');
          const kok = _KOK_SAG_MAP.get(sagKey);
          if (kok) {
            let kk = kok.kelime;
            if (bH) { kk = kk.charAt(0).toLocaleUpperCase('tr') + kk.slice(1); bH = false; }
            else if (bHTumu) kk = kk.toLocaleUpperCase('tr');
            buf.push(kk);
            kokPrefixIndex = buf.length - 1;
            ci = 2;
          }
        }
        while (ci < b.length) {
          const noktalar = b[ci];
          if (noktalar.length === 0) { buf.push(' '); sM = false; bH = false; bHTumu = false; ci++; continue; }
          if (sayiIsaretiMi(noktalar)) {
            const wordStart = ci === 0;
            const sonraki = ci + 1 < b.length ? b[ci + 1] : null;
            if (wordStart && sonraki && hucreyiRakamayap(sonraki)) { sM = true; ci++; continue; }
          }
          if (buyukHarfIsaretiMi(noktalar)) {
            if (ci + 1 < b.length && buyukHarfIsaretiMi(b[ci + 1])) { bHTumu = true; ci += 2; }
            else { bH = true; ci++; }
            continue;
          }
          if (sM) {
            const r = hucreyiRakamayap(noktalar);
            if (r) { buf.push(r); ci++; continue; }
            sM = false;
          }
          // Kelime parçası işareti: [4,5] veya [5,6] + sag hücresi
          if (ci + 1 < b.length) {
            const nKey = [...noktalar].sort((x, y) => x - y).join(',');
            if (nKey === '4,5' || nKey === '5,6') {
              const sagKey = [...b[ci + 1]].sort((x, y) => x - y).join(',');
              const parca = _PARCA_MAP.get(nKey + '|' + sagKey);
              if (parca) { buf.push(_unluUyumuSec(parca.ekler, buf.join(''))); ci += 2; continue; }
            }
          }
          // Noktalama-hece çakışması: pozisyona göre çöz
          const hA = [...noktalar].sort((a,b)=>a-b).join(',');
          const np = _NOKTA_TERS.get(hA);
          const heceKarsiligi = !sM ? _HECE_TERS.get(hA) : undefined;
          if (np && heceKarsiligi) {
            const ilkHucre = ci === 0;
            const sonHucre = ci === b.length - 1;
            let kalanHepsiNoktalama = true;
            for (let kk = ci + 1; kk < b.length; kk++) {
              const kkA = [...b[kk]].sort((a,b)=>a-b).join(',');
              if (!_NOKTA_TERS.has(kkA)) { kalanHepsiNoktalama = false; break; }
            }
            let noktalamaKullan = false;
            if (ilkHucre && hA === '2,3,6') noktalamaKullan = true;
            else if (sonHucre || kalanHepsiNoktalama) {
              if (hA === '2,6' && sonHucre) {
                noktalamaKullan = sonrakiIlkHucre == null || buyukHarfIsaretiMi(sonrakiIlkHucre);
              } else {
                noktalamaKullan = true;
              }
            }
            if (noktalamaKullan) buf.push(np.isaret);
            else harfYaz(heceKarsiligi);
          } else if (np) {
            buf.push(np.isaret);
          } else if (heceKarsiligi) {
            harfYaz(heceKarsiligi);
          } else {
            const h = hucreyiKarakteryap(noktalar);
            harfYaz(h);
          }
          ci++;
        }
        if (ikiHarfPrefixIndex >= 0) {
          const sonrakiMetin = buf.slice(ikiHarfPrefixIndex + 1).join('');
          buf[ikiHarfPrefixIndex] = ikiHarfliKisaltmaOkunusunuYumusat(buf[ikiHarfPrefixIndex], sonrakiMetin);
        }
        if (kokPrefixIndex >= 0) {
          const sonrakiMetin = buf.slice(kokPrefixIndex + 1).join('');
          buf[kokPrefixIndex] = kelimeKokuOkunusunuYorIcinDuzelt(buf[kokPrefixIndex], sonrakiMetin);
        }
        cikis.push(buf.join(''));
      };
      for (let bi = 0; bi < tumBloklar.length; bi++) {
        if (bi > 0) cikis.push(' ');
        const sonrakiIlkHucre = bi + 1 < tumBloklar.length ? (tumBloklar[bi + 1][0] ?? null) : null;
        bloklariIsle(tumBloklar[bi], sonrakiIlkHucre);
      }
      sayfaCiktilari.push(cikis.join(''));
    }
    return sayfaCiktilari.join('\n').trim();
  }

  // Normal mod (kısaltmasız)
  for (const satir of satirlar) {
    if (!satir.trim()) { metin += '\n'; continue; }
    let tumKelimeBuyuk = false;
    for (const ch of satir) {
      const noktalar = brfNoktalaradon(ch);
      if (noktalar === null) continue;
      if (noktalar.length === 0) {
        metin += ' ';
        sayiModu = false;
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        continue;
      }
      if (sayiIsaretiMi(noktalar)) { sayiModu = true; tumKelimeBuyuk = false; continue; }
      if (buyukHarfIsaretiMi(noktalar)) {
        if (buyukHarfBekle) { tumKelimeBuyuk = true; buyukHarfBekle = false; }
        else { buyukHarfBekle = true; }
        continue;
      }

      if (sayiModu) {
        const rakam = hucreyiRakamayap(noktalar);
        if (rakam) { metin += rakam; continue; }
        sayiModu = false; // sayı bloğu bitti
      }

      const harf = hucreyiKarakteryap(noktalar);
      if (harf) {
        const buyuk = buyukHarfBekle || tumKelimeBuyuk;
        metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
      } else {
        tumKelimeBuyuk = false;
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

  // Hangi kısaltma sistemleri aktif
  const SISTEM_VARSAYILAN = { hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true };
  const [kisaltmaSistemler, setKisaltmaSistemler] = useState(() => {
    const saved = localStorage.getItem('araclarKisaltmaSistemler');
    if (!saved) return { ...SISTEM_VARSAYILAN };
    try { return { ...SISTEM_VARSAYILAN, ...JSON.parse(saved) }; } catch { return { ...SISTEM_VARSAYILAN }; }
  });
  const [sistemPaneli, setSistemPaneli] = useState(false);
  const sistemPaneliRef = useRef(null);

  const sistemToggle = (key) => setKisaltmaSistemler((prev) => {
    const yeni = { ...prev, [key]: !prev[key] };
    localStorage.setItem('araclarKisaltmaSistemler', JSON.stringify(yeni));
    return yeni;
  });

  // Panel dışına tıklandığında kapat
  useEffect(() => {
    if (!sistemPaneli) return;
    const handle = (e) => {
      if (sistemPaneliRef.current && !sistemPaneliRef.current.contains(e.target))
        setSistemPaneli(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [sistemPaneli]);
  const [konusuyor, setKonusuyor] = useState(false); // 'metin' | 'nokta' | false
  const [seciliHucre, setSeciliHucre] = useState(null); // { index, anlam }
  const [genisletAktif, setGenisletAktif] = useState(false);
  const [brailleSayfa, setBrailleSayfa] = useState(0);
  const [sayfaInput, setSayfaInput] = useState('');
  const brailleKutuRef = useRef(null);

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
  const cevirFn = kisaltmaAktif
    ? (m, o) => metniBrailleyeCevirKisaltmali(tekHarfTirnakla(m), { ...o, ...kisaltmaSistemler })
    : metniBrailleyeCevir;

  // Önbellekli hücre dizisi (sayfalama + render için)
  const cevirSonuc = useMemo(() => {
    if (!girisMetni) return { hucreler: [], esleme: [], kaynak: '' };
    const kaynak = kisaltmaAktif ? tekHarfTirnakla(girisMetni) : girisMetni;
    const r = cevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
    return { hucreler: r.hucreler, esleme: r.esleme, kaynak };
  }, [girisMetni, kisaltmaAktif, kisaltmaSistemler]);
  const hucrelerCache = cevirSonuc.hucreler;
  const eslemeCache = cevirSonuc.esleme;
  const kaynakCache = cevirSonuc.kaynak;

  const toplamSayfa = Math.max(1, Math.ceil(hucrelerCache.length / BRAILLE_SAYFA_BOYUTU));
  const sayfaBaslangic = brailleSayfa * BRAILLE_SAYFA_BOYUTU;
  const sayfaHucreler = hucrelerCache.slice(sayfaBaslangic, sayfaBaslangic + BRAILLE_SAYFA_BOYUTU);

  // Sayfa sınır kontrolleri ve seçim temizleme
  useEffect(() => { setSeciliHucre(null); }, [brailleSayfa, kisaltmaAktif, girisMetni]);
  useEffect(() => {
    if (brailleSayfa >= toplamSayfa) setBrailleSayfa(0);
  }, [toplamSayfa, brailleSayfa]);

  const jpgIndir = useCallback(async () => {
    const el = brailleKutuRef.current;
    if (!el) return;
    el.classList.add('jpg-export');
    const oncekiOverflowY = el.style.overflowY;
    const oncekiMaxH = el.style.maxHeight;
    const oncekiH = el.style.height;
    el.style.overflowY = 'visible';
    el.style.maxHeight = 'none';
    el.style.height = 'auto';
    await new Promise((r) => requestAnimationFrame(() => r()));
    const w = el.scrollWidth;
    const h = el.scrollHeight;
    try {
      const dataUrl = await toJpeg(el, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        width: w,
        height: h,
        style: { width: w + 'px', height: h + 'px' },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `braille-sayfa-${brailleSayfa + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('JPG indirme hatası:', e);
    } finally {
      el.classList.remove('jpg-export');
      el.style.overflowY = oncekiOverflowY;
      el.style.maxHeight = oncekiMaxH;
      el.style.height = oncekiH;
    }
  }, [brailleSayfa]);

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
      const kaynakMetin = kisaltmaAktif ? tekHarfTirnakla(girisMetni) : girisMetni;
      const { hucreler, esleme } = cevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
      const parcalar = [];
      for (let i = 0; i < hucreler.length; i++) {
        const n = hucreler[i];
        const kaynak = esleme[i];
        if (n.length === 0) { parcalar.push('boşluk'); continue; }
        const noktaMetni = n.join(' ');
        if (kisaltmaAktif) {
          const anlam = hucreAnlami(hucreler, i, true, { kaynak: kaynakMetin, esleme });
          if (anlam.tip === 'isaret') {
            parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik}`);
            continue;
          }
          if (anlam.tip === 'kisaltma') {
            parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik.replace(/"/g, '')}`);
            continue;
          }
        }
        const harfMetni = kaynak >= 0 ? kaynakMetin[kaynak] : '';
        parcalar.push(harfMetni ? `${harfMetni}: ${noktaMetni}` : `nokta ${noktaMetni}`);
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
                onChange={(e) => metinTirnakliGuncelle(e.target.value, girisMetni, e.target, kisaltmaAktif, setGirisMetni)}
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
            {girisMetni && (
              <div className="araclar-nokta-sarici">
                <div ref={brailleKutuRef} className={'araclar-nokta-gorunus belge-braille-kutu' + (genisletAktif ? ' genisletilmis' : '')} aria-label="Braille nokta görünümü">
                  {sayfaHucreler.map((noktalar, i) => {
                    const globalIdx = sayfaBaslangic + i;
                    const anlam = hucreAnlami(hucrelerCache, globalIdx, kisaltmaAktif, { kaynak: kaynakCache, esleme: eslemeCache });
                    const kisaltmaHucre = kisaltmaAktif && (
                      anlam.tip === 'kisaltma' ||
                      (anlam.tip === 'isaret' && (
                        anlam.baslik === 'Kelime Kökü İşareti' ||
                        anlam.baslik === 'Kelime Parçası İşareti'
                      ))
                    );
                    const noktalamaHucre = anlam.tip === 'noktalama';
                    const ozelIsaretHucre = anlam.tip === 'isaret' && !kisaltmaHucre;
                    const sinif = 'belge-braille-hucre' +
                      (seciliHucre?.index === globalIdx ? ' secili' : '') +
                      (kisaltmaHucre ? ' kisaltma-hucre' : '') +
                      (noktalamaHucre ? ' noktalama-hucre' : '') +
                      (ozelIsaretHucre ? ' ozel-isaret-hucre' : '');
                    const etiket = genisletAktif ? kisaEtiket(anlam) : '';
                    return (
                      <div
                        key={globalIdx}
                        className={sinif}
                        role="button"
                        tabIndex={0}
                        title="Tıkla: anlam göster"
                        onClick={() => {
                          setSeciliHucre(seciliHucre?.index === globalIdx ? null : { index: globalIdx, anlam });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSeciliHucre(seciliHucre?.index === globalIdx ? null : { index: globalIdx, anlam });
                          }
                        }}
                      >
                        <BrailleCell aktifNoktalar={noktalar} tiklanabilir={false} kesfedilebilir={false} />
                        {genisletAktif && (
                          <div className="belge-hucre-etiket" aria-hidden="true">{etiket || '\u00A0'}</div>
                        )}
                      </div>
                    );
                  })}
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

                <div className="belge-braille-altbar">
                  <span className="belge-altbar-sol" />
                  {toplamSayfa > 1 ? (
                    <div className="belge-braille-sayfalama">
                      <button
                        type="button"
                        className="belge-sayfa-btn"
                        onClick={() => setBrailleSayfa((p) => Math.max(0, p - 1))}
                        disabled={brailleSayfa === 0}
                        aria-label="Önceki sayfa"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                      </button>
                      <form
                        className="belge-sayfa-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const n = parseInt(sayfaInput, 10);
                          if (!isNaN(n) && n >= 1 && n <= toplamSayfa) setBrailleSayfa(n - 1);
                          setSayfaInput('');
                        }}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          className="belge-sayfa-input"
                          value={sayfaInput}
                          placeholder={String(brailleSayfa + 1)}
                          onChange={(e) => setSayfaInput(e.target.value.replace(/\D/g, ''))}
                          onBlur={() => {
                            const n = parseInt(sayfaInput, 10);
                            if (!isNaN(n) && n >= 1 && n <= toplamSayfa) setBrailleSayfa(n - 1);
                            setSayfaInput('');
                          }}
                          aria-label="Sayfa numarasına git"
                        />
                        <span className="belge-sayfa-toplam">/ {toplamSayfa}</span>
                      </form>
                      <button
                        type="button"
                        className="belge-sayfa-btn"
                        onClick={() => setBrailleSayfa((p) => Math.min(toplamSayfa - 1, p + 1))}
                        disabled={brailleSayfa === toplamSayfa - 1}
                        aria-label="Sonraki sayfa"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    </div>
                  ) : <span />}
                  <div className="belge-altbar-sag">
                    <button
                      type="button"
                      className={'belge-genislet-btn' + (genisletAktif ? ' aktif' : '')}
                      onClick={() => setGenisletAktif((v) => !v)}
                      aria-pressed={genisletAktif}
                      aria-label={genisletAktif ? 'Etiketleri gizle (Daralt)' : 'Hücre altlarına etiket göster (Genişlet)'}
                      title={genisletAktif ? 'Daralt' : 'Genişlet'}
                    >
                      {genisletAktif ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                          <polyline points="4 14 10 14 10 20"/>
                          <polyline points="20 10 14 10 14 4"/>
                          <line x1="14" y1="10" x2="21" y2="3"/>
                          <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                          <polyline points="15 3 21 3 21 9"/>
                          <polyline points="9 21 3 21 3 15"/>
                          <line x1="21" y1="3" x2="14" y2="10"/>
                          <line x1="3" y1="21" x2="10" y2="14"/>
                        </svg>
                      )}
                    </button>
                    <button
                      type="button"
                      className="belge-genislet-btn belge-jpg-btn"
                      onClick={jpgIndir}
                      aria-label="Sayfayı JPG olarak indir"
                      title="JPG indir"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                           strokeLinecap="round" strokeLinejoin="round" width="16" height="16" aria-hidden="true">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
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
            )}
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
            <div className="kisaltma-btn-grup" ref={sistemPaneliRef}>
              <button
                type="button"
                className={'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}
                onClick={() => setKisaltmaAktif((v) => !v)}
                aria-pressed={kisaltmaAktif}
                aria-label={'Kısaltma ' + (kisaltmaAktif ? 'Aktif' : 'Kapalı')}
                style={{ borderRadius: 'var(--radius) 0 0 var(--radius)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>
                <span className="btn-yazi">Kısaltma</span>
              </button>
              <button
                type="button"
                className={'kisaltma-sistem-acilis-btn araclar-perkins-btn' + (kisaltmaAktif && sistemPaneli ? ' aktif' : '') + (kisaltmaAktif ? '' : ' disabled')}
                onClick={() => kisaltmaAktif && setSistemPaneli((v) => !v)}
                aria-expanded={sistemPaneli}
                aria-label="Kısaltma sistemleri"
                title="Hangi kısaltma sistemleri aktif?"
                style={{ borderRadius: '0 var(--radius) var(--radius) 0' }}
              >▾</button>
              {kisaltmaAktif && sistemPaneli && (
                <div className="kisaltma-sistem-panel" role="menu">
                  <p className="kisaltma-sistem-panel-baslik">Kısaltma Sistemleri</p>
                  {[
                    { key: 'hece',    label: 'Hece Kısaltmaları' },
                    { key: 'birHarf', label: 'Bir Harfli Kısaltmalar' },
                    { key: 'ikiHarf', label: 'İki Harfli Kısaltmalar' },
                    { key: 'kok',     label: 'Kelime Kökü Kısaltmaları' },
                    { key: 'parca',   label: 'Kelime Parçası Kısaltmaları' },
                  ].map(({ key, label }) => (
                    <label key={key} className="kisaltma-sistem-satir">
                      <input
                        type="checkbox"
                        checked={kisaltmaSistemler[key]}
                        onChange={() => sistemToggle(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
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

      {/* Yatay mobilde Modül 2'deki tam ekran Perkins klavye görünümü */}
      {perkinsAktif && (
        <div className="klavye-popup" role="dialog" aria-label="Braille ekran klavyesi">
          <BrailleKlavye
            onHucre={onHucre}
            onBosluk={onBosluk}
            onSil={onSil}
            onEnter={brfIndir}
            klavyeAcik={false}
            siralikTiklama
          />
        </div>
      )}
    </div>
  );
}
