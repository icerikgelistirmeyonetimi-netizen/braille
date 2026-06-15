// PDF-DOĞRULANMIŞ 39 FIXTURE'ı editör IMPORT'una karşı test eder.
// muzik-braille-test-ornekleri.md (PDF braille oracle'ı) parse edilir; her parçanın braille'i
// brfMuzikOku ile içe aktarılır. KONTROL: editör PDF'in TÜM braille hücrelerini tanıyor mu
// (bilinmeyen hücre = editör o işareti desteklemiyor demektir).
//
//   node scripts/music-brf-pdf-fixtures-qa.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mdYol = path.join(__dirname, '..', 'muzik-braille-test-ornekleri.md');
const md = fs.readFileSync(mdYol, 'utf8');

// Parse: "## <başlık>" + sonraki "Müzik:" code-block(`...`).
const fixtureler = [];
const satirlar = md.split('\n');
for (let i = 0; i < satirlar.length; i += 1) {
  const m = /^## (.+)$/.exec(satirlar[i]);
  if (!m) continue;
  const baslik = m[1].replace(/⚠.*$/, '').trim();
  // "Müzik:" sonrası ilk ``` bloğunu bul
  let j = i + 1;
  while (j < satirlar.length && !/^Müzik:/.test(satirlar[j]) && !/^## /.test(satirlar[j])) j += 1;
  if (j >= satirlar.length || /^## /.test(satirlar[j])) continue;
  // ``` aç
  let k = j + 1;
  while (k < satirlar.length && !/^```/.test(satirlar[k])) k += 1;
  const govdeSatir = [];
  k += 1;
  while (k < satirlar.length && !/^```/.test(satirlar[k])) { govdeSatir.push(satirlar[k]); k += 1; }
  const braille = govdeSatir.join('\n').trim();
  if (braille) fixtureler.push({ baslik, braille });
}

console.log('═'.repeat(74));
console.log(`PDF FIXTURE IMPORT testi — ${fixtureler.length} işlenmiş örnek (muzik-braille-test-ornekleri.md)`);
console.log('KONTROL: editör PDF braille\'inin TÜM hücrelerini tanıyor mu (bilinmeyen hücre yok)');
console.log('═'.repeat(74));

let hata = 0;
for (const f of fixtureler) {
  const r = brfMuzikOku(f.braille, { source: 'pdf-fixture-qa' });
  const items = Array.isArray(r.items) ? r.items : [];
  const unknown = items.filter((it) => it.tip === 'unknown');
  const nota = items.filter((it) => it.tip === 'nota').length;
  const susleme = items.filter((it) => /tuplet|leme/i.test(it.tip)).length + (r.tupletler || []).length;
  const bos = (r.warnings || []).some((w) => w.type === 'empty-parse');
  const ok = unknown.length === 0 && !bos && nota > 0;
  if (!ok) hata += 1;
  console.log(`${ok ? '✓' : '✗'} ${f.baslik.slice(0, 42).padEnd(44)} nota:${String(nota).padStart(3)} tuplet:${String((r.tupletler || []).length).padStart(2)} bilinmeyen:${unknown.length}${bos ? ' BOŞ-PARSE' : ''}`);
  if (unknown.length) {
    unknown.slice(0, 4).forEach((u) => console.log(`      ↳ bilinmeyen char="${u.char || ''}" noktalar=${JSON.stringify(u.dots || u.hucre || [])}`));
  }
}

console.log('═'.repeat(74));
console.log(hata === 0
  ? `✓ TÜM ${fixtureler.length} PDF örneği editör tarafından bilinmeyen hücre OLMADAN okundu`
  : `✗ ${hata}/${fixtureler.length} PDF örneğinde bilinmeyen hücre / boş-parse — editör o işareti desteklemiyor`);
process.exit(hata ? 1 : 0);
