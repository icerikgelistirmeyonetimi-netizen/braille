// Kısaltma modu için lookup yardımcıları.
// Tüm kısaltma tablolarını tek nokta anahtarına indirger.

import { noktalariAnahtara } from './brailleCevir.js';
import {
  KELIME_KISALTMALARI,
  IKI_HARFLI_KISALTMALAR,
  HECE_KISALTMALARI,
  KELIME_KOKU_KISALTMALARI,
  KELIME_PARCASI_KISALTMALARI
} from '../data/braille.js';

// ── Tek hücreli tablolar ─────────────────────────────────────────────────────

/** Hece kısaltmaları: anahtar → hece metni (ba, be, bir …) */
export const HECE_MAP = new Map(
  HECE_KISALTMALARI.map((h) => [noktalariAnahtara(h.noktalar), h.hece])
);

/** Bir harfli kısaltmalar: anahtar → kelime (aynı, büyük, can …) */
export const BIR_HARF_MAP = new Map(
  KELIME_KISALTMALARI.map((k) => [noktalariAnahtara(k.noktalar), k.kelime])
);

/** Kök işareti hücresi: yalnızca nokta 5 */
export const KOK_KEY = noktalariAnahtara([5]);

// ── İki hücreli tablolar ─────────────────────────────────────────────────────

/**
 * Kelime kökü kısaltmaları ikinci hücresi: sagAnahtar → kelime
 * İlk hücre daima [5] (KOK_KEY).
 */
export const KOK_SAG_MAP = new Map(
  KELIME_KOKU_KISALTMALARI.map((k) => [noktalariAnahtara(k.sag), k.kelime])
);

/**
 * İki harfli kısaltmalar: solAnahtar → Map(sagAnahtar → kelime)
 */
export const IKI_HARF_SOL = (() => {
  const m = new Map();
  for (const k of IKI_HARFLI_KISALTMALAR) {
    const sk = noktalariAnahtara(k.sol);
    if (!m.has(sk)) m.set(sk, new Map());
    m.get(sk).set(noktalariAnahtara(k.sag), k.kelime);
  }
  return m;
})();

/**
 * Kelime parçası kısaltmaları: solAnahtar → Map(sagAnahtar → ekler)
 * İlk hücre [4,5] veya [5,6].
 */
export const PARCA_SOL = (() => {
  const m = new Map();
  for (const k of KELIME_PARCASI_KISALTMALARI) {
    const sk = noktalariAnahtara(k.sol);
    if (!m.has(sk)) m.set(sk, new Map());
    m.get(sk).set(noktalariAnahtara(k.sag), k.ekler);
  }
  return m;
})();

// ── Yardımcı sorgulama fonksiyonları ────────────────────────────────────────

/** Hece kısaltması mı? → hece metni veya null */
export function heceAra(noktalar) {
  return HECE_MAP.get(noktalariAnahtara(noktalar)) ?? null;
}

/** Bir harfli kısaltma mı? → kelime veya null */
export function birHarfAra(noktalar) {
  return BIR_HARF_MAP.get(noktalariAnahtara(noktalar)) ?? null;
}

/** Kök işareti hücresi mi? ([5]) */
export function kokIsaretiMi(noktalar) {
  return noktalariAnahtara(noktalar) === KOK_KEY;
}

/** Bu hücre herhangi bir iki harfli kısaltmanın birinci hücresi olabilir mi? */
export function ikiHarfBirinciMi(noktalar) {
  return IKI_HARF_SOL.has(noktalariAnahtara(noktalar));
}

/** Bu hücre bir kelime parçası kısaltmasının birinci hücresi mi? ([4,5] veya [5,6]) */
export function parcaBirinciMi(noktalar) {
  return PARCA_SOL.has(noktalariAnahtara(noktalar));
}

/** İki harfli kısaltma ara: sol + sag → kelime veya null */
export function ikiHarfAra(sol, sag) {
  const sm = IKI_HARF_SOL.get(noktalariAnahtara(sol));
  return sm?.get(noktalariAnahtara(sag)) ?? null;
}

/** Kelime kökü kısaltması ara: sag hücresi → kelime veya null (sol daima [5]) */
export function kokAra(sagNoktalar) {
  return KOK_SAG_MAP.get(noktalariAnahtara(sagNoktalar)) ?? null;
}

/** Kelime parçası kısaltması ara: sol + sag → ekler metni veya null */
export function parcaAra(sol, sag) {
  const sm = PARCA_SOL.get(noktalariAnahtara(sol));
  return sm?.get(noktalariAnahtara(sag)) ?? null;
}
