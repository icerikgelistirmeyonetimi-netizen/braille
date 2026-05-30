import { buildReadableSummary } from './brfMusicReadableSummary.js';
import {
  normalizeBrfText,
  createReaderContext,
  tokenizeBrailleLine,
  detectHeaderLineType,
  setReaderTimeSignature,
  readMusicBrailleCell,
  readMusicBrailleGroup,
  handleLineEnd,
  buildMeasures,
  finalizeSlurMarkers,
} from './brfMusicReaderRules.js';

export function brfMuzikOku(brfText, options = {}) {
  const normalized = normalizeBrfText(brfText);
  const lines = normalized.split(/\r?\n/).map((line) => line.trimEnd());
  const canonicalEditorSource = options?.source === 'editor-canonical-brf';

  const context = createReaderContext({
    ...options,
    canonicalEditorSource,
  });

  lines.forEach((line, lineIndex) => {
    const cells = tokenizeBrailleLine(line, lineIndex);

    if (!context.items.length) {
      const headerType = detectHeaderLineType(cells);
      if ((headerType.type === 'title' || headerType.type === 'title+time-signature') && !context.header.title) {
        context.header.title = headerType.value || '';
      }
      if (headerType.type === 'time-signature' && !context.header.timeSignature) {
        setReaderTimeSignature(context, headerType.value);
      }
      if (headerType.type === 'title+time-signature' && !context.header.timeSignature) {
        setReaderTimeSignature(context, headerType.timeSignature);
      }
      if (headerType.type !== 'music') {
        cells.forEach((cell) => {
          if (cell.type === 'space') {
            context.cells.push({
              seq: context.seq + 1,
              lineIndex: cell.lineIndex,
              cellIndex: cell.cellIndex,
              char: cell.char,
              dots: [],
              dotsText: 'boşluk',
              type: 'space',
              category: 'separator',
              meaning: 'header boşluk',
              effect: '',
              warning: '',
            });
            context.seq += 1;
            return;
          }

          context.cells.push({
            seq: context.seq + 1,
            lineIndex: cell.lineIndex,
            cellIndex: cell.cellIndex,
            char: cell.char,
            dots: cell.dots,
            dotsText: cell.dots.length ? cell.dots.join('-') : 'boşluk',
            type: 'braille',
            category: headerType.type === 'title' ? 'header-title' : 'header-time-signature',
            meaning: headerType.type === 'title' ? 'başlık hücresi' : `zaman imzası (${headerType.value})`,
            effect: 'header alanında işlendi',
            warning: '',
          });
          context.seq += 1;
        });

        handleLineEnd(context);
        return;
      }
    }

    let group = [];
    cells.forEach((cell) => {
      if (cell.type === 'space') {
        if (group.length) {
          readMusicBrailleGroup(group, context);
          group = [];
        }
        readMusicBrailleCell(cell, context);
        return;
      }

      group.push(cell);
    });

    if (group.length) {
      readMusicBrailleGroup(group, context);
    }

    handleLineEnd(context);
  });

  finalizeSlurMarkers(context);
  const measures = buildMeasures(context.items);

  const expected = Number(context.expectedMeasure16 || 0);
  if (expected > 0) {
    measures.forEach((measure) => {
      const total = Number(measure.total16 || 0);
      if (total > 0 && Math.abs(total - expected) > 0.0001) {
        context.warnings.push({
          type: 'measure-duration-warning',
          measureNo: measure.no,
          message: `${measure.no}. ölçü süresi ${total}/${expected}. Çözüm kesin değil; hücre tablosunu kontrol edin.`,
        });
      }
    });
  }

  if (!Array.isArray(context.items) || context.items.length === 0) {
    context.warnings.push({
      type: 'empty-parse',
      message: 'BRF ham olarak okundu ancak müzik notalarına çözümlenemedi.',
    });
  }

  const result = {
    header: context.header,
    items: context.items,
    measures,
    baglar: Array.isArray(context.baglar) ? context.baglar : [],
    cells: context.cells,
    warnings: context.warnings,
    raw: brfText,
    debug: {
      ...((context.debug && typeof context.debug === 'object') ? context.debug : {}),
      slurMarkers: context.slurMarkers,
      noteSequence: context.noteSequence,
      importOptions: options,
      source: options?.source || null,
      canonicalEditorSource,
    },
  };

  return {
    ...result,
    readableText: buildReadableSummary(result),
  };
}
