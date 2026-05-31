import { scoreToCanonicalBrf } from './src/utils/music-brf/musicCanonicalPipeline.js';
import { brfMuzikOku } from './src/utils/music-brf/brfMusicReader.js';
import { muzikNotaSkorOgesi, muzikSusSkorOgesi } from './src/utils/music/musicScoreFactory.js';
import { varsayilanMuzikHeaderOlustur } from './src/utils/music-brf/musicHeaderHelpers.js';
import { muzikBeginRepeatMi, muzikEndRepeatMi } from './src/utils/music/musicDuration.js';

function brfReaderBarlineOgesiOlustur(item, index) {
  const tip = item?.tip || 'barline';
  const barlineMap = {
    barline: {
      tip: 'barline',
      ad: 'BRF ölçü çizgisi',
      gorunum: '|',
      hucreler: [[]],
    },
    finalBarline: {
      tip: 'finalBarline',
      ad: 'Bitiş çizgisi',
      gorunum: '𝄂',
      hucreler: [[1, 2, 6], [1, 3]],
    },
    sectionalBarline: {
      tip: 'sectionalBarline',
      ad: 'Bölüm sonu çizgisi',
      gorunum: '𝄁',
      hucreler: [[1, 2, 6], [1, 3], [3]],
    },
    endRepeat: {
      tip: 'endRepeat',
      ad: 'Bitiş tekrarı',
      gorunum: '𝄇',
      hucreler: [[1, 2, 6], [2, 3]],
    },
    beginRepeat: {
      tip: 'beginRepeat',
      ad: 'Başlangıç tekrarı',
      gorunum: '𝄆',
      hucreler: [[1, 2, 6], [2, 3, 5, 6]],
    },
  };
  const base = barlineMap[tip] || barlineMap.barline;
  return {
    ...base,
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
      readerSureIndeksi: item.sureIndeksi,
      readerSureAd: item.sureAd,
      readerRealValue: item.realValue,
    };
  }
  if (item?.tip === 'sus') {
    return {
      ...muzikSusSkorOgesi(item.id || `brf-reader-rest-${index}`, item.sureIndeksi || 0, {
        dotted: Boolean(item.dotted),
      }),
      importKaynak: 'brf-reader',
      kaynakReaderItem: item,
      readerSureIndeksi: item.sureIndeksi,
      readerSureAd: item.sureAd,
      readerRealValue: item.realValue,
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
      if (!['barline', 'finalBarline', 'sectionalBarline', 'beginRepeat', 'endRepeat'].includes(son?.tip)) {
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

function summarize(items) {
  return items.map((o) => `${o.tip}:${o.gorunum || o.ad || ''}`).join(' | ');
}

function printScenario(name, canonicalText, readerResult, canonicalReaderItems) {
  console.log(`\n=== ${name} ===`);
  console.log('canonicalText:', JSON.stringify(canonicalText));
  console.log('reader items count:', Array.isArray(readerResult.items) ? readerResult.items.length : 0);
  console.log('reader items:', Array.isArray(readerResult.items) ? readerResult.items.map((i) => i.tip + ':' + (i.gorunum || i.ad || '')).join(' | ') : '');
  console.log('reader warnings:', JSON.stringify(readerResult.warnings || []));
  console.log('canonicalReaderOgeler count:', canonicalReaderItems.length);
  console.log('canonicalReaderOgeler:', canonicalReaderItems.map((o) => o.tip + ':' + (o.gorunum || o.ad || '')).join(' | '));
  const barlines = canonicalReaderItems.filter((o) => ['barline','finalBarline','sectionalBarline','beginRepeat','endRepeat'].includes(o.tip));
  console.log('canonicalReader barlines:', barlines.map((b) => b.tip + ':' + (b.gorunum || b.ad || '')).join(' | '));
  console.log('measure count from readerResult:', readerResult.measures.length);
  console.log('normal barline count:', canonicalReaderItems.filter((o) => o.tip === 'barline').length);
  const beginAtStart = canonicalReaderItems[0]?.tip === 'beginRepeat';
  console.log('beginRepeat at start:', beginAtStart);
  const endAtEnd = canonicalReaderItems[canonicalReaderItems.length-1]?.tip === 'endRepeat';
  console.log('endRepeat at end:', endAtEnd);
}

const defaultHeader = varsayilanMuzikHeaderOlustur();
const br1 = { id: 'begin-1', tip: 'beginRepeat', ad: 'Başlangıç tekrar', gorunum: '𝄆', hucreler: [[]] };
const br2 = { id: 'end-1', tip: 'endRepeat', ad: 'Bitiş tekrarı', gorunum: '𝄇', hucreler: [[]] };
const bar = { id: 'bar-1', tip: 'barline', ad: 'Ölçü çizgisi', gorunum: '|', hucreler: [[]], auto: false, autoBarline: false, otomatikOlcuCizgisi: false };
const noteDo = muzikNotaSkorOgesi('do', 'do', 2);
const noteRe = muzikNotaSkorOgesi('re', 're', 2);
const noteMi = muzikNotaSkorOgesi('mi', 'mi', 2);
const noteFa = muzikNotaSkorOgesi('fa', 'fa', 2);

const scenarios = [
  {
    name: 'No repeat baseline',
    ogeler: [noteDo, noteRe, noteMi],
    expected: 'baseline',
  },
  {
    name: 'Begin repeat başta',
    ogeler: [br1, noteDo, noteRe, noteMi],
    expected: 'beginRepeat-start',
  },
  {
    name: 'End repeat sonda',
    ogeler: [noteDo, noteRe, noteMi, br2],
    expected: 'endRepeat-end',
  },
  {
    name: 'Begin+End repeat',
    ogeler: [br1, noteDo, noteRe, noteMi, br2],
    expected: 'beginEnd',
  },
  {
    name: 'İki ölçülü repeat',
    ogeler: [br1, noteDo, noteRe, bar, noteMi, noteFa, br2],
    expected: 'twoMeasure',
  },
];

for (const scenario of scenarios) {
  const canonical = scoreToCanonicalBrf({ ogeler: scenario.ogeler, baglar: [], header: defaultHeader, tupletler: [], options: {} });
  const readerResult = brfMuzikOku(canonical.brfText, { source: 'editor-canonical-brf' });
  const canonicalReaderItems = brfReaderSonucundanSkorOgeleriAl(readerResult);
  printScenario(scenario.name, canonical.brfText, readerResult, canonicalReaderItems);

  const importReaderResult = brfMuzikOku(canonical.brfText, { source: 'import' });
  const importItems = brfReaderSonucundanSkorOgeleriAl(importReaderResult);
  console.log('import measure count:', importReaderResult.measures.length);
  console.log('import normal barline count:', importItems.filter((o) => o.tip === 'barline').length);

  const roundTripCanonical = scoreToCanonicalBrf({ ogeler: importItems, baglar: [], header: defaultHeader, tupletler: [], options: {} });
  console.log('roundtrip text same:', canonical.brfText === roundTripCanonical.brfText);
  console.log('roundtrip text:', roundTripCanonical.brfText.replace(/\n/g, '\\n'));
}
