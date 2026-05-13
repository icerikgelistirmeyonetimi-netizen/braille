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
let tercihEdilenIngilizceSes = null;
let tercihEdilenAlmancaSes = null;
let tercihEdilenFransizcaSes = null;
let sesKilidiAcildi = false;
let _pendingSpeakTimer = null;

/** Chrome bazen ilk çağrıda boş liste döner; iki kez okumak yardımcı olabilir */
function tumSesleriAl() {
  const syn = window.speechSynthesis;
  let list = syn.getVoices();
  if (list.length === 0) list = syn.getVoices();
  return list;
}

/**
 * İngilizce okuma için uygun sesi seçer (lang veya ses adına göre).
 * Türkiye yerel ayarında çoğu motor varsayılanı Türkçe olduğu için `lang` tek başına yetmez.
 */
function ingilizceSesiSec() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const sesler = tumSesleriAl();
  let enIyisi = null;
  let enSkor = 0;
  for (let i = 0; i < sesler.length; i++) {
    const s = sesler[i];
    const lang = (s.lang || '').replace('_', '-').toLowerCase().trim();
    const name = (s.name || '').toLowerCase();
    let skor = 0;
    if (lang.startsWith('en')) {
      if (lang === 'en-us' || lang.startsWith('en-us')) skor = 100;
      else if (lang.startsWith('en-gb')) skor = 96;
      else skor = 88;
    } else if (!lang) {
      if (/\benglish\b|\(united states\)|\(united kingdom\)|american english|uk english/i.test(name)) skor = 74;
    } else if (/\benglish\b/.test(name) || /\benglish\s*\(/.test(name)) {
      skor = 75;
    } else if (/microsoft .*english|google .*english|english united/i.test(name)) {
      skor = 72;
    }
    if (skor > enSkor) {
      enSkor = skor;
      enIyisi = s;
    }
  }
  return enSkor >= 68 ? enIyisi : null;
}

/** Almanca okuma için uygun ses (lang veya ses adına göre). */
function almancaSesiSec() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const sesler = tumSesleriAl();
  let enIyisi = null;
  let enSkor = 0;
  for (let i = 0; i < sesler.length; i++) {
    const s = sesler[i];
    const lang = (s.lang || '').replace('_', '-').toLowerCase().trim();
    const name = (s.name || '').toLowerCase();
    let skor = 0;
    if (lang.startsWith('de')) {
      if (lang === 'de-de' || lang.startsWith('de-de')) skor = 100;
      else if (lang.startsWith('de-at')) skor = 96;
      else if (lang.startsWith('de-ch')) skor = 94;
      else skor = 88;
    } else if (!lang) {
      if (/\bgerman\b|\bdeutsch\b|\(germany\)/i.test(name)) skor = 74;
    } else if (/\bgerman\b|\bdeutsch\b/i.test(name)) {
      skor = 73;
    }
    if (skor > enSkor) {
      enSkor = skor;
      enIyisi = s;
    }
  }
  return enSkor >= 68 ? enIyisi : null;
}

/** Fransızca okuma için uygun ses (lang veya ses adına göre). */
function fransizcaSesiSec() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const sesler = tumSesleriAl();
  let enIyisi = null;
  let enSkor = 0;
  for (let i = 0; i < sesler.length; i++) {
    const s = sesler[i];
    const lang = (s.lang || '').replace('_', '-').toLowerCase().trim();
    const name = (s.name || '').toLowerCase();
    let skor = 0;
    if (lang.startsWith('fr')) {
      if (lang === 'fr-fr' || lang.startsWith('fr-fr')) skor = 100;
      else if (lang.startsWith('fr-ca')) skor = 94;
      else if (lang.startsWith('fr-be') || lang.startsWith('fr-ch')) skor = 92;
      else skor = 88;
    } else if (!lang) {
      if (/\bfrench\b|\bfrançais\b|\(france\)/i.test(name)) skor = 74;
    } else if (/\bfrench\b|\bfrançais\b/i.test(name)) {
      skor = 73;
    }
    if (skor > enSkor) {
      enSkor = skor;
      enIyisi = s;
    }
  }
  return enSkor >= 68 ? enIyisi : null;
}

function sesleriYukle() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const sesler = tumSesleriAl();
  tercihEdilenSes =
    sesler.find((s) => s.lang === 'tr-TR') ||
    sesler.find((s) => s.lang && s.lang.startsWith('tr')) ||
    null;
  tercihEdilenIngilizceSes = ingilizceSesiSec();
  tercihEdilenAlmancaSes = almancaSesiSec();
  tercihEdilenFransizcaSes = fransizcaSesiSec();
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
 * Verilen metni seslendirir (varsayılan Türkçe).
 * @param {string} metin
 * @param {{ kesintiyle?: boolean, hiz?: number, onSon?: () => void, dil?: 'tr' | 'en' | 'de' | 'fr' }} [opt]
 *        dil: 'en' → İngilizce; 'de' → Almanca; 'fr' → Fransızca (fr-FR)
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
  const { kesintiyle = true, hiz, onSon, _sesRetry } = opt;
  const dilRaw = String(opt.dil || '').toLowerCase();
  const dilEn = dilRaw === 'en';
  const dilDe = dilRaw === 'de';
  const dilFr = dilRaw === 'fr';
  const yabanciSes = dilEn || dilDe || dilFr;
  const ttsLang = dilEn ? 'en-US' : dilDe ? 'de-DE' : dilFr ? 'fr-FR' : 'tr-TR';

  // Native (Android APK) yolu
  if (nativePlatform && nativeTTS) {
    (async () => {
      try {
        if (kesintiyle) {
          try { await nativeTTS.stop(); } catch (_) { /* */ }
        }
        await nativeTTS.speak({
          text: metin,
          lang: ttsLang,
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
  // Ses listesi bazen ilk çağrıda boş gelir (özellikle Chrome); kısa gecikmeyle yeniden dene
  if (yabanciSes && !_sesRetry && tumSesleriAl().length === 0) {
    setTimeout(() => {
      sesleriYukle();
      konus(metin, {
        kesintiyle,
        hiz,
        onSon,
        dil: dilRaw,
        _sesRetry: true,
      });
    }, 200);
    return;
  }

  if (yabanciSes) sesleriYukle();

  const u = new SpeechSynthesisUtterance(metin);
  u.rate = hiz ?? a.konusmaHizi;
  u.pitch = 1;

  if (dilEn) {
    const enSes = tercihEdilenIngilizceSes || ingilizceSesiSec();
    if (enSes) {
      u.voice = enSes;
      const vl = (enSes.lang || '').replace('_', '-').trim();
      u.lang = vl && /^en/i.test(vl) ? vl : 'en-US';
    } else {
      u.lang = 'en-US';
    }
  } else if (dilDe) {
    const deSes = tercihEdilenAlmancaSes || almancaSesiSec();
    if (deSes) {
      u.voice = deSes;
      const vl = (deSes.lang || '').replace('_', '-').trim();
      u.lang = vl && /^de/i.test(vl) ? vl : 'de-DE';
    } else {
      u.lang = 'de-DE';
    }
  } else if (dilFr) {
    const frSes = tercihEdilenFransizcaSes || fransizcaSesiSec();
    if (frSes) {
      u.voice = frSes;
      const vl = (frSes.lang || '').replace('_', '-').trim();
      u.lang = vl && /^fr/i.test(vl) ? vl : 'fr-FR';
    } else {
      u.lang = 'fr-FR';
    }
  } else {
    u.lang = ttsLang;
    if (tercihEdilenSes) u.voice = tercihEdilenSes;
  }
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

  // Native haptics (Capacitor APK / gelecekte iOS IPA)
  if (nativePlatform && nativeHaptics) {
    (async () => {
      try {
        const sure = Array.isArray(desen)
          ? desen.reduce((t, v) => t + v, 0)
          : desen;
        await nativeHaptics.vibrate({ duration: Math.min(sure, 500) });
      } catch (_) {
        try {
          await nativeHaptics.impact({ style: 'LIGHT' });
        } catch (_) { /* yok say */ }
      }
    })();
    return;
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
