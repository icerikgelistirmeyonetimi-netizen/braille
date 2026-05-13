/**
 * İngilizce Braille (UEB) özet referansı — öğrenme içeriği.
 * @typedef {{ ad: string, aciklama?: string, sembol?: string, hucreler: number[][] }} IngBrailleOge
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

/** Yalnızca ilgili kısaltma kartında gösterilir (genel metin eklenmez). */
const ING_DETAY_BE = [
  'Alt grupsayı “be” (2-3): yalnız başta · ortada/sonda kullanılmaz',
];
const ING_DETAY_CON = [
  'Alt grupsayı “con” (2-5): yalnız başta · ortada/sonda kullanılmaz',
];
const ING_DETAY_DIS = [
  'Alt grupsayı “dis” (2-5-6): yalnız başta · ortada/sonda kullanılmaz',
];
const ING_DETAY_ING = [
  '“ing”: başta yok · ortada veya sonda',
];
const ING_DETAY_EA = [
  '“ea”: yalnız kelime ortasında · başta/sonda yok',
];
const ING_DETAY_COMPOUND = [
  'Bileşik kelimede iki kök arasında köprü yok (“th”, “st” vb.)',
];

const ING_DETAY_A_GENEL = [
  'Rakam göstergesi sonrası “a” = rakam 1',
  'Büyük harf göstergesi gerekirse önde',
  'Şüphede harf harf yazım',
];

/** 1. Temel alfabe */
export const INGILIZCE_TEMEL_ALFABE = [
  R('a', ['1'], undefined, ING_DETAY_A_GENEL),
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
];

/** 2. Basit kısaltmalar */
export const INGILIZCE_BASIT_KISALTMA = [
  R('ch', ['1-6']),
  R('gh', ['1-2-6']),
  R('sh', ['1-4-6']),
  R('th', ['1-4-5-6'], undefined, ING_DETAY_COMPOUND),
  R('wh', ['1-5-6']),
  R('ed', ['1-2-4-6']),
  R('er', ['1-2-4-5-6']),
  R('ou', ['1-2-5-6']),
  R('ow', ['2-4-6']),
  R('be', ['2-3'], undefined, ING_DETAY_BE),
  R('en', ['2-6']),
  R('con', ['2-5'], undefined, ING_DETAY_CON),
  R('dis', ['2-5-6'], undefined, ING_DETAY_DIS),
  R('by', ['3-5-6'], 'Önekte de kullanılabilir'),
  R('st', ['3-4'], undefined, ING_DETAY_COMPOUND),
  R('ing', ['3-4-6'], undefined, ING_DETAY_ING),
  R('ble', ['3-4-5-6']),
  R('ar', ['3-4-5']),
  R('com', ['3-6']),
  R('ea', ['2'], 'Yalnız kelime ortasında', ING_DETAY_EA),
  R('bb', ['2-3'], 'Yalnız ortada'),
  R('cc', ['2-5'], 'Yalnız ortada'),
  R('ff', ['2-3-5'], 'Yalnız ortada'),
  R('dd', ['2-5-6'], 'Yalnız ortada'),
  R('gg', ['2-3-5-6'], 'Yalnız ortada'),
];

/** 3. Tek harfli kelime işaretleri ve ekler */
export const INGILIZCE_TEK_HARF_VE_EKLER = [
  R('but', ['1-2'], 'Tam kelime · harf b'),
  R('can', ['1-4'], 'Tam kelime · c'),
  R('do', ['1-4-5'], 'Tam kelime · d'),
  R('every', ['1-5'], 'Tam kelime · e'),
  R('from', ['1-2-4'], 'Tam kelime · f'),
  R('go', ['1-2-4-5'], 'Tam kelime · g'),
  R('have', ['1-2-5'], 'Tam kelime · h'),
  R('just', ['2-4-5'], 'Tam kelime · j'),
  R('knowledge', ['1-3'], 'Tam kelime · k'),
  R('like', ['1-2-3'], 'Tam kelime · l'),
  R('more', ['1-3-4'], 'Tam kelime · m'),
  R('not', ['1-3-4-5'], 'Tam kelime · n'),
  R('people', ['1-2-3-4'], 'Tam kelime · p'),
  R('quite', ['1-2-3-4-5'], 'Tam kelime · q'),
  R('rather', ['1-2-3-5'], 'Tam kelime · r'),
  R('so', ['2-3-4'], 'Tam kelime · s'),
  R('that', ['2-3-4-5'], 'Tam kelime · t'),
  R('will', ['2-4-5-6'], 'Tam kelime · w'),
  R('it', ['1-3-4-6'], 'Tam kelime · x'),
  R('you', ['1-3-4-5-6'], 'Tam kelime · y'),
  R('as', ['1-3-5-6'], 'Tam kelime · z'),
  R('and', ['1-2-3-4-6']),
  R('for', ['1-2-3-4-5-6']),
  R('of', ['1-2-3-5-6']),
  R('the', ['2-3-4-6']),
  R('with', ['2-3-4-5-6']),
  R('child', ['1-6']),
  R('shall', ['1-4-6']),
  R('this', ['1-4-5-6']),
  R('which', ['1-5-6']),
  R('out', ['1-2-5-6']),
  R('enough', ['2-6']),
  R('to', ['2-3-5']),
  R('into', ['3-5', '2-3-5']),
  R('was', ['3-5-6']),
  R('in', ['3-5']),
  R('his', ['2-3-6']),
  R('us', ['1-3-6']),
  R('very', ['1-2-3-6']),
  R('still', ['3-4']),
];

/** 4. Çoklu sembol kısaltmaları */
export const INGILIZCE_COKLU_SEMBOL = [
  R('day', ['5', '1-4-5']),
  R('ever', ['5', '1-5']),
  R('father', ['5', '1-2-4']),
  R('her', ['5', '1-2-5']),
  R('know', ['5', '1-3']),
  R('lord', ['5', '1-2-3']),
  R('mother', ['5', '1-3-4']),
  R('name', ['5', '1-3-4-5']),
  R('one', ['5', '1-3-5']),
  R('part', ['5', '1-2-3-4']),
  R('question', ['5', '1-2-3-4-5']),
  R('right', ['5', '1-2-3-5']),
  R('some', ['5', '2-3-4']),
  R('time', ['5', '2-3-4-5']),
  R('under', ['5', '1-3-6']),
  R('work', ['5', '2-4-5-6']),
  R('young', ['5', '1-3-4-5-6']),
  R('there', ['5', '2-3-4-6']),
  R('character', ['5', '1-6']),
  R('through', ['5', '1-4-5-6']),
  R('where', ['5', '1-5-6']),
  R('ought', ['5', '1-2-5-6']),
  R('upon', ['4-5', '1-3-6']),
  R('these', ['4-5', '2-3-4-6']),
  R('whose', ['4-5', '1-5-6']),
  R('word', ['4-5', '2-4-5-6']),
  R('those', ['4-5', '1-4-5-6']),
  R('cannot', ['4-5-6', '1-4']),
  R('many', ['4-5-6', '1-3-4']),
  R('world', ['4-5-6', '2-4-5-6']),
  R('had', ['4-5-6', '1-2-5']),
  R('spirit', ['4-5-6', '2-3-4']),
  R('their', ['4-5-6', '2-3-4-6']),
];

/** 5. Birleşik ve özel kısaltmalar */
export const INGILIZCE_BIRLESIK_OZEL = [
  R('about', ['1', '1-2']),
  R('according', ['1', '1-4']),
  R('after', ['1', '1-2-4']),
  R('afterward', ['1', '1-2-4', '2-4-5-6']),
  R('against', ['1', '1-2-4-5', '3-4']),
  R('almost', ['1', '1-2-3', '1-3-4']),
  R('altogether', ['1', '1-2-3', '2-3-4-5']),
  R('always', ['1', '1-2-3', '2-4-5-6']),
  R('above', ['1', '1-2', '1-2-3-6']),
  R('across', ['1', '1-4', '1-2-3-5']),
  R('afternoon', ['1', '1-2-4', '1-3-4-5']),
  R('again', ['1', '1-2-4-5']),
  R('also', ['1', '1-2-3']),
  R('already', ['1', '1-2-3', '1-2-3-5']),
  R('although', ['1', '1-2-3', '1-4-5-6']),
  R('because', ['2-3', '1-4']),
  R('behind', ['2-3', '1-2-5']),
  R('beneath', ['2-3', '1-3-4-5']),
  R('between', ['2-3', '2-3-4-5']),
  R('before', ['2-3', '1-2-4']),
  R('below', ['2-3', '1-2-3']),
  R('beside', ['2-3', '2-3-4']),
  R('beyond', ['2-3', '1-3-4-5-6']),
  R('blind', ['1-2', '1-2-3']),
  R('braille', ['1-2', '1-2-3-5', '1-2-3']),
  R('children', ['1-6', '1-3-4-5']),
  R('could', ['1-4', '1-4-5']),
  R('should', ['1-4-6', '1-4-5']),
  R('would', ['2-4-5-6', '1-4-5']),
  R('conceive', ['2-5', '2-3-4', '1-2-3-6']),
  R('deceive', ['1-4-5', '1-4', '1-2-3-6']),
  R('perceive', ['1-2-3-4', '1-2-4-5-6', '1-4', '1-2-3-6']),
  R('receive', ['1-2-3-5', '1-4', '1-2-3-6']),
  R('declare', ['1-4-5', '1-4', '1-2-3']),
  R('rejoice', ['1-2-3-5', '2-4-5', '1-4']),
  {
    ad: 'Not (fiil türevleri, -ing)',
    aciklama: 'ceive + -ing: sonda ing (1-2-4-5) · ing başta kullanılmaz',
    hucreler: [],
  },
  R('either', ['1-5', '2-4']),
  R('neither', ['1-3-4-5', '1-5', '2-4']),
  R('friend', ['1-2-4', '1-2-3-5']),
  R('first', ['1-2-4', '3-4']),
  R('good', ['1-2-4-5', '1-4-5']),
  R('great', ['1-2-4-5', '1-2-3-5', '2-3-4-5']),
  R('immediate', ['2-4', '1-3-4', '1-3-4']),
  R('little', ['1-2-3', '1-2-3']),
  R('letter', ['1-2-3', '1-2-3-5']),
  R('must', ['1-3-4', '3-4']),
  R('much', ['1-3-4', '1-6']),
  R('such', ['2-3-4', '1-6']),
  R('necessary', ['1-3-4-5', '1-5', '1-4']),
  R('together', ['2-3-4-5', '1-2-4-5', '1-2-3-5']),
  R('today', ['2-3-4-5', '1-4-5']),
  R('tomorrow', ['2-3-4-5', '1-3-4']),
  R('tonight', ['2-3-4-5', '1-3-4-5']),
  R('him', ['1-2-5', '1-3-4']),
  R('your', ['1-3-4-5-6', '1-2-3-5']),
  R('myself', ['1-3-4', '1-3-4-5-6', '1-2-4']),
  R('himself', ['1-2-5', '1-3-4', '1-2-4']),
  R('herself', ['1-2-5', '1-2-4-5-6', '1-2-4']),
  R('itself', ['1-3-4-6', '1-2-4']),
  R('oneself', ['5', '1-3-5', '1-2-4']),
  R('ourselves', ['1-2-5-6', '1-2-3-5', '1-2-3-6', '2-3-4']),
];

/** 6. Kelime sonu kısaltmaları (sonekler) */
export const INGILIZCE_KELIME_SONU = [
  R('ound', ['4-6', '1-4-5']),
  R('ance', ['4-6', '1-5']),
  R('sion', ['4-6', '1-3-4-5']),
  R('less', ['4-6', '2-3-4']),
  R('ount', ['4-6', '2-3-4-5']),
  R('ence', ['5-6', '1-5']),
  R('oung', ['5-6', '1-2-4-5']),
  R('ful', ['5-6', '1-2-3']),
  R('tion', ['5-6', '1-3-4-5']),
  R('ness', ['5-6', '2-3-4']),
  R('ment', ['5-6', '2-3-4-5']),
  R('ity', ['5-6', '1-3-4-5-6']),
  R('ation', ['6', '1-3-4-5']),
  R('ally', ['6', '1-3-4-5-6']),
];

export const INGILIZCE_BOLUMLER = [
  {
    slug: 'temel-alfabe',
    kisaBaslik: 'Alfabe',
    pageBaslik: 'İngilizce · Temel alfabe',
    ilerlemeAnahtari: 'ing-braille-temel',
    veri: INGILIZCE_TEMEL_ALFABE,
  },
  {
    slug: 'basit-kisaltmalar',
    kisaBaslik: 'Basit kısaltma',
    pageBaslik: 'İngilizce · Basit kısaltmalar',
    ilerlemeAnahtari: 'ing-braille-basit',
    veri: INGILIZCE_BASIT_KISALTMA,
  },
  {
    slug: 'tek-harf-ekler',
    kisaBaslik: 'Tek harf / ekler',
    pageBaslik: 'İngilizce · Tek harfli kelimeler ve ekler',
    ilerlemeAnahtari: 'ing-braille-tek-harf',
    veri: INGILIZCE_TEK_HARF_VE_EKLER,
  },
  {
    slug: 'coklu-sembol',
    kisaBaslik: 'Çoklu sembol',
    pageBaslik: 'İngilizce · Çoklu sembol kısaltmaları',
    ilerlemeAnahtari: 'ing-braille-coklu',
    veri: INGILIZCE_COKLU_SEMBOL,
  },
  {
    slug: 'birlesik-ozel',
    kisaBaslik: 'Birleşik / özel',
    pageBaslik: 'İngilizce · Birleşik ve özel kısaltmalar',
    ilerlemeAnahtari: 'ing-braille-birlesik',
    veri: INGILIZCE_BIRLESIK_OZEL,
  },
  {
    slug: 'kelime-sonu',
    kisaBaslik: 'Kelime sonu',
    pageBaslik: 'İngilizce · Kelime sonu kısaltmaları',
    ilerlemeAnahtari: 'ing-braille-son',
    veri: INGILIZCE_KELIME_SONU,
  },
];
