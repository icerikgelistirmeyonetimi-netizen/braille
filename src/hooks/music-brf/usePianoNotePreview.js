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

// ─────────────────────────────────────────────────────────────────────────
// Paylaşılan Web Audio altyapısı (modül seviyesi tekil).
// Birden çok bileşen bu hook'u kullandığından, her biri ayrı AudioContext
// açmasın (tarayıcılar AudioContext sayısını ~6 ile sınırlar). Tek bağlam ve
// tek decode önbelleği paylaşılır.
//
// "pıt pıt" (klik/pop) sorununun kökü, HTML5 <audio>.volume'u rAF ile
// değiştirmenin kademeli gürültü (zipper noise) üretmesi ve MP3 çözücü
// dolgusunun başlangıçta tıklamasıydı. Web Audio'da ses PCM olarak decode
// edilir ve GainNode zarfı ses iş parçacığının örnek saatinde çalıştığı için
// fadeIn/fadeOut tamamen pürüzsüzdür → klik olmaz.
// ─────────────────────────────────────────────────────────────────────────

let paylasilanCtx = null;
const bufferCache = new Map();      // url -> AudioBuffer
const decodeInFlight = new Map();   // url -> Promise<AudioBuffer|null>

function ctxAl() {
  if (typeof window === 'undefined') return null;
  if (!paylasilanCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    paylasilanCtx = new AC();
  }
  return paylasilanCtx;
}

async function bufferAl(url) {
  if (!url) return null;
  if (bufferCache.has(url)) return bufferCache.get(url);
  if (decodeInFlight.has(url)) return decodeInFlight.get(url);

  const ctx = ctxAl();
  if (!ctx) return null;

  const p = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr);
      bufferCache.set(url, buf);
      return buf;
    } catch {
      return null;
    } finally {
      decodeInFlight.delete(url);
    }
  })();

  decodeInFlight.set(url, p);
  return p;
}

export function usePianoNotePreview({
  enabled = true,
  volume = 0.75,
  extension = 'mp3',
} = {}) {
  // Aktif ses kaynakları: { source, gain, stopMisli } — ses kesme/voice limit için.
  const activeVoicesRef = useRef(new Set());
  const lastPlayRef = useRef({ key: null, time: 0 });

  const preloadUrls = useCallback(async (urls = []) => {
    const uniqueUrls = Array.from(new Set((urls || []).filter(Boolean)));

    if (uniqueUrls.length === 0) {
      return { loaded: 0, failed: 0, skipped: 0 };
    }

    let loaded = 0;
    let failed = 0;
    let skipped = 0;

    await Promise.allSettled(uniqueUrls.map(async (url) => {
      if (bufferCache.has(url)) {
        skipped += 1;
        return;
      }
      const buf = await bufferAl(url);
      if (buf) loaded += 1;
      else failed += 1;
    }));

    return { loaded, failed, skipped };
  }, []);

  // Bir sesi pürüzsüzce durdur (release zarfı) — pop önler.
  const sesiDurdur = useCallback((voice, releaseSec = 0.04) => {
    if (!voice) return;
    const ctx = paylasilanCtx;
    if (!ctx) return;
    const { source, gain } = voice;
    const now = ctx.currentTime;
    try {
      const mevcut = gain.gain.value;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(mevcut, now);
      gain.gain.linearRampToValueAtTime(0.0001, now + releaseSec);
      source.stop(now + releaseSec + 0.01);
    } catch { /* zaten durmuş olabilir */ }
    activeVoicesRef.current.delete(voice);
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
    if (last.key === url && now - last.time < 80) return;
    lastPlayRef.current = { key: url, time: now };

    const ctx = ctxAl();
    if (!ctx) return;
    // Tarayıcı otomatik oynatma politikası: bağlam askıdaysa devam ettir.
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const baseVolume = Number.isFinite(Number(context?.volume))
      ? Math.max(0, Math.min(1, Number(context.volume)))
      : volume;
    // İnsanlaştırma: ±4% velocity jitter — daha doğal.
    const jitter = 1 + (Math.random() - 0.5) * 0.08;
    const effectiveVolume = Math.min(1, Math.max(0.02, baseVolume * jitter));

    const cutOff = context?.cutOff === true;
    const durationMs = cutOff
      ? (Number(context?.durationMs) || sureMsAl(oge.sureIndeksi))
      : null;

    const baslat = (buffer) => {
      if (!buffer) return;
      // İleri-zamanlama: zarfı tam currentTime'da kurmak, işlenene dek "şimdi"
      // geçmişte kalıp rampanın atlanmasına ve ani başlangıç klikine yol açar.
      // Küçük bir lookahead, attack rampasının tam uygulanmasını garanti eder.
      const t0 = ctx.currentTime + 0.02;

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);

      source.connect(gain);
      gain.connect(ctx.destination);

      // Attack: klik olmaması için gerçek bir rampa (örnek saatinde, t0'dan).
      const attackSec = cutOff
        ? Math.max(0.006, Math.min(0.014, (durationMs / 1000) * 0.25))
        : 0.014;
      gain.gain.linearRampToValueAtTime(effectiveVolume, t0 + attackSec);

      const voice = { source, gain };
      activeVoicesRef.current.add(voice);

      source.onended = () => { activeVoicesRef.current.delete(voice); };

      try {
        source.start(t0);
      } catch {
        activeVoicesRef.current.delete(voice);
        return;
      }

      if (cutOff && durationMs !== null) {
        // Kısa notalar (staccato / süsleme): orantılı release ile kesilir.
        const releaseSec = Math.max(0.02, Math.min(0.05, (durationMs / 1000) * 0.4));
        const stopAt = t0 + durationMs / 1000;
        try {
          gain.gain.setValueAtTime(effectiveVolume, Math.max(t0, stopAt - releaseSec));
          gain.gain.linearRampToValueAtTime(0, stopAt);
          source.stop(stopAt + 0.01);
        } catch { /* yoksay */ }
      } else {
        // Normal notalar: örnek dosyası kırpık biterse son klikini önlemek için
        // doğal bitişin son ~60ms'sinde yumuşak bir release uygula.
        const bufSec = buffer.duration || 0;
        if (bufSec > 0.12) {
          const relSec = 0.06;
          const stopAt = t0 + bufSec;
          try {
            gain.gain.setValueAtTime(effectiveVolume, stopAt - relSec);
            gain.gain.linearRampToValueAtTime(0, stopAt);
          } catch { /* yoksay */ }
        }
      }

      // Polifoni sınırı: 12'den fazla ses üst üste binerse en eskilerini pürüzsüz kapat.
      if (activeVoicesRef.current.size > 12) {
        const eskiSesler = Array.from(activeVoicesRef.current)
          .slice(0, activeVoicesRef.current.size - 12);
        eskiSesler.forEach((eski) => {
          if (eski !== voice) sesiDurdur(eski, 0.025);
        });
      }
    };

    const cached = bufferCache.get(url);
    if (cached) {
      baslat(cached);
    } else {
      bufferAl(url).then((buf) => {
        if (buf) baslat(buf);
        else console.warn('Piyano sesi yüklenemedi:', url);
      });
    }
  }, [enabled, volume, extension, sesiDurdur]);

  useEffect(() => {
    const aktifler = activeVoicesRef.current;
    return () => {
      aktifler.forEach((voice) => {
        try {
          voice.source.stop();
        } catch { /* yoksay */ }
      });
      aktifler.clear();
    };
  }, []);

  return { playNote, preloadUrls };
}
