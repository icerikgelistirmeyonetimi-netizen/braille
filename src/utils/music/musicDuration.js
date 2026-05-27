// Süre/beat hesapları — Modül 8 Bölüm 2 (Duration)
import {
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
  NOTALAR as MUZIK_TEMEL_NOTALAR,
} from '../../data/muzik.js';

// Bir notanın hücresini hesapla: pitch dots ∪ duration dots
export function muzikNotaNoktalari(notaAd, sureIndeksi) {
  const nota = MUZIK_TEMEL_NOTALAR.find((n) => n.ad === notaAd) || MUZIK_TEMEL_NOTALAR[0];
  const sure = MUZIK_SURE_GOSTERGELERI[sureIndeksi] || MUZIK_SURE_GOSTERGELERI[0];
  return [...new Set([...nota.noktalar, ...sure.noktalarEk])].sort((a, b) => a - b);
}

export function muzikSureKisaAdi(sure) {
  return String(sure?.ad || '').replace(/ nota$/i, '').replace(/\s*\(.+\)$/u, '');
}

// Modül 8 Bölüm 4 — Time signature → ölçü başına beklenen 16'lık süre
export function muzikTimeSigExpected16(adVeyaGorunum) {
  const s = String(adVeyaGorunum || '').toLowerCase().trim();
  if (!s) return null;
  if (/(^|\s)cut\s*common(\s|$)|cut\s*c|𝄵/.test(s)) return 16;
  if (/(^|\s)common(\s|$)|^c$/.test(s)) return 16;
  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (!m) return null;
  const ust = parseInt(m[1], 10);
  const alt = parseInt(m[2], 10);
  if (!Number.isFinite(ust) || !Number.isFinite(alt) || alt <= 0) {
    return null;
  }
  return ust * (16 / alt);
}

export function muzikTimeSigBeatUnit16(adVeyaGorunum) {
  const s = String(adVeyaGorunum || '').toLowerCase().trim();

  if (!s) return 4;

  if (/(^|\s)cut\s*common(\s|$)|cut\s*c|𝄵/.test(s)) {
    return 8; // 2/2: vuruş yarım nota kabul edilir.
  }

  if (/(^|\s)common(\s|$)|^c$/.test(s)) {
    return 4; // 4/4
  }

  const m = /^(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (!m) return 4;

  const ust = parseInt(m[1], 10);
  const alt = parseInt(m[2], 10);

  if (!Number.isFinite(ust) || !Number.isFinite(alt) || alt <= 0) {
    return 4;
  }

  if (alt === 8 && ust === 10) {
    // 10/8 çoğunlukla 3+3+2+2 sekizlik hissiyle okunur.
    // Tek bir sabit vuruş değeri gerekiyorsa noktalı dörtlük grubu 6/16 alınır.
    return 6;
  }

  // Bileşik ölçüler: 6/8, 9/8, 12/8 → noktalı dörtlük vuruşu = 6 adet 16’lık.
  if (alt === 8 && ust > 3 && ust % 3 === 0) {
    return 6;
  }

  // 7/8 gibi asimetrik ölçülerde temel sekizlik vuruşu üzerinden güvenli gruplama.
  if (alt === 8) {
    return 2;
  }

  if (alt === 4) {
    return 4;
  }

  if (alt === 2) {
    return 8;
  }

  return Math.max(1, 16 / alt);
}

// Modül 8 — sus dual-meaning (1↔16, 2↔32, 4↔64, 8↔128)
export function muzikRestKucukSureDegeri(oge) {
  if (!oge || oge.tip === 'nota') return null;

  // Kullanıcının gerçekten seçtiği küçük suslar.
  if (oge.tip === 'sus' && [16, 32, 64, 128].includes(oge.realValue)) {
    return oge.realValue;
  }

  // Braille müzikte dual-meaning rest mantığı:
  // tam sus hücresi 16’lık sus anlamı da taşıyabilir,
  // yarım sus hücresi 32’lik sus,
  // dörtlük sus hücresi 64’lük sus,
  // sekizlik sus hücresi 128’lik sus.
  if (oge.tip === 'sus' && oge.realValue) {
    const dual = { 1: 16, 2: 32, 4: 64, 8: 128 };
    return dual[oge.realValue] || null;
  }

  const ad = String(oge.ad || '').toLowerCase();

  if (/16|onaltılık|on altılık|semiquaver/.test(ad)) return 16;
  if (/32|otuz ikilik|demisemiquaver/.test(ad)) return 32;
  if (/64|altmış dörtlük|hemidemisemiquaver/.test(ad)) return 64;
  if (/128/.test(ad)) return 128;

  if (/(tam|birlik).*sus/.test(ad)) return 16;
  if (/(yarım|ikilik).*sus/.test(ad)) return 32;
  if (/dörtlük.*sus/.test(ad)) return 64;
  if (/sekizlik.*sus/.test(ad)) return 128;

  return null;
}

export function muzikRestSureFromName(ad) {
  const lower = String(ad || '').toLowerCase();
  if (/(tam|birlik).*sus/.test(lower)) return 1;
  if (/(yarım|ikilik).*sus/.test(lower)) return 2;
  if (/dörtlük.*sus/.test(lower)) return 4;
  if (/sekizlik.*sus/.test(lower)) return 8;
  return null;
}

// Bir öğenin 16'lık cinsinden süresi (ölçü içi pozisyon takibi)
// Noktalı nota 1.5× ; tuplet faktörü (inTimeOf/played)
export function muzikOge16Suresi(oge, tupletNotaIdMap = null) {
  if (!oge) return 0;
  const tupletFactor = (id) => {
    if (!tupletNotaIdMap) return 1;
    const info = tupletNotaIdMap.get(id);
    if (!info) return 1;
    const r = info.tuplet?.ratio;
    return r && r.played ? (r.inTimeOf / r.played) : 1;
  };
  if (oge.tip === 'nota') {
    const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
    if (!sure || !sure.realValue) return 0;
    let base = 16 / sure.realValue;
    if (oge.dotted) base *= 1.5;
    base *= tupletFactor(oge.id);
    return base;
  }
  if (oge.tip === 'sus' && oge.realValue) {
    let base = 16 / oge.realValue;
    if (oge.dotted) base *= 1.5;
    base *= tupletFactor(oge.id);
    return base;
  }
  // Fallback: name parsing (eski veriler için)
  const ad = String(oge.ad || '').toLowerCase();
  if (/noktalı dörtlük.*sus/.test(ad)) return 6;
  if (/(tam|birlik).*sus/.test(ad)) return 16;
  if (/(yarım|ikilik).*sus/.test(ad)) return 8;
  if (/dörtlük.*sus/.test(ad)) return 4;
  if (/sekizlik.*sus/.test(ad)) return 2;
  return 0;
}

export function muzikBeginRepeatMi(oge) {
  const tip = String(oge?.tip || oge?.type || oge?.kind || '').toLowerCase();
  const ad = String(oge?.ad || oge?.gorunum || oge?.label || '').toLocaleLowerCase('tr');
  const gorunum = String(oge?.gorunum || '');

  return (
    tip === 'beginrepeat' ||
    tip === 'begin-repeat' ||
    tip === 'startrepeat' ||
    gorunum === '𝄆' ||
    ad.includes('başlangıç tekrar') ||
    ad.includes('baslangic tekrar') ||
    ad.includes('başlangıç tekrarı') ||
    ad.includes('baslangic tekrari') ||
    ad.includes('begin repeat') ||
    ad.includes('start repeat')
  );
}

export function muzikEndRepeatMi(oge) {
  const tip = String(oge?.tip || oge?.type || oge?.kind || '').toLowerCase();
  const ad = String(oge?.ad || oge?.gorunum || oge?.label || '').toLocaleLowerCase('tr');
  const gorunum = String(oge?.gorunum || '');

  return (
    tip === 'endrepeat' ||
    tip === 'end-repeat' ||
    tip === 'repeatend' ||
    gorunum === '𝄇' ||
    ad.includes('bitiş tekrar') ||
    ad.includes('bitis tekrar') ||
    ad.includes('bitiş tekrarı') ||
    ad.includes('bitis tekrari') ||
    ad.includes('end repeat')
  );
}

export function muzikRepeatMi(oge) {
  return muzikBeginRepeatMi(oge) || muzikEndRepeatMi(oge);
}

export function muzikOlcuSonuAyraciMi(oge) {
  if (!oge || oge.tip === 'nota') return false;

  const tip = String(oge.tip || oge.type || oge.kind || '').toLowerCase();

  if (
    tip === 'barline' ||
    tip === 'finalbarline' ||
    tip === 'sectionalbarline' ||
    tip === 'volta1' ||
    tip === 'volta2' ||
    tip === 'volta'
  ) {
    return true;
  }

  const ad = String(oge.ad || oge.gorunum || oge.kind || oge.type || '').toLocaleLowerCase('tr');

  return /ölçü ayracı|ölçü çizgisi|olcu ayraci|olcu cizgisi|barline|final|bitiş çizgisi|bitis cizgisi|sectional/.test(ad);
}

export function muzikOlcuAyraciMi(oge) {
  if (!oge || oge.tip === 'nota') return false;

  if (muzikBeginRepeatMi(oge)) return false;
  if (muzikEndRepeatMi(oge)) return true;

  const tip = String(oge.tip || oge.type || oge.kind || '').toLowerCase();

  if (
    tip === 'barline' ||
    tip === 'finalbarline' ||
    tip === 'sectionalbarline' ||
    tip === 'volta1' ||
    tip === 'volta2' ||
    tip === 'volta'
  ) {
    return true;
  }

  const ad = String(oge.ad || oge.gorunum || oge.kind || oge.type || '').toLocaleLowerCase('tr');

  return /ölçü ayracı|ölçü çizgisi|olcu ayraci|olcu cizgisi|barline|final|bitiş çizgisi|bitis cizgisi|sectional/.test(ad);
}

export function muzikBeatPozisyonlari(ogeler, tupletNotaIdMap = null) {
  const poz = new Array(ogeler.length).fill(0);
  let cur = 0;
  for (let i = 0; i < ogeler.length; i++) {
    poz[i] = cur;
    if (muzikOlcuAyraciMi(ogeler[i])) cur = 0;
    else cur += muzikOge16Suresi(ogeler[i], tupletNotaIdMap);
  }
  return poz;
}

export function muzikAyniVurusMu(p1, p2, beatUnit = 4) {
  return Math.floor(p1 / beatUnit) === Math.floor(p2 / beatUnit);
}
