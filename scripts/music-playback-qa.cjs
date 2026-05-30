async function main() {
  const {
    muzikPlaybackListesiOlustur,
    muzikPlaybackEventListesiOlustur,
    playbackEventDurationMsAl,
    muzikSureBeatAl,
  } = await import('../src/utils/music-brf/musicPlaybackHelpers.js');

  function check(testName, items, expectedIds) {
    const list = muzikPlaybackListesiOlustur(items);
    const actual = list.map((oge) => oge.id || `${oge.type || oge.tip}-${oge.notaAd || oge.sureAd || oge.ad || 'x'}`);
    const pass = JSON.stringify(actual) === JSON.stringify(expectedIds);
    console.log(`${pass ? 'PASS' : 'FAIL'} ${testName}`);
    if (!pass) {
      console.log('  expected:', expectedIds);
      console.log('  actual:  ', actual);
      console.log('  raw:     ', JSON.stringify(list, null, 2));
    }
    return pass;
  }

  function checkEq(testName, actual, expected) {
    const pass = Object.is(actual, expected);
    console.log(`${pass ? 'PASS' : 'FAIL'} ${testName}`);
    if (!pass) {
      console.log('  expected:', expected);
      console.log('  actual:  ', actual);
    }
    return pass;
  }

  let allPass = true;

  allPass &= check('repeat with explicit begin/end', [
    { id: 'A', tip: 'nota' },
    { id: 'b', tip: 'beginRepeat', type: 'beginRepeat' },
    { id: 'B', tip: 'nota' },
    { id: 'C', tip: 'nota' },
    { id: 'e', tip: 'endRepeat', type: 'endRepeat' },
    { id: 'D', tip: 'nota' },
  ], ['A', 'B', 'C', 'B', 'C', 'D']);

  allPass &= check('end without begin repeats from start', [
    { id: 'A', tip: 'nota' },
    { id: 'B', tip: 'nota' },
    { id: 'e', tip: 'endRepeat', type: 'endRepeat' },
    { id: 'C', tip: 'nota' },
  ], ['A', 'B', 'A', 'B', 'C']);

  allPass &= check('final stops playback', [
    { id: 'A', tip: 'nota' },
    { id: 'f', tip: 'finalBarline', type: 'finalBarline' },
    { id: 'B', tip: 'nota' },
  ], ['A']);

  allPass &= check('begin repeat at start', [
    { id: 'b', tip: 'beginRepeat', type: 'beginRepeat' },
    { id: 'A', tip: 'nota' },
    { id: 'e', tip: 'endRepeat', type: 'endRepeat' },
    { id: 'f', tip: 'finalBarline', type: 'finalBarline' },
  ], ['A', 'A']);

  allPass &= checkEq('duration dörtlük 1 beat @120 = 500ms', playbackEventDurationMsAl({ durationBeats: 1 }, 120), 500);
  allPass &= checkEq('duration sekizlik 0.5 beat @120 = 250ms', playbackEventDurationMsAl({ durationBeats: 0.5 }, 120), 250);
  allPass &= checkEq('duration onaltılık 0.25 beat @120 = 125ms', playbackEventDurationMsAl({ durationBeats: 0.25 }, 120), 125);
  allPass &= checkEq('duration ikilik 2 beat @120 = 1000ms', playbackEventDurationMsAl({ durationBeats: 2 }, 120), 1000);

  const susEtkinlikleri = muzikPlaybackEventListesiOlustur({
    ogeler: [{ id: 'R1', tip: 'sus', sureIndeksi: 1 }],
    baglar: [],
    muzikHeader: {},
  });
  const susEvent = susEtkinlikleri[0];
  allPass &= checkEq('sus event exists', Boolean(susEvent), true);
  allPass &= checkEq('sus event tip', susEvent?.tip, 'sus');
  allPass &= checkEq('sus event play false', susEvent?.play, false);
  allPass &= checkEq('sus dörtlük durationBeats = 1', susEvent?.durationBeats, 1);
  allPass &= checkEq('sus duration @120 = 500ms', playbackEventDurationMsAl(susEvent, 120), 500);

  const dordlukNota = { id: 'N1', tip: 'nota', sureIndeksi: 1 };
  allPass &= checkEq(
    'durationBeats has priority over oge duration',
    playbackEventDurationMsAl({ durationBeats: 2, oge: dordlukNota }, 120),
    1000,
  );

  const tieEvents = muzikPlaybackEventListesiOlustur({
    ogeler: [
      { id: 'T1', tip: 'nota', notaAd: 'do', oktav: 4, sureIndeksi: 1 },
      { id: 'T2', tip: 'nota', notaAd: 'do', oktav: 4, sureIndeksi: 1 },
    ],
    baglar: [{ id: 'B1', tip: 'tie', notaIdler: ['T1', 'T2'] }],
    muzikHeader: {},
  });
  const tieEvent = tieEvents[0];
  allPass &= checkEq('tie merged event exists', Boolean(tieEvent), true);
  allPass &= checkEq('tie merged durationBeats = 2', tieEvent?.durationBeats, 2);
  allPass &= checkEq('tie merged duration @120 = 1000ms', playbackEventDurationMsAl(tieEvent, 120), 1000);

  allPass &= checkEq('dörtlük noktalı beat = 1.5', muzikSureBeatAl({ tip: 'nota', sureIndeksi: 1, dotted: true }), 1.5);
  allPass &= checkEq('dörtlük noktalı @120 = 750ms', playbackEventDurationMsAl({ oge: { tip: 'nota', sureIndeksi: 1, dotted: true } }, 120), 750);
  allPass &= checkEq('dörtlük çift noktalı beat = 1.75', muzikSureBeatAl({ tip: 'nota', sureIndeksi: 1, doubleDotted: true }), 1.75);
  allPass &= checkEq('dörtlük çift noktalı @120 = 875ms', playbackEventDurationMsAl({ oge: { tip: 'nota', sureIndeksi: 1, doubleDotted: true } }, 120), 875);
  allPass &= checkEq('sekizlik noktalı @120 = 375ms', playbackEventDurationMsAl({ oge: { tip: 'nota', sureIndeksi: 0, dotted: true } }, 120), 375);
  allPass &= checkEq('nokta=true works (single dot)', muzikSureBeatAl({ tip: 'nota', sureIndeksi: 1, nokta: true }), 1.5);
  allPass &= checkEq('noktali=true works (single dot)', muzikSureBeatAl({ tip: 'nota', sureIndeksi: 1, noktali: true }), 1.5);
  allPass &= checkEq('dots=2 works (double dot)', muzikSureBeatAl({ tip: 'nota', sureIndeksi: 1, dots: 2 }), 1.75);

  if (!allPass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
