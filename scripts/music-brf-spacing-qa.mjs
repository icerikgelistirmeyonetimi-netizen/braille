// BOŞLUK KURALLARI testi — Bölüm 14 (muzik-braille-yazim-kurallari.md).
// Müzik braillede boşluk anlam taşır (ölçü çizgisi = boşluk). Yanlış boşluk = yanlış okuma.
//
//   node scripts/music-brf-spacing-qa.mjs

import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { muzikNotaSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import { muzikTimeSigExpected16, muzikTimeSignatureHucreleri } from '../src/utils/music/index.js';

let idc = 0;
const yid = () => `s${idc++}`;
const N = (ad = 'do', oktav = 4) => muzikNotaSkorOgesi(yid(), ad, 1, { oktav });
const BARLINE = (tip = 'barline', hucreler = [[]]) => ({ id: yid(), tip, ad: tip, kind: 'manual', hucreler });
const ts = { ad: '4/4', gorunum: '4/4', expectedDuration16: muzikTimeSigExpected16('4/4'), hucreler: muzikTimeSignatureHucreleri('4/4') };

const exp = (ogeler, header = {}) =>
  (scoreToCanonicalBrf({ ogeler, baglar: [], header, tupletler: [], options: {} })?.brfText || '').replace(/\n/g, '⏎');

const U = (s) => JSON.stringify(s); // boşluğu görünür kıl
const testler = [];
const T = (ad, kosul, aciklama) => testler.push({ ad, kosul, aciklama });

// 1) Donanım ↔ zaman imzası: BİTİŞİK (boşluk YOK)
{
  const o = exp([N()], { keySignature: { ad: '1 bemollü', hucreler: [[1, 2, 6]] }, timeSignature: ts });
  T('Donanım↔zaman bitişik', o.includes('⠣⠼⠙⠲') && !o.includes('⠣⠀⠼⠙⠲'), `header: ${U(o.split('⏎').find(x => x.includes('⠼')))}`);
}

// 2) Final barline: öncesi BİTİŞİK (son notaya yapışık, araya boşluk yok)
{
  const o = exp([N(), N(), { id: yid(), tip: 'finalBarline', ad: 'Bitiş çizgisi', hucreler: [[1, 2, 6], [1, 3]], kind: 'manual' }], { timeSignature: ts });
  const govde = o.split('⏎').pop();
  T('Final barline öncesi bitişik', /⠹⠣⠅$/.test(govde) || govde.endsWith('⠣⠅') && !govde.endsWith('⠀⠣⠅'), `gövde sonu: ${U(govde.slice(-8))}`);
}

// 3) Sectional çift çubuk: öncesi BİTİŞİK, sonrası BOŞLUK
{
  const o = exp([N(), { id: yid(), tip: 'sectionalBarline', ad: 'Bölüm sonu', hucreler: [[1, 2, 6], [1, 3], [3]], kind: 'manual' }, N('re')], { timeSignature: ts });
  const govde = o.split('⏎').pop();
  // ⠹⠣⠅⠄⠀⠱ bekleriz: nota+sectional bitişik, sonra boşluk, sonra sonraki nota
  T('Sectional öncesi bitişik + sonrası boşluk', /⠣⠅⠄⠀/.test(govde) && !/⠀⠣⠅⠄/.test(govde), `gövde: ${U(govde)}`);
}

// 4) Bitir-tekrar :| öncesi BİTİŞİK, sonrası BOŞLUK
{
  const o = exp([N(), { id: yid(), tip: 'endRepeat', ad: 'Bitiş tekrarı', hucreler: [[1, 2, 6], [2, 3]], kind: 'manual' }, N('re')], { timeSignature: ts });
  const govde = o.split('⏎').pop();
  T('Bitir-tekrar öncesi bitişik + sonrası boşluk', /⠣⠆⠀/.test(govde) && !/⠀⠣⠆/.test(govde), `gövde: ${U(govde)}`);
}

// 5) Başla-tekrar |: öncesi BOŞLUK, sonrası BİTİŞİK (notaya yapışık)
{
  const o = exp([N(), BARLINE(), { id: yid(), tip: 'beginRepeat', ad: 'Başlangıç tekrarı', hucreler: [[1, 2, 6], [2, 3, 5, 6]], kind: 'manual' }, N('re')], { timeSignature: ts });
  const govde = o.split('⏎').pop();
  // ⠣⠶ sonrası nota bitişik olmalı (⠣⠶⠐ veya ⠣⠶⠹...) — sonrası boşluk OLMAMALI
  T('Başla-tekrar sonrası bitişik (notaya)', /⠣⠶[⠐⠨⠰⠸⠈⠘⠱⠹]/.test(govde) && !/⠣⠶⠀/.test(govde), `gövde: ${U(govde)}`);
}

// 6) İki nota arası ölçü çizgisi = 1 boşluk
{
  const o = exp([N(), BARLINE(), N('re')], { timeSignature: ts });
  const govde = o.split('⏎').pop();
  T('Ölçü çizgisi = 1 boşluk', /⠹⠀/.test(govde) && !/⠹⠀⠀/.test(govde), `gövde: ${U(govde)}`);
}

// 7) Eser içi zaman imzası DEĞİŞİMİ: iki yanında boşluk + round-trip (unknown YOK)
{
  const tsc = { id: yid(), tip: 'timeSignatureChange', ad: '3/4', gorunum: '3/4', hucreler: muzikTimeSignatureHucreleri('3/4') };
  const ogeler = [N(), N(), N('mi'), N('fa'), BARLINE(), tsc, N('sol'), N('la'), N('si')];
  const o = exp(ogeler, { timeSignature: ts });
  const govde = o.split('⏎').pop();
  const r = brfMuzikOku(govde.replace(/⏎/g, '\n'), { source: 'spacing-qa' });
  const tscOkundu = (r.items || []).some((it) => it.tip === 'timeSignatureChange');
  const unknownYok = !(r.items || []).some((it) => it.tip === 'unknown');
  T('Zaman değişimi: iki yanı boşluk + round-trip', /⠀⠼⠉⠲⠀/.test(govde) && tscOkundu && unknownYok, `gövde: ${U(govde)} | tsChange:${tscOkundu} unknown:${!unknownYok}`);
}

console.log('═'.repeat(70));
console.log('BOŞLUK KURALLARI (spacing) — Bölüm 14 doğrulaması');
console.log('═'.repeat(70));
let hata = 0;
for (const t of testler) {
  if (!t.kosul) hata++;
  console.log(`${t.kosul ? '✓' : '✗'} ${t.ad}`);
  console.log(`    ${t.aciklama}`);
}
console.log('═'.repeat(70));
console.log(hata === 0 ? '✓ TÜM boşluk kuralları doğru' : `✗ ${hata}/${testler.length} boşluk testi BAŞARISIZ`);
process.exit(hata ? 1 : 0);
