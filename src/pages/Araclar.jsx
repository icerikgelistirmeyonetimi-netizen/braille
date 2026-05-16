import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { Link } from 'react-router-dom';
import { toJpeg } from 'html-to-image';
import PageHeader from '../components/PageHeader.jsx';
import BrailleCell from '../components/BrailleCell.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import { noktalardanUnicode } from './BelgeBrf.jsx';
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
  saatYazimiEslesmesi,
  duzeltmeYabanciHarfIsaretiMi,
  duzeltmeliHucreyiMetneCevir,
  ikiHarfliKisaltmaPrefixEslesmesi,
  ikiHarfliKisaltmaOkunusunuYumusat,
  kelimeKokuOkunusunuYorIcinDuzelt,
  matematikIslemIsaretiMetinEslesmesi,
  matematikIsaretiSayiModunuKorurMu,
  matematikIslemIsaretiHucreKapsami,
  matematikSembolHucreEslesmesi,
  metindeMutlakDegerIcindeMi,
  noktalariAnahtara,
  ondalikVirguluMi,
  siraSayisiSonRakamEtiketiNoktaEki,
} from '../utils/brailleCevir.js';
import {
  paraBirimiKaynakSonEkiAraliklari,
  hucreParaBirimiKaynakBaglamiMi,
  hucreBirimKaynakIndeksiniCoz,
} from '../utils/paraBirimiKaynak.js';
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
const BRAILLE_SAYFA_BOYUTU = 200; // hücre/sayfa (klasik Araçlar sayfalaması)
/** Tablet görünümü: fiziksel cihaza yakın yazım yönü ve satır genişliği (hücre/sıra). */
const TABLET_SATIR_HUCRE = 28;
/** Kabartma sayfada sıra sayısı (BRF “32×28” preset’teki 28 satırla aynı mantık). */
const TABLET_SAYFADA_SATIR = 28;
/** Tablet modunda tam “ekran”: 28×28 hücre. */
const TABLET_BRAILLE_SAYFA_BOYUTU = TABLET_SATIR_HUCRE * TABLET_SAYFADA_SATIR;

/** Delik aynası: aynı nokta dizisi için aynı dizi referansı (React.memo). */
const _aynaliCache = new Map();

/** Fiziksel delme aynası: sütunlar yatay çevrilir (1 ↔ 4, 2 ↔ 5, 3 ↔ 6); yalnızca görüntü. */
function tabletDelikAynala(noktalar) {
  if (!noktalar || !noktalar.length) return noktalar;
  const key = noktalar.join(',');
  if (_aynaliCache.has(key)) return _aynaliCache.get(key);
  const sutunDegisimi = { 1: 4, 4: 1, 2: 5, 5: 2, 3: 6, 6: 3 };
  const res = [...noktalar]
    .map((d) => sutunDegisimi[d] ?? d)
    .sort((a, b) => a - b);
  _aynaliCache.set(key, res);
  return res;
}

/** Tablet kopyasında: ayılmış satırlar + delik aynalı Unicode (okuma sırası sayfa sırasında kalır). */
function tabletSayfasiUnicodeKopyaMetni(hucreler) {
  const satirlar = [];
  for (let b = 0; b < hucreler.length; b += TABLET_SATIR_HUCRE) {
    const parca = [];
    for (let j = b; j < Math.min(b + TABLET_SATIR_HUCRE, hucreler.length); j++) {
      parca.push(noktalardanUnicode(tabletDelikAynala(hucreler[j])));
    }
    satirlar.push(parca.join(''));
  }
  return satirlar.join('\n');
}

/** Bu uzunluğa kadar çeviri doğrudan ana iş parçacığında (Worker ileti gecikmesi yok). */
const ARACLAR_CEVIR_ANLIK_MAX_UZUNLUK = 3200;
/** Uzun metinde Worker’a göndermeden önce kısa bekleme; ardı ardına tuşlarda tek iş. */
const ARACLAR_CEVIR_WORKER_DEBOUNCE_MS = 48;

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
    if (anlam.baslik.includes('Bölük')) return '.';
    if (anlam.baslik.includes('Tarih Ayırma')) return '3-6';
    if (anlam.baslik.includes('Düzeltme') || anlam.baslik.includes('Yabancı Harf')) return '^';
    if (anlam.baslik.includes('Bağ İşareti')) return '-';
    if (anlam.baslik.includes('Ayırma')) return '3';
    if (anlam.baslik.includes('Tek Küçük Harf')) return '(h)';
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

/** Kabartmalı sıra/satır için makul üst-alt sınırlar (ön izleme + BRFe). */
function brfKagitBoyutunuDuzeltGirdi(kagitBoyutu) {
  if (!kagitBoyutu || typeof kagitBoyutu !== 'object') {
    return { satirdaHucre: SATIRDA_HUCRE, sayfadaSatir: SAYFADA_SATIR };
  }
  const hHam = typeof kagitBoyutu.satirdaHucre === 'number' ? kagitBoyutu.satirdaHucre : Number.parseInt(String(kagitBoyutu.satirdaHucre), 10);
  const sHam = typeof kagitBoyutu.sayfadaSatir === 'number' ? kagitBoyutu.sayfadaSatir : Number.parseInt(String(kagitBoyutu.sayfadaSatir), 10);
  const hTemel = Number.isFinite(hHam) ? Math.round(hHam) : SATIRDA_HUCRE;
  const sTemel = Number.isFinite(sHam) ? Math.round(sHam) : SAYFADA_SATIR;
  const satirdaHucre = Math.max(10, Math.min(80, hTemel || SATIRDA_HUCRE));
  const sayfadaSatir = Math.max(5, Math.min(64, sTemel || SAYFADA_SATIR));
  return { satirdaHucre, sayfadaSatir };
}

function hucreleriBRFDizgesine(hucreler, kagitBoyutu) {
  if (!hucreler || hucreler.length === 0) return '';
  const { satirdaHucre, sayfadaSatir } = brfKagitBoyutunuDuzeltGirdi(kagitBoyutu);
  const satirlar = [];
  let satir = '';
  for (const hucre of hucreler) {
    satir += noktalariBRF(hucre);
    if (satir.length >= satirdaHucre) {
      satirlar.push(satir);
      satir = '';
    }
  }
  if (satir.length) satirlar.push(satir);
  const chunks = [];
  for (let i = 0; i < satirlar.length; i += sayfadaSatir) {
    chunks.push(satirlar.slice(i, i + sayfadaSatir).join('\r\n'));
  }
  return chunks.join('\r\n\f\r\n');
}

function metniBRFe(metin, cevirFn = metniBrailleyeCevir, kagitBoyutu) {
  const { hucreler } = cevirFn(metin, {
    buyukHarfIsareti: true,
    sayiIsareti: true,
  });
  return hucreleriBRFDizgesine(hucreler, kagitBoyutu);
}

function brfIcindekiSayfaMetinleri(brfDizgesi) {
  if (!brfDizgesi) return [];
  return brfDizgesi.split(/\r\n\f\r\n/).map((parca) => parca.replace(/\r\n/g, '\n')).filter((p) => p.length > 0);
}

function brfSatirininBrailleUnicodeKarsiligi(satir) {
  let cikti = '';
  for (let i = 0; i < satir.length; i++) {
    const pts = brfNoktalaradon(satir.charAt(i));
    if (pts === null) cikti += '\uFFFD';
    else cikti += noktalardanUnicode(pts);
  }
  return cikti;
}

const BRF_KAGIT_PRESET_STANDART = { id: 'standart', etiket: 'Standart (40 × 25)', satirdaHucre: 40, sayfadaSatir: 25 };
const BRF_KAGIT_PRESET_DAR_A4_OZERI = { id: 'dar', etiket: 'Dar sıra / geniş yazıcı (32 × 28)', satirdaHucre: 32, sayfadaSatir: 28 };

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

function hucreAnlamiBaglamVeModSifir(hucreler, opts) {

  const dotKey = (pts) => [...pts].sort((a, b) => a - b).join(',');
  // İsteğe bağlı: kaynak metin ve hücre-kaynak eşleme. Verildiğinde kısaltma
  // tespitini gerçek kaynak kelimeyle doğrular; örn. iki harfli kısaltma prefix'i
  // sıradan iki harfle karışmasın.
  const _kaynak = opts && typeof opts.kaynak === 'string' ? opts.kaynak : null;
  const _esleme = opts && Array.isArray(opts.esleme) ? opts.esleme : null;
  const _yorumTercihleri = opts && opts.yorumTercihleri && typeof opts.yorumTercihleri === 'object'
    ? opts.yorumTercihleri
    : {};
  const _paraBirimiKaynakAraliklari = opts && Array.isArray(opts.paraBirimiKaynakAraliklari)
    ? opts.paraBirimiKaynakAraliklari
    : (_kaynak ? paraBirimiKaynakSonEkiAraliklari(_kaynak) : []);
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

  /** Kaynak üzerinden saat kalıplarının kapalı [bas,bit) aralıkları (üst üste binmez). */
  const _saatKaynakAraliklari = !_kaynak ? [] : (() => {
    /** @type {{ bas: number, bit: number }[]} */
    const araliklar = [];
    let st = 0;
    while (st < _kaynak.length) {
      const sx = saatYazimiEslesmesi(_kaynak, st);
      if (sx) {
        araliklar.push({ bas: st, bit: st + sx.uzunluk });
        st += sx.uzunluk;
      } else {
        st++;
      }
    }
    return araliklar;
  })();

  const _saatKaynakIcindeMi = (kaynakIndeks) => (
    typeof kaynakIndeks === 'number'
    && kaynakIndeks >= 0
    && _saatKaynakAraliklari.some((t) => kaynakIndeks >= t.bas && kaynakIndeks < t.bit)
  );

  /** Bu hücre veya yakın önceki dolu kaynak eşlemesi bir saat ifadesinin parçası mı (– bağ, :, rakamlar). */
  const _saatHucreBaglamiMi = (cellIdx) => {
    if (!_kaynak || !_esleme || cellIdx < 0 || cellIdx >= hucreler.length) return false;
    const ki = _esleme[cellIdx];
    if (typeof ki === 'number' && ki >= 0 && _saatKaynakIcindeMi(ki)) return true;
    for (let geri = 1; geri <= 6 && cellIdx - geri >= 0; geri++) {
      const kj = _esleme[cellIdx - geri];
      if (typeof kj === 'number' && kj >= 0 && _saatKaynakIcindeMi(kj)) return true;
    }
    return false;
  };

  /** Bu hücrenin kaynak karakteri { } [ ] ( ) ise edebî “tek harf” sol/sağ sınırı sayılır; kısaltma parça [5–6]+… ile karışmasın. */
  const _matematikListeAyraçKaynağıMi = (cellIdx) => {
    if (!_kaynak || !_esleme || cellIdx < 0 || cellIdx >= hucreler.length) return false;
    const ki = _esleme[cellIdx];
    if (typeof ki !== 'number' || ki < 0 || ki >= _kaynak.length) return false;
    const ch = _kaynak[ki];
    return ch === '{' || ch === '}' || ch === '[' || ch === ']' || ch === '(' || ch === ')';
  };

  /** Nokta 1-2-3 / 4-5-6 hem mutlak çubuğu hem (ör.) "l" harfi olabilir; kaynakta `|` ise mutlak. */
  const mutlakDikeyCizgiKaynaklaUyusuyorMu = (cellIdx) => {
    if (!_kaynak || !_esleme || cellIdx < 0 || cellIdx >= hucreler.length) return null;
    const ki = _esleme[cellIdx];
    if (typeof ki !== 'number' || ki < 0 || ki >= _kaynak.length) return null;
    return _kaynak[ki] === '|';
  };

  /** Kaynak yok: tek küçük harf işareti (+ isteğe bağlı [6]) ile gelen 1-2-3 genelde "l", mutlak değil. */
  const mutlakDikeyCizgiLiteraryElleMuhtemelMi = (cellIdx) => {
    if (cellIdx < 0 || cellIdx >= hucreler.length) return false;
    if (dotKey(hucreler[cellIdx]) !== '1,2,3') return false;
    let j = cellIdx - 1;
    while (j >= 0 && hucreler[j].length === 0) j--;
    if (j < 0) return false;
    if (tekKucukHarfIsaretiMi(hucreler[j])) return true;
    if (!buyukHarfIsaretiMi(hucreler[j])) return false;
    let k = j - 1;
    while (k >= 0 && hucreler[k].length === 0) k--;
    return k >= 0 && tekKucukHarfIsaretiMi(hucreler[k]);
  };

  const mutlakDikeyCizgiHucresiMi = (cellIdx) => {
    const key = dotKey(hucreler[cellIdx]);
    if (key !== '1,2,3' && key !== '4,5,6') return false;
    const barKaynaktaMi = mutlakDikeyCizgiKaynaklaUyusuyorMu(cellIdx);
    if (barKaynaktaMi === true) return true;
    if (barKaynaktaMi === false) return false;
    if (key === '1,2,3' && mutlakDikeyCizgiLiteraryElleMuhtemelMi(cellIdx)) return false;
    return true;
  };

  const virgulListesiAyirMi = (hucre) =>
    [...hucre].sort((a, b) => a - b).join(',') === '2';
  const matematikSayiSinirAnahtarlari = new Set([
    // Binde (‰): tek hücre 1-2 (Tablo 31); rakam işaretinden hemen önce geçerli sınır
    '1,2',
    '1,2,6',
    '3,4,5',
    '3,4',
    '1,3,4,5,6',
    '1,3,5',
    '2,4,6',
    '2,3,5,6',
    '3,4,6',
    '3,5,6',
    '1,4,6',
    '2,3,6',
    '1,2,4',
    '1,5',
    '2,3,4,6',
    '2,4,5,6',
  ]);
  const sayiIsaretiOncesiSinirMi = (hucre) => (
    !hucre
    || hucre.length === 0
    || buyukHarfIsaretiMi(hucre)
    || _NOKTA_TERS.has(dotKey(hucre))
    || matematikSayiSinirAnahtarlari.has(dotKey(hucre))
    || dotKey(hucre) === '1,2,3'
    || dotKey(hucre) === '4,5,6'
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

  const mod = {
    sayiModu: false,
    siraSayiModu: false,
    buyukHarfBekle: false,
    tumKelimeBuyuk: false,
    ciftListeVirgulle: false,
    cListeSonTekIsaretSonrasi: false,
    paren24356Count: 0,
    mutlakDerinlik: 0,
  };
  const modTekIndeks = (i) => {
    const h = hucreler[i];
    if (h.length === 0) {
      mod.sayiModu = false;
      mod.siraSayiModu = false;
      mod.buyukHarfBekle = false;
      mod.tumKelimeBuyuk = false;
      mod.ciftListeVirgulle = false;
      mod.cListeSonTekIsaretSonrasi = false;
      return;
    }
    const key = dotKey(h);
    // Mutlak değer hücreleri (⠇ / ⠸) sayı modunu keser; edebî "l" ile aynı desen — kaynak veya önek ile ayır.
    if (key === '1,2,3' || key === '4,5,6') {
      if (mutlakDikeyCizgiHucresiMi(i)) {
        if (key === '1,2,3') mod.mutlakDerinlik++;
        else mod.mutlakDerinlik--;
        mod.sayiModu = false;
        mod.siraSayiModu = false;
        return;
      }
    }
    if (key === '2,3,5,6') mod.paren24356Count++;
    if (sayiIsaretiMi(h)) {
      const sonrakiH = i + 1 < hucreler.length ? hucreler[i + 1] : null;
      const oncekiH = i > 0 ? hucreler[i - 1] : null;
      if (sonrakiH && sayiIsaretiMi(sonrakiH)) {
        mod.sayiModu = true;
        mod.siraSayiModu = false;
        mod.ciftListeVirgulle = true;
        mod.cListeSonTekIsaretSonrasi = false;
        mod.buyukHarfBekle = false;
        mod.tumKelimeBuyuk = false;
        return;
      }
      const sonrakNormalRakam = sonrakiH && hucreyiRakamayap(sonrakiH);
      const sonrakSiraRakam = sonrakiH && hucreyiSiraSayisiRakaminaCevir(sonrakiH);
      const sonrakHarfliSayiHarf = harfliSayiHarfIsaretiMi(i + 1);
      if (oncekiH && sayiIsaretiMi(oncekiH) && sonrakiH && sonrakNormalRakam) {
        mod.sayiModu = true;
        mod.siraSayiModu = false;
        mod.buyukHarfBekle = false;
        mod.tumKelimeBuyuk = false;
        return;
      }
      if (mod.ciftListeVirgulle && sonrakiH && sonrakNormalRakam) {
        mod.cListeSonTekIsaretSonrasi = true;
        mod.sayiModu = true;
        mod.siraSayiModu = false;
        mod.buyukHarfBekle = false;
        mod.tumKelimeBuyuk = false;
        return;
      }
      if (sayiIsaretiOncesiSinirMi(oncekiH) && sonrakiH && (sonrakNormalRakam || sonrakSiraRakam || sonrakHarfliSayiHarf)) {
        mod.sayiModu = true;
        mod.siraSayiModu = !!sonrakSiraRakam && !sonrakNormalRakam;
        mod.buyukHarfBekle = false;
        mod.tumKelimeBuyuk = false;
        return;
      }
    }
    if (buyukHarfIsaretiMi(h)) {
      if (mod.buyukHarfBekle) { mod.tumKelimeBuyuk = true; mod.buyukHarfBekle = false; }
      else { mod.buyukHarfBekle = true; }
      return;
    }
    if (duzeltmeYabanciHarfIsaretiMi(h)) return;
    if (mod.sayiModu) {
      const matematikKapsami = matematikIslemIsaretiHucreKapsami(hucreler, i);
      if (!mod.siraSayiModu && matematikIsaretiSayiModunuKorurMu(matematikKapsami)) return;
      if (!mod.siraSayiModu && hucreyiRakamayap(h)) return;
      if (mod.siraSayiModu && hucreyiSiraSayisiRakaminaCevir(h)) return;
      if (!mod.siraSayiModu && harfliSayiHarfIsaretiMi(i)) return;
      if (!mod.siraSayiModu && buyukHarfIsaretiMi(h) && i > 0 && tekKucukHarfIsaretiMi(hucreler[i - 1])) return;
      if (!mod.siraSayiModu && harfliSayiHarfHucreMi(i)) return;
    if (
      !mod.siraSayiModu
      && dotKey(h) === '3'
      && i + 1 < hucreler.length
      && hucreyiRakamayap(hucreler[i + 1])
    ) {
      return;
    }
      if (tarihAyirmaIsaretiMi(h) && (_tarihHucreBaglamiMi(i) || _saatHucreBaglamiMi(i))) return;
      if (
        !mod.siraSayiModu
        && tarihAyirmaIsaretiMi(h)
        && i + 1 < hucreler.length
        && hucreyiRakamayap(hucreler[i + 1])
        && (_tarihHucreBaglamiMi(i) || _saatHucreBaglamiMi(i))
      ) {
        return;
      }
      if (
        !mod.siraSayiModu
        && dotKey(h) === '2,5'
        && i + 1 < hucreler.length
        && hucreyiRakamayap(hucreler[i + 1])
        && _saatHucreBaglamiMi(i)
      ) {
        return;
      }
      if (!mod.siraSayiModu && virgulListesiAyirMi(h) && mod.ciftListeVirgulle) return;
      if (
        !mod.siraSayiModu
        &&
        virgulListesiAyirMi(h)
        && !mod.ciftListeVirgulle
        && i + 1 < hucreler.length
        && hucreyiRakamayap(hucreler[i + 1])
      ) {
        return;
      }
      mod.sayiModu = false;
      mod.siraSayiModu = false;
      if (mod.cListeSonTekIsaretSonrasi) {
        mod.cListeSonTekIsaretSonrasi = false;
        mod.ciftListeVirgulle = false;
      }
    }
    mod.buyukHarfBekle = false;
  };
  return {
    dotKey,
    _kaynak,
    _esleme,
    _yorumTercihleri,
    _kaynakKelime,
    _kaynakKelimeBaslar,
    _kaynakKelimeSonEki,
    _kaynakTarihIcindeMi,
    _tarihHucreBaglamiMi,
    _saatKaynakAraliklari,
    _saatKaynakIcindeMi,
    _saatHucreBaglamiMi,
    _matematikListeAyraçKaynağıMi,
    mutlakDikeyCizgiHucresiMi,
    sayiIsaretiOncesiSinirMi,
    virgulListesiAyirMi,
    harfliSayiHarfIsaretiMi,
    harfliSayiHarfHucreMi,
    mod,
    modTekIndeks,
    _paraBirimiKaynakAraliklari,
  };
}


export function hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, ctx) {
  const {
    dotKey,
    _kaynak,
    _esleme,
    _yorumTercihleri,
    _kaynakKelime,
    _kaynakKelimeBaslar,
    _kaynakKelimeSonEki,
    _kaynakTarihIcindeMi,
    _tarihHucreBaglamiMi,
    _saatKaynakAraliklari,
    _saatKaynakIcindeMi,
    _saatHucreBaglamiMi,
    _matematikListeAyraçKaynağıMi,
    mutlakDikeyCizgiHucresiMi,
    sayiIsaretiOncesiSinirMi,
    virgulListesiAyirMi,
    harfliSayiHarfIsaretiMi,
    harfliSayiHarfHucreMi,
    mod,
    _paraBirimiKaynakAraliklari,
  } = ctx;
  const noktalar = hucreler[idx];
  if (noktalar.length === 0) {
    return {
      tip: 'bosluk',
      baslik: 'Boşluk',
      detay: 'Kelimeler veya sayılar arasındaki boşluk.',
      noktaStr: '—',
      etiket: '',
    };
  }
  const sayiModu = mod.sayiModu;
  const siraSayiModu = mod.siraSayiModu;
  const buyukHarfBekle = mod.buyukHarfBekle;
  const tumKelimeBuyuk = mod.tumKelimeBuyuk;
  const ciftListeVirgulle = mod.ciftListeVirgulle;
  const cListeSonTekIsaretSonrasi = mod.cListeSonTekIsaretSonrasi;

  const noktaStr = noktalar.join(' · ');
  const k = dotKey(noktalar);

  // Parantez açma/kapama: tek geçişte mod.paren24356Count ile
  const parenAcmaMi = () => (mod.paren24356Count % 2 === 0);
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
      || islem.ad === 'binde'
      || islem.ad === 'parantez açma'
      || islem.ad === 'parantez kapama'
      || islem.ad === 'köşeli parantez açma'
      || islem.ad === 'köşeli parantez kapama'
      || islem.ad === 'dış parantez açma'
      || islem.ad === 'dış parantez kapama'
      || islem.ad === 'kesir çizgisi'
    )
  );
  const belirsizTekHucreliIslemiAtlaMi = (islem) => {
    if (_kaynak || !belirsizTekHucreliIslemMi(islem)) return false;
    const onceki = oncekiDoluHucre(islem.baslangic);
    const sonraki = sonrakiDoluHucre(islem.baslangic);
    if (islem.ad === 'yüzde' || islem.ad === 'binde') {
      return !sayiIsaretiMi(sonraki);
    }
    if (islem.ad === 'parantez açma' || islem.ad === 'köşeli parantez açma' || islem.ad === 'dış parantez açma') {
      return !(sayiIsaretiMi(sonraki) || tekKucukHarfIsaretiMi(sonraki) || buyukHarfIsaretiMi(sonraki));
    }
    if (islem.ad === 'parantez kapama' || islem.ad === 'köşeli parantez kapama' || islem.ad === 'dış parantez kapama') {
      return !(sayiModu || sayiIsaretiMi(onceki) || tekKucukHarfIsaretiMi(onceki) || buyukHarfIsaretiMi(onceki));
    }
    if (islem.ad === 'kesir çizgisi') {
      return !(sayiIsaretiMi(onceki) || sayiIsaretiMi(sonraki));
    }
    return false;
  };
  const islemDetayiOlustur = (islem, hucreIdx) => {
    const noktaGosterimi = islem.hucreler.map((hucre) => hucre.join('-')).join(', ');
    if (islem.hucreler.length <= 1) {
      if (islem.aciklama) return `${islem.aciklama} Nokta gösterimi ${noktaGosterimi}.`;
      return `Matematik işlem işareti; nokta gösterimi ${noktaGosterimi}.`;
    }
    let baslangic = typeof islem.baslangic === 'number' ? islem.baslangic : hucreIdx;
    if (typeof islem.baslangic !== 'number' && _esleme) {
      const kaynakIndeksi = _esleme[hucreIdx];
      if (typeof kaynakIndeksi === 'number' && kaynakIndeksi >= 0) {
        while (baslangic > 0 && _esleme[baslangic - 1] === kaynakIndeksi) baslangic--;
      }
    }
    const seciliHucreNo = hucreIdx - baslangic + 1;
    const hucreAciklamalari = islem.hucreler
      .map((hucre, indeks) => `${indeks + 1}. hücre: Nokta ${hucre.join(' · ')}.`)
      .join(' ');
    const temelAciklama = islem.aciklama
      ? `${islem.aciklama} `
      : 'Matematik işlem işareti. ';
    const seciliHucreMetni = seciliHucreNo >= 1 && seciliHucreNo <= islem.hucreler.length
      ? `Seçili hücre ${seciliHucreNo}. hücre. `
      : '';
    return `${temelAciklama}${islem.hucreler.length} hücreden oluşur. ${seciliHucreMetni}${hucreAciklamalari}`.trim();
  };
  const kaynakHucreIdx = _esleme ? _esleme[idx] : -1;
  const kaynaktaMatematikEksiMi =
    typeof kaynakHucreIdx === 'number'
    && kaynakHucreIdx >= 0
    && _kaynak
    && matematikIslemIsaretiMetinEslesmesi(_kaynak, kaynakHucreIdx, _yorumTercihleri)?.ad === 'eksi';
  const kaynakTireTercihi = _kaynak
    && typeof kaynakHucreIdx === 'number'
    && kaynakHucreIdx >= 0
    && _kaynak[kaynakHucreIdx] === '-'
    && _yorumTercihleri?.[kaynakHucreIdx]?.eksiTire
    && !metindeMutlakDegerIcindeMi(_kaynak, kaynakHucreIdx)
    && !kaynaktaMatematikEksiMi;
  if (kaynakTireTercihi) {
    return {
      tip: 'noktalama',
      baslik: 'Noktalama: tire (-)',
      detay: 'Bu çizgi ayardan dolayı matematikte eksi yerine tire olarak yorumlanır.',
      noktaStr,
      isaret: '-',
    };
  }
  if (
    k === '1,2,3'
    && _kaynak
    && typeof kaynakHucreIdx === 'number'
    && kaynakHucreIdx >= 0
    && _kaynak[kaynakHucreIdx] === '1'
  ) {
    return {
      tip: 'rakam',
      baslik: 'Rakam: 1',
      detay: 'Kaynak metinde rakam 1 yazılıdır; gösterim bazen “l” harfi hücresi ile çakışabilir.',
      noktaStr,
    };
  }
  if (k === '1,2,3' || k === '4,5,6') {
    if (mutlakDikeyCizgiHucresiMi(idx)) {
      const tip = k === '1,2,3' ? 'Açma' : 'Kapama';
      return {
        tip: 'islem',
        baslik: `Mutlak Değer ${tip}`,
        detay: `Mutlak değer sembolünün ${tip.toLowerCase()} hücresi.`,
        noktaStr,
        etiket: '|',
      };
    }
  }
  if (k === '5,6') {
    let sj = idx + 1;
    while (sj < hucreler.length && hucreler[sj].length === 0) sj++;
    if (sj < hucreler.length && dotKey(hucreler[sj]) === '3,6') {
      return {
        tip: 'islem',
        baslik: 'Eksi İşareti (Ön ek)',
        detay: 'Nokta 5 · 6. Matematiksel eksi işaretinin birinci hücresi.',
        noktaStr,
        etiket: '-',
      };
    }
  }
  if (k === '3,6') {
    let pj = idx - 1;
    while (pj >= 0 && hucreler[pj].length === 0) pj--;
    if (pj >= 0 && dotKey(hucreler[pj]) === '5,6') {
      return {
        tip: 'islem',
        baslik: 'Eksi İşareti',
        detay: 'Nokta 3 · 6. Matematiksel eksi işaretinin ikinci hücresi.',
        noktaStr,
        etiket: '',
      };
    }
  }
  const kaynakIslem = _kaynak && typeof kaynakHucreIdx === 'number' && kaynakHucreIdx >= 0
    ? matematikIslemIsaretiMetinEslesmesi(_kaynak, kaynakHucreIdx, _yorumTercihleri)
    : null;
  if (kaynakIslem) {
    const ilkHucre = idx === 0 || !_esleme || _esleme[idx - 1] !== kaynakHucreIdx;
    return {
      tip: 'islem',
      baslik: `İşlem işareti: ${kaynakIslem.ad} (${kaynakIslem.sembol})`,
      detay: islemDetayiOlustur(kaynakIslem, idx),
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
        detay: islemDetayiOlustur(islemKapsami, idx),
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
  const paraVeyaOlcuAraliklari = Array.isArray(_paraBirimiKaynakAraliklari) ? _paraBirimiKaynakAraliklari : [];
  const isParaVeyaOlcu = !!(_esleme && hucreParaBirimiKaynakBaglamiMi(_esleme, idx, paraVeyaOlcuAraliklari));
  if (isParaVeyaOlcu) {
    const kaynakIdxBirim = hucreBirimKaynakIndeksiniCoz(_esleme, idx);
    const birimBilgisi = kaynakIdxBirim >= 0
      ? paraVeyaOlcuAraliklari.find((a) => kaynakIdxBirim >= a.bas && kaynakIdxBirim < a.son)
      : null;
    const kaynakDogrudan = typeof _esleme?.[idx] === 'number' ? _esleme[idx] : -1;
    const birimMetni = birimBilgisi
      ? (birimBilgisi.metin ?? birimBilgisi.birim ?? '').toLocaleUpperCase('tr')
      : 'Birim';
    if (
      k === '5,6'
      && (kaynakDogrudan < 0 || (birimBilgisi && kaynakDogrudan === birimBilgisi.bas))
    ) {
      return {
        tip: 'noktalama',
        baslik: 'Birim Başlangıç İşareti',
        detay: birimBilgisi
          ? `Sayıdan sonra gelen "${birimMetni}" birimini başlatır (nokta 5 · 6).`
          : 'Ölçü veya para biriminin başlangıcını gösterir (nokta 5 · 6).',
        noktaStr,
        etiket: '⠰',
      };
    }
    if (
      birimBilgisi
      && kaynakDogrudan >= birimBilgisi.bas
      && kaynakDogrudan < birimBilgisi.son
      && _kaynak
    ) {
      const harf = _kaynak[kaynakDogrudan];
      return {
        tip: 'noktalama',
        baslik: `Birim Harfi: ${harf}`,
        detay: `Birim içindeki karakter. Birimlerde ek işaret (büyük harf veya tek harf ön işareti) kullanılmaz.`,
        noktaStr,
        etiket: harf,
      };
    }
    return {
      tip: 'noktalama',
      baslik: `Birim: ${birimMetni}`,
      detay: `Sayıdan sonra gelen "${birimMetni}" ölçü/para biriminin parçasıdır.`,
      noktaStr,
      etiket: '',
    };
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
    let harfIdx = idx + 1;
    if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
    if (harfIdx < hucreler.length && duzeltmeYabanciHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
    if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
    const harf = harfIdx < hucreler.length
      ? (duzeltmeliHucreyiMetneCevir(hucreler[harfIdx]) || hucreyiKarakteryap(hucreler[harfIdx]))
      : null;
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
    const _kumeAcmaIkinciHucreMi = (cellIdx) => {
      if (cellIdx <= 0) return false;
      return dotKey(hucreler[cellIdx]) === '3'
        && dotKey(hucreler[cellIdx - 1]) === '1,2,3,5,6';
    };
    const _isNoktalamaHucre = (h, i) => {
      if (!h || h.length === 0) return false;
      const kk = dotKey(h);
      if (!_NOKTA_TERS.has(kk)) return false;
      // Küme açmanın 2. hücresi yalnızca nokta 3; kesme ile aynı desen. Noktalama sanılırsa
      // "{" yanındaki harfler için kısaltma sınırları bozulur.
      if (kk === '3' && (_tekHarfAyirmaIsaretiMi(i) || _kumeAcmaIkinciHucreMi(i))) return false;
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
      if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) {
        harfIdx++;
        buyuk = true;
      }
      if (harfIdx < hucreler.length && duzeltmeYabanciHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
      if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) {
        harfIdx++;
        buyuk = true;
      }
      if (harfIdx >= hucreler.length) return null;
      const harf = duzeltmeliHucreyiMetneCevir(hucreler[harfIdx]) || hucreyiKarakteryap(hucreler[harfIdx]);
      if (!harf || harf === ' ') return null;
      const onceki = cellIdx > 0 ? hucreler[cellIdx - 1] : null;
      const sonraki = harfIdx + 1 < hucreler.length ? hucreler[harfIdx + 1] : null;
      const solSinir = cellIdx === 0 || !onceki || onceki.length === 0
        || _isNoktalamaHucre(onceki, cellIdx - 1)
        || _matematikListeAyraçKaynağıMi(cellIdx - 1);
      const sagSinir = !sonraki || sonraki.length === 0
        || _isNoktalamaHucre(sonraki, harfIdx + 1)
        || _matematikListeAyraçKaynağıMi(harfIdx + 1);
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
      // Kaynak metin ve eşleme verilmişse: bu hücreye karşılık gelen kaynak karakter
      // gerçek bir noktalama karakteri (".", ",", "?", "!" vb.) ise doğrudan noktalama
      // olarak yorumla. Aksi halde "ka" hecesi gibi aynı noktaları paylaşan hece
      // kısaltmalarıyla yanlış eşleşme yaşanır (örn. "a.b" → ".", "ka" değil).
      if (_kaynak && _esleme) {
        const kaynakIdx = _esleme[idx];
        if (typeof kaynakIdx === 'number' && kaynakIdx >= 0 && kaynakIdx < _kaynak.length) {
          const kaynakKarakter = _kaynak[kaynakIdx];
          // np.isaret tam eşleşme veya alternatif tırnak/parantez vb. varyantları
          const noktalamaKarakteri = NOKTALAMA.some((n) => n.isaret === kaynakKarakter);
          if (noktalamaKarakteri) {
            const np2 = parenSwap(np);
            return {
              tip: 'noktalama',
              baslik: `Noktalama: ${np2.isim} (${np2.isaret})`,
              detay: `Nokta ${noktaStr}`,
              noktaStr,
              isaret: np2.isaret,
            };
          }
          // Kaynak karakter bir harf ise (örn. "kalın" kelimesindeki "ka") noktalama
          // değildir; hece olarak kalsın.
          if (/\p{L}/u.test(kaynakKarakter)) {
            // np kullanma; aşağıdaki hece bloğuna düşsün
          } else {
            // Diğer durumlar için aşağıdaki heuristik devreye girsin
          }
        }
      }
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


/** Sayfa aralığındaki hücre anlamlarını tek doğrusal geçişte üretir (O sayfa başına). */
export function sayfaAnlamlariniTopluHesapla(hucreler, sayfaBas, sayfaSon, kisaltmaAktif, opts) {
  const sonuclar = [];
  const bg = hucreAnlamiBaglamVeModSifir(hucreler, opts);
  const { mod, modTekIndeks } = bg;
  const bd = opts && opts.baslangicDurumu;
  if (bd) {
    Object.assign(mod, bd);
  } else {
    for (let i = 0; i < sayfaBas; i++) modTekIndeks(i);
  }
  for (let i = sayfaBas; i < sayfaSon; i++) {
    const anlam = hucreAnlamiTekil(hucreler, i, kisaltmaAktif, bg);
    sonuclar.push(anlam);
    modTekIndeks(i);
  }
  return sonuclar;
}


/**
 * Tıklanan braille hücresinin anlamını döndürür.
 * Bağlam takibi (sayı modu / büyük harf bekleme) için idx öncesindeki
 * hücreler taranır.
 */
export function hucreAnlami(hucreler, idx, kisaltmaAktif, opts) {
  const bg = hucreAnlamiBaglamVeModSifir(hucreler, opts);
  const { mod, modTekIndeks } = bg;
  const baslangicHucre = opts && typeof opts.baslangicHucre === 'number' ? opts.baslangicHucre : 0;
  const bd = opts && opts.baslangicDurumu;
  const checkpointKullan = bd != null && baslangicHucre >= 0 && baslangicHucre <= idx;
  if (checkpointKullan) {
    mod.sayiModu = !!bd.sayiModu;
    mod.siraSayiModu = !!bd.siraSayiModu;
    mod.buyukHarfBekle = !!bd.buyukHarfBekle;
    mod.tumKelimeBuyuk = !!bd.tumKelimeBuyuk;
    mod.ciftListeVirgulle = !!bd.ciftListeVirgulle;
    mod.cListeSonTekIsaretSonrasi = !!bd.cListeSonTekIsaretSonrasi;
    mod.paren24356Count = typeof bd.paren24356Count === 'number' ? bd.paren24356Count : 0;
    mod.mutlakDerinlik = typeof bd.mutlakDerinlik === 'number' ? bd.mutlakDerinlik : 0;
    for (let i = baslangicHucre; i < idx; i++) modTekIndeks(i);
  } else {
    for (let i = 0; i < idx; i++) modTekIndeks(i);
  }
  return hucreAnlamiTekil(hucreler, idx, kisaltmaAktif, bg);
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
    '1,2',
    '1,2,6',
    '3,4,5',
    '3,4',
    '1,3,4,5,6',
    '1,3,5',
    '2,4,6',
    '2,3,5,6',
    '3,4,6',
    '3,5,6',
    '1,4,6',
    '2,3,6',
    '1,2,4',
    '1,5',
    '2,3,4,6',
    '2,4,5,6',
  ]);
  const sayiIsaretiOncesiSinirMi = (hucre) => {
    const a = !hucre || hucre.length === 0 ? '' : noktalariAnahtara(hucre);
    return (
      !hucre
      || hucre.length === 0
      || buyukHarfIsaretiMi(hucre)
      || noktalamaHucreMi(hucre)
      || matematikSayiSinirAnahtarlari.has(a)
      || a === '1,2,3'
      || a === '4,5,6'
    );
  };
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

// Matematik / özel işaret paleti — tıklayınca textarea'ya eklenir.
// Buradaki tüm karakterler `brailleCevir.js` tarafından doğrudan tanınır.
const MATEMATIK_PALETI = [
  {
    baslik: 'Temel İşlemler',
    semboller: [
      { sembol: '+', etiket: 'artı' },
      { sembol: '-', etiket: 'eksi' },
      { sembol: '×', etiket: 'çarpma' },
      { sembol: '÷', etiket: 'bölme' },
      { sembol: '=', etiket: 'eşittir' },
      { sembol: '±', etiket: 'artı eksi' },
      { sembol: '•', etiket: 'skaler çarpma' },
      { sembol: '/', etiket: 'kesir / bölü' },
      { sembol: '%', etiket: 'yüzde' },
      { sembol: '‰', etiket: 'binde' },
    ],
  },
  {
    baslik: 'Karşılaştırma',
    semboller: [
      { sembol: '<', etiket: 'küçüktür' },
      { sembol: '>', etiket: 'büyüktür' },
      { sembol: '≤', etiket: 'küçük eşit' },
      { sembol: '≥', etiket: 'büyük eşit' },
      { sembol: '≠', etiket: 'eşit değildir' },
      { sembol: '≡', etiket: 'denklik' },
      { sembol: '≢', etiket: 'denk değildir' },
    ],
  },
  {
    baslik: 'Parantezler',
    semboller: [
      { sembol: '(', etiket: 'parantez aç' },
      { sembol: ')', etiket: 'parantez kapa' },
      { sembol: '[', etiket: 'köşeli aç' },
      { sembol: ']', etiket: 'köşeli kapa' },
      { sembol: '{', etiket: 'küme aç' },
      { sembol: '}', etiket: 'küme kapa' },
    ],
  },
  {
    baslik: 'Mutlak değer',
    semboller: [
      { sembol: '|', etiket: 'açma' },
      { sembol: '|', etiket: 'kapama' },
    ],
  },
  {
    baslik: 'Kümeler',
    semboller: [
      { sembol: '⊂', etiket: 'alt küme' },
      { sembol: '⊃', etiket: 'kapsar' },
      { sembol: '∈', etiket: 'elemanıdır' },
      { sembol: '∪', etiket: 'birleşim' },
      { sembol: '∩', etiket: 'kesişim' },
      { sembol: '\\', etiket: 'fark' },
    ],
  },
  {
    baslik: 'Üs · Kök · Açı',
    semboller: [
      { sembol: '^', etiket: 'üs (üstlü ifade)' },
      { sembol: '√', etiket: 'karekök' },
      { sembol: '°', etiket: 'derece / açı' },
    ],
  },
];

export default function Araclar() {
  const [perkinsAktif, setPerkinsAktif] = useState(true);
  const [kisaltmaAktif, setKisaltmaAktif] = useState(true);

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
  const [matematikPaletiAcik, setMatematikPaletiAcik] = useState(false);
  const matematikPaletRef = useRef(null);
  const [seciliHucre, setSeciliHucre] = useState(null); // { index }
  const [metinSecimHucreAraligi, setMetinSecimHucreAraligi] = useState(null); // { lo, hi } | null — textarea seçimine göre doldurulabilir
  const [genisletAktif, setGenisletAktif] = useState(true);
  const [erisilebilirMod, setErisilebilirMod] = useState(false);
  const [tabletModuAktif, setTabletModuAktif] = useState(false);
  const [brfOnizlemeAcik, setBrfOnizlemeAcik] = useState(false);
  const [brfOnizlemePreset, setBrfOnizlemePreset] = useState('standart'); // standart | dar | ozel
  const [brfOnizlemeOzelHucre, setBrfOnizlemeOzelHucre] = useState(String(SATIRDA_HUCRE));
  const [brfOnizlemeOzelSatir, setBrfOnizlemeOzelSatir] = useState(String(SAYFADA_SATIR));
  const [kopyalandi, setKopyalandi] = useState(false);
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

  // Matematik paleti dışına tıklayınca veya Escape ile kapat
  useEffect(() => {
    if (!matematikPaletiAcik) return;
    const handleClick = (e) => {
      if (matematikPaletRef.current && !matematikPaletRef.current.contains(e.target)) {
        setMatematikPaletiAcik(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setMatematikPaletiAcik(false); };
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [matematikPaletiAcik]);

  useEffect(() => {
    if (!brfOnizlemeAcik) return;
    const kap = (e) => {
      if (e.key === 'Escape') setBrfOnizlemeAcik(false);
    };
    window.addEventListener('keydown', kap);
    return () => window.removeEventListener('keydown', kap);
  }, [brfOnizlemeAcik]);

  // ── Metin → BRF ──
  const [girisMetni, setGirisMetni] = useState('');
  const durumRef = useRef(yeniYazmaDurumu());
  const textareaRef = useRef(null);
  /** Tıklama işleyicide güncel eşleme/kaynak — closure eski değer tutmasın diye ref. */
  const brailleSecimRef = useRef({ esleme: [], hucreSayisi: 0, kaynak: '' });
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

  const brfOnizlemeKagitBoyutu = useMemo(() => {
    if (brfOnizlemePreset === BRF_KAGIT_PRESET_STANDART.id)
      return { satirdaHucre: BRF_KAGIT_PRESET_STANDART.satirdaHucre, sayfadaSatir: BRF_KAGIT_PRESET_STANDART.sayfadaSatir };
    if (brfOnizlemePreset === BRF_KAGIT_PRESET_DAR_A4_OZERI.id)
      return { satirdaHucre: BRF_KAGIT_PRESET_DAR_A4_OZERI.satirdaHucre, sayfadaSatir: BRF_KAGIT_PRESET_DAR_A4_OZERI.sayfadaSatir };
    return brfKagitBoyutunuDuzeltGirdi({
      satirdaHucre: Number.parseInt(String(brfOnizlemeOzelHucre), 10),
      sayfadaSatir: Number.parseInt(String(brfOnizlemeOzelSatir), 10),
    });
  }, [brfOnizlemePreset, brfOnizlemeOzelHucre, brfOnizlemeOzelSatir]);

  /** Çeviri: kısa metin anlık (Worker yok); uzun metinde Worker + debounce. */
  const [cevirSonuc, setCevirSonuc] = useState({ hucreler: [], esleme: [], kaynak: '' });
  const cevirWorkerRef = useRef(null);
  const cevirIstekRef = useRef(0);
  const cevirDebounceRef = useRef(null);

  useEffect(() => {
    const w = new Worker(new URL('../workers/araclarCevir.worker.js', import.meta.url), { type: 'module' });
    cevirWorkerRef.current = w;
    w.onmessage = (ev) => {
      const d = ev.data;
      if (!d || typeof d.requestId !== 'number') return;
      if (d.requestId !== cevirIstekRef.current) return;
      if (d.ok) {
        setCevirSonuc({ hucreler: d.hucreler, esleme: d.esleme, kaynak: d.kaynak });
      }
    };
    return () => {
      w.terminate();
      cevirWorkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (cevirDebounceRef.current != null) {
      clearTimeout(cevirDebounceRef.current);
      cevirDebounceRef.current = null;
    }
    const w = cevirWorkerRef.current;
    if (!w) return;
    if (!girisMetni) {
      cevirIstekRef.current += 1;
      setCevirSonuc({ hucreler: [], esleme: [], kaynak: '' });
      return;
    }
    const temel = kisaltmaAktif ? kisaltmaSistemler : TUM_HUCRE_AYARLARI_KAPALI;
    const kisaltmali = hucreYorumlariAktif;
    const opts = kisaltmali
      ? {
          buyukHarfIsareti: true,
          sayiIsareti: true,
          ...temel,
          kelimeTercihleri: kelimeBazliKisaltmaTercihleri,
          yorumTercihleri: karakterYorumTercihleri,
        }
      : {
          buyukHarfIsareti: true,
          sayiIsareti: true,
          yorumTercihleri: karakterYorumTercihleri,
        };

    if (girisMetni.length <= ARACLAR_CEVIR_ANLIK_MAX_UZUNLUK) {
      cevirIstekRef.current += 1;
      const requestId = cevirIstekRef.current;
      try {
        const r = kisaltmali
          ? metniBrailleyeCevirKisaltmali(girisMetni, opts)
          : metniBrailleyeCevir(girisMetni, opts);
        if (requestId !== cevirIstekRef.current) return;
        setCevirSonuc({ hucreler: r.hucreler, esleme: r.esleme, kaynak: girisMetni });
      } catch (err) {
        console.error('Braille çeviri hatası:', err);
      }
      return;
    }

    cevirIstekRef.current += 1;
    const requestId = cevirIstekRef.current;
    cevirDebounceRef.current = setTimeout(() => {
      cevirDebounceRef.current = null;
      if (cevirWorkerRef.current !== w) return;
      w.postMessage({ text: girisMetni, kisaltmali, opts, requestId });
    }, ARACLAR_CEVIR_WORKER_DEBOUNCE_MS);

    return () => {
      if (cevirDebounceRef.current != null) {
        clearTimeout(cevirDebounceRef.current);
        cevirDebounceRef.current = null;
      }
    };
  }, [girisMetni, hucreYorumlariAktif, kisaltmaAktif, kisaltmaSistemler, kelimeBazliKisaltmaTercihleri, karakterYorumTercihleri]);

  const hucrelerCache = cevirSonuc.hucreler;
  const eslemeCache = cevirSonuc.esleme;
  const kaynakCache = cevirSonuc.kaynak;

  /** BRF ön izleme: mevcut hücre önbelleğinden (Worker/anh çeviri tek); modal kapalıyken hesaplanmaz. */
  const brfOnizlemeDosyaMetni = useMemo(() => {
    if (!brfOnizlemeAcik) return '';
    if (!(girisMetni || '').trim()) return '';
    if (!hucrelerCache.length) return '';
    try {
      return hucreleriBRFDizgesine(hucrelerCache, brfOnizlemeKagitBoyutu);
    } catch (err) {
      console.error('BRF ön izleme hatası:', err);
      return '';
    }
  }, [brfOnizlemeAcik, girisMetni, hucrelerCache, brfOnizlemeKagitBoyutu]);

  const brfOnizlemeSayfalari = useMemo(
    () => brfIcindekiSayfaMetinleri(brfOnizlemeDosyaMetni),
    [brfOnizlemeDosyaMetni],
  );

  /** Ön izleme açıkken Unicode satırları tek seferde (render içinde tekrar hesaplama yok). */
  const brfOnizlemeUnicodeSayfalari = useMemo(() => {
    if (!brfOnizlemeAcik || brfOnizlemeSayfalari.length === 0) return [];
    return brfOnizlemeSayfalari.map((sayfaMetni) =>
      sayfaMetni.split('\n').map((satir) => brfSatirininBrailleUnicodeKarsiligi(satir)),
    );
  }, [brfOnizlemeAcik, brfOnizlemeSayfalari]);

  const paraBirimiKaynakAraliklari = useMemo(
    () => paraBirimiKaynakSonEkiAraliklari(kaynakCache || ''),
    [kaynakCache],
  );
  useEffect(() => {
    brailleSecimRef.current = {
      esleme: eslemeCache,
      hucreSayisi: hucrelerCache.length,
      kaynak: kaynakCache,
    };
  }, [eslemeCache, hucrelerCache, kaynakCache]);
  const seciliHucreDetayi = useMemo(() => {
    if (!seciliHucre || typeof seciliHucre.index !== 'number') return null;
    if (seciliHucre.index < 0 || seciliHucre.index >= hucrelerCache.length) return null;
    return {
      index: seciliHucre.index,
      anlam: hucreAnlami(hucrelerCache, seciliHucre.index, hucreYorumlariAktif, {
        kaynak: kaynakCache,
        esleme: eslemeCache,
        yorumTercihleri: karakterYorumTercihleri,
        paraBirimiKaynakAraliklari,
      }),
    };
  }, [seciliHucre, hucrelerCache, hucreYorumlariAktif, kaynakCache, eslemeCache, karakterYorumTercihleri, paraBirimiKaynakAraliklari]);

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
  const brailleSayfaBoyutu = tabletModuAktif ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
  const toplamSayfa = Math.max(1, Math.ceil(hucrelerCache.length / brailleSayfaBoyutu));
  const sayfaBaslangic = brailleSayfa * brailleSayfaBoyutu;
  const sayfaHucreler = hucrelerCache.slice(sayfaBaslangic, sayfaBaslangic + brailleSayfaBoyutu);
  const sayfaSonIndeks = sayfaBaslangic + sayfaHucreler.length;
  const sayfaHucreAnlamlari = useMemo(() => {
    if (!girisMetni || sayfaHucreler.length === 0) return [];
    return sayfaAnlamlariniTopluHesapla(
      hucrelerCache,
      sayfaBaslangic,
      sayfaSonIndeks,
      hucreYorumlariAktif,
      {
        kaynak: kaynakCache,
        esleme: eslemeCache,
        yorumTercihleri: karakterYorumTercihleri,
        paraBirimiKaynakAraliklari,
      },
    );
  }, [
    brailleSayfa,
    girisMetni,
    hucrelerCache,
    sayfaBaslangic,
    sayfaSonIndeks,
    hucreYorumlariAktif,
    kaynakCache,
    eslemeCache,
    karakterYorumTercihleri,
    paraBirimiKaynakAraliklari,
  ]);

  /** Erişilebilir + tablet: Unicode satırı render içinde tekrar hesaplanmasın. */
  const erisilebilirTabletUnicodeHucreleri = useMemo(() => {
    if (!erisilebilirMod || !tabletModuAktif || !girisMetni) return null;
    if (sayfaSonIndeks <= sayfaBaslangic) return [];
    const dilim = hucrelerCache.slice(sayfaBaslangic, sayfaSonIndeks);
    return dilim.map((noktalar) => noktalardanUnicode(tabletDelikAynala(noktalar)));
  }, [
    erisilebilirMod,
    tabletModuAktif,
    girisMetni,
    hucrelerCache,
    sayfaBaslangic,
    sayfaSonIndeks,
  ]);

  /** Tablet sıraları için sayfa içi yerel indeks grupları (her biri en çok 28 hücre). */
  const tabletSatirYerelleri = useMemo(() => {
    const n = sayfaHucreler.length;
    const satirlar = [];
    for (let b = 0; b < n; b += TABLET_SATIR_HUCRE) {
      const yerel = [];
      for (let j = b; j < Math.min(b + TABLET_SATIR_HUCRE, n); j++) yerel.push(j);
      satirlar.push(yerel);
    }
    return satirlar;
  }, [sayfaBaslangic, sayfaHucreler.length]);

  // Hücre popup: sayfa / metin / kısaltma modu değişince kapat. Metin→Braille vurgusu (metinSecimHucreAraligi)
  // ayrı senkronize edilir; sayfa zıplamasında silinmesin.
  useEffect(() => { setSeciliHucre(null); }, [brailleSayfa, kisaltmaAktif, girisMetni]);
  useEffect(() => { setMetinSecimHucreAraligi(null); }, [kisaltmaAktif, girisMetni]);

  const hucreTiklandigindaMetniSec = useCallback((globalIdx) => {
    const ta = textareaRef.current;
    const { esleme, hucreSayisi, kaynak } = brailleSecimRef.current;
    if (!ta || !esleme || globalIdx < 0 || globalIdx >= hucreSayisi) return;

    let targetIdx = globalIdx;
    while (targetIdx < hucreSayisi && esleme[targetIdx] === -1) targetIdx++;
    if (targetIdx >= hucreSayisi || esleme[targetIdx] === undefined) {
      targetIdx = globalIdx;
      while (targetIdx >= 0 && esleme[targetIdx] === -1) targetIdx--;
    }

    const baseCharIdx = esleme[targetIdx];
    if (baseCharIdx === undefined || baseCharIdx === -1) return;

    /** @type {number[]} */
    const cluster = [];
    let k = targetIdx;
    while (k > 0 && esleme[k - 1] === baseCharIdx) k--;
    while (k < hucreSayisi && esleme[k] === baseCharIdx) {
      cluster.push(k);
      k++;
    }

    let offset = 0;
    let targetLen = 1;

    for (const hIdx of cluster) {
      const anlam = hucreAnlami(hucrelerCache, hIdx, hucreYorumlariAktif, {
        kaynak,
        esleme,
        yorumTercihleri: karakterYorumTercihleri,
        paraBirimiKaynakAraliklari: paraBirimiKaynakSonEkiAraliklari(kaynak || ''),
      });

      const isIndicator = anlam.tip === 'isaret' && !anlam.etiket;

      let cellLen = 1;
      if (anlam.etiket) {
        if (anlam.etiket.includes(',')) {
          cellLen = anlam.etiket.split(',')[0].trim().length;
        } else {
          cellLen = anlam.etiket.length;
        }
      } else if (anlam.tip === 'harf' || anlam.tip === 'rakam' || anlam.tip === 'bosluk') {
        cellLen = 1;
      }

      const actualLen = isIndicator ? 0 : cellLen;

      if (hIdx === targetIdx) {
        targetLen = actualLen || 1;
        break;
      }
      offset += actualLen;
    }

    const finalStart = baseCharIdx + offset;
    const finalEnd = finalStart + targetLen;

    ta.focus();
    ta.setSelectionRange(finalStart, finalEnd);

    // Kendi kendine scroll etmesi için modern tarayıcılarda blur/focus hilesi veya enterline
    // Eğer tarayıcı otomatik kaydırmıyorsa, sahte div ile scroll pozisyonu bulunur:
    const div = document.createElement('div');
    const style = window.getComputedStyle(ta);
    const props = [
      'direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY',
      'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle',
      'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily',
      'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'
    ];
    props.forEach((p) => { div.style[p] = style[p]; });
    
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    
    // İşletim sistemine ve scrollbar'a göre width sapmasını engellemek için scroll dışı net genişlik:
    div.style.width = `${ta.clientWidth}px`;
    if (style.boxSizing === 'border-box') {
      div.style.width = `${ta.offsetWidth}px`; // border-box ise offsetWidth sınırları tam kapsar
    }

    // Metnin textarea ile aynı kırılmasını sağlamak için
    div.textContent = ta.value.substring(0, finalStart);
    // Eğer metin yeni satırla bitiyorsa, div'de bunun etkili olması için boşluk ekle
    if (div.textContent.endsWith('\n')) {
      div.textContent += ' ';
    }
    
    const span = document.createElement('span');
    span.textContent = ta.value.substring(finalStart, finalEnd) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    
    const pixelTop = span.offsetTop;
    document.body.removeChild(div);

    // native auto-scroll tetiklemek için bir de blur/focus atıyoruz, 
    // scrollTo ise tam ortaya getirmeyi dener.
    ta.blur();
    ta.focus();
    ta.setSelectionRange(finalStart, finalEnd);

    ta.scrollTo({
      top: Math.max(0, pixelTop - (ta.clientHeight / 2) + parseInt(style.paddingTop || 0, 10)),
      behavior: 'smooth',
    });

    setSeciliHucre({ index: globalIdx });
    setMetinSecimHucreAraligi(null);
  }, [hucrelerCache, hucreYorumlariAktif, karakterYorumTercihleri]);

  const getHucreTipiRengi = (anlam, paraBirimiHucre) => {
    if (paraBirimiHucre) return 'var(--braille-noktalama-fill)';
    const baslikStr = anlam && typeof anlam.baslik === 'string' ? anlam.baslik : '';
    if (baslikStr.includes('Birim')) return 'var(--braille-noktalama-fill)';
    if (!anlam) return '#3b82f6';
    const baslikMetni = baslikStr;

    const isKisaltma = anlam.tip === 'kisaltma'
      || (anlam.tip === 'isaret' && (baslikMetni.includes('Kök') || baslikMetni.includes('Parça') || baslikMetni.includes('Ayırma')));
    if (isKisaltma) return '#ef4444';

    if (anlam.tip === 'noktalama') return '#10b981';

    if (anlam.tip === 'islem' || (anlam.tip === 'isaret' && baslikMetni.includes('Bölük'))) return '#7c3aed';

    if (anlam.tip === 'isaret') return '#000000';

    return '#3b82f6';
  };

  const senkronizeMetinSecimVurgusu = useCallback(() => {
    const ta = textareaRef.current;
    const { esleme, hucreSayisi, kaynak } = brailleSecimRef.current;

    if (!ta || !hucreSayisi || !Array.isArray(esleme) || ta.selectionStart === ta.selectionEnd) {
      setMetinSecimHucreAraligi(null);
      return;
    }

    const sStart = ta.selectionStart;
    const sEnd = ta.selectionEnd;

    // Uzun seçimlerde (birden fazla kelime veya çok karakter) braille eşleştirme döngüsü sayfayı kilitleyebilir
    const seciliMetin = ta.value.substring(sStart, sEnd).trim();
    if (seciliMetin.includes(' ') || seciliMetin.includes('\n') || seciliMetin.length > 50) {
      setMetinSecimHucreAraligi(null);
      return;
    }

    let bulunanMinH = Infinity;
    let bulunanMaxH = -1;

    const anlamPaylas = {
      kaynak,
      esleme,
      yorumTercihleri: karakterYorumTercihleri,
      paraBirimiKaynakAraliklari: paraBirimiKaynakSonEkiAraliklari(kaynak || ''),
    };

    const bg = hucreAnlamiBaglamVeModSifir(hucrelerCache, anlamPaylas);
    const modCache = [];
    let sonMod = { ...bg.mod };

    const hizliHucreAnlami = (j) => {
      // bg.mod'u her zaman en uç (son) noktaya getir
      Object.assign(bg.mod, sonMod);
      while (modCache.length <= j) {
        modCache.push({ ...bg.mod });
        bg.modTekIndeks(modCache.length - 1);
        Object.assign(sonMod, bg.mod);
      }
      
      // j hücresini hesaplamak için o anki mod'u bg'ye yükle
      Object.assign(bg.mod, modCache[j]);
      const anlam = hucreAnlamiTekil(hucrelerCache, j, hucreYorumlariAktif, bg);
      
      // Sonraki hesaplamalar için bg.mod'u tekrar en uç duruma getir
      Object.assign(bg.mod, sonMod);
      return anlam;
    };

    const hucreMetinUzunlugu = (anlam) => {
      if (!anlam) return 1;
      const isIndicator = anlam.tip === 'isaret' && !anlam.etiket;
      if (isIndicator) return 0;
      let cellLen = 1;
      if (anlam.etiket) {
        cellLen = anlam.etiket.includes(',')
          ? anlam.etiket.split(',')[0].trim().length
          : anlam.etiket.length;
      } else if (anlam.tip === 'harf' || anlam.tip === 'rakam' || anlam.tip === 'bosluk') {
        cellLen = 1;
      }
      return cellLen;
    };

    for (let i = 0; i < hucreSayisi; i++) {
      const baseIdx = esleme[i];
      if (baseIdx === -1 || baseIdx === undefined) continue;

      if (baseIdx > sEnd) break;
      if (baseIdx + 30 < sStart) continue; // Hızlı atlama: Seçimden çok önceki hücreleri işlemeye gerek yok

      let groupStart = i;
      while (groupStart > 0 && esleme[groupStart - 1] === baseIdx) groupStart--;

      let currentPos = baseIdx;
      let cellStart = baseIdx;
      let cellEnd = baseIdx + 1;

      for (let j = groupStart; j <= i; j++) {
        const anlam = hizliHucreAnlami(j);
        const len = hucreMetinUzunlugu(anlam);
        if (j === i) {
          cellStart = currentPos;
          cellEnd = currentPos + Math.max(1, len);
          break;
        }
        currentPos += len;
      }

      if (Math.max(sStart, cellStart) < Math.min(sEnd, cellEnd)) {
        bulunanMinH = Math.min(bulunanMinH, i);
        bulunanMaxH = Math.max(bulunanMaxH, i);
      }
    }

    if (bulunanMaxH !== -1) {
      let lo = bulunanMinH;
      while (lo > 0 && esleme[lo - 1] === -1) lo -= 1;

      setMetinSecimHucreAraligi({ lo, hi: bulunanMaxH });

      const hedefSayfa = Math.floor(lo / brailleSayfaBoyutu);
      if (hedefSayfa !== brailleSayfa) {
        setBrailleSayfa(hedefSayfa);
      }
    } else {
      setMetinSecimHucreAraligi(null);
    }
  }, [brailleSayfa, brailleSayfaBoyutu, hucrelerCache, hucreYorumlariAktif, karakterYorumTercihleri]);

  const metinSecimHucreAraliginiGuncelle = useCallback(() => {
    senkronizeMetinSecimVurgusu();
  }, [senkronizeMetinSecimVurgusu]);

  const metinCiftTikSeciminiIsle = useCallback(() => {
    requestAnimationFrame(() => senkronizeMetinSecimVurgusu());
  }, [senkronizeMetinSecimVurgusu]);

  useEffect(() => {
    if (metinSecimHucreAraligi && brailleKutuRef.current) {
      const timer = setTimeout(() => {
        const container = brailleKutuRef.current;
        if (!container) return;
        const lo = metinSecimHucreAraligi.lo;
        const hedefNode = container.querySelector(`[data-hucre-index="${lo}"]`);
        if (hedefNode) {
          hedefNode.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [metinSecimHucreAraligi, brailleSayfa]);

  useEffect(() => { setHucreAyarPaneliAcik(false); }, [seciliHucre?.index]);
  useEffect(() => {
    setBrailleSayfa((p) => Math.min(p, Math.max(0, toplamSayfa - 1)));
  }, [toplamSayfa]);
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
    let brf;
    try {
      if (hucrelerCache.length > 0 && kaynakCache === girisMetni) {
        brf = hucreleriBRFDizgesine(hucrelerCache, brfOnizlemeKagitBoyutu);
      } else {
        brf = metniBRFe(girisMetni, cevirFn, brfOnizlemeKagitBoyutu);
      }
    } catch (e) {
      console.error('BRF indirme hatası:', e);
      return;
    }
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
            paraBirimiKaynakAraliklari: paraBirimiKaynakSonEkiAraliklari(kaynakMetin),
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
                onMouseUp={metinSecimHucreAraliginiGuncelle}
                onKeyUp={metinSecimHucreAraliginiGuncelle}
                onDoubleClick={metinCiftTikSeciminiIsle}
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
              <div className="araclar-matematik-sarici" ref={matematikPaletRef}>
                <button
                  type="button"
                  className={'araclar-seslendir-btn araclar-matematik-btn' + (matematikPaletiAcik ? ' aktif' : '')}
                  onClick={() => setMatematikPaletiAcik((v) => !v)}
                  aria-label="Matematik / özel işaretler"
                  aria-expanded={matematikPaletiAcik}
                  title="Matematik / özel işaretler"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 6h7l-3 5 5 7H4" />
                    <path d="M14 6h6" />
                    <path d="M17 4v4" />
                    <path d="M14 14l6 6" />
                    <path d="M20 14l-6 6" />
                  </svg>
                </button>
                {matematikPaletiAcik && (
                  <div className="araclar-matematik-paneli" role="dialog" aria-label="Matematik ve özel işaretler">
                    {MATEMATIK_PALETI.map((grup) => (
                      <div key={grup.baslik} className="araclar-matematik-grup">
                        <div className="araclar-matematik-grup-baslik">{grup.baslik}</div>
                        <div className="araclar-matematik-grup-icerik">
                          {grup.semboller.map((s) => (
                            <button
                              key={s.sembol + s.etiket}
                              type="button"
                              className="araclar-matematik-sembol"
                              onClick={() => {
                                insertAtCursor(s.sembol);
                                textareaRef.current?.focus();
                              }}
                              title={s.etiket}
                              aria-label={`${s.etiket} (${s.sembol}) ekle`}
                            >
                              <span className="araclar-matematik-sembol-ch" aria-hidden="true">{s.sembol}</span>
                              <span className="araclar-matematik-sembol-ad">{s.etiket}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

         

            {/* Noktalı braille görünümü */}
            {girisMetni && (
              <div className="araclar-nokta-sarici">
                {erisilebilirMod ? (
                  <div
                    ref={brailleKutuRef}
                    className={'belge-braille-erisilebilir' + (tabletModuAktif ? ' belge-braille-erisilebilir-tablet' : '')}
                    role="region"
                  aria-label={(tabletModuAktif ? `Tablet: ${TABLET_SATIR_HUCRE}×${TABLET_SAYFADA_SATIR} hücre/sayfa. ` : '')
                      + `erişilebilir braille metin görünümü, sayfa ${brailleSayfa + 1} / ${toplamSayfa}`}
                    lang="tr"
                  >
                    <div className={'belge-braille-text-unicode-group' + (tabletModuAktif ? ' belge-braille-text-unicode-group-tablet' : '')} aria-label={girisMetni}>
                      {tabletModuAktif ? (
                        tabletSatirYerelleri.map((yerler, ri) => (
                          <div key={`er-t-${brailleSayfa}-${ri}`} className="araclar-tablet-er-satir" role="row">
                            {yerler.map((i) => {
                              const noktalar = sayfaHucreler[i];
                              const globalIdx = sayfaBaslangic + i;
                              const anlam = sayfaHucreAnlamlari[i];
                              const paraBirimiHucre = hucreParaBirimiKaynakBaglamiMi(eslemeCache, globalIdx, paraBirimiKaynakAraliklari);
                              const renk = getHucreTipiRengi(anlam, paraBirimiHucre);
                              const isVurgulu = metinSecimHucreAraligi
                                && globalIdx >= metinSecimHucreAraligi.lo
                                && globalIdx <= metinSecimHucreAraligi.hi;
                              return (
                                <span
                                  key={globalIdx}
                                  className={`unicode-hucre araclar-tablet-er-unicode-hucre${isVurgulu ? ' vurgulu' : ''}`}
                                  style={{
                                    color: renk,
                                    cursor: 'pointer',
                                    backgroundColor: isVurgulu ? '#e0f2fe' : 'transparent',
                                    borderRadius: '1px',
                                    lineHeight: '1',
                                  }}
                                  onClick={() => hucreTiklandigindaMetniSec(globalIdx)}
                                  title={anlam?.baslik}
                                >
                                  {erisilebilirTabletUnicodeHucreleri?.[i] ?? ''}
                                </span>
                              );
                            })}
                          </div>
                        ))
                      ) : (
                        sayfaHucreler.map((noktalar, i) => {
                          const globalIdx = sayfaBaslangic + i;
                          const anlam = sayfaHucreAnlamlari[i];
                          const paraBirimiHucre = hucreParaBirimiKaynakBaglamiMi(eslemeCache, globalIdx, paraBirimiKaynakAraliklari);
                          const renk = getHucreTipiRengi(anlam, paraBirimiHucre);
                          const isVurgulu = metinSecimHucreAraligi
                            && globalIdx >= metinSecimHucreAraligi.lo
                            && globalIdx <= metinSecimHucreAraligi.hi;

                          return (
                            <span
                              key={globalIdx}
                              className={`unicode-hucre${isVurgulu ? ' vurgulu' : ''}`}
                              style={{
                                color: renk,
                                fontSize: '.2 em',
                                cursor: 'pointer',
                                display: 'inline-block',
                                backgroundColor: isVurgulu ? '#e0f2fe' : 'transparent',
                                borderRadius: '1px',
                                padding: '0 1px',
                                lineHeight: '1',
                              }}
                              onClick={() => hucreTiklandigindaMetniSec(globalIdx)}
                              title={anlam?.baslik}
                            >
                              {noktalardanUnicode(noktalar)}
                            </span>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                <div
                  ref={brailleKutuRef}
                  className={'araclar-nokta-gorunus belge-braille-kutu'
                    + (genisletAktif ? ' genisletilmis' : '')
                    + (tabletModuAktif ? ' araclar-tablet-mod' : '')}
                  aria-label={tabletModuAktif
                    ? `Braille nokta görünümü (tablet: ${TABLET_SATIR_HUCRE} hücre × ${TABLET_SAYFADA_SATIR} sıra, sağdan sola)`
                    : 'Braille nokta görünümü'}
                >
                  {tabletModuAktif ? (
                    tabletSatirYerelleri.map((yerler, ri) => (
                      <div key={`t-${brailleSayfa}-${ri}`} className="araclar-tablet-satir" role="row">
                        {yerler.map((i) => {
                          const noktalar = sayfaHucreler[i];
                          const globalIdx = sayfaBaslangic + i;
                          const paraBirimiHucre = hucreParaBirimiKaynakBaglamiMi(eslemeCache, globalIdx, paraBirimiKaynakAraliklari);
                          const isVurgulu = metinSecimHucreAraligi
                            && globalIdx >= metinSecimHucreAraligi.lo
                            && globalIdx <= metinSecimHucreAraligi.hi;
                          return (
                            <BrailleHucreBileseni
                              key={globalIdx}
                              noktalar={noktalar}
                              svgAktifNoktalar={tabletDelikAynala(noktalar)}
                              globalIdx={globalIdx}
                              anlam={sayfaHucreAnlamlari[i] || null}
                              genisletAktif={genisletAktif}
                              paraBirimiHucre={paraBirimiHucre}
                              isSecili={seciliHucre?.index === globalIdx}
                              isVurgulu={isVurgulu}
                              onClick={hucreTiklandigindaMetniSec}
                            />
                          );
                        })}
                      </div>
                    ))
                  ) : (
                    sayfaHucreler.map((noktalar, i) => {
                      const globalIdx = sayfaBaslangic + i;
                      const paraBirimiHucre = hucreParaBirimiKaynakBaglamiMi(eslemeCache, globalIdx, paraBirimiKaynakAraliklari);
                      const isVurgulu = metinSecimHucreAraligi
                        && globalIdx >= metinSecimHucreAraligi.lo
                        && globalIdx <= metinSecimHucreAraligi.hi;
                      return (
                        <BrailleHucreBileseni
                          key={globalIdx}
                          noktalar={noktalar}
                          globalIdx={globalIdx}
                          anlam={sayfaHucreAnlamlari[i] || null}
                          genisletAktif={genisletAktif}
                          paraBirimiHucre={paraBirimiHucre}
                          isSecili={seciliHucre?.index === globalIdx}
                          isVurgulu={isVurgulu}
                          onClick={hucreTiklandigindaMetniSec}
                        />
                      );
                    })
                  )}
                </div>
                )}

                {!erisilebilirMod && seciliHucreDetayi && (
                  <div className="braille-hucre-popup" role="dialog" aria-label="Hücre anlamı">
                    <div className="bhp-header">
                      <div className="bhp-baslik-bloku">
                        <span className="bhp-baslik-kucuk">Hücre {seciliHucreDetayi.index + 1}</span>
                        <span className={'bhp-anlam bhp-tip-' + seciliHucreDetayi.anlam.tip}>
                          {seciliHucreDetayi.anlam.baslik}
                        </span>
                      </div>
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
                <button
                  type="button"
                  className={'araclar-seslendir-btn araclar-erisilebilir-btn' + (erisilebilirMod ? ' aktif' : '')}
                  onClick={() => setErisilebilirMod((v) => !v)}
                  aria-pressed={erisilebilirMod}
                  aria-label={erisilebilirMod ? 'Nokta görünümüne dön' : 'Erişilebilir braille metin görünümüne geç (Unicode braille glifleri)'}
                  title={erisilebilirMod ? 'Nokta görünümüne dön' : 'Erişilebilir mod (braille metin/font görünümü)'}
                >
                  {erisilebilirMod ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                      <circle cx="8" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>
                      <circle cx="16" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M4 20l6-14h4l6 14"/><path d="M7 14h10"/>
                    </svg>
                  )}
                </button>
                {erisilebilirMod && (
                  <button
                    type="button"
                    className={'araclar-seslendir-btn araclar-kopyala-btn' + (kopyalandi ? ' aktif' : '')}
                    onClick={async () => {
                      const metin = tabletModuAktif
                        ? tabletSayfasiUnicodeKopyaMetni(sayfaHucreler)
                        : sayfaHucreler.map(noktalardanUnicode).join('');
                      if (!metin) return;
                      try {
                        await navigator.clipboard.writeText(metin);
                      } catch {
                        const ta = document.createElement('textarea');
                        ta.value = metin;
                        ta.style.position = 'fixed'; ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); } catch { /* yoksay */ }
                        document.body.removeChild(ta);
                      }
                      setKopyalandi(true);
                      setTimeout(() => setKopyalandi(false), 1500);
                    }}
                    aria-label={kopyalandi ? 'Panoya kopyalandı' : 'Braille metnini panoya kopyala'}
                    title={kopyalandi ? 'Kopyalandı ✓' : 'Panoya kopyala'}
                  >
                    {kopyalandi ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            )}
        </>
      </div>

      {/* ── Alt: aksiyonlar ── */}
      <div className="yazma-bolum yazma-bolum-alt">
        <div className="controls">
            <div className="araclar-brf-grup">
              <button
                type="button"
                disabled={!girisMetni.trim()}
                onClick={brfIndir}
                className="araclar-brf-grup-ilk"
                aria-label="BRF İndir"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>
                <span className="btn-yazi">BRF İndir</span>
              </button>
              <button
                type="button"
                disabled={!girisMetni.trim()}
                onClick={() => setBrfOnizlemeAcik(true)}
                className="araclar-brf-grup-son araclar-brf-grup-onizle"
                aria-label="Kabartmalı çıktı için BRF ön izlemesi"
                title="Ön izle — kağıda göre sıra ve satır (form feed)"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                  <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={temizle}
              disabled={!girisMetni}
              className="araclar-controls-temizle"
              aria-label="Temizle"
              title="Metni temizle"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              <span className="btn-yazi">Temizle</span>
            </button>
            <button
              type="button"
              disabled={!girisMetni}
              className={'araclar-perkins-btn araclar-perkins-btn--yalnizca-ikon' + (tabletModuAktif ? ' aktif' : '')}
              onClick={() => {
                const eskiBoyut = tabletModuAktif ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
                const yeniTablet = !tabletModuAktif;
                const yeniBoyut = yeniTablet ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
                setBrailleSayfa((sayfa) => Math.floor((sayfa * eskiBoyut) / yeniBoyut));
                setTabletModuAktif(yeniTablet);
              }}
              aria-pressed={tabletModuAktif}
              aria-label={`Tablet modu ${tabletModuAktif ? 'açık' : 'kapalı'}`}
              title={'Tablet modu (' + (tabletModuAktif ? 'açık' : 'kapalı') + `). Sayfa: ${TABLET_SATIR_HUCRE}×${TABLET_SAYFADA_SATIR} hücre (${TABLET_BRAILLE_SAYFA_BOYUTU}); satır başına ${TABLET_SATIR_HUCRE} hücre, sağdan sola; delik yönüne göre yansıtılmış nokta`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="7" y1="8" x2="7" y2="16" />
                <line x1="17" y1="8" x2="17" y2="16" />
              </svg>
            </button>
            <button
              type="button"
              className={'araclar-perkins-btn araclar-perkins-btn--yalnizca-ikon' + (perkinsAktif ? ' aktif' : '')}
              onClick={() => setPerkinsAktif((v) => !v)}
              aria-pressed={perkinsAktif}
              aria-label={'Perkins klavye ' + (perkinsAktif ? 'açık' : 'kapalı')}
              title={'Perkins klavye (' + (perkinsAktif ? 'açık' : 'kapalı') + ')'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M6 9h.01M10 9h.01M14 9h.01M18 9h.01M6 13h.01M10 13h.01M14 13h.01M18 13h.01M8 17h8"/></svg>
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

      {brfOnizlemeAcik && (
        <div
          className="araclar-brf-onizle-backdrop"
          role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setBrfOnizlemeAcik(false); }}
        >
          <div
            className="araclar-brf-onizle-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="araclar-brf-onizle-baslik"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="araclar-brf-onizle-ust">
              <h2 id="araclar-brf-onizle-baslik" className="araclar-brf-onizle-baslik">
                Kabartmalı çıktı ön izlemesi (BRF sırası)
              </h2>
              <button
                type="button"
                className="araclar-brf-onizle-kapat"
                onClick={() => setBrfOnizlemeAcik(false)}
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>
            <div className="araclar-brf-onizle-govde">
              <aside className="araclar-brf-onizle-panel" aria-label="Kağıt ve satır düzeni">
                <p className="araclar-brf-onizle-panel-baslik">Sayfa düzeni</p>
                <p className="araclar-brf-onizle-aciklama">
                  Sıra başına hücre ve sayfa başına satır yazıcısındaki delik satırlarına karşılık gelir. Seçilen düzen hem ön izlemede hem “BRF İndir” ile indirilen dosyada kullanılır.
                </p>
                <div className="araclar-brf-onizle-sec">
                  {[BRF_KAGIT_PRESET_STANDART, BRF_KAGIT_PRESET_DAR_A4_OZERI].map((p) => (
                    <label key={p.id} className="araclar-brf-onizle-radio">
                      <input
                        type="radio"
                        name="brf-kagit"
                        checked={brfOnizlemePreset === p.id}
                        onChange={() => {
                          setBrfOnizlemePreset(p.id);
                          setBrfOnizlemeOzelHucre(String(p.satirdaHucre));
                          setBrfOnizlemeOzelSatir(String(p.sayfadaSatir));
                        }}
                      />
                      <span>{p.etiket}</span>
                    </label>
                  ))}
                  <label className="araclar-brf-onizle-radio">
                    <input
                      type="radio"
                      name="brf-kagit"
                      checked={brfOnizlemePreset === 'ozel'}
                      onChange={() => setBrfOnizlemePreset('ozel')}
                    />
                    <span>Özel (elle)</span>
                  </label>
                </div>
                {brfOnizlemePreset === 'ozel' && (
                  <div className="araclar-brf-onizle-ozel">
                    <label className="araclar-brf-onizle-satir">
                      <span>Sıra başına hücre</span>
                      <input
                        type="number"
                        min={10}
                        max={80}
                        inputMode="numeric"
                        value={brfOnizlemeOzelHucre}
                        onChange={(e) => setBrfOnizlemeOzelHucre(e.target.value)}
                      />
                    </label>
                    <label className="araclar-brf-onizle-satir">
                      <span>Sayfa başına satır</span>
                      <input
                        type="number"
                        min={5}
                        max={64}
                        inputMode="numeric"
                        value={brfOnizlemeOzelSatir}
                        onChange={(e) => setBrfOnizlemeOzelSatir(e.target.value)}
                      />
                    </label>
                  </div>
                )}
                <p className="araclar-brf-onizle-kucuk">
                  Ön izleme Unicode braille ile gösterilir; cihazda çizgi aralığı ve üst/alt boşluk modelinize göre değişebilir.
                </p>
              </aside>
              <div className="araclar-brf-onizle-icerik" tabIndex={0}>
                {brfOnizlemeSayfalari.length === 0 ? (
                  <p className="araclar-brf-onizle-bos">Ön izlenecek BRF içeriği yok.</p>
                ) : (
                  brfOnizlemeUnicodeSayfalari.map((unicodeSatirlari, sayfaInd) => (
                    <div key={sayfaInd} className="araclar-brf-onizle-sayfa">
                      <div className="araclar-brf-onizle-sayfa-baslik">
                        Sayfa {sayfaInd + 1} / {brfOnizlemeSayfalari.length}
                        <span className="araclar-brf-onizle-sayfa-oran">
                          {brfOnizlemeKagitBoyutu.satirdaHucre} × {brfOnizlemeKagitBoyutu.sayfadaSatir}
                        </span>
                      </div>
                      <pre className="araclar-brf-onizle-pre" lang="und">
                        {unicodeSatirlari.map((satirUnicode, si) => (
                          <div key={si} className="araclar-brf-onizle-satir">
                            {satirUnicode}
                          </div>
                        ))}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

/** React.memo: sayfaAnlamlariniTopluHesapla her seferinde yeni anlam nesnesi üretir; referans değil içerik kıyaslanır. */
function brailleHucreAnlamiMemoAnahtari(anlam, paraBirimiHucre, genisletAktif) {
  const p = paraBirimiHucre ? '1' : '0';
  if (!anlam) return `yok|${p}`;
  const et = genisletAktif ? kisaEtiket(anlam) : '';
  return `${p}|${anlam.tip}|${String(anlam.baslik)}|${et}`;
}

/** Sayfa hücresi: sınıf renkleri yok; memo yalnız görsel durumda yeniden çizer. */
const BrailleHucreBileseni = React.memo(function BrailleHucreBileseni({
  noktalar,
  svgAktifNoktalar,
  globalIdx,
  anlam,
  genisletAktif,
  paraBirimiHucre,
  isSecili,
  isVurgulu,
  onClick,
}) {
  const { noktaRenk, etiketRenk } = useMemo(() => {
    const baslikStr = anlam && typeof anlam.baslik === 'string' ? anlam.baslik : '';
    if (paraBirimiHucre || baslikStr.includes('Birim')) {
      return { noktaRenk: 'var(--braille-noktalama-fill)', etiketRenk: 'var(--braille-noktalama-fill)' };
    }
    if (!anlam) return { noktaRenk: '#3b82f6', etiketRenk: '#000000' };
    const baslikMetni = typeof anlam.baslik === 'string' ? anlam.baslik : '';
    const isKisaltma = anlam.tip === 'kisaltma'
      || (anlam.tip === 'isaret' && (baslikMetni.includes('Kök') || baslikMetni.includes('Parça') || baslikMetni.includes('Ayırma')));
    if (isKisaltma) return { noktaRenk: '#ef4444', etiketRenk: '#ef4444' };
    if (anlam.tip === 'noktalama') return { noktaRenk: '#10b981', etiketRenk: '#10b981' };
    if (anlam.tip === 'islem') return { noktaRenk: '#7c3aed', etiketRenk: '#7c3aed' };
    const isMatematikBolucuIsaret = anlam.tip === 'isaret' && baslikMetni.includes('Bölük');
    if (isMatematikBolucuIsaret) return { noktaRenk: '#7c3aed', etiketRenk: '#7c3aed' };
    const isDigerIsaret = anlam.tip === 'isaret';
    if (isDigerIsaret) return { noktaRenk: '#000000', etiketRenk: '#000000' };
    if (anlam.tip === 'harf' || anlam.tip === 'rakam') return { noktaRenk: '#3b82f6', etiketRenk: '#000000' };
    return { noktaRenk: '#3b82f6', etiketRenk: '#000000' };
  }, [anlam, paraBirimiHucre]);

  const boslukMu = anlam?.tip === 'bosluk';
  const siniflar = `belge-braille-hucre${boslukMu ? ' belge-braille-hucre--bosluk' : ''}${isSecili ? ' secili' : ''}${isVurgulu ? ' metin-secim-vurgu' : ''}`;
  const hucreNoktalariSvg = svgAktifNoktalar ?? noktalar;

  return (
    <div
      className={siniflar}
      data-hucre-index={globalIdx}
      style={{
        ['--dot-active-color']: noktaRenk,
        ['--hucre-etiket-rengi']: etiketRenk,
      }}
      role="button"
      tabIndex={0}
      title="Tıkla: anlam göster"
      onClick={() => onClick(globalIdx)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(globalIdx);
        }
      }}
    >
      <div className="hucre-svg-sarici">
        <BrailleCell
          aktifNoktalar={hucreNoktalariSvg}
          tiklanabilir={false}
          kesfedilebilir={false}
        />
      </div>
      {genisletAktif && anlam ? (
        <div className="belge-hucre-etiket" aria-hidden="true">
          {kisaEtiket(anlam)}
        </div>
      ) : null}
    </div>
  );
}, (prev, next) => {
  const prevSvg = (prev.svgAktifNoktalar ?? prev.noktalar).join(',');
  const nextSvg = (next.svgAktifNoktalar ?? next.noktalar).join(',');
  return prev.globalIdx === next.globalIdx
    && prevSvg === nextSvg
    && prev.isSecili === next.isSecili
    && prev.isVurgulu === next.isVurgulu
    && prev.genisletAktif === next.genisletAktif
    && prev.paraBirimiHucre === next.paraBirimiHucre
    && brailleHucreAnlamiMemoAnahtari(prev.anlam, prev.paraBirimiHucre, prev.genisletAktif)
      === brailleHucreAnlamiMemoAnahtari(next.anlam, next.paraBirimiHucre, next.genisletAktif);
});
