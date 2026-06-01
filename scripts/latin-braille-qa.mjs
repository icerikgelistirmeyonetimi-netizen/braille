/**
 * latinBrailleCevir.js için QA testi.
 * Çalıştır: node scripts/latin-braille-qa.mjs
 *
 * Doğruluk dayanakları:
 * - Temel harf/aksan/rakam/gösterge hücreleri standart braille tablolarından.
 * - Tam kelime kısaltmaları veri dosyalarından (öğrenme modülleriyle birebir).
 * - İngilizce grup işaretleri UEB konum kurallarından.
 */
import { metniLatinBrailleyeCevir } from '../src/utils/latinBrailleCevir.js';

let basari = 0;
let hata = 0;
const hatalar = [];

const H = (s) => s.split('|').map((g) => (g === '' ? [] : g.split('-').map(Number)));

function bekle(dil, kisaltma, metin, beklenenStr) {
  const beklenen = H(beklenenStr);
  const { hucreler } = metniLatinBrailleyeCevir(metin, { dil, kisaltma });
  const got = JSON.stringify(hucreler);
  const exp = JSON.stringify(beklenen);
  if (got === exp) {
    basari += 1;
  } else {
    hata += 1;
    hatalar.push({ dil, kisaltma, metin, beklenen: exp, alinan: got });
  }
}

/* ───────────────────────────  TEMEL (Grade 1)  ─────────────────────────── */
// İngilizce alfabe
bekle('en', false, 'abc', '1|1-2|1-4');
bekle('en', false, 'xyz', '1-3-4-6|1-3-4-5-6|1-3-5-6');
// Büyük harf göstergesi (dot 6)
bekle('en', false, 'A', '6|1');
bekle('en', false, 'Ab', '6|1|1-2');
// Rakam: # + a..j
bekle('en', false, '1', '3-4-5-6|1');
bekle('en', false, '10', '3-4-5-6|1|2-4-5');
bekle('en', false, '2024', '3-4-5-6|1-2|2-4-5|1-2|1-4-5');
// Ondalık / kesir
bekle('en', false, '3.14', '3-4-5-6|1-4|2|1|1-4-5');
bekle('en', false, '1/2', '3-4-5-6|1|3-4|1-2');
// Noktalama
bekle('en', false, 'a, b.', '1|2||1-2|2-5-6');
bekle('en', false, 'ab?', '1|1-2|2-3-6');
// Boşluk
bekle('en', false, 'a b', '1||1-2');

/* ─────────────────  İNGİLİZCE — kısaltma KAPALI (harf harf)  ────────────── */
bekle('en', false, 'cat', '1-4|1|2-3-4-5');
bekle('en', false, 'and', '1|1-3-4-5|1-4-5');

/* ─────────────────  İNGİLİZCE — tam kelime kısaltmaları  ────────────────── */
// Alfabetik wordsign: and = ⠯ (1-2-3-4-6)
bekle('en', true, 'and', '1-2-3-4-6');
bekle('en', true, 'for', '1-2-3-4-5-6');
bekle('en', true, 'the', '2-3-4-6');
bekle('en', true, 'with', '2-3-4-5-6');
bekle('en', true, 'but', '1-2');     // b
bekle('en', true, 'you', '1-3-4-5-6'); // y
// Büyük harfli wordsign
bekle('en', true, 'And', '6|1-2-3-4-6');
// Shortform (çok hücreli)
bekle('en', true, 'about', '1|1-2');       // ab
bekle('en', true, 'would', '2-4-5-6|1-4-5'); // wd
bekle('en', true, 'good', '1-2-4-5|1-4-5');  // gd

/* ─────────────────  İNGİLİZCE — kelime içi grup işareti UYGULANMAZ  ──────
   (hece sınırı belirsizliği → sıfır hata için sözlükte yoksa harf harf) */
// ch, th, st vb. kelime içinde KISALTILMAZ — Grade-1
bekle('en', true, 'cheese', '1-4|1-2-5|1-5|1-5|2-3-4|1-5'); // c h e e s e
bekle('en', true, 'rich', '1-2-3-5|2-4|1-4|1-2-5');         // r i c h
bekle('en', true, 'bath', '1-2|1|2-3-4-5|1-2-5');           // b a t h
bekle('en', true, 'sing', '2-3-4|2-4|1-3-4-5|1-2-4-5');     // s i n g
bekle('en', true, 'table', '2-3-4-5|1|1-2|1-2-3|1-5');      // t a b l e
bekle('en', true, 'nation', '1-3-4-5|1|2-3-4-5|2-4|1-3-5|1-3-4-5'); // n a t i o n

/* ───────────────────────────  ALMANCA  ─────────────────────────────────── */
// Alfabe + umlaut
bekle('de', false, 'abc', '1|1-2|1-4');
bekle('de', false, 'ä', '3-4-5');
bekle('de', false, 'ö', '2-4-6');
bekle('de', false, 'ü', '1-2-5-6');
bekle('de', false, 'ß', '2-3-4-6');
// Büyük harf dot 6
bekle('de', false, 'A', '6|1');
// Tam kelime kısaltmaları (Kürzung)
bekle('de', true, 'und', '1-3-6');    // ⠥
bekle('de', true, 'der', '1-2-3-5');  // r hücresi
bekle('de', true, 'die', '3-4-6');
bekle('de', true, 'das', '1-4-5');    // d
bekle('de', true, 'mit', '2-3-4-5');  // t? → veri: mit = 2-3-4-5
bekle('de', true, 'und der', '1-3-6||1-2-3-5');
// Kısaltma kapalıyken harf harf
bekle('de', false, 'und', '1-3-6|1-3-4-5|1-4-5'); // u n d

/* ───────────────────────────  FRANSIZCA  ───────────────────────────────── */
// Alfabe + aksan
bekle('fr', false, 'abc', '1|1-2|1-4');
bekle('fr', false, 'é', '1-2-3-4-5-6');
bekle('fr', false, 'à', '1-2-3-5-6');
bekle('fr', false, 'ç', '1-2-3-4-6');
// Büyük harf dots 4-6
bekle('fr', false, 'A', '4-6|1');
bekle('fr', false, 'É', '4-6|1-2-3-4-5-6');
// Tam kelime kısaltmaları (abrégé)
bekle('fr', true, 'le', '1-2-3');     // l
bekle('fr', true, 'la', '6');
bekle('fr', true, 'les', '3-4-5');
bekle('fr', true, 'que', '1-2-3-4-5'); // q
bekle('fr', true, 'pour', '1-2-3-4-6');
bekle('fr', true, 'et', '2-3-4-5-6');
// Kısaltma kapalıyken harf harf
bekle('fr', false, 'le', '1-2-3|1-5'); // l e

/* ───────────────────────────  Sonuç  ──────────────────────────────────── */
console.log(`\nBaşarılı: ${basari}  |  Hatalı: ${hata}\n`);
if (hatalar.length) {
  for (const h of hatalar) {
    console.log(`✗ [${h.dil}${h.kisaltma ? '+k' : ''}] "${h.metin}"`);
    console.log(`    beklenen: ${h.beklenen}`);
    console.log(`    alınan  : ${h.alinan}`);
  }
  process.exit(1);
} else {
  console.log('✓ Tüm testler geçti.');
}
