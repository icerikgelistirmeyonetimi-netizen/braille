// Müzik BRF editörü — Braille metin ve hücre yardımcıları

export const brailleSafeText = (v) => (typeof v === 'string' ? v.trim() : '');

const BRAILLE_BAG_ACIKLAMA = {
  tie: 'Tie / uzatma bağı',
  slur: 'Slur / legato bağı',
  'slur-start': 'Slur başlangıç',
  'slur-end': 'Slur bitiş',
  'double-slur-start': 'Double slur başlangıç',
  'double-slur-end': 'Double slur bitiş',
  'bracket-slur-start': 'Bracket slur başlangıç',
  'bracket-slur-end': 'Bracket slur bitiş',
};

export function brailleAnlamMetniAl(anlam) {
  const kaynak = brailleSafeText(anlam?.kaynak).toLocaleLowerCase('tr');
  if (BRAILLE_BAG_ACIKLAMA[kaynak]) {
    return BRAILLE_BAG_ACIKLAMA[kaynak];
  }

  return (
    brailleSafeText(anlam?.etiket)
    || brailleSafeText(anlam?.baslik)
    || brailleSafeText(anlam?.ad)
    || brailleSafeText(anlam?.tip)
    || 'Müzik işareti'
  );
}

export const brailleTemizMetin = (v) => (
  typeof v === 'string' ? v.trim() : ''
);

export function brailleAnlamMetni(anlam) {
  const kaynak = brailleTemizMetin(anlam?.kaynak).toLocaleLowerCase('tr');
  if (BRAILLE_BAG_ACIKLAMA[kaynak]) {
    return BRAILLE_BAG_ACIKLAMA[kaynak];
  }

  return (
    brailleTemizMetin(anlam?.etiket)
    || brailleTemizMetin(anlam?.baslik)
    || brailleTemizMetin(anlam?.ad)
    || brailleTemizMetin(anlam?.tip)
    || 'Müzik işareti'
  );
}

export function brailleMetinBirlesikAl(anlam) {
  return [
    brailleTemizMetin(anlam?.tip),
    brailleTemizMetin(anlam?.baslik),
    brailleTemizMetin(anlam?.etiket),
    brailleTemizMetin(anlam?.ad),
    brailleTemizMetin(anlam?.noktaStr),
  ].join(' ').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
}

export function brailleCharAl(noktalar) {
  if (!Array.isArray(noktalar) || noktalar.length === 0) {
    return '⠀';
  }

  let bit = 0;

  for (const d of noktalar) {
    if (d >= 1 && d <= 8) {
      bit |= (1 << (d - 1));
    }
  }

  return String.fromCharCode(0x2800 + bit);
}

export function brailleMetniOlustur(hucreListesi) {
  return (hucreListesi || []).map(brailleCharAl).join('');
}

export function brailleHucreListesiNormalizeEt(veri) {
  if (!Array.isArray(veri) || veri.length === 0) return [];

  if (Array.isArray(veri[0])) {
    return veri.filter((hucre) => Array.isArray(hucre));
  }

  return [veri.filter((n) => Number.isFinite(n))];
}
