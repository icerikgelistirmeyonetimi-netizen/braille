// Yönergeli yazma havuzu — 468 kelime (tekrarsız).
// Türkçe Braille alfabesinde bulunan karakterler kullanılır.
// Liste, kolay → orta zorluğa doğru sıralanmıştır.
export const YAZMA_KELIMELERI = [
  // Çok kısa, yaygın 2-3 harfli kelimeler (1-56)
  'al', 'el', 'ev', 'su', 'de', 'ne', 'iz', 'üç', 'on', 'iyi',
  'ana', 'ata', 'baba', 'taç', 'nar', 'kar', 'kor', 'kır', 'dağ', 'yol',
  'göl', 'göz', 'kol', 'kel', 'kül', 'tok', 'kal', 'gel', 'git',
  'koş', 'aç', 'ye', 'iç', 'oku', 'yaz', 'gör', 'duy', 'as', 'at',
  'tut', 'sat', 'kes', 'taş', 'top', 'ip', 'iğ', 'baş', 'beş', 'altı',
  'yedi', 'sekiz', 'dokuz', 'sıfır', 'bin', 'yüz', 'milyon',

  // Aile ve insanlar (57-115)
  'anne', 'kardeş', 'abla', 'abi', 'dede', 'nine', 'amca', 'dayı', 'teyze', 'hala',
  'kuzen', 'oğul', 'kız', 'çocuk', 'bebek', 'genç', 'yaşlı', 'arkadaş', 'komşu', 'öğretmen',
  'öğrenci', 'doktor', 'hemşire', 'mühendis', 'şoför', 'polis', 'asker', 'yazar', 'çiftçi', 'aşçı',
  'manav', 'fırıncı', 'terzi', 'avukat', 'hâkim', 'pilot', 'kaptan', 'sanatçı', 'müzisyen', 'ressam',
  'şair', 'işçi', 'usta', 'çırak', 'patron', 'müdür', 'sekreter', 'satıcı', 'müşteri', 'aile',
  'akraba', 'misafir', 'konuk', 'dost', 'sevgili', 'eş', 'gelin', 'damat', 'torun',

  // Ev ve eşyalar (116-174)
  'oda', 'salon', 'mutfak', 'banyo', 'tuvalet', 'koridor', 'merdiven', 'kapı', 'pencere', 'duvar',
  'tavan', 'taban', 'çatı', 'balkon', 'bahçe', 'avlu', 'garaj', 'kiler', 'depo', 'masa',
  'sandalye', 'koltuk', 'kanepe', 'yatak', 'dolap', 'rafta', 'ayna', 'halı', 'perde', 'lamba',
  'avize', 'saat', 'tablo', 'vazo', 'bardak', 'tabak', 'çatal', 'kaşık', 'bıçak', 'tencere',
  'tava', 'fırın', 'soba', 'ocak', 'buzdolabı', 'çamaşır', 'bulaşık', 'havlu', 'sabun', 'şampuan',
  'macun', 'fırça', 'tarak', 'makas', 'iğne', 'iplik', 'düğme', 'kalem', 'silgi',

  // Yiyecek ve içecek (175-232)
  'ekmek', 'peynir', 'zeytin', 'tereyağı', 'yumurta', 'süt', 'yoğurt', 'ayran', 'çay', 'kahve',
  'meyve', 'sebze', 'elma', 'armut', 'erik', 'kiraz', 'üzüm', 'kavun', 'karpuz', 'şeftali',
  'kayısı', 'limon', 'portakal', 'mandalina', 'muz', 'çilek', 'incir', 'ayva', 'patates', 'soğan',
  'sarımsak', 'havuç', 'domates', 'salatalık', 'biber', 'patlıcan', 'kabak', 'lahana', 'marul', 'maydanoz',
  'roka', 'nane', 'fasulye', 'mercimek', 'nohut', 'pirinç', 'bulgur', 'makarna', 'çorba', 'pilav',
  'köfte', 'kebap', 'döner', 'lahmacun', 'pide', 'börek', 'tatlı', 'baklava',

  // Doğa ve hayvanlar (233-287)
  'gök', 'güneş', 'ay', 'yıldız', 'bulut', 'yağmur', 'rüzgâr', 'fırtına', 'şimşek', 'gök gürültüsü',
  'gökkuşağı', 'deniz', 'nehir', 'dere', 'okyanus', 'ada', 'sahil', 'plaj', 'tepe', 'orman',
  'ağaç', 'çiçek', 'çimen', 'yaprak', 'dal', 'kök', 'kedi', 'köpek', 'tavşan', 'kuş',
  'serçe', 'güvercin', 'kartal', 'baykuş', 'horoz', 'tavuk', 'inek', 'koyun', 'keçi', 'eşek',
  'deve', 'aslan', 'kaplan', 'fil', 'maymun', 'ayı', 'kurt', 'tilki', 'fare', 'sincap',
  'kaplumbağa', 'yılan', 'kelebek', 'arı', 'karınca',

  // Vücut, sağlık (288-322)
  'saç', 'alın', 'kaş', 'kulak', 'burun', 'ağız', 'diş', 'dil', 'dudak', 'çene',
  'boyun', 'omuz', 'parmak', 'tırnak', 'göğüs', 'sırt', 'bel', 'kalça', 'bacak', 'diz',
  'ayak', 'topuk', 'kalp', 'beyin', 'akciğer', 'mide', 'sağlık', 'hastalık', 'ilaç', 'reçete',
  'hastane', 'eczane', 'ateş', 'ağrı', 'yara',

  // Okul, eğitim (323-360)
  'okul', 'sınıf', 'tahta', 'sıra', 'kitap', 'defter', 'cetvel', 'çanta', 'ders', 'ödev',
  'sınav', 'not', 'soru', 'cevap', 'öğrenmek', 'öğretmek', 'okumak', 'yazmak', 'matematik', 'türkçe',
  'fen', 'tarih', 'coğrafya', 'müzik', 'resim', 'beden', 'spor', 'kütüphane', 'harita', 'küre',
  'bilgisayar', 'tablet', 'kalemtıraş', 'boya', 'pergel', 'gönye', 'yapboz', 'bulmaca',

  // Şehir, ulaşım (361-394)
  'şehir', 'köy', 'kasaba', 'mahalle', 'sokak', 'cadde', 'meydan', 'park', 'müze', 'sinema',
  'tiyatro', 'banka', 'postane', 'market', 'pazar', 'lokanta', 'kafe', 'otel', 'durak', 'istasyon',
  'havalimanı', 'liman', 'köprü', 'tünel', 'araba', 'otobüs', 'tren', 'metro', 'tramvay', 'bisiklet',
  'motosiklet', 'gemi', 'uçak', 'helikopter',

  // Zaman (395-429)
  'saniye', 'dakika', 'gün', 'gece', 'sabah', 'öğle', 'akşam', 'hafta', 'yıl', 'asır',
  'pazartesi', 'salı', 'çarşamba', 'perşembe', 'cuma', 'cumartesi', 'bugün', 'dün', 'yarın', 'şimdi',
  'sonra', 'önce', 'şubat', 'mart', 'nisan', 'mayıs', 'haziran', 'temmuz', 'ağustos', 'eylül',
  'ekim', 'kasım', 'aralık', 'ilkbahar', 'sonbahar',

  // Renkler, sıfatlar (430-468)
  'kırmızı', 'mavi', 'sarı', 'yeşil', 'beyaz', 'siyah', 'mor', 'turuncu', 'pembe', 'gri',
  'kahverengi', 'lacivert', 'turkuaz', 'altın', 'gümüş', 'büyük', 'küçük', 'uzun', 'kısa', 'geniş',
  'dar', 'kalın', 'ince', 'ağır', 'hafif', 'sıcak', 'soğuk', 'serin', 'ılık', 'kuru',
  'ıslak', 'yumuşak', 'sert', 'tuzlu', 'acı', 'ekşi', 'temiz', 'kirli', 'güzel'
];
