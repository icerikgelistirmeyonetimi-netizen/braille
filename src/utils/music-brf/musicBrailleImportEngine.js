import { SURE_GOSTERGELERI } from '../../data/muzik.js';
import { muzikTimeSignatureHucreleri } from '../music/musicHeaderEngine.js';
import { muzikTimeSigExpected16 } from '../music/musicDuration.js';
import { MUZIK_UST_RAKAM, MUZIK_ALT_RAKAM } from '../music/musicConstants.js';

function yeniId(prefix, index) {
  return `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
}

function sureIndeksiBul(sureAd) {
  const hedef = String(sureAd || '').toLowerCase();

  const idx = SURE_GOSTERGELERI.findIndex((sure) => {
    const ad = String(sure.ad || '').toLowerCase();
    return ad === hedef || ad.includes(hedef) || hedef.includes(ad);
  });

  return idx >= 0 ? idx : 0;
}

function timeSignatureHazirla(adVeyaKayit) {
  if (!adVeyaKayit) return null;

  const ad = typeof adVeyaKayit === 'string'
    ? adVeyaKayit
    : (adVeyaKayit.ad || adVeyaKayit.gorunum);

  if (!ad) return null;

  return {
    ad,
    gorunum: ad,
    expectedDuration16: muzikTimeSigExpected16(ad),
    hucreler: muzikTimeSignatureHucreleri(ad),
  };
}

function hucreKey(hucre) {
  return Array.isArray(hucre)
    ? [...hucre].sort((a, b) => a - b).join('')
    : '';
}

function hucreEsitMi(a, b) {
  return hucreKey(a) === hucreKey(b);
}

const NUMBER_SIGN = [3, 4, 5, 6];

// LEGACY / INCOMPLETE:
// Bu eski cells-to-token hattında NOTE_CELL_TO_NAME placeholder durumundadır.
// Ana BRF import yolu brfMuzikOku reader mekanizmasıdır.
const NOTE_CELL_TO_NAME = {
  // Ornekler mevcut sistemden dogrulanmali:
  // '145': 're',
  // '15': 'do',
};

const UPPER_NUMBER_CELL_TO_DIGIT = Object.fromEntries(
  Object.entries(MUZIK_UST_RAKAM || {}).map(([digit, cell]) => [hucreKey(cell), digit]),
);

const LOWER_NUMBER_CELL_TO_DIGIT = Object.fromEntries(
  Object.entries(MUZIK_ALT_RAKAM || {}).map(([digit, cell]) => [hucreKey(cell), digit]),
);

function parseTimeSignature(cells, index) {
  if (!hucreEsitMi(cells[index], NUMBER_SIGN)) {
    return null;
  }

  const upper = UPPER_NUMBER_CELL_TO_DIGIT[hucreKey(cells[index + 1])];
  const lower = LOWER_NUMBER_CELL_TO_DIGIT[hucreKey(cells[index + 2])];

  if (!upper || !lower) return null;

  const ad = `${upper}/${lower}`;

  return {
    token: {
      type: 'timeSignature',
      ad,
      cells: cells.slice(index, index + 3),
    },
    nextIndex: index + 3,
  };
}

// LEGACY FALLBACK:
// LEGACY / INCOMPLETE:
// Bu eski cells-to-token hattında NOTE_CELL_TO_NAME placeholder durumundadır.
// Ana BRF import yolu brfMuzikOku reader mekanizmasıdır.
function parseNote(cells, index) {
  const key = hucreKey(cells[index]);
  const notaAd = NOTE_CELL_TO_NAME[key];

  if (!notaAd) return null;

  return {
    token: {
      type: 'note',
      notaAd,
      octave: 4,
      sureAd: 'dortluk',
      cells: [cells[index]],
    },
    nextIndex: index + 1,
  };
}

export function muzikBrailleCellsToTokens(cells = []) {
  const tokens = [];
  let i = 0;

  while (i < cells.length) {
    const timeSig = parseTimeSignature(cells, i);
    if (timeSig) {
      tokens.push(timeSig.token);
      i = timeSig.nextIndex;
      continue;
    }

    const note = parseNote(cells, i);
    if (note) {
      tokens.push(note.token);
      i = note.nextIndex;
      continue;
    }

    tokens.push({
      type: 'unknown',
      cell: cells[i],
    });

    i += 1;
  }

  return tokens;
}

function tokenNotaOgesi(token, index, refMap) {
  const id = token.id || yeniId('import-note', index);

  if (token.id) {
    refMap.set(token.id, id);
  }

  return {
    id,
    tip: 'nota',
    notaAd: token.notaAd || 're',
    oktav: token.oktav ?? token.octave ?? 4,
    sureIndeksi: sureIndeksiBul(token.sureAd || token.sure || 'dortluk'),
    accidental: token.accidental || null,
    dotted: Boolean(token.dotted),
  };
}

function tokenSusOgesi(token, index, refMap) {
  const id = token.id || yeniId('import-rest', index);

  if (token.id) {
    refMap.set(token.id, id);
  }

  const sureIndeksi = sureIndeksiBul(token.sureAd || token.sure || 'dortluk');
  const sure = SURE_GOSTERGELERI[sureIndeksi];

  return {
    id,
    tip: 'sus',
    ad: token.ad || `${token.sureAd || 'dortluk'} sus`,
    sureIndeksi,
    realValue: token.realValue || sure?.realValue || 4,
    dotted: Boolean(token.dotted),
    hucreler: token.hucreler || [],
  };
}

function tokenBarlineOgesi(token, index) {
  const tip = token.type === 'sectionalBarline'
    ? 'sectionalBarline'
    : token.type === 'finalBarline'
      ? 'finalBarline'
      : token.type === 'beginRepeat'
        ? 'beginRepeat'
        : token.type === 'endRepeat'
          ? 'endRepeat'
          : (token.tip || 'barline');

  return {
    id: token.id || yeniId('import-barline', index),
    tip,
    kind: token.kind || 'manual',
    auto: false,
    autoBarline: false,
    otomatikOlcuCizgisi: false,
    ad: token.ad || 'Manuel olcu cizgisi',
    gorunum: token.gorunum || '|',
    hucreler: Array.isArray(token.hucreler)
      ? token.hucreler
      : tip === 'barline'
        ? [[]]
        : [],
  };
}

function tokenTimeSignatureChangeOgesi(token, index) {
  const ts = timeSignatureHazirla(token.ad || token.gorunum || '4/4');

  return {
    id: token.id || yeniId('import-time', index),
    tip: 'timeSignatureChange',
    ad: ts.ad,
    gorunum: ts.gorunum,
    hucreler: ts.hucreler,
    timeSignature: ts,
  };
}

function tokenKeySignatureChangeOgesi(token, index) {
  return {
    id: token.id || yeniId('import-key', index),
    tip: 'keySignatureChange',
    ad: token.ad || 'Donanim degisimi',
    gorunum: token.gorunum || token.sembol || token.ad || '',
    hucreler: token.hucreler || [],
    keySignature: {
      ad: token.ad || 'Donanim degisimi',
      gorunum: token.gorunum || token.sembol || token.ad || '',
      hucreler: token.hucreler || [],
    },
  };
}

function bagTokenHazirla(token, index, refMap) {
  const basId = refMap.get(token.basRef) || token.basId;
  const sonId = refMap.get(token.sonRef) || token.sonId;

  const notaIdler = Array.isArray(token.notaRefler)
    ? token.notaRefler.map((ref) => refMap.get(ref)).filter(Boolean)
    : [basId, sonId].filter(Boolean);

  return {
    id: token.id || yeniId(`import-${token.type || 'bag'}`, index),
    tip: token.type === 'tie' ? 'tie' : 'slur',
    mode: token.mode || 'single',
    basId,
    sonId,
    notaIdler,
    kayit: {
      ad: token.type === 'tie'
        ? 'Tie / uzatma bagi'
        : 'Slur / legato bagi',
      tip: token.type === 'tie' ? 'tie' : 'slur',
      hucreler: token.hucreler || [],
    },
  };
}

export function muzikBrailleTokensToScore(tokens = []) {
  const refMap = new Map();

  let headerTimeSignature = null;
  let headerKeySignature = null;

  const ogeler = [];
  const baglar = [];

  tokens.forEach((token, index) => {
    if (!token) return;

    if (token.type === 'clef') {
      return;
    }

    if (token.type === 'timeSignature') {
      if (!headerTimeSignature) {
        headerTimeSignature = timeSignatureHazirla(token.ad || token.gorunum);
      } else {
        ogeler.push(tokenTimeSignatureChangeOgesi({
          ...token,
          type: 'timeSignatureChange',
        }, index));
      }

      return;
    }

    if (token.type === 'keySignature') {
      headerKeySignature = {
        ad: token.ad || 'Donanim',
        gorunum: token.gorunum || token.sembol || token.ad || '',
        hucreler: token.hucreler || [],
      };

      return;
    }

    if (token.type === 'note') {
      ogeler.push(tokenNotaOgesi(token, index, refMap));
      return;
    }

    if (token.type === 'rest') {
      ogeler.push(tokenSusOgesi(token, index, refMap));
      return;
    }

    if (
      token.type === 'barline'
      || token.type === 'sectionalBarline'
      || token.type === 'finalBarline'
      || token.type === 'beginRepeat'
      || token.type === 'endRepeat'
    ) {
      ogeler.push(tokenBarlineOgesi(token, index));
      return;
    }

    if (token.type === 'timeSignatureChange') {
      ogeler.push(tokenTimeSignatureChangeOgesi(token, index));
      return;
    }

    if (token.type === 'keySignatureChange') {
      ogeler.push(tokenKeySignatureChangeOgesi(token, index));
      return;
    }

    if (token.type === 'tie' || token.type === 'slur') {
      baglar.push(bagTokenHazirla(token, index, refMap));
      return;
    }

    ogeler.push({
      id: yeniId('import-unknown', index),
      tip: 'isaret',
      ad: 'Bilinmeyen Braille token',
      gorunum: '?',
      hucreler: token.hucreler || (token.cell ? [token.cell] : []),
      kaynakToken: token,
    });
  });

  return {
    header: {
      title: '',
      composer: '',
      tempo: '',
      keySignature: headerKeySignature,
      timeSignature: headerTimeSignature || timeSignatureHazirla('4/4'),
      autoCompleteMeasures: true,
      pickupMeasure: false,
    },
    ogeler,
    baglar,
    tupletler: [],
    tokens,
  };
}

export function muzikBrailleCellsToScore(cells = []) {
  const tokens = muzikBrailleCellsToTokens(cells);
  return muzikBrailleTokensToScore(tokens);
}

export function unicodeBrailleToCells(text) {
  return Array.from(String(text || ''))
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x2800 && code <= 0x28ff;
    })
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0x2800;
      const dots = [];

      for (let i = 0; i < 8; i += 1) {
        if (code & (1 << i)) {
          dots.push(i + 1);
        }
      }

      return dots;
    });
}
