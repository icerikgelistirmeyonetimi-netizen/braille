// Tone.js piyano motoru detay ayarları (localStorage'da saklanır).
// usePianoNotePreview'daki Tone motoru bunları okur; MuzikScoreToolbar'daki
// "Detay" popup'ı bunları düzenler. ayarlar.js'ten ayrı tutulur (motora özel).

const ANAHTAR = 'tonejs-ses-ayarlari-v1';

export const TONE_SES_VARSAYILAN = {
  release: 1,        // kuyruk süresi (sn) 0.1 – 4
  volume: 0.75,      // ana ses seviyesi (0 – 1)
  reverbAcik: false, // oda yankısı açık mı
  reverbWet: 0.25,   // yankı miktarı (0 – 0.6)
};

let ayar = yukle();

function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return { ...TONE_SES_VARSAYILAN };
    return { ...TONE_SES_VARSAYILAN, ...JSON.parse(ham) };
  } catch {
    return { ...TONE_SES_VARSAYILAN };
  }
}

function kaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(ayar)); } catch { /* yoksay */ }
}

const dinleyiciler = new Set();

export function toneSesAyarlariAl() {
  return { ...ayar };
}

export function toneSesAyariGuncelle(yama) {
  ayar = { ...ayar, ...yama };
  kaydet();
  dinleyiciler.forEach((fn) => fn(ayar));
}

export function toneSesAyarlariDinle(fn) {
  dinleyiciler.add(fn);
  return () => dinleyiciler.delete(fn);
}
