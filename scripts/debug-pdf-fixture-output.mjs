import { PDF_BRAILLE_EXAMPLE_FIXTURES } from './music-braille-pdf-fixtures.mjs';
import { muzikSkorunuBrailleyeCevir } from '../src/utils/music/musicBrfEngine.js';
import { muzikNotaSkorOgesi, muzikSusSkorOgesi } from '../src/utils/music/index.js';
import { cellToUnicodeBraille } from '../src/utils/music-brf/import/musicBrailleCellUtils.js';

const fixture = PDF_BRAILLE_EXAMPLE_FIXTURES.find((f) => f.id === 'pdf-lesson-four-measure-sixteenth-example');
if (!fixture) {
  throw new Error('Fixture not found');
}

const ogeler = [];
for (const item of fixture.scoreItemsSpec || []) {
  switch (item.type) {
    case 'note': {
      ogeler.push(muzikNotaSkorOgesi(`n${ogeler.length + 1}`, item.pitch, item.duration, {
        oktav: item.octave,
        accidental: item.accidental || null,
        dotted: Boolean(item.dotted),
        modifiers: { oncesi: [], sonrasi: [] },
      }));
      break;
    }
    case 'rest': {
      ogeler.push(muzikSusSkorOgesi(`r${ogeler.length + 1}`, item.duration, {
        dotted: Boolean(item.dotted),
      }));
      break;
    }
    case 'finalBarline': {
      ogeler.push({
        id: `bar-${ogeler.length + 1}`,
        tip: 'finalBarline',
        ad: 'Final barline',
        gorunum: '𝄂',
        hucreler: [[1, 2, 6], [1, 3]],
      });
      break;
    }
    default:
      break;
  }
}
const result = muzikSkorunuBrailleyeCevir(ogeler, [], null, []);
console.log('cells', result.hucreler.map((cell) => (cell.length ? cell.join('') : '_')).join(' | '));
console.log('unicode', result.hucreler.map((cell) => (cell.length ? cellToUnicodeBraille(cell) : '␣')).join(' '));
console.log('meta count', result.hucreMeta.length);
console.log('octave metas', result.hucreMeta.filter((m) => m.kaynak === 'octave').map((m) => `${m.ogeId}:${m.etiket}`));
console.log('bar-number metas', result.hucreMeta.filter((m) => m.kaynak === 'bar-number').length);
