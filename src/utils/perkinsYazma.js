// Perkins (6 nokta) yazımının TEK HÜCRELİ çözücüsü — durum makinesi.
//
// ⚠ Bu kod ESKİDEN `components/BrailleKlavye.jsx` içindeydi; node ile test edilebilmesi
// (bkz. `scripts/braille-perkins-qa.mjs` / `npm run qa:perkins`) ve çok-hücreli sembol
// desteğinin tek yerde durması için saf JS util'e taşındı. `BrailleKlavye.jsx` geriye
// dönük uyumluluk için bu üç fonksiyonu yeniden dışa aktarır (var olan tüm importlar
// çalışmaya devam eder).
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
  duzeltmeYabanciHarfIsaretiMi,
  duzeltmeliHucreyiMetneCevir,
  hucreyiSiraSayisiRakaminaCevir,
  tarihAyirmaIsaretiMi,
  tarihHucreAraligi,
  noktalariAnahtara,
  matematikSembolHucreEslesmesi,
  matematikIsaretiSayiModunuKorurMu,
  matematikKumeReddiMi,
  matematikSayiBaglamiIleride,
  sayiModundaKesmeIsaretiMi,
} from './brailleCevir.js';

/**
 * Hücreyi karaktere çevirirken sayı/büyük harf modunu da takip eden
 * küçük yardımcı state makinesi. Sayfaların kullanması için.
 */
export function yeniYazmaDurumu() {
  // duzeltmeBekle: [4] düzeltme/yabancı harf işareti yazıldı → SONRAKİ hücre â/î/û/ô/ê/q/w/x olur.
  // tumuBuyuk: [6][6] (hepsi büyük) → boşluğa kadar TÜM harfler büyük yazılır.
  // oncekiBosMu: önceki hücre boşluk muydu (metin başı da boşluk sayılır) → [2,3,6]'nın
  //   açılış tırnağı mı yoksa soru işareti mi olduğunu belirler.
  // rakamSayaci: kesintisiz yazılan rakam adedi — [3]'ün bölük ayırıcı mı ("1.000") kesme
  //   işareti mi ("1922'de") olduğu buna bakılarak karara bağlanır (bkz. hucreyiIsle ileri bakış).
  return {
    sayiModu: false,
    buyukSiradaki: false,
    duzeltmeBekle: false,
    tumuBuyuk: false,
    oncekiBosMu: true,
    rakamSayaci: 0,
    // Son yazılan hücreler (en çok GECMIS_SINIRI): bağlam kuralları (tarih ayırıcı,
    // kesir çizgisi, bölük/kesme) çözülen hücrenin ÖNCESİNE de bakar.
    gecmis: [],
  };
}

// [2,3,6] HEM soru işareti HEM açılış tırnağıdır. Canlı yazımda ileriye bakılamaz
// (kapanış henüz yazılmamıştır) → KONUM karar verir: kelime başında (metin başı veya
// boşluktan sonra) AÇILIŞ TIRNAĞI, bir karaktere bitişikse SORU İŞARETİ.
// (kullanıcı: "236 yazdığımızda … bir cümle kelime yoksa ilk tırnak olarak algılamalıydı")
const ANAHTAR_SORU_TIRNAK = '2,3,6';

/**
 * @param {{sayiModu:boolean, buyukSiradaki:boolean, duzeltmeBekle?:boolean, tumuBuyuk?:boolean}} durum  (mutate edilir)
 * @param {number[]} noktalar
 * @param {number[][]} [sonrakiler]  İLERİ BAKIŞ: bu hücreden SONRAKİ hücreler (opsiyonel).
 *   Verilirse çok hücreli semboller (matematik operatörleri) ve sayı içi noktalama doğru
 *   çözülür; dönen `tuketilen` kaç hücrenin harcandığını söyler (çağıran o kadar atlamalı).
 *   Verilmezse davranış ESKİSİYLE AYNI kalır (yalnız tek hücre; `tuketilen` daima 1).
 * @returns {{ tip:'karakter'|'isaret'|'bilinmeyen', deger:string|null, anons:string, tuketilen:number }}
 */
export function hucreyiIsle(durum, noktalar, sonrakiler) {
  // Sıra sayısı bitti mi? (durum sıra modundayken indirgenmiş rakam OLMAYAN hücre geldi)
  // → üretilecek karakterin ÖNÜNE nokta konur: "2" + "." + sonraki karakter.
  const siraBitiyor = durum.siraSayiModu
    && !(durum.sayiModu && hucreyiSiraSayisiRakaminaCevir(noktalar));
  const sonuc = _hucreyiCoz(durum, noktalar, Array.isArray(sonrakiler) ? sonrakiler : null);
  if (siraBitiyor && sonuc.tip === 'karakter' && typeof sonuc.deger === 'string') {
    durum.siraSayiModu = false;
    sonuc.deger = `.${sonuc.deger}`;
    sonuc.anons = sonuc.deger === '. ' ? 'boşluk' : sonuc.anons;
  }
  // Her hücreden SONRA "önceki boş muydu" bilgisini tazele (tırnak/soru kararı için).
  durum.oncekiBosMu = !noktalar || noktalar.length === 0;
  // Bağlam kuralları için son hücreler saklanır (tarih/kesir/bölük kararları).
  if (!Array.isArray(durum.gecmis)) durum.gecmis = [];
  durum.gecmis.push(noktalar);
  if (durum.gecmis.length > GECMIS_SINIRI) durum.gecmis.shift();
  if (typeof sonuc.tuketilen !== 'number') sonuc.tuketilen = 1;
  return sonuc;
}

/**
 * İLERİ BAKIŞLI çözüm — ÇOK HÜCRELİ matematik sembolü ve sayı içi noktalama.
 *
 * ⚠ Neden gerekli (kullanıcı: "perkins yazımı tüm kapsam ciddi şekilde araştırılmalı, tüm
 * tutarsızlıklar giderilmeli"): bu durum makinesi hücreleri TEK TEK çözer; matematik
 * operatörleri ise iki/üç hücrelidir ('=' [5,6]+[2,3,5,6], '<' [3]+[2,4,6], '≤' üç hücre).
 * İleri bakış olmadan '=' → ')' , '×' → '?' , '√' → 'ş' okunuyordu (metin→brf'te ölçüldü:
 * 60 örnekte 27 hata). Modül 10 metin→brf artık blok çözücüyü kullanır; bu yol Serbest
 * Yazma / Yazma Eğitimi gibi hücre-hücre çözen sayfalar içindir.
 * Tek hücreli matematik sembolleri Türk harfleriyle çakıştığından (√=ş, %=y, (=ğ, |=l)
 * yalnız SAYI BAĞLAMINDA kabul edilir — düz yazı bozulmasın.
 */
const ANAHTAR_PAREN = '2,3,5,6'; // düz-yazı parantezi: aç/kapa AYNI hücre, yönü KONUM belirler
// Bağlam kuralları en fazla bu kadar geriye bakar (tarih deseni "#23 [3-6] 4 [3-6] #1923").
const GECMIS_SINIRI = 12;

function _ileriBakisCoz(durum, noktalar, sonrakiler) {
  // GEÇMİŞ + şimdiki + gelecek hücreler tek diziye konur: blok çözücülerin bağlam kuralları
  // (kesir çizgisi iki yanında operand, tarih ayırıcı deseni, bölük/kesme kararı) hücrenin
  // ÖNCESİNE de bakar; yalnız ileriye bakmak yetmiyordu ("1/2"→"12", "23.4.1923"→"23-4-1923").
  const gecmis = Array.isArray(durum.gecmis) ? durum.gecmis : [];
  const dizi = [...gecmis, noktalar, ...sonrakiler];
  const bas = gecmis.length;
  const anahtar = noktalariAnahtara(noktalar);

  // 1) Matematik sembolü (çok hücreli daima; tek hücreli yalnız sayı bağlamında)
  const isaret = matematikSembolHucreEslesmesi(dizi, bas);
  if (isaret && !matematikKumeReddiMi(isaret, dizi, bas + isaret.hucreler.length)) {
    const cokHucreli = isaret.hucreler.length >= 2;
    const sayiBaglami = durum.sayiModu
      || matematikSayiBaglamiIleride(dizi, bas + isaret.hucreler.length);
    if (cokHucreli || sayiBaglami) {
      // Operatörden sonra sayı modu yalnız karşılaştırma/üs gibi işaretlerde sürer.
      durum.sayiModu = durum.sayiModu && matematikIsaretiSayiModunuKorurMu(isaret);
      if (!durum.sayiModu) durum.rakamSayaci = 0;
      durum.buyukSiradaki = false;
      durum.tumuBuyuk = false;
      return { tip: 'karakter', deger: isaret.sembol, anons: isaret.ad, tuketilen: isaret.hucreler.length };
    }
  }

  // 2) Düz-yazı parantezi [2,3,5,6]: kelime BAŞINDA '(' , bitişikse ')' — [2,3,6] tırnak/soru
  //    kuralının ikizi (blok çözücüde bunu `parenKonumlu` peel'i yapar).
  if (anahtar === ANAHTAR_PAREN) {
    const acilis = durum.oncekiBosMu !== false;
    if (acilis || !durum.siraSayiModu) {
      durum.sayiModu = false;
      durum.rakamSayaci = 0;
      return {
        tip: 'karakter',
        deger: acilis ? '(' : ')',
        anons: acilis ? 'parantez açma' : 'parantez kapama',
        tuketilen: 1,
      };
    }
  }

  if (!durum.sayiModu || durum.siraSayiModu) return null;

  // 3) Sayı içi [3]: bölük ayırıcı ("1.000") mı kesme işareti ("1922'de") mi?
  if (anahtar === '3' && hucreyiRakamayap(sonrakiler[0])) {
    // Karar ÖNCEKİ rakam adedine de bakar → gerçek geçmiş dizisiyle sorulur.
    if (sayiModundaKesmeIsaretiMi(dizi, bas)) {
      durum.sayiModu = false;
      durum.rakamSayaci = 0;
      return { tip: 'karakter', deger: '’', anons: 'kesme işareti', tuketilen: 1 };
    }
    return { tip: 'karakter', deger: '.', anons: 'bölük ayırıcı', tuketilen: 1 };
  }

  // 3b) TARİH AYIRICI [3,6] ("23.4.1923") — blok çözücülerde `tarihHucreAraligi` ile
  //     ayırt edilir; ileri bakış olmadan sayı-aralığı tiresi sanılıp "23-4-1923" oluyordu.
  if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(dizi, bas)) {
    return { tip: 'karakter', deger: '.', anons: 'tarih ayırıcı', tuketilen: 1 };
  }

  // 4) Sayı içi [2] + rakam → ONDALIK VİRGÜL ("2,5"). ([2] aynı zamanda rakam 1'dir →
  //    ileri bakış olmadan "2,5" → "21.5" okunuyordu.)
  if (anahtar === '2' && hucreyiRakamayap(sonrakiler[0])) {
    return { tip: 'karakter', deger: ',', anons: 'virgül', tuketilen: 1 };
  }

  // 5) İKİ SAYI ARASINDAKİ NOKTALAMA (blok çözücü `sayiIciNoktalama` ikizi): "Saat 12.30"
  //    cümle içinde `#12 . #30` olarak kodlanır; '.' [2,5,6] aynı zamanda indirgenmiş
  //    rakam 4 → sıra sayısı sanılıp "124.30" okunuyordu.
  const noktalamaKarakter = hucreyiKarakteryap(noktalar);
  if (noktalamaKarakter && !hucreyiRakamayap(noktalar) && sonrakiler.length
    && sayiIsaretiMi(sonrakiler[0])) {
    return { tip: 'karakter', deger: noktalamaKarakter, anons: noktalamaKarakter, tuketilen: 1 };
  }

  return null;
}

/**
 * Metin BİTTİĞİNDE bekleyen sıra-sayısı noktasını döndürür ("2" → "2.").
 * Hücre hücre çözen sayfalar (YazmaSerbest normalModMetni, Araclar Perkins) son
 * hücreden sonra bunu çağırmalıdır.
 */
export function yazmaDurumunuSonlandir(durum) {
  if (durum && durum.siraSayiModu) {
    durum.siraSayiModu = false;
    return '.';
  }
  return '';
}

function _hucreyiCoz(durum, noktalar, sonrakiler) {
  // İleri bakış verildiyse ÖNCE çok hücreli sembol / sayı içi noktalama denenir.
  // (Düzeltme işareti bekleniyorsa ara verme: [4] öneki kendi harfini tamamlamalı.)
  // (sonrakiler BOŞ DİZİ de olabilir — son hücre; o zaman da tek hücreli sembol/paren
  //  kuralları çalışmalı: "|−7|" kapanış '|' son hücredir.)
  if (sonrakiler && !durum.duzeltmeBekle && noktalar && noktalar.length) {
    const ileri = _ileriBakisCoz(durum, noktalar, sonrakiler);
    if (ileri) return ileri;
  }
  // ⚠ DÜZELTME/YABANCI HARF İŞARETİ [4] (kullanıcı: "metin→brf'de Perkins klavyede 3 4
  // (s ve j tuşları) yazmıyor"): [4] tek başına bir KARAKTER değil, ÖNEKtir; ardından gelen
  // harfle birlikte â/î/û/ô/ê veya q/w/x üretir. Eskiden hucreyiIsle bunu bilmediğinden
  // hem [4] hem de ardındaki harf "tanınmayan hücre" olup HİÇBİR ŞEY yazılmıyordu.
  if (duzeltmeYabanciHarfIsaretiMi(noktalar)) {
    durum.duzeltmeBekle = true;
    durum.sayiModu = false;
    return { tip: 'isaret', deger: null, anons: 'düzeltme işareti' };
  }
  if (durum.duzeltmeBekle) {
    durum.duzeltmeBekle = false;
    const duzeltmeli = duzeltmeliHucreyiMetneCevir(noktalar);
    if (duzeltmeli) {
      const buyuk = durum.buyukSiradaki || durum.tumuBuyuk;
      if (durum.buyukSiradaki) durum.buyukSiradaki = false;
      const cikti = buyuk ? duzeltmeli.toLocaleUpperCase('tr') : duzeltmeli;
      return { tip: 'karakter', deger: cikti, anons: cikti };
    }
    // Düzeltme işaretinden sonra tanınmayan hücre: normal çözüme düş.
  }
  if (sayiIsaretiMi(noktalar)) {
    durum.sayiModu = true;
    durum.rakamSayaci = 0;
    durum.buyukSiradaki = false;
    durum.tumuBuyuk = false;
    // ⚠ SIRA SAYISI MODU yalnız SAYI İŞARETİNİN HEMEN ARDINDAN indirgenmiş rakam gelirse
    // açılır (blok çözücü `siraSayiModu = !!sonrakSira && !sonrakDigit` ikizi). İleri bakış
    // yoksa eski davranış korunur (aşağıdaki rakam dalı sıra rakamını kendi açar).
    if (sonrakiler && sonrakiler.length) {
      const s = sonrakiler[0];
      durum.siraSayiModu = !!hucreyiSiraSayisiRakaminaCevir(s) && !hucreyiRakamayap(s);
      durum.ileriBakisliSira = true;
    }
    return { tip: 'isaret', deger: null, anons: 'sayı işareti' };
  }
  if (buyukHarfIsaretiMi(noktalar)) {
    // ⚠ İKİNCİ [6] = HEPSİ BÜYÜK (kullanıcı: "hepsi büyük serbest yazmada çalışmıyor"):
    // art arda iki büyük harf işareti, boşluğa kadar tüm harfleri büyütür. Eskiden ikinci
    // [6] yalnız `buyukSiradaki`'yi tekrar true yapıyordu → yalnız BİR harf büyüyordu.
    if (durum.buyukSiradaki) {
      durum.buyukSiradaki = false;
      durum.tumuBuyuk = true;
      durum.sayiModu = false;
      return { tip: 'isaret', deger: null, anons: 'hepsi büyük harf işareti' };
    }
    durum.buyukSiradaki = true;
    durum.sayiModu = false;
    return { tip: 'isaret', deger: null, anons: 'büyük harf işareti' };
  }
  if (durum.sayiModu) {
    const r = hucreyiRakamayap(noktalar);
    // Kesintisiz rakam sayacı: [3]'ün bölük mü kesme mi olduğu buna bakar (bkz. _ileriBakisCoz).
    if (r) { durum.rakamSayaci = (durum.rakamSayaci || 0) + 1; return { tip: 'karakter', deger: r, anons: r }; }
    // ⚠ SIRA SAYISI — İNDİRGENMİŞ RAKAMLAR (kullanıcı: "rakam işaretinden sonra 23
    // tuşladığımda 2. olmalıydı; serbest yazmada kabul etmedi, metin→brf'de sorun yok"):
    // sıra sayıları alta kaydırılmış rakamlarla yazılır ([2]=1, [2,3]=2 …) ve sonuna
    // NOKTA gelir. `hucreyiRakamayap` yalnız normal rakamları bilir → hücre tanınmıyordu.
    // Nokta, sıra sayısı BİTİNCE eklenir (sonraki hücre indirgenmiş rakam değilse ya da
    // metin biterse) — bu yüzden durumda `siraSayiModu` tutulur.
    // İleri bakışlı çağrıda sıra modu SAYI İŞARETİNDE karara bağlanır (yukarı); orada
    // açılmadıysa indirgenmiş rakam okunmaz — aksi halde ')' [2,3,5,6] "7." , '.' [2,5,6]
    // "4" gibi okunup "12.30" → "124.30" oluyordu (blok çözücüyle aynı kural).
    const sira = (durum.ileriBakisliSira && !durum.siraSayiModu)
      ? null
      : hucreyiSiraSayisiRakaminaCevir(noktalar);
    if (sira) {
      durum.siraSayiModu = true;
      return { tip: 'karakter', deger: sira, anons: sira };
    }
    // KURAL: sayı aralığı tiresi [3,6] sayı modunu BOZMAZ (1233-1334) —
    // tireden önce sayı geliyorsa tireden sonra gelen de sayıdır.
    const anah = [...noktalar].sort((a, b) => a - b).join(',');
    if (anah === '3,6') { durum.rakamSayaci = 0; return { tip: 'karakter', deger: '-', anons: 'tire' }; }
    durum.sayiModu = false;
    durum.rakamSayaci = 0;
  }
  // [2,3,6]: kelime başında AÇILIŞ TIRNAĞI, bitişikse SORU İŞARETİ (bkz. ANAHTAR_SORU_TIRNAK).
  if ([...noktalar].sort((a, b) => a - b).join(',') === ANAHTAR_SORU_TIRNAK) {
    if (durum.oncekiBosMu !== false) {
      return { tip: 'karakter', deger: '“', anons: 'tırnak açma' };
    }
    return { tip: 'karakter', deger: '?', anons: 'soru işareti' };
  }
  const k = hucreyiKarakteryap(noktalar);
  if (k === null) return { tip: 'bilinmeyen', deger: null, anons: 'tanınmayan hücre' };
  let cikti = k;
  if (k === ' ') {
    // Boşluk kelimeyi bitirir → "hepsi büyük" etkisi de burada sona erer.
    durum.tumuBuyuk = false;
    durum.buyukSiradaki = false;
  } else if (durum.buyukSiradaki || durum.tumuBuyuk) {
    cikti = k.toLocaleUpperCase('tr');
    durum.buyukSiradaki = false; // tumuBuyuk KORUNUR (boşluğa kadar sürer)
  } else {
    cikti = k.toLocaleLowerCase('tr');
  }
  return { tip: 'karakter', deger: cikti, anons: cikti === ' ' ? 'boşluk' : cikti };
}
