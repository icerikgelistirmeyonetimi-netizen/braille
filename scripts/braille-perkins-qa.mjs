// Perkins (6 nokta) yazım denetimi — `npm run qa:perkins`
//
// NEDEN: Modül 10 metin→brf'te Perkins ile yazılan hücreler METNE geri çözülür; çözücü
// ENCODER'IN TERSİ olmalıdır. Kullanıcı hatası: "= için braille tuşlarını yazdığımda )
// parantez kapa olarak görüyor" — '=' iki hücredir ([5,6]+[2,3,5,6]) ve ikinci hücresi
// düz-yazı parantezi ')' ile aynıdır; blok sonundaki noktalama soyma (peel) onu koparıyordu.
//
// Bu test Araclar'ın Perkins akışını BİREBİR taklit eder (kelime tamponu + boşlukta
// sonlandırma, bkz. Araclar.jsx `perkinsCoz`/`onHucre`/`onBosluk`) ve her iki kısaltma
// modunda encode→Perkins-çöz round-trip'ini doğrular.
import {
  metniBrailleyeCevir,
  metniBrailleyeCevirKisaltmali,
  hucreleriMetneCevirKisaltmali,
} from '../src/utils/brailleCevir.js';
import { yeniYazmaDurumu, hucreyiIsle, yazmaDurumunuSonlandir } from '../src/utils/perkinsYazma.js';
import { brfMetinedonSistemi } from '../src/utils/brfOkuyucu.js';
import { noktalariBRF } from '../src/utils/brailleAscii.js';

const SIS = {
  hece: true, birHarf: true, ikiHarf: true, kok: true, parca: true,
  sayiIsareti: true, buyukHarfIsareti: true, tekHarfIsareti: true,
};
const KAPALI = { hece: false, birHarf: false, ikiHarf: false, kok: false, parca: false };

const encK = (t) => metniBrailleyeCevirKisaltmali(t, { buyukHarfIsareti: true, sayiIsareti: true, ...SIS }).hucreler;
const encD = (t) => metniBrailleyeCevir(t, { buyukHarfIsareti: true, sayiIsareti: true }).hucreler;

/** Araclar `perkinsCoz` birebir: iki modda AYNI blok çözücü, yalnız sistemler değişir. */
const perkinsCoz = (hucreler, sistemler, sonlandir) => hucreleriMetneCevirKisaltmali(
  hucreler, sistemler, sonlandir ? {} : { sonTekHarfBeklet: true },
);

/**
 * Araclar kelime tamponu akışı: her hücre tampona eklenir ve kelime BÜTÜN olarak yeniden
 * çözülüp metinde yerine yazılır; boşluk kelimeyi sonlandırır (`sonTekHarfBeklet` kalkar).
 */
function perkinsYaz(hucreler, sistemler) {
  let metin = '';
  let tampon = [];
  for (const h of hucreler) {
    if (!h.length) {
      if (tampon.length) metin += perkinsCoz(tampon, sistemler, true);
      metin += ' ';
      tampon = [];
      continue;
    }
    tampon.push(h);
  }
  if (tampon.length) metin += perkinsCoz(tampon, sistemler, true);
  return metin;
}

/**
 * Durum makinesi — İLERİ BAKIŞLI (YazmaSerbest `normalModMetni` ile aynı çağrı biçimi):
 * her hücrede kalan hücreler verilir, dönen `tuketilen` kadar atlanır.
 */
function tekHucreliYaz(hucreler) {
  const durum = yeniYazmaDurumu();
  let out = '';
  for (let i = 0; i < hucreler.length;) {
    const r = hucreyiIsle(durum, hucreler[i], hucreler.slice(i + 1));
    if (r.tip === 'karakter' && r.deger !== null) out += r.deger;
    i += r.tuketilen || 1;
  }
  return out + yazmaDurumunuSonlandir(durum);
}

/** Durum makinesi — İLERİ BAKIŞSIZ (YazmaEgitimi/YazmaYonergeli gibi tek hücre karşılaştıranlar). */
function tekHucreliYazIleriBakissiz(hucreler) {
  const durum = yeniYazmaDurumu();
  let out = '';
  for (const h of hucreler) {
    const r = hucreyiIsle(durum, h);
    if (r.tip === 'karakter' && r.deger !== null) out += r.deger;
  }
  return out + yazmaDurumunuSonlandir(durum);
}

const MATEMATIK = ['=', '+', '-', '×', '÷', '<', '>', '≤', '≥', '≠', '±5', '√25', '%50',
  '3=5', 'a=b', '3+5=8', '2×3=6', '10÷2=5', '5-3=2', '15 + 8 = 23', '(3+5)', '|-7|', '1/2', '2≡3'];
const NOKTALAMA = ['ev.', 'ev,', 'ne?', 'ev!', 'ev;', 'ev:', 'a-b', '(soru)', '“bu”', 'a...b',
  'Ne (yani)?', '“çok iyi biri”'];
const SAYI = ['100', '1923', '2,5', '4. sırada', '1233-1334', '1.000', '1.234.567',
  '12.30', '1922\'de', '1923\'ten'];
const HARF = ['ev', 'Ev', 'EV', 'ABC', 'â', 'hâkim', 'rüzgâr', 'q', 'w', 'x', 'Türkiye'];
const KISALTMA = ['aynı', 'beden', 'ma', 'bile', 'kitaplar', 'sanki', 'dedi ki', 'ilgi',
  'vardır', 'çocuklar', 'evleri'];
const CUMLE = ['Bugün hava çok güzel.', '3+5=8 sonucu doğru.', 'Ahmet 1922\'de geldi.',
  'Sen ve ben? “bu” doğru.', 'Saat 12.30 oldu.', '“Merhaba” dedi ki gitti.'];

// Kesme işareti çözücüde kıvrık (’) üretilir — braille aynı hücre, kayıpsız; karşılaştırmada eşitlenir.
const norm = (s) => s.replace(/[’]/g, "'").replace(/\s+/g, ' ').trim();

const gruplar = [
  ['Matematik', MATEMATIK],
  ['Noktalama', NOKTALAMA],
  ['Sayı / sıra', SAYI],
  ['Harf / büyük harf', HARF],
  ['Kısaltma', KISALTMA],
  ['Cümle', CUMLE],
];

// Kısaltma AÇIK modunda hece hücresi düz yazıdaki noktalama ile ÇAKIŞAN tek örnek:
// "..." = üç kez [2,5,6] ve [2,5,6] aynı zamanda 'ka' hecesidir ("kakao" da böyle yazılır)
// → braille'in kendisi belirsiz; kısaltma KAPALI modda doğru okunur. Bilinen sınırlama.
const KISALTMA_MODU_BELIRSIZ = new Set(['a...b']);

let toplam = 0; let hata = 0;
for (const [ad, ornekler] of gruplar) {
  console.log(`\n── ${ad} ──`);
  for (const t of ornekler) {
    for (const [mod, cells, sistemler] of [
      ['kısaltmalı', encK(t), SIS],
      ['düz       ', encD(t), KAPALI],
    ]) {
      const cikti = perkinsYaz(cells, sistemler);
      const beklenenBelirsiz = mod === 'kısaltmalı' && KISALTMA_MODU_BELIRSIZ.has(t);
      const ok = norm(cikti) === norm(t);
      toplam++;
      if (!ok && !beklenenBelirsiz) hata++;
      if (!ok) {
        console.log(`  ${beklenenBelirsiz ? '~' : '✗'} ${mod}  ${JSON.stringify(t).padEnd(26)}→ ${JSON.stringify(cikti)}`
          + (beklenenBelirsiz ? '   (bilinen belirsizlik)' : ''));
      }
    }
  }
  console.log('  (yalnız hatalar listelenir)');
}

// Durum makinesi (Serbest Yazma normal modu) — ileri bakışla matematik + sayı içi noktalama.
console.log('\n── Durum makinesi, ileri bakışlı (hucreyiIsle + sonrakiler) ──');
let thToplam = 0; let thHata = 0;
for (const t of [...MATEMATIK, ...NOKTALAMA, ...SAYI, ...HARF, 'Bugün hava çok güzel.', 'Saat 12.30 oldu.']) {
  const cikti = tekHucreliYaz(encD(t));
  const ok = norm(cikti) === norm(t);
  thToplam++;
  if (!ok) { thHata++; console.log(`  ✗ ${JSON.stringify(t).padEnd(26)}→ ${JSON.stringify(cikti)}`); }
}

// İleri bakış VERİLMEZSE eski (tek hücre) davranış korunmalı: harf/noktalama/büyük harf
// girdileri hâlâ doğru çözülmeli (YazmaEgitimi/YazmaYonergeli bu yolu kullanır).
console.log('\n── Durum makinesi, ileri bakışSIZ (geriye dönük uyumluluk) ──');
let ibToplam = 0; let ibHata = 0;
for (const t of [...HARF, 'ev.', 'ne?', 'ev,', '100', '1923', 'Bugün hava çok güzel.']) {
  const cikti = tekHucreliYazIleriBakissiz(encD(t));
  const ok = norm(cikti) === norm(t);
  ibToplam++;
  if (!ok) { ibHata++; console.log(`  ✗ ${JSON.stringify(t).padEnd(26)}→ ${JSON.stringify(cikti)}`); }
}

// ─────────────────────────────────────────────────────────────────────────────
// ÇAPRAZ DENETİM — AYNI hücre dizisini ÜÇ çözücü de AYNI okumalı
//   A) Perkins / Serbest Yazma kısaltma modu   → hucreleriMetneCevirKisaltmali (blok)
//   B) brf→metin (BrfOku + Araclar dosya okuma) → brfMetinedonSistemi
//   C) Serbest Yazma normal modu                → hucreyiIsle durum makinesi (ileri bakışlı)
// ⚠ "Bir çözücüyü düzeltip diğerini unutma" hatasını yakalar (kullanıcı: "bu tarz detayları
// detaylıca tüm sistemler için kontrol et; başka yazımlarda da sorun olmasın"). Bu denetim,
// brfOkuyucu içindeki ESKİ kısaltmasız satır-satır yolunun 33 örnekte 9'unu yanlış okuduğunu
// ortaya çıkardı (açılış tırnağı/parantezi, "1922'de", "|-7|") → o yol blok yoluna bağlandı.
// C kısaltma BİLMEZ → yalnız kısaltmasız kodlamada karşılaştırılır.
console.log('\n-- Çapraz denetim: A (Perkins) / B (brf->metin) / C (durum makinesi) --');
const CAPRAZ = [
  '=', '3+5=8', '2×3=6', '5-3=2', '√25', '%50', '(3+5)', '|-7|', '±5', '1/2', 'x<5', 'a≤b',
  'ev.', 'ev, bak', 'ne?', '(soru)', '“bu”', '“çok iyi biri”', 'Ne (yani)?',
  '100', '1.000', '1.234.567', '2,5', '4. sırada', '1233-1334', "1922'de", '12.30', '23.4.1923',
  'ev', 'Ev', 'EV', 'â', 'hâkim', 'q', 'w', 'x', 'Türkiye',
  'Bugün hava çok güzel.', '3+5=8 sonucu doğru.', 'Saat 12.30 oldu.', "Ahmet 1922'de geldi.",
];
let cToplam = 0; let cHata = 0;
for (const t of CAPRAZ) {
  const cellsK = encK(t); const cellsD = encD(t);
  const a = norm(perkinsYaz(cellsK, SIS));
  const b = norm(brfMetinedonSistemi(cellsK.map(noktalariBRF).join(''), true, SIS));
  cToplam++;
  if (a !== b) { cHata++; console.log('  X kısaltmalı ' + JSON.stringify(t) + ' A=' + JSON.stringify(a) + ' B=' + JSON.stringify(b)); }
  const a2 = norm(perkinsYaz(cellsD, KAPALI));
  const b2 = norm(brfMetinedonSistemi(cellsD.map(noktalariBRF).join(''), false, KAPALI));
  const c2 = norm(tekHucreliYaz(cellsD));
  cToplam++;
  if (!(a2 === b2 && b2 === c2)) {
    cHata++;
    console.log('  X düz ' + JSON.stringify(t) + ' A=' + JSON.stringify(a2) + ' B=' + JSON.stringify(b2) + ' C=' + JSON.stringify(c2));
  }
}
console.log('ÇAPRAZ DENETİM: ' + (cToplam - cHata) + '/' + cToplam + ' çözücü uyumu');


console.log(`\nBLOK ÇÖZÜCÜ (Araclar Perkins): ${toplam - hata}/${toplam} doğru`);
console.log(`DURUM MAKİNESİ (ileri bakışlı): ${thToplam - thHata}/${thToplam} doğru`);
console.log(`DURUM MAKİNESİ (ileri bakışsız): ${ibToplam - ibHata}/${ibToplam} doğru`);
if (hata || thHata || ibHata || cHata) {
  console.log('\n⚠ Perkins yazımında tutarsızlık var (yukarıdaki satırlar).');
  process.exitCode = 1;
} else {
  console.log('\n✓ Perkins yazımı tutarlı.');
}
