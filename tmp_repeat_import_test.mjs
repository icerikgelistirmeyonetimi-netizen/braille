import { brfMuzikOku } from './src/utils/music-brf/brfMusicReader.js';

function cellToChar(dots = []) {
  const bit = (dots || []).reduce((acc, dot) => acc | (1 << (dot - 1)), 0);
  return String.fromCharCode(0x2800 + bit);
}
function cellsToText(cells = []) {
  return cells.map(cellToChar).join('');
}
function brfReaderBarlineOgesiOlustur(item, index) {
  const tip = item?.tip || 'barline';
  const barlineMap = {
    barline: { tip: 'barline', ad: 'BRF ölçü çizgisi', gorunum: '|', hucreler: [[]] },
    finalBarline: { tip: 'finalBarline', ad: 'Bitiş çizgisi', gorunum: '𝄂', hucreler: [[1, 2, 6], [1, 3]] },
    sectionalBarline: { tip: 'sectionalBarline', ad: 'Bölüm sonu çizgisi', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3], [3]] },
    endRepeat: { tip: 'endRepeat', ad: 'Bitiş tekrarı', gorunum: '𝄇', hucreler: [[1, 2, 6], [2, 3]] },
    beginRepeat: { tip: 'beginRepeat', ad: 'Başlangıç tekrarı', gorunum: '𝄆', hucreler: [[1, 2, 6], [2, 3, 5, 6]] },
  };
  const base = barlineMap[tip] || barlineMap.barline;
  return { ...base, id: item?.id || `brf-reader-barline-${index}`, kind: 'manual', auto: false, autoBarline: false, otomatikOlcuCizgisi: false, importKaynak: 'brf-reader' };
}
function brfReaderIteminiSkorOgesineCevir(item, index) {
  if (item?.tip === 'nota') return { id: item.id || `note-${index}`, tip: 'nota', notaAd: item.notaAd, sureIndeksi: item.sureIndeksi || 0, gorunum: item.gorunum || item.ad, importKaynak: 'brf-reader' };
  if (item?.tip === 'sus') return { id: item.id || `sus-${index}`, tip: 'sus', sureIndeksi: item.sureIndeksi || 0, gorunum: item.gorunum || item.ad, importKaynak: 'brf-reader' };
  if (['barline', 'finalBarline', 'sectionalBarline', 'endRepeat', 'beginRepeat'].includes(item?.tip)) return brfReaderBarlineOgesiOlustur(item, index);
  return null;
}
function brfReaderSonucundanSkorOgeleriAl(readerResult) {
  const measures = Array.isArray(readerResult?.measures) ? readerResult.measures : [];
  const ogeler = [];
  measures.forEach((measure, measureIndex) => {
    const measureItems = Array.isArray(measure?.items) ? measure.items : [];
    measureItems.forEach((item) => { const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length); if (oge) ogeler.push(oge); });
    if (measureIndex < measures.length - 1) {
      const son = ogeler[ogeler.length - 1];
      if (!['barline','finalBarline','sectionalBarline','beginRepeat','endRepeat'].includes(son?.tip)) ogeler.push(brfReaderBarlineOgesiOlustur({ tip:'barline' }, ogeler.length));
    }
  });
  if (ogeler.length === 0) {
    (readerResult?.items || []).forEach((item) => { const oge = brfReaderIteminiSkorOgesineCevir(item, ogeler.length); if (oge) ogeler.push(oge); });
  }
  return ogeler;
}

const sample = [
  [5], [2, 4],
  [1, 2, 6], [2, 3, 5, 6],
  [5], [2, 4],
  [1, 2, 6], [2, 3],
];
const text = cellsToText(sample);
const result = brfMuzikOku(text);
console.log('text:', JSON.stringify(text));
console.log('measures', result.measures.length);
console.log('items', result.items.map((i) => i.tip + ':' + (i.gorunum || i.ad || '')).join(' | '));
console.log('warnings', result.warnings);
const ogeler = brfReaderSonucundanSkorOgeleriAl(result);
console.log('converted ogeler', ogeler.map((i) => i.tip + ':' + (i.gorunum || i.ad || '')).join(' | '));
console.log('barlines', ogeler.filter((o) => ['barline','finalBarline','sectionalBarline','beginRepeat','endRepeat'].includes(o.tip)).map((o) => o.tip + ':' + (o.gorunum || o.ad || '')).join(' | '));
