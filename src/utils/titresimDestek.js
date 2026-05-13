/**
 * Web'de titreşim yalnızca `navigator.vibrate` sunan motorlarda çalışır (Safari iOS yok).
 * Capacitor yerel uygulamada `@capacitor/haptics` kullanılır.
 */
export function webTitresimApiVarMi() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Bu ortamda titreşim beklenmez (özellikle iOS Safari). Yerel kabukta Capacitor varsa umutlu davranırız. */
export function titresimBuOrtamdaBeklenmezMi() {
  if (typeof window !== 'undefined' && window.Capacitor) return false;
  return !webTitresimApiVarMi();
}

export const IOS_TITRESIM_IPUCU =
  'iPhone ve iPad tarayıcılarında web sayfalarına titreşim izni verilmez; titreşim yalnızca Android tarayıcılarında veya yerel uygulama (Capacitor) kurulumunda çalışır.';
