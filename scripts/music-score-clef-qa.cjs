const fs = require('fs');
const path = require('path');
const vm = require('vm');

const {
  MUZIK_CLEF_VISUAL_Y_OFFSETS,
  MUZIK_CLEF_MIDDLE_C_Y,
} = require('../src/utils/music-brf/musicConstants.js');

const helperPath = path.resolve(__dirname, '../src/utils/music-brf/musicScoreMathHelpers.js');
const helperText = fs.readFileSync(helperPath, 'utf8');

const stripped = helperText
  .replace(/^import[\s\S]*?;$/gm, '')
  .replace(/export const /g, 'var ')
  .replace(/export function /g, 'function ')
  .replace(/const STAFF_TOP_Y[\s\S]*$/, '');

const context = {
  console,
  Number,
  Math,
  module: {},
  exports: {},
  require,
  process,
  global: {},
  MUZIK_PITCH_Y: {},
  muzikHucreAnlamiKayittan: () => null,
  MUZIK_CLEF_VISUAL_Y_OFFSETS,
  MUZIK_CLEF_MIDDLE_C_Y,
};
vm.createContext(context);
vm.runInContext(stripped, context, { filename: helperPath });

const { notaYHesapla, varsayilanOktavAnahtaraGoreAl } = context;

const CLEFS = [
  { ad: 'Sol anahtarı', expectedDefaultOctave: 4 },
  { ad: 'Fa anahtarı', expectedDefaultOctave: 3 },
  { ad: 'Do anahtarı', expectedDefaultOctave: 4 },
];

const NOTES = [
  { notaAd: 'do', oktav: 3 },
  { notaAd: 'mi', oktav: 3 },
  { notaAd: 'sol', oktav: 3 },
  { notaAd: 'do', oktav: 4 },
  { notaAd: 'mi', oktav: 4 },
  { notaAd: 'sol', oktav: 4 },
];

function noteItem(notaAd, oktav) {
  return {
    id: `${notaAd}${oktav}`,
    tip: 'nota',
    notaAd,
    oktav,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

console.log('Music score clef QA');
console.log('===================\n');
console.log('Offsets:');
Object.entries(MUZIK_CLEF_VISUAL_Y_OFFSETS).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});
console.log('');

CLEFS.forEach((clef) => {
  const actualDefault = varsayilanOktavAnahtaraGoreAl({ ad: clef.ad });
  console.log(`${clef.ad} default octave: ${actualDefault}`);
  assert(actualDefault === clef.expectedDefaultOctave,
    `${clef.ad} expected default octave ${clef.expectedDefaultOctave}, got ${actualDefault}`);
});

console.log('\nY positions:');
CLEFS.forEach((clef) => {
  console.log(`\n${clef.ad}`);
  NOTES.forEach((note) => {
    const noteObj = noteItem(note.notaAd, note.oktav);
    const y = notaYHesapla(noteObj, { ad: clef.ad });
    console.log(`- ${note.notaAd}${note.oktav}: y=${y}`);
    assert(Number.isFinite(y), `Y is not finite for ${note.notaAd}${note.oktav} on ${clef.ad}`);
  });
});

const sampleNote = noteItem('do', 4);
const trebleY = notaYHesapla(sampleNote, { ad: 'Sol anahtarı' });
const bassY = notaYHesapla(sampleNote, { ad: 'Fa anahtarı' });
const altoY = notaYHesapla(sampleNote, { ad: 'Do anahtarı' });

console.log('\nSample do4 Y values:');
console.log(`sol/treble: ${trebleY}`);
console.log(`fa/bass: ${bassY}`);
console.log(`do/alto: ${altoY}`);

assert(trebleY === 124, `Expected do4 y=124 in sol/treble, got ${trebleY}`);
assert(bassY === 76, `Expected do4 y=76 in fa/bass, got ${bassY}`);
assert(altoY === 88, `Expected do4 y=88 in do/alto, got ${altoY}`);

const octaveYs = [
  { note: 'do1', y: notaYHesapla(noteItem('do', 1), { ad: 'Sol anahtarı' }) },
  { note: 'do2', y: notaYHesapla(noteItem('do', 2), { ad: 'Sol anahtarı' }) },
  { note: 'do3', y: notaYHesapla(noteItem('do', 3), { ad: 'Sol anahtarı' }) },
  { note: 'do4', y: notaYHesapla(noteItem('do', 4), { ad: 'Sol anahtarı' }) },
  { note: 'do7', y: notaYHesapla(noteItem('do', 7), { ad: 'Sol anahtarı' }) },
];

console.log('\nSol anahtarında do1-do2-do3-do4-do7 Y sıralaması:');
octaveYs.forEach(({ note, y }) => console.log(`- ${note}: y=${y}`));
assert(
  octaveYs[0].y > octaveYs[1].y
  && octaveYs[1].y > octaveYs[2].y
  && octaveYs[2].y > octaveYs[3].y
  && octaveYs[3].y > octaveYs[4].y,
  `Expected do1 > do2 > do3 > do4 > do7, got ${octaveYs.map((o) => `${o.note}:${o.y}`).join(', ')}`,
);

const bassNotes = [
  { notaAd: 'do', oktav: 3, expectedY: 118 },
  { notaAd: 're', oktav: 3, expectedY: 112 },
  { notaAd: 'mi', oktav: 3, expectedY: 106 },
  { notaAd: 'fa', oktav: 3, expectedY: 100 },
  { notaAd: 'sol', oktav: 3, expectedY: 94 },
  { notaAd: 'la', oktav: 3, expectedY: 88 },
  { notaAd: 'si', oktav: 3, expectedY: 82 },
  { notaAd: 'do', oktav: 4, expectedY: 76 },
];

console.log('\nFa anahtarı için bass note y değerleri:');
for (const { notaAd, oktav, expectedY } of bassNotes) {
  const y = notaYHesapla(noteItem(notaAd, oktav), { ad: 'Fa anahtarı' });
  console.log(`- ${notaAd}${oktav}: y=${y}`);
  assert(y === expectedY, `Expected ${notaAd}${oktav} y=${expectedY} in Fa anahtarı, got ${y}`);
}

console.log('\nClef QA passed.');
