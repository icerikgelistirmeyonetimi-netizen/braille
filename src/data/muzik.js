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

import { muzikKontraksiyonsuzMetinHucreleri } from '../utils/music/musicHeaderEngine.js';

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
  'Uzatma noktası, kendisinden önceki nota ya da susun değerini yarısı kadar uzatır.',
  'Toplam değer 1,5 kat olur (1 + ½).',
  'Braille’de nota ya da sus hücresinin hemen ardına 3 noktası konur.',
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
const KURAL_DEGISTIRICI = [
  'Bu işaretler notanın sol tarafına yazılır.',
  'Birden fazla nota için ise en başa yazılır.'
];
const KURAL_DONANIM = [
  'Donanım eserin başında, zaman imzasından önce, kendi satırına ortalanır.',
  '1–3 diyez/bemol için yalnız işaretler tekrar edilir.',
  '4 veya daha çok diyez/bemol için önce rakam göstergesi + rakam + işaret yazılır.',
  'Eser içinde değişen donanım, bölüm çift çubuğundan (<K\') sonra yazılır.',
];

const KURAL_BARLINE = [
  'Ölçü çizgisi Braille’de boş bir hücredir.',
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
  'Aynı notada birden çok sonraki işaret varsa sıra: nokta, fermata, slur, tie, nefes, geriye repeat.',
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
  'Braille tekrar işareti ⠶ (2-3-5-6) hemen önceki ölçü ya da ölçünün bir kısmını tekrarlar.',
  'Birden çok kez tekrar için işaretin sonuna boşluksuz sayı eklenir; ilk notada oktav işareti gerekir.',
  'Nüans ve süslemeler farklıysa tekrar işareti kullanılamaz.',
  'Tie son notada ise tekrar işaretinden SONRA yazılır.',
];

const KURAL_NUMARA_TEKRAR = [
  'Geri sayım tekrarı: iki rakam aralarında boşluk olmadan yazılır.',
  'İlk rakam kaç ölçü geri sayılacağını, ikinci rakam kaç ölçü çalınacağını gösterir (örn. ⠼⠓⠼⠙ = 8 geri, 4 çal).',
  'Geri sayım ile çalınacak miktar eşitse tek rakam yeterlidir.',
  'Genellikle 8 ölçüden uzun pasajlar için kullanılmaz; aynı Braille sayfasında olmalıdır.',
];

const KURAL_OLCU_NO_TEKRAR = [
  'Ölçü numarası tekrarı: rakam göstergesi + ilgili ölçü numarası (alt hücrede).',
  'Aralık için araya literal hyphen (3-6) konur: ⠼⠑⠤⠓ = 5-8 ölçülerinin tekrarı.',
  'Uzun veya sık tekrarlanan pasajlar için uygundur; uzak ölçülere atıf önerilmez.',
];

/* ─────────────────────────  1) NOTALAR (Pitch)  ────────────────────────── */
// UEB Music: temel hücre = sekizlik (quaver). Süre eki için 3 ve/veya 6.
export const MUZIK_NOTALAR = [
  {
    ...R('do (C)', ['1-4-5'], '', KURAL_NOTA, undefined, 'C'),
    sesOncesiYonergeMetni: "Bilgilendirme: Bu eğitimde 8'lik nota süresine göre nota brailleri verilecektir.",
    tamYonergeMetni: 'Do notası. Lütfen sırayla 1., 4. ve 5. noktalara dokununuz.',
  },
  R('re (D)', ['1-5'], '', KURAL_NOTA, undefined, 'D'),
  R('mi (E)', ['1-2-4'], '', KURAL_NOTA, undefined, 'E'),
  R('fa (F)', ['1-2-4-5'], '', KURAL_NOTA, undefined, 'F'),
  R('sol (G)', ['1-2-5'], '', KURAL_NOTA, undefined, 'G'),
  R('la (A)', ['2-4'], '', KURAL_NOTA, undefined, 'A'),
  R('si (B)', ['2-4-5'], '', KURAL_NOTA, undefined, 'B'),
];

/* ─────────  2) NOTA SÜRELERİ (Duration)  ──────────── */
export const MUZIK_SURELER = [
  { ...R('8\'lik ve 128\'lik süre', [], 'Temel hücredir, 3 ve 6 noktası eklenmez. 8\'lik ve 128\'lik nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.', KURAL_SURE, undefined, '♪'), tamYonergeMetni: 'Bilgilendirme: Süreler notalara 3. ve 6. noktalardan eklemeler yapılarak tanımlanır. 8lik ve 128lik nota için ekleme yapılmaz. notalar doğal formlarında yazılır. Lütfen bu adımda tıklama yapmadan devam ediniz.' },
  R('8\'lik ve 128\'lik Do', ['1-4-5'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),
  R('8\'lik ve 128\'lik Re', ['1-5'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),
  R('8\'lik ve 128\'lik Mi', ['1-2-4'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),
  R('8\'lik ve 128\'lik Fa', ['1-2-4-5'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),
  R('8\'lik ve 128\'lik Sol', ['1-2-5'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),
  R('8\'lik ve 128\'lik La', ['2-4'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),
  R('8\'lik ve 128\'lik Si', ['2-4-5'], '8\'lik ve 128\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♪'),

  R('4\'lük ve 64\'lük süre', ['6'], 'Temel hücreye 6 noktası eklenir. 4\'lük ve 64\'lük nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük Do', ['1-4-5-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük Re', ['1-5-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük Mi', ['1-2-4-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük Fa', ['1-2-4-5-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük Sol', ['1-2-5-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük La', ['2-4-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),
  R('4\'lük ve 64\'lük Si', ['2-4-5-6'], '4\'lük ve 64\'lük aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '♩'),

  R('İkilik ve 32\'lik süre', ['3'], 'Temel hücreye 3 noktası eklenir. Yarım ve 32\'lik nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik Do', ['1-3-4-5'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik Re', ['1-3-5'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik Mi', ['1-2-3-4'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik Fa', ['1-2-3-4-5'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik Sol', ['1-2-3-5'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik La', ['2-3-4'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),
  R('İkilik ve 32\'lik Si', ['2-3-4-5'], 'İkilik ve 32\'lik aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅗𝅥'),

  R('Birlik ve 16\'lık süre', ['3-6'], 'Temel hücreye 3 ve 6 noktaları eklenir. Tam ve 16\'lık nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık Do', ['1-3-4-5-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık Re', ['1-3-5-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık Mi', ['1-2-3-4-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık Fa', ['1-2-3-4-5-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık Sol', ['1-2-3-5-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık La', ['2-3-4-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
  R('Birlik ve 16\'lık Si', ['2-3-4-5-6'], 'Birlik ve 16\'lık aynı yazılır. Bağlamdan anlaşılır.', KURAL_SURE, undefined, '𝅝'),
];

/* ───────────────────  3) ESLAR (Rests) — UEB Music  ────────────────────── */
const MUZIK_SURE_NOTA_TEMELLERI = [
  { ad: 'Do', noktalar: [1, 4, 5] },
  { ad: 'Re', noktalar: [1, 5] },
  { ad: 'Mi', noktalar: [1, 2, 4] },
  { ad: 'Fa', noktalar: [1, 2, 4, 5] },
  { ad: 'Sol', noktalar: [1, 2, 5] },
  { ad: 'La', noktalar: [2, 4] },
  { ad: 'Si', noktalar: [2, 4, 5] },
];

const noktaGrubu = (noktalar) => noktalar.join('-');

const RITIM_BIRLIK_SUS = {
  vurusSayisi: 8,
  piyanoOlaylari: [{ vurus: 1, sureVurus: 4 }],
};
const RITIM_IKILIK_SUS = {
  vurusSayisi: 4,
  piyanoOlaylari: [{ vurus: 1, sureVurus: 2 }],
};
const RITIM_DORTLUK_SUS = {
  vurusSayisi: 4,
  piyanoOlaylari: [
    { vurus: 1, sureVurus: 0.85 },
    { vurus: 2, sureVurus: 0.85 },
  ],
};
const RITIM_SEKIZLIK_SUS = {
  vurusSayisi: 4,
  piyanoOlaylari: [
    { yarimVurus: 1, sureYarimVurus: 0.82 },
    { yarimVurus: 3, sureYarimVurus: 0.82 },
    { yarimVurus: 5, sureYarimVurus: 0.82 },
    { yarimVurus: 7, sureYarimVurus: 0.82 },
  ],
};
const RITIM_SEKIZLIK_NOTA = {
  vurusSayisi: 4,
  piyanoOlaylari: Array.from({ length: 8 }, (_, i) => ({
    yarimVurus: i + 1,
    sureYarimVurus: 0.82,
  })),
};

function sureDersiOlustur({ ad, ekNoktalar, aciklama, sembol, tamYonergeMetni, notaRitimOrnegi }) {
  const sureOgesi = {
    ...R(`${ad} süre`, ekNoktalar.length ? [noktaGrubu(ekNoktalar)] : [], aciklama, KURAL_SURE, undefined, sembol),
    ...(tamYonergeMetni ? { tamYonergeMetni } : {}),
  };

  return [
    sureOgesi,
    ...MUZIK_SURE_NOTA_TEMELLERI.map((nota) => ({
      ...R(
        `${ad} ${nota.ad}`,
        [noktaGrubu([...nota.noktalar, ...ekNoktalar].sort((a, b) => a - b))],
        `${ad} ${nota.ad} notası. ${aciklama}`,
        KURAL_SURE,
        undefined,
        sembol,
      ),
      ...(notaRitimOrnegi ? { ritimOrnegi: notaRitimOrnegi } : {}),
    })),
  ];
}

export const MUZIK_SURELER_TEMEL = [
  ...sureDersiOlustur({
    ad: "8'lik",
    ekNoktalar: [],
    aciklama: "Temel hücredir; 3 ve 6 noktası eklenmez.",
    sembol: '8',
    tamYonergeMetni: "Bilgilendirme: Süreler notalara 3. ve 6. noktalardan eklemeler yapılarak tanımlanır. Birinci aşamada ilköğretim düzeyinde en sık karşılaşılan 8lik, 4lük, 2lik ve 1lik süreler çalışılacaktır. 8lik nota için ekleme yapılmaz. Lütfen bu adımda tıklama yapmadan devam ediniz.",
    notaRitimOrnegi: RITIM_SEKIZLIK_NOTA,
  }),
  ...sureDersiOlustur({
    ad: "4'lük",
    ekNoktalar: [6],
    aciklama: "Temel hücreye 6 noktası eklenir.",
    sembol: '4',
  }),
  ...sureDersiOlustur({
    ad: "2'lik",
    ekNoktalar: [3],
    aciklama: "Temel hücreye 3 noktası eklenir. Bu değer yarım nota olarak da adlandırılır.",
    sembol: '2',
  }),
  ...sureDersiOlustur({
    ad: "1'lik",
    ekNoktalar: [3, 6],
    aciklama: "Temel hücreye 3 ve 6 noktaları eklenir. Bu değer tam nota olarak da adlandırılır.",
    sembol: '1',
  }),
];

export const MUZIK_SURELER_ILERI = [
  ...sureDersiOlustur({
    ad: "16'lık",
    ekNoktalar: [3, 6],
    aciklama: "16'lık nota, 1'lik nota ile aynı Braille hücresini kullanır; okuma bağlamdan anlaşılır.",
    sembol: '16',
    tamYonergeMetni: "Bilgilendirme: İkinci aşamada kullanım sıklığına göre 16lık, 32lik, 64lük ve 128lik süreler çalışılacaktır. 16lık nota 1lik nota ile aynı Braille hücresini kullanır. Lütfen sırasıyla noktalara dokununuz.",
  }),
  ...sureDersiOlustur({
    ad: "32'lik",
    ekNoktalar: [3],
    aciklama: "32'lik nota, 2'lik nota ile aynı Braille hücresini kullanır; okuma bağlamdan anlaşılır.",
    sembol: '32',
  }),
  ...sureDersiOlustur({
    ad: "64'lük",
    ekNoktalar: [6],
    aciklama: "64'lük nota, 4'lük nota ile aynı Braille hücresini kullanır; okuma bağlamdan anlaşılır.",
    sembol: '64',
  }),
  ...sureDersiOlustur({
    ad: "128'lik",
    ekNoktalar: [],
    aciklama: "128'lik nota, 8'lik nota ile aynı Braille hücresini kullanır; okuma bağlamdan anlaşılır.",
    sembol: '128',
  }),
];

export const MUZIK_ESLAR = [
  {
    ...R('birlik sus', ['1-3-4'], '(4 vuruş sessizlik)', KURAL_ES, undefined, '𝄻'),
    sesOncesiYonergeMetni: 'Bu etkinlikte piyano ve baget sesleri kullanılacaktır. 4/4lük zaman diliminde, sesli notalar piyano ile, sessiz (sus) notalar bagetle belirtilmiştir.',
    ritimOrnegi: RITIM_BIRLIK_SUS,
  },
  { ...R('ikilik sus', ['1-3-6'], '(2 vuruş sessizlik)', KURAL_ES, undefined, '𝄼'), ritimOrnegi: RITIM_IKILIK_SUS },
  { ...R('dörtlük sus', ['1-2-3-6'], '(1 vuruş sessizlik)', KURAL_ES, undefined, '𝄽'), ritimOrnegi: RITIM_DORTLUK_SUS },
  { ...R('sekizlik sus', ['1-3-4-6'], '(yarım vuruş sessizlik)', KURAL_ES, undefined, '𝄾'), ritimOrnegi: RITIM_SEKIZLIK_SUS },
];

export const MUZIK_ESLAR_ILERI = [
  {
    ...R("16'lık sus", ['1-3-4'], "16'lık sus, birlik sus ile aynı Braille hücresini kullanır; süre bağlamdan anlaşılır.", KURAL_ES, undefined, '16'),
    tamYonergeMetni: "Bilgilendirme: İleri sus bölümünde 16lık, 32lik, 64lük ve 128lik suslar çalışılır. Bu suslar temel suslarla aynı Braille hücrelerini kullanır; hangi sürenin okunacağı müzik bağlamından anlaşılır. Lütfen sırasıyla noktalara dokununuz.",
  },
  R("32'lik sus", ['1-3-6'], "32'lik sus, ikilik sus ile aynı Braille hücresini kullanır; süre bağlamdan anlaşılır.", KURAL_ES, undefined, '32'),
  R("64'lük sus", ['1-2-3-6'], "64'lük sus, dörtlük sus ile aynı Braille hücresini kullanır; süre bağlamdan anlaşılır.", KURAL_ES, undefined, '64'),
  R("128'lik sus", ['1-3-4-6'], "128'lik sus, sekizlik sus ile aynı Braille hücresini kullanır; süre bağlamdan anlaşılır.", KURAL_ES, undefined, '128'),
];

const MUZIK_UZATMA_NOKTASI_ORNEKLERI = [
  { ad: "1'lik", nota: [1, 3, 4, 5, 6], sus: [1, 3, 4], sembol: '1' },
  { ad: "2'lik", nota: [1, 3, 4, 5], sus: [1, 3, 6], sembol: '2' },
  { ad: "4'lük", nota: [1, 4, 5, 6], sus: [1, 2, 3, 6], sembol: '4' },
  { ad: "8'lik", nota: [1, 4, 5], sus: [1, 3, 4, 6], sembol: '8' },
  { ad: "16'lık", nota: [1, 3, 4, 5, 6], sus: [1, 3, 4], sembol: '16' },
  { ad: "32'lik", nota: [1, 3, 4, 5], sus: [1, 3, 6], sembol: '32' },
  { ad: "64'lük", nota: [1, 4, 5, 6], sus: [1, 2, 3, 6], sembol: '64' },
  { ad: "128'lik", nota: [1, 4, 5], sus: [1, 3, 4, 6], sembol: '128' },
];

export const MUZIK_UZATMA_NOKTASI = [
  {
    ...R('uzatma noktası', ['3'], 'Önceki nota ya da susun değerini yarısı kadar uzatır.', KURAL_NOKTALI_NOTA, undefined, '·'),
    tamYonergeMetni: 'Bilgilendirme: Uzatma noktası, notanın yanına da gelse susun yanına da gelse kendisinden önceki değeri yarısı kadar uzatır. Braille yazıda ilgili nota ya da sus hücresinden hemen sonra 3 noktası yazılır.',
  },
  ...MUZIK_UZATMA_NOKTASI_ORNEKLERI.flatMap((sure) => [
    R(
      `noktalı ${sure.ad} Do`,
      [noktaGrubu(sure.nota), '3'],
      `${sure.ad} Do notasından sonra 3 noktası gelir; değer yarısı kadar uzar.`,
      KURAL_NOKTALI_NOTA,
      undefined,
      `${sure.sembol}·`,
    ),
    R(
      `noktalı ${sure.ad} sus`,
      [noktaGrubu(sure.sus), '3'],
      `${sure.ad} sustan sonra 3 noktası gelir; sus değeri yarısı kadar uzar.`,
      KURAL_NOKTALI_NOTA,
      undefined,
      `${sure.sembol}𝄽·`,
    ),
  ]),
];

/* ─────────────────────  4) OKTAV İŞARETLERİ  ───────────────────────────── */
// Temel: 4. (orta do), 5. ve 3. oktav — en sık kullanılan üçü
export const MUZIK_OKTAVLAR_TEMEL = [
  R('4. oktav (orta do)', ['5'],     '(Middle C oktavı) · 5 noktası',                       KURAL_OKTAV, undefined, '⠐'),
  R("5. oktav",           ['4-6'],   "(orta do'nun bir üstü) · 4-6",                        KURAL_OKTAV, undefined, '⠠'),
  R("3. oktav",           ['4-5-6'], "(orta do'nun bir altı) · 4-5-6",                      KURAL_OKTAV, undefined, '⠸'),
];
// İleri: 1., 2., 6., 7. oktav
export const MUZIK_OKTAVLAR_ILERI = [
  R('2. oktav',           ['4-5'],   '(1. oktavın bir üstü) · 4-5',                          KURAL_OKTAV, undefined, '⠨'),
  R('1. oktav (en pes)',  ['4'],     "(piyanonun en alt do'sundan başlar) · 4 noktası",      KURAL_OKTAV, undefined, '⠈'),
  R('6. oktav',           ['5-6'],   '(5. oktavın bir üstü) · 5-6',                          KURAL_OKTAV, undefined, '⠰'),
  R('7. oktav (en tiz)',  ['6'],     '(piyanonun en üst oktavı) · 6 noktası',                KURAL_OKTAV, undefined, '⠘'),
];
export const MUZIK_OKTAVLAR = [...MUZIK_OKTAVLAR_TEMEL, ...MUZIK_OKTAVLAR_ILERI];

/* ─────────────────  5) ZAMAN İMZALARI (Time signatures)  ──────────────── */
export const MUZIK_ZAMAN_IMZASI = [
  R('4/4', ['3-4-5-6', '1-4-5', '2-5-6'], '(dört dörtlük) · rakam göstergesi + d (üst 4) + alt 4', KURAL_ZAMAN_IMZASI, undefined, '4/4'),
  R('3/4', ['3-4-5-6', '1-4', '2-5-6'], '(üç dörtlük) · # + c (üst 3) + alt 4', KURAL_ZAMAN_IMZASI, undefined, '3/4'),
  R('2/4', ['3-4-5-6', '1-2', '2-5-6'], '(iki dörtlük) · # + b (üst 2) + alt 4', KURAL_ZAMAN_IMZASI, undefined, '2/4'),
  R('6/8', ['3-4-5-6', '1-2-4', '2-3-6'], '(altı sekizlik) · # + f (üst 6) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '6/8'),
  R('3/8', ['3-4-5-6', '1-4', '2-3-6'], '(üç sekizlik) · # + c (üst 3) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '3/8'),

  R('5/8', ['3-4-5-6', '1-5', '2-3-6'], '(beş sekizlik) · # + e (üst 5) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '5/8'),
  R('7/8', ['3-4-5-6', '1-2-4-5', '2-3-6'], '(yedi sekizlik) · # + g (üst 7) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '7/8'),
  R('9/8', ['3-4-5-6', '2-4', '2-3-6'], '(dokuz sekizlik) · # + i (üst 9) + alt 8', KURAL_ZAMAN_IMZASI, undefined, '9/8'),

  R('2/2 (sebare)', ['3-4-5-6', '1-2', '2-3'], '(iki ikilik / alla breve) · # + b (üst 2) + alt 2', KURAL_ZAMAN_IMZASI, undefined, '𝄵'),
];

export const MUZIK_DEGISTIRICI = [
  R('diyez (sharp)', ['1-4-6'], '(notayı yarım ses inceltir)', KURAL_DEGISTIRICI, undefined, '♯'),
  R('bemol (flat)', ['1-2-6'], '(notayı yarım ses kalınlaştırır)', KURAL_DEGISTIRICI, undefined, '♭'),
  R('naturel (natural)', ['1-6'], '(diyez/bemol etkisini iptal eder)', KURAL_DEGISTIRICI, undefined, '♮'),
  R('çift diyez', ['1-4-6', '1-4-6'], '(notayı bir tam ses inceltir)', KURAL_DEGISTIRICI, undefined, '𝄪'),
  R('çift bemol', ['1-2-6', '1-2-6'], '(notayı bir tam ses kalınlaştırır)', KURAL_DEGISTIRICI, undefined, '𝄫'),
 
]
/* ─────────────────  6) DONANIM (Key signature) ─────────────────────────── */
// UEB Music: 1–3 diyez/bemol → işaret tekrar; 4+ → rakam göstergesi + sayı + işaret.
export const MUZIK_DONANIM = [
  R('1 diyezli donanım', ['1-4-6'],                          '(sol majör / mi minör)',           KURAL_DONANIM, undefined, '♯'),
  R('2 diyezli donanım', ['1-4-6', '1-4-6'],                 '(re majör / si minör)',            KURAL_DONANIM, undefined, '♯♯'),
  R('3 diyezli donanım', ['1-4-6', '1-4-6', '1-4-6'],        '(la majör / fa diyez minör)',      KURAL_DONANIM, undefined, '♯♯♯'),
  R('4 diyezli donanım', ['3-4-5-6', '1-4-5', '1-4-6'],      '(mi majör / do diyez minör)',      KURAL_DONANIM, undefined, '#4♯'),
  R('5 diyezli donanım', ['3-4-5-6', '1-5',   '1-4-6'],      '(si majör / sol diyez minör)',     KURAL_DONANIM, undefined, '#5♯'),
  R('6 diyezli donanım', ['3-4-5-6', '1-2-4', '1-4-6'],      '(fa diyez majör / re diyez minör)',KURAL_DONANIM, undefined, '#6♯'),
  R('7 diyezli donanım', ['3-4-5-6', '1-2-4-5', '1-4-6'],    '(do diyez majör / la diyez minör)',KURAL_DONANIM, undefined, '#7♯'),
  R('1 bemollü donanım', ['1-2-6'],                          '(fa majör / re minör)',            KURAL_DONANIM, undefined, '♭'),
  R('2 bemollü donanım', ['1-2-6', '1-2-6'],                 '(si bemol majör / sol minör)',     KURAL_DONANIM, undefined, '♭♭'),
  R('3 bemollü donanım', ['1-2-6', '1-2-6', '1-2-6'],        '(mi bemol majör / do minör)',      KURAL_DONANIM, undefined, '♭♭♭'),
  R('4 bemollü donanım', ['3-4-5-6', '1-4-5', '1-2-6'],      '(la bemol majör / fa minör)',      KURAL_DONANIM, undefined, '#4♭'),
  R('5 bemollü donanım', ['3-4-5-6', '1-5',   '1-2-6'],      '(re bemol majör / si bemol minör)',KURAL_DONANIM, undefined, '#5♭'),
  R('6 bemollü donanım', ['3-4-5-6', '1-2-4', '1-2-6'],      '(sol bemol majör / mi bemol minör)',KURAL_DONANIM, undefined, '#6♭'),
  R('7 bemollü donanım', ['3-4-5-6', '1-2-4-5', '1-2-6'],    '(do bemol majör / la bemol minör)',KURAL_DONANIM, undefined, '#7♭'),
];

/* ─────────────────  7) ÖLÇÜ ÇİZGİLERİ ve TEKRARLAR  ────────────────────── */
export const MUZIK_OLCU_CIZGILERI = [
  {
    ad: 'ölçü ayracı (boşluk)',
    aciklama: 'Braille müzikte ölçü çizgisi yoktur — iki ölçü arasına 1 boşluk hücresi konur.',
    hucreler: [[]],
    kurallar: KURAL_BARLINE,
    okumaOzeti: 'ölçüler arası boşluk hücresi',
    tamYonergeMetni: 'Ölçü ayracı, Braille yazıda boşluk hücresidir. Sistemde boşluk tuşu olmadığı için bu hücre atlanabilir. Sonraki öğeye geçiniz.',
  },
  R('bitiş çizgisi (final)', ['1-2-6', '1-3'], '(eserin sonu)', KURAL_BARLINE, undefined, '𝄂'),
  R('bölüm sonu çift çubuk', ['1-2-6', '1-3', '3'], '(yeni bölüm başlıyorsa)', KURAL_BARLINE, undefined, '𝄁'),
  R('ileriye doğru tekrar', ['1-2-6', '2-3-5-6'], '(tekrarlanacak pasajın başı)', KURAL_BASKI_TEKRAR, undefined, '𝄆'),
  R('geriye doğru tekrar', ['1-2-6', '2-3'], '(tekrarlanacak pasajın sonu)', KURAL_BASKI_TEKRAR, undefined, '𝄇'),
  R('1. dolap', ['3-4-5-6', '2'], '(ilk seferki son)', KURAL_VOLTA, undefined, '1.'),
  R('2. dolap', ['3-4-5-6', '2-3'], '(tekrar sonrası alternatif son)', KURAL_VOLTA, undefined, '2.'),
  R('müzik kısa çizgisi', ['5'], '(bar içinde tekrar sonrası ayırıcı)', KURAL_BARLINE, undefined, '⠐'),
];

/* ─────────────────  8) BAĞLAR ve SLUR İŞARETLERİ  ──────────────────────── */
export const MUZIK_BAGLAR = [
  R('uzatma bağı', ['4', '1-4'], '(aynı perdedeki iki notayı bağlar)', KURAL_BAG, undefined, '⌣'),
  R('hece bağı', ['1-4'], '(2-4 farklı notayı bağlar)', KURAL_BAG, undefined, '⌒'),
  R('cümle bağı başlangıcı', ['5-6', '1-2'], '(uzun cümle bağı başlangıcı)', KURAL_BAG, undefined, '⌒['),
  R('cümle bağı bitişi', ['4-5', '2-3'], '(uzun cümle bağı bitişi)', KURAL_BAG, undefined, ']⌒'),
  R('çift hece bağı', ['1-4', '1-4'], '(4 ve daha fazla nota için çift hece bağı)', KURAL_BAG, undefined, '⌒⌒'),
];

/* ─────────────────  9) DİNAMİKLER (sözcük temelli)  ─────────────────────── */
// Tüm dinamikler önünde söz işareti ⠜ (3-4-5) bulunur; söz işareti kendisi dinamik değildir.
export const MUZIK_DINAMIKLER = [
  R('çift piyano', ['3-4-5', '1-2-3-4', '1-2-3-4'], '(pp)', KURAL_WORD_SIGN, undefined, 'pp'),
  R('piyano', ['3-4-5', '1-2-3-4'], '(p)', KURAL_WORD_SIGN, undefined, 'p'),
  R('mezo piyano', ['3-4-5', '1-3-4', '1-2-3-4'], '(mp)', KURAL_WORD_SIGN, undefined, 'mp'),
  R('mezo forte', ['3-4-5', '1-3-4', '1-2-4'], '(mf)', KURAL_WORD_SIGN, undefined, 'mf'),
  R('forte', ['3-4-5', '1-2-4'], '(f)', KURAL_WORD_SIGN, undefined, 'f'),
  R('çift forte', ['3-4-5', '1-2-4', '1-2-4'], '(ff)', KURAL_WORD_SIGN, undefined, 'ff'),
  R('sforzando', ['3-4-5', '2-3-4', '1-2-4'], '(sf)', KURAL_WORD_SIGN, undefined, 'sf'),
  R('kreşendo', ['3-4-5', '1-4', '1-2-3-5', '3'], '(cr)', KURAL_WORD_SIGN, undefined, 'cr'),
  R('dekreşendo', ['3-4-5', '1-4-5', '1-5', '1-4', '1-2-3-5', '3'], '(decr)', KURAL_WORD_SIGN, undefined, 'decr'),
  R('diminiendo', ['3-4-5', '1-4-5', '2-4', '1-3-4', '3'], '(dim)', KURAL_WORD_SIGN, undefined, 'dim'),
  R('riterdando', ['3-4-5', '1-2-3-5', '2-4', '2-3-4-5', '3'], '(rit)', KURAL_WORD_SIGN, undefined, 'rit'),

  R('keskin kreşendo başlangıcı', ['3-4-5', '1-4'], '(genişleyen iki çizgi) · etkilenen ilk notadan önce', KURAL_WORD_SIGN),
  R('keskin kreşendo bitir', ['3-4-5', '2-5'], '(devamı yoksa son notadan sonra)', KURAL_WORD_SIGN),
  R('keskin dekreşendo', ['3-4-5', '1-4-5'], '(daralan iki çizgi) · etkilenen ilk notadan önce', KURAL_WORD_SIGN),
  R('keskin dekreşendo bitir', ['3-4-5', '2-5-6'], '(devamı yoksa son notadan sonra)', KURAL_WORD_SIGN),
];

/* ─────────────────  11) NOTA ÖNCESİ NÜANSLAR  ──────────────────────────── */
export const MUZIK_NUANS_ONCE = [
  R('Stakato', ['2-3-6'], '(kısa, kesik) · notanın hemen önünde', KURAL_NUANS_ONCE, undefined, '·'),
  R('Simo', ['6', '2-3-6'], '(çok kısa, sivri) · 6 + staccato', KURAL_NUANS_ONCE, undefined, '▽'),
  R('mezzo-stakato', ['5', '2-3-6'], '(yarı kısa) · 5 + staccato', KURAL_NUANS_ONCE, undefined, '‧'),
  R('tonuto', ['4-5-6', '2-3-6'], '(tam süreyle uzat) · 4-5-6 + staccato hücresi', KURAL_NUANS_ONCE, undefined, '‒'),
  R('aksent', ['4-6', '2-3-6'], '(vurgulu çal) · 4-6 + staccato hücresi', KURAL_NUANS_ONCE, undefined, '>'),
  R('İfadeli aksent', ['4-5', '2-3-6'], '(ifadeli vurgu) · 4-5 + staccato hücresi', KURAL_NUANS_ONCE),
  R('ters aksent', ['4', '2-3-6'], '(ters vurgu) · 4 + staccato hücresi', KURAL_NUANS_ONCE),
  R('martellato', ['5-6', '2-3-6'], '(çekiç gibi sert vurgu) · 5-6 + staccato hücresi', KURAL_NUANS_ONCE),
  R('Şişirme nüansı (<>)', ['1-6', '3'], '(şişen-sönen vurgu) · 1-6 + 3', KURAL_NUANS_ONCE),
];

/* ─────────────────  12) NOTA SONRASI NÜANSLAR  ─────────────────────────── */
export const MUZIK_NUANS_SONRA = [
  R('fermata (durak)', ['1-2-6', '1-2-3'], '(notayı uzat) · notadan sonra · ⠣⠇', KURAL_NUANS_SONRA, undefined, '𝄐'),
  R('notalar arası fermata', ['5', '1-2-6', '1-2-3'], '(iki nota arasında durak)', KURAL_NUANS_SONRA),
  R('ölçü çizgisi üstü fermata', ['4-5-6', '1-2-6', '1-2-3'], '(ölçü çizgisinde durak)', KURAL_NUANS_SONRA),
  R('kare fermata', ['5-6', '1-2-6', '1-2-3'], '(kare şekilli uzatma)', KURAL_NUANS_SONRA),
  R('üçgen fermata', ['4-5', '1-2-6', '1-2-3'], '(çadır şekilli uzatma)', KURAL_NUANS_SONRA),
  R('nefes işareti', ['3-4-5', '2'], '(kısa nefes molası) · ⠜⠂', KURAL_NUANS_SONRA, undefined, ','),
  R('sezür  (kesinti / //)', ['6', '3-4'], '(genel mola, kesinti) · ⠠⠌', KURAL_NUANS_SONRA, undefined, '//'),
];

/* ─────────────────────  13) SÜSLEMELER (Ornaments)  ────────────────────── */
export const MUZIK_SUSLEMELER = [
  R('kısa apejetür', ['2-6'], '(saplama yan nota; küçük çapraz çizgili)', KURAL_NUANS_ONCE, undefined, '♪'),
  R('uzun apejetür', ['5', '2-6'], '(uzun yan nota; çapraz çizgisiz)', KURAL_NUANS_ONCE, undefined, '♩'),
  R('tril', ['2-3-5'], '(iki nota arası hızlı titreşim)', KURAL_TRILL, undefined, 'tr'),
  R('bemollü tril', ['1-2-6', '2-3-5'], '(bemol etkili tril)', KURAL_TRILL, undefined, 'tr♭'),
  R('diyezli tril', ['1-4-6', '2-3-5'], '(diyez etkili tril)', KURAL_TRILL, undefined, 'tr♯'),
  R('grupeto (notalar arası)', ['2-5-6'], '(üst-asıl-alt-asıl dönüşü)', KURAL_TURN, undefined, '∽'),
  R('grupeto (nota üstünde)', ['6', '2-5-6'], '(notanın tam üstünde/altında)', KURAL_TURN, undefined, '∽⁺'),
  R('ters grupeto (notalar arası)', ['2-5-6', '1-2-3'], '(alt-asıl-üst-asıl dönüşü)', KURAL_TURN, undefined, '∾'),
  R('ters grupeto (nota üstünde)', ['6', '2-5-6', '1-2-3'], '(ters grupeto, nota üstünde/altında)', KURAL_TURN, undefined, '∾⁺'),
  R('üst mordan', ['5', '2-3-5'], '(asıl-üst-asıl)', KURAL_TURN, undefined, '∿'),
  R('uzun üst mordan', ['5-6', '2-3-5'], '(birden çok salınımlı üst mordan)', KURAL_TURN, undefined, '≈'),
  R('alt mordan', ['5', '2-3-5', '1-2-3'], '(asıl-alt-asıl)', KURAL_TURN, undefined, '⌇'),
  R('uzun alt mordan', ['5-6', '2-3-5', '1-2-3'], '(birden çok salınımlı alt mordan)', KURAL_TURN, undefined, '⌇⌇'),
  R('glisando', ['4', '1'], '(iki nota arası kaydırma) · ⠈⠁', KURAL_NUANS_SONRA, undefined, '/'),
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

const tempoHucreleri = (metin) => muzikKontraksiyonsuzMetinHucreleri(metin);

export const MUZIK_TEMPO_ISARETLERI = [
  {
    ad: 'Largo',
    sembol: 'largo',
    bpmMin: 40, bpmMax: 60,
    dil: 'it',
    hucreler: tempoHucreleri('largo'),
    aciklama: 'Largo çok yavaş tempoyu belirtir. Metronom örneğinde yavaş vuruşlarla gösterilir.',
    kurallar: [
      'Tempo işaretleri müzik braillede metin ifadesi olarak yazılır.',
      'Kontraksiyonsuz Braille harfleriyle gösterilir.',
      'Müzik başlığında veya eser içinde tempo bilgisi olarak kullanılabilir.',
    ],
    ornekler: ['Largo: çok yavaş.'],
  },
  {
    ad: 'Adagio',
    sembol: 'adagio',
    bpmMin: 60, bpmMax: 76,
    dil: 'it',
    hucreler: tempoHucreleri('adagio'),
    aciklama: 'Adagio yavaş tempoyu belirtir.',
    kurallar: [
      'Tempo işaretleri kontraksiyonsuz metin olarak okunur.',
      'Adagio, Largo kadar ağır olmayan yavaş bir tempodur.',
    ],
    ornekler: ['Adagio: yavaş.'],
  },
  {
    ad: 'Andante',
    sembol: 'andante',
    bpmMin: 76, bpmMax: 108,
    dil: 'it',
    hucreler: [[1], [1, 3, 4, 5], [1, 4, 5], [1], [1, 3, 4, 5], [2, 3, 4, 5], [1, 5]],
    aciklama: 'Andante yürür gibi orta-yavaş tempoyu belirtir.',
    kurallar: [
      'Tempo ifadesi metin olarak yazılır.',
      'Andante genellikle rahat ve yürüyüş benzeri hız anlamına gelir.',
    ],
    ornekler: ['Andante: yürür gibi.'],
  },
  {
    ad: 'Moderato',
    sembol: 'moderato',
    bpmMin: 108, bpmMax: 120,
    dil: 'it',
    hucreler: tempoHucreleri('moderato'),
    aciklama: 'Moderato orta tempoyu belirtir.',
    kurallar: [
      'Tempo işareti müzik bilgisini verir, notanın perdesini değiştirmez.',
      'Metronom örneği orta hızda verilir.',
    ],
    ornekler: ['Moderato: orta hız.'],
  },
  {
    ad: 'Allegro',
    sembol: 'allegro',
    bpmMin: 120, bpmMax: 156,
    dil: 'it',
    hucreler: tempoHucreleri('allegro'),
    aciklama: 'Allegro hızlı ve canlı tempoyu belirtir.',
    kurallar: [
      'Tempo işareti kontraksiyonsuz metin olarak yazılır.',
      'Allegro, hızlı metronom vuruşuyla örneklenir.',
    ],
    ornekler: ['Allegro: hızlı.'],
  },
  {
    ad: 'Vivace',
    sembol: 'vivace',
    bpmMin: 156, bpmMax: 176,
    dil: 'it',
    hucreler: tempoHucreleri('vivace'),
    aciklama: 'Vivace canlı ve hızlı tempoyu belirtir.',
    kurallar: [
      'Tempo işareti metin olarak yazılır.',
      'Allegrodan daha canlı hissedilebilir.',
    ],
    ornekler: ['Vivace: canlı hızlı.'],
  },
  {
    ad: 'Presto',
    sembol: 'presto',
    bpmMin: 176, bpmMax: 220,
    dil: 'it',
    hucreler: tempoHucreleri('presto'),
    aciklama: 'Presto çok hızlı tempoyu belirtir.',
    kurallar: [
      'Tempo ifadesi metin hücreleriyle gösterilir.',
      'Metronom örneği çok hızlı vuruşlarla verilir.',
    ],
    ornekler: ['Presto: çok hızlı.'],
  },
  {
    ad: 'Ritardando',
    sembol: 'rit.',
    dil: 'it',
    hucreler: tempoHucreleri('rit.'),
    aciklama: 'Ritardando veya rit. gittikçe yavaşlama anlamına gelir.',
    kurallar: [
      'Ritardando bir gürlük değil, tempo değişimidir.',
      'Ses örneğinde metronom aralıkları giderek açılır.',
    ],
    ornekler: ['rit.: gittikçe yavaşla.'],
  },
  {
    ad: 'Accelerando',
    sembol: 'accel.',
    dil: 'it',
    hucreler: tempoHucreleri('accel.'),
    aciklama: 'Accelerando veya accel. gittikçe hızlanma anlamına gelir.',
    kurallar: [
      'Accelerando tempo değişimidir.',
      'Ses örneğinde metronom aralıkları giderek kısalır.',
    ],
    ornekler: ['accel.: gittikçe hızlan.'],
  },
  {
    ad: 'A tempo',
    sembol: 'a tempo',
    dil: 'it',
    hucreler: tempoHucreleri('atempo'),
    aciklama: 'A tempo, önceki ana tempoya geri dön anlamına gelir.',
    kurallar: [
      'İki kelimeli tempo ifadeleri metin olarak gösterilir.',
      'Müzik içinde tempo değişiminden sonra ana tempoya dönüşü belirtir.',
    ],
    ornekler: ['a tempo: eski tempoya dön.'],
  },
];

/* ─────────────────  15) BRAILLE TEKRAR İŞARETLERİ  ─────────────────────── */
export const MUZIK_TEKRAR = [
  R('Braille tekrar işareti', ['2-3-5-6'], '(önceki ölçü/parçayı aynen tekrarlar) · ⠶', KURAL_BRAILLE_REPEAT, undefined, '𝄎'),
  R('tekrar ×3', ['2-3-5-6', '3-4-5-6', '1-4'], '(işaret + boşluksuz rakam = 3 kez)', KURAL_BRAILLE_REPEAT),
  R('geri sayım tekrarı (8↩4)', ['3-4-5-6', '1-2-5', '3-4-5-6', '1-4-5'], '(8 ölçü geri, 4 ölçü çal)', KURAL_NUMARA_TEKRAR),
  R('eşit geri sayım (4↩4)', ['3-4-5-6', '1-4-5'], '(araya başka müzik yoksa tek rakam yeter)', KURAL_NUMARA_TEKRAR),
  R('ölçü numarası tekrarı (#2)', ['3-4-5-6', '2-3'], '(belirli ölçünün tekrarı)', KURAL_OLCU_NO_TEKRAR),
  R('ölçü aralığı tekrarı (#5-8)', ['3-4-5-6', '2-6', '3-6', '2-3-6'], '(5–8. ölçülerin tekrarı) · hyphen sonrası # yenilenmez', KURAL_OLCU_NO_TEKRAR),
];

// Menüde kullanılan Türkçe başlıklarla veri sabitlerinin adları uyumlu kalsın.
export const MUZIK_SUS = MUZIK_ESLAR;
export const MUZIK_DEGISTIRICILER = MUZIK_DEGISTIRICI;

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
    slug: 'sureler-temel',
    kisaBaslik: 'Nota süreleri 1',
    pageBaslik: 'Müzik · Nota Süreleri 1 (8lik, 4lük, 2lik, 1lik)',
    ilerlemeAnahtari: 'muzik-sureler-temel',
    veri: MUZIK_SURELER_TEMEL,
  },
  {
    slug: 'sureler-ileri',
    kisaBaslik: 'Nota süreleri 2',
    pageBaslik: 'Müzik · Nota Süreleri 2 (16lık, 32lik, 64lük, 128lik)',
    ilerlemeAnahtari: 'muzik-sureler-ileri',
    veri: MUZIK_SURELER_ILERI,
  },
  {
    slug: 'sus-ileri',
    kisaBaslik: 'Sus 2',
    pageBaslik: 'İleri sus işaretleri (16lık, 32lik, 64lük, 128lik)',
    ilerlemeAnahtari: 'muzik-sus-ileri',
    veri: MUZIK_ESLAR_ILERI,
  },
  {
    slug: 'sus',
    kisaBaslik: 'Sus',
    pageBaslik: 'Müzik · Sus (sessizlik) işaretleri',
    ilerlemeAnahtari: 'muzik-sus',
    veri: MUZIK_SUS,
  },
  {
    slug: 'uzatma-noktasi',
    kisaBaslik: 'Uzatma noktası',
    pageBaslik: 'Uzatma noktası',
    ilerlemeAnahtari: 'muzik-uzatma-noktasi',
    veri: MUZIK_UZATMA_NOKTASI,
  },
  {
    slug: 'oktav-temel',
    kisaBaslik: 'Oktav (4, 5, 3)',
    pageBaslik: 'Müzik · Oktav işaretleri — temel (4, 5, 3. oktav)',
    ilerlemeAnahtari: 'muzik-oktav-temel',
    veri: MUZIK_OKTAVLAR_TEMEL,
  },
  {
    slug: 'oktav-ileri',
    kisaBaslik: 'Oktav (1, 2, 6, 7)',
    pageBaslik: 'Müzik · Oktav işaretleri — ileri (1, 2, 6, 7. oktav)',
    ilerlemeAnahtari: 'muzik-oktav-ileri',
    veri: MUZIK_OKTAVLAR_ILERI,
  },
  {
    slug: 'zaman-imzasi',
    kisaBaslik: 'Ölçü sayılarının yazımı',
    pageBaslik: 'Ölçü sayılarının yazımı',
    ilerlemeAnahtari: 'muzik-zaman',
    veri: MUZIK_ZAMAN_IMZASI,
  },
  {
    slug: 'tempo',
    kisaBaslik: 'Tempo İşaretleri',
    pageBaslik: 'Müzik · Tempo İşaretleri',
    aciklama: 'Largo, Andante, Allegro gibi tempo işaretlerini ve hız değişimlerini öğren.',
    ilerlemeAnahtari: 'muzik-tempo',
    veri: MUZIK_TEMPO_ISARETLERI,
  },
  {
    slug: 'degistirici',
    kisaBaslik: 'Değiştirici işaretler',
    pageBaslik: 'Değiştirici işaretler',
    ilerlemeAnahtari: 'muzik-degistirici',
    veri: MUZIK_DEGISTIRICILER,
  },
  {
    slug: 'donanim',
    kisaBaslik: 'Donanım',
    pageBaslik: 'Donanım (key signature)',
    ilerlemeAnahtari: 'muzik-donanim',
    veri: MUZIK_DONANIM,
  },
  {
    slug: 'olcu-cizgileri',
    kisaBaslik: 'Ölçü çizgisi ve tekrar',
    pageBaslik: 'Ölçü çizgileri ve baskı tekrarları',
    ilerlemeAnahtari: 'muzik-olcu',
    veri: MUZIK_OLCU_CIZGILERI,
  },
  {
    slug: 'bag-slur',
    kisaBaslik: 'Bağlar',
    pageBaslik: 'Bağlar',
    ilerlemeAnahtari: 'muzik-bag',
    veri: MUZIK_BAGLAR,
  },
  {
    slug: 'dinamikler',
    kisaBaslik: 'Çalma Teknikleri',
    pageBaslik: 'Çalma Teknikleri',
    ilerlemeAnahtari: 'muzik-dinamik',
    veri: MUZIK_DINAMIKLER,
  },

  {
    slug: 'nuans-once',
    kisaBaslik: 'Nüans (önce)',
    pageBaslik: 'Nota öncesi nüanslar (staccato, accent, tenuto)',
    ilerlemeAnahtari: 'muzik-nuans-once',
    veri: MUZIK_NUANS_ONCE,
  },
  {
    slug: 'nuans-sonra',
    kisaBaslik: 'Nüans (sonra)',
    pageBaslik: 'Nota sonrası nüanslar (fermata, nefes, mola)',
    ilerlemeAnahtari: 'muzik-nuans-sonra',
    veri: MUZIK_NUANS_SONRA,
  },
  {
    slug: 'suslemeler',
    kisaBaslik: 'Süslemeler',
    pageBaslik: 'Süslemeler (trill, turn, mordent…)',
    ilerlemeAnahtari: 'muzik-susleme',
    veri: MUZIK_SUSLEMELER,
  },
  {
    slug: 'duzensiz-gruplar',
    kisaBaslik: 'Düzensiz gruplar',
    pageBaslik: 'Düzensiz nota grupları',
    ilerlemeAnahtari: 'muzik-duzensiz',
    veri: MUZIK_DUZENSIZ_GRUPLAR,
  },
  {
    slug: 'tekrar',
    kisaBaslik: 'Braille tekrar',
    pageBaslik: 'Braille tekrar işaretleri',
    ilerlemeAnahtari: 'muzik-tekrar',
    veri: MUZIK_TEKRAR,
  },
];

const MUZIK_ILERI_BOLUM_SLUGLARI = new Set([
  'sureler-ileri',
  'sus-ileri',
  'oktav-ileri',
  'dinamikler',
  'nuans-once',
  'nuans-sonra',
  'suslemeler',
  'duzensiz-gruplar',
]);

export const MUZIK_BOLUM_GRUPLARI = [
  {
    id: 'temel',
    baslik: 'Temel müzik konuları',
    bolumler: MUZIK_BOLUMLER.filter((bolum) => !MUZIK_ILERI_BOLUM_SLUGLARI.has(bolum.slug)),
  },
  {
    id: 'ileri',
    baslik: 'İleri müzik konuları',
    bolumler: MUZIK_BOLUMLER.filter((bolum) => MUZIK_ILERI_BOLUM_SLUGLARI.has(bolum.slug)),
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
// Küçük değerler (16, 32, 64) hücre olarak aynıdır ancak bayrak sayısı ve
// gruplama davranışı farklıdır (Modül 8, Bölüm 4 Grouping kuralı).
export const SURE_GOSTERGELERI = [
  {
    ad: 'sekizlik nota', esAd: '128\'lik nota', sembol: '♪',
    aciklama: 'Temel hücre; 3 ve 6 noktası eklenmez. Örn. sekizlik Do: 1-4-5. Sekizlik nota ile 128\'lik nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [], realValue: 8, bayrak: 1,
  },
  {
    ad: 'dörtlük nota', esAd: '64\'lük nota', sembol: '♩',
    aciklama: 'Temel hücreye 6 noktası eklenir. Örn. dörtlük Do: 1-4-5-6. Dörtlük nota ile 64\'lük nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [6], realValue: 4, bayrak: 0,
  },
  {
    ad: 'ikilik nota', esAd: '32\'lik nota', sembol: '𝅗𝅥',
    aciklama: 'Temel hücreye 3 noktası eklenir. Örn. ikilik Do: 1-3-4-5. İkilik nota ile 32\'lik nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [3], realValue: 2, bayrak: 0,
  },
  {
    ad: 'birlik nota', esAd: '16\'lık nota', sembol: '𝅝',
    aciklama: 'Temel hücreye 3 ve 6 noktaları eklenir. Örn. birlik Do: 1-3-4-5-6. Birlik nota ile 16\'lık nota aynı Braille hücresiyle yazılır; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [3, 6], realValue: 1, bayrak: 0,
  },
  {
    ad: '16-lık nota', esAd: 'birlik nota', sembol: '𝅘𝅥𝅮',
    aciklama: 'Birlik nota ile aynı Braille hücresiyle yazılır; 3 ve 6 noktaları eklenir. 16\'lık nota ile birlik nota aynı şekilde gösterilir; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [3, 6], realValue: 16, bayrak: 2,
  },
  {
    ad: '32-lik nota', esAd: 'ikilik nota', sembol: '𝅘𝅥𝅯',
    aciklama: 'İkilik nota ile aynı Braille hücresiyle yazılır; 3 noktası eklenir. 32\'lik nota ile ikilik nota aynı şekilde gösterilir; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [3], realValue: 32, bayrak: 3,
  },
  {
    ad: '64-lük nota', esAd: 'dörtlük nota', sembol: '𝅘𝅥𝅰',
    aciklama: 'Dörtlük nota ile aynı Braille hücresiyle yazılır; 6 noktası eklenir. 64\'lük nota ile dörtlük nota aynı şekilde gösterilir; hangisinin okunacağı parçanın akışından anlaşılır.',
    noktalarEk: [6], realValue: 64, bayrak: 4,
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
  { ad: '4. oktav (orta do)', noktalar: [5] },
  { ad: '5. oktav', noktalar: [4, 6] },
  { ad: '3. oktav', noktalar: [4, 5, 6] },
  { ad: '2. oktav', noktalar: [4, 5] },
  { ad: '1. oktav', noktalar: [4] },
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
