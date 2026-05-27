// Modül 8 Bölüm 4 — Grouping (Beaming) kuralı
import {
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
  NOTALAR as MUZIK_TEMEL_NOTALAR,
} from '../../data/muzik.js';
import { MUZIK_SATIR_KAPASITESI } from './musicConstants.js';
import {
  muzikRestKucukSureDegeri,
  muzikOlcuAyraciMi,
  muzikBeatPozisyonlari,
  muzikAyniVurusMu,
  muzikTimeSigBeatUnit16,
} from './musicDuration.js';

// Grup içinde ilk-olmayan notalar için pitch-only hücre
export function muzikNotaSadePitchHucresi(notaAd) {
  const nota = MUZIK_TEMEL_NOTALAR.find((n) => n.ad === notaAd) || MUZIK_TEMEL_NOTALAR[0];
  return [...nota.noktalar].sort((a, b) => a - b);
}

// Modül 8 Bölüm 4 — Grouping kuralı:
// 1) realValue >= 16 (sekizlikten küçük)
// 2) En az 3 öğe
// 3) İlk öğe NOTA veya aynı değerde SUS
// 4) Sonraki öğeler NOTA olmalı (sus yalnız başta)
// 5) Hepsi aynı küçük süre değerinde
// 6) Aynı satırda tamamlanmalı
// 7) Aynı VURUŞ içinde olmalı (default beat unit = 4 sixteenths)
// 8) Grup sonrasında aynı ölçü içinde sekizlik / sekizlik-sus gelmemeli
function ogeTupletIcindeMi(oge, tupletNotaIdMap = null) {
  if (!oge) return false;
  if (oge.tupletId || oge.tuplet) return true;
  if (tupletNotaIdMap && oge.id && tupletNotaIdMap.has(oge.id)) return true;
  return false;
}

function sekizlikVeyaNoktaliSekizlikMi(oge) {
  if (!oge) return false;

  if (oge.tip === 'nota') {
    const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
    return sure?.realValue === 8;
  }

  if (oge.tip === 'sus') {
    if (oge.realValue === 8) return true;
    const ad = String(oge.ad || '').toLowerCase();
    return /sekizlik.*sus/.test(ad);
  }

  return false;
}

export function muzikGrupTespit(
  ogeler,
  baslangic,
  beatPos = null,
  beatUnit = 4,
  tupletNotaIdMap = null,
  options = {},
) {
  const itemToBrailleLineIndex = typeof options.itemToBrailleLineIndex === 'function'
    ? options.itemToBrailleLineIndex
    : null;

  const bas = ogeler[baslangic];
  if (!bas) return 0;

  if (ogeTupletIcindeMi(bas, tupletNotaIdMap)) {
    return 0;
  }

  let smallReal = null;

  if (bas.tip === 'nota') {
    const basSure = MUZIK_SURE_GOSTERGELERI[bas.sureIndeksi ?? 0];

    if (basSure && basSure.realValue >= 16) {
      smallReal = basSure.realValue;
    }
  } else {
    // Sus yalnızca grubun başında olabilir.
    smallReal = muzikRestKucukSureDegeri(bas);
  }

  if (!smallReal) return 0;

  const basSatir = itemToBrailleLineIndex
    ? (itemToBrailleLineIndex(baslangic) ?? Math.floor(baslangic / MUZIK_SATIR_KAPASITESI))
    : Math.floor(baslangic / MUZIK_SATIR_KAPASITESI);
  const pozCache = beatPos || muzikBeatPozisyonlari(ogeler, tupletNotaIdMap);

  let i = baslangic + 1;

  while (i < ogeler.length) {
    const o = ogeler[i];

    if (!o || o.tip !== 'nota') break;

    if (ogeTupletIcindeMi(o, tupletNotaIdMap)) break;

    const oSure = MUZIK_SURE_GOSTERGELERI[o.sureIndeksi ?? 0];

    if (!oSure || oSure.realValue !== smallReal) break;

    const aktifSatir = itemToBrailleLineIndex
      ? (itemToBrailleLineIndex(i) ?? Math.floor(i / MUZIK_SATIR_KAPASITESI))
      : Math.floor(i / MUZIK_SATIR_KAPASITESI);

    if (aktifSatir !== basSatir) break;

    if (!muzikAyniVurusMu(pozCache[baslangic], pozCache[i], beatUnit)) break;

    i += 1;
  }

  const sayi = i - baslangic;

  if (sayi < 3) return 0;

  // Grup sonrası aynı ölçü içinde sekizlik, noktalı sekizlik veya sekizlik sus varsa gruplama yapılmaz.
  for (let j = i; j < ogeler.length; j += 1) {
    const o = ogeler[j];

    if (!o) break;

    if (muzikOlcuAyraciMi(o)) break;

    if (sekizlikVeyaNoktaliSekizlikMi(o)) return 0;
  }

  return sayi;
}

export function muzikGruplariTespit(ogeler, header = null, tupletNotaIdMap = null, options = {}) {
  const harita = new Map();

  if (!Array.isArray(ogeler) || !ogeler.length) {
    return harita;
  }

  const beatUnit = muzikTimeSigBeatUnit16(header?.timeSignature?.ad || header?.timeSignature?.gorunum);
  const beatPos = muzikBeatPozisyonlari(ogeler, tupletNotaIdMap);

  for (let i = 0; i < ogeler.length; i += 1) {
    if (harita.has(i)) continue;

    const grupBoyu = muzikGrupTespit(
      ogeler,
      i,
      beatPos,
      beatUnit,
      tupletNotaIdMap,
      options,
    );

    if (grupBoyu > 0) {
      for (let k = 0; k < grupBoyu; k += 1) {
        harita.set(i + k, { konum: k, boy: grupBoyu });
      }

      i += grupBoyu - 1;
    }
  }

  return harita;
}
