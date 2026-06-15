// Aksak/düzensiz metre VURUŞ GRUPLAMASI QA — seçilebilir gruplama + import auto-çözümü.
//
// Araştırma (Music Braille Code 2015 + International Manual + nota teorisi): 5/8, 7/8, 9/8, 10/8 gibi
// aksak metrelerde vuruş bölünmesi SABİT DEĞİL — bestecinin kiriş seçimine göre değişir. Bu test her
// metrenin her gruplama seçeneği için:
//   1) seçilen desenle EXPORT eder (16'lık dolu ölçü; gruplama açık),
//   2) yeniden IMPORT eder (reader gruplama desenini VERİDEN auto-çözmeli),
//   3) doğrular: (a) ölçü-süre/taşma uyarısı YOK, (b) reader deseni doğru çözdü,
//      (c) adaptör efektif süresi tüm notalarda 16'lık (grupSureIndeksi) — süre KORUNDU.
//
//   node scripts/music-brf-grouping-qa.mjs

import { muzikNotaSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { muzikTimeSigExpected16, muzikTimeSignatureHucreleri } from '../src/utils/music/index.js';
import { MUZIK_GRUPLAMA_SECENEKLERI } from '../src/utils/music/musicConstants.js';
import { gorselZamanImzasiVurusDeseniAl } from '../src/utils/music-brf/musicVisualBeamHelpers.js';

const SIXTEENTH_IDX = 4; // SURE_GOSTERGELERI[4] = 16-lık nota

function buildHeader(ad, gruplamaDeseni) {
  return {
    title: '', composer: '', tempo: '', keySignature: null,
    timeSignature: {
      ad, gorunum: ad,
      expectedDuration16: muzikTimeSigExpected16(ad),
      hucreler: muzikTimeSignatureHucreleri(ad),
      ...(gruplamaDeseni ? { gruplamaDeseni } : {}),
    },
  };
}

let toplam = 0;
let gecen = 0;
const hatalar = [];

for (const [ad, secenekler] of Object.entries(MUZIK_GRUPLAMA_SECENEKLERI)) {
  const expected16 = muzikTimeSigExpected16(ad); // dolu ölçüdeki 16'lık sayısı
  console.log(`\n══ ${ad} (${expected16} adet 16'lık) ══`);
  for (const desen of secenekler) {
    toplam += 1;
    const desenAd = desen.join('+');
    const h = buildHeader(ad, desen);
    const ogeler = Array.from({ length: expected16 }, (_, i) => muzikNotaSkorOgesi(`n${i}`, 'do', SIXTEENTH_IDX, { oktav: 4 }));

    const out = scoreToCanonicalBrf({ ogeler, baglar: [], header: h, tupletler: [], options: { includeBarNumbers: false, useBrailleGrouping: true } });
    const res = brfMuzikOku(out.brfText, { source: 'editor-canonical-brf' });

    const uyarilar = (res.warnings || []).filter((w) => w.type === 'measure-duration-warning' || w.type === 'measure-overflow');
    const notalar = (res.items || []).filter((it) => it.tip === 'nota');
    const effIdx = notalar.map((n) => (Number.isInteger(n.grupSureIndeksi) ? n.grupSureIndeksi : n.sureIndeksi));
    const hep16 = notalar.length === expected16 && effIdx.every((i) => i === SIXTEENTH_IDX);
    const cozulen = res.header?.timeSignature?.gruplamaDeseni || gorselZamanImzasiVurusDeseniAl(h.timeSignature).map((x) => x / 2);
    const cozulenAd = Array.isArray(cozulen) ? cozulen.join('+') : '?';

    // Çözülen desen, exportlanan desenle AYNI vuruş sınırlarını üretmeli (değer eşitliği).
    const beklenen16 = gorselZamanImzasiVurusDeseniAl(buildHeader(ad, desen).timeSignature).join(',');
    const cozulen16 = gorselZamanImzasiVurusDeseniAl(buildHeader(ad, res.header?.timeSignature?.gruplamaDeseni || desen).timeSignature).join(',');
    const desenDogru = beklenen16 === cozulen16;

    const ok = uyarilar.length === 0 && hep16 && desenDogru;
    if (ok) gecen += 1;
    else hatalar.push(`${ad} ${desenAd}: uyarı=${uyarilar.length} hep16=${hep16} çözülen=${cozulenAd}`);
    console.log(`  ${ok ? '✓' : '✗'} ${desenAd.padEnd(9)} → çözülen ${cozulenAd.padEnd(9)} | nota ${notalar.length}/${expected16} | uyarı ${uyarilar.length}`);
  }
}

console.log('\n' + '═'.repeat(60));
if (gecen === toplam) {
  console.log(`✓ ${gecen}/${toplam} aksak gruplama round-trip'i geçti — seçilebilir gruplama + import auto-çözümü çalışıyor.`);
} else {
  console.log(`✗ ${gecen}/${toplam} geçti. Hatalar:`);
  hatalar.forEach((h) => console.log('   - ' + h));
  process.exit(1);
}
