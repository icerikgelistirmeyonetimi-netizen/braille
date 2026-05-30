import { scoreToCanonicalBrf } from './src/utils/music-brf/musicCanonicalPipeline.js';
import { brfMuzikOku } from './src/utils/music-brf/brfMusicReader.js';
import { muzikNotaSkorOgesi } from './src/utils/music/musicScoreFactory.js';
import { varsayilanMuzikHeaderOlustur } from './src/utils/music-brf/musicHeaderHelpers.js';

function brfReaderBarlineOgesiOlustur(item, index) {
  const tip = item?.tip || 'barline';
  const barlineMap = {
    barline: { tip: 'barline', ad: 'BRF ölçü çizgisi', gorunum: '|', hucreler: [[]] },
    finalBarline: { tip: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [[1, 2, 6], [1, 3]] },
    sectionalBarline: { tip: 'sectionalBarline', ad: 'Bölüm sonu çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3], [3]] },
    endRepeat: { tip: 'endRepeat', ad: 'Bitiş tekrarı', gorunum: '𝄇', hucreler: [[1, 2, 6], [2, 3]] },
    beginRepeat: { tip: 'beginRepeat', ad: 'Başlangıç tekrarı', gorunum: '𝄆', hucreler: [[1, 2, 6], [2, 3, 5, 6]] },
  };
  const config = barlineMap[tip] || barlineMap.barline;
  return {
    ...config,
    id: item?.id || `brf-reader-barline-${index}`,
    kind: 'manual',
    auto: false,
    autoBarline: false,
    otomatikOlcuCizgisi: false,
    importKaynak: 'brf-reader',
  };
}

function brfReaderIteminiSkorOgesineCevir(item, index) {
  if (item?.tip === 'nota') {
    return {
      ...muzikNotaSkorOgesi(item.id || `brf-reader-note-${index}`, item.notaAd, item.sureIndeksi || 0, {
        oktav: item.oktav,
        accidental: item.accidental || null,
        dotted: Boolean(item.dotted),
      }),
      importKaynak: 'brf-reader',
      kaynakReaderItem: item,
    };
  }
  if (item?.tip === 'sus') {
    return {
      id: item.id || `brf-reader-rest-${index}`,
      tip: 'sus',
      gorunum: item.gorunum || item.ad || 'sus',
      sureIndeksi: item.sureIndeksi || 0,
      importKaynak: 'brf-reader',
      kaynakReaderItem: item,
    };
  }
  if (['barline', 'finalBarline', 'sectionalBarline', 'endRepeat', 'beginRepeat'].includes(item?.tip)) {
    return brfReaderBarlineOgesiOlustur(item, index);
  }
  return null;
}

function brfReaderSonucundanSkorOgeleriAl(readerResult) {
  const measures = Array.isArray(readerResult?.measures) ? readerResult.measures : [];
  const ogeler = [];

  measures.forEach((measure, measureIndex) => {
    const measureItems = Array.isArray(measure?.items) ? measure.items : [];
    measureItems.forEach((item) => {
      const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length);
      if (oge) ogeler.push(oge);
    });

    if (measureIndex < measures.length - 1) {
      const son = ogeler[ogeler.length - 1];
      const nextFirst = Array.isArray(measures[measureIndex + 1]?.items) ? measures[measureIndex + 1].items[0] : null;
      const nextBeginsWithBeginRepeat = nextFirst?.tip === 'beginRepeat';
      if (
        !['barline', 'finalBarline', 'sectionalBarline', 'beginRepeat', 'endRepeat'].includes(son?.tip)
        && !nextBeginsWithBeginRepeat
      ) {
        ogeler.push(brfReaderBarlineOgesiOlustur({ tip: 'barline' }, ogeler.length));
      }
    }
  });

  if (ogeler.length === 0) {
    (readerResult?.items || []).forEach((item) => {
      const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length);
      if (oge) ogeler.push(oge);
    });
  }

  return ogeler;
}

function countTypes(items, type) {
  return items.filter((o) => o.tip === type).length;
}

function summary(items) {
  return items.map((o) => `${o.tip}:${o.gorunum || o.ad || o.type || ''}`).join(' | ');
}

function runScenario(name, ogeler) {
  const header = varsayilanMuzikHeaderOlustur();
  const canonical = scoreToCanonicalBrf({ ogeler, baglar: [], header, tupletler: [], options: {} });
  const canonicalText = canonical.brfText;
  const readerResult = brfMuzikOku(canonicalText, { source: 'editor-canonical-brf' });
  const canonicalReaderOgeler = brfReaderSonucundanSkorOgeleriAl(readerResult);
  const measureCount = Array.isArray(readerResult.measures) ? readerResult.measures.length : 0;
  const emptyMeasures = Array.isArray(readerResult.measures)
    ? readerResult.measures.filter((m) => !Array.isArray(m.items) || m.items.length === 0).length
    : 0;
  const firstTip = canonicalReaderOgeler[0]?.tip || null;
  const lastTip = canonicalReaderOgeler[canonicalReaderOgeler.length - 1]?.tip || null;

  const roundTrip = scoreToCanonicalBrf({ ogeler: canonicalReaderOgeler, baglar: [], header, tupletler: [], options: {} });

  return {
    name,
    canonicalText,
    measureCount,
    emptyMeasures,
    beginRepeatCount: countTypes(canonicalReaderOgeler, 'beginRepeat'),
    endRepeatCount: countTypes(canonicalReaderOgeler, 'endRepeat'),
    normalBarlineCount: countTypes(canonicalReaderOgeler, 'barline'),
    firstTip,
    lastTip,
    roundTripSame: canonicalText === roundTrip.brfText,
    roundTripText: roundTrip.brfText,
    summary: summary(canonicalReaderOgeler),
  };
}

const br1 = { id: 'br1', tip: 'beginRepeat', ad: 'Başlangıç tekrar', gorunum: '𝄆', hucreler: [[]] };
const br2 = { id: 'br2', tip: 'endRepeat', ad: 'Bitiş tekrarı', gorunum: '𝄇', hucreler: [[]] };
const bar = { id: 'bar1', tip: 'barline', ad: 'Ölçü çizgisi', gorunum: '|', hucreler: [[]], auto: false, autoBarline: false, otomatikOlcuCizgisi: false };
const noteDo = muzikNotaSkorOgesi('do', 'do', 2);
const noteRe = muzikNotaSkorOgesi('re', 're', 2);
const noteMi = muzikNotaSkorOgesi('mi', 'mi', 2);
const noteFa = muzikNotaSkorOgesi('fa', 'fa', 2);

const scenarios = [
  { name: 'beginRepeat + notas', ogeler: [br1, noteDo, noteRe, noteMi] },
  { name: 'notas + endRepeat', ogeler: [noteDo, noteRe, noteMi, br2] },
  { name: 'beginRepeat + notas + endRepeat', ogeler: [br1, noteDo, noteRe, noteMi, br2] },
  { name: 'beginRepeat + measure1 + barline + measure2 + endRepeat', ogeler: [br1, noteDo, noteRe, bar, noteMi, noteFa, br2] },
];

const results = scenarios.map((sc) => runScenario(sc.name, sc.ogeler));
console.log(JSON.stringify(results, null, 2));
