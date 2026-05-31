// Modül 8 Bölüm 4 — Key Signature etkisi
import {
  MUZIK_ACCIDENTAL_HUCRELERI,
  MUZIK_DIYEZ_SIRASI,
  MUZIK_BEMOL_SIRASI,
  MUZIK_UST_RAKAM,
} from './musicConstants.js';

export function muzikAccidentalHucreleri(acc) {
  return acc ? (MUZIK_ACCIDENTAL_HUCRELERI[acc] || []) : [];
}

export function muzikKeySignatureEtkilenenler(keySignature) {
  if (!keySignature || !keySignature.ad) return { sharps: [], flats: [] };
  const ad = String(keySignature.ad).toLowerCase();
  const sayiMatch = /(\d+)\s*(diyez|bemol)/.exec(ad);
  if (!sayiMatch) return { sharps: [], flats: [] };
  const n = Math.min(7, parseInt(sayiMatch[1], 10));
  const sharps = /diyez/.test(sayiMatch[2]) ? MUZIK_DIYEZ_SIRASI.slice(0, n) : [];
  const flats = /bemol/.test(sayiMatch[2]) ? MUZIK_BEMOL_SIRASI.slice(0, n) : [];
  return { sharps, flats };
}

// Bir notanın donanım altında etkili aksidentalini hesapla.
// Explicit override öncelikli; yoksa donanıma göre belirle.
export function muzikEffectiveAccidental(note, keyEtki) {
  if (!note || !note.notaAd) return null;
  if (note.accidental) return note.accidental;
  if (keyEtki.sharps.includes(note.notaAd)) return 'sharp';
  if (keyEtki.flats.includes(note.notaAd)) return 'flat';
  return null;
}

export function muzikKeySignatureHucreleri(keySignature) {
  if (!keySignature || !keySignature.ad) return [];

  const ad = String(keySignature.ad || '').toLowerCase();

  const m = /(\d+)\s*(diyezli|diyez|bemollü|bemollu|bemol)/i.exec(ad);

  if (!m) {
    if (Array.isArray(keySignature.hucreler) && keySignature.hucreler.length > 0) {
      return keySignature.hucreler;
    }

    return [];
  }

  const sayi = Math.min(7, Math.max(0, parseInt(m[1], 10) || 0));
  if (sayi <= 0) return [];

  const turMetni = String(m[2] || '').toLowerCase();

  const diyezMi = /diyez/.test(turMetni);
  const bemolMu = /bemol|bemollü|bemollu/.test(turMetni);

  if (!diyezMi && !bemolMu) return [];

  const accidentalCell = diyezMi
    ? MUZIK_ACCIDENTAL_HUCRELERI.sharp?.[0]
    : MUZIK_ACCIDENTAL_HUCRELERI.flat?.[0];

  if (!Array.isArray(accidentalCell)) return [];

  // 1-3 diyez/bemol: accidental tekrarlanır.
  if (sayi <= 3) {
    return Array.from({ length: sayi }, () => [...accidentalCell]);
  }

  // 4-7 diyez/bemol: sayı işareti + üst rakam + tek accidental.
  const upperNumber = MUZIK_UST_RAKAM[String(sayi)];
  if (!Array.isArray(upperNumber)) return [];

  return [
    [3, 4, 5, 6],
    [...upperNumber],
    [...accidentalCell],
  ];
}
