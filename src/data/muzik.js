// =============================================================================
// Müzik Braille — UEB Music Notation kapsamlı modül
// -----------------------------------------------------------------------------
// Kaynak: NextSense Institute / North Rocks Press (2026)
//   “Braille Music Notation Introductory Training Program” (Revision 2)
//   ISBN 978-0-949050-33-5 — Author: Leanne Newham
//   https://uebonline.org/
//
// Bu dosyada müzik braillesinin temel kuralları ve işaretleri 11 derslik bir
// yapıyla organize edilmiştir. MUZIK_BOLUMLER dizisi menüde gezilebilir
// bölümleri sağlar; eski tek-sayfa export’ları (NOTALAR, SURE_GOSTERGELERI,
// MUZIK_SEMBOLLERI, OKTAV_ISARETLERI, MUZIK_DIZILERI) geriye dönük uyumluluk
// için korunmuştur.
// =============================================================================

/**
 * @typedef {Object} MuzikOge
 * @property {string} ad
 * @property {number[][]} hucreler
 * @property {string} [sembol]
 * @property {string} [aciklama]
 * @property {string[]} [kurallar]
 * @property {string} [okumaOzeti]
 */

function dc(...dotGroups) {
  return dotGroups.map((g) => (g === '' ? [] : g.split('-').map(Number)));
}

/**
 * @param {string} ad
 * @param {string[]} grup
 * @param {string} [aciklama]
 * @param {string[]} [kurallar]
 * @param {string} [okumaOzeti]
 * @param {string} [sembol]
 * @returns {MuzikOge}
 */
function R(ad, grup, aciklama, kurallar, okumaOzeti, sembol) {
  const o = { ad, hucreler: dc(...grup) };
  if (sembol) o.sembol = sembol;
  if (aciklama) o.aciklama = aciklama;
  if (kurallar && kurallar.length > 0) o.kurallar = kurallar;
  if (okumaOzeti) o.okumaOzeti = okumaOzeti;
  return o;
}

/* ────────────────────────  Genel kural metinleri  ───────────────────────── */

const KURAL_NOTA = [
  'Müzik braillesinde her nota hem ses adını (1-2-4-5 noktaları) hem süresini (3 ve/veya 6) tek hücrede gösterir.',
  'Temel hücre (3 ve 6 noktaları yokken) sekizlik (quaver) ya da 128’lik notayı temsil eder.',
  'Süre, bağlamdaki ölçüye göre belirlenir.',
];

const KURAL_SURE = [
  'Sekizlik: temel hücre, 3 ve 6 noktası eklenmez.',
  'Dörtlük: temel hücreye 6 noktası eklenir.',
  'Yarım: temel hücreye 3 noktası eklenir.',
  'Tam: temel hücreye 3 ve 6 noktaları eklenir.',
];

const KURAL_NOKTALI_NOTA = [
  'Noktalı nota: değeri 1,5 kat olur (1 + ½).',
  'Braille’de notanın hemen ardına 3 noktası konur (es için de aynı kural).',
];

const KURAL_ES = [
  'Es notası gibi süre değerine sahiptir; aynı sürenin sessiz karşılığıdır.',
  'Noktalı es için hücreden sonra 3 noktası konur.',
];

const KURAL_OKTAV = [
  '4. oktav orta do’dan (Middle C) başlar; piyanonun en alt do’su 1. oktav, en üst 7. oktavdır.',
  'Eserin ilk notası ve her yeni satırın ilk notası mutlaka oktav işareti alır.',
  'İki nota arası mesafe 2. veya 3. ise oktav işaretine gerek yoktur.',
  'Mesafe 4. veya 5. ise yalnız oktav değiştiğinde işaret konur.',
  'Mesafe 6. veya daha geniş ise her durumda oktav işareti gerekir.',
  'Oktav işareti ile notası arasına başka işaret konulmaz.',
];

const KURAL_ZAMAN_IMZASI = [
  'Zaman imzası kendi satırına ortalanır, eserin başında bir kez yazılır.',
  'Önce rakam göstergesi (⠼) konur; üst rakam üst kısımda, alt rakam alt kısımda yazılır.',
  'Anahtar değişimi olduğunda yeni zaman imzası bar arasında, iki tarafı boşluklu yazılır.',
];

const KURAL_DONANIM = [
  'Donanım eserin başında, zaman imzasından önce, kendi satırına ortalanır.',
  '1–3 diyez/bemol için yalnız işaretler tekrar edilir.',
  '4 veya daha çok diyez/bemol için önce rakam göstergesi + rakam + işaret yazılır.',
  'Eser içinde değişen donanım, bölüm çift çubuğundan (<K\') sonra yazılır.',
];

const KURAL_BARLINE = [
  'Ölçü çizgisi braille’de boş bir hücredir.',
  'Eserin sonundaki ikili çubuk (final double barline): 1-2-6 + 1-3.',
  'Bölüm sonu (sectional double barline): 1-2-6 + 1-3 + 3.',
];

const KURAL_BAG = [
  'Bağ (tie) aynı perdedeki iki notayı tek nota gibi okutur: ⠈⠉ (4 + 1-4).',
  'Slur (legato) farklı perdeli notaları bağlar: ⠉ (1-4).',
  'Dört ve daha çok nota bağlandığında slur ilk notadan sonra ikiye katlanır ya da köşeli slur (⠰⠃ … ⠨⠆) kullanılır.',
];

const KURAL_WORD_SIGN = [
  'Müzik içine giren her sözcük/kısaltma önünde söz işareti (⠜ = 3-4-5) olur.',
  'Sözcükler kontraksiyonsuz (Grade 1) yazılır; büyük harf göstergesi kullanılmaz.',
  'Birden çok kelime varsa söz işareti kelime kümesinin önüne ve sonuna konur, iki tarafı boşluklu olur.',
  'Sonraki notada oktav işareti zorunludur.',
];

const KURAL_NUANS_ONCE = [
  'Nota öncesi nüanslar (staccato, accent, tenuto vb.) notadan hemen önce yazılır.',
  'Birden fazla nüans aynı notada ise sıra: arpeggio, staccato/staccatissimo, accent, tenuto.',
  'Bu işaretlerden sonra notaya oktav işareti gerekmez.',
  'Dört veya daha çok ardışık aynı nüansta ikileme (doubling) kullanılabilir.',
];

const KURAL_NUANS_SONRA = [
  'Nota sonrası işaretler (fermata, nefes, break) notanın hemen ardına yazılır.',
  'Aynı notada birden çok sonraki işaret varsa sıra: nokta, fermata, slur, tie, hairpin terminator, nefes, geriye repeat.',
];

const KURAL_TRILL = [
  'Trill (⠖ = 2-3-5) notadan hemen önce, varsa aksidental ve oktav işaretinden de önce yazılır.',
  'Aksidentalle birlikte trill: önce aksidental, sonra trill.',
  'Birden çok notayı kaplayan trill için iki nokta 3 ile devam ettirilir, sonunda ⠜⠄ (3-4-5 + 3) ile sonlandırılır.',
];

const KURAL_TURN = [
  'Turn işareti her zaman notadan önce yazılır.',
  'Print’te tam notanın üstünde/altında ise turn’den önce 6 noktası eklenir.',
  'Aksidental yukarıda ise önce yazılır; aşağıda ise 6 noktası ile birlikte konur.',
];

const KURAL_TRIPLET = [
  'Üçleme (triplet): tek hücreli ⠆ (2-3) ilk notadan önce yazılır.',
  'Dört veya daha fazla ardışık aynı süredeki üçleme için tek hücre ikilenebilir; son üçlemeden önce tekrar yazılarak biter.',
  'Karışık düzensiz gruplar arasında üçleme yer alıyorsa 3 hücreli ⠸⠒⠄ (4-5-6 + 2-5 + 3) tercih edilir.',
];

const KURAL_DUZENSIZ_GRUP = [
  '3 (veya 4) hücreli düzensiz grup işareti: ⠸ + sayı (alt kısımda) + ⠄.',
  'Sayı 10’dan büyükse 4 hücreli (iki rakam) yazılır.',
  'İşaretten sonra ilk notaya oktav işareti konur.',
  'Print’te sayı yoksa ve düzensiz grup işareti gerekiyorsa önüne 5 noktası eklenir.',
];

const KURAL_BASKI_TEKRAR = [
  'Başla repeat işareti ⠣⠶ (1-2-6 + 2-3-5-6); bitir repeat işareti ⠣⠆ (1-2-6 + 2-3).',
  'Repeat işareti ilgili ölçünün parçasıdır; ölçüye bitişik, fakat sonrasında boşluk gerekir.',
  'Repeat sonrası ilk notada oktav işareti zorunludur.',
  'Bar içinde repeat olunca müzik kısa çizgisi (5 noktası) kullanılarak kalan kısım ayrılır.',
];

const KURAL_VOLTA = [
  'Birinci/ikinci ev (volta) sonu: alt hücrede rakam (⠼⠁ = #1, ⠼⠃ = #2).',
  'Volta numarası ile ölçüsü arasında boşluk olmaz; ardından gelen nota oktav işareti alır.',
  'Volta sonrasındaki hücrede 1-2-3 noktaları varsa volta numarasından sonra 3 noktası ayırıcı konur.',
  'Birden çok numara için her sayıya rakam göstergesi gerekir; hyphen sonrası rakam göstergesi yenilenmez.',
];

const KURAL_BRAILLE_REPEAT = [
  'Braille repeat işareti ⠶ (2-3-5-6) hemen önceki ölçü ya da ölçünün bir kısmını tekrarlar.',
  'Birden çok kez tekrar için işaretin sonuna boşluksuz sayı eklenir; ilk notada oktav işareti gerekir.',
  'Nüans ve süslemeler farklıysa repeat işareti kullanılamaz.',
  'Tie son notada ise repeat işaretinden SONRA yazılır.',
];

const KURAL_NUMARA_TEKRAR = [
  'Geri sayım tekrarı: iki rakam aralarında boşluk olmadan yazılır.',
  'İlk rakam kaç ölçü geri sayılacağını, ikinci rakam kaç ölçü çalınacağını gösterir (örn. ⠼⠓⠼⠙ = 8 geri, 4 çal).',
  'Geri sayım ile çalınacak miktar eşitse tek rakam yeterlidir.',
  'Genellikle 8 ölçüden uzun pasajlar için kullanılmaz; aynı braille sayfasında olmalıdır.',
];

const KURAL_OLCU_NO_TEKRAR = [
  'Ölçü numarası tekrarı: rakam göstergesi + ilgili ölçü numarası (alt hücrede).',
  'Aralık için araya literal hyphen (3-6) konur: ⠼⠑⠤⠓ = 5-8 ölçülerinin tekrarı.',
  'Uzun veya sık tekrarlanan pasajlar için uygundur; uzak ölçülere atıf önerilmez.',
];

/* ─────────────────────────  1) NOTALAR (Pitch)  ────────────────────────── */
// UEB Music: temel hücre = sekizlik (quaver). Süre eki için 3 ve/veya 6.
export const MUZIK_NOTALAR = [
  R('do (C)', ['1-4-5'], '(do) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'C'),
  R('re (D)', ['1-5'], '(re) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'D'),
  R('mi (E)', ['1-2-4'], '(mi) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'E'),
  R('fa (F)', ['1-2-4-5'], '(fa) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'F'),
  R('sol (G)', ['1-2-5'], '(sol) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'G'),
  R('la (A)', ['2-4'], '(la) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'A'),
  R('si (B)', ['2-4-5'], '(si) · temel hücre = sekizlik', KURAL_NOTA, undefined, 'B'),
];

/* ─────────  2) NOTA SÜRELERİ (Duration) — Do üzerinden örnek  ──────────── */
export const MUZIK_SURELER = [
  R('sekizlik (quaver) · Do', ['1-4-5'], '(temel hücre; 3 ve 6 noktası eklenmez)', KURAL_SURE, undefined, '♪'),
  R('dörtlük (crotchet) · Do', ['1-4-5-6'], '(temel hücreye 6 eklenir)', KURAL_SURE, undefined, '♩'),
  R('yarım (minim) · Do', ['1-3-4-5'], '(temel hücreye 3 eklenir)', KURAL_SURE, undefined, '𝅗𝅥'),
  R('tam (semibreve) · Do', ['1-3-4-5-6'], '(temel hücreye 3 + 6 eklenir)', KURAL_SURE, undefined, '𝅝'),
  R('noktalı dörtlük · Do', ['1-4-5-6', '3'], '(dörtlük + 3 noktası uzatma)', KURAL_NOKTALI_NOTA, undefined, '♩.'),
];

/* ───────────────────  3) ESLAR (Rests) — UEB Music  ────────────────────── */
export const MUZIK_ESLAR = [
  R('tam es / 16’lık es', ['1-3-4'], '(tam ölçü sessizlik veya 1/16 es)', KURAL_ES, undefined, '𝄻'),
  R('yarım es / 32’lik es', ['1-3-6'], '(yarım nota sessizlik veya 1/32 es)', KURAL_ES, undefined, '𝄼'),
  R('dörtlük es / 64’lük es', ['1-2-3-6'], '(dörtlük nota sessizlik veya 1/64 es)', KURAL_ES, undefined, '𝄽'),
  R('sekizlik es / 128’lik es', ['1-3-4-6'], '(sekizlik nota sessizlik veya 1/128 es)', KURAL_ES, undefined, '𝄾'),
  R('noktalı dörtlük es', ['1-2-3-6', '3'], '(dörtlük es + 3 noktası uzatma)', KURAL_NOKTALI_NOTA),
];

/* ─────────────────────  4) OKTAV İŞARETLERİ  ───────────────────────────── */
export const MUZIK_OKTAVLAR = [
  R('1. oktav (en pes)', ['4'], '(piyanonun en alt do’sundan başlar) · 4 noktası', KURAL_OKTAV, undefined, '⠈'),
  R('2. oktav', ['4-5'], '(1. oktavın bir üstü) · 4-5', KURAL_OKTAV, undefined, '⠨'),
  R('3. oktav', ['4-5-6'], '(orta do’nun bir altı) · 4-5-6', KURAL_OKTAV, undefined, '⠸'),
  R('4. oktav (orta do)', ['5'], '(Middle C oktavı) · 5 noktası', KURAL_OKTAV, undefined, '⠐'),
  R('5. oktav', ['4-6'], '(orta do’nun bir üstü) · 4-6', KURAL_OKTAV, undefined, '⠠'),
  R('6. oktav', ['5-6'], '(5. oktavın bir üstü) · 5-6', KURAL_OKTAV, undefined, '⠰'),
  R('7. oktav (en tiz)', ['6'], '(piyanonun en üst oktavı) · 6 noktası', KURAL_OKTAV, undefined, '⠘'),
];

/* ─────────────────  5) ZAMAN İMZALARI (Time signatures)  ──────────────── */
export const MUZIK_ZAMAN_IMZASI = [
  R('4/4', ['3-4-5-6', '1-4-5', '2-5-6'], '(dört dörtlük) · rakam göstergesi + d (üst 4) + alt 4', KURAL_ZAMAN_IMZASI, undefined, '4/4'),
  R('3/4', ['3-4-5-6', '1-4', '2-5-6'], '(üç dörtlük) · # + c (üst 3) + alt 4', KURAL_ZAMAN_IMZASI, undefined, '3/4'),
  R('2/4', ['3-4-5-6', '1-2', '2-5-6'], '(iki dörtlük) · # + b (üst 2) + alt 4', KURAL_ZAMAN_IMZASI, undefined, '2/4'),
  R('6/8', ['3-4-5-6', '1-2-4', '2-3-6'], '(altı sekizlik) · # + f (üst 6) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '6/8'),
  R('3/8', ['3-4-5-6', '1-4', '2-3-6'], '(üç sekizlik) · # + c (üst 3) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '3/8'),
  R('common time (4/4)', ['4-6', '1-4'], '(C işareti; 4/4 ile aynı süre)', KURAL_ZAMAN_IMZASI, undefined, '𝄴'),
  R('cut common (2/2)', ['4-5-6', '1-4'], '(çizgili C; 2/2 ile aynı süre)', KURAL_ZAMAN_IMZASI, undefined, '𝄵'),
];

/* ─────────────────  6) DONANIM ve AKSİDENTALLER  ───────────────────────── */
export const MUZIK_DONANIM = [
  R('diyez (sharp)', ['1-4-6'], '(notayı yarım ses kalınlaştırır)', KURAL_DONANIM, undefined, '♯'),
  R('bemol (flat)', ['1-2-6'], '(notayı yarım ses inceltir)', KURAL_DONANIM, undefined, '♭'),
  R('bekar (natural)', ['1-6'], '(diyez/bemol etkisini iptal eder)', KURAL_DONANIM, undefined, '♮'),
  R('çift diyez', ['1-4-6', '1-4-6'], '(notayı bir tam ses kalınlaştırır)', KURAL_DONANIM, undefined, '𝄪'),
  R('çift bemol', ['1-2-6', '1-2-6'], '(notayı bir tam ses inceltir)', KURAL_DONANIM, undefined, '𝄫'),
  R('2 diyezli donanım', ['1-4-6', '1-4-6'], '(re majör / si minör)', KURAL_DONANIM),
  R('3 bemollü donanım', ['1-2-6', '1-2-6', '1-2-6'], '(mi bemol majör / do minör)', KURAL_DONANIM),
  R('4 diyezli donanım', ['3-4-5-6', '1-4-5', '1-4-6'], '(mi majör / do diyez minör) · # + d (4) + diyez', KURAL_DONANIM),
  R('4 bemollü donanım', ['3-4-5-6', '1-4-5', '1-2-6'], '(la bemol majör / fa minör) · # + d (4) + bemol', KURAL_DONANIM),
];

/* ─────────────────  7) ÖLÇÜ ÇİZGİLERİ ve TEKRARLAR  ────────────────────── */
export const MUZIK_OLCU_CIZGILERI = [
  {
    ad: 'ölçü çizgisi (boş hücre)',
    aciklama: '(ölçüler arasında bir boşluk hücresi bırakılır)',
    hucreler: [],
    kurallar: KURAL_BARLINE,
    okumaOzeti: 'ölçüler arası boşluk hücresi',
  },
  R('final çift çubuk', ['1-2-6', '1-3'], '(eserin sonu) · ⠣⠅', KURAL_BARLINE, undefined, '𝄂'),
  R('bölüm sonu çift çubuk', ['1-2-6', '1-3', '3'], '(yeni bölüm başlayacaksa) · ⠣⠅⠄', KURAL_BARLINE, undefined, '𝄁'),
  R('başla repeat (start)', ['1-2-6', '2-3-5-6'], '(tekrarlanacak pasajın başı) · ⠣⠶', KURAL_BASKI_TEKRAR, undefined, '𝄆'),
  R('bitir repeat (end)', ['1-2-6', '2-3'], '(tekrarlanacak pasajın sonu) · ⠣⠆', KURAL_BASKI_TEKRAR, undefined, '𝄇'),
  R('1. ev (volta 1)', ['3-4-5-6', '2'], '(ilk seferki son) · #1', KURAL_VOLTA),
  R('2. ev (volta 2)', ['3-4-5-6', '2-3'], '(tekrar sonrası alternatif son) · #2', KURAL_VOLTA),
  R('müzik kısa çizgisi', ['5'], '(bar içinde repeat sonrası ayırıcı) · 5 noktası', KURAL_BARLINE),
];

/* ─────────────────  8) BAĞLAR ve SLUR İŞARETLERİ  ──────────────────────── */
export const MUZIK_BAGLAR = [
  R('bağ (tie)', ['4', '1-4'], '(aynı perdedeki notaları birleştirir) · ⠈⠉', KURAL_BAG, undefined, '⌣'),
  R('slur (legato)', ['1-4'], '(2–4 farklı notayı bağlar) · ⠉', KURAL_BAG, undefined, '⌒'),
  R('köşeli slur açılış', ['5-6', '1-2'], '(uzun cümle veya katmanlı slur) · ⠰⠃', KURAL_BAG),
  R('köşeli slur kapanış', ['4-5', '2-3'], '(köşeli slur sonu) · ⠨⠆', KURAL_BAG),
  R('çift slur (4+ nota)', ['1-4', '1-4'], '(ilk notadan sonra slur ikilenir; son nota öncesi tek slur ile biter)', KURAL_BAG),
];

/* ─────────────────  9) DİNAMİKLER (sözcük temelli)  ─────────────────────── */
// Tüm dinamikler önünde söz işareti ⠜ (3-4-5) bulunur.
export const MUZIK_DINAMIKLER = [
  R('söz işareti', ['3-4-5'], '(her sözcüğün/kısaltmanın önünde) · ⠜', KURAL_WORD_SIGN, undefined, '⠜'),
  R('pp (pianissimo)', ['3-4-5', '1-2-3-4', '1-2-3-4'], '(çok hafif)', KURAL_WORD_SIGN, undefined, 'pp'),
  R('p (piano)', ['3-4-5', '1-2-3-4'], '(hafif)', KURAL_WORD_SIGN, undefined, 'p'),
  R('mp (mezzo piano)', ['3-4-5', '1-3-4', '1-2-3-4'], '(orta hafif)', KURAL_WORD_SIGN, undefined, 'mp'),
  R('mf (mezzo forte)', ['3-4-5', '1-3-4', '1-2-4'], '(orta yüksek)', KURAL_WORD_SIGN, undefined, 'mf'),
  R('f (forte)', ['3-4-5', '1-2-4'], '(yüksek)', KURAL_WORD_SIGN, undefined, 'f'),
  R('ff (fortissimo)', ['3-4-5', '1-2-4', '1-2-4'], '(çok yüksek)', KURAL_WORD_SIGN, undefined, 'ff'),
  R('sf (sforzando)', ['3-4-5', '2-3-4', '1-2-4'], '(ani vurgu)', KURAL_WORD_SIGN, undefined, 'sf'),
  R('cresc. (crescendo)', ['3-4-5', '1-4', '1-2-3-5', '3'], '(giderek yükselt) · noktayla biter', KURAL_WORD_SIGN),
  R('decresc. (decrescendo)', ['3-4-5', '1-4-5', '1-5', '1-4', '1-2-3-5', '3'], '(giderek azalt) · noktayla biter', KURAL_WORD_SIGN),
  R('dim. (diminuendo)', ['3-4-5', '1-4-5', '2-4', '1-3-4', '3'], '(giderek azalt) · noktayla biter', KURAL_WORD_SIGN),
  R('rit. (ritardando)', ['3-4-5', '1-2-3-5', '2-4', '2-3-4-5', '3'], '(giderek yavaşlat)', KURAL_WORD_SIGN),
];

/* ─────────────────  10) HAIRPIN (kıl) DİNAMİKLERİ  ─────────────────────── */
export const MUZIK_HAIRPIN = [
  R('hairpin crescendo', ['3-4-5', '1-4'], '(genişleyen iki çizgi) · etkilenen ilk notadan önce', KURAL_WORD_SIGN),
  R('hairpin crescendo bitir', ['3-4-5', '2-5'], '(devamı yoksa son notadan sonra)', KURAL_WORD_SIGN),
  R('hairpin decrescendo', ['3-4-5', '1-4-5'], '(daralan iki çizgi) · etkilenen ilk notadan önce', KURAL_WORD_SIGN),
  R('hairpin decrescendo bitir', ['3-4-5', '2-5-6'], '(devamı yoksa son notadan sonra)', KURAL_WORD_SIGN),
];

/* ─────────────────  11) NOTA ÖNCESİ NÜANSLAR  ──────────────────────────── */
export const MUZIK_NUANS_ONCE = [
  R('staccato', ['2-3-6'], '(kısa, kesik) · notanın hemen önünde', KURAL_NUANS_ONCE, undefined, '·'),
  R('staccatissimo', ['6', '2-3-6'], '(çok kısa, sivri) · 6 + staccato', KURAL_NUANS_ONCE, undefined, '▽'),
  R('mezzo-staccato', ['5', '2-3-6'], '(yarı kısa) · 5 + staccato', KURAL_NUANS_ONCE, undefined, '‧'),
  R('tenuto (agogic accent)', ['4-5-6', '2-3-6'], '(tam süreyle uzat) · 4-5-6 + staccato hücresi', KURAL_NUANS_ONCE, undefined, '‒'),
  R('accent', ['4-6', '2-3-6'], '(vurgulu çal) · 4-6 + staccato hücresi', KURAL_NUANS_ONCE, undefined, '>'),
  R('expressive accent', ['4-5', '2-3-6'], '(ifadeli vurgu) · 4-5 + staccato hücresi', KURAL_NUANS_ONCE),
  R('reversed accent', ['4', '2-3-6'], '(ters vurgu) · 4 + staccato hücresi', KURAL_NUANS_ONCE),
  R('martellato', ['5-6', '2-3-6'], '(çekiç gibi sert vurgu) · 5-6 + staccato hücresi', KURAL_NUANS_ONCE),
  R('swell (<>)', ['1-6', '3'], '(şişen-sönen vurgu) · 1-6 + 3', KURAL_NUANS_ONCE),
];

/* ─────────────────  12) NOTA SONRASI NÜANSLAR  ─────────────────────────── */
export const MUZIK_NUANS_SONRA = [
  R('fermata (durak)', ['1-2-6', '1-2-3'], '(notayı uzat) · notadan sonra · ⠣⠇', KURAL_NUANS_SONRA, undefined, '𝄐'),
  R('notalar arası fermata', ['5', '1-2-6', '1-2-3'], '(iki nota arasında durak)', KURAL_NUANS_SONRA),
  R('ölçü çizgisi üstü fermata', ['4-5-6', '1-2-6', '1-2-3'], '(ölçü çizgisinde durak)', KURAL_NUANS_SONRA),
  R('kare fermata', ['5-6', '1-2-6', '1-2-3'], '(kare şekilli uzatma)', KURAL_NUANS_SONRA),
  R('üçgen fermata', ['4-5', '1-2-6', '1-2-3'], '(çadır şekilli uzatma)', KURAL_NUANS_SONRA),
  R('nefes işareti', ['3-4-5', '2'], '(kısa nefes molası) · ⠜⠂', KURAL_NUANS_SONRA, undefined, ','),
  R('caesura (break / //)', ['6', '3-4'], '(genel mola, kesinti) · ⠠⠌', KURAL_NUANS_SONRA, undefined, '//'),
];

/* ─────────────────────  13) SÜSLEMELER (Ornaments)  ────────────────────── */
export const MUZIK_SUSLEMELER = [
  R('kısa appoggiatura', ['2-6'], '(saplama yan nota; küçük çapraz çizgili)', KURAL_NUANS_ONCE),
  R('uzun appoggiatura', ['5', '2-6'], '(uzun yan nota; çapraz çizgisiz)', KURAL_NUANS_ONCE),
  R('trill', ['2-3-5'], '(iki nota arası hızlı titreşim)', KURAL_TRILL, undefined, 'tr'),
  R('bemollü trill', ['1-2-6', '2-3-5'], '(bemol etkili trill)', KURAL_TRILL),
  R('diyezli trill', ['1-4-6', '2-3-5'], '(diyez etkili trill)', KURAL_TRILL),
  R('turn (notalar arası)', ['2-5-6'], '(üst-asıl-alt-asıl dönüşü)', KURAL_TURN, undefined, '∽'),
  R('turn (nota üstünde)', ['6', '2-5-6'], '(notanın tam üstünde/altında)', KURAL_TURN),
  R('ters turn (notalar arası)', ['2-5-6', '1-2-3'], '(alt-asıl-üst-asıl dönüşü)', KURAL_TURN),
  R('ters turn (nota üstünde)', ['6', '2-5-6', '1-2-3'], '(ters turn, nota üstünde/altında)', KURAL_TURN),
  R('üst mordent', ['5', '2-3-5'], '(asıl-üst-asıl)', KURAL_TURN),
  R('uzun üst mordent', ['5-6', '2-3-5'], '(birden çok salınımlı üst mordent)', KURAL_TURN),
  R('alt mordent', ['5', '2-3-5', '1-2-3'], '(asıl-alt-asıl)', KURAL_TURN),
  R('uzun alt mordent', ['5-6', '2-3-5', '1-2-3'], '(birden çok salınımlı alt mordent)', KURAL_TURN),
  R('glissando', ['4', '1'], '(iki nota arası kaydırma) · ⠈⠁', KURAL_NUANS_SONRA),
];

/* ─────────────────  14) DÜZENSİZ NOTA GRUPLARI  ────────────────────────── */
export const MUZIK_DUZENSIZ_GRUPLAR = [
  R('üçleme (tek hücreli)', ['2-3'], '(3 nota 2 nota süresinde) · ilk notadan önce', KURAL_TRIPLET, undefined, '3'),
  R('üçleme (3 hücreli)', ['4-5-6', '2-5', '3'], '(karışık düzensiz gruplar arasında tercih edilir)', KURAL_TRIPLET, undefined, '3'),
  R('ikileme (duplet)', ['4-5-6', '2-3', '3'], '(2 nota 3 nota süresinde)', KURAL_DUZENSIZ_GRUP, undefined, '2'),
  R('dörtleme (quadruplet)', ['4-5-6', '2-5-6', '3'], '(4 nota 6 nota süresinde)', KURAL_DUZENSIZ_GRUP, undefined, '4'),
  R('beşleme (quintuplet)', ['4-5-6', '2-6', '3'], '(5 nota anlık süresinde)', KURAL_DUZENSIZ_GRUP, undefined, '5'),
  R('altılama (sextuplet)', ['4-5-6', '2-3-5', '3'], '(6 nota anlık süresinde)', KURAL_DUZENSIZ_GRUP, undefined, '6'),
  R('yedileme (septuplet)', ['4-5-6', '2-3-5-6', '3'], '(7 nota anlık süresinde)', KURAL_DUZENSIZ_GRUP, undefined, '7'),
];

/* ─────────────────  15) BRAILLE TEKRAR İŞARETLERİ  ─────────────────────── */
export const MUZIK_TEKRAR = [
  R('braille repeat işareti', ['2-3-5-6'], '(önceki ölçü/parçayı aynen tekrarlar) · ⠶', KURAL_BRAILLE_REPEAT, undefined, '𝄎'),
  R('repeat ×3', ['2-3-5-6', '3-4-5-6', '1-4'], '(işaret + boşluksuz rakam = 3 kez)', KURAL_BRAILLE_REPEAT),
  R('geri sayım tekrarı (8↩4)', ['3-4-5-6', '1-2-5', '3-4-5-6', '1-4-5'], '(8 ölçü geri, 4 ölçü çal)', KURAL_NUMARA_TEKRAR),
  R('eşit geri sayım (4↩4)', ['3-4-5-6', '1-4-5'], '(araya başka müzik yoksa tek rakam yeter)', KURAL_NUMARA_TEKRAR),
  R('ölçü numarası tekrarı (#2)', ['3-4-5-6', '2-3'], '(belirli ölçünün tekrarı)', KURAL_OLCU_NO_TEKRAR),
  R('ölçü aralığı tekrarı (#5-8)', ['3-4-5-6', '2-6', '3-6', '2-3-6'], '(5–8. ölçülerin tekrarı) · hyphen sonrası # yenilenmez', KURAL_OLCU_NO_TEKRAR),
];

/* ─────────────────  Menüde gezilebilir bölümler  ───────────────────────── */
export const MUZIK_BOLUMLER = [
  {
    slug: 'notalar',
    kisaBaslik: 'Notalar',
    pageBaslik: 'Müzik · Notalar (do – si)',
    ilerlemeAnahtari: 'muzik-notalar',
    veri: MUZIK_NOTALAR,
  },
  {
    slug: 'sureler',
    kisaBaslik: 'Nota süreleri',
    pageBaslik: 'Müzik · Nota süreleri (Do üzerinden)',
    ilerlemeAnahtari: 'muzik-sureler',
    veri: MUZIK_SURELER,
  },
  {
    slug: 'eslar',
    kisaBaslik: 'Eslar',
    pageBaslik: 'Müzik · Es (sessizlik) işaretleri',
    ilerlemeAnahtari: 'muzik-eslar',
    veri: MUZIK_ESLAR,
  },
  {
    slug: 'oktav',
    kisaBaslik: 'Oktav işaretleri',
    pageBaslik: 'Müzik · Oktav işaretleri',
    ilerlemeAnahtari: 'muzik-oktav',
    veri: MUZIK_OKTAVLAR,
  },
  {
    slug: 'zaman-imzasi',
    kisaBaslik: 'Zaman imzası',
    pageBaslik: 'Müzik · Zaman imzaları',
    ilerlemeAnahtari: 'muzik-zaman',
    veri: MUZIK_ZAMAN_IMZASI,
  },
  {
    slug: 'donanim',
    kisaBaslik: 'Donanım / aksidental',
    pageBaslik: 'Müzik · Donanım ve aksidentaller',
    ilerlemeAnahtari: 'muzik-donanim',
    veri: MUZIK_DONANIM,
  },
  {
    slug: 'olcu-cizgileri',
    kisaBaslik: 'Ölçü çizgileri',
    pageBaslik: 'Müzik · Ölçü çizgileri ve baskı tekrarları',
    ilerlemeAnahtari: 'muzik-olcu',
    veri: MUZIK_OLCU_CIZGILERI,
  },
  {
    slug: 'bag-slur',
    kisaBaslik: 'Bağ / slur',
    pageBaslik: 'Müzik · Bağ ve slur işaretleri',
    ilerlemeAnahtari: 'muzik-bag',
    veri: MUZIK_BAGLAR,
  },
  {
    slug: 'dinamikler',
    kisaBaslik: 'Dinamikler',
    pageBaslik: 'Müzik · Dinamikler (p, f, cresc.)',
    ilerlemeAnahtari: 'muzik-dinamik',
    veri: MUZIK_DINAMIKLER,
  },
  {
    slug: 'hairpin',
    kisaBaslik: 'Hairpin dinamikleri',
    pageBaslik: 'Müzik · Hairpin (kıl) dinamikleri',
    ilerlemeAnahtari: 'muzik-hairpin',
    veri: MUZIK_HAIRPIN,
  },
  {
    slug: 'nuans-once',
    kisaBaslik: 'Nüans (nota öncesi)',
    pageBaslik: 'Müzik · Nota öncesi nüanslar',
    ilerlemeAnahtari: 'muzik-nuans-once',
    veri: MUZIK_NUANS_ONCE,
  },
  {
    slug: 'nuans-sonra',
    kisaBaslik: 'Nüans (nota sonrası)',
    pageBaslik: 'Müzik · Nota sonrası nüanslar (fermata, nefes)',
    ilerlemeAnahtari: 'muzik-nuans-sonra',
    veri: MUZIK_NUANS_SONRA,
  },
  {
    slug: 'suslemeler',
    kisaBaslik: 'Süslemeler',
    pageBaslik: 'Müzik · Süslemeler (trill, turn, mordent…)',
    ilerlemeAnahtari: 'muzik-susleme',
    veri: MUZIK_SUSLEMELER,
  },
  {
    slug: 'duzensiz-gruplar',
    kisaBaslik: 'Düzensiz gruplar',
    pageBaslik: 'Müzik · Düzensiz nota grupları',
    ilerlemeAnahtari: 'muzik-duzensiz',
    veri: MUZIK_DUZENSIZ_GRUPLAR,
  },
  {
    slug: 'tekrar',
    kisaBaslik: 'Braille tekrar',
    pageBaslik: 'Müzik · Braille tekrar işaretleri',
    ilerlemeAnahtari: 'muzik-tekrar',
    veri: MUZIK_TEKRAR,
  },
];

/* ═════════════════════════════════════════════════════════════════════════ */
/*  GERİYE DÖNÜK UYUMLULUK EXPORT’LARI                                       */
/*  (Mevcut sayfalar bu yapıları doğrudan kullanmaktadır.)                   */
/* ═════════════════════════════════════════════════════════════════════════ */

// 7 temel nota — UEB Music’te bu hücreler aslında “sekizlik” notayı temsil eder.
// (Süre değiştirilmek istenirse 3 ve/veya 6 noktası eklenir.)
export const NOTALAR = [
  { ad: 'do',  okunus: 'do',  noktalar: [1, 4, 5] },
  { ad: 're',  okunus: 're',  noktalar: [1, 5] },
  { ad: 'mi',  okunus: 'mi',  noktalar: [1, 2, 4] },
  { ad: 'fa',  okunus: 'fa',  noktalar: [1, 2, 4, 5] },
  { ad: 'sol', okunus: 'sol', noktalar: [1, 2, 5] },
  { ad: 'la',  okunus: 'la',  noktalar: [2, 4] },
  { ad: 'si',  okunus: 'si',  noktalar: [2, 4, 5] },
];

// Süre göstergeleri (temel hücreye eklenecek noktalar) — UEB Music kuralları:
// sekizlik = temel hücre · dörtlük = +6 · yarım = +3 · tam = +3 ve 6
export const SURE_GOSTERGELERI = [
  {
    ad: 'sekizlik nota', sembol: '♪',
    aciklama: 'Sekizlik nota temel hücredir; 3 ve 6 noktası eklenmez. Örn. sekizlik Do: 1-4-5.',
    noktalarEk: [],
  },
  {
    ad: 'dörtlük nota', sembol: '♩',
    aciklama: 'Dörtlük notada yalnız 6 noktası eklenir. Örn. dörtlük Do: 1-4-5-6.',
    noktalarEk: [6],
  },
  {
    ad: 'yarım nota', sembol: '𝅗𝅥',
    aciklama: 'Yarım notada yalnız 3 noktası eklenir. Örn. yarım Do: 1-3-4-5.',
    noktalarEk: [3],
  },
  {
    ad: 'tam nota', sembol: '𝅝',
    aciklama: 'Tam notada hücreye 3 ve 6 noktaları eklenir. Örn. tam Do: 1-3-4-5-6.',
    noktalarEk: [3, 6],
  },
];

// Müzik özel sembolleri (anahtarlar, aksidentaller, eslar, ölçü çizgisi)
export const MUZIK_SEMBOLLERI = [
  {
    ad: 'sol anahtarı', sembol: '𝄞',
    aciklama: 'Sol anahtarı (3 hücreli): 3-4-5, 3-4, 1-2-3.',
    hucreler: [[3, 4, 5], [3, 4], [1, 2, 3]],
  },
  {
    ad: 'fa anahtarı', sembol: '𝄢',
    aciklama: 'Fa anahtarı (3 hücreli): 3-4-5, 3-4, 1-2-3-4-5-6.',
    hucreler: [[3, 4, 5], [3, 4], [1, 2, 3, 4, 5, 6]],
  },
  {
    ad: 'diyez', sembol: '♯',
    aciklama: 'Diyez işareti. Hücre: 1-4-6.',
    hucreler: [[1, 4, 6]],
  },
  {
    ad: 'bemol', sembol: '♭',
    aciklama: 'Bemol işareti. Hücre: 1-2-6.',
    hucreler: [[1, 2, 6]],
  },
  {
    ad: 'bekar', sembol: '♮',
    aciklama: 'Bekar (naturel) işareti. Hücre: 1-6.',
    hucreler: [[1, 6]],
  },
  {
    ad: 'tam es', sembol: '𝄻',
    aciklama: 'Tam ölçü sessizlik (whole rest) / 16’lık es. Hücre: 1-3-4.',
    hucreler: [[1, 3, 4]],
  },
  {
    ad: 'yarım es', sembol: '𝄼',
    aciklama: 'Yarım nota sessizlik (half rest) / 32’lik es. Hücre: 1-3-6.',
    hucreler: [[1, 3, 6]],
  },
  {
    ad: 'dörtlük es', sembol: '𝄽',
    aciklama: 'Dörtlük nota sessizlik (quarter rest) / 64’lük es. Hücre: 1-2-3-6.',
    hucreler: [[1, 2, 3, 6]],
  },
  {
    ad: 'sekizlik es', sembol: '𝄾',
    aciklama: 'Sekizlik nota sessizlik (eighth rest) / 128’lik es. Hücre: 1-3-4-6.',
    hucreler: [[1, 3, 4, 6]],
  },
  {
    ad: 'ölçü çizgisi', sembol: '|',
    aciklama: 'Ölçü çizgisi: ölçüler arasında boş bir hücre (boşluk) bırakılır.',
    hucreler: [[]],
  },
  {
    ad: 'final çift çubuk', sembol: '𝄂',
    aciklama: 'Eserin sonu: 1-2-6, 1-3.',
    hucreler: [[1, 2, 6], [1, 3]],
  },
];

// Oktav işaretleri — UEB Music’te 7 oktav. (4. oktav = orta do oktavıdır.)
export const OKTAV_ISARETLERI = [
  { ad: '1. oktav', noktalar: [4] },
  { ad: '2. oktav', noktalar: [4, 5] },
  { ad: '3. oktav', noktalar: [4, 5, 6] },
  { ad: '4. oktav (orta do)', noktalar: [5] },
  { ad: '5. oktav', noktalar: [4, 6] },
  { ad: '6. oktav', noktalar: [5, 6] },
  { ad: '7. oktav', noktalar: [6] },
];

// Örnek müzik dizileri (ardışık sekizlik / temel hücre okumaları)
export const MUZIK_DIZILERI = [
  {
    yazi: 'Do – Re – Mi – Fa – Sol – La – Si',
    okunus: 'çıkıcı majör dizi',
    anlam: 'Do majör dizinin yedi notası (sekizlik / temel hücre).',
    hucreler: [
      [1, 4, 5], [1, 5], [1, 2, 4], [1, 2, 4, 5],
      [1, 2, 5], [2, 4], [2, 4, 5],
    ],
  },
  {
    yazi: 'Do – Mi – Sol',
    okunus: 'do majör kırık akor',
    anlam: 'Do majör üçlü akorun ardışık çalınışı.',
    hucreler: [
      [1, 4, 5], [1, 2, 4], [1, 2, 5],
    ],
  },
  {
    yazi: 'Mi – Re – Do',
    okunus: 'inici üçlü',
    anlam: 'Mi – Re – Do dizisi (sekizlik).',
    hucreler: [
      [1, 2, 4], [1, 5], [1, 4, 5],
    ],
  },
];
