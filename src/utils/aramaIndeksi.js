// =============================================================================
// Braille Arama İndeksi — 9 öğrenme modülündeki tüm braille sembollerini tek bir
// düz listede toplar. Kullanıcı bir braille hücresinin nokta numaralarını
// (ör. "123") boşluksuz yazar; her sembolün hücreleri taranır. Çok hücreli
// sembollerde hücrelerden BİRİNİN eşleşmesi yeterlidir.
//
// Her giriş (entry):
//   { etiket, altEtiket, hucreler, anahtarlar, yol, modulBaslik, kategori }
//   - hucreler  : number[][]  (braille hücreleri)
//   - anahtarlar: string[]    (her hücrenin normalize edilmiş nokta anahtarı)
//   - yol       : ilgili eğitim sayfasının rotası
//
// Sayfalardaki hücre türetme mantığı birebir taklit edilir (örn. rakamlarda
// sayı işareti öneki, kelime kökü kısaltmalarında 5. nokta kök işareti).
// =============================================================================

import {
  HARFLER,
  RAKAMLAR,
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA_ISARETLERI,
  OZEL_ISARETLER,
} from '../data/braille.js';
import {
  KURAN_HARFLERI,
  KURAN_HAREKELERI,
  CEZM_SEDDE,
  TENVINLER,
  TA_I_MERBUTA,
  MED_HARFLERI,
  MUKADDER_MEDLER,
  ELIF_ZAID,
  DIGER_UZATMA,
  HEMZELER,
  HEMZE_VASL,
  KURAN_TECVID,
} from '../data/kuran.js';
import {
  MATEMATIK_RAKAMLAR,
  MATEMATIK_SEMBOLLER,
  MATEMATIK_OLCULER,
  GEOMETRI_SEMBOLLERI,
  MATEMATIK_IFADELER,
  RAKAM_GOSTERGESI,
  SIRA_SAYISI_RAKAM_NOKTALARI,
} from '../data/matematik.js';
import {
  YUNAN_HARFLERI,
  FEN_SEMBOLLER,
  KIMYASAL_FORMULLER,
  FIZIK_FORMULLERI,
} from '../data/fen.js';
import { MUZIK_BOLUMLER } from '../data/muzik.js';
import { ALMANCA_BOLUMLER } from '../data/almancaBraille.js';
import { FRANSIZCA_BOLUMLER } from '../data/fransizcaBraille.js';
import { INGILIZCE_BOLUMLER } from '../data/ingilizceBraille.js';

const SAYI_ISARETI = [3, 4, 5, 6];

// "Örnek/ifade" girişlerinde (İfade Okuma: tarih/"15 + 8 = 23"; Özel İşaretler:
// Tarih Yazma "23.4.1923", Rumuzlu İfadeler "TBMM") gömülü SAYI ve HARF'ler keyfîdir —
// başka sayı/harf de olabilirdi. Kuralı taşıyan anlamlı kısım işaret/ayraç/göstergedir
// (bağ 36, rakam işareti 3456, büyük harf işareti 6 …). Sorgunun TÜM hücreleri aşağıdaki
// keyfî desenlerdense örnek girişler eşleşmez (rakam/harf araması tarihi/rumuzu bulmasın);
// sorgu bir işaret/ayraç içerirse örnek yine bulunur.
const RAKAM_ANAHTARLARI = [
  '3456',                                                    // rakam (sayı) işareti
  '1', '12', '14', '145', '15', '124', '1245', '125', '24', '245', // üst rakamlar 1-0 (a-j ile aynı desen)
  '2', '23', '25', '256', '26', '235', '2356', '236', '35', '356', // alt rakamlar 1-0
];
const HARF_ANAHTARLARI = [
  '13', '123', '134', '1345', '135', '1234', '12345', '1235', '234', '2345', // k-t
  '136', '1236', '2456', '1346', '13456', '1356',           // u-z
  '16', '126', '246', '146', '1256',                         // ç ğ ö ş ü (a-j, ı=35, İ=24 rakamlarda var)
];
const KEYFI_ANAHTARLAR = new Set([...RAKAM_ANAHTARLARI, ...HARF_ANAHTARLARI]);

// Harf (a-z + Türkçe) hücre desenleri — geometri nokta-adı tespitinde kullanılır.
const HARF_DESENLERI = new Set([
  '1', '12', '14', '145', '15', '124', '1245', '125', '24', '245', // a-j
  ...HARF_ANAHTARLARI,                                              // k-z, ç ğ ö ş ü
  '35',                                                             // ı
]);

/**
 * Geometri girişinde keyfî NOKTA ADI harflerinin indeksleri (aranamaz hücreler).
 * Nokta adları daima harf/büyük-harf işaretinden (⠰=56 / ⠠=6) SONRA gelir; şekil
 * sembolleri (açı 246, üçgen, diklik 236…) bu işaretlerden ÖNCE gelir → aranabilir kalır.
 */
function geometriNoktaAdiIndeksleri(anahtarlar) {
  const sonuc = [];
  let etiketModu = false;
  for (let i = 0; i < anahtarlar.length; i += 1) {
    const a = anahtarlar[i];
    if (a === '56' || a === '6') { etiketModu = true; continue; } // harf iş. / büyük harf iş.
    if (etiketModu && HARF_DESENLERI.has(a)) { sonuc.push(i); continue; } // nokta adı harfi
    etiketModu = false; // şekil sembolü / ayraç → etiket dizisi biter, aranabilir
  }
  return sonuc;
}

// Sözlük (metin) araması eş anlamlıları: veri sembolü işaretin ADIYLA tanımlı
// (ör. "+" → "artı") ama kullanıcı işlemin adıyla arayabilir ("toplama"). Anahtar
// = girişin etiketi (küçük harf, tam eşleşme — fen "artı (yük)" gibi farklı etiketler
// etkilenmez). Yalnız sözlük aramasında kullanılır; braille aramasını etkilemez.
const ARAMA_ES_ANLAMLILAR = {
  'artı': ['toplama', 'topla', 'toplam', 'ekleme'],
  'eksi': ['çıkarma', 'çıkar', 'eksilme'],
  'çarpma': ['çarpım', 'çarp'],
  'bölme': ['bölü', 'bölüm', 'böl'],
  'eşittir': ['eşit', 'eşitlik'],
};

// Modül numarası → konu başlığı (kartlarda "Müzik", "Matematik" gibi gösterilir).
// Modül 9 (yabancı dil) başlığını DİL adı belirler (ekle'de modulKonu override edilir).
const MODUL_KONU = {
  'Modül 1': 'Harfler',
  'Modül 2': 'Kısaltmalar',
  'Modül 3': 'Noktalamalar',
  'Modül 5': "Kur'an-ı Kerim",
  'Modül 6': 'Matematik',
  'Modül 7': 'Fen',
  'Modül 8': 'Müzik',
  'Modül 9': 'Yabancı Dil',
};

/** Konu adlarının (gruplama/filtre başlıkları) modül sırası; diller ayrı başlık. */
export const KONU_SIRASI = [
  'Harfler', 'Kısaltmalar', 'Noktalamalar', "Kur'an-ı Kerim",
  'Matematik', 'Fen', 'Müzik',
  'İngilizce', 'Almanca', 'Fransızca',
];

// ── Yardımcılar ──────────────────────────────────────────────────────────────

/** Bir hücreyi normalize eder: yalnızca 1-6 noktaları, tekilleştirilmiş+sıralı. */
function hucreyiNormalle(hucre) {
  const list = Array.isArray(hucre) ? hucre : [hucre];
  return [...new Set(list)].filter((d) => d >= 1 && d <= 6).sort((a, b) => a - b);
}

/** Normalize hücre → eşleştirme anahtarı (ör. [2,1,3] → "123"). */
function hucreAnahtari(hucre) {
  return hucreyiNormalle(hucre).join('');
}

/** Kullanıcı girdisini eşleştirme anahtarına çevirir (boşluk/virgül vb. atılır). */
export function sorguyuNormalle(girdi) {
  const noktalar = String(girdi || '')
    .split('')
    .filter((c) => c >= '1' && c <= '6')
    .map(Number);
  return hucreAnahtari(noktalar);
}

/**
 * Bir hücredeki noktaların okunabilir Türkçe cümlesi.
 * [1]     → "1. nokta"
 * [1,2,3] → "1, 2 ve 3. noktalar"
 */
export function noktaCumlesi(hucre) {
  const s = hucreyiNormalle(hucre);
  if (s.length === 0) return '';
  if (s.length === 1) return `${s[0]}. nokta`;
  return `${s.slice(0, -1).join(', ')} ve ${s[s.length - 1]}. noktalar`;
}

/** noktalar/hucreler alanını [[...],[...]] biçimine getirir (düz dizi → tek hücre). */
function hucreleriCikar(arr) {
  if (!arr || arr.length === 0) return [];
  return Array.isArray(arr[0]) ? arr : [arr];
}

// ── İndeks kurulumu ──────────────────────────────────────────────────────────

const _indeks = [];

/** Tek bir giriş ekler (boş/geçersiz hücreli girişler atlanır). */
function ekle({ etiket, altEtiket, hucreler, yol, modulBaslik, modulKonu, kategori, ornek }) {
  // hucreleriCikar: düz tek hücre ([2,5,6]) → [[2,5,6]] (bazı veride hücreler düz yazılmış).
  const temizHucreler = hucreleriCikar(hucreler)
    .map(hucreyiNormalle)
    .filter((h) => h.length > 0);
  if (temizHucreler.length === 0) return;
  const etiketTemiz = String(etiket ?? '').trim() || '(adsız)';
  const anahtarlar = temizHucreler.map((h) => h.join(''));
  // aranamaz: HÜCRE-bazlı keyfî hücre indeksleri (Set). Eşleşme yalnız aranabilir
  // (keyfî olmayan) hücreyi içeren pencerelerde geçerlidir.
  //  - ornek === 'geometri' → keyfî NOKTA ADI harfleri (şekil sembolleri aranabilir kalır)
  //  - ornek (true)         → tüm keyfî desenli hücreler (ifade/tarih/rumuz: sayı+harf)
  let aranamaz;
  if (ornek === 'geometri') {
    aranamaz = new Set(geometriNoktaAdiIndeksleri(anahtarlar));
  } else if (ornek) {
    aranamaz = new Set(anahtarlar.map((a, i) => (KEYFI_ANAHTARLAR.has(a) ? i : -1)).filter((i) => i >= 0));
  }
  _indeks.push({
    etiket: etiketTemiz,
    esler: ARAMA_ES_ANLAMLILAR[metinNormalle(etiketTemiz)], // sözlük araması eş anlamlıları
    altEtiket: altEtiket ? String(altEtiket).trim() : '',
    hucreler: temizHucreler,
    anahtarlar,
    yol,
    modulBaslik,
    modulKonu: modulKonu || MODUL_KONU[modulBaslik] || modulBaslik,
    kategori,
    ornek: !!ornek,
    aranamaz, // Set<number> | undefined
  });
}

/** Bir veri dizisini, satır-başına eşleyiciyle indekse ekler. */
function kaynakEkle(veri, esle, ortak) {
  (veri || []).forEach((item) => {
    const m = esle(item);
    if (m && m.hucreler) ekle({ ...ortak, ...m });
  });
}

// ── Modül 1 — Braille Öğrenme ─────────────────────────────────────────────────
kaynakEkle(HARFLER, (h) => ({ etiket: h.harf, hucreler: [h.noktalar] }),
  { modulBaslik: 'Modül 1', kategori: 'Harf Eğitimi', yol: '/harfler' });

kaynakEkle(RAKAMLAR, (r) => ({ etiket: r.rakam, hucreler: [SAYI_ISARETI, r.noktalar] }),
  { modulBaslik: 'Modül 1', kategori: 'Rakam Eğitimi', yol: '/rakamlar' });

// Modül 1 noktalama kaydı KALDIRILDI (ders Modül 3'e devredildi) — `/noktalama` rotası
// artık yok; indekste kalsaydı arama sonucu ölü rotaya götürürdü. Noktalama araması
// Modül 3'ün `NOKTALAMA_ISARETLERI` kaydından karşılanır (aşağıda).

// ── Modül 2 — Kısaltmalar ──────────────────────────────────────────────────────
kaynakEkle(KELIME_KISALTMALARI, (k) => ({ etiket: k.harf, altEtiket: k.kelime, hucreler: [k.noktalar] }),
  { modulBaslik: 'Modül 2', kategori: 'Bir Harfli Kısaltmalar', yol: '/kisaltma-bir-harfli' });

kaynakEkle(IKI_HARFLI_KISALTMALAR, (k) => ({
  etiket: k.harf.toLocaleUpperCase('tr'), altEtiket: k.kelime, hucreler: [k.sol, k.sag],
}), { modulBaslik: 'Modül 2', kategori: 'İki Harfli Kısaltmalar', yol: '/kisaltma-iki-harfli' });

kaynakEkle(HECE_KISALTMALARI, (k) => ({ etiket: k.hece, hucreler: [k.noktalar] }),
  { modulBaslik: 'Modül 2', kategori: 'Hece Kısaltmaları', yol: '/kisaltma-hece' });

kaynakEkle(KELIME_KOKU_KISALTMALARI, (k) => ({
  etiket: k.etiket, altEtiket: k.kelime, hucreler: [[5], k.sag],
}), { modulBaslik: 'Modül 2', kategori: 'Kelime Kökü Kısaltmaları', yol: '/kisaltma-kelime-koku' });

kaynakEkle(KELIME_PARCASI_KISALTMALARI, (k) => ({
  etiket: k.etiket, altEtiket: k.ekler, hucreler: [k.sol, k.sag],
}), { modulBaslik: 'Modül 2', kategori: 'Kelime Parçası Kısaltmaları', yol: '/kisaltma-kelime-parcasi' });

// ── Modül 3 — Noktalama ve Özel İşaretler ──────────────────────────────────────
kaynakEkle(NOKTALAMA_ISARETLERI, (s) => ({ etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 3', kategori: 'Noktalama İşaretleri', yol: '/noktalama-isaretleri' });

// Gömülü örnek (keyfî sayı/harf) taşıyan girişler: tarih "23.4.1923", rumuz "TBMM".
const OZEL_ORNEK_ADLARI = new Set(['Tarih Yazma', 'Rumuzlu İfadeler']);
kaynakEkle(OZEL_ISARETLER, (s) => ({
  etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler, ornek: OZEL_ORNEK_ADLARI.has(s.ad),
}), { modulBaslik: 'Modül 3', kategori: 'Özel İşaretler', yol: '/ozel-isaretler' });

// ── Modül 5 — Kur'an-ı Kerim ───────────────────────────────────────────────────
kaynakEkle(KURAN_HARFLERI, (h) => ({ etiket: h.ad, altEtiket: h.harf, hucreler: [h.noktalar] }),
  { modulBaslik: 'Modül 5', kategori: "Kur'an Harfleri", yol: '/kuran-harfler' });

kaynakEkle(KURAN_HAREKELERI, (h) => ({ etiket: h.ad, altEtiket: h.isaret, hucreler: [h.noktalar] }),
  { modulBaslik: 'Modül 5', kategori: 'Harekeler', yol: '/kuran-harekeler' });

const KURAN_ISARET_KAYNAKLARI = [
  { veri: CEZM_SEDDE, kategori: 'Cezim ve Şedde', slug: 'cezm-sedde' },
  { veri: TENVINLER, kategori: 'Tenvinler', slug: 'tenvinler' },
  { veri: TA_I_MERBUTA, kategori: 'Ta-i Merbûta', slug: 'ta-i-merbuta' },
  { veri: MED_HARFLERI, kategori: 'Med Harfleri', slug: 'med-harfleri' },
  { veri: MUKADDER_MEDLER, kategori: 'Mukadder Medler', slug: 'mukadder-medler' },
  { veri: ELIF_ZAID, kategori: 'Elif-i Zaid', slug: 'elif-zaid' },
  { veri: DIGER_UZATMA, kategori: 'Diğer Uzatma İşaretleri', slug: 'diger-uzatma' },
  { veri: HEMZELER, kategori: 'Hemzeler', slug: 'hemzeler' },
  { veri: HEMZE_VASL, kategori: 'Hemze-i Vasl ve Kat', slug: 'hemze-vasl' },
];
KURAN_ISARET_KAYNAKLARI.forEach(({ veri, kategori, slug }) => {
  kaynakEkle(veri, (s) => ({ etiket: s.ad, altEtiket: s.isaret, hucreler: hucreleriCikar(s.noktalar) }),
    { modulBaslik: 'Modül 5', kategori, yol: `/kuran-isaretler/${slug}` });
});

kaynakEkle(KURAN_TECVID, (s) => ({ etiket: s.ad, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 5', kategori: 'Durak İşaretleri', yol: '/kuran-uzatma' });

// ── Modül 6 — Matematik ────────────────────────────────────────────────────────
kaynakEkle(MATEMATIK_RAKAMLAR, (r) => ({ etiket: r.rakam, altEtiket: r.ad, hucreler: r.hucreler }),
  { modulBaslik: 'Modül 6', kategori: 'Rakamlar', yol: '/mat-rakamlar' });

['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((d) => {
  ekle({
    etiket: `${d}.`, altEtiket: 'sıra sayısı',
    hucreler: [RAKAM_GOSTERGESI, SIRA_SAYISI_RAKAM_NOKTALARI[d] || []],
    modulBaslik: 'Modül 6', kategori: 'Sıra Sayıları', yol: '/mat-sira-sayilari',
  });
});

kaynakEkle(MATEMATIK_SEMBOLLER, (s) => ({ etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 6', kategori: 'İşaretler', yol: '/mat-semboller' });

kaynakEkle(MATEMATIK_OLCULER, (s) => ({ etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 6', kategori: 'Ölçüler', yol: '/mat-olculer' });

kaynakEkle(GEOMETRI_SEMBOLLERI, (s) => ({
  etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler,
  // İki+ ardışık büyük harf (AB, ABC) = keyfî nokta adı → 'geometri' modu: yalnız
  // nokta-adı harfleri aranamaz olur; şekil sembolleri (açı/üçgen/diklik) aranabilir
  // kalır. Tek harfli anlamlı semboller (çap R, yarıçap r…) ornek DEĞİL.
  ornek: /[A-Z]{2}/.test(s.sembol || '') ? 'geometri' : false,
}), { modulBaslik: 'Modül 6', kategori: 'Geometri', yol: '/mat-geometri' });

kaynakEkle(MATEMATIK_IFADELER, (s) => ({ etiket: s.yazi, altEtiket: s.okunus, hucreler: s.hucreler }),
  // ornek: ifadelerdeki sayılar keyfî — rakam araması bu örnekleri getirmez (yalnız işaret/ayraç).
  { modulBaslik: 'Modül 6', kategori: 'İfade Okuma', yol: '/mat-ifadeler', ornek: true });

// ── Modül 7 — Fen Bilimleri ────────────────────────────────────────────────────
kaynakEkle(YUNAN_HARFLERI, (h) => ({ etiket: h.ad, altEtiket: h.harf, hucreler: [h.noktalar] }),
  { modulBaslik: 'Modül 7', kategori: 'Yunan Harfleri', yol: '/fen-yunan' });

kaynakEkle(FEN_SEMBOLLER, (s) => ({ etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 7', kategori: 'Birim ve Semboller', yol: '/fen-semboller' });

kaynakEkle(KIMYASAL_FORMULLER, (s) => ({ etiket: s.yazi, altEtiket: s.okunus, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 7', kategori: 'Kimyasal Formüller', yol: '/fen-kimya' });

kaynakEkle(FIZIK_FORMULLERI, (s) => ({ etiket: s.yazi, altEtiket: s.okunus, hucreler: s.hucreler }),
  { modulBaslik: 'Modül 7', kategori: 'Fizik Formülleri', yol: '/fen-fizik' });

// ── Modül 8 — Müzik ────────────────────────────────────────────────────────────
(MUZIK_BOLUMLER || []).forEach((bolum) => {
  kaynakEkle(bolum.veri, (s) => ({ etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler }),
    { modulBaslik: 'Modül 8', kategori: bolum.kisaBaslik, yol: `/muzik/${bolum.slug}` });
});

// ⚠ "Dizi Okuma" (MUZIK_DIZILERI) ARAMA KAPSAMI DIŞI: ders kaldırıldı (kullanıcı:
// "aramada da görünmesin") → arama sonucu ölü rotaya götürmesin.

// ── Modül 9 — Yabancı Dil ──────────────────────────────────────────────────────
const YABANCI_DILLER = [
  { bolumler: INGILIZCE_BOLUMLER, dilAdi: 'İngilizce', taban: '/ingilizce' },
  { bolumler: ALMANCA_BOLUMLER, dilAdi: 'Almanca', taban: '/almanca' },
  { bolumler: FRANSIZCA_BOLUMLER, dilAdi: 'Fransızca', taban: '/fransizca' },
];
YABANCI_DILLER.forEach(({ bolumler, dilAdi, taban }) => {
  (bolumler || []).forEach((bolum) => {
    kaynakEkle(bolum.veri, (s) => ({ etiket: s.ad, altEtiket: s.sembol, hucreler: s.hucreler }),
      // Başlık dile göre (İngilizce/Almanca/Fransızca); kategori ders adı.
      { modulBaslik: 'Modül 9', modulKonu: dilAdi, kategori: bolum.kisaBaslik, yol: `${taban}/${bolum.slug}` });
  });
});

/** Tüm aranabilir braille sembollerinin düz listesi. */
export const ARAMA_INDEKSI = _indeks;

// ── Arama ──────────────────────────────────────────────────────────────────────

/**
 * Girdiyi boşluğa göre hücre anahtarları dizisine çevirir.
 * "123 145" → ["123","145"]; "123" → ["123"]. Boş parçalar atılır.
 */
export function sorguHucreleri(girdi) {
  return String(girdi || '')
    .split(/\s+/)
    .map((parca) => sorguyuNormalle(parca))
    .filter(Boolean);
}

/** i. hücre aranamaz (keyfî) mı? */
function aranamazMi(giris, i) {
  return giris.aranamaz ? giris.aranamaz.has(i) : false;
}

/** q'ya eşit İLK ARANABİLİR hücrenin indeksi (keyfî hücreler atlanır); yoksa -1. */
function ilkAranabilirIndeks(giris, q) {
  const a = giris.anahtarlar;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] === q && !aranamazMi(giris, i)) return i;
  }
  return -1;
}

/**
 * needle'ı bitişik alt-dizi olarak arar; pencere EN AZ bir aranabilir hücre içermeli
 * (tamamı keyfî pencere — ör. yalnız nokta adları — geçersiz). Başlangıç indeksi / -1.
 */
function aranabilirPencere(giris, needle) {
  const hay = giris.anahtarlar;
  if (needle.length === 0 || needle.length > hay.length) return -1;
  for (let i = 0; i + needle.length <= hay.length; i += 1) {
    let eslesti = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (hay[i + j] !== needle[j]) { eslesti = false; break; }
    }
    if (!eslesti) continue;
    let aranabilirVar = false;
    for (let j = 0; j < needle.length; j += 1) {
      if (!aranamazMi(giris, i + j)) { aranabilirVar = true; break; }
    }
    if (aranabilirVar) return i;
  }
  return -1;
}

/**
 * Eşleşen sembolleri döndürür.
 * - Tek hücre ("123"): aranabilir hücrelerinden BİRİ eşleşen semboller.
 * - Çok hücre ("123 145"): hücre dizisini BİTİŞİK içeren ve en az bir aranabilir
 *   hücresi eşleşen semboller.
 * Keyfî (aranamaz) hücreler eşleşmeye sayılmaz: ifade/tarih/rumuzdaki sayı-harfler,
 * geometrideki nokta adları. Anlamlı hücreler (işaret/ayraç/şekil sembolü) eşleşir.
 * Her sonuçta `eslesenIndeksler` (vurgulanacak hücre indeksleri) döner.
 */
export function aramaYap(girdi) {
  const qHucreler = sorguHucreleri(girdi);
  if (qHucreler.length === 0) return [];
  const sonuclar = [];

  if (qHucreler.length === 1) {
    const q = qHucreler[0];
    for (const giris of ARAMA_INDEKSI) {
      const idx = ilkAranabilirIndeks(giris, q);
      if (idx !== -1) sonuclar.push({ ...giris, eslesenIndeksler: [idx] });
    }
    return sonuclar;
  }

  for (const giris of ARAMA_INDEKSI) {
    const bas = aranabilirPencere(giris, qHucreler);
    if (bas !== -1) {
      const eslesenIndeksler = qHucreler.map((_, k) => bas + k);
      sonuclar.push({ ...giris, eslesenIndeksler });
    }
  }
  return sonuclar;
}

// ── Sözlük (metin) araması ───────────────────────────────────────────────────

function metinNormalle(s) {
  return String(s || '').toLocaleLowerCase('tr');
}
const KELIME_AYIRAC = /[^\p{L}\p{N}]+/u;

/**
 * Metin araması: sembolün adı (`etiket`) ve anlamı/karşılığı (`altEtiket`) içinde arar.
 * - "a" (tek harf) → yalnız etiketi tam "a" olanlar (A harfi, A kısaltması).
 * - "aynı" → kelimesi/anlamı "aynı" olan (A bir-harfli kısaltması).
 * - "çarpma" → adı "çarpma" olan (çarpma işareti). 3+ harfte önek/alt-dizi de eşleşir.
 * Sonuçlar `eslesenIndeksler: []` (hücre vurgusu yok — eşleşme metinsel).
 */
export function sozlukAra(girdi) {
  const q = metinNormalle(girdi).trim();
  if (!q) return [];
  // Sembol sorgusu (harf/rakam dışı karakter içerir, ör. ">", "+", "?", "="): sembolün
  // KENDİSİ "yazılış" olarak etiket+altEtiket'te ham alt-dizi aranır. Normal kelime yolu
  // bunları bulamaz çünkü (a) tek karakterli sorgu uzunluk eşiklerine (>=2/>=3) takılır,
  // (b) KELIME_AYIRAC sembol karakterlerini söküp atar. Sembolün adı yine altEtiket'te.
  const sembolSorgu = /[^\p{L}\p{N}\s]/u.test(q);
  const sonuclar = [];
  for (const giris of ARAMA_INDEKSI) {
    const etiket = metinNormalle(giris.etiket);
    let eslesti = etiket === q || (giris.esler && giris.esler.includes(q));
    if (!eslesti && sembolSorgu) {
      // Sembol "yazılış" olarak altEtiket'te tutulur (math/noktalama/müzik: altEtiket = s.sembol).
      // Yalnız altEtiket'te ara: kök kısaltma etiketinin gösterim amaçlı "+"si ("5+ba") veya
      // ifade etiketindeki "/" gibi notasyon getirilmesin. Sembol etiket'te tek karakterse
      // zaten yukarıdaki etiket === q ile bulunur.
      eslesti = metinNormalle(giris.altEtiket).includes(q);
    } else if (!eslesti && q.length >= 2) {
      const birlesik = metinNormalle(`${giris.etiket} ${giris.altEtiket} ${(giris.esler || []).join(' ')}`);
      const kelimeler = birlesik.split(KELIME_AYIRAC).filter(Boolean);
      // Önek (startsWith) eşleşmesi 2+ harfte: "au" → "auch/auf/aus" de gelsin (kısa sorgu,
      // uzun sorgunun üst kümesi olsun). Geniş alt-dizi (includes) eşleşmesi gürültüyü
      // önlemek için 3+ harfte kalır.
      eslesti = kelimeler.some((w) => w === q || w.startsWith(q))
        || (q.length >= 3 && birlesik.includes(q));
    }
    if (eslesti) sonuclar.push({ ...giris, eslesenIndeksler: [] });
  }
  return sonuclar;
}
