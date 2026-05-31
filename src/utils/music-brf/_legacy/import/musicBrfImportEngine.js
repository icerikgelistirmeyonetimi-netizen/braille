import { brfTextToCells } from './musicBrailleCellUtils.js';
import { brfCellsToRawLines } from './musicBrfRawTokenizer.js';
import { parseBrfHeader } from './musicBrfHeaderParser.js';
import { scanBrfMeasures } from './musicBrfMeasureScanner.js';
import { analyzeBrfMeasures } from './musicBrfMeasureAnalyzer.js';
import { resolveBrfDurations } from './musicBrfDurationResolver.js';
import { brfIrToScore } from './musicBrfIrToScore.js';

function irToLegacyTokens(ir) {
  const tokens = [];

  (ir?.lines || []).forEach((line) => {
    if (line.type !== 'music-line') return;

    (line.measures || []).forEach((measure) => {
      (measure.noteCandidates || []).forEach((item) => {
        tokens.push({ type: 'noteCandidate', ...item });
      });

      (measure.restCandidates || []).forEach((item) => {
        tokens.push({ type: 'restCandidate', ...item });
      });

      (measure.events || []).forEach((event) => {
        tokens.push({
          type: event.type,
          token: event.token,
          ...event.selected,
        });
      });

      (measure.unknown || []).forEach((unknown) => {
        tokens.push({ type: 'unknown', ...unknown });
      });
    });
  });

  return tokens;
}

export function brfTextToScore(text = '', options = {}) {
  const cells = brfTextToCells(text, options);

  const rawLines = brfCellsToRawLines(text, options);

  const headerResult = parseBrfHeader(rawLines);

  const musicLines = (headerResult.classifiedLines || [])
    .filter((line) => line.classification?.type === 'music-line');

  const measureResult = scanBrfMeasures({
    lines: musicLines,
    header: headerResult.header,
  });

  const analyzedResult = analyzeBrfMeasures({
    ir: measureResult.ir,
    header: headerResult.header,
  });

  const durationResult = resolveBrfDurations({
    ir: analyzedResult.ir,
    header: headerResult.header,
  });

  const scoreResult = brfIrToScore({
    ir: durationResult.ir,
    header: headerResult.header,
  });

  const tokens = irToLegacyTokens(durationResult.ir);
  const rawTokens = rawLines.flatMap((line) => line.rawTokens || []);

  const irWarnings = durationResult.ir?.warnings || [];

  return {
    ...scoreResult,
    ir: durationResult.ir,
    cells,
    tokens,
    rawTokens,
    warnings: [
      ...(headerResult.warnings || []),
      ...(measureResult.warnings || []),
      ...(analyzedResult.warnings || []),
      ...(durationResult.warnings || []),
      ...(scoreResult.warnings || []),
      ...irWarnings,
    ],
  };
}

export async function brfFileToScore(file, options = {}) {
  const text = await file.text();
  return brfTextToScore(text, options);
}
