// =============================================================================
// Braille Matematik Kılavuzu - 1. Bölüm: Braille Matematikte Temel Kavramlar.
// -----------------------------------------------------------------------------
// Bu dosyadaki Modül 6 verileri proje kökündeki braille_mat_kilavuzu.pdf
// dosyasının yalnızca 1. bölümündeki tablo ve kurallara göre düzenlenmiştir.
// =============================================================================

export const RAKAM_GOSTERGESI = [3, 4, 5, 6];

const HARF_ISARETI = [5, 6];
const BUYUK_HARF_ISARETI = [6];
const GEOMETRI_ISARETI = [4, 5, 6];

const HARF = {
  a: [1], b: [1, 2], c: [1, 4], d: [1, 4, 5], e: [1, 5],
  f: [1, 2, 4], g: [1, 2, 4, 5], h: [1, 2, 5], i: [2, 4], j: [2, 4, 5],
  k: [1, 3], l: [1, 2, 3], m: [1, 3, 4], n: [1, 3, 4, 5], o: [1, 3, 5],
  p: [1, 2, 3, 4], q: [1, 2, 3, 4, 5], r: [1, 2, 3, 5], s: [2, 3, 4], t: [2, 3, 4, 5],
  u: [1, 3, 6], v: [1, 2, 3, 6], w: [2, 4, 5, 6], x: [1, 3, 4, 6], y: [1, 3, 4, 5, 6], z: [1, 3, 5, 6]
};

const RAKAM = {
  '1': HARF.a, '2': HARF.b, '3': HARF.c, '4': HARF.d, '5': HARF.e,
  '6': HARF.f, '7': HARF.g, '8': HARF.h, '9': HARF.i, '0': HARF.j
};

const ALT_RAKAM = {
  '1': [2], '2': [2, 3], '3': [2, 5], '4': [2, 5, 6], '5': [2, 6],
  '6': [2, 3, 5], '7': [2, 3, 5, 6], '8': [2, 3, 6], '9': [3, 5], '0': [3, 5, 6]
};

/** Türkçe litteratür Braille sıra sayısı (MEB 1.2.6): rakam hücreleri üst satırdan alta “indirgenmiş” yazılır. */
export const SIRA_SAYISI_RAKAM_NOKTALARI = ALT_RAKAM;

const BOSLUKSUZ = (...parcalar) => parcalar.flatMap((parca) => parca);
const harfler = (metin) => [...metin.toLowerCase()].map((harf) => HARF[harf]).filter(Boolean);
const kucukHarf = (metin) => [HARF_ISARETI, ...harfler(metin)];
const buyukHarf = (metin) => [HARF_ISARETI, BUYUK_HARF_ISARETI, ...harfler(metin)];
const ekHucreleri = (ek = []) => {
  if (!Array.isArray(ek) || ek.length === 0) return [];
  return Array.isArray(ek[0]) ? ek : [ek];
};
const olcu = (metin, ek = []) => [HARF_ISARETI, ...harfler(metin), ...ekHucreleri(ek)];
const bolukluSayiMi = (deger) => /^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/u.test(String(deger));
const sayi = (deger) => [
  RAKAM_GOSTERGESI,
  ...String(deger).split('').map((karakter) => {
    if (karakter === ',') return [2];
    if (karakter === '.') return bolukluSayiMi(deger) ? [3] : [3, 6];
    return RAKAM[karakter];
  }).filter(Boolean)
];
const altSayi = (deger) => String(deger).split('').map((karakter) => ALT_RAKAM[karakter]).filter(Boolean);

const ISLEM = {
  arti: [HARF_ISARETI, [2, 6]],
  eksi: [HARF_ISARETI, [3, 6]],
  carpma: [HARF_ISARETI, [2, 3, 6]],
  bolme: [HARF_ISARETI, [2, 5]],
  esit: [HARF_ISARETI, [2, 3, 5, 6]],
  skalerCarpma: [HARF_ISARETI, [3]],
  artiEksi: [HARF_ISARETI, [2, 6], [3, 6]],
  esitDegil: [[5], [2, 3, 5, 6]],
  kucuktur: [[3], [2, 4, 6]],
  buyuktur: [[3], [1, 3, 5]],
  kucukEsit: [[3], [2, 4, 6], [2, 3, 5, 6]],
  buyukEsit: [[3], [1, 3, 5], [2, 3, 5, 6]],
  ust: [[3, 4, 6]],
  kok: [[1, 4, 6]],
  kesirCizgisi: [[3, 4]],
  faktoryel: [[1, 2, 3, 4, 6]]
};

export const MATEMATIK_RAKAMLAR = [
  { ad: 'sıfır', rakam: '0', noktalar: RAKAM['0'] },
  { ad: 'bir', rakam: '1', noktalar: RAKAM['1'] },
  { ad: 'iki', rakam: '2', noktalar: RAKAM['2'] },
  { ad: 'üç', rakam: '3', noktalar: RAKAM['3'] },
  { ad: 'dört', rakam: '4', noktalar: RAKAM['4'] },
  { ad: 'beş', rakam: '5', noktalar: RAKAM['5'] },
  { ad: 'altı', rakam: '6', noktalar: RAKAM['6'] },
  { ad: 'yedi', rakam: '7', noktalar: RAKAM['7'] },
  { ad: 'sekiz', rakam: '8', noktalar: RAKAM['8'] },
  { ad: 'dokuz', rakam: '9', noktalar: RAKAM['9'] }
].map((rakam) => ({ ...rakam, hucreler: [RAKAM_GOSTERGESI, rakam.noktalar] }));

export const MATEMATIK_SEMBOLLER = [
  { ad: 'rakam işareti', sembol: 'L', aciklama: 'Rakamlar harflerden ayrılırken önce rakam işareti yazılır. Noktaları: 3-4-5-6.', hucreler: [RAKAM_GOSTERGESI] },
  { ad: 'çift rakam işareti', sembol: 'LL', aciklama: 'Üçten fazla ardışık/alt alta sayıda ilk sayının başına çift rakam işareti yazılır.', hucreler: [RAKAM_GOSTERGESI, RAKAM_GOSTERGESI] },
  { ad: 'bölük işareti', sembol: '’', aciklama: 'Üç basamaktan fazla sayılarda sağdan üçer basamak ayırmak için 3. nokta kullanılır.', hucreler: [[3]] },
  { ad: 'bağ işareti', sembol: '-', aciklama: 'Bağlantılı sayılar ve zaman ifadelerinde araya 3-6 noktaları yazılır.', hucreler: [[3, 6]] },
  { ad: 'virgül / ondalık gösterim', sembol: ',', aciklama: 'Matematikte sayıların arasındaki virgül ve ondalık gösterim 2. nokta ile yazılır; ondalık yazımda virgülden sonra ikinci bir rakam işareti kullanılmaz.', hucreler: [[2]] },
  { ad: 'harf işareti', sembol: '\\', aciklama: 'Matematikte tek küçük harflerin önüne 5-6 noktaları yazılır.', hucreler: [HARF_ISARETI] },
  { ad: 'tek büyük harf işareti', sembol: '\\^', aciklama: 'Tek büyük harf için harf işaretinden sonra 6. nokta kullanılır.', hucreler: [HARF_ISARETI, BUYUK_HARF_ISARETI] },
  { ad: 'artı', sembol: '+', aciklama: 'Kılavuza göre artı işareti iki hücredir: 5-6 ve 2-6.', hucreler: ISLEM.arti },
  { ad: 'eksi', sembol: '-', aciklama: 'Kılavuza göre eksi işareti iki hücredir: 5-6 ve 3-6.', hucreler: ISLEM.eksi },
  { ad: 'çarpma', sembol: '×', aciklama: 'Çarpma yalnızca Unicode × (çarpı) ile yazılır; Latin x harfi çarpma değildir. İki hücre: 5-6 ve 2-3-6.', hucreler: ISLEM.carpma },
  { ad: 'bölme', sembol: '÷', aciklama: 'Kılavuza göre bölme işareti iki hücredir: 5-6 ve 2-5.', hucreler: ISLEM.bolme },
  { ad: 'eşittir', sembol: '=', aciklama: 'Kılavuza göre eşittir işareti iki hücredir: 5-6 ve 2-3-5-6.', hucreler: ISLEM.esit },
  { ad: 'skaler çarpma', sembol: '•', aciklama: 'Skaler çarpma işareti iki hücredir: 5-6 ve 3. Metinde madde imi (•) veya orta nokta (·) kullanılabilir.', hucreler: ISLEM.skalerCarpma },
  { ad: 'artı eksi', sembol: '±', aciklama: 'Artı eksi işareti üç hücredir: 5-6, 2-6 ve 3-6.', hucreler: ISLEM.artiEksi },
  { ad: 'işlem çizgisi', sembol: 'çizgi', aciklama: 'Alt alta işlemlerde işlem çizgisi için 2-5 noktaları kullanılır.', hucreler: [[2, 5]] },
  { ad: 'küçüktür', sembol: '<', aciklama: 'Karşılaştırma işareti: 3 ve 2-4-6.', hucreler: ISLEM.kucuktur },
  { ad: 'büyüktür', sembol: '>', aciklama: 'Karşılaştırma işareti: 3 ve 1-3-5.', hucreler: ISLEM.buyuktur },
  { ad: 'küçük eşit', sembol: '≤', aciklama: 'Küçüktür işaretine eşittir hücresi eklenir: 3, 2-4-6, 2-3-5-6.', hucreler: ISLEM.kucukEsit },
  { ad: 'büyük eşit', sembol: '≥', aciklama: 'Büyüktür işaretine eşittir hücresi eklenir: 3, 1-3-5, 2-3-5-6.', hucreler: ISLEM.buyukEsit },
  { ad: 'eşit değildir', sembol: '≠', aciklama: 'Eşit değildir işareti: 5 ve 2-3-5-6.', hucreler: ISLEM.esitDegil },
  { ad: 'denklik', sembol: '/', aciklama: 'Denklik işareti: 3 ve 2-3-5-6.', hucreler: [[3], [2, 3, 5, 6]] },
  { ad: 'denk değildir', sembol: '≁', aciklama: 'Denk değildir işareti: 5, 3 ve 2-3-5-6.', hucreler: [[5], [3], [2, 3, 5, 6]] },
  { ad: 'küme açma', sembol: '{', aciklama: 'Küme parantezi açma: 1-2-3-5-6 ve 3.', hucreler: [[1, 2, 3, 5, 6], [3]] },
  { ad: 'küme kapama', sembol: '}', aciklama: 'Küme parantezi kapama: 6 ve 2-3-4-5-6.', hucreler: [[6], [2, 3, 4, 5, 6]] },
  { ad: 'boş küme', sembol: 'Ø', aciklama: 'Boş küme, açma ve kapama küme paranteziyle gösterilir.', hucreler: [[1, 2, 3, 5, 6], [3], [6], [2, 3, 4, 5, 6]] },
  { ad: 'evrensel küme', sembol: 'E', aciklama: 'Evrensel küme diğer harf ifadelerinden farklı olarak 3 ve 3-5 ile gösterilir.', hucreler: [[3], [3, 5]] },
  { ad: 'doğal sayılar kümesi', sembol: 'N', aciklama: 'Doğal sayılar kümesi: harf işareti, büyük harf işareti, n.', hucreler: buyukHarf('n') },
  { ad: 'sayma sayıları kümesi', sembol: 'S', aciklama: 'Sayma sayıları kümesi: harf işareti, büyük harf işareti, s.', hucreler: buyukHarf('s') },
  { ad: 'tam sayılar kümesi', sembol: 'Z', aciklama: 'Tam sayılar kümesi: harf işareti, büyük harf işareti, z.', hucreler: buyukHarf('z') },
  { ad: 'rasyonel sayılar kümesi', sembol: 'Q', aciklama: 'Rasyonel sayılar kümesi: harf işareti, büyük harf işareti, q.', hucreler: buyukHarf('q') },
  { ad: 'irrasyonel sayılar kümesi', sembol: 'I', aciklama: 'İrrasyonel sayılar kümesi kılavuzda büyük I veya Q tümleyeniyle gösterilir.', hucreler: [HARF_ISARETI, BUYUK_HARF_ISARETI, [3, 5]] },
  { ad: 'gerçek sayılar kümesi', sembol: 'R', aciklama: 'Gerçek sayılar kümesi: harf işareti, büyük harf işareti, r.', hucreler: buyukHarf('r') },
  { ad: 'alt küme', sembol: '⊂', aciklama: 'Alt küme işareti: 3 ve 2-3-6.', hucreler: [[3], [2, 3, 6]] },
  { ad: 'kapsar', sembol: '⊃', aciklama: 'Kapsar işareti: 3 ve 1-2-4.', hucreler: [[3], [1, 2, 4]] },
  { ad: 'elemanıdır', sembol: '∈', aciklama: 'Elemanıdır işareti: 3 ve 1-5.', hucreler: [[3], [1, 5]] },
  { ad: 'birleşim', sembol: '∪', aciklama: 'Birleşim işareti: 3 ve 2-3-4-6.', hucreler: [[3], [2, 3, 4, 6]] },
  { ad: 'kesişim', sembol: '∩', aciklama: 'Kesişim işareti: 3 ve 2-4-5-6.', hucreler: [[3], [2, 4, 5, 6]] },
  { ad: 'fark', sembol: '\\', aciklama: 'Kümelerde fark işareti: 3 ve 1-6.', hucreler: [[3], [1, 6]] },
  { ad: 'parantez açma', sembol: '(', aciklama: 'Gruplandırma parantezi açma: 1-2-6.', hucreler: [[1, 2, 6]] },
  { ad: 'parantez kapama', sembol: ')', aciklama: 'Gruplandırma parantezi kapama: 3-4-5.', hucreler: [[3, 4, 5]] },
  { ad: 'köşeli parantez açma', sembol: '[', aciklama: 'Köşeli parantez açma: 2-4-6.', hucreler: [[2, 4, 6]] },
  { ad: 'köşeli parantez kapama', sembol: ']', aciklama: 'Köşeli parantez kapama: 1-3-5.', hucreler: [[1, 3, 5]] },
  { ad: 'dış parantez', sembol: '()', aciklama: 'Dış parantez açma ve kapama için 1-2-3-4-5-6 kullanılır.', hucreler: [[1, 2, 3, 4, 5, 6]] },
  { ad: 'mutlak değer açma', sembol: '|', aciklama: 'Metinde ilk dikey çizgi (|) Braillede mutlak açma: 1-2-3; ikinci | kapama: 4-5-6.', hucreler: [[1, 2, 3]] },
  { ad: 'mutlak değer kapama', sembol: '|', aciklama: 'Metinde ikinci dikey çizgi (|) mutlak kapama: 4-5-6 (aynı karakter, sırayla farklı Braille).', hucreler: [[4, 5, 6]] },
  { ad: 'kesir çizgisi', sembol: '/', aciklama: 'Kesir çizgisi: 3-4.', hucreler: ISLEM.kesirCizgisi },
  { ad: 'devirli ondalık işareti', sembol: '@', aciklama: 'Devreden kısmın öncesine 5. nokta yazılır.', hucreler: [[5]] },
  { ad: 'yüzde', sembol: '%', aciklama: 'Yüzde sembolü rakam işaretinden önce, boşluksuz yazılır. Noktaları: 1-3-4-5-6 (MEB Tablo 31).', hucreler: [[1, 3, 4, 5, 6]] },
  { ad: 'binde', sembol: '‰', aciklama: 'Binde sembolü rakam işaretinden önce, boşluksuz yazılır. Noktaları: 1-2 (MEB Tablo 31; “b” hücresi ile aynı desen, bağlamla ayrılır).', hucreler: [[1, 2]] },
  { ad: 'üs işareti', sembol: '^', aciklama: 'Üslü ifadelerde üssü belirtmek için 3-4-6 kullanılır.', hucreler: ISLEM.ust },
  { ad: 'karekök işareti', sembol: '√', aciklama: 'Karekök işareti kılavuzda S ile, 1-4-6 noktalarıyla yazılır.', hucreler: ISLEM.kok },
  { ad: 'kök ayırma işareti', sembol: 'R', aciklama: 'Kök derecesi harfli ifade ise ayırma işareti 1-2-4-5-6 kullanılır.', hucreler: [[1, 2, 4, 5, 6]] },
  { ad: 'faktöriyel', sembol: '!', aciklama: 'Faktöriyel işareti sayıdan sonra 1-2-3-4-6 noktalarıyla yazılır.', hucreler: ISLEM.faktoryel },
  { ad: 'derece işareti', sembol: '°', aciklama: 'Sıcaklık ve açı ölçüsünde derece işareti 3-5-6 ile yazılır.', hucreler: [[3, 5, 6]] }
];

export const MATEMATIK_OLCULER = [
  { ad: 'milimetre', sembol: 'mm', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve mm harfleriyle yazılır.', hucreler: olcu('mm') },
  { ad: 'santimetre', sembol: 'cm', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve cm harfleriyle yazılır.', hucreler: olcu('cm') },
  { ad: 'desimetre', sembol: 'dm', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve dm harfleriyle yazılır.', hucreler: olcu('dm') },
  { ad: 'metre', sembol: 'm', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve m harfiyle yazılır.', hucreler: olcu('m') },
  { ad: 'dekametre', sembol: 'dam', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve dam harfleriyle yazılır.', hucreler: olcu('dam') },
  { ad: 'hektometre', sembol: 'hm', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve hm harfleriyle yazılır.', hucreler: olcu('hm') },
  { ad: 'kilometre', sembol: 'km', aciklama: 'Uzunluk ölçüsü. Ölçü işareti ve km harfleriyle yazılır.', hucreler: olcu('km') },
  { ad: 'milimetrekare', sembol: 'mm²', aciklama: 'Alan ölçüsü. Birimin üstündeki 2 alttan yazılır.', hucreler: olcu('mm', ALT_RAKAM['2']) },
  { ad: 'santimetrekare', sembol: 'cm²', aciklama: 'Alan ölçüsü. Birimin üstündeki 2 alttan yazılır.', hucreler: olcu('cm', ALT_RAKAM['2']) },
  { ad: 'desimetrekare', sembol: 'dm²', aciklama: 'Alan ölçüsü. Birimin üstündeki 2 alttan yazılır.', hucreler: olcu('dm', ALT_RAKAM['2']) },
  { ad: 'metrekare', sembol: 'm²', aciklama: 'Alan ölçüsü. Ölçü işareti, m ve alttan 2 ile yazılır.', hucreler: olcu('m', ALT_RAKAM['2']) },
  { ad: 'dekametrekare', sembol: 'dam²', aciklama: 'Alan ölçüsü. Birimin üstündeki 2 alttan yazılır.', hucreler: olcu('dam', ALT_RAKAM['2']) },
  { ad: 'hektometrekare', sembol: 'hm²', aciklama: 'Alan ölçüsü. Birimin üstündeki 2 alttan yazılır.', hucreler: olcu('hm', ALT_RAKAM['2']) },
  { ad: 'kilometrekare', sembol: 'km²', aciklama: 'Alan ölçüsü. Birimin üstündeki 2 rakam işareti kullanılmadan alttan yazılır.', hucreler: olcu('km', ALT_RAKAM['2']) },
  { ad: 'ar', sembol: 'a', aciklama: 'Arazi ölçüsü.', hucreler: olcu('a') },
  { ad: 'dekar', sembol: 'daa', aciklama: 'Arazi ölçüsü.', hucreler: olcu('daa') },
  { ad: 'hektar', sembol: 'ha', aciklama: 'Arazi ölçüsü.', hucreler: olcu('ha') },
  { ad: 'milimetreküp', sembol: 'mm³', aciklama: 'Hacim ölçüsü. Birimin üstündeki 3 alttan yazılır.', hucreler: olcu('mm', ALT_RAKAM['3']) },
  { ad: 'santimetreküp', sembol: 'cm³', aciklama: 'Hacim ölçüsü. Birimin üstündeki 3 alttan yazılır.', hucreler: olcu('cm', ALT_RAKAM['3']) },
  { ad: 'desimetreküp', sembol: 'dm³', aciklama: 'Hacim ölçüsü. Birimin üstündeki 3 alttan yazılır.', hucreler: olcu('dm', ALT_RAKAM['3']) },
  { ad: 'metreküp', sembol: 'm³', aciklama: 'Hacim ölçüsü. Ölçü işareti, m ve alttan 3 ile yazılır.', hucreler: olcu('m', ALT_RAKAM['3']) },
  { ad: 'dekametreküp', sembol: 'dam³', aciklama: 'Hacim ölçüsü. Birimin üstündeki 3 alttan yazılır.', hucreler: olcu('dam', ALT_RAKAM['3']) },
  { ad: 'hektometreküp', sembol: 'hm³', aciklama: 'Hacim ölçüsü. Birimin üstündeki 3 alttan yazılır.', hucreler: olcu('hm', ALT_RAKAM['3']) },
  { ad: 'kilometreküp', sembol: 'km³', aciklama: 'Hacim ölçüsü. Birimin üstündeki 3 rakam işareti kullanılmadan alttan yazılır.', hucreler: olcu('km', ALT_RAKAM['3']) },
  { ad: 'mililitre', sembol: 'mL', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('ml') },
  { ad: 'santilitre', sembol: 'cL', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('cl') },
  { ad: 'desilitre', sembol: 'dL', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('dl') },
  { ad: 'litre', sembol: 'L', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('l') },
  { ad: 'dekalitre', sembol: 'daL', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('dal') },
  { ad: 'hektolitre', sembol: 'hL', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('hl') },
  { ad: 'kilolitre', sembol: 'kL', aciklama: 'Sıvı ölçüsü.', hucreler: olcu('kl') },
  { ad: 'miligram', sembol: 'mg', aciklama: 'Kütle ölçüsü.', hucreler: olcu('mg') },
  { ad: 'santigram', sembol: 'cg', aciklama: 'Kütle ölçüsü.', hucreler: olcu('cg') },
  { ad: 'desigram', sembol: 'dg', aciklama: 'Kütle ölçüsü.', hucreler: olcu('dg') },
  { ad: 'gram', sembol: 'g', aciklama: 'Kütle ölçüsü.', hucreler: olcu('g') },
  { ad: 'dekagram', sembol: 'dag', aciklama: 'Kütle ölçüsü.', hucreler: olcu('dag') },
  { ad: 'hektogram', sembol: 'hg', aciklama: 'Kütle ölçüsü.', hucreler: olcu('hg') },
  { ad: 'kilogram', sembol: 'kg', aciklama: 'Kütle ölçüsü.', hucreler: olcu('kg') },
  { ad: 'ton', sembol: 't', aciklama: 'Kütle ölçüsü.', hucreler: olcu('t') },
  { ad: 'saniye', sembol: 'sn', aciklama: 'Zaman ölçüsü.', hucreler: olcu('sn') },
  { ad: 'dakika', sembol: 'dk', aciklama: 'Zaman ölçüsü.', hucreler: olcu('dk') },
  { ad: 'saat', sembol: 'sa', aciklama: 'Zaman ölçüsü.', hucreler: olcu('sa') },
  { ad: 'Celsius derece', sembol: '°C', aciklama: 'Sıcaklık ölçüsünde derece işareti ve büyük C kullanılır.', hucreler: [[3, 5, 6], BUYUK_HARF_ISARETI, HARF.c] },
  { ad: 'Fahrenheit derece', sembol: '°F', aciklama: 'Sıcaklık ölçüsünde derece işareti ve büyük F kullanılır.', hucreler: [[3, 5, 6], BUYUK_HARF_ISARETI, HARF.f] },
  { ad: 'kuruş', sembol: 'Kr', aciklama: 'Para birimi, ölçü işaretiyle boşluk bırakmadan yazılır.', hucreler: olcu('kr') },
  { ad: 'Türk lirası', sembol: 'TL', aciklama: 'Para birimi, ölçü işaretiyle boşluk bırakmadan yazılır.', hucreler: olcu('tl') },
  { ad: 'dolar', sembol: '$', aciklama: 'Para birimi, ölçü işareti ve d harfiyle yazılır.', hucreler: olcu('d') },
  { ad: 'euro / avro', sembol: '€', aciklama: 'Para birimi, ölçü işareti ve e harfiyle yazılır.', hucreler: olcu('e') },
  { ad: 'sterlin', sembol: '£', aciklama: 'Para birimi, ölçü işareti ve s harfiyle yazılır.', hucreler: olcu('s') }
];

export const GEOMETRI_SEMBOLLERI = [
  { ad: 'geometri işareti', sembol: '|', aciklama: 'Temel geometrik kavramlardan önce geometri işareti 4-5-6 kullanılır.', hucreler: [GEOMETRI_ISARETI] },
  { ad: 'doğru AB', sembol: 'AB', aciklama: 'Doğru, geometri işareti ve büyük harfli adla yazılır.', hucreler: [GEOMETRI_ISARETI, ...buyukHarf('ab')] },
  { ad: 'doğru parçası AB', sembol: '[AB]', aciklama: 'Doğru parçası, geometri işareti, doğru parçası işareti ve harflerle yazılır.', hucreler: [GEOMETRI_ISARETI, [1, 2, 3, 4, 6], ...buyukHarf('ab'), [1, 3, 4, 5, 6]] },
  { ad: 'ışın AB', sembol: '[AB', aciklama: 'Işın gösteriminde geometri işareti ve doğru parçası açma işareti kullanılır.', hucreler: [GEOMETRI_ISARETI, [1, 2, 3, 4, 6], ...buyukHarf('ab')] },
  { ad: 'doğru parçasının uzunluğu', sembol: '|AB|', aciklama: 'Uzunluk gösteriminde mutlak değer açma, büyük harfli ad ve geometri kapama kullanılır.', hucreler: [[1, 2, 3], ...buyukHarf('ab'), GEOMETRI_ISARETI] },
  { ad: 'diklik', sembol: 'AB ⟂ CD', aciklama: 'Diklik gösterimi geometri işaretiyle başlar.', hucreler: [GEOMETRI_ISARETI, ...buyukHarf('ab'), [2, 3, 6], ...buyukHarf('cd')] },
  { ad: 'paralellik', sembol: 'AB // CD', aciklama: 'Paralellik gösterimi geometri işaretiyle başlar.', hucreler: [GEOMETRI_ISARETI, ...buyukHarf('ab'), [3, 4], [3, 4], ...buyukHarf('cd')] },
  { ad: 'açı ABC', sembol: '∠ABC', aciklama: 'Açı isimlendirilirken geometri işaretiyle birlikte açı işareti kullanılır.', hucreler: [GEOMETRI_ISARETI, [2, 4, 6], ...buyukHarf('abc')] },
  { ad: 'açısal bölge ABC', sembol: '(∠ABC)', aciklama: 'Açısal bölge, parantez içinde açı gösterimiyle yazılır.', hucreler: [[1, 2, 6], GEOMETRI_ISARETI, [2, 4, 6], ...buyukHarf('abc'), [3, 4, 5]] },
  { ad: 'üçgen ABC', sembol: '△ABC', aciklama: 'Üçgen, geometri işareti ve üçgen sembolüyle yazılır.', hucreler: [GEOMETRI_ISARETI, [1, 2, 5, 6], [1, 2, 4, 5], ...buyukHarf('abc')] },
  { ad: 'üçgen çevresi', sembol: 'Ç(ABC)', aciklama: 'Üçgen çevresi kılavuzdaki |CUg gösterimiyle başlar.', hucreler: [GEOMETRI_ISARETI, [1, 6], [1, 2, 5, 6], [1, 2, 4, 5], ...buyukHarf('abc')] },
  { ad: 'üçgen alanı', sembol: 'A(ABC)', aciklama: 'Üçgen alanı kılavuzdaki |aUg gösterimiyle başlar.', hucreler: [GEOMETRI_ISARETI, HARF.a, [1, 2, 5, 6], [1, 2, 4, 5], ...buyukHarf('abc')] },
  { ad: 'eşlik', sembol: '≅', aciklama: 'Eşlik gösterimi geometri şekilleri arasında kullanılır.', hucreler: [[4, 6], [2, 3, 5, 6]] },
  { ad: 'benzerlik', sembol: '~', aciklama: 'Benzerlik gösterimi için 3 ve 3-6 hücreleri kullanılır.', hucreler: [[3], [3, 6]] },
  { ad: 'yay işareti', sembol: '⌒', aciklama: 'Yay işareti geometri işareti ve D hücresiyle yazılır.', hucreler: [GEOMETRI_ISARETI, [1, 2, 4, 6]] },
  { ad: 'yay uzunluğu', sembol: 'l(AB)', aciklama: 'Yay uzunluğu mutlak/uzunluk gösterimiyle kullanılır.', hucreler: [[1, 2, 3], [1, 2, 4, 6], ...buyukHarf('ab'), GEOMETRI_ISARETI] },
  { ad: 'çap', sembol: 'R', aciklama: 'Çap büyük R ile yazılır.', hucreler: buyukHarf('r') },
  { ad: 'yarıçap', sembol: 'r', aciklama: 'Yarıçap küçük r ile yazılır.', hucreler: kucukHarf('r') },
  { ad: 'yükseklik', sembol: 'h', aciklama: 'Yükseklik küçük h ile yazılır.', hucreler: kucukHarf('h') },
  { ad: 'eğim', sembol: 'm', aciklama: 'Eğim, metre ölçü işaretiyle karışmaması için geometri işaretiyle yazılır.', hucreler: [GEOMETRI_ISARETI, HARF.m] },
  { ad: 'hacim', sembol: 'V', aciklama: 'Hacim büyük V ile yazılır.', hucreler: buyukHarf('v') }
];

export const MATEMATIK_IFADELER = [
  { yazi: '5', okunus: 'beş', aciklama: 'Rakam işareti sayıdan önce yazılır.', hucreler: sayi('5') },
  { yazi: '26', okunus: 'yirmi altı', aciklama: 'Çok basamaklı sayıda rakam işareti yalnız başta yazılır.', hucreler: sayi('26') },
  { yazi: '7.536.408', okunus: 'yedi milyon beş yüz otuz altı bin dört yüz sekiz', aciklama: 'Bölük işareti üçer basamak ayırmak için kullanılır.', hucreler: sayi('7.536.408') },
  { yazi: '29.10.1923', okunus: 'yirmi dokuz on bin dokuz yüz yirmi üç', aciklama: 'Zaman/tarih ifadesinde araya bağ işareti yazılır.', hucreler: sayi('29.10.1923') },
  { yazi: '2,3', okunus: 'iki tam onda üç', aciklama: 'Ondalık virgül 2. noktayla yazılır; virgülden sonra ikinci bir rakam işareti kullanılmaz.', hucreler: sayi('2,3') },
  { yazi: '15 + 8 = 23', okunus: 'on beş artı sekiz eşittir yirmi üç', aciklama: 'İşlem işaretleri kılavuza göre harf işaretiyle başlayan iki hücreli sembollerdir.', hucreler: BOSLUKSUZ(sayi('15'), ISLEM.arti, sayi('8'), ISLEM.esit, sayi('23')) },
  { yazi: '27 - 12 = 15', okunus: 'yirmi yedi eksi on iki eşittir on beş', aciklama: 'Eksi işareti iki hücredir.', hucreler: BOSLUKSUZ(sayi('27'), ISLEM.eksi, sayi('12'), ISLEM.esit, sayi('15')) },
  { yazi: '13 × 4 = 52', okunus: 'on üç çarpı dört eşittir elli iki', aciklama: 'Çarpma işareti Unicode × ile; iki hücredir.', hucreler: BOSLUKSUZ(sayi('13'), ISLEM.carpma, sayi('4'), ISLEM.esit, sayi('52')) },
  { yazi: '130 ÷ 5 = 26', okunus: 'yüz otuz bölü beş eşittir yirmi altı', aciklama: 'Bölme işareti iki hücredir.', hucreler: BOSLUKSUZ(sayi('130'), ISLEM.bolme, sayi('5'), ISLEM.esit, sayi('26')) },
  { yazi: '±5', okunus: 'artı eksi beş', aciklama: 'Artı eksi işareti sayıdan önce yazılır.', hucreler: BOSLUKSUZ(ISLEM.artiEksi, sayi('5')) },
  { yazi: '1 ≤ |a| < 10', okunus: 'bir küçük eşit mutlak a küçüktür on', aciklama: 'Karşılaştırma ve mutlak değer işaretleri kılavuzdaki hücrelerle yazılır.', hucreler: BOSLUKSUZ(sayi('1'), ISLEM.kucukEsit, [[1, 2, 3]], kucukHarf('a'), [[4, 5, 6]], ISLEM.kucuktur, sayi('10')) },
  { yazi: '4 ≠ 5', okunus: 'dört eşit değildir beş', aciklama: 'Eşit değildir işareti 5 ve 2-3-5-6 hücrelerinden oluşur.', hucreler: BOSLUKSUZ(sayi('4'), ISLEM.esitDegil, sayi('5')) },
  { yazi: '(-7)', okunus: 'parantez içinde eksi yedi', aciklama: 'Gruplandırma parantezi sayı ve işaretlere bitişik yazılır.', hucreler: BOSLUKSUZ([[1, 2, 6]], ISLEM.eksi, sayi('7'), [[3, 4, 5]]) },
  { yazi: '|-7| = 7', okunus: 'mutlak eksi yedi eşittir yedi', aciklama: 'Mutlak değer açma 1-2-3, kapama 4-5-6 noktalarıdır.', hucreler: BOSLUKSUZ([[1, 2, 3]], ISLEM.eksi, sayi('7'), [[4, 5, 6]], ISLEM.esit, sayi('7')) },
  { yazi: '3/5', okunus: 'üç bölü beş', aciklama: 'Pay ve paydası sayı olan kesirde payda sıra sayıları gibi alttan yazılır.', hucreler: BOSLUKSUZ(sayi('3'), altSayi('5')) },
  { yazi: '2/k', okunus: 'iki bölü k', aciklama: 'Payı sayı paydası harf olan kesirde kesir çizgisi ve harf işareti kullanılır.', hucreler: BOSLUKSUZ(sayi('2'), ISLEM.kesirCizgisi, kucukHarf('k')) },
  { yazi: '-54,76', okunus: 'eksi elli dört tam yüzde yetmiş altı', aciklama: 'Negatif ondalık gösterimde önce eksi, sonra rakam işareti yazılır.', hucreler: BOSLUKSUZ(ISLEM.eksi, sayi('54,76')) },
  { yazi: '%45', okunus: 'yüzde kırk beş', aciklama: 'Yüzde işareti rakam işaretinden önce yazılır.', hucreler: BOSLUKSUZ([[1, 3, 4, 5, 6]], sayi('45')) },
  { yazi: '‰5', okunus: 'binde beş', aciklama: 'Binde işareti rakam işaretinden önce yazılır.', hucreler: BOSLUKSUZ([[1, 2]], sayi('5')) },
  { yazi: '3^5', okunus: 'üç üssü beş', aciklama: 'Üs işaretinden sonra doğal sayı alttan yazılır.', hucreler: BOSLUKSUZ(sayi('3'), ISLEM.ust, altSayi('5')) },
  { yazi: 'x^2', okunus: 'x kare', aciklama: 'Harf tabanlı üslü ifadede harf işareti ve üs işareti kullanılır.', hucreler: BOSLUKSUZ(kucukHarf('x'), ISLEM.ust, altSayi('2')) },
  { yazi: '√25 = 5', okunus: 'karekök yirmi beş eşittir beş', aciklama: 'Karekök işareti 1-4-6 noktalarıdır.', hucreler: BOSLUKSUZ(ISLEM.kok, sayi('25'), ISLEM.esit, sayi('5')) },
  { yazi: '3√(6+x)', okunus: 'üç kök içinde altı artı x', aciklama: 'Kök içinde birden fazla terim varsa parantez kullanılır.', hucreler: BOSLUKSUZ(sayi('3'), ISLEM.kok, [[1, 2, 6]], sayi('6'), ISLEM.arti, kucukHarf('x'), [[3, 4, 5]]) },
  { yazi: 'x + 2', okunus: 'x artı iki', aciklama: 'Tek küçük harfin önünde harf işareti kullanılır.', hucreler: BOSLUKSUZ(kucukHarf('x'), ISLEM.arti, sayi('2')) },
  { yazi: '2x + 3y', okunus: 'iki x artı üç y', aciklama: 'Katsayı ve bilinmeyen arasında çarpma işareti kullanılmaz.', hucreler: BOSLUKSUZ(sayi('2'), kucukHarf('x'), ISLEM.arti, sayi('3'), kucukHarf('y')) },
  { yazi: '5!', okunus: 'beş faktöriyel', aciklama: 'Faktöriyel işareti sayıdan sonra yazılır.', hucreler: BOSLUKSUZ(sayi('5'), ISLEM.faktoryel) },
  { yazi: '3m', okunus: 'üç metre', aciklama: 'Ölçü birimi sayıdan sonra boşluk bırakmadan ölçü işaretiyle yazılır.', hucreler: BOSLUKSUZ(sayi('3'), olcu('m')) },
  { yazi: '125 m²', okunus: 'yüz yirmi beş metrekare', aciklama: 'Alan ölçüsünde kare sayısı alttan yazılır.', hucreler: BOSLUKSUZ(sayi('125'), olcu('m', ALT_RAKAM['2'])) },
  { yazi: '20 m³', okunus: 'yirmi metreküp', aciklama: 'Hacim ölçüsünde küp sayısı alttan yazılır.', hucreler: BOSLUKSUZ(sayi('20'), olcu('m', ALT_RAKAM['3'])) },
  { yazi: '34 °C', okunus: 'otuz dört santigrat derece', aciklama: 'Sıcaklıkta derece işareti ve büyük C kullanılır.', hucreler: BOSLUKSUZ(sayi('34'), [[3, 5, 6], BUYUK_HARF_ISARETI, HARF.c]) },
  { yazi: 'AB doğrusu', okunus: 'A B doğrusu', aciklama: 'Geometrik kavramlarda önce geometri işareti yazılır.', hucreler: [GEOMETRI_ISARETI, ...buyukHarf('ab')] },
  { yazi: '∠ABC', okunus: 'A B C açısı', aciklama: 'Açı, geometri işareti ve açı işaretiyle yazılır.', hucreler: [GEOMETRI_ISARETI, [2, 4, 6], ...buyukHarf('abc')] },
  { yazi: '△ABC', okunus: 'A B C üçgeni', aciklama: 'Üçgen, geometri işareti ve üçgen sembolüyle yazılır.', hucreler: [GEOMETRI_ISARETI, [1, 2, 5, 6], [1, 2, 4, 5], ...buyukHarf('abc')] }
];