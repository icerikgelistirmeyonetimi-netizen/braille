/** Araçlar okuma hücresi: tek div + çoklu radial-gradient (64 desen önbelleği). */

const PAD = 5;
const DOT = 10;
const GAP = 3;

export const BRAILLE_STATIK_HUCRE_OLCEK = {
  genislik: 2 * DOT + GAP + 2 * PAD,
  yukseklik: 3 * DOT + 2 * GAP + 2 * PAD,
};

const { genislik: W, yukseklik: H } = BRAILLE_STATIK_HUCRE_OLCEK;

const MERKEZ = [
  [PAD + DOT / 2, PAD + DOT / 2],
  [PAD + DOT / 2, PAD + DOT + GAP + DOT / 2],
  [PAD + DOT / 2, PAD + 2 * DOT + 2 * GAP + DOT / 2],
  [PAD + DOT + GAP + DOT / 2, PAD + DOT / 2],
  [PAD + DOT + GAP + DOT / 2, PAD + DOT + GAP + DOT / 2],
  [PAD + DOT + GAP + DOT / 2, PAD + 2 * DOT + 2 * GAP + DOT / 2],
];

const R_DOLU = DOT / 2 - 0.5;
const R_HALKA_IC = DOT / 2 * 0.42;
const R_HALKA_DIS = DOT / 2 - 0.5;

export function noktaDizisindenBrailleBits(aktifNoktalar) {
  let b = 0;
  for (const n of aktifNoktalar) {
    if (n >= 1 && n <= 6) b |= 1 << (n - 1);
  }
  return b;
}

const gradientCache = new Map();

export function brailleHucreStatikArkaPlani(bits) {
  if (gradientCache.has(bits)) return gradientCache.get(bits);
  const katmanlar = [];
  for (let i = 0; i < 6; i++) {
    const [x, y] = MERKEZ[i];
    katmanlar.push(
      `radial-gradient(circle ${R_HALKA_DIS}px at ${x}px ${y}px, transparent ${R_HALKA_IC}px, var(--panel-border) ${R_HALKA_IC}px ${R_HALKA_DIS}px, transparent ${R_HALKA_DIS + 0.5}px)`,
    );
  }
  for (let i = 0; i < 6; i++) {
    if (bits & (1 << i)) {
      const [x, y] = MERKEZ[i];
      katmanlar.push(
        `radial-gradient(circle ${R_DOLU}px at ${x}px ${y}px, var(--statik-dot-dolu) 0 ${R_DOLU}px, transparent ${R_DOLU + 0.5}px)`,
      );
    }
  }
  const s = katmanlar.join(', ');
  gradientCache.set(bits, s);
  return s;
}
