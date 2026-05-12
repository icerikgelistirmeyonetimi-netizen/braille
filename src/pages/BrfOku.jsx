import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { toJpeg } from 'html-to-image';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import { hucreAnlami } from './Araclar.jsx';
import { kisaEtiket } from './BelgeBrf.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import {
  metniBrailleyeCevir,
  metniBrailleyeCevirKisaltmali,
  hucreyiKarakteryap,
  hucreyiRakamayap,
  hucreyiSiraSayisiRakaminaCevir,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
  tekKucukHarfIsaretiMi,
  tarihAyirmaIsaretiMi,
  tarihHucreAraligi,
  duzeltmeYabanciHarfIsaretiMi,
  duzeltmeliHucreyiMetneCevir,
  ikiHarfliKisaltmaOkunusunuYumusat,
  kelimeKokuOkunusunuYorIcinDuzelt,
  matematikIsaretiSayiModunuKorurMu,
  matematikSembolHucreEslesmesi,
  noktalariAnahtara,
  siraSayisiSonRakamEtiketiNoktaEki,
} from '../utils/brailleCevir.js';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA,
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

const _KOK_SAG_MAP = new Map(
  KELIME_KOKU_KISALTMALARI.map((k) => [
    [...k.sag].sort((a, b) => a - b).join(','),
    k,
  ])
);

const _PARCA_MAP = new Map(
  KELIME_PARCASI_KISALTMALARI.map((p) => [
    [...p.sol].sort((a, b) => a - b).join(',') + '|' + [...p.sag].sort((a, b) => a - b).join(','),
    p,
  ])
);

const _NOKTA_TERS = new Map(
  NOKTALAMA.map((n) => [
    [...n.noktalar].sort((a, b) => a - b).join(','),
    n.isaret,
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

// ─── BRF → Metin dönüşümü ─────────────────────────────────────────────────
function _brfMetinedon(icerik, kisaltmali, sistemler = {}) {
  const {
    hece: heceAktif = true,
    birHarf: birHarfAktif = true,
    ikiHarf: ikiHarfAktif = true,
    kok: kokAktif = true,
    parca: parcaAktif = true,
  } = sistemler;
  const satirlar = icerik.split(/[\r\n\f]+/);
  let metin = '';
  let sayiModu = false;
  let siraSayiModu = false;
  let ciftListeVirgulle = false;
  let cListeSonTekIsaretSonrasi = false;
  let buyukHarfBekle = false;
  const noktalamaHucreMi = (hucre) => !!hucre && _NOKTA_TERS.has(noktalariAnahtara(hucre));
  const matematikSayiSinirAnahtarlari = new Set([
    '1,2,6',
    '3,4,5',
    '3,4',
    '1,3,4,5,6',
    '1,3,5',
    '2,4,6',
    '2,3,5,6',
  ]);
  const sayiIsaretiOncesiSinirMi = (hucre) => (
    !hucre
    || hucre.length === 0
    || buyukHarfIsaretiMi(hucre)
    || noktalamaHucreMi(hucre)
    || matematikSayiSinirAnahtarlari.has(noktalariAnahtara(hucre))
  );
  const harfliSayiHarfOku = (hucreler, index) => {
    if (index < 0 || index >= hucreler.length || !tekKucukHarfIsaretiMi(hucreler[index])) return null;
    let harfIndex = index + 1;
    let buyuk = false;
    if (harfIndex < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIndex])) {
      buyuk = true;
      harfIndex++;
    }
    if (harfIndex >= hucreler.length) return null;
    const harf = hucreyiKarakteryap(hucreler[harfIndex]);
    if (!harf || harf === ' ') return null;
    return {
      metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
      sonrakiIndex: harfIndex + 1,
    };
  };
  if (kisaltmali) {
    // Sayfa ayraçlarını (\f) paragraf sınırı; satır sonları (\r\n) kelime ortasında olabilir → birleştir
    const sayfalar = icerik.split(/\f/);
    const sayfaCiktilari = [];
    for (const sayfa of sayfalar) {
      const duzMetin = sayfa.replace(/[\r\n]+/g, '');
      if (!duzMetin.trim()) continue;
      const hucreleri = [];
      for (const ch of duzMetin) {
        const n = brfNoktalaradon(ch);
        if (n !== null) hucreleri.push(n);
      }
      const cikis = [];
      // Önce tüm kelimeleri blok olarak topla (sonraki bloğa bakabilmek için)
      const tumBloklar = [];
      let blok = [];
      for (const n of hucreleri) {
        if (n.length === 0) { tumBloklar.push(blok); blok = []; }
        else blok.push(n);
      }
      if (blok.length) tumBloklar.push(blok);

      const bloklariIsle = (bRaw, sonrakiIlkHucre) => {
        if (bRaw.length === 0) return;
        // Blok başındaki büyük harf işaretini ayır:
        //  [6][6] → tüm kelime büyük (TÜM_BUYUK)
        //  [6]    → ilk harf büyük (ILK_BUYUK)
        // Böylece kalan kısmı kısaltma testleri tam-kelime olarak görür.
        let bashCase = 'normal';
        let b = bRaw;
        if (b.length >= 2 && buyukHarfIsaretiMi(b[0]) && buyukHarfIsaretiMi(b[1])) {
          bashCase = 'tumu'; b = b.slice(2);
        } else if (b.length >= 1 && buyukHarfIsaretiMi(b[0])) {
          bashCase = 'ilk'; b = b.slice(1);
        }
        if (b.length === 0) return;
        const kasala = (s) => {
          if (!s) return s;
          if (bashCase === 'tumu') return s.toLocaleUpperCase('tr');
          if (bashCase === 'ilk') return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
          return s;
        };

        const ilkKey = [...b[0]].sort((x, y) => x - y).join(',');
        // Bir harfli tam kelime kısaltması
        if (birHarfAktif && b.length === 1) {
          if (_KISALTMA_TEK.has(ilkKey)) { cikis.push(kasala(_KISALTMA_TEK.get(ilkKey))); return; }
        }
        // İki harfli tam kelime kısaltması (kök/parça işareti değilse)
        if (ikiHarfAktif && b.length === 2 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const a = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(kasala(_KISALTMA_IKI.get(a))); return; }
        }
        // Bu noktadan sonraki çıktı buf'a yazılır, en sonda kasala uygulanır
        const buf = [];
        let ci = 0;
        // bashCase'i harfYaz akışına aktar: kısaltma eşleşmezse harf-harf yolda büyük harf korunur
        let sM = false, siraSM = false, bH = (bashCase === 'ilk'), bHTumu = (bashCase === 'tumu');
        let ciftListeVirgulle = false;
        let cListeSonTekIsaretSonrasi = false;
        let duzeltmeBekle = false;
        let ikiHarfPrefixIndex = -1;
        let kokPrefixIndex = -1;
        // İki harfli kısaltma + ek/devam: kısaltma başta genişletilir,
        // kalan hücreler normal ek/devam olarak okunur.
        if (ikiHarfAktif && b.length >= 3 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
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
        // Bir harfli kısaltma + [3] ayırma işareti + ek/devam.
        // Metin -> BRF tarafı "zaman+kinden", "var+dı", "şey+i" gibi
        // ekli kullanımları [kısaltma] [3] [devam] biçiminde yazar.
        if (birHarfAktif && b.length >= 3 && ci === 0 && _KISALTMA_TEK.has(ilkKey)) {
          const ikinciKey = [...b[1]].sort((x, y) => x - y).join(',');
          if (ikinciKey === '3') {
            let tekKelime = _KISALTMA_TEK.get(ilkKey);
            if (bHTumu) tekKelime = tekKelime.toLocaleUpperCase('tr');
            else if (bH) tekKelime = tekKelime.charAt(0).toLocaleUpperCase('tr') + tekKelime.slice(1).toLocaleLowerCase('tr');
            buf.push(tekKelime);
            bH = false;
            ci = 2;
          }
        }
        // Kök işareti başta: [5] + sag hücresi
        if (kokAktif && b.length >= 2 && ilkKey === '5') {
          const sagKey = [...b[1]].sort((x, y) => x - y).join(',');
          const kok = _KOK_SAG_MAP.get(sagKey);
          if (kok) {
            // bashCase'i kök kelimesine uygula (ilk harfYaz benzeri)
            let kk = kok.kelime;
            if (bashCase === 'tumu') kk = kk.toLocaleUpperCase('tr');
            else if (bashCase === 'ilk') kk = kk.charAt(0).toLocaleUpperCase('tr') + kk.slice(1);
            buf.push(kk);
            kokPrefixIndex = buf.length - 1;
            // bashCase tüketildi (kalan harfler küçük kalsın)
            if (bashCase === 'ilk') { bashCase = 'normal'; bH = false; }
            ci = 2;
          }
        }
        // Karakter döngüsü (kalan hücreler)
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
        const tekHarfIsaretliOku = (cellIndex) => {
          if (cellIndex !== 0 || !tekKucukHarfIsaretiMi(b[cellIndex])) return null;
          let harfIndex = cellIndex + 1;
          let buyuk = false;
          if (harfIndex < b.length && buyukHarfIsaretiMi(b[harfIndex])) {
            buyuk = true;
            harfIndex++;
          }
          if (harfIndex >= b.length) return null;
          const harf = hucreyiKarakteryap(b[harfIndex]);
          if (!harf || harf === ' ') return null;
          const sonraki = harfIndex + 1 < b.length ? b[harfIndex + 1] : null;
          if (sonraki && !_NOKTA_TERS.has([...sonraki].sort((a, b) => a - b).join(','))) return null;
          return {
            metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
            sonrakiIndex: harfIndex + 1,
          };
        };
        while (ci < b.length) {
          const noktalar = b[ci];
          const islemIsareti = matematikSembolHucreEslesmesi(b, ci);
          if (islemIsareti) {
            buf.push(islemIsareti.sembol);
            sM = sM && matematikIsaretiSayiModunuKorurMu(islemIsareti);
            siraSM = false;
            bH = false;
            bHTumu = false;
            if (!sM) {
              ciftListeVirgulle = false;
              cListeSonTekIsaretSonrasi = false;
            }
            ci += islemIsareti.hucreler.length;
            continue;
          }
          const tekHarf = !sM ? tekHarfIsaretliOku(ci) : null;
          if (tekHarf) {
            buf.push(tekHarf.metin);
            ci = tekHarf.sonrakiIndex;
            continue;
          }
          if (duzeltmeBekle) {
            harfYaz(duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar));
            duzeltmeBekle = false;
            ci++;
            continue;
          }
          if (duzeltmeYabanciHarfIsaretiMi(noktalar)) {
            duzeltmeBekle = true;
            ci++;
            continue;
          }
          if (noktalar.length === 0) {
            buf.push(' ');
            sM = false;
            siraSM = false;
            bH = false;
            bHTumu = false;
            ciftListeVirgulle = false;
            cListeSonTekIsaretSonrasi = false;
            ci++;
            continue;
          }
          if (sayiIsaretiMi(noktalar)) {
            const sonraki = ci + 1 < b.length ? b[ci + 1] : null;
            if (sonraki && sayiIsaretiMi(sonraki)) {
              ci += 2;
              sM = true;
              siraSM = false;
              ciftListeVirgulle = true;
              cListeSonTekIsaretSonrasi = false;
              continue;
            }
            const sonrakDigit = sonraki && hucreyiRakamayap(sonraki);
            const sonrakSira = sonraki && hucreyiSiraSayisiRakaminaCevir(sonraki);
            const sonrakHarfliSayi = harfliSayiHarfOku(b, ci + 1);
            const onceki = ci > 0 ? b[ci - 1] : null;
            if ((sayiIsaretiOncesiSinirMi(onceki) || ciftListeVirgulle) && (sonrakDigit || sonrakSira || sonrakHarfliSayi)) {
              if (ciftListeVirgulle) {
                ciftListeVirgulle = false;
                cListeSonTekIsaretSonrasi = true;
              }
              sM = true;
              siraSM = !!sonrakSira && !sonrakDigit;
              ci++;
              continue;
            }
            // değilse: aşağıdaki hece tablosu yakalayacak ("ki")
          }
          if (buyukHarfIsaretiMi(noktalar)) {
            // Yan yana iki [6] → tüm kelime büyük
            if (ci + 1 < b.length && buyukHarfIsaretiMi(b[ci + 1])) {
              bHTumu = true; ci += 2;
            } else {
              bH = true; ci++;
            }
            continue;
          }
          if (sM) {
            const harfliSayiHarf = !siraSM ? harfliSayiHarfOku(b, ci) : null;
            if (harfliSayiHarf) {
              buf.push(harfliSayiHarf.metin);
              ci = harfliSayiHarf.sonrakiIndex;
              continue;
            }
            const r = hucreyiRakamayap(noktalar);
            if (!siraSM && r) { buf.push(r); ci++; continue; }
            const kVirgulMu = [...noktalar].sort((x, y) => x - y).join(',') === '2';
            if (!siraSM && kVirgulMu && ciftListeVirgulle) {
              buf.push(',');
              ci++;
              continue;
            }
            if (
              !siraSM
              &&
              kVirgulMu
              && !ciftListeVirgulle
              && ci + 1 < b.length
              && hucreyiRakamayap(b[ci + 1])
            ) {
              buf.push(',');
              ci++;
              continue;
            }
            let sia = ci;
            let siraTxt = '';
            while (siraSM && sia < b.length) {
              const sr = hucreyiSiraSayisiRakaminaCevir(b[sia]);
              if (!sr) break;
              siraTxt += sr;
              sia++;
            }
            if (siraTxt.length > 0) {
              buf.push(siraTxt);
              const sn = sia < b.length ? b[sia] : null;
              const kesmeMi = sn && noktalariAnahtara(sn) === '3';
              if (!kesmeMi) buf.push('.');
              sM = false;
              siraSM = false;
              ci = sia;
              continue;
            }
            if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(b, ci)) { buf.push('.'); ci++; continue; }
            if (
              !siraSM
              && tarihAyirmaIsaretiMi(noktalar)
              && ci + 1 < b.length
              && hucreyiRakamayap(b[ci + 1])
            ) {
              buf.push('-');
              ci++;
              continue;
            }
            const sayiIciNoktalama = !siraSM ? _NOKTA_TERS.get(noktalariAnahtara(noktalar)) : null;
            if (sayiIciNoktalama) {
              buf.push(sayiIciNoktalama);
              ci++;
              continue;
            }
            sM = false;
            siraSM = false;
            if (cListeSonTekIsaretSonrasi) {
              cListeSonTekIsaretSonrasi = false;
              ciftListeVirgulle = false;
            }
          }
          // Kelime parçası işareti: [4,5] veya [5,6] + sag hücresi
          if (parcaAktif && ci + 1 < b.length) {
            const nKey = [...noktalar].sort((x, y) => x - y).join(',');
            if (nKey === '4,5' || nKey === '5,6') {
              const sagKey = [...b[ci + 1]].sort((x, y) => x - y).join(',');
              const parca = _PARCA_MAP.get(nKey + '|' + sagKey);
              if (parca) { buf.push(_unluUyumuSec(parca.ekler, buf.join(''))); ci += 2; continue; }
            }
          }
          const hA = [...noktalar].sort((a, b) => a - b).join(',');
          const np = _NOKTA_TERS.get(hA);
          const heceKarsiligi = heceAktif && !sM ? _HECE_TERS.get(hA) : undefined;
          if (np && heceKarsiligi) {
            // Noktalama-hece çakışması: pozisyona göre çöz
            const ilkHucre = ci === 0;
            const sonHucre = ci === b.length - 1;
            let kalanHepsiNoktalama = true;
            for (let kk = ci + 1; kk < b.length; kk++) {
              const kkA = [...b[kk]].sort((a, b) => a - b).join(',');
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
            if (noktalamaKullan) buf.push(np);
            else harfYaz(heceKarsiligi);
          } else if (np) {
            buf.push(np);
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

  for (const satir of satirlar) {
    if (!satir.trim()) {
      metin += '\n';
      sayiModu = false;
      siraSayiModu = false;
      ciftListeVirgulle = false;
      cListeSonTekIsaretSonrasi = false;
      continue;
    }
    let tumKelimeBuyuk = false;
    let duzeltmeBekle = false;
    const satirHucreleri = Array.from(satir)
      .map((ch) => brfNoktalaradon(ch))
      .filter((noktalar) => noktalar !== null);
    const tekHarfIsaretliOku = (cellIndex) => {
      if (!tekKucukHarfIsaretiMi(satirHucreleri[cellIndex])) return null;
      let harfIndex = cellIndex + 1;
      let buyuk = false;
      if (harfIndex < satirHucreleri.length && buyukHarfIsaretiMi(satirHucreleri[harfIndex])) {
        buyuk = true;
        harfIndex++;
      }
      if (harfIndex >= satirHucreleri.length) return null;
      const harf = hucreyiKarakteryap(satirHucreleri[harfIndex]);
      if (!harf || harf === ' ') return null;
      return {
        metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
        sonrakiIndex: harfIndex,
      };
    };
    for (let hi = 0; hi < satirHucreleri.length; hi++) {
      const noktalar = satirHucreleri[hi];
      if (noktalar.length === 0) {
        metin += ' '; sayiModu = false; siraSayiModu = false;
        ciftListeVirgulle = false;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false; tumKelimeBuyuk = false; duzeltmeBekle = false; continue;
      }
      const islemIsareti = matematikSembolHucreEslesmesi(satirHucreleri, hi);
      if (islemIsareti) {
        metin += islemIsareti.sembol;
        hi += islemIsareti.hucreler.length - 1;
        sayiModu = sayiModu && matematikIsaretiSayiModunuKorurMu(islemIsareti);
        siraSayiModu = false;
        if (!sayiModu) {
          ciftListeVirgulle = false;
          cListeSonTekIsaretSonrasi = false;
        }
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        duzeltmeBekle = false;
        continue;
      }
      const tekHarf = !sayiModu ? tekHarfIsaretliOku(hi) : null;
      if (tekHarf) {
        metin += tekHarf.metin;
        hi = tekHarf.sonrakiIndex;
        sayiModu = false;
        siraSayiModu = false;
        ciftListeVirgulle = false;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false;
        continue;
      }
      if (duzeltmeBekle) {
        const harf = duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar);
        if (harf) {
          const buyuk = buyukHarfBekle || tumKelimeBuyuk;
          metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        }
        duzeltmeBekle = false;
        buyukHarfBekle = false;
        continue;
      }
      if (duzeltmeYabanciHarfIsaretiMi(noktalar)) { duzeltmeBekle = true; continue; }
      if (sayiIsaretiMi(noktalar)) {
        const sonra3456 = hi + 1 < satirHucreleri.length && sayiIsaretiMi(satirHucreleri[hi + 1]);
        if (sonra3456) {
          hi++;
          ciftListeVirgulle = true;
          cListeSonTekIsaretSonrasi = false;
          sayiModu = true;
          siraSayiModu = false;
          tumKelimeBuyuk = false;
          continue;
        }
        const sonrakiHucre = hi + 1 < satirHucreleri.length ? satirHucreleri[hi + 1] : null;
        const sonrakRakam = sonrakiHucre && hucreyiRakamayap(sonrakiHucre);
        const sonrakSira = sonrakiHucre && hucreyiSiraSayisiRakaminaCevir(sonrakiHucre);
        const sonrakHarfliSayi = harfliSayiHarfOku(satirHucreleri, hi + 1);
        const oncekiHucre = hi > 0 ? satirHucreleri[hi - 1] : null;
        if (!sayiIsaretiOncesiSinirMi(oncekiHucre) && !ciftListeVirgulle) {
          const harf = hucreyiKarakteryap(noktalar);
          if (harf) metin += harf;
          continue;
        }
        if (ciftListeVirgulle) {
          cListeSonTekIsaretSonrasi = true;
        }
        sayiModu = true;
        siraSayiModu = !!sonrakSira && !sonrakRakam && !sonrakHarfliSayi;
        tumKelimeBuyuk = false;
        continue;
      }
      if (buyukHarfIsaretiMi(noktalar)) {
        if (buyukHarfBekle) { tumKelimeBuyuk = true; buyukHarfBekle = false; }
        else { buyukHarfBekle = true; }
        continue;
      }
      if (sayiModu) {
        const harfliSayiHarf = !siraSayiModu ? harfliSayiHarfOku(satirHucreleri, hi) : null;
        if (harfliSayiHarf) {
          metin += harfliSayiHarf.metin;
          hi = harfliSayiHarf.sonrakiIndex - 1;
          continue;
        }
        const rakam = hucreyiRakamayap(noktalar);
        if (!siraSayiModu && rakam) { metin += rakam; continue; }
        const kVirgulMu = [...noktalar].sort((a, b) => a - b).join(',') === '2';
        if (!siraSayiModu && kVirgulMu && ciftListeVirgulle) {
          metin += ',';
          continue;
        }
        if (
          !siraSayiModu
          &&
          kVirgulMu
          && !ciftListeVirgulle
          && hi + 1 < satirHucreleri.length
          && hucreyiRakamayap(satirHucreleri[hi + 1])
        ) {
          metin += ',';
          continue;
        }
        let siraI = hi;
        let siraMetin = '';
        while (siraSayiModu && siraI < satirHucreleri.length) {
          const sr = hucreyiSiraSayisiRakaminaCevir(satirHucreleri[siraI]);
          if (!sr) break;
          siraMetin += sr;
          siraI++;
        }
        if (siraMetin.length > 0) {
          metin += siraMetin;
          const sono = siraI < satirHucreleri.length ? satirHucreleri[siraI] : null;
          const kesmeMi = sono && noktalariAnahtara(sono) === '3';
          if (!kesmeMi) metin += '.';
          sayiModu = false;
          siraSayiModu = false;
          hi = siraI - 1;
          continue;
        }
        if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(satirHucreleri, hi)) { metin += '.'; continue; }
        if (
          !siraSayiModu
          && tarihAyirmaIsaretiMi(noktalar)
          && hi + 1 < satirHucreleri.length
          && hucreyiRakamayap(satirHucreleri[hi + 1])
        ) {
          metin += '-';
          continue;
        }
        const sayiIciNoktalama = !siraSayiModu ? _NOKTA_TERS.get(noktalariAnahtara(noktalar)) : null;
        if (sayiIciNoktalama) {
          metin += sayiIciNoktalama;
          continue;
        }
        sayiModu = false;
        siraSayiModu = false;
        if (cListeSonTekIsaretSonrasi) {
          cListeSonTekIsaretSonrasi = false;
          ciftListeVirgulle = false;
        }
      }
      const harf = hucreyiKarakteryap(noktalar);
      if (harf) {
        const buyuk = buyukHarfBekle || tumKelimeBuyuk;
        metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        buyukHarfBekle = false;
      } else {
        // Harf değilse (noktalama vs.) tümü büyük modu sonlanır
        tumKelimeBuyuk = false;
        buyukHarfBekle = false;
      }
    }
    metin += '\n';
  }
  return metin.trim();
}

function brfMetinedon(icerik) { return _brfMetinedon(icerik, false); }
function brfMetinedonKisaltmali(icerik, sistemler) { return _brfMetinedon(icerik, true, sistemler); }

// ─── Bileşen ──────────────────────────────────────────────────────────────
const BRAILLE_SAYFA_BOYUTU = 200;

export default function BrfOku() {
  const dosyaRef = useRef(null);
  const [okunanMetin, setOkunanMetin] = useState('');
  const [dosyaIcerik, setDosyaIcerik] = useState('');
  const [dosyaAdi, setDosyaAdi] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState('');
  const [kisaltmaAktif, setKisaltmaAktif] = useState(false);
  const [konusuyor, setKonusuyor] = useState(false); // 'metin' | 'nokta' | false
  const [dragOver, setDragOver] = useState(false);
  const [aktifTab, setAktifTab] = useState('metin');
  const [brailleSayfa, setBrailleSayfa] = useState(0);
  const [sayfaInput, setSayfaInput] = useState('');
  const [seciliHucre, setSeciliHucre] = useState(null);
  const [genisletAktif, setGenisletAktif] = useState(false);
  const brailleKutuRef = useRef(null);

  const SISTEM_VARSAYILAN = { hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true };
  const [kisaltmaSistemler, setKisaltmaSistemler] = useState(() => {
    const saved = localStorage.getItem('brfOkuKisaltmaSistemler');
    if (!saved) return { ...SISTEM_VARSAYILAN };
    try { return { ...SISTEM_VARSAYILAN, ...JSON.parse(saved) }; } catch { return { ...SISTEM_VARSAYILAN }; }
  });
  const [sistemPaneli, setSistemPaneli] = useState(false);
  const sistemPaneliRef = useRef(null);

  const sistemToggle = (key) => setKisaltmaSistemler((prev) => {
    const yeni = { ...prev, [key]: !prev[key] };
    localStorage.setItem('brfOkuKisaltmaSistemler', JSON.stringify(yeni));
    return yeni;
  });

  useEffect(() => {
    if (!sistemPaneli) return;
    const handle = (e) => {
      if (sistemPaneliRef.current && !sistemPaneliRef.current.contains(e.target))
        setSistemPaneli(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [sistemPaneli]);

  // Dosya içeriği, kısaltma modu veya sistemler değişince metni yeniden çöz
  useEffect(() => {
    if (!dosyaIcerik) return;
    setOkunanMetin(
      kisaltmaAktif
        ? brfMetinedonKisaltmali(dosyaIcerik, kisaltmaSistemler)
        : brfMetinedon(dosyaIcerik)
    );
  }, [dosyaIcerik, kisaltmaAktif, kisaltmaSistemler]);

  const temizle = () => {
    setOkunanMetin(''); setDosyaIcerik(''); setDosyaAdi('');
    setHata(''); setYukleniyor(false);
    setAktifTab('metin'); setBrailleSayfa(0); setSeciliHucre(null);
    if (konusuyor) { konusmayiDurdur(); setKonusuyor(false); }
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
      const normal = brfMetinedon(icerik);
      const kisaltmali = brfMetinedonKisaltmali(icerik, kisaltmaSistemler);
      const kisaltmaVar = normal !== kisaltmali;
      setKisaltmaAktif(kisaltmaVar);
      setDosyaIcerik(icerik); // useEffect ile metni günceller
      if (!kisaltmaVar) setOkunanMetin(normal); // kısaltma yoksa hemen set et
      setYukleniyor(false);
    };
    reader.onerror = () => { setHata('Dosya okunurken hata oluştu.'); setYukleniyor(false); };
    reader.readAsText(dosya, 'latin1');
  };

  const sesToggle = (alan, metinFn) => {
    if (konusuyor === alan) { konusmayiDurdur(); setKonusuyor(false); return; }
    const metin = metinFn();
    if (!metin || !metin.trim()) return;
    setKonusuyor(alan);
    konus(metin, { kesintiyle: true, onSon: () => setKonusuyor(false) });
  };

  const metniSeslendir = () => sesToggle('metin', () => okunanMetin);

  // BRF dosya içeriğinden ham hücreler (sayfa/satır ayraçları atlanır)
  const hucreler = useMemo(() => {
    if (!dosyaIcerik) return [];
    const out = [];
    for (const ch of dosyaIcerik) {
      if (ch === '\r' || ch === '\n' || ch === '\f') continue;
      const n = brfNoktalaradon(ch);
      if (n !== null) out.push(n);
    }
    return out;
  }, [dosyaIcerik]);
  const gorunumEsleme = useMemo(() => {
    if (!okunanMetin || !hucreler.length) return null;
    const sonuc = kisaltmaAktif
      ? metniBrailleyeCevirKisaltmali(okunanMetin, {
        buyukHarfIsareti: true,
        sayiIsareti: true,
        ...kisaltmaSistemler,
      })
      : metniBrailleyeCevir(okunanMetin, {
        buyukHarfIsareti: true,
        sayiIsareti: true,
      });
    return sonuc.hucreler.length === hucreler.length ? sonuc.esleme : null;
  }, [okunanMetin, hucreler, kisaltmaAktif, kisaltmaSistemler]);
  const hucreAnlamiOpts = gorunumEsleme ? { kaynak: okunanMetin, esleme: gorunumEsleme } : undefined;

  const toplamSayfa = Math.max(1, Math.ceil(hucreler.length / BRAILLE_SAYFA_BOYUTU));
  const sayfaBaslangic = brailleSayfa * BRAILLE_SAYFA_BOYUTU;
  const sayfaHucreler = hucreler.slice(sayfaBaslangic, sayfaBaslangic + BRAILLE_SAYFA_BOYUTU);

  useEffect(() => { setSeciliHucre(null); }, [brailleSayfa, aktifTab, kisaltmaAktif]);

  useEffect(() => {
    if (!seciliHucre) return;
    const kapat = (e) => { if (e.key === 'Escape') setSeciliHucre(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [seciliHucre]);

  const noktalariSeslendir = () => sesToggle('nokta', () => {
    if (!hucreler.length) return '';
    const parcalar = [];
    for (let i = 0; i < hucreler.length; i++) {
      const n = hucreler[i];
      if (n.length === 0) { parcalar.push('boşluk'); continue; }
      const noktaMetni = n.join(' ');
      const anlam = hucreAnlami(hucreler, i, kisaltmaAktif, hucreAnlamiOpts);
      if (anlam.tip === 'isaret' || anlam.tip === 'kisaltma' || anlam.tip === 'noktalama') {
        parcalar.push(`nokta ${noktaMetni}, ${anlam.baslik.replace(/"/g, '')}`);
        continue;
      }
      const harf = anlam.harf || (anlam.baslik.match(/Harf:\s*(.+)/)?.[1] || '');
      parcalar.push(harf ? `nokta ${noktaMetni}, ${harf}` : `nokta ${noktaMetni}`);
    }
    return parcalar.join('. ');
  });

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

  const brailleTabAc = () => { setAktifTab('braille'); setBrailleSayfa(0); };

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

            <div className="araclar-alan-sarici belge-tab-icerik-sarici">
              {/* Tab butonları */}
              <div className="belge-tab-bar">
                <button
                  type="button"
                  className={'belge-tab' + (aktifTab === 'metin' ? ' aktif' : '')}
                  onClick={() => setAktifTab('metin')}
                  aria-pressed={aktifTab === 'metin'}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                       strokeLinecap="round" strokeLinejoin="round" width="15" height="15" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/>
                  </svg>
                  Metin
                </button>
                <button
                  type="button"
                  className={'belge-tab' + (aktifTab === 'braille' ? ' aktif' : '')}
                  onClick={brailleTabAc}
                  aria-pressed={aktifTab === 'braille'}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" width="15" height="15" aria-hidden="true">
                    <circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>
                    <circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
                  </svg>
                  Braille
                </button>
              </div>

              {/* Metin sekmesi */}
              {aktifTab === 'metin' && (
                <div className="belge-metin-sarici">
                  <textarea
                    className="belge-metin-textarea"
                    value={okunanMetin}
                    onChange={(e) => setOkunanMetin(e.target.value)}
                    aria-label="BRF dosyasından okunan metin (düzenlenebilir)"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <button
                    type="button"
                    className={'araclar-seslendir-btn' + (konusuyor === 'metin' ? ' aktif' : '')}
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onClick={metniSeslendir}
                    disabled={!okunanMetin.trim()}
                    aria-label={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                    title={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                  >
                    {konusuyor === 'metin'
                      ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                    }
                  </button>
                </div>
              )}

              {/* Braille sekmesi */}
              {aktifTab === 'braille' && (
                <div className="araclar-nokta-sarici">
                  <div ref={brailleKutuRef} className={'araclar-nokta-gorunus belge-braille-kutu' + (genisletAktif ? ' genisletilmis' : '')} aria-label="Braille nokta görünümü">
                    {sayfaHucreler.map((noktalar, i) => {
                      const globalIdx = sayfaBaslangic + i;
                      const anlam = hucreAnlami(hucreler, globalIdx, kisaltmaAktif, hucreAnlamiOpts);
                      const kisaltmaHucre = kisaltmaAktif && (
                        anlam.tip === 'kisaltma' ||
                        (anlam.tip === 'isaret' && (
                          anlam.baslik === 'Kelime Kökü İşareti' ||
                          anlam.baslik === 'Kelime Parçası İşareti'
                        ))
                      );
                      const noktalamaHucre = anlam.tip === 'noktalama';
                      const bolukIsaretiHucre = anlam.tip === 'isaret' && anlam.baslik === 'Bölük İşareti';
                      const siraSayisiHucre = anlam.tip === 'rakam' && /^Sıra sayısı/u.test(anlam.baslik);
                      const ondalikAyiracHucre = anlam.tip === 'noktalama' && anlam.baslik.includes('ondalık ayraç');
                      const matematikHucre = anlam.tip === 'islem' || bolukIsaretiHucre || siraSayisiHucre || ondalikAyiracHucre;
                      const ozelIsaretHucre = anlam.tip === 'isaret' && !kisaltmaHucre && !bolukIsaretiHucre;
                      const sinif = 'belge-braille-hucre' +
                        (seciliHucre?.index === globalIdx ? ' secili' : '') +
                        (kisaltmaHucre ? ' kisaltma-hucre' : '') +
                        (noktalamaHucre ? ' noktalama-hucre' : '') +
                        (matematikHucre ? ' matematik-hucre' : '') +
                        (ozelIsaretHucre ? ' ozel-isaret-hucre' : '');
                      const etiket = genisletAktif
                        ? `${kisaEtiket(anlam)}${siraSayisiSonRakamEtiketiNoktaEki(
                          anlam,
                          globalIdx,
                          hucreler,
                          '',
                          [],
                        )}`
                        : '';
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
                    onClick={noktalariSeslendir}
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
            <div className="kisaltma-btn-grup" ref={sistemPaneliRef}>
              <button
                type="button"
                className={'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}
                onClick={() => setKisaltmaAktif((v) => !v)}
                aria-pressed={kisaltmaAktif}
                aria-label={'Kısaltma ' + (kisaltmaAktif ? 'Aktif' : 'Kapalı')}
                style={{ borderRadius: 'var(--radius) 0 0 var(--radius)' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                  <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
                </svg>
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
      )}
    </div>
  );
}
