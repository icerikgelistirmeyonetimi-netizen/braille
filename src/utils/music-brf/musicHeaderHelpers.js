// Müzik BRF editörü — header başlangıç yardımcıları
import {
  muzikTimeSigExpected16,
  muzikTimeSignatureHucreleri,
} from '../music/index.js';
import { MUZIK_VARSAYILAN_ZAMAN_IMZASI } from './musicConstants.js';
import { ayarlariAl } from '../ayarlar.js';

export function varsayilanMuzikHeaderOlustur() {
  const varsayilanZaman = MUZIK_VARSAYILAN_ZAMAN_IMZASI;
  // Nota gruplaması varsayılanı kullanıcı ayarından (Ayarlar → Nota gruplaması). Yeni skor bunu alır.
  let gruplamaVarsayilan = true;
  try { gruplamaVarsayilan = ayarlariAl().muzikGruplama !== false; } catch { /* */ }

  return {
    title: '',
    composer: '',
    tempo: '',
    bpm: 120,
    keySignature: null,
    autoCompleteMeasures: true,
    pickupMeasure: false,
    useBrailleGrouping: gruplamaVarsayilan,
    timeSignature: {
      ad: varsayilanZaman,
      gorunum: varsayilanZaman,
      expectedDuration16: muzikTimeSigExpected16(varsayilanZaman),
      hucreler: muzikTimeSignatureHucreleri(varsayilanZaman),
    },
  };
}
