// Kullanıcı ayarları (localStorage'da saklanır) ve global olay yayını.

const ANAHTAR = 'braille-ayarlar-v1';

const VARSAYILAN = {
  konusmaHizi: 0.95,   // 0.5 - 1.5
  yaziBoyutu: 17,      // px (16 - 32)
  sesAcik: true,
  titresimAcik: true,
  tema: 'normal',      // 'normal' | 'lowVision'
  gizliModuller: []    // gizlenen modüllerin id listesi
};

// Eski tema isimlerini yeni şemaya çevir (geri uyumluluk).
function temayiNormalleştir(t) {
  if (t === 'lowVision' || t === 'normal') return t;
  if (t === 'dark') return 'lowVision';
  if (t === 'light') return 'normal';
  return 'normal';
}

let ayarlar = yukle();

function yukle() {
  try {
    const ham = localStorage.getItem(ANAHTAR);
    if (!ham) return { ...VARSAYILAN };
    const okunan = { ...VARSAYILAN, ...JSON.parse(ham) };
    okunan.tema = temayiNormalleştir(okunan.tema);
    return okunan;
  } catch {
    return { ...VARSAYILAN };
  }
}

function kaydet() {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(ayarlar)); } catch {}
}

const dinleyiciler = new Set();

export function ayarlariAl() {
  return { ...ayarlar };
}

export function ayarGuncelle(yama) {
  ayarlar = { ...ayarlar, ...yama };
  kaydet();
  uygulaCss();
  dinleyiciler.forEach((fn) => fn(ayarlar));
}

export function ayarlariSifirla() {
  ayarlar = { ...VARSAYILAN };
  kaydet();
  uygulaCss();
  dinleyiciler.forEach((fn) => fn(ayarlar));
}

export function ayarlariDinle(fn) {
  dinleyiciler.add(fn);
  return () => dinleyiciler.delete(fn);
}

export function uygulaCss() {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty(
    '--font-base',
    `${ayarlar.yaziBoyutu}px`
  );
  document.documentElement.setAttribute('data-theme', ayarlar.tema || 'normal');
}

uygulaCss();
