const fs = require('fs');
const path = require('path');
const vm = require('vm');

const helperPath = path.resolve(__dirname, '../src/utils/music-brf/musicVisualBarlineHelpers.js');
const helperText = fs.readFileSync(helperPath, 'utf8');

const stripped = helperText
  .replace(/^import[\s\S]*?;$/gm, '')
  .replace(/export const /g, 'const ')
  .replace(/export function /g, 'function ');

const context = {
  console,
  Number,
  Math,
  module: {},
  exports: {},
  require,
  process,
  global: {},
};
vm.createContext(context);
vm.runInContext(stripped, context, { filename: helperPath });

const {
  skorBarlineTipiAl,
  skorBarlineParcalariAl,
  skorBarlineXAl,
  SCORE_STAFF_TOP_Y,
  SCORE_STAFF_BOTTOM_Y,
} = context;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function test(description, callback) {
  process.stdout.write(`${description}... `);
  callback();
  console.log('OK');
}

console.log('Music score barline QA');
console.log('========================\n');

test('final type detection for finalBarline tip', () => {
  assert(skorBarlineTipiAl({ tip: 'finalBarline' }) === 'final');
});

test('final type detection for ad containing bitiş', () => {
  assert(skorBarlineTipiAl({ ad: 'Bitiş çizgisi' }) === 'final');
});

test('final type detection for gorunum 𝄂', () => {
  assert(skorBarlineTipiAl({ gorunum: '𝄂' }) === 'final');
});

test('normal type detection for generic barline', () => {
  assert(skorBarlineTipiAl({ tip: 'barline' }) === 'normal');
});

const finalParts = skorBarlineParcalariAl({ x: 100, type: 'final' });
test('final parts count', () => {
  assert(finalParts.length === 2, `Expected 2 parts, got ${finalParts.length}`);
});

test('final parts include final-thin and final-thick', () => {
  assert(finalParts.some((part) => part.role === 'final-thin'));
  assert(finalParts.some((part) => part.role === 'final-thick'));
});

test('final thick width is larger than thin width', () => {
  const thin = finalParts.find((part) => part.role === 'final-thin');
  const thick = finalParts.find((part) => part.role === 'final-thick');
  assert(thin.width < thick.width, `thin ${thin.width} !< thick ${thick.width}`);
});

const normalParts = skorBarlineParcalariAl({ x: 100, type: 'normal' });
test('normal parts count', () => {
  assert(normalParts.length === 1);
  assert(normalParts[0].role === 'normal');
});

const sectionalParts = skorBarlineParcalariAl({ x: 100, type: 'sectional' });
test('sectional parts count', () => {
  assert(sectionalParts.length === 2);
  assert(sectionalParts.every((part) => part.width === 1.2));
});

const beginParts = skorBarlineParcalariAl({ x: 100, type: 'beginRepeat' });
test('beginRepeat parts count', () => {
  assert(beginParts.length === 4);
});

test('beginRepeat contains thick and dots', () => {
  assert(beginParts.some((part) => part.role === 'begin-repeat-thick'));
  assert(beginParts.some((part) => part.kind === 'dot'));
});

const endParts = skorBarlineParcalariAl({ x: 100, type: 'endRepeat' });
test('endRepeat parts count', () => {
  assert(endParts.length === 4);
});

test('endRepeat contains end-repeat-thick and dots', () => {
  assert(endParts.some((part) => part.role === 'end-repeat-thick'));
  assert(endParts.some((part) => part.kind === 'dot'));
});

test('row end x alignment for final barline', () => {
  const finalX = skorBarlineXAl({
    normalX: 200,
    rowRightX: 776,
    barlineType: 'final',
    isRowEnd: true,
  });
  assert(finalX === 776, `Expected 776, got ${finalX}`);
});

test('non-row-end final returns normal x', () => {
  const finalX = skorBarlineXAl({
    normalX: 200,
    rowRightX: 776,
    barlineType: 'final',
    isRowEnd: false,
  });
  assert(finalX === 200);
});

console.log('\nAll barline QA tests passed.');
