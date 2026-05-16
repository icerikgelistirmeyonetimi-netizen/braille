import fs from 'fs';

const p = 'c:/Users/HP/braille/src/pages/Araclar.jsx';
let s = fs.readFileSync(p, 'utf8');

const a = s.indexOf('  const modTekIndeks = (i) => {');
if (a < 0) throw new Error('modTekIndeks start');
const m = s.slice(a).match(/^  const modTekIndeks = \(i\) => \{[\s\S]*?\r?\n  \};/);
if (!m) throw new Error('modTekIndeks body');
let chunk = m[0];
chunk = chunk.replace(/continue;/g, 'return;');
s = s.slice(0, a) + chunk + s.slice(a + m[0].length);

const deadStart = s.indexOf('  // Durum takibi (Metin ↔ BRF ile uyumlu;');
const deadEnd = s.indexOf('  const virgulListesiAyirMi', deadStart);
if (deadStart < 0 || deadEnd < 0) throw new Error('dead lets');
const deadBlock = s.slice(deadStart, deadEnd);
if (!/let sayiModu = false/.test(deadBlock)) throw new Error('not dead block');
s = s.slice(0, deadStart) + s.slice(deadEnd);

fs.writeFileSync(p, s);
console.log('fixed');
