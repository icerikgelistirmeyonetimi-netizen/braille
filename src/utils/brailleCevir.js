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

import { HARFLER, RAKAMLAR, NOKTALAMA, RUMUZLU_IFADELER } from '../data/braille.js';
import { MATEMATIK_SEMBOLLER, SIRA_SAYISI_RAKAM_NOKTALARI } from '../data/matematik.js';

const HARF_TABLO = (() => {
  const m = new Map();
  for (const h of HARFLER) {
    m.set(h.harf, h.noktalar);
    m.set(h.harf.toLocaleLowerCase('tr'), h.noktalar);
  }
  return m;
})();

const RAKAM_TABLO = new Map(RAKAMLAR.map((r) => [r.rakam, r.noktalar]));
const SIRA_SAYISI_RAKAM_TABLO = new Map(
  Object.entries(SIRA_SAYISI_RAKAM_NOKTALARI).map(([rakam, noktalar]) => [rakam, noktalar]),
);
const NOKTA_TABLO = new Map(NOKTALAMA.map((n) => [n.isaret, n.noktalar]));
const MATEMATIK_GENEL_SEMBOL_ADLARI = new Set([
  'artı',
  'eksi',
  'çarpma',
  'bölme',
  'eşittir',
  'skaler çarpma',
  'artı eksi',
  'parantez açma',
  'parantez kapama',
  'kesir çizgisi',
  'yüzde',
  'küçüktür',
  'büyüktür',
  'küçük eşit',
  'büyük eşit',
  'eşit değildir',
  'denklik',
  'denk değildir',
]);
const EK_MATEMATIK_SEMBOLLER = [
  { ad: 've işareti', sembol: '&', hucreler: [[4], [1, 2, 3, 4, 6]] },
];
export const MATEMATIK_ISLEM_ISARETLERI = MATEMATIK_SEMBOLLER
  .filter((sembol) => MATEMATIK_GENEL_SEMBOL_ADLARI.has(sembol.ad))
  .map((sembol) => ({
    ad: sembol.ad,
    sembol: sembol.ad === 'denklik'
      ? '≡'
      : sembol.ad === 'denk değildir'
        ? '≢'
        : sembol.sembol,
    hucreler: sembol.hucreler,
  }))
  .concat(EK_MATEMATIK_SEMBOLLER);
const ISLEM_ISARETI_TABLO = new Map(
  MATEMATIK_ISLEM_ISARETLERI.map((isaret) => [isaret.sembol, isaret]),
);
ISLEM_ISARETI_TABLO.set('×', ISLEM_ISARETI_TABLO.get('x'));
ISLEM_ISARETI_TABLO.set('−', ISLEM_ISARETI_TABLO.get('-'));
const ISLEM_HUCRE_ESLESMELERI = MATEMATIK_ISLEM_ISARETLERI
  .map((isaret) => ({ ...isaret, anahtar: hucreDizisiAnahtari(isaret.hucreler) }))
  .sort((a, b) => b.hucreler.length - a.hucreler.length);
const SAYI_MODU_KORUYAN_MATEMATIK_ISARETLERI = new Set([
  'küçüktür',
  'büyüktür',
  'küçük eşit',
  'büyük eşit',
  'eşit değildir',
  'denklik',
  'denk değildir',
]);

const BUYUK_HARF_ISARETI = [6];      // MEB Türkçe Braille büyük harf işareti
const SAYI_ISARETI       = [3, 4, 5, 6];
const TEK_KUCUK_HARF_ISARETI = [5, 6];
const TARIH_AYIRMA_ISARETI = [3, 6];
const DUZELTME_YABANCI_HARF_ISARETI = [4];

const YABANCI_HARF_TABLO = new Map([
  ['Q', [1, 2, 3, 4, 5]],
  ['W', [2, 4, 5, 6]],
  ['X', [1, 3, 4, 6]],
]);

const DUZELTMELI_UNLU_TABLO = new Map([
  ['Â', 'A'],
  ['Î', 'İ'],
  ['Û', 'U'],
  ['Ô', 'O'],
  ['Ê', 'E'],
]);

const RUMUZLU_IFADE_SET = new Set(RUMUZLU_IFADELER.map((kayit) => kayit.kisaltma));

function buyukHarfKarakteriMi(ch) {
  return !!ch && ch === ch.toLocaleUpperCase('tr') && ch !== ch.toLocaleLowerCase('tr');
}

function oncekiBoslukDisiKarakter(metin, index) {
  let i = index - 1;
  while (i >= 0 && /\s/u.test(metin[i])) i--;
  return i >= 0 ? metin[i] : '';
}

function sonrakiBoslukDisiKarakter(metin, index) {
  let i = index + 1;
  while (i < metin.length && /\s/u.test(metin[i])) i++;
  return i < metin.length ? metin[i] : '';
}

function islenenEksiBaglamiMi(metin, index) {
  const onceki = oncekiBoslukDisiKarakter(metin, index);
  const sonraki = sonrakiBoslukDisiKarakter(metin, index);
  const kalan = metin.slice(index + 1);
  const esitlikVar = kalan.includes('=');
  if (!esitlikVar) return false;
  if (!onceki && /\d/u.test(sonraki)) return true;
  if (onceki === '(' && /\d/u.test(sonraki)) return true;
  return /\d|\)/u.test(onceki) && /\d|\(/u.test(sonraki);
}

function islenenCarpmaBaglamiMi(metin, index) {
  const onceki = oncekiBoslukDisiKarakter(metin, index);
  const sonraki = sonrakiBoslukDisiKarakter(metin, index);
  return /\d|\)/u.test(onceki) && /\d|\(/u.test(sonraki);
}

function hucreDizisiAnahtari(hucreler) {
  return hucreler.map((hucre) => noktalariAnahtara(hucre)).join('|');
}

function harfTablosundaMi(ch) {
  return !!ch && HARF_TABLO.has(ch.toLocaleUpperCase('tr'));
}

function harfliSayiEslesmesi(metin, index) {
  const ilk = metin[index];
  if (!RAKAM_TABLO.has(ilk) && !harfTablosundaMi(ilk)) return null;
  let j = index;
  let rakamVar = false;
  let harfVar = false;
  while (j < metin.length) {
    const ch = metin[j];
    if (RAKAM_TABLO.has(ch)) {
      rakamVar = true;
      j++;
      continue;
    }
    if (harfTablosundaMi(ch)) {
      harfVar = true;
      j++;
      continue;
    }
    break;
  }
  if (!rakamVar || !harfVar) return null;
  return metin.slice(index, j);
}

function harfliSayiEkle(metin, baslangic, ekle, sayiIsareti) {
  if (sayiIsareti) ekle(SAYI_ISARETI, -1);
  for (let offset = 0; offset < metin.length; offset++) {
    const ch = metin[offset];
    if (RAKAM_TABLO.has(ch)) {
      ekle(RAKAM_TABLO.get(ch), baslangic + offset);
      continue;
    }
    const ust = ch.toLocaleUpperCase('tr');
    const noktalar = HARF_TABLO.get(ust);
    if (!noktalar) continue;
    ekle(TEK_KUCUK_HARF_ISARETI, -1);
    if (buyukHarfKarakteriMi(ch)) ekle(BUYUK_HARF_ISARETI, -1);
    ekle(noktalar, baslangic + offset);
  }
}

function harfKarakteriMi(ch) {
  return !!ch && /\p{L}/u.test(ch);
}

function matematikIsaretininSoldanUzanimi(metin, isaretBaslangic) {
  const isaret = matematikIslemIsaretiMetinEslesmesi(metin, isaretBaslangic);
  if (!isaret) return null;
  return { uzunlukBirim: [...isaret.sembol].length, isaret };
}

function indeksMatematikIsaretininSonundatur(metin, sonIndeks) {
  for (let p = Math.max(0, sonIndeks - 4); p <= sonIndeks; p++) {
    const parca = matematikIsaretininSoldanUzanimi(metin, p);
    if (!parca) continue;
    const bitis = p + parca.uzunlukBirim - 1;
    if (bitis === sonIndeks) return true;
  }
  return false;
}

export function matematikIslemIsaretiMetinEslesmesi(metin, index, yorumTercihleri = {}) {
  const ch = metin[index];
  const yorumTercihi = yorumTercihleri?.[index];
  if (ch === '-' && yorumTercihi?.eksiTire) return null;
  if (ch === '-' && !islenenEksiBaglamiMi(metin, index)) return null;
  if (ch === 'x' && !islenenCarpmaBaglamiMi(metin, index)) return null;
  const isaret = ISLEM_ISARETI_TABLO.get(ch);
  if (!isaret) return null;
  return isaret;
}

export function matematikIslemIsaretiHucreEslesmesi(hucreler, index) {
  if (!Array.isArray(hucreler) || index < 0 || index >= hucreler.length) return null;
  for (const isaret of ISLEM_HUCRE_ESLESMELERI) {
    const parca = hucreler.slice(index, index + isaret.hucreler.length);
    if (parca.length !== isaret.hucreler.length) continue;
    if (hucreDizisiAnahtari(parca) === isaret.anahtar) return isaret;
  }
  return null;
}

function oncekiBosOlmayanHucre(hucreler, index) {
  let i = index - 1;
  while (i >= 0 && hucreler[i]?.length === 0) i--;
  return i >= 0 ? hucreler[i] : null;
}

function sonrakiBosOlmayanHucre(hucreler, index) {
  let i = index + 1;
  while (i < hucreler.length && hucreler[i]?.length === 0) i++;
  return i < hucreler.length ? hucreler[i] : null;
}

function matematikOperandHucreMi(hucre) {
  if (!hucre) return false;
  return !!(
    sayiIsaretiMi(hucre)
    || hucreyiRakamayap(hucre)
    || hucreyiSiraSayisiRakaminaCevir(hucre)
    || tekKucukHarfIsaretiMi(hucre)
    || buyukHarfIsaretiMi(hucre)
  );
}

function tekHucreliMatematikSembolBaglamiMi(isaret, hucreler, index) {
  const onceki = oncekiBosOlmayanHucre(hucreler, index);
  const sonraki = sonrakiBosOlmayanHucre(hucreler, index);
  if (isaret.hucreler.length !== 1) return true;
  if (isaret.ad === 'yüzde') return sayiIsaretiMi(sonraki);
  if (isaret.ad === 'parantez açma') {
    return !!(
      sayiIsaretiMi(sonraki)
      || tekKucukHarfIsaretiMi(sonraki)
      || buyukHarfIsaretiMi(sonraki)
    );
  }
  if (isaret.ad === 'parantez kapama') return matematikOperandHucreMi(onceki);
  if (isaret.ad === 'kesir çizgisi') {
    return matematikOperandHucreMi(onceki) && matematikOperandHucreMi(sonraki);
  }
  if (
    isaret.ad === 'küçüktür'
    || isaret.ad === 'büyüktür'
    || isaret.ad === 'denklik'
  ) {
    return matematikOperandHucreMi(onceki) && matematikOperandHucreMi(sonraki);
  }
  return true;
}

export function matematikSembolHucreEslesmesi(hucreler, index) {
  const isaret = matematikIslemIsaretiHucreEslesmesi(hucreler, index);
  if (!isaret) return null;
  if (!tekHucreliMatematikSembolBaglamiMi(isaret, hucreler, index)) return null;
  return isaret;
}

export function matematikIslemIsaretiHucreKapsami(hucreler, index) {
  for (let baslangic = Math.max(0, index - 2); baslangic <= index; baslangic++) {
    const isaret = matematikSembolHucreEslesmesi(hucreler, baslangic);
    if (!isaret) continue;
    const bitis = baslangic + isaret.hucreler.length;
    if (index >= baslangic && index < bitis) return { ...isaret, baslangic, bitis };
  }
  return null;
}

export function matematikIsaretiSayiModunuKorurMu(isaret) {
  return !!isaret && SAYI_MODU_KORUYAN_MATEMATIK_ISARETLERI.has(isaret.ad);
}

function duzeltmeliHarfBilgisi(ch) {
  if (!ch) return null;
  const ust = ch.toLocaleUpperCase('tr');
  if (HARF_TABLO.has(ust)) return null;
  if (YABANCI_HARF_TABLO.has(ust)) {
    return { harf: ust, noktalar: YABANCI_HARF_TABLO.get(ust), yabanci: true };
  }
  if (DUZELTMELI_UNLU_TABLO.has(ust)) {
    const taban = DUZELTMELI_UNLU_TABLO.get(ust);
    return { harf: taban, noktalar: HARF_TABLO.get(taban), duzeltme: true };
  }
  const sade = ch.normalize('NFD').replace(/\p{M}/gu, '');
  if (sade && sade !== ch) {
    const sadeUst = sade.toLocaleUpperCase('tr');
    if (HARF_TABLO.has(sadeUst)) {
      return { harf: sadeUst, noktalar: HARF_TABLO.get(sadeUst), yabanci: true };
    }
    if (YABANCI_HARF_TABLO.has(sadeUst)) {
      return { harf: sadeUst, noktalar: YABANCI_HARF_TABLO.get(sadeUst), yabanci: true };
    }
  }
  return null;
}

function harfMi(ch) {
  return !!ch && (HARF_TABLO.has(ch.toLocaleUpperCase('tr')) || duzeltmeliHarfBilgisi(ch) !== null);
}

function tekHarfKullanimiMi(metin, index) {
  if (!harfMi(metin[index])) return false;
  return !harfMi(metin[index - 1]) && !harfMi(metin[index + 1]);
}

function tarihParcasiGecerliMi(parcalar) {
  const sayi = (deger) => Number.parseInt(deger, 10);
  const aralikta = (deger, min, max) => {
    const n = sayi(deger);
    return Number.isInteger(n) && n >= min && n <= max;
  };
  const [ilk, orta, son] = parcalar;
  const gunAyYil = ilk.length <= 2 && orta.length <= 2 && (son.length === 2 || son.length === 4)
    && aralikta(ilk, 1, 31) && aralikta(orta, 1, 12);
  const yilAyGun = ilk.length === 4 && orta.length <= 2 && son.length <= 2
    && aralikta(orta, 1, 12) && aralikta(son, 1, 31);
  return gunAyYil || yilAyGun;
}

export function tarihYazimiEslesmesi(metin, index) {
  if (index > 0 && /[\d./-]/u.test(metin[index - 1])) return null;
  const kalan = metin.slice(index);
  const desenler = [
    /^(\d{1,2})([./-])(\d{1,2})\2(\d{2}|\d{4})(?!\d|[/-]|\.\d)/u,
    /^(\d{4})([./-])(\d{1,2})\2(\d{1,2})(?!\d|[/-]|\.\d)/u,
  ];
  for (const desen of desenler) {
    const eslesme = kalan.match(desen);
    if (eslesme && tarihParcasiGecerliMi([eslesme[1], eslesme[3], eslesme[4]])) {
      return eslesme[0];
    }
  }
  return null;
}

function tarihYazimiEkle(tarih, baslangic, ekle, sayiIsareti) {
  if (sayiIsareti) ekle(SAYI_ISARETI, -1);
  for (let offset = 0; offset < tarih.length; offset++) {
    const ch = tarih[offset];
    if (RAKAM_TABLO.has(ch)) ekle(RAKAM_TABLO.get(ch), baslangic + offset);
    else ekle(TARIH_AYIRMA_ISARETI, baslangic + offset);
  }
}

function rumuzluIfadeMi(kelime) {
  const chars = [...(kelime || '')];
  if (chars.length < 2 || !RUMUZLU_IFADE_SET.has(kelime)) return false;
  return chars.every((ch) => harfMi(ch) && ch === ch.toLocaleUpperCase('tr') && ch !== ch.toLocaleLowerCase('tr'));
}

function rumuzluIfadeEslesmesi(metin, index) {
  if (harfMi(metin[index - 1])) return null;
  let bitis = index;
  while (harfMi(metin[bitis])) bitis++;
  const kelime = metin.slice(index, bitis);
  return rumuzluIfadeMi(kelime) ? kelime : null;
}

function rumuzluIfadeEkle(kelime, baslangic, ekle) {
  let offset = 0;
  for (const ch of kelime) {
    ekle(BUYUK_HARF_ISARETI, -1);
    const duzeltmeli = duzeltmeliHarfBilgisi(ch);
    if (duzeltmeli) {
      ekle(DUZELTME_YABANCI_HARF_ISARETI, -1);
      ekle(duzeltmeli.noktalar, baslangic + offset);
    } else {
      ekle(HARF_TABLO.get(ch.toLocaleUpperCase('tr')), baslangic + offset);
    }
    offset += ch.length;
  }
}

/**
 * Bir kelimenin tüm harflerinin büyük olup olmadığını döner.
 * En az 2 harf içermeli ve tüm harf karakterleri büyük olmalı.
 * (Kelime ≥2 büyük harften oluştuğunda "Tümü Büyük İşareti" — iki yan yana [6] —
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

/** @param {number} basMutlak @param {string} kesit */
function ciftRakamIlkIndeksleri(basMutlak, kesit) {
  const ilkler = [];
  let o = 0;
  while (o < kesit.length) {
    while (o < kesit.length && !/\d/u.test(kesit[o])) o++;
    if (o >= kesit.length) break;
    ilkler.push(basMutlak + o);
    while (o < kesit.length && /\d/u.test(kesit[o])) o++;
  }
  return ilkler;
}

/**
 * MEB 1.2.5 çift rakam işareti: üç veya daha fazla ardışık sayı (virgülle veya dikey satırlarda).
 * Her sayının İLK rakam indeksine göre işaret rolleri atanır (ara rakamlarda rol yok).
 * @returns {Map<number, 'ilk_cift' | 'orta_isaretsiz' | 'son_tek'>}
 */
function ciftRakamIsaretiPlaniOlustur(metin) {
  /** @type {Map<number, 'ilk_cift' | 'orta_isaretsiz' | 'son_tek'>} */
  const plan = new Map();
  if (!metin) return plan;
  const yatayAraliklar = [];
  const yatayRe = /\d+(?:\s*,\s*\d+){2,}/gu;
  /** @type {RegExpExecArray | null} */
  let ym = null;
  while ((ym = yatayRe.exec(metin)) !== null) {
    const tam = ym[0];
    const bas = ym.index;
    yatayAraliklar.push([bas, bas + tam.length]);
    const ilkler = ciftRakamIlkIndeksleri(bas, tam);
    if (ilkler.length < 3) continue;
    plan.set(ilkler[0], 'ilk_cift');
    for (let u = 1; u < ilkler.length - 1; u++) plan.set(ilkler[u], 'orta_isaretsiz');
    plan.set(ilkler[ilkler.length - 1], 'son_tek');
  }
  const aralikKapsiyor = (konumIndeks) =>
    yatayAraliklar.some(([a, b]) => konumIndeks >= a && konumIndeks < b);
  /** @type {{ ilkRakam: number }[]} */
  let dikeyTampon = [];
  const flushDikeyTampon = () => {
    if (dikeyTampon.length < 3) {
      dikeyTampon = [];
      return;
    }
    const cakisiyor = dikeyTampon.some((k) => aralikKapsiyor(k.ilkRakam));
    if (!cakisiyor) {
      const ilklerDikey = dikeyTampon.map((x) => x.ilkRakam);
      for (let gi = 0; gi < ilklerDikey.length; gi++) {
        const idx = ilklerDikey[gi];
        if (plan.has(idx)) continue;
        if (gi === 0) plan.set(idx, 'ilk_cift');
        else if (gi === ilklerDikey.length - 1) plan.set(idx, 'son_tek');
        else plan.set(idx, 'orta_isaretsiz');
      }
    }
    dikeyTampon = [];
  };
  let konum = 0;
  while (konum < metin.length) {
    const satirSonu = metin.indexOf('\n', konum);
    const kesitSonu = satirSonu === -1 ? metin.length : satirSonu;
    const satHam = metin.slice(konum, kesitSonu);
    const satir = satHam.replace(/\r+$/, '');
    const satirBasi = konum;
    /** @type {RegExpMatchArray | null} */
    const mSat = satir.match(/^\s*(\d+)\s*$/u);
    if (mSat) {
      const ilkMutlak = satirBasi + satir.indexOf(mSat[1][0]);
      dikeyTampon.push({ ilkRakam: ilkMutlak });
    } else {
      flushDikeyTampon();
    }
    if (satirSonu === -1) break;
    konum = satirSonu + 1;
  }
  flushDikeyTampon();
  return plan;
}

/**
 * Bu virgül, en az üç rakam grubunu ayıran liste ifadesine mi ait? (Çift rakam işareti kuralına giren sıra.)
 * Ondalık virgülle karışmasın diye önce liste tarafı seçilir.
 */
function cokluSayiListesiKommasiMi(metin, commaIdx) {
  if (!metin || commaIdx < 0 || commaIdx >= metin.length || metin[commaIdx] !== ',') return false;
  const desen = /\d+(?:\s*,\s*\d+){2,}/gu;
  /** @type {RegExpExecArray | null} */
  let gm = null;
  while ((gm = desen.exec(metin)) !== null) {
    const parca = gm[0];
    const bas = gm.index;
    for (let u = 0; u < parca.length; u++) {
      if (parca[u] === ',' && bas + u === commaIdx) return true;
    }
  }
  return false;
}

/**
 * Türkçe Braille: ondalık virgülle kesir yazımında virgülden sonra ikinci bir sayı işareti yazılmaz.
 * Virgül iki rakam grubu arasındaysa ve üçlü/çoklu sayı listesine ait değilse ondalık ayraçtır.
 */
export function ondalikVirguluMi(metin, commaIdx, yorumTercihleri = {}) {
  if (!metin || commaIdx < 0 || commaIdx >= metin.length || metin[commaIdx] !== ',') return false;
  const yorumTercihi = yorumTercihleri?.[commaIdx];
  if (yorumTercihi?.ondalikVirgulNormal) return false;
  if (cokluSayiListesiKommasiMi(metin, commaIdx)) return false;
  let k = commaIdx - 1;
  while (k >= 0 && /\s/u.test(metin[k])) k--;
  let sagIlk = commaIdx + 1;
  while (sagIlk < metin.length && /\s/u.test(metin[sagIlk])) sagIlk++;
  if (k < 0 || sagIlk >= metin.length || !/\d/u.test(metin[k]) || !/\d/u.test(metin[sagIlk])) return false;
  let L = 0;
  while (k >= 0 && /\d/u.test(metin[k])) {
    L++;
    k--;
  }
  let R = 0;
  let kk = sagIlk;
  while (kk < metin.length && /\d/u.test(metin[kk])) {
    R++;
    kk++;
  }
  if (L < 1 || R < 1) return false;
  return true;
}

function bolukluSayiEslesmesi(metin, index) {
  if (!metin || index < 0 || index >= metin.length || !/\d/u.test(metin[index])) return null;
  if (index > 0 && /[\d.]/u.test(metin[index - 1])) return null;
  const kalan = metin.slice(index);
  const eslesme = kalan.match(/^\d{1,3}(?:\.\d{3})+(?:,\d+)?(?![\d.])/u);
  return eslesme ? eslesme[0] : null;
}

function bolukluSayiEkle(sayiMetni, baslangic, ekle, sayiIsareti) {
  if (sayiIsareti) ekle(SAYI_ISARETI, -1);
  for (let offset = 0; offset < sayiMetni.length; offset++) {
    const ch = sayiMetni[offset];
    if (RAKAM_TABLO.has(ch)) {
      ekle(RAKAM_TABLO.get(ch), baslangic + offset);
      continue;
    }
    if (ch === '.') {
      ekle([3], baslangic + offset);
      continue;
    }
    if (ch === ',') ekle([2], baslangic + offset);
  }
}

/** Yazılışta kesmeden sonra gelen sıra eki uzunluğu (inci, nci vb.). */
function siraSayisiSonrakiEkUzunlugu(metin, kesmeSonrasi) {
  if (kesmeSonrasi < 0 || kesmeSonrasi >= metin.length) return 0;
  const parca = metin.slice(kesmeSonrasi);
  const m = parca.match(/^(inci|ıncı|üncü|uncu|nci|ncı)/iu);
  return m ? m[0].length : 0;
}

function sayiBagIfadesiEslesmesi(metin, index) {
  if (!RAKAM_TABLO.has(metin[index])) return null;
  if (index > 1 && metin[index - 1] === ',' && /\d/u.test(metin[index - 2])) return null;
  const satirSonu = metin.indexOf('\n', index);
  const sinir = satirSonu === -1 ? metin.length : satirSonu;
  const parca = metin.slice(index, sinir);
  const eslesme = parca.match(/^(\d+)(\s*[-\u2013\u2014]\s*)(\d+)/u);
  if (!eslesme) return null;
  let sonraki = index + eslesme[0].length;
  while (sonraki < sinir && /\s/u.test(metin[sonraki])) sonraki++;
  if (metin[sonraki] === '=') return null;
  const bagIndeksi = index + eslesme[1].length + eslesme[2].search(/[-\u2013\u2014]/u);
  return {
    ilk: eslesme[1],
    ikinci: eslesme[3],
    uzunluk: eslesme[0].length,
    bagIndeksi,
  };
}

function sayiBagIfadesiEkle(eslesme, baslangic, ekle, sayiIsareti) {
  if (sayiIsareti) ekle(SAYI_ISARETI, -1);
  for (let i = 0; i < eslesme.ilk.length; i++) {
    ekle(RAKAM_TABLO.get(eslesme.ilk[i]), baslangic + i);
  }
  ekle(TARIH_AYIRMA_ISARETI, eslesme.bagIndeksi);
  const ikinciBaslangic = baslangic + eslesme.uzunluk - eslesme.ikinci.length;
  for (let i = 0; i < eslesme.ikinci.length; i++) {
    ekle(RAKAM_TABLO.get(eslesme.ikinci[i]), ikinciBaslangic + i);
  }
}

/**
 * @param {string} metin
 * @param {{ buyukHarfIsareti?: boolean, sayiIsareti?: boolean, tekHarfIsareti?: boolean }} [opt]
 * @returns {{ hucreler: number[][], esleme: number[] }}
 *   hucreler: braille hücre dizisi
 *   esleme:   her hücrenin metindeki kaynak karakterinin indeksi (-1 = işaret hücresi)
 */
export function metniBrailleyeCevir(metin, opt = {}) {
  const {
    buyukHarfIsareti = false,
    sayiIsareti = false,
    tekHarfIsareti = buyukHarfIsareti || sayiIsareti,
    yorumTercihleri = {},
  } = opt;
  const hucreler = [];
  const esleme = [];

  const ekle = (noktalar, kaynak) => {
    hucreler.push(noktalar);
    esleme.push(kaynak);
  };

  let sayiModu = false;
  let tirnakAcik = false; // düz " için açma/kapama toggle
  let tumuBuyukKalan = 0; // bu sayıya kadar gelen harfler için per-letter [6] verme
  const ciftPlani = sayiIsareti ? ciftRakamIsaretiPlaniOlustur(metin) : new Map();

  for (let i = 0; i < metin.length; i++) {
    const ch = metin[i];

    const tarih = tarihYazimiEslesmesi(metin, i);
    if (tarih) {
      tarihYazimiEkle(tarih, i, ekle, sayiIsareti);
      sayiModu = false;
      tumuBuyukKalan = 0;
      i += tarih.length - 1;
      continue;
    }

    const sayiBag = sayiBagIfadesiEslesmesi(metin, i);
    if (sayiBag) {
      sayiBagIfadesiEkle(sayiBag, i, ekle, sayiIsareti);
      sayiModu = true;
      tumuBuyukKalan = 0;
      i += sayiBag.uzunluk - 1;
      continue;
    }

    const bolukluSayi = bolukluSayiEslesmesi(metin, i);
    if (bolukluSayi) {
      bolukluSayiEkle(bolukluSayi, i, ekle, sayiIsareti);
      sayiModu = true;
      tumuBuyukKalan = 0;
      i += bolukluSayi.length - 1;
      continue;
    }

    const harfliSayi = harfliSayiEslesmesi(metin, i);
    if (harfliSayi) {
      harfliSayiEkle(harfliSayi, i, ekle, sayiIsareti);
      sayiModu = false;
      tumuBuyukKalan = 0;
      i += harfliSayi.length - 1;
      continue;
    }

    if (buyukHarfIsareti) {
      const rumuz = rumuzluIfadeEslesmesi(metin, i);
      if (rumuz) {
        rumuzluIfadeEkle(rumuz, i, ekle);
        sayiModu = false;
        tumuBuyukKalan = 0;
        i += rumuz.length - 1;
        continue;
      }
    }

    const islemIsareti = matematikIslemIsaretiMetinEslesmesi(metin, i, yorumTercihleri);
    if (islemIsareti) {
      for (const hucre of islemIsareti.hucreler) ekle(hucre, i);
      sayiModu = sayiModu && matematikIsaretiSayiModunuKorurMu(islemIsareti);
      tumuBuyukKalan = 0;
      continue;
    }

    // Sayılar — sıra sayısı (MEB 1.2.6): tek sayı işareti + “indirgenmiş” rakam hücreleri; yazıda 12., 12’nci vb.
    if (RAKAM_TABLO.has(ch)) {
      let j = i;
      while (j < metin.length && RAKAM_TABLO.has(metin[j])) j++;
      const noktaOrdinal =
        j < metin.length
        && metin[j] === '.'
        && (j + 1 >= metin.length || !RAKAM_TABLO.has(metin[j + 1]));
      const kesmeChr =
        j < metin.length && (metin[j] === "'" || metin[j] === '\u2019');
      const kesmeSonrasiEkUzun =
        kesmeChr ? siraSayisiSonrakiEkUzunlugu(metin, j + 1) : 0;
      const siraSayisiMi = noktaOrdinal || kesmeSonrasiEkUzun > 0;
      if (siraSayisiMi) {
        if (sayiIsareti && !sayiModu) {
          ekle(SAYI_ISARETI, -1);
        }
        for (let k = i; k < j; k++) {
          const nokta = SIRA_SAYISI_RAKAM_TABLO.get(metin[k]);
          if (nokta) ekle(nokta, k);
        }
        sayiModu = false;
        tumuBuyukKalan = 0;
        if (noktaOrdinal) {
          i = j;
          continue;
        }
        i = j - 1;
        continue;
      }
      const rol = ciftPlani.get(i);
      if (sayiIsareti) {
        if (rol === 'ilk_cift') {
          ekle(SAYI_ISARETI, -1);
          ekle(SAYI_ISARETI, -1);
        } else if (rol === 'son_tek') {
          if (!sayiModu) ekle(SAYI_ISARETI, -1);
        } else if (rol !== 'orta_isaretsiz') {
          if (!sayiModu) ekle(SAYI_ISARETI, -1);
        }
      }
      ekle(RAKAM_TABLO.get(ch), i);
      sayiModu = true;
      continue;
    }
    const ondalikKommayiKoru = ch === ',' && sayiModu && ondalikVirguluMi(metin, i, yorumTercihleri);
    if (!ondalikKommayiKoru) {
      sayiModu = false;
    }

    if (ch === '^') {
      ekle(DUZELTME_YABANCI_HARF_ISARETI, i);
      tumuBuyukKalan = 0;
      continue;
    }

    const duzeltmeli = duzeltmeliHarfBilgisi(ch);
    if (duzeltmeli) {
      if (tekHarfIsareti && tekHarfKullanimiMi(metin, i)) {
        ekle(TEK_KUCUK_HARF_ISARETI, -1);
      }
      if (buyukHarfIsareti && buyukHarfKarakteriMi(ch)) {
        ekle(BUYUK_HARF_ISARETI, -1);
      }
      ekle(DUZELTME_YABANCI_HARF_ISARETI, -1);
      ekle(duzeltmeli.noktalar, i);
      tumuBuyukKalan = 0;
      continue;
    }

    // Harfler (Türkçe destekli)
    const ust = ch.toLocaleUpperCase('tr');
    if (HARF_TABLO.has(ust)) {
      if (tekHarfIsareti && tekHarfKullanimiMi(metin, i)) {
        ekle(TEK_KUCUK_HARF_ISARETI, -1);
      }
      // Kelime başında ALL CAPS kontrolü → çift [6]
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

const SIRA_SAYISI_RAKAM_TERS = (() => {
  const m = new Map();
  for (const [rakam, nokta] of SIRA_SAYISI_RAKAM_TABLO) {
    m.set(noktalariAnahtara(nokta), rakam);
  }
  return m;
})();

const NOKTA_TERS = (() => {
  const m = new Map();
  for (const n of NOKTALAMA) m.set(noktalariAnahtara(n.noktalar), n.isaret);
  return m;
})();

const ANAHTAR_BUYUK = noktalariAnahtara(BUYUK_HARF_ISARETI);
const ANAHTAR_SAYI  = noktalariAnahtara(SAYI_ISARETI);
const ANAHTAR_TEK_KUCUK_HARF = noktalariAnahtara(TEK_KUCUK_HARF_ISARETI);
const ANAHTAR_TARIH_AYIRMA = noktalariAnahtara(TARIH_AYIRMA_ISARETI);
const ANAHTAR_DUZELTME_YABANCI_HARF = noktalariAnahtara(DUZELTME_YABANCI_HARF_ISARETI);

const YABANCI_HARF_TERS = (() => {
  const m = new Map();
  for (const [harf, noktalar] of YABANCI_HARF_TABLO) m.set(noktalariAnahtara(noktalar), harf.toLocaleLowerCase('tr'));
  return m;
})();

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

/** Sıra sayısı (indirgenmiş) rakam hücresini rakama çevirir (MEB 1.2.6). */
export function hucreyiSiraSayisiRakaminaCevir(noktalar) {
  const k = noktalariAnahtara(noktalar);
  return SIRA_SAYISI_RAKAM_TERS.has(k) ? SIRA_SAYISI_RAKAM_TERS.get(k) : null;
}

/** Sıra sayısı noktalı yazımda (12.) son sıra rakamı etiketine '.' ekler; kesmeli sıra yazımda eklenmez. */
export function siraSayisiSonRakamEtiketiNoktaEki(anlam, hucreIdx, hucreler, kaynak, esleme) {
  if (!anlam || anlam.tip !== 'rakam' || typeof hucreIdx !== 'number' || !Array.isArray(hucreler)) return '';
  if (!/^Sıra sayısı/u.test(anlam.baslik)) return '';
  const ilkIdx = Array.isArray(esleme) ? esleme[hucreIdx] : null;
  if (typeof kaynak === 'string' && typeof ilkIdx === 'number' && ilkIdx >= 0) {
    const ch = kaynak[ilkIdx + 1];
    if (ch === '.') return '.';
    if (ch === "'" || ch === '\u2019') return '';
  }
  const sonHucre = hucreIdx + 1 < hucreler.length ? hucreler[hucreIdx + 1] : null;
  if (!sonHucre || sonHucre.length === 0) return '.';
  if (hucreyiSiraSayisiRakaminaCevir(sonHucre)) return '';
  if (noktalariAnahtara(sonHucre) === '3') return '';
  return '.';
}

export function buyukHarfIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_BUYUK;
}
export function sayiIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_SAYI;
}

export function tekKucukHarfIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_TEK_KUCUK_HARF;
}

export function tarihAyirmaIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_TARIH_AYIRMA;
}

export function duzeltmeYabanciHarfIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === ANAHTAR_DUZELTME_YABANCI_HARF;
}

export function duzeltmeliHucreyiMetneCevir(noktalar) {
  const k = noktalariAnahtara(noktalar);
  if (YABANCI_HARF_TERS.has(k)) return YABANCI_HARF_TERS.get(k);
  const harf = HARF_TERS.get(k);
  if (!harf) return null;
  switch (harf) {
    case 'A': return 'â';
    case 'İ': return 'î';
    case 'I': return 'î';
    case 'U': return 'û';
    case 'O': return 'ô';
    case 'E': return 'ê';
    default: return harf.toLocaleLowerCase('tr');
  }
}

export function tarihHucreAraligi(hucreler, index) {
  if (!Array.isArray(hucreler) || index < 0 || index >= hucreler.length) return null;

  const oku = (baslangic) => {
    if (!sayiIsaretiMi(hucreler[baslangic])) return null;
    const parcalar = [];
    let parca = '';
    let ayiriciSayisi = 0;
    let i = baslangic + 1;

    while (i < hucreler.length) {
      const rakam = hucreyiRakamayap(hucreler[i]);
      if (rakam) {
        parca += rakam;
        i++;
        continue;
      }
      if (tarihAyirmaIsaretiMi(hucreler[i]) && parca.length > 0 && ayiriciSayisi < 2) {
        parcalar.push(parca);
        parca = '';
        ayiriciSayisi++;
        i++;
        continue;
      }
      break;
    }
    if (parca.length > 0) parcalar.push(parca);
    if (parcalar.length !== 3 || ayiriciSayisi !== 2) return null;
    if (!tarihParcasiGecerliMi(parcalar)) return null;
    return { baslangic, bitis: i, parcalar };
  };

  for (let baslangic = index; baslangic >= 0; baslangic--) {
    const hucre = hucreler[baslangic];
    if (!hucre || hucre.length === 0) break;
    if (sayiIsaretiMi(hucre)) {
      const aralik = oku(baslangic);
      return aralik && index >= aralik.baslangic && index < aralik.bitis ? aralik : null;
    }
    if (!hucreyiRakamayap(hucre) && !tarihAyirmaIsaretiMi(hucre)) break;
  }
  return null;
}

// ─── Kısaltmalı dönüştürme ──────────────────────────────────────────────────

import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
} from '../data/braille.js';

// Kelime sonunda kullanılamayan hece kısaltmaları (MEB kılavuzu)
const HECE_SON_YASAK = new Set(['ba', 'be', 'bu', 'ka', 'ha', 'ki']);
const TEK_HARF_EK_AYIRMA_ISARETI = [3];
const TURKCE_UNLULER = new Set(['a', 'e', 'ı', 'i', 'o', 'ö', 'u', 'ü']);
const YUMUSAYAN_IKI_HARFLI_KELIMELER = new Set([
  'cevap',
  'çocuk',
  'çeşit',
  'kitap',
  'küçük',
  'sebep',
  'sıcak',
  'soğuk',
  'toprak',
]);
const YUMUSAMA_ADAYLARI = {
  p: ['b'],
  ç: ['c'],
  t: ['d'],
  k: ['ğ', 'g'],
};

function _sonHarfiYumusat(kelime) {
  if (!kelime) return kelime;
  const chars = [...kelime];
  const son = chars[chars.length - 1];
  const kucukSon = son.toLocaleLowerCase('tr');
  const yumusak = { p: 'b', ç: 'c', t: 'd', k: 'ğ' }[kucukSon];
  if (!yumusak) return kelime;
  chars[chars.length - 1] = son === son.toLocaleUpperCase('tr') && son !== son.toLocaleLowerCase('tr')
    ? yumusak.toLocaleUpperCase('tr')
    : yumusak;
  return chars.join('');
}

export function ikiHarfliKisaltmaPrefixEslesmesi(kaynakKelime, kisaltmaKelime) {
  const kaynak = (kaynakKelime || '').toLocaleLowerCase('tr');
  const kok = (kisaltmaKelime || '').toLocaleLowerCase('tr');
  if (!kaynak || !kok || kaynak.length <= kok.length) return null;
  if (kaynak.startsWith(kok)) return { kalan: kaynak.slice(kok.length), yumusama: false };
  if (!YUMUSAYAN_IKI_HARFLI_KELIMELER.has(kok)) return null;
  const son = kok[kok.length - 1];
  const adaylar = YUMUSAMA_ADAYLARI[son] || [];
  for (const yumusak of adaylar) {
    const yumusamisKok = kok.slice(0, -1) + yumusak;
    if (!kaynak.startsWith(yumusamisKok)) continue;
    const kalan = kaynak.slice(yumusamisKok.length);
    if (kalan && TURKCE_UNLULER.has(kalan[0])) {
      return { kalan, yumusama: true };
    }
  }
  return null;
}

export function ikiHarfliKisaltmaOkunusunuYumusat(kelime, sonrakiMetin) {
  const kok = (kelime || '').toLocaleLowerCase('tr');
  const sonrakiIlk = (sonrakiMetin || '')[0]?.toLocaleLowerCase('tr');
  if (!YUMUSAYAN_IKI_HARFLI_KELIMELER.has(kok) || !TURKCE_UNLULER.has(sonrakiIlk)) {
    return kelime;
  }
  return _sonHarfiYumusat(kelime);
}

function _yorOncesiKokUnlusu(kokKelime) {
  const chars = [...(kokKelime || '')];
  const son = chars[chars.length - 1]?.toLocaleLowerCase('tr');
  if (son !== 'a' && son !== 'e') return null;
  let oncekiUnlu = null;
  for (let i = chars.length - 2; i >= 0; i--) {
    const ch = chars[i].toLocaleLowerCase('tr');
    if (TURKCE_UNLULER.has(ch)) { oncekiUnlu = ch; break; }
  }
  if (son === 'a') return oncekiUnlu === 'o' || oncekiUnlu === 'u' ? 'u' : 'ı';
  return oncekiUnlu === 'ö' || oncekiUnlu === 'ü' ? 'ü' : 'i';
}

export function kelimeKokuKisaltmaPrefixEslesmesi(kaynakKelime, kokKelime) {
  const kaynak = (kaynakKelime || '').toLocaleLowerCase('tr');
  const kok = (kokKelime || '').toLocaleLowerCase('tr');
  if (!kaynak || !kok || kaynak.length <= kok.length) return null;
  if (kaynak.startsWith(kok)) return { kalan: kaynak.slice(kok.length), yorDonusumu: false };
  const yorUnlusu = _yorOncesiKokUnlusu(kok);
  if (!yorUnlusu) return null;
  const donusmusKok = kok.slice(0, -1) + yorUnlusu;
  if (!kaynak.startsWith(donusmusKok)) return null;
  const kalan = kaynak.slice(donusmusKok.length);
  if (!kalan.startsWith('yor')) return null;
  return { kalan, yorDonusumu: true };
}

export function kelimeKokuOkunusunuYorIcinDuzelt(kokKelime, sonrakiMetin) {
  const sonraki = (sonrakiMetin || '').toLocaleLowerCase('tr');
  if (!sonraki.startsWith('yor')) return kokKelime;
  const yorUnlusu = _yorOncesiKokUnlusu(kokKelime);
  if (!yorUnlusu) return kokKelime;
  const son = kokKelime[kokKelime.length - 1];
  const yeniUnlu = son === son?.toLocaleUpperCase('tr') && son !== son?.toLocaleLowerCase('tr')
    ? yorUnlusu.toLocaleUpperCase('tr')
    : yorUnlusu;
  return kokKelime.slice(0, -1) + yeniUnlu;
}

// Arama tabloları
const KELIME_KISALTMA_MAP = new Map(
  KELIME_KISALTMALARI.map((k) => [k.kelime.toLocaleLowerCase('tr'), k.noktalar])
);
const TEK_HARF_PREFIX_SORTED = [...KELIME_KISALTMALARI]
  .map((k) => ({ ...k, kucuk: k.kelime.toLocaleLowerCase('tr') }))
  .sort((a, b) => b.kucuk.length - a.kucuk.length);
const IKI_HARFLI_MAP = new Map(
  IKI_HARFLI_KISALTMALAR.map((k) => [k.kelime.toLocaleLowerCase('tr'), [k.sol, k.sag]])
);
const IKI_HARF_PREFIX_SORTED = [...IKI_HARFLI_KISALTMALAR]
  .map((k) => ({ ...k, kucuk: k.kelime.toLocaleLowerCase('tr') }))
  .sort((a, b) => b.kucuk.length - a.kucuk.length);
// Hece kısaltmalarını uzundan kısaya sıralı tablo (en uzun eşleşme önce)
const HECE_SORTED = [...HECE_KISALTMALARI].sort((a, b) => b.hece.length - a.hece.length);

// Kök kısaltmaları: uzundan kısaya sıralı (en uzun eşleşme önce)
const KOK_SORTED = [...KELIME_KOKU_KISALTMALARI].sort((a, b) => b.kelime.length - a.kelime.length);

const KOK_BAGLAYICILAR = ['', 'a', 'e', 'ı', 'i', 'u', 'ü', 'ya', 'ye', 'yı', 'yi', 'yu', 'yü'];

const KISALTMA_TEK_TERS = new Map(
  KELIME_KISALTMALARI.map((k) => [noktalariAnahtara(k.noktalar), k.kelime])
);
const KISALTMA_IKI_TERS = (() => {
  const m = new Map();
  for (const k of IKI_HARFLI_KISALTMALAR) {
    m.set(`${noktalariAnahtara(k.sol)}|${noktalariAnahtara(k.sag)}`, k.kelime);
  }
  return m;
})();
const HECE_TERS_KISALTMA = new Map(
  HECE_KISALTMALARI.map((h) => [noktalariAnahtara(h.noktalar), h.hece])
);
const KOK_SAG_TERS = new Map(
  KELIME_KOKU_KISALTMALARI.map((k) => [noktalariAnahtara(k.sag), k])
);
const PARCA_TERS = new Map(
  KELIME_PARCASI_KISALTMALARI.map((p) => [`${noktalariAnahtara(p.sol)}|${noktalariAnahtara(p.sag)}`, p])
);

const ARKA_UNLU = new Set(['a', 'ı', 'o', 'u']);
const ON_UNLU = new Set(['e', 'i', 'ö', 'ü']);
const YUVARLAK_UNLU = new Set(['o', 'ö', 'u', 'ü']);
const TUM_UNLU = new Set([...ARKA_UNLU, ...ON_UNLU]);

function _unluUyumuSec(ekler, oncekiMetin) {
  const variants = ekler.split(',').map((s) => s.trim());
  if (variants.length <= 1) return variants[0] || '';
  const oncekiKucuk = (oncekiMetin || '').toLocaleLowerCase('tr');
  if (oncekiKucuk.endsWith('bu') && variants.includes('gün')) return 'gün';
  let sonUnlu = null;
  for (let i = oncekiKucuk.length - 1; i >= 0; i--) {
    if (TUM_UNLU.has(oncekiKucuk[i])) { sonUnlu = oncekiKucuk[i]; break; }
  }
  if (!sonUnlu) return variants[0];
  const arkaVar = ARKA_UNLU.has(sonUnlu);
  const yuvVar = YUVARLAK_UNLU.has(sonUnlu);
  for (const variant of variants) {
    const ilkUnlu = [...variant].find((c) => TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    if (ARKA_UNLU.has(ilkUnlu) === arkaVar && YUVARLAK_UNLU.has(ilkUnlu) === yuvVar) return variant;
  }
  for (const variant of variants) {
    const ilkUnlu = [...variant].find((c) => TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    if (ARKA_UNLU.has(ilkUnlu) === arkaVar) return variant;
  }
  return variants[0];
}

function _kalanIkinciKokleBaslar(kalanKucuk) {
  for (const baglayici of KOK_BAGLAYICILAR) {
    if (!kalanKucuk.startsWith(baglayici)) continue;
    const aday = kalanKucuk.slice(baglayici.length);
    for (const { kelime } of KOK_SORTED) {
      const kok = kelime.toLocaleLowerCase('tr');
      if (aday.length > kok.length && aday.startsWith(kok)) return true;
    }
  }
  return false;
}

function _kalanKokOnceligiGerektirir(kalanKucuk) {
  if (_kalanIkinciKokleBaslar(kalanKucuk)) return true;
  if (/^(yor|[aeıiuü]yor)/u.test(kalanKucuk)) return true;
  return PARCA_SUFFIXES_SORTED.some((suffix) => kalanKucuk === suffix || kalanKucuk.startsWith(suffix));
}

function _kokEslesmesiBul(kucuk, yalnizOncelikli = false) {
  for (const kok of KOK_SORTED) {
    const eslesme = kelimeKokuKisaltmaPrefixEslesmesi(kucuk, kok.kelime);
    if (!eslesme) continue;
    if (!yalnizOncelikli || eslesme.yorDonusumu || _kalanKokOnceligiGerektirir(eslesme.kalan)) {
      return { kok, eslesme };
    }
  }
  return null;
}

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
const PARCA_VARIANTS_SORTED = [...PARCA_SUFFIX_MAP.entries()]
  .map(([ek, hucreler]) => ({ ek, ...hucreler }))
  .sort((a, b) => b.ek.length - a.ek.length);

function _kelimeSessizleBaslar(kelime) {
  const ilk = (kelime || '')[0]?.toLocaleLowerCase('tr');
  return !!ilk && /\p{L}/u.test(ilk) && !TURKCE_UNLULER.has(ilk);
}

function _parcaKullanilabilirMi(kelime, baslangic, uzunluk, opt) {
  const offset = opt._offset ?? 0;
  const gercekBaslangic = offset + baslangic;
  const oncesiVar = gercekBaslangic > 0 || opt.afterKok || opt.afterTekHarf || opt.afterIkiHarf || opt.afterParca;
  const sonrasiVar = baslangic + uzunluk < kelime.length;
  if (!oncesiVar) return false;
  if (!oncesiVar && !sonrasiVar) return false;
  if (gercekBaslangic === 1 && opt._wordStartsConsonant) return false;
  return true;
}

/**
 * Tek bir kelimeyi (noktalama/boşluk olmayan) kısaltma kurallarıyla dönüştürür.
 *
 * Konum kısıtlamaları:
 *  - Kök kısaltması ([5]+sag) : yalnızca kelime BAŞINDA (ardında en az 1 karakter olmalı)
 *  - Parça kısaltması ([4,5] veya [5,6]+sag) : kelime başında, tek başına
 *    veya sessizle başlayan kelimenin ilk harfinden hemen sonra kullanılamaz.
 *  - Hece kısaltması : kelime başında/ortasında serbestçe;
 *    sonda yalnızca HECE_SON_YASAK dışındakiler
 *
 * Öncelik sırası:
 *  1. Tam kelime → iki harfli kısaltma (2 hücre)
 *  2. Tam kelime → tek harfli kısaltma (1 hücre)
 *  3. Kelime başında iki harfli kısaltma + ek/devam
 *  4. Kelime başında tek harfli kısaltma + [3] ayırma işareti + ek/devam
 *  5. Kelime başında en uzun kök kısaltması; kalan özyinelemeli
 *  6. Kelime parçası kısaltmaları konum kurallarıyla soldan sağa uygulanır
 *  7. Kalan stem: en uzun hece kısaltması, yoksa normal harf
 *
 * @param {string} kelime  — orijinal büyük/küçük harf karışık olabilir
 * @param {object} opt
 * @returns {number[][]}  hücre dizisi
 */
function kelimeyiKisaltmayaCevir(kelime, opt) {
  const kucuk = kelime.toLocaleLowerCase('tr');
  const { ikiHarf = true, birHarf = true, hece = true, kok = true, parca = true } = opt;
  const offset = opt._offset ?? 0;
  const wordStartsConsonant = opt._wordStartsConsonant ?? _kelimeSessizleBaslar(kucuk);

  const devamOpt = (kalanKucuk, ekOpt) => ({
    ...opt,
    ...ekOpt,
    _offset: offset + (kucuk.length - kalanKucuk.length),
    _wordStartsConsonant: wordStartsConsonant,
  });

  const kokHucreleri = (kokKaydi, kalanKucuk) => {
    const kalanHucreler = kelimeyiKisaltmayaCevir(kalanKucuk, devamOpt(kalanKucuk, {
      ikiHarf: false,
      birHarf: false,
      kok: false,
      afterKok: true,
    }));
    return [[5], kokKaydi.sag, ...kalanHucreler];
  };

  // 1. Tam kelime → iki harfli kısaltma
  if (ikiHarf && IKI_HARFLI_MAP.has(kucuk)) {
    const [sol, sag] = IKI_HARFLI_MAP.get(kucuk);
    return [sol, sag];
  }

  // 2. Tam kelime → tek harfli kısaltma
  if (birHarf && KELIME_KISALTMA_MAP.has(kucuk)) {
    return [KELIME_KISALTMA_MAP.get(kucuk)];
  }

  // Kök bileşiği veya -yor ses değişimi varsa kök kısaltması diğer prefix
  // kısaltmalardan önce gelir (örn. görebilmek, istiyor, harcıyor).
  if (kok) {
    const oncelikliKok = _kokEslesmesiBul(kucuk, true);
    if (oncelikliKok) {
      return kokHucreleri(oncelikliKok.kok, oncelikliKok.eslesme.kalan);
    }
  }

  // 3. Kelime başında iki harfli kısaltma + ek/devam
  // MEB kuralı: İki harfli kısaltmalar kelime başında ek alacak biçimde
  // kullanılabilir; ek/devamdan önce ayrıca ayırıcı işaret konmaz.
  if (ikiHarf) {
    for (const { kucuk: kisaltmaKelime, sol, sag } of IKI_HARF_PREFIX_SORTED) {
      const eslesme = ikiHarfliKisaltmaPrefixEslesmesi(kucuk, kisaltmaKelime);
      if (!eslesme) continue;
      const kalanKucuk = eslesme.kalan;
      const kalanHucreler = kelimeyiKisaltmayaCevir(kalanKucuk, devamOpt(kalanKucuk, {
        ikiHarf: false,
        birHarf: false,
        kok: false,
        afterIkiHarf: true,
      }));
      return [sol, sag, ...kalanHucreler];
    }
  }

  // 4. Kelime başında tek harfli kısaltma + ek/devam
  // MEB kuralı: Bir harfli kısaltmalar kelimenin başında kullanılabilir;
  // sonlarına ek aldığında kısaltma ile ek arasına üçüncü nokta konur.
  if (birHarf) {
    for (const { kucuk: kisaltmaKelime, noktalar } of TEK_HARF_PREFIX_SORTED) {
      if (kucuk.length <= kisaltmaKelime.length || !kucuk.startsWith(kisaltmaKelime)) continue;
      const kalanKucuk = kucuk.slice(kisaltmaKelime.length);
      const kalanHucreler = kelimeyiKisaltmayaCevir(kalanKucuk, devamOpt(kalanKucuk, {
        ikiHarf: false,
        birHarf: false,
        kok: false,
        afterTekHarf: true,
      }));
      return [noktalar, TEK_HARF_EK_AYIRMA_ISARETI, ...kalanHucreler];
    }
  }

  // 5. Kelime kökü kısaltması — yalnızca kelime BAŞINDA, ardında en az 1 karakter olmalı
  if (kok) {
    const kokEslesmesi = _kokEslesmesiBul(kucuk);
    if (kokEslesmesi) {
      return kokHucreleri(kokEslesmesi.kok, kokEslesmesi.eslesme.kalan);
    }
  }

  // 6-7. Stem kısmını parça + hece + normal harf ile işle.
  // Parça kısaltmaları soldan sağa ve en uzun eşleşme önceliğiyle denenir.
  const stemHucreler = [];
  let i = 0;
  const n = kucuk.length;
  while (i < n) {
    const kalanUzunluk = n - i;
    let eslesti = false;
    if (parca) {
      for (const { ek, sol, sag } of PARCA_VARIANTS_SORTED) {
        if (ek.length > kalanUzunluk) continue;
        if (kucuk.slice(i, i + ek.length) !== ek) continue;
        if (!_parcaKullanilabilirMi(kucuk, i, ek.length, { ...opt, _offset: offset, _wordStartsConsonant: wordStartsConsonant })) continue;
        stemHucreler.push(sol, sag);
        i += ek.length;
        eslesti = true;
        break;
      }
    }
    if (!eslesti && hece) {
      for (const { hece: heceStr, noktalar } of HECE_SORTED) {
        if (heceStr.length > kalanUzunluk) continue;
        if (kucuk.slice(i, i + heceStr.length) !== heceStr) continue;
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
      const origCh = kelime[i] ?? kucuk[i];
      const ust = origCh.toLocaleUpperCase('tr');
      const duzeltmeli = duzeltmeliHarfBilgisi(origCh);
      if (duzeltmeli) {
        if (opt.buyukHarfIsareti && buyukHarfKarakteriMi(origCh)) {
          stemHucreler.push(BUYUK_HARF_ISARETI);
        }
        stemHucreler.push(DUZELTME_YABANCI_HARF_ISARETI, duzeltmeli.noktalar);
      } else {
        const noktalar = HARF_TABLO.get(ust);
        if (noktalar) {
          if (opt.buyukHarfIsareti && buyukHarfKarakteriMi(origCh)) {
            stemHucreler.push(BUYUK_HARF_ISARETI);
          }
          stemHucreler.push(noktalar);
        } else {
          stemHucreler.push([]); // bilinmeyen karakter
        }
      }
      i++;
    }
  }

  return stemHucreler;
}

function sirayaSayiJetonlariniDuzenle(tokenler) {
  const out = [];
  for (let i = 0; i < tokenler.length; i++) {
    const t = tokenler[i];
    if (t.tip === 'rakam') {
      const n = tokenler[i + 1];
      const n2 = tokenler[i + 2];
      if (n?.tip === 'noktalama' && n.deger === '.' && !(n2?.tip === 'rakam')) {
        out.push({ tip: 'siraSayi', rakamlar: t.deger, idx: t.idx });
        i += 1;
        continue;
      }
    }
    out.push(t);
  }
  return out;
}

/** @param {string} kel */
function siraSayisiSonekKelimesiMi(kel) {
  return siraSayisiSonrakiEkUzunlugu(kel, 0) > 0;
}

/**
 * Metni kısaltma sistemi aktif olarak braille hücre dizisine çevirir.
 * @param {string} metin
 * @param {{ buyukHarfIsareti?: boolean, sayiIsareti?: boolean }} [opt]
 * @returns {{ hucreler: number[][], esleme: number[] }}
 */
export function metniBrailleyeCevirKisaltmali(metin, opt = {}) {
  const { buyukHarfIsareti = false, sayiIsareti = false,
          tekHarfIsareti = true, kelimeTercihleri = {}, yorumTercihleri = {},
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
    const tarih = tarihYazimiEslesmesi(metin, i);
    if (tarih) {
      tokenler.push({ tip: 'tarih', deger: tarih, idx: i });
      i += tarih.length;
    } else if (sayiBagIfadesiEslesmesi(metin, i)) {
      const deger = sayiBagIfadesiEslesmesi(metin, i);
      tokenler.push({ tip: 'sayiBag', deger, idx: i });
      i += deger.uzunluk;
    } else if (bolukluSayiEslesmesi(metin, i)) {
      const deger = bolukluSayiEslesmesi(metin, i);
      tokenler.push({ tip: 'bolukluSayi', deger, idx: i });
      i += deger.length;
    } else if (/\s/.test(ch)) {
      tokenler.push({ tip: 'bosluk', deger: ch, idx: i });
      i++;
    } else if (harfliSayiEslesmesi(metin, i)) {
      const deger = harfliSayiEslesmesi(metin, i);
      tokenler.push({ tip: 'harfliSayi', deger, idx: i });
      i += deger.length;
    } else if (matematikIslemIsaretiMetinEslesmesi(metin, i, yorumTercihleri)) {
      tokenler.push({ tip: 'islem', deger: ch, idx: i });
      i++;
    } else if (NOKTA_TABLO.has(ch)) {
      tokenler.push({ tip: 'noktalama', deger: ch, idx: i });
      i++;
    } else if (ch === '^') {
      tokenler.push({ tip: 'duzeltme', deger: ch, idx: i });
      i++;
    } else if (RAKAM_TABLO.has(ch)) {
      let j = i;
      while (j < metin.length && RAKAM_TABLO.has(metin[j])) j++;
      tokenler.push({ tip: 'rakam', deger: metin.slice(i, j), idx: i });
      i = j;
    } else {
      // Kelime bloğu (harf karakterleri)
      let j = i;
      while (j < metin.length) {
        const c = metin[j];
        if (
          /\s/.test(c)
          || NOKTA_TABLO.has(c)
          || RAKAM_TABLO.has(c)
          || matematikIslemIsaretiMetinEslesmesi(metin, j, yorumTercihleri)
        ) break;
        j++;
      }
      tokenler.push({ tip: 'kelime', deger: metin.slice(i, j), idx: i });
      i = j;
    }
  }

  const islenmisJetonlar = sirayaSayiJetonlariniDuzenle(tokenler);

  const ciftPlani = sayiIsareti ? ciftRakamIsaretiPlaniOlustur(metin) : new Map();
  let sayiModu = false;

  for (let ti = 0; ti < islenmisJetonlar.length; ti++) {
    const tok = islenmisJetonlar[ti];
    if (tok.tip === 'bosluk') {
      ekle([], tok.idx);
      sayiModu = false;
    } else if (tok.tip === 'bolukluSayi') {
      bolukluSayiEkle(tok.deger, tok.idx, ekle, sayiIsareti);
      sayiModu = true;
    } else if (tok.tip === 'sayiBag') {
      sayiBagIfadesiEkle(tok.deger, tok.idx, ekle, sayiIsareti);
      sayiModu = true;
    } else if (tok.tip === 'noktalama') {
      ekle(NOKTA_TABLO.get(tok.deger), tok.idx);
      const ondalKom =
        tok.deger === ',' && sayiModu && ondalikVirguluMi(metin, tok.idx, yorumTercihleri);
      if (!ondalKom) sayiModu = false;
    } else if (tok.tip === 'duzeltme') {
      ekle(DUZELTME_YABANCI_HARF_ISARETI, tok.idx);
      sayiModu = false;
    } else if (tok.tip === 'islem') {
      const islemIsareti = matematikIslemIsaretiMetinEslesmesi(metin, tok.idx, yorumTercihleri);
      if (islemIsareti) {
        for (const hucre of islemIsareti.hucreler) ekle(hucre, tok.idx);
      }
      sayiModu = sayiModu && matematikIsaretiSayiModunuKorurMu(islemIsareti);
    } else if (tok.tip === 'harfliSayi') {
      harfliSayiEkle(tok.deger, tok.idx, ekle, sayiIsareti);
      sayiModu = false;
    } else if (tok.tip === 'siraSayi') {
      if (sayiIsareti && !sayiModu) {
        ekle(SAYI_ISARETI, -1);
      }
      for (let ri = 0; ri < tok.rakamlar.length; ri++) {
        const no = SIRA_SAYISI_RAKAM_TABLO.get(tok.rakamlar[ri]);
        if (no) ekle(no, tok.idx + ri);
      }
      sayiModu = false;
    } else if (tok.tip === 'rakam') {
      const sonraki = islenmisJetonlar[ti + 1];
      const sonraki2 = islenmisJetonlar[ti + 2];
      const kesmeSonrakiSonek =
        sonraki?.tip === 'noktalama'
        && (sonraki.deger === "'" || sonraki.deger === '\u2019')
        && sonraki2?.tip === 'kelime'
        && siraSayisiSonekKelimesiMi(sonraki2.deger);
      if (kesmeSonrakiSonek) {
        if (sayiIsareti && !sayiModu) {
          ekle(SAYI_ISARETI, -1);
        }
        for (let ri = 0; ri < tok.deger.length; ri++) {
          const no = SIRA_SAYISI_RAKAM_TABLO.get(tok.deger[ri]);
          if (no) ekle(no, tok.idx + ri);
        }
        sayiModu = false;
        continue;
      }
      const rol = ciftPlani.get(tok.idx);
      if (sayiIsareti) {
        if (rol === 'ilk_cift') {
          ekle(SAYI_ISARETI, -1);
          ekle(SAYI_ISARETI, -1);
        } else if (rol === 'son_tek') {
          if (!sayiModu) ekle(SAYI_ISARETI, -1);
        } else if (rol !== 'orta_isaretsiz') {
          if (!sayiModu) ekle(SAYI_ISARETI, -1);
        }
      }
      for (let ri = 0; ri < tok.deger.length; ri++) {
        ekle(RAKAM_TABLO.get(tok.deger[ri]), tok.idx + ri);
      }
      sayiModu = true;
    } else if (tok.tip === 'tarih') {
      tarihYazimiEkle(tok.deger, tok.idx, ekle, sayiIsareti);
      sayiModu = false;
    } else {
      // Kelime — büyük harf kontrolü + kısaltma dönüşümü
      sayiModu = false;
      const kel = tok.deger;
      const kucukKel = kel.toLocaleLowerCase('tr');
      const tercihAnahtari = `${tok.idx}:${kucukKel}`;
      const kelimeTercihi = kelimeTercihleri?.[tercihAnahtari] || null;
      const kelimeSistemleri = kelimeTercihi
        ? {
          hece: kelimeTercihi.hece ?? hece,
          birHarf: kelimeTercihi.birHarf ?? birHarf,
          ikiHarf: kelimeTercihi.ikiHarf ?? ikiHarf,
          kok: kelimeTercihi.kok ?? kok,
          parca: kelimeTercihi.parca ?? parca,
        }
        : { hece, birHarf, ikiHarf, kok, parca };
      if (buyukHarfIsareti && rumuzluIfadeMi(kel)) {
        rumuzluIfadeEkle(kel, tok.idx, ekle);
        continue;
      }
      if (tekHarfIsareti && tekHarfKullanimiMi(metin, tok.idx)) {
        const ch = [...kel][0];
        const ust = ch.toLocaleUpperCase('tr');
        ekle(TEK_KUCUK_HARF_ISARETI, -1);
        const duzeltmeli = duzeltmeliHarfBilgisi(ch);
        if (buyukHarfIsareti && buyukHarfKarakteriMi(ch)) {
          ekle(BUYUK_HARF_ISARETI, -1);
        }
        if (duzeltmeli) {
          ekle(DUZELTME_YABANCI_HARF_ISARETI, -1);
          ekle(duzeltmeli.noktalar, tok.idx);
        } else {
          ekle(HARF_TABLO.get(ust), tok.idx);
        }
        continue;
      }
      // Tümü büyük? → çift [6] ekle, kelimeyi küçük olarak işle (per-letter [6] tetiklenmesin)
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
      const hucreleri = kelimeyiKisaltmayaCevir(isleneKel, {
        buyukHarfIsareti,
        sayiIsareti,
        hece: kelimeSistemleri.hece,
        birHarf: kelimeSistemleri.birHarf,
        ikiHarf: kelimeSistemleri.ikiHarf,
        kok: kelimeSistemleri.kok,
        parca: kelimeSistemleri.parca,
      });
      for (let hi = 0; hi < hucreleri.length; hi++) {
        ekle(hucreleri[hi], tok.idx);
      }
    }
  }

  return { hucreler, esleme };
}

function _hucreBlokunuMetneCevirKisaltmali(bRaw, sistemler, sonrakiIlkHucre, opt = {}) {
  const {
    hece: heceAktif = true,
    birHarf: birHarfAktif = true,
    ikiHarf: ikiHarfAktif = true,
    kok: kokAktif = true,
    parca: parcaAktif = true,
  } = sistemler;

  let bashCase = 'normal';
  let b = bRaw;
  if (b.length >= 2 && buyukHarfIsaretiMi(b[0]) && buyukHarfIsaretiMi(b[1])) {
    bashCase = 'tumu';
    b = b.slice(2);
  } else if (b.length >= 1 && buyukHarfIsaretiMi(b[0])) {
    bashCase = 'ilk';
    b = b.slice(1);
  }
  if (b.length === 0) return '';

  const kasala = (metin) => {
    if (!metin) return metin;
    if (bashCase === 'tumu') return metin.toLocaleUpperCase('tr');
    if (bashCase === 'ilk') return metin.charAt(0).toLocaleUpperCase('tr') + metin.slice(1);
    return metin;
  };

  const noktalamaMetni = (hucreler) => hucreler
    .map((hucre) => NOKTA_TERS.get(noktalariAnahtara(hucre)) || '')
    .join('');

  let govdeBaslangic = 0;
  while (govdeBaslangic < b.length) {
    const anahtar = noktalariAnahtara(b[govdeBaslangic]);
    if (anahtar !== '2,3,6' && anahtar !== '2,3,5,6') break;
    govdeBaslangic++;
  }
  let govdeBitis = b.length;
  while (govdeBitis > govdeBaslangic && NOKTA_TERS.has(noktalariAnahtara(b[govdeBitis - 1]))) {
    govdeBitis--;
  }
  if ((govdeBaslangic > 0 || govdeBitis < b.length) && govdeBaslangic < govdeBitis) {
    const sol = noktalamaMetni(b.slice(0, govdeBaslangic));
    const sagHucreler = b.slice(govdeBitis);
    const govdeTamamlandi = sagHucreler.some((hucre) => noktalariAnahtara(hucre) !== '3');
    const govde = _hucreBlokunuMetneCevirKisaltmali(
      b.slice(govdeBaslangic, govdeBitis),
      sistemler,
      sonrakiIlkHucre,
      govdeTamamlandi ? {} : opt
    );
    const sag = noktalamaMetni(sagHucreler);
    return `${sol}${kasala(govde)}${sag}`;
  }

  const ilkKey = noktalariAnahtara(b[0]);
  if (birHarfAktif && !opt.sonTekHarfBeklet && b.length === 1 && KISALTMA_TEK_TERS.has(ilkKey)) {
    return kasala(KISALTMA_TEK_TERS.get(ilkKey));
  }
  if (ikiHarfAktif && b.length === 2 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
    const ikiKey = `${ilkKey}|${noktalariAnahtara(b[1])}`;
    if (KISALTMA_IKI_TERS.has(ikiKey)) return kasala(KISALTMA_IKI_TERS.get(ikiKey));
  }

  const buf = [];
  let ci = 0;
  let sayiModu = false;
  let ciftListeVirgulle = false;
  let cListeSonTekIsaretSonrasi = false;
  let buyukHarfBekle = bashCase === 'ilk';
  let tumKelimeBuyuk = bashCase === 'tumu';
  let duzeltmeBekle = false;
  let ikiHarfPrefixIndex = -1;
  let kokPrefixIndex = -1;

  if (ikiHarfAktif && b.length >= 3 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
    const ikiKey = `${ilkKey}|${noktalariAnahtara(b[1])}`;
    if (KISALTMA_IKI_TERS.has(ikiKey)) {
      let ikiKelime = KISALTMA_IKI_TERS.get(ikiKey);
      if (tumKelimeBuyuk) ikiKelime = ikiKelime.toLocaleUpperCase('tr');
      else if (buyukHarfBekle) ikiKelime = ikiKelime.charAt(0).toLocaleUpperCase('tr') + ikiKelime.slice(1).toLocaleLowerCase('tr');
      buf.push(ikiKelime);
      ikiHarfPrefixIndex = buf.length - 1;
      buyukHarfBekle = false;
      ci = 2;
    }
  }

  if (birHarfAktif && b.length >= 3 && ci === 0 && KISALTMA_TEK_TERS.has(ilkKey)) {
    const ikinciKey = noktalariAnahtara(b[1]);
    if (ikinciKey === '3') {
      let tekKelime = KISALTMA_TEK_TERS.get(ilkKey);
      if (tumKelimeBuyuk) tekKelime = tekKelime.toLocaleUpperCase('tr');
      else if (buyukHarfBekle) tekKelime = tekKelime.charAt(0).toLocaleUpperCase('tr') + tekKelime.slice(1).toLocaleLowerCase('tr');
      buf.push(tekKelime);
      buyukHarfBekle = false;
      ci = 2;
    }
  }

  if (kokAktif && b.length >= 2 && ci === 0 && ilkKey === '5') {
    const sagKey = noktalariAnahtara(b[1]);
    const kok = KOK_SAG_TERS.get(sagKey);
    if (kok) {
      let kokKelime = kok.kelime;
      if (tumKelimeBuyuk) kokKelime = kokKelime.toLocaleUpperCase('tr');
      else if (buyukHarfBekle) kokKelime = kokKelime.charAt(0).toLocaleUpperCase('tr') + kokKelime.slice(1);
      buf.push(kokKelime);
      kokPrefixIndex = buf.length - 1;
      buyukHarfBekle = false;
      ci = 2;
    }
  }

  const harfYaz = (harf) => {
    if (!harf) return;
    if (tumKelimeBuyuk) buf.push(harf.toLocaleUpperCase('tr'));
    else if (buyukHarfBekle) {
      buf.push(harf.charAt(0).toLocaleUpperCase('tr') + harf.slice(1).toLocaleLowerCase('tr'));
      buyukHarfBekle = false;
    } else {
      buf.push(harf.toLocaleLowerCase('tr'));
    }
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
    if (sonraki && !NOKTA_TERS.has(noktalariAnahtara(sonraki))) return null;
    return {
      metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
      sonrakiIndex: harfIndex + 1,
    };
  };

  while (ci < b.length) {
    const noktalar = b[ci];
    const tekHarf = tekHarfIsaretliOku(ci);
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
    if (sayiIsaretiMi(noktalar)) {
      const sonraki = ci + 1 < b.length ? b[ci + 1] : null;
      if (sonraki && sayiIsaretiMi(sonraki)) {
        sayiModu = true;
        ciftListeVirgulle = true;
        cListeSonTekIsaretSonrasi = false;
        ci += 2;
        continue;
      }
      const sonrakDigit = sonraki && hucreyiRakamayap(sonraki);
      const sonrakSira = sonraki && hucreyiSiraSayisiRakaminaCevir(sonraki);
      const kelimeBasi = ci === 0;
      if ((kelimeBasi || ciftListeVirgulle) && (sonrakDigit || sonrakSira)) {
        if (ciftListeVirgulle) {
          ciftListeVirgulle = false;
          cListeSonTekIsaretSonrasi = true;
        }
        sayiModu = true;
        ci++;
        continue;
      }
    }

    if (buyukHarfIsaretiMi(noktalar)) {
      if (ci + 1 < b.length && buyukHarfIsaretiMi(b[ci + 1])) {
        tumKelimeBuyuk = true;
        ci += 2;
      } else {
        buyukHarfBekle = true;
        ci++;
      }
      continue;
    }

    if (sayiModu) {
      const rakam = hucreyiRakamayap(noktalar);
      if (rakam) {
        buf.push(rakam);
        ci++;
        continue;
      }
      const bolukMu = noktalariAnahtara(noktalar) === '3';
      if (bolukMu && ci + 1 < b.length && hucreyiRakamayap(b[ci + 1])) {
        buf.push('.');
        ci++;
        continue;
      }
      const kVirgulMu = noktalariAnahtara(noktalar) === '2';
      if (kVirgulMu && ciftListeVirgulle) {
        buf.push(',');
        ci++;
        continue;
      }
      if (
        kVirgulMu
        && !ciftListeVirgulle
        && ci + 1 < b.length
        && hucreyiRakamayap(b[ci + 1])
      ) {
        buf.push(',');
        ci++;
        continue;
      }
      let si = ci;
      let siraTxt = '';
      while (si < b.length) {
        const sr = hucreyiSiraSayisiRakaminaCevir(b[si]);
        if (!sr) break;
        siraTxt += sr;
        si++;
      }
      if (siraTxt.length > 0) {
        buf.push(siraTxt);
        const sonraH = si < b.length ? b[si] : null;
        const kesmeMi = sonraH && noktalariAnahtara(sonraH) === '3';
        if (!kesmeMi) buf.push('.');
        sayiModu = false;
        ci = si;
        continue;
      }
      if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(b, ci)) {
        buf.push('.');
        ci++;
        continue;
      }
      sayiModu = false;
      if (cListeSonTekIsaretSonrasi) {
        cListeSonTekIsaretSonrasi = false;
        ciftListeVirgulle = false;
      }
    }

    if (parcaAktif && ci + 1 < b.length) {
      const solKey = noktalariAnahtara(noktalar);
      if (solKey === '4,5' || solKey === '5,6') {
        const parca = PARCA_TERS.get(`${solKey}|${noktalariAnahtara(b[ci + 1])}`);
        if (parca) {
          buf.push(_unluUyumuSec(parca.ekler, buf.join('')));
          ci += 2;
          continue;
        }
      }
    }

    const anahtar = noktalariAnahtara(noktalar);
    const noktalama = NOKTA_TERS.get(anahtar);
    const heceKarsiligi = heceAktif && !sayiModu ? HECE_TERS_KISALTMA.get(anahtar) : undefined;
    if (noktalama && heceKarsiligi) {
      const ilkHucre = ci === 0;
      const sonHucre = ci === b.length - 1;
      let kalanHepsiNoktalama = true;
      for (let ki = ci + 1; ki < b.length; ki++) {
        if (!NOKTA_TERS.has(noktalariAnahtara(b[ki]))) {
          kalanHepsiNoktalama = false;
          break;
        }
      }
      let noktalamaKullan = false;
      if (ilkHucre && anahtar === '2,3,6') noktalamaKullan = true;
      else if (sonHucre || kalanHepsiNoktalama) {
        if (anahtar === '2,6' && sonHucre) {
          noktalamaKullan = sonrakiIlkHucre == null || buyukHarfIsaretiMi(sonrakiIlkHucre);
        } else {
          noktalamaKullan = true;
        }
      }
      if (noktalamaKullan) buf.push(noktalama);
      else harfYaz(heceKarsiligi);
    } else if (noktalama) {
      buf.push(noktalama);
    } else if (heceKarsiligi) {
      harfYaz(heceKarsiligi);
    } else {
      harfYaz(hucreyiKarakteryap(noktalar));
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

  return buf.join('');
}

/**
 * Kısaltmalı braille hücre dizisini metne çevirir.
 * Serbest Yazma gibi canlı girişlerde boşluk hücreleri korunur.
 * @param {number[][]} hucreler
 * @param {{ hece?: boolean, birHarf?: boolean, ikiHarf?: boolean, kok?: boolean, parca?: boolean }} [sistemler]
 * @param {{ sonTekHarfBeklet?: boolean }} [opt]
 * @returns {string}
 */
export function hucreleriMetneCevirKisaltmali(hucreler, sistemler = {}, opt = {}) {
  const cikis = [];
  let i = 0;

  while (i < hucreler.length) {
    const hucre = hucreler[i] || [];
    if (hucre.length === 0) {
      cikis.push(' ');
      i++;
      continue;
    }

    const blok = [];
    while (i < hucreler.length && (hucreler[i] || []).length > 0) {
      blok.push(hucreler[i]);
      i++;
    }
    const sonBlokTamamlanmadi = opt.sonTekHarfBeklet && i >= hucreler.length;

    let sonrakiIlkHucre = null;
    for (let j = i; j < hucreler.length; j++) {
      if ((hucreler[j] || []).length > 0) {
        sonrakiIlkHucre = hucreler[j];
        break;
      }
    }
    cikis.push(_hucreBlokunuMetneCevirKisaltmali(
      blok,
      sistemler,
      sonrakiIlkHucre,
      sonBlokTamamlanmadi ? { sonTekHarfBeklet: true } : {}
    ));
  }

  return cikis.join('');
}

