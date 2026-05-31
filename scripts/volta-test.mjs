import { muzikPlaybackListesiOlustur } from '../src/utils/music-brf/musicPlaybackHelpers.js';

let pass = 0, fail = 0;
function ok(label, cond, detail = '') {
  if (cond) { console.log(`PASS  ${label}`); pass++; }
  else       { console.log(`FAIL  ${label}${detail ? ' — ' + detail : ''}`); fail++; }
}

const mkNota = (id, notaAd) => ({ id, tip: 'nota', notaAd, oktav: 4, sureIndeksi: 1 });

// ── Test 1: standart volta sırası ─────────────────────────────────────────────
// beginRepeat → n1 → n2 → volta1 → n3 → endRepeat → volta2 → n4 → final
// Beklenen: n1 n2 n3 n1 n2 n4
{
  const ogeler = [
    { id: 'br1', tip: 'beginRepeat', ad: 'beginRepeat' },
    mkNota('n1', 'do'),
    mkNota('n2', 're'),
    { id: 'v1', tip: 'volta1', ad: '1. ev' },
    mkNota('n3', 'mi'),
    { id: 'er1', tip: 'endRepeat', ad: 'endRepeat' },
    { id: 'v2', tip: 'volta2', ad: '2. ev' },
    mkNota('n4', 'fa'),
    { id: 'fb', tip: 'finalBarline', ad: 'final' },
  ];

  const result = muzikPlaybackListesiOlustur(ogeler);
  const ids = result.map(o => o.id);
  const expected = ['n1', 'n2', 'n3', 'n1', 'n2', 'n4'];
  ok(
    'volta: do-re-mi do-re-fa',
    JSON.stringify(ids) === JSON.stringify(expected),
    `expected [${expected.join(',')}] got [${ids.join(',')}]`
  );
}

// ── Test 2: volta2 çalındıktan sonra tekrar başa dönmemeli ───────────────────
{
  const ogeler = [
    { id: 'br1', tip: 'beginRepeat', ad: 'beginRepeat' },
    mkNota('n1', 'do'),
    { id: 'v1', tip: 'volta1', ad: '1. ev' },
    mkNota('n2', 're'),
    { id: 'er1', tip: 'endRepeat', ad: 'endRepeat' },
    { id: 'v2', tip: 'volta2', ad: '2. ev' },
    mkNota('n3', 'mi'),
    { id: 'fb', tip: 'finalBarline', ad: 'final' },
  ];

  const result = muzikPlaybackListesiOlustur(ogeler);
  const ids = result.map(o => o.id);
  const expected = ['n1', 'n2', 'n1', 'n3'];
  ok(
    'volta2 then stops',
    JSON.stringify(ids) === JSON.stringify(expected),
    `expected [${expected.join(',')}] got [${ids.join(',')}]`
  );
}

// ── Test 3: volta olmadan normal tekrar hâlâ çalışıyor mu ───────────────────
{
  const ogeler = [
    { id: 'br1', tip: 'beginRepeat', ad: 'beginRepeat' },
    mkNota('n1', 'do'),
    mkNota('n2', 're'),
    { id: 'er1', tip: 'endRepeat', ad: 'endRepeat' },
    mkNota('n3', 'mi'),
  ];

  const result = muzikPlaybackListesiOlustur(ogeler);
  const ids = result.map(o => o.id);
  const expected = ['n1', 'n2', 'n1', 'n2', 'n3'];
  ok(
    'normal repeat still works',
    JSON.stringify(ids) === JSON.stringify(expected),
    `expected [${expected.join(',')}] got [${ids.join(',')}]`
  );
}

console.log(`\n${pass + fail} tests — ${pass} PASS  ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
