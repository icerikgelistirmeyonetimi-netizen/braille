import React, { useRef, useState, useLayoutEffect } from 'react';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import {
  brailleAnlamOgeIdAl,
  brailleAnlamBagIdAl,
  brailleKategoriAl,
  brailleLejantKeyAl,
} from '../../utils/music-brf/brailleMeasureHelpers.js';
import { SVG_NOTE_START_X, BRAILLE_HUCRE_TEMA } from '../../utils/music-brf/musicConstants.js';

const SKOR_BRAILLE_KOORDINAT_GENISLIK = 800;
// Bir hücrenin yaklaşık piksel adımı: cellW(24) + flex gap(4) + marginLeft(2)
const HUCRE_PIKSEL_ADIMI = (BRAILLE_HUCRE_TEMA?.normal?.cellW || 24) + 6;
// Ölçü kutusu temel genişliğini en fazla bu kadar hücre büyütebilir.
const MAKS_TASMA_HUCRE = 2;

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
  hoverTupletId,
  setHoverTupletId,
  seciliOgeId,
  setSeciliOgeId,
  seciliBagId,
  setSeciliBagId,
  brailleYShift = 18,
  playNote,
  notaOgesiAl,
  ogeAl,
  keySignatureAccidentals,
  setPopupAcik,
  hoverModifier,
  setHoverModifier,
  setModifierEditMenu,
  onBrailleDetayGoster,
}) {
  const satirKutuYuksekligi = 52;
  const satirMinYukseklik = satirKutuYuksekligi + 16;

  // Satır flex kapsayıcısının gerçek piksel genişliğini ölç → kapasite hesabı için.
  const rowRef = useRef(null);
  const [rowWidth, setRowWidth] = useState(0);
  // Hangi ölçünün "tamamını göster" popup'ı açık?
  const [acikOlcu, setAcikOlcu] = useState(null);

  useLayoutEffect(() => {
    const el = rowRef.current;
    if (!el) return undefined;
    const guncelle = () => setRowWidth(el.clientWidth);
    guncelle();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(guncelle);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Her ölçünün SVG x-koordinatından genişlik ve önceki boşluk hesapla
  const olcuLayoutlar = (() => {
    let prevEnd = 0;
    return satirOlcuBrailleleri.map((olcu) => {
      const sx = Number.isFinite(olcu?.startX) ? olcu.startX
        : Number.isFinite(olcu?.measureStartX) ? olcu.measureStartX : prevEnd;
      const ex = Number.isFinite(olcu?.endX) ? olcu.endX
        : Number.isFinite(olcu?.measureEndX) ? olcu.measureEndX
        : sx + Math.max(48, Number(olcu?.width) || 48);
      const kutuWidth = Math.max(48, ex - sx);
      const gapBefore = Math.max(0, sx - prevEnd);
      prevEnd = ex;
      return { kutuWidth, gapBefore };
    });
  })();

  const olcuCellsAl = (olcu) => (
    Array.isArray(olcu?.cells)
      ? olcu.cells
      : (olcu?.hucreler || []).map((hucre, i) => ({
        index: i,
        hucre,
        anlam: olcu?.anlamlar?.[i] || null,
      }))
  );

  // Ölçüde bar-repeat işareti varsa o ölçünün nota/sus/oktav hücreleri gizlenir.
  // (Tekrar işareti "önceki ölçüyle aynı" demek; nota hücrelerini tekrar göstermeye gerek yok.)
  const olcuRepeatMi = (olcu) => {
    const cells = olcuCellsAl(olcu);
    return cells.some((item) => brailleKategoriAl(item.anlam) === 'bar-repeat');
  };

  // Tek bir braille hücresini render eder (hem satır içi hem popup için ortak).
  // barline kategorisi gizli → null döner.
  const renderHucre = (item, i, olcu, olcuIdx) => {
    const hucre = item.hucre;
    const anlam = item.anlam;

    const key = brailleLejantKeyAl(anlam);
    const kategori = brailleKategoriAl(anlam);

    const notaGizle = olcuRepeatMi(olcu);
    if (
      kategori === 'barline' ||
      (notaGizle && (kategori === 'nota' || kategori === 'sus' || kategori === 'oktav'))
    ) return null;

    const lejantItem = kategori === 'nota'
      ? null
      : gorunenSatirBrailleLejantMaplari[satirIdx]?.get(key);
    const bagId = brailleAnlamBagIdAl(anlam);
    const tupletMu = kategori === 'tuplet';
    const tupletId = tupletMu ? (anlam?.tupletId || null) : null;
    const ogeId = bagId ? null : brailleAnlamOgeIdAl(anlam);
    const cellHoverKey = `overlay:${satirIdx}:${olcuIdx}:${item.index ?? i}`;

    const bagAktif = bagId && (
      bagId === hoverBrailleBagId || bagId === seciliBagId
    );
    // Tuplet hücresi ↔ skordaki bracket çapraz vurgusu (çift yönlü).
    const tupletAktif = tupletMu && tupletId && tupletId === hoverTupletId;
    // Dinamik/nüans/süsleme birden çok hücre olabilir (ör. "f" = söz işareti + f;
    // fermata = 2 hücre). Etiket/ikon SADECE grubun ilk hücresinde gösterilsin.
    let dinamikEtiketGizle = false;
    if (kategori === 'dynamic') {
      const cells = olcuCellsAl(olcu);
      const onceki = cells[i - 1];
      // Önceki hücre de dinamikse, bu hücre aynı dinamik grubunun devamıdır
      // → etiketi tekrarlama (yalnızca ilk hücrede göster).
      if (onceki && brailleKategoriAl(onceki.anlam) === 'dynamic') {
        dinamikEtiketGizle = true;
      }
    } else if (
      kategori === 'nuans-once' || kategori === 'nuans-sonra' || kategori === 'susleme'
      || String(anlam?.kaynak || '').startsWith('modifier-')
    ) {
      // Nüans/süsleme çok hücreli olabilir (fermata 2, sezür 2 hücre). Önceki hücre
      // aynı kategori + aynı etiket (modId varsa aynı modId) ise devam hücresidir.
      const cells = olcuCellsAl(olcu);
      const onceki = cells[i - 1];
      if (onceki
        && brailleKategoriAl(onceki.anlam) === kategori
        && String(onceki.anlam?.etiket || '') === String(anlam?.etiket || '')
        && (!anlam?.modId || !onceki.anlam?.modId || onceki.anlam.modId === anlam.modId)) {
        dinamikEtiketGizle = true;
      }
    }

    const cellTipi = kategori === 'accidental' ? 'accidental'
      : (anlam?.kaynak === 'dot') ? 'dot'
      : kategori === 'dynamic' ? 'dinamik'
      : (kategori === 'nuans-once' || kategori === 'nuans-sonra') ? 'nuans'
      : (kategori === 'susleme' || String(anlam?.kaynak || '').startsWith('modifier-')) ? 'susleme'
      : null;
    const modifierEslesti = !bagId && ogeId
      && hoverModifier?.ogeId === ogeId
      && hoverModifier?.type === cellTipi
      && ((cellTipi !== 'susleme' && cellTipi !== 'dinamik' && cellTipi !== 'nuans')
        || (hoverModifier?.modId
          ? hoverModifier.modId === anlam?.modId
          : String(hoverModifier?.etiket || '').toLowerCase() === String(anlam?.etiket || '').toLowerCase()));
    const ogeMainAktif = !bagId && ogeId
      && !hoverModifier
      && (ogeId === hoverBrailleOgeId || ogeId === seciliOgeId)
      && !cellTipi;
    const activeByCell = hoverBrailleCellKey === cellHoverKey;
    const aktif = bagAktif || modifierEslesti || ogeMainAktif || activeByCell || tupletAktif;
    const selectedByBag = bagId && seciliBagId === bagId;
    const selectedByOge = !bagId && ogeId && seciliOgeId === ogeId && !cellTipi;
    const notaHoverSesCalabilir = kategori === 'nota' && !bagId && ogeId;

    const handleEnter = () => {
      setHoverBrailleCellKey?.(cellHoverKey);
      if (tupletMu && tupletId) {
        // Tuplet hücresi → skordaki bracket'ı vurgula (çapraz bağ).
        setHoverTupletId?.(tupletId);
        setHoverBrailleOgeId?.(null);
        setHoverBrailleBagId?.(null);
        setHoverCizgiBagId?.(null);
        setHoverModifier?.(null);
        return;
      }
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
        if (kategori === 'accidental') {
          setHoverModifier?.({ ogeId, type: 'accidental' });
        } else if (anlam?.kaynak === 'dot') {
          setHoverModifier?.({ ogeId, type: 'dot' });
        } else if (cellTipi === 'susleme') {
          setHoverModifier?.({ ogeId, type: 'susleme', modId: anlam?.modId, etiket: anlam?.etiket });
        } else if (cellTipi === 'dinamik') {
          setHoverModifier?.({ ogeId, type: 'dinamik', modId: anlam?.modId, etiket: anlam?.etiket });
        } else if (cellTipi === 'nuans') {
          setHoverModifier?.({ ogeId, type: 'nuans', modId: anlam?.modId, etiket: anlam?.etiket });
        } else {
          setHoverModifier?.(null);
        }
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
      if (tupletMu && tupletId) {
        setHoverTupletId?.((prev) => (prev === tupletId ? null : prev));
        return;
      }
      if (bagId) {
        setHoverCizgiBagId?.((prev) => (prev === bagId ? null : prev));
        setHoverBrailleBagId?.((prev) => (prev === bagId ? null : prev));
        return;
      }
      if (ogeId) {
        setHoverBrailleOgeId?.((prev) => (prev === ogeId ? null : prev));
        setHoverModifier?.((prev) => (prev?.ogeId === ogeId ? null : prev));
      }
    };

    const handleClick = (e) => {
      if (bagId) {
        setSeciliBagId?.(bagId);
        setSeciliOgeId?.(null);
        onBrailleDetayGoster?.({ anlam, hucre, oge: null });
        return;
      }
      if (!ogeId) {
        if (anlam) onBrailleDetayGoster?.({ anlam, hucre, oge: null });
        return;
      }
      const ogeNesnesi = typeof ogeAl === 'function' ? ogeAl(ogeId) : null;
      // Süsleme hücresi: ana nota seçilmeden süsleme düzenleme menüsü açılır
      // (süsleme ile braille nota aynı anda seçili görünmemeli).
      if (cellTipi === 'susleme' || cellTipi === 'dinamik') {
        setSeciliOgeId?.(null);
        setSeciliBagId?.(null);
        setModifierEditMenu?.({
          x: e?.clientX ?? window.innerWidth / 2,
          y: e?.clientY ?? window.innerHeight / 2,
          ogeId, type: cellTipi, // 'susleme' veya 'dinamik'
          modId: anlam?.modId,
          yon: String(anlam?.kaynak || '').startsWith('modifier-sonrasi') ? 'sonrasi' : 'oncesi',
          ad: anlam?.etiket || '',
          etiket: anlam?.etiket || '',
        });
        onBrailleDetayGoster?.({ anlam, hucre, oge: ogeNesnesi });
        return;
      }
      setSeciliOgeId?.(ogeId);
      setSeciliBagId?.(null);
      if (kategori === 'accidental') {
        setModifierEditMenu?.({
          x: e?.clientX ?? window.innerWidth / 2,
          y: e?.clientY ?? window.innerHeight / 2,
          ogeId, type: 'accidental',
        });
        onBrailleDetayGoster?.({ anlam, hucre, oge: ogeNesnesi });
        return;
      }
      if (anlam?.kaynak === 'dot') {
        setModifierEditMenu?.({
          x: e?.clientX ?? window.innerWidth / 2,
          y: e?.clientY ?? window.innerHeight / 2,
          ogeId, type: 'dot',
        });
        onBrailleDetayGoster?.({ anlam, hucre, oge: ogeNesnesi });
        return;
      }
      onBrailleDetayGoster?.({ anlam, hucre, oge: ogeNesnesi });
    };

    const _noktaMetni = Array.isArray(hucre) && hucre.length ? ('nokta ' + hucre.join(' ')) : 'boşluk';
    return (
      <span
        key={`hucre-wrap-${satirIdx}-${olcu.index}-${item.index ?? i}`}
        data-oge-id={ogeId || undefined}
        data-braille-dots={Array.isArray(hucre) ? hucre.join('-') : ''}
        className="muzik-braille-hucre"
        tabIndex={ogeId ? -1 : undefined}
        aria-label={ogeId ? `Braille ${_noktaMetni}` : undefined}
        role={ogeId ? 'img' : undefined}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        style={{
          display: 'inline-flex',
          // Tüm hücreler tıklanabilir → her zaman el imleci.
          cursor: 'pointer',
          // Üst kapsayıcılar pointer-events:none; hücreler tekrar etkin.
          pointerEvents: 'auto',
        }}
      >
        <BrailleHucreMini
          noktalar={hucre}
          anlam={anlam}
          renkStil={lejantItem?.stil}
          yerlesim={null}
          hoverAktif={Boolean(aktif)}
          seciliAktif={Boolean(selectedByBag || selectedByOge)}
          solidHover={tupletMu}
          etiketGizle={dinamikEtiketGizle}
          index={i}
        />
      </span>
    );
  };

  return (
    <>
      {/*
        Dış div: marginTop ile SVG üstüne bindirme + normal belge akışı.
        İç flex satırı: her ölçü kutusu flex-shrink:0 + minWidth(% SVG genişliği).
        Hücreler taşarsa kutu EN FAZLA 2 hücre kadar büyür; daha fazlası varsa
        "…" butonu çıkar ve tamamı popup'ta gösterilir. Asla alt satıra geçmez,
        asla yeniden dağıtım yapmaz.
      */}
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
          // Boş alanlar SVG'deki B butonu vb. tıklamaları engellemesin;
          // yalnızca hücreler/butonlar pointer-events:auto ile etkin.
          pointerEvents: 'none',
        }}
      >
        <div
          ref={rowRef}
          style={{
            display: 'flex',
            flexWrap: 'nowrap',
            alignItems: 'flex-start',
            width: '100%',
            pointerEvents: 'none',
          }}
        >
          {satirOlcuBrailleleri.map((olcu, olcuIdx) => {
            const olcuCells = olcuCellsAl(olcu);
            const { kutuWidth, gapBefore } = olcuLayoutlar[olcuIdx];

            const kutuWidthPct = (kutuWidth / SKOR_BRAILLE_KOORDINAT_GENISLIK) * 100;
            const gapPct = (gapBefore / SKOR_BRAILLE_KOORDINAT_GENISLIK) * 100;

            // BOŞ ÖLÇÜ (tekrar nedeniyle braille'i kalmayan kopya ölçü): hücre yok AMA staff'ta çizili.
            // null DÖNME — yoksa genişliği kaybolur ve sonraki ölçülerin braille'i sola kayıp staff ile
            // HİZASIZ kalır (kullanıcı: "kendi ölçüsü altında olsun"). Genişliği koruyan BOŞ spacer bırak.
            if (olcuCells.length <= 0) {
              return (
                <div
                  key={`olcu-braille-bos-${satirIdx}-${olcu.index}`}
                  aria-hidden="true"
                  style={{
                    position: 'static',
                    flex: '0 0 auto',
                    minWidth: `${kutuWidthPct}%`,
                    marginLeft: gapPct > 0 ? `${gapPct}%` : 0,
                    padding: 0,
                    pointerEvents: 'none',
                  }}
                />
              );
            }

            // Görünür hücre node'ları (barline'lar elenir).
            const tumNodes = olcuCells
              .map((item, i) => renderHucre(item, i, olcu, olcuIdx))
              .filter(Boolean);

            // Temel kutu genişliği px → kaç hücre sığar? (+2 tolerans)
            const baseWidthPx = (kutuWidthPct / 100) * rowWidth;
            const kapasite = rowWidth > 0
              ? Math.max(1, Math.floor(baseWidthPx / HUCRE_PIKSEL_ADIMI))
              : Infinity; // ölçülene kadar hepsini göster (titreşimi önler)
            const maksGoster = kapasite + MAKS_TASMA_HUCRE;
            const tasiyor = tumNodes.length > maksGoster;
            // Taşıyorsa "…" butonuna 1 slot ayır.
            const gorunenNodes = tasiyor
              ? tumNodes.slice(0, Math.max(1, maksGoster - 1))
              : tumNodes;

            return (
              <div
                key={`olcu-braille-${satirIdx}-${olcu.index}`}
                style={{
                  // .muzik-olcu-braille-kutu CSS sınıfı `position:absolute` taşıdığı için
                  // KULLANMIYORUZ; aksi halde kutular left:0'da üst üste binerdi.
                  position: 'static',
                  flex: '0 0 auto',
                  minWidth: `${kutuWidthPct}%`,
                  marginLeft: gapPct > 0 ? `${gapPct}%` : 0,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 0,
                  overflow: 'visible',
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                <div
                  className="muzik-olcu-braille-hucreler"
                  style={{
                    display: 'inline-flex',
                    flexWrap: 'nowrap',
                    alignItems: 'flex-start',
                    gap: 4,
                    pointerEvents: 'none',
                  }}
                >
                  {gorunenNodes}
                  {tasiyor && (
                    <button
                      type="button"
                      className="muzik-tum-hucre-btn"
                      title={`Tüm hücreleri göster (${tumNodes.length})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setAcikOlcu({ olcuIdx, olcu, olcuCells });
                      }}
                      style={{
                        alignSelf: 'flex-start',
                        marginTop: 2,
                        height: 32,
                        minWidth: 28,
                        padding: '0 6px',
                        border: '1px dashed #94a3b8',
                        borderRadius: 6,
                        background: '#f1f5f9',
                        color: '#475569',
                        fontWeight: 700,
                        fontSize: 14,
                        lineHeight: 1,
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                      }}
                    >
                      …
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="muzik-braille-lejant"
        style={{ position: 'relative', zIndex: 2, marginTop: 8 }}
      >
        {(gorunenSatirBrailleLejantlari[satirIdx] || [])
          .filter(item => !String(item.key || '').startsWith('barline:'))
          .map((item) => (
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
                style={{ backgroundColor: item.stil.fill }}
              />
              <span className="muzik-braille-lejant-metin">{item.etiket}</span>
            </div>
          ))}
      </div>

      {/* Tüm hücreleri gösteren popup */}
      {acikOlcu && (
        <div
          role="presentation"
          onClick={() => setAcikOlcu(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ölçü Braille hücreleri"
            className="muzik-tum-hucre-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: 14,
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.35)',
              maxWidth: 'min(720px, 92vw)',
              maxHeight: '80vh',
              overflow: 'auto',
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
                gap: 12,
              }}
            >
              <span className="muzik-tum-hucre-modal-baslik" style={{ fontWeight: 700, color: '#1f2937' }}>
                Ölçü {acikOlcu.olcuIdx + 1} — tüm braille hücreleri
              </span>
              <button
                type="button"
                className="muzik-tum-hucre-kapat"
                onClick={() => setAcikOlcu(null)}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 600,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                Kapat
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                gap: 4,
              }}
            >
              {acikOlcu.olcuCells
                .map((item, i) => renderHucre(item, i, acikOlcu.olcu, acikOlcu.olcuIdx))
                .filter(Boolean)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
