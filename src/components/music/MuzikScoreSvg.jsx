import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MusicNoteGlyph from './svg/MusicNoteGlyph';
import BeamGroup from './svg/BeamGroup';
import RestGlyph from './svg/RestGlyph';
import StaffLines from './svg/StaffLines';
import SlurTiePath from './svg/SlurTiePath';
import MuzikScoreHeaderBraille from './MuzikScoreHeaderBraille.jsx';
import MuzikScoreBrailleOverlay from './MuzikScoreBrailleOverlay.jsx';
import { usePianoNotePreview } from '../../hooks/music-brf/usePianoNotePreview.js';
import { useMusicScorePlayback } from '../../hooks/music-brf/useMusicScorePlayback.js';
import { keySignatureAccidentalsAl, muzikNotaPiyanoSesUrlAl } from '../../utils/music-brf/musicPianoAudioHelpers.js';
import MuzikBarlineTimeSignatureModal from './MuzikBarlineTimeSignatureModal.jsx';
import MuzikTimeSignatureGlyph from './MuzikTimeSignatureGlyph.jsx';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import {
  SURE_GOSTERGELERI as MUZIK_SURE_GOSTERGELERI,
} from '../../data/muzik.js';
import {
  brailleLejantKeyAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import {
  notaGorselYHesapla,
  notaGorselYClampEdildiMi,
  notaYHesapla,
} from '../../utils/music-brf/musicScoreHelpers.jsx';
import ScoreBarlineGlyph from './ScoreBarlineGlyph.jsx';
import {
  skorBarlineTipiAl,
  skorFinalBarlineSatirSonuMu,
  skorBarlineXAl,
  SCORE_STAFF_TOP_Y,
  SCORE_STAFF_BOTTOM_Y,
} from '../../utils/music-brf/musicVisualBarlineHelpers.js';
import {
  skorSatirSagXHesapla,
  SCORE_ROW_RIGHT_INSET,
} from '../../utils/music-brf/musicVisualLayoutHelpers.js';
import {
  BRAILLE_HUCRE_TEMA,
  SVG_CLEF_X,
  SVG_KEY_ACCIDENTAL_GAP,
  SVG_ROW_HEIGHT,
  SVG_ROW_VIEWBOX_Y,
  SVG_SCORE_BRAILLE_Y_OFFSET,
  SVG_SCORE_BRAILLE_NOTE_GAP,
  SVG_SAG_SINIR_X,
  SVG_STAFF_LEFT_X,
} from '../../utils/music-brf/musicConstants.js';

const slurMu = (bag) => {
  const tip = String(bag?.tip || bag?.kayit?.tip || '').toLowerCase();
  const mode = String(bag?.mode || bag?.kayit?.mode || 'single').toLowerCase();
  return tip === 'slur' && mode === 'single';
};

const tieMi = (bag) => {
  const tip = String(bag?.tip || bag?.kayit?.tip || '').toLowerCase();
  const ad = String(bag?.kayit?.ad || bag?.ad || '').toLowerCase();
  return tip === 'tie' || /tie|uzatma/.test(ad);
};

const brfImportBagMu = (bag) => (
  bag?.importKaynak === 'brf-reader' ||
  bag?.kayit?.importKaynak === 'brf-reader' ||
  bag?.kaynak === 'brf-reader' ||
  bag?.source === 'brf-reader'
);

const bagCizimBasSonAl = (bag) => {
  const ids = Array.isArray(bag?.notaIdler) ? bag.notaIdler.filter(Boolean) : [];
  if (ids.length >= 2) {
    return {
      basId: ids[0],
      sonId: ids[ids.length - 1],
    };
  }
  return {
    basId: bag?.basId,
    sonId: bag?.sonId,
  };
};

const ardisikSlurlariBirlestir = (baglar = []) => {
  const sonuc = [];
  const kullanildi = new Set();

  const singleSlurlar = baglar.filter((bag) => slurMu(bag) && !tieMi(bag) && !brfImportBagMu(bag));
  const digerleri = baglar.filter((bag) => !slurMu(bag) || tieMi(bag) || brfImportBagMu(bag));

  if (baglar.some(brfImportBagMu)) {
  }

  for (const bag of singleSlurlar) {
    if (!bag?.id || kullanildi.has(bag.id)) continue;

    const zincir = [bag];
    kullanildi.add(bag.id);

    let currentEnd = bag.sonId || bag.notaIdler?.[bag.notaIdler.length - 1];
    let devamVar = true;

    while (devamVar) {
      devamVar = false;

      const next = singleSlurlar.find((aday) => {
        if (!aday?.id || kullanildi.has(aday.id)) return false;

        const adayBas = aday.basId || aday.notaIdler?.[0];
        return adayBas && currentEnd && adayBas === currentEnd;
      });

      if (next) {
        zincir.push(next);
        kullanildi.add(next.id);
        currentEnd = next.sonId || next.notaIdler?.[next.notaIdler.length - 1];
        devamVar = true;
      }
    }

    if (zincir.length === 1) {
      sonuc.push(bag);
      continue;
    }

    const ilk = zincir[0];
    const son = zincir[zincir.length - 1];
    const notaIdler = [];

    zincir.forEach((z) => {
      const ids = Array.isArray(z.notaIdler) && z.notaIdler.length
        ? z.notaIdler
        : [z.basId, z.sonId].filter(Boolean);

      ids.forEach((id) => {
        if (id && !notaIdler.includes(id)) {
          notaIdler.push(id);
        }
      });
    });

    sonuc.push({
      ...ilk,
      id: `${ilk.id}-merged-${son.id}`,
      tip: 'slur',
      mode: 'single',
      basId: ilk.basId || notaIdler[0],
      sonId: son.sonId || notaIdler[notaIdler.length - 1],
      notaIdler,
      mergedFrom: zincir.map((z) => z.id),
    });
  }

  const merged = [...digerleri, ...sonuc];
  if (baglar.some(brfImportBagMu)) {
  }

  return merged;
};

export default function MuzikScoreSvg({
  muzikSatirlar,
  olcuBrailleSonuclari,
  notaEkleKonuma,
  seciliSureIdx,
  setSeciliSureIdx,
  sonKullanilanOktav,
  setSonKullanilanOktav,
  notaSuresiniCiftTiklaDegistir,
  skorUstuHeaderSatirlari,
  svgGlobalIndexBul,
  svgYerlesimHaritasi,
  svgCizilecekOgeler,
  svgBeamGruplari,
  ogeXHesapla,
  satirIcindeBeamliMi,
  ilkSatirHeaderBilgisi,
  muzikHeader,
  muzikBaglar,
  barlineMenu,
  setBarlineMenu,
  barlineTiklandi,
  inlineTimeSignatureEkle,
  inlineKeySignatureEkle,
  olcuCizgisiniDegistir,
  olcuCizgisiniSil,
  hoverBrailleOgeId,
  hoverBrailleBagId,
  hoverCizgiBagId,
  setHoverBrailleOgeId,
  setHoverBrailleBagId,
  setHoverCizgiBagId,
  seciliOgeId,
  sonEklenenOgeId,
  seciliBagId,
  setSeciliOgeId,
  setSeciliBagId,
  muzikSatirOlculeri,
  setPopupAcik,
  setAnahtarPopupAcik,
  mevcutAnahtar,
  anahtarGlyphAl,
  anahtarYAl,
  anahtarFontClassAl,
  muzikOgeleri,
  notaTiklandi,
  bagTipiTieMi,
  bagYonunuHesapla,
  bagCizimNoktalari,
  bagHitRectHesapla,
  ledgerCizgileri,
  gorunenSatirBrailleLejantMaplari,
  gorunenSatirBrailleLejantlari,
  baslangicBrailleBilgisi,
  baslangicBrailleLejantlari,
  baslangicBrailleLejantMapi,
}) {
  const [hoverBarlineId, setHoverBarlineId] = useState(null);
  const [hoverBrailleCellKey, setHoverBrailleCellKey] = useState(null);
  const [hoverEklemeNotasi, setHoverEklemeNotasi] = useState(null);
  const [hoverSatirIdx, setHoverSatirIdx] = useState(null);
  const [hoverEklemeKonumuId, setHoverEklemeKonumuId] = useState(null);
  const clickTimerRef = useRef(null);
  const satirRefMap = useRef(new Map());
  const sonEklenenScrollIdRef = useRef(null);
  const sonPlaybackScrollSatirRef = useRef(null);
  const satirRefAta = useCallback((satirIdx) => (node) => {
    if (node) {
      satirRefMap.current.set(satirIdx, node);
    } else {
      satirRefMap.current.delete(satirIdx);
    }
  }, []);
  const { playNote, preloadUrls } = usePianoNotePreview({
    enabled: true,
    volume: 0.75,
    extension: 'mp3',
  });

  const headerKeySignatureAccidentals = useMemo(
    () => keySignatureAccidentalsAl(muzikHeader?.keySignature),
    [muzikHeader?.keySignature],
  );

  const headerPitchContext = useMemo(() => ({
    keySignatureAccidentals: headerKeySignatureAccidentals,
    measureAccidentals: new Map(),
  }), [headerKeySignatureAccidentals]);

  const eventRowIndexAl = useCallback((oge) => {
    const yer = svgYerlesimHaritasi?.get?.(oge?.id);
    return Number.isFinite(Number(yer?.satirIdx)) ? Number(yer.satirIdx) : 0;
  }, [svgYerlesimHaritasi]);

  const noteUrlAl = useCallback((event) => {
    const oge = event?.oge || event;
    if (!oge || oge.tip !== 'nota') return null;

    return muzikNotaPiyanoSesUrlAl(oge, {
      extension: 'mp3',
      context: event?.playbackPitchContext || headerPitchContext,
    });
  }, [headerPitchContext]);

  const {
    isPlaying,
    playbackOgeId,
    preloadingRow,
    bpm,
    play,
    pause,
    stop,
  } = useMusicScorePlayback({
    muzikOgeleriOlcuTamamlanmis: svgCizilecekOgeler,
    muzikBaglar,
    muzikHeader,
    playNote,
    preloadUrls,
    noteUrlAl,
    eventRowIndexAl,
    setHoverBrailleOgeId,
    setHoverBrailleBagId,
    setHoverCizgiBagId,
    setSeciliOgeId,
    setSeciliBagId,
  });

  const aktifPlaybackSatirIdx = useMemo(() => {
    if (!playbackOgeId) return null;

    const yer = svgYerlesimHaritasi?.get?.(playbackOgeId);
    if (Number.isFinite(Number(yer?.satirIdx))) {
      return Number(yer.satirIdx);
    }

    return null;
  }, [playbackOgeId, svgYerlesimHaritasi]);

  const sonEklenenOgeSatirIdx = useMemo(() => {
    if (!sonEklenenOgeId) return null;

    const yer = svgYerlesimHaritasi?.get?.(sonEklenenOgeId);
    if (Number.isFinite(Number(yer?.satirIdx))) {
      return Number(yer.satirIdx);
    }

    return null;
  }, [sonEklenenOgeId, svgYerlesimHaritasi]);

  useEffect(() => {
    if (!isPlaying) {
      sonPlaybackScrollSatirRef.current = null;
      return;
    }

    if (!Number.isFinite(Number(aktifPlaybackSatirIdx))) return;

    const satirIdx = Number(aktifPlaybackSatirIdx);
    if (sonPlaybackScrollSatirRef.current === satirIdx) return;

    const node = satirRefMap.current.get(satirIdx);
    if (!node) return;

    sonPlaybackScrollSatirRef.current = satirIdx;

    window.requestAnimationFrame(() => {
      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
  }, [isPlaying, aktifPlaybackSatirIdx]);

  useEffect(() => {
    if (isPlaying) return;
    if (!sonEklenenOgeId) return;
    if (sonEklenenScrollIdRef.current === sonEklenenOgeId) return;
    if (!Number.isFinite(Number(sonEklenenOgeSatirIdx))) return;

    const satirIdx = Number(sonEklenenOgeSatirIdx);

    console.warn('AUTO SCROLL DEBUG', {
      sonEklenenOgeId,
      sonEklenenOgeSatirIdx,
      satirVarMi: satirRefMap.current.has(satirIdx),
      satirSayisi: muzikSatirlar.length,
    });

    sonEklenenScrollIdRef.current = sonEklenenOgeId;

    const scrollEt = () => {
      const node = satirRefMap.current.get(satirIdx);
      if (!node) {
        return;
      }

      node.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    };

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(scrollEt);
    });
  }, [isPlaying, sonEklenenOgeId, sonEklenenOgeSatirIdx, muzikSatirlar.length]);

  const notaOgesiById = useMemo(() => {
    const map = new Map();
    (muzikOgeleri || []).forEach((oge) => {
      if (oge?.id) map.set(oge.id, oge);
    });
    (svgCizilecekOgeler || []).forEach((oge) => {
      if (oge?.id && !map.has(oge.id)) map.set(oge.id, oge);
    });
    return map;
  }, [muzikOgeleri, svgCizilecekOgeler]);

  const notaOgesiAl = (ogeId) => {
    const oge = notaOgesiById.get(ogeId);
    return oge?.tip === 'nota' ? oge : null;
  };

  const svgBaglar = ardisikSlurlariBirlestir(muzikBaglar);

  const bagIdEslesiyorMu = (bag, id) => {
    if (!bag || !id) return false;

    const adaylar = [
      bag.id,
      bag.bagId,
      bag.sourceId,
      bag.originalId,
      ...(Array.isArray(bag.mergedFrom) ? bag.mergedFrom : []),
      ...(Array.isArray(bag.originalIds) ? bag.originalIds : []),
    ].filter(Boolean);

    return adaylar.includes(id);
  };

  const bagAktifId = (bag) => (
    Array.isArray(bag.mergedFrom) && bag.mergedFrom.length
      ? bag.mergedFrom[0]
      : bag.id
  );

  const renderInlineTimeSignature = (oge, x) => {
    const ts = oge.timeSignature?.ad || oge.ad || oge.gorunum || '';

    return (
      <MuzikTimeSignatureGlyph
        key={oge.id}
        value={ts}
        x={x}
        className="muzik-inline-time-sig"
      />
    );
  };

  const measureLayoutForItem = (ogeId, satirOlculeri = []) => (
    satirOlculeri.find((m) => Array.isArray(m.itemIds) && m.itemIds.includes(ogeId)) || null
  );

  const barlineMeasureEndXAl = (oge, satirOlculeri = []) => {
    const layout = measureLayoutForItem(oge.id, satirOlculeri);
    if (!layout) return null;
    if (Number.isFinite(layout.measureEndX)) return layout.measureEndX;
    if (Number.isFinite(layout.endX)) return layout.endX;
    return null;
  };

  const satirSonGorunurOgesiMi = (itemIndex, rowItems = []) => {
    for (let i = itemIndex + 1; i < rowItems.length; i += 1) {
      const oge = rowItems[i];
      if (!oge) continue;
      if (oge.hidden || oge.gizli) continue;
      return false;
    }
    return true;
  };

  const renderInlineKeySignature = (oge, x) => {
    const ad = String(oge.keySignature?.ad || oge.ad || '').toLowerCase();

    const m = /^(\d+)\s*(diyezli|bemollü|bemollu|bemol)/i.exec(ad);

    if (!m) {
      return (
        <g key={oge.id} className="muzik-inline-key-sig">
          <rect
            x={x - 16}
            y={68}
            width={32}
            height={44}
            rx={8}
            className="muzik-note-hover-rect"
          />
          <text
            x={x}
            y="98"
            textAnchor="middle"
            className="muzik-key-sig-glyph"
          >
            ♮
          </text>
        </g>
      );
    }

    const sayi = Math.min(7, Math.max(0, parseInt(m[1], 10) || 0));
    if (sayi <= 0) return null;

    const diyez = /diyez/i.test(ad);
    const diyezY = [62, 73, 60, 70, 80, 67, 78];
    const bemolY = [78, 67, 80, 70, 82, 72, 85];
    const ys = (diyez ? diyezY : bemolY).slice(0, sayi);
    const sym = diyez ? '♯' : '♭';
    const width = Math.max(30, ys.length * SVG_KEY_ACCIDENTAL_GAP + 18);
    const startX = x - width / 2 + 10;

    return (
      <g key={oge.id} className="muzik-inline-key-sig">
        <rect
          x={x - width / 2}
          y={50}
          width={width}
          height={64}
          rx={10}
          className="muzik-note-hover-rect"
        />

        {ys.map((y, i) => (
          <text
            key={`${oge.id}-acc-${i}`}
            x={startX + i * SVG_KEY_ACCIDENTAL_GAP}
            y={y}
            textAnchor="middle"
            className="muzik-key-sig-glyph"
          >
            {sym}
          </text>
        ))}
      </g>
    );
  };

  const aktifOktavAl = useCallback(() => {
    const adaylar = [
      sonKullanilanOktav,
      [...(svgCizilecekOgeler || [])]
        .reverse()
        .find((oge) => oge?.tip === 'nota' && !oge.autoRest && !oge.otomatik)?.oktav,
      4,
    ];

    for (const aday of adaylar) {
      const n = Number(aday);
      if (Number.isFinite(n) && n >= 1 && n <= 7) return n;
    }

    return 4;
  }, [sonKullanilanOktav, svgCizilecekOgeler]);

  const aktifSureIdxAl = useCallback(() => (
    Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1
  ), [seciliSureIdx]);

  const notaEklemeAdaylariAl = useCallback(() => {
    const temelNotalar = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
    const aktifOktav = aktifOktavAl();

    return temelNotalar.map((notaAd) => {
      const oge = {
        id: `ekleme-aday-${notaAd}-${aktifOktav}`,
        tip: 'nota',
        notaAd,
        oktav: aktifOktav,
        sureIndeksi: Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1,
      };

      return {
        notaAd,
        oktav: aktifOktav,
        y: notaGorselYHesapla(oge, mevcutAnahtar),
        oge,
      };
    });
  }, [
    seciliSureIdx,
    mevcutAnahtar,
    aktifOktavAl,
  ]);

  const eklemeReferansOgesiMi = (oge) => (
    oge &&
    oge.tip !== 'anahtar' &&
    !oge.autoRest &&
    !oge.otomatik &&
    !oge.autoBarline &&
    !oge.otomatikOlcuCizgisi
  );

  const satirEklemeKonumlariAl = useCallback((satirIdx) => {
    const satirOgeleri = Array.isArray(muzikSatirlar?.[satirIdx])
      ? muzikSatirlar[satirIdx]
      : [];

    const referansOgeler = satirOgeleri.filter(eklemeReferansOgesiMi);

    if (referansOgeler.length === 0) {
      return [
        {
          id: `satir-${satirIdx}-bos-baslangic`,
          insertAfterId: null,
          x: SVG_STAFF_LEFT_X + 120,
        },
      ];
    }

    return referansOgeler.map((oge, index) => {
      const yer = svgYerlesimHaritasi?.get?.(oge.id);
      const currentX = Number.isFinite(Number(yer?.x))
        ? Number(yer.x)
        : SVG_STAFF_LEFT_X + 120;

      const sonrakiOge = referansOgeler[index + 1] || null;
      const sonrakiYer = sonrakiOge?.id
        ? svgYerlesimHaritasi?.get?.(sonrakiOge.id)
        : null;

      const nextX = Number.isFinite(Number(sonrakiYer?.x))
        ? Number(sonrakiYer.x)
        : null;

      const x = nextX !== null
        ? currentX + Math.max(24, Math.min(54, (nextX - currentX) / 2))
        : currentX + 48;

      return {
        id: `satir-${satirIdx}-after-${oge.id}`,
        insertAfterId: oge.id,
        x: Math.min(Math.max(x, SVG_STAFF_LEFT_X + 40), SVG_SAG_SINIR_X - 32),
      };
    });
  }, [muzikSatirlar, svgYerlesimHaritasi]);

  const sureButonlari = useMemo(() => (
    (MUZIK_SURE_GOSTERGELERI || [])
      .map((sure, index) => ({
        index,
        ad: sure?.ad || sure?.kisaAd || `${index}`,
        kisaAd: sure?.kisaAd || sure?.ad || `${index}`,
        realValue: sure?.realValue,
      }))
      .filter((sure) => Number.isFinite(Number(sure.realValue)))
  ), []);

  const sureIkonuAl = (sure) => {
    const realValue = Number(sure?.realValue);

    if (realValue === 1) return '𝅝';      // birlik
    if (realValue === 2) return '𝅗𝅥';      // ikilik
    if (realValue === 4) return '𝅘𝅥';      // dörtlük
    if (realValue === 8) return '𝅘𝅥𝅮';      // sekizlik
    if (realValue === 16) return '𝅘𝅥𝅯';     // onaltılık
    if (realValue === 32) return '𝅘𝅥𝅰';     // otuz ikilik
    if (realValue === 64) return '𝅘𝅥𝅱';     // altmış dörtlük

    return '♪';
  };

  const renderSatirEklemeAracCubugu = (satirIdx) => {
    if (hoverSatirIdx !== satirIdx) return null;

    const aktifOktav = aktifOktavAl();
    const aktifSureIdx = aktifSureIdxAl();

    return (
      <foreignObject
        x={SVG_STAFF_LEFT_X + 8}
        y={SVG_ROW_VIEWBOX_Y + 6}
        width={680}
        height={52}
        style={{ overflow: 'visible' }}
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          className="inline-flex w-fit max-w-[660px] items-center gap-2 rounded-xl border border-sky-200 bg-white/95 px-2 py-1.5 text-xs backdrop-blur"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-semibold text-slate-700">Süre</span>

          <div className="flex items-center gap-1">
            {sureButonlari.map((sure) => {
              const aktif = sure.index === aktifSureIdx;

              return (
                <button
                  key={`satir-sure-${sure.index}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSeciliSureIdx?.(sure.index);
                  }}
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-md border text-base leading-none transition',
                    aktif
                      ? 'border-sky-500 bg-sky-100 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-sky-50',
                  ].join(' ')}
                  title={sure.ad}
                  aria-label={sure.ad}
                >
                  <span aria-hidden="true">{sureIkonuAl(sure)}</span>
                </button>
              );
            })}
          </div>

          <span className="ml-2 font-semibold text-slate-700">Oktav</span>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((oktav) => {
              const aktif = oktav === aktifOktav;

              return (
                <button
                  key={`satir-oktav-${oktav}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSonKullanilanOktav?.(oktav);
                  }}
                  className={[
                    'h-7 w-7 rounded-md border text-xs font-bold transition',
                    aktif
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-emerald-50',
                  ].join(' ')}
                >
                  {oktav}
                </button>
              );
            })}
          </div>
        </div>
      </foreignObject>
    );
  };

  const eklenenNotayiCal = useCallback((aday) => {
    if (!aday?.oge || typeof playNote !== 'function') return;

    playNote(aday.oge, {
      keySignatureAccidentals: headerKeySignatureAccidentals,
    });
  }, [playNote, headerKeySignatureAccidentals]);

  const svgMouseNoktasiAl = (svg, event) => {
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const eklemeHoverGuncelle = useCallback((event, satirIdx) => {
    const target = event.target;

    if (
      target?.closest?.(
        '.muzik-skor-ogesi, .muzik-bag-grup, .muzik-barline-hit-area, .muzik-anahtar-grup'
      )
    ) {
      setHoverEklemeKonumuId(null);
      setHoverEklemeNotasi(null);
      return;
    }

    const svg = event.currentTarget;
    if (!svg?.createSVGPoint) return;

    const nokta = svgMouseNoktasiAl(svg, event);
    const konumlar = satirEklemeKonumlariAl(satirIdx);

    const aktifKonum = konumlar.find((konum) => (
      Math.abs(nokta.x - konum.x) <= 24 &&
      nokta.y >= SCORE_STAFF_TOP_Y - 34 &&
      nokta.y <= SCORE_STAFF_BOTTOM_Y + 34
    ));

    if (!aktifKonum) {
      setHoverEklemeKonumuId(null);
      setHoverEklemeNotasi(null);
      return;
    }

    setHoverEklemeKonumuId(aktifKonum.id);
  }, [satirEklemeKonumlariAl]);

  const renderNotaEklemeKutulari = (satirIdx) => {
    if (hoverSatirIdx !== satirIdx) return null;
    if (typeof notaEkleKonuma !== 'function') return null;

    const konumlar = satirEklemeKonumlariAl(satirIdx);
    if (!konumlar.length) return null;

    const adaylar = notaEklemeAdaylariAl();

    return (
      <g
        className="muzik-nota-ekleme-kutulari"
        pointerEvents="none"
        style={{ pointerEvents: 'none' }}
      >
        {konumlar.map((konum) => {
          const konumAktif = hoverEklemeKonumuId === konum.id;

          return (
            <g
              key={konum.id}
              className="muzik-nota-ekleme-konumu"
              pointerEvents="none"
              style={{ pointerEvents: 'none' }}
            >
              <rect
                x={konum.x - 24}
                y={SCORE_STAFF_TOP_Y - 34}
                width={48}
                height={SCORE_STAFF_BOTTOM_Y - SCORE_STAFF_TOP_Y + 68}
                rx={10}
                fill="transparent"
                pointerEvents="none"
              />

              {konumAktif && adaylar.map((aday) => {
                const hoverKey = `${konum.id}-${aday.notaAd}-${aday.oktav}`;
                const aktif = hoverEklemeNotasi?.key === hoverKey;

                return (
                  <g
                    key={hoverKey}
                    role="button"
                    tabIndex={0}
                    pointerEvents="auto"
                    style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                    aria-label={`${aday.oktav}. oktav ${aday.notaAd} ekle`}
                    onMouseEnter={() => setHoverEklemeNotasi({
                      ...aday,
                      key: hoverKey,
                      insertAfterId: konum.insertAfterId,
                    })}
                    onMouseLeave={() => setHoverEklemeNotasi((onceki) => (
                      onceki?.key === hoverKey ? null : onceki
                    ))}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      notaEkleKonuma({
                        notaAd: aday.notaAd,
                        oktav: aday.oktav,
                        sureIdx: Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1,
                        insertAfterId: konum.insertAfterId,
                      });

                      eklenenNotayiCal?.(aday);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();

                        notaEkleKonuma({
                          notaAd: aday.notaAd,
                          oktav: aday.oktav,
                          sureIdx: Number.isInteger(seciliSureIdx) ? seciliSureIdx : 1,
                          insertAfterId: konum.insertAfterId,
                        });

                        eklenenNotayiCal?.(aday);
                      }
                    }}
                  >
                    <rect
                      x={konum.x - 22}
                      y={aday.y - 18}
                      width={44}
                      height={36}
                      rx={8}
                      fill="transparent"
                      pointerEvents="all"
                    />

                    <rect
                      x={konum.x - 11}
                      y={aday.y - 7}
                      width={22}
                      height={14}
                      rx={4}
                      fill="#2563eb"
                      fillOpacity={aktif ? 0.18 : 0.07}
                      stroke="#2563eb"
                      strokeOpacity={aktif ? 0.7 : 0.22}
                      strokeWidth={aktif ? 1.4 : 0.9}
                    />

                    {aktif && (
                      <text
                        x={konum.x + 18}
                        y={aday.y + 4}
                        textAnchor="start"
                        fontSize="11"
                        fontWeight="700"
                        fill="#2563eb"
                        pointerEvents="none"
                      >
                        {aday.notaAd}
                      </text>
                    )}

                    {aktif && (
                      <>
                        {ledgerCizgileri(konum.x, aday.y, mevcutAnahtar, { maxLines: 5 })}

                        <MusicNoteGlyph
                          item={aday.oge}
                          x={konum.x}
                          y={aday.y}
                          sure={MUZIK_SURE_GOSTERGELERI[aday.oge.sureIndeksi ?? 1]}
                          grouped={false}
                          beamCount={0}
                        />
                      </>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </g>
    );
  };

  const renderBarlineGlyph = (oge, x, itemIndex, rowItems, satirOlculeri = [], rowRightX) => {
    const type = skorBarlineTipiAl(oge);
    const beginRepeatMi = oge?.tip === 'beginRepeat' || String(type).toLowerCase().includes('begin');

    let normalX;
    if (beginRepeatMi) {
      normalX = x;
    } else {
      const layoutEndX = barlineMeasureEndXAl(oge, satirOlculeri);
      normalX = Number.isFinite(layoutEndX) ? layoutEndX : x;
    }

    const rowEnd = satirSonGorunurOgesiMi(itemIndex, rowItems);
    if (!beginRepeatMi && rowEnd) {
      normalX = Math.max(normalX, rowRightX);
    }

    const isRowEnd = !beginRepeatMi && type === 'final' && skorFinalBarlineSatirSonuMu({
      itemIndex,
      rowItems,
    });
    const finalX = beginRepeatMi
      ? normalX
      : skorBarlineXAl({
          normalX,
          rowRightX,
          barlineType: type,
          isRowEnd,
        });
    const aktif = hoverBarlineId === oge.id || barlineMenu?.ogeId === oge.id;

    return (
      <g>
        <rect
          x={finalX - 16}
          y={SCORE_STAFF_TOP_Y - 2}
          width={32}
          height={SCORE_STAFF_BOTTOM_Y - SCORE_STAFF_TOP_Y + 4}
          rx={6}
          className="muzik-note-hover-rect"
          fill={aktif ? 'rgba(245, 158, 11, 0.18)' : 'transparent'}
          stroke={aktif ? '#f59e0b' : 'transparent'}
          strokeWidth={aktif ? 1.5 : 0}
          style={{ cursor: 'pointer' }}
        />
        <ScoreBarlineGlyph
          x={finalX}
          type={type}
          topY={SCORE_STAFF_TOP_Y}
          bottomY={SCORE_STAFF_BOTTOM_Y}
        />
      </g>
    );
  };

  return (
    <div
      className="w-full p-3 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col gap-2 overflow-x-auto"
      role="application"
      aria-label="Müzik çizim alanı"
    >
      {muzikSatirlar.map((satir, satirIdx) => {
        const satirOlculeri = muzikSatirOlculeri?.[satirIdx] || [];
        const satirOlcuBrailleleri = olcuBrailleSonuclari[satirIdx] || [];
        const satirNotaYleri = satir
          .filter((oge) => oge.tip === 'nota')
          .map((oge) => notaYHesapla(oge, mevcutAnahtar));
        const enAlcakNotaY = satirNotaYleri.length
          ? Math.max(...satirNotaYleri)
          : 112;
        const svgCssHeight = 220;
        const svgScale = svgCssHeight / SVG_ROW_HEIGHT;
        const brailleTargetY = Math.max(
          SVG_SCORE_BRAILLE_Y_OFFSET,
          enAlcakNotaY + SVG_SCORE_BRAILLE_NOTE_GAP,
        );
        const brailleYShift = svgCssHeight - brailleTargetY * svgScale;
        const satirSagX = skorSatirSagXHesapla({
          staffRightX: SVG_SAG_SINIR_X,
          rightInset: SCORE_ROW_RIGHT_INSET,
        });

        const aktifPlaybackSatiri = isPlaying && aktifPlaybackSatirIdx === satirIdx;
        return (
          <div
            key={`skor-olcu-braille-satir-${satirIdx}`}
            ref={satirRefAta(satirIdx)}
            className={[
              'muzik-olcu-braille-blok',
              aktifPlaybackSatiri ? 'muzik-playback-satir-aktif' : '',
            ].filter(Boolean).join(' ')}
            onMouseEnter={() => setHoverSatirIdx(satirIdx)}
            onMouseLeave={() => {
              setHoverSatirIdx((onceki) => (onceki === satirIdx ? null : onceki));
              setHoverEklemeNotasi(null);
              setHoverEklemeKonumuId(null);
            }}
            style={{
              background: aktifPlaybackSatiri ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
              boxShadow: aktifPlaybackSatiri ? 'inset 0 0 0 1px rgba(59, 130, 246, 0.16)' : 'none',
              borderRadius: 14,
              transition: 'background-color 180ms ease, box-shadow 180ms ease',
            }}
          >
            {satirIdx === 0 && (
              <div className="flex flex-wrap items-start gap-0 justify-between">
                {(skorUstuHeaderSatirlari.length > 0 || baslangicBrailleBilgisi?.hucreOgeleri?.length > 0) && (
                  <div className="flex-1 min-w-0">
                    <MuzikScoreHeaderBraille
                      skorUstuHeaderSatirlari={skorUstuHeaderSatirlari}
                      baslangicBrailleBilgisi={baslangicBrailleBilgisi}
                      gorunenSatirBrailleLejantMaplari={gorunenSatirBrailleLejantMaplari}
                      gorunenSatirBrailleLejantlari={gorunenSatirBrailleLejantlari}
                      baslangicBrailleLejantlari={baslangicBrailleLejantlari}
                      baslangicBrailleLejantMapi={baslangicBrailleLejantMapi}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 rounded-r-lg rounded-tl-none rounded-bl-none border border-slate-200 bg-white/90 px-2 py-1.5 shadow-sm">
                  <button
                    type="button"
                    onClick={isPlaying ? pause : play}
                    aria-label={isPlaying ? 'Duraklat' : 'Çal'}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm transition duration-150 hover:bg-sky-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      {isPlaying ? (
                        <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                      ) : (
                        <path d="M8 5l11 7-11 7V5z" />
                      )}
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={stop}
                    aria-label="Durdur"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-600 text-white shadow-sm transition duration-150 hover:bg-rose-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                      <path d="M7 7h10v10H7V7z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <svg
              className="araclar-muzik-skor-svg"
              viewBox={`0 ${SVG_ROW_VIEWBOX_Y} 800 ${SVG_ROW_HEIGHT}`}
              preserveAspectRatio="none"
              aria-label={`Porte satır ${satirIdx + 1}`}
              onMouseMove={(event) => eklemeHoverGuncelle(event, satirIdx)}
              onClick={() => {
                setSeciliOgeId(null);
                setSeciliBagId?.(null);
                setHoverCizgiBagId?.(null);
                setPopupAcik(false);
              }}
              style={{ overflow: 'visible' }}
            >
              <StaffLines
                x={SVG_STAFF_LEFT_X}
                rightX={satirSagX}
              />

              {renderSatirEklemeAracCubugu(satirIdx)}

              <g className="muzik-anahtar-grup"
                role="button"
                tabIndex={0}
                aria-label={`${mevcutAnahtar.ad || 'Anahtar'} — değiştirmek için tıkla`}
                onClick={(e) => { e.stopPropagation(); setAnahtarPopupAcik(true); }}>
                <rect
                  x={SVG_CLEF_X - 24}
                  y={42}
                  width={48}
                  height={96}
                  rx={12}
                  className="muzik-note-hover-rect"
                />
                <text
                  x={SVG_CLEF_X}
                  y={anahtarYAl(mevcutAnahtar)}
                  textAnchor="middle"
                  className={anahtarFontClassAl(mevcutAnahtar)}
                >
                  {anahtarGlyphAl(mevcutAnahtar)}
                </text>
              </g>
              {satirIdx === 0 && muzikOgeleri.length === 0 && (
                <text x="120" y="94" className="muzik-bos-yardim">Önce bir nota seçin…</text>
              )}
              {satirIdx === 0 && muzikHeader.keySignature && (() => {
                const ad = String(muzikHeader.keySignature.ad || '').toLowerCase();
                const m = /^(\d+)\s*(diyezli|bemollü|bemollu|bemol)/i.exec(ad);

                if (!m) return null;

                const sayi = Math.min(7, Math.max(0, parseInt(m[1], 10) || 0));
                if (sayi <= 0) return null;

                const diyez = /diyez/i.test(ad);
                const diyezY = [62, 73, 60, 70, 80, 67, 78];
                const bemolY = [78, 67, 80, 70, 82, 72, 85];
                const ys = (diyez ? diyezY : bemolY).slice(0, sayi);
                const sym = diyez ? '♯' : '♭';

                const startX = ilkSatirHeaderBilgisi.keyStartX;
                const width = Math.max(30, ys.length * SVG_KEY_ACCIDENTAL_GAP + 18);

                return (
                  <g className="muzik-key-sig">
                    <rect
                      x={startX - 10}
                      y={50}
                      width={width}
                      height={60}
                      rx={10}
                      className="muzik-note-hover-rect"
                    />

                    {ys.map((y, i) => (
                      <text
                        key={i}
                        x={startX + i * SVG_KEY_ACCIDENTAL_GAP}
                        y={y}
                        textAnchor="middle"
                        className="muzik-key-sig-glyph"
                      >
                        {sym}
                      </text>
                    ))}
                  </g>
                );
              })()}
              {satirIdx === 0 && muzikHeader.timeSignature && (() => {
                const ts = muzikHeader.timeSignature.ad || muzikHeader.timeSignature.gorunum || '';
                const tsx = ilkSatirHeaderBilgisi.timeStartX + 14;

                return (
                  <MuzikTimeSignatureGlyph
                    value={ts}
                    x={tsx}
                    className="muzik-time-sig"
                  />
                );
              })()}
              {renderNotaEklemeKutulari(satirIdx)}

              {(() => {
                const beams = [];

                svgBeamGruplari.forEach((grup) => {
                  const grupOgeleri = (grup.indices || [])
                    .map((idx) => svgCizilecekOgeler[idx])
                    .filter((oge) => oge && oge.tip === 'nota');

                  if (grupOgeleri.length < 2) return;

                  const ayniSatirdakiOgeler = grupOgeleri.filter((oge) => {
                    const yer = svgYerlesimHaritasi.get(oge.id);
                    return yer && yer.satirIdx === satirIdx;
                  });

                  if (ayniSatirdakiOgeler.length < 2) return;

                  const notes = ayniSatirdakiOgeler.map((oge) => {
                    const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
                    const beamCount = Number.isFinite(sure?.bayrak) ? sure.bayrak : 0;

                    return {
                      ...oge,
                      id: oge.id,
                      x: ogeXHesapla(oge.id),
                      y: notaGorselYHesapla(oge, mevcutAnahtar),
                      beamCount,
                    };
                  });

                  beams.push(
                    <BeamGroup
                      key={`${grup.id}-satir-${satirIdx}`}
                      notes={notes}
                    />
                  );
                });

                return beams;
              })()}
              {satir.map((oge, itemIndex) => {
                const x = ogeXHesapla(oge.id);
                const secili = oge.id === seciliOgeId;
                if (oge.tip === 'nota') {
                  const brailleHoverAktif = hoverBrailleOgeId === oge.id;
                  const gruptaMi = (() => {
                    if (typeof satirIcindeBeamliMi !== 'function') return false;

                    const globalIdx = svgGlobalIndexBul(oge.id);
                    if (globalIdx < 0) return false;

                    const grup = svgBeamGruplari.find((g) => (
                      Array.isArray(g.indices) && g.indices.includes(globalIdx)
                    ));

                    if (!grup) return false;

                    const ayniSatirdakiNotaSayisi = grup.indices
                      .map((idx) => svgCizilecekOgeler[idx])
                      .filter((item) => item && item.tip === 'nota')
                      .filter((item) => {
                        const yer = svgYerlesimHaritasi.get(item.id);
                        return yer && yer.satirIdx === satirIdx;
                      })
                      .length;

                    return ayniSatirdakiNotaSayisi >= 2;
                  })();
                  const noteY = notaGorselYHesapla(oge, mevcutAnahtar);
                  const clampEdildi = notaGorselYClampEdildiMi(oge, mevcutAnahtar);
                  const sure = MUZIK_SURE_GOSTERGELERI[oge.sureIndeksi ?? 0];
                  const bayrak = Number.isFinite(sure?.bayrak) ? sure.bayrak : 0;
                  const playbackAktif = playbackOgeId === oge.id;
                  const noteHoverAktif = hoverBrailleOgeId === oge.id || playbackAktif;
                  const noteSeciliAktif = secili || playbackAktif;
                  const overlayWidth = 22;
                  const overlayHeight = 44;
                  const overlayX = x - overlayWidth / 2;
                  const overlayY = noteY - overlayHeight / 2;
                  return (
                    <g
                      key={oge.id}
                      role="button"
                      tabIndex={0}
                      pointerEvents="all"
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      className={[
                        'muzik-skor-ogesi',
                        secili ? 'secili' : '',
                        brailleHoverAktif ? 'muzik-nota-braille-hover' : '',
                      ].filter(Boolean).join(' ')}
                      onMouseEnter={() => {
                        setHoverBrailleOgeId(oge.id);
                        setHoverBrailleBagId?.(null);
                        setHoverCizgiBagId?.(null);
                        playNote(oge, { keySignatureAccidentals: headerKeySignatureAccidentals });
                      }}
                      onMouseLeave={() => setHoverBrailleOgeId(null)}
                      onClick={(e) => {
                        e.stopPropagation();

                        if (clickTimerRef.current) {
                          window.clearTimeout(clickTimerRef.current);
                          clickTimerRef.current = null;
                        }

                        clickTimerRef.current = window.setTimeout(() => {
                          setSeciliBagId?.(null);
                          notaTiklandi(oge, e);
                          clickTimerRef.current = null;
                        }, 180);
                      }}
                      onDoubleClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        if (clickTimerRef.current) {
                          window.clearTimeout(clickTimerRef.current);
                          clickTimerRef.current = null;
                        }

                        setSeciliBagId?.(null);
                        notaSuresiniCiftTiklaDegistir?.(oge, e);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          notaTiklandi(oge, e);
                        }
                      }}
                    >
                      {ledgerCizgileri(x, noteY, mevcutAnahtar, { maxLines: 5 })}
                      <rect
                        x={overlayX}
                        y={overlayY}
                        width={overlayWidth}
                        height={overlayHeight}
                        rx={4}
                        ry={4}
                        pointerEvents="all"
                        fill={noteSeciliAktif || noteHoverAktif ? '#2563eb' : 'transparent'}
                        fillOpacity={noteSeciliAktif ? 0.08 : noteHoverAktif ? 0.05 : 0}
                        stroke={noteSeciliAktif || noteHoverAktif ? '#2563eb' : 'none'}
                        strokeOpacity={noteSeciliAktif ? 0.6 : noteHoverAktif ? 0.4 : 0}
                        strokeWidth={noteSeciliAktif || noteHoverAktif ? 1 : 0}
                        style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      />
                      {secili && (
                        <rect
                          x={x - 11}
                          y={noteY - 30}
                          width={22}
                          height={60}
                          rx="7"
                          className="muzik-secim-cercevesi"
                        />
                      )}
                      <MusicNoteGlyph
                        item={oge}
                        x={x}
                        y={noteY}
                        sure={sure}
                        grouped={gruptaMi}
                        beamCount={bayrak}
                      />
                    </g>
                  );
                }
                if (oge.tip === 'sus') {
                  const susSecili = oge.id === seciliOgeId;
                  const susHoverAktif = hoverBrailleOgeId === oge.id || playbackOgeId === oge.id;
                  return (
                    <g
                      key={oge.id}
                      opacity={oge.autoRest || oge.otomatik ? 0.48 : 1}
                      pointerEvents={oge.autoRest || oge.otomatik ? 'none' : 'auto'}
                      onMouseEnter={() => {
                        if (!(oge.autoRest || oge.otomatik)) {
                          setHoverBrailleOgeId(oge.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!(oge.autoRest || oge.otomatik)) {
                          setHoverBrailleOgeId((prev) => (prev === oge.id ? null : prev));
                        }
                      }}
                    >
                      {!oge.autoRest && !oge.otomatik && (
                        <rect
                          x={x - 13}
                          y={72}
                          width={26}
                          height={48}
                          rx={6}
                          fill={susSecili ? '#2563eb' : susHoverAktif ? '#2563eb' : 'transparent'}
                          fillOpacity={susSecili ? 0.08 : susHoverAktif ? 0.05 : 0}
                          stroke={susSecili || susHoverAktif ? '#2563eb' : 'transparent'}
                          strokeOpacity={susSecili ? 0.6 : susHoverAktif ? 0.4 : 0}
                          strokeWidth={susSecili || susHoverAktif ? 1 : 0}
                        />
                      )}
                      <RestGlyph
                        item={oge}
                        x={x}
                        onClick={oge.autoRest || oge.otomatik ? undefined : (e) => notaTiklandi(oge, e)}
                        autoRest={oge.autoRest || oge.otomatik}
                      />
                    </g>
                  );
                }
                {
                  const isGenericPopupTarget = oge.tip === 'timeSignatureChange'
                    || oge.tip === 'keySignatureChange'
                    || (!['barline', 'sectionalBarline', 'finalBarline', 'beginRepeat', 'endRepeat'].includes(oge.tip));

                  const popupClickProps = isGenericPopupTarget ? {
                    role: 'button',
                    tabIndex: 0,
                    onClick: (e) => {
                      e.stopPropagation();
                      setSeciliBagId?.(null);
                      notaTiklandi(oge, e);
                    },
                    onKeyDown: (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        notaTiklandi(oge, e);
                      }
                    },
                  } : {};

                  return (
                    <g key={oge.id} className="muzik-skor-ogesi" aria-label={oge.ad} {...popupClickProps}>
                      {oge.tip === 'timeSignatureChange' ? (
                        renderInlineTimeSignature(oge, x)
                      ) : oge.tip === 'keySignatureChange' ? (
                        renderInlineKeySignature(oge, x)
                      ) : (
                        oge?.tip === 'barline'
                        || oge?.tip === 'sectionalBarline'
                        || oge?.tip === 'finalBarline'
                        || oge?.tip === 'beginRepeat'
                        || oge?.tip === 'endRepeat'
                        || (oge.hucreler && oge.hucreler.length && oge.hucreler[0].length === 0)
                      ) ? (
                        <g
                          role="button"
                          tabIndex={0}
                          className="muzik-barline-hit-area"
                          aria-label={`${oge.ad || 'Ölçü çizgisi'} — işlem eklemek için tıkla`}
                          pointerEvents="all"
                          onMouseEnter={() => setHoverBarlineId(oge.id)}
                          onMouseLeave={() => setHoverBarlineId((prev) => (prev === oge.id ? null : prev))}
                          onFocus={() => setHoverBarlineId(oge.id)}
                          onBlur={() => setHoverBarlineId((prev) => (prev === oge.id ? null : prev))}
                          onClick={(e) => {
                            e.preventDefault?.();
                            e.stopPropagation?.();
                            if (typeof notaTiklandi === 'function') {
                              notaTiklandi(oge, e);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault?.();
                            e.stopPropagation?.();
                            if (typeof barlineTiklandi === 'function') {
                              barlineTiklandi(oge, e, svgYerlesimHaritasi.get(oge.id));
                            }
                          }}
                          onKeyDown={(e) => {
                            if ((e.key === 'Enter' || e.key === ' ') && typeof notaTiklandi === 'function') {
                              e.preventDefault();
                              e.stopPropagation?.();
                              notaTiklandi(oge, e);
                            }
                          }}
                        >
                          {renderBarlineGlyph(oge, x, itemIndex, satir, satirOlculeri, satirSagX)}
                        </g>
                      ) : (
                        <>
                          <rect
                            x={x - 16}
                            y={76}
                            width={32}
                            height={44}
                            rx={8}
                            className="muzik-note-hover-rect"
                          />
                          <text x={x - 8} y="98" textAnchor="middle" className="muzik-symbol-text">{oge.gorunum || ''}</text>
                        </>
                      )}
                    </g>
                  );
                }
              })}

              {svgBaglar.map((bag) => {
                const { basId, sonId } = bagCizimBasSonAl(bag);
                const basIdx = svgGlobalIndexBul(basId);
                const sonIdx = svgGlobalIndexBul(sonId);

                if (basIdx < 0 || sonIdx < 0) return null;

                const basOge = svgCizilecekOgeler[basIdx];
                const sonOge = svgCizilecekOgeler[sonIdx];
                if (!basOge || !sonOge) return null;

                const basYer = svgYerlesimHaritasi.get(basOge.id);
                const sonYer = svgYerlesimHaritasi.get(sonOge.id);
                if (!basYer || !sonYer) return null;

                if (basYer.satirIdx !== satirIdx && sonYer.satirIdx !== satirIdx) {
                  return null;
                }

                const bagTieMi = bag?.tip === 'tie' || bagTipiTieMi(bag);
                const type = bagTieMi ? 'tie' : 'slur';
                const direction = bagYonunuHesapla(basOge, sonOge, mevcutAnahtar);
                const { start, end } = bagCizimNoktalari(
                  basOge,
                  sonOge,
                  basYer,
                  sonYer,
                  satirIdx,
                  ogeXHesapla,
                  mevcutAnahtar,
                  { visualClamp: true },
                );
                const hitRect = bagHitRectHesapla(start, end, direction);
                const bagHoverAktif =
                  bagIdEslesiyorMu(bag, hoverCizgiBagId) ||
                  bagIdEslesiyorMu(bag, hoverBrailleBagId);
                const bagSeciliAktif = bagIdEslesiyorMu(bag, seciliBagId);
                const bagAktif = bagHoverAktif || bagSeciliAktif;
                const bagGroupClasses = ['muzik-bag-grup', bagHoverAktif ? 'braille-hover' : '', bagSeciliAktif ? 'secili' : '']
                  .filter(Boolean)
                  .join(' ');
                const bagCurrentId = bagAktifId(bag);

                return (
                  <g
                    key={bag.id}
                    className={bagGroupClasses}
                    onMouseEnter={() => {
                      setHoverBrailleBagId?.(bagCurrentId);
                      setHoverCizgiBagId?.(bagCurrentId);
                      setHoverBrailleOgeId?.(null);
                    }}
                    onMouseLeave={() => {
                      setHoverBrailleBagId?.((prev) => (prev === bagCurrentId ? null : prev));
                      setHoverCizgiBagId?.((prev) => (prev === bagCurrentId ? null : prev));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSeciliBagId?.(bagCurrentId);
                      setSeciliOgeId?.(null);
                      setPopupAcik?.(false);
                    }}
                    role="button"
                    aria-label={`${bag.kayit?.ad || 'Bağ'} — seçmek için tıkla`}
                  >
                    <rect
                      x={hitRect.x}
                      y={hitRect.y}
                      width={hitRect.width}
                      height={hitRect.height}
                      rx={10}
                      fill="transparent"
                      stroke="transparent"
                      pointerEvents="all"
                      style={{ cursor: 'pointer' }}
                    />

                    <SlurTiePath
                      start={start}
                      end={end}
                      type={type}
                      direction={direction}
                      active={bagAktif}
                      selected={bagSeciliAktif}
                    />
                  </g>
                );
              })}
            </svg>

            <MuzikScoreBrailleOverlay
              satirIdx={satirIdx}
              satirOlcuBrailleleri={satirOlcuBrailleleri}
              baslangicBrailleBilgisi={baslangicBrailleBilgisi}
              ilkSatirHeaderBilgisi={ilkSatirHeaderBilgisi}
              gorunenSatirBrailleLejantMaplari={gorunenSatirBrailleLejantMaplari}
              gorunenSatirBrailleLejantlari={gorunenSatirBrailleLejantlari}
              setHoverBrailleOgeId={setHoverBrailleOgeId}
              hoverBrailleOgeId={hoverBrailleOgeId}
              setHoverBrailleBagId={setHoverBrailleBagId}
              hoverBrailleBagId={hoverBrailleBagId}
              hoverCizgiBagId={hoverCizgiBagId}
              setHoverCizgiBagId={setHoverCizgiBagId}
              hoverBrailleCellKey={hoverBrailleCellKey}
              setHoverBrailleCellKey={setHoverBrailleCellKey}
              seciliOgeId={seciliOgeId}
              setSeciliOgeId={setSeciliOgeId}
              seciliBagId={seciliBagId}
              setSeciliBagId={setSeciliBagId}
              brailleYShift={brailleYShift}
              playNote={playNote}
              notaOgesiAl={notaOgesiAl}
              keySignatureAccidentals={headerKeySignatureAccidentals}
            />
          </div>
        );
      })}
      <MuzikBarlineTimeSignatureModal
        barlineMenu={barlineMenu}
        setBarlineMenu={setBarlineMenu}
        inlineTimeSignatureEkle={inlineTimeSignatureEkle}
        inlineKeySignatureEkle={inlineKeySignatureEkle}
        olcuCizgisiniDegistir={olcuCizgisiniDegistir}
        olcuCizgisiniSil={olcuCizgisiniSil}
      />
    </div>
  );
}
