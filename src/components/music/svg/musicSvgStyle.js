// Tüm SVG nota ölçüleri burada sabitlenir
// Porte aralığı = 12px (staff lines: y = 64, 76, 88, 100, 112)
//
// NOT: Nota kafası artık Bravura font glyph'i ile çiziliyor (NoteHead.jsx);
// boyut/şekil orada FONT_SIZE + karşı-ölçek ile yönetilir. Buradaki değerler
// yalnızca çubuk (Stem.jsx) içindir.
const SVG_NOTE = {
  stemLength: 42,
  // SMuFL engravingDefaults.stemThickness = 0.12 staff space × 12 = 1.44
  stemStroke: 1.44,
};

export default SVG_NOTE;
