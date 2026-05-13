/**
 * Almanca Braille (temel Standort / kısaltmalar) — öğrenme içeriği.
 * @typedef {{ ad: string, aciklama?: string, sembol?: string, hucreler: number[][] }} AlmBrailleOge
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

const DE_DETAY_A_SAYI = [
  'Rakam göstergesi sonrası “a” = 1',
  'Büyük harf göstergesi önde',
  'Şüphede Vollschrift',
];

const DE_DETAY_WORTFUGE = [
  'Wortfuge geçilmez · örn. ge-hen ✓ · Spiegel-ei ✗',
  'Ses grubu · heceleme uyumu',
];

const DE_DETAY_ST = [
  'st: başta/içte · s-t ayrı hecede ✗',
  'Özel ad · §4.8 dikkat',
];

const DE_DETAY_BE = [
  'Önek “be” · ses dizisi birlikte okununca',
  'Wortfuge · köprü yok',
  'Özel ad · şüphede tam yazım',
];

/** 1. Almanca alfabe ve özel harfler */
export const ALMANCA_ALFABE = [
  R('a', ['1'], undefined, DE_DETAY_A_SAYI),
  R('b', ['1-2']),
  R('c', ['1-4']),
  R('d', ['1-4-5']),
  R('e', ['1-5']),
  R('f', ['1-2-4']),
  R('g', ['1-2-4-5']),
  R('h', ['1-2-5']),
  R('i', ['2-4']),
  R('j', ['2-4-5']),
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
  R('u', ['1-3-6']),
  R('v', ['1-2-3-6']),
  R('w', ['2-4-5-6']),
  R('x', ['1-3-4-6']),
  R('y', ['1-3-4-5-6']),
  R('z', ['1-3-5-6']),
  R('ü', ['1-2-5-6']),
  R('ö', ['2-4-6']),
  R('ä', ['3-4-5']),
];

/** 2. Kelime parçalarına ait kısaltmalar */
export const ALMANCA_KELIME_PARCA = [
  R('en', ['1-4']),
  R('ll', ['1-2-3-4-5']),
  R('mm', ['1-3-4-6']),
  R('el', ['1-3-4-5-6']),
  R('ge', ['1-2-3-4-6'], undefined, DE_DETAY_WORTFUGE),
  R('es', ['1-2-3-4-5-6']),
  R('em', ['1-2-3-5-6']),
  R('ss', ['2-3-4-6']),
  R('st', ['2-3-4-5-6'], undefined, DE_DETAY_ST),
  R('au', ['1-6']),
  R('eu', ['1-2-6']),
  R('ei', ['1-4-6']),
  R('ch', ['1-4-5-6']),
  R('sch', ['1-5-6']),
  R('te', ['2-3-6']),
  R('in', ['3-5']),
  R('ar', ['3-5-6']),
  R('ein', ['1-2-4-6']),
  R('er', ['1-2-4-5-6']),
  R('äu', ['3-4']),
  R('ie', ['3-4-6']),
  R('ver', ['3-6']),
  R('ck', ['4-6']),
  R('lich', ['4-5-6']),
  R('ich', ['3-4-5-6']),
  R('be', ['2-3'], undefined, DE_DETAY_BE),
  R('al', ['2-5']),
  R('un', ['2-5-6']),
  R('or', ['2-6']),
  R('an', ['2-3-5']),
  R('eh', ['2-3-5-6']),
  R('ig', ['4-5']),
  R('ach', ['5-6']),
];

/** 3. Bir harfli kelime kısaltmaları — 1. grup */
export const ALMANCA_BIR_HARF_GRUP1 = [
  R('aber', ['1']),
  R('bei', ['1-2']),
  R('sich', ['1-4']),
  R('das', ['1-4-5']),
  R('den', ['1-5']),
  R('für', ['1-2-4']),
  R('gegen', ['1-2-4-5']),
  R('hatte', ['1-2-5']),
  R('ihr', ['2-4']),
  R('jetzt', ['2-4-5'], 'şimdi'),
  R('kann', ['1-3']),
  R('man', ['1-3-4']),
  R('sein', ['2-4-6']),
  R('was', ['2-4-5-6']),
  R('auch', ['3-4']),
  R('hätte', ['3-4-5']),
  R('die', ['3-4-6']),
  R('des', ['3']),
  R('auf', ['1-6']),
  R('wie', ['1-2-6']),
];

/** 3. Bir harfli kelime kısaltmaları — 2. grup */
export const ALMANCA_BIR_HARF_GRUP2 = [
  R('nicht', ['1-3-4-5']),
  R('oder', ['1-3-5']),
  R('so', ['1-2-3-4']),
  R('voll', ['1-2-3-4-5']),
  R('der', ['1-2-3-5']),
  R('sie', ['2-3-4']),
  R('mit', ['2-3-4-5']),
  R('und', ['1-3-6']),
  R('von', ['1-2-3-6']),
  R('immer', ['1-3-4-6']),
  R('lasst', ['1-2-3']),
  R('welche', ['1-3-4-5-6']),
  R('zu', ['1-3-5-6']),
  R('gewesen', ['1-2-3-4-6']),
  R('es', ['1-2-3-4-5-6']),
  R('dem', ['1-2-3-5-6']),
  R('dass', ['2-3-4-6']),
  R('ist', ['2-3-4-5-6']),
  R('im', ['3-6']),
  R('ich', ['3-4-5-6']),
];

/** 3. Bir harfli kelime kısaltmaları — 3. grup */
export const ALMANCA_BIR_HARF_GRUP3 = [
  R('als', ['1-4-6']),
  R('durch', ['1-4-5-6']),
  R('schon', ['1-5-6']),
  R('ein', ['1-2-4-6']),
  R('er', ['1-2-4-5-6']),
  R('über', ['1-2-5-6']),
  R('in', ['3-5']),
  R('besonder', ['2-3']),
  R('unter', ['2-5-6']),
  R('vor', ['2-6']),
  R('an', ['2-3-5']),
  R('mehr', ['2-3-5-6']),
  R('ihm', ['2-3-6']),
  R('war', ['3-5-6']),
];

export const ALMANCA_BOLUMLER = [
  {
    slug: 'alfabe',
    kisaBaslik: 'Alfabe',
    pageBaslik: 'Almanca · Alfabe ve özel harfler',
    ilerlemeAnahtari: 'alm-braille-alfabe',
    veri: ALMANCA_ALFABE,
  },
  {
    slug: 'kelime-parca',
    kisaBaslik: 'Kelime parçası',
    pageBaslik: 'Almanca · Kelime parçalarına ait kısaltmalar',
    ilerlemeAnahtari: 'alm-braille-parca',
    veri: ALMANCA_KELIME_PARCA,
  },
  {
    slug: 'bir-harfli-1',
    kisaBaslik: 'Bir harfli (1)',
    pageBaslik: 'Almanca · Bir harfli kelime kısaltmaları (1)',
    ilerlemeAnahtari: 'alm-braille-bir1',
    veri: ALMANCA_BIR_HARF_GRUP1,
  },
  {
    slug: 'bir-harfli-2',
    kisaBaslik: 'Bir harfli (2)',
    pageBaslik: 'Almanca · Bir harfli kelime kısaltmaları (2)',
    ilerlemeAnahtari: 'alm-braille-bir2',
    veri: ALMANCA_BIR_HARF_GRUP2,
  },
  {
    slug: 'bir-harfli-3',
    kisaBaslik: 'Bir harfli (3)',
    pageBaslik: 'Almanca · Bir harfli kelime kısaltmaları (3)',
    ilerlemeAnahtari: 'alm-braille-bir3',
    veri: ALMANCA_BIR_HARF_GRUP3,
  },
];
