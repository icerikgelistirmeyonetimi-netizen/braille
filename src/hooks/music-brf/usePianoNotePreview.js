import { useCallback, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import {
  muzikNotaPiyanoSesUrlAl,
  muzikNotaMidiAl,
  PIANO_AUDIO_FOLDER,
} from '../../utils/music-brf/musicPianoAudioHelpers.js';
import { ayarlariAl, ayarlariDinle } from '../../utils/ayarlar.js';
import { toneSesAyarlariAl, toneSesAyarlariDinle } from '../../utils/toneSesAyarlari.js';

// Önizleme süreleri (sabit ≈100 BPM, dörtlük = 600 ms). Oranlar 2'şer kat:
// her değer komşusunun yarısı/iki katı. (Tam playback BPM'e göre ayrıca hesaplar.)
const sureMsAl = (sureIndeksi) => {
  switch (Number(sureIndeksi)) {
    case 0: return 300;   // sekizlik
    case 1: return 600;   // dörtlük
    case 2: return 1200;  // ikilik
    case 3: return 2400;  // birlik
    case 4: return 150;   // 16'lık  (dörtlüğün 1/4'ü)
    case 5: return 75;    // 32'lik  (dörtlüğün 1/8'i)
    case 6: return 38;    // 64'lük  (dörtlüğün 1/16'sı ≈ 37.5)
    default: return 600;
  }
};

const fadeOutAndStop = (audio, durationMs = 45) => {
  const startVolume = audio.volume || 0;
  const startedAt = performance.now();

  const tick = () => {
    const t = Math.min(1, (performance.now() - startedAt) / durationMs);
    audio.volume = startVolume * (1 - t);

    if (t < 1 && !audio.paused) {
      requestAnimationFrame(tick);
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {}
  };

  requestAnimationFrame(tick);
};

const fadeIn = (audio, targetVolume, durationMs = 18) => {
  const startedAt = performance.now();
  audio.volume = 0;

  const tick = () => {
    const t = Math.min(1, (performance.now() - startedAt) / durationMs);
    audio.volume = targetVolume * t;

    if (t < 1 && !audio.paused) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

// ── HTML5 Audio motoru (varsayılan) ────────────────────────────────────────
function useHtmlPiano({
  enabled = true,
  volume = 0.75,
  extension = 'mp3',
} = {}) {
  const audioCacheRef = useRef(new Map());
  const activeAudiosRef = useRef(new Set());
  const activeTimersRef = useRef(new Set());
  const lastPlayRef = useRef({ key: null, time: 0 });

  const preloadUrls = useCallback(async (urls = []) => {
    const uniqueUrls = Array.from(new Set((urls || []).filter(Boolean)));

    if (uniqueUrls.length === 0) {
      return { loaded: 0, failed: 0, skipped: 0 };
    }

    let loaded = 0;
    let failed = 0;
    let skipped = 0;

    await Promise.allSettled(uniqueUrls.map((url) => new Promise((resolve) => {
      const cached = audioCacheRef.current.get(url);

      if (cached && cached.readyState >= 2) {
        skipped += 1;
        resolve();
        return;
      }

      let audio = cached;

      if (!audio) {
        audio = new Audio(url);
        audio.preload = 'auto';
        audioCacheRef.current.set(url, audio);
      }

      let settled = false;

      const cleanup = () => {
        audio.removeEventListener('loadeddata', onReady);
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('error', onError);
      };

      const done = (ok) => {
        if (settled) return;
        settled = true;
        cleanup();

        if (ok) loaded += 1;
        else failed += 1;

        resolve();
      };

      const onReady = () => done(true);
      const onError = () => done(false);

      if (audio.readyState >= 2) {
        done(true);
        return;
      }

      audio.addEventListener('loadeddata', onReady, { once: true });
      audio.addEventListener('canplaythrough', onReady, { once: true });
      audio.addEventListener('error', onError, { once: true });

      try {
        audio.load();
      } catch {
        done(false);
      }
    })));

    return { loaded, failed, skipped };
  }, []);

  const playNote = useCallback((oge, context = {}) => {
    if (!enabled || !oge || oge.tip !== 'nota') return;

    const url = muzikNotaPiyanoSesUrlAl(oge, { extension, context });

    if (!url) {
      console.warn('Piyano sesi URL bulunamadı:', oge, context);
      return;
    }

    const now = Date.now();
    const last = lastPlayRef.current;

    if (last.key === url && now - last.time < 80) {
      return;
    }

    lastPlayRef.current = { key: url, time: now };

    let baseAudio = audioCacheRef.current.get(url);

    if (!baseAudio) {
      baseAudio = new Audio(url);
      baseAudio.preload = 'auto';
      audioCacheRef.current.set(url, baseAudio);

      try {
        baseAudio.load();
      } catch {}
    }

    const audio = baseAudio.cloneNode(true);
    audio.preload = 'auto';
    audio.volume = 0;

    const cleanup = () => {
      activeAudiosRef.current.delete(audio);
      audio.removeEventListener('ended', cleanup);
      audio.removeEventListener('error', cleanup);
    };

    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });

    activeAudiosRef.current.add(audio);

    if (activeAudiosRef.current.size > 12) {
      const eskiSesler = Array.from(activeAudiosRef.current)
        .slice(0, activeAudiosRef.current.size - 12);

      eskiSesler.forEach((oldAudio) => {
        if (oldAudio !== audio) {
          fadeOutAndStop(oldAudio, 25);
          activeAudiosRef.current.delete(oldAudio);
        }
      });
    }

    try {
      audio.currentTime = 0;

      const result = audio.play();

      const baslatSonrasi = () => {
        const baseVolume = Number.isFinite(Number(context?.volume))
          ? Math.max(0, Math.min(1, Number(context.volume)))
          : volume;

        // İnsanlaştırma: ±4% velocity jitter — daha doğal, robot gibi değil
        const jitter = 1 + (Math.random() - 0.5) * 0.08;
        const effectiveVolume = Math.min(1, Math.max(0.02, baseVolume * jitter));

        // Kısa notalar için orantılı fadeIn (staccatissimo, ornament vb.)
        const durationMs = context?.cutOff === true
          ? (Number(context?.durationMs) || sureMsAl(oge.sureIndeksi))
          : null;
        const fadeinMs = durationMs !== null
          ? Math.max(5, Math.min(18, durationMs * 0.25))  // en fazla %25'i fadeIn
          : 18;

        fadeIn(audio, effectiveVolume, fadeinMs);

        if (context?.cutOff === true && durationMs !== null) {
          // Kısa notalar: fadeOut süresi de orantılı (durationMs'in %40'ı, max 45ms)
          const fadeoutMs = Math.max(20, Math.min(45, durationMs * 0.4));
          const timerId = window.setTimeout(() => {
            fadeOutAndStop(audio, fadeoutMs);
            activeTimersRef.current.delete(timerId);
          }, durationMs);

          activeTimersRef.current.add(timerId);
        }
      };

      if (result && typeof result.then === 'function') {
        result
          .then(baslatSonrasi)
          .catch((err) => {
            console.warn('Piyano sesi çalınamadı:', {
              err,
              url,
              oge,
              context,
            });
            cleanup();
          });
      } else {
        baslatSonrasi();
      }
    } catch (err) {
      console.warn('Piyano sesi başlatılamadı:', {
        err,
        url,
        oge,
        context,
      });
      cleanup();
    }
  }, [enabled, volume, extension]);

  useEffect(() => {
    return () => {
      activeTimersRef.current.forEach((timerId) => clearTimeout(timerId));
      activeTimersRef.current.clear();

      activeAudiosRef.current.forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch {}
      });

      activeAudiosRef.current.clear();
    };
  }, []);

  return { playNote, preloadUrls };
}

// ── Tone.js Sampler motoru (Ayarlar'dan açılır) ─────────────────────────────
// Paylaşılan tek Sampler: örnekler bir kez yüklenir, tüm sayfalar paylaşır.
// Örnekler talep üzerine eklenir (.add) → sadece kullanılan notalar yüklenir.
// Detay ayarları (release/volume/reverb) toneSesAyarlari'dan okunur ve canlı
// uygulanır (Detay popup'ından değiştirildiğinde anında yansır).
let _toneSampler = null;
let _toneReverb = null;
let _toneAboneKuruldu = false;
const _toneLoaded = new Set();

function _toneAyarUygula(s) {
  if (_toneSampler) {
    try { _toneSampler.release = Math.max(0.05, Number(s.release) || 1); } catch { /* yoksay */ }
    try {
      const v = Math.max(0.0001, Math.min(1, Number(s.volume) ?? 0.75));
      _toneSampler.volume.value = Tone.gainToDb(v);
    } catch { /* yoksay */ }
  }
  if (_toneReverb) {
    try {
      _toneReverb.wet.value = s.reverbAcik ? Math.max(0, Math.min(0.9, Number(s.reverbWet) || 0)) : 0;
    } catch { /* yoksay */ }
  }
}

function _toneSamplerAl() {
  if (!_toneSampler) {
    const s = toneSesAyarlariAl();
    // Oda yankısı: sampler → reverb → çıkış
    _toneReverb = new Tone.Reverb({ decay: 2.2, preDelay: 0.01 }).toDestination();
    _toneReverb.wet.value = s.reverbAcik ? Math.max(0, Math.min(0.9, Number(s.reverbWet) || 0)) : 0;
    _toneSampler = new Tone.Sampler({
      release: Math.max(0.05, Number(s.release) || 1),
      curve: 'exponential',
    }).connect(_toneReverb);
    try {
      const v = Math.max(0.0001, Math.min(1, Number(s.volume) ?? 0.75));
      _toneSampler.volume.value = Tone.gainToDb(v);
    } catch { /* yoksay */ }

    if (!_toneAboneKuruldu) {
      _toneAboneKuruldu = true;
      toneSesAyarlariDinle(_toneAyarUygula); // detay değişince canlı uygula
    }
  }
  return _toneSampler;
}

function _midiNota(midi) {
  return Tone.Frequency(midi, 'midi').toNote();
}

function _toneNotaYukle(note, url) {
  if (_toneLoaded.has(note)) return Promise.resolve(true);
  return new Promise((resolve) => {
    try {
      _toneSamplerAl().add(note, url, () => { _toneLoaded.add(note); resolve(true); });
    } catch { resolve(false); }
  });
}

// .../piano ses/<tuşNo>.mp3 → { note, url }  (tuşNo = midi - 20)
function _urldenNota(url) {
  const m = String(url || '').match(/(\d+)\.[a-z0-9]+(?:[?#].*)?$/i);
  if (!m) return null;
  const tusNo = Number(m[1]);
  if (!Number.isFinite(tusNo) || tusNo < 1 || tusNo > 88) return null;
  return { note: _midiNota(tusNo + 20), url };
}

function useTonePiano({
  enabled = true,
  volume = 0.75,
  extension = 'mp3',
} = {}) {
  const sonRef = useRef({ key: null, time: 0 });

  const preloadUrls = useCallback(async (urls = []) => {
    const uniq = Array.from(new Set((urls || []).filter(Boolean)));
    let loaded = 0; let failed = 0; let skipped = 0;
    await Promise.allSettled(uniq.map(async (url) => {
      const eslem = _urldenNota(url);
      if (!eslem) { failed += 1; return; }
      if (_toneLoaded.has(eslem.note)) { skipped += 1; return; }
      const ok = await _toneNotaYukle(eslem.note, eslem.url);
      if (ok) loaded += 1; else failed += 1;
    }));
    return { loaded, failed, skipped };
  }, []);

  const playNote = useCallback(async (oge, context = {}) => {
    if (!enabled || !oge || oge.tip !== 'nota') return;

    const url = muzikNotaPiyanoSesUrlAl(oge, { extension, context });
    if (!url) return;

    const now = Date.now();
    if (sonRef.current.key === url && now - sonRef.current.time < 80) return;
    sonRef.current = { key: url, time: now };

    try { await Tone.start(); } catch { /* yoksay */ }

    const midi = muzikNotaMidiAl(oge, { keySignatureAccidentals: context?.keySignatureAccidentals });
    if (!Number.isFinite(midi)) return;

    const note = _midiNota(midi);
    const ok = await _toneNotaYukle(note, url);
    if (!ok) return;

    // Master ses seviyesi sampler.volume'dan (detay ayar). Buradaki velocity
    // yalnızca müzikal dinamikler için (varsayılan 1) — çift kısma olmasın.
    const velocity = Number.isFinite(Number(context?.volume))
      ? Math.max(0, Math.min(1, Number(context.volume)))
      : 1;

    const cutOff = context?.cutOff === true;
    const durMs = cutOff
      ? (Number(context?.durationMs) || sureMsAl(oge.sureIndeksi))
      : sureMsAl(oge.sureIndeksi);
    const holdSec = Math.max(0.1, durMs / 1000);

    try {
      _toneSamplerAl().triggerAttackRelease(note, holdSec, undefined, velocity);
    } catch { /* yoksay */ }
  }, [enabled, volume, extension]);

  const stopAll = useCallback(() => {
    try { _toneSampler?.releaseAll(); } catch { /* yoksay */ }
  }, []);

  return { playNote, preloadUrls, stopAll };
}

// ── Seçici: Ayarlar'daki tonejsSes bayrağına göre motoru seçer ──────────────
// İki motor da koşulsuz kurulur (kurallar gereği) ama ikisi de tembeldir;
// kullanıcı çalana dek ne AudioContext ne de örnek yüklenir. Yalnız seçilen
// motorun fonksiyonları döndürülür → 4 tüketici bileşen değişmeden çalışır.
export function usePianoNotePreview(opts = {}) {
  const html = useHtmlPiano(opts);
  const tone = useTonePiano(opts);

  const [toneAcik, setToneAcik] = useState(() => {
    try { return !!ayarlariAl().tonejsSes; } catch { return false; }
  });

  useEffect(() => ayarlariDinle((a) => setToneAcik(!!a.tonejsSes)), []);

  return toneAcik ? tone : html;
}
