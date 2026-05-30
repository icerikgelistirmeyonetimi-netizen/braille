import {
  notaYHesapla,
  varsayilanOktavAnahtaraGoreAl,
} from '../src/utils/music-brf/musicScoreHelpers.jsx';
import {
  MUZIK_CLEF_VISUAL_Y_OFFSETS,
} from '../src/utils/music-brf/musicConstants.js';

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

assert(trebleY !== bassY, 'do4 should have different Y in sol vs fa clef');
assert(trebleY !== altoY, 'do4 should have different Y in sol vs do clef');
assert(bassY !== altoY, 'do4 should have different Y in fa vs do clef');

console.log('\nClef QA passed.');
