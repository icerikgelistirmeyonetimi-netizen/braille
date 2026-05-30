import {
  distributeRowExtraWidth,
  enforceMinimumGapPositions,
  computeRowRightAlignedMeasureEnd,
  computeReadableMeasureWidth,
} from '../src/utils/music-brf/musicVisualLayoutHelpers.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function near(a, b, tolerance = 0.001) {
  return Math.abs(a - b) <= tolerance;
}

function testDistributeRowExtraWidth() {
  const result = distributeRowExtraWidth({
    measures: [
      { id: 'm1', layoutWidth: 100, weight: 1, expandable: true },
      { id: 'm2', layoutWidth: 100, weight: 1, expandable: true },
    ],
    rowAvailable: 300,
    measureGap: 20,
  });

  const total = result.reduce((sum, m) => sum + m.layoutWidth, 0) + 20;

  assert(near(total, 300), `row distribution total expected 300, got ${total}`);
  assert(near(result[0].layoutWidth, 140), `m1 expected 140, got ${result[0].layoutWidth}`);
  assert(near(result[1].layoutWidth, 140), `m2 expected 140, got ${result[1].layoutWidth}`);
}

function testNonExpandableMeasure() {
  const result = distributeRowExtraWidth({
    measures: [
      { id: 'm1', layoutWidth: 80, weight: 1, expandable: false },
      { id: 'm2', layoutWidth: 100, weight: 1, expandable: true },
    ],
    rowAvailable: 240,
    measureGap: 20,
  });

  assert(near(result[0].layoutWidth, 80), `non-expandable width changed: ${result[0].layoutWidth}`);
  assert(near(result[1].layoutWidth, 140), `expandable expected 140, got ${result[1].layoutWidth}`);
}

function testMinimumGapPositions() {
  const result = enforceMinimumGapPositions({
    positions: [
      { id: 'a', x: 10 },
      { id: 'b', x: 15 },
      { id: 'c', x: 20 },
      { id: 'd', x: 25 },
    ],
    safeStart: 10,
    safeEnd: 160,
    minGap: 32,
  });

  assert(!result.compressed, 'should not be compressed');
  const xs = result.positions.map((p) => p.x);

  for (let i = 1; i < xs.length; i += 1) {
    assert(
      xs[i] - xs[i - 1] >= 32 - 0.001,
      `gap ${i} expected >= 32, got ${xs[i] - xs[i - 1]}`,
    );
  }

  assert(xs[0] >= 10, `first x below safeStart: ${xs[0]}`);
  assert(xs[xs.length - 1] <= 160, `last x above safeEnd: ${xs[xs.length - 1]}`);
}

function testCompressedPositions() {
  const result = enforceMinimumGapPositions({
    positions: [
      { id: 'a', x: 0 },
      { id: 'b', x: 10 },
      { id: 'c', x: 20 },
      { id: 'd', x: 30 },
      { id: 'e', x: 40 },
    ],
    safeStart: 0,
    safeEnd: 80,
    minGap: 32,
  });

  assert(result.compressed, 'should be compressed when available < minNeeded');
  assert(near(result.positions[0].x, 0), `compressed first expected 0, got ${result.positions[0].x}`);
  assert(near(result.positions[result.positions.length - 1].x, 80), `compressed last expected 80, got ${result.positions[result.positions.length - 1].x}`);
}

function testRowRightAlignedMeasureEnd() {
  const rowEnd = computeRowRightAlignedMeasureEnd({
    measureStartX: 120,
    layoutWidth: 150,
    rowRightX: 760,
    isLastMeasureInRow: true,
  });

  assert(rowEnd === 760, `last measure end expected 760, got ${rowEnd}`);

  const normalEnd = computeRowRightAlignedMeasureEnd({
    measureStartX: 120,
    layoutWidth: 150,
    rowRightX: 760,
    isLastMeasureInRow: false,
  });

  assert(normalEnd === 270, `non-last measure end expected 270, got ${normalEnd}`);
}

function testReadableMeasureWidth() {
  const width = computeReadableMeasureWidth({
    visibleCount: 4,
    minGap: 32,
    leftPad: 14,
    rightPad: 14,
    extra: 28,
    minWidth: 54,
  });

  const expected = 14 + 14 + 3 * 32 + 28;
  assert(width === expected, `readable width expected ${expected}, got ${width}`);
}

function main() {
  testDistributeRowExtraWidth();
  testNonExpandableMeasure();
  testMinimumGapPositions();
  testCompressedPositions();
  testRowRightAlignedMeasureEnd();
  testReadableMeasureWidth();

  console.log('PASS music-score-layout QA');
}

main();
