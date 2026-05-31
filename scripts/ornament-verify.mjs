import { muzikPlaybackEventListesiOlustur } from '../src/utils/music-brf/musicPlaybackHelpers.js';

let pass = 0, fail = 0;

function ok(label, cond, detail = '') {
  if (cond) { console.log(`PASS  ${label}`); pass++; }
  else       { console.log(`FAIL  ${label}${detail ? ' — ' + detail : ''}`); fail++; }
}

function nota(id, notaAd, oktav, ornamentAd) {
  return {
    id, tip: 'nota', notaAd, oktav, sureIndeksi: 1,
    modifiers: { oncesi: [{ kayit: { ad: ornamentAd } }] },
  };
}

function events(ogeler) {
  return muzikPlaybackEventListesiOlustur({ ogeler, baglar: [], muzikHeader: {} });
}

// ── 1. trill ──────────────────────────────────────────────────────────────────
{
  const ev = events([nota('n1', 'sol', 4, 'trill')]);
  ok('trill expands to >2 events', ev.length > 2, `got ${ev.length}`);
  const names = ev.map(e => e.oge?.notaAd);
  ok('trill alternates sol/la', names.every(n => n === 'sol' || n === 'la'), names.join(' '));
  const total = ev.reduce((s, e) => s + e.durationBeats, 0);
  ok('trill total duration = 1 beat', Math.abs(total - 1) < 0.001, `got ${total}`);
}

// ── 2. uzun appoggiatura ──────────────────────────────────────────────────────
{
  const ev = events([nota('n2', 'sol', 4, 'uzun appoggiatura')]);
  ok('uzun appoggiatura = 2 events', ev.length === 2, `got ${ev.length}`);
  ok('grace note = la (diatonic step above sol)', ev[0]?.oge?.notaAd === 'la');
  ok('grace note = half duration (0.5)', Math.abs(ev[0]?.durationBeats - 0.5) < 0.001, `got ${ev[0]?.durationBeats}`);
  ok('main note = half duration (0.5)', Math.abs(ev[1]?.durationBeats - 0.5) < 0.001, `got ${ev[1]?.durationBeats}`);
  ok('main note still sol', ev[1]?.oge?.notaAd === 'sol');
}

// ── 3. kısa appoggiatura ──────────────────────────────────────────────────────
{
  const ev = events([nota('n3', 'sol', 4, 'kısa appoggiatura')]);
  ok('kısa appoggiatura = 2 events', ev.length === 2, `got ${ev.length}`);
  ok('grace beat < main beat', ev[0]?.durationBeats < ev[1]?.durationBeats);
  const total = ev.reduce((s, e) => s + e.durationBeats, 0);
  ok('kısa total = 1 beat', Math.abs(total - 1) < 0.001, `got ${total}`);
}

// ── 4. üst mordent: sol → la → sol ───────────────────────────────────────────
{
  const ev = events([nota('n4', 'sol', 4, 'üst mordent')]);
  ok('üst mordent = 3 events', ev.length === 3, `got ${ev.length}`);
  const names = ev.map(e => e.oge?.notaAd);
  ok('üst mordent pattern sol→la→sol', names[0]==='sol' && names[1]==='la' && names[2]==='sol', names.join('→'));
}

// ── 5. alt mordent: sol → fa → sol ───────────────────────────────────────────
{
  const ev = events([nota('n5', 'sol', 4, 'alt mordent')]);
  ok('alt mordent = 3 events', ev.length === 3, `got ${ev.length}`);
  const names = ev.map(e => e.oge?.notaAd);
  ok('alt mordent pattern sol→fa→sol', names[0]==='sol' && names[1]==='fa' && names[2]==='sol', names.join('→'));
}

// ── 6. diatonic edge: mi → fa (not fa#) ──────────────────────────────────────
{
  const ev = events([nota('n6', 'mi', 4, 'üst mordent')]);
  const upper = ev[1]?.oge;
  ok('mi upper neighbor = fa (not fa#)', upper?.notaAd === 'fa' && upper?.accidental === 'natural',
     `got ${upper?.notaAd} ${upper?.accidental}`);
}

// ── 7. turn (üst→ana→alt→ana): la→sol→fa→sol ─────────────────────────────────
{
  const ev = events([nota('n7', 'sol', 4, 'turn (notalar arası)')]);
  ok('turn = 4 events', ev.length === 4, `got ${ev.length}`);
  const names = ev.map(e => e.oge?.notaAd);
  ok('turn pattern la→sol→fa→sol', names[0]==='la' && names[1]==='sol' && names[2]==='fa' && names[3]==='sol', names.join('→'));
}

// ── 8. ters turn (alt→ana→üst→ana): fa→sol→la→sol ────────────────────────────
{
  const ev = events([nota('n8', 'sol', 4, 'ters turn (notalar arası)')]);
  ok('ters turn = 4 events', ev.length === 4, `got ${ev.length}`);
  const names = ev.map(e => e.oge?.notaAd);
  ok('ters turn pattern fa→sol→la→sol', names[0]==='fa' && names[1]==='sol' && names[2]==='la' && names[3]==='sol', names.join('→'));
}

// ── 9. plain note unchanged ───────────────────────────────────────────────────
{
  const ev = events([{ id: 'n9', tip: 'nota', notaAd: 'sol', oktav: 4, sureIndeksi: 1 }]);
  ok('plain note = 1 event', ev.length === 1, `got ${ev.length}`);
  ok('plain note is sol', ev[0]?.oge?.notaAd === 'sol');
}

// ── 10. playbackOgeId tracking: expanded events use original id ───────────────
{
  const ev = events([nota('main1', 'sol', 4, 'trill')]);
  ok('original note id present', ev.some(e => e.id === 'main1'));
}

console.log(`\n${pass + fail} tests — ${pass} PASS  ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
