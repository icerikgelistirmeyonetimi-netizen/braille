import { muzikSkorunuBrailleyeCevir } from '../src/utils/music/musicBrfEngine.js';
import { muzikNotaSkorOgesi, muzikTimeSignatureHucreleri } from '../src/utils/music/index.js';

const notes = [];
for (let i = 1; i <= 18; i += 1) {
  notes.push(muzikNotaSkorOgesi(`n${i}`, 'do', 16, { oktav: 5 }));
}
const barline1 = { id: 'bar1', tip: 'barline', kind: 'normal', auto: false, autoBarline: false, otomatikOlcuCizgisi: false, ad: 'Barline', gorunum: '|' };
for (let i = 19; i <= 36; i += 1) {
  notes.push(muzikNotaSkorOgesi(`n${i}`, 'do', 16, { oktav: 5 }));
}
const barline2 = { id: 'bar2', tip: 'barline', kind: 'normal', auto: false, autoBarline: false, otomatikOlcuCizgisi: false, ad: 'Barline', gorunum: '|' };
const extraNote = muzikNotaSkorOgesi('n37', 're', 4, { oktav: 5 });
const score = muzikSkorunuBrailleyeCevir([
  ...notes.slice(0, 18),
  barline1,
  ...notes.slice(18),
  barline2,
  extraNote,
], [], {
  timeSignature: {
    ad: '4/4',
    gorunum: '4/4',
    expectedDuration16: 16,
    hucreler: muzikTimeSignatureHucreleri('4/4'),
  },
}, []);

console.log('octave metas', score.hucreMeta.filter((m) => m?.kaynak === 'octave'));
console.log('all metas around index 35-45', score.hucreMeta.slice(30, 55));
console.log('line info can be inferred by index positions of barline cells');
