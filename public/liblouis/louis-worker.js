/*
 * liblouis tabanlı Braille çeviri worker'ı (klasik Web Worker).
 *
 * Tüm varlıklar YEREL: build, easy-api ve tablolar /liblouis/ altından servis edilir.
 * Çalışma anında hiçbir dış adrese istek gitmez. Tablolar ilk kullanımda
 * /liblouis/tables/ klasöründen (aynı origin) yüklenir.
 *
 * Mesaj API'si:
 *   → { type: 'cevir', requestId, text, dil }   dil: 'en' | 'de' | 'fr'
 *   ← { type: 'sonuc', requestId, ok, hucreler, esleme }   (hata: ok=false, hata)
 *
 * Çıktı biçimi uygulamayla aynıdır: hucreler: number[][], esleme: number[]
 * (her hücre, kaynak metindeki kelimenin başlangıç indeksine eşlenir.)
 */

/* eslint-disable no-undef */

importScripts('./build-no-tables-utf32.js');
importScripts('./easy-api.js');

// easy-api worker/global modunda hazır bir örnek kurar: self.liblouis
var louis = self.liblouis;
var hazir = false;
var hazirHata = null;

try {
  // Tablolar aynı origin'den, /liblouis/tables/ altından (senkron XHR — worker'da güvenli).
  louis.enableOnDemandTableLoading('/liblouis/tables/');
  hazir = true;
} catch (e) {
  hazirHata = String(e && e.message ? e.message : e);
}

// Dil → liblouis tablo zinciri. unicode.dis: çıktıyı U+2800 braille olarak verir
// (diller arası tutarlı nokta deseni). g2 tabloları gerçek 2. derece kısaltmadır.
var TABLO = {
  en: 'unicode.dis,en-ueb-g2.ctb',
  de: 'unicode.dis,de-de-g2.ctb',
  fr: 'unicode.dis,fr-bfu-g2.ctb',
};
// Kısaltmasız (Grade 1) tablo zinciri — kısaltma kapalıyken.
var TABLO_G1 = {
  en: 'unicode.dis,en-ueb-g1.ctb',
  de: 'unicode.dis,de-de-g1.ctb',
  fr: 'unicode.dis,fr-bfu-comp6.utb',
};

/** Tek bir braille (U+2800) karakterini nokta numarası dizisine çevirir. */
function braillePatternToDots(ch) {
  var c = typeof ch === 'number' ? ch : ch.codePointAt(0);
  if (c < 0x2800 || c > 0x28ff) return null;
  var bits = c - 0x2800;
  var dots = [];
  for (var i = 0; i < 6; i++) if (bits & (1 << i)) dots.push(i + 1);
  return dots; // boş hücre (0x2800) → []
}

/**
 * Bir önek gösterge hücresinin ROLÜNÜ dile ve bağlama göre belirler.
 * Roller liblouis tablo opcode'larından (capsletter/begcapsword/numsign/letsign/
 * nocontractsign) doğrulanmıştır:
 *   en-ueb : capsletter 6, begcapsword 6-6, numsign 3456, nocontractsign 56
 *   de     : begcapsword 45, endcapsword/letsign 6, numsign 3456
 *   fr     : capsletter 46, begcapsword 46-46, numsign 6, letsign 6  (6 belirsiz!)
 * Aynı nokta deseni her dilde farklı anlama gelebildiğinden rol burada,
 * bağlamla (sonraki karakterin rakam mı harf mi olduğu) birlikte hesaplanır.
 * @param {string} key  noktaların birleşik string'i, ör. '46'
 * @param {string} dil  'en' | 'de' | 'fr'
 * @param {boolean} sonrakiRakam  göstergenin uygulandığı karakter rakam mı
 * @param {boolean} ikiliBuyuk   ardışık iki büyük-harf göstergesi mi (kelime)
 * @returns {string} rol kodu: 'sayi'|'buyuk'|'buyukKelime'|'harf'|'ozel'
 */
function isaretRolu(key, dil, sonrakiRakam, ikiliBuyuk) {
  if (dil === 'fr') {
    if (key === '46') return ikiliBuyuk ? 'buyukKelime' : 'buyuk';
    if (key === '6') return sonrakiRakam ? 'sayi' : 'harf';
    return 'ozel';
  }
  if (dil === 'de') {
    if (key === '3456') return 'sayi';
    if (key === '45') return 'buyukKelime';
    if (key === '6') return 'harf';
    return 'ozel';
  }
  // en (UEB) ve varsayılan
  if (key === '3456') return 'sayi';
  if (key === '6') return ikiliBuyuk ? 'buyukKelime' : 'buyuk';
  if (key === '56') return 'harf';
  return 'ozel';
}

/**
 * Bir kelimeyi lou_translate ile çevirir; her çıktı hücresi için kaynak metindeki
 * karakter indeksini (inputPos) alır. Böylece her hücrenin altına o hücrenin
 * temsil ettiği gerçek kaynak harf(ler) etiket olarak yazılır (bağlam doğru;
 * tek hücrelik geri çevirinin yanlış kelime-işareti üretmesi engellenir).
 * Dönüş: { hucreler: number[][], etiketler: string[] }
 */
function kelimeyiCevir(louisTbl, kelime, dil) {
  if (!kelime) return { hucreler: [], etiketler: [], grupBasi: [], turler: [] };
  var capi = louis.capi;
  var mem = louis.mem;
  var inbuf_ptr = mem.transfer(capi, kelime);
  var bufflen = mem.getBufferLength(kelime); // (len+1)*4
  var maxOut = bufflen >> 2;
  var outbuf_ptr = capi._malloc(bufflen);
  var inlen_ptr = capi._malloc(4);
  var outlen_ptr = capi._malloc(4);
  var inputPos_ptr = capi._malloc(maxOut * 4);
  capi.setValue(inlen_ptr, kelime.length, 'i32');
  capi.setValue(outlen_ptr, maxOut, 'i32');
  var hucreler = [];
  var etiketler = [];
  var grupBasi = [];
  var turler = [];
  try {
    var ok = capi.ccall(
      'lou_translate', 'number',
      ['string', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number'],
      [louisTbl, inbuf_ptr, inlen_ptr, outbuf_ptr, outlen_ptr, 0, 0, 0, inputPos_ptr, 0, 0]
    );
    if (!ok) return null;
    var outlen = capi.getValue(outlen_ptr, 'i32');
    var inPos = [];
    var out32 = [];
    for (var k = 0; k < outlen; k++) {
      out32.push(capi.getValue(outbuf_ptr + k * 4, 'i32'));
      inPos.push(capi.getValue(inputPos_ptr + k * 4, 'i32'));
    }
    // Hücreleri kaynak konumuna göre koşu (run) hâlinde işle. Aynı inPos değerini
    // paylaşan ardışık hücreler bir koşudur.
    var m = 0;
    while (m < outlen) {
      var dots = braillePatternToDots(out32[m]);
      if (dots == null) {
        // beklenmeyen karakter (boşluk vb.): boş hücre
        hucreler.push([]);
        etiketler.push('');
        grupBasi.push(true);
        turler.push('');
        m += 1;
        continue;
      }
      var bas = inPos[m];
      var runEnd = m + 1;
      while (runEnd < outlen && inPos[runEnd] === bas) runEnd += 1;
      var son = (runEnd < outlen) ? inPos[runEnd] : kelime.length;
      if (bas < 0) bas = 0;
      if (son < bas) son = bas;
      var segment = kelime.slice(bas, son);
      var runLen = runEnd - m;
      if (segment.length === 1 && runLen > 1) {
        // Tek kaynak karakterine karşılık birden çok hücre: önek gösterge(ler)i
        // (büyük harf işareti, sayı işareti vb.) + asıl harf. Son hücre harftir,
        // öncekiler göstergedir.
        var sonrakiRakam = /[0-9]/.test(segment);
        var oncekiSayisi = runLen - 1; // gösterge hücresi adedi
        for (var r = m; r < runEnd; r++) {
          var rdots = braillePatternToDots(out32[r]) || [];
          hucreler.push(rdots);
          if (r === runEnd - 1) {
            etiketler.push(segment);
            grupBasi.push(true);
            turler.push('');
          } else {
            // İki ardışık büyük-harf göstergesi → "büyük harf (kelime)".
            var ikiliBuyuk = oncekiSayisi >= 2;
            var key = rdots.join('');
            etiketler.push('');
            grupBasi.push(true);
            turler.push(isaretRolu(key, dil, sonrakiRakam, ikiliBuyuk));
          }
        }
      } else {
        // Kısaltma (ör. "good" = ⠛⠙) veya normal harf: ilk hücre etiketli,
        // aynı kaynağı paylaşan sonraki hücreler boş alt-etiketli.
        for (var r2 = m; r2 < runEnd; r2++) {
          var r2dots = braillePatternToDots(out32[r2]) || [];
          hucreler.push(r2dots);
          etiketler.push(segment);
          grupBasi.push(r2 === m);
          turler.push('');
        }
      }
      m = runEnd;
    }
    return { hucreler: hucreler, etiketler: etiketler, grupBasi: grupBasi, turler: turler };
  } finally {
    capi._free(inbuf_ptr);
    capi._free(outbuf_ptr);
    capi._free(inlen_ptr);
    capi._free(outlen_ptr);
    capi._free(inputPos_ptr);
  }
}

/**
 * Metni kelime kelime çevirir. Grade 2 kısaltmaları kelime sınırını aşmadığından
 * kelime kelime çeviri, tüm metni birlikte çevirmekle aynı sonucu verir; ayrıca
 * her hücreyi kaynak kelimenin başlangıç indeksine eşleyerek 'tıkla-vurgula' sağlar.
 */
function metniCevir(louisTbl, metin, dil) {
  var hucreler = [];
  var esleme = [];
  var etiketler = [];
  var grupBasi = [];
  var turler = [];
  var n = metin.length;
  var i = 0;
  while (i < n) {
    var ch = metin[i];
    if (/\s/.test(ch)) {
      hucreler.push([]);
      esleme.push(i);
      etiketler.push('');
      grupBasi.push(true);
      turler.push('');
      i += 1;
      continue;
    }
    // Boşluğa kadar olan kelime parçasını topla
    var j = i;
    while (j < n && !/\s/.test(metin[j])) j += 1;
    var parca = metin.slice(i, j);
    var pSonuc = kelimeyiCevir(louisTbl, parca, dil);
    if (pSonuc == null) {
      // Çeviri başarısızsa kelimeyi atla (hata üretme)
      i = j;
      continue;
    }
    for (var k = 0; k < pSonuc.hucreler.length; k++) {
      hucreler.push(pSonuc.hucreler[k]);
      esleme.push(i);
      etiketler.push(pSonuc.etiketler[k]);
      grupBasi.push(pSonuc.grupBasi[k]);
      turler.push(pSonuc.turler[k]);
    }
    i = j;
  }
  return { hucreler: hucreler, esleme: esleme, etiketler: etiketler, grupBasi: grupBasi, turler: turler };
}

self.onmessage = function (ev) {
  var msg = ev.data;
  if (!msg || msg.type !== 'cevir') return;
  var requestId = msg.requestId;

  if (!hazir) {
    self.postMessage({ type: 'sonuc', requestId: requestId, ok: false, hata: hazirHata || 'liblouis hazır değil' });
    return;
  }

  var dil = msg.dil;
  var kisaltma = msg.kisaltma !== false; // varsayılan: açık
  var tbl = (kisaltma ? TABLO : TABLO_G1)[dil];
  if (!tbl) {
    self.postMessage({ type: 'sonuc', requestId: requestId, ok: false, hata: 'bilinmeyen dil: ' + dil });
    return;
  }

  try {
    var sonuc = metniCevir(tbl, String(msg.text || ''), dil);
    self.postMessage({ type: 'sonuc', requestId: requestId, ok: true, hucreler: sonuc.hucreler, esleme: sonuc.esleme, etiketler: sonuc.etiketler, grupBasi: sonuc.grupBasi, turler: sonuc.turler });
  } catch (e) {
    self.postMessage({ type: 'sonuc', requestId: requestId, ok: false, hata: String(e && e.message ? e.message : e) });
  }
};

// Hazır bildirimi (isteğe bağlı dinleyici için)
self.postMessage({ type: 'hazir', ok: hazir, hata: hazirHata });
