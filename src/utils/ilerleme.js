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

// ── Eğitim indeksi (nerede kaldı) ──────────────────────────────
const INDEKS_ANAHTAR = 'braille-indeks-v1';

function indeksYukle() {
  try { return JSON.parse(localStorage.getItem(INDEKS_ANAHTAR) || '{}'); } catch { return {}; }
}
function indeksKaydetLocal(obj) {
  try { localStorage.setItem(INDEKS_ANAHTAR, JSON.stringify(obj)); } catch {}
}

export function indeksKaydet(anahtar, indeks) {
  if (!anahtar) return;
  const v = indeksYukle();
  v[anahtar] = indeks;
  indeksKaydetLocal(v);
}

export function indeksAl(anahtar) {
  if (!anahtar) return 0;
  return indeksYukle()[anahtar] || 0;
}

// ── Daha sonra öğren ───────────────────────────────────────────
const SONRA_ANAHTAR = 'braille-sonra-ogren-v1';

function sonraYukle() {
  try { return JSON.parse(localStorage.getItem(SONRA_ANAHTAR) || '{}'); } catch { return {}; }
}
function sonraKaydetLocal(obj) {
  try { localStorage.setItem(SONRA_ANAHTAR, JSON.stringify(obj)); } catch {}
}

export function sonraOgrenKaydet(anahtar, oge) {
  const v = sonraYukle();
  if (!v[anahtar]) v[anahtar] = [];
  if (!v[anahtar].includes(oge)) v[anahtar].push(oge);
  sonraKaydetLocal(v);
}

export function sonraOgrenKaldir(anahtar, oge) {
  const v = sonraYukle();
  if (!v[anahtar]) return;
  v[anahtar] = v[anahtar].filter((x) => x !== oge);
  sonraKaydetLocal(v);
}

export function sonraOgrenAl(anahtar) {
  return sonraYukle()[anahtar] || [];
}

export function sonraOgrenTumunuAl() {
  return sonraYukle();
}
