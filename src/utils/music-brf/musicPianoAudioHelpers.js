// import.meta.env yalnız Vite/tarayıcıda tanımlı; node (QA scriptleri) için güvenli erişim.
const _base = ((import.meta.env && import.meta.env.BASE_URL) || '/').replace(/\/+$/, '');
export const PIANO_AUDIO_FOLDER = `${_base}/piano%20ses`;
export const PIANO_AUDIO_EXTENSION = 'mp3';

const NOTA_SEMITONE = {
  do: 0,
  re: 2,
  mi: 4,
  fa: 5,
  sol: 7,
  la: 9,
  si: 11,
};

const ACCIDENTAL_OFFSET = {
  sharp: 1,
  diyez: 1,
  '#': 1,
  flat: -1,
  bemol: -1,
  b: -1,
  natural: 0,
  naturel: 0,
  bekar: 0,
};

function normalizeNotaAd(ad) {
  return String(ad || '').toLocaleLowerCase('tr').trim();
}

export function muzikArizaOffsetAl(value) {
  const raw = normalizeNotaAd(value);

  if (
    raw === 'sharp' ||
    raw === 'diyez' ||
    raw === '#' ||
    raw.includes('♯')
  ) return 1;

  if (
    raw === 'flat' ||
    raw === 'bemol' ||
    raw === 'b' ||
    raw.includes('♭')
  ) return -1;

  if (
    raw === 'natural' ||
    raw === 'natürel' ||
    raw === 'naturel' ||
    raw === 'bekar' ||
    raw.includes('♮')
  ) return 0;

  return null;
}

export function muzikNotaArizaDegeriAl(oge) {
  return (
    oge?.accidental ??
    oge?.ariza ??
    oge?.değiştirici ??
    oge?.degistirici ??
    oge?.degisim ??
    oge?.alteration ??
    oge?.alter ??
    null
  );
}

export function keySignatureAccidentalsAl(keySignature) {
  const ad = String(
    keySignature?.ad ||
    keySignature?.name ||
    keySignature?.label ||
    keySignature ||
    ''
  ).toLocaleLowerCase('tr').trim();

  if (keySignature?.accidentals && typeof keySignature.accidentals === 'object') {
    return { ...keySignature.accidentals };
  }

  const m = ad.match(/(\d+)\s*(diyez|bemol|bemollü|bemollu)/i);
  if (m) {
    const count = Math.max(0, Math.min(7, Number(m[1]) || 0));
    const isSharp = m[2].includes('diyez');

    const sharpOrder = ['fa', 'do', 'sol', 're', 'la', 'mi', 'si'];
    const flatOrder = ['si', 'mi', 'la', 're', 'sol', 'do', 'fa'];
    const result = {};
    const order = isSharp ? sharpOrder : flatOrder;

    for (let i = 0; i < count; i += 1) {
      result[order[i]] = isSharp ? 1 : -1;
    }

    return result;
  }

  if (ad.includes('sol maj')) return { fa: 1 };
  if (ad.includes('re maj')) return { fa: 1, do: 1 };
  if (ad.includes('la maj')) return { fa: 1, do: 1, sol: 1 };
  if (ad.includes('mi maj')) return { fa: 1, do: 1, sol: 1, re: 1 };
  if (ad.includes('si maj')) return { fa: 1, do: 1, sol: 1, re: 1, la: 1 };
  if (ad.includes('fa# maj') || ad.includes('fa diyez maj')) return { fa: 1, do: 1, sol: 1, re: 1, la: 1, mi: 1 };
  if (ad.includes('do# maj') || ad.includes('do diyez maj')) return { fa: 1, do: 1, sol: 1, re: 1, la: 1, mi: 1, si: 1 };

  if (ad.includes('fa maj')) return { si: -1 };
  if (ad.includes('sib maj') || ad.includes('si bemol maj')) return { si: -1, mi: -1 };
  if (ad.includes('mib maj') || ad.includes('mi bemol maj')) return { si: -1, mi: -1, la: -1 };
  if (ad.includes('lab maj') || ad.includes('la bemol maj')) return { si: -1, mi: -1, la: -1, re: -1 };

  if (ad.includes('mi min')) return { fa: 1 };
  if (ad.includes('si min')) return { fa: 1, do: 1 };
  if (ad.includes('fa# min') || ad.includes('fa diyez min')) return { fa: 1, do: 1, sol: 1 };
  if (ad.includes('do# min') || ad.includes('do diyez min')) return { fa: 1, do: 1, sol: 1, re: 1 };

  if (ad.includes('re min')) return { si: -1 };
  if (ad.includes('sol min')) return { si: -1, mi: -1 };
  if (ad.includes('do min')) return { si: -1, mi: -1, la: -1 };
  if (ad.includes('fa min')) return { si: -1, mi: -1, la: -1, re: -1 };

  return {};
}

export function muzikNotaMidiAl(oge, context = {}) {
  if (!oge || oge.tip !== 'nota') return null;

  const notaAd = normalizeNotaAd(oge.notaAd || oge.ad || '');
  const base = NOTA_SEMITONE[notaAd];
  if (!Number.isFinite(base)) return null;

  const oktav = Number.isFinite(Number(oge.oktav))
    ? Number(oge.oktav)
    : 4;

  const explicitAccidentalRaw = muzikNotaArizaDegeriAl(oge);
  const explicitOffset = muzikArizaOffsetAl(explicitAccidentalRaw);

  let offset = 0;
  if (explicitOffset !== null) {
    offset = explicitOffset;
  } else {
    const noteKey = `${notaAd}:${oktav}`;
    const measureAccidentals = context.measureAccidentals;
    const measureOffset = measureAccidentals && typeof measureAccidentals.get === 'function'
      ? measureAccidentals.get(noteKey)
      : (measureAccidentals ? measureAccidentals[noteKey] : undefined);

    if (Number.isFinite(measureOffset)) {
      offset = measureOffset;
    } else {
      const keySignatureAccidentals = context.keySignatureAccidentals || {};
      offset = Number.isFinite(Number(keySignatureAccidentals[notaAd]))
        ? Number(keySignatureAccidentals[notaAd])
        : 0;
    }
  }

  return ((oktav + 1) * 12) + base + offset;
}

export function muzikNotaPiyanoTusNoAl(oge, context = {}) {
  const midi = muzikNotaMidiAl(oge, context);
  if (!Number.isFinite(midi)) return null;

  const keyNumber = midi - 20;
  if (keyNumber < 1 || keyNumber > 88) return null;

  return keyNumber;
}

export function muzikNotaPiyanoSesUrlAl(oge, {
  folder = PIANO_AUDIO_FOLDER,
  extension = PIANO_AUDIO_EXTENSION,
  context = {},
} = {}) {
  const keyNumber = muzikNotaPiyanoTusNoAl(oge, context);
  if (!keyNumber) return null;

  return `${folder}/${keyNumber}.${extension}`;
}
