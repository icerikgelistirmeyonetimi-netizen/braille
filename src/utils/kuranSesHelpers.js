const KURAN_HARF_SES_ID = {
  elif: 'elif',
  ba: 'be',
  te: 'te',
  se: 'se',
  cim: 'cim',
  ha: 'ha',
  hı: 'hı',
  dal: 'dal',
  zel: 'zel',
  ra: 'ra',
  ze: 'ze',
  sin: 'sin',
  şın: 'şın',
  shin: 'şın',
  sad: 'sad',
  dad: 'dad',
  tı: 'ti',
  ti: 'ti',
  zı: 'zi',
  zi: 'zi',
  ayn: 'ayn',
  gayn: 'gayn',
  fe: 'fe',
  kaf: 'kaf',
  kef: 'kef',
  lam: 'lam',
  mim: 'mim',
  nun: 'nun',
  he: 'he',
  vav: 'vav',
  ye: 'ye',
  hemze: 'hemze',
  'te marbuta': 'te-marbuta',
  'elif maksure': 'elif-maksure',
};

const KURAN_HARF_KARAKTER_AD = {
  'ا': 'elif',
  'ب': 'ba',
  'ت': 'te',
  'ث': 'se',
  'ج': 'cim',
  'ح': 'ha',
  'خ': 'hi',
  'د': 'dal',
  'ذ': 'zel',
  'ر': 'ra',
  'ز': 'ze',
  'س': 'sin',
  'ش': 'shin',
  'ص': 'sad',
  'ض': 'dad',
  'ط': 'ti',
  'ظ': 'zi',
  'ع': 'ayn',
  'غ': 'gayn',
  'ف': 'fe',
  'ق': 'kaf',
  'ك': 'kef',
  'ل': 'lam',
  'م': 'mim',
  'ن': 'nun',
  'ه': 'he',
  'و': 'vav',
  'ي': 'ye',
  'ء': 'hemze',
  'ة': 'te-marbuta',
  'ى': 'elif-maksure',
};

export function kuranSesSlug(value = '') {
  return String(value)
    .toLocaleLowerCase('tr')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/û/g, 'u')
    .replace(/['’`]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function kuranHarfSesIdAl(ad = '') {
  const temizAd = String(ad).toLocaleLowerCase('tr').trim();
  return KURAN_HARF_SES_ID[temizAd] || kuranSesSlug(temizAd);
}

export function kuranHarfKarakterindenSesIdAl(harf = '') {
  return KURAN_HARF_KARAKTER_AD[harf] || kuranSesSlug(harf);
}

const _base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
const KURAN_AUDIO_BASE = `${_base}/Kur'an-ı Kerim tüm sesler`;

export function kuranAudioUrl(path = '') {
  const temizPath = String(path).replace(/^\/+/, '');
  return encodeURI(`${KURAN_AUDIO_BASE}/${temizPath}`);
}

export function kuranHarfSesUrlAl(oge) {
  const sesId = oge?.sesId || kuranHarfSesIdAl(oge?.harfAdi || oge?.ad || '');
  if (!sesId) return '';
  return kuranAudioUrl(`harfler/${sesId}.wav`);
}

export function kuranHeceSesUrlAl(oge) {
  const harfSesId = oge?.harfSesId || kuranHarfKarakterindenSesIdAl(oge?.harf);
  const hareke = kuranSesSlug(oge?.hareke || '');

  if (!harfSesId || !hareke) return '';

  return kuranAudioUrl(`heceler/${harfSesId}-${hareke}.wav`);
}

export function kuranKelimeOkuma1SesUrlAl(oge) {
  const sesId = oge?.sesId || kuranSesSlug(oge?.okunus || oge?.yazi || '');
  if (!sesId) return '';
  return kuranAudioUrl(`kelimeler/${sesId}.wav`);
}

const kuranAudioCache = new Map();

// Aynı anda yalnızca tek Kur'an sesi çalsın. Yeni ses başlarken çalmakta olan
// önceki ses durdurulur (mouse hızlı gezinince sesler üst üste binmesin).
let aktifKuranAudio = null;

function aktifKuranSesiDurdur(haricAudio = null) {
  if (aktifKuranAudio && aktifKuranAudio !== haricAudio) {
    try {
      aktifKuranAudio.pause();
      aktifKuranAudio.currentTime = 0;
    } catch { /* ignore */ }
    // Önceki sesin bitiş dinleyicisini kaldır ki yanlış onEnded tetiklenmesin.
    if (aktifKuranAudio._kuranEndedHandler) {
      aktifKuranAudio.removeEventListener('ended', aktifKuranAudio._kuranEndedHandler);
      aktifKuranAudio._kuranEndedHandler = null;
    }
  }
}

// Çalmakta olan Kur'an ses kaydını durdurur (TTS ile üst üste binmesin diye
// kullanıcı etkileşiminde / öğe değişiminde çağrılır).
export function kuranSesiniDurdur() {
  aktifKuranSesiDurdur(null);
}

export function kuranSesNesnesiAl(url) {
  if (!url) return null;

  let audio = kuranAudioCache.get(url);

  if (!audio) {
    audio = new Audio(url);
    audio.preload = 'auto';
    kuranAudioCache.set(url, audio);
  }

  return audio;
}

export function kuranSesCal(url, { volume = 0.95, onEnded } = {}) {
  if (!url) return Promise.resolve(false);

  try {
    const audio = kuranSesNesnesiAl(url);
    if (!audio) return Promise.resolve(false);

    // Çalmakta olan başka bir Kur'an sesi varsa durdur, sonra bunu çal.
    aktifKuranSesiDurdur(audio);
    aktifKuranAudio = audio;

    audio.pause();
    audio.currentTime = 0;
    audio.volume = Math.max(0, Math.min(1, Number(volume) || 0.95));

    // Bitiş callback'i: önceki dinleyiciyi kaldır, yenisini bir kez bağla.
    if (audio._kuranEndedHandler) {
      audio.removeEventListener('ended', audio._kuranEndedHandler);
      audio._kuranEndedHandler = null;
    }
    if (typeof onEnded === 'function') {
      const handler = () => {
        audio.removeEventListener('ended', handler);
        if (audio._kuranEndedHandler === handler) audio._kuranEndedHandler = null;
        onEnded();
      };
      audio._kuranEndedHandler = handler;
      audio.addEventListener('ended', handler, { once: true });
    }

    console.log('KURAN SES CALINIYOR:', url);

    // Çalma başarısız olursa 'ended' tetiklenmez; onEnded'i elle çağır ki
    // çağıran taraf (ör. ses bitince yönerge oku) beklemede kalmasın.
    const basarisizdaOnEnded = () => {
      if (audio._kuranEndedHandler) {
        audio.removeEventListener('ended', audio._kuranEndedHandler);
        audio._kuranEndedHandler = null;
      }
      if (typeof onEnded === 'function') onEnded();
    };

    const result = audio.play();

    if (result && typeof result.then === 'function') {
      return result
        .then(() => true)
        .catch((err) => {
          console.warn('Kur’an sesi çalınamadı:', url, err);
          basarisizdaOnEnded();
          return false;
        });
    }

    return Promise.resolve(true);
  } catch (err) {
    console.warn('Kur’an sesi başlatılamadı:', url, err);
    if (typeof onEnded === 'function') onEnded();
    return Promise.resolve(false);
  }
}

export function kuranSesleriPreloadEt(urls = []) {
  Array.from(new Set(urls.filter(Boolean))).forEach((url) => {
    try {
      const audio = kuranSesNesnesiAl(url);
      audio?.load();
    } catch {}
  });
}
