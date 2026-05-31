// Müzik BRF editörü — Braille renk sabitleri ve renk yardımcıları

export const BRAILLE_NOTA_STILI = {
  fill: '#3b82f6',
  soft: '#dbeafe',
};

export const DONANIM_STIL = {
  fill: '#22c55e',
  soft: '#dcfce7',
};

export const ZAMAN_IMZASI_STIL = {
  fill: '#8b5cf6',
  soft: '#ede9fe',
};

export const OLCU_NUMARASI_STIL = {
  fill: '#f59e0b',
  soft: '#fef3c7',
};

export const OLCU_CIZGISI_STIL = {
  fill: '#78716c',
  soft: '#e7e5e4',
};

export const TEKRAR_STIL = {
  fill: '#ef4444',
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

// Her kategori için benzersiz renk — legend'da çakışma olmasın.
// Renk gruplaması (ton sırasıyla):
//   Kırmızı   → accidental
//   Turuncu   → time-signature-change
//   Sarı/Amber→ bar-number
//   Zeytun    → tuplet
//   Yeşil     → key-signature
//   Koyu Yeşil→ key-signature-change
//   Teal      → clef / anahtar
//   Camgöbeği → time-signature
//   Çelik Mavi→ tie
//   Mavi      → nota
//   İndigo    → modifier
//   Mor       → oktav
//   Fuşya     → tempo
//   Pembe     → slur / bag
//   Gül       → sure
//   Kahverengi→ bar-repeat / tekrar
//   Koyu Lacivert → title / composer
//   Slate     → barline / olcu-cizgisi
//   Gri       → sus / rest
//   Nötr Gri  → sign / unknown / diger
export const BRAILLE_CATEGORY_COLORS = {
  // ── Notalar ve ritim ──────────────────────────────────────────────────────
  nota: {
    fill: '#3b82f6',                        // blue-500 — canlı mavi
    soft: 'rgba(59, 130, 246, 0.13)',
    border: '#3b82f6', text: '#0f172a',
  },
  sus: {
    fill: '#94a3b8',                        // slate-400 — soft gri (dinginlik)
    soft: 'rgba(148, 163, 184, 0.18)',
    border: '#94a3b8', text: '#0f172a',
  },
  rest: {                                   // sus ile aynı kavram
    fill: '#94a3b8',
    soft: 'rgba(148, 163, 184, 0.18)',
    border: '#94a3b8', text: '#0f172a',
  },
  oktav: {
    fill: '#8b5cf6',                        // violet-500 — canlı mor
    soft: 'rgba(139, 92, 246, 0.13)',
    border: '#8b5cf6', text: '#0f172a',
  },
  accidental: {
    fill: '#ef4444',                        // red-500 — parlak kırmızı
    soft: 'rgba(239, 68, 68, 0.13)',
    border: '#ef4444', text: '#0f172a',
  },
  tuplet: {
    fill: '#84cc16',                        // lime-400 — limon yeşili
    soft: 'rgba(132, 204, 22, 0.14)',
    border: '#84cc16', text: '#0f172a',
  },
  dot: {
    fill: '#f87171',                        // red-400 — noktalı uzatma (sıcak mercan kırmızı)
    soft: 'rgba(248, 113, 113, 0.15)',
    border: '#f87171', text: '#0f172a',
  },

  // ── Bağlar ───────────────────────────────────────────────────────────────
  tie: {
    fill: '#1d4ed8',                        // blue-700 — koyu lacivert (nota mavisinden ayrı)
    soft: 'rgba(29, 78, 216, 0.13)',
    border: '#1d4ed8', text: '#0f172a',
  },
  slur: {
    fill: '#ec4899',                        // pink-500 — canlı pembe
    soft: 'rgba(236, 72, 153, 0.13)',
    border: '#ec4899', text: '#0f172a',
  },
  bag: {                                    // slur ile aynı kavram
    fill: '#ec4899',
    soft: 'rgba(236, 72, 153, 0.13)',
    border: '#ec4899', text: '#0f172a',
  },

  // ── Zaman / donanım imzaları ──────────────────────────────────────────────
  'time-signature': {
    fill: '#06b6d4',                        // cyan-500 — canlı camgöbeği
    soft: 'rgba(6, 182, 212, 0.13)',
    border: '#06b6d4', text: '#0f172a',
  },
  'time-signature-change': {
    fill: '#f97316',                        // orange-500 — canlı turuncu
    soft: 'rgba(249, 115, 22, 0.14)',
    border: '#f97316', text: '#0f172a',
  },
  'key-signature': {
    fill: '#22c55e',                        // green-500 — canlı yeşil
    soft: 'rgba(34, 197, 94, 0.13)',
    border: '#22c55e', text: '#0f172a',
  },
  'key-signature-change': {
    fill: '#059669',                        // emerald-600 — koyu zümrüt (açık yeşilden ayrı)
    soft: 'rgba(5, 150, 105, 0.14)',
    border: '#059669', text: '#0f172a',
  },
  donanim: {                                // key-signature alias
    fill: '#22c55e',
    soft: 'rgba(34, 197, 94, 0.13)',
    border: '#22c55e', text: '#0f172a',
  },
  'zaman-imzasi': {                         // time-signature alias
    fill: '#06b6d4',
    soft: 'rgba(6, 182, 212, 0.13)',
    border: '#06b6d4', text: '#0f172a',
  },

  // ── Anahtar (clef) ───────────────────────────────────────────────────────
  clef: {
    fill: '#0ea5e9',                        // sky-500 — gökyüzü mavisi
    soft: 'rgba(14, 165, 233, 0.13)',
    border: '#0ea5e9', text: '#0f172a',
  },
  anahtar: {
    fill: '#0ea5e9',
    soft: 'rgba(14, 165, 233, 0.13)',
    border: '#0ea5e9', text: '#0f172a',
  },

  // ── Ölçü çizgileri ve numaralar ───────────────────────────────────────────
  barline: {
    fill: '#78716c',                        // stone-500 — sıcak taş gri
    soft: 'rgba(120, 113, 108, 0.12)',
    border: '#78716c', text: '#0f172a',
  },
  'olcu-cizgisi': {
    fill: '#78716c',
    soft: 'rgba(120, 113, 108, 0.12)',
    border: '#78716c', text: '#0f172a',
  },
  beginrepeat: {
    fill: '#6ee7b7',                        // emerald-300 — tekrar başlangıcı (açık zümrüt)
    soft: 'rgba(110, 231, 183, 0.18)',
    border: '#6ee7b7', text: '#0f172a',
  },
  endrepeat: {
    fill: '#34d399',                        // emerald-400 — tekrar bitişi (koyu zümrüt)
    soft: 'rgba(52, 211, 153, 0.18)',
    border: '#34d399', text: '#0f172a',
  },
  'bar-number': {
    fill: '#f59e0b',                        // amber-400 — parlak altın
    soft: 'rgba(245, 158, 11, 0.15)',
    border: '#f59e0b', text: '#0f172a',
  },
  'olcu-numarasi': {
    fill: '#f59e0b',
    soft: 'rgba(245, 158, 11, 0.15)',
    border: '#f59e0b', text: '#0f172a',
  },
  'bar-repeat': {
    fill: '#be123c',                        // rose-700 — koyu gül kırmızısı
    soft: 'rgba(190, 18, 60, 0.14)',
    border: '#be123c', text: '#0f172a',
  },

  // ── Volta (1. ev / 2. ev) ─────────────────────────────────────────────────
  volta1: {
    fill: '#0284c7',                        // sky-600 — canlı gök mavisi
    soft: 'rgba(2, 132, 199, 0.14)',
    border: '#0284c7', text: '#0f172a',
  },
  volta2: {
    fill: '#d946ef',                        // fuchsia-500 — canlı magenta
    soft: 'rgba(217, 70, 239, 0.14)',
    border: '#d946ef', text: '#0f172a',
  },
  tekrar: {
    fill: '#92400e',                        // amber-800 — koyu kahve-turuncu
    soft: 'rgba(146, 64, 14, 0.14)',
    border: '#92400e', text: '#0f172a',
  },

  // ── Modifier / artikülasyon ───────────────────────────────────────────────
  modifier: {
    fill: '#6366f1',                        // indigo-500 — canlı indigo
    soft: 'rgba(99, 102, 241, 0.13)',
    border: '#6366f1', text: '#0f172a',
  },
  'modifier-oncesi': {
    fill: '#6366f1',
    soft: 'rgba(99, 102, 241, 0.13)',
    border: '#6366f1', text: '#0f172a',
  },
  'modifier-sonrasi': {
    fill: '#a855f7',                        // purple-500 — canlı mor (indigodan ayrı)
    soft: 'rgba(168, 85, 247, 0.13)',
    border: '#a855f7', text: '#0f172a',
  },
  // Nüanslar — oktav morandan (#8b5cf6) açıkça ayrı tonlar
  'nuans-once': {
    fill: '#f59e0b',                        // amber-400 — sıcak altın (staccato, accent, tenuto…)
    soft: 'rgba(245, 158, 11, 0.14)',
    border: '#f59e0b', text: '#0f172a',
  },
  'nuans-sonra': {
    fill: '#0891b2',                        // cyan-600 — soğuk mavi-yeşil (fermata, nefes, caesura…)
    soft: 'rgba(8, 145, 178, 0.14)',
    border: '#0891b2', text: '#0f172a',
  },
  artikulasyon: {
    fill: '#14b8a6',                        // teal-500 — canlı teal
    soft: 'rgba(20, 184, 166, 0.13)',
    border: '#14b8a6', text: '#0f172a',
  },
  susleme: {
    fill: '#7c3aed',                        // violet-600 — tüm süslemeler tek renk
    soft: 'rgba(124, 58, 237, 0.13)',
    border: '#7c3aed', text: '#0f172a',
  },

  // ── Tempo / dinamik / ifade ───────────────────────────────────────────────
  tempo: {
    fill: '#f43f5e',                        // rose-500 — canlı gül kırmızısı
    soft: 'rgba(244, 63, 94, 0.13)',
    border: '#f43f5e', text: '#0f172a',
  },
  dynamic: {
    fill: '#2563eb',                        // blue-600 — tüm dinamikler tek renk
    soft: 'rgba(37, 99, 235, 0.13)',
    border: '#2563eb', text: '#0f172a',
  },
  sure: {
    fill: '#d97706',                        // amber-600 — koyu amber
    soft: 'rgba(217, 119, 6, 0.13)',
    border: '#d97706', text: '#0f172a',
  },

  // ── Başlık / besteci / meta ───────────────────────────────────────────────
  title: {
    fill: '#0f172a',                        // slate-950 — neredeyse siyah
    soft: 'rgba(15, 23, 42, 0.11)',
    border: '#0f172a', text: '#f8fafc',
  },
  composer: {
    fill: '#334155',                        // slate-700 — koyu slate
    soft: 'rgba(51, 65, 85, 0.11)',
    border: '#334155', text: '#0f172a',
  },
  'header-meta': {
    fill: '#7e22ce',                        // purple-800 — derin mor (ayrı tondan)
    soft: 'rgba(126, 34, 206, 0.13)',
    border: '#7e22ce', text: '#0f172a',
  },

  // ── Genel / bilinmeyen ────────────────────────────────────────────────────
  sign: {
    fill: '#52525b',                        // zinc-600 — nötr gri
    soft: 'rgba(82, 82, 91, 0.10)',
    border: '#52525b', text: '#0f172a',
  },
  diger: {
    fill: '#6b7280',                        // gray-500 — serin gri
    soft: 'rgba(107, 114, 128, 0.10)',
    border: '#6b7280', text: '#0f172a',
  },
  unknown: {
    fill: '#9ca3af',                        // gray-400 — açık gri
    soft: 'rgba(156, 163, 175, 0.10)',
    border: '#9ca3af', text: '#0f172a',
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
