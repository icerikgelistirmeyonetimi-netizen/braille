// Müzik BRF editörü — header başlangıç yardımcıları
import {
  muzikTimeSigExpected16,
  muzikTimeSignatureHucreleri,
} from '../music/index.js';
import { MUZIK_VARSAYILAN_ZAMAN_IMZASI } from './musicConstants.js';

export function varsayilanMuzikHeaderOlustur() {
  const varsayilanZaman = MUZIK_VARSAYILAN_ZAMAN_IMZASI;

  return {
    title: '',
    composer: '',
    tempo: '',
    keySignature: null,
    autoCompleteMeasures: true,
    pickupMeasure: false,
    useBrailleGrouping: false,
    timeSignature: {
      ad: varsayilanZaman,
      gorunum: varsayilanZaman,
      expectedDuration16: muzikTimeSigExpected16(varsayilanZaman),
      hucreler: muzikTimeSignatureHucreleri(varsayilanZaman),
    },
  };
}
