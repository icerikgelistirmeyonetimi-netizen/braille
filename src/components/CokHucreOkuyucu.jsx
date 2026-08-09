import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import PageHeader from './PageHeader.jsx';
import BrailleCell from './BrailleCell.jsx';
import OkumaModuListesi, { OkumaModuButonu } from './OkumaModu.jsx';
import { konus, basariBildir, hataBildir, konusmayiDurdur, ekranOkuyucuTemizle, dogruSesi, noktaSesi, yanlisSesi } from '../utils/ses.js';
import { ogrenildiIsaretle, indeksKaydet, indeksAl, sonraOgrenKaydet, sonraOgrenKaldir, sonraOgrenAl } from '../utils/ilerleme.js';
import { ayarlariAl } from '../utils/ayarlar.js';
import { deseniGonder, deseniTemizle, satiriGonder } from '../utils/arduino.js';
import { mevcutSayfaIcinKaynakAnahtar } from '../utils/karisikYazmaKaynaklari.js';
import { sonrakiDers } from '../utils/dersAkisi.js';
import { noktaListesi, dokunmaKapanisi } from '../utils/noktaYardimci.js';

// ── kategoriAdi tekrar denetimi (ekran okuyucu metinleri) ────────────────────────
// ⚠⚠ "hemze hemzesi" / "do notası nota" gibi MANTIKSAL DİL HATALARI (kullanıcı: "hemze
// hemzesi gibi polite bölümünde yazımlar var, ekran okuyucu için metinlerdeki bu mantıksal
// dil hatalarını çözmemiz lazım"). Yönerge `${ttsBaşlık} ${kategoriAdi}` kuruyor; ESKİ guard
// yalnız TAM SONEK eşleşmesine bakıyordu (`"Büyük Harf İşareti".endsWith("işareti")`) →
// Türkçe İYELİK EKİ yüzünden kök aynı olsa bile eşleşmiyordu:
//   "Vavlı hemze" + "hemzesi"  → "Vavlı hemze hemzesi"   (kök: hemze = hemze)
//   "üstün tenvin" + "tenvini" → "üstün tenvin tenvini"  (kök: tenvin = tenvin)
//   "do notası"    + "nota"    → "do notası nota"        (TERS yön: başlık ekli, kategori köksüz)
//   "alfa harfi"   + "Yunan harfi" → "alfa harfi Yunan harfi" (çok sözcüklü kategori)
// Çözüm: her iki tarafın da 3. tekil İYELİK EKİNİ (-si/-sı/-su/-sü, -i/-ı/-u/-ü) soyup KÖK
// karşılaştır; başlığın HERHANGİ bir sözcüğünün kökü kategori köküyle aynıysa EKLEME.
// "Herhangi bir sözcük" (yalnız son sözcük değil) şart: "BD kısaltması, beden kelimesi"
// gibi kategori sözcüğü ortada kalan başlıklar da yakalanmalı.
const iyelikEkiniSoy = (s) => s.replace(/(s[ıiuü]|[ıiuü])$/u, '');
export function kategoriTekrariVarMi(baslikMetni, kategoriAdi) {
  if (!baslikMetni || !kategoriAdi) return false;
  // Çok sözcüklü kategoride ("Yunan harfi", "sıra sayısı") belirleyici olan SON sözcüktür.
  const kategoriKok = iyelikEkiniSoy(kategoriAdi.toLocaleLowerCase('tr').trim().split(/\s+/).pop());
  if (!kategoriKok) return false;
  return baslikMetni
    .toLocaleLowerCase('tr')
    .split(/[^\p{L}\p{N}']+/u)
    .filter(Boolean)
    .some((sozcuk) => iyelikEkiniSoy(sozcuk) === kategoriKok);
}

// Genel amaçlı çok hücreli sıralı okuma bileşeni.
// Her öge bir kelime/ifadedir; içindeki hücreler "hücre adımlama" modunda
// gösterilir: bir hücre büyük, altta tüm hücrelerin küçük önizlemesi.
// Bu sayede 6+ hücreli kelimeler mobilde de net okunur.
//
// ogeler: [{ yazi, okunus, anlam, hucreler: number[][] }]
// rtl: Arapça vb. sağdan sola yazı için.
export default function CokHucreOkuyucu({
  baslik,
  ogeler,
  bittiMesaji = 'Tebrikler! Tamamladınız.',
  rtl = false,
  bolumAnahtari,
  // İki hücreli öğeler VARSAYILAN olarak yan yana gösterilir (tek tek adımlama YOK) —
  // tüm modüller (Modül 10 hariç; o CokHucreOkuyucu kullanmaz) için (kullanıcı isteği).
  // Bir sayfa eski tek-tek davranışı isterse ikiHucreYanYana={false} ile devre dışı bırakır.
  ikiHucreYanYana = true,
  ogeSesiCal,
  ogeSesiDurdur,
  ogeSesiGecikmeMs = 2600,
  ogeSesiOnceCal = false,
  ogeSesiHerZaman = false,
  okumaModundaSadeceOgeSesi = false,
  sadeceHucreYonergesiOku = false,
  ogeSesiSonrasiKonusmaGecikmeMs = 900,
  ilkOgeSesiHariciCalindi = false,
  sesKaydiButonuGoster = false,
  sesKaydiButonEtiketi = 'Ses Kaydını Dinle',
  yonergeFormati = 'standart', // 'standart' | 'sirayla'
  // DesenOgretici-style props
  noktalariSeslendir = false,
  kategoriAdi = '',
  seslendirmeDili = 'tr',
  otomatikOgeSesi = false,
  ustSesKontrolleriGoster = false,
  ustSesButonEtiketi = 'Ses',
  ustSesButonAriaLabel = 'Sesi çal',
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const yazmaKaynak = mevcutSayfaIcinKaynakAnahtar(pathname);
  // Bitiş ekranında "Sonraki içerik" butonu için aynı modüldeki bir sonraki ders.
  const sonrakiIcerik = sonrakiDers(pathname);
  const konusDil = useCallback((text, opts = {}) => konus(text, { dil: seslendirmeDili, ...opts }), [seslendirmeDili]);
  // Ekran okuyucu (NVDA) otomatik dil değiştirme: yabancı dil sayfalarında (Modül 9 de/fr/en)
  // yabancı içerik (harf/sözcük) lang ile işaretlenir → NVDA o kısmı o dilin sesiyle okur;
  // Türkçe yönergeler lang taşımaz, tr (sayfa varsayılanı) kalır. Türkçe sayfalar (tr) etkilenmez.
  const yabanciDil = seslendirmeDili !== 'tr' ? seslendirmeDili : null;

  // Ders her açılışta baştan başlar (kaldığı yerden devam etmez).
  const [indeks, setIndeks] = useState(0);
  const [hucreIndeksi, setHucreIndeksi] = useState(0);
  const [basilanlar, setBasilanlar] = useState([]);
  const [yanlis, setYanlis] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const ogeSesiTimerRef = useRef(null);
  const tekrarSesiTimerRef = useRef(null);
  const sonHucreOgeRef = useRef(0); // hücre-noktası effect'inde öğe değişimini tespit için
  const [ogeSesiAktif, setOgeSesiAktif] = useState(Boolean(otomatikOgeSesi || ogeSesiHerZaman));
  // Ses kaydı ÖNCE çalan sayfa mı (Kur'an harfleri, sesli müzik)? Bu sayfalarda NVDA'nın
  // yönergeyi ses kaydıyla AYNI ANDA okumaması için yönerge bölgesi ses bitene kadar boş
  // tutulur (bkz. srYonergeMetni'yi geç set etme + yonergeyiOku).
  const sesKaydiOnce = ogeSesiOnceCal && (ogeSesiHerZaman || ogeSesiAktif) && typeof ogeSesiCal === 'function';
  // Hızlı Dolaşım (okuma) modu artık URL query param'ında: ?gorunum=dolasim → adres çubuğunda
  // görünür ve tarayıcı/Alt geri tuşu moddan çıkar. State DEĞİL, URL'den türetilir → 20+ sayfa
  // otomatik kapsanır. SayfaOdakYonetimi yalnız pathname'e baktığından query değişimi odak
  // akışını bozmaz; okuma↔öğrenme odak effect'i (aşağıda) sahibidir.
  const okumaModu = searchParams.get('gorunum') === 'dolasim';
  // Modu BİZ mi push'ladık (buton) → kapatırken navigate(-1) ile temiz pop (Alt geri ile aynı);
  // deep-link/refresh ile gelindiyse param'ı replace ile kaldır (uygulamadan çıkmayalım).
  const okumaPushladikRef = useRef(false);
  // Yönerge bölgesi ODAKLI mı? Odaklıyken aria-live KAPATILIR → NVDA yönergeyi yalnız ODAK
  // ile okur (canlı bölge tekrar duyurusu eklemez). Odak başka yerdeyken (sayfa-içi öğe
  // geçişi / Tekrar) polite kalır → değişiklik duyurulur. (kullanıcı: "yönergeleri bazen iki
  // kere okuyor" — odaklı bir öğenin AYNI ZAMANDA canlı bölge olması = çift okuma anti-paterni.)
  const [yonergeOdakta, setYonergeOdakta] = useState(false);
  // Yönerge seslendirilirken nokta etkileşimi kilitlenir (tıklama/hover/odak/klavye yok).
  const [yonergeOkunuyor, setYonergeOkunuyor] = useState(false);
  // Ekran okuyucu için: yönerge KALICI bölgede durur (kaybolmaz); "sıradaki nokta"
  // AYRI canlı bölgede güncellenir (her dokunuşta eskisiyle yer değiştirir). Görsel YOK.
  const [srYonergeMetni, setSrYonergeMetni] = useState('');
  // Yönerge aria-live bölgesini her seslendirmede (yeni öğe VE "Tekrar") yeniden
  // duyurmak için nonce: aynı metinde bile içerik değişsin → NVDA tekrar okur.
  const [yonergeNonce, setYonergeNonce] = useState(0);
  const [srSiradakiNokta, setSrSiradakiNokta] = useState('');
  const yonergeNesilRef = useRef(0);
  const yonergeKilitTimerRef = useRef(null);
  const dotSentinelRef = useRef(null);
  const oncekiYonergeOkunuyorRef = useRef(false);
  // Okuma modundan öğrenme moduna dönüşte odağı ilk içeriğe vermek için (en alta düşmesin).
  const oncekiOkumaModuRef = useRef(false);
  // Sayfa girişi (mount): ilk narration-bitti = giriş; sonrası öğe geçişi. NVDA'da girişte
  // odağı yönergeye verip (dot'a değil) önce yönergeyi okutmak için (bkz. dot-odak effect'i).
  const sayfaGirisiRef = useRef(true);
  // Bitti (Tebrikler) ekranında ekran okuyucu mesaja odaklansın diye.
  const bittiMesajRef = useRef(null);

  const [kayitlilarModu, setKayitlilarModu] = useState(false);
  const anahtar = bolumAnahtari || baslik || 'genel';
  const kayitliAdlar = sonraOgrenAl(anahtar);
  const kayitliSayisi = kayitliAdlar.length;
  const aktifListe = kayitlilarModu
    ? ogeler.filter((o) => kayitliAdlar.includes(o.yazi))
    : ogeler;

  const bitti = indeks >= aktifListe.length;
  const aktif = aktifListe[indeks];
  const hucreSayisi = aktif ? aktif.hucreler.length : 0;

  const kelimeYonergeMetniAl = useCallback((oge) => {
    if (!oge) return '';

    const hucreler = Array.isArray(oge.hucreler) ? oge.hucreler : [];
    const cokHucre = hucreler.length > 1;
    const ilkHucre = Array.isArray(hucreler[0]) ? hucreler[0] : (hucreler[0] != null ? [hucreler[0]] : []);

    // "1. ve 2. noktalardan oluşur." (çok hücreli: "1. hücre …, 2. hücre …")
    const noktaKompozisyonMetni = () => {
      const kompozisyon = hucreler.map((noktalar, i) => {
        const nArr = noktalar || [];
        if (!nArr.length) return '';
        const liste = noktaListesi(nArr, 'dan', 'dan');
        return cokHucre ? `${i + 1}. hücre ${liste}` : liste;
      }).filter(Boolean).join(', ');
      return kompozisyon ? `${kompozisyon} oluşur.` : '';
    };

    // Kapanış cümlesi TEKİL/ÇOĞUL: tek nokta → "Lütfen bu noktaya dokunun." (sırayla YOK).
    const kapanisMetni = dokunmaKapanisi(hucreler);

    // tamYonergeMetni varsa onu kullan; ama noktalariSeslendir (kısaltma sayfaları) ise
    // nokta kompozisyonunu SONA EKLE — yoksa yönerge yalnız açıklamayı söyleyip noktaları
    // söylemeden bırakıyordu (kullanıcı: "kısaltmalarda ilk hücre söylenip bırakılıyor").
    if (oge.tamYonergeMetni) {
      if (!noktalariSeslendir) return oge.tamYonergeMetni;
      const komp = noktaKompozisyonMetni();
      return `${oge.tamYonergeMetni} ${komp} ${kapanisMetni}`.replace(/\s+/g, ' ').trim();
    }

    // Sembol öğretme modu (kategoriAdi verilmişse — eski DesenOgretici davranışı)
    if (kategoriAdi) {
      const ttsBaşlık = oge.ttsYazi || oge.yazi || '';
      const adKategori = kategoriTekrariVarMi(ttsBaşlık, kategoriAdi)
        ? ttsBaşlık
        : `${ttsBaşlık} ${kategoriAdi}`;
      const anlamKismi = oge.anlam ? ` ${oge.anlam}` : '';
      const aciklamaKismi = oge.aciklama ? ` ${oge.aciklama}` : '';
      if (noktalariSeslendir) {
        const komp = noktaKompozisyonMetni();
        return `${adKategori},${anlamKismi}${aciklamaKismi} ${komp} ${kapanisMetni}`.replace(/\s+/g, ' ').trim();
      }
      // detay: açıklama (yonergeDetay) + DAİMA okunabilir nokta kompozisyonu.
      // ⚠ Çoğu sembol sayfasının açıklaması ya hiç nokta demiyor (ör. ölçü "mm harfleriyle
      // yazılır") ya da KISA ÇİZGİ gösterimi ("4-5", "3-4-5") kullanıyor — ekran okuyucu için
      // belirsiz/eksik (kullanıcı: "tüm modüllerde kontrol et, kısaltma dışında da var").
      // Bu yüzden SÖZLÜ nokta ("4. ve 5. noktalardan oluşur") garanti edilir. Açıklama zaten
      // SÖZLÜ nokta içeriyorsa ("nokta" + rakam → ör. fen-yunan/sira-sayıları) tekrar EKLENMEZ.
      const noktaMetni = noktaKompozisyonMetni();
      const detayHam = (oge.yonergeDetay || '').trim();
      // ⚠ HÜCRESİZ öğe (hucreler:[], ör. "Sayfa Numaralama" — braille'de özel hücre yazımı YOK,
      // bilgi amaçlı): nokta kompozisyonu YOK + "Lütfen bu noktalara dokunun" EKLENMEZ (dokunulacak
      // nokta yok → çelişki). Açıklama (yonergeDetay) "Devam için sonraki öğeye tıklayınız" yönlendirmesini
      // taşır (kullanıcı: "braille için özel bir hücre yazımı yoktur, devam için sonraki öğeye tıklayınız").
      const hucresiz = hucreler.length === 0;
      // Yalnız açıklama SÖZLÜ kompozisyonu ("…noktadan/noktalardan oluşur") içeriyorsa atla.
      // ⚠ "Noktaları: 3-4-5-6" gibi ÇİZGİ gösterimi sözlü SAYILMAZ → sözlü biçim eklenir.
      const zatenSozluNokta = /nokta(dan|lardan)\s+oluşur/i.test(detayHam);
      const detay = detayHam
        ? (zatenSozluNokta || hucresiz ? detayHam : `${detayHam} ${noktaMetni}`)
        : noktaMetni;
      const kapanis = hucresiz ? '' : ` ${kapanisMetni}`;
      return `${adKategori},${anlamKismi}${aciklamaKismi} ${detay}${kapanis}`.replace(/\s+/g, ' ').trim();
    }

    // Kelime okuma modu (eski CokHucreOkuyucu davranışı)
    let hucreYonergesi;
    if (yonergeFormati === 'sirayla') {
      // ⚠ Tek noktada "sırayla" DÜŞER (tek noktanın sırası olmaz); `noktaListesi` zaten
      // "1. noktaya" / "1. ve 2. noktalara" tekil-çoğul uyumunu kendisi kurar.
      const dokunYonergesi = ilkHucre.length
        ? (ilkHucre.length === 1
            ? `Lütfen ${noktaListesi(ilkHucre, 'ya', 'a')} dokununuz.`
            : `Lütfen sırayla ${noktaListesi(ilkHucre, 'ya', 'a')} dokununuz.`)
        : 'Lütfen noktalarına dokununuz.';
      hucreYonergesi = cokHucre
        ? `${hucreler.length} braille hücresinden oluşur. 1. hücre: ${dokunYonergesi}`
        : dokunYonergesi;
    } else {
      const ilkHucreNoktalar = ilkHucre.length ? noktaListesi(ilkHucre, 'ya', 'a') : 'boş hücre';
      hucreYonergesi = cokHucre
        ? `${hucreler.length} braille hücresinden oluşur. 1. hücre: ${ilkHucreNoktalar} dokunun.`
        : `${ilkHucreNoktalar} dokunun.`;
    }

    if (sadeceHucreYonergesiOku) {
      return hucreYonergesi;
    }

    const ttsBaşlık = oge.ttsYazi || oge.yazi;
    const okunusKismi = oge.okunus ? `, okunuşu: ${oge.okunus}` : '';
    return `${ttsBaşlık}${okunusKismi}. ${oge.anlam || ''} ${hucreYonergesi}`;
  }, [sadeceHucreYonergesiOku, yonergeFormati, kategoriAdi, noktalariSeslendir]);

  // Menüdeki ilerleme göstergesi için yalnızca en uzak ulaşılan öğeyi kaydet
  // (ders baştan başlasa da ilerleme kaybolmasın). Kayıtlılar modunda kaydetme.
  useEffect(() => {
    if (bolumAnahtari && !kayitlilarModu && indeks > indeksAl(bolumAnahtari)) {
      indeksKaydet(bolumAnahtari, indeks);
    }
  }, [indeks, bolumAnahtari, kayitlilarModu]);

  const gosterToast = (mesaj) => {
    clearTimeout(toastTimerRef.current);
    setToast(mesaj);
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  };

  // Yönergeyi seslendirirken noktaları kilitler; seslendirme bitince açar.
  // onSon (utterance sonu) ana sinyaldir; güvenlik için bir zaman aşımı da var.
  const yonergeKilidiAc = (nesil) => {
    if (yonergeNesilRef.current !== nesil) return;
    if (yonergeKilitTimerRef.current) {
      clearTimeout(yonergeKilitTimerRef.current);
      yonergeKilitTimerRef.current = null;
    }
    setYonergeOkunuyor(false);
  };

  const yonergeyiKilitleyerekSeslendir = (metin, secenek = {}) => {
    const nesil = ++yonergeNesilRef.current;
    setYonergeOkunuyor(true);
    if (yonergeKilitTimerRef.current) clearTimeout(yonergeKilitTimerRef.current);
    const uzunluk = metin ? metin.length : 0;
    const sesAcik = ayarlariAl().sesAcik;
    // ⚠ NOKTALAR ARTIK KİLİTLENMEZ (kullanıcı: "yönerge bitmesini bekleyiniz ve zorla bekletmeyi
    // kaldıralım tüm sayfalardan"). `yonergeOkunuyor` yalnız ODAK AKIŞINI sürer (narration "bitti"
    // → giriş: yönerge bölgesi / öğe geçişi: ilk nokta); dokunma HER AN serbest — toast/kilit/klavye
    // engeli YOK. Timer, "narration bitti" (odak effect'i) sinyalinin ZAMANLAMASINI verir: App TTS
    // açıkken gerçek utterance sonu, kapalıyken (NVDA) aria-live okuma süresi tahmini.
    const kilitMs = sesAcik
      ? Math.min(30000, 6000 + uzunluk * 200)   // güvenlik üst sınırı (gerçek onSon daha erken gelir)
      : Math.min(12000, 2500 + uzunluk * 70);   // NVDA aria-live okuma süresi tahmini
    yonergeKilitTimerRef.current = setTimeout(() => yonergeKilidiAc(nesil), kilitMs);
    // Ekran okuyucu: yönergeyi _srBolge'ye YAZMA (srAtla) — düz metin lang taşıyamaz +
    // "Başla" anında üzerine yazardı. Bunun yerine bileşenin aria-live yönerge bölgesi
    // (lang span'li) duyurur. Yeni öğede metin zaten değiştiği için bölge bir kez okur;
    // nonce SADECE "Tekrar"da (aynı metin) bump edilir → çift-okuma olmaz.
    konusDil(metin, {
      srAtla: true,
      ...secenek,
      // App TTS kapalıyken onSon (anında) narration-bitti sinyalini vermesin — timer verir.
      onSon: sesAcik ? () => yonergeKilidiAc(nesil) : undefined,
    });
  };

  const tumSesleriDurdur = () => {
    konusmayiDurdur();
    // Çalmakta olan ses kaydını da durdur (navigasyonda kayıt + TTS çakışmasın).
    ogeSesiDurdur?.();

    if (ogeSesiTimerRef.current) {
      clearTimeout(ogeSesiTimerRef.current);
      ogeSesiTimerRef.current = null;
    }

    if (tekrarSesiTimerRef.current) {
      clearTimeout(tekrarSesiTimerRef.current);
      tekrarSesiTimerRef.current = null;
    }
  };

  const kaydetSonra = () => {
    if (bitti || !aktif) return;
    const kaydedildi = sonraOgrenAl(anahtar).includes(aktif.yazi);
    if (kaydedildi) {
      sonraOgrenKaldir(anahtar, aktif.yazi);
      konusDil('Sonra öğren listesinden kaldırıldı.');
      gosterToast('Sonra öğren listesinden kaldırıldı');
    } else {
      sonraOgrenKaydet(anahtar, aktif.yazi);
      konusDil('Sonra öğren listesine kaydedildi.');
      gosterToast('Sonra öğren listesine kaydedildi');
    }
  };

  const okumaModunaGec = () => {
    konusmayiDurdur();
    okumaPushladikRef.current = true;
    setSearchParams((p) => { const n = new URLSearchParams(p); n.set('gorunum', 'dolasim'); return n; });
  };

  // Okuma modundan çık: biz push'ladıysak geçmişten pop (Alt geri ile aynı), değilse param'ı kaldır.
  const okumaModundanCik = () => {
    if (okumaPushladikRef.current) {
      okumaPushladikRef.current = false;
      navigate(-1);
    } else {
      setSearchParams((p) => { const n = new URLSearchParams(p); n.delete('gorunum'); return n; }, { replace: true });
    }
  };

  const okumaOgesiSec = (orijinalIndeks) => {
    setKayitlilarModu(false);
    setIndeks(orijinalIndeks);
    setHucreIndeksi(0);
    setBasilanlar([]);
    setYanlis([]);
    okumaModundanCik();
  };

  // Yeni kelimeye geçince ilk hücreden başla
  useEffect(() => { setHucreIndeksi(0); }, [indeks]);
  useEffect(() => { setBasilanlar([]); setYanlis([]); }, [indeks, hucreIndeksi]);

  // Yeni kelime tanıtımı (kelime adı + okunuş + hücre sayısı)
  useEffect(() => {
    // Öğe değişiminde önceki TTS ve ses kaydını durdur (üst üste binmesin).
    konusmayiDurdur();
    ogeSesiDurdur?.();

    if (bitti) {
      yonergeNesilRef.current += 1; // bekleyen kilit açmalarını geçersiz kıl
      setYonergeOkunuyor(false);
      ekranOkuyucuTemizle();
      const yazmaDavet = yazmaKaynak
        ? ' Şimdi yazma zamanı! Öğrendiklerinizi karışık yazma etkinliğinde uygulayabilirsiniz.'
        : '';
      konusDil(bittiMesaji + yazmaDavet, { srAtla: true });
      return;
    }
    const k = ogeler[indeks];
    if (!k) return undefined;

    // Yeni öğe yüklendi: yönerge okunana kadar noktalar kilitli.
    // Nesli artır ki önceki öğenin bekleyen kilit-açma zamanlayıcıları
    // yeni öğeyi yanlışlıkla açmasın.
    yonergeNesilRef.current += 1;
    // Bu öğenin nesli — Tab ile "atla/sesi kes" yapılınca nesil artırılır; bekleyen ses/yönerge
    // callback'leri (onEnded/safety) bu nesle bakıp İPTAL olur (geriden ses gelmesin).
    const buNesil = yonergeNesilRef.current;
    if (yonergeKilitTimerRef.current) {
      clearTimeout(yonergeKilitTimerRef.current);
      yonergeKilitTimerRef.current = null;
    }
    setYonergeOkunuyor(true);

    const metin = kelimeYonergeMetniAl(k);
    // Ekran okuyucu: yönergeyi KALICI bölgeye yaz (hep okunabilir kalır) + yeni öğe/hücreye
    // geçince "sıradaki nokta" bölgesini temizle (eski yönlendirme kalmasın).
    // ⚠ Ses kaydı ÖNCE çalan sayfada bölgeyi ŞİMDİ DOLDURMA (boş bırak) → NVDA ses kaydı
    // çalarken yönergeyi okumasın (çakışma); yönerge ses bitince (yonergeyiOku) yazılır.
    setSrYonergeMetni(sesKaydiOnce ? '' : metin);
    setSrSiradakiNokta('');
    const sesOncesiYonergeMetni = typeof k.sesOncesiYonergeMetni === 'string'
      ? k.sesOncesiYonergeMetni.trim()
      : '';
    const gecikme = ogeSesiOnceCal ? 250 : 250;
    const sesAktifMi = ogeSesiHerZaman || ogeSesiAktif;

    if (ogeSesiTimerRef.current) {
      clearTimeout(ogeSesiTimerRef.current);
      ogeSesiTimerRef.current = null;
    }
    if (tekrarSesiTimerRef.current) {
      clearTimeout(tekrarSesiTimerRef.current);
      tekrarSesiTimerRef.current = null;
    }

    let konusmaTimer = null;

    const ilkOgeMi = indeks === 0 && !kayitlilarModu;
    const ilkSesZatenCalindi = ilkOgeMi && ilkOgeSesiHariciCalindi;

    if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function') {
      // Ses ile yönergenin EŞ ZAMANLI olmaması için: yönerge, kayıt BİTİNCE
      // (onEnded) okunur; sabit gecikme yerine kaydın gerçek süresi beklenir.
      let konustu = false;
      const yonergeyiOku = () => {
        if (konustu) return;
        // Tab ile atlandıysa (nesil arttı) bekleyen onEnded/safety bu yönergeyi YENİDEN
        // başlatmasın (geriden ses/yeniden-kilit olmasın).
        if (yonergeNesilRef.current !== buNesil) return;
        konustu = true;
        // Ses kaydı bitti → yönergeyi NVDA bölgesine ŞİMDİ yaz (sıralı: önce kayıt, sonra yönerge).
        if (sesKaydiOnce) setSrYonergeMetni(metin);
        yonergeyiKilitleyerekSeslendir(metin);
      };

      const sesiCalSonraYonergeyiOku = () => {
        if (!ilkSesZatenCalindi) {
          ogeSesiCal(k, { onEnded: yonergeyiOku });
          // Güvenlik: onEnded gelmezse (ör. ses çalınamazsa) en geç ~5 sn sonra oku.
          konusmaTimer = window.setTimeout(yonergeyiOku, 5000);
          return;
        }
        // İlk öğe sesi haricen çalındı: yönergeyi kısa gecikmeyle oku.
        konusmaTimer = window.setTimeout(yonergeyiOku, gecikme + ogeSesiSonrasiKonusmaGecikmeMs);
      };

      if (sesOncesiYonergeMetni) {
        konusmaTimer = window.setTimeout(() => {
          konus(sesOncesiYonergeMetni, {
            kesintiyle: true,
            onSon: sesiCalSonraYonergeyiOku
          });
        }, gecikme);
      } else if (!ilkSesZatenCalindi) {
        ogeSesiTimerRef.current = window.setTimeout(sesiCalSonraYonergeyiOku, gecikme);
      } else {
        sesiCalSonraYonergeyiOku();
      }
    } else {
      const anaYonergeyiOku = () => {
        // Tab ile atlandıysa (nesil arttı) yönergeyi yeniden başlatma/kilitleme.
        if (yonergeNesilRef.current !== buNesil) return;
        yonergeyiKilitleyerekSeslendir(metin);
      };

      konusmaTimer = window.setTimeout(() => {
        if (sesOncesiYonergeMetni) {
          konus(sesOncesiYonergeMetni, {
            kesintiyle: true,
            onSon: anaYonergeyiOku
          });
          return;
        }
        anaYonergeyiOku();
      }, gecikme);

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        ogeSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(k);
          ogeSesiTimerRef.current = null;
        }, gecikme + ogeSesiGecikmeMs);
      }
    }

    const tekrar = () => {
      // Tekrar: yönerge metni AYNI kaldığından aria-live bölgesi kendiliğinden
      // yeniden okumaz; nonce'u değiştirerek NVDA'nın tekrar okumasını sağla.
      if (tekrarSesiTimerRef.current) {
        clearTimeout(tekrarSesiTimerRef.current);
        tekrarSesiTimerRef.current = null;
      }

      if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function') {
        // Ses kaydı önce: yönergeyi (NVDA bölgesi) ses BİTİNCE yeniden duyur → çakışma yok.
        let tekrarKonustu = false;
        const tekrarOku = () => {
          if (tekrarKonustu) return;
          tekrarKonustu = true;
          setSrYonergeMetni(metin);
          setYonergeNonce((n) => n + 1);
          yonergeyiKilitleyerekSeslendir(metin, { kesintiyle: true });
        };
        const sesiCalSonraTekrarOku = () => {
          ogeSesiCal(k, { onEnded: tekrarOku });
          // Güvenlik: onEnded gelmezse en geç ~5 sn sonra oku.
          tekrarSesiTimerRef.current = window.setTimeout(tekrarOku, 5000);
        };
        if (sesOncesiYonergeMetni) {
          konus(sesOncesiYonergeMetni, {
            kesintiyle: true,
            onSon: sesiCalSonraTekrarOku
          });
        } else {
          sesiCalSonraTekrarOku();
        }
        return;
      }

      // Ses kaydı önce DEĞİL: yönergeyi HEMEN yeniden duyur (nonce); ses varsa sonra çalar.
      setYonergeNonce((n) => n + 1);
      const anaYonergeyiTekrarOku = () => {
        yonergeyiKilitleyerekSeslendir(metin, { kesintiyle: true });
      };

      if (sesOncesiYonergeMetni) {
        konus(sesOncesiYonergeMetni, {
          kesintiyle: true,
          onSon: anaYonergeyiTekrarOku
        });
      } else {
        anaYonergeyiTekrarOku();
      }

      if (sesAktifMi && typeof ogeSesiCal === 'function') {
        tekrarSesiTimerRef.current = window.setTimeout(() => {
          ogeSesiCal(k);
          tekrarSesiTimerRef.current = null;
        }, ogeSesiGecikmeMs);
      }
    };
    window.addEventListener('yonergeTekrar', tekrar);

    return () => {
      if (konusmaTimer) clearTimeout(konusmaTimer);
      if (ogeSesiTimerRef.current) {
        clearTimeout(ogeSesiTimerRef.current);
        ogeSesiTimerRef.current = null;
      }
      if (tekrarSesiTimerRef.current) {
        clearTimeout(tekrarSesiTimerRef.current);
        tekrarSesiTimerRef.current = null;
      }
      window.removeEventListener('yonergeTekrar', tekrar);
    };
  }, [
    indeks,
    bitti,
    ogeler,
    bittiMesaji,
    ogeSesiCal,
    ogeSesiGecikmeMs,
    ogeSesiOnceCal,
    ogeSesiHerZaman,
    ogeSesiAktif,
    ogeSesiSonrasiKonusmaGecikmeMs,
    ilkOgeSesiHariciCalindi,
    kelimeYonergeMetniAl,
    ogeSesiDurdur,
  ]);

  // Hücre değişince o hücrenin noktalarını seslendir (ilk hücre hariç)
  useEffect(() => {
    // ÖĞE (hece) değiştiyse bu effect, hucreIndeksi henüz sıfırlanmadan eski
    // değerle (ör. 1) çalışabilir → yeni hecenin kaydıyla çakışan "2. hücre"
    // seslendirmesi tetiklenirdi. Öğe değişiminde hiç konuşma: ana effect
    // (kayıt + yönerge) yeni öğeyi zaten tanıtıyor.
    const ogeDegisti = sonHucreOgeRef.current !== indeks;
    sonHucreOgeRef.current = indeks;
    if (ogeDegisti) return;

    if (bitti || !aktif || hucreIndeksi === 0) return;
    // Çalan ses kaydını durdur ki hücre noktası seslendirmesiyle üst üste binmesin.
    ogeSesiDurdur?.();
    const noktalar = aktif.hucreler[hucreIndeksi];
    if (!noktalar) return; // kelime değişmiş, indeks henüz sıfırlanmamış olabilir
    const hucreEtiketi = aktif?.hucreAdlari?.[hucreIndeksi] || `${hucreIndeksi + 1}. hücre`;
    yonergeyiKilitleyerekSeslendir(
      `${hucreEtiketi}: ${noktaListesi(noktalar, 'ya', 'a')} dokunun.`,
      { kesintiyle: true, dil: seslendirmeDili }
    );
  }, [hucreIndeksi, indeks, aktif, bitti, ogeSesiDurdur]);

  useEffect(() => () => konusmayiDurdur(), []);

  // Bileşen kaldırılırken yönerge kilit zamanlayıcısını temizle.
  useEffect(() => () => {
    if (yonergeKilitTimerRef.current) clearTimeout(yonergeKilitTimerRef.current);
  }, []);



  // Arduino: ekrandaki desen değiştikçe gönder (bağlı değilse sessizce yoksayılır).
  useEffect(() => {
    if (bitti) { deseniTemizle(); return; }
    if (aktif?.hucreler?.length) {
      if (aktif.hucreler.length > 1) satiriGonder(aktif.hucreler);
      else deseniGonder(aktif.hucreler[0] || []);
    }
    return () => { deseniTemizle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indeks, bitti]);

  // Narrasyon bitince odağı yönet: SAYFA GİRİŞİNDE (modülden VEYA refresh) önce yönerge,
  // sonra braille; sayfa-içi öğe geçişinde ilk braille noktası.
  useEffect(() => {
    const onceki = oncekiYonergeOkunuyorRef.current;
    oncekiYonergeOkunuyorRef.current = yonergeOkunuyor;
    if (!(onceki && !yonergeOkunuyor)) return undefined;
    if (okumaModu || bitti) return undefined;

    // ⚠ Kilit kaldırıldı → narration penceresinde noktalar CANLI. Kullanıcı zaten bir noktaya
    // geçip etkileşimdeyse (odak bir dot butonunda) narration-bitti timer'ı odağı ÇALMASIN — ne
    // yönerge bölgesine ne ilk noktaya taşı (kullanıcı: "zorla bekletmeyi kaldıralım").
    const odakEl = typeof document !== 'undefined' ? document.activeElement : null;
    if (odakEl && odakEl.classList && odakEl.classList.contains('dot')) return undefined;

    // İlk narration-bitti = SAYFA GİRİŞİ (mount). Sonraki tüm tetiklemeler öğe geçişidir.
    const girisAni = sayfaGirisiRef.current;
    sayfaGirisiRef.current = false;

    const sesAcik = ayarlariAl().sesAcik;
    const sesKaydiVar = typeof ogeSesiCal === 'function';

    // SES KAYITLI sayfa (Kur'an harfleri / sesli müzik) + App TTS KAPALI (NVDA): yönerge
    // bölgesi ses kaydı BİTİNCE doldurulur (sesKaydiOnce) → polite bölge yönergeyi o anda
    // okur. Burada odağı dot'a kaydırırsak NVDA yönergeyi YARIDA keser → DOT'A GEÇME, hiçbir
    // şey yapma; odak başlıkta kalır, kullanıcı yönergeyi dinleyip Tab ile noktaya geçer.
    // (App TTS açıkken aşağı düşer → narration sonrası dot'a geçilir.)
    if (!sesAcik && sesKaydiVar) return undefined;

    // SAYFA GİRİŞİ + App TTS KAPALI (NVDA) + ses kaydı YOK → önce YÖNERGE okunsun:
    // odağı yönerge bölgesine ver (dot'a DEĞİL). App TTS kapalıyken "yönerge bitti" sinyali
    // ANINDA gelir (onSon setTimeout(0)) → dot'a geçersek NVDA yönergeyi YARIDA keser.
    // Kullanıcı: "modülden/refresh açınca önce yönerge okunsun sonra braille; dot direkt
    // odaklanması hatalı". Hem modülden giriş hem REFRESH (SayfaOdakYonetimi ilk yüklemede
    // odağı atlar → burada aktif odaklarız) bu yolla çalışır. Kullanıcı yönergeyi dinleyip
    // Tab ile ilk noktaya geçer (DOM: yönerge bölgesi → braille hücresi).
    // ⚠ Ses KAYITLI sayfalar HARİÇ (kullanıcı isteği) → onlar eski davranışta kalır.
    // ⚠⚠ STANDART — ASLA DEĞİŞTİRME (kullanıcı: "ilk tab tuşumda braille hücresinde 1. nokta
    // HER ZAMAN"): SAYFA GİRİŞİNDE (ses kaydı YOK) odak YÖNERGE bölgesine gelir (dot'a DEĞİL,
    // ilk hedef noktaya DEĞİL) → NVDA önce yönergeyi okur; kullanıcının İLK TAB'ı DOM sırasıyla
    // braille hücresinin 1. (ilk) noktasına konumlanır. Hem NVDA hem app TTS açıkken aynı.
    if (girisAni && !sesKaydiVar) {
      // rAF-RETRY: kilit açılırken (yonergeOkunuyor false) noktalar div→button olur, bu
      // re-render anında tek odak DÜŞEBİLİR → odak tutana kadar (en çok 12 frame) tekrar dene.
      let deneme = 0;
      let id = 0;
      const odakla = () => {
        const el = document.querySelector('#main .yonerge-sr');
        if (el && document.activeElement !== el) el.focus();
        if ((!el || document.activeElement !== el) && deneme < 12) { deneme += 1; id = window.requestAnimationFrame(odakla); }
      };
      id = window.requestAnimationFrame(odakla);
      return () => window.cancelAnimationFrame(id);
    }

    // "Başla" _srBolge'ye YAZILMAZ (srAtla) — yoksa aria-live yönerge bölgesini ezerdi.
    // App TTS açıkken yine sesli söylenir; NVDA için yönerge bölgesi yeterli cue'dur.
    konusDil('Başla', { srAtla: true });
    // Yönerge bitince odağı BOŞ sentinel yerine İLK BRAILLE NOKTASINA ver (kullanıcı:
    // "yönerge bitince boş diyor; orada braille noktalarını saymalı"): NVDA boş gizli
    // span'i "boş" diye okuyordu → artık basılacak nokta ("1. nokta…") okunur, kullanıcı
    // doğrudan noktanın üzerine konumlanır. Nokta yoksa sentinel'e düş (eski davranış).
    const id = window.requestAnimationFrame(() => {
      const kok = dotSentinelRef.current?.parentElement;
      // ⚠ STANDART: hücrenin 1. (İLK) noktası — `button.dot.target` (ilk hedef) DEĞİL.
      const ilkNokta = kok?.querySelector('button.dot');
      (ilkNokta || dotSentinelRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [yonergeOkunuyor, okumaModu, bitti, konusDil, ogeSesiCal]);


  // Bitti (Tebrikler) ekranı açılınca odağı bitiş mesajına ver → ekran okuyucu mesajı okur
  // (kullanıcı: "tebrikler sahnesinde ekran okuyucu tebriklere odaklanamıyor"). Bitti
  // ekranına rota değişmeden (setIndeks ile) geçilir → SayfaOdakYonetimi devreye girmez,
  // bu yüzden odağı burada veriyoruz.
  useEffect(() => {
    if (!bitti || okumaModu) return undefined;
    const id = window.requestAnimationFrame(() => { bittiMesajRef.current?.focus(); });
    return () => window.cancelAnimationFrame(id);
  }, [bitti, okumaModu]);

  // Okuma↔öğrenme modu geçişinde odağı İLK İÇERİĞE ver (rota değişmediğinden SayfaOdakYonetimi
  // devreye girmez; geçiş butonları unmount olunca odak gövdeye/sayfa altına/başlığa düşüyordu).
  //  • ÖĞRENME moduna dönüş → yönerge bölgesi (`.yonerge-sr`; ses-kayıtlı sayfalarda da bulunur).
  //  • OKUMA moduna giriş → ilk kart (`.okuma-modu-kutu` = ilk içerik kutusu).
  // (kullanıcı: "okuma modunda başlığa odaklanıyor / öğrenme moduna dönünce sayfa altına; ilk
  // içerik kutusuna odaklanmalı".)
  useEffect(() => {
    const onceki = oncekiOkumaModuRef.current;
    oncekiOkumaModuRef.current = okumaModu;
    if (bitti) return undefined;
    const ogrenmeyeDonus = onceki && !okumaModu;
    const okumayaGiris = !onceki && okumaModu;
    if (!ogrenmeyeDonus && !okumayaGiris) return undefined;
    const sec = ogrenmeyeDonus
      ? '#main .yonerge-sr'
      : '#main .okuma-modu-grid button.okuma-modu-kutu';
    let rafId = 0;
    let deneme = 0;
    // Odağı hedefe ver; OkumaModuListesi mount churn'ünde (kart yeniden oluşunca) odak
    // düşebilir → odak oturana kadar birkaç frame yeniden dene (en çok ~6 frame).
    const odakla = () => {
      const el = document.querySelector(sec);
      if (el) el.focus();
      if ((!el || document.activeElement !== el) && deneme < 6) {
        deneme += 1;
        rafId = window.requestAnimationFrame(odakla);
      }
    };
    rafId = window.requestAnimationFrame(odakla);
    return () => window.cancelAnimationFrame(rafId);
  }, [okumaModu, bitti]);

  // "Hücreye dön" hayalet butonu App kökündeki #hucre-don-slot'a portallanır (kullanıcı:
  // "Ctrl+Home ile içeriğin başına dönünce, hücre yazma açıksa, ilk bulunan hayalet buton
  // 'hücreye dön' olsun ve hücreye konumlandırsın"). Slot App ile AYNI commit'te mount
  // olduğundan render sırasında değil, mount SONRASI effect ile çözülür.
  const [hucreDonSlot, setHucreDonSlot] = useState(null);
  useEffect(() => { setHucreDonSlot(document.getElementById('hucre-don-slot')); }, []);

  // Tüm dokunuş geri-bildirimleri (doğru/yanlış/sıradaki nokta/tamamlandı) TEK assertive
  // durum bölgesinden geçer → ekran okuyucu OTOMATİK okur (odak taşımadan, dokunma akışı
  // bozulmadan). TTS srAtla ile (çift duyuru yok — bölge _srBolge'ye yazmaz). Opsiyonel ses.
  const srDurumDuyur = (mesaj, ses) => {
    if (ses === 'dogru') dogruSesi();           // öğe/hücre geçişi → yükselen iki notalı ding
    else if (ses === 'nokta') noktaSesi();      // tek doğru nokta → tek notalı blip (dingden AYRI)
    else if (ses === 'yanlis') yanlisSesi();
    setSrSiradakiNokta(mesaj);
    konusDil(mesaj, { srAtla: true });
  };

  // Alt+ok kenar geçişi (step-through çok hücreli): odak + duyuru render SONRASI verilmeli.
  // rAF DEĞİL effect kullanılır — (a) bu effect, srSiradakiNokta'yı temizleyen üstteki
  // effect'ten SONRA bildirildiğinden aynı flush'ta duyuru temizliğin ÜZERİNE yazılır
  // (rAF'ta sıra garanti değildi); (b) gizli/görünmez sekmede rAF hiç tetiklenmez.
  // ⚠⚠ BU HOOK'LAR ERKEN `return`'LERDEN (okuma modu / bitti ekranı) ÖNCE DURMALI —
  // aşağıda kalırlarsa okuma moduna geçince hook sayısı düşer ve React "Rendered fewer
  // hooks than expected" (minified #300) ile bileşeni çökertir → BOŞ SAYFA (kullanıcı:
  // "hızlı dolaşım modunda boş sayfa geliyor"). Yeni hook eklerken de aynı kurala uy.
  const kenarGecisRef = useRef(null);
  useEffect(() => {
    const istek = kenarGecisRef.current;
    if (!istek) return;
    kenarGecisRef.current = null;
    srDurumDuyur(`${istek.ad}.`);
    const kok = dotSentinelRef.current?.parentElement;
    kok?.querySelector(`.cell [data-nokta="${istek.nokta}"]`)?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hucreIndeksi]);

  // ⚠ Yönerge okunurken klavye ENGELLEME KALDIRILDI (kullanıcı: "yönerge bitmesini bekleyiniz ve
  // zorla bekletmeyi kaldıralım"): noktalar her an etkileşimli; Enter/Space/ok/Tab DOĞAL çalışır
  // (Tab, yönerge bölgesinden DOM sırasıyla ilk noktaya geçer). Eski "bitmesini bekleyiniz" toast'ı
  // ve Tab-ile-kes mantığı silindi. Erken odak-çalmayı narration-bitti odak effect'indeki dot-guard önler.

  if (okumaModu) {
    return (
      <div className="page">
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            Hızlı dolaşım modu: {ogeler.length} öğe
          </div>
        </div>
        <div className="page-mid" style={{ justifyContent: 'flex-start', gap: 10, paddingTop: 8 }}>
          <OkumaModuListesi
            baslik={baslik}
            ogeler={ogeler}
            rtl={rtl}
            seslendirmeDili={seslendirmeDili}
            getEtiket={(oge) => oge.yazi}
            getTtsEtiket={(oge) => oge.ttsYazi || oge.yazi}
            /* Kartın altındaki GÖRÜNÜR küçük açıklama. `okumaAltEtiket` kısaltma
               dersleri içindir (kullanıcı: "modül 2'de kısaltmalar için hızlı gezinme
               modunda kısaltmanın altında neyin kısaltması olduğu da yazmalı") — kartta
               yalnız "A"/"BD" görünüyordu. */
            getAltEtiket={(oge) => oge.okumaAltEtiket || oge.okunus || oge.anlam}
            /* Kart için yalnız ekran okuyucu/TTS açıklaması (görsel etikete girmez) —
               kısaltma dersleri "aynı kelimesinin kısaltması, A harfi ile yazılır" der. */
            getOkumaAciklama={(oge) => oge.okumaAciklama}
            getHucreler={(oge) => oge.hucreler || []}
            onSec={okumaOgesiSec}
            onKapat={okumaModundanCik}
            ogeSesiCal={ogeSesiCal}
            ogeSesiGecikmeMs={ogeSesiGecikmeMs}
            okumaModuOgeSesiGecikmeMs={900}
            okumaModuOgeSesiAktif={typeof ogeSesiCal === 'function'}
            okumaModundaSadeceOgeSesi={okumaModundaSadeceOgeSesi}
          />
        </div>
        <div className="controls">
          <button className="btn" type="button" onClick={okumaModundanCik}>Öğrenme Moduna Dön</button>
        </div>
      </div>
    );
  }

  if (bitti) {
    const bosKayitli = kayitlilarModu && aktifListe.length === 0;
    const yazmayaYonlendir = yazmaKaynak && !bosKayitli;
    return (
      <div className="page">
        <PageHeader baslik={baslik} />
        <div className="page-mid">
          <BrailleCell aktifNoktalar={[1, 2, 3, 4, 5, 6]} />
          {/* Bitti mesajı odaklanabilir (tabIndex=-1) + bir effect mesaja odaklanır → ekran
              okuyucu "Tebrikler"i okur (kullanıcı: "tebrikler sahnesinde ekran okuyucu
              tebriklere odaklanamıyor"). aria-live YOK: odak-okuması ile çift duyuru olmasın
              (mesaj odak alınca okunur; TTS açıksa bitti effect'i ayrıca konus ile söyler). */}
          <div className="instruction success" ref={bittiMesajRef} tabIndex={-1} style={{ margin: 0 }}>
            {bosKayitli ? 'Bu bölümde henüz kaydedilmiş öğe yok.' : bittiMesaji}
          </div>
        </div>
        <div className="controls">
          {/* Sonraki içerik (aynı modülün bir sonraki dersi) — birincil eylem */}
          {sonrakiIcerik && !kayitlilarModu && (
            <button
              className="btn aktif"
              type="button"
              onClick={() => {
                konusmayiDurdur();
                konusDil('Sonraki içeriğe geçiliyor.', { kesintiyle: true });
                navigate(sonrakiIcerik.yol);
              }}
              aria-label={`Bir sonraki içerik için tıklayınız: ${sonrakiIcerik.baslik}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              <span className="btn-etiket">Sonraki İçerik</span>
            </button>
          )}
          {/* Karışık yazma etkinliğine yönlendirme */}
          {yazmayaYonlendir && (
            <button
              className={sonrakiIcerik && !kayitlilarModu ? 'btn' : 'btn aktif'}
              type="button"
              onClick={() => {
                konusmayiDurdur();
                konusDil('Karışık yazma etkinliği başlıyor.', { kesintiyle: true });
                navigate('/yazma-karisik/' + yazmaKaynak);
              }}
              aria-label="Karışık yazma etkinliğine geç"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><path d="M3 21l3-1 11-11-2-2L4 18l-1 3z"/><path d="M14 6l4 4"/></svg>
              <span className="btn-etiket">Karışık Yazma Etkinliği</span>
            </button>
          )}
          {kayitlilarModu
            ? <button className="btn" type="button" onClick={() => { setKayitlilarModu(false); setIndeks(0); }}>Tüm Listeye Dön</button>
            : <button className="btn" type="button" onClick={() => setIndeks(0)}>Baştan Başla</button>}
        </div>
      </div>
    );
  }

  const k = aktif;
  // hucreIndeksi yeni kelime daha az hücreliyse taşmış olabilir; render için sınırla
  const guvenliHucreIndeksi = Math.min(hucreIndeksi, hucreSayisi - 1);
  const aktifNoktalar = k.hucreler[guvenliHucreIndeksi] || [];
  const sonHucre = guvenliHucreIndeksi >= hucreSayisi - 1;
  const ilkKelime = indeks === 0;
  const ikiHucreTekSatir = ikiHucreYanYana && hucreSayisi === 2;

  const oncekiHucre = () => {
    tumSesleriDurdur();

    if (hucreIndeksi > 0) {
      setHucreIndeksi((i) => i - 1);
    } else if (!ilkKelime) {
      // Önceki kelimenin son hücresine git
      const oncekiUz = aktifListe[indeks - 1].hucreler.length;
      setIndeks((i) => i - 1);
      setTimeout(() => setHucreIndeksi(oncekiUz - 1), 0);
    }
  };
  const sonrakiHucre = () => {
    tumSesleriDurdur();

    if (sonHucre) {
      if (bolumAnahtari && aktif) ogrenildiIsaretle(bolumAnahtari, aktif.yazi);
      basariBildir('Sıradaki kelime.');
      setTimeout(() => setIndeks((i) => i + 1), 500);
    } else {
      setHucreIndeksi((i) => i + 1);
    }
  };

  const noktayaTikla = (n) => {
    if (basilanlar.includes(n)) return;
    if (n !== aktifNoktalar[basilanlar.length]) {
      // YANLIŞ → otomatik okunan durum bölgesi + yanlış sesi.
      setYanlis([n]);
      srDurumDuyur(
        aktifNoktalar.includes(n)
          ? `Yanlış. Sıra yanlış, önce ${aktifNoktalar[basilanlar.length]} numaraya basın.`
          : `Yanlış. ${n} numara bu hücrede yok.`,
        'yanlis',
      );
      setTimeout(() => setYanlis([]), 700);
      return;
    }
    const yeni = [...basilanlar, n];
    setBasilanlar(yeni);
    if (yeni.length < aktifNoktalar.length) {
      // DOĞRU ama hücrede başka nokta var → NOKTA SESİ (tek notalı blip) + yalnız "sıradaki nokta".
      // ⚠ Nokta sesi, geçişteki iki notalı dingden AYRI (kullanıcı: "noktalara tıklamadaki doğru
      // ses ile sayfa/öğe geçiş sesi aynı kalmış; iki ayrı ses olsun — doğru tıklamalarda farklı,
      // geçişte bu ses [ding] kalabilir"). Böylece kullanıcı "nokta doğru"yu "hücre/öğe geçiliyor"dan
      // sesle ayırt eder (test modundaki gibi bitiş net duyulur).
      // ⚠ "Doğru" SÖZCÜĞÜ KALDIRILDI (kullanıcı: "sıradaki nokta yönergesinden sonra bir
      // önceki doğru cevap için doğru diyor"): mesaj "Doğru" ile başlayıp her dokunuşta
      // tekrarlanıyordu; hızlı dokununca NVDA kuyruğu önceki dokunuşun "Doğru"sunu GEÇ
      // okuyup karıştırıyordu. Ses olumlu onayı verir (kuyruksuz), metin kısalır → gecikme yok.
      srDurumDuyur(`Sıradaki nokta: ${aktifNoktalar[yeni.length]} numara.`, 'nokta');
      return;
    }
    // Hücre tamamlandı.
    if (!sonHucre) {
      // Öğede başka hücre var → ses + kısa duyuru (yine "Doğru" sözcüğü yok) + sonraki hücre.
      srDurumDuyur('Sonraki hücreye geçiliyor.', 'dogru');
      setTimeout(() => setHucreIndeksi((i) => i + 1), 900);
      return;
    }
    // ÖĞE tamamlandı → "Tebrikler" (HEMEN değişme) → "Sonraki öğe" → SONRA geçiş (kullanıcı isteği).
    if (bolumAnahtari && aktif) ogrenildiIsaretle(bolumAnahtari, aktif.yazi);
    const sonOge = indeks >= aktifListe.length - 1;
    // "doğru" sözcüğü çıkarıldı (kullanıcı şikâyeti: gecikmeli "doğru"); ses + "Tebrikler" yeterli.
    srDurumDuyur('Tebrikler! Öğeyi tamamladınız.', 'dogru');
    setTimeout(() => {
      if (sonOge) {
        setIndeks((i) => i + 1); // son öğe → bitti ekranı (bittiMesaji okunur)
      } else {
        srDurumDuyur('Sonraki öğe.');
        setTimeout(() => setIndeks((i) => i + 1), 1200);
      }
    }, 1500);
  };

    // Ctrl+Home ile sayfa başına dönen ekran okuyucu kullanıcısı için hücreye hızlı dönüş:
    // DOM'un EN BAŞINDAKİ slot'a hayalet buton portallanır (yalnız öğrenme modunda — okuma
    // modu ve bitti ekranı bu return'e gelmez). Etkinleştirince odak hücrenin 1. noktasına.
    const hucreyeDon = () => {
      const kok = dotSentinelRef.current?.parentElement;
      // ⚠ STANDART: hücrenin 1. (İLK) noktası — `button.dot.target` (ilk hedef) DEĞİL.
      kok?.querySelector('button.dot')?.focus();
    };

    return (
      <div className="page">
        {hucreDonSlot && createPortal(
          <button type="button" className="hayalet-btn hucre-don-btn" onClick={hucreyeDon}>
            Hücreye dön
          </button>,
          hucreDonSlot
        )}
        {toast && <div className="toast" aria-live="off">{toast}</div>}
        <div>
          <PageHeader baslik={baslik} />
          <div className="progress" aria-hidden="true">
            İlerleme: {indeks + 1} / {aktifListe.length}
          {hucreSayisi > 1 && ` • Hücre ${guvenliHucreIndeksi + 1} / ${hucreSayisi}`}
        </div>
        {sesKaydiButonuGoster && typeof ogeSesiCal === 'function' && aktif && (
          <div className="controls" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8, marginBottom: 8 }}>
            <button
              className="btn"
              type="button"
              onClick={() => { tumSesleriDurdur(); ogeSesiCal(aktif); }}
              aria-label={sesKaydiButonEtiketi}
            >
              🔊
              <span className="btn-etiket">{sesKaydiButonEtiketi}</span>
            </button>
          </div>
        )}
        {ustSesKontrolleriGoster && typeof ogeSesiCal === 'function' && aktif && (
          <div className="controls" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 8, marginBottom: 8 }}>
            <button
              className="btn"
              type="button"
              onClick={() => { tumSesleriDurdur(); setOgeSesiAktif(true); if (aktif) ogeSesiCal(aktif); }}
              aria-label={ustSesButonAriaLabel}
            >
              🔊
              <span className="btn-etiket">{ustSesButonEtiketi}</span>
            </button>
          </div>
        )}
        {kayitliSayisi > 0 && (
          <div className="banner-grup-secim" style={{ margin: '4px 0 0' }}>
            <button type="button" className={`btn ${!kayitlilarModu ? 'aktif' : ''}`} aria-pressed={!kayitlilarModu} onClick={() => { setKayitlilarModu(false); setIndeks(0); }}>Tümü</button>
            <button type="button" className={`btn ${kayitlilarModu ? 'aktif' : ''}`} aria-pressed={kayitlilarModu} onClick={() => { setKayitlilarModu(true); setIndeks(0); }}>Kayıtlılar ({kayitliSayisi})</button>
          </div>
        )}
      </div>

      <div className="page-mid">
        {!bitti && (
          <div className="ders-eylem-satiri">
            <OkumaModuButonu onClick={okumaModunaGec} />
            <button
              type="button"
              className={`btn sonra-kaydet-btn sayfa-ici${kayitliAdlar.includes(aktif?.yazi) ? ' kaydedildi' : ''}`}
              onClick={kaydetSonra}
              aria-label="Daha sonra öğren listesine kaydet"
              title="Daha sonra öğren"
            >
              <svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>
        )}
        {/* Kelime/ifade yazısı — Tab ile odaklanabilir (kullanıcı: "tab bu bölümlere de
            odaklanabilmeli"): ekran okuyucu kelimenin üstüne gelince o dilde (lang) okur.
            ⚠ h3 (kullanıcı: "braille öğreniyorum h1, noktalama işaretleri h2, nokta h3"):
            uygulama adı h1 → sayfa başlığı h2 (PageHeader) → o anki öğe h3. Böylece NVDA
            "H" ile başlıklar arasında gezinirken doğrudan öğeye atlanabilir. Görünüm
            DEĞİŞMEZ: fontSize/fontWeight/margin zaten inline veriliyor, UA h3 stilini ezer. */}
        <h3
          tabIndex={0}
          lang={rtl ? 'ar' : (yabanciDil || undefined)}
          style={{
            textAlign: 'center',
            fontSize: rtl ? '1.8em' : '1.6em',
            lineHeight: rtl ? 1.5 : 1.2,
            fontWeight: 700,
            fontFamily: rtl ? "'Amasya', 'Segoe UI', sans-serif" : "'Segoe UI', sans-serif",
            color: 'var(--accent)',
            direction: rtl ? 'rtl' : 'ltr',
            margin: 0,
            padding: rtl ? '4px 0 0' : 0,
            wordBreak: 'break-word',
            maxWidth: '100%'
          }}
        >
          {k.yazi}
        </h3>

        <span ref={dotSentinelRef} tabIndex={-1} aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', outline: 'none', pointerEvents: 'none' }} />

        {/* Ekran okuyucu için (görsel YOK): yönerge CANLI bölge (aria-live=polite + atomic) —
            yönerge artık _srBolge yerine BURADAN duyurulur (lang span yabancı harfi o dilde
            okutur, kalan Türkçe tr kalır). nonce sonu görünmez karakter ile değişir → aynı
            metinde (Tekrar) bile NVDA yeniden okur. ALTINDA sıradaki nokta/dönüt AYRI canlı bölge. */}
        {(() => {
          // Yabancı dil sayfasında yönerge "ä işareti, …" gibi yabancı harfle BAŞLAR;
          // o token <span lang> ile sarılır → NVDA harfi o dilde okur, kalan Türkçe tr kalır.
          // Ses kaydı ÖNCE çalan sayfada (sesKaydiOnce) yönerge bölgesi ses bitene kadar BOŞ
          // ama DOM'da kalır → ses bitince srYonergeMetni set edilince polite bölge yönergeyi
          // bir kez okur (çakışma yok). Diğer sayfalarda eskisi gibi fallback ile dolu.
          const metin = srYonergeMetni || (sesKaydiOnce ? '' : kelimeYonergeMetniAl(k));
          if (!metin && !sesKaydiOnce) return null;
          const token = k.ttsYazi || k.yazi || '';
          const nonceEk = yonergeNonce % 2 ? ' ' : '';
          const govde = (yabanciDil && token && metin.startsWith(token))
            ? (<><span lang={yabanciDil}>{token}</span>{metin.slice(token.length)}{nonceEk}</>)
            : (<>{metin}{nonceEk}</>);
          // data-sayfa-odak: modülden sayfaya girince SayfaOdakYonetimi başlık yerine BU
          // bölgeye odaklanır → NVDA önce yönergeyi okur (başlık/gereksiz detay değil).
          // tabIndex=-1: programatik odak alır, Tab sırasına girmez.
          // ⚠ Ses KAYITLI sayfalarda (ogeSesiCal var) işaretlenmez (kullanıcı: "ses kaydı
          // olanlar hariç") → o sayfalar eski giriş davranışında (başlık) kalır.
          const sayfaOdakIsareti = typeof ogeSesiCal === 'function' ? undefined : 'yonerge';
          // aria-live: bölge ODAKLIYKEN "off" (NVDA yalnız odakla okur; canlı bölge çift
          // duyuru EKLEMEZ) — odak başkadayken "polite" (sayfa-içi geçiş/Tekrar duyurulur).
          return (
            <div
              // yonerge-sr: ses-kayıtlı sayfalarda data-sayfa-odak yok ama bölge yine de
              // programatik bulunabilsin (ör. okuma modundan dönüşte ilk içeriğe odak).
              className="sr-only yonerge-sr"
              data-sayfa-odak={sayfaOdakIsareti}
              tabIndex={-1}
              onFocus={() => setYonergeOdakta(true)}
              onBlur={() => setYonergeOdakta(false)}
              aria-live={yonergeOdakta ? 'off' : 'polite'}
              aria-atomic="true"
            >{govde}</div>
          );
        })()}
        {/* ⚠ role="status" KULLANMA: role=status örtük POLITE'tir; aria-live=assertive ile
            çelişir → NVDA polite sayıp güncellemeleri KUYRUĞA alır (kesmez) → önceki öğenin
            "Doğru. Sıradaki nokta…" duyurusu sonraki öğe yüklenince sonradan okunur (sızıntı).
            Saf aria-live=assertive: en yeni mesaj öncekini KESER + boş div "boş" okunmaz. */}
        <div className="sr-only" aria-live="assertive" aria-atomic="true">{srSiradakiNokta}</div>

        {/* Aktif hücre gösterimi */}
        {ikiHucreTekSatir ? (
          <div className="cell-row fit" style={{ '--hucre-sayisi': k.hucreler.length }}>
            {k.hucreler.map((noktalar, hucreIndex) => (
              <BrailleCell
                key={hucreIndex}
                /* Hücre üstüne görsel "1"/"2" başlık YAZMA: braille noktaları da 1–6 numaralı
                   olduğundan kullanıcı karıştırabilir (kullanıcı: "hücre başlarında 1 2 yazmasın").
                   Ekran okuyucu hücre ayrımını hucreAdi ("1. hücre") grup etiketiyle yapar. */
                hucreAdi={`${hucreIndex + 1}. hücre`}
                hedefNoktalar={noktalar}
                dogruNoktalar={hucreIndex < guvenliHucreIndeksi ? noktalar : hucreIndex === guvenliHucreIndeksi ? basilanlar : []}
                yanlisNoktalar={hucreIndex === guvenliHucreIndeksi ? yanlis : []}
                tiklanabilir={hucreIndex === guvenliHucreIndeksi}
                onNoktaTikla={noktayaTikla}
              />
            ))}
          </div>
        ) : (
          <BrailleCell
            hedefNoktalar={aktifNoktalar}
            dogruNoktalar={basilanlar}
            yanlisNoktalar={yanlis}
            tiklanabilir
            hucreAdi={hucreSayisi > 1 ? (k.hucreAdlari?.[guvenliHucreIndeksi] || `${guvenliHucreIndeksi + 1}. hücre`) : undefined}
            onNoktaTikla={noktayaTikla}
            // Alt+ok yatay kenarında AKTİF HÜCREYİ değiştir (kullanıcı: "/fen-kimya gibi
            // çok hücrelilerde de bu sistem çalışmalı") — 3+ hücreli öğeler yan yana
            // çizilmediğinden geçiş DOM'da değil state'le yapılır (önizleme tıklamasıyla
            // aynı yol: setHucreIndeksi; hücre-içi basilanlar effect'i zaten sıfırlar).
            // En dış kenarda hedefIdx taşarsa hiçbir şey yapılmaz → sayfa/öğe DEĞİŞMEZ.
            onHucreKenari={hucreSayisi > 1 ? (yon, satir) => {
              const hedefIdx = guvenliHucreIndeksi + yon;
              if (hedefIdx < 0 || hedefIdx >= hucreSayisi) return;
              // Yan yana dizilimle aynı his: sağa geçişte yeni hücrenin SOL sütunu
              // (nokta = satir 1-3), sola geçişte SAĞ sütunu (satir+3). Odak + "N. hücre"
              // duyurusu render SONRASI kenarGecisRef effect'inde verilir (bkz. tanımı).
              kenarGecisRef.current = {
                nokta: yon === 1 ? satir : satir + 3,
                ad: k.hucreAdlari?.[hedefIdx] || `${hedefIdx + 1}. hücre`,
              };
              setHucreIndeksi(hedefIdx);
            } : undefined}
            baslikAriaLabel={hucreSayisi > 1
              ? `${guvenliHucreIndeksi + 1}. hücre, toplam ${hucreSayisi} hücreden`
              : k.yazi}
          />
        )}

        {/* Tüm hücrelerin küçük önizlemesi — aktif olan vurgulanır */}
        {hucreSayisi > 1 && !ikiHucreTekSatir && (
          <div className="hucre-onizleme" role="tablist" aria-label="Hücre listesi">
            {k.hucreler.map((noktalar, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === guvenliHucreIndeksi}
                className={`btn hucre-onizleme-oge ${i === guvenliHucreIndeksi ? 'aktif' : ''}`}
                onClick={() => setHucreIndeksi(i)}
                aria-label={`${i + 1}. hücreye git`}
              >
                <span className="hucre-onizleme-grid" aria-hidden="true">
                  {[1, 4, 2, 5, 3, 6].map((n) => (
                    <span
                      key={n}
                      className={`hucre-onizleme-nokta ${noktalar.includes(n) ? 'on' : ''}`}
                    />
                  ))}
                </span>
                <span className="hucre-onizleme-no" aria-hidden="true">{i + 1}</span>
              </button>
            ))}
          </div>
        )}

        {/* Okunuş + anlam */}
        {k.okunus && (
          <div role="status" aria-live="polite"
               style={{ textAlign: 'center', fontSize: '1.15em', color: 'var(--accent)', fontWeight: 700 }}>
            &ldquo;{k.okunus}&rdquo;
          </div>
        )}
        {k.altMetin && (
          <div aria-hidden="true" style={{ textAlign: 'center', fontSize: '1.4em', color: 'var(--accent)', fontWeight: 700, fontFamily: /[؀-ۿ]/.test(k.altMetin) ? "'Amasya', 'Segoe UI', sans-serif" : "'Segoe UI', sans-serif" }}>
            {k.altMetin}
          </div>
        )}
        {k.anlam && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.9em', maxWidth: 560, margin: '0 auto' }}>
            {k.anlam}
          </div>
        )}
        {k.altMetinAciklama && (
          <div aria-hidden="true" style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.95em', maxWidth: 520 }}>
            {k.altMetinAciklama}
          </div>
        )}
        {k.ekBilgi && (
          <div className="isaret-metin-alti" aria-live="polite" style={{ width: '100%', maxWidth: 520 }}>
            {k.ekBilgi.aciklama && <p style={{ margin: '0 0 0.75em 0' }}>{k.ekBilgi.aciklama}</p>}
            {k.ekBilgi.kurallar?.length > 0 && (
              <>
                <strong>Kullanıldığı yerler:</strong>
                <ul style={{ margin: '0.3em 0 0.8em 1.2em', padding: 0 }}>
                  {k.ekBilgi.kurallar.map((kr, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{kr}</li>)}
                </ul>
              </>
            )}
            {k.ekBilgi.ornekler?.length > 0 && (
              <>
                <strong>Örnek:</strong>
                <ul style={{ margin: '0.3em 0 0 1.2em', padding: 0 }}>
                  {k.ekBilgi.ornekler.map((o, i) => <li key={i} style={{ marginBottom: '0.3em' }}>{o}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="controls">
        <button
className="btn"           type="button"
          aria-label="Tekrar dinle"
          onClick={() => {
            tumSesleriDurdur();

            const sesAktifMi = ogeSesiHerZaman || ogeSesiAktif;
            const tekrarMetni = kelimeYonergeMetniAl(aktif || k);
            const sesOncesiTekrarMetni = typeof aktif?.sesOncesiYonergeMetni === 'string'
              ? aktif.sesOncesiYonergeMetni.trim()
              : '';

            if (ogeSesiOnceCal && sesAktifMi && typeof ogeSesiCal === 'function' && aktif) {
              const sesiCalSonraTekrarOku = () => {
                ogeSesiCal(aktif);

                if (tekrarSesiTimerRef.current) {
                  clearTimeout(tekrarSesiTimerRef.current);
                }

                tekrarSesiTimerRef.current = window.setTimeout(() => {
                  // Ses bitti → yönergeyi NVDA bölgesine yaz + nonce ile yeniden duyur.
                  setSrYonergeMetni(tekrarMetni);
                  setYonergeNonce((n) => n + 1);
                  yonergeyiKilitleyerekSeslendir(tekrarMetni, { kesintiyle: true });
                  tekrarSesiTimerRef.current = null;
                }, ogeSesiSonrasiKonusmaGecikmeMs);
              };

              if (sesOncesiTekrarMetni) {
                konus(sesOncesiTekrarMetni, {
                  kesintiyle: true,
                  onSon: sesiCalSonraTekrarOku
                });
              } else {
                sesiCalSonraTekrarOku();
              }

              return;
            }

            yonergeyiKilitleyerekSeslendir(tekrarMetni, { kesintiyle: true });

            if (sesAktifMi && typeof ogeSesiCal === 'function' && aktif) {
              if (tekrarSesiTimerRef.current) {
                clearTimeout(tekrarSesiTimerRef.current);
              }

              tekrarSesiTimerRef.current = window.setTimeout(() => {
                ogeSesiCal(aktif);
                tekrarSesiTimerRef.current = null;
              }, ogeSesiGecikmeMs);
            }
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <span className="btn-etiket">Tekrar</span>
        </button>
        <button
          className="btn"
          type="button"
          aria-label="Sıfırla — en başa dön"
          onClick={() => {
            tumSesleriDurdur();
            setIndeks(0);
            setHucreIndeksi(0);
            setBasilanlar([]);
            setYanlis([]);
            konusDil('En başa dönüldü.');
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
          <span className="btn-etiket">Sıfırla</span>
        </button>
        {hucreSayisi > 1 ? (
          <>
            <button className="btn" type="button" aria-label="Önceki öğe" disabled={ilkKelime && hucreIndeksi === 0} onClick={oncekiHucre}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              <span className="btn-etiket">Önceki öğe</span>
            </button>
            <button className="btn" type="button" aria-label={sonHucre ? 'Sonraki öğe' : 'Sonraki öğe'} onClick={sonrakiHucre}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              <span className="btn-etiket">Sonraki öğe</span>
            </button>
          </>
        ) : (
          <>
            <button className="btn" type="button" aria-label="Önceki öğe" disabled={ilkKelime}
                    onClick={() => { tumSesleriDurdur(); setIndeks((i) => Math.max(0, i - 1)); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
              <span className="btn-etiket">Önceki öğe</span>
            </button>
            <button
              className="btn"
              type="button"
              aria-label="Sonraki öğe"
              onClick={() => {
                tumSesleriDurdur();
                basariBildir('Sıradaki.');
                setTimeout(() => setIndeks((i) => i + 1), 500);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" width="22" height="22"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
              <span className="btn-etiket">Sonraki öğe</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

