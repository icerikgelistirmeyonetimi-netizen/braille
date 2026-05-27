import { scoreToCanonicalBrf, scoreToReaderResult } from './musicCanonicalPipeline.js';
import { muzikNotaSkorOgesi } from '../music/musicScoreFactory.js';

function id(prefix, i) {
  return `${prefix}-${i}`;
}

function endRepeatOgesi() {
  return {
    id: id('end-repeat', 1),
    tip: 'endRepeat',
    type: 'endRepeat',
    ad: 'Bitiş tekrarı',
    gorunum: '𝄇',
    hucreler: [[1, 2, 6], [2, 3]],
  };
}

function beginRepeatOgesi() {
  return {
    id: id('begin-repeat', 1),
    tip: 'beginRepeat',
    type: 'beginRepeat',
    ad: 'Başlangıç tekrarı',
    gorunum: '𝄆',
    hucreler: [[1, 2, 6], [2, 3, 5, 6]],
    requiresNextNoteOctave: true,
  };
}

export function debugCanonicalRepeatCase() {
  const header = {
    timeSignature: {
      ad: '4/4',
      gorunum: '4/4',
      expectedDuration16: 16,
      hucreler: [[3, 4, 5, 6], [1, 4, 5], [2, 5, 6]],
    },
  };

  const ogeler = [
    muzikNotaSkorOgesi(id('do', 1), 'do', 1, { oktav: 4 }),
    muzikNotaSkorOgesi(id('do', 2), 'do', 1, { oktav: 4 }),
    muzikNotaSkorOgesi(id('do', 3), 'do', 1, { oktav: 4 }),
    muzikNotaSkorOgesi(id('do', 4), 'do', 1, { oktav: 4 }),
    endRepeatOgesi(),
    beginRepeatOgesi(),
    muzikNotaSkorOgesi(id('la', 1), 'la', 1, { oktav: 4, dotted: true }),
    muzikNotaSkorOgesi(id('do', 5), 'do', 1, { oktav: 4 }),
    muzikNotaSkorOgesi(id('do', 6), 'do', 1, { oktav: 4 }),
  ];

  const canonical = scoreToCanonicalBrf({
    ogeler,
    baglar: [],
    header,
    tupletler: [],
  });

  const reader = scoreToReaderResult({
    ogeler,
    baglar: [],
    header,
    tupletler: [],
  });

  console.log('DEBUG CANONICAL REPEAT BRF:', canonical.brfText);
  console.log('DEBUG CANONICAL BRF DATA:', canonical.brfData);
  console.log('DEBUG CANONICAL READER:', reader);

  return {
    canonical,
    reader,
  };
}
