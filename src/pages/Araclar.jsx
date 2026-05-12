import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toJpeg } from 'html-to-image';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
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
  tarihYazimiEslesmesi,
  duzeltmeYabanciHarfIsaretiMi,
  duzeltmeliHucreyiMetneCevir,
  ikiHarfliKisaltmaPrefixEslesmesi,
  ikiHarfliKisaltmaOkunusunuYumusat,
  kelimeKokuOkunusunuYorIcinDuzelt,
  matematikIslemIsaretiMetinEslesmesi,
  matematikIsaretiSayiModunuKorurMu,
  matematikIslemIsaretiHucreKapsami,
  matematikSembolHucreEslesmesi,
  noktalariAnahtara,
  ondalikVirguluMi,
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

// ─── BRF kodlama / çözme ───────────────────────────────────────────────────
// BRF (Braille Ready Format) standardı:
//   Karakter = 0x20 + nokta bitleri
//   bit0=nokta1  bit1=nokta2  bit2=nokta3
//   bit3=nokta4  bit4=nokta5  bit5=nokta6
const SATIRDA_HUCRE = 40;
const SAYFADA_SATIR = 25;
const BRAILLE_SAYFA_BOYUTU = 200; // hücre/sayfa

const CIFT_RAKAM_ISARETI_DETAY =

  'Çift rakam işareti (aynı anda nokta 3 · 4 · 5 · 6 yazılmış iki Braille hücresi, ⠼⠼): Üç veya daha fazla ardışık sayı yan yana (virgülle ayrılmış) veya sütunda alt alta yazıldığında sıra böyle iki sayı işareti ile başlar. Ara sayıların öncesine sayı işareti yazılmaz; yalnızca dizinin son sayısının başında tek sayı işareti (⠼) kullanılır. ';


// Hücre anlamından kısa etiket türet (genişlet modunda hücre altında gösterilir)
function kisaEtiket(anlam) {
  if (!anlam || anlam.tip === 'bosluk') return '';
  if (anlam.tip === 'isaret') {
    if (anlam.baslik.includes('Tümü Büyük')) return '⇧⇧';
    if (anlam.baslik.includes('Büyük Harf')) return '⇧';
    if (anlam.baslik.includes('Çift Rakam İşareti')) return '#';
    if (anlam.baslik.includes('Sayı')) return '#';
    if (anlam.baslik === 'Harf İşareti') return '(h)';
    if (anlam.baslik.includes('Bölük')) return '3';
    if (anlam.baslik.includes('Tarih Ayırma')) return '3-6';
    if (anlam.baslik.includes('Düzeltme') || anlam.baslik.includes('Yabancı Harf')) return '^';
    if (anlam.baslik.includes('Bağ İşareti')) return '-';
    if (anlam.baslik.includes('Ayırma')) return '3';
    if (anlam.baslik.includes('Tek Küçük Harf')) return '5-6';
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
    const sm = anlam.baslik.match(/Sıra sayısı[:\s]*(\d)/);
    if (sm) return sm[1];
  }
  return anlam.baslik;
}

const HUCRE_AYAR_SISTEMLERI = [
  { key: 'birHarf', etiket: 'Bir Harfli Kısaltma' },
  { key: 'ikiHarf', etiket: 'İki Harfli Kısaltma' },
  { key: 'hece', etiket: 'Hece Kısaltması' },
  { key: 'kok', etiket: 'Kelime Kökü Kısaltması' },
  { key: 'parca', etiket: 'Kelime Parçası Kısaltması' },
];

const TUM_HUCRE_AYARLARI_KAPALI = {
  hece: false,
  birHarf: false,
  ikiHarf: false,
  kok: false,
  parca: false,
};

function hucreAyarSistemiAnahtariniBul(anlam) {
  const baslik = anlam?.baslik || '';
  if (baslik.startsWith('Bir Harfli Kısaltma')) return 'birHarf';
  if (baslik.startsWith('İki Harfli Kısaltma')) return 'ikiHarf';
  if (baslik.startsWith('Hece Kısaltması')) return 'hece';
  if (baslik === 'Kelime Kökü İşareti' || baslik.startsWith('Kelime Kökü:')) return 'kok';
  if (baslik === 'Kelime Parçası İşareti' || baslik.startsWith('Kelime Parçası:')) return 'parca';
  return null;
}

function kaynakKelimeBaglaminiBul(kaynak, esleme, hucreIndeksi) {
  if (!kaynak || !Array.isArray(esleme)) return null;
  const kaynakIndeksi = esleme[hucreIndeksi];
  if (typeof kaynakIndeksi !== 'number' || kaynakIndeksi < 0 || kaynakIndeksi >= kaynak.length) return null;
  if (!/\p{L}/u.test(kaynak[kaynakIndeksi])) return null;
  let baslangic = kaynakIndeksi;
  while (baslangic > 0 && /\p{L}/u.test(kaynak[baslangic - 1])) baslangic--;
  let bitis = kaynakIndeksi;
  while (bitis + 1 < kaynak.length && /\p{L}/u.test(kaynak[bitis + 1])) bitis++;
  const kelime = kaynak.slice(baslangic, bitis + 1);
  return {
    baslangic,
    bitis,
    kelime,
    anahtar: `${baslangic}:${kelime.toLocaleLowerCase('tr')}`,
  };
}

function ilkKaynakHucreIndeksiniBul(esleme, kaynakBaslangici) {
  if (!Array.isArray(esleme) || typeof kaynakBaslangici !== 'number') return -1;
  return esleme.findIndex((deger) => deger === kaynakBaslangici);
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

function brfMetinedonKisaltmali(icerik, sistemler) {
  return _brfMetinedon(icerik, true, sistemler);
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
  const _yorumTercihleri = opts && opts.yorumTercihleri && typeof opts.yorumTercihleri === 'object'
    ? opts.yorumTercihleri
    : {};
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
  const _kaynakKelimeSonEki = (cellIdx, ekler) => {
    const kaynakKelime = _kaynakKelime(cellIdx);
    if (kaynakKelime === null) return null;
    const varyantlar = String(ekler || '')
      .split(',')
      .map((parca) => parca.trim().toLocaleLowerCase('tr'))
      .filter(Boolean)
      .sort((a, b) => b.length - a.length);
    for (const varyant of varyantlar) {
      if (kaynakKelime.endsWith(varyant)) return varyant;
    }
    return null;
  };
  const _kaynakTarihIcindeMi = (cellIdx) => {
    if (!_kaynak || !_esleme) return false;
    const ki = _esleme[cellIdx];
    if (typeof ki !== 'number' || ki < 0 || ki >= _kaynak.length) return false;
    if (!/[\d./-]/u.test(_kaynak[ki])) return false;
    let s = ki;
    while (s > 0 && /[\d./-]/u.test(_kaynak[s - 1])) s--;
    const tarih = tarihYazimiEslesmesi(_kaynak, s);
    return !!tarih && ki >= s && ki < s + tarih.length;
  };
  const _tarihHucreBaglamiMi = (cellIdx) => {
    if (_kaynakTarihIcindeMi(cellIdx)) return true;
    return !!tarihHucreAraligi(hucreler, cellIdx);
  };

  // Durum takibi (Metin ↔ BRF ile uyumlu; çoklu sayı listesinde virgül sayıModu'nu kapatmaz.)
  let sayiModu = false;
  let siraSayiModu = false;
  let buyukHarfBekle = false;
  let tumKelimeBuyuk = false;
  let ciftListeVirgulle = false;
  let cListeSonTekIsaretSonrasi = false;
  const virgulListesiAyirMi = (hucre) =>
    [...hucre].sort((a, b) => a - b).join(',') === '2';
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
    || _NOKTA_TERS.has(dotKey(hucre))
    || matematikSayiSinirAnahtarlari.has(dotKey(hucre))
  );
  const harfliSayiHarfIsaretiMi = (cellIdx) => {
    if (cellIdx < 0 || cellIdx >= hucreler.length) return false;
    if (!tekKucukHarfIsaretiMi(hucreler[cellIdx])) return false;
    let harfIdx = cellIdx + 1;
    if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
    const harf = harfIdx < hucreler.length ? hucreyiKarakteryap(hucreler[harfIdx]) : null;
    return !!harf && harf !== ' ';
  };
  const harfliSayiHarfHucreMi = (cellIdx) => {
    const onceki = cellIdx > 0 ? hucreler[cellIdx - 1] : null;
    const onceOnceki = cellIdx > 1 ? hucreler[cellIdx - 2] : null;
    if (onceki && tekKucukHarfIsaretiMi(onceki)) return !!hucreyiKarakteryap(hucreler[cellIdx]);
    return !!(
      onceki
      && buyukHarfIsaretiMi(onceki)
      && onceOnceki
      && tekKucukHarfIsaretiMi(onceOnceki)
      && hucreyiKarakteryap(hucreler[cellIdx])
    );
  };

  for (let i = 0; i < idx; i++) {
    const h = hucreler[i];
    if (h.length === 0) {
      sayiModu = false;
      siraSayiModu = false;
      buyukHarfBekle = false;
      tumKelimeBuyuk = false;
      ciftListeVirgulle = false;
      cListeSonTekIsaretSonrasi = false;
      continue;
    }
    if (sayiIsaretiMi(h)) {
      const sonrakiH = i + 1 < hucreler.length ? hucreler[i + 1] : null;
      const oncekiH = i > 0 ? hucreler[i - 1] : null;
      if (sonrakiH && sayiIsaretiMi(sonrakiH)) {
        sayiModu = true;
        siraSayiModu = false;
        ciftListeVirgulle = true;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        continue;
      }
      const sonrakNormalRakam = sonrakiH && hucreyiRakamayap(sonrakiH);
      const sonrakSiraRakam = sonrakiH && hucreyiSiraSayisiRakaminaCevir(sonrakiH);
      const sonrakHarfliSayiHarf = harfliSayiHarfIsaretiMi(i + 1);
      if (oncekiH && sayiIsaretiMi(oncekiH) && sonrakiH && sonrakNormalRakam) {
        sayiModu = true;
        siraSayiModu = false;
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        continue;
      }
      if (ciftListeVirgulle && sonrakiH && sonrakNormalRakam) {
        cListeSonTekIsaretSonrasi = true;
        sayiModu = true;
        siraSayiModu = false;
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        continue;
      }
      if (sayiIsaretiOncesiSinirMi(oncekiH) && sonrakiH && (sonrakNormalRakam || sonrakSiraRakam || sonrakHarfliSayiHarf)) {
        sayiModu = true;
        siraSayiModu = !!sonrakSiraRakam && !sonrakNormalRakam;
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        continue;
      }
    }
    if (buyukHarfIsaretiMi(h)) {
      if (buyukHarfBekle) { tumKelimeBuyuk = true; buyukHarfBekle = false; }
      else { buyukHarfBekle = true; }
      continue;
    }
    if (duzeltmeYabanciHarfIsaretiMi(h)) continue;
    if (sayiModu) {
      const matematikKapsami = matematikIslemIsaretiHucreKapsami(hucreler, i);
      if (!siraSayiModu && matematikIsaretiSayiModunuKorurMu(matematikKapsami)) continue;
      if (!siraSayiModu && hucreyiRakamayap(h)) continue;
      if (siraSayiModu && hucreyiSiraSayisiRakaminaCevir(h)) continue;
      if (!siraSayiModu && harfliSayiHarfIsaretiMi(i)) continue;
      if (!siraSayiModu && buyukHarfIsaretiMi(h) && i > 0 && tekKucukHarfIsaretiMi(hucreler[i - 1])) continue;
      if (!siraSayiModu && harfliSayiHarfHucreMi(i)) continue;
    if (
      !siraSayiModu
      && dotKey(h) === '3'
      && i + 1 < hucreler.length
      && hucreyiRakamayap(hucreler[i + 1])
    ) {
      continue;
    }
      if (tarihAyirmaIsaretiMi(h) && _tarihHucreBaglamiMi(i)) continue;
      if (
        !siraSayiModu
        && tarihAyirmaIsaretiMi(h)
        && i + 1 < hucreler.length
        && hucreyiRakamayap(hucreler[i + 1])
      ) {
        continue;
      }
      if (!siraSayiModu && virgulListesiAyirMi(h) && ciftListeVirgulle) continue;
      if (
        !siraSayiModu
        &&
        virgulListesiAyirMi(h)
        && !ciftListeVirgulle
        && i + 1 < hucreler.length
        && hucreyiRakamayap(hucreler[i + 1])
      ) {
        continue;
      }
      sayiModu = false;
      siraSayiModu = false;
      if (cListeSonTekIsaretSonrasi) {
        cListeSonTekIsaretSonrasi = false;
        ciftListeVirgulle = false;
      }
    }
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
  const oncekiDoluHucre = (cellIdx) => {
    for (let i = cellIdx - 1; i >= 0; i--) {
      if (hucreler[i]?.length) return hucreler[i];
    }
    return null;
  };
  const sonrakiDoluHucre = (cellIdx) => {
    for (let i = cellIdx + 1; i < hucreler.length; i++) {
      if (hucreler[i]?.length) return hucreler[i];
    }
    return null;
  };
  const belirsizTekHucreliIslemMi = (islem) => (
    !!islem
    && islem.hucreler.length === 1
    && (
      islem.ad === 'yüzde'
      || islem.ad === 'parantez açma'
      || islem.ad === 'parantez kapama'
      || islem.ad === 'kesir çizgisi'
    )
  );
  const belirsizTekHucreliIslemiAtlaMi = (islem) => {
    if (_kaynak || !belirsizTekHucreliIslemMi(islem)) return false;
    const onceki = oncekiDoluHucre(islem.baslangic);
    const sonraki = sonrakiDoluHucre(islem.baslangic);
    if (islem.ad === 'yüzde') {
      return !sayiIsaretiMi(sonraki);
    }
    if (islem.ad === 'parantez açma') {
      return !(sayiIsaretiMi(sonraki) || tekKucukHarfIsaretiMi(sonraki) || buyukHarfIsaretiMi(sonraki));
    }
    if (islem.ad === 'parantez kapama') {
      return !(sayiModu || sayiIsaretiMi(onceki) || tekKucukHarfIsaretiMi(onceki) || buyukHarfIsaretiMi(onceki));
    }
    if (islem.ad === 'kesir çizgisi') {
      return !(sayiIsaretiMi(onceki) || sayiIsaretiMi(sonraki));
    }
    return false;
  };
  if (noktalar.length === 0) {
    return { tip: 'bosluk', baslik: 'Boşluk', detay: 'Kelimeler arasındaki boşluk.', noktaStr };
  }
  const kaynakHucreIdx = _esleme ? _esleme[idx] : -1;
  const kaynakTireTercihi = _kaynak
    && typeof kaynakHucreIdx === 'number'
    && kaynakHucreIdx >= 0
    && _kaynak[kaynakHucreIdx] === '-'
    && _yorumTercihleri?.[kaynakHucreIdx]?.eksiTire;
  if (kaynakTireTercihi) {
    return {
      tip: 'noktalama',
      baslik: 'Noktalama: tire (-)',
      detay: 'Bu çizgi ayardan dolayı matematikte eksi yerine tire olarak yorumlanır.',
      noktaStr,
      isaret: '-',
    };
  }
  const kaynakIslem = _kaynak && typeof kaynakHucreIdx === 'number' && kaynakHucreIdx >= 0
    ? matematikIslemIsaretiMetinEslesmesi(_kaynak, kaynakHucreIdx, _yorumTercihleri)
    : null;
  if (kaynakIslem) {
    const ilkHucre = idx === 0 || !_esleme || _esleme[idx - 1] !== kaynakHucreIdx;
    return {
      tip: 'islem',
      baslik: `İşlem işareti: ${kaynakIslem.ad} (${kaynakIslem.sembol})`,
      detay: `Matematik işlem işareti; nokta gösterimi ${kaynakIslem.hucreler.map((hucre) => hucre.join('-')).join(', ')}.`,
      noktaStr,
      etiket: ilkHucre ? kaynakIslem.sembol : '',
    };
  }
  const oncekiAnahtar = idx > 0 ? noktalariAnahtara(hucreler[idx - 1]) : '';
  const simdikiAnahtar = noktalariAnahtara(noktalar);
  const karsilastirmaDevamSembol =
    oncekiAnahtar === '3' && simdikiAnahtar === '1,3,5'
      ? '>'
      : oncekiAnahtar === '3' && simdikiAnahtar === '2,4,6'
        ? '<'
        : '';
  if (karsilastirmaDevamSembol) {
    return {
      tip: 'islem',
      baslik: `İşlem işareti: ${karsilastirmaDevamSembol === '>' ? 'büyüktür' : 'küçüktür'} (${karsilastirmaDevamSembol})`,
      detay: `Matematik karşılaştırma işaretinin ikinci hücresi.`,
      noktaStr,
      etiket: '',
    };
  }
  const islemKapsami = matematikIslemIsaretiHucreKapsami(hucreler, idx);
  if (islemKapsami) {
    const kaynakIdx = _esleme ? _esleme[islemKapsami.baslangic] : -1;
    const kaynakKarakter = _kaynak && typeof kaynakIdx === 'number' && kaynakIdx >= 0
      ? _kaynak[kaynakIdx]
      : '';
    const kaynaklaUyusuyor = !kaynakKarakter || kaynakKarakter === islemKapsami.sembol;
    if (kaynaklaUyusuyor && !belirsizTekHucreliIslemiAtlaMi(islemKapsami)) {
      const ilkHucre = islemKapsami.baslangic === idx;
      return {
        tip: 'islem',
        baslik: `İşlem işareti: ${islemKapsami.ad} (${islemKapsami.sembol})`,
        detay: `Matematik işlem işareti; nokta gösterimi ${islemKapsami.hucreler.map((hucre) => hucre.join('-')).join(', ')}.`,
        noktaStr,
        etiket: ilkHucre ? islemKapsami.sembol : '',
      };
    }
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
  // Yan yana iki sayı işareti = çift rakam işareti (MEB liste başlangıcı); tek başına üçüncü sırada olan hücre "ki" hecesidir.
  if (sayiIsaretiMi(noktalar)) {
    const sonrakiHucre = idx + 1 < hucreler.length ? hucreler[idx + 1] : null;
    const oncekiHucre = idx > 0 ? hucreler[idx - 1] : null;
    if (sonrakiHucre && sayiIsaretiMi(sonrakiHucre)) {
      return {
        tip: 'isaret',
        baslik: 'Çift Rakam İşareti (sayı dizisi, örüntüsü)',
        detay: CIFT_RAKAM_ISARETI_DETAY ,
        noktaStr,
      };
    }
    if (oncekiHucre && sayiIsaretiMi(oncekiHucre)) {
      return {
        tip: 'isaret',
        baslik: 'Çift Rakam İşareti (sayı dizisi, örüntüsü)',
        detay: CIFT_RAKAM_ISARETI_DETAY,
        noktaStr,
      };
    }
    // Tek sayı işareti: kelime/satır başı klasik kullanım veya çoklu sayı listesinde
    // liste virgülünden hemen sonra (yalnızca son sayıdan önce) gelen işaret (MEB 1.2.5).
    const prevBosluk = sayiIsaretiOncesiSinirMi(hucreler[idx - 1]);
    const sonrakiRakam = sonrakiHucre && (
      hucreyiRakamayap(sonrakiHucre) || hucreyiSiraSayisiRakaminaCevir(sonrakiHucre)
      || harfliSayiHarfIsaretiMi(idx + 1)
    );
    const listeSonundanOnceTekIsaret = sonrakiRakam && sonrakiHucre && hucreyiRakamayap(sonrakiHucre) && ciftListeVirgulle
      && idx > 0 && virgulListesiAyirMi(hucreler[idx - 1]);
    if ((prevBosluk || listeSonundanOnceTekIsaret) && sonrakiRakam) {
      if (listeSonundanOnceTekIsaret) {
        return {
          tip: 'isaret',
          baslik: 'Çift Rakam İşareti (Örüntü Sonu)',
          detay:
            'Nokta 3 · 4 · 5 · 6. Virgülle ayrılmış üç veya daha fazla sayılı örneğinde dizi ilk sayıdan önce çift rakam işareti ile başlar, ara rakamlarda sayı işareti kullanılmaz; yalnızca sıranın son rakam grubunun hemen öncesinde bu tek işaret yazılır (MEB 1.2.5). Sonraki hücreler rakam olarak okunur.',
          noktaStr,
        };
      }
      const siraSonraki = !!(sonrakiHucre && hucreyiSiraSayisiRakaminaCevir(sonrakiHucre));
      if (siraSonraki) {
        return {
          tip: 'isaret',
          baslik: 'Sıra sayı işareti',
          detay:
            'Nokta 3 · 4 · 5 · 6. Bu özel durumda sıra sayı yazımına geçilir: ardı indirgenmiş (alta kaydırılmış) rakam hücreleri gelir (MEB 1.2.6).',
          noktaStr,
        };
      }
      if (_tarihHucreBaglamiMi(idx)) {
        return {
          tip: 'isaret',
          baslik: 'Tarih (Sayı İşareti)',
          detay: 'Nokta 3 · 4 · 5 · 6. Tarih yazımının başında gün/ay/yıl rakamlarını sayı olarak başlatır.',
          noktaStr,
        };
      }
      return {
        tip: 'isaret',
        baslik: 'Sayı İşareti',
        detay: 'Nokta 3 · 4 · 5 · 6. Sonraki hücreler rakam olarak okunur.',
        noktaStr,
      };
    }
    // değilse: hece "ki" olarak fall-through
  }
  if (sayiModu) {
    if (!siraSayiModu && harfliSayiHarfIsaretiMi(idx)) {
      return {
        tip: 'isaret',
        baslik: 'Harf İşareti',
        detay: 'Sayı içinde kullanılan harfin önüne yazılır (MEB 1.2.8).',
        noktaStr,
      };
    }
    if (!siraSayiModu && harfliSayiHarfHucreMi(idx)) {
      const oncekiBuyuk = idx > 0 && buyukHarfIsaretiMi(hucreler[idx - 1]);
      const harf = hucreyiKarakteryap(noktalar);
      const goster = oncekiBuyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
      return {
        tip: 'harf',
        baslik: `Harf: ${goster}`,
        detay: `Sayı içindeki harf işaretinden sonra Nokta ${noktaStr} → "${goster}" harfi.`,
        noktaStr,
        harf: goster,
      };
    }
    const r = hucreyiRakamayap(noktalar);
    if (!siraSayiModu && r) return { tip: 'rakam', baslik: `Rakam: ${r}`, detay: 'Sayı modunda kullanılır.', noktaStr };
    const sr = hucreyiSiraSayisiRakaminaCevir(noktalar);
    if (siraSayiModu && sr) {
      return {
        tip: 'rakam',
        baslik: `Sıra sayısı ${sr}`,
        detay:
          `Bu hücre sıradaki rakamdır; sıra sayı işaretinden sonra “indirgenmiş” olarak yazılır (MEB 1.2.6). Gösterilen rakam: ${sr}.`,
        noktaStr,
      };
    }
    if (
      !siraSayiModu
      && k === '3'
      && idx + 1 < hucreler.length
      && hucreyiRakamayap(hucreler[idx + 1])
    ) {
      return {
        tip: 'isaret',
        baslik: 'Bölük İşareti',
        detay: 'Nokta 3. Büyük sayılarda basamakları sağdan üçlü gruplar halinde ayırmak için kullanılır.',
        noktaStr,
      };
    }
    if (
      !siraSayiModu
      && tarihAyirmaIsaretiMi(noktalar)
      && idx + 1 < hucreler.length
      && hucreyiRakamayap(hucreler[idx + 1])
    ) {
      return {
        tip: 'isaret',
        baslik: 'Bağ İşareti',
        detay: 'Nokta 3 · 6. Aralarında bağlantı bulunan iki sayı arasında kullanılır; ikinci sayının başına yeniden rakam işareti yazılmaz.',
        noktaStr,
        etiket: '-',
      };
    }
    if (!siraSayiModu && virgulListesiAyirMi(noktalar)) {
      const npVirgul = _NOKTA_TERS.get('2');
      const sonrakHucreVirgulSonrasi = idx + 1 < hucreler.length ? hucreler[idx + 1] : null;
      const sonrakRakam = !!(
        sonrakHucreVirgulSonrasi
        && hucreyiRakamayap(sonrakHucreVirgulSonrasi)
      );
      if (npVirgul) {
        const np2 = parenSwap(npVirgul);
        if (sonrakRakam && !ciftListeVirgulle) {
          return {
            tip: 'noktalama',
            baslik: `Noktalama: ${np2.isim} (ondalık ayraç) (${np2.isaret})`,
            detay:
              `Nokta ${noktaStr}. Ondalık yazımda virgül kesir ayırıcıdır; virgülden sonra ikinci bir sayı işareti yazılmaz.`,
            noktaStr,
            isaret: np2.isaret,
          };
        }
        if (sonrakRakam && ciftListeVirgulle) {
          return {
            tip: 'noktalama',
            baslik: `Noktalama: ${np2.isim} (${np2.isaret})`,
            detay:
              `Çoklu sayı sırasında ara virgül; sayı modu rakamlar için sürer (MEB 1.2.5). Nokta ${noktaStr}.`,
            noktaStr,
            isaret: np2.isaret,
          };
        }
      }
    }
    if (
      !siraSayiModu
      && _NOKTA_TERS.has(k)
      && !(tarihAyirmaIsaretiMi(noktalar) && _tarihHucreBaglamiMi(idx))
    ) {
      const np = parenSwap(_NOKTA_TERS.get(k));
      return {
        tip: 'noktalama',
        baslik: `Noktalama: ${np.isim} (${np.isaret})`,
        detay: `Nokta ${noktaStr}. Sayı bağlamındaki noktalama işareti; kısaltma olarak yorumlanmaz.`,
        noktaStr,
        isaret: np.isaret,
      };
    }
    // sayiModu sona erdi; fall through to normal lookup
  }

  if (tarihAyirmaIsaretiMi(noktalar) && _tarihHucreBaglamiMi(idx)) {
    return { tip: 'isaret', baslik: 'Tarih Ayırma İşareti', detay: 'Nokta 3 · 6. Tarihte gün, ay ve yıl bölümlerini ayırır.', noktaStr };
  }

  if (duzeltmeYabanciHarfIsaretiMi(noktalar)) {
    return { tip: 'isaret', baslik: 'Düzeltme ve Yabancı Harf İşareti', detay: 'Nokta 4. Düzeltme işaretli ünlülerden veya yabancı harflerden önce kullanılır.', noktaStr };
  }

  if (idx > 0 && duzeltmeYabanciHarfIsaretiMi(hucreler[idx - 1])) {
    const harf = duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar);
    if (harf && harf !== ' ') {
      const goster = (buyukHarfBekle || tumKelimeBuyuk) ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
      return { tip: 'harf', baslik: `Harf: ${goster}`, detay: `Düzeltme/yabancı harf işaretinden sonra Nokta ${noktaStr} → "${goster}" harfi`, noktaStr, harf: goster };
    }
  }

  if (!kisaltmaAktif && tekKucukHarfIsaretiMi(noktalar)) {
    const harfIdx = idx + 1 < hucreler.length && buyukHarfIsaretiMi(hucreler[idx + 1]) ? idx + 2 : idx + 1;
    const harf = harfIdx < hucreler.length ? hucreyiKarakteryap(hucreler[harfIdx]) : null;
    if (harf && harf !== ' ') {
      return { tip: 'isaret', baslik: 'Tek Küçük Harf İşareti', detay: 'Nokta 5 · 6. Sonraki tek harfin harf olarak okunacağını gösterir.', noktaStr };
    }
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
    const _tekHarfBilgisi = (cellIdx) => {
      const hucre = hucreler[cellIdx];
      if (!tekKucukHarfIsaretiMi(hucre)) return null;
      let harfIdx = cellIdx + 1;
      let buyuk = false;
      if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
      if (harfIdx !== cellIdx + 1) buyuk = true;
      if (harfIdx >= hucreler.length) return null;
      const harf = hucreyiKarakteryap(hucreler[harfIdx]);
      if (!harf || harf === ' ') return null;
      const onceki = cellIdx > 0 ? hucreler[cellIdx - 1] : null;
      const sonraki = harfIdx + 1 < hucreler.length ? hucreler[harfIdx + 1] : null;
      const solSinir = cellIdx === 0 || !onceki || onceki.length === 0 || _isNoktalamaHucre(onceki, cellIdx - 1);
      const sagSinir = !sonraki || sonraki.length === 0 || _isNoktalamaHucre(sonraki, harfIdx + 1);
      return solSinir && sagSinir ? { harfIdx, harf, buyuk } : null;
    };
    const _tekHarfIsaretiMi = (cellIdx) => {
      return _tekHarfBilgisi(cellIdx) !== null;
    };
    const _tekHarfHarfBilgisi = (cellIdx) => {
      const onceki = cellIdx > 0 ? _tekHarfBilgisi(cellIdx - 1) : null;
      if (onceki && onceki.harfIdx === cellIdx) return onceki;
      const oncekiBuyuk = cellIdx > 0 && buyukHarfIsaretiMi(hucreler[cellIdx - 1]);
      const onceOnceki = cellIdx > 1 ? _tekHarfBilgisi(cellIdx - 2) : null;
      if (oncekiBuyuk && onceOnceki && onceOnceki.harfIdx === cellIdx) return onceOnceki;
      return null;
    };
    const prevIsSpace = idx === 0 || hucreler[idx - 1].length === 0
      || _isNoktalamaHucre(hucreler[idx - 1], idx - 1);
    const nextIsSpace = idx >= hucreler.length - 1 || hucreler[idx + 1].length === 0
      || _isNoktalamaHucre(hucreler[idx + 1], idx + 1);
    // Büyük harf işareti öncesinde de sınır sayılır
    const prevIsBuyuk = idx > 0 && buyukHarfIsaretiMi(hucreler[idx - 1]);
    const prevBosBuyuk = prevIsSpace || prevIsBuyuk;
    const oncekiBuyukHarfCifti = prevIsBuyuk && idx >= 3
      && buyukHarfIsaretiMi(hucreler[idx - 3])
      && !!hucreyiKarakteryap(hucreler[idx - 2]);

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
    if (_tekHarfIsaretiMi(idx)) {
      return { tip: 'isaret', baslik: 'Tek Küçük Harf İşareti', detay: 'Nokta 5 · 6. Sonraki tek harfin harf olarak okunacağını gösterir.', noktaStr };
    }
    const tekHarfBilgisi = _tekHarfHarfBilgisi(idx);
    if (tekHarfBilgisi) {
      const goster = tekHarfBilgisi.buyuk ? tekHarfBilgisi.harf.toLocaleUpperCase('tr') : tekHarfBilgisi.harf.toLocaleLowerCase('tr');
      return { tip: 'harf', baslik: `Harf: ${goster}`, detay: `Tek harf işaretinden sonra Nokta ${noktaStr} → "${goster}" harfi`, noktaStr, harf: goster };
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
          const seciliEk = _kaynakKelimeSonEki(idx, parca.ekler) || parca.ekler;
          const ek = kasala(seciliEk);
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
    if (prevBosBuyuk && nextIsSpace && !oncekiBuyukHarfCifti) {
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
      const tumBloklar = [];
      let blok = [];
      for (const n of hucreleri) {
        if (n.length === 0) { tumBloklar.push(blok); blok = []; }
        else blok.push(n);
      }
      if (blok.length) tumBloklar.push(blok);

      const bloklariIsle = (bRaw, sonrakiIlkHucre) => {
        if (bRaw.length === 0) return;
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
        if (birHarfAktif && b.length === 1) {
          if (_KISALTMA_TEK.has(ilkKey)) { cikis.push(kasala(_KISALTMA_TEK.get(ilkKey))); return; }
        }
        if (ikiHarfAktif && b.length === 2 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const a = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(kasala(_KISALTMA_IKI.get(a))); return; }
        }
        const buf = [];
        let ci = 0;
        let sM = false, siraSM = false, bH = (bashCase === 'ilk'), bHTumu = (bashCase === 'tumu');
        let ciftListeVirgulle = false;
        let cListeSonTekIsaretSonrasi = false;
        let duzeltmeBekle = false;
        let ikiHarfPrefixIndex = -1;
        let kokPrefixIndex = -1;
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
        if (kokAktif && b.length >= 2 && ilkKey === '5') {
          const sagKey = [...b[1]].sort((x, y) => x - y).join(',');
          const kok = _KOK_SAG_MAP.get(sagKey);
          if (kok) {
            let kk = kok.kelime;
            if (bashCase === 'tumu') kk = kk.toLocaleUpperCase('tr');
            else if (bashCase === 'ilk') kk = kk.charAt(0).toLocaleUpperCase('tr') + kk.slice(1);
            buf.push(kk);
            kokPrefixIndex = buf.length - 1;
            if (bashCase === 'ilk') { bashCase = 'normal'; bH = false; }
            ci = 2;
          }
        }
        const harfYaz = (h) => {
          if (!h) return;
          if (bHTumu) buf.push(h.toLocaleUpperCase('tr'));
          else if (bH) {
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
          }
          if (buyukHarfIsaretiMi(noktalar)) {
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
            const bolukMu = [...noktalar].sort((x, y) => x - y).join(',') === '3';
            if (!siraSM && bolukMu && ci + 1 < b.length && hucreyiRakamayap(b[ci + 1])) {
              buf.push('.');
              ci++;
              continue;
            }
            const kVirgulMu = [...noktalar].sort((x, y) => x - y).join(',') === '2';
            if (!siraSM && kVirgulMu && ciftListeVirgulle) {
              buf.push(',');
              ci++;
              continue;
            }
            if (
              !siraSM
              && kVirgulMu
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
        const bolukMu = [...noktalar].sort((a, b) => a - b).join(',') === '3';
        if (!siraSayiModu && bolukMu && hi + 1 < satirHucreleri.length && hucreyiRakamayap(satirHucreleri[hi + 1])) {
          metin += '.';
          continue;
        }
        const kVirgulMu = [...noktalar].sort((a, b) => a - b).join(',') === '2';
        if (!siraSayiModu && kVirgulMu && ciftListeVirgulle) {
          metin += ',';
          continue;
        }
        if (
          !siraSayiModu
          && kVirgulMu
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
        tumKelimeBuyuk = false;
        buyukHarfBekle = false;
      }
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
  const [kelimeBazliKisaltmaTercihleri, setKelimeBazliKisaltmaTercihleri] = useState({});
  const [karakterYorumTercihleri, setKarakterYorumTercihleri] = useState({});
  const [hucreAyarPaneliAcik, setHucreAyarPaneliAcik] = useState(false);
  const [bekleyenKaynakBaslangici, setBekleyenKaynakBaslangici] = useState(null);

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
  const [seciliHucre, setSeciliHucre] = useState(null); // { index }
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
  useEffect(() => {
    setKelimeBazliKisaltmaTercihleri((onceki) => {
      if (!Object.keys(onceki).length) return onceki;
      const sonraki = {};
      let degisti = false;
      for (const [anahtar, deger] of Object.entries(onceki)) {
        const ayirac = anahtar.indexOf(':');
        const baslangic = Number(anahtar.slice(0, ayirac));
        const kelime = anahtar.slice(ayirac + 1);
        const aday = girisMetni.slice(baslangic, baslangic + kelime.length).toLocaleLowerCase('tr');
        if (!Number.isInteger(baslangic) || baslangic < 0 || aday !== kelime) {
          degisti = true;
          continue;
        }
        sonraki[anahtar] = deger;
      }
      return degisti ? sonraki : onceki;
    });
  }, [girisMetni]);
  useEffect(() => {
    setKarakterYorumTercihleri((onceki) => {
      if (!Object.keys(onceki).length) return onceki;
      const sonraki = {};
      let degisti = false;
      for (const [anahtar, deger] of Object.entries(onceki)) {
        const indeks = Number(anahtar);
        if (!Number.isInteger(indeks) || indeks < 0 || indeks >= girisMetni.length) {
          degisti = true;
          continue;
        }
        const karakter = girisMetni[indeks];
        const eksiAyariVar = !!deger?.eksiTire;
        const ondalikVirgulAyariVar = !!deger?.ondalikVirgulNormal;
        if ((eksiAyariVar && karakter !== '-') || (ondalikVirgulAyariVar && karakter !== ',')) {
          degisti = true;
          continue;
        }
        if (!eksiAyariVar && !ondalikVirgulAyariVar) {
          degisti = true;
          continue;
        }
        sonraki[anahtar] = deger;
      }
      return degisti ? sonraki : onceki;
    });
  }, [girisMetni]);

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
  const ozelKisaltmaVarMi = Object.keys(kelimeBazliKisaltmaTercihleri).length > 0;
  const hucreYorumlariAktif = kisaltmaAktif || ozelKisaltmaVarMi;
  const temelKisaltmaSistemleri = kisaltmaAktif ? kisaltmaSistemler : TUM_HUCRE_AYARLARI_KAPALI;
  const cevirFn = hucreYorumlariAktif
    ? (m, o) => metniBrailleyeCevirKisaltmali(m, {
      ...o,
      ...temelKisaltmaSistemleri,
      kelimeTercihleri: kelimeBazliKisaltmaTercihleri,
      yorumTercihleri: karakterYorumTercihleri,
    })
    : (m, o) => metniBrailleyeCevir(m, { ...o, yorumTercihleri: karakterYorumTercihleri });

  // Önbellekli hücre dizisi (sayfalama + render için)
  const cevirSonuc = useMemo(() => {
    if (!girisMetni) return { hucreler: [], esleme: [], kaynak: '' };
    const kaynak = girisMetni;
    const r = cevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
    return { hucreler: r.hucreler, esleme: r.esleme, kaynak };
  }, [girisMetni, kisaltmaAktif, kisaltmaSistemler, kelimeBazliKisaltmaTercihleri, karakterYorumTercihleri]);
  const hucrelerCache = cevirSonuc.hucreler;
  const eslemeCache = cevirSonuc.esleme;
  const kaynakCache = cevirSonuc.kaynak;
  const seciliHucreDetayi = useMemo(() => {
    if (!seciliHucre || typeof seciliHucre.index !== 'number') return null;
    if (seciliHucre.index < 0 || seciliHucre.index >= hucrelerCache.length) return null;
    return {
      index: seciliHucre.index,
      anlam: hucreAnlami(hucrelerCache, seciliHucre.index, hucreYorumlariAktif, {
        kaynak: kaynakCache,
        esleme: eslemeCache,
        yorumTercihleri: karakterYorumTercihleri,
      }),
    };
  }, [seciliHucre, hucrelerCache, hucreYorumlariAktif, kaynakCache, eslemeCache, karakterYorumTercihleri]);
  const seciliHucreKelimeBaglami = useMemo(
    () => (seciliHucreDetayi
      ? kaynakKelimeBaglaminiBul(kaynakCache, eslemeCache, seciliHucreDetayi.index)
      : null),
    [seciliHucreDetayi, kaynakCache, eslemeCache],
  );
  const seciliHucreAyarBilgisi = useMemo(() => {
    if (!seciliHucreKelimeBaglami) return null;
    const temel = kisaltmaAktif ? kisaltmaSistemler : TUM_HUCRE_AYARLARI_KAPALI;
    const ozelTercih = kelimeBazliKisaltmaTercihleri[seciliHucreKelimeBaglami.anahtar] || {};
    const aktifSistemAnahtari = hucreAyarSistemiAnahtariniBul(seciliHucreDetayi?.anlam)
      || HUCRE_AYAR_SISTEMLERI.find(({ key }) => Object.prototype.hasOwnProperty.call(ozelTercih, key))?.key
      || null;
    const secenekler = aktifSistemAnahtari
      ? HUCRE_AYAR_SISTEMLERI
        .filter(({ key }) => key === aktifSistemAnahtari)
        .map(({ key, etiket }) => ({
          key,
          etiket,
          secili: !!(ozelTercih[key] ?? temel[key]),
        }))
      : [];
    return {
      ...seciliHucreKelimeBaglami,
      secenekler,
      ozelTercihVarMi: Object.keys(ozelTercih).length > 0,
    };
  }, [seciliHucreKelimeBaglami, seciliHucreDetayi, kisaltmaAktif, kisaltmaSistemler, kelimeBazliKisaltmaTercihleri]);
  const seciliHucreEksiAyariBilgisi = useMemo(() => {
    if (!seciliHucreDetayi) return null;
    const kaynakIndeksi = eslemeCache[seciliHucreDetayi.index];
    if (typeof kaynakIndeksi !== 'number' || kaynakIndeksi < 0 || kaynakCache[kaynakIndeksi] !== '-') return null;
    const varsayilanIslem = matematikIslemIsaretiMetinEslesmesi(kaynakCache, kaynakIndeksi);
    if (!varsayilanIslem || varsayilanIslem.ad !== 'eksi') return null;
    return {
      tur: 'eksi',
      anahtar: String(kaynakIndeksi),
      kaynakIndeksi,
      secenekler: [{
        key: 'eksiIslemi',
        etiket: 'Eksi işlemi',
        secili: !karakterYorumTercihleri?.[kaynakIndeksi]?.eksiTire,
      }],
      ozelTercihVarMi: !!karakterYorumTercihleri?.[kaynakIndeksi]?.eksiTire,
    };
  }, [seciliHucreDetayi, eslemeCache, kaynakCache, karakterYorumTercihleri]);
  const seciliHucreOndalikVirgulAyariBilgisi = useMemo(() => {
    if (!seciliHucreDetayi) return null;
    const kaynakIndeksi = eslemeCache[seciliHucreDetayi.index];
    if (typeof kaynakIndeksi !== 'number' || kaynakIndeksi < 0 || kaynakCache[kaynakIndeksi] !== ',') return null;
    const varsayilanOndalikVirgul = ondalikVirguluMi(kaynakCache, kaynakIndeksi);
    const ozelTercih = karakterYorumTercihleri?.[kaynakIndeksi];
    if (!varsayilanOndalikVirgul && !ozelTercih?.ondalikVirgulNormal) return null;
    return {
      tur: 'ondalikVirgul',
      anahtar: String(kaynakIndeksi),
      kaynakIndeksi,
      secenekler: [{
        key: 'ondalikVirgul',
        etiket: 'Ondalık ayraç',
        secili: !ozelTercih?.ondalikVirgulNormal,
      }],
      ozelTercihVarMi: !!ozelTercih?.ondalikVirgulNormal,
    };
  }, [seciliHucreDetayi, eslemeCache, kaynakCache, karakterYorumTercihleri]);
  const seciliHucreYorumAyariBilgisi =
    seciliHucreAyarBilgisi || seciliHucreEksiAyariBilgisi || seciliHucreOndalikVirgulAyariBilgisi;

  const toplamSayfa = Math.max(1, Math.ceil(hucrelerCache.length / BRAILLE_SAYFA_BOYUTU));
  const sayfaBaslangic = brailleSayfa * BRAILLE_SAYFA_BOYUTU;
  const sayfaHucreler = hucrelerCache.slice(sayfaBaslangic, sayfaBaslangic + BRAILLE_SAYFA_BOYUTU);

  // Sayfa sınır kontrolleri ve seçim temizleme
  useEffect(() => { setSeciliHucre(null); }, [brailleSayfa, kisaltmaAktif, girisMetni]);
  useEffect(() => { setHucreAyarPaneliAcik(false); }, [seciliHucre?.index]);
  useEffect(() => {
    if (brailleSayfa >= toplamSayfa) setBrailleSayfa(0);
  }, [toplamSayfa, brailleSayfa]);
  useEffect(() => {
    if (bekleyenKaynakBaslangici === null) return;
    const yeniIndeks = ilkKaynakHucreIndeksiniBul(eslemeCache, bekleyenKaynakBaslangici);
    setSeciliHucre(yeniIndeks >= 0 ? { index: yeniIndeks } : null);
    setBekleyenKaynakBaslangici(null);
  }, [bekleyenKaynakBaslangici, eslemeCache]);

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
    setKelimeBazliKisaltmaTercihleri({});
    setKarakterYorumTercihleri({});
    setHucreAyarPaneliAcik(false);
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

  const hucreAyariniDegistir = (sistemAnahtari) => {
    if (!seciliHucreYorumAyariBilgisi) return;
    if (seciliHucreYorumAyariBilgisi.tur === 'eksi') {
      setBekleyenKaynakBaslangici(seciliHucreYorumAyariBilgisi.kaynakIndeksi);
      setKarakterYorumTercihleri((onceki) => {
        const anahtar = seciliHucreYorumAyariBilgisi.anahtar;
        const mevcut = onceki[anahtar];
        const eksiAcik = !(mevcut?.eksiTire);
        const sonraki = { ...onceki };
        if (eksiAcik) {
          sonraki[anahtar] = { eksiTire: true };
        } else {
          delete sonraki[anahtar];
        }
        return sonraki;
      });
      return;
    }
    if (seciliHucreYorumAyariBilgisi.tur === 'ondalikVirgul') {
      setBekleyenKaynakBaslangici(seciliHucreYorumAyariBilgisi.kaynakIndeksi);
      setKarakterYorumTercihleri((onceki) => {
        const anahtar = seciliHucreYorumAyariBilgisi.anahtar;
        const mevcut = onceki[anahtar];
        const ondalikAcik = !(mevcut?.ondalikVirgulNormal);
        const sonraki = { ...onceki };
        if (ondalikAcik) {
          sonraki[anahtar] = { ...mevcut, ondalikVirgulNormal: true };
        } else {
          const { ondalikVirgulNormal, ...kalan } = mevcut || {};
          if (Object.keys(kalan).length) sonraki[anahtar] = kalan;
          else delete sonraki[anahtar];
        }
        return sonraki;
      });
      return;
    }
    const temel = kisaltmaAktif ? kisaltmaSistemler : TUM_HUCRE_AYARLARI_KAPALI;
    const tercihAnahtari = seciliHucreYorumAyariBilgisi.anahtar;
    setBekleyenKaynakBaslangici(seciliHucreYorumAyariBilgisi.baslangic);
    setKelimeBazliKisaltmaTercihleri((onceki) => {
      const mevcut = onceki[tercihAnahtari] || {};
      const etkin = {};
      for (const { key } of HUCRE_AYAR_SISTEMLERI) {
        etkin[key] = mevcut[key] ?? temel[key];
      }
      etkin[sistemAnahtari] = !etkin[sistemAnahtari];
      const yeniKayit = {};
      for (const { key } of HUCRE_AYAR_SISTEMLERI) {
        if (etkin[key] !== temel[key]) yeniKayit[key] = etkin[key];
      }
      const sonraki = { ...onceki };
      if (Object.keys(yeniKayit).length === 0) delete sonraki[tercihAnahtari];
      else sonraki[tercihAnahtari] = yeniKayit;
      return sonraki;
    });
  };

  const hucreAyarlariniSifirla = () => {
    if (!seciliHucreYorumAyariBilgisi?.ozelTercihVarMi) return;
    if (
      seciliHucreYorumAyariBilgisi.tur === 'eksi'
      || seciliHucreYorumAyariBilgisi.tur === 'ondalikVirgul'
    ) {
      setBekleyenKaynakBaslangici(seciliHucreYorumAyariBilgisi.kaynakIndeksi);
      setKarakterYorumTercihleri((onceki) => {
        const sonraki = { ...onceki };
        delete sonraki[seciliHucreYorumAyariBilgisi.anahtar];
        return sonraki;
      });
      return;
    }
    setBekleyenKaynakBaslangici(seciliHucreYorumAyariBilgisi.baslangic);
    setKelimeBazliKisaltmaTercihleri((onceki) => {
      const sonraki = { ...onceki };
      delete sonraki[seciliHucreYorumAyariBilgisi.anahtar];
      return sonraki;
    });
  };

  // Braille nokta numaralarını sesli oku: "m: 1 3 4, e: 1 5, ..."
  const noktalarıSeslendir = () =>
    sesToggle('nokta', () => {
      if (!girisMetni.trim()) return '';
      const kaynakMetin = girisMetni;
      const { hucreler, esleme } = cevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
      const parcalar = [];
      for (let i = 0; i < hucreler.length; i++) {
        const n = hucreler[i];
        const kaynak = esleme[i];
        if (n.length === 0) { parcalar.push('boşluk'); continue; }
        const noktaMetni = n.join(' ');
        if (hucreYorumlariAktif) {
          const anlam = hucreAnlami(hucreler, i, true, {
            kaynak: kaynakMetin,
            esleme,
            yorumTercihleri: karakterYorumTercihleri,
          });
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
      const kisaltmali = brfMetinedonKisaltmali(icerik, kisaltmaSistemler);
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
                aria-describedby="araclar-metin-braille-ipucu"
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
                    const anlam = hucreAnlami(hucrelerCache, globalIdx, hucreYorumlariAktif, {
                      kaynak: kaynakCache,
                      esleme: eslemeCache,
                      yorumTercihleri: karakterYorumTercihleri,
                    });
                    const kisaltmaHucre = hucreYorumlariAktif && (
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
                        hucrelerCache,
                        kaynakCache,
                        eslemeCache,
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
                          setSeciliHucre(seciliHucre?.index === globalIdx ? null : { index: globalIdx });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSeciliHucre(seciliHucre?.index === globalIdx ? null : { index: globalIdx });
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

                {seciliHucreDetayi && (
                  <div className="braille-hucre-popup" role="dialog" aria-label="Hücre anlamı">
                    <div className="bhp-header">
                      <span className="bhp-baslik-kucuk">Hücre {seciliHucreDetayi.index + 1}</span>
                      <div className="bhp-header-aksiyonlar">
                        {seciliHucreYorumAyariBilgisi?.secenekler?.length ? (
                          <button
                            type="button"
                            className={'bhp-ayar' + (hucreAyarPaneliAcik ? ' aktif' : '')}
                            onClick={() => setHucreAyarPaneliAcik((onceki) => !onceki)}
                            aria-label="Yorum ayarları"
                            aria-expanded={hucreAyarPaneliAcik}
                            title="Bu kelime için yorum ayarları"
                          >
                            Ayar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="bhp-kapat"
                          onClick={() => setSeciliHucre(null)}
                          aria-label="Kapat"
                        >✕</button>
                      </div>
                    </div>
                    <div className="bhp-noktalar">Nokta: {seciliHucreDetayi.anlam.noktaStr}</div>
                    <div className={'bhp-anlam bhp-tip-' + seciliHucreDetayi.anlam.tip}>
                      {seciliHucreDetayi.anlam.baslik}
                    </div>
                    {!hucreAyarPaneliAcik && seciliHucreDetayi.anlam.detay && (
                      <div className="bhp-detay">{seciliHucreDetayi.anlam.detay}</div>
                    )}
                    {hucreAyarPaneliAcik && seciliHucreYorumAyariBilgisi?.secenekler?.length ? (
                      <div className="bhp-ayar-paneli">
                        <div className="bhp-ayar-baslik">
                          {seciliHucreYorumAyariBilgisi.tur === 'eksi'
                            ? 'İşaret ayarı: "-"'
                            : seciliHucreYorumAyariBilgisi.tur === 'ondalikVirgul'
                              ? 'İşaret ayarı: ","'
                            : `Kelime ayarı: "${seciliHucreYorumAyariBilgisi.kelime}"`}
                        </div>
                        <div className="bhp-ayar-aciklama">
                          {seciliHucreYorumAyariBilgisi.tur === 'eksi'
                            ? 'İşaretliyse bu çizgi matematikte eksi olarak yazılır. Kapatırsan tireye döner.'
                            : seciliHucreYorumAyariBilgisi.tur === 'ondalikVirgul'
                              ? 'İşaretliyse bu virgül ondalık ayraç olarak yazılır. Kapatırsan normal virgüle döner ve sonraki sayı yeniden sayı işaretiyle başlar.'
                            : 'Bu hücre hangi kısaltma olarak yorumlandıysa yalnızca o sistem gösterilir. Kutuyu kapatırsan kelime tam yazıma döner.'}
                        </div>
                        <div className="bhp-ayar-listesi">
                          {seciliHucreYorumAyariBilgisi.secenekler.map((secenek) => (
                            <label key={secenek.key} className="bhp-ayar-satiri">
                              <input
                                type="checkbox"
                                checked={secenek.secili}
                                onChange={() => hucreAyariniDegistir(secenek.key)}
                              />
                              <span>{secenek.etiket}</span>
                            </label>
                          ))}
                        </div>
                        {seciliHucreYorumAyariBilgisi.ozelTercihVarMi ? (
                          <button
                            type="button"
                            className="bhp-ayarlari-sifirla"
                            onClick={hucreAyarlariniSifirla}
                          >
                            {seciliHucreYorumAyariBilgisi.tur === 'eksi' || seciliHucreYorumAyariBilgisi.tur === 'ondalikVirgul'
                              ? 'Bu işareti varsayılan ayara döndür'
                              : 'Bu kelimeyi varsayılan ayara döndür'}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
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
            anindaDokunma
          />
        </div>
      )}
    </div>
  );
}
