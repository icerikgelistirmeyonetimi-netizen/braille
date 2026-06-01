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
    // Ses kapalıyken bile uygulamanın seslendireceği her cümleyi (yönerge,
    // açıklama, dönüt...) ekran okuyucunun okuyabilmesi için canlı bölgeye yaz.
    if (metin) ekranOkuyucuBildir(metin);
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
  if (!_sesRetry && tumSesleriAl().length === 0) {
    setTimeout(() => {
      sesleriYukle();
      konus(metin, { kesintiyle, hiz, onSon, dil: dilRaw, _sesRetry: true });
    }, 200);
    return;
  }

  // Her dil için sesler hazır değilse yeniden yükle
  if (yabanciSes || !tercihEdilenSes) sesleriYukle();

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
    u.lang = 'tr-TR';
    // Türkçe ses: her seferinde güncel referansı kullan
    const trSes = tercihEdilenSes ||
      tumSesleriAl().find((s) => s.lang === 'tr-TR') ||
      tumSesleriAl().find((s) => s.lang?.startsWith('tr'));
    if (trSes) u.voice = trSes;
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
  // Bekleyen (60 ms gecikmeli) konuşmayı da iptal et; aksi hâlde durdurduktan
  // sonra tetiklenip ses kaydının üstüne biner.
  if (_pendingSpeakTimer) {
    clearTimeout(_pendingSpeakTimer);
    _pendingSpeakTimer = null;
  }
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

// ---------- Ses efektleri (Web Audio ile sentezlenir) ----------
// Telifsiz: hiçbir dosya indirilmez, sesler tarayıcıda üretilir.
let _audioCtx = null;

function sesContextAl() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!_audioCtx) {
    try { _audioCtx = new AC(); } catch (_) { return null; }
  }
  // Kullanıcı etkileşiminden sonra askıdaysa devam ettir
  if (_audioCtx.state === 'suspended') {
    try { _audioCtx.resume(); } catch (_) { /* yok say */ }
  }
  return _audioCtx;
}

/**
 * Tek bir ton çalar.
 * @param {{frekans:number, sure:number, tip?:OscillatorType, baslangic?:number, kazanc?:number}} opt
 */
function tonCal({ frekans, sure, tip = 'sine', baslangic = 0, kazanc = 0.18 }) {
  const ctx = sesContextAl();
  if (!ctx) return;
  const t0 = ctx.currentTime + baslangic;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = tip;
  osc.frequency.setValueAtTime(frekans, t0);
  // Yumuşak zarf (tık/çıt sesi olmaması için)
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(kazanc, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + sure);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + sure + 0.02);
}

function sesEfektiAcikMi() {
  const a = ayarlariAl();
  // Geriye dönük uyum: ayar tanımlı değilse açık kabul et
  return a.sesEfektiAcik !== false && a.sesAcik !== false;
}

// Dosya tabanlı efektler. public/audio/efekt/ içine konan dosyalar
// (tiklama / dogru / yanlis) otomatik kullanılır; yoksa sentez devreye girer.
// Kullanıcı kendi lisanslı seslerini aynı isimle koyduğunda hiçbir kod
// değişikliği gerekmeden onlar çalınır.
const _EFEKT_TABAN =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
const _efektYok = Object.create(null); // dosya bulunamayanları işaretle

/**
 * Önce dosyayı çalmayı dener; dosya yoksa/oynatılamazsa sentez fonksiyonuna düşer.
 * @param {string} ad  Dosya adı (uzantısız), ör. 'tiklama'
 * @param {() => void} sentezle  Yedek sentez fonksiyonu
 */
function efektCal(ad, sentezle) {
  if (typeof Audio === 'undefined' || _efektYok[ad]) { sentezle(); return; }
  try {
    const a = new Audio(`${_EFEKT_TABAN}audio/efekt/${ad}.wav`);
    a.volume = 0.7;
    const p = a.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { _efektYok[ad] = true; sentezle(); });
    }
  } catch (_) {
    _efektYok[ad] = true;
    sentezle();
  }
}

/** Tuşa/öğeye dokunma sesi — kısa, nötr tık. */
export function tiklamaSesi() {
  if (!sesEfektiAcikMi()) return;
  efektCal('tiklama', () => {
    tonCal({ frekans: 440, sure: 0.06, tip: 'triangle', kazanc: 0.12 });
  });
}

/** Doğru cevap sesi — yükselen iki nota (olumlu). */
export function dogruSesi() {
  if (!sesEfektiAcikMi()) return;
  efektCal('dogru', () => {
    tonCal({ frekans: 660, sure: 0.12, tip: 'sine', baslangic: 0, kazanc: 0.16 });
    tonCal({ frekans: 880, sure: 0.16, tip: 'sine', baslangic: 0.11, kazanc: 0.16 });
  });
}

/** Yanlış cevap sesi — alçalan iki nota (olumsuz ama yumuşak). */
export function yanlisSesi() {
  if (!sesEfektiAcikMi()) return;
  efektCal('yanlis', () => {
    tonCal({ frekans: 320, sure: 0.14, tip: 'sawtooth', baslangic: 0, kazanc: 0.1 });
    tonCal({ frekans: 200, sure: 0.2, tip: 'sawtooth', baslangic: 0.12, kazanc: 0.1 });
  });
}

// --- Ekran okuyucu canlı bölgesi (sesAcik kapalı olsa bile dönütü duyurur) ---
// Tek bir global aria-live bölgesi; tüm öğrenme sayfalarındaki doğru/yanlış
// dönütleri NVDA/JAWS/VoiceOver tarafından okunsun diye buraya yazılır.
let _srBolge = null;
let _srSay = 0;
function _srBolgeAl() {
  if (typeof document === 'undefined') return null;
  if (_srBolge && document.body.contains(_srBolge)) return _srBolge;
  _srBolge = document.createElement('div');
  _srBolge.setAttribute('role', 'alert');
  _srBolge.setAttribute('aria-live', 'assertive');
  _srBolge.setAttribute('aria-atomic', 'true');
  // Görsel olarak gizli ama ekran okuyucuya açık
  _srBolge.style.cssText =
    'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;';
  document.body.appendChild(_srBolge);
  return _srBolge;
}

// Ekran okuyucuya bir dönüt duyurur (ses ayarından bağımsız).
export function ekranOkuyucuBildir(metin) {
  const bolge = _srBolgeAl();
  if (!bolge) return;
  // Aynı metin peş peşe gelirse ekran okuyucu tekrar okumayabilir; sona
  // değişken sayıda görünmez boşluk ekleyerek düğümü her seferinde değiştiriyoruz.
  _srSay += 1;
  bolge.textContent = String(metin) + '\u00a0'.repeat(_srSay % 2);
}

export function basariBildir(metin = 'Tebrikler, doğru!') {
  dogruSesi();
  konus(metin);
}

export function hataBildir(metin = 'Yanlış, tekrar deneyin.') {
  yanlisSesi();
  konus(metin);
}
