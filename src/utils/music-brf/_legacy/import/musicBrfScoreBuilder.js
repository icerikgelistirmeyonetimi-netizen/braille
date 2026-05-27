import { SURE_GOSTERGELERI } from '../../../data/muzik.js';

import {
  muzikTimeSignatureHucreleri,
} from '../../music/musicHeaderEngine.js';

import {
  muzikTimeSigExpected16,
} from '../../music/musicDuration.js';

function yeniId(prefix, index) {
  return `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function sureIndeksiBulByRealValue(realValue) {
  const idx = SURE_GOSTERGELERI.findIndex((s) => Number(s.realValue) === Number(realValue));
  return idx >= 0 ? idx : 0;
}

function timeSignatureOlustur(ad = '4/4') {
  return {
    ad,
    gorunum: ad,
    expectedDuration16: muzikTimeSigExpected16(ad),
    hucreler: muzikTimeSignatureHucreleri(ad),
  };
}

function noteTokenToOge(token, index) {
  return {
    id: yeniId('brf-note', index),
    tip: 'nota',
    notaAd: token.notaAd || 're',
    oktav: token.oktav ?? 4,
    sureIndeksi: Number.isInteger(token.sureIndeksi)
      ? token.sureIndeksi
      : sureIndeksiBulByRealValue(token.realValue || 4),
    accidental: token.accidental || null,
    dotted: Boolean(token.dotted),
    kaynakToken: token,
  };
}

function restTokenToOge(token, index) {
  return {
    id: yeniId('brf-rest', index),
    tip: 'sus',
    ad: token.sureAd || 'BRF sus',
    sureIndeksi: Number.isInteger(token.sureIndeksi)
      ? token.sureIndeksi
      : sureIndeksiBulByRealValue(token.realValue || 4),
    realValue: token.realValue || 4,
    dotted: Boolean(token.dotted),
    kaynakToken: token,
  };
}

function timeSignatureChangeTokenToOge(token, index) {
  const ts = timeSignatureOlustur(token.ad || token.value || '4/4');

  return {
    id: yeniId('brf-time', index),
    tip: 'timeSignatureChange',
    ad: ts.ad,
    gorunum: ts.gorunum,
    hucreler: ts.hucreler,
    timeSignature: ts,
    kaynakToken: token,
  };
}

function keySignatureChangeTokenToOge(token, index) {
  return {
    id: yeniId('brf-key', index),
    tip: 'keySignatureChange',
    ad: token.ad || 'Donanim degisimi',
    gorunum: token.gorunum || '',
    hucreler: token.hucreler || [],
    keySignature: {
      ad: token.ad || 'Donanim degisimi',
      gorunum: token.gorunum || '',
      hucreler: token.hucreler || [],
    },
    kaynakToken: token,
  };
}

function barlineTokenToOge(token, index) {
  const tipMap = {
    beginRepeat: 'beginRepeat',
    endRepeat: 'endRepeat',
    sectionalBarline: 'sectionalBarline',
    finalBarline: 'finalBarline',
  };

  const tip = tipMap[token.type] || 'barline';

  const gorunumMap = {
    beginRepeat: '𝄆',
    endRepeat: '𝄇',
    sectionalBarline: '𝄁',
    finalBarline: '𝄂',
    barline: '|',
  };

  const adMap = {
    beginRepeat: 'Tekrar baslangici',
    endRepeat: 'Tekrar sonu',
    sectionalBarline: 'Bolum sonu cizgisi',
    finalBarline: 'Bitis cizgisi',
    barline: 'Manuel olcu cizgisi',
  };

  return {
    id: yeniId('brf-barline', index),
    tip,
    kind: 'manual',
    auto: false,
    autoBarline: false,
    otomatikOlcuCizgisi: false,
    ad: adMap[tip] || adMap.barline,
    gorunum: gorunumMap[tip] || '|',
    hucreler: token.cells || (tip === 'barline' ? [[]] : []),
    kaynakToken: token,
  };
}

function bagOlustur({ type, basId, sonId, index, token }) {
  return {
    id: yeniId(`brf-${type}`, index),
    tip: type,
    mode: 'single',
    basId,
    sonId,
    notaIdler: [basId, sonId].filter(Boolean),
    kayit: {
      tip: type,
      ad: type === 'tie' ? 'Tie / uzatma bagi' : 'Slur / legato bagi',
      hucreler: token?.cells || (type === 'tie' ? [[4], [1, 4]] : [[1, 4]]),
    },
  };
}

function ayniSesMi(a, b) {
  return (
    a?.tip === 'nota'
    && b?.tip === 'nota'
    && a.notaAd === b.notaAd
    && (a.oktav ?? 4) === (b.oktav ?? 4)
    && (a.accidental || null) === (b.accidental || null)
  );
}

export function buildScoreFromBrfTokens(tokens = []) {
  const ogeler = [];
  const baglar = [];
  const warnings = [];

  let headerTimeSignature = null;
  let headerKeySignature = null;

  let lastNote = null;
  let pendingTieFrom = null;
  let pendingSlurFrom = null;

  tokens.forEach((token, index) => {
    if (!token) return;

    if (
      token.type === 'layoutSpace'
      || token.type === 'lineStartMarker'
      || token.type === 'layoutMarker'
      || token.type === 'numberSign'
      || token.type === 'octave'
      || token.type === 'accidental'
      || token.type === 'clef'
    ) {
      return;
    }

    if (token.type === 'timeSignature') {
      if (!headerTimeSignature) {
        headerTimeSignature = timeSignatureOlustur(token.ad || token.value || '4/4');
      } else {
        ogeler.push(timeSignatureChangeTokenToOge(token, index));
      }

      return;
    }

    if (token.type === 'keySignature') {
      if (!headerKeySignature) {
        headerKeySignature = {
          ad: token.ad || 'Donanim',
          gorunum: token.gorunum || '',
          hucreler: token.hucreler || [],
        };
      } else {
        ogeler.push(keySignatureChangeTokenToOge(token, index));
      }

      return;
    }

    if (
      token.type === 'beginRepeat'
      || token.type === 'endRepeat'
      || token.type === 'sectionalBarline'
      || token.type === 'finalBarline'
    ) {
      ogeler.push(barlineTokenToOge(token, index));
      return;
    }

    if (token.type === 'note') {
      const note = noteTokenToOge(token, index);
      ogeler.push(note);

      if (pendingTieFrom) {
        if (!ayniSesMi(pendingTieFrom, note)) {
          warnings.push({
            type: 'brf-import-tie-pitch-warning',
            message: 'BRF icinde tie isareti bulundu ancak iki nota ayni ses degil.',
          });
        }

        baglar.push(
          bagOlustur({
            type: 'tie',
            basId: pendingTieFrom.id,
            sonId: note.id,
            index,
            token,
          }),
        );

        pendingTieFrom = null;
      }

      if (pendingSlurFrom) {
        baglar.push(
          bagOlustur({
            type: 'slur',
            basId: pendingSlurFrom.id,
            sonId: note.id,
            index,
            token,
          }),
        );

        pendingSlurFrom = null;
      }

      lastNote = note;
      return;
    }

    if (token.type === 'rest') {
      ogeler.push(restTokenToOge(token, index));
      return;
    }

    if (token.type === 'tieMarker') {
      if (!lastNote) {
        warnings.push({
          type: 'brf-import-tie-warning',
          message: 'Tie isareti bulundu ama oncesinde nota yok.',
        });
      } else {
        pendingTieFrom = lastNote;
      }

      return;
    }

    if (token.type === 'slurMarker') {
      if (!lastNote) {
        warnings.push({
          type: 'brf-import-slur-warning',
          message: 'Slur isareti bulundu ama oncesinde nota yok.',
        });
      } else {
        pendingSlurFrom = lastNote;
      }

      return;
    }

    if (token.type === 'unknown') {
      warnings.push({
        type: 'brf-import-unknown-token',
        message: `Cozumlenemeyen token: ${token.key || token.type}`,
        token,
      });

      ogeler.push({
        id: yeniId('brf-unknown', index),
        tip: 'isaret',
        ad: 'Cozumlenemeyen Braille hucresi',
        gorunum: '?',
        hucreler: token.cell ? [token.cell] : token.cells || [],
        kaynakToken: token,
      });
    }
  });

  return {
    header: {
      title: '',
      composer: '',
      tempo: '',
      keySignature: headerKeySignature,
      timeSignature: headerTimeSignature || timeSignatureOlustur('4/4'),
      autoCompleteMeasures: false,
      pickupMeasure: false,
      importedFromBrf: true,
    },
    ogeler,
    baglar,
    tupletler: [],
    warnings,
    tokens,
  };
}
