// Türkçe Braille alfabesi tablosu.
// Her harf, dolu olan nokta numaralarının dizisi olarak tanımlanır.
// Hücre numaralandırması (uluslararası standart):
//   1 • • 4
//   2 • • 5
//   3 • • 6

export const HARFLER = [
  { harf: 'A', noktalar: [1] },
  { harf: 'B', noktalar: [1, 2] },
  { harf: 'C', noktalar: [1, 4] },
  { harf: 'Ç', noktalar: [1, 6] },
  { harf: 'D', noktalar: [1, 4, 5] },
  { harf: 'E', noktalar: [1, 5] },
  { harf: 'F', noktalar: [1, 2, 4] },
  { harf: 'G', noktalar: [1, 2, 4, 5] },
  { harf: 'Ğ', noktalar: [1, 2, 6] },
  { harf: 'H', noktalar: [1, 2, 5] },
  { harf: 'I', noktalar: [3, 5] },
  { harf: 'İ', noktalar: [2, 4] },
  { harf: 'J', noktalar: [2, 4, 5] },
  { harf: 'K', noktalar: [1, 3] },
  { harf: 'L', noktalar: [1, 2, 3] },
  { harf: 'M', noktalar: [1, 3, 4] },
  { harf: 'N', noktalar: [1, 3, 4, 5] },
  { harf: 'O', noktalar: [1, 3, 5] },
  { harf: 'Ö', noktalar: [2, 4, 6] },
  { harf: 'P', noktalar: [1, 2, 3, 4] },
  { harf: 'R', noktalar: [1, 2, 3, 5] },
  { harf: 'S', noktalar: [2, 3, 4] },
  { harf: 'Ş', noktalar: [1, 4, 6] },
  { harf: 'T', noktalar: [2, 3, 4, 5] },
  { harf: 'U', noktalar: [1, 3, 6] },
  { harf: 'Ü', noktalar: [1, 2, 5, 6] },
  { harf: 'V', noktalar: [1, 2, 3, 6] },
  { harf: 'Y', noktalar: [1, 3, 4, 5, 6] },
  { harf: 'Z', noktalar: [1, 3, 5, 6] }
];

// Rakamlar: Önce sayı işareti (3,4,5,6) gelir; sonra A-J şablonu.
// Eğitim amacıyla burada sadece rakam karakterinin (sayı işareti olmadan)
// karşılığı olan harf desenini gösteriyoruz.
export const RAKAMLAR = [
  { rakam: '1', noktalar: [1] },
  { rakam: '2', noktalar: [1, 2] },
  { rakam: '3', noktalar: [1, 4] },
  { rakam: '4', noktalar: [1, 4, 5] },
  { rakam: '5', noktalar: [1, 5] },
  { rakam: '6', noktalar: [1, 2, 4] },
  { rakam: '7', noktalar: [1, 2, 4, 5] },
  { rakam: '8', noktalar: [1, 2, 5] },
  { rakam: '9', noktalar: [2, 4] },
  { rakam: '0', noktalar: [2, 4, 5] }
];

export const NOKTALAMA = [
  { isaret: ',', isim: 'virgül', noktalar: [2] },
  { isaret: ';', isim: 'noktalı virgül', noktalar: [2, 3] },
  { isaret: ':', isim: 'iki nokta', noktalar: [2, 5] },
  { isaret: '.', isim: 'nokta', noktalar: [2, 5, 6] },
  { isaret: '?', isim: 'soru işareti', noktalar: [2, 6] },
  { isaret: '!', isim: 'ünlem işareti', noktalar: [2, 3, 5] },
  { isaret: '-', isim: 'tire', noktalar: [3, 6] },
  { isaret: "'", isim: 'kesme işareti', noktalar: [3] }
];

// Türkçe Braille'de kullanılan bazı yaygın kısaltmalar (örnek seti).
export const KISALTMALAR = [
  { kisaltma: 'TC', acilim: 'Türkiye Cumhuriyeti' },
  { kisaltma: 'TBMM', acilim: 'Türkiye Büyük Millet Meclisi' },
  { kisaltma: 'vb.', acilim: 've benzeri' },
  { kisaltma: 'vs.', acilim: 've saire' },
  { kisaltma: 'Sf.', acilim: 'sayfa' },
  { kisaltma: 'Bkz.', acilim: 'bakınız' },
  { kisaltma: 'Dr.', acilim: 'Doktor' },
  { kisaltma: 'Prof.', acilim: 'Profesör' }
];

// MEB Görme Engelliler için Türkçe Braille Yazı Kılavuzu (2014) –
// "Bir Harfli Kısaltmalar" tablosu (sayfa 248–249).
// Her kayıt: harf (alfabe karşılığı), kelime (tam okunuşu), noktalar.
// Not: "o" harfi tek başına kelime niteliği taşıdığı için kısaltma yoktur.
export const KELIME_KISALTMALARI = [
  { harf: 'A', kelime: 'aynı',     noktalar: [1] },
  { harf: 'B', kelime: 'büyük',    noktalar: [1, 2] },
  { harf: 'C', kelime: 'can',      noktalar: [1, 4] },
  { harf: 'Ç', kelime: 'çok',      noktalar: [1, 6] },
  { harf: 'D', kelime: 'daha',     noktalar: [1, 4, 5] },
  { harf: 'E', kelime: 'ekonomi',  noktalar: [1, 5] },
  { harf: 'F', kelime: 'fakat',    noktalar: [1, 2, 4] },
  { harf: 'G', kelime: 'göre',     noktalar: [1, 2, 4, 5] },
  { harf: 'Ğ', kelime: 'eğer',     noktalar: [1, 2, 6] },
  { harf: 'H', kelime: 'her',      noktalar: [1, 2, 5] },
  { harf: 'I', kelime: 'kısa',     noktalar: [3, 5] },
  { harf: 'İ', kelime: 'için',     noktalar: [2, 4] },
  { harf: 'J', kelime: 'gün',      noktalar: [2, 4, 5] },
  { harf: 'K', kelime: 'kadar',    noktalar: [1, 3] },
  { harf: 'L', kelime: 'ilgi',     noktalar: [1, 2, 3] },
  { harf: 'M', kelime: 'meydan',   noktalar: [1, 3, 4] },
  { harf: 'N', kelime: 'neden',    noktalar: [1, 3, 4, 5] },
  { harf: 'Ö', kelime: 'öyle',     noktalar: [2, 4, 6] },
  { harf: 'P', kelime: 'para',     noktalar: [1, 2, 3, 4] },
  { harf: 'R', kelime: 'artık',    noktalar: [1, 2, 3, 5] },
  { harf: 'S', kelime: 'sonra',    noktalar: [2, 3, 4] },
  { harf: 'Ş', kelime: 'şey',      noktalar: [1, 4, 6] },
  { harf: 'T', kelime: 'taraf',    noktalar: [2, 3, 4, 5] },
  { harf: 'U', kelime: 'uygun',    noktalar: [1, 3, 6] },
  { harf: 'Ü', kelime: 'dünya',    noktalar: [1, 2, 5, 6] },
  { harf: 'V', kelime: 'var',      noktalar: [1, 2, 3, 6] },
  { harf: 'Y', kelime: 'yok',      noktalar: [1, 3, 4, 5, 6] },
  { harf: 'Z', kelime: 'zaman',    noktalar: [1, 3, 5, 6] }
];

// MEB kılavuzu – "İki Harfli Kısaltmalar" (sayfa 250–252).
// Her kayıt: harf çifti (kısaltma yazısı), kelime, sol hücre noktaları,
// sağ hücre noktaları (iki ayrı braille hücresi).
export const IKI_HARFLI_KISALTMALAR = [
  { harf: 'bd', kelime: 'beden',      sol: [1, 2], sag: [1, 4, 5] },
  { harf: 'bğ', kelime: 'bağımsız',   sol: [1, 2], sag: [1, 2, 6] },
  { harf: 'bl', kelime: 'bilgi',      sol: [1, 2], sag: [1, 2, 3] },
  { harf: 'bn', kelime: 'bundan',     sol: [1, 2], sag: [1, 3, 4, 5] },
  { harf: 'br', kelime: 'beraber',    sol: [1, 2], sag: [1, 2, 3, 5] },
  { harf: 'bs', kelime: 'basit',      sol: [1, 2], sag: [2, 3, 4] },
  { harf: 'bş', kelime: 'başka',      sol: [1, 2], sag: [1, 4, 6] },
  { harf: 'bt', kelime: 'bütün',      sol: [1, 2], sag: [2, 3, 4, 5] },
  { harf: 'by', kelime: 'böyle',      sol: [1, 2], sag: [1, 3, 4, 5, 6] },
  { harf: 'bz', kelime: 'bazı',       sol: [1, 2], sag: [1, 3, 5, 6] },
  { harf: 'cm', kelime: 'cumhuriyet', sol: [1, 4], sag: [1, 3, 4] },
  { harf: 'cs', kelime: 'cisim',      sol: [1, 4], sag: [2, 3, 4] },
  { harf: 'cv', kelime: 'cevap',      sol: [1, 4], sag: [1, 2, 3, 6] },
  { harf: 'çc', kelime: 'çocuk',      sol: [1, 6], sag: [1, 4] },
  { harf: 'çğ', kelime: 'çoğu',       sol: [1, 6], sag: [1, 2, 6] },
  { harf: 'çl', kelime: 'çalışkan',   sol: [1, 6], sag: [1, 2, 3] },
  { harf: 'çn', kelime: 'çünkü',      sol: [1, 6], sag: [1, 3, 4, 5] },
  { harf: 'çş', kelime: 'çeşit',      sol: [1, 6], sag: [1, 4, 6] },
  { harf: 'çv', kelime: 'çevre',      sol: [1, 6], sag: [1, 2, 3, 6] },
  { harf: 'dğ', kelime: 'değil',      sol: [1, 4, 5], sag: [1, 2, 6] },
  { harf: 'dl', kelime: 'dolayı',     sol: [1, 4, 5], sag: [1, 2, 3] },
  { harf: 'dm', kelime: 'demek',      sol: [1, 4, 5], sag: [1, 3, 4] },
  { harf: 'dn', kelime: 'deney',      sol: [1, 4, 5], sag: [1, 3, 4, 5] },
  { harf: 'dv', kelime: 'devlet',     sol: [1, 4, 5], sag: [1, 2, 3, 6] },
  { harf: 'fz', kelime: 'fazla',      sol: [1, 2, 4], sag: [1, 3, 5, 6] },
  { harf: 'gb', kelime: 'gibi',       sol: [1, 2, 4, 5], sag: [1, 2] },
  { harf: 'gc', kelime: 'gece',       sol: [1, 2, 4, 5], sag: [1, 4] },
  { harf: 'gn', kelime: 'genel',      sol: [1, 2, 4, 5], sag: [1, 3, 4, 5] },
  { harf: 'gz', kelime: 'güzel',      sol: [1, 2, 4, 5], sag: [1, 3, 5, 6] },
  { harf: 'hb', kelime: 'haber',      sol: [1, 2, 5], sag: [1, 2] },
  { harf: 'hç', kelime: 'hiç',        sol: [1, 2, 5], sag: [1, 6] },
  { harf: 'hl', kelime: 'halk',       sol: [1, 2, 5], sag: [1, 2, 3] },
  { harf: 'hm', kelime: 'hemen',      sol: [1, 2, 5], sag: [1, 3, 4] },
  { harf: 'hn', kelime: 'hangi',      sol: [1, 2, 5], sag: [1, 3, 4, 5] },
  { harf: 'hp', kelime: 'hepsi',      sol: [1, 2, 5], sag: [1, 2, 3, 4] },
  { harf: 'hy', kelime: 'hayat',      sol: [1, 2, 5], sag: [1, 3, 4, 5, 6] },
  { harf: 'hz', kelime: 'hazır',      sol: [1, 2, 5], sag: [1, 3, 5, 6] },
  { harf: 'kb', kelime: 'kabul',      sol: [1, 3], sag: [1, 2] },
  { harf: 'kç', kelime: 'küçük',      sol: [1, 3], sag: [1, 6] },
  { harf: 'kd', kelime: 'kadın',      sol: [1, 3], sag: [1, 4, 5] },
  { harf: 'kh', kelime: 'kahraman',   sol: [1, 3], sag: [1, 2, 5] },
  { harf: 'kl', kelime: 'kolay',      sol: [1, 3], sag: [1, 2, 3] },
  { harf: 'kn', kelime: 'kendi',      sol: [1, 3], sag: [1, 3, 4, 5] },
  { harf: 'ks', kelime: 'kısım',      sol: [1, 3], sag: [2, 3, 4] },
  { harf: 'kt', kelime: 'kitap',      sol: [1, 3], sag: [2, 3, 4, 5] },
  { harf: 'kv', kelime: 'kuvvet',     sol: [1, 3], sag: [1, 2, 3, 6] },
  { harf: 'kz', kelime: 'kuzey',      sol: [1, 3], sag: [1, 3, 5, 6] },
  { harf: 'lz', kelime: 'lazım',      sol: [1, 2, 3], sag: [1, 3, 5, 6] },
  { harf: 'md', kelime: 'madde',      sol: [1, 3, 4], sag: [1, 4, 5] },
  { harf: 'ml', kelime: 'millet',     sol: [1, 3, 4], sag: [1, 2, 3] },
  { harf: 'mm', kelime: 'memleket',   sol: [1, 3, 4], sag: [1, 3, 4] },
  { harf: 'nc', kelime: 'ancak',      sol: [1, 3, 4, 5], sag: [1, 4] },
  { harf: 'nç', kelime: 'niçin',      sol: [1, 3, 4, 5], sag: [1, 6] },
  { harf: 'nd', kelime: 'anadolu',    sol: [1, 3, 4, 5], sag: [1, 4, 5] },
  { harf: 'nh', kelime: 'nehir',      sol: [1, 3, 4, 5], sag: [1, 2, 5] },
  { harf: 'nn', kelime: 'anne',       sol: [1, 3, 4, 5], sag: [1, 3, 4, 5] },
  { harf: 'ns', kelime: 'insan',      sol: [1, 3, 4, 5], sag: [2, 3, 4] },
  { harf: 'rk', kelime: 'arka',       sol: [1, 2, 3, 5], sag: [1, 3] },
  { harf: 'rn', kelime: 'örneğin',    sol: [1, 2, 3, 5], sag: [1, 3, 4, 5] },
  { harf: 'rs', kelime: 'arası',      sol: [1, 2, 3, 5], sag: [2, 3, 4] },
  { harf: 'rt', kelime: 'orta',       sol: [1, 2, 3, 5], sag: [2, 3, 4, 5] },
  { harf: 'sb', kelime: 'sebep',      sol: [2, 3, 4], sag: [1, 2] },
  { harf: 'sc', kelime: 'sıcak',      sol: [2, 3, 4], sag: [1, 4] },
  { harf: 'sğ', kelime: 'soğuk',      sol: [2, 3, 4], sag: [1, 2, 6] },
  { harf: 'sk', kelime: 'eski',       sol: [2, 3, 4], sag: [1, 3] },
  { harf: 'sm', kelime: 'osmanlı',    sol: [2, 3, 4], sag: [1, 3, 4] },
  { harf: 'sr', kelime: 'soru',       sol: [2, 3, 4], sag: [1, 2, 3, 5] },
  { harf: 'sv', kelime: 'savaş',      sol: [2, 3, 4], sag: [1, 2, 3, 6] },
  { harf: 'şğ', kelime: 'aşağı',      sol: [1, 4, 6], sag: [1, 2, 6] },
  { harf: 'şh', kelime: 'şehir',      sol: [1, 4, 6], sag: [1, 2, 5] },
  { harf: 'şk', kelime: 'şekil',      sol: [1, 4, 6], sag: [1, 3] },
  { harf: 'şm', kelime: 'şimdi',      sol: [1, 4, 6], sag: [1, 3, 4] },
  { harf: 'şt', kelime: 'işte',       sol: [1, 4, 6], sag: [2, 3, 4, 5] },
  { harf: 'şy', kelime: 'şöyle',      sol: [1, 4, 6], sag: [1, 3, 4, 5, 6] },
  { harf: 'tb', kelime: 'tabiat',     sol: [2, 3, 4, 5], sag: [1, 2] },
  { harf: 'tp', kelime: 'toprak',     sol: [2, 3, 4, 5], sag: [1, 2, 3, 4] },
  { harf: 'vt', kelime: 'vatan',      sol: [1, 2, 3, 6], sag: [2, 3, 4, 5] },
  { harf: 'yd', kelime: 'aydın',      sol: [1, 3, 4, 5, 6], sag: [1, 4, 5] },
  { harf: 'yk', kelime: 'yukarı',     sol: [1, 3, 4, 5, 6], sag: [1, 3] },
  { harf: 'yl', kelime: 'yalnız',     sol: [1, 3, 4, 5, 6], sag: [1, 2, 3] },
  { harf: 'yn', kelime: 'yeni',       sol: [1, 3, 4, 5, 6], sag: [1, 3, 4, 5] },
  { harf: 'yr', kelime: 'yarar',      sol: [1, 3, 4, 5, 6], sag: [1, 2, 3, 5] },
  { harf: 'yv', kelime: 'yavaş',      sol: [1, 3, 4, 5, 6], sag: [1, 2, 3, 6] },
  { harf: 'yz', kelime: 'yüzyıl',     sol: [1, 3, 4, 5, 6], sag: [1, 3, 5, 6] },
  { harf: 'zl', kelime: 'özel',       sol: [1, 3, 5, 6], sag: [1, 2, 3] },
  { harf: 'zn', kelime: 'uzun',       sol: [1, 3, 5, 6], sag: [1, 3, 4, 5] },
  { harf: 'zr', kelime: 'üzere',      sol: [1, 3, 5, 6], sag: [1, 2, 3, 5] }
];

// MEB kılavuzu – "Hece Kısaltmaları" (sayfa 253).
// Her kayıt: hece (yazılışı) ve tek bir braille hücresinde noktalar.
export const HECE_KISALTMALARI = [
  { hece: 'ba',  noktalar: [2, 3, 5] },
  { hece: 'be',  noktalar: [3, 5, 6] },
  { hece: 'bir', noktalar: [2, 3, 4, 6] },
  { hece: 'bu',  noktalar: [2, 3] },
  { hece: 'da',  noktalar: [1, 4, 5, 6] },
  { hece: 'de',  noktalar: [2, 4, 5, 6] },
  { hece: 'di',  noktalar: [1, 2, 3, 4, 6] },
  { hece: 'ha',  noktalar: [2, 5] },
  { hece: 'ka',  noktalar: [2, 5, 6] },
  { hece: 'ki',  noktalar: [3, 4, 5, 6] },
  { hece: 'la',  noktalar: [1, 2, 3, 4, 5, 6] },
  { hece: 'le',  noktalar: [3, 4, 6] },
  { hece: 'ma',  noktalar: [3, 4] },
  { hece: 'na',  noktalar: [1, 3, 4, 6] },
  { hece: 'ne',  noktalar: [1, 2, 3, 4, 5] },
  { hece: 'sa',  noktalar: [1, 5, 6] },
  { hece: 'se',  noktalar: [3, 4, 5] },
  { hece: 'ta',  noktalar: [2, 3, 4, 5, 6] },
  { hece: 'te',  noktalar: [1, 2, 4, 5, 6] },
  { hece: 've',  noktalar: [2, 6] },
  { hece: 'ya',  noktalar: [1, 2, 4, 6] },
  { hece: 'ye',  noktalar: [1, 2, 3, 5, 6] }
];

// MEB kılavuzu – "Kelime Kökü Kısaltmaları" (sayfa 259–260).
// Her kayıt iki braille hücresinden oluşur:
//   1) Kök işareti: yalnız 5. nokta            -> sol: [5]
//   2) Sembol harfi (alfabe veya hece kısaltması) -> sag: noktalar
// "etiket" alanı ekrandaki başlık (örn. "5d" veya "5+ba"),
// "kelime" PDF'teki "İfade Ettiği Ekler" sütununun karşılığıdır
// (kök kelime / fiil tabanı).
export const KELIME_KOKU_KISALTMALARI = [
  { etiket: '5b', kelime: 'bil',          sag: [1, 2] },
  { etiket: '5c', kelime: 'incele',       sag: [1, 4] },
  { etiket: '5ç', kelime: 'çalış',        sag: [1, 6] },
  { etiket: '5d', kelime: 'dur',          sag: [1, 4, 5] },
  { etiket: '5e', kelime: 'eğit',         sag: [1, 5] },
  { etiket: '5f', kelime: 'faydalan',     sag: [1, 2, 4] },
  { etiket: '5g', kelime: 'gel',          sag: [1, 2, 4, 5] },
  { etiket: '5ğ', kelime: 'öğren',        sag: [1, 2, 6] },
  { etiket: '5h', kelime: 'harca',        sag: [1, 2, 5] },
  { etiket: '5ı', kelime: 'kır',          sag: [3, 5] },
  { etiket: '5i', kelime: 'iste',         sag: [2, 4] },
  { etiket: '5k', kelime: 'kullan',       sag: [1, 3] },
  { etiket: '5l', kelime: 'alış',         sag: [1, 2, 3] },
  { etiket: '5m', kelime: 'tamamla',      sag: [1, 3, 4] },
  { etiket: '5n', kelime: 'anla',         sag: [1, 3, 4, 5] },
  { etiket: '5o', kelime: 'sor',          sag: [1, 3, 5] },
  { etiket: '5ö', kelime: 'gör',          sag: [2, 4, 6] },
  { etiket: '5p', kelime: 'topla',        sag: [1, 2, 3, 4] },
  { etiket: '5r', kelime: 'bırak',        sag: [1, 2, 3, 5] },
  { etiket: '5s', kelime: 'söyle',        sag: [2, 3, 4] },
  { etiket: '5ş', kelime: 'başla',        sag: [1, 4, 6] },
  { etiket: '5t', kelime: 'tut',          sag: [2, 3, 4, 5] },
  { etiket: '5u', kelime: 'uğra',         sag: [1, 3, 6] },
  { etiket: '5ü', kelime: 'yürü',         sag: [1, 2, 5, 6] },
  { etiket: '5v', kelime: 'vur',          sag: [1, 2, 3, 6] },
  { etiket: '5y', kelime: 'yetiş',        sag: [1, 3, 4, 5, 6] },
  { etiket: '5z', kelime: 'gözle',        sag: [1, 3, 5, 6] },
  // Hece kısaltması sembolleriyle yapılan kelime kökü kısaltmaları
  { etiket: '5+ba', kelime: 'bulun',      sag: [2, 3, 5] },
  { etiket: '5+be', kelime: 'bekle',      sag: [3, 5, 6] },
  { etiket: '5+bir', kelime: 'koş',       sag: [2, 3, 4, 6] },
  { etiket: '5+da', kelime: 'yüksel',     sag: [1, 4, 5, 6] },
  { etiket: '5+de', kelime: 'geç',        sag: [2, 4, 5, 6] },
  { etiket: '5+di', kelime: 'düşün',      sag: [1, 2, 3, 4, 6] },
  { etiket: '5+ka', kelime: 'kalk',       sag: [2, 5, 6] },
  { etiket: '5+ki', kelime: 'koy',        sag: [3, 4, 5, 6] },
  { etiket: '5+la', kelime: 'konuş',      sag: [1, 2, 3, 4, 5, 6] },
  { etiket: '5+le', kelime: 'öğret',      sag: [3, 4, 6] },
  { etiket: '5+ma', kelime: 'oyna',       sag: [3, 4] },
  { etiket: '5+na', kelime: 'oku',        sag: [1, 3, 4, 6] },
  { etiket: '5+ne', kelime: 'göster',     sag: [1, 2, 3, 4, 5] },
  { etiket: '5+sa', kelime: 'yerleş',     sag: [1, 5, 6] },
  { etiket: '5+se', kelime: 'yara',       sag: [3, 4, 5] },
  { etiket: '5+ta', kelime: 'getir',      sag: [2, 3, 4, 5, 6] },
  { etiket: '5+te', kelime: 'götür',      sag: [1, 2, 4, 5, 6] },
  { etiket: '5+ya', kelime: 'yaşa',       sag: [1, 2, 4, 6] },
  { etiket: '5+ye', kelime: 'büyü',       sag: [1, 2, 3, 5, 6] }
];

// MEB kılavuzu – "Kelime Parçası Kısaltmaları" (sayfa 262).
// İki braille hücresi:
//   1) Önek: 4-5 noktaları VEYA 5-6 noktaları   -> sol
//   2) Sembol harfi/hecesi                       -> sag
// "ekler" alanı PDF'in "İfade Ettiği Ekler" sütununun karşılığıdır.
export const KELIME_PARCASI_KISALTMALARI = [
  { etiket: '4,5+c', sol: [4, 5], sag: [1, 4],         ekler: 'ınca, ince, unca, ünce' },
  { etiket: '5,6+c', sol: [5, 6], sag: [1, 4],         ekler: 'ıncı, inci, uncu, üncü' },
  { etiket: '4,5+ç', sol: [4, 5], sag: [1, 6],         ekler: 'tıkça, tikçe, tukça, tükçe' },
  { etiket: '5,6+ç', sol: [5, 6], sag: [1, 6],         ekler: 'dıkça, dikçe, dukça, dükçe' },
  { etiket: '4,5+d', sol: [4, 5], sag: [1, 4, 5],      ekler: 'tıkları, tikleri, tukları, tükleri' },
  { etiket: '5,6+d', sol: [5, 6], sag: [1, 4, 5],      ekler: 'dıkları, dikleri, dukları, dükleri' },
  { etiket: '4,5+e', sol: [4, 5], sag: [1, 5],         ekler: 'lara, lere' },
  { etiket: '5,6+e', sol: [5, 6], sag: [1, 5],         ekler: 'ları, leri' },
  { etiket: '4,5+g', sol: [4, 5], sag: [1, 2, 4, 5],   ekler: 'gan, gen' },
  { etiket: '5,6+g', sol: [5, 6], sag: [1, 2, 4, 5],   ekler: 'gın, gin, gun, gün' },
  { etiket: '4,5+ğ', sol: [4, 5], sag: [1, 2, 6],      ekler: 'mayı, meyi' },
  { etiket: '5,6+ğ', sol: [5, 6], sag: [1, 2, 6],      ekler: 'mağa, meğe' },
  { etiket: '4,5+i', sol: [4, 5], sag: [2, 4],         ekler: 'tığı, tiği, tuğu, tüğü' },
  { etiket: '5,6+i', sol: [5, 6], sag: [2, 4],         ekler: 'dığı, diği, duğu, düğü' },
  { etiket: '4,5+j', sol: [4, 5], sag: [2, 4, 5],      ekler: 'tır, tir, tur, tür' },
  { etiket: '5,6+j', sol: [5, 6], sag: [2, 4, 5],      ekler: 'dır, dir, dur, dür' },
  { etiket: '5,6+k', sol: [5, 6], sag: [1, 3],         ekler: 'ken' },
  { etiket: '4,5+l', sol: [4, 5], sag: [1, 2, 3],      ekler: 'luk, lük' },
  { etiket: '5,6+l', sol: [5, 6], sag: [1, 2, 3],      ekler: 'lık, lik' },
  { etiket: '5,6+m', sol: [5, 6], sag: [1, 3, 4],      ekler: 'madan, meden' },
  { etiket: '4,5+n', sol: [4, 5], sag: [1, 3, 4, 5],   ekler: 'nun, nün' },
  { etiket: '5,6+n', sol: [5, 6], sag: [1, 3, 4, 5],   ekler: 'nın, nin' },
  { etiket: '5,6+o', sol: [5, 6], sag: [1, 3, 5],      ekler: 'yor' },
  { etiket: '5,6+r', sol: [5, 6], sag: [1, 2, 3, 5],   ekler: 'arak, erek' },
  { etiket: '5,6+s', sol: [5, 6], sag: [2, 3, 4],      ekler: 'ması, mesi' },
  { etiket: '4,5+ş', sol: [4, 5], sag: [1, 4, 6],      ekler: 'muş, müş' },
  { etiket: '5,6+ş', sol: [5, 6], sag: [1, 4, 6],      ekler: 'mış, miş' },
  { etiket: '4,5+t', sol: [4, 5], sag: [2, 3, 4, 5],   ekler: 'tıktan, tikten, tuktan, tükten' },
  { etiket: '5,6+t', sol: [5, 6], sag: [2, 3, 4, 5],   ekler: 'dıktan, dikten, duktan, dükten' },
  { etiket: '5,6+y', sol: [5, 6], sag: [1, 3, 4, 5, 6], ekler: 'ıyla, iyle, uyla, üyle' },
  { etiket: '4,5+z', sol: [4, 5], sag: [1, 3, 5, 6],   ekler: 'suz, süz' },
  { etiket: '5,6+z', sol: [5, 6], sag: [1, 3, 5, 6],   ekler: 'sız, siz' },
  // Hece kısaltması sembolleriyle yapılan kelime parçası kısaltmaları
  { etiket: '4,5+bir', sol: [4, 5], sag: [2, 3, 4, 6],     ekler: 'sun, sün' },
  { etiket: '5,6+bir', sol: [5, 6], sag: [2, 3, 4, 6],     ekler: 'sın, sin' },
  { etiket: '4,5+ne',  sol: [4, 5], sag: [1, 2, 3, 4, 5],  ekler: 'lığa, liğe, luğa, lüğe' },
  { etiket: '5,6+ne',  sol: [5, 6], sag: [1, 2, 3, 4, 5],  ekler: 'lığı, liği, luğu, lüğü' },
  { etiket: '5,6+ma',  sol: [5, 6], sag: [3, 4],           ekler: 'malı, meli' },
  { etiket: '4,5+te',  sol: [4, 5], sag: [1, 2, 4, 5, 6],  ekler: 'cak, cek' },
  { etiket: '5,6+te',  sol: [5, 6], sag: [1, 2, 4, 5, 6],  ekler: 'cağı, ceği' }
];

// =============================================================================
// MEB Türkçe Braille Yazı Kılavuzu (2014) – VI.2 Noktalama İşaretleri
// =============================================================================
// Her noktalama işareti, sembolün braille hücrelerini (`hucreler`), kullanıldığı
// yerleri özetleyen kuralları (`kurallar`) ve örnek cümleleri (`ornekler`) içerir.
export const NOKTALAMA_ISARETLERI = [
  {
    ad: 'Nokta',
    sembol: '.',
    hucreler: [[2, 5, 6]],
    aciklama: '2., 5. ve 6. noktalardan oluşur.',
    kurallar: [
      'Cümlenin sonuna konur.',
      'Bazı kısaltmaların sonuna konur (Alb., Dr., İng.).',
      'Madde başlarındaki rakam ve harflerden sonra konur.',
      'Saat ve dakikayı ayırmak için kullanılır (09.15).',
      'Kitap, dergi vb. künyelerin sonuna konur.',
      'Genel ağ adreslerinde kullanılır (tdk.org.tr).'
    ],
    ornekler: ['Ela al.', 'Tren 09.15’te kalktı.', 'http://tdk.org.tr']
  },
  {
    ad: 'Virgül',
    sembol: ',',
    hucreler: [[2]],
    aciklama: 'Yalnızca 2. noktadan oluşur.',
    kurallar: [
      'Sıralanan eş görevli kelimeler arasına konur.',
      'Sıralı cümleleri birbirinden ayırır.',
      'Cümle içindeki ara söz veya ara cümlelerin başına ve sonuna konur.',
      'Tırnak içinde olmayan aktarma cümlelerinden sonra konur.',
      'Konuşma çizgisinden önce konur.',
      'Hitap kelimelerinden sonra konur.',
      'Kesirli sayıların tam ile kesir kısmını ayırır (38,6).',
      'Özne olarak kullanılan “bu, şu, o” zamirlerinden sonra konur.'
    ],
    ornekler: [
      'Elma, armut, kiraz ve üzüm yedik.',
      'Umduk, bekledik, düşündük.',
      'Sevgili Kardeşim,'
    ]
  },
  {
    ad: 'Noktalı Virgül',
    sembol: ';',
    hucreler: [[2, 3]],
    aciklama: '2. ve 3. noktalardan oluşur.',
    kurallar: [
      'Virgüllerle ayrılmış tür veya takımları birbirinden ayırır.',
      'Ögeleri arasında virgül bulunan sıralı cümleleri birbirinden ayırır.',
      'İkiden fazla eş değer öge bulunan cümlelerde özneden sonra konabilir.'
    ],
    ornekler: [
      'Türkiye, İngiltere, Azerbaycan; Ankara, Londra, Bakü.',
      'At ölür, meydan kalır; yiğit ölür, şan kalır.'
    ]
  },
  {
    ad: 'İki Nokta',
    sembol: ':',
    hucreler: [[2, 5]],
    aciklama: '2. ve 5. noktalardan oluşur.',
    kurallar: [
      'Kendisinden sonra örnek verilecek cümlenin sonuna konur.',
      'Kendisinden sonra açıklama verilecek cümlenin sonuna konur.',
      'Karşılıklı konuşmalarda konuşan kişiyi belirten sözlerden sonra konur.',
      'Edebî eserlerde konuşma bölümünden önceki ifadenin sonuna konur.',
      'Ses bilgisinde uzun ünlüyü göstermek için kullanılır (a:ile).',
      'Genel ağ adreslerinde kullanılır.'
    ],
    ornekler: ['Ziraatçı sayar:', 'http://tdk.org.tr']
  },
  {
    ad: 'Üç Nokta',
    sembol: '…',
    hucreler: [[2, 5, 6], [2, 5, 6], [2, 5, 6]],
    aciklama: '2-5-6 noktaları üç defa yazılır.',
    kurallar: [
      'Tamamlanmamış cümlelerin sonuna konur.',
      'Açıklanmak istenmeyen kelime veya bölümlerin yerine konur.',
      'Alıntılarda alınmayan kısımların yerine konur.',
      'Sözün okuyucunun hayaline bırakıldığı yerlerde anlatımı güçlendirmek için konur.',
      'Karşılıklı konuşmalarda eksik bırakılan cevaplarda kullanılır.'
    ],
    ornekler: ['Sana uğurlar olsun... Ayrılıyor yolumuz!', '— Hangi Ali?', '— ...']
  },
  {
    ad: 'Soru İşareti',
    sembol: '?',
    hucreler: [[2, 3, 6]],
    aciklama: '2., 3. ve 6. noktalardan oluşur.',
    kurallar: [
      'Soru bildiren cümle veya sözlerin sonuna konur.',
      'Bilinmeyen, kesin olmayan veya şüpheli durumlar için kullanılır.',
      'Sıralı ve bağlı soru cümlelerinde yalnız en sona konur.'
    ],
    ornekler: ['Ece eve geldi mi?', 'Ela nereye gidiyorsun?', 'Yunus Emre (1240?-1320)']
  },
  {
    ad: 'Ünlem İşareti',
    sembol: '!',
    hucreler: [[2, 3, 5]],
    aciklama: '2., 3. ve 5. noktalardan oluşur.',
    kurallar: [
      'Sevinç, kıvanç, acı, korku, şaşma gibi duyguları anlatan cümlelerin sonuna konur.',
      'Seslenme, hitap ve uyarı sözlerinden sonra konur.',
      'Alay, kinaye veya küçümseme anlamı kazandırılmak istenen sözden sonra ayraç içinde kullanılır.'
    ],
    ornekler: ['Ne mutlu Türk’üm diyene!', 'Ordular! İlk hedefiniz Akdeniz’dir, ileri!']
  },
  {
    ad: 'Kısa Çizgi',
    sembol: '-',
    hucreler: [[3, 6]],
    aciklama: '3. ve 6. noktalardan oluşur.',
    kurallar: [
      'Satır sonuna sığmayan kelimeleri bölmek için kullanılır.',
      'Cümle içinde ara sözleri ayırmak için kullanılır.',
      'Kelimelerin kökleri, ekleri ve heceleri gösterilirken kullanılır.',
      'İki sayı, iki tarih ya da iki yer adı arasında kullanılır (1914-1918).',
      'Eski Türkçe ekleri yazılırken kullanılır.'
    ],
    ornekler: ['Türk-İngiliz ilişkileri', '1914-1918', 'sev-gi-li']
  },
  {
    ad: 'Uzun Çizgi',
    sembol: '—',
    hucreler: [[3, 6], [3, 6]],
    aciklama: '3-6 noktaları arka arkaya iki defa yazılır.',
    kurallar: [
      'Konuşma çizgisi olarak kullanılır.',
      'Tiyatro eserlerinde ve diyaloglarda konuşmaları gösterir.'
    ],
    ornekler: ['— Bu akşam Datça’ya gidiyoruz, dedi.']
  },
  {
    ad: 'Eğik Çizgi',
    sembol: '/',
    hucreler: [[3, 4]],
    aciklama: '3. ve 4. noktalardan oluşur.',
    kurallar: [
      'Şiirde mısraların yan yana yazılması gerektiğinde kullanılır.',
      'Adres yazılırken apartman ve daire numarasını ayırır.',
      'Tarihlerin gün, ay, yılını ayırmak için kullanılır.',
      'Birbirine alternatif olan ögeleri ayırmak için kullanılır.',
      'Genel ağ adreslerinde kullanılır.'
    ],
    ornekler: ['25/04/2026', 'Atatürk Bul. No: 12/4', 'http://tdk.org.tr']
  },
  {
    ad: 'Tırnak Açma',
    sembol: '“',
    hucreler: [[2, 3, 6]],
    aciklama: '2., 3. ve 6. noktalardan oluşur (soru işareti ile aynı semboldür; konumdan ayırt edilir).',
    kurallar: [
      'Başkasından alınan söz, cümle veya yazıların başına konur.',
      'Özel olarak vurgulanmak istenen sözlerin başına konur.',
      'Cümle içinde geçen kitap, gazete, dergi, yazı vb. başına konur.'
    ],
    ornekler: ['“Akıl yaşta değil baştadır.”']
  },
  {
    ad: 'Tırnak Kapama',
    sembol: '”',
    hucreler: [[3, 5, 6]],
    aciklama: '3., 5. ve 6. noktalardan oluşur.',
    kurallar: [
      'Tırnak açma ile başlayan alıntının sonuna konur.',
      'Tırnak içine alınan ifadenin bitimini gösterir.'
    ],
    ornekler: ['Yahya Kemal’in “Sessiz Gemi” şiirini okudum.']
  },
  {
    ad: 'Yay Ayraç (Parantez)',
    sembol: '( )',
    hucreler: [[2, 3, 5, 6]],
    aciklama: '2-3-5-6 noktalarından oluşur; aynı sembol hem açma hem kapama için kullanılır.',
    kurallar: [
      'Cümlenin yapısıyla doğrudan ilgili olmayan açıklamalar için kullanılır.',
      'Tiyatro eserlerinde durum ve hareketleri belirtmek için kullanılır.',
      'Bir söze alaylı bir anlam katmak veya kuşkulu bilgileri belirtmek için kullanılır.',
      'Bir bilginin kaynağının veya yazarın adının belirtilmesi için kullanılır.'
    ],
    ornekler: ['Anadolu kentlerini, köylerini (Köy demek değil, mezra demek) görmek lazım.']
  },
  {
    ad: 'Köşeli Parantez (Köşeli Ayraç)',
    sembol: '[ ]',
    hucreler: [[2, 3, 5, 6], [2, 3, 5, 6]],
    aciklama: '2-3-5-6 noktaları arka arkaya iki defa yazılır.',
    kurallar: [
      'Ayraç içinde ayraç kullanılması gereken yerlerde kullanılır.',
      'Bibliyografik künyelere ilişkin bazı ayrıntıları göstermek için kullanılır.'
    ],
    ornekler: ['Halikarnas Balıkçısı [Cevat Şakir Kabaağaçlı] 1890-1973']
  },
  {
    ad: 'Kesme (Apostrof)',
    sembol: '’',
    hucreler: [[3]],
    aciklama: 'Yalnızca 3. noktadan oluşur.',
    kurallar: [
      'Özel adlara getirilen iyelik, durum ve bildirme eklerinden ayırmak için konur.',
      'Kişi adlarından sonra gelen saygı sözlerine getirilen ekleri ayırmak için konur.',
      'Kısaltmalara getirilen ekleri ayırmak için konur.',
      'Sayılara getirilen ekleri ayırmak için konur.',
      'Bir ek veya harfin özellikle gösterilmesi gerektiğinde kullanılır.'
    ],
    ornekler: ['Ankara’ya', 'TDK’nin', '1985’te']
  }
];

// =============================================================================
// MEB Türkçe Braille Yazı Kılavuzu (2014) – VI.3 Diğer Hususlar (özel işaretler)
// =============================================================================
export const OZEL_ISARETLER = [
  {
    ad: 'Büyük Harf İşareti',
    sembol: '`',
    hucreler: [[6]],
    aciklama: 'Yalnız 6. noktadan oluşur. Hemen ardından gelen TEK harfi büyük yapar.',
    kurallar: [
      'Cümle başlarında (ilk harften önce) konur.',
      'Özel adların ilk harfinden önce konur.',
      'Tüm büyük harfle yazılması gereken kısaltmaların her harfinden önce konur (TBMM gibi haller hariç—bk. Hepsi Büyük Harf).'
    ],
    ornekler: ['`Ali', '`Ankara’ya', '`Türkçe']
  },
  {
    ad: 'Hepsi Büyük Harf İşareti',
    sembol: '``',
    hucreler: [[6], [6]],
    aciklama: '6. nokta arka arkaya iki kere yazılır. Sonraki kelimenin/kısaltmanın TÜM harflerini büyük yapar.',
    kurallar: [
      'Tamamı büyük harflerle yazılan kısaltmaların başına konur (``TBMM, ``TDK).',
      'Bir cümlenin tamamı büyük harflerle yazılacaksa cümlenin başına konur.',
      'Etkisi, sonraki boşluğa kadar sürer.'
    ],
    ornekler: ['``TBMM', '``DİKKAT!']
  },
  {
    ad: 'Tek Küçük Harf İşareti',
    sembol: 'p',
    hucreler: [[5, 6]],
    aciklama: '5. ve 6. noktalardan oluşur. Sonraki tek küçük harfin “harf” olduğunu belirtir (rakam-harf karışıklığını önler).',
    kurallar: [
      'Bir rakamın hemen ardından gelen tek küçük harften önce konur (rakam-harf karışmasın diye).',
      'Sadece bir harfi etkiler.'
    ],
    ornekler: ['12 p a sınıfı', '5 p b']
  },
  {
    ad: 'Tek Büyük Harf İşareti',
    sembol: 'p`',
    hucreler: [[5, 6], [6]],
    aciklama: 'Önce 5-6 (tek harf) sonra 6 (büyük harf) işareti yazılır. Sonraki tek harfin büyük harf olduğunu belirtir.',
    kurallar: [
      'Bir rakamın ardından gelen tek büyük harften önce konur.',
      'Sadece bir harfi etkiler.'
    ],
    ornekler: ['12 p`A sınıfı']
  },
  {
    ad: 'İtalik İşareti',
    sembol: 'h',
    hucreler: [[4, 6]],
    aciklama: '4. ve 6. noktalardan oluşur.',
    kurallar: [
      'Eserde italik (eğik) yazılmış kelime, cümle veya bölümleri göstermek için kullanılır.',
      'Tek kelime için kelimenin başına bir kez konur (Tek İtalik İşareti).',
      'Birden fazla kelime için bölümün başına iki kez, sonuna bir kez konur (Çift İtalik İşareti).'
    ],
    ornekler: ['hOtello', 'hh Sessiz Gemi h']
  },
  {
    ad: 'Yıldız İşareti',
    sembol: '*',
    hucreler: [[3, 5], [3, 5]],
    aciklama: '3-5 noktaları arka arkaya iki defa yazılır.',
    kurallar: [
      'Dipnotlara ve açıklamalara işaret etmek için kullanılır.',
      'Metin içinde yıldız işareti, açıklamanın bulunduğu yere de aynı şekilde konur.'
    ],
    ornekler: ['kelime*', '*Açıklama metni']
  },
  {
    ad: 'Şiir İşareti',
    sembol: '\\\\',
    hucreler: [[3, 4, 5], [3, 4, 5]],
    aciklama: '3-4-5 noktaları arka arkaya iki defa yazılır.',
    kurallar: [
      'Şiir bölümünün başına ve sonuna konur.',
      'Düz yazı içinde geçen şiir bölümlerini ayırt etmek için kullanılır.'
    ],
    ornekler: ['\\\\ Akşam, yine akşam, yine akşam \\\\']
  },
  {
    ad: 'Sayfa Numaralama',
    sembol: '—',
    hucreler: [],
    aciklama: 'Sayfa numarası, sayfanın son satırının sağ tarafına yazılır.',
    kurallar: [
      'Numara, satırın sonundan itibaren geriye doğru sayılarak yazılır.',
      'Sayfa numarası ile satırın son harfi arasında en az üç boşluk bırakılır.',
      'Numaranın başına rakam işareti (3-4-5-6) konur.'
    ],
    ornekler: []
  },
  {
    ad: 'Tarih Yazma',
    sembol: '—',
    hucreler: [],
    aciklama: 'Tarih, gün-ay-yıl sırasıyla ve aralarda nokta veya eğik çizgi ile yazılır.',
    kurallar: [
      'Rakamların başına rakam işareti konur.',
      'Ay adı yazıyla yazılırsa nokta veya eğik çizgi kullanılmaz (25 Nisan 2026).',
      'Sadece rakamla yazıldığında her rakam grubunun başına yeniden rakam işareti gerekir.'
    ],
    ornekler: ['25.04.2026', '25/04/2026', '25 Nisan 2026']
  },
  {
    ad: 'Rumuzlu İfadeler',
    sembol: '—',
    hucreler: [],
    aciklama: 'Bilinmeyen veya gizli tutulan adlar için kullanılan tek harflik rumuzlardır.',
    kurallar: [
      'Rumuz harfinin önüne büyük harf işareti (6) konur.',
      'Rumuzun sonuna gelen ekler kesme işareti ile ayrılır.',
      'Birden çok harfli rumuzlar nokta ile ayrılarak yazılır.'
    ],
    ornekler: ['B…’a', 'X.Y.Z.']
  },
  {
    ad: 'Düzeltme ve Yabancı Harf İşareti',
    sembol: '^',
    hucreler: [[4]],
    aciklama: 'Yalnız 4. noktadan oluşur.',
    kurallar: [
      'Türkçede bulunmayan yabancı harflerden önce konur (q, w, x gibi).',
      'Düzeltme (^) işareti gereken sesli harflerden önce konur (kâğıt, hâlâ).',
      'Yalnızca kendisinden sonraki harfi etkiler.'
    ],
    ornekler: ['^kağıt', '^hala', '^q', '^w', '^x']
  }
];


