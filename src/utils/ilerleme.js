// Bölüm bazında ilerleme kaydı (localStorage).
const ANAHTAR = 'braille-ilerleme-v1';

function yukle() {
  try {
    return JSON.parse(localStorage.getItem(ANAHTAR) || '{}');
  } catch {
    return {};
  }
}

function kaydet(obj) {
  try { localStorage.setItem(ANAHTAR, JSON.stringify(obj)); } catch {}
}

/**
 * Bir öğeyi öğrenildi olarak işaretle.
 * @param {string} bolum   örn. 'harfler'
 * @param {string} oge     örn. 'A'
 */
export function ogrenildiIsaretle(bolum, oge) {
  const v = yukle();
  if (!v[bolum]) v[bolum] = [];
  if (!v[bolum].includes(oge)) v[bolum].push(oge);
  kaydet(v);
}

export function ilerlemeyiAl(bolum) {
  const v = yukle();
  return v[bolum] || [];
}

export function tumIlerlemeyiAl() {
  return yukle();
}

export function bolumuSifirla(bolum) {
  const v = yukle();
  delete v[bolum];
  kaydet(v);
}

export function tumIlerlemeyiSifirla() {
  kaydet({});
}
