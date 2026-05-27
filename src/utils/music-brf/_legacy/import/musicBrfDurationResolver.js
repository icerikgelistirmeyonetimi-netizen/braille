import {
  muzikTimeSigExpected16,
} from '../../music/musicDuration.js';

function sure16(candidate) {
  if (!candidate?.realValue) return 0;

  let value = 16 / candidate.realValue;

  if (candidate.dotted) value *= 1.5;

  return value;
}

function adayTemelPuani(candidate) {
  if (candidate.realValue === 4) return 120;
  if (candidate.realValue === 8) return 105;
  if (candidate.realValue === 2) return 90;
  if (candidate.realValue === 1) return 80;

  if (candidate.realValue === 16) return 45;
  if (candidate.realValue === 32) return 30;
  if (candidate.realValue === 64) return 15;
  if (candidate.realValue === 128) return 5;

  return 0;
}

function adayEkPuani(candidate, index, toplamAdaySayisi) {
  let score = adayTemelPuani(candidate);

  if (index === 0 && candidate.realValue >= 16) {
    score -= 35;
  }

  if (toplamAdaySayisi <= 6 && candidate.realValue >= 16) {
    score -= 50;
  }

  if (candidate.dotted) {
    score -= 5;
  }

  return score;
}

function normalizeCandidates(candidates = []) {
  const seen = new Set();

  return candidates
    .filter((c) => c && c.realValue)
    .filter((c) => {
      const key = [
        c.notaAd || '',
        c.realValue,
        c.sureIndeksi,
        c.oktav ?? '',
        c.accidental || '',
        c.dotted ? 'dot' : '',
      ].join('|');

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function olasiCozumleriBul(candidateEvents, expected16) {
  const results = [];

  function walk(index, total16, selected, score) {
    if (index >= candidateEvents.length) {
      results.push({
        selected,
        total16,
        score: score + (Math.abs(total16 - expected16) < 0.0001 ? 500 : 0),
        exact: Math.abs(total16 - expected16) < 0.0001,
      });
      return;
    }

    const event = candidateEvents[index];
    const candidates = normalizeCandidates(event.candidates);

    candidates.forEach((candidate) => {
      const value16 = sure16(candidate);
      if (value16 <= 0) return;

      const nextTotal = total16 + value16;

      if (nextTotal > expected16 + 0.0001) return;

      const nextScore = score + adayEkPuani(
        candidate,
        index,
        candidateEvents.length,
      );

      walk(
        index + 1,
        nextTotal,
        [
          ...selected,
          {
            event,
            selected: candidate,
            sure16: value16,
          },
        ],
        nextScore,
      );
    });
  }

  walk(0, 0, [], 0);

  return results.sort((a, b) => {
    if (a.exact !== b.exact) return a.exact ? -1 : 1;
    return b.score - a.score;
  });
}

function fallbackCoz(candidateEvents) {
  return candidateEvents.map((event) => {
    const candidates = normalizeCandidates(event.candidates);

    const selected =
      candidates.find((c) => c.realValue === 4) ||
      candidates.find((c) => c.realValue === 8) ||
      candidates[0];

    return {
      event,
      selected,
      sure16: sure16(selected),
    };
  });
}

function resolveMeasure(measure, expected16) {
  const candidateEvents = [
    ...(measure.noteCandidates || []).map((item) => ({
      kind: 'note',
      token: item.token,
      candidates: item.candidates,
    })),
    ...(measure.restCandidates || []).map((item) => ({
      kind: 'rest',
      token: item.token,
      candidates: item.candidates,
    })),
  ].sort((a, b) => a.token.cellIndex - b.token.cellIndex);

  const warnings = [];

  if (!candidateEvents.length) {
    return {
      ...measure,
      events: [],
      total16: 0,
      expected16,
      warnings: measure.warnings || [],
    };
  }

  const cozumler = olasiCozumleriBul(candidateEvents, expected16);

  const enIyi = cozumler[0];

  const selectedEvents = enIyi?.selected?.length
    ? enIyi.selected
    : fallbackCoz(candidateEvents);

  const total16 = selectedEvents.reduce((sum, item) => sum + item.sure16, 0);

  if (Math.abs(total16 - expected16) > 0.0001) {
    warnings.push({
      type: 'measure-duration-warning',
      message: `Olcu toplami ${total16}/${expected16}. Sure cozumu kesin degil.`,
      total16,
      expected16,
      measure,
    });
  }

  const events = selectedEvents.map((item) => ({
    type: item.event.kind,
    token: item.event.token,
    selected: item.selected,
    sure16: item.sure16,
  }));

  return {
    ...measure,
    events,
    total16,
    expected16,
    durationSolution: enIyi || null,
    warnings: [
      ...(measure.warnings || []),
      ...warnings,
    ],
  };
}

function measureTimeSignatureFromSymbols(measure) {
  const candidates = [
    ...(measure.symbols || []),
    ...(measure.tokens || []),
  ];

  for (const item of candidates) {
    const token = item?.token || item;

    if (token?.type === 'timeSignature') {
      return token.ad || token.value || token.gorunum || null;
    }

    if (item?.type === 'timeSignature') {
      return item.ad || item.value || item.gorunum || null;
    }
  }

  return null;
}

export function resolveBrfDurations({ ir, header }) {
  const warnings = [];

  let activeTimeSig = header?.timeSignature?.ad || header?.timeSignature?.gorunum || '4/4';
  let activeExpected16 = muzikTimeSigExpected16(activeTimeSig) || 16;

  const lines = (ir.lines || []).map((line) => {
    if (line.type !== 'music-line') {
      return line;
    }

    return {
      ...line,
      measures: (line.measures || []).map((measure) => {
        const measureTimeSig = measureTimeSignatureFromSymbols(measure);

        if (measureTimeSig) {
          activeTimeSig = measureTimeSig;
          activeExpected16 = muzikTimeSigExpected16(activeTimeSig) || activeExpected16 || 16;
        }

        const resolved = resolveMeasure(
          {
            ...measure,
            activeTimeSignature: activeTimeSig,
          },
          activeExpected16,
        );

        warnings.push(...(resolved.warnings || []));

        return {
          ...resolved,
          activeTimeSignature: activeTimeSig,
          expected16: activeExpected16,
        };
      }),
    };
  });

  return {
    ir: {
      ...ir,
      lines,
    },
    warnings,
  };
}

// Legacy export kept for compatibility with older imports.
export function resolveBrfTokenDurations(tokens = []) {
  return tokens;
}
