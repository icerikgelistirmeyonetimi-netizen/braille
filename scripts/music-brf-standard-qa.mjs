// BRF EXPORT standart-uygunluk testi.
// Editörün "BRF İndir" çıktısını (scoreToCanonicalBrf), PDF ile doğrulanmış
// fixture braille'iyle (muzik-braille-test-ornekleri.md oracle'ı) karşılaştırır.
// Round-trip testinden FARKI: bu, standarda uygunluğu test eder (ikisi de muzik.js'ten
// türese de, beklenen çıktı PDF'ten gelir).
//
//   node scripts/music-brf-standard-qa.mjs

import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { muzikSkorunuBrailleyeCevir } from '../src/utils/music/musicBrfEngine.js';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { brailleMetniOlustur } from '../src/utils/music-brf/brailleText.js';
import { muzikNotaSkorOgesi, muzikSusSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import { MUZIK_DINAMIKLER } from '../src/data/muzik.js';

let idc = 0;
const yid = () => `n${idc++}`;

// notaAd eşlemesi
const AD = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si' };
// süre eşlemesi → sureIdx
const SUR = { q: 0, c: 1, m: 2, s: 3, '16': 4, '32': 5, '64': 6, '128': 7 };

function N(letter, oktav, dur, ek = {}) {
  return muzikNotaSkorOgesi(yid(), AD[letter], SUR[dur], { oktav, accidental: ek.acc || null, dotted: !!ek.dot, modifiers: ek.mods || { oncesi: [], sonrasi: [] } });
}
function R(dur, ek = {}) { return muzikSusSkorOgesi(yid(), SUR[dur], { dotted: !!ek.dot }); }
const BAR = () => ({ id: yid(), tip: 'barline', kind: 'manual', ad: 'Ölçü çizgisi', hucreler: [[]] });
const dyn = (ad) => ({ id: `m${idc++}`, kayit: { ...MUZIK_DINAMIKLER.find(d => d.ad === ad), kategori: 'dinamik', gorselTip: 'dinamik' } });

// İNDİR yolu: scoreToCanonicalBrf (canonical pipeline → engine → ölçü join).
// useBrailleOutput gibi gruplama ayarını header'dan al → overlay ile aynı seçenekler.
const exp = (ogeler, header = {}) => {
  const useBrailleGrouping = Boolean(header?.useBrailleGrouping);
  return scoreToCanonicalBrf({
    ogeler, baglar: [], header, tupletler: [],
    options: { useBrailleGrouping, strictDurationCells: !useBrailleGrouping },
  })?.brfText || '';
};

// EKRAN-ALTI OVERLAY yolu: useBrailleOutput'un yaptığı gibi engine'i DOĞRUDAN çağır.
// (düzeltme sonrası) gruplama ayarını header'dan alır → İNDİR ile birebir aynı seçenekler.
const overlay = (ogeler, header = {}) => {
  const useBrailleGrouping = Boolean(header?.useBrailleGrouping);
  const r = muzikSkorunuBrailleyeCevir(ogeler, [], header, [], {
    includeBarNumbers: false, useBrailleGrouping, strictDurationCells: !useBrailleGrouping,
  });
  return brailleMetniOlustur(r.hucreler || []);
};

// ── Test parçaları: { ad, ogeler, beklenen (PDF fixture braille — satır kırılması/ölçü no hariç) } ──
const testler = [];
const T = (ad, ogeler, beklenen) => testler.push({ ad, ogeler, beklenen });

// 1) Ode to Joy bar1-2 (saf nota + oktav-aralık + ölçü ayracı)
T('Ode to Joy bar1-2',
  [N('E',4,'q'),N('E',4,'q'),N('F',4,'q'),N('G',4,'q'),BAR(),
   N('G',4,'q'),N('F',4,'q'),N('E',4,'q'),N('D',4,'q')],
  '⠐⠋⠋⠛⠓ ⠓⠛⠋⠑');

// 2) Oktav atlama (6'lı atlama örneği s.25 bar1-2)
T('Oktav atlama (6lı)',
  [N('G',3,'m'),N('E',4,'m'),BAR(),
   N('F',4,'c'),N('G',4,'c'),N('A',4,'c'),N('B',3,'c')],
  '⠸⠗⠐⠏ ⠻⠳⠪⠸⠺');

// 3) KURAL 4 testi: dinamik sonrası nota oktav işareti almalı (Trumpet bar4/bar7 mantığı)
//    F4 (ilk nota → ⠐⠛), forte, A4: F→A 3'lü normalde işaretsiz; ama forte SÖZCÜĞÜNDEN sonra
//    A4 OKTAV İŞARETİ ALMALI → ⠐⠛⠜⠋⠐⠊  (PDF Trumpet/Fidelio/Angels + NFB Ch.14 ile doğrulandı)
T('KURAL 4: sözcük→oktav',
  [N('F',4,'q'),N('A',4,'q',{mods:{oncesi:[dyn('forte')],sonrasi:[]}})],
  '⠐⠛⠜⠋⠐⠊');

// 4) Dinamik ilk notada (mf + F minim) — mf zaten ilk notada, oktav var
T('mf ilk nota',
  [N('F',4,'m',{mods:{oncesi:[dyn('mezo forte')],sonrasi:[]}}),N('G',4,'m')],
  '⠜⠍⠋⠐⠟⠗');

const norm = (s) => s.replace(/\n/g, ' ').replace(/⠀/g, ' ').trim();
const farkSatiri = (beklenen, got) => {
  const a = [...beklenen], b = [...got];
  const n = Math.max(a.length, b.length);
  let diff = '';
  for (let i = 0; i < n; i++) diff += (a[i] === b[i] ? ' ' : '^');
  return diff;
};

// ── Gruplama (useBrailleGrouping) açıkken İNDİR ile OVERLAY tutarlı mı? ──
// Standart §6: 8'lik/daha kısa, aynı vuruşta, gruplanabilir notalar → ilk nota gerçek değer,
// kalanı pitch-only. Düzeltme sonrası overlay de gruplama ayarını uygular → birebir aynı.
{
  const grupOgeler = [N('C',4,'16'),N('D',4,'16'),N('E',4,'16'),N('F',4,'16')];
  const grupHeader = { useBrailleGrouping: true, timeSignature: { gorunum: '2/4', ad: '2/4', hucreler: [[3,4,5,6],[2]] } };
  const gExp = norm(exp(grupOgeler, grupHeader));   // İNDİR
  const gOvl = norm(overlay(grupOgeler, grupHeader)); // OVERLAY (düzeltilmiş)
  // İndir başında ölçü numarası/zaman imzası header satırı olabilir; gövdeyi karşılaştır
  const gExpBody = gExp.split(' ').filter(s => s.startsWith('⠐') || /[⠽⠵⠯⠿⠑⠋⠛]/.test(s)).join(' ');
  const tutarli = gExp.includes(gOvl) || gExpBody === gOvl || gExp.endsWith(gOvl);
  console.log('─ Gruplama (useBrailleGrouping=true) İNDİR ↔ OVERLAY ─');
  console.log(`    indir   : ${gExp}`);
  console.log(`    overlay : ${gOvl}`);
  console.log(`    → ${tutarli ? '✓ tutarlı — overlay de gruplama uyguluyor' : '⚠ AYRIŞIYOR'}`);
  console.log('');
}

console.log('═'.repeat(64));
console.log('BRF — standart (PDF fixture) uygunluk testi');
console.log('İNDİR (scoreToCanonicalBrf) + EKRAN-ALTI OVERLAY (muzikSkorunuBrailleyeCevir)');
console.log('═'.repeat(64));
let hata = 0;
for (const t of testler) {
  const got = norm(exp(t.ogeler));
  const ovl = norm(overlay(t.ogeler));
  const okExp = got === t.beklenen;
  const okOvl = ovl === t.beklenen;
  const okTutarli = got === ovl; // iki yol birbirine tutarlı mı
  if (!okExp || !okOvl) hata++;
  console.log(`${okExp && okOvl ? '✓' : '✗'} ${t.ad}${okTutarli ? '' : '  ⚠ İNDİR≠OVERLAY'}`);
  console.log(`    beklenen: ${t.beklenen}`);
  console.log(`    indir   : ${got}${okExp ? '' : '   ← standarttan sapıyor'}`);
  if (!okExp) console.log(`    fark    : ${farkSatiri(t.beklenen, got)}`);
  console.log(`    overlay : ${ovl}${okOvl ? '' : '   ← standarttan sapıyor'}`);
  if (!okOvl) console.log(`    fark    : ${farkSatiri(t.beklenen, ovl)}`);
}
console.log('═'.repeat(64));
console.log(hata === 0
  ? '✓ EXPORT: tümü standartla uyumlu — İNDİR ve EKRAN-ALTI braille birebir doğru'
  : `✗ EXPORT: ${hata}/${testler.length} test BAŞARISIZ`);

// ── IMPORT round-trip: ogeler → export (doğrulanmış) → import → perde+oktav korunmalı ──
// Güvenilir oracle = fixture ogeler'i (PDF-doğrulanmış). Hazır parçalar DEĞİL.
// Süre dual-meaning belirsizliği ölçü-süresine bağlı olduğundan perde(notaAd)+oktav karşılaştırılır
// (bunlar kesin). Bu, Kural 4 oktav işaretinin import'ta doğru ÇÖZÜLDÜĞÜNÜ de doğrular.
console.log('');
console.log('═'.repeat(64));
console.log('IMPORT round-trip (export → brfMuzikOku): perde+oktav korunuyor mu?');
console.log('═'.repeat(64));
let ihata = 0;
const notaOgeleri = (ogeler) => ogeler.filter((o) => o.tip === 'nota').map((o) => `${o.notaAd}${o.oktav}`);
// Editör gibi HEADER ile export et: gövde ilk içerik satırı OLMAZ → reader gövdeyi başlık sanmaz.
// (Header'sız çıplak braille, harf gibi görünen nota dizilerinde başlık-yanılması yapabilir; bu
// editör akışında oluşmaz çünkü export daima başlık/zaman satırları yazar. Ayrı not edildi.)
const importHeader = { title: 'QA', timeSignature: { ad: '4/4', gorunum: '4/4', hucreler: [[3, 4, 5, 6], [2]] } };
for (const t of testler) {
  const brf = exp(t.ogeler, importHeader);
  const res = brfMuzikOku(brf, { source: 'standart-qa-import' });
  const beklenenSeq = notaOgeleri(t.ogeler);
  const okunanSeq = (res.items || []).filter((it) => it.tip === 'nota').map((it) => `${it.notaAd}${it.oktav}`);
  const unknown = (res.items || []).filter((it) => it.tip === 'unknown').length;
  const ayni = beklenenSeq.length === okunanSeq.length && beklenenSeq.every((x, i) => x === okunanSeq[i]);
  const ok = ayni && unknown === 0;
  if (!ok) ihata++;
  console.log(`${ok ? '✓' : '✗'} ${t.ad}${unknown ? `  (${unknown} bilinmeyen)` : ''}`);
  console.log(`    beklenen perde+oktav: ${beklenenSeq.join(' ')}`);
  console.log(`    import okudu         : ${okunanSeq.join(' ')}`);
}
console.log('═'.repeat(64));
console.log(ihata === 0
  ? '✓ IMPORT: tüm fixture\'lar perde+oktav korunarak okundu (Kural 4 oktav işareti dahil)'
  : `✗ IMPORT: ${ihata}/${testler.length} fixture BAŞARISIZ`);

process.exit(hata || ihata ? 1 : 0);
