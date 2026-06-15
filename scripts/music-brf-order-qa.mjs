// İŞARET YAZIM SIRASI (order-of-signs) testi — Bölüm 13 (muzik-braille-yazim-kurallari.md).
// Bir notaya birden çok işaret eklenince, export'un onları STANDART sırada yazıp yazmadığını
// hücre-hücre doğrular. Editörün en kritik detayı (kullanıcı: "tüm işaretler doğru sırada mı").
//
//   node scripts/music-brf-order-qa.mjs

import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { muzikNotaSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import {
  MUZIK_DINAMIKLER, MUZIK_NUANS_ONCE, MUZIK_NUANS_SONRA, MUZIK_SUSLEMELER, MUZIK_BAGLAR,
  MUZIK_DUZENSIZ_GRUPLAR,
} from '../src/data/muzik.js';

const cell = (dots) => { let b = 0x2800; for (const d of dots) b |= 1 << (d - 1); return String.fromCodePoint(b); };
const cells = (arr) => arr.map((h) => cell(h.split('-').map(Number))).join('');

let idc = 0;
const yid = () => `o${idc++}`;
const bul = (arr, ad) => arr.find((x) => x.ad === ad) || (() => { throw new Error(`bulunamadı: ${ad}`); })();
// modifier nesnesi: kategoriyi gorselTip+kategori olarak set et (muzikModifierOncesiSira okur)
const mod = (kayit, kategori) => ({ id: yid(), kayit: { ...kayit, kategori, gorselTip: kategori } });
const dinamik = (ad) => mod(bul(MUZIK_DINAMIKLER, ad), 'dinamik');
const nuansOnce = (ad) => mod(bul(MUZIK_NUANS_ONCE, ad), 'nuans');
const nuansSonra = (ad) => mod(bul(MUZIK_NUANS_SONRA, ad), 'nuans');
const susleme = (ad) => mod(bul(MUZIK_SUSLEMELER, ad), 'susleme');
const bag = (ad) => mod(bul(MUZIK_BAGLAR, ad), 'bag');
const tuplet = (ad) => mod(bul(MUZIK_DUZENSIZ_GRUPLAR, ad), 'tuplet');

// nota: 2. oktav ki oktav işareti DAİMA yazılsın (ilk nota kuralı zaten yazdırır ama netlik için)
function nota({ acc = null, oncesi = [], sonrasi = [], dotted = false } = {}) {
  return muzikNotaSkorOgesi(yid(), 'do', 1, { oktav: 4, accidental: acc, dotted, modifiers: { oncesi, sonrasi } });
}

const exp = (ogeler, tupletler = []) => scoreToCanonicalBrf({ ogeler, baglar: [], header: {}, tupletler, options: {} })?.brfText || '';

const testler = [];
const T = (ad, ogeler, beklenenSira, tupletler = []) => testler.push({ ad, ogeler, beklenenSira, tupletler });

// Referans hücreler (doğrulama için)
const C_FORTE = cells(['3-4-5', '1-2-4']);     // ⠜⠋
const C_TRIL = cells(['2-3-5']);               // ⠖
const C_STAK = cells(['2-3-6']);               // ⠦
const C_AKSAN = cells(['4-6', '2-3-6']);       // aksent
const C_SHARP = cells(['1-4-6']);              // ⠩
const C_OKT4 = cells(['5']);                   // ⠐ (4. oktav)
const C_NOTA_DO_DORT = cells(['1-4-5-6']);     // do dörtlük (sureIdx1) = ⠹

// ── ÖNCE-nota sıra testleri (13.1) ──
// Slot sırası: dinamik(4) → süsleme(7) → nüans(8) → notanın-aksidentali(9) → oktav(10) → NOTA(11)
T('dinamik→süsleme→nüans→aksidental→oktav→nota',
  [nota({ acc: 'sharp', oncesi: [dinamik('forte'), susleme('tril'), nuansOnce('Stakato')] })],
  C_FORTE + C_TRIL + C_STAK + C_SHARP + C_OKT4 + C_NOTA_DO_DORT);

// Sadece aksidental + oktav sırası (9→10)
T('aksidental→oktav→nota',
  [nota({ acc: 'sharp' })],
  C_SHARP + C_OKT4 + C_NOTA_DO_DORT);

// Çok nüans aynı notada (13.3): staccato → accent (slot-içi sıra)
T('staccato→accent (slot-8 iç sıra)',
  [nota({ oncesi: [nuansOnce('aksent'), nuansOnce('Stakato')] })],   // ters sırada VER, sıralama düzeltmeli
  C_STAK + C_AKSAN + C_OKT4 + C_NOTA_DO_DORT);

// Süsleme + nüans sırası (7→8): tril → staccato
T('süsleme→nüans (7→8)',
  [nota({ oncesi: [nuansOnce('Stakato'), susleme('tril')] })],       // ters VER
  C_TRIL + C_STAK + C_OKT4 + C_NOTA_DO_DORT);

// Cümle bağı açılışı(3) → dinamik(4) — PDF Lesson 11 sırası (bracket slur dinamikten ÖNCE)
const C_BRACKET_OPEN = cells(['5-6', '1-2']);   // ⠰⠃
T('bracket-slur açılışı→dinamik (PDF 3<4)',
  [nota({ oncesi: [dinamik('forte'), bag('cümle bağı başlangıcı')] })],  // ters VER
  C_BRACKET_OPEN + C_FORTE + C_OKT4 + C_NOTA_DO_DORT);

// Dinamik(4) → üçleme(5) → süsleme(7) → nüans(8)
const C_UCLEME = cells(['2-3']);                // ⠆
T('dinamik→üçleme→süsleme→nüans (4<5<7<8)',
  [nota({ oncesi: [nuansOnce('Stakato'), susleme('tril'), tuplet('üçleme (tek hücreli)'), dinamik('forte')] })], // karışık VER
  C_FORTE + C_UCLEME + C_TRIL + C_STAK + C_OKT4 + C_NOTA_DO_DORT);

// Tuplet (tupletler ARRAY yolu) slot 5: dinamik(4) → tuplet(5) → süsleme(7) → nota
// (Array yolu eskiden oncesi modifier'lardan SONRA yazılıyordu → trill önce tuplet sonra = HATALI.)
{
  const tn1 = nota({ oncesi: [susleme('tril'), dinamik('forte')] });
  const tn2 = nota({});
  const tn3 = nota({});
  const tplr = [{ id: 'tpq', notaIdler: [tn1.id, tn2.id, tn3.id], kayit: { hucreler: [[2, 3]], ad: 'üçleme' } }];
  T('Tuplet(array)→süsleme: dinamik→tuplet→süsleme (4<5<7)',
    [tn1, tn2, tn3],
    C_FORTE + C_UCLEME + C_TRIL + C_OKT4 + C_NOTA_DO_DORT + C_NOTA_DO_DORT + C_NOTA_DO_DORT, tplr);
}

// ── SONRA-nota sıra testleri (13.2) ──
// Slot: uzatma noktası(1) → fermata(2) → … → nefes(7)
const C_DOT = cell([3]);                                      // ⠄
const C_FERMATA = cells(['1-2-6', '1-2-3']);                 // ⠣⠇
const C_NEFES = cells(['3-4-5', '2']);                       // ⠜⠂
T('SONRA: nokta→fermata→nefes (1→2→7)',
  [nota({ dotted: true, sonrasi: [nuansSonra('nefes işareti'), nuansSonra('fermata (durak)')] })], // ters VER
  C_OKT4 + C_NOTA_DO_DORT + C_DOT + C_FERMATA + C_NEFES);

console.log('═'.repeat(70));
console.log('İŞARET YAZIM SIRASI (order-of-signs) — Bölüm 13 doğrulaması');
console.log('═'.repeat(70));
let hata = 0;
for (const t of testler) {
  const got = exp(t.ogeler, t.tupletler).replace(/\n/g, ' ').replace(/⠀/g, '').trim();
  const ok = got === t.beklenenSira;
  if (!ok) hata++;
  console.log(`${ok ? '✓' : '✗'} ${t.ad}`);
  console.log(`    beklenen: ${t.beklenenSira}`);
  console.log(`    çıktı   : ${got}`);
  if (!ok) {
    const a = [...t.beklenenSira], b = [...got];
    let diff = ''; for (let i = 0; i < Math.max(a.length, b.length); i++) diff += a[i] === b[i] ? ' ' : '^';
    console.log(`    fark    : ${diff}`);
  }
}
console.log('═'.repeat(70));
console.log(hata === 0 ? '✓ TÜM yazım sıraları standartla uyumlu' : `✗ ${hata}/${testler.length} sıra testi BAŞARISIZ`);
process.exit(hata ? 1 : 0);
