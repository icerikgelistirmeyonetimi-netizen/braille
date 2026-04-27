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
