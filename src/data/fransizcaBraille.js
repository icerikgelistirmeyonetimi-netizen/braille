/**
 * Fransızca Braille — standart alfabe, aksanlı harfler ve braille abrégé kısaltmaları.
 * Kaynak: AVH / Commission Évolution du Braille Français (CEBF).
 * @typedef {{ ad: string, aciklama?: string, sembol?: string, hucreler: number[][], okumaOzeti?: string, kurallar?: string[] }} FraBrailleOge
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

const FR_KURAL_A_SAYI = [
  'Rakam göstergesinden (⠼) sonra “a” rakam 1 olur.',
  'Büyük harf için önce büyük harf göstergesi (⠨) konur.',
  'Şüphede tam yazım (braille intégral) tercih edilir.',
];

const FR_KURAL_AKSAN = [
  'Aksanlı harfler tam yazımda olduğu gibi yazılır; kısaltmalarla karıştırılmaz.',
];

const FR_KURAL_TEK_KELIME = [
  'Bir harfli kelime kısaltması: harf, iki boşluk arasında tek başına yazıldığında bu kelime anlamına gelir.',
];

const FR_KURAL_LE = [
  'Elision: kesme korunur (l’, c’, d’, j’, m’, n’, s’, t’).',
  'Bitişik durumda harf harf yazılır.',
];

const FR_KURAL_AU = [
  '“au” yalnız tek hecede kullanılır.',
  'Şüphede tam yazım yapılır.',
];

const FR_KURAL_QUE = [
  '“que” yalnız aynı hece içinde kullanılır.',
  'Hece veya kök sınırını aşmaz.',
];

const FR_KURAL_EN = [
  '“en” yalnız tek hecede kullanılır.',
];

const FR_KURAL_OU = [
  '“ou” yalnız tek hecede kullanılır.',
];

const FR_KURAL_ON = [
  '“on” yalnız tek hecede kullanılır.',
];

const FR_KURAL_AN = [
  '“an” yalnız tek hecede kullanılır.',
];

const FR_KURAL_PARCA = [
  'Kelime parçası kısaltması: aynı hecede telaffuz edildiğinde kullanılır.',
  'Hece sınırını veya tireli bileşik kelime sınırını aşmaz.',
];

const FR_KURAL_CH = [
  '“ch” aynı hece içinde kullanılır.',
  'Tireli bileşik kelimelerde köprü oluşturmaz.',
];

/* ─────────────────────────  Alfabe (a–z)  ───────────────────────────────── */
export const FRANSIZCA_ALFABE_AJ = [
  R('a', ['1'], undefined, FR_KURAL_A_SAYI),
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

export const FRANSIZCA_ALFABE_UZ = [
  R('u', ['1-3-6']),
  R('v', ['1-2-3-6']),
  R('w', ['2-4-5-6']),
  R('x', ['1-3-4-6']),
  R('y', ['1-3-4-5-6']),
  R('z', ['1-3-5-6']),
];

/* ─────────────────────  Aksanlı harfler  ────────────────────────────────── */
export const FRANSIZCA_ALFABE_AKSAN = [
  R('é', ['1-2-3-4-5-6'], 'e accent aigu', FR_KURAL_AKSAN),
  R('à', ['1-2-3-5-6'], 'a accent grave', FR_KURAL_AKSAN),
  R('è', ['2-3-4-6'], 'e accent grave', FR_KURAL_AKSAN),
  R('ù', ['2-3-4-5-6'], 'u accent grave', FR_KURAL_AKSAN),
  R('â', ['1-6'], 'a accent circonflexe', FR_KURAL_AKSAN),
  R('ê', ['1-2-6'], 'e accent circonflexe', FR_KURAL_AKSAN),
  R('î', ['1-4-6'], 'i accent circonflexe', FR_KURAL_AKSAN),
  R('ô', ['1-4-5-6'], 'o accent circonflexe', FR_KURAL_AKSAN),
  R('û', ['1-2-5-6'], 'u accent circonflexe', FR_KURAL_AKSAN),
  R('ë', ['1-2-4-6'], 'e tréma', FR_KURAL_AKSAN),
  R('ï', ['1-2-4-5-6'], 'i tréma', FR_KURAL_AKSAN),
  R('ç', ['1-2-3-4-6'], 'c cédille', FR_KURAL_AKSAN),
];

/* ────────────  Bir harfli kelime kısaltmaları (braille abrégé)  ─────────── */
export const FRANSIZCA_BIR_HARF_GRUP1 = [
  R('bien', ['1-2'], '(iyi)', FR_KURAL_TEK_KELIME),
  R('ce', ['1-4'], '(bu)', FR_KURAL_TEK_KELIME),
  R('de', ['1-4-5'], '(-in / -den)', FR_KURAL_TEK_KELIME),
  R('faire', ['1-2-4'], '(yapmak)', FR_KURAL_TEK_KELIME),
  R('qui', ['1-2-4-5'], '(kim / hangi)', FR_KURAL_TEK_KELIME),
  R('sur', ['1-2-5'], '(üzerinde)', FR_KURAL_TEK_KELIME),
  R('il', ['2-4'], '(o, eril)', FR_KURAL_TEK_KELIME),
  R('je', ['2-4-5'], '(ben)', FR_KURAL_TEK_KELIME),
  R('au', ['1-3'], '(-e, à + le)', [...FR_KURAL_TEK_KELIME, ...FR_KURAL_AU]),
  R('le', ['1-2-3'], '(belirteç, eril)', [...FR_KURAL_TEK_KELIME, ...FR_KURAL_LE]),
  R('me', ['1-3-4'], '(beni / bana)', FR_KURAL_TEK_KELIME),
  R('ne', ['1-3-4-5'], '(olumsuzluk, … pas)', FR_KURAL_TEK_KELIME),
  R('nous', ['1-3-5'], '(biz)', FR_KURAL_TEK_KELIME),
  R('tout', ['1-6'], '(hepsi / tüm)', FR_KURAL_TEK_KELIME),
  R('même', ['1-2-6'], '(aynı / bile)', FR_KURAL_TEK_KELIME),
  R('cet', ['1-4-6'], '(bu, eril sesli önce)', FR_KURAL_TEK_KELIME),
  R('dans', ['1-4-5-6'], '(içinde)', FR_KURAL_TEK_KELIME),
];

export const FRANSIZCA_BIR_HARF_GRUP2 = [
  R('que', ['1-2-3-4-5'], '(ki / -diği)', [...FR_KURAL_TEK_KELIME, ...FR_KURAL_QUE]),
  R('rien', ['1-2-3-5'], '(hiçbir şey)', FR_KURAL_TEK_KELIME),
  R('se', ['2-3-4'], '(kendisi, dönüşlü)', FR_KURAL_TEK_KELIME),
  R('te', ['2-3-4-5'], '(seni / sana)', FR_KURAL_TEK_KELIME),
  R('un', ['1-3-6'], '(bir, eril)', FR_KURAL_TEK_KELIME),
  R('vous', ['1-2-3-6'], '(siz)', FR_KURAL_TEK_KELIME),
  R('mais', ['1-3-4-6'], '(ama)', FR_KURAL_TEK_KELIME),
  R('elle', ['1-3-5-6'], '(o, kadın)', FR_KURAL_TEK_KELIME),
  R('pour', ['1-2-3-4-6'], '(için)', FR_KURAL_TEK_KELIME),
  R('quoi', ['1-2-3-4-5-6'], '(ne)', FR_KURAL_TEK_KELIME),
  R('sans', ['2-3-4-6'], '(-sız / -siz)', FR_KURAL_TEK_KELIME),
  R('et', ['2-3-4-5-6'], '(ve)', FR_KURAL_TEK_KELIME),
  R('per', ['1-2-3-4'], '(per- öneki / par)', FR_KURAL_TEK_KELIME),
  R('en', ['2-6'], '(içinde / ondan)', [...FR_KURAL_TEK_KELIME, ...FR_KURAL_EN]),
  R('puis', ['2-3-5'], '(sonra)', FR_KURAL_TEK_KELIME),
  R('été', ['2-3-5-6'], '(yaz / olmuş)', FR_KURAL_TEK_KELIME),
  R('du', ['2-3-6'], '(-in, de + le)', FR_KURAL_TEK_KELIME),
];

export const FRANSIZCA_BIR_HARF_GRUP3 = [
  R('est', ['1-5-6'], '(o -dir)', FR_KURAL_TEK_KELIME),
  R('plus', ['1-2-4-6'], '(daha / artı)', FR_KURAL_TEK_KELIME),
  R('grand', ['1-2-4-5-6'], '(büyük)', FR_KURAL_TEK_KELIME),
  R('ou', ['1-2-5-6'], '(veya)', [...FR_KURAL_TEK_KELIME, ...FR_KURAL_OU]),
  R('son', ['2-4-6'], '(onun, eril)', FR_KURAL_TEK_KELIME),
  R('tous', ['2-4-5-6'], '(hepsi, çoğul)', FR_KURAL_TEK_KELIME),
  R('dès', ['2-5-6'], '(-den itibaren)', FR_KURAL_TEK_KELIME),
  R('si', ['3-5'], '(eğer / bu kadar)', FR_KURAL_TEK_KELIME),
  R('sous', ['3-5-6'], '(altında)', FR_KURAL_TEK_KELIME),
  R('la', ['6'], '(belirteç, kadın)', FR_KURAL_TEK_KELIME),
  R('celui', ['3-6'], '(o, kişi)', FR_KURAL_TEK_KELIME),
  R('lui', ['3-4-5-6'], '(ona)', FR_KURAL_TEK_KELIME),
  R('on', ['3-4-6'], '(birisi / insan, genel)', [...FR_KURAL_TEK_KELIME, ...FR_KURAL_ON]),
  R('les', ['3-4-5'], '(belirteç, çoğul)', FR_KURAL_TEK_KELIME),
];

/* ──────────  Kelime parçası kısaltmaları (Lautgruppen / sesler)  ───────── */
export const FRANSIZCA_KELIME_PARCA = [
  R('ch', ['1-2-3-5-6'], 'Kelime parçası', FR_KURAL_CH),
  R('oi', ['2-3-4-5-6'], 'Kelime parçası', FR_KURAL_PARCA),
  R('an', ['2'], 'Kelime parçası', [...FR_KURAL_PARCA, ...FR_KURAL_AN]),
  R('eur', ['4-6'], 'Son ek', FR_KURAL_PARCA),
  R('ll', ['4-5-6'], 'Kelime parçası', FR_KURAL_PARCA),
  R('ion', ['3-4-5-6'], 'Son ek', FR_KURAL_PARCA),
  R('ar', ['4'], 'Kelime parçası', FR_KURAL_PARCA),
  R('gn', ['2-3-5-6'], 'Kelime parçası', FR_KURAL_PARCA),
  R('er', ['2-3-6'], 'Son ek', FR_KURAL_PARCA),
  R('in', ['3-5'], 'Kelime parçası', FR_KURAL_PARCA),
  R('eu', ['5'], 'Kelime parçası', FR_KURAL_PARCA),
  R('ieu', ['6'], 'Kelime parçası', FR_KURAL_PARCA),
  R('or', ['5-6'], 'Kelime parçası', FR_KURAL_PARCA),
  R('ai', ['3-4'], 'Kelime parçası', FR_KURAL_PARCA),
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
    pageBaslik: 'Fransızca · Aksanlı harfler ve ligatürler',
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
