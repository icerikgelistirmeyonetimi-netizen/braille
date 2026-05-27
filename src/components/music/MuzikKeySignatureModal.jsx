import React from 'react';
import { MUZIK_EDITOR_ANAHTARLAR } from '../../utils/music-brf/musicConstants.js';

export default function MuzikKeySignatureModal({ anahtarPopupAcik, setAnahtarPopupAcik, muzikOgeleri, anahtariDegistir }) {
  if (!anahtarPopupAcik) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" role="presentation" onClick={() => setAnahtarPopupAcik(false)}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 p-5 flex flex-col gap-3" role="dialog" aria-modal="true" aria-label="Anahtar seç" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <span className="text-base font-semibold text-slate-800">Anahtar seç</span>
          <button type="button" className="w-8 h-8 rounded-md text-slate-500 hover:bg-slate-100" onClick={() => setAnahtarPopupAcik(false)} aria-label="Kapat">×</button>
        </div>
        <div className="flex flex-col gap-2" aria-label="Anahtar">
          {MUZIK_EDITOR_ANAHTARLAR.map((a) => {
            const aktifAnahtar = muzikOgeleri.find((o) => o.tip === 'anahtar');
            const aktifMi = aktifAnahtar?.ad === a.ad;
            return (
              <button key={a.ad} type="button"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${aktifMi ? 'bg-slate-800 border-slate-800 text-white shadow' : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-400'}`}
                onClick={() => anahtariDegistir(a)}
                title={a.ad}>
                <span className="text-3xl" style={{ fontFamily: "'Cambria Math', 'Bravura Text', 'Noto Music', 'Segoe UI Symbol', serif" }}>{a.sembol}</span>
                <span className="text-base">{a.ad}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
