/**
 * iPhone / iPad Safari ve diğer iOS tarayıcıları (hepsi WebKit) kök HTML öğesinde
 * tam ekran API'sini desteklemez; PWA olarak Ana Ekrana Eklendiğinde manifest
 * `display: fullscreen` ile yaklaşılabilir.
 */
export function iosVeyaIpadosTarayiciMi() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/u.test(ua)) return true;
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

/** Tarayıcı kök öğede tam ekran isteğini gerçekten işleyebilir mi (Chrome/Android masaüstü vb.). */
export function tamEkranApiDestekleniyorMu() {
  if (typeof document === 'undefined') return false;
  if (iosVeyaIpadosTarayiciMi()) return false;
  try {
    const el = document.documentElement;
    const fn = el.requestFullscreen || el.webkitRequestFullscreen;
    if (typeof fn !== 'function') return false;
    const enabled = document.fullscreenEnabled ?? document.webkitFullscreenEnabled;
    if (enabled === false) return false;
    return true;
  } catch (_) {
    return false;
  }
}

export const IOS_TAM_EKRAN_IPUCU =
  'iPhone ve iPad tarayıcılarında tam ekran düğmesi çalışmaz. Tam ekrana yakın kullanım için: Paylaş → Ana Ekrana Ekle (veya yükle menüsünden uygulama gibi açın).';
