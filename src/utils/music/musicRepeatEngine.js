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

// Müzikal içerik olmayan öğe tipleri — hash hesabında atlanır
const HASH_ATLANAN_TIPLER = new Set([
  'anahtar', 'barline', 'sectionalBarline', 'finalBarline',
  'beginRepeat', 'endRepeat', 'timeSignatureChange', 'keySignatureChange',
]);

// Modül 8 Bölüm 10 — Ölçü hash'i: iki ölçü müzikal olarak aynı mı?
// baglar: ölçü içi slur/tie farklılıklarını da yakalamak için gerekli
export function muzikOlcuHash(olcu, baglar = []) {
  if (!olcu || !Array.isArray(olcu.items)) return '';

  const itemIds = new Set(olcu.items.filter((o) => o?.id).map((o) => o.id));

  // Tamamen bu ölçü içinde başlayıp biten bağlar için nota başına imza üret
  const notaBagImzasi = new Map();
  for (const b of (baglar || [])) {
    const tip = String(b.tip || b.kayit?.tip || 'bag').toLowerCase();
    const bagIds = (Array.isArray(b.notaIdler) && b.notaIdler.length >= 2)
      ? b.notaIdler.filter(Boolean)
      : [b.basId, b.sonId].filter(Boolean);
    // Sadece iki ucu da bu ölçüde olan bağlar (cross-measure bağlar ayrıca kontrol edilir)
    if (bagIds.length < 2 || !bagIds.every((id) => itemIds.has(id))) continue;
    bagIds.forEach((id, i) => {
      const rol = i === 0 ? 'bas' : i === bagIds.length - 1 ? 'son' : 'ara';
      const mevcut = notaBagImzasi.get(id) || [];
      mevcut.push(`${tip}-${rol}`);
      notaBagImzasi.set(id, mevcut);
    });
  }

  return olcu.items
    .filter((o) => o && !HASH_ATLANAN_TIPLER.has(o.tip))   // clef, barline vb. atla
    .map((o) => {
      if (o.tip === 'nota') {
        const mods = (yon) => (Array.isArray(o.modifiers?.[yon]) ? o.modifiers[yon] : [])
          .map((m) => m.kayit?.ad || '').sort().join(',');
        const bagImza = (notaBagImzasi.get(o.id) || []).sort().join(',');
        return [
          'N', o.notaAd, o.sureIndeksi, o.oktav ?? 4,
          o.accidental || '-', o.dotted ? 'd' : '-',
          mods('oncesi'), mods('sonrasi'),
          bagImza,
        ].join('|');
      }
      if (o.tip === 'sus') return ['S', o.realValue, o.dotted ? 'd' : '-'].join('|');
      // wordExpression, isaret vb. müzikal içeriği etkiler → dahil et
      return ['X', o.ad || o.tip || ''].join('|');
    })
    .join('~');
}

// Modül 8 Bölüm 10 — Bar repeat geçerli mi?
// Hem içerik (hash) hem cross-measure bağlar kontrol edilir.
export function muzikBarRepeatUygunMu(prev, cur, baglar) {
  if (!prev || !cur) return false;
  if (!prev.items.length || !cur.items.length) return false;
  // Hash artık ölçü içi bağları da kapsıyor
  if (muzikOlcuHash(prev, baglar) !== muzikOlcuHash(cur, baglar)) return false;
  const prevIds = new Set(prev.items.map((o) => o.id));
  const curIds = new Set(cur.items.map((o) => o.id));
  // Cross-measure bağ kontrolü (biri önceki ölçüde başlayıp diğerinde bitiyor)
  for (const b of (baglar || [])) {
    const basIds = Array.isArray(b.notaIdler) ? b.notaIdler : [b.basId, b.sonId].filter(Boolean);
    if (basIds.length < 2) continue;
    const basId = basIds[0];
    const sonId = basIds[basIds.length - 1];
    if ((prevIds.has(basId) && curIds.has(sonId)) || (curIds.has(basId) && prevIds.has(sonId))) {
      return false;
    }
  }
  return true;
}

export function muzikAutoBarRepeatHaritasi(olculer, baglar = []) {
  const harita = new Map();
  for (let i = 1; i < olculer.length; i++) {
    // brailleShorthand ölçülerini asla otomatik tekrar olarak işaretleme
    const prevFirst = olculer[i - 1]?.items?.[0];
    const curFirst = olculer[i]?.items?.[0];
    if (prevFirst?.tip === 'brailleShorthand' || curFirst?.tip === 'brailleShorthand') continue;

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
