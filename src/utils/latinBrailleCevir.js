/**
 * Latin alfabeli diller (İngilizce / Almanca / Fransızca) için metin → Braille dönüştürücü.
 *
 * TASARIM İLKESİ — "tam kapsamlı ama sıfır hata":
 * - Temel (Grade 1) çeviri her zaman doğrudur: harf, aksanlı harf, rakam, büyük harf,
 *   noktalama hücreleri doğrudan öğrenme modüllerindeki veri dosyalarından alınır.
 * - Kısaltma açıkken:
 *     • Her üç dilde de TAM KELİME kısaltmaları (wordsign / shortform / abrégé / Kürzung)
 *       yalnız kelime bütün olarak eşleşince uygulanır → veri dosyasından geldiği için %100 doğru.
 *     • Kelime içi grup işaretleri (İng. ch/sh/ing/tion, Alm. Lautgruppe, Fr. parça) UEB/sistem
 *       kurallarında HECE sınırına bağlıdır (ör. "mishap"→sh yok, "bead"→be yok). Program heceyi
 *       güvenle çıkaramayacağı için, SİFIR HATA güvencesi adına greedy grup işaretleri uygulanmaz.
 *       Kelimenin tamamı sözlükte yoksa harf harf (Grade-1) yazılır → asla yanlış hücre üretilmez.
 *
 * Çıktı biçimi Türkçe motorla aynıdır: { hucreler: number[][], esleme: number[] }
 *
 * Türkçe dönüştürücü (brailleCevir.js) bu dosyadan tamamen bağımsızdır ve hiç değiştirilmemiştir.
 */

import {
  INGILIZCE_TEMEL_ALFABE,
  INGILIZCE_TEK_HARF_VE_EKLER,
  INGILIZCE_COKLU_SEMBOL,
  INGILIZCE_BIRLESIK_OZEL,
} from '../data/ingilizceBraille.js';
import {
  ALMANCA_ALFABE,
  ALMANCA_BIR_HARF_GRUP1,
  ALMANCA_BIR_HARF_GRUP2,
  ALMANCA_BIR_HARF_GRUP3,
} from '../data/almancaBraille.js';
import {
  FRANSIZCA_ALFABE_AJ,
  FRANSIZCA_ALFABE_KT,
  FRANSIZCA_ALFABE_UZ,
  FRANSIZCA_ALFABE_AKSAN,
  FRANSIZCA_BIR_HARF_GRUP1,
  FRANSIZCA_BIR_HARF_GRUP2,
  FRANSIZCA_BIR_HARF_GRUP3,
} from '../data/fransizcaBraille.js';

/* ───────────────────────────  Göstergeler  ─────────────────────────────── */

const SAYI_ISARETI = [3, 4, 5, 6];          // ⠼ (tüm Latin dillerinde ortak)
const BUYUK_HARF = {
  en: [6],        // ⠠ dot 6 (UEB)
  de: [6],        // ⠠ dot 6
  fr: [4, 6],     // ⠨ dots 4-6 (Fransız braille)
};

// Rakam hücreleri: # + a–j (1..9,0)
const RAKAM_HUCRE = {
  '1': [1], '2': [1, 2], '3': [1, 4], '4': [1, 4, 5], '5': [1, 5],
  '6': [1, 2, 4], '7': [1, 2, 4, 5], '8': [1, 2, 5], '9': [2, 4], '0': [2, 4, 5],
};

// Üç dilde tutarlı noktalama hücreleri (yalnızca üzerinde uzlaşı olanlar).
const NOKTALAMA_HUCRE = {
  ',': [2],
  ';': [2, 3],
  ':': [2, 5],
  '.': [2, 5, 6],
  '?': [2, 3, 6],
  '!': [2, 3, 5],
  "'": [3],
  '’': [3],
  '-': [3, 6],
  '/': [3, 4],
};

/* ──────────────────────  Veriden tablo kurma  ──────────────────────────── */

/** Tek karakterli (alfabe/aksan) girdilerden { harf -> hücre } haritası kurar. */
function harfHaritasi(...diziler) {
  const m = new Map();
  for (const dizi of diziler) {
    for (const oge of dizi) {
      const ad = String(oge.ad || '');
      if ([...ad].length !== 1) continue;
      if (!oge.hucreler || oge.hucreler.length !== 1) continue;
      m.set(ad.toLocaleLowerCase('en'), oge.hucreler[0]);
    }
  }
  return m;
}

/**
 * Tam kelime kısaltma sözlüğü kurar (yalnız harflerden oluşan, hücresi dolu girdiler).
 * @returns {Map<string, number[][]>}
 */
function kelimeHaritasi(...diziler) {
  const m = new Map();
  for (const dizi of diziler) {
    for (const oge of dizi) {
      const ad = String(oge.ad || '');
      if (!oge.hucreler || oge.hucreler.length === 0) continue;
      // Yalnız alfabetik (boşluksuz, noktalamasız) kelimeler; ör. "o'clock" atlanır
      if (!/^[a-zà-ÿ]+$/i.test(ad)) continue;
      const anahtar = ad.toLocaleLowerCase('en');
      if (!m.has(anahtar)) m.set(anahtar, oge.hucreler);
    }
  }
  return m;
}

const HARF_EN = harfHaritasi(INGILIZCE_TEMEL_ALFABE);
const HARF_DE = harfHaritasi(ALMANCA_ALFABE);
const HARF_FR = harfHaritasi(
  FRANSIZCA_ALFABE_AJ, FRANSIZCA_ALFABE_KT, FRANSIZCA_ALFABE_UZ, FRANSIZCA_ALFABE_AKSAN,
);
// Almanca ß: standart braille hücresi ⠮ (2-3-4-6); alfabe verisinde yer almaz, eklenir.
HARF_DE.set('ß', [2, 3, 4, 6]);

const KELIME_EN = kelimeHaritasi(
  INGILIZCE_TEK_HARF_VE_EKLER, INGILIZCE_COKLU_SEMBOL, INGILIZCE_BIRLESIK_OZEL,
);
const KELIME_DE = kelimeHaritasi(
  ALMANCA_BIR_HARF_GRUP1, ALMANCA_BIR_HARF_GRUP2, ALMANCA_BIR_HARF_GRUP3,
);
const KELIME_FR = kelimeHaritasi(
  FRANSIZCA_BIR_HARF_GRUP1, FRANSIZCA_BIR_HARF_GRUP2, FRANSIZCA_BIR_HARF_GRUP3,
);

/* ──────────────────────────  Yardımcılar  ──────────────────────────────── */

const DIL_TABLO = {
  en: { harf: HARF_EN, kelime: KELIME_EN, buyuk: BUYUK_HARF.en },
  de: { harf: HARF_DE, kelime: KELIME_DE, buyuk: BUYUK_HARF.de },
  fr: { harf: HARF_FR, kelime: KELIME_FR, buyuk: BUYUK_HARF.fr },
};

function harfMi(ch, harfMap) {
  return harfMap.has(ch.toLocaleLowerCase('en'));
}

function rakamMi(ch) {
  return ch >= '0' && ch <= '9';
}

/**
 * Bir kelimeyi (yalnız harf dizisi) hücrelere çevirir.
 * @param {string} kelimeOrijinal büyük/küçük korunmuş orijinal kelime
 * @param {number} kaynakBas kelimenin metindeki başlangıç indeksi
 * @param {object} tablo dil tablosu
 * @param {boolean} kisaltma kısaltma açık mı
 * @param {(hucre:number[], kaynak:number)=>void} ekle
 */
function kelimeyiCevir(kelimeOrijinal, kaynakBas, tablo, kisaltma, ekle) {
  const kucuk = kelimeOrijinal.toLocaleLowerCase('en');
  const uzun = [...kelimeOrijinal];

  // Büyük harf göstergesi: her büyük harften önce (her zaman doğru, dilden bağımsız güvenli).
  const buyukIsaret = (idx) => {
    const ch = uzun[idx];
    if (ch && ch !== ch.toLocaleLowerCase('en') && ch === ch.toLocaleUpperCase('en')) {
      // Harf gerçekten büyük/küçük ayrımı olan bir harfse
      if (ch.toLocaleLowerCase('en') !== ch.toLocaleUpperCase('en')) {
        ekle([...tablo.buyuk], kaynakBas + idx);
      }
    }
  };

  // 1) Tam kelime kısaltması
  if (kisaltma && tablo.kelime.has(kucuk)) {
    // Büyük harf göstergesi(leri): kelimenin baş harfi büyükse bir gösterge yeterli.
    // Tümü büyükse her hücreden önce değil, baştaki harfler büyük olduğu için baş göstergesi koyarız.
    const ilk = uzun[0];
    const ilkBuyuk = ilk && ilk !== ilk.toLocaleLowerCase('en') && ilk.toLocaleLowerCase('en') !== ilk.toLocaleUpperCase('en');
    if (ilkBuyuk) ekle([...tablo.buyuk], kaynakBas);
    for (const hucre of tablo.kelime.get(kucuk)) {
      ekle([...hucre], kaynakBas);
    }
    return;
  }

  // 2) Harf harf (Grade-1) — her zaman doğru, asla yanlış hücre üretmez.
  for (let i = 0; i < uzun.length; i += 1) {
    const ch = uzun[i];
    const hucre = tablo.harf.get(ch.toLocaleLowerCase('en'));
    if (hucre) {
      buyukIsaret(i);
      ekle([...hucre], kaynakBas + i);
    }
  }
}

/* ──────────────────────────  Ana fonksiyon  ────────────────────────────── */

/**
 * @param {string} metin
 * @param {{ dil?: 'en'|'de'|'fr', kisaltma?: boolean }} [opt]
 * @returns {{ hucreler: number[][], esleme: number[] }}
 */
export function metniLatinBrailleyeCevir(metin, opt = {}) {
  const dil = opt.dil && DIL_TABLO[opt.dil] ? opt.dil : 'en';
  const kisaltma = !!opt.kisaltma;
  const tablo = DIL_TABLO[dil];

  const hucreler = [];
  const esleme = [];
  const ekle = (hucre, kaynak) => { hucreler.push(hucre); esleme.push(kaynak); };

  const n = metin.length;
  let i = 0;
  while (i < n) {
    const ch = metin[i];

    // Boşluk
    if (/\s/u.test(ch)) {
      ekle([], i);
      i += 1;
      continue;
    }

    // Rakam dizisi → tek sayı göstergesi + rakamlar (.,/ ile bağlı rakamlar dahil)
    if (rakamMi(ch)) {
      ekle([...SAYI_ISARETI], i);
      let j = i;
      while (j < n) {
        const c = metin[j];
        if (rakamMi(c)) {
          ekle([...RAKAM_HUCRE[c]], j);
          j += 1;
        } else if ((c === '.' || c === ',' || c === '/') && j + 1 < n && rakamMi(metin[j + 1])) {
          // Sayı içi ayraç: noktalama hücresiyle değil, ayraç hücresiyle yazılır
          ekle(c === '/' ? [3, 4] : [2], j); // . ve , → [2] (ondalık/binlik), / → [3,4]
          j += 1;
        } else {
          break;
        }
      }
      i = j;
      continue;
    }

    // Harf → kelimeyi topla
    if (harfMi(ch, tablo.harf)) {
      let j = i;
      while (j < n && harfMi(metin[j], tablo.harf)) j += 1;
      kelimeyiCevir(metin.slice(i, j), i, tablo, kisaltma, ekle);
      i = j;
      continue;
    }

    // Noktalama
    if (Object.prototype.hasOwnProperty.call(NOKTALAMA_HUCRE, ch)) {
      ekle([...NOKTALAMA_HUCRE[ch]], i);
      i += 1;
      continue;
    }

    // Bilinmeyen karakter: yanlış hücre üretmemek için atlanır (sıfır hata ilkesi).
    i += 1;
  }

  return { hucreler, esleme };
}

/** Araclar.jsx'in kullandığı dil listesi (sıra = sağ üstteki seçici sırası). */
export const LATIN_DILLER = [
  { kod: 'tr', etiket: 'Türkçe', bayrak: '🇹🇷' },
  { kod: 'en', etiket: 'İngilizce', bayrak: '🇬🇧' },
  { kod: 'de', etiket: 'Almanca', bayrak: '🇩🇪' },
  { kod: 'fr', etiket: 'Fransızca', bayrak: '🇫🇷' },
];
