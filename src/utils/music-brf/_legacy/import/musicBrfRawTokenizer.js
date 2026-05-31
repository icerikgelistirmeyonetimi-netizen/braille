import { brfTextToCells, cellKey } from './musicBrailleCellUtils.js';

export function brfCellsToRawLines(text = '') {
  const lines = String(text || '').split(/\r?\n/);

  return lines.map((lineText, lineIndex) => {
    const cells = brfTextToCells(lineText);

    const rawTokens = cells.map((cell, cellIndex) => ({
      type: cellKey(cell) === '' ? 'space' : 'cell',
      cell,
      key: cellKey(cell),
      lineIndex,
      cellIndex,
    }));

    return {
      index: lineIndex,
      text: lineText,
      cells,
      rawTokens,
    };
  });
}
