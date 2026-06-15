// BRF round-trip tutarlılık testi — "indir/yükle" tek-merkez kontrol.
//
// Amaç: editörde üretilen skoru BRF'e EXPORT edip (canonical pipeline =
// "BRF İndir"), aynı BRF'i IMPORT edince (brfMuzikOku = "BRF Yükle") tüm
// öğelerin (nota/süre/oktav/arıza/dinamik/nüans/süsleme/bağ/tuplet/ölçü çizgisi)
// geri tanındığını doğrular. Export ile import AYRI motorlar olduğundan
// muzik.js'te bir ad/hücre değiştiğinde bu test ikisinin uyumunu yakalar.
//
//   npm run qa:brf-roundtrip
//
// Çıkış kodu 0 = round-trip sağlam; 1 = en az bir öğe kayboldu/yanlış.

import { brfMuzikOku } from '../src/utils/music-brf/brfMusicReader.js';
import { scoreToCanonicalBrf } from '../src/utils/music-brf/musicCanonicalPipeline.js';
import { muzikNotaSkorOgesi } from '../src/utils/music/musicScoreFactory.js';
import {
  MUZIK_DINAMIKLER,
  MUZIK_NUANS_ONCE,
  MUZIK_NUANS_SONRA,
  MUZIK_SUSLEMELER,
} from '../src/data/muzik.js';

let idSayac = 0;
const yeniId = () => `n${idSayac++}`;

// Editörle AYNI şekilde (factory) nota üret — canonical pipeline'ın beklediği
// tüm alanlar (type, hucreler, ad, gorunum…) dolu olsun.
function nota(notaAd, { oktav = 4, sureIdx = 1, accidental = null, dotted = false, oncesi = [], sonrasi = [] } = {}) {
  return muzikNotaSkorOgesi(yeniId(), notaAd, sureIdx, {
    oktav, accidental, dotted, modifiers: { oncesi, sonrasi },
  });
}

const mod = (kayit, kategori) => ({ id: `m${idSayac++}`, kayit: { ...kayit, kategori, gorselTip: kategori } });

const forte   = MUZIK_DINAMIKLER.find((d) => d.ad === 'forte');
const piyano  = MUZIK_DINAMIKLER.find((d) => d.ad === 'piyano');
const stakato = MUZIK_NUANS_ONCE.find((d) => /stakato/i.test(d.ad));
const aksent  = MUZIK_NUANS_ONCE.find((d) => /aksent/i.test(d.ad) && !/ifadeli|ters/i.test(d.ad));
const fermata = MUZIK_NUANS_SONRA.find((d) => /fermata \(durak\)/i.test(d.ad));
const nefes   = MUZIK_NUANS_SONRA.find((d) => /nefes/i.test(d.ad));
const sezur   = MUZIK_NUANS_SONRA.find((d) => /sez(ü|u)r/i.test(d.ad));
const tril    = MUZIK_SUSLEMELER.find((d) => /^tril$/i.test(d.ad));
const grupeto = MUZIK_SUSLEMELER.find((d) => /^grupeto \(notalar/i.test(d.ad));

// ── Test skoru: her öğe tipinden en az biri ─────────────────────────────────
const ogeler = [
  nota('do', { sureIdx: 1, accidental: 'sharp', oncesi: [mod(forte, 'dinamik')] }), // 4lük do diyez + forte
  nota('re', { sureIdx: 0, oncesi: [mod(stakato, 'nuans')] }),                        // 8lik re + stakato
  nota('mi', { sureIdx: 2, oncesi: [mod(aksent, 'nuans')] }),                         // ikilik mi + aksent
  { id: yeniId(), tip: 'barline', kind: 'manual', ad: 'Manuel ölçü çizgisi', hucreler: [[]] },
  nota('fa', { sureIdx: 1, oktav: 5, dotted: true, oncesi: [mod(tril, 'susleme')] }), // 5. oktav noktalı 4lük fa + tril
  nota('sol', { sureIdx: 1, accidental: 'flat', sonrasi: [mod(fermata, 'nuans')] }),  // 4lük sol bemol + fermata
  nota('la', { sureIdx: 3, oncesi: [mod(piyano, 'dinamik')] }),                       // birlik la + piyano
  nota('si', { sureIdx: 1, oncesi: [mod(grupeto, 'susleme')], sonrasi: [mod(nefes, 'nuans')] }), // grupeto + nefes
  nota('do', { sureIdx: 1, sonrasi: [mod(sezur, 'nuans')] }),                         // sezür (break) sonra
];

const header = { title: 'Round Trip', timeSignature: { ad: '4/4' } };

// ── 1) EXPORT ────────────────────────────────────────────────────────────────
let brf;
try {
  brf = scoreToCanonicalBrf({ ogeler, baglar: [], header, tupletler: [], options: { strictDurationCells: true } });
} catch (e) {
  console.error('EXPORT (scoreToCanonicalBrf) PATLADI:', e?.message || e);
  process.exit(1);
}
const brfText = brf?.brfText || '';

// ── 2) IMPORT ────────────────────────────────────────────────────────────────
let okuma;
try {
  okuma = brfMuzikOku(brfText);
} catch (e) {
  console.error('IMPORT (brfMuzikOku) PATLADI:', e?.message || e);
  process.exit(1);
}
const items = Array.isArray(okuma?.items) ? okuma.items : [];
const notalar = items.filter((i) => (i.type || i.tip) === 'nota' || (i.type || i.tip) === 'note');

// İmport edilen skordaki TÜM modifier adları (gerçek round-trip verisi).
const tumMods = [];
for (const n of notalar) {
  for (const m of (n.modifiers?.oncesi || [])) tumMods.push(String(m.kayit?.ad || m.ad || '').toLocaleLowerCase('tr'));
  for (const m of (n.modifiers?.sonrasi || [])) tumMods.push(String(m.kayit?.ad || m.ad || '').toLocaleLowerCase('tr'));
}
const notaAdlari = notalar.map((n) => String(n.notaAd || '').toLowerCase());
const arizalar = notalar.map((n) => String(n.accidental || ''));
const modVar = (re) => tumMods.some((a) => re.test(a));
const barlineVar = items.some((i) => /barline/i.test(String(i.type || i.tip || i.kind || ''))
  || /ölçü çizgisi|olcu cizgisi/i.test(String(i.ad || i.meaning || '')));

// ── 3) DOĞRULA — IMPORT edilen SKOR (items) beklenen öğeleri içeriyor mu ──────
const beklentiler = [
  ['8 nota',           () => notalar.length === 8],
  ['do (diyez)',       () => notaAdlari.includes('do') && arizalar.includes('sharp')],
  ['re',               () => notaAdlari.includes('re')],
  ['mi',               () => notaAdlari.includes('mi')],
  ['fa (noktalı)',     () => notalar.some((n) => n.notaAd === 'fa' && n.dotted)],
  ['fa 5. oktav',      () => notalar.some((n) => n.notaAd === 'fa' && Number(n.oktav) === 5)],
  ['sol (bemol)',      () => notaAdlari.includes('sol') && arizalar.includes('flat')],
  ['la',               () => notaAdlari.includes('la')],
  ['dinamik forte',    () => modVar(/forte/)],
  ['dinamik piyano',   () => modVar(/piyano/)],
  ['nüans stakato',    () => modVar(/stakato|staccato/)],
  ['nüans aksent',     () => modVar(/aksent|accent/)],
  ['nüans fermata',    () => modVar(/fermata/)],
  ['süsleme tril',     () => modVar(/\btril\b/)],
  ['süsleme grupeto',  () => modVar(/grupeto/)],
  ['nüans nefes',      () => modVar(/nefes/)],
  ['nüans sezür',      () => modVar(/sez(ü|u)r/)],
  ['ölçü çizgisi',     () => barlineVar],
];

let hata = 0;
const satirlar = [];
for (const [ad, kontrol] of beklentiler) {
  let ok = false;
  try { ok = !!kontrol(); } catch { ok = false; }
  if (!ok) hata += 1;
  satirlar.push(`  ${ok ? '✓' : '✗'} ${ad}`);
}

console.log('─'.repeat(60));
console.log('BRF round-trip (export → import) tutarlılık testi');
console.log('─'.repeat(60));
console.log('EXPORT BRF (' + brfText.length + ' karakter):');
console.log(brfText.split('\n').map((s) => '  ' + s).join('\n'));
console.log('\nIMPORT okunur özet:');
console.log('  ' + String(okuma?.readableText || '(boş)').replace(/\n/g, '\n  '));
console.log('\nSonuçlar:');
console.log(satirlar.join('\n'));
console.log('─'.repeat(60));

if (hata > 0) {
  console.error(`✗ ${hata}/${beklentiler.length} öğe round-trip'te KAYBOLDU/yanlış — indir/yükle tutarsız.`);
  process.exit(1);
}
console.log(`✓ ${beklentiler.length}/${beklentiler.length} öğe round-trip'i geçti — indir/yükle tutarlı.`);
process.exit(0);
