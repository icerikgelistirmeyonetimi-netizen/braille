/** Okuma modu ikinci satırı üst sınırı */
const OKUMA_MAX = 48;

/**
 * @param {string} metin
 * @returns {string}
 */
function kirp(metin) {
  const t = metin.trim();
  if (!t) return '';
  const ilkVirgul = t.split(',')[0]?.trim() || t;
  const ilkParca = ilkVirgul.split(/[.;]/)[0]?.trim() || ilkVirgul;
  const kaynak = ilkParca.length < t.length ? ilkParca : t.split(/[.;]/)[0]?.trim() || t;
  return kaynak.length > OKUMA_MAX ? `${kaynak.slice(0, OKUMA_MAX - 1)}…` : kaynak;
}

/**
 * @param {string} kural
 * @returns {string}
 */
function kurallardanTekSatir(kural) {
  const iki = kural.indexOf(': ');
  let govde = iki >= 0 ? kural.slice(iki + 2).trim() : kural.trim();
  govde = govde.replace(/^yalnızca\s+/i, '');
  const parcalar = govde.split(';').map((p) => p.trim()).filter(Boolean);
  if (parcalar.length >= 2 && govde.length < 200 && parcalar[0].length < 42 && parcalar[1].length < 42) {
    const a = kirp(parcalar[0]).replace(/…$/, '');
    const b = kirp(parcalar[1].replace(/^yalnızca\s+/i, '')).replace(/…$/, '');
    let birlesik = `${a} · ${b}`;
    return birlesik.length > OKUMA_MAX ? `${birlesik.slice(0, OKUMA_MAX - 1)}…` : birlesik;
  }
  return kirp(govde);
}

/**
 * @param {{ aciklama?: string, kurallar?: string[], okumaOzeti?: string }} oge
 * @returns {string}
 */
export function okumaModuIkinciSatir(oge) {
  if (!oge || typeof oge !== 'object') return '';
  const oz = (oge.okumaOzeti || '').trim();
  if (oz) return oz.length > OKUMA_MAX ? `${oz.slice(0, OKUMA_MAX - 1)}…` : oz;
  const ac = (oge.aciklama || '').trim();
  if (ac) return kirp(ac);
  const k0 = oge.kurallar?.[0];
  if (typeof k0 === 'string' && k0.trim()) return kurallardanTekSatir(k0.trim());
  return '';
}
