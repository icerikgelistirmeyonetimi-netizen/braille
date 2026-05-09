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
 * Bir kelimenin tüm harflerinin büyük olup olmadığını döner.
 * En az 2 harf içermeli ve tüm harf karakterleri büyük olmalı.
 * (Kelime ≥2 büyük harften oluştuğunda "Tümü Büyük İşareti" — iki yan yana [4,6] —
 * her harf için ayrı işaret yerine bir kez kullanılır.)
 */
export function kelimeTumuBuyukMu(kelime) {
  if (!kelime || kelime.length < 2) return false;
  let harfSayisi = 0;
  for (const ch of kelime) {
    const ust = ch.toLocaleUpperCase('tr');
    if (!HARF_TABLO.has(ust)) continue;
    const kucuk = ch.toLocaleLowerCase('tr');
    if (ch !== ust || ch === kucuk) return false; // küçük harf veya kasalı olmayan karakter
    harfSayisi++;
  }
  return harfSayisi >= 2;
}

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
  let tirnakAcik = false; // düz " için açma/kapama toggle
  let tumuBuyukKalan = 0; // bu sayıya kadar gelen harfler için per-letter [4,6] verme

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
      // Kelime başında ALL CAPS kontrolü → çift [4,6]
      if (buyukHarfIsareti && tumuBuyukKalan === 0) {
        const kelimeBasi = i === 0 || !HARF_TABLO.has(metin[i - 1]?.toLocaleUpperCase('tr'));
        if (kelimeBasi) {
          let j = i, harfAd = 0;
          while (j < metin.length) {
            const c = metin[j];
            const u = c.toLocaleUpperCase('tr');
            if (!HARF_TABLO.has(u)) break;
            harfAd++;
            j++;
          }
          // Tümü büyük mü?
          let tumBuyuk = harfAd >= 2;
          if (tumBuyuk) {
            for (let k = i; k < j; k++) {
              const c = metin[k];
              const u = c.toLocaleUpperCase('tr');
              const l = c.toLocaleLowerCase('tr');
              if (c !== u || c === l) { tumBuyuk = false; break; }
            }
          }
          if (tumBuyuk) {
            ekle(BUYUK_HARF_ISARETI, -1);
            ekle(BUYUK_HARF_ISARETI, -1);
            tumuBuyukKalan = harfAd;
          }
        }
      }
      if (tumuBuyukKalan > 0) {
        ekle(HARF_TABLO.get(ust), i);
        tumuBuyukKalan--;
      } else {
        if (buyukHarfIsareti && ch === ust && ch !== ch.toLocaleLowerCase('tr')) {
          ekle(BUYUK_HARF_ISARETI, -1);
        }
        ekle(HARF_TABLO.get(ust), i);
      }
      continue;
    } else {
      tumuBuyukKalan = 0;
    }

    // Düz tırnak: pozisyon-aware (önce açma sonra kapama olarak toggle)
    if (ch === '\u0022') {
      if (!tirnakAcik) { ekle([2, 3, 6], i); tirnakAcik = true; }
      else { ekle([3, 5, 6], i); tirnakAcik = false; }
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
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
} from '../data/braille.js';
import { TURKCE_KELIMELER } from '../data/turkceSozluk.js';

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

// Kök kısaltmaları: uzundan kısaya sıralı (en uzun eşleşme önce)
const KOK_SORTED = [...KELIME_KOKU_KISALTMALARI].sort((a, b) => b.kelime.length - a.kelime.length);

// Kelime parçası (suffix/ek) kısaltmaları:
// ekler alanı "lara, lere" gibi virgüllü liste; her suffix → { sol, sag } eşler
const PARCA_SUFFIX_MAP = (() => {
  const m = new Map();
  for (const p of KELIME_PARCASI_KISALTMALARI) {
    for (const ek of p.ekler.split(', ').map((s) => s.trim())) {
      if (!m.has(ek)) m.set(ek, { sol: p.sol, sag: p.sag });
    }
  }
  return m;
})();
// Suffix listesini uzundan kısaya sırala
const PARCA_SUFFIXES_SORTED = [...PARCA_SUFFIX_MAP.keys()].sort((a, b) => b.length - a.length);

/**
 * Tek bir kelimeyi (noktalama/boşluk olmayan) kısaltma kurallarıyla dönüştürür.
 *
 * Konum kısıtlamaları:
 *  - Kök kısaltması ([5]+sag) : yalnızca kelime BAŞINDA (ardında en az 1 karakter olmalı)
 *  - Parça kısaltması ([4,5] veya [5,6]+sag) : yalnızca kelime SONUNDA (önünde en az 1 karakter)
 *  - Hece kısaltması : kelime başında/ortasında serbestçe;
 *    sonda yalnızca HECE_SON_YASAK dışındakiler
 *
 * Öncelik sırası:
 *  1. Tam kelime → iki harfli kısaltma (2 hücre)
 *  2. Tam kelime → tek harfli kısaltma (1 hücre)
 *  3. Kelime başında en uzun kök kısaltması; kalan özyinelemeli
 *  4. Kelime sonundan suffix kısaltmaları soyulur
 *  5. Kalan stem: en uzun hece kısaltması, yoksa normal harf
 *
 * @param {string} kelime  — orijinal büyük/küçük harf karışık olabilir
 * @param {object} opt
 * @returns {number[][]}  hücre dizisi
 */
function kelimeyiKisaltmayaCevir(kelime, opt) {
  const kucuk = kelime.toLocaleLowerCase('tr');
  const { ikiHarf = true, birHarf = true, hece = true, kok = true, parca = true } = opt;

  // 1. Tam kelime → iki harfli kısaltma
  if (ikiHarf && IKI_HARFLI_MAP.has(kucuk)) {
    const [sol, sag] = IKI_HARFLI_MAP.get(kucuk);
    return [sol, sag];
  }

  // 2. Tam kelime → tek harfli kısaltma
  if (birHarf && KELIME_KISALTMA_MAP.has(kucuk)) {
    return [KELIME_KISALTMA_MAP.get(kucuk)];
  }

  // 3. Kelime kökü kısaltması — yalnızca kelime BAŞINDA, ardında en az 1 karakter olmalı
  if (kok) {
    for (const { kelime: kokKelime, sag } of KOK_SORTED) {
      if (kucuk.length > kokKelime.length && kucuk.startsWith(kokKelime)) {
        const kalanKucuk = kucuk.slice(kokKelime.length);
        // Kalan kısmı işle; kök tekrar aranmasın; afterKok=true ile tam-suffix eşleşmesine izin ver
        const kalanHucreler = kelimeyiKisaltmayaCevir(kalanKucuk, { ...opt, kok: false, afterKok: true });
        return [[5], sag, ...kalanHucreler];
      }
    }
  }

  // 4. Kelime parçası (suffix) kısaltmalarını sağdan soy — yalnızca kelime SONUNDA,
  //    önünde en az 1 karakter olmalı (afterKok=true ise tam-suffix eşleşmesine izin verilir).
  //    suffixCellsFlat: [sol1, sag1, sol2, sag2, ...] (soldan sağa sıralı)
  const { afterKok = false } = opt;
  // afterKok=true: kök işaretinden hemen sonra gelen kısım, tam suffix olabilir (min stem=0)
  // afterKok=false: normal kelime, suffix öncesinde en az 1 karakter olmalı (min stem=1)
  const minOnce = afterKok ? 0 : 1;
  const suffixCellsFlat = [];
  let stemKucuk = kucuk;
  if (parca) {
    let devam = true;
    while (devam && stemKucuk.length > minOnce) {
      devam = false;
      for (const suffix of PARCA_SUFFIXES_SORTED) {
        if (stemKucuk.length - suffix.length >= minOnce && stemKucuk.endsWith(suffix)) {
          const yeniStem = stemKucuk.slice(0, -suffix.length);
          // Sözlük doğrulaması: ek soyduktan sonra geriye kalan kök Turkçe bir kelime değilse soyma
          // (örn. "balık" → "lık" eki soyulursa "ba" kalır, sözlükte yok → soyma)
          // afterKok=true durumunda yeniStem boş olabilir (kök+suffix sıkı birleşim) → doğrulama atlanır.
          if (yeniStem.length > 0 && !TURKCE_KELIMELER.has(yeniStem)) {
            continue;
          }
          const { sol, sag } = PARCA_SUFFIX_MAP.get(suffix);
          // Başa ekle: soyma sağdan sola gidiyor, çıktı soldan sağa olacak
          suffixCellsFlat.unshift(sag);
          suffixCellsFlat.unshift(sol);
          stemKucuk = yeniStem;
          devam = true;
          break;
        }
      }
    }
  }

  // 5. Stem kısmını hece + normal harf ile işle
  //    stemKucuk, kucuk'un bir öneki (prefix) olduğundan stemKucuk[i] = kelime[i]
  const stemHucreler = [];
  let i = 0;
  const n = stemKucuk.length;
  while (i < n) {
    const kalanUzunluk = n - i;
    let eslesti = false;
    if (hece) {
      for (const { hece: heceStr, noktalar } of HECE_SORTED) {
        if (heceStr.length > kalanUzunluk) continue;
        if (stemKucuk.slice(i, i + heceStr.length) !== heceStr) continue;
        const kelimeSonuMu = i + heceStr.length === n;
        if (kelimeSonuMu && HECE_SON_YASAK.has(heceStr)) continue;
        stemHucreler.push(noktalar);
        i += heceStr.length;
        eslesti = true;
        break;
      }
    }
    if (!eslesti) {
      // Normal harf — orijinal büyük/küçük harf için kelime[i] kullan
      const origCh = kelime[i] ?? stemKucuk[i];
      const ust = origCh.toLocaleUpperCase('tr');
      const noktalar = HARF_TABLO.get(ust);
      if (noktalar) {
        if (opt.buyukHarfIsareti && origCh === ust && origCh !== origCh.toLocaleLowerCase('tr')) {
          stemHucreler.push(BUYUK_HARF_ISARETI);
        }
        stemHucreler.push(noktalar);
      } else {
        stemHucreler.push([]); // bilinmeyen karakter
      }
      i++;
    }
  }

  return [...stemHucreler, ...suffixCellsFlat];
}

/**
 * Metni kısaltma sistemi aktif olarak braille hücre dizisine çevirir.
 * @param {string} metin
 * @param {{ buyukHarfIsareti?: boolean, sayiIsareti?: boolean }} [opt]
 * @returns {{ hucreler: number[][], esleme: number[] }}
 */
export function metniBrailleyeCevirKisaltmali(metin, opt = {}) {
  const { buyukHarfIsareti = false, sayiIsareti = false,
          hece = true, birHarf = true, ikiHarf = true, kok = true, parca = true } = opt;
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
      const kel = tok.deger;
      const kucukKel = kel.toLocaleLowerCase('tr');
      // Tümü büyük? → çift [4,6] ekle, kelimeyi küçük olarak işle (per-letter [4,6] tetiklenmesin)
      const tumuBuyuk = buyukHarfIsareti && kelimeTumuBuyukMu(kel);
      if (tumuBuyuk) {
        ekle(BUYUK_HARF_ISARETI, -1);
        ekle(BUYUK_HARF_ISARETI, -1);
      }
      // İlk harfi büyük (tümü büyük değil): kısaltma yolu büyük/küçük ayrımı yapmadığı için
      // baş büyük harf işaretini burada ekleyip kelimeyi küçük hâliyle işle.
      const ilkHarfBuyuk = buyukHarfIsareti && !tumuBuyuk &&
        kel.length > 0 && kel[0] !== kucukKel[0];
      if (ilkHarfBuyuk) {
        ekle(BUYUK_HARF_ISARETI, -1);
      }
      const isleneKel = (tumuBuyuk || ilkHarfBuyuk) ? kucukKel : kel;
      const hucreleri = kelimeyiKisaltmayaCevir(isleneKel, { buyukHarfIsareti, sayiIsareti, hece, birHarf, ikiHarf, kok, parca });
      for (let hi = 0; hi < hucreleri.length; hi++) {
        ekle(hucreleri[hi], tok.idx);
      }
    }
  }

  return { hucreler, esleme };
}

