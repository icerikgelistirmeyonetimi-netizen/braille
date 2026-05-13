/**
 * İngilizce Braille (UEB — Unified English Braille) öğrenme içeriği.
 * Kaynak: BANA / ICEB UEB kuralları (2013 ve sonrası).
 * @typedef {{ ad: string, aciklama?: string, sembol?: string, hucreler: number[][], okumaOzeti?: string, kurallar?: string[] }} IngBrailleOge
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

const ING_KURAL_A_GENEL = [
  'Rakam göstergesinden (⠼) sonra “a” rakam 1 olur.',
  'Büyük harf için önce büyük harf göstergesi (⠠) konur.',
];

const ING_KURAL_GUCLU_GRUP = [
  'Güçlü grup işareti: kelime başında, ortasında ve sonunda kullanılır.',
  'Tek hecede telaffuz ediliyorsa tercih edilir.',
];

const ING_KURAL_ALT_BAS = [
  'Alt grup işareti: yalnızca kelime başında kullanılır.',
  'Hece sınırını veya bileşik kelime sınırını aşmaz.',
];

const ING_KURAL_ORTADA = [
  'Yalnızca iki harf arasında (kelime ortasında) kullanılır.',
  'Kelime başında ve sonunda yer almaz.',
];

const ING_KURAL_ING = [
  '“ing” grup işareti kelime başında kullanılmaz.',
  'Kelime ortasında ve sonunda kullanılır.',
];

const ING_KURAL_BLE = [
  'Yalnızca kelime sonunda kullanılır.',
];

const ING_KURAL_EA = [
  '“ea” yalnızca iki harf arasında kullanılır.',
  'Kelime başında ve sonunda kullanılmaz.',
];

const ING_KURAL_COMPOUND = [
  'Bileşik kelimede iki kök arasında köprü kurmaz (ör. inkjet, mishap).',
];

const ING_KURAL_TAM_KELIME = [
  'Alfabetik kelime işareti: harf, iki boşluk arasında tek başına yazıldığında bu kelime anlamına gelir.',
];

const ING_KURAL_TEK_HUCRE_KELIME = [
  'Tek hücreli kelime işareti: yalnız başına yazıldığında ilgili kelime anlamına gelir.',
];

const ING_KURAL_ALT_KELIME = [
  'Alt kelime işareti: yalnızca bağımsız (boşluklu) kelime olarak kullanılır.',
  'Bir başka kelimeye eklendiğinde alt grup işareti gibi davranır.',
];

const ING_KURAL_NOKTA5 = [
  'Nokta 5 öneki + harf: tek başına yazılan kelime işareti.',
  'Önek kendi başına anlam taşımaz.',
];

const ING_KURAL_NOKTA45 = [
  'Nokta 4-5 öneki + harf/grup: tek başına yazılan kelime işareti.',
];

const ING_KURAL_NOKTA456 = [
  'Nokta 4-5-6 öneki + harf/grup: tek başına yazılan kelime işareti.',
];

const ING_KURAL_SON_46 = [
  'Son harf grup işareti: nokta 4-6 + bir harf, kelime sonunda kullanılır.',
];

const ING_KURAL_SON_56 = [
  'Son harf grup işareti: nokta 5-6 + bir harf, kelime sonunda kullanılır.',
];

const ING_KURAL_SON_6 = [
  'Son harf grup işareti: nokta 6 + bir harf, kelime sonunda kullanılır.',
];

/* ───────────────────────────  1. Temel alfabe  ─────────────────────────── */
export const INGILIZCE_TEMEL_ALFABE = [
  R('a', ['1'], undefined, ING_KURAL_A_GENEL),
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

/* ─────────────────────  2. Grup işaretleri (kısaltmalar)  ───────────────── */
export const INGILIZCE_BASIT_KISALTMA = [
  R('ch', ['1-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('gh', ['1-2-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('sh', ['1-4-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('th', ['1-4-5-6'], 'Güçlü grup işareti, her konumda', [...ING_KURAL_GUCLU_GRUP, ...ING_KURAL_COMPOUND]),
  R('wh', ['1-5-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('ed', ['1-2-4-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('er', ['1-2-4-5-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('ou', ['1-2-5-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('ow', ['2-4-6'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('st', ['3-4'], 'Grup işareti veya tek başına “still”', ING_KURAL_GUCLU_GRUP),
  R('ar', ['3-4-5'], 'Güçlü grup işareti, her konumda', ING_KURAL_GUCLU_GRUP),
  R('ing', ['3-4-6'], 'Başta yok; ortada ve sonda', ING_KURAL_ING),
  R('ble', ['3-4-5-6'], 'Yalnız kelime sonunda', ING_KURAL_BLE),
  R('be', ['2-3'], 'Alt grup, yalnız kelime başında', ING_KURAL_ALT_BAS),
  R('con', ['2-5'], 'Alt grup, yalnız kelime başında', ING_KURAL_ALT_BAS),
  R('dis', ['2-5-6'], 'Alt grup, yalnız kelime başında', ING_KURAL_ALT_BAS),
  R('com', ['3-6'], 'Alt grup, yalnız kelime başında', ING_KURAL_ALT_BAS),
  R('en', ['2-6'], 'Grup işareti; tek başına “enough”'),
  R('in', ['3-5'], 'Grup işareti; tek başına “in”'),
  R('ea', ['2'], 'Yalnız kelime ortasında', ING_KURAL_EA),
  R('bb', ['2-3'], 'Yalnız ortada; hücre aynı: “be”', ING_KURAL_ORTADA),
  R('cc', ['2-5'], 'Yalnız ortada; hücre aynı: “con”', ING_KURAL_ORTADA),
  R('ff', ['2-3-5'], 'Yalnız ortada', ING_KURAL_ORTADA),
  R('dd', ['2-5-6'], 'Yalnız ortada; hücre aynı: “dis”', ING_KURAL_ORTADA),
  R('gg', ['2-3-5-6'], 'Yalnız ortada; hücre aynı: “were”', ING_KURAL_ORTADA),
];

/* ─────────  3. Tek hücreli kelime işaretleri (alfabetik + alt) ─────────── */
export const INGILIZCE_TEK_HARF_VE_EKLER = [
  // Alfabetik kelime işaretleri (a-z harflerinden türemiş)
  R('but', ['1-2'], '(ama) · b harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('can', ['1-4'], '(yapabilir) · c harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('do', ['1-4-5'], '(yapmak) · d harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('every', ['1-5'], '(her) · e harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('from', ['1-2-4'], '(-den) · f harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('go', ['1-2-4-5'], '(gitmek) · g harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('have', ['1-2-5'], '(sahip olmak) · h harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('just', ['2-4-5'], '(sadece) · j harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('knowledge', ['1-3'], '(bilgi) · k harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('like', ['1-2-3'], '(gibi) · l harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('more', ['1-3-4'], '(daha) · m harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('not', ['1-3-4-5'], '(değil) · n harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('people', ['1-2-3-4'], '(insanlar) · p harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('quite', ['1-2-3-4-5'], '(oldukça) · q harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('rather', ['1-2-3-5'], '(oldukça) · r harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('so', ['2-3-4'], '(öyle) · s harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('that', ['2-3-4-5'], '(şu) · t harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('us', ['1-3-6'], '(bizi) · u harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('very', ['1-2-3-6'], '(çok) · v harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('will', ['2-4-5-6'], '(gelecek yardımcı fiili) · w harfi, alfabetik', ING_KURAL_TAM_KELIME),
  R('it', ['1-3-4-6'], '(o, nesne) · x harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('you', ['1-3-4-5-6'], '(sen) · y harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),
  R('as', ['1-3-5-6'], '(gibi) · z harfi, alfabetik kelime', ING_KURAL_TAM_KELIME),

  // Güçlü kelime işaretleri (güçlü grup işaretiyle aynı hücreyi paylaşır)
  R('child', ['1-6'], '(çocuk) · ch hücresi, güçlü kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('shall', ['1-4-6'], '(“-ecek” yardımcı fiili) · sh hücresi', ING_KURAL_TEK_HUCRE_KELIME),
  R('this', ['1-4-5-6'], '(bu) · th hücresi, güçlü kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('which', ['1-5-6'], '(hangi) · wh hücresi, güçlü kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('out', ['1-2-5-6'], '(dışarı) · ou hücresi, güçlü kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('still', ['3-4'], '(hâlâ) · st hücresi, güçlü kelime', ING_KURAL_TEK_HUCRE_KELIME),

  // Tek hücreli (güçlü grup işareti olmayan) kelimeler
  R('and', ['1-2-3-4-6'], '(ve) · tek hücreli kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('for', ['1-2-3-4-5-6'], '(için) · tek hücreli kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('of', ['1-2-3-5-6'], '(-in) · tek hücreli kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('the', ['2-3-4-6'], '(belirteç) · tek hücreli kelime', ING_KURAL_TEK_HUCRE_KELIME),
  R('with', ['2-3-4-5-6'], '(ile) · tek hücreli kelime', ING_KURAL_TEK_HUCRE_KELIME),

  // Alt kelime işaretleri (lower wordsigns) — yalnız boşluklu, bağımsız kelime
  R('enough', ['2-6'], '(yeterli) · alt kelime işareti, en', ING_KURAL_ALT_KELIME),
  R('in', ['3-5'], '(-de / içinde) · alt kelime işareti', ING_KURAL_ALT_KELIME),
  R('his', ['2-3-6'], '(onun) · alt kelime işareti', ING_KURAL_ALT_KELIME),
  R('was', ['3-5-6'], '(idi) · alt kelime işareti', ING_KURAL_ALT_KELIME),
  R('were', ['2-3-5-6'], '(çoğul idi) · alt kelime işareti', ING_KURAL_ALT_KELIME),
  R('to', ['2-3-5'], '(-e / -a) · alt kelime işareti', [
    ...ING_KURAL_ALT_KELIME,
    '“to/into” takip eden kelimeye bitişik (boşluksuz) yazılır.',
  ]),
  R('into', ['3-5', '2-3-5'], '(içine) · in + to', ING_KURAL_ALT_KELIME),
];

/* ─────────────────  4. Çoklu sembol kelime işaretleri  ─────────────────── */
export const INGILIZCE_COKLU_SEMBOL = [
  // Nokta 5 ön ekli kelimeler
  R('day', ['5', '1-4-5'], '(gün) · 5 + d', ING_KURAL_NOKTA5),
  R('ever', ['5', '1-5'], '(her zaman) · 5 + e', ING_KURAL_NOKTA5),
  R('father', ['5', '1-2-4'], '(baba) · 5 + f', ING_KURAL_NOKTA5),
  R('here', ['5', '1-2-5'], '(burada) · 5 + h', ING_KURAL_NOKTA5),
  R('know', ['5', '1-3'], '(bilmek) · 5 + k', ING_KURAL_NOKTA5),
  R('lord', ['5', '1-2-3'], '(rab) · 5 + l', ING_KURAL_NOKTA5),
  R('mother', ['5', '1-3-4'], '(anne) · 5 + m', ING_KURAL_NOKTA5),
  R('name', ['5', '1-3-4-5'], '(isim) · 5 + n', ING_KURAL_NOKTA5),
  R('one', ['5', '1-3-5'], '(bir) · 5 + o', ING_KURAL_NOKTA5),
  R('part', ['5', '1-2-3-4'], '(parça) · 5 + p', ING_KURAL_NOKTA5),
  R('question', ['5', '1-2-3-4-5'], '(soru) · 5 + q', ING_KURAL_NOKTA5),
  R('right', ['5', '1-2-3-5'], '(doğru / sağ) · 5 + r', ING_KURAL_NOKTA5),
  R('some', ['5', '2-3-4'], '(bazı) · 5 + s', ING_KURAL_NOKTA5),
  R('time', ['5', '2-3-4-5'], '(zaman) · 5 + t', ING_KURAL_NOKTA5),
  R('under', ['5', '1-3-6'], '(altında) · 5 + u', ING_KURAL_NOKTA5),
  R('work', ['5', '2-4-5-6'], '(iş) · 5 + w', ING_KURAL_NOKTA5),
  R('young', ['5', '1-3-4-5-6'], '(genç) · 5 + y', ING_KURAL_NOKTA5),
  R('there', ['5', '2-3-4-6'], '(orada) · 5 + the', ING_KURAL_NOKTA5),
  R('character', ['5', '1-6'], '(karakter) · 5 + ch', ING_KURAL_NOKTA5),
  R('through', ['5', '1-4-5-6'], '(içinden) · 5 + th', ING_KURAL_NOKTA5),
  R('where', ['5', '1-5-6'], '(nerede) · 5 + wh', ING_KURAL_NOKTA5),
  R('ought', ['5', '1-2-5-6'], '(meli / malı) · 5 + ou', ING_KURAL_NOKTA5),

  // Nokta 4-5 ön ekli kelimeler
  R('upon', ['4-5', '1-3-6'], '(üzerine) · 4-5 + u', ING_KURAL_NOKTA45),
  R('these', ['4-5', '2-3-4-6'], '(bunlar) · 4-5 + the', ING_KURAL_NOKTA45),
  R('those', ['4-5', '1-4-5-6'], '(şunlar) · 4-5 + th', ING_KURAL_NOKTA45),
  R('whose', ['4-5', '1-5-6'], '(kimin) · 4-5 + wh', ING_KURAL_NOKTA45),
  R('word', ['4-5', '2-4-5-6'], '(kelime) · 4-5 + w', ING_KURAL_NOKTA45),

  // Nokta 4-5-6 ön ekli kelimeler
  R('cannot', ['4-5-6', '1-4'], '(yapamaz) · 4-5-6 + c', ING_KURAL_NOKTA456),
  R('had', ['4-5-6', '1-2-5'], '(sahipti) · 4-5-6 + h', ING_KURAL_NOKTA456),
  R('many', ['4-5-6', '1-3-4'], '(birçok) · 4-5-6 + m', ING_KURAL_NOKTA456),
  R('spirit', ['4-5-6', '2-3-4'], '(ruh) · 4-5-6 + s', ING_KURAL_NOKTA456),
  R('their', ['4-5-6', '2-3-4-6'], '(onların) · 4-5-6 + the', ING_KURAL_NOKTA456),
  R('world', ['4-5-6', '2-4-5-6'], '(dünya) · 4-5-6 + w', ING_KURAL_NOKTA456),
];

/* ───────────────  5. Birleşik ve özel kısaltmalar (shortforms)  ─────────── */
export const INGILIZCE_BIRLESIK_OZEL = [
  R('about', ['1', '1-2'], '(hakkında) · kısaltma: ab'),
  R('above', ['1', '1-2', '1-2-3-6'], '(yukarıda) · kısaltma: abv'),
  R('according', ['1', '1-4'], '(göre) · kısaltma: ac'),
  R('across', ['1', '1-4', '1-2-3-5'], '(karşıdan) · kısaltma: acr'),
  R('after', ['1', '1-2-4'], '(sonra) · kısaltma: af'),
  R('afternoon', ['1', '1-2-4', '1-3-4-5'], '(öğleden sonra) · kısaltma: afn'),
  R('afterward', ['1', '1-2-4', '2-4-5-6'], '(sonradan) · kısaltma: afw'),
  R('again', ['1', '1-2-4-5'], '(tekrar) · kısaltma: ag'),
  R('against', ['1', '1-2-4-5', '3-4'], '(karşı) · kısaltma: agst'),
  R('almost', ['1', '1-2-3', '1-3-4'], '(neredeyse) · kısaltma: alm'),
  R('already', ['1', '1-2-3', '1-2-3-5'], '(çoktan) · kısaltma: alr'),
  R('also', ['1', '1-2-3'], '(ayrıca) · kısaltma: al'),
  R('although', ['1', '1-2-3', '1-4-5-6'], '(her ne kadar) · kısaltma: alth'),
  R('altogether', ['1', '1-2-3', '2-3-4-5'], '(tamamen) · kısaltma: alt'),
  R('always', ['1', '1-2-3', '2-4-5-6'], '(her zaman) · kısaltma: alw'),

  R('because', ['2-3', '1-4'], '(çünkü) · kısaltma: bec'),
  R('before', ['2-3', '1-2-4'], '(önce) · kısaltma: bef'),
  R('behind', ['2-3', '1-2-5'], '(arkasında) · kısaltma: beh'),
  R('below', ['2-3', '1-2-3'], '(aşağıda) · kısaltma: bel'),
  R('beneath', ['2-3', '1-3-4-5'], '(altında) · kısaltma: ben'),
  R('beside', ['2-3', '2-3-4'], '(yanında) · kısaltma: bes'),
  R('between', ['2-3', '2-3-4-5'], '(arasında) · kısaltma: bet'),
  R('beyond', ['2-3', '1-3-4-5-6'], '(ötesinde) · kısaltma: bey'),
  R('blind', ['1-2', '1-2-3'], '(kör) · kısaltma: bl'),
  R('braille', ['1-2', '1-2-3-5', '1-2-3'], '(Braille) · kısaltma: brl'),

  R('children', ['1-6', '1-3-4-5'], '(çocuklar) · kısaltma: chn'),
  R('conceive', ['2-5', '1-4', '1-2-3-6'], '(kavramak) · kısaltma: concv'),
  R('could', ['1-4', '1-4-5'], '(yapabilirdi) · kısaltma: cd'),

  R('deceive', ['1-4-5', '1-4', '1-2-3-6'], '(aldatmak) · kısaltma: dcv'),
  R('declare', ['1-4-5', '1-4', '1-2-3'], '(beyan etmek) · kısaltma: dcl'),

  R('either', ['1-5', '2-4'], '(ikisinden biri) · kısaltma: ei'),
  R('first', ['1-2-4', '3-4'], '(ilk) · kısaltma: fst'),
  R('friend', ['1-2-4', '1-2-3-5'], '(arkadaş) · kısaltma: fr'),

  R('good', ['1-2-4-5', '1-4-5'], '(iyi) · kısaltma: gd'),
  R('great', ['1-2-4-5', '1-2-3-5', '2-3-4-5'], '(harika) · kısaltma: grt'),

  R('him', ['1-2-5', '1-3-4'], '(onu, erkek) · kısaltma: hm'),
  R('herself', ['1-2-5', '1-2-4-5-6', '1-2-4'], '(kendisi, kadın) · kısaltma: herf'),
  R('himself', ['1-2-5', '1-3-4', '1-2-4'], '(kendisi, erkek) · kısaltma: hmf'),

  R('immediate', ['2-4', '1-3-4', '1-3-4'], '(derhal) · kısaltma: imm'),
  R('its', ['1-3-4-6', '2-3-4'], '(onun, nesne) · kısaltma: xs'),
  R('itself', ['1-3-4-6', '1-2-4'], '(kendisi, nesne) · kısaltma: xf'),

  R('letter', ['1-2-3', '1-2-3-5'], '(mektup) · kısaltma: lr'),
  R('little', ['1-2-3', '1-2-3'], '(küçük) · kısaltma: ll'),

  R('much', ['1-3-4', '1-6'], '(çok) · kısaltma: mch'),
  R('must', ['1-3-4', '3-4'], '(zorunda) · kısaltma: mst'),
  R('myself', ['1-3-4', '1-3-4-5-6', '1-2-4'], '(kendim) · kısaltma: myf'),

  R('necessary', ['1-3-4-5', '1-5', '1-4'], '(gerekli) · kısaltma: nec'),
  R('neither', ['1-3-4-5', '1-5', '2-4'], '(hiçbiri) · kısaltma: nei'),

  R("o'clock", ['1-3-5', '3', '1-4'], '(saat) · kısaltma: o’c · 3 = kesme'),
  R('oneself', ['5', '1-3-5', '1-2-4'], '(kişi kendisi) · 5 + o + f'),
  R('ourselves', ['1-2-5-6', '1-2-3-5', '1-2-3-6', '2-3-4'], '(kendimiz) · kısaltma: oursvs'),

  R('paid', ['1-2-3-4', '1-4-5'], '(ödendi) · kısaltma: pd'),
  R('perceive', ['1-2-3-4', '1-2-4-5-6', '1-4', '1-2-3-6'], '(algılamak) · kısaltma: percv'),
  R('perhaps', ['1-2-3-4', '1-2-4-5-6', '1-2-5'], '(belki) · kısaltma: perh'),

  R('quick', ['1-2-3-4-5', '1-3'], '(hızlı) · kısaltma: qk'),

  R('receive', ['1-2-3-5', '1-4', '1-2-3-6'], '(almak) · kısaltma: rcv'),
  R('rejoice', ['1-2-3-5', '2-4-5', '1-4'], '(sevinmek) · kısaltma: rjc'),

  R('said', ['2-3-4', '1-4-5'], '(söyledi) · kısaltma: sd'),
  R('should', ['1-4-6', '1-4-5'], '(meli) · kısaltma: shd'),
  R('such', ['2-3-4', '1-6'], '(böyle) · kısaltma: sch'),

  R('today', ['2-3-4-5', '1-4-5'], '(bugün) · kısaltma: td'),
  R('together', ['2-3-4-5', '1-2-4-5', '1-2-3-5'], '(birlikte) · kısaltma: tgr'),
  R('tomorrow', ['2-3-4-5', '1-3-4'], '(yarın) · kısaltma: tm'),
  R('tonight', ['2-3-4-5', '1-3-4-5'], '(bu gece) · kısaltma: tn'),

  R('would', ['2-4-5-6', '1-4-5'], '(-ecekti) · kısaltma: wd'),
  R('your', ['1-3-4-5-6', '1-2-3-5'], '(senin) · kısaltma: yr'),
  R('yourself', ['1-3-4-5-6', '1-2-3-5', '1-2-4'], '(kendin) · kısaltma: yrf'),
  R('yourselves', ['1-3-4-5-6', '1-2-3-5', '1-2-3-6', '2-3-4'], '(kendiniz) · kısaltma: yrvs'),

  {
    ad: 'Not (kavramak / algılamak fiilleri + -ing)',
    aciklama: '“ceive” + -ing biçiminde sonda “ing” (3-4-6) kullanılır; “ing” başta yer almaz.',
    hucreler: [],
    okumaOzeti: '-ing sonda kullanılır',
  },
];

/* ───────────────  6. Kelime sonu (son harf grup işaretleri)  ───────────── */
export const INGILIZCE_KELIME_SONU = [
  // Nokta 4-6 + harf
  R('ound', ['4-6', '1-4-5'], '4-6 + d, kelime sonunda', ING_KURAL_SON_46),
  R('ance', ['4-6', '1-5'], '4-6 + e, kelime sonunda', ING_KURAL_SON_46),
  R('sion', ['4-6', '1-3-4-5'], '4-6 + n, kelime sonunda', ING_KURAL_SON_46),
  R('less', ['4-6', '2-3-4'], '4-6 + s, kelime sonunda', ING_KURAL_SON_46),
  R('ount', ['4-6', '2-3-4-5'], '4-6 + t, kelime sonunda', ING_KURAL_SON_46),

  // Nokta 5-6 + harf
  R('ence', ['5-6', '1-5'], '5-6 + e, kelime sonunda', ING_KURAL_SON_56),
  R('ong', ['5-6', '1-2-4-5'], '5-6 + g, kelime sonunda', ING_KURAL_SON_56),
  R('ful', ['5-6', '1-2-3'], '5-6 + l, kelime sonunda', ING_KURAL_SON_56),
  R('tion', ['5-6', '1-3-4-5'], '5-6 + n, kelime sonunda', ING_KURAL_SON_56),
  R('ness', ['5-6', '2-3-4'], '5-6 + s, kelime sonunda', ING_KURAL_SON_56),
  R('ment', ['5-6', '2-3-4-5'], '5-6 + t, kelime sonunda', ING_KURAL_SON_56),
  R('ity', ['5-6', '1-3-4-5-6'], '5-6 + y, kelime sonunda', ING_KURAL_SON_56),

  // Nokta 6 + harf
  R('ation', ['6', '1-3-4-5'], '6 + n, kelime sonunda', ING_KURAL_SON_6),
  R('ally', ['6', '1-3-4-5-6'], '6 + y, kelime sonunda', ING_KURAL_SON_6),
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
    kisaBaslik: 'Grup işaretleri',
    pageBaslik: 'İngilizce · Grup işaretleri',
    ilerlemeAnahtari: 'ing-braille-basit',
    veri: INGILIZCE_BASIT_KISALTMA,
  },
  {
    slug: 'tek-harf-ekler',
    kisaBaslik: 'Tek hücreli kelimeler',
    pageBaslik: 'İngilizce · Tek hücreli kelime işaretleri',
    ilerlemeAnahtari: 'ing-braille-tek-harf',
    veri: INGILIZCE_TEK_HARF_VE_EKLER,
  },
  {
    slug: 'coklu-sembol',
    kisaBaslik: 'Çoklu sembol',
    pageBaslik: 'İngilizce · Çoklu sembol kelime işaretleri',
    ilerlemeAnahtari: 'ing-braille-coklu',
    veri: INGILIZCE_COKLU_SEMBOL,
  },
  {
    slug: 'birlesik-ozel',
    kisaBaslik: 'Kısaltmalar',
    pageBaslik: 'İngilizce · Birleşik ve özel kısaltmalar',
    ilerlemeAnahtari: 'ing-braille-birlesik',
    veri: INGILIZCE_BIRLESIK_OZEL,
  },
  {
    slug: 'kelime-sonu',
    kisaBaslik: 'Kelime sonu',
    pageBaslik: 'İngilizce · Son harf grup işaretleri',
    ilerlemeAnahtari: 'ing-braille-son',
    veri: INGILIZCE_KELIME_SONU,
  },
];
