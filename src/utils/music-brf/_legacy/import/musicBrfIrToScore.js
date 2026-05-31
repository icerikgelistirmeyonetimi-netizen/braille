import {
  muzikTimeSigExpected16,
} from '../../music/musicDuration.js';

import {
  muzikTimeSignatureHucreleri,
} from '../../music/musicHeaderEngine.js';

import {
  muzikNotaSkorOgesi,
  muzikSusSkorOgesi,
} from '../../music/musicScoreFactory.js';

function yeniId(prefix, index) {
  return `${prefix}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`;
}

function timeSignatureOlustur(ad = '4/4') {
  return {
    ad,
    gorunum: ad,
    expectedDuration16: muzikTimeSigExpected16(ad),
    hucreler: muzikTimeSignatureHucreleri(ad),
  };
}

function noteEventToOge(event, index) {
  const selected = event.selected;
  const id = yeniId('brf-note', index);
  const oge = muzikNotaSkorOgesi(
    id,
    selected.notaAd,
    selected.sureIndeksi,
    {
      oktav: selected.oktav ?? 4,
      accidental: selected.accidental || null,
      dotted: Boolean(selected.dotted),
    },
  );

  return {
    ...oge,
    kaynakToken: event.token,
    importKaynak: 'brf',
  };
}

function restEventToOge(event, index) {
  const selected = event.selected;
  const id = yeniId('brf-rest', index);
  const oge = muzikSusSkorOgesi(
    id,
    selected.sureIndeksi,
    {
      dotted: Boolean(selected.dotted),
    },
  );

  return {
    ...oge,
    kaynakToken: event.token,
    importKaynak: 'brf',
  };
}

function barlineOgesi(index) {
  return {
    id: yeniId('brf-barline', index),
    tip: 'barline',
    kind: 'manual',
    auto: false,
    autoBarline: false,
    otomatikOlcuCizgisi: false,
    ad: 'Normal olcu cizgisi',
    gorunum: '|',
    hucreler: [[]],
    aciklama: 'BRF ice aktarimindan olusturulan normal olcu cizgisi.',
    importKaynak: 'brf',
  };
}

function specialBarlineOgesi(symbol, index) {
  const token = symbol?.token || symbol;
  const tip = token?.barlineType || symbol?.value || 'barline';

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
    barline: 'Normal olcu cizgisi',
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
    hucreler: token?.cells || (tip === 'barline' ? [[]] : []),
    kaynakToken: token,
    importKaynak: 'brf',
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

function measureHasMusicEvents(measure) {
  return Array.isArray(measure?.events) && measure.events.some((event) => (
    event.type === 'note' || event.type === 'rest'
  ));
}

function measureBarlineSymbols(measure) {
  return (measure?.symbols || []).filter((symbol) => symbol?.type === 'barline');
}

function measureHasScoreOutput(measure) {
  return measureHasMusicEvents(measure) || measureBarlineSymbols(measure).length > 0;
}

export function brfIrToScore({ ir, header }) {
  const ogeler = [];
  const baglar = [];
  const warnings = [];

  let ogeIndex = 0;
  let lastNote = null;
  let pendingSlurFrom = null;
  let pendingTieFrom = null;

  (ir.lines || []).forEach((line) => {
    if (line.type !== 'music-line') return;

    const scoreMeasures = (line.measures || []).filter((measure) => measureHasScoreOutput(measure));

    scoreMeasures.forEach((measure, measureIndex) => {
      const barlineSymbols = measureBarlineSymbols(measure);
      const events = [...(measure.events || [])]
        .sort((a, b) => a.token.cellIndex - b.token.cellIndex);

      const markers = [
        ...(measure.slurMarkers || []).map((m) => ({ ...m, markerType: 'slur' })),
        ...(measure.tieMarkers || []).map((m) => ({ ...m, markerType: 'tie' })),
      ].sort((a, b) => a.token.cellIndex - b.token.cellIndex);

      let markerIndex = 0;

      if (!events.length && barlineSymbols.length) {
        barlineSymbols.forEach((symbol) => {
          ogeler.push(specialBarlineOgesi(symbol, ogeIndex));
          ogeIndex += 1;
        });
        return;
      }

      events.forEach((event) => {
        while (
          markerIndex < markers.length
          && markers[markerIndex].token.cellIndex < event.token.cellIndex
        ) {
          const marker = markers[markerIndex];

          if (marker.markerType === 'slur' && lastNote) {
            pendingSlurFrom = lastNote;
          }

          if (marker.markerType === 'tie' && lastNote) {
            pendingTieFrom = lastNote;
          }

          markerIndex += 1;
        }

        let oge = null;

        if (event.type === 'note') {
          oge = noteEventToOge(event, ogeIndex);
          ogeler.push(oge);

          if (pendingSlurFrom) {
            baglar.push({
              id: yeniId('brf-slur', ogeIndex),
              tip: 'slur',
              mode: 'single',
              basId: pendingSlurFrom.id,
              sonId: oge.id,
              notaIdler: [pendingSlurFrom.id, oge.id],
              kayit: {
                tip: 'slur',
                ad: 'Slur / legato bagi',
                gorunum: 'slur',
                hucreler: [[1, 4]],
              },
            });

            pendingSlurFrom = null;
          }

          if (pendingTieFrom) {
            if (!ayniSesMi(pendingTieFrom, oge)) {
              warnings.push({
                type: 'brf-import-tie-pitch-warning',
                message: 'BRF icinde tie bulundu ama baglanan notalar ayni ses degil.',
                lineIndex: line.index,
                measureIndex,
              });
            }

            baglar.push({
              id: yeniId('brf-tie', ogeIndex),
              tip: 'tie',
              mode: 'single',
              basId: pendingTieFrom.id,
              sonId: oge.id,
              notaIdler: [pendingTieFrom.id, oge.id],
              kayit: {
                tip: 'tie',
                ad: 'Tie / uzatma bagi',
                gorunum: 'tie',
                hucreler: [[4], [1, 4]],
              },
            });

            pendingTieFrom = null;
          }

          lastNote = oge;
        }

        if (event.type === 'rest') {
          oge = restEventToOge(event, ogeIndex);
          ogeler.push(oge);
        }

        ogeIndex += 1;
      });

      while (markerIndex < markers.length) {
        const marker = markers[markerIndex];

        if (marker.markerType === 'slur' && lastNote) {
          pendingSlurFrom = lastNote;
        }

        if (marker.markerType === 'tie' && lastNote) {
          pendingTieFrom = lastNote;
        }

        markerIndex += 1;
      }

      const nextMeasure = scoreMeasures[measureIndex + 1];
      if (
        measureIndex < scoreMeasures.length - 1
        && measureHasMusicEvents(measure)
        && measureHasMusicEvents(nextMeasure)
      ) {
        ogeler.push(barlineOgesi(ogeIndex));
        ogeIndex += 1;
      }
    });
  });

  const tsAd = header?.timeSignature?.ad || header?.timeSignature?.gorunum || '4/4';

  return {
    header: {
      title: header?.title || '',
      composer: header?.composer || '',
      lyricist: header?.lyricist || '',
      tempo: header?.tempo || '',
      keySignature: header?.keySignature || null,
      timeSignature: timeSignatureOlustur(tsAd),
      autoCompleteMeasures: false,
      pickupMeasure: false,
      importedFromBrf: true,
    },
    ogeler,
    baglar,
    tupletler: [],
    warnings,
  };
}
