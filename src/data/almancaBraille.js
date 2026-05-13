/**
 * Almanca Braille (Deutsche Vollschrift / Kurzschrift) öğrenme içeriği.
 * Kaynak: DBSV / SBS yayınları, “Das System der deutschen Brailleschrift”.
 * @typedef {{ ad: string, aciklama?: string, sembol?: string, hucreler: number[][], okumaOzeti?: string, kurallar?: string[] }} AlmBrailleOge
 */

function dc(...dotGroups) {
  return dotGroups.map((g) => g.split('-').map(Number));
}

/**
 * @param {string} ad
 * @param {string[]} grup
 * @param {string} [aciklama]
 * @param {string[]} [kurallar]
 * @param {string} [okumaOzeti]
 */
function R(ad, grup, aciklama, kurallar, okumaOzeti) {
  const o = { ad, hucreler: dc(...grup) };
  if (aciklama) o.aciklama = aciklama;
  if (kurallar && kurallar.length > 0) o.kurallar = kurallar;
  if (okumaOzeti) o.okumaOzeti = okumaOzeti;
  return o;
}

/* ───────────────────────────  Kural metinleri  ─────────────────────────── */

const DE_KURAL_A_SAYI = [
  'Rakam göstergesinden (⠼) sonra “a” rakam 1 olur.',
  'Büyük harf için önce büyük harf göstergesi (⠠) konur.',
  'Şüphede tam yazım (Vollschrift) tercih edilir.',
];

const DE_KURAL_LAUTGRUPPE = [
  'Lautgruppenkürzung: harfler aynı hecede telaffuz edildiğinde kullanılır.',
  'Hece sınırını veya Wortfuge’yi (kelime birleşim noktası) aşmaz.',
];

const DE_KURAL_WORTFUGE = [
  'Wortfuge (birleşik kelime sınırı) aşılmaz: ge-hen ✓ · Spiegel-ei ✗.',
];

const DE_KURAL_ST = [
  '“st” Lautgruppe yalnızca aynı hecede olduğunda kullanılır.',
  'Hece ayrımında (s | t) tam yazım yapılır.',
];

const DE_KURAL_BE = [
  '“be” yalnızca ses dizisi birlikte okunduğunda kullanılır.',
  'Özel adlarda şüphede tam yazım yapılır.',
];

const DE_KURAL_TEK_KELIME = [
  'Bir harfli kelime kısaltması: harf, iki boşluk arasında tek başına yazıldığında bu kelime anlamına gelir.',
];

/* ─────────────────────  1. Alfabe ve özel harfler  ─────────────────────── */
export const ALMANCA_ALFABE = [
  R('a', ['1'], undefined, DE_KURAL_A_SAYI),
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
  R('ä', ['3-4-5'], 'a umlaut'),
  R('ö', ['2-4-6'], 'o umlaut'),
  R('ü', ['1-2-5-6'], 'u umlaut'),
];

/* ─────────────  2. Lautgruppen / kelime parçası kısaltmaları  ───────────── */
export const ALMANCA_KELIME_PARCA = [
  R('au', ['1-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('eu', ['1-2-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('ei', ['1-4-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('äu', ['3-4'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('ch', ['1-4-5-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('sch', ['1-5-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('ie', ['3-4-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('st', ['2-3-4-5-6'], 'Lautgruppe', DE_KURAL_ST),
  R('ck', ['4-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('ss', ['2-3-4-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('ll', ['1-2-3-4-5'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('mm', ['1-3-4-6'], 'Lautgruppe', DE_KURAL_LAUTGRUPPE),
  R('en', ['1-4'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('el', ['1-3-4-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('em', ['1-2-3-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('es', ['1-2-3-4-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('te', ['2-3-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('ge', ['1-2-3-4-6'], 'Önek', DE_KURAL_WORTFUGE),
  R('be', ['2-3'], 'Önek', DE_KURAL_BE),
  R('ver', ['3-6'], 'Önek', DE_KURAL_LAUTGRUPPE),
  R('ein', ['1-2-4-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('er', ['1-2-4-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('in', ['3-5'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('an', ['2-3-5'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('al', ['2-5'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('un', ['2-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('ar', ['3-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('or', ['2-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('eh', ['2-3-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('ig', ['4-5'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('ach', ['5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('ich', ['3-4-5-6'], 'Kelime parçası', DE_KURAL_LAUTGRUPPE),
  R('lich', ['4-5-6'], 'Son ek', DE_KURAL_LAUTGRUPPE),
];

/* ────────  3. Bir harfli kelime kısaltmaları — 1. grup (a–j hücreleri)  ──── */
export const ALMANCA_BIR_HARF_GRUP1 = [
  R('aber', ['1'], '(ama)', DE_KURAL_TEK_KELIME),
  R('bei', ['1-2'], '(yanında / -de)', DE_KURAL_TEK_KELIME),
  R('sich', ['1-4'], '(kendisi, dönüşlü)', DE_KURAL_TEK_KELIME),
  R('das', ['1-4-5'], '(o / şu, nötr)', DE_KURAL_TEK_KELIME),
  R('den', ['1-5'], '(o, eril akuzatif / çoğul datif)', DE_KURAL_TEK_KELIME),
  R('für', ['1-2-4'], '(için)', DE_KURAL_TEK_KELIME),
  R('gegen', ['1-2-4-5'], '(karşı)', DE_KURAL_TEK_KELIME),
  R('hatte', ['1-2-5'], '(sahipti)', DE_KURAL_TEK_KELIME),
  R('ihr', ['2-4'], '(siz / onun, kadın)', DE_KURAL_TEK_KELIME),
  R('jetzt', ['2-4-5'], '(şimdi)', DE_KURAL_TEK_KELIME),
  R('auch', ['3-4'], '(ayrıca)', DE_KURAL_TEK_KELIME),
  R('hätte', ['3-4-5'], '(sahip olurdu)', DE_KURAL_TEK_KELIME),
  R('die', ['3-4-6'], '(belirteç, kadın / çoğul)', DE_KURAL_TEK_KELIME),
  R('auf', ['1-6'], '(üstünde / -e)', DE_KURAL_TEK_KELIME),
  R('wie', ['1-2-6'], '(nasıl)', DE_KURAL_TEK_KELIME),
];

/* ────────  3. Bir harfli kelime kısaltmaları — 2. grup (k–t hücreleri)  ──── */
export const ALMANCA_BIR_HARF_GRUP2 = [
  R('kann', ['1-3'], '(yapabilir)', DE_KURAL_TEK_KELIME),
  R('lasst', ['1-2-3'], '(bırakın)', DE_KURAL_TEK_KELIME),
  R('man', ['1-3-4'], '(insan / kişi, genel özne)', DE_KURAL_TEK_KELIME),
  R('nicht', ['1-3-4-5'], '(değil)', DE_KURAL_TEK_KELIME),
  R('oder', ['1-3-5'], '(veya)', DE_KURAL_TEK_KELIME),
  R('so', ['1-2-3-4'], '(öyle / böyle)', DE_KURAL_TEK_KELIME),
  R('voll', ['1-2-3-4-5'], '(dolu)', DE_KURAL_TEK_KELIME),
  R('der', ['1-2-3-5'], '(belirteç, eril)', DE_KURAL_TEK_KELIME),
  R('sie', ['2-3-4'], '(o, kadın / onlar)', DE_KURAL_TEK_KELIME),
  R('mit', ['2-3-4-5'], '(ile)', DE_KURAL_TEK_KELIME),
  R('sein', ['2-4-6'], '(olmak / onun, eril)', DE_KURAL_TEK_KELIME),
  R('was', ['2-4-5-6'], '(ne)', DE_KURAL_TEK_KELIME),
  R('des', ['3'], '(o, genitif eril)', DE_KURAL_TEK_KELIME),
];

/* ────────  3. Bir harfli kelime kısaltmaları — 3. grup (u–z + umlaut)  ──── */
export const ALMANCA_BIR_HARF_GRUP3 = [
  R('und', ['1-3-6'], '(ve)', DE_KURAL_TEK_KELIME),
  R('von', ['1-2-3-6'], '(-den / -dan)', DE_KURAL_TEK_KELIME),
  R('welche', ['1-3-4-5-6'], '(hangi)', DE_KURAL_TEK_KELIME),
  R('zu', ['1-3-5-6'], '(-e / çok)', DE_KURAL_TEK_KELIME),
  R('immer', ['1-3-4-6'], '(daima)', DE_KURAL_TEK_KELIME),
  R('gewesen', ['1-2-3-4-6'], '(olmuş)', DE_KURAL_TEK_KELIME),
  R('es', ['1-2-3-4-5-6'], '(o, nötr)', DE_KURAL_TEK_KELIME),
  R('dem', ['1-2-3-5-6'], '(o, eril / nötr datif)', DE_KURAL_TEK_KELIME),
  R('dass', ['2-3-4-6'], '(-diği)', DE_KURAL_TEK_KELIME),
  R('ist', ['2-3-4-5-6'], '(-dir)', DE_KURAL_TEK_KELIME),
  R('im', ['3-6'], '(içinde, in + dem)', DE_KURAL_TEK_KELIME),
  R('ich', ['3-4-5-6'], '(ben)', DE_KURAL_TEK_KELIME),
  R('als', ['1-4-6'], '(olarak / iken)', DE_KURAL_TEK_KELIME),
  R('durch', ['1-4-5-6'], '(aracılığıyla)', DE_KURAL_TEK_KELIME),
  R('schon', ['1-5-6'], '(zaten)', DE_KURAL_TEK_KELIME),
  R('ein', ['1-2-4-6'], '(bir)', DE_KURAL_TEK_KELIME),
  R('er', ['1-2-4-5-6'], '(o, eril)', DE_KURAL_TEK_KELIME),
  R('über', ['1-2-5-6'], '(üzerinde / hakkında)', DE_KURAL_TEK_KELIME),
  R('in', ['3-5'], '(içinde)', DE_KURAL_TEK_KELIME),
  R('besonder', ['2-3'], '(özel)', DE_KURAL_TEK_KELIME),
  R('unter', ['2-5-6'], '(altında)', DE_KURAL_TEK_KELIME),
  R('vor', ['2-6'], '(önünde)', DE_KURAL_TEK_KELIME),
  R('an', ['2-3-5'], '(-de / -da)', DE_KURAL_TEK_KELIME),
  R('mehr', ['2-3-5-6'], '(daha fazla)', DE_KURAL_TEK_KELIME),
  R('ihm', ['2-3-6'], '(ona, eril)', DE_KURAL_TEK_KELIME),
  R('war', ['3-5-6'], '(idi)', DE_KURAL_TEK_KELIME),
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
    pageBaslik: 'Almanca · Lautgruppen / kelime parçası',
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
