// Müzik BRF editörü — Braille renk sabitleri ve renk yardımcıları

export const BRAILLE_NOTA_STILI = {
  fill: '#2563eb',
  soft: '#dbeafe',
};

export const DONANIM_STIL = {
  fill: '#16a34a',
  soft: '#dcfce7',
};

export const ZAMAN_IMZASI_STIL = {
  fill: '#7c3aed',
  soft: '#ede9fe',
};

export const OLCU_NUMARASI_STIL = {
  fill: '#2563eb',
  soft: '#dbeafe',
};

export const OLCU_CIZGISI_STIL = {
  fill: '#475569',
  soft: '#e2e8f0',
};

export const TEKRAR_STIL = {
  fill: '#dc2626',
  soft: '#fee2e2',
};

export const BRAILLE_COLOR_PALETTE = [
  { fill: '#ef4444', soft: '#fee2e2' },
  { fill: '#10b981', soft: '#d1fae5' },
  { fill: '#8b5cf6', soft: '#ede9fe' },
  { fill: '#f97316', soft: '#ffedd5' },
  { fill: '#06b6d4', soft: '#cffafe' },
  { fill: '#ec4899', soft: '#fce7f3' },
  { fill: '#eab308', soft: '#fef9c3' },
  { fill: '#22c55e', soft: '#dcfce7' },
  { fill: '#a855f7', soft: '#f3e8ff' },
  { fill: '#f43f5e', soft: '#ffe4e6' },
  { fill: '#14b8a6', soft: '#ccfbf1' },
  { fill: '#f59e0b', soft: '#fef3c7' },
];

// Lejant ve braille hücreleri için kategori bazlı, yüksek zıtlıklı renkler.
// Oktav işaretleri ve yardımcı ölçü işaretleri ayrı renklendirilir.
export const BRAILLE_ACTIVE_GREEN = '#22c55e';
export const BRAILLE_ACTIVE_GREEN_BG = 'rgba(34, 197, 94, 0.18)';
export const BRAILLE_ACTIVE_GREEN_BG_STRONG = 'rgba(34, 197, 94, 0.26)';

export const BRAILLE_CATEGORY_COLORS = {
  nota: {
    fill: '#2563eb',
    soft: 'rgba(37, 99, 235, 0.10)',
    border: '#2563eb',
    text: '#0f172a',
  },
  sus: {
    fill: '#64748b',
    soft: 'rgba(100, 116, 139, 0.12)',
    border: '#64748b',
    text: '#0f172a',
  },
  oktav: {
    fill: '#7c3aed',
    soft: 'rgba(124, 58, 237, 0.12)',
    border: '#7c3aed',
    text: '#0f172a',
  },
  accidental: {
    fill: '#dc2626',
    soft: 'rgba(220, 38, 38, 0.12)',
    border: '#dc2626',
    text: '#0f172a',
  },
  'time-signature': {
    fill: '#0891b2',
    soft: 'rgba(8, 145, 178, 0.12)',
    border: '#0891b2',
    text: '#0f172a',
  },
  'time-signature-change': {
    fill: '#f97316',
    soft: 'rgba(249, 115, 22, 0.14)',
    border: '#f97316',
    text: '#0f172a',
  },
  'key-signature': {
    fill: '#16a34a',
    soft: 'rgba(22, 163, 74, 0.12)',
    border: '#16a34a',
    text: '#0f172a',
  },
  'key-signature-change': {
    fill: '#a21caf',
    soft: 'rgba(162, 28, 175, 0.14)',
    border: '#a21caf',
    text: '#0f172a',
  },
  clef: {
    fill: '#0f766e',
    soft: 'rgba(15, 118, 110, 0.12)',
    border: '#0f766e',
    text: '#0f172a',
  },
  anahtar: {
    fill: '#0f766e',
    soft: 'rgba(15, 118, 110, 0.12)',
    border: '#0f766e',
    text: '#0f172a',
  },
  'bar-number': {
    fill: '#ca8a04',
    soft: 'rgba(202, 138, 4, 0.14)',
    border: '#ca8a04',
    text: '#0f172a',
  },
  'bar-repeat': {
    fill: '#78350f',
    soft: 'rgba(120, 53, 15, 0.14)',
    border: '#78350f',
    text: '#0f172a',
  },
  tie: {
    fill: '#111827',
    soft: 'rgba(17, 24, 39, 0.10)',
    border: '#111827',
    text: '#0f172a',
  },
  slur: {
    fill: '#db2777',
    soft: 'rgba(219, 39, 119, 0.12)',
    border: '#db2777',
    text: '#0f172a',
  },
  bag: {
    fill: '#db2777',
    soft: 'rgba(219, 39, 119, 0.12)',
    border: '#db2777',
    text: '#0f172a',
  },
  tuplet: {
    fill: '#84cc16',
    soft: 'rgba(132, 204, 22, 0.14)',
    border: '#84cc16',
    text: '#0f172a',
  },
  modifier: {
    fill: '#4f46e5',
    soft: 'rgba(79, 70, 229, 0.12)',
    border: '#4f46e5',
    text: '#0f172a',
  },
  'modifier-oncesi': {
    fill: '#4f46e5',
    soft: 'rgba(79, 70, 229, 0.12)',
    border: '#4f46e5',
    text: '#0f172a',
  },
  'modifier-sonrasi': {
    fill: '#8b5cf6',
    soft: 'rgba(139, 92, 246, 0.12)',
    border: '#8b5cf6',
    text: '#0f172a',
  },
  tempo: {
    fill: '#e11d48',
    soft: 'rgba(225, 29, 72, 0.12)',
    border: '#e11d48',
    text: '#0f172a',
  },
  sure: {
    fill: '#f97316',
    soft: 'rgba(249, 115, 22, 0.12)',
    border: '#f97316',
    text: '#0f172a',
  },
  donanim: {
    fill: '#16a34a',
    soft: 'rgba(22, 163, 74, 0.12)',
    border: '#16a34a',
    text: '#0f172a',
  },
  'zaman-imzasi': {
    fill: '#0891b2',
    soft: 'rgba(8, 145, 178, 0.12)',
    border: '#0891b2',
    text: '#0f172a',
  },
  diger: {
    fill: '#334155',
    soft: 'rgba(51, 65, 85, 0.10)',
    border: '#334155',
    text: '#0f172a',
  },
  'olcu-numarasi': {
    fill: '#ca8a04',
    soft: 'rgba(202, 138, 4, 0.14)',
    border: '#ca8a04',
    text: '#0f172a',
  },
  'olcu-cizgisi': {
    fill: '#475569',
    soft: 'rgba(71, 85, 105, 0.10)',
    border: '#475569',
    text: '#0f172a',
  },
  tekrar: {
    fill: '#a16207',
    soft: 'rgba(161, 98, 7, 0.14)',
    border: '#a16207',
    text: '#0f172a',
  },
  artikulasyon: {
    fill: '#4f46e5',
    soft: 'rgba(79, 70, 229, 0.12)',
    border: '#4f46e5',
    text: '#0f172a',
  },
  diger: {
    fill: '#334155',
    soft: 'rgba(51, 65, 85, 0.10)',
    border: '#334155',
    text: '#0f172a',
  },
  title: {
    fill: '#334155',
    soft: 'rgba(51, 65, 85, 0.10)',
    border: '#334155',
    text: '#0f172a',
  },
  composer: {
    fill: '#475569',
    soft: 'rgba(71, 85, 105, 0.10)',
    border: '#475569',
    text: '#0f172a',
  },
  'header-meta': {
    fill: '#0f766e',
    soft: 'rgba(15, 118, 110, 0.12)',
    border: '#0f766e',
    text: '#0f172a',
  },
  rest: {
    fill: '#64748b',
    soft: 'rgba(100, 116, 139, 0.12)',
    border: '#64748b',
    text: '#0f172a',
  },
  sign: {
    fill: '#525252',
    soft: 'rgba(82, 82, 82, 0.10)',
    border: '#525252',
    text: '#0f172a',
  },
  unknown: {
    fill: '#71717a',
    soft: 'rgba(113, 113, 122, 0.10)',
    border: '#71717a',
    text: '#0f172a',
  },
};

export const BRAILLE_KATEGORI_STIL = BRAILLE_CATEGORY_COLORS;
export const ANAHTAR_STIL = BRAILLE_CATEGORY_COLORS.anahtar;

export function normalizeColorStyle(style = {}) {
  return {
    fill: style?.fill || '#64748b',
    soft: style?.soft || 'rgba(100, 116, 139, 0.12)',
    border: style?.border || style?.fill || '#64748b',
    text: style?.text || '#0f172a',
  };
}

export const normalizeBrailleColorStyle = normalizeColorStyle;

export function brailleHexToRgba(hex, alpha = 0.16) {
  const temiz = String(hex || '').replace('#', '').trim();

  if (!/^[0-9a-f]{6}$/i.test(temiz)) {
    return `rgba(100, 116, 139, ${alpha})`;
  }

  const r = parseInt(temiz.slice(0, 2), 16);
  const g = parseInt(temiz.slice(2, 4), 16);
  const b = parseInt(temiz.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function brailleHashText(text = '') {
  let h = 17;
  for (let i = 0; i < text.length; i += 1) {
    h = ((h * 31) + text.charCodeAt(i)) >>> 0;
  }
  return h;
}
