import assert from 'node:assert/strict';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { brfTextToScore } from '../src/utils/music-brf/import/musicBrfImportEngine.js';
import { skorBarlineTipiAl } from '../src/utils/music-brf/musicVisualBarlineHelpers.js';
import { SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI } from '../src/data/muzik.js';
import { musicBrailleReverseMapsOlustur } from '../src/utils/music-brf/musicBrailleReverseMaps.js';

function cellToChar(dots = []) {
  const bit = (dots || []).reduce((acc, dot) => acc | (1 << (dot - 1)), 0);
  return String.fromCharCode(0x2800 + bit);
}

function cellsToText(cells = []) {
  return cells.map(cellToChar).join('');
}

function testTitleDecode() {
  const r = brfMuzikOku('⠍⠥⠵⠊⠅');
  assert.equal(r.header.title, 'muzik');
}

function testTimeSignature() {
  const r = brfMuzikOku('⠍⠥⠵⠊⠅\n⠼⠃⠲');
  assert.equal(r.header.timeSignature?.ad || r.header.timeSignature?.gorunum, '2/4');
}

function testAccidentalPending() {
  const r = brfMuzikOku('⠩⠓');
  const note = (r.items || []).find((i) => i.tip === 'nota');
  assert.ok(note);
  assert.equal(note.accidental, 'sharp');
}

function testOctavePending() {
  const r = brfMuzikOku('⠐⠊');
  const note = (r.items || []).find((i) => i.tip === 'nota');
  assert.ok(note);
  assert.equal(Number(note.oktav), 4);
}

function testReverseMapNoteCell() {
  const maps = musicBrailleReverseMapsOlustur();
  assert.ok(maps.noteByCellKey.size > 0);

  const first = maps.noteByCellKey.entries().next().value;
  assert.ok(first && first[0]);

  const dots = first[0].split('-').map((n) => Number(n));
  const bit = dots.reduce((acc, d) => acc | (1 << (d - 1)), 0);
  const char = String.fromCharCode(0x2800 + bit);

  const r = brfMuzikOku(char);
  assert.ok((r.items || []).some((i) => i.tip === 'nota'));
}

function testUnknownCellWarning() {
  const r = brfMuzikOku('⡿');
  assert.ok((r.warnings || []).length > 0);
}

function testSampleBrfNotEmpty() {
  const sample = [
    '⠍⠥⠵⠊⠅',
    '⠼⠃⠲',
    '⠜⠌⠇⠐⠾⠊⠩⠓⠊⠀⠀⠐⠙⠭⠵⠀⠀⠙⠐⠚⠐⠙⠀⠀⠨⠋⠭⠿⠀⠀⠨⠋⠩⠑⠋⠀⠀⠾⠀',
    '⠊⠩⠓⠊⠾⠀⠀⠊⠩⠓⠊⠹⠰⠊⠰⠙⠀⠀⠰⠚⠊⠓⠊⠀⠀⠚⠊⠓⠩⠛⠀⠀⠋⠭⠧',
  ].join('\n');

  const r = brfMuzikOku(sample);
  assert.ok((r.items || []).length > 0);
  assert.equal(r.header.title, 'muzik');
  assert.equal(r.header.timeSignature?.ad || r.header.timeSignature?.gorunum, '2/4');
}

function testNoTitleUserSample() {
  const sample = [
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⠃⠲⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
    '⠜⠌⠇⠐⠾⠊⠩⠓⠊⠀⠀⠙⠭⠵⠙⠚⠙⠀⠀⠨⠋⠭⠿⠋⠩⠑⠋⠀⠀⠾⠊⠩⠓⠊⠾⠊⠩⠓⠊⠀',
    '⠰⠹⠊⠙⠀⠀⠚⠊⠓⠊⠀⠀⠚⠊⠓⠩⠛⠀⠀⠋⠭⠧⠣⠆',
  ].join('\n');

  const r = brfMuzikOku(sample);
  assert.equal(r.header.timeSignature?.ad || r.header.timeSignature?.gorunum, '2/4');
  assert.ok((r.items || []).some((i) => i.tip === 'nota'));
  assert.ok((r.measures || []).length >= 2);
  assert.match(r.readableText, /Zaman imzası: 2\/4/);
  assert.doesNotMatch(r.readableText, /⠐⠾|⠙⠭/);
}

function testUserSampleSecondMeasureCIsFifthOctave() {
  const sample = [
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⠃⠲⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
    '⠜⠌⠇⠐⠾⠊⠩⠓⠊⠀⠀⠙⠭⠵⠙⠚⠙⠀⠀⠨⠋⠭⠿⠋⠩⠑⠋⠀⠀⠾⠊⠩⠓⠊⠾⠊⠩⠓⠊⠀',
    '⠰⠹⠊⠙⠀⠀⠚⠊⠓⠊⠀⠀⠚⠊⠓⠩⠛⠀⠀⠋⠭⠧⠣⠆',
  ].join('\n');

  const result = brfMuzikOku(sample);
  const secondMeasureFirstNote = result.measures?.[1]?.items?.find((item) => item.tip === 'nota');

  assert.equal(secondMeasureFirstNote?.notaAd, 'do');
  assert.equal(Number(secondMeasureFirstNote?.oktav), 5);

  const irResult = brfTextToScore(sample);
  const secondMeasureIrNote = (irResult.ogeler || [])
    .filter((item) => item.tip === 'nota')[4];

  assert.equal(secondMeasureIrNote?.notaAd, 'do');
  assert.equal(Number(secondMeasureIrNote?.oktav), 5);
}

function testSectionalBarlineFirstPass() {
  const sample = cellsToText([
    [5], [2, 4],
    [1, 2, 6], [1, 3], [3],
    [5], [2, 4],
  ]);

  const result = brfMuzikOku(sample);
  const tips = (result.items || []).map((item) => item.tip);

  assert.deepEqual(tips.filter((tip) => tip === 'sectionalBarline'), ['sectionalBarline']);
  assert.equal(result.measures?.[0]?.items?.at(-1)?.tip, 'sectionalBarline');
  assert.equal(result.measures?.[1]?.items?.[0]?.tip, 'nota');
  assert.match(result.readableText, /bölüm sonu çizgisi/);
}

function testRepeatBoundariesBeforeMeasureAnalysis() {
  const sample = cellsToText([
    [5], [2, 4],
    [1, 2, 6], [2, 3, 5, 6],
    [5], [2, 4],
    [1, 2, 6], [2, 3],
    [5], [2, 4],
  ]);

  const result = brfMuzikOku(sample);
  const tips = (result.items || []).map((item) => item.tip);

  assert(tips.includes('beginRepeat'));
  assert(tips.includes('endRepeat'));
  assert((result.measures || []).some((measure) => measure.items?.some((item) => item.tip === 'beginRepeat')));
  assert((result.measures || []).some((measure) => measure.items?.some((item) => item.tip === 'endRepeat')));
  assert.match(result.readableText, /başlangıç tekrarı/);
  assert.match(result.readableText, /bitiş tekrarı/);
}

function testBrfReaderTieBagCreation() {
  const sample = [
    '⠍⠥⠵⠊⠅',
    '⠼⠃⠲',
    cellsToText([
      [1, 5], // re (8th note)
      [4], // tie start
      [1, 4], // tie end
      [1, 5], // re (8th note)
    ]),
  ].join('\n');

  const result = brfMuzikOku(sample);
  assert.ok(Array.isArray(result.baglar));
  const tieBag = (result.baglar || []).find((bag) => bag.tip === 'tie');
  assert.ok(tieBag, 'Expected tie bag from reader output');
  assert.deepEqual(tieBag.notaIdler?.length, 2);
  assert.equal(tieBag.notaIdler?.[0], tieBag.basId);
  assert.equal(tieBag.notaIdler?.[1], tieBag.sonId);
  assert.equal(tieBag.kayit?.tip, 'tie');
}

function testBrfReaderSlurBagCreation() {
  const sample = [
    '⠍⠥⠵⠊⠅',
    '⠼⠃⠲',
    cellsToText([
      [1, 5], // re (8th note)
      [1, 4], // slur marker
      [1, 5], // re (8th note)
      [2, 3], // barline to close slur bag
    ]),
  ].join('\n');

  const result = brfMuzikOku(sample);
  assert.ok(Array.isArray(result.baglar));
  const slurBag = (result.baglar || []).find((bag) => bag.tip === 'slur');
  assert.ok(slurBag, 'Expected slur bag from reader output');
  assert.deepEqual(slurBag.notaIdler?.length, 2);
  assert.equal(slurBag.notaIdler?.[0], slurBag.basId);
  assert.equal(slurBag.notaIdler?.[1], slurBag.sonId);
  assert.equal(slurBag.kayit?.tip, 'slur');
}

function testBrfReaderLongSlurBagCreation() {
  const sample = [
    '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠼⠙⠲⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
    '⠜⠌⠇⠐⠱⠉⠱⠱⠱⠀⠀⠱⠱⠱⠉⠱⠀⠀⠱⠱⠥⠣⠅',
  ].join('\n');

  const result = brfMuzikOku(sample);
  assert.ok(Array.isArray(result.baglar));
  const slurs = (result.baglar || []).filter((bag) => bag.tip === 'slur');
  assert.equal(slurs.length, 1, 'Expected exactly one long slur bag');
  const slurBag = slurs[0];
  assert.ok(Array.isArray(slurBag.notaIdler));
  assert.ok(slurBag.notaIdler.length > 2, 'Expected long slur to include multiple notes');
  assert.equal(slurBag.mode, 'long-single');
  assert.equal(slurBag.notaIdler[0], slurBag.basId);
  assert.equal(slurBag.notaIdler[slurBag.notaIdler.length - 1], slurBag.sonId);
  assert.equal(slurBag.kayit?.tip, 'slur');
}

function testIrImportSpecialBarlinesFirstPass() {
  const sample = cellsToText([
    [5], [2, 4],
    [1, 2, 6], [1, 3], [3],
    [5], [2, 4],
  ]);

  const result = brfTextToScore(sample);
  const tips = (result.ogeler || []).map((item) => item.tip);
  const sectionalIndex = tips.indexOf('sectionalBarline');

  assert(sectionalIndex > 0);
  assert.equal(tips.filter((tip) => tip === 'nota').length, 2);
  assert.equal(tips[sectionalIndex - 1], 'nota');
  assert.equal(tips[sectionalIndex + 1], 'nota');
}

function testBrfImportEndRepeatScoreConversion() {
  const sample = cellsToText([
    [5], [2, 4],
    [1, 2, 6], [2, 3, 5, 6],
    [5], [2, 4],
    [1, 2, 6], [2, 3],
  ]);

  const result = brfTextToScore(sample);
  const endRepeat = (result.ogeler || []).find((item) => item.tip === 'endRepeat');

  assert.ok(endRepeat, 'endRepeat should be present in imported score ogeler');
  assert.equal(endRepeat.gorunum, '𝄇');
}

function testSkorBarlineHelperRecognizesEndRepeatByAd() {
  assert.equal(skorBarlineTipiAl({ tip: 'endRepeat', ad: 'Tekrar sonu', gorunum: '𝄇' }), 'endRepeat');
  assert.equal(skorBarlineTipiAl({ tip: 'barline', ad: 'tekrar bitiş', gorunum: '|' }), 'endRepeat');
  assert.equal(skorBarlineTipiAl({ tip: 'barline', ad: 'bitiş tekrarı', gorunum: '|' }), 'endRepeat');
  assert.equal(skorBarlineTipiAl({ tip: 'endRepeat', ad: 'Bitiş tekrarı', gorunum: '|' }), 'endRepeat');
}

const tests = [
  ['title decode', testTitleDecode],
  ['time signature', testTimeSignature],
  ['accidental pending', testAccidentalPending],
  ['octave pending', testOctavePending],
  ['reverse note map', testReverseMapNoteCell],
  ['unknown warning', testUnknownCellWarning],
  ['sample brf non-empty', testSampleBrfNotEmpty],
  ['no-title user sample', testNoTitleUserSample],
  ['user sample second measure C is fifth octave', testUserSampleSecondMeasureCIsFifthOctave],
  ['sectional barline first pass', testSectionalBarlineFirstPass],
  ['repeat boundaries before measure analysis', testRepeatBoundariesBeforeMeasureAnalysis],
  ['BRF reader tie bag creation', testBrfReaderTieBagCreation],
  ['BRF reader slur bag creation', testBrfReaderSlurBagCreation],
  ['BRF reader long slur bag creation', testBrfReaderLongSlurBagCreation],
  ['IR import special barlines first pass', testIrImportSpecialBarlinesFirstPass],
];

let passed = 0;
for (const [name, fn] of tests) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

console.log(`music-brf-reader-qa: ${passed}/${tests.length} passed`);
