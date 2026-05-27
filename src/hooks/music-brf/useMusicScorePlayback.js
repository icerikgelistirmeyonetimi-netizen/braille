import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  muzikTempoBpmAl,
  muzikPlaybackEventListesiOlustur,
  playbackEventDurationMsAl,
} from '../../utils/music-brf/musicPlaybackHelpers.js';

export function useMusicScorePlayback({
  muzikOgeleriOlcuTamamlanmis = [],
  muzikBaglar = [],
  muzikHeader = {},
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

  const bpm = useMemo(() => muzikTempoBpmAl(muzikHeader), [muzikHeader]);

  const playbackListesi = useMemo(() => {
    const events = muzikPlaybackEventListesiOlustur({
      ogeler: muzikOgeleriOlcuTamamlanmis,
      baglar: muzikBaglar,
      muzikHeader,
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
  }, [muzikOgeleriOlcuTamamlanmis, muzikBaglar, muzikHeader, eventRowIndexAl]);

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
    const event = playbackListesi[indexRef.current];

    if (!event) {
      temizleTimer();
      setIsPlaying(false);
      indexRef.current = 0;
      temizleVurgu();
      return;
    }

    const oge = event?.oge || event;
    playbackVurgula(oge);

    const currentRow = Number(event?.rowIndex ?? 0);
    const nextEvent = playbackListesi.find((candidate, idx) => (
      idx > indexRef.current && Number(candidate?.rowIndex ?? 0) !== currentRow
    ));

    if (nextEvent) {
      preloadRowOnce(Number(nextEvent.rowIndex ?? 0));
    }

    if ((event?.tip === 'nota' || oge?.tip === 'nota') && event?.play !== false && typeof playNote === 'function') {
      playNote(oge, event?.playbackPitchContext || {});
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
    preloadedRowsRef.current.clear();
    preloadingRowsInFlightRef.current.clear();
    setPreloadingRow(null);
    temizleVurgu();
  }, [temizleTimer, temizleVurgu]);

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
  };
}
