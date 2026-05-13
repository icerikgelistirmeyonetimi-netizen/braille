/**
 * Fransızca Braille — standart alfabe, aksanlı harfler ve kısaltmalar.
 */

function dc(...dotGroups) {
  return dotGroups.map((g) => g.split('-').map(Number));
}

/** @param {string} ad @param {string[]} grup @param {string} [aciklama] @param {string[]} [kurallar] */
function R(ad, grup, aciklama, kurallar) {
  const o = { ad, hucreler: dc(...grup) };
  if (aciklama) o.aciklama = aciklama;
  if (kurallar && kurallar.length > 0) o.kurallar = kurallar;
  return o;
}

const FR_DETAY_A_SAYI = [
  'Rakam göstergesi sonrası “a” = 1',
  'Büyük harf göstergesi önde',
  'Şüphede tam yazım',
];

const FR_DETAY_E_ACCENT_AIGU = [
  'Aksan tam yazım · tam kelime işaretleri tablo uyumu',
];

const FR_DETAY_LE = [
  'Elision: kesme korunur · yanlar harf harf',
];

const FR_DETAY_AU = [
  'au: kelime veya iç · tek hece · şüphede tam yazım',
];

const FR_DETAY_QUE = [
  'que: kelime/iç · hece/kök korunur',
];

const FR_DETAY_EN = [
  'en: kelime/iç · tek hecede',
];

const FR_DETAY_ETE = [
  'été: tam kelime işareti · iç kullanımda hece uyumu',
];

const FR_DETAY_OU = [
  'ou: kelime/iç · çift kullanım',
];

const FR_DETAY_ON = [
  'on: kelime/iç · tek hece',
];

const FR_DETAY_CH = [
  'ch: hece + liste sırası · çakışmada liste önceliği',
  'Tireli bileşik: köprü yok',
];

const FR_DETAY_AN = [
  'an: tek hecede · liste önceliği',
];

/** BÖLÜM 1 — A–J */
export const FRANSIZCA_ALFABE_AJ = [
  R('a', ['1'], undefined, FR_DETAY_A_SAYI),
  R('b', ['1-2']),
  R('c', ['1-4']),
  R('d', ['1-4-5']),
  R('e', ['1-5']),
  R('f', ['1-2-4']),
  R('g', ['1-2-4-5']),
  R('h', ['1-2-5']),
  R('i', ['2-4']),
  R('j', ['2-4-5']),
];

/** BÖLÜM 1 — K–T */
export const FRANSIZCA_ALFABE_KT = [
  R('k', ['1-3']),
  R('l', ['1-2-3']),
  R('m', ['1-3-4']),
  R('n', ['1-3-4-5']),
  R('o', ['1-3-5']),
  R('p', ['1-2-3-4']),
  R('q', ['1-2-3-4-5']),
  R('r', ['1-2-3-5']),
  R('s', ['2-3-4']),
  R('t', ['2-3-4-5']),
];

/** BÖLÜM 1 — U–Z */
export const FRANSIZCA_ALFABE_UZ = [
  R('u', ['1-3-6']),
  R('v', ['1-2-3-6']),
  R('w', ['2-4-5-6']),
  R('x', ['1-3-4-6']),
  R('y', ['1-3-4-5-6']),
  R('z', ['1-3-5-6']),
];

/** BÖLÜM 1 — Aksanlı harfler */
export const FRANSIZCA_ALFABE_AKSAN = [
  R('é', ['1-2-3-4-5-6'], undefined, FR_DETAY_E_ACCENT_AIGU),
  R('à', ['1-2-3-5-6']),
  R('è', ['2-3-4-6']),
  R('ù', ['2-3-4-5-6']),
  R('â', ['1-6']),
  R('ê', ['1-2-6']),
  R('î', ['1-4-6']),
  R('ô', ['1-4-5-6']),
  R('û', ['1-2-4-5-6']),
  R('ë', ['1-2-4-6']),
  R('ï', ['1-2-4-5-6']),
  R('ç', ['1-2-3-4-6']),
];

/** BÖLÜM 2 — Bir harfli kelime kısaltmaları — 1. grup */
export const FRANSIZCA_BIR_HARF_GRUP1 = [
  R('bien', ['1-2']),
  R('ce', ['1-4']),
  R('de', ['1-4-5']),
  R('faire', ['1-2-4']),
  R('qui', ['1-2-4-5']),
  R('sur', ['1-2-5']),
  R('il', ['2-4']),
  R('je', ['2-4-5']),
  R('au', ['1-3'], undefined, FR_DETAY_AU),
  R('le', ['1-2-3'], undefined, FR_DETAY_LE),
  R('me', ['1-3-4']),
  R('ne', ['1-3-4-5']),
  R('nous', ['1-3-5']),
  R('tout', ['1-6']),
  R('même', ['1-2-6']),
  R('cet', ['1-4-6']),
  R('dans', ['1-4-5-6']),
];

/** BÖLÜM 2 — Bir harfli kelime kısaltmaları — 2. grup */
export const FRANSIZCA_BIR_HARF_GRUP2 = [
  R('que', ['1-2-3-4-5'], undefined, FR_DETAY_QUE),
  R('rien', ['1-2-3-5']),
  R('se', ['2-3-4']),
  R('te', ['2-3-4-5']),
  R('un', ['1-3-6']),
  R('vous', ['1-2-3-6']),
  R('mais', ['1-3-4-6']),
  R('elle', ['1-3-5-6']),
  R('pour', ['1-2-3-4-6']),
  R('quoi', ['1-2-3-4-5-6']),
  R('sans', ['2-3-4-6']),
  R('et', ['2-3-4-5-6']),
  R('per', ['1-2-3-4']),
  R('en', ['2-6'], undefined, FR_DETAY_EN),
  R('puis', ['2-3-5']),
  R('été', ['2-3-5-6'], undefined, FR_DETAY_ETE),
  R('du', ['2-3-6']),
];

/** BÖLÜM 2 — Bir harfli kelime kısaltmaları — 3. grup */
export const FRANSIZCA_BIR_HARF_GRUP3 = [
  R('est', ['1-5-6']),
  R('plus', ['1-2-4-6']),
  R('grand', ['1-2-4-5-6']),
  R('ou', ['1-2-5-6'], undefined, FR_DETAY_OU),
  R('son', ['2-4-6']),
  R('tous', ['2-4-5-6']),
  R('dès', ['2-5-6']),
  R('si', ['3-5']),
  R('sous', ['3-5-6']),
  R('la', ['6']),
  R('celui', ['3-6']),
  R('lui', ['3-4-5-6']),
  R('on', ['3-4-6'], undefined, FR_DETAY_ON),
  R('les', ['3-4-5']),
];

/** BÖLÜM 3 — Kelime parçası kısaltmaları (ekler / sesler) */
export const FRANSIZCA_KELIME_PARCA = [
  R('ch', ['1-2-3-5-6'], undefined, FR_DETAY_CH),
  R('oi', ['2-3-4-5-6']),
  R('an', ['2'], undefined, FR_DETAY_AN),
  R('eur', ['4-6']),
  R('ll', ['4-5-6']),
  R('ion', ['3-4-5-6']),
  R('ar', ['4']),
  R('gn', ['2-3-5-6']),
  R('er', ['2-3-6']),
  R('in', ['3-5']),
  R('eu', ['5']),
  R('ieu', ['6']),
  R('or', ['5-6']),
  R('ai', ['3-4']),
];

export const FRANSIZCA_BOLUMLER = [
  {
    slug: 'alfabe-a-j',
    kisaBaslik: 'Alfabe A–J',
    pageBaslik: 'Fransızca · Standart alfabe (A–J)',
    ilerlemeAnahtari: 'fra-braille-alfa-aj',
    veri: FRANSIZCA_ALFABE_AJ,
  },
  {
    slug: 'alfabe-k-t',
    kisaBaslik: 'Alfabe K–T',
    pageBaslik: 'Fransızca · Standart alfabe (K–T)',
    ilerlemeAnahtari: 'fra-braille-alfa-kt',
    veri: FRANSIZCA_ALFABE_KT,
  },
  {
    slug: 'alfabe-u-z',
    kisaBaslik: 'Alfabe U–Z',
    pageBaslik: 'Fransızca · Standart alfabe (U–Z)',
    ilerlemeAnahtari: 'fra-braille-alfa-uz',
    veri: FRANSIZCA_ALFABE_UZ,
  },
  {
    slug: 'alfabe-aksanlar',
    kisaBaslik: 'Aksanlı harfler',
    pageBaslik: 'Fransızca · Aksanlı harfler',
    ilerlemeAnahtari: 'fra-braille-alfa-aksan',
    veri: FRANSIZCA_ALFABE_AKSAN,
  },
  {
    slug: 'bir-harfli-1',
    kisaBaslik: 'Bir harfli (1)',
    pageBaslik: 'Fransızca · Bir harfli kelime kısaltmaları (1)',
    ilerlemeAnahtari: 'fra-braille-bir1',
    veri: FRANSIZCA_BIR_HARF_GRUP1,
  },
  {
    slug: 'bir-harfli-2',
    kisaBaslik: 'Bir harfli (2)',
    pageBaslik: 'Fransızca · Bir harfli kelime kısaltmaları (2)',
    ilerlemeAnahtari: 'fra-braille-bir2',
    veri: FRANSIZCA_BIR_HARF_GRUP2,
  },
  {
    slug: 'bir-harfli-3',
    kisaBaslik: 'Bir harfli (3)',
    pageBaslik: 'Fransızca · Bir harfli kelime kısaltmaları (3)',
    ilerlemeAnahtari: 'fra-braille-bir3',
    veri: FRANSIZCA_BIR_HARF_GRUP3,
  },
  {
    slug: 'kelime-parca',
    kisaBaslik: 'Kelime parçası',
    pageBaslik: 'Fransızca · Kelime parçası kısaltmaları',
    ilerlemeAnahtari: 'fra-braille-parca',
    veri: FRANSIZCA_KELIME_PARCA,
  },
];
