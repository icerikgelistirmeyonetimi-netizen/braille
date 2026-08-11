import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI,
  NOKTALAMA,
} from '../data/braille.js';
import {
  hucreyiKarakteryap,
  hucreyiRakamayap,
  hucreyiSiraSayisiRakaminaCevir,
  buyukHarfIsaretiMi,
  sayiIsaretiMi,
  tekKucukHarfIsaretiMi,
  tarihAyirmaIsaretiMi,
  tarihHucreAraligi,
  duzeltmeYabanciHarfIsaretiMi,
  duzeltmeliHucreyiMetneCevir,
  tekHarfIsaretiSonrasiHarfOkuma,
  ikiHarfliKisaltmaOkunusunuYumusat,
  kelimeKokuOkunusunuYorIcinDuzelt,
  matematikIsaretiSayiModunuKorurMu,
  matematikSembolHucreEslesmesi,
  noktalariAnahtara,
  kelimeIciSayiIsaretiKiMi,
} from './brailleCevir.js';

// ─── BRF → nokta dizisi ────────────────────────────────────────────────────
// Standart North American Braille ASCII tablosundan (tek doğruluk kaynağı).
// Eski "code - 0x20" eşlemesi yanlıştı; dışa aktarımla tutarsızdı.
// Hem local kullanım (aşağıda) hem dışa aktarım için: import + re-export.
import { brfNoktalaradon } from './brailleAscii.js';
export { brfNoktalaradon };

// ─── Ters arama tabloları ──────────────────────────────────────────────────
const _KISALTMA_TEK = new Map(
  KELIME_KISALTMALARI.map((k) => [
    [...k.noktalar].sort((a, b) => a - b).join(','),
    k.kelime,
  ])
);
const _KISALTMA_IKI = (() => {
  const m = new Map();
  for (const k of IKI_HARFLI_KISALTMALAR) {
    const key =
      [...k.sol].sort((a, b) => a - b).join(',') +
      '|' +
      [...k.sag].sort((a, b) => a - b).join(',');
    m.set(key, k.kelime);
  }
  return m;
})();
const _HECE_TERS = new Map(
  HECE_KISALTMALARI.map((h) => [
    [...h.noktalar].sort((a, b) => a - b).join(','),
    h.hece,
  ])
);

const _KOK_SAG_MAP = new Map(
  KELIME_KOKU_KISALTMALARI.map((k) => [
    [...k.sag].sort((a, b) => a - b).join(','),
    k,
  ])
);

const _PARCA_MAP = new Map(
  KELIME_PARCASI_KISALTMALARI.map((p) => [
    [...p.sol].sort((a, b) => a - b).join(',') + '|' + [...p.sag].sort((a, b) => a - b).join(','),
    p,
  ])
);

const _NOKTA_TERS = new Map(
  NOKTALAMA.map((n) => [
    [...n.noktalar].sort((a, b) => a - b).join(','),
    n.isaret,
  ])
);
// [2,3,6] hem soru işareti (?) hem tırnak açma hücresidir; Türkçe'de ? baskın olduğundan
// decode'da ? tercih edilir (aksi hâlde "son yazan kazanır" tırnağa çözer, ? round-trip bozulur).
_NOKTA_TERS.set('2,3,6', '?');

// [2,3,6] hücresi tırnak AÇMA (“) mı yoksa soru işareti (?) mi? (kullanıcı: "tırnak açılıp
// kapanması lazım; tek başına geldiğinde ? olarak algılanmalı"):
//  • Açılış tırnağı BOŞLUKTAN/başlangıçtan sonra gelir (sonraki kelimenin başına yapışır).
//  • Soru işareti bir KARAKTERE (harf/rakam…) bitişik gelir.
// → önceki hücre dolu (bir karakter) ise soru işareti; boşluk/başlangıç ise VE ardında içerik +
//   ileride EŞLEŞEN kapanış tırnağı [3,5,6] varsa açılış tırnağı. (Kapanış [3,5,6] zaten ” çözülür.)
function acilisTirnagiMi(b, ci) {
  const onceki = ci > 0 ? b[ci - 1] : null;
  if (onceki && onceki.length > 0) return false;          // bir karaktere bitişik → soru işareti
  const sonraki = ci + 1 < b.length ? b[ci + 1] : null;
  if (!sonraki || sonraki.length === 0) return false;      // ardında boşluk/hiç → tek başına ?
  for (let k = ci + 1; k < b.length; k++) {
    if ([...b[k]].sort((a, x) => a - x).join(',') === '3,5,6') return true;  // eşleşen kapanış var
  }
  return false;
}

// Ünlü uyumuna göre doğru ek varyantını seç
const _ARKA_UNLU = new Set(['a', 'ı', 'o', 'u']);
const _ON_UNLU   = new Set(['e', 'i', 'ö', 'ü']);
const _DUZ_UNLU  = new Set(['a', 'e', 'ı', 'i']);
const _YUV_UNLU  = new Set(['o', 'ö', 'u', 'ü']);
const _TUM_UNLU  = new Set([..._ARKA_UNLU, ..._ON_UNLU]);
function _unluUyumuSec(ekler, oncekiMetin) {
  const variants = ekler.split(',').map((s) => s.trim());
  if (variants.length <= 1) return variants[0] || '';
  const oncekiKucuk = (oncekiMetin || '').toLocaleLowerCase('tr');
  if (oncekiKucuk.endsWith('bu') && variants.includes('gün')) return 'gün';
  let sonUnlu = null;
  for (let k = oncekiMetin.length - 1; k >= 0; k--) {
    if (_TUM_UNLU.has(oncekiMetin[k])) { sonUnlu = oncekiMetin[k]; break; }
  }
  if (!sonUnlu) return variants[0];
  const arkaVar = _ARKA_UNLU.has(sonUnlu);
  const yuvVar  = _YUV_UNLU.has(sonUnlu);
  for (const v of variants) {
    const ilkUnlu = [...v].find((c) => _TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    const ilkArka = _ARKA_UNLU.has(ilkUnlu);
    const ilkYuv  = _YUV_UNLU.has(ilkUnlu);
    if (ilkArka === arkaVar && ilkYuv === yuvVar) return v;
  }
  for (const v of variants) {
    const ilkUnlu = [...v].find((c) => _TUM_UNLU.has(c));
    if (!ilkUnlu) continue;
    if (_ARKA_UNLU.has(ilkUnlu) === arkaVar) return v;
  }
  return variants[0];
}

export function brfMetinedonSistemi(icerik, kisaltmali, sistemler = {}) {
  const {
    hece: heceAktif = true,
    birHarf: birHarfAktif = true,
    ikiHarf: ikiHarfAktif = true,
    kok: kokAktif = true,
    parca: parcaAktif = true,
  } = sistemler;
  const satirlar = icerik.split(/[\r\n\f]+/);
  let metin = '';
  let sayiModu = false;
  let siraSayiModu = false;
  let ciftListeVirgulle = false;
  let cListeSonTekIsaretSonrasi = false;
  let buyukHarfBekle = false;
  const noktalamaHucreMi = (hucre) => !!hucre && _NOKTA_TERS.has(noktalariAnahtara(hucre));
  const matematikSayiSinirAnahtarlari = new Set([
    '1,2',
    '1,2,6',
    '3,4,5',
    '3,4',
    '1,3,4,5,6',
    '1,3,5',
    '2,4,6',
    '2,3,5,6',
    '3,4,6',
    '3,5,6',
    '1,4,6',
    '2,3,6',
    // '2,6' = artı (+) operatörünün son hücresi (ISLEM.arti = [5,6][2,6]); sayı-öncesi sınır.
    // Eskiden '?'=[2,6] olduğundan noktalamaHucreMi ile kapanıyordu; '?' [2,3,6]'ya taşındı,
    // 've'=[2,6] (boşlukla ayrık → etkilenmez). Diğer operatör son hücreleriyle ('2,3,6'=×) tutarlı.
    '2,6',
    '1,2,4',
    '1,5',
    '2,3,4,6',
    '2,4,5,6',
  ]);
  const sayiIsaretiOncesiSinirMi = (hucre) => {
    const a = !hucre || hucre.length === 0 ? '' : noktalariAnahtara(hucre);
    return (
      !hucre
      || hucre.length === 0
      || buyukHarfIsaretiMi(hucre)
      || noktalamaHucreMi(hucre)
      || matematikSayiSinirAnahtarlari.has(a)
      || a === '1,2,3'
      || a === '4,5,6'
    );
  };
  const harfliSayiHarfOku = (hucreler, index) => {
    if (index < 0 || index >= hucreler.length || !tekKucukHarfIsaretiMi(hucreler[index])) return null;
    let harfIndex = index + 1;
    let buyuk = false;
    if (harfIndex < hucreler.length && buyukHarfIsaretiMi(hucreler[harfIndex])) {
      buyuk = true;
      harfIndex++;
    }
    if (harfIndex >= hucreler.length) return null;
    const harf = hucreyiKarakteryap(hucreler[harfIndex]);
    if (!harf || harf === ' ') return null;
    return {
      metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
      sonrakiIndex: harfIndex + 1,
    };
  };
  if (kisaltmali) {
    const sayfalar = icerik.split(/\f/);
    const sayfaCiktilari = [];
    for (const sayfa of sayfalar) {
      const duzMetin = sayfa.replace(/[\r\n]+/g, '');
      if (!duzMetin.trim()) continue;
      const hucreleri = [];
      for (const ch of duzMetin) {
        const n = brfNoktalaradon(ch);
        if (n !== null) hucreleri.push(n);
      }
      const cikis = [];
      const tumBloklar = [];
      let blok = [];
      for (const n of hucreleri) {
        if (n.length === 0) { tumBloklar.push(blok); blok = []; }
        else blok.push(n);
      }
      if (blok.length) tumBloklar.push(blok);

      // Çok kelimeli tırnak: açılış "“çok" bloğunda, kapanış "iyi”" bloğunda olabilir → her bloktan
      // SONRA bir yerde kapanış tırnağı [3,5,6] var mı? (blok-içi kapanış ayrıca kontrol edilir.)
      const kapanisIlerideArr = new Array(tumBloklar.length);
      { let sonra = false;
        for (let i = tumBloklar.length - 1; i >= 0; i--) {
          kapanisIlerideArr[i] = sonra;
          if (tumBloklar[i].some((h) => noktalariAnahtara(h) === '3,5,6')) sonra = true;
        } }

      const bloklariIsle = (bRaw, sonrakiIlkHucre, kapanisIleride) => {
        if (bRaw.length === 0) return;
        let bashCase = 'normal';
        let b = bRaw;
        // Yapışık öndeki açılış tırnağı ([2,3,6], blokta eşleşen kapanış [3,5,6] varsa) + sondaki
        // kapanış tırnağı ([3,5,6]) kelimeden AYRILIR → kısaltma/hece çözümü TEMİZ kelimede çalışır.
        // (kullanıcı: "tırnak/parantez yapışınca kelime bozuluyor"; ör. "sr"=soru iki-harfli kısaltması
        // b.length===2 şartıyla tanındığından yapışık tırnak tanımayı bozup "soru"→"sr" yapıyordu.)
        let onEk = '', sonEk = '';
        {
          const _dk = (h) => [...h].sort((x, y) => x - y).join(',');
          // Öndeki açılış tırnağı ([2,3,6] + eşleşen kapanış ileride) VEYA açılış parantezi
          // ([2,3,5,6] = NOKTALAMA paren, harf/hece ile ÇAKIŞMAZ → konumla '(' güvenli) ayrılır.
          while (b.length > 1) {
            const _k0 = _dk(b[0]);
            if (_k0 === '2,3,6' && (kapanisIleride || b.slice(1).some((h) => _dk(h) === '3,5,6'))) { onEk += '“'; b = b.slice(1); }
            else if (_k0 === '2,3,5,6') { onEk += '('; b = b.slice(1); }
            else break;
          }
          // Sondaki kapanış tırnağı [3,5,6] VEYA kapanış parantezi [2,3,5,6] ayrılır.
          while (b.length > 1) {
            const _kL = _dk(b[b.length - 1]);
            if (_kL === '3,5,6') { sonEk = '”' + sonEk; b = b.slice(0, -1); }
            else if (_kL === '2,3,5,6') { sonEk = ')' + sonEk; b = b.slice(0, -1); }
            else break;
          }
        }
        if (b.length >= 2 && buyukHarfIsaretiMi(b[0]) && buyukHarfIsaretiMi(b[1])) {
          bashCase = 'tumu'; b = b.slice(2);
        } else if (b.length >= 1 && buyukHarfIsaretiMi(b[0])) {
          bashCase = 'ilk'; b = b.slice(1);
        }
        if (b.length === 0) { if (onEk || sonEk) cikis.push(onEk + sonEk); return; }
        const kasala = (s) => {
          if (!s) return s;
          if (bashCase === 'tumu') return s.toLocaleUpperCase('tr');
          if (bashCase === 'ilk') return s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
          return s;
        };

        const ilkKey = [...b[0]].sort((x, y) => x - y).join(',');
        // Tek-harfli kısaltma: harf TEK BAŞINA kelime ise geçerli. Çıplak harf hücresinin
        // ardından SADECE noktalama gelirse (ör. "var." / "ve?") kelime hâlâ tek başınadır →
        // kısaltma + noktalama yaz. (Encoder tek harfi [5,6] önekiyle ayırır; çıplak hücre = kısaltma.)
        if (birHarfAktif && _KISALTMA_TEK.has(ilkKey)) {
          let kuyruk = '';
          let hepsiNoktalama = true;
          for (let k = 1; k < b.length; k++) {
            const np = _NOKTA_TERS.get([...b[k]].sort((x, y) => x - y).join(','));
            if (np == null) { hepsiNoktalama = false; break; }
            kuyruk += np;
          }
          if (hepsiNoktalama) { cikis.push(onEk + kasala(_KISALTMA_TEK.get(ilkKey)) + kuyruk + sonEk); return; }
        }
        if (ikiHarfAktif && b.length === 2 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const a = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(a)) { cikis.push(onEk + kasala(_KISALTMA_IKI.get(a)) + sonEk); return; }
        }
        const buf = [];
        let ci = 0;
        let sM = false, siraSM = false, bH = (bashCase === 'ilk'), bHTumu = (bashCase === 'tumu');
        let ciftListeVirgulle = false;
        let cListeSonTekIsaretSonrasi = false;
        let duzeltmeBekle = false;
        let ikiHarfPrefixIndex = -1;
        let kokPrefixIndex = -1;
        if (ikiHarfAktif && b.length >= 3 && ilkKey !== '5' && ilkKey !== '4,5' && ilkKey !== '5,6') {
          const ikiKey = ilkKey + '|' + [...b[1]].sort((x, y) => x - y).join(',');
          if (_KISALTMA_IKI.has(ikiKey)) {
            let ikiKelime = _KISALTMA_IKI.get(ikiKey);
            if (bHTumu) ikiKelime = ikiKelime.toLocaleUpperCase('tr');
            else if (bH) ikiKelime = ikiKelime.charAt(0).toLocaleUpperCase('tr') + ikiKelime.slice(1).toLocaleLowerCase('tr');
            buf.push(ikiKelime);
            ikiHarfPrefixIndex = buf.length - 1;
            bH = false;
            ci = 2;
          }
        }
        if (birHarfAktif && b.length >= 3 && ci === 0 && _KISALTMA_TEK.has(ilkKey)) {
          const ikinciKey = [...b[1]].sort((x, y) => x - y).join(',');
          if (ikinciKey === '3') {
            let tekKelime = _KISALTMA_TEK.get(ilkKey);
            if (bHTumu) tekKelime = tekKelime.toLocaleUpperCase('tr');
            else if (bH) tekKelime = tekKelime.charAt(0).toLocaleUpperCase('tr') + tekKelime.slice(1).toLocaleLowerCase('tr');
            buf.push(tekKelime);
            bH = false;
            ci = 2;
          }
        }
        if (kokAktif && b.length >= 2 && ilkKey === '5') {
          const sagKey = [...b[1]].sort((x, y) => x - y).join(',');
          const kok = _KOK_SAG_MAP.get(sagKey);
          if (kok) {
            let kk = kok.kelime;
            if (bashCase === 'tumu') kk = kk.toLocaleUpperCase('tr');
            else if (bashCase === 'ilk') kk = kk.charAt(0).toLocaleUpperCase('tr') + kk.slice(1);
            buf.push(kk);
            kokPrefixIndex = buf.length - 1;
            if (bashCase === 'ilk') { bashCase = 'normal'; bH = false; }
            ci = 2;
          }
        }
        const harfYaz = (h) => {
          if (!h) return;
          if (bHTumu) buf.push(h.toLocaleUpperCase('tr'));
          else if (bH) {
            buf.push(h.charAt(0).toLocaleUpperCase('tr') + h.slice(1).toLocaleLowerCase('tr'));
            bH = false;
          }
          else buf.push(h.toLocaleLowerCase('tr'));
        };
        const tekHarfIsaretliOku = (cellIndex) => {
          if (cellIndex !== 0 || !tekKucukHarfIsaretiMi(b[cellIndex])) return null;
          let harfIndex = cellIndex + 1;
          let buyuk = false;
          if (harfIndex < b.length && buyukHarfIsaretiMi(b[harfIndex])) {
            buyuk = true;
            harfIndex++;
          }
          let isDuzeltmeli = false;
          if (harfIndex < b.length && duzeltmeYabanciHarfIsaretiMi(b[harfIndex])) {
            harfIndex++;
            isDuzeltmeli = true;
          }
          if (harfIndex < b.length && buyukHarfIsaretiMi(b[harfIndex])) {
            buyuk = true;
            harfIndex++;
          }
          if (harfIndex >= b.length) return null;
          const harf = isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(b[harfIndex]) || hucreyiKarakteryap(b[harfIndex])) : hucreyiKarakteryap(b[harfIndex]);
          if (!harf || harf === ' ') return null;
          const sonraki = harfIndex + 1 < b.length ? b[harfIndex + 1] : null;
          if (sonraki && !_NOKTA_TERS.has([...sonraki].sort((a, b) => a - b).join(','))) return null;
          return {
            metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
            sonrakiIndex: harfIndex + 1,
          };
        };
        // Tek-hücreli matematik sembolü (√=[1,4,6]=ş, %=[1,3,4,5,6]=y, (=[1,2,6]=ğ, |=[1,2,3]=l)
        // Türk harfleriyle ÇAKIŞIR. KURAL (kullanıcı: "sayı yanında matematik kabul et, yoksa harf"):
        // sayı modundaysak (sayı ÖNCE) VEYA sembolden hemen sonra rakam işareti geliyorsa (sayı SONRA)
        // → matematik; aksi halde harfe/kısaltmaya düşür (ş, ile… düz yazıda bozulmasın).
        const isAmbiguousMath = (isaret) => !!isaret && isaret.hucreler.length === 1;
        // KÜME işlemleri (∈ ∩ ∪ ⊂ ⊃ \) yalnız ardından SET ADI gelirse geçerli: büyük harf işareti [6]
        // (tek harfli küme A,B…) veya küme-adı öneki [5,6] (N,Z,Q…). Aksi halde [3] = KESME İŞARETİ (')
        // + ektir (kullanıcı: "kesme işaretinden sonra mat gelmez"): "1922'de"→"1922∩" / "5'e"→"5∈" /
        // "Ahmet'e"→"Ahmet∈" YANLIŞ. "5∈A"/"x∈N" (gerçek küme) korunur — ardında [6]/[5,6] var.
        // 'küme açma' { = (1,2,3,5,6)(3) — "ye" hecesi [1,2,3,5,6] + apostrof [3] ile çakışır
        // ("Türkiye'nin"→"{nin"). Küme işlemleri gibi ardından SET ELEMANI (büyük harf/küme-adı/SAYI) ister.
        const _KUME_ISLEMLERI = new Set(['alt küme', 'kapsar', 'birleşim', 'kesişim', 'fark', 'elemanıdır', 'küme açma']);
        // GERÇEK sayı başlangıcı = rakam işareti [3,4,5,6] + ardından bir rakam (a–j). [3,4,5,6]
        // kısaltmalarda da (kök/çift-rakam işareti) görünür → yalnız "işaret + rakam" gerçek sayıdır
        // (belkili gibi kelimelerdeki [3,4,5,6]+l yanlış-pozitif olmasın).
        const _RAKAM_KEYS = new Set(['1', '1,2', '1,4', '1,4,5', '1,5', '1,2,4', '1,2,4,5', '1,2,5', '2,4', '2,4,5']);
        const _key = (h) => (h ? [...h].sort((a, b) => a - b).join(',') : '');
        const gercekSayiBitisik = (h1, h2) => _key(h1) === '3,4,5,6' && _RAKAM_KEYS.has(_key(h2));
        let kesmeBayrak = false;   // önceki hücre APOSTROF (') olarak yazıldı mı → sonraki ek literal
        while (ci < b.length) {
          const noktalar = b[ci];
          const buKesme = kesmeBayrak; kesmeBayrak = false;   // tek-shot: yalnız apostroftan SONRAKİ hücre
          // Kesme işaretinden sonra [5,6]+harf = LİTERAL ek (parça "leri"/"dır" DEĞİL; kullanıcı:
          // "Ahmet'e" → kesme + tek-harf "e"; [5,6][1,5] hem "leri" parça hem tek-harf "e" — apostrof ayırır).
          if (buKesme && _key(noktalar) === '5,6' && ci + 1 < b.length) {
            const _h = hucreyiKarakteryap(b[ci + 1]);
            if (_h && _h !== ' ') { harfYaz(_h); ci += 2; continue; }
          }
          const islemIsareti = matematikSembolHucreEslesmesi(b, ci);
          const sonrakiSayiBitisik = islemIsareti
            && (sM || gercekSayiBitisik(b[ci + islemIsareti.hucreler.length], b[ci + islemIsareti.hucreler.length + 1]));
          const _setAdiSonra = () => { const h = islemIsareti && b[ci + islemIsareti.hucreler.length];
            const kk = h ? [...h].sort((a, b) => a - b).join(',') : ''; return kk === '6' || kk === '5,6' || kk === '3,4,5,6'; };
          const kumeReddi = islemIsareti && _KUME_ISLEMLERI.has(islemIsareti.ad) && !_setAdiSonra();
          if (islemIsareti && !kumeReddi && (!isAmbiguousMath(islemIsareti) || sonrakiSayiBitisik)) {
            buf.push(islemIsareti.sembol);
            sM = sM && matematikIsaretiSayiModunuKorurMu(islemIsareti);
            siraSM = false;
            bH = false;
            bHTumu = false;
            if (!sM) {
              ciftListeVirgulle = false;
              cListeSonTekIsaretSonrasi = false;
            }
            ci += islemIsareti.hucreler.length;
            continue;
          }
          const tekHarf = !sM ? tekHarfIsaretliOku(ci) : null;
          if (tekHarf) {
            buf.push(tekHarf.metin);
            ci = tekHarf.sonrakiIndex;
            continue;
          }
          if (duzeltmeBekle) {
            harfYaz(duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar));
            duzeltmeBekle = false;
            ci++;
            continue;
          }
          if (duzeltmeYabanciHarfIsaretiMi(noktalar)) {
            duzeltmeBekle = true;
            ci++;
            continue;
          }
          if (noktalar.length === 0) {
            buf.push(' ');
            sM = false;
            siraSM = false;
            bH = false;
            bHTumu = false;
            ciftListeVirgulle = false;
            cListeSonTekIsaretSonrasi = false;
            ci++;
            continue;
          }
          if (sayiIsaretiMi(noktalar)) {
            const sonraki = ci + 1 < b.length ? b[ci + 1] : null;
            if (sonraki && sayiIsaretiMi(sonraki)) {
              ci += 2;
              sM = true;
              siraSM = false;
              ciftListeVirgulle = true;
              cListeSonTekIsaretSonrasi = false;
              continue;
            }
            const sonrakDigit = sonraki && hucreyiRakamayap(sonraki);
            const sonrakSira = sonraki && hucreyiSiraSayisiRakaminaCevir(sonraki);
            const sonrakHarfliSayi = harfliSayiHarfOku(b, ci + 1);
            const onceki = ci > 0 ? b[ci - 1] : null;
            // KURAL (ki hecesi ↔ sayı işareti): kelime İÇİNDEKİ [3,4,5,6], ardında yalnız
            // İNDİRGENMİŞ rakam (=noktalama deseni: '.'=[2,5,6]) varsa sayı DEĞİL 'ki'dir —
            // "sonraki." (s+[3]+ki+.) / "içindeki." (i+[3]+de+ki+.) sıra sayısı "4." okunuyordu
            // (tek-harf ayırma [3] ve bazı hece hücreleri sınır sayıldığından). Üst rakam veya
            // harfli sayı takip ederse sayı kalır; kelime içi tespiti kelimeIciSayiIsaretiKiMi.
            const kelimeIciKi = heceAktif && !sonrakDigit && !sonrakHarfliSayi
              && kelimeIciSayiIsaretiKiMi(b, ci, sayiIsaretiOncesiSinirMi);
            if (!kelimeIciKi && (sayiIsaretiOncesiSinirMi(onceki) || ciftListeVirgulle) && (sonrakDigit || sonrakSira || sonrakHarfliSayi)) {
              if (ciftListeVirgulle) {
                ciftListeVirgulle = false;
                cListeSonTekIsaretSonrasi = true;
              }
              sM = true;
              siraSM = !!sonrakSira && !sonrakDigit;
              ci++;
              continue;
            }
          }
          if (buyukHarfIsaretiMi(noktalar)) {
            if (ci + 1 < b.length && buyukHarfIsaretiMi(b[ci + 1])) {
              bHTumu = true; ci += 2;
            } else {
              bH = true; ci++;
            }
            continue;
          }
          if (sM) {
            const harfliSayiHarf = !siraSM ? harfliSayiHarfOku(b, ci) : null;
            if (harfliSayiHarf) {
              buf.push(harfliSayiHarf.metin);
              ci = harfliSayiHarf.sonrakiIndex;
              continue;
            }
            const r = hucreyiRakamayap(noktalar);
            if (!siraSM && r) { buf.push(r); ci++; continue; }
            const bolukMu = [...noktalar].sort((x, y) => x - y).join(',') === '3';
            if (!siraSM && bolukMu && ci + 1 < b.length && hucreyiRakamayap(b[ci + 1])) {
              buf.push('.');
              ci++;
              continue;
            }
            const kVirgulMu = [...noktalar].sort((x, y) => x - y).join(',') === '2';
            if (!siraSM && kVirgulMu && ciftListeVirgulle) {
              buf.push(',');
              ci++;
              continue;
            }
            if (
              !siraSM
              && kVirgulMu
              && !ciftListeVirgulle
              && ci + 1 < b.length
              && hucreyiRakamayap(b[ci + 1])
            ) {
              buf.push(',');
              ci++;
              continue;
            }
            let sia = ci;
            let siraTxt = '';
            while (siraSM && sia < b.length) {
              const sr = hucreyiSiraSayisiRakaminaCevir(b[sia]);
              if (!sr) break;
              siraTxt += sr;
              sia++;
            }
            if (siraTxt.length > 0) {
              buf.push(siraTxt);
              const sn = sia < b.length ? b[sia] : null;
              const kesmeMi = sn && noktalariAnahtara(sn) === '3';
              if (!kesmeMi) buf.push('.');
              sM = false;
              siraSM = false;
              ci = sia;
              continue;
            }
            if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(b, ci)) { buf.push('.'); ci++; continue; }
            if (
              !siraSM
              && tarihAyirmaIsaretiMi(noktalar)
              && ci + 1 < b.length
              && hucreyiRakamayap(b[ci + 1])
            ) {
              buf.push('-');
              ci++;
              continue;
            }
            const sayiIciNoktalama = !siraSM ? _NOKTA_TERS.get(noktalariAnahtara(noktalar)) : null;
            if (sayiIciNoktalama) {
              buf.push(sayiIciNoktalama);
              ci++;
              continue;
            }
            sM = false;
            siraSM = false;
            if (cListeSonTekIsaretSonrasi) {
              cListeSonTekIsaretSonrasi = false;
              ciftListeVirgulle = false;
            }
          }
          // ⚠ KELİME BAŞINDA PARÇA KISALTMASI YOK (MEB kuralı; bkz. brailleCevir.js aynı
          // guard): [4,5]+harf kelime başında "tır"/"cı" gibi okunuyordu. Encoder bu kuralı
          // uyguluyor; decoder de uygulamalı. ([5,6] kelime başında tek harf işareti olarak
          // tüketildiğinden orada hata görülmüyordu.)
          if (parcaAktif && ci > 0 && ci + 1 < b.length) {
            const nKey = [...noktalar].sort((x, y) => x - y).join(',');
            if (nKey === '4,5' || nKey === '5,6') {
              const sagKey = [...b[ci + 1]].sort((x, y) => x - y).join(',');
              const parca = _PARCA_MAP.get(nKey + '|' + sagKey);
              if (parca) { buf.push(_unluUyumuSec(parca.ekler, buf.join(''))); ci += 2; continue; }
            }
          }
          const hA = [...noktalar].sort((a, b) => a - b).join(',');
          const np = _NOKTA_TERS.get(hA);
          // [2,3,6] → eşleşen kapanış varsa açılış tırnağı (“), yoksa soru işareti (?).
          const npCik = (hA === '2,3,6' && acilisTirnagiMi(b, ci)) ? '“' : np;
          const heceKarsiligi = heceAktif && !sM ? _HECE_TERS.get(hA) : undefined;
          if (np && heceKarsiligi) {
            const ilkHucre = ci === 0;
            const sonHucre = ci === b.length - 1;
            let kalanHepsiNoktalama = true;
            for (let kk = ci + 1; kk < b.length; kk++) {
              const kkA = [...b[kk]].sort((a, b) => a - b).join(',');
              if (!_NOKTA_TERS.has(kkA)) { kalanHepsiNoktalama = false; break; }
            }
            let noktalamaKullan = false;
            if (ilkHucre && hA === '2,3,6') noktalamaKullan = true;
            else if (sonHucre || kalanHepsiNoktalama) {
              if (hA === '2,6' && sonHucre) {
                noktalamaKullan = sonrakiIlkHucre == null || buyukHarfIsaretiMi(sonrakiIlkHucre);
              } else {
                noktalamaKullan = true;
              }
            }
            if (noktalamaKullan) { buf.push(npCik); if (hA === '3') kesmeBayrak = true; }
            else harfYaz(heceKarsiligi);
          } else if (np) {
            buf.push(npCik);
            if (hA === '3') kesmeBayrak = true;   // apostrof yazıldı → sonraki ek literal okunsun
          } else if (heceKarsiligi) {
            harfYaz(heceKarsiligi);
          } else {
            const h = hucreyiKarakteryap(noktalar);
            harfYaz(h);
          }
          ci++;
        }
        if (ikiHarfPrefixIndex >= 0) {
          const sonrakiMetin = buf.slice(ikiHarfPrefixIndex + 1).join('');
          buf[ikiHarfPrefixIndex] = ikiHarfliKisaltmaOkunusunuYumusat(buf[ikiHarfPrefixIndex], sonrakiMetin);
        }
        if (kokPrefixIndex >= 0) {
          const sonrakiMetin = buf.slice(kokPrefixIndex + 1).join('');
          buf[kokPrefixIndex] = kelimeKokuOkunusunuYorIcinDuzelt(buf[kokPrefixIndex], sonrakiMetin);
        }
        cikis.push(onEk + buf.join('') + sonEk);
      };

      for (let bi = 0; bi < tumBloklar.length; bi++) {
        if (bi > 0) cikis.push(' ');
        const sonrakiIlkHucre = bi + 1 < tumBloklar.length ? (tumBloklar[bi + 1][0] ?? null) : null;
        bloklariIsle(tumBloklar[bi], sonrakiIlkHucre, kapanisIlerideArr[bi]);
      }
      sayfaCiktilari.push(cikis.join(''));
    }
    return sayfaCiktilari.join('\n').trim();
  }

  for (const satir of satirlar) {
    if (!satir.trim()) {
      metin += '\n';
      sayiModu = false;
      siraSayiModu = false;
      ciftListeVirgulle = false;
      cListeSonTekIsaretSonrasi = false;
      continue;
    }
    let tumKelimeBuyuk = false;
    let duzeltmeBekle = false;
    const satirHucreleri = Array.from(satir)
      .map((ch) => brfNoktalaradon(ch))
      .filter((noktalar) => noktalar !== null);
    const tekHarfIsaretliOku = (cellIndex) => {
      if (!tekKucukHarfIsaretiMi(satirHucreleri[cellIndex])) return null;
      let harfIndex = cellIndex + 1;
      let buyuk = false;
      if (harfIndex < satirHucreleri.length && buyukHarfIsaretiMi(satirHucreleri[harfIndex])) {
        buyuk = true;
        harfIndex++;
      }
      let isDuzeltmeli = false;
      if (harfIndex < satirHucreleri.length && duzeltmeYabanciHarfIsaretiMi(satirHucreleri[harfIndex])) {
        harfIndex++;
        isDuzeltmeli = true;
      }
      if (harfIndex < satirHucreleri.length && buyukHarfIsaretiMi(satirHucreleri[harfIndex])) {
        buyuk = true;
        harfIndex++;
      }
      if (harfIndex >= satirHucreleri.length) return null;
      const harf = isDuzeltmeli ? (duzeltmeliHucreyiMetneCevir(satirHucreleri[harfIndex]) || hucreyiKarakteryap(satirHucreleri[harfIndex])) : hucreyiKarakteryap(satirHucreleri[harfIndex]);
      if (!harf || harf === ' ') return null;
      return {
        metin: buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr'),
        sonrakiIndex: harfIndex,
      };
    };
    for (let hi = 0; hi < satirHucreleri.length; hi++) {
      const noktalar = satirHucreleri[hi];
      if (noktalar.length === 0) {
        metin += ' '; sayiModu = false; siraSayiModu = false;
        ciftListeVirgulle = false;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false; tumKelimeBuyuk = false; duzeltmeBekle = false; continue;
      }
      const islemIsareti = matematikSembolHucreEslesmesi(satirHucreleri, hi);
      const isAmbiguousMath2 = (isaret) => !!isaret && isaret.hucreler.length === 1;
      // "sayı yanında matematik kabul et": sayı modu (önce) VEYA ardından GERÇEK sayı (rakam işareti + a–j rakamı)
      const sayiBitisik2 = islemIsareti && (sayiModu || (() => {
        const _R = new Set(['1', '1,2', '1,4', '1,4,5', '1,5', '1,2,4', '1,2,4,5', '1,2,5', '2,4', '2,4,5']);
        const k = (h) => (h ? [...h].sort((a, b) => a - b).join(',') : '');
        const o = hi + islemIsareti.hucreler.length;
        return k(satirHucreleri[o]) === '3,4,5,6' && _R.has(k(satirHucreleri[o + 1]));
      })());
      // küme işlemi (∈∩∪⊂⊃\) ancak ardından set adı ([6]/[5,6]) gelirse geçerli; yoksa kesme işareti (')
      const kumeReddi2 = islemIsareti
        && new Set(['alt küme', 'kapsar', 'birleşim', 'kesişim', 'fark', 'elemanıdır', 'küme açma']).has(islemIsareti.ad)
        && (() => { const h = satirHucreleri[hi + islemIsareti.hucreler.length];
            const kk = h ? [...h].sort((a, b) => a - b).join(',') : ''; return kk !== '6' && kk !== '5,6' && kk !== '3,4,5,6'; })();
      if (islemIsareti && !kumeReddi2 && (!isAmbiguousMath2(islemIsareti) || sayiBitisik2)) {
        metin += islemIsareti.sembol;
        hi += islemIsareti.hucreler.length - 1;
        sayiModu = sayiModu && matematikIsaretiSayiModunuKorurMu(islemIsareti);
        siraSayiModu = false;
        if (!sayiModu) {
          ciftListeVirgulle = false;
          cListeSonTekIsaretSonrasi = false;
        }
        buyukHarfBekle = false;
        tumKelimeBuyuk = false;
        duzeltmeBekle = false;
        continue;
      }
      const tekHarf = !sayiModu ? tekHarfIsaretliOku(hi) : null;
      if (tekHarf) {
        metin += tekHarf.metin;
        hi = tekHarf.sonrakiIndex;
        sayiModu = false;
        siraSayiModu = false;
        ciftListeVirgulle = false;
        cListeSonTekIsaretSonrasi = false;
        buyukHarfBekle = false;
        continue;
      }
      if (duzeltmeBekle) {
        const harf = duzeltmeliHucreyiMetneCevir(noktalar) || hucreyiKarakteryap(noktalar);
        if (harf) {
          const buyuk = buyukHarfBekle || tumKelimeBuyuk;
          metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        }
        duzeltmeBekle = false;
        buyukHarfBekle = false;
        continue;
      }
      if (duzeltmeYabanciHarfIsaretiMi(noktalar)) { duzeltmeBekle = true; continue; }
      if (sayiIsaretiMi(noktalar)) {
        const sonra3456 = hi + 1 < satirHucreleri.length && sayiIsaretiMi(satirHucreleri[hi + 1]);
        if (sonra3456) {
          hi++;
          ciftListeVirgulle = true;
          cListeSonTekIsaretSonrasi = false;
          sayiModu = true;
          siraSayiModu = false;
          tumKelimeBuyuk = false;
          continue;
        }
        const sonrakiHucre = hi + 1 < satirHucreleri.length ? satirHucreleri[hi + 1] : null;
        const sonrakRakam = sonrakiHucre && hucreyiRakamayap(sonrakiHucre);
        const sonrakSira = sonrakiHucre && hucreyiSiraSayisiRakaminaCevir(sonrakiHucre);
        const sonrakHarfliSayi = harfliSayiHarfOku(satirHucreleri, hi + 1);
        const oncekiHucre = hi > 0 ? satirHucreleri[hi - 1] : null;
        if (!sayiIsaretiOncesiSinirMi(oncekiHucre) && !ciftListeVirgulle) {
          const harf = hucreyiKarakteryap(noktalar);
          if (harf) metin += harf;
          continue;
        }
        if (ciftListeVirgulle) {
          cListeSonTekIsaretSonrasi = true;
        }
        sayiModu = true;
        siraSayiModu = !!sonrakSira && !sonrakRakam && !sonrakHarfliSayi;
        tumKelimeBuyuk = false;
        continue;
      }
      if (buyukHarfIsaretiMi(noktalar)) {
        if (buyukHarfBekle) { tumKelimeBuyuk = true; buyukHarfBekle = false; }
        else { buyukHarfBekle = true; }
        continue;
      }
      if (sayiModu) {
        const harfliSayiHarf = !siraSayiModu ? harfliSayiHarfOku(satirHucreleri, hi) : null;
        if (harfliSayiHarf) {
          metin += harfliSayiHarf.metin;
          hi = harfliSayiHarf.sonrakiIndex - 1;
          continue;
        }
        const rakam = hucreyiRakamayap(noktalar);
        if (!siraSayiModu && rakam) { metin += rakam; continue; }
        const bolukMu = [...noktalar].sort((a, b) => a - b).join(',') === '3';
        if (!siraSayiModu && bolukMu && hi + 1 < satirHucreleri.length && hucreyiRakamayap(satirHucreleri[hi + 1])) {
          metin += '.';
          continue;
        }
        const kVirgulMu = [...noktalar].sort((a, b) => a - b).join(',') === '2';
        if (!siraSayiModu && kVirgulMu && ciftListeVirgulle) {
          metin += ',';
          continue;
        }
        if (
          !siraSayiModu
          && kVirgulMu
          && !ciftListeVirgulle
          && hi + 1 < satirHucreleri.length
          && hucreyiRakamayap(satirHucreleri[hi + 1])
        ) {
          metin += ',';
          continue;
        }
        let siraI = hi;
        let siraMetin = '';
        while (siraSayiModu && siraI < satirHucreleri.length) {
          const sr = hucreyiSiraSayisiRakaminaCevir(satirHucreleri[siraI]);
          if (!sr) break;
          siraMetin += sr;
          siraI++;
        }
        if (siraMetin.length > 0) {
          metin += siraMetin;
          const sono = siraI < satirHucreleri.length ? satirHucreleri[siraI] : null;
          const kesmeMi = sono && noktalariAnahtara(sono) === '3';
          if (!kesmeMi) metin += '.';
          sayiModu = false;
          siraSayiModu = false;
          hi = siraI - 1;
          continue;
        }
        if (tarihAyirmaIsaretiMi(noktalar) && tarihHucreAraligi(satirHucreleri, hi)) { metin += '.'; continue; }
        if (
          !siraSayiModu
          && tarihAyirmaIsaretiMi(noktalar)
          && hi + 1 < satirHucreleri.length
          && hucreyiRakamayap(satirHucreleri[hi + 1])
        ) {
          metin += '-';
          continue;
        }
        const sayiIciNoktalama = !siraSayiModu ? _NOKTA_TERS.get(noktalariAnahtara(noktalar)) : null;
        if (sayiIciNoktalama) {
          metin += sayiIciNoktalama;
          continue;
        }
        sayiModu = false;
        siraSayiModu = false;
        if (cListeSonTekIsaretSonrasi) {
          cListeSonTekIsaretSonrasi = false;
          ciftListeVirgulle = false;
        }
      }
      const harf = hucreyiKarakteryap(noktalar);
      if (harf) {
        const buyuk = buyukHarfBekle || tumKelimeBuyuk;
        metin += buyuk ? harf.toLocaleUpperCase('tr') : harf.toLocaleLowerCase('tr');
        buyukHarfBekle = false;
      } else {
        tumKelimeBuyuk = false;
        buyukHarfBekle = false;
      }
    }
    metin += '\n';
  }
  return metin.trim();
}
