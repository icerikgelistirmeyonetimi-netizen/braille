import React from 'react';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import {
  brailleAnlamOgeIdAl,
  brailleAnlamBagIdAl,
  brailleKategoriAl,
  brailleLejantKeyAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import { SVG_NOTE_START_X } from '../../utils/music-brf/musicConstants.js';

const SKOR_BRAILLE_KOORDINAT_GENISLIK = 800;

export default function MuzikScoreBrailleOverlay({
  satirIdx,
  satirOlcuBrailleleri,
  gorunenSatirBrailleLejantMaplari,
  gorunenSatirBrailleLejantlari = [],
  setHoverBrailleOgeId,
  hoverBrailleOgeId,
  setHoverBrailleBagId,
  hoverBrailleBagId,
  hoverCizgiBagId,
  setHoverCizgiBagId,
  hoverBrailleCellKey,
  setHoverBrailleCellKey,
  seciliOgeId,
  setSeciliOgeId,
  seciliBagId,
  setSeciliBagId,
  brailleYShift = 18,
  playNote,
  notaOgesiAl,
  keySignatureAccidentals,
}) {
  const satirKutuYuksekligi = 52;

  const satirMinYukseklik = satirKutuYuksekligi + 16;

  return (
    <>
      <div
        className="muzik-olcu-braille-satiri"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: `${satirMinYukseklik}px`,
          marginTop: `-${brailleYShift}px`,
          marginBottom: 8,
          overflow: 'visible',
          boxSizing: 'border-box',
        }}
      >
        {satirOlcuBrailleleri.map((olcu, olcuIdx) => {
          const olcuCells = Array.isArray(olcu?.cells)
            ? olcu.cells
            : (olcu?.hucreler || []).map((hucre, i) => ({
              index: i,
              hucre,
              anlam: olcu?.anlamlar?.[i] || null,
            }));

          const olcuHucreSayisi = olcuCells.length;

          const startX = Number.isFinite(olcu?.startX)
            ? olcu.startX
            : (Number.isFinite(olcu?.measureStartX) ? olcu.measureStartX : SVG_NOTE_START_X);
          const endX = Number.isFinite(olcu?.endX)
            ? olcu.endX
            : (Number.isFinite(olcu?.measureEndX)
              ? olcu.measureEndX
              : startX + Math.max(48, Number(olcu?.width) || 48));

          const kutuSolX = startX;
          const kutuWidth = Math.max(48, endX - startX);

          if (olcuHucreSayisi <= 0) {
            return null;
          }

          return (
            <div
              key={`olcu-braille-${satirIdx}-${olcu.index}`}
              className="muzik-olcu-braille-kutu"
              style={{
                position: 'absolute',
                top: 0,
                left: `${(kutuSolX / SKOR_BRAILLE_KOORDINAT_GENISLIK) * 100}%`,
                width: `${(kutuWidth / SKOR_BRAILLE_KOORDINAT_GENISLIK) * 100}%`,
                minHeight: `${satirKutuYuksekligi}px`,
                padding: 0,
                borderRadius: 0,
                background: 'transparent',
                border: 'none',
                boxSizing: 'border-box',
                overflow: 'visible',
              }}
            >
              <div
                className="muzik-olcu-braille-hucreler"
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                  alignContent: 'flex-start',
                  justifyContent: 'flex-start',
                  gap: 4,
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                }}
              >
                {olcuCells.map((item, i) => {
                  const hucre = item.hucre;
                  const anlam = item.anlam;

                  const key = brailleLejantKeyAl(anlam);
                  const kategori = brailleKategoriAl(anlam);
                  const lejantItem = kategori === 'nota'
                    ? null
                    : gorunenSatirBrailleLejantMaplari[satirIdx]?.get(key);
                  const bagId = brailleAnlamBagIdAl(anlam);
                  const ogeId = bagId ? null : brailleAnlamOgeIdAl(anlam);
                  const cellHoverKey = `overlay:${satirIdx}:${olcuIdx}:${item.index ?? i}`;
                  const bagAktif = bagId && (
                    bagId === hoverBrailleBagId ||
                    bagId === seciliBagId
                  );
                  const ogeAktif = !bagId && ogeId && (
                    ogeId === hoverBrailleOgeId ||
                    ogeId === seciliOgeId
                  );
                  const activeByCell = hoverBrailleCellKey === cellHoverKey;
                  const aktif = bagAktif || ogeAktif || activeByCell;
                  const selectedByBag = bagId && seciliBagId === bagId;
                  const selectedByOge = !bagId && ogeId && seciliOgeId === ogeId;

                  const notaHoverSesCalabilir = kategori === 'nota' && !bagId && ogeId;

                  const handleEnter = () => {
                    setHoverBrailleCellKey?.(cellHoverKey);

                    if (bagId) {
                      setHoverCizgiBagId?.(bagId);
                      setHoverBrailleBagId?.(bagId);
                      setHoverBrailleOgeId?.(null);
                      return;
                    }

                    if (ogeId) {
                      setHoverBrailleOgeId?.(ogeId);
                      setHoverBrailleBagId?.(null);
                      setHoverCizgiBagId?.(null);

                      if (notaHoverSesCalabilir && typeof notaOgesiAl === 'function') {
                        const notaOgesi = notaOgesiAl(ogeId);
                        if (notaOgesi && typeof playNote === 'function') {
                          playNote(notaOgesi, { keySignatureAccidentals });
                        }
                      }
                    }
                  };

                  const handleLeave = () => {
                    setHoverBrailleCellKey?.(null);

                    if (bagId) {
                      setHoverCizgiBagId?.((prev) => (prev === bagId ? null : prev));
                      setHoverBrailleBagId?.((prev) => (prev === bagId ? null : prev));
                      return;
                    }

                    if (ogeId) {
                      setHoverBrailleOgeId?.((prev) => (prev === ogeId ? null : prev));
                    }
                  };

                  const handleClick = () => {
                    if (bagId) {
                      setSeciliBagId?.(bagId);
                      setSeciliOgeId?.(null);
                    } else if (ogeId) {
                      setSeciliOgeId?.(ogeId);
                      setSeciliBagId?.(null);
                    }
                  };

                  return (
                    <span
                      key={`hucre-wrap-${satirIdx}-${olcu.index}-${item.index ?? i}`}
                      onMouseEnter={handleEnter}
                      onMouseLeave={handleLeave}
                      onClick={handleClick}
                      style={{
                        display: 'inline-flex',
                        cursor: bagId || ogeId ? 'pointer' : 'default',
                      }}
                    >
                      <BrailleHucreMini
                        noktalar={hucre}
                        anlam={anlam}
                        renkStil={lejantItem?.stil}
                        yerlesim={null}
                        hoverAktif={Boolean(aktif)}
                        seciliAktif={Boolean(selectedByBag || selectedByOge)}
                        index={i}
                      />
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="muzik-braille-lejant"
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 8,
        }}
      >
        {(gorunenSatirBrailleLejantlari[satirIdx] || []).map((item) => (
          <div
            key={`lejant-${satirIdx}-${item.key}`}
            className="muzik-braille-lejant-item"
            style={{
              backgroundColor: item.stil.soft || '#ffffff',
              borderColor: item.stil.fill,
              color: '#1f2937',
            }}
          >
            <span
              className="muzik-braille-lejant-renk"
              style={{
                backgroundColor: item.stil.fill,
              }}
            />
            <span className="muzik-braille-lejant-metin">
              {item.etiket}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
