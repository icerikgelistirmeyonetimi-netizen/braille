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
import BrailleGrid from '../components/BrailleGrid.jsx';
import BrailleKlavye, { yeniYazmaDurumu, hucreyiIsle } from '../components/BrailleKlavye.jsx';
import { konus, konusmayiDurdur } from '../utils/ses.js';
import { noktalariBRF, brfNoktalaradon } from '../utils/brailleAscii.js';
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
import {
  NOTALAR as MUZIK_TEMEL_NOTALAR,
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
  MUZIK_BOLUMLER,
  MUZIK_SEMBOLLERI,
} from '../data/muzik.js';
// Müzik motor (utils/music/* — Modül 8 kuralları)
import {
  MUZIK_PITCH_Y as M_MUZIK_PITCH_Y,
  MUZIK_OKTAV_HUCRELERI as M_MUZIK_OKTAV_HUCRELERI,
  MUZIK_SATIR_KAPASITESI as M_MUZIK_SATIR_KAPASITESI,
  MUZIK_SATIR_YUKSEKLIK as M_MUZIK_SATIR_YUKSEKLIK,
  MUZIK_KATEGORI_TIPI as M_MUZIK_KATEGORI_TIPI,
  MUZIK_KATEGORI_IKON as M_MUZIK_KATEGORI_IKON,
  MUZIK_NOTA_IKON as M_MUZIK_NOTA_IKON,
  muzikNotaNoktalari as M_muzikNotaNoktalari,
  muzikSureKisaAdi as M_muzikSureKisaAdi,
  muzikTimeSigExpected16 as M_muzikTimeSigExpected16,
  muzikRestKucukSureDegeri as M_muzikRestKucukSureDegeri,
  muzikRestSureFromName as M_muzikRestSureFromName,
  muzikOge16Suresi as M_muzikOge16Suresi,
  muzikOlcuAyraciMi as M_muzikOlcuAyraciMi,
  muzikBeatPozisyonlari as M_muzikBeatPozisyonlari,
  muzikAyniVurusMu as M_muzikAyniVurusMu,
  muzikDiatonikAralik as M_muzikDiatonikAralik,
  muzikOktavGerekliMi as M_muzikOktavGerekliMi,
  muzikOktavHucresi as M_muzikOktavHucresi,
  muzikAccidentalHucreleri as M_muzikAccidentalHucreleri,
  muzikKeySignatureEtkilenenler as M_muzikKeySignatureEtkilenenler,
  muzikEffectiveAccidental as M_muzikEffectiveAccidental,
  muzikNotaSkorOgesi as M_muzikNotaSkorOgesi,
  muzikSusSkorOgesi as M_muzikSusSkorOgesi,
  muzikGrupTespit as M_muzikGrupTespit,
  muzikGruplariTespit as M_muzikGruplariTespit,
  muzikNotaSadePitchHucresi as M_muzikNotaSadePitchHucresi,
  muzikOlcuyeBol as M_muzikOlcuyeBol,
  muzikOlcuHash as M_muzikOlcuHash,
  muzikOlcuUyari as M_muzikOlcuUyari,
  muzikSonAyracIndeksi as M_muzikSonAyracIndeksi,
  muzikOtomatikOlcuCizgisiEkle as M_muzikOtomatikOlcuCizgisiEkle,
  muzikMeasureBRFTahminiUzunluk as M_muzikMeasureBRFTahminiUzunluk,
  muzikLayoutSatirlari as M_muzikLayoutSatirlari,
  muzikBarRepeatUygunMu as M_muzikBarRepeatUygunMu,
  muzikAutoBarRepeatHaritasi as M_muzikAutoBarRepeatHaritasi,
  muzikRepeatAdaylariniBul as M_muzikRepeatAdaylariniBul,
  muzikBarNumberHucreleri as M_muzikBarNumberHucreleri,
  muzikUstRakamHucreleri as M_muzikUstRakamHucreleri,
  muzikSayiGostergesi as M_muzikSayiGostergesi,
  muzikBackwardNumeralRepeatHucreleri as M_muzikBackwardNumeralRepeatHucreleri,
  muzikBarNumberRepeatHucreleri as M_muzikBarNumberRepeatHucreleri,
  muzikHucrelerOrtala as M_muzikHucrelerOrtala,
  muzikHeaderSatirlariUret as M_muzikHeaderSatirlariUret,
  muzikKontraksiyonsuzMetinHucreleri as M_muzikKontraksiyonsuzMetinHucreleri,
  muzikModifierOncesiSira as M_muzikModifierOncesiSira,
  muzikModifierSonrasiSira as M_muzikModifierSonrasiSira,
  muzikSkorunuBrailleyeCevir as M_muzikSkorunuBrailleyeCevir,
  muzikHucreAnlamiKayittan as M_muzikHucreAnlamiKayittan,
} from '../utils/music/index.js';
import { metniLatinBrailleyeCevir, LATIN_DILLER } from '../utils/latinBrailleCevir.js';

// ─── BRF kodlama / çözme ───────────────────────────────────────────────────
// BRF (Braille Ready Format) standardı:
//   Karakter = 0x20 + nokta bitleri
//   bit0=nokta1  bit1=nokta2  bit2=nokta3
//   bit3=nokta4  bit4=nokta5  bit5=nokta6
export const SATIRDA_HUCRE = 40;
export const SAYFADA_SATIR = 25;
export const BRAILLE_SAYFA_BOYUTU = 200; // hücre/sayfa (klasik Araçlar sayfalaması)
/** Tablet görünümü: fiziksel cihaza yakın yazım yönü ve satır genişliği (hücre/sıra). */
export const TABLET_SATIR_HUCRE = 28;
/** Kabartma sayfada sıra sayısı (BRF “32×28” preset’teki 28 satırla aynı mantık). */
export const TABLET_SAYFADA_SATIR = 28;
/** Tablet modunda tam “ekran”: 28×28 hücre. */
export const TABLET_BRAILLE_SAYFA_BOYUTU = TABLET_SATIR_HUCRE * TABLET_SAYFADA_SATIR;

/** Delik aynası: aynı nokta dizisi için aynı dizi referansı (React.memo). */
const _aynaliCache = new Map();

/** Fiziksel delme aynası: sütunlar yatay çevrilir (1 ↔ 4, 2 ↔ 5, 3 ↔ 6); yalnızca görüntü. */
export function tabletDelikAynala(noktalar) {
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
export function tabletSayfasiUnicodeKopyaMetni(hucreler) {
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

  'Çift rakam işareti (aynı anda nokta 3 · 4 · 5 · 6 yazılmış iki Braille hücresi, ⠼⠼): Üçten fazla ardışık sayı yan yana (virgülle ayrılmış) veya sütunda alt alta yazıldığında sıra böyle iki sayı işareti ile başlar. Ara sayıların öncesine sayı işareti yazılmaz; yalnızca dizinin son sayısının başında tek sayı işareti (⠼) kullanılır. ';


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


// BRF ↔ nokta dönüşümü tek doğruluk kaynağından (utils/brailleAscii.js).
// (noktalariBRF / brfNoktalaradon yukarıda import edildi.)

/** Kabartmalı sıra/satır için makul üst-alt sınırlar (ön izleme + BRFe). */
export function brfKagitBoyutunuDuzeltGirdi(kagitBoyutu) {
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

export function hucreleriBRFDizgesine(hucreler, kagitBoyutu) {
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

export function metniBRFe(metin, cevirFn = metniBrailleyeCevir, kagitBoyutu) {
  const { hucreler } = cevirFn(metin, {
    buyukHarfIsareti: true,
    sayiIsareti: true,
  });
  return hucreleriBRFDizgesine(hucreler, kagitBoyutu);
}

export function brfIcindekiSayfaMetinleri(brfDizgesi) {
  if (!brfDizgesi) return [];
  return brfDizgesi.split(/\r\n\f\r\n/).map((parca) => parca.replace(/\r\n/g, '\n')).filter((p) => p.length > 0);
}

export function brfSatirininBrailleUnicodeKarsiligi(satir) {
  let cikti = '';
  for (let i = 0; i < satir.length; i++) {
    const pts = brfNoktalaradon(satir.charAt(i));
    if (pts === null) cikti += '\uFFFD';
    else cikti += noktalardanUnicode(pts);
  }
  return cikti;
}

export const BRF_KAGIT_PRESET_STANDART = { id: 'standart', etiket: 'Standart (40 × 25)', satirdaHucre: 40, sayfadaSatir: 25 };
export const BRF_KAGIT_PRESET_DAR_A4_OZERI = { id: 'dar', etiket: 'Dar sıra / geniş yazıcı (32 × 28)', satirdaHucre: 32, sayfadaSatir: 28 };

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
    if (key === '1,2,3') return false;
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
    let isDuzeltmeli = false;
    if (harfIdx < hucreler.length && duzeltmeYabanciHarfIsaretiMi(hucreler[harfIdx])) { harfIdx++; isDuzeltmeli = true; }
    if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
    const harf = harfIdx < hucreler.length ? (isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(hucreler[harfIdx]) || hucreyiKarakteryap(hucreler[harfIdx])) : hucreyiKarakteryap(hucreler[harfIdx])) : null;
    return !!harf && harf !== ' ';
  };
  const harfliSayiHarfHucreMi = (cellIdx) => {
    // harf hücresinin kendisini tespit et
    let i = cellIdx - 1;
    let isDuzeltmeli = false;
    if (i >= 0 && buyukHarfIsaretiMi(hucreler[i])) i--;
    if (i >= 0 && duzeltmeYabanciHarfIsaretiMi(hucreler[i])) { i--; isDuzeltmeli = true; }
    if (i >= 0 && buyukHarfIsaretiMi(hucreler[i])) i--;
    if (i >= 0 && tekKucukHarfIsaretiMi(hucreler[i])) {
      return !!(isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(hucreler[cellIdx]) || hucreyiKarakteryap(hucreler[cellIdx])) : hucreyiKarakteryap(hucreler[cellIdx]));
    }
    return false;
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
    // Heuristik: Küme kapama (}) yalnızca daha önce eşleşmiş bir "küme açma" ({) varsa gösterilsin.
    // Aksi halde, büyük harf işareti [6] + "ta" hecesi [2,3,4,5,6] gibi doğal yazımlar yanlışlıkla
    // küme kapama olarak etiketleniyor ("Tatilde" örneği).
    const dotKeyAt = (i) => (i >= 0 && i < hucreler.length && hucreler[i]?.length ? noktalariAnahtara(hucreler[i]) : '');
    const isKumeAcmaAt = (i) => dotKeyAt(i) === '1,2,3,5,6' && dotKeyAt(i + 1) === '3';
    const isKumeKapamaAt = (i) => dotKeyAt(i) === '6' && dotKeyAt(i + 1) === '2,3,4,5,6';
    const oncekiKumeAcikSayisi = (() => {
      let say = 0;
      let i = 0;
      while (i < idx) {
        if (isKumeAcmaAt(i)) { say++; i += 2; continue; }
        if (isKumeKapamaAt(i)) { if (say > 0) say--; i += 2; continue; }
        i++;
      }
      return say;
    })();
    if (islemKapsami.ad === 'küme kapama' && oncekiKumeAcikSayisi <= 0) {
      // Küme bağlamı yoksa matematik sembolü olarak göstermeyelim; harf/hece yorumuna bırak.
    } else {
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
            'Nokta 3 · 4 · 5 · 6. Virgülle ayrılmış üçten fazla sayılı örnekte dizi ilk sayıdan önce çift rakam işareti ile başlar, ara rakamlarda sayı işareti kullanılmaz; yalnızca sıranın son rakam grubunun hemen öncesinde bu tek işaret yazılır (MEB 1.2.5). Sonraki hücreler rakam olarak okunur.',
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
      let isDuzeltmeli = false;
      let checkIdx = idx - 1;
      if (checkIdx >= 0 && buyukHarfIsaretiMi(hucreler[checkIdx])) checkIdx--;
      if (checkIdx >= 0 && duzeltmeYabanciHarfIsaretiMi(hucreler[checkIdx])) isDuzeltmeli = true;
      const harf = isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar)) : hucreyiKarakteryap(noktalar);
      if (harf) {
        const goster = oncekiBuyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        return {
          tip: 'harf',
          baslik: `Harf: ${goster}`,
          detay: `Sayı içindeki harf işaretinden sonra Nokta ${noktaStr} → "${goster}" harfi.`,
          noktaStr,
          harf: goster,
        };
      }
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
    let isDuzeltmeli = false;
    if (harfIdx < hucreler.length && duzeltmeYabanciHarfIsaretiMi(hucreler[harfIdx])) { harfIdx++; isDuzeltmeli = true; }
    if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) harfIdx++;
    const harf = harfIdx < hucreler.length
      ? (isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(hucreler[harfIdx]) || hucreyiKarakteryap(hucreler[harfIdx])) : hucreyiKarakteryap(hucreler[harfIdx]))
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
    const _kaynakNoktalamaMi = (cellIdx) => {
      if (!_kaynak || !_esleme) return false;
      const kaynakIdx = _esleme[cellIdx];
      if (typeof kaynakIdx !== 'number' || kaynakIdx < 0 || kaynakIdx >= _kaynak.length) return false;
      const kaynakKarakter = _kaynak[kaynakIdx];
      return NOKTALAMA.some((n) => n.isaret === kaynakKarakter);
    };
    const _isNoktalamaHucre = (h, i) => {
      if (!h || h.length === 0) return false;
      const kk = dotKey(h);
      if (!_NOKTA_TERS.has(kk)) return false;
      if (_kaynakNoktalamaMi(i)) return true;
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
      let isDuzeltmeli = false;
      if (harfIdx < hucreler.length && duzeltmeYabanciHarfIsaretiMi(hucreler[harfIdx])) {
        harfIdx++;
        isDuzeltmeli = true;
      }
      if (harfIdx < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIdx])) {
        harfIdx++;
        buyuk = true;
      }
      if (harfIdx >= hucreler.length) return null;
      const harf = isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(hucreler[harfIdx]) || hucreyiKarakteryap(hucreler[harfIdx])) : hucreyiKarakteryap(hucreler[harfIdx]);
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
          const ikiYanindaBosluk = idx > 0
            && idx + 1 < hucreler.length
            && hucreler[idx - 1].length === 0
            && hucreler[idx + 1].length === 0;
          if (ikiYanindaBosluk) {
            noktalamaKullan = false;
          } else {
            let j = idx + 1;
            while (j < hucreler.length && hucreler[j].length === 0) j++;
            // Satır/metin sonu: sonraki blok yok → soru işareti
            noktalamaKullan = j >= hucreler.length || buyukHarfIsaretiMi(hucreler[j]);
          }
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


function hucreAnlamiModDurumunuKopyala(mod) {
  return {
    sayiModu: !!mod.sayiModu,
    siraSayiModu: !!mod.siraSayiModu,
    buyukHarfBekle: !!mod.buyukHarfBekle,
    tumKelimeBuyuk: !!mod.tumKelimeBuyuk,
    ciftListeVirgulle: !!mod.ciftListeVirgulle,
    cListeSonTekIsaretSonrasi: !!mod.cListeSonTekIsaretSonrasi,
    paren24356Count: typeof mod.paren24356Count === 'number' ? mod.paren24356Count : 0,
    mutlakDerinlik: typeof mod.mutlakDerinlik === 'number' ? mod.mutlakDerinlik : 0,
  };
}

export function sayfaBaslangicDurumlariniHesapla(hucreler, sayfaBoyutu, opts) {
  const boyut = Math.max(1, Number.isFinite(sayfaBoyutu) ? Math.floor(sayfaBoyutu) : BRAILLE_SAYFA_BOYUTU);
  const bg = hucreAnlamiBaglamVeModSifir(hucreler, opts);
  const durumlar = [hucreAnlamiModDurumunuKopyala(bg.mod)];
  for (let i = 0; i < hucreler.length; i++) {
    bg.modTekIndeks(i);
    if ((i + 1) % boyut === 0) {
      durumlar.push(hucreAnlamiModDurumunuKopyala(bg.mod));
    }
  }
  return durumlar;
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
          let isDuzeltmeli = false;
          if (harfIndex < b.length && duzeltmeYabanciHarfIsaretiMi(b[harfIndex])) {
            harfIndex++;
            isDuzeltmeli = true;
          }
          if (harfIndex < b.length && buyukHarfIsaretiMi(b[harfIndex])) {
            buyuk = true;
            harfIndex++;
          }
          if (harfIndex >= b.length) return null;
          const harf = isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(b[harfIndex]) || hucreyiKarakteryap(b[harfIndex])) : hucreyiKarakteryap(b[harfIndex]);
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
      let isDuzeltmeli = false;
      if (harfIndex < satirHucreleri.length && duzeltmeYabanciHarfIsaretiMi(satirHucreleri[harfIndex])) {
        harfIndex++;
        isDuzeltmeli = true;
      }
      if (harfIndex < satirHucreleri.length && buyukHarfIsaretiMi(satirHucreleri[harfIndex])) {
        buyuk = true;
        harfIndex++;
      }
      if (harfIndex >= satirHucreleri.length) return null;
      const harf = isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(satirHucreleri[harfIndex]) || hucreyiKarakteryap(satirHucreleri[harfIndex])) : hucreyiKarakteryap(satirHucreleri[harfIndex]);
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

// Müzik nota yazım paleti — Modül 8'deki temel notalar ve süre kurallarından türetilir.
// Görünen metin kullanıcıya okunabilir token olarak kalır; BRF üretirken token doğrudan
// müzik braille hücresine çevrilir. Boşluklar yalnızca yazım alanını okunur tutmak için yoksayılır.
const MUZIK_NOTA_PALETI = MUZIK_SURE_GOSTERGELERI.map((sure) => ({
  ...sure,
  notalar: MUZIK_TEMEL_NOTALAR.map((nota) => {
    const noktalar = [...new Set([...nota.noktalar, ...sure.noktalarEk])].sort((a, b) => a - b);
    return {
      token: `${nota.ad}${sure.sembol}`,
      ad: `${nota.ad} · ${sure.ad.replace(/ nota$/i, '')}`,
      notaAd: nota.ad,
      sureAd: sure.ad,
      sembol: sure.sembol,
      hucreler: [noktalar],
      noktalar,
    };
  }),
}));

const MUZIK_TOKEN_KAYITLARI = MUZIK_NOTA_PALETI
  .flatMap((sure) => sure.notalar)
  .sort((a, b) => b.token.length - a.token.length);

const MUZIK_HUCRE_ANLAM_TABLOSU = new Map(
  MUZIK_TOKEN_KAYITLARI.map((kayit) => [noktalariAnahtara(kayit.noktalar), kayit]),
);

const MUZIK_EDITOR_ANAHTARLAR = MUZIK_SEMBOLLERI
  .filter((oge) => /anahtar/i.test(oge.ad))
  .map((oge) => ({
    ...oge,
    tip: 'anahtar',
    kategori: 'Anahtarlar',
    gorunum: oge.sembol || oge.ad,
  }));

const MUZIK_EDITOR_PALET_GRUPLARI = [
  {
    slug: 'notalar',
    baslik: 'Notalar',
    ogeler: [],
  },
  {
    slug: 'anahtarlar',
    baslik: 'Anahtarlar',
    ogeler: MUZIK_EDITOR_ANAHTARLAR,
  },
  ...MUZIK_BOLUMLER
    .filter((bolum) => bolum.slug !== 'notalar' && bolum.slug !== 'sureler')
    .map((bolum) => ({
      slug: bolum.slug,
      baslik: bolum.kisaBaslik,
      ogeler: (bolum.veri || []).map((oge) => ({
        ...oge,
        tip: bolum.slug === 'sus' ? 'sus' : 'isaret',
        kategori: bolum.kisaBaslik,
        gorunum: oge.sembol || oge.okumaOzeti || oge.ad,
      })),
    })),
];

const MUZIK_EDITOR_PALET_ILK = MUZIK_EDITOR_PALET_GRUPLARI[0]?.slug || 'notalar';
const MUZIK_SATIR_KAPASITESI = 8;
const MUZIK_SATIR_YUKSEKLIK = 132;

// Modül 8 kurallarına göre her kategorinin uygulama tipi.
// - 'standalone': skora doğrudan eklenir (notalar, sus, anahtarlar, ölçü çizgileri, tekrar)
// - 'prepend':    skorun başına eklenir (anahtar)
// - 'before-note': seçili bir notanın hücrelerinden ÖNCE bağlanır (oktav, aksidental, dinamik, hairpin, nüans-önce, süsleme)
// - 'after-note':  seçili bir notanın hücrelerinden SONRA bağlanır (fermata, nefes vb.)
// - 'two-notes':   iki nota seçilerek bağ/slur kurulur
// - 'header':      eserin başında veya bölüm değişiminde gelir (zaman imzası, donanım)
const MUZIK_KATEGORI_TIPI = {
  'notalar':          'standalone',
  'anahtarlar':       'prepend',
  'sus':              'standalone',
  'oktav':            'before-note',
  'zaman-imzasi':     'header',
  'degistirici':      'before-note',
  'donanim':          'header',
  'olcu-cizgileri':   'standalone',
  'bag-slur':         'two-notes',
  'dinamikler':       'before-note',
  'hairpin':          'before-note',
  'nuans-once':       'before-note',
  'nuans-sonra':      'after-note',
  'suslemeler':       'before-note',
  'duzensiz-gruplar': 'before-note',
  'tekrar':           'standalone',
};

// Müzik notasyonu sembolleriyle her kategori için ikon. Yazı yerine glif kullanılır.
const MUZIK_KATEGORI_IKON = {
  notalar:           { sembol: '♪',   etiket: 'Notalar' },
  anahtarlar:        { sembol: '𝄞',   etiket: 'Anahtarlar' },
  sus:               { sembol: '𝄽',   etiket: 'Sus (sessizlik)' },
  oktav:             { sembol: '8va', etiket: 'Oktav işaretleri', italic: true },
  'zaman-imzasi':    { sembol: '4/4', etiket: 'Zaman imzası' },
  degistirici:       { sembol: '♯',   etiket: 'Değiştiriciler' },
  donanim:           { sembol: '♭♭',  etiket: 'Donanım' },
  'olcu-cizgileri':  { sembol: '𝄁',   etiket: 'Ölçü çizgileri' },
  'bag-slur':        { sembol: '⌒',   etiket: 'Bağ / slur' },
  dinamikler:        { sembol: 'f',   etiket: 'Dinamikler', italic: true },
  hairpin:           { sembol: '<',   etiket: 'Hairpin' },
  'nuans-once':      { sembol: '>',   etiket: 'Nüans (nota öncesi)' },
  'nuans-sonra':     { sembol: '𝄐',   etiket: 'Nüans (nota sonrası)' },
  suslemeler:        { sembol: 'tr',  etiket: 'Süslemeler', italic: true },
  'duzensiz-gruplar':{ sembol: '³',   etiket: 'Düzensiz gruplar' },
  tekrar:            { sembol: '𝄎',   etiket: 'Tekrar' },
};

// Türkçe solfej isimleri (do, re, mi, fa, sol, la, si) → menüde bunlar kullanılır.
const MUZIK_NOTA_IKON = {
  do:  'do',
  re:  're',
  mi:  'mi',
  fa:  'fa',
  sol: 'sol',
  la:  'la',
  si:  'si',
};

const MUZIK_PITCH_Y = {
  do: 124,
  re: 118,
  mi: 112,
  fa: 106,
  sol: 100,
  la: 94,
  si: 88,
};

function muzikSureKisaAdi(sure) {
  return String(sure?.ad || '').replace(/ nota$/i, '').replace(/\s*\(.+\)$/u, '');
}

function muzikNotaNoktalari(notaAd, sureIndeksi) {
  const nota = MUZIK_TEMEL_NOTALAR.find((n) => n.ad === notaAd) || MUZIK_TEMEL_NOTALAR[0];
  const sure = MUZIK_SURE_GOSTERGELERI[sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
  return [...new Set([...nota.noktalar, ...sure.noktalarEk])].sort((a, b) => a - b);
}

function muzikNotaSkorOgesi(id, notaAd, sureIndeksi, ek = {}) {
  const sure = MUZIK_SURE_GOSTERGELERI[sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
  const noktalar = muzikNotaNoktalari(notaAd, sureIndeksi);
  return {
    id,
    tip: 'nota',
    notaAd,
    sureIndeksi,
    oktav: ek.oktav ?? 4,                       // varsayılan 4. oktav (middle C)
    accidental: ek.accidental ?? null,          // 'sharp' | 'flat' | 'natural' | 'doubleSharp' | 'doubleFlat' | null
    dotted: ek.dotted ?? false,                 // noktalı nota
    modifiers: ek.modifiers || { oncesi: [], sonrasi: [] },
    ad: `${notaAd} · ${muzikSureKisaAdi(sure)}`,
    gorunum: `${notaAd}${sure.sembol}`,
    hucreler: [noktalar],
    aciklama: `${notaAd} notasının ${sure.ad} değeri. Noktalar: ${noktalar.join('-')}.`,
  };
}

// Diatonik aralık hesabı (Modül 8 Bölüm 3): notaları say (kendi dahil)
const MUZIK_NOTA_DIYATONIK_SIRA = { do: 0, re: 1, mi: 2, fa: 3, sol: 4, la: 5, si: 6 };
function muzikDiatonikAralik(prev, cur) {
  const a = MUZIK_NOTA_DIYATONIK_SIRA[prev.notaAd] ?? 0;
  const b = MUZIK_NOTA_DIYATONIK_SIRA[cur.notaAd] ?? 0;
  const absA = (prev.oktav ?? 4) * 7 + a;
  const absB = (cur.oktav ?? 4) * 7 + b;
  return Math.abs(absB - absA) + 1;
}

// Audit Aşama 15 — Key signature etkisi (Modül 8 Bölüm 4 Key Signatures).
// Donanım sırası standart: F# C# G# D# A# E# B# / Bb Eb Ab Db Gb Cb Fb
const MUZIK_DIYEZ_SIRASI = ['fa', 'do', 'sol', 're', 'la', 'mi', 'si'];
const MUZIK_BEMOL_SIRASI = ['si', 'mi', 'la', 're', 'sol', 'do', 'fa'];
function muzikKeySignatureEtkilenenler(keySignature) {
  if (!keySignature || !keySignature.ad) return { sharps: [], flats: [] };
  const ad = String(keySignature.ad).toLowerCase();
  // "1 diyezli donanım" → 1 ; "4 bemollü donanım" → 4
  const sayiMatch = /(\d+)\s*(diyez|bemol)/.exec(ad);
  if (!sayiMatch) return { sharps: [], flats: [] };
  const n = Math.min(7, parseInt(sayiMatch[1], 10));
  const sharps = /diyez/.test(sayiMatch[2]) ? MUZIK_DIYEZ_SIRASI.slice(0, n) : [];
  const flats = /bemol/.test(sayiMatch[2]) ? MUZIK_BEMOL_SIRASI.slice(0, n) : [];
  return { sharps, flats };
}

// Bir notanın donanım altında etkili aksidentali nedir?
// (Bilgilendirme / uyarı amaçlı — BRF üretimi note.accidental field'ına saygı duyar)
function muzikEffectiveAccidental(note, keyEtki) {
  if (!note || !note.notaAd) return null;
  if (note.accidental) return note.accidental; // explicit override
  if (keyEtki.sharps.includes(note.notaAd)) return 'sharp';
  if (keyEtki.flats.includes(note.notaAd)) return 'flat';
  return null;
}

// Audit Aşama 8 — Müzik içi serbest ifade için kontraksiyonsuz harf hücreleri.
// Modül 8 Bölüm 6: kelimeler word-sign (3-4-5) ile başlar, Grade 1 (kontraksiyonsuz),
// büyük harf göstergesi kullanılmaz. Sonraki notaya oktav işareti zorunlu.
const MUZIK_HARF_NOKTALARI = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5], f: [1, 2, 4], g: [1, 2, 4, 5],
  h: [1, 2, 5], i: [2, 4], j: [2, 4, 5], k: [1, 3], l: [1, 2, 3], m: [1, 3, 4],
  n: [1, 3, 4, 5], o: [1, 3, 5], p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5],
  s: [2, 3, 4], t: [2, 3, 4, 5], u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6],
  x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6],
};
function muzikKontraksiyonsuzMetinHucreleri(metin) {
  const hucreler = [];
  const m = String(metin || '').toLocaleLowerCase('tr');
  for (const c of m) {
    if (c === ' ') { hucreler.push([]); continue; }
    if (c === '.') { hucreler.push([2, 5, 6]); continue; }
    if (c === ',') { hucreler.push([2]); continue; }
    if (c === '-') { hucreler.push([3, 6]); continue; }
    if (MUZIK_HARF_NOKTALARI[c]) hucreler.push(MUZIK_HARF_NOKTALARI[c]);
  }
  return hucreler;
}

// Audit Aşama 3 — Time signature → ölçü başına beklenen 16'lık süre.
function muzikTimeSigExpected16(adVeyaGorunum) {
  const s = String(adVeyaGorunum || '').toLowerCase();
  if (/(^|\s)4\/4(\s|$)|common/.test(s)) return 16;
  if (/(^|\s)3\/4(\s|$)/.test(s)) return 12;
  if (/(^|\s)2\/4(\s|$)/.test(s)) return 8;
  if (/(^|\s)6\/8(\s|$)/.test(s)) return 12;
  if (/(^|\s)3\/8(\s|$)/.test(s)) return 6;
  if (/(^|\s)9\/8(\s|$)/.test(s)) return 18;
  if (/(^|\s)12\/8(\s|$)/.test(s)) return 24;
  if (/(^|\s)2\/2(\s|$)|cut.*common/.test(s)) return 16;
  return null;
}

// Audit Aşama 1 — Sus skor öğesi: nota gibi sureIndeksi + realValue + dotted modeli.
// Modül 8 dual-meaning: aynı hücre büyük (tam/yarım/dörtlük/sekizlik sus) veya
// küçük (16/32/64/128'lik sus) anlamına gelebilir; süre seçimi bağlamı belirler.
const MUZIK_SUS_HUCRELERI = {
  1: [1, 3, 4],      // semibreve rest = 16th rest
  2: [1, 3, 6],      // minim rest = 32nd rest
  4: [1, 2, 3, 6],   // crotchet rest = 64th rest
  8: [1, 3, 4, 6],   // quaver rest = 128th rest
  16: [1, 3, 4],     // 16th rest (semibreve hücresi)
  32: [1, 3, 6],     // 32nd rest (minim hücresi)
  64: [1, 2, 3, 6],  // 64th rest (crotchet hücresi)
  128: [1, 3, 4, 6], // 128th rest (quaver hücresi)
};
function muzikSusSkorOgesi(id, sureIndeksi, ek = {}) {
  const sure = MUZIK_SURE_GOSTERGELERI[sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
  const realValue = sure.realValue || 8;
  const hucre = MUZIK_SUS_HUCRELERI[realValue] || [1, 3, 4, 6];
  return {
    id,
    tip: 'sus',
    sureIndeksi,
    realValue,
    dotted: ek.dotted ?? false,
    ad: `${muzikSureKisaAdi(sure)} sus${ek.dotted ? ' (noktalı)' : ''}`,
    gorunum: `${sure.sembol}↯`,
    hucreler: [hucre],
    aciklama: `${muzikSureKisaAdi(sure)} suskunluk. Hücre: ${hucre.join('-')}${ek.dotted ? ' + dot 3' : ''}.`,
  };
}

// Modül 8 Bölüm 3 — Oktav işareti gerekli mi?
function muzikOktavGerekliMi(prevNota, curNota, ctx = {}) {
  if (!curNota || curNota.tip !== 'nota') return false;
  if (ctx.ilkNota) return true;
  if (ctx.yeniBrailleSatiri) return true;
  if (ctx.timeKeyDegisimiSonrasi) return true;
  if (ctx.sectionalDoubleBarlineSonrasi) return true;
  if (!prevNota) return true;
  const aralik = muzikDiatonikAralik(prevNota, curNota);
  const oktavDegisti = (prevNota.oktav ?? 4) !== (curNota.oktav ?? 4);
  if (aralik <= 3) return false;             // 2'li/3'lü: asla
  if (aralik <= 5) return oktavDegisti;      // 4'lü/5'li: oktav değiştiyse
  return true;                                // 6'lı ve üzeri: daima
}

// 1–7. oktav işareti hücreleri (Modül 8 tablosu)
const MUZIK_OKTAV_HUCRELERI = [
  [4],        // 1. oktav (en pes)
  [4, 5],     // 2. oktav
  [4, 5, 6],  // 3. oktav
  [5],        // 4. oktav (orta do)
  [4, 6],     // 5. oktav
  [5, 6],     // 6. oktav
  [6],        // 7. oktav (en tiz)
];
function muzikOktavHucresi(oktav) {
  return MUZIK_OKTAV_HUCRELERI[(oktav || 4) - 1] || MUZIK_OKTAV_HUCRELERI[3];
}

// Aksidental hücreleri
const MUZIK_ACCIDENTAL_HUCRELERI = {
  sharp:       [[1, 4, 6]],
  flat:        [[1, 2, 6]],
  natural:     [[1, 6]],
  doubleSharp: [[1, 4, 6], [1, 4, 6]],
  doubleFlat:  [[1, 2, 6], [1, 2, 6]],
};
function muzikAccidentalHucreleri(acc) {
  return acc ? (MUZIK_ACCIDENTAL_HUCRELERI[acc] || []) : [];
}

function muzikMetinKucuk(deger) {
  return String(deger || '').toLocaleLowerCase('tr');
}

function muzikOgeGorselTipi(oge) {
  const ad = muzikMetinKucuk(oge.ad);
  const kategori = muzikMetinKucuk(oge.kategori);
  if (oge.tip === 'anahtar') return 'anahtar';
  if (oge.tip === 'nota') return 'nota';
  if (oge.tip === 'sus' || ad.includes('sus') || ad.includes(' es')) return 'sus';
  if (kategori.includes('zaman') || /^\d+\/\d+$/.test(String(oge.gorunum || '')) || ad.includes('common time')) return 'zaman';
  if (kategori.includes('değiştir') || ad.includes('diyez') || ad.includes('bemol') || ad.includes('natural') || ad.includes('naturel')) return 'degistirici';
  if (kategori.includes('donanım') || ad.includes('donanım')) return 'donanim';
  if (kategori.includes('ölçü') || ad.includes('çizgisi') || ad.includes('röpriz') || ad.includes('repeat') || ad.includes('volta') || ad.includes('dolap')) return 'olcu';
  if (kategori.includes('bağ') || ad.includes('slur') || ad.includes('bağ')) return 'bag';
  if (kategori.includes('hairpin') || ad.includes('hairpin')) return 'hairpin';
  if (kategori.includes('dinamik') || /\b(pp|p|mp|mf|f|ff|sf)\b/u.test(ad) || ad.includes('cresc') || ad.includes('decresc') || ad.includes('dim') || ad.includes('rit')) return 'dinamik';
  if (kategori.includes('nüans') || ad.includes('staccato') || ad.includes('accent') || ad.includes('tenuto') || ad.includes('fermata') || ad.includes('nefes') || ad.includes('caesura')) return 'nuans';
  if (kategori.includes('süs') || ad.includes('trill') || ad.includes('turn') || ad.includes('mordent') || ad.includes('glissando') || ad.includes('appoggiatura')) return 'susleme';
  if (kategori.includes('düzensiz') || ad.includes('üçleme') || ad.includes('leme') || ad.includes('tuplet')) return 'tuplet';
  if (kategori.includes('oktav') || ad.includes('oktav')) return 'oktav';
  if (kategori.includes('tekrar') || ad.includes('tekrar')) return 'tekrar';
  return 'metin';
}

function muzikGorselMetni(oge) {
  const ad = muzikMetinKucuk(oge.ad);
  const gorunum = String(oge.gorunum || oge.sembol || '').trim();
  const tip = muzikOgeGorselTipi(oge);
  if (tip === 'hairpin') return ad.includes('decresc') ? '>' : '<';
  if (tip === 'donanim') {
    const sayi = Number(ad.match(/(\d+)/)?.[1] || 1);
    const sembol = ad.includes('bemol') ? '♭' : ad.includes('diyez') ? '♯' : '♮';
    return sembol.repeat(Math.max(1, Math.min(7, sayi)));
  }
  if (tip === 'tuplet') return ad.match(/(\d+)/)?.[1] || (ad.includes('üç') ? '3' : 'n');
  if (tip === 'oktav') return ad.match(/(\d+)/)?.[1] ? `${ad.match(/(\d+)/)?.[1]}. okt.` : 'okt.';
  if (tip === 'bag') return ad.includes('tie') || ad.includes('bağ') ? '⌣' : '⌒';
  if (tip === 'dinamik') {
    const ilk = String(oge.ad || '').match(/^(pp|mp|mf|ff|sf|p|f|cresc\.?|decresc\.?|dim\.?|rit\.?)\b/i)?.[1];
    if (ilk) return ilk.endsWith('.') ? ilk : ilk;
  }
  if (tip === 'nuans') {
    if (ad.includes('fermata')) return '𝄐';
    if (ad.includes('nefes')) return ',';
    if (ad.includes('caesura')) return '//';
    if (ad.includes('accent')) return '>';
    if (ad.includes('tenuto')) return '—';
    if (ad.includes('staccato')) return '•';
  }
  if (tip === 'susleme') {
    if (ad.includes('trill')) return 'tr';
    if (ad.includes('turn')) return '∽';
    if (ad.includes('mordent')) return '𝆝';
    if (ad.includes('glissando')) return 'gliss.';
  }
  if (gorunum && !/^ölçüler arası/i.test(gorunum) && gorunum !== oge.ad) return gorunum;
  return gorunum || oge.ad || '♪';
}

function muzikZamanImzasiParcalari(deger) {
  const metin = String(deger || '').trim();
  const eslesme = metin.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!eslesme) return null;
  return { ust: eslesme[1], alt: eslesme[2] };
}

function muzikKayittanSkorOgesi(id, kayit, ek = {}) {
  const hucreler = Array.isArray(kayit.hucreler)
    ? (kayit.hucreler.length === 0 ? [[]] : kayit.hucreler.map((h) => [...h]))
    : [[]];
  const temel = {
    id,
    tip: ek.tip || kayit.tip || 'isaret',
    kategori: ek.kategori || kayit.kategori || '',
    ad: kayit.ad || ek.ad || 'İşaret',
    gorunum: kayit.gorunum || kayit.sembol || kayit.okumaOzeti || kayit.ad || '♪',
    aciklama: kayit.aciklama || '',
    kurallar: kayit.kurallar || [],
    hucreler,
  };
  return {
    ...temel,
    gorselTip: muzikOgeGorselTipi(temel),
    gorselMetin: muzikGorselMetni(temel),
  };
}

function muzikSkorMetni(ogeler) {
  return ogeler.map((oge) => oge.gorunum || oge.ad || '♪').join(' ');
}

// Modül 8, Bölüm 4A — Bir notadan ÖNCE gelen işaretlerin kesin sırası:
// 1) forward repeat, 2) volta, 3) opening bracket slur, 4) word/dynamic,
// 5) triplet/irregular, 6) ornament-accidental, 7) ornament, 8) articulation,
// 9) accidental, 10) octave
function muzikModifierOncesiSira(kayit) {
  const ad = String(kayit.ad || '').toLowerCase();
  const tip = String(kayit.gorselTip || '');
  if (/forward|ileri.*tekrar/.test(ad)) return 1;
  if (/volta|\bev\b|dolap/.test(ad)) return 2;
  if (tip === 'bag' && /(açılış|aç\b|köşeli.*aç|opening)/.test(ad)) return 3;
  if (tip === 'dinamik' || tip === 'hairpin') return 4;
  if (tip === 'tuplet' || /üçleme|leme|tuplet/.test(ad)) return 5;
  if (tip === 'susleme') return 7;
  if (tip === 'nuans') return 8;
  if (tip === 'degistirici' || tip === 'donanim') return 9;
  if (tip === 'oktav') return 10;
  return 6;
}

// Bölüm 4B — Bir notadan SONRA gelen işaretlerin kesin sırası:
// 1) dot, 2) fermata, 3) slur/opening double, 4) closing bracket slur,
// 5) tie, 6) hairpin terminator, 7) breath/break, 8) backward repeat
function muzikModifierSonrasiSira(kayit) {
  const ad = String(kayit.ad || '').toLowerCase();
  const tip = String(kayit.gorselTip || '');
  if (/fermata/.test(ad)) return 2;
  if (tip === 'bag' && /(kapanış|kapa\b|köşeli.*kapa|closing)/.test(ad)) return 4;
  if (tip === 'bag' && /(tie|^bağ\b)/.test(ad)) return 5;
  if (tip === 'bag') return 3;
  if (tip === 'hairpin' && /(bitir|terminator|son)/.test(ad)) return 6;
  if (/nefes|kesme|caesura|break|breath/.test(ad)) return 7;
  if (/backward|geri/.test(ad)) return 8;
  return 9;
}

// Modül 8 Bölüm 4 — Gruplama (Grouping/Beaming)
// Aynı küçük süredeki (16, 32, 64) ardışık 3+ nota gruplandığında:
//   - İlk nota: gerçek değeriyle yazılır (örn 16-lık hücresi)
//   - Diğer notalar: sadece pitch hücresi (sekizlik gibi) yazılır
//   - Okuyucu, baştaki gerçek değerden grubun süresini anlar
function muzikNotaSadePitchHucresi(notaAd) {
  const nota = MUZIK_TEMEL_NOTALAR.find((n) => n.ad === notaAd) || MUZIK_TEMEL_NOTALAR[0];
  return [...nota.noktalar].sort((a, b) => a - b);
}

// Modül 8 — bir es'in gerçek değerini (dual-meaning) tahmin et:
// tam-rest (1) ↔ 16'lık rest ; yarım-rest (2) ↔ 32'lik ; dörtlük (4) ↔ 64'lük
function muzikRestKucukSureDegeri(oge) {
  if (!oge || oge.tip === 'nota') return null;
  // Önce explicit realValue alanı (yeni sus modeli)
  if (oge.tip === 'sus' && oge.realValue) {
    const dual = { 1: 16, 2: 32, 4: 64, 8: 128 };
    return dual[oge.realValue] || null;
  }
  const ad = String(oge.ad || '').toLowerCase();
  if (/(tam|birlik).*sus/.test(ad)) return 16;
  if (/(yarım|ikilik).*sus/.test(ad)) return 32;
  if (/dörtlük.*sus/.test(ad)) return 64;
  return null;
}

// Bir sus öğesinin gerçek (büyük) süre değerini ad'dan çıkar.
// 1=tam, 2=yarım, 4=dörtlük, 8=sekizlik
function muzikRestSureFromName(ad) {
  const lower = String(ad || '').toLowerCase();
  if (/(tam|birlik).*sus/.test(lower)) return 1;
  if (/(yarım|ikilik).*sus/.test(lower)) return 2;
  if (/dörtlük.*sus/.test(lower)) return 4;
  if (/sekizlik.*sus/.test(lower)) return 8;
  return null;
}

// Bir öğenin 16'lık cinsinden süresi (ölçü içi pozisyon takibi için).
// Formül: 16 / realValue → tam=16, yarım=8, dörtlük=4, sekizlik=2, 16=1, 32=0.5, 64=0.25
// Noktalı nota/sus değeri 1,5× artar (Modül 8 Bölüm 2).
// tupletNotaIdMap verilirse: nota bir tuplet içinde ise süre × (inTimeOf/played) (Modül 8 Bölüm 8)
function muzikOge16Suresi(oge, tupletNotaIdMap = null) {
  if (!oge) return 0;
  const tupletFactor = (id) => {
    if (!tupletNotaIdMap) return 1;
    const info = tupletNotaIdMap.get(id);
    if (!info) return 1;
    const r = info.tuplet?.ratio;
    return r && r.played ? (r.inTimeOf / r.played) : 1;
  };
  if (oge.tip === 'nota') {
    const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
    if (!sure || !sure.realValue) return 0;
    let base = 16 / sure.realValue;
    if (oge.dotted) base *= 1.5;
    base *= tupletFactor(oge.id);
    return base;
  }
  if (oge.tip === 'sus' && oge.realValue) {
    let base = 16 / oge.realValue;
    if (oge.dotted) base *= 1.5;
    base *= tupletFactor(oge.id);
    return base;
  }
  // Eski yöntem: ad parse (geriye dönük uyumluluk)
  const ad = String(oge.ad || '').toLowerCase();
  if (/noktalı dörtlük.*sus/.test(ad)) return 6;
  if (/(tam|birlik).*sus/.test(ad)) return 16;
  if (/(yarım|ikilik).*sus/.test(ad)) return 8;
  if (/dörtlük.*sus/.test(ad)) return 4;
  if (/sekizlik.*sus/.test(ad)) return 2;
  return 0;
}

function muzikOlcuAyraciMi(oge) {
  if (!oge || oge.tip === 'nota') return false;
  const ad = String(oge.ad || '').toLowerCase();
  return /ölçü ayracı|ölçü çizgisi|barline/.test(ad);
}

// Her öğenin bulunduğu ölçü içindeki başlangıç 16'lık pozisyonunu hesapla.
// Ölçü ayracı görüldüğünde 0'a sıfırlanır.
function muzikBeatPozisyonlari(ogeler, tupletNotaIdMap = null) {
  const poz = new Array(ogeler.length).fill(0);
  let cur = 0;
  for (let i = 0; i < ogeler.length; i++) {
    poz[i] = cur;
    if (muzikOlcuAyraciMi(ogeler[i])) cur = 0;
    else cur += muzikOge16Suresi(ogeler[i], tupletNotaIdMap);
  }
  return poz;
}

// Aynı vuruş içinde mi? Default beat unit = 4 (16'lık) = bir dörtlük (4/4 vb.).
function muzikAyniVurusMu(p1, p2, beatUnit = 4) {
  return Math.floor(p1 / beatUnit) === Math.floor(p2 / beatUnit);
}

// Modül 8 Bölüm 4 — Grouping kuralı:
// 1) realValue >= 16 (sekizlikten küçük)
// 2) En az 3 öğe
// 3) İlk öğe NOTA veya aynı değerde SUS (es) olabilir
// 4) Sonraki öğeler NOTA olmalı (sus yalnız başta olabilir)
// 5) Hepsi aynı küçük süre değerinde olmalı
// 6) Aynı satırda tamamlanmalı (satır sınırı aşılmaz)
// 7) Aynı VURUŞ içinde olmalı (default beat unit = 4 sixteenths)
// 8) Grup sonrasında aynı ölçü içinde sekizlik / sekizlik-sus gelmemeli
function muzikGrupTespit(ogeler, baslangic, beatPos = null, beatUnit = 4) {
  const bas = ogeler[baslangic];
  if (!bas) return 0;

  // Bas öğenin "küçük süre" değerini belirle
  let smallReal = null;
  if (bas.tip === 'nota') {
    const basSure = MUZIK_SURE_GOSTERGELERI[bas.sureIndeksi ?? 0];
    if (basSure && basSure.realValue >= 16) smallReal = basSure.realValue;
  } else {
    smallReal = muzikRestKucukSureDegeri(bas);
  }
  if (!smallReal) return 0;

  const basSatir = Math.floor(baslangic / MUZIK_SATIR_KAPASITESI);
  const pozCache = beatPos || muzikBeatPozisyonlari(ogeler);

  let i = baslangic + 1;
  while (i < ogeler.length) {
    const o = ogeler[i];
    if (!o || o.tip !== 'nota') break; // sus yalnız başta olabilir
    const oSure = MUZIK_SURE_GOSTERGELERI[o.sureIndeksi ?? 0];
    if (!oSure || oSure.realValue !== smallReal) break;
    if (Math.floor(i / MUZIK_SATIR_KAPASITESI) !== basSatir) break;
    // Aynı vuruş kontrolü: bas ile aynı vuruş içinde mi?
    if (!muzikAyniVurusMu(pozCache[baslangic], pozCache[i], beatUnit)) break;
    i++;
  }
  const sayi = i - baslangic;
  if (sayi < 3) return 0;

  // Modül 8: Grup sonrası AYNI ölçü içinde sekizlik nota, noktalı sekizlik nota
  // veya sekizlik sus gelirse grup yapılmaz. Önümüzdeki öğeleri ölçü ayracına kadar tara.
  for (let j = i; j < ogeler.length; j++) {
    const o = ogeler[j];
    if (!o) break;
    if (muzikOlcuAyraciMi(o)) break; // yeni ölçü başlıyor, kontrol bitti
    if (o.tip === 'nota') {
      const oSure = MUZIK_SURE_GOSTERGELERI[o.sureIndeksi ?? 0];
      if (oSure && oSure.realValue === 8) return 0; // sekizlik nota (noktalı dahil)
    } else {
      const ad = String(o.ad || '').toLowerCase();
      if (/sekizlik.*sus/.test(ad)) return 0;
      if (/noktalı.*sekizlik.*sus/.test(ad)) return 0;
    }
  }

  return sayi;
}

// Audit Aşama 3 — Ölçü modeli: bar ayraçlarına göre böl + her ölçü için
// expectedDuration16 / totalDuration16 + warnings hesapla.
function muzikOlcuyeBol(ogeler, header = null, tupletNotaIdMap = null) {
  const expectedDur = header && header.timeSignature
    ? (header.timeSignature.expectedDuration16 ?? null)
    : null;
  const olculer = [];
  const sureTopla = (items) => items.reduce((s, o) => s + muzikOge16Suresi(o, tupletNotaIdMap), 0);
  let aktif = { no: 1, baslangic: 0, items: [], indices: [] };
  for (let i = 0; i < ogeler.length; i++) {
    const oge = ogeler[i];
    if (muzikOlcuAyraciMi(oge)) {
      aktif.son = i - 1;
      aktif.totalDuration16 = sureTopla(aktif.items);
      aktif.expectedDuration16 = expectedDur;
      aktif.isPickup = olculer.length === 0 && expectedDur != null && aktif.totalDuration16 < expectedDur;
      aktif.warnings = muzikOlcuUyari(aktif);
      olculer.push(aktif);
      aktif = { no: olculer.length + 1, baslangic: i + 1, items: [], indices: [] };
    } else {
      aktif.items.push(oge);
      aktif.indices.push(i);
    }
  }
  if (aktif.items.length || olculer.length === 0) {
    aktif.son = ogeler.length - 1;
    aktif.totalDuration16 = sureTopla(aktif.items);
    aktif.expectedDuration16 = expectedDur;
    aktif.isPickup = olculer.length === 0 && expectedDur != null && aktif.totalDuration16 < expectedDur;
    aktif.warnings = muzikOlcuUyari(aktif);
    olculer.push(aktif);
  }
  return olculer;
}

// Audit Ek Rapor — Otomatik ölçü çizgisi:
// Header.timeSignature beklenen 16'lık değere ulaşan ölçüye boş hücre (barline) ekler.
// Önceki ölçü ayracından sonraki süreyi toplayıp eşik kontrol eder.
function muzikSonAyracIndeksi(list) {
  for (let i = list.length - 1; i >= 0; i--) {
    if (muzikOlcuAyraciMi(list[i])) return i;
  }
  return -1;
}

function muzikOtomatikOlcuCizgisiEkle(list, header) {
  const beklenen = header?.timeSignature?.expectedDuration16;
  if (!beklenen) return list;
  const sonAyrac = muzikSonAyracIndeksi(list);
  let dolu = 0;
  for (let i = sonAyrac + 1; i < list.length; i++) {
    dolu += muzikOge16Suresi(list[i]);
  }
  if (dolu >= beklenen && list.length > 0 && !muzikOlcuAyraciMi(list[list.length - 1])) {
    const barOge = {
      id: `auto-bar-${list.length}`,
      tip: 'isaret',
      auto: true,
      ad: 'ölçü ayracı (boşluk)',
      gorunum: '|',
      hucreler: [[]],
      aciklama: 'Otomatik ölçü çizgisi (zaman imzasına göre)',
    };
    return [...list, barOge];
  }
  return list;
}

// Audit Aşama 4 — BRF Layout motoru.
// Ölçülerin BRF satır genişliğine göre nereye bölüneceğini hesaplar; her ölçüye
// "bu ölçü yeni Braille satırında mı başlıyor?" bilgisi ekler. Böylece BRF
// emit'i sırasında yeni satır ilk notası oktav işareti alabilir (Modül 8 Bölüm 3).
function muzikMeasureBRFTahminiUzunluk(measure) {
  let toplam = 0;
  for (const o of measure.items || []) {
    if (o.tip === 'nota') {
      toplam += 1; // nota hücresi
      if (o.accidental) toplam += (o.accidental === 'doubleSharp' || o.accidental === 'doubleFlat' ? 2 : 1);
      toplam += 1; // oktav işareti olabilir (tahmini)
      if (o.dotted) toplam += 1;
      const oncesi = o.modifiers?.oncesi?.length || 0;
      const sonrasi = o.modifiers?.sonrasi?.length || 0;
      toplam += (oncesi + sonrasi) * 1.4;
    } else if (o.tip === 'sus') {
      toplam += 1 + (o.dotted ? 1 : 0);
    } else {
      // Ölçü ayracı / bilinmeyen işaret — hücreler dizisinden tahmin et
      const h = Array.isArray(o.hucreler) ? o.hucreler.length : 1;
      toplam += Math.max(1, h);
    }
  }
  return Math.ceil(toplam) + 1; // ölçü sonu boşluk
}

function muzikLayoutSatirlari(olculer, satirdaHucre = 40, barNumberPad = 4) {
  if (!Array.isArray(olculer) || !olculer.length) return [];
  const usableWidth = Math.max(8, satirdaHucre - barNumberPad);
  const satirlar = [];
  let aktif = { measures: [], len: 0 };
  for (const m of olculer) {
    const len = muzikMeasureBRFTahminiUzunluk(m);
    if (aktif.measures.length > 0 && aktif.len + len > usableWidth) {
      satirlar.push(aktif);
      aktif = { measures: [m], len };
    } else {
      aktif.measures.push(m);
      aktif.len += len;
    }
  }
  if (aktif.measures.length) satirlar.push(aktif);
  // Her satırın ilk ölçüsünü işaretle
  for (const s of satirlar) {
    if (s.measures[0]) s.measures[0].startsNewBrailleLine = true;
  }
  return satirlar;
}

function muzikOlcuUyari(measure) {
  const w = [];
  if (measure.expectedDuration16 == null) return w;
  const tot = measure.totalDuration16 || 0;
  const exp = measure.expectedDuration16;
  if (tot > exp + 0.001) w.push(`${measure.no}. ölçü fazla süre içeriyor (${tot}/${exp}).`);
  if (tot < exp - 0.001 && !measure.isPickup) w.push(`${measure.no}. ölçü eksik süre içeriyor (${tot}/${exp}).`);
  return w;
}

// Audit E — Ölçü hash'i: iki ölçü musical olarak aynı mı?
// Modül 8: braille bar repeat yalnız nüanslar/dinamik/aksidental/oktav AYNI ise kullanılabilir.
// Müzikal içerik olmayan öğe tipleri — hash hesabında atlanır
const ARACLAR_HASH_ATLANAN_TIPLER = new Set([
  'anahtar', 'barline', 'sectionalBarline', 'finalBarline',
  'beginRepeat', 'endRepeat', 'timeSignatureChange', 'keySignatureChange',
]);

function muzikOlcuHash(olcu, baglar = []) {
  if (!olcu || !Array.isArray(olcu.items)) return '';

  const itemIds = new Set(olcu.items.filter((o) => o?.id).map((o) => o.id));

  // Tamamen bu ölçü içinde başlayıp biten bağlar için nota başına imza üret
  const notaBagImzasi = new Map();
  for (const b of (baglar || [])) {
    const tip = String(b.tip || b.kayit?.tip || 'bag').toLowerCase();
    const bagIds = (Array.isArray(b.notaIdler) && b.notaIdler.length >= 2)
      ? b.notaIdler.filter(Boolean)
      : [b.basId, b.sonId].filter(Boolean);
    if (bagIds.length < 2 || !bagIds.every((id) => itemIds.has(id))) continue;
    bagIds.forEach((id, i) => {
      const rol = i === 0 ? 'bas' : i === bagIds.length - 1 ? 'son' : 'ara';
      const mevcut = notaBagImzasi.get(id) || [];
      mevcut.push(`${tip}-${rol}`);
      notaBagImzasi.set(id, mevcut);
    });
  }

  return olcu.items
    .filter((o) => o && !ARACLAR_HASH_ATLANAN_TIPLER.has(o.tip))
    .map((o) => {
      if (o.tip === 'nota') {
        const mods = (yon) => (Array.isArray(o.modifiers?.[yon]) ? o.modifiers[yon] : [])
          .map((m) => m.kayit?.ad || '').sort().join(',');
        const bagImza = (notaBagImzasi.get(o.id) || []).sort().join(',');
        return [
          'N', o.notaAd, o.sureIndeksi, o.oktav ?? 4,
          o.accidental || '-', o.dotted ? 'd' : '-',
          mods('oncesi'), mods('sonrasi'),
          bagImza,
        ].join('|');
      }
      if (o.tip === 'sus') return ['S', o.realValue, o.dotted ? 'd' : '-'].join('|');
      return ['X', o.ad || o.tip || ''].join('|');
    })
    .join('~');
}

// Audit Aşama 6 — Otomatik bar repeat: ardışık özdeş ölçüleri ⠶ ile değiştir.
// Modül 8 Bölüm 10: yalnız nüanslar/dinamik/aksidental/slur/oktav AYNI ise.
// Ayrıca ölçü sınırlarını aşan bag/slur varsa repeat uygulanmaz.
function muzikBarRepeatUygunMu(prev, cur, baglar) {
  if (!prev || !cur) return false;
  if (!prev.items.length || !cur.items.length) return false;
  // Hash artık ölçü içi bağları da kapsıyor
  if (muzikOlcuHash(prev, baglar) !== muzikOlcuHash(cur, baglar)) return false;
  const prevIds = new Set(prev.items.map((o) => o.id));
  const curIds = new Set(cur.items.map((o) => o.id));
  // Cross-measure bağ kontrolü (biri önceki ölçüde başlayıp diğerinde bitiyor)
  for (const b of (baglar || [])) {
    const basIds = Array.isArray(b.notaIdler) ? b.notaIdler : [b.basId, b.sonId].filter(Boolean);
    if (basIds.length < 2) continue;
    const basId = basIds[0];
    const sonId = basIds[basIds.length - 1];
    if ((prevIds.has(basId) && curIds.has(sonId)) || (curIds.has(basId) && prevIds.has(sonId))) {
      return false;
    }
  }
  return true;
}

function muzikAutoBarRepeatHaritasi(olculer, baglar = []) {
  const harita = new Map();
  for (let i = 1; i < olculer.length; i++) {
    // brailleShorthand ölçülerini asla otomatik tekrar olarak işaretleme
    const prevFirst = olculer[i - 1]?.items?.[0];
    const curFirst = olculer[i]?.items?.[0];
    if (prevFirst?.tip === 'brailleShorthand' || curFirst?.tip === 'brailleShorthand') continue;
    if (muzikBarRepeatUygunMu(olculer[i - 1], olculer[i], baglar)) {
      harita.set(i, true);
    }
  }
  return harita;
}

// Audit Aşama 6 finalize — Repeat aday analizi.
// Ardışık olmayan tekrarları arar; kısa pasaj için backward-numeral repeat,
// uzak/sık tekrar için bar-number repeat önerir.
function muzikRepeatAdaylariniBul(olculer, baglar = [], autoBarHar = new Map()) {
  const oneriler = [];
  // Tek-ölçü uzak tekrar: ölçü N öncekiyle aynı değil ama daha eski biriyle aynı
  for (let target = 2; target < olculer.length; target++) {
    if (autoBarHar.get(target)) continue; // zaten ardışık repeat ile çözüldü
    for (let source = target - 2; source >= 0; source--) {
      if (muzikBarRepeatUygunMu(olculer[source], olculer[target], baglar)) {
        const distance = target - source;
        oneriler.push({
          type: distance <= 8 ? 'backward-numeral' : 'bar-number',
          targetMeasure: target + 1,
          sourceMeasure: source + 1,
          countBack: distance,
          playBars: 1,
          aciklama: distance <= 8
            ? `${target + 1}. ölçü ${source + 1}. ölçü ile aynı (${distance} ölçü geri) → backward-numeral repeat`
            : `${target + 1}. ölçü ${source + 1}. ölçü ile aynı → bar-number repeat (#${source + 1})`,
        });
        break; // en yakın eşleşmeyi al
      }
    }
  }
  // Çoklu-ölçü blok eşleşmesi: ardışık N ölçü daha önce N ölçüye uyuyorsa
  for (let target = 2; target < olculer.length - 1; target++) {
    for (let len = 2; len <= Math.min(8, target); len++) {
      let eslesme = true;
      for (let k = 0; k < len; k++) {
        if (target + k >= olculer.length) { eslesme = false; break; }
        if (!muzikBarRepeatUygunMu(olculer[target - len + k - 1] || null, olculer[target + k], baglar)) {
          // Burada karşılaştırma kaynak olculer[?] ile target+k arasında
          eslesme = false; break;
        }
      }
      if (eslesme && len >= 2) {
        oneriler.push({
          type: 'backward-numeral-block',
          targetMeasure: target + 1,
          countBack: len,
          playBars: len,
          aciklama: `${target + 1}–${target + len}. ölçü blok olarak öncekiyle aynı → backward-numeral (#${len})`,
        });
        target += len; // bu bloğu atla
        break;
      }
    }
  }
  return oneriler;
}

// Üst-rakam (Antoine sırası, North-American Braille music): 1=⠁ (dot 1), 2=⠃ (dots 1-2) vb.
const MUZIK_UST_RAKAM = {
  '0': [2, 4, 5], '1': [1], '2': [1, 2], '3': [1, 4], '4': [1, 4, 5],
  '5': [1, 5], '6': [1, 2, 4], '7': [1, 2, 4, 5], '8': [1, 2, 5], '9': [2, 4],
};
function muzikUstRakamHucreleri(no) {
  return String(no).split('').map((d) => MUZIK_UST_RAKAM[d] || []);
}
function muzikSayiGostergesi() { return [3, 4, 5, 6]; }

// Audit Aşama 6 — Backward-numeral repeat (Modül 8 Bölüm 10).
// 8 ölçü geri say + 4 ölçü çal → #H#D ; eşit ise tek rakam.
function muzikBackwardNumeralRepeatHucreleri(countBack, playBars = null) {
  const sayi = muzikSayiGostergesi();
  const cb = muzikUstRakamHucreleri(countBack);
  if (playBars == null || countBack === playBars) return [sayi, ...cb];
  const pb = muzikUstRakamHucreleri(playBars);
  return [sayi, ...cb, sayi, ...pb];
}

// Audit Aşama 6 — Bar-number repeat (#2 veya #5-8).
function muzikBarNumberRepeatHucreleri(start, end = null) {
  const sayi = muzikSayiGostergesi();
  const sCells = muzikBarNumberHucreleri(start);
  if (end == null) return [sayi, ...sCells];
  const eCells = muzikBarNumberHucreleri(end);
  return [sayi, ...sCells, [3, 6], ...eCells]; // hyphen 3-6
}

// Audit G — Bar number alt-rakam hücreleri: sayı işareti olmadan lower-number
// Modül 8: ölçü numaraları satır başında alt hücrelerde yazılır.
function muzikBarNumberHucreleri(no) {
  // Lower-number mapping (Braille music): rakamların 2-3-5-6 vb. alt formları
  const lowerDigit = {
    '0': [3, 5, 6],
    '1': [2],
    '2': [2, 3],
    '3': [2, 5],
    '4': [2, 5, 6],
    '5': [2, 6],
    '6': [2, 3, 5],
    '7': [2, 3, 5, 6],
    '8': [2, 3, 6],
    '9': [3, 5],
  };
  return String(no).split('').map((d) => lowerDigit[d] || []);
}

// Ortak grup haritası üretici (BRF ve SVG için)
function muzikGruplariTespit(ogeler) {
  const harita = new Map();
  if (!Array.isArray(ogeler) || !ogeler.length) return harita;
  const beatPos = muzikBeatPozisyonlari(ogeler);
  for (let i = 0; i < ogeler.length; i++) {
    if (harita.has(i)) continue;
    const grupBoyu = muzikGrupTespit(ogeler, i, beatPos);
    if (grupBoyu > 0) {
      for (let k = 0; k < grupBoyu; k++) {
        harita.set(i + k, { konum: k, boy: grupBoyu });
      }
    }
  }
  return harita;
}

// Audit Aşama 2,8 — Header BRF emission: title/composer/tempo + key/time.
// Modül 8 Bölüm 1: key signature time signature'dan önce, ARALARINDA BOŞLUK YOK.
// Tempo işareti aynı satırda ölçü+ton donanımından önce, sonuna nokta (dot 3).
// Title/Composer/Tempo+KeyTime kendi satırlarında ORTALANIR (satırdaHucre = 40).
function muzikHucrelerOrtala(cells, satirdaHucre = 40) {
  const sol = Math.max(0, Math.floor((satirdaHucre - cells.length) / 2));
  const sag = Math.max(0, satirdaHucre - cells.length - sol);
  const out = [];
  for (let i = 0; i < sol; i++) out.push([]);
  for (const c of cells) out.push(c);
  for (let i = 0; i < sag; i++) out.push([]);
  return out;
}

function muzikHeaderHucreleriUret(header, satirdaHucre = 40) {
  if (!header) return [];
  const hucreler = [];
  const pushSatir = (cells, meta) => {
    const ortali = muzikHucrelerOrtala(cells, satirdaHucre);
    for (const h of ortali) hucreler.push({ noktalar: [...h], meta });
  };
  // Title (kontraksiyonsuz, kendi satırı, ortalı)
  if (header.title) {
    pushSatir(muzikKontraksiyonsuzMetinHucreleri(header.title), { kaynak: 'title', etiket: header.title });
  }
  // Composer
  if (header.composer) {
    pushSatir(muzikKontraksiyonsuzMetinHucreleri(header.composer), { kaynak: 'composer', etiket: header.composer });
  }
  // Tempo + key + time aynı satırda (Modül 8 Bölüm 1).
  // Tempo varsa sonuna dot 3 + boşluk; key boşluksuz time'dan önce.
  const ucuncuSatir = [];
  if (header.tempo) {
    const t = muzikKontraksiyonsuzMetinHucreleri(header.tempo);
    if (t.length) {
      ucuncuSatir.push(...t);
      ucuncuSatir.push([3]); // tempo sonu nokta
      ucuncuSatir.push([]);  // tempo ile imza arasında boşluk
    }
  }
  if (header.keySignature && Array.isArray(header.keySignature.hucreler)) {
    for (const h of header.keySignature.hucreler) ucuncuSatir.push([...h]);
  }
  if (header.timeSignature && Array.isArray(header.timeSignature.hucreler)) {
    for (const h of header.timeSignature.hucreler) ucuncuSatir.push([...h]);
  }
  if (ucuncuSatir.length) {
    pushSatir(ucuncuSatir, { kaynak: 'header-meta', etiket: 'tempo+key+time' });
  }
  return hucreler;
}

function muzikSkorunuBrailleyeCevir(ogeler, baglar = [], header = null, tupletler = []) {
  // Audit Aşama 7 — Tuplet haritası: hangi nota hangi tuplet'e ait, ilk mi?
  const tupletNotaIdMap = new Map(); // ogeId → { tuplet, ilkMi }
  for (const t of (tupletler || [])) {
    (t.notaIdler || []).forEach((id, i) => {
      tupletNotaIdMap.set(id, { tuplet: t, ilkMi: i === 0 });
    });
  }
  const hucreler = [];
  const esleme = [];
  const hucreMeta = []; // her hücre için { ogeId, kaynak: 'modifier'|'accidental'|'octave'|'note'|'note-pitch'|'dot'|'bag'|'sus', etiket }
  const kaynakParcalar = [];
  let kaynakIndeksi = 0;

  const metaEkle = (info) => { hucreMeta.push(info); };

  const modHucrelerEkle = (modListesi, ogeId, yon) => {
    for (const mod of modListesi || []) {
      const kayit = mod.kayit;
      if (!kayit || !Array.isArray(kayit.hucreler)) continue;
      const etiket = kayit.gorunum || kayit.ad || '·';
      if (kaynakParcalar.length) kaynakIndeksi += 1;
      kaynakParcalar.push(etiket);
      for (const hucre of kayit.hucreler) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId, kaynak: `modifier-${yon}`, etiket: kayit.ad });
      }
      kaynakIndeksi += etiket.length;
    }
  };

  // Aynı kural seti hem BRF hem SVG için: muzikGruplariTespit
  const gruplamaHaritasi = muzikGruplariTespit(ogeler);

  // Audit Aşama 2 — Header (key + time signature) BRF en başına yazılır
  const headerHucreleri = muzikHeaderHucreleriUret(header);
  for (const h of headerHucreleri) {
    if (kaynakParcalar.length) kaynakIndeksi += 1;
    kaynakParcalar.push(h.meta.etiket || '');
    hucreler.push([...h.noktalar]);
    esleme.push(kaynakIndeksi);
    metaEkle({ ogeId: null, ...h.meta });
    kaynakIndeksi += (h.meta.etiket || '').length;
  }

  // Audit E,F,G — Ölçü modeli + bar repeat tespiti (header + tuplet ile expected hesabı)
  const olculer = muzikOlcuyeBol(ogeler, header, tupletNotaIdMap);
  // Audit Aşama 4 — BRF satır layout: ölçü.startsNewBrailleLine bayrağı koyar.
  muzikLayoutSatirlari(olculer, 40, 4);
  const autoRepeatHaritasi = muzikAutoBarRepeatHaritasi(olculer, baglar);
  // Hangi öğenin hangi ölçüde ilk olduğunu hızlı bul
  const ogeOlcuIndeksi = new Map();
  for (let oi = 0; oi < olculer.length; oi++) {
    for (const idx of olculer[oi].indices) ogeOlcuIndeksi.set(idx, oi);
  }
  // Auto-repeat ölçüsünün ÖĞELERİNİ atla; sadece bir 7 yaz
  const atlananIndeksler = new Set();
  for (const [oi] of autoRepeatHaritasi) {
    for (const idx of (olculer[oi]?.indices || [])) atlananIndeksler.add(idx);
  }

  // Otomatik oktav için bağlam takibi (Modül 8 Bölüm 3)
  let sonNota = null;
  let timeKeyDegisimiBayragi = false;
  let sectionalBarlineBayragi = false;
  let yazilanOlculer = new Set();

  for (let idx = 0; idx < ogeler.length; idx++) {
    const oge = ogeler[idx];

    // Audit E,G — Ölçü başında işlemler:
    // - Modül 8 Bölüm 5: ölçü numarası SADECE BRF satır başlarına yazılır
    // - Modül 8 Bölüm 3: yeni Braille satırının ilk notası oktav alır
    // - Otomatik bar repeat: özdeş ölçüde 7 işareti
    const olcuIdx = ogeOlcuIndeksi.get(idx);
    if (olcuIdx !== undefined && olculer[olcuIdx].indices[0] === idx && !yazilanOlculer.has(olcuIdx)) {
      yazilanOlculer.add(olcuIdx);
      const olcu = olculer[olcuIdx];
      const yeniSatir = !!olcu.startsNewBrailleLine;
      // Bar number: sadece BRF satır başlarındaki ölçüler için (Modül 8 Bölüm 5)
      if (yeniSatir && !autoRepeatHaritasi.get(olcuIdx)) {
        const barNoHucreleri = muzikBarNumberHucreleri(olcuIdx + 1);
        if (barNoHucreleri.length) {
          if (kaynakParcalar.length) kaynakIndeksi += 1;
          kaynakParcalar.push(`#${olcuIdx + 1}`);
          for (const h of barNoHucreleri) {
            hucreler.push([...h]);
            esleme.push(kaynakIndeksi);
            metaEkle({ ogeId: null, kaynak: 'bar-number', etiket: `${olcuIdx + 1}. ölçü numarası (satır başı)` });
          }
          kaynakIndeksi += String(olcuIdx + 1).length;
        }
        // Yeni Braille satırı: ilk gerçek notaya oktav işareti zorunlu (Modül 8 Bölüm 3)
        timeKeyDegisimiBayragi = true;
      }
      // Otomatik bar repeat: bu ölçü öncekiyle özdeşse ⠶ işareti emit et, öğeleri atla
      if (autoRepeatHaritasi.get(olcuIdx)) {
        if (kaynakParcalar.length) kaynakIndeksi += 1;
        kaynakParcalar.push('𝄎');
        hucreler.push([2, 3, 5, 6]);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: null, olcuIdx, kaynak: 'bar-repeat', etiket: `Ölçü ${olcuIdx + 1}: bar repeat (önceki ölçüyle aynı)` });
        kaynakIndeksi += 1;
        // Ölçü sonu boşluğu: skip edilen barline'ın yerine — son ölçü değilse ekle
        if (olcuIdx < olculer.length - 1) {
          hucreler.push([]);
          esleme.push(kaynakIndeksi);
          metaEkle({ ogeId: null, kaynak: 'spacer', etiket: 'ölçü sonu boşluğu' });
        }
        timeKeyDegisimiBayragi = true;
      }
    }
    // Auto-repeat ölçüsünün öğelerini atla (zaten 7 emit edildi)
    if (atlananIndeksler.has(idx)) continue;

    if (oge.tip === 'nota') {
      const oncesiSirali = (Array.isArray(oge.modifiers?.oncesi) ? oge.modifiers.oncesi : [])
        .slice()
        .sort((a, b) => muzikModifierOncesiSira(a.kayit) - muzikModifierOncesiSira(b.kayit));
      modHucrelerEkle(oncesiSirali, oge.id, 'oncesi');
    }

    const etiket = oge.gorunum || oge.ad || '♪';
    if (kaynakParcalar.length) kaynakIndeksi += 1;
    kaynakParcalar.push(etiket);
    const grupBilgisi = oge.tip === 'nota' ? gruplamaHaritasi.get(idx) : null;

    // Modül 8 Bölüm 4 — Notadan önce: tuplet → accidental → octave → note
    if (oge.tip === 'nota') {
      // Audit Aşama 7 — Tuplet sign: SADECE grubun ilk notasında emit edilir
      const tupletInfo = tupletNotaIdMap.get(oge.id);
      if (tupletInfo && tupletInfo.ilkMi && tupletInfo.tuplet.kayit?.hucreler) {
        for (const h of tupletInfo.tuplet.kayit.hucreler) {
          hucreler.push([...h]);
          esleme.push(kaynakIndeksi);
          metaEkle({ ogeId: oge.id, kaynak: 'tuplet', etiket: tupletInfo.tuplet.kayit.ad });
        }
      }
      // Aksidental (note.accidental field)
      const accHucreleri = muzikAccidentalHucreleri(oge.accidental);
      for (const h of accHucreleri) {
        hucreler.push([...h]);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: oge.id, kaynak: 'accidental', etiket: `aksidental: ${oge.accidental}` });
      }

      // Otomatik oktav işareti (interval bazlı)
      const ilkNotaMi = !sonNota;
      const ctx = {
        ilkNota: ilkNotaMi,
        timeKeyDegisimiSonrasi: timeKeyDegisimiBayragi,
        sectionalDoubleBarlineSonrasi: sectionalBarlineBayragi,
      };
      if (muzikOktavGerekliMi(sonNota, oge, ctx)) {
        const oktHucre = muzikOktavHucresi(oge.oktav);
        hucreler.push([...oktHucre]);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: oge.id, kaynak: 'octave', etiket: `${oge.oktav}. oktav işareti` });
      }
      timeKeyDegisimiBayragi = false;
      sectionalBarlineBayragi = false;
      sonNota = oge;
    }

    // Modül 8 Gruplama: grup içindeki ilk-olmayan notalar pitch-only (sekizlik) yazılır
    const grupPitchOnly = grupBilgisi && grupBilgisi.konum > 0;
    const ogeHucreleri = grupPitchOnly
      ? [muzikNotaSadePitchHucresi(oge.notaAd)]
      : (Array.isArray(oge.hucreler) && oge.hucreler.length ? oge.hucreler : [[]]);
    for (const hucre of ogeHucreleri) {
      hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
      esleme.push(kaynakIndeksi);
      const kaynak = oge.tip === 'nota'
        ? (grupPitchOnly ? 'note-pitch' : 'note')
        : (oge.tip === 'sus' ? 'rest' : 'sign');
      metaEkle({ ogeId: oge.id, kaynak, etiket });
    }

    // Modül 8 Bölüm 2 — Noktalı nota VE noktalı sus: hücreden hemen sonra dot 3
    if ((oge.tip === 'nota' || oge.tip === 'sus') && oge.dotted) {
      hucreler.push([3]);
      esleme.push(kaynakIndeksi);
      metaEkle({ ogeId: oge.id, kaynak: 'dot', etiket: 'noktalı uzatma (1,5×)' });
    }

    // Audit Aşama 14 — Bağlam bayrakları öncelikle EXPLICIT tip alanına bakar.
    // Sonraki ilk nota oktav alır (Modül 8 Bölüm 3 + Bölüm 9):
    if (oge.tip !== 'nota' && oge.tip !== 'sus') {
      const t = oge.tip;
      const adLower = String(oge.ad || '').toLowerCase();
      if (t === 'sectionalBarline' || /sectional|bölüm sonu/.test(adLower)) {
        sectionalBarlineBayragi = true;
      }
      if (t === 'beginRepeat' || t === 'endRepeat' || t === 'volta1' || t === 'volta2'
          || t === 'brailleRepeat' || t === 'finalBarline'
          || t === 'wordExpression'
          || /(zaman imzas|time sig|donanım|key sig|key signature)/.test(adLower)) {
        timeKeyDegisimiBayragi = true;
      }
    }

    kaynakIndeksi += etiket.length;

    if (oge.tip === 'nota') {
      const sonrasiSirali = (Array.isArray(oge.modifiers?.sonrasi) ? oge.modifiers.sonrasi : [])
        .slice()
        .sort((a, b) => muzikModifierSonrasiSira(a.kayit) - muzikModifierSonrasiSira(b.kayit));
      modHucrelerEkle(sonrasiSirali, oge.id, 'sonrasi');
    }

    // Audit madde 12 — find yerine filter: aynı notadan birden fazla bağ/slur çıkabilir
    const baglayanlar = baglar.filter((b) => b.basId === oge.id);
    for (const baglayan of baglayanlar) {
      if (!baglayan.kayit || !Array.isArray(baglayan.kayit.hucreler)) continue;
      const bagEtiketi = baglayan.kayit.gorunum || baglayan.kayit.ad || '⌒';
      kaynakIndeksi += 1;
      kaynakParcalar.push(bagEtiketi);
      for (const hucre of baglayan.kayit.hucreler) {
        hucreler.push(Array.isArray(hucre) ? [...hucre] : []);
        esleme.push(kaynakIndeksi);
        metaEkle({ ogeId: oge.id, kaynak: 'bag', etiket: baglayan.kayit.ad });
      }
      kaynakIndeksi += bagEtiketi.length;
    }
  }

  // Audit Aşama 6 — Repeat aday önerileri (sadece bilgilendirme; otomatik uygulanmaz)
  const repeatOnerileri = muzikRepeatAdaylariniBul(olculer, baglar, autoRepeatHaritasi);
  // Audit Aşama 3 — Ölçü süre uyarıları
  const olcuUyarilari = olculer.flatMap((m) => (m.warnings || []));
  return { hucreler, esleme, kaynak: kaynakParcalar.join(' '), hucreMeta, repeatOnerileri, olcuUyarilari };
}

// Hücre indexinden gerçek anlamı bul (öncelik: hucreMeta varsa onu kullan, yoksa eski cursor mantığı)
function muzikHucreAnlamiKayittan(ogeler, hucreIndeksi, hucreMeta = null) {
  if (Array.isArray(hucreMeta) && hucreMeta[hucreIndeksi]) {
    const meta = hucreMeta[hucreIndeksi];
    const oge = ogeler.find((o) => o.id === meta.ogeId);
    const ogeAd = oge ? (oge.gorunum || oge.ad || '') : '';
    const baslikMap = {
      'modifier-oncesi': `Modifier (önce): ${meta.etiket}`,
      'modifier-sonrasi': `Modifier (sonra): ${meta.etiket}`,
      'accidental': meta.etiket,
      'octave': meta.etiket,
      'note': ogeAd,
      'note-pitch': `Gruplanmış nota (pitch-only): ${ogeAd}`,
      'dot': meta.etiket,
      'bag': `Bağ/slur: ${meta.etiket}`,
      'rest': `Sus: ${ogeAd}`,
      'sign': ogeAd,
    };
    return {
      tip: meta.kaynak === 'note' || meta.kaynak === 'note-pitch' ? 'muzik' : 'isaret',
      baslik: baslikMap[meta.kaynak] || `Müzik: ${ogeAd}`,
      detay: oge?.aciklama || '',
      noktaStr: '',
      etiket: ogeAd,
      kaynak: meta.kaynak,
    };
  }
  // Eski yöntem (geriye dönük): cursor ilerleterek bul
  let cursor = 0;
  for (const oge of ogeler) {
    const ogeHucreleri = Array.isArray(oge.hucreler) && oge.hucreler.length ? oge.hucreler : [[]];
    if (hucreIndeksi >= cursor && hucreIndeksi < cursor + ogeHucreleri.length) {
      const hucre = ogeHucreleri[hucreIndeksi - cursor] || [];
      return {
        tip: oge.tip === 'nota' ? 'muzik' : 'isaret',
        baslik: oge.tip === 'nota' ? `Müzik: ${oge.ad}` : `Müzik: ${oge.ad}`,
        detay: oge.aciklama || (oge.kurallar || []).join(' '),
        noktaStr: hucre.length ? hucre.join(' · ') : 'boş hücre',
        etiket: oge.gorunum || oge.ad || '♪',
      };
    }
    cursor += ogeHucreleri.length;
  }
  return null;
}

function muzikMetniniBrailleyeCevir(metin) {
  const hucreler = [];
  const esleme = [];
  let i = 0;

  while (i < metin.length) {
    const ch = metin[i];
    if (/\s/u.test(ch)) {
      i += 1;
      continue;
    }

    const kayit = MUZIK_TOKEN_KAYITLARI.find((aday) => metin.startsWith(aday.token, i));
    if (kayit) {
      for (const hucre of kayit.hucreler) {
        hucreler.push(hucre);
        esleme.push(i);
      }
      i += kayit.token.length;
      continue;
    }

    // Tanınmayan karakteri güvenli biçimde atla; kullanıcı serbest düzenleme yaptıysa
    // geçerli müzik tokenları yine BRF'e aktarılabilsin.
    i += 1;
  }

  return { hucreler, esleme, kaynak: metin };
}

function muzikHucreAnlami(noktalar) {
  const kayit = MUZIK_HUCRE_ANLAM_TABLOSU.get(noktalariAnahtara(noktalar));
  if (!kayit) {
    return {
      tip: 'isaret',
      baslik: 'Müzik braille hücresi',
      detay: `Müzik yazım modunda kullanılan hücre. Nokta gösterimi: ${noktalar.join(' · ') || 'boş'}.`,
      noktaStr: noktalar.join(' · ') || '—',
      etiket: '♪',
    };
  }
  return {
    tip: 'muzik',
    baslik: `Müzik: ${kayit.ad}`,
    detay: `${kayit.notaAd} notasının ${kayit.sureAd} değeri. Modül 8 kuralı: süre, temel nota hücresine ${kayit.noktalar.join(' · ')} noktalarıyla yazılır.`,
    noktaStr: kayit.noktalar.join(' · '),
    etiket: kayit.token,
  };
}

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
  // Dönüştürme dili: 'tr' (varsayılan, Türkçe pipeline — dokunulmadı) | 'en' | 'de' | 'fr'
  const [dil, setDil] = useState(() => {
    try {
      const v = localStorage.getItem('araclarDil');
      return v === 'en' || v === 'de' || v === 'fr' ? v : 'tr';
    } catch {
      return 'tr';
    }
  });
  const dilDegistir = useCallback((yeni) => {
    setDil(yeni);
    try { localStorage.setItem('araclarDil', yeni); } catch { /* yoksay */ }
  }, []);
  const matematikPaletRef = useRef(null);
  const [muzikModuAktif, setMuzikModuAktif] = useState(false);
  const [muzikPaletiAcik, setMuzikPaletiAcik] = useState(false);
  const [muzikSureIndeksi, setMuzikSureIndeksi] = useState(1);
  const [muzikNotaAd, setMuzikNotaAd] = useState('do');
  const [muzikPaletSekmesi, setMuzikPaletSekmesi] = useState(null);
  const [muzikOgeleri, setMuzikOgeleri] = useState([]);
  const [seciliMuzikOgeId, setSeciliMuzikOgeId] = useState(null);
  const [muzikDuzenPopupAcik, setMuzikDuzenPopupAcik] = useState(false);
  const [muzikIfadeGirisi, setMuzikIfadeGirisi] = useState('');
  const [muzikBaglar, setMuzikBaglar] = useState([]);
  // Audit Aşama 7 — Tuplet span: 3+ notayı kapsayan grup, süre hesabını etkiler
  const [muzikTupletler, setMuzikTupletler] = useState([]);
  const [bekleyenTuplet, setBekleyenTuplet] = useState(null);
  const [bekleyenBag, setBekleyenBag] = useState(null);
  const [bekleyenModifier, setBekleyenModifier] = useState(null);
  const [notalarAdimSureMi, setNotalarAdimSureMi] = useState(true);
  // Audit Aşama 2 — Header state: title/composer/tempo/keySignature/timeSignature
  // Donanım ve zaman imzası artık muzikOgeleri içine değil, bu state'e yazılır.
  const [muzikHeader, setMuzikHeader] = useState({
    title: '',
    composer: '',
    tempo: '',
    keySignature: null,  // { type: 'sharp'|'flat'|'natural', count: 0..7, hucreler: [[...], ...] }
    timeSignature: null, // { ad: '4/4'|'common'|..., hucreler: [[...], ...], expectedDuration16: 16 }
  });
  const bekleyenBagBilgisi = bekleyenBag
    ? (bekleyenBag.tipModu === 'slur'
        ? `${bekleyenBag.kayit.ad}: ${bekleyenBag.notaIdler?.length || 0} nota seçildi — daha ekle veya Tamamla'ya tıkla (Esc iptal)`
        : (bekleyenBag.basId
            ? `${bekleyenBag.kayit.ad}: 2. notayı seçin (Esc ile iptal)`
            : `${bekleyenBag.kayit.ad}: 1. notayı seçin (Esc ile iptal)`))
    : null;
  const bekleyenModifierBilgisi = bekleyenModifier
    ? `${bekleyenModifier.kayit.ad}: uygulanacak notayı seçin (Esc ile iptal)`
    : null;
  const bekleyenTupletBilgisi = bekleyenTuplet
    ? `${bekleyenTuplet.kayit.ad}: ${bekleyenTuplet.notaIdler?.length || 0} nota seçildi — daha ekle veya Tamamla (Esc iptal)`
    : null;
  const muzikIdRef = useRef(1);
  const muzikPaletRef = useRef(null);
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

  useEffect(() => {
    if (!muzikDuzenPopupAcik) return;
    const kapat = (e) => { if (e.key === 'Escape') setMuzikDuzenPopupAcik(false); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [muzikDuzenPopupAcik]);

  useEffect(() => {
    if (!bekleyenBag) return;
    const kapat = (e) => { if (e.key === 'Escape') setBekleyenBag(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [bekleyenBag]);

  useEffect(() => {
    if (!bekleyenModifier) return;
    const kapat = (e) => { if (e.key === 'Escape') setBekleyenModifier(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [bekleyenModifier]);

  useEffect(() => {
    if (!bekleyenTuplet) return;
    const kapat = (e) => { if (e.key === 'Escape') setBekleyenTuplet(null); };
    window.addEventListener('keydown', kapat);
    return () => window.removeEventListener('keydown', kapat);
  }, [bekleyenTuplet]);

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

  // Müzik paleti dışına tıklayınca veya Escape ile kapat
  useEffect(() => {
    if (!muzikPaletiAcik) return;
    const handleClick = (e) => {
      if (muzikPaletRef.current && !muzikPaletRef.current.contains(e.target)) {
        setMuzikPaletiAcik(false);
      }
    };
    const handleKey = (e) => { if (e.key === 'Escape') setMuzikPaletiAcik(false); };
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [muzikPaletiAcik]);

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
  const muzikSkorKaynakMetni = useMemo(() => muzikSkorMetni(muzikOgeleri), [muzikOgeleri]);
  const etkinKaynakMetni = muzikModuAktif ? muzikSkorKaynakMetni : girisMetni;
  const etkinGirdiVar = muzikModuAktif ? muzikOgeleri.length > 0 : !!girisMetni.trim();
  const seciliMuzikOge = useMemo(
    () => muzikOgeleri.find((oge) => oge.id === seciliMuzikOgeId) || null,
    [muzikOgeleri, seciliMuzikOgeId],
  );
  const seciliMuzikOgeIndeksi = useMemo(
    () => muzikOgeleri.findIndex((oge) => oge.id === seciliMuzikOgeId),
    [muzikOgeleri, seciliMuzikOgeId],
  );
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

  const insertMuzikToken = (token) => {
    const ta = textareaRef.current;
    const v = girisMetni;
    const s = ta ? ta.selectionStart : v.length;
    const onceki = v.slice(0, s);
    const sonraki = v.slice(ta ? ta.selectionEnd : s);
    const ek = `${onceki && !/\s$/u.test(onceki) ? ' ' : ''}${token} `;
    const yeni = onceki + ek + sonraki;
    setGirisMetni(yeni);
    requestAnimationFrame(() => {
      if (!ta) return;
      ta.focus();
      const pos = onceki.length + ek.length;
      ta.selectionStart = ta.selectionEnd = pos;
    });
  };

  const muzikModunuDegistir = () => {
    setMuzikModuAktif((onceki) => {
      const yeni = !onceki;
      setMuzikPaletiAcik(yeni);
      if (yeni) setMatematikPaletiAcik(false);
      return yeni;
    });
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const muzikYeniId = () => `muzik-${muzikIdRef.current++}`;

  const muzikNotaEkle = (notaAd = muzikNotaAd, sureIndeksi = muzikSureIndeksi) => {
    const oge = muzikNotaSkorOgesi(muzikYeniId(), notaAd, sureIndeksi);
    setMuzikOgeleri((onceki) => muzikOtomatikOlcuCizgisiEkle([...onceki, oge], muzikHeader));
    setSeciliMuzikOgeId(oge.id);
  };

  const muzikAnahtarBasaEkle = (anahtar) => {
    const oge = muzikKayittanSkorOgesi(muzikYeniId(), anahtar, { tip: 'anahtar', kategori: 'Anahtarlar' });
    setMuzikOgeleri((onceki) => {
      if (onceki[0]?.tip === 'anahtar') return [oge, ...onceki.slice(1)];
      return [oge, ...onceki];
    });
    setSeciliMuzikOgeId(oge.id);
  };

  const muzikIsaretEkle = (kayit) => {
    // Sus ise muzikSusSkorOgesi ile (sureIndeksi + dotted modeli)
    const restReal = muzikRestSureFromName(kayit.ad);
    if (restReal !== null) {
      const sureIdx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => s.realValue === restReal);
      const oge = muzikSusSkorOgesi(muzikYeniId(), sureIdx >= 0 ? sureIdx : 0, {
        dotted: /noktalı/.test(String(kayit.ad || '').toLowerCase()),
      });
      setMuzikOgeleri((onceki) => muzikOtomatikOlcuCizgisiEkle([...onceki, oge], muzikHeader));
      setSeciliMuzikOgeId(oge.id);
      return;
    }
    // Audit Aşama 14 — Print repeat / volta için EXPLICIT tip alanı (regex bağımsız)
    const adLower = String(kayit.ad || '').toLowerCase();
    let tipOverride = null;
    if (/tekrar başlangıcı|begin.*repeat|röpriz.*başla/.test(adLower)) tipOverride = 'beginRepeat';
    else if (/tekrar sonu|end.*repeat|röpriz.*bitir/.test(adLower)) tipOverride = 'endRepeat';
    else if (/1\.\s*ev|1\.\s*dolap|volta\s*1/.test(adLower)) tipOverride = 'volta1';
    else if (/2\.\s*ev|2\.\s*dolap|volta\s*2/.test(adLower)) tipOverride = 'volta2';
    else if (/bitiş çizgisi|final.*bar/.test(adLower)) tipOverride = 'finalBarline';
    else if (/bölüm sonu|sectional/.test(adLower)) tipOverride = 'sectionalBarline';
    else if (/braille.*tekrar|braille.*repeat/.test(adLower) && /^braille/.test(adLower)) tipOverride = 'brailleRepeat';
    const oge = muzikKayittanSkorOgesi(muzikYeniId(), kayit, {
      tip: tipOverride || kayit.tip || 'isaret',
      kategori: kayit.kategori,
    });
    setMuzikOgeleri((onceki) => [...onceki, oge]);
    setSeciliMuzikOgeId(oge.id);
  };

  const muzikSeciliSusuGuncelle = (patch) => {
    setMuzikOgeleri((onceki) => onceki.map((oge) => {
      if (oge.id !== seciliMuzikOgeId || oge.tip !== 'sus') return oge;
      const sureIndeksi = patch.sureIndeksi ?? oge.sureIndeksi;
      const dotted = patch.dotted !== undefined ? patch.dotted : oge.dotted;
      return muzikSusSkorOgesi(oge.id, sureIndeksi, { dotted });
    }));
  };

  // Audit Aşama 8 — Skor içi serbest ifade (örn "Moderato", "poco rit.")
  // Word sign (3-4-5) + kontraksiyonsuz harfler. Sonraki ilk notada oktav zorunlu.
  const muzikIfadeEkle = (metin) => {
    const t = String(metin || '').trim();
    if (!t) return;
    const hucreler = [
      [3, 4, 5], // word sign
      ...muzikKontraksiyonsuzMetinHucreleri(t),
    ];
    const oge = {
      id: muzikYeniId(),
      tip: 'wordExpression',
      ad: `İfade: ${t}`,
      metin: t,
      gorunum: `>${t}`,
      hucreler,
      aciklama: `Word-sign (>) + kontraksiyonsuz braille. Sonraki nota oktav işareti almalıdır.`,
    };
    setMuzikOgeleri((onceki) => [...onceki, oge]);
    setSeciliMuzikOgeId(oge.id);
  };

  // Audit Aşama 7 — Tuplet span: 3+ notayı kapsayan düzensiz grup.
  // Modül 8 Bölüm 8: üçleme (3:2), ikileme (2:3), dörtleme (4:6), beşleme (5:?) vb.
  const muzikTupletOranTahmin = (ad) => {
    const lower = String(ad || '').toLowerCase();
    if (/üçleme|triplet/.test(lower)) return { played: 3, inTimeOf: 2 };
    if (/ikileme|duplet/.test(lower)) return { played: 2, inTimeOf: 3 };
    if (/dörtleme|quadruplet/.test(lower)) return { played: 4, inTimeOf: 6 };
    if (/beşleme|quintuplet/.test(lower)) return { played: 5, inTimeOf: 4 };
    if (/altılama|sextuplet/.test(lower)) return { played: 6, inTimeOf: 4 };
    if (/yedileme|septuplet/.test(lower)) return { played: 7, inTimeOf: 4 };
    return { played: 3, inTimeOf: 2 }; // varsayılan üçleme
  };

  const muzikTupletBaslat = (kayit) => {
    const ratio = muzikTupletOranTahmin(kayit.ad);
    setBekleyenTuplet({ kayit, ratio, notaIdler: [] });
    setMuzikPaletSekmesi(null);
    setMuzikDuzenPopupAcik(false);
  };

  const muzikTupletEkle = (notaId) => {
    if (!bekleyenTuplet) return false;
    const ids = bekleyenTuplet.notaIdler || [];
    if (ids.length > 0 && ids[ids.length - 1] === notaId) {
      // Aynı notaya yeniden tıklama → tamamla
      return muzikTupletTamamla();
    }
    setBekleyenTuplet({ ...bekleyenTuplet, notaIdler: [...ids, notaId] });
    return true;
  };

  const muzikTupletTamamla = () => {
    if (!bekleyenTuplet || (bekleyenTuplet.notaIdler?.length || 0) < 2) {
      setBekleyenTuplet(null);
      return true;
    }
    setMuzikTupletler((onceki) => [...onceki, {
      id: `tuplet-${muzikIdRef.current++}`,
      ratio: bekleyenTuplet.ratio,
      kayit: bekleyenTuplet.kayit,
      notaIdler: [...bekleyenTuplet.notaIdler],
    }]);
    setBekleyenTuplet(null);
    return true;
  };

  const muzikTupletSil = (tupletId) => {
    setMuzikTupletler((onceki) => onceki.filter((t) => t.id !== tupletId));
  };

  const muzikBagBaslat = (kayit) => {
    const adLower = String(kayit.ad || '').toLowerCase();
    // Modül 8 Bölüm 5 — Slur: 2-4 nota zinciri; Tie: 2 nota aynı perde
    const isTie = /^(tie|bağ)\b/.test(adLower);
    const tipModu = isTie ? 'tie' : 'slur';
    setBekleyenBag({ kayit, basId: null, notaIdler: [], tipModu });
    setMuzikPaletSekmesi(null);
    setMuzikDuzenPopupAcik(false);
  };

  // Audit Aşama 7 — Slur zincirini sonlandır (3-4+ nota için her notadan
  // sonra slur işareti üretmek üzere N-1 ardışık bağ yarat).
  const muzikSlurZinciriTamamla = () => {
    if (!bekleyenBag || bekleyenBag.tipModu !== 'slur') return false;
    const ids = bekleyenBag.notaIdler || [];
    if (ids.length < 2) {
      setBekleyenBag(null);
      return true;
    }
    const yeniBaglar = [];
    for (let i = 0; i < ids.length - 1; i++) {
      yeniBaglar.push({
        id: `bag-${muzikIdRef.current++}`,
        basId: ids[i],
        sonId: ids[i + 1],
        kayit: bekleyenBag.kayit,
        zincirIndeksi: i,
        zincirBoyu: ids.length - 1,
      });
    }
    setMuzikBaglar((onceki) => [...onceki, ...yeniBaglar]);
    setBekleyenBag(null);
    return true;
  };

  const muzikBagTamamla = (notaId) => {
    if (!bekleyenBag) return false;
    // Audit Aşama 7 — Slur zincir modu: notaları biriktir; Tamamla butonu ile bitir.
    if (bekleyenBag.tipModu === 'slur') {
      const ids = bekleyenBag.notaIdler || [];
      // Aynı notaya yeniden tıklayınca: en azından 2 nota varsa zinciri tamamla, yoksa iptal
      if (ids.length > 0 && ids[ids.length - 1] === notaId) {
        return muzikSlurZinciriTamamla();
      }
      setBekleyenBag({ ...bekleyenBag, notaIdler: [...ids, notaId] });
      return true;
    }
    // Tie (2 nota) eski akış
    if (!bekleyenBag.basId) {
      setBekleyenBag({ ...bekleyenBag, basId: notaId });
      return true;
    }
    if (bekleyenBag.basId === notaId) {
      setBekleyenBag(null);
      return true;
    }
    // Modül 8 Bölüm 5 — Tie aynı perde validasyonu
    const isTie = /^(tie|bağ)\b/i.test(String(bekleyenBag.kayit?.ad || ''));
    if (isTie) {
      const basOge = muzikOgeleri.find((o) => o.id === bekleyenBag.basId);
      const sonOge = muzikOgeleri.find((o) => o.id === notaId);
      if (basOge && sonOge && basOge.tip === 'nota' && sonOge.tip === 'nota') {
        if (basOge.notaAd !== sonOge.notaAd || (basOge.oktav ?? 4) !== (sonOge.oktav ?? 4)) {
          window.alert('Tie yalnızca aynı perde ve aynı oktavdaki notalar arasında kullanılabilir. Farklı perdeler için "slur" kullanın.');
          setBekleyenBag(null);
          return true;
        }
      }
    }
    const yeniBag = {
      id: `bag-${muzikIdRef.current++}`,
      basId: bekleyenBag.basId,
      sonId: notaId,
      kayit: bekleyenBag.kayit,
    };
    setMuzikBaglar((onceki) => [...onceki, yeniBag]);
    setBekleyenBag(null);
    return true;
  };

  const muzikBagSil = (bagId) => {
    setMuzikBaglar((onceki) => onceki.filter((b) => b.id !== bagId));
  };

  const muzikModifierBaslat = (kayit, yon) => {
    setBekleyenModifier({ kayit, yon });
    setMuzikPaletSekmesi(null);
    setMuzikDuzenPopupAcik(false);
  };

  const muzikModifierUygula = (notaOgesi) => {
    if (!bekleyenModifier) return false;
    const { kayit, yon } = bekleyenModifier;
    const adLower = String(kayit.ad || '').toLowerCase();

    // Audit M — Oktav modifier'ı doğrudan note.oktav alanına yazılmalı
    // (yoksa hem auto-oktav hem manuel modifier emit edilir → çift oktav işareti)
    const oktavMatch = /(\d+)\s*\.\s*oktav/i.exec(adLower);
    if (oktavMatch) {
      const oktavSayi = Math.min(7, Math.max(1, parseInt(oktavMatch[1], 10)));
      setMuzikOgeleri((onceki) => onceki.map((oge) =>
        oge.id === notaOgesi.id ? { ...oge, oktav: oktavSayi } : oge
      ));
      setBekleyenModifier(null);
      return true;
    }

    // Aksidental modifier → note.accidental alanına (Audit M aynı sorun)
    let accId = null;
    if (/^çift\s*diyez|double.*sharp/.test(adLower)) accId = 'doubleSharp';
    else if (/^çift\s*bemol|double.*flat/.test(adLower)) accId = 'doubleFlat';
    else if (/^diyez|^sharp/.test(adLower)) accId = 'sharp';
    else if (/^bemol|^flat/.test(adLower)) accId = 'flat';
    else if (/^naturel|^natural|^bekar/.test(adLower)) accId = 'natural';
    if (accId) {
      setMuzikOgeleri((onceki) => onceki.map((oge) =>
        oge.id === notaOgesi.id ? { ...oge, accidental: accId } : oge
      ));
      setBekleyenModifier(null);
      return true;
    }

    // Varsayılan: modifier listesine ekle
    setMuzikOgeleri((onceki) => onceki.map((oge) => {
      if (oge.id !== notaOgesi.id) return oge;
      const mevcut = Array.isArray(oge.modifiers?.[yon]) ? oge.modifiers[yon] : [];
      return {
        ...oge,
        modifiers: {
          ...(oge.modifiers || {}),
          [yon]: [...mevcut, { id: `mod-${muzikIdRef.current++}`, kayit }],
        },
      };
    }));
    setBekleyenModifier(null);
    return true;
  };

  const muzikModifierSil = (notaId, yon, modId) => {
    setMuzikOgeleri((onceki) => onceki.map((oge) => {
      if (oge.id !== notaId) return oge;
      const liste = Array.isArray(oge.modifiers?.[yon]) ? oge.modifiers[yon] : [];
      return {
        ...oge,
        modifiers: {
          ...(oge.modifiers || {}),
          [yon]: liste.filter((m) => m.id !== modId),
        },
      };
    }));
  };

  const muzikNotaTiklandi = (oge) => {
    if (bekleyenBag && oge.tip === 'nota') {
      muzikBagTamamla(oge.id);
      return;
    }
    if (bekleyenModifier && oge.tip === 'nota') {
      muzikModifierUygula(oge);
      return;
    }
    if (bekleyenTuplet && oge.tip === 'nota') {
      muzikTupletEkle(oge.id);
      return;
    }
    setSeciliMuzikOgeId(oge.id);
    setMuzikDuzenPopupAcik(true);
  };

  const muzikSeciliNotayiGuncelle = (patch) => {
    setMuzikOgeleri((onceki) => onceki.map((oge) => {
      if (oge.id !== seciliMuzikOgeId || oge.tip !== 'nota') return oge;
      const notaAd = patch.notaAd ?? oge.notaAd;
      const sureIndeksi = patch.sureIndeksi ?? oge.sureIndeksi;
      // Yeni hücreyi süreye göre yeniden hesapla; ama meta alanları KORU
      return muzikNotaSkorOgesi(oge.id, notaAd, sureIndeksi, {
        oktav: patch.oktav ?? oge.oktav,
        accidental: patch.accidental !== undefined ? patch.accidental : oge.accidental,
        dotted: patch.dotted !== undefined ? patch.dotted : oge.dotted,
        modifiers: oge.modifiers,
      });
    }));
  };

  const muzikOgeSil = (id = seciliMuzikOgeId) => {
    if (!id) return;
    setMuzikOgeleri((onceki) => onceki.filter((oge) => oge.id !== id));
    setMuzikBaglar((onceki) => onceki.filter((b) => b.basId !== id && b.sonId !== id));
    // Tuplet'lerden de bu notayı çıkar; geriye 2'den az nota kaldıysa tuplet sil
    setMuzikTupletler((onceki) => onceki
      .map((t) => ({ ...t, notaIdler: t.notaIdler.filter((n) => n !== id) }))
      .filter((t) => t.notaIdler.length >= 2)
    );
    setSeciliMuzikOgeId(null);
    setMuzikDuzenPopupAcik(false);
  };

  const muzikOgeTasi = (yon) => {
    if (!seciliMuzikOgeId) return;
    setMuzikOgeleri((onceki) => {
      const i = onceki.findIndex((oge) => oge.id === seciliMuzikOgeId);
      if (i < 0) return onceki;
      const j = i + yon;
      if (j < 0 || j >= onceki.length) return onceki;
      const yeni = [...onceki];
      [yeni[i], yeni[j]] = [yeni[j], yeni[i]];
      return yeni;
    });
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

  const etkinCevirFn = muzikModuAktif
    ? (m) => muzikMetniniBrailleyeCevir(m)
    : cevirFn;

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
    // Türkçe dışı diller: ayrı Latin motoru (Türkçe pipeline'a hiç dokunulmaz).
    if (dil !== 'tr') {
      cevirIstekRef.current += 1;
      if (!girisMetni) {
        setCevirSonuc({ hucreler: [], esleme: [], kaynak: '' });
        return;
      }
      try {
        const r = metniLatinBrailleyeCevir(girisMetni, { dil, kisaltma: kisaltmaAktif });
        setCevirSonuc({ hucreler: r.hucreler, esleme: r.esleme, kaynak: girisMetni });
      } catch (err) {
        console.error('Latin braille çeviri hatası:', err);
      }
      return;
    }
    if (muzikModuAktif) {
      cevirIstekRef.current += 1;
      if (!muzikOgeleri.length) {
        setCevirSonuc({ hucreler: [], esleme: [], kaynak: '' });
        return;
      }
      setCevirSonuc(muzikSkorunuBrailleyeCevir(muzikOgeleri, muzikBaglar, muzikHeader, muzikTupletler));
      return;
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
  }, [girisMetni, muzikOgeleri, muzikBaglar, muzikHeader, muzikTupletler, muzikModuAktif, hucreYorumlariAktif, kisaltmaAktif, kisaltmaSistemler, kelimeBazliKisaltmaTercihleri, karakterYorumTercihleri, dil]);

  const hucrelerCache = cevirSonuc.hucreler;
  const eslemeCache = cevirSonuc.esleme;
  const kaynakCache = cevirSonuc.kaynak;

  /** BRF ön izleme: mevcut hücre önbelleğinden (Worker/anh çeviri tek); modal kapalıyken hesaplanmaz. */
  const brfOnizlemeDosyaMetni = useMemo(() => {
    if (!brfOnizlemeAcik) return '';
    if (!etkinGirdiVar) return '';
    if (!hucrelerCache.length) return '';
    try {
      return hucreleriBRFDizgesine(hucrelerCache, brfOnizlemeKagitBoyutu);
    } catch (err) {
      console.error('BRF ön izleme hatası:', err);
      return '';
    }
  }, [brfOnizlemeAcik, etkinGirdiVar, hucrelerCache, brfOnizlemeKagitBoyutu]);

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
  const brailleSayfaBoyutu = tabletModuAktif ? TABLET_BRAILLE_SAYFA_BOYUTU : BRAILLE_SAYFA_BOYUTU;
  const toplamSayfa = Math.max(1, Math.ceil(hucrelerCache.length / brailleSayfaBoyutu));
  const sayfaBaslangic = brailleSayfa * brailleSayfaBoyutu;
  const sayfaHucreler = hucrelerCache.slice(sayfaBaslangic, sayfaBaslangic + brailleSayfaBoyutu);
  const sayfaSonIndeks = sayfaBaslangic + sayfaHucreler.length;
  const hucreAnlamiOrtakOpts = useMemo(() => ({
    kaynak: kaynakCache,
    esleme: eslemeCache,
    yorumTercihleri: karakterYorumTercihleri,
    paraBirimiKaynakAraliklari,
  }), [kaynakCache, eslemeCache, karakterYorumTercihleri, paraBirimiKaynakAraliklari]);
  const sayfaBaslangicDurumlari = useMemo(
    () => sayfaBaslangicDurumlariniHesapla(hucrelerCache, brailleSayfaBoyutu, hucreAnlamiOrtakOpts),
    [hucrelerCache, brailleSayfaBoyutu, hucreAnlamiOrtakOpts],
  );
  const seciliHucreDetayi = useMemo(() => {
    if (!seciliHucre || typeof seciliHucre.index !== 'number') return null;
    if (seciliHucre.index < 0 || seciliHucre.index >= hucrelerCache.length) return null;
    const seciliSayfa = Math.floor(seciliHucre.index / brailleSayfaBoyutu);
    const seciliSayfaBaslangic = seciliSayfa * brailleSayfaBoyutu;
    return {
      index: seciliHucre.index,
      anlam: muzikModuAktif
        ? (muzikHucreAnlamiKayittan(muzikOgeleri, seciliHucre.index, cevirSonuc.hucreMeta) || muzikHucreAnlami(hucrelerCache[seciliHucre.index]))
        : hucreAnlami(hucrelerCache, seciliHucre.index, hucreYorumlariAktif, {
          ...hucreAnlamiOrtakOpts,
          baslangicHucre: seciliSayfaBaslangic,
          baslangicDurumu: sayfaBaslangicDurumlari[seciliSayfa],
        }),
    };
  }, [seciliHucre, hucrelerCache, muzikOgeleri, muzikModuAktif, hucreYorumlariAktif, brailleSayfaBoyutu, hucreAnlamiOrtakOpts, sayfaBaslangicDurumlari]);

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
  const sayfaHucreAnlamlari = useMemo(() => {
    if (!etkinGirdiVar || sayfaHucreler.length === 0) return [];
    if (muzikModuAktif) return sayfaHucreler.map((noktalar, i) => (
      muzikHucreAnlamiKayittan(muzikOgeleri, sayfaBaslangic + i, cevirSonuc.hucreMeta) || muzikHucreAnlami(noktalar)
    ));
    return sayfaAnlamlariniTopluHesapla(
      hucrelerCache,
      sayfaBaslangic,
      sayfaSonIndeks,
      hucreYorumlariAktif,
      {
        ...hucreAnlamiOrtakOpts,
        baslangicDurumu: sayfaBaslangicDurumlari[brailleSayfa],
      },
    );
  }, [
    brailleSayfa,
    etkinGirdiVar,
    muzikOgeleri,
    hucrelerCache,
    sayfaBaslangic,
    sayfaSonIndeks,
    hucreYorumlariAktif,
    hucreAnlamiOrtakOpts,
    sayfaBaslangicDurumlari,
    muzikModuAktif,
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

    if (muzikModuAktif) {
      const kayit = MUZIK_TOKEN_KAYITLARI.find((aday) => kaynak.startsWith(aday.token, baseCharIdx));
      const finalStart = baseCharIdx;
      const finalEnd = baseCharIdx + (kayit?.token.length || 1);
      ta.focus();
      ta.setSelectionRange(finalStart, finalEnd);
      setSeciliHucre({ index: globalIdx });
      setMetinSecimHucreAraligi(null);
      return;
    }

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
  }, [hucrelerCache, hucreYorumlariAktif, karakterYorumTercihleri, muzikModuAktif]);

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

    if (anlam.tip === 'muzik') return '#d97706';

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

    if (muzikModuAktif) {
      let lo = Infinity;
      let hi = -1;
      for (let i = 0; i < hucreSayisi; i++) {
        const bas = esleme[i];
        if (typeof bas !== 'number' || bas < 0) continue;
        const kayit = MUZIK_TOKEN_KAYITLARI.find((aday) => kaynak.startsWith(aday.token, bas));
        const bit = bas + (kayit?.token.length || 1);
        if (Math.max(sStart, bas) < Math.min(sEnd, bit)) {
          lo = Math.min(lo, i);
          hi = Math.max(hi, i);
        }
      }
      if (hi !== -1) {
        setMetinSecimHucreAraligi({ lo, hi });
        const hedefSayfa = Math.floor(lo / brailleSayfaBoyutu);
        if (hedefSayfa !== brailleSayfa) setBrailleSayfa(hedefSayfa);
      } else {
        setMetinSecimHucreAraligi(null);
      }
      return;
    }

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
  }, [brailleSayfa, brailleSayfaBoyutu, hucrelerCache, hucreYorumlariAktif, karakterYorumTercihleri, muzikModuAktif]);

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
    if (!etkinGirdiVar) return;
    let brf;
    try {
      if (muzikModuAktif) {
        brf = hucreleriBRFDizgesine(muzikSkorunuBrailleyeCevir(muzikOgeleri, muzikBaglar, muzikHeader, muzikTupletler).hucreler, brfOnizlemeKagitBoyutu);
      } else if (hucrelerCache.length > 0 && kaynakCache === girisMetni) {
        brf = hucreleriBRFDizgesine(hucrelerCache, brfOnizlemeKagitBoyutu);
      } else {
        brf = metniBRFe(girisMetni, etkinCevirFn, brfOnizlemeKagitBoyutu);
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
    if (muzikModuAktif) {
      setMuzikOgeleri([]);
      setMuzikBaglar([]);
      setMuzikTupletler([]);
      setBekleyenBag(null);
      setBekleyenModifier(null);
      setBekleyenTuplet(null);
      setMuzikHeader({ title: '', composer: '', tempo: '', keySignature: null, timeSignature: null, useBrailleGrouping: false });
      setSeciliMuzikOgeId(null);
      setMuzikDuzenPopupAcik(false);
    } else {
      setGirisMetni('');
    }
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
    sesToggle('metin', () => (muzikModuAktif
      ? (muzikOgeleri.map((oge) => oge.ad || oge.gorunum).join(', ') || '')
      : girisMetni));

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
      if (!etkinGirdiVar) return '';
      if (muzikModuAktif) {
        const { hucreler } = muzikSkorunuBrailleyeCevir(muzikOgeleri, muzikBaglar, muzikHeader, muzikTupletler);
        if (!hucreler.length) return 'Müzik yazım alanında geçerli nota yok.';
        return hucreler.map((noktalar, i) => {
          const anlam = muzikHucreAnlamiKayittan(muzikOgeleri, i, cevirSonuc.hucreMeta) || muzikHucreAnlami(noktalar);
          return `${anlam.baslik}: nokta ${noktalar.join(' ')}`;
        }).join(', ');
      }
      const kaynakMetin = girisMetni;
      const { hucreler, esleme } = etkinCevirFn(girisMetni, { buyukHarfIsareti: true, sayiIsareti: true });
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

  const muzikBrailleUnicode = useMemo(
    () => (muzikModuAktif ? hucrelerCache.map(noktalardanUnicode).join('') : ''),
    [muzikModuAktif, hucrelerCache],
  );

  const aktifMuzikPaletGrubu = useMemo(
    () => (muzikPaletSekmesi ? MUZIK_EDITOR_PALET_GRUPLARI.find((grup) => grup.slug === muzikPaletSekmesi) || null : null),
    [muzikPaletSekmesi],
  );
  useEffect(() => { setNotalarAdimSureMi(true); }, [muzikPaletSekmesi]);
  const muzikSatirlar = useMemo(() => {
    if (!muzikOgeleri.length) return [[]];
    const rows = [];
    for (let i = 0; i < muzikOgeleri.length; i += MUZIK_SATIR_KAPASITESI) {
      rows.push(muzikOgeleri.slice(i, i + MUZIK_SATIR_KAPASITESI));
    }
    return rows;
  }, [muzikOgeleri]);
  const muzikGruplamaHaritasi = useMemo(() => muzikGruplariTespit(muzikOgeleri), [muzikOgeleri]);
  const seciliMuzikSatir = seciliMuzikOgeIndeksi >= 0 ? Math.floor(seciliMuzikOgeIndeksi / MUZIK_SATIR_KAPASITESI) : 0;
  const seciliMuzikKolon = seciliMuzikOgeIndeksi >= 0 ? seciliMuzikOgeIndeksi % MUZIK_SATIR_KAPASITESI : 0;

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
        <PageHeader baslik={muzikModuAktif ? 'Müzik → BRF' : 'Metin → BRF'} />
        <div className="araclar-dil-secici" role="group" aria-label="Dönüştürme dili">
          {LATIN_DILLER.map((d) => (
            <button
              key={d.kod}
              type="button"
              className={`araclar-dil-btn${dil === d.kod ? ' aktif' : ''}`}
              aria-pressed={dil === d.kod}
              disabled={muzikModuAktif && d.kod !== 'tr'}
              onClick={() => dilDegistir(d.kod)}
              title={`${d.etiket} braille`}
            >
              {d.etiket}
            </button>
          ))}
        </div>
      </div>

      {/* ── Orta: içerik + klavye ── */}
      <div className="yazma-bolum yazma-bolum-orta">

        <>
            <div className="araclar-alan-sarici" ref={muzikPaletRef}>
              {muzikModuAktif ? (
                <div className="araclar-muzik-editor" aria-label="Müzik skor editörü">
                  <div className="araclar-muzik-header-paneli" role="region" aria-label="Müzik başlık bilgisi">
                    <input
                      type="text"
                      className="araclar-muzik-header-input"
                      placeholder="Başlık"
                      value={muzikHeader.title}
                      onChange={(e) => setMuzikHeader((h) => ({ ...h, title: e.target.value }))}
                      aria-label="Eser başlığı"
                    />
                    <input
                      type="text"
                      className="araclar-muzik-header-input"
                      placeholder="Besteci"
                      value={muzikHeader.composer}
                      onChange={(e) => setMuzikHeader((h) => ({ ...h, composer: e.target.value }))}
                      aria-label="Besteci"
                    />
                    <input
                      type="text"
                      className="araclar-muzik-header-input"
                      placeholder="Tempo (örn: Moderato)"
                      value={muzikHeader.tempo}
                      onChange={(e) => setMuzikHeader((h) => ({ ...h, tempo: e.target.value }))}
                      aria-label="Tempo"
                    />
                    <div className="araclar-muzik-header-rozet" aria-live="polite">
                      {muzikHeader.keySignature ? (
                        <span title={muzikHeader.keySignature.ad}>
                          Donanım: <strong>{muzikHeader.keySignature.gorunum || muzikHeader.keySignature.ad}</strong>
                          <button type="button" className="btn araclar-muzik-header-temizle" onClick={() => setMuzikHeader((h) => ({ ...h, keySignature: null }))} aria-label="Donanımı kaldır">×</button>
                        </span>
                      ) : <span className="araclar-muzik-header-bos">Donanım yok</span>}
                      {muzikHeader.timeSignature ? (
                        <span title={muzikHeader.timeSignature.ad}>
                          Ölçü: <strong>{muzikHeader.timeSignature.gorunum || muzikHeader.timeSignature.ad}</strong>
                          <button type="button" className="btn araclar-muzik-header-temizle" onClick={() => setMuzikHeader((h) => ({ ...h, timeSignature: null }))} aria-label="Zaman imzasını kaldır">×</button>
                        </span>
                      ) : <span className="araclar-muzik-header-bos">Zaman imzası yok</span>}
                    </div>
                  </div>
                  <div className="araclar-muzik-ifade-bar" role="group" aria-label="Müzik içi ifade ekle">
                    <input
                      type="text"
                      className="araclar-muzik-header-input"
                      placeholder="İfade ekle (örn: Moderato, poco rit., a tempo, cantabile)"
                      value={muzikIfadeGirisi}
                      onChange={(e) => setMuzikIfadeGirisi(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          muzikIfadeEkle(muzikIfadeGirisi);
                          setMuzikIfadeGirisi('');
                        }
                      }}
                      aria-label="İfade metni"
                    />
                    <button
                      type="button"
                      className="btn araclar-muzik-ifade-ekle-btn"
                      onClick={() => { muzikIfadeEkle(muzikIfadeGirisi); setMuzikIfadeGirisi(''); }}
                      disabled={!muzikIfadeGirisi.trim()}
                      title="Word-sign + kontraksiyonsuz braille olarak ekle"
                    >+ İfade</button>
                  </div>
                  {bekleyenBagBilgisi && (
                    <div className="araclar-muzik-bag-durum" role="status" aria-live="polite">
                      <span className="araclar-muzik-bag-durum-metin">{bekleyenBagBilgisi}</span>
                      {bekleyenBag?.tipModu === 'slur' && (bekleyenBag.notaIdler?.length || 0) >= 2 && (
                        <button
                          type="button"
                          className="btn araclar-muzik-bag-durum-iptal"
                          style={{ color: '#16a34a', borderColor: '#16a34a' }}
                          onClick={() => muzikSlurZinciriTamamla()}
                          title="Slur zincirini tamamla"
                          aria-label="Slur zincirini tamamla"
                        >✓ Tamamla</button>
                      )}
                      <button type="button" className="btn araclar-muzik-bag-durum-iptal" onClick={() => setBekleyenBag(null)} aria-label="Bağ seçimini iptal et">×</button>
                    </div>
                  )}
                  {bekleyenTupletBilgisi && (
                    <div className="araclar-muzik-bag-durum araclar-muzik-modifier-durum" role="status" aria-live="polite">
                      <span className="araclar-muzik-bag-durum-metin">{bekleyenTupletBilgisi}</span>
                      {(bekleyenTuplet?.notaIdler?.length || 0) >= 2 && (
                        <button
                          type="button"
                          className="btn araclar-muzik-bag-durum-iptal"
                          style={{ color: '#16a34a', borderColor: '#16a34a' }}
                          onClick={() => muzikTupletTamamla()}
                          title="Tuplet zincirini tamamla"
                          aria-label="Tuplet tamamla"
                        >✓ Tamamla</button>
                      )}
                      <button type="button" className="btn araclar-muzik-bag-durum-iptal" onClick={() => setBekleyenTuplet(null)} aria-label="Tuplet seçimini iptal et">×</button>
                    </div>
                  )}
                  {bekleyenModifierBilgisi && (
                    <div className="araclar-muzik-bag-durum araclar-muzik-modifier-durum" role="status" aria-live="polite">
                      <span className="araclar-muzik-bag-durum-metin">{bekleyenModifierBilgisi}</span>
                      <button type="button" className="btn araclar-muzik-bag-durum-iptal" onClick={() => setBekleyenModifier(null)} aria-label="Modifier seçimini iptal et">×</button>
                    </div>
                  )}
                  <div className="araclar-muzik-ck-toolbar" role="toolbar" aria-label="Müzik araç çubuğu">
                    {MUZIK_EDITOR_PALET_GRUPLARI
                      // Audit Ek Rapor: oktav otomatik (note.oktav field + popup), toolbar'dan çıkar
                      .filter((g) => g.slug !== 'oktav')
                      .map((grup) => {
                      const ikon = MUZIK_KATEGORI_IKON[grup.slug] || { sembol: '?', etiket: grup.baslik };
                      const tam = ikon.etiket || grup.baslik;
                      return (
                        <button
                          key={grup.slug}
                          type="button"
                          className={`btn ${'araclar-muzik-kategori-btn' + (muzikPaletSekmesi === grup.slug ? ' aktif' : '') + (ikon.italic ? ' italik' : '')}`}
                          onClick={() => setMuzikPaletSekmesi((o) => (o === grup.slug ? null : grup.slug))}
                          aria-pressed={muzikPaletSekmesi === grup.slug}
                          aria-expanded={muzikPaletSekmesi === grup.slug}
                          aria-label={tam}
                          title={tam}
                        >
                          <span className="araclar-muzik-kategori-ikon" aria-hidden="true">{ikon.sembol}</span>
                        </button>
                      );
                    })}
                  </div>

                  {aktifMuzikPaletGrubu && (
                    <div className="araclar-muzik-ck-palet" role="region" aria-label={`${aktifMuzikPaletGrubu.baslik} ikonları`}>
                      {aktifMuzikPaletGrubu.slug === 'notalar' ? (
                        notalarAdimSureMi ? (
                          <div className="araclar-muzik-palet-ikon-grid araclar-muzik-tek-satir" role="group" aria-label="Önce süre seçin">
                            {MUZIK_SURE_GOSTERGELERI.map((sure, idx) => (
                              <button
                                key={sure.ad}
                                type="button"
                                className={`btn ${'araclar-muzik-palet-ogesi araclar-muzik-palet-ikon araclar-muzik-sure-btn' + (muzikSureIndeksi === idx ? ' aktif' : '')}`}
                                onClick={() => { setMuzikSureIndeksi(idx); setNotalarAdimSureMi(false); }}
                                aria-pressed={muzikSureIndeksi === idx}
                                title={muzikSureKisaAdi(sure)}
                                aria-label={muzikSureKisaAdi(sure)}
                              >
                                <span className="araclar-muzik-palet-sembol">{sure.sembol}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="araclar-muzik-palet-ikon-grid araclar-muzik-tek-satir" role="group" aria-label="Eklenecek notayı seçin">
                            <button
                              type="button"
                              className="btn araclar-muzik-palet-ogesi araclar-muzik-palet-ikon araclar-muzik-geri-btn"
                              onClick={() => setNotalarAdimSureMi(true)}
                              title={`Süre: ${muzikSureKisaAdi(MUZIK_SURE_GOSTERGELERI[muzikSureIndeksi])} — değiştirmek için tıkla`}
                              aria-label="Süre seçimine dön"
                            >
                              <span className="araclar-muzik-palet-sembol">←{MUZIK_SURE_GOSTERGELERI[muzikSureIndeksi]?.sembol}</span>
                            </button>
                            {MUZIK_TEMEL_NOTALAR.map((nota) => (
                              <button
                                key={nota.ad}
                                type="button"
                                className="btn araclar-muzik-palet-ogesi araclar-muzik-palet-ikon araclar-muzik-palet-nota"
                                onClick={() => muzikNotaEkle(nota.ad, muzikSureIndeksi)}
                                title={`${nota.ad} (${muzikSureKisaAdi(MUZIK_SURE_GOSTERGELERI[muzikSureIndeksi])})`}
                                aria-label={`${nota.ad} ekle`}
                              >
                                <span className="araclar-muzik-palet-sembol" aria-hidden="true">{MUZIK_NOTA_IKON[nota.ad] || nota.ad.charAt(0).toUpperCase()}</span>
                              </button>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="araclar-muzik-palet-ikon-grid">
                        {(aktifMuzikPaletGrubu?.ogeler || [])
                          // Audit Ek Rapor: 'olcu-cizgileri' içinden normal ölçü ayracını çıkar
                          // (zaman imzasına göre otomatik ekleniyor)
                          .filter((oge) => {
                            if (aktifMuzikPaletGrubu?.slug !== 'olcu-cizgileri') return true;
                            return !/ölçü ayracı|barline.*boş/i.test(String(oge.ad || ''));
                          })
                          .map((oge) => {
                          const ogeGorselTip = muzikOgeGorselTipi(oge);
                          const ogeGorselMetin = muzikGorselMetni(oge);
                          const zamanParcalari = ogeGorselTip === 'zaman' ? muzikZamanImzasiParcalari(ogeGorselMetin) : null;
                          const kategoriTipi = MUZIK_KATEGORI_TIPI[aktifMuzikPaletGrubu.slug] || 'standalone';
                          const notaVarMi = muzikOgeleri.some((o) => o.tip === 'nota');
                          const modifierTipiMi = kategoriTipi === 'before-note' || kategoriTipi === 'after-note';
                          const bagModuMu = kategoriTipi === 'two-notes';
                          const devreDisi = (modifierTipiMi || bagModuMu) && !notaVarMi;
                          const onClickHandler = () => {
                            if (oge.tip === 'anahtar' || kategoriTipi === 'prepend') return muzikAnahtarBasaEkle(oge);
                            if (bagModuMu) return muzikBagBaslat(oge);
                            // Audit Aşama 7 — Düzensiz gruplar artık tek-nota modifier değil; çoklu-nota span olarak başlar
                            if (aktifMuzikPaletGrubu.slug === 'duzensiz-gruplar') return muzikTupletBaslat(oge);
                            if (modifierTipiMi) return muzikModifierBaslat(oge, kategoriTipi === 'before-note' ? 'oncesi' : 'sonrasi');
                            // Audit Aşama 2 — Header: donanım ve zaman imzası muzikHeader'a yazılır
                            if (kategoriTipi === 'header') {
                              if (aktifMuzikPaletGrubu.slug === 'donanim') {
                                setMuzikHeader((h) => ({ ...h, keySignature: { ad: oge.ad, hucreler: oge.hucreler, gorunum: oge.gorunum } }));
                              } else if (aktifMuzikPaletGrubu.slug === 'zaman-imzasi') {
                                const exp = muzikTimeSigExpected16(oge.ad || oge.gorunum);
                                setMuzikHeader((h) => ({ ...h, timeSignature: { ad: oge.ad, hucreler: oge.hucreler, gorunum: oge.gorunum, expectedDuration16: exp } }));
                              }
                              return;
                            }
                            return muzikIsaretEkle(oge);
                          };
                          const ipucu = bagModuMu
                            ? `${oge.ad} — iki notayı seçerek uygula`
                            : modifierTipiMi
                              ? `${oge.ad} — uygulanacak notayı seçin`
                              : (oge.aciklama ? `${oge.ad} — ${oge.aciklama}` : oge.ad);
                          return (
                            <button
                              key={`${aktifMuzikPaletGrubu.slug}-${oge.ad}`}
                              type="button"
                              className={`btn araclar-muzik-palet-ogesi araclar-muzik-palet-ikon tip-${ogeGorselTip}`}
                              onClick={onClickHandler}
                              disabled={devreDisi}
                              title={devreDisi ? `${oge.ad} — önce bir nota ekleyin` : ipucu}
                              aria-label={oge.ad}
                              aria-disabled={devreDisi || undefined}
                            >
                              {zamanParcalari ? (
                                <span className="araclar-muzik-palet-zaman" aria-hidden="true">
                                  <span>{zamanParcalari.ust}</span>
                                  <span>{zamanParcalari.alt}</span>
                                </span>
                              ) : (
                                <span className="araclar-muzik-palet-sembol">{String(ogeGorselMetin).slice(0, 8)}</span>
                              )}
                            </button>
                          );
                        })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="araclar-muzik-skor-kapsayici" role="application" aria-label="Müzik çizim alanı">
                    {muzikSatirlar.map((satir, satirIdx) => (
                    <svg
                      key={satirIdx}
                      className="araclar-muzik-skor-svg"
                      viewBox={`0 0 760 170`}
                      aria-label={`Porte çizimi satır ${satirIdx + 1}`}
                    >
                      {[64, 76, 88, 100, 112].map((y) => (
                        <line key={y} x1="24" x2={735} y1={y} y2={y} className="muzik-staff-line" />
                      ))}
                      {satirIdx === 0 && muzikOgeleri.length === 0 && (
                        <text x="56" y="94" className="muzik-bos-yardim">Önce bir anahtar veya nota ekleyin…</text>
                      )}
                      {muzikBaglar.map((bag) => {
                        const basIdx = muzikOgeleri.findIndex((o) => o.id === bag.basId);
                        const sonIdx = muzikOgeleri.findIndex((o) => o.id === bag.sonId);
                        if (basIdx < 0 || sonIdx < 0) return null;
                        const basSatir = Math.floor(basIdx / MUZIK_SATIR_KAPASITESI);
                        const sonSatir = Math.floor(sonIdx / MUZIK_SATIR_KAPASITESI);
                        if (basSatir !== satirIdx && sonSatir !== satirIdx) return null;
                        const tieMi = /tie|bağ\b/i.test(bag.kayit.ad || '');
                        // Audit Ek Rapor: slur yönü nota konumuna göre otomatik.
                        // Notalar porte orta çizgisinin altındaysa slur üstte; üstündeyse altta.
                        const basOge = muzikOgeleri[basIdx];
                        const sonOge = muzikOgeleri[sonIdx];
                        const basY = basOge?.tip === 'nota' ? (MUZIK_PITCH_Y[basOge.notaAd] || 100) : 100;
                        const sonY = sonOge?.tip === 'nota' ? (MUZIK_PITCH_Y[sonOge.notaAd] || 100) : 100;
                        const ortalamaY = (basY + sonY) / 2;
                        const yonAlt = ortalamaY < 88; // notalar üstte → slur altta
                        // Tie default kuralı altta; slur ise nota konumuna göre
                        const altCizilsin = tieMi || yonAlt;
                        const yEgri = altCizilsin ? 116 : 52;
                        const yKontrol = altCizilsin ? 132 : 32;
                        const x1 = basSatir === satirIdx ? 68 + (basIdx % MUZIK_SATIR_KAPASITESI) * 74 : 24;
                        const x2 = sonSatir === satirIdx ? 68 + (sonIdx % MUZIK_SATIR_KAPASITESI) * 74 : 735;
                        const midX = (x1 + x2) / 2;
                        return (
                          <g key={bag.id} className="muzik-bag-grup" onClick={(e) => { e.stopPropagation(); muzikBagSil(bag.id); }} role="button" aria-label={`${bag.kayit.ad} — kaldırmak için tıkla`}>
                            <path d={`M ${x1} ${yEgri} Q ${midX} ${yKontrol} ${x2} ${yEgri}`} className={'muzik-slur' + (tieMi ? ' muzik-tie' : '')} />
                          </g>
                        );
                      })}
                      {satir.map((oge, i) => {
                        const x = 68 + i * 74;
                        const secili = oge.id === seciliMuzikOgeId || (bekleyenBag && bekleyenBag.basId === oge.id);
                        const noteY = MUZIK_PITCH_Y[oge.notaAd] || 100;
                        const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
                        const globalIdx = satirIdx * MUZIK_SATIR_KAPASITESI + i;
                        const grupBilgisi = oge.tip === 'nota' ? muzikGruplamaHaritasi.get(globalIdx) : null;
                        // 16/32/64 küçük süreler: bayrak >=2, dolu nota başı (hollow değil)
                        const kucukSure = oge.tip === 'nota' && (sure.realValue >= 16);
                        const hollow = oge.tip === 'nota' && !kucukSure && (/yarım|tam/i.test(sure.ad));
                        const stem = oge.tip === 'nota' && !/tam/i.test(sure.ad);
                        const bayrakSayisi = oge.tip === 'nota' ? (Number.isFinite(sure.bayrak) ? sure.bayrak : (/sekizlik/i.test(sure.ad) ? 1 : 0)) : 0;
                        // Gruplanmış notalarda bayrak yok, beam çizilir (son nota hariç)
                        const flagAdet = grupBilgisi ? 0 : bayrakSayisi;
                        const beamAdet = grupBilgisi && grupBilgisi.konum < grupBilgisi.boy - 1 ? bayrakSayisi : 0;
                        const flag = flagAdet > 0;
                        const gorselTip = oge.gorselTip || muzikOgeGorselTipi(oge);
                        const gorselMetin = oge.gorselMetin || muzikGorselMetni(oge);
                        return (
                          <g
                            key={oge.id}
                            className={'muzik-skor-ogesi' + (secili ? ' secili' : '')}
                            role="button"
                            tabIndex="0"
                            aria-label={oge.ad}
                            onClick={() => muzikNotaTiklandi(oge)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') muzikNotaTiklandi(oge); }}
                          >
                            {secili && <rect x={x - 25} y="24" width="58" height="122" rx="12" className="muzik-secim-cercevesi" />}
                            {oge.tip === 'anahtar' ? (
                              <>
                                <text x={x - 18} y="111" className="muzik-clef">{oge.gorunum}</text>
                                <text x={x - 18} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : oge.tip === 'nota' ? (
                              <>
                                {oge.notaAd === 'do' && <line x1={x - 15} x2={x + 17} y1="124" y2="124" className="muzik-ledger" />}
                                {oge.accidental && (
                                  <text x={x - 22} y={noteY + 5} textAnchor="middle" className="muzik-accidental">
                                    {({ sharp: '♯', flat: '♭', natural: '♮', doubleSharp: '𝄪', doubleFlat: '𝄫' })[oge.accidental] || ''}
                                  </text>
                                )}
                                <ellipse cx={x} cy={noteY} rx="9" ry="6.5" transform={`rotate(-18 ${x} ${noteY})`} className={hollow ? 'muzik-note-head hollow' : 'muzik-note-head'} />
                                {oge.dotted && (
                                  <circle cx={x + 16} cy={noteY} r="2.2" className="muzik-note-head" />
                                )}
                                {(() => {
                                  const stemAsagi = noteY <= 88;
                                  const stemX = stemAsagi ? x - 9 : x + 9;
                                  const tipY = stemAsagi ? noteY + 52 : noteY - 52;
                                  // Sonraki nota varsa onun bilgisini al (beam için)
                                  const sonrakiOge = grupBilgisi && grupBilgisi.konum < grupBilgisi.boy - 1 ? satir[i + 1] : null;
                                  const sonrakiNoteY = sonrakiOge && sonrakiOge.tip === 'nota' ? (MUZIK_PITCH_Y[sonrakiOge.notaAd] || 100) : null;
                                  const sonrakiX = x + 74;
                                  const sonrakiStemX = stemAsagi ? sonrakiX - 9 : sonrakiX + 9;
                                  const sonrakiTipY = sonrakiNoteY != null ? (stemAsagi ? sonrakiNoteY + 52 : sonrakiNoteY - 52) : tipY;
                                  const beamOfset = (k) => (stemAsagi ? -k * 4 : k * 4);
                                  return <>
                                    {stem && (stemAsagi
                                      ? <line x1={stemX} x2={stemX} y1={noteY + 3} y2={tipY} className="muzik-stem" />
                                      : <line x1={stemX} x2={stemX} y1={noteY - 3} y2={tipY} className="muzik-stem" />)}
                                    {/* Bayraklar (gruplanmamışsa) */}
                                    {[...Array(flagAdet)].map((_, fi) => {
                                      const yBase = stemAsagi ? (tipY - fi * 7) : (tipY + fi * 7);
                                      return stemAsagi
                                        ? <path key={`flag-${fi}`} d={`M ${stemX} ${yBase} c -16 -7 -16 -20 -2 -28`} className="muzik-flag" />
                                        : <path key={`flag-${fi}`} d={`M ${stemX} ${yBase} c 16 7 16 20 2 28`} className="muzik-flag" />;
                                    })}
                                    {/* Beam çizgileri (gruptaki son nota hariç) */}
                                    {[...Array(beamAdet)].map((_, bi) => (
                                      <line key={`beam-${bi}`}
                                        x1={stemX} x2={sonrakiStemX}
                                        y1={tipY + beamOfset(bi)} y2={sonrakiTipY + beamOfset(bi)}
                                        className="muzik-beam" />
                                    ))}
                                  </>;
                                })()}
                                {(() => {
                                  const oncesi = Array.isArray(oge.modifiers?.oncesi) ? oge.modifiers.oncesi : [];
                                  const sonrasi = Array.isArray(oge.modifiers?.sonrasi) ? oge.modifiers.sonrasi : [];
                                  let solOf = 0; let ustOf = 0; let altOf = 0;
                                  const cizimler = [];
                                  const hepsi = [
                                    ...oncesi.map((m) => ({ ...m, yon: 'oncesi' })),
                                    ...sonrasi.map((m) => ({ ...m, yon: 'sonrasi' })),
                                  ];
                                  hepsi.forEach((mod, idx) => {
                                    const modTip = muzikOgeGorselTipi(mod.kayit);
                                    const modMetin = muzikGorselMetni(mod.kayit);
                                    const key = mod.id || `mod-${idx}`;
                                    const onClick = (e) => { e.stopPropagation(); muzikModifierSil(oge.id, mod.yon, mod.id); };
                                    const baslik = `${mod.kayit.ad} — kaldırmak için tıkla`;
                                    if (modTip === 'degistirici' || modTip === 'donanim') {
                                      const px = x - 18 - solOf;
                                      solOf += 11;
                                      cizimler.push(
                                        <text key={key} x={px} y={noteY + 4} textAnchor="middle" className="muzik-accidental muzik-modifier" onClick={onClick}>
                                          <title>{baslik}</title>{modMetin}
                                        </text>
                                      );
                                    } else if (modTip === 'dinamik') {
                                      const py = 138 + altOf;
                                      altOf += 12;
                                      cizimler.push(
                                        <text key={key} x={x} y={py} textAnchor="middle" className="muzik-dynamic muzik-modifier" onClick={onClick}>
                                          <title>{baslik}</title>{modMetin}
                                        </text>
                                      );
                                    } else if (modTip === 'hairpin') {
                                      const isDec = String(modMetin).includes('>');
                                      cizimler.push(
                                        <path key={key} d={isDec
                                          ? `M ${x - 18} 132 L ${x + 22} 138 M ${x - 18} 144 L ${x + 22} 138`
                                          : `M ${x - 18} 138 L ${x + 22} 132 M ${x - 18} 138 L ${x + 22} 144`}
                                          className="muzik-hairpin muzik-modifier" onClick={onClick} >
                                          <title>{baslik}</title>
                                        </path>
                                      );
                                    } else if (modTip === 'oktav') {
                                      const py = 54 - ustOf;
                                      ustOf += 11;
                                      cizimler.push(
                                        <text key={key} x={x} y={py} textAnchor="middle" className="muzik-ottava muzik-modifier" onClick={onClick}>
                                          <title>{baslik}</title>{modMetin}
                                        </text>
                                      );
                                    } else if (modTip === 'tuplet') {
                                      const py = 48 - ustOf;
                                      ustOf += 14;
                                      cizimler.push(
                                        <g key={key} className="muzik-modifier" onClick={onClick}>
                                          <title>{baslik}</title>
                                          <path d={`M ${x - 14} ${py + 4} v -4 H ${x + 14} v 4`} className="muzik-tuplet-bracket" />
                                          <text x={x} y={py - 1} textAnchor="middle" className="muzik-tuplet-text">{modMetin}</text>
                                        </g>
                                      );
                                    } else if (modTip === 'bag') {
                                      cizimler.push(
                                        <path key={key} d={`M ${x - 14} 54 C ${x - 4} 42 ${x + 8} 42 ${x + 14} 54`} className="muzik-slur muzik-modifier" onClick={onClick} >
                                          <title>{baslik}</title>
                                        </path>
                                      );
                                    } else {
                                      const py = 52 - ustOf;
                                      ustOf += 12;
                                      cizimler.push(
                                        <text key={key} x={x} y={py} textAnchor="middle" className={(modTip === 'susleme' ? 'muzik-ornament' : 'muzik-articulation') + ' muzik-modifier'} onClick={onClick}>
                                          <title>{baslik}</title>{modMetin}
                                        </text>
                                      );
                                    }
                                  });
                                  return cizimler;
                                })()}
                                <text x={x - 18} y="145" className="muzik-ogesi-etiket">{oge.gorunum}</text>
                              </>
                            ) : gorselTip === 'sus' ? (
                              <>
                                <text x={x - 16} y="101" className="muzik-rest">{gorselMetin}</text>
                                <text x={x - 22} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'olcu' || gorselTip === 'tekrar' ? (
                              <>
                                {/volta|dolap/i.test(oge.ad) ? (
                                  <>
                                    <path d={`M ${x - 18} 48 H ${x + 18} V 58`} className="muzik-volta" />
                                    <text x={x - 12} y="45" className="muzik-volta-text">{gorselMetin || '1.'}</text>
                                  </>
                                ) : (
                                  <>
                                    <line x1={x} x2={x} y1="62" y2="114" className="muzik-barline" />
                                    {/çift|bitiş|repeat|röpriz|section|final/i.test(oge.ad) && <line x1={x + 7} x2={x + 7} y1="62" y2="114" className="muzik-barline" />}
                                    {/repeat|röpriz/i.test(oge.ad) && <><circle cx={x + 13} cy="82" r="2" className="muzik-repeat-dot" /><circle cx={x + 13} cy="98" r="2" className="muzik-repeat-dot" /></>}
                                  </>
                                )}
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{gorselMetin}</text>
                              </>
                            ) : gorselTip === 'zaman' ? (
                              <>
                                {muzikZamanImzasiParcalari(gorselMetin) ? (
                                  <>
                                    <text x={x} y="83" textAnchor="middle" className="muzik-time-signature muzik-time-signature-ust">
                                      {muzikZamanImzasiParcalari(gorselMetin).ust}
                                    </text>
                                    <text x={x} y="107" textAnchor="middle" className="muzik-time-signature muzik-time-signature-alt">
                                      {muzikZamanImzasiParcalari(gorselMetin).alt}
                                    </text>
                                  </>
                                ) : (
                                  <text x={x} y="98" textAnchor="middle" className="muzik-time-signature muzik-time-common">{gorselMetin}</text>
                                )}
                                <text x={x - 18} y="145" className="muzik-ogesi-etiket">zaman</text>
                              </>
                            ) : gorselTip === 'degistirici' || gorselTip === 'donanim' ? (
                              <>
                                <text x={x} y="98" textAnchor="middle" className="muzik-accidental">{gorselMetin}</text>
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'dinamik' ? (
                              <>
                                <text x={x} y="126" textAnchor="middle" className="muzik-dynamic">{gorselMetin}</text>
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'hairpin' ? (
                              <>
                                {String(gorselMetin).includes('>') ? (
                                  <path d={`M ${x - 24} 122 L ${x + 18} 111 M ${x - 24} 122 L ${x + 18} 133`} className="muzik-hairpin" />
                                ) : (
                                  <path d={`M ${x - 22} 111 L ${x + 22} 122 L ${x - 22} 133`} className="muzik-hairpin" />
                                )}
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'bag' ? (
                              <>
                                <path d={`M ${x - 24} 54 C ${x - 8} 38 ${x + 16} 38 ${x + 28} 54`} className="muzik-slur" />
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'nuans' ? (
                              <>
                                <text x={x} y="54" textAnchor="middle" className="muzik-articulation">{gorselMetin}</text>
                                <ellipse cx={x} cy="92" rx="9" ry="6" transform={`rotate(-18 ${x} 92)`} className="muzik-note-head ghost" />
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'susleme' ? (
                              <>
                                <text x={x} y="58" textAnchor="middle" className="muzik-ornament">{gorselMetin}</text>
                                <ellipse cx={x} cy="94" rx="9" ry="6" transform={`rotate(-18 ${x} 94)`} className="muzik-note-head ghost" />
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'tuplet' ? (
                              <>
                                <path d={`M ${x - 24} 54 v -8 H ${x + 24} v 8`} className="muzik-tuplet-bracket" />
                                <text x={x} y="48" textAnchor="middle" className="muzik-tuplet-text">{gorselMetin}</text>
                                <ellipse cx={x - 14} cy="94" rx="6" ry="4" className="muzik-note-head mini" />
                                <ellipse cx={x} cy="94" rx="6" ry="4" className="muzik-note-head mini" />
                                <ellipse cx={x + 14} cy="94" rx="6" ry="4" className="muzik-note-head mini" />
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : gorselTip === 'oktav' ? (
                              <>
                                <text x={x} y="52" textAnchor="middle" className="muzik-ottava">{gorselMetin}</text>
                                <path d={`M ${x - 18} 58 H ${x + 22}`} className="muzik-ottava-line" />
                                <text x={x - 24} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            ) : (
                              <>
                                <text x={x} y="80" textAnchor="middle" className="muzik-symbol-text">{String(gorselMetin).slice(0, 8)}</text>
                                <text x={x - 25} y="145" className="muzik-ogesi-etiket">{oge.ad}</text>
                              </>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    ))}
                  </div>

                    {muzikDuzenPopupAcik && seciliMuzikOge && seciliMuzikOgeIndeksi >= 0 && (
                      <div className="araclar-muzik-modal-arkaplan" role="presentation" onClick={() => setMuzikDuzenPopupAcik(false)}>
                      <div
                        className="araclar-muzik-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Nota düzenleme penceresi"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="araclar-muzik-ck-baslik">
                          {seciliMuzikOge.tip === 'nota' ? 'Notayı düzenle' : seciliMuzikOge.ad}
                          <button type="button" className="btn araclar-muzik-ck-kapat" onClick={() => setMuzikDuzenPopupAcik(false)} aria-label="Kapat">×</button>
                        </div>
                        {seciliMuzikOge.tip === 'nota' ? (
                          <>
                            <div className="araclar-muzik-ck-satir" aria-label="Süre seç">
                              {MUZIK_SURE_GOSTERGELERI.map((sure, idx) => (
                                <button
                                  key={sure.ad}
                                  type="button"
                                  className={`btn ${'araclar-muzik-sure-btn' + (seciliMuzikOge.sureIndeksi === idx ? ' aktif' : '')}`}
                                  onClick={() => muzikSeciliNotayiGuncelle({ sureIndeksi: idx })}
                                  title={`${muzikSureKisaAdi(sure)} — ${sure.aciklama || ''}`}
                                  aria-label={muzikSureKisaAdi(sure)}
                                >
                                  <span className="araclar-muzik-sure-sembol" aria-hidden="true">{sure.sembol}</span>
                                </button>
                              ))}
                            </div>
                            <div className="araclar-muzik-ck-satir araclar-muzik-ck-ses" aria-label="Ses seç">
                              {MUZIK_TEMEL_NOTALAR.map((nota) => (
                                <button
                                  key={nota.ad}
                                  type="button"
                                  className={`btn ${'araclar-muzik-nota-btn araclar-muzik-palet-nota' + (seciliMuzikOge.notaAd === nota.ad ? ' aktif' : '')}`}
                                  onClick={() => muzikSeciliNotayiGuncelle({ notaAd: nota.ad })}
                                  title={nota.ad}
                                  aria-label={nota.ad}
                                >{MUZIK_NOTA_IKON[nota.ad] || nota.ad.charAt(0).toUpperCase()}</button>
                              ))}
                            </div>
                            <div className="araclar-muzik-ck-satir" aria-label="Oktav seç">
                              <span className="araclar-muzik-ck-etiket">Oktav</span>
                              {[1,2,3,4,5,6,7].map((o) => (
                                <button
                                  key={`okt-${o}`}
                                  type="button"
                                  className={`btn ${'araclar-muzik-sure-btn' + ((seciliMuzikOge.oktav ?? 4) === o ? ' aktif' : '')}`}
                                  onClick={() => muzikSeciliNotayiGuncelle({ oktav: o })}
                                  title={`${o}. oktav`}
                                  aria-label={`${o}. oktav`}
                                >{o}</button>
                              ))}
                            </div>
                            <div className="araclar-muzik-ck-satir" aria-label="Aksidental">
                              <span className="araclar-muzik-ck-etiket">Aks.</span>
                              {[
                                { id: null, label: '✗', title: 'Aksidental yok' },
                                { id: 'sharp', label: '♯', title: 'Diyez' },
                                { id: 'flat', label: '♭', title: 'Bemol' },
                                { id: 'natural', label: '♮', title: 'Naturel' },
                                { id: 'doubleSharp', label: '𝄪', title: 'Çift diyez' },
                                { id: 'doubleFlat', label: '𝄫', title: 'Çift bemol' },
                              ].map((acc) => (
                                <button
                                  key={`acc-${acc.id || 'none'}`}
                                  type="button"
                                  className={`btn ${'araclar-muzik-sure-btn' + ((seciliMuzikOge.accidental ?? null) === acc.id ? ' aktif' : '')}`}
                                  onClick={() => muzikSeciliNotayiGuncelle({ accidental: acc.id })}
                                  title={acc.title}
                                  aria-label={acc.title}
                                >{acc.label}</button>
                              ))}
                            </div>
                            <div className="araclar-muzik-ck-satir" aria-label="Noktalı nota">
                              <span className="araclar-muzik-ck-etiket">Nokta</span>
                              <button
                                type="button"
                                className={`btn ${'araclar-muzik-sure-btn' + (seciliMuzikOge.dotted ? ' aktif' : '')}`}
                                onClick={() => muzikSeciliNotayiGuncelle({ dotted: !seciliMuzikOge.dotted })}
                                title="Noktalı nota (değeri 1,5×)"
                                aria-label="Noktalı nota"
                              >{seciliMuzikOge.dotted ? '· açık' : '· kapalı'}</button>
                            </div>
                          </>
                        ) : seciliMuzikOge.tip === 'sus' ? (
                          <>
                            <div className="araclar-muzik-ck-satir" aria-label="Sus süresi seç">
                              <span className="araclar-muzik-ck-etiket">Süre</span>
                              {MUZIK_SURE_GOSTERGELERI.map((sure, idx) => (
                                <button
                                  key={`sus-${sure.ad}`}
                                  type="button"
                                  className={`btn ${'araclar-muzik-sure-btn' + (seciliMuzikOge.sureIndeksi === idx ? ' aktif' : '')}`}
                                  onClick={() => muzikSeciliSusuGuncelle({ sureIndeksi: idx })}
                                  title={`${muzikSureKisaAdi(sure)} sus — ${sure.aciklama || ''}`}
                                  aria-label={`${muzikSureKisaAdi(sure)} sus`}
                                >
                                  <span className="araclar-muzik-sure-sembol" aria-hidden="true">{sure.sembol}</span>
                                </button>
                              ))}
                            </div>
                            <div className="araclar-muzik-ck-satir" aria-label="Noktalı sus">
                              <span className="araclar-muzik-ck-etiket">Nokta</span>
                              <button
                                type="button"
                                className={`btn ${'araclar-muzik-sure-btn' + (seciliMuzikOge.dotted ? ' aktif' : '')}`}
                                onClick={() => muzikSeciliSusuGuncelle({ dotted: !seciliMuzikOge.dotted })}
                                title="Noktalı sus (değeri 1,5×)"
                                aria-label="Noktalı sus"
                              >{seciliMuzikOge.dotted ? '· açık' : '· kapalı'}</button>
                            </div>
                            <div className="araclar-muzik-ck-aciklama">{seciliMuzikOge.aciklama}</div>
                          </>
                        ) : (
                          <div className="araclar-muzik-ck-aciklama">{seciliMuzikOge.aciklama || 'Modül 8 işareti.'}</div>
                        )}
                        <div className="araclar-muzik-ck-aksiyonlar">
                          <button className="btn" type="button" onClick={() => muzikOgeTasi(-1)}>←</button>
                          <button className="btn" type="button" onClick={() => muzikOgeTasi(1)}>→</button>
                          <button type="button" className="btn tehlike" onClick={() => muzikOgeSil()}>Sil</button>
                        </div>
                      </div>
                      </div>
                    )}

                  {Array.isArray(cevirSonuc.olcuUyarilari) && cevirSonuc.olcuUyarilari.length > 0 && (
                    <div className="araclar-muzik-uyarilar" role="status" aria-live="polite">
                      <div className="araclar-muzik-uyari-baslik">Ölçü uyarıları</div>
                      <ul className="araclar-muzik-uyari-liste">
                        {cevirSonuc.olcuUyarilari.map((u, i) => (
                          <li key={i} className="araclar-muzik-uyari">{u}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(cevirSonuc.repeatOnerileri) && cevirSonuc.repeatOnerileri.length > 0 && (
                    <div className="araclar-muzik-uyarilar araclar-muzik-oneriler" role="status" aria-live="polite">
                      <div className="araclar-muzik-uyari-baslik">Tekrar önerileri (Modül 8 Bölüm 10)</div>
                      <ul className="araclar-muzik-uyari-liste">
                        {cevirSonuc.repeatOnerileri.map((o, i) => (
                          <li key={i} className="araclar-muzik-uyari">{o.aciklama}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="araclar-muzik-braille-panel" aria-label="Müzik Braille çıktısı">
                    <div className="araclar-muzik-panel-baslik">Braille çıktısı</div>
                    {hucrelerCache.length > 0 ? (
                      <div className="araclar-muzik-braille-unicode-satiri" lang="zxx">
                        {hucrelerCache.map((hucre, idx) => (
                          <span key={idx} className="unicode-hucre">{noktalardanUnicode(hucre)}</span>
                        ))}
                      </div>
                    ) : (
                      <div className="araclar-muzik-braille-bos">Henüz Braille çıktısı yok.</div>
                    )}
                  </div>
                </div>
              ) : (
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
              )}
              <button
                type="button"
                className={`btn ${'araclar-seslendir-btn' + (konusuyor === 'metin' ? ' aktif' : '')}`}
                onClick={metniSeslendir}
                disabled={!etkinGirdiVar}
                aria-label={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
                title={konusuyor === 'metin' ? 'Durdur' : 'Metni Seslendir'}
              >
                {konusuyor === 'metin'
                  ? <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                }
              </button>
              {/* Müzik nota yazım modu kaldırıldı — ayrı sayfa: /muzik-brf-yazim */}
              <div className="araclar-matematik-sarici" ref={matematikPaletRef}>
                <button
                  type="button"
                  className={`btn ${'araclar-seslendir-btn araclar-matematik-btn' + (matematikPaletiAcik ? ' aktif' : '')}`}
                  onClick={() => setMatematikPaletiAcik((v) => !v)}
                  disabled={muzikModuAktif}
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
                              className="btn araclar-matematik-sembol"
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
            {!muzikModuAktif && girisMetni && (
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
                        <div className="araclar-tablet-grid">
                          {/* Üst kolon numaraları */}
                          <div className="tablet-satir-numarasi" style={{ visibility: 'hidden' }}>00</div>
                          {Array.from({ length: TABLET_SATIR_HUCRE }, (_, i) => (
                            <div key={`er-col-${i}`} className="tablet-kolon-numarasi">{i + 1}</div>
                          ))}

                          {/* Satırlar */}
                          {tabletSatirYerelleri.map((yerler, ri) => (
                            <React.Fragment key={`er-t-${brailleSayfa}-${ri}`}>
                              <div className="tablet-satir-numarasi">{ri + 1}</div>
                              {yerler.map((i) => {
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
                              {/* Eksik hücreleri doldur */}
                              {Array.from({ length: TABLET_SATIR_HUCRE - yerler.length }).map((_, emptyIdx) => (
                                <div key={`er-empty-${ri}-${emptyIdx}`} />
                              ))}
                            </React.Fragment>
                          ))}
                        </div>
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
                    <div className="araclar-tablet-grid">
                      {/* Üst kolon numaraları */}
                      <div className="tablet-satir-numarasi" style={{ visibility: 'hidden' }}>00</div>
                      {Array.from({ length: TABLET_SATIR_HUCRE }, (_, i) => (
                        <div key={`col-${i}`} className="tablet-kolon-numarasi">{i + 1}</div>
                      ))}

                      {/* Satırlar */}
                      {tabletSatirYerelleri.map((yerler, ri) => (
                        <React.Fragment key={`t-${brailleSayfa}-${ri}`}>
                          <div className="tablet-satir-numarasi">{ri + 1}</div>
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
                                aynaliEtiket={true}
                              />
                            );
                          })}
                          {/* Eksik hücreleri doldur */}
                          {Array.from({ length: TABLET_SATIR_HUCRE - yerler.length }).map((_, emptyIdx) => (
                            <div key={`empty-${ri}-${emptyIdx}`} />
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <BrailleGrid
                      hucreler={hucrelerCache}
                      indices={Array.from({ length: sayfaHucreler.length }, (_, i) => i)}
                      baseIndex={sayfaBaslangic}
                      kisaltmaAktif={kisaltmaAktif}
                      genisletAktif={genisletAktif}
                      seciliIndex={(seciliHucre && typeof seciliHucre.index === 'number') ? seciliHucre.index : -1}
                      onSelect={(idx) => hucreTiklandigindaMetniSec(idx)}
                      anlamlar={sayfaHucreAnlamlari}
                      buildEtiket={(anlam) => kisaEtiket(anlam)}
                      esleme={eslemeCache}
                      paraBirimiKaynakAraliklari={paraBirimiKaynakAraliklari}
                      isHighlighted={(idx) => !!(metinSecimHucreAraligi && idx >= metinSecimHucreAraligi.lo && idx <= metinSecimHucreAraligi.hi)}
                    />
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
                            className={`btn ${'bhp-ayar' + (hucreAyarPaneliAcik ? ' aktif' : '')}`}
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
                          className="btn bhp-kapat"
                          onClick={() => setSeciliHucre(null)}
                          aria-label="Kapat"
                        >×</button>
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
                            className="btn bhp-ayarlari-sifirla"
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
                        className="btn belge-sayfa-btn"
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
                        className="btn belge-sayfa-btn"
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
                      className={`btn ${'belge-genislet-btn' + (genisletAktif ? ' aktif' : '')}`}
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
                      className="btn belge-genislet-btn belge-jpg-btn"
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
                  className={`btn ${'araclar-seslendir-btn araclar-seslendir-nokta' + (konusuyor === 'nokta' ? ' aktif' : '')}`}
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
                  className={`btn ${'araclar-seslendir-btn araclar-erisilebilir-btn' + (erisilebilirMod ? ' aktif' : '')}`}
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
                    className={`btn ${'araclar-seslendir-btn araclar-kopyala-btn' + (kopyalandi ? ' aktif' : '')}`}
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
                disabled={!etkinGirdiVar}
                onClick={brfIndir}
                className="btn araclar-brf-grup-ilk"
                aria-label="BRF İndir"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><path d="M12 3v13M7 11l5 5 5-5"/><path d="M5 20h14"/></svg>
                <span className="btn-yazi">BRF İndir</span>
              </button>
              <button
                type="button"
                disabled={!etkinGirdiVar}
                onClick={() => setBrfOnizlemeAcik(true)}
                className="btn araclar-brf-grup-son araclar-brf-grup-onizle"
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
              disabled={!etkinGirdiVar}
              className="btn araclar-controls-temizle"
              aria-label="Temizle"
              title="Metni temizle"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-ikon" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              <span className="btn-yazi">Temizle</span>
            </button>
            <button
              type="button"
              disabled={!etkinGirdiVar}
              className={`btn ${'araclar-perkins-btn araclar-perkins-btn--yalnizca-ikon' + (tabletModuAktif ? ' aktif' : '')}`}
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
              className={`btn ${'araclar-perkins-btn araclar-perkins-btn--yalnizca-ikon' + (perkinsAktif ? ' aktif' : '')}`}
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
                className={`btn ${'araclar-perkins-btn' + (kisaltmaAktif ? ' aktif' : '')}`}
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
                className={`btn ${'kisaltma-sistem-acilis-btn araclar-perkins-btn' + (kisaltmaAktif && sistemPaneli ? ' aktif' : '') + (kisaltmaAktif ? '' : ' disabled')}`}
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
                className="btn araclar-brf-onizle-kapat"
                onClick={() => setBrfOnizlemeAcik(false)}
                aria-label="Kapat"
              >
                ×
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
  aynaliEtiket = false,
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
          aynaliEtiket={aynaliEtiket}
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
    && (prev.aynaliEtiket || false) === (next.aynaliEtiket || false)
    && brailleHucreAnlamiMemoAnahtari(prev.anlam, prev.paraBirimiHucre, prev.genisletAktif)
      === brailleHucreAnlamiMemoAnahtari(next.anlam, next.paraBirimiHucre, next.genisletAktif);
});
