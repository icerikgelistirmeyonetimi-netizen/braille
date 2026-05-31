import assert from 'assert';
import { PDF_BRAILLE_EXAMPLE_FIXTURES } from './music-braille-pdf-fixtures.mjs';
import {
  muzikSkorunuBrailleyeCevir,
  muzikKeySignatureHucreleri,
  muzikTimeSignatureHucreleri,
  muzikNotaSkorOgesi,
  muzikSusSkorOgesi,
  muzikKontraksiyonsuzMetinHucreleri,
} from '../src/utils/music/index.js';
import { SURE_GOSTERGELERI } from '../src/data/muzik.js';
import { brfTextToScore } from '../src/utils/music-brf/import/musicBrfImportEngine.js';
import { cellToUnicodeBraille } from '../src/utils/music-brf/import/musicBrailleCellUtils.js';

function normalizeDots(dots = []) {
  return [...(dots || [])]
    .map((n) => Number(n))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 8)
    .sort((a, b) => a - b);
}

function normalizeCell(cell = []) {
  return normalizeDots(cell);
}

function normalizeCells(cells = []) {
  return (cells || []).map(normalizeCell);
}

function cellKey(cell = []) {
  return normalizeCell(cell).join('');
}

function cellsKey(cells = []) {
  return normalizeCells(cells).map(cellKey).join('|');
}

function cellsEqual(a = [], b = []) {
  const aNorm = normalizeCells(a);
  const bNorm = normalizeCells(b);
  if (aNorm.length !== bNorm.length) return false;
  return aNorm.every((cell, i) => cellKey(cell) === cellKey(bNorm[i]));
}

function assertCellsEqual(actual = [], expected = [], message) {
  const actualNorm = normalizeCells(actual);
  const expectedNorm = normalizeCells(expected);
  assert.strictEqual(
    actualNorm.length,
    expectedNorm.length,
    `${message}: expected ${expectedNorm.length} cells, got ${actualNorm.length}`,
  );
  for (let i = 0; i < expectedNorm.length; i += 1) {
    assert.strictEqual(
      cellKey(actualNorm[i]),
      cellKey(expectedNorm[i]),
      `${message}: mismatch at index ${i} (${JSON.stringify(expectedNorm[i])})`,
    );
  }
}

function containsCellsInOrder(actual = [], expected = [], message) {
  const actualKeys = normalizeCells(actual).map(cellKey);
  const expectedKeys = normalizeCells(expected).map(cellKey);
  let position = 0;

  for (const expectedKey of expectedKeys) {
    const foundIndex = actualKeys.slice(position).findIndex((key) => key === expectedKey);
    if (foundIndex < 0) {
      throw new Error(`${message}: expected sequence cell [${expectedKey}] not found in order.`);
    }
    position += foundIndex + 1;
  }
}

function cellsToBrfText(cells = []) {
  return (cells || []).map((cell) => {
    const normalized = normalizeCell(cell);
    if (!normalized.length) return ' ';
    return cellToUnicodeBraille(normalized);
  }).join('');
}

function durationIndex(realValue) {
  return SURE_GOSTERGELERI.findIndex((s) => s.realValue === realValue);
}

function requireDurationIndex(realValue, fixtureId) {
  const idx = durationIndex(realValue);
  if (idx < 0) {
    throw new Error(`${fixtureId}: SURE_GOSTERGELERI missing realValue ${realValue}`);
  }
  return idx;
}

function makeBag(startId, endId, type, mode) {
  if (!startId || !endId) return null;
  const kayit = {
    tip: type,
    ad: type === 'tie' ? 'Tie / uzatma bağı' : 'Slur / legato bağı',
    gorunum: type,
    hucreler: type === 'tie' ? [[4], [1, 4]] : [[1, 4]],
  };

  const bag = {
    id: `bag-${type}-${startId}-${endId}`,
    tip: type,
    basId: startId,
    sonId: endId,
    notaIdler: [startId, endId],
    kayit,
  };

  if (typeof mode === 'string') {
    bag.mode = mode;
    if (type === 'slur') {
      bag.kayit.mode = mode;
    }
  }

  return bag;
}

function scoreItemsFromSpec(scoreItemsSpec = [], fixtureId = 'unknown-fixture') {
  const ogeler = [];
  const baglar = [];
  let lastNoteId = null;
  let pendingBagType = null;

  for (const item of scoreItemsSpec) {
    switch (item.type) {
      case 'note': {
        const id = `n${ogeler.length + 1}`;
        const oge = muzikNotaSkorOgesi(id, item.pitch, requireDurationIndex(item.duration, fixtureId), {
          oktav: item.octave,
          accidental: item.accidental || null,
          dotted: Boolean(item.dotted),
          modifiers: { oncesi: [], sonrasi: [] },
        });
        ogeler.push(oge);

        if (pendingBagType && lastNoteId) {
          const bag = makeBag(lastNoteId, id, pendingBagType);
          if (bag) baglar.push(bag);
          pendingBagType = null;
        }

        lastNoteId = id;
        break;
      }
      case 'rest': {
        const id = `r${ogeler.length + 1}`;
        const oge = muzikSusSkorOgesi(id, requireDurationIndex(item.duration, fixtureId), {
          dotted: Boolean(item.dotted),
        });
        ogeler.push(oge);
        break;
      }
      case 'finalBarline': {
        ogeler.push({
          id: `final-${ogeler.length + 1}`,
          tip: 'finalBarline',
          ad: 'Final barline',
          gorunum: 'finalBarline',
          hucreler: [[1, 2, 6], [1, 3]],
        });
        break;
      }
      case 'timeSignatureChange': {
        const value = String(item.value || '').trim();
        ogeler.push({
          id: `time-${ogeler.length + 1}`,
          tip: 'timeSignatureChange',
          ad: value,
          gorunum: value,
          hucreler: muzikTimeSignatureHucreleri(value),
          timeSignature: {
            ad: value,
            gorunum: value,
            hucreler: muzikTimeSignatureHucreleri(value),
          },
          inlineSource: {},
          aciklama: 'time signature change',
        });
        break;
      }
      case 'keySignatureChange': {
        const value = String(item.value || '').trim();
        ogeler.push({
          id: `key-${ogeler.length + 1}`,
          tip: 'keySignatureChange',
          ad: value,
          gorunum: value,
          hucreler: muzikKeySignatureHucreleri({ ad: value }),
          keySignature: {
            ad: value,
            gorunum: value,
            hucreler: muzikKeySignatureHucreleri({ ad: value }),
          },
          inlineSource: {},
          aciklama: 'key signature change',
        });
        break;
      }
      case 'sectionalBarline': {
        ogeler.push({
          id: `sectional-${ogeler.length + 1}`,
          tip: 'sectionalBarline',
          ad: 'Sectional double barline',
          gorunum: 'sectionalBarline',
          hucreler: [[1, 2, 6], [1, 3], [3]],
        });
        break;
      }
      case 'beginRepeat': {
        ogeler.push({
          id: `begin-${ogeler.length + 1}`,
          tip: 'beginRepeat',
          ad: 'Begin repeat',
          gorunum: 'beginRepeat',
          hucreler: [[1, 2, 6], [2, 3, 5, 6]],
        });
        break;
      }
      case 'wordExpression': {
        const text = String(item.text || '');
        ogeler.push({
          id: `word-${ogeler.length + 1}`,
          tip: 'wordExpression',
          ad: text,
          gorunum: text,
          hucreler: [[3, 4, 5], ...muzikKontraksiyonsuzMetinHucreleri(text)],
          requiresNextNoteOctave: true,
        });
        break;
      }
      case 'tieToNext': {
        pendingBagType = 'tie';
        break;
      }
      case 'slurToNext': {
        pendingBagType = 'slur';
        break;
      }
      case 'slur': {
        const startId = item.startNoteId || (Number.isFinite(item.startNoteIndex) ? `n${item.startNoteIndex}` : null);
        const endId = item.endNoteId || (Number.isFinite(item.endNoteIndex) ? `n${item.endNoteIndex}` : null);
        const bag = makeBag(startId, endId, 'slur', item.mode);
        if (bag) baglar.push(bag);
        break;
      }
      case 'tie': {
        const startId = item.startNoteId || (Number.isFinite(item.startNoteIndex) ? `n${item.startNoteIndex}` : null);
        const endId = item.endNoteId || (Number.isFinite(item.endNoteIndex) ? `n${item.endNoteIndex}` : null);
        const bag = makeBag(startId, endId, 'tie');
        if (bag) baglar.push(bag);
        break;
      }
      default: {
        // preserve unknown fixture items without failing the loader
        break;
      }
    }
  }

  return { ogeler, baglar };
}

function buildHeader(fixture) {
  return {
    title: '',
    composer: '',
    tempo: '',
    keySignature: null,
    timeSignature: {
      ad: '4/4',
      gorunum: '4/4',
      hucreler: muzikTimeSignatureHucreleri('4/4'),
      expectedDuration16: 16,
    },
    autoCompleteMeasures: false,
    pickupMeasure: false,
    ...(fixture.header || {}),
  };
}

function fixtureActualCells(fixture) {
  if (fixture.type === 'staticCellsOnly') {
    return normalizeCells(fixture.expectedCells || []);
  }

  if (fixture.type === 'timeSignatureOnly') {
    return normalizeCells(muzikTimeSignatureHucreleri(fixture.timeSignature));
  }

  if (fixture.type === 'keySignatureOnly') {
    return normalizeCells(muzikKeySignatureHucreleri({ ad: fixture.keySignature }));
  }

  if (Array.isArray(fixture.scoreItemsSpec)) {
    const { ogeler, baglar } = scoreItemsFromSpec(fixture.scoreItemsSpec, fixture.id);
    const result = muzikSkorunuBrailleyeCevir(ogeler, baglar, buildHeader(fixture), []);
    return normalizeCells(result.hucreler || []);
  }

  return [];
}

function assertFixtureCells(fixture, actualCells) {
  const expectedCells = normalizeCells(fixture.expectedCells || []);
  if (fixture.matchMode === 'exact') {
    assertCellsEqual(actualCells, expectedCells, `${fixture.id} exact cells`);
  } else {
    containsCellsInOrder(actualCells, expectedCells, `${fixture.id} contains cells`);
  }
}

function performImportTest(fixture) {
  const brfText = cellsToBrfText(fixture.expectedCells || []);
  const importResult = brfTextToScore(brfText);
  const importCells = normalizeCells(importResult.cells || []);
  if (fixture.matchMode === 'exact') {
    assertCellsEqual(importCells, normalizeCells(fixture.expectedCells || []), `${fixture.id} import exact`);
  } else {
    containsCellsInOrder(importCells, normalizeCells(fixture.expectedCells || []), `${fixture.id} import contains`);
  }
}

function summarizeFixtures(fixtures) {
  const summary = fixtures.reduce((acc, fixture) => {
    const lessonKey = `Lesson ${fixture.lesson}`;
    if (!acc[lessonKey]) {
      acc[lessonKey] = { active: 0, pending: 0 };
    }
    if (fixture.status === 'active') acc[lessonKey].active += 1;
    if (fixture.status === 'pending') acc[lessonKey].pending += 1;
    return acc;
  }, {});

  for (const lesson of Object.keys(summary).sort((a, b) => Number(a.split(' ')[1]) - Number(b.split(' ')[1]))) {
    const counts = summary[lesson];
    console.log(`${lesson}: active ${counts.active}, pending ${counts.pending}`);
  }
}

function run() {
  console.log('Running music Braille PDF examples QA...');
  const failures = [];
  const skipped = [];
  const passes = [];

  for (const fixture of PDF_BRAILLE_EXAMPLE_FIXTURES) {
    const header = `Fixture ${fixture.id} (${fixture.title})`;
    if (fixture.status === 'pending') {
      skipped.push(fixture.id);
      console.log(`SKIP  ${fixture.id} — pending: ${fixture.pdfRule || fixture.notes || ''}`);
      continue;
    }

    try {
      const actualCells = fixtureActualCells(fixture);
      assertFixtureCells(fixture, actualCells);

      if (fixture.expectedCells && fixture.expectedCells.length > 0) {
        performImportTest(fixture);
      }

      if (fixture.scoreItemsSpec && fixture.scoreItemsSpec.length > 0) {
        const { ogeler, baglar } = scoreItemsFromSpec(fixture.scoreItemsSpec);
        const exportResult = muzikSkorunuBrailleyeCevir(ogeler, baglar, buildHeader(fixture), []);
        const exportedCells = normalizeCells(exportResult.hucreler || []);
        if (fixture.id === 'pdf-lesson-four-measure-sixteenth-example') {
          for (let i = 0; i < exportedCells.length - 1; i += 1) {
            if (cellKey(exportedCells[i]) === '25' && cellKey(exportedCells[i + 1]) === '46') {
              throw new Error('Unexpected bar-number + octave marker sequence at measure 3 start');
            }
          }
        }
        if (fixture.matchMode === 'exact') {
          assertCellsEqual(exportedCells, normalizeCells(fixture.expectedCells || []), `${fixture.id} export exact`);
        } else {
          containsCellsInOrder(exportedCells, normalizeCells(fixture.expectedCells || []), `${fixture.id} export contains`);
        }
      }

      passes.push(fixture.id);
      console.log(`PASS  ${fixture.id}`);
    } catch (error) {
      failures.push({ fixtureId: fixture.id, error });
      console.error(`FAIL  ${fixture.id}: ${error.message}`);
    }
  }

  console.log('');
  summarizeFixtures(PDF_BRAILLE_EXAMPLE_FIXTURES);
  console.log(`\nSummary: passed ${passes.length}, failed ${failures.length}, skipped ${skipped.length}`);

  if (failures.length > 0) {
    failures.forEach((item) => {
      console.error(`\n${item.fixtureId} failure:\n${item.error.stack}`);
    });
    process.exitCode = 1;
  }
}

run();
