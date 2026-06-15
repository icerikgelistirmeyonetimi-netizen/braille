// ZAMAN İMZASI ↔ NOTA SÜRESİ KORUMA testi (kullanıcı: "imza değiştiğinde nota süreleri korunmalı").
//
// GARANTİ: Nota gruplama (beam) braille'de devam notalarını 8'lik-hücreyle KISALTSA da, gruplama-geri-kurma
// notanın MÜZİKAL süresini ASLA değiştirmemeli. Gruplama VURUŞ-FARKINDADIR (zaman imzasının vuruş yapısına
// bağlı): bir vuruşun 16'lık grubu, sonraki vuruşun GERÇEK 8'liklerine taşmamalı. Bu test, her zaman imzası
// için DOLU bir ölçü (vuruşa oturan 16'lık-grup + gerçek 8'likler) kurar, gruplama açık export + import eder
// ve sürelerin korunduğunu doğrular.
//
// NOT: editör-içi koruma YAPISALDIR — setTimeSignature yalnız header'ı günceller, muzikOgeleri sürelerine
// dokunmaz, imza değişiminde re-import tetiklenmez. Bu test round-trip (indir/yükle) kenarındaki gruplama
// geri-kurmasını korur. (Çift-anlamlı süre = ayrı mekanizma; ölçüye OTURAN parçada stabildir, bu yüzden
// her ölçü o imzaya tam oturacak şekilde kuruldu.)
//
//   node scripts/music-brf-timesig-preserve-qa.mjs

import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { muzikSkorunuBrailleyeCevir } from '../src/utils/music/musicBrfEngine.js';
import { muzikNotaSkorOgesi } from '../src/utils/music/musicScoreFactory.js';

const N = (ad, si) => ({ ad, si });          // nota: ad + süre-indeksi (4=16'lık, 0=8'lik, 1=4'lük)
const toCh = (h) => { let b = 0x2800; for (const d of (h || [])) b |= 1 << (d - 1); return String.fromCodePoint(b); };
const PERDE = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
let _id = 0;

// 16'lık-grup (4) = vuruşa oturan dört 16'lık; ardından genuine 8'likler. Her ölçü o imzaya TAM oturur.
const g16 = ( p) => [N(PERDE[p % 7], 4), N(PERDE[(p + 1) % 7], 4), N(PERDE[(p + 2) % 7], 4), N(PERDE[(p + 3) % 7], 4)]; // 4 sixteenths
const e8 = (p) => [N(PERDE[p % 7], 0), N(PERDE[(p + 1) % 7], 0)]; // 4 sixteenths (2 eighths)
const g16e8compound = (p) => [N(PERDE[p % 7], 4), N(PERDE[(p + 1) % 7], 4), N(PERDE[(p + 2) % 7], 4), N(PERDE[(p + 3) % 7], 4), N(PERDE[(p + 4) % 7], 0)]; // 6 sixteenths (4×16 + 1×8)

// Her zaman imzası için DOLU ölçü (vuruşlar 16'lık-grup ve/veya 8'liklerle dolu) + imza hücreleri.
const METER = {
  '4/4': { hucreler: [[3, 4, 5, 6], [1, 4, 5], [2, 5, 6]], notalar: [...g16(0), ...e8(4), ...g16(0), ...e8(4)] }, // 4+4+4+4=16
  '2/4': { hucreler: [[3, 4, 5, 6], [1, 2], [2, 5, 6]], notalar: [...g16(0), ...e8(4)] }, // 4+4=8
  '3/4': { hucreler: [[3, 4, 5, 6], [1, 4], [2, 5, 6]], notalar: [...g16(0), ...e8(4), ...e8(0)] }, // 4+4+4=12
  '6/8': { hucreler: [[3, 4, 5, 6], [1, 2, 4], [2, 3, 6]], notalar: [...g16e8compound(0), ...g16e8compound(2)] }, // 6+6=12
  '3/8': { hucreler: [[3, 4, 5, 6], [1, 4], [2, 3, 6]], notalar: [...g16e8compound(0)] }, // 6
  '9/8': { hucreler: [[3, 4, 5, 6], [2, 4], [2, 3, 6]], notalar: [...g16e8compound(0), ...g16e8compound(2), ...g16e8compound(4)] }, // 6+6+6=18
  'cut': { hucreler: [[4, 5, 6], [1, 4]], notalar: [...g16(0), ...e8(4), ...g16(0), ...e8(4)] }, // 16
};

const efektifSure = (it) => (Number.isInteger(it.grupSureIndeksi) ? it.grupSureIndeksi : it.sureIndeksi);

console.log('═'.repeat(78));
console.log('ZAMAN İMZASI ↔ NOTA SÜRESİ KORUMA — gruplama geri-kurması süreyi bozmamalı');
console.log('═'.repeat(78));

let toplamFail = 0;
for (const [ts, { hucreler, notalar }] of Object.entries(METER)) {
  const ogeler = notalar.map((n) => muzikNotaSkorOgesi(`n${_id++}`, n.ad, n.si, { oktav: 4 }));
  const beklenen = notalar.map((n) => n.si);
  const header = { timeSignature: { ad: ts, gorunum: ts, hucreler }, useBrailleGrouping: true };
  const r = muzikSkorunuBrailleyeCevir(ogeler, [], header, [], { useBrailleGrouping: true, strictDurationCells: false });
  const imza = hucreler.map(toCh).join('');
  const back = brfMuzikOku(`${imza}\n${r.hucreler.map(toCh).join('')}`);
  const sureler = (back.items || []).filter((i) => i.tip === 'nota').map(efektifSure);
  const ok = JSON.stringify(sureler) === JSON.stringify(beklenen);
  if (!ok) toplamFail += 1;
  console.log(`${ok ? '✓' : '✗'} ${ts.padEnd(5)} beklenen:[${beklenen.join(',')}]${ok ? '' : `\n     okunan: [${sureler.join(',')}]`}`);
}

console.log('═'.repeat(78));
if (toplamFail === 0) {
  console.log('✓ TÜM süreler korundu — gruplama VURUŞ-FARKINDA, 16-grup gerçek 8-liklere taşmıyor.');
  process.exit(0);
}
console.log(`✗ ${toplamFail} imzada süre DEĞİŞTİ.`);
process.exit(1);
