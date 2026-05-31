import { brfMuzikOku } from './src/utils/music-brf/brfMusicReader.js';
const text = '⠼⠙⠲\n⠐⠝⠕⠏';
const r = brfMuzikOku(text);
console.log('warnings', JSON.stringify(r.warnings));
console.log('items', (r.items||[]).map(i=>i.tip+':'+(i.gorunum||i.ad||'')).join(' | '));
console.log('measures', (r.measures||[]).length);
