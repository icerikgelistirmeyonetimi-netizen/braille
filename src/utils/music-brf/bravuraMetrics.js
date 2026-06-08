// Bravura SMuFL metrikleri — resmi değerler.
// Kaynak: public/fonts/bravura/bravura_metadata.json (Steinberg, OFL).
//
// SMuFL koordinat sistemi: birim = "staff space" (porte aralığı), y YUKARI artar.
// Bizim SVG: y AŞAĞI artar. em karesi = 4 staff space.
// Bir glyph font-size F px ile çizilince: 1 staff space = F/4 viewBox birimi (UPS).
//   F = 48 → 1 staff space = 12 (gerçek porte aralığımız) ile birebir.
// Konum dönüşümü (glyph origin gx,gy; metadata noktası [mx,my] staff space):
//   svgX = gx + mx * UPS
//   svgY = gy - my * UPS         (y EKSENİ TERS)

export const BRAVURA_FONT = "'Bravura', 'Bravura Text', 'Cambria Math', 'Noto Music', serif";

// ── SMuFL codepoint'leri ────────────────────────────────────────────────────
export const NOTEHEAD_CP = {
  black: 0xE0A4, // dörtlük ve daha kısa (dolu)
  half:  0xE0A3, // yarım (boş, eğik delikli)
  whole: 0xE0A2, // tam (boş)
};
// Süreye göre AYRI bayrak glyph'i (tek glyph içinde tüm çengeller) — istifleme yok.
// index 0..4 = 8'lik, 16'lık, 32'lik, 64'lük, 128'lik.
export const FLAG_UP_CP   = [0xE240, 0xE242, 0xE244, 0xE246, 0xE248];
export const FLAG_DOWN_CP = [0xE241, 0xE243, 0xE245, 0xE247, 0xE249];

// ── Bounding box'lar (staff space; w=genişlik, n=üst y-up, s=alt y-up) ───────
// noteheadBlack ve noteheadHalf aynı bbox: [0,-0.5]–[1.18,0.5] → merkez (0.59, 0).
export const NOTEHEAD_BBOX = { w: 1.18, n: 0.5, s: -0.5 };
export const NOTEHEAD_CENTER_X = (0 + 1.18) / 2; // 0.59 staff space
export const NOTEHEAD_CENTER_Y = (0.5 + -0.5) / 2; // 0 — merkez tam baseline'da

// ── Sap bağlantı noktaları (staff space, glyph-local, y-up) ──────────────────
// noteheadBlack: sap-yukarı sağ-üst köşe, sap-aşağı sol-alt köşe.
export const NOTEHEAD_STEM = {
  upSE:   [1.18, 0.168], // yukarı sap buradan başlar (sağ kenar)
  downNW: [0.0, -0.168], // aşağı sap buradan başlar (sol kenar)
};

// ── Bayrak sap-bağlantı anchor'ları (staff space, y-up) [x,y] ────────────────
// Up: stemUpNW (sapın tepesine değen nokta). Down: stemDownSW (sapın dibine değen).
export const FLAG_UP_ANCHOR   = [[0, -0.04], [0, -0.088], [0, 0.376], [0, 1.172], [0, 1.9]];
export const FLAG_DOWN_ANCHOR = [[0, 0.132], [0, 0.128], [0, -0.448], [0, -1.244], [0, -2.076]];

// ── Anahtar (clef) ───────────────────────────────────────────────────────────
// Origin SMuFL'de anahtarın referans çizgisindedir: gClef→G çizgisi, fClef→F
// çizgisi, cClef→orta. Bizim porte: F5=64 D5=76 B4=88 G4=100 E4=112 (aralık 12).
export const CLEF_CP = { g: 0xE050, f: 0xE062, c: 0xE05C };
// Anahtarın baseline'ının oturacağı porte y'si (treble G4=100, bass F3=76, alto=88).
export const CLEF_STAFF_Y = { treble: 100, bass: 76, alto: 88, tenor: 76 };

// Anahtar adından SMuFL glyph char'ı (SVG için; braille kartı ayrı/Unicode kalır).
export const clefGlyph = (anahtar) => {
  const ad = String(anahtar?.ad || '').toLowerCase();
  if (/fa|bass/.test(ad)) return glyphChar(CLEF_CP.f);
  if (/do|alto|tenor/.test(ad)) return glyphChar(CLEF_CP.c);
  return glyphChar(CLEF_CP.g);
};
export const clefStaffY = (anahtar) => {
  const ad = String(anahtar?.ad || '').toLowerCase();
  if (/fa|bass/.test(ad)) return CLEF_STAFF_Y.bass;
  if (/tenor/.test(ad)) return CLEF_STAFF_Y.tenor;
  if (/do|alto/.test(ad)) return CLEF_STAFF_Y.alto;
  return CLEF_STAFF_Y.treble;
};

// ── Aksidental ───────────────────────────────────────────────────────────────
// SMuFL origin = nota perdesinin çizgisi (baseline o perdede). bbox cy≈0 (sharp/
// natural ortada), flat yukarı taşar ama origin yine perde çizgisinde.
export const ACCIDENTAL_CP = {
  sharp: 0xE262, flat: 0xE260, natural: 0xE261,
  doubleSharp: 0xE263, doubleFlat: 0xE264,
};

// ── Sus (rest) ───────────────────────────────────────────────────────────────
// realValue → SMuFL codepoint
export const REST_CP = {
  1: 0xE4E3,  // whole
  2: 0xE4E4,  // half
  4: 0xE4E5,  // quarter
  8: 0xE4E6,  // 8th
  16: 0xE4E7, // 16th
  32: 0xE4E8, // 32nd
  64: 0xE4E9, // 64th
};
// Sus baseline'ının oturacağı porte y'si (orta çizgi=88).
//   whole: 4. çizgiden (D5=76) asılır → origin 76
//   diğerleri: orta çizgi (88) — SMuFL origin oraya konunca doğru oturur
export const REST_STAFF_Y = { 1: 76, 2: 88, 4: 88, 8: 88, 16: 88, 32: 88, 64: 88 };

// ── Engraving defaults (staff space) ─────────────────────────────────────────
export const ENGRAVING = {
  stemThickness: 0.12,
  staffLineThickness: 0.13,
  beamThickness: 0.5,
  legerLineThickness: 0.16,
  legerLineExtension: 0.4,
};

export const glyphChar = (cp) => String.fromCodePoint(cp);

// Bir bayrak index'ini güvenli aralığa kıs (5'ten fazla çengel nadirdir).
export const flagIndex = (flagCount) => Math.max(0, Math.min(4, flagCount - 1));
