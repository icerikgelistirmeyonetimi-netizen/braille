import { strict as assert } from 'assert';
import { MUSIC_BRAILLE_SYMBOLS } from '../src/utils/music-brf/import/musicBrailleSymbolRegistry.js';
import { tokenizeBrfCells } from '../src/utils/music-brf/import/musicBrfTokenizer.js';
import { muzikKeySignatureHucreleri, muzikSusSkorOgesi, muzikNotaSkorOgesi, muzikTimeSignatureHucreleri } from '../src/utils/music/index.js';
import { muzikSkorunuBrailleyeCevir } from '../src/utils/music/musicBrfEngine.js';
import { BRAILLE_CATEGORY_COLORS } from '../src/utils/music-brf/brailleColors.js';
import {
  normalizeBrailleMeaning,
  brailleKategoriAl,
  brailleRenkAl,
} from '../src/utils/music-brf/brailleMeasureHelpers.js';
import { SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI } from '../src/data/muzik.js';

function cellKey(cell) {
  return [...(cell || [])].sort((a, b) => a - b).join('');
}

function cellsKey(cells) {
  return (cells || []).map(cellKey).join('|');
}

function expectCellsEqual(actual, expected, message) {
  assert.deepEqual(actual, expected, message);
}

function findSymbolById(id) {
  return MUSIC_BRAILLE_SYMBOLS.find((s) => s.id === id);
}

function findToken(tokens, type) {
  return tokens.find((t) => t.type === type || t.token?.type === type);
}

function assertNoColorCollision(categories) {
  for (let i = 0; i < categories.length; i += 1) {
    for (let j = i + 1; j < categories.length; j += 1) {
      const a = categories[i];
      const b = categories[j];
      assert.notEqual(
        BRAILLE_CATEGORY_COLORS[a]?.fill,
        BRAILLE_CATEGORY_COLORS[b]?.fill,
        `Color collision: ${a} and ${b}`,
      );
    }
  }
}

function octavesMetaForScore(score) {
  return (score.hucreMeta || []).filter((meta) => meta?.kaynak === 'octave');
}

function assertOctaveBeforeNote(score, noteId) {
  const octaveMeta = octavesMetaForScore(score).find((meta) => meta.ogeId === noteId);
  assert(octaveMeta, `Expected octave meta for note ${noteId}`);
}

function assertNoOctaveForOge(score, ogeId) {
  const octaveMeta = octavesMetaForScore(score).find((meta) => meta.ogeId === ogeId);
  assert(!octaveMeta, `Expected no octave meta for object ${ogeId}`);
}

function run() {
  console.log('Running Braille music QA...');

  // 1,2,3 symbol tests
  const tieSymbol = findSymbolById('tie');
  assert(tieSymbol, 'tie symbol missing');
  expectCellsEqual(tieSymbol.cells, [[4], [1, 4]], 'Tie cells mismatch');

  const finalSymbol = findSymbolById('final-barline');
  assert(finalSymbol, 'final-barline symbol missing');
  expectCellsEqual(finalSymbol.cells, [[1, 2, 6], [1, 3]], 'Final barline cells mismatch');

  const sectionalSymbol = findSymbolById('sectional-barline');
  assert(sectionalSymbol, 'sectional-barline symbol missing');
  expectCellsEqual(sectionalSymbol.cells, [[1, 2, 6], [1, 3], [3]], 'Sectional barline cells mismatch');

  // 4-7 key signature tests
  expectCellsEqual(
    muzikKeySignatureHucreleri({ ad: '4 diyezli' }),
    [[3, 4, 5, 6], [1, 4, 5], [1, 4, 6]],
    '4 diyezli key signature mismatch',
  );

  expectCellsEqual(
    muzikKeySignatureHucreleri({ ad: '5 bemollü' }),
    [[3, 4, 5, 6], [1, 5], [1, 2, 6]],
    '5 bemollü key signature mismatch',
  );

  expectCellsEqual(
    muzikKeySignatureHucreleri({ ad: '5 bemollu' }),
    [[3, 4, 5, 6], [1, 5], [1, 2, 6]],
    '5 bemollu alternative key signature mismatch',
  );

  expectCellsEqual(
    muzikKeySignatureHucreleri({ ad: '5 bemol' }),
    [[3, 4, 5, 6], [1, 5], [1, 2, 6]],
    '5 bemol alternative key signature mismatch',
  );

  expectCellsEqual(
    muzikKeySignatureHucreleri({ ad: '5 diyezli' }),
    [[3, 4, 5, 6], [1, 5], [1, 4, 6]],
    '5 diyezli key signature mismatch',
  );

  // 8 small rest mapping tests
  const expectedRestMap = {
    16: [1, 3, 4],
    32: [1, 3, 6],
    64: [1, 2, 3, 6],
  };
  Object.entries(expectedRestMap).forEach(([realValue, expected]) => {
    const idx = MUZIK_SURE_GOSTERGELERI.findIndex((s) => s.realValue === Number(realValue));
    assert(idx >= 0, `Missing sure index for realValue ${realValue}`);
    const sog = muzikSusSkorOgesi(`rest-${realValue}`, idx);
    assert.deepEqual(sog.hucreler[0], expected, `Rest cells for ${realValue} mismatch`);
  });

  const idx128 = MUZIK_SURE_GOSTERGELERI.findIndex((s) => s.realValue === 128);
  if (idx128 < 0) {
    console.warn('Skipping realValue 128 rest test because SURE_GOSTERGELERI does not contain 128.');
  } else {
    const sog = muzikSusSkorOgesi('rest-128', idx128);
    expectCellsEqual(sog.hucreler[0], [1, 3, 4, 6], '128 rest cells mismatch');
  }

  // 9 tokenizer numeric key signatures
  const sharpTokens = tokenizeBrfCells([[3, 4, 5, 6], [1, 4, 5], [1, 4, 6]]).tokens;
  const sharpToken = sharpTokens.find((t) => t.type === 'keySignature');
  assert(sharpToken, 'Expected sharp keySignature token');
  assert.equal(sharpToken.count, 4, 'Sharp keySignature count mismatch');
  assert.equal(sharpToken.accidental, 'sharp', 'Sharp keySignature accidental mismatch');

  const flatTokens = tokenizeBrfCells([[3, 4, 5, 6], [1, 5], [1, 2, 6]]).tokens;
  const flatToken = flatTokens.find((t) => t.type === 'keySignature');
  assert(flatToken, 'Expected flat keySignature token');
  assert.equal(flatToken.count, 5, 'Flat keySignature count mismatch');
  assert.equal(flatToken.accidental, 'flat', 'Flat keySignature accidental mismatch');

  // 10 tokenizer tie
  const tieTokens = tokenizeBrfCells([[4], [1, 4]]).tokens;
  const tieToken = tieTokens.find((t) => t.type === 'tieMarker');
  assert(tieToken, 'Expected tieMarker token for tie');

  // 11 tokenizer slur
  const slurTokens = tokenizeBrfCells([[1, 4]]).tokens;
  const slurToken = slurTokens.find((t) => t.type === 'slurMarker');
  assert(slurToken, 'Expected slurMarker token for slur');
  assert(!slurTokens.some((t) => t.type === 'tieMarker'), 'Unexpected tieMarker for slur cell');

  // 12 slur export modes
  const slurHeader = { timeSignature: { ad: '4/4', gorunum: '4/4', expectedDuration16: 16, hucreler: muzikTimeSignatureHucreleri('4/4') } };
  const slurN1 = muzikNotaSkorOgesi('n1', 'do', 2, { oktav: 5 });
  const slurN2 = muzikNotaSkorOgesi('n2', 're', 2, { oktav: 5 });
  const slurN3 = muzikNotaSkorOgesi('n3', 'mi', 2, { oktav: 5 });
  const slurN4 = muzikNotaSkorOgesi('n4', 'fa', 2, { oktav: 5 });
  const slurBag = {
    id: 'slur1',
    tip: 'slur',
    basId: 'n1',
    sonId: 'n4',
    notaIdler: ['n1', 'n2', 'n3', 'n4'],
    kayit: { tip: 'slur', ad: 'Slur / legato bağı', hucreler: [[1, 4]] },
  };
  const autoFourNoteSlurScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2, slurN3, slurN4], [slurBag], slurHeader, []);
  const autoFourNoteSlurKeys = autoFourNoteSlurScore.hucreler.map(cellKey);
  const autoFourNoteSlurIndexes = autoFourNoteSlurKeys.map((key, idx) => (key === '14' ? idx : -1)).filter((idx) => idx >= 0);
  assert.equal(autoFourNoteSlurKeys.filter((key) => key === '14').length, 3, '4-note slur without explicit mode should output three 14 slur cells');
  assert(autoFourNoteSlurIndexes[1] === autoFourNoteSlurIndexes[0] + 1, '4-note auto slur should start with double slur cells');
  assert(autoFourNoteSlurIndexes[2] > autoFourNoteSlurIndexes[1] + 1, '4-note auto slur should place the final slur before the last note');

  const explicitSingleBag = { ...slurBag, mode: 'single' };
  const explicitSingleScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2, slurN3, slurN4], [explicitSingleBag], slurHeader, []);
  const explicitSingleKeys = explicitSingleScore.hucreler.map(cellKey);
  assert.equal(explicitSingleKeys.filter((key) => key === '14').length, 3, 'Explicit single mode on 4-note slur should keep single slur behavior');
  assert(!explicitSingleKeys.some((key, i) => key === '14' && explicitSingleKeys[i + 1] === '14'), 'Explicit single mode on 4-note slur should not emit double slur cells');

  const twoNoteAutoSlurScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2], [{ ...slurBag, notaIdler: ['n1', 'n2'], sonId: 'n2' }], slurHeader, []);
  const twoNoteAutoSlurKeys = twoNoteAutoSlurScore.hucreler.map(cellKey);
  assert.equal(twoNoteAutoSlurKeys.filter((key) => key === '14').length, 1, '2-note slur without explicit mode should output a single 14 cell');
  assert(!twoNoteAutoSlurKeys.some((key, i) => key === '14' && twoNoteAutoSlurKeys[i + 1] === '14'), '2-note slur should not output consecutive slur cells');

  const threeNoteAutoSlurScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2, slurN3], [{ ...slurBag, notaIdler: ['n1', 'n2', 'n3'], sonId: 'n3' }], slurHeader, []);
  const threeNoteAutoSlurKeys = threeNoteAutoSlurScore.hucreler.map(cellKey);
  assert.equal(threeNoteAutoSlurKeys.filter((key) => key === '14').length, 2, '3-note slur without explicit mode should output two 14 cells');
  assert(!threeNoteAutoSlurKeys.some((key, i) => key === '14' && threeNoteAutoSlurKeys[i + 1] === '14'), '3-note slur should not output consecutive double slur cells');

  const explicitShortDoubleBag = { ...slurBag, mode: 'double-for-long', notaIdler: ['n1', 'n2', 'n3'], sonId: 'n3' };
  const explicitShortDoubleScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2, slurN3], [explicitShortDoubleBag], slurHeader, []);
  const explicitShortDoubleKeys = explicitShortDoubleScore.hucreler.map(cellKey);
  assert.equal(explicitShortDoubleKeys.filter((key) => key === '14').length, 2, 'Explicit double-for-long on 3-note slur should fall back to single output');
  assert(!explicitShortDoubleKeys.some((key, i) => key === '14' && explicitShortDoubleKeys[i + 1] === '14'), 'Explicit short double-for-long should not output consecutive double slur cells');

  const doubleSlurBag = { ...slurBag, mode: 'double-for-long' };
  const doubleSlurScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2, slurN3, slurN4], [doubleSlurBag], slurHeader, []);
  const doubleKeys = doubleSlurScore.hucreler.map(cellKey);
  const doubleSlurIndexes = doubleKeys.map((key, idx) => (key === '14' ? idx : -1)).filter((idx) => idx >= 0);
  assert.equal(doubleKeys.filter((key) => key === '14').length, 3, 'Double-for-long bag.mode should output three 14 slur cells for 4-note slur');
  assert(doubleSlurIndexes.length === 3, 'Double-for-long bag.mode should output exactly three slur cells');
  assert(doubleSlurIndexes[1] === doubleSlurIndexes[0] + 1, 'Double-for-long bag.mode should output two consecutive slur cells at the start');
  assert(doubleSlurIndexes[2] > doubleSlurIndexes[1] + 1, 'Double-for-long bag.mode should not output a third slur immediately after the first two');

  const doubleStartMeaning = normalizeBrailleMeaning({ kaynak: 'double-slur-start', rol: 'double-slur-start', etiket: 'Double slur başlangıç' });
  assert.equal(brailleKategoriAl(doubleStartMeaning), 'slur', 'double-slur-start should normalize to slur category');
  assert.equal(brailleRenkAl(doubleStartMeaning).fill, BRAILLE_CATEGORY_COLORS.slur.fill, 'double-slur-start should use slur color');

  const beforeLastMeaning = normalizeBrailleMeaning({ kaynak: 'slur-before-last', rol: 'slur-before-last', etiket: 'Slur bitiş işareti' });
  assert.equal(brailleKategoriAl(beforeLastMeaning), 'slur', 'slur-before-last should normalize to slur category');
  assert.equal(brailleRenkAl(beforeLastMeaning).fill, BRAILLE_CATEGORY_COLORS.slur.fill, 'slur-before-last should use slur color');

  const mixedMeaning = normalizeBrailleMeaning({ kaynak: 'slur-before-last', tip: 'nota', ad: 're', etiket: 're' });
  assert.equal(brailleKategoriAl(mixedMeaning), 'slur', 'slur meta should take precedence over note category');

  const shortDoubleSlurBag = { ...slurBag, mode: 'double-for-long', notaIdler: ['n1', 'n2', 'n3'], sonId: 'n3' };
  const shortDoubleSlurScore = muzikSkorunuBrailleyeCevir([slurN1, slurN2, slurN3], [shortDoubleSlurBag], slurHeader, []);
  const shortDoubleKeys = shortDoubleSlurScore.hucreler.map(cellKey);
  assert.equal(shortDoubleKeys.filter((key) => key === '14').length, 2, 'Short slur with double-for-long mode should fall back to single output');
  assert(!shortDoubleKeys.some((key, i) => key === '14' && shortDoubleKeys[i + 1] === '14'), 'Short slur with double-for-long mode should not output consecutive 14 cells');

  // 13 sectional/final tokenizer
  const sectionalTokens = tokenizeBrfCells([[1, 2, 6], [1, 3], [3]]).tokens;
  const sectionalToken = sectionalTokens.find((t) => t.type === 'sectionalBarline');
  assert(sectionalToken, 'Expected sectionalBarline token');

  const finalTokens = tokenizeBrfCells([[1, 2, 6], [1, 3]]).tokens;
  const finalToken2 = finalTokens.find((t) => t.type === 'finalBarline');
  assert(finalToken2, 'Expected finalBarline token');

  // 13 export first note octave
  const note1 = muzikNotaSkorOgesi('n1', 'do', 2, { oktav: 4 });
  const header44 = { timeSignature: { ad: '4/4', gorunum: '4/4', expectedDuration16: 16, hucreler: muzikTimeSignatureHucreleri('4/4') } };
  const score1 = muzikSkorunuBrailleyeCevir([note1], [], header44, []);
  assertOctaveBeforeNote(score1, 'n1');

  // 14 time signature change after note
  const note2 = muzikNotaSkorOgesi('n2', 're', 2, { oktav: 4 });
  const tsChange = { id: 'ts1', tip: 'timeSignatureChange', ad: '3/4', gorunum: '3/4', hucreler: muzikTimeSignatureHucreleri('3/4'), timeSignature: { ad: '3/4', gorunum: '3/4', expectedDuration16: 12, hucreler: muzikTimeSignatureHucreleri('3/4') }, inlineSource: {}, aciklama: 'time signature change' };
  const score2 = muzikSkorunuBrailleyeCevir([note1, { ...note2, id: 'n3' }, tsChange, { ...note2, id: 'n4' }], [], header44, []);
  assertOctaveBeforeNote(score2, 'n4');

  // 15 key signature change after note
  const ksChange = { id: 'ks1', tip: 'keySignatureChange', ad: '4 diyezli', gorunum: '4 diyezli', hucreler: muzikKeySignatureHucreleri({ ad: '4 diyezli' }), keySignature: { ad: '4 diyezli', gorunum: '4 diyezli', hucreler: muzikKeySignatureHucreleri({ ad: '4 diyezli' }) }, inlineSource: {}, aciklama: 'key signature change' };
  const score3 = muzikSkorunuBrailleyeCevir([note1, ksChange, { ...note2, id: 'n5' }], [], header44, []);
  assertOctaveBeforeNote(score3, 'n5');

  // 16 sectional barline after note
  const sectionalOge = { id: 'sec1', tip: 'sectionalBarline', ad: 'sectional barline', gorunum: '𝄁', hucreler: [[1, 2, 6], [1, 3], [3]], auto: false, autoBarline: false, otomatikOlcuCizgisi: false };
  const score4 = muzikSkorunuBrailleyeCevir([note1, sectionalOge, { ...note2, id: 'n6' }], [], header44, []);
  assertOctaveBeforeNote(score4, 'n6');

  // 17 word expression after rest then note
  const wordExpression = { id: 'w1', tip: 'wordExpression', ad: 'İfade: test', gorunum: '>test', hucreler: [[3, 4, 5], [1], [1, 2]], requiresNextNoteOctave: true };
  const rest = muzikSusSkorOgesi('rest1', 1);
  const note7 = { ...note2, id: 'n7' };
  const score5 = muzikSkorunuBrailleyeCevir([wordExpression, rest, note7], [], header44, []);
  assertNoOctaveForOge(score5, 'rest1');
  assertOctaveBeforeNote(score5, 'n7');

  // 18 new braille line should still produce octave before first real note
  const line1Notes = [];
  for (let i = 1; i <= 18; i += 1) {
    line1Notes.push(muzikNotaSkorOgesi(`n${i}`, 'do', 16, { oktav: 5 }));
  }
  const barline1 = { id: 'bar1', tip: 'barline', kind: 'normal', auto: false, autoBarline: false, otomatikOlcuCizgisi: false, ad: 'Barline', gorunum: '|' };
  for (let i = 19; i <= 36; i += 1) {
    const pitch = i === 19 ? 're' : 'do';
    line1Notes.push(muzikNotaSkorOgesi(`n${i}`, pitch, 16, { oktav: 5 }));
  }
  const barline2 = { id: 'bar2', tip: 'barline', kind: 'normal', auto: false, autoBarline: false, otomatikOlcuCizgisi: false, ad: 'Barline', gorunum: '|' };
  const extraNote = muzikNotaSkorOgesi('n37', 're', 4, { oktav: 5 });
  const score6 = muzikSkorunuBrailleyeCevir([...line1Notes.slice(0, 18), barline1, ...line1Notes.slice(18), barline2, extraNote], [], header44, []);
  assertOctaveBeforeNote(score6, 'n19');
  assert(!score6.hucreMeta.some((meta) => meta?.kaynak === 'bar-number'), 'Expected no bar-number meta by default');

  const headerWithBarNumbers = { ...header44, includeBarNumbers: true };
  const score7 = muzikSkorunuBrailleyeCevir([...line1Notes.slice(0, 18), barline1, ...line1Notes.slice(18), barline2, extraNote], [], headerWithBarNumbers, []);
  assert(score7.hucreMeta.some((meta) => meta?.kaynak === 'bar-number'), 'Expected bar-number meta when includeBarNumbers is true');

  // 19 legend color collisions
  assertNoColorCollision([
    'nota',
    'sus',
    'oktav',
    'accidental',
    'time-signature',
    'time-signature-change',
    'key-signature',
    'key-signature-change',
    'bar-number',
    'bar-repeat',
    'tie',
    'slur',
    'tuplet',
    'tempo',
  ]);

  console.log('All Braille music QA checks passed.');
}

try {
  run();
} catch (error) {
  console.error('Braille music QA failed:');
  console.error(error);
  process.exit(1);
}
