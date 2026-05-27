import { useCallback, useEffect, useRef } from 'react';
import { muzikNotaPiyanoSesUrlAl } from '../../utils/music-brf/musicPianoAudioHelpers.js';

const sureMsAl = (sureIndeksi) => {
  switch (Number(sureIndeksi)) {
    case 0: return 300;   // sekizlik
    case 1: return 600;   // dörtlük
    case 2: return 1200;  // yarım
    case 3: return 2400;  // tam
    case 4: return 150;   // 16'lık
    case 5: return 90;    // 32'lik
    case 6: return 60;    // 64'lük
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

export function usePianoNotePreview({
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
        const effectiveVolume = Number.isFinite(Number(context?.volume))
          ? Math.max(0, Math.min(1, Number(context.volume)))
          : volume;

        fadeIn(audio, effectiveVolume, 18);

        if (context?.cutOff === true) {
          const durationMs = Number(context?.durationMs) || sureMsAl(oge.sureIndeksi);

          const timerId = window.setTimeout(() => {
            fadeOutAndStop(audio, 45);
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
