// Türkçe metni braille hücre dizisine çevirir.
// Her hücre, dolu nokta numaralarının dizisidir (ör. [1,2,4]).
// Boş hücre = []  (kelime arası boşluk).
//
// Kullanım:
//   const hucreler = metniBrailleyeCevir("Merhaba dünya.");
//   // -> [[1,3,4], [1,5], [1,2,3,5], ... ]
//
// Notlar:
// - Büyük harf işareti, sayı işareti gibi prefix'ler **eğitim modunda
//   sadeleştirme** amacıyla varsayılan olarak EKLENMEZ. Açmak için
//   { buyukHarfIsareti: true, sayiIsareti: true } seçeneklerini kullanın.
// - Tanımsız karakterler boş hücre (boşluk) olarak gösterilir.

import { HARFLER, RAKAMLAR, NOKTALAMA } from '../data/braille.js';

const HARF_TABLO = (() => {
  const m = new Map();
  for (const h of HARFLER) {
    m.set(h.harf, h.noktalar);
    m.set(h.harf.toLocaleLowerCase('tr'), h.noktalar);
  }
  return m;
})();

const RAKAM_TABLO = new Map(RAKAMLAR.map((r) => [r.rakam, r.noktalar]));
const NOKTA_TABLO = new Map(NOKTALAMA.map((n) => [n.isaret, n.noktalar]));

const BUYUK_HARF_ISARETI = [4, 6];   // Türk Braille konvansiyonu
const SAYI_ISARETI       = [3, 4, 5, 6];

/**
 * @param {string} metin
 * @param {{ buyukHarfIsareti?: boolean, sayiIsareti?: boolean }} [opt]
 * @returns {{ hucreler: number[][], esleme: number[] }}
 *   hucreler: braille hücre dizisi
 *   esleme:   her hücrenin metindeki kaynak karakterinin indeksi (-1 = işaret hücresi)
 */
export function metniBrailleyeCevir(metin, opt = {}) {
  const { buyukHarfIsareti = false, sayiIsareti = false } = opt;
  const hucreler = [];
  const esleme = [];

  const ekle = (noktalar, kaynak) => {
    hucreler.push(noktalar);
    esleme.push(kaynak);
  };

  let sayiModu = false;

  for (let i = 0; i < metin.length; i++) {
    const ch = metin[i];

    // Sayılar
    if (RAKAM_TABLO.has(ch)) {
      if (sayiIsareti && !sayiModu) {
        ekle(SAYI_ISARETI, -1);
        sayiModu = true;
      }
      ekle(RAKAM_TABLO.get(ch), i);
      continue;
    } else {
      sayiModu = false;
    }

    // Harfler (Türkçe destekli)
    const ust = ch.toLocaleUpperCase('tr');
    if (HARF_TABLO.has(ust)) {
      if (buyukHarfIsareti && ch === ust && ch !== ch.toLocaleLowerCase('tr')) {
        ekle(BUYUK_HARF_ISARETI, -1);
      }
      ekle(HARF_TABLO.get(ust), i);
      continue;
    }

    // Noktalama
    if (NOKTA_TABLO.has(ch)) {
      ekle(NOKTA_TABLO.get(ch), i);
      continue;
    }

    // Boşluk veya tanınmayan -> boş hücre
    ekle([], i);
  }

  return { hucreler, esleme };
}

/**
 * Hücreleri sayfalara böler. Mümkünse satır sonlarını **boşluk** üzerinde tutar.
 * @param {number[][]} hucreler
 * @param {number} hucrePerSayfa
 * @returns {number[][][]}  sayfa[ ][hücreIndeks][noktaListesi]
 */
export function sayfalaraBol(hucreler, hucrePerSayfa) {
  if (hucrePerSayfa <= 0) return [hucreler];
  const sayfalar = [];
  let i = 0;
  while (i < hucreler.length) {
    let son = Math.min(i + hucrePerSayfa, hucreler.length);
    // Sayfanın sonu metnin ortasındaysa, geriye doğru en yakın boş hücreyi (boşluk) ara
    if (son < hucreler.length) {
      let bolme = -1;
      for (let j = son - 1; j > i + hucrePerSayfa / 2; j--) {
        if (hucreler[j].length === 0) { bolme = j + 1; break; }
      }
      if (bolme > i) son = bolme;
    }
    sayfalar.push(hucreler.slice(i, son));
    i = son;
  }
  return sayfalar;
}

// ---------- Ters çevrim: noktalar -> karakter ----------

/** Nokta dizisini sıralı, benzersiz anahtara çevirir. Örn. [4,1,2] -> "1,2,4" */
export function noktalariAnahtara(noktalar) {
  return [...new Set(noktalar)].sort((a, b) => a - b).join(',');
}

const HARF_TERS = (() => {
  const m = new Map();
  for (const h of HARFLER) m.set(noktalariAnahtara(h.noktalar), h.harf);
  return m;
})();

const RAKAM_TERS = (() => {
  const m = new Map();
  for (const r of RAKAMLAR) m.set(noktalariAnahtara(r.noktalar), r.rakam);
  return m;
})();

const NOKTA_TERS = (() => {
  const m = new Map();
  for (const n of NOKTALAMA) m.set(noktalariAnahtara(n.noktalar), n.isaret);
  return m;
})();

const ANAHTAR_BUYUK = noktalariAnahtara(BUYUK_HARF_ISARETI);
const ANAHTAR_SAYI  = noktalariAnahtara(SAYI_ISARETI);

/**
 * Tek bir hücreyi (nokta dizisi) karaktere çevirir.
 * Önce harf, sonra noktalama tablolarına bakar.
 * @param {number[]} noktalar
 * @returns {string|null}  bulunamazsa null
 */
export function hucreyiKarakteryap(noktalar) {
  if (!noktalar || noktalar.length === 0) return ' ';
  const k = noktalariAnahtara(noktalar);
  if (HARF_TERS.has(k)) return HARF_TERS.get(k);
  if (NOKTA_TERS.has(k)) return NOKTA_TERS.get(k);
  return null;
}

/** Sayı işareti modunda hücreyi rakama çevirir. */
export function hucreyiRakamayap(noktalar) {
  const k = noktalariAnahtara(noktalar);
  return RAKAM_TERS.has(k) ? RAKAM_TERS.get(k) : null;
}

export function buyukHarfIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_BUYUK;
}
export function sayiIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_SAYI;
}

// ─── Kısaltmalı dönüştürme ──────────────────────────────────────────────────

import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
} from '../data/braille.js';

// Kelime sonunda kullanılamayan hece kısaltmaları (MEB kılavuzu)
const HECE_SON_YASAK = new Set(['ba', 'be', 'bu', 'ka', 'ha', 'ki']);

// Arama tabloları
const KELIME_KISALTMA_MAP = new Map(
  KELIME_KISALTMALARI.map((k) => [k.kelime.toLocaleLowerCase('tr'), k.noktalar])
);
const IKI_HARFLI_MAP = new Map(
  IKI_HARFLI_KISALTMALAR.map((k) => [k.kelime.toLocaleLowerCase('tr'), [k.sol, k.sag]])
);
// Hece kısaltmalarını uzundan kısaya sıralı tablo (en uzun eşleşme önce)
const HECE_SORTED = [...HECE_KISALTMALARI].sort((a, b) => b.hece.length - a.hece.length);

/**
 * Tek bir kelimeyi (noktalama/boşluk olmayan) kısaltma kurallarıyla dönüştürür.
 * Kurallar (öncelik sırasıyla):
 *  1. Tam kelime → iki harfli kısaltma (2 hücre)
 *  2. Tam kelime → tek harfli kısaltma (1 hücre)
 *  3. Kelime içinde: en uzun hece kısaltması (başta/ortada her yerde;
 *     sonda yalnızca HECE_SON_YASAK'ta olmayan heceler)
 *  4. Kalan karakterler normal braille harflerine çevrilir
 * @param {string} kelime  — küçük harfli, sadece alfabe karakterleri
 * @param {{ buyukHarfIsareti?: boolean, sayiIsareti?: boolean }} opt
 * @returns {number[][]}  hücre dizisi
 */
function kelimeyiKisaltmayaCevir(kelime, opt) {
  const kucuk = kelime.toLocaleLowerCase('tr');

  // 1. Tam kelime → iki harfli kısaltma
  if (IKI_HARFLI_MAP.has(kucuk)) {
    const [sol, sag] = IKI_HARFLI_MAP.get(kucuk);
    return [sol, sag];
  }

  // 2. Tam kelime → tek harfli kısaltma
  if (KELIME_KISALTMA_MAP.has(kucuk)) {
    return [KELIME_KISALTMA_MAP.get(kucuk)];
  }

  // 3 + 4. Hece kısaltması ile harf karışık dönüşüm
  const hucreler = [];
  let i = 0;
  const n = kelime.length;
  while (i < n) {
    const kalanUzunluk = n - i;
    const sonMu = false; // aşağıda hesaplanacak
    let eslesti = false;
    for (const { hece, noktalar } of HECE_SORTED) {
      if (hece.length > kalanUzunluk) continue;
      const parca = kucuk.slice(i, i + hece.length);
      if (parca !== hece) continue;
      // Kelime sonunda yasak mı?
      const kelimeSonuMu = i + hece.length === n;
      if (kelimeSonuMu && HECE_SON_YASAK.has(hece)) continue;
      hucreler.push(noktalar);
      i += hece.length;
      eslesti = true;
      break;
    }
    if (!eslesti) {
      // Normal harf
      const ch = kelime[i];
      const ust = ch.toLocaleUpperCase('tr');
      const noktalar = HARF_TABLO.get(ust);
      if (noktalar) {
        if (opt.buyukHarfIsareti && ch === ch.toLocaleUpperCase('tr') && ch !== ch.toLocaleLowerCase('tr')) {
          hucreler.push(BUYUK_HARF_ISARETI);
        }
        hucreler.push(noktalar);
      } else {
        hucreler.push([]); // bilinmeyen karakter
      }
      i++;
    }
  }
  return hucreler;
}

/**
 * Metni kısaltma sistemi aktif olarak braille hücre dizisine çevirir.
 * @param {string} metin
 * @param {{ buyukHarfIsareti?: boolean, sayiIsareti?: boolean }} [opt]
 * @returns {{ hucreler: number[][], esleme: number[] }}
 */
export function metniBrailleyeCevirKisaltmali(metin, opt = {}) {
  const { buyukHarfIsareti = false, sayiIsareti = false } = opt;
  const hucreler = [];
  const esleme = [];
  const ekle = (noktalar, kaynak) => { hucreler.push(noktalar); esleme.push(kaynak); };

  // Metni kelimelere ve ayraçlara (boşluk/noktalama) böl
  // Token: [tip, deger, baslangicIndeks]
  const tokenler = [];
  let i = 0;
  while (i < metin.length) {
    const ch = metin[i];
    if (/\s/.test(ch)) {
      tokenler.push({ tip: 'bosluk', deger: ch, idx: i });
      i++;
    } else if (NOKTA_TABLO.has(ch)) {
      tokenler.push({ tip: 'noktalama', deger: ch, idx: i });
      i++;
    } else if (RAKAM_TABLO.has(ch)) {
      // Rakam bloğu
      let j = i;
      while (j < metin.length && RAKAM_TABLO.has(metin[j])) j++;
      tokenler.push({ tip: 'rakam', deger: metin.slice(i, j), idx: i });
      i = j;
    } else {
      // Kelime bloğu (harf karakterleri)
      let j = i;
      while (j < metin.length) {
        const c = metin[j];
        if (/\s/.test(c) || NOKTA_TABLO.has(c) || RAKAM_TABLO.has(c)) break;
        j++;
      }
      tokenler.push({ tip: 'kelime', deger: metin.slice(i, j), idx: i });
      i = j;
    }
  }

  let sayiModu = false;

  for (const tok of tokenler) {
    if (tok.tip === 'bosluk') {
      ekle([], tok.idx);
      sayiModu = false;
    } else if (tok.tip === 'noktalama') {
      ekle(NOKTA_TABLO.get(tok.deger), tok.idx);
      sayiModu = false;
    } else if (tok.tip === 'rakam') {
      if (sayiIsareti && !sayiModu) { ekle(SAYI_ISARETI, -1); sayiModu = true; }
      for (let ri = 0; ri < tok.deger.length; ri++) {
        ekle(RAKAM_TABLO.get(tok.deger[ri]), tok.idx + ri);
      }
    } else {
      // Kelime — büyük harf kontrolü + kısaltma dönüşümü
      sayiModu = false;
      // Kelime başında büyük harf işareti (sadece tüm harf büyük veya ilk büyük)
      const kel = tok.deger;
      const kucukKel = kel.toLocaleLowerCase('tr');
      const hucreleri = kelimeyiKisaltmayaCevir(kel, { buyukHarfIsareti, sayiIsareti });
      for (let hi = 0; hi < hucreleri.length; hi++) {
        ekle(hucreleri[hi], tok.idx);
      }
    }
  }

  return { hucreler, esleme };
}

