import { strict as assert } from 'node:assert';
import { gorselBeamGruplariOlustur } from '../src/utils/music-brf/musicVisualBeamHelpers.js';
import { SURE_GOSTERGELERI } from '../src/data/muzik.js';

function sureIndexByRealValue(realValue) {
  const idx = SURE_GOSTERGELERI.findIndex((s) => s.realValue === realValue);
  if (idx < 0) throw new Error(`missing duration ${realValue}`);
  return idx;
}

function note(realValue, id) {
  return {
    id,
    tip: 'nota',
    sureIndeksi: sureIndexByRealValue(realValue),
  };
}

function rest(realValue, id) {
  return {
    id,
    tip: 'sus',
    realValue,
  };
}

function assertGroupLengths(label, timeSignature, items, expected) {
  const groups = gorselBeamGruplariOlustur({
    ogeler: items,
    timeSignature: { ad: timeSignature },
  });

  const actual = groups.map((g) => g.length);
  assert.deepEqual(actual, expected, `${label}: expected ${expected.join(',')} got ${actual.join(',')}`);
}

console.log('Running music visual beam QA...');

assertGroupLengths('2/4 eight eighths', '2/4', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
], [2, 2]);

assertGroupLengths('3/4 six eighths', '3/4', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
  note(8, 'n6'),
], [2, 2, 2]);

assertGroupLengths('4/4 eight eighths', '4/4', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
  note(8, 'n6'),
  note(8, 'n7'),
  note(8, 'n8'),
], [2, 2, 2, 2]);

assertGroupLengths('6/8 six eighths', '6/8', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
  note(8, 'n6'),
], [3, 3]);

assertGroupLengths('9/8 nine eighths', '9/8', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
  note(8, 'n6'),
  note(8, 'n7'),
  note(8, 'n8'),
  note(8, 'n9'),
], [3, 3, 3]);

assertGroupLengths('12/8 twelve eighths', '12/8', [
  ...Array.from({ length: 12 }, (_, i) => note(8, `n${i + 1}`)),
], [3, 3, 3, 3]);

assertGroupLengths('5/8 five eighths', '5/8', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
], [2, 3]);

assertGroupLengths('7/8 seven eighths', '7/8', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
  note(8, 'n6'),
  note(8, 'n7'),
], [2, 2, 3]);

assertGroupLengths('8/8 eight eighths', '8/8', [
  note(8, 'n1'),
  note(8, 'n2'),
  note(8, 'n3'),
  note(8, 'n4'),
  note(8, 'n5'),
  note(8, 'n6'),
  note(8, 'n7'),
  note(8, 'n8'),
], [3, 3, 2]);

assertGroupLengths('2/4 four sixteenths', '2/4', [
  ...Array.from({ length: 4 }, (_, i) => note(16, `n${i + 1}`)),
], [4]);

assertGroupLengths('2/4 eight sixteenths', '2/4', [
  ...Array.from({ length: 8 }, (_, i) => note(16, `n${i + 1}`)),
], [4, 4]);

assertGroupLengths('rest breaks beam', '2/4', [
  note(8, 'n1'),
  note(8, 'n2'),
  rest(8, 'r1'),
  note(8, 'n3'),
  note(8, 'n4'),
], [2, 2]);

assertGroupLengths('barline breaks beam', '2/4', [
  note(8, 'n1'),
  note(8, 'n2'),
  { id: 'b1', tip: 'barline' },
  note(8, 'n3'),
  note(8, 'n4'),
], [2, 2]);

console.log('PASS music-score-beam QA');
