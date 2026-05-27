import React, { useMemo, useState } from 'react';
import BrailleHucreMini from './BrailleHucreMini.jsx';
import { BRAILLE_HUCRE_TEMA } from '../../utils/music-brf/musicConstants.js';
import { brailleLejantKeyAl } from '../../utils/music-brf/brailleMeasureHelpers.js';

export default function MuzikScoreHeaderBraille({
  skorUstuHeaderSatirlari,
  baslangicBrailleBilgisi,
  gorunenSatirBrailleLejantMaplari,
  gorunenSatirBrailleLejantlari,
  baslangicBrailleLejantlari,
  baslangicBrailleLejantMapi,
}) {
  const [acik, setAcik] = useState(false);
  const [hoverHeaderCellKey, setHoverHeaderCellKey] = useState(null);

  const headerLejantlari = Array.isArray(baslangicBrailleLejantlari)
    ? baslangicBrailleLejantlari
    : (gorunenSatirBrailleLejantlari?.[0] || []);
  const headerLejantMapi = baslangicBrailleLejantMapi || gorunenSatirBrailleLejantMaplari?.[0];

  const hasHeaderContent = useMemo(() => {
    return (
      Array.isArray(skorUstuHeaderSatirlari) && skorUstuHeaderSatirlari.length > 0
    ) || (baslangicBrailleBilgisi?.hucreOgeleri?.length > 0);
  }, [skorUstuHeaderSatirlari, baslangicBrailleBilgisi]);

  if (!hasHeaderContent) {
    return null;
  }

  return (
    <div className="w-full mb-2 rounded-l-lg rounded-tr-none rounded-br-none border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setAcik((v) => !v)}
        aria-expanded={acik}
        className="w-full min-h-[40px] px-4 py-3 flex items-center justify-between gap-3 text-left text-sm font-semibold text-slate-900 transition duration-150 hover:bg-slate-50"
      >
        <span>Başlangıç / Header Braille Bilgileri</span>
        <span
          aria-hidden="true"
          className="text-lg leading-none transition-transform duration-150"
          style={{
            transform: acik ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>

      {acik && (
        <div className="flex flex-col gap-4 p-4">
          {skorUstuHeaderSatirlari.map((satir, i) => {
            const etiketMap = {
              title: 'Başlık',
              composer: 'Besteci',
              tempo: 'Tempo',
              'key-signature': 'Donanım',
              'time-signature': 'Zaman',
            };

            const baslik = etiketMap[satir.kaynak] || 'Header';
            const aciklama = satir.etiket || '—';
            const hucreler = Array.isArray(satir.hucreler) ? satir.hucreler : [];

            const displayText = ['tempo', 'key-signature', 'time-signature'].includes(satir.kaynak)
              ? aciklama
              : `${baslik}: ${aciklama}`;

            return (
              <div key={`score-header-${i}`} className="flex flex-col gap-1">
                <div className="text-sm font-semibold text-slate-900">{displayText}</div>

                {hucreler.length > 0 && (
                  <div className="flex flex-wrap items-start gap-0">
                    {hucreler.map((hucre, idx) => {
                      const cellKey = `header:score:${i}:${idx}`;
                      return (
                        <BrailleHucreMini
                          key={`score-header-braille-${i}-${idx}`}
                          noktalar={hucre}
                          anlam={{
                            tip: satir.kaynak,
                            kaynak: satir.kaynak,
                            etiket: satir.etiket || baslik,
                            baslik,
                          }}
                          yerlesim={{
                            cfg: BRAILLE_HUCRE_TEMA.compact,
                            satirSayisi: 1,
                          }}
                          index={idx}
                          hoverAktif={hoverHeaderCellKey === cellKey}
                          onEnter={() => setHoverHeaderCellKey(cellKey)}
                          onLeave={() => setHoverHeaderCellKey(null)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {baslangicBrailleBilgisi?.hucreOgeleri?.length > 0 && (
            <div className="bg-slate-50 p-4">
              <div className="flex flex-wrap items-start gap-2">
                {(baslangicBrailleBilgisi.hucreOgeleri || []).map((item, idx) => {
                  const cellKey = `header:start:${idx}`;
                  return (
                    <BrailleHucreMini
                      key={`baslangic-braille-header-alt-${idx}`}
                      noktalar={item.hucre}
                      anlam={item.anlam}
                      renkStil={headerLejantMapi?.get(
                        brailleLejantKeyAl(item.anlam),
                      )?.stil}
                      yerlesim={{
                        cfg: BRAILLE_HUCRE_TEMA.compact,
                        satirSayisi: 1,
                      }}
                      index={idx}
                      hoverAktif={hoverHeaderCellKey === cellKey}
                      onEnter={() => setHoverHeaderCellKey(cellKey)}
                      onLeave={() => setHoverHeaderCellKey(null)}
                    />
                  );
                })}
              </div>

              {headerLejantlari.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {headerLejantlari.map((item) => (
                    <div
                      key={`baslangic-lejant-${item.key}`}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium text-slate-900"
                      style={{
                        backgroundColor: item.stil.soft || '#ffffff',
                        borderColor: item.stil.fill,
                      }}
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: item.stil.fill,
                        }}
                      />
                      <span>{item.etiket}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
