// Sesli yönerge (native TTS varsa onu, yoksa Web Speech API'yi kullanır)
// ve titreşim yardımcıları.
import { ayarlariAl } from './ayarlar.js';

let nativeTTS = null;
let nativeHaptics = null;
let nativePlatform = false;

// Capacitor varsa (APK içinde) native plugin'leri yükle
try {
  if (typeof window !== 'undefined' && window.Capacitor) {
    nativePlatform =
      window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform();
    if (nativePlatform) {
      import('@capacitor-community/text-to-speech')
        .then((m) => { nativeTTS = m.TextToSpeech; })
        .catch(() => { /* yok say */ });
      import('@capacitor/haptics')
        .then((m) => { nativeHaptics = m.Haptics; })
        .catch(() => { /* yok say */ });
    }
  }
} catch (_) { /* yok say */ }

let tercihEdilenSes = null;
let sesKilidiAcildi = false;
let _pendingSpeakTimer = null;

function sesleriYukle() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const sesler = window.speechSynthesis.getVoices();
  tercihEdilenSes =
    sesler.find((s) => s.lang === 'tr-TR') ||
    sesler.find((s) => s.lang && s.lang.startsWith('tr')) ||
    null;
}

// İlk kullanıcı dokunuşunda mobil tarayıcılarda ses motorunu "uyandır".
// Chrome/Safari mobile, ilk gesture olmadan speechSynthesis.speak()'i
// sessizce engeller. Boş bir utterance göndererek kilidi açıyoruz.
function sesKilidiniAc() {
  if (sesKilidiAcildi) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    u.lang = 'tr-TR';
    window.speechSynthesis.speak(u);
    sesKilidiAcildi = true;
  } catch (_) { /* yok say */ }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  sesleriYukle();
  window.speechSynthesis.onvoiceschanged = sesleriYukle;

  const olaylar = ['touchstart', 'pointerdown', 'click', 'keydown'];
  const acVeKaldir = () => {
    sesKilidiniAc();
    olaylar.forEach((o) => window.removeEventListener(o, acVeKaldir));
  };
  olaylar.forEach((o) =>
    window.addEventListener(o, acVeKaldir, { once: false, passive: true })
  );
}

/**
 * Verilen metni Türkçe sesle okur.
 * @param {string} metin
 * @param {{ kesintiyle?: boolean, hiz?: number, onSon?: () => void }} [opt]
 */
export function konus(metin, opt = {}) {
  const a = ayarlariAl();
  if (!a.sesAcik) {
    // Ses kapalıysa bile akış kırılmasın diye onSon yine tetiklensin
    if (opt && typeof opt.onSon === 'function') {
      setTimeout(() => { try { opt.onSon(); } catch (_) {} }, 0);
    }
    return;
  }
  const { kesintiyle = true, hiz, onSon } = opt;

  // Native (Android APK) yolu
  if (nativePlatform && nativeTTS) {
    (async () => {
      try {
        if (kesintiyle) {
          try { await nativeTTS.stop(); } catch (_) { /* */ }
        }
        await nativeTTS.speak({
          text: metin,
          lang: 'tr-TR',
          rate: hiz ?? a.konusmaHizi,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient'
        });
      } catch (_) { /* yok say */ }
      if (typeof onSon === 'function') {
        try { onSon(); } catch (_) { /* */ }
      }
    })();
    return;
  }

  // Web Speech API yolu
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (typeof onSon === 'function') {
      setTimeout(() => { try { onSon(); } catch (_) {} }, 0);
    }
    return;
  }
  const u = new SpeechSynthesisUtterance(metin);
  u.lang = 'tr-TR';
  u.rate = hiz ?? a.konusmaHizi;
  u.pitch = 1;
  if (tercihEdilenSes) u.voice = tercihEdilenSes;
  if (typeof onSon === 'function') {
    let bittiCagrildi = false;
    const son = () => {
      if (bittiCagrildi) return;
      bittiCagrildi = true;
      try { onSon(); } catch (_) { /* */ }
    };
    u.onend = son;
    // onerror'u yalnızca gerçek hatada tetikle, cancel sonrası 'interrupted' sayılmasın
    u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') son(); };
  }
  if (kesintiyle) {
    // Chrome'da cancel() hemen ardından speak() bazen sessizce düşüyor;
    // 60ms gecikme bu yarış koşulunu önler.
    if (_pendingSpeakTimer) { clearTimeout(_pendingSpeakTimer); _pendingSpeakTimer = null; }
    window.speechSynthesis.cancel();
    _pendingSpeakTimer = setTimeout(() => {
      _pendingSpeakTimer = null;
      window.speechSynthesis.speak(u);
    }, 60);
  } else {
    window.speechSynthesis.speak(u);
  }
}

export function konusmayiDurdur() {
  if (nativePlatform && nativeTTS) {
    try { nativeTTS.stop(); } catch (_) { /* */ }
    return;
  }
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
}

/**
 * Cihaz destekliyorsa titreşim verir.
 * @param {number | number[]} desen
 */
export function titret(desen = 80) {
  const a = ayarlariAl();
  if (!a.titresimAcik) return;

  // Native haptics (Android APK)
  if (nativePlatform && nativeHaptics) {
    try {
      const sure = Array.isArray(desen)
        ? desen.reduce((t, v) => t + v, 0)
        : desen;
      nativeHaptics.vibrate({ duration: Math.min(sure, 500) });
      return;
    } catch (_) { /* */ }
  }

  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(desen); } catch (_) { /* yok say */ }
  }
}

export function basariBildir(metin = 'Tebrikler, doğru!') {
  konus(metin);
}

export function hataBildir(metin = 'Yanlış, tekrar deneyin.') {
  konus(metin);
}
