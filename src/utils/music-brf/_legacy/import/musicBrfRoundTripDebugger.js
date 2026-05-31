import {
  brfTextToCells,
  cellKey,
  cellsToDebugText,
} from './musicBrailleCellUtils.js';

import {
  muzikSkorunuBrailleyeCevir,
} from '../../music/musicBrfEngine.js';

function isEmptyCellKey(key) {
  return !key || key === '0';
}

function normalizeCellKeysFromCells(cells = []) {
  return (cells || [])
    .map((cell) => cellKey(cell))
    .filter((key) => !isEmptyCellKey(key));
}

function normalizeCellKeysFromBrfText(text = '') {
  return normalizeCellKeysFromCells(brfTextToCells(text));
}

function normalizeCellKeysFromCevirSonuc(cevirSonuc) {
  const cells = cevirSonuc?.hucreler || cevirSonuc?.cells || [];
  return normalizeCellKeysFromCells(cells);
}

function normalizeGeneratedCellsWithMeta(cevirSonuc) {
  const cells = cevirSonuc?.hucreler || cevirSonuc?.cells || [];
  const meta = cevirSonuc?.meta || cevirSonuc?.anlamlar || [];

  return cells
    .map((cell, index) => ({
      index,
      key: cellKey(cell),
      cell,
      meta: meta[index] || null,
    }))
    .filter((item) => item.key && item.key !== '0');
}

function stripLeadingHeaderAndClef(keys = []) {
  let result = [...keys];

  if (result[0] === '3456') {
    result = result.slice(3);
  }

  if (result[0] === '2') {
    result = result.slice(1);
  }

  if (
    result[0] === '345'
    && result[1] === '34'
    && result[2] === '123'
    && result[3] === '5'
  ) {
    result = result.slice(4);
  }

  return result;
}

function normalizeCellsFromCevirSonuc(cevirSonuc) {
  const cells = cevirSonuc?.hucreler || cevirSonuc?.cells || [];
  return Array.isArray(cells) ? cells : [];
}

function ortakPrefixUzunlugu(a = [], b = []) {
  let i = 0;

  while (i < a.length && i < b.length && a[i] === b[i]) {
    i += 1;
  }

  return i;
}

function ortakSuffixUzunlugu(a = [], b = [], prefixLen = 0) {
  let i = 0;

  while (
    i < a.length - prefixLen
    && i < b.length - prefixLen
    && a[a.length - 1 - i] === b[b.length - 1 - i]
  ) {
    i += 1;
  }

  return i;
}

function farkPenceresi(keys = [], start, end, radius = 8) {
  const s = Math.max(0, start - radius);
  const e = Math.min(keys.length, end + radius);

  return keys.slice(s, e).map((key, index) => ({
    pos: s + index,
    key,
  }));
}

function diffCellKeys(originalKeys = [], generatedKeys = []) {
  const prefix = ortakPrefixUzunlugu(originalKeys, generatedKeys);
  const suffix = ortakSuffixUzunlugu(originalKeys, generatedKeys, prefix);

  const originalEnd = originalKeys.length - suffix;
  const generatedEnd = generatedKeys.length - suffix;

  const originalDiff = originalKeys.slice(prefix, originalEnd);
  const generatedDiff = generatedKeys.slice(prefix, generatedEnd);

  const max = Math.max(originalDiff.length, generatedDiff.length);
  const rows = [];

  for (let i = 0; i < max; i += 1) {
    const originalKey = originalDiff[i] ?? null;
    const generatedKey = generatedDiff[i] ?? null;

    if (originalKey !== generatedKey) {
      rows.push({
        diffIndex: i,
        originalPos: prefix + i,
        generatedPos: prefix + i,
        originalKey,
        generatedKey,
        status:
          originalKey == null
            ? 'extra-generated'
            : generatedKey == null
              ? 'missing-generated'
              : 'different',
      });
    }
  }

  return {
    equal: originalKeys.length === generatedKeys.length && rows.length === 0,
    prefix,
    suffix,
    originalLength: originalKeys.length,
    generatedLength: generatedKeys.length,
    rows,
    originalWindow: farkPenceresi(originalKeys, prefix, originalEnd),
    generatedWindow: farkPenceresi(generatedKeys, prefix, generatedEnd),
  };
}

function safeConsoleGroup(title, fn) {
  if (typeof console === 'undefined') return;

  if (console.groupCollapsed) {
    console.groupCollapsed(title);
    try {
      fn();
    } finally {
      console.groupEnd?.();
    }
    return;
  }

  fn();
}

export function debugBrfRoundTrip({
  brfText,
  header,
  ogeler,
  baglar,
  tupletler,
  tokens,
  ir,
  enabled = true,
  label = 'BRF round-trip debug',
}) {
  if (!enabled) return null;

  try {
    const originalCells = brfTextToCells(brfText);
    const originalAllKeys = normalizeCellKeysFromBrfText(brfText);

    const cevirSonuc = muzikSkorunuBrailleyeCevir(
      ogeler || [],
      baglar || [],
      header || null,
      tupletler || [],
    );

    const generatedCells = normalizeCellsFromCevirSonuc(cevirSonuc);
    const generatedWithMeta = normalizeGeneratedCellsWithMeta(cevirSonuc);
    const generatedAllKeys = normalizeCellKeysFromCevirSonuc(cevirSonuc);

    console.log(
      'BRF_GENERATED_WITH_META_JSON',
      JSON.stringify(
        generatedWithMeta.map((item) => ({
          index: item.index,
          key: item.key,
          kaynak: item.meta?.kaynak || null,
          etiket: item.meta?.etiket || null,
          ogeId: item.meta?.ogeId || null,
          meta: item.meta || null,
        })),
        null,
        2,
      ),
    );

    const originalKeys = stripLeadingHeaderAndClef(originalAllKeys);
    const generatedKeys = stripLeadingHeaderAndClef(generatedAllKeys);

    const diff = diffCellKeys(originalKeys, generatedKeys);

    safeConsoleGroup(label, () => {
      console.log('Original BRF cell count:', diff.originalLength);
      console.log('Generated BRF cell count:', diff.generatedLength);
      console.log('Equal:', diff.equal);
      console.log('Common prefix:', diff.prefix);
      console.log('Common suffix:', diff.suffix);

      console.log('Parsed score items:', ogeler || []);
      console.log('Parsed ties/slurs:', baglar || []);
      console.log('Parsed tokens:', tokens || []);
      console.log('Parsed IR:', ir || null);
      console.log('Original cells (debug text):', cellsToDebugText(originalCells));
      console.log('Generated cells (debug text):', cellsToDebugText(generatedCells));
      console.log('Generated cells with meta:');
      console.table(
        generatedWithMeta.map((item) => ({
          index: item.index,
          key: item.key,
          kaynak: item.meta?.kaynak,
          etiket: item.meta?.etiket,
          ogeId: item.meta?.ogeId,
        })),
      );

      if (!diff.equal) {
        console.warn('BRF import/export mismatch detected.');
        console.table(diff.rows.slice(0, 80));

        console.log('Original diff window:');
        console.table(diff.originalWindow);

        console.log('Generated diff window:');
        console.table(diff.generatedWindow);
      } else {
        console.info('BRF import/export round-trip matched.');
      }
    });

    return diff;
  } catch (error) {
    console.error('BRF round-trip debug failed:', error);
    return {
      equal: false,
      error,
    };
  }
}
