// Modül 8 Bölüm 5/10 — Bar number + Repeat (braille repeat, backward-numeral, bar-number)
import { MUZIK_UST_RAKAM, MUZIK_ALT_RAKAM } from './musicConstants.js';

// Modül 8 Bölüm 5 — Bar number alt-rakam hücreleri (sayı işareti olmadan)
export function muzikBarNumberHucreleri(no) {
  return String(no).split('').map((d) => MUZIK_ALT_RAKAM[d] || []);
}

export function muzikUstRakamHucreleri(no) {
  return String(no).split('').map((d) => MUZIK_UST_RAKAM[d] || []);
}

export function muzikSayiGostergesi() { return [3, 4, 5, 6]; }

// Modül 8 Bölüm 10 — Backward-numeral repeat (#H#D, eşit ise tek rakam)
export function muzikBackwardNumeralRepeatHucreleri(countBack, playBars = null) {
  const sayi = muzikSayiGostergesi();
  const cb = muzikUstRakamHucreleri(countBack);
  if (playBars == null || countBack === playBars) return [sayi, ...cb];
  const pb = muzikUstRakamHucreleri(playBars);
  return [sayi, ...cb, sayi, ...pb];
}

// Modül 8 Bölüm 10 — Bar-number repeat (#2 veya #5-8)
export function muzikBarNumberRepeatHucreleri(start, end = null) {
  const sayi = muzikSayiGostergesi();
  const sCells = muzikBarNumberHucreleri(start);
  if (end == null) return [sayi, ...sCells];
  const eCells = muzikBarNumberHucreleri(end);
  return [sayi, ...sCells, [3, 6], ...eCells];
}

// Modül 8 Bölüm 10 — Ölçü hash'i: iki ölçü müzikal olarak aynı mı?
export function muzikOlcuHash(olcu) {
  if (!olcu || !Array.isArray(olcu.items)) return '';
  return olcu.items.map((o) => {
    if (o.tip === 'nota') {
      const mods = (yon) => (Array.isArray(o.modifiers?.[yon]) ? o.modifiers[yon] : [])
        .map((m) => m.kayit?.ad || '').sort().join(',');
      return [
        'N', o.notaAd, o.sureIndeksi, o.oktav ?? 4,
        o.accidental || '-', o.dotted ? 'd' : '-',
        mods('oncesi'), mods('sonrasi'),
      ].join('|');
    }
    if (o.tip === 'sus') return ['S', o.realValue, o.dotted ? 'd' : '-'].join('|');
    return ['X', o.ad || o.tip || ''].join('|');
  }).join('~');
}

// Modül 8 Bölüm 10 — Bar repeat geçerli mi? (cross-measure slur engeli dahil)
export function muzikBarRepeatUygunMu(prev, cur, baglar) {
  if (!prev || !cur) return false;
  if (!prev.items.length || !cur.items.length) return false;
  if (muzikOlcuHash(prev) !== muzikOlcuHash(cur)) return false;
  const prevIds = new Set(prev.items.map((o) => o.id));
  const curIds = new Set(cur.items.map((o) => o.id));
  for (const b of (baglar || [])) {
    const basInPrev = prevIds.has(b.basId);
    const sonInCur = curIds.has(b.sonId);
    const basInCur = curIds.has(b.basId);
    const sonInPrev = prevIds.has(b.sonId);
    if ((basInPrev && sonInCur) || (basInCur && sonInPrev)) return false;
  }
  return true;
}

export function muzikAutoBarRepeatHaritasi(olculer, baglar = []) {
  const harita = new Map();
  for (let i = 1; i < olculer.length; i++) {
    if (muzikBarRepeatUygunMu(olculer[i - 1], olculer[i], baglar)) {
      harita.set(i, true);
    }
  }
  return harita;
}

// Modül 8 Bölüm 10 — Uzak ölçü tekrar aday analizi
export function muzikRepeatAdaylariniBul(olculer, baglar = [], autoBarHar = new Map()) {
  const oneriler = [];
  for (let target = 2; target < olculer.length; target++) {
    if (autoBarHar.get(target)) continue;
    for (let source = target - 2; source >= 0; source--) {
      if (muzikBarRepeatUygunMu(olculer[source], olculer[target], baglar)) {
        const distance = target - source;
        oneriler.push({
          type: distance <= 8 ? 'backward-numeral' : 'bar-number',
          targetMeasure: target + 1,
          sourceMeasure: source + 1,
          countBack: distance,
          playBars: 1,
          aciklama: distance <= 8
            ? `${target + 1}. ölçü ${source + 1}. ölçü ile aynı (${distance} ölçü geri) → backward-numeral repeat`
            : `${target + 1}. ölçü ${source + 1}. ölçü ile aynı → bar-number repeat (#${source + 1})`,
        });
        break;
      }
    }
  }
  return oneriler;
}
