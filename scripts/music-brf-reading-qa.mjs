// OKUMA DOĞRULUĞU testi — PDF fixture'larının INTENDED notaları (token) ↔ editör DECODE'u (import).
// "Bilinmeyen hücre yok" ≠ "doğru okundu": bir hücre yanlış perde/süreye decode olabilir.
// Her parça için intended (üreteç token'ı = doğru) ile import edilen notaları karşılaştırır.
//
//   node scripts/music-brf-reading-qa.mjs            # özet (sorunlu parçalar)
//   node scripts/music-brf-reading-qa.mjs --full     # her parçada ilk farkları göster

import { pieces, keySig, timeSig } from './muzik-brl-fixtures.mjs';
import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { muzikKontraksiyonsuzMetinHucreleri } from '../src/utils/music/musicHeaderEngine.js';

const full = process.argv.includes('--full');
const hucreToBraille = (h) => { let b = 0x2800; for (const d of (h || [])) b |= 1 << (d - 1); return String.fromCodePoint(b); };
const metinBraille = (m) => (muzikKontraksiyonsuzMetinHucreleri(m) || []).map(hucreToBraille).join('');

const PITCH = { C: 'do', D: 're', E: 'mi', F: 'fa', G: 'sol', A: 'la', B: 'si' };
const DUR2IDX = { q: 0, c: 1, m: 2, s: 3, '16': 4, '32': 5, '64': 6, '128': 7 };
const ACC = { '#': 'sharp', 'b': 'flat', 'n': 'natural' };

// INTENDED dizisi (token'lardan): nota/sus, perde+oktav+süre+nokta+aksidental
function intendedDizi(tokens) {
  const seq = [];
  for (const t of tokens) {
    // t.ri: sus süre-indeks override. Çift-anlamlı sus hücresi (birlik-sus hücresi = 16'lık-sus hücresi)
    // 16'lık bağlamında 16'lık sus'tur; fixture gerçek (bağlamsal) süreyi belirtir, reader ölçüden çözer.
    if (t.r) { seq.push(`R/${t.ri ?? DUR2IDX[t.r]}${t.dot ? '.' : ''}`); continue; }
    if (!t.n) continue; // bar/line/raw/dyn-only atla
    const acc = t.acc && ACC[t.acc] ? `#${ACC[t.acc][0]}` : '';
    seq.push(`${PITCH[t.n]}${t.o}/${DUR2IDX[t.d]}${t.dot ? '.' : ''}${acc}`);
  }
  return seq;
}
// DECODED dizisi (import items'tan)
function decodedDizi(items) {
  const seq = [];
  for (const it of items || []) {
    if (it.tip === 'sus') { seq.push(`R/${it.sureIndeksi}${it.dotted ? '.' : ''}`); continue; }
    if (it.tip !== 'nota') continue;
    const acc = it.accidental ? `#${String(it.accidental)[0]}` : '';
    seq.push(`${it.notaAd}${it.oktav}/${it.sureIndeksi}${it.dotted ? '.' : ''}${acc}`);
  }
  return seq;
}
// tam BRF kur (add-pdf-pieces ile aynı)
function tamBrf(meta, brl) {
  const s = [];
  const imza = [keySig(meta.key), meta.time ? timeSig(meta.time) : ''].filter(Boolean).join('');
  if (imza) s.push(imza);
  s.push(brl);
  return s.join('\n');
}

console.log('═'.repeat(80));
console.log('OKUMA DOĞRULUĞU — intended (PDF token) ↔ decoded (editör import)');
console.log('═'.repeat(80));
let perdeHata = 0, sureHata = 0, sayiHata = 0, temiz = 0;
for (const { meta, tokens, brl } of pieces) {
  const intended = intendedDizi(tokens);
  const r = brfMuzikOku(tamBrf(meta, brl), { source: 'reading-qa' });
  const decoded = decodedDizi(r.items);

  // perde+oktav (süreden bağımsız) ve süre ayrı değerlendir
  const perde = (x) => x.split('/')[0];
  const sayiOk = intended.length === decoded.length;
  let ilkPerdeFark = -1, ilkSureFark = -1;
  const n = Math.min(intended.length, decoded.length);
  for (let i = 0; i < n; i += 1) {
    if (perde(intended[i]) !== perde(decoded[i])) { ilkPerdeFark = i; break; }
  }
  for (let i = 0; i < n; i += 1) {
    if (intended[i] !== decoded[i]) { ilkSureFark = i; break; }
  }
  const perdeOk = ilkPerdeFark < 0;
  const sureOk = ilkSureFark < 0 && sayiOk;
  if (!sayiOk) sayiHata += 1;
  if (!perdeOk) perdeHata += 1;
  else if (!sureOk) sureHata += 1;
  else temiz += 1;

  const durum = !perdeOk ? '✗ PERDE' : !sayiOk ? '✗ SAYI' : !sureOk ? '~ süre' : '✓';
  console.log(`${durum.padEnd(8)} ${meta.id.slice(0, 40).padEnd(42)} intended:${String(intended.length).padStart(3)} decoded:${String(decoded.length).padStart(3)}`);
  if (full || !perdeOk || !sayiOk) {
    if (ilkPerdeFark >= 0) console.log(`         PERDE farkı @${ilkPerdeFark}: intended="${intended[ilkPerdeFark]}" decoded="${decoded[ilkPerdeFark]}"`);
    else if (ilkSureFark >= 0) console.log(`         süre farkı @${ilkSureFark}: intended="${intended[ilkSureFark]}" decoded="${decoded[ilkSureFark]}"`);
    if (!sayiOk) console.log(`         SAYI: intended ${intended.length} vs decoded ${decoded.length} (son intended: ${intended.slice(-3).join(',')} | son decoded: ${decoded.slice(-3).join(',')})`);
  }
}
console.log('═'.repeat(80));
console.log(`✓ tam doğru: ${temiz} | ~ süre farkı: ${sureHata} | ✗ perde hatası: ${perdeHata} | ✗ sayı hatası: ${sayiHata}  (toplam ${pieces.length})`);
process.exit(perdeHata > 0 ? 1 : 0);
