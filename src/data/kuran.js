// =============================================================================
// MEB Kur'an-ı Kerim Braille Yazı Kılavuzu — Modül 5 verileri.
// -----------------------------------------------------------------------------
// Burada yer alan harf, hareke ve tecvid işaretlerinin braille nokta karşılıkları
// "Birleştirilmiş Arap Braille (Unified Arabic Braille / UAB)" kodu ve MEB
// Kur'an-ı Kerim Braille kılavuzu esas alınarak hazırlanmıştır. Tecvid
// işaretlerinin bazıları kılavuz baskılarına göre değişebilir; uygulama
// içindeki değerler kılavuzla karşılaştırılarak doğrulanmalıdır.
// =============================================================================

// ----------------------------------------------------------------------------
// 28 Arap harfi + lam-elif ve sık kullanılan ek harfler (hemze, te marbuta, elif maksure)
// ----------------------------------------------------------------------------
export const KURAN_HARFLERI = [
  { harf: 'ا', ad: 'elif',         okunus: 'a',    noktalar: [1] },
  { harf: 'ب', ad: 'ba',           okunus: 'be',   noktalar: [1, 2] },
  { harf: 'ت', ad: 'te',           okunus: 'te',   noktalar: [2, 3, 4, 5] },
  { harf: 'ث', ad: 'se',           okunus: 'se',   noktalar: [1, 4, 5, 6] },
  { harf: 'ج', ad: 'cim',          okunus: 'cim',  noktalar: [2, 4, 5] },
  { harf: 'ح', ad: 'ha',           okunus: 'ha',   noktalar: [1, 5, 6] },
  { harf: 'خ', ad: 'hı',           okunus: 'hı',   noktalar: [1, 3, 4, 6] },
  { harf: 'د', ad: 'dal',          okunus: 'dal',  noktalar: [1, 4, 5] },
  { harf: 'ذ', ad: 'zel',          okunus: 'zel',  noktalar: [2, 3, 4, 6] },
  { harf: 'ر', ad: 'ra',           okunus: 'ra',   noktalar: [1, 2, 3, 5] },
  { harf: 'ز', ad: 'ze',           okunus: 'ze',   noktalar: [1, 3, 5, 6] },
  { harf: 'س', ad: 'sin',          okunus: 'sin',  noktalar: [2, 3, 4] },
  { harf: 'ش', ad: 'şın',          okunus: 'şın',  noktalar: [1, 4, 6] },
  { harf: 'ص', ad: 'sad',          okunus: 'sad',  noktalar: [1, 2, 3, 4, 6] },
  { harf: 'ض', ad: 'dad',          okunus: 'dad',  noktalar: [1, 2, 4, 6] },
  { harf: 'ط', ad: 'tı',           okunus: 'tı',   noktalar: [2, 3, 4, 5, 6] },
  { harf: 'ظ', ad: 'zı',           okunus: 'zı',   noktalar: [1, 2, 3, 4, 5, 6] },
  { harf: 'ع', ad: 'ayn',          okunus: 'ayn',  noktalar: [1, 2, 3, 5, 6] },
  { harf: 'غ', ad: 'gayn',         okunus: 'gayn', noktalar: [1, 2, 6] },
  { harf: 'ف', ad: 'fe',           okunus: 'fe',   noktalar: [1, 2, 4] },
  { harf: 'ق', ad: 'kaf',          okunus: 'kaf',  noktalar: [1, 2, 3, 4, 5] },
  { harf: 'ك', ad: 'kef',          okunus: 'kef',  noktalar: [1, 3] },
  { harf: 'ل', ad: 'lam',          okunus: 'lam',  noktalar: [1, 2, 3] },
  { harf: 'م', ad: 'mim',          okunus: 'mim',  noktalar: [1, 3, 4] },
  { harf: 'ن', ad: 'nun',          okunus: 'nun',  noktalar: [1, 3, 4, 5] },
  { harf: 'و', ad: 'vav',          okunus: 'vav',  noktalar: [2, 4, 5, 6] },
  { harf: 'ه', ad: 'he',           okunus: 'he',   noktalar: [1, 2, 5] },
  { harf: 'لا', ad: 'lam-elif',    okunus: 'lam-elif', noktalar: [1, 2, 3, 6] },
  { harf: 'ي', ad: 'ye',           okunus: 'ye',   noktalar: [2, 4] },
 
];
// ----------------------------------------------------------------------------
// Harekeler — Kur'an braillesi'nde harekeler ilgili harften SONRA ayrı bir
// braille hücresi olarak yazılır. Aşağıdaki nokta karşılıkları MEB Kur'an
// Braille kılavuzunda kullanılan UAB değerleridir.
// ----------------------------------------------------------------------------
export const KURAN_HAREKELERI = [
  {
    isaret: 'َ', ad: 'üstün', okunus: 'üstün',
    noktalar: [2],
    aciklama: 'Harfin üstüne konur, harfi e/a sesiyle okutur. Braillede harften sonra yazılır.'
  },
  {
    isaret: 'ِ', ad: 'esre', okunus: 'esre',
    noktalar: [1, 5],
    aciklama: 'Harfin altına konur, harfi i sesiyle okutur. Braillede harften sonra yazılır.'
  },
  {
    isaret: 'ُ', ad: 'ötre', okunus: 'ötre',
    noktalar: [1, 3, 6],
    aciklama: 'Harfin üstüne konur, harfi u/ü sesiyle okutur. Braillede harften sonra yazılır.'
  },
];
export const CEZM_SEDDE = [
  {
    isaret: 'ْ', ad: 'cezim', okunus: 'cezim',
    noktalar: [2,5],
    aciklama: 'Harfin üstüne konur, harfin sessiz okunduğunu gösterir. Cezimli harf hece sonu olur.'
  },
  {
    isaret: 'ّ', ad: 'şedde', okunus: 'şedde',
    noktalar: [6],
    aciklama: 'Harfin üstüne konur, harfin iki defa (vurgulu) okunduğunu gösterir.'
  }
];
export const MED_HARFLERI = [
  {
    isaret: 'ا', ad: 'Uzatma harfi elif', okunus: '',
    noktalar: [1],
    aciklama: ''
  },
  {
    isaret: 'ي', ad: 'uzatma harfi ya', okunus: '',
    noktalar: [2, 4],
    aciklama: ''
  },
  {
    isaret: 'و', ad: 'uzatma harfi vav', okunus: '',
    noktalar: [2, 4, 5, 6],
    aciklama: ''
  }
];
export const MUKADDER_MEDLER = [
  {
    isaret: 'ٰ', ad: 'Mukadder elif', okunus: '',
    noktalar: [4],
    aciklama: ''
  },
  {
    isaret: 'ٰ', ad: 'Elif üzeri dik üstün', okunus: '',
    noktalar: [3, 4, 5],
    aciklama: ''
  },
  {
    isaret: 'ى', ad: 'Mukadder ya ve zamir ha uzatması', okunus: '',
    noktalar: [4, 5],
    aciklama: ''
  },
  {
    isaret: 'و', ad: 'Mukadder vav, med ve zamir ha uzatması', okunus: '',
    noktalar: [3, 4, 6],
    aciklama: ''
  }
];
export const ELIF_ZAID = [
  {
    isaret: 'ا', ad: 'Elif-i Zaid', okunus: '',
    noktalar: [1],
    aciklama: ''
  }
];
export const HEMZELER = [
  {
    isaret: 'أ', ad: 'Hemze-elif', okunus: '',
    noktalar: [4],
    aciklama: ''
  },
  {
    isaret: 'ؤ', ad: 'Vavlı hemze', okunus: '',
    noktalar: [1,2,5,6],
    aciklama: ''
  },
  {
    isaret: 'ئ', ad: 'Ya\'lı hemze', okunus: '',
    noktalar: [1, 3, 4 , 5, 6],
    aciklama: ''
  },
  {
    isaret: 'ء', ad: 'Kıvrık hemze', okunus: '',
    noktalar: [3],
    aciklama: ''
  }
];
export const TENVINLER = [
  {
    isaret: 'ً', ad: 'üstün tenvin', okunus: 'iki üstün',
    noktalar: [[1],[2, 3]],
    aciklama: 'Tenvinli fetha. "an / en" sesi verir; kelime sonunda kullanılır.'
  },
  {
    isaret: 'ٍ', ad: 'esre tenvin', okunus: 'iki esre',
    noktalar: [3, 5],
    aciklama: 'Tenvinli kesra. "in" sesi verir; kelime sonunda kullanılır.'
  },
  {
    isaret: 'ٌ', ad: 'ötre tenvin', okunus: 'iki ötre',
    noktalar: [2, 6],
    aciklama: 'Tenvinli damme. "un / ün" sesi verir; kelime sonunda kullanılır.'
  }
];
export const TA_I_MERBUTA = [
  {
    isaret: 'ة', ad: 'Ta-i merbûta', okunus: '',
    noktalar: [1, 6],
    aciklama: ''
  },
];
export const DIGER_UZATMA = [
  {
    isaret: 'ى', ad: 'Elif\'in yerini tutan ya', okunus: '',
    noktalar: [1, 3, 5],
    aciklama: ''
  },
  {
    isaret: 'و', ad: 'Elif\'in yerini tutan vav', okunus: '',
    noktalar: [3, 4, 5, 6],
    aciklama: ''
  }
];
export const HEMZE_VASL = [
  {
    isaret: 'ٱ', ad: 'Hemze-i vasl', okunus: '',
    noktalar: [1],
    aciklama: ''
  },
  {
    isaret: 'أ', ad: 'Hemze-i Kat', okunus: '',
    noktalar: [3, 4],
    aciklama: ''
  }
]
// ----------------------------------------------------------------------------
// Tecvid işaretleri — Kur'an braillesi'nde sık kullanılan temel işaretler.
// Her biri bir veya iki braille hücresinden oluşur. Daha ayrıntılı tecvid
// işaretleri (tilavet secdeleri, durak işaretleri vs.) MEB kılavuzundan
// eklenebilir.
// ----------------------------------------------------------------------------
export const KURAN_TECVID = [
  {
    ad: 'Hurufu mukatta\'a ve ayet ortası durak işareti',
    sembol: '',
    hucreler: [[3, 6]],
    aciklama: 'Sure başlarında bulunan kesik harflerin (Elif-Lam-Mîm vb.) okunuşunda veya ayet ortalarında genel bir durak/ayrım yerini belirtmek için kullanılır.'
  },
  {
    ad: 'Ayet sonu işareti',
    sembol: '۝',
    hucreler: [[2, 3, 5, 6]],
    aciklama: 'Bir ayetin bittiğini gösteren yuvarlak (۝) işarettir. Burada durmak (vakıf yapmak) sünnettir. Durulduğunda son harfin harekesine göre tecvid kuralları uygulanır.'
  },
  {
    ad: 'Vakf-ı Lazım (Ayet ortasında)',
    sembol: 'م',
    hucreler: [[3, 6], [1, 3, 4]],
    aciklama: 'Kesinlikle durulması gereken duraktır. Geçilmesi halinde ayetin anlamı ciddi şekilde bozulur. Sembolü "Mim" (م) harfidir.'
  },
  {
    ad: 'Vakf-ı Lazım (Ayet sonunda)',
    sembol: 'م',
    hucreler: [[2, 3, 5, 6], [1, 3, 4]],
    aciklama: 'Kesinlikle durulması gereken duraktır. Geçilmesi halinde ayetin anlamı ciddi şekilde bozulur. Sembolü "Mim" (م) harfidir.'
  },
  {
    ad: 'Vakf-ı mutlak (Ayet ortasında)',
    sembol: 'ط',
    hucreler: [[3, 6], [2,3,4,5,6]],
    aciklama: 'Durulması okumaya devam etmekten (geçmekten) daha iyi (evla) olan duraktır. Konu tamamlansa da lafız devam eder. Sembolü "Tı" (ط) harfidir.'
  },
  {
    ad: 'Vakf-ı mutlak (Ayet sonunda)',
    sembol: 'ط',
    hucreler: [[2, 3, 5, 6], [2,3,4,5,6]],
    aciklama: 'Durulması okumaya devam etmekten (geçmekten) daha iyi (evla) olan duraktır. Konu tamamlansa da lafız devam eder. Sembolü "Tı" (ط) harfidir.'
  },
  {
    ad: 'Vakf-ı caiz (Ayet ortasında)',
    sembol: 'ج',
    hucreler: [[3, 6], [2, 4, 5]],
    aciklama: 'Hem durmanın hem de geçmenin caiz (serbest) olduğu duraktır. Ancak durmak, geçmekten daha iyidir. Sembolü "Cim" (ج) harfidir.'
  },
  {
    ad: 'Vakf-ı caiz (Ayet sonunda)',
    sembol: 'ج',
    hucreler: [[2, 3, 5, 6], [2, 4, 5]],
    aciklama: 'Hem durmanın hem de geçmenin caiz (serbest) olduğu duraktır. Ancak durmak, geçmekten daha iyidir. Sembolü "Cim" (ج) harfidir.'
  },
  {
    ad: 'Vakf-ı mücevvez (Ayet ortasında)',
    sembol: 'ز',
    hucreler: [[3, 6], [1, 3, 5, 6]],
    aciklama: 'Durmak caiz olmakla birlikte, geçmenin (okumaya devam etmenin) daha iyi (evla) olduğu duraktır. Sembolü "Ze" (ز) harfidir.'
  },
  {
    ad: 'Vakf-ı mücevvez (Ayet sonunda)',
    sembol: 'ز',
    hucreler: [[2, 3, 5, 6], [1, 3, 5, 6]],
    aciklama: 'Durmak caiz olmakla birlikte, geçmenin (okumaya devam etmenin) daha iyi (evla) olduğu duraktır. Sembolü "Ze" (ز) harfidir.'
  },
  {
    ad: 'Vakf-ı murahhas (Ayet ortasında)',
    sembol: 'ص',
    hucreler: [[3, 6], [1, 2, 3, 4, 6]],
    aciklama: 'Aslında geçilmesi gereken ancak nefes yetmemesi gibi zaruri durumlarda durulmasına ruhsat verilen duraktır. Geçmek daha iyidir. Sembolü "Sad" (ص) harfidir.'
  },
  {
    ad: 'Vakf-ı murahhas (Ayet sonunda)',
    sembol: 'ص',
    hucreler: [[2, 3, 5, 6], [1, 2, 3, 4, 6]],
    aciklama: 'Aslında geçilmesi gereken ancak nefes yetmemesi gibi zaruri durumlarda durulmasına ruhsat verilen duraktır. Geçmek daha iyidir. Sembolü "Sad" (ص) harfidir.'
  },
  {
    ad: 'Kaf Durağı (Ayet ortasında)',
    sembol: 'ق',
    hucreler: [[3, 6], [1, 2, 3, 4, 5]],
    aciklama: 'Burada durulabileceği söylenmiş olsa da geçmek (okumaya devam etmek) daha iyidir. Sembolü "Kaf" (ق) harfidir.'
  },
  {
    ad: 'Kaf Durağı (Ayet sonunda)',
    sembol: 'ق',
    hucreler: [[2, 3, 5, 6], [1, 2, 3, 4, 5]],
    aciklama: 'Burada durulabileceği söylenmiş olsa da geçmek (okumaya devam etmek) daha iyidir. Sembolü "Kaf" (ق) harfidir.'
  },
  {
    ad: 'Kıf Durağı (Ayet ortasında)',
    sembol: 'قف',
    hucreler: [[3, 6], [1, 2, 3, 4, 5], [1, 2, 4]],
    aciklama: 'Arapça "Dur!" emridir. Anlamın bozulmaması için mutlaka durulması gereken duraktır. Sembolü "Kıf" (قف) kelimesidir.'
  },
  {
    ad: 'Kıf Durağı (Ayet sonunda)',
    sembol: 'قف',
    hucreler: [[2, 3, 5, 6], [1, 2, 3, 4, 5], [1, 2, 4]],
    aciklama: 'Arapça "Dur!" emridir. Anlamın bozulmaması için mutlaka durulması gereken duraktır. Sembolü "Kıf" (قف) kelimesidir.'
  },
  {
    ad: 'Lam-elif (Vakfı La) (Ayet ortasında)',
    sembol: 'لا',
    hucreler: [[3, 6], [1, 2, 3, 6]],
    aciklama: '"Durma!" anlamına gelir. Ayet ortasında kesinlikle durulmaz. Nefes biterse, geriden kelime alınarak tekrar okunmalıdır. Sembolü "Lam-elif" (لا) harfidir.'
  },
  {
    ad: 'Lam-elif (Vakfı La) (Ayet sonunda)',
    sembol: 'لا',
    hucreler: [[2, 3, 5, 6], [1, 2, 3, 6]],
    aciklama: '"Durma!" anlamına gelir. Ancak ayet sonlarında (durmak sünnet olduğu için) durulmasında bir sakınca yoktur. Sembolü "Lam-elif" (لا) harfidir.'
  },
  {
    ad: 'Muanaka Vakfı (Vakfı Murakaba) (Bir durakla birlikte)',
    sembol: '∴',
    hucreler: [2, 5, 6],
    aciklama: 'Birbirine yakın iki yerde bulunan üç nokta (∴) işaretidir. Bu iki duraktan sadece birinde durulur, diğerinde kesinlikle durulmaz geçilir.'
  },
  {
    ad: 'Muanaka Vakfı (Vakfı Murakaba) (ayet ortasında)',
    sembol: '∴',
    hucreler: [[3, 6], [1, 2, 3, 4, 5], [1, 2, 4], [2, 5, 6]],
    aciklama: 'Birbirine yakın iki yerde bulunan üç nokta (∴) işaretidir. Bu iki duraktan sadece birinde durulur, diğerinde kesinlikle durulmaz geçilir.'
  },
  {
    ad: 'Muanaka Vakfı (Vakfı Murakaba) (ayet sonunda)',
    sembol: '∴',
    hucreler: [[2, 3, 5, 6], [1, 2, 3, 6], [2, 5, 6]],
    aciklama: 'Birbirine yakın iki yerde bulunan üç nokta (∴) işaretidir. Bu iki duraktan sadece birinde durulur, diğerinde kesinlikle durulmaz geçilir.'
  },
  {
    ad: 'Ayn durağı (Rüku alameti) (ayet sonunda)',
    sembol: 'ع',
    hucreler: [[2, 3, 5, 6], [1, 2, 3, 5, 6]],
    aciklama: 'Bir konunun veya kıssanın bittiğini gösterir. Namazda okunurken rükûya gitmek (eğilmek) veya hatim okunurken okumayı bitirmek için en uygun yerdir. Sembolü "Ayn" (ع) harfidir.'
  },
];

// ----------------------------------------------------------------------------
// Hece okuma — Harf eğitimindeki her Arap harfi × üstün / esre / ötre (fetha,
// kesra, damme). Bir harf + bir hareke braillede arka arkaya iki ayrı hücredir.
// Okunuşlar Türkçe Kur'an öğretiminde yaygın söylenişe göre verilmiştir.
// ----------------------------------------------------------------------------
const KURAN_TEMEL_HAREKELER = KURAN_HAREKELERI.filter((h) =>
  ['üstün', 'esre', 'ötre'].includes(h.ad)
);

/** @type {Record<string, [string, string, string]>} Harf → [fetha, kesra, damme] okunuşu */
const KURAN_HECE_TEMEL_OKUNUS = {
  ا: ['a', 'i', 'u'],
  ب: ['be', 'bi', 'bu'],
  ت: ['te', 'ti', 'tü'],
  ث: ['se', 'si', 'sü'],
  ج: ['ce', 'ci', 'cü'],
  ح: ['he', 'hi', 'hü'],
  خ: ['xa', 'xi', 'xü'],
  د: ['de', 'di', 'dü'],
  ذ: ['ze', 'zi', 'zü'],
  ر: ['re', 'ri', 'rü'],
  ز: ['ze', 'zi', 'zu'],
  س: ['se', 'si', 'sü'],
  ش: ['şe', 'şi', 'şü'],
  ص: ['sa', 'sı', 'su'],
  ض: ['da', 'dı', 'du'],
  ط: ['ta', 'ti', 'tü'],
  ظ: ['za', 'zı', 'zu'],
  ع: ['a', 'i', 'u'],
  غ: ['ğa', 'ği', 'ğu'],
  ف: ['fe', 'fi', 'fü'],
  ق: ['ke', 'ki', 'kü'],
  ك: ['ke', 'ki', 'kü'],
  ل: ['le', 'li', 'lü'],
  م: ['me', 'mi', 'mü'],
  ن: ['ne', 'ni', 'nü'],
  ه: ['he', 'hi', 'hü'],
  و: ['ve', 'vi', 'vu'],
  ي: ['ye', 'yi', 'yü'],
};

function kuranHeceOkunusunuAl(harfKarakteri, harekeAdi) {
  const uclu = KURAN_HECE_TEMEL_OKUNUS[harfKarakteri];
  if (!uclu) {
    return '';
  }
  if (harekeAdi === 'üstün') {
    return uclu[0];
  }
  if (harekeAdi === 'esre') {
    return uclu[1];
  }
  if (harekeAdi === 'ötre') {
    return uclu[2];
  }
  return '';
}

export const KURAN_HECELERI = KURAN_HARFLERI.flatMap((harf) =>
  KURAN_TEMEL_HAREKELER.map((hareke) => ({
    yazi: `${harf.harf}${hareke.isaret}`,
    okunus: kuranHeceOkunusunuAl(harf.harf, hareke.ad),
    harf: harf.harf,
    hareke: hareke.ad,
    hucreler: [harf.noktalar, hareke.noktalar]
  }))
);

// ----------------------------------------------------------------------------
// Kelime okuma örnekleri — birden çok harf + harekeyle yazılmış kısa kelimeler.
// Her kelime, sırayla yazıldığı gibi braille hücreleri dizisidir.
//
// Hücreler `k(yazi, okunus, anlam, kod)` yardımcısıyla "token" formatından
// üretilir. Token formatı:
//   - Arap harfi karakterleri (ا ب ت ...) = harf hücresi
//   - 'a' = fetha, 'i' = kesra, 'u' = damme,
//     'A' = fethatan, 'I' = kesratan, 'U' = dammetan,
//     '0' = sükûn (cezim), '~' = şedde,
//     'M' = med (uzatma) işareti.
// Her token tek bir braille hücresine karşılık gelir; tokenlar boşlukla ayrılır.
// ----------------------------------------------------------------------------
const KELIME_TOKEN = {
  // Arap harfleri (KURAN_HARFLERI ile aynı noktalar)
  'ا': [1],
  'ب': [1, 2],
  'ت': [2, 3, 4, 5],
  'ث': [1, 4, 5, 6],
  'ج': [2, 4, 5],
  'ح': [1, 5, 6],
  'خ': [1, 3, 4, 6],
  'د': [1, 4, 5],
  'ذ': [2, 3, 4, 6],
  'ر': [1, 2, 3, 5],
  'ز': [1, 3, 5, 6],
  'س': [2, 3, 4],
  'ش': [1, 4, 6],
  'ص': [1, 2, 3, 4, 6],
  'ض': [1, 2, 4, 6],
  'ط': [2, 3, 4, 5, 6],
  'ظ': [1, 2, 3, 4, 5, 6],
  'ع': [1, 2, 3, 5, 6],
  'غ': [1, 2, 6],
  'ف': [1, 2, 4],
  'ق': [1, 2, 3, 4, 5],
  'ك': [1, 3],
  'ل': [1, 2, 3],
  'م': [1, 3, 4],
  'ن': [1, 3, 4, 5],
  'و': [2, 4, 5, 6],
  'ه': [1, 2, 5],
  'لا': [1, 2, 3, 6],
  'ي': [2, 4],
  
  // Harekeler ve özel işaretler
  a: [3, 5],
  i: [2, 6],
  u: [1, 3, 6],
  A: [2, 3, 5, 6],
  I: [2, 3, 5],
  U: [1, 2, 5, 6],
  '0': [4],
  '~': [6],
  M: [2, 5]
};

export const KURAN_KELIME_TOKEN = KELIME_TOKEN;

export function kuranKelime(yazi, okunus, anlam, kod) {
  return k(yazi, okunus, anlam, kod);
}

function k(yazi, okunus, anlam, kod) {
  const hucreler = kod.trim().split(/\s+/).map((tok) => {
    const v = KELIME_TOKEN[tok];
    if (!v) {
      // Geliştirme aşamasında uyarı ver, ama uygulama çökmesin
      console.warn('[KURAN_KELIMELERI] Bilinmeyen token:', tok, 'kelime:', yazi);
      return [];
    }
    return v;
  });
  return { yazi, okunus, anlam, hucreler };
}

// -----------------------------------------------------------------------------
// Kelime Okuma — Bölüm 1 (Temel): üstün / esre / ötre odaklı, sonra şedde ve cezım.
// Bölüm 2 tam liste için KURAN_KELIMELERI kullanılır.
// -----------------------------------------------------------------------------
export const KURAN_KELIMELERI_TEMEL = [
  // 1 — Üstün (çoğunlukla üstün hareke; başlangıç)
  k('مَا', 'ma', '(1) Üstün: “şey / ne …” ihtiyacında', 'م a ا'),
  k('لَا', 'la', '(1) Üstün: inkar / bağlaç olarak “hayır/değil”', 'ل a ا'),
  k('وَ', 've', '(1) Üstün: “ve”', 'و a'),
  k('هٰذَا', 'haza', '(1) Üstün: “bu” (işaret)', 'ه a ذ a ا'),
  k('كَمَا', 'kema', '(1) Üstün: “tıpkı … gibi”', 'ك a م a ا'),
  // 2 — Esre ağırlıklı örnekler
  k('فِي', 'fî', '(2) Esre: “içinde / -de / -da”', 'ف i ي'),
  k('بِهِ', 'bihi', '(2) Esre: “onunla / onda”', 'ب i ه i'),
  k('بِمَا', 'bima', '(2) Esre + üstün: “onunla / ne ile…”', 'ب i م a ا'),
  k('إِلىٰ', 'ila', '(2) Esre ağırlıklı yer / yön — “ila / -e doğru”', 'ا i ل a ى'),
  k('إِلَيْهِ', 'ileyhi', '(2) Esre + yapı: ila + zamir bağlamına hazırlık', 'ا i ل a ي 0 ه i'),
  k('حِينَ', 'hîne', '(2) Esre + med ile “ zaman / vakit ”', 'ح i M ن a'),
  k('إِنْ', 'in', '(2) Esre ile koşul / temennî kökleri', 'ا i ن 0'),
  k('قِيلَ', 'kîle', '(2) Kesra ile fiil yapısı: “demek / denildi…”', 'ق i ي 0 ل a'),
  // 3 — Ötre (damme / ötre ile tanışma)
  k('هُوَ', 'hüve', '(3) Ötre: zamir “o” — vav ile üstün birleşimi', 'ه u و a'),
  k('هُمُ', 'humü', '(3) Ötre: zamir (“onlar” çoğulu, kısıtlı bağlam için özet)', 'ه u م u'),
  k('هُمْ', 'hum', '(3) Ötre + cezım (sonraki bölümle bağ): “onlar …” yapısı', 'ه u م 0'),
  k('ظُلم', 'zulım', '(3) Ötre odaklı hece zinciri bağlamına örnekleştirilmiş', 'ظ u ل u م'),
  k('ظُلمٌ', 'zulımün', '(3) Ötre ile tenvin tanımanın girişi', 'ظ u ل u م U'),
  // 4 — Şedde (taşdid / çift okuma hücresi)
  k('إِنَّ', 'inne', '(4) Şedde: “şüphesiz / muhakkak …”', 'ا i ن ~ a'),
  k('رَبِّ', 'rabbi', '(4) Şedde: “Rabbim / Rabbinin …” kökü', 'ر a ب ~ i'),
  k('لِلّٰهِ', 'lillahi', '(4) Şedde: lam-lam Allah — “Allah için / Allah’a”', 'ل i ل ~ ه i'),
  k('شَرِّ', 'şerri', '(4) Şedde: “şer / kötülük” çoğul yapı girişi', 'ش a ر ~ i'),
  k('كُلٌّ', 'küllün', '(4) Şedde + ötre + tenvin kısa örnek', 'ك u ل ~ U'),
  k('إِنَّمَا', 'innema', '(4) Şedde + üstün ile “ancak / yalnız …”', 'ا i ن ~ a م a ا'),
  k('إِيَّاكَ', 'iyyake', '(4) Şedde karmaşık örnekleştirilmiş “seni / sana doğrudan ”', 'ا i ي ~ a ا ك a'),
  // 5 — Cezım ve sükûn (sessiz çıkış hücreleri ile)
  k('بِسْمِ', 'bismi', '(5) Cezım: lam üzerinde cezım — başlangıca hazırlık', 'ب i س 0 م i'),
  k('قُلْ', 'kul', '(5) Cezım: mim cezım — “De ki…”', 'ق u ل 0'),
  k('مِنْ', 'min', '(5) Cezım:', 'م i ن 0'),
  k('مَنْ', 'men', '(5) Cezım:', 'م a ن 0'),
  k('لَمْ', 'lem', '(5) Cezım: olumsuzlamaya giriş', 'ل a م 0'),
  k('وَلَدْ', 'veled', '(5) Cezım ile sıfat–fiil farkına hazırlık', 'و a ل a د 0')
];

export const KURAN_KELIMELERI = [
  // ===========================================================================
  // Besmele ve sık geçen genel kelimeler
  // ===========================================================================
  k('بِسْمِ',     'bismi',  '“adıyla”',           'ب i س 0 م i'),
  k('اللّٰهِ',     'Allahi', '“Allah’ın”',         'ا ل ل ~ ه i'),
  k('رَبِّ',      'rabbi',  '“Rabbi”',            'ر a ب ~ i'),
  k('الرَّحْمٰنِ', 'er-Rahman', '“Rahman”',        'ا ل ر ~ a ح 0 م a ن i'),
  k('الرَّحِيمِ',  'er-Rahîm',  '“Rahîm”',         'ا ل ر ~ a ح i M م i'),
  k('قُلْ',       'kul',    '“De ki”',            'ق u ل 0'),
  k('هُوَ',       'hüve',   '“O”',                'ه u و a'),
  k('لَا',        'la',     '“yok / değil”',      'ل a ا'),
  k('مَنْ',       'men',    '“kim”',              'م a ن 0'),
  k('فِي',       'fî',     '“içinde”',            'ف i ي'),
  k('مِنْ',       'min',    '“-den / -dan”',       'م i ن 0'),
  k('إِلَى',      'ila',    '“-e doğru”',          'ا i ل a ى'),
  k('عَلَى',      'ala',    '“üzerine”',           'ع a ل a ى'),
  k('وَ',        've',     '“ve”',                'و a'),
  k('أَوْ',       'ev',     '“veya”',              'ا a و 0'),
  k('إِنَّ',      'inne',   '“muhakkak ki”',       'ا i ن ~ a'),
  k('أَنْتَ',     'ente',   '“sen”',               'ا a ن 0 ت a'),
  k('نَحْنُ',     'nahnü',  '“biz”',               'ن a ح 0 ن u'),
  k('ذٰلِكَ',     'zalike', '“şu / bu”',           'ذ a ل i ك a'),
  k('هٰذَا',      'haza',   '“bu”',                'ه a ذ a ا'),

  // ===========================================================================
  // Fatiha Sûresi (1) — 7 ayet
  // ===========================================================================
  k('الْحَمْدُ',  'el-hamdü', '“Hamd / övgü”',     'ا ل 0 ح a م 0 د u'),
  k('لِلّٰهِ',     'lillahi',  '“Allah’a aittir”',  'ل i ل ~ ه i'),
  k('رَبِّ',      'rabbi',   '“Rabbi”',            'ر a ب ~ i'),
  k('الْعَالَمِينَ', 'el-alemîn', '“alemlerin”',   'ا ل 0 ع a ا ل a م i M ن a'),
  k('مَالِكِ',    'maliki',  '“sahibi / Maliki”',   'م a ا ل i ك i'),
  k('يَوْمِ',     'yevmi',   '“gün”',              'ي a و 0 م i'),
  k('الدِّينِ',   'ed-dîni', '“din / hesap”',      'ا ل د ~ i M ن i'),
  k('إِيَّاكَ',   'iyyake',  '“yalnız sana”',      'ا i ي ~ a ا ك a'),
  k('نَعْبُدُ',   'na‘büdü', '“ibadet ederiz”',    'ن a ع 0 ب u د u'),
  k('نَسْتَعِينُ', 'nesta‘în', '“yardım dileriz”', 'ن a س 0 ت a ع i M ن u'),
  k('اهْدِنَا',   'ihdina',  '“bizi hidayete erdir”', 'ا 0 ه 0 د i ن a ا'),
  k('الصِّرَاطَ', 'es-sırata', '“yol”',            'ا ل ص ~ i ر a ا ط a'),
  k('الْمُسْتَقِيمَ', 'el-müstakîm', '“dosdoğru”', 'ا ل 0 م u س 0 ت a ق i M م a'),
  k('صِرَاطَ',    'sırata',  '“yolu”',             'ص i ر a ا ط a'),
  k('الَّذِينَ',  'ellezîne', '“o kimseler ki”',   'ا ل ~ a ذ i M ن a'),
  k('أَنْعَمْتَ', 'en‘amte',  '“nimet verdin”',    'ا a ن 0 ع a م 0 ت a'),
  k('عَلَيْهِمْ', 'aleyhim',  '“onlara”',          'ع a ل a ي 0 ه i م 0'),
  k('غَيْرِ',     'ğayri',   '“-in dışında”',      'غ a ي 0 ر i'),
  k('الْمَغْضُوبِ', 'el-mağdûbi', '“gazaba uğramışlar”', 'ا ل 0 م a غ 0 ض u M ب i'),
  k('وَلَا',      'vela',    '“ve değil”',         'و a ل a ا'),
  k('الضَّالِّينَ', 'ed-dallîn', '“sapkınlar”',    'ا ل ض ~ a ا ل ~ i M ن a'),

  // ===========================================================================
  // İhlas Sûresi (112) — 4 ayet
  // ===========================================================================
  k('أَحَدٌ',     'ehad',    '“tek / bir”',        'ا a ح a د U'),
  k('الصَّمَدُ',  'es-Samed', '“Samed (hiçbir şeye muhtaç olmayan)”', 'ا ل ص ~ a م a د u'),
  k('لَمْ',       'lem',     '“-medi / -madı”',    'ل a م 0'),
  k('يَلِدْ',     'yelid',   '“doğurmadı”',        'ي a ل i د 0'),
  k('يُولَدْ',    'yûled',   '“doğurulmadı”',      'ي u M ل a د 0'),
  k('يَكُنْ',     'yekün',   '“olmadı”',           'ي a ك u ن 0'),
  k('لَهُ',       'lehû',    '“onun için”',         'ل a ه u'),
  k('كُفُوًا',    'küfüven', '“denk / eş”',        'ك u ف u و A ا'),

  // ===========================================================================
  // Felak Sûresi (113) — 5 ayet
  // ===========================================================================
  k('أَعُوذُ',    'eûzü',    '“sığınırım”',        'ا a ع u M ذ u'),
  k('بِرَبِّ',    'bi-rabbi', '“Rabbine”',         'ب i ر a ب ~ i'),
  k('الْفَلَقِ',  'el-felak', '“sabahın / şafağın”', 'ا ل 0 ف a ل a ق i'),
  k('شَرِّ',      'şerri',   '“kötülüğünden”',     'ش a ر ~ i'),
  k('مَا',        'ma',      '“şey”',              'م a ا'),
  k('خَلَقَ',     'halaka',  '“yarattı”',          'خ a ل a ق a'),
  k('غَاسِقٍ',    'ğasikın', '“karanlık çöktüğünde”', 'غ a ا س i ق I'),
  k('إِذَا',      'iza',     '“-dığı zaman”',      'ا i ذ a ا'),
  k('وَقَبَ',     'vekabe',  '“çöktüğünde”',       'و a ق a ب a'),
  k('النَّفَّاثَاتِ', 'en-neffasati', '“üfleyenler”', 'ا ل ن ~ a ف ~ a ا ث a ا ت i'),
  k('الْعُقَدِ',  'el-ukad', '“düğümler”',         'ا ل 0 ع u ق a د i'),
  k('حَاسِدٍ',    'hasidin', '“hasetçinin”',       'ح a ا س i د I'),
  k('حَسَدَ',     'hasede',  '“haset etti”',       'ح a س a د a'),

  // ===========================================================================
  // Nas Sûresi (114) — 6 ayet
  // ===========================================================================
  k('النَّاسِ',   'en-nasi', '“insanların”',        'ا ل ن ~ a ا س i'),
  k('مَلِكِ',     'meliki',  '“hükümdarı”',         'م a ل i ك i'),
  k('إِلٰهِ',     'ilahi',   '“ilahı”',             'ا i ل a ه i'),
  k('الْوَسْوَاسِ', 'el-vesvas', '“vesveseci”',     'ا ل 0 و a س 0 و a ا س i'),
  k('الْخَنَّاسِ', 'el-hannas', '“sinsi”',          'ا ل 0 خ a ن ~ a ا س i'),
  k('يُوَسْوِسُ', 'yüvesvisü', '“vesvese verir”',   'ي u و a س 0 و i س u'),
  k('صُدُورِ',    'sudûri',  '“göğüslerinde”',      'ص u د u M ر i'),
  k('الْجِنَّةِ', 'el-cinneti', '“cinler”',         'ا ل 0 ج i ن ~ a ة i'),

  // ===========================================================================
  // Kevser Sûresi (108) — 3 ayet
  // ===========================================================================
  k('إِنَّا',     'inna',    '“muhakkak ki biz”',  'ا i ن ~ a ا'),
  k('أَعْطَيْنَاكَ', 'a‘taynake', '“sana verdik”',  'ا a ع 0 ط a ي 0 ن a ا ك a'),
  k('الْكَوْثَرَ', 'el-Kevser', '“Kevser”',         'ا ل 0 ك a و 0 ث a ر a'),
  k('فَصَلِّ',    'fesalli', '“öyleyse namaz kıl”',  'ف a ص a ل ~ i'),
  k('وَانْحَرْ',  've-nhar', '“ve kurban kes”',     'و a ا 0 ن 0 ح a ر 0'),
  k('شَانِئَكَ',  'şani’eke', '“sana kin tutan”',   'ش a ا ن i ء a ك a'),
  k('الْأَبْتَرُ', 'el-ebter', '“soyu kesik”',       'ا ل 0 ا a ب 0 ت a ر u'),

  // ===========================================================================
  // Asr Sûresi (103) — 3 ayet
  // ===========================================================================
  k('وَالْعَصْرِ', 've-l-asri', '“asra yemin olsun”', 'و a ا ل 0 ع a ص 0 ر i'),
  k('الْإِنْسَانَ', 'el-insane', '“insan”',          'ا ل 0 ا i ن 0 س a ا ن a'),
  k('لَفِي',     'lefî',    '“gerçekten içindedir”', 'ل a ف i M'),
  k('خُسْرٍ',    'husrin',  '“ziyan / hüsran”',    'خ u س 0 ر I'),
  k('إِلَّا',     'illa',    '“ancak”',             'ا i ل ~ a ا'),
  k('آمَنُوا',   'amenû',   '“iman ettiler”',      'ا M م a ن u M ا'),
  k('عَمِلُوا',  'amilû',   '“iş işlediler”',      'ع a م i ل u M ا'),
  k('الصَّالِحَاتِ', 'es-salihat', '“salih ameller”', 'ا ل ص ~ a ا ل i ح a ا ت i'),
  k('تَوَاصَوْا', 'tevasav', '“tavsiyeleştiler”',  'ت a و a ا ص a و 0 ا'),
  k('بِالْحَقِّ', 'bi-l-hakkı', '“hak ile”',        'ب i ا ل 0 ح a ق ~ i'),
  k('بِالصَّبْرِ', 'bi-s-sabri', '“sabır ile”',     'ب i ا ل ص ~ a ب 0 ر i'),

  // ===========================================================================
  // Nasr Sûresi (110) — 3 ayet
  // ===========================================================================
  k('جَاءَ',     'cae',     '“geldi”',             'ج a ا ء a'),
  k('نَصْرُ',    'nasru',   '“yardım”',             'ن a ص 0 ر u'),
  k('الْفَتْحُ', 'el-fethu', '“fetih”',             'ا ل 0 ف a ت 0 ح u'),
  k('رَأَيْتَ',  'reeyte',  '“gördün”',             'ر a ا a ي 0 ت a'),
  k('يَدْخُلُونَ', 'yedhulûne', '“giriyorlar”',     'ي a د 0 خ u ل u M ن a'),
  k('دِينِ',     'dîni',    '“dinine”',             'د i M ن i'),
  k('أَفْوَاجًا', 'efvacen', '“bölük bölük”',      'ا a ف 0 و a ا ج A ا'),
  k('فَسَبِّحْ', 'fesebbih', '“tesbih et”',         'ف a س a ب ~ i ح 0'),
  k('بِحَمْدِ',  'bi-hamdi', '“hamd ile”',          'ب i ح a م 0 د i'),
  k('رَبِّكَ',   'rabbike', '“Rabbinin”',           'ر a ب ~ i ك a'),
  k('وَاسْتَغْفِرْهُ', 've-stağfirh', '“ve O’ndan af dile”', 'و a ا 0 س 0 ت a غ 0 ف i ر 0 ه u'),
  k('كَانَ',     'kane',    '“oldu / idi”',         'ك a ا ن a'),
  k('تَوَّابًا', 'tevvaben', '“tevbeleri kabul edici”', 'ت a و ~ a ا ب A ا'),

  // ===========================================================================
  // Kafirûn Sûresi (109) — 6 ayet
  // ===========================================================================
  k('يَا',       'ya',      '“ey”',                'ي a ا'),
  k('أَيُّهَا',  'eyyüha',  '“ey siz”',             'ا a ي ~ u ه a ا'),
  k('الْكَافِرُونَ', 'el-kafirûn', '“kafirler”',    'ا ل 0 ك a ا ف i ر u M ن a'),
  k('أَعْبُدُ',  'a‘büdü',  '“ibadet ederim”',      'ا a ع 0 ب u د u'),
  k('تَعْبُدُونَ', 'ta‘büdûne', '“ibadet edersiniz”', 'ت a ع 0 ب u د u M ن a'),
  k('عَابِدُونَ', 'abidûne', '“ibadet edicilersiniz”', 'ع a ا ب i د u M ن a'),
  k('عَابِدٌ',   'abidün',  '“ibadet edici”',       'ع a ا ب i د U'),
  k('عَبَدْتُمْ', 'abedtüm', '“ibadet ettiniz”',    'ع a ب a د 0 ت u م 0'),
  k('لَكُمْ',    'leküm',   '“sizin için”',         'ل a ك u م 0'),
  k('دِينُكُمْ', 'dîneküm', '“sizin dininiz”',      'د i M ن u ك u م 0'),
  k('وَلِيَ',    'veliye',  '“ve benim için”',      'و a ل i ي a'),
  k('دِينِ',     'dîni',    '“benim dinim”',        'د i M ن i'),

  // ===========================================================================
  // Fil Sûresi (105) — 5 ayet
  // ===========================================================================
  k('أَلَمْ',     'elem',    '“görmedin mi?”',     'ا a ل a م 0'),
  k('تَرَ',      'tera',    '“görmedin mi”',       'ت a ر a'),
  k('كَيْفَ',    'keyfe',   '“nasıl”',              'ك a ي 0 ف a'),
  k('فَعَلَ',    'feale',   '“yaptı”',              'ف a ع a ل a'),
  k('رَبُّكَ',   'rabbüke', '“Rabbin”',             'ر a ب ~ u ك a'),
  k('بِأَصْحَابِ', 'bi-eshabi', '“sahiplerine”',    'ب i ا a ص 0 ح a ا ب i'),
  k('الْفِيلِ',  'el-fîli', '“fil”',                'ا ل 0 ف i M ل i'),
  k('يَجْعَلْ',  'yec‘al',  '“kılmadı mı?”',        'ي a ج 0 ع a ل 0'),
  k('كَيْدَهُمْ', 'keydehüm', '“tuzaklarını”',     'ك a ي 0 د a ه u م 0'),
  k('تَضْلِيلٍ', 'tadlîlin', '“boşa çıkarma”',     'ت a ض 0 ل i M ل I'),
  k('أَرْسَلَ',  'ersele',  '“gönderdi”',           'ا a ر 0 س a ل a'),
  k('طَيْرًا',   'tayren',  '“kuşlar”',             'ط a ي 0 ر A ا'),
  k('أَبَابِيلَ', 'ebabîl', '“sürü sürü”',         'ا a ب a ا ب i M ل a'),
  k('تَرْمِيهِمْ', 'termîhim', '“onlara atıyordu”', 'ت a ر 0 م i M ه i م 0'),
  k('بِحِجَارَةٍ', 'bi-hicaretin', '“taşlarla”',    'ب i ح i ج a ا ر a ة I'),
  k('سِجِّيلٍ',  'siccîlin', '“pişirilmiş çamur”', 'س i ج ~ i M ل I'),
  k('فَجَعَلَهُمْ', 'fece‘alehüm', '“onları kıldı”', 'ف a ج a ع a ل a ه u م 0'),
  k('كَعَصْفٍ',  'ke-asfin', '“ekin yaprağı gibi”', 'ك a ع a ص 0 ف I'),
  k('مَأْكُولٍ', 'me’kûlin', '“yenilmiş”',         'م a ا 0 ك u M ل I'),

  // ===========================================================================
  // Kureyş Sûresi (106) — 4 ayet
  // ===========================================================================
  k('لِإِيلَافِ', 'li-îlafi', '“ülfet etmesi için”', 'ل i ا i M ل a ا ف i'),
  k('قُرَيْشٍ',  'Kureyşin', '“Kureyş’in”',        'ق u ر a ي 0 ش I'),
  k('إِيلَافِهِمْ', 'îlafihim', '“onların ülfeti”', 'ا i M ل a ا ف i ه i م 0'),
  k('رِحْلَةَ',  'rıhlete', '“yolculuk”',          'ر i ح 0 ل a ة a'),
  k('الشِّتَاءِ', 'eş-şitai', '“kışın”',           'ا ل ش ~ i ت a ا ء i'),
  k('وَالصَّيْفِ', 've-s-sayfi', '“ve yazın”',     'و a ا ل ص ~ a ي 0 ف i'),
  k('فَلْيَعْبُدُوا', 'felya‘büdû', '“öyleyse ibadet etsinler”', 'ف a ل 0 ي a ع 0 ب u د u M ا'),
  k('رَبَّ',     'rabbe',   '“Rabbi”',              'ر a ب ~ a'),
  k('الْبَيْتِ', 'el-beyti', '“ev / Ka‘be”',        'ا ل 0 ب a ي 0 ت i'),
  k('أَطْعَمَهُمْ', 'at‘amehüm', '“onları doyurdu”', 'ا a ط 0 ع a م a ه u م 0'),
  k('جُوعٍ',     'cû‘in',   '“açlık”',              'ج u M ع I'),
  k('وَآمَنَهُمْ', 've-amenehüm', '“ve onları emin kıldı”', 'و a ا M م a ن a ه u م 0'),
  k('خَوْفٍ',    'havfin',  '“korku”',              'خ a و 0 ف I'),

  // ===========================================================================
  // Ek kelimeler — kısa sureler, dua ve sık öğretim kelimeleri (≥250 kelime için)
  // ===========================================================================
  k('إِنَّهُ',   'innehu',  '“şüphesiz O”',         'ا i ن ~ a ه u'),
  k('إِنَّهَا',  'inneha',  '“şüphesiz o (dişi)”',  'ا i ن ~ a ه a'),
  k('إِنَّكَ',   'inneke',  '“şüphesiz sen”',       'ا i ن ~ a ك a'),
  k('إِنَّنِي',  'inne-nî','“ben şüphesiz”',       'ا i ن ~ a ن i'),
  k('إِنَّهُمْ', 'innahüm','“şüphesiz onlar”',     'ا i ن ~ a ه u م 0'),
  k('أَنَّ',     'enne',    '“-dığına / çünkü”',    'ا a ن ~ a'),
  k('لٰكِنَّ',   'lakinne', '“ama / fakat”',       'ل a ك i ن ~ a'),
  k('لٰكِنْ',    'lakin',   '“fakat”',              'ل a ك i ن 0'),
  k('إِلهُ',     'ilahü',   '“ilahı”',              'ا i ل a ه u'),
  k('آيَةً',     'ayeten',  '“bir aya (işaret)”',   'ا M ي a ة A'),
  k('آيَاتٍ',    'ayatin',  '“ayetlerden”',        'ا M ي a ت I'),
  k('آيَاتٌ',    'ayatun',  '“ayetler”',           'ا M ي a ت U'),
  k('كِتَابٍ',    'kitabin','“bir kitaptan”',      'ك i ت a ا ب I'),
  k('كِتَابٌ',    'kitabun','“bir kitap”',         'ك i ت a ا ب U'),
  k('حَكِيمٌ',    'hakîmun','“hükümran / hikmetli”','ح a ك i M م U'),
  k('حَكِيمًا',   'hakîmen','“hikmet sahibi”',      'ح a ك i M م A ا'),
  k('عَلِيمًا',   '‘alîmen', '“(her şeyi) bilir”',  'ع a ل i M م A ا'),
  k('غَفُورٌ',    'ğafûrun','“çoğunca bağışlayan”', 'غ a ف u M ر U'),
  k('غَفُورًا',   'ğafûren','“bağışlayıcı olarak”','غ a ف u M ر A ا'),
  k('شَكُورٌ',    'şekûrun','“şükredenleri sever”','ش a ك u M ر U'),
  k('رَؤُوفٌ',    'reuûfun','“pek merhametli”',    'ر a ا u ف U'),
  k('صَمْدًا',    'sameda',  '“(samed) sığınak olarak”','ص a م 0 د A ا'),
  k('إِحدَىٰ',    'ihda',   '“(ikinin) birini”',    'ا i ح 0 د a ى'),
  k('اثْنَيْنِ',  'işneyne', '“ikisini birden”',    'ا 0 ث 0 ن a ي 0 ن i'),
  k('مِائَةٍ',    'mi-etin','“ yüz ”',             'م i ا ء a ت I'),
  k('وَاضِحًا',   'vadıhen', '“açıkça”',           'و a ا ض i ح A ا'),

  // Maûn (107), Tekasür (102), Humeze (104) ve benzer — kelime seçkisi
  k('يُكَذِّبُ','yukezzibu','“(yalan) diyor”',      'ي u ك a ذ ~ i ب u'),
  k('بِالدِّينِ','bi-d-dîni', '“din üzerinde / dîne”','ب i ا ل د ~ i M ن i'),
  k('الْيَتِيمَ','el-yetime', '“yetimi”',          'ا ل 0 ي a ت i م a'),
  k('طَعَامِ','taami',       '“(yemenin) tadını/tasarrufunu”','ط a ع a ا م i'),
  k('الْمِسْكِينِ','el-miskîni','“misakîne / yoksula”','ا ل 0 م i س 0 ك i ن i'),
  k('صَلَاتِهِمْ','salatihim', '“(onların) namazını”','ص a ل a ا ت i ه i م 0'),
  k('سَاهُونَ','sahûne',     '“(dalgınlar)”',       'س a ا ه u ن a'),
  k('صَلَاوَٰتُ','salavatü','(çoğ.namaz/bereket) ','ص a ل a و a ت u'),
  k('الْمَاعُونَ','el-ma‘ûne','“(Maûn: yardım eşyası)”','ا ل 0 م a ا ع u ن a'),
  k('تَكَاثُرَ','tekasura',  '“çoklukla övünmeyi”', 'ت a ك a ا ث u ر a'),
  k('أَلْهٰكُمْ','ellehāküm','“(sizi) oyaladı”',    'ا a ل 0 ه a ك u م 0'),
  k('الْجَاحِيمَ','el-cahîme', '“(cehennemi)”',     'ا ل 0 ج a ا ح i م a'),

  // Dürüst kısaltılmış sık dua ve zikir sözcükleri
  k('رَبَّنَا','rabbena',   '“Rabbimiz”',           'ر a ب ~ a ن a ا'),
  k('اغْفِرْلِي','ağfir lî',' “bana mağfiret et” ','ا 0 غ 0 ف i ر 0 ل i'),
  k('ارْحَمْنَا','erhamna', '“bize merhamet et”',  'ا 0 ر 0 ح a م 0 ن a ا'),
  k('هَدِنَا','hedina',    '“bizi hidayete erdir”','ه a د i ن a ا'),
  k('بِالْحَقِّ','bi-l-hakkı', '“hak ile” (tekrar)','ب i ا ل 0 ح a ق ~ i'),
  k('بِالصِّرَاطِ','bi-s-sırati', '“yol üzerinde”','ب i ا ل ص ~ i ر a ا ط i'),
  k('بِالْفَلَقِ','bi-l-felak', '“fecre/korunmaya”','ب i ا ل 0 ف a ل a ق i'),
  k('بِالنَّاسِ','bi-n-nasi', '“insanlardan (korunma)”','ب i ا ل ن ~ a ا س i'),
  k('مِنْ شَرِّ','min şerri', '“şerrinden”',      'م i ن 0 ش a ر ~ i'),
  k('مِنْ حَسَدٍ','min hasedin', '“hasedinden”',  'م i ن 0 ح a س a د I'),
  k('مَلِكِ النَّاسِ','meliki-n-nasi', '“insanların Meliki”','م a ل i ك i ا ل ن ~ a ا س i'),
  k('إِلٰهِ النَّاسِ','ilahi-n-nasi', '“insanların ilahı”','ا i ل a ه i ا ل ن ~ a ا س i'),
  k('فِي صُدُورِ','fî sudûri', '“göğüslerinde”',   'ف i ص u د u M ر i'),
  k('مِنَ الْجِنَّةِ','mine-l-cinneti', '“cinlerden”','م i ن a ا ل 0 ج i ن ~ a ة i'),
  k('وَالنَّاسِ','ve-n-nasi', '“ve insanlardan”',  'و a ا ل ن ~ a ا س i'),
  k('يَا رَبَّ','ya Rabbe', '“ey Rabbim”',         'ي a ا ر a ب ~ a'),
  k('رَبَّ الْعَالَمِينَ','rabbe-l-alemîn', '“alemlerin Rabbi”','ر a ب ~ a ا ل 0 ع a ا ل a م i M ن a'),
  k('الْحَمْدُ لِلّٰهِ','el-hamdü lillahi', '“hamd Allah’a mahsustur”','ا ل 0 ح a م 0 د u ل i ل ~ ه i'),
  k('سُبْحَانَ','sübhane',  '“noksan sıfatlardan münezzeh”','س u ب 0 ح a ن a'),
  k('سُبْحَانَ اللّٰهِ','sübhanellahi', '“Allah’ı tesbih ederim”','س u ب 0 ح a ن a ا ل ل ~ ه i'),
  k('الْحَقُّ','el-hakkü',  '“hak / gerçek”',     'ا ل 0 ح a ق ~ u'),
  k('الْعَزِيزُ','el-azîzü', '“izzet sahibi”',     'ا ل 0 ع a ز i M ز u'),
  k('الْغَفُورُ','el-ğafûrü', '“bağışlayıcı”',     'ا ل 0 غ a ف u M ر u'),
  k('الْوَدُودُ','el-vedûdü', '“çok seven”',       'ا ل 0 و a د u M د u'),
  k('الْحَكِيمُ','el-hakîmü', '“hikmet sahibi”',   'ا ل 0 ح a ك i M م u'),
  k('الْعَلِيمُ','el-‘alîmü', '“her şeyi bilen”',   'ا ل 0 ع a ل i M م u'),
  k('الْخَبِيرُ','el-habîrü', '“hiçbir şeyden gafil değil”','ا ل 0 خ a ب i M ر u'),
  k('السَّمِيعُ','es-semî‘u', '“işiten”',          'ا ل س ~ a م i M ع u'),
  k('الْبَصِيرُ','el-basîrü', '“gören”',           'ا ل 0 ب a ص i M ر u'),
  k('السَّلَامُ','es-selamü', '“selam (es-selam)”','ا ل س ~ a ل a ا م u'),
  k('الْمُؤْمِنُ','el-mü’minü', '“imanı koruyan”', 'ا ل 0 م u ا 0 م i ن u'),
  k('الْمُهَيْمِنُ','el-müheyminü', '“her şeye hakim”','ا ل 0 م u ه a ي 0 م i ن u'),
  k('الْجَبَّارُ','el-cabbarü', '“dilediğini yapan”','ا ل 0 ج a ب ~ a ر u'),
  k('الْمُتَكَبِّرُ','el-mütekabbirü', '“büyüklükten münezzeh”','ا ل 0 م u ت a ك a ب ~ i ر u'),
  k('الْخَالِقُ','el-halıkü', '“yaratan”',         'ا ل 0 خ a ا ل i ق u'),
  k('الْبَارِئُ','el-bariu', '“yoktan var eden”',  'ا ل 0 ب a ا ر i ء u'),
  k('الْمُصَوِّرُ','el-musavvirü', '“suret veren”','ا ل 0 م u ص a و ~ i ر u'),
  k('الْجَمِيلُ','el-cemîlü', '“güzel”',           'ا ل 0 ج a م i M ل u'),
  k('الْقَرِيبُ','el-karîbü', '“yakın”',           'ا ل 0 ق a ر i M ب u'),
  k('الْمُجِيبُ','el-mucîbü', '“duaya icabet eden”','ا ل 0 م u ج i M ب u'),
  k('الْحَنَّانُ','el-hannanu', '“merhamet eden”', 'ا ل 0 ح a ن ~ a ن u'),
  k('الْمَنَّانُ','el-mennanu', '“nimet veren”',   'ا ل 0 م a ن ~ a ن u'),
  k('الْوَهَّابُ','el-vehhabü', '“karşılıksız veren”','ا ل 0 و a ه ~ a ب u'),
  k('الْفَتَّاحُ','el-fettahü', '“hüküm açan”',    'ا ل 0 ف a ت ~ a ح u'),

  // Uzayıcı tekrarı önlemek için farklı esma ve sıfat birleşimleri / kısa cümlecikler
  k('آمَنتُ باللّٰهِ','amentü billahi',' “Allah’a îman ettim”','ا M م a ن 0 ت u ب i ل ل ~ ه i'),
  k('حَقًّا','hakkan',' “hak olarak / gerçekten” ','ح a ق ~ A ا'),
  k('لاَ إِلهَ إِلاَّ هوَ','la ilahe illa hüve', '“O’ndan başka ilah yok”','ل a ا ا i ل a ه a ا i ل ~ a ا ه u و a'),
  k('وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ','ve hüve ala kulli şey’in kadîr', '“O her şeye kadirdir”','و a ه u و a ع a ل a ى ك u ل ~ i ش a ي 0 ء I ق a د i M ر U'),
  k('وَهُوَ السَّمِيعُ الْعَلِيمُ','ve hüve-s-semî‘u-l-‘alîm', '“O işitendir, bilendir”','و a ه u و a ا ل س ~ a م i M ع u ا ل 0 ع a ل i M م u'),
  k('رَبِّ اغْفِرْ وَارْحَمْ','rabbi ağfir verham', '“Rabbim bağışla ve merhamet et”','ر a ب ~ i ا 0 غ 0 ف i ر 0 و a ا 0 ر 0 ح a م 0'),
  k('وَأَنْتَ خَيْرُ الرَّاحِمِينَ','ve ente hayrur-rahimîn', '“sen merhametlilerin en hayırlısısın”','و a ا a ن 0 ت a خ a ي 0 ر u ا ل ر ~ a ا ح i م i M ن a'),
  k('رَبَّنَا آتِنَا','rabbena atina', '“Rabbimiz bize ver”','ر a ب ~ a ن a ا ا M ت i ن a ا'),
  k('فِي الدُّنْيَا وَالْآخِرَةِ','fi-d-dünya ve-l-ahireti', '“dünya ve ahirette”','ف i ا ل د ~ u ن 0 ي a و a ا ل M ا خ i ر a ة i'),
  k('حَسَنَةً','haseneten',' “iyi / güzel bir şey olarak” ','ح a س a ن a ة A'),
  k('وَاقِعًا','vaḳıan','“(ortaya çıkan) olarak” ','و a ا ق i ع A ا'),
  k('تَائِبًا','taiben',' “tevbe ederek” ','ت a ا i ب A ا'),
  k('عَٰبِدًا','abida','“(ibadet ederek)” ','ع a ب i د A ا'),
  k('شَاكِرًا','şakiren',' “şükrederek” ','ش a ا ك i ر A ا'),
  k('صَابِرًا','sabiren',' “sabr ederek” ','ص a ا ب i ر A ا'),

  // Kısa sıfat-cevher tekrarı (öğretim amaçlı, farklı yazım)
  k('رَحْمَةٌ','rahmetun',' “bir rahmet” ','ر a ح 0 م a ة U'),
  k('بَرَكَةٌ','bereketun',' “bereket” ','ب a ر a ك a ة U'),
  k('رَحْمَتُهُ','rahmetuhu',' “rahmeti” ','ر a ح 0 م a ت u ه u'),
  k('خَيْرٌ','hayrun','“hayır”',              'خ a ي 0 ر U'),
  k('خَيْرًا','hayren',' “hayır olarak” ',   'خ a ي 0 ر A ا'),
  k('شَرٌّ','şerrun','“şer”',                'ش a ر ~ U'),
  k('نُورًا','nûren',' “nûr olarak” ',       'ن u و a ر A ا'),
  k('هُدًى','huden','“hüda olarak” ',        'ه u د A ا'),
  k('ذِكْرًا','zikren','“zikir olarak” ',    'ذ i ك 0 ر A ا'),
  k('حِكْمَةً','hikmeten','“hikmet” ',        'ح i ك 0 م a ة A'),
  k('قُوَّةً','kuvveten','“kuvvet” ',         'ق u و ~ a ة A'),
  k('مَوْلَىٰ','mevla','“velî / sahip” ',    'م a و 0 ل a ى'),
  k('مَوْلَاهُ','mevlahü','“O’nun velîsi” ',  'م a و 0 ل a ه u'),

  // Fatiha tekrarı (ayrı diziliş ile — öğrenci alıştırması)
  k('بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ','bi-smi’llahi-r-Rahmani-r-Rahîm', '“besmele (tam)”','ب i س 0 م i ا ل ل ~ ه i ا ل ر ~ a ح 0 م a ن i ا ل ر ~ a ح i M م i'),
  k('الْحَمْدُ لِلّٰهِ رَبِّ الْعَالَمِينَ','el-hamdü lillahi rabbi-l-alemîn', '“alemlerin Rabbine hamd”','ا ل 0 ح a م 0 د u ل i ل ~ ه i ر a ب ~ i ا ل 0 ع a ا ل a م i M ن a'),

  // Ad-Duha ve eş-Şerh seçkisi
  k('وَالضُّحَىٰ','ve-d-duha','“kuşluk vaktine”','و a ا ل ض ~ u ح a ى'),
  k('وَاللَّيْلِ','ve-l-leyle', '“geceye”',        'و a ا ل ل ~ a ي 0 ل i'),
  k('مَا وَدَّعَكَ','ma vedde‘ake', '“seni bırakmadı”','م a ا و a د ~ a ع a ك a'),
  k('رَبُّكَ','rabbüke','“Rabbin”',              'ر a ب ~ u ك a'),
  k('قَلَىٰ','kela','“(sana karşı kötülük) bilmedi”','ق a ل a ى'),
  k('لَسَوْفَ','lesevfe', '“(ileride)And ver”',   'ل a س u و 0 ف a'),
  k('يُعْطِيكَ','yû‘tîke','“sana verecek”',      'ي u ع 0 ط i ك a'),
  k('فَإِذَا','fe-iza', '“öyleyse ne zaman ki”','ف a ا i ذ a ا'),
  k('فَرَغْتَ','ferağte', '“boşaldın / işini bitirdin”','ف a ر 0 غ 0 ت a'),
  k('فَانْصَبْ','fansab', '“yorul da yorul”',     'ف a ا 0 ن 0 ص a ب 0'),
  k('إِلَىٰ رَبِّكَ','ila rabbike','“Rabbine doğru”','ا i ل a ى ر a ب ~ i ك a'),
  k('فَارْغَبْ','farğab','“iste / yönel”',      'ف a ا 0 ر 0 غ a ب 0'),

  // Kısa sure ve sûre başlıkları (okuma alıştırması)
  k('سُورَةُ الْأَعْلَىٰ','sûretü-l-A‘la', '“A‘la sûresi”','س u و a ر a ة u ا ل 0 ا a ع 0 ل a ى'),
  k('سُورَةُ الشَّمْسِ','sûretü-ş-Şems', '“Şems sûresi”','س u و a ر a ة u ا ل ش ~ a م 0 س i'),
  k('سُورَةُ اللَّيْلِ','sûretü-l-Leyl', '“Leyl sûresi”','س u و a ر a ة u ا ل ل ~ a ي 0 ل i'),
  k('سُورَةُ الضُّحَىٰ','sûretü-d-Duha', '“Duha sûresi”','س u و a ر a ة u ا ل ض ~ u ح a ى'),
  k('سُورَةُ الشَّرْحِ','sûretü-ş-Şerh', '“İnşirah (Şerh) sûresi”','س u و a ر a ة u ا ل ش ~ a ر 0 ح i'),
  k('سُورَةُ التِّينِ','sûretü-t-Tîn', '“Tîn sûresi”','س u و a ر a ة u ا ل ت ~ i M ن i'),
  k('سُورَةُ الْعَلَقِ','sûretü-l-‘Alak', '“Alak sûresi”','س u و a ر a ة u ا ل 0 ع a ل a ق i'),
  k('سُورَةُ الْقَدْرِ','sûretü-l-Kadr', '“Kadr sûresi”','س u و a ر a ة u ا ل 0 ق a د 0 ر i'),
  k('سُورَةُ الْبَيِّنَةِ','sûretü-l-Beyyine', '“Beyyine sûresi”','س u و a ر a ة u ا ل 0 ب a ي ~ i ن a ة i'),
  k('سُورَةُ الزَّلْزَلَةِ','sûretüz-Zelzele', '“Zelzele sûresi”','س u و a ر a ة u ا ل ز ~ a ل 0 ز a ل a ة i'),
  k('سُورَةُ الْعَادِيَاتِ','sûretü-l-‘adiyat', '“adiyat sûresi”','س u و a ر a ة u ا ل 0 ع a ا د i ي a ا ت i'),
  k('سُورَةُ الْمَاعُونِ','sûretü-l-Maûn', '“Maûn sûresi”','س u و a ر a ة u ا ل م a ا ع u ن i'),
  k('سُورَةُ التَّكَاثُرِ','sûretü-t-Tekasür', '“Tekasür sûresi”','س u و a ر a ة u ا ل ت ~ a ك a ا ث u ر i'),
  k('سُورَةُ الْعَصْرِ','sûretü-l-‘Asr', '“Asr sûresi”','س u و a ر a ة u ا ل 0 ع a ص 0 ر i'),
  k('سُورَةُ الْهُمَزَةِ','sûretü-l-Humeze', '“Humeze sûresi”','س u و a ر a ة u ا ل 0 ه u م a ز a ة i'),
  k('سُورَةُ الْفِيلِ','sûretü-l-Fîl', '“Fîl sûresi”','س u و a ر a ة u ا ل 0 ف i M ل i'),
  k('سُورَةُ قُرَيْشٍ','sûretü Kureyş', '“Kureyş sûresi”','س u و a ر a ة u ق u ر a ي 0 ش I'),

  // Kalan adet için kısa “ezber / tekrar” ifadeleri
  k('يَارَبَّ','ya Rabbe', '“ey Rabbim”',         'ي a ا ر a ب ~ a'),
  k('آمِينَ','amîne', '“amîn”',                  'ا M م i ن a'),
  k('آمِينُ','amînü', '“amîn (bitiş sesi)”',     'ا M م i ن u'),
  k('آمِنُوا','aminû', '“iman edin”',            'ا M م i ن u M ا'),
  k('يُؤْمِنُونَ','yu’minûne', '“iman ederler”','ي u ا 0 م i ن u M ن a'),
  k('كَفَرُوا','keferû', '“inkar ettiler”',     'ك a ف a ر u M ا'),
  k('ظَلَمُوا','zalemû', '“zulmettiler”',      'ظ a ل a م u M ا'),
  k('هَادُوا','hadû', '“(Yahûdîler) olarak”',    'ه a ا د u M ا'),
  k('نَصَارَىٰ','nasara', '“(Hristiyanlar)”',   'ن a ص a ر a ى'),
  k('أَجْمَعِينَ','ecma‘în', '“tümüyle”',        'ا a ج 0 م a ع i M ن a'),
  k('يَجْمَعُ','yecma‘u', '“toplar / bir araya getirir”','ي a ج 0 م a ع u'),
  k('يُبَشِّرُ','yubeşşiru', '“müjde verir”',   'ي u ب a ش ~ i ر u'),
  k('يُنْذِرُ','yunziru', '“ikaz eder / uyarır”','ي u ن 0 ذ i ر u'),
  k('بِإِذْنِ','bi-idhni', '“izniyle”',         'ب i ا i ذ 0 ن i'),
  k('إِذْنِ','idhnî', '“iznim / iznin”',        'ا i ذ 0 ن i'),
  k('عَظِيمٌ','azîmun', '“büyük / azîm”',      'ع a ظ i M م U'),
  k('كَبِيرٌ','kebîrun', '“büyük”',            'ك a ب i M ر U'),
  k('عَظِيمًا','azîmen', '“azîm olarak”',     'ع a ظ i M م A ا'),
  k('حَكِيمٌ','hakîmun', '“hikmetli”',         'ح a ك i M م U'),
  k('عَلِيمٌ','‘alîmun', '“her şeyi bilen”',     'ع a ل i M م U'),
  k('غَفُورٌ','ğafûrun', '“bağışlayan”',        'غ a ف u M ر U'),
  k('حَلِيمٌ','halîmun', '“yumuşak huylu”',     'ح a ل i M م U'),
  k('شَدِيدٌ','şedîdun', '“şiddetli”',         'ش a د i M د U'),
  k('شَكُورٌ','şekûrun', '“şükredenleri sever”','ش a ك u M ر U'),
  k('حَمِيدٌ','hamîdun', '“övgüye layık”',     'ح a م i M د U'),
  k('مَجِيدٌ','mecîdun', '“şanlı / yüce”',     'م a ج i M د U'),
  k('صَادِقٌ','sadıkun', '“doğru sözlü”',      'ص a ا د i ق U'),
  k('ثَاقِبٌ','sakıbun', '“parlak / delen”',   'ث a ا ق i ب U'),

  // Son tamamlayıcı küçük ekleme (liste ≥250 için)
  k('آتَاكَ','ateke', '“sana verdi / geldi”',   'ا M ت a ك a')
];

