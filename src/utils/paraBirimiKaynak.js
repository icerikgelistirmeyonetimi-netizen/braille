/**
 * Sayıdan sonra (isteğe bağlı boşlukla) gelen para ve SI ölçü birimleri için kaynak metinde [bas, son) aralıkları.
 * Harf veya rakamla devam eden yanlış pozitifleri (ör. Kravat) elemek için son ek öncesinde rakam grubu şarttır.
 */

/** Uzun birim önce eşleşsin (mm > m, kg > g). Çeviri ve vurgu aynı sırayı kullanır. */
export const SAYI_SONRASI_BIRIM_SEMBOLLERI_SIRALI = [
  'mm', 'cm', 'dm', 'dam', 'hm', 'km',
  'mg', 'cg', 'dg', 'dag', 'hg', 'kg',
  'ml', 'cl', 'dl', 'dal', 'hl', 'kl',
  'dk', 'sn', 'sa',
  'kr', 'tl',
  'g', 'l', 'm', 't',
  '$', '€', '£',
];

function birimRegexPattern() {
  return SAYI_SONRASI_BIRIM_SEMBOLLERI_SIRALI
    .map((s) => (s === '$' ? '\\$' : s.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')))
    .join('|');
}

/** Tam kelime ile eşleşen birim sembolünü döndürür (örn. "TL" → "tl"); yoksa null */
export function kelimeyiSayiSonrasiBirimiyleEslestir(kelimeHam) {
  const k = kelimeHam.trim();
  if (!k) return null;
  const norm = k.toLocaleLowerCase('tr');
  for (const s of SAYI_SONRASI_BIRIM_SEMBOLLERI_SIRALI) {
    if (norm === s.toLocaleLowerCase('tr')) return s;
  }
  return null;
}

export function paraBirimiKaynakSonEkiAraliklari(kaynak) {
  if (!kaynak || typeof kaynak !== 'string') return [];
  const araliklar = [];
  const re = new RegExp(
    `(?:^|[^\\p{L}0-9])(\\d+(?:[.,]\\d+)*)\\s*((?:${birimRegexPattern()}))(?![\\p{L}0-9])`,
    'giu',
  );
  let m = re.exec(kaynak);
  while (m !== null) {
    const tam = m[0];
    const ek = m[2];
    const ekBas = m.index + tam.length - ek.length;
    const metin = ek.toLocaleLowerCase('tr');
    araliklar.push({ bas: ekBas, son: ekBas + ek.length, metin, birim: metin });
    m = re.exec(kaynak);
  }
  return araliklar;
}

export function kaynakIndeksiParaBirimiSonEkindeMi(kaynakIdx, araliklar) {
  if (!Array.isArray(araliklar) || araliklar.length === 0) return false;
  if (typeof kaynakIdx !== 'number' || kaynakIdx < 0) return false;
  return araliklar.some(({ bas, son }) => kaynakIdx >= bas && kaynakIdx < son);
}

/** esleme[i] === -1 olan önek hücreleri çözmek için kaynak karakter indeksi */
export function hucreBirimKaynakIndeksiniCoz(esleme, hucreIdx) {
  if (!Array.isArray(esleme) || hucreIdx < 0 || hucreIdx >= esleme.length) return -1;
  const k = esleme[hucreIdx];
  let kaynakIdx = typeof k === 'number' ? k : -1;
  if (kaynakIdx < 0) {
    for (let i = hucreIdx + 1; i < esleme.length; i++) {
      const k2 = esleme[i];
      if (typeof k2 === 'number' && k2 >= 0) {
        kaynakIdx = k2;
        break;
      }
    }
    if (kaynakIdx < 0) {
      for (let i = hucreIdx - 1; i >= 0; i--) {
        const k2 = esleme[i];
        if (typeof k2 === 'number' && k2 >= 0) {
          kaynakIdx = k2;
          break;
        }
      }
    }
  }
  return kaynakIdx;
}

export function hucreParaBirimiKaynakBaglamiMi(esleme, hucreIdx, araliklar) {
  return kaynakIndeksiParaBirimiSonEkindeMi(hucreBirimKaynakIndeksiniCoz(esleme, hucreIdx), araliklar);
}
