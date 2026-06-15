// ZORUNLU OKTAV BAĞLAMLARI testi — Bölüm 1.2.b (muzik-braille-yazim-kurallari.md).
// Normalde 2'li/3'lü aralık oktav işareti GEREKTİRMEZ; ama belirli bağlamlardan SONRAKİ ilk nota
// — aralık ne olursa olsun — oktav işareti alır: ilk nota, satır başı, tekrar/volta, zaman/donanım
// değişimi, bölüm-sonu çift çubuk, sözcük-dinamik (Kural 4). Burada repeat/volta/değişim test edilir.
//
//   node scripts/music-brf-octave-qa.mjs

import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { muzikNotaSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import { muzikTimeSigExpected16, muzikTimeSignatureHucreleri } from '../src/utils/music/index.js';

let idc = 0;
const yid = () => `k${idc++}`;
const N = (ad, oktav = 4) => muzikNotaSkorOgesi(yid(), ad, 1, { oktav });
const tsObj = (ad) => ({ id: yid(), tip: 'timeSignatureChange', ad, gorunum: ad, hucreler: muzikTimeSignatureHucreleri(ad), expectedDuration16: muzikTimeSigExpected16(ad) });
const ts = { ad: '4/4', gorunum: '4/4', expectedDuration16: muzikTimeSigExpected16('4/4'), hucreler: muzikTimeSignatureHucreleri('4/4') };
const OKT4 = '⠐'; // 4. oktav işareti

const bar = (tip, hucreler) => ({ id: yid(), tip, ad: tip, kind: 'manual', hucreler });
const exp = (ogeler) => (scoreToCanonicalBrf({ ogeler, baglar: [], header: { timeSignature: ts }, tupletler: [], options: {} })?.brfText || '').split('\n').pop();

const testler = [];
// her testte: 2'li aralık (do→re, normalde işaretsiz). Araya bağlam girince re OKTAV almalı.
// İşaret kontrolü: gövdede "bağlam + ⠐⠱" (oktavlı re) geçiyor mu.
const T = (ad, ogeler, beklenenOktavliRe) => {
  const govde = exp(ogeler);
  // re'nin oktav işaretli mi: ⠐⠱ (oktavlı) vs ⠱ (oktavsız)
  testler.push({ ad, govde, ok: beklenenOktavliRe ? govde.includes(OKT4 + '⠱') : true });
};

// Referans: do→re 2'li aralık, araya HİÇBİR ŞEY girmeden → re OKTAVSIZ olmalı (kontrol)
{
  const govde = exp([N('do'), N('re')]);
  testler.push({ ad: 'KONTROL: do→re (2li) araya hiçbir şey yok → re oktavSIZ', govde, ok: !govde.includes(OKT4 + '⠱') && govde.includes('⠱') });
}

// 1) Başla-tekrar sonrası → re OKTAV almalı
T('Başla-tekrar sonrası → oktav zorla', [N('do'), bar('barline', [[]]), bar('beginRepeat', [[1, 2, 6], [2, 3, 5, 6]]), N('re')], true);
// 2) Bitir-tekrar sonrası → re OKTAV almalı
T('Bitir-tekrar sonrası → oktav zorla', [N('do'), bar('endRepeat', [[1, 2, 6], [2, 3]]), N('re')], true);
// 3) Volta (1. dolap) sonrası → re OKTAV almalı
T('Volta sonrası → oktav zorla', [N('do'), bar('barline', [[]]), { id: yid(), tip: 'volta1', ad: '1. ev', hucreler: [[3, 4, 5, 6], [2]], kind: 'manual' }, N('re')], true);
// 4) Zaman imzası değişimi sonrası → re OKTAV almalı
T('Zaman imzası değişimi sonrası → oktav zorla', [N('do'), tsObj('3/4'), N('re')], true);

console.log('═'.repeat(70));
console.log('ZORUNLU OKTAV BAĞLAMLARI (Bölüm 1.2.b) doğrulaması');
console.log('═'.repeat(70));
let hata = 0;
for (const t of testler) {
  if (!t.ok) hata++;
  console.log(`${t.ok ? '✓' : '✗'} ${t.ad}`);
  console.log(`    gövde: ${JSON.stringify(t.govde)}`);
}
console.log('═'.repeat(70));
console.log(hata === 0 ? '✓ TÜM zorunlu-oktav bağlamları doğru' : `✗ ${hata}/${testler.length} BAŞARISIZ`);
process.exit(hata ? 1 : 0);
