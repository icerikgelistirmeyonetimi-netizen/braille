// Müzik BRF editörü — UI ve skor layout sabitleri
import {
  NOTALAR as MUZIK_TEMEL_NOTALAR,
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
  MUZIK_BOLUMLER,
  MUZIK_SEMBOLLERI,
} from '../../data/muzik.js';
import { MUZIK_NOTA_IKON } from '../music/index.js';

// Süre seçici buton metinleri (sekizlik, dörtlük, yarım, tam, 16, 32, 64)
export const SURE_KISA = ['♪', '♩', '𝅗𝅥', '𝅝', '𝅘𝅥𝅮', '𝅘𝅥𝅯', '𝅘𝅥𝅰'];
export const MUZIK_VARSAYILAN_ZAMAN_IMZASI = '4/4';

// Sadece SVG skor görünümü için layout sabitleri.
// Anahtar, donanım ve zaman imzası nota dizisinden bağımsız çizilir.
export const SVG_SLOT = 45;

// StaffLines x1=24, x2=776.
export const SVG_STAFF_LEFT_X = 24;
export const SVG_STAFF_RIGHT_X = 776;

// Sağ güvenli sınır.
export const SVG_SAG_SINIR_X = 735;

// Anahtar ve başlık alanı.
export const SVG_CLEF_X = 40;
export const SVG_KEY_SIGNATURE_X = 70;
export const SVG_KEY_ACCIDENTAL_GAP = 7;
export const SVG_TIME_SIGNATURE_GAP = 0;
export const SVG_AFTER_HEADER_GAP = 5;

export const MUZIK_CLEF_VISUAL_Y_OFFSETS = {
  treble: 0,
  bass: -24,
  alto: -12,
  tenor: -12,
  default: 0,
};

export const MUZIK_CLEF_MIDDLE_C_Y = {
  treble: 124,
  bass: 76,
  alto: 88,
  tenor: 88,
  default: 124,
};

// Diğer satırlarda notaların başladığı x.
export const SVG_NOTE_START_X = 70;

// Ölçü paketleme değerleri.
export const SVG_ROW_RIGHT_PAD = 14;
export const SVG_MEASURE_GAP = 10;
export const SVG_MEASURE_LEFT_PAD = 25;
export const SVG_MEASURE_RIGHT_PAD = 25;
export const SVG_SCORE_BRAILLE_Y_OFFSET = 150;
export const SVG_SCORE_BRAILLE_NOTE_GAP = 42;

// Satır yüksekliği ve SVG viewBox yüksekliği.
export const SVG_ROW_HEIGHT = 340;
export const SVG_ROW_VIEWBOX_Y = -20;

// Ölçü genişliği sınırları.
// Tekli ölçüler kompakt; çok notalı ölçüler rahat.
export const SVG_MEASURE_MIN_WIDTH = 86;
export const SVG_MEASURE_MAX_WIDTH = 238;

// Yoğun ölçü: çok fazla nota/beam varsa tek satır alabilir.
export const SVG_DENSE_VISIBLE_COUNT = 18;
export const SVG_DENSE_BEAM_COUNT = 8;
export const SVG_DENSE_MEASURE_MAX_WIDTH = 650;

// Ölçü içi aralıklar.
// Standart: tekli olmayan ölçüler sıkışmasın.
export const SVG_SINGLE_ITEM_GAP = 20;
export const SVG_NORMAL_ITEM_GAP = 55;
export const SVG_DENSE_ITEM_GAP = 45;

// Sadece otomatik sus ölçüleri dar tutulur.
export const SVG_AUTO_REST_MEASURE_WIDTH = 48;
export const SVG_AUTO_REST_ITEM_GAP = 12;

// Tekli notalı ölçüler gereksiz büyümesin.
export const SVG_SINGLE_NOTE_MEASURE_WIDTH = 80;

// Çok boş satır üretmeyi engellemek için.
export const SVG_MIN_SATIR_KAPASITESI = 1;

export const BRAILLE_DOT_COORDS_COMPACT = {
  1: [10, 10],
  2: [10, 18],
  3: [10, 26],
  7: [10, 34],
  4: [18, 10],
  5: [18, 18],
  6: [18, 26],
  8: [18, 34],
};

export const BRAILLE_MINI_BOYUTLAR = [
  {
    cellW: 16,
    svgW: 15,
    svgH: 25,
    col1: 5,
    col2: 10,
    rows: [4, 9.4, 14.8, 20.2],
    activeR: 1.75,
    passiveR: 1.35,
    labelFont: 6.2,
  },
  {
    cellW: 14,
    svgW: 13,
    svgH: 23,
    col1: 4.4,
    col2: 8.8,
    rows: [3.8, 8.6, 13.4, 18.2],
    activeR: 1.55,
    passiveR: 1.2,
    labelFont: 5.4,
  },
  {
    cellW: 12,
    svgW: 12,
    svgH: 21,
    col1: 4,
    col2: 8,
    rows: [3.5, 8, 12.5, 17],
    activeR: 1.35,
    passiveR: 1.05,
    labelFont: 4.8,
  },
];

export const BRAILLE_HUCRE_TEMA = {
  normal: {
    cellW: 24,
    svgW: 18,
    svgH: 28,
    col1: 5.5,
    col2: 12.5,
    rows: [4.5, 10.8, 17.1, 23.4],
    activeR: 2.05,
    passiveR: 1.35,
    labelFont: 10,
  },
  compact: {
    cellW: 20,
    svgW: 16,
    svgH: 26,
    col1: 5,
    col2: 11,
    rows: [4.2, 10, 15.8, 21.6],
    activeR: 1.85,
    passiveR: 1.25,
    labelFont: 9,
  },
  tight: {
    cellW: 17,
    svgW: 14,
    svgH: 24,
    col1: 4.2,
    col2: 9.4,
    rows: [3.8, 9, 14.2, 19.4],
    activeR: 1.65,
    passiveR: 1.15,
    labelFont: 8,
  },
};

// Süre kartları metadata
export const SURE_KARTLARI = [
  { idx: 0, sembol: '♪', etiket: 'Sekizlik' },
  { idx: 1, sembol: '♩', etiket: 'Dörtlük' },
  { idx: 2, sembol: '𝅗𝅥', etiket: 'Yarım' },
  { idx: 3, sembol: '𝅝', etiket: 'Tam' },
  { idx: 4, sembol: '16', etiket: '16’lık' },
  { idx: 5, sembol: '32', etiket: '32’lik' },
  { idx: 6, sembol: '64', etiket: '64’lük' },
];

// Editör araç çubuğu — eğitim verisinden bağımsız tek seviye düz ikon listesi.
// 'sure', 'notalar', 'sus' palette kategorileri olarak görünür; geri kalanı araçlar.
export const MUSIC_EDITOR_TOOLBAR = [
  { id: 'sure', icon: '♩', label: 'Süre' },
  { id: 'notalar', icon: '♪', label: 'Nota' },
  { id: 'sus', icon: '𝄽', label: 'Sus' },
  { id: 'bag-tie', icon: '⌒', label: 'Tie' },
  { id: 'bag-slur', icon: '︵', label: 'Slur' },
  { id: 'dinamikler', icon: '𝒇', label: 'Dinamik', italic: true },
  { id: 'expression', icon: 'T', label: 'İfade' },
  { id: 'suslemeler', icon: 'tr', label: 'Süsleme', italic: true },
  { id: 'duzensiz-gruplar', icon: '³', label: 'Tuplet' },
  { id: 'tekrar', icon: '𝄆', label: 'Tekrar' },
  { id: 'olcu-cizgileri', icon: '𝄂', label: 'Bitiş' },
];

export function veriBolumAl(slug) {
  return (MUZIK_BOLUMLER.find((b) => b.slug === slug)?.veri) || [];
}

// Modül 8 Bölüm 4 — Donanım listesi (header'a yazılır)
export const DONANIM_LISTESI = (MUZIK_BOLUMLER.find((b) => b.slug === 'donanim')?.veri) || [];

// Anahtarlar (sol/fa) — toolbar'dan kaldırıldı, SVG'de otomatik eklenir ve
// üzerine tıklanınca popup ile değiştirilebilir.
export const MUZIK_EDITOR_ANAHTARLAR = MUZIK_SEMBOLLERI
  .filter((oge) => /anahtar/i.test(oge.ad))
  .map((oge) => ({ ...oge, tip: 'anahtar', kategori: 'Anahtarlar', gorunum: oge.sembol || oge.ad }));

export const MUZIK_EDITOR_VARSAYILAN_ANAHTAR =
  MUZIK_EDITOR_ANAHTARLAR.find((a) => /sol/i.test(a.ad)) || MUZIK_EDITOR_ANAHTARLAR[0] || null;

export function anahtarEkliMi(ogeler) {
  return Array.isArray(ogeler) && ogeler.length > 0 && ogeler[0]?.tip === 'anahtar';
}

// 'sure' grubu — palette içinde süre seçimi (özel davranış: seciliSureIdx + auto-switch notalar'a)
export const MUZIK_EDITOR_SURE_GRUBU = {
  slug: 'sure',
  baslik: 'Süre',
  ogeler: MUZIK_SURE_GOSTERGELERI.map((sure, idx) => ({
    ...sure,
    tip: 'sure-buton',
    kategori: 'Süre',
    gorunum: SURE_KISA[idx] || sure.sembol,
    indeks: idx,
  })),
};

// 'notalar' grubu — temel notalar palette içinde gösterilir (özel davranış: notaEkle)
export const MUZIK_EDITOR_NOTA_GRUBU = {
  slug: 'notalar',
  baslik: 'Notalar',
  ogeler: MUZIK_TEMEL_NOTALAR.map((nota) => ({
    ...nota,
    tip: 'nota-buton',
    kategori: 'Notalar',
    gorunum: MUZIK_NOTA_IKON[nota.ad] || nota.ad,
  })),
};

export const MUZIK_EDITOR_PALET_GRUPLARI = [
  MUZIK_EDITOR_SURE_GRUBU,
  MUZIK_EDITOR_NOTA_GRUBU,
  ...MUZIK_BOLUMLER
    .filter((bolum) => bolum.slug !== 'notalar' && bolum.slug !== 'sureler')
    .map((bolum) => ({
      slug: bolum.slug,
      baslik: bolum.kisaBaslik,
      ogeler: (bolum.veri || []).map((oge) => ({
        ...oge,
        tip: bolum.slug === 'sus' ? 'sus' : 'isaret',
        kategori: bolum.kisaBaslik,
        gorunum: oge.sembol || oge.okumaOzeti || oge.ad,
      })),
    })),
];
