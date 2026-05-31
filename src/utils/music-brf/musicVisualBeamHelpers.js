import { SURE_GOSTERGELERI } from '../../data/muzik.js';

export function gorselBeamSureBilgisiAl(oge) {
  if (!oge || oge.tip !== 'nota') return null;

  const sure = SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
  const realValue = sure?.realValue;

  if (!Number.isFinite(realValue)) return null;

  return {
    sure,
    realValue,
    birim16: 16 / realValue,
  };
}

export function gorselBeamableNotaMi(oge) {
  const bilgi = gorselBeamSureBilgisiAl(oge);
  if (!bilgi) return false;

  return [8, 16, 32, 64, 128].includes(bilgi.realValue);
}

export function gorselBeamKesiciMi(oge) {
  if (!oge) return true;

  if (oge.tip === 'sus') return true;
  if (oge.tip === 'barline') return true;
  if (oge.tip === 'finalBarline') return true;
  if (oge.tip === 'sectionalBarline') return true;
  if (oge.tip === 'beginRepeat') return true;
  if (oge.tip === 'endRepeat') return true;
  if (oge.tip === 'volta1') return true;
  if (oge.tip === 'volta2') return true;
  if (oge.tip === 'timeSignatureChange') return true;
  if (oge.tip === 'keySignatureChange') return true;

  const tip = String(oge.tip || oge.type || '').toLowerCase();
  const ad = String(oge.ad || oge.gorunum || '').toLowerCase();

  if (/barline|ölçü|olcu|final|bitiş|bitiş|sectional|repeat|tekrar/.test(tip)) return true;
  if (/barline|ölçü|olcu|final|bitiş|sectional|repeat|tekrar/.test(ad)) return true;

  return false;
}

export function gorselZamanImzasiVurusDeseniAl(timeSignature) {
  const ad = String(timeSignature?.ad || timeSignature?.gorunum || timeSignature || '4/4')
    .toLowerCase()
    .trim();

  if (ad === 'common' || ad === 'c') {
    return [4, 4, 4, 4];
  }

  if (ad === 'cut common' || ad === 'cut c' || ad === '𝄵') {
    return [8, 8];
  }

  const m = /^([0-9]+)\s*\/\s*([0-9]+)$/.exec(ad);
  if (!m) {
    return [4, 4, 4, 4];
  }

  const ust = parseInt(m[1], 10);
  const alt = parseInt(m[2], 10);

  if (!Number.isFinite(ust) || !Number.isFinite(alt) || ust <= 0 || alt <= 0) {
    return [4, 4, 4, 4];
  }

  if (alt === 4) {
    return Array.from({ length: ust }, () => 4);
  }

  if (alt === 2) {
    return Array.from({ length: ust }, () => 8);
  }

  if (alt === 8) {
    if (ust > 3 && ust % 3 === 0) {
      return Array.from({ length: ust / 3 }, () => 6);
    }

    if (ust === 5) return [4, 6];
    if (ust === 7) return [4, 4, 6];
    if (ust === 8) return [6, 6, 4];
    if (ust === 10) {
      // 10/8 için yaygın gruplama: 3+3+2+2 sekizlik
      // 16'lık bazda: 6 + 6 + 4 + 4 = 20/16
      return [6, 6, 4, 4];
    }
    if (ust === 3) return [6];

    return Array.from({ length: Math.ceil(ust / 2) }, (_, i) => {
      const kalanSekizlik = ust - i * 2;
      return kalanSekizlik >= 2 ? 4 : 2;
    });
  }

  if (alt === 16) {
    if (ust % 4 === 0) {
      return Array.from({ length: ust / 4 }, () => 4);
    }
    if (ust % 3 === 0) {
      return Array.from({ length: ust / 3 }, () => 3);
    }
    if (ust % 2 === 0) {
      return Array.from({ length: ust / 2 }, () => 2);
    }
    return Array.from({ length: ust }, () => 1);
  }

  return Array.from({ length: ust }, () => Math.max(1, 16 / alt));
}

export function gorselVurusSinirlariAl(timeSignature) {
  const desen = gorselZamanImzasiVurusDeseniAl(timeSignature);
  const sinirlar = [];
  let cursor = 0;

  for (const uzunluk of desen) {
    sinirlar.push({
      bas: cursor,
      son: cursor + uzunluk,
    });
    cursor += uzunluk;
  }

  return sinirlar;
}

export function gorselVurusIndexAl(pozisyon16, timeSignature) {
  const p = Number(pozisyon16) || 0;
  const sinirlar = gorselVurusSinirlariAl(timeSignature);

  for (let i = 0; i < sinirlar.length; i += 1) {
    const s = sinirlar[i];
    if (p >= s.bas && p < s.son) {
      return i;
    }
  }

  return Math.max(0, sinirlar.length - 1);
}

export function gorselOgeSure16Al(oge) {
  const bilgi = gorselBeamSureBilgisiAl(oge);

  if (bilgi) {
    let sure = bilgi.birim16;
    if (oge.dotted) {
      sure += sure / 2;
    }
    return sure;
  }

  if (oge?.tip === 'sus') {
    const realValue = Number(oge.realValue);
    if (Number.isFinite(realValue) && realValue > 0) {
      let sure = 16 / realValue;
      if (oge.dotted) sure += sure / 2;
      return sure;
    }
  }

  return 0;
}

export function gorselBeamGruplariOlustur({ ogeler = [], timeSignature = null }) {
  const gruplar = [];
  let aktif = [];
  let aktifVurus = null;
  let pozisyon16 = 0;

  const aktifKapat = () => {
    if (aktif.length >= 2) {
      gruplar.push([...aktif]);
    }
    aktif = [];
    aktifVurus = null;
  };

  (ogeler || []).forEach((oge, idx) => {
    if (gorselBeamKesiciMi(oge)) {
      aktifKapat();
      pozisyon16 = 0;
      return;
    }

    const sure16 = gorselOgeSure16Al(oge);

    if (!gorselBeamableNotaMi(oge)) {
      aktifKapat();
      pozisyon16 += sure16;
      return;
    }

    const vurus = gorselVurusIndexAl(pozisyon16, timeSignature);
    if (aktif.length && aktifVurus !== null && aktifVurus !== vurus) {
      aktifKapat();
    }

    aktif.push(idx);
    aktifVurus = vurus;
    pozisyon16 += sure16;
  });

  aktifKapat();
  return gruplar;
}

export function gorselBeamGruplariOlusturOlcuBazli({ olculer = [], timeSignature = null }) {
  const gruplar = [];

  (olculer || []).forEach((olcu) => {
    const items = olcu.items || [];
    const localGroups = gorselBeamGruplariOlustur({ ogeler: items, timeSignature });
    localGroups.forEach((group) => {
      if (Array.isArray(olcu.itemIndices) && olcu.itemIndices.length > 0) {
        gruplar.push(group.map((localIdx) => olcu.itemIndices[localIdx]));
      }
    });
  });

  return gruplar;
}
