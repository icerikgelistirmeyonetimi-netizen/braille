import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  muzikTempoBpmAl,
  muzikPlaybackEventListesiOlustur,
  playbackEventDurationMsAl,
} from '../../utils/music-brf/musicPlaybackHelpers.js';

// Helper: flatten muzikSatirOlculeri to find note IDs for a specific measure
function olcuItemIdleriAl(muzikSatirOlculeri, olcuIdx) {
  const idler = new Set();
  (muzikSatirOlculeri || []).forEach((satir) => {
    (satir || []).forEach((olcu) => {
      const mIdx = olcu?.measureIndex ?? olcu?.index;
      if (mIdx !== olcuIdx) return;
      (olcu.itemIds || []).forEach((id) => { if (id) idler.add(id); });
      (olcu.items || []).forEach((oge) => { if (oge?.id) idler.add(oge.id); });
    });
  });
  return idler;
}

export function useMusicScorePlayback({
  muzikOgeleriOlcuTamamlanmis = [],
  muzikBaglar = [],
  muzikHeader = {},
  muzikTupletler = [],
  playNote,
  preloadUrls,
  noteUrlAl,
  eventRowIndexAl,
  setHoverBrailleOgeId,
  setHoverBrailleBagId,
  setHoverCizgiBagId,
  setSeciliOgeId,
  setSeciliBagId,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackOgeId, setPlaybackOgeId] = useState(null);
  const [preloadingRow, setPreloadingRow] = useState(null);
  const timerRef = useRef(null);
  const indexRef = useRef(0);
  const preloadedRowsRef = useRef(new Set());
  const preloadingRowsInFlightRef = useRef(new Map());
  const customEventsRef = useRef(null); // null = use playbackListesi; array = use custom events

  const bpm = useMemo(() => muzikTempoBpmAl(muzikHeader), [muzikHeader]);

  const playbackListesi = useMemo(() => {
    const events = muzikPlaybackEventListesiOlustur({
      ogeler: muzikOgeleriOlcuTamamlanmis,
      baglar: muzikBaglar,
      muzikHeader,
      tupletler: muzikTupletler,
    });

    return events.map((event) => {
      const oge = event?.oge || event;
      const fallbackRowIndex = Number(
        event?.rowIndex ??
        oge?.satirIdx ??
        oge?.rowIndex ??
        oge?.satirIndex ??
        0
      );

      const rowIndex = typeof eventRowIndexAl === 'function'
        ? Number(eventRowIndexAl(oge))
        : fallbackRowIndex;

      return {
        ...event,
        rowIndex: Number.isFinite(rowIndex) ? rowIndex : 0,
      };
    });
  }, [muzikOgeleriOlcuTamamlanmis, muzikBaglar, muzikHeader, muzikTupletler, eventRowIndexAl]);

  const preloadRowUrls = useCallback(async (rowIndex) => {
    if (!Number.isFinite(Number(rowIndex))) return { loaded: 0, failed: 0, skipped: 0 };
    if (typeof preloadUrls !== 'function' || typeof noteUrlAl !== 'function') {
      return { loaded: 0, failed: 0, skipped: 0 };
    }

    const row = Number(rowIndex);
    const inflight = preloadingRowsInFlightRef.current.get(row);
    if (inflight) return inflight;

    const urls = playbackListesi
      .filter((event) => event?.rowIndex === row)
      .filter((event) => event?.tip === 'nota' && event?.play !== false)
      .map((event) => noteUrlAl(event))
      .filter(Boolean);

    const promise = (async () => {
      setPreloadingRow(row);
      try {
        const result = await preloadUrls(urls);
        preloadedRowsRef.current.add(row);
        return result;
      } finally {
        preloadingRowsInFlightRef.current.delete(row);
        setPreloadingRow((prev) => (prev === row ? null : prev));
      }
    })();

    preloadingRowsInFlightRef.current.set(row, promise);
    return promise;
  }, [playbackListesi, preloadUrls, noteUrlAl]);

  const preloadRowOnce = useCallback((rowIndex) => {
    const row = Number(rowIndex);
    if (!Number.isFinite(row)) return;
    if (preloadedRowsRef.current.has(row)) return;
    if (preloadingRowsInFlightRef.current.has(row)) return;
    preloadRowUrls(row);
  }, [preloadRowUrls]);

  const temizleTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const temizleVurgu = useCallback(() => {
    setPlaybackOgeId(null);
    setHoverBrailleOgeId?.(null);
    setSeciliOgeId?.(null);
  }, [setHoverBrailleOgeId, setSeciliOgeId]);

  const playbackVurgula = useCallback((oge) => {
    if (!oge?.id) return;

    setPlaybackOgeId(oge.id);
    setHoverBrailleOgeId?.(oge.id);
    setHoverBrailleBagId?.(null);
    setHoverCizgiBagId?.(null);
    setSeciliOgeId?.(oge.id);
    setSeciliBagId?.(null);
  }, [
    setHoverBrailleOgeId,
    setHoverBrailleBagId,
    setHoverCizgiBagId,
    setSeciliOgeId,
    setSeciliBagId,
  ]);

  const step = useCallback(() => {
    const activeList = customEventsRef.current ?? playbackListesi;
    const event = activeList[indexRef.current];

    if (!event) {
      temizleTimer();
      setIsPlaying(false);
      indexRef.current = 0;
      customEventsRef.current = null;
      temizleVurgu();
      return;
    }

    const oge = event?.oge || event;
    if (event?.tip !== 'gap') {
      playbackVurgula(oge);
    }

    const currentRow = Number(event?.rowIndex ?? 0);
    const nextEvent = activeList.find((candidate, idx) => (
      idx > indexRef.current && Number(candidate?.rowIndex ?? 0) !== currentRow
    ));

    if (nextEvent) {
      preloadRowOnce(Number(nextEvent.rowIndex ?? 0));
    }

    if ((event?.tip === 'nota' || oge?.tip === 'nota') && event?.play !== false && typeof playNote === 'function') {
      const pitchCtx = event?.playbackPitchContext || {};
      const velocity = Number.isFinite(Number(event?.velocity)) ? Number(event.velocity) : null;
      const noteCtx = velocity !== null ? { ...pitchCtx, volume: velocity } : pitchCtx;

      // Süsleme notaları: cutOff zorunlu (üst üste binen sustain'i önlemek için)
      if (event?._ornamentExpanded) {
        const durationMs = playbackEventDurationMsAl(event, bpm);
        playNote(oge, { ...noteCtx, cutOff: true, durationMs });
      } else if (event?._articulationCutOff) {
        // Staccato / staccatissimo / mezzo-staccato / staccato-accent / martellato
        const totalMs = playbackEventDurationMsAl(event, bpm);
        const durationMs = Math.max(30, totalMs * (event._articulationCutFraction || 0.3));
        playNote(oge, { ...noteCtx, cutOff: true, durationMs });
      } else {
        playNote(oge, noteCtx);
      }
    }

    const ms = playbackEventDurationMsAl(event, bpm);

    indexRef.current += 1;
    timerRef.current = window.setTimeout(step, ms);
  }, [playbackListesi, bpm, playNote, playbackVurgula, temizleTimer, temizleVurgu, preloadRowOnce]);

  const play = useCallback(async () => {
    if (isPlaying) return;
    if (!playbackListesi.length) return;

    if (indexRef.current >= playbackListesi.length) {
      indexRef.current = 0;
    }

    const currentEvent = playbackListesi[indexRef.current] || playbackListesi[0];
    const currentRow = Number(currentEvent?.rowIndex ?? 0);

    await preloadRowUrls(currentRow);
    preloadedRowsRef.current.add(currentRow);

    setIsPlaying(true);

    temizleTimer();
    timerRef.current = window.setTimeout(step, 0);
  }, [isPlaying, playbackListesi, step, temizleTimer, preloadRowUrls]);

  const pause = useCallback(() => {
    temizleTimer();
    setIsPlaying(false);
  }, [temizleTimer]);

  const stop = useCallback(() => {
    temizleTimer();
    setIsPlaying(false);
    indexRef.current = 0;
    customEventsRef.current = null;
    preloadedRowsRef.current.clear();
    preloadingRowsInFlightRef.current.clear();
    setPreloadingRow(null);
    temizleVurgu();
  }, [temizleTimer, temizleVurgu]);

  /**
   * Tek bir adım ileri çal — şu anki indeksten sonraki olayı (nota/sus)
   * gerçekleştir, vurgula, sesi tetikle. Auto-loop başlatmaz.
   */
  const stepForward = useCallback(() => {
    const activeList = customEventsRef.current ?? playbackListesi;
    if (!activeList.length) return;

    temizleTimer();
    setIsPlaying(false);

    // İleri git: ilk geçerli olay
    if (indexRef.current >= activeList.length) {
      indexRef.current = 0;
    }
    const event = activeList[indexRef.current];
    if (!event) return;

    const oge = event?.oge || event;
    playbackVurgula(oge);

    if ((event?.tip === 'nota' || oge?.tip === 'nota') && event?.play !== false && typeof playNote === 'function') {
      const pitchCtx = event?.playbackPitchContext || {};
      const velocity = Number.isFinite(Number(event?.velocity)) ? Number(event.velocity) : null;
      const noteCtx = velocity !== null ? { ...pitchCtx, volume: velocity } : pitchCtx;
      if (event?._articulationCutOff) {
        const totalMs = playbackEventDurationMsAl(event, bpm);
        const durationMs = Math.max(30, totalMs * (event._articulationCutFraction || 0.3));
        playNote(oge, { ...noteCtx, cutOff: true, durationMs });
      } else {
        playNote(oge, noteCtx);
      }
    }

    indexRef.current += 1;
  }, [playbackListesi, bpm, playNote, playbackVurgula, temizleTimer]);

  /**
   * Tek adım geri — bir önceki olayı çalar. İndex 0'a kadar düşebilir.
   */
  const stepBackward = useCallback(() => {
    const activeList = customEventsRef.current ?? playbackListesi;
    if (!activeList.length) return;

    temizleTimer();
    setIsPlaying(false);

    // 2 geri çünkü indexRef her zaman BIR SONRAKİ adımı tutar
    indexRef.current = Math.max(0, indexRef.current - 2);
    const event = activeList[indexRef.current];
    if (!event) {
      temizleVurgu();
      return;
    }

    const oge = event?.oge || event;
    playbackVurgula(oge);

    if ((event?.tip === 'nota' || oge?.tip === 'nota') && event?.play !== false && typeof playNote === 'function') {
      const pitchCtx = event?.playbackPitchContext || {};
      const velocity = Number.isFinite(Number(event?.velocity)) ? Number(event.velocity) : null;
      const noteCtx = velocity !== null ? { ...pitchCtx, volume: velocity } : pitchCtx;
      if (event?._articulationCutOff) {
        const totalMs = playbackEventDurationMsAl(event, bpm);
        const durationMs = Math.max(30, totalMs * (event._articulationCutFraction || 0.3));
        playNote(oge, { ...noteCtx, cutOff: true, durationMs });
      } else {
        playNote(oge, noteCtx);
      }
    }

    indexRef.current += 1;
  }, [playbackListesi, bpm, playNote, playbackVurgula, temizleTimer, temizleVurgu]);

  const playMeasure = useCallback((olcuIdx, muzikSatirOlculeri) => {
    if (!Array.isArray(playbackListesi) || playbackListesi.length === 0) return;

    const hedefIdler = olcuItemIdleriAl(muzikSatirOlculeri, olcuIdx);
    if (hedefIdler.size === 0) return;

    const olcuEvents = playbackListesi.filter((ev) => {
      const oge = ev?.oge || ev;
      return hedefIdler.has(oge?.id) || hedefIdler.has(ev?.ogeId);
    });

    if (olcuEvents.length === 0) return;

    // Stop current playback
    temizleTimer();
    setIsPlaying(false);
    temizleVurgu();

    // Set custom events and start playing
    customEventsRef.current = olcuEvents;
    indexRef.current = 0;
    setIsPlaying(true);
    timerRef.current = window.setTimeout(step, 0);
  }, [playbackListesi, temizleTimer, temizleVurgu, step]);

  /**
   * Belirli bir öğeden (nota/sus id) itibaren tüm parçayı çal.
   * Klavye 'Space' kısayolu için: seçili notadan başlayıp devam eder.
   * ogeId bulunamazsa mevcut konumdan (indexRef) çalar.
   */
  const playFromOge = useCallback(async (ogeId) => {
    if (!playbackListesi.length) return;
    // Ölçü-özel listeyi sıfırla → tüm parça akışını kullan.
    customEventsRef.current = null;

    let idx = -1;
    if (ogeId) {
      idx = playbackListesi.findIndex((ev) => {
        const oge = ev?.oge || ev;
        return oge?.id === ogeId || ev?.ogeId === ogeId;
      });
    }
    if (idx < 0) idx = indexRef.current; // bulunamazsa mevcut konumdan devam et
    if (idx < 0 || idx >= playbackListesi.length) idx = 0;

    indexRef.current = idx;

    const currentEvent = playbackListesi[idx] || playbackListesi[0];
    const currentRow = Number(currentEvent?.rowIndex ?? 0);
    await preloadRowUrls(currentRow);
    preloadedRowsRef.current.add(currentRow);

    setIsPlaying(true);
    temizleTimer();
    timerRef.current = window.setTimeout(step, 0);
  }, [playbackListesi, step, temizleTimer, preloadRowUrls]);

  useEffect(() => {
    preloadedRowsRef.current.clear();
    preloadingRowsInFlightRef.current.clear();
    setPreloadingRow(null);
  }, [playbackListesi]);

  useEffect(() => () => temizleTimer(), [temizleTimer]);

  return {
    isPlaying,
    playbackOgeId,
    preloadingRow,
    bpm,
    play,
    pause,
    stop,
    playMeasure,
    playFromOge,
    stepForward,
    stepBackward,
  };
}
